# RDAM - Sistema de Certificados Digitales

Sistema web para gestion digital de certificados del Registro de Deudores Alimentarios Morosos del Poder Judicial de la Provincia de Santa Fe.

## Stack Tecnologico

- Backend: Node.js, NestJS, PostgreSQL, TypeORM, Redis
- Frontend: Next.js (React), Tailwind CSS
- Infraestructura: Docker, Kubernetes, MinIO (S3 compatible)

## Estructura del Proyecto

- `Backend/` - API en NestJS
- `Frontend/ciudadano/` - Portal ciudadano (Next.js)
- `Frontend/operario/` - Backoffice operario (Next.js)
- `docs/` - Documentacion del proyecto
- `infrastructure/` - Configuracion de despliegue (Docker, K8s)
- `poc/` - Pruebas de concepto
- `scripts/` - Scripts de utilidad

## Documentacion

## Documentación de la API

Una vez levantado el servidor localmente, la documentación interactiva de la API está disponible en:

`http://localhost:3000/docs`

Para entender el proyecto, recomendamos leer en este orden:

1. `docs/01-ALCANCE.md`
2. `docs/02-DIAGRAMAS.md`
3. `docs/03-SPEC.md`
4. `docs/04-API.md`
5. `docs/05-IMPLEMENTACION.md`

Indice general: `docs/README.md`.

## Setup Inicial

```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Levantar servicios de infraestructura (DB, Redis, S3)
docker-compose up -d

# 3. Instalar dependencias en cada aplicacion
# (ver README especifico de cada app)
```
