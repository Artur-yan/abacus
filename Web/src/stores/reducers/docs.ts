import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export const calcDocsMethodSampleCode = (state?: any, methodName?: string) => {
  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.docs) {
    state = state.docs;
  }

  return state.getIn(['codeByMethod', '' + useNormalizedId(methodName)]);
};

let initState = Immutable.fromJS({
  isRefreshing: 0,
  codeByMethod: {},
}) as Immutable.Map<string, any>;

const docs = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.DOCS_METHOD_SAMPLE_CODE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DOCS_METHOD_SAMPLE_CODE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['codeByMethod', '' + (useNormalizedId(action.payload.methodName) || '-')], action.payload.result ?? {});

      return state;

    default:
      return state;
  }
};

docs.memCodeSample = (doCall, methodName) => {
  methodName = useNormalizedId(methodName);
  if (Utils.isNullOrEmpty(methodName)) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.docs) {
    state = state.docs;
  }

  let res = calcDocsMethodSampleCode(undefined, methodName);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.getDocsSampleCode_(methodName);
      }
    }
  }
};

export default docs;
