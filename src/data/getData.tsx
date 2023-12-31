import { VN } from '../class/Book';
import { CharaInfo, FileInfo, PackageInfo, TipsGroup } from '../class/Records';
import { dataURL, resourceBasePath } from '../config';
import { deepClone } from '../handle';
import { dbh } from '../handle/IndexedDB';
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
  const { book, file, packagePath, chara, tipsGroup, homeResource } = dataobj;
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
    Object.entries(chara).map(([charaKey, [name, pic]]: any) => charaCache.push(new CharaInfo(charaKey, name, pic)));
    Data.KKVRecord.push(Data.charaRecord, charaCache);
  }

  {
    // tipsGroup
    const tipsGroupCache: TipsGroup[] = [];
    Object.entries(tipsGroup).map(([key, [name, ...group]]: any) => tipsGroupCache.push(new TipsGroup(key, name, group)));
    Data.KKVRecord.push(Data.tipsGroupRecord, tipsGroupCache);
  }

  {
    // book必须最后编: fileKeys依赖
    const bookCache: VN.StaticBook[] = [];
    Object.entries(book).map(([BookKey, BookVNe]: any, i) => bookCache.push(new VN.StaticBook(i, BookKey, BookVNe)));
    Data.KKVRecord.push(Data.staticBookRecord, bookCache);
    dbh.putM('Book', bookCache); // Book并入data因为: 内容较少&HomeP需要使用
  }

  {
    const readHomeResource: typeof Data.homeResource = {
      BGM: homeResource.BGM,
      booksCover: Object.fromEntries(Object.values(Data.staticBookRecord).map((e) => [e.key, e.cover])),
      backgroundImageList: homeResource.backgroundImageList.map(([c, v]: any) => [new Checker(c), v]),
      elements: Object.fromEntries(Object.entries(homeResource.elements).map(([k, v]) => [k, { fileKey: v }])) as any,
      backgroundImage: homeResource.backgroundImage,
    };
    const lastbackgroundImage = readHomeResource.backgroundImageList.reverse().find(([c]) => c.check())?.[1];
    if (lastbackgroundImage) readHomeResource.backgroundImage = lastbackgroundImage;
    Object.assign(Data.homeResource, readHomeResource);
  }

  console.log(Data);

  // Promise.all(Object.values(Data.packageRecord).map(packageInfo => packageInfo.load())).then(async (e) => {
  //     console.warn(dataobj, Data, e,'any')
  //     const fileKeys = Object.keys(Data.fileRecord)
  //     const randomKeys = Array(10).fill(null).map((e, i) => fileKeys[i])
  //     console.warn(await timeAsync(async () => {
  //         const code = await FileInfo.getFilesBase64([...randomKeys])
  //         console.log(code, CharaInfo.getPicFilekey('12', '01'))
  //         return code
  //     }))
  // })
  // const ck = new Checker(['&', ['|', [], ['2', '1', '3', '4']], ['&', [], []]])
  // alert(ck.check())
  // const randomKV = Array(100000).fill(null).map(() => [Math.random().toString(36).slice(2), Math.random()] as [string, number])
  // console.warn(time(() => {
  //     const map: any = {}
  //     randomKV.forEach(e => {
  //         map[e[0]] = e[1]
  //     });
  // }))
  // alert(await time(() => {
  //     // const pa = []
  //     // for (let i = 0; i < 100; ++i)pa.push(dbh.put('Book', { ID: i, gg: new Array(i).fill('ab').join('') }))
  //     // return Promise.all(pa)
  //     // let g = new Promise((a)=>a(null));
  //     // for (let i = 0; i < 100; ++i)g = g.then(()=>dbh.put('Book', { ID: i, gg: new Array(i).fill('ab').join('') }))
  //     // return g
  //     return dbh.deleteM('Book', Array(10).fill(null).map((e, i) => i))
  // }))
  // alert(await time(() => {
  //     const pa = []
  //     for (let i = 0; i < 100; ++i)pa.push(dbh.delete('Book', i))
  //     return Promise.all(pa)
  // }))
  // write file&packageRecord
}

