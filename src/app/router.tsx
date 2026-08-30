import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from '@/shared/components/AppLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';

// Code-splitting: cada vista se carga bajo demanda para aligerar el arranque.
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const BandejaProcesos = lazy(() =>
  import('@/shared/procesos/BandejaProcesos').then((m) => ({ default: m.BandejaProcesos })),
);
const QuerellaDetailPage = lazy(() =>
  import('@/features/querellas/QuerellaDetailPage').then((m) => ({ default: m.QuerellaDetailPage })),
);
const DocumentoPage = lazy(() =>
  import('@/features/querellas/documento/DocumentoPage').then((m) => ({ default: m.DocumentoPage })),
);
const AudienciasPage = lazy(() =>
  import('@/features/audiencias/AudienciasPage').then((m) => ({ default: m.AudienciasPage })),
);
const MultasPage = lazy(() =>
  import('@/features/multas/MultasPage').then((m) => ({ default: m.MultasPage })),
);
const AreaTrabajoQuerella = lazy(() =>
  import('@/features/querellas/AreaTrabajoQuerella').then((m) => ({
    default: m.AreaTrabajoQuerella,
  })),
);
const AreaTrabajoApelacionPage = lazy(() =>
  import('@/features/apelaciones/AreaTrabajoApelacionPage').then((m) => ({
    default: m.AreaTrabajoApelacionPage,
  })),
);
const ApelacionDetailPage = lazy(() =>
  import('@/features/apelaciones/ApelacionDetailPage').then((m) => ({
    default: m.ApelacionDetailPage,
  })),
);
const AreaTrabajoQueja = lazy(() =>
  import('@/features/quejas/AreaTrabajoQueja').then((m) => ({ default: m.AreaTrabajoQueja })),
);
const QuejaDetailPage = lazy(() =>
  import('@/features/quejas/QuejaDetailPage').then((m) => ({ default: m.QuejaDetailPage })),
);
const ComparendosPage = lazy(() =>
  import('@/features/comparendos/ComparendosPage').then((m) => ({ default: m.ComparendosPage })),
);
const ComparendoDetailPage = lazy(() =>
  import('@/features/comparendos/ComparendoDetailPage').then((m) => ({ default: m.ComparendoDetailPage })),
);
const DocumentoComparendoPage = lazy(() =>
  import('@/features/comparendos/documento/DocumentoComparendoPage').then((m) => ({ default: m.DocumentoComparendoPage })),
);
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const LandingPage = lazy(() =>
  import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const AnalisisPage = lazy(() =>
  import('@/features/analisis/AnalisisPage').then((m) => ({ default: m.AnalisisPage })),
);
const AjustesPage = lazy(() =>
  import('@/features/ajustes/AjustesPage').then((m) => ({ default: m.AjustesPage })),
);
const ConfiguracionDespachoPage = lazy(() =>
  import('@/features/ajustes/ConfiguracionDespachoPage').then((m) => ({ default: m.ConfiguracionDespachoPage })),
);
const IntakePage = lazy(() =>
  import('@/features/intake/IntakePage').then((m) => ({ default: m.IntakePage })),
);
const ActasFirmezaPage = lazy(() =>
  import('@/features/actas/ActasFirmezaPage').then((m) => ({ default: m.ActasFirmezaPage })),
);
const ProntoPagoPage = lazy(() =>
  import('@/features/pagos/ProntoPagoPage').then((m) => ({ default: m.ProntoPagoPage })),
);
const ConmutacionPage = lazy(() =>
  import('@/features/pagos/ConmutacionPage').then((m) => ({ default: m.ConmutacionPage })),
);
const NormasPage = lazy(() =>
  import('@/features/normas/NormasPage').then((m) => ({ default: m.NormasPage })),
);
const AsistentePage = lazy(() =>
  import('@/features/asistente/AsistentePage').then((m) => ({ default: m.AsistentePage })),
);

// MVP pages (lazy loaded)
const RadicadorPage = lazy(() =>
  import('@/features/radicador/RadicadorPage').then((m) => ({ default: m.RadicadorPage })),
);
const RadicarDocumentoPage = lazy(() =>
  import('@/features/radicador/RadicarDocumentoPage').then((m) => ({ default: m.RadicarDocumentoPage })),
);

function Cargando({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Página informativa pública de legaltech.com.co (migrada del Angular).
  { path: '/', element: <Cargando><LandingPage /></Cargando> },
  { path: '/login', element: <Cargando><LoginPage /></Cargando> },
  { path: '/registro', element: <Cargando><RegisterPage /></Cargando> },
  {
    path: '/panel',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Cargando><DashboardPage /></Cargando> },
      {
        path: 'procesos',
        element: (
          <Cargando>
            <BandejaProcesos
              titulo="Mis procesos"
              descripcion="Todos los expedientes del despacho — querellas, quejas, comparendos, actas y apelaciones."
            />
          </Cargando>
        ),
      },
      {
        path: 'querellas',
        element: (
          <Cargando>
            <AreaTrabajoQuerella />
          </Cargando>
        ),
      },
      { path: 'querellas/:id', element: <Cargando><QuerellaDetailPage /></Cargando> },
      {
        path: 'querellas/:id/documento/:tipo',
        element: <Cargando><DocumentoPage /></Cargando>,
      },
      // La queja es el expediente del comparendo impugnado y se trabaja con el
      // mismo recorrido que la querella (shared/expediente).
      {
        path: 'quejas',
        element: (
          <Cargando>
            <AreaTrabajoQueja />
          </Cargando>
        ),
      },
      { path: 'quejas/:id', element: <Cargando><QuejaDetailPage /></Cargando> },
      // Mismo recorrido que querella y queja (shared/expediente); el listado
      // del despacho vive en Mis procesos, no aquí.
      {
        path: 'apelaciones',
        element: (
          <Cargando>
            <AreaTrabajoApelacionPage />
          </Cargando>
        ),
      },
      { path: 'apelaciones/:id', element: <Cargando><ApelacionDetailPage /></Cargando> },
      { path: 'comparendos', element: <Cargando><ComparendosPage /></Cargando> },
      { path: 'comparendos/:id', element: <Cargando><ComparendoDetailPage /></Cargando> },
      {
        path: 'comparendos/:id/documento/:tipo',
        element: <Cargando><DocumentoComparendoPage /></Cargando>,
      },
      { path: 'nuevo-caso', element: <Cargando><IntakePage /></Cargando> },
      { path: 'actas-firmeza', element: <Cargando><ActasFirmezaPage /></Cargando> },
      { path: 'pronto-pago', element: <Cargando><ProntoPagoPage /></Cargando> },
      { path: 'conmutacion', element: <Cargando><ConmutacionPage /></Cargando> },
      { path: 'ajustes', element: <Cargando><AjustesPage /></Cargando> },
      { path: 'ajustes/despacho', element: <Cargando><ConfiguracionDespachoPage /></Cargando> },
      // Diferidos a la V2: siguen montados (los enlaces guardados no se
      // rompen y el código no se pierde) pero ya no aparecen en el menú, que
      // se redujo a las siete entradas de dockItems.ts.
      { path: 'audiencias', element: <Cargando><AudienciasPage /></Cargando> },
      { path: 'medidas-correctivas', element: <Cargando><MultasPage /></Cargando> },
      { path: 'normas', element: <Cargando><NormasPage /></Cargando> },
      { path: 'analisis', element: <Cargando><AnalisisPage /></Cargando> },
      { path: 'radicador', element: <Cargando><RadicadorPage /></Cargando> },
      { path: 'radicar/:tipo', element: <Cargando><RadicarDocumentoPage /></Cargando> },
      { path: 'asistente', element: <Cargando><AsistentePage /></Cargando> },
      // La cola de trabajo y los fallos proferidos son la misma bandeja con
      // otro filtro; se redirigen para no romper enlaces guardados.
      { path: 'cola', element: <Navigate to="/panel/procesos" replace /> },
      { path: 'fallos', element: <Navigate to="/panel/procesos?fallo=1" replace /> },
    ],
  },
]);