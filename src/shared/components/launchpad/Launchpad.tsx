import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  SettingOutlined,
  LogoutOutlined,
  InboxOutlined,
  BookOutlined,
  CalculatorOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import {
  LAUNCHPAD_ITEMS,
  LAUNCHPAD_AREAS,
  type LaunchpadIconKey,
  type LaunchpadItem,
} from './launchpadItems';
import { LaunchpadTile } from './LaunchpadTile';
import { limpiarSesion } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';
import { glassBackdrop } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const ICONOS_LAUNCHPAD: Record<LaunchpadIconKey, ReactNode> = {
  'fallos-proferidos': <AuditOutlined />,
  'cola-trabajo': <InboxOutlined />,
  'consulta-normas': <BookOutlined />,
  'medidas-correctivas': <CalculatorOutlined />,
  'config-inspeccion': <SettingOutlined />,
  'cerrar-sesion': <LogoutOutlined />,
};

interface LaunchpadProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function Launchpad({ abierto, onCerrar }: LaunchpadProps) {
  const reducirMovimiento = useReducedMotion();
  const reducirTransparencia = usePrefersReducedTransparency();
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const elementoPrevioRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCerrar();
        return;
      }
      if (e.key === 'Tab') {
        const focoables = gridRef.current?.querySelectorAll<HTMLButtonElement>('button, [tabindex="0"]');
        if (!focoables || focoables.length === 0) return;
        const primero = focoables[0];
        const ultimo = focoables[focoables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  useEffect(() => {
    if (abierto) {
      elementoPrevioRef.current = document.activeElement as HTMLElement | null;
      const primerTile = gridRef.current?.querySelector<HTMLButtonElement>('button, [tabindex="0"]');
      primerTile?.focus();
    } else {
      elementoPrevioRef.current?.focus();
      elementoPrevioRef.current = null;
    }
  }, [abierto]);

  function ejecutar(item: LaunchpadItem) {
    if (item.accion.tipo === 'ruta') navigate(item.accion.ruta);
    if (item.accion.tipo === 'logout') {
      limpiarSesion();
      navigate('/login');
    }
    onCerrar();
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Launchpad"
          onClick={onCerrar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reducirMovimiento ? { duration: 0 } : { duration: 0.18 }}
          style={{
            position: 'fixed',
            inset: 0,
            ...glassBackdrop(reducirTransparencia),
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflowY: 'auto',
            padding: '40px 24px',
          }}
        >
          <motion.div
            ref={gridRef}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: reducirMovimiento ? 1 : 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reducirMovimiento ? 1 : 0.94 }}
            transition={
              reducirMovimiento
                ? { duration: 0 }
                : { type: 'spring', stiffness: 260, damping: 24 }
            }
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
              maxWidth: 760,
              width: '100%',
            }}
          >
            {LAUNCHPAD_AREAS.map((area) => {
              const items = LAUNCHPAD_ITEMS.filter((i) => i.area === area.id);
              if (items.length === 0) return null;
              return (
                <div key={area.id}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: PALETA.textoTenue,
                      marginBottom: 14,
                      paddingLeft: 4,
                    }}
                  >
                    {area.label}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, 132px)',
                      gap: 20,
                      justifyContent: 'center',
                    }}
                  >
                    {items.map((item) => (
                      <LaunchpadTile
                        key={item.key}
                        icon={ICONOS_LAUNCHPAD[item.iconKey]}
                        label={item.label}
                        onClick={() => ejecutar(item)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}