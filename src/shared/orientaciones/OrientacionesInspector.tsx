import { Alert, Input, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  LEYENDA_AUTOGUARDADO,
  useAutoguardadoMetadata,
} from '@/shared/legalCases/useAutoguardadoMetadata';
import { leerOrientaciones, type Orientaciones } from './types';

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
      <Alert
        type="info"
        showIcon
        message="Lo que escriba aquí orienta el análisis, pero no se toma como hecho probado."
        description="El sistema mantiene separadas sus orientaciones de los hechos y las pruebas del expediente: aparecen rotuladas en el análisis y nunca sustentan por sí solas una conclusión."
      />

      <TextArea
        value={valor.texto}
        onChange={(e) => escribir(e.target.value)}
        placeholder={EJEMPLOS}
        autoSize={{ minRows: 8, maxRows: 22 }}
        aria-label="Orientaciones del inspector"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Text type={estado === 'error' ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
          {LEYENDA_AUTOGUARDADO[estado]}
        </Text>
        {valor.actualizadoEn && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Última edición: {dayjs(valor.actualizadoEn).format('D [de] MMMM, YYYY [a las] HH:mm')}
          </Text>
        )}
      </div>
    </Space>
  );
}
