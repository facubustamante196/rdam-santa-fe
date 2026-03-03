import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoPago } from '../enums/estado-pago.enum';
import { SolicitudEntity } from './solicitud.entity';

@Entity({ name: 'transacciones_pago' })
export class TransaccionPagoEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'solicitud_id', type: 'uuid' })
    solicitudId!: string;

    @ManyToOne(() => SolicitudEntity, (solicitud) => solicitud.transaccionesPago, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'solicitud_id' })
    solicitud!: SolicitudEntity;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto!: string;

    @Column({ type: 'enum', enum: EstadoPago, default: EstadoPago.PENDIENTE })
    estado!: EstadoPago;

    @Column({
        name: 'referencia_pasarela',
        type: 'varchar',
        length: 120,
        nullable: true,
    })
    referenciaPasarela?: string | null;

    @Column({ name: 'metodo_pago', type: 'varchar', length: 50, nullable: true })
    metodoPago?: string | null;

    @Column({ name: 'payload_pasarela', type: 'jsonb', nullable: true })
    payloadPasarela?: Record<string, unknown> | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt!: Date;

    @Column({ name: 'fecha_pago', type: 'timestamp with time zone', nullable: true })
    fechaPago?: Date | null;
}
