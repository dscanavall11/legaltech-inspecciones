import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import type { FilaProceso } from '@/shared/procesos/types';
import { PALETA } from '@/theme/palette';
import { ESPACIO, TEXTO } from '@/theme/escala';
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
}

/**
 * Herramientas del asistente, montadas dentro de un Drawer lateral (ver
 * AsistentePage). Arriba va el directorio completo de herramientas —cada fila
 * abre o quita la herramienta y las no disponibles explican por qué— y abajo
 * las tarjetas de las que ya están abiertas. Antes era una columna persistente
 * con un menú desplegable de "más herramientas"; el directorio siempre visible
 * es más limpio y descubre mejor lo que aplica a cada caso.
 */
export function PilaHerramientas({ abiertas, caso, artefacto, onAbrir, onCerrar }: Props) {
  return (
    <div style={estilos.contenido}>
      <div style={estilos.directorio}>
        {HERRAMIENTAS.map((h) => {
          const motivo = motivoNoDisponible(h, caso?.tipo ?? null);
          const yaAbierta = abiertas.includes(h.clave);
          const Icono = h.icono;
          const bloqueada = motivo !== null;
          return (
            <button
              key={h.clave}
              type="button"
              disabled={bloqueada}
              onClick={() => (yaAbierta ? onCerrar(h.clave) : onAbrir(h.clave))}
              style={{
                ...estilos.opcion,
                ...(bloqueada ? estilos.opcionBloqueada : null),
                ...(yaAbierta ? estilos.opcionActiva : null),
              }}
            >
              <Icono size={15} strokeWidth={1.8} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={estilos.opcionNombre}>{h.nombre}</span>
                <span style={estilos.opcionMotivo}>
                  {motivo ?? (yaAbierta ? 'Abierta · toca para quitar' : h.descripcion)}
                </span>
              </span>
              {yaAbierta && !bloqueada && <Check size={14} color={PALETA.azul} />}
            </button>
          );
        })}
      </div>

      <div style={estilos.scroll}>
        {abiertas.length === 0 ? (
          <p style={estilos.tenue}>Ninguna herramienta abierta. Elige una del directorio de arriba.</p>
        ) : (
          abiertas.map((clave) => {
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
          })
        )}
      </div>
    </div>
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
  contenido: { display: 'flex', flexDirection: 'column', gap: ESPACIO.md },
  directorio: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingBottom: ESPACIO.md,
    borderBottom: `1px dashed ${PALETA.borde}`,
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
  opcionActiva: { background: PALETA.moradoBg },
  opcionBloqueada: { color: PALETA.textoTenue, cursor: 'not-allowed' },
  opcionNombre: { display: 'block', fontSize: TEXTO.base, fontWeight: 600 },
  opcionMotivo: { display: 'block', fontSize: TEXTO.nota, color: PALETA.textoSuave, lineHeight: 1.4 },
  scroll: { display: 'flex', flexDirection: 'column', gap: ESPACIO.sm },
  tarjeta: {
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tarjetaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 10px',
    background: 'rgba(0,0,0,0.02)',
  },
  tarjetaTitulo: { flex: 1, minWidth: 0, fontSize: TEXTO.base, fontWeight: 600, color: PALETA.texto },
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
  tenue: { color: PALETA.textoSuave, fontSize: TEXTO.menor, lineHeight: 1.55, margin: 0 },
};
