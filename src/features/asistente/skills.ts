import { BookOpen, FileCheck2, FileSearch, FileText, Gavel, Inbox, Scale, type LucideIcon } from 'lucide-react';
import { actaFirmezaComoDocumento, generarActaFirmeza } from '@/derecho/plantillas/actaFirmeza';
import { generarFalloComparendo, type VarianteFallo } from '@/derecho/plantillas/falloComparendo';
import type { DocumentoLegal } from '@/derecho/plantillas/documentoLegal';
import { buscarComportamiento } from '@/derecho/catalogoComportamientos';
import { fechaALetras } from '@/derecho/letras';
import { ARTICULOS } from '@/derecho/normativa';
import type { CausalIncremento, TipoMulta } from '@/derecho/multas';

/**
 * Registro de skills jurídicas del asistente. Módulo puro: arma el prompt
 * especializado y, cuando corresponde, el proyecto de documento con los
 * generadores que ya existen en `@/derecho`. No habla con la red ni con el
 * expediente — nada de lo que produce queda guardado.
 *
 * El orden en que cada skill pide la información es el del trámite tal como
 * lo dibujó el despacho: identificación del proceso (fallo/comparendo y
 * fecha) → partes (querellante y querellado) → pruebas → orientación del
 * inspector → decisión.
 */

export type ClaveSkill =
  | '/radicar'
  | '/fallo-querella'
  | '/fallo-queja'
  | '/acta-firmeza'
  | '/norma'
  | '/pruebas'
  | '/resumir';

export interface DespachoSkill {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorCargo: string;
}

export interface EntradaSkill {
  /** Lo que el inspector escribió, tal cual (incluye la línea de la skill y los campos). */
  texto: string;
  despacho: DespachoSkill;
  /** Fecha de la actuación en ISO; por defecto, hoy. */
  hoy?: string;
  /** Contexto del caso activo (cargarContextoCaso); se antepone al prompt. */
  caso?: string | null;
}

export interface CampoSkill {
  etiqueta: string;
  ayuda?: string;
}

export interface Artefacto {
  /** null cuando falta un dato sin el cual el documento no puede armarse (no se inventa un valor por defecto). */
  documento: DocumentoLegal | null;
  /** Campos que el inspector no aportó: quedan marcados en el documento, nunca completados por el asistente. */
  faltantes: string[];
}

export interface Skill {
  clave: ClaveSkill;
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
  /** Campos que la skill pide, en el orden del trámite. Prellenan el compositor. */
  campos?: CampoSkill[];
  construirPrompt: (entrada: EntradaSkill) => string;
  generarArtefacto?: (entrada: EntradaSkill) => Artefacto;
}

export const REGLA_NO_INVENTAR =
  'Regla dura e innegociable: si un dato no está en el mensaje del inspector, escríbelo como [FALTA: dato] y pídelo expresamente. Jamás inventes ni completes por analogía un hecho, una fecha, un nombre, una cédula, un número de comparendo o de radicado, un valor, ni una cita normativa o jurisprudencial. Si no tienes el texto de la norma, dilo en vez de parafrasearla como si la citaras.';

const ENCUADRE_BASE = `Actúas como asistente jurídico de un inspector de policía de convivencia y paz en Colombia, bajo la Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana), el Decreto 768 de 2025 y la jurisprudencia aplicable. Escribes en el registro del despacho: sobrio, impersonal, en tercera persona, sin adjetivos de más. La decisión es del inspector; tú preparas el proyecto y señalas lo que falta.`;

function construir(secciones: string[], entrada: EntradaSkill): string {
  const expediente = entrada.caso
    ? [`=== EXPEDIENTE ACTIVO ===\n${entrada.caso}\n=== FIN DEL EXPEDIENTE ===`]
    : [];
  return [
    ENCUADRE_BASE,
    ...expediente,
    ...secciones,
    REGLA_NO_INVENTAR,
    `Mensaje del inspector:\n${entrada.texto.trim()}`,
  ].join('\n\n');
}

// ─── Campos escritos en el mensaje ("Etiqueta: valor", una por línea) ────────

