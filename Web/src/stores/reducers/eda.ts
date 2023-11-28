import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum EdaLifecycle {
  PENDING = 'PENDING',
  MONITORING = 'MONITORING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export enum EdaLifecycleDesc {
  PENDING = 'Pending',
  MONITORING = 'Monitoring',
  COMPLETE = 'Complete',
  FAILED = 'Failed',
}

let initState = Immutable.fromJS({
  isRefreshing: 0,
  edasByProjectId: {},
  edaById: {},
  edaByIdError: {},
  edaVersionsById: {},
  edaVersion: {},
  edaVersionError: {},
  edaDataConsistencyByEdaVersion: {},
  edaCollinearityByEdaVersion: {},
}) as Immutable.Map<string, any>;

const eda = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('edasByProjectId', Immutable.fromJS({}));
      state = state.set('edaById', Immutable.fromJS({}));
      state = state.set('edaByIdError', Immutable.fromJS({}));
      state = state.set('edaVersionsById', Immutable.fromJS({}));
      state = state.set('edaVersion', Immutable.fromJS({}));
      state = state.set('edaVersionError', Immutable.fromJS({}));
      state = state.set('edaDataConsistencyByEdaVersion', Immutable.fromJS({}));
      state = state.set('edaCollinearityByEdaVersion', Immutable.fromJS({}));
      return state;

    case StoreActions.EDA_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.EDA_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['edasByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    case StoreActions.EDA_VERSIONS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.EDA_VERSIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['edaVersionsById', '' + useNormalizedId(action.payload.edaId)], action.payload.result || []);
      return state;

    case StoreActions.EDA_DESC_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.EDA_DESC_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['edaById', '' + useNormalizedId(action.payload.edaId)], action.payload.result || {});
      state = state.setIn(['edaByIdError', '' + useNormalizedId(action.payload.edaId)], action.payload.error);
      return state;

    case StoreActions.EDA_DATA_CONSISTENCY_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.EDA_DATA_CONSISTENCY_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['edaDataConsistencyByEdaVersion', '' + useNormalizedId(action.payload.edaVersion)], action.payload.result || {});
      return state;

    case StoreActions.EDA_COLLINEARITY_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.EDA_COLLINEARITY_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['edaCollinearityByEdaVersion', '' + useNormalizedId(action.payload.edaVersion)], action.payload.result || {});
      return state;

    case StoreActions.EDA_VERSION_DESC_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.EDA_VERSION_DESC_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['edaVersion', '' + useNormalizedId(action.payload.edaVersion)], action.payload.result || {});
      state = state.setIn(['edaVersionError', '' + useNormalizedId(action.payload.edaVersion)], action.payload.error);
      return state;

    case StoreActions.EDA_VERSION_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.edaId) && useNormalizedId(action.payload.edaVersion) && action.payload.status) {
        state = state.updateIn(['edaVersionsById', '' + useNormalizedId(action.payload.edaId)], (edaState: any[]) => {
          if (edaState) {
            let ind1 = edaState.findIndex((v1) => v1.edaVersion === action.payload.edaVersion);
            if (ind1 > -1) {
              let d1 = edaState[ind1];
              d1 = { ...d1 };
              d1.status = action.payload.status;
              d1.lifecycle = action.payload.lifecycle;
              edaState[ind1] = d1;
              edaState = [...edaState];
            }
          }
          return edaState;
        });
      }
      return state;

    case StoreActions.EDA_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.edaId) && action.payload.status) {
        state = state.updateIn(['edaById', '' + useNormalizedId(action.payload.edaId)], (edaState: any) => {
          if (edaState != null) {
            if (Immutable.isImmutable(edaState as any)) {
              edaState = edaState.set('status', action.payload.status);
              edaState = edaState.set('lifecycle', action.payload.status);
            } else {
              edaState.status = action.payload.status;
              edaState.lifecycle = action.payload.status;
            }
          }
          return edaState;
        });
      }
      return state;

    default:
      return state;
  }
};

