import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';

@Module({
    imports: [JwtModule.register({})],
    controllers: [SolicitudesController],
    providers: [SolicitudesService],
    exports: [SolicitudesService],
})
export class SolicitudesModule { }
