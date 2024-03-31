/* eslint-disable jsx-a11y/alt-text */
import { FC, useEffect, useState, useRef, useMemo, useLayoutEffect, Fragment, useCallback } from 'react';
import { SentenceState } from '../../data/data';
import { getSrc } from '../../data/getData';
import { deepClone, classNames } from '../../public/handle';
import { useDTJ } from '../../public/handle/hooks';
import { MainPhase } from '../../public/MainP';
import './CharaBox.less';
export type CharaBoxProps = {
  charas: SentenceState['charas'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
  forceUseLastState: boolean;
};
export enum CharaBoxPhase {
  out = 'out', // 有->无
  in = 'in', // 无->有
  transform = 'transform', // 有->有
  move = 'move',
  done = 'done',
}
export const CharaBox: FC<CharaBoxProps> = ({ charas, flags: [init, done], phase, forceUseLastState }) => {
  const doneFlag = done(),
    initFlag = init(),
    updateDone = () => done(true),
    updateInit = () => init(true),
    acting = phase === MainPhase.act;
  const [
    charaBoxPhase,
    {
      [CharaBoxPhase.out]: [outDone],
      [CharaBoxPhase.in]: [inDone],
      [CharaBoxPhase.transform]: [transformDone],
      [CharaBoxPhase.move]: [moveDone],
      [CharaBoxPhase.done]: [],
    },
    reset,
  ] = useDTJ<CharaBoxPhase>({
    [CharaBoxPhase.out]: 1,
    [CharaBoxPhase.in]: 1,
    [CharaBoxPhase.transform]: 1,
    [CharaBoxPhase.move]: 1,
    [CharaBoxPhase.done]: 0,
  });
  useEffect(() => {
    // 在CharaBoxPhase流转到done时，向mainPhase同步
    if (!doneFlag && charaBoxPhase === CharaBoxPhase.done) updateDone();
  }, [charaBoxPhase]);

  const [lastCharas, setLastCharas] = useState<typeof charas>({});

  const lastCharasSrcRef = useRef<Record<string, string>>({});
  const coverSrc = useMemo(() => {
    const re: any = {};
    charas &&
      Object.entries(charas).forEach(([k, v]) => {
        if (v === null) return;
        re[k] = getSrc(v.key);
      });
    return re;
  }, [charas]);
  const [moveCount, setMoveCount] = useState(0);
  const AnimationEndMemo = useRef<{
    out: Record<string, boolean>;
    in: Record<string, boolean>;
    transform: Record<string, boolean>;
    move: Record<string, boolean[] & Record<number, boolean>>;
  }>({
    out: {},
    in: {},
    transform: {},
    move: {},
  });
  // 切换sentence时触发mainPhase的reset，startFlag变成false，然后触发charaBox状态初始化，目前包括AnimationEndMemo更新
  const handleInit = useCallback(() => {
    AnimationEndMemo.current.out =
      lastCharas === void 0
        ? {}
        : Object.fromEntries(
            ((charas = {}) => {
              return Object.keys(lastCharas)
                .filter((key) => lastCharas[key] && (!charas[key] || charas[key]?.position !== lastCharas[key]!.position))
                .map((key) => [key, false]);
            })(charas)
          );
    AnimationEndMemo.current.in =
      charas === void 0
        ? {}
        : Object.fromEntries(
            ((lastCharas = {}) => {
              return Object.keys(charas)
                .filter((key) => charas[key] && (!lastCharas[key] || lastCharas[key]?.position !== charas[key]!.position))
                .map((key) => [key, false]);
            })(lastCharas)
          );
    AnimationEndMemo.current.transform =
      charas === void 0 || lastCharas === void 0
        ? {}
        : Object.fromEntries(
            ((lastCharas = {}) => {
              const publicKeys = Object.keys(charas).filter((e) => charas[e] && lastCharas[e]);
              return publicKeys
                .filter((key) => charas[key]!.key !== lastCharas[key]!.key && lastCharas[key]!.position === charas[key]!.position)
                .map((key) => [key, false]);
            })(lastCharas)
          );
    AnimationEndMemo.current.move = {};
    if (charas !== void 0) {
      const moveKeys = Object.keys(charas).filter((key) => charas[key]?.move);
      moveKeys.length && setMoveCount(0);
      moveKeys.forEach((key) => (AnimationEndMemo.current.move[key] = charas[key]!.move!.map(() => false)));
    }
    // console.log('AnimationEndMemo.current', deepClone(AnimationEndMemo.current));
  }, [charas, lastCharas]);

  const handleAnimationEnd = useCallback(
    // eslint-disable-next-line complexity
    (type: keyof typeof AnimationEndMemo.current, key: string, moveKey?: number) => {
      if (type === 'move') {
        // move有两层obj，单独处理（key为charaKey-moveCount）
        if (moveKey === void 0) throw new Error('handleAnimationEnd(): 结束move动画时未提供moveKey');
        if (AnimationEndMemo.current[type][key][moveKey] === void 0) throw new Error('handleAnimationEnd(): 尝试结束未被定义的move动画');
        AnimationEndMemo.current[type][key][moveKey] = true;
        if (
          Object.values(AnimationEndMemo.current.move)
            .map((e) => Object.values(e).every((ee) => ee === true))
            .every((e) => e === true)
        ) {
          moveDone(true);
        } else if (
          Object.values(AnimationEndMemo.current.move)
            .filter((e) => e[moveKey] !== void 0)
            .map((e) => e[moveKey])
            .every((e) => e === true)
        ) {
          setMoveCount(moveKey + 1);
        }
        return;
      }
      if (AnimationEndMemo.current[type][key] === void 0) throw new Error('handleAnimationEnd(): 尝试结束未被定义的动画');
      AnimationEndMemo.current[type][key] = true;
      if (type === 'out') delete lastCharasSrcRef.current[key];
      else if (type === 'in') lastCharasSrcRef.current[key] = coverSrc[key];
      else if (type === 'transform') lastCharasSrcRef.current[key] = coverSrc[key];

      if (Object.values(AnimationEndMemo.current[type]).every((e) => e === true)) {
        if (type === 'out') outDone(true);
        else if (type === 'in') inDone(true);
        else if (type === 'transform') transformDone(true);
      }
    },
    [coverSrc]
  );
  useEffect(() => {
    if (!initFlag) {
      handleInit();
      updateInit();
    }
  });
  useLayoutEffect(() => {
    if (initFlag && acting) {
      reset();
      if (Object.keys(AnimationEndMemo.current.out).length === 0) outDone(true);
      if (Object.keys(AnimationEndMemo.current.in).length === 0) inDone(true);
      if (Object.keys(AnimationEndMemo.current.transform).length === 0) transformDone(true);
      if (Object.keys(AnimationEndMemo.current.move).length === 0) moveDone(true);
    }
  }, [acting, initFlag]);
  // useEffect(() => {
  //   // 在点击跳过动画时，执行所有本应但还未执行的动画结束的回调（handleAnimationEnd）
  //   if (doneFlag) {
  //     (['out', 'in', 'transform'] as (keyof typeof AnimationEndMemo.current)[]).forEach((e) =>
  //       Object.entries(AnimationEndMemo.current[e])
  //         .filter(([k, v]) => v === false)
  //         .forEach(([k]) => handleAnimationEnd(e, k))
  //     );
  //     (['move'] as (keyof typeof AnimationEndMemo.current)[]).forEach((e) =>
  //       Object.entries(AnimationEndMemo.current[e])
  //         .map(
  //           ([k, v]) =>
  //             [
  //               k,
  //               Object.entries(v)
  //                 .filter(([kk, vv]) => vv === false)
  //                 .map(([kk]) => parseInt(kk)),
  //             ] as [string, number[]]
  //         )
  //         .forEach(([k, vvs]) => vvs.forEach((vv) => handleAnimationEnd(e, k, vv)))
  //     );
  //   }
  // }, [doneFlag]);
  useEffect(() => {
    // 没有发生改变时跳过动画阶段
    if (charaBoxPhase === CharaBoxPhase.done) return;
    const flag = ((lastCharas = {}, charas = {}) => {
      const keysArr = Object.keys(lastCharas),
        keysSet = new Set(Object.keys(charas));
      if (keysArr.length !== keysSet.size) return false;
      for (let i = 0; i < keysArr.length; ++i) {
        if (!keysSet.has(keysArr[i])) return false;
      }
      return keysArr.every((k) => {
        const a = lastCharas[k],
          b = charas[k];
        if (a === null) return b === null;
        else if (b === null) return false;
        return a.key === b.key && a.position === b.position && !b.move?.length;
      });
    })(lastCharas, charas); // 比对lastCharas和charas
    flag && [outDone, inDone, transformDone, moveDone].forEach((e) => e(true));
  }, [charaBoxPhase, lastCharas]);
  useEffect(() => {
    // 更新charaBox的chara状态缓存（不包括图像文件数据，图像文件数据的更新在handleAnimationEnd）
    if (inDone() && outDone() && transformDone()) setLastCharas(deepClone(charas));
  }, [inDone(), outDone(), transformDone()]);

  useEffect(() => {
    if (forceUseLastState) {
      handleInit();
      (['out', 'in', 'transform'] as (keyof typeof AnimationEndMemo.current)[]).forEach((e) =>
        Object.entries(AnimationEndMemo.current[e])
          .filter(([k, v]) => v === false)
          .forEach(([k]) => handleAnimationEnd(e, k))
      );
      (['move'] as (keyof typeof AnimationEndMemo.current)[]).forEach((e) =>
        Object.entries(AnimationEndMemo.current[e])
          .map(
            ([k, v]) =>
              [
                k,
                Object.entries(v)
                  .filter(([kk, vv]) => vv === false)
                  .map(([kk]) => parseInt(kk)),
              ] as [string, number[]]
          )
          .forEach(([k, vvs]) => vvs.forEach((vv) => handleAnimationEnd(e, k, vv)))
      );
      setLastCharas(deepClone(charas));
    }
  }, [forceUseLastState, handleAnimationEnd, handleInit]);
  // console.log({
  //   lastCharasSrc: lastCharasSrcRef.current,
  //   coverSrc,
  //   charaBoxPhase,
  //   startFlag: initFlag,
  //   doneFlag,
  //   AnimationEndMemo: AnimationEndMemo.current,
  // });
  return (
    <>
      {Object.keys({ ...lastCharas, ...charas }).map((k) => {
        const last = lastCharasSrcRef.current[k],
          cover = coverSrc[k];
        const lastChara = lastCharas?.[k],
          chara = charas?.[k];
        const [moveClass, moveProps] = (() => {
          if (chara?.move && charaBoxPhase === CharaBoxPhase.move && AnimationEndMemo.current.move[k] !== void 0) {
            if (AnimationEndMemo.current.move[k][moveCount] !== void 0) {
              // console.warn(chara);
              if (chara?.move![moveCount] === void 0) throw new Error(`获取moveClass失败`);
              return [`move-${chara.move[moveCount][0]}`, chara.move[moveCount]];
            }
          }
          return [];
        })();
        // todo: 补充moveProps处理
        // if (moveClass && moveProps) alert([moveClass, moveProps]);
        return (
          <Fragment key={k}>
            <div
              // style={{}}
              // todo: 补充moveProps处理
              className={classNames(
                'chara-box',
                'last',
                (() => {
                  if (charaBoxPhase === CharaBoxPhase.out && AnimationEndMemo.current.out[k] !== void 0) {
                    return 'out';
                  } else if (charaBoxPhase === CharaBoxPhase.transform && AnimationEndMemo.current.transform[k] !== void 0) {
                    return 'out';
                  }
                })(),
                moveClass,
                lastChara?.position
              )}
              onAnimationEnd={() => {
                if (charaBoxPhase === CharaBoxPhase.out) handleAnimationEnd('out', k);
                else if (charaBoxPhase === CharaBoxPhase.transform) handleAnimationEnd('transform', k);
                else if (charaBoxPhase === CharaBoxPhase.move) handleAnimationEnd('move', k, moveCount);
              }}
            >
              <img draggable={false} src={last} />
            </div>
            <div
              className={classNames(
                'chara-box',
                AnimationEndMemo.current.in[k] !== void 0
                  ? [CharaBoxPhase.in].includes(charaBoxPhase)
                    ? 'in'
                    : 'hide'
                  : AnimationEndMemo.current.transform[k] !== void 0
                  ? [CharaBoxPhase.transform].includes(charaBoxPhase)
                    ? 'in'
                    : 'hide'
                  : 'hide',
                chara?.position
              )}
              onAnimationEnd={() => {
                if (charaBoxPhase === CharaBoxPhase.in) handleAnimationEnd('in', k);
                else if (charaBoxPhase === CharaBoxPhase.transform) handleAnimationEnd('transform', k);
              }}
            >
              <img draggable={false} src={cover} />
            </div>
          </Fragment>
        );
      })}
    </>
  );
};
