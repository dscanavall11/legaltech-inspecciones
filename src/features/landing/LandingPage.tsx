import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/shared/auth/auth';

/**
 * Portada pública de legaltech.com.co — estilo Google: superficies claras,
 * pasteles amigables, tipografía Outfit y un cerebro-grafo animado que
 * representa la arquitectura RAG con las áreas del derecho orbitándola.
 * Las animaciones viven en index.css (.lp-*) y respetan reduced-motion.
 */

const P = {
  fondo: '#ffffff',
  fondoSuave: '#f8f9fa',
  texto: '#202124',
  textoSuave: '#5f6368',
  textoTenue: '#80868b',
  borde: '#e8eaed',
  azul: '#1a73e8',
  azulOscuro: '#1967d2',
  azulPastel: '#e8f0fe',
  verde: '#1e8e3e',
  verdePastel: '#e6f4ea',
  amarillo: '#b06000',
  amarilloPastel: '#fef7e0',
  rojo: '#c5221f',
  rojoPastel: '#fce8e6',
  morado: '#673ab7',
  moradoPastel: '#f3e8fd',
  teal: '#00796b',
  tealPastel: '#e0f2f1',
  rosa: '#d81b60',
  rosaPastel: '#fce4ec',
} as const;

const fuente = "'Outfit', 'Inter', sans-serif";

const botonAzul: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  background: P.azul,
  padding: '13px 34px',
  fontSize: 15,
  fontWeight: 600,
  color: '#fff',
  textDecoration: 'none',
  boxShadow: '0 4px 14px rgba(26,115,232,0.25)',
};

