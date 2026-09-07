import { useRef, useState } from 'react';
import { Alert, App, Button, Descriptions, Modal, Space, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parsearBdComparendos, type Comparendo, type ReporteImportacion } from '@/features/actas/comparendos';
import { useComparendosStore } from './store';
import { useAuth } from '@/shared/auth/auth';
import { TEXTO } from '@/theme/escala';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

interface Staging {
  archivo: File;
  registros: Comparendo[];
  reporte: ReporteImportacion;
}

const MENSAJE_CONFIRMACION =
  'Esta acción reemplazará la base actualmente cargada. ' +
  'Se eliminarán los registros importados del archivo anterior y se conservará únicamente la nueva base. ' +
  '¿Desea continuar?';

/**
 * Reemplazo de la base de comparendos — única fuente compartida por Actas de
 * Firmeza y Acogida (`useComparendosStore`). Flujo obligatorio: seleccionar
 * archivo → validar (estructura, columnas, legibilidad) → resumen →
 * confirmación explícita → recién ahí reemplazar. Si la validación falla, o
 * el inspector cancela, la base activa NUNCA se toca — el archivo nuevo se
 * parsea en memoria (staging) y solo se promueve a la base activa cuando se
 * confirma; `useComparendosStore.cargar` es la única operación que sustituye
 * el array, y lo hace de una sola vez (no hay borrado previo separado del
 * reemplazo, así que no hay una ventana en la que la base quede vacía).
 *
 * No toca plantillas, configuración, usuarios ni expedientes de Querellas:
 * solo el estado de este store dedicado a comparendos.
 */
export function CargarBaseComparendosButton() {
  const { message } = App.useApp();
  const bdActual = useComparendosStore((s) => s.comparendos);
  const archivoActivo = useComparendosStore((s) => s.archivoActivo);
  const cargadaEn = useComparendosStore((s) => s.cargadaEn);
  const cargar = useComparendosStore((s) => s.cargar);
  const registrarCargaFallida = useComparendosStore((s) => s.registrarCargaFallida);
  const usuario = useAuth((s) => s.usuario?.nombre ?? s.sesion?.username ?? 'desconocido');

  const [staging, setStaging] = useState<Staging | null>(null);
  const [reemplazando, setReemplazando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(archivo?: File) {
    if (!archivo) return;
    try {
      const { comparendos: registros, reporte } = await parsearBdComparendos(archivo);
      if (registros.length === 0) {
        registrarCargaFallida(archivo.name, usuario, 'ningún registro válido en el archivo');
        message.error('El archivo no contiene comparendos reconocibles. La base activa no cambió.');
        return;
      }
      setStaging({ archivo, registros, reporte });
    } catch {
      registrarCargaFallida(archivo.name, usuario, 'no se pudo leer el archivo (formato o estructura inválida)');
      message.error('No fue posible leer el archivo. La base activa no cambió.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function confirmarReemplazo() {
    if (!staging) return;
    setReemplazando(true);
    try {
      cargar(staging.registros, staging.archivo.name, usuario);
      message.success('Base de comparendos reemplazada.');
      setStaging(null);
    } finally {
      setReemplazando(false);
    }
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          background: '#eef4fa',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 12,
        }}
      >
        <div data-testid="base-comparendos-activa" style={{ fontSize: TEXTO.base }}>
          <Text strong>Base activa: </Text>
          <Text>{archivoActivo}</Text>
          <Text type="secondary" style={{ marginLeft: 12 }}>
            Última actualización: {cargadaEn ? dayjs(cargadaEn).format('DD/MM/YYYY HH:mm') : '—'}
          </Text>
          <Text type="secondary" style={{ marginLeft: 12 }}>
            Registros: {bdActual.length}
          </Text>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => void onFileSelected(e.target.files?.[0])}
        />
        <Button size="small" icon={<UploadOutlined />} onClick={() => inputRef.current?.click()}>
          Cargar base de comparendos (.xlsx)
        </Button>
      </div>

      <Modal
        title="Reemplazar base de comparendos"
        open={!!staging}
        onCancel={() => setStaging(null)}
        footer={
          <Space>
            <Button onClick={() => setStaging(null)}>CANCELAR</Button>
            <Button type="primary" danger loading={reemplazando} onClick={confirmarReemplazo}>
              REEMPLAZAR BASE
            </Button>
          </Space>
        }
      >
        {staging && (
          <Space direction="vertical" style={{ width: '100%' }} size={14}>
            <Alert type="warning" showIcon message={MENSAJE_CONFIRMACION} />
            <Descriptions title="Archivo actual" size="small" column={1} bordered>
              <Descriptions.Item label="Nombre">{archivoActivo}</Descriptions.Item>
              <Descriptions.Item label="Fecha de carga">
                {cargadaEn ? dayjs(cargadaEn).format('DD/MM/YYYY HH:mm') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Registros">{bdActual.length}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="Archivo nuevo" size="small" column={1} bordered>
              <Descriptions.Item label="Nombre">{staging.archivo.name}</Descriptions.Item>
              <Descriptions.Item label="Registros válidos">{staging.reporte.leidas}</Descriptions.Item>
              <Descriptions.Item label="Con observaciones (descartados)">{staging.reporte.descartadas}</Descriptions.Item>
              <Descriptions.Item label="Columnas detectadas">
                {staging.reporte.columnasDetectadas.join(', ') || '—'}
              </Descriptions.Item>
            </Descriptions>
            {staging.reporte.descartadas > 0 && (
              <Alert
                type="info"
                showIcon
                message={`${staging.reporte.descartadas} fila(s) del archivo nuevo no se importarán`}
                description={
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {Object.entries(staging.reporte.motivos).map(([motivo, count]) => (
                      <li key={motivo} style={{ fontSize: TEXTO.menor }}>
                        {motivo}: {count}
                      </li>
                    ))}
                  </ul>
                }
              />
            )}
            <Text type="secondary" style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue }}>
              Si cancela, la base activa actual no se modifica.
            </Text>
          </Space>
        )}
      </Modal>
    </>
  );
}
