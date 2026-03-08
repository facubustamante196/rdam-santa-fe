# GUÍA DE IMPLEMENTACIÓN — RDAM
## Poder Judicial de Santa Fe · Nivel 2
**Version:** 2.1 - Alineado con ALCANCE/SPEC v2.1 (TypeORM + JWT/OTP + Cron Jobs)

> **Cambios v2.1:** Persistencia migrada a TypeORM (sin Prisma), entidades con decoradores/relaciones, Passport-JWT con guards de rol, Swagger en `/docs`, y manejo uniforme de errores con Global Exception Filter.

---

## 1. Visión General

El sistema RDAM se compone de tres capas principales:
- **Frontend Portal Ciudadano** — SPA pública (Next.js o React + Vite)
- **Frontend Backoffice** — SPA con autenticación JWT (React + React Router)
- **Backend API** — REST API (Node.js/Express o NestJS) + PostgreSQL + S3

Ambos frontends consumen la misma API backend. El portal ciudadano requiere validación OTP (JWT de sesión corta) y rate limiting. El backoffice requiere JWT con roles (Operario / Supervisor).

---

## 2. Stack Tecnológico Recomendado

### Backend
- **Runtime:** Node.js 20+ con TypeScript
- **Framework:** NestJS (recomendado por estructura modular) o Express
- **ORM:** TypeORM (PostgreSQL)
- **Base de datos:** PostgreSQL 15+
- **Almacenamiento PDF:** AWS S3 o MinIO (self-hosted)
- **Email:** Nodemailer + SendGrid o AWS SES
- **Auth:** JWT (jsonwebtoken) + bcrypt para passwords + Redis para sesiones OTP
- **Cache / OTP:** Redis (TTL para tokens OTP)
- **Anti-bot:** CAPTCHA validado server-side antes de emitir/reenviar OTP
- **Scheduler:** node-cron o BullMQ para jobs de vencimiento
- **Validación:** class-validator / zod
- **Testing:** Jest + Supertest

### Frontend
- **Framework:** Next.js 14+ (App Router) o React + Vite
- **Estilos:** Tailwind CSS
- **Estado:** React Query (TanStack) para datos server-side
- **Formularios:** React Hook Form + zod
- **HTTP:** Axios o fetch nativo

### Infraestructura
- **Contenedores:** Docker + Docker Compose (dev), Kubernetes u ECS (prod)
- **CI/CD:** GitHub Actions o GitLab CI
- **Ambientes:** develop, staging, production
- **Redis:** `redis:7` en Docker Compose para OTP sessions y cache

---

## 3. Plan de Sprints

### Sprint 0 — Setup (1 semana)
**Objetivo:** Infraestructura base lista y equipos alineados.

- [ ] Crear repositorios (monorepo o repos separados)
- [ ] Configurar Docker Compose local (API + Postgres + MinIO)
- [ ] Definir estructura de carpetas del proyecto
- [ ] Configurar ESLint, Prettier, Husky
- [ ] Crear ambientes develop y staging
- [ ] Definir variables de entorno y secrets (ver sección 5)
- [ ] Integrar pipeline CI básico (build + lint)
- [ ] Reunión de definición de monto del certificado (pendiente)
- [ ] Reunión de integración con proveedor de pasarela de pago

---

### Sprint 1 — Fundaciones + OTP (2 semanas)
**HUs:** HU-C01, HU-C02, HU-O01
**Objetivo:** OTP ciudadano funcional, solicitud básica y autenticación interna funcionando.

