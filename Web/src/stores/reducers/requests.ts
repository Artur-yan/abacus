import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,

  requestById: {},
  requestBPById: {},
}) as Immutable.Map<string, any>;

const requests = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('requestById', Immutable.fromJS({}));
      state = state.set('requestBPById', Immutable.fromJS({}));
      return state;

    case StoreActions.LIST_REQUESTS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.LIST_REQUESTS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['requestById', '' + useNormalizedId(action.payload.deployId) + '_' + useNormalizedId(action.payload.requestId)], action.payload.result || {});
      return state;

    case StoreActions.LIST_REQUESTS_BP_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.LIST_REQUESTS_BP_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['requestBPById', '' + useNormalizedId(action.payload.batchPredictionVersion) + '_' + useNormalizedId(action.payload.requestBPId)], action.payload.result || {});
      return state;

    default:
      return state;
  }
};

requests.calcRequestById = (deployId?: string, requestId?) => {
  deployId = useNormalizedId(deployId);
  requestId = useNormalizedId(requestId);
  if (!requestId || !deployId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.requests) {
    state = state.requests;
  }

  return state.getIn(['requestById', '' + deployId + '_' + requestId]);
};

requests.memRequestById = (doCall, state?: any, deployId?: string, requestId?: any) => {
  deployId = useNormalizedId(deployId);
  requestId = useNormalizedId(requestId);
  if (!requestId || !deployId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.requests) {
    state = state.requests;
  }

  if (state) {
    let res = requests.calcRequestById(deployId, requestId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions._getRequestById(deployId, requestId);
    }
  }
};

requests.calcRequestBPById = (batchPredictionVersion?: string, requestBPId?) => {
  batchPredictionVersion = useNormalizedId(batchPredictionVersion);
  requestBPId = useNormalizedId(requestBPId);
  if (requestBPId == null || batchPredictionVersion == null) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.requests) {
    state = state.requests;
  }

  return state.getIn(['requestBPById', '' + batchPredictionVersion + '_' + requestBPId]);
};

requests.memRequestBPById = (doCall, state?: any, batchPredictionVersion?: string, requestBPId?: any) => {
  batchPredictionVersion = useNormalizedId(batchPredictionVersion);
  requestBPId = useNormalizedId(requestBPId);
  if (requestBPId == null || batchPredictionVersion == null) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.requests) {
    state = state.requests;
  }

  if (state) {
    let res = requests.calcRequestBPById(batchPredictionVersion, requestBPId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions._getRequestBPById(batchPredictionVersion, requestBPId);
    }
  }
};

export default requests;
