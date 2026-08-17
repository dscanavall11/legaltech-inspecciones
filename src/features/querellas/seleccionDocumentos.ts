/**
 * `beforeUpload` de Ant Design corre **una vez por archivo**, pero cada llamada
 * recibe la selección completa. Abrir el expediente en todas las llamadas creaba
 * un expediente por documento: tres archivos, tres querellas.
 *
 * Esta función marca cuál de esas llamadas es la que actúa. Vive aparte porque
 * el error ya se cometió una vez y un test lo caza; dentro del JSX no había
 * dónde probarlo.
 */
export function abreElExpediente<T>(archivo: T, seleccion: readonly T[]): boolean {
  return seleccion.length > 0 && archivo === seleccion[0];
}
