import { useState, type FC, useRef, useEffect, useCallback, useMemo, useLayoutEffect, useReducer } from 'react';
import './MainP.less';
import { usePageState } from '../pageState';
import { EXStaticSentence, charaRecord, sentenceCache, staticStoryRecord } from '../data/data';
import { useDTJ } from '../public/handle/hooks';
import { MainPhase } from '../public/MainP';
import { CGBox } from '../components/MainP/CGBox';
import { CharaBox } from '../components/MainP/CharaBox';
import { PlaceBox } from '../components/MainP/PlaceBox';
import { TextBar } from '../components/MainP/TextBar';
import { Choose } from '../components/MainP/Choose';
import { ControlButtonsBarBox } from '../components/MainP/ControlButtonsBarBox';
import { HistoryView } from '../components/MainP/HistoryView';
import { getOptions, updateGlobalSave } from '../data/globalSave';
import { SaveP } from '../components/public/SaveP';
import { QsaveloadThrottle, deepClone } from '../public/handle';
import { VN } from '../class/Book';
import { Sound } from '../components/public/Sound';
import OptionsP from '../components/public/OptionsP';
import { Player } from '../class/Sound';
import { getSrc } from '../data/getData';

export type MainPMode = 'auto' | 'skip' | 'default';
export type MainPCoverPage = 'SaveP' | 'HistoryView' | 'OptionsP' | null;

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
  // const [historyView, setHistoryView] = useState(false);
  const [coverPage, setCoverPage] = useState<MainPCoverPage>(null);
  const [, refresh] = useReducer((e) => e + 1, 0);
  const options = getOptions();
  const [QsaveDoneFlag, setQsaveDoneFlag] = useState(false);
  // const [bookVal, setBookVal] = useState<Record<string, number>>({});
  // const [voiceEnded, setVoiceEnded] = useState(true);
  const [
    phase,
    {
      [MainPhase.act]: [actDone],
      [MainPhase.text]: [textInit, textDone, voiceEnded],
      [MainPhase.choose]: [chooseDone],
      [MainPhase.done]: [],
    },
    reset,
  ] = useDTJ<MainPhase>({
    [MainPhase.act]: 1,
    [MainPhase.text]: 3,
    [MainPhase.choose]: 1,
    [MainPhase.done]: 0,
  });

  const voicePlayer = useMemo(() => {
    const re = new Player(options.volume_all * options.volume_BGM);
    re.onended = () => voiceEnded(true);
    return re;
  }, []);
  const currentSentence = useMemo(() => {
    reset();
    QsaveDoneFlag && setQsaveDoneFlag(false);
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
      else if (phase === MainPhase.text) {
        textDone(true);
        voiceEnded(true);
      } else !isSkipMode && setSkipTransfrom(false);
    }
  }, [skipTransfrom, phase, isSkipMode]);
  useEffect(() => {
    if (isAutoMode) {
      if (phase === MainPhase.done) {
        setAutoPlayTimeOut(
          setTimeout(() => {
            handleGoNextSentence();
            setAutoPlayTimeOut(null);
          }, (11 - options.text_autoPlaySpeed) * 500)
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
        updateGlobalSave('autoSave', { sentenceID: pageState.sentenceID!, time: Date.now(), bookVals: pageState.bookValsCache });
        updateGlobalSave('readStoryPath', pageState.currentKeys.storyPath!);
      },
      [MainPhase.text]: function (): void {
        const voiceKey = currentState?.voice;
        // console.log(voiceKey);
        if (voiceKey) voicePlayer.play(getSrc(voiceKey));
        else voiceEnded(true);
      },
      [MainPhase.choose]: function (): void {},
      [MainPhase.done]: function (): void {
        // pageAction.getSave(Math.random() < 0.5 ? 3 : 0).then((e) => pageAction.save(e));
        if (currentState!.bookVals) {
          // console.log(currentState!.bookVals.val1);
          pageAction.updateBookVals(currentState!.bookVals);
        }
        if (isAutoMode) {
          setAutoPlayTimeOut(
            setTimeout(() => {
              handleGoNextSentence();
              setAutoPlayTimeOut(null);
            }, (11 - options.text_autoPlaySpeed) * 500)
            // from options
          );
        } else if (isSkipMode) {
          !currentState!.choose && handleGoNextSentence(void 0, true);
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
      if (!force && phase !== MainPhase.done && [actDone, textInit, textDone, chooseDone].some((e) => !e())) {
        // console.log('skip');
        handleSkipTransfrom();
      } else {
        if (nextSentenceID !== void 0) {
          const nextStoryID = VN.decodeStaticSentenceID(nextSentenceID).staticStoryID,
            currentStoryID = pageState.currentObjs.story!.ID;
          if (currentStoryID === void 0) throw new Error(`handleGoNextSentence(): 获取当前故事ID失败。`);
          if (nextStoryID !== currentStoryID) {
            updateGlobalSave('endedStoryPath', pageState.currentKeys.storyPath!);
            pageAction.setSentenceID(nextSentenceID, pageState.bookVals);
          } else {
            pageAction.setSentenceID(nextSentenceID, pageState.bookValsCache);
          }
          // setNextSentenceID(void 0);
        } else {
          // console.warn(pageState.currentObjs.paragraph, pageState.sentenceID);
          if (pageState.currentObjs.paragraph!.end === pageState.sentenceID) {
            pageAction.jumpToCurrentParagraphEndToStory();
            updateGlobalSave('endedStoryPath', pageState.currentKeys.storyPath!);
          } else pageAction.setSentenceID(pageState.sentenceID! + 1, pageState.bookValsCache);
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
    [autoPlayTimeOut, pageAction, phase]
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
    [handleSkipTransfrom, pageAction]
  );
  // useEffect(() => {
  //   console.log(currentSentence);
  // }, [currentSentence]);
  // console.log([
  //   phase,
  //   deepClone({
  //     phase: actPhase,
  //     currentState,
  //     update: [placeDone, charaInit, charaDone, CGDone].map((e) => e()),
  //   }),
  // ]);
  // console.log(pageState.bookVals);
  const forceUseLastState = phase !== MainPhase.act && skipTransfrom;

  const MainPRef = useRef<HTMLDivElement>(null);

  const keyFns = useMemo<Record<number, ((() => void) | void)[]>>(
    () => ({
      // 'Control'
      17: [() => mode !== 'skip' && setMode('skip'), () => mode === 'skip' && setMode('default')],
      18: [void 0, () => (mode === 'auto' ? setMode('default') : mode === 'default' && setMode('auto'))],
      27: [
        void 0,
        () => {
          setMode('default');
          pageAction.callDialog({
            text: '返回标题会失去未保存的进度！\n确定返回标题界面吗？',
            title: '返回标题',
            optionsCallback: {
              确认: () => {
                pageAction.setActivePage('HomeP');
                return true;
              },
              取消: () => true,
            },
          });
        },
      ],
      83: [
        void 0,
        () => {
          QsaveloadThrottle(() => {
            if (QsaveDoneFlag) return;
            setMode('default');
            pageAction
              .getSave(0)
              .then(pageAction.save)
              .then(() => {
                setQsaveDoneFlag(true);
                pageAction.callMessage({
                  title: '快速保存',
                  text: '快速保存已完成！',
                  icon: 'save',
                });
              });
          });
        },
      ],
      76: [
        void 0,
        () => {
          setMode('default');
          QsaveloadThrottle(() =>
            pageAction.loadSave(0, { handleSkipTransfrom }).catch((error) => {
              pageAction.callMessage({
                text: '未找到Q.save记录！',
                title: '提示',
              });
            })
          );
        },
      ],
    }),
    [QsaveDoneFlag, handleSkipTransfrom, mode, pageAction]
  );
  const controlBarFns = useMemo<[text: string, fn: (() => void) | void, classNamesList?: (string | void)[] | void][]>(
    () => [
      [
        '存/读档',
        () => {
          setMode('default');
          setCoverPage('SaveP');
        },
      ],
      ['Q.save', keyFns[83][1], [QsaveDoneFlag ? 'Qsave-done' : void 0]],
      ['Q.load', keyFns[76][1]],
      ['快进', () => setMode(mode === 'skip' ? 'default' : 'skip'), [mode === 'skip' ? 'active-skip' : void 0]],
      ['自动', () => setMode(mode === 'auto' ? 'default' : 'auto'), [mode === 'auto' ? 'active-auto' : void 0]],
      [
        '设置',
        () => {
          setMode('default');
          setCoverPage('OptionsP');
        },
      ],
      [
        '历史',
        () => {
          setMode('default');
          setCoverPage('HistoryView');
        },
      ],
      ['返回标题', keyFns[27][1]],
    ],
    [QsaveDoneFlag, keyFns, mode]
  );
  return (
    <div
      id="MainP"
      ref={MainPRef}
      tabIndex={0}
      onKeyDown={(e) => {
        keyFns[e.keyCode]?.[0]?.();
      }}
      onKeyUp={(e) => {
        keyFns[e.keyCode]?.[1]?.();
      }}
    >
      {/* <h1>MainP</h1> */}
      <PlaceBox place={currentState?.place} flags={[placeDone]} phase={phase} forceUseLastState={forceUseLastState} />
      <CharaBox charas={currentState?.charas} flags={[charaInit, charaDone]} phase={phase} forceUseLastState={forceUseLastState} />
      <CGBox CG={currentState?.CG} flags={[CGDone]} phase={phase} forceUseLastState={forceUseLastState} />
      <TextBar
        FlowingTextProps={{ text: currentSentence!.text, flags: [textInit, textDone], phase }}
        charaKey={currentSentence.charaKey}
        handleGoNextSentence={() => requestAnimationFrame(() => handleGoNextSentence())}
      />
      <Choose choose={currentSentence.lastState?.choose} flags={[chooseDone]} phase={phase} handleGoNextSentence={handleGoNextSentence}></Choose>

      <ControlButtonsBarBox controlBarFns={controlBarFns} mode={mode} />
      <HistoryView {...{ coverPage, setCoverPage, handleGoNextSentence, handleSkipTransfrom, setMode }} />
      <SaveP {...{ coverPage, setCoverPage, setMode, handleLoadSave }} />
      <OptionsP {...{ coverPage, setCoverPage, setMode, refresh }} />
      <Sound display={true} sound={currentState?.BGM} volume={options.volume_all * options.volume_BGM} fade={true} loop={true} />
    </div>
  );
};
export default MainP;
