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
import { useCrearQueja } from './api';
import { CATEGORIA_QUEJA_LABEL, type CategoriaQueja } from './types';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;
const { TextArea } = Input;

const schema = z.object({
  quejoso: z.string().min(3, 'Ingresa el nombre del quejoso'),
  acusado: z.string().min(3, 'Ingresa el nombre del acusado'),
  asunto: z.string().min(4, 'Describe brevemente el asunto'),
  categoria: z.enum(
    ['ruido', 'mascotas', 'basuras', 'construccion', 'espacio_publico', 'vecindad', 'otro'],
    { message: 'Selecciona una categoría' },
  ),
  descripcionHechos: z.string().optional(),
  diasTermino: z
    .number({ message: 'Indica los días del término' })
    .min(1, 'Mínimo 1 día')
    .max(30, 'Máximo 30 días'),
});

type FormValores = z.infer<typeof schema>;

const CAMPOS_POR_PASO: Array<Array<keyof FormValores>> = [
  ['quejoso', 'acusado'],
  ['asunto', 'categoria', 'descripcionHechos', 'diasTermino'],
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
        label="Quejoso (quien presenta la queja)"
        validateStatus={errors.quejoso ? 'error' : ''}
        help={errors.quejoso?.message}
      >
        <Controller
          name="quejoso"
          control={control}
          render={({ field }) => (
            <Input {...field} size="large" placeholder="Nombre completo o razón social" />
          )}
        />
      </Form.Item>
      <Form.Item
        label="Acusado (contra quien se presenta)"
        validateStatus={errors.acusado ? 'error' : ''}
        help={errors.acusado?.message}
      >
        <Controller
          name="acusado"
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
  const categorias = Object.entries(CATEGORIA_QUEJA_LABEL).map(([value, label]) => ({
    value: value as CategoriaQueja,
    label,
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form.Item
        label="Categoría del comportamiento"
        validateStatus={errors.categoria ? 'error' : ''}
        help={errors.categoria?.message}
      >
        <Controller
          name="categoria"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              size="large"
              placeholder="Selecciona la categoría"
              options={categorias}
            />
          )}
        />
      </Form.Item>
      <Form.Item
        label="Asunto (resumen breve)"
        validateStatus={errors.asunto ? 'error' : ''}
        help={errors.asunto?.message}
      >
        <Controller
          name="asunto"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              size="large"
              placeholder="Ej: Ruido excesivo en horas nocturnas"
            />
          )}
        />
      </Form.Item>
      <Form.Item label="Descripción de los hechos (opcional)">
        <Controller
          name="descripcionHechos"
          control={control}
          render={({ field }) => (
            <TextArea
              {...field}
              rows={4}
              placeholder="Relata brevemente los hechos que motivan la queja"
            />
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
            <InputNumber {...field} size="large" min={1} max={30} style={{ width: 160 }} />
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
      <Descriptions.Item label="Quejoso">{valores.quejoso}</Descriptions.Item>
      <Descriptions.Item label="Acusado">{valores.acusado}</Descriptions.Item>
      <Descriptions.Item label="Categoría">
        {CATEGORIA_QUEJA_LABEL[valores.categoria]}
      </Descriptions.Item>
      <Descriptions.Item label="Asunto">{valores.asunto}</Descriptions.Item>
      <Descriptions.Item label="Descripción de los hechos">
        {valores.descripcionHechos || 'Sin diligenciar'}
      </Descriptions.Item>
      <Descriptions.Item label="Término aplicable">
        {valores.diasTermino} días hábiles
      </Descriptions.Item>
    </Descriptions>
  );
}

export function NuevaQuejaPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const crear = useCrearQueja();
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
      quejoso: '',
      acusado: '',
      asunto: '',
      descripcionHechos: '',
      diasTermino: 10,
    },
  });

  const siguiente = async () => {
    const valido = await trigger(CAMPOS_POR_PASO[paso]);
    if (valido) setPaso((p) => p + 1);
  };

  const onSubmit = (valores: FormValores) => {
    crear.mutate(
      {
        quejoso: valores.quejoso,
        acusado: valores.acusado,
        asunto: valores.asunto,
        categoria: valores.categoria,
        descripcionHechos: valores.descripcionHechos ?? '',
        diasTermino: valores.diasTermino,
      },
      {
        onSuccess: (creada) => {
          message.success(`Queja ${creada.radicado} radicada.`);
          navigate(`/panel/quejas/${creada.id}`);
        },
        onError: () =>
          message.error('No se pudo radicar la queja. Intenta de nuevo.'),
      },
    );
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/panel/quejas')}
        style={{ paddingLeft: 0, marginBottom: 8 }}
      >
        Volver a quejas
      </Button>
      <Title level={2} style={{ marginTop: 0 }}>
        Nueva queja
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
              Radicar queja
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
