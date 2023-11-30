import type { FC } from 'react';
import './HomeP.less';
import { ActivePageEnum, usePageState } from '../pageState';
export const HomeP: FC = (props) => {
  const { pageState, pageAction, PageStateProvider } = usePageState();
  console.log({ pageState, pageAction, PageStateProvider });
  return (
    <div id="HomeP">
      <h1 onClick={()=>{pageAction.setActivePage(ActivePageEnum.MainP,0x01000000)}}>HomeP</h1>
    </div>
  );
};
export default HomeP;
