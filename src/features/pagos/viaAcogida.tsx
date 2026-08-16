import type { ReactNode } from 'react';
import { DatePicker, Input } from 'antd';
import dayjs from 'dayjs';
import {
  generarActaConmutacion,
  generarActaProntoPago,
  TIPOS_CONMUTACION_PERMITIDOS,
  MULTA_GENERAL,
  type DocumentoLegal,
  type RutaComparendo,
  type TipoMulta,
} from '@/derecho';
import { CampoActa } from './CampoActa';
import type { FormularioAcogida } from './formularioAcogida';

/**
 * Descripción de una vía de acogida del art. 180 par. Cada vía tiene su propia
 * área de trabajo, y todo lo que las diferencia vive aquí: el área en sí
 * (AreaTrabajoAcogida) no conoce ninguna vía concreta, así que agregar una
 * nueva no la toca.
 */
export interface ViaAcogida {
  clave: Extract<RutaComparendo, 'pronto_pago' | 'conmutacion'>;
  titulo: string;
  descripcion: string;
  /** Tipos de multa que admiten la vía; ausente = todos. */
  tiposPermitidos?: readonly TipoMulta[];
  /** Explicación que se muestra cuando el tipo de multa no admite la vía. */
  restriccion?: (tipoMulta: TipoMulta) => string;
  /** El 50% del art. 180 par. solo lo aplica el pronto pago. */
  aplicaDescuento: boolean;
  /** Rótulo del total en el desglose de liquidación. */
  totalLabel: string;
  /** Campos que solo pide esta vía. */
  camposPropios: (
    datos: FormularioAcogida,
    set: <K extends keyof FormularioAcogida>(k: K, v: FormularioAcogida[K]) => void,
  ) => ReactNode;
  generarActa: (datos: FormularioAcogida) => DocumentoLegal;
}

/** Campos que comparten los dos generadores de acta. */
function comunes(datos: FormularioAcogida) {
  return {
    municipio: datos.municipio,
    inspeccion: datos.inspeccion,
    inspectorNombre: datos.inspectorNombre,
    inspectorRol: datos.inspectorRol,
    proceso: datos.proceso,
    fechaResolucion: datos.fechaResolucion,
    comparendo: datos.comparendo,
    fechaComparendo: datos.fechaComparendo,
    articuloNumeral: datos.articuloNumeral,
    solicitado: datos.solicitado,
    cedula: datos.cedula,
    direccion: datos.direccion,
    telefono: datos.telefono,
    tipoMulta: datos.tipoMulta,
    causal: datos.causal,
    causalEvidencia: datos.causalEvidencia,
  };
}

export const VIA_PRONTO_PAGO: ViaAcogida = {
  clave: 'pronto_pago',
  titulo: 'Pronto pago',
  descripcion:
    'Descuento del 50% sobre el valor de la multa cuando el ciudadano se presenta dentro de los cinco (5) días hábiles siguientes al comparendo (parágrafo del artículo 180 de la Ley 1801 de 2016, modificado por el artículo 42 de la Ley 2197 de 2022). El descuento se aplica sobre el valor ya incrementado por reincidencia, si la hay.',
  aplicaDescuento: true,
  totalLabel: 'Valor a pagar',
  camposPropios: (datos, set) => (
    <CampoActa label="No. de recibo de cobro expedido">
      <Input
        value={datos.documentoCobro}
        onChange={(e) => set('documentoCobro', e.target.value)}
        placeholder="RC-2026-000000"
      />
    </CampoActa>
  ),
  generarActa: (datos) =>
    generarActaProntoPago({ ...comunes(datos), documentoCobro: datos.documentoCobro }),
};

export const VIA_CONMUTACION: ViaAcogida = {
  clave: 'conmutacion',
  titulo: 'Conmutación',
  descripcion:
    'Conmutación de la multa por participación en actividad pedagógica o trabajo comunitario (parágrafo del artículo 180 de la Ley 1801 de 2016). Solo procede para multas generales tipo 1 y tipo 2. Si el ciudadano no acredita la actividad dentro del plazo, se cobra el valor total de la multa.',
  tiposPermitidos: TIPOS_CONMUTACION_PERMITIDOS,
  restriccion: (tipoMulta) =>
    `La conmutación solo aplica a multas tipo 1 y 2 (art. 180 par.). La multa de este comparendo es tipo ${tipoMulta} (${MULTA_GENERAL[tipoMulta].smdlv} SMDLV), así que esta vía no procede: corresponde pronto pago o acta de firmeza.`,
  aplicaDescuento: false,
  totalLabel: 'Valor de cobro si incumple la actividad',
  camposPropios: (datos, set) => (
    <>
      <CampoActa label="Actividad / programa comunitario asignado">
        <Input value={datos.actividadAsignada} onChange={(e) => set('actividadAsignada', e.target.value)} />
      </CampoActa>
      <CampoActa label="Entidad u operador del programa">
        <Input
          value={datos.entidadPrograma}
          onChange={(e) => set('entidadPrograma', e.target.value)}
          placeholder="Secretaría de Gobierno Municipal…"
        />
      </CampoActa>
      <CampoActa label="Plazo para acreditar la actividad">
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          value={dayjs(datos.fechaLimiteActividad)}
          onChange={(d) => d && set('fechaLimiteActividad', d.format('YYYY-MM-DD'))}
        />
      </CampoActa>
    </>
  ),
  generarActa: (datos) =>
    generarActaConmutacion({
      ...comunes(datos),
      actividadAsignada: datos.actividadAsignada,
      entidadPrograma: datos.entidadPrograma,
      fechaLimiteActividad: datos.fechaLimiteActividad,
    }),
};

/** La vía procede para este tipo de multa. */
export function viaAdmiteTipo(via: ViaAcogida, tipoMulta: TipoMulta): boolean {
  return via.tiposPermitidos === undefined || via.tiposPermitidos.includes(tipoMulta);
}
