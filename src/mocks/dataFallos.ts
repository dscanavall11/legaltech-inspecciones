import type { Fallo } from '@/features/fallos/types';

export const fallosMock: Fallo[] = [
  {
    id: 'f-001',
    radicado: '2026-00145',
    tipo: 'querella',
    fechaFallo: '2026-06-15',
    inspector: 'Inspector Jorge Hernández Castro',
    querellante: 'María Fernanda Gómez',
    querellado: 'Carlos Andrés Ruiz',
    comportamiento:
      'Perturbación a la posesión — construcción irregular que invade servidumbre de paso del predio vecino.',
    articuloInfringido: 'Art. 77 Ley 1801 de 2016',
    decision: 'FAVORABLE',
    fundamentacion:
      'Probada la perturbación mediante inspección ocular y testimonios contestes. El querellado no acreditó licencia de construcción ni derecho que ampare la obra que invade la servidumbre.',
    medidasCorrectivas: [
      {
        tipo: 'restauracion',
        descripcion: 'Demolición de la obra irregular y restitución de la servidumbre en 15 días hábiles.',
      },
      {
        tipo: 'multa',
        descripcion: 'Multa por perturbación a la posesión.',
        valorUPM: 4,
      },
    ],
    estado: 'en_firmeza',
    fechaFirmeza: '2026-06-25',
  },
  {
    id: 'f-002',
    radicado: '2026-00138',
    tipo: 'querella',
    fechaFallo: '2026-05-30',
    inspector: 'Inspector Jorge Hernández Castro',
    querellante: 'Conjunto Residencial El Roble',
    querellado: 'DJ Eventos El Ritmo',
    comportamiento:
      'Perturbación a la tranquilidad — ruido excesivo reiterado en horas de descanso nocturno (22:00–06:00).',
    articuloInfringido: 'Art. 33 Ley 1801 de 2016',
    decision: 'FAVORABLE',
    fundamentacion:
      'Las mediciones de ruido realizadas superaron los límites del Decreto 948/1995. El querellado no aportó prueba de cumplimiento de normas técnicas de emisión.',
    medidasCorrectivas: [
      {
        tipo: 'multa',
        descripcion: 'Multa por perturbación a la tranquilidad nocturna.',
        valorUPM: 8,
      },
      {
        tipo: 'suspension',
        descripcion: 'Suspensión de actividades con amplificación sonora en horario 22:00–06:00.',
      },
    ],
    estado: 'apelado',
    apelacion: {
      fechaApelacion: '2026-06-05',
      resultado: 'pendiente',
    },
  },
  {
    id: 'f-003',
    radicado: '2026-00121',
    tipo: 'querella',
    fechaFallo: '2026-04-18',
    inspector: 'Inspector Jorge Hernández Castro',
    querellante: 'Luz Marina Ospina',
    querellado: 'Andrés Camilo Vargas Bedoya',
    comportamiento:
      'Conflicto entre vecinos — amenazas verbales y hostigamiento reiterado.',
    articuloInfringido: 'Art. 27 Ley 1801 de 2016',
    decision: 'CONCILIACION',
    fundamentacion:
      'Las partes llegaron a acuerdo conciliatorio en audiencia pública. Se levantó acta de conciliación con compromisos recíprocos de convivencia pacífica y silencio administrativo.',
    medidasCorrectivas: [],
    estado: 'en_firmeza',
    fechaFirmeza: '2026-04-18',
  },
  {
    id: 'f-004',
    radicado: '2026-00234',
    tipo: 'proceso_verbal',
    fechaFallo: '2026-07-01',
    inspector: 'Inspector Jorge Hernández Castro',
    querellante: 'Municipio (de oficio)',
    querellado: 'Supermercado El Ahorro Express',
    comportamiento:
      'Ocupación indebida del espacio público — exhibición de mercancías en andén sin permiso.',
    articuloInfringido: 'Art. 140 Ley 1801 de 2016',
    decision: 'FAVORABLE',
    fundamentacion:
      'Verificada la ocupación de 4 metros lineales de andén público mediante acta de inspección. No existe permiso de la administración municipal que ampare la ocupación.',
    medidasCorrectivas: [
      {
        tipo: 'decomiso_temporal',
        descripcion: 'Decomiso temporal de mercancías ubicadas en espacio público.',
      },
      {
        tipo: 'multa',
        descripcion: 'Multa por ocupación del espacio público.',
        valorUPM: 16,
      },
    ],
    estado: 'notificado',
  },
  {
    id: 'f-005',
    radicado: '2025-00876',
    tipo: 'querella',
    fechaFallo: '2026-01-22',
    inspector: 'Inspector Jorge Hernández Castro',
    querellante: 'Yolanda Pinzón Castro',
    querellado: 'Carlos Manuel Soto Reina',
    comportamiento:
      'Perturbación a la posesión — cerramiento de camino de herradura de uso colectivo.',
    articuloInfringido: 'Art. 77 Ley 1801 de 2016',
    decision: 'DESFAVORABLE',
    fundamentacion:
      'La querellante no logró acreditar el uso colectivo del camino por más de un año. Los testimonios presentados no fueron contestes en la identificación del predio ni del trayecto afectado.',
    medidasCorrectivas: [],
    estado: 'en_firmeza',
    fechaFirmeza: '2026-02-01',
  },
  {
    id: 'f-006',
    radicado: '2025-00654',
    tipo: 'querella',
    fechaFallo: '2025-11-10',
    inspector: 'Inspector Jorge Hernández Castro',
    querellante: 'Álvaro Restrepo Henao',
    querellado: 'Ferretería Los Pinos',
    comportamiento:
      'Perturbación a la posesión — arrojo de escombros y materiales de construcción en zona de paso peatonal.',
    articuloInfringido: 'Art. 92 Ley 1801 de 2016',
    decision: 'FAVORABLE',
    fundamentacion:
      'Mediante registro fotográfico e inspección ocular se verificó el arrojo de escombros en el espacio público frente al establecimiento. El querellado reconoció el hecho pero alegó fuerza mayor sin acreditarla.',
    medidasCorrectivas: [
      {
        tipo: 'restauracion',
        descripcion: 'Retiro de escombros y limpieza de la zona en 5 días hábiles.',
      },
      {
        tipo: 'multa',
        descripcion: 'Multa por arrojo de escombros en espacio público.',
        valorUPM: 2,
      },
    ],
    estado: 'confirmado',
    apelacion: {
      fechaApelacion: '2025-11-20',
      resultado: 'confirmado',
      fechaResolucion: '2025-12-15',
    },
  },
];
