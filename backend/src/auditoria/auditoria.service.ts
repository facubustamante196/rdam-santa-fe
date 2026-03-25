import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaEntity } from '../database/entities';
import { ActorTipo } from '../database/enums';

export interface CrearAuditoriaDto {
    solicitudId?: string;
    usuarioId?: string;
    accion: string;
    estadoAnterior?: string;
    estadoNuevo?: string;
    observaciones?: string;
    actorTipo: ActorTipo;
    ipOrigen?: string;
    forzadoSupervisor?: boolean;
}

@Injectable()
export class AuditoriaService {
    constructor(
        @InjectRepository(AuditoriaEntity)
        private readonly auditoriaRepository: Repository<AuditoriaEntity>,
    ) { }

    async registrar(data: CrearAuditoriaDto) {
        const registro = this.auditoriaRepository.create({
            solicitudId: data.solicitudId,
            usuarioId: data.usuarioId,
            accion: data.accion,
            estadoAnterior: data.estadoAnterior,
            estadoNuevo: data.estadoNuevo,
            observaciones: data.observaciones,
            actorTipo: data.actorTipo,
            ipOrigen: data.ipOrigen,
            forzadoSupervisor: data.forzadoSupervisor ?? false,
        });

        return this.auditoriaRepository.save(registro);
    }

    async obtenerPorSolicitud(solicitudId: string) {
        return this.auditoriaRepository.find({
            where: { solicitudId },
            order: { timestamp: 'DESC' },
            relations: ['usuario'],
        });
    }

    async listar(params: {
        solicitudId?: string;
        usuarioId?: string;
        accion?: string;
        desde?: string;
        hasta?: string;
        limit?: number;
        offset?: number;
    }) {
        const qb = this.auditoriaRepository.createQueryBuilder('a')
            .leftJoinAndSelect('a.usuario', 'usuario')
            .where('a.actorTipo IN (:...tipos)', { 
                tipos: [ActorTipo.OPERARIO, ActorTipo.SUPERVISOR] 
            })
            .orderBy('a.timestamp', 'DESC');

        if (params.solicitudId) {
            qb.andWhere('a.solicitudId = :solicitudId', { solicitudId: params.solicitudId });
        }
        if (params.usuarioId) {
            qb.andWhere('a.usuarioId = :usuarioId', { usuarioId: params.usuarioId });
        }
        if (params.accion) {
            qb.andWhere('a.accion = :accion', { accion: params.accion });
        }
        if (params.desde) {
            qb.andWhere('a.timestamp >= :desde', { desde: params.desde });
        }
        if (params.hasta) {
            qb.andWhere('a.timestamp <= :hasta', { hasta: params.hasta });
        }

        const limit = params.limit || 50;
        const offset = params.offset || 0;

        const [logs, total] = await qb
            .take(limit)
            .skip(offset)
            .getManyAndCount();

        return {
            logs: logs.map(log => ({
                id: log.id,
                usuario: log.usuario?.username || 'sistema',
                accion: log.accion,
                solicitud_id: log.solicitudId,
                detalle: log.observaciones || log.estadoNuevo ? `${log.estadoAnterior || ''} → ${log.estadoNuevo || ''}` : '',
                fecha: log.timestamp.toISOString(),
            })),
            total,
        };
    }
}
