import type { ReactNode } from 'react';
import { PALETA, ELEVACION } from '@/theme/theme';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

interface LaunchpadTileProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function LaunchpadTile({ icon, label, onClick }: LaunchpadTileProps) {
  const reducirTransparencia = usePrefersReducedTransparency();

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        width: 132,
        padding: '20px 12px',
        borderRadius: 20,
        border: `1px solid ${PALETA.borde}`,
        background: reducirTransparencia ? PALETA.superficie : 'rgba(255,255,255,0.85)',
        backdropFilter: reducirTransparencia ? 'none' : undefined,
        boxShadow: ELEVACION.base,
        cursor: 'pointer',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = ELEVACION.media;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = ELEVACION.base;
      }}
    >
      <span style={{ fontSize: 28, color: PALETA.azul }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: PALETA.texto, textAlign: 'center' }}>
        {label}
      </span>
    </button>
  );
}
