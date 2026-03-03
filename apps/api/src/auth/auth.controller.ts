import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        const ip = req.ip || req.socket.remoteAddress;
        return this.authService.login(dto, ip);
    }
}
