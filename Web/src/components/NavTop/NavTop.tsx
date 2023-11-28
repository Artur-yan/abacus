import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties } from 'react';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import WindowResizeListener from '../WindowResizeListener/WindowResizeListener';
const s = require('./NavTop.module.css');
const sd = require('../antdUseDark.module.css');

interface INavTopProps {
  style?: CSSProperties;
  params?: object;
  navLeftCollapsed?: boolean;
  noNav?: boolean;
}

interface INavTopState {
  needsShadow?: any;
  dimensions?: any;
}

class NavTop extends React.PureComponent<INavTopProps, INavTopState> {
  private isM: boolean;

  constructor(props) {
    super(props);

    let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    this.state = {
      needsShadow: false,
      dimensions: { width: windowWidth, height: windowHeight },
    };

    this.onResizeDebounce = _.debounce(this.onResizeDebounce, 180);
  }

  componentDidMount() {
    this.isM = true;
  }

  componentWillUnmount() {
    this.isM = false;
  }

  onResize = (windowSize) => {
    if (this.isM) {
      let hh = windowSize.windowHeight;
      let ww = windowSize.windowWidth;
      this.setState({ dimensions: { width: ww, height: hh } });

      this.onResizeDebounce(ww, hh);
    }
  };

  private resizeMinSend: number[] = [];
  onResizeDebounce = (ww, hh) => {
    const sendOnWidth: number[] = [1220];

    let minWW = null;
    for (let i = 0; i < sendOnWidth.length; i++) {
      if (ww <= sendOnWidth[i]) {
        minWW = ww;
      }
    }

    if (minWW != null) {
      if (this.resizeMinSend.indexOf(minWW) === -1) {
        this.resizeMinSend.push(minWW);
        REActions.onResizeSpecial(ww, hh, true);
      }
    } else if (this.resizeMinSend != null) {
      let maxWW = null;
      for (let i = 0; i < this.resizeMinSend.length; i++) {
        if (ww >= this.resizeMinSend[i]) {
          maxWW = ww;
        }
      }

      if (maxWW != null) {
        this.resizeMinSend = this.resizeMinSend.filter((s1) => s1 !== maxWW);
        REActions.onResizeSpecial(ww, hh, false);
      }
    }
  };

  render() {
    // let params = this.props.params;
    // let mode = params && params.mode;
    //
    // let wwTot = this.state.dimensions.width-Constants.navWidth;

    return (
      <div
        className={'clearfix ' + (this.state.needsShadow ? s.withShadow : '')}
        style={_.extend(
          {
            overflowX: 'hidden',
            overflowY: 'auto',
            position: 'absolute',
            backgroundColor: '#fafafa',
            left: (this.props.noNav ? 0 : this.props.navLeftCollapsed ? Constants.navWidthCollapsed : Constants.navWidth) + 'px',
            top: Constants.headerHeight() + 'px',
            height: Constants.navTopHeight + 'px',
            right: 0,
          },
          this.props.style || {},
        )}
      >
        <WindowResizeListener onResize={this.onResize} />
      </div>
    );
  }
}

export default NavTop;
