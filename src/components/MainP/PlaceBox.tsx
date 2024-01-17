/* eslint-disable jsx-a11y/alt-text */
import { FC, useState, useRef, useMemo, useEffect } from 'react';
import { SentenceState } from '../../data/data';
import { getSrc } from '../../data/getData';
import { classNames } from '../../public/handle';
import { MainPhase } from '../../public/MainP';
import './PlaceBox.less'
export type PlaceBoxProps = {
  place?: SentenceState['place'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
};
export const PlaceBox: FC<PlaceBoxProps> = ({ place, flags: [done], phase }) => {
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
      <div
        className={classNames('place-box', 'last', phase === MainPhase.place && coverSrc === void 0 ? 'out' : void 0)}
        onAnimationEnd={updateDone}
        key={lastPlace}
      >
        <img src={lastPlaceSrcRef.current}></img>
      </div>
      <div
        className={classNames('place-box', 'hide', phase === MainPhase.place && coverSrc !== void 0 ? 'in' : void 0)}
        onAnimationEnd={updateDone}
        key={lastPlace !== place ? place : ''}
      >
        <img src={coverSrc}></img>
      </div>
    </>
  );
};
