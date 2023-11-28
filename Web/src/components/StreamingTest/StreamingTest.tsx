import $ from 'jquery';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
const s = require('./StreamingTest.module.css');
const sd = require('../antdUseDark.module.css');

interface IStreamingTestProps {
  style?: CSSProperties;
  datasetId?: string;
}

const time = 1500;

const StreamingTest = React.memo((props: PropsWithChildren<IStreamingTestProps>) => {
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

  const style1 = useMemo(() => {
    return _.assign(
      {
        margin: '40px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      } as CSSProperties,
      props.style ?? {},
    );
  }, [props.style]);

  const eyeRef = useRef(null);
  const doAnimEye = (isHide) => {
    if (!eyeRef.current) {
      return;
    }

    $(eyeRef.current).animate(
      {
        opacity: isHide ? 0 : 1,
      },
      250,
    );
    setTimeout(() => {
      if (!eyeRef.current) {
        return;
      }

      doAnimEye(!isHide);
    }, 250);
  };
  useEffect(() => {
    doAnimEye(true);

    return () => {
      eyeRef.current = null;
    };
  }, []);

  const [dots, setDots] = useState('.');
  const [dotsHidden, setDotsHidden] = useState('..');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((dots) => {
        let dotsH = '';
        for (let i = dots.length >= 3 ? 0 : dots.length + 1; i < 3; i++) {
          dotsH += '.';
        }
        setDotsHidden(dotsH);

        if (dots.length >= 3) {
          return '';
        } else {
          return dots + '.';
        }
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!props.datasetId) {
      return;
    }

    const doWork = () => {
      return new Promise((resolve, reject) => {
        REClient_.client_()._getCurrentHourRowCount(props.datasetId, (err, res) => {
          if (!err && res?.success) {
            const c1 = res?.result;

            if (c1 != null && _.isNumber(c1)) {
              if (rowsCount !== c1) {
                setRowsCount(c1);
              }
            } else if (c1 != null && _.isObject(c1)) {
              const n1 = (c1 as any).count;
              if (rowsCount !== n1 && _.isNumber(n1)) {
                setRowsCount(n1);
              }
              const dt = (c1 as any).startTsMs;
              if (startTsMs !== dt && _.isNumber(dt)) {
                setStartTsMs(dt);
              }
            }
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    };

    let interval,
      isExit = false;
    const doTime = (isOk) => {
      if (isExit) {
        return;
      }
      interval = setTimeout(
        () => {
          interval = null;

          doWork().then((ok) => {
            doTime(ok);
          });
        },
        isOk ? time : 10 * 1000,
      );
    };
    doWork().then((ok) => {
      doTime(ok);
    });

    return () => {
      isExit = true;
      if (interval != null) {
        clearTimeout(interval);
        interval = null;
      }
    };
  }, [props.datasetId]);

  const [rowsCount, setRowsCount] = useState(0);
  const [startTsMs, setStartTsMs] = useState(null);
  const isRobotoGreen = rowsCount > 0;

  const sinceDt = useMemo(() => {
    if (startTsMs == null || startTsMs === 0) {
      //
    } else if (_.isNumber(startTsMs)) {
      const dt1 = moment.unix(startTsMs / 1000);
      if (dt1.isValid()) {
        return 'since ' + dt1.format('LLL');
      }
    }
    return 'in the last 60 minutes';
  }, [startTsMs]);

  return (
    <div style={{}}>
      <div style={style1}>
        <div style={{ position: 'relative' }}>
          {!isRobotoGreen && <div ref={eyeRef} style={{ position: 'absolute', top: '11px', left: '52px', width: '17px', height: '17px', borderRadius: '50%', backgroundColor: '#f00' }}></div>}
          <img src={calcImgSrc('/imgs/robot' + (isRobotoGreen ? 'Green' : 'Red') + 'Eye.png')} alt={''} style={{ width: '120px' }} />
        </div>
        <div style={{ padding: '20px 60px', textAlign: 'left' }}>
          <div
            css={`
              font-size: 22px;
              font-family: Matter;
            `}
          >
            Receiving events...
          </div>
          {rowsCount === 0 && (
            <div
              css={`
                margin-top: 10px;
                font-size: 16px;
                font-family: Matter;
                max-width: 560px;
                color: ${Utils.colorA(0.7)};
              `}
            >
              Our robot is waiting to receive your first record{dots}
              <span style={{ color: 'transparent' }}>{dotsHidden}</span>
            </div>
          )}
          {rowsCount != null && rowsCount > 0 && (
            <div
              css={`
                margin-top: 10px;
                font-size: 14px;
                font-family: Matter;
                color: ${rowsCount === 0 ? Utils.colorA(0.7) : '#3dbe10'};
              `}
            >
              We have received {rowsCount} record{rowsCount === 1 ? '' : 's'} {sinceDt}
              {dots}
              <span style={{ color: 'transparent' }}>{dotsHidden}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default StreamingTest;
