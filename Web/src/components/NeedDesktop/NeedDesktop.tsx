import * as React from 'react';
import { PropsWithChildren } from 'react';
import { calcImgSrc } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
const s = require('./NeedDesktop.module.css');
const sd = require('../antdUseDark.module.css');

interface INeedDesktopProps {
  isModels?: boolean;
}

const NeedDesktop = React.memo((props: PropsWithChildren<INeedDesktopProps>) => {
  const onClickImg = (e) => {
    REClient_.client_()._requestReminderEmail((err, res) => {
      setTimeout(() => {
        window.location.href = '/';
      }, 0);
    });
  };
  const onClickLogout = (e) => {
    window.location.href = '/sign_out';
  };

  const authUser1 = calcAuthUserIsLoggedIn();

  return (
    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <span style={{ display: 'inline-block', boxShadow: '0 0 18px rgba(0,0,0,0.6)', width: '80%', maxWidth: '340px' }}>
        <img src={calcImgSrc('/imgs/needDesktop1.png')} style={{ width: '100%' }} alt={''} />
        <img onClick={onClickImg} src={calcImgSrc('/imgs/needDesktop2.png')} style={{ width: '100%' }} alt={''} />

        {authUser1?.isLoggedIn === true && (
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <span onClick={onClickLogout} className={sd.styleTextBlue} style={{ cursor: 'pointer' }}>
              Log Out
            </span>
          </div>
        )}
      </span>
    </div>
  );
});

export default NeedDesktop;
