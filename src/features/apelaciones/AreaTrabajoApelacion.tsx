import { useMemo } from 'react';
import { App, Alert, Button, DatePicker, Input, Segmented, Select, Space, Switch, Typography } from 'antd';
import { DownloadOutlined, FileWordOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  LEYENDA_AUTOGUARDADO,
  useAutoguardadoMetadata,
} from '@/shared/legalCases/useAutoguardadoMetadata';
import { descargarDocumentoLegalPdf } from '@/shared/documentos/documentoLegalPdf';
import { descargarDocumentoLegalDocx } from '@/shared/documentos/documentoLegalDocx';
import { VistaPreviaActa } from '@/shared/documentos/VistaPreviaActa';
import { sumarDiasHabiles } from '@/shared/terminos/diasHabiles';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { generarAutoApelacion } from './autoConcedeApelacion';
import {
  CALIDADES,
  controlOportunidad,
  DIAS_PARA_REMITIR,
  DIAS_SUPERIOR_RESUELVE,
  faltantesParaAuto,
  leerRecurso,
  VIAS,
  type RecursoApelacion,
} from './recursoApelacion';
import { Campo } from '@/shared/ui/Campo';
import { Bloque } from '@/shared/ui/Bloque';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;
const { TextArea } = Input;

export interface AreaTrabajoApelacionProps {
  caseId: string;
  radicado: string;
  comportamiento: string;
  caseMetadataRaw?: string | null;
}

/**
 * Área de trabajo del recurso de apelación. Lo que el despacho hace aquí es
 * verificar la oportunidad, conceder en el efecto devolutivo y remitir — no
 * resolver el recurso, que es del superior jerárquico.
 */
