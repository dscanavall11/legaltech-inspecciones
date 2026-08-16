import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { falloIdentificado, leerDatosFallo } from './datosFallo';
import {
  APARTES_FALLO,
  apartesFaltantes,
  construirDocumentoFallo,
  type BorradorFallo,
} from './falloDocumento';
import type { LegalCase } from './api';
import { DECISION_VACIA } from '@/features/querellas/decisionQuerella';

const BORRADOR: BorradorFallo = {
  competencia: '',
  antecedents: 'Hechos de prueba.',
  tramite: '',
  juridicProblem: '',
  evidences: '',
  necesidadProporcionalidad: '',
  juridicResponse: '',
  juridicFundamentals: '',
  parteResolutiva: '',
  recursos: '',
};

/** Borrador con los nueve apartes diligenciados. */
function borradorCompleto(): BorradorFallo {
  return APARTES_FALLO.reduce(
    (acc, { campo }) => ({ ...acc, [campo]: `Contenido de ${campo}.` }),
    BORRADOR,
  );
}

const DESPACHO = {
  municipio: 'Manizales',
  inspeccion: 'Inspección de prueba',
  inspectorNombre: 'INSPECTOR DE PRUEBA',
  inspectorCargo: 'Inspector de Convivencia y Paz',
};

function caso(over: Partial<LegalCase> = {}): LegalCase {
  return {
    id: 'c1',
    filingNumber: '2026-RAD-001',
    caseType: 'querella',
    venueCity: 'Manizales',
    judicialOfficeId: 'of-1',
    currentStateCode: 'audiencia_programada',
    caseMetadata: null,
    parties: [],
    ...over,
  } as LegalCase;
}

describe('leerDatosFallo', () => {
  it('lee número y fecha guardados en caseMetadata', () => {
    const raw = JSON.stringify({ numeroFallo: '017', fechaFallo: '2026-05-02', asunto: 'Ruido' });
    expect(leerDatosFallo(raw)).toEqual({
      numeroFallo: '017',
      fechaFallo: '2026-05-02',
      medidaCorrectiva: '',
    });
  });

  it('sin número guardado no lo inventa; la fecha arranca hoy', () => {
    const datos = leerDatosFallo(null);
    expect(datos.numeroFallo).toBe('');
    expect(datos.fechaFallo).toBe(dayjs().format('YYYY-MM-DD'));
  });
});

describe('falloIdentificado', () => {
  it('exige un número no vacío', () => {
    expect(falloIdentificado({ numeroFallo: '', fechaFallo: '2026-05-02', medidaCorrectiva: '' })).toBe(false);
    expect(falloIdentificado({ numeroFallo: '   ', fechaFallo: '2026-05-02', medidaCorrectiva: '' })).toBe(false);
    expect(falloIdentificado({ numeroFallo: '017', fechaFallo: '2026-05-02', medidaCorrectiva: '' })).toBe(true);
  });
});

describe('construirDocumentoFallo', () => {
  it('encabeza el documento con el número y la fecha que fijó el inspector', () => {
    const doc = construirDocumentoFallo(caso(), BORRADOR, DESPACHO, {
      numeroFallo: '017',
      fechaFallo: '2026-05-02',
      medidaCorrectiva: '',
    });
    expect(doc.proceso).toBe('017');
    expect(doc.rotuloProceso).toBe('FALLO No.');
    expect(doc.fechaResolucionLetras).toContain('dos (02) de mayo');
    expect(doc.cierre).toContain('dos (02) de mayo');
    expect(doc.tablaDatos.find((f) => f.etiqueta === 'FALLO No.')?.valor).toBe('017');
  });

  it('sin número asignado cae al radicado del caso, nunca a un número inventado', () => {
    const doc = construirDocumentoFallo(caso(), BORRADOR, DESPACHO, {
      numeroFallo: '',
      fechaFallo: '2026-05-02',
      medidaCorrectiva: '',
    });
    expect(doc.proceso).toBe('2026-RAD-001');
  });

  it('conserva el radicado del expediente como dato aparte del número de fallo', () => {
    const doc = construirDocumentoFallo(caso(), BORRADOR, DESPACHO, {
      numeroFallo: '017',
      fechaFallo: '2026-05-02',
      medidaCorrectiva: '',
    });
    expect(doc.tablaDatos.find((f) => f.etiqueta === 'RADICADO')?.valor).toBe('2026-RAD-001');
  });

  it('omite las secciones que el borrador todavía no tiene', () => {
    const doc = construirDocumentoFallo(caso(), BORRADOR, DESPACHO, {
      numeroFallo: '017',
      fechaFallo: '2026-05-02',
      medidaCorrectiva: '',
    });
    expect(doc.secciones.map((s) => s.titulo)).toEqual(['HECHOS']);
  });
});

