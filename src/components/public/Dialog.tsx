import { FC } from 'react';

type DialogProps = {
  title: string;
  text: string;
  onClose: () => void;
  optionsCallback: { [optionText: string]: () => void };
};
export const Dialog: FC<DialogProps> = ({ title, text, onClose, optionsCallback }) => {
  return (
    <div className="Dialog">
      <div className="header">
        <div className="title">{title}</div>
        <div className="close" onClick={onClose}></div>
      </div>
      <div className="body">
        <div className="text">{text}</div>
      </div>
      <div className="footer">
        <div className="options">
          {Object.entries(optionsCallback).map(([text, cb]) => {
            return (
              <div className="option-item" key={text} onClick={cb}>
                {text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