export function AreaTrabajoApelacion({
  caseId,
  radicado,
  comportamiento,
  caseMetadataRaw,
}: AreaTrabajoApelacionProps) {
  const { message } = App.useApp();
  const inspeccion = useInspeccionStore((s) => s.config);

  const {
    valor: recurso,
    setValor: setRecurso,
    estado,
  } = useAutoguardadoMetadata<RecursoApelacion>({
    caseId,
    caseMetadataRaw,
    clave: 'recursoApelacion',
    leer: leerRecurso,
  });

  const set = <K extends keyof RecursoApelacion>(k: K, v: RecursoApelacion[K]) =>
    setRecurso({ ...recurso, [k]: v });

  const control = controlOportunidad(recurso);
  const faltantes = faltantesParaAuto(recurso);

  const auto = useMemo(
    () =>
      faltantes.length === 0
        ? generarAutoApelacion({
            municipio: inspeccion.municipio,
            inspeccion: inspeccion.inspeccion,
            inspectorNombre: inspeccion.inspectorNombre,
            inspectorCargo: 'Inspector de Convivencia y Paz',
            radicado,
            comportamiento,
            recurso,
          })
        : null,
    [faltantes.length, inspeccion, radicado, comportamiento, recurso],
  );

  const fechaLimiteRemision =
    control.procedente && recurso.fechaConcesion
      ? sumarDiasHabiles(dayjs(recurso.fechaConcesion), DIAS_PARA_REMITIR)
      : null;

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="Este despacho concede la apelación; no la resuelve"
        description={`La resuelve el superior jerárquico —el alcalde cuando el municipio no tiene autoridad especial de Policía (Ley 1801, arts. 205.8 y 205.14)—. Aquí se verifica la oportunidad, se concede en el efecto devolutivo y se remite la actuación. El superior decide dentro de los ${DIAS_SUPERIOR_RESUELVE} días siguientes al recibo.`}
      />

      <Bloque>
        <Text strong style={{ display: 'block', fontSize: TEXTO.titulo, marginBottom: 4 }}>
          Cómo se interpuso el recurso
        </Text>
        <Text type="secondary" style={{ display: 'block', fontSize: TEXTO.menor, marginBottom: 12 }}>
          La apelación suele venir en subsidio de la reposición, que se resuelve de inmediato en la
          audiencia (art. 223 num. 4).
        </Text>
        <Segmented
          block
          value={recurso.via}
          onChange={(v) => set('via', v as RecursoApelacion['via'])}
          options={VIAS.map((v) => ({ value: v.valor, label: v.label }))}
        />
        <Text type="secondary" style={{ display: 'block', fontSize: TEXTO.menor, marginTop: 8 }}>
          {VIAS.find((v) => v.valor === recurso.via)?.ayuda}
        </Text>
      </Bloque>

      <Bloque>
        <Text strong style={{ display: 'block', fontSize: TEXTO.titulo, marginBottom: 14 }}>
          Quién apela
        </Text>
        <div style={{ display: 'grid', gap: 12 }}>
          <Campo label="Nombre completo">
            <Input
              value={recurso.recurrenteNombre}
              onChange={(e) => set('recurrenteNombre', e.target.value)}
            />
          </Campo>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Campo label="Identificación">
              <Input
                value={recurso.recurrenteIdentificacion}
                onChange={(e) => set('recurrenteIdentificacion', e.target.value)}
                placeholder="CC 00.000.000"
              />
            </Campo>
            <Campo label="Calidad en que actúa">
              <Select
                style={{ width: '100%' }}
                value={recurso.calidad}
                onChange={(v) => set('calidad', v)}
                options={CALIDADES.map((c) => ({ value: c.valor, label: c.label }))}
              />
            </Campo>
          </div>
        </div>
      </Bloque>

      <Bloque>
        <Text strong style={{ display: 'block', fontSize: TEXTO.titulo, marginBottom: 4 }}>
          Oportunidad
        </Text>
        <Text type="secondary" style={{ display: 'block', fontSize: TEXTO.menor, marginBottom: 14 }}>
          El único control de fondo que le toca al despacho. El recurso se solicita, concede y
          sustenta dentro de la misma audiencia; la ley no abre plazo posterior.
        </Text>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <Campo label="Fecha de la audiencia">
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={recurso.fechaAudiencia ? dayjs(recurso.fechaAudiencia) : null}
              onChange={(d) => set('fechaAudiencia', d ? d.format('YYYY-MM-DD') : '')}
            />
          </Campo>
          <Campo label="Fecha del auto">
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={recurso.fechaConcesion ? dayjs(recurso.fechaConcesion) : null}
              onChange={(d) => set('fechaConcesion', d ? d.format('YYYY-MM-DD') : '')}
            />
          </Campo>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Switch
            checked={recurso.enLaMismaAudiencia}
            onChange={(v) => set('enLaMismaAudiencia', v)}
          />
          <Text>Se interpuso y sustentó dentro de la misma audiencia</Text>
        </div>

        <Alert
          type={control.procedente ? 'success' : 'error'}
          showIcon
          style={{ borderRadius: 14 }}
          message={control.procedente ? 'Recurso oportuno' : 'Recurso extemporáneo'}
          description={control.motivo}
        />
      </Bloque>

      <Bloque>
        <Text strong style={{ display: 'block', fontSize: TEXTO.titulo, marginBottom: 14 }}>
          Qué se apela y ante quién
        </Text>
        <div style={{ display: 'grid', gap: 12 }}>
          <Campo label="Decisión apelada">
            <Input
              value={recurso.decisionApelada}
              onChange={(e) => set('decisionApelada', e.target.value)}
              placeholder="Multa tipo 2 por el comportamiento del art. …"
            />
          </Campo>
          <Campo label="Sustentación expuesta en la audiencia">
            <TextArea
              autoSize={{ minRows: 2, maxRows: 6 }}
              value={recurso.sustentacion}
              onChange={(e) => set('sustentacion', e.target.value)}
            />
          </Campo>
          <Campo label="Superior jerárquico al que se remite">
            <Input
              value={recurso.superior}
              onChange={(e) => set('superior', e.target.value)}
              placeholder="Alcaldía Municipal, o la autoridad especial de Policía si existe"
            />
          </Campo>
        </div>

        {fechaLimiteRemision && (
          <Alert
            type="warning"
            showIcon
            style={{ borderRadius: 14, marginTop: 14 }}
            message={`Remitir la actuación a más tardar el ${fechaLimiteRemision.format('D [de] MMMM, YYYY')}`}
            description={`Son ${DIAS_PARA_REMITIR} días hábiles desde el auto (art. 223 num. 4). Cálculo sujeto a validación jurídica.`}
          />
        )}
      </Bloque>

      {faltantes.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ borderRadius: 14 }}
          message="Faltan datos para generar el auto"
          description={faltantes.join(' · ')}
        />
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          disabled={!auto}
          onClick={() => auto && void descargarDocumentoLegalPdf(auto, inspeccion.membreteDataUrl)}
        >
          Descargar auto en PDF
        </Button>
        <Button
          icon={<FileWordOutlined />}
          disabled={!auto}
          onClick={() =>
            auto &&
            void descargarDocumentoLegalDocx(auto, inspeccion.membreteDataUrl).then(() =>
              message.success('Auto descargado en Word.'),
            )
          }
        >
          Descargar .docx
        </Button>
        <Text type={estado === 'error' ? 'danger' : 'secondary'} style={{ fontSize: TEXTO.menor }}>
          {LEYENDA_AUTOGUARDADO[estado]}
        </Text>
      </div>

      {auto && <VistaPreviaActa acta={auto} membreteDataUrl={inspeccion.membreteDataUrl} />}
    </Space>
  );
}
