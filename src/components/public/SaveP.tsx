import { useState, type FC, useMemo, useLayoutEffect, useReducer, useRef, useEffect, useCallback } from 'react';
import { dbh } from '../../public/handle/IndexedDB';
import { DBSave, usePageState } from '../../pageState';
import { classNames } from '../../public/handle';
import { MainPCoverPage, MainPMode } from '../../pages/MainP';
import './SaveP.less';
import { StrokedText } from './StrokedText';
import { HomePCoverPage } from '../../pages/HomeP';
type SavePProps = {
  coverPage: MainPCoverPage | HomePCoverPage;
  setCoverPage: React.Dispatch<React.SetStateAction<MainPCoverPage>> | React.Dispatch<React.SetStateAction<HomePCoverPage>>;
  setMode?: React.Dispatch<React.SetStateAction<MainPMode>>;
  handleLoadSave: (ID: number) => void;
};
export const SaveP: FC<SavePProps> = ({ coverPage, setCoverPage, setMode, handleLoadSave }) => {
  const { pageState, pageAction } = usePageState();
  const display = coverPage === 'SaveP';
  const [pageNo, setPageNo] = useState(0);
  const [pageTurning, setPageTurning] = useState(false);
  const pageTurningRecoverTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (pageTurning) {
      pageTurningRecoverTimeout.current && clearTimeout(pageTurningRecoverTimeout.current);
      pageTurningRecoverTimeout.current = setTimeout(() => {
        setPageTurning(false);
        pageTurningRecoverTimeout.current = null;
      }, 500);
    }
  }, [pageTurning]);
  const [seletedSaveNo, setSeletedSaveNo] = useState(-1);
  // todo: 需要预览存档吗？
  const [data, setData] = useState<DBSave[] | null>(null);
  const [refreshValue, refresh] = useReducer((e) => {
    setSeletedSaveNo(-1);
    return e + 1;
  }, 0);
  useLayoutEffect(() => {
    setPageNo(0);
    setSeletedSaveNo(-1);
  }, [display]);
  useLayoutEffect(() => {
    if (display) {
      setMode?.('default');
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
    const isMainP = pageState.activePage === 'MainP';
    // eslint-disable-next-line complexity
    return pageData.map((e, i) => {
      if (i === 0 && pageNo === 0) {
        if (e === void 0)
          return (
            <div
              className={classNames('save-item', 'quick-save', seletedSaveNo === 0 ? 'selected' : void 0)}
              key={0}
              onClick={(e) => {
                e.stopPropagation();
                setSeletedSaveNo(0);
              }}
            >
              <div className="body">
                <div className="ID">{'Q.save'}</div>
              </div>
            </div>
          );
        else
          return (
            <div
              className={classNames('save-item', 'quick-save', seletedSaveNo === 0 ? 'selected' : void 0)}
              key={0}
              onClick={(e) => {
                e.stopPropagation();
                setSeletedSaveNo(0);
              }}
            >
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
              <div className="body">
                <div className="capture">
                  <img src={e.capture} />
                </div>
                <div className="text-lines">
                  <p className="chara-name">{e.charaName}</p>
                  <p className="text">{e.text}</p>
                </div>
                <div className="ID">{'Q.save'}</div>
              </div>
              <div
                className={'action'}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="load" onClick={() => handleLoadSave(0)}>
                  {'读取'}
                </div>
              </div>
            </div>
          );
      }
      let ID: number;
      if (e === void 0) {
        // 槽位空
        ID = pageNo * 8 + i;
        return (
          <div
            className={classNames('save-item', seletedSaveNo === ID ? 'selected' : void 0)}
            key={ID}
            onClick={
              isMainP
                ? (e) => {
                    e.stopPropagation();
                    setSeletedSaveNo(ID);
                  }
                : void 0
            }
            // onClick={() => {
            //   handleSave(ID, false);
            // }}
          >
            <div className="body">
              <div className="ID">{pageNo * 8 + i}</div>
            </div>
            <div
              className={'action'}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {isMainP && (
                <div className="save" onClick={() => handleSave(ID, true)}>
                  {'保存'}
                </div>
              )}
            </div>
          </div>
        );
      } else {
        ID = e.ID;
        // 槽位已有存档
        return (
          <div
            className={classNames('save-item', seletedSaveNo === ID ? 'selected' : void 0)}
            key={ID}
            onClick={(e) => {
              e.stopPropagation();
              setSeletedSaveNo(ID);
            }}
          >
            <div className="header">
              <StrokedText
                text={((d) =>
                  `${d
                    .toLocaleDateString()
                    .split('/')
                    .map((e, i) => (i === 0 ? e.slice(2, 4) : e.padStart(2, '0')))
                    .join('/')} ${d.toLocaleTimeString(void 0, { hour: '2-digit', minute: '2-digit' })}`)(new Date(e.time))}
                frontColor="#456a"
                backColor="#6782"
                className={'save-date-text'}
              />
              <div className="text">
                <StrokedText text={`存档 ${ID}`} frontColor="#eefb" backColor="#eef2" />
              </div>
              {/* <div className="delete">
                <StrokedText text={`删除`} frontColor="#eefb" backColor="#eef2" />
              </div> */}
            </div>
            <div className="body">
              <div className="capture">
                <img src={e.capture} />
              </div>
              <div className="text-lines">
                <p className="chara-name">{e.charaName}</p>
                <p className="text">{e.text}</p>
              </div>
              <div className="ID">{ID}</div>
            </div>
            <div
              className={'action'}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="load" onClick={() => handleLoadSave(ID)}>
                {'读取'}
              </div>
              {isMainP && (
                <div className="save" onClick={() => handleSave(ID, true)}>
                  {'保存'}
                </div>
              )}
            </div>
          </div>
        );
      }
    });
  }, [data, pageNo, seletedSaveNo]);
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
            setSeletedSaveNo(-1);
          }}
          key={e}
        >
          <StrokedText text={(e + 1).toString()} frontColor={'#778'}></StrokedText>
        </div>,
        <div className="gap" key={-e - 1} />,
      ]),
    [pageNo]
  );
  const handleClose = useCallback(() => {
    setCoverPage(null);
    setTimeout(() => {
      setData(null);
    }, 500);
  }, []);

  const handleSave = useCallback((ID: number, replace: boolean) => {
    if (replace) {
      pageAction.callDialog({
        text: `覆盖存档后，旧存档将不能找回！\n确认覆盖 ${ID} 号存档吗？`,
        title: '存档覆盖确认',
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
      });
    } else {
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
    }
  }, []);
  return (
    <div className={classNames('SaveP', display ? void 0 : 'hide')} data-html2canvas-ignore>
      <div
        className={classNames('save-seletor', pageTurning ? 'hide' : void 0)}
        onTransitionEnd={pageTurning ? () => setPageTurning(false) : void 0}
        onClick={() => setSeletedSaveNo(-1)}
      >
        {pageTurning ? lastSaveSeletorInnerRef.current : saveSeletorInner}
      </div>
      <div className="page-seletor">{pageSeletotInner}</div>
      {/* <div className="save-detail"></div> */}

      <div className="header-btns-bar">
        <div className="close" onClick={handleClose}></div>
      </div>
    </div>
  );
};
