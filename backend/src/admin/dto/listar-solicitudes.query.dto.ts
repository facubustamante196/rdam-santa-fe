import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
} from 'class-validator';
import { Circunscripcion, EstadoSolicitud } from '../../database/enums';

export class ListarSolicitudesQueryDto {
    @IsOptional()
    @IsEnum(EstadoSolicitud)
    estado?: EstadoSolicitud;

    @IsOptional()
    @IsEnum(Circunscripcion)
    circunscripcion?: Circunscripcion;

    @IsOptional()
    @IsDateString()
    fecha_desde?: string;

    @IsOptional()
    @IsDateString()
    fecha_hasta?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{7,8}$/)
    dni?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
