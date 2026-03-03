import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { HealthController } from '../../src/health/health.controller';
import { HealthService } from '../../src/health/health.service';

describe('Health (e2e)', () => {
    let app: INestApplication;

    const healthResponse = {
        status: 'ok',
        timestamp: '2026-01-01T00:00:00.000Z',
        services: {
            database: { status: 'up', latency: 1 },
            redis: { status: 'up', latency: 1 },
        },
    };

    const mockHealthService = {
        check: jest.fn().mockResolvedValue(healthResponse),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [{ provide: HealthService, useValue: mockHealthService }],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/health (GET)', async () => {
        const res = await request(app.getHttpServer()).get('/health').expect(200);

        expect(res.body).toEqual(healthResponse);
        expect(mockHealthService.check).toHaveBeenCalledTimes(1);
    });
});
