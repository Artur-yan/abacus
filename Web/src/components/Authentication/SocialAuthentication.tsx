import { default as InputNumber } from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import React, { useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useDispatch, useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { needsGotoBilling } from '../../stores/reducers/authUser';
import PartsLink from '../NavLeft/PartsLink';
import Oauth from '../Oauth/Oauth';

export interface SocailAuthenticationProps {
  signupToken: string;
  pageType: 'login' | 'signup';
  updateIsRefreshing: (isRefreshing: boolean) => void;
  updateNeedInvite: () => void;
  isInvite?: boolean;
  amznMarketplaceToken?: string;
  paramsProp?: any;
  redirectToInvite?: () => boolean;
}

const SocialAuthentication = ({ signupToken, amznMarketplaceToken, isInvite, updateIsRefreshing, updateNeedInvite, pageType, redirectToInvite, paramsProp }: SocailAuthenticationProps) => {
  const dispatch = useDispatch();
  const authUser = useSelector((state: any) => state.authUser);
  const initialize2FA = authUser?.getIn?.(['twoFactorAuthentication', 'initialize']);

  const [oauth_handler] = useState(new Oauth());
  const [errorGoogleHttps, setErrorGoogleHttps] = useState<boolean>();
  const [googleInvalidDomain, _setGoogleInvalidDomain] = useState<boolean>();
  const [googleInvalidCookie, _setGoogleInvalidCookie] = useState<boolean>();

  const isMobile = Utils.isMobile();
  const sendSms = () => {
    REClient_.client_()._start2faSMS((err, res) => {
      if (!err) {
        REActions.addNotification('2-Factor SMS sent');
      }
    });
  };
  const onClickGithubSignIn = (e) => {
    oauth_handler.openOauth('https://github.com/login/oauth/authorize', Constants.ssoClientIds?.github || '8dd0ef1c7298a545fb02', ['read:user', 'user:email'], ['response_type=code'], doGithubSignin);
  };

  const onClickOktaSignIn = (e) => {
    oauth_handler.openOauth(
      'https://' + (Constants.ssoClientUrls?.okta || 'dev-kkhyscwx.us.auth0.com') + '/authorize',
      Constants.ssoClientIds?.okta || 'M118iw76wVQ0wR6tonBrb8lH94IlU6F2',
      ['openid', 'profile', 'email'],
      ['response_type=code'],
      doOktaSignin,
    );
  };

  const onClickAzureSignIn = (e) => {
    oauth_handler.openOauth(
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      Constants.ssoClientIds?.azure || 'b89bbf6f-22a7-4b66-9bcf-6a80edf04dc5',
      ['User.ReadBasic.All', 'offline_access', 'openid', 'profile'],
      ['response_type=code'],
      doAzureSignin,
    );
  };

  const doGithubSignin = (code) => {
    if (code) {
      updateIsRefreshing(true);

      REClient_.client_()._githubSignIn(code, signupToken, pageType === 'login' ? null : amznMarketplaceToken, (err, res) => {
        updateIsRefreshing(false);

        if (err || !res) {
          if (res?.inviteRequired) {
            updateNeedInvite();
          }
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          const orgId = res?.result?.organization?.organizationId;
          const result1 = res?.result;
          const alreadyOnOrg = orgId != null && orgId != '0' && orgId !== '';

          StoreActions.getAuthUser_(() => {
            if (pageType === 'login' && redirectToInvite?.()) {
              //
            } else if (alreadyOnOrg) {
              Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
            } else {
              if (needsGotoBilling(result1)) {
                Location.push('/' + PartsLink.finish_billing);
              } else {
                Location.push('/' + PartsLink.workspace_join);
              }
            }
          });
        }
      });
    }
  };

  const doOktaSignin = (code) => {
    if (code) {
      updateIsRefreshing(true);
      REClient_.client_()._oktaSignin(code, signupToken, pageType === 'login' ? null : amznMarketplaceToken, (err, res) => {
        updateIsRefreshing(false);

        if (err || !res) {
          if (res?.inviteRequired) {
            updateNeedInvite();
          }
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          const orgId = res?.result?.organization?.organizationId;
          const result1 = res?.result;
          const alreadyOnOrg = orgId != null && orgId != '0' && orgId !== '';

          StoreActions.getAuthUser_(() => {
            if (pageType === 'login' && redirectToInvite?.()) {
              //
            } else if (alreadyOnOrg) {
              Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
            } else {
              if (needsGotoBilling(result1)) {
                Location.push('/' + PartsLink.finish_billing);
              } else {
                Location.push('/' + PartsLink.workspace_join);
              }
            }
          });
        }
      });
    }
  };

  const doAzureSignin = (code) => {
    if (code) {
      updateIsRefreshing(true);

      REClient_.client_()._azureSignIn(code, signupToken, pageType === 'login' ? null : amznMarketplaceToken, (err, res) => {
        updateIsRefreshing(false);

        if (err || !res) {
          if (res?.inviteRequired) {
            updateNeedInvite();
          }
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          const orgId = res?.result?.organization?.organizationId;
          const result1 = res?.result;
          const alreadyOnOrg = orgId != null && orgId != '0' && orgId !== '';

          StoreActions.getAuthUser_(() => {
            if (pageType === 'login' && redirectToInvite?.()) {
              //
            } else if (alreadyOnOrg) {
              Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
            } else {
              if (needsGotoBilling(result1)) {
                Location.push('/' + PartsLink.finish_billing);
              } else {
                Location.push('/' + PartsLink.workspace_join);
              }
            }
          });
        }
      });
    }
  };

  const onGoogleSignInAndUp = (authResult?: any) => {
    if (!authResult) {
      return;
    }

    let token = authResult.credential;
    if (token) {
      updateIsRefreshing(true);

      REClient_.client_()._googleSignIn(token, signupToken, amznMarketplaceToken, (err, res) => {
        updateIsRefreshing(false);

        if (err || !res) {
          if (res?.inviteRequired) {
            updateNeedInvite();
          }

          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          const orgId = res?.result?.organization?.organizationId;
          const result1 = res?.result;
          const alreadyOnOrg = Boolean(orgId) && orgId != '0';

          StoreActions.getAuthUser_(() => {
            if (pageType === 'login' && redirectToInvite()) {
              //
            } else if (alreadyOnOrg) {
              Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
            } else {
              if (needsGotoBilling(result1)) {
                Location.push('/' + PartsLink.finish_billing);
              } else {
                Location.push('/' + PartsLink.workspace_join);
              }
            }
          });
        }
      });
    } else {
      Utils.error(authResult);
    }
  };

  const initializeAndRenderGoogle = () => {
    let doSignWork = (cbFinish?) => {
      let res = false;
      const google = window['google'];
      if (google) {
        google.accounts.id.initialize({
          client_id: Constants.ssoClientIds?.google || '528577992200-o78lkkg5l8jbass2s4nmo88ictavvs55.apps.googleusercontent.com',
          callback: onGoogleSignInAndUp,
        });
        google.accounts.id.renderButton(document.getElementById('google_id_onload'), { theme: 'filled_blue', size: 'medium', width: Utils.isMobile() ? 340 - 2 * 20 : 340, text: pageType === 'login' ? 'signin_with' : 'signup_with' });
      } else {
        cbFinish?.(res);
      }
    };

    let max = 50;
    let timeDo = (time?) => {
      max--;
      if (max < 0) {
        return;
      }

      setTimeout(() => {
        doSignWork((res) => {
          if (!res || !Constants.ssoClientIds?.google) {
            timeDo(200);
          }
        });
      }, time || 30);
    };

    if (window.location.protocol?.toLowerCase() === 'http:' && window.location.host && window.location.host.toLowerCase().indexOf('abacus.ai') === -1 && !Constants.flags.onprem) {
      setTimeout(() => {
        setErrorGoogleHttps(true);
      }, 0);
    } else {
      timeDo();
    }
  };

  const openTwoFactorAuthModal = () => {
    let code = '';
    Modal.confirm({
      title: '2-Factor Login',
      okText: 'Submit',
      okType: 'primary',
      cancelText: 'Cancel',
      maskClosable: true,
      // @ts-ignore
      confirmLoading: true,
      content: (
        <div>
          <div>Enter your 2-Factor Code</div>
          <div>
            <SendSmsBtn onClick={sendSms}>Send a token by SMS</SendSmsBtn>
          </div>
          <InputNumber
            maxLength={8}
            style={{ marginTop: '8px', color: 'black' }}
            placeholder={'token'}
            defaultValue={''}
            onChange={(e) => {
              code = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        return new Promise((resolve, reject) => {
          REClient_.client_()._validate2faToken(code, (err, res) => {
            if (err || !res.result) {
              REActions.addNotificationError('Invalid Token');
              reject();
            } else {
              resolve(null);
              REActions.addNotification('Success!');
              Location.push('/' + PartsLink.project_list);
            }
          });
        });
      },
      onCancel: () => {
        Utils.stop2FaTimer();
        StoreActions.userLogout_();
        Location.push('/signin');
      },
    });
  };

  useEffect(() => {
    switch (pageType) {
      case 'login':
        if (paramsProp?.get('models') === '1') {
          Utils.dataNum('models_signin_url', undefined, '/models/');
        }
        initializeAndRenderGoogle();
        break;
      case 'signup':
        if (!isInvite) {
          initializeAndRenderGoogle();
        }
        break;
    }
  }, [isInvite, pageType]);

  useEffect(() => {
    if (initialize2FA) {
      Utils.start2Fa(REClient_.client_()._start2faPush, REClient_.client_()._checkChallengeStatus);
      openTwoFactorAuthModal();
      dispatch({ type: StoreActions.INITIALIZE_2FA, payload: { initialize: false } });
    }
  }, [initialize2FA, authUser]);

  return (
    <>
      <SocialLoginWrapper pageType={pageType} isMobile={isMobile}>
        <GoogleLoginWrapper id={'gsignin'}>
          {errorGoogleHttps === true || googleInvalidDomain === true || googleInvalidCookie === true ? (
            <NotActiveButton>
              <SocialLoginIcon>
                <FontAwesomeIcon icon={require('@fortawesome/free-brands-svg-icons/faGoogle').faGoogle} transform={{ size: 20, x: 6.5, y: 0 }} style={{ margin: '1px 5px 1px 1px' }} />
              </SocialLoginIcon>
              <SocialLoginTextWrapper>
                {errorGoogleHttps === true ? 'Error: Google SignIn requires HTTPS protocol' : null}
                {googleInvalidDomain === true ? 'Error: Google SignIn domain not authorized' : null}
                {googleInvalidCookie === true ? 'Error: Google SignIn requires Cookies Enabled' : null}
              </SocialLoginTextWrapper>
            </NotActiveButton>
          ) : (
            <div id="google_id_onload"></div>
          )}
        </GoogleLoginWrapper>
        <div id={'githubsignin'} onClick={onClickGithubSignIn}>
          <GithubButton>
            <SocialLoginIcon>
              <FontAwesomeIcon icon={require('@fortawesome/free-brands-svg-icons/faGithub').faGithub} transform={{ size: 22, x: 6.5, y: 0 }} style={{ margin: '1px 5px 1px 1px' }} />
            </SocialLoginIcon>
            <SocialLoginTextWrapper>{pageType === 'login' ? 'Sign in' : 'Sign up'} with Github</SocialLoginTextWrapper>
          </GithubButton>
        </div>
        <div id={'oktasignin'} onClick={onClickOktaSignIn}>
          <OktaButton>
            <SocialLoginIcon>
              <img src="/static/imgs/okta_logo.png" style={{ paddingLeft: '3px' }} />
            </SocialLoginIcon>
            <SocialLoginTextWrapper>{pageType === 'login' ? 'Sign in' : 'Sign up'} with Okta</SocialLoginTextWrapper>
          </OktaButton>
        </div>
        <div id={'azuresignin'} onClick={onClickAzureSignIn}>
          <AzureButton>
            <SocialLoginIcon>
              <FontAwesomeIcon icon={require('@fortawesome/free-brands-svg-icons/faMicrosoft').faMicrosoft} transform={{ size: 22, x: 6.5, y: 0 }} style={{ margin: '1px 5px 1px 1px' }} />
            </SocialLoginIcon>
            <SocialLoginTextWrapper>{pageType === 'login' ? 'Sign in' : 'Sign up'} with Microsoft</SocialLoginTextWrapper>
          </AzureButton>
        </div>
        {pageType === 'signup' ? <Separator pageType={pageType} /> : null}
      </SocialLoginWrapper>
      {pageType === 'login' ? <Separator pageType={pageType} /> : null}
    </>
  );
};

const Separator = ({ pageType }) => {
  return (
    <SeparatorWrapper pageType={pageType}>
      <SeparatorLine />
      <SeparatorContent>OR</SeparatorContent>
    </SeparatorWrapper>
  );
};

const SocialLoginWrapper = styled.div<{ pageType: string; isMobile: boolean }>`
  margin-top: ${(props) => (props.pageType === 'login' ? '20px' : '0px')};
  width: ${(props) => (props.pageType === 'login' ? (props.isMobile ? '300px' : '340px') : 'fit-content')};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GoogleLoginWrapper = styled.div`
  height: 32px;
`;

const SocialLoginButton = styled.div`
  color: white;
  display: flex;
  align-items: center;
  font-weight: 500;
  cursor: pointer !important;
`;

const AzureButton = styled(SocialLoginButton)`
  background-color: #2f2f2f;
`;

const OktaButton = styled(SocialLoginButton)`
  background-color: #007dc1;
`;

const GithubButton = styled(SocialLoginButton)`
  background-color: #285d9c;
`;

const NotActiveButton = styled(SocialLoginButton)`
  background-color: rgb(66, 133, 244);
  cursor: not-allowed !important;
`;

const SocialLoginIcon = styled.div`
  display: flex;
  justify-items: center;
  align-items: center;
  font-size: 15px;
  background-color: white;
  color: black;
  width: 30px;
  height: 30px;
  margin: 1px;
`;

const SocialLoginTextWrapper = styled.span`
  flex: 1;
  text-align: center;
  font-family: 'Google Sans', arial, sans-serif;
  font-weight: 500;
  font-size: 14px;
  padding-right: 6px;
  padding-top: 1px;
`;

const SeparatorWrapper = styled.div<{ pageType: string }>`
  text-align: center;
  font-size: 10px;
  margin: ${(props) => (props.pageType === 'login' ? '16px 0' : '26px 0 16px 0')};
  padding: 6px 0;
  font-weight: 600;
  position: relative;
`;

const SeparatorLine = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.3);
`;

const SeparatorContent = styled.div`
  position: absolute;
  left: 50%;
  margin-left: -14px;
  margin-top: -9px;
  padding: 3px 4px;
  background-color: #6c7580;
  border-radius: 50%;
`;

const SendSmsBtn = styled.span`
  color: #007bff;
  cursor: pointer;
`;

export default SocialAuthentication;
