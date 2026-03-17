# RDAM - Registro de Deudores Alimentarios Morosos

Sistema web para la gestión digital de certificados del Registro de Deudores Alimentarios Morosos (RDAM) del Poder Judicial de la Provincia de Santa Fe.

## 🚀 Inicio Rápido (Docker)

El proyecto está completamente dockerizado. Para levantar todo el ecosistema (Frontend, Backend, Base de Datos, Redis, S3 Mock y Pasarela Mock), solo necesitas ejecutar:

```bash
docker-compose up -d --build
```

Esto inicializará automáticamente:
1. La base de datos PostgreSQL con el esquema actualizado.
2. El servicio de almacenamiento S3 (MinIO) y la creación automática del bucket de certificados.
3. El servidor Backend (NestJS).
4. El portal Frontend (Next.js).
5. Un simulador de Pasarela de Pagos.

---

## 🔗 Acceso a Servicios

| Servicio | URL | Descripción |
| :--- | :--- | :--- |
| **Portal Ciudadano** | [http://localhost:3001](http://localhost:3001) | Inicio de trámites y consulta de estado. |
| **Backoffice Admin** | [http://localhost:3001/admin](http://localhost:3001/admin) | Gestión para Operarios y Supervisores. |
| **Documentación API** | [http://localhost:3000/docs](http://localhost:3000/docs) | Swagger interactivo para pruebas de endpoints. |
| **Mock Pasarela** | [http://localhost:3002](http://localhost:3002) | Simulador de interfaz de pago. |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | Gestión visual de archivos (u: `minioadmin` / p: `minioadmin`). |

---

## 🔐 Credenciales de Prueba (Backoffice)

Para ingresar al panel de administración:

| Rol | Usuario | Contraseña |
| :--- | :--- | :--- |
| **Supervisor** | `supervisor` | `password123` |
| **Operario** | `operario1` | `password123` |
| **Operario** | `operario2` | `password123` |

---

## 🛠️ Flujo de Prueba Recomendado

1. **Ciudadano**: Inicia una solicitud en el Portal. Ingresa DNI y Email.
2. **OTP**: Revisa los logs del contenedor backend (`docker logs rdam_backend`) para obtener el código de verificación enviado por "email".
3. **Formulario**: Completa los datos requeridos.
4. **Pago**: Click en "Pagar". Serás redirigido a la Pasarela Mock. Completa datos ficticios y confirma.
5. **Admin**: Ingresa con el usuario `operario1`. Verás la solicitud en estado **PAGADA**.
6. **Emisión**: Carga un archivo PDF de prueba y click en "Emitir". El estado pasará a **EMITIDA**.
7. **Descarga**: Vuelve al portal ciudadano, consulta por DNI, y descarga el certificado oficial.

---

## 📂 Estructura del Repositorio

- `/backend` - API principal en NestJS.
- `/front/rdam-frontend` - Aplicación web unificada (Ciudadano + Admin).
- `/pasarela-campus-2026` - Mock de la pasarela de pagos PlusPagos.
- `docker-compose.yml` - Orquestación de toda la infraestructura.

---

## 📝 Notas de Desarrollo
- El sistema utiliza **Blind Indexing** para proteger datos sensibles (DNI/CUIL).
- Las transiciones de estado están protegidas por un motor de reglas en `StateTransitionService`.
- Todas las acciones administrativas quedan registradas en el sistema de auditoría.
