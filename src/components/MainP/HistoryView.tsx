import { FC, useEffect, useRef, useState } from 'react';
import { EXStaticSentence, charaRecord, sentenceCache } from '../../data/data';
import { classNames } from '../../handle';
import { StrokedText } from '../public/StrokedText';
import { usePageState } from '../../pageState';
import './HistoryView.less';
type HistoryViewProps = {
  histroyView: boolean;
  setHistroyView: React.Dispatch<React.SetStateAction<HistoryViewProps['histroyView']>>;
};
export const HistoryView: FC<HistoryViewProps> = ({ histroyView, setHistroyView }) => {
  const { pageAction, pageState } = usePageState();
  const [display, setDisplay] = useState(false);
  const histroyViewCache = useRef<EXStaticSentence[] | null>(null);
  const historyViewBoxRef = useRef<HTMLDivElement | null>(null);
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
        .filter((e) => e);
      setDisplay(true);
    }
  }, [histroyView]);
  return (
    <div className={classNames('history-view', display ? void 0 : 'hide')}>
      <div className="history-view-box" ref={historyViewBoxRef}>
        <div className="history-list">
          {(histroyViewCache.current ?? [])!.map((e: any) => (
            <div className="history-item" key={e.ID}>
              <div className="header">
                <div className="history-btns-bar">
                  {true && <div className={classNames('btn', 'jump-to')}></div>}
                  {true && <div className={classNames('btn', 'voice')}></div>}
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
        <div
          className="close"
          onClick={() => {
            setDisplay(false);
            setHistroyView(false);
            histroyViewCache.current = null;
          }}
        ></div>
      </div>
    </div>
  );
};
