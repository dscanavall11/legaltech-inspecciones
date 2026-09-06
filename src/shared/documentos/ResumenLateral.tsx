import { useState } from 'react';
import { Alert, Button, Card, Typography } from 'antd';
import { Sparkles } from 'lucide-react';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

const { Text, Paragraph } = Typography;

/**
 * Panel lateral de resumen con IA (tier suave, Gemini). Genera bajo demanda
 * un resumen en texto plano del documento - el backend real no produce
 * acápites/razones-de-peso/normas-citadas estructurados, solo texto. Sin
 * acoplamiento a ningún dominio (querella/comparendo/...) — Task 18 lo
 * promueve a compartido junto con el resto del visor de documento.
 *
 * `onGenerarResumen` se inyecta desde el llamador (shared no debe depender de
 * features/analisis/api) — DocumentoEditorPage lo recibe como prop y lo pasa aquí.
 */
export function ResumenLateral({
  tipoDocumento,
  texto,
  onGenerarResumen,
}: {
  tipoDocumento: string;
  texto: string;
  onGenerarResumen: (req: { tipoDocumento: string; texto: string }) => Promise<string>;
}) {
  const [resumen, setResumen] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    setCargando(true);
    setError(null);
    try {
      setResumen(await onGenerarResumen({ tipoDocumento, texto }));
    } catch {
      setError('No fue posible generar el resumen. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card
      style={{ marginBottom: 12 }}
      styles={{ body: { padding: 16 } }}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} strokeWidth={1.75} style={{ color: PALETA.azul }} />
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
          <Text type="secondary" style={{ fontSize: TEXTO.base }}>
            Resumen rápido del documento, generado con IA.
          </Text>
          <Button block style={{ marginTop: 10 }} onClick={generar}>
            Generar resumen
          </Button>
        </>
      )}

      {cargando && (
        <Text type="secondary" style={{ fontSize: TEXTO.base }}>
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
          <Paragraph style={{ fontSize: TEXTO.base, marginBottom: 0, whiteSpace: 'pre-wrap' }}>
            {resumen}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: TEXTO.nota }}>
            Generado con IA. Verifica siempre contra el documento.
          </Text>
        </div>
      )}
    </Card>
  );
}
