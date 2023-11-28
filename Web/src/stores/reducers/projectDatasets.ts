import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  datasetByProjectId: {},
}) as Immutable.Map<string, any>;

export const calcDatasetForProjectId = (state?: any, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.projectDatasets) {
    state = state.projectDatasets;
  }

  return state.getIn(['datasetByProjectId', '' + projectId]);
};

const projectDatasets = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('datasetByProjectId', Immutable.fromJS({}));
      return state;

    case StoreActions.PROJECT_DATASET_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);

      return state;

    case StoreActions.PROJECT_DATASET_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      let result = action.payload.result;
      if (!result) {
        result = [];
      }

      if (result) {
        state = state.setIn(['datasetByProjectId', '' + useNormalizedId(action.payload.projectId)], result);
      }
      return state;

    default:
      return state;
  }
};

projectDatasets.memDatasetsByProjectId = (doCall, state?: any, projectId?: any) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.projectDatasets) {
    state = state.projectDatasets;
  }

  if (state) {
    let res = calcDatasetForProjectId(state, projectId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.getProjectDatasets_(projectId);
    }
  }
};

export default projectDatasets;
