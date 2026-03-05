# DOCUMENTO DE ALCANCE — RDAM
## Plataforma Digital para Certificados del Registro de Deudores Alimentarios Morosos

**Cliente:** Poder Judicial de la Provincia de Santa Fe
**Fecha:** Febrero 2026
**Version:** 2.1 *(Actualizacion: backend consolidado en NestJS + TypeORM, sin Prisma, con Swagger `/docs` y manejo global de errores)*

> **Identidad Visual:** Azul Institucional `#003057` · Celeste Acento `#009FE3` · Tipografía moderna (Inter / Roboto)

---

## 1. Resumen Ejecutivo

El presente proyecto digitaliza completamente el proceso de solicitud, pago y emisión de certificados del **Registro de Deudores Alimentarios Morosos (RDAM)** de la Provincia de Santa Fe. El sistema reemplaza el proceso manual actual, reduciendo el tiempo de emisión de días a horas, eliminando la presencialidad del ciudadano y permitiendo al personal gestionar solicitudes de forma centralizada y auditable.

La solución se compone de tres capas principales:

| Capa | Descripción |
|---|---|
| **Portal Ciudadano** | Interfaz pública con autenticación OTP. El ciudadano solicita, paga y descarga su certificado. |
| **Panel de Gestión (Backoffice)** | Interfaz interna para Operarios y Supervisores. Revisa, asigna y emite certificados. |
| **Servicios de Plataforma** | API REST, jobs programados (cron), webhook de pago, almacenamiento S3/MinIO, notificaciones por email. |

---

## 2. Objetivos del Proyecto

### 2.1 Objetivos de Negocio
- **Reducir tiempo de emisión** de 5–7 días hábiles a menos de 48 horas
- **Eliminar presencialidad** del ciudadano (100% digital)
- **Garantizar el cobro previo** a cualquier tarea operativa interna (modelo Pay-First)
- **Aumentar la transparencia** con seguimiento en tiempo real del estado de cada solicitud
- **Garantizar trazabilidad** completa con auditoría inmutable de todas las acciones

### 2.2 Objetivos Técnicos
- Sistema web responsive accesible desde cualquier dispositivo
- Autenticación de ciudadano por OTP de un solo uso enviado por email (sin registro)
- Integración segura con pasarela de pago vía **Webhook** para confirmación asíncrona
- Automatización de ciclo de vida de solicitudes mediante **Cron Jobs** (vencimientos)
- Almacenamiento seguro de certificados PDF con acceso controlado y con fecha de expiración
- Encriptación AES-256 de datos sensibles (DNI, CUIL)

---

## 3. Alcance Funcional

### 3.1 Portal Ciudadano

#### A. Identificación y Autenticación OTP *(Requerimiento de Seguridad)*

| Paso | Acción | Regla de Negocio |
|------|--------|-----------------|
| 1 | Ciudadano ingresa **DNI** y **Email** | Son los únicos datos requeridos para iniciar |
| 2 | Ciudadano completa desafío **CAPTCHA** ("No soy un robot") | Sin CAPTCHA válido no se envía OTP |
| 3 | Sistema envía un código **OTP de 6 dígitos** al email ingresado | El OTP expira en **10 minutos** |
| 4 | Ciudadano ingresa el código OTP en la pantalla de verificación | Máximo 3 intentos antes de requerir reenvío |
| 5 | Sistema valida el OTP | ⛔ El formulario de solicitud está **bloqueado** hasta este paso |
| 6 | Acceso habilitado al formulario de solicitud | El DNI queda pre-completado y no es editable |

> **🔒 REGLA CRÍTICA:** El acceso al formulario de solicitud requiere OTP validado exitosamente. No existe vía alternativa de acceso.

#### B. Solicitud y Pago *(Flujo Pay-First)*

✅ Formulario digital con validación en tiempo real (campos requeridos, formato DNI/CUIL)
✅ Al enviar el formulario, la solicitud se crea con estado `PENDIENTE_PAGO`
✅ El ciudadano es redirigido **inmediatamente** a la pasarela de pagos externa
✅ El sistema actualiza el estado **únicamente tras recibir el Webhook** de la pasarela:
  - Pago exitoso → Estado: `PAGADA`
  - Pago fallido/rechazado → Estado: `RECHAZADA`

> **⚠️ REGLA CRÍTICA:** El estado de una solicitud **nunca cambia por acción directa del ciudadano**. Solo el Webhook de la pasarela de pago es la fuente de verdad del resultado del pago.

#### C. Consulta y Descarga

✅ Historial de solicitudes previas del ciudadano (identificado por DNI)
✅ Consulta de estado en tiempo real mediante token de seguimiento
✅ Descarga del certificado PDF (solo si estado es `EMITIDA` y dentro de los 90 días de validez)
✅ Notificación por email cuando el certificado está disponible para descarga
✅ Certificados en estado `PUBLICADO-VENCIDO` **bloquean la descarga** y muestran mensaje de expiración

