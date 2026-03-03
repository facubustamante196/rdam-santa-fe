import {
    Controller,
    Get,
    Patch,
    Post,
    Param,
    Body,
    Query,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StateTransitionService } from '../common/services/state-transition.service';
import { EmisionService } from '../emision/emision.service';
import { ActorTipo, EstadoSolicitud, RolUsuario } from '../database/enums';
import { AsignarOperarioDto } from './dto/asignar-operario.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { ListarSolicitudesQueryDto } from './dto/listar-solicitudes.query.dto';

@ApiTags('Admin')
@ApiBearerAuth('jwt-interno')
@Controller('admin/solicitudes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly stateTransition: StateTransitionService,
        private readonly emisionService: EmisionService,
    ) { }

    /**
     * GET /admin/solicitudes
     * Lista paginada con filtros. Operario y Supervisor.
     */
    @Get()
    async listar(@Query() query: ListarSolicitudesQueryDto) {
        return this.adminService.listarSolicitudes(query);
    }

    /**
     * GET /admin/solicitudes/:id
     * Detalle de una solicitud. Operario y Supervisor.
     */
    @Get(':id')
    async detalle(@Param('id') id: string) {
        const solicitud = await this.adminService.obtenerDetalle(id);
        if (!solicitud) {
            throw new NotFoundException('Solicitud no encontrada');
        }
        return solicitud;
    }

    /**
     * PATCH /admin/solicitudes/:id/asignar
     * Asigna un operario a la solicitud. Operario y Supervisor.
     */
    @Patch(':id/asignar')
    async asignar(
        @Param('id') id: string,
        @Body() dto: AsignarOperarioDto,
        @Req() req: Request,
    ) {
        return this.adminService.asignarOperario(id, dto.operario_id, (req as any).user);
    }

    /**
     * PATCH /admin/solicitudes/:id/estado
     * Cambia el estado de una solicitud. SUPERVISOR ONLY.
     */
    @Patch(':id/estado')
    @Roles(RolUsuario.SUPERVISOR)
    async cambiarEstado(
        @Param('id') id: string,
        @Body() dto: CambiarEstadoDto,
        @Req() req: Request,
    ) {
        const user = (req as any).user;
        const ip = req.ip || req.socket.remoteAddress;

        return this.stateTransition.cambiarEstado({
            solicitudId: id,
            nuevoEstado: dto.estado as EstadoSolicitud,
            actorTipo: ActorTipo.SUPERVISOR,
            usuarioId: user.id,
            observaciones: dto.observaciones,
            forzado: true,
            ipOrigen: ip,
        });
    }

    /**
     * POST /admin/solicitudes/:id/pdf
     * Sube un certificado PDF. Operario y Supervisor.
     * Requiere estado PAGADA.
     */
    @Post(':id/pdf')
    @UseInterceptors(FileInterceptor('archivo'))
    async cargarPdf(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request,
    ) {
        const user = (req as any).user;
        const ip = req.ip || req.socket.remoteAddress;

        return this.emisionService.emitirCertificado(
            id,
            file,
            user.id,
            user.rol,
            ip,
        );
    }
}
