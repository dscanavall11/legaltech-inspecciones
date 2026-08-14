import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import type { FilaProceso } from '@/shared/procesos/types';
import { PALETA } from '@/theme/palette';
import { ELEVACION } from '@/theme/theme';
import { HERRAMIENTAS, motivoNoDisponible, type ClaveHerramienta, type Herramienta } from './herramientas';
import { PanelDocumento, PanelMultas, PanelNorma } from './paneles';
import { PanelContador, PanelEtapa, PanelGrafo } from './panelesCaso';
import type { Artefacto } from './skills';

interface Props {
  abiertas: ClaveHerramienta[];
  caso: FilaProceso | null;
  artefacto: { titulo: string; artefacto: Artefacto } | null;
  onAbrir: (clave: ClaveHerramienta) => void;
  onCerrar: (clave: ClaveHerramienta) => void;
  ancho: number;
  colapsada: boolean;
  onColapsar: (colapsada: boolean) => void;
}

/**
 * Columna derecha: la pila de herramientas abiertas. Cada tarjeta monta el
 * componente que ya existe en el repo (ver el mapa de abajo); acá solo se
 * decide qué se ofrece según el caso activo y cómo se apila.
 */
export function PilaHerramientas({
  abiertas,
  caso,
  artefacto,
  onAbrir,
  onCerrar,
  ancho,
  colapsada,
  onColapsar,
}: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  if (colapsada) {
    return (
      <aside style={{ ...estilos.columna, width: 44, borderLeft: `1px solid ${PALETA.borde}` }}>
        <button
          type="button"
          style={{ ...estilos.iconBtn, padding: '14px 0' }}
          onClick={() => onColapsar(false)}
          aria-label="Expandir las herramientas"
        >
          <ChevronLeft size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside style={{ ...estilos.columna, width: ancho }}>
      <header style={estilos.header}>
        <span style={estilos.tituloColumna}>Herramientas</span>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={{ ...estilos.iconBtn, marginRight: 2 }}
            onClick={() => onColapsar(true)}
            aria-label="Contraer las herramientas"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            style={estilos.agregarBtn}
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
          >
            <Plus size={14} /> Herramientas
          </button>
          {menuAbierto && (
            <div style={estilos.menu} role="menu">
              {HERRAMIENTAS.map((h) => (
                <OpcionMenu
                  key={h.clave}
                  herramienta={h}
                  motivo={motivoNoDisponible(h, caso?.tipo ?? null)}
                  yaAbierta={abiertas.includes(h.clave)}
                  onElegir={() => {
                    onAbrir(h.clave);
                    setMenuAbierto(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      <div style={estilos.scroll}>
        {abiertas.length === 0 && (
          <p style={estilos.tenue}>
            Ninguna herramienta abierta. Monta las que necesite el caso: puedes tener varias a la vez.
          </p>
        )}
        {abiertas.map((clave) => {
          const herramienta = HERRAMIENTAS.find((h) => h.clave === clave);
          if (!herramienta) return null;
          return (
            <Tarjeta
              key={clave}
              herramienta={herramienta}
              motivo={motivoNoDisponible(herramienta, caso?.tipo ?? null)}
              caso={caso}
              artefacto={artefacto}
              onCerrar={() => onCerrar(clave)}
            />
          );
        })}
      </div>
    </aside>
  );
}

function OpcionMenu({
  herramienta,
  motivo,
  yaAbierta,
  onElegir,
}: {
  herramienta: Herramienta;
  motivo: string | null;
  yaAbierta: boolean;
  onElegir: () => void;
}) {
  const Icono = herramienta.icono;
  const bloqueada = motivo !== null || yaAbierta;
  return (
    <button
      type="button"
      role="menuitem"
      disabled={bloqueada}
      onClick={onElegir}
      style={{ ...estilos.opcion, ...(bloqueada ? estilos.opcionBloqueada : null) }}
    >
      <Icono size={15} strokeWidth={1.8} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={estilos.opcionNombre}>{herramienta.nombre}</span>
        <span style={estilos.opcionMotivo}>{motivo ?? (yaAbierta ? 'Ya está abierta' : herramienta.descripcion)}</span>
      </span>
    </button>
  );
}

function Tarjeta({
  herramienta,
  motivo,
  caso,
  artefacto,
  onCerrar,
}: {
  herramienta: Herramienta;
  motivo: string | null;
  caso: FilaProceso | null;
  artefacto: Props['artefacto'];
  onCerrar: () => void;
}) {
  const [abierta, setAbierta] = useState(true);
  const Icono = herramienta.icono;

  return (
    <section style={estilos.tarjeta}>
      <header style={estilos.tarjetaHeader}>
        <button
          type="button"
          style={estilos.plegarBtn}
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          aria-label={abierta ? `Plegar ${herramienta.nombre}` : `Desplegar ${herramienta.nombre}`}
        >
          {abierta ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <Icono size={15} strokeWidth={1.8} />
        <span style={estilos.tarjetaTitulo}>{herramienta.nombre}</span>
        <button type="button" style={estilos.iconBtn} onClick={onCerrar} aria-label={`Cerrar ${herramienta.nombre}`}>
          <X size={14} />
        </button>
      </header>
      {abierta && (
        <div style={estilos.tarjetaCuerpo}>
          {motivo ? <p style={estilos.tenue}>{motivo}.</p> : contenido(herramienta.clave, caso, artefacto)}
        </div>
      )}
    </section>
  );
}

/** Mapa herramienta → lo que monta. Todo lo de acá ya existía en el repo. */
function contenido(clave: ClaveHerramienta, caso: FilaProceso | null, artefacto: Props['artefacto']) {
  switch (clave) {
    case 'documento':
      return <PanelDocumento artefacto={artefacto?.artefacto ?? null} titulo={artefacto?.titulo} />;
    case 'pruebas':
      return caso ? <PruebasExpediente caseId={caso.id} /> : null;
    case 'documentos':
      return caso ? <DocumentosExpediente caseId={caso.id} /> : null;
    case 'multas':
      return <PanelMultas />;
    case 'etapa':
      return caso ? <PanelEtapa caso={caso} /> : null;
    case 'contador':
      return caso ? <PanelContador caso={caso} /> : null;
    case 'grafo':
      return caso ? <PanelGrafo caso={caso} /> : null;
    case 'norma':
      return <PanelNorma />;
  }
}

const estilos: Record<string, React.CSSProperties> = {
  columna: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: PALETA.superficie,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '13px 16px',
    borderBottom: `1px solid ${PALETA.borde}`,
  },
  tituloColumna: { fontSize: 13, fontWeight: 600, color: PALETA.texto },
  agregarBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 11px',
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 999,
    background: 'transparent',
    color: PALETA.texto,
    fontSize: 12.5,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 6px)',
    zIndex: 20,
    width: 320,
    padding: 6,
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 12,
    background: PALETA.superficie,
    boxShadow: ELEVACION.media,
  },
  opcion: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    borderRadius: 8,
    padding: '8px 10px',
    fontFamily: 'inherit',
    color: PALETA.texto,
    cursor: 'pointer',
  },
  opcionBloqueada: { color: PALETA.textoTenue, cursor: 'not-allowed' },
  opcionNombre: { display: 'block', fontSize: 13, fontWeight: 600 },
  opcionMotivo: { display: 'block', fontSize: 11.5, color: PALETA.textoSuave, lineHeight: 1.4 },
  scroll: { flex: 1, overflowY: 'auto', padding: '12px 14px 24px' },
  tarjeta: {
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tarjetaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 10px',
    background: 'rgba(0,0,0,0.02)',
  },
  tarjetaTitulo: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: PALETA.texto },
  tarjetaCuerpo: { padding: '10px 12px 14px' },
  plegarBtn: {
    border: 'none',
    background: 'transparent',
    color: PALETA.textoSuave,
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  iconBtn: {
    border: 'none',
    background: 'transparent',
    color: PALETA.textoSuave,
    cursor: 'pointer',
    padding: 4,
    display: 'inline-flex',
  },
  tenue: { color: PALETA.textoSuave, fontSize: 12.5, lineHeight: 1.55, margin: 0 },
};
