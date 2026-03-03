import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { TransaccionPagoEntity } from '../database/entities';
import { EstadoPago } from '../database/enums';

@Injectable()
export class PagosService {
    private readonly logger = new Logger(PagosService.name);
    private readonly transaccionesRepository: Repository<TransaccionPagoEntity>;
    private readonly pasarelaUrl: string;
    private readonly pasarelaApiKey: string;

    constructor(
        dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {
        this.transaccionesRepository = dataSource.getRepository(TransaccionPagoEntity);
        this.pasarelaUrl = this.configService.get<string>(
            'PASARELA_API_URL',
            'https://pasarela.proveedor.com',
        );
        this.pasarelaApiKey = this.configService.get<string>('PASARELA_API_KEY', '');
    }

    async iniciarPago(solicitudId: string, codigo: string, monto: number) {
        const transaccion = this.transaccionesRepository.create({
            solicitudId,
            monto: monto.toFixed(2),
            estado: EstadoPago.PENDIENTE,
        });

        const saved = await this.transaccionesRepository.save(transaccion);

        const urlPago =
            process.env.NODE_ENV === 'development'
                ? `http://localhost:3000/dev/simular-pago?codigo=${codigo}`
                : `${this.pasarelaUrl}/checkout?ref=${codigo}&amount=${monto}&key=${this.pasarelaApiKey}`;

        this.logger.log(
            `Pago iniciado para solicitud ${codigo}: transaccion ${saved.id}`,
        );

        return {
            transaccion_id: saved.id,
            url_pago: urlPago,
            monto,
        };
    }
}
