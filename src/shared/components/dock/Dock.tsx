import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { Tooltip } from 'antd';
import {
  FileTextOutlined,
  MessageOutlined,
  CalendarOutlined,
  PlusSquareOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  LockOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { DOCK_SECTIONS, type DockIconKey } from './dockItems';
import { DockIcon } from './DockIcon';
import { calcularEfectoDock } from './dockMagnification';
import { PALETA } from '@/theme/palette';
import { glassBackground, glassShadowLiquid } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

// El item "Inicio" lleva la marca LegalTech en vez de un icono de casa —
// mismo glifo "L" que el badge del logo en TopBar.tsx, coloreado por la
// misma logica activo/inactivo que el resto de los items del dock.
const LOGO_LEGALTECH = <span style={{ fontWeight: 800 }}>L</span>;

const ICONOS_DOCK: Record<DockIconKey, ReactNode> = {
  inicio: LOGO_LEGALTECH,
  querellas: <FileTextOutlined />,
  quejas: <MessageOutlined />,
  audiencias: <CalendarOutlined />,
  'consulta-norma': <BookOutlined />,
  radicar: <PlusSquareOutlined />,
  cola: <InboxOutlined />,
  'actas-firmeza': <SafetyCertificateOutlined />,
  calendario: <CalendarOutlined />,
  'chat-ia': <LockOutlined />,
};

interface DockProps {
  onAbrirLaunchpad: () => void;
}

/**
 * Dock flotante compacto (72-96px de ancho, no un sidebar). La magnetizacion
 * por proximidad al cursor se anima con gsap.quickTo directamente sobre el
 * DOM (misma tecnica que demos.gsap.com/demo/macos-dock-effect, la demo que
 * origino este rediseno), no con motion/react — evita el overhead de un
 * MotionValue por icono y anima fuera del ciclo de render de React.
 */
export function Dock({ onAbrirLaunchpad }: DockProps) {
  const reducirMovimiento = useReducedMotion();
  const reducirTransparencia = usePrefersReducedTransparency();
  const location = useLocation();
  const navigate = useNavigate();
  const glassBg = glassBackground(reducirTransparencia);

  interface ControladorIcono {
    setEscala: (v: number) => void;
    setDesplazamiento: (v: number) => void;
    estado: { escala: number; y: number };
  }

  const elementosRef = useRef(new Map<string, HTMLDivElement>());
  const controladoresRef = useRef(new Map<string, ControladorIcono>());
  const refCallbacksRef = useRef(new Map<string, (el: HTMLDivElement | null) => void>());

  // Un callback de ref estable por item (memoizado a mano, no useCallback en
  // un loop) — evita que React desmonte/remonte el ref en cada render, que
  // recrearia los tweens de gsap.quickTo innecesariamente.
  //
  // No se anima la propiedad CSS independiente `scale`/`translate` con
  // gsap.quickTo(el, 'scale', ...): en algunos navegadores/entornos esa
  // propiedad se aplica al computed style (y hasta afecta getBoundingClientRect)
  // pero NO SE PINTA — verificado a mano en devtools, `transform: scale(...)`
  // si pinta correctamente. Para no depender de ese comportamiento, se anima
  // un objeto de estado plano y se escribe `el.style.transform` a mano en
  // cada tick, combinando escala + desplazamiento en una sola matriz.
  function obtenerControlador(key: string, el: HTMLDivElement): ControladorIcono {
    const existente = controladoresRef.current.get(key);
    if (existente) return existente;
    const estado = { escala: 1, y: 0 };
    function aplicar() {
      el.style.transform = `translateY(${estado.y}px) scale(${estado.escala})`;
    }
    const controlador: ControladorIcono = {
      estado,
      setEscala: gsap.quickTo(estado, 'escala', { duration: 0.25, ease: 'power3.out', onUpdate: aplicar }),
      setDesplazamiento: gsap.quickTo(estado, 'y', { duration: 0.25, ease: 'power3.out', onUpdate: aplicar }),
    };
    controladoresRef.current.set(key, controlador);
    return controlador;
  }

  function obtenerRegistrador(key: string) {
    let fn = refCallbacksRef.current.get(key);
    if (!fn) {
      fn = (el) => {
        if (el) {
          elementosRef.current.set(key, el);
          obtenerControlador(key, el);
        } else {
          elementosRef.current.delete(key);
          controladoresRef.current.delete(key);
        }
      };
      refCallbacksRef.current.set(key, fn);
    }
    return fn;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reducirMovimiento) return;
    elementosRef.current.forEach((el, key) => {
      const rect = el.getBoundingClientRect();
      const distancia = rect.top + rect.height / 2 - e.clientY;
      const { escala, desplazamiento } = calcularEfectoDock(distancia);
      // El item agrandado se sobrepone a sus vecinos y al glass del dock —
      // sin este bump, quedaria detras de los items de abajo (orden DOM).
      el.style.zIndex = escala > 1.03 ? '5' : '1';
      const controlador = controladoresRef.current.get(key);
      controlador?.setEscala(escala);
      controlador?.setDesplazamiento(desplazamiento);
    });
  }

  function onPointerLeave() {
    controladoresRef.current.forEach((controlador, key) => {
      controlador.setEscala(1);
      controlador.setDesplazamiento(0);
      const el = elementosRef.current.get(key);
      if (el) el.style.zIndex = '1';
    });
  }

  useEffect(() => {
    const controladores = controladoresRef.current;
    return () => {
      controladores.forEach((c) => gsap.killTweensOf(c.estado));
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        userSelect: 'none',
      }}
    >
      <div
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '14px 10px',
          borderRadius: 24,
          ...glassBg,
          border: '1px solid rgba(255,255,255,0.65)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), ${glassShadowLiquid(PALETA.azul, 'medium')}`,
          // Sin overflow clip: un icono agrandado por la magnetizacion debe
          // poder sobresalir del pill y superponerse al glass, no quedar
          // recortado en el borde. Con ~10 items entra en la mayoria de
          // pantallas sin necesitar scroll — si algun dia no entra, hay que
          // resolverlo reduciendo items, no clippeando la magnificacion.
        }}
      >
        {DOCK_SECTIONS.map((section, i) => (
          <div
            key={section.titulo}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}
          >
            {i > 0 && <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '6px 0' }} />}
            {section.items.map((item) => {
              const activo =
                item.ruta === '/panel'
                  ? location.pathname === '/panel'
                  : location.pathname.startsWith(item.ruta);
              return (
                <DockIcon
                  key={item.key}
                  ref={obtenerRegistrador(item.key)}
                  icon={ICONOS_DOCK[item.iconKey]}
                  label={item.label}
                  color={item.color}
                  destacado={item.destacado}
                  enConstruccion={item.enConstruccion}
                  activo={activo}
                  onClick={() => {
                    if (item.enConstruccion) return;
                    navigate(item.ruta);
                  }}
                />
              );
            })}
          </div>
        ))}

        <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '6px 0' }} />

        <Tooltip title="Más" placement="right">
          <button
            onClick={onAbrirLaunchpad}
            aria-label="Abrir Launchpad"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              background: 'transparent',
              color: 'var(--text-disabled)',
              flexShrink: 0,
            }}
          >
            <AppstoreOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