export async function updateFileCache(nextCacheNeedFileKeys: string[]) {
  const cacheNeedSet = new Set(nextCacheNeedFileKeys);
  for (const key of Data.fileCache.keys()) {
    if (cacheNeedSet.has(key)) cacheNeedSet.delete(key);
    else Data.fileCache.delete(key);
  } // 将cache更新为传入列表对应的状态:
  // 1.如果传入的keys命中cache则被保留，并从NeedSet中delete
  // 2.如果cache的一条记录不在传入内容中则删除（下个cache状态不需要这条记录）
  // 3.最后尝试从db获取缺少部分(cacheNeedSet剩余的)
  if (cacheNeedSet.size === 0) {
    // console.log('cache不变');
    return;
  }
  const obj = await FileInfo.getFilesBase64(Array.from(cacheNeedSet));
  Object.entries(obj).map(([k, v]) => Data.fileCache.set(k, v));
  console.log('nowCache', Data.fileCache.keys());
  return;
}
export function getSrc(fileKey: string) {
  const record = Data.fileCache.get(fileKey);
  if (record?.code === void 0) throw new Error(`getSrc(): 没有命中缓存 ${fileKey}`);
  return record.code;
}
export namespace EXStaticSentence {
  const uniqueFns = ['Place', 'CG', 'CGOut', 'BGM', 'voice'];
  const map: Record<string, (state: Data.EXStaticSentence['state'], props: any) => void> = {
    Place: function (state, props: any[]) {
      if (state!.place !== void 0) throw new Error(`一个语句出现多个Place`);
      state!.place = props[0] ?? null;
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
    CG: function (state, props: any[]) {
      if (state!.CG !== void 0) throw new Error(`一个语句出现多个CG/CGOut`);
      state!.CG = props[0];
    },
    CGOut: function (state, props: any[]) {
      if (state!.CG !== void 0) throw new Error(`一个语句出现多个CG/CGOut`);
      state!.CG = null;
    },
    BGM: function (state, props: any[]) {
      if (state!.BGM !== void 0) throw new Error(`一个语句出现多个BGM`);
      state!.BGM = props[0] ?? null;
    },
    voice: function (state, props: any[]) {
      if (state!.voice !== void 0) throw new Error(`一个语句出现多个voice`);
      state!.voice = props[0] ?? null;
    },
  };
  function writeState(base: Data.SentenceState, sentence: Data.EXStaticSentence) {
    if (sentence.state) return;
    const { fns } = sentence;
    const charaMoveFns = fns.filter(([e]) => e === 'charaMove');
    console.log(fns);
    const tempState: typeof base = {};
    fns.forEach(([fnName, props]) => {
      const todo = map[fnName];
      todo && todo(tempState, props);
    });
    const nextState: typeof base = base;
    Object.assign(nextState, tempState);
    nextState.charas = Object.assign({ ...base?.charas }, tempState.charas);
    Object.entries(nextState.charas).forEach(([k, v]) => {
      if (v === null) delete nextState.charas![k];
    });
    Object.entries(nextState).forEach(([k, v]) => {
      if (v === null) delete nextState[k as keyof typeof nextState];
    });
    Object.values(nextState.charas).forEach((e) => {
      if (e?.move) delete e.move;
    });
    charaMoveFns.forEach(([, [charaKey, moveType, ...props]], i) => {
      const c = nextState.charas![charaKey as string];
      if (!c) return;
      (c.move ??= [])[i] = [moveType as string, ...props];
    });
    if (nextState.charas && Object.keys(nextState.charas).length === 0) delete nextState.charas;

    sentence.state = deepClone(nextState);
    // const newNeed = new Set(base);
  }
  function getParagraphBaseNeed(ParagraphRecord: VN.StaticStory['ParagraphRecord'], nowParagraph: VN.Paragraph) {
    const { source } = nowParagraph;
    if (source.length === 0) return {};
    // @ts-ignore: findLastIndex
    const lastGotNeedIndex = source.findLastIndex((paragraphKey: string) => Data.sentenceCache.get(ParagraphRecord[paragraphKey].end)?.state);
    const lastState: Data.SentenceState =
      lastGotNeedIndex === -1 ? {} : deepClone(Data.sentenceCache.get(ParagraphRecord[source[lastGotNeedIndex]].end)!.state);
    for (let i = lastGotNeedIndex + 1; i < source.length; ++i) {
      for (let j = ParagraphRecord[source[i]].start; j <= ParagraphRecord[source[i]].end; ++j) writeState(lastState, Data.sentenceCache.get(j)!);
    }
    return deepClone(Data.sentenceCache.get(ParagraphRecord[source[source.length - 1]].end)!.state);
  }
  export function getState(ID: VN.StaticSentence['ID']) {
    const sentence = Data.sentenceCache.get(ID);
    if (sentence === void 0) throw new Error(`getState(): 不存在的句子ID: ${ID}`);
    if (sentence.state) return sentence.state!;
    if (ID % 0x10000 !== 0) {
      const prevSentenceNeed = deepClone(Data.sentenceCache.get(ID - 1)?.state);
      if (prevSentenceNeed) {
        writeState(prevSentenceNeed, sentence);
        return sentence.state!;
      }
    }
    const { staticBookID, staticStoryID, staticSentenceID } = VN.decodeStaticSentenceID(ID);
    const nextBook = Data.staticBookRecord[Data.Book_KeyIDEnum[staticBookID]];
    const { ParagraphRecord } = Data.staticStoryRecord[nextBook.Story_KeyIDEnum[staticStoryID]];
    const nowParagraph = Object.values(ParagraphRecord).find(({ start, end }) => staticSentenceID >= start && staticSentenceID <= end);
    if (nowParagraph === void 0) throw new Error(`getState(): 未找到包含 0x${staticSentenceID.toString(16)} 的段落`);
    const nowParagraphBaseNeed = getParagraphBaseNeed(ParagraphRecord, nowParagraph);
    for (let i = nowParagraph.start; i <= ID; ++i) writeState(nowParagraphBaseNeed, Data.sentenceCache.get(i)!);
    return sentence.state!;
  }
}
