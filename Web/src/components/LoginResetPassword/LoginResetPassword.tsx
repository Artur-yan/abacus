import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as React from 'react';
import { connect } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import FormExt from '../FormExt/FormExt';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./LoginResetPassword.module.css');
const sd = require('../antdUseDark.module.css');

interface ILoginResetPasswordProps {
  paramsProp?: any;
}

interface ILoginResetPasswordState {
  isRefreshing?: boolean;
}

class LoginResetPassword extends React.PureComponent<ILoginResetPasswordProps, ILoginResetPasswordState> {
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
    let email = values.email;

    this.setState({
      isRefreshing: true,
    });

    Utils.askRecaptcha('reset', (token) => {
      REClient_.client_()._resetPasswordRequest(email, token, (errPass, resPass) => {
        this.setState({
          isRefreshing: false,
        });
        if (errPass || !resPass) {
          REActions.addNotificationError(errPass || Constants.errorDefault);
        } else {
          REActions.addNotification('Check your email to reset your password!');
        }
      });
    });
  };

  render() {
    let { paramsProp } = this.props;

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <RefreshAndProgress isRelative={true} isRefreshing={this.state.isRefreshing}>
          <div style={{ color: Utils.isDark() ? 'white' : 'black', fontSize: '26px', marginBottom: 30 + 'px' }}>
            <div style={{ display: 'table', margin: '0 auto' }}>
              <span style={{ display: 'table-cell' }}>
                <div style={{ textAlign: 'left', lineHeight: '32px' }}>Reset Password</div>
              </span>
            </div>
          </div>

          <div style={{ padding: '40px', width: '420px' }} className={sd.grayPanel}>
            <FormExt
              layout={'vertical'}
              ref={this.formRef}
              onFinish={this.handleSubmit}
              className="login-form"
              initialValues={{
                email: (paramsProp && paramsProp.get('email')) || '',
              }}
            >
              <Form.Item
                rules={[
                  { type: 'email', message: 'Email is not valid' },
                  { required: true, message: 'Email is required' },
                ]}
                name={'email'}
                style={{ marginBottom: '1px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Email</span>}
              >
                <Input placeholder="" />
              </Form.Item>

              <div style={{ marginTop: '20px' }}>
                <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                  Send email to reset password
                </Button>
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
)(LoginResetPassword);
