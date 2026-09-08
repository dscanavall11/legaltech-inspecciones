import * as XLSX from 'xlsx';
import type { CausalIncremento, TipoMulta } from '@/derecho';
import { generoDesdeColumnaOficial, type GeneroCiudadano } from '@/derecho/generoDetectado';

/**
 * Orden de comparendo tal como la maneja la BD del despacho
 * ("BD. COMPARENDOS <año>.xlsx"). El módulo de actas de firmeza puede
 * alimentarse de esa base (cargada como Excel) o de un registro manual.
 */
export interface Comparendo {
  proceso: string;
  comparendo: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono: string;
  lugar: string;
  fechaComparendo: string; // ISO
  solicitante: string;
  articuloNumeral: string;
  descripcionConducta: string;
  hechos: string;
  /**
   * Tal como viene en el Excel — puede traer valores fuera de 1-4 (la BD
   * real trae, por ejemplo, tipo 5, que hoy no está modelado en ninguna
   * plantilla ni en `MULTA_GENERAL`). No se descarta ni se reinterpreta acá:
   * el validador de generación (individual o masiva) es quien decide si el
   * valor es utilizable, para que un tipo no reconocido aparezca reportado
   * en vez de desaparecer silenciosamente del universo de candidatos.
   */
  tipoMulta: TipoMulta;
  apelo: boolean;
  /**
   * Estado procesal real de la BD (columna "Incidente"), recortado pero sin
   * normalizar el resto — para mostrarlo tal cual en los reportes ("ESTADO:
   * NO ESTA - REVISAR"). Determina si corresponde generar Acta de Firmeza:
   * ver `esIncidenteFirmeza`.
   */
  incidente: string;
  /**
   * Causal de reincidencia ya resuelta desde la columna oficial
   * "Reincidencia" — nunca desde "REINCIDENTE" (columna obsoleta) ni
   * inferida de texto libre. Vale 'ninguna' tanto si la BD trae
   * explícitamente "sin reincidencia" como si el valor no se pudo
   * reconocer; para distinguir esos dos casos, ver `reincidenciaValida`.
   */
  causal: CausalIncremento;
  /**
   * false si la columna "Reincidencia" venía vacía o con un valor no
   * reconocido (no es "SIN REICIDENCIA", "0.5"/"50%" ni "0.75"/"75%"). Si el
   * Incidente es FIRMEZA y esto es false, NO debe generarse el acta
   * automáticamente — hay que confirmarlo a mano.
   */
  reincidenciaValida: boolean;
  /**
   * Género ya resuelto desde la columna oficial "Genero" de la base activa —
   * `null` si la columna no existe, viene vacía o trae un valor no
   * reconocido (no es "Masculino" ni "Femenino"). Es la fuente PRINCIPAL
   * para elegir la plantilla: solo si esto es `null` se recurre a la
   * detección textual sobre "hechos" (ver `resolverGeneroCiudadano`).
   */
  genero: GeneroCiudadano | null;
}

// ── Parseo del Excel del despacho ──────────────────────────────────────────

