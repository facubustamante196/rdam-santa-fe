import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { UsuarioEntity } from '../database/entities';
import { ActorTipo, RolUsuario } from '../database/enums';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
    sub: string;
    username: string;
    rol: string;
    circunscripcion: string;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UsuarioEntity)
        private readonly usuariosRepository: Repository<UsuarioEntity>,
        private readonly jwtService: JwtService,
        private readonly auditoriaService: AuditoriaService,
    ) { }

    async login(dto: LoginDto, ipOrigen?: string) {
        const usuario = await this.usuariosRepository.findOne({
            where: { username: dto.username },
        });

        if (!usuario) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!usuario.activo) {
            throw new UnauthorizedException('Usuario desactivado');
        }

        const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
        if (!passwordValida) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        usuario.ultimoLogin = new Date();
        await this.usuariosRepository.save(usuario);

        const payload: JwtPayload = {
            sub: usuario.id,
            username: usuario.username,
            rol: usuario.rol,
            circunscripcion: usuario.circunscripcion,
        };

        const accessToken = this.jwtService.sign(payload);

        await this.auditoriaService.registrar({
            accion: 'LOGIN',
            actorTipo:
                usuario.rol === RolUsuario.SUPERVISOR
                    ? ActorTipo.SUPERVISOR
                    : ActorTipo.OPERARIO,
            usuarioId: usuario.id,
            ipOrigen,
        });

        return {
            access_token: accessToken,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                nombre: usuario.nombreCompleto,
                rol: usuario.rol,
                circunscripcion: usuario.circunscripcion,
            },
        };
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    }
}
