import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import logo from './logo.svg';
import { Pages } from './pages';
import './App.less';
import { useDTJ } from './public/handle/hooks';
import { tipsGroupRecord } from './data/data';
import { LoadingPProps } from './pages/LoadingP';
import { ActivePage, FXPhase, usePageState } from './pageState';
// import { dbh } from './handle/IndexedDB';

function Test() {
  const { pageState, pageAction } = usePageState();
  // const [count, setCount] = useState(0);
  const handle = (e: number | undefined) => {
    pageAction.setActivePage('MainP', e);

    // setCount((e) => e + 1);
    // // pageAction.setActivePage('MainP');
    // dbh.get('Sentence',888).then(console.log);
    // console.log(pageState.LoadingPProps);
    // console.log(timeAsync(()=>dbh.getMRange('Sentence', { lower: 0, upper: 0x10000000 }).then(console.log)));
  };
  // if (countt !== count) countt = count;
  return (
    <div style={{ position: 'fixed', display: 'flex', zIndex: 10000 }}>
      {<button onClick={() => pageAction.setActivePage('HomeP')}>HomeP</button>}
      {<button onClick={() => pageAction.setActivePage('InfoP')}>InfoP</button>}
      {['00000000', '00000003', '00000007', '01000000'].map((e, i) => (
        <button onClick={() => handle(parseInt(e, 16))} key={i}>
          {'0x' + e}
        </button>
      ))}
      {/* {
        <button
          onClick={() =>
            pageAction.callDialog({
              text: '提示内容提示内容提示内容提示内容提示内容提示内容\n提示内容',
              title: '提示',
              onClose: () => alert('close'),
              optionsCallback: {
                选项1: () => {
                  alert(1);
                  return true;
                },
                选项2: () => {
                  alert(2);
                  return true;
                },
              },
            })
          }
        >
          dialog测试
        </button>
      } */}

      {
        <button
          onClick={() =>
            pageAction.callMessage({
              text: Math.random() + '',
              title: '提示',
            })
          }
        >
          message测试
        </button>
      }
      {
        <button
          onClick={() => {
            const { out, assignOnStepCase } = pageAction.callFX['transition-black-full'](void 0, 1000, 500);
            assignOnStepCase({
              [FXPhase.keep]: () =>
                setTimeout(() => {
                  out();
                }, 0),
            });
          }}
        >
          FX测试
        </button>
      }
    </div>
  );
}

function App() {
  const { pageState, pageAction, PageStateProvider } = usePageState();
  const ref = useRef<HTMLDivElement>(null!);
  return (
    <div className="App" ref={ref}>
      <PageStateProvider parentRef={ref}>
        <Pages />
        {/* <Test /> */}
      </PageStateProvider>
    </div>
  );
}
export default App;
