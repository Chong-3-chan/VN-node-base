import { FC, useEffect, useLayoutEffect, useRef } from 'react';
import { Book_KeyIDEnum, SentenceState, staticBookRecord, staticStoryRecord } from '../../data/data';
import { MainPhase } from '../../public/MainP';
import { usePageState } from '../../pageState';
import './Choose.less';
import { classNames } from '../../public/handle';
import { StrokedText } from '../public/StrokedText';
type ChooseProps = {
  choose: SentenceState['choose'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
  handleGoNextSentence: (nextSentenceID: number, force: true) => void;
};
export const Choose: FC<ChooseProps> = ({ choose, flags: [done], phase, handleGoNextSentence }) => {
  const { pageState, pageAction } = usePageState();
  const doneFlag = done(),
    updateDone = () => done(true);
  const isActive = choose && phase === MainPhase.choose;
  useLayoutEffect(() => {
    if (!choose && !doneFlag) {
      updateDone();
    }
  });
  const child = useRef<HTMLDivElement>(null!);
  return (
    <div className={classNames('choose', !isActive ? 'hide' : void 0)}>
      <div className="options-box" ref={child} style={{ transform: `translateY(${Math.max(0.0, -child.current?.offsetTop)}px)` }}>
        {choose &&
          choose.map(([type, nextAny, text], i) => (
            <div
              className="option"
              key={i}
              onClick={() => {
                console.log(type, nextAny, text);
                if (type === 'para') {
                  const currentStoryKey = pageState.currentKeys.story;
                  if (currentStoryKey === null) throw new Error(`choose-story: currentStoryKey异常`);
                  const nextParagraphKey = nextAny;
                  handleGoNextSentence(staticStoryRecord[currentStoryKey].paragraphRecord[nextParagraphKey].start, true);
                  updateDone(); 
                  // 故事跳转不需要updateDone。如果都update，则在快进模式下选择故事跳转选项会出错。
                } else if (type === 'story') {
                  const currentBookKey = pageState.currentKeys.book;
                  if (currentBookKey === null) throw new Error(`choose-story: currentBookKey异常`);
                  const nextStoryKey = nextAny;
                  const nextStoryID = staticBookRecord[currentBookKey].Story_KeyIDEnum[nextStoryKey];
                  if (typeof nextStoryID !== 'number') {
                    throw new Error(
                      `choose-story: 未找到故事Key(${nextStoryKey})对应ID，于: \n${JSON.stringify(
                        staticBookRecord[currentBookKey].Story_KeyIDEnum,
                        null,
                        2
                      )}`
                    );
                  }
                  handleGoNextSentence(nextStoryID << 16, true);
                }
              }}
            >
              {<StrokedText text={text}></StrokedText>}
            </div>
          ))}
      </div>
    </div>
  );
};
