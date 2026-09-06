// @vitest-environment jsdom
import { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Prueba de aislamiento (Fase 3, Issue #1 de inspecciones-redesign): al cambiar
 * de expediente, ningun useState local de un paso debe sobrevivir. En
 * AreaTrabajoExpediente esto se logra con `key={casoId}` en el contenedor que
 * envuelve `paso.render(caso)` (ver AreaTrabajoExpediente.tsx). Este test no
 * monta el componente real (arrastraria React Query, router y AntD) -- prueba
 * el mismo mecanismo de React (key -> remount -> estado limpio) de forma
 * aislada, que es lo unico que necesitamos verificar.
 */
function PasoConEstadoLocal() {
  const [borrador, setBorrador] = useState('');
  return (
    <input
      aria-label="borrador"
      value={borrador}
      onChange={(e) => setBorrador(e.target.value)}
    />
  );
}

function AreaDeTrabajoSimulada({ casoId, conKey }: { casoId: string; conKey: boolean }) {
  return conKey ? (
    <div key={casoId}>
      <PasoConEstadoLocal />
    </div>
  ) : (
    <div>
      <PasoConEstadoLocal />
    </div>
  );
}

afterEach(cleanup);

describe('aislamiento de estado local al cambiar de expediente', () => {
  it('con key={casoId}: cambiar de expediente limpia el estado local del paso', () => {
    const { rerender } = render(<AreaDeTrabajoSimulada casoId="caso-a" conKey />);
    const input = screen.getByLabelText('borrador');
    fireEvent.change(input, { target: { value: 'texto sin guardar de A' } });
    expect(screen.getByLabelText<HTMLInputElement>('borrador').value).toBe('texto sin guardar de A');

    rerender(<AreaDeTrabajoSimulada casoId="caso-b" conKey />);

    expect(screen.getByLabelText<HTMLInputElement>('borrador').value).toBe('');
  });

  it('sin key: el estado local del paso anterior sobrevive al cambio (la fuga que se corrige)', () => {
    const { rerender } = render(<AreaDeTrabajoSimulada casoId="caso-a" conKey={false} />);
    const input = screen.getByLabelText('borrador');
    fireEvent.change(input, { target: { value: 'texto sin guardar de A' } });

    rerender(<AreaDeTrabajoSimulada casoId="caso-b" conKey={false} />);

    // Sin key, React reutiliza la misma instancia del input -- el valor de A
    // se ve en la pantalla de B. Este test documenta el bug que key={casoId} evita.
    expect(screen.getByLabelText<HTMLInputElement>('borrador').value).toBe('texto sin guardar de A');
  });
});
