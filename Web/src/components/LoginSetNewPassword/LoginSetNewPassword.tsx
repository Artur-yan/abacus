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
import FormExt from '../FormExt/FormExt';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import { UserProfileSection } from '../UserProfile/UserProfile';
const s = require('./LoginSetNewPassword.module.css');
const sd = require('../antdUseDark.module.css');

interface ILoginSetNewPasswordProps {
  paramsProp?: any;
  isChange?: boolean;
}

interface ILoginSetNewPasswordState {
  isRefreshing?: boolean;
  showResetPassword?: boolean;
}

class LoginSetNewPassword extends React.PureComponent<ILoginSetNewPasswordProps, ILoginSetNewPasswordState> {
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      showResetPassword: false,
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleSubmit = (values) => {
    let password = values.password;

    this.setState({
      isRefreshing: true,
    });

    let { paramsProp } = this.props;

    if (this.props.isChange) {
      let passwordOld = values.passwordOld;

      REClient_.client_()._setNewPassword(passwordOld, password, (errPass, resPass) => {
        this.setState({
          isRefreshing: false,
        });
        if (errPass || !resPass) {
          REActions.addNotificationError(errPass || Constants.errorDefault);
          this.setState({
            showResetPassword: true,
          });
        } else {
          REActions.addNotification('Password changed');
          StoreActions.getAuthUser_(() => {
            Location.push('/' + PartsLink.profile + '/' + UserProfileSection.general);
          });
        }
      });
      return;
    }

    //
    let userId = paramsProp && paramsProp.get('userId');
    let token = paramsProp && paramsProp.get('token');
    if (Utils.isNullOrEmpty(token) || Utils.isNullOrEmpty(userId)) {
      this.setState({
        isRefreshing: false,
      });
      REActions.addNotificationError('Error with reCaptcha');
    } else {
      REClient_.client_()._resetPassword(userId, token, password, (errPass, resPass) => {
        this.setState({
          isRefreshing: false,
        });
        if (errPass || !resPass) {
          REActions.addNotificationError(errPass || Constants.errorDefault);
        } else {
          REActions.addNotification('Password changed');
          StoreActions.getAuthUser_(() => {
            Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
          });
        }
      });
    }
  };

  compareToFirstPassword = ({ getFieldValue }) => ({
    validator(rule, value) {
      if (value && value !== getFieldValue('password')) {
        return Promise.reject('The passwords do not match');
      } else {
        return Promise.resolve();
      }
    },
  });

  render() {
    let { paramsProp, isChange } = this.props;

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <RefreshAndProgress isRelative={true} isRefreshing={this.state.isRefreshing}>
          <div style={{ color: Utils.isDark() ? 'white' : 'black', fontSize: '26px', marginBottom: 30 + 'px' }}>
            <div style={{ display: 'table', margin: '0 auto' }}>
              <span style={{ display: 'table-cell' }}>
                <div style={{ textAlign: 'left', lineHeight: '32px' }}>Set new password</div>
              </span>
            </div>
          </div>

          <div style={{ padding: '40px', width: '420px' }} className={sd.grayPanel}>
            <FormExt layout={'vertical'} ref={this.formRef} onFinish={this.handleSubmit} className="login-form" initialValues={{}}>
              {isChange === true && (
                <Form.Item
                  name={'passwordOld'}
                  style={{ marginBottom: '1px' }}
                  hasFeedback
                  label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Current Password</span>}
                  rules={[{ required: true, message: <div>Password is required</div> }]}
                >
                  <Input placeholder="" type={'password'} />
                </Form.Item>
              )}

              <Form.Item
                rules={[
                  { required: true, message: <div>Password is required</div> },
                  { min: 8, message: <div>Password must be at least 8 characters</div> },
                  { pattern: /[a-z]/, message: <div>Password must have a lowercase letter</div> },
                  { pattern: /[A-Z]/, message: <div>Password must have a uppercase letter</div> },
                  { pattern: /[!@#$%^&*()_+\-=[\]{}|']/, message: <div>Password must have a special character</div> },
                  { pattern: /\d/, message: <div>Password must have a number</div> },
                ]}
                name={'password'}
                style={{ marginBottom: '1px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Password</span>}
              >
                <Input placeholder="" type={'password'} />
              </Form.Item>
              <Form.Item
                rules={[{ required: true, message: 'Password required!' }, this.compareToFirstPassword]}
                name={'password2'}
                style={{ marginBottom: '1px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Repeat Password</span>}
              >
                <Input placeholder="" type={'password'} />
              </Form.Item>

              <div style={{ marginTop: '20px' }}>
                <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                  Set new password
                </Button>
              </div>
            </FormExt>
          </div>
          {this.state.showResetPassword === true && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to={'/' + PartsLink.signin_reset_password}>
                <span className={sd.styleTextGray} style={{ cursor: 'pointer' }}>
                  Reset Password
                </span>
              </Link>
            </div>
          )}
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
)(LoginSetNewPassword);