**Backend:**
- [ ] Migraciones de base de datos (tablas: `solicitudes`, `usuarios`, `auditoria`, `transacciones_pago`, `otp_tokens`)
- [ ] Módulo OTP: `POST /auth/otp/solicitar`, `POST /auth/otp/validar`, `POST /auth/otp/reenviar`
- [ ] Integración Redis para sesiones OTP (TTL 10 minutos, máx 3 intentos)
- [ ] Módulo de autenticación interna (login, JWT, refresh token)
- [ ] Endpoint `POST /solicitudes` con encriptación DNI/CUIL (requiere JWT OTP)
- [ ] Endpoint `GET /admin/solicitudes` (lista básica sin filtros avanzados)
- [ ] Endpoint `GET /admin/solicitudes/:id`
- [ ] Trigger de auditoría automática en cambios de estado
- [ ] Generador de código RDAM-YYYY-NNNNN (secuencia con año)
- [ ] Seed de datos: usuarios internos de prueba

**Frontend Portal:**
- [ ] Pantalla de identificación: campo DNI + Email
- [ ] Pantalla de validación OTP (input de 6 dígitos + reenviar)
- [ ] Formulario de solicitud (DNI pre-llenado, no editable)
- [ ] Pantalla de "Solicitud enviada" con código y redireccion a pasarela

**Frontend Backoffice:**
- [ ] Pantalla de login
- [ ] Lista de solicitudes básica (sin filtros avanzados)
- [ ] Vista de detalle básica con botón "Cargar PDF" siempre disabled (para activarse en Sprint 3)

---

### Sprint 2 — Pago, Webhook y Cron Jobs (2 semanas)
**HUs:** HU-C03, HU-C04, HU-C05, HU-O02
**Objetivo:** Flujo de pago pay-first completo y vencimientos automáticos funcionando.

**Backend:**
- [ ] `POST /pagos/iniciar` — integración con pasarela externa (crea orden, retorna URL)
- [ ] `POST /webhooks/pago` — recepción, validación HMAC, idempotencia
  - `PAGO_CONFIRMADO` → estado `PAGADA` + email de confirmación
  - `PAGO_FALLIDO` → estado `RECHAZADA` + email de notificación
- [ ] Cron Job 1: Vencimiento de solicitud — diario, `PENDIENTE_PAGO` > 60 días → `VENCIDO`
- [ ] Cron Job 2: Vencimiento de certificado — diario, `EMITIDA` > 90 días → `PUBLICADO-VENCIDO`
- [ ] Ambos Cron Jobs deben ser idempotentes y registrar en `auditoria` con `actor_tipo = 'CRON'`
- [ ] `PATCH /admin/solicitudes/:id/estado` (solo Supervisor) con validación de transiciones
- [ ] `PATCH /admin/solicitudes/:id/asignar`
- [ ] Filtros avanzados en `GET /admin/solicitudes` (estado, circunscripción, fecha, DNI - hash calculado en backend)
- [ ] Middleware de validación de roles por endpoint

**Frontend Portal:**
- [ ] Pantalla de Consulta de Estado con timeline
- [ ] Pantalla de Historial de solicitudes (incluyendo estados `VENCIDO` y `PUBLICADO-VENCIDO`)
- [ ] Mensaje claro en historial cuando el estado es `PUBLICADO-VENCIDO` (descarga bloqueada)

**Frontend Backoffice:**
- [ ] Toolbar de filtros avanzados en lista
- [ ] Campo `puede_cargar_pdf` usado para habilitar/deshabilitar el botón en lista y detalle
- [ ] Modal de Reasignar (visible solo para Supervisor)
- [ ] Historial de auditoría en detalle (incluye entradas de tipo `CRON` y `WEBHOOK`)
- [ ] Diferenciación visual de roles (sidebar según rol)

---

### Sprint 3 — Emisión de Certificados (2 semanas)
**HUs:** HU-C06, HU-C07, HU-O03, HU-O04
**Objetivo:** Operario puede emitir certificados para solicitudes PAGADAS. Descarga ciudadano funcionando.

