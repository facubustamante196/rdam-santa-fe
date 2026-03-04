import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OtpAuthGuard } from '../auth/guards/otp-auth.guard';
import { IniciarPagoDto } from './dto/iniciar-pago.dto';
import { PagosService } from './pagos.service';

interface CiudadanoAuth {
    dniHash: string;
}

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    @Post('iniciar')
    @UseGuards(OtpAuthGuard)
    @ApiBearerAuth('jwt-ciudadano')
    async iniciar(@Body() dto: IniciarPagoDto, @Req() req: Request) {
        const ciudadano = (req as Request & { ciudadano: CiudadanoAuth }).ciudadano;
        return this.pagosService.iniciarPagoCiudadano(
            dto.codigo_solicitud,
            ciudadano.dniHash,
        );
    }
}
