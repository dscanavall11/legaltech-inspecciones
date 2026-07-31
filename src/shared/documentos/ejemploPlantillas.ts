import type { ConfigInspeccion } from '@/store/inspeccionStore';
import {
  generarAutoAvocaCitaAudiencia,
  generarAutoDecretaPruebasSuspende,
  generarAutoInasistencia,
  generarFalloComparendo,
  generarDeclaracionTestigo,
  generarConstanciaIncumplimientoProntoPago,
  generarConstanciaIncumplimientoActividadPedagogica,
  generarActaFirmeza,
  type DocumentoLegal,
  type ActaFirmeza,
} from '@/derecho';
import { generarDocumentoLegalBlob } from '@/shared/documentos/documentoLegalPdf';
import { generarActaFirmezaBlob } from '@/features/actas/actaPdf';

/**
 * Datos de ejemplo (sintéticos, sin PII real) para previsualizar cada una de
 * las 8 plantillas del checklist plantillas-personalizadas — el municipio,
 * la inspección y el nombre del inspector sí se toman de la configuración
 * real del despacho cuando existen, porque son precisamente lo que la
 * previsualización debe mostrar; ciudadano/comparendo/testigo son siempre
 * inventados.
 *
 * Compartido (Task 18): antes vivía en features/ajustes, importado también
 * desde comparendos vía FlujoNavegable — se movió a shared/documentos para
 * no acoplar comparendos a ajustes.
 */
const EJEMPLO_BASE = {
  proceso: '2026-EJ-0001',
  comparendo: 'CO-EJEMPLO-00001',
  articuloNumeral: 'Artículo 27 Numeral 1',
  fechaComparendo: '2026-05-10',
  lugarComportamiento: 'Carrera 23 con Calle 45, zona centro',
  solicitado: 'ANA MARÍA EJEMPLO PÉREZ',
  cedulaSolicitado: '9999999999',
  direccionSolicitado: 'Calle 100 # 10-10',
  telefonoSolicitado: '3000000000',
  solicitante: 'CAI EJEMPLO',
  hechos: 'Hechos de ejemplo, solo para previsualizar el formato de la plantilla.',
  descripcionConducta: 'Comportamiento de ejemplo contrario a la convivencia.',
  bienJuridico: 'afectan la tranquilidad y relaciones respetuosas entre las personas',
  medidasCorrectivas: 'Multa General Tipo 2',
  apeloSiNo: 'NO' as const,
  tipoMulta: 2 as const,
  fechaResolucion: '2026-06-01',
};

function datosDespachoEjemplo(config: ConfigInspeccion) {
  return {
    municipio: config.municipio || 'Manizales',
    inspeccion: config.inspeccion || 'Inspección Permanente de Convivencia y Paz Turno Uno',
    inspectorNombre: config.inspectorNombre || 'CARLOS EJEMPLO GÓMEZ',
    inspectorRol: 'Inspector Permanente de Convivencia y Paz',
  };
}

function autoAvoca(config: ConfigInspeccion): DocumentoLegal {
  return generarAutoAvocaCitaAudiencia({
    ...datosDespachoEjemplo(config),
    fechaResolucion: EJEMPLO_BASE.fechaResolucion,
    proceso: EJEMPLO_BASE.proceso,
    comparendo: EJEMPLO_BASE.comparendo,
    fechaComparendo: EJEMPLO_BASE.fechaComparendo,
    articuloNumeral: EJEMPLO_BASE.articuloNumeral,
    solicitado: EJEMPLO_BASE.solicitado,
    cedulaSolicitado: EJEMPLO_BASE.cedulaSolicitado,
    medioImpugnacion: 'personal',
    fechaAudiencia: '2026-06-15',
    horaAudiencia: '09:00 a.m.',
    lugarAudiencia: 'Despacho de la Inspección',
  });
}

function autoDecretaPruebas(config: ConfigInspeccion): DocumentoLegal {
  return generarAutoDecretaPruebasSuspende({
    ...datosDespachoEjemplo(config),
    fechaResolucion: EJEMPLO_BASE.fechaResolucion,
    proceso: EJEMPLO_BASE.proceso,
    comparendo: EJEMPLO_BASE.comparendo,
    articuloNumeral: EJEMPLO_BASE.articuloNumeral,
    fechaComparendo: EJEMPLO_BASE.fechaComparendo,
    lugarComportamiento: EJEMPLO_BASE.lugarComportamiento,
    solicitado: EJEMPLO_BASE.solicitado,
    cedulaSolicitado: EJEMPLO_BASE.cedulaSolicitado,
    direccionSolicitado: EJEMPLO_BASE.direccionSolicitado,
    telefonoSolicitado: EJEMPLO_BASE.telefonoSolicitado,
    solicitante: EJEMPLO_BASE.solicitante,
    tipoMulta: EJEMPLO_BASE.tipoMulta,
    hechos: EJEMPLO_BASE.hechos,
    descripcionConducta: EJEMPLO_BASE.descripcionConducta,
    bienJuridico: EJEMPLO_BASE.bienJuridico,
    medidasCorrectivas: EJEMPLO_BASE.medidasCorrectivas,
    apeloSiNo: EJEMPLO_BASE.apeloSiNo,
    descargos: 'Resumen de ejemplo de los argumentos y pruebas anunciadas.',
    pruebasDecretadas: ['Testimonio del ciudadano', 'Registro fotográfico'],
    fechaReanudacion: '2026-06-08',
  });
}

