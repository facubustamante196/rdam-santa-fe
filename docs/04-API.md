# API CONTRACTS — RDAM
## Poder Judicial de Santa Fe
**Version:** 2.1 - Alineado con ALCANCE/SPEC v2.1 (TypeORM + JWT/OTP + Cron Jobs)

**Base URL:** `https://api.rdam.justiciasantafe.gov.ar`
**Auth Ciudadano:** Bearer JWT de sesión OTP (30 min, uso único por solicitud)
**Auth Interno:** Bearer JWT de usuario interno (8h + refresh 24h)
**Content-Type:** `application/json` (salvo upload multipart)
**Swagger (OpenAPI):** `/docs`
**Error Envelope:** `{ success:false, statusCode, error, message, errors?, timestamp, path }`

---

## AUTENTICACIÓN CIUDADANO (OTP)

### POST /auth/otp/solicitar
Solicitar código OTP. Requiere CAPTCHA válido y envía un código de 6 dígitos al email del ciudadano.

**Request:**
```json
{
  "dni": "30456789",
  "email": "jgarcia@email.com",
  "captchaToken": "token-del-proveedor-captcha"
}
```

**Response 200:**
```json
{
  "message": "Código OTP enviado a su email",
  "expires_in": 600
}
```

**Response 429 (rate limit):**
```json
{ "error": "RATE_LIMIT", "message": "Demasiados intentos. Esperá 5 minutos antes de solicitar otro código." }
```

---

### POST /auth/otp/validar
Validar el código OTP recibido. Retorna un JWT de sesión ciudadano.

**Request:**
```json
{
  "dni": "30456789",
  "email": "jgarcia@email.com",
  "codigo": "482917"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGci...",
  "message": "OTP validado exitosamente",
  "expires_in": "30m"
}
```

**Response 400 (código inválido):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Código OTP incorrecto. Le quedan 2 intento(s)."
}
```

**Response 410 (máximo de intentos alcanzado):**
```json
{
  "statusCode": 410,
  "error": "Gone",
  "message": "Máximo de intentos alcanzado. Solicite un nuevo código OTP."
}
```

**Response 400 (OTP expirado o inexistente):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "No existe un OTP activo para este DNI. Solicite uno nuevo."
}
```

---

### POST /auth/otp/reenviar
Reenviar un nuevo OTP (invalida el anterior). Requiere CAPTCHA válido.

**Request:**
```json
{
  "dni": "30456789",
  "email": "jgarcia@email.com",
  "captchaToken": "token-del-proveedor-captcha"
}
```

**Response 200:**
```json
{ "message": "Código OTP enviado a su email", "expires_in": 600 }
```

---

## AUTENTICACIÓN INTERNA (Operario / Supervisor)

### POST /auth/login
Login de usuario interno.

**Request:**
```json
{
  "username": "operario.rodriguez",
  "password": "contraseña123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "expires_in": 28800,
  "usuario": {
    "id": "uuid",
    "username": "operario.rodriguez",
    "nombre_completo": "Lucía Rodríguez",
    "rol": "OPERARIO",
    "circunscripcion": "SANTA_FE"
  }
}
```

**Response 401:**
```json
{ "error": "CREDENCIALES_INVALIDAS", "message": "Usuario o contraseña incorrectos" }
```

---

### POST /auth/refresh
Renovar access token.

**Request:**
```json
{ "refresh_token": "eyJhbGci..." }
```

**Response 200:**
```json
{ "access_token": "eyJhbGci...", "expires_in": 28800 }
```

---

## SOLICITUDES — ENDPOINTS PÚBLICOS (Portal Ciudadano)

> **Auth requerida:** Bearer JWT de sesión OTP (obtenido en `POST /auth/otp/validar`)

### POST /solicitudes
Crear nueva solicitud. El DNI se extrae del JWT de sesión OTP (no se envía en el body).

**Auth:** JWT ciudadano (OTP)

