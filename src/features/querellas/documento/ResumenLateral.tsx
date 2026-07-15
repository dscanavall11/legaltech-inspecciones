import { useState } from 'react';
import { Alert, Button, Card, Tag, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { resumirDocumento, type ResumenDocumento } from '@/features/analisis/api';
import { PALETA } from '@/theme/theme';

const { Text, Paragraph } = Typography;

/**
 * Panel lateral de resumen con IA (tier suave). Genera bajo demanda:
 * resumen corto, razones de peso del fallo y normas citadas.
 */
export function ResumenLateral({
  tipoDocumento,
  texto,
}: {
  tipoDocumento: string;
  texto: string;
}) {
  const [resumen, setResumen] = useState<ResumenDocumento | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    setCargando(true);
    setError(null);
    try {
      setResumen(await resumirDocumento({ tipoDocumento, texto }));
    } catch {
      setError('No fue posible generar el resumen. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThunderboltOutlined style={{ color: PALETA.azul }} />
          Resumen IA
        </span>
      }
      extra={
        resumen && (
          <Button size="small" type="text" onClick={generar} loading={cargando}>
            Regenerar
          </Button>
        )
      }
    >
      {!resumen && !cargando && !error && (
        <>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Resumen rápido del documento con las razones de peso de la decisión.
          </Text>
          <Button block style={{ marginTop: 10 }} onClick={generar}>
            Generar resumen
          </Button>
        </>
      )}

      {cargando && (
        <Text type="secondary" style={{ fontSize: 13 }}>
          Generando resumen…
        </Text>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          action={
            <Button size="small" onClick={generar}>
              Reintentar
            </Button>
          }
        />
      )}

      {resumen && !cargando && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Paragraph style={{ fontSize: 13, marginBottom: 0 }}>{resumen.resumen}</Paragraph>

          {resumen.razonesDePeso.length > 0 && (
            <div>
              <Text strong style={{ fontSize: 12, color: PALETA.textoSuave }}>
                RAZONES DE PESO
              </Text>
              <ol style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {resumen.razonesDePeso.map((r, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {resumen.normasCitadas.length > 0 && (
            <div>
              <Text strong style={{ fontSize: 12, color: PALETA.textoSuave }}>
                NORMAS CITADAS
              </Text>
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {resumen.normasCitadas.map((n) => (
                  <Tag key={n} style={{ marginInlineEnd: 0 }}>
                    {n}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          <Text type="secondary" style={{ fontSize: 11 }}>
            Generado con IA. Verifica siempre contra el documento.
          </Text>
        </div>
      )}
    </Card>
  );
}
