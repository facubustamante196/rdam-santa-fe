import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { EmisionService } from './emision.service';

@Module({
    imports: [EmailModule],
    providers: [EmisionService],
    exports: [EmisionService],
})
export class EmisionModule { }
