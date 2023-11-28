import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren } from 'react';
import Utils, { calcImgSrc } from '../../../core/Utils';
import DropdownExt from '../DropdownExt/DropdownExt';
const s = require('./RefreshAndProgress.module.css');
const sd = require('../antdUseDark.module.css');

export interface IRefreshAndProgressProgress {
  actual?: number;
  total?: number;
  label?: string;
  hidden?: boolean;
}

interface IRefreshAndProgressProps {
  isRefreshing?: boolean;

  msgHideContent?: boolean;
  errorMsg?: string | any;
  className?: string;
  onClickErrorButton?: (event: any) => void;
  errorButtonProcess?: (button: any) => any;
  errorButtonText?: string;
  isErrorAnimRefresh?: boolean;

  msgMsg?: string;
  onClickMsgButton?: (event: any) => void;
  onClick?: (event: any) => void;
  msgButtonText?: string;
  isMsgAnimRefresh?: boolean;
  refreshingPaddingTop?: number;
  refreshingPaddingBottom?: number;
  msgTop?: any;

  isDim?: boolean;
  hideCircularImage?: boolean;
  showTitle?: boolean;
  style?: CSSProperties;
  isRelative?: boolean;
  progress?: IRefreshAndProgressProgress;
  msgMenu?: Menu;
  msgMenuPosition?: 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';
  hideLinearProgress?: boolean;
}

interface IRefreshAndProgressState {}

class RefreshAndProgress extends React.PureComponent<PropsWithChildren<IRefreshAndProgressProps>, IRefreshAndProgressState> {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onClickMsgButton = (e) => {
    let { onClickMsgButton } = this.props;
    onClickMsgButton && onClickMsgButton(e);
  };

  onClickErrorButton = (e) => {
    let { onClickErrorButton } = this.props;
    onClickErrorButton && onClickErrorButton(e);
  };

