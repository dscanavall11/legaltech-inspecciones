import { useState } from 'react';
import { Drawer, Input, Button, Typography, Empty } from 'antd';
import { ArrowUp, Square } from 'lucide-react';
import { useAiChat } from './useAiChat';
import { NormaMark } from './NormaMark';
import { NORMA } from './identity';
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
  const contexto = useOverlayStore((s) => s.aiAssistantContexto);
  const [texto, setTexto] = useState('');
  const { mensajes, enviar, detener, enviando } = useAiChat(
    contexto ? { tipo: contexto.tipo, id: contexto.id } : undefined,
  );

  const handleEnviar = () => {
    enviar(texto);
    setTexto('');
  };

  const sugerencias = contexto
    ? [
        `¿Cuántos días hábiles le quedan al radicado ${contexto.radicado}?`,
        'Resume este expediente',
        '¿Qué debería hacer en el próximo paso?',
      ]
    : SUGERENCIAS;

  return (
    <Drawer
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <NormaMark size={26} />
          {NORMA.nombre}
        </span>
      }
      open={abierto}
      onClose={cerrar}
      width={420}
      styles={{ body: { display: 'flex', flexDirection: 'column', padding: 16 } }}
    >
      {contexto && (
        <Text type="secondary" style={{ fontSize: 13, marginBottom: 10, display: 'block' }}>
          Sobre el radicado {contexto.radicado}
        </Text>
      )}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
        {mensajes.length === 0 ? (
          <Empty
            image={<NormaMark size={44} />}
            description={`Pregúntale a ${NORMA.nombre} lo que necesites sobre tus casos`}
          >
            <div style={{ textAlign: 'left', marginTop: 8 }}>
              {sugerencias.map((s) => (
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
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 10,
              }}
            >
              {m.rol === 'asistente' && <NormaMark size={26} />}
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background:
                    m.rol === 'usuario' ? PALETA.azul : '#efede7',
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
          <Button danger icon={<Square size={15} strokeWidth={2} />} onClick={detener} />
        ) : (
          <Button
            type="primary"
            icon={<ArrowUp size={16} strokeWidth={2.25} />}
            onClick={handleEnviar}
            disabled={!texto.trim()}
          />
        )}
      </div>
    </Drawer>
  );
}
