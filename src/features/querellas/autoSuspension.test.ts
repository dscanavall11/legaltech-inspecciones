import { describe, it, expect } from 'vitest';
import { generarAutoSuspension } from './autoSuspension';
import { PARTES_VACIAS } from './partes';

/**
 * El auto que suspende NO es un fallo: decreta pruebas y fija reanudación,
 * pero no resuelve el fondo. Estos tests congelan justamente eso, más el
 * hecho de que notifica a las DOS partes de la querella.
 */
const PARTES = {
  ...PARTES_VACIAS,
  querellante: { ...PARTES_VACIAS.querellante, nombre: 'Parte Actora', identificacion: '111' },
  querellado: { ...PARTES_VACIAS.querellado, nombre: 'Parte Pasiva', identificacion: '222' },
  calidadQuerellante: 'Poseedor',
};

const DATOS = {
  municipio: 'Manizales',
  inspeccion: 'Inspección de prueba',
  inspectorNombre: 'INSPECTOR DE PRUEBA',
  inspectorCargo: 'Inspector de Convivencia y Paz',
  radicado: '2026-0001',
  fechaAudiencia: '2026-05-02',
  fechaReanudacion: '2026-05-11',
  horaReanudacion: '08:00',
  partes: PARTES,
  comportamiento: 'Perturbación a la posesión',
  pruebasDecretadas: ['Inspección ocular al inmueble', 'Declaración de testigo'],
  motivacion: 'Son conducentes para establecer la perturbación alegada.',
};

describe('generarAutoSuspension', () => {
  it('suspende y fija reanudación, sin decidir el fondo', () => {
    const auto = generarAutoSuspension(DATOS);
    const resuelve = auto.resuelve.join(' ');
    expect(resuelve).toContain('SUSPENDER');
    expect(resuelve).toContain('DECRETAR');
    expect(resuelve).toContain('FIJAR como fecha para la continuación');
    // Un auto de trámite nunca declara responsabilidad ni impone medida.
    expect(resuelve).not.toMatch(/declarar responsable|imponer la medida correctiva/i);
  });

  it('lista las pruebas decretadas y omite las líneas vacías', () => {
    const auto = generarAutoSuspension({ ...DATOS, pruebasDecretadas: ['Una prueba', '  ', ''] });
    const ordinal = auto.resuelve.find((r) => r.startsWith('SEGUNDO')) ?? '';
    expect(ordinal).toContain('- Una prueba');
    expect(ordinal.match(/\n- /g)).toHaveLength(1);
  });

  it('notifica en estrados a las dos partes y lo firma el inspector', () => {
    const auto = generarAutoSuspension(DATOS);
    expect(auto.firma.map((f) => f.nombre)).toEqual([
      'Parte Actora',
      'Parte Pasiva',
      'INSPECTOR DE PRUEBA',
    ]);
  });

  it('encabeza como querella y no como queja', () => {
    const auto = generarAutoSuspension(DATOS);
    expect(auto.rotuloProceso).toBe('QUERELLA No.');
    expect(auto.tablaDatos.find((f) => f.etiqueta === 'QUERELLANTE')?.valor).toContain('Parte Actora');
    expect(auto.tablaDatos.find((f) => f.etiqueta === 'QUERELLADO')?.valor).toContain('Parte Pasiva');
  });

  it('cita el literal c) del art. 223, que es el que permite suspender', () => {
    const auto = generarAutoSuspension(DATOS);
    const texto = auto.secciones.flatMap((s) => s.parrafos).join(' ');
    expect(texto).toContain('cinco (5) días');
    expect(auto.epigrafe).toContain('223');
  });
});
