import { describe, it, expect } from 'vitest';
import {
  generarAutoAvocaCitaAudiencia,
  type DatosAutoAvoca,
} from './autoAvocaCitaAudiencia';
import {
  generarAutoDecretaPruebasSuspende,
  type DatosAutoDecretaPruebasSuspende,
} from './autoDecretaPruebasSuspende';
import { generarAutoInasistencia, type DatosAutoInasistencia } from './autoInasistencia';
import {
  generarConstanciaIncumplimientoProntoPago,
  generarConstanciaIncumplimientoActividadPedagogica,
  type DatosConstanciaIncumplimientoProntoPago,
  type DatosConstanciaIncumplimientoActividadPedagogica,
} from './constanciasIncumplimiento';

const datosAvocaBase: DatosAutoAvoca = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  fechaResolucion: '2026-05-04',
  proceso: '2026-0001',
  comparendo: '17-001-6-2026-0000',
  fechaComparendo: '2026-04-20',
  articuloNumeral: 'Artículo 35 Numeral 1',
  solicitado: 'ANA MARÍA EJEMPLO PÉREZ',
  cedulaSolicitado: '1.000.000.000',
  medioImpugnacion: 'correo_electronico',
  fechaAudiencia: '2026-05-18',
  horaAudiencia: '09:00 a.m.',
  lugarAudiencia: 'Inspección Permanente Calle 17 No. 16-40, barrio Las Américas, Manizales Caldas',
  medioNotificacionAutorizado: 'correo electrónico ejemplo@dominio-ejemplo.com',
};

describe('generarAutoAvocaCitaAudiencia', () => {
  it('produce el epígrafe canónico de la plantilla OKF', () => {
    const auto = generarAutoAvocaCitaAudiencia(datosAvocaBase);
    expect(auto.epigrafe).toBe(
      'POR MEDIO DEL CUAL SE DEJA CONSTANCIA DE LA IMPUGNACIÓN OPORTUNA DEL CIUDADANO, SE AVOCA CONOCIMIENTO Y SE FIJA FECHA PARA AUDIENCIA PÚBLICA DENTRO DEL PROCESO VERBAL ABREVIADO',
    );
  });

  it('tiene los siete ordinales del resuelve', () => {
    const auto = generarAutoAvocaCitaAudiencia(datosAvocaBase);
    expect(auto.resuelve).toHaveLength(7);
    expect(auto.resuelve[0]).toMatch(/^PRIMERO:/);
    expect(auto.resuelve[6]).toMatch(/^SÉPTIMO:/);
  });

  it('interpola los slots en la tabla de datos y en el considerando', () => {
    const auto = generarAutoAvocaCitaAudiencia(datosAvocaBase);
    expect(auto.tablaDatos).toContainEqual({
      etiqueta: 'NOMBRE PRESUNTO INFRACTOR',
      valor: 'ANA MARÍA EJEMPLO PÉREZ',
    });
    expect(auto.tablaDatos).toContainEqual({
      etiqueta: 'CÉDULA DE CIUDADANÍA No.',
      valor: '1.000.000.000',
    });
    expect(auto.secciones[1].parrafos.join(' ')).toContain('17-001-6-2026-0000');
    expect(auto.secciones[1].parrafos.join(' ')).toContain('Artículo 35 Numeral 1');
  });

  it('advierte la pérdida del beneficio de pronto pago en el ordinal CUARTO', () => {
    const auto = generarAutoAvocaCitaAudiencia(datosAvocaBase);
    expect(auto.resuelve[3]).toMatch(/^CUARTO:/);
    expect(auto.resuelve[3]).toContain('se pierde el beneficio del descuento por pronto pago');
  });

  it('firma condicional: solo el inspector cuando la impugnación fue por correo electrónico', () => {
    const auto = generarAutoAvocaCitaAudiencia({ ...datosAvocaBase, medioImpugnacion: 'correo_electronico' });
    expect(auto.firma).toHaveLength(1);
    expect(auto.firma[0].nombre).toBe('ANDRÉS FELIPE EJEMPLO ROJAS');
  });

  it('firma condicional: ciudadano notificado + inspector cuando la impugnación fue personal', () => {
    const auto = generarAutoAvocaCitaAudiencia({ ...datosAvocaBase, medioImpugnacion: 'personal' });
    expect(auto.firma).toHaveLength(2);
    expect(auto.firma[0]).toEqual({
      nombre: 'ANA MARÍA EJEMPLO PÉREZ',
      rol: 'C.C. Nro. 1.000.000.000',
      tipo: 'notificado',
    });
    expect(auto.firma[1].nombre).toBe('ANDRÉS FELIPE EJEMPLO ROJAS');
  });
});

