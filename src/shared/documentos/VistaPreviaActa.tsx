import {
  ROTULO_PROCESO_POR_DEFECTO,
  ROTULO_RESOLUTIVA_POR_DEFECTO,
  type DocumentoLegal,
} from '@/derecho';
import { ELEVACION, PALETA } from '@/theme/theme';

/**
 * Previsualización en pantalla de un `DocumentoLegal`, con el mismo orden y
 * los mismos rótulos que el PDF y el .docx (documentoLegalPdf.ts /
 * documentoLegalDocx.ts). Estaba duplicada en las pantallas de firmeza y de
 * pronto pago, cada una con su rótulo resolutivo escrito a mano — que era
 * justo la parte que no podía divergir, porque un acta de firmeza DISPONE y
 * un auto RESUELVE.
 */
export function VistaPreviaActa({
  acta,
  membreteDataUrl,
}: {
  acta: DocumentoLegal;
  membreteDataUrl?: string | null;
}) {
  return (
    <div
      style={{
        background: PALETA.superficie,
        borderRadius: 24,
        boxShadow: ELEVACION.media,
        padding: '46px 52px',
        fontFamily: "'Newsreader', Georgia, serif",
        fontSize: 13.5,
        lineHeight: 1.65,
        color: '#1b1b1f',
      }}
    >
      {membreteDataUrl && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img
            src={membreteDataUrl}
            alt="Membrete de la alcaldía"
            style={{ maxWidth: '100%', maxHeight: 96, objectFit: 'contain' }}
          />
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontWeight: 600, letterSpacing: '0.04em' }}>{acta.entidad}</div>
        <div style={{ fontWeight: 700, fontSize: 17, marginTop: 10 }}>{acta.tituloDocumento}</div>
        <div style={{ marginTop: 2 }}>
          {acta.rotuloProceso ?? ROTULO_PROCESO_POR_DEFECTO} {acta.proceso}
        </div>
        <div style={{ marginTop: 2 }}>{acta.fechaResolucionLetras}</div>
      </div>

      {acta.epigrafe && (
        <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 12.5 }}>{acta.epigrafe}</p>
      )}

      {acta.tablaDatos.length > 0 && (
        <table style={{ width: '100%', margin: '16px 0', borderCollapse: 'collapse' }}>
          <tbody>
            {acta.tablaDatos.map((f) => (
              <tr key={f.etiqueta}>
                <td
                  style={{
                    padding: '3px 10px 3px 0',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                    fontSize: 12,
                  }}
                >
                  {f.etiqueta}:
                </td>
                <td style={{ padding: '3px 0', fontSize: 12.5 }}>{f.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {acta.secciones.map((s, i) => (
        <div key={i}>
          {s.titulo && <p style={{ textAlign: 'center', fontWeight: 700, marginTop: 18 }}>{s.titulo}</p>}
          {s.parrafos.map((p, j) => (
            <p key={j} style={{ textAlign: 'justify' }}>
              {p}
            </p>
          ))}
        </div>
      ))}

      {acta.resuelve.length > 0 && (
        <>
          <p style={{ textAlign: 'center', fontWeight: 700, marginTop: 18 }}>
            {acta.rotuloResolutiva ?? ROTULO_RESOLUTIVA_POR_DEFECTO}
          </p>
          {acta.resuelve.map((p, i) => (
            <p key={i} style={{ textAlign: 'justify' }}>
              {p}
            </p>
          ))}
        </>
      )}

      {acta.cierre && <p style={{ marginTop: 18 }}>{acta.cierre}</p>}
      <p style={{ fontWeight: 600 }}>CÚMPLASE,</p>
      {acta.firma.map((f, i) => (
        <div key={i} style={{ marginTop: 30 }}>
          <div style={{ fontWeight: 700 }}>{f.nombre}</div>
          <div>{f.rol}</div>
        </div>
      ))}
    </div>
  );
}
