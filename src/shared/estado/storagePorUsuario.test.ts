import { beforeEach, describe, expect, it } from 'vitest';
import { useAuth } from '@/shared/auth/auth';
import { crearStoragePorUsuario } from './storagePorUsuario';

// Node (entorno 'node' de vitest, sin jsdom en este archivo) no trae
// `localStorage` global — polyfill mínimo en memoria, suficiente para
// probar el adaptador sin necesitar un DOM real.
if (typeof globalThis.localStorage === 'undefined') {
  const datos = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear(),
    key: (i: number) => [...datos.keys()][i] ?? null,
    get length() {
      return datos.size;
    },
  } as Storage;
}

/**
 * Cada inspector autenticado tiene su propio espacio en localStorage — nunca
 * uno global compartido por todo el que use el mismo navegador. Estas
 * pruebas simulan login/logout directamente sobre `useAuth` (sin backend
 * real) para verificar el aislamiento y la migración de una sola vez.
 */
function login(id: string) {
  useAuth.getState().iniciarSesion({
    status: 'ok',
    message: '',
    username: id,
    accessToken: 't',
    idToken: 't',
    refreshToken: 't',
  });
}

beforeEach(() => {
  localStorage.clear();
  useAuth.getState().cerrarSesion();
});

describe('crearStoragePorUsuario — sin sesión', () => {
  it('getItem devuelve null sin sesión activa (no lee ni migra nada)', () => {
    const storage = crearStoragePorUsuario('prueba-clave');
    localStorage.setItem('prueba-clave', JSON.stringify({ state: { x: 1 }, version: 0 }));
    expect(storage.getItem('prueba-clave')).toBeNull();
  });

  it('setItem y removeItem no hacen nada sin sesión activa', () => {
    const storage = crearStoragePorUsuario('prueba-clave-2');
    storage.setItem('prueba-clave-2', { state: { x: 1 }, version: 0 });
    expect(localStorage.getItem('prueba-clave-2:sin-sesion')).toBeNull();
    expect(Object.keys(localStorage)).not.toContain('prueba-clave-2');
  });
});

describe('crearStoragePorUsuario — aislamiento entre usuarios', () => {
  it('cada usuario lee y escribe su propia clave, nunca la del otro', () => {
    const storage = crearStoragePorUsuario('espacio-prueba');

    login('a@prueba.com');
    storage.setItem('espacio-prueba', { state: { valor: 'DE_A' }, version: 0 });

    login('b@prueba.com');
    expect(storage.getItem('espacio-prueba')).toBeNull(); // B no ve lo que A acaba de guardar
    storage.setItem('espacio-prueba', { state: { valor: 'DE_B' }, version: 0 });

    login('a@prueba.com');
    expect(storage.getItem('espacio-prueba')).toEqual({ state: { valor: 'DE_A' }, version: 0 });

    login('b@prueba.com');
    expect(storage.getItem('espacio-prueba')).toEqual({ state: { valor: 'DE_B' }, version: 0 });
  });
});

describe('crearStoragePorUsuario — migración de una sola vez desde la clave global', () => {
  it('el primer usuario autenticado hereda los datos de la clave global antigua', () => {
    localStorage.setItem('bd-vieja', JSON.stringify({ state: { comparendos: ['legado'] }, version: 0 }));
    const storage = crearStoragePorUsuario('bd-vieja');

    login('primer-usuario@prueba.com');
    expect(storage.getItem('bd-vieja')).toEqual({ state: { comparendos: ['legado'] }, version: 0 });

    // La clave global queda consumida: no sigue disponible para nadie más.
    expect(localStorage.getItem('bd-vieja')).toBeNull();
  });

  it('un segundo usuario, después de consumida la migración, NO hereda los datos del primero', () => {
    localStorage.setItem('bd-vieja-2', JSON.stringify({ state: { comparendos: ['legado'] }, version: 0 }));
    const storage = crearStoragePorUsuario('bd-vieja-2');

    login('primero@prueba.com');
    storage.getItem('bd-vieja-2'); // consume la migración

    login('segundo@prueba.com');
    expect(storage.getItem('bd-vieja-2')).toBeNull(); // arranca vacío, no ve lo del primero
  });

  it('sin clave global previa, el primer usuario simplemente arranca vacío (no inventa datos)', () => {
    const storage = crearStoragePorUsuario('bd-nunca-existio');
    login('cualquiera@prueba.com');
    expect(storage.getItem('bd-nunca-existio')).toBeNull();
  });
});
