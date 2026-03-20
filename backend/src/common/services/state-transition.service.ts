import {
    ForbiddenException,
    Injectable,
    UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuditoriaService } from '../../auditoria/auditoria.service';
import { SolicitudEntity } from '../../database/entities';
import { ActorTipo, EstadoSolicitud } from '../../database/enums';

// Flujo Normal: Define las transiciones permitidas en el ciclo de vida de una solicitud.
// Ejemplo: Si está PENDIENTE_PAGO, de forma normal solo puede pasar a PAGADA, RECHAZADA o VENCIDO.
const TRANSICIONES_VALIDAS: Record<EstadoSolicitud, EstadoSolicitud[]> = {
    [EstadoSolicitud.PENDIENTE_PAGO]: [
        EstadoSolicitud.PAGADA,
        EstadoSolicitud.RECHAZADA,
        EstadoSolicitud.VENCIDO,
    ],
    [EstadoSolicitud.PAGADA]: [EstadoSolicitud.EMITIDA],
    [EstadoSolicitud.RECHAZADA]: [],
    [EstadoSolicitud.VENCIDO]: [],
    [EstadoSolicitud.EMITIDA]: [EstadoSolicitud.PUBLICADO_VENCIDO],
    [EstadoSolicitud.PUBLICADO_VENCIDO]: [],
};

// Transiciones Forzadas por Supervisor: Casos excepcionales donde un supervisor 
// puede forzar cambios de estado para corregir errores (requiere observación obligatoria).
const TRANSICIONES_FORZADAS_SUPERVISOR = new Set<string>([
    `${EstadoSolicitud.PENDIENTE_PAGO}->${EstadoSolicitud.RECHAZADA}`,
    `${EstadoSolicitud.RECHAZADA}->${EstadoSolicitud.PENDIENTE_PAGO}`,
    `${EstadoSolicitud.VENCIDO}->${EstadoSolicitud.PENDIENTE_PAGO}`,
    `${EstadoSolicitud.PAGADA}->${EstadoSolicitud.RECHAZADA}`,
    `${EstadoSolicitud.RECHAZADA}->${EstadoSolicitud.PAGADA}`,
]);

// Prohibiciones Absolutas: Transiciones que ni siquiera un supervisor puede forzar 
// (ej. saltarse el pago y emitir directo).
const TRANSICIONES_PROHIBIDAS = new Set<string>([
    `${EstadoSolicitud.PENDIENTE_PAGO}->${EstadoSolicitud.EMITIDA}`,
]);

export interface CambiarEstadoParams {
    solicitudId: string;
    nuevoEstado: EstadoSolicitud;
    actorTipo: ActorTipo;
    usuarioId?: string;
    observaciones?: string;
    forzado?: boolean;
    ipOrigen?: string;
}

@Injectable()
export class StateTransitionService {
    private readonly solicitudesRepository: Repository<SolicitudEntity>;

    constructor(
        dataSource: DataSource,
        private readonly auditoriaService: AuditoriaService,
    ) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
    }

    async cambiarEstado(params: CambiarEstadoParams) {
        // 1. Busca la solicitud y obtiene sus estados actuales
        const solicitud = await this.solicitudesRepository.findOne({
            where: { id: params.solicitudId },
        });

        if (!solicitud) {
            throw new UnprocessableEntityException('Solicitud no encontrada');
        }

        const estadoActual = solicitud.estado;
        const transicionKey = `${estadoActual}->${params.nuevoEstado}`;

        // 2. Valida la lógica de negocio (prohibidas, válidas, forzadas)
        if (TRANSICIONES_PROHIBIDAS.has(transicionKey)) {
            throw new UnprocessableEntityException(
                `Transicion prohibida: ${estadoActual} -> ${params.nuevoEstado}`,
            );
        }

        const esTransicionNormal =
            (TRANSICIONES_VALIDAS[estadoActual] || []).includes(params.nuevoEstado);

        if (!esTransicionNormal) {
            const esTransicionForzable =
                TRANSICIONES_FORZADAS_SUPERVISOR.has(transicionKey);

            if (!esTransicionForzable) {
                throw new UnprocessableEntityException(
                    `Transicion no permitida: ${estadoActual} -> ${params.nuevoEstado}`,
                );
            }

            // Validaciones específicas para transiciones de supervisor
            if (!params.forzado || params.actorTipo !== ActorTipo.SUPERVISOR) {
                throw new ForbiddenException(
                    'Esta transicion solo puede ser forzada por un supervisor',
                );
            }

            if (!params.observaciones) {
                throw new UnprocessableEntityException(
                    'Las transiciones forzadas requieren justificacion obligatoria',
                );
            }
        }

        // 3. Persiste el nuevo estado en la Base de Datos
        solicitud.estado = params.nuevoEstado;
        const updated = await this.solicitudesRepository.save(solicitud);

        // 4. Delega a Auditoría para dejar rastro inmutable de quién hizo qué
        await this.auditoriaService.registrar({
            solicitudId: params.solicitudId,
            usuarioId: params.usuarioId,
            accion: 'CAMBIO_ESTADO',
            estadoAnterior: estadoActual,
            estadoNuevo: params.nuevoEstado,
            observaciones: params.observaciones,
            actorTipo: params.actorTipo,
            ipOrigen: params.ipOrigen,
            forzadoSupervisor: params.forzado ?? false,
        });

        return updated;
    }

    esTransicionValida(
        estadoActual: EstadoSolicitud,
        nuevoEstado: EstadoSolicitud,
        esSupervisor = false,
    ): boolean {
        const transicionKey = `${estadoActual}->${nuevoEstado}`;

        if (TRANSICIONES_PROHIBIDAS.has(transicionKey)) {
            return false;
        }

        const esNormal = (TRANSICIONES_VALIDAS[estadoActual] || []).includes(nuevoEstado);
        const esForzable =
            esSupervisor && TRANSICIONES_FORZADAS_SUPERVISOR.has(transicionKey);

        return esNormal || esForzable;
    }
}
