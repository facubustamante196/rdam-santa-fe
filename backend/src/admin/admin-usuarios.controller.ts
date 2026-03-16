import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../database/enums';
import { AdminService } from './admin.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

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

    /**
     * POST /admin/usuarios
     * Crear un nuevo operario. Solo SUPERVISOR.
     */
    @Post()
    @Roles(RolUsuario.SUPERVISOR)
    async crear(@Body() dto: CrearUsuarioDto) {
        return this.adminService.crearUsuario(dto);
    }

    /**
     * PATCH /admin/usuarios/:id
     * Actualizar datos de un usuario. Solo SUPERVISOR.
     */
    @Patch(':id')
    @Roles(RolUsuario.SUPERVISOR)
    async actualizar(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto) {
        return this.adminService.actualizarUsuario(id, dto);
    }
}
