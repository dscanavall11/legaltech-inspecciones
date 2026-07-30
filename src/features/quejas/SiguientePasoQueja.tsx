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
  Input,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import { siguientePasoQueja, type AccionQuejaTipo } from '@/derecho';
import { useChangeCaseState, useUpdateCaseFields } from '@/shared/legalCases/api';
import { useUploadCaseDocument } from '@/shared/documentos/api';
import { parseCaseMetadata, buildCaseMetadata } from '@/shared/legalCases/types';
import type { DocumentoGenerado } from '../querellas/documento/acapites';
import { documentoPdfBlob, nombreArchivoDocumento } from '../querellas/documento/documentoPdf';
import {
  construirCitacionConciliacion,
  construirActaConciliacion,
  construirConstanciaNoAcuerdo,
} from './documentosQueja';
import type { Queja } from './types';
import { PALETA } from '@/theme/theme';

const { TextArea } = Input;

const { Text } = Typography;

const ICONO: Record<AccionQuejaTipo, ReactNode> = {
  citar_conciliacion: <CalendarOutlined />,
  registrar_conciliacion: <CheckCircleOutlined />,
  convertir_querella: <FileTextOutlined />,
  archivar: <InboxOutlined />,
};

export function SiguientePasoQueja({ queja }: { queja: Queja & { caseMetadataRaw?: string | null } }) {
  const { id, estado } = queja;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const paso = siguientePasoQueja(estado);
  const cambiarEstado = useChangeCaseState();
  const actualizarCampos = useUpdateCaseFields();
  const subir = useUploadCaseDocument(id);

  const [modalCitar, setModalCitar] = useState(false);
  const [fechaConciliacion, setFechaConciliacion] = useState<Dayjs | null>(null);
  const [modalResultado, setModalResultado] = useState(false);
  const [modalConvertir, setModalConvertir] = useState(false);
  const [resultado, setResultado] = useState<'acuerdo' | 'sin_acuerdo' | null>(null);
  const [acuerdo, setAcuerdo] = useState('');

  // Genera el documento de la etapa y lo archiva en el expediente S3. Advisory:
  // un fallo al archivar nunca bloquea la actuación ya registrada.
  const archivarDocumentoQueja = (doc: DocumentoGenerado) => {
    documentoPdfBlob(doc, queja.radicado)
      .then((blob) =>
        subir.mutate(new File([blob], nombreArchivoDocumento(doc, queja.radicado), { type: 'application/pdf' })),
      )
      .catch(() => undefined);
  };

  function transicionar(nuevoEstado: typeof estado, metaExtra?: Record<string, unknown>, exito?: string) {
    cambiarEstado.mutate(
      { id, state: nuevoEstado },
      {
        onSuccess: () => {
          if (metaExtra) {
            const metaActual = parseCaseMetadata<Record<string, unknown>>(queja.caseMetadataRaw ?? null);
            actualizarCampos.mutate({ id, fields: { caseMetadata: buildCaseMetadata({ ...metaActual, ...metaExtra }) } });
          }
          if (exito) message.success(exito);
        },
        onError: () => message.error('No se pudo actualizar el estado del expediente.'),
      },
    );
  }

  const ejecutar = (tipo: AccionQuejaTipo) => {
    switch (tipo) {
      case 'citar_conciliacion':
        setFechaConciliacion(null);
        return setModalCitar(true);
      case 'registrar_conciliacion':
        setResultado(null);
        setAcuerdo('');
        return setModalResultado(true);
      case 'convertir_querella':
        return setModalConvertir(true);
      case 'archivar':
        return transicionar('archivada', undefined, 'Expediente archivado.');
    }
  };

  function darTramiteQuerella() {
    // Fracasada la conciliación: el MISMO expediente cambia de caseType (queja
    // -> querella) en vez de crear un caso nuevo - es la misma actuación
    // procesal continuando por otra vía, no un nuevo radicado.
    actualizarCampos.mutate(
      { id, fields: { caseType: 'querella' } },
      {
        onSuccess: () => {
          cambiarEstado.mutate(
            { id, state: 'en_tramite' },
            {
              onSuccess: () => {
                setModalConvertir(false);
                message.success('La queja continúa como querella por proceso verbal abreviado.');
                navigate(`/panel/querellas/${id}`);
              },
            },
          );
        },
        onError: () => message.error('No se pudo dar trámite de querella. Intente de nuevo.'),
      },
    );
  }

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
          style={{ fontSize: 11, letterSpacing: '0.09em', fontWeight: 600 }}
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
              loading={cambiarEstado.isPending || actualizarCampos.isPending}
              onClick={() => ejecutar(a.tipo)}
            >
              {a.label}
            </Button>
          ))}
        </Space>
      </Card>

      {/* Citar a conciliación */}
      <Modal
        open={modalCitar}
        title="Citar a audiencia de conciliación"
        okText="Librar citación"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !fechaConciliacion, loading: cambiarEstado.isPending }}
        onCancel={() => setModalCitar(false)}
        onOk={() => {
          setModalCitar(false);
          transicionar(
            'conciliacion_programada',
            { fechaConciliacion: fechaConciliacion?.toISOString() },
            'Audiencia de conciliación señalada. Citación archivada en el expediente.',
          );
          archivarDocumentoQueja(construirCitacionConciliacion(queja, fechaConciliacion?.toISOString()));
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            Selecciona la fecha y hora de la audiencia de conciliación. Las partes deben
            ser notificadas con la debida antelación.
          </Text>
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format="DD/MM/YYYY HH:mm"
            placeholder="Fecha y hora de la conciliación"
            value={fechaConciliacion}
            onChange={setFechaConciliacion}
          />
        </Space>
      </Modal>

      {/* Acta de audiencia de conciliación */}
      <Modal
        open={modalResultado}
        title="Acta de audiencia de conciliación"
        okText={resultado === 'sin_acuerdo' ? 'Dejar constancia de no acuerdo' : 'Suscribir acta'}
        cancelText="Cancelar"
        okButtonProps={{ disabled: !resultado, loading: cambiarEstado.isPending }}
        onCancel={() => setModalResultado(false)}
        onOk={() => {
          setModalResultado(false);
          if (resultado === 'acuerdo') {
            transicionar('conciliada', undefined, 'Acta de conciliación suscrita y archivada en el expediente.');
            archivarDocumentoQueja(construirActaConciliacion(queja, acuerdo));
          } else {
            transicionar('sin_acuerdo', undefined, 'Constancia de no acuerdo archivada en el expediente.');
            archivarDocumentoQueja(construirConstanciaNoAcuerdo(queja));
          }
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text>¿Las partes llegaron a un acuerdo conciliatorio?</Text>
          <Radio.Group
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="acuerdo">
                <CheckCircleOutlined style={{ color: PALETA.verde, marginRight: 6 }} />
                Hubo acuerdo conciliatorio
              </Radio>
              <Radio value="sin_acuerdo">
                <CloseCircleOutlined style={{ color: PALETA.rojo, marginRight: 6 }} />
                No hubo acuerdo
              </Radio>
            </Space>
          </Radio.Group>

          {resultado === 'acuerdo' && (
            <>
              <div>
                <Text style={{ display: 'block', marginBottom: 6 }}>
                  Transcriba el acuerdo conciliatorio (compromisos de las partes):
                </Text>
                <TextArea
                  rows={4}
                  value={acuerdo}
                  onChange={(e) => setAcuerdo(e.target.value)}
                  placeholder="Ej.: El acusado se compromete a cesar el ruido después de las 10:00 p.m.; el quejoso retira la queja…"
                />
              </div>
              <Alert
                type="success"
                showIcon
                message="Conciliación lograda"
                description="El acta suscrita por las partes y el inspector presta mérito ejecutivo y hace tránsito a cosa juzgada. Verificado el cumplimiento, se ordenará el archivo."
              />
            </>
          )}
          {resultado === 'sin_acuerdo' && (
            <Alert
              type="warning"
              showIcon
              message="Constancia de no acuerdo"
              description="Ante la falta de ánimo conciliatorio, el inspector podrá dar a la queja trámite de querella mediante proceso verbal abreviado (art. 223, Ley 1801 de 2016)."
            />
          )}
        </Space>
      </Modal>

      {/* Dar trámite de querella (proceso verbal abreviado) */}
      <Modal
        open={modalConvertir}
        title="Dar trámite de querella"
        okText="Radicar querella"
        cancelText="Cancelar"
        confirmLoading={actualizarCampos.isPending || cambiarEstado.isPending}
        onCancel={() => setModalConvertir(false)}
        onOk={darTramiteQuerella}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            Fracasada la conciliación, el asunto continúa por proceso verbal
            abreviado (art. 223, Ley 1801 de 2016). El mismo expediente pasa a
            tramitarse como querella.
          </Text>
          <Alert
            type="info"
            showIcon
            message={`${queja.quejoso} contra ${queja.acusado}`}
            description={queja.asunto}
          />
        </Space>
      </Modal>
    </>
  );
}
