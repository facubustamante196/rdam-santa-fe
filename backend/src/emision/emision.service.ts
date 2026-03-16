import {
    Injectable,
    Logger,
    UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DataSource, Repository } from 'typeorm';
import { StateTransitionService } from '../common/services/state-transition.service';
import { EmailService } from '../email/email.service';
import { SolicitudEntity } from '../database/entities';
import { ActorTipo, EstadoSolicitud } from '../database/enums';

@Injectable()
export class EmisionService {
    private readonly logger = new Logger(EmisionService.name);
    private readonly solicitudesRepository: Repository<SolicitudEntity>;
    private readonly s3Client: S3Client;
    private readonly bucket: string;

    constructor(
        dataSource: DataSource,
        private readonly configService: ConfigService,
        private readonly stateTransition: StateTransitionService,
        private readonly emailService: EmailService,
    ) {
        this.solicitudesRepository = dataSource.getRepository(SolicitudEntity);
        this.bucket = this.configService.get<string>('S3_BUCKET', 'rdam-documents');
        const accessKeyId = this.requireConfig('S3_ACCESS_KEY');
        const secretAccessKey = this.requireConfig('S3_SECRET_KEY');

        this.s3Client = new S3Client({
            endpoint: this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000'),
            region: this.configService.get<string>('S3_REGION', 'us-east-1'),
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle: true,
        });
    }

    async emitirCertificado(
        solicitudId: string,
        file: Express.Multer.File,
        usuarioId: string,
        actorTipo: ActorTipo.OPERARIO | ActorTipo.SUPERVISOR,
        ipOrigen?: string,
    ) {
        const solicitud = await this.solicitudesRepository.findOne({
            where: { id: solicitudId },
        });

        if (!solicitud) {
            throw new UnprocessableEntityException('Solicitud no encontrada');
        }

        if (!file) {
            throw new UnprocessableEntityException('No se ha recibido ningún archivo');
        }

        if (solicitud.estado !== EstadoSolicitud.PAGADA) {
            throw new UnprocessableEntityException(
                `Solo se puede emitir un certificado en estado PAGADA. Estado actual: ${solicitud.estado}`,
            );
        }

        if (!file.mimetype || file.mimetype !== 'application/pdf') {
            throw new UnprocessableEntityException('Solo se permiten archivos PDF');
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new UnprocessableEntityException('El archivo no puede superar los 5MB');
        }

        const year = new Date().getFullYear();
        const storageKey = `certs/${year}/${solicitud.circunscripcion}/${solicitud.codigo}.pdf`;

        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: storageKey,
                Body: file.buffer,
                ContentType: 'application/pdf',
            }),
        );

        solicitud.pdfStorageKey = storageKey;
        solicitud.pdfUrl = storageKey;
        await this.solicitudesRepository.save(solicitud);

        await this.stateTransition.cambiarEstado({
            solicitudId,
            nuevoEstado: EstadoSolicitud.EMITIDA,
            actorTipo,
            usuarioId,
            observaciones: `Certificado PDF cargado: ${storageKey}`,
            ipOrigen,
        });

        this.logger.log(
            `Certificado emitido para solicitud ${solicitud.codigo}: ${storageKey}`,
        );

        // Enviar email al ciudadano con el PDF adjunto
        await this.emailService.enviarCertificadoConAdjunto(
            solicitud.email,
            solicitud.codigo,
            file.buffer,
        );

        return {
            message: 'Certificado emitido exitosamente',
            codigo: solicitud.codigo,
            estado: EstadoSolicitud.EMITIDA,
        };
    }

    async generarUrlDescarga(solicitudId: string) {
        const solicitud = await this.solicitudesRepository.findOne({
            where: { id: solicitudId },
        });

        if (!solicitud) {
            throw new UnprocessableEntityException('Solicitud no encontrada');
        }

        if (solicitud.estado === EstadoSolicitud.PUBLICADO_VENCIDO) {
            throw new UnprocessableEntityException(
                'El certificado ha vencido. Debe solicitar uno nuevo.',
            );
        }

        if (solicitud.estado !== EstadoSolicitud.EMITIDA) {
            throw new UnprocessableEntityException(
                'El certificado aun no esta disponible para descarga',
            );
        }

        if (!solicitud.pdfStorageKey) {
            throw new UnprocessableEntityException(
                'No se encontro el archivo del certificado',
            );
        }

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: solicitud.pdfStorageKey,
        });

        const url = await getSignedUrl(this.s3Client, command, {
            expiresIn: 900,
        });

        return {
            url,
            expires_in: 900,
            codigo: solicitud.codigo,
        };
    }

    private requireConfig(key: string): string {
        const value = this.configService.get<string>(key);
        if (!value) {
            throw new Error(`${key} no configurado. Defina la variable de entorno.`);
        }
        return value;
    }
}
