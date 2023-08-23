/* eslint-disable no-restricted-globals */
import JSZip from 'jszip'
import JSZipUtils from './jszip-utils.for_worker';
import { FileSuffix, fileSuffixMap } from '../cgi/records';
export type Worker_getZipState = 'ready' | 'downloading' | 'loading' | 'done' | 'error'
export interface Worker_getZipMessage {
     state: Worker_getZipState
     text: string
     resourcePath?: string,
     percent?: number,
     error?: any,
     loaded?: number,
     total?: number | null,
     data?: Worker_getZipResponse,
     failedFileNameList?: string[]
}
function postMessage(e: Worker_getZipMessage) {
     self.postMessage(e)
}

export type Worker_getZipProps = { url: string, fileNameSet: Set<string> }

export type Worker_getZipResponse = { [fileName: string]: string }
async function d(props: Worker_getZipProps) {
     const { url, fileNameSet: fileNameSet } = props
     postMessage({ state: 'ready', text: '加载准备中...' });
     try {
          const a = await (new JSZip.external.Promise(function (resolve, reject) {
               postMessage({ state: 'downloading', resourcePath: url, percent: 0, text: '资源包下载中...' })
               JSZipUtils.getBinaryContent(url, {
                    callback: function (err: any, data: unknown) {
                         if (err) reject(err);
                         else resolve(data);
                    },
                    progress: (e: { percent: number; }) =>
                         postMessage({ state: "downloading", resourcePath: url, percent: e.percent, text: `资源包下载中... ${e.percent.toFixed(1)}%` })
               });
          }) as Promise<any>).catch((error) => { throw error })

          postMessage({ state: 'loading', loaded: 0, total: null, text: `资源包下载完成，开始加载...` })
          const b: any = await JSZip.loadAsync(a);
          const fromZip = new Set(Object.keys(b.files))
          let fileNameList = Array.from(fileNameSet).filter((name) => fromZip.has(name)),
               loaded = 0,
               total = fileNameList.length,
               res: Worker_getZipResponse = {}
          postMessage({ state: "loading", loaded: loaded, total: total, text: `资源包下载完成，开始加载...` })
          const c = await Promise.allSettled(
               fileNameList.map((name) => {
                    const suffix = name.slice(name.lastIndexOf('.') + 1) as FileSuffix;
                    const type = fileSuffixMap[suffix]
                    if (!type) throw new Error(name + ':未定义的后缀');
                    return b.file(name).async('base64')
                         .then((code: string) => {
                              res[name] = `data:${type};base64,${code}`;
                              postMessage({ state: "loading", loaded: ++loaded, total: total, text: `加载进度 ${loaded}/${total}` });
                         })
               })
          );
          const failedFileNameList = Array.from(fileNameSet).filter(name => !res[name])
          postMessage({ state: "done", data: res, failedFileNameList, loaded, total ,text: `资源包加载完成！`});
          self.close()
     } catch (error) {
          postMessage({ state: 'error', error , text: `资源加载出错！`})
          self.close()
     }
}
self.onmessage = (e) => d(e.data);