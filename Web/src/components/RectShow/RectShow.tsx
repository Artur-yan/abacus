import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useState } from 'react';
const s = require('./RectShow.module.css');
const sd = require('../antdUseDark.module.css');
const color = require('color');

interface IRectShowProps {
  color?: string;
  doHover?: boolean;
}

const RectShow = React.memo((props: PropsWithChildren<IRectShowProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isHover, setIsHover] = useState(false);

  const backColor = useMemo(() => {
    if (props.color) {
      return color(props.color).alpha(0.4);
    }
  }, [props.color]);

  const backColorHover = useMemo(() => {
    if (props.color) {
      return color(props.color).alpha(0.23);
    }
  }, [props.color]);

  const onMouseEnter = (e) => {
    setIsHover(true);
  };

  const onMouseLeave = (e) => {
    setIsHover(false);
  };

  return (
    <span
      css={`
        padding: 2px 7px 3px;
        border-radius: 3px;
        font-size: 12px;
        white-space: nowrap;
        border: 1px solid ${props.color};
        background: ${backColor};
        color: ${props.color};
        ${props.doHover
          ? `
    &:hover {
      background: ${backColorHover};
    }
    `
          : ' '}
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {_.isFunction(props.children) ? props.children?.(isHover) : props.children}
    </span>
  );
});

export default RectShow;
