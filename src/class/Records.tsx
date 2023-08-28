import { resourceBasePath } from "../config";
import { fileRecord, packageRecord, charaRecord, KKVRecord } from "../data/data";
import { WorkerHandle, WorkerMessage, Worker_getZip } from "../worker/WorkerHandle";
import { Worker_getZipResponse, Worker_getZipState } from "../worker/getZip.worker";
import { FixedArray } from "./Book";

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


/******************************* PackageInfo ********************************/
export class PackageInfo {
  key!: string
  state!: 'waiting' | 'ready' | 'downloading' | 'loading' | 'done' | 'error'
  resourcePath!: URL
  fileKeyNameMap!: Record<string, string>
  total?: number | null
  loaded?: number
  error?: any
  worker?: WorkerHandle
  constructor(packageInfo: PackageInfo)
  constructor(key: string, url?: URL, fileKeyNameMap?: Record<string, string>)
  constructor(args_0: PackageInfo | string, args_1?: URL, args_2?: Record<string, string>) {
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
      this.fileKeyNameMap = fileKeyNameMap as Record<string, string>
      return
    }
    else throw new Error(`构造PackageInfo时传入错误的参数:\n${JSON.stringify(Array.from(arguments), null, 2)}`)
  }
}
export interface PackageInfo {
  load: (onStepFuns: { [step in Worker_getZipState]?: (msg: WorkerMessage) => void }) => Promise<any>
}
PackageInfo.prototype.load = async function (onStepFuns) {
  // todo:hit DB?helper
  const data: Worker_getZipResponse = await new Promise((resolve, reject) => {
    this.worker = new Worker_getZip({
      url: this.resourcePath.toString(),
      fileNameSet: new Set(Object.entries(this.fileKeyNameMap).map(([key, name]) => name))
    }, (msg) => {
      switch (msg.state) {
        case "ready":
          this.state = "ready"
          break
        case "downloading":
          this.state = "downloading"
          break
        case "loading":
          this.state = "loading"
          this.total = msg.total
          this.loaded = msg.loaded
          break
        case "done":
          this.state = "done"
          resolve(msg.data);
          break
        case "error":
          this.state = "error"
          this.error = msg.error
          reject(msg.error);
          break
        default: break
      }
      const todo = onStepFuns[msg.state as Worker_getZipState]
      typeof todo === 'function' && todo(msg)
      console.log(this, msg.text)
    })
  }).catch((error) => {
    throw new Error(error)
  }) as Worker_getZipResponse;
  const fileNameKeysMap = (() => {
    const re: { [filename: string]: string | string[] } = {}
    Object.entries(this.fileKeyNameMap).forEach(([key, name]) => {
      if (re[name] === void 0) re[name] = key
      else Array.isArray(re[name]) ? (re[name] as string[]).push(name) : (re[name] = [re[name] as string, name])
    })
    return re
  })()
  const allFileInfosFromPackage = (() => {
    const re: FileInfo[] = []
    Object.entries(data).forEach(([name, code]) => {
      Array.isArray(fileNameKeysMap[name]) ?
        (fileNameKeysMap[name] as string[]).forEach(key => re.push(new FileInfo(key, this.key, name, code)))
        : re.push(new FileInfo(fileNameKeysMap[name] as string, this.key, name, code))
    })
    return re
  })()
  KKVRecord.push(fileRecord, allFileInfosFromPackage)
  Object.freeze(this)
}
export namespace PackageInfo {
  export function createPackageInfo(packageInfo: PackageInfo): PackageInfo
  export function createPackageInfo(packageKey: string, relativePath?: string, fileKeyNameMap?: Record<string, string>): PackageInfo
  export function createPackageInfo(args_0: PackageInfo | string, args_1?: string, args_2?: Record<string, string>): PackageInfo {
    if (args_0 instanceof PackageInfo) {
      const [packageInfo] = [args_0];
      KKVRecord.push(packageRecord, [packageInfo])
      return packageRecord[packageInfo.key]
    }
    else {
      const [packageKey, relativePath, fileKeyNameMap] = [args_0, args_1, args_2]
      const newInfo = new PackageInfo(packageKey, new URL(resourceBasePath.toString() + relativePath), fileKeyNameMap)
      KKVRecord.push(packageRecord, [newInfo])
      return packageRecord[newInfo.key]
    }
  }
}
/******************************* PackageInfo END ********************************/


/******************************* FileInfo ********************************/
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
/******************************* FileInfo END ********************************/


/******************************* CharaInfo ********************************/
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
/******************************* CharaInfo END ********************************/


/******************************* TipsGroup ********************************/
export class Tips {
  title: string
  text: string
  constructor(title: string, text: string) {
    this.title = title
    this.text = text
    Object.freeze(this)
  }
}
export class TipsGroup {
  key: string
  name: string
  list: Tips[]
  constructor(key: string, name: string, titleTextList: FixedArray<string,2>[]) {
    this.key = key
    this.name = name
    this.list = titleTextList.map(([title, text]) => new Tips(title, text))
  }
}
/******************************* TipsGroup END ********************************/

