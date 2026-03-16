import { IsString, IsEnum, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { RolUsuario, Circunscripcion } from '../../database/enums';

export class ActualizarUsuarioDto {
    @IsString()
    @IsOptional()
    nombreCompleto?: string;

    @IsString()
    @IsOptional()
    @MinLength(4)
    username?: string;

    @IsEnum(RolUsuario)
    @IsOptional()
    rol?: RolUsuario;

    @IsEnum(Circunscripcion)
    @IsOptional()
    circunscripcion?: Circunscripcion;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}
