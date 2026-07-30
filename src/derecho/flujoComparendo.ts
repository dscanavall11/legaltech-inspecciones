/**
 * Máquina de estados del trámite de un comparendo (orden de comparendo,
 * arts. 180, 222, 223 y 223A de la Ley 1801 de 2016; Decreto 768/2025;
 * Sentencia C-349/2017). Dado el estado actual, indica la próxima actuación
 * procesal para guiar al inspector. La lógica de negocio definitiva y las
 * plantillas las resuelve el backend; aquí modelamos la guía de la interfaz.
 *
 * Espejo exacto (system of record) de la máquina `comparendo` en:
 *   okf-bundles/brains/derecho-policia-convivencia/maquinas-estado.yaml
 * Estados, eventos y textos de guía (mensaje) deben coincidir con ese YAML.
 * Cualquier cambio de proceso se hace primero allí, no aquí.
 *
 * ⚠️ Las reglas procesales deben validarse con el equipo legal.
 */
export type EstadoComparendo =
  | 'recibido'
  | 'verificado'
  | 'en_espera_objecion'
  | 'objetado'
  | 'pronto_pago_acordado'
  | 'conmutacion_acordada'
  | 'sin_objecion'
  | 'audiencia_programada'
  | 'en_audiencia'
  | 'suspendida_pruebas'
  | 'suspendida_inasistencia'
  | 'fallo_emitido'
  | 'en_recurso'
  | 'en_firmeza'
  | 'incumplimiento_constatado'
  | 'terminado_inactividad'
  | 'archivado';

export type AccionComparendoTipo =
  | 'verificar_comparendo'
  | 'abrir_termino_objecion'
  | 'registrar_impugnacion'
  | 'suscribir_acta_pronto_pago'
  | 'suscribir_acta_conmutacion'
  | 'constancia_no_objecion'
  | 'generar_acta_firmeza'
  | 'avocar_y_citar_audiencia'
  | 'reagendar_audiencia'
  | 'instalar_audiencia'
  | 'decretar_pruebas'
  | 'constancia_inasistencia'
  | 'emitir_fallo'
  | 'reanudar_audiencia'
  | 'admitir_justa_causa'
  | 'fallo_por_inasistencia'
  | 'conceder_recursos'
  | 'constancia_ejecutoria'
  | 'resolver_recursos'
  | 'confirmar_pago'
  | 'constancia_incumplimiento_pago'
  | 'confirmar_actividad'
  | 'constancia_incumplimiento_actividad'
  | 'remitir_cobro_coactivo'
  | 'archivar'
  | 'terminar_por_inactividad';

export interface AccionComparendo {
  tipo: AccionComparendoTipo;
  label: string;
  primaria: boolean;
}

export interface PasoFlujoComparendo {
  /** Mensaje que contextualiza en qué punto del trámite está el caso. */
  mensaje: string;
  acciones: AccionComparendo[];
  /** true cuando el caso ya no requiere actuación (archivado). */
  terminal: boolean;
}

