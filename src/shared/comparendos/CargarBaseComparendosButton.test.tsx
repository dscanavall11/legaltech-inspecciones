// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import * as XLSX from 'xlsx';
import { CargarBaseComparendosButton } from './CargarBaseComparendosButton';
import { useComparendosStore } from './store';
import { useAuth } from '@/shared/auth/auth';

/**
 * Prueba del reemplazo completo de la base de comparendos: valida antes de
 * borrar (nunca toca la base activa hasta que el inspector confirma),
 * cancelar no cambia nada, y una carga inválida deja la base anterior
 * intacta con un registro de auditoría "FALLIDA".
 */

/**
 * El `File` de jsdom en este entorno no implementa `.arrayBuffer()` (sí lo
 * hace cualquier navegador real — así se probó ya en Playwright). Se
 * construye un objeto mínimo con esa única API que el código realmente usa,
 * en vez de depender del polyfill incompleto de jsdom.
 */
function archivoXlsx(nombre: string, filas: Record<string, unknown>[]): File {
  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Comparendos');
  const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return { name: nombre, arrayBuffer: async () => buffer } as unknown as File;
}

function filaValida(over: Record<string, unknown> = {}) {
  return {
    Proceso: '2026-1',
    Comparendo: '17-001-1',
    Solicitado: 'CIUDADANO PRUEBA',
    'Cedula Solicitado': '1000000001',
    'Direccion Solicitado': 'CALLE 1',
    'Telefono Solicitado': '3000000001',
    'Lugar del comportamiento': 'CALLE 1',
    'Fecha Comparendo': 'veinticuatro (24) de abril de dos mil veintiséis (2026)',
    Solicitante: 'CAI PRUEBA',
    'Articulo Y Numeral': 'Artículo 27 Numeral 6',
    'Descripcion de la conducta': 'Portar armas...',
    'Hechos (descripcion comportamientos)': 'Se aborda al ciudadano.',
    'Tipo de multa': 4,
    'Apelo SI/NO': 'NO',
    Reincidente: 'NO',
    ...over,
  };
}

function renderBoton() {
  return render(
    <AntdApp>
      <CargarBaseComparendosButton />
    </AntdApp>,
  );
}

function inputArchivo(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

async function seleccionarArchivo(archivo: File) {
  const input = inputArchivo();
  Object.defineProperty(input, 'files', { value: [archivo], configurable: true });
  fireEvent.change(input);
}

// jsdom no implementa matchMedia; el <Modal> de antd lo usa para su breakpoint
// responsivo. Sin este stub, el Modal nunca termina de montar en la prueba
// (aunque sí funciona en un navegador real, ya probado con Playwright).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  useAuth.getState().iniciarSesion({
    status: 'ok',
    message: '',
    username: 'inspector.prueba@legaltech.com.co',
    accessToken: 't',
    idToken: 't',
    refreshToken: 't',
    fullName: 'Inspector de Prueba',
  });
  useComparendosStore.setState({
    comparendos: [{ comparendo: '17-001-viejo', solicitado: 'ANTERIOR', causal: 'ninguna' } as never],
    cargadaEn: '2026-01-01T00:00:00.000Z',
    archivoActivo: 'BASE_VIEJA.xlsx',
    historialCargas: [
      { nombreArchivo: 'BASE_VIEJA.xlsx', fechaHora: '2026-01-01T00:00:00.000Z', usuario: 'x', numeroRegistros: 1, estado: 'ACTIVA' },
    ],
  });
});

afterEach(() => {
  cleanup();
  useAuth.getState().cerrarSesion();
});

