import dayjs from 'dayjs';
import { FlujoNavegable } from '@/shared/components/FlujoNavegable';
import {
  ETAPAS_COMPARENDO,
  ETAPAS_QUERELLA,
  ETAPA_COMPARENDO_ACTIVA,
  ETAPA_QUERELLA_ACTIVA,
  TODOS_LOS_ESTADOS_COMPARENDO,
  TODOS_LOS_ESTADOS_QUERELLA,
  TRANSICIONES_COMPARENDO,
  TRANSICIONES_QUERELLA,
  siguientePaso,
  siguientePasoComparendo,
  type EstadoComparendo,
} from '@/derecho';
import { useLegalCase } from '@/shared/legalCases/api';
import { useCaseEvidence } from '@/shared/pruebas/api';
import { ESTADO_LABEL, type FilaProceso } from '@/shared/procesos/types';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import type { EstadoQuerella } from '@/features/querellas/types';
import { PALETA } from '@/theme/palette';
import { armarGrafo, MOTIVO_FALTA } from './grafo';

/**
 * Paneles que dependen del expediente abierto: el mapa del trámite, el
 * contador de términos y el grafo argumental. Cada uno monta lo que ya existe
 * (FlujoNavegable, calcularTermino, el módulo de pruebas) y no rellena nada
 * que el expediente no traiga.
 */

// ─── Etapa procesal (mapa del trámite) ──────────────────────────────────────

export function PanelEtapa({ caso }: { caso: FilaProceso }) {
  const { data, isLoading, isError } = useLegalCase(caso.id);
  const actuaciones = (data?.stateHistory ?? []).map((h) => ({ estadoCodigo: h.stateCode }));

  const comun = {
    id: caso.id,
    actuaciones,
    estadoLabel: ESTADO_LABEL,
  };

  return (
    <>
      {isLoading && <p style={estilos.tenue}>Cargando el historial del expediente…</p>}
      {isError && (
        <p style={estilos.tenue}>
          No se pudo cargar el historial: el mapa marca el estado actual, pero no lo ya recorrido.
        </p>
      )}
      {caso.tipo === 'querella' ? (
        <FlujoNavegable
          {...comun}
          estadoActual={caso.estado as EstadoQuerella}
          todosLosEstados={TODOS_LOS_ESTADOS_QUERELLA}
          transiciones={TRANSICIONES_QUERELLA}
          etapas={ETAPAS_QUERELLA}
          etapaActivaPorEstado={ETAPA_QUERELLA_ACTIVA}
          siguientePaso={siguientePaso}
          descripcionMapa="Los 9 estados de la querella (proceso verbal abreviado, art. 223, Ley 1801/2016) y dónde está este expediente."
        />
      ) : (
        <FlujoNavegable
          {...comun}
          estadoActual={caso.estado as EstadoComparendo}
          todosLosEstados={TODOS_LOS_ESTADOS_COMPARENDO}
          transiciones={TRANSICIONES_COMPARENDO}
          excluirDestino="acta_firmeza"
          etapas={ETAPAS_COMPARENDO}
          etapaActivaPorEstado={ETAPA_COMPARENDO_ACTIVA}
          siguientePaso={siguientePasoComparendo}
          descripcionMapa="Los 17 estados del comparendo (arts. 180, 222, 223 y 223A, Ley 1801/2016) y dónde está este expediente."
        />
      )}
    </>
  );
}

// ─── Contador de términos del caso abierto ──────────────────────────────────

export function PanelContador({ caso }: { caso: FilaProceso }) {
  const termino =
    caso.diasTermino !== undefined && caso.fechaRadicacion
      ? calcularTermino(dayjs(caso.fechaRadicacion), caso.diasTermino)
      : null;

  if (!termino) {
    return (
      <p style={estilos.tenue}>
        Este expediente no registra término en su metadata: no se le calcula uno por defecto.
      </p>
    );
  }

  return (
    <>
      <div style={estilos.contador}>
        <span style={{ ...estilos.numero, color: termino.vencido ? PALETA.rojo : PALETA.texto }}>
          {termino.vencido ? 'Vencido' : termino.diasRestantes}
        </span>
        {!termino.vencido && <span style={estilos.numeroPie}>días hábiles restantes</span>}
      </div>
      <p style={estilos.linea}>
        Vence el <strong>{termino.fechaVencimiento.format('DD/MM/YYYY')}</strong> — término de{' '}
        {caso.diasTermino} días hábiles desde la radicación, {termino.diasTranscurridos} transcurridos.
      </p>
      {caso.diasTerminoPresuntivo && (
        <p style={estilos.tenue}>
          Término presuntivo: el expediente no trae <code>diasTermino</code>, se usa el valor por defecto del tipo.
        </p>
      )}
    </>
  );
}

