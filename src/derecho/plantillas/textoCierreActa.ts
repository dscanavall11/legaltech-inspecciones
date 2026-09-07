import type { CausalIncremento } from '../multas';

/**
 * "Texto para cierre / actualización" — un párrafo corto y determinístico
 * para pegar en el sistema externo del despacho (RNMC, radicador, etc.),
 * independiente de la generación del .docx. El contenido literal de las
 * tres variantes (sin reincidencia, 50%, 75%) lo definió el despacho; este
 * módulo SOLO llena los cuatro datos variables ({NOMBRE}, {QUEJA},
 * {FECHA_ACTA}, {TIPO_MULTA}) — no redacta, no usa IA, no reinterpreta la
 * causal. La fórmula "(la) ciudadano(a)" es del propio texto suministrado:
 * no se resuelve por género aquí (el género solo decide qué plantilla DOCX
 * de Acta se abre, ver `catalogoActaFirmeza.ts`).
 *
 * Reutiliza la MISMA causal y tipo de multa ya seleccionados en el
 * formulario del acta — no vuelve a pedirlos ni calcula una causal distinta.
 */

export interface DatosCierreActa {
  nombre: string;
  queja: string;
  /** Fecha del acta, ya en el formato "en letras" del despacho (reutilizar `fechaALetras`). */
  fechaActaLetras: string;
  tipoMulta: number;
  causal: CausalIncremento;
}

export interface SegmentoCierre {
  texto: string;
  /** Debe mostrarse en negrilla — así lo pidió el despacho para NOMBRE, QUEJA, FECHA_ACTA, "DECLARA LA FIRMEZA", TIPO_MULTA y el porcentaje. */
  negrilla: boolean;
}

const N = (texto: string): SegmentoCierre => ({ texto, negrilla: false });
const B = (texto: string): SegmentoCierre => ({ texto, negrilla: true });

/**
 * Construye los segmentos del texto de cierre para la causal dada. Devuelve
 * `null` para `moroso_bdme`: el despacho no suministró una redacción para
 * esa causal — no se inventa una.
 */
export function generarTextoCierreActa(d: DatosCierreActa): SegmentoCierre[] | null {
  if (d.causal === 'moroso_bdme') return null;

  const inicio: SegmentoCierre[] = [
    N('Una vez cumplido el término establecido en el literal e) del Artículo 223A de la Ley 1801, ante la no objeción de la medida correctiva de multa por parte del (la) ciudadano(a) '),
    B(d.nombre),
    N(', el despacho mediante acta Nro. '),
    B(d.queja),
    N(' de fecha '),
    B(d.fechaActaLetras),
    N(', '),
    B('DECLARA LA FIRMEZA'),
    N(' de la multa general '),
    B(String(d.tipoMulta)),
  ];

  if (d.causal === 'ninguna') return [...inicio, N('.')];

  if (d.causal === 'reiteracion_despues_del_anio') {
    return [
      ...inicio,
      N(', la cual, de conformidad con lo dispuesto en los literales i) y j) del artículo Ibídem, se incrementa en un '),
      B('50%'),
      N(' por reincidencia.'),
    ];
  }

  // reiteracion_dentro_del_anio
  return [
    ...inicio,
    N(', la cual, de conformidad con lo dispuesto en los literales i) y j) del artículo Ibídem, se incrementa en un '),
    B('75%'),
    N(' por reincidencia en el mismo comportamiento dentro del mismo año.'),
  ];
}

/** Texto plano (sin marcado de negrilla) para copiar al portapapeles. */
export function textoCierrePlano(segmentos: SegmentoCierre[]): string {
  return segmentos.map((s) => s.texto).join('');
}
