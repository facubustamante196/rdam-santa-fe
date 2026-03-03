import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
    async solicitar(@Body() dto: SolicitarOtpDto) {
        return this.otpService.solicitar(dto.dni, dto.email);
    }

    @Post('validar')
    async validar(@Body() dto: ValidarOtpDto) {
        return this.otpService.validar(dto.dni, dto.email, dto.codigo);
    }

    @Post('reenviar')
    async reenviar(@Body() dto: ReenviarOtpDto) {
        return this.otpService.reenviar(dto.dni, dto.email);
    }
}
