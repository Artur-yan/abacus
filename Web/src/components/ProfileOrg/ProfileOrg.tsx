import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import { UserProfileSection } from '../UserProfile/UserProfile';
const s = require('./ProfileOrg.module.css');
const sd = require('../antdUseDark.module.css');

interface IProfileOrgProps {
  paramsProp?: any;
  authUser?: any;
}

interface IProfileOrgState {
  isRefreshing?: boolean;
  userList?: any[];
}

const styleButton: CSSProperties = { marginRight: '8px', marginBottom: '8px' };

class ProfileOrg extends React.PureComponent<IProfileOrgProps, IProfileOrgState> {
  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      userList: null,
    };
  }

  refreshUsersInOrg = () => {
    this.setState({
      isRefreshing: true,
    });

    REClient_.client_().listOrganizationUsers((err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (!err && res?.result) {
        this.setState({
          userList: res?.result,
        });
      }
    });
  };

  componentDidMount() {
    this.refreshUsersInOrg();
  }

  componentWillUnmount() {}

  onClickDeleteInvite = (row, e) => {
    e && e.preventDefault();

    if (row && row.email) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().removeUserFromOrganization(row.email, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('User Removed');
          this.refreshUsersInOrg();
        }
      });
    }
  };

  onClickPromoteAdmin = (row, e) => {
    e && e.preventDefault();

    if (row && row.email) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().setUserAsAdmin(row.email, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('User is now an admin');
          this.refreshUsersInOrg();
        }
      });
    }
  };

  render() {
    let { authUser } = this.props;
    const columns: ITableExtColumn[] = [
      {
        field: 'createdAt',
        title: 'Created',
        render: (text, row, index) => {
          if (!text) {
            return '-';
          } else {
            return moment(text).format('LLL');
          }
        },
        forceNoWrap: true,
      },
      {
        field: 'email',
        title: 'Email',
        isLinked: true,
      },
      {
        field: 'emailValidated',
        title: 'Email Validated',
        render: (text, row, index) => {
          return <Checkbox checked={('' + text || '').toLowerCase() === 'true'} />;
        },
        align: 'center',
        forceNoWrap: false,
      },
      {
        field: 'admin',
        title: 'Organization Admin',
        render: (text, row, index) => {
          return <Checkbox checked={('' + text || '').toLowerCase() === 'true'} />;
        },
        align: 'center',
        forceNoWrap: false,
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          if (row.acceptedAt == null || row.acceptedAt === '') {
            return (
              <span>
                {!row.admin && authUser?.get('data')?.get('organizationAdmin') && (
                  <ModalConfirm
                    onConfirm={this.onClickPromoteAdmin.bind(this, row)}
                    title={`Do you want to promote user '${row.email}' to the Admin group?`}
                    icon={<QuestionCircleOutlined />}
                    okText={'Add Admin'}
                    cancelText={'Cancel'}
                    okType={'primary'}
                  >
                    <Button ghost style={styleButton}>
                      Add Admin
                    </Button>
                  </ModalConfirm>
                )}
                {authUser?.get('data')?.get('userId') !== row.userId && (
                  <ModalConfirm
                    onConfirm={this.onClickDeleteInvite.bind(this, row)}
                    title={`Do you want to remove user '${row.email}' from the organization?`}
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    okText={'Remove'}
                    cancelText={'Cancel'}
                    okType={'danger'}
                  >
                    <Button danger style={styleButton} ghost>
                      Remove
                    </Button>
                  </ModalConfirm>
                )}
              </span>
            );
          } else {
            return <span>&nbsp;</span>;
          }
        },
      },
    ];

    Constants.flags.onprem &&
      authUser?.get('data')?.get('organizationAdmin') &&
      columns.push({
        field: 'passwordResetLink',
        title: 'Password reset link',
        isLinked: true,
        align: 'center',
        forceNoWrap: false,
      });

    return (
      <div style={{ width: '100%', minWidth: '800px' }}>
        <div style={{ fontSize: '20px', margin: '5px 0', textAlign: 'center' }}>Users in Organization</div>

        <div style={{ margin: '40px 0' }}>
          <TableExt defaultSort={{ field: 'createdAt', isAsc: false }} notsaveSortState={'invites_list_profile'} dataSource={this.state.userList} columns={columns} calcKey={(r1) => r1.userInviteId} />
        </div>

        <div style={{ marginTop: '50px', width: '400px', margin: '0 auto' }}>
          <div style={{ fontSize: '16px', margin: '4px 0' }}>Invite a team member</div>
          <div style={{ marginTop: '20px' }}>
            <Link to={'/' + PartsLink.profile + '/' + UserProfileSection.invites}>
              <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                Invite...
              </Button>
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
  }),
  null,
)(ProfileOrg);
