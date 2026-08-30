import { Alert, Button, Checkbox, Input, Skeleton, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useCaseEvidence } from '@/shared/pruebas/api';
import { EVIDENCE_TYPE_LABEL } from '@/shared/pruebas/types';
import { LEYENDA_AUTOGUARDADO, useAutoguardadoMetadata } from '@/shared/legalCases/useAutoguardadoMetadata';
import { hechosSinRespaldo, leerMatriz, pruebasHuerfanas, type Hecho, type MatrizProbatoria } from './matriz';
import { uid } from '@/shared/util/uid';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;

export interface MatrizHechosPruebasProps {
  caseId: string;
  /** caseMetadata crudo del expediente: se fusiona, nunca se reemplaza entero. */
  caseMetadataRaw?: string | null;
}

function nuevoHecho(): Hecho {
  return { id: uid(), enunciado: '', pruebaIds: [] };
}

/**
 * Matriz hechos ↔ pruebas: art. 2.2.8.18.7.1 numeral 5 obliga a valorar la
 * prueba, y el numeral 2 prohíbe dar por ciertos hechos sin respaldo. El
 * inspector redacta cada hecho aquí mismo y marca qué prueba lo sostiene;
 * ./matriz.ts calcula qué queda sin respaldo y qué prueba nadie usó.
 */
export function MatrizHechosPruebas({ caseId, caseMetadataRaw }: MatrizHechosPruebasProps) {
  const { data: pruebas, isLoading, isError } = useCaseEvidence(caseId);
  const { valor: matriz, setValor: setMatriz, estado } = useAutoguardadoMetadata<MatrizProbatoria>({
    caseId,
    caseMetadataRaw,
    clave: 'matrizProbatoria',
    leer: leerMatriz,
  });

  function agregarHecho() {
    setMatriz({ hechos: [...matriz.hechos, nuevoHecho()] });
  }

  function actualizarEnunciado(id: string, enunciado: string) {
    setMatriz({ hechos: matriz.hechos.map((h) => (h.id === id ? { ...h, enunciado } : h)) });
  }

  function alternarPrueba(hechoId: string, pruebaId: string) {
    setMatriz({
      hechos: matriz.hechos.map((h) =>
        h.id === hechoId
          ? {
              ...h,
              pruebaIds: h.pruebaIds.includes(pruebaId)
                ? h.pruebaIds.filter((id) => id !== pruebaId)
                : [...h.pruebaIds, pruebaId],
            }
          : h,
      ),
    });
  }

  function eliminarHecho(id: string) {
    setMatriz({ hechos: matriz.hechos.filter((h) => h.id !== id) });
  }

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 4 }} />;
  }

  if (isError) {
    return <Alert type="error" showIcon message="No se pudieron cargar las pruebas del expediente." style={{ marginTop: 4 }} />;
  }

  const listaPruebas = pruebas ?? [];
  const sinRespaldo = hechosSinRespaldo(matriz);
  const huerfanas = pruebasHuerfanas(matriz, listaPruebas);

  return (
    <div style={{ marginTop: 4 }}>
      <Text type="secondary" style={{ fontSize: TEXTO.nota, display: 'block', marginBottom: 12 }}>
        Todo hecho del relato debe quedar sostenido por al menos una prueba (art. 2.2.8.18.7.1,
        numeral 2). Redacte el hecho y marque qué prueba lo respalda.
      </Text>

      {listaPruebas.length === 0 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12, borderRadius: 14 }}
          message="El expediente aún no tiene pruebas registradas."
          description="Regístrelas en la pestaña Pruebas antes de armar la matriz."
        />
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${PALETA.borde}`, minWidth: 240 }}>
                  Hecho
                </th>
                {listaPruebas.map((p) => (
                  <th
                    key={p.id}
                    title={EVIDENCE_TYPE_LABEL[p.evidenceType]}
                    style={{ padding: '8px 6px', borderBottom: `1px solid ${PALETA.borde}`, fontWeight: 400 }}
                  >
                    <Tag style={{ fontFamily: 'monospace', margin: 0 }}>{p.identifier}</Tag>
                  </th>
                ))}
                <th style={{ borderBottom: `1px solid ${PALETA.borde}` }} />
              </tr>
            </thead>
            <tbody>
              {matriz.hechos.length === 0 ? (
                <tr>
                  <td colSpan={listaPruebas.length + 2} style={{ padding: '16px 10px', textAlign: 'center' }}>
                    <Text type="secondary">Sin hechos todavía. Agregue el primero.</Text>
                  </td>
                </tr>
              ) : (
                matriz.hechos.map((h) => (
                  <tr key={h.id}>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${PALETA.borde}` }}>
                      <Input.TextArea
                        value={h.enunciado}
                        onChange={(e) => actualizarEnunciado(h.id, e.target.value)}
                        placeholder="Enunciado del hecho"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                      />
                    </td>
                    {listaPruebas.map((p) => (
                      <td key={p.id} style={{ textAlign: 'center', padding: '6px', borderBottom: `1px solid ${PALETA.borde}` }}>
                        <Checkbox
                          checked={h.pruebaIds.includes(p.id)}
                          onChange={() => alternarPrueba(h.id, p.id)}
                          aria-label={`${p.identifier} sostiene el hecho`}
                        />
                      </td>
                    ))}
                    <td style={{ borderBottom: `1px solid ${PALETA.borde}` }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => eliminarHecho(h.id)}
                        aria-label="Eliminar hecho"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Button icon={<PlusOutlined />} onClick={agregarHecho} style={{ marginBottom: 16 }}>
        + Agregar hecho
      </Button>

      {sinRespaldo.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 10, borderRadius: 14 }}
          message={`${sinRespaldo.length} hecho(s) sin ninguna prueba que los respalde`}
          description={sinRespaldo.map((h) => h.enunciado || '(sin enunciado)').join(' · ')}
        />
      )}
      {huerfanas.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 10, borderRadius: 14 }}
          message={`${huerfanas.length} prueba(s) del expediente sin vincular a ningún hecho`}
          description={huerfanas.map((p) => p.identifier).join(', ')}
        />
      )}

      <Text type={estado === 'error' ? 'danger' : 'secondary'} style={{ fontSize: TEXTO.nota }}>
        {LEYENDA_AUTOGUARDADO[estado]}
      </Text>
    </div>
  );
}
