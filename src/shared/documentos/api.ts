import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { documentTypeFromFileName, type CaseDocument, type CaseDocumentOrigin } from './types';

/** Shape real de CaseDocumentDTO (legalcase, Querellas Fase 1) - ver ExpedienteController en orchestrator. */
interface CaseDocumentDTO {
  id: number;
  originalFileName: string;
  documentType: string;
  contributingParty: string | null;
  origin: string | null;
  uploadDate: string | null;
  sourceReference: string | null;
  storageKey: string | null;
}

function toCaseDocument(dto: CaseDocumentDTO): CaseDocument {
  return {
    id: String(dto.id),
    fileName: dto.originalFileName,
    // documentType de legalcase es la categoría jurídica (SPEC_QUERELLAS.md §3), no el
    // formato del archivo - el ícono/estilo de la UI se deriva del nombre, no de ese campo.
    fileType: documentTypeFromFileName(dto.originalFileName),
    origin: (dto.origin as CaseDocumentOrigin | null) ?? null,
    date: dto.uploadDate,
    fileSize: null,
    storageKey: dto.storageKey,
  };
}

export const documentsKeys = {
  byCase: (caseId: string) => ['documentos', caseId] as const,
};

/** Ficha de documentos archivados para el caso - legalcase, GET vía orchestrator. */
export function useCaseDocuments(caseId: string) {
  return useQuery({
    queryKey: documentsKeys.byCase(caseId),
    queryFn: async () => {
      const docs = await apiFetch<CaseDocumentDTO[]>(`/tools/expedientes/${caseId}/documents`);
      return docs.map(toCaseDocument);
    },
    enabled: Boolean(caseId),
  });
}

/** Sube el archivo a S3 (legaltech-tools) y registra la ficha en legalcase, en un solo paso. */
export function useUploadCaseDocument(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (archivo: File) => {
      const body = new FormData();
      body.append('file', archivo, archivo.name);
      const dto = await apiFetch<CaseDocumentDTO>(`/tools/expedientes/${caseId}/documents`, {
        method: 'POST',
        body,
      });
      return toCaseDocument(dto);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKeys.byCase(caseId) });
    },
  });
}

/**
 * Saca el documento del expediente. No es solo quitarlo del listado: el
 * servidor purga tambien el gemelo Markdown, que es lo que lee el analizador,
 * asi que un documento retirado deja de pesar en el borrador del fallo.
 */
export function useDeleteCaseDocument(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      apiFetch<void>(`/tools/expedientes/${caseId}/documents/${documentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKeys.byCase(caseId) });
    },
  });
}

/** URL presignada de descarga (S3/MinIO), valida solo unos minutos. */
export async function getCaseDocumentDownloadUrl(caseId: string, storageKey: string): Promise<string> {
  const { url } = await apiFetch<{ url: string }>(
    `/tools/expedientes/${caseId}/documents/url?key=${encodeURIComponent(storageKey)}`,
  );
  return url;
}
