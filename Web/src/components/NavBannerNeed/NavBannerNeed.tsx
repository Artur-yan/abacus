import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Constants from '../../constants/Constants';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./NavBannerNeed.module.css');
const sd = require('../antdUseDark.module.css');

interface INavBannerNeedProps {
  navLeftCollapsed?: boolean;
  noNav?: boolean;
  msg?: string;
  msgBackColor?: string;
}

export const NavBannerNeedHeight = 44;

const NavBannerNeed = React.memo((props: PropsWithChildren<INavBannerNeedProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const authUserRes = useMemo(() => {
    return calcAuthUserIsLoggedIn();
  }, [authUser]);

  let link1 = null;
  if (props.msg == null && authUserRes?.userId) {
    link1 = '/' + PartsLink.signin_verify_account + '/' + authUserRes?.userId;
  }

  return (
    <div
      style={{
        position: 'absolute',
        overflowX: 'hidden',
        overflowY: 'auto',
        backgroundColor: props.msgBackColor || '#af5d5d',
        left: (props.noNav ? 0 : props.navLeftCollapsed ? Constants.navWidthCollapsed : Constants.navWidth) + 'px',
        top: Constants.headerHeight() + 'px',
        right: 0,
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: '2px',
        fontSize: '15px',
        height: NavBannerNeedHeight + 'px',
      }}
    >
      <Link to={link1}>
        <span style={{ cursor: link1 == null ? 'default' : 'pointer' }}>{props.msg || 'Please verify your email. Click here to start verification'}</span>
      </Link>
    </div>
  );
});

export default NavBannerNeed;
