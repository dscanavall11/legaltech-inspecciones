import { http, HttpResponse, delay } from 'msw';
import {
  querellasMock,
  querellasDetalleMock,
  audienciasMock,
  quejasMock,
  quejasDetalleMock,
  RESPUESTA_IA_DEMO,
} from './data';
import type { Querella } from '@/features/querellas/types';
import type { Queja } from '@/features/quejas/types';

const API = import.meta.env.VITE_API_BASE_URL ?? '/api';

/**
 * Handlers de MSW. Definen el contrato de la API que el backend Spring deberá
 * cumplir. Cuando exista el backend real, basta poner VITE_ENABLE_MOCKS=false.
 */
export const handlers = [
  // Listado de querellas
  http.get(`${API}/querellas`, async () => {
    await delay(400); // simula latencia de red
    return HttpResponse.json(querellasMock);
  }),

  // Crear una nueva querella
  http.post(`${API}/querellas`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Partial<Querella>;
    const consecutivo = 200 + querellasMock.length;
    const nueva: Querella = {
      id: `q-${crypto.randomUUID().slice(0, 8)}`,
      radicado: `2026-${String(consecutivo).padStart(5, '0')}`,
      querellante: body.querellante ?? '',
      querellado: body.querellado ?? '',
      asunto: body.asunto ?? '',
      estado: 'radicada',
      fechaRadicacion: new Date().toISOString().slice(0, 10),
      diasTermino: body.diasTermino ?? 15,
    };
    querellasMock.unshift(nueva);
    querellasDetalleMock[nueva.id] = {
      ...nueva,
      direccionInmueble: (body as { direccionInmueble?: string }).direccionInmueble,
      actuaciones: [
        {
          id: `${nueva.id}-a1`,
          fecha: nueva.fechaRadicacion,
          tipo: 'radicacion',
          titulo: 'Radicación de la querella',
          descripcion: `Se recibe querella de ${nueva.querellante} contra ${nueva.querellado}.`,
        },
      ],
    };
    return HttpResponse.json(nueva, { status: 201 });
  }),

  // Agenda de audiencias
  http.get(`${API}/audiencias`, async () => {
    await delay(350);
    return HttpResponse.json(audienciasMock);
  }),

  // Detalle de una querella (incluye actuaciones del expediente)
  http.get(`${API}/querellas/:id`, async ({ params }) => {
    await delay(300);
    const detalle = querellasDetalleMock[params.id as string];
    if (!detalle) {
      return HttpResponse.json(
        { message: 'Querella no encontrada' },
        { status: 404 },
      );
    }
    return HttpResponse.json(detalle);
  }),

  // ── Quejas ──────────────────────────────────────────────────────────────

  http.get(`${API}/quejas`, async () => {
    await delay(400);
    return HttpResponse.json(quejasMock);
  }),

  http.post(`${API}/quejas`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Partial<Queja>;
    const consecutivo = 60 + quejasMock.length;
    const nueva: Queja = {
      id: `qj-${crypto.randomUUID().slice(0, 8)}`,
      radicado: `2026-QJ-${String(consecutivo).padStart(3, '0')}`,
      quejoso: body.quejoso ?? '',
      acusado: body.acusado ?? '',
      asunto: body.asunto ?? '',
      categoria: body.categoria ?? 'otro',
      estado: 'radicada',
      fechaRadicacion: new Date().toISOString().slice(0, 10),
      diasTermino: body.diasTermino ?? 10,
    };
    quejasMock.unshift(nueva);
    quejasDetalleMock[nueva.id] = {
      ...nueva,
      descripcionHechos: (body as { descripcionHechos?: string }).descripcionHechos ?? '',
      actuaciones: [
        {
          id: `${nueva.id}-a1`,
          fecha: nueva.fechaRadicacion,
          tipo: 'radicacion',
          titulo: 'Radicación de la queja',
          descripcion: `Se recibe queja presentada por ${nueva.quejoso} contra ${nueva.acusado}.`,
        },
      ],
    };
    return HttpResponse.json(nueva, { status: 201 });
  }),

  http.get(`${API}/quejas/:id`, async ({ params }) => {
    await delay(300);
    const detalle = quejasDetalleMock[params.id as string];
    if (!detalle) {
      return HttpResponse.json({ message: 'Queja no encontrada' }, { status: 404 });
    }
    return HttpResponse.json(detalle);
  }),

  // Asistente IA: respuesta en streaming token-a-token (simula Spring AI)
  http.post(`${API}/ai/chat`, async () => {
    const palabras = RESPUESTA_IA_DEMO.split(' ');
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for (const palabra of palabras) {
          controller.enqueue(encoder.encode(palabra + ' '));
          await delay(35);
        }
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }),
];
