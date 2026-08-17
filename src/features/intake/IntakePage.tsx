import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { legalCasesKeys } from '@/shared/legalCases/api';
import { uid } from '@/shared/util/uid';
import { Button, Input, Tooltip } from 'antd';
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
import { documentTypeFromFileName, type CaseDocumentType } from '@/shared/documentos/types';
import { DESPACHO, TIPO_SOLICITUD_LABEL, CNSCC, type TipoSolicitud } from '@/derecho';
import type { ChatMessage } from './useIntakeChat';
import { useIntakeChat } from './useIntakeChat';
import dayjs from 'dayjs';
import { fechaLarga } from '@/shared/util/fechas';
import { NormaMark } from '@/shared/ai/NormaMark';
import { ELEVACION, PALETA } from '@/theme/theme';

// Anexo aportado en el chat antes de radicar (prueba documental del caso).
// Conserva el File real: sin él no hay nada que enviarle a /api/legal/recepcion.
interface Anexo {
  id: string;
  nombre: string;
  tipo: CaseDocumentType;
  tamano: string;
  archivo: File;
}

const ICONO_ANEXO: Record<CaseDocumentType, ReactNode> = {
  PDF: <FilePdfOutlined style={{ color: PALETA.rojo }} />,
  IMAGEN: <FileImageOutlined style={{ color: PALETA.verde }} />,
  WORD: <FileTextOutlined style={{ color: PALETA.azul }} />,
  AUDIO: <FileTextOutlined style={{ color: PALETA.morado }} />,
  OTRO: <FileOutlined style={{ color: PALETA.textoSuave }} />,
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

function etiquetaTipo(tipo: string | null): string | null {
  if (!tipo) return null;
  return TIPO_SOLICITUD_LABEL[tipo as TipoSolicitud] ?? tipo;
}

const ROL_LABEL: Record<string, string> = {
  querellante: 'Querellante',
  querellado: 'Querellado',
  quejoso: 'Quejoso',
  acusado: 'Acusado',
};

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
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <NormaMark size={30} />
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

// ── Campo de la ficha (solo lectura: lo llena la IA, no el inspector) ──────
function CampoLectura({
  label,
  valor,
  destacado,
  vacio = 'Aún no informado',
}: {
  label: string;
  valor: ReactNode;
  destacado: boolean;
  vacio?: string;
}) {
  const esVacio = valor === null || valor === undefined || valor === '';
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
          padding: '7px 14px 8px',
          fontSize: 14,
          lineHeight: 1.5,
          color: esVacio ? PALETA.textoTenue : PALETA.texto,
        }}
      >
        {esVacio ? vacio : valor}
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────
export function IntakePage({ selector }: { selector?: ReactNode } = {}) {
  const navigate = useNavigate();
  const { mensajes, draft, cargando, recentFields, enviar, casoRadicado } = useIntakeChat();
  const queryClient = useQueryClient();

  // Aquí radica el backend, no el frontend: el expediente aparece sin que esta
  // pantalla lo cree. Si no se invalida, Mis procesos lo muestra solo porque
  // useLegalCases refetchea al montar — un accidente que se pierde el día que
  // alguien le declare un staleTime.
  useEffect(() => {
    if (casoRadicado) void queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });
  }, [casoRadicado, queryClient]);
  const [inputText, setInputText] = useState('');
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function agregarAnexos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const nuevos: Anexo[] = Array.from(files).map((f) => ({
      id: `anexo-${uid().slice(0, 8)}`,
      nombre: f.name,
      tipo: documentTypeFromFileName(f.name),
      tamano: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      archivo: f,
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
    // anexos stays populated (not cleared here): el agente vuelve a ver todos
    // los adjuntos en cada turno, no solo los nuevos, hasta que radique.
    void enviar(
      texto,
      anexos.map((a) => a.archivo),
    );
  }

  const fechaHoy = fechaLarga(dayjs(), 'dddd, D [de] MMMM [de] YYYY');

  // El caso se radica solo, en el backend, cuando la IA marca
  // listoParaRadicar=true (ver IntakeCaseCreationGate + recepcionRules.st) -
  // este progreso es solo informativo, no gatea ninguna acción del inspector.
  const camposClave = [Boolean(draft.tipoSolicitud), draft.partes.length > 0, Boolean(draft.hechos)];
  const camposListos = camposClave.filter(Boolean).length;
  const progreso = draft.listoParaRadicar ? 1 : camposListos / camposClave.length;

  return (
    <>
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

          {casoRadicado && (
            <div
              style={{
                margin: '0 32px 12px',
                padding: '12px 16px',
                borderRadius: 10,
                background: PALETA.verdeBg,
                border: `1px solid ${PALETA.verde}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 13 }}>
                <strong>Caso radicado:</strong> {casoRadicado.filingNumber} · estado{' '}
                <strong>{casoRadicado.currentStateCode}</strong>
              </div>
              {casoRadicado.readyForFallo && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate(`/panel/analisis?caso=${casoRadicado.id}`)}
                >
                  Ir a Fallo
                </Button>
              )}
            </div>
          )}

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
            {selector && (
              <div style={{ padding: '18px 20px 4px', flexShrink: 0 }}>{selector}</div>
            )}

            {/* Encabezado suave */}
            <div style={{ padding: '18px 24px 14px', flexShrink: 0 }}>
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
                {draft.radicado && (
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
                    {draft.radicado}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: PALETA.textoTenue,
                  marginTop: 4,
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

            {/* Campos de la ficha — reflejan lo que la IA ya extrajo */}
            <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 8px' }}>
              <CampoLectura
                label="Tipo de solicitud"
                valor={etiquetaTipo(draft.tipoSolicitud)}
                destacado={recentFields.has('tipoSolicitud')}
              />
              <CampoLectura
                label="Partes"
                destacado={recentFields.has('partes')}
                valor={
                  draft.partes.length > 0
                    ? draft.partes.map((p, i) => (
                        <div key={i} style={{ marginBottom: i < draft.partes.length - 1 ? 4 : 0 }}>
                          <strong>{ROL_LABEL[p.rol] ?? p.rol}:</strong> {p.nombre}
                          {p.numeroId ? ` (${p.tipoId ?? 'ID'} ${p.numeroId})` : ''}
                        </div>
                      ))
                    : null
                }
              />
              <CampoLectura
                label="Hechos"
                valor={draft.hechos}
                destacado={recentFields.has('hechos')}
              />
              <CampoLectura
                label="Pretensión"
                valor={draft.pretension}
                destacado={recentFields.has('pretension')}
              />
              <CampoLectura
                label="Juzgado / Inspección"
                valor={draft.juzgado}
                destacado={recentFields.has('juzgado')}
              />
              <CampoLectura
                label="Ciudad"
                valor={draft.ciudad}
                destacado={recentFields.has('ciudad')}
              />
              <CampoLectura
                label="Categorías"
                destacado={recentFields.has('categorias')}
                valor={
                  draft.categorias.length > 0
                    ? draft.categorias.map((c) => (
                        <span
                          key={c}
                          style={{
                            display: 'inline-block',
                            background: PALETA.azulSuave,
                            color: PALETA.azulOscuro,
                            borderRadius: 999,
                            padding: '2px 10px',
                            fontSize: 12,
                            marginRight: 6,
                            marginBottom: 4,
                          }}
                        >
                          {c}
                        </span>
                      ))
                    : null
                }
              />
              <CampoLectura
                label="Observaciones"
                valor={draft.observaciones}
                destacado={recentFields.has('observaciones')}
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

            {/* Estado — la radicación es automática en el backend una vez
                completa la información obligatoria, no hay acción manual. */}
            <div style={{ padding: '10px 20px 20px', flexShrink: 0 }}>
              <div
                style={{
                  textAlign: 'center' as const,
                  fontSize: 12.5,
                  color: casoRadicado ? PALETA.verde : PALETA.textoTenue,
                  fontWeight: 500,
                  padding: '8px 0',
                }}
              >
                {casoRadicado
                  ? 'Caso radicado automáticamente.'
                  : draft.listoParaRadicar
                    ? 'Información completa — radicando…'
                    : 'El caso se radica solo al completar la información obligatoria.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
