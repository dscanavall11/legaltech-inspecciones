import type { Fallo } from '@/features/fallos/types';

// Mocks solo se sirven si VITE_ENABLE_MOCKS=true (apagado por defecto en este
// entorno) - datos mínimos, coherentes con el tipo real (ver features/fallos/types.ts).
export const fallosMock: Fallo[] = [
  {
    id: 'f-001',
    radicado: '2026-00145',
    tipo: 'querella',
    fechaFallo: '2026-06-15',
    querellante: 'María Fernanda Gómez',
    querellado: 'Carlos Andrés Ruiz',
    comportamiento: 'Perturbación a la posesión — construcción irregular que invade servidumbre de paso.',
    fundamentacion: 'Probada la perturbación mediante inspección ocular y testimonios contestes.',
    pruebas: 'Acta de inspección ocular, testimonios de vecinos.',
    estado: 'en_firmeza',
  },
  {
    id: 'f-002',
    radicado: '2026-00138',
    tipo: 'queja',
    fechaFallo: '2026-05-30',
    querellante: 'Conjunto Residencial El Roble',
    querellado: 'DJ Eventos El Ritmo',
    comportamiento: 'Perturbación a la tranquilidad — ruido excesivo reiterado en horas de descanso nocturno.',
    fundamentacion: 'Las mediciones de ruido superaron los límites del Decreto 948/1995.',
    pruebas: 'Mediciones de sonómetro.',
    estado: 'apelado',
  },
];
