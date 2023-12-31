import { FC, PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { LoadingPProps } from './pages/LoadingP';
import { Book_KeyIDEnum, KKVRecord, homeResource, sentenceCache, staticBookRecord, staticStoryRecord, tipsGroupRecord } from './data/data';
import { VN } from './class/Book';
import { dbh } from './handle/IndexedDB';
import { FileInfo } from './class/Records';
import { EXStaticSentence, updateFileCache } from './data/getData';

export enum ActivePageEnum {
  HomeP = 'HomeP',
  MainP = 'MainP',
}
type PageState = {
  activePage: ActivePageEnum | null;
  LoadingPProps: LoadingPProps | null;
  sentenceID: number | null;
};
type PageAction = {
  load: (args: PageState['LoadingPProps']) => void;
  setActivePage: (nextActivePage: ActivePageEnum, sentenceId?: number) => void;
  setSentenceID: (nextSentenceID: number) => Promise<void>;
};
function getHomePLoadList(): string[] {
  const BGM = homeResource.BGM;
  const covers = Object.values(homeResource.booksCover);
  const elements = Object.values(homeResource.elements).map((e) => e.fileKey);
  let backgroundImage;
  const lastbackgroundImage = homeResource.backgroundImageList.reverse().find(([c]) => c.check())?.[1];
  if (lastbackgroundImage) homeResource.backgroundImage = lastbackgroundImage;
  backgroundImage = homeResource.backgroundImage;
  return [BGM, ...covers, ...elements, backgroundImage];
}
const pageStateInit: PageState = (() => {
  const loadList = getHomePLoadList();
  return {
    activePage: ActivePageEnum.HomeP,
    LoadingPProps: {
      loadList: loadList,
      tips: ['test'],
      title: '欢迎！',
      onLoaded: async () => {
        await updateFileCache(loadList);
        return;
      },
    },
    sentenceID: null,
  };
})();

const pageActionInit: Partial<PageAction> = {
  load: void 0,
  setActivePage: void 0,
  setSentenceID: void 0,
};
const pageStateContext = createContext(pageStateInit);
const pageActionContext = createContext(pageActionInit as PageAction);

export const PageStateProvider: FC<PropsWithChildren> = ({ children }) => {
  const [activePage, activePageSetter] = useState<PageState['activePage']>(pageStateInit.activePage);
  const [LoadingPProps, LoadingPPropsSetter] = useState<PageState['LoadingPProps']>(pageStateInit.LoadingPProps);
  const [sentenceID, sentenceIDSetter] = useState<PageState['sentenceID']>(pageStateInit.sentenceID);
  const pageState: PageState = { activePage, LoadingPProps, sentenceID };
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
          // 只跳语句：history功能 不触发load 具体UI效果在MainP实现(检查pageState.sentenceID变化)
          // todo: 跳转语句后，MainP状态需要重计算。应在MainP实现。
          firstSentence = sentenceCache.get(nextSentenceID);
          console.log(firstSentence);
          if (firstSentence === void 0) throw new Error(`setSentenceID(): nextSentenceID有误: ${nextSentenceID}`);
          // await updateFileCache(VN.getFnsNeedFilekeys(firstSentence)); // todo: 更正
          const nextState = EXStaticSentence.getState(nextSentenceID);
          const loadList = Object.values(nextState)
            .map((e) => (typeof e !== 'object' || e === null ? e : Object.values(e).map((e) => e!.key)))
            .flat(1)
            .filter((e) => e);
          await updateFileCache(loadList as string[]);
          sentenceIDSetter(nextSentenceID);
          return;
        }
        if (last.staticBookID !== nextStaticBookID) {
          // 洗掉story的KKV
          console.log('洗story', last.staticBookID, nextStaticBookID);
          for (const key in staticStoryRecord) delete staticStoryRecord[key];
        }
      }
      // 故事不同重写sentenceCache
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
          // await updateFileCache(VM.getFnsNeedFilekeys(firstSentence)); // todo: 更正
          sentenceCache.clear();
          await VN.StaticSentence.getRecordsFromDB(nextStaticStoryID).then((arr) =>
            arr.forEach((sentence: VN.StaticSentence) => sentenceCache.set(sentence.ID, sentence))
          );
          firstSentence = sentenceCache.get(nextSentenceID);
          if (firstSentence === void 0) throw new Error(`setSentenceID(): nextSentenceID有误: ${nextSentenceID}`);

          const nextState = EXStaticSentence.getState(nextSentenceID);
          const loadList = Object.values(nextState)
            .map((e) => (typeof e !== 'object' || e === null ? e : Object.values(e).map((e) => e!.key)))
            .flat(1)
            .filter((e) => e);
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
    (nextActivePage: ActivePageEnum, staticSentenceId?: number) => {
      const todo: Record<ActivePageEnum, () => void> = {
        [ActivePageEnum.HomeP]: function (): void {
          const loadList = getHomePLoadList();
          load({
            loadList,
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
              await updateFileCache(loadList);
              return;
            },
          });
        },
        [ActivePageEnum.MainP]: async function (): Promise<void> {
          setSentenceID(staticSentenceId ?? 0);
        },
      };
      todo[nextActivePage]();
    },
    [load, setSentenceID]
  );

  const pageAction: PageAction = { setActivePage, load, setSentenceID };
  return (
    <pageStateContext.Provider value={pageState}>
      <pageActionContext.Provider value={pageAction}>{children}</pageActionContext.Provider>
    </pageStateContext.Provider>
  );
};

const pageStateCurrent: any = {};
const pageActionCurrent: any = {};
export function usePageState() {
  const pageState = useContext(pageStateContext);
  const pageAction = useContext(pageActionContext);
  Object.entries(pageState).forEach(([k, v]) => pageStateCurrent[k] !== v && (pageStateCurrent[k] = v));
  Object.entries(pageAction).forEach(([k, v]) => pageActionCurrent[k] !== v && (pageActionCurrent[k] = v));
  return { pageState: pageStateCurrent as PageState, pageAction: pageActionCurrent as PageAction, PageStateProvider };
}
