/* eslint-disable no-restricted-globals */
import JSZip from 'jszip'
import JSZipUtils from './jszip-utils.for_worker';

export type Worker_getZipState = 'ready' | 'downloading' | 'loading' | 'done' | 'error'
interface Worker_getZipMessage {
     state: Worker_getZipState
     resourcePath?: string,
     percent?: number,
     error?: any
}
function postMessage(e: Worker_getZipMessage) {
     self.postMessage(e)
}

export type Worker_getZipProps = { url: string }
async function d(props: Worker_getZipProps) {
     const { url } = props
     postMessage({ state: 'ready' });
     const a = await (new JSZip.external.Promise(function (resolve, reject) {
          postMessage({ state: 'downloading', resourcePath: url, percent: 0 })
          JSZipUtils.getBinaryContent(url, {
               callback: function (err: any, data: unknown) {
                    if (err) reject(err);
                    else resolve(data);
               },
               progress: (e: { percent: number; }) =>
                    postMessage({ state: "downloading", resourcePath: url, percent: e.percent })
          });
     }) as Promise<unknown>).catch((error) => postMessage({ state: 'error', error }))
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