import { IsString, IsEmail, Length, Matches } from 'class-validator';

export class SolicitarOtpDto {
    @IsString()
    @Length(7, 8, { message: 'DNI debe tener entre 7 y 8 dígitos' })
    @Matches(/^\d{7,8}$/, { message: 'DNI solo puede contener números' })
    dni!: string;

    @IsEmail({}, { message: 'Email inválido' })
    email!: string;
}

export class ValidarOtpDto {
    @IsString()
    @Length(7, 8)
    @Matches(/^\d{7,8}$/, { message: 'DNI solo puede contener números' })
    dni!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @Length(6, 6, { message: 'El código OTP debe ser de 6 dígitos' })
    @Matches(/^\d{6}$/, { message: 'El código OTP solo puede contener números' })
    codigo!: string;
}

export class ReenviarOtpDto {
    @IsString()
    @Length(7, 8)
    @Matches(/^\d{7,8}$/, { message: 'DNI solo puede contener números' })
    dni!: string;

    @IsEmail()
    email!: string;
}
