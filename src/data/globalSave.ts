type InfoState = 'waiting' | 'done';
interface InfoData {
  readStoryPath: string[] | null;
  endedStoryPath: string[] | null;
  options: {} | null;
  autoSave: {
    sentenceID: number;
    text: string;
  } | null;
  checkKeyMap: Record<string, boolean> | null;
} // TODO: 完善属性type
interface InfoData_updateProps {
  readStoryPath: [string];
  endedStoryPath: [string];
  options: [{}];
  autoSave: [
    {
      sentenceID: number;
      text: string;
    }
  ];
  checkKeyMap: [string, boolean];
}
const info: { state: InfoState; data: InfoData } = {
  state: 'waiting',
  data: {
    readStoryPath: null,
    endedStoryPath: null,
    options: null,
    autoSave: null,
    checkKeyMap: null,
  },
};

export const updateGlobalSave = (() => {
  const { data } = info;
  const todo: { [key in keyof InfoData_updateProps]: (...props: InfoData_updateProps[key]) => boolean } = {
    readStoryPath: function (storyPath: string): boolean {
      if (!data.readStoryPath) data.readStoryPath = [];
      if (data.readStoryPath.includes(storyPath)) return false;
      data.readStoryPath.push(storyPath);
      return true;
    },
    endedStoryPath: function (storyPath: string): boolean {
      if (!data.endedStoryPath) data.endedStoryPath = [];
      if (data.endedStoryPath.includes(storyPath)) return false;
      data.endedStoryPath.push(storyPath);
      return true;
    },
    options: function (props_0: {}): boolean {
      if (!data.options) data.options = {};
      Object.assign(data.options, props_0);
      return true;
    },
    autoSave: function (props_0: { sentenceID: number; text: string }): boolean {
      data.autoSave = props_0;
      return true;
    },
    checkKeyMap: function (props_0: string, props_1: boolean): boolean {
      if (!data.checkKeyMap) data.checkKeyMap = {};
      if (data.checkKeyMap[props_0] === props_1) return false;
      data.checkKeyMap[props_0] = props_1;
      return true;
    },
  };
  let callbackID: number | null = null;
  function update() {
    callbackID !== null && cancelAnimationFrame(callbackID);
    callbackID = requestAnimationFrame(() => {
      window.localStorage.setItem('VN-global-save', JSON.stringify(info.data));
      callbackID = null;
    });
  }
  return function updateGlobalSave<T extends keyof typeof info.data>(key: T, ...props: InfoData_updateProps[T]) {
    todo[key](...props) && update();
    // console.log('VN-global-save updated', info.data);
  };
})();
// 同步读取，存在localStorage里
try {
  const fromStorage = window.localStorage.getItem('VN-global-save');
  if (fromStorage === null) {
    window.localStorage.setItem('VN-global-save', JSON.stringify(info.data));
    throw new Error(`未读取到VN-global-save记录`);
  }
  const data = JSON.parse(fromStorage);
  if (data)
    Object.keys(data).forEach((e) => {
      info.data[e as keyof typeof info.data] = data[e];
    });
  else throw new Error(`VN-global-save记录值异常`);
} catch (error) {
  console.warn(error);
}
console.log('VN-global-save', info.data);
info.state = 'done';

// export get

