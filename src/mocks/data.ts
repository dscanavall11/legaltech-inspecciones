import dayjs from 'dayjs';
import type {
  Actuacion,
  Querella,
  QuerellaDetalle,
  QuerellaMetadata,
} from '@/features/querellas/types';
import type {
  ActuacionQueja,
  Queja,
  QuejaDetalle,
  QuejaMetadata,
} from '@/features/quejas/types';
import type { LegalCase } from '@/shared/legalCases/types';
import { buildCaseMetadata } from '@/shared/legalCases/types';
import type { ComparendoMetadata } from '@/features/comparendos/types';

// Fechas relativas a hoy para que los términos se vean realistas en la demo.
const hoy = dayjs();

export const querellasMock: Querella[] = [
  {
    id: 'q-001',
    radicado: '2026-00145',
    querellante: 'María Fernanda Gómez',
    querellado: 'Carlos Andrés Ruiz',
    asunto: 'Perturbación a la posesión de inmueble',
    estado: 'en_tramite',
    fechaRadicacion: hoy.subtract(12, 'day').format('YYYY-MM-DD'),
    diasTermino: 15,
  },
  {
    id: 'q-002',
    radicado: '2026-00138',
    querellante: 'Conjunto Residencial El Roble',
    querellado: 'Pedro Pablo Martínez',
    asunto: 'Contaminación auditiva en zona común',
    estado: 'audiencia_programada',
    fechaRadicacion: hoy.subtract(8, 'day').format('YYYY-MM-DD'),
    diasTermino: 20,
  },
  {
    id: 'q-003',
    radicado: '2026-00121',
    querellante: 'Luz Marina Ospina',
    querellado: 'Inversiones La Estrella S.A.S.',
    asunto: 'Restitución de bien de uso público',
    estado: 'radicada',
    fechaRadicacion: hoy.subtract(2, 'day').format('YYYY-MM-DD'),
    diasTermino: 10,
  },
  {
    id: 'q-004',
    radicado: '2026-00099',
    querellante: 'Junta de Acción Comunal Barrio Centro',
    querellado: 'Comercial Don Jorge',
    asunto: 'Ocupación indebida del espacio público',
    estado: 'fallo_emitido',
    fechaRadicacion: hoy.subtract(25, 'day').format('YYYY-MM-DD'),
    diasTermino: 30,
  },
  {
    id: 'q-005',
    radicado: '2026-00087',
    querellante: 'Ana Lucía Bernal',
    querellado: 'Construcciones Bernal Hnos.',
    asunto: 'Perturbación por obra sin licencia',
    estado: 'en_firmeza',
    fechaRadicacion: hoy.subtract(40, 'day').format('YYYY-MM-DD'),
    diasTermino: 30,
  },
  {
    id: 'q-006',
    radicado: '2026-00150',
    querellante: 'Jorge Eliécer Mora',
    querellado: 'Distribuidora El Progreso',
    asunto: 'Tenencia irregular de mercancía en andén',
    estado: 'en_tramite',
    fechaRadicacion: hoy.subtract(13, 'day').format('YYYY-MM-DD'),
    diasTermino: 15,
  },
  {
    id: 'q-007',
    radicado: '2026-00161',
    querellante: 'Comunidad Edificio Los Almendros',
    querellado: 'Bar y Billares El Turpial',
    asunto: 'Perturbación por ruido de establecimiento comercial',
    estado: 'en_tramite',
    fechaRadicacion: hoy.subtract(3, 'day').format('YYYY-MM-DD'),
    diasTermino: 15,
  },
  {
    id: 'q-008',
    radicado: '2026-00163',
    querellante: 'Fabián Alberto Cárdenas',
    querellado: 'Talleres Cárdenas e Hijos',
    asunto: 'Invasión de andén con vehículos en reparación',
    estado: 'radicada',
    fechaRadicacion: hoy.subtract(1, 'day').format('YYYY-MM-DD'),
    diasTermino: 10,
  },
];

/**
 * Genera un historial de actuaciones coherente con el estado del caso.
 * Cada estado "desbloquea" las actuaciones previas del trámite.
 */
