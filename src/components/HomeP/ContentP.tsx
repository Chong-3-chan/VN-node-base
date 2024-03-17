import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react';
import './ContentP.less';
import { usePageState } from '../../pageState';
import { staticBookRecord } from '../../data/data';
import { classNames, deepClone } from '../../public/handle';
import { HomePCoverPage } from '../../pages/HomeP';
import { VN } from '../../class/Book';
import { Checker } from '../../data/globalSave';
import { getSrc } from '../../data/getData';

type ContentPProps = {
  coverPage: HomePCoverPage;
  setCoverPage: React.Dispatch<React.SetStateAction<ContentPProps['coverPage']>>;
};
export const ContentP: FC<ContentPProps> = ({ coverPage, setCoverPage }) => {
  const { pageAction, pageState } = usePageState();
  const [index, setIndex] = useState(0);
  const extraStyle = { '--index': index };
  //   staticBookRecord;
  const [bookList, mini, maxi] = ((e) => [e, 0, e.length - 1])(
    useMemo(() => {
      const re: [string, VN.StaticBook & { checkResult?: boolean }][] = Object.entries(deepClone(staticBookRecord));
      re.forEach(([key, obj]) => {
        const { check } = obj;
        obj.checkResult = new Checker(check).check()!;
      });
      return re;
    }, [])
  );
  const [switching, setSwitching] = useState(false);
  const [footerText, setFooterText] = useState('');
  const [headerText, setHeaderText] = useState('');
  useEffect(() => {
    if (!switching) setFooterText(bookList[index][1].checkResult ? '从这里开始' : '未解锁');
    if (!switching) setHeaderText(bookList[index][0]);
  }, [switching]);
  const handleClose = () => {
    setCoverPage(null);
  };
  const handlePrev = () => {
    if (index > mini) {
      setIndex(index - 1);
      setSwitching(true);
    }
  };
  const handleNext = () => {
    if (index < maxi) {
      setIndex(index + 1);
      setSwitching(true);
    }
  };
  return (
    <div className={classNames('ContentP', coverPage !== 'ContentP' ? 'hide' : void 0)} style={extraStyle as CSSProperties}>
      <div className={classNames('header', switching ? 'hide' : void 0)}>{headerText}</div>
      <div className={classNames('container', switching ? 'switching' : void 0)}>
        <div className="viewer">
          <div
            className="wrapper"
            onTransitionEnd={(e) => {
              if (e.nativeEvent.propertyName === 'transform') setSwitching(false);
            }}
          >
            {pageState.initDone &&
              bookList.map(([key, { ID, cover, check, checkResult }], i) => {
                return (
                  <div
                    className={classNames('book-cover-box', index === i ? 'selected' : void 0, !checkResult ? 'locked' : void 0)}
                    onClick={() => {
                      if (checkResult) pageAction.setSentenceID(VN.encodeStaticSentenceID({ StaticBookID: ID }));
                    }}
                    key={key}
                  >
                    <img src={getSrc(cover)} alt={key}></img>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="btn-prev" onClickCapture={handlePrev}></div>
        <div className="btn-next" onClickCapture={handleNext}></div>
      </div>
      <div
        className={classNames('footer', switching ? 'hide' : void 0)}
        onClick={() => {
          if (bookList[index][1].checkResult) pageAction.setSentenceID(VN.encodeStaticSentenceID({ StaticBookID: bookList[index][1].ID }));
        }}
      >
        {footerText}
      </div>
      <div className="header-btns-bar">
        <div className="close" onClick={handleClose}></div>
      </div>
    </div>
  );
};