// ── Revelado suave al hacer scroll ──────────────────────────────────────────
function Revela({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lp-revela${visible ? ' lp-visible' : ''}`} style={style}>
      {children}
    </div>
  );
}

// ── Las áreas del derecho (los módulos del ecosistema) ─────────────────────
const AREAS = [
  { nombre: 'Convivencia y Paz', color: P.azul, pastel: P.azulPastel, estado: 'Disponible' },
  { nombre: 'Comisaría y Familia', color: P.rosa, pastel: P.rosaPastel, estado: 'En construcción' },
  { nombre: 'Contratación Pública', color: P.verde, pastel: P.verdePastel, estado: 'En construcción' },
  { nombre: 'Litigantes', color: P.amarillo, pastel: P.amarilloPastel, estado: 'En construcción' },
  { nombre: 'Business', color: P.teal, pastel: P.tealPastel, estado: 'En construcción' },
  { nombre: 'Disciplinario', color: P.morado, pastel: P.moradoPastel, estado: 'En construcción' },
  { nombre: 'Resguardos', color: P.verde, pastel: P.verdePastel, estado: 'En construcción' },
  { nombre: 'Medicina Legal', color: P.rojo, pastel: P.rojoPastel, estado: 'En construcción' },
] as const;

function ChipArea({ area, delay }: { area: (typeof AREAS)[number]; delay: number }) {
  return (
    <div
      className="lp-chip lp-flotar"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: area.pastel,
        borderRadius: 999,
        padding: '8px 16px',
        fontSize: 13.5,
        fontWeight: 600,
        color: area.color,
        animationDelay: `${delay}ms, ${delay + 400}ms`,
        whiteSpace: 'nowrap',
      }}
      title={area.estado}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: area.color,
          opacity: area.estado === 'Disponible' ? 1 : 0.45,
          flexShrink: 0,
        }}
      />
      {area.nombre}
    </div>
  );
}

// ── Grafo de conocimiento (arquitectura RAG) ────────────────────────────────
// Composición geométrica pura: un centro, un anillo de 4 "conceptos del RAG"
// en las direcciones cardinales y un anillo de 8 "áreas del derecho" a 45°,
// todo calculado por trigonometría (nada de coordenadas a ojo). Un solo
// acento estructural (azul); el color solo aparece donde tiene significado:
// el anillo exterior, que replica los colores de los chips de área.
const CENTRO_X = 200;
const CENTRO_Y = 200;
const RADIO_INTERNO = 92;
const RADIO_EXTERNO = 158;

function puntoOrbital(radio: number, anguloGrados: number): [number, number] {
  const rad = (anguloGrados * Math.PI) / 180;
  return [CENTRO_X + radio * Math.cos(rad), CENTRO_Y + radio * Math.sin(rad)];
}

const ANGULOS_INTERNOS = [-90, 0, 90, 180];
const ANGULOS_EXTERNOS = [-90, -45, 0, 45, 90, 135, 180, 225];

const NODOS_INTERNOS = ANGULOS_INTERNOS.map((a) => puntoOrbital(RADIO_INTERNO, a));
const NODOS_EXTERNOS = ANGULOS_EXTERNOS.map((a) => puntoOrbital(RADIO_EXTERNO, a));

// Cada nodo interno reparte a sus dos vecinos externos más próximos.
const RADIOS_EXTERNOS_POR_INTERNO = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
];

function CerebroGrafo() {
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label="Motor de recuperación aumentada: un núcleo jurídico conectado a las áreas del derecho"
      style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block' }}
    >
      <defs>
        <filter id="sombra-nodo" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#1a1a2e" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* Órbitas: dos círculos perfectos, quietos salvo un giro casi imperceptible */}
      <circle cx={CENTRO_X} cy={CENTRO_Y} r={RADIO_INTERNO} fill="none" stroke={P.azul} strokeWidth={1} opacity={0.1} />
      <circle
        cx={CENTRO_X}
        cy={CENTRO_Y}
        r={RADIO_EXTERNO}
        fill="none"
        stroke={P.azul}
        strokeWidth={1}
        opacity={0.08}
        className="lp-orbita lento"
      />

      {/* Radios centro → conceptos del RAG (trazo del largo exacto de cada línea) */}
      {NODOS_INTERNOS.map(([x, y], i) => {
        const largo = Math.hypot(x - CENTRO_X, y - CENTRO_Y);
        return (
          <line
            key={`ci-${i}`}
            className="lp-arista"
            x1={CENTRO_X}
            y1={CENTRO_Y}
            x2={x}
            y2={y}
            stroke={P.azul}
            strokeWidth={1.5}
            opacity={0.3}
            style={{
              animationDelay: `${i * 90}ms`,
              strokeDasharray: largo,
              strokeDashoffset: largo,
            }}
          />
        );
      })}

      {/* Radios concepto → áreas del derecho */}
      {RADIOS_EXTERNOS_POR_INTERNO.map(([e1, e2], i) =>
        [e1, e2].map((e, j) => {
          const [x1, y1] = NODOS_INTERNOS[i];
          const [x2, y2] = NODOS_EXTERNOS[e];
          const largo = Math.hypot(x2 - x1, y2 - y1);
          return (
            <line
              key={`ie-${i}-${j}`}
              className="lp-arista"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={P.azul}
              strokeWidth={1}
              opacity={0.16}
              style={{
                animationDelay: `${360 + (i * 2 + j) * 70}ms`,
                strokeDasharray: largo,
                strokeDashoffset: largo,
              }}
            />
          );
        }),
      )}

      {/* Anillo interno: los cuatro pilares del RAG, tono único */}
      {NODOS_INTERNOS.map(([x, y], i) => (
        <circle
          key={`n-int-${i}`}
          className="lp-nodo"
          cx={x}
          cy={y}
          r={11}
          fill={P.azulOscuro}
          filter="url(#sombra-nodo)"
          style={{ animationDelay: `${i * 260}ms` }}
        />
      ))}

      {/* Anillo externo: las áreas del derecho, coloreadas como sus chips */}
      {NODOS_EXTERNOS.map(([x, y], i) => (
        <circle
          key={`n-ext-${i}`}
          className="lp-nodo"
          cx={x}
          cy={y}
          r={9}
          fill={AREAS[i].color}
          stroke="#ffffff"
          strokeWidth={2.5}
          filter="url(#sombra-nodo)"
          style={{ animationDelay: `${(i % 4) * 260 + 120}ms` }}
        />
      ))}

      {/* Núcleo: el motor RAG, marca mínima en lugar de texto apretado */}
      <circle cx={CENTRO_X} cy={CENTRO_Y} r={40} fill={P.azul} opacity={0.07} className="lp-centro-halo" />
      <circle
        cx={CENTRO_X}
        cy={CENTRO_Y}
        r={27}
        fill={P.azul}
        filter="url(#sombra-nodo)"
        className="lp-nodo-centro"
      />
      <g stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" opacity={0.95}>
        <line x1={CENTRO_X - 8} y1={CENTRO_Y + 5} x2={CENTRO_X} y2={CENTRO_Y - 7} />
        <line x1={CENTRO_X} y1={CENTRO_Y - 7} x2={CENTRO_X + 8} y2={CENTRO_Y + 5} />
        <line x1={CENTRO_X - 8} y1={CENTRO_Y + 5} x2={CENTRO_X + 8} y2={CENTRO_Y + 5} />
      </g>
      <circle cx={CENTRO_X - 8} cy={CENTRO_Y + 5} r={2.4} fill="#fff" />
      <circle cx={CENTRO_X + 8} cy={CENTRO_Y + 5} r={2.4} fill="#fff" />
      <circle cx={CENTRO_X} cy={CENTRO_Y - 7} r={2.4} fill="#fff" />
    </svg>
  );
}

// ── Robot amigable (mascota, pedida expresamente) ──────────────────────────
function RobotAmigo({ size = 130 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 140" width={size} height={size * (140 / 120)} role="img" aria-label="Asistente LegalTech">
      {/* antena */}
      <g className="lp-robot-antena">
        <line x1="60" y1="26" x2="60" y2="10" stroke="#aecbfa" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="8" r="5" fill={P.amarillo} opacity="0.9" />
      </g>
      {/* cabeza */}
      <rect x="24" y="24" width="72" height="52" rx="22" fill={P.azulPastel} />
      <g className="lp-robot-ojo">
        <circle cx="46" cy="50" r="6" fill={P.azulOscuro} />
        <circle cx="74" cy="50" r="6" fill={P.azulOscuro} />
      </g>
      <path d="M48 63 Q60 71 72 63" stroke={P.azulOscuro} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* cuerpo */}
      <rect x="32" y="82" width="56" height="42" rx="18" fill="#fff" stroke={P.borde} strokeWidth="2" />
      <circle cx="60" cy="103" r="8" fill={P.verdePastel} />
      <path d="M56.5 103 l2.5 2.8 l5 -5.6" stroke={P.verde} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* brazos */}
      <rect x="18" y="88" width="10" height="24" rx="5" fill={P.azulPastel} />
      <rect x="92" y="88" width="10" height="24" rx="5" fill={P.azulPastel} />
    </svg>
  );
}

// ── Contenido ───────────────────────────────────────────────────────────────
const PASOS = [
  ['La consulta del inspector', 'En lenguaje procesal o en lenguaje común.'],
  ['Recuperación híbrida', 'Fichas jurisprudenciales por semántica y hechos; el grafo de fuentes aporta jerarquía, vigencia y precedente.'],
  ['Redacción con citas', 'El borrador solo puede citar el texto recuperado, con el apartado exacto enlazado.'],
  ['Validación y firma', 'Las citas se verifican contra la fuente literal y el inspector decide.'],
] as const;

const CAPAS_RAG = [
  ['Corpus normativo común', 'Ley 1801, códigos, jurisprudencia y acuerdos municipales, versionados y con vigencia controlada.'],
  ['Corpus del despacho', 'Las plantillas y actas modelo de cada inspección: la IA redacta con la voz de tu despacho.'],
  ['Expediente del caso', 'Los documentos radicados en el caso concreto, indexados mientras el proceso está vivo.'],
] as const;

const GARANTIAS = [
  ['Solo cita lo que recuperó', 'Toda cita textual se valida contra el apartado exacto de la fuente. Si el texto no coincide literalmente, la respuesta se rechaza y se regenera.'],
  ['La vigencia no es una opinión', 'El grafo registra qué norma deroga, modifica o condiciona a cuál. Una norma derogada no puede sustentar una actuación: lo impide la estructura, no el modelo.'],
  ['Precedente con cadena completa', 'Las sentencias se conectan por aristas de reiteración y unificación. La respuesta sigue la cadena hasta el precedente vigente, no hasta el más parecido.'],
  ['El inspector firma, siempre', 'La IA prepara borradores con fuentes enlazadas. Ninguna actuación sale del despacho sin revisión y firma humana.'],
] as const;

const PRODUCTOS = [
  {
    nombre: 'LegalTech Cloud',
    detalle:
      'La oficina en el navegador, pensada multi-tenant para todas las células. Hoy funciona el Radicador contra datos de prueba; la integración con el backend jurídico está en construcción.',
    pastel: P.azulPastel,
    color: P.azulOscuro,
    estado: 'En construcción',
  },
  {
    nombre: 'LegalTech.exe',
    detalle: 'Escritorio con IA local: el expediente nunca sale del equipo del despacho.',
    pastel: P.verdePastel,
    color: P.verde,
    estado: 'Próximamente',
  },
  {
    nombre: 'LegalTech Copilot',
    detalle: 'Móvil para el campo: fotografía el comparendo y queda listo para radicar.',
    pastel: P.amarilloPastel,
    color: P.amarillo,
    estado: 'Próximamente',
  },
] as const;

// ── Catálogo de células (verticales legales) ────────────────────────────────
type EstadoCelula = 'disponible' | 'proximamente' | 'propuesta';

const ESTADO_CELULA_LABEL: Record<EstadoCelula, string> = {
  disponible: 'Disponible',
  proximamente: 'Próximamente',
  propuesta: 'Propuesta',
};

const ESTADO_CELULA_ESTILO: Record<EstadoCelula, { color: string; pastel: string }> = {
  disponible: { color: P.verde, pastel: P.verdePastel },
  proximamente: { color: P.amarillo, pastel: P.amarilloPastel },
  propuesta: { color: P.textoTenue, pastel: P.fondoSuave },
};

interface Celula {
  dominio: string;
  estado: EstadoCelula;
  prioridad?: number;
  promesa: string;
}

const CELULAS: Celula[] = [
  { dominio: 'policia.legaltech', estado: 'disponible', promesa: 'Ley 1801 de 2016, querellas y actas de firmeza.' },
  { dominio: 'comisariayfamilia.legaltech', estado: 'proximamente', promesa: 'Medidas de protección y trazabilidad familiar.' },
  { dominio: 'conciliacion.legaltech', estado: 'proximamente', prioridad: 1, promesa: 'Ley 2220 de 2022, actas con efecto de cosa juzgada.' },
  { dominio: 'transito.legaltech', estado: 'proximamente', prioridad: 2, promesa: 'Ley 769 de 2002, comparendos y audiencias contravencionales.' },
  { dominio: 'laboral.legaltech', estado: 'proximamente', prioridad: 3, promesa: 'Inspección de trabajo, seguridad y salud en el trabajo, y liquidaciones.' },
  { dominio: 'cobrocoactivo.legaltech', estado: 'proximamente', promesa: 'Cobro coactivo: cierra el ciclo de las multas en firme.' },
  { dominio: 'personerias.legaltech', estado: 'proximamente', promesa: 'Tutelas, derechos de petición y veeduría.' },
  { dominio: 'resguardos.legaltech', estado: 'propuesta', promesa: 'Gobernanza territorial y Jurisdicción Especial Indígena.' },
];

function TarjetaCelula({ celula }: { celula: Celula }) {
  const estilo = ESTADO_CELULA_ESTILO[celula.estado];
  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${P.borde}`,
        background: '#fff',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "'Newsreader', serif" }}>{celula.dominio}</p>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: estilo.color,
            background: estilo.pastel,
            borderRadius: 999,
            padding: '4px 12px',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: estilo.color, flexShrink: 0 }} />
          {ESTADO_CELULA_LABEL[celula.estado]}
          {celula.prioridad ? ` · prioridad ${celula.prioridad}` : ''}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: P.textoSuave }}>{celula.promesa}</p>
    </div>
  );
}

