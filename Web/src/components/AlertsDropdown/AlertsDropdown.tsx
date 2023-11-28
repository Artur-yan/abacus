import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import alerts, { IAlertOne } from '../../stores/reducers/alerts';
import AlertsOne from '../AlertsOne/AlertsOne';
import NanoScroller from '../NanoScroller/NanoScroller';
const s = require('./AlertsDropdown.module.css');
const sd = require('../antdUseDark.module.css');

interface IAlertsDropdownProps {}

const AlertsDropdown = React.memo((props: PropsWithChildren<IAlertsDropdownProps>) => {
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

  let { alertList, renderList } = useMemo(() => {
    let alertsList = alerts.calcList();

    let res = [];

    const max = 30;
    alertsList?.some((a1: IAlertOne, a1ind) => {
      res.push(<AlertsOne key={a1.alertId} alert={a1} />);
      if (a1ind >= max) {
        return true;
      }
    });

    return { alertList, renderList: res };
  }, [alertsParam]);

  return (
    <div style={{ position: 'relative', width: '440px', height: '500px', margin: '0 -8px' }}>
      <NanoScroller onlyVertical>
        <div style={{ margin: '0 14px' }}>{renderList}</div>
      </NanoScroller>
    </div>
  );
});

export default AlertsDropdown;
