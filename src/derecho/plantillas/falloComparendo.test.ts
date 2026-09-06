import { describe, it, expect } from 'vitest';
import { generarFalloComparendo, type DatosFalloComparendo } from './falloComparendo';
import { liquidarMulta } from '../multas';

const BASE: Omit<DatosFalloComparendo, 'variante'> = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  fechaResolucion: '2026-08-12',
  proceso: '2026-0008',
  comparendo: '17-001-6-2026-0007',
  articuloNumeral: 'Artículo 33 Numeral 4',
  fechaComparendo: '2026-07-02',
  lugarComportamiento: 'CARRERA 22 CALLE 45',
  solicitado: 'CARMEN ROSA FICTICIA TORRES',
  cedulaSolicitado: '1.000.000.030',
  direccionSolicitado: 'Carrera 22 No. 45-12, Barrio Ejemplo, Manizales',
  telefonoSolicitado: '3000000030',
  solicitante: 'CAI EJEMPLO CENTRO',
  hechos: 'resumen anonimizado de los hechos citados en el comparendo',
  descripcionConducta: 'Portar sustancias prohibidas o mezclas en lugares no autorizados para su consumo',
  bienJuridico: 'afectan la tranquilidad y relaciones respetuosas de las personas',
  medidasCorrectivas: 'Multa General tipo 3; participación en programa comunitario',
  observaciones: 'NINGUNA',
  apeloSiNo: 'NO',
  representanteApoderado: 'actúa por sí mismo',
  tipoMulta: 3,
  descargos: 'resumen anonimizado de los descargos rendidos en audiencia',
  pruebasPracticadas: [
    'Orden de Comparendo, valorada de manera integral',
    'Descargos rendidos en audiencia por el solicitado',
    'Registro fotográfico aportado por la Policía Nacional',
  ],
  fechaAudienciaAnterior: '2026-07-24',
  cuentaRecaudo: 'cuenta de ahorros No. 000-000000-00 de Bancolombia',
  titularCuenta: 'Municipio de Manizales',
  nitTitular: '890.000.000-0',
  comparecioVoluntariamente: false,
  terminoActividadPedagogica: 'dos (2) meses',
  aplicaActividadPedagogica: false,
};

describe('generarFalloComparendo — absuelve_unica', () => {
  it('resolutivo distintivo: ABSTENERSE de imponer la multa', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'absuelve_unica' });
    expect(fallo.resuelve[0]).toMatch(/^PRIMERO: ABSTENERSE de imponer/);
    expect(fallo.tituloDocumento).toBe('AUDIENCIA DE FALLO');
    expect(fallo.epigrafe).not.toMatch(/^CONTINUACIÓN DE/);
  });

  it('bloque condicional de actividad pedagógica: ausente cuando aplicaActividadPedagogica es false', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'absuelve_unica', aplicaActividadPedagogica: false });
    expect(fallo.resuelve).toHaveLength(3);
    expect(fallo.resuelve.some((r) => r.startsWith('TERCERO:'))).toBe(false);
    expect(fallo.resuelve[2]).toMatch(/^CUARTO: INGRESAR/);
  });

  it('bloque condicional de actividad pedagógica: presente cuando aplicaActividadPedagogica es true', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'absuelve_unica', aplicaActividadPedagogica: true });
    expect(fallo.resuelve).toHaveLength(4);
    expect(fallo.resuelve[2]).toMatch(/^TERCERO: APLICAR/);
    expect(fallo.resuelve[2]).toContain('actividad pedagógica de convivencia');
  });

  it('firma: solicitado notificado + inspector', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'absuelve_unica' });
    expect(fallo.firma).toHaveLength(2);
    expect(fallo.firma[0].tipo).toBe('notificado');
    expect(fallo.firma[1].nombre).toBe('ANDRÉS FELIPE EJEMPLO ROJAS');
  });
});

describe('generarFalloComparendo — absuelve_continuacion', () => {
  it('resolutivo distintivo: ABSTENERSE (variante de continuación) y epígrafe antepuesto', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'absuelve_continuacion' });
    expect(fallo.resuelve[0]).toMatch(/^PRIMERO: ABSTENERSE de imponer/);
    expect(fallo.resuelve).toHaveLength(3);
    expect(fallo.epigrafe).toMatch(/^CONTINUACIÓN DE/);
  });

  it('antecedentes referencian la audiencia previa que decretó pruebas', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'absuelve_continuacion' });
    const antecedentes = fallo.secciones.find((s) => s.titulo === 'ANTECEDENTES');
    expect(antecedentes?.parrafos.join(' ')).toContain('decretó pruebas');
  });
});

