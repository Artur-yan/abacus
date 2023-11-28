import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import StoreActions from '../actions/StoreActions';

export interface IUserPublicOne {
  name?;
  picture?;
  userHandle?;
  userId?;
  bio?;
  socialHandles?: {
    github?;
    twitter?;
    linkedin?;
  };
  organizationName?;
  joined?;
}

let initState = Immutable.fromJS({
  isRefreshing: 0,
  modelsList: {},
  modelsDetailByModelId: {},
  modelsCommentsByModelId: {},
  modelsUserPublicByUserHandle: {},
  modelsGraphsByModelId: {},
  modelsMetricsByModelId: {},
}) as Immutable.Map<string, any>;

const devcenter = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.DEVCENTER_UPVOTE_CHANGE:
      const upvoteDiff = action.payload.diff;
      if (action.payload.modelId && upvoteDiff != null && upvoteDiff !== 0) {
        state = state.withMutations((stateMut) => {
          const modelsList = stateMut.get('modelsList');
          let kk = modelsList.keySeq();
          kk?.forEach((k1) => {
            let list = modelsList.get(k1);
            let anyChange = false;
            list?.some((item) => {
              if (item?.modelId === action.payload.modelId) {
                anyChange = true;
                // prettier-ignore
                if (item.voted !== (upvoteDiff > 0)) {
                  item.voted = upvoteDiff > 0;
                  item.votes += upvoteDiff;
                }
              }
            });
            if (anyChange) {
              stateMut.setIn(['modelsList', k1], [...list]);
            }
          });

          return stateMut;
        });
      }
      return state;

    case StoreActions.DEVCENTER_LISTING_RETRIEVE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEVCENTER_LISTING_RETRIEVE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      let modelBy = '-';
      if (action.payload.pageSize || action.payload.lastSeenModelId || action.payload.userHandle || action.payload.useCase || action.payload.sortBy || action.payload.isVotes) {
        modelBy =
          (action.payload.pageSize ?? '-') +
          '_' +
          (action.payload.lastSeenModelId ?? '-') +
          '_' +
          (action.payload.userHandle ?? '-') +
          '_' +
          (action.payload.useCase ?? '-') +
          '_' +
          (action.payload.sortBy ?? '-') +
          '_' +
          (action.payload.isVotes ? '1' : '0');
      }

      let last = [];
      let removeModelBy = '-';
      if (action.payload.pageSize || action.payload.removeLastSeenModelId || action.payload.userHandle || action.payload.useCase || action.payload.sortBy || action.payload.isVotes) {
        removeModelBy =
          (action.payload.pageSize ?? '-') +
          '_' +
          (action.payload.removeLastSeenModelId ?? '-') +
          '_' +
          (action.payload.userHandle ?? '-') +
          '_' +
          (action.payload.useCase ?? '-') +
          '_' +
          (action.payload.sortBy ?? '-') +
          '_' +
          (action.payload.isVotes ? '1' : '0');

        const last1 = state.getIn(['modelsList', removeModelBy]);
        if (last1 != null) {
          last = last1 as any;
        }
      }

      state = state.deleteIn(['modelsList', removeModelBy || '-']);

      last = (last || []).concat(action.payload.result || []);
      state = state.setIn(['modelsList', modelBy || '-'], last || []);
      return state;

    case StoreActions.DEVCENTER_MODEL_DETAIL_RETRIEVE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEVCENTER_MODEL_DETAIL_RETRIEVE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelsDetailByModelId', action.payload.modelId], action.payload.result || {});
      return state;

    case StoreActions.DEVCENTER_MODEL_COMMENTS_RETRIEVE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEVCENTER_MODEL_COMMENTS_RETRIEVE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelsCommentsByModelId', action.payload.modelId], action.payload.result || []);
      return state;

    case StoreActions.DEVCENTER_MODEL_GRAPHS_RETRIEVE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEVCENTER_MODEL_GRAPHS_RETRIEVE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelsGraphsByModelId', action.payload.modelId], action.payload.result || []);
      return state;

    case StoreActions.DEVCENTER_MODEL_METRICS_RETRIEVE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEVCENTER_MODEL_METRICS_RETRIEVE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelsMetricsByModelId', action.payload.modelId], action.payload.result || []);
      return state;

    case StoreActions.DEVCENTER_USER_RETRIEVE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEVCENTER_USER_RETRIEVE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelsUserPublicByUserHandle', action.payload.userHandle], action.payload.result || {});
      return state;

    case StoreActions.DEVCENTER_LISTING_RESET_ALL:
      state = state.set('modelsList', Immutable.fromJS({}));
      return state;

    default:
      return state;
  }
};

