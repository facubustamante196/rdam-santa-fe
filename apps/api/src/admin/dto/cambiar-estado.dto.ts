import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoSolicitud } from '../../database/enums';

export class CambiarEstadoDto {
    @IsEnum(EstadoSolicitud)
    estado!: EstadoSolicitud;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    observaciones?: string;
}
