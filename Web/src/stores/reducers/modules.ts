import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  modulesById: {},
  modulesListById: {},
  supportedCustomMetricProblemTypes: null,
}) as Immutable.Map<string, any>;

const modules = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('modulesById', Immutable.fromJS({}));
      state = state.set('modulesListById', Immutable.fromJS({}));
      return state;

    case StoreActions.MODULE_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MODULE_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modulesById', '' + useNormalizedId(action.payload.name)], action.payload.result || {});
      return state;

    case StoreActions.MODULES_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MODULES_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modulesListById', 'all'], action.payload.result || []);
      return state;

    default:
      return state;
  }
};

modules.calcModulesById = (state?: any, name?) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.modules) {
    state = state.modules;
  }

  return state.getIn(['modulesById', '' + name]);
};

modules.memModulesById = (doCall, name: string) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.modules) {
    state = state.modules;
  }

  let res = modules.calcModulesById(undefined, name);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeModule_(name);
      }
    }
  }
};

modules.calcListModulesById = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.modules) {
    state = state.modules;
  }

  return state.getIn(['modulesListById', 'all']);
};

modules.memListModulesById = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.modules) {
    state = state.modules;
  }

  let res = modules.calcListModulesById(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listModules_();
      }
    }
  }
};

export default modules;
