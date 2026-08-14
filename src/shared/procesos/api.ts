import { useLegalCases } from '@/shared/legalCases/api';
import { legalCaseAFila } from './types';

export interface ConsultaProcesos {
  /** Ausente = todos los tipos (bandeja "Mis procesos"). */
  caseType?: string;
  size?: number;
}

export function useProcesos({ caseType, size = 200 }: ConsultaProcesos = {}) {
  const query = useLegalCases({ caseType, size });
  return {
    ...query,
    data: query.data?.content.map(legalCaseAFila),
  };
}
