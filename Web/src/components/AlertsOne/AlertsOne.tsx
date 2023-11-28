import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import { IAlertOne } from '../../stores/reducers/alerts';
const s = require('./AlertsOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IAlertsOneProps {
  alert?: IAlertOne;
}

const AlertsOne = React.memo((props: PropsWithChildren<IAlertsOneProps>) => {
  let alert1 = props.alert as IAlertOne;
  let dtUpdated = moment(alert1?.createdAt);

  let isError = false;
  let isWarning = false;
  let isNormal = false;

  const showIcon = isError || isWarning || isNormal;

  return (
    <div style={{ fontFamily: 'Matter', fontWeight: 300, color: 'white', marginBottom: '16px', backgroundColor: alert1?.seen ? '#131b26' : '#2e5bff', borderRadius: '6px' }}>
      <div style={{ padding: '11px 17px', position: 'relative' }}>
        {showIcon && (
          <div style={{ position: 'absolute', right: '12px', top: '12px' }}>
            <span
              style={{
                backgroundColor: isError ? '#c94730' : isWarning ? '#e4bc49' : 'white' /*'#38bfa1'*/,
                display: 'flex',
                borderRadius: '50%',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                width: '18px',
                height: '18px',
                marginLeft: '6px',
                cursor: 'pointer',
              }}
            >
              {!isError && !isWarning && <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 10, x: 0, y: 1 }} style={{ color: 'white' }} />}
              {isError && <FontAwesomeIcon icon={['fas', 'times']} transform={{ size: 13, x: 0, y: 0 }} style={{ color: 'white' }} />}
              {!isError && isWarning && <FontAwesomeIcon icon={['far', 'stopwatch']} transform={{ size: 13, x: 0, y: -0.5 }} style={{ color: 'white' }} />}
            </span>
          </div>
        )}

        <div style={{ fontSize: '14px', fontWeight: 500 }}>{dtUpdated.format('LLL')}</div>
        <div style={{ paddingTop: '7px', fontSize: '18px', fontWeight: 600 }}>{alert1?.title}</div>
        <div style={{ paddingTop: '3px', fontSize: '14px', fontWeight: 400, color: 'white' /*'#38bfa1'*/ }}>{'View Predictions'}</div>
      </div>
    </div>
  );
});

export default AlertsOne;
