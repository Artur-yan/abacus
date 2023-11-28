import * as React from 'react';
import { PropsWithChildren, useReducer } from 'react';
const s = require('./NLPTextOne.module.css');
const sd = require('../antdUseDark.module.css');

interface INLPTextOneProps {}

const NLPTextOne = React.memo((props: PropsWithChildren<INLPTextOneProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  return <div>{props.children}</div>;
});

export default NLPTextOne;
