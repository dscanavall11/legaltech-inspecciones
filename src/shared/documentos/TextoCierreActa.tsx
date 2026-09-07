import { Alert, App, Button, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { fechaALetras } from '@/derecho';
import { generarTextoCierreActa, textoCierrePlano, type DatosCierreActa } from '@/derecho/plantillas/textoCierreActa';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;

/**
 * "Texto para cierre / actualización" — sección independiente de la
 * descarga del .docx, para pegar en el sistema externo del despacho
 * (RNMC, radicador). Reutiliza EXACTAMENTE el nombre, la queja, la fecha del
 * acta, el tipo de multa y la causal ya seleccionados en el formulario —
 * no vuelve a pedir reincidencia ni tipo de multa, ni calcula una causal
 * distinta. El contenido jurídico de las tres variantes lo definió el
 * despacho; aquí solo se llenan los datos variables, nunca con IA.
 */
export function TextoCierreActa({
  nombre,
  queja,
  fechaResolucion,
  tipoMulta,
  causal,
}: {
  nombre: string;
  queja: string;
  fechaResolucion: string; // ISO
  tipoMulta: number;
  causal: DatosCierreActa['causal'];
}) {
  const { message } = App.useApp();

  if (!nombre || !queja) {
    return null; // sin registro cargado todavía — nada que mostrar
  }

  const segmentos = generarTextoCierreActa({
    nombre,
    queja,
    fechaActaLetras: fechaALetras(fechaResolucion),
    tipoMulta,
    causal,
  });

  return (
    <Tarjeta style={{ marginTop: 22 }}>
      <Text strong style={{ display: 'block', marginBottom: 14 }}>
        Texto para cierre / actualización
      </Text>

      {!segmentos ? (
        <Alert
          type="warning"
          showIcon
          message="Sin redacción definida para esta causal"
          description="El despacho no suministró un texto de cierre para 'moroso BDME'. No se genera uno improvisado."
        />
      ) : (
        <>
          <div
            style={{
              background: '#f7f8fa',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: TEXTO.base,
              lineHeight: 1.7,
            }}
          >
            {segmentos.map((s, i) => (
              <span key={i} style={{ fontWeight: s.negrilla ? 700 : 400 }}>
                {s.texto}
              </span>
            ))}
          </div>
          <Button
            icon={<CopyOutlined />}
            style={{ marginTop: 12 }}
            onClick={() => {
              void navigator.clipboard.writeText(textoCierrePlano(segmentos));
              message.success('Texto copiado al portapapeles.');
            }}
          >
            Copiar texto
          </Button>
        </>
      )}
    </Tarjeta>
  );
}