---

### 3.2 Panel de Gestión Interno (Backoffice)

#### A. Autenticación y Roles

✅ Autenticación con usuario y contraseña para personal del Poder Judicial
✅ Dos roles: **Operario** (revisa y emite) y **Supervisor** (gestiona equipo + métricas globales)

#### B. Gestión de Solicitudes por el Operario

| Función | Descripción | Regla de Negocio |
|---------|-------------|-----------------|
| **Vista de lista** | Muestra **todas las solicitudes** del sistema | El Operario ve la lista completa, sin filtro de asignación obligatorio |
| **Filtros** | Por estado, circunscripción, fecha, operario | — |
| **Vista de detalle** | Datos del ciudadano, historial de estados | — |
| **Botón "Cargar PDF / Emitir"** | Sube el certificado PDF al sistema | ⛔ **DESHABILITADO por defecto**. Solo se habilita si el estado es estrictamente `PAGADA` |
| **Cambio de estado a `EMITIDA`** | Al subir exitosamente el PDF | Sistema envía email automático al ciudadano |

> **🔒 REGLA CRÍTICA:** El control de carga de PDF es **disabled** en cualquier estado que no sea `PAGADA`. Esto aplica a solicitudes en estado `PENDIENTE_PAGO`, `RECHAZADA`, `VENCIDO`, `EMITIDA` y `PUBLICADO-VENCIDO`.

#### C. Funcionalidades del Supervisor

✅ Todo lo de Operario, más:
✅ Dashboard con métricas operativas (KPIs, tiempos, alertas SLA)
✅ Gestión de equipo: crear/desactivar operarios, asignar solicitudes
✅ Auditoría completa de todas las acciones del sistema

---

### 3.3 Servicios de Plataforma (Cron Jobs y Webhooks)

#### A. Webhook de Pasarela de Pago

El sistema expone un endpoint seguro que recibe notificaciones asíncronas de la pasarela:

```
POST /webhooks/pago
```

| Evento recibido | Acción del sistema |
|---|---|
| `PAGO_CONFIRMADO` | Cambia estado de la solicitud a `PAGADA` + envía email de confirmación al ciudadano |
| `PAGO_FALLIDO` | Cambia estado a `RECHAZADA` + envía email de notificación al ciudadano |

#### B. Cron Jobs de Vencimiento Automático

El sistema ejecuta dos jobs programados para gestionar el ciclo de vida de las solicitudes:

| Job | Frecuencia | Condición | Acción |
|-----|-----------|-----------|--------|
| **Vencimiento de Solicitud** | Diario (00:00 hs) | Estado = `PENDIENTE_PAGO` **Y** `created_at < NOW() - interval '60 days'` | Cambia estado → `VENCIDO` |
| **Vencimiento de Certificado** | Diario (00:00 hs) | Estado = `EMITIDA` **Y** `issued_at < NOW() - interval '90 days'` | Cambia estado → `PUBLICADO-VENCIDO` + bloquea descarga |

> **⚠️ NOTA:** Los jobs deben ser **idempotentes** y registrar cada ejecución en el log de auditoría con la cantidad de registros afectados.

---

## 4. Matriz de Estados del Ciclo de Vida

### 4.1 Tabla de Estados

| Estado | Código | Descripción | Acciones Disponibles |
|--------|--------|-------------|---------------------|
| **Pendiente de Pago** | `PENDIENTE_PAGO` | Solicitud creada. Aguarda confirmación de pago de la pasarela. | — (solo lectura) |
| **Pagada** | `PAGADA` | Pago confirmado por Webhook. Lista para ser procesada por un Operario. | ✅ Operario puede cargar PDF |
| **Rechazada** | `RECHAZADA` | Pago fallido o rechazado por la pasarela. | — (solo lectura) |
| **Vencida** | `VENCIDO` | Pasaron 60 días en `PENDIENTE_PAGO` sin pago confirmado. Job automático. | — (solo lectura) |
| **Emitida** | `EMITIDA` | Operario cargó el PDF. Certificado disponible para descarga. | ✅ Ciudadano puede descargar |
| **Certificado Vencido** | `PUBLICADO-VENCIDO` | Pasaron 90 días desde emisión del PDF. Job automático. | ⛔ Descarga bloqueada |

### 4.2 Diagrama de Transiciones de Estado

