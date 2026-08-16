import { Alert, AutoComplete, Input, Select, Space, Typography } from 'antd';
import {
  LEYENDA_AUTOGUARDADO,
  useAutoguardadoMetadata,
} from '@/shared/legalCases/useAutoguardadoMetadata';
import { PALETA } from '@/theme/theme';
import {
  CALIDADES_QUERELLANTE,
  faltantesParaFallo,
  leerPartes,
  type DatosParte,
  type PartesQuerella,
} from './partes';

const { Text } = Typography;

const TIPOS_ID = ['CC', 'CE', 'NIT', 'TI', 'PPT', 'PAS'];

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function FichaParte({
  titulo,
  ayuda,
  parte,
  onChange,
}: {
  titulo: string;
  ayuda: string;
  parte: DatosParte;
  onChange: (p: DatosParte) => void;
}) {
  const set = <K extends keyof DatosParte>(k: K, v: DatosParte[K]) => onChange({ ...parte, [k]: v });

  return (
    <div
      style={{
        background: PALETA.superficie,
        border: `1px solid ${PALETA.borde}`,
        borderRadius: 16,
        padding: '18px 20px',
      }}
    >
      <Text strong style={{ display: 'block', fontSize: 15 }}>
        {titulo}
      </Text>
      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 14 }}>
        {ayuda}
      </Text>

      <div style={{ display: 'grid', gap: 12 }}>
        <Campo label="Nombre completo">
          <Input value={parte.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
          <Campo label="Tipo">
            <Select
              style={{ width: '100%' }}
              value={parte.tipoIdentificacion}
              onChange={(v) => set('tipoIdentificacion', v)}
              options={TIPOS_ID.map((t) => ({ value: t, label: t }))}
            />
          </Campo>
          <Campo label="Número de identificación">
            <Input
              value={parte.identificacion}
              onChange={(e) => set('identificacion', e.target.value)}
            />
          </Campo>
        </div>

        <Campo label="Dirección de notificación">
          <Input value={parte.direccion} onChange={(e) => set('direccion', e.target.value)} />
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Campo label="Teléfono">
            <Input value={parte.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </Campo>
          <Campo label="Correo electrónico">
            <Input value={parte.correo} onChange={(e) => set('correo', e.target.value)} />
          </Campo>
        </div>

        <Campo label="Apoderado (opcional)">
          <Input
            value={parte.apoderado}
            onChange={(e) => set('apoderado', e.target.value)}
            placeholder="No se requiere abogado (art. 2.2.8.18.4.3)"
          />
        </Campo>
      </div>
    </div>
  );
}

export interface PartesQuerellaFormProps {
  caseId: string;
  caseMetadataRaw?: string | null;
}

/**
 * Los dos sujetos procesales de la querella. Se autoguarda en
 * `caseMetadata.partes`, igual que las orientaciones y los datos del fallo.
 */
export function PartesQuerellaForm({ caseId, caseMetadataRaw }: PartesQuerellaFormProps) {
  const {
    valor: partes,
    setValor: setPartes,
    estado,
  } = useAutoguardadoMetadata<PartesQuerella>({
    caseId,
    caseMetadataRaw,
    clave: 'partes',
    leer: leerPartes,
  });

  const faltantes = faltantesParaFallo(partes);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="La querella tiene dos sujetos procesales: querellante y querellado"
        description="A diferencia de la queja, que es oficiosa y solo tiene presunto infractor, la querella requiere impulso de parte (art. 2.2.8.18.3.3 del Decreto 768 de 2025). Los dos deben quedar identificados en el fallo."
      />

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <FichaParte
          titulo="Querellante"
          ayuda="Quien promueve la acción de policía."
          parte={partes.querellante}
          onChange={(querellante) => setPartes({ ...partes, querellante })}
        />
        <FichaParte
          titulo="Querellado"
          ayuda="Contra quien se dirige la querella."
          parte={partes.querellado}
          onChange={(querellado) => setPartes({ ...partes, querellado })}
        />
      </div>

      <div
        style={{
          background: PALETA.superficie,
          border: `1px solid ${PALETA.borde}`,
          borderRadius: 16,
          padding: '18px 20px',
          display: 'grid',
          gap: 12,
        }}
      >
        <Text strong style={{ fontSize: 15 }}>
          Legitimación y objeto
        </Text>

        <Campo label="Calidad en que actúa el querellante">
          <AutoComplete
            style={{ width: '100%' }}
            value={partes.calidadQuerellante}
            onChange={(v) => setPartes({ ...partes, calidadQuerellante: v })}
            options={CALIDADES_QUERELLANTE.map((c) => ({ value: c }))}
            placeholder="Propietario, poseedor, tenedor…"
            filterOption={(input, option) =>
              String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Text type="secondary" style={{ fontSize: 11.5 }}>
            Obligatorio en toda querella (art. 2.2.8.18.4.1).
          </Text>
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <Campo label="Dirección del inmueble (si la querella versa sobre uno)">
            <Input
              value={partes.inmuebleDireccion}
              onChange={(e) => setPartes({ ...partes, inmuebleDireccion: e.target.value })}
            />
          </Campo>
          <Campo label="Matrícula inmobiliaria">
            <Input
              value={partes.matriculaInmobiliaria}
              onChange={(e) => setPartes({ ...partes, matriculaInmobiliaria: e.target.value })}
            />
          </Campo>
        </div>
        <Text type="secondary" style={{ fontSize: 11.5, marginTop: -4 }}>
          En querellas sobre inmuebles el querellante debe probar posesión o tenencia siquiera
          sumariamente (art. 2.2.8.18.4.2).
        </Text>
      </div>

      {faltantes.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Faltan datos para que el fallo identifique a las dos partes"
          description={faltantes.join(' · ')}
        />
      )}

      <Text type={estado === 'error' ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
        {LEYENDA_AUTOGUARDADO[estado]}
      </Text>
    </Space>
  );
}
