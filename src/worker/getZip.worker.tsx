/* eslint-disable no-restricted-globals */
import JSZip from 'jszip'
import JSZipUtils from './jszip-utils.for_worker';
import { errorMessage } from '../cgi/error';
async function d() {
     self.postMessage([JSZip.toString(),JSZipUtils.toString()]);
}
self.onmessage = (e) => d();

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