import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Typography } from 'antd';
import {
  FileTextOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  FileOutlined,
  SearchOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PALETA } from '@/theme/theme';
import { glassChrome, glassBackdrop } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const { Text } = Typography;

interface Comando {
  id: string;
  label: string;
  icon: React.ReactNode;
  ruta: string;
}

const COMANDOS: Comando[] = [
  { id: 'radicador', label: 'Radicar solicitud', icon: <FileOutlined />, ruta: '/panel/radicador' },
  { id: 'querella', label: 'Nueva querella', icon: <FileTextOutlined />, ruta: '/panel/radicador' },
  { id: 'queja', label: 'Nueva queja', icon: <MessageOutlined />, ruta: '/panel/radicador' },
  { id: 'actas', label: 'Actas de firmeza', icon: <SafetyCertificateOutlined />, ruta: '/panel/actas-firmeza' },
  { id: 'normas', label: 'Buscar norma', icon: <BookOutlined />, ruta: '/panel/normas' },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const reducirMovimiento = useReducedMotion();
  const reducirTransparencia = usePrefersReducedTransparency();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAbierto((a) => !a);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtrados = useMemo(() => {
    if (!busqueda) return COMANDOS;
    const q = busqueda.toLowerCase();
    return COMANDOS.filter((c) => c.label.toLowerCase().includes(q));
  }, [busqueda]);

  function cerrar() {
    setAbierto(false);
    setBusqueda('');
  }

  function seleccionar(c: Comando) {
    cerrar();
    navigate(c.ruta);
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Buscador de comandos"
          onClick={cerrar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reducirMovimiento ? { duration: 0 } : { duration: 0.16 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '16vh',
            ...glassBackdrop(reducirTransparencia),
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: reducirMovimiento ? 1 : 0.95, y: reducirMovimiento ? 0 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reducirMovimiento ? 1 : 0.95, y: reducirMovimiento ? 0 : -8 }}
            transition={
              reducirMovimiento ? { duration: 0 } : { type: 'spring', stiffness: 340, damping: 28 }
            }
            style={{
              width: 420,
              maxWidth: 'calc(100vw - 32px)',
              height: 'fit-content',
              borderRadius: 14,
              overflow: 'hidden',
              ...glassChrome(reducirTransparencia),
              border: `1px solid ${PALETA.borde}`,
              boxShadow: '0 12px 32px rgba(32,33,36,.18)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderBottom: `1px solid ${PALETA.borde}`,
              }}
            >
              <SearchOutlined style={{ color: PALETA.textoTenue, fontSize: 15 }} />
              <input
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filtrados.length > 0) seleccionar(filtrados[0]);
                  if (e.key === 'Escape') cerrar();
                }}
                placeholder="Escriba un comando…"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 14.5,
                  color: PALETA.texto,
                }}
              />
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto', scrollBehavior: 'smooth', padding: '6px 0' }}>
              {filtrados.map((c) => (
                <div
                  key={c.id}
                  onClick={() => seleccionar(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 16px',
                    cursor: 'pointer',
                    borderRadius: 8,
                    margin: '0 6px',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f1f3f4'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <span style={{ color: PALETA.textoSuave, fontSize: 14, width: 18, textAlign: 'center' }}>{c.icon}</span>
                  <Text style={{ flex: 1, fontSize: 13.5 }}>{c.label}</Text>
                </div>
              ))}
              {filtrados.length === 0 && (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: PALETA.textoTenue, fontSize: 12.5 }}>
                  Sin resultados
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
