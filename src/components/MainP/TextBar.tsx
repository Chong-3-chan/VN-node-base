import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MainPhase } from '../../public/MainP';
import { charaRecord, fileCache } from '../../data/data';
import { StrokedText } from '../public/StrokedText';
import './TextBar.less';
import { CharaInfo } from '../../class/Records';
import { getSrc } from '../../data/getData';
import { classNames } from '../../public/handle';

type FlowingTextProps = {
  text: string;
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
};
export const FlowingText: FC<FlowingTextProps> = ({ text, flags: [init, done], phase }) => {
  const doneFlag = done(),
    initFlag = init(),
    updateDone = () => done(true),
    updateInit = () => init(true);
  const [displayLength, setDisplayLength] = useState(0);
  const intervalRef = useRef<NodeJS.Timer | null>(null);
  useLayoutEffect(() => {
    if (!initFlag) {
      setDisplayLength(0);
      updateInit();
    }
  });
  useEffect(() => {
    if (initFlag && phase === MainPhase.text) {
      clearInterval(intervalRef.current!);
      intervalRef.current = setInterval(() => setDisplayLength((e) => e + 1), text.length > 0 ? Math.min(50, 300 / text.length) : 50);
    }
    // from options 设置延迟等
  }, [phase, initFlag]);
  useEffect(() => {
    if (phase === MainPhase.text && displayLength >= text.length && !doneFlag) {
      clearInterval(intervalRef.current!);
      updateDone();
    }
  }, [doneFlag, displayLength]);
  useEffect(() => {
    if (doneFlag && displayLength < text.length) {
      clearInterval(intervalRef.current!);
      setDisplayLength(text.length);
    }
  }, [doneFlag]);
  return (
    <div className="text">
      <div className="flowing-text">
        <StrokedText text={text.slice(0, displayLength)}></StrokedText>
      </div>
    </div>
  );
};
type TextBarProps = { charaKey: string; FlowingTextProps: FlowingTextProps; handleGoNextSentence: () => void };
export const TextBar: FC<TextBarProps> = ({ charaKey, FlowingTextProps, handleGoNextSentence }) => {
  const phase = FlowingTextProps.phase;
  const FlowingTextDoneFlag = FlowingTextProps.flags[1]();
  const avatarFilekey = CharaInfo.getAvatarFilekey(charaKey);
  const avatarSrc = useRef<string | undefined>(void 0);
  const [avatarChanged, setAvatarChanged] = useState(true);
  useEffect(() => {
    const newValue = avatarFilekey ? getSrc(avatarFilekey) : void 0;
    newValue !== avatarSrc.current && setAvatarChanged(true);
    avatarSrc.current = newValue;
  }, [charaKey]);
  useEffect(() => {
    if (phase === MainPhase.text) avatarSrc.current && avatarChanged && setAvatarChanged(false);
  }, [phase]);
  return (
    <>
      <div className="text-bar">
        <div className="header">
          <div className="chara-name">
            <StrokedText text={phase === MainPhase.text || FlowingTextDoneFlag ? charaRecord[charaKey]?.name ?? '' : ''}></StrokedText>
          </div>
        </div>
        <div className="body" onClick={handleGoNextSentence}>
          <div className={classNames('chara-avatar', avatarChanged ? 'grey' : void 0)}>
            <img src={avatarSrc.current} />
          </div>
          <FlowingText {...FlowingTextProps} />
        </div>
      </div>
    </>
  );
};