function normalizarEtiqueta(etiqueta: string): string {
  return etiqueta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Lee los pares "Etiqueta: valor" que el compositor prellena y el inspector completa. */
export function leerCampos(texto: string): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const linea of texto.split('\n')) {
    const separador = linea.indexOf(':');
    if (separador <= 0) continue;
    const clave = normalizarEtiqueta(linea.slice(0, separador));
    const valor = linea.slice(separador + 1).trim();
    if (clave && valor) campos[clave] = valor;
  }
  return campos;
}

/**
 * Texto con el que se prellena el compositor al elegir la skill: sus campos en
 * el orden del trámite. `conocidos` trae lo que el caso activo ya sabe
 * (radicado, partes) para que el inspector no lo vuelva a escribir.
 */
export function plantillaEntrada(skill: Skill, conocidos: Record<string, string> = {}): string {
  if (!skill.campos?.length) return `${skill.clave} `;
  const porClave = new Map(Object.entries(conocidos).map(([k, v]) => [normalizarEtiqueta(k), v]));
  const valor = (etiqueta: string) => porClave.get(normalizarEtiqueta(etiqueta)) ?? '';
  return `${skill.clave}\n${skill.campos.map((c) => `${c.etiqueta}: ${valor(c.etiqueta)}`).join('\n')}`;
}

/** Lector de campos que acumula lo faltante y lo deja marcado en el documento. */
function lector(texto: string, faltantes: string[]) {
  const campos = leerCampos(texto);
  return (etiqueta: string): string => {
    const valor = campos[normalizarEtiqueta(etiqueta)];
    if (valor) return valor;
    faltantes.push(etiqueta);
    return `[FALTA: ${etiqueta}]`;
  };
}

function leerTipoMulta(valor: string): TipoMulta | null {
  const n = Number(valor.match(/[1-4]/)?.[0]);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}

function leerVarianteFallo(valor: string): VarianteFallo | null {
  const v = valor.toLowerCase();
  if (/absuel|absten|exoner/.test(v)) return 'absuelve_unica';
  if (/sancion|impon|condena/.test(v)) return 'sanciona_continuacion';
  return null;
}

function hoyISO(entrada: EntradaSkill): string {
  return entrada.hoy ?? new Date().toISOString().slice(0, 10);
}

