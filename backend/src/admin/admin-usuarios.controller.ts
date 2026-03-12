import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../database/enums';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth('jwt-interno')
@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsuariosController {
    constructor(private readonly adminService: AdminService) { }

    /**
     * GET /admin/usuarios
     * Listar usuarios internos. Solo SUPERVISOR.
     */
    @Get()
    @Roles(RolUsuario.SUPERVISOR)
    async listar() {
        return this.adminService.listarUsuarios();
    }
}