function actuacionesPara(q: Querella): Actuacion[] {
  const base = dayjs(q.fechaRadicacion);
  const orden: Querella['estado'][] = [
    'radicada',
    'en_tramite',
    'audiencia_programada',
    'fallo_emitido',
    'en_firmeza',
  ];
  const nivel = orden.indexOf(q.estado);

  const todas: { hasta: number; act: Actuacion }[] = [
    {
      hasta: 0,
      act: {
        id: `${q.id}-a1`,
        fecha: base.format('YYYY-MM-DD'),
        tipo: 'radicacion',
        titulo: 'Radicación de la querella',
        descripcion: `Se recibe querella de ${q.querellante} contra ${q.querellado}.`,
      },
    },
    {
      hasta: 1,
      act: {
        id: `${q.id}-a2`,
        fecha: base.add(2, 'day').format('YYYY-MM-DD'),
        tipo: 'auto',
        titulo: 'Auto avoca conocimiento',
        descripcion: 'El despacho avoca conocimiento e impulsa el trámite.',
      },
    },
    {
      hasta: 2,
      act: {
        id: `${q.id}-a3`,
        fecha: base.add(5, 'day').format('YYYY-MM-DD'),
        tipo: 'notificacion',
        titulo: 'Notificación a las partes',
        descripcion: 'Se cita a audiencia pública de trámite.',
      },
    },
    {
      hasta: 2,
      act: {
        id: `${q.id}-a4`,
        fecha: base.add(8, 'day').format('YYYY-MM-DD'),
        tipo: 'audiencia',
        titulo: 'Audiencia pública programada',
      },
    },
    {
      hasta: 3,
      act: {
        id: `${q.id}-a5`,
        fecha: base.add(12, 'day').format('YYYY-MM-DD'),
        tipo: 'fallo',
        titulo: 'Fallo emitido',
        descripcion: 'El despacho profiere decisión de fondo.',
      },
    },
    {
      hasta: 4,
      act: {
        id: `${q.id}-a6`,
        fecha: base.add(20, 'day').format('YYYY-MM-DD'),
        tipo: 'firmeza',
        titulo: 'Acta de firmeza / ejecutoria',
        descripcion: 'La decisión queda en firme al no presentarse recursos.',
      },
    },
  ];

  return todas
    .filter((t) => t.hasta <= nivel)
    .map((t) => t.act)
    .reverse(); // más reciente primero
}

export const querellasDetalleMock: Record<string, QuerellaDetalle> =
  Object.fromEntries(
    querellasMock.map((q) => [
      q.id,
      {
        ...q,
        direccionInmueble: 'Calle 45 # 12-30, Barrio Centro',
        actuaciones: actuacionesPara(q),
      },
    ]),
  );

export interface AudienciaMock {
  id: string;
  querellaId: string;
  radicado: string;
  fecha: string; // ISO datetime
  asunto: string;
  querellante: string;
  querellado: string;
}

// Agenda de audiencias próximas (fechas futuras relativas a hoy).
export const audienciasMock: AudienciaMock[] = [
  {
    id: 'aud-001',
    querellaId: 'q-002',
    radicado: '2026-00138',
    fecha: hoy.add(1, 'day').hour(9).minute(0).format('YYYY-MM-DDTHH:mm'),
    asunto: 'Contaminación auditiva en zona común',
    querellante: 'Conjunto Residencial El Roble',
    querellado: 'Pedro Pablo Martínez',
  },
  {
    id: 'aud-002',
    querellaId: 'q-001',
    radicado: '2026-00145',
    fecha: hoy.add(2, 'day').hour(14).minute(30).format('YYYY-MM-DDTHH:mm'),
    asunto: 'Perturbación a la posesión de inmueble',
    querellante: 'María Fernanda Gómez',
    querellado: 'Carlos Andrés Ruiz',
  },
  {
    id: 'aud-003',
    querellaId: 'q-006',
    radicado: '2026-00150',
    fecha: hoy.add(4, 'day').hour(10).minute(0).format('YYYY-MM-DDTHH:mm'),
    asunto: 'Tenencia irregular de mercancía en andén',
    querellante: 'Jorge Eliécer Mora',
    querellado: 'Distribuidora El Progreso',
  },
  {
    id: 'aud-004',
    querellaId: 'q-003',
    radicado: '2026-00121',
    fecha: hoy.add(8, 'day').hour(8).minute(30).format('YYYY-MM-DDTHH:mm'),
    asunto: 'Restitución de bien de uso público',
    querellante: 'Luz Marina Ospina',
    querellado: 'Inversiones La Estrella S.A.S.',
  },
];

