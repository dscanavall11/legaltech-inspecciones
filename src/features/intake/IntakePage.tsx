import { useEffect, useRef, useState } from 'react';
import { Button, Input, Select, Tooltip, message as antMessage } from 'antd';
import {
  SendOutlined,
  PaperClipOutlined,
  CloseOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/shared/api/client';
import type { Querella } from '@/features/querellas/types';
import type { Queja } from '@/features/quejas/types';
import { tipoDesdeNombre, type TipoDocumento } from '@/shared/documentos/types';
import { DESPACHO, TIPO_SOLICITUD_LABEL, VIA_PROCESAL_LABEL, TERMINOS, CNSCC } from '@/derecho';
import type { CasoDraft, ChatMessage } from './useIntakeChat';
import { useIntakeChat } from './useIntakeChat';
import { ELEVACION, PALETA } from '@/theme/theme';

// Anexo aportado en el chat antes de radicar (prueba documental del caso).
interface Anexo {
  id: string;
  nombre: string;
  tipo: TipoDocumento;
  tamano: string;
}

const ICONO_ANEXO: Record<TipoDocumento, ReactNode> = {
  pdf: <FilePdfOutlined style={{ color: PALETA.rojo }} />,
  imagen: <FileImageOutlined style={{ color: PALETA.verde }} />,
  texto: <FileTextOutlined style={{ color: PALETA.azul }} />,
  otro: <FileOutlined style={{ color: PALETA.textoSuave }} />,
};

// ── Renderizado mínimo de markdown (negrita + saltos de línea) ──────────────
function renderMd(texto: string) {
  return texto.split('\n').map((linea, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {linea.split(/\*\*(.*?)\*\*/g).map((parte, j) =>
        j % 2 === 1 ? <strong key={j}>{parte}</strong> : parte,
      )}
    </span>
  ));
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────
function Burbuja({ m }: { m: ChatMessage }) {
  const esAgente = m.rol === 'agente';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: esAgente ? 'flex-start' : 'flex-end',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      {esAgente && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: PALETA.azulSuave,
            color: PALETA.azulOscuro,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          IA
        </div>
      )}
      <div
        style={{
          maxWidth: '76%',
          padding: '11px 16px',
          borderRadius: esAgente ? '6px 20px 20px 20px' : '20px 6px 20px 20px',
          background: esAgente ? PALETA.superficie : PALETA.azul,
          color: esAgente ? PALETA.texto : '#ffffff',
          boxShadow: esAgente ? ELEVACION.base : 'none',
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {m.streaming && m.texto === '' ? (
          <span style={{ opacity: 0.45, letterSpacing: 3 }}>●●●</span>
        ) : (
          renderMd(m.texto)
        )}
      </div>
    </div>
  );
}

// ── Campo de la ficha ─────────────────────────────────────────────────────
interface CampoProps {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  destacado: boolean;
  multiline?: boolean;
  opciones?: { value: string; label: string }[];
  placeholder?: string;
}

function Campo({ label, valor, onChange, destacado, multiline, opciones, placeholder = '' }: CampoProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: destacado ? PALETA.azulOscuro : PALETA.textoTenue,
          marginBottom: 5,
          paddingLeft: 14,
          transition: 'color 0.4s ease',
        }}
      >
        {label}
      </div>
      <div
        style={{
          borderRadius: 14,
          backgroundColor: destacado ? PALETA.azulSuave : '#f6f7f9',
          transition: 'background-color 1.6s ease',
          padding: opciones ? '3px 4px' : '7px 14px 8px',
        }}
      >
        {opciones ? (
          <Select
            variant="borderless"
            style={{ width: '100%' }}
            value={valor || undefined}
            onChange={onChange}
            placeholder={<span style={{ color: '#a9adb3' }}>{placeholder}</span>}
            options={opciones}
            size="small"
          />
        ) : multiline ? (
          <Input.TextArea
            variant="borderless"
            autoSize={{ minRows: 2, maxRows: 5 }}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ padding: 0, resize: 'none', fontSize: 14 }}
          />
        ) : (
          <Input
            variant="borderless"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ padding: 0, fontSize: 14 }}
          />
        )}
      </div>
    </div>
  );
}

