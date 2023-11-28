import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  samplesByProjectId: {},
}) as Immutable.Map<string, any>;

const projectsSamples = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('samplesByProjectId', Immutable.fromJS({}));
      return state;

    case StoreActions.SAMPLE_PROJECT_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.SAMPLE_PROJECT_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['samplesByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    default:
      return state;
  }
};

projectsSamples.calcSamplesByProjectId = (projectId?: string) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.projectsSamples) {
    state = state.projectsSamples;
  }

  return state.getIn(['samplesByProjectId', '' + projectId]);
};
projectsSamples.memSamplesForProjectId = (doCall, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.projectsSamples) {
    state = state.projectsSamples;
  }

  if (!projectId) {
    return null;
  } else {
    let res = projectsSamples.calcSamplesByProjectId(projectId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.getSamplesProject_(projectId);
        }
      }
    }
  }
};

export default projectsSamples;
