import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import FormExt from '../FormExt/FormExt';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ProfileAPIKeys.module.css');
const sd = require('../antdUseDark.module.css');

interface IProfileAPIKeysProps {
  paramsProp?: any;
  authUser?: any;
}

interface IProfileAPIKeysState {
  isRefreshing?: boolean;
  apikeyList?: any[];
}

class ProfileAPIKeys extends React.PureComponent<IProfileAPIKeysProps, IProfileAPIKeysState> {
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      apikeyList: null,
    };
  }

  refreshList = (showApiKey) => {
    this.setState({
      isRefreshing: true,
    });

    REClient_.client_().listApiKeys((err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (!err && res?.result) {
        this.setState({
          apikeyList: res?.result.map((apiKey) => {
            if (showApiKey && apiKey.apiKeyId == showApiKey.apiKeyId) {
              apiKey.apiKey = showApiKey.apiKey;
              apiKey.showCopy = true;
            }
            return apiKey;
          }),
        });
      }
    });
  };

  componentDidMount() {
    this.refreshList(null);
  }

  componentWillUnmount() {}

  handleSubmitNewAPIKey = (values) => {
    let tag = values.tag;

    REClient_.client_().createApiKey(tag, (errInvite, resApiKey) => {
      if (errInvite || !resApiKey) {
        REActions.addNotificationError(errInvite || Constants.errorDefault);
      } else {
        this.refreshList(resApiKey.result);
        this.formRef.current?.resetFields();
        REActions.addNotification('API Key created!');
      }
    });
  };

  onClickCopyKey = (apiKey, e) => {
    e && e.preventDefault();

    UtilsWeb.copyToClipboard(apiKey);

    REActions.addNotification('Copied API Key to clipboard');
  };

  onClickDeleteAPIKey = (row, e) => {
    e && e.preventDefault();

    if (row && row.apiKeyId) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().deleteApiKey(row.apiKeyId, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('API Key deleted');
          this.refreshList(null);
        }
      });
    }
  };

  render() {
    const styleButton: CSSProperties = { marginRight: '8px', marginBottom: '8px', width: '90px' };
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
        field: 'tag',
        title: 'Tag',
      },
      {
        field: 'apiKey',
        title: 'API Key',
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          return (
            <span>
              {row.showCopy && (
                <Button ghost style={styleButton} onClick={this.onClickCopyKey.bind(this, row?.apiKey)}>
                  Copy
                </Button>
              )}
              <ModalConfirm
                onConfirm={this.onClickDeleteAPIKey.bind(this, row)}
                title={`Do you want to delete this API Key '${row.tag}'?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Delete'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button danger style={styleButton} ghost>
                  Delete
                </Button>
              </ModalConfirm>
            </span>
          );
        },
      },
    ];

    return (
      <div style={{}}>
        <div style={{ fontSize: '20px', margin: '5px 0', textAlign: 'center' }}></div>

        <div style={{ margin: '40px 0' }}>
          <TableExt defaultSort={{ field: 'createdAt', isAsc: false }} notsaveSortState={'apikeys_list_profile'} dataSource={this.state.apikeyList} columns={columns} calcKey={(r1) => r1.apiKeyId} />
        </div>

        <div style={{ marginTop: '50px', width: '400px', margin: '0 auto' }}>
          <div style={{ fontSize: '16px', margin: '4px 0' }}>Generate new API Key</div>
          <FormExt
            layout={'vertical'}
            ref={this.formRef}
            onFinish={this.handleSubmitNewAPIKey}
            className="login-form"
            initialValues={{
              tag: '',
            }}
          >
            <Form.Item name={'tag'} style={{ marginBottom: '10px' }} hasFeedback>
              <Input placeholder={'tag'} />
            </Form.Item>

            <div style={{ marginTop: '20px' }}>
              <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                Create API Key
              </Button>
            </div>
          </FormExt>
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
)(ProfileAPIKeys);
