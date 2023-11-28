import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum ModelMonitoringLifecycle {
  PENDING = 'PENDING',
  MONITORING = 'MONITORING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export enum ModelMonitoringLifecycleDesc {
  PENDING = 'Pending',
  MONITORING = 'Monitoring',
  COMPLETE = 'Complete',
  FAILED = 'Failed',
}

let initState = Immutable.fromJS({
  isRefreshing: 0,
  modelsByProjectId: {},
  modelsById: {},
  modelsByIdError: {},
  modelVersionsById: {},
  metricByVersionId: {},
  modelsAll: null,
  alertsById: {},
  alertsEventsByAlertVersion: {},
}) as Immutable.Map<string, any>;

const monitoring = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('modelsByProjectId', Immutable.fromJS({}));
      state = state.set('modelsById', Immutable.fromJS({}));
      state = state.set('modelsByIdError', Immutable.fromJS({}));
      state = state.set('alertsById', Immutable.fromJS({}));
      state = state.set('alertsEventsByAlertVersion', Immutable.fromJS({}));
      return state;

    case StoreActions.MONITORS_ALERT_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MONITORS_ALERT_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['alertsById', '' + useNormalizedId(action.payload.monitorAlertId)], action.payload.result || {});
      return state;

    case StoreActions.MONITORS_ALERT_EVENTS_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MONITORS_ALERT_EVENTS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['alertsEventsByAlertVersion', '' + useNormalizedId(action.payload.monitorAlertVersion)], action.payload.result || []);
      return state;

    case StoreActions.MONITORING_METRICS_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MONITORING_METRICS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['metricByVersionId', '' + useNormalizedId(action.payload.modelMonitorVersion)], action.payload.result || {});
      return state;

    case StoreActions.MONITORING_MODELS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MONITORING_MODELS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelsByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    case StoreActions.MONITORING_MODELS_LIST_ALL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MONITORING_MODELS_LIST_ALL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelsAll' + (action.payload.onlyStarred ? '_starred' : '')], action.payload.result || []);
      return state;

    case StoreActions.MONITORING_MODELS_VERSIONS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MONITORING_MODELS_VERSIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelVersionsById', '' + useNormalizedId(action.payload.modelMonitorId)], action.payload.result || []);
      return state;

    case StoreActions.MONITORING_MODELS_DESC_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MONITORING_MODELS_DESC_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelsById', '' + useNormalizedId(action.payload.modelMonitorId)], action.payload.result || {});
      state = state.setIn(['modelsByIdError', '' + useNormalizedId(action.payload.modelMonitorId)], action.payload.error);
      return state;

    case StoreActions.MODEL_MONITOR_VERSION_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.modelMonitorId) && useNormalizedId(action.payload.modelMonitorVersion) && action.payload.status) {
        state = state.updateIn(['modelVersionsById', '' + useNormalizedId(action.payload.modelMonitorId)], (modelState: any[]) => {
          if (modelState) {
            let ind1 = modelState.findIndex((v1) => v1.modelMonitorVersion === action.payload.modelMonitorVersion);
            if (ind1 > -1) {
              let d1 = modelState[ind1];
              d1 = { ...d1 };
              d1.status = action.payload.status;
              d1.lifecycle = action.payload.lifecycle;
              modelState[ind1] = d1;
              modelState = [...modelState];
            }
          }
          return modelState;
        });
      }
      return state;

    case StoreActions.MODEL_MONITOR_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.modelMonitorId) && action.payload.status) {
        state = state.updateIn(['modelsById', '' + useNormalizedId(action.payload.modelMonitorId)], (modelState: any) => {
          if (modelState != null) {
            if (Immutable.isImmutable(modelState as any)) {
              modelState = modelState.set('status', action.payload.status);
              modelState = modelState.set('lifecycle', action.payload.status);
            } else {
              modelState.status = action.payload.status;
              modelState.lifecycle = action.payload.status;
            }
          }
          return modelState;
        });
      }
      return state;

    default:
      return state;
  }
};

monitoring.calcModelsAll = (state?: any, onlyStarred?) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.monitoring) {
    state = state.monitoring;
  }

  return state.getIn(['modelsAll' + (onlyStarred ? '_starred' : '')]);
};

monitoring.memModelsAll = (doCall, onlyStarred) => {
  let state = Utils.globalStore().getState();
  if (state.monitoring) {
    state = state.monitoring;
  }

  let res = monitoring.calcModelsAll(undefined, onlyStarred);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listMonitoringModelsAll_(onlyStarred);
      }
    }
  }
};

