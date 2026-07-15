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
import { siguientePaso, type AccionTipo } from '@/derecho';
import type { EstadoQuerella } from './types';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

const ICONO: Record<AccionTipo, ReactNode> = {
  programar_audiencia: <CalendarOutlined />,
  registrar_audiencia: <AuditOutlined />,
  reagendar_audiencia: <CalendarOutlined />,
  generar_fallo: <FileTextOutlined />,
  constancia_ejecutoria: <SafetyCertificateOutlined />,
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
        return navigate(`/panel/querellas/${id}/documento/fallo`);
      case 'constancia_ejecutoria':
        return navigate(`/panel/querellas/${id}/documento/constancia`);
      case 'archivar':
        return message.success('Archivo del expediente ordenado.');
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
        onCancel={() => setModalAgendar(null)}
        onOk={() => {
          setModalAgendar(null);
          message.success('Audiencia señalada. Se librará la citación a las partes.');
          navigate(`/panel/querellas/${id}/documento/citacion`);
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
          />
        </Space>
      </Modal>

      {/* Acta de audiencia pública */}
      <Modal
        open={modalRegistrar}
        title="Acta de audiencia pública"
        okText={comparecio === 'no' ? 'Proferir decisión en ausencia' : 'Proferir decisión'}
        cancelText="Cerrar"
        okButtonProps={{ disabled: !comparecio }}
        onCancel={() => setModalRegistrar(false)}
        onOk={() => {
          setModalRegistrar(false);
          navigate(`/panel/querellas/${id}/documento/fallo`);
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
    </>
  );
}
