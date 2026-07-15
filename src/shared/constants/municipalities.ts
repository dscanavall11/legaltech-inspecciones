export interface Municipality {
  name: string;
  code: string;
  department: string;
}

/** Municipios DIVIPOLA usados en el registro (portado del frontend Angular). */
export const COLOMBIAN_MUNICIPALITIES: Municipality[] = [
  { name: 'Medellín', code: '05001', department: 'Antioquia' },
  { name: 'Bello', code: '05088', department: 'Antioquia' },
  { name: 'Envigado', code: '05266', department: 'Antioquia' },
  { name: 'Barranquilla', code: '08001', department: 'Atlántico' },
  { name: 'Soledad', code: '08758', department: 'Atlántico' },
  { name: 'Bogotá, D.C.', code: '11001', department: 'Bogotá, D.C.' },
  { name: 'Cartagena de Indias', code: '13001', department: 'Bolívar' },
  { name: 'Tunja', code: '15001', department: 'Boyacá' },
  { name: 'Manizales', code: '17001', department: 'Caldas' },
  { name: 'Villamaría', code: '17873', department: 'Caldas' },
  { name: 'Popayán', code: '19001', department: 'Cauca' },
  { name: 'Valledupar', code: '20001', department: 'Cesar' },
  { name: 'Montería', code: '23001', department: 'Córdoba' },
  { name: 'Neiva', code: '41001', department: 'Huila' },
  { name: 'Santa Marta', code: '47001', department: 'Magdalena' },
  { name: 'Villavicencio', code: '50001', department: 'Meta' },
  { name: 'Pasto', code: '52001', department: 'Nariño' },
  { name: 'Cúcuta', code: '54001', department: 'Norte de Santander' },
  { name: 'Armenia', code: '63001', department: 'Quindío' },
  { name: 'Pereira', code: '66001', department: 'Risaralda' },
  { name: 'Bucaramanga', code: '68001', department: 'Santander' },
  { name: 'Floridablanca', code: '68276', department: 'Santander' },
  { name: 'Ibagué', code: '73001', department: 'Tolima' },
  { name: 'Cali', code: '76001', department: 'Valle del Cauca' },
  { name: 'Buenaventura', code: '76109', department: 'Valle del Cauca' },
];
