import { VN } from '../class/Book';
import { CharaInfo, DBfile, FileInfo, InfoItem, PackageInfo, TipsGroup } from '../class/Records';
import { dataURL, resourceBasePath } from '../config';
import { deepClone } from '../public/handle';
import { dbh } from '../public/handle/IndexedDB';
import * as Data from './data';
import { Checker } from './globalSave';
async function getDataObject() {
  const obj = fetch(dataURL).then((e) => e.json());
  // const obj = await fetch(new URL('./sample/sample.data.json', import.meta.url)).then(e => e.json())
  return obj;
}
async function timeAsync(fun: () => Promise<any>): Promise<number> {
  const startTime = Date.now();
  await fun();
  return Date.now() - startTime;
}
function time(fun: () => any): number {
  const startTime = Date.now();
  fun();
  return Date.now() - startTime;
}
export async function getData() {
  const dataobj = await getDataObject();
  const { book, file, packagePath, chara, tipsGroup, homeResource, information } = dataobj;
  console.log(dataobj);

  {
    // file+packagePath
    const packageInfoCache: PackageInfo[] = [];
    const keyNameMapCache: Record<string, Record<string, string>> = (() => {
      const re: Record<string, Record<string, string>> = {};
      Object.keys(packagePath).forEach((packageKey) => (re[packageKey] = {}));
      return re;
    })();
    Object.entries(file as Record<string, [string, string]>).forEach(([key, [fromPackage, fileName]]) => {
      if (keyNameMapCache[fromPackage] === void 0)
        throw new Error(`getData(): file表中存在无packagePath记录的fromPackage值。\n\t异常的packageKey为:${fromPackage}`);
      keyNameMapCache[fromPackage][key] = fileName;
    });
    Object.entries(keyNameMapCache).forEach(([PackageKey, keyNameMap]) => {
      packageInfoCache.push(new PackageInfo(PackageKey, resourceBasePath + packagePath[PackageKey], keyNameMap));
    });
    Data.KKVRecord.push(Data.packageRecord, packageInfoCache);
  }

  {
    // chara
    const charaCache: CharaInfo[] = [];
    Object.entries(chara).map(([charaKey, [name, pic, avatar]]: any) => charaCache.push(new CharaInfo(charaKey, name, pic, avatar)));
    Data.KKVRecord.push(Data.charaRecord, charaCache);
  }

  {
    // tipsGroup
    const tipsGroupCache: TipsGroup[] = [];
    Object.entries(tipsGroup).map(([key, [name, ...group]]: any) => tipsGroupCache.push(new TipsGroup(key, name, group)));
    Data.KKVRecord.push(Data.tipsGroupRecord, tipsGroupCache);
  }

  {
    // book必须最后写，因为存在fileKeys依赖
    const bookCache: VN.StaticBook[] = [];
    Object.entries(book).map(([BookKey, BookVNe]: any, i) => bookCache.push(new VN.StaticBook(i, BookKey, BookVNe)));
    Data.KKVRecord.push(Data.staticBookRecord, bookCache);
    dbh.putM('Book', bookCache); // Book并入data因为: 内容较少&HomeP需要使用
  }

  {
    const readHomeResource: Pick<typeof Data.homeResource, 'BGM' | 'booksCover' | 'backgroundGroupList' | 'elements' | 'backgroundImage'> = {
      BGM: homeResource.BGM,
      booksCover: Object.fromEntries(Object.values(Data.staticBookRecord).map((e) => [e.key, e.cover])),
      backgroundGroupList: homeResource.backgroundGroupList.map(([c, v]: any) => [new Checker(c), v]),
      elements: Object.fromEntries(Object.entries(homeResource.elements).map(([k, v]) => [k, { fileKey: v }])) as any,
      backgroundImage: homeResource.backgroundImage,
    };
    const [lastbackgroundImage, lastBGM] = readHomeResource.backgroundGroupList.findLast!(([c]) => c.check())?.[1]!;
    readHomeResource.backgroundImage = lastbackgroundImage;
    readHomeResource.BGM = lastBGM;

    Object.assign(Data.homeResource, readHomeResource);
    Object.defineProperty(Data.homeResource, 'loadList', {
      get() {
        const covers = Object.values(Data.homeResource.booksCover);
        const elements = Object.values(Data.homeResource.elements).map((e) => e.fileKey);
        const [lastbackgroundImage, lastBGM] = readHomeResource.backgroundGroupList.findLast!(([c]) => c.check())?.[1]!;
        const backgroundImage = (Data.homeResource.backgroundImage = lastbackgroundImage);
        const BGM = (Data.homeResource.BGM = lastBGM);
        return [BGM, ...covers, ...elements, backgroundImage];
      },
    });
  }

  {
    const readInfo: Record<string, any> = information;
    Data.KKVRecord.push(
      Data.infoRecord,
      Object.entries(readInfo).map((e) => new InfoItem(...e))
    );
  }
  console.log(Data);
}

