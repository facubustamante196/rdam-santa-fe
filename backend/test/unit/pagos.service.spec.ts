import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { PagosService } from '../../src/pagos/pagos.service';
import { EstadoPago, EstadoSolicitud } from '../../src/database/enums';

const mockSolicitudesRepository = {
    findOne: jest.fn(),
};

const mockTransaccionesRepository = {
    create: jest.fn().mockImplementation((payload) => payload),
    save: jest.fn(),
};

const mockConfig = {
    get: jest.fn().mockImplementation((key: string, defaultVal?: unknown) => {
        const config: Record<string, unknown> = {
            PASARELA_API_URL: 'http://localhost:3000',
            PASARELA_MERCHANT_GUID: 'test-merchant-001',
            PASARELA_SECRET_KEY: 'clave-secreta-campus-2026',
            FRONTEND_URL: 'http://localhost:3002',
            BACKEND_PUBLIC_URL: 'http://localhost:3001',
            PASARELA_MONTO_BASE: '2500',
            PORT: 3001,
        };
        return key in config ? config[key] : defaultVal;
    }),
};

describe('PagosService', () => {
    let service: PagosService;

    beforeEach(async () => {
        const mockDataSource = {
            getRepository: jest
                .fn()
                .mockImplementationOnce(() => mockSolicitudesRepository)
                .mockImplementationOnce(() => mockTransaccionesRepository),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PagosService,
                { provide: DataSource, useValue: mockDataSource },
                { provide: ConfigService, useValue: mockConfig },
            ],
        }).compile();

        service = module.get<PagosService>(PagosService);
        jest.clearAllMocks();
    });

    it('inicia pago de solicitud pendiente y retorna payload de checkout para redireccion', async () => {
        mockSolicitudesRepository.findOne.mockResolvedValue({
            id: 'sol-1',
            codigo: 'RDAM-2026-00001',
            dniHash: 'dni-hash-ok',
            email: 'ciudadano@test.com',
            estado: EstadoSolicitud.PENDIENTE_PAGO,
        });
        mockTransaccionesRepository.save.mockResolvedValue({
            id: 'trx-1',
        });

        const result = await service.iniciarPagoCiudadano(
            'RDAM-2026-00001',
            'dni-hash-ok',
        );

        expect(result.transaccion_id).toBe('trx-1');
        expect(result.url_pago).toBe('http://localhost:3000');
        expect(result.metodo).toBe('POST');
        expect(result.checkout_fields.Comercio).toBe('test-merchant-001');
        expect(result.checkout_fields.TransaccionComercioId).toBe('RDAM-2026-00001');
        expect(typeof result.checkout_fields.Monto).toBe('string');
        expect(mockTransaccionesRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                solicitudId: 'sol-1',
                estado: EstadoPago.PENDIENTE,
            }),
        );
    });

    it('rechaza si la solicitud no pertenece al ciudadano autenticado', async () => {
        mockSolicitudesRepository.findOne.mockResolvedValue({
            id: 'sol-1',
            codigo: 'RDAM-2026-00001',
            dniHash: 'otro-dni-hash',
            email: 'ciudadano@test.com',
            estado: EstadoSolicitud.PENDIENTE_PAGO,
        });

        await expect(
            service.iniciarPagoCiudadano('RDAM-2026-00001', 'dni-hash-ok'),
        ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si la solicitud no esta en estado PENDIENTE_PAGO', async () => {
        mockSolicitudesRepository.findOne.mockResolvedValue({
            id: 'sol-1',
            codigo: 'RDAM-2026-00001',
            dniHash: 'dni-hash-ok',
            email: 'ciudadano@test.com',
            estado: EstadoSolicitud.PAGADA,
        });

        await expect(
            service.iniciarPagoCiudadano('RDAM-2026-00001', 'dni-hash-ok'),
        ).rejects.toThrow(ConflictException);
    });

    it('lanza NotFound si no existe la solicitud', async () => {
        mockSolicitudesRepository.findOne.mockResolvedValue(null);

        await expect(
            service.iniciarPagoCiudadano('RDAM-2026-00001', 'dni-hash-ok'),
        ).rejects.toThrow(NotFoundException);
    });
});
