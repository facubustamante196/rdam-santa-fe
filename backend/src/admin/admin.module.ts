import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminUsuariosController } from './admin-usuarios.controller';
import { EmisionModule } from '../emision/emision.module';

@Module({
    imports: [EmisionModule],
    controllers: [AdminController, AdminUsuariosController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule { }
