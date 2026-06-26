# LegalTech · Gestión de Inspecciones

Frontend de la plataforma de gestión de inspecciones de policía en Colombia, con
asistente de IA integrado (Spring AI). Producto de **legaltech.com.co**.

## Stack

| Capa | Tecnología |
| --- | --- |
| Build | Vite + TypeScript |
| UI | Ant Design 5 (locale `es-CO`) |
| Estado servidor | TanStack React Query |
| Estado cliente | Zustand |
| Ruteo | React Router 6 |
| Formularios | React Hook Form + Zod |
| Fechas | Day.js |
| Mock API | MSW (Mock Service Worker) |

## Cómo correr

```bash
npm install
npm run dev
```

Abre http://localhost:5173

> La app arranca con **datos mock (MSW)** activados. No necesitas el backend
> para desarrollar. Cuando el backend Spring esté listo, pon
> `VITE_ENABLE_MOCKS=false` en `.env.local`.

## Variables de entorno

Copia `.env.example` a `.env.local`:

- `VITE_API_BASE_URL` — URL base del backend (en dev se usa el proxy `/api`).
- `VITE_ENABLE_MOCKS` — `true` para usar datos falsos, `false` para el backend real.

## Arquitectura

Organización por **features verticales** (cada módulo legal es autónomo):

```
src/
  app/          Providers (Query, Ant Design, tema), router
  theme/        Sistema de diseño (tokens, accesibilidad)
  store/        Estado global (configuración / accesibilidad)
  shared/
    ai/         Asistente IA + hook de streaming con Spring AI
    terminos/   Motor de días hábiles + festivos colombianos (Ley Emiliani)
    auth/       Sesión, roles y permisos
    api/        Cliente HTTP
    components/ Layout, controles compartidos
  features/
    dashboard/  Inicio con métricas y alertas de términos
    querellas/  Listado de querellas (CRUD legal)
  mocks/        Handlers de MSW = contrato de la API
```

## Decisiones de diseño clave

- **Mock-first**: el frontend avanza sin depender del backend. Los handlers de
  MSW son el contrato que el backend debe cumplir.
- **Accesibilidad para inspectores de edad avanzada**: control de tamaño de
  fuente siempre visible (A / A+ / A++), controles grandes, íconos siempre con
  texto, foco visible.
- **Asistente IA transversal**: botón flotante presente en todas las pantallas,
  con respuesta en streaming.
- **Roles desde el día 1**: inspector, secretario, admin (ver `shared/auth`).

## ⚠️ Pendiente de validación jurídica

El motor de términos (`shared/terminos`) implementa días hábiles y festivos
colombianos, pero **debe ser revisado y cubierto con pruebas por el equipo
legal** antes de usarse para cálculos con efectos procesales reales. No
contempla aún suspensión de términos ni festivos locales.