function autoInasistencia(config: ConfigInspeccion): DocumentoLegal {
  return generarAutoInasistencia({
    ...datosDespachoEjemplo(config),
    fechaResolucion: EJEMPLO_BASE.fechaResolucion,
    horaAudiencia: '10:00 a.m.',
    proceso: EJEMPLO_BASE.proceso,
    comparendo: EJEMPLO_BASE.comparendo,
    articuloNumeral: EJEMPLO_BASE.articuloNumeral,
    fechaComparendo: EJEMPLO_BASE.fechaComparendo,
    lugarComportamiento: EJEMPLO_BASE.lugarComportamiento,
    solicitado: EJEMPLO_BASE.solicitado,
    cedulaSolicitado: EJEMPLO_BASE.cedulaSolicitado,
    direccionSolicitado: EJEMPLO_BASE.direccionSolicitado,
    telefonoSolicitado: EJEMPLO_BASE.telefonoSolicitado,
    solicitante: EJEMPLO_BASE.solicitante,
    hechos: EJEMPLO_BASE.hechos,
    descripcionConducta: EJEMPLO_BASE.descripcionConducta,
    bienJuridico: EJEMPLO_BASE.bienJuridico,
    medidasCorrectivas: EJEMPLO_BASE.medidasCorrectivas,
    fechaNotificacionPrevia: '2026-05-25',
  });
}

function falloComparendo(config: ConfigInspeccion): DocumentoLegal {
  return generarFalloComparendo({
    ...datosDespachoEjemplo(config),
    fechaResolucion: EJEMPLO_BASE.fechaResolucion,
    proceso: EJEMPLO_BASE.proceso,
    comparendo: EJEMPLO_BASE.comparendo,
    articuloNumeral: EJEMPLO_BASE.articuloNumeral,
    fechaComparendo: EJEMPLO_BASE.fechaComparendo,
    lugarComportamiento: EJEMPLO_BASE.lugarComportamiento,
    solicitado: EJEMPLO_BASE.solicitado,
    cedulaSolicitado: EJEMPLO_BASE.cedulaSolicitado,
    direccionSolicitado: EJEMPLO_BASE.direccionSolicitado,
    telefonoSolicitado: EJEMPLO_BASE.telefonoSolicitado,
    solicitante: EJEMPLO_BASE.solicitante,
    hechos: EJEMPLO_BASE.hechos,
    descripcionConducta: EJEMPLO_BASE.descripcionConducta,
    bienJuridico: EJEMPLO_BASE.bienJuridico,
    medidasCorrectivas: EJEMPLO_BASE.medidasCorrectivas,
    apeloSiNo: EJEMPLO_BASE.apeloSiNo,
    tipoMulta: EJEMPLO_BASE.tipoMulta,
    descargos: 'Resumen de ejemplo de los argumentos del solicitado en audiencia.',
    pruebasPracticadas: ['Testimonio del ciudadano', 'Registro fotográfico'],
    variante: 'absuelve_unica',
    aplicaActividadPedagogica: false,
  });
}

function declaracionTestigo(config: ConfigInspeccion): DocumentoLegal {
  return generarDeclaracionTestigo({
    ...datosDespachoEjemplo(config),
    fechaResolucion: EJEMPLO_BASE.fechaResolucion,
    horaDiligencia: '11:00 a.m.',
    proceso: EJEMPLO_BASE.proceso,
    comparendo: EJEMPLO_BASE.comparendo,
    articuloNumeral: EJEMPLO_BASE.articuloNumeral,
    fechaComparendo: EJEMPLO_BASE.fechaComparendo,
    lugarComportamiento: EJEMPLO_BASE.lugarComportamiento,
    solicitado: EJEMPLO_BASE.solicitado,
    cedulaSolicitado: EJEMPLO_BASE.cedulaSolicitado,
    solicitante: EJEMPLO_BASE.solicitante,
    testigoNombre: 'PEDRO EJEMPLO RAMÍREZ',
    testigoCedula: '8888888888',
    testigoDireccion: 'Carrera 5 # 20-20',
    testigoTelefono: '3000000001',
    vinculoConSolicitado: 'Vecino del sector',
    preguntasYRespuestas: [
      { pregunta: '¿Qué observó el día de los hechos?', respuesta: 'Respuesta de ejemplo del testigo.' },
    ],
    manifestacionTraslado: 'No tengo observaciones adicionales (respuesta de ejemplo).',
  });
}

