import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import WindowResizeListener from '../WindowResizeListener/WindowResizeListener';
const s = require('./WindowSizeSmart.module.css');
const sd = require('../antdUseDark.module.css');

interface IWindowSizeSmartProps {
  onChange?: (isMedium: boolean, isSmall: boolean, isLarge: boolean) => void;
  onChangeSize?: (width: number) => void;
  onChangeSizeBoth?: (width: number, height: number) => void;
}

const WindowSizeSmart = React.memo((props: PropsWithChildren<IWindowSizeSmartProps>) => {
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const refFirstWW = useRef(null);
  const refFirstHH = useRef(null);
  const firstState: { dimensions?: { width?; height? } } = useMemo(() => {
    let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    refFirstWW.current = windowWidth;
    refFirstHH.current = windowHeight;
    return { dimensions: { width: windowWidth, height: windowHeight } };
  }, []);

  const [lastSize, setLastSize] = useState(firstState);
  const [isLarge, setIsLarge] = useState(refFirstWW.current == null ? false : refFirstWW.current < Constants.flags.largeScreenWW);
  const [isMedium, setIsMedium] = useState(refFirstWW.current == null ? false : refFirstWW.current < Constants.flags.mediumScreenWW);
  const [isSmall, setIsSmall] = useState(refFirstWW.current == null ? false : refFirstWW.current < Constants.flags.smallScreenWW);

  const refIsM = useRef(false);
  useEffect(() => {
    refIsM.current = true;
    props.onChange?.(isMedium, isSmall, isLarge);
    props.onChangeSize?.(refFirstWW.current);
    props.onChangeSizeBoth?.(refFirstWW.current, refFirstHH.current);

    const navLeftCollapsed = REActions.navLeftCollapsed.listen(navLeftCollapsedChanged);

    return () => {
      refIsM.current = false;
      navLeftCollapsed();
    };
  }, []);

  const onResize = (windowSize) => {
    if (!refIsM.current) {
      return;
    }

    let hh = windowSize.windowHeight;
    let ww = windowSize.windowWidth;
    setLastSize({ dimensions: { width: ww, height: hh } });

    const isLarge1 = ww < Constants.flags.largeScreenWW;
    const isMedium1 = ww < Constants.flags.mediumScreenWW;
    const isSmall1 = ww < Constants.flags.smallScreenWW;

    let anyChange = false;
    if (isLarge1 !== isLarge) {
      setIsLarge(isLarge1);
      anyChange = true;
    }
    if (isMedium1 !== isMedium) {
      setIsMedium(isMedium1);
      anyChange = true;
    }
    if (isSmall1 !== isSmall) {
      setIsSmall(isSmall1);
      anyChange = true;
    }
    if (anyChange) {
      props.onChange?.(isMedium1, isSmall1, isLarge1);
    }

    props.onChangeSize?.(ww);
    props.onChangeSizeBoth?.(ww, hh);
  };

  const navLeftCollapsedChanged = () => {
    let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    onResize({ windowWidth, windowHeight });
  };

  return <WindowResizeListener onResize={onResize} />;
});

export default WindowSizeSmart;
