import dayjs from 'dayjs';
import {
  generarAutoAvocaCitaAudiencia,
  generarAutoDecretaPruebasSuspende,
  generarAutoInasistencia,
  generarFalloComparendo,
  generarConstanciaIncumplimientoProntoPago,
  generarConstanciaIncumplimientoActividadPedagogica,
  buscarComportamiento,
  type DocumentoLegal,
  type VarianteFallo,
} from '@/derecho';
import { useInspeccionStore } from '@/store/inspeccionStore';
import type { ComparendoDetalle, ComparendoMetadata } from '../types';

/**
 * Documentos del comparendo que este visor sabe reconstruir con los datos
 * REALES ya persistidos en caseMetadata (Task 18, deliverable 3) — mismos
 * documentKey del checklist plantillas-personalizadas (ver
 * shared/documentos/ejemploPlantillas.ts), pero alimentados por el
 * expediente en vez de datos de ejemplo.
 *
 * Se excluyen 'declaracion-testigo' (no hay testimonio persistido por
 * expediente todavía) y 'acta-firmeza' (ActaFirmeza tiene otra forma —
 * dispone singular en vez de resuelve, y convierte el caso a otro caseType;
 * se genera aparte en SiguientePasoComparendo.darTramiteActaFirmeza).
 *
 * Mirror deliberado de los `datosXxx()` de SiguientePasoComparendo.tsx: allí
 * los datos vienen del estado en curso del modal; aquí, del caseMetadata ya
 * persistido (la actuación ya ocurrió) — se acepta la duplicación puntual en
 * vez de forzar un acoplamiento entre el flujo de acciones y este visor.
 */
export type TipoDocumentoComparendo =
  | 'auto-avoca-cita-audiencia'
  | 'auto-decreta-pruebas-suspende'
  | 'auto-inasistencia'
  | 'fallo-comparendo'
  | 'constancia-incumplimiento-pronto-pago'
  | 'constancia-incumplimiento-actividad-pedagogica';

export const TIPOS_DOCUMENTO_COMPARENDO: readonly TipoDocumentoComparendo[] = [
  'auto-avoca-cita-audiencia',
  'auto-decreta-pruebas-suspende',
  'auto-inasistencia',
  'fallo-comparendo',
  'constancia-incumplimiento-pronto-pago',
  'constancia-incumplimiento-actividad-pedagogica',
];

function esTipoDocumentoComparendo(valor: string): valor is TipoDocumentoComparendo {
  return (TIPOS_DOCUMENTO_COMPARENDO as readonly string[]).includes(valor);
}

function datosDespacho() {
  const config = useInspeccionStore.getState().config;
  return {
    municipio: config.municipio || 'Manizales',
    inspeccion: config.inspeccion || 'Inspección Permanente de Convivencia y Paz',
    inspectorNombre: config.inspectorNombre || 'Inspector de Convivencia y Paz',
    inspectorRol: 'Inspector Permanente de Convivencia y Paz',
  };
}

/**
 * Construye el DocumentoLegal real para `tipo` a partir del expediente y su
 * caseMetadata — null cuando la actuación que lo produce todavía no ocurrió
 * (faltan los datos que esa actuación persiste), igual que los `datosXxx()`
 * de SiguientePasoComparendo devuelven null para deshabilitar el botón.
 */
