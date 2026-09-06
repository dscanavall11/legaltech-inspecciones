import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type Sesion } from '@/shared/auth/auth';
import { ApiError } from '@/shared/api/client';
import { login, loginMfa, type LoginResponseDTO } from './api';
import { DESPACHO } from '@/derecho';
import { PALETA, ELEVACION } from '@/theme/theme';

const { Title, Text } = Typography;

function mensajeDeError(err: unknown, contexto: 'login' | 'mfa'): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return contexto === 'login'
        ? 'Correo o contraseña incorrectos.'
        : 'Código de verificación inválido.';
    }
    if (err.status >= 500) return 'Error del servidor. Intenta de nuevo más tarde.';
    return err.message;
  }
  return 'No fue posible conectar con el servidor. Verifica tu conexión.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const iniciarSesion = useAuth((s) => s.iniciarSesion);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  const completarSesion = (res: LoginResponseDTO) => {
    const sesion: Sesion = {
      status: res.status,
      message: res.message,
      username: res.username ?? '',
      accessToken: res.accessToken ?? '',
      idToken: res.idToken ?? '',
      refreshToken: res.refreshToken ?? '',
    };
    iniciarSesion(sesion);
    navigate('/panel', { replace: true });
  };

  const onSubmit = async (values: { email?: string; password?: string; code?: string }) => {
    setCargando(true);
    setError(null);
    try {
      if (mfaToken) {
        const res = await loginMfa(mfaToken, values.code ?? '');
        if (res?.status === 'SUCCESS' && res.accessToken) {
          completarSesion(res);
        } else {
          setError(res?.message || 'Código de verificación inválido.');
        }
      } else {
        const res = await login(values.email ?? '', values.password ?? '');
        if (res?.mfaRequired) {
          setMfaToken(res.mfaToken ?? null);
        } else if (res?.status === 'SUCCESS' && res.accessToken) {
          completarSesion(res);
        } else {
          setError(res?.message || 'No fue posible iniciar sesión.');
        }
      }
    } catch (err) {
      setError(mensajeDeError(err, mfaToken ? 'mfa' : 'login'));
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
        background: `radial-gradient(1100px 560px at 18% -10%, ${PALETA.azulSuave} 0%, ${PALETA.fondo} 58%)`,
        padding: 16,
      }}
    >
      <Card style={{ width: 400, boxShadow: ELEVACION.media, borderRadius: 22 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: PALETA.azul,
              color: '#fff',
              fontWeight: 700,
              fontSize: 20,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            L
          </span>
          <Title level={3} style={{ marginTop: 12, marginBottom: 2 }}>
            LegalTech
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
          <Text type="secondary">
            {mfaToken
              ? 'Ingresa el código de verificación de tu aplicación.'
              : 'Inicia sesión para gestionar tu inspección.'}
          </Text>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={onSubmit} requiredMark={false} disabled={cargando}>
          {!mfaToken ? (
            <>
              <Form.Item
                name="email"
                label="Correo electrónico"
                rules={[
                  { required: true, message: 'Ingresa tu correo.' },
                  { type: 'email', message: 'Correo inválido.' },
                ]}
              >
                <Input prefix={<MailOutlined />} autoComplete="username" size="large" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Contraseña"
                rules={[
                  { required: true, message: 'Ingresa tu contraseña.' },
                  { min: 6, message: 'Mínimo 6 caracteres.' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  autoComplete="current-password"
                  size="large"
                />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="code"
              label="Código de verificación"
              rules={[{ required: true, message: 'Ingresa el código.' }]}
            >
              <Input prefix={<SafetyOutlined />} autoComplete="one-time-code" size="large" />
            </Form.Item>
          )}

          <Button type="primary" htmlType="submit" block size="large" loading={cargando}>
            {mfaToken ? 'Verificar' : 'Iniciar sesión'}
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
