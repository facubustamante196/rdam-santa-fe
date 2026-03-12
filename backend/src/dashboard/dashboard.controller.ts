import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService, DashboardStats } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Circunscripcion, RolUsuario } from '../database/enums';

@ApiTags('Dashboard')
@ApiBearerAuth('jwt-interno')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    /**
     * GET /admin/dashboard
     * Estadísticas generales para el backoffice.
     * Opcionalmente filtrar por circunscripción.
     */
    @Get()
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERARIO)
    async stats(
        @Query('circunscripcion') circunscripcion?: Circunscripcion,
        @Req() req?: any,
    ): Promise<DashboardStats> {
        const user = req?.user;
        const filtro =
            user?.rol === RolUsuario.OPERARIO
                ? user.circunscripcion
                : circunscripcion;

        return this.dashboardService.obtenerStats(filtro);
    }
}