**Backend:**
- [ ] `POST /admin/solicitudes/:id/pdf` — upload a S3/MinIO
  - Validar que `estado === 'PAGADA'` antes de procesar (retorna 422 si no)
  - Guardar PDF en S3, `issued_at = NOW()`, `fecha_vencimiento = NOW() + 90d` (trigger DB)
  - Estado → `EMITIDA`, registrar en `auditoria`
  - Disparar email automático al ciudadano (template `certificado_emitido`)
- [ ] Generación de URL presignada de corta vida (5-15 min), solo si `NOW() <= fecha_vencimiento`
- [ ] Servicio de email: 4 templates (OTP, pago confirmado, pago rechazado, certificado emitido)
- [ ] `GET /solicitudes/:codigo/download` — redirect a URL presignada
  - Requerir JWT OTP y validar identidad (`dni_hash`) contra el registro
  - Si `estado === 'PUBLICADO-VENCIDO'` → retorna 410

**Frontend Portal:**
- [ ] Pantalla de Confirmación de pago (espera Webhook, polling o redirect de pasarela)
- [ ] Botón de descarga en historial: habilitado solo si `estado === 'EMITIDA'` y dentro del plazo
- [ ] Banner de certificado vencido si `estado === 'PUBLICADO-VENCIDO'`

**Frontend Backoffice:**
- [ ] Vista de detalle: botón "Cargar PDF / Emitir" enabled **únicamente** cuando `puede_cargar_pdf === true`
- [ ] Drag & drop y botón clásico para subir el PDF
- [ ] Validación client-side: solo archivos PDF, máx 5MB
- [ ] Confirmación de emisión con toast de éxito
- [ ] Lista filtra fácilmente por `estado=PAGADA` (cola de emisión pendiente)

---

### Sprint 4 — Dashboard y Supervisor (2 semanas)
**HUs:** HU-S01, HU-S02, HU-S03, HU-S04, HU-S05
**Objetivo:** Funcionalidades completas del Supervisor.

**Backend:**
- [ ] `GET /admin/dashboard` con todas las métricas (incluyendo conteo `VENCIDO` y `PUBLICADO-VENCIDO`)
- [ ] Job de SLA — detectar solicitudes `PAGADA` con demora > 30hs (warning) y > 48hs (crítico)
- [ ] `POST /admin/usuarios` — crear operario
- [ ] `PATCH /admin/usuarios/:id` — activar/desactivar, cambiar circunscripción
- [ ] Lógica de "Forzar estado" (solo Supervisor) con `forzado_supervisor = true` en auditoría

**Frontend Backoffice:**
- [ ] Dashboard con KPIs (6 estados), gráfico de barras por circunscripción, alertas SLA
- [ ] Tabla de carga de trabajo del equipo
- [ ] Vista de Gestión de Equipo con tabs (Operarios / Asignaciones)
- [ ] Sección "Forzar estado" en vista de Detalle (solo visible para Supervisor)
- [ ] Modal de Nuevo Operario
- [ ] Filtro por operario en lista (solo Supervisor)

---

### Sprint 5 — Hardening y Calidad (1 semana)
**Objetivo:** Seguridad, performance y testing antes de QA.

- [ ] Rate limiting en endpoints públicos (OTP: 5/min, solicitudes: 10/min)
- [ ] Validación real de MIME type en upload PDF (libmagic)
- [ ] Tests unitarios de lógica de negocio (transiciones de estado, encriptación, OTP)
- [ ] Tests de integración de endpoints críticos:
  - `POST /auth/otp/solicitar` y `POST /auth/otp/validar`
  - `POST /solicitudes` con JWT OTP
  - `POST /webhooks/pago` (PAGO_CONFIRMADO y PAGO_FALLIDO)
  - `POST /admin/solicitudes/:id/pdf` (estado PAGADA ✅ y estado PENDIENTE_PAGO ❌)
  - Cron Job de vencimiento de solicitud (60d)
  - Cron Job de vencimiento de certificado (90d)
