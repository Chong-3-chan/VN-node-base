import { FC } from 'react';
import HomeP from './HomeP';
import LoadingP from './LoadingP';
import './index.less';
import { ActivePageEnum, usePageState } from '../pageState';
import { MainP } from './MainP';

export const Pages: FC = () => {
  const { pageState, pageAction } = usePageState();
  const getPage = () => {
    switch (pageState.activePage) {
      case ActivePageEnum.HomeP:
        return <HomeP />;
      case ActivePageEnum.MainP:
        return <MainP />;
      case null:
        return <></>;
    }
  };
  return (
    <>
      {getPage()}
      {pageState.LoadingPProps && (
        <LoadingP
          {...pageState.LoadingPProps!}
        />
      )}
    </>
  );
};

export default {
  HomeP,
  LoadingP,
};