  render() {
    let { isMsgAnimRefresh, isErrorAnimRefresh, hideLinearProgress } = this.props;

    let isError = false,
      isMsg = false;
    let errorMsg = this.props.errorMsg;
    let msgMsg = this.props.msgMsg;
    if (!this.props.isRefreshing && !Utils.isNullOrEmpty(errorMsg)) {
      isError = true;
    }
    if (!this.props.isRefreshing && !Utils.isNullOrEmpty(msgMsg) && !isError) {
      isMsg = true;
    }
    if (!this.props.isRefreshing && this.props.msgMenu != null && !isError) {
      isMsg = true;
    }
    let isRefreshing = !!this.props.isRefreshing;

    let styleBase: CSSProperties = { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 0 };
    if (this.props.isRelative) {
      styleBase = { position: 'relative' };
    }

    let progressElem = null;
    if (isRefreshing) {
      if (this.props.progress && !this.props.progress.hidden) {
        let perc = 0;
        if (this.props.progress.total != null && this.props.progress.total > 0) {
          perc = Math.trunc(((this.props.progress.actual || 0) / (this.props.progress.total || 1)) * 100);
        }
        const showBar = this.props.progress.actual != null || this.props.progress.total != null;
        progressElem = (
          <div>
            <div style={{ color: Utils.colorA(0.8), textAlign: 'center', marginBottom: '7px', fontWeight: 500 }}>{this.props.progress.label || 'Progress...'}</div>
            {showBar && <LinearProgress value={perc} variant={'determinate'} style={{ height: '8px' }} />}
          </div>
        );
      } else if (!hideLinearProgress) {
        progressElem = <LinearProgress style={{ height: '8px' }} />;
      }
    }

    let domBack = this.props.isDim ? 'rgba(0,0,0,0.7)' : null;

    let buttonError1 = (
      <Button type={'primary'} onClick={this.props.errorButtonProcess == null ? this.onClickErrorButton : null}>
        {this.props.errorButtonText || 'Return'}
      </Button>
    );
    if (this.props.errorButtonProcess != null) {
      buttonError1 = this.props.errorButtonProcess(buttonError1);
    }

    return (
      <div style={_.assign({}, styleBase, this.props.style || {})} onClick={this.props.onClick} className={this.props.className}>
        <div style={styleBase}>
          {isRefreshing && (
            <div
              style={{
                zIndex: 5,
                backgroundColor: domBack,
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                paddingBottom: (this.props.refreshingPaddingBottom ?? 0) + 'px',
                paddingTop: (this.props.refreshingPaddingTop ?? 100) + 'px',
              }}
            >
              <div style={{ maxWidth: '300px', margin: '0 auto', padding: '0 20px' }}>{progressElem}</div>
            </div>
          )}

          <div style={{ zIndex: 4, color: 'white', position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: isMsg ? 'block' : 'none', textAlign: 'center', padding: '20px' }}>
            {!this.props.hideCircularImage && (
              <div style={{ marginTop: this.props.msgTop ?? '20%' }}>
                <img alt={''} src={calcImgSrc('/app/imgs/ufo2.png')} style={{ width: '150px' }} />
              </div>
            )}
            <div style={{ marginTop: '16px', fontFamily: 'Matter', fontSize: '18px' }}>
              {msgMsg}
              {isMsgAnimRefresh && (
                <div style={{ marginTop: '8px' }}>
                  <FontAwesomeIcon icon={['fad', 'sync']} transform={{ size: 14, x: 0, y: 0 }} spin />
                </div>
              )}
            </div>
            {this.props.msgMenu != null && (
              <div style={{ marginTop: '16px' }}>
                <DropdownExt overlay={this.props.msgMenu as any} trigger={['click']} placement={this.props.msgMenuPosition as any}>
                  <Button type={'primary'}>
                    {this.props.msgButtonText || 'Return'}
                    <FontAwesomeIcon icon={['far', 'angle-down']} transform={{ size: 20, x: 0, y: 2 }} style={{ marginLeft: '5px', color: 'white' }} />
                  </Button>
                </DropdownExt>
              </div>
            )}
            {this.props.msgMenu == null && this.props.onClickMsgButton && (
              <div style={{ marginTop: '16px' }}>
                <Button type={'primary'} onClick={this.onClickMsgButton}>
                  {this.props.msgButtonText || 'Return'}
                </Button>
              </div>
            )}
          </div>

          <div style={{ zIndex: 3, color: 'white', position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: isError ? 'block' : 'none', textAlign: 'center', padding: '20px' }}>
            {!!this.props.showTitle && <div style={{ marginTop: this.props.msgTop ?? '20%', fontFamily: 'Matter', fontSize: '26px' }}>Oops! Looks like there is an error.</div>}
            {!this.props.hideCircularImage && (
              <div style={{ marginTop: this.props.msgTop ?? '20%' }}>
                <img alt={''} src={calcImgSrc('/app/imgs/ufo.png')} style={{ width: '150px' }} />
              </div>
            )}
            <div style={{ marginTop: '16px', fontFamily: 'Matter', fontSize: '18px' }}>
              {errorMsg}
              {isErrorAnimRefresh && (
                <div style={{ marginTop: '6px' }}>
                  <FontAwesomeIcon icon={['fad', 'sync']} transform={{ size: 14, x: 0, y: 0 }} spin />
                </div>
              )}
            </div>
            {this.props.onClickErrorButton && <div style={{ marginTop: '16px' }}>{buttonError1}</div>}
          </div>

          {domBack != null && <div style={{ zIndex: 2, position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: domBack }}>&nbsp;</div>}

          <div style={_.assign({}, styleBase, { zIndex: 1, visibility: !isError ? 'visible' : 'hidden' }, isMsg && this.props.msgHideContent ? { display: 'none' } : {})}>{this.props.children}</div>
        </div>
      </div>
    );
  }
}

export default RefreshAndProgress;
