import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SolicitudEntity } from '../database/entities';
import { Circunscripcion, EstadoSolicitud } from '../database/enums';

export interface DashboardMetrics {
    total: number;
    pendientes: number;
    emitidas: number;
    rechazadas: number;
    vencidas: number;
    tiempo_promedio_hs: number;
    por_circunscripcion: { circunscripcion: string; total: number }[];
}

export interface DashboardStats extends DashboardMetrics {
    solicitudes_hoy: number;
    tiempos_promedio: {
        pago_dias: number | null;
        emision_dias: number | null;
    };
    sla: {
        dentro_plazo: number;
        fuera_plazo: number;
        porcentaje_cumplimiento: number;
    };
}

@Injectable()
export class DashboardService {
    private readonly solicitudesRepository: Repository<SolicitudEntity>;

    constructor(dataSource: DataSource) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
    }

    async obtenerStats(circunscripcion?: Circunscripcion, periodo?: string): Promise<DashboardStats> {
        let fechaInicio: Date | null = null;
        if (periodo) {
            fechaInicio = new Date();
            fechaInicio.setHours(0, 0, 0, 0);
            if (periodo === 'semana') {
                fechaInicio.setDate(fechaInicio.getDate() - 7);
            } else if (periodo === 'mes') {
                fechaInicio.setMonth(fechaInicio.getMonth() - 1);
            } else if (periodo === 'año') {
                fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
            }
            // 'hoy' case is already handled by the default 00:00:00 setting
        }

        const porEstadoQb = this.solicitudesRepository.createQueryBuilder('s');
        if (circunscripcion) {
            porEstadoQb.where('s.circunscripcion = :circunscripcion', { circunscripcion });
        }
        if (fechaInicio) {
            porEstadoQb.andWhere('s.createdAt >= :fechaInicio', { fechaInicio });
        }
        const porEstado = await porEstadoQb
            .select('s.estado', 'estado')
            .addSelect('COUNT(s.id)', 'cantidad')
            .groupBy('s.estado')
            .getRawMany<{ estado: EstadoSolicitud; cantidad: string }>();

        const solicitudes_por_estado: Record<string, number> = {};
        let total = 0;
        for (const item of porEstado) {
            const cantidad = Number(item.cantidad);
            solicitudes_por_estado[item.estado] = cantidad;
            total += cantidad;
        }
        for (const estado of Object.values(EstadoSolicitud)) {
            if (!(estado in solicitudes_por_estado)) {
                solicitudes_por_estado[estado] = 0;
            }
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const hoyQb = this.solicitudesRepository.createQueryBuilder('s');
        hoyQb.where('s.createdAt >= :hoy', { hoy });
        if (circunscripcion) {
            hoyQb.andWhere('s.circunscripcion = :circunscripcion', { circunscripcion });
        }
        if (fechaInicio) {
            hoyQb.andWhere('s.createdAt >= :fechaInicio', { fechaInicio });
        }
        const solicitudes_hoy = await hoyQb.getCount();

        const circQb = this.solicitudesRepository
            .createQueryBuilder('s')
            .select('s.circunscripcion', 'circunscripcion')
            .addSelect('COUNT(s.id)', 'cantidad');
        
        if (fechaInicio) {
            circQb.andWhere('s.createdAt >= :fechaInicio', { fechaInicio });
        }
        
        const porCircunscripcion = await circQb
            .groupBy('s.circunscripcion')
            .getRawMany<{ circunscripcion: Circunscripcion; cantidad: string }>();

        const solicitudes_por_circunscripcion: Record<string, number> = {};
        for (const item of porCircunscripcion) {
            solicitudes_por_circunscripcion[item.circunscripcion] = Number(item.cantidad);
        }

        const hace48hs = new Date();
        hace48hs.setHours(hace48hs.getHours() - 48);

        const dentroQb = this.solicitudesRepository.createQueryBuilder('s');
        dentroQb.where('s.estado = :estado', { estado: EstadoSolicitud.PAGADA });
        dentroQb.andWhere('s.updatedAt >= :limite', { limite: hace48hs });
        if (circunscripcion) {
            dentroQb.andWhere('s.circunscripcion = :circunscripcion', { circunscripcion });
        }

        const fueraQb = this.solicitudesRepository.createQueryBuilder('s');
        fueraQb.where('s.estado = :estado', { estado: EstadoSolicitud.PAGADA });
        fueraQb.andWhere('s.updatedAt < :limite', { limite: hace48hs });
        if (circunscripcion) {
            fueraQb.andWhere('s.circunscripcion = :circunscripcion', { circunscripcion });
        }

        const [dentro_plazo, fuera_plazo] = await Promise.all([
            dentroQb.getCount(),
            fueraQb.getCount(),
        ]);

        const totalSla = dentro_plazo + fuera_plazo;

        return {
            total: total,
            pendientes: solicitudes_por_estado[EstadoSolicitud.PENDIENTE_PAGO] || 0,
            emitidas: solicitudes_por_estado[EstadoSolicitud.EMITIDA] || 0,
            rechazadas: solicitudes_por_estado[EstadoSolicitud.RECHAZADA] || 0,
            vencidas: (solicitudes_por_estado[EstadoSolicitud.VENCIDO] || 0) + (solicitudes_por_estado[EstadoSolicitud.PUBLICADO_VENCIDO] || 0),
            tiempo_promedio_hs: 0,
            por_circunscripcion: Object.entries(solicitudes_por_circunscripcion).map(
                ([circunscripcion, total]) => ({ circunscripcion, total }),
            ),
            solicitudes_hoy,
            tiempos_promedio: {
                pago_dias: null,
                emision_dias: null,
            },
            sla: {
                dentro_plazo,
                fuera_plazo,
                porcentaje_cumplimiento:
                    totalSla > 0 ? Math.round((dentro_plazo / totalSla) * 100) : 100,
            },
        };
    }
}
