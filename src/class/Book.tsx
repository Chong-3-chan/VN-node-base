/* eslint-disable complexity */
import { KKVRecord, charaRecord, Book_KeyIDEnum, sentenceCache } from '../data/data';
import * as GlobalSave from '../data/globalSave';
import { dbh } from '../handle/IndexedDB';
import { CharaInfo } from './Records';
const MAX_BOOKS_NUM = 0xff;
const MAX_STORYS_NUM_OF_A_BOOK = 0xff;
const MAX_SENTENCES_NUM_OF_A_STORY = 0xffff;
export namespace VN {
  function equationLineToKV(equationLine: string) {
    const signIndex = equationLine.indexOf('=');
    if (signIndex <= 0) throw new Error(`equationLineToKV():输入了非等式行\n${equationLine}`);
    return [equationLine.slice(1, signIndex), equationLine.slice(signIndex + 1)];
  }
  type Category = 'BOOK' | 'STORY';
  const equationLineTest = Object.freeze({
    BOOK: {
      propNames: Object.freeze(['start', 'defaultStyle', 'cover', 'check']),
      RegExpMap: Object.freeze({
        start: /^".+?"$/,
        defaultStyle: /^".+?"$/,
        end: /^\[\[".+?",".+?"\](,\[".+?",".+?"\])*\]$/,
        cover: /^".+?"$/,
        check: /(^".+?"$)|(^\["[&|!]"(,\["[&|!]"(,(\[\]|\[".+?"(,".+?")*\])){2}\]){2}\]$)/,
      }),
    },
    STORY: {
      propNames: Object.freeze(['title', 'tips']),
      RegExpMap: Object.freeze({
        title: /^".+?"$/,
        end: /^\[".+?"(,".+?")*\]$/,
        tips: /^\[".+?"(,".+?")*\]$/,
        to: /^".+?"$/,
      }),
    },
  });
  function readProps(
    VNLines: readonly string[],
    category: 'BOOK',
    check: boolean
  ): [{ [propName in keyof typeof equationLineTest.BOOK.RegExpMap]: any }, number];
  function readProps(
    VNLines: readonly string[],
    category: 'STORY',
    check: boolean
  ): [{ [propName in keyof typeof equationLineTest.STORY.RegExpMap]: any }, number];
  function readProps(VNLines: readonly string[], category: Category, check: boolean) {
    const re: any = [{}, VNLines.length];
    const props = re[0];
    if (check) {
      const RegExpMap = equationLineTest[category].RegExpMap;
      for (let i = 1; i < VNLines.length; ++i) {
        const currentLine = VNLines[i];
        if (currentLine[0] !== '>') {
          if (category === 'BOOK') throw new Error(`VN.readProps(): 非追加属性行于${category}-VN第 ${i} 行。\n"${VNLines[i]}"`);
          re[1] = i;
          break;
        }
        const [ikey, ivalue] = equationLineToKV(currentLine);
        const reg = RegExpMap[ikey as keyof typeof RegExpMap];
        if (reg) {
          if (!reg.test(ivalue)) {
            throw new Error(`VN.readProps(): 追加属性${ikey}格式出错。\n\t匹配:${reg}\n\t读取到:${ivalue}`);
          }
        }
        props[ikey] = JSON.parse(ivalue);
      }
    } else {
      for (let i = 1; i < VNLines.length; ++i) {
        const currentLine = VNLines[i];
        const [ikey, ivalue] = equationLineToKV(currentLine);
        props[ikey] = JSON.parse(ivalue);
      }
    }
    const propNames = equationLineTest[category].propNames;
    let firstLost = propNames.find((name) => !props[name]);
    if (firstLost)
      throw new Error(
        `VN.readProps(): 构造${category}-VN时追加属性不足够或不对应。缺少:${firstLost}\n需要:${propNames.join(',')}。\n读取到:\n${JSON.stringify(
          re,
          null,
          2
        )}\n实际输入:\n${VNLines.slice(1).join('\n')}`
      );
    return re;
  }
  export type KeyIDEnum = {
    [ID: number]: string;
    [key: string]: number | string;
  };
  export class RuntimeStory {
    key: string;
    constructor(key: string) {
      this.key = key;
    }
  }

