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
import { siguientePasoQueja, TERMINOS, type AccionQuejaTipo } from '@/derecho';
import { useCrearQuerella } from '@/features/querellas/api';
import type { Queja } from './types';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

const ICONO: Record<AccionQuejaTipo, ReactNode> = {
  citar_conciliacion: <CalendarOutlined />,
  registrar_conciliacion: <CheckCircleOutlined />,
  convertir_querella: <FileTextOutlined />,
  archivar: <InboxOutlined />,
};

export function SiguientePasoQueja({ queja }: { queja: Queja }) {
  const { id, estado } = queja;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const paso = siguientePasoQueja(estado);
  const crearQuerella = useCrearQuerella();

  const [modalCitar, setModalCitar] = useState(false);
  const [modalResultado, setModalResultado] = useState(false);
  const [modalConvertir, setModalConvertir] = useState(false);
  const [resultado, setResultado] = useState<'acuerdo' | 'sin_acuerdo' | null>(null);

  const ejecutar = (tipo: AccionQuejaTipo) => {
    switch (tipo) {
      case 'citar_conciliacion':
        return setModalCitar(true);
      case 'registrar_conciliacion':
        setResultado(null);
        return setModalResultado(true);
      case 'convertir_querella':
        return setModalConvertir(true);
      case 'archivar':
        message.success('Archivo del expediente ordenado.');
        return;
    }
  };

  async function darTramiteQuerella() {
    try {
      const creada = await crearQuerella.mutateAsync({
        querellante: queja.quejoso,
        querellado: queja.acusado,
        asunto: queja.asunto,
        diasTermino: TERMINOS.querellaDias,
      });
      setModalConvertir(false);
      message.success(`Querella radicada bajo el número ${creada.radicado}.`);
      navigate(`/panel/querellas/${creada.id}`);
    } catch {
      message.error('No se pudo radicar la querella. Intente de nuevo.');
    }
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
        onCancel={() => setModalCitar(false)}
        onOk={() => {
          setModalCitar(false);
          message.success('Audiencia de conciliación señalada. Se citará a las partes.');
          navigate(`/panel/quejas/${id}`);
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

      {/* Acta de audiencia de conciliación */}
      <Modal
        open={modalResultado}
        title="Acta de audiencia de conciliación"
        okText={resultado === 'sin_acuerdo' ? 'Dejar constancia de no acuerdo' : 'Suscribir acta'}
        cancelText="Cancelar"
        okButtonProps={{ disabled: !resultado }}
        onCancel={() => setModalResultado(false)}
        onOk={() => {
          setModalResultado(false);
          message.success(
            resultado === 'acuerdo'
              ? 'Acta de conciliación suscrita por las partes.'
              : 'Constancia de no acuerdo dejada en el expediente.',
          );
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
            <Alert
              type="success"
              showIcon
              message="Conciliación lograda"
              description="El acta suscrita por las partes y el inspector presta mérito ejecutivo y hace tránsito a cosa juzgada. Verificado el cumplimiento, se ordenará el archivo."
            />
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
        confirmLoading={crearQuerella.isPending}
        onCancel={() => setModalConvertir(false)}
        onOk={() => void darTramiteQuerella()}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            Fracasada la conciliación, el asunto continúa por proceso verbal
            abreviado (art. 223, Ley 1801 de 2016). Se radicará una querella con
            las partes y los hechos de esta queja.
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
