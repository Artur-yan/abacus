import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils from '../../../core/Utils';
import CloudOwnership from '../CloudOwnership/CloudOwnership';
import HelpBox from '../HelpBox/HelpBox';
import ProfileAPIKeys from '../ProfileAPIKeys/ProfileAPIKeys';
import ProfileBilling from '../ProfileBilling/ProfileBilling';
import ProfileGroups from '../ProfileGroups/ProfileGroups';
import ProfileInvites from '../ProfileInvites/ProfileInvites';
import ProfileInvoices from '../ProfileInvoices/ProfileInvoices';
import ProfileMain from '../ProfileMain/ProfileMain';
import ProfileOrg from '../ProfileOrg/ProfileOrg';
import ProfileUsage from '../ProfileUsage/ProfileUsage';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import Constants from '../../constants/Constants';
import Location from '../../../core/Location';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./UserProfile.module.css');
const sd = require('../antdUseDark.module.css');

export enum UserProfileSection {
  main = '',
  general = 'general',
  team = 'team',
  invites = 'invites',
  apikey = 'apikey',
  connected_services = 'connected_services',
  billing = 'billing',
  usage = 'usage',
  invoices = 'invoices',
  groups = 'groups',
}

interface IUserProfileProps {
  paramsProp?: any;
  authUser?: any;
}

interface IUserProfileState {
  isRefreshing?: boolean;
}

class UserProfile extends React.PureComponent<IUserProfileProps, IUserProfileState> {
  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    let { paramsProp } = this.props;

    let sectionName: UserProfileSection = paramsProp && paramsProp.get('section');
    if (sectionName == null || sectionName === '') {
      sectionName = UserProfileSection.general;
    }

    const notFound = (
      <RefreshAndProgress
        errorMsg={'Not found'}
        onClickErrorButton={() => {
          Location.push(`/${PartsLink.profile}`);
        }}
        errorButtonText="Go To Profile"
      />
    );

    let title = '',
      minWW = 420,
      maxWW = null,
      noBack = false,
      helpRight = null,
      autoSize = false;
    let content: any = null,
      contentFn: any = null;
    if (sectionName === UserProfileSection.general) {
      content = <ProfileMain />;
      maxWW = 1200;
      title = null;
      noBack = true;
    } else if (sectionName === UserProfileSection.team) {
      content = <ProfileOrg />;
      title = 'Team';
    } else if (sectionName === UserProfileSection.invites) {
      content = <ProfileInvites />;
      title = 'Team Invites';
    } else if (sectionName === UserProfileSection.groups) {
      contentFn = (hh) => <ProfileGroups height={hh} />;
      title = 'Groups';
      autoSize = true;
      maxWW = 1000;
    } else if (sectionName === UserProfileSection.apikey) {
      content = <ProfileAPIKeys />;
      title = 'API Keys';
    } else if (sectionName === UserProfileSection.connected_services) {
      content = <CloudOwnership />;
      title = 'Connected Services';
      helpRight = <HelpBox name={'connectors'} linkTo={'/help/connectors/overview'} />;
    } else if (sectionName === UserProfileSection.billing) {
      if (Constants.flags.onprem) {
        content = notFound;
      } else {
        content = <ProfileBilling />;
      }
      title = null;
      minWW = 960;
      noBack = true;
    } else if (sectionName === UserProfileSection.invoices) {
      if (Constants.flags.onprem) {
        content = notFound;
      } else {
        content = <ProfileInvoices />;
      }
      title = null;
      minWW = 960;
      noBack = true;
    } else if (sectionName === UserProfileSection.usage) {
      if (Constants.flags.onprem) {
        content = notFound;
      } else {
        content = <ProfileUsage />;
      }
      title = null;
      minWW = 960;
      noBack = true;
    }

    if (autoSize && _.isFunction(contentFn) && contentFn != null) {
      content = <AutoSizer disableWidth>{({ height }) => <>{contentFn(height)}</>}</AutoSizer>;
    }

    return (
      <div
        css={`
          ${autoSize ? 'top: 0; left: 30px; right: 0; bottom: 30px;' : ''}
        `}
        style={{ position: autoSize ? 'absolute' : 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '50px' }}
      >
        <RefreshAndProgress isRelative={!autoSize} isRefreshing={this.state.isRefreshing} style={{ width: '96%', minWidth: '800px' }}>
          {title != null && (
            <div style={{ color: Utils.isDark() ? 'white' : 'black', fontSize: '26px', marginBottom: 30 + 'px', position: 'relative' }}>
              {helpRight != null && (
                <div
                  css={`
                    position: absolute;
                    right: 0;
                    top: 3px;
                  `}
                >
                  {helpRight}
                </div>
              )}
              <div style={{ display: 'table', margin: '0 auto' }}>
                <span style={{ display: 'table-cell' }}>
                  <div style={{ textAlign: 'left', lineHeight: '32px' }}>{title}</div>
                </span>
              </div>
            </div>
          )}

          <div
            css={`
              ${autoSize ? `position: absolute; top: ${title == null ? 0 : 50}px; left: 0; right: 0; bottom: 0;` : ''}
            `}
            style={{ padding: '20px', minWidth: minWW + 'px', maxWidth: maxWW == null ? '' : maxWW + 'px', margin: maxWW == null ? '' : '0 auto' }}
            className={noBack ? '' : sd.grayPanel}
          >
            {content}
          </div>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }),
  null,
)(UserProfile);