  export class RuntimeBook {
    key: string;
    constructor(key: string) {
      this.key = key;
      // todo: 需要Runtime定义吗？
    }
  }
  export type fnProps = (string | fnProps)[];
  export class StaticSentence {
    ID: number; // 0x0000 ~ 0xffff
    // line: string
    charaKey: string;
    text: string;
    fns: [string, fnProps][];
    static async getRecordsFromDB(staticStoryID: number) {
      const re = await dbh.getMRange('Sentence', { lower: staticStoryID << 16, upper: (staticStoryID + 1) << 16 }).then((arr) => {
        return arr.map((e: StaticSentence) => {
          Object.setPrototypeOf(e, StaticSentence.prototype);
          return e;
        });
      });
      return re;
    }
    constructor(ID: number, sentenceLine: string) {
      this.ID = ID;
      // this.line = sentenceLine
      const [charaKey, text, ...fnsStringList] = sentenceLine.slice(1).split('\x1e');
      this.charaKey = charaKey;
      this.text = text;
      this.fns = fnsStringList.map((fnString) => {
        const firstLeftBracketIndex = fnString.indexOf('[');
        const [fnName, propsStr] = [fnString.slice(0, firstLeftBracketIndex), fnString.slice(firstLeftBracketIndex)];
        return [fnName, JSON.parse(propsStr)];
      });

      // console.log(this)
    }
  }
  export class Paragraph {
    key: string;
    start: number; // 0x0000 ~ 0xffff
    end: number; // === start+para.len-1
    endToStory?: string;
    source: Paragraph['key'][];
    toPara?: Paragraph['key'][];
    toStory?: Paragraph['key'][];
    constructor(
      key: string,
      startSentenceID: number,
      endSentenceID: number,
      endToStory: string | void,
      source: Paragraph['source'],
      toPara?: Paragraph['toPara'],
      toStory?: Paragraph['toStory']
    ) {
      this.key = key;
      this.start = startSentenceID;
      this.end = endSentenceID;
      endToStory !== void 0 && (this.endToStory = endToStory);
      this.source = source;
      toPara !== void 0 && (this.toPara = toPara);
      toStory !== void 0 && (this.toStory = toStory);
    }
  }
  export function getFnsNeedFilekeys(staticSentence: StaticSentence): string[] {
    if (staticSentence === void 0) throw new Error('getFnsNeedFilekeys(): 传入了空参数');
    const map: Record<string, (props: any) => string | null> = {
      Place: (props: any[]) => props[0],
      chara: (props: [string, string, string]) => CharaInfo.getPicFilekey(props[0], props[1]),
      CG: (props: any[]) => props[0],
      BGM: (props: any[]) => props[0],
      voice: (props: any[]) => props[0],
    };
    return Array.from(
      new Set(
        staticSentence.fns
          .map((e) => {
            const [fnName, props] = e;
            const todo = map[fnName];
            return todo !== void 0 ? todo(props) ?? null : null;
          })
          .filter((e) => e !== null)
      )
    ) as string[];
  }
  export class StaticStory {
    ID: number;
    key: string;
    title: string;
    end: string[];
    tips: readonly string[];
    paragraphRecord: KKVRecord<Paragraph>;
    to?: string;
    loadList: string[];
    static async getRecordFromDB(ID: number) {
      const re = dbh.get('Story', ID).then((e: StaticStory) => {
        if (e !== void 0) {
          Object.setPrototypeOf(e, StaticStory.prototype);
          Object.setPrototypeOf(e.paragraphRecord, KKVRecord.prototype);
          return e;
        } else throw new Error(`请求了不存在的staticStoryID: 0x${ID.toString(16).padStart(4, '0')} from 0x${ID.toString(16).padStart(8, '0')}`);
      });
      return re;
    }
    constructor(ID: number, key: string, VNLines: readonly string[]) {
      this.ID = ID;
      this.key = key;
      const [{ title, tips, to }, lastPropsLineIndex] = readProps(VNLines, 'STORY', true);
      this.title = title;
      this.end = [];
      this.tips = tips;
      to !== void 0 && (this.to = to);
      const loadSet = new Set<string>([]);
      const paragraphPropsCache: Record<string, [start: number, end: number, endToStory: string | void]> = {};
      const sentenceCache: StaticSentence[] = [];
      let nextSentenceID = (this.ID << 16) + 0x0000;
      const maxSentenceID = (this.ID << 16) + MAX_SENTENCES_NUM_OF_A_STORY;
      const paragraphConnect = {
        source: {} as Record<string, string[]>,
        toPara: {} as Record<string, string[]>,
        toStory: {} as Record<string, string[]>,
        from: {} as Record<string, string>,
        endToStory: void 0 as string | void,
      };
      let rootParagraphKey: string;
      for (let i = lastPropsLineIndex; i < VNLines.length; ++i) {
        let currentLine = VNLines[i];
        if (currentLine[0] !== '\x02') {
          throw new Error(`StaticStory构造: 未读到段落起始标识于行 ${i}。读取到:\n\t${currentLine}`);
        }
        const [paragraphKey, endToStory] = currentLine.slice(1).split('\x1b'),
          paragraphStartID = nextSentenceID;
        const isEndParagraph = endToStory !== void 0;
        rootParagraphKey ??= paragraphKey;
        currentLine = VNLines[++i];
        for (; currentLine[0] === '@'; currentLine = VNLines[++i]) {
          if (nextSentenceID > maxSentenceID) throw new Error(`StaticStory构造: 故事 ${this.ID} 语句过多。`);
          const newStaticSentence = new StaticSentence(nextSentenceID++, currentLine);
          getFnsNeedFilekeys(newStaticSentence).forEach((e) => loadSet.add(e));
          sentenceCache.push(newStaticSentence);
        }
        const paragraphEndID = nextSentenceID - 1;

        if (paragraphStartID > paragraphEndID) throw new Error(`StaticStory构造: 空段落于行 ${i}。`);
        if (currentLine[0] !== '\x03') throw new Error(`StaticStory构造: 未读到段落结束标识于行 ${i}。读取到:\n\t${currentLine}`);
        else if (paragraphKey !== currentLine.slice(1))
          throw new Error(`StaticStory构造: 读到段落结束标识不匹配于行 ${i}。读取到:\n\t${currentLine.slice(1)},\n应为:\n\t${paragraphKey}`);

        // todo: choice改造后需要再调整
        const choiceFns = sentenceCache[sentenceCache.length - 1].fns.find(([fnName]) => fnName === 'choice');
        if (!isEndParagraph) {
          if (!choiceFns) throw new Error(`StaticStory构造: 异常的非end段落${key} - ${paragraphKey}: 最后一句不是选项\n${VNLines[i - 1]}`);
          choiceFns[1].forEach(([type, nextAny, text]) => {
            if (type === 'para') {
              const nextParagraph = nextAny;
              (paragraphConnect.toPara[paragraphKey] ??= []).push(nextParagraph as string);
              if (paragraphConnect.from[nextParagraph as string]) throw new Error(`StaticStory构造: ${key} - ${nextParagraph}存在多个from`);
              paragraphConnect.from[nextParagraph as string] = paragraphKey;
            } else if (type === 'story') {
              const nextStroy = nextAny;
              (paragraphConnect.toStory[paragraphKey] ??= []).push(nextStroy as string);
              // ...
            }
          });
        } else if (choiceFns) throw new Error(`StaticStory构造: 异常的end段落${key} - ${paragraphKey}: 存在choice`);
        else {
          this.end.push(paragraphKey);
          if (endToStory) (paragraphConnect.toStory[paragraphKey] ??= []).push(endToStory);
        }
        paragraphPropsCache[paragraphKey] = [paragraphStartID, paragraphEndID, endToStory];
      }
      if (rootParagraphKey! === void 0) throw new Error(`StaticStory构造: 故事 ${key} 无段落`);
      function writeSource(rootKey: string, sourceValue: string[]) {
        if (paragraphPropsCache[rootKey] === void 0)
          throw new Error(`StaticStory构造: ${key} - ${rootKey} 段落不存在，且存在choice尝试跳转到 ${rootKey}`);
        if (sourceValue.includes(rootKey)) throw new Error(`StaticStory构造: 故事 ${key} 存在段落环:\n\t${sourceValue.join('-')}-${rootKey}`);
        paragraphConnect.source[rootKey] = sourceValue;
        paragraphConnect.toPara[rootKey]?.forEach((key) => {
          writeSource(key, [...sourceValue, rootKey]);
        });
      }
      writeSource(rootParagraphKey, []);
      const paragraphs = Object.entries(paragraphPropsCache).map(([paragraphKey, [paragraphStartID, paragraphEndID, endToStory]]) => {
        if (paragraphConnect.source[paragraphKey] === void 0) console.warn(`存在不可到达的段落: ${key} - ${paragraphKey}`);
        return new Paragraph(
          paragraphKey,
          paragraphStartID,
          paragraphEndID,
          endToStory,
          paragraphConnect.source[paragraphKey] ?? [],
          paragraphConnect.toPara[paragraphKey],
          paragraphConnect.toStory[paragraphKey]
        );
      });
      this.paragraphRecord = new KKVRecord(paragraphs);
      this.loadList = Array.from(loadSet);
      // console.log(sentenceCache)
      dbh.putM('Sentence', sentenceCache);
      // console.log(this)
    }
  }
  export class StaticBook {
    ID: number;
    key: string;
    start: string; // Story's key
    defaultStyle: string;
    end: [string, string][];
    cover: string; // homeResource's filekey
    check: GlobalSave.CheckerConstructorProps;
    Story_KeyIDEnum: KeyIDEnum;
    constructor(ID: number, key: string, [BookVN, StoryVNMap]: [string, { [StoryKey: string]: string }]) {
      // 构造时更新Book_KeyIDEnum
      if (Book_KeyIDEnum[key] || Book_KeyIDEnum[ID]) throw new Error(`new StaticBook()警告: 存在重复BookID${ID}或Key${key}`);
      Book_KeyIDEnum[key] = this.ID = ID;
      Book_KeyIDEnum[ID] = this.key = key;
      const VNLines = BookVN.split('\n')
        .map((l) => l.trim())
        .filter((l) => l);

      const [{ start, defaultStyle, end, cover, check }] = readProps(VNLines, 'BOOK', true);
      this.start = start;
      this.defaultStyle = defaultStyle;
      this.end = end;
      this.cover = cover;
      this.check = check;

      this.Story_KeyIDEnum = {};

      const storyCache: StaticStory[] = [];
      let nextStoryID = (this.ID << 8) + 0x01; // 给start（起始故事）空出了00
      const maxStoryID = (this.ID << 8) + MAX_STORYS_NUM_OF_A_BOOK;
      for (const key in StoryVNMap) {
        if (nextStoryID > maxStoryID) throw new Error(`StaticBook构造: 故事过多。`);
        const newStoryID = key === this.start ? (this.ID << 8) + 0x00 : nextStoryID++;
        // 规定起始故事必须为00
        this.Story_KeyIDEnum[newStoryID] = key;
        this.Story_KeyIDEnum[key] = newStoryID;
        storyCache.push(
          new StaticStory(
            newStoryID,
            key,
            StoryVNMap[key]
              .split('\n')
              .map((l) => l.trim())
              .filter((l) => l)
          )
        );
      }
      dbh.putM('Story', storyCache);

      // console.log(this)
    }
  }

