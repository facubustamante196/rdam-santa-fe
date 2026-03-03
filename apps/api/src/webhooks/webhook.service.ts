import {
    BadRequestException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { StateTransitionService } from '../common/services/state-transition.service';
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

    async procesarWebhook(payload: WebhookPagoPayload, ipOrigen?: string) {
        const solicitud = await this.solicitudesRepository.findOne({
            where: { codigo: payload.referencia_interna },
        });

        if (!solicitud) {
            throw new BadRequestException(
                `Solicitud no encontrada: ${payload.referencia_interna}`,
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
                `Webhook ignorado (idempotente): ${payload.referencia_interna} en estado ${solicitud.estado}`,
            );
            return {
                message: 'Webhook procesado (sin cambios - idempotente)',
                estado: solicitud.estado,
            };
        }

        const nuevoEstado =
            payload.evento === 'PAGO_CONFIRMADO'
                ? EstadoSolicitud.PAGADA
                : EstadoSolicitud.RECHAZADA;

        await this.stateTransition.cambiarEstado({
            solicitudId: solicitud.id,
            nuevoEstado,
            actorTipo: ActorTipo.WEBHOOK,
            observaciones: `Evento: ${payload.evento} | Ref: ${payload.referencia_pasarela}`,
            ipOrigen,
        });

        const transaccion = this.transaccionesRepository.create({
            solicitudId: solicitud.id,
            monto: payload.monto.toFixed(2),
            estado:
                payload.evento === 'PAGO_CONFIRMADO'
                    ? EstadoPago.CONFIRMADO
                    : EstadoPago.FALLIDO,
            referenciaPasarela: payload.referencia_pasarela,
            metodoPago: payload.metodo,
            payloadPasarela: payload as unknown as Record<string, unknown>,
            fechaPago: payload.evento === 'PAGO_CONFIRMADO' ? new Date() : null,
        });

        await this.transaccionesRepository.save(transaccion);

        this.logger.log(`Webhook procesado: ${payload.referencia_interna} -> ${nuevoEstado}`);

        return {
            message: 'Webhook procesado exitosamente',
            estado: nuevoEstado,
        };
    }
}