export function siguientePasoComparendo(estado: EstadoComparendo): PasoFlujoComparendo {
  switch (estado) {
    case 'recibido':
      return {
        mensaje:
          'Revise el comparendo con el checklist de verificación humana antes de darle trámite (firma del infractor, causal, tipo de multa, datos legibles).',
        acciones: [
          { tipo: 'verificar_comparendo', label: 'Verificar comparendo (checklist)', primaria: true },
        ],
        terminal: false,
      };

    case 'verificado':
      return {
        mensaje:
          'El citado cuenta con tres (3) días hábiles para objetar la orden de comparendo (lit. b, art. 223A, Ley 1801 de 2016) y con cinco (5) días hábiles para el pronto pago con descuento del 50% o solicitar la conmutación (art. 180).',
        acciones: [
          { tipo: 'abrir_termino_objecion', label: 'Abrir término de objeción', primaria: true },
        ],
        terminal: false,
      };

    case 'en_espera_objecion':
      return {
        mensaje:
          'El citado impugnó dentro de los tres (3) días hábiles. Se habilita el proceso verbal abreviado (art. 223). ADVERTENCIA: con la impugnación se pierde el beneficio del descuento por pronto pago.',
        acciones: [
          { tipo: 'registrar_impugnacion', label: 'Registrar impugnación oportuna', primaria: true },
          { tipo: 'suscribir_acta_pronto_pago', label: 'Suscribir acta de pronto pago', primaria: false },
          { tipo: 'suscribir_acta_conmutacion', label: 'Suscribir acta de conmutación', primaria: false },
          { tipo: 'constancia_no_objecion', label: 'Dejar constancia de no objeción', primaria: false },
        ],
        terminal: false,
      };

    case 'objetado':
      return {
        mensaje:
          'Profiera el auto que deja constancia de la impugnación oportuna, avoca conocimiento y fija fecha para audiencia pública dentro del proceso verbal abreviado (art. 223).',
        acciones: [
          { tipo: 'avocar_y_citar_audiencia', label: 'Proferir auto que avoca y fija audiencia', primaria: true },
        ],
        terminal: false,
      };

    case 'pronto_pago_acordado':
      return {
        mensaje:
          'Sin soporte de pago en término: deje constancia del incumplimiento y remita a la Unidad de Recursos Tributarios para cobro coactivo por el valor total.',
        acciones: [
          { tipo: 'confirmar_pago', label: 'Confirmar pago y archivar', primaria: true },
          {
            tipo: 'constancia_incumplimiento_pago',
            label: 'Constancia de incumplimiento de pronto pago',
            primaria: false,
          },
        ],
        terminal: false,
      };

    case 'conmutacion_acordada':
      return {
        mensaje:
          'Verifique Sispaz; sin constancia de asistencia, la multa queda en firme por el valor total y se remite a cobro coactivo.',
        acciones: [
          { tipo: 'confirmar_actividad', label: 'Confirmar actividad pedagógica y archivar', primaria: true },
          {
            tipo: 'constancia_incumplimiento_actividad',
            label: 'Constancia de inasistencia a actividad pedagógica',
            primaria: false,
          },
        ],
        terminal: false,
      };

    case 'sin_objecion':
      return {
        mensaje:
          'Vencidos los términos sin objeción ni comparecencia, procede la firmeza por el literal e) del art. 223A: genere el acta de firmeza.',
        acciones: [
          { tipo: 'generar_acta_firmeza', label: 'Generar acta de firmeza', primaria: true },
        ],
        terminal: false,
      };

    case 'audiencia_programada':
      return {
        mensaje:
          'Instale la audiencia. Si el citado asiste: argumentos (máx. 20 min por parte), pruebas y decisión. Espere quince (15) minutos antes de dejar constancia de inasistencia.',
        acciones: [
          { tipo: 'instalar_audiencia', label: 'Instalar audiencia pública', primaria: true },
          { tipo: 'reagendar_audiencia', label: 'Reagendar audiencia', primaria: false },
          { tipo: 'terminar_por_inactividad', label: 'Terminar por inactividad', primaria: false },
        ],
        terminal: false,
      };

    case 'en_audiencia':
      return {
        mensaje:
          'Valore las pruebas bajo sana crítica y los principios de necesidad, razonabilidad y proporcionalidad (art. 223A lit. a; Decreto 768/2025) y profiera decisión motivada, notificada en estrados.',
        acciones: [
          { tipo: 'emitir_fallo', label: 'Emitir fallo en audiencia', primaria: true },
          { tipo: 'decretar_pruebas', label: 'Decretar pruebas y suspender', primaria: false },
          { tipo: 'constancia_inasistencia', label: 'Dejar constancia de inasistencia', primaria: false },
          { tipo: 'terminar_por_inactividad', label: 'Terminar por inactividad', primaria: false },
        ],
        terminal: false,
      };

    case 'suspendida_pruebas':
      return {
        mensaje:
          'Pruebas pertinentes y conducentes se practican en máximo cinco (5) días; la audiencia se reanuda al día siguiente del vencimiento (art. 223 num. 3 lit. c).',
        acciones: [
          { tipo: 'reanudar_audiencia', label: 'Reanudar audiencia', primaria: true },
          { tipo: 'terminar_por_inactividad', label: 'Terminar por inactividad', primaria: false },
        ],
        terminal: false,
      };

    case 'suspendida_inasistencia':
      return {
        mensaje:
          'Suspenda por tres (3) días para que el citado acredite justa causa (caso fortuito o fuerza mayor) de su inasistencia (Sentencia C-349/2017).',
        acciones: [
          { tipo: 'admitir_justa_causa', label: 'Admitir justa causa y reprogramar', primaria: true },
          { tipo: 'fallo_por_inasistencia', label: 'Resolver de fondo por inasistencia', primaria: false },
        ],
        terminal: false,
      };

    case 'fallo_emitido':
      return {
        mensaje:
          'Los recursos se solicitan, conceden y sustentan en la misma audiencia; la apelación se concede en efecto devolutivo.',
        acciones: [
          { tipo: 'conceder_recursos', label: 'Conceder reposición/apelación', primaria: true },
          { tipo: 'constancia_ejecutoria', label: 'Dejar constancia de firmeza', primaria: false },
        ],
        terminal: false,
      };

    case 'en_recurso':
      return {
        mensaje:
          'Recursos concedidos y sustentados en la misma audiencia. Resuelva la reposición y/o apelación para dar firmeza a la decisión.',
        acciones: [
          { tipo: 'resolver_recursos', label: 'Registrar resolución de recursos', primaria: true },
        ],
        terminal: false,
      };

    case 'en_firmeza':
      return {
        mensaje:
          'Si el fallo sancionó: actualice el RNMC (lit. d, art. 223A) y remita a Hacienda para recaudo. Si absolvió: archive sin más.',
        acciones: [
          { tipo: 'archivar', label: 'Ordenar archivo', primaria: true },
        ],
        terminal: false,
      };

    case 'incumplimiento_constatado':
      return {
        mensaje:
          'Se constató el incumplimiento del pronto pago o de la actividad pedagógica acordada. Remita el expediente a cobro coactivo y ordene el archivo.',
        acciones: [
          { tipo: 'remitir_cobro_coactivo', label: 'Remitir a cobro coactivo y archivar', primaria: true },
        ],
        terminal: false,
      };

    case 'terminado_inactividad':
      return {
        mensaje: 'El trámite terminó por inactividad procesal. Ordene el archivo del expediente.',
        acciones: [
          { tipo: 'archivar', label: 'Ordenar archivo', primaria: true },
        ],
        terminal: false,
      };

    case 'archivado':
      return {
        mensaje: 'Expediente archivado. El trámite concluyó.',
        acciones: [],
        terminal: true,
      };
  }
}
