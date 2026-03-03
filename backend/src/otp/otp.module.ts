import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';

@Module({
    imports: [
        JwtModule.register({}), // Secret se pasa dinámicamente en OtpService
    ],
    controllers: [OtpController],
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule { }
