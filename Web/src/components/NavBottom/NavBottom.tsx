import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as moment from 'moment';
import * as React from 'react';
import Utils, { forceDarkMode } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import HelpItemsNavLinks from '../HelpItemsNavLinks/HelpItemsNavLinks';
let s = require('./NavBottom.module.css');

interface INavBottomProps {
  navLeftCollapsed?: boolean;
  showHelpIcons?: boolean;
  noNav?: boolean;
}

interface INavBottomState {}

class NavBottom extends React.PureComponent<INavBottomProps, INavBottomState> {
  private isM: boolean;
  private unDark: any;

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  unFlags: any;

  componentDidMount() {
    this.isM = true;

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
    this.unFlags = REActions.flagsRefresh.listen(this.flagsRefresh);
  }

  flagsRefresh = () => {
    this.forceUpdate();
  };

  componentWillUnmount() {
    this.isM = false;

    this.unDark();
    this.unFlags();
  }

  onClickLightMode = (e) => {
    Utils.setIsDark(false);
    REActions.onDarkModeChanged(false);
  };

  onClickDarkMode = (e) => {
    Utils.setIsDark(true);
    REActions.onDarkModeChanged(true);
  };

  render() {
    let wwLeft = (this.props.navLeftCollapsed || this.props.noNav ? Constants.navWidthCollapsed : Constants.navWidth) + 1;

    return (
      <div style={{ position: 'absolute', height: Constants.NavBottomHeight + 'px', left: 0, right: 0, bottom: 0, backgroundColor: Constants.headerBottomBackColor() }}>
        <div style={{ float: 'right', height: Constants.NavBottomHeight + 'px', width: Constants.navWidth + 'px', textAlign: 'right' }}>
          <span style={{ padding: '4px 10px 0 0', position: 'absolute', top: 0, bottom: 0, right: 0, color: Utils.colorA(0.6), fontSize: '11px', fontWeight: 400 }}>© Copyright {moment().year()}</span>
        </div>
        <div style={{ float: 'left', height: Constants.NavBottomHeight + 'px', width: wwLeft + 'px', borderRight: '2px solid ' + Constants.backColor() }}>
          <span style={{ padding: '4px 0 0 10px', position: 'absolute', top: 0, bottom: 0, left: 0, color: Utils.colorA(0.75), fontSize: '11px', fontWeight: 400 }}>{Constants.flags.product_name}</span>
        </div>
        {this.props.showHelpIcons && (
          <span style={{ marginLeft: wwLeft + 10 + 'px', float: 'left', color: Utils.colorA(0.75), padding: '2px 0 0 10px' }}>
            <HelpItemsNavLinks />
          </span>
        )}

        {!forceDarkMode && (
          <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 400, padding: '3px 0 0 0', cursor: 'pointer' }}>
            <span onClick={this.onClickLightMode} style={{ color: Utils.colorA(!Utils.isDark() ? 0.8 : 0.5) }}>
              <FontAwesomeIcon icon={['far', 'sun']} transform={{ size: 18, y: 1.5 }} style={{ marginRight: '3px' }} />
              &nbsp;Light Mode&nbsp;
            </span>
            <span style={{ color: Utils.colorA(0.44), margin: '0 3px' }}>|</span>
            <span onClick={this.onClickDarkMode} style={{ color: Utils.colorA(Utils.isDark() ? 0.8 : 0.5) }}>
              &nbsp;Dark Mode&nbsp;
              <FontAwesomeIcon icon={['far', 'moon']} transform={{ size: 16 }} style={{ marginLeft: '3px' }} />
            </span>
          </div>
        )}
      </div>
    );
  }
}

export default NavBottom;
