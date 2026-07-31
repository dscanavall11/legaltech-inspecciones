import { http, HttpResponse, delay } from 'msw';
import { uid } from '@/shared/util/uid';
import {
  querellasMock,
  querellasDetalleMock,
  audienciasMock,
  quejasMock,
  quejasDetalleMock,
  comparendosLegalCaseMock,
  querellasLegalCaseMock,
  quejasLegalCaseMock,
  RESPUESTA_IA_DEMO,
} from './data';
import type { Querella } from '@/features/querellas/types';
import type { Queja } from '@/features/quejas/types';
import type { LegalCase } from '@/shared/legalCases/types';
import {
  legalCasesMock,
  legalCaseDetailMock,
  nationalNormsMock,
  nationalNormDetailMock,
  ANALISIS_IA_DEMO,
} from './dataLegacy';
import { fallosMock } from './dataFallos';
import { CHECKLIST_DESPACHO_NODE_MOCK, TEMPLATE_RESOLUTION_MOCK } from './dataChecklistDespacho';

const API = import.meta.env.VITE_API_BASE_URL ?? '/api';

// In-memory store para radiaciones y actas
const radiacionesMock: Array<{
  id: string;
  tipo: 'querella' | 'queja' | 'acta_firmeza' | 'apelacion' | 'fallo';
  radicado: string;
  fechaRadicacion: string;
  estado: string;
  radicadoOrigen?: string;
  partes?: string;
  fechaDecision?: string;
  sustento?: string;
  documentos?: Array<{ nombre: string; tipo: string }>;
}> = [];

const actasMock: Array<{
  id: string;
  estado: 'pendiente' | 'generada' | 'revisada' | 'expedida';
  datos: any;
}> = [];

// querellasLegalCaseMock/quejasLegalCaseMock (ver data.ts) espejan
// querellasDetalleMock/quejasDetalleMock como LegalCase para que los
// handlers genéricos de /legal-cases (find-by-criteria, :id, PATCH
// state/fields) no devuelvan vacío/404 cuando el caseType consultado es
// "querella" o "queja" en vez de "comparendo".
const legalCasesStore = (): LegalCase[] => [
  ...comparendosLegalCaseMock,
  ...querellasLegalCaseMock,
  ...quejasLegalCaseMock,
];

/**
 * Handlers de MSW. Definen el contrato de la API que el backend Spring deberá
 * cumplir. Cuando exista el backend real, basta poner VITE_ENABLE_MOCKS=false.
 */
