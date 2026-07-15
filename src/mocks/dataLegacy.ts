import type { LegalCase, LegalCaseDetail } from '@/features/casos/types';
import type { LegalBasis, LegalBasisDetail } from '@/features/normas/types';

/**
 * Datos mock de los microservicios migrados del frontend Angular
 * (legalcase, legalbases, análisis con IA).
 */

export const legalCasesMock: LegalCase[] = [
  {
    id: 'lc-001',
    filingNumber: '11001-40-03-015-2025-00321-00',
    judicialOfficeId: 'Juzgado 15 Civil Municipal de Bogotá',
    caseType: 'Responsabilidad civil contractual',
    rulingDate: '2026-05-12',
  },
  {
    id: 'lc-002',
    filingNumber: '05001-31-03-002-2025-00187-00',
    judicialOfficeId: 'Juzgado 2 Civil del Circuito de Medellín',
    caseType: 'Restitución de inmueble arrendado',
    rulingDate: '2026-04-28',
  },
  {
    id: 'lc-003',
    filingNumber: '76001-40-03-008-2024-00954-00',
    judicialOfficeId: 'Juzgado 8 Civil Municipal de Cali',
    caseType: 'Proceso ejecutivo singular',
    rulingDate: '2026-03-17',
  },
];

export const legalCaseDetailMock: Record<string, LegalCaseDetail> = {
  '11001-40-03-015-2025-00321-00': {
    ...legalCasesMock[0],
    venueCity: 'Bogotá D.C.',
    evidenceAssessment:
      'Las pruebas documentales aportadas acreditan el incumplimiento contractual alegado; el dictamen pericial no fue controvertido.',
    legalReasoning:
      'Conforme a los artículos 1602 y 1613 del Código Civil, verificado el incumplimiento y el daño, procede la indemnización de perjuicios reclamada.',
    background: {
      allegedFacts:
        'El demandante celebró contrato de obra con el demandado, quien abandonó la ejecución al 60% de avance pese a haber recibido el anticipo pactado.',
      reliefSought:
        'Que se declare el incumplimiento del contrato y se condene al pago de perjuicios materiales y morales.',
      defensesAndObjections:
        'El demandado propuso la excepción de contrato no cumplido, alegando mora del demandante en los pagos parciales.',
    },
    ruling: {
      dispositiveDecision: 'CONDENA',
      orderedInjunctions:
        'Se ordena al demandado pagar la indemnización dentro de los diez días siguientes a la ejecutoria de la sentencia.',
      monetaryAwards: 48500000,
      legalCosts: 3200000,
      attorneyFeesAward: 4850000,
    },
    parties: [
      {
        partyRole: 'PLAINTIFF',
        identificationType: 'CC',
        identificationNumber: '79.456.123',
        fullName: 'Carlos Andrés Rojas Peña',
      },
      {
        partyRole: 'DEFENDANT',
        identificationType: 'NIT',
        identificationNumber: '900.874.512-3',
        fullName: 'Construcciones El Roble S.A.S.',
      },
    ],
  },
  '05001-31-03-002-2025-00187-00': {
    ...legalCasesMock[1],
    venueCity: 'Medellín',
    evidenceAssessment:
      'El contrato de arrendamiento y los recibos aportados demuestran la mora superior a dos cánones consecutivos.',
    legalReasoning:
      'Acreditada la causal de mora prevista en el artículo 384 del CGP, procede la restitución del inmueble.',
    background: {
      allegedFacts:
        'La arrendataria dejó de pagar los cánones de enero y febrero de 2025 pese a los requerimientos del arrendador.',
      reliefSought: 'La restitución del inmueble y el pago de los cánones adeudados.',
      defensesAndObjections: 'La demandada alegó pago parcial no acreditado documentalmente.',
    },
    ruling: {
      dispositiveDecision: 'RESTITUCIÓN',
      orderedInjunctions: 'Se ordena la entrega del inmueble dentro de los treinta días siguientes.',
      monetaryAwards: 5600000,
      legalCosts: 850000,
      attorneyFeesAward: 1200000,
    },
    parties: [
      {
        partyRole: 'PLAINTIFF',
        identificationType: 'CC',
        identificationNumber: '43.210.987',
        fullName: 'María Eugenia Álvarez Cano',
      },
      {
        partyRole: 'DEFENDANT',
        identificationType: 'CC',
        identificationNumber: '1.017.234.567',
        fullName: 'Lina Marcela Ortiz Ruiz',
      },
    ],
  },
  '76001-40-03-008-2024-00954-00': {
    ...legalCasesMock[2],
    venueCity: 'Cali',
    evidenceAssessment: 'El título valor aportado cumple los requisitos formales del artículo 621 del Código de Comercio.',
    legalReasoning: 'El pagaré presta mérito ejecutivo y la excepción de prescripción no prospera por interrupción oportuna.',
    background: {
      allegedFacts: 'El demandado suscribió pagaré por $32.000.000 y no pagó a su vencimiento.',
      reliefSought: 'El pago del capital, intereses moratorios y costas del proceso.',
      defensesAndObjections: 'Prescripción de la acción cambiaria.',
    },
    ruling: {
      dispositiveDecision: 'SIGUE ADELANTE LA EJECUCIÓN',
      orderedInjunctions: 'Continúese la ejecución por capital e intereses hasta el pago total.',
      monetaryAwards: 32000000,
      legalCosts: 2100000,
      attorneyFeesAward: 3200000,
    },
    parties: [
      {
        partyRole: 'PLAINTIFF',
        identificationType: 'NIT',
        identificationNumber: '805.123.456-7',
        fullName: 'Inversiones Valle Verde Ltda.',
      },
      {
        partyRole: 'DEFENDANT',
        identificationType: 'CC',
        identificationNumber: '16.789.012',
        fullName: 'Jorge Iván Sarmiento López',
      },
    ],
  },
};

