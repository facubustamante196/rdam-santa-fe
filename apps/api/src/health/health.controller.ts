import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    /**
     * GET /health
     * Verifica que la DB y Redis estén conectados.
     */
    @Get()
    async check() {
        return this.healthService.check();
    }
}
