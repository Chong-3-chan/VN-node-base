/* eslint-disable no-restricted-globals */
import JSZip from 'jszip'
import JSZipUtils from './jszip-utils.for_worker';
function d() {
     self.postMessage([JSZip.toString(),JSZipUtils.toString()]);
}
self.onmessage = (e) => d();