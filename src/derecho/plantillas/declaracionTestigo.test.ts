import { describe, it, expect } from 'vitest';
import { generarDeclaracionTestigo, type DatosDeclaracionTestigo } from './declaracionTestigo';

const DATOS: DatosDeclaracionTestigo = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  fechaResolucion: '2026-09-10',
  horaDiligencia: '02:15 p.m.',
  proceso: '2026-0009',
  comparendo: '17-001-6-2026-0008',
  articuloNumeral: 'Artículo 27 Numeral 6',
  fechaComparendo: '2026-08-01',
  lugarComportamiento: 'AVENIDA EJEMPLO CON CARRERA 50',
  solicitado: 'RODRIGO EJEMPLO VALENCIA',
  cedulaSolicitado: '1.000.000.040',
  solicitante: 'CAI EJEMPLO SUR',
  representanteApoderado: 'actúa por sí mismo',
  testigoNombre: 'PATRICIA EJEMPLO NARANJO',
  testigoCedula: '1.000.000.041',
  testigoDireccion: 'Transversal 14 No. 22-51, Manizales',
  testigoTelefono: '3000000041',
  vinculoConSolicitado: 'vecinos, sin parentesco',
  preguntasYRespuestas: [
    { pregunta: '¿tiene algún vínculo de consanguinidad con el solicitado?', respuesta: 'no, somos vecinos' },
    { pregunta: '¿se encontraba en el lugar el día de los hechos?', respuesta: 'sí, señora' },
  ],
  manifestacionTraslado: 'no tengo ninguna objeción',
};

describe('generarDeclaracionTestigo', () => {
  it('produce el tipo de documento y epígrafe de la plantilla OKF', () => {
    const acta = generarDeclaracionTestigo(DATOS);
    expect(acta.tituloDocumento).toBe('RECEPCIÓN DE TESTIMONIO');
    expect(acta.epigrafe).toBe('LEY 1801 DE 2016 — PROCESO VERBAL ABREVIADO, ART. 223 NÚM. 3 LIT. C');
    expect(acta.resuelve).toHaveLength(0);
  });

  it('interpola el interrogatorio como pares pregunta/respuesta', () => {
    const acta = generarDeclaracionTestigo(DATOS);
    const interrogatorio = acta.secciones.find((s) => s.titulo === 'INTERROGATORIO');
    expect(interrogatorio?.parrafos).toContain(
      'PREGUNTANDO: "¿se encontraba en el lugar el día de los hechos?". RESPONDE: "sí, señora".',
    );
  });

  it('firma: solicitado, testigo e inspector, en ese orden', () => {
    const acta = generarDeclaracionTestigo(DATOS);
    expect(acta.firma).toHaveLength(3);
    expect(acta.firma[0]).toEqual({ nombre: 'RODRIGO EJEMPLO VALENCIA', rol: 'C.C. Nro. 1.000.000.040', tipo: 'solicitado' });
    expect(acta.firma[1]).toEqual({ nombre: 'PATRICIA EJEMPLO NARANJO', rol: 'C.C. Nro. 1.000.000.041', tipo: 'testigo' });
    expect(acta.firma[2].nombre).toBe('ANDRÉS FELIPE EJEMPLO ROJAS');
  });

  it('aplica los fallbacks cuando faltan lugar, hora y datos del testigo', () => {
    const acta = generarDeclaracionTestigo({
      ...DATOS,
      horaDiligencia: undefined,
      lugarComportamiento: undefined,
      testigoDireccion: undefined,
      testigoTelefono: undefined,
    });
    expect(acta.tablaDatos).toContainEqual({ etiqueta: 'LUGAR DEL COMPORTAMIENTO', valor: 'NO REGISTRA' });
    const identificacion = acta.secciones.find((s) => s.titulo === 'IDENTIFICACIÓN DEL DECLARANTE');
    expect(identificacion?.parrafos[0]).toContain('NO REGISTRA');
    expect(identificacion?.parrafos[0]).toContain('NO APORTA');
  });
});
