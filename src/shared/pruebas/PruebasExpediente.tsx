import { useState } from 'react';
import { Button, Upload, Typography, App, Tooltip, Skeleton, Alert, Modal, Select, DatePicker, Input, Space, Popconfirm, Tag } from 'antd';
import {
  FileTextOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  SolutionOutlined,
  FileOutlined,
  DownloadOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  EVIDENCE_TYPE_LABEL,
  EVIDENCE_CONTRIBUTOR_LABEL,
  type CaseEvidence,
  type EvidenceType,
  type EvidenceContributor,
} from './types';
import { useCaseEvidence, useRegisterCaseEvidence, useDeleteCaseEvidence } from './api';
import { getCaseDocumentDownloadUrl } from '@/shared/documentos/api';
import { VisorLateral } from '@/shared/documentos/VisorLateral';
import { PALETA } from '@/theme/theme';
import { RADIO, TEXTO } from '@/theme/escala';
import {
  ACEPTA_EXPEDIENTE,
  avisoDeRechazo,
  avisoDeTamano,
  esFormatoDeExpediente,
  excedeElTope,
} from '@/shared/documentos/formatos';

const { Text } = Typography;

const TYPE_STYLE: Record<EvidenceType, { icono: ReactNode; color: string; fondo: string }> = {
  documento_publico: { icono: <FileTextOutlined />, color: PALETA.azul, fondo: PALETA.azulBg },
  documento_privado: { icono: <FileTextOutlined />, color: PALETA.azul2, fondo: PALETA.azulBg },
  fotografia: { icono: <FileImageOutlined />, color: PALETA.verde, fondo: PALETA.verdeBg },
  video: { icono: <VideoCameraOutlined />, color: PALETA.morado, fondo: PALETA.moradoBg },
  audio: { icono: <AudioOutlined />, color: PALETA.morado, fondo: PALETA.moradoBg },
  testimonio: { icono: <SolutionOutlined />, color: PALETA.naranja, fondo: PALETA.naranjaBg },
  declaracion: { icono: <SolutionOutlined />, color: PALETA.naranja, fondo: PALETA.naranjaBg },
  informe_policial: { icono: <FileProtectOutlined />, color: PALETA.teal, fondo: PALETA.tealBg },
  informe_tecnico: { icono: <FileProtectOutlined />, color: PALETA.teal, fondo: PALETA.tealBg },
  certificado: { icono: <SafetyCertificateOutlined />, color: PALETA.amarillo, fondo: PALETA.amarilloBg },
  argumentos_parte: { icono: <SolutionOutlined />, color: PALETA.naranja, fondo: PALETA.naranjaBg },
  otro: { icono: <FileOutlined />, color: PALETA.textoSuave, fondo: '#efede7' },
};

const TIPOS_CON_ARCHIVO_ESPERADO: EvidenceType[] = ['documento_publico', 'documento_privado', 'fotografia', 'video', 'audio', 'informe_policial', 'informe_tecnico', 'certificado'];

