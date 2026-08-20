import { useMemo, useState } from 'react';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { agrupar, GRUPOS_CONVERSACION } from '@/shared/ai/agruparConversaciones';
import type { Conversacion } from '@/shared/ai/useConversaciones';
import { useProcesos } from '@/shared/procesos/api';
import {
  colorEstado,
  definicionDe,
  etiquetaEstado,
  TIPOS_PROCESO,
  TIPOS_PROCESO_LISTA,
  type FilaProceso,
} from '@/shared/procesos/types';
import { PALETA } from '@/theme/palette';
import { TEXTO } from '@/theme/escala';
import { useNavigate } from 'react-router-dom';
import { ATAJOS_DESPACHO } from '@/shared/ai/atajosDelDespacho';

const TODOS = 'todos';

interface Props {
  conversaciones: Conversacion[];
  activaId: string | null;
  onNueva: () => void;
  onSeleccionar: (id: string) => void;
  casoActivo: FilaProceso | null;
  onElegirCaso: (caso: FilaProceso) => void;
  ancho: number;
  colapsada: boolean;
  onColapsar: (colapsada: boolean) => void;
}

/**
 * Columna izquierda del asistente: los dos registros de la sesión. Las
 * conversaciones (historial local) y los casos (los mismos expedientes de la
 * bandeja, vía useProcesos, con las etiquetas de TIPOS_PROCESO).
 */
export function ColumnaLateral({
  conversaciones,
  activaId,
  onNueva,
  onSeleccionar,
  casoActivo,
  onElegirCaso,
  ancho,
  colapsada,
  onColapsar,
}: Props) {
  const [vista, setVista] = useState<'conversaciones' | 'casos'>('conversaciones');
  const abierta = !colapsada;

  return (
    // Con la barra abierta el borde lo pinta el separador arrastrable.
    <aside
      style={{
        ...estilos.barra,
        width: abierta ? ancho : 52,
        borderRight: abierta ? 'none' : `1px solid ${PALETA.borde}`,
      }}
    >
      <div style={estilos.header}>
        {abierta && (
          <button type="button" style={estilos.nuevaBtn} onClick={onNueva}>
            <Plus size={14} strokeWidth={2} /> Nueva conversación
          </button>
        )}
        <button
          type="button"
          style={estilos.colapsarBtn}
          onClick={() => onColapsar(abierta)}
          aria-label={abierta ? 'Contraer la barra lateral' : 'Expandir la barra lateral'}
        >
          {abierta ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {abierta && (
        <>
          <div style={estilos.conmutador} role="tablist" aria-label="Registros">
            {(['conversaciones', 'casos'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={vista === v}
                onClick={() => setVista(v)}
                style={{ ...estilos.pestania, ...(vista === v ? estilos.pestaniaActiva : null) }}
              >
                {v === 'conversaciones' ? 'Conversaciones' : 'Casos'}
              </button>
            ))}
          </div>

          {vista === 'conversaciones' ? (
            <ListaConversaciones
              conversaciones={conversaciones}
              activaId={activaId}
              onSeleccionar={onSeleccionar}
            />
          ) : (
            <ListaCasos casoActivo={casoActivo} onElegirCaso={onElegirCaso} />
          )}

          {/* Los atajos del despacho: lo único que el chat sencillo tenía y
              este no. Con ellos el asistente con skills pasa a ser un
              superconjunto y elegir cuál se queda deja de costar nada. */}
          <AtajosDelDespacho />
        </>
      )}
    </aside>
  );
}

function ListaConversaciones({
  conversaciones,
  activaId,
  onSeleccionar,
}: Pick<Props, 'conversaciones' | 'activaId' | 'onSeleccionar'>) {
  const grupos = agrupar(conversaciones);
  return (
    <div style={estilos.scroll}>
      {conversaciones.length === 0 && <p style={estilos.textoTenue}>Tus conversaciones aparecerán acá.</p>}
      {GRUPOS_CONVERSACION.map(
        (grupo) =>
          grupos[grupo].length > 0 && (
            <div key={grupo} style={{ marginBottom: 14 }}>
              <div style={estilos.grupoLabel}>{grupo}</div>
              {grupos[grupo].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSeleccionar(c.id)}
                  style={{ ...estilos.item, ...(c.id === activaId ? estilos.itemActivo : null) }}
                >
                  <span style={estilos.itemTitulo}>{c.titulo}</span>
                  <span style={estilos.itemHora}>{dayjs(c.actualizadoEn).format('HH:mm')}</span>
                </button>
              ))}
            </div>
          ),
      )}
    </div>
  );
}

