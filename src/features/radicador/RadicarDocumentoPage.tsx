import { useRef, useState, useEffect } from 'react';
import {
  Button,
  Input,
  DatePicker,
  message,
  Card,
  Form,
  Divider,
  Typography,
} from 'antd';
import {
  UploadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileOutlined,
  CloseOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '@/shared/api/client';
import { PALETA, ELEVACION } from '@/theme/theme';
import type { ReactNode } from 'react';

const { Text } = Typography;

type TipoRadicar = 'apelacion' | 'fallo';

interface Anexo {
  id: string;
  nombre: string;
  tipo: 'pdf' | 'imagen' | 'texto' | 'otro';
  tamano: string;
  file: File;
}

const ICONO_ANEXO: Record<Anexo['tipo'], ReactNode> = {
  pdf: <FilePdfOutlined style={{ color: PALETA.rojo }} />,
  imagen: <FileImageOutlined style={{ color: PALETA.verde }} />,
  texto: <FileTextOutlined style={{ color: PALETA.azul }} />,
  otro: <FileOutlined style={{ color: PALETA.textoSuave }} />,
};

function tipoDesdeNombre(nombre: string): Anexo['tipo'] {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'imagen';
  if (['txt', 'doc', 'docx', 'rtf'].includes(ext)) return 'texto';
  return 'otro';
}

interface FormData {
  radicadoOrigen: string;
  partes: string;
  fechaDecision: string;
  sustento: string;
  documentos: Anexo[];
}

/** Componente interno para disparar el pulso de éxito */
function PulsoDisparador({ activo, ref, children }: { activo: boolean; ref: React.RefObject<HTMLElement>; children: ReactNode }) {
  useEffect(() => {
    if (!activo) return;
    const el = ref.current;
    if (!el) return;
    // La animación está en index.css (.pulso-exito)
    el.classList.add('pulso-exito');
    const handler = () => {
      el.classList.remove('pulso-exito');
      el.removeEventListener('animationend', handler);
    };
    el.addEventListener('animationend', handler);
  }, [activo, ref]);
  return <>{children}</>;
}

export function RadicarDocumentoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tipo = (location.pathname.split('/').pop() ?? 'apelacion') as TipoRadicar;

  const [form] = Form.useForm();
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [pulsoActivo, setPulsoActivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pulsoRef = useRef<HTMLDivElement>(null);

  const titulo = tipo === 'apelacion' ? 'Apelación' : 'Fallo (2.ª instancia)';
  const icono = tipo === 'apelacion' ? <FileOutlined /> : <CheckCircleOutlined />;
  const colorIcono = tipo === 'apelacion' ? '#f9ab00' : '#9334e6';
  const colorFondo = tipo === 'apelacion' ? '#fff8e1' : '#f3e8fd';

  const terminoTexto =
    tipo === 'apelacion'
      ? '3 días hábiles (art. 223 num. 4 Ley 1801/2016 — término por confirmar con el equipo jurídico)'
      : 'Según resolución recurrida';

  function agregarAnexos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const nuevos: Anexo[] = Array.from(files).map((f) => ({
      id: `anexo-${crypto.randomUUID().slice(0, 8)}`,
      nombre: f.name,
      tipo: tipoDesdeNombre(f.name),
      tamano: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      file: f,
    }));
    setAnexos((prev) => [...prev, ...nuevos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function quitarAnexo(id: string) {
    setAnexos((prev) => prev.filter((a) => a.id !== id));
  }

  function pulsoDisparar() {
    setPulsoActivo(true);
    setTimeout(() => setPulsoActivo(false), 600);
  }

  async function onSubmit(values: Omit<FormData, 'documentos'>) {
    if (anexos.length === 0) {
      message.warning('Debe adjuntar al menos un documento (PDF, imagen o texto).');
      return;
    }

    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('radicadoOrigen', values.radicadoOrigen);
      formData.append('partes', values.partes);
      formData.append('fechaDecision', values.fechaDecision);
      formData.append('sustento', values.sustento);
      anexos.forEach((a) => formData.append('documentos', a.file));

      const res = await apiFetch<{ id: string; radicado: string; fechaRadicacion: string; estado: string }>('/radicaciones', {
        method: 'POST',
        body: formData,
      });

      message.success(`${titulo} radicada exitosamente: ${res.radicado}`);
      pulsoDisparar();
      setTimeout(() => navigate('/panel/cola'), 650);
    } catch {
      message.error('No se pudo radicar el documento. Intente de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit} style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="vista-animada" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <PulsoDisparador activo={pulsoActivo} ref={pulsoRef}>
            <div
              ref={pulsoRef}
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: colorFondo,
                color: colorIcono,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {icono}
            </div>
          </PulsoDisparador>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: PALETA.texto }}>Radicación de {titulo}</div>
            <Text type="secondary">Complete el formulario y adjunte el documento de la resolución recurrida.</Text>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: PALETA.amarillo + '15',
            color: PALETA.amarillo + 'cc',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            border: `1px solid ${PALETA.amarillo}40`,
          }}
        >
          <span>Término: </span>
          <span>{terminoTexto}</span>
        </div>
      </div>

      <Card variant="borderless" style={{ boxShadow: ELEVACION.base, marginBottom: 20 }}>
        <Form.Item name="radicadoOrigen" label="Radicado de origen" rules={[{ required: true, message: 'Requerido' }]}>
          <Input placeholder="Ej: 2026-00123" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="partes" label="Partes (querellante / querellado)" rules={[{ required: true, message: 'Requerido' }]}>
          <Input.TextArea
            rows={2}
            placeholder="Nombre completo del querellante y del querellado"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="fechaDecision" label="Fecha de la decisión recurrida" rules={[{ required: true, message: 'Requerido' }]}>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Seleccione la fecha"
          />
        </Form.Item>

        <Form.Item name="sustento" label="Sustento de la apelación / fallo" rules={[{ required: true, message: 'Requerido' }]}>
          <Input.TextArea
            rows={4}
            placeholder="Fundamentos fácticos y jurídicos del recurso..."
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Divider style={{ margin: '20px 0' }} />
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: PALETA.textoTenue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Documentos adjuntos
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => agregarAnexos(e.target.files)}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <Button
              type="dashed"
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
              style={{ borderRadius: 14 }}
            >
              Subir documentos (PDF, imagen, texto)
            </Button>
            {anexos.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: PALETA.textoSuave, fontSize: 13 }}>
                {anexos.length} archivo{anexos.length > 1 ? 's' : ''} seleccionado{anexos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {anexos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {anexos.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#f6f7f9',
                    borderRadius: 14,
                    padding: '8px 14px',
                    fontSize: 13,
                    color: PALETA.texto,
                  }}
                >
                  {ICONO_ANEXO[a.tipo]}
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.nombre}
                  </span>
                  <span style={{ fontSize: 11.5, color: PALETA.textoTenue, flexShrink: 0 }}>
                    {a.tamano}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    shape="circle"
                    icon={<CloseOutlined style={{ fontSize: 10 }} />}
                    aria-label={`Quitar ${a.nombre}`}
                    onClick={() => quitarAnexo(a.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button onClick={() => navigate(-1)} style={{ borderRadius: 14 }}>
          Volver
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={cargando}
          icon={<SendOutlined />}
          style={{ borderRadius: 14, fontWeight: 600, minWidth: 180 }}
        >
          Radicar {titulo}
        </Button>
      </div>
    </Form>
  );
}