// ── Ventajas injustas ────────────────────────────────────────────────────────
function IconoEscudo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 L20 6.5 V11.5 C20 16.5 16.5 20 12 21.5 C7.5 20 4 16.5 4 11.5 V6.5 Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.7 12.2 L11 14.5 L15.5 9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoAhorro() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5 V16.5 M9.6 9.4 C9.6 8.3 10.7 7.5 12 7.5 C13.5 7.5 14.6 8.3 14.6 9.4 C14.6 10.5 13.5 11 12 11.3 C10.5 11.6 9.4 12.1 9.4 13.2 C9.4 14.3 10.5 15.1 12 15.1 C13.3 15.1 14.4 14.3 14.4 13.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconoAgilidad() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M13 3 L5 13.5 H11.2 L10.2 21 L19 9.5 H12.7 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

const VENTAJAS = [
  {
    titulo: 'Privacidad local, zero-trust',
    detalle:
      'El expediente puede vivir solo en el equipo del despacho. Cumple Habeas Data (Ley 1581 de 2012) sin que el dato sensible salga de las cuatro paredes de la inspección.',
    icono: <IconoEscudo />,
    color: P.azulOscuro,
    pastel: P.azulPastel,
  },
  {
    titulo: 'Ahorro de costos con IA local',
    detalle:
      'El tier de redacción y resumen corre en el propio equipo. Menos costo de cómputo en la nube por cada borrador, sin depender de conexión para el trabajo del día a día.',
    icono: <IconoAhorro />,
    color: P.verde,
    pastel: P.verdePastel,
  },
  {
    titulo: 'Agilidad omnipresente',
    detalle:
      'El mismo caso se trabaja en el escritorio de la oficina, en el navegador y en el celular del inspector en campo. Un solo expediente, tres formas de tocarlo.',
    icono: <IconoAgilidad />,
    color: P.amarillo,
    pastel: P.amarilloPastel,
  },
] as const;

