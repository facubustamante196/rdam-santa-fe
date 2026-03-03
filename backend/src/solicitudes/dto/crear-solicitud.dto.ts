import {
    IsString,
    IsEmail,
    IsDateString,
    IsEnum,
    Matches,
    Length,
} from 'class-validator';
import { Circunscripcion } from '../../database/enums';

export class CrearSolicitudDto {
    @IsString()
    @Length(10, 11, { message: 'CUIL debe tener entre 10 y 11 dígitos' })
    @Matches(/^\d{10,11}$/, { message: 'CUIL solo puede contener números' })
    cuil!: string;

    @IsString()
    @Length(3, 120, { message: 'Nombre completo debe tener entre 3 y 120 caracteres' })
    nombre_completo!: string;

    @IsDateString({}, { message: 'Fecha de nacimiento inválida (formato: YYYY-MM-DD)' })
    fecha_nacimiento!: string;

    @IsEmail({}, { message: 'Email inválido' })
    email!: string;

    @IsEnum(Circunscripcion, {
        message: 'Circunscripción inválida. Valores: SANTA_FE, ROSARIO, VENADO_TUERTO, RAFAELA, RECONQUISTA',
    })
    circunscripcion!: Circunscripcion;
}