/** Normaliza un encabezado o valor: sin tildes, minúsculas, sin espacios sobrantes. */
function clave(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

/**
 * La BD guarda las fechas en letras: "veinticuatro (24) de abril de dos mil
 * veintiséis (2026)". Extrae día, mes y año a formato ISO.
 */
export function fechaLetrasAIso(texto: string): string | null {
  const t = String(texto ?? '');
  const dia = /\((\d{1,2})\)/.exec(t)?.[1];
  const anio = /\((\d{4})\)/.exec(t)?.[1];
  const mes = Object.keys(MESES).find((m) =>
    clave(t).includes(` de ${m} `) || clave(t).includes(`de ${m} de`),
  );
  if (!dia || !anio || !mes) {
    // Fecha ya en formato reconocible (Excel serial o ISO)
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return `${anio}-${String(MESES[mes]).padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/** Cualquier número finito se deja pasar tal cual — la validez del tipo (1-4) la decide el validador de generación, no el parseo. */
function tipoMultaCrudo(v: unknown): TipoMulta | null {
  const n = Number(v);
  return Number.isFinite(n) ? (n as TipoMulta) : null;
}

/**
 * Orden natural por PROCESO ("2026-1" antes que "2026-2" antes que "2026-10",
 * no orden alfabético): usado tanto en el listado como en la generación
 * masiva/ZIP, para que ambos coincidan. `Intl.Collator` con `numeric: true`
 * trata cada corrida de dígitos como número, sin necesidad de parsear el
 * formato del consecutivo a mano.
 */
const COLLATOR_PROCESO = new Intl.Collator('es', { numeric: true });
export function compararPorProceso(a: Comparendo, b: Comparendo): number {
  return COLLATOR_PROCESO.compare(a.proceso, b.proceso);
}

/**
 * Estado procesal (columna oficial "Incidente"). Solo "FIRMEZA" habilita la
 * generación del Acta de Firmeza — tolerante a mayúsculas/minúsculas y a
 * espacios al inicio/final ("FIRMEZA ", " firmeza "), nada más: no se hace
 * coincidencia parcial con otros estados.
 */
export function esIncidenteFirmeza(incidente: string): boolean {
  return clave(incidente) === 'firmeza';
}

/**
 * Interpreta la columna oficial "Reincidencia" — NUNCA la columna obsoleta
 * "REINCIDENTE" ni texto libre (hechos/observaciones). Solo reconoce las
 * equivalencias exactas que definió el despacho:
 * "SIN REICIDENCIA"/"SIN REINCIDENCIA" → ninguna; "0.5"/"0.50"/"50%" →
 * después del año (+50%); "0.75"/"75%" → dentro del año (+75%). Cualquier
 * otro valor, o vacío, se reporta como no reconocido — no se inventa una
 * causal para that caso.
 */
export function causalDesdeReincidenciaOficial(v: unknown): CausalIncremento | null {
  const t = clave(String(v ?? ''));
  if (!t) return null;
  if (t === 'sin reicidencia' || t === 'sin reincidencia') return 'ninguna';
  if (t === '0.5' || t === '0.50' || t === '50%') return 'reiteracion_despues_del_anio';
  if (t === '0.75' || t === '75%') return 'reiteracion_dentro_del_anio';
  return null;
}

/** @deprecated Columna "REINCIDENTE" obsoleta — no usarla para decidir la causal (ver `causalDesdeReincidenciaOficial`). Se conserva solo por si algún flujo manual antiguo la sigue leyendo explícitamente. */
export function causalDesdeBd(v: unknown): CausalIncremento {
  const t = clave(String(v ?? ''));
  if (!t || t === 'no' || t === 'n/a') return 'ninguna';
  if (t.includes('bdme') || t.includes('moroso') || t.includes('deudor')) return 'moroso_bdme';
  if (t.includes('50') || t.includes('despues')) return 'reiteracion_despues_del_anio';
  if (t.includes('si') || t.includes('75') || t.includes('x') || t.includes('reiterac') || t.includes('reincid')) {
    return 'reiteracion_dentro_del_anio';
  }
  return 'ninguna';
}

export interface ReporteImportacion {
  totalFilas: number;
  leidas: number;
  descartadas: number;
  motivos: Record<string, number>;
  /** Encabezados de columna tal como venían en el archivo (primera fila), para mostrar qué detectó el parseo. */
  columnasDetectadas: string[];
}

export async function parsearBdComparendos(archivo: File): Promise<{ comparendos: Comparendo[]; reporte: ReporteImportacion }> {
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array' });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '' });

  const reporte: ReporteImportacion = {
    totalFilas: filas.length,
    leidas: 0,
    descartadas: 0,
    motivos: {},
    columnasDetectadas: filas.length > 0 ? Object.keys(filas[0]) : [],
  };

  const vistos = new Set<string>();
  const comparendos: Comparendo[] = [];

  for (const fila of filas) {
    const idx: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fila)) idx[clave(k)] = v;

    const tipo = tipoMultaCrudo(idx['tipo de multa']);
    const fecha = fechaLetrasAIso(String(idx['fecha comparendo'] ?? ''));
    const numero = String(idx['comparendo'] ?? '').trim();

    if (!numero) {
      reporte.descartadas++;
      reporte.motivos['Sin número de comparendo'] = (reporte.motivos['Sin número de comparendo'] ?? 0) + 1;
      continue;
    }
    if (!tipo) {
      reporte.descartadas++;
      reporte.motivos['Sin tipo de multa'] = (reporte.motivos['Sin tipo de multa'] ?? 0) + 1;
      continue;
    }
    if (!fecha) {
      reporte.descartadas++;
      reporte.motivos['Sin fecha válida'] = (reporte.motivos['Sin fecha válida'] ?? 0) + 1;
      continue;
    }
    if (vistos.has(numero)) {
      reporte.descartadas++;
      reporte.motivos['Duplicado'] = (reporte.motivos['Duplicado'] ?? 0) + 1;
      continue;
    }
    vistos.add(numero);
    reporte.leidas++;

    const causalOficial = causalDesdeReincidenciaOficial(idx['reincidencia']);

    comparendos.push({
      proceso: String(idx['proceso'] ?? '').trim(),
      comparendo: numero,
      solicitado: String(idx['solicitado'] ?? '').trim(),
      cedula: String(idx['cedula solicitado'] ?? '').trim(),
      direccion: String(idx['direccion solicitado'] ?? '').trim(),
      telefono: String(idx['telefono solicitado'] ?? '').trim(),
      lugar: String(idx['lugar del comportamiento'] ?? '').trim(),
      fechaComparendo: fecha,
      solicitante: String(idx['solicitante'] ?? '').trim(),
      articuloNumeral: String(idx['articulo y numeral'] ?? '').trim(),
      descripcionConducta: String(idx['descripcion de la conducta'] ?? '').trim(),
      hechos: String(idx['hechos (descripcion comportamientos)'] ?? '').trim(),
      tipoMulta: tipo,
      apelo: clave(String(idx['apelo si/no'] ?? 'no')) === 'si',
      incidente: String(idx['incidente'] ?? '').trim(),
      causal: causalOficial ?? 'ninguna',
      reincidenciaValida: causalOficial !== null,
      genero: generoDesdeColumnaOficial(idx['genero']),
    });
  }
  return { comparendos, reporte };
}

// ── Muestra de demostración (estructura de la BD, datos ficticios) ─────────

export const COMPARENDOS_DEMO: Comparendo[] = [
  {
    proceso: '2026-6829',
    comparendo: '17-001-085044',
    solicitado: 'PEDRO ANTONIO SALAZAR RÍOS',
    cedula: '1002500001',
    direccion: 'CARRERA 17 CALLE 19 28',
    telefono: '3170000001',
    lugar: 'CALLE 17 CARRERA 17 41',
    fechaComparendo: '2026-04-24',
    solicitante: 'CAI CHIPRE',
    articuloNumeral: 'Artículo 92 Numeral 16',
    descripcionConducta:
      'Desarrollar la actividad económica sin cumplir cualquiera de los requisitos establecidos en la normatividad vigente',
    hechos:
      'En verificación a establecimiento en apertura destinado a barbería con atención al público se realiza la verificación de los requisitos previstos del artículo 87 de la Ley 1801 de 2016, el cual no cuenta con Cámara de Comercio vigente.',
    tipoMulta: 4,
    apelo: false,
    incidente: 'FIRMEZA',
    causal: 'ninguna',
    reincidenciaValida: true,
    genero: null, // demo: se resuelve por evidencia textual en "hechos"
  },
  {
    proceso: '2026-1068',
    comparendo: '17-001-6-2026-1398',
    solicitado: 'CAMILO ANDRÉS OSORIO DUQUE',
    cedula: '1060600002',
    direccion: 'CRA 4B No. 48-04',
    telefono: '',
    lugar: 'CALLE 49 CRA 6',
    fechaComparendo: '2026-01-23',
    solicitante: 'CAI SAN SEBASTIAN',
    articuloNumeral: 'Artículo 140 Numeral 14',
    descripcionConducta:
      'Consumir sustancias psicoactivas en espacios definidos por la autoridad competente',
    hechos:
      'El infractor es sorprendido consumiendo sustancias prohibidas tipo marihuana en el perímetro de los 120 metros de un templo religioso, conforme al acuerdo municipal vigente.',
    tipoMulta: 4,
    apelo: false,
    incidente: 'FIRMEZA',
    causal: 'reiteracion_dentro_del_anio', // registra reincidencia en la BD
    reincidenciaValida: true,
    genero: null, // demo: se resuelve por evidencia textual en "hechos"
  },
  {
    proceso: '2026-557',
    comparendo: '17-001-6-2026-63',
    solicitado: 'LAURA MARCELA HENAO PATIÑO',
    cedula: '1053800003',
    direccion: 'CRA 32 CALLE 27',
    telefono: '3180000003',
    lugar: 'CRA 32 CALLE 27',
    fechaComparendo: '2026-01-01',
    solicitante: 'CAI EL NEVADO',
    articuloNumeral: 'Artículo 27 Numeral 6',
    descripcionConducta:
      'Portar armas, elementos cortantes, punzantes o semejantes, o sustancias peligrosas, en áreas comunes o lugares abiertos al público',
    hechos:
      'Mediante registro a persona se le halla en la pretina del pantalón un arma cortopunzante tipo navaja, sin justificación de su porte.',
    tipoMulta: 2,
    apelo: false,
    incidente: 'FIRMEZA',
    causal: 'ninguna',
    reincidenciaValida: true,
    genero: null, // demo: se resuelve por evidencia textual en "hechos"
  },
  {
    proceso: '2026-563',
    comparendo: '17-001-6-2026-287',
    solicitado: 'JOSÉ MIGUEL GALLEGO TORO',
    cedula: '1053700004',
    direccion: 'CRA 24 CALLE 38',
    telefono: '3150000004',
    lugar: 'CRA 24 CALLE 38',
    fechaComparendo: '2026-01-04',
    solicitante: 'CAI CENTRO',
    articuloNumeral: 'Artículo 140 Numeral 13',
    descripcionConducta:
      'Consumir, portar, distribuir, ofrecer o comercializar sustancias psicoactivas en el espacio público',
    hechos:
      'El ciudadano es sorprendido consumiendo sustancias psicoactivas en el espacio público, en inmediaciones de un parque principal.',
    tipoMulta: 4,
    apelo: false,
    incidente: 'FIRMEZA',
    causal: 'ninguna',
    reincidenciaValida: true,
    genero: null, // demo: se resuelve por evidencia textual en "hechos"
  },
  {
    proceso: '2026-598',
    comparendo: '17-001-6-2026-410',
    solicitado: 'DIANA CAROLINA MEJÍA LÓPEZ',
    cedula: '1053900005',
    direccion: 'CALLE 65 CRA 23 11',
    telefono: '3160000005',
    lugar: 'CALLE 65 CRA 23',
    fechaComparendo: '2026-02-10',
    solicitante: 'CAI PALOGRANDE',
    articuloNumeral: 'Artículo 33 Numeral 1',
    descripcionConducta:
      'Perturbar o permitir que se afecte el sosiego con sonidos o ruidos en actividades que afecten la convivencia',
    hechos:
      'Se atiende llamado de la comunidad por ruido excesivo en vivienda; se constata música a alto volumen en horario de descanso pese a requerimiento previo.',
    tipoMulta: 3,
    apelo: false,
    incidente: 'FIRMEZA',
    causal: 'ninguna',
    reincidenciaValida: true,
    genero: null, // demo: se resuelve por evidencia textual en "hechos"
  },
  {
    proceso: '2026-612',
    comparendo: '17-001-6-2026-455',
    solicitado: 'ANDRÉS FELIPE QUINTERO MARÍN',
    cedula: '1054000006',
    direccion: 'BARRIO LA ENEA MZ 4 CASA 7',
    telefono: '',
    lugar: 'PARQUE PRINCIPAL LA ENEA',
    fechaComparendo: '2026-03-02',
    solicitante: 'CAI LA ENEA',
    articuloNumeral: 'Artículo 35 Numeral 1',
    descripcionConducta: 'Irrespetar a las autoridades de policía',
    hechos:
      'Al momento de la intervención policial el ciudadano irrespeta de manera verbal y reiterada al personal uniformado que atendía el procedimiento.',
    tipoMulta: 2,
    apelo: false,
    incidente: 'FIRMEZA',
    causal: 'ninguna',
    reincidenciaValida: true,
    genero: null, // demo: se resuelve por evidencia textual en "hechos"
  },
];
