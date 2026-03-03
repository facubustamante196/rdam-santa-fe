# DIAGRAMAS DE ARQUITECTURA — RDAM
## Poder Judicial de la Provincia de Santa Fe
**Version:** 2.1 - Alineado con ALCANCE v2.1 (TypeORM + JWT/OTP + Pay-First + Cron Jobs)

Estos diagramas están en formato **Mermaid**, que se renderiza automáticamente en:
- GitHub / GitLab / Bitbucket
- Notion / Confluence
- VS Code (con extensión Mermaid Preview)
- [Mermaid Live Editor](https://mermaid.live) para exportar como PNG/SVG

---

## 1. Arquitectura de Componentes

```mermaid
graph TB
    subgraph "CIUDADANOS"
        C1[👤 Ciudadano Web]
        C2[📱 Ciudadano Mobile]
    end

    subgraph "FRONTEND"
        POR[🌐 Portal Ciudadano<br/>React/Next.js<br/>Autenticación OTP]
        BACK[🔐 Backoffice<br/>React + JWT<br/>Operario/Supervisor]
    end

    subgraph "BACKEND API"
        API[⚙️ API REST<br/>Node.js/NestJS<br/>JWT Auth]

        subgraph "Servicios"
            AUTH[🔑 Auth Interna<br/>JWT]
            OTP[🔢 OTP Service<br/>Ciudadano]
            SOL[📋 Solicitudes]
            PAG[💳 Pagos + Webhook]
            CRON[⏰ Cron Jobs<br/>Vencimientos]
            AUD[📊 Auditoría]
            EMAIL[📧 Email]
            STOR[📁 Storage]
        end
    end

    subgraph "DATOS"
        DB[(🗄️ PostgreSQL<br/>Solicitudes, Usuarios,<br/>Auditoría, Pagos, OTP)]
        REDIS[(💾 Redis<br/>Sesiones OTP + Cache)]
        S3[☁️ S3/MinIO<br/>PDFs Certificados]
    end

    subgraph "INTEGRACIONES EXTERNAS"
        GATE[💰 Pasarela de Pago<br/>MercadoPago/PayU/Custom]
        SMTP[📮 SendGrid/SES<br/>Envío de emails]
    end

    C1 --> POR
    C2 --> POR
    BACK --> API
    POR --> API

    API --> AUTH
    API --> OTP
    API --> SOL
    API --> PAG
    API --> AUD
    API --> EMAIL
    API --> STOR
    API --> CRON

    AUTH --> DB
    OTP --> REDIS
    SOL --> DB
    PAG --> DB
    AUD --> DB
    CRON --> DB

    STOR --> S3
    EMAIL --> SMTP
    PAG --> GATE

    GATE -.Webhook.-> PAG

    style POR fill:#e0f2fe,stroke:#003057,stroke-width:2px
    style BACK fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style API fill:#d1fae5,stroke:#059669,stroke-width:2px
    style DB fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px
    style REDIS fill:#fce7f3,stroke:#db2777,stroke-width:2px
    style GATE fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style CRON fill:#ecfdf5,stroke:#009FE3,stroke-width:2px
```

---

## 2. Flujo de Estados de Solicitud

> Estados del ciclo de vida completo. Los estados `EN_REVISION` y `APROBADA` **no existen** en este modelo.

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE_PAGO: Ciudadano envía formulario<br/>(OTP validado)

    PENDIENTE_PAGO --> PAGADA: Webhook confirma pago ✅
    PENDIENTE_PAGO --> RECHAZADA: Webhook pago fallido ❌
    PENDIENTE_PAGO --> VENCIDO: CRON: 60 días sin pago ⏰

    PAGADA --> EMITIDA: Operario carga PDF 📄

    state "PUBLICADO-VENCIDO" as PUBLICADO_VENCIDO
    EMITIDA --> PUBLICADO_VENCIDO: CRON: 90 días desde emisión ⏰

    VENCIDO --> [*]: Estado terminal
    RECHAZADA --> [*]: Estado terminal
    PUBLICADO_VENCIDO --> [*]: Descarga bloqueada

    note right of PENDIENTE_PAGO
        Creada al enviar formulario.
        Ciudadano redirigido a pasarela.
        Espera Webhook de confirmación.
    end note

    note right of PAGADA
        Pago confirmado por Webhook.
        Botón "Cargar PDF" habilitado
        en Backoffice.
    end note

    note right of EMITIDA
        PDF subido exitosamente.
        Email automático enviado.
        Certificado válido 90 días.
    end note

    note right of VENCIDO
        CRON diario detecta
        > 60 días en PENDIENTE_PAGO.
        Estado terminal.
    end note

    note right of PUBLICADO_VENCIDO
        CRON diario detecta
        > 90 días desde emisión.
        Descarga bloqueada.
    end note
```

---

## 3. Secuencia del Happy Path (Flujo Completo)

```mermaid
sequenceDiagram
    participant C as 👤 Ciudadano
    participant P as 🌐 Portal Web
    participant API as ⚙️ Backend API
    participant DB as 🗄️ PostgreSQL
    participant REDIS as 💾 Redis
    participant GATE as 💰 Pasarela
    participant O as 👨‍💼 Operario
    participant BO as 🔐 Backoffice
    participant S3 as ☁️ Storage
    participant EMAIL as 📧 Email Service

    rect rgb(220, 235, 255)
        Note over C,REDIS: FASE 1: IDENTIFICACIÓN OTP
        C->>P: Ingresa DNI + Email
        P->>API: POST /auth/otp/solicitar
        API->>REDIS: Guarda OTP (TTL 10min)
        API->>EMAIL: Envía código OTP
        EMAIL->>C: 📧 "Su código: XXXXXX"
        C->>P: Ingresa código OTP
        P->>API: POST /auth/otp/validar
        API->>REDIS: Verifica OTP
        API-->>P: JWT de sesión ciudadano (30min)
        P-->>C: ✅ Acceso habilitado al formulario
    end

    rect rgb(230, 240, 255)
        Note over C,DB: FASE 2: SOLICITUD
        C->>P: Completa y envía formulario
        P->>API: POST /solicitudes (JWT ciudadano)
        API->>API: Encripta DNI/CUIL
        API->>DB: Guarda solicitud (PENDIENTE_PAGO)
        API->>DB: Auditoría: SOLICITUD_CREADA
        API-->>P: { codigo, estado: PENDIENTE_PAGO, url_pago }
        P-->>C: Redirige a pasarela de pago
    end

    rect rgb(255, 245, 230)
        Note over C,DB: FASE 3: PAGO (Pay-First)
        C->>GATE: Completa pago en pasarela
        GATE->>API: POST /webhooks/pago { evento: PAGO_CONFIRMADO }
        API->>API: Valida firma HMAC del Webhook
        API->>DB: Estado → PAGADA
        API->>DB: Auditoría: PAGO_CONFIRMADO
        API->>EMAIL: Notifica pago recibido
        EMAIL->>C: 📧 "Pago recibido, en proceso"
    end

    rect rgb(245, 230, 255)
        Note over O,EMAIL: FASE 4: EMISIÓN (Backoffice)
        O->>BO: Login con user + password
        BO->>API: GET /admin/solicitudes?estado=PAGADA
        API-->>BO: Lista de solicitudes PAGADAS
        O->>BO: Abre detalle → Botón "Cargar PDF" habilitado ✅
        O->>BO: Sube PDF del certificado
        BO->>API: POST /admin/solicitudes/:id/pdf
        API->>S3: Guarda PDF
        API->>DB: Estado → EMITIDA + issued_at = NOW()
        API->>DB: Auditoría: CERTIFICADO_EMITIDO
        API->>EMAIL: Trigger email con link de descarga
        EMAIL->>C: 📧 "Su certificado está listo"
        API-->>BO: ✅ Emisión completada
    end

    rect rgb(230, 255, 245)
        Note over C,S3: FASE 5: DESCARGA
        C->>P: Click en link del email
        P->>API: GET /solicitudes/:codigo/download (Bearer JWT OTP)
        API->>DB: Verifica estado = EMITIDA y no vencido
        API->>S3: Genera URL presignada
        P-->>C: Descarga PDF ✅
    end
```

---

## 4. Diagrama de Flujo de Proceso

```mermaid
flowchart TD
    START([🏁 Inicio]) --> DNIEMAIL[👤 Ciudadano ingresa<br/>DNI + Email]
    DNIEMAIL --> OTPSEND[📧 Sistema envía OTP<br/>por email]
    OTPSEND --> OTPINPUT[🔢 Ciudadano ingresa código]
    OTPINPUT --> OTPVAL{✅ OTP válido?}

    OTPVAL -->|❌ Inválido| OTPERR[⚠️ Error: reintento<br/>Máx 3 intentos]
    OTPERR --> OTPINPUT
    OTPVAL -->|✅ Válido| FORM[📋 Formulario desbloqueado<br/>DNI pre-llenado]

    FORM --> SUBMIT[📤 Ciudadano envía formulario]
    SUBMIT --> CREATE[💾 Solicitud creada<br/>Estado: PENDIENTE_PAGO]
    CREATE --> REDIRECT[🔀 Redirigido a<br/>Pasarela de Pago]

    REDIRECT --> PAYDECIDE{💳 Resultado del pago<br/>vía Webhook}

    PAYDECIDE -->|❌ PAGO_FALLIDO| RECHAZADA[🚫 Estado: RECHAZADA<br/>Email notificación]
    RECHAZADA --> ENDREJ([🔚 Fin])

    PAYDECIDE -->|✅ PAGO_CONFIRMADO| PAGADA[✅ Estado: PAGADA<br/>Email confirmación]

    PAGADA --> QUEUE[⏳ Visible para Operarios<br/>en Backoffice]
    QUEUE --> OPERARIO[👨‍💼 Operario ve solicitud<br/>Botón PDF habilitado ✅]
    OPERARIO --> LOADPDF[📄 Operario carga PDF]
    LOADPDF --> UPLOAD[☁️ Sistema sube a S3/MinIO]
    UPLOAD --> EMITIDA[🎉 Estado: EMITIDA<br/>issued_at = NOW]
    EMITIDA --> NOTIF[📧 Email automático<br/>con link de descarga]
    NOTIF --> DOWNLOAD[📥 Ciudadano descarga PDF]
    DOWNLOAD --> END([🏁 Fin - Proceso completo])

    CREATE -.->|CRON: 60 días sin pago| VENCIDO[⏰ Estado: VENCIDO<br/>Estado terminal]
    EMITIDA -.->|CRON: 90 días desde emisión| PUBVENC[⏰ Estado: PUBLICADO-VENCIDO<br/>Descarga bloqueada]

    style FORM fill:#e0f2fe,stroke:#003057
    style PAGADA fill:#d1fae5,stroke:#059669
    style EMITIDA fill:#f3e8ff,stroke:#7c3aed
    style RECHAZADA fill:#fee2e2,stroke:#dc2626
    style VENCIDO fill:#fef3c7,stroke:#d97706,stroke-dasharray: 5 5
    style PUBVENC fill:#fef3c7,stroke:#d97706,stroke-dasharray: 5 5
    style END fill:#d1fae5,stroke:#059669,stroke-width:3px
    style ENDREJ fill:#fee2e2,stroke:#dc2626,stroke-width:3px
```

---

## 5. Diagrama de Cron Jobs (Vencimientos Automáticos)

```mermaid
flowchart LR
    subgraph "CRON: Vencimiento de Solicitud"
        direction TB
        C1[⏰ Ejecuta diariamente<br/>00:00 hs] --> Q1["SELECT solicitudes<br/>WHERE estado = 'PENDIENTE_PAGO'<br/>AND created_at < NOW() - 60d"]
        Q1 --> U1["UPDATE estado → 'VENCIDO'<br/>Registra en auditoria"]
        U1 --> L1[📋 Log: N registros afectados]
    end

    subgraph "CRON: Vencimiento de Certificado"
        direction TB
        C2[⏰ Ejecuta diariamente<br/>00:00 hs] --> Q2["SELECT solicitudes<br/>WHERE estado = 'EMITIDA'<br/>AND issued_at < NOW() - 90d"]
        Q2 --> U2["UPDATE estado → 'PUBLICADO-VENCIDO'<br/>Registra en auditoria"]
        U2 --> L2[📋 Log: N registros afectados]
    end

    style C1 fill:#fef3c7,stroke:#d97706
    style C2 fill:#fef3c7,stroke:#d97706
    style U1 fill:#fee2e2,stroke:#dc2626
    style U2 fill:#fee2e2,stroke:#dc2626
```

---

## 6. Diagrama de Habilitación de Controles (Backoffice)

```mermaid
flowchart TD
    ESTADO[Estado de la Solicitud] --> CHECK{¿Estado = PAGADA?}

    CHECK -->|✅ Sí| ENABLED[🟢 Botón Cargar PDF<br/>HABILITADO]
    CHECK -->|❌ No| DISABLED[🔴 Botón Cargar PDF<br/>DESHABILITADO - disabled]

    DISABLED --> CASOS["Estados que deshabilitan:<br/>• PENDIENTE_PAGO<br/>• RECHAZADA<br/>• VENCIDO<br/>• EMITIDA<br/>• PUBLICADO-VENCIDO"]

    style ENABLED fill:#d1fae5,stroke:#059669,stroke-width:3px
    style DISABLED fill:#fee2e2,stroke:#dc2626,stroke-width:3px
    style CASOS fill:#fef3c7,stroke:#d97706
```

---

## 7. Diagrama de Arquitectura de Datos

```mermaid
erDiagram
    USUARIOS ||--o{ SOLICITUDES : "operario_asignado"
    USUARIOS ||--o{ AUDITORIA : "ejecuta"
    SOLICITUDES ||--o{ AUDITORIA : "registra"
    SOLICITUDES ||--o{ TRANSACCIONES_PAGO : "tiene"

    USUARIOS {
        uuid id PK
        string username UK
        string password_hash
        string nombre_completo
        enum rol "OPERARIO, SUPERVISOR"
        enum circunscripcion
        boolean activo
        timestamp fecha_creacion
    }

    SOLICITUDES {
        uuid id PK
        string codigo UK "RDAM-YYYY-NNNNN"
        text dni_encriptado "AES-256-GCM"
        text cuil_encriptado "AES-256-GCM"
        string dni_hash "blind index"
        string nombre_completo
        date fecha_nacimiento
        string email
        enum circunscripcion
        enum estado "PENDIENTE_PAGO | PAGADA | RECHAZADA | VENCIDO | EMITIDA | PUBLICADO-VENCIDO"
        uuid operario_asignado_id FK
        text observaciones_rechazo
        string pdf_url
        timestamp issued_at "fecha de emisión del PDF"
        timestamp fecha_vencimiento "issued_at + 90d"
        timestamp created_at
        timestamp updated_at
    }

    OTP_TOKENS {
        uuid id PK
        string dni_hash "para identificar ciudadano"
        string email
        string otp_code_hash "hash del OTP"
        timestamp expires_at "now + 10min"
        boolean used
        timestamp created_at
    }

    TRANSACCIONES_PAGO {
        uuid id PK
        uuid solicitud_id FK
        decimal monto
        enum estado "PENDIENTE, CONFIRMADO, FALLIDO"
        string referencia_pasarela
        string metodo_pago
        jsonb payload_pasarela
        timestamp fecha_pago
    }

    AUDITORIA {
        uuid id PK
        uuid solicitud_id FK
        uuid usuario_id FK "nullable — NULL si es sistema/cron"
        string accion
        string estado_anterior
        string estado_nuevo
        text observaciones
        string actor_tipo "CIUDADANO | OPERARIO | SUPERVISOR | SISTEMA | CRON | WEBHOOK"
        boolean forzado_supervisor
        timestamp timestamp
    }
```

---

## 8. Diagrama de Despliegue

```mermaid
graph TB
    subgraph "ZONA PÚBLICA - DMZ"
        LB[⚖️ Load Balancer<br/>HTTPS]
        PORTAL[🌐 Portal Web<br/>Next.js Static<br/>CDN/S3]
    end

    subgraph "ZONA PRIVADA - VPC"
        API1[⚙️ API Server 1<br/>Node.js]
        API2[⚙️ API Server 2<br/>Node.js]
        CRONWORKER[⏰ Cron Worker<br/>Job de Vencimientos]

        subgraph "Datos"
            DB_MASTER[(🗄️ PostgreSQL<br/>Master)]
            DB_REPLICA[(📊 PostgreSQL<br/>Replica)]
        end

        subgraph "Cache"
            REDIS[💾 Redis<br/>OTP Sessions + Cache]
        end
    end

    subgraph "SERVICIOS EXTERNOS"
        S3[☁️ AWS S3<br/>PDFs]
        EMAIL[📧 SendGrid<br/>Emails]
        GATE[💰 Pasarela<br/>Pagos]
    end

    subgraph "BACKOFFICE"
        BACK[🔐 Backoffice App<br/>React SPA<br/>Deploy interno]
    end

    USERS[👥 Ciudadanos<br/>Internet] --> LB
    LB --> PORTAL
    LB --> API1
    LB --> API2

    STAFF[👨‍💼 Personal Interno<br/>Red Interna] --> BACK
    BACK --> LB

    PORTAL --> API1
    PORTAL --> API2

    API1 --> DB_MASTER
    API2 --> DB_MASTER
    API1 --> REDIS
    API2 --> REDIS
    CRONWORKER --> DB_MASTER

    DB_MASTER --> DB_REPLICA

    API1 --> S3
    API2 --> S3
    API1 --> EMAIL
    API2 --> EMAIL
    API1 --> GATE
    API2 --> GATE

    GATE -.Webhook.-> LB

    style LB fill:#fef3c7,stroke:#d97706,stroke-width:3px
    style PORTAL fill:#e0f2fe,stroke:#003057,stroke-width:2px
    style BACK fill:#fef9c3,stroke:#ca8a04,stroke-width:2px
    style DB_MASTER fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px
    style S3 fill:#d1fae5,stroke:#059669,stroke-width:2px
    style CRONWORKER fill:#ecfdf5,stroke:#009FE3,stroke-width:2px
    style REDIS fill:#fce7f3,stroke:#db2777,stroke-width:2px
```

---

## 9. Diagrama de Seguridad (Flujo de Datos Sensibles)

```mermaid
graph LR
    subgraph "CIUDADANO"
        C[👤 Ingresa DNI:<br/>'30456789']
    end

    subgraph "FRONTEND"
        F[📱 Portal Web<br/>HTTPS]
    end

    subgraph "BACKEND API"
        API[🔐 API Endpoint]
        ENC[🔒 Encryption Service<br/>AES-256-GCM]
        HASH[#️⃣ Blind Index<br/>SHA-256]
    end

    subgraph "DATABASE"
        DB[(🗄️ PostgreSQL<br/>Encrypted at Rest)]
    end

    C -->|POST /auth/otp/solicitar<br/>{"dni":"30456789","email":"..."}| F
    F -->|TLS 1.3| API
    API --> ENC
    API --> HASH

    ENC -->|dni_encriptado:<br/>'e4a8f3b...'<br/>IV: random| DB
    HASH -->|dni_hash:<br/>'7f9a2c1...'<br/>(salt + dni)| DB

    DB -.Búsqueda por blind index.-> API
    API -.Solo hash,<br/>nunca DNI plano.-> DB

    DB -.Lee encriptado.-> API
    API -.Desencripta solo<br/>en Detalle + JWT.-> VIEW[👁️ Vista Detalle<br/>Operario]

    style C fill:#e0f2fe,stroke:#003057
    style F fill:#d1fae5,stroke:#059669
    style ENC fill:#fee2e2,stroke:#dc2626,stroke-width:3px
    style HASH fill:#fef3c7,stroke:#d97706,stroke-width:3px
    style DB fill:#f3e8ff,stroke:#7c3aed,stroke-width:3px
```

---

## Cómo Usar Estos Diagramas

### En GitHub/GitLab
Los bloques de código Mermaid se renderizan automáticamente. Solo pegá este archivo en tu repo.

### En Notion/Confluence
Copiá el código Mermaid y pegalo en un bloque de código con lenguaje `mermaid`.

### Exportar como Imagen
1. Abrí [Mermaid Live Editor](https://mermaid.live)
2. Pegá el código del diagrama
3. Descargá como PNG o SVG
4. Usalo en presentaciones PowerPoint/Google Slides

### En VS Code
Instalá la extensión **"Markdown Preview Mermaid Support"** y el preview de este archivo mostrará los diagramas renderizados.



---

## Nota v2.1

- Backend oficial: NestJS + TypeORM (PostgreSQL), sin Prisma.
- Seguridad: Passport-JWT (JwtAuthGuard) y control de roles para rutas internas.
- Validacion: class-validator + class-transformer con ValidationPipe global.
- Documentacion viva: Swagger/OpenAPI en /docs.
- Errores API: formato uniforme via GlobalExceptionFilter.

