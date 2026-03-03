import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaEntity } from '../database/entities';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AuditoriaEntity])],
    providers: [AuditoriaService],
    exports: [AuditoriaService],
})
export class AuditoriaModule { }
