import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import type { CaseEvidence, EvidenceContributor, EvidenceType } from './types';

interface CaseEvidenceDTO {
  id: number;
  identifier: string;
  evidenceType: EvidenceType;
  description: string | null;
  date: string | null;
  contributor: EvidenceContributor | null;
  purpose: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: string | null;
  storageKey: string | null;
  uploadedAt: string | null;
  hasFile: boolean;
}

function toCaseEvidence(dto: CaseEvidenceDTO): CaseEvidence {
  return { ...dto, id: String(dto.id) };
}

export const evidenceKeys = {
  byCase: (caseId: string) => ['pruebas', caseId] as const,
};

/** Pruebas registradas para el caso - legalcase, GET vía orchestrator. */
export function useCaseEvidence(caseId: string) {
  return useQuery({
    queryKey: evidenceKeys.byCase(caseId),
    queryFn: async () => {
      const pruebas = await apiFetch<CaseEvidenceDTO[]>(`/tools/expedientes/${caseId}/evidence`);
      return pruebas.map(toCaseEvidence);
    },
    enabled: Boolean(caseId),
  });
}

export interface RegisterEvidenceInput {
  evidenceType: EvidenceType;
  description?: string;
  date?: string; // ISO date
  contributor?: EvidenceContributor;
  purpose?: string;
  file?: File | null;
}

/** Registra una prueba: sube el archivo a S3 (si lo hay) y asigna el identificador en legalcase, en un solo paso. */
export function useRegisterCaseEvidence(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterEvidenceInput) => {
      const body = new FormData();
      body.append('evidenceType', input.evidenceType);
      if (input.description) body.append('description', input.description);
      if (input.date) body.append('date', input.date);
      if (input.contributor) body.append('contributor', input.contributor);
      if (input.purpose) body.append('purpose', input.purpose);
      if (input.file) body.append('file', input.file, input.file.name);

      const dto = await apiFetch<CaseEvidenceDTO>(`/tools/expedientes/${caseId}/evidence`, {
        method: 'POST',
        body,
      });
      return toCaseEvidence(dto);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evidenceKeys.byCase(caseId) });
    },
  });
}

/** Elimina una prueba del expediente. */
export function useDeleteCaseEvidence(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (evidenceId: string) => {
      await apiFetch<void>(`/tools/expedientes/${caseId}/evidence/${evidenceId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evidenceKeys.byCase(caseId) });
    },
  });
}
