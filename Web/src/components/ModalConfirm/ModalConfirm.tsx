import { NativeButtonProps } from 'antd/lib/button/button';
import { ModalFuncProps } from 'antd/lib/modal';
import confirm from 'antd/lib/modal/confirm';
import _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import { CSSProp } from 'styled-components';
const s = require('./ModalConfirm.module.css');
const sd = require('../antdUseDark.module.css');

interface IModalConfirmProps {
  onClick?: (e: Event) => any;
  onConfirm?: (e: Event) => void;
  onConfirmPromise?: (e: Event) => Promise<boolean>;
  onCancel?: (e: Event) => void;
  onShow?: () => void;
  title?: any;
  icon?: any;
  okText?: string;
  cancelText?: string;
  okType?: string;
  maskClosable?: boolean;
  width?: any;
  bodyStyle?: CSSProp;
}

interface IModalConfirmState {}

class ModalConfirm extends React.PureComponent<PropsWithChildren<IModalConfirmProps>, IModalConfirmState> {
  private confirmUsed: { destroy: (...args: any[]) => void; update: (newConfig: ModalFuncProps) => void };

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.doClose();
  }

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

  doConfirm = () => {
    this.props.onShow?.();

    let calcButtonProps: (type1?: string, isHidden?: boolean, isOk?: boolean) => NativeButtonProps = (type1?, isHidden?, isOk?: boolean) => {
      let res: NativeButtonProps = {};

      res.style = res.style ?? {};

      res.type = 'primary';
      res.style.borderRadius = '3px';
      res.style.border = 'none';
      res.style.paddingLeft = '20px';
      res.style.paddingRight = '20px';

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

    let config: ModalFuncProps = {
      title: this.props.title,
      okText: this.props.okText,
      cancelText: this.props.cancelText,
      icon: this.props.icon,
      maskClosable: this.props.maskClosable !== false,
      width: this.props.width,
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

      okButtonProps: calcButtonProps(this.props.okType, this.props.okText == null, true),
      cancelButtonProps: calcButtonProps(undefined, this.props.cancelText == null),
    };

    if (this.props.okType) {
      // @ts-ignore
      config.okType = this.props.okType;
    }

    this.doClose();
    this.confirmUsed = confirm(config);
  };

  doClose = () => {
    if (this.confirmUsed) {
      this.confirmUsed.destroy();
      this.confirmUsed = null;
    }
  };

  render() {
    return (
      <span onMouseDown={this.onMouseDown} onClick={this.onClick}>
        {this.props.children}
      </span>
    );
  }
}

export default ModalConfirm;
