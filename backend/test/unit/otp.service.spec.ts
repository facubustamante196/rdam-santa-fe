import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '../../src/otp/otp.service';
import { EncryptionService } from '../../src/encryption/encryption.service';

const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
};

jest.mock('ioredis', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => mockRedis),
    };
});

const mockEncryption = {
    blindIndex: jest.fn().mockReturnValue('hashed-dni'),
    hashOtp: jest.fn().mockImplementation((otp: string) => `hashed-${otp}`),
    encrypt: jest.fn().mockImplementation((value: string) => `enc-${value}`),
};

const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-token'),
};

const mockConfig = {
    get: jest.fn().mockImplementation((key: string, defaultVal?: unknown) => {
        const config: Record<string, unknown> = {
            REDIS_URL: 'redis://localhost:6379',
            OTP_TTL_SECONDS: 300,
            OTP_MAX_INTENTOS: 3,
            OTP_JWT_SECRET: 'test-secret',
            OTP_JWT_EXPIRES_IN: '30m',
            NODE_ENV: 'development',
        };
        return key in config ? config[key] : defaultVal;
    }),
};

describe('OtpService', () => {
    let service: OtpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OtpService,
                { provide: ConfigService, useValue: mockConfig },
                { provide: JwtService, useValue: mockJwt },
                { provide: EncryptionService, useValue: mockEncryption },
            ],
        }).compile();

        service = module.get<OtpService>(OtpService);
        jest.clearAllMocks();
    });

    describe('solicitar', () => {
        it('genera OTP y lo almacena en Redis', async () => {
            mockRedis.set.mockResolvedValue('OK');

            const result = await service.solicitar('12345678', 'test@email.com');

            expect(result.message).toContain('OTP enviado');
            expect(result.expires_in).toBe(300);
            expect(result._dev_otp).toBeDefined();
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('validar', () => {
        it('valida OTP correcto y retorna access_token', async () => {
            const storedData = JSON.stringify({
                otpHash: 'hashed-123456',
                email: 'test@email.com',
                intentos: 0,
            });

            mockRedis.get.mockResolvedValue(storedData);
            mockRedis.del.mockResolvedValue(1);
            mockEncryption.hashOtp.mockReturnValue('hashed-123456');

            const result = await service.validar(
                '12345678',
                'test@email.com',
                '123456',
            );

            expect(result.access_token).toBe('mock-token');
            expect(mockRedis.del).toHaveBeenCalled();
        });

        it('rechaza OTP incorrecto', async () => {
            const storedData = JSON.stringify({
                otpHash: 'hashed-123456',
                email: 'test@email.com',
                intentos: 0,
            });

            mockRedis.get.mockResolvedValue(storedData);
            mockRedis.ttl.mockResolvedValue(200);
            mockRedis.set.mockResolvedValue('OK');
            mockEncryption.hashOtp.mockReturnValue('hashed-000000');

            await expect(
                service.validar('12345678', 'test@email.com', '000000'),
            ).rejects.toThrow(BadRequestException);
        });

        it('bloquea cuando supera intentos maximos', async () => {
            const storedData = JSON.stringify({
                otpHash: 'hashed-123456',
                email: 'test@email.com',
                intentos: 3,
            });

            mockRedis.get.mockResolvedValue(storedData);
            mockRedis.del.mockResolvedValue(1);

            await expect(
                service.validar('12345678', 'test@email.com', '000000'),
            ).rejects.toThrow(GoneException);
        });

        it('rechaza OTP expirado', async () => {
            mockRedis.get.mockResolvedValue(null);

            await expect(
                service.validar('12345678', 'test@email.com', '123456'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('reenviar', () => {
        it('invalida OTP anterior y genera uno nuevo', async () => {
            mockRedis.del.mockResolvedValue(1);
            mockRedis.set.mockResolvedValue('OK');

            const result = await service.reenviar('12345678', 'test@email.com');

            expect(result.message).toContain('OTP enviado');
            expect(mockRedis.del).toHaveBeenCalled();
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });
});