**Request:**
```json
{
  "cuil": "20304567894",
  "nombre_completo": "García Martínez, Juan Carlos",
  "fecha_nacimiento": "1985-03-15",
  "email": "jgarcia@email.com",
  "circunscripcion": "SANTA_FE"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "codigo": "RDAM-2026-00247",
  "estado": "PENDIENTE_PAGO",
  "created_at": "2026-02-14T10:32:00Z",
  "url_pago": "https://pasarela.externa.com/checkout/PAY-ABC-12345",
  "monto": 2750.00,
  "mensaje": "Solicitud creada. Serás redirigido a la pasarela de pago."
}
```

> El frontend debe redirigir inmediatamente al ciudadano a `url_pago`.

**Response 422 (validación):**
```json
{
  "error": "VALIDACION",
  "campos": {
    "cuil": "Formato inválido.",
    "email": "Email inválido."
  }
}
```

---

### GET /solicitudes/consulta
Consultar estado por código o DNI+email (público).

**Query params:**
- `codigo=RDAM-2026-00247` ó
- `dni=30456789&email=jgarcia@email.com`

**Response 200:**
```json
{
  "codigo": "RDAM-2026-00247",
  "nombre_completo": "García Martínez, Juan Carlos",
  "circunscripcion": "SANTA_FE",
  "estado": "RECHAZADA",
  "observaciones_rechazo": null,
  "created_at": "2026-02-14T10:32:00Z",
  "updated_at": "2026-02-14T10:35:00Z",
  "timeline": [
    { "estado": "PENDIENTE_PAGO", "fecha": "2026-02-14T10:32:00Z", "descripcion": "Solicitud creada" },
    { "estado": "PAGADA",         "fecha": "2026-02-14T10:35:00Z", "descripcion": "Pago confirmado" }
  ]
}
```

---

### GET /solicitudes/historial
Historial de solicitudes del ciudadano.

**Auth:** JWT ciudadano (OTP) — el DNI se extrae del JWT

**Response 200:**
```json
{
  "solicitudes": [
    {
      "codigo": "RDAM-2026-00247",
      "estado": "PAGADA",
      "circunscripcion": "SANTA_FE",
      "created_at": "2026-02-14T10:32:00Z",
      "pdf_disponible": false,
      "fecha_vencimiento": null
    },
    {
      "codigo": "RDAM-2025-01823",
      "estado": "EMITIDA",
      "circunscripcion": "SANTA_FE",
      "created_at": "2025-09-03T08:00:00Z",
      "pdf_disponible": true,
      "fecha_vencimiento": "2025-12-01T14:30:00Z",
      "pdf_url": "https://..."
    },
    {
      "codigo": "RDAM-2024-00811",
      "estado": "PUBLICADO-VENCIDO",
      "circunscripcion": "SANTA_FE",
      "created_at": "2024-05-01T09:00:00Z",
      "pdf_disponible": false,
      "fecha_vencimiento": "2024-07-30T14:30:00Z"
    }
  ]
}
```

---

### GET /solicitudes/:codigo/download
Descargar certificado PDF (requiere que esté emitido y vigente).

**Auth requerida:** Bearer JWT de sesión OTP (el backend valida `dni_hash` del token contra la solicitud)

**Response 302:** Redirect a URL presignada S3.

**Response 403:**
```json
{ "error": "NO_AUTORIZADO", "message": "La solicitud no corresponde a la identidad autenticada" }
```

**Response 409 (estado no permite descarga):**
```json
{ "error": "DESCARGA_NO_DISPONIBLE", "message": "La solicitud no está en estado EMITIDA.", "estado_actual": "PAGADA" }
```

**Response 410 (vencido):**
```json
{ "error": "CERTIFICADO_VENCIDO", "message": "El certificado venció el 01/12/2025. Ya no está disponible para descarga." }
```

---

## PAGO Y WEBHOOK

### POST /pagos/iniciar
Iniciar proceso de pago. Crea una transacción `PENDIENTE` y retorna los campos que el frontend debe enviar por `POST` a la pasarela.

**Auth:** JWT ciudadano (OTP)

**Request:**
```json
{
  "codigo_solicitud": "RDAM-2026-00247"
}
```

