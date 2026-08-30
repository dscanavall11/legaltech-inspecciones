/**
 * Carga pdfmake + su VFS de fuentes tolerando las distintas formas del export
 * entre versiones: en 0.3.x `vfs_fonts` hace `module.exports = vfs` (el mapa
 * de fuentes directo) y el cliente usa `addVirtualFileSystem`; en 0.2.x el
 * mapa venía bajo `.pdfMake.vfs`/`.vfs` y se asignaba a `.vfs`. Sin esto
 * pdfmake lanza «Roboto-Regular.ttf not found in virtual file system».
 */
type PdfMake = {
  vfs?: Record<string, string>;
  addVirtualFileSystem?: (vfs: Record<string, string>) => void;
  // pdfmake 0.3.x: getBlob/download devuelven Promise (ya no toman callback).
  createPdf: (def: unknown) => {
    download: (nombre?: string) => void;
    getBlob: () => Promise<Blob>;
  };
};

export async function cargarPdfMake(): Promise<PdfMake> {
  const [pdfMod, vfsMod] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  const pdfMake = (((pdfMod as { default?: unknown }).default ?? pdfMod) as unknown) as PdfMake;

  const f = vfsMod as {
    default?: Record<string, string>;
    vfs?: Record<string, string>;
    pdfMake?: { vfs: Record<string, string> };
  };
  const vfs = f.pdfMake?.vfs ?? f.vfs ?? f.default ?? (f as unknown as Record<string, string>);

  if (typeof pdfMake.addVirtualFileSystem === 'function') {
    pdfMake.addVirtualFileSystem(vfs);
  } else {
    pdfMake.vfs = vfs;
  }
  return pdfMake;
}
