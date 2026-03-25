import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DataSource, LessThan, Repository, In } from 'typeorm';
import { StateTransitionService } from '../common/services/state-transition.service';
import { SolicitudEntity, AuditoriaEntity } from '../database/entities';
import { ActorTipo, EstadoSolicitud } from '../database/enums';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);
    private readonly solicitudesRepository: Repository<SolicitudEntity>;
    private readonly auditoriaRepository: Repository<AuditoriaEntity>;
    private readonly diasPendientePago: number;
    private readonly diasCertificado: number;
    private readonly aniosAnonimizacion: number;

    constructor(
        dataSource: DataSource,
        private readonly configService: ConfigService,
        private readonly stateTransition: StateTransitionService,
    ) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
        this.auditoriaRepository = dataSource.getRepository(AuditoriaEntity);
        this.diasPendientePago = this.configService.get<number>(
            'CRON_DIAS_PENDIENTE_PAGO',
            60,
        );
        this.aniosAnonimizacion = this.configService.get<number>(
            'CRON_ANIOS_ANONIMIZACION',
            5,
        );
        this.diasCertificado = this.configService.get<number>(
            'CRON_DIAS_CERTIFICADO',
            90,
        );
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async vencerSolicitudesPendientes() {
        this.logger.log('Cron: verificando vencimiento de solicitudes');

        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - this.diasPendientePago);

        const solicitudes = await this.solicitudesRepository.find({
            where: {
                estado: EstadoSolicitud.PENDIENTE_PAGO,
                createdAt: LessThan(fechaLimite),
            },
            select: { id: true, codigo: true },
        });

        let afectadas = 0;
        for (const solicitud of solicitudes) {
            try {
                await this.stateTransition.cambiarEstado({
                    solicitudId: solicitud.id,
                    nuevoEstado: EstadoSolicitud.VENCIDO,
                    actorTipo: ActorTipo.CRON,
                    observaciones: `Vencimiento automatico: ${this.diasPendientePago} dias sin pago`,
                });
                afectadas++;
            } catch (error) {
                this.logger.error(`Error al vencer solicitud ${solicitud.codigo}: ${error}`);
            }
        }

        this.logger.log(
            `Cron vencimiento solicitudes: ${afectadas}/${solicitudes.length} procesadas`,
        );
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async vencerCertificadosEmitidos() {
        this.logger.log('Cron: verificando vencimiento de certificados');

        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - this.diasCertificado);

        const solicitudes = await this.solicitudesRepository.find({
            where: {
                estado: EstadoSolicitud.EMITIDA,
                issuedAt: LessThan(fechaLimite),
            },
            select: { id: true, codigo: true },
        });

        let afectadas = 0;
        for (const solicitud of solicitudes) {
            try {
                await this.stateTransition.cambiarEstado({
                    solicitudId: solicitud.id,
                    nuevoEstado: EstadoSolicitud.PUBLICADO_VENCIDO,
                    actorTipo: ActorTipo.CRON,
                    observaciones: `Vencimiento automatico: ${this.diasCertificado} dias desde emision`,
                });
                afectadas++;
            } catch (error) {
                this.logger.error(`Error al vencer certificado ${solicitud.codigo}: ${error}`);
            }
        }

        this.logger.log(
            `Cron vencimiento certificados: ${afectadas}/${solicitudes.length} procesadas`,
        );
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async anonimizarRegistrosAntiguos() {
        this.logger.log('Cron: verificando solicitudes antiguas para anonimización (Ley de Privacidad)');

        const fechaLimite = new Date();
        fechaLimite.setFullYear(fechaLimite.getFullYear() - this.aniosAnonimizacion);

        const solicitudes = await this.solicitudesRepository.find({
            where: {
                estado: In([EstadoSolicitud.VENCIDO, EstadoSolicitud.PUBLICADO_VENCIDO, EstadoSolicitud.RECHAZADA]),
                updatedAt: LessThan(fechaLimite),
            },
            select: { id: true, codigo: true },
        });

        if (solicitudes.length === 0) {
            this.logger.log('Cron anonimización: No hay solicitudes para procesar.');
            return;
        }

        let afectadas = 0;
        for (const solicitud of solicitudes) {
            try {
                // Borrar logs de auditoría para no dejar rastros de las personas ni metadatos sensibles
                await this.auditoriaRepository.delete({ solicitudId: solicitud.id });

                // Scrub / Anonimizar datos de la solicitud
                await this.solicitudesRepository.update(solicitud.id, {
                    nombreCompleto: 'ANONIMIZADO_LPD',
                    email: 'anonimizado@rdam.local',
                    dniEncriptado: 'ANONIMIZADO',
                    cuilEncriptado: 'ANONIMIZADO',
                });
                
                afectadas++;
            } catch (error) {
                this.logger.error(`Error al anonimizar solicitud ${solicitud.codigo}: ${error}`);
            }
        }

        this.logger.log(
            `Cron anonimización completado: ${afectadas}/${solicitudes.length} solicitudes anonimizadas`,
        );
    }
}