**Response 200:**
```json
{
  "transaccion_id": "uuid",
  "url_pago": "http://localhost:3000",
  "monto": 2750.00,
  "expira_en": 3600,
  "metodo": "POST",
  "checkout_fields": {
    "Comercio": "test-merchant-001",
    "TransaccionComercioId": "RDAM-2026-00247",
    "Monto": "<base64-aes-cbc>",
    "CallbackSuccess": "<base64-aes-cbc>",
    "CallbackCancel": "<base64-aes-cbc>",
    "UrlSuccess": "<base64-aes-cbc>",
    "UrlError": "<base64-aes-cbc>",
    "Informacion": "<base64-aes-cbc>",
    "Producto[0]": "Certificado RDAM",
    "MontoProducto[0]": "275000"
  }
}
```

**Cómo debe redirigir el frontend al presionar "Pagar":**
1. Llamar `POST /pagos/iniciar`.
2. Construir un formulario HTML dinámico con `action=url_pago`, `method=POST`.
3. Agregar todos los pares de `checkout_fields` como `input hidden`.
4. Ejecutar `form.submit()` para abrir la pasarela.

**Response 409 (estado inválido):**
```json
{ "error": "ESTADO_INVALIDO", "message": "La solicitud no está en estado PENDIENTE_PAGO.", "estado_actual": "PAGADA" }
```

---

### POST /webhooks/pago
Webhook entrante de la pasarela de pago (firmado con secret compartido). **Endpoint público pero con validación de firma HMAC.**

**Headers:**
```
X-Pasarela-Signature: sha256=<hmac-sha256-hex>
```

**Request (pago exitoso):**
```json
{
  "evento": "PAGO_CONFIRMADO",
  "referencia_interna": "RDAM-2026-00247",
  "referencia_pasarela": "PAY-ABC-12345",
  "monto": 2750.00,
  "metodo": "TARJETA_CREDITO",
  "timestamp": "2026-02-14T10:35:00Z"
}
```

**Request (PlusPagos mock):**
```json
{
  "Tipo": "PAGO",
  "TransaccionPlataformaId": "123456",
  "TransaccionComercioId": "RDAM-2026-00247",
  "Monto": "2750.00",
  "EstadoId": "3",
  "Estado": "REALIZADA",
  "FechaProcesamiento": "2026-02-14T10:35:00Z"
}
```

**Request (pago fallido):**
```json
{
  "evento": "PAGO_FALLIDO",
  "referencia_interna": "RDAM-2026-00247",
  "referencia_pasarela": "PAY-ABC-12345",
  "monto": 2750.00,
  "motivo": "FONDOS_INSUFICIENTES",
  "timestamp": "2026-02-14T10:35:00Z"
}
```

**Acciones del sistema según evento:**

| Evento | Estado anterior | Estado nuevo | Email enviado |
|--------|----------------|--------------|---------------|
| `PAGO_CONFIRMADO` | `PENDIENTE_PAGO` | `PAGADA` | ✅ "Pago recibido" |
| `PAGO_FALLIDO` | `PENDIENTE_PAGO` | `RECHAZADA` | ✅ "No se pudo procesar" |

**Nota de idempotencia:** Si el estado ya es `PAGADA` o `RECHAZADA`, el webhook se ignora y retorna 200.

**Response 200:**
```json
{ "procesado": true }
```

**Response 401 (firma inválida):**
```json
{ "error": "FIRMA_INVALIDA", "message": "Webhook rechazado: firma no válida." }
```

---

## SOLICITUDES — ENDPOINTS INTERNOS (Backoffice — JWT requerido)

### GET /admin/solicitudes
Listar solicitudes. **El Operario ve todas las solicitudes del sistema** (sin filtro obligatorio por circunscripción).

**Auth:** Bearer JWT (OPERARIO o SUPERVISOR)

