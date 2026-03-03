import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Circunscripcion } from '../enums/circunscripcion.enum';
import { RolUsuario } from '../enums/rol-usuario.enum';
import { SolicitudEntity } from './solicitud.entity';
import { AuditoriaEntity } from './auditoria.entity';

@Entity({ name: 'usuarios' })
export class UsuarioEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    username!: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash!: string;

    @Column({ name: 'nombre_completo', type: 'varchar', length: 120 })
    nombreCompleto!: string;

    @Column({ type: 'enum', enum: RolUsuario })
    rol!: RolUsuario;

    @Column({ type: 'enum', enum: Circunscripcion })
    circunscripcion!: Circunscripcion;

    @Column({ type: 'boolean', default: true })
    activo!: boolean;

    @CreateDateColumn({
        name: 'fecha_creacion',
        type: 'timestamp with time zone',
    })
    fechaCreacion!: Date;

    @Column({
        name: 'ultimo_login',
        type: 'timestamp with time zone',
        nullable: true,
    })
    ultimoLogin?: Date | null;

    @OneToMany(
        () => SolicitudEntity,
        (solicitud) => solicitud.operarioAsignado,
    )
    solicitudesAsignadas!: SolicitudEntity[];

    @OneToMany(() => AuditoriaEntity, (auditoria) => auditoria.usuario)
    registrosAuditoria!: AuditoriaEntity[];
}
