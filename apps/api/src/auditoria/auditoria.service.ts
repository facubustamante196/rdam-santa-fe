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
}
