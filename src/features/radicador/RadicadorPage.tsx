import { useEffect, useState } from 'react';
import { Card, Typography } from 'antd';
import {
  FileTextOutlined,
  SafetyCertificateOutlined,
  FileOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { VIA_PROCESAL_LABEL, TERMINOS } from '@/derecho';
import { PALETA, ELEVACION } from '@/theme/theme';
import { MVP } from '@/app/mvp';

const { Title, Text } = Typography;

interface TarjetaRadicadorProps {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  termino: string;
  via: string;
  destino: string;
  colorIcono: string;
  colorFondo: string;
}

function TarjetaRadicador({ icono, titulo, descripcion, termino, via, destino, colorIcono, colorFondo }: TarjetaRadicadorProps) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  return (
    <Card
      variant="borderless"
      style={{
        boxShadow: hover ? ELEVACION.media : ELEVACION.base,
        height: '100%',
        cursor: 'pointer',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(destino)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: colorFondo,
            color: colorIcono,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          {icono}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Title level={4} style={{ margin: 0, fontSize: 18 }}>
            {titulo}
          </Title>
          <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
            {descripcion}
          </Text>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: PALETA.azulOscuro, background: PALETA.azulSuave, padding: '2px 10px', borderRadius: 999 }}>
              {via}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: PALETA.textoSuave, fontSize: 13 }}>
            <span>Término: </span>
            <span style={{ fontWeight: 500, color: PALETA.texto }}>{termino}</span>
          </div>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Ver formulario
          </Text>
          <RightOutlined style={{ color: PALETA.textoTenue, fontSize: 12 }} />
        </div>
      </div>
    </Card>
  );
}

export function RadicadorPage() {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
  }, []);

  const tarjetas = [
    {
      icono: <FileTextOutlined />,
      titulo: 'Querella',
      descripcion: 'Perturbación a la posesión, ruido, espacio público, amenazas. Tramite conversacional con asistente IA.',
      termino: `${TERMINOS.querellaDias} días hábiles`,
      via: VIA_PROCESAL_LABEL.verbal_abreviado,
      destino: '/panel/nuevo-caso?tipo=querella',
      colorIcono: '#1a73e8',
      colorFondo: '#eef3fc',
    },
    {
      icono: <MessageOutlined />,
      titulo: 'Queja',
      descripcion: 'Conductas contrarias a la convivencia sin perturbación posesoria. Tramite conversacional simplificado.',
      termino: `${TERMINOS.quejaDias} días hábiles`,
      via: VIA_PROCESAL_LABEL.verbal_abreviado,
      destino: '/panel/nuevo-caso?tipo=queja',
      colorIcono: '#1e8e3e',
      colorFondo: '#e6f4ea',
    },
    {
      icono: <SafetyCertificateOutlined />,
      titulo: 'Acta de firmeza',
      descripcion: 'Constancia de firmeza de multa general (art. 223A Ley 1801). Importación desde PDF comparendo o BD Excel.',
      termino: '5 días hábiles (art. 223A)',
      via: 'Acta administrativa',
      destino: '/panel/actas-firmeza',
      colorIcono: '#d93025',
      colorFondo: '#fce8e6',
    },
    {
      icono: <FileOutlined />,
      titulo: 'Apelación',
      descripcion: 'Recurso de apelación contra resolución de primera instancia. Subida de documento + formulario breve.',
      termino: '3 días hábiles (art. 223 num. 4)',
      via: 'Recurso de apelación',
      destino: '/panel/radicar/apelacion',
      colorIcono: '#f9ab00',
      colorFondo: '#fff8e1',
    },
    {
      icono: <CheckCircleOutlined />,
      titulo: 'Fallo (2.ª instancia)',
      descripcion: 'Resolución de segunda instancia / fallo de alzada. Subida de documento + formulario breve.',
      termino: 'Según resolución recurrida',
      via: 'Fallo de alzada',
      destino: '/panel/radicar/fallo',
      colorIcono: '#9334e6',
      colorFondo: '#f3e8fd',
    },
  ];

  return (
    <div className="vista-animada">
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ marginBottom: 4 }}>
          Radicador
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Centro unificado para radicar los 5 tipos de solicitudes de inspección de policía.
          Seleccione el tipo para iniciar el trámite correspondiente.
        </Text>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {tarjetas.map((t, i) => (
          <div
            key={t.titulo}
            style={{
              opacity: animating ? 1 : 0,
              transform: animating ? 'translateY(0)' : 'translateY(8px)',
              transition: `opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms`,
            }}
          >
            <TarjetaRadicador {...t} />
          </div>
        ))}
      </div>

      {!MVP && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${PALETA.borde}` }}>
          <Title level={3} style={{ marginBottom: 16 }}>
            Módulos diferidos (ocultos en MVP)
          </Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {['Normas nacionales', 'Archivo digital', 'Análisis IA', 'Procesos', 'Audiencias', 'Medidas correctivas'].map((m) => (
              <span
                key={m}
                style={{
                  background: '#f1f3f4',
                  color: PALETA.textoSuave,
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {m}
              </span>
            ))}
          </div>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 12 }}>
            Estos módulos permanecen montados en el router (deep-links funcionan) pero se ocultan del menú
            y el dashboard mientras el flag <code>MVP = true</code>.
          </Text>
        </div>
      )}
    </div>
  );
}