- [ ] Tests E2E del happy path completo (Cypress o Playwright)
- [ ] Auditoría de seguridad básica (OWASP Top 10)
- [ ] Optimización de queries con índices (especialmente los de Cron Jobs)
- [ ] Configurar logs estructurados (Winston/Pino)
- [ ] Documentación de API (Swagger/OpenAPI)

---

## 4. Decisiones Técnicas a Resolver Antes de Empezar

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| Monto del certificado | Fijo hardcodeado vs configurable en DB | Variable en config/env para poder cambiar sin deploy |
| Pasarela de pago | MercadoPago, PayU, Getnet, custom | Confirmar con equipo — afecta Sprint 3 |
| Hosting | On-premise, AWS, Azure | Definir antes del Sprint 0 |
| Storage PDFs | AWS S3, MinIO self-hosted | MinIO si se requiere on-premise |
| Proveedor email | SendGrid, AWS SES, Nodemailer SMTP | SendGrid recomendado por templates |
| Monorepo vs repos separados | Turborepo, Nx, repos separados | Turborepo si mismo equipo maneja todo |
| Encriptación DNI/CUIL | AES-256-GCM, KMS | AES-256-GCM + clave en env/Vault |

---

## 5. Variables de Entorno

### Backend (.env)
```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/rdam

# JWT
JWT_SECRET=super-secret-key-256bits
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=24h

# Encriptación
ENCRYPTION_KEY=32-bytes-hex-key

# Blind index salt
DNI_HASH_SALT=random-salt-value

# S3 / MinIO
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=rdam-certificados
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_REGION=us-east-1

# Email (implementación actual: Nodemailer sobre SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASS=password
EMAIL_FROM=noreply@rdam.justiciasantafe.gov.ar

# Pasarela de pago
PASARELA_API_URL=https://pasarela.proveedor.com
PASARELA_API_KEY=key-aqui
PASARELA_WEBHOOK_SECRET=secret-webhook

# App
FRONTEND_URL=https://rdam.justiciasantafe.gov.ar
BACKEND_URL=https://api.rdam.justiciasantafe.gov.ar
PORT=3000
NODE_ENV=production

# SLA
SLA_WARNING_HOURS=30
SLA_CRITICAL_HOURS=48

# OTP
OTP_TTL_SECONDS=600
OTP_MAX_INTENTOS=3
REDIS_URL=redis://localhost:6379

# CAPTCHA
CAPTCHA_ENABLED=true
CAPTCHA_SECRET_KEY=secret-del-proveedor-captcha
CAPTCHA_MIN_SCORE=0.5

# Cron Jobs
CRON_SCHEDULE_VENCIMIENTOS="0 0 * * *"
CRON_DIAS_PENDIENTE_PAGO=60
CRON_DIAS_CERTIFICADO=90
```

---

## 6. Testing

### Cobertura mínima esperada
- Lógica de negocio (transiciones de estado, encriptación): **90%**
- Endpoints API (integración): **80%**
- Componentes UI críticos: **70%**

### Tests críticos a implementar

**Backend — Unit:**
```
□ StateTransitionService: validar todas las transiciones permitidas y denegadas
□ EncryptionService: cifrar/descifrar DNI y CUIL
□ BlindIndexService: consistencia de hash para búsqueda
□ OtpService: generación, validación, expiración e idempotencia
□ CertificadoService: cálculo de fecha_vencimiento (issued_at + 90d)
□ WebhookValidator: validar firma HMAC de pasarela
□ CronVencimientoService: lógica de 60d (solicitud) y 90d (certificado)
```