```
                     [CIUDADANO ingresa DNI + Email]
                               │
                         [OTP enviado]
                               │
                     [Ciudadano valida OTP]
                               │
                   [Ciudadano completa formulario]
                               │
                               ▼
                    ┌─────────────────────┐
                    │   PENDIENTE_PAGO    │ ─── (60 días sin pago) ──► VENCIDO
                    └─────────────────────┘
                        │           │
          [Webhook: pago OK]   [Webhook: pago fallido]
                        │           │
                        ▼           ▼
                    ┌────────┐  ┌──────────┐
                    │ PAGADA │  │ RECHAZADA│
                    └────────┘  └──────────┘
                        │
               [Operario carga PDF]
                        │
                        ▼
                    ┌─────────┐
                    │ EMITIDA │ ─── (90 días desde emisión) ──► PUBLICADO-VENCIDO
                    └─────────┘
                        │
               [Ciudadano descarga]
                        │
                        ▼
                  [Descarga exitosa]
```

### 4.3 Reglas de Habilitación de Controles (Backoffice)

| Control | `PENDIENTE_PAGO` | `PAGADA` | `RECHAZADA` | `VENCIDO` | `EMITIDA` | `PUBLICADO-VENCIDO` |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| Botón "Cargar PDF / Emitir" | ⛔ disabled | ✅ **habilitado** | ⛔ disabled | ⛔ disabled | ⛔ disabled | ⛔ disabled |
| Botón "Ver solicitud" | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Descarga (ciudadano) | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ bloqueado |

---

## 5. Flujo de Proceso Completo

```
PORTAL CIUDADANO                          PASARELA / SISTEMA                    BACKOFFICE

1. Ingresa DNI + Email
      │
      ▼
2. Recibe OTP por email ──────────────── Email enviado automáticamente
      │
      ▼
3. Valida código OTP
      │ (si OTP inválido → error, reintentar)
      ▼
4. Completa formulario de solicitud
      │
      ▼
5. Envía formulario ──────────────────── Solicitud creada: PENDIENTE_PAGO
      │                                        │
      ▼                                        ▼
6. Redirigido a Pasarela de Pagos       Espera Webhook...
      │
      ├─[Pago exitoso]──────────────── Webhook → Estado: PAGADA
      │                                        │
      │                                        ▼
      │                                 7. Operario ve solicitud PAGADA
      │                                 8. Botón "Cargar PDF" se habilita
      │                                 9. Operario carga PDF del certificado
      │                                        │
      │                                        ▼
      │                                 Estado: EMITIDA
      │                                 Email enviado al ciudadano ─────────────►
      │
10. Ciudadano recibe email de aviso
      │
      ▼
11. Descarga su certificado PDF
      │
      └─ (90 días después) ─────────── CRON → Estado: PUBLICADO-VENCIDO
                                         (descarga bloqueada)
      │
      └─[Pago rechazado]─────────────── Webhook → Estado: RECHAZADA
                                         Email de notificación enviado

      └─[Sin pago en 60 días]────────── CRON → Estado: VENCIDO
```

**Tiempo objetivo (happy path):** Máximo 48 horas desde solicitud hasta descarga disponible.

---

## 6. Usuarios y Roles

| Rol | Cantidad Estimada | Descripción |
|-----|-------------------|-------------|
| **Ciudadano** | Ilimitado | Cualquier persona. Se identifica via OTP. Sin registro permanente en el sistema. |
| **Operario** | 10–15 | Personal del Poder Judicial. Ve todas las solicitudes. Carga el PDF solo si estado es `PAGADA`. |
| **Supervisor** | 3–5 | Jefes de área. Mismas capacidades que Operario + métricas globales y gestión de equipo. |

---

## 7. Exclusiones (Fuera de Alcance)

| Ítem | Motivo |
|------|--------|
| ❌ **Firma digital certificada de PDFs** | El PDF se carga manualmente; no se genera ni firma automáticamente |
| ❌ **Generación automática del contenido del PDF** | El certificado se elabora fuera del sistema (Word, sistema legacy) |
| ❌ **Validación contra RENAPER u organismos externos** | Solo validaciones de formato; no hay integración con registros nacionales |
| ❌ **Registro y login permanente de ciudadanos** | El portal usa OTP de un solo uso; no hay cuentas de usuario persistentes |
| ❌ **Aplicación móvil nativa (iOS/Android)** | El sistema web es responsive; no hay app móvil |
| ❌ **Reembolsos automáticos** | Si el pago fue exitoso y la solicitud se rechaza internamente, el reembolso se gestiona manualmente |
| ❌ **Reportes avanzados de BI** | Solo el dashboard básico de KPIs incluido; sin integración con herramientas de BI |
| ❌ **Gestión de turnos presenciales** | El sistema es 100% digital; no gestiona filas ni turnos físicos |

---

## 8. Supuestos y Dependencias

### 8.1 Supuestos
1. Los ciudadanos tienen acceso a una casilla de email válida para recibir OTP y notificaciones
2. El personal del Poder Judicial cuenta con equipos con acceso a internet
3. El contenido del certificado PDF se elabora fuera del sistema
4. El monto del arancel está por definir (placeholder: `$2.750`)
5. Existe presupuesto aprobado para servicios externos (pasarela de pago, email, storage S3)

