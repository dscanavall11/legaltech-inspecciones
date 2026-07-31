import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Space, Tooltip, App, Input, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  CheckOutlined,
  SaveOutlined,
  EyeOutlined,
  EditOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Sparkles } from 'lucide-react';
import type { Acapite } from './acapites';
import {
  aplicarEdicionesAcapites,
  textoAcapite,
  acapitesModificados,
  acapitesSinGuardar,
  type AcapitesEditados,
} from './acapitesEdicion';
import { descargarBlob } from './descargarBlob';
import { VisorLateral } from './VisorLateral';
import { ResumenLateral } from './ResumenLateral';
import { useUploadCaseDocument } from './api';
import { useChangeCaseState, useUpdateCaseFields } from '@/shared/legalCases/api';
import { parseCaseMetadata, buildCaseMetadata } from '@/shared/legalCases/types';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DocumentosEditadosMeta {
  /** documentoKey -> ediciones por acápite. Persistido en caseMetadata (opaco para el backend). */
  documentosEditados?: Record<string, AcapitesEditados>;
}

export interface AprobarYFirmarConfig {
  /** Estado del caso al que se transiciona al firmar (omitir si esta pieza no cierra una etapa). */
  estadoDestino?: string;
  navigateTrasFirmar: string;
  mensajeExito?: string;
}

export interface DocumentoEditorPageProps {
  caseId: string;
  /** Clave única del tipo de documento dentro del caso (p. ej. "fallo", "auto-avoca-cita-audiencia") — namespacing de la edición persistida y del nombre de archivo. */
  documentoKey: string;
  radicado: string;
  titulo: string;
  /** Línea de encabezado bajo "REPÚBLICA DE COLOMBIA" (nombre de la inspección/entidad). */
  encabezado: string;
  /** Acápites originales (sin ediciones aplicadas) — la fuente de verdad que genera el dominio (querella/comparendo/...). */
  acapites: Acapite[];
  caseMetadataRaw?: string | null;
  volverA: string;
  volverLabel?: string;
  /** Genera el PDF real (pdfmake) a partir de los acápites ya con las ediciones aplicadas. */
  generarBlob: (acapitesEfectivos: Acapite[]) => Promise<Blob>;
  nombreArchivo: (acapitesEfectivos: Acapite[]) => string;
  /** Si se omite, el documento no cierra ninguna etapa (p. ej. piezas de comparendo que sólo se archivan). */
  aprobarYFirmar?: AprobarYFirmarConfig;
}

/**
 * Visor/editor de documento por acápites — generalización de
 * querellas/documento/DocumentoPage (Task 18) para que cualquier trámite
 * (querella, comparendo, y los que vengan) reutilice la misma UX: navegación
 * de acápites + Resumen IA + edición humana por acápite con "Regenerar PDF"
 * en vivo (VisorLateral) y persistencia en caseMetadata.
 */
