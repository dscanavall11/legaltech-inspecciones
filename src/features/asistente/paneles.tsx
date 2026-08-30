import { useState } from 'react';
import { FileDown } from 'lucide-react';
import {
  INCREMENTO_LABEL,
  MULTA_GENERAL,
  TERMINOS_COMPARENDO,
  VIGENCIA_MULTAS,
  liquidarProntoPago,
  type CausalIncremento,
  type TipoMulta,
} from '@/derecho/multas';
import { CATALOGO_COMPORTAMIENTOS } from '@/derecho/catalogoComportamientos';
import { descargarDocumentoLegalPdf } from '@/shared/documentos/documentoLegalPdf';
import { descargarDocumentoLegalDocx } from '@/shared/documentos/documentoLegalDocx';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { PALETA } from '@/theme/palette';
import type { Artefacto } from './skills';
import { TEXTO } from '@/theme/escala';

/**
 * Paneles de las herramientas que no dependen del expediente abierto: el
 * documento que proyectó la skill, el liquidador de multas y el catálogo de
 * comportamientos. Los que sí dependen del caso viven en panelesCaso.tsx.
 */

const AVISO_SIN_GUARDAR =
  'Proyecto sin guardar. No quedó registrado en ningún expediente ni se envió a nadie: descárgalo si lo vas a usar.';

const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// ─── Documento generado por la skill ─────────────────────────────────────────

