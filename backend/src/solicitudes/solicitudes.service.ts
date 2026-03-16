import { Injectable } from '@nestjs/common';
import { DataSource, Like, Repository, FindOptionsWhere } from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { SolicitudEntity, UsuarioEntity } from '../database/entities';
import { ActorTipo, EstadoSolicitud, RolUsuario } from '../database/enums';
import { EmisionService } from '../emision/emision.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { ConsultaStatusDto } from './dto/consulta-status.dto';

@Injectable()
export class SolicitudesService {
    private readonly solicitudesRepository: Repository<SolicitudEntity>;
    private readonly usuariosRepository: Repository<UsuarioEntity>;
    private readonly auditoriaRepository: Repository<any>; // Using any to avoid complicated entity references here if not needed

    constructor(
        dataSource: DataSource,
        private readonly encryptionService: EncryptionService,
        private readonly auditoriaService: AuditoriaService,
        private readonly emisionService: EmisionService,
    ) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
        this.usuariosRepository = dataSource.getRepository(UsuarioEntity);
        this.auditoriaRepository = dataSource.getRepository('AuditoriaEntity');
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

        // Buscar un operario de la misma circunscripción para asignar automáticamente
        const operario = await this.usuariosRepository.findOne({
            where: {
                circunscripcion: dto.circunscripcion,
                rol: RolUsuario.OPERARIO,
                activo: true,
            },
        });

        const solicitud = this.solicitudesRepository.create({
            codigo,
            dniHash,
            cuilHash: this.encryptionService.blindIndex(dto.cuil),
            dniEncriptado,
            cuilEncriptado,
            nombreCompleto: dto.nombre_completo,
            fechaNacimiento: dto.fecha_nacimiento,
            email: dto.email,
            circunscripcion: dto.circunscripcion,
            estado: EstadoSolicitud.PENDIENTE_PAGO,
            operarioAsignado: operario || null,
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

    async consultar(query: ConsultaStatusDto) {
        const where: FindOptionsWhere<SolicitudEntity> = {};

        if (query.codigo) {
            where.codigo = query.codigo;
        } else if (query.dni && query.email) {
            const dniHash = this.encryptionService.blindIndex(query.dni);
            where.dniHash = dniHash;
            where.email = query.email;
        }

        const solicitud = await this.solicitudesRepository.findOne({
            where,
            relations: { registrosAuditoria: true },
            order: { registrosAuditoria: { timestamp: 'DESC' } },
        });

        if (!solicitud) return null;

        let downloadUrl: string | undefined;
        if (solicitud.estado === EstadoSolicitud.EMITIDA) {
            try {
                const res = await this.emisionService.generarUrlDescarga(solicitud.id);
                downloadUrl = res.url;
            } catch {
                // Si falla la generación de la URL por alguna razón (ej. archivo borrado), 
                // no bloqueamos el resto de la respuesta
            }
        }

        return {
            estado: solicitud.estado,
            downloadUrl,
            timeline: solicitud.registrosAuditoria.map((reg) => ({
                estado: reg.estadoNuevo || reg.accion.replace(/_/g, ' '),
                fecha: reg.timestamp,
                observacion: reg.observaciones,
            })),
        };
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