// ────────────────────────────────────────────────
// Quejas
// ────────────────────────────────────────────────

export const quejasMock: Queja[] = [
  {
    id: 'qj-001',
    radicado: '2026-QJ-041',
    quejoso: 'Liliana Pérez Ávila',
    acusado: 'Rodrigo Suárez Montoya',
    asunto: 'Ruido excesivo en horas nocturnas',
    categoria: 'ruido',
    estado: 'conciliacion_programada',
    fechaRadicacion: hoy.subtract(5, 'day').format('YYYY-MM-DD'),
    diasTermino: 10,
  },
  {
    id: 'qj-002',
    radicado: '2026-QJ-038',
    quejoso: 'Consorcio Torres del Norte',
    acusado: 'Yeny Carolina Díaz',
    asunto: 'Tenencia irresponsable de caninos sin correa en zonas comunes',
    categoria: 'mascotas',
    estado: 'conciliada',
    fechaRadicacion: hoy.subtract(15, 'day').format('YYYY-MM-DD'),
    diasTermino: 10,
  },
  {
    id: 'qj-003',
    radicado: '2026-QJ-035',
    quejoso: 'Jairo Enrique Castro',
    acusado: 'Constructora Urigo S.A.S.',
    asunto: 'Disposición de escombros en vía pública',
    categoria: 'construccion',
    estado: 'sin_acuerdo',
    fechaRadicacion: hoy.subtract(20, 'day').format('YYYY-MM-DD'),
    diasTermino: 10,
  },
  {
    id: 'qj-004',
    radicado: '2026-QJ-029',
    quejoso: 'Sofía Hernández Arango',
    acusado: 'Vendedor ambulante no identificado',
    asunto: 'Ocupación permanente del andén frente a vivienda',
    categoria: 'espacio_publico',
    estado: 'radicada',
    fechaRadicacion: hoy.subtract(1, 'day').format('YYYY-MM-DD'),
    diasTermino: 10,
  },
  {
    id: 'qj-005',
    radicado: '2026-QJ-018',
    quejoso: 'Administración P.H. El Nogal',
    acusado: 'Gustavo Adolfo Ríos',
    asunto: 'Inadecuado manejo de residuos sólidos en área común',
    categoria: 'basuras',
    estado: 'archivada',
    fechaRadicacion: hoy.subtract(35, 'day').format('YYYY-MM-DD'),
    diasTermino: 10,
  },
];

