import $ from 'jquery';
import * as React from 'react';
import { PropsWithChildren, useReducer, useRef, useState } from 'react';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./TooltipExtOver.module.css');
const sd = require('../antdUseDark.module.css');

interface ITooltipExtOverProps {
  isValueTrunacted?: boolean;
}

const TooltipExtOver = React.memo((props: PropsWithChildren<ITooltipExtOverProps>) => {
  const { isValueTrunacted, children } = props;
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const refRoot = useRef(null);
  const refElem = useRef(null);
  const [truncated, setTruncated] = useState(false);

  const onMouseEnter = (e) => {
    // let t1 = e.currentTarget;
    // let $this = $(t1);

    //if(t1.offsetWidth < t1.scrollWidth-2*4) {
    if ($(refElem.current).width() > $(refRoot.current).width()) {
      setTruncated(true);
    } else {
      setTruncated(false);
    }
  };

  React.useEffect(() => {
    if (isValueTrunacted && $(refElem.current).width() > $(refRoot.current).width()) {
      const copyTextSpan = refElem.current?.querySelector?.('.copyTextWrapper');
      if (copyTextSpan) {
        copyTextSpan.style.width = `${$(refRoot.current).width() - 30}px`;
      }
    }
  }, [refElem.current, refRoot.current, isValueTrunacted]);

  return (
    <div
      ref={refRoot}
      css={`
        display: flex;
        overflow-x: hidden;
      `}
    >
      <TooltipExt title={truncated ? children : undefined} isValueTrunacted={isValueTrunacted}>
        <div ref={refElem} onMouseEnter={onMouseEnter}>
          <>{children}</>
        </div>
      </TooltipExt>
    </div>
  );
});

export default TooltipExtOver;
