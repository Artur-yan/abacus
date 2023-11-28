import { LegacyButtonType, NativeButtonProps } from 'antd/lib/button/button';
import { ModalFuncProps } from 'antd/lib/modal';
import confirm from 'antd/lib/modal/confirm';
import _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import { CSSProp } from 'styled-components';
const s = require('./ModalContent.module.css');
const sd = require('../antdUseDark.module.css');

interface IModalContentProps {
  onClick?: (e: Event) => any;
  onConfirm?: (e: Event) => void;
  onConfirmPromise?: (e: Event) => Promise<boolean>;
  onCancel?: (e: Event) => void;
  onShow?: () => void;
  title?: any;
  icon?: any;
  okText?: string;
  okButtonProps?: NativeButtonProps;
  cancelButtonProps?: NativeButtonProps;
  cancelText?: string;
  okType?: LegacyButtonType;
  bodyStyle?: CSSProp;
  maskClosable?: boolean;
  width?: any;
  content?: React.ReactNode;
}

interface IModalContentState {
  config: ModalFuncProps;
}

class ModalContent extends React.PureComponent<PropsWithChildren<IModalContentProps>, IModalContentState> {
  private confirmUsed: { destroy: (...args: any[]) => void; update: (newConfig: ModalFuncProps) => void };

  constructor(props) {
    super(props);

    this.state = {
      config: {},
    };
  }

  calcButtonProps: (type1?: string, isHidden?: boolean, isOk?: boolean) => NativeButtonProps = (type1?, isHidden?, isOk?: boolean) => {
    let res: NativeButtonProps = {
      type: 'primary',
      style: {
        borderRadius: '3px',
        border: 'none',
        paddingLeft: '20px',
        paddingRight: '20px',
      },
    };

    let color1 = '#8a98ab';
    if (type1 === 'danger') {
      color1 = '#c4444d';
    } else if (type1 === 'primary') {
      color1 = isOk ? '#2e5bff' : null;
    }

    if (!isOk) {
      color1 = 'transparent';
      res.style = _.assign(res.style ?? {}, {
        border: '1px solid #8798ad',
      });
    }

    if (color1 != null) {
      res.style.backgroundColor = color1;
    }

    if (isHidden) {
      res.style.display = 'none';
    }

    return res;
  };

  doClose = () => {
    if (this.confirmUsed) {
      this.confirmUsed.destroy();
      this.confirmUsed = null;
    }
  };

  doConfirm = () => {
    this.props.onShow?.();
    this.doClose();
    this.confirmUsed = confirm(this.state.config);
  };

  onClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    let onClickRes = this.props.onClick?.(e);
    if (onClickRes === false) {
      return;
    }

    if (onClickRes != null && _.isFunction(onClickRes?.then)) {
      onClickRes.then((res) => {
        if (res !== false) {
          this.doConfirm();
        }
      });
      return;
    }

    this.doConfirm();
  };

  updateConfig() {
    const config: ModalFuncProps = {
      title: this.props.title,
      okText: this.props.okText,
      cancelText: this.props.cancelText,
      icon: this.props.icon,
      maskClosable: this.props.maskClosable !== false,
      width: this.props.width,
      content: this.props.content,
      okType: this.props.okType || 'primary',
      bodyStyle: this.props.bodyStyle,
      onOk: (args) => {
        // eslint-disable-next-line no-restricted-globals
        let e = event;
        if (this.props.onConfirmPromise != null) {
          return new Promise((resolve, reject) => {
            this.props.onConfirmPromise(e).then((isOk) => {
              if (isOk) {
                this.doClose();
                resolve(null);
              } else {
                reject(null);
              }
            });
          });
        }
        this.doClose();
        this.props.onConfirm && this.props.onConfirm?.(e);
      },
      onCancel: (args) => {
        // eslint-disable-next-line no-restricted-globals
        let e = event;

        this.doClose();
        this.props.onCancel && this.props.onCancel(e);
      },

      okButtonProps: {
        ...this.props?.okButtonProps,
        ...this.calcButtonProps(this.props.okType, this.props.okText == null, true),
      },
      cancelButtonProps: {
        ...this.props?.cancelButtonProps,
        ...this.calcButtonProps(undefined, this.props.cancelText == null),
      },
    };

    this.setState({ config }, () => this.confirmUsed?.update?.(this.state.config));
  }

  componentDidMount(): void {
    this.updateConfig();
  }

  componentDidUpdate(prevProps: Readonly<React.PropsWithChildren<IModalContentProps>>, prevState: Readonly<IModalContentState>, snapshot?: any): void {
    if (prevProps === this.props) return;
    this.updateConfig();
  }

  componentWillUnmount() {
    this.doClose();
  }

  render() {
    return (
      <span onMouseDown={this.onMouseDown} onClick={this.onClick}>
        {this.props.children}
      </span>
    );
  }
}

export default ModalContent;
