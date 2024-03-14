import { useState, type FC, useMemo, useLayoutEffect, useReducer, useRef, useEffect } from 'react';
import { dbh } from '../../public/handle/IndexedDB';
import { DBSave, usePageState } from '../../pageState';
import { classNames } from '../../public/handle';
import { MainPCoverPage, MainPMode } from '../../pages/MainP';
import './SaveP.less';
import { StrokedText } from '../public/StrokedText';
type SavePProps = {
  coverPage: MainPCoverPage;
  setCoverPage: React.Dispatch<React.SetStateAction<SavePProps['coverPage']>>;
  setMode: React.Dispatch<React.SetStateAction<MainPMode>>;
  handleLoadSave: (ID: number) => void;
};
export const SaveP: FC<SavePProps> = ({ coverPage, setCoverPage, setMode, handleLoadSave }) => {
  const { pageState, pageAction } = usePageState();
  const display = coverPage === 'SaveP';
  const [pageNo, setPageNo] = useState(0);
  const [pageTurning, setPageTurning] = useState(false);
  // const [seletedSaveNo, setSeletedSaveNo] = useState(-1);
  // todo: 需要预览存档吗？
  const [data, setData] = useState<DBSave[] | null>(null);
  const [refreshValue, refresh] = useReducer((e) => e + 1, 0);
  useLayoutEffect(() => {
    if (display) {
      setMode('default');
      dbh.getAll('Save').then((e: DBSave[]) => {
        //   console.log(e);
        const readData: DBSave[] = [];
        e.forEach((save) => {
          readData[save.ID] = save;
        });
        setData(readData);
      });
    }
  }, [refreshValue, display]);
  const lastSaveSeletorInnerRef = useRef<JSX.Element[]>(null!);
  const saveSeletorInner = useMemo(() => {
    const pageData: (DBSave | void)[] = Array(8).fill(void 0);
    if (data !== null) {
      pageData.forEach((e, i) => {
        if (data[pageNo * 8 + i] !== void 0) pageData[i] = data[pageNo * 8 + i];
      });
    }
    return pageData.map((e, i) => {
      if (i === 0 && pageNo === 0) {
        if (e === void 0)
          return (
            <div className={classNames('save-item', 'quick-save')} key={0}>
              <div className="ID">{'Q.save'}</div>
            </div>
          );
        else
          return (
            <div className={classNames('save-item', 'quick-save')} key={0}>
              <div className="header">
                <StrokedText
                  text={((d) =>
                    `${d
                      .toLocaleDateString()
                      .split('/')
                      .map((e, i) => (i === 0 ? e.slice(2, 4) : e.padStart(2, '0')))
                      .join('/')} ${d.toLocaleTimeString(void 0, { hour: '2-digit', minute: '2-digit' })}`)(new Date(e.time))}
                  frontColor="#4567"
                  backColor="#6786"
                  className={'save-date-text'}
                />
                <div className="text">
                  <StrokedText text={`快速存档`} frontColor="#eef9" backColor="#eef6" />
                </div>
              </div>
              <div className="capture">
                <img src={e.capture} />
              </div>
              <div className="text-lines">
                <p className="chara-name">{e.charaName}</p>
                <p className="text">{e.text}</p>
              </div>
              <div className="ID">{'Q.save'}</div>
            </div>
          );
      }
      let ID: number;
      if (e === void 0) {
        // 槽位空
        ID = pageNo * 8 + i;
        return (
          <div
            className="save-item"
            key={ID}
            onClick={() => {
              pageAction.callDialog({
                text: `确认保存新存档为 ${ID} 号？`,
                title: '存档确认',
                optionsCallback: {
                  保存: () => {
                    pageAction
                      .getSave(ID)
                      .then((e) => pageAction.save(e))
                      .then(() => refresh());
                    return true;
                  },
                  取消: () => true,
                },
              });
            }}
          >
            <div className="ID">{pageNo * 8 + i}</div>
          </div>
        );
      } else {
        ID = e.ID;
        // 槽位已有存档
        return (
          <div className="save-item" key={ID}>
            <div className="header">
              <StrokedText
                text={((d) =>
                  `${d
                    .toLocaleDateString()
                    .split('/')
                    .map((e, i) => (i === 0 ? e.slice(2, 4) : e.padStart(2, '0')))
                    .join('/')} ${d.toLocaleTimeString(void 0, { hour: '2-digit', minute: '2-digit' })}`)(new Date(e.time))}
                frontColor="#4567"
                backColor="#6786"
                className={'save-date-text'}
              />
              <div className="text">
                <StrokedText text={`存档 ${ID}`} frontColor="#eef9" backColor="#eef6" />
              </div>
              <div className="delete">
                <StrokedText text={`删除`} frontColor="#eef9" backColor="#eef6" />
              </div>
            </div>
            <div
              className="capture"
              onClick={() =>
                pageAction.callDialog({
                  text: `覆盖存档后，旧存档将不能找回！\n确认覆盖 ${ID} 号存档吗？`,
                  title: '新存档覆盖确认',
                  optionsCallback: {
                    覆盖并保存: () => {
                      pageAction
                        .getSave(ID)
                        .then((e) => pageAction.save(e))
                        .then(() => refresh());
                      return true;
                    },
                    取消: () => true,
                  },
                })
              }
            >
              <img src={e.capture} />
            </div>
            <div className="text-lines" onClick={() => handleLoadSave(ID)}>
              <p className="chara-name">{e.charaName}</p>
              <p className="text">
                {e.text}
                {e.text}
                {e.text}
                {e.text}
                {e.text}
              </p>
            </div>
            <div className="ID">{ID}</div>
          </div>
        );
      }
    });
  }, [data, pageNo]);
  useEffect(() => {
    if (!pageTurning) lastSaveSeletorInnerRef.current = saveSeletorInner;
  }, [pageTurning]);
  const pageSeletotInner = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((e) => [
        <div
          className={classNames('page-seletor-item', pageNo === e ? 'selected' : void 0)}
          onClick={() => {
            setPageTurning(true);
            setPageNo(e);
          }}
          key={e}
        >
          <StrokedText text={(e + 1).toString()} frontColor={'#778'}></StrokedText>
        </div>,
        <div className="gap" key={-e - 1} />,
      ]),
    [pageNo]
  );
  const closeHandle = () => {
    setCoverPage(null);
    setData(null);
  };
  return (
    <div className={classNames('SaveP', display ? void 0 : 'hide')} data-html2canvas-ignore>
      <div className={classNames('save-seletor', pageTurning ? 'hide' : void 0)} onTransitionEnd={pageTurning ? () => setPageTurning(false) : void 0}>
        {pageTurning ? lastSaveSeletorInnerRef.current : saveSeletorInner}
      </div>
      <div className="page-seletor">{pageSeletotInner}</div>
      {/* <div className="save-detail"></div> */}

      <div className="header-btns-bar">
        <div className="close" onClick={closeHandle}></div>
      </div>
    </div>
  );
};
