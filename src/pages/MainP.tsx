/* eslint-disable jsx-a11y/alt-text */
import { useState, type FC, useRef, useEffect, useCallback, useMemo, Fragment, useLayoutEffect } from 'react';
import './MainP.less';
import { usePageState } from '../pageState';
import { getSrc } from '../data/getData';
import { EXStaticSentence, SentenceState, fileCache, sentenceCache } from '../data/data';
import { classNames, deepClone } from '../handle';
import { useDTJ } from '../handle/hooks';
enum MainPhase {
  place = 'place',
  chara = 'chara',
  done = 'done',
}
type PlaceBoxProps = {
  place?: SentenceState['place'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
};
const PlaceBox: FC<PlaceBoxProps> = ({ place, flags: [done], phase }) => {
  const doneFlag = done(),
    updateDone = () => done(true);

  const [lastPlace, setLastPlace] = useState<typeof place>();
  const lastPlaceSrcRef = useRef<string>();
  const coverSrc = useMemo(() => {
    if (!doneFlag && place) return getSrc(place);
    return void 0;
  }, [place]);
  useEffect(() => {
    if (place === lastPlace && !doneFlag) updateDone();
  }, [doneFlag, lastPlace]);
  useEffect(() => {
    if (doneFlag && lastPlaceSrcRef.current !== coverSrc) {
      lastPlaceSrcRef.current = place !== void 0 ? coverSrc : void 0;
      setLastPlace(place);
    }
  }, [doneFlag]);

  return (
    <>
      <div className={classNames('placeBox', 'last')} key={lastPlace}>
        <img src={lastPlaceSrcRef.current}></img>
      </div>
      <div
        className={classNames('placeBox', 'hide', phase === MainPhase.place ? 'in' : void 0)}
        onAnimationEnd={updateDone}
        key={lastPlace !== place ? place : ''}
      >
        <img src={coverSrc}></img>
      </div>
    </>
  );
};
type CharaBoxProps = {
  charas: SentenceState['charas'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
};
enum CharaBoxPhase {
  out = 'out', // 有->无
  in = 'in', // 无->有
  transform = 'transform', // 有->有
  move = 'move',
  done = 'done',
}
const CharaBox: FC<CharaBoxProps> = ({ charas, flags: [start, done], phase }) => {
  const doneFlag = done(),
    startFlag = start(),
    updateDone = () => done(true),
    updateStart = () => start(true);
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
  ] = useDTJ<CharaBoxPhase>(
    [CharaBoxPhase.out, 1],
    [CharaBoxPhase.in, 1],
    [CharaBoxPhase.transform, 1],
    [CharaBoxPhase.move, 1],
    [CharaBoxPhase.done, 0]
  );
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
  useEffect(() => {
    // 切换sentence时触发mainPhase的reset，startFlag变成false，然后触发charaBox状态初始化，目前包括AnimationEndMemo更新
    if (!startFlag) {
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
        const keys = Object.keys(charas).filter((key) => charas[key]?.move);
        keys.length && setMoveCount(0);
        keys.forEach((key) => (AnimationEndMemo.current.move[key] = charas[key]!.move!.map(() => false)));
      }
      updateStart();
    }
  }, [startFlag]);
  useLayoutEffect(() => {
    // reset需要在layout时机
    if (phase === MainPhase.chara) {
      reset();
      if (Object.keys(AnimationEndMemo.current.out).length === 0) outDone(true);
      if (Object.keys(AnimationEndMemo.current.in).length === 0) inDone(true);
      if (Object.keys(AnimationEndMemo.current.transform).length === 0) transformDone(true);
      if (Object.keys(AnimationEndMemo.current.move).length === 0) moveDone(true);
    }
  }, [phase]);
  useEffect(() => {
    // 在点击跳过动画时，执行所有本应但还未执行的动画结束的回调（handleAnimationEnd）
    if (doneFlag) {
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
    }
  }, [doneFlag]);
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
  const handleAnimationEnd = (type: keyof typeof AnimationEndMemo.current, key: string, moveKey?: number) => {
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
  };
  console.log({ lastCharasSrc: lastCharasSrcRef.current, coverSrc, charaBoxPhase, startFlag, doneFlag, AnimationEndMemo: AnimationEndMemo.current });
  return (
    <>
      {Object.keys({ ...lastCharas, ...charas }).map((k) => {
        const last = lastCharasSrcRef.current[k],
          cover = coverSrc[k];
        const [moveClass, moveProps] = (() => {
          if (charas && charas[k] && charaBoxPhase === CharaBoxPhase.move && AnimationEndMemo.current.move[k] !== void 0) {
            if (AnimationEndMemo.current.move[k][moveCount] !== void 0) {
              if (charas[k]?.move?.[moveCount] === void 0) throw new Error(`获取moveClass失败`);
              return [`move-${charas[k]!.move![moveCount][0]}`, charas[k]!.move![moveCount]];
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
                'charaBox',
                'last',
                (() => {
                  if (charaBoxPhase === CharaBoxPhase.out && AnimationEndMemo.current.out[k] !== void 0) {
                    return 'out';
                  } else if (charaBoxPhase === CharaBoxPhase.transform && AnimationEndMemo.current.transform[k] !== void 0) {
                    return 'out';
                  }
                })(),
                moveClass,
                lastCharas?.[k]?.position
              )}
              onAnimationEnd={() => {
                if (charaBoxPhase === CharaBoxPhase.out) handleAnimationEnd('out', k);
                else if (charaBoxPhase === CharaBoxPhase.transform) handleAnimationEnd('transform', k);
                else if (charaBoxPhase === CharaBoxPhase.move) handleAnimationEnd('move', k, moveCount);
              }}
            >
              <img src={last} />
            </div>
            <div
              className={classNames(
                'charaBox',
                AnimationEndMemo.current.in[k] !== void 0
                  ? [CharaBoxPhase.in].includes(charaBoxPhase)
                    ? 'in'
                    : 'hide'
                  : AnimationEndMemo.current.transform[k] !== void 0
                  ? [CharaBoxPhase.transform].includes(charaBoxPhase)
                    ? 'in'
                    : 'hide'
                  : 'hide',
                charas?.[k]?.position
              )}
              onAnimationEnd={() => {
                if (charaBoxPhase === CharaBoxPhase.in) handleAnimationEnd('in', k);
                else if (charaBoxPhase === CharaBoxPhase.transform) handleAnimationEnd('transform', k);
              }}
            >
              <img src={cover} />
            </div>
          </Fragment>
        );
      })}
    </>
  );
};
export const MainP: FC = (props) => {
  const { pageState, pageAction } = usePageState();
  const [nextSentenceID, setNextSentenceID] = useState<number | void>(void 0);
  const [
    phase,
    {
      [MainPhase.place]: [placeDone],
      [MainPhase.chara]: [charaStart, charaDone],
      [MainPhase.done]: [],
    },
    reset,
  ] = useDTJ<MainPhase>([MainPhase.place, 1], [MainPhase.chara, 2], [MainPhase.done, 0]);
  useEffect(() => {
    const todoMap: Record<MainPhase, () => void> = {
      [MainPhase.place]: function (): void {
        throw new Error('Function not implemented.');
      },
      [MainPhase.chara]: function (): void {
        throw new Error('Function not implemented.');
      },
      [MainPhase.done]: function (): void {
        throw new Error('Function not implemented.');
      },
    };
    console.log(phase);
  }, [phase]);
  const currentSentence = useRef<EXStaticSentence>(useMemo(() => sentenceCache.get(pageState.sentenceID!), [])!);
  useLayoutEffect(() => {
    currentSentence.current = sentenceCache.get(pageState.sentenceID!)!;
    console.log(currentSentence.current!.state);
    reset();
    console.warn('mainp reset');
  }, [pageState.sentenceID]);
  const handle = useCallback(() => {
    console.log(phase);
    if (phase !== MainPhase.done) [[placeDone], [charaDone]].flat(1).forEach((e) => e(true));
    if (phase === MainPhase.done) {
      if (nextSentenceID !== void 0) {
        pageAction.setSentenceID(nextSentenceID);
        setNextSentenceID(void 0);
      } else pageAction.setSentenceID(pageState.sentenceID! + 1);
    }
  }, [nextSentenceID, phase]);

  useEffect(() => {
    console.log(currentSentence.current);
  }, [currentSentence.current]);
  return (
    <div id="MainP" onClick={handle}>
      <h1>MainP</h1>
      <PlaceBox place={currentSentence.current!.state?.place} flags={[placeDone]} phase={phase} />
      <CharaBox charas={currentSentence.current!.state?.charas} flags={[charaStart, charaDone]} phase={phase} />
      <CharaBox charas={currentSentence.current!.state?.charas} flags={[charaStart, charaDone]} phase={phase} />
      <div style={{ position: 'absolute' }}>{currentSentence.current?.text}</div>
    </div>
  );
};
export default MainP;
