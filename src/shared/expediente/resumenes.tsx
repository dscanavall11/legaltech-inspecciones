import { useCaseDocuments } from '@/shared/documentos/api';
import { useCaseEvidence } from '@/shared/pruebas/api';
import { leerOrientaciones } from '@/shared/orientaciones/types';
import { parseCaseMetadata, type LegalCase } from '@/shared/legalCases/types';
import { APARTES_FALLO, type BorradorFallo } from '@/features/analisis/falloDocumento';

/**
 * El borrador tal como quedó repartido al guardarlo: dos apartes viajan en
 * columnas propias de legal-cases y el resto en el blob opaco (ver
 * `guardarBorradorEnCampos` en AnalisisPage).
 */
function leerBorradorGuardado(caso: LegalCase): Partial<Record<keyof BorradorFallo, string>> {
  const meta = parseCaseMetadata<Record<string, string>>(caso.caseMetadata);
  return {
    ...meta,
    evidences: caso.evidenceAssessment ?? '',
    juridicResponse: caso.legalReasoning ?? '',
  };
}

/**
 * Los resúmenes que el riel pinta bajo cada paso. Sirven para no tener que
 * entrar a un paso para saber si falta algo, que era el motivo por el que
 * antes se pintaban los cinco a la vez.
 *
 * Los de documentos y pruebas usan las mismas consultas que el lienzo:
 * react-query comparte la caché por clave, así que el riel no cuesta una
 * llamada de más.
 */

const plural = (n: number, uno: string, varios: string) =>
  n === 0 ? `Sin ${varios}` : `${n} ${n === 1 ? uno : varios}`;

export function ResumenDocumentos({ caso }: { caso: LegalCase }) {
  const { data, isLoading } = useCaseDocuments(caso.id);
  if (isLoading) return <>Cargando…</>;
  return <>{plural(data?.length ?? 0, 'documento', 'documentos')}</>;
}

export function ResumenPruebas({ caso }: { caso: LegalCase }) {
  const { data, isLoading } = useCaseEvidence(caso.id);
  if (isLoading) return <>Cargando…</>;
  return <>{plural(data?.length ?? 0, 'prueba', 'pruebas')}</>;
}

export function ResumenOrientacion({ caso }: { caso: LegalCase }) {
  const texto = leerOrientaciones(caso.caseMetadata).texto.trim();
  return <>{texto.length === 0 ? 'Sin anotaciones' : `${texto.split(/\s+/).length} palabras`}</>;
}

/**
 * El avance del proyecto de decisión. Lleva la cuenta de apartes que antes
 * pintaba el bloque de cuatro tarjetas dentro del lienzo: la misma
 * información, pero en el único sitio que ya se ocupaba del progreso.
 */
export function ResumenFallo({ caso }: { caso: LegalCase }) {
  const borrador = leerBorradorGuardado(caso);
  const diligenciados = APARTES_FALLO.filter(
    ({ campo }) => (borrador[campo] ?? '').trim().length > 0,
  ).length;

  return (
    <>
      {diligenciados === 0
        ? 'Sin borrador'
        : `${diligenciados} de ${APARTES_FALLO.length} apartes`}
    </>
  );
}
