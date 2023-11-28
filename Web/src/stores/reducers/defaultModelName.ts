import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export const calcDefaultModelName = (state?: any, projectId?: string) => {
  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.defaultModelName) {
    state = state.defaultModelName;
  }

  projectId = useNormalizedId(projectId);

  return state.getIn(['data', '' + (projectId ?? '')]);
};

let initState = Immutable.fromJS({
  isRefreshing: 0,
  data: {},
}) as Immutable.Map<string, any>;

const defaultModelName = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('data', Immutable.fromJS({}));
      return state;

    case StoreActions.DEFAULT_MODEL_NAME_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEFAULT_MODEL_NAME_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['data', '' + (useNormalizedId(action.payload.projectId) ?? '')], action.payload.result || '');

      return state;

    default:
      return state;
  }
};

export default defaultModelName;
