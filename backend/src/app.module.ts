import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeormDatabaseModule } from './database/typeorm.module';

// Módulos de infraestructura (globales)
import { EncryptionModule } from './encryption/encryption.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { CommonModule } from './common/common.module';
import { EmailModule } from './email/email.module';

// Módulos de autenticación
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';

// Módulos de negocio
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { AdminModule } from './admin/admin.module';
import { PagosModule } from './pagos/pagos.module';
import { WebhookModule } from './webhooks/webhook.module';
import { EmisionModule } from './emision/emision.module';
import { DashboardModule } from './dashboard/dashboard.module';

// Módulos de sistema
import { CronModule } from './cron/cron.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        // Configuración global desde .env
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Rate limiting global
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 60000,
                limit: 20,
            },
        ]),

        // Scheduler para cron jobs
        ScheduleModule.forRoot(),

        // Infraestructura (globales)
        TypeormDatabaseModule,
        EncryptionModule,
        AuditoriaModule,
        CommonModule,
        EmailModule,

        // Autenticación
        AuthModule,
        OtpModule,

        // Negocio
        SolicitudesModule,
        AdminModule,
        PagosModule,
        WebhookModule,
        EmisionModule,
        DashboardModule,

        // Sistema
        CronModule,
        HealthModule,
    ],
})
export class AppModule { }
