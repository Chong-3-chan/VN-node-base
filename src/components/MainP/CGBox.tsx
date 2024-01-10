/* eslint-disable jsx-a11y/alt-text */
import { FC, useState, useRef, useMemo, useEffect } from 'react';
import { SentenceState } from '../../data/data';
import { getSrc } from '../../data/getData';
import { classNames } from '../../handle';
import { MainPhase } from '../../public/MainP';
import './CGBox.less';
export type CGBoxProps = {
  CG?: SentenceState['CG'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
};
export const CGBox: FC<CGBoxProps> = ({ CG, flags: [done], phase }) => {
  const doneFlag = done(),
    updateDone = () => done(true);

  const [lastCG, setLastCG] = useState<typeof CG>();
  const lastCGSrcRef = useRef<string>();
  const coverSrc = useMemo(() => {
    if (!doneFlag && CG) return getSrc(CG);
    return void 0;
  }, [CG]);
  useEffect(() => {
    if (CG === lastCG && !doneFlag) updateDone();
  }, [doneFlag, lastCG]);
  useEffect(() => {
    if (doneFlag && lastCGSrcRef.current !== coverSrc) {
      lastCGSrcRef.current = CG !== void 0 ? coverSrc : void 0;
      setLastCG(CG);
    }
  }, [doneFlag]);

  return (
    <>
      <div
        className={classNames('cg-box', 'last', phase === MainPhase.CG && coverSrc === void 0 ? 'out' : void 0)}
        onAnimationEnd={updateDone}
        key={lastCG}
      >
        <img src={lastCGSrcRef.current}></img>
      </div>
      <div
        className={classNames('cg-box', 'hide', phase === MainPhase.CG && coverSrc !== void 0 ? 'in' : void 0)}
        onAnimationEnd={updateDone}
        key={lastCG !== CG ? CG : ''}
      >
        <img src={coverSrc}></img>
      </div>
    </>
  );
};
