import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import customds, { CustomDSLifecycle, CustomDSLifecycleDesc } from '../../stores/reducers/customds';
import { DeploymentLifecycle } from '../../stores/reducers/deployments';

const s = require('./DataserverControlEditor.module.css');
const sd = require('../antdUseDark.module.css');

export const CustomDataserverHeight = 60 + 22;

interface IDataserverControlEditorProps {
  onChange?: (isStarted, isStopped) => void;
}

const DataserverControlEditor = React.memo((props: PropsWithChildren<IDataserverControlEditorProps>) => {
  const { customdsParam, paramsProp, authUser } = useSelector((state: any) => ({
    customdsParam: state.customds,
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusOne, setStatusOne] = useState(null);

  useEffect(() => {
    customds.memThisDataserver(true);
  }, [customdsParam]);
  const serverOne = useMemo(() => {
    return customds.memThisDataserver(false);
  }, [customdsParam]);

  useEffect(() => {
    let res = serverOne;

    let isRef1 = [CustomDSLifecycle.PENDING_STOPPING, CustomDSLifecycle.PENDING, CustomDSLifecycle.CANCELLED, CustomDSLifecycle.DEPLOYING, CustomDSLifecycle.STOPPING].includes(res?.status ?? '-');
    setIsRefreshing(isRef1);

    setStatusOne(res?.status);
  }, [serverOne]);

  const doStartServer = (cbFinish?) => {
    REClient_.client_()._createDataserverDeployment(63, 8, 63, null, (err, res) => {
      cbFinish?.();
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.listCDS_();
      }
    });
  };

  const doStopServer = (cbFinish?) => {
    REClient_.client_()._deleteDataserverDeployment((err, res) => {
      cbFinish?.();
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.listCDS_();
      }
    });
  };

  const onStopServer = (e) => {
    doStopServer(() => {
      setTimeout(() => {
        StoreActions.refreshDoCDSAll_();
        // doRefresh(() => {
        //   props.onChange?.(false, true);
        // });
      }, 300);
    });
  };

  const onStartServer = (e) => {
    doStartServer(() => {
      StoreActions.refreshDoCDSAll_();
      // doRefresh(() => {
      //   props.onChange?.(true, false);
      // });
    });
  };

  const status1 = useMemo(() => {
    return CustomDSLifecycleDesc[statusOne] ?? Utils.upperFirst(statusOne);
  }, [statusOne]);

  return (
    <span
      css={`
        font-size: 14px;
        border-radius: 3px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 3px 12px 3px 3px;
        display: inline-block;
      `}
      className={isRefreshing ? s.animRect : ''}
    >
      {/*<div css={`text-align: center; margin-bottom: 4px; font-size: 15px; color: #e7f9b8;`}>*/}
      {/*  Please start the custom dataserver, before using this feature*/}
      {/*</div>*/}

      <div>
        {['-', DeploymentLifecycle.FAILED, DeploymentLifecycle.CANCELLED, DeploymentLifecycle.STOPPED].includes((serverOne == null ? null : statusOne) ?? '-') && (
          <span>
            <span
              css={`
                margin-left: 10px;
              `}
            >
              <Button onClick={onStartServer} type={'primary'} size={'small'}>
                Start Custom Dataserver
              </Button>
            </span>
          </span>
        )}

        {serverOne != null && [DeploymentLifecycle.ACTIVE].includes(statusOne ?? '-') && (
          <span>
            <span>Custom Dataserver Running</span>
            <span
              css={`
                margin-left: 10px;
              `}
            >
              <Button onClick={onStopServer} type={'primary'} size={'small'}>
                Stop
              </Button>
            </span>
          </span>
        )}

        <span
          css={`
            margin-left: 10px;
          `}
        >
          {isRefreshing && (
            <span
              css={`
                margin-right: 8px;
              `}
            >
              <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} />
            </span>
          )}
          {status1 != null && (
            <span>
              <span
                css={`
                  opacity: 0.7;
                `}
              >
                Status
              </span>
              :&nbsp;{CustomDSLifecycleDesc[status1] || Utils.upperFirst(status1)}
            </span>
          )}
          {/*{serverOne?.dataserverStartedAt!=null && <span css={`margin-left: 8px;`}><span css={`opacity: 0.7;`}>StartedAt UTC</span>:&nbsp;<DateOld always date={serverOne?.dataserverStartedAt} useUTC /></span>}*/}
          {/*{serverOne?.sessionStopTime!=null && <span css={`margin-left: 8px;`}><span css={`opacity: 0.7;`}>SessionStopTime UTC</span>:&nbsp;<DateOld always date={serverOne?.sessionStopTime} useUTC /></span>}*/}
          {isRefreshing && (
            <span
              css={`
                margin-left: 8px;
              `}
            >
              <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} />
            </span>
          )}
        </span>
      </div>
    </span>
  );
});

export default DataserverControlEditor;
