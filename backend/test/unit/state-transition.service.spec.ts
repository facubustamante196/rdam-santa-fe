import { Test, TestingModule } from '@nestjs/testing';
import {
    ForbiddenException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StateTransitionService } from '../../src/common/services/state-transition.service';
import { AuditoriaService } from '../../src/auditoria/auditoria.service';
import { ActorTipo, EstadoSolicitud } from '../../src/database/enums';

const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
};

const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
};

const mockAuditoria = {
    registrar: jest.fn(),
};

describe('StateTransitionService', () => {
    let service: StateTransitionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StateTransitionService,
                { provide: DataSource, useValue: mockDataSource },
                { provide: AuditoriaService, useValue: mockAuditoria },
            ],
        }).compile();

        service = module.get<StateTransitionService>(StateTransitionService);
        jest.clearAllMocks();
    });

    describe('cambiarEstado', () => {
        it('permite una transicion normal PENDIENTE_PAGO -> PAGADA', async () => {
            mockRepository.findOne.mockResolvedValue({
                id: '1',
                estado: EstadoSolicitud.PENDIENTE_PAGO,
            });
            mockRepository.save.mockResolvedValue({
                id: '1',
                estado: EstadoSolicitud.PAGADA,
            });

            const result = await service.cambiarEstado({
                solicitudId: '1',
                nuevoEstado: EstadoSolicitud.PAGADA,
                actorTipo: ActorTipo.WEBHOOK,
            });

            expect(result.estado).toBe(EstadoSolicitud.PAGADA);
            expect(mockAuditoria.registrar).toHaveBeenCalledTimes(1);
        });

        it('rechaza una transicion prohibida PENDIENTE_PAGO -> EMITIDA', async () => {
            mockRepository.findOne.mockResolvedValue({
                id: '2',
                estado: EstadoSolicitud.PENDIENTE_PAGO,
            });

            await expect(
                service.cambiarEstado({
                    solicitudId: '2',
                    nuevoEstado: EstadoSolicitud.EMITIDA,
                    actorTipo: ActorTipo.OPERARIO,
                }),
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('rechaza transicion forzable si no es supervisor', async () => {
            mockRepository.findOne.mockResolvedValue({
                id: '3',
                estado: EstadoSolicitud.RECHAZADA,
            });

            await expect(
                service.cambiarEstado({
                    solicitudId: '3',
                    nuevoEstado: EstadoSolicitud.PENDIENTE_PAGO,
                    actorTipo: ActorTipo.OPERARIO,
                    forzado: true,
                    observaciones: 'Intento no autorizado',
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('permite transicion forzada por supervisor con observaciones', async () => {
            mockRepository.findOne.mockResolvedValue({
                id: '4',
                estado: EstadoSolicitud.RECHAZADA,
            });
            mockRepository.save.mockResolvedValue({
                id: '4',
                estado: EstadoSolicitud.PENDIENTE_PAGO,
            });

            const result = await service.cambiarEstado({
                solicitudId: '4',
                nuevoEstado: EstadoSolicitud.PENDIENTE_PAGO,
                actorTipo: ActorTipo.SUPERVISOR,
                forzado: true,
                observaciones: 'Correccion por revision manual',
            });

            expect(result.estado).toBe(EstadoSolicitud.PENDIENTE_PAGO);
            expect(mockAuditoria.registrar).toHaveBeenCalledWith(
                expect.objectContaining({ forzadoSupervisor: true }),
            );
        });

        it('lanza error cuando la solicitud no existe', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(
                service.cambiarEstado({
                    solicitudId: 'no-existe',
                    nuevoEstado: EstadoSolicitud.PAGADA,
                    actorTipo: ActorTipo.WEBHOOK,
                }),
            ).rejects.toThrow(UnprocessableEntityException);
        });
    });

    describe('esTransicionValida', () => {
        it('retorna true para transicion normal', () => {
            expect(
                service.esTransicionValida(
                    EstadoSolicitud.PENDIENTE_PAGO,
                    EstadoSolicitud.PAGADA,
                ),
            ).toBe(true);
        });

        it('retorna false para transicion prohibida', () => {
            expect(
                service.esTransicionValida(
                    EstadoSolicitud.PENDIENTE_PAGO,
                    EstadoSolicitud.EMITIDA,
                ),
            ).toBe(false);
        });

        it('retorna true para transicion forzable con supervisor', () => {
            expect(
                service.esTransicionValida(
                    EstadoSolicitud.RECHAZADA,
                    EstadoSolicitud.PENDIENTE_PAGO,
                    true,
                ),
            ).toBe(true);
        });
    });
});
