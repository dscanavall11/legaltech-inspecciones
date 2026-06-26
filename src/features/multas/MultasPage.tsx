import { useState } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  InputNumber,
  Tag,
  Alert,
  Space,
} from 'antd';
import {
  SMMLV_REFERENCIA,
  SMDLV_POR_TIPO,
  smdlv,
  valorMulta,
  formatearPesos,
  MULTA_LABEL,
  MULTA_EJEMPLOS,
  type MultaTipo,
} from '@/shared/multas/multas';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;
const TIPOS: MultaTipo[] = [1, 2, 3, 4];
const COLOR_TIPO: Record<MultaTipo, string> = {
  1: PALETA.verde,
  2: PALETA.azul,
  3: PALETA.amarillo,
  4: PALETA.rojo,
};

export function MultasPage() {
  const [smmlv, setSmmlv] = useState<number>(SMMLV_REFERENCIA);

  return (
    <div>
      <Title level={2} style={{ marginTop: 0, marginBottom: 4 }}>
        Medidas correctivas
      </Title>
      <Text type="secondary" style={{ fontSize: 15 }}>
        Multas generales del Código Nacional de Seguridad y Convivencia (Art. 180,
        Ley 1801 de 2016).
      </Text>

      <Card
        variant="borderless"
        style={{ marginTop: 20, boxShadow: ELEVACION.base }}
        styles={{ body: { padding: 18 } }}
      >
        <Space wrap align="center" size="middle">
          <Text strong>Salario mínimo mensual vigente (SMMLV):</Text>
          <InputNumber
            value={smmlv}
            min={0}
            step={1000}
            onChange={(v) => setSmmlv(v ?? 0)}
            style={{ width: 180 }}
            formatter={(v) => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(v) => Number((v ?? '').replace(/\$\s?|\./g, ''))}
          />
          <Text type="secondary">
            SMDLV = {formatearPesos(smdlv(smmlv))} (SMMLV ÷ 30)
          </Text>
        </Space>
      </Card>

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        {TIPOS.map((tipo) => (
          <Col key={tipo} xs={24} sm={12} lg={6}>
            <Card variant="borderless" style={{ boxShadow: ELEVACION.base, height: '100%' }}>
              <Tag color={COLOR_TIPO[tipo]} style={{ fontWeight: 600 }}>
                {MULTA_LABEL[tipo]}
              </Tag>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: PALETA.texto,
                  marginTop: 14,
                  lineHeight: 1.2,
                }}
              >
                {formatearPesos(valorMulta(tipo, smmlv))}
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {SMDLV_POR_TIPO[tipo]} SMDLV
              </Text>
              <div style={{ marginTop: 12, fontSize: 13, color: PALETA.textoSuave }}>
                {MULTA_EJEMPLOS[tipo]}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Alert
        style={{ marginTop: 20 }}
        type="info"
        showIcon
        message="Valores de referencia"
        description="Confirma el SMMLV vigente del año y la tipificación del comportamiento antes de imponer la medida. Los montos se recalculan automáticamente al ajustar el salario."
      />
    </div>
  );
}
