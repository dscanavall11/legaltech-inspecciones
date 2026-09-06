import { useEffect, useRef, useState } from 'react';
import {
  SendOutlined,
  PaperClipOutlined,
  UserOutlined,
  LoadingOutlined,
  PlusOutlined,
  CloseOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { FilePlus2, FileText, FileCheck2, BookOpen, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConversaciones } from '@/shared/ai/useConversaciones';
import { agrupar, GRUPOS_CONVERSACION } from '@/shared/ai/agruparConversaciones';
import { useQuerellas } from '@/features/querellas/api';
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import { PALETA } from '@/theme/palette';
import { ELEVACION } from '@/theme/theme';

/** Herramientas del despacho: el radicador y las piezas son tools del chat. */
const HERRAMIENTAS = [
  {
    label: 'Radicar querella',
    detalle: 'Intake conversacional',
    ruta: '/panel/nuevo-caso',
    icono: <FilePlus2 size={16} strokeWidth={1.9} />,
    color: PALETA.azul,
    fondo: PALETA.azulBg,
  },
  {
    label: 'Radicar documento',
    detalle: 'Apelaciones y escritos',
    ruta: '/panel/radicador',
    icono: <FileText size={16} strokeWidth={1.9} />,
    color: PALETA.verde,
    fondo: PALETA.verdeBg,
  },
  {
    label: 'Acta de firmeza',
    detalle: 'Multas en firme (art. 223A)',
    ruta: '/panel/actas-firmeza',
    icono: <FileCheck2 size={16} strokeWidth={1.9} />,
    color: PALETA.naranja,
    fondo: PALETA.naranjaBg,
  },
  {
    label: 'Consultar normas',
    detalle: 'Ley 1801 y normativa',
    ruta: '/panel/normas',
    icono: <BookOpen size={16} strokeWidth={1.9} />,
    color: PALETA.morado,
    fondo: PALETA.moradoBg,
  },
] as const;

/**
 * Workspace de Legal: un solo chat de IA para todo el despacho, con el mismo
 * lenguaje del intake de radicación — las burbujas flotan directo sobre el
 * fondo vivo (la conversación "sale del chat") y el panel derecho es la mesa
 * de trabajo: historial, herramientas (radicador incluido) y casos a la mano.
 */
export function ChatGeneralPage() {
  const { conversaciones, activa, activaId, nueva, seleccionar, enviar, enviando } = useConversaciones();
  const { data: querellas } = useQuerellas();
  const location = useLocation();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mensajes = activa?.mensajes ?? [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // "Preguntarle a Legal" desde un expediente llega con el radicado en el
  // state del router: se precarga el mensaje para conservar el contexto.
  useEffect(() => {
    const radicado = (location.state as { radicado?: string } | null)?.radicado;
    if (radicado) setInputValue((v) => v || `Sobre el radicado ${radicado}: `);
  }, [location.state]);

  const casosRecientes = (querellas ?? []).slice(0, 4);
  const grupos = agrupar(conversaciones);

  const handleSend = () => {
    if (!inputValue.trim() || enviando) return;
    const texto = inputValue.trim();
    setInputValue('');
    const archivos = adjuntos;
    setAdjuntos([]);
    enviar(texto, archivos);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.shell}>
      {/* Conversación: burbujas sobre el fondo vivo, sin caja */}
      <div style={styles.chatCol}>
        <div style={styles.messagesArea}>
          {mensajes.length === 0 && (
            <div style={styles.emptyState}>
              <NormaMark size={56} />
              <h3 className="titulo-serif" style={styles.emptyTitle}>
                {NORMA.saludo(new Date().getHours())}, soy {NORMA.nombre}
              </h3>
              <p style={styles.emptyDesc}>
                Pregúntame por tus casos, el derecho de policía o pídeme redactar una pieza. Las
                herramientas del despacho están a la derecha.
              </p>
            </div>
          )}

          {mensajes.map((msg) => {
            const esUsuario = msg.rol === 'usuario';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: esUsuario ? 'flex-end' : 'flex-start',
                  gap: 10,
                  animation: 'fadeIn 0.3s ease',
                }}
              >
                {!esUsuario && <NormaMark size={30} />}
                <div style={{ ...styles.bubble, ...(esUsuario ? styles.bubbleUsuario : styles.bubbleAsistente) }}>
                  {msg.contenido || (
                    <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
                      <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                      <span className="typing-dot" style={{ animationDelay: '200ms' }} />
                      <span className="typing-dot" style={{ animationDelay: '400ms' }} />
                    </div>
                  )}
                </div>
                {esUsuario && (
                  <div style={styles.avatarUsuario}>
                    <UserOutlined />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Adjuntos pendientes */}
        {adjuntos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 4px 8px' }}>
            {adjuntos.map((a, i) => (
              <span key={`${a.name}-${i}`} style={styles.adjuntoChip}>
                <FileOutlined />
                <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.name}
                </span>
                <button
                  onClick={() => setAdjuntos((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Quitar ${a.name}`}
                  style={styles.adjuntoQuitar}
                >
                  <CloseOutlined style={{ fontSize: 10 }} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Barra de escritura: pieza de vidrio flotante, como en el intake */}
        <div style={styles.inputBar}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) setAdjuntos((prev) => [...prev, ...Array.from(e.target.files!)]);
              e.target.value = '';
            }}
          />
          <button style={styles.attachBtn} title="Adjuntar documento" onClick={() => fileInputRef.current?.click()}>
            <PaperClipOutlined />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escríbele a ${NORMA.nombre}...`}
            disabled={enviando}
            style={styles.inputField}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || enviando}
            style={{
              ...styles.sendBtn,
              ...(inputValue.trim() && !enviando ? styles.sendBtnActive : styles.sendBtnDisabled),
            }}
            title={enviando ? 'Respondiendo…' : 'Enviar mensaje'}
          >
            {enviando ? <LoadingOutlined /> : <SendOutlined />}
          </button>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: #9aa0a6; animation: typingBounce 1.4s infinite ease-in-out; }
          @keyframes typingBounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-6px); opacity: 1; } }
          input::placeholder { color: #9aa0a6; }
        `}</style>
      </div>

      {/* Mesa de trabajo (mismo mueble que la ficha del radicador) */}
      <div style={styles.workspaceWrap}>
        <aside style={styles.workspace}>
          <div style={styles.workspaceHeader}>
            <NormaMark size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="titulo-serif" style={{ fontSize: 17, color: PALETA.texto, lineHeight: 1.2 }}>
                {NORMA.nombre}
              </div>
              <div style={{ fontSize: 12, color: PALETA.textoSuave }}>{NORMA.rol}</div>
            </div>
          </div>

          <button style={styles.nuevaBtn} onClick={() => nueva()}>
            <PlusOutlined /> Nueva conversación
          </button>

          <div style={styles.workspaceScroll}>
            {conversaciones.length === 0 ? (
              <div style={styles.sinHistorial}>Tus conversaciones con {NORMA.nombre} aparecerán acá.</div>
            ) : (
              GRUPOS_CONVERSACION.map(
                (grupo) =>
                  grupos[grupo].length > 0 && (
                    <div key={grupo} style={{ marginBottom: 12 }}>
                      <div style={styles.seccionLabel}>{grupo}</div>
                      {grupos[grupo].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => seleccionar(c.id)}
                          style={{ ...styles.itemConversacion, ...(c.id === activaId ? styles.itemActivo : {}) }}
                        >
                          <div style={styles.itemTitulo}>{c.titulo}</div>
                          <div style={styles.itemHora}>{dayjs(c.actualizadoEn).format('HH:mm')}</div>
                        </button>
                      ))}
                    </div>
                  ),
              )
            )}

            <div style={{ ...styles.seccionLabel, marginTop: 14 }}>Herramientas</div>
            {HERRAMIENTAS.map((h) => (
              <button key={h.ruta} type="button" style={styles.toolBtn} onClick={() => navigate(h.ruta)}>
                <span style={{ ...styles.toolIcono, background: h.fondo, color: h.color }}>{h.icono}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={styles.toolLabel}>{h.label}</span>
                  <span style={styles.toolDetalle}>{h.detalle}</span>
                </span>
                <ChevronRight size={13} style={{ color: PALETA.textoTenue, flexShrink: 0 }} />
              </button>
            ))}

            <div style={{ ...styles.seccionLabel, marginTop: 14 }}>Casos recientes</div>
            {casosRecientes.length === 0 && (
              <div style={styles.sinHistorial}>
                Cuando radiques casos, aparecerán acá para consultarlos con {NORMA.nombre}.
              </div>
            )}
            {casosRecientes.map((q) => (
              <button
                key={q.id}
                type="button"
                style={styles.toolBtn}
                onClick={() => navigate(`/panel/querellas/${q.id}`)}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="font-display"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: PALETA.texto,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {q.radicado}
                  </span>
                  <span style={styles.toolDetalle}>{q.asunto}</span>
                </span>
                <ChevronRight size={13} style={{ color: PALETA.textoTenue, flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    height: 'calc(100vh - 56px)',
    display: 'flex',
    overflow: 'hidden',
  },

  // ── Columna de conversación ──────────────────────────────────────────────
  chatCol: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 8px 20px 28px',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '26px 20px 8px 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: PALETA.textoTenue,
    textAlign: 'center',
    gap: 14,
  },
  emptyTitle: { margin: 0, fontSize: 24, color: PALETA.texto },
  emptyDesc: { margin: 0, fontSize: 14.5, color: PALETA.textoSuave, maxWidth: 430, lineHeight: 1.6 },
  avatarUsuario: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: PALETA.azulSuave,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: PALETA.azulOscuro,
    fontSize: 14,
    flexShrink: 0,
  },
  bubble: { maxWidth: '72%', padding: '12px 17px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  bubbleUsuario: {
    borderRadius: '20px 6px 20px 20px',
    background: PALETA.azul,
    color: '#ffffff',
  },
  bubbleAsistente: {
    borderRadius: '6px 20px 20px 20px',
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: PALETA.texto,
    boxShadow: ELEVACION.base,
  },

  // ── Barra de escritura (vidrio flotante) ─────────────────────────────────
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(18px) saturate(150%)',
    WebkitBackdropFilter: 'blur(18px) saturate(150%)',
    border: '1px solid rgba(255,255,255,0.65)',
    boxShadow: ELEVACION.media,
    marginRight: 16,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: PALETA.textoSuave,
    fontSize: 16,
  },
  adjuntoChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.85)',
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 8,
    padding: '5px 6px 5px 10px',
    fontSize: 12,
    color: PALETA.texto,
  },
  adjuntoQuitar: {
    border: 'none',
    background: '#efede7',
    borderRadius: '50%',
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: PALETA.textoSuave,
  },
  inputField: {
    flex: 1,
    height: 42,
    padding: '0 6px',
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    color: PALETA.texto,
    outline: 'none',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    transition: 'all 0.15s ease',
  },
  sendBtnActive: { background: PALETA.azul, color: '#fff', cursor: 'pointer', boxShadow: ELEVACION.base },
  sendBtnDisabled: { background: 'rgba(0,0,0,0.06)', color: PALETA.textoTenue, cursor: 'not-allowed' },

  // ── Mesa de trabajo (mismo mueble que la ficha del radicador) ────────────
  workspaceWrap: {
    flex: '0 0 34%',
    maxWidth: 420,
    minWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 24px 20px 8px',
    overflow: 'hidden',
  },
  workspace: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 24,
    boxShadow: ELEVACION.media,
    overflow: 'hidden',
  },
  workspaceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '18px 20px 10px',
    flexShrink: 0,
  },
  nuevaBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: '0 20px 8px',
    padding: '10px 16px',
    borderRadius: 12,
    border: `1px solid ${PALETA.azul}`,
    background: PALETA.azulSuave,
    color: PALETA.azulOscuro,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  workspaceScroll: { flex: 1, overflowY: 'auto', padding: '4px 14px 16px' },
  seccionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: PALETA.textoTenue,
    padding: '6px 8px',
  },
  sinHistorial: { fontSize: 12.5, color: PALETA.textoTenue, padding: '4px 8px 8px', lineHeight: 1.5 },
  itemConversacion: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    borderRadius: 10,
    padding: '9px 10px',
    cursor: 'pointer',
    marginBottom: 2,
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  itemActivo: { background: PALETA.azulSuave },
  itemTitulo: {
    fontSize: 13,
    fontWeight: 600,
    color: PALETA.texto,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  itemHora: { fontSize: 11, color: PALETA.textoTenue, flexShrink: 0 },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    borderRadius: 10,
    padding: '8px 8px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    fontFamily: 'inherit',
  },
  toolIcono: {
    width: 32,
    height: 32,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toolLabel: { display: 'block', fontSize: 13, fontWeight: 500, color: PALETA.texto },
  toolDetalle: {
    display: 'block',
    fontSize: 11.5,
    color: PALETA.textoTenue,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
