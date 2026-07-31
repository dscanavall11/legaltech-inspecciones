import { CheckSquareFilled, BorderOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Tag } from 'antd';
import { PALETA } from '@/theme/theme';

export interface ChecklistVisualItem {
  key: string;
  label: string;
  done: boolean;
  /** Presente -> ítem tickable por el usuario (checkbox verde). Ausente -> solo indicador de estado en vivo (círculo). */
  onToggle?: (key: string) => void;
}

/**
 * Checklist visual compartido (Task 17): checkboxes verdes tickables cuando
 * el ítem trae `onToggle` (p. ej. verificación humana del comparendo) o
 * círculos de estado en vivo cuando el ítem se deriva de datos ya
 * diligenciados (p. ej. requisitos del fallo, configuración del despacho).
 */
export function ChecklistVisual({
  items,
  showSummary,
}: {
  items: ChecklistVisualItem[];
  /** Chip "N de M completos" sobre la lista. */
  showSummary?: boolean;
}) {
  const completos = items.filter((i) => i.done).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {showSummary && (
        <Tag
          color={items.length > 0 && completos === items.length ? 'success' : 'default'}
          style={{ width: 'fit-content', fontWeight: 600, marginBottom: 2 }}
        >
          {completos} de {items.length} completos
        </Tag>
      )}
      {items.map((item) => (
        <div
          key={item.key}
          onClick={item.onToggle ? () => item.onToggle!(item.key) : undefined}
          role={item.onToggle ? 'checkbox' : undefined}
          aria-checked={item.onToggle ? item.done : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: item.onToggle ? 'pointer' : 'default',
            userSelect: 'none',
          }}
        >
          {item.onToggle ? (
            item.done ? (
              <CheckSquareFilled style={{ color: PALETA.verde, fontSize: 17 }} />
            ) : (
              <BorderOutlined style={{ color: PALETA.textoTenue, fontSize: 17 }} />
            )
          ) : item.done ? (
            <CheckCircleFilled style={{ color: PALETA.verde, fontSize: 15 }} />
          ) : (
            <span
              aria-hidden
              style={{
                width: 13,
                height: 13,
                borderRadius: '50%',
                border: `1.5px solid ${PALETA.borde}`,
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
          )}
          <span
            style={{
              fontSize: 13.5,
              color: item.done ? PALETA.texto : PALETA.textoSuave,
              fontWeight: item.done ? 600 : 400,
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
