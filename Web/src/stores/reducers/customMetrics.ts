import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  customMetricsById: {},
  customMetricsListById: {},
  supportedCustomMetricProblemTypes: null,
}) as Immutable.Map<string, any>;

const customMetrics = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('customMetricsById', Immutable.fromJS({}));
      state = state.set('customMetricsListById', Immutable.fromJS({}));
      return state;

    case StoreActions.CUSTOM_METRIC_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.CUSTOM_METRIC_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['customMetricsById', '' + useNormalizedId(action.payload.name)], action.payload.result || {});
      return state;

    case StoreActions.CUSTOM_METRICS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.CUSTOM_METRICS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['customMetricsListById', 'all'], action.payload.result || []);
      return state;

    case StoreActions.SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['supportedCustomMetricProblemTypes'], action.payload.result || []);
      return state;

    default:
      return state;
  }
};

customMetrics.calcCustomMetricsById = (state?: any, name?) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.customMetrics) {
    state = state.customMetrics;
  }

  return state.getIn(['customMetricsById', '' + name]);
};

customMetrics.memCustomMetricsById = (doCall, name: string) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.customMetrics) {
    state = state.customMetrics;
  }

  let res = customMetrics.calcCustomMetricsById(undefined, name);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeCustomMetric_(name);
      }
    }
  }
};

customMetrics.calcListCustomMetricsById = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.customMetrics) {
    state = state.customMetrics;
  }

  return state.getIn(['customMetricsListById', 'all']);
};

customMetrics.memListCustomMetricsById = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.customMetrics) {
    state = state.customMetrics;
  }

  let res = customMetrics.calcListCustomMetricsById(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listCustomMetrics_();
      }
    }
  }
};

customMetrics.calcSupportedCustomMetricProblemTypes = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.customMetrics) {
    state = state.customMetrics;
  }

  return state.getIn(['supportedCustomMetricProblemTypes']);
};

customMetrics.memSupportedCustomMetricProblemTypes = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.customMetrics) {
    state = state.customMetrics;
  }

  let res = customMetrics.calcSupportedCustomMetricProblemTypes(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listSupportedCustomMetricProblemTypes_();
      }
    }
  }
};

export default customMetrics;