function ListaCasos({ casoActivo, onElegirCaso }: Pick<Props, 'casoActivo' | 'onElegirCaso'>) {
  const { data, isLoading, isError } = useProcesos();
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState<string>(TODOS);

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (data ?? [])
      .filter((f) => tipo === TODOS || f.tipo === tipo)
      .filter((f) => q === '' || [f.radicado, f.parteA, f.parteB].some((c) => c.toLowerCase().includes(q)));
  }, [data, busqueda, tipo]);

  return (
    <>
      <div style={estilos.filtros}>
        <div style={estilos.buscador}>
          <Search size={13} color={PALETA.textoTenue} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Radicado o parte"
            style={estilos.input}
            aria-label="Buscar caso por radicado o parte"
          />
        </div>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={estilos.select}
          aria-label="Filtrar por tipo de proceso"
        >
          <option value={TODOS}>Todos los tipos</option>
          {TIPOS_PROCESO_LISTA.map((t) => (
            <option key={t} value={t}>
              {TIPOS_PROCESO[t].label}
            </option>
          ))}
        </select>
      </div>

      <div style={estilos.scroll}>
        {isLoading && <p style={estilos.textoTenue}>Cargando expedientes…</p>}
        {isError && (
          <p style={estilos.textoTenue}>
            No se pudieron cargar los expedientes. Verifica la conexión con el backend e intenta de nuevo.
          </p>
        )}
        {!isLoading && !isError && filas.length === 0 && (
          <p style={estilos.textoTenue}>No hay expedientes con estos filtros.</p>
        )}
        {filas.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onElegirCaso(f)}
            style={{ ...estilos.itemCaso, ...(f.id === casoActivo?.id ? estilos.itemActivo : null) }}
          >
            <span style={estilos.casoLinea}>
              <span style={estilos.casoRadicado}>{f.radicado}</span>
              <Tag color={colorEstado(f.estado)} style={{ marginInlineEnd: 0 }}>
                {etiquetaEstado(f.estado)}
              </Tag>
            </span>
            <span style={estilos.casoPartes}>
              {definicionDe(f.tipo)?.label ?? f.tipo} · {f.parteA} / {f.parteB}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  barra: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${PALETA.borde}`,
    flexShrink: 0,
    overflow: 'hidden',
  },
  header: { display: 'flex', alignItems: 'center', gap: 6, padding: '14px 10px 8px' },
  nuevaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    padding: '8px 12px',
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 10,
    background: 'transparent',
    color: PALETA.texto,
    fontSize: TEXTO.base,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  colapsarBtn: {
    border: 'none',
    background: 'transparent',
    color: PALETA.textoTenue,
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
  },
  conmutador: {
    display: 'flex',
    gap: 4,
    margin: '4px 10px 6px',
    padding: 3,
    borderRadius: 10,
    background: 'rgba(0,0,0,0.035)',
  },
  pestania: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    borderRadius: 8,
    padding: '6px 8px',
    fontSize: TEXTO.menor,
    fontFamily: 'inherit',
    color: PALETA.textoSuave,
    cursor: 'pointer',
  },
  pestaniaActiva: { background: PALETA.superficie, color: PALETA.texto, fontWeight: 600 },
  filtros: { display: 'flex', flexDirection: 'column', gap: 6, padding: '0 10px 6px' },
  buscador: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 8,
    padding: '5px 8px',
  },
  input: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: TEXTO.menor,
    color: PALETA.texto,
  },
  select: {
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 8,
    padding: '5px 6px',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: TEXTO.menor,
    color: PALETA.texto,
  },
  scroll: { flex: 1, overflowY: 'auto', padding: '6px 10px 18px' },
  grupoLabel: {
    fontSize: TEXTO.nota,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: PALETA.textoTenue,
    padding: '4px 6px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    borderRadius: 8,
    padding: '7px 8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  itemActivo: { background: PALETA.moradoBg },
  itemTitulo: {
    flex: 1,
    minWidth: 0,
    fontSize: TEXTO.base,
    color: PALETA.texto,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemHora: { fontSize: TEXTO.nota, color: PALETA.textoTenue, flexShrink: 0 },
  itemCaso: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    borderRadius: 8,
    padding: '8px',
    marginBottom: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  casoLinea: { display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' },
  casoRadicado: { fontSize: TEXTO.base, fontWeight: 600, color: PALETA.texto },
  casoPartes: {
    fontSize: TEXTO.nota,
    color: PALETA.textoSuave,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  textoTenue: { color: PALETA.textoTenue, fontSize: TEXTO.base },
};

/** Los trámites a un clic, debajo del registro de la sesión. */
function AtajosDelDespacho() {
  const navegar = useNavigate();
  return (
    <div>
      <div style={estilos.grupoLabel}>Herramientas</div>
      {ATAJOS_DESPACHO.map((a) => (
        <button
          key={a.ruta}
          type="button"
          onClick={() => navegar(a.ruta)}
          style={estilos.item}
          title={a.detalle}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 7,
              background: a.fondo,
              color: a.color,
              flexShrink: 0,
              marginRight: 8,
            }}
          >
            {a.icono}
          </span>
          <span style={estilos.itemTitulo}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
