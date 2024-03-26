import React, { useState, useEffect, useContext, useMemo, useRef, FC, useCallback, useReducer } from 'react';
import './OptionsP.less';
import { optionsGroups } from '../../data/options';
import { getOptions, updateGlobalSave } from '../../data/globalSave';
import { classNames } from '../../public/handle';
import { MainPCoverPage } from '../../pages/MainP';
import { HomePCoverPage } from '../../pages/HomeP';
const sc = (() => {
  let timeout: number | null = null;
  return (fn: () => any) => {
    if (timeout) cancelAnimationFrame(timeout);
    timeout = requestAnimationFrame(() => {
      fn();
      timeout = null;
    });
  };
})();
// 改成requestAnimationframe
type SavePProps = {
  coverPage: MainPCoverPage | HomePCoverPage;
  setCoverPage: React.Dispatch<React.SetStateAction<MainPCoverPage>> | React.Dispatch<React.SetStateAction<HomePCoverPage>>;
  // setMode?: React.Dispatch<React.SetStateAction<MainPMode>>;
  refresh: () => void;
};
const OptionsP: FC<SavePProps> = ({ coverPage, setCoverPage, refresh }) => {
  const options = getOptions();
  const display = coverPage === 'OptionsP';
  const [nowGroup, setNowGroup] = useState(0);
  const ref = useRef<HTMLDivElement>(null!);
  //   const [displayState, setDisplayState] = useState('in');
  //   useEffect(() => {
  //     displayState == 'in' && setTimeout(() => setDisplayState('default'), 200);
  //     displayState == 'out' && (closing = setTimeout(() => (action.setCoverPage(null), clearTimeout(closing)), 200));
  //   }, [displayState]);
  //   useEffect(() => {
  //     return () => action.updateOptions({}, true);
  //   }, []);
  // useEffect(() => {
  //   if (display) {
  //     setMode?.('default');
  //   }
  // }, [display]);
  const handleClose = useCallback(() => {
    setCoverPage(null);
  }, []);
  return (
    <div className={classNames('OptionsP', display ? void 0 : 'hide')}>
      <div className="title">{'设置'}</div>
      <div className="menu">
        {optionsGroups.map((v, i) => {
          return (
            <a key={i} onClick={() => ref.current.getElementsByClassName('group')[i].scrollIntoView()}>
              <div className={classNames('group', nowGroup === i ? 'active' : void 0)}>{v.ch}</div>
            </a>
          );
        })}
      </div>
      <div
        className="options-list"
        ref={ref}
        onScroll={(e: any) => {
          const currentTarget = e.currentTarget;
          sc(() => {
            const parentPositionY = e.target.getBoundingClientRect().top;
            const parentHeight = e.target.offsetHeight;
            const children = Array.from(currentTarget.childNodes)
              .filter((e: any) => e.className === 'group')
              .map((e: any) => {
                const childPositionY = e.getBoundingClientRect().top - parentPositionY;
                return { id: e.id, position: [childPositionY, childPositionY + e.offsetHeight] };
              });
            const line =
              parentHeight * (children[0].position[0] / (children[0].position[0] - children[children.length - 1].position[1] + parentHeight)) ??
              parentHeight / 2;
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const newGroup = children.findIndex(({ position: [top, bottom] }) => top - 0.25 * rem <= line && bottom + 0.25 * rem >= line);
            // if (!newGroup) debugger;
            newGroup !== nowGroup && setNowGroup(newGroup);
          });
        }}
      >
        {optionsGroups.map((v, i) => {
          return (
            <div className={`group`} key={i}>
              <div className={`group-ch`}>{v.ch}</div>
              {Object.entries(v.group).map(([_key, props]) => {
                let input = <></>;
                const key = _key as keyof typeof options;
                const { ch, icon, type } = props;
                if (type === 'range') {
                  const { min, max, step } = props;
                  input = (
                    <input
                      type={type}
                      min={min}
                      max={max}
                      step={step ?? (max! - min!) / 10}
                      defaultValue={options[key]}
                      onChange={(e) => {
                        const newOption: Partial<typeof options> = {};
                        options[key] = newOption[key] = Number(e.target.value);
                        updateGlobalSave('options', newOption);
                        refresh();
                      }}
                    ></input>
                  );
                } else {
                  // 其他type...
                }
                return (
                  <div className={`option-item`} key={key}>
                    <div className="ch">{ch}</div>
                    {icon && <div className={classNames('icon', icon)}></div>}
                    {input}
                    {<div className="value">{options[key]}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="header-btns-bar">
        <div className="close" onClick={handleClose}></div>
      </div>
    </div>
  );
};

export default OptionsP;