describe('generarFalloComparendo — sanciona_continuacion', () => {
  it('resolutivo distintivo: DECLARAR probado + IMPONER con liquidación', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'sanciona_continuacion' });
    expect(fallo.resuelve[0]).toMatch(/^PRIMERO: DECLARAR probado el carácter de infractor/);
    expect(fallo.resuelve[1]).toMatch(/^SEGUNDO: IMPONER/);
    const liq = liquidarMulta(BASE.tipoMulta);
    expect(fallo.resuelve[1]).toContain(liq.smdlvLetras);
    expect(fallo.resuelve[1]).toContain(liq.valorBaseLetras);
    expect(fallo.resuelve[1]).toContain(BASE.cuentaRecaudo);
    expect(fallo.resuelve).toHaveLength(7);
  });

  it('firma: solicitado notificado + inspector (compareció)', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'sanciona_continuacion' });
    expect(fallo.firma).toHaveLength(2);
    expect(fallo.firma[0].tipo).toBe('notificado');
  });
});

describe('generarFalloComparendo — inasistencia', () => {
  it('resolutivo distintivo: DECLARAR probado + IMPONER, con firmeza inmediata por no comparecencia', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'inasistencia' });
    expect(fallo.resuelve[0]).toMatch(/^PRIMERO: DECLARAR probado el carácter de infractor/);
    expect(fallo.resuelve[1]).toMatch(/^SEGUNDO: IMPONER/);
    expect(fallo.resuelve).toHaveLength(7);
    expect(fallo.resuelve[5]).toContain('no comparecencia');
  });

  it('aplica la presunción de veracidad y omite descargos por inasistencia', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'inasistencia' });
    const problema = fallo.secciones.find((s) => s.titulo === 'PROBLEMA JURÍDICO');
    expect(problema?.parrafos.join(' ')).toContain('presunción de veracidad');
    const descargos = fallo.secciones.find((s) => s.titulo === 'ARGUMENTOS Y/O DESCARGOS — PRUEBAS');
    expect(descargos?.parrafos[0]).toContain('No hay descargos por inasistencia');
  });

  it('no lleva firma del solicitado, que no compareció', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'inasistencia' });
    expect(fallo.firma).toHaveLength(1);
    expect(fallo.firma[0].nombre).toBe('ANDRÉS FELIPE EJEMPLO ROJAS');
  });
});

describe('generarFalloComparendo — terminacion_inactividad', () => {
  it('resolutivo distintivo: DECLARAR LA TERMINACIÓN + ORDENAR EL ARCHIVO cuando no comparece voluntariamente', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'terminacion_inactividad', comparecioVoluntariamente: false });
    expect(fallo.resuelve).toHaveLength(2);
    expect(fallo.resuelve[0]).toMatch(/^PRIMERO: DECLARAR LA TERMINACIÓN/);
    expect(fallo.resuelve[1]).toBe('SEGUNDO: ORDENAR EL ARCHIVO definitivo del expediente.');
    expect(fallo.firma).toHaveLength(1);
    expect(fallo.secciones.some((s) => s.titulo === 'ARGUMENTOS Y/O DESCARGOS — PRUEBAS')).toBe(false);
  });

  it('rama de comparecencia voluntaria: control de legalidad + sustitución por actividad pedagógica', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'terminacion_inactividad', comparecioVoluntariamente: true });
    expect(fallo.resuelve).toHaveLength(5);
    expect(fallo.resuelve[0]).toMatch(/^PRIMERO: EJERCER EL CONTROL DE LEGALIDAD/);
    expect(fallo.resuelve[1]).toMatch(/^SEGUNDO: ABSTENERSE de imponer y ratificar/);
    expect(fallo.resuelve[2]).toContain(BASE.terminoActividadPedagogica);
    expect(fallo.firma).toHaveLength(2);
    expect(fallo.firma[0].tipo).toBe('notificado');
  });

  it('epígrafe propio de terminación por inactividad', () => {
    const fallo = generarFalloComparendo({ ...BASE, variante: 'terminacion_inactividad' });
    expect(fallo.epigrafe).toBe(
      'POR MEDIO DE LA CUAL SE DECIDE SOBRE LA TERMINACIÓN DEL PROCESO POR INACTIVIDAD — ART. 2.2.8.18.9.4, DECRETO 768 DE 2025',
    );
  });
});
