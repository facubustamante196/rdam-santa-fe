import {
    BadRequestException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { StateTransitionService } from '../common/services/state-transition.service';
import { EmailService } from '../email/email.service';
import { SolicitudEntity, TransaccionPagoEntity } from '../database/entities';
import { ActorTipo, EstadoPago, EstadoSolicitud } from '../database/enums';

export interface WebhookPagoPayload {
    evento: 'PAGO_CONFIRMADO' | 'PAGO_FALLIDO';
    referencia_interna: string;
    referencia_pasarela: string;
    monto: number;
    metodo: string;
    timestamp: string;
}

export interface PlusPagosWebhookPayload {
    Tipo: string;
    TransaccionPlataformaId: string;
    TransaccionComercioId: string;
    Monto: string;
    EstadoId: string;
    Estado: string;
    FechaProcesamiento: string;
}

export type IncomingWebhookPagoPayload =
    | WebhookPagoPayload
    | PlusPagosWebhookPayload;

interface NormalizedWebhookPayload {
    evento: 'PAGO_CONFIRMADO' | 'PAGO_FALLIDO';
    referenciaInterna: string;
    referenciaPasarela: string;
    monto: number;
    metodo: string;
    timestamp: Date;
    rawPayload: Record<string, unknown>;
}

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);
    private readonly solicitudesRepository: Repository<SolicitudEntity>;
    private readonly transaccionesRepository: Repository<TransaccionPagoEntity>;
    private readonly webhookSecret: string;

    constructor(
        dataSource: DataSource,
        private readonly configService: ConfigService,
        private readonly stateTransition: StateTransitionService,
        private readonly emailService: EmailService,
    ) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
        this.transaccionesRepository = dataSource.getRepository(TransaccionPagoEntity);
        this.webhookSecret = this.configService.get<string>('PASARELA_WEBHOOK_SECRET', '');
    }

    validarFirma(body: string, signature: string): boolean {
        if (!this.webhookSecret) {
            this.logger.warn('PASARELA_WEBHOOK_SECRET no configurado');
            return false;
        }

        const expectedSignature = createHmac('sha256', this.webhookSecret)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    }

    async procesarWebhook(payload: IncomingWebhookPagoPayload, ipOrigen?: string) {
        const normalized = this.normalizePayload(payload);

        const solicitud = await this.solicitudesRepository.findOne({
            where: { codigo: normalized.referenciaInterna },
        });

        if (!solicitud) {
            throw new BadRequestException(
                `Solicitud no encontrada: ${normalized.referenciaInterna}`,
            );
        }

        const estadosTerminales: EstadoSolicitud[] = [
            EstadoSolicitud.PAGADA,
            EstadoSolicitud.RECHAZADA,
            EstadoSolicitud.EMITIDA,
            EstadoSolicitud.PUBLICADO_VENCIDO,
        ];

        if (estadosTerminales.includes(solicitud.estado)) {
            this.logger.log(
                `Webhook ignorado (idempotente): ${normalized.referenciaInterna} en estado ${solicitud.estado}`,
            );
            return {
                message: 'Webhook procesado (sin cambios - idempotente)',
                estado: solicitud.estado,
            };
        }

        const nuevoEstado =
            normalized.evento === 'PAGO_CONFIRMADO'
                ? EstadoSolicitud.PAGADA
                : EstadoSolicitud.RECHAZADA;

        await this.stateTransition.cambiarEstado({
            solicitudId: solicitud.id,
            nuevoEstado,
            actorTipo: ActorTipo.WEBHOOK,
            observaciones: `Evento: ${normalized.evento} | Ref: ${normalized.referenciaPasarela}`,
            ipOrigen,
        });

        const estadoPago =
            normalized.evento === 'PAGO_CONFIRMADO'
                ? EstadoPago.CONFIRMADO
                : EstadoPago.FALLIDO;

        const transaccionExistente = await this.transaccionesRepository.findOne({
            where: { solicitudId: solicitud.id },
            order: { createdAt: 'DESC' },
        });

        if (transaccionExistente) {
            transaccionExistente.monto = normalized.monto.toFixed(2);
            transaccionExistente.estado = estadoPago;
            transaccionExistente.referenciaPasarela = normalized.referenciaPasarela;
            transaccionExistente.metodoPago = normalized.metodo;
            transaccionExistente.payloadPasarela = normalized.rawPayload;
            transaccionExistente.fechaPago =
                normalized.evento === 'PAGO_CONFIRMADO' ? normalized.timestamp : null;
            await this.transaccionesRepository.save(transaccionExistente);
        } else {
            const transaccionNueva = this.transaccionesRepository.create({
                solicitudId: solicitud.id,
                monto: normalized.monto.toFixed(2),
                estado: estadoPago,
                referenciaPasarela: normalized.referenciaPasarela,
                metodoPago: normalized.metodo,
                payloadPasarela: normalized.rawPayload,
                fechaPago:
                    normalized.evento === 'PAGO_CONFIRMADO'
                        ? normalized.timestamp
                        : null,
            });
            await this.transaccionesRepository.save(transaccionNueva);
        }

        if (nuevoEstado === EstadoSolicitud.PAGADA) {
            await this.emailService.enviarConfirmacionPago(
                solicitud.email,
                solicitud.codigo,
            );
        } else {
            await this.emailService.enviarPagoRechazado(
                solicitud.email,
                solicitud.codigo,
            );
        }

        this.logger.log(
            `Webhook procesado: ${normalized.referenciaInterna} -> ${nuevoEstado}`,
        );

        return {
            message: 'Webhook procesado exitosamente',
            estado: nuevoEstado,
        };
    }

    private normalizePayload(
        payload: IncomingWebhookPagoPayload,
    ): NormalizedWebhookPayload {
        if ('evento' in payload) {
            const monto = Number(payload.monto);
            if (!Number.isFinite(monto)) {
                throw new BadRequestException('Monto invalido en webhook');
            }

            const timestamp = payload.timestamp
                ? new Date(payload.timestamp)
                : new Date();

            return {
                evento: payload.evento,
                referenciaInterna: payload.referencia_interna,
                referenciaPasarela: payload.referencia_pasarela,
                monto,
                metodo: payload.metodo || 'PASARELA',
                timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
                rawPayload: payload as unknown as Record<string, unknown>,
            };
        }

        const estadoNormalizado = (payload.Estado || '').toUpperCase();
        const evento =
            estadoNormalizado === 'REALIZADA' || payload.EstadoId === '3'
                ? 'PAGO_CONFIRMADO'
                : 'PAGO_FALLIDO';

        const monto = Number(payload.Monto);
        if (!Number.isFinite(monto)) {
            throw new BadRequestException('Monto invalido en webhook');
        }

        const timestamp = payload.FechaProcesamiento
            ? new Date(payload.FechaProcesamiento)
            : new Date();

        return {
            evento,
            referenciaInterna: payload.TransaccionComercioId,
            referenciaPasarela: payload.TransaccionPlataformaId,
            monto,
            metodo: 'PLUSPAGOS',
            timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
            rawPayload: payload as unknown as Record<string, unknown>,
        };
    }
}
