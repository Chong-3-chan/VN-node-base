/* eslint-disable jsx-a11y/alt-text */
import { FC, useState, useRef, useMemo, useEffect } from 'react';
import { SentenceState } from '../../data/data';
import { getSrc } from '../../data/getData';
import { classNames } from '../../public/handle';
import { MainPhase } from '../../public/MainP';
import './PlaceBox.less';
export type PlaceBoxProps = {
  place?: SentenceState['place'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
  forceUseLastState: boolean;
};
export const PlaceBox: FC<PlaceBoxProps> = ({ place, flags: [done], phase, forceUseLastState }) => {
  const doneFlag = done(),
    updateDone = () => done(true),
    acting = phase === MainPhase.act;

  const [lastPlace, setLastPlace] = useState<typeof place>();
  const lastPlaceSrcRef = useRef<string>();
  const coverSrc = useMemo(() => {
    if (place) return getSrc(place);
    return void 0;
  }, [place]);
  useEffect(() => {
    if (place === lastPlace && !doneFlag) updateDone();
  }, [doneFlag, lastPlace]);
  useEffect(() => {
    if ((doneFlag && lastPlace !== place && lastPlaceSrcRef.current !== coverSrc) || forceUseLastState) {
      lastPlaceSrcRef.current = place !== void 0 ? coverSrc : void 0;
      setLastPlace(place);
    }
  }, [doneFlag, forceUseLastState]);

  return (
    <>
      <div className={classNames('place-box', 'last', acting && coverSrc === void 0 ? 'out' : void 0)} onAnimationEnd={updateDone} key={lastPlace}>
        <img src={lastPlaceSrcRef.current}></img>
      </div>
      <div
        className={classNames('place-box', 'hide', acting && coverSrc !== void 0 ? 'in' : void 0)}
        onAnimationEnd={updateDone}
        key={lastPlace !== place ? place : ''}
      >
        <img src={coverSrc}></img>
      </div>
    </>
  );
};
