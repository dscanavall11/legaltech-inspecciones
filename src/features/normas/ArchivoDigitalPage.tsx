import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { InboxOutlined, SaveOutlined } from '@ant-design/icons';
import { guardarArchivoDigital } from './api';
import type { DigitalArchiveRequest } from './types';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

const TIPOS: DigitalArchiveRequest['type'][] = ['Querella', 'Queja', 'Apelacion'];
const MAX_MB = 10;

/**
 * Registro de documentos en el archivo digital (microservicio legalbases).
 * Migrado del componente digital-archive-management del frontend Angular.
 */
export function ArchivoDigitalPage() {
  const [form] = Form.useForm();
  const [archivo, setArchivo] = useState<UploadFile[]>([]);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: DigitalArchiveRequest) => {
    const file = archivo[0]?.originFileObj;
    if (!file) {
      setError('Adjunta el archivo a registrar.');
      return;
    }
    setCargando(true);
    setError(null);
    setExito(null);
    try {
      const res = await guardarArchivoDigital(values, file);
      setExito(res?.message || 'Documento registrado en el archivo digital.');
      form.resetFields();
      setArchivo([]);
    } catch {
      setError('No fue posible guardar el documento. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          Archivo digital
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Carga y gestiona documentos legales en el archivo digital. Soporta PDF, DOC y archivos de
          imagen.
        </Paragraph>
      </div>

      {exito && <Alert type="success" message={exito} showIcon closable onClose={() => setExito(null)} />}
      {error && <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />}

      <Card>
        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false} disabled={cargando}>
          <Form.Item
            name="title"
            label="Título del documento"
            rules={[
              { required: true, message: 'El título es requerido.' },
              { min: 5, message: 'Mínimo 5 caracteres.' },
              { max: 100, message: 'Máximo 100 caracteres.' },
            ]}
          >
            <Input placeholder="Ej: Demanda Civil - Caso 2024-001" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[
              { required: true, message: 'La descripción es requerida.' },
              { min: 10, message: 'Mínimo 10 caracteres.' },
              { max: 500, message: 'Máximo 500 caracteres.' },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Describe brevemente el contenido del documento..." />
          </Form.Item>

          <Form.Item
            name="type"
            label="Tipo de documento"
            rules={[{ required: true, message: 'Debes seleccionar un tipo de documento.' }]}
          >
            <Select
              placeholder="-- Selecciona un tipo --"
              options={TIPOS.map((t) => ({ value: t, label: t }))}
            />
          </Form.Item>

          <Form.Item label="Adjuntar archivo" required>
            <Dragger
              maxCount={1}
              fileList={archivo}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              beforeUpload={(file) => {
                if (file.size / 1024 / 1024 > MAX_MB) {
                  setError(`El archivo supera el máximo de ${MAX_MB} MB.`);
                  return Upload.LIST_IGNORE;
                }
                setError(null);
                return false; // no subir automático: se envía con el formulario
              }}
              onChange={({ fileList }) => setArchivo(fileList)}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Haz clic o arrastra el documento aquí</p>
              <p className="ant-upload-hint">PDF, DOC, DOCX, JPG, PNG, GIF (máx. {MAX_MB} MB)</p>
            </Dragger>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              onClick={() => {
                form.resetFields();
                setArchivo([]);
                setError(null);
                setExito(null);
              }}
            >
              Limpiar
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={cargando}>
              Guardar archivo
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
