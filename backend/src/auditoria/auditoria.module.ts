import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaEntity } from '../database/entities';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AuditoriaEntity])],
    controllers: [AuditoriaController],
    providers: [AuditoriaService],
    exports: [AuditoriaService],
})
export class AuditoriaModule { }
