# RDAM Frontend — Proyecto Poder Judicial Santa Fe

Frontend completo del sistema RDAM (Registro de Deudores Alimentarios Morosos).

## Stack tecnológico

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (con tokens de diseño personalizados)
- **shadcn/ui** (componentes base)
- **React Hook Form** + **Zod** (formularios con validación en tiempo real)
- **Zustand** (estado global: sesión, flujo de solicitud)
- **Sonner** (notificaciones toast)

---

## Configuración inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local
# Editar NEXT_PUBLIC_API_URL con la URL base de la API RDAM

# 3. Desarrollo
npm run dev
```

---

## Estructura del proyecto

```
rdam-frontend/
├── app/
│   ├── page.tsx                    # Landing ciudadano
│   ├── layout.tsx                  # Root layout (fuentes, Toaster)
│   ├── globals.css                 # Design tokens, variables CSS
│   │
│   ├── solicitar/                  # Flujo solicitud ciudadano
│   │   ├── layout.tsx              # Layout con header RDAM
│   │   ├── page.tsx                # Paso 1: DNI + Email + reCAPTCHA
│   │   ├── otp/page.tsx            # Paso 2: Validar código OTP (6 dígitos)
│   │   ├── formulario/page.tsx     # Paso 3: Datos completos + selector circunscripción
│   │   ├── pago/page.tsx           # Paso 4: Iniciar pago
│   │   └── consulta/page.tsx       # Consulta de estado por código o DNI+email
│   │
│   └── admin/                      # Panel de administración
│       ├── layout.tsx              # Sidebar + topbar
│       ├── login/page.tsx          # Login interno (username/password)
│       ├── dashboard/page.tsx      # KPIs y métricas por período
│       ├── solicitudes/page.tsx    # Lista con filtros, paginación, acciones
│       ├── usuarios/page.tsx       # ABM operarios (SUPERVISOR)
│       ├── alertas/page.tsx        # Alertas SLA con niveles CRITICO/ALTO/MEDIO/BAJO
│       └── auditoria/page.tsx      # Log de acciones del sistema
│
├── components/
│   ├── ui/                         # Componentes primitivos (Button, Input, Card, Badge…)
│   ├── citizen/                    # Componentes del flujo ciudadano
│   │   └── solicitud-progress.tsx  # Stepper 5 pasos
│   └── shared/
│       ├── otp-input.tsx           # 6 cajas individuales con paste support
│       ├── circunscripcion-selector.tsx  # Selector visual de circunscripciones
│       ├── recaptcha-mock.tsx      # Placeholder reCAPTCHA (reemplazar con @google/recaptcha)
│       └── estado-badge.tsx        # Badge coloreado por estado de solicitud
│
├── lib/
│   ├── api/index.ts                # Cliente HTTP tipado — todos los endpoints del mapa
│   ├── schemas/index.ts            # Esquemas Zod para todos los formularios
│   ├── stores/
│   │   ├── auth.store.ts           # Sesión ciudadano y admin (Zustand persist)
│   │   └── solicitud.store.ts      # Estado del flujo de solicitud (step machine)
│   └── utils.ts                    # cn(), formatDate(), formatDateTime()
```

---

## Flujo ciudadano

```
Landing → [Solicitar certificado]
  → /solicitar       (Paso 1: DNI + Email + reCAPTCHA → POST /auth/otp/solicitar)
  → /solicitar/otp   (Paso 2: Código OTP 6 dígitos    → POST /auth/otp/validar → JWT)
  → /solicitar/formulario (Paso 3: CUIL, nombre, fecha_nac, email, circunscripción → POST /solicitudes)
  → /solicitar/pago  (Paso 4: Iniciar pago → POST /pagos/iniciar → redirect pasarela)
```

El estado del flujo se mantiene en `useSolicitudStore` (Zustand in-memory, no persiste entre sesiones).

---

## Panel de administración

### Roles
- **OPERARIO**: acceso a Dashboard y Solicitudes (sin acciones de SUPERVISOR)
- **SUPERVISOR**: acceso completo: Dashboard, Solicitudes, Alertas SLA, Operarios, Auditoría

### Login
```
POST /auth/login → access_token + usuario (con rol)
```
El token y perfil se persisten en `useAuthStore` via `zustand/persist` en `localStorage`.

---

## Variables de entorno

```env
NEXT_PUBLIC_API_URL=https://api.rdam.jussantafe.gov.ar
# NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...  (para reemplazar el reCAPTCHA mock)
```

---

## Integrar reCAPTCHA real

1. Instalar: `npm install react-google-recaptcha`
2. Reemplazar `<RecaptchaMock>` en `/app/solicitar/page.tsx` con `<ReCAPTCHA>`
3. Agregar `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` en `.env.local`

---

## Personalización de estilos

Los tokens de diseño están en `app/globals.css` como variables CSS HSL.  
Las fuentes son **Lora** (display/títulos) + **DM Sans** (body), cargadas con `next/font/google`.

---

## Convenciones de código

- Componentes: PascalCase, un componente por archivo
- Hooks/stores: camelCase con sufijo `.store.ts`
- Schemas Zod exportados como `xxxSchema` con tipos inferidos `XxxInput`
- API: todo en `lib/api/index.ts` agrupado por dominio (`api.auth.*`, `api.solicitudes.*`, `api.admin.*`)
- Sin `any` excepto en los mocks de desarrollo claramente marcados
