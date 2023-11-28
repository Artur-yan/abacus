import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as React from 'react';
import { connect } from 'react-redux';

import styled from '@emotion/styled';

import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import SocialAuthentication from '../Authentication/SocialAuthentication';
import FormExt from '../FormExt/FormExt';
import Link from '../Link/Link';
import LoginSignIn from '../LoginSignIn/LoginSignIn';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';

const s = require('./LoginSignUp.module.css');
const sd = require('../antdUseDark.module.css');

interface ILoginSignUpProps {
  paramsProp?: any;
  isInvite?: boolean;
  signupToken?: any;
  email?: any;
  authUser?: any;
  amznMarketplaceToken?: any;
}

interface ILoginSignUpState {
  isRefreshing?: boolean;
  needInvite?: boolean;
  userExistsForInviteChecked?: boolean;
  isModalOpen?: boolean;
}

class LoginSignUp extends React.PureComponent<ILoginSignUpProps, ILoginSignUpState> {
  private acceptedInviteAlready: boolean;
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      needInvite: false,
    };
  }

  handleSubmit = (values) => {
    let name = values.name;
    let email = values.email;
    let password = values.password;

    Utils.askRecaptcha('signup', (token) => {
      this.setState({
        isRefreshing: true,
      });

      let { paramsProp } = this.props;

      if (this.props.isInvite) {
        REClient_.client_().acceptInvite(email, paramsProp && paramsProp.get('organizationId'), paramsProp && paramsProp.get('inviteId'), name, password, paramsProp && paramsProp.get('inviteToken'), (errInvite, resInvite) => {
          this.setState({
            isRefreshing: false,
          });

          if (errInvite || !resInvite) {
            REActions.addNotificationError(errInvite || Constants.errorDefault);
          } else {
            let userIdres = resInvite?.result?.userId;
            if (userIdres == null) {
              userIdres = '/1111';
            } else {
              userIdres = '/' + userIdres;
            }

            StoreActions.getAuthUser_(() => {
              Location.push('/' + PartsLink.welcome);
            });
            // Location.push('/' + PartsLink.signin_verify_account + userIdres, undefined, 'email=' + Utils.encodeQueryParam(email));
          }
        });
      } else {
        REClient_.client_()._createAccount(name, email, password, token, this.props.signupToken, this.props?.amznMarketplaceToken, (errAddUser, resAddUser) => {
          this.setState({
            isRefreshing: false,
          });

          if (resAddUser?.pendingApproval) {
            this.setState({
              isModalOpen: true,
            });
          } else if (errAddUser || !resAddUser || !resAddUser.result) {
            if (resAddUser?.inviteRequired) {
              this.needInvite();
            }

            REActions.addNotificationError(errAddUser || Constants.errorDefault);
          } else {
            const orgId = resAddUser?.result?.organization?.organizationId;
            const alreadyOnOrg = orgId != null && orgId != '0' && orgId !== '';

            if (alreadyOnOrg) {
              StoreActions.getAuthUser_(() => {
                Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
              });
            } else {
              let userIdres = resAddUser?.result?.userId;
              if (userIdres == null) {
                userIdres = '';
              } else {
                userIdres = '/' + userIdres;
              }

              if (resAddUser?.result?.forceVerification) {
                Location.push('/' + PartsLink.signin_verify_account + userIdres, undefined, 'email=' + Utils.encodeQueryParam(email));
              } else {
                StoreActions.getAuthUser_(() => {
                  Location.push('/' + PartsLink.finish_billing);
                });
              }
            }
          }
        });
      }
    });
  };

  needInvite = () => {
    this.setState({
      needInvite: true,
    });
  };

  updateIsRefreshing = (isRefreshing: boolean) => {
    this.setState({ isRefreshing });
  };

  onClickRequestInvite = (e) => {
    LoginSignIn.doRequestAndShowMessage();
  };

  memAuth = memoizeOne((authUser) => {
    if (authUser) {
      if (authUser.get('neverDone') !== false || authUser.get('isRefreshing')) {
        return null;
      } else {
        let res = authUser.get('isLoggedIn') === true;

        let token = this.props.paramsProp?.get('inviteId');
        if (res === true && !Utils.isNullOrEmpty(token) && !this.acceptedInviteAlready) {
          this.acceptedInviteAlready = true;

          setTimeout(() => {
            REClient_.client_().acceptInviteLoggedIn(token, (err, res) => {
              if (err || !res) {
                REActions.addNotificationError(err || Constants.errorDefault);
              } else {
                StoreActions.refreshAll_();
                Location.push('/' + PartsLink.project_list);
              }
            });
          }, 0);
          return null;
        }
        return res;
      }
    }
  });

  memInviteType = memoizeOne((inviteId, userExistsForInviteChecked) => {
    if (userExistsForInviteChecked) {
      return true;
    }

    if (inviteId) {
      REClient_.client_()._inviteUserExists(inviteId, (err, res) => {
        if (!err && res?.result === true) {
          setTimeout(() => {
            Location.push(
              '/' + PartsLink.signin + '/' + Utils.encodeRouter(this.props.paramsProp?.get('email')),
              undefined,
              'inviteId=' + Utils.encodeQueryParam(this.props.paramsProp?.get('inviteId')) + '&organizationId=' + Utils.encodeQueryParam(this.props.paramsProp?.get('organizationId')),
            );
          }, 0);
        } else {
          this.setState({
            userExistsForInviteChecked: true,
          });
        }
      });
      return false;
    } else {
      return true;
    }
  });

  render() {
    let { paramsProp, isInvite, email } = this.props;

    let isLoggedIn = this.memAuth(this.props.authUser);
    if (isInvite) {
      if (isLoggedIn === false) {
        if (!this.memInviteType(this.props.paramsProp?.get('inviteId'), this.state.userExistsForInviteChecked)) {
          return <div></div>;
        }
      } else {
        return <div></div>;
      }
    }

    const isMobile = Utils.isMobile();

    return (
      <MainConatiner isLoggedIn={isLoggedIn}>
        <RefreshAndProgress isRelative={true} isRefreshing={this.state.isRefreshing} style={{ backgroundImage: isMobile ? 'linear-gradient(to top, #08325b, #091527)' : '' }}>
          <Banner isDark={Utils.isDark()} isMobile={isMobile}>
            <div>{isInvite ? 'Accept Invite' : 'Start your Free Trial'}</div>

            {false && !isInvite ? <BannerHelperText isMobile={isMobile}>You can only sign-in and sign-up if you have an invite</BannerHelperText> : null}
            {!isInvite && this.state.needInvite ? (
              <RequestInviteHelperText>
                Please{' '}
                <span className={sd.linkBlue} onClick={this.onClickRequestInvite}>
                  request an invite
                </span>
              </RequestInviteHelperText>
            ) : null}
          </Banner>

          <SocialLoginContainer isMobile={isMobile} className={isMobile ? '' : sd.grayPanel}>
            {!isInvite ? (
              <SocialAuthentication
                amznMarketplaceToken={this.props.amznMarketplaceToken}
                signupToken={this.props.signupToken}
                isInvite={this.props.isInvite}
                updateIsRefreshing={this.updateIsRefreshing}
                updateNeedInvite={this.needInvite}
                pageType={'signup'}
              />
            ) : null}

            <FormExt
              layout={'vertical'}
              ref={this.formRef}
              onFinish={this.handleSubmit}
              className={s.form1}
              initialValues={{
                email: (isInvite ? paramsProp && paramsProp.get('email') : email) || '',
              }}
            >
              <Form.Item rules={[{ required: true, message: 'Name is required' }]} name={'name'} style={{ marginBottom: '1px' }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Name</span>}>
                <Input placeholder="" autoComplete={'name'} />
              </Form.Item>
              <Form.Item
                rules={[
                  { type: 'email', message: 'Email is invalid' },
                  { required: true, message: 'Email is required' },
                ]}
                name={'email'}
                style={{ marginBottom: '1px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Email</span>}
              >
                <Input disabled={isInvite} placeholder="" autoComplete={'email'} />
              </Form.Item>
              <Form.Item
                validateFirst={true}
                rules={[
                  { required: true, message: <div>Password is required</div> },
                  { min: 8, message: <div>Password must be at least 8 characters</div> },
                  { pattern: /[a-z]/, message: <div>Password must have a lowercase letter</div> },
                  { pattern: /[A-Z]/, message: <div>Password must have a uppercase letter</div> },
                  {
                    pattern: /[!@#$%^&*()_+\-=[\]{}|']/,
                    message: <div>Password must have a special character</div>,
                  },
                  { pattern: /\d/, message: <div>Password must have a number</div> },
                ]}
                name={'password'}
                style={{ marginBottom: '10px' }}
                hasFeedback
                label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Password</span>}
              >
                <Input placeholder="" type={'password'} />
              </Form.Item>

              <SignupBtnWrapper>
                <Button id={'signupForm'} htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                  Sign Up
                </Button>
              </SignupBtnWrapper>
            </FormExt>

            <SigninAccountWrapper isMobile={isMobile}>
              Already have an account,{' '}
              <Link className={sd.linkBlue} to={'/' + PartsLink.signin}>
                sign in here
              </Link>
            </SigninAccountWrapper>
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
}

const MainConatiner = styled.div<{ isLoggedIn?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: ${(props) => (props.isLoggedIn == null ? 'none' : 'flex')};
  justify-content: center;
  align-items: center;
`;

const Banner = styled.div<{ isDark: boolean; isMobile: boolean }>`
  color: ${(props) => (props.isDark ? 'white' : 'black')};
  font-size: 26px;
  margin-bottom: 30px;
  margintop: ${(props) => (props.isMobile ? '140px' : '0px')};
  display: flex;
  flex-direction: column;
  line-height: 32px;
  justify-content: center;
  align-items: center;
`;

const BannerHelperText = styled.div<{ isMobile: boolean }>`
  font-size: ${(props) => `${14 + (props.isMobile ? 2 : 0)}px`};
  margin: 20px 20px 0 20px;
  opacity: 0.8;
`;

const RequestInviteHelperText = styled.div`
  margin-top: 10px;
  font-size: 14px;
`;

const SocialLoginContainer = styled.div<{ isMobile: boolean }>`
  padding: ${(props) => (props.isMobile ? '10px 40px' : '40px')};
  max-width: ${(props) => (props.isMobile ? '420px' : 'none')};
  width: ${(props) => (props.isMobile ? 'none' : '420px')};
  margin-bottom: ${(props) => (props.isMobile ? '30px' : '0px')};
`;

const SignupBtnWrapper = styled.div`
  margin-top: 20px;
`;

const SigninAccountWrapper = styled.div<{ isMobile: boolean }>`
  font-size: ${(props) => `${14 + (props.isMobile ? 2 : 0)}px`};
  margin-top: 50px;
  text-align: center;
`;

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }),
  null,
)(LoginSignUp);
