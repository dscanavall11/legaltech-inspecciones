import { describe, it, expect } from 'vitest';
import { legalCaseAFila, descripcionTermino } from './types';
import type { LegalCase } from '@/shared/legalCases/types';

function caso(over: Partial<LegalCase> = {}): LegalCase {
  return {
    id: 'c1',
    createdAt: '2026-03-02T10:00:00',
    filingNumber: '2026-0001',
    judicialOfficeId: 'of-1',
    caseType: 'querella',
    rulingDate: null,
    venueCity: 'Manizales',
    evidenceAssessment: null,
    legalReasoning: null,
    caseMetadata: null,
    background: null,
    ruling: null,
    parties: [],
    stateHistory: [],
    status: 'ACTIVO',
    finalizedAt: null,
    finalizedReason: null,
    ...over,
  };
}

const parte = (partyRole: string, fullName: string) => ({
  partyRole,
  fullName,
  identificationType: 'CC',
  identificationNumber: '1',
});

describe('legalCaseAFila', () => {
  it('resuelve las partes por el rol del tipo de proceso', () => {
    const fila = legalCaseAFila(
      caso({ parties: [parte('querellado', 'Parte B'), parte('querellante', 'Parte A')] }),
    );
    expect(fila.parteA).toBe('Parte A');
    expect(fila.parteB).toBe('Parte B');
  });

  it('acepta las grafías alternativas del mismo papel (queja: quejado o acusado)', () => {
    const conQuejado = legalCaseAFila(
      caso({ caseType: 'queja', parties: [parte('quejado', 'Vecino')] }),
    );
    const conAcusado = legalCaseAFila(
      caso({ caseType: 'queja', parties: [parte('acusado', 'Vecino')] }),
    );
    expect(conQuejado.parteB).toBe('Vecino');
    expect(conAcusado.parteB).toBe('Vecino');
  });

  it('cae a los roles heredados en inglés de los expedientes viejos', () => {
    const fila = legalCaseAFila(caso({ parties: [parte('PLAINTIFF', 'Antiguo')] }));
    expect(fila.parteA).toBe('Antiguo');
    expect(fila.parteB).toBe('No identificado');
  });

  it('no inventa partes ni asunto cuando el expediente no los trae', () => {
    const fila = legalCaseAFila(caso());
    expect(fila.parteA).toBe('No identificado');
    expect(fila.asunto).toBe('Sin asunto registrado');
  });

  it('sin diasTermino en metadata usa el default del tipo, marcado como presuntivo', () => {
    const fila = legalCaseAFila(caso({ caseType: 'querella' }));
    expect(fila.diasTermino).toBe(15);
    expect(fila.diasTerminoPresuntivo).toBe(true);
    expect(descripcionTermino(fila)).toMatch(/presuntivo/);
  });

  it('con diasTermino en metadata lo usa tal cual, sin marcar presuntivo', () => {
    const fila = legalCaseAFila(
      caso({ caseType: 'querella', caseMetadata: JSON.stringify({ diasTermino: 20 }) }),
    );
    expect(fila.diasTermino).toBe(20);
    expect(fila.diasTerminoPresuntivo).toBe(false);
    expect(descripcionTermino(fila)).not.toMatch(/presuntivo/);
  });

  it('un tipo sin default defendible (comparendo) no inventa término', () => {
    const fila = legalCaseAFila(caso({ caseType: 'comparendo' }));
    expect(fila.diasTermino).toBeUndefined();
    expect(fila.diasTerminoPresuntivo).toBe(false);
  });

  it('un tipo desconocido no rompe el mapeo', () => {
    const fila = legalCaseAFila(caso({ caseType: 'VERBAL', parties: [parte('PLAINTIFF', 'X')] }));
    expect(fila.tipo).toBe('VERBAL');
    expect(fila.parteA).toBe('No identificado');
  });

  it('marca fallo solo cuando hay motivación guardada, sin importar el ciclo de vida', () => {
    const sinMotivacion = legalCaseAFila(caso({ status: 'FINALIZADO' }));
    const conMotivacionActivo = legalCaseAFila(caso({ legalReasoning: 'Se resuelve...' }));
    const conMotivacionFinalizado = legalCaseAFila(
      caso({ status: 'FINALIZADO', legalReasoning: 'Se resuelve...' }),
    );
    expect(sinMotivacion.tieneFallo).toBe(false);
    expect(conMotivacionActivo.tieneFallo).toBe(true);
    expect(conMotivacionFinalizado.tieneFallo).toBe(true);
  });

  it('el estado de la fila refleja el ciclo de vida real (ACTIVO/FINALIZADO)', () => {
    expect(legalCaseAFila(caso({ status: 'ACTIVO' })).estado).toBe('ACTIVO');
    expect(legalCaseAFila(caso({ status: 'FINALIZADO' })).estado).toBe('FINALIZADO');
  });

  it('lee asunto y término de caseMetadata cuando existen', () => {
    const fila = legalCaseAFila(
      caso({ caseMetadata: JSON.stringify({ asunto: 'Ruido nocturno', diasTermino: 15 }) }),
    );
    expect(fila.asunto).toBe('Ruido nocturno');
    expect(fila.diasTermino).toBe(15);
  });
});
