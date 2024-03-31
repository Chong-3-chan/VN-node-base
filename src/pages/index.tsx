import { FC } from 'react';
import HomeP from './HomeP';
import LoadingP from './LoadingP';
import './index.less';
import { ActivePage, usePageState } from '../pageState';
import { MainP } from './MainP';
import { InfoP } from './InfoP';

export const Pages: FC = () => {
  const { pageState } = usePageState();
  const getPage = () => {
    switch (pageState.activePage) {
      case 'HomeP':
        return <HomeP />;
      case 'MainP':
        return <MainP />;
      case 'InfoP':
        return <InfoP />;
      case null:
        return <></>;
    }
  };
  return (
    <>
      {getPage()}
      {pageState.LoadingPProps && <LoadingP {...pageState.LoadingPProps!} />}
    </>
  );
};