// ─── Grafo argumental: hechos ↔ pruebas ─────────────────────────────────────

const FILA = 46;
const ANCHO_NODO = 186;
const X_PRUEBAS = 254;

function recortar(texto: string, max = 34): string {
  return texto.length <= max ? texto : `${texto.slice(0, max - 1).trimEnd()}…`;
}

export function PanelGrafo({ caso }: { caso: FilaProceso }) {
  const expediente = useLegalCase(caso.id);
  const pruebas = useCaseEvidence(caso.id);

  if (expediente.isLoading || pruebas.isLoading) return <p style={estilos.tenue}>Cargando el expediente…</p>;
  if (expediente.isError || pruebas.isError) {
    return (
      <p style={estilos.tenue}>
        No se pudo cargar el expediente ni sus pruebas. Verifica la conexión con el backend: el grafo no se dibuja
        con datos de ejemplo.
      </p>
    );
  }

  const grafo = armarGrafo(expediente.data?.background?.allegedFacts, pruebas.data ?? []);
  if (grafo.falta) return <p style={estilos.tenue}>{MOTIVO_FALTA[grafo.falta]}</p>;

  const filas = Math.max(grafo.hechos.length, grafo.pruebas.length);
  const alto = filas * FILA + 26;
  const yDe = (i: number) => 26 + i * FILA;
  const centro = (i: number) => yDe(i) + 15;
  const filaHecho = new Map(grafo.hechos.map((h, i) => [h.id, i]));
  const filaPrueba = new Map(grafo.pruebas.map((p, i) => [p.id, i]));

  return (
    <>
      <svg viewBox={`0 0 440 ${alto}`} width="100%" role="img" aria-label="Hechos del expediente y pruebas que los sustentan">
        <text x={0} y={12} fontSize={10.5} letterSpacing="0.06em" fill={PALETA.textoTenue}>
          HECHOS
        </text>
        <text x={X_PRUEBAS} y={12} fontSize={10.5} letterSpacing="0.06em" fill={PALETA.textoTenue}>
          PRUEBAS
        </text>

        {grafo.vinculos.map((v) => (
          <line
            key={`${v.hecho}-${v.prueba}`}
            x1={ANCHO_NODO}
            y1={centro(filaHecho.get(v.hecho) ?? 0)}
            x2={X_PRUEBAS}
            y2={centro(filaPrueba.get(v.prueba) ?? 0)}
            stroke={PALETA.morado}
            strokeWidth={1.2}
          />
        ))}

        {grafo.hechos.map((h, i) => (
          <g key={h.id}>
            <rect x={0} y={yDe(i)} width={ANCHO_NODO} height={30} rx={7} fill={PALETA.moradoBg} stroke={PALETA.borde} />
            <text x={9} y={yDe(i) + 19} fontSize={11} fill={PALETA.texto}>
              <title>{h.texto}</title>
              {h.id} · {recortar(h.texto)}
            </text>
          </g>
        ))}

        {grafo.pruebas.map((p, i) => (
          <g key={p.id}>
            <rect
              x={X_PRUEBAS}
              y={yDe(i)}
              width={ANCHO_NODO}
              height={30}
              rx={7}
              fill="transparent"
              stroke={PALETA.borde}
            />
            <text x={X_PRUEBAS + 9} y={yDe(i) + 19} fontSize={11} fill={PALETA.texto}>
              <title>{p.etiqueta}</title>
              {p.identificador} · {recortar(p.etiqueta)}
            </text>
          </g>
        ))}
      </svg>
      <p style={estilos.tenue}>
        Las líneas salen de las palabras que la propia prueba trae en su finalidad y su descripción: son un indicio de
        a qué hecho apunta, no una valoración probatoria. Las pruebas sin línea no mencionan ningún hecho del relato.
      </p>
    </>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  tenue: { color: PALETA.textoSuave, fontSize: 12.5, lineHeight: 1.55, margin: '8px 0 0' },
  linea: { color: PALETA.texto, fontSize: 12.5, lineHeight: 1.55, margin: '8px 0 0' },
  contador: { display: 'flex', alignItems: 'baseline', gap: 8 },
  numero: { fontSize: 30, fontWeight: 600, lineHeight: 1.1 },
  numeroPie: { fontSize: 12.5, color: PALETA.textoSuave },
};