function actuacionesParaQueja(q: Queja): ActuacionQueja[] {
  const base = dayjs(q.fechaRadicacion);

  const nivelMap: Record<Queja['estado'], number> = {
    radicada: 0,
    en_tramite: 1,
    conciliacion_programada: 2,
    conciliada: 3,
    sin_acuerdo: 3,
    archivada: 4,
  };
  const nivel = nivelMap[q.estado];

  const todas: { hasta: number; act: ActuacionQueja }[] = [
    {
      hasta: 0,
      act: {
        id: `${q.id}-a1`,
        fecha: base.format('YYYY-MM-DD'),
        tipo: 'radicacion',
        titulo: 'Radicación de la queja',
        descripcion: `Se recibe queja presentada por ${q.quejoso} contra ${q.acusado}.`,
      },
    },
    {
      hasta: 1,
      act: {
        id: `${q.id}-a2`,
        fecha: base.add(1, 'day').format('YYYY-MM-DD'),
        tipo: 'avoca',
        titulo: 'Auto avoca conocimiento',
        descripcion: 'El despacho avoca conocimiento e impulsa el trámite de conciliación.',
      },
    },
    {
      hasta: 2,
      act: {
        id: `${q.id}-a3`,
        fecha: base.add(3, 'day').format('YYYY-MM-DD'),
        tipo: 'citacion',
        titulo: 'Citación a conciliación',
        descripcion: 'Se notifica a las partes la fecha de la audiencia de conciliación.',
      },
    },
    {
      hasta: 3,
      act: {
        id: `${q.id}-a4`,
        fecha: base.add(7, 'day').format('YYYY-MM-DD'),
        tipo: q.estado === 'conciliada' ? 'acuerdo' : 'sin_acuerdo',
        titulo:
          q.estado === 'conciliada'
            ? 'Acuerdo de conciliación'
            : 'Conciliación sin acuerdo',
        descripcion:
          q.estado === 'conciliada'
            ? 'Las partes alcanzaron un acuerdo. Se suscribe acta de conciliación.'
            : 'Las partes no llegaron a acuerdo. Se evalúan acciones a seguir.',
      },
    },
    {
      hasta: 4,
      act: {
        id: `${q.id}-a5`,
        fecha: base.add(10, 'day').format('YYYY-MM-DD'),
        tipo: 'archivo',
        titulo: 'Archivo del expediente',
        descripcion: 'Expediente archivado por culminación del trámite.',
      },
    },
  ];

  return todas
    .filter((t) => t.hasta <= nivel)
    .map((t) => t.act)
    .reverse();
}

export const quejasDetalleMock: Record<string, QuejaDetalle> =
  Object.fromEntries(
    quejasMock.map((q) => [
      q.id,
      {
        ...q,
        descripcionHechos:
          `${q.quejoso} manifiesta que el señor(a) ${q.acusado} incurre reiteradamente en el comportamiento descrito, afectando la convivencia pacífica del sector. Los hechos se vienen presentando desde hace aproximadamente dos semanas.`,
        actuaciones: actuacionesParaQueja(q),
      },
    ]),
  );

// ────────────────────────────────────────────────
// Querellas y quejas — espejo como recurso genérico /legal-cases
// (caseType="querella"/"queja"), derivado 1:1 de querellasDetalleMock y
// quejasDetalleMock de arriba (misma fuente, sin duplicar datos de negocio).
// Sin esto, los handlers genéricos de /legal-cases (find-by-criteria, :id,
// PATCH state/fields — ver handlers.ts) devuelven listas vacías o 404 para
// cualquier caseType distinto de "comparendo", porque solo conocían
// comparendosLegalCaseMock.
// ────────────────────────────────────────────────

function construirQuerellaLegalCase(q: QuerellaDetalle): LegalCase {
  const creado = dayjs(q.fechaRadicacion).toISOString();
  return {
    id: q.id,
    createdAt: creado,
    filingNumber: q.radicado,
    judicialOfficeId: '',
    caseType: 'querella',
    rulingDate: null,
    venueCity: 'Manizales',
    evidenceAssessment: null,
    legalReasoning: null,
    currentStateCode: q.estado,
    caseMetadata: buildCaseMetadata({
      asunto: q.asunto,
      direccionInmueble: q.direccionInmueble,
      diasTermino: q.diasTermino,
    } satisfies QuerellaMetadata),
    background: { allegedFacts: q.asunto ?? null, reliefSought: null, defensesAndObjections: null },
    ruling: null,
    parties: [
      { partyRole: 'querellante', identificationType: 'N/A', identificationNumber: '', fullName: q.querellante },
      { partyRole: 'querellado', identificationType: 'N/A', identificationNumber: '', fullName: q.querellado },
    ],
    stateHistory: [
      { stateCode: q.estado, stateName: null, changedAt: creado, reason: 'Radicación de la querella' },
    ],
  };
}

export const querellasLegalCaseMock: LegalCase[] = querellasMock.map((q) =>
  construirQuerellaLegalCase(querellasDetalleMock[q.id]),
);

