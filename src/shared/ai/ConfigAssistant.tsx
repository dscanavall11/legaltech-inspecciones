import { useEffect, useState } from 'react';
import { Input, Button, Typography, Form, Upload, App, Divider, Avatar } from 'antd';
import { SettingOutlined, PictureOutlined, SaveOutlined, DownOutlined, UpOutlined, CloseOutlined, LogoutOutlined } from '@ant-design/icons';
import { ArrowUp, Square } from 'lucide-react';
import { useAiChat } from './useAiChat';
import { NormaMark } from './NormaMark';
import { NORMA } from './identity';
import { useOverlayStore } from '@/store/overlayStore';
import { PALETA } from '@/theme/theme';
import { glassBackground, glassShadowLiquid } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { FontSizeControl } from '@/shared/components/FontSizeControl';
import { useAuth } from '@/shared/auth/auth';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

/**
 * Panel flotante del inspector: identidad, tamaño de texto y ajustes de la
 * inspección. Se abre desde el avatar del TopBar - una tarjeta de cristal
 * anclada ahí, no un drawer de lado derecho ni una página aparte (estilo
 * "widget flotante" de un escritorio tipo Deepin OS, mismo cristal que el
 * Dock). El formulario es la vía principal para configurar la inspección
 * (3 campos + una imagen no necesitan una conversación); la IA queda como
 * ayuda opcional, colapsada.
 */
export function ConfigAssistant() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const abierto = useOverlayStore((s) => s.aiAssistantAbierto);
  const cerrar = useOverlayStore((s) => s.cerrarAiAssistant);
  const reducirTransparencia = usePrefersReducedTransparency();
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [texto, setTexto] = useState('');
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

  useEffect(() => {
    if (abierto) {
      form.setFieldsValue({
        municipio: config.municipio,
        inspectorNombre: config.inspectorNombre,
        inspeccion: config.inspeccion,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!abierto) return null;

  const handleEnviar = () => {
    enviar(texto);
    setTexto('');
  };

  function onMembreteCargado(file: File) {
    const lector = new FileReader();
    lector.onload = () => {
      const dataUrl = String(lector.result);
      guardarConfig({ membreteDataUrl: dataUrl });
      message.success('Membrete guardado.');
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
    message.success('Configuración guardada.');
  }

  return (
    <>
      {/* Captura de clic afuera - transparente, no oscurece el resto de la app */}
      <div
        onClick={cerrar}
        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Panel del inspector"
        style={{
          position: 'fixed',
          top: 68,
          right: 24,
          width: 360,
          maxHeight: 'calc(100vh - 96px)',
          overflowY: 'auto',
          zIndex: 1000,
          borderRadius: 22,
          padding: 20,
          ...glassBackground(reducirTransparencia),
          boxShadow: glassShadowLiquid(PALETA.azul, 'ultra'),
          border: '1px solid rgba(255,255,255,0.4)',
        }}
      >
        {/* Identidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar style={{ background: PALETA.azulSuave, color: PALETA.azulOscuro, flexShrink: 0 }} size={40}>
            {usuario?.nombre?.[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: PALETA.texto, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {usuario?.nombre}
            </div>
            <div style={{ fontSize: 12, color: PALETA.textoSuave, textTransform: 'capitalize' }}>{usuario?.rol}</div>
          </div>
          <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={cerrar} aria-label="Cerrar" />
        </div>

        {/* Tamaño del texto */}
        <div style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: PALETA.textoTenue }}>
            Tamaño del texto
          </Text>
          <div style={{ marginTop: 8 }}>
            <FontSizeControl />
          </div>
        </div>

        <Divider style={{ margin: '4px 0 16px' }} />

        {/* Ajustes de la inspección */}
        <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: PALETA.textoTenue }}>
          <SettingOutlined style={{ marginRight: 6 }} />
          Ajustes de la inspección
        </Text>
        <Text type="secondary" style={{ fontSize: 12.5, display: 'block', margin: '6px 0 14px' }}>
          Estos datos aparecen en las actas y documentos que genera el despacho.
        </Text>

        <Form form={form} layout="vertical" requiredMark={false} size="small">
          <Form.Item label="Municipio (alcaldía)" name="municipio" style={{ marginBottom: 10 }}>
            <Input placeholder="Manizales" />
          </Form.Item>
          <Form.Item label="Inspector" name="inspectorNombre" style={{ marginBottom: 10 }}>
            <Input placeholder="Nombre del inspector" />
          </Form.Item>
          <Form.Item label="Inspección" name="inspeccion" style={{ marginBottom: 10 }}>
            <Input placeholder="Inspección Permanente de Convivencia y Paz" />
          </Form.Item>
        </Form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {config.membreteDataUrl ? (
            <Avatar shape="square" size={36} src={config.membreteDataUrl} />
          ) : (
            <Avatar shape="square" size={36} icon={<PictureOutlined />} style={{ background: 'rgba(255,255,255,0.5)', color: PALETA.textoTenue }} />
          )}
          <Upload beforeUpload={onMembreteCargado} showUploadList={false} accept="image/png,image/jpeg" style={{ flex: 1 }}>
            <Button size="small" icon={<PictureOutlined />} block>
              {config.membreteDataUrl ? 'Cambiar membrete' : 'Cargar membrete'}
            </Button>
          </Upload>
        </div>

        <Button type="primary" icon={<SaveOutlined />} block onClick={onGuardar}>
          Guardar
        </Button>

        <Divider style={{ margin: '18px 0' }} />

        <Button
          type="text"
          block
          icon={<NormaMark size={18} />}
          onClick={() => setAyudaAbierta((v) => !v)}
          style={{ color: PALETA.textoSuave, display: 'flex', justifyContent: 'space-between' }}
        >
          <span style={{ flex: 1, textAlign: 'left' }}>¿Necesitas ayuda? Pregúntale a {NORMA.nombre}</span>
          {ayudaAbierta ? <UpOutlined /> : <DownOutlined />}
        </Button>

        {ayudaAbierta && (
          <div style={{ marginTop: 12 }}>
            <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 10 }}>
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
                      fontSize: 13.5,
                      background: m.rol === 'usuario' ? PALETA.azul : 'rgba(255,255,255,0.6)',
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
          </div>
        )}

        <Divider style={{ margin: '18px 0' }} />

        <Button
          type="text"
          block
          danger
          icon={<LogoutOutlined />}
          onClick={() => {
            cerrarSesion();
            navigate('/login', { replace: true });
          }}
        >
          Cerrar sesión
        </Button>
      </div>
    </>
  );
}
