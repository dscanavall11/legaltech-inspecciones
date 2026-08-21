import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, App, Button, Empty, Select, Skeleton, Tag, Typography, Upload } from 'antd';
import { LeftOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { FolderPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/shared/api/client';
import { useProcesos } from '@/shared/procesos/api';
import { ESTADO_COLOR, ESTADO_LABEL } from '@/shared/procesos/types';
import { useCreateLegalCase, useLegalCase } from '@/shared/legalCases/api';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { abreElExpediente } from './seleccionDocumentos';
import {
  ACEPTA_EXPEDIENTE,
  avisoDeRechazo,
  avisoDeTamano,
  separarPorFormato,
} from '@/shared/documentos/formatos';
import { ELEVACION, PALETA } from '@/theme/theme';
import { ESPACIO, RADIO, RELLENO, TEXTO } from '@/theme/escala';
import { CabeceraPagina } from '@/shared/ui/CabeceraPagina';
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

  const { message } = App.useApp();
  const inspeccion = useInspeccionStore((s) => s.config);
  const crearCaso = useCreateLegalCase();
  const [subiendo, setSubiendo] = useState(false);
  const [recienDeDocumentos, marcarRecienDeDocumentos] = useState(false);
  const [rielColapsado, setRielColapsado] = useState(false);

  const pasos = useMemo(
    () => construirPasos({ recienDeDocumentos }),
    [construirPasos, recienDeDocumentos],
  );
  const activo = Math.min(Math.max(Number(searchParams.get('paso') ?? 0), 0), pasos.length - 1);

  const { data: expedientes, isLoading: cargandoLista } = useProcesos({ caseType });
  const { data: caso, isLoading: cargandoCaso } = useLegalCase(casoId);

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

  const elegir = (id: string) => {
    marcarRecienDeDocumentos(false);
    ir(id);
  };

  /**
   * Soltar los documentos ES el primer paso: de un tirón abre el expediente y
   * los sube. El expediente se crea aquí y no al aprobar porque los documentos
   * se guardan colgados de un caso: sin él no hay dónde ponerlos y el trabajo
   * viviría en la memoria del navegador. El radicado lo asigna legalcase.
   */
  const empezarConDocumentos = async (seleccion: File[]) => {
    const { admitidos: archivos, rechazados, pesados } = separarPorFormato(seleccion);
    if (rechazados.length > 0) message.error(avisoDeRechazo(rechazados));
    // El tope se comprueba aqui y no solo en el servidor: alli el rechazo vuelve
    // como un 413 sin cuerpo y el inspector solo ve "no se pudo subir".
    pesados.forEach((a) => message.error(avisoDeTamano(a.name, a.size)));
    if (archivos.length === 0) return;
    setSubiendo(true);
    try {
      const nuevo = await crearCaso.mutateAsync({
        caseType,
        className,
        judicialOfficeId: inspeccion.inspeccion || 'Inspección de Convivencia y Paz',
        venueCity: inspeccion.municipio || '',
      });

      const subidas = await Promise.allSettled(
        archivos.map((archivo) => {
          const body = new FormData();
          body.append('file', archivo, archivo.name);
          return apiFetch(`/tools/expedientes/${nuevo.id}/documents`, { method: 'POST', body });
        }),
      );
      const fallidas = subidas.filter((s) => s.status === 'rejected').length;

      ir(nuevo.id);

      // Solo se analiza si entró algo. Analizar un expediente vacío no falla
      // limpio: el analizador no encuentra nada, los agentes no coinciden y el
      // inspector recibe un "no hubo consenso" que le hace buscar el problema en
      // el caso cuando estaba en la subida.
      marcarRecienDeDocumentos(fallidas < archivos.length);

      if (fallidas === archivos.length) {
        message.error(
          `Expediente ${nuevo.filingNumber} abierto, pero ningún documento se pudo subir. Cárguelos en el paso 1; sin ellos no hay nada que analizar.`,
        );
      } else if (fallidas > 0) {
        message.warning(
          `Expediente ${nuevo.filingNumber} abierto, pero ${fallidas} de ${archivos.length} documentos no se pudieron subir. Vuelva a cargarlos en el paso 1.`,
        );
      } else {
        message.success(
          `Expediente ${nuevo.filingNumber} abierto con ${archivos.length} documento(s). Ya está en Mis procesos.`,
        );
      }
    } catch (e) {
      // El motivo se dice, no se esconde. "No se pudo abrir el expediente" a
      // secas obligaba a leer los logs del contenedor para saber si era el
      // tamaño del archivo, la sesión o un servicio caído.
      message.error(
        `No se pudo abrir el expediente: ${e instanceof Error ? e.message : 'error inesperado'}.`,
      );
    } finally {
      setSubiendo(false);
    }
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
      />

      <div
        className="area-trabajo"
        style={{
          display: 'grid',
          gap: ESPACIO.md,
          gridTemplateColumns: rielColapsado ? '52px minmax(0, 1fr)' : 'minmax(240px, 300px) minmax(0, 1fr)',
          alignItems: 'start',
          transition: 'grid-template-columns 200ms ease',
        }}
      >
        <aside style={{ position: 'sticky', top: ESPACIO.lg }}>
          <button
            type="button"
            onClick={() => setRielColapsado((v) => !v)}
            aria-label={rielColapsado ? 'Expandir pasos' : 'Colapsar pasos'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: PALETA.textoTenue,
              cursor: 'pointer',
              marginBottom: 6,
            }}
          >
            {rielColapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <RielPasos
            pasos={pasos}
            activo={activo}
            caso={caso}
            onElegir={(i) => ir(casoId, i)}
            compacto={rielColapsado}
          />
        </aside>

        <section
          style={{
            background: PALETA.superficie,
            border: `1px solid ${PALETA.borde}`,
            borderRadius: RADIO.tarjeta,
            boxShadow: ELEVACION.base,
            padding: RELLENO.bloque,
            minHeight: 320,
          }}
        >
          {!casoId ? (
            <Arranque
              textos={textos}
              opciones={opciones}
              cargandoLista={cargandoLista}
              casoId={casoId}
              subiendo={subiendo}
              onElegir={elegir}
              onSoltar={empezarConDocumentos}
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
            <>
              <header style={{ marginBottom: ESPACIO.lg }}>
                <Text strong style={{ fontSize: TEXTO.seccion, display: 'block' }}>
                  {paso.titulo}
                </Text>
                <Text type="secondary" style={{ fontSize: TEXTO.menor }}>
                  {paso.ayuda}
                </Text>
              </header>

              {paso.render(caso)}

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
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Título del trámite y, a la derecha, cuál expediente se trabaja.
 *
 * El conmutador vive aquí y no en el riel: con un expediente ya abierto, la
 * zona de arrastre del riel solo servía para crear OTRO caso y ocupaba la
 * cabecera de la columna donde se consulta el avance del que sí se trabaja.
 */
function Cabecera({
  textos,
  caso,
  opciones,
  cargandoLista,
  casoId,
  onElegir,
}: {
  textos: TextosExpediente;
  caso?: { filingNumber: string; currentStateCode: string };
  opciones: { value: string; label: string }[];
  cargandoLista: boolean;
  casoId: string;
  onElegir: (id: string) => void;
}) {
  return (
    <CabeceraPagina
      titulo={textos.titulo}
      descripcion={textos.descripcion}
      acciones={
        caso && (
          <>
            <span className="font-mono" style={{ fontSize: TEXTO.menor, color: PALETA.textoSuave }}>
              {caso.filingNumber}
            </span>
            <Tag color={ESTADO_COLOR[caso.currentStateCode] ?? 'blue'} style={{ margin: 0 }}>
              {ESTADO_LABEL[caso.currentStateCode] ?? caso.currentStateCode}
            </Tag>
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
          </>
        )
      }
    />
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
  subiendo,
  onElegir,
  onSoltar,
}: {
  textos: TextosExpediente;
  opciones: { value: string; label: string }[];
  cargandoLista: boolean;
  casoId: string;
  subiendo: boolean;
  onElegir: (id: string) => void;
  onSoltar: (archivos: File[]) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: ESPACIO.lg, maxWidth: 620, margin: '0 auto' }}>
      <Upload.Dragger
        multiple
        disabled={subiendo}
        showUploadList={false}
        accept={ACEPTA_EXPEDIENTE}
        beforeUpload={(archivo, seleccion) => {
          if (abreElExpediente(archivo, seleccion)) onSoltar(seleccion as File[]);
          return false; // la subida la hacemos nosotros, contra el caso recién creado
        }}
        style={{ borderRadius: RADIO.bloque, background: 'var(--surface-1)' }}
      >
        <div style={{ padding: `${ESPACIO.xl}px ${ESPACIO.lg}px`, textAlign: 'center' }}>
          {subiendo ? (
            <LoadingOutlined style={{ fontSize: 24, color: PALETA.azul }} />
          ) : (
            <FolderPlus size={24} strokeWidth={1.6} color={PALETA.azul} />
          )}
          <div style={{ fontSize: TEXTO.titulo, fontWeight: 500, marginTop: ESPACIO.sm }}>
            {subiendo ? 'Abriendo el expediente…' : 'Empezar desde los documentos'}
          </div>
          <div
            style={{
              fontSize: TEXTO.menor,
              color: PALETA.textoSuave,
              lineHeight: 1.5,
              marginTop: ESPACIO.xs,
            }}
          >
            {textos.documentosEsperados}
            <br />
            Se radica solo, con los documentos dentro, y queda en Mis procesos.
          </div>
        </div>
      </Upload.Dragger>

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
