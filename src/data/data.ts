import type { VN } from '../class/Book';
import type { CharaInfo, FileInfo, InfoItem, PackageInfo, TipsGroup } from '../class/Records';
import { Checker } from './globalSave';

// key-value(includes key)
export class KKVRecord<T extends { key: string | number }> implements Record<string | number, T> {
  [key: string | number]: T;
  static push<T extends { key: string | number }>(record: KKVRecord<T>, tList: T[]) {
    for (const obj of tList as T[]) record[obj.key] = obj;
  }
  constructor(tList?: Array<T>) {
    if (tList !== void 0) KKVRecord.push(this, tList);
  }
}

export const packageRecord = new KKVRecord<PackageInfo>();
export const fileRecord = new KKVRecord<FileInfo>();
export const charaRecord = new KKVRecord<CharaInfo>();
export const tipsGroupRecord = new KKVRecord<TipsGroup>();
export const infoRecord = new KKVRecord<InfoItem>();

export const Book_KeyIDEnum: VN.KeyIDEnum = {};
// Book_KeyIDEnum在StaticBook构造时被填充
export const staticStoryRecord = new KKVRecord<VN.StaticStory>();
export const staticBookRecord = new KKVRecord<VN.StaticBook>();
export type SentenceState = {
  place?: string | null;
  CG?: string | null;
  charas?: Record<
    CharaInfo['key'],
    { key: string; position: string; move?: [string, ...VN.fnProps][] & Record<number, [string, ...VN.fnProps]> } | null
  >;
  BGM?: string | null;

  voice?: string | null;
  choice?: [type: 'para' | 'story', nextAny: string, text: string][] | null;
  loadList?: string[];
};
export interface EXStaticSentence extends VN.StaticSentence {
  states?: SentenceState[];
  lastState?: SentenceState;
}
export const sentenceCache = new Map<VN.StaticSentence['ID'], EXStaticSentence>();
export const fileCache = new Map();
interface HomeResource {
  BGM: string;
  backgroundImage: string;
  booksCover: Record<string, string>;
  backgroundImageList: [Checker, string][];
  elements: {
    title: {
      fileKey: string;
    };
    logo: {
      fileKey: string;
    };
  };
  loadList: string[];
}
export const homeResource: HomeResource = {
  BGM: '_H_BGM_0',
  backgroundImageList: [
    [new Checker(['!', [], []]), '_H_BG_1'],
    //优先选择最后一个通过check的图片
  ],
  backgroundImage: '_H_BG_1',
  booksCover: {},
  elements: {
    title: {
      fileKey: '_H_TITLE',
    },
    logo: {
      fileKey: '_H_LOGO',
    },
  },
  loadList: [],
};
