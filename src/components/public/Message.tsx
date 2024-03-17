import { FC, useEffect, useMemo } from 'react';
import './Message.less';
import { StrokedText } from './StrokedText';
import { classNames } from '../../public/handle';
type MessageIcon = 'save';
export type MessageProps = {
  title: string;
  text: string;
  icon?: MessageIcon;
  onClick?: () => void;
  // cb返回true则关闭（执行destory），否则不关闭
};
const lazyHideDelay = 1500;
export type MessagePropsRuntime = MessageProps & { destory: () => void; lazyHide: (() => void) | null };
export const Message: FC<MessagePropsRuntime> = ({ title, text, icon, onClick, lazyHide, destory }) => {
  const time = useMemo(() => Date.now(), []);
  useEffect(() => {
    setTimeout(() => lazyHide!(), lazyHideDelay);
  }, []);
  return (
    <div
      className={classNames('message', lazyHide === null ? 'hide' : void 0)}
      onClick={onClick}
      onTransitionEnd={lazyHide === null ? () => destory?.() : void 0}
    >
      <div className={classNames('icon', icon)}></div>
      <div className="title">{title}</div>
      <div className="text">
        {text.split('\n').map((e, i) => (
          <p key={i}>{e}</p>
        ))}
      </div>
      <div className="time">{`${new Date(time).toLocaleTimeString(void 0, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}</div>
    </div>
  );
};