const TIPO_OPCIONES = Object.entries(TIPO_SOLICITUD_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const VIA_OPCIONES = Object.entries(VIA_PROCESAL_LABEL).map(([value, label]) => ({
  value,
  label,
}));

// Campos mínimos para poder radicar — alimentan la barra de progreso.
const CAMPOS_MINIMOS: (keyof CasoDraft)[] = ['tipo', 'querellante', 'querellado', 'comportamiento'];

// ── Página principal ─────────────────────────────────────────────────────
export function IntakePage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = antMessage.useMessage();
  const { mensajes, draft, setDraft, cargando, recentFields, enviar, completoMinimo } = useIntakeChat();
  const [inputText, setInputText] = useState('');
  const [radicando, setRadicando] = useState(false);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function agregarAnexos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const nuevos: Anexo[] = Array.from(files).map((f) => ({
      id: `anexo-${crypto.randomUUID().slice(0, 8)}`,
      nombre: f.name,
      tipo: tipoDesdeNombre(f.name),
      tamano: `${Math.max(1, Math.round(f.size / 1024))} KB`,
    }));
    setAnexos((prev) => [...prev, ...nuevos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  function handleEnviar() {
    const texto = inputText.trim();
    if (!texto) return;
    setInputText('');
    void enviar(texto);
  }

  async function radicar() {
    if (!completoMinimo) return;
    setRadicando(true);
    const documentos = anexos.map((a) => ({ nombre: a.nombre, tipo: a.tipo }));
    try {
      if (draft.tipo === 'queja') {
        const created = await apiFetch<Queja>('/quejas', {
          method: 'POST',
          body: JSON.stringify({
            quejoso: draft.querellante,
            acusado: draft.querellado,
            asunto: draft.comportamiento,
            categoria: 'otro',
            diasTermino: TERMINOS.quejaDias,
            documentos,
          }),
        });
        navigate(`/panel/quejas/${created.id}`);
      } else {
        const created = await apiFetch<Querella>('/querellas', {
          method: 'POST',
          body: JSON.stringify({
            querellante: draft.querellante,
            querellado: draft.querellado,
            asunto: draft.comportamiento,
            diasTermino: TERMINOS.querellaDias,
            direccionInmueble: draft.direccion,
            documentos,
          }),
        });
        navigate(`/panel/querellas/${created.id}`);
      }
    } catch {
      void messageApi.error('No se pudo radicar el caso. Intente de nuevo.');
      setRadicando(false);
    }
  }

  function setField<K extends keyof CasoDraft>(k: K, v: CasoDraft[K]) {
    setDraft((prev) => ({ ...prev, [k]: v }));
  }

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const camposListos = CAMPOS_MINIMOS.filter((k) => (draft[k] ?? '').trim() !== '').length;
  const progreso = camposListos / CAMPOS_MINIMOS.length;

  return (
    <>
      {contextHolder}
      <div
        style={{
          height: 'calc(100vh - 64px)',
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
          background: '#f4f6f9',
        }}
      >
        {/* ── Panel izquierdo: chat ──────────────────────────── */}
        <div
          style={{
            flex: '1 1 62%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Encabezado del chat — ligero, sin barras */}
          <div style={{ padding: '20px 32px 6px', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: PALETA.texto, lineHeight: 1.2 }}>
              Asistente de radicación
            </div>
            <div style={{ fontSize: 12.5, color: PALETA.textoSuave, marginTop: 3 }}>
              Cuénteme la situación: iré completando la ficha automáticamente
            </div>
          </div>

          {/* Lista de mensajes */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '18px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {mensajes.map((m, i) => (
              <Burbuja key={i} m={m} />
            ))}
          </div>

          {/* Barra de entrada flotante */}
          <div style={{ padding: '6px 24px 20px', flexShrink: 0 }}>
            {anexos.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: '0 10px 10px',
                }}
              >
                {anexos.map((a) => (
                  <span
                    key={a.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      background: PALETA.superficie,
                      borderRadius: 999,
                      padding: '5px 6px 5px 12px',
                      fontSize: 12.5,
                      color: PALETA.texto,
                      boxShadow: ELEVACION.base,
                      maxWidth: 260,
                    }}
                  >
                    {ICONO_ANEXO[a.tipo]}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.nombre}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      shape="circle"
                      icon={<CloseOutlined style={{ fontSize: 10 }} />}
                      aria-label={`Quitar ${a.nombre}`}
                      onClick={() => setAnexos((prev) => prev.filter((x) => x.id !== a.id))}
                    />
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 6,
                background: PALETA.superficie,
                borderRadius: 26,
                padding: '8px 8px 8px 10px',
                boxShadow: ELEVACION.media,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => agregarAnexos(e.target.files)}
              />
              <Tooltip title="Adjuntar documentos del caso (PDF, imagen o texto)">
                <Button
                  type="text"
                  shape="circle"
                  icon={<PaperClipOutlined />}
                  aria-label="Adjuntar documentos"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flexShrink: 0, color: PALETA.textoSuave }}
                />
              </Tooltip>
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 5 }}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEnviar();
                  }
                }}
                variant="borderless"
                placeholder="Describa la situación o responda al asistente…"
                style={{ resize: 'none', fontSize: 14, padding: '8px 0' }}
                disabled={cargando}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<SendOutlined />}
                onClick={handleEnviar}
                disabled={cargando || !inputText.trim()}
                style={{ flexShrink: 0 }}
              />
            </div>
          </div>
        </div>

        {/* ── Panel derecho: ficha flotante ───────────────────── */}
        <div
          style={{
            flex: '0 0 38%',
            maxWidth: 480,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px 20px 4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: PALETA.superficie,
              borderRadius: 24,
              boxShadow: ELEVACION.media,
              overflow: 'hidden',
            }}
          >
            {/* Encabezado suave */}
            <div style={{ padding: '22px 24px 14px', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: PALETA.textoTenue,
                  marginBottom: 6,
                }}
              >
                {DESPACHO.nombre} · {CNSCC.ley}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: PALETA.texto }}>
                  Ficha de radicación
                </span>
                {draft.viaProcesal && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: PALETA.azulSuave,
                      color: PALETA.azulOscuro,
                      padding: '3px 12px',
                      borderRadius: 12,
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    {VIA_PROCESAL_LABEL[draft.viaProcesal]}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: PALETA.textoTenue,
                  marginTop: 4,
                  textTransform: 'capitalize' as const,
                }}
              >
                {fechaHoy}
              </div>

              {/* Progreso de la ficha — se llena con la conversación */}
              <div
                style={{
                  marginTop: 14,
                  height: 5,
                  borderRadius: 999,
                  background: '#eef0f3',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(progreso * 100, 4)}%`,
                    borderRadius: 999,
                    background: progreso >= 1 ? PALETA.verde : PALETA.azul,
                    transition: 'width 0.8s ease, background 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Campos de la ficha */}
            <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 8px' }}>
              <Campo
                label="Tipo de solicitud"
                valor={draft.tipo}
                onChange={(v) => setField('tipo', v as CasoDraft['tipo'])}
                destacado={recentFields.has('tipo')}
                opciones={TIPO_OPCIONES}
                placeholder="Querella o Queja"
              />
              <Campo
                label="Querellante / Quejoso"
                valor={draft.querellante}
                onChange={(v) => setField('querellante', v)}
                destacado={recentFields.has('querellante')}
                placeholder="Nombre completo"
              />
              <Campo
                label="Querellado / Acusado"
                valor={draft.querellado}
                onChange={(v) => setField('querellado', v)}
                destacado={recentFields.has('querellado')}
                placeholder="Nombre completo"
              />
              <Campo
                label="Comportamiento"
                valor={draft.comportamiento}
                onChange={(v) => setField('comportamiento', v)}
                destacado={recentFields.has('comportamiento')}
                multiline
                placeholder="Descripción del comportamiento reportado"
              />
              <Campo
                label="Artículo infringido"
                valor={draft.articuloInfringido}
                onChange={(v) => setField('articuloInfringido', v)}
                destacado={recentFields.has('articuloInfringido')}
                placeholder="Norma aplicable"
              />
              <Campo
                label="Dirección / Lugar de los hechos"
                valor={draft.direccion}
                onChange={(v) => setField('direccion', v)}
                destacado={recentFields.has('direccion')}
                placeholder="Ej: Calle 45 # 12-30"
              />
              <Campo
                label="Vía procesal"
                valor={draft.viaProcesal}
                onChange={(v) => setField('viaProcesal', v as CasoDraft['viaProcesal'])}
                destacado={recentFields.has('viaProcesal')}
                opciones={VIA_OPCIONES}
                placeholder="Tipo de proceso"
              />
              <Campo
                label="Próximo paso"
                valor={draft.proximoPaso}
                onChange={(v) => setField('proximoPaso', v)}
                destacado={recentFields.has('proximoPaso')}
                multiline
                placeholder="Acción procesal siguiente"
              />
              <Campo
                label="Anotaciones"
                valor={draft.anotaciones}
                onChange={(v) => setField('anotaciones', v)}
                destacado={recentFields.has('anotaciones')}
                multiline
                placeholder="Observaciones adicionales del inspector"
              />

              {anexos.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: PALETA.textoTenue,
                      marginBottom: 6,
                      paddingLeft: 14,
                    }}
                  >
                    Anexos aportados ({anexos.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acción */}
            <div style={{ padding: '10px 20px 20px', flexShrink: 0 }}>
              <Button
                type="primary"
                block
                size="large"
                disabled={!completoMinimo}
                loading={radicando}
                onClick={radicar}
                style={{ fontWeight: 600 }}
              >
                Radicar caso
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
