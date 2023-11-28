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
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import { UserProfileSection } from '../UserProfile/UserProfile';
const s = require('./LoginSetNewEmail.module.css');
const sd = require('../antdUseDark.module.css');

interface ILoginSetNewEmailProps {
  paramsProp?: any;
}

interface ILoginSetNewEmailState {
  isRefreshing?: boolean;
}

class LoginSetNewEmail extends React.PureComponent<ILoginSetNewEmailProps, ILoginSetNewEmailState> {
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

    let { paramsProp } = this.props;

    REClient_.client_()._updateEmail(email, (errPass, resPass) => {
      this.setState({
        isRefreshing: false,
      });
      if (errPass || !resPass) {
        REActions.addNotificationError(errPass || Constants.errorDefault);
      } else {
        REActions.addNotification('Email changed');
        StoreActions.getAuthUser_(() => {
          Location.push('/' + PartsLink.profile + '/' + UserProfileSection.general);
        });
      }
    });
  };

  compareToFirstEmail = ({ getFieldValue }) => ({
    validator(rule, value) {
      if (value && value !== getFieldValue('email')) {
        return Promise.reject('The emails do not match');
      } else {
        return Promise.resolve();
      }
    },
  });

  render() {
    let { paramsProp } = this.props;

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <RefreshAndProgress isRelative={true} isRefreshing={this.state.isRefreshing}>
          <div style={{ color: Utils.isDark() ? 'white' : 'black', fontSize: '26px', marginBottom: 30 + 'px' }}>
            <div style={{ display: 'table', margin: '0 auto' }}>
              <span style={{ display: 'table-cell' }}>
                <div style={{ textAlign: 'left', lineHeight: '32px' }}>Set new email</div>
              </span>
            </div>
          </div>

          <div style={{ padding: '40px', width: '420px' }} className={sd.grayPanel}>
            <FormExt layout={'vertical'} ref={this.formRef} onFinish={this.handleSubmit} className="login-form" initialValues={{ email: paramsProp?.get('email') ?? '', email2: paramsProp?.get('email') ?? '' }}>
              <Form.Item
                rules={[
                  { type: 'email', message: <div>Email is not valid</div> },
                  { required: true, message: <div>Email is required</div> },
                ]}
                name={'email'}
                style={{ marginBottom: '1px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Email</span>}
              >
                <Input placeholder="" type={'email'} />
              </Form.Item>
              <Form.Item
                rules={[{ type: 'email', message: <div>Email is not valid</div> }, { required: true, message: <div>Email is required</div> }, this.compareToFirstEmail]}
                name={'email2'}
                style={{ marginBottom: '1px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Repeat Email</span>}
              >
                <Input placeholder="" type={'email'} />
              </Form.Item>

              <div style={{ marginTop: '20px' }}>
                <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                  Set new email
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
)(LoginSetNewEmail);
