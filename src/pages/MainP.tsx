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
import { debug } from 'console';

export type MainPMode = 'auto' | 'skip' | 'default';

function useMainPActionPhase(currentSentence: EXStaticSentence, doneFlag: (v?: boolean) => boolean) {
  const doneFlagValue = doneFlag();
  const [count, setCount] = useState(0);
  const [
    phase,
    {
      act: [a, b, c, d],
      // stepDone: [],
    },
    reset,
  ] = useDTJ<'act' | 'stepDone'>({ act: 4, stepDone: 1 });
  // count影响返回的currentState，需要useLayoutEffect在渲染前改动。
  useLayoutEffect(() => {
    setCount(0);
    reset();
    if (!currentSentence.states!.length) {
      [a, b, c, d].forEach((e) => e(true));
      !doneFlagValue && doneFlag(true);
    }
  }, [currentSentence]);
  useLayoutEffect(() => {
    if (phase === 'stepDone') {
      setCount((e) => e + 1);
      if (count + 1 < currentSentence.states!.length) {
        reset();
      } else !doneFlagValue && doneFlag(true);
    }
  }, [phase]);
  useLayoutEffect(() => {
    if (doneFlagValue && count < currentSentence.states!.length) {
      setCount(currentSentence.states!.length);
      [a, b, c, d].forEach((e) => !e() && e(true));
    }
  }, [doneFlagValue]);
  return {
    phase,
    currentState: count >= currentSentence.states!.length ? currentSentence.lastState : currentSentence.states![count],
    update: [a, b, c, d],
  };
}

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
  // const [
  //   phase,
  //   {
  //     [MainPhase.place]: [placeDone],
  //     [MainPhase.chara]: [charaInit, charaDone],
  //     [MainPhase.CG]: [CGDone],
  //     [MainPhase.text]: [textInit, textDone],
  //     [MainPhase.choice]: [choiceDone],
  //     [MainPhase.done]: [],
  //   },
  //   reset,
  // ] = useDTJ<MainPhase>({
  //   [MainPhase.place]: 1,
  //   [MainPhase.chara]: 2,
  //   [MainPhase.CG]: 1,
  //   [MainPhase.text]: 2,
  //   [MainPhase.choice]: 1,
  //   [MainPhase.done]: 0,
  // });

  const [
    phase,
    {
      [MainPhase.act]: [actDone],
      [MainPhase.text]: [textInit, textDone],
      [MainPhase.choice]: [choiceDone],
      [MainPhase.done]: [],
    },
    reset,
  ] = useDTJ<MainPhase>({
    [MainPhase.act]: 1,
    [MainPhase.text]: 2,
    [MainPhase.choice]: 1,
    [MainPhase.done]: 0,
  });
  const currentSentence = useMemo(() => {
    reset();
    return sentenceCache.get(pageState.sentenceID!);
  }, [pageState.sentenceID])!;
  const {
    phase: actPhase,
    currentState,
    update: [placeDone, charaInit, charaDone, CGDone],
  } = useMainPActionPhase(currentSentence, actDone);
  useEffect(() => {
    // if (charaInit() && textInit()) handleSkipTransfrom();
    // console.log(skipTransfrom, phase);
    if (isSkipMode || skipTransfrom) {
      // if (phase === MainPhase.place) placeDone(true);
      // else if (phase === MainPhase.chara) charaDone(true);
      // else if (phase === MainPhase.CG) CGDone(true);
      if (phase === MainPhase.act) actDone(true);
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
      [MainPhase.act]: function (): void {},
      [MainPhase.text]: function (): void {},
      [MainPhase.choice]: function (): void {},
      [MainPhase.done]: function (): void {
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
            handleGoNextSentence(void 0, true);
          }, 50);
        }
      },
    };
    todoMap[phase]();
  }, [phase, isSkipMode]);
  const handleGoNextSentenceThrottle = useRef<{ on: boolean; allow: boolean; timeout: number }>({ on: true, allow: true, timeout: 300 });
  // 限制玩家阅读两句话的间隔
  const handleSkipTransfrom = useCallback(() => {
    setSkipTransfrom(true);
  }, []);

  const handleGoNextSentence = useCallback(
    (nextSentenceID?: number, force?: boolean) => {
      if (!force && handleGoNextSentenceThrottle.current.on) {
        if (!handleGoNextSentenceThrottle.current.allow) return;
      }
      if (autoPlayTimeOut !== null) {
        clearTimeout(autoPlayTimeOut);
        setAutoPlayTimeOut(null);
      }

      // console.warn(force, !force && phase !== MainPhase.done, phase);
      if (!force && phase !== MainPhase.done) handleSkipTransfrom();
      else {
        if (nextSentenceID !== void 0) {
          // choice功能专用
          pageAction.setSentenceID(nextSentenceID);
          // setNextSentenceID(void 0);
        } else {
          // console.warn(pageState.currentObjs.paragraph, pageState.sentenceID);
          if (pageState.currentObjs.paragraph!.end === pageState.sentenceID) pageAction.jumpToCurrentParagraphEndToStory();
          else pageAction.setSentenceID(pageState.sentenceID! + 1);
        }

        if (!force && handleGoNextSentenceThrottle.current.on) {
          handleGoNextSentenceThrottle.current.allow = false;
          setTimeout(() => {
            handleGoNextSentenceThrottle.current.allow = true;
          }, handleGoNextSentenceThrottle.current.timeout);
        }
        // 限制了阅读速度
      }
    },
    [phase, autoPlayTimeOut]
  );

  useEffect(() => {
    console.log(currentSentence);
  }, [currentSentence]);
  console.log([
    phase,
    {
      phase: actPhase,
      currentState,
      update: [placeDone, charaInit, charaDone, CGDone].map((e) => e()),
    },
  ]);
  return (
    <div id="MainP">
      <h1>MainP</h1>
      <PlaceBox place={currentState?.place} flags={[placeDone]} phase={phase} />
      <CharaBox charas={currentState?.charas} flags={[charaInit, charaDone]} phase={phase} />
      <CGBox CG={currentState?.CG} flags={[CGDone]} phase={phase} />
      <TextBar
        FlowingTextProps={{ text: currentSentence!.text, flags: [textInit, textDone], phase }}
        charaKey={currentSentence.charaKey}
        handleGoNextSentence={() => handleGoNextSentence()}
      />
      <Choice choice={currentSentence.lastState?.choice} flags={[choiceDone]} phase={phase} handleGoNextSentence={handleGoNextSentence}></Choice>
      <ControlButtonsBarBox
        {...{
          setHistroyView,
          mode,
          setMode,
        }}
      />
      <HistoryView {...{ histroyView, setHistroyView, handleGoNextSentence, handleSkipTransfrom, setMode }} />
    </div>
  );
};
export default MainP;