devcenter.calcListing = (state?: any, pageSize = null, lastSeenModelId = null, userHandle: string = null, useCase: string = null, sortBy: string = null, isVotes = false) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  let modelBy = '-';
  if (pageSize || lastSeenModelId || userHandle || useCase || sortBy || isVotes) {
    modelBy = (pageSize ?? '-') + '_' + (lastSeenModelId ?? '-') + '_' + (userHandle ?? '-') + '_' + (useCase ?? '-') + '_' + (sortBy ?? '-') + '_' + (isVotes ? '1' : '0');
  }
  return state.getIn(['modelsList', modelBy || '-']);
};

devcenter.memListing = (state?: any, doCall = false, pageSize = null, removeLastSeenModelId = null, lastSeenModelId = null, userHandle: string = null, useCase: string = null, sortBy: string = null, isVotes = false) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  if (useCase === '') {
    useCase = null;
  }
  if (sortBy === '') {
    sortBy = null;
  }

  let resRemove = devcenter.calcListing(state, pageSize, removeLastSeenModelId, userHandle, useCase, sortBy, isVotes);
  let res = devcenter.calcListing(state, pageSize, lastSeenModelId, userHandle, useCase, sortBy, isVotes);
  if (res == null) {
    if (state.get('isRefreshing')) {
      return resRemove;
    } else {
      if (doCall) {
        StoreActions.devCenterListing_(pageSize, removeLastSeenModelId, lastSeenModelId, userHandle, useCase, sortBy, isVotes);
      }
      return resRemove;
    }
  } else {
    return res;
  }
};

devcenter.calcModelDetail = (state?: any, modelId?: string) => {
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  return state.getIn(['modelsDetailByModelId', modelId || '-']);
};

devcenter.memModelDetail = (state?: any, doCall = false, modelId?: string) => {
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  let res = devcenter.calcModelDetail(state, modelId);
  if (res == null) {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.devCenterModelDetail_(modelId);
      }
    }
  } else {
    return res;
  }
};

const calcUserByUserHandle: (state, userHandle) => IUserPublicOne = (state?: any, userHandle?: string) => {
  if (!userHandle) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  return state.getIn(['modelsUserPublicByUserHandle', userHandle || '-']);
};
devcenter.calcUserByUserHandle = calcUserByUserHandle;

const memUseByUserHandle: (state, doCall, userHandle) => IUserPublicOne = (state?: any, doCall = false, userHandle?: string) => {
  if (!userHandle) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  let res = devcenter.calcUserByUserHandle(state, userHandle);
  if (res == null) {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.devCenterUserByUserHandle_(userHandle);
      }
    }
  } else {
    return res;
  }
};
devcenter.memUseByUserHandle = memUseByUserHandle;

devcenter.calcModelComments = (state?: any, modelId?: string) => {
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  return state.getIn(['modelsCommentsByModelId', modelId || '-']);
};

devcenter.memModelComments = (state?: any, doCall = false, modelId?: string) => {
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  let res = devcenter.calcModelComments(state, modelId);
  if (res == null) {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.devCenterModelComments_(modelId);
      }
    }
  } else {
    return res;
  }
};

devcenter.calcModelGraphs = (state?: any, modelId?: string) => {
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  return state.getIn(['modelsGraphsByModelId', modelId || '-']);
};

devcenter.memModelGraphs = (state?: any, doCall = false, modelId?: string) => {
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  let res = devcenter.calcModelGraphs(state, modelId);
  if (res == null) {
    if (state.get('isRefreshing')) {
      return undefined;
    } else {
      if (doCall) {
        StoreActions.devCenterModelGraphs_(modelId);
      }
    }
  } else {
    return res;
  }
};

devcenter.calcModelMetrics = (state?: any, modelId?: string) => {
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  return state.getIn(['modelsMetricsByModelId', modelId || '-']);
};

devcenter.memModelMetrics = (state?: any, doCall = false, modelId?: string) => {
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.devcenter) {
    state = state.devcenter;
  }

  let res = devcenter.calcModelMetrics(state, modelId);
  if (res == null) {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.devCenterModelMetrics_(modelId);
      }
    }
  } else {
    return res;
  }
};

export default devcenter;
