import {
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { SolicitudEntity, TransaccionPagoEntity } from '../database/entities';
import { EstadoPago, EstadoSolicitud } from '../database/enums';

@Injectable()
export class PagosService {
    private readonly logger = new Logger(PagosService.name);
    private readonly solicitudesRepository: Repository<SolicitudEntity>;
    private readonly transaccionesRepository: Repository<TransaccionPagoEntity>;
    private readonly pasarelaUrl: string;
    private readonly merchantGuid: string;
    private readonly secretKey: string;
    private readonly frontendBaseUrl: string;
    private readonly backendBaseUrl: string;
    private readonly montoBase: number;

    constructor(
        dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
        this.transaccionesRepository = dataSource.getRepository(TransaccionPagoEntity);
        this.pasarelaUrl = this.configService.get<string>(
            'PASARELA_API_URL',
            'http://localhost:3000',
        );
        this.merchantGuid = this.requireConfig('PASARELA_MERCHANT_GUID');
        this.secretKey = this.requireConfig('PASARELA_SECRET_KEY');
        this.frontendBaseUrl = this.configService.get<string>(
            'FRONTEND_URL',
            'http://localhost:3000',
        );
        this.backendBaseUrl = this.configService.get<string>(
            'BACKEND_PUBLIC_URL',
            `http://localhost:${this.configService.get<number>('PORT', 3001)}`,
        );
        this.montoBase = Number(
            this.configService.get<string>('PASARELA_MONTO_BASE', '2500'),
        );
    }

    async iniciarPagoCiudadano(codigoSolicitud: string, dniHash: string) {
        const solicitud = await this.solicitudesRepository.findOne({
            where: { codigo: codigoSolicitud },
            select: {
                id: true,
                codigo: true,
                dniHash: true,
                email: true,
                estado: true,
            },
        });

        if (!solicitud) {
            throw new NotFoundException('Solicitud no encontrada');
        }

        if (solicitud.dniHash !== dniHash) {
            throw new ForbiddenException(
                'La solicitud no corresponde a la identidad autenticada',
            );
        }

        if (solicitud.estado !== EstadoSolicitud.PENDIENTE_PAGO) {
            throw new ConflictException(
                `La solicitud no esta en estado PENDIENTE_PAGO. Estado actual: ${solicitud.estado}`,
            );
        }

        const monto = Number.isFinite(this.montoBase) ? this.montoBase : 2500;
        const montoCentavos = Math.round(monto * 100).toString();

        const callbackSuccess = `${this.backendBaseUrl}/webhooks/pago`;
        const callbackCancel = `${this.backendBaseUrl}/webhooks/pago`;
        const urlSuccess = `${this.frontendBaseUrl}/resultado-pago?codigo=${encodeURIComponent(solicitud.codigo)}&estado=success`;
        const urlError = `${this.frontendBaseUrl}/resultado-pago?codigo=${encodeURIComponent(solicitud.codigo)}&estado=error`;

        const informacionPayload = JSON.stringify({
            solicitudId: solicitud.id,
            codigo: solicitud.codigo,
            email: solicitud.email,
        });

        const checkoutFields = {
            Comercio: this.merchantGuid,
            TransaccionComercioId: solicitud.codigo,
            Monto: this.encryptForPasarela(montoCentavos),
            CallbackSuccess: this.encryptForPasarela(callbackSuccess),
            CallbackCancel: this.encryptForPasarela(callbackCancel),
            UrlSuccess: this.encryptForPasarela(urlSuccess),
            UrlError: this.encryptForPasarela(urlError),
            Informacion: this.encryptForPasarela(informacionPayload),
            'Producto[0]': 'Certificado RDAM',
            'MontoProducto[0]': montoCentavos,
        };

        const transaccion = this.transaccionesRepository.create({
            solicitudId: solicitud.id,
            monto: monto.toFixed(2),
            estado: EstadoPago.PENDIENTE,
            payloadPasarela: checkoutFields as unknown as Record<string, unknown>,
        });

        const saved = await this.transaccionesRepository.save(transaccion);

        this.logger.log(
            `Pago iniciado para solicitud ${solicitud.codigo}: transaccion ${saved.id}`,
        );

        return {
            transaccion_id: saved.id,
            url_pago: this.pasarelaUrl,
            monto,
            expira_en: 3600,
            metodo: 'POST',
            checkout_fields: checkoutFields,
        };
    }

    private encryptForPasarela(plainText: string): string {
        const key = createHash('sha256').update(this.secretKey).digest();
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-cbc', key, iv);
        const encrypted = Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final(),
        ]);
        return Buffer.concat([iv, encrypted]).toString('base64');
    }

    private requireConfig(key: string): string {
        const value = this.configService.get<string>(key);
        if (!value) {
            throw new Error(`${key} no configurado. Defina la variable de entorno.`);
        }
        return value;
    }
}
