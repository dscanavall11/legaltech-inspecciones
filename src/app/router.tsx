import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from '@/shared/components/AppLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';

// Code-splitting: cada vista se carga bajo demanda para aligerar el arranque.
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const QuerellasListPage = lazy(() =>
  import('@/features/querellas/QuerellasListPage').then((m) => ({ default: m.QuerellasListPage })),
);
const QuerellaDetailPage = lazy(() =>
  import('@/features/querellas/QuerellaDetailPage').then((m) => ({ default: m.QuerellaDetailPage })),
);
const NuevaQuerellaPage = lazy(() =>
  import('@/features/querellas/NuevaQuerellaPage').then((m) => ({ default: m.NuevaQuerellaPage })),
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
const QuejasListPage = lazy(() =>
  import('@/features/quejas/QuejasListPage').then((m) => ({ default: m.QuejasListPage })),
);
const NuevaQuejaPage = lazy(() =>
  import('@/features/quejas/NuevaQuejaPage').then((m) => ({ default: m.NuevaQuejaPage })),
);
const QuejaDetailPage = lazy(() =>
  import('@/features/quejas/QuejaDetailPage').then((m) => ({ default: m.QuejaDetailPage })),
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
const FallosPage = lazy(() =>
  import('@/features/fallos/FallosPage').then((m) => ({ default: m.FallosPage })),
);
const CasosPage = lazy(() =>
  import('@/features/casos/CasosPage').then((m) => ({ default: m.CasosPage })),
);
const IntakePage = lazy(() =>
  import('@/features/intake/IntakePage').then((m) => ({ default: m.IntakePage })),
);
const ActasFirmezaPage = lazy(() =>
  import('@/features/actas/ActasFirmezaPage').then((m) => ({ default: m.ActasFirmezaPage })),
);
const NormasPage = lazy(() =>
  import('@/features/normas/NormasPage').then((m) => ({ default: m.NormasPage })),
);

// MVP pages (lazy loaded)
const RadicadorPage = lazy(() =>
  import('@/features/radicador/RadicadorPage').then((m) => ({ default: m.RadicadorPage })),
);
const RadicarDocumentoPage = lazy(() =>
  import('@/features/radicador/RadicarDocumentoPage').then((m) => ({ default: m.RadicarDocumentoPage })),
);
const ColaPage = lazy(() =>
  import('@/features/cola/ColaPage').then((m) => ({ default: m.ColaPage })),
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
      { path: 'querellas', element: <Cargando><QuerellasListPage /></Cargando> },
      { path: 'querellas/nueva', element: <Cargando><NuevaQuerellaPage /></Cargando> },
      { path: 'querellas/:id', element: <Cargando><QuerellaDetailPage /></Cargando> },
      {
        path: 'querellas/:id/documento/:tipo',
        element: <Cargando><DocumentoPage /></Cargando>,
      },
      { path: 'quejas', element: <Cargando><QuejasListPage /></Cargando> },
      { path: 'quejas/nueva', element: <Cargando><NuevaQuejaPage /></Cargando> },
      { path: 'quejas/:id', element: <Cargando><QuejaDetailPage /></Cargando> },
      { path: 'audiencias', element: <Cargando><AudienciasPage /></Cargando> },
      { path: 'nuevo-caso', element: <Cargando><IntakePage /></Cargando> },
      { path: 'fallos', element: <Cargando><FallosPage /></Cargando> },
      { path: 'actas-firmeza', element: <Cargando><ActasFirmezaPage /></Cargando> },
      { path: 'medidas-correctivas', element: <Cargando><MultasPage /></Cargando> },
      // Módulos migrados del dashboard Angular (se mantienen montados para deep-links)
      { path: 'analisis', element: <Cargando><AnalisisPage /></Cargando> },
      { path: 'procesos', element: <Cargando><CasosPage /></Cargando> },
      { path: 'normas', element: <Cargando><NormasPage /></Cargando> },
      // MVP: Radicador y Cola de trabajo
      { path: 'radicador', element: <Cargando><RadicadorPage /></Cargando> },
      { path: 'radicar/:tipo', element: <Cargando><RadicarDocumentoPage /></Cargando> },
      { path: 'cola', element: <Cargando><ColaPage /></Cargando> },
    ],
  },
]);