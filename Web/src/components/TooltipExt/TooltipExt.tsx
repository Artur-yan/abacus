import Tooltip, { TooltipProps } from 'antd/lib/tooltip';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, ReactElement, useRef, useState } from 'react';
const s = require('./TooltipExt.module.css');
const sd = require('../antdUseDark.module.css');

interface ITooltipExtProps {
  isModal?: boolean;
  isValueTrunacted?: boolean;
}

const TooltipExt = React.memo((props: PropsWithChildren<ITooltipExtProps & TooltipProps>) => {
  const [isVisible, setIsVisible] = useState(false);

  let cc = props.children;
  const tooltipRef = useRef(null);

  const onMouseDown = (e) => {
    setIsVisible(false);
  };

  // noinspection HtmlUnknownAttribute
  cc = <span onMouseDownCapture={onMouseDown}>{cc}</span>;

  let { overlayStyle, getPopupContainer, ...pp } = props;
  let popupContainerForMenu = getPopupContainer;
  if (popupContainerForMenu == null) {
    popupContainerForMenu = (node) => document.getElementById('body2');
  }
  if (overlayStyle == null) {
    overlayStyle = {};
  }
  if (props.isModal) {
    let actualZIndex = (overlayStyle as CSSProperties).zIndex;
    if (!_.isNumber(actualZIndex)) {
      actualZIndex = null;
    }
    (overlayStyle as CSSProperties).zIndex = Math.max((actualZIndex as number) ?? 0, 3100);
  }

  let t1 = pp.title;
  if (t1 != null) {
    t1 = (
      <span
        css={`
          & .noTooltip {
            display: none !important;
            pointer-events: none !important;
          }
        `}
      >
        {t1 as any}
      </span>
    );
    pp.title = t1;
  }

  const onVisibleChange = (v1) => {
    setIsVisible(v1);
    setTimeout(() => {
      if (props.isValueTrunacted && tooltipRef?.current) {
        const copyTextSpan = tooltipRef.current?.popupRef?.current?.getElement?.()?.querySelector?.('.copyTextWrapper');
        if (copyTextSpan?.style) {
          copyTextSpan.style.whiteSpace = 'unset';
          copyTextSpan.style.width = 'fit-content';
          copyTextSpan.style.overflow = 'unset';
        }
      }
    }, 0);
  };

  return (
    <Tooltip open={isVisible} onOpenChange={onVisibleChange} {...pp} getPopupContainer={popupContainerForMenu} overlayStyle={overlayStyle} className="toolip-visible" ref={tooltipRef}>
      {cc as ReactElement}
    </Tooltip>
  );
});

export default TooltipExt;
