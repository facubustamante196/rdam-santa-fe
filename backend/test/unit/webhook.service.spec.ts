import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { StateTransitionService } from '../../src/common/services/state-transition.service';
import { EmailService } from '../../src/email/email.service';
import { WebhookService } from '../../src/webhooks/webhook.service';
import { EstadoPago, EstadoSolicitud } from '../../src/database/enums';

describe('WebhookService', () => {
    let service: WebhookService;

    const mockSolicitudesRepository = {
        findOne: jest.fn(),
    };

    const mockTransaccionesRepository = {
        findOne: jest.fn(),
        create: jest.fn().mockImplementation((payload) => payload),
        save: jest.fn(),
    };

    const mockStateTransition = {
        cambiarEstado: jest.fn(),
    };

    const mockEmailService = {
        enviarConfirmacionPago: jest.fn(),
        enviarPagoRechazado: jest.fn(),
    };

    const mockConfig = {
        get: jest.fn().mockImplementation((key: string, defaultVal?: unknown) => {
            const config: Record<string, unknown> = {
                PASARELA_WEBHOOK_SECRET: 'whsec_xxx',
            };
            return key in config ? config[key] : defaultVal;
        }),
    };

    beforeEach(async () => {
        const mockDataSource = {
            getRepository: jest
                .fn()
                .mockImplementationOnce(() => mockSolicitudesRepository)
                .mockImplementationOnce(() => mockTransaccionesRepository),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WebhookService,
                { provide: DataSource, useValue: mockDataSource },
                { provide: ConfigService, useValue: mockConfig },
                { provide: StateTransitionService, useValue: mockStateTransition },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<WebhookService>(WebhookService);
        jest.clearAllMocks();
    });

    it('procesa webhook PlusPagos exitoso y marca solicitud como PAGADA', async () => {
        mockSolicitudesRepository.findOne.mockResolvedValue({
            id: 'sol-1',
            codigo: 'RDAM-2026-00001',
            email: 'ciudadano@test.com',
            estado: EstadoSolicitud.PENDIENTE_PAGO,
        });
        mockStateTransition.cambiarEstado.mockResolvedValue(undefined);
        mockTransaccionesRepository.findOne.mockResolvedValue({
            id: 'trx-1',
            solicitudId: 'sol-1',
        });
        mockTransaccionesRepository.save.mockResolvedValue(undefined);
        mockEmailService.enviarConfirmacionPago.mockResolvedValue(undefined);

        const result = await service.procesarWebhook({
            Tipo: 'PAGO',
            TransaccionPlataformaId: '123456',
            TransaccionComercioId: 'RDAM-2026-00001',
            Monto: '2500.00',
            EstadoId: '3',
            Estado: 'REALIZADA',
            FechaProcesamiento: '2026-03-04T10:35:00.000Z',
        });

        expect(result.estado).toBe(EstadoSolicitud.PAGADA);
        expect(mockStateTransition.cambiarEstado).toHaveBeenCalledWith(
            expect.objectContaining({
                solicitudId: 'sol-1',
                nuevoEstado: EstadoSolicitud.PAGADA,
            }),
        );
        expect(mockTransaccionesRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                estado: EstadoPago.CONFIRMADO,
                referenciaPasarela: '123456',
            }),
        );
        expect(mockEmailService.enviarConfirmacionPago).toHaveBeenCalledWith(
            'ciudadano@test.com',
            'RDAM-2026-00001',
        );
    });

    it('ignora webhook idempotente cuando solicitud ya esta en estado terminal', async () => {
        mockSolicitudesRepository.findOne.mockResolvedValue({
            id: 'sol-2',
            codigo: 'RDAM-2026-00002',
            email: 'ciudadano@test.com',
            estado: EstadoSolicitud.PAGADA,
        });

        const result = await service.procesarWebhook({
            evento: 'PAGO_CONFIRMADO',
            referencia_interna: 'RDAM-2026-00002',
            referencia_pasarela: 'PAY-1',
            monto: 2500,
            metodo: 'TARJETA_CREDITO',
            timestamp: '2026-03-04T10:35:00.000Z',
        });

        expect(result.message).toContain('idempotente');
        expect(mockStateTransition.cambiarEstado).not.toHaveBeenCalled();
        expect(mockTransaccionesRepository.save).not.toHaveBeenCalled();
    });

    it('rechaza webhook cuando la solicitud no existe', async () => {
        mockSolicitudesRepository.findOne.mockResolvedValue(null);

        await expect(
            service.procesarWebhook({
                evento: 'PAGO_CONFIRMADO',
                referencia_interna: 'RDAM-2026-99999',
                referencia_pasarela: 'PAY-1',
                monto: 2500,
                metodo: 'TARJETA_CREDITO',
                timestamp: '2026-03-04T10:35:00.000Z',
            }),
        ).rejects.toThrow(BadRequestException);
    });
});
