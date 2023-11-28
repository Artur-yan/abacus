import { NativeButtonProps } from 'antd/lib/button/button';
import { ModalFuncProps } from 'antd/lib/modal';
import confirm from 'antd/lib/modal/confirm';
import $ from 'jquery';
import * as React from 'react';
import * as uuid from 'uuid';
import Utils, { calcImgSrc } from '../../../core/Utils';
const s = require('./ModalProgress.module.css');
const sd = require('../antdUseDark.module.css');

interface IModalProgressProps {
  title?: string;
  subtitle?: string;
  disableKeyboard?: boolean;
  disableMask?: boolean;
  okText?: string;
  cancelText?: string;
  maxSecs?: number;
  hideSecs?: boolean;
}

interface IModalProgressState {
  actualSecs?: number;
  actualSecsString?: string;
  actualSecsUuid?: string;
}

const maxSecs = 5;

class ModalProgress extends React.PureComponent<IModalProgressProps, IModalProgressState> {
  private isM: boolean;
  private confirmUsed: { destroy: (...args: any[]) => void; update: (newConfig: ModalFuncProps) => void };
  private timerSecs: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
  }

  componentWillUnmount() {
    this.isM = false;
    this.doClose();
  }

  show = () => {
    let actualSecsUuid = uuid.v1();

    let calcButtonProps: (type1?: string, isHidden?: boolean) => NativeButtonProps = (type1?, isHidden?) => {
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
        color1 = null;
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
      title: null,
      content: (
        <div style={{ textAlign: 'center' }}>
          <div>
            <img src={calcImgSrc('/imgs/gearAnim2.gif')} style={{ width: '140px' }} alt={''} />
          </div>
          <div style={{ fontSize: '14px', margin: '5px 0 8px 0' }}>
            <b>{this.props.title ?? 'Dataset Processing'}</b>
          </div>
          <div>
            {this.props.subtitle ??
              'This process takes a few minutes. The system is inspecting the data formats, identifying the data types, mapping the columns to a system recognizable feature mapping, calculating meta data values, and doing tons of cool stuff to make your life easier. Please think of something calming while you wait.'}
          </div>
          {!this.props.hideSecs && <div id={actualSecsUuid} style={{ marginTop: '10px', fontSize: '13px', paddingTop: '6px', borderTop: '1px solid ' + Utils.colorAall(0.14, false) }}></div>}
        </div>
      ),
      okText: this.props.okText ?? 'Dismiss',
      cancelText: this.props.cancelText ?? '',
      icon: null,
      maskClosable: true,

      onOk: (args) => {
        // eslint-disable-next-line no-restricted-globals
        let e = event;

        this.doClose();
      },
      onCancel: (args) => {
        // eslint-disable-next-line no-restricted-globals
        let e = event;

        this.doClose();
      },

      okButtonProps: calcButtonProps('primary', this.props.okText === null),
      cancelButtonProps: calcButtonProps(undefined, this.props.cancelText == null),
    };

    if (this.props.disableMask) {
      config.maskClosable = false;
    }
    if (this.props.disableKeyboard) {
      config.keyboard = false;
    }

    config.okType = 'primary';

    let secs = this.props.maxSecs ?? maxSecs;
    setTimeout(() => {
      this.setState(
        {
          actualSecsUuid,
          actualSecs: secs,
          actualSecsString: this.calcStringSecs(secs),
        },
        () => {
          this.refreshActualSecsString();

          this.doClose();
          this.confirmUsed = confirm(config);
          setTimeout(() => {
            this.refreshActualSecsString();
          }, 0);
          setTimeout(() => {
            this.refreshActualSecsString();
          }, 200);

          this.doTimerSecs();
        },
      );
    }, 0);
  };

  refreshActualSecsString = () => {
    if (this.state.actualSecsUuid != null && !this.props.hideSecs) {
      $('#' + this.state.actualSecsUuid).text(this.state.actualSecsString);
    }
  };

  doTimerSecs = () => {
    if (this.props.hideSecs) {
      return;
    }

    if (this.timerSecs != null) {
      clearTimeout(this.timerSecs);
      this.timerSecs = null;
    }

    this.timerSecs = setTimeout(() => {
      this.timerSecs = null;

      let secs = this.state.actualSecs ?? 0;
      secs--;
      if (secs < 0) {
        secs = this.props.maxSecs ?? maxSecs;
      }

      this.setState(
        {
          actualSecs: secs,
          actualSecsString: this.calcStringSecs(secs),
        },
        () => {
          this.refreshActualSecsString();
          this.doTimerSecs();
        },
      );
    }, 1000);
  };

  calcStringSecs = (secs = null) => {
    if (secs == null) {
      secs = this.state.actualSecs;
    }
    if (secs == null || secs <= 0) {
      return 'Updating...';
    } else {
      return 'Update in ' + secs + ' seconds...';
    }
  };

  doClose = () => {
    if (this.confirmUsed) {
      this.confirmUsed.destroy();
      this.confirmUsed = null;
    }

    if (this.timerSecs != null) {
      clearTimeout(this.timerSecs);
      this.timerSecs = null;
    }
  };

  hide = () => {
    this.doClose();
  };

  isVisible = () => {
    return this.confirmUsed != null;
  };

  render() {
    return null;
  }
}

export default ModalProgress;
