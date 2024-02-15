import type { FC } from 'react';
import './HomeP.less';
import { ActivePageEnum, usePageState } from '../pageState';
import { homeResource } from '../data/data';
import { getSrc } from '../data/getData';
export const HomeP: FC = (props) => {
  const { pageState, pageAction } = usePageState();
  return (
    <div id="HomeP">
      <div onClick={() => pageAction.setActivePage(ActivePageEnum.MainP, 0x00000000)}>{'新的开始'}</div>
      {pageState.initDone && <img src={getSrc(homeResource.backgroundImage)} />}
    </div>
  );
};
export default HomeP;