**Query params:**
- `estado=PENDIENTE_PAGO|PAGADA|RECHAZADA|VENCIDO|EMITIDA|PUBLICADO-VENCIDO`
- `circunscripcion=SANTA_FE`
- `from=2026-01-01` / `to=2026-01-31`
- `dni=30456789` (el backend calcula blind index; el cliente nunca envía hashes)
- `operario_id=uuid` (solo SUPERVISOR)
- `page=1` / `limit=20`
- `sort=created_at` / `order=asc`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "codigo": "RDAM-2026-00231",
      "nombre_completo": "López Pérez, María",
      "email": "mlopez@email.com",
      "circunscripcion": "ROSARIO",
      "estado": "PAGADA",
      "operario_asignado": null,
      "horas_en_estado": 52,
      "alerta_sla": true,
      "puede_cargar_pdf": true
    }
  ],
  "total": 248,
  "page": 1,
  "limit": 20
}
```

> `puede_cargar_pdf: true` solo si `estado === 'PAGADA'`. El frontend debe usar este campo para habilitar/deshabilitar el botón.

---

### GET /admin/solicitudes/:id
Obtener detalle completo de una solicitud.

**Auth:** OPERARIO o SUPERVISOR

**Response 200:**
```json
{
  "id": "uuid",
  "codigo": "RDAM-2026-00235",
  "dni_enmascarado": "••••••789",
  "cuil_enmascarado": "20-••••••89-4",
  "nombre_completo": "Fernández, Roberto A.",
  "fecha_nacimiento": "1978-06-22",
  "email": "rfernandez@gmail.com",
  "circunscripcion": "SANTA_FE",
  "estado": "PAGADA",
  "puede_cargar_pdf": true,
  "operario_asignado": null,
  "pdf_url": null,
  "issued_at": null,
  "fecha_vencimiento": null,
  "created_at": "2026-01-11T10:32:00Z",
  "updated_at": "2026-01-11T10:35:00Z",
  "auditoria": [
    {
      "estado_anterior": null,
      "estado_nuevo": "PENDIENTE_PAGO",
      "timestamp": "2026-01-11T10:32:00Z"
    },
    {
      "accion": "PAGO_CONFIRMADO",
      "actor_tipo": "WEBHOOK",
      "usuario": null,
      "estado_anterior": "PENDIENTE_PAGO",
      "estado_nuevo": "PAGADA",
      "timestamp": "2026-01-11T10:35:00Z"
    }
  ]
}
```

---

### POST /admin/solicitudes/:id/pdf
Cargar certificado PDF y emitir la solicitud.

**Auth:** OPERARIO o SUPERVISOR
**Restricción:** Solo si `estado === 'PAGADA'`. Si el estado es diferente, retorna 422.

**Content-Type:** `multipart/form-data`

```json
{
  "id": "uuid",
  "codigo": "RDAM-2026-00241",
  "estado": "EMITIDA",
  "puede_cargar_pdf": false,
  "pdf_url": "https://storage.rdam.../RDAM-2026-00241.pdf?token=...",
  "issued_at": "2026-02-15T14:30:00Z",
  "fecha_vencimiento": "2026-05-16T14:30:00Z",
  "email_enviado": true
}
```

**Response 422 (estado incorrecto):**
```json
{
  "error": "ESTADO_INVALIDO",
  "message": "El PDF solo puede cargarse cuando la solicitud está en estado PAGADA.",
  "estado_actual": "PENDIENTE_PAGO"
}
```

**Response 400 (archivo inválido):**
```json
{ "error": "ARCHIVO_INVALIDO", "message": "Solo se aceptan archivos PDF de hasta 5MB" }
```

---

### PATCH /admin/solicitudes/:id/estado
Cambiar estado manualmente (solo Supervisor, para casos especiales).

**Auth:** Solo SUPERVISOR

**Request:**
```json
{
  "estado": "RECHAZADA",
  "observaciones": "Caso excepcional auditado. Incidente #INC-2026-00123.",
  "forzado": true
}
```

**Restricciones de forzado (obligatorias):**
- Nunca se permite `PENDIENTE_PAGO -> EMITIDA` por bypass de pago.
- Nunca se permite forzar estados terminales a estados operativos sin justificación.
- `observaciones` es obligatoria y debe incluir referencia de respaldo (ticket/expediente).

**Response 200:**
```json
{
  "id": "uuid",
  "codigo": "RDAM-2026-00235",
  "estado": "RECHAZADA",
  "updated_at": "2026-02-15T11:48:00Z"
}
```

**Response 422:**
```json
{
  "error": "TRANSICION_INVALIDA",
  "message": "Transición no permitida para el rol OPERARIO."
}
```

---

### PATCH /admin/solicitudes/:id/asignar
Asignar operario a una solicitud.

**Auth:** Solo SUPERVISOR

**Request:**
```json
{ "operario_id": "uuid" }
```

**Response 200:**
```json
{
  "codigo": "RDAM-2026-00231",
  "operario_asignado": { "id": "uuid", "nombre": "M. González" }
}
```

---

### GET /admin/auditoria
Consultar logs de auditoría del sistema (acciones, cambios de estado, forzados, etc).

**Auth:** SUPERVISOR

**Query params:**
- `solicitud_id=uuid` (opcional)
- `usuario_id=uuid` (opcional)
- `accion=string` (opcional)
- `from=2026-01-01` / `to=2026-01-31` (opcional)
- `page=1` / `limit=50`

**Response 200:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "solicitud_id": "uuid",
      "usuario_id": "uuid",
      "accion": "PAGO_CONFIRMADO",
      "estado_anterior": "PENDIENTE_PAGO",
      "estado_nuevo": "PAGADA",
      "actor_tipo": "WEBHOOK",
      "forzado_supervisor": false,
      "timestamp": "2026-02-15T10:00:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50
}
```

