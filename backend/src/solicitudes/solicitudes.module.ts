import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { EmisionModule } from '../emision/emision.module';

@Module({
    imports: [
        JwtModule.register({}),
        EmisionModule,
    ],
    controllers: [SolicitudesController],
    providers: [SolicitudesService],
    exports: [SolicitudesService],
})
export class SolicitudesModule { }
