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
export * from './etapas';
export * from './letras';
export * from './multas';
export * from './plantillas/actaFirmeza';
