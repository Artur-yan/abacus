import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId, useNormalizedIdArray } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  metricsVersions: {},
  metricsVersionOne: {},
  isRefreshing: 0,
}) as Immutable.Map<string, any>;

const metrics = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('metricsVersions', Immutable.fromJS({}));
      state = state.set('metricsVersionOne', Immutable.fromJS({}));
      return state;

    case StoreActions.RESET_METRICS_VERSIONS:
      state = state.set('metricsVersions', Immutable.fromJS({}));
      state = state.set('metricsVersionOne', Immutable.fromJS({}));
      return state;

    case StoreActions.METRICS_VERSIONS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.METRICS_VERSIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['metricsVersions', '' + (useNormalizedId(action.payload.detailModelId) || '-')], action.payload.result || []);
      return state;

    case StoreActions.METRICS_VERSIONONE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.METRICS_VERSIONONE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(
        [
          'metricsVersionOne',
          '' +
            (useNormalizedId(action.payload.modelVersion) || '-') +
            '_' +
            (useNormalizedId(action.payload.algorithm) ?? '') +
            '_' +
            (useNormalizedId(action.payload.validation) ?? '') +
            '_' +
            (useNormalizedIdArray(action.payload.additionalMetricsKeys)?.join(',') ?? '') +
            '_' +
            (useNormalizedId(action.payload.nRows) ?? '') +
            '_' +
            (useNormalizedId(action.payload.sortByClass) ?? '') +
            '_' +
            (useNormalizedId(action.payload.dataClusterType) ?? '') +
            '_' +
            (useNormalizedId(action.payload.sortPreference) ?? ''),
        ],
        action.payload.result || {},
      );
      return state;

    case StoreActions.METRICS_VERSIONONE_RESET:
      state = state.set('metricsVersionOne', Immutable.fromJS({}));
      return state;

    default:
      return state;
  }
};

metrics.memMetricVersions = (state: any, detailModelId: string, doCall = false) => {
  detailModelId = useNormalizedId(detailModelId);
  if (!detailModelId) {
    return null;
  }

  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.metrics) {
    state = state.metrics;
  }

  let res = state.getIn(['metricsVersions', '' + (detailModelId || '-')]);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.getMetricsVersions_(detailModelId);
      }
    }
  }
};

metrics.memMetricVersionOne = (
  state: any,
  modelVersion: string,
  algorithm: string,
  validation: boolean = null,
  additionalMetricsKeys: string[] = null,
  nRows = null,
  sortByClass = null,
  dataClusterType = null,
  sortPreference: string = '',
  doCall = false,
) => {
  modelVersion = useNormalizedId(modelVersion);
  validation = useNormalizedId(validation);
  algorithm = useNormalizedId(algorithm);
  sortByClass = useNormalizedId(sortByClass);
  nRows = useNormalizedId(nRows);
  dataClusterType = useNormalizedId(dataClusterType);
  additionalMetricsKeys = useNormalizedIdArray(additionalMetricsKeys);
  if (!modelVersion) {
    return null;
  }

  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.metrics) {
    state = state.metrics;
  }

  let res = state.getIn([
    'metricsVersionOne',
    '' +
      (modelVersion || '-') +
      '_' +
      (algorithm ?? '') +
      '_' +
      (validation ?? '') +
      '_' +
      (additionalMetricsKeys?.join(',') ?? '') +
      '_' +
      (nRows ?? '') +
      '_' +
      (sortByClass ?? '') +
      '_' +
      (dataClusterType ?? '') +
      '_' +
      (sortPreference ?? ''),
  ]);

  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.getMetricsVersionOne_(modelVersion, algorithm, validation, additionalMetricsKeys, nRows, sortByClass, dataClusterType, sortPreference);
      }
    }
  }
};

export default metrics;
