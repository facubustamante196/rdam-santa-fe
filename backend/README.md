# RDAM API (Backend)

API NestJS para el sistema RDAM.

## Requisitos

- Node.js 20.x
- npm 10.x o superior
- PostgreSQL 14+ (recomendado 15/16)
- Redis 7+

## Instalación

```bash
npm install
```

## Configuración de entorno

1. Copiar variables de ejemplo:

```bash
cp .env.example .env
```

2. Completar valores obligatorios en `.env`:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `OTP_JWT_SECRET`
- `ENCRYPTION_KEY` (64 chars hex)
- `DNI_HASH_SALT`
- `PASARELA_MERCHANT_GUID`
- `PASARELA_SECRET_KEY`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

3. CAPTCHA (opcional en local, recomendado en ambientes reales):

- `CAPTCHA_ENABLED=true|false`
- `CAPTCHA_SECRET_KEY`
- `CAPTCHA_MIN_SCORE`

## Migraciones y seed

Este repositorio actualmente no incluye migraciones TypeORM versionadas.

- En desarrollo local, para crear/actualizar esquema automáticamente, usar:
  - `DB_SYNCHRONIZE=true`
- En staging/producción, mantener:
  - `DB_SYNCHRONIZE=false`

Seed de datos (usuarios iniciales):

```bash
npm run seed
```

## Levantar servidor

Desarrollo:

```bash
npm run start:dev
```

Producción:

```bash
npm run build
npm run start:prod
```

## Tests

```bash
npm run test:unit
```

