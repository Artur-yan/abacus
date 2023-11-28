import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum PythonFunctionTypeParam {
  PLOTLY_FIG = 'PLOTLY_FIG',
  FEATURE_GROUP = 'FEATURE_GROUP',
}

let initState = Immutable.fromJS({
  isRefreshing: 0,
  pythonFunctionsById: {},
  pythonFunctionsListById: {},
}) as Immutable.Map<string, any>;

const pythonFunctions = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('pythonFunctionsById', Immutable.fromJS({}));
      state = state.set('pythonFunctionsListById', Immutable.fromJS({}));
      return state;

    case StoreActions.PYTHON_FUNCTIONS_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PYTHON_FUNCTIONS_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['pythonFunctionsById', '' + useNormalizedId(action.payload.name)], action.payload.result || {});
      return state;

    case StoreActions.PYTHON_FUNCTIONS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PYTHON_FUNCTIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['pythonFunctionsListById', useNormalizedId(action.payload.functionType) || 'all'], action.payload.result || []);
      return state;

    default:
      return state;
  }
};

pythonFunctions.calcPythonFunctionsById = (state?: any, name?) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.pythonFunctions) {
    state = state.pythonFunctions;
  }

  return state.getIn(['pythonFunctionsById', '' + name]);
};

pythonFunctions.memPythonFunctionsById = (doCall, name: string) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.pythonFunctions) {
    state = state.pythonFunctions;
  }

  let res = pythonFunctions.calcPythonFunctionsById(undefined, name);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describePythonFunction_(name);
      }
    }
  }
};

pythonFunctions.memPythonFunctionsByIdTillCodeCheckComplete = (doCall, name: string) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.pythonFunctions) {
    state = state.pythonFunctions;
  }

  let res = pythonFunctions.calcPythonFunctionsById(undefined, name);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describePythonFunctionTillCodeCheckComplete_(name);
      }
    }
  }
};

pythonFunctions.calcListPythonFunctionsById = (state?: any, functionType?) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.pythonFunctions) {
    state = state.pythonFunctions;
  }

  functionType = useNormalizedId(functionType);

  return state.getIn(['pythonFunctionsListById', functionType ?? 'all']);
};

pythonFunctions.memListPythonFunctionsById = (doCall, functionType?) => {
  let state = Utils.globalStore().getState();
  if (state.pythonFunctions) {
    state = state.pythonFunctions;
  }

  let res = pythonFunctions.calcListPythonFunctionsById(undefined, functionType);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listPythonFunctions_(functionType);
      }
    }
  }
};

export default pythonFunctions;
