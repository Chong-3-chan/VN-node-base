import { FC } from 'react';
import { classNames } from '../../public/handle';
import './StrokedText.less';
type StrokedTextProps = {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  frontColor?: string;
  backColor?: string;
};
export const StrokedText: FC<StrokedTextProps> = ({ text, className, style, frontColor = '#ddddd0', backColor = '#555550' }) => {
  return (
    <>
      {text.split('\n').map((textLine, i) => (
        <div className={classNames('stroked-text', className)} style={style} key={i}>
          {textLine.split('').map((c, i) => {
            return (
              <span className="single-char" key={i}>
                {c}
                <span className="back" style={{ color: backColor, WebkitTextStrokeColor: backColor }}>
                  {c}
                </span>
                <span className="front" style={{ color: frontColor }}>
                  {c}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
};
