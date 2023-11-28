import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import { default as Input } from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import * as React from 'react';
import { connect } from 'react-redux';

import styled from '@emotion/styled';

import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import SocialAuthentication from '../Authentication/SocialAuthentication';
import FormExt from '../FormExt/FormExt';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';

const s = require('./LoginSignIn.module.css');
const sd = require('../antdUseDark.module.css');

const { confirm } = Modal;

interface ILoginSignInProps {
  paramsProp?: any;
  signupToken?: any;
}

interface ILoginSignInState {
  isRefreshing?: boolean;
  needInvite?: boolean;
  errorGoogleHttps?: boolean;
  googleInvalidDomain?: boolean;
  googleInvalidCookie?: boolean;
  isModalOpen?: boolean;
}

class LoginSignIn extends React.PureComponent<ILoginSignInProps, ILoginSignInState> {
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      needInvite: false,
    };
  }

  needInvite = () => {
    this.setState({
      needInvite: true,
    });
  };

  updateIsRefreshing = (isRefreshing: boolean) => {
    this.setState({ isRefreshing });
  };

  handleSubmit = (values) => {
    let email = values.email;
    let password = values.password;

    this.setState({
      isRefreshing: true,
    });

    Utils.askRecaptcha('signin', (token) => {
      REClient_.client_()._signIn(email, password, token, (errSign, resSign?: any) => {
        this.setState({
          isRefreshing: false,
        });

        let validationRequired = resSign?.validationRequired === true;

        if (resSign?.pendingApproval) {
          this.setState({
            isModalOpen: true,
          });
        } else if (false && validationRequired) {
          let userIdres = resSign?.userId;
          if (!userIdres) {
            REActions.addNotificationError('Error retrieving user information');
            Location.push('/' + PartsLink.signin);
          } else {
            Location.push('/' + PartsLink.signin_verify_account + '/' + userIdres, undefined, 'email=' + Utils.encodeQueryParam(email));
          }
        } else {
          if (!validationRequired && (errSign || !resSign)) {
            if (resSign?.inviteRequired) {
              this.needInvite();
            }
            REActions.addNotificationError(errSign || Constants.errorDefault);
          } else {
            StoreActions.getAuthUser_(() => {
              let authUser1 = calcAuthUserIsLoggedIn();
              if (authUser1?.canUse && authUser1?.forceVerification) {
                Location.push('/' + PartsLink.signin_verify_account + '/' + Utils.encodeRouter(authUser1?.userId), undefined, 'email=' + Utils.encodeQueryParam(email));
              } else if (this.redirectToInvite()) {
                //
              } else {
                Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
              }
            });
          }
        }
      });
    });
  };

  redirectToInvite = () => {
    let inviteId = this.props.paramsProp?.get('inviteId');
    let organizationId = this.props.paramsProp?.get('organizationId');
    let email = this.props.paramsProp?.get('email');

    if (!inviteId || !organizationId || !email) {
      return false;
    } else {
      setTimeout(() => {
        Location.push('/' + PartsLink.accept_invite + '/' + Utils.encodeRouter(email) + '/' + Utils.encodeRouter(organizationId) + '/' + Utils.encodeRouter(inviteId));
      }, 100);
      return true;
    }
  };

  onClickRequestInvite = (e) => {
    LoginSignIn.doRequestAndShowMessage();
  };

  render() {
    let { paramsProp, signupToken } = this.props;
    let partEmail = '';
    if (this.formRef.current) {
      let email = this.formRef.current.getFieldValue('email');
      if (email) {
        partEmail = '/' + email;
      }
    }

    const isMobile = Utils.isMobile();
    const betaEmail = paramsProp?.get('betaEmail') === '1';

    return (
      <MainConatiner>
        <RefreshAndProgress isRelative={true} isRefreshing={this.state.isRefreshing} style={{ backgroundImage: isMobile ? 'linear-gradient(to top, #08325b, #091527)' : '' }}>
          <Banner isDark={Utils.isDark()} isMobile={isMobile}>
            Welcome Back
            <BannerSubTitle isMobile={isMobile}>Sign in to continue</BannerSubTitle>
            {betaEmail ? <BannerHelperText isMobile={isMobile}>You can already join an organization</BannerHelperText> : null}
            {false && !betaEmail ? <BannerHelperText isMobile={isMobile}>You can only sign-in and sign-up if you have an invite</BannerHelperText> : null}
            {this.state.needInvite ? (
              <RequestInviteHelperText isMobile={isMobile}>
                Please{' '}
                <span className={sd.linkBlue} onClick={this.onClickRequestInvite}>
                  request an invite
                </span>
              </RequestInviteHelperText>
            ) : null}
          </Banner>

          <SocialLoginContainer isMobile={isMobile} className={isMobile ? '' : sd.grayPanel}>
            <SocialAuthentication signupToken={this.props.signupToken} updateIsRefreshing={this.updateIsRefreshing} updateNeedInvite={this.needInvite} pageType={'login'} redirectToInvite={this.redirectToInvite} paramsProp={paramsProp} />

            <FormExt
              layout={'vertical'}
              ref={this.formRef}
              onFinish={this.handleSubmit}
              className={s.form1}
              initialValues={{
                email: paramsProp?.get('email') ?? '',
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
              <Form.Item
                rules={[
                  { required: true, message: <div>Password is required</div> },
                  { min: 8, message: <div>Password must be at least 8 characters</div> },
                  { pattern: /[a-zA-Z]/, message: <div>Password must have a letter</div> },
                  { pattern: /\d/, message: <div>Password must have a number</div> },
                ]}
                name={'password'}
                style={{ marginBottom: '10px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Password</span>}
              >
                <Input placeholder="" type={'password'} />
              </Form.Item>

              <LoginBtnWrapper>
                <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                  Sign In
                </Button>
              </LoginBtnWrapper>
            </FormExt>

            <ForgotPwdWrapper>
              <Link className={sd.linkBlue} to={'/' + PartsLink.signin_reset_password + partEmail}>
                <ForgotPwdContent isMobile={isMobile}>Forgot your password?</ForgotPwdContent>
              </Link>
            </ForgotPwdWrapper>

            <FreeTrailWrapper>
              <Link className={sd.linkBlue} to={'/' + PartsLink.signup + (signupToken ? '?signupToken=' + signupToken : '')}>
                <FreeTrailContent isMobile={isMobile}>Start your Free Trial?</FreeTrailContent>
              </Link>
            </FreeTrailWrapper>
          </SocialLoginContainer>
        </RefreshAndProgress>
        <Modal
          width={320}
          bodyStyle={{ height: 120 }}
          title="Thanks for signing up"
          open={this.state.isModalOpen}
          okText="Back to home page"
          onCancel={() => {
            this.setState({ isModalOpen: false });
          }}
          onOk={() => {
            this.setState({ isModalOpen: false });
            window.location.href = '/';
          }}
          cancelButtonProps={{ style: { display: 'none' } }}
          okButtonProps={{ style: { textAlign: 'center' } }}
        >
          <div>We have received your sign up request. We will review your request and get back to you shortly.</div>
        </Modal>
      </MainConatiner>
    );
  }

  static doRequestAndShowMessage = () => {
    window.location.href = '/?requestaccess=1';
  };
}

const MainConatiner = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Banner = styled.div<{ isDark: boolean; isMobile: boolean }>`
  color: ${(props) => (props.isDark ? 'white' : 'black')};
  font-size: 26px;
  margin-bottom: 10px;
  margintop: ${(props) => (props.isMobile ? '140px' : '0px')};
  display: flex;
  flex-direction: column;
  line-height: 32px;
  justify-content: center;
  align-items: center;
`;

const BannerSubTitle = styled.div<{ isMobile: boolean }>`
  font-size: ${(props) => `${14 + (props.isMobile ? 2 : 0)}px`};
`;

const BannerHelperText = styled.div<{ isMobile: boolean }>`
  font-size: ${(props) => `${14 + (props.isMobile ? 2 : 0)}px`};
  margin: 20px 20px 0 20px;
  opacity: 0.8;
`;

const RequestInviteHelperText = styled.div<{ isMobile: boolean }>`
  margin-top: 10px;
  font-size: ${(props) => `${14 + (props.isMobile ? 2 : 0)}px`};
`;

const SocialLoginContainer = styled.div<{ isMobile: boolean }>`
  padding: ${(props) => (props.isMobile ? '10px 40px' : '40px')};
  max-width: ${(props) => (props.isMobile ? '420px' : 'none')};
  width: ${(props) => (props.isMobile ? 'none' : '420px')};
  margin-bottom: ${(props) => (props.isMobile ? '30px' : '0px')};
`;

const LoginBtnWrapper = styled.div`
  margin-top: 20px;
`;

const ForgotPwdWrapper = styled.div`
  padding-top: 20px;
  text-align: center;
`;

const ForgotPwdContent = styled.span<{ isMobile: boolean }>`
  font-size: ${(props) => `${14 + (props.isMobile ? 2 : 0)}px`};
`;

const FreeTrailWrapper = styled.div`
  font-size: 14px;
  padding-top: 50px;
  padding-bottom: 50px;
  text-align: center;
`;

const FreeTrailContent = styled.span<{ isMobile: boolean }>`
  font-size: ${(props) => `${14 + (props.isMobile ? 2 : 0)}px`};
`;

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
  }),
  null,
)(LoginSignIn);
