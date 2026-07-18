import { useState } from 'react';
import { Drawer, Input, Button, Typography, Empty } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useAiChat } from './useAiChat';
import { useOverlayStore } from '@/store/overlayStore';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

const SUGERENCIAS = [
  '¿Cuántos días hábiles me quedan en este caso?',
  'Redáctame un proyecto de acta de firmeza',
  '¿Qué requisitos tiene una querella por perturbación?',
];

/**
 * Asistente IA accesible desde cualquier pantalla. Habla con Spring AI por
 * streaming. Diseño simple y conversacional para usuarios poco técnicos.
 */
export function AiAssistant() {
  const abierto = useOverlayStore((s) => s.aiAssistantAbierto);
  const cerrar = useOverlayStore((s) => s.cerrarAiAssistant);
  const [texto, setTexto] = useState('');
  const { mensajes, enviar, detener, enviando } = useAiChat();

  const handleEnviar = () => {
    enviar(texto);
    setTexto('');
  };

  return (
    <Drawer
      title={
        <span>
          <RobotOutlined style={{ marginRight: 8 }} />
          Asistente inteligente
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
            description="Pregúntame lo que necesites sobre tus casos"
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
                justifyContent:
                  m.rol === 'usuario' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background:
                    m.rol === 'usuario' ? PALETA.azul : '#f1f3f4',
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
