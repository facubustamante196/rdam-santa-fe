import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: nodemailer.Transporter;
    private readonly fromAddress: string;

    constructor(private readonly configService: ConfigService) {
        this.fromAddress = this.configService.get<string>(
            'EMAIL_FROM',
            'noreply@rdam.justiciasantafe.gov.ar',
        );

        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('EMAIL_HOST', 'smtp.example.com'),
            port: this.configService.get<number>('EMAIL_PORT', 587),
            secure: false,
            auth: {
                user: this.configService.get<string>('EMAIL_USER', ''),
                pass: this.configService.get<string>('EMAIL_PASS', ''),
            },
        });
    }

    /**
     * Envía el código OTP al ciudadano.
     */
    async enviarOtp(email: string, codigo: string, ttlMinutos: number) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1a365d;">RDAM — Código de Verificación</h2>
        <p>Su código de verificación es:</p>
        <div style="background: #edf2f7; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2d3748;">${codigo}</span>
        </div>
        <p style="color: #718096; font-size: 14px;">
          Este código expira en <strong>${ttlMinutos} minutos</strong>.<br>
          Si usted no solicitó este código, ignore este email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #a0aec0; font-size: 12px;">
          Poder Judicial de la Provincia de Santa Fe<br>
          Registro de Deudores Alimentarios Morosos
        </p>
      </div>
    `;

        return this.enviar({
            to: email,
            subject: 'RDAM — Código de Verificación OTP',
            html,
        });
    }

    /**
     * Notifica al ciudadano que su pago fue confirmado.
     */
    async enviarConfirmacionPago(email: string, codigo: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #276749;">✅ Pago Confirmado</h2>
        <p>Su pago para la solicitud <strong>${codigo}</strong> ha sido confirmado.</p>
        <p>El certificado será procesado y recibirá una notificación cuando esté disponible para descargar.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #a0aec0; font-size: 12px;">
          Poder Judicial de la Provincia de Santa Fe — RDAM
        </p>
      </div>
    `;

        return this.enviar({
            to: email,
            subject: `RDAM — Pago Confirmado (${codigo})`,
            html,
        });
    }

    /**
     * Notifica al ciudadano que su certificado está listo para descargar.
     */
    async enviarCertificadoListo(email: string, codigo: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2b6cb0;">📄 Certificado Disponible</h2>
        <p>Su certificado para la solicitud <strong>${codigo}</strong> ya está disponible.</p>
        <p>Ingrese al portal con su DNI y código OTP para descargar el PDF.</p>
        <div style="background: #ebf8ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>Código de solicitud:</strong> ${codigo}<br>
          <strong>Vigencia:</strong> 90 días desde la emisión
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #a0aec0; font-size: 12px;">
          Poder Judicial de la Provincia de Santa Fe — RDAM
        </p>
      </div>
    `;

        return this.enviar({
            to: email,
            subject: `RDAM — Certificado Disponible (${codigo})`,
            html,
        });
    }

    /**
     * Notifica que el pago fue rechazado.
     */
    async enviarPagoRechazado(email: string, codigo: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #c53030;">❌ Pago Rechazado</h2>
        <p>El pago para la solicitud <strong>${codigo}</strong> fue rechazado por la entidad bancaria.</p>
        <p>Puede reintentar el pago ingresando al portal con su DNI y código OTP.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #a0aec0; font-size: 12px;">
          Poder Judicial de la Provincia de Santa Fe — RDAM
        </p>
      </div>
    `;

        return this.enviar({
            to: email,
            subject: `RDAM — Pago Rechazado (${codigo})`,
            html,
        });
    }

    /**
     * Método base para enviar emails. En desarrollo solo logea.
     */
    private async enviar(options: EmailOptions) {
        try {
            const isDev = this.configService.get('NODE_ENV') === 'development';

            if (isDev) {
                this.logger.log(
                    `📧 [DEV] Email a ${options.to}: "${options.subject}"`,
                );
                return { messageId: 'dev-mode', accepted: [options.to] };
            }

            const result = await this.transporter.sendMail({
                from: this.fromAddress,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });

            this.logger.log(`📧 Email enviado a ${options.to}: ${result.messageId}`);
            return result;
        } catch (error) {
            this.logger.error(`❌ Error enviando email a ${options.to}: ${error}`);
            // No lanzamos error — los emails no deben bloquear el flujo principal
        }
    }
}