**Backend — Integration:**
```
□ POST /auth/otp/solicitar → guarda en Redis, envía email
□ POST /auth/otp/validar (código correcto) → retorna JWT ciudadano
□ POST /auth/otp/validar (código incorrecto x3) → error 410
□ POST /solicitudes (con JWT OTP) → crea solicitud PENDIENTE_PAGO con DNI encriptado
□ POST /auth/login → retorna JWT interno válido
□ POST /webhooks/pago (PAGO_CONFIRMADO) → estado PAGADA, email enviado
□ POST /webhooks/pago (PAGO_FALLIDO) → estado RECHAZADA, email enviado
□ POST /webhooks/pago (idempotente — ya PAGADA) → no cambia estado, retorna 200
□ POST /admin/solicitudes/:id/pdf (estado PAGADA) → EMITIDA, issued_at registrado, email enviado
□ POST /admin/solicitudes/:id/pdf (estado PENDIENTE_PAGO) → error 422
□ GET /solicitudes/:codigo/download → redirect a URL presignada
□ GET /solicitudes/:codigo/download (PUBLICADO-VENCIDO) → error 410
□ Cron: solicitu PENDIENTE_PAGO de 61 días → VENCIDO
□ Cron: solicitu EMITIDA de 91 días → PUBLICADO-VENCIDO
```

**E2E — Playwright/Cypress:**
```
□ Happy path completo: OTP → Formulario → Redireccion a pasarela → Webhook PAGADA → Operario carga PDF → Ciudadano descarga
□ OTP inválido: Error en validación, reintento, bloqueo tras 3 intentos
□ Pago rechazado: Webhook PAGO_FALLIDO → estado RECHAZADA visible en portal
□ Botón Cargar PDF: disabled en estado PENDIENTE_PAGO, enabled en PAGADA
□ Supervisor: Login → Dashboard → Forzar estado
□ Descarga vencida: PDF no disponible cuando estado es PUBLICADO-VENCIDO
```

---

## 7. Deployment

### Docker Compose (Desarrollo local)
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: rdam
      POSTGRES_USER: rdam_user
      POSTGRES_PASSWORD: local_pass
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']

  redis:
    image: redis:7
    ports: ['6379:6379']
    command: ["redis-server", "--appendonly", "yes"]

  minio:
    image: minio/minio
    ports: ['9000:9000', '9001:9001']
    command: server /data --console-address ":9001"
    volumes: ['miniodata:/data']

  api:
    build: ./Backend
    ports: ['3001:3000']
    depends_on: [db, redis, minio]
    env_file: .env

  portal:
    build: ./Frontend/ciudadano
    ports: ['3002:3000']

  backoffice:
    build: ./Frontend/operario
    ports: ['3003:3000']

volumes:
  pgdata:
  miniodata:
