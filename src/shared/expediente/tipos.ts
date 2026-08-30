import type { LegalCase } from '@/shared/legalCases/types';

/**
 * Un paso del recorrido de un expediente. El área de trabajo no sabe de
 * querellas ni de quejas: recibe los pasos ya escritos en el vocabulario del
 * trámite y solo se ocupa de la navegación entre ellos.
 */
export interface PasoExpediente {
  clave: string;
  titulo: string;
  /** Una línea: qué se hace aquí y qué norma lo exige. */
  ayuda: string;
  /**
   * Estado del paso pintado en el riel: "3 documentos", "faltan las dos
   * partes". Es un componente y no una función pura porque el dato de algunos
   * pasos vive en una consulta —los documentos, las pruebas— y react-query
   * comparte la caché con el lienzo, así que no cuesta una llamada de más.
   */
  Resumen?: (props: { caso: LegalCase }) => React.ReactNode;
  render: (caso: LegalCase) => React.ReactNode;
}

/** Los textos que cambian entre trámites en la pantalla de arranque. */
export interface TextosExpediente {
  titulo: string;
  descripcion: string;
  /** Qué se suelta en la zona de arrastre, en palabras del despacho. */
  documentosEsperados: string;
  buscar: string;
  vacio: string;
}
