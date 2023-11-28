import * as $ from 'jquery';
import _ from 'lodash';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./CenterPage.module.css');

interface ICenterPageProps {
  style?: object;
  hasNavTop?: boolean;
  navTopHasSecondRow?: boolean;
  params?: any;
  noHeader?: boolean;
  noNav?: boolean;
  paramsProp?: any;
  navLeftCollapsed?: boolean;
  extraHeightNavTop?: number;
  backColor?: string;
  isModels?: boolean;
  className?: string;
  backImg?: string;
}

interface ICenterPageState {}

class CenterPage extends React.PureComponent<React.PropsWithChildren<ICenterPageProps>, ICenterPageState> {
  private unScroll: any;
  private unDark: any;

  constructor(props: ICenterPageProps, context: any) {
    super(props, context);

    this.state = {};
  }

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  componentDidMount() {
    this.unScroll = REActions.scrollToTopMain.listen((value, isAnimated) => {
      this.scrollTop(value || 0, isAnimated === true);
    });

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
  }

  componentWillUnmount() {
    this.unScroll();
    this.unDark();
  }

  scrollTop = (value, isAnimated) => {
    if (isAnimated) {
      $(this.refs.root).animate({ scrollTop: value }, 220);
    } else {
      $(this.refs.root).scrollTop(value);
    }
  };

  showNavActual = false;
  onScrollRoot = (e) => {
    //console.dir(e);
    let isOnTop = $(this.refs.root).scrollTop();

    if (this.props.isModels) {
      let $headerNavNew = $('.headerNavNew');
      if ($headerNavNew.length > 0) {
        let showNav = isOnTop > 50;
        if (showNav !== this.showNavActual) {
          this.showNavActual = showNav;
          if (showNav) {
            $headerNavNew.fadeIn();
          } else {
            $headerNavNew.fadeOut();
          }
        }
      }
    }

    REActions.headerNeedsShadow(isOnTop > 10);
  };

  render() {
    let backColor = Utils.isDark() ? Constants.navBackDarkColor() : '#ffffff';
    if (this.props.backColor) {
      backColor = this.props.backColor;
    }
    let { paramsProp, noHeader, noNav } = this.props;

    const isSearchAdv = paramsProp?.get('mode') === PartsLink.search_adv;

    let content = this.props.children;
    if (this.props.backImg) {
      content = (
        <div
          style={{
            backgroundImage: 'url(' + this.props.backImg + ')',
            backgroundPosition: 'center -280px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {content}
        </div>
      );
    }

    return (
      <div
        ref={'root'}
        className={this.props.className || ''}
        onScroll={this.onScrollRoot}
        style={
          _.extend(
            {
              color: Utils.isDark() ? 'white' : 'black',
              overflowX: 'hidden',
              overflowY: 'auto',
              position: 'absolute',
              backgroundColor: backColor,
              left: this.props.noNav ? 0 : (isSearchAdv ? Constants.navWidthExtended : this.props.navLeftCollapsed ? Constants.navWidthCollapsed : Constants.navWidth) + 'px',
              top: this.props.noHeader ? 0 : (this.props.extraHeightNavTop ?? 0) + Constants.headerHeight() + (this.props.hasNavTop ? Constants.navTopHeight + (this.props.navTopHasSecondRow ? Constants.navTopHeightOptions : 0) : 0) + 'px',
              bottom: Constants.NavBottomHeight + 'px',
              right: 0,
            },
            this.props.style || {},
          ) as CSSProperties
        }
      >
        {content}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
  }),
  null,
)(CenterPage);
