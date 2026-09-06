import type { LegalCase } from '@/shared/legalCases/types';
import { faltantesParaFallo, leerPartes } from './partes';

/**
 * Lo que le falta a la ficha para que el fallo pueda identificar a las dos
 * partes, dicho en el riel. Un expediente al que le falta el nombre del
 * querellado se ve sin abrir el paso.
 */
export function ResumenPartesQuerella({ caso }: { caso: LegalCase }) {
  const faltantes = faltantesParaFallo(leerPartes(caso.caseMetadata));
  const partes = leerPartes(caso.caseMetadata);
  const identificadas = [partes.querellante, partes.querellado].filter(
    (p) => p.nombre.trim().length > 0,
  ).length;

  return (
    <>
      {faltantes.length === 0
        ? 'Las dos partes identificadas'
        : `${identificadas} de 2 partes · faltan ${faltantes.length} datos`}
    </>
  );
}
