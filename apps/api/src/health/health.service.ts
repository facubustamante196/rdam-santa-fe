import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);
    private readonly redis: Redis;

    constructor(
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {
        this.redis = new Redis(
            this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        );
    }

    async check() {
        const results = {
            status: 'ok' as 'ok' | 'degraded' | 'down',
            timestamp: new Date().toISOString(),
            services: {
                database: { status: 'unknown' as string, latency: 0 },
                redis: { status: 'unknown' as string, latency: 0 },
            },
        };

        try {
            const start = Date.now();
            await this.dataSource.query('SELECT 1');
            results.services.database = {
                status: 'up',
                latency: Date.now() - start,
            };
        } catch (error) {
            results.services.database = { status: 'down', latency: 0 };
            results.status = 'degraded';
            this.logger.error(`Health check DB failed: ${error}`);
        }

        try {
            const start = Date.now();
            await this.redis.ping();
            results.services.redis = {
                status: 'up',
                latency: Date.now() - start,
            };
        } catch (error) {
            results.services.redis = { status: 'down', latency: 0 };
            results.status = 'degraded';
            this.logger.error(`Health check Redis failed: ${error}`);
        }

        if (
            results.services.database.status === 'down' &&
            results.services.redis.status === 'down'
        ) {
            results.status = 'down';
        }

        return results;
    }
}
