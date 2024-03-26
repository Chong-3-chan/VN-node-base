import { FC } from 'react';
import './Dialog.less';
import { StrokedText } from './StrokedText';
export type DialogProps = {
  title: string;
  text: string;
  onClose?: () => void;
  optionsCallback: { [optionText: string]: () => boolean };
  destroy?: () => void;
  // cb返回true则关闭（执行destroy），否则不关闭
};
export type DialogPropsRuntime = DialogProps & { destroy: () => void };
export const Dialog: FC<DialogPropsRuntime> = ({ title, text, onClose, optionsCallback, destroy }) => {
  return (
    <div className="dialog">
      <div className="header">
        <div className="title">
          <StrokedText text={title}></StrokedText>
        </div>
        {/* <div
          className="close"
          onClick={() => {
            onClose();
            destroy();
          }}
        ></div> */}
      </div>
      <div className="body">
        <div className="text">
          <StrokedText text={text}></StrokedText>
        </div>
      </div>
      <div className="footer">
        <div className="options">
          {Object.entries(optionsCallback).map(([text, cb]) => {
            return (
              <div
                className="option-item"
                key={text}
                onClick={() => {
                  if (cb()) {
                    onClose && onClose();
                    destroy();
                  }
                }}
              >
                <StrokedText text={text}></StrokedText>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
