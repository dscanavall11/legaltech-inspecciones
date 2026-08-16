import dayjs from 'dayjs';
import type { CausalIncremento, TipoMulta } from '@/derecho';
import { useInspeccionStore } from '@/store/inspeccionStore';

/**
 * Datos que llena el inspector en cualquier vía de acogida. Es un único
 * formulario a propósito: pronto pago y conmutación piden lo mismo del
 * comparendo y del despacho, y solo divergen en tres campos al final (ver
 * `ViaAcogida.camposPropios`).
 *
 * Los datos del despacho salen de la configuración de la inspección
 * (useInspeccionStore), que es donde el inspector los diligencia una sola vez.
 * La pantalla anterior leía además una copia en localStorage que nadie
 * escribía nunca: se eliminó en vez de arreglarse, porque duplicaba una
 * configuración que ya existe.
 */
export interface FormularioAcogida {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  proceso: string;
  fechaResolucion: string; // ISO
  comparendo: string;
  fechaComparendo: string; // ISO
  articuloNumeral: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono: string;
  solicitante: string;
  hechos: string;
  tipoMulta: TipoMulta;
  causal: CausalIncremento;
  causalEvidencia: string;
  // Propios de pronto pago
  documentoCobro: string;
  // Propios de conmutación
  actividadAsignada: string;
  entidadPrograma: string;
  fechaLimiteActividad: string; // ISO
}

const DATOS_INICIALES: FormularioAcogida = {
  municipio: '',
  inspeccion: '',
  inspectorNombre: '',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz',
  proceso: '',
  fechaResolucion: dayjs().format('YYYY-MM-DD'),
  comparendo: '',
  fechaComparendo: '',
  articuloNumeral: '',
  solicitado: '',
  cedula: '',
  direccion: '',
  telefono: '',
  solicitante: '',
  hechos: '',
  tipoMulta: 1,
  causal: 'ninguna',
  causalEvidencia: '',
  documentoCobro: '',
  actividadAsignada: 'Jornada pedagógica de convivencia ciudadana',
  entidadPrograma: '',
  fechaLimiteActividad: dayjs().add(30, 'day').format('YYYY-MM-DD'),
};

/** Estado inicial: en blanco, salvo lo que ya está configurado para la inspección. */
export function datosInicialesAcogida(): FormularioAcogida {
  const config = useInspeccionStore.getState().config;
  return {
    ...DATOS_INICIALES,
    municipio: config.municipio || DATOS_INICIALES.municipio,
    inspeccion: config.inspeccion || DATOS_INICIALES.inspeccion,
    inspectorNombre: config.inspectorNombre || DATOS_INICIALES.inspectorNombre,
  };
}
