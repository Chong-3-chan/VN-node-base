import { FC, useEffect, useRef, useState } from 'react';
import { EXStaticSentence, charaRecord, fileRecord, sentenceCache } from '../../data/data';
import { classNames } from '../../public/handle';
import { StrokedText } from '../public/StrokedText';
import { FXPhase, usePageState } from '../../pageState';
import './HistoryView.less';
import { MainPCoverPage, MainPMode } from '../../pages/MainP';
import { dbh } from '../../public/handle/IndexedDB';
import { play } from '../../class/Sound';
import { getOptions } from '../../data/globalSave';
import { DBfile, FileInfo } from '../../class/Records';
import { getSrcAsync } from '../../data/getData';
type HistoryViewProps = {
  coverPage: MainPCoverPage;
  setCoverPage: React.Dispatch<React.SetStateAction<HistoryViewProps['coverPage']>>;
  // phase: MainPhase;
  handleGoNextSentence: (nextSentenceID?: number, force?: boolean) => void;
  handleSkipTransfrom: () => void;
  setMode: React.Dispatch<React.SetStateAction<MainPMode>>;
};
export const HistoryView: FC<HistoryViewProps> = ({ coverPage, setCoverPage, handleGoNextSentence, handleSkipTransfrom, setMode }) => {
  const { pageAction, pageState } = usePageState();
  const [display, setDisplay] = useState(false);
  const historyViewCache = useRef<EXStaticSentence[] | null>(null);
  const historyViewBoxRef = useRef<HTMLDivElement | null>(null);
  const options = getOptions();
  const audioRef = useRef<HTMLAudioElement | null>();
  // const jumpFXFns = useRef<any>();
  useEffect(() => {
    if (coverPage === 'HistoryView') {
      requestAnimationFrame(() => {
        historyViewBoxRef.current && (historyViewBoxRef.current.scrollTop = historyViewBoxRef.current.scrollHeight);
      });
      historyViewCache.current = [
        pageState.currentObjs
          .paragraph!.source.map((paragraphKey) => {
            const { start, end } = pageState.currentObjs.story!.paragraphRecord[paragraphKey];
            return Array.from({ length: end - start + 1 }, (e, i) => i + start);
          })
          .flat(1),
        Array.from({ length: pageState.sentenceID! - pageState.currentObjs.paragraph!.start }, (e, i) => i + pageState.currentObjs.paragraph!.start),
      ]
        .flat(1)
        .map((e) => sentenceCache.get(e)!)
        .filter(Boolean);
      setDisplay(true);
    }
  }, [coverPage]);
  const handleClose = () => {
    setDisplay(false);
    setCoverPage(null);
    setTimeout(() => {
      historyViewCache.current = null;
    }, 500);
  };
  const historyList = historyViewCache.current ?? [];
  return (
    <div className={classNames('history-view', display ? void 0 : 'hide')} data-html2canvas-ignore>
      <div className="history-view-box" ref={historyViewBoxRef}>
        <div className="history-list">
          {historyList.map((e: EXStaticSentence) => (
            <div className="history-item" key={e.ID}>
              <div className="header">
                <div className="history-btns-bar">
                  <div
                    className={classNames('btn', 'jump-to')}
                    onClick={() => {
                      pageAction.callDialog({
                        text: '跳转将会丢失未存档的阅读进度！\n请问确认跳转吗？',
                        title: '提示',
                        optionsCallback: {
                          跳转: () => {
                            const fx = pageAction.callFX['transition-black-full']('跳转……');
                            const nextSentenceID = e.ID;
                            fx.assignOnStepCase({
                              [FXPhase.keep]: () => {
                                handleClose();
                                handleGoNextSentence(nextSentenceID, true);
                                setTimeout(() => {
                                  handleSkipTransfrom();
                                  fx.out();
                                }, 100);
                              },
                            });
                            return true;
                          },
                          取消: () => true,
                        },
                      });
                    }}
                  ></div>
                  {e.lastState?.voice && (
                    <div
                      className={classNames('btn', 'voice')}
                      onClick={async () => {
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current.src = '';
                          audioRef.current.load();
                          audioRef.current = null;
                        }
                        let audio: HTMLAudioElement | null = play('', options.volume_all * options.volume_voice);
                        audioRef.current = audio;
                        const code = await getSrcAsync(e.lastState!.voice!);
                        if (audioRef.current === audio) {
                          audio.src = code;
                          audio.play();
                        } else audio = null;
                      }}
                    ></div>
                  )}
                </div>
                <div className="chara-name">
                  <StrokedText text={charaRecord[e.charaKey]?.name ?? e.charaKey}></StrokedText>
                </div>
              </div>
              <div className="body">
                <div className="text">
                  <StrokedText text={e.text}></StrokedText>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="header-btns-bar">
        <div className="close" onClick={handleClose}></div>
      </div>
    </div>
  );
};
