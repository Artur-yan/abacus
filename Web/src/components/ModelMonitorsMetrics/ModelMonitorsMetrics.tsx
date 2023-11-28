import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import monitoring from '../../stores/reducers/monitoring';
import ModelMetricsOne from '../ModelMetricsOne/ModelMetricsOne';
const s = require('./ModelMonitorsMetrics.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelMonitorsMetricsProps {}

const ModelMonitorsMetrics = React.memo((props: PropsWithChildren<IModelMonitorsMetricsProps>) => {
  const { paramsProp, authUser, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    monitoringParam: state.monitoring,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = paramsProp?.get('projectId');
  const modelMonitorId = paramsProp?.get('modelMonitorId');

  useEffect(() => {
    monitoring.memModelsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorOne = useMemo(() => {
    return monitoring.memModelsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);

  const modelMonitorVersion = useMemo(() => {
    return monitorOne?.latestMonitorModelVersion?.modelMonitorVersion;
  }, [monitorOne]);

  return <div>{modelMonitorVersion && <ModelMetricsOne projectId={projectId} modelMonitorVersion={modelMonitorVersion} />}</div>;
});

export default ModelMonitorsMetrics;
