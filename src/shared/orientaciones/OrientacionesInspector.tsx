import { Input, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  LEYENDA_AUTOGUARDADO,
  useAutoguardadoMetadata,
} from '@/shared/legalCases/useAutoguardadoMetadata';
import { leerOrientaciones, type Orientaciones } from './types';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;
const { TextArea } = Input;

const EJEMPLOS =
  'Ej.: qué quiere que se analice, dudas jurídicas, contexto del caso, problemas probatorios que ya detectó, criterios que quiere revisar antes de fallar.';

export interface OrientacionesInspectorProps {
  caseId: string;
  /** caseMetadata crudo del expediente: se fusiona, nunca se reemplaza entero. */
  caseMetadataRaw?: string | null;
}

/**
 * Espacio libre del inspector dentro del expediente. Se autoguarda en
 * `caseMetadata.orientaciones` y queda disponible para el análisis, siempre
 * rotulado como instrucción del funcionario y no como hecho probado (ver
 * `orientacionesParaAnalisis` en ./types).
 */
export function OrientacionesInspector({ caseId, caseMetadataRaw }: OrientacionesInspectorProps) {
  const { valor, setValor, estado } = useAutoguardadoMetadata<Orientaciones>({
    caseId,
    caseMetadataRaw,
    clave: 'orientaciones',
    leer: leerOrientaciones,
  });

  const escribir = (texto: string) =>
    setValor({ texto, actualizadoEn: new Date().toISOString() });

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {/* La garantía sigue siendo la misma —lo que escriba orienta pero no
          prueba—; lo que cambia es que ya no ocupa un recuadro de dos párrafos
          para explicar un campo de texto. El bloque que lo contiene la enuncia
          en su ayuda y aquí queda el pie. */}
      <TextArea
        value={valor.texto}
        onChange={(e) => escribir(e.target.value)}
        placeholder={EJEMPLOS}
        autoSize={{ minRows: 6, maxRows: 18 }}
        aria-label="Orientaciones del inspector"
      />
      <Text type="secondary" style={{ fontSize: TEXTO.nota }}>
        Sus orientaciones van rotuladas como tales en el análisis y nunca sustentan por sí solas
        una conclusión.
      </Text>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Text type={estado === 'error' ? 'danger' : 'secondary'} style={{ fontSize: TEXTO.nota }}>
          {LEYENDA_AUTOGUARDADO[estado]}
        </Text>
        {valor.actualizadoEn && (
          <Text type="secondary" style={{ fontSize: TEXTO.nota }}>
            Última edición: {dayjs(valor.actualizadoEn).format('D [de] MMMM, YYYY [a las] HH:mm')}
          </Text>
        )}
      </div>
    </Space>
  );
}
