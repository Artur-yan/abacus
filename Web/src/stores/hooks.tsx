import * as React from 'react';
import { useSelector } from 'react-redux';

const useParamsProp = () => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));
  return paramsProp;
};

export const useProjectId = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('projectId'), [paramsProp]);
};

export const useFeatureGroupId = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('featureGroupId'), [paramsProp]);
};

export const useMode = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('mode'), [paramsProp]);
};

export const useVersionExpanded = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('versionExpanded'), [paramsProp]);
};

export const useDetailModelId = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('detailModelId'), [paramsProp]);
};

export const useDataClusterType = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('dataClusterType'), [paramsProp]);
};

export const useModelMonitorId = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('modelMonitorId'), [paramsProp]);
};

export const usePredictionMetricsId = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('predictionMetricsId'), [paramsProp]);
};

export const usePredictionMetricVersion = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('predictionMetricVersion'), [paramsProp]);
};

export const usePitGroup = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('pitGroup'), [paramsProp]);
};

export const useEditGroup = () => {
  const paramsProp = useParamsProp();
  return React.useMemo(() => paramsProp?.get('editConfig'), [paramsProp]);
};
