import { FC, PropsWithChildren, createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import type { LoadingPProps } from './pages/LoadingP';
import { tipsGroupRecord } from './data/data';
import { VM } from './class/Book';
import { dbh } from './handle/IndexedDB';

export enum ActivePageEnum {
  HomeP = 'HomeP',
  MainP = 'MainP',
}
type PageState = {
  activePage: ActivePageEnum | null;
  LoadingPProps: LoadingPProps | null;
};
type PageAction = {
  setActivePage: (nextActivePage: ActivePageEnum, sentenceId?: number) => void;
  load: (args: PageState['LoadingPProps']) => void;
};
const pageStateInit: PageState = {
  activePage: ActivePageEnum.HomeP,
  LoadingPProps: {
    loadList: [], // todo: 首页加载信息填充
    tips: [],
    title: '欢迎！',
  },
};

const pageActionInit: Partial<PageAction> = {
  load: void 0,
  setActivePage: void 0,
};
const pageStateContext = createContext(pageStateInit);
const pageActionContext = createContext(pageActionInit as PageAction);

export const PageStateProvider: FC<PropsWithChildren> = ({ children }) => {
  const [activePage, activePageSetter] = useState<PageState['activePage']>(pageStateInit.activePage);
  const [LoadingPProps, LoadingPPropsSetter] = useState<PageState['LoadingPProps']>(pageStateInit.LoadingPProps);
  const pageState: PageState = { activePage, LoadingPProps };
  const load = useCallback<PageAction['load']>(
    (args: LoadingPProps | null) => {
      if (args !== null && LoadingPProps) {
        console.warn('加载冲突了！', { old: LoadingPProps, new: args });
        return;
      }
      LoadingPPropsSetter(args);
    },
    [LoadingPProps]
  );
  const setActivePage = useCallback<PageAction['setActivePage']>(
    function (nextActivePage: ActivePageEnum, staticSentenceId?: number) {
      const todo: Record<ActivePageEnum, () => void> = {
        [ActivePageEnum.HomeP]: function (): void {
          load({
            loadList: [], // todo: 首页加载信息填充
            tips: [tipsGroupRecord.test],
            title: '欢迎！',
            onStepCase: {
              loading: [() => activePageSetter(null)],
              out: [() => activePageSetter(ActivePageEnum.HomeP)],
            },
          });
        },
        [ActivePageEnum.MainP]: function (): void {
          const { staticBookID, staticStoryID, staticSentenceID } = VM.decodeStaticSentenceID(staticSentenceId ?? 0); // 可能有问题: 用0号兜底
          dbh.getMRange('Sentence', { lower: staticStoryID << 16, upper: (staticStoryID + 1) << 16 });
          load({
            loadList: [], // todo: 首页加载信息填充
            tips: [],
            title: '欢迎！',
            onStepCase: {
              loading: [() => activePageSetter(null)],
              out: [() => activePageSetter(ActivePageEnum.MainP)],
            },
          });
        },
      };
      todo[nextActivePage]();
    },
    [load]
  );

  const pageAction: PageAction = { setActivePage, load };
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