```

> MinIO/S3 debe permanecer privado. No habilitar acceso anónimo al bucket de certificados.

### Ambientes

| Ambiente | URL | Deploy trigger |
|----------|-----|----------------|
| **Develop** | dev.rdam.internal | Push a rama `develop` |
| **Staging** | staging.rdam.internal | PR a `main` |
| **Production** | rdam.justiciasantafe.gov.ar | Tag de release |

---

## 8. Checklist de Entrega

### Pre-QA
- [ ] Todos los endpoints documentados en Swagger
- [ ] Tests unitarios e integración al verde
- [ ] Variables de entorno documentadas
- [ ] Migraciones de base de datos probadas en ambiente limpio
- [ ] Logs estructurados funcionando
- [ ] Rate limiting activo en endpoints públicos
- [ ] Validación de MIME type en upload PDF
- [ ] Firma de webhook validada

### Pre-PROD
- [ ] Auditoría de seguridad realizada
- [ ] Certificado SSL instalado
- [ ] Backup automatizado de base de datos
- [ ] Monitoreo configurado (uptime + errores)
- [ ] Runbook de operación documentado
- [ ] Capacitación al personal interno completada
- [ ] Datos de prueba eliminados de la base
- [ ] Credenciales de producción rotadas
- [ ] **Cron Jobs de vencimiento verificados en ejecución** (60d y 90d)
- [ ] Cron de SLA verificado en ejecución
- [ ] 4 templates de email probados con cuenta real (OTP, pago confirmado, pago rechazado, certificado emitido)
- [ ] Flujo OTP completo probado en staging con email real
- [ ] Test E2E en staging con pasarela en modo sandbox y Webhook real
- [ ] Definición del monto final del certificado ingresado en config
- [ ] Redis configurado en producción con persistencia AOF

---

## 9. Recuperación y Continuidad (DR)

### Objetivos
- RPO PostgreSQL: 15 minutos
- RPO PDFs (S3/MinIO con versionado): 24 horas
- RTO plataforma completa (Portal + API + Backoffice): 4 horas

### Controles mínimos obligatorios
- Backups full diarios de PostgreSQL + archivado continuo de WAL
- Backup y versionado de bucket de certificados
- Restauración automatizable en ambiente limpio (infra como código)
- Validación post-restore de endpoints críticos: OTP, webhook, descarga, emisión

### Ejercicio periódico
- Simulacro mensual de restore completo
- Registro de evidencia: hora de inicio, hora de recuperación, brechas contra RPO/RTO
- Plan de acción para toda desviación detectada

---

## 10. Prompts para Generar Código con IA

### Backend — Módulo OTP Ciudadano
```
Sos un desarrollador backend experto en NestJS y TypeScript.
Creá el módulo OTP para el sistema RDAM con:
- Servicio OtpService con métodos:
  solicitar(dni, email): genera código 6 dígitos, hashea el DNI (SHA-256+salt), guarda en Redis con TTL 600s, envía email
  validar(dni, email, codigo): busca en Redis, valida hasta 3 intentos, devuelve JWT de sesión ciudadano (exp 30min) con payload { dni_hash, email }
  reenviar(dni, email): invalida el anterior, genera uno nuevo
- La clave Redis debe incluir el dni_hash para identificar al ciudadano
- Controller con endpoints: POST /auth/otp/solicitar, POST /auth/otp/validar, POST /auth/otp/reenviar
- Rate limiting: 5 req/min por IP en /solicitar
- Tests unitarios con Jest para todos los casos edge (código incorrecto, expirado, 3 intentos)
Usá ioredis. NestJS. TypeScript estricto.
```

### Backend — Módulo de Solicitudes (Pay-First)
```
Sos un desarrollador backend experto en NestJS y TypeScript.
Creá el módulo de solicitudes para el sistema RDAM con:
- Entity: Solicitud con campos (ver SPEC.md sección 5, DDL completo)
- Estados permitidos en ENUM: PENDIENTE_PAGO, PAGADA, RECHAZADA, VENCIDO, EMITIDA, PUBLICADO-VENCIDO (NO incluir EN_REVISION ni APROBADA)
- DTO de creación: validar CUIL, nombre, fecha_nacimiento, email, circunscripcion. El DNI se extrae del JWT de sesión OTP.
- Servicio con método crear() que:
  1. Extrae el DNI del JWT de sesión OTP (Guard de autenticación ciudadano)
  2. Encripta DNI y CUIL con AES-256-GCM
  3. Genera blind index hash(SALT + dni)
  4. Genera código RDAM-YYYY-NNNNN secuencial
  5. Guarda en DB con estado PENDIENTE_PAGO
  6. Llama a pasarela para crear orden de pago
  7. Registra en tabla auditoria con actor_tipo = 'CIUDADANO'
  8. Retorna { id, codigo, estado: 'PENDIENTE_PAGO', url_pago, monto }
- Controller: POST /solicitudes (requiere JWT ciudadano OTP)
- Rate limiting: 10/min por IP
Usá TypeORM. PostgreSQL. No incluyas lógica de revisión/aprobación.
```

### Backend — Servicio de Transiciones de Estado
```
Sos un desarrollador backend experto en NestJS.
Implementá StateTransitionService para el sistema RDAM.
Las transiciones válidas definidas en SPEC.md sección 6 son:
  PENDIENTE_PAGO → PAGADA (actor: WEBHOOK)
  PENDIENTE_PAGO → RECHAZADA (actor: WEBHOOK)
  PENDIENTE_PAGO → VENCIDO (actor: CRON)
  PAGADA → EMITIDA (actor: OPERARIO o SUPERVISOR — al cargar PDF)
  EMITIDA → PUBLICADO-VENCIDO (actor: CRON)
  Forzados de SUPERVISOR solo en whitelist documentada (nunca PENDIENTE_PAGO → EMITIDA)