export type StoryCheckerMode = '&' | '|' | '!';
type CheckerType = 'key' | '&' | '|' | '!';
export interface Checker {
  type: CheckerType;
  read?: { mode: StoryCheckerMode; some: readonly string[] | null; all: readonly string[] | null };
  ended?: { mode: StoryCheckerMode; some: readonly string[] | null; all: readonly string[] | null };
  checkKeyName?: string;
  check(): boolean;
  propsCheck(): boolean;
}
interface Checher_key extends Checker {
  type: 'key';
  checkKeyName: string;
}
interface Checher_story extends Checker {
  type: StoryCheckerMode;
  read: { mode: StoryCheckerMode; some: readonly string[] | null; all: readonly string[] | null };
  ended: { mode: StoryCheckerMode; some: readonly string[] | null; all: readonly string[] | null };
}
type CheckerConstructorPropsHandleType<T extends StoryCheckerMode> = {
  '&': [StoryCheckerMode, readonly string[], readonly string[]];
  '|': [StoryCheckerMode, readonly string[], readonly string[]];
  '!': [];
}[T];
export type CheckerConstructorProps<T extends StoryCheckerMode> = [T, CheckerConstructorPropsHandleType<T>, CheckerConstructorPropsHandleType<T>];
export class Checker {
  type: CheckerType;
  read?: { mode: StoryCheckerMode; some: readonly string[] | null; all: readonly string[] | null };
  ended?: { mode: StoryCheckerMode; some: readonly string[] | null; all: readonly string[] | null };
  checkKeyName?: string;
  check() {
    if (info.state === 'waiting') return null;
    const infoData = info.data as InfoData;
    const storycheckerModeCase: Record<StoryCheckerMode, (...args: any) => boolean> = {
      // some和all只用其一时 另一个检查组需要为空，结果上不生效
      // 两个组都空则返回true
      '&': (fromChecker: { some: string[]; all: string[] }, fromGlobal: string[]) => {
        const some = fromChecker.some,
          all = fromChecker.all;
        if (some.length === 0 && all.length === 0) return true;
        const fromGlobalSet = new Set(fromGlobal);
        const someCheck = some.length === 0 ? true : some.some((storyKey) => fromGlobalSet.has(storyKey)),
          allCheck = all.length === 0 ? true : !all.some((storyKey) => !fromGlobalSet.has(storyKey));
        return someCheck && allCheck;
      },
      '|': (fromChecker: { some: string[]; all: string[] }, fromGlobal: string[]) => {
        const some = fromChecker.some,
          all = fromChecker.all;
        if (some.length === 0 && all.length === 0) return true;
        const fromGlobalSet = new Set(fromGlobal);
        const someCheck = some.length === 0 ? false : some.some((storyKey) => fromGlobalSet.has(storyKey)),
          allCheck = all.length === 0 ? false : !all.some((storyKey) => !fromGlobalSet.has(storyKey));
        return someCheck || allCheck;
      },
      '!': (...args: any) => true,
    };
    const checkerTypeCase: Record<CheckerType, () => boolean> = {
      key: () => {
        const checker = this as Checher_key;
        return infoData.checkKeyMap?.[checker.checkKeyName] ?? false;
      },
      '&': () => {
        const checker = this as Checher_story;
        return (
          storycheckerModeCase[checker.read.mode](checker.read, info.data.readStoryPath) &&
          storycheckerModeCase[checker.ended.mode](checker.ended, info.data.endedStoryPath)
        );
      },
      '|': () => {
        const checker = this as Checher_story;
        return (
          storycheckerModeCase[checker.read.mode](checker.read, info.data.readStoryPath) ||
          storycheckerModeCase[checker.ended.mode](checker.ended, info.data.endedStoryPath)
        );
      },
      '!': () => true,
    };
    return checkerTypeCase[this.type]();
  }
  static propsCheck(args_0: any) {
    if (typeof args_0 === 'string') {
      return true;
    } else if (Array.isArray(args_0) && args_0.length === 3 && ['&', '|', '!'].includes(args_0[0])) {
      if (
        [args_0[1], args_0[2]].every(
          (e) =>
            e.length === 0 ||
            (e.length === 3 &&
              ['&', '|', '!'].includes(e[0]) &&
              Array.isArray(e[1]) &&
              [e[1], e[2]].every((e: any[]) => e.every((ee) => typeof ee === 'string')))
        )
      )
        return true;
    } else return false;
  }
  constructor(keyName: string);
  constructor(readAndEndedConfig: CheckerConstructorProps<StoryCheckerMode>);
  constructor(args_0: string | CheckerConstructorProps<StoryCheckerMode>) {
    if (typeof args_0 === 'string') {
      const keyName = args_0;
      this.type = 'key';
      this.checkKeyName = keyName;
    } else if (Array.isArray(args_0) && args_0.length === 3 && ['&', '|', '!'].includes(args_0[0])) {
      const readAndEndedConfig = args_0;
      const [type, readConfig, endedConfig] = readAndEndedConfig;
      this.type = type;
      this.read =
        readConfig.length === 0
          ? Object.freeze({ mode: '!', some: null, all: null })
          : Object.freeze({
              mode: readConfig[0] as StoryCheckerMode,
              some: Object.freeze(readConfig[1]),
              all: Object.freeze(readConfig[2]),
            });
      this.ended =
        endedConfig.length === 0
          ? Object.freeze({ mode: '!', some: null, all: null })
          : Object.freeze({
              mode: endedConfig[0] as StoryCheckerMode,
              some: Object.freeze(endedConfig[1]),
              all: Object.freeze(endedConfig[2]),
            });
    } else throw new Error(`Checker构造:参数类型有误。实际为:\n${JSON.stringify(args_0)}`);
    Object.freeze(this);
  }
}
