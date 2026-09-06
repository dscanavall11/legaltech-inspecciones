import { describe, expect, it } from 'vitest';
import { queryStringContexto } from './queryStringContexto';

describe('queryStringContexto', () => {
  it('sin contexto no arma query string', () => {
    expect(queryStringContexto({})).toBe('');
  });

  it('con contexto parcial solo aparecen las claves presentes', () => {
    expect(queryStringContexto({ workspaceId: 'w1' })).toBe('?workspaceId=w1');
    expect(queryStringContexto({ inspectorId: 'i1' })).toBe('?inspectorId=i1');
  });

  it('con contexto completo aparecen las tres claves', () => {
    expect(queryStringContexto({ workspaceId: 'w1', instanceId: 'n1', inspectorId: 'i1' })).toBe(
      '?workspaceId=w1&instanceId=n1&inspectorId=i1',
    );
  });
});
