import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, App, Button, Empty, Select, Skeleton, Tag, Typography } from 'antd';
import { CheckCircleOutlined, LeftOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { FolderPlus } from 'lucide-react';
import { useProcesos } from '@/shared/procesos/api';
import { ESTADO_COLOR, ESTADO_LABEL } from '@/shared/procesos/types';
import { useCreateLegalCase, useFinalizeCase, useLegalCase } from '@/shared/legalCases/api';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { ELEVACION, PALETA } from '@/theme/theme';
import { ESPACIO, RADIO, RELLENO, TEXTO } from '@/theme/escala';
import { RielPasos } from './RielPasos';
import type { PasoExpediente, TextosExpediente } from './tipos';

const { Text } = Typography;

export interface AreaTrabajoExpedienteProps {
  caseType: string;
  className: string;
  textos: TextosExpediente;
  /**
   * Los pasos del trámite. Es una función porque el último —el proyecto de
   * decisión— necesita saber si el expediente se acaba de abrir soltando
   * documentos: solo entonces se analiza sin que nadie lo pida. Uno ya
   * radicado que se abre para revisarlo no dispara una llamada de IA sola.
   */
  pasos: (contexto: { recienDeDocumentos: boolean }) => readonly PasoExpediente[];
}

/**
 * Área de trabajo de un expediente: el riel de pasos a la izquierda y UN paso
 * a la vez a la derecha.
 *
 * El recorrido antes se pintaba entero, cinco tarjetas a ancho completo una
 * debajo de otra. Con eso el inspector tenía delante el expediente completo
 * para hacer una sola cosa, y ninguna de las cinco tenía más peso que las
 * otras. Aquí el índice vive en el tercio izquierdo, el trabajo ocupa los dos
 * tercios restantes y solo se ve el paso en el que se está.
 *
 * No sabe de querellas ni de quejas: los dos trámites le pasan sus propios
 * pasos y sus propios textos (ver ./tipos.ts).
 */
export function AreaTrabajoExpediente({
  caseType,
  className,
  textos,
  pasos: construirPasos,
}: AreaTrabajoExpedienteProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const casoId = searchParams.get('caso') ?? '';

  const { message, modal } = App.useApp();
  const inspeccion = useInspeccionStore((s) => s.config);
  const crearCaso = useCreateLegalCase();
  const finalizarCaso = useFinalizeCase();
  const [creando, setCreando] = useState(false);

  // El expediente ya no se crea al soltar el primer documento: "Nueva querella"
  // crea el caso de una vez y navega a el, asi que nunca hay un momento con
  // trabajo "recien hecho" que auto-dispare un analisis de IA sobre un caso vacio.
  const pasos = useMemo(() => construirPasos({ recienDeDocumentos: false }), [construirPasos]);
  const activo = Math.min(Math.max(Number(searchParams.get('paso') ?? 0), 0), pasos.length - 1);

  const { data: expedientes, isLoading: cargandoLista } = useProcesos({ caseType });
  const { data: caso, isLoading: cargandoCaso } = useLegalCase(casoId);
  const soloLectura = caso?.status === 'FINALIZADO';

  const opciones = useMemo(
    () =>
      (expedientes ?? []).map((e) => ({
        value: e.id,
        label: `${e.radicado} — ${e.parteA} c/ ${e.parteB}`,
      })),
    [expedientes],
  );

  const ir = (id: string, paso = 0) => {
    setSearchParams(id ? { caso: id, paso: String(paso) } : {}, { replace: true });
  };

  const elegir = (id: string) => ir(id);

  /**
   * "Nueva querella" crea el expediente real de una vez, antes de que exista
   * ningún documento -- no espera a que se suelte el primer archivo. Así nunca
   * hay un expediente "a medio hacer" viviendo solo en el navegador: desde el
   * primer clic todo (documentos, hechos, pruebas) cuelga de un caseId real y
   * persistido. El radicado y el fallo se completan después, cuando existan.
   */
  const crearNueva = async () => {
    setCreando(true);
    try {
      const nuevo = await crearCaso.mutateAsync({
        caseType,
        className,
        judicialOfficeId: inspeccion.inspeccion || 'Inspección de Convivencia y Paz',
        venueCity: inspeccion.municipio || '',
      });
      ir(nuevo.id);
    } catch (e) {
      message.error(
        `No se pudo abrir el expediente: ${e instanceof Error ? e.message : 'error inesperado'}.`,
      );
    } finally {
      setCreando(false);
    }
  };

  const finalizar = () => {
    if (!casoId) return;
    modal.confirm({
      title: 'Finalizar proceso',
      content:
        'El expediente queda en solo lectura y disponible en Mis procesos. No se puede deshacer desde aquí.',
      okText: 'Finalizar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () =>
        finalizarCaso.mutateAsync(
          { id: casoId },
          {
            onError: (e) =>
              message.error(
                `No se pudo finalizar: ${e instanceof Error ? e.message : 'error del servidor'}.`,
              ),
          },
        ),
    });
  };

  const paso = pasos[activo];

  return (
    <div style={{ display: 'grid', gap: ESPACIO.lg, gridTemplateColumns: 'minmax(0, 1fr)' }}>
      <Cabecera
        textos={textos}
        caso={caso}
        opciones={opciones}
        cargandoLista={cargandoLista}
        casoId={casoId}
        onElegir={elegir}
        onFinalizar={finalizar}
        finalizando={finalizarCaso.isPending}
      />

      <div
        className="area-trabajo"
        style={{
          display: 'grid',
          gap: ESPACIO.lg,
          gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)',
          alignItems: 'start',
        }}
      >
        <aside style={{ position: 'sticky', top: ESPACIO.lg }}>
          <RielPasos pasos={pasos} activo={activo} caso={caso} onElegir={(i) => ir(casoId, i)} />
        </aside>

        <section
          style={{
            background: PALETA.superficie,
            border: `1px solid ${PALETA.borde}`,
            borderRadius: RADIO.tarjeta,
            boxShadow: ELEVACION.base,
            padding: RELLENO.tarjeta,
            minHeight: 320,
          }}
        >
          {!casoId ? (
            <Arranque
              textos={textos}
              opciones={opciones}
              cargandoLista={cargandoLista}
              casoId={casoId}
              creando={creando}
              onElegir={elegir}
              onNuevaQuerella={crearNueva}
            />
          ) : cargandoCaso ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : !caso ? (
            <Alert
              type="error"
              showIcon
              message="No se pudo cargar el expediente"
              description="Verifique la conexión e intente de nuevo."
            />
          ) : (
            // key={casoId}: fuerza el remount de todo el paso al cambiar de expediente
            // (o crear uno nuevo) -- ningun useState local de un paso sobrevive al cambio.
            <div key={casoId}>
              <header style={{ marginBottom: ESPACIO.lg }}>
                <Text strong style={{ fontSize: TEXTO.seccion, display: 'block' }}>
                  {paso.titulo}
                </Text>
                <Text type="secondary" style={{ fontSize: TEXTO.menor }}>
                  {paso.ayuda}
                </Text>
              </header>

              {soloLectura && (
                <Alert
                  type="warning"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  message="Expediente finalizado — solo lectura"
                  description="Puede seguir consultando, viendo y descargando todo lo del expediente. legalcase rechaza cualquier intento de modificarlo (409)."
                  style={{ marginBottom: ESPACIO.md }}
                />
              )}

              {/* Sin bloqueo global: cada paso decide qué deshabilitar via `readOnly`,
                  para no tapar tambien las acciones de consulta (ver, descargar). */}
              {paso.render(caso, { readOnly: soloLectura })}

              <footer
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: ESPACIO.md,
                  marginTop: ESPACIO.xl,
                  paddingTop: ESPACIO.md,
                  borderTop: `1px solid ${PALETA.borde}`,
                }}
              >
                <Button
                  icon={<LeftOutlined />}
                  disabled={activo === 0}
                  onClick={() => ir(casoId, activo - 1)}
                >
                  {activo === 0 ? 'Anterior' : pasos[activo - 1].titulo}
                </Button>
                <Button
                  type="primary"
                  disabled={activo === pasos.length - 1}
                  onClick={() => ir(casoId, activo + 1)}
                >
                  {activo === pasos.length - 1 ? 'Siguiente' : pasos[activo + 1].titulo}{' '}
                  <RightOutlined />
                </Button>
              </footer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Título del trámite a la izquierda; a la derecha, cuál expediente se trabaja.
 *
 * El conmutador vive aquí y no en el riel: con un expediente ya abierto, la
 * zona de arrastre del riel solo servía para crear OTRO caso, y ocupaba la
 * cabecera de la columna donde se consulta el avance del que sí se está
 * trabajando.
 */
function Cabecera({
  textos,
  caso,
  opciones,
  cargandoLista,
  casoId,
  onElegir,
  onFinalizar,
  finalizando,
}: {
  textos: TextosExpediente;
  caso?: { filingNumber: string | null; status: 'ACTIVO' | 'FINALIZADO' };
  opciones: { value: string; label: string }[];
  cargandoLista: boolean;
  casoId: string;
  onElegir: (id: string) => void;
  onFinalizar: () => void;
  finalizando: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: ESPACIO.md,
      }}
    >
      <div style={{ maxWidth: '62ch' }}>
        <Typography.Title level={2} style={{ margin: 0, fontSize: TEXTO.pagina }}>
          {textos.titulo}
        </Typography.Title>
        <Text type="secondary" style={{ fontSize: TEXTO.menor }}>
          {textos.descripcion}
        </Text>
      </div>

      {caso && (
        <div style={{ display: 'flex', gap: ESPACIO.sm, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="font-mono" style={{ fontSize: TEXTO.menor, color: PALETA.textoSuave }}>
            {caso.filingNumber ?? 'Sin radicar'}
          </span>
          <Tag color={ESTADO_COLOR[caso.status] ?? 'blue'} style={{ margin: 0 }}>
            {ESTADO_LABEL[caso.status] ?? caso.status}
          </Tag>
          {caso.status === 'ACTIVO' && (
            <Button size="small" onClick={onFinalizar} loading={finalizando}>
              Finalizar proceso
            </Button>
          )}
          <Select
            showSearch
            allowClear
            size="small"
            style={{ minWidth: 240 }}
            loading={cargandoLista}
            value={casoId || undefined}
            onChange={(v) => onElegir(v ?? '')}
            options={opciones}
            placeholder="Cambiar de expediente"
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
      )}
    </div>
  );
}

/**
 * Las dos entradas al expediente. Ocupa el lienzo entero porque es el único
 * momento en que hace falta: en cuanto hay expediente abierto desaparece y el
 * sitio es para el trabajo. Los documentos van primero por orden de lectura.
 */
function Arranque({
  textos,
  opciones,
  cargandoLista,
  casoId,
  creando,
  onElegir,
  onNuevaQuerella,
}: {
  textos: TextosExpediente;
  opciones: { value: string; label: string }[];
  cargandoLista: boolean;
  casoId: string;
  creando: boolean;
  onElegir: (id: string) => void;
  onNuevaQuerella: () => void;
}) {
  return (
    <div style={{ display: 'grid', gap: ESPACIO.lg, maxWidth: 620, margin: '0 auto' }}>
      <button
        type="button"
        disabled={creando}
        onClick={onNuevaQuerella}
        style={{
          border: `1px dashed ${PALETA.borde}`,
          borderRadius: RADIO.bloque,
          background: 'var(--surface-1)',
          cursor: creando ? 'default' : 'pointer',
          padding: `${ESPACIO.xl}px ${ESPACIO.lg}px`,
          textAlign: 'center',
        }}
      >
        {creando ? (
          <LoadingOutlined style={{ fontSize: 24, color: PALETA.azul }} />
        ) : (
          <FolderPlus size={24} strokeWidth={1.6} color={PALETA.azul} />
        )}
        <div style={{ fontSize: TEXTO.titulo, fontWeight: 500, marginTop: ESPACIO.sm }}>
          {creando ? 'Abriendo el expediente…' : 'Nueva querella'}
        </div>
        <div
          style={{
            fontSize: TEXTO.menor,
            color: PALETA.textoSuave,
            lineHeight: 1.5,
            marginTop: ESPACIO.xs,
          }}
        >
          Abre un expediente nuevo, completamente vacío. {textos.documentosEsperados}
        </div>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: ESPACIO.md }}>
        <span style={{ flex: 1, height: 1, background: PALETA.borde }} />
        <span style={{ fontSize: TEXTO.nota, color: PALETA.textoTenue }}>o uno ya radicado</span>
        <span style={{ flex: 1, height: 1, background: PALETA.borde }} />
      </div>

      <Select
        showSearch
        allowClear
        style={{ width: '100%' }}
        loading={cargandoLista}
        value={casoId || undefined}
        onChange={(v) => onElegir(v ?? '')}
        options={opciones}
        placeholder={textos.buscar}
        filterOption={(input, option) =>
          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        notFoundContent={
          cargandoLista ? <Skeleton active paragraph={false} /> : <Empty description={textos.vacio} />
        }
      />
    </div>
  );
}
