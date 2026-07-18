import type { ReactNode } from 'react';
import { GlassTile } from '@/shared/components/glass/GlassPanel';
import { PALETA } from '@/theme/theme';

interface LaunchpadTileProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function LaunchpadTile({ icon, label, onClick }: LaunchpadTileProps) {
  return (
    <GlassTile
      onClick={onClick}
      padding="20px 12px"
      radius={20}
      accent={PALETA.azul}
      elevation="level2"
      role="button"
      aria-label={label}
      tabIndex={0}
      style={{ width: 132, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
    >
      <span style={{ fontSize: 28, color: PALETA.azul }}>{icon}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: PALETA.texto,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </GlassTile>
  );
}