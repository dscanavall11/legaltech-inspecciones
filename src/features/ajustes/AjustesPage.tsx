import { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Input,
  Button,
  Form,
  Upload,
  App,
  Row,
  Col,
  Progress,
  Tag,
  Divider,
  Skeleton,
} from 'antd';
import {
  SettingOutlined,
  PictureOutlined,
  SaveOutlined,
  DownOutlined,
  UpOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  FileSearchOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { ArrowUp, Square } from 'lucide-react';
import { useAiChat } from '@/shared/ai/useAiChat';
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { useTokenUsageSummary } from './api';
import { PALETA, ELEVACION } from '@/theme/theme';
import { FontSizeControl } from '@/shared/components/FontSizeControl';

const { Title, Text, Paragraph } = Typography;

const PILARES_ARQUITECTURA = [
  {
    icono: <DatabaseOutlined />,
    titulo: 'OKF — Reglas de tu despacho',
    texto:
      `Cada oficina define sus propios flujos, plazos y plantillas en un OKF (Office Knowledge Format). ${NORMA.nombre} nunca improvisa un procedimiento: lo lee de ahí.`,
  },
  {
    icono: <FileSearchOutlined />,
    titulo: 'RAG — Respuestas con fuente',
    texto:
      `Antes de responder, ${NORMA.nombre} busca en la jurisprudencia y normativa vigente. No inventa artículos: cita lo que encontró.`,
  },
  {
    icono: <ThunderboltOutlined />,
    titulo: 'Arquitectura agéntica',
    texto:
      'Un analista redacta, un auditor independiente revisa el borrador contra el expediente antes de mostrártelo — dos modelos, no uno solo, para reducir errores.',
  },
  {
    icono: <SafetyOutlined />,
    titulo: 'El inspector decide',
    texto:
      'La IA prepara el borrador; radicar, proferir un fallo o archivar un caso siempre requiere una acción explícita tuya. Nada se decide solo.',
  },
];

export function AjustesPage() {
  const { message } = App.useApp();
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [texto, setTexto] = useState('');
  const { mensajes, enviar, detener, enviando } = useAiChat({ tipo: 'configuracion-inspeccion', id: 'inspeccion' });

  const config = useInspeccionStore((s) => s.config);
  const guardarConfig = useInspeccionStore((s) => s.guardarConfig);
  const { data: uso, isLoading: cargandoUso } = useTokenUsageSummary();

  const [form] = Form.useForm<{ municipio: string; inspectorNombre: string; inspeccion: string }>();

  useEffect(() => {
    form.setFieldsValue({
      municipio: config.municipio,
      inspectorNombre: config.inspectorNombre,
      inspeccion: config.inspeccion,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnviar = () => {
    enviar(texto);
    setTexto('');
  };

  function onMembreteCargado(file: File) {
    const lector = new FileReader();
    lector.onload = () => {
      guardarConfig({ membreteDataUrl: String(lector.result) });
      message.success('Membrete guardado.');
    };
    lector.readAsDataURL(file);
    return false;
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

  const porcentajeUso = uso ? Math.min(100, Math.round((uso.totalTokens / uso.limiteTokens) * 100)) : 0;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 2 }}>
        Ajustes
      </Title>
      <Text type="secondary">Tu inspección, tu plan y cómo trabaja la IA en esta plataforma.</Text>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Perfil e inspección */}
        <Col xs={24} lg={12}>
          <Card variant="borderless" style={{ boxShadow: ELEVACION.base, height: '100%' }}>
            <Title level={4} style={{ marginTop: 0 }}>
              <SettingOutlined style={{ marginRight: 8, color: PALETA.azul }} />
              Ajustes de la inspección
            </Title>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 18 }}>
              Estos datos aparecen en las actas y documentos que genera el despacho.
            </Text>

            <Form form={form} layout="vertical" requiredMark={false}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              {config.membreteDataUrl ? (
                <img src={config.membreteDataUrl} alt="Membrete" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10, background: '#f6f7f9' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f6f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETA.textoTenue }}>
                  <PictureOutlined />
                </div>
              )}
              <Upload beforeUpload={onMembreteCargado} showUploadList={false} accept="image/png,image/jpeg" style={{ flex: 1 }}>
                <Button icon={<PictureOutlined />} block>
                  {config.membreteDataUrl ? 'Cambiar membrete' : 'Cargar membrete (PNG/JPG)'}
                </Button>
              </Upload>
            </div>

            <Button type="primary" icon={<SaveOutlined />} block onClick={onGuardar}>
              Guardar
            </Button>

            <Divider style={{ margin: '20px 0 14px' }} />
            <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: PALETA.textoTenue }}>
              Accesibilidad
            </Text>
            <div style={{ marginTop: 8 }}>
              <FontSizeControl />
            </div>
          </Card>
        </Col>

        {/* Plan */}
        <Col xs={24} lg={12}>
          <Card variant="borderless" style={{ boxShadow: ELEVACION.base, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Title level={4} style={{ margin: 0 }}>
                Tu plan
              </Title>
              <Tag color="blue">Gratuito</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Consumo de IA general (chat con {NORMA.nombre}, RAG + OKF) este mes.
            </Text>

            {cargandoUso ? (
              <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 20 }} />
            ) : uso ? (
              <div style={{ marginTop: 20 }}>
                <Progress
                  percent={porcentajeUso}
                  strokeColor={porcentajeUso > 90 ? PALETA.rojo : PALETA.azul}
                  format={() => `${porcentajeUso}%`}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 13 }}>
                    <strong>{uso.totalTokens.toLocaleString('es-CO')}</strong> tokens usados
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    de {uso.limiteTokens.toLocaleString('es-CO')} incluidos
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, textTransform: 'capitalize' }}>
                  Periodo {uso.periodo}
                </Text>
              </div>
            ) : (
              <Text type="secondary" style={{ display: 'block', marginTop: 20 }}>
                No fue posible cargar tu consumo en este momento.
              </Text>
            )}

            <Divider style={{ margin: '20px 0 14px' }} />
            <Text style={{ fontSize: 13, lineHeight: 1.6 }}>
              El plan gratuito incluye{' '}
              <strong>{uso ? `${uso.limiteTokens.toLocaleString('es-CO')} tokens al mes` : 'un límite mensual de tokens'}</strong>{' '}
              de IA general (chat, resúmenes, consultas jurídicas). El radicador, los borradores de fallo y el
              resto de las herramientas del despacho no descuentan de este límite.
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Arquitectura / identidad */}
      <Card variant="borderless" style={{ boxShadow: ELEVACION.base, marginTop: 24 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          Cómo piensa esta plataforma
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 640 }}>
          No es un chatbot genérico con una capa jurídica encima. Cada respuesta pasa por el conocimiento
          específico de tu despacho antes de llegar a texto.
        </Paragraph>
        <Row gutter={[20, 20]} style={{ marginTop: 8 }}>
          {PILARES_ARQUITECTURA.map((p) => (
            <Col xs={24} sm={12} key={p.titulo}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: PALETA.azulSuave,
                    color: PALETA.azulOscuro,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 15,
                  }}
                >
                  {p.icono}
                </div>
                <div>
                  <Text strong style={{ fontSize: 14 }}>
                    {p.titulo}
                  </Text>
                  <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0, marginTop: 2 }}>
                    {p.texto}
                  </Paragraph>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Ayuda con Norma */}
      <Card variant="borderless" style={{ boxShadow: ELEVACION.base, marginTop: 24, marginBottom: 24 }}>
        <Button
          type="text"
          block
          icon={<NormaMark size={20} />}
          onClick={() => setAyudaAbierta((v) => !v)}
          style={{ color: PALETA.textoSuave, display: 'flex', justifyContent: 'space-between', height: 'auto', padding: '4px 0' }}
        >
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, color: PALETA.texto }}>
            ¿Necesitas ayuda? Pregúntale a {NORMA.nombre}
          </span>
          {ayudaAbierta ? <UpOutlined /> : <DownOutlined />}
        </Button>

        {ayudaAbierta && (
          <div style={{ marginTop: 16 }}>
            <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 10 }}>
              {mensajes.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.rol === 'usuario' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      fontSize: 13.5,
                      background: m.rol === 'usuario' ? PALETA.azul : '#efede7',
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
                <Button type="primary" icon={<ArrowUp size={16} strokeWidth={2.25} />} onClick={handleEnviar} disabled={!texto.trim()} />
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
