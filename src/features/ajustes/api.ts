import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';

export interface TokenUsageSummary {
  userId: string;
  promptTokens: number;
  completionTokens: number;
  thinkingTokens: number;
  totalTokens: number;
  limiteTokens: number;
  periodo: string; // "yyyy-MM"
}

/** Consumo de IA del mes en curso contra el límite del plan gratuito - ver core-monitoring-service. */
export function useTokenUsageSummary() {
  return useQuery({
    queryKey: ['token-usage-summary'],
    queryFn: () => apiFetch<TokenUsageSummary>('/monitoring/token-usage/summary'),
    staleTime: 60_000,
  });
}
