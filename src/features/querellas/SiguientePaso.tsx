import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Space,
  Modal,
  DatePicker,
  Radio,
  Alert,
  App,
} from 'antd';
import {
  CalendarOutlined,
  AuditOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  InboxOutlined,
  RiseOutlined,
  BankOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import { siguientePaso, type AccionTipo } from '@/derecho';
import { useChangeCaseState, useUpdateCaseFields } from '@/shared/legalCases/api';
import { useUploadCaseDocument } from '@/shared/documentos/api';
import { parseCaseMetadata, buildCaseMetadata } from '@/shared/legalCases/types';
import { construirDocumento, type TipoDocumento } from './documento/acapites';
import { documentoPdfBlob, nombreArchivoDocumento } from './documento/documentoPdf';
import type { EstadoQuerella, QuerellaDetalle } from './types';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;

const ICONO: Record<AccionTipo, ReactNode> = {
  programar_audiencia: <CalendarOutlined />,
  registrar_audiencia: <AuditOutlined />,
  reagendar_audiencia: <CalendarOutlined />,
  generar_fallo: <FileTextOutlined />,
  constancia_ejecutoria: <SafetyCertificateOutlined />,
  conceder_apelacion: <RiseOutlined />,
  resolver_alzada: <BankOutlined />,
  archivar: <InboxOutlined />,
};

export function SiguientePaso({
  id,
  estado,
  caseMetadata,
  caso,
}: {
  id: string;
  estado: EstadoQuerella;
  /** Raw caseMetadata del caso (opaco para el backend) - se fusiona, nunca se reemplaza entero. */
  caseMetadata?: string | null;
  /** Expediente completo: necesario para generar y archivar la pieza de cada etapa. */
  caso?: QuerellaDetalle;
}) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const paso = siguientePaso(estado);
  const cambiarEstado = useChangeCaseState();
  const actualizarCampos = useUpdateCaseFields();
  const subir = useUploadCaseDocument(id);

  // Genera la pieza determinística de la etapa (citación, acta…) y la archiva
  // en el expediente S3. Advisory: un fallo al archivar nunca bloquea la
  // actuación procesal que ya se registró.
  const archivarPiezaEtapa = (tipo: TipoDocumento) => {
    if (!caso) return;
    const doc = construirDocumento(tipo, caso);
    documentoPdfBlob(doc, caso.radicado)
      .then((blob) =>
        subir.mutate(new File([blob], nombreArchivoDocumento(doc, caso.radicado), { type: 'application/pdf' })),
      )
      .catch(() => undefined);
  };

  const [modalAgendar, setModalAgendar] = useState<'programar' | 'reagendar' | null>(null);
  const [fechaAudiencia, setFechaAudiencia] = useState<Dayjs | null>(null);
  const [modalRegistrar, setModalRegistrar] = useState(false);
  const [comparecio, setComparecio] = useState<'si' | 'no' | null>(null);
  const [modalAlzada, setModalAlzada] = useState(false);
  const [resultadoAlzada, setResultadoAlzada] = useState<'confirmado' | 'revocado' | null>(null);

  function transicionar(nuevoEstado: EstadoQuerella, metaExtra?: Record<string, unknown>, exito?: string) {
    cambiarEstado.mutate(
      { id, state: nuevoEstado },
      {
        onSuccess: () => {
          if (metaExtra) {
            // El PATCH de estado no toca caseMetadata; los datos propios de la
            // actuación (fecha de audiencia, resultado) se fusionan y guardan
            // aparte para no perder "asunto"/"diasTermino" ya guardados.
            const metaActual = parseCaseMetadata<Record<string, unknown>>(caseMetadata ?? null);
            actualizarCampos.mutate({ id, fields: { caseMetadata: buildCaseMetadata({ ...metaActual, ...metaExtra }) } });
          }
          if (exito) message.success(exito);
        },
        onError: () => message.error('No se pudo actualizar el estado del expediente.'),
      },
    );
  }

  const ejecutar = (tipo: AccionTipo) => {
    switch (tipo) {
      case 'programar_audiencia':
        setFechaAudiencia(null);
        return setModalAgendar('programar');
      case 'reagendar_audiencia':
        setFechaAudiencia(null);
        return setModalAgendar('reagendar');
      case 'registrar_audiencia':
        setComparecio(null);
        return setModalRegistrar(true);
      case 'generar_fallo':
        return navigate(`/panel/analisis?caso=${id}`);
      case 'constancia_ejecutoria':
        return navigate(`/panel/querellas/${id}/documento/constancia`);
      case 'conceder_apelacion':
        return transicionar(
          'apelado',
          undefined,
          'Recurso de apelación concedido. Expediente remitido a segunda instancia.',
        );
      case 'resolver_alzada':
        setResultadoAlzada(null);
        return setModalAlzada(true);
      case 'archivar':
        return transicionar('archivada', undefined, 'Expediente archivado.');
    }
  };

  if (paso.terminal) {
    return (
      <Alert
        type="success"
        showIcon
        message="Trámite finalizado"
        description={paso.mensaje}
      />
    );
  }

  return (
    <>
      <Card
        variant="borderless"
        style={{
          background: `linear-gradient(120deg, ${PALETA.azulSuave} 0%, #ffffff 78%)`,
          borderRadius: 20,
        }}
        styles={{ body: { padding: '18px 22px 20px' } }}
      >
        <Text
          type="secondary"
          style={{ fontSize: TEXTO.nota, letterSpacing: '0.09em', fontWeight: 600 }}
        >
          PRÓXIMA ACTUACIÓN
        </Text>
        <div style={{ margin: '6px 0 14px', color: PALETA.texto }}>
          {paso.mensaje}
        </div>
        <Space wrap>
          {paso.acciones.map((a) => (
            <Button
              key={a.tipo}
              type={a.primaria ? 'primary' : 'default'}
              icon={ICONO[a.tipo]}
              loading={cambiarEstado.isPending}
              onClick={() => ejecutar(a.tipo)}
            >
              {a.label}
            </Button>
          ))}
        </Space>
      </Card>

      {/* Citar / aplazar audiencia pública */}
      <Modal
        open={modalAgendar !== null}
        title={modalAgendar === 'reagendar' ? 'Aplazar audiencia pública' : 'Citar a audiencia pública'}
        okText="Librar citación"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !fechaAudiencia, loading: cambiarEstado.isPending }}
        onCancel={() => setModalAgendar(null)}
        onOk={() => {
          setModalAgendar(null);
          transicionar(
            'audiencia_programada',
            { fechaAudiencia: fechaAudiencia?.toISOString() },
            'Audiencia señalada. Citación archivada en el expediente.',
          );
          archivarPiezaEtapa('citacion');
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            Señale la fecha y hora de la audiencia pública. La citación a las
            partes se librará con la antelación mínima de ley.
          </Text>
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format="DD/MM/YYYY HH:mm"
            placeholder="Fecha y hora"
            value={fechaAudiencia}
            onChange={setFechaAudiencia}
          />
        </Space>
      </Modal>

      {/* Acta de audiencia pública */}
      <Modal
        open={modalRegistrar}
        title="Acta de audiencia pública"
        okText={comparecio === 'no' ? 'Proferir decisión en ausencia' : 'Proferir decisión'}
        cancelText="Cerrar"
        okButtonProps={{ disabled: !comparecio, loading: cambiarEstado.isPending }}
        onCancel={() => setModalRegistrar(false)}
        onOk={() => {
          setModalRegistrar(false);
          transicionar('fallo_emitido', { comparecioQuerellado: comparecio === 'si' });
          archivarPiezaEtapa('acta');
          navigate(`/panel/analisis?caso=${id}`);
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text>¿Compareció el querellado a la audiencia?</Text>
          <Radio.Group
            value={comparecio}
            onChange={(e) => setComparecio(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="si">Sí compareció</Radio>
              <Radio value="no">No compareció</Radio>
            </Space>
          </Radio.Group>

          {comparecio === 'no' && (
            <Alert
              type="warning"
              showIcon
              message="Inasistencia del querellado"
              description="Ante la inasistencia injustificada, el inspector puede proferir la decisión en ausencia e imponer la orden de policía o medida correctiva a que haya lugar (art. 223, parágrafo 1, Ley 1801 de 2016)."
            />
          )}
          {comparecio === 'si' && (
            <Alert
              type="info"
              showIcon
              message="Audiencia celebrada"
              description="Agotadas la conciliación, la práctica de pruebas y los alegatos, procede proferir la decisión de fondo y notificarla en estrados."
            />
          )}
        </Space>
      </Modal>

      {/* Decisión de segunda instancia (alzada) */}
      <Modal
        open={modalAlzada}
        title="Decisión de segunda instancia"
        okText={resultadoAlzada === 'revocado' ? 'Registrar revocatoria' : 'Registrar confirmación'}
        cancelText="Cancelar"
        okButtonProps={{ disabled: !resultadoAlzada, loading: cambiarEstado.isPending }}
        onCancel={() => setModalAlzada(false)}
        onOk={() => {
          if (!resultadoAlzada) return;
          setModalAlzada(false);
          transicionar(
            resultadoAlzada,
            { resultadoAlzada },
            resultadoAlzada === 'revocado'
              ? 'Decisión revocada por el superior. Dé cumplimiento a lo resuelto y ordene el archivo.'
              : 'Decisión confirmada por el superior. Queda en firme; ordene el archivo.',
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text>¿Cómo resolvió el superior el recurso de apelación?</Text>
          <Radio.Group value={resultadoAlzada} onChange={(e) => setResultadoAlzada(e.target.value)}>
            <Space direction="vertical">
              <Radio value="confirmado">Confirmó la decisión de primera instancia</Radio>
              <Radio value="revocado">Revocó la decisión de primera instancia</Radio>
            </Space>
          </Radio.Group>
        </Space>
      </Modal>
    </>
  );
}
