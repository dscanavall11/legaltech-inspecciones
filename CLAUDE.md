# Instrucciones permanentes para Claude Code — inspecciones-redesign

## Objetivo
Claude Code actúa como implementador técnico del frontend LegalTech. ChatGPT dirige la arquitectura funcional/jurídica y audita propuestas y cambios a través de GitHub.

## Regla operativa
Gabriel no debe actuar como mensajero entre ChatGPT y Claude. GitHub es el canal de coordinación.

Antes de trabajar, Claude debe leer:
1. el Issue activo;
2. los comentarios recientes del Issue;
3. el PR activo, si existe;
4. cualquier especificación o instrucción estable del repositorio.

## Flujo obligatorio
1. Trabajar siempre en una rama específica de la fase; no trabajar directamente sobre `main` ni sobre una rama base compartida.
2. No mezclar cambios locales ajenos o pendientes con una nueva fase sin preservarlos primero de forma segura.
3. Si se pide propuesta técnica previa, publicarla en el Issue y esperar revisión antes de codificar.
4. Implementar solo el alcance autorizado.
5. Ejecutar build y pruebas razonables.
6. Abrir PR al terminar una fase y documentar cambios, pruebas, riesgos y dependencias.
7. No hacer merge sin autorización expresa después de la revisión de ChatGPT.

## Protocolo permanente de revisión ChatGPT
Al terminar cualquier propuesta, corrección o implementación que requiera revisión de ChatGPT, Claude debe publicar en el Issue o PR correspondiente un comentario final con este marcador exacto en una línea independiente:

`READY_FOR_CHATGPT_REVIEW`

Debajo del marcador debe incluir:
- enlace o referencia al Issue/PR revisable;
- rama y último commit, si existe;
- resumen corto de lo completado;
- pruebas ejecutadas y resultado;
- bloqueos, riesgos o preguntas pendientes;
- declaración expresa de que no hizo merge, salvo autorización previa.

No publicar el marcador si el trabajo sigue incompleto. El marcador significa que la etapa está lista para auditoría de ChatGPT.

Después de publicarlo, Claude debe esperar revisión antes de hacer merge o avanzar a la siguiente fase, salvo instrucción expresa en sentido contrario.

## Reglas de arquitectura frontend
- Reutilizar componentes, rutas, servicios y estado existentes cuando sea razonable.
- No crear una segunda aplicación paralela.
- Mantener `caseId` como frontera de aislamiento del expediente activo.
- Ningún estado local, formulario, caché temporal, archivo pendiente o selección debe contaminar otro `caseId`.
- Un expediente `FINALIZADO` debe mostrarse en solo lectura; el backend sigue siendo la defensa definitiva.
- `legaltech-tools` mantiene almacenamiento técnico/binario; `legalcase` mantiene trazabilidad jurídica del expediente.
- No inventar contratos de backend. Si falta un endpoint o el contrato real difiere, documentarlo antes de implementar workarounds.

## Proceso actual
El trabajo activo es Querellas — Fase 3: Mis procesos, Nueva querella y aislamiento de contexto. Consultar el Issue #1 de este repositorio y sus comentarios antes de cualquier cambio relacionado.
