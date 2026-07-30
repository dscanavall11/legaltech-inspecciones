import type { ReactNode } from 'react';
import {
  FileTextOutlined,
  MessageOutlined,
  FileOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { createElement } from 'react';

export type TipoRadicacion = 'querella' | 'queja' | 'apelacion' | 'fallo';

export interface TipoRadicacionMeta {
  tipo: TipoRadicacion;
  titulo: string;
  icono: ReactNode;
  color: string;
  fondo: string;
  /** intake = chat de radicación (querella/queja); recurso = subida + campos (apelación/fallo). */
  familia: 'intake' | 'recurso';
}

export const TIPOS_RADICACION: TipoRadicacionMeta[] = [
  { tipo: 'querella', titulo: 'Querella', icono: createElement(FileTextOutlined), color: '#1a73e8', fondo: '#eef3fc', familia: 'intake' },
  { tipo: 'queja', titulo: 'Queja', icono: createElement(MessageOutlined), color: '#1e8e3e', fondo: '#e6f4ea', familia: 'intake' },
  { tipo: 'apelacion', titulo: 'Apelación', icono: createElement(FileOutlined), color: '#f9ab00', fondo: '#fff8e1', familia: 'recurso' },
  { tipo: 'fallo', titulo: 'Fallo 2.ª inst.', icono: createElement(CheckCircleOutlined), color: '#9334e6', fondo: '#f3e8fd', familia: 'recurso' },
];

export const metaDe = (tipo: TipoRadicacion): TipoRadicacionMeta =>
  TIPOS_RADICACION.find((t) => t.tipo === tipo) ?? TIPOS_RADICACION[0];