function FilaPrueba({ prueba, onVer, onDescargar, onEliminar }: {
  prueba: CaseEvidence;
  onVer: () => void;
  onDescargar: () => void;
  onEliminar: () => void;
}) {
  const estilo = TYPE_STYLE[prueba.evidenceType];
  const esPdf = prueba.mimeType === 'application/pdf';
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: RADIO.bloque, transition: 'background 0.2s ease' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ width: 36, height: 36, borderRadius: RADIO.control, background: estilo.fondo, color: estilo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: TEXTO.seccion, flexShrink: 0 }}>
        {estilo.icono}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag style={{ margin: 0, fontFamily: 'monospace' }}>{prueba.identifier}</Tag>
          <span style={{ color: PALETA.texto, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {EVIDENCE_TYPE_LABEL[prueba.evidenceType]}
          </span>
          {prueba.hasFile && <PaperClipOutlined style={{ color: PALETA.textoTenue, fontSize: TEXTO.nota }} />}
        </div>
        <div style={{ fontSize: TEXTO.nota, color: PALETA.textoTenue }}>
          {prueba.contributor ? EVIDENCE_CONTRIBUTOR_LABEL[prueba.contributor] : 'Aportante sin registrar'}
          {prueba.date ? ` · ${dayjs(prueba.date).format('D [de] MMMM, YYYY')}` : ''}
          {prueba.description ? ` · ${prueba.description}` : ''}
        </div>
      </div>
      {prueba.hasFile && esPdf && (
        <Tooltip title="Ver">
          <Button type="text" shape="circle" icon={<EyeOutlined />} onClick={onVer} aria-label={`Ver ${prueba.identifier}`} />
        </Tooltip>
      )}
      {prueba.hasFile && (
        <Tooltip title="Descargar">
          <Button type="text" shape="circle" icon={<DownloadOutlined />} onClick={onDescargar} aria-label={`Descargar ${prueba.identifier}`} />
        </Tooltip>
      )}
      <Popconfirm
        title={`¿Eliminar la prueba ${prueba.identifier}?`}
        description="Esta acción no se puede deshacer."
        okText="Eliminar"
        okButtonProps={{ danger: true }}
        cancelText="Cancelar"
        onConfirm={onEliminar}
      >
        <Tooltip title="Eliminar">
          <Button type="text" shape="circle" danger icon={<DeleteOutlined />} aria-label={`Eliminar ${prueba.identifier}`} />
        </Tooltip>
      </Popconfirm>
    </div>
  );
}

function estadoInicialFormulario() {
  return {
    evidenceType: undefined as EvidenceType | undefined,
    description: '',
    date: null as Dayjs | null,
    contributor: undefined as EvidenceContributor | undefined,
    purpose: '',
    file: null as File | null,
  };
}

/**
 * Módulo de pruebas del expediente (paso 1 del apoyo a la decisión): registra,
 * lista y elimina las pruebas del caso. El archivo, si existe, se archiva en
 * S3 (legaltech-tools); el identificador legible lo asigna siempre el
 * servidor. Hermano de DocumentosExpediente, mismo patrón visual.
 */
