import Checkbox from 'antd/lib/checkbox';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { css } from 'styled-components';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
const s = require('./UserEmailPreferences.module.css');
const sd = require('../antdUseDark.module.css');

interface IUserEmailPreferencesProps {}

export interface IEmailPrefOption {
  name: string;
  value: string;
  default: boolean;
  admin: boolean;
}

const UserEmailPreferences = React.memo((props: PropsWithChildren<IUserEmailPreferencesProps>) => {
  const { paramsProp, authUserParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUserParam: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [emailPrefs, setEmailPrefs] = useState(null);

  useEffect(() => {
    REClient_.client_()._getUserPreferencesOptions((err, res) => {
      if (!err && res?.result) {
        setEmailPrefs(res?.result);
      }
    });
  }, []);

  let emailChannels = useMemo(() => {
    return calcAuthUserIsLoggedIn()?.emailChannels;
  }, [authUserParam]);
  let isAdmin = useMemo(() => {
    return calcAuthUserIsLoggedIn()?.isAdmin;
  }, [authUserParam]);
  let listPrefs: IEmailPrefOption[] = useMemo(() => {
    return (emailPrefs?.globalEmailChannels || []).concat(emailPrefs?.organizationEmailChannels || []);
  }, [emailPrefs]);

  const onChangeValue = (prefValue, isChecked) => {
    REClient_.client_()._updateUserPreferences({ emailChannels: { [prefValue]: isChecked } }, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.getAuthUser_();
      }
    });
  };
  const calcValue = (prefValue) => {
    return emailChannels?.get(prefValue);
  };

  return (
    <div>
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
        Email Preferences
      </div>
      <div style={{ borderTop: '1px solid white', marginBottom: '17px' }}></div>
      <div>
        {listPrefs
          ?.map((p1) => {
            if (p1.admin) {
              if (isAdmin !== true) {
                return null;
              }
            }
            return (
              <div key={'ch_' + p1.value} style={{ padding: '4px 0' }}>
                <Checkbox checked={calcValue(p1.value) ?? p1.default ?? false} onChange={(e) => onChangeValue(p1.value, e.target.checked)}>
                  <span style={{ color: Utils.colorA(1) }}>{p1.name}</span>
                </Checkbox>
              </div>
            );
          })
          .filter((p1) => p1 != null)}
      </div>
    </div>
  );
});

export default UserEmailPreferences;
