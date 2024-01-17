import { FC, useState } from 'react';
import { sentenceCache } from '../../data/data';
import { classNames } from '../../public/handle';
import { StrokedText } from '../public/StrokedText';
import { usePageState } from '../../pageState';
import './ControlButtonsBarBox.less';
import { MainPMode } from '../../pages/MainP';

type HistoryViewProps = {
  mode: MainPMode;
  setMode: React.Dispatch<React.SetStateAction<HistoryViewProps['mode']>>;
  setHistroyView: React.Dispatch<React.SetStateAction<boolean>>;
};
export const ControlButtonsBarBox: FC<HistoryViewProps> = ({ setHistroyView, mode, setMode }) => {
  const [controlBarDisplay, setControlBarDisplay] = useState(false);
  const [buttonsBarTransforming, setButtonsBarTransforming] = useState(false);
  return (
    <div className={classNames('control-btns-bar-box')}>
      <div
        className={classNames('control-btns-bar', controlBarDisplay ? 'display' : 'hide')}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform') {
            setButtonsBarTransforming(false);
          }
        }}
      >
        {(
          [
            ['保存(施工)'],
            ['读取(施工)'],
            ['设置(施工)'],
            ['快进', () => setMode(mode === 'skip' ? 'default' : 'skip'), [mode === 'skip' ? 'active-skip' : void 0]],
            ['历史', () => setHistroyView(true)],
            ['自动', () => setMode(mode === 'auto' ? 'default' : 'auto'), [mode === 'auto' ? 'active-auto' : void 0]],
          ] as [text: string, fn?: () => void, classNamesList?: string[]][]
        ).map(([text, fn, classNamesList], i) => {
          return (
            <div className={classNames('btn', ...(classNamesList ?? []))} key={i} onClick={fn}>
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
