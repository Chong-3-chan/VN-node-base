import { FC, useEffect, useRef } from 'react';
import { Book_KeyIDEnum, SentenceState, staticBookRecord, staticStoryRecord } from '../../data/data';
import { MainPhase } from '../../public/MainP';
import { usePageState } from '../../pageState';
import './Choice.less';
import { classNames } from '../../handle';
import { StrokedText } from '../public/StrokedText';
type ChoiceProps = {
  choice: SentenceState['choice'];
  flags: ((value?: boolean) => boolean)[];
  phase: MainPhase;
};
export const Choice: FC<ChoiceProps> = ({ choice, flags: [done], phase }) => {
  const { pageState, pageAction } = usePageState();
  const doneFlag = done(),
    updateDone = () => done(true);
  const isActive = !!choice;
  useEffect(() => {
    if (!choice && !doneFlag) {
      updateDone();
    }
  });
  const child = useRef<HTMLDivElement>(null!);
  return (
    <div className={classNames('choice', !isActive ? 'hide' : void 0)}>
      <div className="options-box" ref={child} style={{ transform: `translateY(${Math.max(0.0, -child.current?.offsetTop)}px)` }}>
        {isActive &&
          choice.map(([type, nextAny, text], i) => (
            <div
              className="option"
              key={i}
              onClick={() => {
                console.log(type, nextAny, text);
                if (type === 'para') {
                  const currentStoryKey = pageState.currentKeys.story;
                  if (currentStoryKey === null) throw new Error(`choice-story: currentStoryKey异常`);
                  const nextParagraphKey = nextAny;
                  pageAction.setSentenceID(staticStoryRecord[currentStoryKey].paragraphRecord[nextParagraphKey].start);
                } else if (type === 'story') {
                  const currentBookKey = pageState.currentKeys.book;
                  if (currentBookKey === null) throw new Error(`choice-story: currentBookKey异常`);
                  const nextStoryKey = nextAny;
                  const nextStoryID = staticBookRecord[currentBookKey].Story_KeyIDEnum[nextStoryKey];
                  if (typeof nextStoryID !== 'number') {
                    throw new Error(
                      `choice-story: 未找到故事Key(${nextStoryKey})对应ID，于: \n${JSON.stringify(
                        staticBookRecord[currentBookKey].Story_KeyIDEnum,
                        null,
                        2
                      )}`
                    );
                  }
                  pageAction.setSentenceID(nextStoryID << 16);
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