describe('apartes del art. 2.2.8.18.7.1 (Decreto 768)', () => {
  it('los nueve del decreto están, en su orden', () => {
    expect(APARTES_FALLO.filter((a) => a.delDecreto7_1).map((a) => a.titulo)).toEqual([
      'COMPETENCIA',
      'HECHOS',
      'TRÁMITE DESARROLLADO',
      'PROBLEMA JURÍDICO',
      'ANÁLISIS CRÍTICO Y VALORACIÓN PROBATORIA',
      'RESPUESTA AL PROBLEMA JURÍDICO',
      'FUNDAMENTOS DE DERECHO',
      'DECISIÓN DEL CASO',
      'RECURSOS',
    ]);
  });

  // El decreto fija un mínimo; el despacho agrega el juicio de última ratio,
  // que va entre la valoración probatoria y la respuesta.
  it('el análisis de proporcionalidad se agrega sin desordenar los del decreto', () => {
    const extras = APARTES_FALLO.filter((a) => !a.delDecreto7_1);
    expect(extras.map((a) => a.titulo)).toEqual([
      'ANÁLISIS DE NECESIDAD, RAZONABILIDAD Y PROPORCIONALIDAD',
    ]);
    const titulos = APARTES_FALLO.map((a) => a.titulo);
    expect(titulos.indexOf('ANÁLISIS DE NECESIDAD, RAZONABILIDAD Y PROPORCIONALIDAD')).toBe(
      titulos.indexOf('ANÁLISIS CRÍTICO Y VALORACIÓN PROBATORIA') + 1,
    );
    expect(titulos.indexOf('RESPUESTA AL PROBLEMA JURÍDICO')).toBe(
      titulos.indexOf('ANÁLISIS DE NECESIDAD, RAZONABILIDAD Y PROPORCIONALIDAD') + 1,
    );
  });

  it('el documento imprime los apartes en ese mismo orden', () => {
    const completo = borradorCompleto();
    const doc = construirDocumentoFallo(caso(), completo, DESPACHO, {
      numeroFallo: '017',
      fechaFallo: '2026-05-02',
      medidaCorrectiva: '',
    });
    expect(doc.secciones.map((s) => s.titulo)).toEqual(APARTES_FALLO.map((a) => a.titulo));
  });

  it('reporta como faltantes los apartes sin diligenciar', () => {
    expect(apartesFaltantes(BORRADOR)).toEqual(
      APARTES_FALLO.filter((a) => a.campo !== 'antecedents').map((a) => a.titulo),
    );
  });

  it('un borrador completo no reporta faltantes', () => {
    const completo = borradorCompleto();
    expect(apartesFaltantes(completo)).toEqual([]);
  });
});

describe('el documento se ramifica según lo que dispuso el inspector', () => {
  const completo = () => borradorCompleto();
  const datos = { numeroFallo: '017', fechaFallo: '2026-05-02', medidaCorrectiva: '' };

  it('distingue audiencia única de continuación en el título', () => {
    const unica = construirDocumentoFallo(caso(), completo(), DESPACHO, datos, {
      ...DECISION_VACIA,
      variante: 'unica',
    });
    const cont = construirDocumentoFallo(caso(), completo(), DESPACHO, datos, {
      ...DECISION_VACIA,
      variante: 'continuacion',
    });
    expect(unica.tituloDocumento).toBe('FALLO — AUDIENCIA ÚNICA');
    expect(cont.tituloDocumento).toBe('FALLO — CONTINUACIÓN DE AUDIENCIA');
  });

  it('el epígrafe anuncia el sentido, y absolver no se confunde con abstenerse de multar', () => {
    const sentidoDe = (sentido: 'absuelve' | 'responsable_sin_multa' | 'sanciona') =>
      construirDocumentoFallo(caso(), completo(), DESPACHO, datos, { ...DECISION_VACIA, sentido })
        .epigrafe ?? '';

    expect(sentidoDe('absuelve')).toContain('SE ABSUELVE');
    expect(sentidoDe('responsable_sin_multa')).toContain('SE DECLARA LA RESPONSABILIDAD');
    expect(sentidoDe('responsable_sin_multa')).toContain('SE ABSTIENE DE IMPONER MULTA');
    expect(sentidoDe('sanciona')).toContain('SE IMPONE MEDIDA CORRECTIVA');
    // Los tres son distintos entre sí.
    const todos = ['absuelve', 'responsable_sin_multa', 'sanciona'] as const;
    expect(new Set(todos.map(sentidoDe)).size).toBe(3);
  });

  it('deja constancia en la tabla de cómo transcurrió la audiencia', () => {
    const doc = construirDocumentoFallo(caso(), completo(), DESPACHO, datos, {
      ...DECISION_VACIA,
      variante: 'continuacion',
    });
    expect(doc.tablaDatos.find((f) => f.etiqueta === 'AUDIENCIA')?.valor).toBe(
      'Continuación de audiencia',
    );
  });
});
