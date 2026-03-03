import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';
        let error = 'INTERNAL_SERVER_ERROR';
        let errors: string[] | undefined;

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else {
                const payload = exceptionResponse as Record<string, unknown>;

                if (typeof payload.error === 'string') {
                    error = payload.error.toUpperCase().replace(/\s+/g, '_');
                }

                if (Array.isArray(payload.message)) {
                    message = 'Error de validacion';
                    errors = payload.message.map((item) => String(item));
                } else if (typeof payload.message === 'string') {
                    message = payload.message;
                }
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        if (statusCode >= 500) {
            this.logger.error(
                `${request.method} ${request.url} -> ${statusCode}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
        }

        response.status(statusCode).json({
            success: false,
            statusCode,
            error,
            message,
            errors,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
