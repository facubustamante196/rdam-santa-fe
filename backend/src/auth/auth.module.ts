import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsuarioEntity } from '../database/entities';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: (() => {
                    const jwtSecret = configService.get<string>('JWT_SECRET');
                    if (!jwtSecret) {
                        throw new Error(
                            'JWT_SECRET no configurado. Defina la variable de entorno.',
                        );
                    }
                    return jwtSecret;
                })(),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '8h'),
                },
            }),
        }),
        TypeOrmModule.forFeature([UsuarioEntity]),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
