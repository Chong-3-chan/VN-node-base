import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { FileType } from './cgi/records';
import { resourceBasePathRecord } from './config';
import { WorkerHandle, Worker_getZip, workerRecord } from './worker/WorkerHandle';
export const imurl = import.meta.url

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
const wk = new Worker(new URL('./worker/getZip.worker',import.meta.url))
// const wk = new Worker_getZip({url:'https://chong-chan.cn/resource/sample3/package/home_SAMPLE.zip'},(m)=>console.log(m))
console.log(workerRecord['getZip'].getUrl(),new URL('./worker/getZip.worker',import.meta.url))
wk.onmessage = (e)=>console.log(e.data)
wk.postMessage({});
// new WorkerHandle('getZip',{url:'https://chong-chan.cn/resource/sample3/package/home_SAMPLE.zip'},(m)=>console.log(m))
console.log(FileType.fromSuffix('mp3'))
console.log(resourceBasePathRecord, resourceBasePathRecord.SERVER)
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