export function PanelDocumento({ artefacto, titulo }: { artefacto: Artefacto | null; titulo?: string }) {
  const membrete = useInspeccionStore((s) => s.config.membreteDataUrl);
  if (!artefacto) {
    return (
      <p style={estilos.tenue}>
        Todavía no hay documento. Elige una skill que proyecte un documento (fallo o acta) y envíala: el proyecto
        aparece acá.
      </p>
    );
  }
  const { documento, faltantes } = artefacto;

  return (
    <>
      {titulo && <div style={estilos.subtitulo}>{titulo}</div>}
      <p style={estilos.aviso}>{AVISO_SIN_GUARDAR}</p>

      {faltantes.length > 0 && (
        <div style={estilos.faltantes}>
          <strong style={{ fontWeight: 600 }}>Datos que no aportaste</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {faltantes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p style={{ margin: '6px 0 0' }}>
            Quedan marcados como <code>[FALTA: …]</code> en el documento: complétalos antes de firmarlo.
          </p>
        </div>
      )}

      {documento ? (
        <>
          <div style={estilos.acciones}>
            <button type="button" style={estilos.btn} onClick={() => descargarDocumentoLegalPdf(documento, membrete)}>
              <FileDown size={14} /> Descargar PDF
            </button>
            <button type="button" style={estilos.btn} onClick={() => descargarDocumentoLegalDocx(documento, membrete)}>
              <FileDown size={14} /> Descargar Word
            </button>
          </div>

          <div style={estilos.vistaPrevia}>
            <div style={estilos.docEntidad}>{documento.entidad}</div>
            <div style={estilos.docTitulo}>{documento.tituloDocumento}</div>
            {documento.epigrafe && <p style={estilos.docEpigrafe}>{documento.epigrafe}</p>}
            <dl style={{ margin: '12px 0 0' }}>
              {documento.tablaDatos.map((d) => (
                <div key={d.etiqueta} style={estilos.docFila}>
                  <dt style={estilos.docEtiqueta}>{d.etiqueta}</dt>
                  <dd style={estilos.docValor}>{d.valor}</dd>
                </div>
              ))}
            </dl>
            {documento.secciones.map((s, i) => (
              <section key={s.titulo ?? i} style={{ marginTop: 14 }}>
                {s.titulo && <h3 style={estilos.docSeccion}>{s.titulo}</h3>}
                {s.parrafos.map((p, j) => (
                  <p key={j} style={estilos.docParrafo}>
                    {p}
                  </p>
                ))}
              </section>
            ))}
            <h3 style={estilos.docSeccion}>{documento.rotuloResolutiva ?? 'RESUELVE:'}</h3>
            {documento.resuelve.map((r, i) => (
              <p key={i} style={estilos.docParrafo}>
                {r}
              </p>
            ))}
            <p style={estilos.docParrafo}>{documento.cierre}</p>
            {documento.firma.map((f) => (
              <p key={f.nombre + f.rol} style={estilos.docFirma}>
                {f.nombre}
                <br />
                <span style={{ color: PALETA.textoSuave }}>{f.rol}</span>
              </p>
            ))}
          </div>
        </>
      ) : (
        <p style={estilos.tenue}>
          No se armó el documento: falta un dato del que depende la liquidación o la decisión. Complétalo en el mensaje
          y vuelve a enviar — el asistente no lo suple con un valor por defecto.
        </p>
      )}
    </>
  );
}

// ─── Liquidador de multas ───────────────────────────────────────────────────

export function PanelMultas() {
  const [tipo, setTipo] = useState<TipoMulta>(2);
  const [causal, setCausal] = useState<CausalIncremento>('ninguna');
  const liquidacion = liquidarProntoPago(tipo, causal);
  const conmutable = tipo === 1 || tipo === 2;

  return (
    <>
      <div style={estilos.campos}>
        <label style={estilos.campo}>
          Tipo de multa
          <select
            value={tipo}
            onChange={(e) => setTipo(Number(e.target.value) as TipoMulta)}
            style={estilos.select}
          >
            {([1, 2, 3, 4] as TipoMulta[]).map((t) => (
              <option key={t} value={t}>
                Tipo {t} — {MULTA_GENERAL[t].smdlvLetras} SMDLV
              </option>
            ))}
          </select>
        </label>
        <label style={estilos.campo}>
          Causal de incremento
          <select
            value={causal}
            onChange={(e) => setCausal(e.target.value as CausalIncremento)}
            style={estilos.select}
          >
            {Object.entries(INCREMENTO_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl style={{ margin: '12px 0 0' }}>
        <Dato etiqueta="Valor base" valor={pesos.format(liquidacion.valorBase)} />
        {liquidacion.valorIncremento > 0 && (
          <Dato
            etiqueta={`Incremento (${liquidacion.porcentajeIncremento}%)`}
            valor={pesos.format(liquidacion.valorIncremento)}
          />
        )}
        <Dato etiqueta="Total en firme" valor={pesos.format(liquidacion.valorTotal)} />
        <Dato etiqueta="Pronto pago (−50%)" valor={pesos.format(liquidacion.valorAPagar)} />
      </dl>
      <p style={estilos.tenue}>{liquidacion.valorTotalLetras}</p>

      <div style={estilos.faltantes}>
        Objeción: {TERMINOS_COMPARENDO.objecionDias} días hábiles · Pronto pago:{' '}
        {TERMINOS_COMPARENDO.prontoPagoDias} · Firmeza: {TERMINOS_COMPARENDO.firmezaDias}.{' '}
        {conmutable
          ? `La conmutación (art. 180 par.) procede para el tipo ${tipo}.`
          : 'La conmutación no procede para este tipo de multa.'}{' '}
        Tabla vigente {VIGENCIA_MULTAS}.
      </div>
    </>
  );
}

// ─── Norma y comportamiento ─────────────────────────────────────────────────

export function PanelNorma() {
  const [busqueda, setBusqueda] = useState('');
  const q = busqueda.trim().toLowerCase();
  const filtrados = CATALOGO_COMPORTAMIENTOS.filter(
    (c) =>
      q === '' ||
      `${c.articuloNumeral} ${c.descripcionConducta} ${c.bienJuridico}`.toLowerCase().includes(q),
  );

  return (
    <>
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Artículo, conducta o bien jurídico"
        style={{ ...estilos.select, width: '100%' }}
        aria-label="Buscar comportamiento"
      />
      {filtrados.map((c) => (
        <div key={c.articuloNumeral} style={estilos.fila}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontWeight: 600 }}>{c.articuloNumeral}</strong>
            {c.pendienteValidacion && <span style={estilos.tenue}> · pendiente de validación</span>}
            <br />
            {c.descripcionConducta}
            <br />
            <span style={estilos.tenue}>
              {c.bienJuridico} — {c.medidasCorrectivas}
            </span>
          </span>
        </div>
      ))}
      {filtrados.length === 0 && <p style={estilos.tenue}>Ningún comportamiento del catálogo coincide.</p>}
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div style={estilos.docFila}>
      <dt style={estilos.docEtiqueta}>{etiqueta}</dt>
      <dd style={estilos.docValor}>{valor}</dd>
    </div>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  tenue: { color: PALETA.textoSuave, fontSize: TEXTO.menor, lineHeight: 1.55, margin: '8px 0 0' },
  subtitulo: {
    fontSize: TEXTO.nota,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: PALETA.textoTenue,
    margin: '16px 0 4px',
  },
  aviso: {
    margin: '4px 0 0',
    padding: '9px 11px',
    borderRadius: 8,
    background: PALETA.amarilloBg,
    color: '#6b4b00',
    fontSize: TEXTO.menor,
    lineHeight: 1.5,
  },
  faltantes: {
    margin: '10px 0 0',
    padding: '9px 11px',
    borderRadius: 8,
    border: `1px solid ${PALETA.borde}`,
    fontSize: TEXTO.menor,
    lineHeight: 1.5,
    color: PALETA.texto,
  },
  acciones: { display: 'flex', gap: 8, margin: '14px 0 0' },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 12px',
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 10,
    background: 'transparent',
    color: PALETA.texto,
    fontSize: TEXTO.base,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  filaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    textAlign: 'left',
    border: 'none',
    borderBottom: `1px solid ${PALETA.borde}`,
    background: 'transparent',
    padding: '9px 2px',
    fontFamily: 'inherit',
    fontSize: TEXTO.menor,
    color: PALETA.texto,
    cursor: 'pointer',
  },
  fila: {
    display: 'flex',
    gap: 8,
    padding: '9px 2px',
    borderBottom: `1px solid ${PALETA.borde}`,
    fontSize: TEXTO.menor,
    lineHeight: 1.5,
    color: PALETA.texto,
  },
  campos: { display: 'flex', flexDirection: 'column', gap: 10 },
  campo: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: TEXTO.menor, color: PALETA.textoSuave },
  select: {
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 8,
    padding: '7px 8px',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: TEXTO.base,
    color: PALETA.texto,
  },
  vistaPrevia: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: `1px solid ${PALETA.borde}`,
    fontSize: TEXTO.menor,
    lineHeight: 1.65,
    color: PALETA.texto,
  },
  docEntidad: { fontSize: TEXTO.nota, letterSpacing: '0.06em', color: PALETA.textoSuave, textTransform: 'uppercase' },
  docTitulo: { fontSize: TEXTO.titulo, fontWeight: 600, margin: '4px 0 8px' },
  docEpigrafe: { margin: 0, fontSize: TEXTO.nota, color: PALETA.textoSuave, textAlign: 'justify' },
  docFila: { display: 'flex', gap: 8, padding: '3px 0', borderBottom: `1px solid ${PALETA.borde}` },
  docEtiqueta: { flex: '0 0 42%', margin: 0, fontSize: TEXTO.nota, color: PALETA.textoSuave, textTransform: 'uppercase' },
  docValor: { flex: 1, margin: 0, fontSize: TEXTO.menor },
  docSeccion: { fontSize: TEXTO.menor, fontWeight: 700, letterSpacing: '0.04em', margin: '14px 0 6px' },
  docParrafo: { margin: '0 0 8px', textAlign: 'justify' },
  docFirma: { margin: '18px 0 0', fontWeight: 600 },
};