describe('CargarBaseComparendosButton — reemplazo completo, validar antes de borrar', () => {
  it('muestra la base activa actual (nombre, registros)', () => {
    renderBoton();
    expect(screen.getByText('BASE_VIEJA.xlsx')).toBeTruthy();
    expect(screen.getByText(/Registros: 1/)).toBeTruthy();
  });

  it('archivo válido: muestra resumen y confirmación ANTES de tocar la base activa', async () => {
    renderBoton();
    await seleccionarArchivo(archivoXlsx('nueva.xlsx', [filaValida(), filaValida({ Comparendo: '17-001-2', Proceso: '2026-2' })]));

    await waitFor(() => expect(screen.getByText('Reemplazar base de comparendos')).toBeTruthy());
    expect(screen.getByText(/Esta acción reemplazará la base actualmente cargada/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'CANCELAR' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'REEMPLAZAR BASE' })).toBeTruthy();

    // La base activa NO cambió todavía — solo se validó en memoria (staging).
    expect(useComparendosStore.getState().archivoActivo).toBe('BASE_VIEJA.xlsx');
    expect(useComparendosStore.getState().comparendos).toHaveLength(1);
  });

  it('cancelar no cambia nada', async () => {
    renderBoton();
    await seleccionarArchivo(archivoXlsx('nueva.xlsx', [filaValida()]));
    await waitFor(() => expect(screen.getByText('Reemplazar base de comparendos')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'CANCELAR' }));

    // Lo que importa: cancelar no reemplaza nada en la base activa (el cierre
    // visual del modal es una animación de antd, no parte de esta prueba).
    expect(useComparendosStore.getState().archivoActivo).toBe('BASE_VIEJA.xlsx');
    expect(useComparendosStore.getState().comparendos).toHaveLength(1);
    expect(useComparendosStore.getState().historialCargas).toHaveLength(1); // no se agregó nada
  });

  it('confirmar REEMPLAZAR BASE sustituye completamente la base anterior y dice el historial', async () => {
    renderBoton();
    await seleccionarArchivo(
      archivoXlsx('nueva.xlsx', [filaValida(), filaValida({ Comparendo: '17-001-2', Proceso: '2026-2' })]),
    );
    await waitFor(() => expect(screen.getByText('Reemplazar base de comparendos')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'REEMPLAZAR BASE' }));

    await waitFor(() => expect(useComparendosStore.getState().archivoActivo).toBe('nueva.xlsx'));
    const estado = useComparendosStore.getState();
    expect(estado.comparendos).toHaveLength(2); // reemplazo completo, no acumula con el registro viejo
    expect(estado.comparendos.some((c) => c.comparendo === '17-001-viejo')).toBe(false);
    expect(estado.historialCargas.find((h) => h.nombreArchivo === 'BASE_VIEJA.xlsx')?.estado).toBe('REEMPLAZADA');
    expect(estado.historialCargas.find((h) => h.nombreArchivo === 'nueva.xlsx')?.estado).toBe('ACTIVA');
    expect(estado.historialCargas.find((h) => h.nombreArchivo === 'nueva.xlsx')?.usuario).toBe('Inspector de Prueba');
  });

  it('archivo sin registros válidos (columnas obligatorias faltantes): NO borra la base anterior, deja auditoría FALLIDA', async () => {
    renderBoton();
    // Sin columna "Comparendo": todas las filas se descartan -> 0 registros válidos.
    await seleccionarArchivo(archivoXlsx('invalida.xlsx', [{ Proceso: '2026-1', Solicitado: 'X' }]));

    await waitFor(() => expect(screen.queryByText('Reemplazar base de comparendos')).toBeNull());
    const estado = useComparendosStore.getState();
    expect(estado.archivoActivo).toBe('BASE_VIEJA.xlsx'); // intacta
    expect(estado.comparendos).toHaveLength(1);
    const fallida = estado.historialCargas.find((h) => h.nombreArchivo === 'invalida.xlsx');
    expect(fallida?.estado).toBe('FALLIDA');
  });

  it('archivo no legible (no es un .xlsx real): rollback — la base activa queda intacta', async () => {
    renderBoton();
    const archivoCorrupto = {
      name: 'corrupto.xlsx',
      arrayBuffer: async () => new TextEncoder().encode('esto no es un xlsx').buffer,
    } as unknown as File;
    await seleccionarArchivo(archivoCorrupto);

    await waitFor(() => {
      const fallida = useComparendosStore.getState().historialCargas.find((h) => h.nombreArchivo === 'corrupto.xlsx');
      expect(fallida?.estado).toBe('FALLIDA');
    });
    const estado = useComparendosStore.getState();
    expect(estado.archivoActivo).toBe('BASE_VIEJA.xlsx');
    expect(estado.comparendos).toHaveLength(1);
  });
});
