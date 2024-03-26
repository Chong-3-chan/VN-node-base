import { useMemo, useState } from 'react';
import { homeResource, infoRecord } from '../data/data';
import { classNames } from '../public/handle';
import { getSrc } from '../data/getData';
import './InfoP.less';
import { ActivePage, usePageState } from '../pageState';

export function InfoP() {
  //   const { pageAction: action, pageState } = useContent(pageContext);
  const { pageAction } = usePageState();
  const [selected, setSelected] = useState<string | null>(null);
  const visitableInfo = useMemo(
    () =>
      Object.values(infoRecord)
        .filter((e) => e.checker.check())
        .sort(({ order: orderA }, { order: orderB }) => orderA - orderB),
    []
  );
  const selectedInfo = visitableInfo.find((e) => e.key === selected);
  // useEffect(() => {

  // }, [])
  return (
    <div className="InfoP">
      <div className="background">
        <img draggable={false} src={getSrc(homeResource.backgroundImage)} />
      </div>
      <div className="info-selector">
        {visitableInfo.map(({ title, key }) => (
          <div className={classNames('info-selector-item', selected === key ? 'selected' : void 0)} key={key} onClick={() => setSelected(key)}>
            {title}
          </div>
        ))}
      </div>
      <div className="info-read">
        {selectedInfo && (
          <>
            <div className="title">{selectedInfo.title}</div>
            {selected &&
              selectedInfo.data.map((info, i) => {
                const type = info[0];
                switch (type) {
                  case 'pic':
                    return (
                      <div className="pic" key={i}>
                        <img src={getSrc(info[1])!}></img>
                      </div>
                    );
                  case 'text':
                    return (
                      <div className="text" key={i}>
                        {info[1].split('\n').map((l, j) => (
                          <p key={j}>{l}</p>
                        ))}
                      </div>
                    );
                }
              })}
          </>
        )}
      </div>
      {/* <div className="fixed-buttons-bar">
        <div className="home" onClick={() => action.setActivePage('home')}></div>
      </div> */}
      <div className="header-btns-bar">
        <div className="close" onClick={() => pageAction.setActivePage('HomeP')}></div>
      </div>
    </div>
  );
}
