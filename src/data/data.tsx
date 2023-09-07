
import { VM } from "../class/Book"
import { CharaInfo, FileInfo, PackageInfo, TipsGroup } from "../class/Records"

// key-value(includes key)
export class KKVRecord<T extends { key: string | number }> implements Record<string | number, T>{
    [key: string | number]: T
    static push<T extends { key: string | number }>(record: KKVRecord<T>, tList: T[]) {
        for (const obj of tList as T[])
            record[obj.key] = obj
    };
    constructor(tList?: Array<T>) {
        if (tList !== void 0)
            KKVRecord.push(this, tList)
    }
}

export const packageRecord = new KKVRecord<PackageInfo>()
export const fileRecord = new KKVRecord<FileInfo>()
export const charaRecord = new KKVRecord<CharaInfo>()
export const tipsGroupRecord = new KKVRecord<TipsGroup>()

export const staticStoryRecord = new KKVRecord<VM.StaticStory>()
export const staticBookRecord = new KKVRecord<VM.StaticBook>()