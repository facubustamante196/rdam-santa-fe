import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';

@Module({
    imports: [JwtModule.register({})],
    controllers: [PagosController],
    providers: [PagosService],
    exports: [PagosService],
})
export class PagosModule { }
