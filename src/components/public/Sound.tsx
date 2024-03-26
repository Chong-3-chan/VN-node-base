import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Player } from '../../class/Sound';
import { classNames } from '../../public/handle';
import { getSrc } from '../../data/getData';
import { SentenceState } from '../../data/data';
import './Sound.less';
type SoundProps = {
  display: boolean;
  sound: SentenceState['BGM'];
  volume: number;
  fade?: boolean;
  loop?: boolean;
};
export const Sound: FC<SoundProps> = ({ display, sound, volume, fade, loop }) => {
  const staticProps = useMemo(() => ({ display, fade }), []);
  ({ display, fade } = staticProps);
  const player = useMemo(() => new Player(volume, fade), []);
  const [show, setShow] = useState(false);
  const re = useMemo(() => {
    if (!display) return <></>;
    else {
      return <div className={classNames('Sound', !show ? 'hide' : void 0)}>{sound}</div>;
    }
  }, [show, sound]);
  useEffect(() => {
    if (display) setShow(true);
    player.play(sound ? getSrc(sound) : '', loop);
  }, [sound]);
  useEffect(() => {
    player.setVolume(volume);
  }, [volume]);
  useEffect(() => () => player.stop(), []);
  return re;
};
