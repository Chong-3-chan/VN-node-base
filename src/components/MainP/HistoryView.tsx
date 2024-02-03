import { FC, useEffect, useRef, useState } from 'react';
import { EXStaticSentence, charaRecord, sentenceCache } from '../../data/data';
import { classNames } from '../../public/handle';
import { StrokedText } from '../public/StrokedText';
import { FXPhase, usePageState } from '../../pageState';
import './HistoryView.less';
import { MainPMode } from '../../pages/MainP';
type HistoryViewProps = {
  histroyView: boolean;
  setHistroyView: React.Dispatch<React.SetStateAction<HistoryViewProps['histroyView']>>;
  // phase: MainPhase;
  handleGoNextSentence: (nextSentenceID?: number, force?: boolean) => void;
  handleSkipTransfrom: () => void;
  setMode: React.Dispatch<React.SetStateAction<MainPMode>>;
};
export const HistoryView: FC<HistoryViewProps> = ({ histroyView, setHistroyView, handleGoNextSentence, handleSkipTransfrom, setMode }) => {
  const { pageAction, pageState } = usePageState();
  const [display, setDisplay] = useState(false);
  const histroyViewCache = useRef<EXStaticSentence[] | null>(null);
  const historyViewBoxRef = useRef<HTMLDivElement | null>(null);
  const jumpFXFns = useRef<any>();
  useEffect(() => {
    if (histroyView) {
      requestAnimationFrame(() => {
        historyViewBoxRef.current && (historyViewBoxRef.current.scrollTop = historyViewBoxRef.current.scrollHeight);
      });
      histroyViewCache.current = [
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
  }, [histroyView]);
  const closeHandle = () => {
    setDisplay(false);
    setHistroyView(false);
    setMode('default');
    histroyViewCache.current = null;
  };
  return (
    <div className={classNames('history-view', display ? void 0 : 'hide')}>
      <div className="history-view-box" ref={historyViewBoxRef}>
        <div className="history-list">
          {(histroyViewCache.current ?? [])!.map((e: EXStaticSentence) => (
            <div className="history-item" key={e.ID}>
              <div className="header">
                <div className="history-btns-bar">
                  {true && ( // 始终显示吗？
                    <div
                      className={classNames('btn', 'jump-to')}
                      onClick={() => {
                        pageAction.callDialog({
                          text: '跳转将会丢失未存档的阅读进度！\n请问确认跳转吗？',
                          title: '提示',
                          // onClose: () => alert('close'),
                          optionsCallback: {
                            跳转: () => {
                              const fx = pageAction.callFX['transition-black-full']();
                              const nextSentenceID = e.ID;
                              fx.assignOnStepCase({
                                [FXPhase.keep]: () => {
                                  closeHandle();
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
                  )}
                  {e.lastState?.voice && <div className={classNames('btn', 'voice')}></div>}
                </div>
                <div className="chara-name">
                  <StrokedText text={charaRecord[e.charaKey]?.name ?? ''}></StrokedText>
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
        <div className="close" onClick={closeHandle}></div>
      </div>
    </div>
  );
};
