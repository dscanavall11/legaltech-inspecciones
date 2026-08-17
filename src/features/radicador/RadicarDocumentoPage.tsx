import { useRef, useState, useEffect } from 'react';
import { uid } from '@/shared/util/uid';
import {
  Button,
  Typography,
  Input,
  App,
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
import { NormaMark } from '@/shared/ai/NormaMark';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { legalCasesKeys } from '@/shared/legalCases/api';
import { buildCaseMetadata, type CreateLegalCaseInput, type LegalCase } from '@/shared/legalCases/types';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { PALETA, ELEVACION } from '@/theme/theme';
import type { ReactNode } from 'react';
import { useRadicacionIA, type RadicacionDraft } from './useRadicacionIA';

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

function Campo({
  label,
  valor,
  onChange,
  destacado,
  multiline,
  placeholder = '',
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  destacado?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
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
          padding: multiline ? '7px 14px 8px' : '7px 14px',
        }}
      >
        {multiline ? (
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

/**
 * Radicación guiada por chat de Apelación y Fallo de 2ª instancia.
 * Replica la interfaz del radicador de quejas/querellas: chat a la izquierda,
 * ficha a la derecha que se completa en tiempo real. El humano aporta los
 * datos fácticos; la IA solo redacta la fundamentación (campo sustento).
 */
export function RadicarDocumentoPage({
  tipo: tipoProp,
  selector,
}: { tipo?: TipoRadicar; selector?: ReactNode } = {}) {
  const { message: msg } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const tipo = tipoProp ?? ((location.pathname.split('/').pop() ?? 'apelacion') as TipoRadicar);

  const { mensajes, draft, setDraft, cargando, recentFields, enviar, completoMinimo } =
    useRadicacionIA(tipo);

  const [inputText, setInputText] = useState('');
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [radicando, setRadicando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const titulo = tipo === 'apelacion' ? 'Apelación' : 'Fallo (2.ª instancia)';
  const icono = tipo === 'apelacion' ? <FileOutlined /> : <CheckCircleOutlined />;
  const colorIcono = tipo === 'apelacion' ? '#f9ab00' : '#9334e6';
  const colorFondo = tipo === 'apelacion' ? '#fff8e1' : '#f3e8fd';
  const terminoTexto =
    tipo === 'apelacion'
      ? '3 días hábiles (art. 223 num. 4 Ley 1801/2016)'
      : 'Según resolución recurrida';

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes]);

  function agregarAnexos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const nuevos: Anexo[] = Array.from(files).map((f) => ({
      id: `anexo-${uid().slice(0, 8)}`,
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

  function setField<K extends keyof RadicacionDraft>(k: K, v: RadicacionDraft[K]) {
    setDraft((prev) => ({ ...prev, [k]: v }));
  }

  async function asistirFundamentacion() {
    if (!draft.partes && !draft.radicadoOrigen) {
      msg.warning('Indique primero el radicado de origen y las partes para que la IA redacte.');
      return;
    }
    await enviar(
      `Redacta la FUNDAMENTACIÓN jurídica de esta ${titulo.toLowerCase()} citando los artículos ` +
        `pertinentes de la Ley 1801 de 2016 (arts. 223, 223A, 77, 92 según aplique) a partir de ` +
        `los hechos que le he dado. La respuesta debe comenzar por "FUNDAMENTACIÓN:".`,
    );
  }

  async function radicar() {
    if (!completoMinimo) return;
    setRadicando(true);
    try {
      // No existe /radicaciones en el backend real: se crea con el mismo
      // recurso genérico que comparendos/intake, POST /legal-cases
      // (agnóstico a caseType). "partes" llega como texto libre del chat, no
      // separado por rol/documento, así que no se mapea a CaseParty[]
      // estructurado — se pierde esa estructura, solo queda el texto en
      // caseMetadata.partes.
      const { municipio, inspeccion } = useInspeccionStore.getState().config;
      const input: CreateLegalCaseInput = {
        caseType: tipo,
        // class_name y judicial_office_id son NOT NULL en el backend.
        className: `${titulo} — ${draft.radicadoOrigen}`.trim(),
        judicialOfficeId: inspeccion || 'Inspección de Convivencia y Paz',
        venueCity: municipio || 'Manizales',
        caseMetadata: buildCaseMetadata({
          radicadoOrigen: draft.radicadoOrigen,
          partes: draft.partes,
          fechaDecision: draft.fechaDecision,
          fundamentos: draft.fundamentos,
        }),
        background: {
          allegedFacts: draft.sustento || null,
          reliefSought: null,
          defensesAndObjections: null,
        },
      };

      const caso = await apiFetch<LegalCase>('/legal-cases', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      // Anexos: mismo endpoint de subida que usa la ficha de documentos del expediente.
      for (const a of anexos) {
        const body = new FormData();
        body.append('file', a.file, a.nombre);
        await apiFetch(`/tools/expedientes/${caso.id}/documents`, { method: 'POST', body });
      }

      // Sin esto, que el expediente aparezca en Mis procesos depende de que
      // useLegalCases no declare staleTime: hoy refetchea al montar y funciona,
      // pero el día que alguien le ponga uno por rendimiento la radicación
      // dejaría de verse, en silencio. Se declara la invalidación.
      await queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });

      msg.success(`${titulo} radicada exitosamente: ${caso.filingNumber}`);
      setTimeout(() => navigate('/panel/procesos'), 650);
    } catch {
      msg.error('No se pudo radicar el documento. Intente de nuevo.');
      setRadicando(false);
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', gap: 0, overflow: 'hidden', background: '#f4f6f9' }}>
      {/* Panel izquierdo: chat */}
      <div style={{ flex: '1 1 62%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '20px 32px 6px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: colorFondo,
                color: colorIcono,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {icono}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: PALETA.texto }}>Asistente de radicación — {titulo}</div>
              <div style={{ fontSize: 12.5, color: PALETA.textoSuave }}>
                Cuénteme los hechos; iré completando la ficha automáticamente.
              </div>
            </div>
          </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '18px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mensajes.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: m.rol === 'inspector' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: m.rol === 'inspector' ? PALETA.azul : '#fff',
                  color: m.rol === 'inspector' ? '#fff' : PALETA.texto,
                  whiteSpace: 'pre-wrap',
                  boxShadow: ELEVACION.base,
                }}
              >
                {m.texto || <Text type="secondary" italic>Escribiendo…</Text>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '6px 24px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, background: PALETA.superficie, borderRadius: 26, padding: '8px 8px 8px 10px', boxShadow: ELEVACION.media }}>
            <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 5 }}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const t = inputText.trim();
                  if (t) {
                    setInputText('');
                    void enviar(t);
                  }
                }
              }}
              variant="borderless"
              placeholder="Describa la situación o responda al asistente…"
              style={{ resize: 'none', fontSize: 14, padding: '8px 0' }}
              disabled={cargando}
            />
            <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={() => {
              const t = inputText.trim();
              if (t) { setInputText(''); void enviar(t); }
            }} disabled={cargando || !inputText.trim()} style={{ flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* Panel derecho: ficha */}
      <div style={{ flex: '0 0 38%', maxWidth: 480, display: 'flex', flexDirection: 'column', padding: '20px 24px 20px 4px', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PALETA.superficie, borderRadius: 24, boxShadow: ELEVACION.media, overflow: 'hidden' }}>
          {selector && <div style={{ padding: '18px 20px 4px', flexShrink: 0 }}>{selector}</div>}
          <div style={{ padding: '18px 24px 14px', flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: PALETA.texto }}>Ficha de radicación</div>
            <div style={{ fontSize: 12, color: PALETA.textoTenue, marginTop: 4, textTransform: 'capitalize' }}>
              {titulo} · término {terminoTexto}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 8px' }}>
            <Campo label="Radicado de origen" valor={draft.radicadoOrigen} onChange={(v) => setField('radicadoOrigen', v)} destacado={recentFields.has('radicadoOrigen')} placeholder="2026-00123" />
            <Campo label="Partes (querellante / querellado)" valor={draft.partes} onChange={(v) => setField('partes', v)} destacado={recentFields.has('partes')} multiline placeholder="Nombres completos de las partes" />
            <Campo
              label="Fecha de la decisión recurrida"
              valor={draft.fechaDecision}
              onChange={(v) => setField('fechaDecision', v)}
              placeholder="DD/MM/AAAA"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Button size="small" icon={<NormaMark size={14} />} onClick={() => void asistirFundamentacion()} loading={cargando}>
                IA: redactar fundamentación
              </Button>
            </div>
            <Campo label="Sustento / fundamentación" valor={draft.sustento} onChange={(v) => setField('sustento', v)} destacado={recentFields.has('sustento')} multiline placeholder="La IA redacta la fundamentación jurídica; usted la revisa y ajusta." />

            {anexos.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: PALETA.textoTenue, marginBottom: 6, paddingLeft: 14 }}>
                  Anexos ({anexos.length})
                </div>
                {anexos.map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f6f7f9', borderRadius: 14, padding: '8px 14px', fontSize: 13, color: PALETA.texto, marginBottom: 6 }}>
                    {ICONO_ANEXO[a.tipo]}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</span>
                    <span style={{ fontSize: 11.5, color: PALETA.textoTenue }}>{a.tamano}</span>
                    <Button type="text" size="small" shape="circle" icon={<CloseOutlined style={{ fontSize: 10 }} />} onClick={() => quitarAnexo(a.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '10px 20px 20px', flexShrink: 0 }}>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx" style={{ display: 'none' }} onChange={(e) => agregarAnexos(e.target.files)} />
            <Button icon={<UploadOutlined />} block onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 10, borderRadius: 12 }}>
              Adjuntar resolución recurrida
            </Button>
            <Button type="primary" block size="large" disabled={!completoMinimo} loading={radicando} onClick={() => void radicar()} style={{ fontWeight: 600, borderRadius: 12 }}>
              Radicar {titulo}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
