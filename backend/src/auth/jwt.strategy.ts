import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../database/entities';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        @InjectRepository(UsuarioEntity)
        private readonly usuariosRepository: Repository<UsuarioEntity>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret'),
        });
    }

    async validate(payload: JwtPayload) {
        const usuario = await this.usuariosRepository.findOne({
            where: { id: payload.sub },
        });

        if (!usuario || !usuario.activo) {
            throw new UnauthorizedException('Usuario no válido');
        }

        return {
            id: usuario.id,
            username: usuario.username,
            rol: usuario.rol,
            circunscripcion: usuario.circunscripcion,
        };
    }
}
