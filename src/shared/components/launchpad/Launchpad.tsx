import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { InboxOutlined, DollarOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import { LAUNCHPAD_ITEMS, type LaunchpadIconKey, type LaunchpadItem } from './launchpadItems';
import { LaunchpadTile } from './LaunchpadTile';
import { useOverlayStore } from '@/store/overlayStore';
import { PALETA } from '@/theme/theme';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const ICONOS_LAUNCHPAD: Record<LaunchpadIconKey, ReactNode> = {
  cola: <InboxOutlined />,
  'medidas-correctivas': <DollarOutlined />,
  'asistente-ia': <RobotOutlined />,
  'config-inspeccion': <SettingOutlined />,
};

interface LaunchpadProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function Launchpad({ abierto, onCerrar }: LaunchpadProps) {
  const reducirMovimiento = useReducedMotion();
  const reducirTransparencia = usePrefersReducedTransparency();
  const navigate = useNavigate();
  const abrirAiAssistant = useOverlayStore((s) => s.abrirAiAssistant);
  const abrirConfigAssistant = useOverlayStore((s) => s.abrirConfigAssistant);
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
        const focoables = gridRef.current?.querySelectorAll<HTMLButtonElement>('button');
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
      const primerTile = gridRef.current?.querySelector<HTMLButtonElement>('button');
      primerTile?.focus();
    } else {
      elementoPrevioRef.current?.focus();
      elementoPrevioRef.current = null;
    }
  }, [abierto]);

  function ejecutar(item: LaunchpadItem) {
    if (item.accion.tipo === 'ruta') navigate(item.accion.ruta);
    if (item.accion.tipo === 'ai-assistant') abrirAiAssistant();
    if (item.accion.tipo === 'config-assistant') abrirConfigAssistant();
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
            background: reducirTransparencia ? PALETA.superficie : 'rgba(250, 250, 250, 0.78)',
            backdropFilter: reducirTransparencia ? 'none' : 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: reducirTransparencia ? 'none' : 'blur(24px) saturate(180%)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, 132px)',
              gap: 24,
              padding: 32,
              justifyContent: 'center',
            }}
          >
            {LAUNCHPAD_ITEMS.map((item) => (
              <LaunchpadTile
                key={item.key}
                icon={ICONOS_LAUNCHPAD[item.iconKey]}
                label={item.label}
                onClick={() => ejecutar(item)}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
