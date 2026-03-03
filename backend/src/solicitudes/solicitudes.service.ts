import { Injectable } from '@nestjs/common';
import { DataSource, Like, Repository } from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { SolicitudEntity } from '../database/entities';
import { ActorTipo, EstadoSolicitud } from '../database/enums';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';

@Injectable()
export class SolicitudesService {
    private readonly solicitudesRepository: Repository<SolicitudEntity>;

    constructor(
        dataSource: DataSource,
        private readonly encryptionService: EncryptionService,
        private readonly auditoriaService: AuditoriaService,
    ) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
    }

    async crear(
        dto: CrearSolicitudDto,
        dniHash: string,
        dniEncriptado: string,
        _email: string,
        ipOrigen?: string,
    ) {
        const codigo = await this.generarCodigo();
        const cuilEncriptado = this.encryptionService.encrypt(dto.cuil);

        const solicitud = this.solicitudesRepository.create({
            codigo,
            dniEncriptado,
            cuilEncriptado,
            dniHash,
            nombreCompleto: dto.nombre_completo,
            fechaNacimiento: dto.fecha_nacimiento,
            email: dto.email,
            circunscripcion: dto.circunscripcion,
            estado: EstadoSolicitud.PENDIENTE_PAGO,
        });

        const saved = await this.solicitudesRepository.save(solicitud);

        await this.auditoriaService.registrar({
            solicitudId: saved.id,
            accion: 'SOLICITUD_CREADA',
            estadoNuevo: EstadoSolicitud.PENDIENTE_PAGO,
            actorTipo: ActorTipo.CIUDADANO,
            ipOrigen,
        });

        return {
            id: saved.id,
            codigo: saved.codigo,
            estado: saved.estado,
            message: 'Solicitud creada exitosamente. Proceda al pago.',
        };
    }

    private async generarCodigo(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `RDAM-${year}-`;

        const ultima = await this.solicitudesRepository.findOne({
            where: { codigo: Like(`${prefix}%`) },
            order: { codigo: 'DESC' },
            select: { codigo: true },
        });

        let secuencia = 1;
        if (ultima?.codigo) {
            const partes = ultima.codigo.split('-');
            const ultimoNumero = parseInt(partes[2], 10);
            secuencia = ultimoNumero + 1;
        }

        return `${prefix}${secuencia.toString().padStart(5, '0')}`;
    }

    async buscarPorDniHash(dniHash: string) {
        return this.solicitudesRepository.find({
            where: { dniHash },
            order: { createdAt: 'DESC' },
            select: {
                id: true,
                codigo: true,
                nombreCompleto: true,
                email: true,
                circunscripcion: true,
                estado: true,
                issuedAt: true,
                fechaVencimiento: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async buscarPorCodigo(codigo: string) {
        return this.solicitudesRepository.findOne({
            where: { codigo },
            select: {
                id: true,
                codigo: true,
                nombreCompleto: true,
                email: true,
                circunscripcion: true,
                estado: true,
                issuedAt: true,
                fechaVencimiento: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
}
