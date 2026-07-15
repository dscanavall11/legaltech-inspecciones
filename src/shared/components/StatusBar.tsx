import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/auth/auth';
import { DESPACHO } from '@/derecho';
import { PALETA } from '@/theme/theme';

export function StatusBar() {
  const usuario = useAuth((s) => s.usuario);
  const [hora, setHora] = useState(() => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const id = setInterval(() => setHora(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })), 60_000);
    return () => clearInterval(id);
  }, []);

  const segmentos = [
    usuario?.despacho ?? DESPACHO.nombre,
    `Término más próximo: 3 días hábiles`,
    `Cola pendiente: 0`,
    'Agente IA: activo',
    hora,
  ];

  return (
    <div
      style={{
        height: 28,
        background: PALETA.superficie,
        borderTop: `1px solid ${PALETA.borde}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 0,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11.5,
        color: PALETA.textoSuave,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {segmentos.map((s, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && <span style={{ margin: '0 8px', color: PALETA.textoTenue }}>·</span>}
          {s}
        </span>
      ))}
    </div>
  );
}
