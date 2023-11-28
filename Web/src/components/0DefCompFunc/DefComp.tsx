import * as React from 'react';
import { PropsWithChildren, useReducer } from 'react';
import { useSelector } from 'react-redux';
const s = require('./DefComp.module.css');
const sd = require('../antdUseDark.module.css');

interface IDefCompProps {}

const DefComp = React.memo((props: PropsWithChildren<IDefCompProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  return <div>{props.children}</div>;
});

export default DefComp;
