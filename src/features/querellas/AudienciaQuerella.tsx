import { useMemo, useState } from 'react';
import { App, Alert, Button, DatePicker, Input, Segmented, Space, TimePicker, Typography } from 'antd';
import { DownloadOutlined, FileWordOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAutoguardadoMetadata } from '@/shared/legalCases/useAutoguardadoMetadata';
import { descargarDocumentoLegalPdf } from '@/shared/documentos/documentoLegalPdf';
import { descargarDocumentoLegalDocx } from '@/shared/documentos/documentoLegalDocx';
import { VistaPreviaActa } from '@/shared/documentos/VistaPreviaActa';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { PALETA } from '@/theme/theme';
import { generarAutoSuspension } from './autoSuspension';
import { leerDecision, SENTIDOS, VARIANTES, type DecisionQuerella } from './decisionQuerella';
import { leerPartes } from './partes';

const { Text } = Typography;
const { TextArea } = Input;

function Bloque({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: PALETA.superficie,
        border: `1px solid ${PALETA.borde}`,
        borderRadius: 16,
        padding: '18px 20px',
      }}
    >
      {children}
    </div>
  );
}

export interface AudienciaQuerellaProps {
  caseId: string;
  radicado: string;
  comportamiento: string;
  caseMetadataRaw?: string | null;
}

/**
 * Cómo transcurre la audiencia de la querella: si se decide en una sola
 * diligencia o se suspende para practicar pruebas, y en qué sentido se
 * resuelve. Los dos datos alimentan el fallo (el trámite y la decisión), y de
 * aquí sale el auto que suspende cuando corresponde.
 */
export function AudienciaQuerella({
  caseId,
  radicado,
  comportamiento,
  caseMetadataRaw,
}: AudienciaQuerellaProps) {
  const { message } = App.useApp();
  const inspeccion = useInspeccionStore((s) => s.config);
  const partes = useMemo(() => leerPartes(caseMetadataRaw), [caseMetadataRaw]);

  const { valor: decision, setValor: setDecision } = useAutoguardadoMetadata<DecisionQuerella>({
    caseId,
    caseMetadataRaw,
    clave: 'decisionQuerella',
    leer: leerDecision,
  });

  // Datos del auto: pertenecen a la diligencia del día, no al expediente. El
  // documento generado sí queda archivado.
  const [pruebas, setPruebas] = useState('');
  const [motivacion, setMotivacion] = useState('');
  const [horaReanudacion, setHoraReanudacion] = useState('08:00');

  const set = <K extends keyof DecisionQuerella>(k: K, v: DecisionQuerella[K]) =>
    setDecision({ ...decision, [k]: v });

  const listoParaAuto =
    decision.fechaAudienciaInicial.trim().length > 0 &&
    decision.fechaReanudacion.trim().length > 0 &&
    pruebas.trim().length > 0;

  const auto = useMemo(
    () =>
      listoParaAuto
        ? generarAutoSuspension({
            municipio: inspeccion.municipio,
            inspeccion: inspeccion.inspeccion,
            inspectorNombre: inspeccion.inspectorNombre,
            inspectorCargo: 'Inspector de Convivencia y Paz',
            radicado,
            fechaAudiencia: decision.fechaAudienciaInicial,
            fechaReanudacion: decision.fechaReanudacion,
            horaReanudacion,
            partes,
            comportamiento,
            pruebasDecretadas: pruebas.split('\n'),
            motivacion,
          })
        : null,
    [listoParaAuto, inspeccion, radicado, decision, horaReanudacion, partes, comportamiento, pruebas, motivacion],
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Bloque>
        <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>
          Cómo transcurrió la audiencia
        </Text>
        <Text type="secondary" style={{ display: 'block', fontSize: 12.5, marginBottom: 12 }}>
          Cambia el relato del trámite en el fallo (aparte 3 del art. 2.2.8.18.7.1). El resto del
          documento es igual en los dos casos.
        </Text>
        <Segmented
          block
          value={decision.variante}
          onChange={(v) => set('variante', v as DecisionQuerella['variante'])}
          options={VARIANTES.map((v) => ({ value: v.valor, label: v.label }))}
        />
        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
          {VARIANTES.find((v) => v.valor === decision.variante)?.ayuda}
        </Text>
      </Bloque>

      <Bloque>
        <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>
          Sentido de la decisión
        </Text>
        <Text type="secondary" style={{ display: 'block', fontSize: 12.5, marginBottom: 12 }}>
          Son tres, no dos: declarar la responsabilidad y aun así abstenerse de la multa es una
          decisión distinta de absolver.
        </Text>
        <Segmented
          block
          value={decision.sentido}
          onChange={(v) => set('sentido', v as DecisionQuerella['sentido'])}
          options={SENTIDOS.map((s) => ({ value: s.valor, label: s.label }))}
        />
        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
          {SENTIDOS.find((s) => s.valor === decision.sentido)?.ayuda}
        </Text>
      </Bloque>

      {decision.variante === 'continuacion' && (
        <Bloque>
          <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>
            Auto que decreta pruebas y suspende la audiencia
          </Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12.5, marginBottom: 14 }}>
            Art. 223 num. 3 lit. c: las pruebas se practican en máximo cinco (5) días y la audiencia
            se reanuda al día siguiente del vencimiento. Este auto no decide el fondo.
          </Text>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 5 }}>
                Fecha de la audiencia
              </div>
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                value={decision.fechaAudienciaInicial ? dayjs(decision.fechaAudienciaInicial) : null}
                onChange={(d) => set('fechaAudienciaInicial', d ? d.format('YYYY-MM-DD') : '')}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 5 }}>
                Reanudación
              </div>
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                value={decision.fechaReanudacion ? dayjs(decision.fechaReanudacion) : null}
                onChange={(d) => set('fechaReanudacion', d ? d.format('YYYY-MM-DD') : '')}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 5 }}>Hora</div>
              <TimePicker
                style={{ width: '100%' }}
                format="HH:mm"
                value={dayjs(horaReanudacion, 'HH:mm')}
                onChange={(h) => h && setHoraReanudacion(h.format('HH:mm'))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 5 }}>
              Pruebas decretadas — una por línea
            </div>
            <TextArea
              autoSize={{ minRows: 3, maxRows: 8 }}
              value={pruebas}
              onChange={(e) => setPruebas(e.target.value)}
              placeholder={'Declaración de…\nInspección ocular al inmueble…\nCertificado de tradición…'}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 5 }}>
              Por qué son conducentes, pertinentes y útiles
            </div>
            <TextArea
              autoSize={{ minRows: 2, maxRows: 6 }}
              value={motivacion}
              onChange={(e) => setMotivacion(e.target.value)}
            />
          </div>

          {!listoParaAuto && (
            <Alert
              type="info"
              showIcon
              style={{ borderRadius: 14, marginBottom: 12 }}
              message="Complete las fechas y al menos una prueba para generar el auto"
            />
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          </div>
        </Bloque>
      )}

      {auto && <VistaPreviaActa acta={auto} membreteDataUrl={inspeccion.membreteDataUrl} />}
    </Space>
  );
}
