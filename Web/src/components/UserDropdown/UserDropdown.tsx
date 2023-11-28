import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import memoizeOne from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserOrgs } from '../../stores/reducers/authUser';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import UserCardNav from '../UserCardNav/UserCardNav';
import { UserProfileSection } from '../UserProfile/UserProfile';

const s = require('./UserDropdown.module.css');

interface IUserDropdownProps {
  authUser?: any;
  paramsProp?: any;
}

interface IUserDropdownState {}

class UserDropdown extends React.PureComponent<IUserDropdownProps, IUserDropdownState> {
  private unDark: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  componentDidMount() {
    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
  }

  componentWillUnmount() {
    this.unDark();
  }

  onClickProfile = (e) => {
    REActions.userDropdownShowHide(false);
    Location.push('/' + PartsLink.profile);
  };

  onClickConnectors = (e) => {
    REActions.userDropdownShowHide(false);
    Location.push('/' + PartsLink.profile + '/' + UserProfileSection.connected_services);
  };

  onClickProfileAdmin = (e) => {
    REActions.userDropdownShowHide(false);
    Location.push('/' + PartsLink.profile + '/' + UserProfileSection.team);
  };

  onClickProfileApiKey = (e) => {
    REActions.userDropdownShowHide(false);
    Location.push('/' + PartsLink.profile + '/' + UserProfileSection.apikey);
  };

  onClickLogout = (e) => {
    REActions.userDropdownShowHide(false);
    REClient_.client_()._signOut((err, res) => {
      StoreActions.userLogout_();
      window.location.href = '/sign_out';
    });
  };

  onClickSwitchOrg = (org1, e) => {
    if (org1?.organizationId) {
      REActions.userDropdownShowHide(false);
      REClient_.client_()._selectActiveOrganization(org1.organizationId, (err, res) => {
        if (err) {
          REActions.addNotificationError(err);
        } else {
          Location.push('/' + PartsLink.project_list);

          setTimeout(() => {
            REActions.showOrgHintClear();
            REActions.fullRefreshHappened();
            StoreActions.refreshAll_();
          }, 30);
        }
      });
    }
  };

  onClickJoin = (e) => {
    REActions.userDropdownShowHide(false);
    Location.push('/' + PartsLink.workspace_join, undefined, 'allowBack=true');
  };

  memOrgsList: (list, authUser) => { list; createElem } = memoizeOne((list, authUser) => {
    if (list && authUser) {
      let res = [];

      list
        .filter((o1) => o1.joined)
        .sort((a, b) => {
          return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        })
        .some((o1) => {
          let isThisOne = o1.organizationId === authUser.getIn(['data', 'organization', 'organizationId']);
          if (isThisOne) {
            return false;
          }

          res.push(
            <div key={'org_' + o1.organizationId} style={{ margin: '10px 0' }}>
              <Button style={{ width: '300px' }} type={'primary'} onClick={this.onClickSwitchOrg.bind(this, o1)}>
                {o1.name}
              </Button>
            </div>,
          );
        });

      let createElem = (
        <div key={'org_join'} style={{ margin: '20px 0 10px 0' }}>
          <Button style={{ width: '300px' }} type={'primary'} ghost onClick={this.onClickJoin}>
            Create/Join Other...
          </Button>
        </div>
      );

      return { list: res, createElem };
    }
  });

  render() {
    let { authUser, paramsProp } = this.props;

    const isBilling = [PartsLink.price_lists, PartsLink.finish_billing].includes(paramsProp?.get('mode'));

    let orgs = calcAuthUserOrgs();
    let orgsListRes = this.memOrgsList(orgs, authUser);
    let orgsList = orgsListRes?.list ?? [];

    let orgRender = null,
      orgCreate = null; /*orgsListRes.createElem*/
    if (orgsList != null) {
      const maxOrgs = 5;
      if (orgsList.length > maxOrgs) {
        orgRender = (
          <div style={{ height: 42 * maxOrgs + 22 + 'px', position: 'relative' }}>
            <NanoScroller onlyVertical>
              {orgsList}
              {orgCreate}
            </NanoScroller>
          </div>
        );
      } else if (orgsList.length > 0) {
        orgRender = orgsList.concat(orgCreate ? [orgCreate] : []);
      } else if (orgCreate != null) {
        orgRender = orgCreate;
      }
    } else if (orgCreate != null) {
      orgRender = orgCreate;
    }

    // let isAdmin = false;
    // if(authUser) {
    //   if(authUser.getIn(['data', 'organizationAdmin'])===true) {
    //     isAdmin = true;
    //   }
    // }

    return (
      <div style={{ color: Utils.colorAall(1), width: '320px', textAlign: 'center' }}>
        <div onClick={this.onClickProfile}>
          <UserCardNav onlyAvatarAndName />
        </div>

        <div style={{ borderTop: '1px solid ' + Utils.colorA(0.2), marginTop: '15px', paddingTop: '15px' }}>
          <div style={{ marginBottom: '25px', position: 'relative' }}>
            {orgsList != null && (_.isArray(orgsList) ? orgsList.length > 0 : true) && <div style={{ marginBottom: '6px', textAlign: 'center', opacity: 0.8 }}>Switch To:</div>}
            {orgRender}
          </div>

          {!isBilling && (
            <div>
              <div style={{ margin: '12px 10px' }}>
                <Button type={'primary'} ghost onClick={this.onClickProfile} style={{ width: /*isAdmin ? 49 : */ 100 + '%', height: '28px', lineHeight: 1 }}>
                  Manage Profile
                </Button>
              </div>
              <div style={{ margin: '12px 10px' }}>
                <Button type={'primary'} ghost onClick={this.onClickConnectors} style={{ width: /*isAdmin ? 49 : */ 100 + '%', height: '28px', lineHeight: 1 }}>
                  Manage Connectors
                </Button>
              </div>
              <div style={{ margin: '12px 10px', textAlign: 'center' }}>
                <Button type={'primary'} ghost onClick={this.onClickProfileApiKey} style={{ borderColor: '#00f8c5', color: '#00f8c5', width: '100%', height: '28px', lineHeight: 1 }}>
                  API Keys
                </Button>
              </div>
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid ' + Utils.colorA(0.2), marginTop: '15px', paddingTop: '15px' }}>
          <div style={{ margin: '0 10px 12px 10px' }}>
            {Utils.isMobile() && (
              <Button onClick={this.onClickLogout} type={'default'} ghost style={{ height: '28px', width: '100%', lineHeight: 1 }}>
                Logout
              </Button>
            )}
            {!Utils.isMobile() && (
              <ModalConfirm onConfirm={this.onClickLogout} title={`Do you want to logout?`} icon={<QuestionCircleOutlined style={{ color: 'blue' }} />} okText={'Logout'} cancelText={'Cancel'} okType={'primary'}>
                <Button type={'default'} ghost style={{ height: '28px', width: '100%' }}>
                  Logout
                </Button>
              </ModalConfirm>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    authUser: state.authUser,
    paramsProp: state.paramsProp,
  }),
  null,
)(UserDropdown);
