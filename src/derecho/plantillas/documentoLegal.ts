/**
 * Tipo estructurado compartido por los generadores de autos y constancias del
 * despacho (avoca cita a audiencia, decreta pruebas y suspende, inasistencia,
 * constancias de incumplimiento). Generaliza el patrón de `ActaFirmeza`
 * (entidad/epigrafe/tablaDatos/secciones/cierre/firma) sin modificar
 * `actaFirmeza.ts`: aquí la parte dispositiva se llama `resuelve` (algunas
 * constancias no tienen ninguna) y `firma` es una lista, porque ciertos
 * autos llevan firma adicional del ciudadano notificado.
 */
export interface FirmaLinea {
  nombre: string;
  rol: string;
  tipo?: 'notificado';
}

export interface SeccionDocumento {
  titulo?: string;
  parrafos: string[];
}

export interface DocumentoLegal {
  entidad: string;
  tituloDocumento: string;
  proceso: string;
  fechaResolucionLetras: string;
  epigrafe?: string;
  tablaDatos: { etiqueta: string; valor: string }[];
  secciones: SeccionDocumento[];
  resuelve: string[];
  cierre: string;
  firma: FirmaLinea[];
}

/**
 * Incluye `valor` en el arreglo únicamente si `condicion` se cumple.
 * Mecanismo genérico para los slots `condicion:` de las plantillas OKF
 * (p. ej. la firma del ciudadano notificado solo cuando
 * `medioImpugnacion == personal`) — un único punto de implementación en vez
 * de repetir if/else ad hoc en cada generador.
 */
export function incluirSi<T>(condicion: boolean, valor: T): T[] {
  return condicion ? [valor] : [];
}
