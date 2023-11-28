import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn, needsGotoBilling } from '../../stores/reducers/authUser';
import FormExt from '../FormExt/FormExt';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./LoginVerifyAccount.module.css');
const sd = require('../antdUseDark.module.css');

interface ILoginVerifyAccountProps {
  paramsProp?: any;
}

interface ILoginVerifyAccountState {
  isRefreshing?: boolean;
}

class LoginVerifyAccount extends React.PureComponent<ILoginVerifyAccountProps, ILoginVerifyAccountState> {
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleSubmit = (values) => {
    let verificationToken = values.verificationToken;

    this.setState({
      isRefreshing: true,
    });

    let { paramsProp } = this.props;
    let userId = paramsProp && paramsProp.get('userId');

    Utils.askRecaptcha('verifyaccount', (token) => {
      REClient_.client_()._verifyAccount(userId, verificationToken, token, (errVerify, resVerify) => {
        this.setState({
          isRefreshing: false,
        });

        if (errVerify || !resVerify) {
          REActions.addNotificationError(errVerify || Constants.errorDefault);
        } else {
          const orgId = resVerify?.result?.organization?.organizationId;
          const result1 = resVerify?.result;
          const alreadyOnOrg = orgId != null && orgId != '0' && orgId !== '';

          StoreActions.getAuthUser_(() => {
            if (alreadyOnOrg) {
              Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
            } else {
              let authUser1 = calcAuthUserIsLoggedIn();
              if (!authUser1?.canJoinOrg && needsGotoBilling(result1)) {
                Location.push('/' + PartsLink.finish_billing);
              } else {
                Location.push('/' + PartsLink.workspace_join);
              }
            }
          });
        }
      });
    });
  };

  onClickResetVerificationEmail = (e) => {
    let { paramsProp } = this.props;
    if (!paramsProp) {
      return;
    }

    Utils.askRecaptcha('resendverification', (token) => {
      REClient_.client_()._resendVerification(paramsProp.get('userId'), token, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Check your email for the new verification code');
        }
      });
    });
  };

  render() {
    let { paramsProp } = this.props;

    let partEmail = null;
    if (paramsProp && paramsProp.get('email')) {
      partEmail = '/' + paramsProp.get('email');
    }

    let disableAll = !Utils.isNullOrEmpty(paramsProp?.get('verificationToken'));
    // if(paramsProp?.get('userId') && partEmail) {
    disableAll = false;
    // }

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <RefreshAndProgress isRelative={true} isRefreshing={this.state.isRefreshing}>
          <div style={{ color: Utils.isDark() ? 'white' : 'black', fontSize: '26px', marginBottom: 30 + 'px' }}>
            <div style={{ display: 'table', margin: '0 auto' }}>
              <span style={{ display: 'table-cell' }}>
                <div style={{ textAlign: 'center', lineHeight: '32px', width: window['isMobile'] ? '' : '420px' }}>
                  Verify Account
                  <div style={{ textAlign: 'center', fontSize: '14px' }}>Check your email{partEmail != null ? ' (' + partEmail.substring(1) + ') ' : ' '}for the verification code.</div>
                </div>
              </span>
            </div>
          </div>

          <div style={{ padding: '40px', maxWidth: window['isMobile'] ? '420px' : '', width: window['isMobile'] ? '' : '420px' }} className={sd.grayPanel}>
            <FormExt
              layout={'vertical'}
              ref={this.formRef}
              onFinish={this.handleSubmit}
              className="login-form"
              initialValues={{
                verificationToken: (paramsProp && paramsProp.get('verificationToken')) || '',
              }}
            >
              <Form.Item
                rules={[{ required: true, message: 'Verification Code Required' }]}
                name={'verificationToken'}
                style={{ marginBottom: '1px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Verification Code</span>}
              >
                <Input placeholder="" disabled={disableAll} />
              </Form.Item>

              <div style={{ marginTop: '20px' }}>
                <Button disabled={disableAll} htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                  Verify Account
                </Button>
              </div>

              <div style={{ display: 'table', margin: '0 auto' }}>
                <span style={{ display: 'table-cell' }}>
                  <div style={{ color: 'white', marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>Didn{"'"}t Receive the Email? Please check your promos/spam folder.</div>
                </span>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <span className={sd.linkBlue} onClick={this.onClickResetVerificationEmail}>
                  Resend verification code
                </span>
              </div>
            </FormExt>
          </div>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
  }),
  null,
)(LoginVerifyAccount);