### 8.2 Dependencias Externas

| Servicio | Uso | Proveedor (a confirmar) |
|----------|-----|------------------------|
| **Pasarela de Pago** | Cobro del arancel + Webhook de confirmación | Mercado Pago, PayU, decidir.com |
| **Servicio de Email** | Envío de OTP, notificaciones de estado | SendGrid, AWS SES |
| **Almacenamiento S3** | Guardar PDFs de certificados | AWS S3 o MinIO (self-hosted) |
| **Scheduler/Cron** | Ejecución de jobs de vencimiento | node-cron, pg_cron, Bull/BullMQ |
| **Infraestructura** | Hosting, base de datos PostgreSQL, Redis | A confirmar |

---

## 9. Criterios de Éxito

| Criterio | Métrica Objetivo |
|----------|-----------------|
| ✅ **OTP funcional** | 100% de ciudadanos reciben y pueden validar su OTP |
| ✅ **Flujo Pay-First** | 100% de solicitudes creadas pasan por pasarela antes de ser procesadas |
| ✅ **Webhook confiable** | 99.9% de confirmaciones de pago procesadas correctamente |
| ✅ **Cron Jobs** | Vencimientos ejecutados diariamente con 0% de solicitudes omitidas |
| ✅ **Control Backoffice** | Botón de carga jamás aparece habilitado en estados distintos a `PAGADA` |
| ✅ **Performance** | Lista de solicitudes carga en menos de 500 ms |
| ✅ **Seguridad** | DNI y CUIL encriptados con AES-256; auditoría completa funcionando |
| ✅ **Usabilidad** | Tasa de abandono de formulario < 10% |
| ✅ **Disponibilidad** | Uptime ≥ 99.5% en horario hábil |
| ✅ **Adopción** | ≥ 80% de solicitudes procesadas digitalmente a los 3 meses del lanzamiento |

---

## 10. Consideraciones de Alineación Técnica

Con el fin de mantener coherencia entre este documento de alcance y la implementación, se señalan los siguientes puntos de atención para el equipo de desarrollo:

### 10.1 Modelo de Base de Datos (`solicitudes`)

El campo `estado` debe usar el tipo ENUM o sus equivalentes con los valores exactos definidos en la Matriz de Estados (§4):

```sql
-- Valores permitidos para el campo 'estado':
PENDIENTE_PAGO | PAGADA | RECHAZADA | VENCIDO | EMITIDA | PUBLICADO-VENCIDO
```

Campos adicionales necesarios para los Cron Jobs:
- `created_at TIMESTAMPTZ` — para calcular vencimiento de 60 días
- `issued_at TIMESTAMPTZ` — para calcular vencimiento de 90 días del certificado
- Tabla `otp_tokens`: `otp_code_hash`, `expires_at`, `intentos`, `used` — para el flujo de verificación OTP

### 10.2 Controlador de Webhook de Pago

El endpoint del Webhook debe:
1. Validar la firma/secret del proveedor de pagos antes de procesar
2. Ser **idempotente** (misma notificación no debe cambiar el estado dos veces)
3. Solo actualizar el estado si la solicitud está en `PENDIENTE_PAGO`
4. Registrar el evento en la tabla de auditoría

### 10.3 Servicios de Notificación (Email)

Los emails disparados por el sistema son:
| Disparador | Asunto sugerido |
|-----------|-----------------|
| OTP generado | *"Su código de verificación RDAM: XXXXXX"* |
| Pago confirmado (`PAGADA`) | *"Pago recibido — Su solicitud está en proceso"* |
| Pago rechazado (`RECHAZADA`) | *"No pudimos procesar su pago — Solicitud RDAM"* |
| Certificado emitido (`EMITIDA`) | *"Su certificado RDAM está disponible para descargar"* |
| Certificado por vencer | *(Opcional)* Aviso preventivo 7 días antes de `PUBLICADO-VENCIDO` |

### 10.4 Seguridad del Formulario OTP

- El endpoint que devuelve el formulario de solicitud debe verificar sesión OTP activa
- La sesión OTP debe invalidarse tras consumo exitoso (no reutilizable)
- El token de sesión OTP puede implementarse como JWT de corta duración o registro en Redis

---



---

## Nota v2.1

- Backend oficial: NestJS + TypeORM (PostgreSQL), sin Prisma.
- Seguridad: Passport-JWT (JwtAuthGuard) y control de roles para rutas internas.
- Validacion: class-validator + class-transformer con ValidationPipe global.
- Documentacion viva: Swagger/OpenAPI en /docs.
- Errores API: formato uniforme via GlobalExceptionFilter.

