import { Alert, DatePicker, Input, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  LEYENDA_AUTOGUARDADO,
  useAutoguardadoMetadata,
} from '@/shared/legalCases/useAutoguardadoMetadata';
import { useReplaceCaseParties } from '@/shared/legalCases/api';
import { FichaParte } from '@/shared/partes/FichaParte';
import { Bloque } from '@/shared/ui/Bloque';
import { Campo } from '@/shared/ui/Campo';
import { ESPACIO, TEXTO } from '@/theme/escala';
import { ExtraerDeDocumentos } from '@/shared/expediente/ExtraerDeDocumentos';
import {
  aCasePartiesQueja,
  faltantesParaDecision,
  fusionarComparendo,
  fusionarExtraidasQueja,
  leerPartesQueja,
  type PartesQueja,
} from './partesQueja';

const { Text } = Typography;

export interface PartesQuejaFormProps {
  caseId: string;
  caseMetadataRaw?: string | null;
  /** El expediente se acaba de abrir soltando documentos: se leen sin pedirlo. */
  autoExtraer?: boolean;
  /** El expediente está FINALIZADO: no hay nada que consultar aquí aparte de los datos ya guardados. */
  readOnly?: boolean;
}

/**
 * Los datos del comparendo impugnado. Se autoguarda en `caseMetadata.partes`
 * y se proyecta a `case_parties`, igual que la ficha de la querella.
 */
export function PartesQuejaForm({
  caseId,
  caseMetadataRaw,
  autoExtraer,
  readOnly = false,
}: PartesQuejaFormProps) {
  const reemplazarPartes = useReplaceCaseParties();
  const {
    valor: partes,
    setValor: setPartes,
    estado,
  } = useAutoguardadoMetadata<PartesQueja>({
    caseId,
    caseMetadataRaw,
    clave: 'partes',
    leer: leerPartesQueja,
    alGuardar: (v) => reemplazarPartes.mutate({ id: caseId, parties: aCasePartiesQueja(v) }),
  });

  const faltantes = faltantesParaDecision(partes);

  return (
    // Este paso es solo formulario -- sin acciones de consulta propias -- así
    // que un <fieldset disabled> basta para bloquear la mutación sin tocar
    // cada campo. Ver shared/expediente/tipos.ts sobre por qué no hay bloqueo global.
    <fieldset disabled={readOnly} style={{ border: 'none', margin: 0, padding: 0 }}>
    <Space direction="vertical" size={ESPACIO.md} style={{ width: '100%' }}>
      <ExtraerDeDocumentos
        caseId={caseId}
        auto={autoExtraer}
        onExtraido={({ partes: extraidas, comparendo }) =>
          setPartes(fusionarComparendo(fusionarExtraidasQueja(partes, extraidas), comparendo))
        }
      />

      <Alert
        type="info"
        showIcon
        message="La queja tiene un solo sujeto procesal: el presunto infractor"
        description="Es el expediente del comparendo impugnado y el trámite es oficioso, a diferencia de la querella, que requiere impulso de parte y tiene querellante y querellado (art. 2.2.8.18.3.3 del Decreto 768 de 2025). La autoridad que impuso el comparendo se registra abajo, no como contraparte."
      />

      <FichaParte
        titulo="Presunto infractor"
        ayuda="Quien recibió el comparendo y lo objetó dentro de los tres días hábiles siguientes."
        parte={partes.infractor}
        onChange={(infractor) => setPartes({ ...partes, infractor })}
      />

      <Bloque titulo="Comparendo impugnado" style={{ display: 'grid', gap: ESPACIO.md }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: ESPACIO.md }}>
          <Campo label="Número del comparendo">
            <Input
              value={partes.numeroComparendo}
              onChange={(e) => setPartes({ ...partes, numeroComparendo: e.target.value })}
            />
          </Campo>
          <Campo
            label="Fecha de la objeción"
            nota="De aquí cuelga el término del art. 223A de la Ley 1801."
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={partes.fechaObjecion ? dayjs(partes.fechaObjecion) : null}
              onChange={(d) =>
                setPartes({ ...partes, fechaObjecion: d ? d.toISOString() : '' })
              }
            />
          </Campo>
        </div>

        <Campo
          label="Artículo y numeral (Ley 1801 de 2016)"
          nota="El comportamiento contrario a la convivencia que se le imputa."
        >
          <Input
            value={partes.articuloNumeral}
            onChange={(e) => setPartes({ ...partes, articuloNumeral: e.target.value })}
            placeholder="Art. 27, num. 1"
          />
        </Campo>

        <Campo
          label="Autoridad que impuso el comparendo"
          nota="Uniformado o dependencia. No es parte del proceso: se identifica para el trámite."
        >
          <Input
            value={partes.autoridadImpone}
            onChange={(e) => setPartes({ ...partes, autoridadImpone: e.target.value })}
          />
        </Campo>
      </Bloque>

      {faltantes.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Faltan datos para que la decisión identifique el comparendo y a quien lo objetó"
          description={faltantes.join(' · ')}
        />
      )}

      <Text type={estado === 'error' ? 'danger' : 'secondary'} style={{ fontSize: TEXTO.nota }}>
        {LEYENDA_AUTOGUARDADO[estado]}
      </Text>
    </Space>
    </fieldset>
  );
}
