# ESPECIFICACIÓN FUNCIONAL: RDAM
## Poder Judicial de la Provincia de Santa Fe

**Version:** 2.1
**Fecha:** Febrero 2026
**Nivel:** Producción (Nivel 2)
**Sistema:** Registro de Deudores Alimentarios Morosos — Plataforma Digital

> **Cambios v2.1:** Backend consolidado en NestJS + TypeORM (entidades decoradas y relaciones), Passport-JWT para rutas internas, validacion estricta con class-validator/class-transformer, Swagger en `/docs` y filtro global de excepciones estandar.

---

## 1. Resumen Ejecutivo

El RDAM es una plataforma web que permite a ciudadanos de la Provincia de Santa Fe solicitar de forma totalmente digital su Certificado del Registro de Deudores Alimentarios Morosos. El sistema consta de dos componentes: un **Portal Ciudadano** identificado por OTP de un solo uso (sin registro permanente), y un **Panel de Gestión Interno (Backoffice)** donde el personal del Poder Judicial emite los certificados digitalmente.

El flujo es: **OTP → Solicitud → Pago (vía Webhook) → Emisión interna → Descarga**. El pago ocurre de forma automática con confirmación asíncrona via Webhook. El estado de una solicitud solo avanza por acciones del sistema (webhook, cron) o del Operario (carga de PDF). No existe paso de revisión/aprobación manual intermedia.

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET / CIUDADANO                  │
└────────────────────────────┬────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │      PORTAL CIUDADANO        │
              │  (OTP por email - sin cuentas│
              │  permanentes)                │
              │  OTP / Form / Pago /         │
              │  Historial / Descarga        │
              └──────────────┬──────────────┘
                             │ REST API (JWT de sesión OTP)
┌─────────────────────────────────────────────────────────┐
│                       API BACKEND                        │
│                                                          │
│  /auth/otp    /solicitudes    /auth (JWT)   │
│  /pagos       /webhooks/pago  /admin        │
│  /cron        /auditoria                        │
└──────┬─────────────────────────────────────┬────────────┘
       │                                     │
┌──────▼──────┐  ┌──────────────┐  ┌────────▼────────┐
│  PostgreSQL  │  │  S3 / MinIO  │  │  Redis          │
│  (datos +   │  │  (PDFs)      │  │  (OTP Sessions) │
│  auditoría) │  └──────────────┘  └─────────────────┘
└─────────────┘
       │
