import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  needRefresh: true,
  isRefreshing: 0,
  deploymentsTokensByProjectId: {},
}) as Immutable.Map<string, any>;

export const calcDeploymentsTokensByProjectId = (state?: any, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deploymentsTokens) {
    state = state.deploymentsTokens;
  }

  return state.getIn(['deploymentsTokensByProjectId', '' + projectId]);
};

const deploymentsTokens = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('deploymentsTokensByProjectId', Immutable.fromJS({}));
      return state;

    case StoreActions.DEPLOY_TOKENS_PROJECT_START:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);

      state = state.updateIn(['deploymentsTokensByProjectId', '' + useNormalizedId(action.payload.projectId)], (projectState) => {
        if (!projectState) {
          projectState = [];
        }
        return projectState;
      });
      return state;

    case StoreActions.DEPLOY_TOKENS_PROJECT_END:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      state = state.updateIn(['deploymentsTokensByProjectId', '' + useNormalizedId(action.payload.projectId)], (projectState) => {
        projectState = action.payload.result || [];
        return projectState;
      });

      return state;

    default:
      return state;
  }
};

deploymentsTokens.memDeploymentTokensList = (doCall, deploymentsTokens, projectId) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (deploymentsTokens == null) {
    deploymentsTokens = Utils.globalStore().getState();
    if (deploymentsTokens.deploymentsTokens) {
      deploymentsTokens = deploymentsTokens.deploymentsTokens;
    }
  }

  if (deploymentsTokens) {
    let res = calcDeploymentsTokensByProjectId(undefined, projectId);
    if (res == null) {
      if (deploymentsTokens.get('isRefreshing')) {
        return;
      }

      if (doCall) {
        StoreActions.deployTokensList_(projectId);
      }
    } else {
      return res;
    }
  }
};

export default deploymentsTokens;