export function LandingPage() {
  const sesion = useAuth((s) => s.sesion);
  const destinoCta = sesion?.accessToken ? '/panel' : '/login';
  const textoCta = sesion?.accessToken ? 'Ir al panel' : 'Iniciar sesión';

  return (
    <div style={{ minHeight: '100vh', background: P.fondo, color: P.texto, fontFamily: fuente }}>
      {/* Barra superior */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${P.borde}`,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                height: 38,
                width: 38,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                background: P.azul,
                fontSize: 17,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              L
            </span>
            <span style={{ fontSize: 19, fontWeight: 700, color: P.texto }}>LegalTech</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 15, color: P.textoSuave, flexWrap: 'wrap' }}>
            <a href="#celulas" style={{ color: 'inherit', textDecoration: 'none' }}>Células</a>
            <a href="#arquitectura" style={{ color: 'inherit', textDecoration: 'none' }}>Arquitectura</a>
            <a href="#garantias" style={{ color: 'inherit', textDecoration: 'none' }}>Garantías</a>
            <a href="#productos" style={{ color: 'inherit', textDecoration: 'none' }}>Productos</a>
            <a href="#ventajas" style={{ color: 'inherit', textDecoration: 'none' }}>Ventajas</a>
            <a href="#contacto" style={{ color: 'inherit', textDecoration: 'none' }}>Contacto</a>
          </nav>
          <Link to={destinoCta} style={{ ...botonAzul, padding: '10px 26px', fontSize: 14 }}>
            {textoCta}
          </Link>
        </div>
      </div>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 24px 0' }}>
        {/* ── Hero: promesa + cerebro-grafo con las áreas orbitando ── */}
        <section
          id="inicio"
          style={{
            display: 'grid',
            gap: 48,
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div className="vista-animada" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(36px, 4.8vw, 58px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
              }}
            >
              Inteligencia jurídica que{' '}
              <span style={{ color: P.azul }}>cita su fuente</span>.
            </h1>
            <p style={{ margin: 0, fontSize: 19, lineHeight: 1.75, color: P.textoSuave, maxWidth: 540 }}>
              Un cerebro de conocimiento legal para cada área del derecho: radica, tramita y
              expide actuaciones con respaldo normativo verificable.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Link to={destinoCta} style={botonAzul}>{textoCta}</Link>
              <a href="#arquitectura" style={{ fontSize: 15, fontWeight: 600, color: P.azul, textDecoration: 'none' }}>
                Ver cómo funciona
              </a>
            </div>
          </div>

          {/* El cerebro con sus áreas */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 520 }}>
              {AREAS.slice(0, 4).map((a, i) => (
                <ChipArea key={a.nombre} area={a} delay={200 + i * 140} />
              ))}
            </div>
            <CerebroGrafo />
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 520 }}>
              {AREAS.slice(4).map((a, i) => (
                <ChipArea key={a.nombre} area={a} delay={760 + i * 140} />
              ))}
            </div>
            <p id="areas" style={{ margin: 0, fontSize: 13.5, color: P.textoTenue, textAlign: 'center' }}>
              Un solo cerebro RAG, ocho áreas del derecho. Convivencia y Paz ya está disponible;
              las demás, en construcción.
            </p>
          </div>
        </section>

        {/* ── Catálogo de células (verticales legales) ── */}
        <Revela style={{ marginTop: 110 }}>
          <section id="celulas">
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em', maxWidth: 720, fontFamily: "'Newsreader', serif" }}>
              Un ecosistema de células, un solo cerebro jurídico.
            </h2>
            <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.7, color: P.textoSuave, maxWidth: 620 }}>
              Cada vertical legal es una célula con su propio dominio, sus propias plantillas y su
              propio corpus normativo, montada sobre el mismo motor de retrieval. Convivencia y
              Paz ya está disponible; el resto avanza por prioridad.
            </p>
            <div
              style={{
                marginTop: 32,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 18,
              }}
            >
              {CELULAS.map((c) => (
                <TarjetaCelula key={c.dominio} celula={c} />
              ))}
            </div>
          </section>
        </Revela>

        {/* ── Cómo responde + robot ── */}
        <Revela style={{ marginTop: 110 }}>
          <section
            style={{
              background: P.fondoSuave,
              borderRadius: 32,
              padding: 'clamp(28px, 4vw, 48px)',
              display: 'grid',
              gap: 40,
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em', maxWidth: 460 }}>
                Así responde el sistema, paso a paso.
              </h2>
              <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.7, color: P.textoSuave, maxWidth: 480 }}>
                Del lenguaje común del inspector a una actuación con fuentes enlazadas y
                verificadas. Sin atajos.
              </p>
              <div style={{ marginTop: 24, display: 'inline-flex' }}>
                <RobotAmigo />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PASOS.map(([titulo, detalle], i) => (
                <div
                  key={titulo}
                  style={{
                    display: 'flex',
                    gap: 16,
                    background: '#fff',
                    borderRadius: 20,
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(60,64,67,0.08)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: i === PASOS.length - 1 ? P.verdePastel : P.azulPastel,
                      color: i === PASOS.length - 1 ? P.verde : P.azulOscuro,
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{titulo}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 14.5, lineHeight: 1.6, color: P.textoSuave }}>{detalle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Revela>

        {/* ── Arquitectura RAG ── */}
        <Revela style={{ marginTop: 110 }}>
          <section id="arquitectura">
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em', maxWidth: 720 }}>
              Tres capas de conocimiento y un grafo de fuentes del derecho.
            </h2>
            <div
              style={{
                marginTop: 36,
                display: 'grid',
                gap: 40,
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                alignItems: 'start',
              }}
            >
              <div>
                {CAPAS_RAG.map(([nombre, detalle], i) => (
                  <div
                    key={nombre}
                    style={{
                      borderRadius: 22,
                      background: [P.azulPastel, P.verdePastel, P.amarilloPastel][i],
                      padding: '18px 22px',
                      marginTop: i > 0 ? 14 : 0,
                      marginLeft: i * 22,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: [P.azulOscuro, P.verde, P.amarillo][i] }}>
                      {nombre}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 14.5, lineHeight: 1.65, color: P.textoSuave }}>{detalle}</p>
                  </div>
                ))}
                <p style={{ margin: '18px 0 0', fontSize: 14, lineHeight: 1.7, color: P.textoSuave, maxWidth: 480 }}>
                  La consulta desciende de lo particular a lo general: primero el caso, luego el
                  despacho, al final la norma. Cada capa aporta contexto sin contaminar a las demás.
                </p>
              </div>

              <div
                style={{
                  borderRadius: 24,
                  border: `1px solid ${P.borde}`,
                  background: '#fff',
                  padding: 26,
                  boxShadow: '0 2px 10px rgba(60,64,67,0.06)',
                }}
              >
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  Fichas jurisprudenciales + grafo de fuentes
                </p>
                <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.7, color: P.textoSuave }}>
                  No embebemos sentencias completas: destilamos cada providencia en una ficha con
                  su problema jurídico, la ratio decidendi y los hechos patrón. Sobre las fichas,
                  un grafo conecta normas y sentencias con aristas jurídicas reales:
                </p>
                <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(
                    [
                      ['deroga · modifica · adiciona', 'la vigencia se deriva del grafo, no se le pregunta al modelo', P.azulPastel, P.azulOscuro],
                      ['interpreta · condiciona', 'qué dijo la Corte sobre cada artículo que aplicas', P.verdePastel, P.verde],
                      ['reitera · unifica · se aparta', 'la cadena de precedente hasta la providencia vigente', P.moradoPastel, P.morado],
                    ] as const
                  ).map(([arista, efecto, pastel, color]) => (
                    <li key={arista} style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <code
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color,
                          background: pastel,
                          borderRadius: 999,
                          padding: '4px 12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {arista}
                      </code>
                      <span style={{ fontSize: 14, color: P.textoSuave, lineHeight: 1.5 }}>{efecto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </Revela>

        {/* ── Garantías anti-alucinación ── */}
        <Revela style={{ marginTop: 110 }}>
          <section id="garantias">
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em', maxWidth: 660 }}>
              En derecho no hay margen para inventar. La arquitectura lo impide.
            </h2>
            <div
              style={{
                marginTop: 32,
                display: 'grid',
                gap: 28,
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              }}
            >
              {GARANTIAS.map(([titulo, texto]) => (
                <div key={titulo} style={{ display: 'flex', gap: 16, borderTop: `1px solid ${P.borde}`, paddingTop: 22 }}>
                  <span
                    style={{
                      marginTop: 5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: P.verdePastel,
                      flexShrink: 0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M2.5 6.2 L5 8.7 L9.5 3.5" stroke={P.verde} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{titulo}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.75, color: P.textoSuave }}>{texto}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ margin: '28px 0 0', fontSize: 14.5, color: P.textoSuave, maxWidth: 760, lineHeight: 1.7 }}>
              Además, cada cambio de modelo, prompt o corpus pasa por una batería de casos
              validados por abogados antes de llegar a producción. Si baja la precisión de las
              citas, no se publica.
            </p>
          </section>
        </Revela>

        {/* ── Productos ── */}
        <Revela style={{ marginTop: 110 }}>
          <section id="productos">
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em', maxWidth: 660, fontFamily: "'Newsreader', serif" }}>
              Tres productos, un mismo expediente.
            </h2>
            <p style={{ margin: '14px 0 0', fontSize: 15.5, lineHeight: 1.7, color: P.textoSuave, maxWidth: 600 }}>
              Hoy existe el frontend del Radicador contra datos de prueba y un backend parcial.
              Así está cada producto, sin adelantar lo que aún no está construido.
            </p>
            <div
              style={{
                marginTop: 28,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              {PRODUCTOS.map((p) => (
                <div
                  key={p.nombre}
                  style={{
                    flex: '1 1 300px',
                    borderRadius: 24,
                    background: p.pastel,
                    padding: '22px 26px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: p.color }}>{p.nombre}</p>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: p.color,
                        background: '#fff',
                        borderRadius: 999,
                        padding: '3px 10px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.estado}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.65, color: P.textoSuave }}>{p.detalle}</p>
                </div>
              ))}
            </div>
          </section>
        </Revela>

        {/* ── Ventajas injustas ── */}
        <Revela style={{ marginTop: 110 }}>
          <section id="ventajas">
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em', maxWidth: 640, fontFamily: "'Newsreader', serif" }}>
              Ventajas injustas.
            </h2>
            <p style={{ margin: '14px 0 0', fontSize: 15.5, lineHeight: 1.7, color: P.textoSuave, maxWidth: 600 }}>
              Tres decisiones de arquitectura que la competencia basada solo en la nube no puede
              igualar sin reescribirse desde cero.
            </p>
            <div
              style={{
                marginTop: 32,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
              }}
            >
              {VENTAJAS.map((v) => (
                <div
                  key={v.titulo}
                  style={{
                    borderRadius: 22,
                    border: `1px solid ${P.borde}`,
                    background: '#fff',
                    padding: '22px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: v.pastel,
                      color: v.color,
                      flexShrink: 0,
                    }}
                  >
                    {v.icono}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{v.titulo}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 14.5, lineHeight: 1.7, color: P.textoSuave }}>{v.detalle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Revela>

        {/* ── Nosotros ── */}
        <Revela style={{ marginTop: 110 }}>
          <section id="nosotros" style={{ maxWidth: 860, margin: '0 auto' }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, textAlign: 'center' }}>Nosotros</h2>
            <p style={{ margin: '18px 0 0', fontSize: 15.5, lineHeight: 1.8, color: P.textoSuave }}>
              Somos una empresa colombiana nacida de la convergencia entre el rigor del derecho y
              la frontera de la innovación tecnológica. Nos especializamos en transformar el
              sector jurídico mediante la integración inteligente de múltiples arquitecturas de
              Inteligencia Artificial, diseñadas para optimizar, acelerar y elevar la precisión
              del trabajo legal.
            </p>
            <p style={{ margin: '14px 0 0', fontSize: 15.5, lineHeight: 1.8, color: P.textoSuave }}>
              Entendemos que en el mundo del derecho no hay margen para el error. Por eso
              orquestamos un ecosistema de IA que procesa la información de manera
              multidimensional, garantizando a inspecciones, abogados y departamentos jurídicos
              datos estructurados, análisis profundos y respuestas con fuente verificable.
              Combinamos el entendimiento del contexto local con estándares de ingeniería de
              nivel global.
            </p>
          </section>
        </Revela>

        {/* ── Contacto ── */}
        <Revela style={{ marginTop: 90 }}>
          <section
            id="contacto"
            style={{
              background: P.fondoSuave,
              borderRadius: '32px 32px 0 0',
              padding: 'clamp(28px, 4vw, 48px)',
              display: 'grid',
              gap: 24,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              alignItems: 'start',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: "'Newsreader', serif" }}>Contacto</h2>
              <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.7, color: P.textoSuave, maxWidth: 420 }}>
                ¿Su despacho quiere probar el Radicador o conocer el plan de las demás células?
                Escríbanos y coordinamos una demo.
              </p>
              <a
                href="mailto:contacto@legaltech.com.co?subject=Solicitud%20de%20demo%20LegalTech&body=Nombre%20del%20despacho%3A%0AVertical%20de%20inter%C3%A9s%3A%0AN%C3%BAmero%20de%20contacto%3A%0A"
                style={{ ...botonAzul, marginTop: 20, padding: '11px 26px', fontSize: 14 }}
              >
                Solicitar demo
              </a>
              <p style={{ margin: '20px 0 0', color: P.textoSuave }}>
                Email:{' '}
                <a href="mailto:contacto@legaltech.com.co" style={{ color: P.azul }}>
                  contacto@legaltech.com.co
                </a>
              </p>
              <p style={{ margin: '8px 0 0', color: P.textoSuave }}>Tel: +57 305 390 7634</p>
              <p style={{ margin: '4px 0 0', color: P.textoSuave }}>WP: +57 305 390 7534</p>
              <p style={{ margin: '8px 0 0', color: P.textoSuave }}>
                Facebook:{' '}
                <a
                  href="https://www.facebook.com/legaltTechColombia"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: P.azul }}
                >
                  legaltTechColombia
                </a>
              </p>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Horario de atención</h3>
              <p style={{ margin: '8px 0 0', color: P.textoSuave }}>Lun - Vie: 8:00 - 18:00 (COT)</p>
              <p style={{ margin: '16px 0 0', color: P.textoSuave, lineHeight: 1.7 }}>
                Si nos contactas por WhatsApp, indícanos tu nombre y una breve descripción del
                asunto para agilizar la respuesta.
              </p>
            </div>
          </section>
        </Revela>
      </main>
    </div>
  );
}
