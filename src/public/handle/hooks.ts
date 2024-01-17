import { useState, useEffect, useMemo, useCallback } from 'react';
/**
 *
 * @param 入参按顺序传入kv对phaseName-conditionCount,首个phaseName将作为起始值。
 * @returns [phase, flags' setter&getter Record, resetter]
 */
export function useDTJ<T extends number | string>(
  // ...args: readonly [[defaultPhaseName: T, conditionCount: number], ...[phaseName: T, conditionCount: number][]]
  props: Record<T, number>
): [phase: T, re: Record<T, ((value?: boolean) => boolean)[]>, reset: () => void] {
  const phaseConfig = useMemo(() => Object.entries(props), []) as [T, number][];
  // const phaseConfig = useRef(args);
  const [phaseOrder, setPhaseOrder] = useState(0);
  const [condition, setCondition] = useState(
    () => Object.fromEntries(phaseConfig.map(([phaseName, conditionCount]) => [phaseName, Array(conditionCount).fill(false)])) as Record<T, boolean[]>
  );
  useEffect(() => {
    let nextOrder = phaseOrder;
    while (nextOrder + 1 < phaseConfig.length && condition[phaseConfig[nextOrder][0]].every((e) => e)) ++nextOrder;
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
  }, []) as Record<T, ((value?: boolean) => boolean)[]>;
  const resetter = useCallback(() => {
    for (const arr of Object.values<boolean[]>(condition)) arr.fill(false);
    setPhaseOrder(0);
  }, []);
  return [phaseConfig[phaseOrder][0], re, resetter];
}
