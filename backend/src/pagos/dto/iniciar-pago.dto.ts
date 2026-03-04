import { IsNotEmpty, IsString } from 'class-validator';

export class IniciarPagoDto {
    @IsString()
    @IsNotEmpty()
    codigo_solicitud!: string;
}
