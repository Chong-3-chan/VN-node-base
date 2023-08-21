/* eslint-disable no-restricted-globals */
import JSZip, { filter } from 'jszip'
import JSZipUtils from './jszip-utils.for_worker';
import { FileSuffix, fileSuffixMap } from '../cgi/records';
export type Worker_getZipState = 'ready' | 'downloading' | 'loading' | 'done' | 'error'
interface Worker_getZipMessage {
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
     } catch (error) {
          postMessage({ state: 'error', error , text: `资源包下载完成，开始加载...`})
     }
}
self.onmessage = (e) => d(e.data);

// async function d(zip_path) {
//      try {
//          const a = await new JSZip.external.Promise(function (resolve, reject) {
//              self.postMessage({ state: "downloading", resourcePath: zip_path, percent: 0 });
//              JSZipUtils.getBinaryContent(zip_path, {
//                  callback: function (err, data) {
//                      if (err) reject(err);
//                      else resolve(data);
//                  },
//                  progress: e => self.postMessage({ state: "downloading", resourcePath: zip_path, percent: e.percent })
//              });
//          }).catch(err => { throw err });
//          self.postMessage({ state: "loading", loaded: 0, total: null });
//          const b = await JSZip.loadAsync(a);
//          let fileNameList = Object.keys(b.files), loaded = 0, total = fileNameList.length, files = {};
//          self.postMessage({ state: "loading", loaded: loaded, total: total });
//          const c = await Promise.allSettled(
//              fileNameList.map((e) => b.file(e).async('base64')
//                  .then((code) => {
//                      files[e] = {};
//                      const suffix = e.slice(e.lastIndexOf('.') + 1);
//                      console.log(suffix,blobType[suffix], "bbbb")
//                      if (!blobType[suffix]) throw suffix + ':未定义的后缀';
//                      files[e].type = blobType[suffix];
//                      files[e].data = `data:${files[e].type};base64,${code}`;
//                      self.postMessage({ state: "loading", loaded: ++loaded, total: total });
//                  }))
//          );
//          self.postMessage({ state: "done", data: files, total });
//      } catch (err) {
//          self.postMessage({ state: "error", error: err });
//          throw err;
//      }
//  };