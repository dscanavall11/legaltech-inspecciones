/** Dispara la descarga de un Blob ya generado (p. ej. un PDF con ediciones aplicadas) con el nombre dado. */
export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Revocar de inmediato puede invalidar la URL antes de que el navegador
  // termine de leer el blob para la descarga (falla intermitente, más
  // probable cuanto más pesado el archivo, p. ej. el .zip de un lote grande).
  // Se da margen a que la descarga arranque antes de liberar memoria.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
