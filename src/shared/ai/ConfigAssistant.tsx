import { useState } from 'react';
import { Drawer, Input, Button, Typography, Form, Upload, Empty, App } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  PictureOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useAiChat } from './useAiChat';
import { useOverlayStore } from '@/store/overlayStore';
import { PALETA } from '@/theme/theme';
import { useInspeccionStore } from '@/store/inspeccionStore';

const { Text } = Typography;

const SUGERENCIAS = [
  'Configura los datos de mi inspección',
  '¿Qué datos necesitas de mí?',
  'Quiero guardar el membrete de mi alcaldía',
];

/**
 * Agente de configuración (IA LLM muy básico).
 *
 * Hace preguntas guiadas para capturar los datos de la inspección
 * (municipio/alcaldía, inspector, inspección) y el membrete (imagen del
 * encabezado del acta). Al terminar, el inspector confirma y guarda la
 * configuración en el store persistido (ver `useInspeccionStore`), de modo
 * que el acta de firmeza y demás pantallas tomen esos datos sin re-consultar.
 *
 * Reusa `useAiChat` (mismo backend Spring AI que el asistente global) con un
 * contexto de tipo `configuracion-inspeccion`.
 */
export function ConfigAssistant() {
  const { message } = App.useApp();
  const abierto = useOverlayStore((s) => s.configAssistantAbierto);
  const cerrar = useOverlayStore((s) => s.cerrarConfigAssistant);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState(false);
  const { mensajes, enviar, detener, enviando } = useAiChat({
    tipo: 'configuracion-inspeccion',
    id: 'inspeccion',
  });

  const config = useInspeccionStore((s) => s.config);
  const guardarConfig = useInspeccionStore((s) => s.guardarConfig);

  const [form] = Form.useForm<{
    municipio: string;
    inspectorNombre: string;
    inspeccion: string;
  }>();

  const handleEnviar = () => {
    enviar(texto);
    setTexto('');
  };

  function iniciarEdicion() {
    form.setFieldsValue({
      municipio: config.municipio,
      inspectorNombre: config.inspectorNombre,
      inspeccion: config.inspeccion,
    });
    setEditando(true);
  }

  function onMembreteCargado(file: File) {
    const lector = new FileReader();
    lector.onload = () => {
      const dataUrl = String(lector.result);
      guardarConfig({ membreteDataUrl: dataUrl });
      message.success('Membrete guardado en la configuración de la inspección.');
    };
    lector.readAsDataURL(file);
    return false; // evita el upload automático de antd
  }

  function onGuardar() {
    const valores = form.getFieldsValue();
    guardarConfig({
      municipio: valores.municipio ?? config.municipio,
      inspectorNombre: valores.inspectorNombre ?? config.inspectorNombre,
      inspeccion: valores.inspeccion ?? config.inspeccion,
    });
    setEditando(false);
    message.success('Configuración de la inspección guardada.');
  }

  return (
    <Drawer
      title={
        <span>
          <RobotOutlined style={{ marginRight: 8 }} />
          Configuración de la inspección
        </span>
      }
      open={abierto}
      onClose={cerrar}
      width={420}
      styles={{ body: { display: 'flex', flexDirection: 'column', padding: 16 } }}
    >
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
        {mensajes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Pregúntame para configurar los datos de tu inspección"
          >
            <div style={{ textAlign: 'left', marginTop: 8 }}>
              {SUGERENCIAS.map((s) => (
                <Button
                  key={s}
                  type="dashed"
                  block
                  style={{ marginBottom: 8, whiteSpace: 'normal', height: 'auto', padding: 8 }}
                  onClick={() => enviar(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </Empty>
        ) : (
          mensajes.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: m.rol === 'usuario' ? PALETA.azul : '#f1f3f4',
                  color: m.rol === 'usuario' ? '#fff' : PALETA.texto,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.contenido || (
                  <Text type="secondary" italic>
                    Escribiendo…
                  </Text>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {config.configurado && !editando && (
        <div
          style={{
            background: PALETA.azulSuave,
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <Text strong>Configuración actual:</Text>
          <div style={{ marginTop: 4 }}>
            {config.municipio || '—'} · {config.inspectorNombre || '—'} ·{' '}
            {config.inspeccion || '—'}
          </div>
          <div style={{ marginTop: 4 }}>
            Membrete: {config.membreteDataUrl ? 'cargado' : 'sin cargar'}
          </div>
          <Button
            size="small"
            style={{ marginTop: 8 }}
            onClick={iniciarEdicion}
          >
            Editar datos
          </Button>
        </div>
      )}

      {editando && (
        <div style={{ marginBottom: 12 }}>
          <Form form={form} layout="vertical">
            <Form.Item label="Municipio (alcaldía)" name="municipio">
              <Input placeholder="Manizales" />
            </Form.Item>
            <Form.Item label="Inspector" name="inspectorNombre">
              <Input placeholder="Nombre del inspector" />
            </Form.Item>
            <Form.Item label="Inspección" name="inspeccion">
              <Input placeholder="Inspección Permanente de Convivencia y Paz" />
            </Form.Item>
          </Form>
          <Upload beforeUpload={onMembreteCargado} showUploadList={false} accept="image/png,image/jpeg">
            <Button icon={<PictureOutlined />} block>
              {config.membreteDataUrl ? 'Cambiar membrete (PNG/JPG)' : 'Cargar membrete (PNG/JPG)'}
            </Button>
          </Upload>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            block
            style={{ marginTop: 8 }}
            onClick={onGuardar}
          >
            Guardar configuración
          </Button>
        </div>
      )}

      {!editando && (
        <Button
          type="default"
          icon={<SaveOutlined />}
          block
          style={{ marginBottom: 8 }}
          onClick={iniciarEdicion}
        >
          {config.configurado ? 'Actualizar configuración' : 'Configurar ahora'}
        </Button>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Input.TextArea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu pregunta…"
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleEnviar();
            }
          }}
        />
        {enviando ? (
          <Button danger icon={<StopOutlined />} onClick={detener} />
        ) : (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleEnviar}
            disabled={!texto.trim()}
          />
        )}
      </div>
    </Drawer>
  );
}