┌──────▼──────────────────────┐
│      BACKOFFICE INTERNO      │
│  Dashboard / Lista /         │
│  Detalle / Carga PDF /       │
│  Gestión de equipo           │
│  (JWT auth — roles)          │
└─────────────────────────────┘
```

---

## 3. Roles del Sistema

| Rol | Descripción | Capacidades |
|-----|-------------|-------------|
| **Ciudadano** | Usuario externo sin cuenta permanente | Validar OTP, crear solicitud, pagar, descargar certificado emitido, consultar historial |
| **Operario** | Empleado del Poder Judicial | Login JWT, ver todas las solicitudes, cargar PDF (solo en estado `PAGADA`) |
| **Supervisor** | Jefe de área | Todo lo del Operario + dashboard, gestión de equipo, asignaciones, forzar estados |

---

## 4. Historias de Usuario

### CIUDADANO

| ID | Historia | Criterios de Aceptación |
|----|----------|------------------------|
| HU-C01 | Como ciudadano, quiero identificarme con mi DNI y Email para acceder al formulario | • Pantalla con campos DNI + Email • Sistema envía OTP al email ingresado • OTP expira en 10 minutos • Máximo 3 intentos antes de requerir reenvío • El formulario está bloqueado hasta el OTP ser validado |
| HU-C02 | Como ciudadano, quiero completar un formulario con mis datos para iniciar la solicitud | • Campos: DNI (pre-llenado, no editable), nombre completo, fecha nacimiento, email, circunscripción • Validación de formato en tiempo real • DNI/CUIL encriptados antes de guardar en backend • Al enviar: solicitud creada en `PENDIENTE_PAGO` + redirigido a pasarela |
| HU-C03 | Como ciudadano, quiero pagar mi solicitud para que sea procesada | • Al enviar formulario se redirige inmediatamente a pasarela de pago • Solo el Webhook de la pasarela cambia el estado (`PAGADA` o `RECHAZADA`) • El ciudadano NO puede alterar el estado directamente |
| HU-C04 | Como ciudadano, quiero consultar el estado de mi solicitud sin tener cuenta | • Búsqueda por código de solicitud o DNI+Email • Se muestra estado actual y timeline con fechas • Los datos sensibles se muestran enmascarados |
| HU-C05 | Como ciudadano, quiero ver el historial de mis solicitudes anteriores | • Listado de solicitudes por DNI (identificado por OTP activo) • Estado visual por solicitud • Botón de descarga habilitado solo para solicitudes `EMITIDA` y dentro del plazo de 90 días |
| HU-C06 | Como ciudadano, quiero descargar mi certificado cuando esté emitido | • Link de descarga disponible durante 90 días desde `issued_at` • Descargable múltiples veces (dentro del plazo) • Accesible desde historial y desde email recibido • Si estado es `PUBLICADO-VENCIDO`, el botón está bloqueado con mensaje de expiración |
| HU-C07 | Como ciudadano, quiero recibir emails en los eventos importantes del proceso | • OTP generado: "Código de verificación: XXXXXX" • Pago confirmado: "Su solicitud está en proceso" • Pago rechazado: "No se pudo procesar su pago" • Certificado emitido: "Su certificado está disponible" |

### OPERARIO

| ID | Historia | Criterios de Aceptación |
|----|----------|------------------------|
| HU-O01 | Como operario, quiero iniciar sesión con usuario y contraseña | • Login con username + password • JWT con expiración de 8h + refresh 24h • Redirección según rol tras login |
| HU-O02 | Como operario, quiero ver la lista completa de solicitudes | • La lista muestra **todas** las solicitudes del sistema (sin filtro por circunscripción del operario) • Filtrable por estado, circunscripción, fecha, DNI (el backend calcula blind index) • Ordenamiento configurable; por defecto: más antiguas primero • Paginación de 20 registros |
| HU-O03 | Como operario, quiero ver el detalle de una solicitud | • Ver todos los campos del ciudadano (DNI/CUIL enmascarados) • Historial de auditoría visible • Botón "Cargar PDF / Emitir" visible, **disabled** salvo que el estado sea exactamente `PAGADA` |
| HU-O04 | Como operario, quiero cargar el PDF de un certificado para solicitudes pagadas | • El botón de carga se habilita **únicamente** si el estado de la solicitud es `PAGADA` • Carga por botón clásico o drag & drop • Validación: solo PDF, máximo 5MB • Al confirmar carga exitosa: estado → `EMITIDA`, `issued_at` = NOW(), email automático enviado al ciudadano |

### SUPERVISOR

| ID | Historia | Criterios de Aceptación |
|----|----------|------------------------|
| HU-S01 | Como supervisor, quiero ver un dashboard con métricas del equipo | • KPIs: total solicitudes, por estado, emitidas hoy, rechazadas • Gráfico por circunscripción • Tiempos promedio por etapa • Alertas SLA para solicitudes `PAGADA` con > 48hs sin emisión |
| HU-S02 | Como supervisor, quiero ver y filtrar todas las solicitudes del equipo | • Vista de todas las circunscripciones con filtros adicionales por operario asignado |
| HU-S03 | Como supervisor, quiero asignar y reasignar solicitudes entre operarios | • Asignación individual desde detalle o masiva desde lista • Registro en auditoría al asignar/reasignar |
| HU-S04 | Como supervisor, quiero gestionar los operarios del equipo | • Crear operario: username, password temporal, circunscripción • Activar/desactivar operarios • Ver desempeño individual |
| HU-S05 | Como supervisor, quiero poder forzar cambios de estado en casos especiales | • Acción "Forzar estado" disponible solo para supervisor • Requiere justificación obligatoria • Registro en auditoría con flag `forzado_supervisor = true` |

---

## 5. Modelo de Datos

### Esquema SQL (DDL Completo)

```sql
-- =============================================
-- USUARIOS INTERNOS (Operarios y Supervisores)
-- =============================================
CREATE TABLE usuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(120) NOT NULL,
  rol             VARCHAR(20) NOT NULL CHECK (rol IN ('OPERARIO', 'SUPERVISOR')),
  circunscripcion VARCHAR(30) NOT NULL CHECK (circunscripcion IN (
                    'SANTA_FE', 'ROSARIO', 'VENADO_TUERTO', 'RAFAELA', 'RECONQUISTA'
                  )),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_login    TIMESTAMPTZ
);

