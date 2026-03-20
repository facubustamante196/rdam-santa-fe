import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../database/enums';

@ApiTags('Admin')
@ApiBearerAuth('jwt-interno')
@Controller('admin/auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditoriaController {
    constructor(private readonly auditoriaService: AuditoriaService) { }

    @Get()
    @Roles(RolUsuario.SUPERVISOR, RolUsuario.OPERARIO)
    async listar(
        @Query('solicitud_id') solicitudId?: string,
        @Query('usuario_id') usuarioId?: string,
        @Query('accion') accion?: string,
        @Query('desde') desde?: string,
        @Query('hasta') hasta?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.auditoriaService.listar({
            solicitudId,
            usuarioId,
            accion,
            desde,
            hasta,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        });
    }
}
