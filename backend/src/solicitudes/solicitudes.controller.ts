import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SolicitudesService } from './solicitudes.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { OtpAuthGuard } from '../auth/guards/otp-auth.guard';

@ApiTags('Solicitudes')
@Controller('solicitudes')
export class SolicitudesController {
    constructor(private readonly solicitudesService: SolicitudesService) { }

    /**
     * POST /solicitudes — Crear solicitud (requiere JWT OTP ciudadano).
     */
    @Post()
    @UseGuards(OtpAuthGuard)
    @ApiBearerAuth('jwt-ciudadano')
    async crear(@Body() dto: CrearSolicitudDto, @Req() req: Request) {
        const ciudadano = (req as any).ciudadano;
        const ip = req.ip || req.socket.remoteAddress;

        return this.solicitudesService.crear(
            dto,
            ciudadano.dniHash,
            ciudadano.dniEncriptado,
            ciudadano.email,
            ip,
        );
    }

    /**
     * GET /solicitudes/mis-solicitudes — Historial de solicitudes del ciudadano (requiere JWT OTP).
     */
    @Get('mis-solicitudes')
    @UseGuards(OtpAuthGuard)
    @ApiBearerAuth('jwt-ciudadano')
    async misSolicitudes(@Req() req: Request) {
        const ciudadano = (req as any).ciudadano;
        return this.solicitudesService.buscarPorDniHash(ciudadano.dniHash);
    }

    /**
     * GET /solicitudes/:codigo — Consultar estado por código (público).
     */
    @Get(':codigo')
    async consultarPorCodigo(@Param('codigo') codigo: string) {
        return this.solicitudesService.buscarPorCodigo(codigo);
    }
}
