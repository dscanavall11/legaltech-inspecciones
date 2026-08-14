import { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, Square, X } from 'lucide-react';
import { useConversaciones } from '@/shared/ai/useConversaciones';
import { cargarContextoCaso } from '@/shared/ai/contextoCaso';
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { definicionDe, etiquetaEstado, type FilaProceso } from '@/shared/procesos/types';
import { estilos } from './estilosPagina';
import { ColumnaLateral } from './ColumnaLateral';
import { PilaHerramientas } from './PilaHerramientas';
import { Separador, useAnchoPersistido } from './Separador';
import { SugerenciaFecha } from './SugerenciaFecha';
import { type ClaveHerramienta } from './herramientas';
import {
  buscarSkill,
  filtrarSkills,
  plantillaEntrada,
  SKILLS_SUGERIDAS,
  type Artefacto,
  type Skill,
} from './skills';

const SIN_CASO = '';

/**
 * Demo del asistente jurídico: el chat real de Legal con skills que aplican
 * un encuadre especializado al mensaje del inspector y, cuando corresponde,
 * arman el proyecto de documento con los generadores del despacho.
 *
 * El expediente es el contexto de trabajo, no un destino: se elige un caso a
 * la izquierda, se conversa al centro sobre él, y a la derecha se montan las
 * herramientas que ese caso necesita — varias a la vez.
 *
 * Honestidad: una skill es UNA sola llamada a /legal/chat con su prompt. No
 * hay pasos de progreso simulados, y todo documento se marca como proyecto
 * sin guardar. Si el backend no responde, el hilo lo dice y el inspector
 * puede reintentar; no se rellena con datos inventados.
 */
