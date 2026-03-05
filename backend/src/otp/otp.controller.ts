import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { OtpService } from './otp.service';
import {
    SolicitarOtpDto,
    ValidarOtpDto,
    ReenviarOtpDto,
} from './dto/otp.dto';

@ApiTags('OTP')
@Controller('auth/otp')
export class OtpController {
    constructor(private readonly otpService: OtpService) { }

    @Post('solicitar')
    async solicitar(@Body() dto: SolicitarOtpDto, @Req() req: Request) {
        return this.otpService.solicitar(
            dto.dni,
            dto.email,
            dto.captchaToken,
            req.ip,
        );
    }

    @Post('validar')
    async validar(@Body() dto: ValidarOtpDto) {
        return this.otpService.validar(dto.dni, dto.email, dto.codigo);
    }

    @Post('reenviar')
    async reenviar(@Body() dto: ReenviarOtpDto, @Req() req: Request) {
        return this.otpService.reenviar(
            dto.dni,
            dto.email,
            dto.captchaToken,
            req.ip,
        );
    }
}
