/**
 * Checklist de verificación humana del comparendo (`verificar_comparendo`,
 * recibido -> verificado) — espejo declarativo, no se lee en runtime, de:
 *   okf-bundles/roles-profesionales/inspector-policia/checklists/comparendo.md
 * Los 7 ítems y su orden deben coincidir con ese archivo; cualquier cambio
 * de criterio de verificación se hace primero allí, no aquí.
 */
export interface ItemChecklistVerificacion {
  key: string;
  label: string;
}

export const CHECKLIST_VERIFICACION_COMPARENDO: ReadonlyArray<ItemChecklistVerificacion> = [
  { key: 'firma-infractor', label: 'Firma del infractor' },
  { key: 'fotos-conformes', label: 'Fotos conformes' },
  { key: 'fecha-en-termino', label: 'Fecha dentro del término' },
  { key: 'causal-coincidente', label: 'Causal coincidente' },
  { key: 'tipo-multa-correcto', label: 'Tipo de multa correcto' },
  { key: 'direccion-completa', label: 'Dirección completa' },
  { key: 'datos-legibles', label: 'Datos legibles' },
];
