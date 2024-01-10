import { useState, type FC, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import './MainP.less';
import { usePageState } from '../pageState';
import { EXStaticSentence, charaRecord, sentenceCache, staticStoryRecord } from '../data/data';
import { useDTJ } from '../handle/hooks';
import { MainPhase } from '../public/MainP';
import { CGBox } from '../components/MainP/CGBox';
import { CharaBox } from '../components/MainP/CharaBox';
import { PlaceBox } from '../components/MainP/PlaceBox';
import { TextBar } from '../components/MainP/TextBar';
import { Choice } from '../components/MainP/Choice';
import { classNames } from '../handle';
import { StrokedText } from '../components/public/StrokedText';
import { ControlButtonsBarBox } from '../components/MainP/ControlButtonsBarBox';
import { HistoryView } from '../components/MainP/HistoryView';

export const MainP: FC = (props) => {
  const { pageState, pageAction } = usePageState();
  const [nextSentenceID, setNextSentenceID] = useState<number | void>(void 0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayTimeOut, setAutoPlayTimeOut] = useState<NodeJS.Timeout | null>(null);
  const [histroyView, setHistroyView] = useState(false);
  const [
    phase,
    {
      [MainPhase.place]: [placeDone],
      [MainPhase.chara]: [charaInit, charaDone],
      [MainPhase.CG]: [CGDone],
      [MainPhase.text]: [textInit, textDone],
      [MainPhase.choice]: [choiceDone],
      [MainPhase.done]: [],
    },
    reset,
  ] = useDTJ<MainPhase>({
    [MainPhase.place]: 1,
    [MainPhase.chara]: 2,
    [MainPhase.CG]: 1,
    [MainPhase.text]: 2,
    [MainPhase.choice]: 1,
    [MainPhase.done]: 0,
  });
  useLayoutEffect(() => {
    currentSentence.current = sentenceCache.get(pageState.sentenceID!)!;
    console.log(currentSentence.current!.state, pageState.currentKeys, pageState.currentObjs.paragraph, pageState.sentenceID);
    reset();
    console.warn('mainp reset');
  }, [pageState.sentenceID]);
  useEffect(() => {
    if (autoPlay) {
      if (phase === MainPhase.done) {
        setAutoPlayTimeOut(
          setTimeout(() => {
            handleGoNextSentence();
            setAutoPlayTimeOut(null);
          }, 2000)
          // from options
        );
      }
    } else {
      if (autoPlayTimeOut !== null) {
        clearTimeout(autoPlayTimeOut);
        setAutoPlayTimeOut(null);
      }
    }
  }, [autoPlay]);
  useEffect(() => {
    const todoMap: Record<MainPhase, () => void> = {
      [MainPhase.place]: function (): void {},
      [MainPhase.chara]: function (): void {},
      [MainPhase.CG]: function (): void {},
      [MainPhase.text]: function (): void {},
      [MainPhase.choice]: function (): void {},
      [MainPhase.done]: function (): void {
        if (autoPlay) {
          setAutoPlayTimeOut(
            setTimeout(() => {
              handleGoNextSentence();
              setAutoPlayTimeOut(null);
            }, 2000)
            // from options
          );
        }
      },
    };
    todoMap[phase]();
  }, [phase]);
  const currentSentence = useRef<EXStaticSentence>(useMemo(() => sentenceCache.get(pageState.sentenceID!), [])!);
  const handleGoNextSentence = useCallback(() => {
    if (autoPlayTimeOut !== null) {
      clearTimeout(autoPlayTimeOut);
      setAutoPlayTimeOut(null);
    }

    console.log(phase);
    if (phase !== MainPhase.done) [[placeDone], [charaDone], [CGDone], [textDone]].flat(1).forEach((e) => !e() && e(true));
    if (phase === MainPhase.done) {
      if (nextSentenceID !== void 0) {
        // history功能专用
        pageAction.setSentenceID(nextSentenceID);
        setNextSentenceID(void 0);
      } else {
        if (pageState.currentObjs.paragraph!.end === pageState.sentenceID) pageAction.jumpToParagraphEndToStory();
        else pageAction.setSentenceID(pageState.sentenceID! + 1);
      }
    }
  }, [nextSentenceID, phase, autoPlayTimeOut]);

  useEffect(() => {
    console.log(currentSentence.current);
  }, [currentSentence.current]);
  return (
    <div id="MainP">
      <h1>MainP</h1>
      <PlaceBox place={currentSentence.current!.state?.place} flags={[placeDone]} phase={phase} />
      <CharaBox charas={currentSentence.current!.state?.charas} flags={[charaInit, charaDone]} phase={phase} />
      <CGBox CG={currentSentence.current!.state?.CG} flags={[CGDone]} phase={phase} />
      <TextBar
        FlowingTextProps={{ text: currentSentence.current!.text, flags: [textInit, textDone], phase }}
        charaKey={currentSentence.current.charaKey}
        handleGoNextSentence={handleGoNextSentence}
      />
      <Choice choice={currentSentence.current!.state?.choice} flags={[choiceDone]} phase={phase}></Choice>
      <ControlButtonsBarBox
        {...{
          setHistroyView,
          autoPlay,
          setAutoPlay,
        }}
      />
      <HistoryView {...{ histroyView, setHistroyView }} />
    </div>
  );
};
export default MainP;
