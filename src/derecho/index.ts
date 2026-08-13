/**
 * Paquete de derecho — núcleo jurídico de la plataforma.
 *
 * Centraliza los conceptos legales que la interfaz necesita: normativa y
 * artículos citados, términos procesales, vías de trámite, máquinas de
 * estado de cada proceso y sus etapas. Importar siempre desde '@/derecho'.
 */
export * from './normativa';
export * from './flujoQuerella';
export * from './flujoQueja';
export * from './flujoComparendo';
export * from './flujoNavegableEstado';
export * from './etapas';
export * from './letras';
export * from './diasHabiles';
export * from './multas';
export * from './catalogoComportamientos';
export * from './plantillas/actaFirmeza';
export * from './plantillas/documentoLegal';
export * from './plantillas/actaProntoPago';
export * from './plantillas/actaConmutacion';
export * from './plantillas/expedientePrevio';
export * from './plantillas/autoAvocaCitaAudiencia';
export * from './plantillas/autoDecretaPruebasSuspende';
export * from './plantillas/autoInasistencia';
export * from './plantillas/constanciasIncumplimiento';
export * from './plantillas/falloComparendo';
export * from './plantillas/declaracionTestigo';
