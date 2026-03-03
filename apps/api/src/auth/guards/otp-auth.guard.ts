import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface OtpJwtPayload {
    sub: string;     // dni_hash
    email: string;
    dniEncriptado: string;
    tipo: 'ciudadano';
}

@Injectable()
export class OtpAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token OTP requerido');
        }

        try {
            const payload = await this.jwtService.verifyAsync<OtpJwtPayload>(token, {
                secret: this.configService.get<string>(
                    'OTP_JWT_SECRET',
                    'dev-otp-secret',
                ),
            });

            if (payload.tipo !== 'ciudadano') {
                throw new UnauthorizedException('Token OTP inválido');
            }

            // Adjuntar datos del ciudadano al request
            (request as any).ciudadano = {
                dniHash: payload.sub,
                email: payload.email,
                dniEncriptado: payload.dniEncriptado,
            };

            return true;
        } catch {
            throw new UnauthorizedException('Token OTP inválido o expirado');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
