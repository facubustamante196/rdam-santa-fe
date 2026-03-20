import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Circunscripcion } from '../enums/circunscripcion.enum';
import { EstadoSolicitud } from '../enums/estado-solicitud.enum';
import { UsuarioEntity } from './usuario.entity';
import { TransaccionPagoEntity } from './transaccion-pago.entity';
import { AuditoriaEntity } from './auditoria.entity';

@Entity({ name: 'solicitudes' })
@Index('idx_solicitudes_estado', ['estado'])
@Index('idx_solicitudes_circunscr', ['circunscripcion'])
@Index('idx_solicitudes_created_at', ['createdAt'])
@Index('idx_solicitudes_issued_at', ['issuedAt'])
@Index('idx_solicitudes_dni_hash', ['dniHash'])
@Index('idx_solicitudes_codigo', ['codigo'])
export class SolicitudEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    codigo!: string;

    @Column({ name: 'dni_encriptado', type: 'text' })
    dniEncriptado!: string;

    @Column({ name: 'cuil_encriptado', type: 'text' })
    cuilEncriptado!: string;

    // El Blind Index del DNI: Se hashea con SHA-256 + Salt Estático. Es de un solo sentido (no se puede desencriptar). 
    // Solo sirve para "Comparar Búsquedas" a máxima velocidad gracias al @Index sin revelar la identidad a nivel base de datos.
    @Column({ name: 'dni_hash', type: 'varchar', length: 64 })
    dniHash!: string;

    @Column({ name: 'cuil_hash', type: 'varchar', length: 64, nullable: true })
    @Index('idx_solicitudes_cuil_hash')
    cuilHash?: string | null;

    @Column({ name: 'nombre_completo', type: 'varchar', length: 120 })
    nombreCompleto!: string;

    @Column({ name: 'fecha_nacimiento', type: 'date' })
    fechaNacimiento!: string;

    @Column({ type: 'varchar', length: 120 })
    email!: string;

    @Column({ type: 'enum', enum: Circunscripcion })
    circunscripcion!: Circunscripcion;

    @Column({
        type: 'enum',
        enum: EstadoSolicitud,
        default: EstadoSolicitud.PENDIENTE_PAGO,
    })
    estado!: EstadoSolicitud;

    @Column({ name: 'operario_asignado_id', type: 'uuid', nullable: true })
    operarioAsignadoId?: string | null;

    @ManyToOne(() => UsuarioEntity, (usuario) => usuario.solicitudesAsignadas, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'operario_asignado_id' })
    operarioAsignado?: UsuarioEntity | null;

    @Column({ name: 'observaciones_rechazo', type: 'text', nullable: true })
    observacionesRechazo?: string | null;

    @Column({ name: 'pdf_url', type: 'text', nullable: true })
    pdfUrl?: string | null;

    @Column({ name: 'pdf_storage_key', type: 'text', nullable: true })
    pdfStorageKey?: string | null;

    @Column({ name: 'issued_at', type: 'timestamp with time zone', nullable: true })
    issuedAt?: Date | null;

    @Column({
        name: 'fecha_vencimiento',
        type: 'timestamp with time zone',
        nullable: true,
    })
    fechaVencimiento?: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt!: Date;

    @OneToMany(() => TransaccionPagoEntity, (transaccion) => transaccion.solicitud)
    transaccionesPago!: TransaccionPagoEntity[];

    @OneToMany(() => AuditoriaEntity, (auditoria) => auditoria.solicitud)
    registrosAuditoria!: AuditoriaEntity[];
}
