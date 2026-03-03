import {
    Injectable,
    BadRequestException,
    GoneException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { randomInt } from 'crypto';
import { EncryptionService } from '../encryption/encryption.service';
import { OtpJwtPayload } from '../auth/guards/otp-auth.guard';

interface OtpData {
    otpHash: string;
    email: string;
    intentos: number;
}

@Injectable()
export class OtpService {
    private readonly redis: Redis;
    private readonly otpTtl: number;
    private readonly maxIntentos: number;
    private readonly otpJwtSecret: string;
    private readonly otpJwtExpiresIn: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly encryptionService: EncryptionService,
    ) {
        const redisUrl = this.configService.get<string>(
            'REDIS_URL',
            'redis://localhost:6379',
        );
        this.redis = new Redis(redisUrl);

        this.otpTtl = this.configService.get<number>('OTP_TTL_SECONDS', 600);
        this.maxIntentos = this.configService.get<number>('OTP_MAX_INTENTOS', 3);
        this.otpJwtSecret = this.configService.get<string>(
            'OTP_JWT_SECRET',
            'dev-otp-secret',
        );
        this.otpJwtExpiresIn = this.configService.get<string>(
            'OTP_JWT_EXPIRES_IN',
            '30m',
        );
    }

    /**
     * Genera y envía un OTP al email del ciudadano.
     */
    async solicitar(dni: string, email: string) {
        const dniHash = this.encryptionService.blindIndex(dni);
        const redisKey = `otp:${dniHash}`;

        // Generar código de 6 dígitos
        const otpCode = randomInt(100000, 999999).toString();
        const otpHash = this.encryptionService.hashOtp(otpCode);

        // Guardar en Redis con TTL
        const otpData: OtpData = {
            otpHash,
            email,
            intentos: 0,
        };

        await this.redis.set(redisKey, JSON.stringify(otpData), 'EX', this.otpTtl);

        // TODO: Enviar email con el código OTP
        // Por ahora logueamos en desarrollo
        console.log(`📧 OTP para DNI ${dni}: ${otpCode} (válido ${this.otpTtl}s)`);

        return {
            message: 'Código OTP enviado a su email',
            expires_in: this.otpTtl,
            // Solo en desarrollo:
            ...(this.configService.get('NODE_ENV') === 'development' && {
                _dev_otp: otpCode,
            }),
        };
    }

    /**
     * Valida un código OTP y retorna un JWT de sesión ciudadano.
     */
    async validar(dni: string, email: string, codigo: string) {
        const dniHash = this.encryptionService.blindIndex(dni);
        const redisKey = `otp:${dniHash}`;

        const stored = await this.redis.get(redisKey);

        if (!stored) {
            throw new BadRequestException(
                'No existe un OTP activo para este DNI. Solicite uno nuevo.',
            );
        }

        const otpData: OtpData = JSON.parse(stored);

        // Verificar que el email coincida
        if (otpData.email !== email) {
            throw new BadRequestException('Email no coincide con el OTP solicitado');
        }

        // Verificar intentos
        if (otpData.intentos >= this.maxIntentos) {
            await this.redis.del(redisKey);
            throw new GoneException(
                'Máximo de intentos alcanzado. Solicite un nuevo código OTP.',
            );
        }

        // Verificar código
        const codigoHash = this.encryptionService.hashOtp(codigo);

        if (codigoHash !== otpData.otpHash) {
            // Incrementar intentos
            otpData.intentos += 1;
            const ttlRestante = await this.redis.ttl(redisKey);
            await this.redis.set(
                redisKey,
                JSON.stringify(otpData),
                'EX',
                ttlRestante > 0 ? ttlRestante : this.otpTtl,
            );

            const restantes = this.maxIntentos - otpData.intentos;
            throw new BadRequestException(
                `Código OTP incorrecto. Le quedan ${restantes} intento(s).`,
            );
        }

        // OTP válido — invalidar (un solo uso)
        await this.redis.del(redisKey);

        // Generar JWT de sesión ciudadano
        const payload: OtpJwtPayload = {
            sub: dniHash,
            email,
            dniEncriptado: this.encryptionService.encrypt(dni),
            tipo: 'ciudadano',
        };

        const token = this.jwtService.sign(payload, {
            secret: this.otpJwtSecret,
            expiresIn: this.otpJwtExpiresIn,
        });

        return {
            access_token: token,
            message: 'OTP validado exitosamente',
            expires_in: this.otpJwtExpiresIn,
        };
    }

    /**
     * Reenvía un nuevo OTP (invalida el anterior).
     */
    async reenviar(dni: string, email: string) {
        const dniHash = this.encryptionService.blindIndex(dni);
        const redisKey = `otp:${dniHash}`;

        // Borrar OTP anterior si existe
        await this.redis.del(redisKey);

        // Generar uno nuevo
        return this.solicitar(dni, email);
    }
}