export function generarDocumentoComparendo(
  tipo: TipoDocumentoComparendo,
  caso: ComparendoDetalle,
  meta: Partial<ComparendoMetadata>,
): DocumentoLegal | null {
  const catalogo = buscarComportamiento(caso.articuloNumeral);
  const descripcionConducta = caso.descripcionConducta || catalogo?.descripcionConducta || '(no registrado)';
  const bienJuridico = meta.bienJuridico || catalogo?.bienJuridico || '';
  const medidasCorrectivas = meta.medidasCorrectivas || catalogo?.medidasCorrectivas || '';
  const fechaResolucion = dayjs().format('YYYY-MM-DD');

  switch (tipo) {
    case 'auto-avoca-cita-audiencia': {
      if (!meta.fechaAudiencia || !meta.horaAudiencia) return null;
      return generarAutoAvocaCitaAudiencia({
        ...datosDespacho(),
        fechaResolucion,
        proceso: caso.radicado,
        comparendo: caso.numeroComparendo,
        fechaComparendo: caso.fechaComparendo,
        articuloNumeral: caso.articuloNumeral,
        solicitado: caso.infractor,
        cedulaSolicitado: caso.cedula,
        medioImpugnacion: meta.medioImpugnacion === 'correo_electronico' ? 'correo_electronico' : 'personal',
        fechaAudiencia: meta.fechaAudiencia,
        horaAudiencia: meta.horaAudiencia,
        lugarAudiencia: meta.lugarAudiencia || '',
        medioNotificacionAutorizado: meta.medioNotificacionAutorizado,
      });
    }

    case 'auto-decreta-pruebas-suspende': {
      if (!meta.pruebasDecretadas?.length || !meta.fechaReanudacion) return null;
      return generarAutoDecretaPruebasSuspende({
        ...datosDespacho(),
        fechaResolucion,
        proceso: caso.radicado,
        comparendo: caso.numeroComparendo,
        articuloNumeral: caso.articuloNumeral,
        fechaComparendo: caso.fechaComparendo,
        lugarComportamiento: caso.lugar,
        solicitado: caso.infractor,
        cedulaSolicitado: caso.cedula,
        direccionSolicitado: caso.direccion,
        telefonoSolicitado: caso.telefono,
        solicitante: caso.solicitante,
        tipoMulta: caso.tipoMulta,
        hechos: caso.hechos,
        descripcionConducta,
        bienJuridico,
        medidasCorrectivas,
        apeloSiNo: meta.apeloSiNo || 'NO',
        descargos: meta.descargos || '',
        pruebasDecretadas: meta.pruebasDecretadas,
        fechaReanudacion: meta.fechaReanudacion,
      });
    }

    case 'auto-inasistencia': {
      if (!meta.fechaAudienciaAnterior && !meta.fechaAudiencia) return null;
      return generarAutoInasistencia({
        ...datosDespacho(),
        fechaResolucion,
        horaAudiencia: meta.horaAudiencia || 'NO REGISTRA',
        proceso: caso.radicado,
        comparendo: caso.numeroComparendo,
        articuloNumeral: caso.articuloNumeral,
        fechaComparendo: caso.fechaComparendo,
        lugarComportamiento: caso.lugar,
        solicitado: caso.infractor,
        cedulaSolicitado: caso.cedula,
        direccionSolicitado: caso.direccion,
        telefonoSolicitado: caso.telefono,
        solicitante: caso.solicitante,
        hechos: caso.hechos,
        descripcionConducta,
        bienJuridico,
        medidasCorrectivas,
        medioNotificacionAutorizado: meta.medioNotificacionAutorizado,
        fechaNotificacionPrevia: meta.fechaAudiencia || fechaResolucion,
      });
    }

    case 'fallo-comparendo': {
      const variante = meta.varianteFallo as VarianteFallo | undefined;
      if (!variante) return null;
      return generarFalloComparendo({
        ...datosDespacho(),
        fechaResolucion,
        proceso: caso.radicado,
        comparendo: caso.numeroComparendo,
        articuloNumeral: caso.articuloNumeral,
        fechaComparendo: caso.fechaComparendo,
        lugarComportamiento: caso.lugar,
        solicitado: caso.infractor,
        cedulaSolicitado: caso.cedula,
        direccionSolicitado: caso.direccion,
        telefonoSolicitado: caso.telefono,
        solicitante: caso.solicitante,
        hechos: caso.hechos,
        descripcionConducta,
        bienJuridico,
        medidasCorrectivas,
        apeloSiNo: meta.apeloSiNo || 'NO',
        tipoMulta: caso.tipoMulta,
        descargos: meta.descargos || '',
        pruebasPracticadas: meta.pruebasPracticadas || [],
        variante,
        fechaAudienciaAnterior: meta.fechaAudienciaAnterior,
        aplicaActividadPedagogica: meta.aplicaActividadPedagogica,
        cuentaRecaudo: meta.cuentaRecaudo,
        titularCuenta: meta.titularCuenta,
        nitTitular: meta.nitTitular,
        comparecioVoluntariamente: meta.comparecioVoluntariamente,
        terminoActividadPedagogica: meta.terminoActividadPedagogica,
      });
    }

    case 'constancia-incumplimiento-pronto-pago': {
      if (!meta.documentoCobro) return null;
      return generarConstanciaIncumplimientoProntoPago({
        ...datosDespacho(),
        fechaResolucion,
        proceso: caso.radicado,
        comparendo: caso.numeroComparendo,
        fechaComparendo: caso.fechaComparendo,
        tipoMulta: caso.tipoMulta,
        solicitado: caso.infractor,
        cedulaSolicitado: caso.cedula,
        documentoCobro: meta.documentoCobro,
      });
    }

    case 'constancia-incumplimiento-actividad-pedagogica': {
      if (!meta.firmanteNombre || !meta.firmanteRol) return null;
      const despacho = datosDespacho();
      return generarConstanciaIncumplimientoActividadPedagogica({
        municipio: despacho.municipio,
        inspeccion: despacho.inspeccion,
        firmanteNombre: meta.firmanteNombre,
        firmanteRol: meta.firmanteRol,
        fechaResolucion,
        proceso: caso.radicado,
        comparendo: caso.numeroComparendo,
        solicitado: caso.infractor,
        cedulaSolicitado: caso.cedula,
      });
    }

    default:
      return null;
  }
}

/** Documentos con datos suficientes hoy en el expediente — lo que ComparendoDetailPage ofrece navegar/editar. */
export function documentosComparendoDisponibles(
  caso: ComparendoDetalle,
  meta: Partial<ComparendoMetadata>,
): TipoDocumentoComparendo[] {
  return TIPOS_DOCUMENTO_COMPARENDO.filter((tipo) => generarDocumentoComparendo(tipo, caso, meta) !== null);
}

export function tipoDocumentoComparendoDesdeParam(valor: string | undefined): TipoDocumentoComparendo | null {
  return valor && esTipoDocumentoComparendo(valor) ? valor : null;
}
