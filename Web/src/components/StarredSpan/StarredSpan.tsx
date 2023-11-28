import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useState } from 'react';
import Utils from '../../../core/Utils';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./StarredSpan.module.css');
const sd = require('../antdUseDark.module.css');

interface IStarredSpanProps {
  onClick?: (value, e?) => void;
  isStarred?: boolean;
  size?: number;
  x?: number;
  y?: number;
  noNamePrefix?: string[];
  name?: string;
  noTooltip?: boolean;
  isSummary?: boolean;
}

const StarredSpan = React.memo((props: PropsWithChildren<IStarredSpanProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isHover, setIsHover] = useState(false);

  const star = useMemo(() => {
    let color = null;
    let icon1: IconProp = null;
    let swapOpacity = false;

    if (props.isStarred) {
      icon1 = ['fas', 'star'];
      color = '#F7B834';
    } else {
      icon1 = ['fal', 'star'];
      color = '#F7B834';

      if (isHover) {
        swapOpacity = true;
        icon1 = ['fad', 'star'];
      }
    }

    if (props.isSummary) {
      if (icon1 != null && icon1?.[1] != null) {
        icon1[1] = 'clipboard-list-check';
      }
    }

    let style1: any = {};
    if (swapOpacity) {
      style1['--fa-primary-opacity'] = 0.83;
    }

    let res = <FontAwesomeIcon color={color} icon={icon1} transform={{ size: props.size ?? 20, x: props.x ?? 0, y: props.y ?? 0 }} style={{ opacity: 0.8 }} />;

    let t1 = props.isStarred ? 'Un-Star' : 'Star';
    if (props.noNamePrefix != null && props.noNamePrefix?.length >= 2) {
      t1 = props.isStarred ? props.noNamePrefix?.[0] : props.noNamePrefix?.[1];
      t1 ??= '';
    }
    if (!Utils.isNullOrEmpty(props.name) && !Utils.isNullOrEmpty(t1)) {
      t1 += ' this ' + props.name;
    }
    if (!props.noTooltip) {
      res = <TooltipExt title={t1}>{res}</TooltipExt>;
    }

    return res;
  }, [props.isStarred, isHover, props.size, props.x, props.y, props.name, props.noTooltip, props.isSummary, props.noNamePrefix]);

  const onMouseEnter = (e) => {
    setIsHover(true);
  };

  const onMouseLeave = (e) => {
    setIsHover(false);
  };

  const onMouseMove = (e) => {
    setIsHover(true);
  };

  const onClick1 = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    e?.nativeEvent?.stopPropagation?.();
    e?.nativeEvent?.preventDefault?.();

    props.onClick?.(!props.isStarred, e);
  };

  return (
    <span
      css={`
        cursor: pointer;
      `}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick1}
    >
      {star}
    </span>
  );
});

export default StarredSpan;
