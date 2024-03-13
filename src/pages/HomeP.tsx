import { useState, type FC, useEffect } from 'react';
import './HomeP.less';
import { ActivePageEnum, usePageState } from '../pageState';
import { homeResource } from '../data/data';
import { getSrc } from '../data/getData';
export const HomeP: FC = (props) => {
  const { pageState, pageAction } = usePageState();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    pageState.initDone && setReady(true);
  }, [pageState.initDone]);
  return (
    <div id="HomeP" className={!ready ? 'ready' : ''}>
      <div className="background">{pageState.initDone && <img src={getSrc(homeResource.backgroundImage)} />}</div>
      <div className="title">{pageState.initDone && <img src={getSrc(homeResource.elements.title.fileKey)} />}</div>
      <div className="menu">
        <div className="menu-item" onClick={() => pageAction.setActivePage(ActivePageEnum.MainP, 0x00000000)}>
          {'新的开始'}
        </div>
        <div className="menu-item" onClick={() => {}}>
          {'继续（施工）'}
        </div>
        <div className="menu-item" onClick={() => {}}>
          {'读取存档（施工）'}
        </div>
        <div className="menu-item" onClick={() => {}}>
          {'档案（施工）'}
        </div>
        <div className="menu-item" onClick={() => {}}>
          {'系统设置（施工）'}
        </div>
        <div className="menu-item" onClick={() => window.close()}>
          {'退出游戏'}
        </div>
      </div>
      <div className="logo">{pageState.initDone && <img src={getSrc(homeResource.elements.logo.fileKey)} />}</div>
    </div>
  );
};
export default HomeP;
