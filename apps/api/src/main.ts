import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { rawBody: true });

    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    const configService = app.get(ConfigService);
    const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3002');

    app.enableCors({
        origin: [frontendUrl, 'http://localhost:3003'],
        credentials: true,
    });

    const swaggerConfig = new DocumentBuilder()
        .setTitle('RDAM API')
        .setDescription(
            'Registro de Deudores Alimentarios Morosos - API del Poder Judicial de Santa Fe',
        )
        .setVersion('1.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'jwt-interno',
        )
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'jwt-ciudadano',
        )
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    const port = configService.get<number>('PORT', 3000);
    await app.listen(port);

    // eslint-disable-next-line no-console
    console.log(`RDAM API corriendo en: http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`Swagger docs en: http://localhost:${port}/docs`);
}

bootstrap();
