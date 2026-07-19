import type { ReactNode } from 'react';
import { PALETA } from '@/theme/theme';

interface LaunchpadTileProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

/** Tile plano — sin vidrio individual; el fondo del Launchpad ya lleva el blur. */
export function LaunchpadTile({ icon, label, onClick }: LaunchpadTileProps) {
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
        borderRadius: 12,
        border: `1px solid ${PALETA.borde}`,
        background: PALETA.superficie,
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(60,64,67,.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{ fontSize: 26, color: PALETA.azul }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: PALETA.texto, textAlign: 'center' }}>
        {label}
      </span>
    </button>
  );
}
