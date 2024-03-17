import { useState, type FC, useEffect, useCallback } from 'react';
import './HomeP.less';
import { ActivePageEnum, usePageState } from '../pageState';
import { homeResource } from '../data/data';
import { getSrc } from '../data/getData';
import { SaveP } from '../components/public/SaveP';
import { ContentP } from '../components/HomeP/ContentP';
import { getAutoSave, updateGlobalSave } from '../data/globalSave';
export type HomePCoverPage = 'ContentP' | 'SaveP' | 'OptionP' | null;
export const HomeP: FC = (props) => {
  const { pageState, pageAction } = usePageState();
  const [ready, setReady] = useState(false);
  const [coverPage, setCoverPage] = useState<HomePCoverPage>(null);
  useEffect(() => {
    pageState.initDone && setReady(true);
  }, [pageState.initDone]);
  const handleLoadSave = useCallback((ID: number) => {
    pageAction.loadSave(ID, { handleClose: () => setCoverPage(null) });
  }, []);
  return (
    <div id="HomeP" className={!ready ? 'ready' : ''}>
      <div className="background">{pageState.initDone && <img src={getSrc(homeResource.backgroundImage)} />}</div>
      <div className="title">{pageState.initDone && <img src={getSrc(homeResource.elements.title.fileKey)} />}</div>
      <div className="menu">
        <div className="menu-item" onClick={() => setCoverPage('ContentP')}>
          {/*  pageAction.setActivePage(ActivePageEnum.MainP, 0x00000000)}> */}
          {'新的开始'}
        </div>
        <div className="menu-item" onClick={() => pageAction.setSentenceID(getAutoSave()!.sentenceID)}>
          {'继续'}
        </div>
        {/* <div className="menu-item" onClick={() => pageAction.loadSave(0, { force: true })}>
          {'快速读档'}
        </div> */}
        <div className="menu-item" onClick={() => setCoverPage('SaveP')}>
          {'读档'}
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

      <SaveP {...{ coverPage, setCoverPage, handleLoadSave }} />
      <ContentP {...{ coverPage, setCoverPage }} />
    </div>
  );
};
export default HomeP;