function construirQuejaLegalCase(q: QuejaDetalle): LegalCase {
  const creado = dayjs(q.fechaRadicacion).toISOString();
  return {
    id: q.id,
    createdAt: creado,
    filingNumber: q.radicado,
    judicialOfficeId: '',
    caseType: 'queja',
    rulingDate: null,
    venueCity: 'Manizales',
    evidenceAssessment: null,
    legalReasoning: null,
    currentStateCode: q.estado,
    caseMetadata: buildCaseMetadata({
      asunto: q.asunto,
      categoria: q.categoria,
      diasTermino: q.diasTermino,
    } satisfies QuejaMetadata),
    background: { allegedFacts: q.descripcionHechos ?? null, reliefSought: null, defensesAndObjections: null },
    ruling: null,
    parties: [
      { partyRole: 'quejoso', identificationType: 'N/A', identificationNumber: '', fullName: q.quejoso },
      { partyRole: 'acusado', identificationType: 'N/A', identificationNumber: '', fullName: q.acusado },
    ],
    stateHistory: [
      { stateCode: q.estado, stateName: null, changedAt: creado, reason: 'Radicación de la queja' },
    ],
  };
}

export const quejasLegalCaseMock: LegalCase[] = quejasMock.map((q) =>
  construirQuejaLegalCase(quejasDetalleMock[q.id]),
);

// ────────────────────────────────────────────────
// Comparendos — usa el recurso genérico /legal-cases (caseType="comparendo"),
// a diferencia de querellas/quejas arriba (que mockean el endpoint legacy
// /querellas y /quejas). Ver src/mocks/handlers.ts para los handlers
// genéricos de /legal-cases/find-by-criteria, /legal-cases/:id, etc.
// ────────────────────────────────────────────────

interface SemillaComparendo {
  id: string;
  filingNumber: string;
  estados: Array<{ estado: string; dias: number; motivo: string }>;
  meta: ComparendoMetadata;
}

