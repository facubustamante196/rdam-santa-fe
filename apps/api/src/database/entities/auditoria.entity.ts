import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ActorTipo } from '../enums/actor-tipo.enum';
import { SolicitudEntity } from './solicitud.entity';
import { UsuarioEntity } from './usuario.entity';

@Entity({ name: 'auditoria' })
@Index('idx_auditoria_solicitud', ['solicitudId', 'timestamp'])
export class AuditoriaEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'solicitud_id', type: 'uuid', nullable: true })
    solicitudId?: string | null;

    @ManyToOne(() => SolicitudEntity, (solicitud) => solicitud.registrosAuditoria, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'solicitud_id' })
    solicitud?: SolicitudEntity | null;

    @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
    usuarioId?: string | null;

    @ManyToOne(() => UsuarioEntity, (usuario) => usuario.registrosAuditoria, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'usuario_id' })
    usuario?: UsuarioEntity | null;

    @Column({ type: 'varchar', length: 80 })
    accion!: string;

    @Column({ name: 'estado_anterior', type: 'varchar', length: 30, nullable: true })
    estadoAnterior?: string | null;

    @Column({ name: 'estado_nuevo', type: 'varchar', length: 30, nullable: true })
    estadoNuevo?: string | null;

    @Column({ type: 'text', nullable: true })
    observaciones?: string | null;

    @Column({
        name: 'actor_tipo',
        type: 'enum',
        enum: ActorTipo,
        default: ActorTipo.SISTEMA,
    })
    actorTipo!: ActorTipo;

    @Column({ name: 'ip_origen', type: 'varchar', length: 45, nullable: true })
    ipOrigen?: string | null;

    @Column({ name: 'forzado_supervisor', type: 'boolean', default: false })
    forzadoSupervisor!: boolean;

    @Column({
        name: 'timestamp',
        type: 'timestamp with time zone',
        default: () => 'CURRENT_TIMESTAMP',
    })
    timestamp!: Date;
}