export async function updateFileCache(nextCacheNeedFileKeys: string[]) {
  // console.trace();
  // console.time('updateFileCacheA');
  const cacheNeedSet = new Set(nextCacheNeedFileKeys);
  for (const key of Data.fileCache.keys()) {
    if (cacheNeedSet.has(key)) cacheNeedSet.delete(key);
    else Data.fileCache.delete(key);
  } // 将cache更新为传入列表对应的状态:
  // 1.如果传入的keys命中cache则被保留，并从NeedSet中delete
  // 2.如果cache的一条记录不在传入内容中则删除（下个cache状态不需要这条记录）
  // 3.最后尝试从db获取缺少部分(cacheNeedSet剩余的)
  // console.timeEnd('updateFileCacheA');
  if (cacheNeedSet.size === 0) {
    // console.log('cache不变');
    return;
  }
  // console.time('updateFileCacheB');
  const obj = await FileInfo.getFilesBase64(Array.from(cacheNeedSet));
  Object.entries(obj).map(([k, v]) => Data.fileCache.set(k, v));
  // console.log('nowCache', cacheNeedSet, Data.fileCache.keys());
  // console.log('updateFileCacheB', cacheNeedSet);
  // console.timeEnd('updateFileCacheB');
  return;
}
export function getSrc(fileKey: string) {
  const record = Data.fileCache.get(fileKey);
  if (record?.code === void 0) throw new Error(`getSrc(): 没有命中缓存 ${fileKey}`);
  return record.code;
}
export async function getSrcAsync(fileKey: string) {
  return ((await dbh.get('Files', Data.fileRecord[fileKey].getPath())) as DBfile).code;
}
export namespace EXStaticSentence {
  const uniqueFns = ['place', 'CG', 'CGOut', 'BGM', 'voice', 'choose'];
  const lazyFns = ['place', 'CG', 'CGOut', 'BGM'];
  const map: Record<string, (state: Data.EXStaticSentence['lastState'], props: any) => void> = {
    place: function (state, props: any[]) {
      if (state!.place !== void 0) throw new Error(`一个语句出现多个place`);
      state!.place = props[0] ?? null;
    },
    CG: function (state, props: any[]) {
      if (state!.CG !== void 0) throw new Error(`一个语句出现多个CG/CGOut`);
      state!.CG = props[0];
    },
    CGOut: function (state, props: any[]) {
      if (state!.CG !== void 0) throw new Error(`一个语句出现多个CG/CGOut`);
      state!.CG = null;
    },
    chara: function (state, props: [string, string, string]) {
      if ((state!.charas ??= {})[props[0]] !== void 0) throw new Error(`一个语句出现同人物(${props[0]})的多个chara/charaOut`);
      const fileKey = CharaInfo.getPicFilekey(props[0], props[1]);
      if (fileKey === null) throw new Error(`人物立绘未找到: ${props[0]}, ${props[1]}`);
      state!.charas[props[0]] = { key: fileKey, position: props[2] };
    },
    charaOut: function (state, props: [string, string]) {
      if ((state!.charas ??= {})[props[1]] !== void 0) throw new Error(`一个语句出现同人物的多个chara/charaOut`);
      state!.charas[props[1]] = null;
    },
    BGM: function (state, props: any[]) {
      if (state!.BGM !== void 0) throw new Error(`一个语句出现多个BGM`);
      state!.BGM = props[0] ?? null;
    },
    voice: function (state, props: any[]) {
      if (state!.voice !== null) throw new Error(`一个语句出现多个voice`);
      state!.voice = props[0];
    },
    // choose: function ,
    // stateDT中state.charas[charaKey]往往为空，故不能在stateDT上操作
    // charaMove: function (state, [charaKey, moveType, ...props]) {
    //   const c = state!.charas![charaKey as string];
    //   if (!c) return;
    //   (c.move ??= [])[c.move.length] = [moveType as string, ...props];
    // },
    bookVal: function (state, props: [string, string]) {
      state!.bookVals = state!.bookVals === void 0 ? {} : { ...state!.bookVals };
      const [key, formula] = props;
      // 不防注入，创作者喜欢就注入吧。。
      // eslint-disable-next-line no-new-func
      state!.bookVals[key] = ((bookVal: number) => new Function(`return ${formula.replaceAll('_', bookVal.toString())};`)())(
        state!.bookVals[key] ?? 0
      );
    },
  };
  function writeState(base: Data.SentenceState = { loadList: [] }, sentence: Data.EXStaticSentence) {
    if (sentence.lastState) return;
    const { fns, charaKey } = sentence;
    let stateCache = deepClone(base);
    const sentenceLoadSet = new Set();
    // eslint-disable-next-line complexity
    function handleTempStateTransform(fnGroup: [string, VN.fnProps][]) {
      stateCache = deepClone(stateCache);
      stateCache.charas !== void 0 &&
        Object.values(stateCache.charas).forEach((e) => {
          if (e?.move) delete e.move;
        });
      const stateDT: typeof base = { voice: null, choose: null, loadList: [], bookVals: stateCache.bookVals };
      fnGroup.forEach(([fnName, props]) => {
        const todo = map[fnName];
        todo && todo(stateDT, props);
      });
      if (stateDT.charas || stateCache.charas) stateDT.charas = Object.assign(stateCache.charas ?? {}, stateDT.charas);
      const nextState: typeof base = Object.assign(stateCache, stateDT);
      // debugger;
      Object.assign((nextState.charas ??= {}), stateDT.charas);
      Object.entries(nextState.charas).forEach(([k, v]) => {
        if (v === null) delete nextState.charas![k];
      });
      Object.entries(nextState).forEach(([k, v]) => {
        if (v === null) delete nextState[k as keyof typeof nextState];
      });
      const charaMoveFns = fnGroup.filter(([e]) => e === 'charaMove');
      charaMoveFns.forEach(([, [charaKey, moveType, ...props]], i) => {
        const c = nextState.charas![charaKey as string];
        if (!c) return;
        (c.move ??= [])[i] = [moveType as string, ...props];
      });
      const chooseFn = fnGroup.filter(([e]) => e === 'choose');
      if (chooseFn.length > 1) console.warn(`sentence(ID: ${sentence.ID})出现了一个以上的choose`);
      chooseFn.forEach(([, props]: [string, any[]]) => {
        if (nextState.choose) throw new Error(`一个语句出现多个choose`);
        nextState.choose = props.filter((e) => {
          const ex = e[3];
          if (!ex) return true;
          if (ex[0] === 'check') return new Checker(ex[1]).check();
          if (ex[0] === 'bookVal') {
            const val = nextState.bookVals?.[ex[1][0]] ?? 0;
            const formula = ex[1][1];
            const fn = new Function(`return ${formula.replaceAll('_', val.toString())};`);
            return fn();
          }
          console.warn(`choose参数3异常: 类型不是 "check" 或 "bookVal"`);
          return false;
        });
        if (nextState.choose.length === 0) nextState.choose = void 0;
        // nextState!.choose = props.filter((e) => (e[3] ? (e[3][0] === 'check' ? new Checker(e[3][1]).check() : true) : true))
        // .map(e=>e[3]?.[0] === 'bookVal'?);
      });
      if (nextState.charas && Object.keys(nextState.charas).length === 0) delete nextState.charas;

      // charas
      const getFileKeysKeys: (keyof Data.SentenceState)[] = ['place', 'CG', 'BGM', 'voice'];

      // 每个中间状态的资源需求
      nextState.loadList = Array.from(
        new Set([
          ...nextState.loadList!,
          ...getFileKeysKeys.filter((key) => nextState[key]).map((key) => nextState[key] as string),
          ...(nextState.charas === void 0 ? [] : Object.values(nextState.charas).map((e) => e!.key)),
          ...([CharaInfo.getAvatarFilekey(charaKey)].filter(Boolean) as string[]),
        ])
      );
      nextState.loadList.forEach((e) => sentenceLoadSet.add(e));
      return (stateCache = nextState);
    }
    sentence.states = [];
    fns.anime.forEach((e) => sentence.states!.push(handleTempStateTransform(e)));
    sentence.lastState = Object.assign(handleTempStateTransform(fns.state), { loadList: Array.from(sentenceLoadSet) });
  }
  function getParagraphBaseNeed(
    paragraphRecord: VN.StaticStory['paragraphRecord'],
    nowParagraph: VN.Paragraph,
    storyBaseBookVals: Record<string, number>
  ) {
    const { source } = nowParagraph;
    if (source.length === 0) {
      return { bookVals: storyBaseBookVals };
    }
    // @ts-ignore: findLastIndex
    const lastGotNeedIndex = source.findLastIndex((paragraphKey: string) => Data.sentenceCache.get(paragraphRecord[paragraphKey].end)?.state);
    let lastState: Data.SentenceState =
      lastGotNeedIndex === -1 ? {} : deepClone(Data.sentenceCache.get(paragraphRecord[source[lastGotNeedIndex]].end)!.lastState)!;
    for (let i = lastGotNeedIndex + 1; i < source.length; ++i) {
      for (let j = paragraphRecord[source[i]].start; j <= paragraphRecord[source[i]].end; ++j) {
        writeState(lastState, Data.sentenceCache.get(j)!);
        lastState = Data.sentenceCache.get(j)!.lastState!;
      }
    }
    return deepClone(Data.sentenceCache.get(paragraphRecord[source[source.length - 1]].end)!.lastState);
  }
  export function getState(ID: VN.StaticSentence['ID'], storyBaseBookVals: Record<string, number>) {
    const sentence = Data.sentenceCache.get(ID);
    if (sentence === void 0) throw new Error(`getState(): 不存在的句子ID: ${ID}`);
    if (sentence.lastState) return sentence.lastState!;
    if (ID % 0x10000 !== 0) {
      const prevSentenceNeed = deepClone(Data.sentenceCache.get(ID - 1)?.lastState);
      if (prevSentenceNeed) {
        writeState(prevSentenceNeed, sentence);
        return sentence.lastState!;
      }
    }
    const { staticBookID, staticStoryID, staticSentenceID } = VN.decodeStaticSentenceID(ID);
    const nextBook = Data.staticBookRecord[Data.Book_KeyIDEnum[staticBookID]];
    const { paragraphRecord } = Data.staticStoryRecord[nextBook.Story_KeyIDEnum[staticStoryID]];
    const nowParagraph = Object.values(paragraphRecord).find(({ start, end }) => staticSentenceID >= start && staticSentenceID <= end);
    if (nowParagraph === void 0) throw new Error(`getState(): 未找到包含 0x${staticSentenceID.toString(16)} 的段落`);
    const nowParagraphBaseNeed = getParagraphBaseNeed(paragraphRecord, nowParagraph, storyBaseBookVals);
    for (let i = nowParagraph.start; i <= ID; ++i) {
      const base = i === nowParagraph.start ? nowParagraphBaseNeed : Data.sentenceCache.get(i - 1)?.lastState;
      writeState(base, Data.sentenceCache.get(i)!);
    }
    return sentence.lastState!;
  }
}
