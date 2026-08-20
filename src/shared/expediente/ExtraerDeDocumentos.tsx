import { useEffect, useRef, useState } from 'react';
import { Alert, App, Button } from 'antd';
import { FileSearchOutlined, LoadingOutlined } from '@ant-design/icons';
import { ESPACIO, TEXTO } from '@/theme/escala';
import { ETIQUETA_FUENTE, extraerDatosDelExpediente, type Extraccion } from './extraccion';

export interface ExtraerDeDocumentosProps {
  caseId: string;
  /**
   * Se ejecuta con lo leído. Quien lo recibe es la ficha del trámite, que sabe
   * a qué casilla va cada rol; este control no sabe de querellantes ni de
   * presuntos infractores.
   */
  onExtraido: (datos: Extraccion) => void;
  /** Corre solo una vez al montar: el expediente se acaba de abrir soltando documentos. */
  auto?: boolean;
}

/**
 * Lee los documentos del expediente y propone los datos del proceso.
 *
 * Es el mismo agente de recepción del chat de radicación, con el mismo
 * protocolo de marcadores: lo único distinto es que aquí el expediente ya
 * existe, así que el agente solo lee y no radica.
 */
export function ExtraerDeDocumentos({ caseId, onExtraido, auto }: ExtraerDeDocumentosProps) {
  const { message } = App.useApp();
  const [extrayendo, setExtrayendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extraer = async () => {
    setExtrayendo(true);
    setError(null);
    try {
      const datos = await extraerDatosDelExpediente(caseId);
      if (datos.partes.length === 0) {
        message.info('El expediente no permitió identificar ninguna parte. Complételas a mano.');
        return;
      }
      onExtraido(datos);
      message.success(
        `Datos tomados de ${ETIQUETA_FUENTE[datos.fuente]}. Coteje contra el documento antes de proferir.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el expediente.');
    } finally {
      setExtrayendo(false);
    }
  };

  // Una sola pasada por montaje: el ref es lo que lo garantiza, porque
  // `extraer` se redefine en cada render.
  const yaCorrio = useRef(false);
  useEffect(() => {
    if (!auto || yaCorrio.current || !caseId) return;
    yaCorrio.current = true;
    void extraer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, caseId]);

  return (
    <div style={{ display: 'grid', gap: ESPACIO.sm }}>
      <div style={{ display: 'flex', gap: ESPACIO.sm, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          icon={extrayendo ? <LoadingOutlined /> : <FileSearchOutlined />}
          onClick={() => void extraer()}
          disabled={extrayendo}
        >
          {extrayendo ? 'Leyendo el expediente…' : 'Extraer datos de los documentos'}
        </Button>
        <span style={{ fontSize: TEXTO.nota, color: 'var(--text-secondary)' }}>
          Se lee del PDF y de la base de comparendos; solo si no se deja, con IA. Rellena
          únicamente los campos vacíos.
        </span>
      </div>
      {error && <Alert type="warning" showIcon message={error} />}
    </div>
  );
}
