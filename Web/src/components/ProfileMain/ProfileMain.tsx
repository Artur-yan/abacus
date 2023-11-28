import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { css } from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import UserCardNav from '../UserCardNav/UserCardNav';
import UserEmailPreferences from '../UserEmailPreferences/UserEmailPreferences';
import UserGroupsBelong from '../UserGroupsBelong/UserGroupsBelong';
const s = require('./ProfileMain.module.css');
const sd = require('../antdUseDark.module.css');

interface IProfileMainProps {}

const ProfileMain = React.memo((props: PropsWithChildren<IProfileMainProps>) => {
  const { paramsProp, authUserParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUserParam: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const userEmail = authUserParam?.getIn(['data', 'email']);
  const [allowDiscover, setAllowDiscover] = useState(false);
  const [enabled2Fa, setEnabled2fa] = useState(false);

  const authUser1 = calcAuthUserIsLoggedIn();
  const isAdmin = authUser1?.isAdmin === true;
  useMemo(() => {
    if (authUser1?.organizationDiscover != null) {
      setAllowDiscover(authUser1?.organizationDiscover);
    }
  }, [authUser1?.organizationDiscover]);
  useMemo(() => {
    if (authUser1?.enabled2fa !== enabled2Fa) {
      setEnabled2fa(authUser1?.enabled2fa);
    }
  }, [authUser1?.enabled2fa]);

  const onChangeDiscoverCheckbox = (e) => {
    let v1 = e.target.checked;
    setAllowDiscover(v1);

    REClient_.client_()._updateOrganizationDiscoverability(v1, (err, res) => {
      if (err || !res.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
        setAllowDiscover(authUser1?.organizationDiscover);
      }
    });
  };

  const onChange2FACheckbox = (e) => {
    let v1 = _.isBoolean(e) ? e : e.target.checked;
    setEnabled2fa(v1);

    if (v1) {
      Location.push('/' + PartsLink.config_2fa);
    }
  };

  const onClickConfirmDisable = (e) => {
    REClient_.client_()._disable2fa((err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        onChange2FACheckbox(false);
        REActions.addNotification('2FA Disabled');
        StoreActions.getAuthUser_();
      }
    });
  };

  const onAdminForce2FA = (e) => {
    // handle change
  };

  const check2FA = useMemo(() => {
    let res = (
      <Checkbox disabled={authUser1?.forceTwofa && !authUser1.isInternal} checked={enabled2Fa} onChange={onChange2FACheckbox}>
        <span style={{ fontSize: '14px', color: Utils.colorA(0.7) }}>
          Enable 2FA
          <span style={{ marginLeft: '4px' }}>
            <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faMobileAlt').faMobileAlt} transform={{ size: 18, x: 0, y: 0 }} style={{ marginLeft: '4px' }} />
          </span>
        </span>
      </Checkbox>
    );

    if (enabled2Fa) {
      res = (
        <ModalConfirm onConfirm={onClickConfirmDisable} title={`Do you want to disable 2FA?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Disable'} cancelText={'Cancel'} okType={'danger'}>
          {res}
        </ModalConfirm>
      );
    }

    return res;
  }, [enabled2Fa]);

  return (
    <div css={``}>
      <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
        <div
          css={`
            flex: 1;
            max-width: 380px;
            min-width: 280px;
          `}
          style={{ display: 'flex', flexFlow: 'column' }}
        >
          <div
            css={`
              display: flex;
            `}
            style={{ padding: '14px 30px' }}
            className={sd.grayPanel}
          >
            <div
              css={css`
                display: flex;
                justify-content: center;
                align-items: flex-start;
                margin-right: 14px;
                padding-top: 20px;
              `}
            >
              <UserCardNav onlyAvatarAndName noName canUpdateAvatar />
            </div>

            <div
              css={`
                flex: 1;
              `}
            >
              <div style={{ fontSize: '15px', margin: '8px 0 5px 0' }}>
                <span
                  css={css`
                    color: #ffffff;
                    font-size: 24px;
                    font-family: Matter, sans-serif;
                    font-weight: 600;
                  `}
                >
                  {authUserParam?.getIn(['data', 'name'])}
                </span>
              </div>
              <div style={{ fontSize: '16px', margin: '0 0 20px 0' }}>
                <Link to={'/' + PartsLink.change_password}>
                  <span className={sd.styleTextBlueBright} style={{ cursor: 'pointer' }}>
                    Change Password
                  </span>
                </Link>
              </div>
              {!Utils.isNullOrEmpty(userEmail) && (
                <div style={{ fontSize: '16px', margin: '0 0 20px 0' }}>
                  <div
                    css={`
                      white-space: nowrap;
                    `}
                    style={{ margin: '0 0 10px 0', fontSize: '14px', color: Utils.colorA(0.7) }}
                  >
                    {userEmail}
                  </div>
                </div>
              )}

              {<div style={{ fontSize: '16px', margin: '0 0 20px 0' }}>{check2FA}</div>}

              {isAdmin && (
                <>
                  <div style={{ fontSize: '16px', margin: '0 0 20px 0' }}>
                    <Checkbox checked={allowDiscover} onChange={onChangeDiscoverCheckbox}>
                      <span style={{ fontSize: '14px', color: Utils.colorA(0.7) }}>Allow Discover by Domain</span>
                    </Checkbox>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          css={`
            flex: 1;
            max-width: 330px;
          `}
          style={{ marginLeft: '24px', display: 'flex', flexFlow: 'column' }}
        >
          <div style={{ padding: '19px 30px' }} className={sd.grayPanel}>
            <UserEmailPreferences />
          </div>
        </div>

        {
          <div
            css={`
              flex: 1;
              max-width: 330px;
            `}
            style={{ marginLeft: '24px', display: 'flex', flexFlow: 'column' }}
          >
            <div style={{ padding: '19px 30px' }} className={sd.grayPanel}>
              <UserGroupsBelong />
            </div>
          </div>
        }
      </div>

      {Constants.flags.profile_groups_demo && (
        <div
          css={`
            margin-top: 30px;
            padding: 19px 30px;
          `}
          className={sd.grayPanel}
        >
          <div
            css={css`
              color: #ffffff;
              line-height: 1.33;
              font-size: 24px;
              font-family: Matter, sans-serif;
              font-weight: 400;
              margin-bottom: 14px;
            `}
          >
            Allowed Actions
          </div>
          <div style={{ borderTop: '1px solid white', marginBottom: '17px' }}></div>

          <div
            css={`
              display: flex;
              justify-content: space-evenly;
            `}
          >
            <Button type={'primary'} ghost>
              Connect Data
            </Button>
            <Button type={'primary'} ghost>
              Create Model
            </Button>
            <Button type={'primary'} ghost>
              Train Model
            </Button>
            <Button type={'primary'} ghost>
              Deploy Model
            </Button>
            <Button type={'primary'} ghost>
              Predictions Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfileMain;
