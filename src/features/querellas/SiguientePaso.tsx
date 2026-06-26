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
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { siguientePaso, type AccionTipo } from './flujo';
import type { EstadoQuerella } from './types';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

const ICONO: Record<AccionTipo, ReactNode> = {
  programar_audiencia: <CalendarOutlined />,
  registrar_audiencia: <AuditOutlined />,
  reagendar_audiencia: <CalendarOutlined />,
  generar_fallo: <FileTextOutlined />,
  generar_acta: <SafetyCertificateOutlined />,
  archivar: <InboxOutlined />,
};

export function SiguientePaso({
  id,
  estado,
}: {
  id: string;
  estado: EstadoQuerella;
}) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const paso = siguientePaso(estado);

  const [modalAgendar, setModalAgendar] = useState<'programar' | 'reagendar' | null>(
    null,
  );
  const [modalRegistrar, setModalRegistrar] = useState(false);
  const [comparecio, setComparecio] = useState<'si' | 'no' | null>(null);

  const ejecutar = (tipo: AccionTipo) => {
    switch (tipo) {
      case 'programar_audiencia':
        return setModalAgendar('programar');
      case 'reagendar_audiencia':
        return setModalAgendar('reagendar');
      case 'registrar_audiencia':
        setComparecio(null);
        return setModalRegistrar(true);
      case 'generar_fallo':
        return navigate(`/querellas/${id}/documento/fallo`);
      case 'generar_acta':
        return navigate(`/querellas/${id}/documento/acta`);
      case 'archivar':
        return message.success('Expediente archivado.');
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
        style={{ background: PALETA.azulSuave, border: `1px solid ${PALETA.borde}` }}
        styles={{ body: { padding: 18 } }}
      >
        <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
          SIGUIENTE PASO
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
              onClick={() => ejecutar(a.tipo)}
            >
              {a.label}
            </Button>
          ))}
        </Space>
      </Card>

      {/* Programar / reagendar audiencia */}
      <Modal
        open={modalAgendar !== null}
        title={modalAgendar === 'reagendar' ? 'Reagendar audiencia' : 'Programar audiencia'}
        okText="Generar citación"
        cancelText="Cancelar"
        onCancel={() => setModalAgendar(null)}
        onOk={() => {
          setModalAgendar(null);
          message.success('Audiencia programada. Genera la citación para las partes.');
          navigate(`/querellas/${id}/documento/citacion`);
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            Selecciona la fecha y hora de la audiencia pública. Se generará la
            citación con la antelación mínima de ley (24 horas).
          </Text>
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format="DD/MM/YYYY HH:mm"
            placeholder="Fecha y hora"
          />
        </Space>
      </Modal>

      {/* Registrar resultado de audiencia */}
      <Modal
        open={modalRegistrar}
        title="Registrar resultado de la audiencia"
        okText={comparecio === 'no' ? 'Generar fallo en ausencia' : 'Generar fallo'}
        cancelText="Cerrar"
        okButtonProps={{ disabled: !comparecio }}
        onCancel={() => setModalRegistrar(false)}
        onOk={() => {
          setModalRegistrar(false);
          navigate(`/querellas/${id}/documento/fallo`);
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
              description="Ante la inasistencia injustificada, el despacho puede imponer la medida correctiva correspondiente y proferir el fallo en ausencia, conforme al Código Nacional de Seguridad y Convivencia."
            />
          )}
          {comparecio === 'si' && (
            <Alert
              type="info"
              showIcon
              message="Audiencia celebrada"
              description="Con el resultado de la audiencia, procede redactar el fallo de fondo."
            />
          )}
        </Space>
      </Modal>
    </>
  );
}
