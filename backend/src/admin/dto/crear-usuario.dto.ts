import { IsString, IsEnum, MinLength } from 'class-validator';
import { RolUsuario, Circunscripcion } from '../../database/enums';

export class CrearUsuarioDto {
    @IsString()
    @MinLength(4)
    username!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsString()
    nombreCompleto!: string;

    @IsEnum(Circunscripcion)
    circunscripcion!: Circunscripcion;
}
