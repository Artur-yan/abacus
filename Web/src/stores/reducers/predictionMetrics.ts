import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum PredictionMetricsLifecycle {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

let initState = Immutable.fromJS({
  isRefreshing: 0,

  listByFeatureGroupId: {},
  metricsByFeatureGroupId: {},
  listVersionsByPredMetricsId: {},
  metricByVersionId: {},
  metricByType: {},
  metricsVersionByMetricsVersion: {},
  metricByProjectId: {},
}) as Immutable.Map<string, any>;

const predictionMetrics = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('listByFeatureGroupId', Immutable.fromJS({}));
      state = state.set('metricsByFeatureGroupId', Immutable.fromJS({}));
      state = state.set('listVersionsByPredMetricsId', Immutable.fromJS({}));
      state = state.set('metricByVersionId', Immutable.fromJS({}));
      state = state.set('metricByType', Immutable.fromJS({}));
      state = state.set('metricsVersionByMetricsVersion', Immutable.fromJS({}));
      state = state.set('metricByProjectId', Immutable.fromJS({}));

      return state;

    case StoreActions.PRED_METRICS_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.featureGroupId) != null && useNormalizedId(action.payload.predictionMetricsId) != null) {
        state = state.updateIn(['listByFeatureGroupId', '' + useNormalizedId(action.payload.featureGroupId)], (list: any[]) => {
          if (list) {
            list = [...list];
            let ind1 = _.findIndex(list, (p1) => p1.predictionMetricsId === action.payload.predictionMetricsId);
            if (ind1 > -1) {
              list[ind1] = { ...list[ind1] };
              list[ind1].status = action.payload.status;
            }
          }
          return list;
        });
      }
      if (action.payload.predictionMetricsId != null) {
        state = state.updateIn(['metricsByFeatureGroupId', '' + useNormalizedId(action.payload.predictionMetricsId)], (o1: any) => {
          if (o1) {
            o1 = { ...o1 };
            o1.status = action.payload.status;
          }
          return o1;
        });
      }
      return state;

    case StoreActions.PRED_METRICS_VERSION_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.predictionMetricsId) != null && useNormalizedId(action.payload.predictionMetricsVersion) != null) {
        state = state.updateIn(['listVersionsByPredMetricsId', '' + useNormalizedId(action.payload.predictionMetricsId)], (list: any[]) => {
          if (list) {
            list = [...list];
            let ind1 = _.findIndex(list, (p1) => p1.predictionMetricsVersion === action.payload.predictionMetricsVersion);
            if (ind1 > -1) {
              list[ind1] = { ...list[ind1] };
              list[ind1].status = action.payload.status;
            }
          }
          return list;
        });
      }
      if (action.payload.predictionMetricsVersion != null) {
        state = state.updateIn(['metricsVersionByMetricsVersion', '' + useNormalizedId(action.payload.predictionMetricsVersion)], (o1: any) => {
          if (o1) {
            o1 = { ...o1 };
            o1.status = action.payload.status;
          }
          return o1;
        });
      }
      return state;

    case StoreActions.PRED_METRICS_VERSIONS_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PRED_METRICS_VERSIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['listVersionsByPredMetricsId', '' + useNormalizedId(action.payload.predictionMetricsId)], action.payload.result || []);
      return state;

    case StoreActions.PRED_METRICS_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PRED_METRICS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['listByFeatureGroupId', '' + useNormalizedId(action.payload.featureGroupId)], action.payload.result || []);
      return state;

    case StoreActions.PRED_METRICS_DESCRIBE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PRED_METRICS_DESCRIBE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['metricsByFeatureGroupId', '' + useNormalizedId(action.payload.predictionMetricsId)], action.payload.result || {});
      return state;

    case StoreActions.PRED_METRICS_METRICS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PRED_METRICS_METRICS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['metricByVersionId', '' + useNormalizedId(action.payload.predictionMetricsVersion) + '_' + (useNormalizedId(action.payload.actualValue) ?? '')], action.payload.result || {});
      return state;

    case StoreActions.PRED_METRICS_TYPE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PRED_METRICS_TYPE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(
        ['metricByType', '' + useNormalizedId(action.payload.modelMonitorVersion) + '_' + (useNormalizedId(action.payload.metricType) ?? '') + '_' + (useNormalizedId(action.payload.actualValue) ?? '')],
        action.payload.result || {},
      );
      return state;

    case StoreActions.PRED_METRICS_PROJECT_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PRED_METRICS_PROJECT_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['metricByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    case StoreActions.PRED_METRICS_VERSION_DESCRIBE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PRED_METRICS_VERSION_DESCRIBE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['metricsVersionByMetricsVersion', '' + useNormalizedId(action.payload.predictionMetricsVersion)], action.payload.result || {});
      return state;

    default:
      return state;
  }
};

