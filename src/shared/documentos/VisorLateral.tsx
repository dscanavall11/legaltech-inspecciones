import type { ReactNode } from 'react';
import { Drawer } from 'antd';
import { PdfViewer } from './PdfViewer';

/**
 * El "ojito" lateral: patrón estándar de visor de PDF en Drawer, reutilizado
 * ahora por DocumentosExpediente (documentos archivados), FlujoNavegable
 * (vista previa de plantillas) y ConfiguracionDespachoPage (vista previa de
 * plantillas del despacho) — Task 18 lo extrae de esos tres duplicados. El
 * PDF puede venir como archivo local recién generado (Blob) o como URL
 * presignada de S3 (documento ya archivado).
 */
export function VisorLateral({
  titulo,
  abierto,
  archivo,
  onCerrar,
  width = 720,
}: {
  titulo?: ReactNode;
  abierto: boolean;
  archivo: File | Blob | string | null;
  onCerrar: () => void;
  width?: number;
}) {
  return (
    <Drawer title={titulo} open={abierto} onClose={onCerrar} width={width}>
      {archivo && <PdfViewer archivo={archivo} />}
    </Drawer>
  );
}
