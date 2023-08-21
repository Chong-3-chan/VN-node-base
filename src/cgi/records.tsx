import { resourceBasePath } from "../config";
import { Worker_getZip } from "../worker/WorkerHandle";
import { Worker_getZipState } from "../worker/getZip.worker";

export type FileSuffix = 'json' | 'zip' | 'png' | 'gif' | 'jpeg' | 'jpg' | 'mp3' | 'aac' | 'oga' | 'ogg'
export type FileType = 'application' | 'image' | 'audio' | 'unknow'
export const fileSuffixMap: { readonly [index in FileSuffix]: string } = {
  json: 'application/json',
  zip: 'application/zip',
  png: 'image/png',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  oga: 'audio/ogg',
  ogg: 'audio/ogg',
}
export namespace FileType {
  // FileType.fromSuffix(_suffix)
  export function fromSuffix(suffix: FileSuffix): FileType {
    return (fileSuffixMap[suffix]?.split('/', 1)[0] ?? 'unknow') as FileType;
  }
}

// interface PackageInfo {
//   readonly key: string,
//   resourcePath: URL,
//   state: 'waiting' | 'downloading' | 'loading' | 'done' | 'error',
//   total?: number,
//   loaded?: number,
//   data?: unknown,
//   load: (doWithMsg:(msg:loaderMsg)=>void)=>Promise<any>
// }
export class PackageInfo {
  key!: string
  state!: 'waiting' | 'downloading' | 'loading' | 'done' | 'error'
  resourcePath!: URL
  total?: number
  loaded?: number
  tag?: string
  fileKeyNameMap!: [string, string][]
  constructor(packageInfo: PackageInfo)
  constructor(key: string, url?: URL, fileKeyNameMap?: [string, string][])
  constructor(args_0: PackageInfo | string, args_1?: URL, args_2?: [string, string][]) {
    if (args_0 instanceof PackageInfo) {
      const packageInfo: PackageInfo = args_0;
      let key: keyof PackageInfo
      for (key in packageInfo)
        this[key] = packageInfo[key] as never & any
      return
    }
    else if (
      args_1 instanceof URL && args_2 instanceof Object
    ) {
      const [key, url, fileKeyNameMap] = [args_0, args_1, args_2];
      this.state = 'waiting'
      this.key = key
      this.resourcePath = url as URL
      this.fileKeyNameMap = fileKeyNameMap as [string, string][]
      return
    }
    else throw new Error(`构造PackageInfo时传入错误的参数:\n${JSON.stringify(Array.from(arguments), null, 2)}`)
  }
}
export interface PackageInfo {
  load: () => Promise<any>
}

export interface loaderMsg {

}
PackageInfo.prototype.load = function () {
  // 补充实现
  return new Promise((resolve, reject) => {
    new Worker_getZip({
      url: this.resourcePath.toString(),
      // fileNameSet: new Set(['_h_title.png', '霂LOGO.png', 'bg_0.png', 'bg_1.png'])
      fileNameSet: new Set(this.fileKeyNameMap.map(([key, name]) => name))
    }, (msg) => {
      switch (msg.state as Worker_getZipState) {
        case "ready":
        case "downloading":
        case "loading":
        case "done":
        case "error":
      }
      console.log(msg)
    })
    resolve('');
  }).then(() => console.log(123))
}

export namespace PackageInfo {
  function createPackageInfo(packageInfo: PackageInfo): PackageInfo
  function createPackageInfo(packageKey: string, relativePath?: string): PackageInfo
  function createPackageInfo(args_0: PackageInfo | string, args_1?: string): PackageInfo {
    if (args_0 instanceof PackageInfo) {
      const [packageInfo] = [args_0];
      return new PackageInfo(packageInfo)
    }
    else {
      const [packageKey, relativePath] = [args_0, args_1]
      return new PackageInfo(packageKey, new URL(resourceBasePath.toString() + relativePath))
    }
  }
}
// key-value(includes key)
export class KKVRecord<T extends { key: string }> implements Record<string, T>{
  [key: string]: T
  static push<T extends { key: string }>(record: KKVRecord<T>, tList: Array<T>) {
    for (const obj of tList)
      record[obj.key] = obj
  };
  constructor(tList?: Array<T> | undefined) {
    if (tList !== undefined)
      KKVRecord.push(this, tList)
  }
}

export class FileInfo {
  key: string
  fromPackege: string
  fileName: string
  base64_type: string
  base64_code: string
  static getBase64(fileKey: string) {
    return fileRecord[fileKey].getBase64();
  }
  constructor(key: string, fromPackage: string, fileName: string, base64_code?: string | undefined) {
    this.key = key
    this.fromPackege = fromPackage
    this.fileName = fileName
    this.base64_code = base64_code ?? ''
    const lastNodeIndex = fileName.lastIndexOf('.')
    const suffix = lastNodeIndex >= 0 ?
      fileName.slice(lastNodeIndex + 1) : ""
    if (suffix in fileSuffixMap)
      this.base64_type = fileSuffixMap[suffix as FileSuffix]
    else throw new Error(`错误：未知的拓展名"${suffix}"。\n\t- 包key值: "${fromPackage}"\n\t- 文件名: "${fileName}"`)
  }
}
export interface FileInfo {
  write: (code: string) => void,
  getBase64: () => string,
  getPath: () => string
}
FileInfo.prototype.write = function (code: string) {
  if (this.base64_code) throw new Error(`错误：尝试覆盖已经写入的base64。\n\t- 文件key值: "${this.key}"`)
  this.base64_code = code
}
FileInfo.prototype.getBase64 = function () {
  return this.base64_code ?
    `data:${this.base64_type};base64,${this.base64_code}` : ""
}
FileInfo.prototype.getPath = function () {
  return `${this.fromPackege}/${this.fileName}`
}

export class CharaInfo {
  key: string
  name: string
  pic: Record<string, string>
  static getCharaPicBase64(key: string, style: string) {
    return FileInfo.getBase64(charaRecord[key].pic[style])
  }
  constructor(key: string, name: string, pic: Record<string, string>) {
    this.key = key
    this.name = name
    this.pic = pic
  }
}

export const packageRecord = new KKVRecord<PackageInfo>()
export const fileRecord = new KKVRecord<FileInfo>()
export const charaRecord = new KKVRecord<CharaInfo>()