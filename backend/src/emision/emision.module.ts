import { Module } from '@nestjs/common';
import { EmisionService } from './emision.service';

@Module({
    providers: [EmisionService],
    exports: [EmisionService],
})
export class EmisionModule { }
