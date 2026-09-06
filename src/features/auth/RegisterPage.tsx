import { useMemo, useState } from 'react';
import { Alert, AutoComplete, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '@/shared/api/client';
import { COLOMBIAN_MUNICIPALITIES } from '@/shared/constants/municipalities';
import { register } from './api';
import { DESPACHO } from '@/derecho';
import { PALETA, ELEVACION } from '@/theme/theme';

const { Title, Text } = Typography;

// Mismo formato que exigía el frontend Angular: +57 seguido de 9-10 dígitos.
const TELEFONO_RE = /^\+57\d{9,10}$/;

export function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const opcionesMunicipio = useMemo(
    () =>
      COLOMBIAN_MUNICIPALITIES.map((m) => ({
        value: `${m.name}, ${m.department}`,
        code: m.code,
      })),
    [],
  );

  const onSubmit = async (values: {
    username: string;
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    municipalityName: string;
  }) => {
    const municipio = opcionesMunicipio.find((o) => o.value === values.municipalityName);
    if (!municipio) {
      setError('Selecciona un municipio de la lista.');
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const res = await register({
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        municipalityCode: municipio.code,
      });
      setExito(res?.message || 'Registro exitoso. Ya puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'No fue posible completar el registro.');
      } else {
        setError('No fue posible conectar con el servidor. Verifica tu conexión.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(1100px 560px at 82% -10%, ${PALETA.azulSuave} 0%, ${PALETA.fondo} 58%)`,
        padding: 16,
      }}
    >
      <Card style={{ width: 440, boxShadow: ELEVACION.media, borderRadius: 22 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 2 }}>
            Crear cuenta
          </Title>
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: PALETA.textoTenue,
              marginBottom: 8,
            }}
          >
            {DESPACHO.nombre} · Ley 1801 de 2016
          </div>
          <Text type="secondary">Registra tu despacho en LegalTech.</Text>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        {exito && <Alert type="success" message={exito} showIcon style={{ marginBottom: 16 }} />}

        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          requiredMark={false}
          disabled={cargando || !!exito}
        >
          <Form.Item
            name="username"
            label="Nombre de usuario"
            rules={[
              { required: true, message: 'Ingresa un nombre de usuario.' },
              { min: 3, message: 'Mínimo 3 caracteres.' },
            ]}
          >
            <Input prefix={<UserOutlined />} size="large" />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Nombre completo"
            rules={[{ required: true, message: 'Ingresa tu nombre completo.' }]}
          >
            <Input prefix={<UserOutlined />} size="large" placeholder="Ej: Juan Carlos Pérez" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Correo electrónico"
            rules={[
              { required: true, message: 'Ingresa tu correo.' },
              { type: 'email', message: 'Correo inválido.' },
            ]}
          >
            <Input prefix={<MailOutlined />} size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              { required: true, message: 'Ingresa una contraseña.' },
              { min: 6, message: 'Mínimo 6 caracteres.' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmar contraseña"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirma tu contraseña.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Las contraseñas no coinciden.'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Teléfono celular"
            rules={[
              { required: true, message: 'Ingresa tu teléfono.' },
              { pattern: TELEFONO_RE, message: 'Formato: +57 seguido de 9-10 dígitos.' },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="+573001234567" size="large" />
          </Form.Item>

          <Form.Item
            name="municipalityName"
            label="Municipio"
            rules={[{ required: true, message: 'Selecciona tu municipio.' }]}
          >
            <AutoComplete
              options={opcionesMunicipio}
              filterOption={(input, option) =>
                (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
              }
              size="large"
              placeholder="Busca tu municipio"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={cargando}>
            Registrarse
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
