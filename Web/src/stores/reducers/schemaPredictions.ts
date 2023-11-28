import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  schema_byModelId: {},
  schema_byModelIdError: {},
}) as Immutable.Map<string, any>;

export const calcSchemaByModelId = (state?: any, modelId?: string) => {
  modelId = useNormalizedId(modelId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.schemaPredictions) {
    state = state.schemaPredictions;
  }

  return state.getIn(['schema_byModelId', '' + modelId]);
};

export const calcSchemaByModelIdError = (state?: any, modelId?: string) => {
  modelId = useNormalizedId(modelId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.schemaPredictions) {
    state = state.schemaPredictions;
  }

  return state.getIn(['schema_byModelIdError', '' + modelId]);
};

const schemaPredictions = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('schema_byModelId', Immutable.fromJS({}));
      state = state.set('schema_byModelIdError', Immutable.fromJS({}));
      return state;

    case StoreActions.SCHEMA_MODEL_VERSION_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(['schema_byModelId', '' + useNormalizedId(action.payload.modelId)], null);
      state = state.setIn(['schema_byModelIdError', '' + useNormalizedId(action.payload.modelId)], null);
      return state;

    case StoreActions.SCHEMA_MODEL_VERSION_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['schema_byModelId', '' + useNormalizedId(action.payload.modelId)], Immutable.fromJS(action.payload.result || {}));
      state = state.setIn(['schema_byModelIdError', '' + useNormalizedId(action.payload.modelId)], action.payload.error || null);
      return state;

    default:
      return state;
  }
};

export default schemaPredictions;
