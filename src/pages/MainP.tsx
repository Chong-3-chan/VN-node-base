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
import { updateGlobalSave } from '../data/globalSave';
import { SaveP } from '../components/public/SaveP';
import { deepClone } from '../public/handle';

export type MainPMode = 'auto' | 'skip' | 'default';
export type MainPCoverPage = 'SaveP' | 'HistroyView' | 'OptionP' | null;

function useMainPActionPhase(currentSentence: EXStaticSentence, doneFlag: (v?: boolean) => boolean) {
  const doneFlagValue = doneFlag();
  const [count, setCount] = useState(0);
  const [
    phase,
    {
      act: [placeDone, charaInit, charaDone, CGDone],
      // stepDone: [],
    },
    reset,
  ] = useDTJ<'act' | 'stepDone'>({ act: 4, stepDone: 1 });
  // count影响返回的currentState，需要useLayoutEffect在渲染前改动。
  useLayoutEffect(() => {
    setCount(0);
    reset();
    // if (!currentSentence.states!.length) {
    //   !doneFlagValue && doneFlag(true);
    // }
  }, [currentSentence]);
  useLayoutEffect(() => {
    if (phase === 'stepDone') {
      setCount(count + 1);
      if (count + 1 < currentSentence.states!.length) reset();
      // else !doneFlagValue && doneFlag(true);
    }
  }, [phase]);
  useLayoutEffect(() => {
    if (doneFlagValue && count < currentSentence.states!.length) {
      setCount(currentSentence.states!.length);
      charaInit(false); // 重新生成AnimationEndMemo，十分重要。
    }
  }, [doneFlagValue]);
  useEffect(() => {
    // count关系到currentState的实际值。需要在count改变、currentState更新后，再给组件完成信号，
    // 组件才能拿到最新的state更新内部状态。
    if (count >= currentSentence.states!.length) {
      [placeDone, charaInit, charaDone, CGDone].forEach((e) => e(true));
      !doneFlagValue && doneFlag(true);
    }
  }, [count]);
  // console.log('CG!!', phase, count, currentSentence.states!.length, [a(), b(), c(), d()]);
  return {
    phase,
    currentState: count >= currentSentence.states!.length ? currentSentence.lastState : currentSentence.states![count],
    update: [placeDone, charaInit, charaDone, CGDone],
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
  // const [histroyView, setHistroyView] = useState(false);
  const [coverPage, setCoverPage] = useState<MainPCoverPage>(null);

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
    // console.log(skipTransfrom, phase);
    if (isSkipMode || skipTransfrom) {
      // console.log('date1', Date.now() % 10000, phase);
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
      [MainPhase.act]: function (): void {
        updateGlobalSave('autoSave', { sentenceID: pageState.sentenceID!, time: Date.now() });
        updateGlobalSave('readStoryPath', pageState.currentKeys.storyPath!);
      },
      [MainPhase.text]: function (): void {},
      [MainPhase.choice]: function (): void {},
      [MainPhase.done]: function (): void {
        // pageAction.getSave(Math.random() < 0.5 ? 3 : 0).then((e) => pageAction.save(e));
        if (isAutoMode) {
          setAutoPlayTimeOut(
            setTimeout(() => {
              handleGoNextSentence();
              setAutoPlayTimeOut(null);
            }, 2000)
            // from options
          );
        } else if (isSkipMode) {
          handleGoNextSentence(void 0, true);
        }
      },
    };
    todoMap[phase]();
  }, [phase, isSkipMode]);
  const handleGoNextSentenceThrottle = useRef<{ on: boolean; allow: boolean; timeout: number }>({
    on: true,
    allow: true,
    timeout: 100,
  });
  // 限制玩家阅读两句话的间隔

  const handleSkipTransfrom = useCallback(() => {
    setSkipTransfrom(true);
  }, []);

  const handleGoNextSentence = useCallback(
    // eslint-disable-next-line complexity
    (nextSentenceID?: number, force?: boolean) => {
      // console.log('handleGoNextSentence');
      if (!force && handleGoNextSentenceThrottle.current.on && !handleGoNextSentenceThrottle.current.allow) return;
      if (autoPlayTimeOut !== null) {
        clearTimeout(autoPlayTimeOut);
        setAutoPlayTimeOut(null);
      }

      // console.warn(force, !force && phase !== MainPhase.done, phase);
      if (!force && phase !== MainPhase.done) {
        // console.log('skip');
        handleSkipTransfrom();
      } else {
        if (nextSentenceID !== void 0) {
          // choice功能专用
          const nextStoryID = nextSentenceID >> 16,
            currentStoryID = pageState.currentObjs.story!.ID;
          if (currentStoryID === void 0) throw new Error(`handleGoNextSentence(): 获取当前故事ID失败。`);
          if (nextStoryID !== currentStoryID) {
            updateGlobalSave('endedStoryPath', pageState.currentKeys.storyPath!);
          }
          pageAction.setSentenceID(nextSentenceID);
          // setNextSentenceID(void 0);
        } else {
          // console.warn(pageState.currentObjs.paragraph, pageState.sentenceID);
          if (pageState.currentObjs.paragraph!.end === pageState.sentenceID) {
            pageAction.jumpToCurrentParagraphEndToStory();
            updateGlobalSave('endedStoryPath', pageState.currentKeys.storyPath!);
          } else pageAction.setSentenceID(pageState.sentenceID! + 1);
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
    [autoPlayTimeOut, phase]
  );

  const handleLoadSave = useCallback(
    (ID: number) => {
      pageAction.loadSave(ID, {
        handleClose() {
          setCoverPage(null);
        },
        handleSkipTransfrom,
      });
    },
    [handleSkipTransfrom]
  );
  useEffect(() => {
    console.log(currentSentence);
  }, [currentSentence]);
  console.log([
    phase,
    deepClone({
      phase: actPhase,
      currentState,
      update: [placeDone, charaInit, charaDone, CGDone].map((e) => e()),
    }),
  ]);
  const forceUseLastState = phase !== MainPhase.act && skipTransfrom;
  return (
    <div id="MainP">
      {/* <h1>MainP</h1> */}
      <PlaceBox place={currentState?.place} flags={[placeDone]} phase={phase} forceUseLastState={forceUseLastState} />
      <CharaBox charas={currentState?.charas} flags={[charaInit, charaDone]} phase={phase} forceUseLastState={forceUseLastState} />
      <CGBox CG={currentState?.CG} flags={[CGDone]} phase={phase} forceUseLastState={forceUseLastState} />
      <TextBar
        FlowingTextProps={{ text: currentSentence!.text, flags: [textInit, textDone], phase }}
        charaKey={currentSentence.charaKey}
        handleGoNextSentence={() => requestAnimationFrame(() => handleGoNextSentence())}
      />
      <Choice choice={currentSentence.lastState?.choice} flags={[choiceDone]} phase={phase} handleGoNextSentence={handleGoNextSentence}></Choice>
      <ControlButtonsBarBox
        {...{
          setCoverPage,
          mode,
          setMode,
          handleSkipTransfrom,
        }}
      />
      <HistoryView {...{ coverPage, setCoverPage, handleGoNextSentence, handleSkipTransfrom, setMode }} />
      <SaveP {...{ coverPage, setCoverPage, setMode, handleLoadSave }} />
    </div>
  );
};
export default MainP;
