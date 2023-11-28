import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import { ReactLazyExt } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
const s = require('./Config2FA.module.css');
const sd = require('../antdUseDark.module.css');
const IntlTelInput = ReactLazyExt(() => import('react-intl-tel-input'));
// import 'style-loader?esModule=false!css-loader!react-intl-tel-input/dist/main.css';
import './tel.css';
// import 'style-loader?esModule=false!css-loader?url=false!./tel.module.css';
import Button from 'antd/lib/button';
import InputNumber from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import REClient_ from '../../api/REClient';
import StoreActions from '../../stores/actions/StoreActions';
import PartsLink from '../NavLeft/PartsLink';
const { confirm } = Modal;

interface IConfig2FAProps {}

const Config2FA = React.memo((props: PropsWithChildren<IConfig2FAProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));

  const is2FAEnabled = authUser?.getIn(['data', 'twofaEnabled']);

  if (is2FAEnabled) {
    Location.push(`/${PartsLink.project_list}`);
  }

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [phone, setPhone] = useState(null as { valid; code; number });

  const onPhoneNumberChange = (...args) => {
    setPhone({ valid: args[0], code: args[2].dialCode, number: args[1] });
  };

  const onSetUp2FA = (e) => {
    REClient_.client_()._enable2fa('+' + phone.code, phone.number, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
        return;
      }
      openSetupDialog(res?.result);
    });
  };

  const openSetupDialog = (image) => {
    let code = '';

    confirm({
      title: 'Confirm 2FA Setup',
      okText: 'Submit',
      okType: 'primary',
      cancelText: 'Cancel',
      maskClosable: true,
      // @ts-ignore
      confirmLoading: true,
      width: 500,
      content: (
        <div>
          <div>Scan the QR code with Authy or your favorite 2FA App</div>
          <div style={{ textAlign: 'center' }}>
            <img src={image} style={{ width: '80%' }} alt={'2FA QR'} />
          </div>
          <div style={{}}>Enter a token from your 2FA app to confirm enrollment</div>
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

              REActions.addNotification('2FA Enabled!');
              StoreActions.getAuthUser_();

              Location.push('/' + PartsLink.profile);
            }
          });
        });
      },
      onCancel: () => {
        //
      },
    });
  };

  return (
    <div>
      <div
        css={`
          max-width: 450px;
          margin: 80px auto;
          padding: 30px;
        `}
      >
        <div
          css={`
            font-family: Matter;
            font-size: 24px;
            line-height: 1.33;
            text-align: center;
            color: #ffffff;
          `}
        >
          Configure 2FA
        </div>
        <div
          css={`
            margin-top: 12px;
            border-radius: 1px;
            background-color: #0b131e;
            padding: 24px;
          `}
        >
          <div>
            <div
              css={`
                margin-bottom: 5px;
                font-family: Roboto;
                font-size: 12px;
                letter-spacing: 1.12px;
                color: #ffffff;
                text-transform: uppercase;
              `}
            >
              Phone Number:
            </div>
            <React.Suspense fallback={<div></div>}>
              <IntlTelInput style={{ width: '100%' }} onPhoneNumberChange={onPhoneNumberChange} containerClassName="intl-tel-input" inputClassName="form-control" />
            </React.Suspense>
          </div>

          <div style={{ marginTop: '20px' }}>
            <Button style={{ width: '100%' }} className={phone?.valid ? sd.detailbuttonblue : ''} onClick={onSetUp2FA} disabled={!phone?.valid} type={'primary'}>
              Set Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Config2FA;
