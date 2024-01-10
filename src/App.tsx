import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import logo from './logo.svg';
import Page, { Pages } from './pages';
import './App.less';
import { useDTJ } from './handle/hooks';
import { tipsGroupRecord } from './data/data';
import { LoadingPProps } from './pages/LoadingP';
import { ActivePageEnum, usePageState } from './pageState';
import { PageStateProvider } from './pageState';
// import { dbh } from './handle/IndexedDB';

function Test() {
  const { pageState, pageAction } = usePageState();
  // const [count, setCount] = useState(0);
  const handle = (e: number | undefined) => {
    pageAction.setActivePage(ActivePageEnum.MainP, e);

    // setCount((e) => e + 1);
    // // pageAction.setActivePage(ActivePageEnum.MainP);
    // dbh.get('Sentence',888).then(console.log);
    // console.log(pageState.LoadingPProps);
    // console.log(timeAsync(()=>dbh.getMRange('Sentence', { lower: 0, upper: 0x10000000 }).then(console.log)));
  };
  // if (countt !== count) countt = count;
  return (
    <div style={{ position: 'fixed', display: 'flex', zIndex: 10000 }}>
      {['00000000', '00000008', '01000000'].map((e, i) => (
        <button onClick={() => handle(parseInt(e, 16))} key={i}>
          {'0x' + e}
        </button>
      ))}
    </div>
  );
}

function App() {
  const { pageState, pageAction } = usePageState();
  return (
    <PageStateProvider>
      <div className="App">
        {/* <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        Edit <code>src/App.tsx</code> and save to reload.
      </p>
      <a
        className="App-link"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn React
      </a>
    </header> */}
        {/* {phase}
    {[a1, b1, b2, c1].map((e,i) => <button key={i} onClick={(()=>e(true))} disabled={e()}>{e().toString()}</button>)} */}
        {/* {<Page.HomeP />} */}
        {/* {flag && (
          <Page.LoadingP
            title={'哈哈'}
            loadList={[
              '_P_INDOOR_5',
              '_P_INDOOR_4',
              '_P_INDOOR_4copy',
              '_C_12_01',
              '_BGM_01',
              '_H_BG_0',
              '_H_BG_1',
              '_BGM_02',
              'CG_01',
              'CG_02',
              '_H_LOGO',
              '_H_TITLE',
            ]}
            tips={Object.values(tipsGroupRecord)}
          />
        )} */}
        <Pages />
        <Test />
      </div>
    </PageStateProvider>
  );
}
export default App;
