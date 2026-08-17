import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, DatePicker, Descriptions, Input, Skeleton, Spin, Tag, Typography, App } from 'antd';
import dayjs from 'dayjs';
import {
  CheckOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { NormaMark } from '@/shared/ai/NormaMark';
import { ELEVACION, PALETA } from '@/theme/theme';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { useChangeCaseState, useUpdateCaseFields } from '@/shared/legalCases/api';
import { buildCaseMetadata, parseCaseMetadata } from '@/shared/legalCases/types';
import { leerPartes } from '@/features/querellas/partes';
import {
  camposPorVerificar,
  fusionarExtraidas,
  type ParteExtraida,
} from '@/features/querellas/partesExtraidas';
import {
  analizarEstructurado,
  getLegalCase,
  type ComplaintResponseFields,
  type Discrepancy,
  type LegalCase,
} from './api';
import {
  APARTES_FALLO,
  apartesFaltantes,
  construirDocumentoFallo,
  type BorradorFallo,
} from './falloDocumento';
import { falloIdentificado, leerDatosFallo, type DatosFallo } from './datosFallo';
import { mapaDeSeudonimos, rehidratar, seudonimosSinResolver } from './rehidratar';
import { ProgresoFallo } from './ProgresoFallo';
import { GUIA_SENTIDO, guiaTramite, leerDecision } from '@/features/querellas/decisionQuerella';
import {
  descargarDocumentoLegalPdf,
  generarDocumentoLegalBlob,
} from '@/shared/documentos/documentoLegalPdf';
import {
  descargarDocumentoLegalDocx,
  generarDocumentoLegalDocxBlob,
} from '@/shared/documentos/documentoLegalDocx';
import { useUploadCaseDocument } from '@/shared/documentos/api';

// legalReasoning/evidenceAssessment ya existen como columnas genéricas en
// legal-cases - se reutilizan para guardar el fallo en vez de pedir columnas
// nuevas. antecedents/juridicProblem/juridicFundamentals (más específicos de
// "fallo") van al caseMetadata opaco.
function guardarBorradorEnCampos(
  borrador: BorradorFallo,
  metaActual: Record<string, unknown>,
  datosFallo: DatosFallo,
  resolucionInspector?: string,
) {
  return {
    legalReasoning: borrador.juridicResponse,
    evidenceAssessment: borrador.evidences,
    caseMetadata: buildCaseMetadata({
      ...metaActual,
      numeroFallo: datosFallo.numeroFallo.trim(),
      fechaFallo: datosFallo.fechaFallo,
      medidaCorrectiva: datosFallo.medidaCorrectiva.trim(),
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

// Ayuda por aparte: qué exige el decreto de cada uno. Las dos primeras son
// literales del art. 2.2.8.18.7.1 y por eso van tal cual.
const AYUDA_APARTE: Record<keyof BorradorFallo, string> = {
  competencia: 'Autoridad competente y norma que le atribuye la competencia.',
  antecedents:
    'Solo hechos concretos e indiscutibles, en orden cronológico. Sin argumentaciones, presunciones ni apreciaciones subjetivas.',
  tramite: 'Actuación inicial, citaciones, notificaciones, audiencias y pruebas practicadas.',
  juridicProblem: 'El motivo de policía formulado como pregunta asertiva.',
  evidences: 'Valoración de la prueba de ambas partes: querellante y querellado.',
  necesidadProporcionalidad:
    'Por qué la medida correctiva es —o no es— necesaria, razonable y proporcional (Decreto 768, arts. 2.2.8.18.2.1 y 2.2.8.18.2.2: la multa es la última opción).',
  juridicResponse: 'El sentido de la decisión, respondiendo la pregunta anterior.',
  juridicFundamentals: 'Constitución, Ley 1801 de 2016, Decreto 768 y jurisprudencia aplicable.',
  parteResolutiva: 'La decisión. Solo si la etapa procesal ya admite decidir de fondo.',
  recursos: 'Recursos que proceden y oportunidad para interponerlos.',
};

const BORRADOR_VACIO: BorradorFallo = {
  competencia: '',
  antecedents: '',
  tramite: '',
  juridicProblem: '',
  evidences: '',
  necesidadProporcionalidad: '',
  juridicResponse: '',
  juridicFundamentals: '',
  parteResolutiva: '',
  recursos: '',
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
export interface AnalisisPageProps {
  /**
   * Caso sobre el que se redacta. Cuando el editor va embebido en el área de
   * trabajo del expediente llega por prop; la ruta suelta /panel/analisis?caso=
   * sigue funcionando para enlaces guardados.
   */
  caseId?: string;
  /** Embebido en una pestaña: sin título propio y sin salir al terminar. */
  embebido?: boolean;
  /**
   * Analiza los documentos en cuanto carga el expediente, sin esperar a que el
   * inspector pulse "generar". Se usa al abrir un expediente desde sus propios
   * documentos, donde soltar los archivos ya expresó la intención.
   */
  autoGenerar?: boolean;
}

export function AnalisisPage({ caseId, embebido = false, autoGenerar = false }: AnalisisPageProps = {}) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const casoId = caseId ?? searchParams.get('caso');
  const inspeccion = useInspeccionStore((s) => s.config);
  const cambiarEstado = useChangeCaseState();
  const actualizarCampos = useUpdateCaseFields();
  const subir = useUploadCaseDocument(casoId ?? '');

  /**
   * Archiva el fallo proferido en el expediente, en PDF y en Word.
   *
   * El PDF es el que se firma y se notifica; el .docx es el que el despacho
   * necesita para corregir una errata sin rehacer el trámite. Archivar solo uno
   * obliga a reconstruir el otro a mano.
   *
   * Advisory: que falle la generación de un formato no puede tumbar el guardado
   * del fallo, que ya quedó proferido.
   */
  const archivarFalloEnExpediente = () => {
    if (!documento) return;
    const base = `${documento.tituloDocumento} ${documento.proceso || 'borrador'}`;

    void Promise.allSettled([
      generarDocumentoLegalBlob(documento, inspeccion.membreteDataUrl).then((blob) =>
        subir.mutateAsync(new File([blob], `${base}.pdf`, { type: 'application/pdf' })),
      ),
      generarDocumentoLegalDocxBlob(documento, inspeccion.membreteDataUrl).then((blob) =>
        subir.mutateAsync(
          new File([blob], `${base}.docx`, {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          }),
        ),
      ),
    ]);
  };

  const [caso, setCaso] = useState<LegalCase | null>(null);
  const [cargandoCaso, setCargandoCaso] = useState(false);
  const [errorCaso, setErrorCaso] = useState<string | null>(null);

  const [datosFallo, setDatosFallo] = useState<DatosFallo>(() => leerDatosFallo(null));
  // La variante de audiencia y el sentido los dispone el inspector en la
  // pestaña Audiencia; aquí solo se leen para redactar en consecuencia.
  const decision = useMemo(() => leerDecision(caso?.caseMetadata), [caso]);
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
      .then((c) => {
        setCaso(c);
        setDatosFallo(leerDatosFallo(c.caseMetadata));
      })
      .catch(() => setErrorCaso('No se pudo cargar el caso. Verifica el radicado o intenta de nuevo.'))
      .finally(() => setCargandoCaso(false));
  }, [casoId]);

  function set<K extends keyof BorradorFallo>(k: K, v: string) {
    setBorrador((prev) => ({ ...prev, [k]: v }));
  }

  /**
   * Análisis automático al abrir un expediente recién creado desde sus
   * documentos: el inspector ya dijo lo que quería al soltarlos, pedirle además
   * que baje y pulse "generar" es un paso de más.
   *
   * Corre una sola vez y solo si no hay borrador: no se pisa el trabajo de nadie
   * ni se repite el gasto al volver a la página. La extracción del texto de los
   * documentos ocurre server-side dentro de esta misma llamada.
   */
  const autoGenerado = useRef(false);
  useEffect(() => {
    if (!autoGenerar || autoGenerado.current) return;
    if (!caso || generando) return;
    if (Object.values(borrador).some((v) => v.trim().length > 0)) return;
    autoGenerado.current = true;
    void generarBorrador();
    // generarBorrador se redefine en cada render; el ref es lo que garantiza una sola pasada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerar, caso, generando]);

  /**
   * Guarda en la ficha los sujetos procesales que el analizador leyó de los
   * documentos. Rellena huecos y nunca pisa lo que el inspector escribió.
   *
   * Se avisa de qué campos vinieron de la máquina: son datos que van a
   * identificar personas en una decisión firmada, así que se cotejan contra el
   * documento, no se dan por buenos porque aparecieron solos.
   */
  async function volcarPartesExtraidas(extraidas?: ParteExtraida[]) {
    if (!casoId || !extraidas) return;
    const propuestos = camposPorVerificar(extraidas);
    if (propuestos.length === 0) return;

    const actuales = leerPartes(caso?.caseMetadata ?? null);
    const fusionadas = fusionarExtraidas(actuales, extraidas);
    const metaActual = parseCaseMetadata<Record<string, unknown>>(caso?.caseMetadata ?? null);

    actualizarCampos.mutate(
      { id: casoId, fields: { caseMetadata: buildCaseMetadata({ ...metaActual, partes: fusionadas }) } },
      {
        onSuccess: () =>
          message.info(
            `Datos del proceso extraídos de los documentos: ${propuestos.join(', ')}. Verifíquelos en la ficha antes de proferir.`,
          ),
      },
    );
  }

  async function generarBorrador() {
    setGenerando(true);
    setErrorGeneracion(null);
    try {
      const campos: ComplaintResponseFields = await analizarEstructurado(casoId ?? '', caso?.currentStateCode);
      void volcarPartesExtraidas(campos.extractedParties);
      // El expediente viaja al modelo seudonimizado, así que el borrador vuelve
      // con [PARTE_1] y [ID_1]. El fallo sí debe nombrar a las partes (art.
      // 2.2.8.18.7.1), y aquí es donde se devuelven los nombres reales.
      const seudonimos = mapaDeSeudonimos(caso?.parties);
      const real = (v?: string) => rehidratar(v ?? '', seudonimos);

      setBorrador({
        competencia: real(campos.competencia),
        antecedents: real(campos.antecedents),
        tramite: real(campos.tramite),
        juridicProblem: real(campos.juridicProblem),
        evidences: real(campos.evidences),
        necesidadProporcionalidad: real(campos.necesidadProporcionalidad),
        juridicResponse: real(campos.juridicResponse),
        juridicFundamentals: real(campos.juridicFundamentals),
        parteResolutiva: real(campos.parteResolutiva),
        recursos: real(campos.recursos),
      });

      // Un marcador que sobrevive es una parte que no está registrada. Se avisa
      // ahora, no cuando el documento ya salió con un hueco dentro.
      const sinResolver = seudonimosSinResolver(
        Object.values(campos).filter((v): v is string => typeof v === 'string').join(' '),
      ).filter((m) => !seudonimos.has(m));
      if (sinResolver.length > 0) {
        message.warning(
          `El borrador menciona partes que el expediente no tiene registradas (${sinResolver.join(', ')}). Complételas en Datos del proceso antes de proferir.`,
        );
      }
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
      { id: casoId, fields: guardarBorradorEnCampos(borrador, metaActual, datosFallo, resolucionInspector) },
      {
        onSuccess: () => {
          cambiarEstado.mutate(
            { id: casoId, state: 'fallo_emitido' },
            {
              onSuccess: () => {
                archivarFalloEnExpediente();
                message.success('Fallo guardado y proferido. Archivado en el expediente.');
                if (!embebido) navigate('/panel/procesos');
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
  // Control jurídico previo: el art. 2.2.8.18.7.1 fija nueve apartes mínimos.
  // Faltar uno no bloquea (el inspector manda), pero se advierte antes, no después.
  const faltantes = apartesFaltantes(borrador);
  const puedeProferir = hayBorrador && falloIdentificado(datosFallo);

  const documento = useMemo(() => {
    if (!caso || !hayBorrador) return null;
    return construirDocumentoFallo(
      caso,
      borrador,
      {
        municipio: inspeccion.municipio,
        inspeccion: inspeccion.inspeccion,
        inspectorNombre: inspeccion.inspectorNombre,
        inspectorCargo: inspeccion.inspectorNombre ? 'Inspector de Convivencia y Paz' : '',
      },
      datosFallo,
      decision,
    );
  }, [caso, borrador, hayBorrador, inspeccion, datosFallo, decision]);

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
      {!embebido && (
        <>
          <Title level={2} style={{ marginBottom: 4 }}>
            Fallo
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 22 }}>
            Redacción asistida por IA del fallo — la IA propone el borrador, usted lo revisa y
            ajusta antes de exportarlo.
          </Paragraph>
        </>
      )}

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

      <ProgresoFallo
        pasos={[
          {
            titulo: 'Datos del fallo',
            detalle: falloIdentificado(datosFallo) ? `No. ${datosFallo.numeroFallo}` : 'Asigne número y fecha',
            listo: falloIdentificado(datosFallo),
          },
          {
            titulo: 'Borrador',
            detalle: hayBorrador ? 'Generado' : 'Genérelo con IA o escríbalo',
            listo: hayBorrador,
          },
          {
            titulo: 'Apartes del Decreto 768',
            detalle: `${APARTES_FALLO.length - faltantes.length} de ${APARTES_FALLO.length} diligenciados`,
            listo: faltantes.length === 0,
          },
          {
            titulo: 'Proferir',
            detalle: puedeProferir ? 'Listo para firmar' : 'Complete los pasos anteriores',
            listo: false,
          },
        ]}
      />

      {caso && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 18 }}
          message={`Se redacta para ${
            decision.variante === 'continuacion' ? 'una continuación de audiencia' : 'una audiencia única'
          }, con sentido «${
            decision.sentido === 'absuelve'
              ? 'absuelve'
              : decision.sentido === 'sanciona'
                ? 'sanciona'
                : 'responsable, sin multa'
          }»`}
          description="Ambos los dispone usted en la pestaña Audiencia. La IA los motiva con la prueba del expediente; no los decide."
        />
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

          {/* Datos que determina el inspector, no la IA ni el expediente. */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              Datos del fallo
            </Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12.5, marginBottom: 14 }}>
              El número y la fecha los asigna el despacho: encabezan el documento y no se deducen
              del expediente.
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 6 }}>
                  Número del fallo
                </div>
                <Input
                  value={datosFallo.numeroFallo}
                  onChange={(e) => setDatosFallo((d) => ({ ...d, numeroFallo: e.target.value }))}
                  placeholder="2026-0000"
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 6 }}>
                  Fecha del fallo
                </div>
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  allowClear={false}
                  value={dayjs(datosFallo.fechaFallo)}
                  onChange={(d) =>
                    d && setDatosFallo((prev) => ({ ...prev, fechaFallo: d.format('YYYY-MM-DD') }))
                  }
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 6 }}>
                Medida correctiva que se impone — dejar vacío si absuelve
              </div>
              <Input
                value={datosFallo.medidaCorrectiva}
                onChange={(e) =>
                  setDatosFallo((d) => ({ ...d, medidaCorrectiva: e.target.value }))
                }
                placeholder="Multa General Tipo 2, o la medida pedagógica que corresponda"
              />
              <Text type="secondary" style={{ fontSize: 11.5 }}>
                Va literal en la parte resolutiva. Es lo único del fallo que se ejecuta.
              </Text>
            </div>
            {!falloIdentificado(datosFallo) && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 12, borderRadius: 14 }}
                message="Falta el número del fallo"
                description="Mientras no lo asigne, el documento sale encabezado con el radicado del caso y no se puede proferir."
              />
            )}
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
            {APARTES_FALLO.map(({ campo, titulo }, i) => {
              const diligenciado = borrador[campo].trim().length > 0;
              return (
              <div key={campo} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: diligenciado ? '#fff' : PALETA.textoTenue,
                      background: diligenciado ? PALETA.verde : 'transparent',
                      border: diligenciado ? 'none' : `1.5px solid ${PALETA.borde}`,
                    }}
                  >
                    {diligenciado ? <CheckOutlined style={{ fontSize: 10 }} /> : i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: diligenciado ? PALETA.texto : PALETA.textoSuave,
                    }}
                  >
                    {titulo}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: PALETA.textoTenue, marginBottom: 6, paddingLeft: 28 }}>
                  {campo === 'tramite'
                    ? guiaTramite(decision)
                    : campo === 'parteResolutiva'
                      ? GUIA_SENTIDO[decision.sentido]
                      : AYUDA_APARTE[campo]}
                </div>
                <TextArea
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  value={borrador[campo]}
                  onChange={(e) => set(campo, e.target.value)}
                  placeholder="La IA redacta este aparte; usted lo revisa y ajusta."
                />
              </div>
              );
            })}
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
            {hayBorrador && faltantes.length > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 12, borderRadius: 14 }}
                message={`Faltan ${faltantes.length} de los nueve apartes que exige el Decreto 768`}
                description={`Sin diligenciar: ${faltantes.join(', ')}. El artículo 2.2.8.18.7.1 los fija como contenido mínimo de la decisión.`}
              />
            )}
            <Button
              type="primary"
              size="large"
              block
              icon={<SafetyCertificateOutlined />}
              disabled={!puedeProferir}
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
        <div style={{ flex: '1 1 520px', minWidth: 380, position: 'sticky', top: 72 }}>
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
