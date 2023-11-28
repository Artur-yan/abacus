import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
const s = require('./SeeMore.module.css');
const sd = require('../antdUseDark.module.css');

interface ISeeMoreProps {}

const SeeMore = React.memo((props: PropsWithChildren<ISeeMoreProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [show, setShow] = useState(false);

  return (
    <>
      {!show && (
        <span
          onClick={(e) => {
            setShow(true);
          }}
          className={sd.styleTextBlueBright}
          css={`
            cursor: pointer;
          `}
        >
          {'See More'}
        </span>
      )}
      {show && props.children}
    </>
  );
});

export default SeeMore;
