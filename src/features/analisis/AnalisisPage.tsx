import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Descriptions, Input, Skeleton, Spin, Tag, Typography, App } from 'antd';
import { DownloadOutlined, PrinterOutlined, SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import { NormaMark } from '@/shared/ai/NormaMark';
import { ELEVACION, PALETA } from '@/theme/theme';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { useChangeCaseState, useUpdateCaseFields } from '@/shared/legalCases/api';
import { buildCaseMetadata, parseCaseMetadata } from '@/shared/legalCases/types';
import {
  analizarEstructurado,
  getLegalCase,
  type ComplaintResponseFields,
  type Discrepancy,
  type LegalCase,
} from './api';
import { construirDocumentoFallo, type BorradorFallo } from './falloDocumento';
import {
  descargarDocumentoLegalPdf,
  generarDocumentoLegalBlob,
} from '@/shared/documentos/documentoLegalPdf';
import { descargarDocumentoLegalDocx } from '@/shared/documentos/documentoLegalDocx';
import { useUploadCaseDocument } from '@/shared/documentos/api';

// legalReasoning/evidenceAssessment ya existen como columnas genéricas en
// legal-cases - se reutilizan para guardar el fallo en vez de pedir columnas
// nuevas. antecedents/juridicProblem/juridicFundamentals (más específicos de
// "fallo") van al caseMetadata opaco.
function guardarBorradorEnCampos(
  borrador: BorradorFallo,
  metaActual: Record<string, unknown>,
  resolucionInspector?: string,
) {
  return {
    legalReasoning: borrador.juridicResponse,
    evidenceAssessment: borrador.evidences,
    caseMetadata: buildCaseMetadata({
      ...metaActual,
      antecedents: borrador.antecedents,
      juridicProblem: borrador.juridicProblem,
      juridicFundamentals: borrador.juridicFundamentals,
      parteResolutiva: borrador.parteResolutiva,
      // Resolución del inspector cuando la IA no alcanzó consenso (queda en el expediente).
      ...(resolucionInspector?.trim() ? { deliberationResolution: resolucionInspector.trim() } : {}),
    }),
  };
}

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CAMPO_LABEL: Record<keyof BorradorFallo, string> = {
  antecedents: 'Antecedentes',
  juridicProblem: 'Problema jurídico',
  evidences: 'Pruebas valoradas',
  juridicFundamentals: 'Fundamentos jurídicos',
  juridicResponse: 'Consideraciones del despacho',
  parteResolutiva: 'Parte resolutiva (solo si la etapa procesal ya admite decisión)',
};

const BORRADOR_VACIO: BorradorFallo = {
  antecedents: '',
  juridicProblem: '',
  juridicFundamentals: '',
  juridicResponse: '',
  evidences: '',
  parteResolutiva: '',
};

function Tarjeta({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: PALETA.superficie,
        borderRadius: 20,
        boxShadow: ELEVACION.base,
        padding: '18px 20px',
        marginBottom: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Editor del fallo: trae el caso (?caso=<id>) y su expediente saneado,
 * pide a la IA un borrador estructurado (campos separados, no texto plano)
 * y deja que el inspector los edite antes de exportar a PDF. Mismo patrón
 * de dos columnas (formulario editable + vista previa con membrete) que
 * ActasFirmezaPage.
 */
export function AnalisisPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const casoId = searchParams.get('caso');
  const inspeccion = useInspeccionStore((s) => s.config);
  const cambiarEstado = useChangeCaseState();
  const actualizarCampos = useUpdateCaseFields();
  const subir = useUploadCaseDocument(casoId ?? '');

  // Archiva el fallo proferido como versión en el expediente S3 (advisory:
  // un fallo del PDF nunca debe tumbar el guardado del fallo ya proferido).
  const archivarFalloEnExpediente = () => {
    if (!documento) return;
    generarDocumentoLegalBlob(documento, inspeccion.membreteDataUrl)
      .then((blob) =>
        subir.mutate(
          new File([blob], `${documento.tituloDocumento} ${documento.proceso || 'borrador'}.pdf`, {
            type: 'application/pdf',
          }),
        ),
      )
      .catch(() => undefined);
  };

  const [caso, setCaso] = useState<LegalCase | null>(null);
  const [cargandoCaso, setCargandoCaso] = useState(false);
  const [errorCaso, setErrorCaso] = useState<string | null>(null);

  const [borrador, setBorrador] = useState<BorradorFallo>(BORRADOR_VACIO);
  const [generando, setGenerando] = useState(false);
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null);

  // Deliberación sin consenso (HITL): argumentos en conflicto + problema
  // jurídico debatido + la resolución que dicta el inspector.
  const [sinConsenso, setSinConsenso] = useState<{ discrepancias: Discrepancy[]; problema: string } | null>(null);
  const [resolucionInspector, setResolucionInspector] = useState('');

  useEffect(() => {
    if (!casoId) return;
    setCargandoCaso(true);
    setErrorCaso(null);
    getLegalCase(casoId)
      .then(setCaso)
      .catch(() => setErrorCaso('No se pudo cargar el caso. Verifica el radicado o intenta de nuevo.'))
      .finally(() => setCargandoCaso(false));
  }, [casoId]);

  function set<K extends keyof BorradorFallo>(k: K, v: string) {
    setBorrador((prev) => ({ ...prev, [k]: v }));
  }

  async function generarBorrador() {
    setGenerando(true);
    setErrorGeneracion(null);
    try {
      const campos: ComplaintResponseFields = await analizarEstructurado(casoId ?? '', caso?.currentStateCode);
      setBorrador({
        antecedents: campos.antecedents ?? '',
        juridicProblem: campos.juridicProblem ?? '',
        juridicFundamentals: campos.juridicFundamentals ?? '',
        juridicResponse: campos.juridicResponse ?? '',
        evidences: campos.evidences ?? '',
        parteResolutiva: campos.parteResolutiva ?? '',
      });
      const huboConsenso = campos.consensusReached !== false;
      setSinConsenso(
        huboConsenso
          ? null
          : { discrepancias: campos.discrepancies ?? [], problema: campos.juridicProblem ?? '' },
      );
      if (huboConsenso) {
        message.success('Borrador generado. Revise y ajuste cada sección antes de exportar.');
      } else {
        message.warning('Los agentes no alcanzaron consenso. Revise los argumentos y resuelva antes de proferir.');
      }
    } catch (e) {
      setErrorGeneracion(
        e instanceof Error
          ? `No fue posible generar el borrador: ${e.message}`
          : 'No fue posible generar el borrador con IA.',
      );
    } finally {
      setGenerando(false);
    }
  }

  function guardarYProferir() {
    if (!casoId) return;
    const metaActual = parseCaseMetadata<Record<string, unknown>>(caso?.caseMetadata ?? null);
    actualizarCampos.mutate(
      { id: casoId, fields: guardarBorradorEnCampos(borrador, metaActual, resolucionInspector) },
      {
        onSuccess: () => {
          cambiarEstado.mutate(
            { id: casoId, state: 'fallo_emitido' },
            {
              onSuccess: () => {
                archivarFalloEnExpediente();
                message.success('Fallo guardado y proferido. Archivado en el expediente.');
                navigate('/panel/procesos');
              },
              onError: () => message.error('El fallo se guardó, pero no se pudo actualizar el estado del caso.'),
            },
          );
        },
        onError: () => message.error('No se pudo guardar el fallo. Intente de nuevo.'),
      },
    );
  }

  const hayBorrador = Object.values(borrador).some((v) => v.trim().length > 0);

  const documento = useMemo(() => {
    if (!caso || !hayBorrador) return null;
    return construirDocumentoFallo(caso, borrador, {
      municipio: inspeccion.municipio,
      inspeccion: inspeccion.inspeccion,
      inspectorNombre: inspeccion.inspectorNombre,
      inspectorCargo: inspeccion.inspectorNombre ? 'Inspector de Convivencia y Paz' : '',
    });
  }, [caso, borrador, hayBorrador, inspeccion]);

  if (!casoId) {
    return (
      <Alert
        type="info"
        showIcon
        message="Ningún caso seleccionado"
        description="Abra esta pantalla desde un caso radicado (botón «Ir a Fallo») para redactar su fallo."
      />
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 4 }}>
        Fallo
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 22 }}>
        Redacción asistida por IA del fallo — la IA propone el borrador, usted lo revisa y ajusta
        antes de exportarlo.
      </Paragraph>

      {errorCaso && <Alert type="error" showIcon message={errorCaso} style={{ marginBottom: 18 }} />}

      {sinConsenso && (
        <div
          style={{
            background: '#fff8e1',
            border: '1px solid #f9ab00',
            borderRadius: 18,
            padding: '18px 22px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <WarningOutlined style={{ color: '#b06a00', fontSize: 20 }} />
            <Text strong style={{ fontSize: 15.5, color: '#7a4a00' }}>
              Los agentes de IA no alcanzaron consenso
            </Text>
          </div>
          <Text style={{ display: 'block', color: '#6b4a10', fontSize: 13, marginBottom: 14 }}>
            El análisis quedó como borrador. Revise los argumentos en conflicto, decida el punto de
            derecho y deje constancia de su resolución antes de proferir el fallo.
          </Text>

          {sinConsenso.problema.trim() && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8a5a00',
                  marginBottom: 4,
                }}
              >
                Problema jurídico debatido
              </div>
              <Text style={{ color: '#3a2a08', whiteSpace: 'pre-wrap' }}>{sinConsenso.problema}</Text>
            </div>
          )}

          {sinConsenso.discrepancias.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8a5a00',
                  marginBottom: 8,
                }}
              >
                Argumentos en conflicto
              </div>
              {sinConsenso.discrepancias.map((d, i) => (
                <div
                  key={`${d.affectedField}-${i}`}
                  style={{
                    background: '#fffdf5',
                    border: '1px solid #f0dca0',
                    borderRadius: 12,
                    padding: '10px 14px',
                    marginBottom: 8,
                  }}
                >
                  {d.affectedField?.trim() && (
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: '#5a3d00', marginBottom: 6 }}>
                      {d.affectedField}
                    </div>
                  )}
                  <div style={{ fontSize: 12.5, color: '#3a2a08', lineHeight: 1.5 }}>
                    <div>
                      <Text strong>Analista:</Text> {d.analystValue || '—'}
                    </div>
                    <div>
                      <Text strong>Auditor:</Text> {d.auditorValue || '—'}
                    </div>
                    {d.legalJustification?.trim() && (
                      <div style={{ marginTop: 4, fontStyle: 'italic', color: '#6b4a10' }}>
                        Fundamento: {d.legalJustification}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8a5a00',
                marginBottom: 4,
              }}
            >
              Resolución del inspector (queda en el expediente)
            </div>
            <TextArea
              autoSize={{ minRows: 2, maxRows: 6 }}
              value={resolucionInspector}
              onChange={(e) => setResolucionInspector(e.target.value)}
              placeholder="Dicte su decisión sobre el punto debatido y su fundamento. Sirve de retroalimentación para afinar el análisis."
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* ── Columna izquierda ─────────────────────────────────── */}
        <div style={{ flex: '1 1 380px', maxWidth: 480, minWidth: 340 }}>
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              Caso
            </Text>
            {cargandoCaso ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : caso ? (
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Radicado">{caso.filingNumber}</Descriptions.Item>
                <Descriptions.Item label="Tipo">
                  <Tag>{caso.caseType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Municipio">{caso.venueCity}</Descriptions.Item>
                <Descriptions.Item label="Estado">
                  <Tag color="blue">{caso.currentStateCode}</Tag>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">Caso no encontrado.</Text>
            )}
          </Tarjeta>

          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Expediente
            </Text>
            <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 12 }}>
              El análisis usa los datos del caso y su expediente saneado, resueltos por el servidor a
              partir del radicado.
            </Text>
            {errorGeneracion && (
              <Alert type="error" showIcon message={errorGeneracion} style={{ marginBottom: 12 }} />
            )}
            <Button
              type="primary"
              icon={generando ? <Spin size="small" /> : <NormaMark size={16} />}
              block
              disabled={generando || !caso}
              onClick={() => void generarBorrador()}
            >
              {generando ? 'Generando borrador…' : hayBorrador ? 'Regenerar borrador con IA' : 'Generar borrador con IA'}
            </Button>
          </Tarjeta>

          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 14 }}>
              Borrador del fallo
            </Text>
            {!hayBorrador ? (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Genere el borrador con IA o escriba cada sección manualmente.
              </Text>
            ) : null}
            {(Object.keys(CAMPO_LABEL) as (keyof BorradorFallo)[]).map((campo) => (
              <div key={campo} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: PALETA.textoTenue,
                    marginBottom: 4,
                  }}
                >
                  {CAMPO_LABEL[campo]}
                </div>
                <TextArea
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  value={borrador[campo]}
                  onChange={(e) => set(campo, e.target.value)}
                  placeholder="La IA redacta esta sección; usted la revisa y ajusta."
                />
              </div>
            ))}
          </Tarjeta>

          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 10 }}>
              Despacho
            </Text>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              {inspeccion.inspectorNombre
                ? `${inspeccion.inspectorNombre} — ${inspeccion.inspeccion || inspeccion.municipio}`
                : 'Configure el despacho (botón flotante "Configurar inspección") para que aparezca en la firma.'}
            </Text>
            <Button
              type="primary"
              size="large"
              block
              icon={<SafetyCertificateOutlined />}
              disabled={!hayBorrador}
              loading={cambiarEstado.isPending || actualizarCampos.isPending}
              onClick={guardarYProferir}
              style={{ fontWeight: 600, marginTop: 14 }}
            >
              Guardar y proferir fallo
            </Button>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <Button
                block
                icon={<DownloadOutlined />}
                disabled={!documento}
                onClick={() => documento && void descargarDocumentoLegalPdf(documento, inspeccion.membreteDataUrl)}
              >
                Descargar PDF
              </Button>
              <Button
                block
                icon={<DownloadOutlined />}
                disabled={!documento}
                onClick={() => documento && void descargarDocumentoLegalDocx(documento, inspeccion.membreteDataUrl)}
              >
                Descargar .docx
              </Button>
              <Button icon={<PrinterOutlined />} disabled={!documento} onClick={() => window.print()}>
                Imprimir
              </Button>
            </div>
          </Tarjeta>
        </div>

        {/* ── Columna derecha: vista previa ──────────────────────── */}
        <div style={{ flex: '1 1 520px', minWidth: 380 }}>
          {!documento ? (
            <div
              style={{
                background: PALETA.superficie,
                borderRadius: 24,
                boxShadow: ELEVACION.base,
                padding: '70px 40px',
                textAlign: 'center',
                color: PALETA.textoTenue,
              }}
            >
              <div style={{ marginBottom: 14, opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
                <NormaMark size={40} />
              </div>
              <div style={{ fontSize: 15 }}>
                Genere el borrador con IA o complete las secciones manualmente. El fallo se
                redacta aquí en tiempo real.
              </div>
            </div>
          ) : (
            <div
              id="fallo-imprimible"
              style={{
                background: PALETA.superficie,
                borderRadius: 24,
                boxShadow: ELEVACION.media,
                padding: '46px 52px',
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 13.5,
                lineHeight: 1.65,
                color: '#1b1b1f',
              }}
            >
              {inspeccion.membreteDataUrl && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img
                    src={inspeccion.membreteDataUrl}
                    alt="Membrete de la alcaldía"
                    style={{ maxWidth: '100%', maxHeight: 96, objectFit: 'contain' }}
                  />
                </div>
              )}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontWeight: 600, letterSpacing: '0.04em' }}>{documento.entidad}</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginTop: 10 }}>{documento.tituloDocumento}</div>
                <div style={{ marginTop: 2 }}>RADICADO {documento.proceso}</div>
                <div style={{ marginTop: 2 }}>{documento.fechaResolucionLetras}</div>
              </div>

              <table style={{ width: '100%', margin: '16px 0', borderCollapse: 'collapse' }}>
                <tbody>
                  {documento.tablaDatos.map((f) => (
                    <tr key={f.etiqueta}>
                      <td
                        style={{
                          padding: '3px 10px 3px 0',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          verticalAlign: 'top',
                          fontSize: 12,
                        }}
                      >
                        {f.etiqueta}:
                      </td>
                      <td style={{ padding: '3px 0', fontSize: 12.5 }}>{f.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {documento.secciones.map((s) => (
                <div key={s.titulo}>
                  <p style={{ textAlign: 'center', fontWeight: 700, marginTop: 18 }}>{s.titulo}</p>
                  {s.parrafos.map((parrafo, i) => (
                    <p key={i} style={{ textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
                      {parrafo}
                    </p>
                  ))}
                </div>
              ))}

              <p style={{ marginTop: 18 }}>{documento.cierre}</p>
              <p style={{ fontWeight: 600 }}>CÚMPLASE,</p>

              <div style={{ marginTop: 44 }}>
                <div style={{ fontWeight: 700 }}>
                  {documento.firma[0]?.nombre || '________________________'}
                </div>
                <div>{documento.firma[0]?.rol}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