eda.calcEdasByProjectId = (state?: any, projectId?) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.eda) {
    state = state.eda;
  }

  return state.getIn(['edasByProjectId', '' + projectId]);
};

eda.memEdasByProjectId = (doCall, projectId) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.eda) {
    state = state.eda;
  }

  let res = eda.calcEdasByProjectId(undefined, projectId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listEda_(projectId);
      }
    }
  }
};

eda.calcEdaById = (state?: any, edaId?) => {
  edaId = useNormalizedId(edaId);
  if (!edaId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.eda) {
    state = state.eda;
  }

  return state.getIn(['edaById', '' + edaId]);
};

eda.calcEdaDataConsistencyByEdaVersion = (state?: any, edaVersion?) => {
  edaVersion = useNormalizedId(edaVersion);
  if (!edaVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.eda) {
    state = state.eda;
  }

  return state.getIn(['edaDataConsistencyByEdaVersion', '' + edaVersion]);
};

eda.calcEdaCollinearityByEdaVersion = (state?: any, edaVersion?) => {
  edaVersion = useNormalizedId(edaVersion);
  if (!edaVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.eda) {
    state = state.eda;
  }

  return state.getIn(['edaCollinearityByEdaVersion', '' + edaVersion]);
};

eda.calcEdaByIdError = (state?: any, edaId?) => {
  edaId = useNormalizedId(edaId);
  if (!edaId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.eda) {
    state = state.eda;
  }

  return state.getIn(['edaByIdError', '' + edaId]);
};

eda.memEdaById = (doCall, edaId) => {
  edaId = useNormalizedId(edaId);
  if (!edaId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.eda) {
    state = state.eda;
  }

  let res = eda.calcEdaById(undefined, edaId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeEda_(edaId);
      }
    }
  }
};

eda.memEdaDataConsistencyByEdaVersion = (doCall, edaVersion) => {
  edaVersion = useNormalizedId(edaVersion);
  if (!edaVersion) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.eda) {
    state = state.eda;
  }

  let res = eda.calcEdaDataConsistencyByEdaVersion(undefined, edaVersion);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.getEdaDataConsistencyDetection_(edaVersion);
      }
    }
  }
};

eda.memEdaCollinearityByEdaVersion = (doCall, edaVersion) => {
  edaVersion = useNormalizedId(edaVersion);
  if (!edaVersion) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.eda) {
    state = state.eda;
  }

  let res = eda.calcEdaCollinearityByEdaVersion(undefined, edaVersion);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.getEdaCollinearity_(edaVersion);
      }
    }
  }
};

eda.calcEdaVersionsById = (state?: any, edaId?) => {
  edaId = useNormalizedId(edaId);
  if (!edaId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.eda) {
    state = state.eda;
  }

  return state.getIn(['edaVersionsById', '' + edaId]);
};

eda.memEdaVersionsById = (doCall, edaId) => {
  edaId = useNormalizedId(edaId);
  if (!edaId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.eda) {
    state = state.eda;
  }

  let res = eda.calcEdaVersionsById(undefined, edaId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listEdaVersions_(edaId);
      }
    }
  }
};

eda.calcEdaVersion = (state?: any, edaVersion?) => {
  edaVersion = useNormalizedId(edaVersion);
  if (!edaVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.eda) {
    state = state.eda;
  }

  return state.getIn(['edaVersion', '' + edaVersion]);
};

eda.memEdaVersion = (doCall, edaVersion) => {
  edaVersion = useNormalizedId(edaVersion);
  if (!edaVersion) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.eda) {
    state = state.eda;
  }

  let res = eda.calcEdaVersion(undefined, edaVersion);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeEdaVersion_(edaVersion);
      }
    }
  }
};

eda.calcEdaVersionError = (state?: any, edaVersion?) => {
  edaVersion = useNormalizedId(edaVersion);
  if (!edaVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.eda) {
    state = state.eda;
  }

  return state.getIn(['edaVersionError', '' + edaVersion]);
};

export default eda;
