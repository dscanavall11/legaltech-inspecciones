/**
 * Identidad del asistente de IA de la plataforma: Legal, la mascota IA de
 * LegalTech. Fuente única para el nombre en toda la app — no repetir el string
 * suelto; cambiar aquí re-marca todos los touchpoints (chat, drawer, textos).
 */
import { saludoPorHora } from '@/shared/util/fechas';

export const NORMA = {
  nombre: 'Legal',
  rol: 'Tu asistente jurídico',
  saludo: saludoPorHora,
} as const;
