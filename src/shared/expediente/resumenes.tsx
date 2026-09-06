import { useCaseDocuments } from '@/shared/documentos/api';
import { useCaseEvidence } from '@/shared/pruebas/api';
import { leerOrientaciones } from '@/shared/orientaciones/types';
import type { LegalCase } from '@/shared/legalCases/types';

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

export function ResumenFallo({ caso }: { caso: LegalCase }) {
  return <>{caso.legalReasoning?.trim() ? 'Borrador redactado' : 'Sin borrador'}</>;
}
