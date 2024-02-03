import type { FC } from 'react';
import './HomeP.less';
import { ActivePageEnum, usePageState } from '../pageState';
import { homeResource } from '../data/data';
import { getSrc } from '../data/getData';
export const HomeP: FC = (props) => {
  const { pageState, pageAction } = usePageState();
  return (
    <div id="HomeP">
      <h1
        onClick={() => {
          pageAction.setActivePage(ActivePageEnum.MainP, 0x00000000);
        }}
      >
        HomeP
      </h1>
      {/* <img src={getSrc(homeResource.backgroundImage)}></img> */}
    </div>
  );
};
export default HomeP;