-- =============================================
-- OTP TOKENS (Identificación ciudadano)
-- =============================================
CREATE TABLE otp_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni_hash    VARCHAR(64) NOT NULL,   -- blind index del DNI
  email       VARCHAR(120) NOT NULL,
  otp_code_hash VARCHAR(255) NOT NULL, -- hash del código OTP (nunca guardar OTP plano)
  expires_at  TIMESTAMPTZ NOT NULL,   -- NOW() + 10 minutos
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  intentos    SMALLINT NOT NULL DEFAULT 0, -- máximo 3
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_tokens_dni_hash ON otp_tokens(dni_hash, expires_at);

-- =============================================
-- SOLICITUDES
-- =============================================
CREATE TABLE solicitudes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                VARCHAR(20) UNIQUE NOT NULL, -- RDAM-YYYY-NNNNN

  -- Datos ciudadano (encriptados)
  dni_encriptado        TEXT NOT NULL,
  cuil_encriptado       TEXT NOT NULL,
  dni_hash              VARCHAR(64) NOT NULL, -- blind index para búsqueda

  nombre_completo       VARCHAR(120) NOT NULL,
  fecha_nacimiento      DATE NOT NULL,
  email                 VARCHAR(120) NOT NULL,
  circunscripcion       VARCHAR(30) NOT NULL CHECK (circunscripcion IN (
                          'SANTA_FE', 'ROSARIO', 'VENADO_TUERTO', 'RAFAELA', 'RECONQUISTA'
                        )),

  -- Estado: ciclo de vida simplificado (Pay-First, sin EN_REVISION ni APROBADA)
  estado                VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_PAGO'
                          CHECK (estado IN (
                            'PENDIENTE_PAGO',
                            'PAGADA',
                            'RECHAZADA',
                            'VENCIDO',
                            'EMITIDA',
                            'PUBLICADO-VENCIDO'
                          )),

  operario_asignado_id  UUID REFERENCES usuarios(id),
  observaciones_rechazo TEXT,

  -- Certificado PDF
  pdf_url               TEXT,
  pdf_storage_key       TEXT,          -- clave en S3/MinIO
  issued_at             TIMESTAMPTZ,   -- fecha de emisión (para calcular vencimiento 90d)
  fecha_vencimiento     TIMESTAMPTZ,   -- = issued_at + 90 days

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance y Cron Jobs
CREATE INDEX idx_solicitudes_estado       ON solicitudes(estado);
CREATE INDEX idx_solicitudes_circunscr    ON solicitudes(circunscripcion);
CREATE INDEX idx_solicitudes_created_at   ON solicitudes(created_at ASC);
CREATE INDEX idx_solicitudes_issued_at    ON solicitudes(issued_at) WHERE issued_at IS NOT NULL;
CREATE INDEX idx_solicitudes_dni_hash     ON solicitudes(dni_hash);
CREATE INDEX idx_solicitudes_codigo       ON solicitudes(codigo);
-- Índice compuesto para Cron de vencimiento de solicitud:
CREATE INDEX idx_cron_solicitud_venc      ON solicitudes(created_at, estado) WHERE estado = 'PENDIENTE_PAGO';
-- Índice compuesto para Cron de vencimiento de certificado:
CREATE INDEX idx_cron_cert_venc           ON solicitudes(issued_at, estado) WHERE estado = 'EMITIDA';

