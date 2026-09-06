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
| Fechas | Day.js |

## Cómo correr

Sin mocks: el frontend consume el backend real vía **orchestrator** (el BFF
único de la plataforma, `http://localhost:8090`), que reenvía hacia
legalcase/legal/legalbases/authentication. Necesitás el stack Docker de
`local-dev/` (repo hermano) levantado antes de `npm run dev`.

```bash
# en local-dev/ (repo hermano)
docker compose -f docker-compose.local.yml up

# acá
npm install
npm run dev
```

Abre http://localhost:5173

## Variables de entorno

Copia `.env.example` a `.env.local`:

- `VITE_API_BASE_URL` — URL base única para todo `/api` (CRUD, IA, workspace-context).
  En dev local: `http://localhost:8090/api` (orchestrator).

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
    querellas/  Detalle de querella
  shared/procesos/  Bandeja única de expedientes (ver "Bandeja única" abajo)
```

## Decisiones de diseño clave

- **Sin mocks**: el frontend consume el backend real vía orchestrator
  (`localhost:8090` en dev). No hay datos falsos ni contrato mockeado — lo que
  se ve en pantalla es lo que devuelve `legal-cases`.
- **Bandeja única**: `shared/procesos/BandejaProcesos.tsx` reemplaza los
  listados que había por trámite (querellas, quejas, cola, fallos, casos):
  todos consultaban la misma tabla `legal_cases`, agnóstica a `caseType`.
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