export function AsistentePage() {
  const { conversaciones, activa, activaId, nueva, seleccionar, enviar, detener, enviando } = useConversaciones();
  const config = useInspeccionStore((s) => s.config);
  const [texto, setTexto] = useState('');
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [skillActiva, setSkillActiva] = useState<Skill | null>(null);
  const [menuCerrado, setMenuCerrado] = useState(false);
  const [indiceMenu, setIndiceMenu] = useState(0);
  const [caso, setCaso] = useState<FilaProceso | null>(null);
  const [contextoCaso, setContextoCaso] = useState<string | null>(null);
  const [cargandoContexto, setCargandoContexto] = useState(false);
  // La pila se recuerda por caso mientras dure la sesión (en memoria basta).
  const [pilaPorCaso, setPilaPorCaso] = useState<Record<string, ClaveHerramienta[]>>({});
  const [artefacto, setArtefacto] = useState<{ titulo: string; artefacto: Artefacto } | null>(null);
  // Anchos de las columnas: arrastrables y recordados entre sesiones.
  const [anchoLateral, setAnchoLateral] = useAnchoPersistido('asistente.ancho.lateral', 268);
  const [anchoPila, setAnchoPila] = useAnchoPersistido('asistente.ancho.pila', 440);
  const [lateralColapsada, setLateralColapsada] = useState(false);
  const [pilaColapsada, setPilaColapsada] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mensajes = activa?.mensajes ?? [];
  const clavePila = caso?.id ?? SIN_CASO;
  const abiertas = pilaPorCaso[clavePila] ?? [];

  // Datos del despacho para los documentos: lo que no esté configurado se
  // marca como faltante, no se sustituye por un ejemplo.
  const despacho = useMemo(
    () => ({
      municipio: config.municipio || '[FALTA: municipio del despacho]',
      inspeccion: config.inspeccion || '[FALTA: inspección]',
      inspectorNombre: config.inspectorNombre || '[FALTA: nombre del inspector]',
      inspectorCargo: 'Inspector de Convivencia y Paz',
    }),
    [config.municipio, config.inspeccion, config.inspectorNombre],
  );

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [mensajes]);

  // Contexto del expediente activo (datos + digest saneado): se resuelve una
  // vez por caso y se antepone al mensaje, como en useAiChat.
  useEffect(() => {
    if (!caso) {
      setContextoCaso(null);
      return;
    }
    let vigente = true;
    setContextoCaso(null);
    setCargandoContexto(true);
    cargarContextoCaso(caso.id).then((ctx) => {
      if (!vigente) return;
      setContextoCaso(ctx);
      setCargandoContexto(false);
    });
    return () => {
      vigente = false;
    };
  }, [caso]);

  const filtro = texto.startsWith('/') && !texto.includes('\n') ? texto.slice(1) : null;
  const sugerencias = filtro === null ? [] : filtrarSkills(filtro);
  const menuAbierto = filtro !== null && !menuCerrado && sugerencias.length > 0;

  // Lo que el expediente ya sabe: la skill no se lo vuelve a pedir al inspector.
  const datosDelCaso: Record<string, string> = caso
    ? {
        Radicado: caso.radicado,
        'Nro. de queja': caso.radicado,
        Querellante: caso.parteA,
        Querellado: caso.parteB,
      }
    : {};

  const abrirHerramienta = (clave: ClaveHerramienta) =>
    setPilaPorCaso((prev) => {
      const actual = prev[clavePila] ?? [];
      return actual.includes(clave) ? prev : { ...prev, [clavePila]: [...actual, clave] };
    });

  const cerrarHerramienta = (clave: ClaveHerramienta) =>
    setPilaPorCaso((prev) => ({ ...prev, [clavePila]: (prev[clavePila] ?? []).filter((c) => c !== clave) }));

  const elegirSkill = (skill: Skill) => {
    setSkillActiva(skill);
    setTexto(plantillaEntrada(skill, datosDelCaso));
    setMenuCerrado(true);
    setIndiceMenu(0);
    textareaRef.current?.focus();
  };

  const enviarMensaje = () => {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;
    const entrada = { texto: mensaje, despacho, caso: contextoCaso };
    const archivos = adjuntos;
    setTexto('');
    setAdjuntos([]);
    setMenuCerrado(false);

    const prompt = skillActiva
      ? skillActiva.construirPrompt(entrada)
      : contextoCaso
        ? `Actúa como asistente jurídico del inspector y responde su consulta apoyándote en este expediente.\n\n=== EXPEDIENTE ACTIVO ===\n${contextoCaso}\n=== FIN DEL EXPEDIENTE ===\n\nConsulta: ${mensaje}`
        : undefined;
    enviar(mensaje, archivos, prompt);

    if (skillActiva?.generarArtefacto) {
      setArtefacto({ titulo: skillActiva.nombre, artefacto: skillActiva.generarArtefacto(entrada) });
      abrirHerramienta('documento');
    }
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuAbierto) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndiceMenu((i) => (i + 1) % sugerencias.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndiceMenu((i) => (i - 1 + sugerencias.length) % sugerencias.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        elegirSkill(sugerencias[indiceMenu]);
        return;
      }
      if (e.key === 'Escape') {
        setMenuCerrado(true);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  return (
    <div style={estilos.shell}>
      <ColumnaLateral
        conversaciones={conversaciones}
        activaId={activaId}
        onNueva={() => nueva()}
        onSeleccionar={seleccionar}
        casoActivo={caso}
        onElegirCaso={setCaso}
        ancho={anchoLateral}
        colapsada={lateralColapsada}
        onColapsar={setLateralColapsada}
      />
      {!lateralColapsada && (
        <Separador
          ancho={anchoLateral}
          min={200}
          max={460}
          signo={1}
          etiqueta="Ancho de conversaciones y casos"
          onCambio={setAnchoLateral}
        />
      )}

      <section style={estilos.centro}>
        {caso && (
          <div style={estilos.barraCaso}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={estilos.casoTitulo}>
                {caso.radicado} · {definicionDe(caso.tipo)?.label ?? caso.tipo} · {etiquetaEstado(caso.estado)}
              </div>
              <div style={estilos.casoPartes}>
                {caso.parteA} / {caso.parteB}
                {cargandoContexto
                  ? ' · cargando el expediente…'
                  : contextoCaso === null &&
                    ' · sin contexto del expediente: la consulta va sin él, no se inventa'}
              </div>
            </div>
            <button type="button" style={estilos.iconBtn} onClick={() => setCaso(null)} aria-label="Soltar el caso">
              <X size={15} />
            </button>
          </div>
        )}

        <div style={estilos.hilo}>
          <div style={estilos.columnaLectura}>
            {caso && (
              <SugerenciaFecha
                key={caso.id}
                caso={caso}
                onResponder={(plantilla) => {
                  setSkillActiva(null);
                  setTexto(plantilla);
                  textareaRef.current?.focus();
                }}
              />
            )}
            {mensajes.length === 0 ? (
              <div style={estilos.vacio}>
                <NormaMark size={40} />
                <h1 className="titulo-serif" style={estilos.vacioTitulo}>
                  {NORMA.nombre}, asistente jurídico del despacho
                </h1>
                <p style={estilos.vacioTexto}>
                  Elige un caso a la izquierda para trabajar sobre su expediente y monta a la derecha las herramientas
                  que necesites. Escribe <strong> / </strong> para elegir una skill.
                </p>
                <div style={estilos.chips}>
                  {SKILLS_SUGERIDAS.map((clave) => {
                    const skill = buscarSkill(clave);
                    if (!skill) return null;
                    const Icono = skill.icono;
                    return (
                      <button key={clave} type="button" style={estilos.chip} onClick={() => elegirSkill(skill)}>
                        <Icono size={14} strokeWidth={1.9} />
                        {skill.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              mensajes.map((m) =>
                m.rol === 'usuario' ? (
                  <div key={m.id} style={estilos.turnoInspector}>
                    {m.contenido}
                  </div>
                ) : (
                  <div key={m.id} style={estilos.turnoAsistente}>
                    {m.contenido || <span style={estilos.textoTenue}>Consultando a {NORMA.nombre}…</span>}
                  </div>
                ),
              )
            )}
            <div ref={finRef} />
          </div>
        </div>

        {/* Compositor */}
        <div style={estilos.compositorWrap}>
          <div style={estilos.columnaLectura}>
            {menuAbierto && (
              <div style={estilos.menu} role="listbox" aria-label="Skills">
                {sugerencias.map((s, i) => {
                  const Icono = s.icono;
                  return (
                    <button
                      key={s.clave}
                      type="button"
                      role="option"
                      aria-selected={i === indiceMenu}
                      onMouseEnter={() => setIndiceMenu(i)}
                      onClick={() => elegirSkill(s)}
                      style={{ ...estilos.menuItem, ...(i === indiceMenu ? estilos.menuItemActivo : null) }}
                    >
                      <Icono size={15} strokeWidth={1.8} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={estilos.menuClave}>{s.clave}</span>
                        <span style={estilos.menuDesc}>{s.descripcion}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {skillActiva && (
              <div style={estilos.skillActiva}>
                <span style={estilos.skillClave}>{skillActiva.clave}</span>
                <span style={estilos.skillDesc}>{skillActiva.descripcion}</span>
                <button
                  type="button"
                  style={estilos.iconBtn}
                  onClick={() => setSkillActiva(null)}
                  aria-label="Quitar la skill"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {adjuntos.length > 0 && (
              <div style={estilos.adjuntos}>
                {adjuntos.map((a, i) => (
                  <span key={`${a.name}-${i}`} style={estilos.adjunto}>
                    {a.name}
                    <button
                      type="button"
                      style={estilos.iconBtn}
                      aria-label={`Quitar ${a.name}`}
                      onClick={() => setAdjuntos((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div style={estilos.compositor}>
              <input
                ref={archivoRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) setAdjuntos((prev) => [...prev, ...Array.from(e.target.files!)]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                style={estilos.iconBtn}
                onClick={() => archivoRef.current?.click()}
                aria-label="Adjuntar documento"
              >
                <Paperclip size={16} />
              </button>
              <textarea
                ref={textareaRef}
                value={texto}
                rows={texto.includes('\n') ? Math.min(texto.split('\n').length, 14) : 1}
                onChange={(e) => {
                  setTexto(e.target.value);
                  if (!e.target.value.startsWith('/')) setMenuCerrado(false);
                }}
                onKeyDown={alTeclear}
                placeholder={
                  caso ? `Pregúntale a ${NORMA.nombre} sobre ${caso.radicado}` : `Escribe / para una skill, o pregúntale a ${NORMA.nombre}`
                }
                style={estilos.textarea}
              />
              <button
                type="button"
                onClick={() => (enviando ? detener() : enviarMensaje())}
                disabled={!enviando && !texto.trim()}
                style={{
                  ...estilos.enviarBtn,
                  ...(enviando || texto.trim() ? estilos.enviarActivo : estilos.enviarInactivo),
                }}
              >
                {enviando ? <Square size={13} /> : <Send size={15} />}
                {enviando ? 'Detener' : 'Enviar'}
              </button>
            </div>
            <p style={estilos.pieCompositor}>
              Enter envía · Shift+Enter salta línea. Las skills no guardan nada en el expediente.
            </p>
          </div>
        </div>
      </section>

      {!pilaColapsada && (
        <Separador
          ancho={anchoPila}
          min={280}
          max={720}
          signo={-1}
          etiqueta="Ancho de las herramientas"
          onCambio={setAnchoPila}
        />
      )}
      <PilaHerramientas
        abiertas={abiertas}
        caso={caso}
        artefacto={artefacto}
        onAbrir={abrirHerramienta}
        onCerrar={cerrarHerramienta}
        ancho={anchoPila}
        colapsada={pilaColapsada}
        onColapsar={setPilaColapsada}
      />
    </div>
  );
}
