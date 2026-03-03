import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';

@Module({
    providers: [PagosService],
    exports: [PagosService],
})
export class PagosModule { }
