import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum ModelLifecycle {
  UPLOADED = 'UPLOADED',
  UPLOADING = 'UPLOADING',
  UPLOADING_FAILED = 'UPLOADING_FAILED',
  PENDING = 'PENDING',
  TRAINING = 'TRAINING',
  EVALUATING = 'EVALUATING',
  COMPLETE = 'COMPLETE',
  TRAINING_FAILED = 'TRAINING_FAILED',
  EVALUATING_FAILED = 'EVALUATING_FAILED',
}

export const ModelLifecycleDesc = {
  [ModelLifecycle.UPLOADED]: 'Uploaded',
  [ModelLifecycle.UPLOADING]: 'Uploading',
  [ModelLifecycle.UPLOADING_FAILED]: 'Uploading Failed',
  [ModelLifecycle.PENDING]: 'Pending',
  [ModelLifecycle.TRAINING]: 'Training',
  [ModelLifecycle.COMPLETE]: 'Complete',
  [ModelLifecycle.EVALUATING]: 'Evaluating',
  [ModelLifecycle.TRAINING_FAILED]: 'Training Failed',
  [ModelLifecycle.EVALUATING_FAILED]: 'Evaluating Failed',
};

let initState = Immutable.fromJS({
  needRefresh: true,
  isRefreshing: 0,
  modelById: {},
  modelByIdError: {},
  modelByProjectId: {},
  modelDetailById: {},
  augmByModelId: {},
  versionsByModelId: {},
  schemaByModelId: {},
}) as Immutable.Map<string, any>;

export const calcModelVersionsByModelId = (state?: any, modelId?: string) => {
  modelId = useNormalizedId(modelId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  return state.getIn(['versionsByModelId', '' + modelId]);
};

export const calcModelDetailListByProjectId = (state?: any, modelId?: string) => {
  modelId = useNormalizedId(modelId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  return state.getIn(['modelDetailById', '' + modelId]);
};

export const calcModelListFilterCanBeShown = (list) => {
  if (list) {
    return list.filter((d1) => d1.get('status') === 'ACTIVE');
  }
};

export const calcModelListByProjectId = (state?: any, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  return state.getIn(['modelByProjectId', '' + projectId]);
};

export const calcModelAugmByModelId = (state?: any, modelId?: string, variationId?: any) => {
  modelId = useNormalizedId(modelId);
  variationId = useNormalizedId(variationId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  return state.getIn(['augmByModelId', '' + modelId + '_' + variationId]);
};

export const calcModelById = (state?: any, modelId?: string, created_at: any = null) => {
  modelId = useNormalizedId(modelId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  return state.getIn(['modelById', calcModelIdAndCreatedAt(modelId, null)]);
};
export const calcModelByIdError = (state?: any, modelId?: string, created_at: any = null) => {
  modelId = useNormalizedId(modelId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  return state.getIn(['modelByIdError', calcModelIdAndCreatedAt(modelId, null)]);
};

export const calcModelIdAndCreatedAt = (modelId: string, createdAt: string = '') => {
  return '' + modelId; //+'@'+createdAt;
};

const models = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('modelById', Immutable.fromJS({}));
      state = state.set('modelByIdError', Immutable.fromJS({}));
      state = state.set('modelByProjectId', Immutable.fromJS({}));
      state = state.set('modelDetailById', Immutable.fromJS({}));
      state = state.set('augmByModelId', Immutable.fromJS({}));
      state = state.set('versionsByModelId', Immutable.fromJS({}));
      return state;

    case StoreActions.MODELS_AUGM_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MODELS_AUGM_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      state = state.setIn(['augmByModelId', '' + useNormalizedId(action.payload.modelId) + '_' + useNormalizedId(action.payload.variationId)], action.payload.result ?? {});

      return state;

    case StoreActions.MODELS_SCHEMA_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MODELS_SCHEMA_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['schemaByModelId', '' + useNormalizedId(action.payload.modelId)], action.payload.result ?? {});

      return state;

    case StoreActions.MODELS_VERSIONS_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MODELS_VERSIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['versionsByModelId', '' + (useNormalizedId(action.payload.modelId) || '-')], action.payload.result ?? []);

      return state;

    case StoreActions.MODELS_LIST_BEGIN:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);

      // state = state.setIn(['modelByProjectId', action.payload.projectId], Immutable.List());
      return state;

    case StoreActions.MODELS_LIST_END:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      state = state.setIn(['modelByProjectId', '' + useNormalizedId(action.payload.projectId)], Immutable.fromJS(action.payload.result ?? []));

      state = state.updateIn(['modelById'], (modelState: Immutable.Map<string, any>) => {
        modelState = modelState.withMutations((modelById) => {
          (action.payload.result || []).some((m1) => {
            modelById.set(calcModelIdAndCreatedAt(m1.modelId, m1?.createdAt ?? 0), Immutable.fromJS(m1));
          });
        });

        return modelState;
      });

      return state;

    case StoreActions.MODELS_ONE_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.MODELS_ONE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      state = state.updateIn(['modelDetailById', '' + useNormalizedId(action.payload.modelId)], (modelState) => {
        modelState = Immutable.fromJS(action.payload.result || {});
        return modelState;
      });

      return state;

    case StoreActions.MODEL_UPDATE_LIFECYCLE:
      if (action.payload.modelId && action.payload.status) {
        state = state.updateIn(['modelDetailById', '' + useNormalizedId(action.payload.modelId)], (modelState: Immutable.Map<string, any>) => {
          if (modelState) {
            modelState = modelState.set('status', action.payload.status);
          }
          return modelState;
        });
      }
      return state;

    case StoreActions.MODEL_VERSION_UPDATE_LIFECYCLE:
      if (action.payload.status) {
        state = state.updateIn(['versionsByModelId', '' + useNormalizedId(action.payload.modelId)], (stateModel: any[]) => {
          if (stateModel) {
            let ind = _.findIndex(stateModel, (p1) => (p1 as any).modelVersion === action.payload.modelVersion);
            if (ind > -1) {
              let found1 = stateModel[ind];
              found1 = { ...found1 };
              found1.status = action.payload.status;
              found1.lifecycle = action.payload.status; //TODO remove? //**
              stateModel[ind] = found1;
              stateModel = [...stateModel];
            }
          }
          return stateModel;
        });
      }
      return state;

    default:
      return state;
  }
};

