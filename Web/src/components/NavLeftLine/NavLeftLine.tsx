import { IconName, IconPrefix, IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import Utils from '../../../core/Utils';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import TooltipExt from '../TooltipExt/TooltipExt';
import s from './NavLeftLine.module.css';
import sd from '../antdUseDark.module.css';
import { sizeIcon, styleIcon, styleIconGreen } from '../NavLeft/utils';
import { RootState } from '../../../core/store';

const FONT_SIZE = 14;

interface INavLeftLineProps {
  paramsProp?: RootState['paramsProp'];
  disable?: boolean;
  id?: string;
  iconName?: IconProp | string;
  text?: string;
  isSelected?: boolean;
  isFolderSelected?: boolean;
  isTitle?: boolean;
  indent?: number;
  linkUrl?: string | string[];
  showChevron?: boolean;
  isOpen?: boolean;
  onChangeOpen?: () => void;
  allowMultiLine?: boolean;
  helpId?: string;
  noApp?: boolean;
  onClick?: any;
  maxCharsLen?: number;
  linkQueryToggleIfSelected?: string;
  chevronAllRow?: boolean;
  navLeftCollapsed?: boolean;
}

class NavLeftLine extends React.PureComponent<INavLeftLineProps> {
  // @ts-ignore
  calcLinkRoot: () => string = () => {
    let { linkUrl, noApp } = this.props;
    if (linkUrl) {
      let addApp = (res) => {
        if (noApp) {
          return res;
        }
        if (!_.startsWith(res, '/app')) {
          if (!_.startsWith(res, '/')) {
            res = '/' + res;
          }
          res = '/app' + res;
        }
        return res;
      };

      let res = null,
        result = null;
      if (_.isArray(linkUrl)) {
        res = addApp(linkUrl[0]);
        // @ts-ignore
        let aa = [...linkUrl];
        aa[0] = res;
        result = aa;
      } else if (_.isString(linkUrl)) {
        res = addApp(linkUrl);
        result = res;
      }

      let { linkQueryToggleIfSelected } = this.props;
      if (!Utils.isNullOrEmpty(linkQueryToggleIfSelected) && this.props.isSelected) {
        let toggleV1 = this.props.paramsProp?.get(linkQueryToggleIfSelected);
        if (Utils.isNullOrEmpty(toggleV1)) {
          toggleV1 = '1';
        } else {
          toggleV1 = '';
        }

        if (!_.isArray(result)) {
          result = [result];
        }
        result[1] = linkQueryToggleIfSelected + '=' + toggleV1;
      }

      return result;
    }
  };

  onClickChevron = (e) => {
    e.stopPropagation();
    e.preventDefault();

    this.props.onChangeOpen?.();
  };

  render() {
    let { isSelected, isFolderSelected, isTitle, showChevron, allowMultiLine } = this.props;

    let calcIconName = (name: IconProp | string) => {
      let res: IconProp = null;

      if (!_.isArray(name)) {
        res = ['far' as IconPrefix, name as IconName];
      } else {
        res = name as IconProp;
      }

      return res;
    };

    let indentSpaceOne = 12;
    let indentSpace = this.props.indent != null && this.props.indent > 0 && this.props.indent * indentSpaceOne;
    if (!indentSpace) {
      indentSpace = 0;
    }

    // showChevron = null;

    let helpIcon = null;
    if (this.props.helpId) {
      helpIcon = (
        <span style={{ marginLeft: '5px' }}>
          <HelpIcon id={this.props.helpId} />
        </span>
      );
    }

    let text1: any = this.props.text;
    if (this.props.maxCharsLen != null && this.props.maxCharsLen > 0) {
      if (_.isString(text1) && text1.length > this.props.maxCharsLen) {
        text1 = (
          <TooltipExt placement={'right'} overlay={text1}>
            <span>{text1.substring(0, this.props.maxCharsLen)}...</span>
          </TooltipExt>
        );
      }
    }

    let color1 = isSelected ? 'rgba(0,248,197,0.8)' : '#fff';

    if (this.props.navLeftCollapsed && !this.props.iconName) {
      return null;
    }

    if (this.props.navLeftCollapsed) {
      return (
        <Link to={this.calcLinkRoot()}>
          <div style={isSelected ? styleIconGreen : styleIcon}>
            <TooltipExt placement="right" overlay={<span>{text1}</span>}>
              <span className={s.collapsedButton}>
                <FontAwesomeIcon icon={calcIconName(this.props.iconName as IconProp)} transform={{ size: sizeIcon }} />
              </span>
            </TooltipExt>
          </div>
        </Link>
      );
    }

    return (
      <Link
        noAutoParams
        noApp={this.props.noApp}
        to={this.calcLinkRoot()}
        ref="root"
        onClick={this.props.chevronAllRow === true ? this.onClickChevron : this.props.onClick}
        style={{ position: 'relative', color: color1, padding: '10px 2px 7px 16px', fontWeight: 600, pointerEvents: `${this.props.disable ? 'none' : 'unset'}`, opacity: `${this.props.disable ? '0.5' : '1'}` }}
        className={'clearfix ' + sd.nolink + ' ' + s.line + ' ' + (isSelected ? s.lineSel : '') + ' ' + (isFolderSelected ? s.lineSelFolder : '') + ' ' + (isTitle ? s.lineTitle : '')}
      >
        <span style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', borderSpacing: '0', borderCollapse: 'collapse' }}>
          {indentSpace != null && indentSpace !== 0 && <span style={{ display: 'inline-block', width: indentSpace + 'px' }}>&nbsp;</span>}

          {showChevron != null && (
            <span style={{ textAlign: 'left', width: 15 + 'px', paddingTop: '2px' }} onClick={this.onClickChevron}>
              <FontAwesomeIcon
                css={`
                  opacity: ${isTitle || isSelected || isFolderSelected ? 0.75 : 0.64};
                  &:hover {
                    opacity: 1;
                    cursor: pointer;
                  }
                `}
                icon={['fas', this.props.isOpen ? 'chevron-down' : 'chevron-right']}
                transform={{ size: 14, x: -2 + (this.props.isOpen ? -2 : 0), y: this.props.isOpen ? -2 : 0 }}
                style={{ color: color1, fontSize: FONT_SIZE + 1 }}
              />
            </span>
          )}

          {this.props.iconName != null && (
            <span style={{ width: 22 + 'px', paddingTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span>
                <FontAwesomeIcon icon={calcIconName(this.props.iconName as IconProp)} transform={{ y: -1.6 }} style={{ color: color1, fontSize: FONT_SIZE + 1, opacity: isTitle || isSelected || isFolderSelected ? 0.9 : 0.74 }} />
              </span>
            </span>
          )}

          <span style={{ flex: 1, minWidth: 0, paddingTop: '2px', paddingBottom: '4px', display: 'flex', paddingRight: (allowMultiLine ? 9 : 6) + 'px', alignItems: 'center' }}>
            <span className={allowMultiLine ? '' : s.ellips} style={{ whiteSpace: allowMultiLine ? 'normal' : 'nowrap', lineHeight: (allowMultiLine ? 19 : 16) + 'px', paddingLeft: 5 + 'px', fontSize: FONT_SIZE + 'px' }}>
              {text1}
              {helpIcon}
            </span>
          </span>
        </span>
      </Link>
    );
  }
}

export default connect((state: RootState) => ({
  paramsProp: state.paramsProp,
}))(NavLeftLine);
