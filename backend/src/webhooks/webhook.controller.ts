import {
    Controller,
    Post,
    Req,
    Headers,
    RawBodyRequest,
    UnauthorizedException,
    HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { WebhookService, WebhookPagoPayload } from './webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) { }

    /**
     * POST /webhooks/pago
     * Recibe notificaciones asíncronas de la pasarela de pago.
     * No requiere JWT — autenticado por firma HMAC.
     */
    @Post('pago')
    @HttpCode(200)
    async recibirPago(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-pasarela-signature') signature: string,
    ) {
        // 1. Validar firma HMAC del webhook
        const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);

        // En desarrollo, permitir sin firma
        const isDev = process.env.NODE_ENV === 'development';

        if (!isDev) {
            if (!signature) {
                throw new UnauthorizedException('Firma del webhook requerida');
            }

            const firmaValida = this.webhookService.validarFirma(rawBody, signature);
            if (!firmaValida) {
                throw new UnauthorizedException('Firma del webhook inválida');
            }
        }

        // 2. Procesar el webhook
        const payload: WebhookPagoPayload = req.body;
        const ip = req.ip || req.socket.remoteAddress;

        return this.webhookService.procesarWebhook(payload, ip);
    }
}
