import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'otp_tokens' })
@Index('idx_otp_tokens_dni_hash', ['dniHash', 'expiresAt'])
export class OtpTokenEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'dni_hash', type: 'varchar', length: 64 })
    dniHash!: string;

    @Column({ type: 'varchar', length: 120 })
    email!: string;

    @Column({ name: 'otp_code_hash', type: 'varchar', length: 255 })
    otpCodeHash!: string;

    @Column({ name: 'expires_at', type: 'timestamp with time zone' })
    expiresAt!: Date;

    @Column({ type: 'boolean', default: false })
    used!: boolean;

    @Column({ type: 'smallint', default: 0 })
    intentos!: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt!: Date;
}