export function PruebasExpediente({ caseId }: { caseId: string }) {
  const { message } = App.useApp();
  const { data: pruebas, isLoading, isError } = useCaseEvidence(caseId);
  const registrar = useRegisterCaseEvidence(caseId);
  const eliminar = useDeleteCaseEvidence(caseId);
  const [pruebaEnVista, setPruebaEnVista] = useState<CaseEvidence | null>(null);
  const [urlVista, setUrlVista] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario] = useState(estadoInicialFormulario());

  async function verPrueba(prueba: CaseEvidence) {
    if (!prueba.storageKey) return;
    setPruebaEnVista(prueba);
    try {
      setUrlVista(await getCaseDocumentDownloadUrl(caseId, prueba.storageKey));
    } catch {
      message.error('No se pudo abrir la prueba.');
      setPruebaEnVista(null);
    }
  }

  async function descargarPrueba(prueba: CaseEvidence) {
    if (!prueba.storageKey) return;
    try {
      const url = await getCaseDocumentDownloadUrl(caseId, prueba.storageKey);
      window.open(url, '_blank', 'noopener');
    } catch {
      message.error('No se pudo descargar la prueba.');
    }
  }

  function cerrarModal() {
    setModalAbierto(false);
    setFormulario(estadoInicialFormulario());
  }

  function registrarPrueba() {
    if (!formulario.evidenceType) return;
    registrar.mutate(
      {
        evidenceType: formulario.evidenceType,
        description: formulario.description || undefined,
        date: formulario.date?.format('YYYY-MM-DD'),
        contributor: formulario.contributor,
        purpose: formulario.purpose || undefined,
        file: formulario.file,
      },
      {
        onSuccess: (prueba) => {
          message.success(`Prueba ${prueba.identifier} incorporada al expediente.`);
          cerrarModal();
        },
        onError: () => message.error('No se pudo registrar la prueba.'),
      },
    );
  }

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 4 }} />;
  }

  if (isError) {
    return <Alert type="error" showIcon message="No se pudieron cargar las pruebas del expediente." style={{ marginTop: 4 }} />;
  }

  return (
    <div style={{ marginTop: 4 }}>
      {!pruebas || pruebas.length === 0 ? (
        <div style={{ padding: '28px 0 20px', textAlign: 'center' }}>
          <Text type="secondary">El expediente aún no tiene pruebas. Agrega la primera.</Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '0 -14px' }}>
          {pruebas.map((p) => (
            <FilaPrueba
              key={p.id}
              prueba={p}
              onVer={() => verPrueba(p)}
              onDescargar={() => descargarPrueba(p)}
              onEliminar={() => eliminar.mutate(p.id, { onError: () => message.error('No se pudo eliminar la prueba.') })}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Button icon={<PlusOutlined />} onClick={() => setModalAbierto(true)}>
          + AGREGAR PRUEBA
        </Button>
      </div>

      <Modal
        open={modalAbierto}
        title="Agregar prueba"
        okText="Registrar prueba"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !formulario.evidenceType, loading: registrar.isPending }}
        onCancel={cerrarModal}
        onOk={registrarPrueba}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Select
            style={{ width: '100%' }}
            placeholder="Tipo de prueba"
            value={formulario.evidenceType}
            onChange={(evidenceType) => setFormulario((f) => ({ ...f, evidenceType }))}
            options={Object.entries(EVIDENCE_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Input.TextArea
            placeholder="Descripción de la prueba"
            value={formulario.description}
            onChange={(e) => setFormulario((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Fecha de la prueba"
            value={formulario.date}
            onChange={(date) => setFormulario((f) => ({ ...f, date }))}
          />
          <Select
            style={{ width: '100%' }}
            placeholder="¿Quién la aporta?"
            value={formulario.contributor}
            onChange={(contributor) => setFormulario((f) => ({ ...f, contributor }))}
            options={Object.entries(EVIDENCE_CONTRIBUTOR_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Input.TextArea
            placeholder="¿Qué pretende demostrar?"
            value={formulario.purpose}
            onChange={(e) => setFormulario((f) => ({ ...f, purpose: e.target.value }))}
            rows={2}
          />
          <Upload
            accept={ACEPTA_EXPEDIENTE}
            showUploadList={formulario.file !== null}
            fileList={formulario.file ? [{ uid: '1', name: formulario.file.name, status: 'done' }] : []}
            beforeUpload={(file) => {
              if (!esFormatoDeExpediente(file.name)) {
                message.error(avisoDeRechazo([file]));
                return false;
              }
              if (excedeElTope(file.size)) {
                message.error(avisoDeTamano(file.name, file.size));
                return false;
              }
              setFormulario((f) => ({ ...f, file }));
              return false;
            }}
            onRemove={() => setFormulario((f) => ({ ...f, file: null }))}
          >
            <Button icon={<PaperClipOutlined />}>Adjuntar archivo (opcional)</Button>
          </Upload>
          {formulario.evidenceType && TIPOS_CON_ARCHIVO_ESPERADO.includes(formulario.evidenceType) && !formulario.file && (
            <Text type="secondary" style={{ fontSize: TEXTO.nota }}>
              Este tipo de prueba normalmente lleva un archivo adjunto.
            </Text>
          )}
        </Space>
      </Modal>

      <VisorLateral
        titulo={pruebaEnVista ? `${pruebaEnVista.identifier} · ${pruebaEnVista.fileName ?? ''}` : undefined}
        abierto={pruebaEnVista !== null}
        archivo={urlVista}
        onCerrar={() => {
          setPruebaEnVista(null);
          setUrlVista(null);
        }}
      />
    </div>
  );
}
