import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Typography,
  Upload,
  App,
} from 'antd';
import type { UploadFile } from 'antd';
import { ExperimentOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { analizarConHistorial, type ProcessResponse } from './api';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

/**
 * Radicación y análisis clínico de procesos con IA.
 * Migrado del componente new-process del frontend Angular: envía la
 * información general + evidencias (multipart 'data' + 'files') al
 * microservicio de análisis y muestra el resultado.
 */
export function AnalisisPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [archivos, setArchivos] = useState<UploadFile[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respuestaCruda, setRespuestaCruda] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const onSubmit = async (values: { generalInformation: string }) => {
    setCargando(true);
    setError(null);
    setRespuestaCruda(null);
    try {
      const data = new FormData();
      // Mismo contrato del backend: parte 'data' JSON + partes 'files'.
      data.append(
        'data',
        new Blob(
          [
            JSON.stringify({
              generalInformation: values.generalInformation,
              fecha: dayjs().format('DD-MM-YYYY'),
            }),
          ],
          { type: 'application/json' },
        ),
      );
      for (const f of archivos) {
        if (f.originFileObj) data.append('files', f.originFileObj);
      }

      const res: ProcessResponse = await analizarConHistorial(data);
      setRespuestaCruda(JSON.stringify(res, null, 2));
      const valor = (res as { data?: unknown }).data ?? res;
      setResultado(typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2));
      setModalAbierto(true);
      setArchivos([]);
    } catch {
      setError('No fue posible conectar con el servicio de análisis. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const exportarDoc = () => {
    if (!resultado) return;
    const escapado = resultado
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Radicación y Análisis Clínico de Procesos</title></head><body><h2>Radicación y Análisis Clínico de Procesos</h2><pre style="font-family: Consolas, monospace; white-space: pre-wrap;">${escapado}</pre></body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-clinico-${dayjs().format('YYYY-MM-DD')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          Radicación y análisis con IA
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Describe los hechos del proceso y adjunta las evidencias; la IA genera un análisis clínico
          procesal con base en el historial.
        </Paragraph>
      </div>

      {error && <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />}

      <Card>
        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false} disabled={cargando}>
          <Form.Item
            name="generalInformation"
            label="Información general del proceso"
            rules={[
              { required: true, message: 'Describe el caso a analizar.' },
              { min: 10, message: 'Se requieren al menos 10 caracteres para procesar la radicación.' },
            ]}
          >
            <Input.TextArea
              rows={6}
              placeholder="Ingrese los hechos, pretensiones o resumen del caso para análisis..."
            />
          </Form.Item>

          <Form.Item label="Evidencias del proceso (PDF, imágenes, audio)">
            <Dragger
              multiple
              fileList={archivos}
              accept="application/pdf,image/*,audio/*"
              beforeUpload={() => false} // no subir automático: se envían con el análisis
              onChange={({ fileList }) => setArchivos(fileList)}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Adjuntar documentos, fotos o grabaciones</p>
              <p className="ant-upload-hint">Formatos soportados: PDF, JPG, PNG, MP3, WAV</p>
            </Dragger>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<ExperimentOutlined />}
              loading={cargando}
            >
              {cargando ? 'Procesando...' : 'Iniciar radicación'}
            </Button>
          </div>
        </Form>
      </Card>

      {respuestaCruda && (
        <Card title="Traza de respuesta técnica" size="small">
          <pre
            style={{
              margin: 0,
              maxHeight: 320,
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {respuestaCruda}
          </pre>
        </Card>
      )}

      <Modal
        open={modalAbierto}
        title="Análisis clínico procesal"
        width={860}
        onCancel={() => setModalAbierto(false)}
        footer={[
          <Button key="doc" onClick={exportarDoc}>
            Exportar documento .DOC
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              setModalAbierto(false);
              message.success('Sentencia aceptada. La respuesta fue confirmada.');
            }}
          >
            Confirmar y guardar
          </Button>,
        ]}
      >
        <Text style={{ whiteSpace: 'pre-wrap', display: 'block', maxHeight: '55vh', overflow: 'auto' }}>
          {resultado}
        </Text>
      </Modal>
    </div>
  );
}