  export function decodeStaticSentenceID(staticSentenceID: number) {
    return {
      staticBookID: staticSentenceID >> 24,
      staticStoryID: staticSentenceID >> 16,
      staticSentenceID: staticSentenceID,
    };
  }
  export function encodeStaticSentenceID(obj: { StaticBookID: number }): number;
  export function encodeStaticSentenceID(obj: { StaticStoryID: number }): number;
  export function encodeStaticSentenceID(obj: { StaticBookID?: number; StaticStoryID?: number }) {
    if (obj.StaticBookID !== void 0) {
      if (obj.StaticBookID >= 0 && obj.StaticBookID < MAX_BOOKS_NUM) return obj.StaticBookID << 24;
    } else if (obj.StaticStoryID !== void 0) {
      if (obj.StaticStoryID >= 0 && obj.StaticStoryID < MAX_STORYS_NUM_OF_A_BOOK) return obj.StaticStoryID << 16;
    }
    throw new Error(`encodeStaticSentenceID(): 入参异常: \n${JSON.stringify(obj, null, 2)}`);
  }

  // export function fromObject(vm: string) {
  //     const lines = vm.split('\n').map(l => l.trim()).filter(l => l)
  //     const firstLine = lines[0]
  //     if (firstLine[0] !== '=') throw new Error(`VN.fromObject(): 传入的vm字符串非空首行未以"="起始。\n错误的行:"${firstLine}"`)
  //     const [category, key] = firstLine.slice(1).split(':');
  //     switch (category as Category) {
  //         case 'BOOK':
  //         // return new StaticBook(-1, key, lines)
  //         case "STORY":
  //         // return new StaticStory(-1, key, lines)
  //         default: throw new Error(`VN.fromObject(): 传入的vm字符串类型字段值(${category})未定义。`)
  //     }
  // }
  // export function toObject() {

  // }
}

// export const vmtoobj = (e: string) => console.log(VN.fromObject(e))
