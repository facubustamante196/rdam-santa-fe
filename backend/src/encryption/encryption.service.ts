import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    createHash,
} from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly encryptionKey: Buffer;
    private readonly hashSalt: string;

    constructor(private readonly configService: ConfigService) {
        const keyHex = this.configService.get<string>('ENCRYPTION_KEY', '');
        this.encryptionKey = Buffer.from(keyHex, 'hex');

        if (this.encryptionKey.length !== 32) {
            console.warn(
                '⚠️  ENCRYPTION_KEY debe ser de 32 bytes (64 chars hex). Usando clave de desarrollo.',
            );
            this.encryptionKey = Buffer.alloc(32, 0);
        }

        this.hashSalt = this.configService.get<string>(
            'DNI_HASH_SALT',
            'dev-salt',
        );
    }

    /**
     * Encripta un texto usando AES-256-GCM.
     * Retorna: iv:authTag:ciphertext (todo en hex).
     */
    encrypt(plaintext: string): string {
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * Desencripta un texto previamente encriptado con encrypt().
     */
    decrypt(encryptedData: string): string {
        const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Genera un blind index (hash SHA-256 con salt) para búsqueda.
     * Siempre produce el mismo resultado para el mismo input → permite buscar sin desencriptar.
     */
    blindIndex(value: string): string {
        return createHash('sha256')
            .update(`${this.hashSalt}:${value}`)
            .digest('hex');
    }

    /**
     * Hashea un código OTP con SHA-256 (sin salt, porque el OTP ya es aleatorio).
     */
    hashOtp(otp: string): string {
        return createHash('sha256').update(otp).digest('hex');
    }
}