---

### GET /admin/solicitudes/alertas
Obtener alertas SLA de solicitudes demoradas (por ejemplo, PAGADA > 48hs sin emitir).

**Auth:** SUPERVISOR

**Query params:**
- `nivel=CRITICO|ALTA|MEDIA` (opcional)
- `circunscripcion=string` (opcional)
- `page=1` / `limit=20`

**Response 200:**
```json
{
  "alertas": [
    {
      "codigo": "RDAM-2026-00231",
      "nombre": "López Pérez, María",
      "circunscripcion": "ROSARIO",
      "estado": "PAGADA",
      "horas_demora": 52,
      "nivel": "CRITICO"
    }
  ],
  "total": 3
}
```

---

### GET /admin/solicitudes/vencidas
Listar solicitudes vencidas (estado VENCIDO o PUBLICADO-VENCIDO).

**Auth:** OPERARIO o SUPERVISOR

**Query params:**
- `estado=VENCIDO|PUBLICADO-VENCIDO` (opcional, default ambos)
- `circunscripcion=string` (opcional)
- `from=2026-01-01` / `to=2026-01-31` (opcional)
- `page=1` / `limit=20`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "codigo": "RDAM-2025-01823",
      "nombre_completo": "García Martínez, Juan Carlos",
      "estado": "VENCIDO",
      "circunscripcion": "SANTA_FE",
      "created_at": "2025-09-03T08:00:00Z",
      "fecha_vencimiento": "2025-12-01T14:30:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

## DASHBOARD (Solo SUPERVISOR)

### GET /admin/dashboard
Métricas del panel de control.

**Query params:** `periodo=30d` (7d, 30d, custom con from/to)

**Response 200:**
```json
{
  "kpis": {
    "total": 248,
    "pendientes_pago": 45,
    "pagadas": 23,
    "emitidas_hoy": 8,
    "rechazadas_total": 14,
    "vencidas": 5,
    "publicado_vencido": 12,
    "tasa_rechazo_pct": 5.6
  },
  "por_circunscripcion": [
    { "circunscripcion": "SANTA_FE",     "total": 89 },
    { "circunscripcion": "ROSARIO",      "total": 72 },
    { "circunscripcion": "VENADO_TUERTO","total": 38 },
    { "circunscripcion": "RAFAELA",      "total": 31 },
    { "circunscripcion": "RECONQUISTA",  "total": 18 }
  ],
  "tiempos_promedio": {
    "solicitud_a_pago_hs": 0.5,
    "pago_a_emision_hs": 6.2
  },
  "alertas_sla": [
    {
      "codigo": "RDAM-2026-00231",
      "nombre": "López Pérez, María",
      "circunscripcion": "ROSARIO",
      "estado": "PAGADA",
      "horas_demora": 52,
      "nivel": "CRITICO"
    }
  ],
  "carga_equipo": [
    {
      "operario": { "id": "uuid", "nombre": "L. Rodríguez" },
      "asignadas": 12,
      "emitidas_mes": 8,
      "tiempo_promedio_emision_hs": 3.2
    }
  ]
}
```

