import { Alert, AutoComplete, Input, Space, Typography } from 'antd';
import {
  LEYENDA_AUTOGUARDADO,
  useAutoguardadoMetadata,
} from '@/shared/legalCases/useAutoguardadoMetadata';
import { ESPACIO, TEXTO } from '@/theme/escala';
import { Bloque } from '@/shared/ui/Bloque';
import { FichaParte } from '@/shared/partes/FichaParte';
import { ExtraerDeDocumentos } from '@/shared/expediente/ExtraerDeDocumentos';
import { fusionarExtraidas } from './partesExtraidas';
import { Campo } from '@/shared/ui/Campo';
import { useReplaceCaseParties } from '@/shared/legalCases/api';
import {
  aCaseParties,
  CALIDADES_QUERELLANTE,
  faltantesParaFallo,
  leerPartes,
  type PartesQuerella,
} from './partes';

const { Text } = Typography;

export interface PartesQuerellaFormProps {
  caseId: string;
  caseMetadataRaw?: string | null;
  /** El expediente se acaba de abrir soltando documentos: se leen sin pedirlo. */
  autoExtraer?: boolean;
}

/**
 * Los dos sujetos procesales de la querella. Se autoguarda en
 * `caseMetadata.partes`, igual que las orientaciones y los datos del fallo.
 */
export function PartesQuerellaForm({ caseId, caseMetadataRaw, autoExtraer }: PartesQuerellaFormProps) {
  const reemplazarPartes = useReplaceCaseParties();
  const {
    valor: partes,
    setValor: setPartes,
    estado,
  } = useAutoguardadoMetadata<PartesQuerella>({
    caseId,
    caseMetadataRaw,
    clave: 'partes',
    leer: leerPartes,
    // La ficha se proyecta a case_parties, que es de donde leen Mis procesos, el
    // encabezado del fallo y el seudonimizador. Si falla, el trabajo del
    // inspector no se pierde: el blob ya quedó guardado.
    alGuardar: (v) => reemplazarPartes.mutate({ id: caseId, parties: aCaseParties(v) }),
  });

  const faltantes = faltantesParaFallo(partes);

  return (
    <Space direction="vertical" size={ESPACIO.md} style={{ width: '100%' }}>
      <ExtraerDeDocumentos
        caseId={caseId}
        auto={autoExtraer}
        onExtraido={({ partes: extraidas }) => setPartes(fusionarExtraidas(partes, extraidas))}
      />

      <Alert
        type="info"
        showIcon
        message="La querella tiene dos sujetos procesales: querellante y querellado"
        description="A diferencia de la queja, que es oficiosa y solo tiene presunto infractor, la querella requiere impulso de parte (art. 2.2.8.18.3.3 del Decreto 768 de 2025). Los dos deben quedar identificados en el fallo."
      />

      <div
        style={{
          display: 'grid',
          gap: ESPACIO.md,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
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

      <Bloque titulo="Legitimación y objeto" style={{ display: 'grid', gap: ESPACIO.md }}>
        <Campo
          label="Calidad en que actúa el querellante"
          nota="Obligatorio en toda querella (art. 2.2.8.18.4.1)."
        >
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
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: ESPACIO.md }}>
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
        <Text type="secondary" style={{ fontSize: TEXTO.nota, marginTop: -ESPACIO.xs }}>
          En querellas sobre inmuebles el querellante debe probar posesión o tenencia siquiera
          sumariamente (art. 2.2.8.18.4.2).
        </Text>
      </Bloque>

      {faltantes.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Faltan datos para que el fallo identifique a las dos partes"
          description={faltantes.join(' · ')}
        />
      )}

      <Text type={estado === 'error' ? 'danger' : 'secondary'} style={{ fontSize: TEXTO.nota }}>
        {LEYENDA_AUTOGUARDADO[estado]}
      </Text>
    </Space>
  );
}