function listaDePruebas(valor: string): string[] {
  return valor
    .split(/[;,]|\s\/\s/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ─── Artefactos ─────────────────────────────────────────────────────────────

/**
 * Proyecto de fallo de la querella (proceso verbal abreviado, art. 223 de la
 * Ley 1801 de 2016). No hay plantilla de querella en `@/derecho/plantillas`
 * (las que existen son del comparendo), así que se arma sobre el tipo
 * compartido `DocumentoLegal` — mismo renderer de PDF y Word — sin redactar
 * motivación por el inspector: cada apartado lleva lo que él escribió o el
 * marcador de faltante.
 */
function proyectoFalloQuerella(entrada: EntradaSkill): Artefacto {
  const faltantes: string[] = [];
  const campo = lector(entrada.texto, faltantes);
  const { despacho } = entrada;
  const fecha = fechaALetras(hoyISO(entrada));
  const radicado = campo('Radicado');
  const querellante = campo('Querellante');
  const querellado = campo('Querellado');
  const cedula = campo('Cédula del querellado');
  const hechos = campo('Hechos');
  const pruebas = campo('Pruebas practicadas');
  const decision = campo('Sentido de la decisión');

  const documento: DocumentoLegal = {
    entidad: despacho.inspeccion.toUpperCase(),
    tituloDocumento: 'PROYECTO DE FALLO — QUERELLA',
    proceso: radicado,
    rotuloProceso: 'RADICADO',
    fechaResolucionLetras: fecha,
    epigrafe: `AUDIENCIA PÚBLICA EN LA CUAL SE DECIDE DE FONDO LA QUERELLA, EN APLICACIÓN DEL PROCESO VERBAL ABREVIADO — ${ARTICULOS.procesoVerbalAbreviado.toUpperCase()}`,
    tablaDatos: [
      { etiqueta: 'RADICADO', valor: radicado },
      { etiqueta: 'QUERELLANTE', valor: querellante },
      { etiqueta: 'QUERELLADO', valor: querellado },
      { etiqueta: 'CÉDULA DE CIUDADANÍA No.', valor: cedula },
      { etiqueta: 'FECHA DE LA DECISIÓN', valor: fecha },
    ],
    secciones: [
      {
        titulo: 'ANTECEDENTES',
        parrafos: [
          `${querellante} formuló querella en contra de ${querellado}, identificado(a) con cédula de ciudadanía No. ${cedula}, por los siguientes hechos: “${hechos}”.`,
        ],
      },
      {
        titulo: 'COMPETENCIA',
        parrafos: [
          `El Inspector de Convivencia y Paz de ${despacho.municipio} es la autoridad competente para conocer y decidir en primera instancia este asunto, conforme al artículo 206 de la Ley 1801 de 2016, y adelanta la actuación por el proceso verbal abreviado (${ARTICULOS.procesoVerbalAbreviado}).`,
        ],
      },
      {
        titulo: 'PRUEBAS PRACTICADAS',
        parrafos: listaDePruebas(pruebas).map((p) => `- ${p}`),
      },
      {
        titulo: 'VALORACIÓN PROBATORIA Y CONSIDERACIONES',
        parrafos: [
          '[FALTA: valoración probatoria — la redacta el inspector con base en las pruebas practicadas y en las reglas de la sana crítica; el asistente no la suple.]',
        ],
      },
    ],
    resuelve: [`PRIMERO: ${decision}`, 'SEGUNDO: [FALTA: notificación, recursos y órdenes complementarias.]'],
    cierre: `${despacho.municipio}, ${fecha}.`,
    firma: [{ nombre: despacho.inspectorNombre, rol: despacho.inspectorCargo }],
  };

  return { documento, faltantes };
}

/** Proyecto de fallo de la queja por orden de comparendo: usa la plantilla real del despacho. */
function proyectoFalloQueja(entrada: EntradaSkill): Artefacto {
  const faltantes: string[] = [];
  const campo = lector(entrada.texto, faltantes);
  const { despacho } = entrada;
  const articuloNumeral = campo('Artículo y numeral');
  const catalogo = buscarComportamiento(articuloNumeral);
  const tipoMulta = leerTipoMulta(campo('Tipo de multa'));
  const variante = leerVarianteFallo(campo('Sentido de la decisión'));

  if (!tipoMulta) faltantes.push('Tipo de multa (1 a 4) — sin él no se puede liquidar');
  if (!variante) faltantes.push('Sentido de la decisión (absuelve o sanciona)');
  if (!tipoMulta || !variante) return { documento: null, faltantes };

  const documento = generarFalloComparendo({
    municipio: despacho.municipio,
    inspeccion: despacho.inspeccion,
    inspectorNombre: despacho.inspectorNombre,
    inspectorRol: despacho.inspectorCargo,
    fechaResolucion: hoyISO(entrada),
    proceso: campo('Nro. de queja'),
    comparendo: campo('Nro. de comparendo'),
    articuloNumeral,
    fechaComparendo: campo('Fecha del comparendo'),
    lugarComportamiento: campo('Lugar de los hechos'),
    solicitado: campo('Querellado'),
    cedulaSolicitado: campo('Cédula del querellado'),
    direccionSolicitado: '[FALTA: dirección del presunto infractor]',
    solicitante: campo('Querellante'),
    hechos: campo('Hechos'),
    // Conducta, bien jurídico y medidas salen del catálogo del repo cuando el
    // artículo está catalogado; si no, quedan marcados, nunca redactados.
    descripcionConducta: catalogo?.descripcionConducta ?? '[FALTA: descripción de la conducta]',
    bienJuridico: catalogo?.bienJuridico ?? '[FALTA: bien jurídico afectado]',
    medidasCorrectivas: catalogo?.medidasCorrectivas ?? '[FALTA: medidas correctivas previstas]',
    apeloSiNo: 'NO',
    tipoMulta,
    pruebasPracticadas: listaDePruebas(campo('Pruebas practicadas')),
    variante,
    cuentaRecaudo: '[FALTA: cuenta de recaudo]',
    titularCuenta: '[FALTA: titular de la cuenta]',
    nitTitular: '[FALTA: NIT del titular]',
  });

  return { documento, faltantes };
}

/** Acta de firmeza de la multa general (art. 223A): liquida con multas.ts vía la plantilla real. */
function proyectoActaFirmeza(entrada: EntradaSkill): Artefacto {
  const faltantes: string[] = [];
  const campo = lector(entrada.texto, faltantes);
  const { despacho } = entrada;
  const tipoMulta = leerTipoMulta(campo('Tipo de multa'));
  if (!tipoMulta) {
    faltantes.push('Tipo de multa (1 a 4) — sin él no se puede liquidar');
    return { documento: null, faltantes };
  }

  const causalTexto = campo('Causal de incremento').toLowerCase();
  const causal: CausalIncremento = /dentro del a/.test(causalTexto)
    ? 'reiteracion_dentro_del_anio'
    : /despu[eé]s del a/.test(causalTexto)
      ? 'reiteracion_despues_del_anio'
      : /bdme|moroso/.test(causalTexto)
        ? 'moroso_bdme'
        : 'ninguna';

  const acta = generarActaFirmeza({
    municipio: despacho.municipio,
    inspeccion: despacho.inspeccion,
    inspectorNombre: despacho.inspectorNombre,
    inspectorCargo: despacho.inspectorCargo,
    proceso: campo('Nro. de queja'),
    fechaResolucion: hoyISO(entrada),
    comparendo: campo('Nro. de comparendo'),
    fechaComparendo: campo('Fecha del comparendo'),
    articuloNumeral: campo('Artículo y numeral'),
    lugar: campo('Lugar de los hechos'),
    solicitado: campo('Querellado'),
    cedula: campo('Cédula del querellado'),
    direccion: '[FALTA: dirección del presunto infractor]',
    telefono: 'NO APORTA',
    solicitante: campo('Querellante'),
    hechos: campo('Hechos'),
    tipoMulta,
    causal,
  });

  return { documento: actaFirmezaComoDocumento(acta), faltantes };
}

// ─── Registro ───────────────────────────────────────────────────────────────

export const SKILLS: readonly Skill[] = [
  {
    clave: '/radicar',
    nombre: 'Radicar un asunto',
    descripcion: 'Determina si es queja, querella o apelación y reúne los datos mínimos.',
    icono: Inbox,
    campos: [
      { etiqueta: 'Qué ocurrió', ayuda: 'el relato tal como lo trae el ciudadano' },
      { etiqueta: 'Fecha de los hechos', ayuda: 'AAAA-MM-DD' },
      { etiqueta: 'Quién solicita', ayuda: 'nombre e identificación' },
      { etiqueta: 'Contra quién', ayuda: 'nombre e identificación, o lo que se sepa' },
      { etiqueta: 'Dirección o lugar de los hechos' },
      { etiqueta: 'Pruebas que aporta' },
      { etiqueta: 'Documento que se recurre', ayuda: 'solo si viene a apelar: número y fecha' },
    ],
    construirPrompt: (e) =>
      construir(
        [
          'Tarea: recibir un asunto en ventanilla y determinar por cuál vía se radica: queja (mediación o conciliación, arts. 231 a 233), querella (proceso verbal abreviado, art. 223) o apelación de una decisión ya proferida (art. 223 núm. 4).',
          'Responde en este orden, que es el del trámite: 1) qué tipo de asunto es y por qué, citando el artículo que lo sustenta; si los hechos no alcanzan para decidirlo, dilo y pregunta exactamente lo que falta; 2) proceso y fecha — hechos, fecha y lugar, y si el término para recurrir sigue corriendo cuando se trate de apelación; 3) partes, con la identificación que se necesita de cada una; 4) pruebas que aporta y las que convendría pedir desde ya; 5) orientación: qué sigue en el despacho y en qué término.',
          'Cierra con la lista de los datos que el ciudadano no aportó y sin los cuales la radicación queda incompleta.',
          'No radicas nada: preparas la radicación. No afirmes que el asunto quedó registrado ni le asignes un número de radicado.',
        ],
        e,
      ),
  },
  {
    clave: '/fallo-querella',
    nombre: 'Proyectar fallo de querella',
    descripcion: 'Proceso verbal abreviado: partes, pruebas y sentido de la decisión.',
    icono: Gavel,
    campos: [
      { etiqueta: 'Radicado' },
      { etiqueta: 'Querellante' },
      { etiqueta: 'Querellado' },
      { etiqueta: 'Cédula del querellado' },
      { etiqueta: 'Hechos' },
      { etiqueta: 'Pruebas practicadas' },
      { etiqueta: 'Sentido de la decisión' },
    ],
    construirPrompt: (e) =>
      construir(
        [
          `Tarea: preparar el proyecto de fallo de una querella tramitada por proceso verbal abreviado (${ARTICULOS.procesoVerbalAbreviado}).`,
          'Organiza tu respuesta en este orden, que es el del trámite: 1) identificación del proceso (radicado y fecha); 2) partes — querellante y querellado con su identificación; 3) hechos; 4) pruebas practicadas y su valoración bajo la sana crítica; 5) consideraciones del despacho; 6) parte resolutiva con la decisión, la notificación en estrados y los recursos que proceden (arts. 222 y 223 de la Ley 1801 de 2016).',
          'La valoración probatoria y el sentido de la decisión son del inspector: si no los aportó, no los supongas — señálalos como faltantes y explica qué necesitas para poderlos redactar.',
        ],
        e,
      ),
    generarArtefacto: proyectoFalloQuerella,
  },
  {
    clave: '/fallo-queja',
    nombre: 'Proyectar fallo de queja',
    descripcion: 'Queja por orden de comparendo: audiencia de fallo del verbal abreviado.',
    icono: FileText,
    campos: [
      { etiqueta: 'Nro. de queja' },
      { etiqueta: 'Nro. de comparendo' },
      { etiqueta: 'Fecha del comparendo', ayuda: 'AAAA-MM-DD' },
      { etiqueta: 'Artículo y numeral', ayuda: 'p. ej. Artículo 27 Numeral 1' },
      { etiqueta: 'Lugar de los hechos' },
      { etiqueta: 'Querellante', ayuda: 'procedencia: CAI o unidad que impuso el comparendo' },
      { etiqueta: 'Querellado' },
      { etiqueta: 'Cédula del querellado' },
      { etiqueta: 'Hechos' },
      { etiqueta: 'Pruebas practicadas' },
      { etiqueta: 'Tipo de multa', ayuda: '1 a 4' },
      { etiqueta: 'Sentido de la decisión', ayuda: 'absuelve o sanciona' },
    ],
    construirPrompt: (e) =>
      construir(
        [
          'Tarea: preparar el proyecto de la audiencia de fallo de una queja originada en orden de comparendo (art. 223 núm. 3 de la Ley 1801 de 2016, con los criterios de dosificación del art. 223A lit. a) y del Decreto 768 de 2025).',
          'Organiza tu respuesta en este orden: 1) identificación (queja, comparendo y fecha); 2) partes — procedencia del comparendo y presunto infractor identificado; 3) hechos y comportamiento contrario a la convivencia con su artículo y numeral; 4) descargos y pruebas practicadas; 5) valoración probatoria; 6) parte resolutiva y recursos.',
          'Recuerda que la medida correctiva no es automática: solo procede cuando los mecanismos de protección, restauración, educación o prevención resultan ineficaces (Decreto 768 de 2025, arts. 2.2.8.18.2.1 y 2.2.8.18.2.2). Si el inspector no indicó el sentido de la decisión, no la tomes por él.',
        ],
        e,
      ),
    generarArtefacto: proyectoFalloQueja,
  },
  {
    clave: '/acta-firmeza',
    nombre: 'Acta de firmeza',
    descripcion: 'Multa en firme (art. 223A): liquida el valor y arma el acta.',
    icono: FileCheck2,
    campos: [
      { etiqueta: 'Nro. de queja' },
      { etiqueta: 'Nro. de comparendo' },
      { etiqueta: 'Fecha del comparendo', ayuda: 'AAAA-MM-DD' },
      { etiqueta: 'Artículo y numeral' },
      { etiqueta: 'Lugar de los hechos' },
      { etiqueta: 'Querellante', ayuda: 'procedencia: CAI o unidad que impuso el comparendo' },
      { etiqueta: 'Querellado' },
      { etiqueta: 'Cédula del querellado' },
      { etiqueta: 'Hechos' },
      { etiqueta: 'Tipo de multa', ayuda: '1 a 4' },
      { etiqueta: 'Causal de incremento', ayuda: 'ninguna, dentro del año, después del año o BDME' },
    ],
    construirPrompt: (e) =>
      construir(
        [
          'Tarea: acompañar la expedición del acta que deja constancia de la firmeza de la multa general señalada en una orden de comparendo (art. 223A lit. e) de la Ley 1801 de 2016, adicionado por la Ley 2197 de 2022).',
          'Verifica y expón en este orden: 1) comparendo y fecha; 2) presunto infractor identificado y procedencia; 3) hechos y comportamiento; 4) que no hubo objeción dentro de los tres (3) días hábiles ni ejercicio de los beneficios del art. 180 dentro de los cinco (5); 5) causal de incremento por reiteración o reporte en el BDME, si la hay, con la evidencia que la motiva; 6) valor liquidado y remisión para cobro coactivo.',
          'La liquidación del valor la hace el sistema con la tabla vigente del despacho: no calcules ni cites cifras de multa por tu cuenta.',
        ],
        e,
      ),
    generarArtefacto: proyectoActaFirmeza,
  },
  {
    clave: '/norma',
    nombre: 'Consultar norma',
    descripcion: 'Artículos de la Ley 1801, decretos reglamentarios y jurisprudencia.',
    icono: BookOpen,
    construirPrompt: (e) =>
      construir(
        [
          'Tarea: resolver una consulta normativa del inspector sobre derecho de policía y convivencia.',
          'Responde así: primero la norma aplicable con su artículo y numeral exactos; luego qué exige en la práctica para el trámite que el inspector adelanta; después la jurisprudencia relevante si la hay; y por último las advertencias sobre términos o competencias.',
          'Si no tienes certeza del texto vigente de un artículo o de la existencia de una sentencia, dilo con esas palabras. Una cita aproximada es un error, no una ayuda.',
        ],
        e,
      ),
  },
  {
    clave: '/pruebas',
    nombre: 'Orientar pruebas',
    descripcion: 'Qué recaudar, cómo decretarlo y cómo valorarlo en el expediente.',
    icono: FileSearch,
    construirPrompt: (e) =>
      construir(
        [
          'Tarea: orientar al inspector en la recolección y valoración probatoria de un expediente.',
          'Estructura la respuesta en: 1) qué pruebas obran ya en el expediente según lo que el inspector describe; 2) qué falta recaudar y por qué es conducente, pertinente y útil; 3) cómo decretarlas y practicarlas dentro del trámite y en qué término; 4) cómo valorarlas bajo las reglas de la sana crítica, advirtiendo qué acredita cada medio y qué es una inferencia del agente.',
          'No des por probado nada que el inspector no haya descrito, y no atribuyas contenido a una prueba que no has visto.',
        ],
        e,
      ),
  },
  {
    clave: '/resumir',
    nombre: 'Resumir expediente',
    descripcion: 'Síntesis del expediente o de un documento adjunto, con lo que falta.',
    icono: Scale,
    construirPrompt: (e) =>
      construir(
        [
          'Tarea: resumir un expediente o un documento adjunto para que el inspector recupere el estado del asunto en un minuto.',
          'Entrega: 1) identificación del proceso y fecha; 2) partes; 3) hechos en máximo cinco líneas; 4) actuaciones surtidas en orden cronológico; 5) pruebas que obran; 6) estado actual y próxima actuación con su término; 7) datos que faltan en el expediente.',
          'El resumen no interpreta ni decide: no anticipes el sentido del fallo.',
        ],
        e,
      ),
  },
];

/** Las cuatro que se ofrecen como sugerencia en el estado vacío del chat. */
export const SKILLS_SUGERIDAS: readonly ClaveSkill[] = [
  '/radicar',
  '/fallo-querella',
  '/acta-firmeza',
  '/norma',
];

export function buscarSkill(clave: string): Skill | undefined {
  return SKILLS.find((s) => s.clave === clave);
}

/** Skills cuyo nombre, clave o descripción coinciden con lo escrito tras la barra. */
export function filtrarSkills(filtro: string): Skill[] {
  const q = normalizarEtiqueta(filtro);
  if (!q) return [...SKILLS];
  return SKILLS.filter((s) => normalizarEtiqueta(`${s.clave} ${s.nombre} ${s.descripcion}`).includes(q));
}
