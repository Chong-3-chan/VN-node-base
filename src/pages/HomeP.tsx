import { useState, type FC, useEffect, useCallback, useReducer, useLayoutEffect } from 'react';
import './HomeP.less';
import { ActivePage, usePageState } from '../pageState';
import { homeResource } from '../data/data';
import { getSrc } from '../data/getData';
import { SaveP } from '../components/public/SaveP';
import { ContentP } from '../components/HomeP/ContentP';
import { getAutoSave, getOptions, updateGlobalSave } from '../data/globalSave';
import { QsaveloadThrottle, classNames } from '../public/handle';
import OptionsP from '../components/public/OptionsP';
import { Sound } from '../components/public/Sound';
export type HomePCoverPage = 'ContentP' | 'SaveP' | 'OptionsP' | null;

export const HomeP: FC = (props) => {
  const { pageState, pageAction } = usePageState();
  const [ready, setReady] = useState(false);
  const [coverPage, setCoverPage] = useState<HomePCoverPage>(null);
  const autoSave = getAutoSave();
  const options = getOptions();
  const [, refresh] = useReducer((e) => e + 1, 0);
  useLayoutEffect(() => {
    pageState.initDone && setReady(true);
  }, [pageState.initDone]);
  const handleLoadSave = useCallback((ID: number) => {
    pageAction.loadSave(ID, { handleClose: () => setCoverPage(null) });
  }, []);
  return (
    <div id="HomeP" className={classNames(!ready ? 'ready' : '')}>
      <div className="background">{pageState.initDone && <img draggable={false} src={getSrc(homeResource.backgroundImage)} />}</div>
      <div className="title">{pageState.initDone && <img draggable={false} src={getSrc(homeResource.elements.title.fileKey)} />}</div>
      <div className="menu">
        <div className="menu-item" onClick={() => setCoverPage('ContentP')}>
          {/*  pageAction.setActivePage('MainP', 0x00000000)}> */}
          {'新的开始'}
        </div>
        {autoSave && (
          <div className="menu-item" onClick={() => pageAction.setSentenceID(autoSave.sentenceID)}>
            {'继续'}
          </div>
        )}
        {autoSave && (
          <div
            className="menu-item"
            onClick={() =>
              QsaveloadThrottle(() =>
                pageAction.loadSave(0, { force: true }).catch((error) => {
                  pageAction.callMessage({
                    text: '未找到Q.save记录！',
                    title: '提示',
                  });
                })
              )
            }
          >
            {'Q.load'}
          </div>
        )}
        <div className="menu-item" onClick={() => setCoverPage('SaveP')}>
          {'读档'}
        </div>
        <div className="menu-item" onClick={() => pageAction.setActivePage('InfoP')}>
          {'档案'}
        </div>
        <div className="menu-item" onClick={() => setCoverPage('OptionsP')}>
          {'系统设置'}
        </div>
        <div className="menu-item" onClick={() => window.close()}>
          {'退出游戏'}
        </div>
      </div>
      <div className="logo">{pageState.initDone && <img draggable={false} src={getSrc(homeResource.elements.logo.fileKey)} />}</div>

      <SaveP {...{ coverPage, setCoverPage, handleLoadSave }} />
      <OptionsP {...{ coverPage, setCoverPage, refresh }} />
      <ContentP {...{ coverPage, setCoverPage }} />
      {pageState.initDone && (
        <Sound display={false} sound={homeResource.BGM} volume={options.volume_all * options.volume_BGM} fade={true} loop={true} />
      )}
    </div>
  );
};
export default HomeP;
