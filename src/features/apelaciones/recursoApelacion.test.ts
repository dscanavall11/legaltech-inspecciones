import { describe, expect, it } from 'vitest';
import {
  controlOportunidad,
  faltantesParaAuto,
  leerRecurso,
  RECURSO_VACIO,
  rotuloRecurrente,
  type RecursoApelacion,
} from './recursoApelacion';
import { generarAutoApelacion } from './autoConcedeApelacion';

const RECURSO_COMPLETO: RecursoApelacion = {
  via: 'reposicion_y_subsidio',
  recurrenteNombre: 'Recurrente de prueba',
  recurrenteIdentificacion: 'CC 0000000',
  calidad: 'infractor',
  fechaAudiencia: '2026-08-10',
  enLaMismaAudiencia: true,
  fechaConcesion: '2026-08-10',
  decisionApelada: 'Multa tipo 2 por el comportamiento del art. 27 num. 1',
  sustentacion: 'Alega que no se valoró el testimonio del vecino.',
  superior: 'Alcaldía Municipal',
};

const DATOS = {
  municipio: 'Municipio de prueba',
  inspeccion: 'Inspección de Convivencia y Paz',
  inspectorNombre: 'Inspector de prueba',
  inspectorCargo: 'Inspector de Convivencia y Paz',
  radicado: '2026-00042',
  comportamiento: 'Art. 27 num. 1',
};

describe('controlOportunidad', () => {
  it('admite el recurso interpuesto dentro de la audiencia', () => {
    expect(controlOportunidad(RECURSO_COMPLETO).procedente).toBe(true);
  });

  it('lo rechaza por extemporáneo si se interpuso fuera de la audiencia', () => {
    const tardio = { ...RECURSO_COMPLETO, enLaMismaAudiencia: false };
    const control = controlOportunidad(tardio);
    expect(control.procedente).toBe(false);
    expect(control.motivo).toContain('extemporáneo');
  });
});

describe('faltantesParaAuto', () => {
  it('no reporta nada cuando el recurso está completo', () => {
    expect(faltantesParaAuto(RECURSO_COMPLETO)).toEqual([]);
  });

  it('nombra cada dato que falta', () => {
    const faltantes = faltantesParaAuto(RECURSO_VACIO);
    expect(faltantes).toHaveLength(5);
    expect(faltantes.join(' ')).toContain('superior jerárquico');
  });
});

describe('rotuloRecurrente', () => {
  it('omite el paréntesis cuando no hay identificación', () => {
    expect(rotuloRecurrente({ ...RECURSO_COMPLETO, recurrenteIdentificacion: '' })).toBe(
      'Recurrente de prueba',
    );
  });
});

describe('leerRecurso', () => {
  it('cae en los valores por defecto si el metadata viene vacío o roto', () => {
    expect(leerRecurso(null)).toEqual(RECURSO_VACIO);
    expect(leerRecurso('no es json')).toEqual(RECURSO_VACIO);
  });

  it('conserva lo guardado y completa el resto', () => {
    const raw = JSON.stringify({ recursoApelacion: { superior: 'Alcaldía Municipal' } });
    expect(leerRecurso(raw).superior).toBe('Alcaldía Municipal');
    expect(leerRecurso(raw).calidad).toBe(RECURSO_VACIO.calidad);
  });
});

describe('generarAutoApelacion', () => {
  it('concede en el efecto devolutivo y advierte que no suspende el cumplimiento', () => {
    const auto = generarAutoApelacion({ ...DATOS, recurso: RECURSO_COMPLETO });
    expect(auto.epigrafe).toContain('SE CONCEDE EL RECURSO DE APELACIÓN');
    expect(auto.resuelve[0]).toContain('EFECTO DEVOLUTIVO');
    expect(auto.resuelve[1]).toContain('NO suspende el cumplimiento');
    expect(auto.resuelve[2]).toContain('dos (2) días');
  });

  it('nunca resuelve el recurso: lo remite al superior', () => {
    const auto = generarAutoApelacion({ ...DATOS, recurso: RECURSO_COMPLETO });
    const texto = [...auto.resuelve, ...auto.secciones.flatMap((s) => s.parrafos)].join(' ');
    expect(texto).toContain('REMITIR');
    expect(texto).toContain('corresponde a Alcaldía Municipal');
    expect(texto).not.toMatch(/CONFIRMAR|REVOCAR|MODIFICAR la decisión/);
  });

  it('niega por extemporáneo y entonces no remite nada', () => {
    const auto = generarAutoApelacion({
      ...DATOS,
      recurso: { ...RECURSO_COMPLETO, enLaMismaAudiencia: false },
    });
    expect(auto.epigrafe).toContain('SE NIEGA POR EXTEMPORÁNEO');
    expect(auto.resuelve[0]).toContain('NEGAR por EXTEMPORÁNEO');
    expect(auto.resuelve.join(' ')).not.toContain('REMITIR');
  });

  it('menciona la reposición ya resuelta solo cuando vino en subsidio', () => {
    const directa = generarAutoApelacion({
      ...DATOS,
      recurso: { ...RECURSO_COMPLETO, via: 'apelacion_directa' },
    });
    expect(directa.secciones.flatMap((s) => s.parrafos).join(' ')).not.toContain(
      'recurso de reposición fue resuelto',
    );
  });
});
