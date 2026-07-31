/**
 * Catálogo normativo artículo/numeral → {descripcionConducta, bienJuridico,
 * medidasCorrectivas} del Código Nacional de Seguridad y Convivencia
 * Ciudadana (Ley 1801 de 2016).
 *
 * Única fuente de verdad para estos tres campos: la radicación (Comparendos-
 * Page) y los generadores de documentos (SiguientePasoComparendo) los
 * derivan de aquí por articuloNumeral — nunca se vuelven a escribir a mano.
 *
 * Procedencia del texto:
 * - Entradas con `pendienteValidacion` ausente/false: transcritas verbatim
 *   de los campos MERGEFIELD Descripcion_de_la_conducta / Bien_Juridico /
 *   Medidas_correctivas del corpus real del despacho de Manizales
 *   (docs/superpowers/plan-sources/despacho-audiencias/*.txt).
 * - Entradas con `pendienteValidacion: true`: no tienen ese respaldo directo
 *   (el corpus disponible no trae un caso para ese numeral específico); el
 *   texto se completó con la mejor referencia disponible (BD de comparendos
 *   del despacho o clasificación por título/capítulo). ⚠️ El equipo jurídico
 *   debe confirmarlas contra el texto vigente de la Ley 1801 de 2016 antes
 *   de darlas por definitivas — mismo criterio que src/derecho/multas.ts.
 */

export interface ComportamientoCatalogo {
  /** Clave canónica "Artículo N Numeral M" (o "Artículo N" sin numeral) — ver normalizarArticuloNumeral. */
  articuloNumeral: string;
  descripcionConducta: string;
  bienJuridico: string;
  medidasCorrectivas: string;
  /** true si el texto no proviene verbatim del corpus del despacho — ver nota de procedencia arriba. */
  pendienteValidacion?: boolean;
}

const BIEN_JURIDICO_VIDA_INTEGRIDAD = 'Comportamiento que pone en riesgo la vida e integridad de las personas.';
const BIEN_JURIDICO_RELACION_AUTORIDADES =
  'Comportamiento que afecta la relación entre las personas y las autoridades.';
const BIEN_JURIDICO_ACTIVIDAD_ECONOMICA = 'Comportamiento que afecta la actividad económica.';
const BIEN_JURIDICO_ESPACIO_PUBLICO = 'Comportamiento contrario al cuidado e integridad del espacio público.';
const BIEN_JURIDICO_TENENCIA_ANIMALES = 'Comportamiento que pone en riesgo la convivencia por la tenencia de animales.';

