import { IsString, IsOptional, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class ConsultaStatusDto {
    @IsString()
    @IsOptional()
    codigo?: string;

    @IsString()
    @IsOptional()
    @MinLength(7)
    @MaxLength(8)
    @Matches(/^\d+$/)
    dni?: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}