export const handlers = [
  // ── Autenticación (mock del microservicio real de auth) ─────────────────
  // Cualquier correo/contraseña funciona en modo demo.
  http.post(`${API}/public/auth/login`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { username?: string };
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Login exitoso (mock)',
      username: body.username ?? 'demo@legaltech.com.co',
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      mfaRequired: false,
    });
  }),

  http.post(`${API}/public/auth/register`, async () => {
    await delay(600);
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Registro exitoso (mock). Ya puedes iniciar sesión.',
    });
  }),

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
      id: `q-${uid().slice(0, 8)}`,
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

  // Programar una audiencia para un caso que aún no tiene fecha
  http.post(`${API}/audiencias`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as { querellaId?: string; fecha?: string };
    const querella = querellasMock.find((q) => q.id === body.querellaId);
    if (!querella || !body.fecha) {
      return HttpResponse.json({ message: 'querellaId y fecha son requeridos' }, { status: 400 });
    }
    const nueva = {
      id: `aud-${uid().slice(0, 8)}`,
      querellaId: querella.id,
      radicado: querella.radicado,
      fecha: body.fecha,
      asunto: querella.asunto,
      querellante: querella.querellante,
      querellado: querella.querellado,
    };
    audienciasMock.push(nueva);
    querella.estado = 'audiencia_programada';
    return HttpResponse.json(nueva, { status: 201 });
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
      id: `qj-${uid().slice(0, 8)}`,
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

  // ── Comparendos — recurso genérico /legal-cases (caseType="comparendo") ──
  // A diferencia de querellas/quejas (legacy /querellas y /quejas arriba),
  // comparendos consume directamente src/shared/legalCases/api.ts, así que
  // estos handlers mockean el contrato real caseType-agnóstico. Aditivo: no
  // toca los handlers legacy de querellas/quejas ni el /legal-cases plano
  // (dataLegacy) usado por CasosPage. legalCasesStore() (arriba) combina
  // comparendo/querella/queja para que este recurso genérico también
  // resuelva esos caseTypes bajo mocks.

  http.get(`${API}/legal-cases/find-by-criteria`, async ({ request }) => {
    await delay(350);
    const url = new URL(request.url);
    const caseType = url.searchParams.get('caseType');
    const state = url.searchParams.get('state');
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 50);

    let lista = legalCasesStore();
    if (caseType) lista = lista.filter((c) => c.caseType === caseType);
    if (state) lista = lista.filter((c) => c.currentStateCode === state);
    if (search) lista = lista.filter((c) => c.filingNumber.toLowerCase().includes(search));

    const content = lista.slice(page * size, page * size + size);
    return HttpResponse.json({
      content,
      page,
      size,
      totalElements: lista.length,
      totalPages: Math.max(1, Math.ceil(lista.length / size)),
      last: (page + 1) * size >= lista.length,
    });
  }),

  http.get(`${API}/legal-cases/:id`, async ({ params }) => {
    await delay(300);
    const caso = legalCasesStore().find((c) => c.id === params.id);
    if (!caso) return HttpResponse.json({ message: 'Expediente no encontrado' }, { status: 404 });
    return HttpResponse.json(caso);
  }),

  // Solo crea expedientes caseType="comparendo" (único flujo de alta vía este
  // recurso genérico hoy); querella/queja se radican por POST /querellas y
  // /quejas arriba, cuyos handlers ya mantienen su propio mock legacy.
  http.post(`${API}/legal-cases`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Partial<LegalCase> & { caseType: string };
    const now = new Date().toISOString();
    const consecutivo = comparendosLegalCaseMock.length + 1;
    const nuevo: LegalCase = {
      id: `cp-${uid().slice(0, 8)}`,
      createdAt: now,
      filingNumber: `2026-CP-${String(consecutivo).padStart(4, '0')}`,
      judicialOfficeId: body.judicialOfficeId ?? '',
      caseType: body.caseType,
      rulingDate: null,
      venueCity: body.venueCity ?? '',
      evidenceAssessment: null,
      legalReasoning: null,
      currentStateCode: 'recibido',
      caseMetadata: body.caseMetadata ?? null,
      background: body.background ?? null,
      ruling: null,
      parties: body.parties ?? [],
      stateHistory: [
        { stateCode: 'recibido', stateName: null, changedAt: now, reason: 'Radicación del comparendo' },
      ],
    };
    comparendosLegalCaseMock.unshift(nuevo);
    return HttpResponse.json(nuevo, { status: 201 });
  }),

  http.patch(`${API}/legal-cases/:id/state`, async ({ params, request }) => {
    await delay(350);
    const caso = legalCasesStore().find((c) => c.id === params.id);
    if (!caso) return HttpResponse.json({ message: 'Expediente no encontrado' }, { status: 404 });
    const { state } = (await request.json()) as { state: string };
    caso.currentStateCode = state;
    caso.stateHistory = [
      ...caso.stateHistory,
      { stateCode: state, stateName: null, changedAt: new Date().toISOString(), reason: null },
    ];
    return HttpResponse.json({ id: caso.id, currentState: state, withinFlow: true, warnings: [] });
  }),

  http.patch(`${API}/legal-cases/:id/fields`, async ({ params, request }) => {
    await delay(350);
    const caso = legalCasesStore().find((c) => c.id === params.id);
    if (!caso) return HttpResponse.json({ message: 'Expediente no encontrado' }, { status: 404 });
    const fields = (await request.json()) as Partial<LegalCase>;
    Object.assign(caso, fields);
    return HttpResponse.json(caso);
  }),

  // ── Microservicios migrados del frontend Angular ─────────────────────────

  // legalcase: expedientes recientes — BFF devuelve PagedResponseDTO
  http.get(`${API}/legal-cases`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 10);
    const content = legalCasesMock.slice(page * size, page * size + size);
    return HttpResponse.json({
      content,
      totalElements: legalCasesMock.length,
      totalPages: Math.ceil(legalCasesMock.length / size),
      page,
      size,
    });
  }),

  http.get(`${API}/legal-cases/filing-number/:filingNumber`, async ({ params }) => {
    await delay(350);
    const detalle = legalCaseDetailMock[decodeURIComponent(params.filingNumber as string)];
    if (!detalle) {
      return HttpResponse.json({ message: 'Expediente no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(detalle);
  }),

  // legalbases: normas nacionales paginadas estilo Spring Data
  http.get(`${API}/national-norms`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 10);
    const sortDir = url.searchParams.get('sortDir') ?? 'asc';

    let lista = nationalNormsMock.filter(
      (n) =>
        !search ||
        n.title.toLowerCase().includes(search) ||
        n.type.toLowerCase().includes(search) ||
        String(n.id).includes(search),
    );
    lista = [...lista].sort((a, b) =>
      sortDir === 'asc'
        ? a.publishedAt.localeCompare(b.publishedAt)
        : b.publishedAt.localeCompare(a.publishedAt),
    );

    const content = lista.slice(page * size, page * size + size);
    return HttpResponse.json({
      content,
      totalElements: lista.length,
      totalPages: Math.max(1, Math.ceil(lista.length / size)),
      page,
      size,
    });
  }),

  http.get(`${API}/national-norms/:id`, async ({ params }) => {
    await delay(300);
    const detalle = nationalNormDetailMock[params.id as string];
    if (!detalle) {
      return HttpResponse.json({ message: 'Norma no encontrada' }, { status: 404 });
    }
    return HttpResponse.json(detalle);
  }),

  // legalbases: registro en el archivo digital (multipart)
  http.post(`${API}/national-norms/save`, async () => {
    await delay(700);
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Documento registrado en el archivo digital (mock).',
      id: `arch-${uid().slice(0, 8)}`,
    });
  }),

  // legal/orchestrator: análisis clínico con historial (multipart)
  http.post(`${API}/legal/analize-with-history`, async () => {
    await delay(1200);
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Análisis completado',
      data: ANALISIS_IA_DEMO,
    });
  }),

  // Resumen lateral de documentos (tier suave, vía BFF /api/legal/summarize)
  http.post(`${API}/legal/summarize`, async () => {
    await delay(1400);
    return HttpResponse.json({
      success: true,
      message: 'Resumen generado.',
      data: {
        resumen:
          'El Despacho declara probada la perturbación a la posesión sobre el inmueble de la calle 45 y ordena al querellado el cese definitivo de la obra. Se impone la restitución de la servidumbre de paso en un término de diez días hábiles.',
        acapites: [
          { titulo: 'Hechos', sintesis: 'Construcción irregular que invade la servidumbre de paso desde enero de 2026.' },
          { titulo: 'Consideraciones', sintesis: 'La inspección ocular y los testimonios acreditan la perturbación.' },
          { titulo: 'Resuelve', sintesis: 'Cese de la obra y restitución en diez días hábiles.' },
        ],
        razonesDePeso: [
          'La inspección ocular constató la invasión material de la servidumbre.',
          'El querellado no aportó licencia ni permiso que ampare la obra.',
          'Los testimonios de los vecinos son contestes y no fueron desvirtuados.',
        ],
        normasCitadas: ['Ley 1801 de 2016, art. 77', 'Ley 1801 de 2016, art. 223'],
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // ── Fallos ───────────────────────────────────────────────────────────────

  http.get(`${API}/fallos`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const estado = url.searchParams.get('estado') ?? '';
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 20);

    let lista = [...fallosMock];
    if (search) {
      lista = lista.filter(
        (f) =>
          f.radicado.toLowerCase().includes(search) ||
          f.querellante.toLowerCase().includes(search) ||
          f.querellado.toLowerCase().includes(search) ||
          f.comportamiento.toLowerCase().includes(search),
      );
    }
    if (estado) {
      lista = lista.filter((f) => f.estado === estado);
    }
    const content = lista.slice(page * size, page * size + size);
    return HttpResponse.json({
      content,
      totalElements: lista.length,
      totalPages: Math.max(1, Math.ceil(lista.length / size)),
      page,
      size,
    });
  }),

  http.get(`${API}/fallos/:id`, async ({ params }) => {
    await delay(300);
    const fallo = fallosMock.find((f) => f.id === params.id);
    if (!fallo) return HttpResponse.json({ message: 'Fallo no encontrado' }, { status: 404 });
    return HttpResponse.json(fallo);
  }),

  // ── Radicaciones unificadas (MVP) ───────────────────────────────────────
  // POST /radicaciones — radicar querella, queja, acta, apelación, fallo
  http.post(`${API}/radicaciones`, async ({ request }) => {
    await delay(600);
    const contentType = request.headers.get('content-type') ?? '';
    let body: any = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        tipo: formData.get('tipo'),
        radicadoOrigen: formData.get('radicadoOrigen'),
        partes: formData.get('partes'),
        fechaDecision: formData.get('fechaDecision'),
        sustento: formData.get('sustento'),
        documentos: formData.getAll('documentos'),
      };
    } else {
      body = await request.json();
    }

    const tipo = body.tipo ?? 'querella';
    const consecutivo = radiacionesMock.length + 1;
    const now = new Date().toISOString().slice(0, 10);

    let radicado: string;
    let estadoInicial: string;
    let item: any;

    switch (tipo) {
      case 'apelacion':
        radicado = `2026-AP-${String(consecutivo).padStart(4, '0')}`;
        estadoInicial = 'radicada';
        item = {
          id: `rad-${uid().slice(0, 8)}`,
          tipo: 'apelacion',
          radicado,
          fechaRadicacion: now,
          estado: estadoInicial,
          radicadoOrigen: body.radicadoOrigen,
          partes: body.partes,
          fechaDecision: body.fechaDecision,
          sustento: body.sustento,
          documentos: Array.isArray(body.documentos) ? body.documentos.map((f: File) => ({ nombre: f.name, tipo: f.type })) : [],
        };
        break;
      case 'fallo':
        radicado = `2026-F2-${String(consecutivo).padStart(4, '0')}`;
        estadoInicial = 'radicada';
        item = {
          id: `rad-${uid().slice(0, 8)}`,
          tipo: 'fallo',
          radicado,
          fechaRadicacion: now,
          estado: estadoInicial,
          radicadoOrigen: body.radicadoOrigen,
          partes: body.partes,
          fechaDecision: body.fechaDecision,
          sustento: body.sustento,
          documentos: Array.isArray(body.documentos) ? body.documentos.map((f: File) => ({ nombre: f.name, tipo: f.type })) : [],
        };
        break;
      case 'acta_firmeza':
        radicado = `2026-AF-${String(consecutivo).padStart(4, '0')}`;
        estadoInicial = 'pendiente';
        item = {
          id: `rad-${uid().slice(0, 8)}`,
          tipo: 'acta_firmeza',
          radicado,
          fechaRadicacion: now,
          estado: estadoInicial,
          ...body,
        };
        break;
      default:
        radicado = `2026-${String(200 + consecutivo).padStart(5, '0')}`;
        estadoInicial = 'radicada';
        item = {
          id: `rad-${uid().slice(0, 8)}`,
          tipo,
          radicado,
          fechaRadicacion: now,
          estado: estadoInicial,
          ...body,
        };
    }

    radiacionesMock.unshift(item);

    // Si es acta_firmeza, también crear entrada en actasMock para la cola
    if (tipo === 'acta_firmeza') {
      actasMock.push({
        id: item.id,
        estado: 'pendiente',
        datos: body.datosActa ?? {},
      });
    }

    return HttpResponse.json(
      { id: item.id, radicado: item.radicado, fechaRadicacion: item.fechaRadicacion, estado: item.estado },
      { status: 201 },
    );
  }),

  // GET /radicaciones — listar radiaciones con filtro por tipo
  http.get(`${API}/radicaciones`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo');
    let lista = radiacionesMock;
    if (tipo) {
      lista = lista.filter((r) => r.tipo === tipo);
    }
    return HttpResponse.json(lista);
  }),

  // PATCH /actas/:id/estado — cambiar estado de acta (pendiente → generada → revisada → expedida)
  http.patch(`${API}/actas/:id/estado`, async ({ params, request }) => {
    await delay(400);
    const { estado } = (await request.json()) as { estado: 'pendiente' | 'generada' | 'revisada' | 'expedida' };
    const acta = actasMock.find((a) => a.id === params.id);
    if (!acta) {
      return HttpResponse.json({ message: 'Acta no encontrada' }, { status: 404 });
    }
    acta.estado = estado;
    const rad = radiacionesMock.find((r) => r.id === params.id);
    if (rad) rad.estado = estado;
    return HttpResponse.json({ id: acta.id, estado: acta.estado });
  }),

  // GET /actas — listar actas con filtro por estado
  http.get(`${API}/actas`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    let lista = actasMock;
    if (estado) {
      lista = lista.filter((a) => a.estado === estado);
    }
    return HttpResponse.json(lista);
  }),

  // POST /actas/lote — generar actas en lote desde comparendos vencidos
  http.post(`${API}/actas/lote`, async ({ request }) => {
    await delay(800);
    const body = (await request.json()) as { comparendos: Array<{ comparendo: string; solicitado: string; cedula: string; fechaComparendo: string; tipoMulta: number; causal: string }> };
    const now = new Date().toISOString().slice(0, 10);
    const generadas = body.comparendos.map((c, i) => {
      const id = `act-lote-${uid().slice(0, 8)}`;
      const radicado = `2026-AF-L${String(i + 1).padStart(4, '0')}`;
      const item = {
        id,
        tipo: 'acta_firmeza' as const,
        radicado,
        fechaRadicacion: now,
        estado: 'pendiente',
      };
      radiacionesMock.unshift(item);
      actasMock.push({
        id,
        estado: 'pendiente',
        datos: c,
      });
      return item;
    });
    return HttpResponse.json({ generadas: generadas.length, items: generadas }, { status: 201 });
  }),

  // ── Recepción de caso: agente de radicación ────────────────────────────────
  // Simula un agente especializado en Ley 1801/2016 que guía el intake turn-a-turn.
  // La respuesta incluye marcadores <case_update>{json}</case_update> que el frontend
  // extrae para poblar la ficha de radicación en tiempo real.
  http.post(`${API}/intake/chat`, async ({ request }) => {
    const body = (await request.json()) as { mensaje: string; turno: number; tipo?: string };
    const { mensaje, turno, tipo } = body;
    const msg = mensaje.toLowerCase();

    // ── Radicación de Apelación / Fallo (2ª instancia) ──────────────────────
    if (tipo === 'apelacion' || tipo === 'fallo') {
      const esApelacion = tipo === 'apelacion';
      const termino = esApelacion
        ? '3 días hábiles (art. 223 num. 4 Ley 1801/2016)'
        : 'Según la resolución recurrida';
      let respuesta: string;

      if (turno === 0) {
        const upd = JSON.stringify({
          radicadoOrigen: '',
          partes: '',
          sustento: '',
        });
        respuesta =
          `Iniciaremos la ${esApelacion ? 'apelación' : 'radicación del fallo de segunda instancia'}. ` +
          `Cuénteme: ¿cuál es el **radicado de la decisión de primera instancia** y quiénes son las **partes** (querellante / querellado)?\n\n` +
          `Término: ${termino}.\n<case_update>${upd}</case_update>`;
      } else if (turno === 1) {
        const upd = JSON.stringify({ radicadoOrigen: mensaje.trim() });
        respuesta = `Radicado de origen registrado: **${mensaje.trim()}**.\n\nAhora indíqueme el **nombre completo de las partes** y, si la conoce, la **fecha de la decisión recurrida**.\n<case_update>${upd}</case_update>`;
      } else if (turno === 2) {
        const upd = JSON.stringify({ partes: mensaje.trim() });
        respuesta = `Partes registradas: **${mensaje.trim()}**.\n\nA continuación redactaré la **fundamentación jurídica** a partir de los hechos. ` +
          `Pulse **"IA: redactar fundamentación"** y revisaré el borrador en el panel derecho.\n<case_update>${upd}</case_update>`;
      } else if (msg.includes('fundamentación') || msg.startsWith('fundamentacion')) {
        const fundamentacion =
          `${esApelacion ? 'FUNDAMENTACIÓN:' : 'FUNDAMENTACIÓN (fallo 2ª instancia):'} ` +
          `La decisión recurrida vulnera el debido proceso y la valoración probatoria consagrada en los ` +
          `artículos 77 y 92 de la Ley 1801 de 2016. En virtud del artículo 223A ibídem, corresponde a esta ` +
          `Segunda Instancia confirmar, modificar o revocar lo resuelto, garantizando el derecho de defensa de ` +
          `las partes. Lo anterior con sustento en la inspección ocular y los medios de prueba documentales ` +
          `aportados al expediente.`;
        const upd = JSON.stringify({ sustento: fundamentacion });
        respuesta = `${fundamentacion}\n\nRevise el texto en la ficha y ajústelo si lo considera necesario antes de radicar.\n<case_update>${upd}</case_update>`;
      } else {
        respuesta = `Los datos están casi completos. Use el botón **"IA: redactar fundamentación"** para generar ` +
          `la sustentación jurídica, o indíqueme más hechos para complementarla.`;
      }

      const palabras = respuesta.split(' ');
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for (const p of palabras) {
            controller.enqueue(encoder.encode(p + ' '));
            await delay(28);
          }
          controller.close();
        },
      });
      return new HttpResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }


    let respuesta: string;

    if (turno === 0) {
      if (
        msg.includes('posesión') || msg.includes('posesion') ||
        msg.includes('vecino') || msg.includes('garaje') ||
        msg.includes('cerramiento') || msg.includes('paso') ||
        msg.includes('muro') || msg.includes('inmueble') ||
        msg.includes('construcción') || msg.includes('construccion')
      ) {
        const upd = JSON.stringify({
          tipo: 'querella',
          viaProcesal: 'verbal_abreviado',
          comportamiento: 'Perturbación a la posesión — interferencia con el acceso o uso del inmueble',
          articuloInfringido: 'Art. 77 Ley 1801 de 2016',
          proximoPaso: 'Citar a audiencia dentro de los 5 días hábiles siguientes a la radicación (Art. 223 Ley 1801/2016)',
        });
        respuesta = `Lo que describe corresponde a una **perturbación a la posesión** contemplada en el artículo 77 del Código Nacional de Seguridad y Convivencia Ciudadana (Ley 1801 de 2016).\n\nEl trámite aplicable es el **Proceso Verbal Abreviado**.\n\nPara radicar la querella necesito los datos de las partes. ¿Me indica el nombre completo del **querellante** — la persona que presenta la solicitud?\n<case_update>${upd}</case_update>`;
      } else if (
        msg.includes('ruido') || msg.includes('música') || msg.includes('musica') ||
        msg.includes('escándalo') || msg.includes('escandalo') ||
        msg.includes('bulla') || msg.includes('sonido') || msg.includes('bocina')
      ) {
        const upd = JSON.stringify({
          tipo: 'querella',
          viaProcesal: 'verbal_abreviado',
          comportamiento: 'Perturbación a la tranquilidad — ruido excesivo en horario de descanso',
          articuloInfringido: 'Art. 33 Ley 1801 de 2016',
          proximoPaso: 'Citar a audiencia dentro de los 5 días hábiles (Art. 223 Ley 1801/2016)',
        });
        respuesta = `Lo que describe corresponde a **perturbación a la tranquilidad** según el artículo 33 de la Ley 1801 de 2016. Se tramita por **Proceso Verbal Abreviado**.\n\n¿Cuál es el nombre completo del **querellante**?\n<case_update>${upd}</case_update>`;
      } else if (
        msg.includes('espacio') || msg.includes('andén') || msg.includes('anden') ||
        msg.includes('basura') || msg.includes('escombros') || msg.includes('residuos')
      ) {
        const upd = JSON.stringify({
          tipo: 'querella',
          viaProcesal: 'verbal_abreviado',
          comportamiento: 'Perturbación por uso indebido del espacio público o arrojo de residuos',
          articuloInfringido: 'Art. 92 Ley 1801 de 2016',
          proximoPaso: 'Citar a audiencia dentro de los 5 días hábiles (Art. 223 Ley 1801/2016)',
        });
        respuesta = `Lo que describe corresponde a **uso indebido del espacio público** o **arrojo de residuos** según los artículos 92 y 140 de la Ley 1801 de 2016. Trámite: **Proceso Verbal Abreviado**.\n\n¿Cuál es el nombre completo del **querellante**?\n<case_update>${upd}</case_update>`;
      } else {
        respuesta = `Entendido. Para clasificar correctamente esta solicitud, ¿podría describir con mayor precisión qué tipo de comportamiento se reporta?\n\nPor ejemplo: ruido excesivo, conflicto de vecinos, construcción irregular, ocupación de andén, amenazas verbales, entre otros.`;
      }
    } else if (turno === 1) {
      const nombre = mensaje.trim();
      const upd = JSON.stringify({ querellante: nombre });
      respuesta = `Registrado como querellante: **${nombre}**.\n\n¿Cuál es el nombre completo del **querellado** — la persona contra quien se dirige la solicitud?\n<case_update>${upd}</case_update>`;
    } else if (turno === 2) {
      const nombre = mensaje.trim();
      const upd = JSON.stringify({ querellado: nombre });
      respuesta = `Perfecto. Querellado registrado: **${nombre}**.\n\nLa ficha está lista para radicar. Si cuenta con **pruebas documentales** (fotografías, PDF o escritos), adjúntelas con el clip para que queden radicadas con el expediente.\n\nRevise los datos en el panel derecho y presione **"Radicar caso"** para crear el expediente y continuar con la citación a audiencia.\n<case_update>${upd}</case_update>`;
    } else {
      respuesta = `Los datos están completos. Una vez radicado el caso, la parte querellada será notificada y citada a audiencia conforme al artículo 223 de la Ley 1801 de 2016.\n\n¿Desea agregar alguna **anotación adicional** antes de radicar?`;
    }

    const palabras = respuesta.split(' ');
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const p of palabras) {
          controller.enqueue(encoder.encode(p + ' '));
          await delay(28);
        }
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }),

  // ── Configuración del Despacho (Task 12) — nodo OKF + resolución de plantillas ──
  // Task 5/7 backend real vive en legalcase (KnowledgeNodeController,
  // TemplateResolutionController); la orchestrator BFF aún no expone
  // passthrough para estas dos rutas — se verifica/añade en Task 13.

  http.get(`${API}/knowledge-nodes/:conceptId`, async ({ params }) => {
    await delay(300);
    if (params.conceptId !== CHECKLIST_DESPACHO_NODE_MOCK.conceptId) {
      return HttpResponse.json({ message: 'Nodo de conocimiento no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(CHECKLIST_DESPACHO_NODE_MOCK);
  }),

  // workspaceId/instanceId/inspectorId son opcionales en el backend real
  // (cascada inspector -> oficina -> sistema); el mock devuelve la misma
  // demo sin importar qué combinación llegó, para que la página sea
  // demostrable incluso cuando el workspace de la microsite no resuelve
  // (ver resolveWorkspaceContext, sin handler mockeado hoy).
  http.get(`${API}/template-resolution`, async () => {
    await delay(350);
    return HttpResponse.json(TEMPLATE_RESOLUTION_MOCK);
  }),

  // Asistente IA: respuesta en streaming token-a-token (simula Spring AI /legal/chat)
  http.post(`${API}/legal/chat`, async () => {
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