const datosDecretaPruebas: DatosAutoDecretaPruebasSuspende = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  fechaResolucion: '2026-05-30',
  proceso: '2026-0002',
  comparendo: '17-001-6-2026-0001',
  articuloNumeral: 'Artículo 35 Numeral 5',
  fechaComparendo: '2026-05-01',
  lugarComportamiento: 'CARRERA 10 CALLE 20, BARRIO EJEMPLO',
  solicitado: 'CARLOS EJEMPLO MARTÍNEZ',
  cedulaSolicitado: '1.000.000.001',
  direccionSolicitado: 'Calle 10 No. 20-30, Barrio Ejemplo, Manizales',
  telefonoSolicitado: '3000000000',
  solicitante: 'CAI EJEMPLO NORTE',
  tipoMulta: 4,
  hechos: 'resumen anonimizado de los hechos citados en el comparendo',
  descripcionConducta: 'Ofrecer cualquier tipo de resistencia a la aplicación de una medida',
  bienJuridico: 'afectan la relación entre las personas y las autoridades',
  medidasCorrectivas: 'Multa General tipo 4; participación en programa comunitario',
  observaciones: 'el ciudadano se negó a firmar la medida correctiva',
  apeloSiNo: 'NO',
  representanteApoderado: 'actúa por sí mismo',
  descargos: 'resumen anonimizado de los argumentos y pruebas anunciadas',
  pruebasDecretadas: [
    'Registro fotográfico aportado por la Policía Nacional',
    'Documento de identidad del presunto infractor',
    'Material audiovisual aportado por el solicitado',
  ],
  fechaReanudacion: '2026-06-27',
};

describe('generarAutoDecretaPruebasSuspende', () => {
  it('produce el epígrafe canónico de la plantilla OKF', () => {
    const auto = generarAutoDecretaPruebasSuspende(datosDecretaPruebas);
    expect(auto.epigrafe).toBe(
      'POR MEDIO DEL CUAL SE DECRETAN PRUEBAS Y SE SUSPENDE AUDIENCIA EN APLICACIÓN DEL PROCESO VERBAL ABREVIADO — ART. 223 NÚM. 3, LEY 1801 DE 2016',
    );
  });

  it('tiene los cinco ordinales del resuelve y las nueve filas de la tabla de datos', () => {
    const auto = generarAutoDecretaPruebasSuspende(datosDecretaPruebas);
    expect(auto.resuelve).toHaveLength(5);
    expect(auto.resuelve[4]).toMatch(/^QUINTO:/);
    expect(auto.tablaDatos).toHaveLength(9);
  });

  it('interpola la lista de pruebas decretadas en el resuelve y en la sección PRUEBAS', () => {
    const auto = generarAutoDecretaPruebasSuspende(datosDecretaPruebas);
    expect(auto.resuelve[1]).toContain('Registro fotográfico aportado por la Policía Nacional');
    expect(auto.resuelve[1]).toContain('Material audiovisual aportado por el solicitado');
    const seccionPruebas = auto.secciones.find((s) => s.titulo === 'PRUEBAS');
    expect(seccionPruebas?.parrafos).toContain('- Documento de identidad del presunto infractor');
  });

  it('firma siempre incluye al solicitado notificado y al inspector', () => {
    const auto = generarAutoDecretaPruebasSuspende(datosDecretaPruebas);
    expect(auto.firma).toHaveLength(2);
    expect(auto.firma[0].tipo).toBe('notificado');
  });
});

const datosInasistencia: DatosAutoInasistencia = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  fechaResolucion: '2026-07-06',
  horaAudiencia: '10:00 a.m.',
  proceso: '2026-0003',
  comparendo: '17-001-6-2026-0002',
  articuloNumeral: 'Artículo 124 Numeral 7',
  fechaComparendo: '2026-06-15',
  lugarComportamiento: 'CARRERA 30 CALLE 40, BARRIO EJEMPLO',
  solicitado: 'LAURA EJEMPLO GÓMEZ',
  cedulaSolicitado: '1.000.000.002',
  direccionSolicitado: 'Carrera 30 Calle 40, Barrio Ejemplo, Manizales',
  telefonoSolicitado: undefined,
  solicitante: 'CAI EJEMPLO SUR',
  hechos: 'resumen anonimizado de los hechos citados en el comparendo',
  descripcionConducta: 'Tolerar, permitir o inducir por acción u omisión el que un animal ataque',
  bienJuridico: 'ponen en riesgo la convivencia por la tenencia de animales',
  medidasCorrectivas: 'Multa General tipo 4; participación en programa comunitario',
  medioNotificacionAutorizado: 'correo electrónico',
  fechaNotificacionPrevia: '2026-07-01',
};

