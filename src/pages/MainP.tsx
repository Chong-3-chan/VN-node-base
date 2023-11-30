import type { FC } from 'react';
import './MainP.less';
import { usePageState } from '../pageState';
export const MainP: FC = (props) => {
  const { pageState, pageAction, PageStateProvider } = usePageState();
  console.log({ pageState, pageAction, PageStateProvider });
  return (
    <div id="MainP">
      <h1>MainP</h1>
    </div>
  );
};
export default MainP;
