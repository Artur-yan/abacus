import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useMemo, useReducer, useState } from 'react';
const s = require('./TextMax.module.css');
const sd = require('../antdUseDark.module.css');

interface ITextMaxProps {
  style?: CSSProperties;
  className?: string;
  max?: number;
  onMore?: () => void;
  doMore?: boolean;
  doLess?: boolean;
}

const TextMax = React.memo((props: PropsWithChildren<ITextMaxProps>) => {
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [showMore, setShowMore] = useState(false);

  let style1 = useMemo(() => {
    let res = props.style ?? {};
    res = { ...res };
    return res;
  }, [props.style]);

  const text1 = useMemo(() => {
    let res = props.children;
    if (_.isString(res) || _.isNumber(res)) {
      let res1 = '' + res;
      let max1 = props.max ?? 20;
      if (res1.length > max1) {
        let skip = false;
        let onMore = () => {};

        if (props.doMore) {
          if (showMore) {
            if (props.doLess) {
              skip = true;
            }
            onMore = () => {
              setShowMore(false);
            };
          } else {
            onMore = () => {
              setShowMore(true);
            };
          }
        }

        res = (
          <span>
            {res1.slice(0, skip ? 99999 : max1)}
            {props.onMore == null && !props.doMore ? (
              '...'
            ) : (
              <span
                css={`
                  margin-left: 5px;
                `}
                onClick={(e) => {
                  if (props.doMore) {
                    onMore();
                  }
                  props.onMore?.();
                }}
                className={sd.linkBlue}
              >
                {props.doLess && showMore ? 'less' : 'more'}...
              </span>
            )}
          </span>
        );
      }
    }
    return res;
  }, [props.children, showMore, props.doLess]);

  return (
    <span style={style1} className={props.className ?? ''}>
      {text1}
    </span>
  );
});

export default TextMax;
