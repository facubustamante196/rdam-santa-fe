import {
    Injectable,
    BadRequestException,
    GoneException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { randomInt } from 'crypto';
import { EncryptionService } from '../encryption/encryption.service';
import { OtpJwtPayload } from '../auth/guards/otp-auth.guard';
import { EmailService } from '../email/email.service';

interface OtpData {
    otpHash: string;
    email: string;
    intentos: number;
}

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);
    private readonly redis: Redis;
    private readonly otpTtl: number;
    private readonly maxIntentos: number;
    private readonly otpJwtSecret: string;
    private readonly otpJwtExpiresIn: string;
    private readonly captchaEnabled: boolean;
    private readonly captchaSecret: string;
    private readonly captchaMinScore: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly encryptionService: EncryptionService,
        private readonly emailService: EmailService,
    ) {
        const redisUrl = this.configService.get<string>(
            'REDIS_URL',
            'redis://localhost:6379',
        );
        this.redis = new Redis(redisUrl);

        this.otpTtl = this.configService.get<number>('OTP_TTL_SECONDS', 600);
        this.maxIntentos = this.configService.get<number>('OTP_MAX_INTENTOS', 3);
        this.otpJwtSecret = this.requireConfig('OTP_JWT_SECRET');
        this.otpJwtExpiresIn = this.configService.get<string>(
            'OTP_JWT_EXPIRES_IN',
            '30m',
        );
        this.captchaEnabled =
            this.configService.get<string>('CAPTCHA_ENABLED', 'false') === 'true';
        this.captchaSecret = this.configService.get<string>(
            'CAPTCHA_SECRET_KEY',
            '',
        );
        this.captchaMinScore = Number(
            this.configService.get<string>('CAPTCHA_MIN_SCORE', '0.5'),
        );

        if (this.captchaEnabled && !this.captchaSecret) {
            this.logger.warn(
                'CAPTCHA_ENABLED=true pero CAPTCHA_SECRET_KEY no está configurado',
            );
        }
    }

    /**
     * Genera y envía un OTP al email del ciudadano.
     */
    async solicitar(
        dni: string,
        email: string,
        captchaToken?: string,
        remoteIp?: string,
    ) {
        await this.validarCaptcha(captchaToken, remoteIp);

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

        await this.emailService.enviarOtp(
            email,
            otpCode,
            Math.ceil(this.otpTtl / 60),
        );

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
    async reenviar(
        dni: string,
        email: string,
        captchaToken?: string,
        remoteIp?: string,
    ) {
        const dniHash = this.encryptionService.blindIndex(dni);
        const redisKey = `otp:${dniHash}`;

        // Borrar OTP anterior si existe
        await this.redis.del(redisKey);

        // Generar uno nuevo
        return this.solicitar(dni, email, captchaToken, remoteIp);
    }

    private async validarCaptcha(captchaToken?: string, remoteIp?: string) {
        if (!this.captchaEnabled) {
            return;
        }

        if (!this.captchaSecret) {
            throw new BadRequestException('CAPTCHA no está configurado en el servidor');
        }

        if (!captchaToken) {
            throw new BadRequestException('Debe completar el CAPTCHA');
        }

        try {
            const body = new URLSearchParams({
                secret: this.captchaSecret,
                response: captchaToken,
            });

            if (remoteIp) {
                body.append('remoteip', remoteIp);
            }

            const response = await fetch(
                'https://www.google.com/recaptcha/api/siteverify',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body.toString(),
                },
            );

            if (!response.ok) {
                this.logger.warn(
                    `CAPTCHA inválido: siteverify devolvió HTTP ${response.status}`,
                );
                throw new BadRequestException('CAPTCHA inválido');
            }

            const verification = (await response.json()) as {
                success?: boolean;
                score?: number;
                'error-codes'?: string[];
            };

            if (!verification.success) {
                const errors = verification['error-codes']?.join(', ') || 'unknown';
                this.logger.warn(`CAPTCHA inválido: ${errors}`);
                throw new BadRequestException('CAPTCHA inválido');
            }

            if (
                typeof verification.score === 'number' &&
                verification.score < this.captchaMinScore
            ) {
                this.logger.warn(
                    `CAPTCHA score bajo: ${verification.score} < ${this.captchaMinScore}`,
                );
                throw new BadRequestException('CAPTCHA inválido');
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(`Error validando CAPTCHA: ${String(error)}`);
            throw new BadRequestException(
                'No se pudo validar CAPTCHA. Intente nuevamente.',
            );
        }
    }

    private requireConfig(key: string): string {
        const value = this.configService.get<string>(key);
        if (!value) {
            throw new Error(`${key} no configurado. Defina la variable de entorno.`);
        }
        return value;
    }
}
