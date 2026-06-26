import { useState } from 'react';
import { useForm, Controller, type Control, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Steps,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Form,
  Descriptions,
  App,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCrearQuerella } from './api';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ASUNTOS = [
  'Perturbación a la posesión o tenencia de inmueble',
  'Restitución de bien de uso público',
  'Contaminación auditiva / ruido',
  'Ocupación indebida del espacio público',
  'Perturbación por obra o construcción',
  'Otro comportamiento contrario a la convivencia',
];

const schema = z.object({
  querellante: z.string().min(3, 'Ingresa el nombre del querellante'),
  querellado: z.string().min(3, 'Ingresa el nombre del querellado'),
  asunto: z.string().min(1, 'Selecciona el asunto de la querella'),
  direccionInmueble: z.string().optional(),
  descripcion: z.string().optional(),
  diasTermino: z
    .number({ message: 'Indica los días del término' })
    .min(1, 'Mínimo 1 día')
    .max(60, 'Máximo 60 días'),
});

type FormValores = z.infer<typeof schema>;

const CAMPOS_POR_PASO: Array<Array<keyof FormValores>> = [
  ['querellante', 'querellado'],
  ['asunto', 'direccionInmueble', 'descripcion', 'diasTermino'],
  [],
];

function PasoPartes({
  control,
  errors,
}: {
  control: Control<FormValores>;
  errors: FieldErrors<FormValores>;
}) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form.Item
        label="Querellante (quien presenta la querella)"
        validateStatus={errors.querellante ? 'error' : ''}
        help={errors.querellante?.message}
      >
        <Controller
          name="querellante"
          control={control}
          render={({ field }) => (
            <Input {...field} size="large" placeholder="Nombre completo o razón social" />
          )}
        />
      </Form.Item>
      <Form.Item
        label="Querellado (contra quien se presenta)"
        validateStatus={errors.querellado ? 'error' : ''}
        help={errors.querellado?.message}
      >
        <Controller
          name="querellado"
          control={control}
          render={({ field }) => (
            <Input {...field} size="large" placeholder="Nombre completo o razón social" />
          )}
        />
      </Form.Item>
    </Space>
  );
}

function PasoHechos({
  control,
  errors,
}: {
  control: Control<FormValores>;
  errors: FieldErrors<FormValores>;
}) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form.Item
        label="Asunto de la querella"
        validateStatus={errors.asunto ? 'error' : ''}
        help={errors.asunto?.message}
      >
        <Controller
          name="asunto"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              size="large"
              placeholder="Selecciona el comportamiento"
              options={ASUNTOS.map((a) => ({ label: a, value: a }))}
            />
          )}
        />
      </Form.Item>
      <Form.Item label="Inmueble / dirección (si aplica)">
        <Controller
          name="direccionInmueble"
          control={control}
          render={({ field }) => (
            <Input {...field} size="large" placeholder="Ej: Calle 45 # 12-30, Barrio Centro" />
          )}
        />
      </Form.Item>
      <Form.Item label="Descripción de los hechos (opcional)">
        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <TextArea {...field} rows={4} placeholder="Relata brevemente lo ocurrido" />
          )}
        />
      </Form.Item>
      <Form.Item
        label="Término aplicable (días hábiles)"
        validateStatus={errors.diasTermino ? 'error' : ''}
        help={errors.diasTermino?.message}
      >
        <Controller
          name="diasTermino"
          control={control}
          render={({ field }) => (
            <InputNumber {...field} size="large" min={1} max={60} style={{ width: 160 }} />
          )}
        />
      </Form.Item>
    </Space>
  );
}

function PasoRevision({ valores }: { valores: FormValores }) {
  return (
    <Descriptions
      column={1}
      bordered
      size="small"
      labelStyle={{ width: 220, color: PALETA.textoSuave }}
    >
      <Descriptions.Item label="Querellante">{valores.querellante}</Descriptions.Item>
      <Descriptions.Item label="Querellado">{valores.querellado}</Descriptions.Item>
      <Descriptions.Item label="Asunto">{valores.asunto}</Descriptions.Item>
      <Descriptions.Item label="Inmueble / dirección">
        {valores.direccionInmueble || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Descripción">
        {valores.descripcion || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Término aplicable">
        {valores.diasTermino} días hábiles
      </Descriptions.Item>
    </Descriptions>
  );
}

export function NuevaQuerellaPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const crear = useCrearQuerella();
  const [paso, setPaso] = useState(0);

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormValores>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      querellante: '',
      querellado: '',
      asunto: '',
      direccionInmueble: '',
      descripcion: '',
      diasTermino: 15,
    },
  });

  const siguiente = async () => {
    const valido = await trigger(CAMPOS_POR_PASO[paso]);
    if (valido) setPaso((p) => p + 1);
  };

  const onSubmit = (valores: FormValores) => {
    crear.mutate(
      {
        querellante: valores.querellante,
        querellado: valores.querellado,
        asunto: valores.asunto,
        direccionInmueble: valores.direccionInmueble,
        diasTermino: valores.diasTermino,
      },
      {
        onSuccess: (creada) => {
          message.success(`Querella ${creada.radicado} radicada.`);
          navigate(`/querellas/${creada.id}`);
        },
        onError: () => message.error('No se pudo radicar la querella. Intenta de nuevo.'),
      },
    );
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/querellas')}
        style={{ paddingLeft: 0, marginBottom: 8 }}
      >
        Volver a querellas
      </Button>
      <Title level={2} style={{ marginTop: 0 }}>
        Nueva querella
      </Title>
      <Text type="secondary" style={{ fontSize: 15 }}>
        Completa los datos paso a paso. Podrás revisarlos antes de radicar.
      </Text>

      <Card variant="borderless" style={{ marginTop: 20, boxShadow: ELEVACION.base }}>
        <Steps
          current={paso}
          style={{ marginBottom: 28 }}
          items={[
            { title: 'Partes' },
            { title: 'Hechos' },
            { title: 'Revisión' },
          ]}
        />

        <Form layout="vertical">
          {paso === 0 && <PasoPartes control={control} errors={errors} />}
          {paso === 1 && <PasoHechos control={control} errors={errors} />}
          {paso === 2 && <PasoRevision valores={getValues()} />}
        </Form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 28,
          }}
        >
          <Button
            size="large"
            disabled={paso === 0}
            onClick={() => setPaso((p) => p - 1)}
          >
            Atrás
          </Button>
          {paso < 2 ? (
            <Button type="primary" size="large" onClick={siguiente}>
              Siguiente
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              loading={crear.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              Radicar querella
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
