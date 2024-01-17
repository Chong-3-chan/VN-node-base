import { useState, type FC, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import './MainP.less';
import { usePageState } from '../pageState';
import { EXStaticSentence, charaRecord, sentenceCache, staticStoryRecord } from '../data/data';
import { useDTJ } from '../public/handle/hooks';
import { MainPhase } from '../public/MainP';
import { CGBox } from '../components/MainP/CGBox';
import { CharaBox } from '../components/MainP/CharaBox';
import { PlaceBox } from '../components/MainP/PlaceBox';
import { TextBar } from '../components/MainP/TextBar';
import { Choice } from '../components/MainP/Choice';
import { ControlButtonsBarBox } from '../components/MainP/ControlButtonsBarBox';
import { HistoryView } from '../components/MainP/HistoryView';

export type MainPMode = 'auto' | 'skip' | 'default';
export const MainP: FC = (props) => {
  const { pageState, pageAction } = usePageState();
  // const [nextSentenceID, setNextSentenceID] = useState<number | void>(void 0);
  // const [autoPlay, setAutoPlay] = useState(false);
  // const [skipMode, setSkipMode] = useState(false);
  const [mode, setMode] = useState<MainPMode>('default');
  const isSkipMode = useMemo(() => mode === 'skip', [mode]);
  const isAutoMode = useMemo(() => mode === 'auto', [mode]);
  const [autoPlayTimeOut, setAutoPlayTimeOut] = useState<NodeJS.Timeout | null>(null);
  const [skipTransfrom, setSkipTransfrom] = useState(false);
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
  }, [pageState.sentenceID]);
  useEffect(() => {
    // if (charaInit() && textInit()) handleSkipTransfrom();
    // console.log(skipTransfrom, phase);
    if (isSkipMode || skipTransfrom) {
      if (phase === MainPhase.place) placeDone(true);
      else if (phase === MainPhase.chara) charaDone(true);
      else if (phase === MainPhase.CG) CGDone(true);
      else if (phase === MainPhase.text) textDone(true);
      else !isSkipMode && setSkipTransfrom(false);
    }
  }, [skipTransfrom, phase, isSkipMode]);
  useEffect(() => {
    if (isAutoMode) {
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
  }, [isAutoMode]);
  useEffect(() => {
    const todoMap: Record<MainPhase, () => void> = {
      [MainPhase.place]: function (): void {},
      [MainPhase.chara]: function (): void {},
      [MainPhase.CG]: function (): void {},
      [MainPhase.text]: function (): void {},
      [MainPhase.choice]: function (): void {},
      [MainPhase.done]: function (): void {
        // if (currentSentence.current!.state?.choice) {
        //   setTimeout(() => {
        //     handleGoNextSentence();
        //   }, 300);
        // }
        if (isAutoMode) {
          setAutoPlayTimeOut(
            setTimeout(() => {
              handleGoNextSentence();
              setAutoPlayTimeOut(null);
            }, 2000)
            // from options
          );
        } else if (isSkipMode) {
          setTimeout(() => {
            handleGoNextSentence();
          }, 50);
        }
      },
    };
    todoMap[phase]();
  }, [phase, isSkipMode]);
  const currentSentence = useRef<EXStaticSentence>(useMemo(() => sentenceCache.get(pageState.sentenceID!), [])!);
  const handleGoNextSentenceThrottle = useRef<{ on: boolean; allow: boolean }>({ on: false, allow: true });
  const handleSkipTransfrom = useCallback(() => {
    setSkipTransfrom(true);
  }, []);

  const handleGoNextSentence = useCallback(
    (force?: boolean, nextSentenceID?: number) => {
      if (handleGoNextSentenceThrottle.current.on) {
        if (!handleGoNextSentenceThrottle.current.allow) return;
      }
      if (autoPlayTimeOut !== null) {
        clearTimeout(autoPlayTimeOut);
        setAutoPlayTimeOut(null);
      }

      console.warn(force, !force && phase !== MainPhase.done, phase);
      if (!force && phase !== MainPhase.done) handleSkipTransfrom();
      else {
        if (nextSentenceID !== void 0) {
          // choice功能专用
          pageAction.setSentenceID(nextSentenceID);
          // setNextSentenceID(void 0);
        } else {
          console.warn(pageState.currentObjs.paragraph, pageState.sentenceID);
          if (pageState.currentObjs.paragraph!.end === pageState.sentenceID) pageAction.jumpToParagraphEndToStory();
          else pageAction.setSentenceID(pageState.sentenceID! + 1);
        }

        if (handleGoNextSentenceThrottle.current.on) {
          handleGoNextSentenceThrottle.current.allow = false;
          setTimeout(() => {
            handleGoNextSentenceThrottle.current.allow = true;
          }, 300);
        }
        // 限制了阅读速度
      }
    },
    [phase, autoPlayTimeOut]
  );

  useEffect(() => {
    console.log(currentSentence.current);
  }, [currentSentence.current]);
  console.log([
    phase,
    {
      [MainPhase.place]: [placeDone],
      [MainPhase.chara]: [charaInit, charaDone],
      [MainPhase.CG]: [CGDone],
      [MainPhase.text]: [textInit, textDone],
      [MainPhase.choice]: [choiceDone],
      [MainPhase.done]: [],
    },
  ]);
  return (
    <div id="MainP">
      <h1>MainP</h1>
      <PlaceBox place={currentSentence.current!.state?.place} flags={[placeDone]} phase={phase} />
      <CharaBox charas={currentSentence.current!.state?.charas} flags={[charaInit, charaDone]} phase={phase} />
      <CGBox CG={currentSentence.current!.state?.CG} flags={[CGDone]} phase={phase} />
      <TextBar
        FlowingTextProps={{ text: currentSentence.current!.text, flags: [textInit, textDone], phase }}
        charaKey={currentSentence.current.charaKey}
        handleGoNextSentence={() => handleGoNextSentence()}
      />
      <Choice choice={currentSentence.current!.state?.choice} flags={[choiceDone]} phase={phase} handleGoNextSentence={handleGoNextSentence}></Choice>
      <ControlButtonsBarBox
        {...{
          setHistroyView,
          mode,
          setMode,
          // autoPlay,
          // setAutoPlay,
          // skipMode,
          // setSkipMode,
        }}
      />
      <HistoryView {...{ histroyView, setHistroyView, handleGoNextSentence, handleSkipTransfrom, setMode }} />
    </div>
  );
};
export default MainP;
