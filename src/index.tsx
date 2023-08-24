import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { FileType, PackageInfo } from './class/Records';
import { getData } from './data/getData';
export const imurl = import.meta.url

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// const wk = new Worker(new URL('./worker/getZip.worker',import.meta.url))
// wk.onmessage = (e)=>console.log(e.data)
// wk.postMessage({});
// new PackageInfo('1',
//   new URL('https://chong-chan.cn/resource/sample3/package/home_SAMPLE.zip'),
//   {'_H_BG_0':'bg_0.png','_H_BG_1':'bg_1.png','_H_LOGO':'霂LOGO.png','_H_TITLE':'_h_title.png'}).load({})
getData();
PackageInfo.createPackageInfo('pk1','/package/home_SAMPLE.zip',{'_H_BG_0':'bg_0.png','_H_BG_1':'bg_1.png','_H_LOGO':'霂LOGO.png','_H_TITLE':'_h_title.png'}).load({})
// const wk = new Worker_getZip({url:'https://chong-chan.cn/resource/sample3/package/home_SAMPLE.zip'},(m)=>console.log(m))
// console.log(workerRecord['getZip'].getUrl(),new URL('./worker/getZip.worker',import.meta.url))
// new WorkerHandle('getZip',{url:'https://chong-chan.cn/resource/sample3/package/home_SAMPLE.zip'},(m)=>console.log(m))
// console.log(FileType.fromSuffix('mp3'))
// console.log(resourceBasePathRecord, resourceBasePathRecord.SERVER)
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
