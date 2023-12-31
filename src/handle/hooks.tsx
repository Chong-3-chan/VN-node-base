import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
/**
 *
 * @param 按顺序传入[phaseName,conditionCount],第一个phaseName将作为起始值。
 * @returns [phase, flags' setter&getter Record, reset]
 */
export function useDTJ<T extends number | string>(
  ...args: readonly [[defaultPhaseName: T, conditionCount: number], ...[phaseName: T, conditionCount: number][]]
): [phase: T, re: Record<T, ((value?: boolean) => boolean)[]>, reset: () => void] {
  const phaseConfig = useRef(args);
  const [phaseOrder, setPhaseOrder] = useState(0);
  const [condition, setCondition] = useState(() =>
    Object.fromEntries<boolean[]>(phaseConfig.current.map(([phaseName, conditionCount]) => [phaseName, Array(conditionCount).fill(false)]))
  );
  useEffect(() => {
    let nextOrder = phaseOrder;
    while (nextOrder + 1 < phaseConfig.current.length && condition[phaseConfig.current[nextOrder][0]].every((e) => e)) ++nextOrder;
    nextOrder !== phaseOrder && setPhaseOrder(nextOrder);
  }, [condition]);
  const re = useMemo(() => {
    return Object.fromEntries(
      Object.entries<boolean[]>(condition).map(([phaseName, phaseConditions]) => {
        return [
          phaseName,
          phaseConditions.map((e, i) => {
            return (value?: boolean) => {
              if (value === void 0) return phaseConditions[i];
              phaseConditions[i] = value;
              setCondition({ ...condition });
              return phaseConditions[i];
            };
          }),
        ];
      })
    );
  }, []);
  const reset = useCallback(() => {
    for (const arr of Object.values(condition)) arr.fill(false);
    setPhaseOrder(0);
  }, []);
  return [phaseConfig.current[phaseOrder][0], re as Record<T, ((value?: boolean) => boolean)[]>, reset];
}
