import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum BatchPredLifecycle {
  UPLOADING = 'UPLOADING',
  PENDING = 'PENDING',
  PREDICTING = 'PREDICTING',
  COMPLETE = 'COMPLETE',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export const BatchPredLifecycleDesc = {
  [BatchPredLifecycle.UPLOADING]: 'Uploading',
  [BatchPredLifecycle.PENDING]: 'Pending',
  [BatchPredLifecycle.PREDICTING]: 'Predicting',
  [BatchPredLifecycle.COMPLETE]: 'Complete',
  [BatchPredLifecycle.CANCELLED]: 'Cancelled',
  [BatchPredLifecycle.FAILED]: 'Failed',
};

let initState = Immutable.fromJS({
  isRefreshing: 0,
  batchByProjectId: {},
  batchPredById: {},
  batchPredByIdError: {},
  batchPredVersionById: {},
  batchVersionListById: {},
}) as Immutable.Map<string, any>;

const batchPred = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('batchByProjectId', Immutable.fromJS({}));
      state = state.set('batchPredById', Immutable.fromJS({}));
      state = state.set('batchPredByIdError', Immutable.fromJS({}));
      state = state.set('batchPredVersionById', Immutable.fromJS({}));
      state = state.set('batchVersionListById', Immutable.fromJS({}));
      return state;

    case StoreActions.BATCH_DESCRIBE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.BATCH_DESCRIBE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['batchPredById', '' + useNormalizedId(action.payload.batchPredId)], action.payload.result || []);
      state = state.setIn(['batchPredByIdError', '' + useNormalizedId(action.payload.batchPredId)], action.payload.error);

      return state;

    case StoreActions.BATCH_DESCRIBE_VERSION_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.BATCH_DESCRIBE_VERSION_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['batchPredVersionById', '' + useNormalizedId(action.payload.batchPredVersionId)], action.payload.result || []);

      return state;

    case StoreActions.BATCH_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.BATCH_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['batchByProjectId', '' + useNormalizedId(action.payload.projectId) + '_' + useNormalizedId(action.payload.deploymentId ?? '-')], action.payload.result || []);

      return state;

    case StoreActions.BATCH_LIST_VERSIONS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.BATCH_LIST_VERSIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['batchVersionListById', '' + useNormalizedId(action.payload.batchPredId)], action.payload.result || []);

      return state;

    case StoreActions.BATCH_VERSION_UPDATE_LIFECYCLE:
      state = state.updateIn(['batchPredVersionById', '' + useNormalizedId(action.payload.batchPredictionVersionId)], (batchStatus: any) => {
        if (batchStatus) {
          batchStatus = { ...batchStatus };
          batchStatus.status = action.payload.status;
        }
        return batchStatus;
      });
      if (action.payload.batchPredictionId) {
        state = state.updateIn(['batchVersionListById', '' + useNormalizedId(action.payload.batchPredictionId)], (batchStatus: any[]) => {
          if (batchStatus) {
            let ind = batchStatus.findIndex((b1) => b1.batchPredictionVersionId === action.payload.batchPredictionVersionId);
            if (ind > -1 && batchStatus[ind]) {
              batchStatus[ind].status = action.payload.status;
              batchStatus = [...batchStatus];
            }
          }
          return batchStatus;
        });
      }

      return state;

    case StoreActions.BATCH_RESET_ALL_FOR_PROJECTS:
      state = state.set('batchByProjectId', Immutable.fromJS({}));
      return state;

    case StoreActions.BATCH_UPDATE_LIFECYCLE:
      state = state.updateIn(['batchByProjectId', '' + useNormalizedId(action.payload.projectId) + '_' + useNormalizedId(action.payload.deploymentId ?? '-')], (batchStatus: any[]) => {
        if (batchStatus) {
          let ind = batchStatus.findIndex((b1) => b1.batchPredictionId === action.payload.batchPredictionId);
          if (ind > -1 && batchStatus[ind]) {
            batchStatus[ind].status = action.payload.status;
            batchStatus = [...batchStatus];
          }
        }
        return batchStatus;
      });

      return state;

    default:
      return state;
  }
};

