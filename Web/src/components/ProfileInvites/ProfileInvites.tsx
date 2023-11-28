import { CopyOutlined } from '@ant-design/icons';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import FormExt from '../FormExt/FormExt';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ProfileInvites.module.css');
const sd = require('../antdUseDark.module.css');

interface IProfileInvitesProps {
  paramsProp?: any;
  authUser?: any;
}

interface IProfileInvitesState {
  isRefreshing?: boolean;
  invitesList?: any[];
}

class ProfileInvites extends React.PureComponent<IProfileInvitesProps, IProfileInvitesState> {
  formRef = React.createRef<FormInstance>();
  private timerRefresh: any;

  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      invitesList: null,
    };
  }

  refreshInvites = () => {
    this.setState({
      isRefreshing: true,
    });

    REClient_.client_().listUserInvites((err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (!err && res?.result) {
        this.setState({
          invitesList: res?.result,
        });
      }
    });
  };

  componentDidMount() {
    this.refreshInvites();
    this.timerRefresh = setInterval(() => {
      this.refreshInvites();
    }, 5000);
  }

  componentWillUnmount() {
    if (this.timerRefresh) {
      clearInterval(this.timerRefresh);
      this.timerRefresh = null;
    }
  }

  handleSubmitNewInvite = (values) => {
    let email = values.email;
    this.setState({
      isRefreshing: true,
    });
    REClient_.client_().inviteUser(email, (errInvite, resInvite) => {
      this.setState({
        isRefreshing: false,
      });
      if (errInvite || !resInvite) {
        REActions.addNotificationError(errInvite || Constants.errorDefault);
      } else {
        this.refreshInvites();
        this.formRef.current?.resetFields();
        REActions.addNotification('Invite sent!');
      }
    });
  };

  handleReInvite = (row, e) => {
    e && e.preventDefault();
    this.setState({
      isRefreshing: true,
    });
    REClient_.client_().inviteUser(row.email, (errInvite, resInvite) => {
      this.setState({
        isRefreshing: false,
      });
      if (errInvite || !resInvite) {
        REActions.addNotificationError(errInvite || Constants.errorDefault);
      } else {
        REActions.addNotification('Invite sent!');
      }
    });
  };

  handleCopyInvite = async (row, e) => {
    e.preventDefault();
    const filteredRow = this.state.invitesList.find((invite) => invite.email === row.email);
    if (!filteredRow) {
      REActions.addNotificationError('Failed to Create Invite Link');
      return;
    }
    const { organization, userInviteId, inviteSecret } = filteredRow;
    var baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/app/accept_invite/${row.email}/${organization.organizationId}/${userInviteId}?inviteToken=${inviteSecret}`;
    try {
      UtilsWeb.copyToClipboard(inviteLink);
      REActions.addNotification('Invite Link Copied!');
    } catch (error) {
      REActions.addNotificationError(`Failed to Copy Invite Link to Clipboard: ${error?.message}`);
    }
  };

  onClickDeleteInvite = (row, e) => {
    e && e.preventDefault();

    if (row && row.userInviteId) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().deleteInvite(row.userInviteId, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Invite deleted');
          this.refreshInvites();
        }
      });
    }
  };

  render() {
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
      },
      {
        field: 'email',
        title: 'Email',
        isLinked: true,
      },
      {
        field: 'acceptedAt',
        title: 'Accepted',
        render: (text, row, index) => {
          if (!text) {
            return '-';
          } else {
            return moment(text).format('LLL');
          }
        },
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          if (row.acceptedAt == null || row.acceptedAt === '') {
            return (
              <span>
                <Button onClick={this.handleReInvite.bind(this, row)} ghost style={{ marginRight: '5px' }}>
                  Resend Invite
                </Button>
                <Button onClick={this.handleCopyInvite.bind(this, row)} ghost style={{ marginRight: '5px', display: !this.state.invitesList.some((invite) => !invite.inviteSecret) ? 'inline-block' : 'none' }}>
                  Copy Invite
                  <CopyOutlined style={{ verticalAlign: 'middle', marginBottom: 5 }} />
                </Button>
                <ModalConfirm
                  onConfirm={this.onClickDeleteInvite.bind(this, row)}
                  title={`Do you want to delete the invite to '${row.email}'?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Delete'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  <Button danger ghost>
                    Delete
                  </Button>
                </ModalConfirm>
              </span>
            );
          } else {
            return <span>&nbsp;</span>;
          }
        },
      },
    ];

    return (
      <div style={{}}>
        <div style={{ marginTop: '50px', width: '400px', margin: '0 auto' }}>
          <div style={{ fontSize: '16px', margin: '4px 0' }}>Invite a team member</div>
          <FormExt
            layout={'vertical'}
            ref={this.formRef}
            onFinish={this.handleSubmitNewInvite}
            className="login-form"
            initialValues={{
              email: '',
            }}
          >
            <Form.Item
              name={'email'}
              rules={[
                { type: 'email', message: 'Email is not valid' },
                { required: true, message: 'Email is required' },
              ]}
              style={{ marginBottom: '10px' }}
              hasFeedback
            >
              <Input placeholder={'email'} type={'email'} />
            </Form.Item>

            <div style={{ marginTop: '20px' }}>
              <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                Send Invite
              </Button>
            </div>
          </FormExt>
        </div>

        {false && (
          <div style={{ fontSize: '20px', margin: '45px 0 10px 0', textAlign: 'center' }}>
            <div>
              <Button type={'default'} ghost onClick={this.refreshInvites}>
                Refresh Invites
              </Button>
            </div>
          </div>
        )}

        <div style={{ margin: '40px 0' }}>
          <TableExt defaultSort={{ field: 'createdAt', isAsc: false }} notsaveSortState={'invites_list_profile'} dataSource={this.state.invitesList} columns={columns} calcKey={(r1) => r1.userInviteId} />
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
)(ProfileInvites);
