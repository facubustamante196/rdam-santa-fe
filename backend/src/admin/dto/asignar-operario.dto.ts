import { IsUUID } from 'class-validator';

export class AsignarOperarioDto {
    @IsUUID('4')
    operario_id!: string;
}
