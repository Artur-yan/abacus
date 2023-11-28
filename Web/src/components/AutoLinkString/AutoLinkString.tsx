import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import UtilsWeb from '../../../core/UtilsWeb';
const s = require('./AutoLinkString.module.css');
const sd = require('../antdUseDark.module.css');

interface IAutoLinkStringProps {
  newWindow?: boolean;
  noApp?: boolean;
}

const AutoLinkString = React.memo((props: PropsWithChildren<IAutoLinkStringProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const content: any = useMemo(() => {
    let s1 = props.children;
    if (!_.isString(s1)) {
      return s1;
    } else {
      return UtilsWeb.addLinksSpansSmartLinkString(s1, props.newWindow, props.noApp);
    }
  }, [props.children, props.newWindow, props.noApp]);

  return content;
});

export default AutoLinkString;
