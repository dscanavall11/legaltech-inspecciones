import { useState } from 'react';
import { Alert, Button, Modal, Progress, Space, Table, Tag, Typography } from 'antd';
import { FileZipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Comparendo } from '@/features/actas/comparendos';
import {
  descargarZipActasMasivas,
  generarActasMasivas,
  type ResultadoFilaMasiva,
  type ResumenGeneracionMasiva,
} from './generacionMasivaActasDocx';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;

/**
 * "Generar actas seleccionadas" — modo masivo. Reutiliza exactamente la
 * misma cadena de la generación individual (validación, detección de
 * género, catálogo de plantillas, MERGEFIELD + reparo de texto fijo) fila
 * por fila; la única lógica nueva es la orquestación del lote y el
 * empaquetado en .zip.
 *
 * Solo se procesan filas con `Incidente = FIRMEZA` — el resto (PRONTO PAGO,
 * NO ESTA - REVISAR, NO CERRAR, vacío, cualquier otro estado) se excluye de
 * inmediato, sin tratarlo como un error jurídico y sin que entre al .zip. La
 * reincidencia sale de la columna oficial "Reincidencia" — nunca de
 * "REINCIDENTE" ni de texto libre.
 */
export function GeneracionMasivaActasButton({
  seleccionados,
  todos,
}: {
  seleccionados: Comparendo[];
  /** Base activa completa — para "Generar todas las actas de firmeza", que no depende de la selección por checkbox. */
  todos: Comparendo[];
}) {
  const [procesando, setProcesando] = useState<'seleccion' | 'todas' | null>(null);
  const [progreso, setProgreso] = useState<{ actual: number; total: number } | null>(null);
  const [resumen, setResumen] = useState<ResumenGeneracionMasiva | null>(null);
  const [modoResumen, setModoResumen] = useState<'seleccion' | 'todas' | null>(null);
  const [descargando, setDescargando] = useState(false);

  async function generar(registros: Comparendo[], boton: 'seleccion' | 'todas') {
    setProcesando(boton);
    setProgreso({ actual: 0, total: registros.length });
    try {
      const fechaResolucion = dayjs().format('YYYY-MM-DD');
      const resultado = await generarActasMasivas(registros, fechaResolucion, (actual, total) =>
        setProgreso({ actual, total }),
      );
      setResumen(resultado);
      setModoResumen(boton);
    } finally {
      setProcesando(null);
      setProgreso(null);
    }
  }

  async function descargarZip() {
    if (!resumen) return;
    setDescargando(true);
    try {
      await descargarZipActasMasivas(resumen.resultados, dayjs().format('YYYY-MM-DD'));
      // Libera de inmediato la tabla de comparendos (el modal, al quedar abierto,
      // bloqueaba la selección de nuevas filas con su overlay) — sin esto el
      // inspector debía recordar cerrar el modal a mano antes de poder generar
      // un segundo lote.
      setResumen(null);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <>
      <Space wrap>
        <Button
          icon={<FileZipOutlined />}
          disabled={seleccionados.length === 0 || procesando !== null}
          loading={procesando === 'seleccion'}
          onClick={() => void generar(seleccionados, 'seleccion')}
        >
          Generar actas seleccionadas {seleccionados.length > 0 ? `(${seleccionados.length})` : ''}
        </Button>
        <Button
          icon={<FileZipOutlined />}
          disabled={todos.length === 0 || procesando !== null}
          loading={procesando === 'todas'}
          onClick={() => void generar(todos, 'todas')}
        >
          Generar todas las actas de firmeza
        </Button>
      </Space>

      {/* Progreso dinámico durante el lote (nunca un total fijo: sale del tamaño
          real del lote que se está procesando en ese momento). */}
      <Modal
        title="Generando actas de firmeza…"
        open={procesando !== null}
        closable={false}
        maskClosable={false}
        footer={null}
        transitionName=""
        maskTransitionName=""
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress
            percent={progreso && progreso.total > 0 ? Math.round((progreso.actual / progreso.total) * 100) : 0}
            status="active"
          />
          <Text type="secondary">
            {progreso ? `Procesando ${progreso.actual} de ${progreso.total}` : 'Procesando…'}
          </Text>
        </Space>
      </Modal>

      {/* Sin animación de entrada/salida: con transición, la máscara del modal
          sigue interceptando clics durante los ~300ms de la animación de
          cierre — si el inspector selecciona una fila nueva justo en ese
          instante, el clic se pierde y parece que "quedó bloqueado". */}
      <Modal
        title="Generación masiva de Actas de Firmeza"
        open={!!resumen}
        onCancel={() => setResumen(null)}
        width={760}
        transitionName=""
        maskTransitionName=""
        footer={
          <Space>
            <Button onClick={() => setResumen(null)}>Cerrar</Button>
            <Button
              type="primary"
              icon={<FileZipOutlined />}
              loading={descargando}
              disabled={!resumen || resumen.resultados.every((r) => !r.archivo)}
              onClick={() => void descargarZip()}
            >
              Descargar ZIP
            </Button>
          </Space>
        }
      >
        {resumen && (
          <Space direction="vertical" style={{ width: '100%' }} size={14}>
            <Alert
              type={
                resumen.generados + resumen.conObservaciones === resumen.totalEnBase
                  ? 'success'
                  : resumen.excluidosPorEstado > 0
                    ? 'info'
                    : 'warning'
              }
              showIcon
              message={
                `${modoResumen === 'seleccion' ? 'Esperadas (seleccionadas)' : 'Disponibles en la base activa'}: ` +
                `${resumen.totalEnBase}  ·  Generadas: ${resumen.generados + resumen.conObservaciones}  ·  ` +
                `Fallidas o excluidas: ${resumen.excluidosPorEstado + resumen.noGenerados}`
              }
            />
            <Space size={10} wrap>
              <Tag style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                {modoResumen === 'seleccion' ? 'Seleccionadas' : 'Total en base'}: {resumen.totalEnBase}
              </Tag>
              <Tag color="blue" style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                Candidatos FIRMEZA: {resumen.candidatosFirmeza}
              </Tag>
              <Tag style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                Excluidos por estado: {resumen.excluidosPorEstado}
              </Tag>
            </Space>
            <Space size={10} wrap>
              <Tag color="success" style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                Generados correctamente: {resumen.generados}
              </Tag>
              {resumen.conObservaciones > 0 && (
                <Tag color="warning" style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                  Con observaciones: {resumen.conObservaciones}
                </Tag>
              )}
              {resumen.noGenerados > 0 && (
                <Tag color="error" style={{ fontSize: TEXTO.base, padding: '4px 10px' }}>
                  No generados: {resumen.noGenerados}
                </Tag>
              )}
            </Space>

            {resumen.excluidosPorEstado > 0 && (
              <Alert
                type="info"
                showIcon
                message={`${resumen.excluidosPorEstado} registro(s) excluido(s) por no estar marcados como FIRMEZA`}
                description="No es un error jurídico: son registros en otro estado procesal (pronto pago, no está - revisar, no cerrar, u otro) que no corresponde firmar en este lote."
              />
            )}
            {resumen.noGenerados > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Ningún candidato FIRMEZA sin generar entró al .zip"
                description="Revise el motivo exacto de cada uno abajo; corríjalo en la BD o gestiónelo por la generación individual."
              />
            )}

            <Table<ResultadoFilaMasiva>
              size="small"
              rowKey={(r) => r.comparendo}
              pagination={false}
              dataSource={resumen.resultados}
              columns={[
                { title: 'Queja', dataIndex: 'proceso', key: 'proceso', width: 110 },
                { title: 'Infractor', dataIndex: 'solicitado', key: 'solicitado', ellipsis: true },
                {
                  title: 'Resultado',
                  key: 'estado',
                  width: 380,
                  render: (_: unknown, r: ResultadoFilaMasiva) =>
                    r.estado === 'generado' ? (
                      <Tag color="success">GENERADO — {r.motivo}</Tag>
                    ) : r.estado === 'con_observaciones' ? (
                      <Tag color="warning">GENERADO (con observaciones) — {r.motivo}</Tag>
                    ) : r.estado === 'excluido_estado' ? (
                      <Tag>{r.motivo}</Tag>
                    ) : (
                      <Tag color="error">NO GENERADO — {r.motivo}</Tag>
                    ),
                },
              ]}
            />
            <Text type="secondary" style={{ fontSize: TEXTO.menor }}>
              Ejemplo: "2026-13490 — GENERADO — SIN REINCIDENCIA" / "2026-13503 — NO GENERADO — ESTADO DISTINTO DE FIRMEZA".
            </Text>
          </Space>
        )}
      </Modal>
    </>
  );
}