batchPred.calcBatchList = (state?: any, projectId?: string, deploymentId?: string) => {
  projectId = useNormalizedId(projectId);
  deploymentId = useNormalizedId(deploymentId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.batchPred) {
    state = state.batchPred;
  }

  return state.getIn(['batchByProjectId', '' + projectId + '_' + (deploymentId ?? '-')]);
};

batchPred.memBatchList = (state?: any, projectId?: string, deploymentId?: string, doCall = false) => {
  projectId = useNormalizedId(projectId);
  deploymentId = useNormalizedId(deploymentId);
  if (!projectId) {
    return null;
  }

  let res = batchPred.calcBatchList(undefined, projectId, deploymentId);
  if (res != null) {
    return res;
  } else {
    if (state == null) {
      state = Utils.globalStore().getState();
    }

    if (state.batchPred) {
      state = state.batchPred;
    }

    if (state.get('isRefreshing') !== 0) {
      return null;
    } else {
      if (doCall) {
        StoreActions.batchList_(projectId, deploymentId);
      }
    }
  }
};

batchPred.calcBatchListVersions = (state?: any, batchPredId?: string) => {
  batchPredId = useNormalizedId(batchPredId);
  if (!batchPredId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.batchPred) {
    state = state.batchPred;
  }

  return state.getIn(['batchVersionListById', batchPredId]);
};

batchPred.memBatchListVersions = (state?: any, batchPredId?: string, doCall = false) => {
  batchPredId = useNormalizedId(batchPredId);
  if (!batchPredId) {
    return null;
  }

  let res = batchPred.calcBatchListVersions(undefined, batchPredId);
  if (res != null) {
    return res;
  } else {
    if (state == null) {
      state = Utils.globalStore().getState();
    }

    if (state.batchPred) {
      state = state.batchPred;
    }

    if (state.get('isRefreshing') !== 0) {
      return null;
    } else {
      if (doCall) {
        StoreActions.batchListVersions_(batchPredId);
      }
    }
  }
};

batchPred.calcBatchDescribe = (state?: any, batchPredId?: string) => {
  batchPredId = useNormalizedId(batchPredId);
  if (!batchPredId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.batchPred) {
    state = state.batchPred;
  }

  return state.getIn(['batchPredById', batchPredId]);
};
batchPred.calcBatchDescribeError = (state?: any, batchPredId?: string) => {
  batchPredId = useNormalizedId(batchPredId);
  if (!batchPredId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.batchPred) {
    state = state.batchPred;
  }

  return state.getIn(['batchPredByIdError', batchPredId]);
};

batchPred.memBatchDescribe = (state?: any, batchPredId?: string, doCall = false) => {
  batchPredId = useNormalizedId(batchPredId);
  if (!batchPredId) {
    return null;
  }

  let res = batchPred.calcBatchDescribe(undefined, batchPredId);
  if (res != null) {
    return res;
  } else {
    if (state == null) {
      state = Utils.globalStore().getState();
    }

    if (state.batchPred) {
      state = state.batchPred;
    }

    if (state.get('isRefreshing') !== 0) {
      return null;
    } else {
      if (doCall) {
        StoreActions.batchDescribeById_(batchPredId);
      }
    }
  }
};

batchPred.calcBatchDescribeVersion = (state?: any, batchPredVersionId?: string) => {
  batchPredVersionId = useNormalizedId(batchPredVersionId);
  if (!batchPredVersionId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.batchPred) {
    state = state.batchPred;
  }

  return state.getIn(['batchPredVersionById', batchPredVersionId]);
};

batchPred.memBatchDescribeVersion = (state?: any, batchPredVersionId?: string, doCall = false) => {
  batchPredVersionId = useNormalizedId(batchPredVersionId);
  if (!batchPredVersionId) {
    return null;
  }

  let res = batchPred.calcBatchDescribeVersion(undefined, batchPredVersionId);
  if (res != null) {
    return res;
  } else {
    if (state == null) {
      state = Utils.globalStore().getState();
    }

    if (state.batchPred) {
      state = state.batchPred;
    }

    if (state.get('isRefreshing') !== 0) {
      return null;
    } else {
      if (doCall) {
        StoreActions.batchVersionDescribeById_(batchPredVersionId);
      }
    }
  }
};

export default batchPred;
