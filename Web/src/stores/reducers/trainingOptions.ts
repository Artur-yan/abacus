import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';
import { normList } from './defDatasets';

let initState = Immutable.fromJS({
  trainingOptionsList: {},
  trainingOptionsListError: {},
  isRefreshing: 0,
  algorithmModelConfigs: [],
}) as Immutable.Map<string, any>;

export const calcTrainingOptionsList = (state?: any, projectId?: string, featureGroupIds?: string[], forRetrain?: boolean) => {
  projectId = useNormalizedId(projectId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.trainingOptions) {
    state = state.trainingOptions;
  }

  featureGroupIds = normList(featureGroupIds);

  return state.getIn(['trainingOptionsList', '' + projectId + (featureGroupIds == null ? '' : featureGroupIds.join('-')) + '_' + (forRetrain ? '1' : '0')]);
};

export const calcTrainingOptionsIsProcessing = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.trainingOptions) {
    state = state.trainingOptions;
  }

  return state.get('isRefreshing') > 0;
};

export const calcTrainingOptionsListError = (state?: any, projectId?: string, featureGroupIds?: string[], forRetrain?: boolean) => {
  projectId = useNormalizedId(projectId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.trainingOptions) {
    state = state.trainingOptions;
  }

  featureGroupIds = normList(featureGroupIds);

  return state.getIn(['trainingOptionsListError', '' + projectId + (featureGroupIds == null ? '' : featureGroupIds.join('-')) + '_' + (forRetrain ? '1' : '0')]);
};

export const calcAlgorithmModelConfigList = () => {
  let state = Utils.globalStore().getState();

  if (state.trainingOptions) {
    state = state.trainingOptions;
    return state.getIn(['algorithmModelConfigs']);
  }
};

const trainingOptions = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('trainingOptionsList', Immutable.fromJS({}));
      state = state.set('trainingOptionsListError', Immutable.fromJS({}));
      return state;

    case StoreActions.TRAINING_OPTIONS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(
        [
          'trainingOptionsListError',
          '' + useNormalizedId(action.payload.projectId) + (normList(action.payload.featureGroupIds) == null ? '' : normList(action.payload.featureGroupIds).join('-')) + '_' + (action.payload.forRetrain ? '1' : '0'),
        ],
        null,
      );
      state = state.setIn(['algorithmModelConfigs'], action.payload.algorithmModelConfigs ?? []);
      return state;

    case StoreActions.TRAINING_OPTIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(
        ['trainingOptionsList', '' + useNormalizedId(action.payload.projectId) + (normList(action.payload.featureGroupIds) == null ? '' : normList(action.payload.featureGroupIds).join('-')) + '_' + (action.payload.forRetrain ? '1' : '0')],
        action.payload.result || [],
      );
      state = state.setIn(
        [
          'trainingOptionsListError',
          '' + useNormalizedId(action.payload.projectId) + (normList(action.payload.featureGroupIds) == null ? '' : normList(action.payload.featureGroupIds).join('-')) + '_' + (action.payload.forRetrain ? '1' : '0'),
        ],
        action.payload.error ?? null,
      );
      return state;

    default:
      return state;
  }
};

export default trainingOptions;