models.memListByProjectId = (doCall?, state?, projectId?) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  if (state) {
    let res = calcModelListByProjectId(state, projectId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.listModels_(projectId);
    }
  }
};

models.memModelVersionsByModelId = (doCall?, state?, modelId?) => {
  modelId = useNormalizedId(modelId);
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  if (state) {
    let res = calcModelVersionsByModelId(state, modelId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.modelsVersionsByModelId_(modelId);
    }
  }
};

models.memModelById = (doCall, state, modelId) => {
  modelId = useNormalizedId(modelId);
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  if (state && modelId) {
    let res = calcModelDetailListByProjectId(undefined, modelId);
    if (res == null) {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.getModelDetail_(modelId);
        }
      }
    } else {
      return res;
    }
  }
};

models.calcSchemaModelById = (modelId) => {
  modelId = useNormalizedId(modelId);
  if (!modelId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.models) {
    state = state.models;
  }

  return state.getIn(['schemaByModelId', '' + modelId]);
};

models.memSchemaModelById = (doCall, state, modelId) => {
  modelId = useNormalizedId(modelId);
  if (!modelId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  if (state && modelId) {
    let res = models.calcSchemaModelById(modelId);
    if (res == null) {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.getModelSchema_(modelId);
        }
      }
    } else {
      return res;
    }
  }
};

models.calcModelsListByProjectId = (projectId) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  return calcModelListByProjectId(undefined, projectId);
};

models.memModelsListByProjectId = (doCall, state, projectId) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.models) {
    state = state.models;
  }

  if (state && projectId) {
    let res = models.calcModelsListByProjectId(projectId);
    if (res == null) {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.listModels_(projectId);
        }
      }
    } else {
      return res;
    }
  }
};

export default models;
