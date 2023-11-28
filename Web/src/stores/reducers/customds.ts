import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum CustomDSLifecycle {
  PENDING = 'PENDING',
  DEPLOYING = 'DEPLOYING',
  STOPPING = 'STOPPING',
  ACTIVE = 'ACTIVE',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PENDING_STOPPING = 'PENDING_STOPPING',
}

export const CustomDSLifecycleDesc = {
  [CustomDSLifecycle.PENDING]: Utils.upperFirst('PENDING'),
  [CustomDSLifecycle.DEPLOYING]: Utils.upperFirst('DEPLOYING'),
  [CustomDSLifecycle.STOPPING]: Utils.upperFirst('STOPPING'),
  [CustomDSLifecycle.ACTIVE]: Utils.upperFirst('ACTIVE'),
  [CustomDSLifecycle.STOPPED]: Utils.upperFirst('STOPPED'),
  [CustomDSLifecycle.FAILED]: Utils.upperFirst('FAILED'),
  [CustomDSLifecycle.CANCELLED]: Utils.upperFirst('CANCELLED'),
  [CustomDSLifecycle.PENDING_STOPPING]: Utils.upperFirst('STOPPING'),
};

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: null,
  thisDataserver: null,
}) as Immutable.Map<string, any>;

const customds = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('list', null);
      state = state.set('thisDataserver', null);
      return state;

    case StoreActions.CDS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.CDS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('list', action.payload.result ?? []);
      state = state.set('thisDataserver', action.payload.result?.[0] ?? {});
      return state;

    case StoreActions.CDS_UPDATE_LIFECYCLE:
      if (state.get('thisDataserver') != null) {
        state = state.setIn(['thisDataserver', 'status'], useNormalizedId(action.payload.status));
      }
      return state;

    default:
      return state;
  }
};

customds.calcThisDataserver = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.customds) {
    state = state.customds;
  }

  return state.getIn(['thisDataserver']);
};

customds.memThisDataserver = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.customds) {
    state = state.customds;
  }

  let res = customds.calcThisDataserver(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listCDS_();
      }
    }
  }
};

export default customds;