function constanciaProntoPago(config: ConfigInspeccion): DocumentoLegal {
  return generarConstanciaIncumplimientoProntoPago({
    ...datosDespachoEjemplo(config),
    fechaResolucion: EJEMPLO_BASE.fechaResolucion,
    proceso: EJEMPLO_BASE.proceso,
    comparendo: EJEMPLO_BASE.comparendo,
    fechaComparendo: EJEMPLO_BASE.fechaComparendo,
    tipoMulta: EJEMPLO_BASE.tipoMulta,
    solicitado: EJEMPLO_BASE.solicitado,
    cedulaSolicitado: EJEMPLO_BASE.cedulaSolicitado,
    documentoCobro: 'DC-EJEMPLO-0001',
  });
}

function constanciaActividadPedagogica(config: ConfigInspeccion): DocumentoLegal {
  return generarConstanciaIncumplimientoActividadPedagogica({
    municipio: config.municipio || 'Manizales',
    inspeccion: config.inspeccion || 'Inspección Permanente de Convivencia y Paz Turno Uno',
    firmanteNombre: 'LUISA EJEMPLO TORRES',
    firmanteRol: 'Auxiliar Administrativo',
    fechaResolucion: EJEMPLO_BASE.fechaResolucion,
    proceso: EJEMPLO_BASE.proceso,
    comparendo: EJEMPLO_BASE.comparendo,
    solicitado: EJEMPLO_BASE.solicitado,
    cedulaSolicitado: EJEMPLO_BASE.cedulaSolicitado,
  });
}

function actaFirmeza(config: ConfigInspeccion): ActaFirmeza {
  const despacho = datosDespachoEjemplo(config);
  return generarActaFirmeza({
    municipio: despacho.municipio,
    inspeccion: despacho.inspeccion,
    inspectorNombre: despacho.inspectorNombre,
    inspectorCargo: despacho.inspectorRol,
    proceso: EJEMPLO_BASE.proceso,
    fechaResolucion: EJEMPLO_BASE.fechaResolucion,
    comparendo: EJEMPLO_BASE.comparendo,
    fechaComparendo: EJEMPLO_BASE.fechaComparendo,
    articuloNumeral: EJEMPLO_BASE.articuloNumeral,
    lugar: EJEMPLO_BASE.lugarComportamiento,
    solicitado: EJEMPLO_BASE.solicitado,
    cedula: EJEMPLO_BASE.cedulaSolicitado,
    direccion: EJEMPLO_BASE.direccionSolicitado,
    telefono: EJEMPLO_BASE.telefonoSolicitado,
    solicitante: EJEMPLO_BASE.solicitante,
    hechos: EJEMPLO_BASE.hechos,
    tipoMulta: EJEMPLO_BASE.tipoMulta,
    causal: 'ninguna',
  });
}

/** Nombre de archivo legible para cada documentKey del checklist plantillas-personalizadas. */
export const NOMBRE_PLANTILLA: Record<string, string> = {
  'auto-avoca-cita-audiencia': 'Auto que avoca y cita a audiencia',
  'auto-decreta-pruebas-suspende': 'Auto que decreta pruebas y suspende',
  'auto-inasistencia': 'Auto de inasistencia',
  'fallo-comparendo': 'Fallo del comparendo',
  'declaracion-testigo': 'Recepción de testimonio',
  'constancia-incumplimiento-pronto-pago': 'Constancia de incumplimiento de pronto pago',
  'constancia-incumplimiento-actividad-pedagogica': 'Constancia de incumplimiento de actividad pedagógica',
  'acta-firmeza': 'Acta de firmeza',
};

const GENERADORES: Record<string, (config: ConfigInspeccion) => DocumentoLegal | ActaFirmeza> = {
  'auto-avoca-cita-audiencia': autoAvoca,
  'auto-decreta-pruebas-suspende': autoDecretaPruebas,
  'auto-inasistencia': autoInasistencia,
  'fallo-comparendo': falloComparendo,
  'declaracion-testigo': declaracionTestigo,
  'constancia-incumplimiento-pronto-pago': constanciaProntoPago,
  'constancia-incumplimiento-actividad-pedagogica': constanciaActividadPedagogica,
  'acta-firmeza': actaFirmeza,
};

function esActaFirmeza(doc: DocumentoLegal | ActaFirmeza): doc is ActaFirmeza {
  return 'dispone' in doc;
}

/** Genera el PDF de ejemplo (Blob) para un documentKey del checklist — null si no hay generador conocido. */
export async function generarBlobEjemploPlantilla(
  documentKey: string,
  config: ConfigInspeccion,
): Promise<Blob | null> {
  const generador = GENERADORES[documentKey];
  if (!generador) return null;
  const documento = generador(config);
  return esActaFirmeza(documento)
    ? generarActaFirmezaBlob(documento, config.membreteDataUrl)
    : generarDocumentoLegalBlob(documento, config.membreteDataUrl);
}
