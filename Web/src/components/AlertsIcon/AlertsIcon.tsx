import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Popover from 'antd/lib/popover';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import alerts, { IAlertOne } from '../../stores/reducers/alerts';
import AlertsDropdown from '../AlertsDropdown/AlertsDropdown';
const s = require('./AlertsIcon.module.css');
const sd = require('../antdUseDark.module.css');

interface IAlertsIconProps {}

const AlertsIcon = React.memo((props: PropsWithChildren<IAlertsIconProps>) => {
  const { alerts: alertsParam } = useSelector((state: any) => ({
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  let { alertsList, unreadCount, curNum } = useMemo(() => {
    let alertsList = alerts.calcList();

    let res = 0;
    alertsList?.some((a1: IAlertOne) => {
      if (!a1.seen) {
        res++;
      }
    });

    let curNum = res === 0 ? 0 : 1;

    return { alertsList, unreadCount: res, curNum };
  }, [alertsParam]);

  const timerRefresh: any = useRef();
  useEffect(() => {
    if (Constants.flags.show_alerts) {
      timerRefresh.current = setInterval(() => {
        StoreActions.alertsList_(false, alertsParam.get('maxEpoch'));
      }, 10 * 1000);

      return () => {
        clearInterval(timerRefresh.current);
      };
    }
  }, [alertsParam]);

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const lastCountUsedFavicon = useRef(0);
  useMemo(() => {
    if (lastCountUsedFavicon.current !== curNum) {
      lastCountUsedFavicon.current = curNum;

      Utils.headFavicon(`/icon/favicon${curNum === 0 ? '' : 'Red'}.ico`);
    }
  }, [curNum]);

  let unreadElem = null;
  if (unreadCount > 0) {
    // let c1 = unreadCount>9 ? '9+' : ''+unreadCount;
    unreadElem = <div style={{ position: 'absolute', right: '-1px', top: '1px', backgroundColor: '#2e5bff', width: '10px', height: '10px', borderRadius: '50%' }}>&nbsp;</div>;
  }

  const onClickMarkAllRead = (e) => {
    e.preventDefault();
    e.stopPropagation();

    REClient_.client_().alertsMarkAllRead((err, res) => {
      StoreActions.alertsList_();
    });
  };

  let unreadS = null;
  if (unreadCount > 0) {
    unreadS = (
      <span>
        (<span style={{ marginLeft: '1px' }}></span>
        {unreadCount > 9 ? '9+' : unreadCount}
        <span style={{ marginLeft: '1px' }}></span>)
      </span>
    );
  }

  return (
    <Popover
      content={<AlertsDropdown />}
      title={
        <div style={{ textAlign: 'left' }}>
          <div className={sd.styleTextGreen} onClick={onClickMarkAllRead} style={{ textAlign: 'right', float: 'right', padding: '0 0 0 0', cursor: 'pointer' }}>
            Mark All as Read
          </div>
          <span style={{ color: 'white' }}>Notifications&nbsp;{unreadS}</span>
        </div>
      }
      trigger={'click'}
      getPopupContainer={popupContainerForMenu}
      placement={'bottom'}
    >
      <span style={{ position: 'relative', color: 'white' }} className={s.root}>
        {unreadElem}
        <FontAwesomeIcon icon={['far', 'bell']} transform={{ size: 24, x: 0, y: -1 }} style={{ color: 'white' }} />
      </span>
    </Popover>
  );
});

export default AlertsIcon;
