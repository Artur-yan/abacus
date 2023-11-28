import * as React from 'react';
import { PropsWithChildren } from 'react';
import { Button as AntdButton, ButtonProps as AntdButtonProps } from 'antd';
import styles from './Button.module.css';
import { CustomButtonType } from './types';
import classNames from 'classnames';

interface ButtonProps extends AntdButtonProps {
  customType?: CustomButtonType;
}

const customTypeClasses = {
  internal: styles.internal,
};

export const Button = React.memo(
  React.forwardRef(({ className, customType, ...rest }: PropsWithChildren<ButtonProps>, ref: React.ForwardedRef<HTMLElement>) => {
    return <AntdButton ref={ref} className={classNames(className, styles.baseButton, customTypeClasses[customType])} {...rest} />;
  }),
);
