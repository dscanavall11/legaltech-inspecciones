import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Button, Spin, Typography } from 'antd';
import { LeftOutlined, RightOutlined, WarningOutlined } from '@ant-design/icons';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const { Text } = Typography;

const ANCHO_OBJETIVO = 640;

/**
 * Visor de PDF embebido en la app (canvas por página, navegación anterior/
 * siguiente). No reemplaza la extracción de texto de extraerComparendoPdf.ts
 * — es sólo lectura visual del documento fuente.
 */
export function PdfViewer({ archivo }: { archivo: File | Blob | string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const taskRef = useRef<pdfjs.PDFDocumentLoadingTask | null>(null);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(false);
    setPagina(1);
    docRef.current = null;

    // archivo puede ser un File/Blob local (anexo recién adjuntado, aún sin
    // subir) o la URL presignada de S3 de un documento ya archivado.
    (typeof archivo === 'string' ? Promise.resolve(archivo) : archivo.arrayBuffer())
      .then((dataOUrl) => {
        const task =
          typeof dataOUrl === 'string' ? pdfjs.getDocument({ url: dataOUrl }) : pdfjs.getDocument({ data: dataOUrl });
        taskRef.current = task;
        return task.promise;
      })
      .then((doc) => {
        if (cancelado) return;
        docRef.current = doc;
        setTotalPaginas(doc.numPages);
        setCargando(false);
      })
      .catch(() => {
        if (!cancelado) {
          setError(true);
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
      taskRef.current?.destroy();
    };
  }, [archivo]);

  useEffect(() => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || cargando) return;

    let cancelado = false;
    doc.getPage(pagina).then(async (paginaPdf) => {
      if (cancelado) return;
      const viewportBase = paginaPdf.getViewport({ scale: 1 });
      const escala = ANCHO_OBJETIVO / viewportBase.width;
      const viewport = paginaPdf.getViewport({ scale: escala });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const contexto = canvas.getContext('2d');
      if (!contexto) return;
      await paginaPdf.render({ canvas, canvasContext: contexto, viewport }).promise;
    });

    return () => {
      cancelado = true;
    };
  }, [pagina, cargando]);

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <WarningOutlined style={{ fontSize: 20, color: PALETA.rojo }} />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">No fue posible leer este PDF.</Text>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          maxWidth: '100%',
          overflow: 'auto',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(32,33,36,0.15)',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      </div>
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            icon={<LeftOutlined />}
            size="small"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          />
          <Text style={{ fontSize: TEXTO.base, color: PALETA.textoSuave }}>
            Página {pagina} / {totalPaginas}
          </Text>
          <Button
            icon={<RightOutlined />}
            size="small"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            aria-label="Página siguiente"
          />
        </div>
      )}
    </div>
  );
}
