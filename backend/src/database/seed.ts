import 'reflect-metadata';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import {
    AuditoriaEntity,
    OtpTokenEntity,
    SolicitudEntity,
    TransaccionPagoEntity,
    UsuarioEntity,
} from './entities';
import { Circunscripcion, RolUsuario } from './enums';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [
        UsuarioEntity,
        OtpTokenEntity,
        SolicitudEntity,
        TransaccionPagoEntity,
        AuditoriaEntity,
    ],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
});

async function main() {
    await dataSource.initialize();

    // eslint-disable-next-line no-console
    console.log('Seeding database...');

    const usuariosRepository = dataSource.getRepository(UsuarioEntity);
    const passwordHash = await bcrypt.hash('password123', 12);

    const usuarios: Array<Partial<UsuarioEntity>> = [
        {
            username: 'supervisor1',
            passwordHash,
            nombreCompleto: 'Maria Garcia (Supervisor)',
            rol: RolUsuario.SUPERVISOR,
            circunscripcion: Circunscripcion.SANTA_FE,
            activo: true,
        },
        {
            username: 'operario1',
            passwordHash,
            nombreCompleto: 'Juan Perez (Operario)',
            rol: RolUsuario.OPERARIO,
            circunscripcion: Circunscripcion.SANTA_FE,
            activo: true,
        },
        {
            username: 'operario2',
            passwordHash,
            nombreCompleto: 'Ana Lopez (Operario)',
            rol: RolUsuario.OPERARIO,
            circunscripcion: Circunscripcion.ROSARIO,
            activo: true,
        },
        {
            username: 'operario3',
            passwordHash,
            nombreCompleto: 'Carlos Rodriguez (Operario)',
            rol: RolUsuario.OPERARIO,
            circunscripcion: Circunscripcion.VENADO_TUERTO,
            activo: true,
        },
    ];

    for (const usuario of usuarios) {
        const existente = await usuariosRepository.findOne({
            where: { username: usuario.username! },
        });

        if (!existente) {
            const nuevo = usuariosRepository.create(usuario);
            await usuariosRepository.save(nuevo);
            // eslint-disable-next-line no-console
            console.log(`  Usuario creado: ${usuario.username} (${usuario.rol})`);
        }
    }

    // eslint-disable-next-line no-console
    console.log('Seed completado');
}

main()
    .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error en seed:', error);
        process.exit(1);
    })
    .finally(async () => {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    });
