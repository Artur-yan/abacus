import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  codeByDeployId: {},
}) as Immutable.Map<string, any>;

const deploymentsCode = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('codeByDeployId', Immutable.fromJS({}));
      return state;

    case StoreActions.DEPLOY_SAMPLE_CODE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEPLOY_SAMPLE_CODE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['codeByDeployId', '' + useNormalizedId(action.payload.deploymentId)], action.payload.result || {});
      return state;

    default:
      return state;
  }
};

deploymentsCode.calcSampleByDeployId = (state?: any, deploymentId?: string) => {
  deploymentId = useNormalizedId(deploymentId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deploymentsCode) {
    state = state.deploymentsCode;
  }

  return state.getIn(['codeByDeployId', '' + deploymentId]);
};
deploymentsCode.memSampleForDeployId = (doCall, deploymentId?: string) => {
  deploymentId = useNormalizedId(deploymentId);
  let state = Utils.globalStore().getState();
  if (state.deploymentsCode) {
    state = state.deploymentsCode;
  }

  if (!deploymentId) {
    return null;
  } else {
    let res = deploymentsCode.calcSampleByDeployId(undefined, deploymentId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.getSampleDeployCodeByDeployId_(deploymentId);
        }
      }
    }
  }
};

export default deploymentsCode;