export const nationalNormsMock: LegalBasis[] = [
  {
    id: 1,
    title: 'Ley 1801 de 2016 — Código Nacional de Seguridad y Convivencia Ciudadana',
    type: 'ley',
    publishedAt: '2016-07-29',
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76924',
  },
  {
    id: 2,
    title: 'Ley 2220 de 2022 — Estatuto de Conciliación',
    type: 'ley',
    publishedAt: '2022-06-30',
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=189748',
  },
  {
    id: 3,
    title: 'Decreto 1284 de 2017 — Reglamentación del CNSCC',
    type: 'decreto',
    publishedAt: '2017-07-31',
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=82921',
  },
  {
    id: 4,
    title: 'Ley 1564 de 2012 — Código General del Proceso',
    type: 'ley',
    publishedAt: '2012-07-12',
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=48425',
  },
  {
    id: 5,
    title: 'Sentencia C-282 de 2017 — Control de constitucionalidad CNSCC',
    type: 'jurisprudencia',
    publishedAt: '2017-05-03',
    sourceUrl: 'https://www.corteconstitucional.gov.co/relatoria/2017/C-282-17.htm',
  },
];

export const nationalNormDetailMock: Record<string, LegalBasisDetail> = Object.fromEntries(
  nationalNormsMock.map((n) => [
    String(n.id),
    {
      ...n,
      description:
        `${n.title}.\n\nDescripción de demostración: resumen del contenido, ámbito de aplicación y artículos relevantes para inspecciones de convivencia y paz. Sustituir por la descripción real del microservicio legalbases.`,
    },
  ]),
);

export const ANALISIS_IA_DEMO = `ANÁLISIS CLÍNICO PROCESAL (DEMO)

1. CALIFICACIÓN JURÍDICA PRELIMINAR
Los hechos descritos configuran un presunto comportamiento contrario a la convivencia (art. 27, Ley 1801 de 2016).

2. COMPETENCIA
Corresponde al inspector de policía del lugar de los hechos, en primera instancia, conforme al art. 206 del CNSCC.

3. RUTA PROCESAL SUGERIDA
a) Radicar la querella y verificar requisitos del art. 223.
b) Citar a audiencia pública dentro de los cinco (5) días siguientes.
c) Practicar las pruebas aportadas y decretadas.
d) Proferir decisión motivada en audiencia.

4. TÉRMINOS CRÍTICOS
El proceso verbal abreviado no podrá exceder los términos del art. 223 CNSCC; la inactividad superior a seis meses da lugar a caducidad.

5. OBSERVACIÓN SOBRE EVIDENCIAS
Las evidencias adjuntas serán valoradas conforme a la sana crítica; se recomienda cadena de custodia para los soportes digitales.`;