monitoring.calcModelsByProjectId = (state?: any, projectId?) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.monitoring) {
    state = state.monitoring;
  }

  return state.getIn(['modelsByProjectId', '' + projectId]);
};

monitoring.memModelsByProjectId = (doCall, projectId) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.monitoring) {
    state = state.monitoring;
  }

  let res = monitoring.calcModelsByProjectId(undefined, projectId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listMonitoringModels_(projectId);
      }
    }
  }
};

monitoring.calcEventsByAlertVersion = (state?: any, monitorAlertVersion?) => {
  monitorAlertVersion = useNormalizedId(monitorAlertVersion);
  if (!monitorAlertVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.monitoring) {
    state = state.monitoring;
  }

  return state.getIn(['alertsEventsByAlertVersion', '' + monitorAlertVersion]);
};

monitoring.memEventsByAlertVersion = (doCall, monitorAlertVersion) => {
  monitorAlertVersion = useNormalizedId(monitorAlertVersion);
  if (!monitorAlertVersion) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.monitoring) {
    state = state.monitoring;
  }

  let res = monitoring.calcEventsByAlertVersion(undefined, monitorAlertVersion);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.eventsByAlertVersion_(monitorAlertVersion);
      }
    }
  }
};

monitoring.calcAlertById = (state?: any, monitorAlertId?) => {
  monitorAlertId = useNormalizedId(monitorAlertId);
  if (!monitorAlertId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.monitoring) {
    state = state.monitoring;
  }

  return state.getIn(['alertsById', '' + monitorAlertId]);
};

monitoring.memAlertById = (doCall, monitorAlertId) => {
  monitorAlertId = useNormalizedId(monitorAlertId);
  if (!monitorAlertId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.monitoring) {
    state = state.monitoring;
  }

  let res = monitoring.calcAlertById(undefined, monitorAlertId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeMonitorAlert_(monitorAlertId);
      }
    }
  }
};

monitoring.calcModelsById = (state?: any, modelMonitorId?) => {
  modelMonitorId = useNormalizedId(modelMonitorId);
  if (!modelMonitorId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.monitoring) {
    state = state.monitoring;
  }

  return state.getIn(['modelsById', '' + modelMonitorId]);
};
monitoring.calcModelsByIdError = (state?: any, modelMonitorId?) => {
  modelMonitorId = useNormalizedId(modelMonitorId);
  if (!modelMonitorId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.monitoring) {
    state = state.monitoring;
  }

  return state.getIn(['modelsByIdError', '' + modelMonitorId]);
};

monitoring.memModelsById = (doCall, modelMonitorId) => {
  modelMonitorId = useNormalizedId(modelMonitorId);
  if (!modelMonitorId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.monitoring) {
    state = state.monitoring;
  }

  let res = monitoring.calcModelsById(undefined, modelMonitorId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeModelMonitorById_(modelMonitorId);
      }
    }
  }
};

monitoring.calcModelVersionsById = (state?: any, modelMonitorId?) => {
  modelMonitorId = useNormalizedId(modelMonitorId);
  if (!modelMonitorId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.monitoring) {
    state = state.monitoring;
  }

  return state.getIn(['modelVersionsById', '' + modelMonitorId]);
};

monitoring.memModelVersionsById = (doCall, modelMonitorId) => {
  modelMonitorId = useNormalizedId(modelMonitorId);
  if (!modelMonitorId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.monitoring) {
    state = state.monitoring;
  }

  let res = monitoring.calcModelVersionsById(undefined, modelMonitorId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listMonitoringModelVersions_(modelMonitorId);
      }
    }
  }
};

monitoring.calcMetricVersionsById = (state?: any, modelMonitorVersion?) => {
  modelMonitorVersion = useNormalizedId(modelMonitorVersion);
  if (!modelMonitorVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.monitoring) {
    state = state.monitoring;
  }

  return state.getIn(['metricByVersionId', '' + modelMonitorVersion]);
};

monitoring.memMetricVersionsById = (doCall, modelMonitorVersion) => {
  modelMonitorVersion = useNormalizedId(modelMonitorVersion);
  if (!modelMonitorVersion) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.monitoring) {
    state = state.monitoring;
  }

  let res = monitoring.calcMetricVersionsById(undefined, modelMonitorVersion);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.getMetricsModelMonitorForVersion_(modelMonitorVersion);
      }
    }
  }
};

export default monitoring;