export const CATALOGO_COMPORTAMIENTOS: readonly ComportamientoCatalogo[] = [
  // ── Título I. De la vida e integridad (fallo-continuacion-sanciona.txt) ──
  {
    articuloNumeral: 'Artículo 27 Numeral 3',
    descripcionConducta: 'Agredir físicamente a personas por cualquier medio.',
    bienJuridico: BIEN_JURIDICO_VIDA_INTEGRIDAD,
    medidasCorrectivas: 'Multa General Tipo 3.',
  },
  {
    articuloNumeral: 'Artículo 27 Numeral 6',
    descripcionConducta:
      'Portar armas, elementos cortantes, punzantes o semejantes, o sustancias peligrosas, en áreas comunes o lugares abiertos al público.',
    bienJuridico: BIEN_JURIDICO_VIDA_INTEGRIDAD,
    medidasCorrectivas: 'Multa General Tipo 2.',
    pendienteValidacion: true,
  },

  // ── Relación con las autoridades (fallo-inactividad.txt / fallo-absuelve-unica.txt / auto-suspende-audiencia.txt) ──
  {
    articuloNumeral: 'Artículo 35 Numeral 1',
    descripcionConducta: 'Irrespetar a las autoridades de Policía.',
    bienJuridico: BIEN_JURIDICO_RELACION_AUTORIDADES,
    medidasCorrectivas: 'Multa General Tipo 2.',
  },
  {
    articuloNumeral: 'Artículo 35 Numeral 2',
    descripcionConducta: 'Incumplir, desacatar, desconocer e impedir la función o la orden de Policía.',
    bienJuridico: BIEN_JURIDICO_RELACION_AUTORIDADES,
    medidasCorrectivas: 'Multa General Tipo 4; participación en programa comunitario o actividad pedagógica de convivencia.',
  },
  {
    articuloNumeral: 'Artículo 35 Numeral 5',
    descripcionConducta:
      'Ofrecer cualquier tipo de resistencia a la aplicación de una medida o la utilización de un medio de Policía.',
    bienJuridico: BIEN_JURIDICO_RELACION_AUTORIDADES,
    medidasCorrectivas: 'Multa General Tipo 4; participación en programa comunitario o actividad pedagógica de convivencia.',
  },

  // ── Actividad económica — sin caso en el corpus disponible; confirmar equipo jurídico ──
  {
    articuloNumeral: 'Artículo 92 Numeral 4',
    descripcionConducta:
      'Impedir, dificultar, obstaculizar o resistirse a la vigilancia, control y requerimientos de la Policía Nacional en ejercicio de sus funciones de control a las actividades económicas.',
    bienJuridico: BIEN_JURIDICO_ACTIVIDAD_ECONOMICA,
    medidasCorrectivas: 'Multa General Tipo 2.',
    pendienteValidacion: true,
  },
  {
    articuloNumeral: 'Artículo 92 Numeral 16',
    descripcionConducta: 'Desarrollar la actividad económica sin cumplir cualquiera de los requisitos establecidos en la normatividad vigente.',
    bienJuridico: BIEN_JURIDICO_ACTIVIDAD_ECONOMICA,
    medidasCorrectivas: 'Multa General Tipo 4.',
    pendienteValidacion: true,
  },
  {
    articuloNumeral: 'Artículo 95 Numeral 1',
    descripcionConducta: 'Ejercer una actividad económica sin las autorizaciones, permisos o requisitos exigidos por la autoridad competente.',
    bienJuridico: BIEN_JURIDICO_ACTIVIDAD_ECONOMICA,
    medidasCorrectivas: 'Multa General Tipo 2.',
    pendienteValidacion: true,
  },
  {
    articuloNumeral: 'Artículo 100 Numeral 5',
    descripcionConducta: 'Incumplir las normas urbanísticas y de uso del suelo aplicables al desarrollo de la actividad económica.',
    bienJuridico: BIEN_JURIDICO_ACTIVIDAD_ECONOMICA,
    medidasCorrectivas: 'Multa General Tipo 2.',
    pendienteValidacion: true,
  },

  // ── Título de la relación con los animales (auto-inasistencia.txt) ──
  {
    articuloNumeral: 'Artículo 124 Numeral 7',
    descripcionConducta:
      'Tolerar, permitir o inducir por acción u omisión el que un animal ataque a una persona, a un animal o a bienes de terceros.',
    bienJuridico: BIEN_JURIDICO_TENENCIA_ANIMALES,
    medidasCorrectivas: 'Multa General Tipo 4; participación en programa comunitario o actividad pedagógica de convivencia.',
  },

  // ── Cuidado e integridad del espacio público (fallo-inasistencia.txt / declaracion-testigo.txt) ──
  {
    articuloNumeral: 'Artículo 140 Numeral 11',
    descripcionConducta: 'Ocupar el espacio público con la instalación de elementos como sillas, mesas, toldos, sombrillas y otros similares, sin contar con el respectivo permiso.',
    bienJuridico: BIEN_JURIDICO_ESPACIO_PUBLICO,
    medidasCorrectivas: 'Multa General Tipo 2.',
    pendienteValidacion: true,
  },
  {
    articuloNumeral: 'Artículo 140 Numeral 13',
    descripcionConducta:
      'Consumir, portar, distribuir, ofrecer o comercializar sustancias psicoactivas, inclusive la dosis personal, en el perímetro de centros educativos, al interior de centros deportivos y en parques.',
    bienJuridico: BIEN_JURIDICO_ESPACIO_PUBLICO,
    medidasCorrectivas: 'Multa General Tipo 4; destrucción del bien.',
  },

  // ── Multas generales — art. 180 no describe un comportamiento propio, es
  //    la escala general de multa que remata cada uno de los anteriores
  //    (ver src/derecho/multas.ts, MULTA_GENERAL). Se cataloga sin numeral
  //    como referencia genérica cuando el expediente solo trae "Artículo 180". ──
  {
    articuloNumeral: 'Artículo 180',
    descripcionConducta: 'Multa general por un comportamiento contrario a la convivencia (art. 180, Ley 1801 de 2016).',
    bienJuridico: 'Convivencia ciudadana — el bien jurídico específico lo determina el artículo del comportamiento sancionado (arts. 27 a 140).',
    medidasCorrectivas: 'Multa General (tipo 1 a 4 según el comportamiento, arts. 180 y 223A).',
  },
];

/** Reconoce "Artículo N Numeral M", "art. N num. M", "ARTICULO N, NUMERAL M", con o sin numeral. */
const RE_ARTICULO_NUMERAL = /art[íi]?c?u?l?o?\.?\s*(\d{1,3})(?:[,\s]+num(?:eral)?\.?\s*(\d{1,3}))?/i;

/** Normaliza cualquier variante de formato a la clave canónica del catálogo, o null si no reconoce un artículo. */
export function normalizarArticuloNumeral(valor: string): string | null {
  const match = RE_ARTICULO_NUMERAL.exec(valor.trim());
  return match ? `Artículo ${match[1]}${match[2] ? ` Numeral ${match[2]}` : ''}` : null;
}

/** Busca la entrada del catálogo para un articuloNumeral en cualquier formato reconocido; undefined si no está catalogado. */
export function buscarComportamiento(articuloNumeral: string): ComportamientoCatalogo | undefined {
  const clave = normalizarArticuloNumeral(articuloNumeral);
  return clave ? CATALOGO_COMPORTAMIENTOS.find((entrada) => entrada.articuloNumeral === clave) : undefined;
}
