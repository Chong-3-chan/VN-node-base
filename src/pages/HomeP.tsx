import type { FC } from 'react';
import './HomeP.less';
import { ActivePageEnum, usePageState } from '../pageState';
export const HomeP: FC = (props) => {
  const { pageState, pageAction, PageStateProvider } = usePageState();
  return (
    <div id="HomeP">
      <h1 onClick={()=>{pageAction.setActivePage(ActivePageEnum.MainP,0x00000000)}}>HomeP</h1>
    </div>
  );
};
export default HomeP;
