import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
    Between,
    DataSource,
    FindOptionsWhere,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
    ILike,
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
    Circunscripcion,
    EstadoSolicitud,
    RolUsuario,
} from '../database/enums';
import { EmisionService } from '../emision/emision.service';
import { ListarSolicitudesQueryDto } from './dto/listar-solicitudes.query.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

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
        private readonly emisionService: EmisionService,
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
        if (circunscripcion)
            where.circunscripcion = circunscripcion as Circunscripcion;
        if (query.dni) where.dniHash = this.encryptionService.blindIndex(query.dni);

        if (query.search) {
            const search = query.search.trim();
            // Si es puramente numérico y tiene longitud de DNI o CUIL, buscamos por hash
            if (/^\d+$/.test(search) && (search.length === 7 || search.length === 8 || search.length === 11)) {
                const hash = this.encryptionService.blindIndex(search);
                // Usamos un array de condiciones para simular OR
                const multiWhere = [
                    { ...where, dniHash: hash },
                    { ...where, cuilHash: hash }
                ];
                // En TypeORM, si pasamos un array a 'where', es un OR entre los elementos
                return this.listarConCondicionesMultiple(multiWhere, query, page, limit, skip);
            } else {
                // Si no, buscamos por nombre o código (parcial)
                const multiWhere = [
                    { ...where, nombreCompleto: ILike(`%${search}%`) },
                    { ...where, codigo: ILike(`%${search}%`) }
                ];
                return this.listarConCondicionesMultiple(multiWhere, query, page, limit, skip);
            }
        }

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

        return this.listarConCondicionesMultiple(where, query, page, limit, skip);
    }

    private async listarConCondicionesMultiple(
        where: FindOptionsWhere<SolicitudEntity> | FindOptionsWhere<SolicitudEntity>[],
        query: ListarSolicitudesQuery,
        page: number,
        limit: number,
        skip: number,
    ) {
        const [solicitudes, total] = await this.solicitudesRepository.findAndCount({
            where,
            relations: { operarioAsignado: true },
            order: { createdAt: 'ASC' },
            skip,
            take: limit,
        });

        return {
            data: solicitudes.map((s) => {
                let cuilEnmascarado = '***';
                try {
                    const cuil = this.encryptionService.decrypt(s.cuilEncriptado);
                    cuilEnmascarado = `${cuil.slice(0, 2)}-${'*'.repeat(6)}-${cuil.slice(-1)}`;
                } catch { }

                return {
                    id: s.id,
                    codigo: s.codigo,
                    nombre: s.nombreCompleto,
                    cuil: cuilEnmascarado,
                    email: s.email,
                    circunscripcion: s.circunscripcion,
                    estado: s.estado,
                    operarioAsignado: s.operarioAsignado
                        ? { id: s.operarioAsignado.id, nombreCompleto: s.operarioAsignado.nombreCompleto }
                        : null,
                    issuedAt: s.issuedAt,
                    creado_en: s.createdAt,
                    updatedAt: s.updatedAt,
                };
            }),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async crearUsuario(dto: CrearUsuarioDto) {
        const existente = await this.usuariosRepository.findOne({
            where: { username: dto.username },
        });
        if (existente) {
            throw new ConflictException('El nombre de usuario ya existe');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const usuario = this.usuariosRepository.create({
            username: dto.username,
            passwordHash,
            nombreCompleto: dto.nombreCompleto,
            rol: RolUsuario.OPERARIO,
            circunscripcion: dto.circunscripcion,
            activo: true,
        });

        const guardado = await this.usuariosRepository.save(usuario);

        return {
            id: guardado.id,
            username: guardado.username,
            nombre: guardado.nombreCompleto,
            rol: guardado.rol,
            circunscripcion: guardado.circunscripcion,
            activo: guardado.activo,
            creado_en: guardado.fechaCreacion,
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
                nombre: usuario.nombreCompleto, // Mapping to frontend field name 'nombre'
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

        let dni = '***';
        let cuil = '***';
        let dniEnmascarado = '***';
        let cuilEnmascarado = '***';

        try {
            dni = this.encryptionService.decrypt(solicitud.dniEncriptado);
            dniEnmascarado = `${dni.slice(0, 2)}${'*'.repeat(Math.max(0, dni.length - 3))}${dni.slice(-1)}`;
        } catch { }

        try {
            cuil = this.encryptionService.decrypt(solicitud.cuilEncriptado);
            cuilEnmascarado = `${cuil.slice(0, 2)}-${'*'.repeat(6)}-${cuil.slice(-1)}`;
        } catch { }

        let pdfUrl = solicitud.pdfUrl;
        if (solicitud.pdfStorageKey) {
            try {
                const res = await this.emisionService.generarUrlDescarga(solicitud.id);
                pdfUrl = res.url;
            } catch {
                // Silently fail if file is missing in S3
            }
        }

        return {
            ...solicitud,
            pdfUrl,
            registrosAuditoria: auditoria,
            transaccionesPago: transacciones,
            dniEncriptado: undefined,
            cuilEncriptado: undefined,
            dni,             // Full DNI
            cuil,            // Full CUIL
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

    async actualizarUsuario(id: string, dto: ActualizarUsuarioDto) {
        const usuario = await this.usuariosRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (dto.nombreCompleto !== undefined) usuario.nombreCompleto = dto.nombreCompleto;
        else if ((dto as any).nombre !== undefined) usuario.nombreCompleto = (dto as any).nombre;
        if (dto.username !== undefined) usuario.username = dto.username;
        if (dto.rol !== undefined) usuario.rol = dto.rol;
        if (dto.circunscripcion !== undefined) usuario.circunscripcion = dto.circunscripcion;
        if (dto.activo !== undefined) usuario.activo = dto.activo;

        await this.usuariosRepository.save(usuario);

        return {
            id: usuario.id,
            username: usuario.username,
            nombre: usuario.nombreCompleto,
            rol: usuario.rol,
            circunscripcion: usuario.circunscripcion,
            activo: usuario.activo,
        };
    }
}
