import { FC, useState } from 'react';
import { sentenceCache } from '../../data/data';
import { classNames } from '../../public/handle';
import { StrokedText } from '../public/StrokedText';
import { ActivePage, usePageState } from '../../pageState';
import './ControlButtonsBarBox.less';
import { MainPCoverPage, MainPMode } from '../../pages/MainP';

type HistoryViewProps = {
  mode: MainPMode;
  controlBarFns: [text: string, fn: (() => void) | void, classNamesList?: (string | void)[] | void][];
};
export const ControlButtonsBarBox: FC<HistoryViewProps> = ({ mode, controlBarFns }) => {
  const { pageAction, pageState } = usePageState();
  const [controlBarDisplay, setControlBarDisplay] = useState(true);
  const [buttonsBarTransforming, setButtonsBarTransforming] = useState(false);
  return (
    <div className={classNames('control-btns-bar-box')} data-html2canvas-ignore>
      <div
        className={classNames('control-btns-bar', !controlBarDisplay ? 'hide' : void 0)}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform') {
            setButtonsBarTransforming(false);
          }
        }}
      >
        {controlBarFns.map(([text, fn, classNamesList], i) => {
          return (
            <div className={classNames('btn', ...(classNamesList ?? []))} key={i} onClick={fn!}>
              <StrokedText text={text} frontColor="#ffeeff" backColor="#ffeeff33"></StrokedText>
            </div>
          );
        })}
      </div>
      <div className="fn-box">
        <div
          className={classNames(
            'fn',
            controlBarDisplay ? 'close' : 'open',
            buttonsBarTransforming ? 'transforming' : void 0,
            mode !== 'default' ? `active-${mode}` : void 0
          )}
          onClick={() => {
            setControlBarDisplay(!controlBarDisplay);
            setButtonsBarTransforming(true);
          }}
        >
          {/* <svg className="gear" viewBox="0 0 48 48" fill="none">
            <path
              d="M15 24V11.8756L25.5 17.9378L36 24L25.5 30.0622L15 36.1244V24Z"
              fill="none"
              stroke="#bbbbbb"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg> */}
          {/* <IconGear className="gear" /> */}
          <div className="gear" />
        </div>
      </div>
    </div>
  );
};
