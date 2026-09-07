import { useState } from 'react';
import { Alert, Button, Modal, Space, Table, Tag, Typography } from 'antd';
import { FileZipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Comparendo } from '@/features/actas/comparendos';
import {
  descargarZipActasMasivas,
  generarActasMasivas,
  type ResultadoFilaMasiva,
} from './generacionMasivaActasDocx';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;

/**
 * "Generar actas seleccionadas" — modo masivo. Reutiliza exactamente la
 * misma cadena de la generación individual (validación, detección de
 * género, catálogo de plantillas, MERGEFIELD + reparo de texto fijo) fila
 * por fila; la única lógica nueva es la orquestación del lote y el
 * empaquetado en .zip. La reincidencia sale de `Comparendo.causal`, que ya
 * viene de la columna REINCIDENTE de la BD — nunca se calcula aquí.
 */
export function GeneracionMasivaActasButton({ seleccionados }: { seleccionados: Comparendo[] }) {
  const [procesando, setProcesando] = useState(false);
  const [resumen, setResumen] = useState<{
    resultados: ResultadoFilaMasiva[];
    generados: number;
    conObservaciones: number;
    errores: number;
  } | null>(null);
  const [descargando, setDescargando] = useState(false);

  async function generar() {
    setProcesando(true);
    try {
      const fechaResolucion = dayjs().format('YYYY-MM-DD');
      const resultado = await generarActasMasivas(seleccionados, fechaResolucion);
      setResumen(resultado);
    } finally {
      setProcesando(false);
    }
  }

  async function descargarZip() {
    if (!resumen) return;
    setDescargando(true);
    try {
      await descargarZipActasMasivas(resumen.resultados, dayjs().format('YYYY-MM-DD'));
    } finally {
      setDescargando(false);
    }
  }

  return (
    <>
      <Button
        icon={<FileZipOutlined />}
        disabled={seleccionados.length === 0}
        loading={procesando}
        onClick={() => void generar()}
      >
        Generar actas seleccionadas {seleccionados.length > 0 ? `(${seleccionados.length})` : ''}
      </Button>

      <Modal
        title="Generación masiva de Actas de Firmeza"
        open={!!resumen}
        onCancel={() => setResumen(null)}
        width={720}
        footer={
          <Space>
            <Button onClick={() => setResumen(null)}>Cerrar</Button>
            <Button
              type="primary"
              icon={<FileZipOutlined />}
              loading={descargando}
              disabled={!resumen || resumen.resultados.every((r) => !r.archivo)}
              onClick={() => void descargarZip()}
            >
              Descargar ZIP
            </Button>
          </Space>
        }
      >
        {resumen && (
          <Space direction="vertical" style={{ width: '100%' }} size={14}>
            <Space size={10}>
              <Tag color="success" style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                Generados correctamente: {resumen.generados}
              </Tag>
              {resumen.conObservaciones > 0 && (
                <Tag color="warning" style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                  Con observaciones: {resumen.conObservaciones}
                </Tag>
              )}
              {resumen.errores > 0 && (
                <Tag color="error" style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                  No generados: {resumen.errores}
                </Tag>
              )}
            </Space>

            {resumen.errores > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Ningún registro con error se generó ni se incluyó en el .zip"
                description="Corrija el dato faltante o confirme el género/reincidencia manualmente en la generación individual, y vuelva a intentarlo."
              />
            )}

            <Table<ResultadoFilaMasiva>
              size="small"
              rowKey={(r) => r.comparendo}
              pagination={false}
              dataSource={resumen.resultados}
              columns={[
                { title: 'Queja', dataIndex: 'proceso', key: 'proceso', width: 110 },
                { title: 'Infractor', dataIndex: 'solicitado', key: 'solicitado', ellipsis: true },
                {
                  title: 'Resultado',
                  key: 'estado',
                  width: 320,
                  render: (_: unknown, r: ResultadoFilaMasiva) =>
                    r.estado === 'generado' ? (
                      <Tag color="success">generado</Tag>
                    ) : r.estado === 'con_observaciones' ? (
                      <Tag color="warning">con observaciones — {r.motivo}</Tag>
                    ) : (
                      <Tag color="error">{r.motivo}</Tag>
                    ),
                },
              ]}
            />
            <Text type="secondary" style={{ fontSize: TEXTO.menor }}>
              Formato del ejemplo: "{'{QUEJA}'} — generado" / "{'{QUEJA}'} — {'{motivo exacto}'}".
            </Text>
          </Space>
        )}
      </Modal>
    </>
  );
}
