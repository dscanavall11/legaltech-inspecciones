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
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { siguientePasoQueja, type AccionQuejaTipo } from './flujo';
import type { EstadoQueja } from './types';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

const ICONO: Record<AccionQuejaTipo, ReactNode> = {
  citar_conciliacion: <CalendarOutlined />,
  registrar_conciliacion: <CheckCircleOutlined />,
  convertir_querella: <FileTextOutlined />,
  archivar: <InboxOutlined />,
};

export function SiguientePasoQueja({
  id,
  estado,
}: {
  id: string;
  estado: EstadoQueja;
}) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const paso = siguientePasoQueja(estado);

  const [modalCitar, setModalCitar] = useState(false);
  const [modalResultado, setModalResultado] = useState(false);
  const [resultado, setResultado] = useState<'acuerdo' | 'sin_acuerdo' | null>(null);

  const ejecutar = (tipo: AccionQuejaTipo) => {
    switch (tipo) {
      case 'citar_conciliacion':
        return setModalCitar(true);
      case 'registrar_conciliacion':
        setResultado(null);
        return setModalResultado(true);
      case 'convertir_querella':
        message.info('La conversión a querella formal estará disponible en la siguiente versión.');
        return;
      case 'archivar':
        message.success('Expediente archivado.');
        return;
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

      {/* Citar a conciliación */}
      <Modal
        open={modalCitar}
        title="Citar a audiencia de conciliación"
        okText="Generar citación"
        cancelText="Cancelar"
        onCancel={() => setModalCitar(false)}
        onOk={() => {
          setModalCitar(false);
          message.success('Conciliación programada. Notifica a las partes.');
          navigate(`/quejas/${id}`);
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
          />
        </Space>
      </Modal>

      {/* Registrar resultado de conciliación */}
      <Modal
        open={modalResultado}
        title="Registrar resultado de la conciliación"
        okText="Guardar resultado"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !resultado }}
        onCancel={() => setModalResultado(false)}
        onOk={() => {
          setModalResultado(false);
          message.success(
            resultado === 'acuerdo'
              ? 'Acuerdo registrado. Expediente en firmeza.'
              : 'Sin acuerdo registrado.',
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text>¿Las partes llegaron a un acuerdo de conciliación?</Text>
          <Radio.Group
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="acuerdo">
                <CheckCircleOutlined style={{ color: PALETA.verde, marginRight: 6 }} />
                Sí, llegaron a acuerdo
              </Radio>
              <Radio value="sin_acuerdo">
                <CloseCircleOutlined style={{ color: PALETA.rojo, marginRight: 6 }} />
                No hubo acuerdo
              </Radio>
            </Space>
          </Radio.Group>

          {resultado === 'acuerdo' && (
            <Alert
              type="success"
              showIcon
              message="Conciliación exitosa"
              description="Se suscribirá el acta de acuerdo. El expediente quedará en firmeza una vez cumplidas las obligaciones pactadas."
            />
          )}
          {resultado === 'sin_acuerdo' && (
            <Alert
              type="warning"
              showIcon
              message="Sin acuerdo"
              description="Ante la falta de acuerdo, el inspector podrá convertir el asunto en querella formal para continuar con el proceso verbal abreviado."
            />
          )}
        </Space>
      </Modal>
    </>
  );
}
