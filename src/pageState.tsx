import {
  CSSProperties,
  FC,
  PropsWithChildren,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { LoadingPProps } from './pages/LoadingP';
import {
  Book_KeyIDEnum,
  KKVRecord,
  charaRecord,
  homeResource,
  sentenceCache,
  staticBookRecord,
  staticStoryRecord,
  tipsGroupRecord,
} from './data/data';
import { VN } from './class/Book';
import { EXStaticSentence, updateFileCache } from './data/getData';
import { DialogProps, Dialog, DialogPropsRuntime } from './components/public/Dialog';
import { classNames } from './public/handle';
import { useDTJ } from './public/handle/hooks';
import html2canvas from 'html2canvas';
import './FX.less';
import { dbh } from './public/handle/IndexedDB';

export enum ActivePageEnum {
  HomeP = 'HomeP',
  MainP = 'MainP',
}
export type DBSave = {
  ID: number; // 0~255 0为自动存档
  sentenceID: number;
  time: number;
  charaName: string;
  text: string;
  capture: string; // base64
};
type PageState = {
  initDone: boolean;
  activePage: ActivePageEnum | null;
  LoadingPProps: LoadingPProps | null;
  isLoadingPActing: boolean;
  sentenceID: number | null;
  currentKeys:
    | {
        book: null;
        story: null;
        paragraph: null;
        storyPath: null;
      }
    | {
        book: string;
        story: string;
        paragraph: string;
        storyPath: string;
      };
  currentObjs:
    | {
        book: null;
        story: null;
        paragraph: null;
      }
    | {
        book: VN.StaticBook;
        story: VN.StaticStory;
        paragraph: VN.Paragraph;
      };
};
type PageAction = {
  load: (args: PageState['LoadingPProps']) => void;
  setActivePage: (nextActivePage: ActivePageEnum, sentenceID?: number) => void;
  setSentenceID: (nextSentenceID: number) => Promise<void>;
  jumpToCurrentParagraphEndToStory: () => Promise<void>;
  callDialog: (props: DialogProps) => void;
  callFX: ReturnType<typeof useFXHandle>['call'];
  getSave: (ID: number) => Promise<DBSave>;
  save: (save: DBSave) => Promise<any>;
  loadSave: (ID: number, handleClose?: () => void, handleSkipTransfrom?: () => void) => void;
};
// function getHomePLoadList(): string[] {
//   const BGM = homeResource.BGM;
//   const covers = Object.values(homeResource.booksCover);
//   const elements = Object.values(homeResource.elements).map((e) => e.fileKey);
//   let backgroundImage;
//   const lastbackgroundImage = homeResource.backgroundImageList.reverse().find(([c]) => c.check())?.[1];
//   if (lastbackgroundImage) homeResource.backgroundImage = lastbackgroundImage;
//   backgroundImage = homeResource.backgroundImage;
//   return [BGM, ...covers, ...elements, backgroundImage];
// }
let initFlag = false;
const pageStateInit: PageState = (() => {
  const getLoadList = () => homeResource.loadlist;
  return {
    initDone: false,
    activePage: ActivePageEnum.HomeP,
    LoadingPProps: {
      get loadList() {
        return getLoadList();
      },
      tips: ['test'],
      title: '欢迎！',
      onLoaded: async () => {
        await updateFileCache(getLoadList());
        return;
      },
    },
    isLoadingPActing: true,
    sentenceID: null,
    currentKeys: {
      book: null,
      story: null,
      paragraph: null,
      storyPath: null,
    },
    currentObjs: {
      book: null,
      story: null,
      paragraph: null,
    },
  };
})();

const pageActionInit: Partial<PageAction> = {
  load: void 0,
  setActivePage: void 0,
  setSentenceID: void 0,
  jumpToCurrentParagraphEndToStory: void 0,
  callDialog: void 0,
};
const pageStateContext = createContext(pageStateInit);
const pageActionContext = createContext(pageActionInit as PageAction);

const useDialogHandle = function () {
  const dialogs = useRef<Record<number, DialogPropsRuntime>>({});
  const [, forceUpdate] = useReducer((e) => e + 1, 0);
  const [count, updateCount] = useReducer((e) => e + 1, 0);
  return {
    add: (dialogProps: DialogProps) => {
      dialogs.current[count] = {
        ...dialogProps,
        destory() {
          delete dialogs.current[count];
          forceUpdate();
        },
      };
      updateCount();
    },
    handle: (
      <div className={classNames('dialog-handle', Object.keys(dialogs.current).length ? void 0 : 'hide')}>
        {Object.values(dialogs.current).map((e, i) => (
          <Dialog {...e} key={i} />
        ))}
      </div>
    ),
  };
};
export enum FXPhase {
  in = 'in',
  keep = 'keep',
  out = 'out',
  done = 'done',
}

type FXName = 'transition-black-full';
const useFXHandle = function (): {
  call: {
    'transition-black-full': (
      durationIn?: number,
      durationOut?: number
    ) => {
      skip: () => void;
      out: () => void;
      assignOnStepCase: (v: Partial<Record<FXPhase, () => void>>) => Partial<Record<FXPhase, () => void>>;
    };
  };
  handle: ReactNode;
} {
  const [
    phase,
    {
      [FXPhase.in]: [inDone],
      [FXPhase.keep]: [keepDone],
      [FXPhase.out]: [outDone],
      [FXPhase.done]: [],
    },
    reset,
  ] = useDTJ<FXPhase>({
    [FXPhase.in]: 1,
    [FXPhase.keep]: 1,
    [FXPhase.out]: 1,
    [FXPhase.done]: 0,
  });
  const [FXName, setFXName] = useState<FXName | void>(void 0);
  const [FXStyle, setFXStyle] = useState<Record<string, string | number> | void>(void 0);
  const [onStepCase, setOnStepCase] = useState<Partial<Record<FXPhase, () => void>> | void>();
  useEffect(() => {
    const todo = onStepCase?.[phase];
    todo && todo();
    if (phase === FXPhase.done) {
      setFXName(void 0);
      setFXStyle(void 0);
      setOnStepCase(void 0);
      reset();
    }
  }, [onStepCase, phase]);
  return {
    call: {
      'transition-black-full': (durationIn?: number, durationOut?: number) => {
        setFXName('transition-black-full');
        const style: any = {};
        durationIn !== void 0 && (style['--duration-in'] = `${durationIn}ms`);
        durationOut !== void 0 && (style['--duration-out'] = `${durationOut}ms`);
        setFXStyle(style);
        const re: {
          skip: () => void;
          out: () => void;
          assignOnStepCase: (v: Partial<Record<FXPhase, () => void>>) => Partial<Record<FXPhase, () => void>>;
        } = {
          skip: () => {
            inDone(true);
            keepDone(true);
            outDone(true);
          },
          out: () => {
            keepDone(true);
          },
          assignOnStepCase(v: Partial<Record<FXPhase, () => void>>) {
            const newOnStepCase = Object.assign(onStepCase ?? {}, v);
            setOnStepCase(newOnStepCase);
            return newOnStepCase;
          },
        };
        return re;
      },
    },
    handle: (
      // <div  className={FXName === void 0 ? 'none' : ''}>
      //   {
      <div
        id="FX"
        className={classNames(FXName ?? 'none', phase)}
        // ref={FXElementRef}
        style={FXStyle as CSSProperties}
        onAnimationEnd={() => {
          if (phase === 'in') inDone(true);
          else if (phase === 'out') outDone(true);
        }}
      ></div>
      // }
      // </div>
    ),
  };
};

export const PageStateProvider: FC<PropsWithChildren<{ parentRef: React.MutableRefObject<HTMLElement> }>> = ({ children, parentRef }) => {
  // states
  const [initDone, initDoneSetter] = useState<PageState['initDone']>(pageStateInit.initDone);
  const [activePage, activePageSetter] = useState<PageState['activePage']>(pageStateInit.activePage);
  const [LoadingPProps, LoadingPPropsSetter] = useState<PageState['LoadingPProps']>(() => {
    if (!initFlag) ((pageStateInit.LoadingPProps!.onStepCase ??= {}).out ??= []).push(() => initDoneSetter((initFlag = true)));
    return pageStateInit.LoadingPProps;
  });
  const [sentenceID, sentenceIDSetter] = useState<PageState['sentenceID']>(pageStateInit.sentenceID);
  const currentKeys = useMemo(() => {
    if (sentenceID === null) {
      return pageStateInit.currentKeys;
    } else {
      const bookKey = Book_KeyIDEnum[sentenceID >> 24];
      const storyKey = staticBookRecord[bookKey].Story_KeyIDEnum[sentenceID >> 16];
      const paragraphKey = Object.values(staticStoryRecord[storyKey].paragraphRecord).find(
        ({ start, end }) => sentenceID >= start && sentenceID <= end
      )!.key;
      return {
        book: bookKey,
        story: storyKey,
        paragraph: paragraphKey,
        get storyPath() {
          return `${bookKey}/${storyKey}`;
        },
      };
    }
  }, [sentenceID]);
  const currentObjs = useMemo(() => {
    if (currentKeys.book === null) {
      return pageStateInit.currentObjs;
    } else {
      const bookObj = staticBookRecord[currentKeys.book];
      const storyObj = staticStoryRecord[currentKeys.story];
      const paragraphObj = storyObj.paragraphRecord[currentKeys.paragraph];
      return {
        book: bookObj,
        story: storyObj,
        paragraph: paragraphObj,
      };
    }
  }, [sentenceID]);
  const pageState: PageState = { initDone, activePage, LoadingPProps, isLoadingPActing: !!LoadingPProps, sentenceID, currentKeys, currentObjs };

  // actions
  const load = useCallback<PageAction['load']>(
    (args: LoadingPProps | null) => {
      console.log(args, LoadingPProps);
      if (args !== null && LoadingPProps) {
        console.warn('加载冲突了！', { old: LoadingPProps, new: args });
        return;
      }
      LoadingPPropsSetter(args);
      // 加载完成后会被置为null，在LoadingP实现
    },
    [LoadingPProps]
  );
  const setSentenceID = useCallback<PageAction['setSentenceID']>(
    async function (nextSentenceID: number) {
      console.log('setSentenceID', nextSentenceID);
      const { staticStoryID: nextStaticStoryID, staticBookID: nextStaticBookID } = VN.decodeStaticSentenceID(nextSentenceID);
      let firstSentence: VN.StaticSentence | void;
      if (sentenceID !== null) {
        const last = VN.decodeStaticSentenceID(sentenceID);
        if (last.staticStoryID === nextStaticStoryID) {
          // 1.故事相同只跳语句：(如history功能、读取较近的存档等) 不触发load 具体样式效果在MainP实现
          firstSentence = sentenceCache.get(nextSentenceID);
          // console.log(firstSentence);
          if (firstSentence === void 0) throw new Error(`setSentenceID(): nextSentenceID有误: ${nextSentenceID}`);
          const nextState = EXStaticSentence.getState(nextSentenceID);
          const loadList = nextState.loadList;
          await updateFileCache(loadList as string[]);
          sentenceIDSetter(nextSentenceID);
          return;
        }
        if (last.staticBookID !== nextStaticBookID) {
          // 书换了，洗掉story的KKV
          // todo: 最后未使用-限制缓存大小
          console.log('洗story', last.staticBookID, nextStaticBookID);
          for (const key in staticStoryRecord) delete staticStoryRecord[key];
        }
      }
      // 2.故事不同: 重写sentenceCache
      await VN.StaticStory.getRecordFromDB(nextStaticStoryID).then((e) => KKVRecord.push(staticStoryRecord, [e]));
      const nextBook = staticBookRecord[Book_KeyIDEnum[nextStaticBookID]];
      if (nextBook === void 0) throw new Error(`跳转的Book未找到: 0x${nextStaticBookID.toString(16).padStart(2, '0')}`);
      const nextStory = staticStoryRecord[nextBook.Story_KeyIDEnum[nextStaticStoryID]];
      if (nextStory === void 0) throw new Error(`跳转的Story未找到: 0x${nextStaticStoryID.toString(16).padStart(4, '0')}`);
      // 触发load
      load({
        loadList: nextStory.loadList,
        tips: [...nextStory.tips],
        title: nextStory.title,
        onStepCase: {
          loading: [() => activePageSetter(null)],
          out: [() => activePageSetter(ActivePageEnum.MainP)],
        },
        onLoaded: async () => {
          sentenceCache.clear();
          await VN.StaticSentence.getRecordsFromDB(nextStaticStoryID).then((arr) =>
            arr.forEach((sentence: VN.StaticSentence) => sentenceCache.set(sentence.ID, sentence))
          );
          firstSentence = sentenceCache.get(nextSentenceID);
          if (firstSentence === void 0) throw new Error(`setSentenceID(): nextSentenceID有误: ${nextSentenceID}`);

          const nextState = EXStaticSentence.getState(nextSentenceID);
          const loadList = nextState.loadList;
          await updateFileCache(loadList as string[]);
          sentenceIDSetter(nextSentenceID);
          return;
        },
      });
      return;
    },
    [load, sentenceID]
  );
  const setActivePage = useCallback<PageAction['setActivePage']>(
    (nextActivePage: ActivePageEnum, staticSentenceID?: number) => {
      const todo: Record<ActivePageEnum, () => void> = {
        [ActivePageEnum.HomeP]: function (): void {
          load({
            loadList: homeResource.loadlist,
            tips: ['test'],
            title: '前往首页',
            onStepCase: {
              loading: [
                () => {
                  activePageSetter(null);
                  sentenceIDSetter(null);
                },
              ],
              out: [() => activePageSetter(ActivePageEnum.HomeP)],
            },
            onLoaded: async () => {
              await updateFileCache(homeResource.loadlist);
              return;
            },
          });
        },
        [ActivePageEnum.MainP]: async function (): Promise<void> {
          setSentenceID(staticSentenceID ?? 0);
        },
      };
      todo[nextActivePage]();
    },
    [load, setSentenceID]
  );
  const jumpToParagraphEndToStory = useCallback<PageAction['jumpToCurrentParagraphEndToStory']>(() => {
    if (!currentObjs.book) throw new Error(`jumpToParagraphEndToStory(): 未进入故事就尝试跳转`);
    const nextStoryKey = currentObjs.paragraph.endToStory;
    if (typeof nextStoryKey !== 'string') {
      throw new Error(`jumpToParagraphEndToStory(): 未找到故事Key(${nextStoryKey})对应ID，于: \n${JSON.stringify(currentObjs.paragraph, null, 2)}`);
    } else if (nextStoryKey.length === 0) {
      // 检查book结束
      const endText = Object.fromEntries(currentObjs.book.end)[currentKeys.story!];
      if (endText === void 0) throw new Error(`异常的book(${currentKeys.book})结束于story: ${currentKeys.story}`);
      else {
        alert(endText);
        setActivePage(ActivePageEnum.HomeP);
        return Promise.resolve();
      }
    }
    const nextStoryID = currentObjs.book.Story_KeyIDEnum[nextStoryKey];
    if (typeof nextStoryID !== 'number') {
      throw new Error(
        `jumpToParagraphEndToStory(): 未找到故事Key(${nextStoryKey})对应ID，于: \n${JSON.stringify(currentObjs.book.Story_KeyIDEnum, null, 2)}`
      );
    }
    return setSentenceID(nextStoryID << 16);
  }, [currentKeys, setSentenceID, setActivePage]);
  const { add: callDialog, handle: DialogHandle } = useDialogHandle();
  const { call: callFX, handle: FXhandle } = useFXHandle();
  const getSave = useCallback<PageAction['getSave']>(
    (ID: number) => {
      const MainP = parentRef.current.children['MainP' as keyof HTMLCollection] as HTMLElement;
      if (!MainP) throw new Error('getSave(): 没有打开MainP的情况下调用了getSave()');
      const re: ReturnType<PageAction['getSave']> extends Promise<infer P> ? P : never = {
        ID: ID,
        sentenceID: sentenceID!,
        time: NaN,
        charaName: `${sentenceCache.get(sentenceID!)?.charaKey?.length ? charaRecord[sentenceCache.get(sentenceID!)!.charaKey].name : ''}`,
        text: `${sentenceCache.get(sentenceID!)!.text}`,
        capture: '',
      };
      re.charaName.length !== 0 && (re.text = `“${re.text}”`);
      return html2canvas(MainP, { scale: 400 / MainP.offsetWidth, backgroundColor: null }).then((canvas) => {
        re.capture = canvas.toDataURL();
        re.time = Date.now();
        // canvas.removeAttribute('style');
        // canvas.setAttribute('style', 'z-index:999;position:fixed;left:0;top:0;');
        // document.body.appendChild(canvas);
        return re;
      });
    },
    [currentObjs, parentRef, sentenceID]
  );
  const save = useCallback((save: DBSave) => {
    return dbh.put('Save', save);
  }, []);
  const loadSave = useCallback(
    async (ID: number, handleClose?: () => void, handleSkipTransfrom?: () => void) => {
      dbh.get('Save', ID).then((save: DBSave) => {
        // ...
        callDialog({
          text: `确认读取存档 ${save.ID} 吗？`,
          title: '读档确认',
          // onClose: () => alert('close'),
          optionsCallback: {
            读取: () => {
              const fx = callFX['transition-black-full']();
              const nextSentenceID = save.sentenceID;
              fx.assignOnStepCase({
                [FXPhase.keep]: () => {
                  handleClose?.();
                  setSentenceID(nextSentenceID);
                  setTimeout(() => {
                    handleSkipTransfrom?.();
                    fx.out();
                  }, 100);
                },
              });
              return true;
            },
            取消: () => true,
          },
        });
      });
    },
    [callDialog, callFX, setSentenceID]
  );
  const pageAction: PageAction = {
    setActivePage,
    load,
    setSentenceID,
    jumpToCurrentParagraphEndToStory: jumpToParagraphEndToStory,
    callDialog,
    callFX,
    getSave,
    save,
    loadSave,
  };

  return (
    <pageStateContext.Provider value={pageState}>
      <pageActionContext.Provider value={pageAction}>
        {children}
        {DialogHandle}
        {FXhandle}
        {/* <SE /> */}
      </pageActionContext.Provider>
    </pageStateContext.Provider>
  );
};

const pageStateCurrent: any = {};
const pageActionCurrent: any = {};
export function usePageState() {
  const pageState = useContext(pageStateContext);
  const pageAction = useContext(pageActionContext);
  (window as any).pageState = pageState;
  (window as any).pageAction = pageAction;
  Object.entries(pageState).forEach(([k, v]) => pageStateCurrent[k] !== v && (pageStateCurrent[k] = v));
  Object.entries(pageAction).forEach(([k, v]) => pageActionCurrent[k] !== v && (pageActionCurrent[k] = v));
  return { pageState: pageStateCurrent as PageState, pageAction: pageActionCurrent as PageAction, PageStateProvider };
}
