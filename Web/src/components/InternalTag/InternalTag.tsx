import React, { PropsWithChildren, ComponentPropsWithoutRef } from 'react';
import classNames from 'classnames';

import styles from './InternalTag.module.css';

interface ComponentProps extends ComponentPropsWithoutRef<'span'> {}

const defaultText = 'Internal';

const InternalTag = React.memo(({ children, className, ...rest }: PropsWithChildren<ComponentProps>) => {
  return (
    <span className={classNames(styles.internalTag, className)} {...rest}>
      {children || defaultText}
    </span>
  );
});

export default InternalTag;