NO existen las transiciones a EN_REVISION ni APROBADA.

El servicio debe:
1. Recibir (solicitud, nuevoEstado, actor: { tipo, usuarioId? }, forzado?)
2. Validar la transición. Si inválida → UnprocessableEntityException
3. Solo SUPERVISOR puede forzar con forzado=true
4. Al cambiar estado: actualizar solicitud + insertar en tabla auditoria con actor_tipo correcto
5. Si nuevo estado = EMITIDA: disparar evento para email de notificación
Implementá con patrón máquina de estados. Tests unitarios con Jest.
```

### Backend — Cron Jobs de Vencimiento
```
Sos un desarrollador backend experto en NestJS y TypeScript.
Implementá el módulo de Cron Jobs de vencimiento para el sistema RDAM.
Dos jobs diarios (00:00 hs):

Job 1 — Vencimiento de solicitud:
  SELECT solicitudes WHERE estado = 'PENDIENTE_PAGO' AND created_at < NOW() - INTERVAL '60 days'
  Para cada resultado: estado → 'VENCIDO'
  Registrar en auditoria con actor_tipo = 'CRON' y accion = 'SOLICITUD_VENCIDA'
  Loguear: { timestamp, cantidad_afectada } en log estructurado

Job 2 — Vencimiento de certificado:
  SELECT solicitudes WHERE estado = 'EMITIDA' AND issued_at < NOW() - INTERVAL '90 days'
  Para cada resultado: estado → 'PUBLICADO-VENCIDO'
  Registrar en auditoria con actor_tipo = 'CRON' y accion = 'CERTIFICADO_VENCIDO'
  Loguear: { timestamp, cantidad_afectada }

Ambos jobs deben ser idempotentes (no re-procesar registros ya cambiados).
Usá @nestjs/schedule (node-cron). TypeScript. Tests unitarios con Jest mockeando la fecha actual.
```

### Frontend — Componente Formulario Ciudadano (Post-OTP)
```
Sos un desarrollador frontend experto en React, TypeScript y Tailwind CSS.
Creá el componente FormularioCiudadano para el portal RDAM.
Contexto: el ciudadano ya validó su OTP y tiene un JWT de sesión. El DNI está en el JWT y se pre-llena.
Campos: DNI (pre-llenado, read-only), CUIL, nombre_completo, fecha_nacimiento, email (pre-llenado del OTP, editable), circunscripcion.
Requisitos:
- React Hook Form + zod para validación
- Validación en tiempo real con feedback visual
- Selector visual de circunscripción (cards clickeables, no select nativo)
- Mensaje de encriptación junto a DNI y CUIL ("Tus datos se cifran de forma segura")
- Al enviar: POST /solicitudes con Bearer JWT ciudadano
- Al recibir respuesta exitosa: redirigir a url_pago automáticamente (window.location.href)
- Manejo de errores de red con mensaje amigable
- Identidad visual: Azul #003057, Celeste #009FE3
- No usar librerías de UI (solo Tailwind)
```



---

## Nota v2.1

- Backend oficial: NestJS + TypeORM (PostgreSQL), sin Prisma.
- Seguridad: Passport-JWT (JwtAuthGuard) y control de roles para rutas internas.
- Validacion: class-validator + class-transformer con ValidationPipe global.
- Documentacion viva: Swagger/OpenAPI en /docs.
- Errores API: formato uniforme via GlobalExceptionFilter.