-- =============================================
-- TRANSACCIONES DE PAGO
-- =============================================
CREATE TABLE transacciones_pago (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id        UUID NOT NULL REFERENCES solicitudes(id),
  monto               DECIMAL(10,2) NOT NULL,
  estado              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'FALLIDO', 'REEMBOLSADO')),
  referencia_pasarela VARCHAR(120),
  metodo_pago         VARCHAR(50),
  payload_pasarela    JSONB,           -- respuesta completa de la pasarela (para auditoría)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_pago          TIMESTAMPTZ
);

-- =============================================
-- AUDITORÍA (inmutable — sin UPDATE/DELETE)
-- =============================================
CREATE TABLE auditoria (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id       UUID REFERENCES solicitudes(id),
  usuario_id         UUID REFERENCES usuarios(id), -- NULL si es acción de ciudadano/sistema/cron
  accion             VARCHAR(80) NOT NULL,
  estado_anterior    VARCHAR(30),
  estado_nuevo       VARCHAR(30),
  observaciones      TEXT,
  actor_tipo         VARCHAR(20) NOT NULL DEFAULT 'SISTEMA'
                       CHECK (actor_tipo IN ('CIUDADANO', 'OPERARIO', 'SUPERVISOR', 'SISTEMA', 'CRON', 'WEBHOOK')),
  ip_origen          INET,
  forzado_supervisor BOOLEAN DEFAULT FALSE,
  timestamp          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_solicitud ON auditoria(solicitud_id, timestamp DESC);

-- =============================================
-- TRIGGERS
-- =============================================

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_solicitudes_updated
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calcular fecha_vencimiento al emitir (estado → EMITIDA)
CREATE OR REPLACE FUNCTION set_issued_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'EMITIDA' AND OLD.estado != 'EMITIDA' THEN
    NEW.issued_at = NOW();
    NEW.fecha_vencimiento = NOW() + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_issued_dates
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION set_issued_dates();
```

### JSON Schemas

```json
// Solicitud (respuesta API - ciudadano)
{
  "id": "uuid",
  "codigo": "RDAM-2026-00247",
  "nombre_completo": "García Martínez, Juan Carlos",
  "email": "jgarcia@email.com",
  "circunscripcion": "SANTA_FE",
  "estado": "EMITIDA",
  "pdf_url": "https://storage.rdam.gob.ar/certs/RDAM-2026-00247.pdf?token=...",
  "issued_at": "2026-02-15T14:30:00Z",
  "fecha_vencimiento": "2026-05-16T14:30:00Z",
  "created_at": "2026-02-14T10:32:00Z"
}

// Creación de solicitud (request ciudadano — requiere JWT OTP)
{
  "cuil": "20304567894",
  "nombre_completo": "García Martínez, Juan Carlos",
  "fecha_nacimiento": "1985-03-15",
  "email": "jgarcia@email.com",
  "circunscripcion": "SANTA_FE"
  // DNI se toma del JWT de sesión OTP, no se repite en el body
}
```

---

## 6. Flujo de Estados

```
                        ┌─────────────────────┐
  [ciudadano envía      │   PENDIENTE_PAGO    │ ─── CRON (60d sin pago) ──► VENCIDO
   formulario → OTP]   │                     │
  ───────────────────► └──────────┬──────────┘
                                  │
                   [Webhook pago OK]   [Webhook pago fallido]
                                  │           │
                       ┌──────────▼──┐  ┌─────▼───────┐
                       │    PAGADA   │  │  RECHAZADA  │
                       └──────┬──────┘  └─────────────┘
                              │
                    [Operario carga PDF]
                              │
                       ┌──────▼──────┐
                       │   EMITIDA   │ ─── CRON (90d desde issued_at) ──► PUBLICADO-VENCIDO
                       └─────────────┘
                              │
                    [Ciudadano descarga]
```

### Tabla de Transiciones

| Estado Origen | Estado Destino | Actor | Condiciones |
|---------------|----------------|-------|-------------|
| `PENDIENTE_PAGO` | `PAGADA` | Sistema (Webhook) | `evento = PAGO_CONFIRMADO` |
| `PENDIENTE_PAGO` | `RECHAZADA` | Sistema (Webhook) | `evento = PAGO_FALLIDO` |
| `PENDIENTE_PAGO` | `VENCIDO` | Sistema (Cron) | `created_at < NOW() - 60 días` |
| `PAGADA` | `EMITIDA` | Operario / Supervisor | Carga de PDF exitosa |
| `EMITIDA` | `PUBLICADO-VENCIDO` | Sistema (Cron) | `issued_at < NOW() - 90 días` |
| `PENDIENTE_PAGO` | `RECHAZADA` | Solo Supervisor | Forzado excepcional, con justificación obligatoria |
| `RECHAZADA` | `PENDIENTE_PAGO` | Solo Supervisor | Reapertura excepcional, con justificación obligatoria |
| `VENCIDO` | `PENDIENTE_PAGO` | Solo Supervisor | Reapertura excepcional, con justificación obligatoria |
| `PAGADA` | `RECHAZADA` | Solo Supervisor | Corrección operativa, con justificación obligatoria |
| `RECHAZADA` | `PAGADA` | Solo Supervisor | Corrección operativa, con justificación obligatoria |

> **Nota:** Los estados `EN_REVISION` y `APROBADA` **no existen** en este sistema. La lógica Pay-First elimina la necesidad de un paso de revisión/aprobación previo a la emisión.
>
> **Regla de seguridad:** `PENDIENTE_PAGO -> EMITIDA` está prohibido incluso para Supervisor (no se puede bypassear pago confirmado).

### Tabla de Habilitación de Controles (Backoffice)

| Control | `PENDIENTE_PAGO` | `PAGADA` | `RECHAZADA` | `VENCIDO` | `EMITIDA` | `PUBLICADO-VENCIDO` |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Botón "Cargar PDF / Emitir"** | ⛔ disabled | ✅ enabled | ⛔ disabled | ⛔ disabled | ⛔ disabled | ⛔ disabled |
| Ver detalle | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Asignar operario (Supervisor) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 7. Integraciones

### 7.1 Flujo OTP (Ciudadano)

| Endpoint | Descripción |
|----------|-------------|
| `POST /auth/otp/solicitar` | Recibe DNI + Email, genera OTP (6 dígitos), guarda en Redis con TTL 10min, envía email |
| `POST /auth/otp/validar` | Recibe DNI + Email + código OTP, valida contra Redis, retorna JWT de sesión ciudadano (30min) |
| `POST /auth/otp/reenviar` | Reenvía un OTP nuevo (invalida el anterior) |

### 7.2 Pasarela de Pago (Webhook)

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | API REST desarrollada por proveedor externo |
| **Auth** | API Key en header (a definir con proveedor) |
| **Webhook** | `POST /webhooks/pago` — confirma o rechaza pago |
| **Idempotencia** | Si la solicitud ya está en estado terminal (`PAGADA` o `RECHAZADA`), ignorar webhook duplicado |
| **Validación** | Verificar firma HMAC-SHA256 (`X-Pasarela-Signature`) antes de procesar |

```json
// Webhook entrante (pago confirmado)
{
  "evento": "PAGO_CONFIRMADO",
  "referencia_interna": "RDAM-2026-00247",
  "referencia_pasarela": "PAY-ABC-12345",
  "monto": 2750.00,
  "metodo": "TARJETA_CREDITO",
  "timestamp": "2026-02-15T09:20:00Z"
}
```

### 7.3 Servicio de Email

| Trigger | Template | Variables clave |
|---------|----------|-----------------|
| OTP generado | `otp_verificacion` | `otp_code`, `expires_in` |
| Pago confirmado (`PAGADA`) | `pago_confirmado` | `nombre`, `codigo` |
| Pago rechazado (`RECHAZADA`) | `pago_rechazado` | `nombre`, `codigo` |
| Certificado emitido (`EMITIDA`) | `certificado_emitido` | `nombre`, `codigo`, `link_descarga`, `fecha_vencimiento` |

### 7.4 Almacenamiento de PDFs

| Aspecto | Detalle |
|---------|---------|
| **Servicio** | AWS S3 o MinIO (self-hosted) |
| **Path** | `certs/{año}/{circunscripcion}/{codigo}.pdf` |
| **Acceso** | URL presignada de corta vida (5-15 min). El endpoint de descarga solo habilita emisión de URL mientras `NOW() <= fecha_vencimiento` |
| **Límite** | 5MB por archivo |

### 7.5 Cron Jobs de Vencimiento

| Job | Frecuencia | Query | Acción |
|-----|-----------|-------|--------|
| **Vencimiento solicitud** | Diario (00:00 hs) | `estado = 'PENDIENTE_PAGO' AND created_at < NOW() - interval '60 days'` | `estado → 'VENCIDO'` + audit log |
| **Vencimiento certificado** | Diario (00:00 hs) | `estado = 'EMITIDA' AND issued_at < NOW() - interval '90 days'` | `estado → 'PUBLICADO-VENCIDO'` + audit log |

---

## 8. Requisitos No Funcionales

### Performance
- Lista de solicitudes: respuesta < 500ms para hasta 10.000 registros
- Carga de PDF: soportar hasta 5MB, timeout de 30s
- Dashboard: caché de métricas con TTL de 5 minutos

### Seguridad
- Encriptación AES-256-GCM para campos DNI y CUIL
- Blind index (SHA-256 + salt) para búsqueda por DNI sin desencriptar
- JWT ciudadano (OTP session): expiración 30 minutos, uso único
- JWT interno (operario/supervisor): expiración 8h + refresh token 24h
- OTP: máximo 3 intentos, TTL 10 minutos, invalidación tras uso exitoso
- Rate limiting: 5 req/min por IP en `POST /auth/otp/solicitar`; 10 req/min en `POST /solicitudes`
- Validación de tipo MIME en upload de PDF (no solo extensión)
- Webhook: validar `X-Pasarela-Signature` con HMAC-SHA256 antes de procesar
- HTTPS obligatorio en todos los ambientes

### Disponibilidad
- SLA objetivo: 99.5% uptime
- Horario crítico: lunes a viernes 8hs–18hs

### Auditoría
- Todo cambio de estado genera registro en tabla `auditoria`
- Los registros de auditoría son inmutables (sin UPDATE/DELETE)
- Todos los Cron Jobs registran su ejecución (timestamp, cantidad de registros afectados)
- Retención mínima: 5 años

```sql
-- Endurecimiento recomendado para inmutabilidad de auditoria
REVOKE UPDATE, DELETE ON auditoria FROM PUBLIC;

CREATE OR REPLACE FUNCTION bloquear_mutaciones_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'auditoria es append-only: UPDATE/DELETE no permitido';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_auditoria
  BEFORE UPDATE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION bloquear_mutaciones_auditoria();

CREATE TRIGGER trg_no_delete_auditoria
  BEFORE DELETE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION bloquear_mutaciones_auditoria();
```

### Recuperación y Continuidad
- RPO objetivo: 15 minutos para PostgreSQL; RPO objetivo: 24 horas para objetos PDF (con versionado activo)
- RTO objetivo: 4 horas para restablecer operación completa API + Backoffice + Portal
- Backups PostgreSQL: snapshot diario + WAL archive continuo
- Restore drills: mensuales, con evidencia de tiempo real de recuperación y validación funcional mínima
- Runbook obligatorio: pasos de restauración, responsables, credenciales de emergencia y validaciones post-recuperación

### Accesibilidad
- WCAG 2.1 AA para el portal ciudadano
- Soporte para lectores de pantalla en formularios



---

## Nota v2.1

- Backend oficial: NestJS + TypeORM (PostgreSQL), sin Prisma.
- Seguridad: Passport-JWT (JwtAuthGuard) y control de roles para rutas internas.
- Validacion: class-validator + class-transformer con ValidationPipe global.
- Documentacion viva: Swagger/OpenAPI en /docs.
- Errores API: formato uniforme via GlobalExceptionFilter.

