import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from '@/shared/components/AppLayout';
import { EnConstruccion } from '@/shared/components/EnConstruccion';

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
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Cargando><DashboardPage /></Cargando> },
      { path: 'querellas', element: <Cargando><QuerellasListPage /></Cargando> },
      { path: 'querellas/nueva', element: <Cargando><NuevaQuerellaPage /></Cargando> },
      { path: 'querellas/:id', element: <Cargando><QuerellaDetailPage /></Cargando> },
      {
        path: 'querellas/:id/documento/:tipo',
        element: <Cargando><DocumentoPage /></Cargando>,
      },
      { path: 'quejas', element: <EnConstruccion modulo="Quejas" /> },
      { path: 'audiencias', element: <Cargando><AudienciasPage /></Cargando> },
      { path: 'fallos', element: <EnConstruccion modulo="Fallos" /> },
      {
        path: 'actas-firmeza',
        element: <EnConstruccion modulo="Actas de firmeza" />,
      },
      { path: 'medidas-correctivas', element: <Cargando><MultasPage /></Cargando> },
    ],
  },
]);
