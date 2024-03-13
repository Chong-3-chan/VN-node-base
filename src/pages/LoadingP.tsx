import { useState, type FC, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import './LoadingP.less';
import { fileRecord, homeResource, packageRecord, tipsGroupRecord } from '../data/data';
import { useDTJ } from '../public/handle/hooks';
import { Tips, TipsGroup } from '../class/Records';
import { usePageState } from '../pageState';

enum LoadingPPhase {
  init = 'init',
  in = 'in',
  loading = 'loading',
  out = 'out',
  done = 'done',
}
enum LoadingPhase {
  waiting = 'waiting',
  loading = 'loading',
  done = 'done',
}
type LoadingProgress = { loadedList: string[]; needList: readonly string[]; currentLoadedPercentage: number };
const defaultLoadingProgess: LoadingProgress = { loadedList: [], needList: [], currentLoadedPercentage: 0 };
interface LoadingResult {
  phase: LoadingPhase;
  progress: LoadingProgress;
  start: () => void;
}
type LoadingPCSSProperties = Partial<
  Record<
    | '--style-color1-value'
    | '--style-color2-value'
    | '--font-size-title'
    | '--font-size-tips-title'
    | '--font-size-tips-text'
    | '--header-height'
    | '--footer-height'
    | '--transition-width'
    | '--loading-mask-svg'
    | '--back-dx'
    | '--back-dy'
    | '--transition-delay-short'
    | '--transition-delay-long'
    | '--percentage',
    string
  >
>;
function useLoadingResult(loadList: string[]): LoadingResult {
  const loadListRef = useRef(loadList);
  const [
    phase,
    {
      [LoadingPhase.waiting]: [start],
      [LoadingPhase.loading]: [loaded],
      [LoadingPhase.done]: [],
    },
  ] = useDTJ<LoadingPhase>({ [LoadingPhase.waiting]: 1, [LoadingPhase.loading]: 1, [LoadingPhase.done]: 0 });
  const [progress, setProgress]: [LoadingProgress, React.Dispatch<React.SetStateAction<LoadingProgress>>] = useState(defaultLoadingProgess);
  useEffect(() => {
    const todoMap: Record<LoadingPhase, (() => void) | null> = {
      [LoadingPhase.waiting]: null,
      [LoadingPhase.loading]: () => {
        (() => {
          const progressUpdateDelay = 100 as const; // 进度刷新间隔
          const needPackageKeys: readonly string[] = Array.from(
            new Set(
              loadListRef.current
                .map((fileKey) => {
                  const re = fileRecord[fileKey]?.fromPackage;
                  if (re === void 0) console.warn(`不在包内的文件key: ${fileKey}`);
                  return re;
                })
                .filter(Boolean)
            )
          );
          console.warn('need', loadListRef.current, needPackageKeys);
          const loadedList: string[] = [];
          const progress: LoadingProgress = {
            loadedList: loadedList,
            needList: needPackageKeys,
            currentLoadedPercentage: 0,
          };
          const updateProgress = () => {
            setProgress({ ...progress });
          };
          let progressUpdateInterval = window.setInterval(() => {
            updateProgress();
          }, progressUpdateDelay);
          return needPackageKeys
            .map((packageKey) => {
              return () =>
                packageRecord[packageKey].load({
                  ready: () => {
                    progress.currentLoadedPercentage = 0;
                    updateProgress();
                    window.clearInterval(progressUpdateInterval);
                    progressUpdateInterval = window.setInterval(() => {
                      updateProgress();
                    }, progressUpdateDelay);
                  },
                  downloading: (msg) => {
                    const { downloadTotal, downloaded } = msg as { downloadTotal: number | null; downloaded: number };
                    if (downloadTotal === null) progress.currentLoadedPercentage = 0;
                    else progress.currentLoadedPercentage = Math.floor((downloaded * 100) / downloadTotal);
                  },
                  done: () => {
                    loadedList.push(packageKey);
                    progress.currentLoadedPercentage = 0;
                    updateProgress();
                  },
                });
            })
            .reduce((lastPromise, nextLoad, i) => {
              // 串行是否改良为n任务并行？
              // todo: 出错处理
              return lastPromise.then(() =>
                nextLoad().catch((e) => {
                  console.error(`加载${needPackageKeys[i]}时错误\n${e}`);
                })
              );
            }, Promise.resolve())
            .then(() => {
              // progress.loadedList = Array.from(needPackageKeys)
              if (needPackageKeys.length !== progress.loadedList.length) {
                console.warn(`警告：应载入${needPackageKeys.length}个资源包，实际成功${progress.loadedList.length}个。`);
              }
              progress.currentLoadedPercentage = 0;
              updateProgress();
              window.clearInterval(progressUpdateInterval);
            });
        })().then(() => loaded(true));
      },
      [LoadingPhase.done]: null,
    };
    const todo = todoMap[phase];
    todo !== null && todo();
  }, [phase]);
  return {
    phase,
    progress,
    start: () => start(true),
  };
}

export interface LoadingPProps {
  onLoaded?: () => Promise<any>;
  onStepCase?: Partial<Record<LoadingPPhase, (() => void)[]>>;
  loadList: string[];
  tips: string[];
  title: string;
}
export const LoadingP: FC<LoadingPProps> = ({ onStepCase, loadList, tips, title, onLoaded }: LoadingPProps) => {
  const { pageAction } = usePageState();
  const onStepCaseRef = useRef(onStepCase);
  const tipsRef = useRef<Tips[]>([]);
  useEffect(() => {
    tipsRef.current = (() => {
      const re = [
        ...tips
          .map((e) => tipsGroupRecord[e] ?? void 0)
          .filter((e) => e !== void 0)
          .map((e) => e.list)
          .flat(1),
      ];
      for (let i = 0; i < re.length - 1; ++i) {
        let j = Math.floor((re.length - i) * Math.random()) + i;
        if (j === i) continue;
        [re[i], re[j]] = [re[j], re[i]];
      }
      return re;
    })();
  }, []);
  const logoMaskRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<LoadingPCSSProperties>({});
  const { phase: loadingPhase, progress, start } = useLoadingResult(loadList);
  const [
    phase,
    {
      [LoadingPPhase.init]: [delay_init],
      [LoadingPPhase.in]: [delay_in],
      [LoadingPPhase.loading]: [delay_loading, loaded, tipsViewTJ],
      [LoadingPPhase.out]: [delay_out],
      [LoadingPhase.done]: [],
    },
  ] = useDTJ<LoadingPPhase>({
    [LoadingPPhase.init]: 1,
    [LoadingPPhase.in]: 1,
    [LoadingPPhase.loading]: 3,
    [LoadingPPhase.out]: 1,
    [LoadingPPhase.done]: 0,
  });
  // console.log(
  //   JSON.stringify({
  //     [LoadingPPhase.init]: [delay_init()],
  //     [LoadingPPhase.in]: [delay_in()],
  //     [LoadingPPhase.loading]: [delay_loading(), loaded(), tipsViewTJ()],
  //     [LoadingPPhase.out]: [delay_out()],
  //     [LoadingPhase.done]: [],
  //   }),
  //   null,
  //   2
  // );
  const [tipsNoSwitchLock, setTipsNoSwitchLock] = useState(true);
  const [tipsNo, tipsNoAction] = useReducer(
    ([current, next]: number[], type: 'switch' | 'callback'): number[] => {
      if (type === 'switch') {
        if (tipsNoSwitchLock) return [current, next];
        tipsViewTJ(false);
        setTipsNoSwitchLock(true);
        return [current, tipsRef.current.length > current + 1 ? current + 1 : 0];
      } else if (type === 'callback') return [next, next];
      throw new Error('怎么会在切换tips时传入错误的type？');
    },
    [0, 0]
  );
  useEffect(() => {
    if (loadingPhase === LoadingPhase.done) {
      if (onLoaded) onLoaded().then(() => loaded(true));
      else loaded(true);
    }
  }, [loadingPhase]);
  useEffect(() => {
    const todoMap: Record<LoadingPPhase, (() => void) | null> = {
      [LoadingPPhase.init]: () => {
        requestAnimationFrame(() => {
          delay_init(true);
        });
      },
      [LoadingPPhase.in]: () => {
        tipsViewTJ(true);
        if (logoMaskRef.current) {
          const event = logoMaskRef.current;
          const onTransitionEnd = function (e: TransitionEvent) {
            if (e.propertyName === 'filter') {
              delay_in(true);
              setTipsNoSwitchLock(false);
              event.removeEventListener('transitionend', onTransitionEnd);
            }
          };
          event.addEventListener('transitionend', onTransitionEnd);
        } else {
          console.warn('怎么会没找到ref？？');
          setTimeout(() => {
            delay_in(true);
          }, 1500);
        }
      },
      [LoadingPPhase.loading]: () => {
        start();
        setTimeout(() => delay_loading(true), 750);
        // 最短加载页面停留时间
      },
      [LoadingPPhase.out]: () => {
        if (logoMaskRef.current) {
          const event = logoMaskRef.current;
          const onTransitionEnd = function (e: TransitionEvent) {
            // console.log(e);
            // if (e.propertyName === 'filter') {
            if (e.propertyName === 'transform') {
              delay_out(true);
              event.removeEventListener('transitionend', onTransitionEnd);
            }
          };
          event.addEventListener('transitionend', onTransitionEnd);
        } else {
          console.warn('怎么会没找到ref？？');
          setTimeout(() => {
            delay_out(true);
          }, 1500);
        }
      },
      [LoadingPPhase.done]: () => {
        pageAction.load(null);
      },
    };
    const todo = todoMap[phase];
    todo !== null && todo();
  }, [phase]);
  useEffect(() => {
    // 外部传入的步骤回调
    const todos = onStepCaseRef.current?.[phase];
    todos !== void 0 && todos.forEach((todo) => todo());
  }, [phase]);
  useEffect(() => {
    // 更新进度条
    if (loadingPhase === LoadingPhase.waiting) {
      setStyle({ ...style, '--percentage': (0).toString() });
      return;
    }
    const needCount = progress.needList.length;
    if (!needCount) {
      setStyle({ ...style, '--percentage': (100).toString() });
      return;
    }
    const loadedCount = progress.loadedList.length;
    const currentPercentage = progress.currentLoadedPercentage;
    setStyle({ ...style, '--percentage': Math.floor((loadedCount * 100 + currentPercentage) / needCount).toString() });
  }, [progress]);
  return (
    <div
      id="LoadingP"
      className={phase === LoadingPPhase.init ? 'init' : [LoadingPPhase.in, LoadingPPhase.loading].includes(phase) ? 'in' : 'out'}
      // className={[LoadingPPhase.in, LoadingPPhase.loading].includes(phase) ? (loadingPhase === LoadingPhase.waiting ? 'init' : 'in') : 'out'}
      style={style as React.CSSProperties}
      onClick={() => {
        tipsNoAction('switch');
      }}
    >
      <div className="body">
        <div className="background" />
        <div className={`header`}></div>
        <div className={`footer`}></div>
        <div className={`body-inner`}>
          <div className={`logo-mask`} ref={logoMaskRef}>
            <div className={`loading-back`}></div>
          </div>
        </div>

        <div className={'word'}>
          <div className={`title`}>{title}</div>
          {tipsRef.current.length > 0 && (
            <>
              <div
                className={['tip-title', ...(tipsNo[0] !== tipsNo[1] ? ['out'] : [])].join(' ')}
                onTransitionEnd={(e) => {
                  if (e.propertyName === 'filter') {
                    if (tipsNo[0] !== tipsNo[1]) tipsNoAction('callback');
                    else setTipsNoSwitchLock(false);
                  }
                }}
              >
                {tipsRef.current[tipsNo[0]].title}
              </div>
              <div className={['tip-text', ...(tipsNo[0] !== tipsNo[1] ? ['out'] : [])].join(' ')}>{tipsRef.current[tipsNo[0]].text}</div>
            </>
          )}
          <div
            className={['exit', ...(loadingPhase === LoadingPhase.done && !tipsViewTJ() ? [] : ['hide'])].join(' ')}
            onClick={
              loadingPhase === LoadingPhase.done
                ? (e) => {
                    e.stopPropagation();
                    tipsViewTJ(true);
                  }
                : void 0
            }
          >
            {'加载完成！ >>>'}
          </div>
          {/* <div className={'message'} style={msgStyle}>{getLoadMessage()}</div> */}
        </div>
      </div>
    </div>
  );
};

export default LoadingP;
