import Button from 'antd/lib/button';
import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import Constants from '../../constants/Constants';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./WelcomeScreen.module.css');
const sd = require('../antdUseDark.module.css');

interface IWelcomeScreenProps {
  authUser?: any;
}

interface IWelcomeScreenState {}

class WelcomeScreen extends React.PureComponent<IWelcomeScreenProps, IWelcomeScreenState> {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onClickCreateProject = (e) => {
    Location.push('/' + PartsLink.project_add);
  };

  render() {
    let msg1 = null;
    let { authUser } = this.props;
    if (authUser) {
      let name = authUser.getIn(['data', 'name']);
      if (_.isString(name) && !Utils.isNullOrEmpty(name)) {
        name = name.split(' ')[0];

        msg1 = `Hi ${Utils.upperFirst(name)}, Welcome to ` + Constants.flags.product_name;
      }
    }

    return (
      <div style={{ textAlign: 'center', fontFamily: 'Matter' }} className={sd.absolute}>
        <NanoScroller>
          <div>
            <div style={{ marginTop: '103px', fontSize: '36px' }}>{msg1 || <span>&nbsp;</span>}</div>
            <div style={{ marginTop: '115px' }}>
              <img alt={''} src={calcImgSrc('/app/imgs/welcomeImg.png')} style={{ width: '150px' }} />
            </div>
            <div style={{ marginTop: '36px', fontSize: '24px' }}>
              A project helps you collaborate and
              <br />
              organize around a specific problem
            </div>
            <div style={{ marginTop: '38px' }}>
              <Button style={{ width: '480px', height: '40px' }} onClick={this.onClickCreateProject} type={'primary'}>
                Create Project...
              </Button>
            </div>
          </div>
        </NanoScroller>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    authUser: state.authUser,
  }),
  null,
)(WelcomeScreen);