describe('generarAutoInasistencia', () => {
  it('produce el epígrafe canónico de la plantilla OKF', () => {
    const auto = generarAutoInasistencia(datosInasistencia);
    expect(auto.epigrafe).toBe(
      'POR MEDIO DEL CUAL SE SUSPENDE AUDIENCIA EN APLICACIÓN DEL PROCESO VERBAL ABREVIADO — ART. 223 NÚM. 3, LEY 1801 DE 2016',
    );
  });

  it('tiene los tres ordinales del resuelve', () => {
    const auto = generarAutoInasistencia(datosInasistencia);
    expect(auto.resuelve).toHaveLength(3);
    expect(auto.resuelve[2]).toBe('TERCERO: NOTIFICAR la presente decisión en estados.');
  });

  it('interpola los slots, aplica el fallback de teléfono y no lleva firma del solicitado', () => {
    const auto = generarAutoInasistencia(datosInasistencia);
    expect(auto.tablaDatos).toContainEqual({
      etiqueta: 'DIRECCIÓN PRESUNTO INFRACTOR',
      valor: 'Carrera 30 Calle 40, Barrio Ejemplo, Manizales. Teléfono NO APORTA.',
    });
    expect(auto.firma).toHaveLength(1);
    expect(auto.firma[0]).toEqual({
      nombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
      rol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
    });
  });
});

const datosProntoPago: DatosConstanciaIncumplimientoProntoPago = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  fechaResolucion: '2026-07-09',
  proceso: '2026-0006',
  comparendo: '17-001-6-2026-0005',
  fechaComparendo: '2026-05-02',
  tipoMulta: 4,
  solicitado: 'JORGE EJEMPLO DÍAZ',
  cedulaSolicitado: '1.000.000.005',
  documentoCobro: '9999999999',
};

describe('generarConstanciaIncumplimientoProntoPago', () => {
  it('no tiene parte resolutiva y usa el epígrafe correspondiente al tipo de documento', () => {
    const constancia = generarConstanciaIncumplimientoProntoPago(datosProntoPago);
    expect(constancia.tituloDocumento).toBe('CONSTANCIA DE INCUMPLIMIENTO DE PRONTO PAGO');
    expect(constancia.resuelve).toHaveLength(0);
  });

  it('interpola los slots en la tabla de datos y las secciones', () => {
    const constancia = generarConstanciaIncumplimientoProntoPago(datosProntoPago);
    expect(constancia.tablaDatos).toContainEqual({ etiqueta: 'TIPO DE MULTA', valor: 'Multa General Tipo 4' });
    expect(constancia.tablaDatos).toContainEqual({ etiqueta: 'DOCUMENTO DE COBRO No.', valor: '9999999999' });
    expect(constancia.secciones[0].parrafos[0]).toContain('JORGE EJEMPLO DÍAZ');
    expect(constancia.firma).toEqual([
      { nombre: 'ANDRÉS FELIPE EJEMPLO ROJAS', rol: 'Inspector Permanente de Convivencia y Paz – Turno Uno' },
    ]);
  });
});

const datosPedagogica: DatosConstanciaIncumplimientoActividadPedagogica = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  firmanteNombre: 'JULIANA EJEMPLO CASTRO',
  firmanteRol: 'Auxiliar Administrativo',
  fechaResolucion: '2026-05-15',
  proceso: '2026-0007',
  comparendo: '17-001-6-2026-0006',
  solicitado: 'MIGUEL EJEMPLO SUÁREZ',
  cedulaSolicitado: '1.000.000.006',
};

describe('generarConstanciaIncumplimientoActividadPedagogica', () => {
  it('es una constancia secretarial con epígrafe propio y sin parte resolutiva', () => {
    const constancia = generarConstanciaIncumplimientoActividadPedagogica(datosPedagogica);
    expect(constancia.tituloDocumento).toBe('CONSTANCIA SECRETARIAL');
    expect(constancia.epigrafe).toBe('INASISTENCIA A ACTIVIDAD PEDAGÓGICA DE CONVIVENCIA');
    expect(constancia.resuelve).toHaveLength(0);
  });

  it('la firma es la del firmante de oficina, nunca el inspector por defecto', () => {
    const constancia = generarConstanciaIncumplimientoActividadPedagogica(datosPedagogica);
    expect(constancia.firma).toEqual([{ nombre: 'JULIANA EJEMPLO CASTRO', rol: 'Auxiliar Administrativo' }]);
    expect(constancia.secciones[0].parrafos[0]).toContain('MIGUEL EJEMPLO SUÁREZ');
    expect(constancia.secciones[1].parrafos[0]).toContain('Sispaz');
    expect(constancia.secciones[2].parrafos[0]).toContain('cobro coactivo');
  });
});