export function DocumentoEditorPage({
  caseId,
  documentoKey,
  radicado,
  titulo,
  encabezado,
  acapites,
  caseMetadataRaw,
  volverA,
  volverLabel = 'Volver al expediente',
  generarBlob,
  nombreArchivo,
  aprobarYFirmar,
}: DocumentoEditorPageProps) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const subir = useUploadCaseDocument(caseId);
  const actualizarCampos = useUpdateCaseFields();
  const cambiarEstado = useChangeCaseState();

  // Última versión persistida en caseMetadata — línea base contra la que se
  // mide "sin guardar" (acapitesSinGuardar). Se actualiza también, en
  // memoria, justo después de un guardarCambios exitoso (más abajo), sin
  // esperar a que refetchee caseMetadataRaw.
  const [edicionesGuardadas, setEdicionesGuardadas] = useState<AcapitesEditados>(
    () => parseCaseMetadata<DocumentosEditadosMeta>(caseMetadataRaw ?? null).documentosEditados?.[documentoKey] ?? {},
  );
  const [ediciones, setEdiciones] = useState<AcapitesEditados>(edicionesGuardadas);
  const [activo, setActivo] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [guardandoCambios, setGuardandoCambios] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [previaPdf, setPreviaPdf] = useState<Blob | null>(null);

  const acapitesEfectivos = useMemo(() => aplicarEdicionesAcapites(acapites, ediciones), [acapites, ediciones]);
  // "Editado": difiere del texto original generado (marca permanente, sobrevive al guardado).
  const modificados = useMemo(() => acapitesModificados(acapites, ediciones), [acapites, ediciones]);
  // "Sin guardar": difiere de la última versión persistida (se vacía justo al guardar).
  const sinGuardar = useMemo(() => acapitesSinGuardar(ediciones, edicionesGuardadas), [ediciones, edicionesGuardadas]);

  const irAAcapite = (acapiteId: string) => {
    setActivo(acapiteId);
    document.getElementById(`acap-${acapiteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function alternarEdicion(original: Acapite) {
    if (editando === original.id) {
      setEditando(null);
      return;
    }
    setEdiciones((prev) => (prev[original.id] !== undefined ? prev : { ...prev, [original.id]: textoAcapite(original) }));
    setEditando(original.id);
    setActivo(original.id);
  }

  async function regenerarPdf() {
    setRegenerando(true);
    try {
      setPreviaPdf(await generarBlob(acapitesEfectivos));
    } catch {
      message.error('No se pudo regenerar el PDF.');
    } finally {
      setRegenerando(false);
    }
  }

  async function descargarPdf() {
    setExportando(true);
    try {
      const blob = await generarBlob(acapitesEfectivos);
      descargarBlob(blob, nombreArchivo(acapitesEfectivos));
    } catch {
      message.error('No se pudo generar el PDF.');
    } finally {
      setExportando(false);
    }
  }

  // Sube el PDF (ya con las ediciones aplicadas) al expediente S3: cada
  // llamada crea una nueva versión (el ledger ordena por fecha).
  async function guardarVersion() {
    const blob = await generarBlob(acapitesEfectivos);
    const archivo = new File([blob], nombreArchivo(acapitesEfectivos), { type: 'application/pdf' });
    await subir.mutateAsync(archivo);
  }

  async function guardarEnExpediente() {
    try {
      await guardarVersion();
      message.success('Nueva versión archivada en el expediente.');
    } catch {
      message.error('No se pudo archivar la versión en el expediente.');
    }
  }

  // Persiste las ediciones humanas en caseMetadata.documentosEditados[documentoKey]
  // — fusiona con el resto del blob (nunca lo reemplaza) para no perder otras claves.
  async function guardarCambios() {
    setGuardandoCambios(true);
    try {
      const metaActual = parseCaseMetadata<Record<string, unknown>>(caseMetadataRaw ?? null);
      const documentosEditados = {
        ...(metaActual.documentosEditados as Record<string, AcapitesEditados> | undefined),
        [documentoKey]: ediciones,
      };
      await actualizarCampos.mutateAsync({
        id: caseId,
        fields: { caseMetadata: buildCaseMetadata({ ...metaActual, documentosEditados }) },
      });
      // La línea base de "sin guardar" avanza de inmediato — no hace falta esperar al refetch.
      setEdicionesGuardadas(ediciones);
      message.success('Cambios guardados: se conservan al volver a abrir el documento.');
    } catch {
      message.error('No se pudieron guardar los cambios.');
    } finally {
      setGuardandoCambios(false);
    }
  }

  async function aprobarYFirmarAccion() {
    if (!aprobarYFirmar) return;
    setFirmando(true);
    try {
      await guardarVersion();
      if (aprobarYFirmar.estadoDestino) {
        await cambiarEstado.mutateAsync({ id: caseId, state: aprobarYFirmar.estadoDestino });
      }
      message.success(aprobarYFirmar.mensajeExito ?? 'Documento firmado y archivado como versión en el expediente.');
      navigate(aprobarYFirmar.navigateTrasFirmar);
    } catch {
      message.error('No se pudo firmar y archivar el documento.');
    } finally {
      setFirmando(false);
    }
  }

  return (
    <div>
      {/* Barra superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(volverA)}
            style={{ paddingLeft: 0, marginBottom: 4 }}
          >
            {volverLabel}
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {titulo}
          </Title>
          <Space size={8} align="center">
            <Text type="secondary">Radicado {radicado}</Text>
            {sinGuardar.length > 0 && (
              <Tag color="gold" style={{ marginRight: 0 }}>
                {sinGuardar.length} acápite(s) sin guardar
              </Tag>
            )}
          </Space>
        </div>
        <Space wrap>
          <Button icon={<DownloadOutlined />} loading={exportando} onClick={descargarPdf}>
            Descargar PDF
          </Button>
          <Button icon={<EyeOutlined />} loading={regenerando} onClick={regenerarPdf}>
            Regenerar PDF
          </Button>
          <Button
            type={sinGuardar.length > 0 ? 'primary' : 'default'}
            icon={<SaveOutlined />}
            loading={guardandoCambios}
            onClick={guardarCambios}
          >
            Guardar cambios
          </Button>
          <Button icon={<SaveOutlined />} loading={subir.isPending} onClick={guardarEnExpediente}>
            Guardar versión
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            Imprimir
          </Button>
          {aprobarYFirmar && (
            <Button type="primary" icon={<CheckOutlined />} loading={firmando} onClick={aprobarYFirmarAccion}>
              Aprobar y firmar
            </Button>
          )}
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Previsualización del documento (tipo PDF) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: '#fff',
              maxWidth: 820,
              margin: '0 auto',
              padding: '56px 64px',
              borderRadius: 12,
              boxShadow: ELEVACION.media,
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#1a1a1a',
              lineHeight: 1.7,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 13, letterSpacing: 1, color: '#444' }}>REPÚBLICA DE COLOMBIA</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{encabezado}</div>
              <div style={{ marginTop: 18, fontWeight: 700, fontSize: 17, textTransform: 'uppercase' }}>{titulo}</div>
              <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>Radicado N.º {radicado}</div>
            </div>

            {acapitesEfectivos.map((a, i) => {
              const original = acapites[i];
              const enEdicion = editando === a.id;
              const tieneCambios = modificados.includes(a.id);
              return (
                <section
                  key={a.id}
                  id={`acap-${a.id}`}
                  style={{
                    marginBottom: 26,
                    scrollMarginTop: 16,
                    background: activo === a.id ? PALETA.azulSuave : 'transparent',
                    transition: 'background 0.5s',
                    borderRadius: 12,
                    padding: activo === a.id || enEdicion ? '8px 10px' : '8px 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>{a.titulo}</span>
                      {tieneCambios && (
                        <Tag color="gold" style={{ marginRight: 0, fontSize: 11 }}>
                          Editado
                        </Tag>
                      )}
                    </div>
                    <Tooltip title={enEdicion ? 'Cerrar edición' : 'Editar acápite'}>
                      <Button
                        size="small"
                        type="text"
                        icon={enEdicion ? <CloseOutlined /> : <EditOutlined />}
                        onClick={() => alternarEdicion(original)}
                        aria-label={enEdicion ? `Cerrar edición de ${a.titulo}` : `Editar ${a.titulo}`}
                      />
                    </Tooltip>
                  </div>
                  {enEdicion ? (
                    <TextArea
                      autoSize={{ minRows: 3 }}
                      value={ediciones[a.id] ?? textoAcapite(a)}
                      onChange={(e) => setEdiciones((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 14.5 }}
                    />
                  ) : (
                    a.parrafos.map((p, pIdx) => (
                      <p key={pIdx} style={{ margin: '0 0 8px', textAlign: 'justify' }}>
                        {p}
                      </p>
                    ))
                  )}
                </section>
              );
            })}

            <div
              style={{
                marginTop: 48,
                paddingTop: 16,
                borderTop: '1px solid #ddd',
                fontSize: 13,
                color: '#444',
              }}
            >
              ____________________________________
              <div>Inspector(a) de Policía</div>
            </div>
          </div>
        </div>

        {/* Sidebar de acápites */}
        <aside
          style={{
            width: 300,
            flexShrink: 0,
            position: 'sticky',
            top: 84,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          className="acapites-sidebar"
        >
          <ResumenLateral
            tipoDocumento={titulo}
            texto={acapitesEfectivos.map((a) => `${a.titulo}\n${a.parrafos.join('\n')}`).join('\n\n')}
          />
          <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3, padding: '0 8px 6px' }}>
            ACÁPITES DEL DOCUMENTO
          </Text>
          {acapitesEfectivos.map((a) => (
            <button
              key={a.id}
              onClick={() => irAAcapite(a.id)}
              style={{
                textAlign: 'left',
                border: 'none',
                background: activo === a.id ? PALETA.azulSuave : 'transparent',
                borderRadius: 10,
                padding: '10px 12px',
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 500,
                  color: activo === a.id ? PALETA.azulOscuro : PALETA.texto,
                }}
              >
                <span style={{ flex: 1 }}>{a.titulo}</span>
                {sinGuardar.includes(a.id) && (
                  <Tooltip title="Editado, sin guardar">
                    <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: PALETA.amarillo, display: 'inline-block' }} />
                  </Tooltip>
                )}
                {a.fuente === 'ia' && (
                  <Tooltip title="Redactado con IA. Requiere revisión">
                    <Sparkles size={13} strokeWidth={1.75} style={{ color: PALETA.azul }} />
                  </Tooltip>
                )}
              </div>
              <div style={{ fontSize: 12, color: PALETA.textoTenue, marginTop: 2 }}>{a.resumen}</div>
            </button>
          ))}
        </aside>
      </div>

      <VisorLateral titulo={`${titulo} (vista previa)`} abierto={previaPdf !== null} archivo={previaPdf} onCerrar={() => setPreviaPdf(null)} />
    </div>
  );
}
