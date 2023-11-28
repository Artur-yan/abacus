import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import monitoring from '../../stores/reducers/monitoring';
import predictionMetrics from '../../stores/reducers/predictionMetrics';
import ModelMetricsOne from '../ModelMetricsOne/ModelMetricsOne';
const s = require('./PredMetricsMetrics.module.css');
const sd = require('../antdUseDark.module.css');

interface IPredMetricsMetricsProps {}

const PredMetricsMetrics = React.memo((props: PropsWithChildren<IPredMetricsMetricsProps>) => {
  const { predictionMetricsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    predictionMetricsParam: state.predictionMetrics,
  }));
  const { monitoringParam } = useSelector((state: any) => ({
    monitoringParam: state.monitoring,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = paramsProp?.get('projectId');
  const predictionMetricsId = paramsProp?.get('predictionMetricsId');
  const predictionMetricVersion = paramsProp?.get('predictionMetricVersion');
  const monitorVersion = paramsProp?.get('modelMonitorVersion');
  const metricType = paramsProp?.get('metricType');

  let modelMonitorId = paramsProp?.get('modelMonitorId');
  if (modelMonitorId === '') {
    modelMonitorId = null;
  }

  useEffect(() => {
    predictionMetrics.memDescribeMetricsByPredMetricsId(true, undefined, predictionMetricsId);
  }, [predictionMetricsId, predictionMetricsParam]);
  const predMetricsOne = useMemo(() => {
    return predictionMetrics.memDescribeMetricsByPredMetricsId(false, undefined, predictionMetricsId);
  }, [predictionMetricsId, predictionMetricsParam]);

  useEffect(() => {
    monitoring.memModelsByProjectId(true, projectId);
  }, [monitoringParam, projectId]);

  const monitorsList = useMemo(() => {
    return monitoring.memModelsByProjectId(false, projectId);
  }, [monitoringParam, projectId]);

  const optionsMonitors = useMemo(() => {
    return monitorsList?.map((v1, v1ind) => ({ label: v1?.name, value: v1?.modelMonitorId, data: v1 }));
  }, [monitoringParam, monitorsList]);

  useEffect(() => {
    monitoring.memModelVersionsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorVersionsOne = useMemo(() => {
    return monitoring.memModelVersionsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam, monitorVersion]);

  const optionsVersions = useMemo(() => {
    if (monitorVersionsOne) {
      return monitorVersionsOne?.map((v1, v1ind) => ({ label: v1?.modelMonitorVersion, value: v1?.modelMonitorVersion, data: v1 }));
    }
  }, [monitorVersionsOne, monitorVersion]);

  return (
    <div>
      <ModelMetricsOne
        isUseTypes={!!metricType}
        optionsVersions={optionsVersions}
        optionsMonitors={optionsMonitors}
        projectId={projectId}
        metricType={metricType}
        predictionMetricVersion={predictionMetricVersion}
        monitorVersion={monitorVersion}
      />
    </div>
  );
});

export default PredMetricsMetrics;
