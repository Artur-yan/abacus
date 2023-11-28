import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useMemo, useReducer } from 'react';
const s = require('./MetricRange.module.css');
const sd = require('../antdUseDark.module.css');

interface IMetricRangeProps {
  value?: number;
  ranges?: object;
  nameSmall?: string;
  style?: CSSProperties;
  size?: number;
}

const MetricRange = React.memo((props: PropsWithChildren<IMetricRangeProps>) => {
  if (true) {
    return <span></span>;
  }

  // const { paramsProp, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  // }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const color = useMemo(() => {
    if (props.nameSmall && props.ranges && _.isNumber(props.value)) {
      const range1 = props.ranges?.[props.nameSmall];
      if (range1 && _.isObject(range1 as any)) {
        const green1 = range1.green;
        const red1 = range1.red;

        const greenColor = '#50a244';
        const redColor = '#a73f3f';
        const yellowColor = '#b09c4d';

        if (!range1.invert) {
          if (props.value <= green1) {
            return greenColor;
          } else if (props.value > red1) {
            return redColor;
          } else {
            return yellowColor;
          }
        } else {
          if (props.value >= green1) {
            return greenColor;
          } else if (props.value < red1) {
            return redColor;
          } else {
            return yellowColor;
          }
        }
      }
    }
  }, [props.value, props.ranges]);

  return (
    <span style={props.style ?? {}}>
      {color == null ? null : <span style={{ verticalAlign: 'middle', display: 'inline-block', width: (props.size ?? 16) + 'px', height: (props.size ?? 16) + 'px', borderRadius: '50%', backgroundColor: color }}></span>}
    </span>
  );
});

export default MetricRange;
