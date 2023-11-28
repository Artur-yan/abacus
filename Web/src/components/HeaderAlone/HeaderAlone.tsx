import * as React from 'react';
import { connect } from 'react-redux';
import { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne from '../../libs/memoizeOne';
import Link from '../Link/Link';
const s = require('./HeaderAlone.module.css');
const sd = require('../antdUseDark.module.css');

interface IHeaderAloneProps {
  paramsProp?: any;
}

interface IHeaderAloneState {}

class HeaderAlone extends React.PureComponent<IHeaderAloneProps, IHeaderAloneState> {
  private isM: any;
  private unDark: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  memSSOClients = memoizeOne(() => {
    REClient_.client_()._getSSOClientIds((err, res) => {
      if (res?.result != null) {
        Constants.ssoClientIds = res?.result;
      }
    });
  });

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);

    this.memSSOClients();
  }

  componentWillUnmount() {
    this.isM = false;
    this.unDark();
  }

  render() {
    const espRoot = 2;

    return (
      <div className={'clearfix'} style={{ zIndex: 5, position: 'relative', marginLeft: 0, backgroundColor: Constants.navHeaderColor(), display: 'block', height: Constants.headerHeight() + 'px' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, height: Constants.headerHeight() + 'px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: '100%' }}>
            <Link to={'https://abacus.ai'} noApp>
              <span style={{ cursor: 'pointer', color: 'white', marginLeft: '20px' }}>
                <img alt={''} src={calcImgSrc('/app/imgs/logo_text' + 80 + '.png')} style={{ width: '182px' }} />
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    useCases: state.useCases,
    projects: state.projects,
    defDatasets: state.defDatasets,
    datasets: state.datasets,
    models: state.models,
  }),
  null,
)(HeaderAlone);
