import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import Utils from '../../../core/Utils';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./NumberPretty.module.css');
const sd = require('../antdUseDark.module.css');

interface INumberPrettyProps {
  min?: number;
}

const NumberPretty = React.memo((props: PropsWithChildren<INumberPrettyProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const num = useMemo(() => {
    if (props.children != null && _.isNumber(props.children)) {
      return props.children;
    } else {
      return null;
    }
  }, [props.children]);

  const content = useMemo(() => {
    if (num == null) {
      return null;
    } else if (num < (props.min ?? 10000)) {
      return Utils.decimals(num, 0, true);
    } else {
      return Utils.prettyPrintNumber(num, 0);
    }
  }, [num]);

  const tooltipString = useMemo(() => {
    if (num == null) {
      return null;
    } else if (num < (props.min ?? 10000)) {
      return null;
    } else {
      return Utils.decimals(num, 0, true);
    }
  }, [num]);

  if (tooltipString != null && content != null) {
    return <TooltipExt title={tooltipString}>{content}</TooltipExt>;
  } else if (content != null) {
    return content;
  } else {
    return props.children;
  }
});

export default NumberPretty;
