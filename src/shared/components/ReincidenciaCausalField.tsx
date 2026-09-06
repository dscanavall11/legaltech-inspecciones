import { Alert, Input, Select, Typography } from 'antd';
import { INCREMENTO_LABEL, type CausalIncremento } from '@/derecho';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;

const CAUSAL_OPCIONES = (Object.entries(INCREMENTO_LABEL) as [CausalIncremento, string][]).map(
  ([value, label]) => ({ value, label }),
);

/**
 * Control de reincidencia motivada, compartido por ActasFirmezaPage y
 * ProntoPagoPage: el inspector marca la causal (nunca se aplica sola) y
 * aporta la evidencia RNMC/BDME que la motiva; esa evidencia se transcribe
 * tal cual en el acta (ver `parrafosReiteracion223A` / `parrafoRnmc`).
 */
export function ReincidenciaCausalField({
  causal,
  evidencia,
  onCausalChange,
  onEvidenciaChange,
}: {
  causal: CausalIncremento;
  evidencia: string;
  onCausalChange: (v: CausalIncremento) => void;
  onEvidenciaChange: (v: string) => void;
}) {
  const requiereEvidencia = causal !== 'ninguna';
  return (
    <div>
      <div
        style={{
          fontSize: TEXTO.menor,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: PALETA.textoSuave,
          marginBottom: 6,
          paddingLeft: 2,
        }}
      >
        Reincidencia (RNMC / BDME, art. 223A)
      </div>
      <Select<CausalIncremento>
        style={{ width: '100%' }}
        value={causal}
        onChange={onCausalChange}
        options={CAUSAL_OPCIONES}
      />
      {requiereEvidencia && (
        <>
          <Input.TextArea
            style={{ marginTop: 8 }}
            autoSize={{ minRows: 2, maxRows: 4 }}
            value={evidencia}
            onChange={(e) => onEvidenciaChange(e.target.value)}
            placeholder="Evidencia que motiva la causal: folio de la consulta RNMC, número del comparendo anterior, reporte BDME…"
          />
          {!evidencia.trim() && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 8, borderRadius: 12 }}
              message="La reincidencia nunca se aplica sola"
              description="Aporte la evidencia (RNMC/BDME) que motiva esta causal; se transcribe en el acta como fundamento del incremento."
            />
          )}
        </>
      )}
      {!requiereEvidencia && (
        <Text type="secondary" style={{ fontSize: TEXTO.menor, display: 'block', marginTop: 6 }}>
          Sin causal marcada, el acta deja constancia motivada de que no procede incremento.
        </Text>
      )}
    </div>
  );
}