const SEMILLAS_COMPARENDO: SemillaComparendo[] = [
  {
    id: 'cp-001',
    filingNumber: '2026-CP-0001',
    estados: [{ estado: 'recibido', dias: 1, motivo: 'Recepción de la orden de comparendo' }],
    meta: {
      numeroComparendo: '17-001-085044',
      articuloNumeral: 'Artículo 92 Numeral 16',
      lugar: 'CALLE 17 CARRERA 17 41',
      fechaComparendo: hoy.subtract(3, 'day').format('YYYY-MM-DD'),
      tipoMulta: 4,
      causal: 'ninguna',
      cedula: '1002500001',
      telefono: '3170000001',
      direccion: 'CARRERA 17 CALLE 19 28',
      solicitante: 'CAI CHIPRE',
      hechos: 'Verificación de establecimiento de comercio sin Cámara de Comercio vigente.',
    },
  },
  {
    id: 'cp-002',
    filingNumber: '2026-CP-0002',
    estados: [
      { estado: 'recibido', dias: 10, motivo: 'Recepción de la orden de comparendo' },
      { estado: 'verificado', dias: 9, motivo: 'Checklist de verificación humana superado' },
      { estado: 'en_espera_objecion', dias: 8, motivo: 'Término de objeción abierto' },
    ],
    meta: {
      numeroComparendo: '17-001-6-2026-1398',
      articuloNumeral: 'Artículo 140 Numeral 14',
      lugar: 'CALLE 49 CRA 6',
      fechaComparendo: hoy.subtract(10, 'day').format('YYYY-MM-DD'),
      tipoMulta: 4,
      causal: 'reiteracion_dentro_del_anio',
      cedula: '1060600002',
      telefono: '',
      direccion: 'CRA 4B No. 48-04',
      solicitante: 'CAI SAN SEBASTIAN',
      hechos: 'Consumo de sustancias psicoactivas en perímetro de templo religioso.',
    },
  },
  {
    id: 'cp-003',
    filingNumber: '2026-CP-0003',
    estados: [
      { estado: 'recibido', dias: 18, motivo: 'Recepción de la orden de comparendo' },
      { estado: 'verificado', dias: 17, motivo: 'Checklist de verificación humana superado' },
      { estado: 'en_espera_objecion', dias: 16, motivo: 'Término de objeción abierto' },
      { estado: 'objetado', dias: 13, motivo: 'Impugnación registrada dentro del término' },
      {
        estado: 'audiencia_programada',
        dias: 11,
        motivo: 'Auto avoca conocimiento y fija audiencia pública',
      },
    ],
    meta: {
      numeroComparendo: '17-001-6-2026-63',
      articuloNumeral: 'Artículo 27 Numeral 6',
      lugar: 'CRA 32 CALLE 27',
      fechaComparendo: hoy.subtract(18, 'day').format('YYYY-MM-DD'),
      tipoMulta: 2,
      causal: 'ninguna',
      cedula: '1053800003',
      telefono: '3180000003',
      direccion: 'CRA 32 CALLE 27',
      solicitante: 'CAI EL NEVADO',
      hechos: 'Porte de arma cortopunzante sin justificación.',
      fechaAudiencia: hoy.add(2, 'day').format('YYYY-MM-DD'),
      horaAudiencia: '09:00',
      lugarAudiencia: 'Despacho de la Inspección',
    },
  },
  {
    id: 'cp-004',
    filingNumber: '2026-CP-0004',
    estados: [
      { estado: 'recibido', dias: 25, motivo: 'Recepción de la orden de comparendo' },
      { estado: 'verificado', dias: 24, motivo: 'Checklist de verificación humana superado' },
      { estado: 'en_espera_objecion', dias: 23, motivo: 'Término de objeción abierto' },
      { estado: 'objetado', dias: 20, motivo: 'Impugnación registrada dentro del término' },
      { estado: 'audiencia_programada', dias: 18, motivo: 'Auto avoca conocimiento y fija audiencia pública' },
      { estado: 'en_audiencia', dias: 5, motivo: 'Audiencia pública instalada' },
    ],
    meta: {
      numeroComparendo: '17-001-6-2026-287',
      articuloNumeral: 'Artículo 140 Numeral 13',
      lugar: 'CRA 24 CALLE 38',
      fechaComparendo: hoy.subtract(25, 'day').format('YYYY-MM-DD'),
      tipoMulta: 4,
      causal: 'ninguna',
      cedula: '1053700004',
      telefono: '3150000004',
      direccion: 'CRA 24 CALLE 38',
      solicitante: 'CAI CENTRO',
      hechos: 'Consumo de sustancias psicoactivas en espacio público.',
      fechaAudiencia: hoy.subtract(5, 'day').format('YYYY-MM-DD'),
      horaAudiencia: '10:30',
      lugarAudiencia: 'Despacho de la Inspección',
    },
  },
  {
    id: 'cp-005',
    filingNumber: '2026-CP-0005',
    estados: [
      { estado: 'recibido', dias: 40, motivo: 'Recepción de la orden de comparendo' },
      { estado: 'verificado', dias: 39, motivo: 'Checklist de verificación humana superado' },
      { estado: 'en_espera_objecion', dias: 38, motivo: 'Término de objeción abierto' },
      { estado: 'objetado', dias: 35, motivo: 'Impugnación registrada dentro del término' },
      { estado: 'audiencia_programada', dias: 33, motivo: 'Auto avoca conocimiento y fija audiencia pública' },
      { estado: 'en_audiencia', dias: 20, motivo: 'Audiencia pública instalada' },
      { estado: 'fallo_emitido', dias: 20, motivo: 'Fallo proferido en audiencia — sanciona' },
      { estado: 'en_firmeza', dias: 5, motivo: 'Constancia de firmeza — no se interpusieron recursos' },
    ],
    meta: {
      numeroComparendo: '17-001-6-2026-410',
      articuloNumeral: 'Artículo 33 Numeral 1',
      lugar: 'CALLE 65 CRA 23',
      fechaComparendo: hoy.subtract(40, 'day').format('YYYY-MM-DD'),
      tipoMulta: 3,
      causal: 'ninguna',
      cedula: '1053900005',
      telefono: '3160000005',
      direccion: 'CALLE 65 CRA 23 11',
      solicitante: 'CAI PALOGRANDE',
      hechos: 'Ruido excesivo en vivienda pese a requerimiento previo.',
      sentido: 'sanciona',
      variante: 'Multa general tipo 3.',
    },
  },
  {
    id: 'cp-006',
    filingNumber: '2026-CP-0006',
    estados: [
      { estado: 'recibido', dias: 55, motivo: 'Recepción de la orden de comparendo' },
      { estado: 'verificado', dias: 54, motivo: 'Checklist de verificación humana superado' },
      { estado: 'en_espera_objecion', dias: 53, motivo: 'Término de objeción abierto' },
      { estado: 'sin_objecion', dias: 46, motivo: 'Constancia de no objeción — vencidos los términos' },
      { estado: 'en_firmeza', dias: 46, motivo: 'Acta de firmeza generada (lit. e, art. 223A)' },
      { estado: 'archivado', dias: 45, motivo: 'Expediente archivado' },
    ],
    meta: {
      numeroComparendo: '17-001-6-2026-455',
      articuloNumeral: 'Artículo 35 Numeral 1',
      lugar: 'PARQUE PRINCIPAL LA ENEA',
      fechaComparendo: hoy.subtract(55, 'day').format('YYYY-MM-DD'),
      tipoMulta: 2,
      causal: 'ninguna',
      cedula: '1054000006',
      telefono: '',
      direccion: 'BARRIO LA ENEA MZ 4 CASA 7',
      solicitante: 'CAI LA ENEA',
      hechos: 'Irrespeto verbal reiterado a la autoridad de policía.',
    },
  },
];

