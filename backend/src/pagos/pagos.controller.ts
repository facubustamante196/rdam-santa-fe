import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IniciarPagoDto } from './dto/iniciar-pago.dto';
import { PagosService } from './pagos.service';

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    @Post('iniciar')
    async iniciar(@Body() dto: IniciarPagoDto) {
        return this.pagosService.iniciarPagoCiudadano(
            dto.codigo_solicitud,
        );
    }
}
