import { useState } from 'react';
import { Card, Input, Button, Typography, Tag } from 'antd';
import { RobotOutlined, SendOutlined, StopOutlined } from '@ant-design/icons';
import { useAiChat } from './useAiChat';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

const SUGERENCIAS = [
  '¿Cuántos días me quedan?',
  'Resume el expediente',
  'Redacta el acta de firmeza',
];

/**
 * Asistente IA embebido en el detalle del caso. A diferencia del asistente
 * flotante global, este recibe el contexto del expediente para dar respuestas
 * situadas (RAG sobre el caso) cuando el backend Spring AI esté conectado.
 */
export function CaseAssistant({
  contexto,
  radicado,
}: {
  contexto: { tipo: string; id: string };
  radicado: string;
}) {
  const [texto, setTexto] = useState('');
  const { mensajes, enviar, detener, enviando } = useAiChat(contexto);

  const handleEnviar = () => {
    enviar(texto);
    setTexto('');
  };

  return (
    <Card
      variant="borderless"
      style={{ boxShadow: '0 1px 3px rgba(60,64,67,.12), 0 4px 8px rgba(60,64,67,.10)' }}
      styles={{ body: { padding: 18 } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <RobotOutlined style={{ color: PALETA.azul, fontSize: 18 }} />
        <Text strong>Asistente del caso</Text>
      </div>
      <Text type="secondary" style={{ fontSize: 13 }}>
        Pregunta sobre el radicado {radicado}
      </Text>

      <div
        style={{
          maxHeight: 240,
          overflowY: 'auto',
          margin: '14px 0',
          display: mensajes.length ? 'block' : 'none',
        }}
      >
        {mensajes.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              justifyContent: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: 12,
                fontSize: 14,
                background: m.rol === 'usuario' ? PALETA.azul : '#f1f3f4',
                color: m.rol === 'usuario' ? '#fff' : PALETA.texto,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.contenido || (
                <Text type="secondary" italic style={{ fontSize: 13 }}>
                  Escribiendo…
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>

      {mensajes.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '14px 0' }}>
          {SUGERENCIAS.map((s) => (
            <Tag.CheckableTag
              key={s}
              checked={false}
              onChange={() => enviar(s)}
              style={{
                border: `1px solid ${PALETA.borde}`,
                padding: '4px 10px',
                borderRadius: 16,
                fontSize: 13,
              }}
            >
              {s}
            </Tag.CheckableTag>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu pregunta…"
          onPressEnter={handleEnviar}
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
    </Card>
  );
}
