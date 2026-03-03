import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    AuditoriaEntity,
    OtpTokenEntity,
    SolicitudEntity,
    TransaccionPagoEntity,
    UsuarioEntity,
} from './entities';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres' as const,
                url: configService.get<string>('DATABASE_URL'),
                entities: [
                    UsuarioEntity,
                    OtpTokenEntity,
                    SolicitudEntity,
                    TransaccionPagoEntity,
                    AuditoriaEntity,
                ],
                autoLoadEntities: true,
                // Keep schema sync disabled by default; enable only for local/dev with DB_SYNCHRONIZE=true.
                synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
                logging: configService.get<string>('NODE_ENV') === 'development',
                ssl: configService.get<string>('DB_SSL', 'false') === 'true'
                    ? { rejectUnauthorized: false }
                    : false,
            }),
        }),
    ],
    exports: [TypeOrmModule],
})
export class TypeormDatabaseModule { }
