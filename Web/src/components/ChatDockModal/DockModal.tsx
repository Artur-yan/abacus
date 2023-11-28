import Modal from 'antd/lib/modal';
import React, { useEffect, useState } from 'react';
import MinusOutlined from '@ant-design/icons/MinusOutlined';
import FullscreenOutlined from '@ant-design/icons/FullscreenOutlined';
import FullscreenExitOutlined from '@ant-design/icons/FullscreenExitOutlined';
import ArrowsAltOutlined from '@ant-design/icons/ArrowsAltOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import HelpIcon from '../HelpIcon/HelpIcon';
const s = require('./ChatDockModal.module.css');
const sd = require('../antdUseDark.module.css');

const DockModal = (props) => {
  const { initalType, visible, headerIcon, headerName, bgColor, fgColor, headerBgColor, dockWidth, dockHeight, minimWidth, minimHeight, modalWidth, modalHeight, onVisible, onChangeType, helpTextId, children } = props;
  const [type, setType] = useState(initalType);
  const [isVisible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(visible);
  }, [visible]);

  const changeType = (type) => {
    onChangeType(type);
    setType(type);
  };

  const toggleVisibility = (visibility) => {
    onVisible(visibility);
    setVisible(visibility);
    if (!visibility) {
      setType('dock');
    }
  };

  const defaultModalStyles = {
    minWidth: modalWidth,
    height: modalHeight,
    padding: 0,
    background: bgColor,
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties;

  // Normal Dock Style
  const dockStyles = {
    position: 'fixed',
    zIndex: 100,
    boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
    background: bgColor,
    left: 'unset',
    top: 'unset',
    width: dockWidth,
    height: dockHeight,
    right: '10px',
    bottom: '10px',
    borderRadius: '5px',
    overflow: 'hidden',
    margin: 'unset',
  } as React.CSSProperties;

  // Minimized Dock Style
  const minDockStyles = {
    position: 'fixed',
    zIndex: 100,
    boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
    background: 'transparent',
    left: 'unset',
    top: 'unset',
    width: minimWidth,
    height: minimHeight,
    right: '10px',
    bottom: '10px',
    borderRadius: '5px',
    overflow: 'hidden',
    margin: 'unset',
  } as React.CSSProperties;

  if (type === 'dock') {
    return isVisible ? (
      <div style={dockStyles}>
        <div css={'display: flex; flex-direction: column; height: 100%; overflow: hidden;'}>
          <div
            css={`
              display: flex;
              align-items: center;
              min-height: 40px;
              background-color: ${headerBgColor};
              color: ${fgColor};
            `}
          >
            <div
              css={`
                font-size: 18px;
                flex: 1;
                text-align: center;
              `}
            >
              <span
                css={`
                  margin-left: 80px;
                `}
              >
                <span css={'margin-right: 8px;'}>{headerIcon}</span>
                {headerName} <HelpIcon id={helpTextId} style={{ marginLeft: '4px' }} />
              </span>
            </div>
            <div css={'display: flex; gap: 10px; font-size: 18px; margin-right: 20px;'}>
              <MinusOutlined onClick={(e) => changeType('minim')} />
              <FullscreenOutlined onClick={(e) => changeType('modal')} />
              <CloseOutlined onClick={(e) => toggleVisibility(false)} />
            </div>
          </div>
          <div
            css={`
              flex: 1;
            `}
          >
            {children}
          </div>
        </div>
      </div>
    ) : null;
  } else if (type === 'minim') {
    return isVisible ? (
      <div style={minDockStyles}>
        <div
          css={`
            display: flex;
            align-items: center;
            height: 40px;
            background-color: ${headerBgColor};
            color: ${fgColor};
            border-radius: 5px;
          `}
        >
          <div
            css={`
              font-size: 18px;
              flex: 1;
              text-align: center;
            `}
          >
            <span
              css={`
                margin-left: 80px;
              `}
            >
              <span css={'margin-right: 8px;'}>{headerIcon}</span>
              {headerName} <HelpIcon id={helpTextId} style={{ marginLeft: '4px' }} />
            </span>
          </div>
          <div css={'display: flex; gap: 10px; font-size: 18px; margin-right: 20px;'}>
            <ArrowsAltOutlined onClick={(e) => changeType('dock')} />
            <FullscreenOutlined onClick={(e) => changeType('modal')} />
            <CloseOutlined onClick={(e) => toggleVisibility(false)} />
          </div>
        </div>
        <div hidden>{children}</div>
      </div>
    ) : null;
  } else if (type === 'modal') {
    return (
      <Modal open={isVisible} bodyStyle={defaultModalStyles} footer={null} title={null} closable={false} centered width={'100%'}>
        <div
          css={`
            display: flex;
            align-items: center;
            height: 40px;
            background-color: ${headerBgColor};
            color: ${fgColor};
          `}
        >
          <div
            css={`
              font-size: 18px;
              flex: 1;
              text-align: center;
            `}
          >
            <span
              css={`
                margin-left: 80px;
              `}
            >
              <span css={'margin-right: 8px;'}>{headerIcon}</span>
              {headerName} <HelpIcon id={helpTextId} style={{ marginLeft: '4px' }} />
            </span>
          </div>
          <div css={'display: flex; gap: 10px; font-size: 18px; margin-right: 20px;'}>
            <MinusOutlined onClick={(e) => changeType('minim')} />
            <FullscreenExitOutlined onClick={(e) => changeType('dock')} />
            <CloseOutlined onClick={(e) => toggleVisibility(false)} />
          </div>
        </div>
        <div
          css={`
            flex: 1;
          `}
        >
          {children}
        </div>
      </Modal>
    );
  } else {
    return null;
  }
};

DockModal.defaultProps = {
  initalType: 'dock',
  headerIcon: null,
  headerName: 'Chat AI',
  bgColor: '#323C44',
  fgColor: 'white',
  visible: true,
  headerBgColor: '#1E90FF',
  dockWidth: '40%',
  dockHeight: '70%',
  minimWidth: '30%',
  minimHeight: '40px',
  modalWidth: '70%',
  modalHeight: '95vh',
  onVisible: null,
  onChangeType: null,
  helpTextId: null,
};

export default DockModal;