predictionMetrics.calcListMetricsByFeatureGroupId = (featureGroupId?) => {
  featureGroupId = useNormalizedId(featureGroupId);
  if (!featureGroupId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  return state.getIn(['listByFeatureGroupId', '' + featureGroupId]);
};

predictionMetrics.memListMetricsByFeatureGroupId = (doCall, state?: any, featureGroupId?: any) => {
  featureGroupId = useNormalizedId(featureGroupId);
  if (!featureGroupId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  if (state) {
    let res = predictionMetrics.calcListMetricsByFeatureGroupId(featureGroupId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions._getPredMetricsByFeatureGroupId(featureGroupId);
    }
  }
};

predictionMetrics.calcMetricsByPredMetricsId = (predictionMetricsId?) => {
  predictionMetricsId = useNormalizedId(predictionMetricsId);
  if (!predictionMetricsId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  return state.getIn(['metricsByFeatureGroupId', '' + predictionMetricsId]);
};

predictionMetrics.memDescribeMetricsByPredMetricsId = (doCall, state?: any, predictionMetricsId?: any) => {
  predictionMetricsId = useNormalizedId(predictionMetricsId);
  if (!predictionMetricsId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  if (state) {
    let res = predictionMetrics.calcMetricsByPredMetricsId(predictionMetricsId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions._describePredMetrics(predictionMetricsId);
    }
  }
};

predictionMetrics.calcMetricsVersionByPredMetricsVersion = (predictionMetricsVersion?) => {
  predictionMetricsVersion = useNormalizedId(predictionMetricsVersion);
  if (!predictionMetricsVersion) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  return state.getIn(['metricsVersionByMetricsVersion', '' + predictionMetricsVersion]);
};

predictionMetrics.memDescribeMetricsVersionByPredMetricsVersion = (doCall, state?: any, predictionMetricsVersion?: any) => {
  predictionMetricsVersion = useNormalizedId(predictionMetricsVersion);
  if (!predictionMetricsVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  if (state) {
    let res = predictionMetrics.calcMetricsVersionByPredMetricsVersion(predictionMetricsVersion);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions._describePredMetricsVersion(predictionMetricsVersion);
    }
  }
};

predictionMetrics.calcListMetricsVersionsByPredMetricId = (predictionMetricsId?) => {
  predictionMetricsId = useNormalizedId(predictionMetricsId);
  if (!predictionMetricsId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  return state.getIn(['listVersionsByPredMetricsId', '' + predictionMetricsId]);
};

predictionMetrics.memListMetricsVersionsByPredMetricId = (doCall, state?: any, predictionMetricsId?: any) => {
  predictionMetricsId = useNormalizedId(predictionMetricsId);
  if (!predictionMetricsId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  if (state) {
    let res = predictionMetrics.calcListMetricsVersionsByPredMetricId(predictionMetricsId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions._getListVersionsPredMetricsByPredMetricsId(predictionMetricsId);
    }
  }
};

predictionMetrics.calcMetricsByPredMetricVersion = (predictionMetricsVersion?, actualValue?) => {
  predictionMetricsVersion = useNormalizedId(predictionMetricsVersion);
  actualValue = useNormalizedId(actualValue);
  if (!predictionMetricsVersion) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  return state.getIn(['metricByVersionId', '' + predictionMetricsVersion + '_' + (actualValue ?? '')]);
};

predictionMetrics.memMetricsByPredMetricVersion = (doCall, state?: any, predictionMetricsVersion?: any, actualValue?: any) => {
  predictionMetricsVersion = useNormalizedId(predictionMetricsVersion);
  actualValue = useNormalizedId(actualValue);
  if (!predictionMetricsVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  if (state) {
    let res = predictionMetrics.calcMetricsByPredMetricVersion(predictionMetricsVersion, actualValue);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.getMetricsFGForVersion_(predictionMetricsVersion, actualValue);
    }
  }
};

predictionMetrics.calcMetricsByPredMetricType = (modelMonitorVersion?, metricType?, actualValue?) => {
  modelMonitorVersion = useNormalizedId(modelMonitorVersion);
  metricType = useNormalizedId(metricType);
  actualValue = useNormalizedId(actualValue);
  if (!modelMonitorVersion) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  return state.getIn(['metricByType', '' + modelMonitorVersion + '_' + (metricType ?? '') + '_' + (actualValue ?? '')]);
};

predictionMetrics.memMetricsByPredMetricType = (doCall, state?: any, modelMonitorVersion?: any, metricType?: any, actualValue?: any) => {
  modelMonitorVersion = useNormalizedId(modelMonitorVersion);
  metricType = useNormalizedId(metricType);
  actualValue = useNormalizedId(actualValue);

  if (!modelMonitorVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  if (state) {
    let res = predictionMetrics.calcMetricsByPredMetricType(modelMonitorVersion, metricType, actualValue);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.getModelMonitorVersionMetricData(modelMonitorVersion, metricType, actualValue);
    }
  }
};

predictionMetrics.calcMetricsByProjectId = (projectId?) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  return state.getIn(['metricByProjectId', '' + projectId]);
};

predictionMetrics.memMetricsByProjectId = (doCall, state?: any, projectId?: any) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.predictionMetrics) {
    state = state.predictionMetrics;
  }

  if (state) {
    let res = predictionMetrics.calcMetricsByProjectId(projectId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.listPredMetricsForProjectId_(projectId);
    }
  }
};

export default predictionMetrics;
