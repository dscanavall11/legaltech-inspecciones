import { describe, it, expect } from 'vitest';
import { generarDeclaracionTestigo, type DatosDeclaracionTestigo } from './declaracionTestigo';

const DATOS: DatosDeclaracionTestigo = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  fechaResolucion: '2026-04-15',
  horaDiligencia: '09:30 a.m.',
  proceso: '2026-0005',
  comparendo: '17-001-6-2026-0004',
  articuloNumeral: 'Artículo 140 Numeral 13',
  fechaComparendo: '2026-03-08',
  lugarComportamiento: 'CALLE 9 VÍA EJEMPLO',
  solicitado: 'JULIÁN EJEMPLO MARTÍNEZ',
  cedulaSolicitado: '1.000.000.020',
  solicitante: 'CAI EJEMPLO',
  representanteApoderado: 'actúa por sí mismo',
  testigoNombre: 'JUAN EJEMPLO CASTRO',
  testigoCedula: '1.000.000.021',
  testigoDireccion: 'Calle 68A No. 8-34, Manizales',
  testigoTelefono: '3000000021',
  vinculoConSolicitado: 'amigos, sin parentesco',
  preguntasYRespuestas: [
    { pregunta: '¿tiene algún vínculo de consanguinidad con el solicitado?', respuesta: 'no, somos amigos' },
    { pregunta: '¿se encontraba en el lugar el día de los hechos?', respuesta: 'sí, señor' },
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
      'PREGUNTANDO: "¿se encontraba en el lugar el día de los hechos?". RESPONDE: "sí, señor".',
    );
  });

  it('firma: solicitado, testigo e inspector, en ese orden', () => {
    const acta = generarDeclaracionTestigo(DATOS);
    expect(acta.firma).toHaveLength(3);
    expect(acta.firma[0]).toEqual({ nombre: 'JULIÁN EJEMPLO MARTÍNEZ', rol: 'C.C. Nro. 1.000.000.020', tipo: 'solicitado' });
    expect(acta.firma[1]).toEqual({ nombre: 'JUAN EJEMPLO CASTRO', rol: 'C.C. Nro. 1.000.000.021', tipo: 'testigo' });
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
