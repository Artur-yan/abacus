import * as React from 'react';
import { PropsWithChildren, useReducer } from 'react';
const s = require('./NullShow.module.css');
const sd = require('../antdUseDark.module.css');

interface INullShowProps {
  value?: any;
  alsoUndefined?: boolean;
}

const NullShow = React.memo((props: PropsWithChildren<INullShowProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  if (props.value === null || (props.alsoUndefined && props.value == null)) {
    return (
      <span
        css={`
          padding: 2px 7px 3px;
          border-radius: 3px;
          font-size: 12px;
          border: 1px solid #c95f16;
          background: rgba(201, 95, 22, 0.4);
          color: #c95f16;
        `}
      >
        Null
      </span>
    );
  } else {
    return props.value;
  }
});

export default NullShow;
