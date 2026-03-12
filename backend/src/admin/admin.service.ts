import { Injectable, NotFoundException } from '@nestjs/common';
import {
    Between,
    DataSource,
    FindOptionsWhere,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
} from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
    AuditoriaEntity,
    SolicitudEntity,
    TransaccionPagoEntity,
    UsuarioEntity,
} from '../database/entities';
import {
    ActorTipo,
    EstadoSolicitud,
    RolUsuario,
} from '../database/enums';
import { ListarSolicitudesQueryDto } from './dto/listar-solicitudes.query.dto';

export type ListarSolicitudesQuery = ListarSolicitudesQueryDto;

@Injectable()
export class AdminService {
    private readonly solicitudesRepository: Repository<SolicitudEntity>;
    private readonly usuariosRepository: Repository<UsuarioEntity>;
    private readonly auditoriaRepository: Repository<AuditoriaEntity>;
    private readonly transaccionesRepository: Repository<TransaccionPagoEntity>;

    constructor(
        dataSource: DataSource,
        private readonly encryptionService: EncryptionService,
        private readonly auditoriaService: AuditoriaService,
    ) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
        this.usuariosRepository = dataSource.getRepository(UsuarioEntity);
        this.auditoriaRepository = dataSource.getRepository(AuditoriaEntity);
        this.transaccionesRepository = dataSource.getRepository(TransaccionPagoEntity);
    }

    async listarSolicitudes(
        query: ListarSolicitudesQuery,
        user: { rol: string; circunscripcion: string },
    ) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: FindOptionsWhere<SolicitudEntity> = {};
        if (query.estado) where.estado = query.estado;
        const circunscripcion =
            user.rol === RolUsuario.OPERARIO ? user.circunscripcion : query.circunscripcion;
        if (circunscripcion) where.circunscripcion = circunscripcion;
        if (query.dni) where.dniHash = this.encryptionService.blindIndex(query.dni);

        if (query.fecha_desde && query.fecha_hasta) {
            where.createdAt = Between(
                new Date(query.fecha_desde),
                new Date(query.fecha_hasta),
            );
        } else if (query.fecha_desde) {
            where.createdAt = MoreThanOrEqual(new Date(query.fecha_desde));
        } else if (query.fecha_hasta) {
            where.createdAt = LessThanOrEqual(new Date(query.fecha_hasta));
        }

        const [solicitudes, total] = await this.solicitudesRepository.findAndCount({
            where,
            relations: { operarioAsignado: true },
            order: { createdAt: 'ASC' },
            skip,
            take: limit,
        });

        return {
            data: solicitudes.map((s) => ({
                id: s.id,
                codigo: s.codigo,
                nombreCompleto: s.nombreCompleto,
                email: s.email,
                circunscripcion: s.circunscripcion,
                estado: s.estado,
                operarioAsignado: s.operarioAsignado
                    ? { id: s.operarioAsignado.id, nombreCompleto: s.operarioAsignado.nombreCompleto }
                    : null,
                issuedAt: s.issuedAt,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async listarUsuarios() {
        const usuarios = await this.usuariosRepository.find({
            where: { rol: RolUsuario.OPERARIO },
            order: { nombreCompleto: 'ASC' },
        });

        return {
            operarios: usuarios.map((usuario) => ({
                id: usuario.id,
                username: usuario.username,
                nombreCompleto: usuario.nombreCompleto,
                rol: usuario.rol,
                circunscripcion: usuario.circunscripcion,
                activo: usuario.activo,
            })),
        };
    }

    async obtenerDetalle(id: string) {
        const solicitud = await this.solicitudesRepository.findOne({
            where: { id },
            relations: { operarioAsignado: true },
        });

        if (!solicitud) return null;

        const [auditoria, transacciones] = await Promise.all([
            this.auditoriaRepository.find({
                where: { solicitudId: id },
                relations: { usuario: true },
                order: { timestamp: 'DESC' },
            }),
            this.transaccionesRepository.find({
                where: { solicitudId: id },
                order: { createdAt: 'DESC' },
            }),
        ]);

        let dniEnmascarado = '***';
        let cuilEnmascarado = '***';

        try {
            const dni = this.encryptionService.decrypt(solicitud.dniEncriptado);
            dniEnmascarado = `${dni.slice(0, 2)}${'*'.repeat(Math.max(0, dni.length - 3))}${dni.slice(-1)}`;
        } catch { }

        try {
            const cuil = this.encryptionService.decrypt(solicitud.cuilEncriptado);
            cuilEnmascarado = `${cuil.slice(0, 2)}-${'*'.repeat(6)}-${cuil.slice(-1)}`;
        } catch { }

        return {
            ...solicitud,
            registrosAuditoria: auditoria,
            transaccionesPago: transacciones,
            dniEncriptado: undefined,
            cuilEncriptado: undefined,
            dniEnmascarado,
            cuilEnmascarado,
            puede_cargar_pdf: solicitud.estado === EstadoSolicitud.PAGADA,
        };
    }

    async asignarOperario(
        solicitudId: string,
        operarioId: string,
        user: { id: string; rol: string },
    ) {
        const solicitud = await this.solicitudesRepository.findOne({
            where: { id: solicitudId },
        });
        if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

        const operario = await this.usuariosRepository.findOne({
            where: { id: operarioId },
        });
        if (!operario || !operario.activo) {
            throw new NotFoundException('Operario no encontrado o inactivo');
        }

        solicitud.operarioAsignadoId = operarioId;
        const actualizada = await this.solicitudesRepository.save(solicitud);

        await this.auditoriaService.registrar({
            solicitudId,
            usuarioId: user.id,
            accion: 'ASIGNAR_OPERARIO',
            actorTipo:
                user.rol === RolUsuario.SUPERVISOR
                    ? ActorTipo.SUPERVISOR
                    : ActorTipo.OPERARIO,
            observaciones: `Asignado a: ${operario.nombreCompleto}`,
        });

        return {
            message: 'Operario asignado exitosamente',
            solicitud_id: actualizada.id,
            operario: {
                id: operario.id,
                nombre: operario.nombreCompleto,
            },
        };
    }
}