---

## USUARIOS INTERNOS (Solo SUPERVISOR)

### GET /admin/usuarios
Listar operarios.

**Response 200:**
```json
{
  "usuarios": [
    {
      "id": "uuid",
      "username": "operario.rodriguez",
      "nombre_completo": "Lucía Rodríguez",
      "rol": "OPERARIO",
      "circunscripcion": "SANTA_FE",
      "activo": true,
      "solicitudes_asignadas": 12,
      "solicitudes_emitidas_mes": 8
    }
  ]
}
```

---

### POST /admin/usuarios
Crear nuevo operario.

**Request:**
```json
{
  "username": "operario.nuevo",
  "password": "TempPass123!",
  "nombre_completo": "Nombre Apellido",
  "circunscripcion": "RAFAELA"
}
```

**Response 201:**
```json
{ "id": "uuid", "username": "operario.nuevo", "rol": "OPERARIO" }
```

---

### PATCH /admin/usuarios/:id
Activar/desactivar operario o cambiar circunscripción.

**Request:**
```json
{ "activo": false }
```
o
```json
{ "circunscripcion": "ROSARIO" }
```

---

## CÓDIGOS DE ERROR GLOBALES

| Código HTTP | Error | Descripción |
|-------------|-------|-------------|
| 400 | `BAD_REQUEST` | Parámetros mal formados |
| 401 | `NO_AUTENTICADO` | Token ausente, inválido o expirado |
| 401 | `OTP_INVALIDO` | Código OTP incorrecto |
| 403 | `SIN_PERMISOS` | El rol no tiene acceso a esta operación |
| 403 | `NO_AUTORIZADO` | Identidad autenticada no corresponde al recurso solicitado |
| 404 | `NO_ENCONTRADO` | Recurso no existe |
| 409 | `ESTADO_INVALIDO` | El estado actual no permite la operación |
| 410 | `CERTIFICADO_VENCIDO` | Certificado fuera de vigencia (> 90 días) |
| 410 | `OTP_EXPIRADO` | OTP vencido o intentos agotados |
| 422 | `VALIDACION` | Error de validación de datos |
| 422 | `TRANSICION_INVALIDA` | Cambio de estado no permitido |
| 429 | `RATE_LIMIT` | Demasiadas solicitudes |
| 500 | `ERROR_INTERNO` | Error no esperado |

---

## NOTAS DE SEGURIDAD

- **Encriptación DNI/CUIL:** AES-256-GCM con IV aleatorio. La clave maestra se almacena en variable de entorno o secrets manager (AWS KMS / Vault).
- **Blind Index:** `SHA256(SALT + dni)` almacenado en `dni_hash` para habilitar búsqueda sin desencriptar.
- **OTP:** Almacenar el código hasheado (no en texto plano). Invalidar tras uso exitoso. TTL en Redis: 600s.
- **JWT ciudadano:** Payload incluye `dni_hash` y `email`. No incluye DNI en texto plano.
- **Rate limiting OTP:** 5 req/min por IP en `/auth/otp/solicitar`. Denylist de email tras 10 intentos en 1h.
- **Rate limiting solicitudes:** 10 req/min por IP en `POST /solicitudes`.
- **Webhook:** Validar `X-Pasarela-Signature` con HMAC-SHA256 antes de procesar. Responder 401 si firma inválida.
- **Upload PDF:** Validar Content-Type real (libmagic), no solo extensión. Escaneo antivirus recomendado.
- **Acceso admin:** El botón "Cargar PDF" solo habilitado en UI cuando `puede_cargar_pdf === true`. El backend valida independientemente en `POST /admin/solicitudes/:id/pdf`.




---

## Nota v2.1

- Backend oficial: NestJS + TypeORM (PostgreSQL), sin Prisma.
- Seguridad: Passport-JWT (JwtAuthGuard) y control de roles para rutas internas.
- Validacion: class-validator + class-transformer con ValidationPipe global.
- Documentacion viva: Swagger/OpenAPI en /docs.
- Errores API: formato uniforme via GlobalExceptionFilter.

