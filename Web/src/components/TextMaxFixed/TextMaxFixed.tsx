import classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useMemo, useState } from 'react';

const styles = require('./TextMaxFixed.module.css');
const stylesDark = require('../antdUseDark.module.css');

interface ITextMaxProps {
  style?: CSSProperties;
  className?: string;
  max?: number;
  onMore?: () => void;
  doMore?: boolean;
  doLess?: boolean;
}

const TextMax = React.memo((props: PropsWithChildren<ITextMaxProps>) => {
  const [showMore, setShowMore] = useState(false);

  const children = useMemo(() => {
    let children = props.children as any;
    if (!(_.isString(children) || _.isNumber(children))) return children;

    children = `${children}`;
    const max = props.max ?? 20;
    if (children.length <= max) return children;
    let skip = false;
    const onMore = () => {
      setShowMore(!showMore);
    };

    if (props.doMore && props.doLess && showMore) {
      skip = true;
    }

    const handleMoreClick = () => {
      if (props.doMore) {
        onMore();
      }
      props.onMore?.();
    };

    children = (
      <>
        {children.slice(0, skip ? 99999 : max)}
        {!props.onMore && !props.doMore ? (
          '...'
        ) : (
          <pre onClick={handleMoreClick} className={classNames(stylesDark.linkBlue, styles.labelStyles, styles.preStyles)}>
            {props.doLess && showMore ? 'less' : 'more'}...
          </pre>
        )}
      </>
    );
    return children;
  }, [props.children, showMore, props.doLess]);

  return (
    <pre style={props?.style} className={classNames(props.className, styles.preStyles)}>
      {children}
    </pre>
  );
});

export default TextMax;
