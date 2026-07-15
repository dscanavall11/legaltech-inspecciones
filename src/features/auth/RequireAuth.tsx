import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/auth/auth';

/**
 * Guard de rutas: sin sesión con accessToken no se entra a la app.
 * Equivalente al AuthGuard del frontend Angular anterior.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const sesion = useAuth((s) => s.sesion);
  const location = useLocation();

  if (!sesion?.accessToken) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  return <>{children}</>;
}
