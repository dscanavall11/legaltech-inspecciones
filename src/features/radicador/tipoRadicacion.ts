import type { ReactNode } from 'react';
import { FileTextOutlined, MessageOutlined, FileOutlined } from '@ant-design/icons';
import { createElement } from 'react';

/**
 * Lo que este despacho radica. El fallo de segunda instancia NO esta aqui y no
 * es un olvido: lo profiere el superior jerarquico —el alcalde cuando el
 * municipio no tiene autoridad especial de Policia (Ley 1801, arts. 205.8 y
 * 205.14)—. Este despacho concede la apelacion y remite; no la resuelve.
 */
export type TipoRadicacion = 'querella' | 'queja' | 'apelacion';

export interface TipoRadicacionMeta {
  tipo: TipoRadicacion;
  titulo: string;
  icono: ReactNode;
  color: string;
  fondo: string;
  /** intake = chat de radicación (querella/queja); recurso = subida + campos (apelación). */
  familia: 'intake' | 'recurso';
}

export const TIPOS_RADICACION: TipoRadicacionMeta[] = [
  { tipo: 'querella', titulo: 'Querella', icono: createElement(FileTextOutlined), color: '#1a73e8', fondo: '#eef3fc', familia: 'intake' },
  { tipo: 'queja', titulo: 'Queja', icono: createElement(MessageOutlined), color: '#1e8e3e', fondo: '#e6f4ea', familia: 'intake' },
  { tipo: 'apelacion', titulo: 'Apelación', icono: createElement(FileOutlined), color: '#f9ab00', fondo: '#fff8e1', familia: 'recurso' },
];

export const metaDe = (tipo: TipoRadicacion): TipoRadicacionMeta =>
  TIPOS_RADICACION.find((t) => t.tipo === tipo) ?? TIPOS_RADICACION[0];
