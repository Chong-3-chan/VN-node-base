/* eslint-disable jsx-a11y/alt-text */
import { FC, useState, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { SentenceState } from '../../data/data';
import { getSrc } from '../../data/getData';
import { classNames } from '../../public/handle';
import { MainPhase } from '../../public/MainP';
import './CGBox.less';
export type CGBoxProps = {
  CG: SentenceState['CG'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
  forceUseLastState: boolean;
};
export const CGBox: FC<CGBoxProps> = ({ CG, flags: [done], phase, forceUseLastState }) => {
  const doneFlag = done(),
    updateDone = () => done(true),
    acting = phase === MainPhase.act;

  const [lastCG, setLastCG] = useState<typeof CG>();
  const lastCGSrcRef = useRef<string>();
  const coverSrc = useMemo(() => {
    if (CG) return getSrc(CG);
    return void 0;
  }, [CG]);
  useEffect(() => {
    if (CG === lastCG && !doneFlag) updateDone();
  }, [doneFlag, lastCG]);
  useEffect(() => {
    if ((doneFlag && lastCG !== CG && lastCGSrcRef.current !== coverSrc) || forceUseLastState) {
      lastCGSrcRef.current = CG !== void 0 ? coverSrc : void 0;
      setLastCG(CG);
    }
  }, [doneFlag, forceUseLastState]);

  return (
    <>
      <div className={classNames('cg-box', 'last', acting && coverSrc === void 0 ? 'out' : void 0)} onAnimationEnd={updateDone} key={lastCG}>
        <img draggable={false} src={lastCGSrcRef.current}></img>
      </div>
      <div
        className={classNames('cg-box', 'hide', acting && coverSrc !== void 0 ? 'in' : void 0)}
        onAnimationEnd={updateDone}
        key={lastCG !== CG ? CG : ''}
      >
        <img draggable={false} src={coverSrc}></img>
      </div>
    </>
  );
};