const NOMBRE_INFRACTOR: Record<string, string> = {
  'cp-001': 'PEDRO ANTONIO SALAZAR RÍOS',
  'cp-002': 'CAMILO ANDRÉS OSORIO DUQUE',
  'cp-003': 'LAURA MARCELA HENAO PATIÑO',
  'cp-004': 'JOSÉ MIGUEL GALLEGO TORO',
  'cp-005': 'DIANA CAROLINA MEJÍA LÓPEZ',
  'cp-006': 'ANDRÉS FELIPE QUINTERO MARÍN',
};

function construirComparendoLegalCase(s: SemillaComparendo): LegalCase {
  const ultimo = s.estados[s.estados.length - 1];
  return {
    id: s.id,
    createdAt: hoy.subtract(s.estados[0].dias, 'day').toISOString(),
    filingNumber: s.filingNumber,
    judicialOfficeId: '',
    caseType: 'comparendo',
    rulingDate: null,
    venueCity: 'Manizales',
    evidenceAssessment: null,
    legalReasoning: null,
    currentStateCode: ultimo.estado,
    caseMetadata: buildCaseMetadata(s.meta as unknown as Record<string, unknown>),
    background: {
      allegedFacts: s.meta.hechos ?? null,
      reliefSought: null,
      defensesAndObjections: null,
    },
    ruling: null,
    parties: [
      {
        partyRole: 'infractor',
        identificationType: 'CC',
        identificationNumber: s.meta.cedula ?? '',
        fullName: NOMBRE_INFRACTOR[s.id] ?? 'Sin identificar',
      },
      {
        partyRole: 'autoridad',
        identificationType: 'N/A',
        identificationNumber: '',
        fullName: s.meta.solicitante ?? '',
      },
    ],
    stateHistory: s.estados.map((e) => ({
      stateCode: e.estado,
      stateName: null,
      changedAt: hoy.subtract(e.dias, 'day').toISOString(),
      reason: e.motivo,
    })),
  };
}

export const comparendosLegalCaseMock: LegalCase[] = SEMILLAS_COMPARENDO.map(construirComparendoLegalCase);

// Respuesta simulada del asistente para la demo sin backend.
export const RESPUESTA_IA_DEMO =
  'Con gusto te ayudo. En este despacho los términos se cuentan en días ' +
  'hábiles, excluyendo sábados, domingos y festivos nacionales.\n\n' +
  'Cuando el backend de Spring AI esté conectado, esta respuesta vendrá del ' +
  'modelo real con el contexto del caso (memorias vectoriales sobre el ' +
  'expediente). Por ahora estás viendo una respuesta de demostración.\n\n' +
  '¿Quieres que prepare un borrador de algún documento?';
