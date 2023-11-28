import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  customLossFunctionsById: {},
  customLossFunctionsListById: {},
  availableLossTypesList: null,
}) as Immutable.Map<string, any>;

const customLossFunctions = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('customLossFunctionsById', Immutable.fromJS({}));
      state = state.set('customLossFunctionsListById', Immutable.fromJS({}));
      return state;

    case StoreActions.CUSTOM_LOSS_FUNCTION_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.CUSTOM_LOSS_FUNCTION_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['customLossFunctionsById', '' + useNormalizedId(action.payload.name)], action.payload.result || {});
      return state;

    case StoreActions.CUSTOM_LOSS_FUNCTIONS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.CUSTOM_LOSS_FUNCTIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['customLossFunctionsListById', 'all'], action.payload.result || []);
      return state;

    case StoreActions.AVAILABLE_LOSS_TYPES_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.AVAILABLE_LOSS_TYPES_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['availableLossTypesList'], action.payload.result || []);
      return state;

    default:
      return state;
  }
};

customLossFunctions.calcCustomLossFunctionsById = (state?: any, name?) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.customLossFunctions) {
    state = state.customLossFunctions;
  }

  return state.getIn(['customLossFunctionsById', '' + name]);
};

customLossFunctions.memCustomLossFunctionsById = (doCall, name: string) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.customLossFunctions) {
    state = state.customLossFunctions;
  }

  let res = customLossFunctions.calcCustomLossFunctionsById(undefined, name);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeCustomLossFunction_(name);
      }
    }
  }
};

customLossFunctions.calcListCustomLossFunctionsById = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.customLossFunctions) {
    state = state.customLossFunctions;
  }

  return state.getIn(['customLossFunctionsListById', 'all']);
};

customLossFunctions.memListCustomLossFunctionsById = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.customLossFunctions) {
    state = state.customLossFunctions;
  }

  let res = customLossFunctions.calcListCustomLossFunctionsById(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listCustomLossFunctions_();
      }
    }
  }
};

customLossFunctions.calcAvailableLossTypes = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.customLossFunctions) {
    state = state.customLossFunctions;
  }

  return state.getIn(['availableLossTypesList']);
};

customLossFunctions.memAvailableLossTypes = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.customLossFunctions) {
    state = state.customLossFunctions;
  }

  let res = customLossFunctions.calcAvailableLossTypes(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listAvailableLossTypes_();
      }
    }
  }
};

export default customLossFunctions;
