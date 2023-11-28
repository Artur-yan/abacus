import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  datasets: null,
  useCase: null,
  features_byUseCase: {},
  features_byUseCaseError: {},
  charts_byDatasetIdProjectId: {},
  charts_byDatasetIdProjectIdError: {},
  analyze_byDatasetId: {},
  fileDataUse_byDatasetIdProjectId: {},
  fileSchema_byDatasetId: {},
  fileSchema_byDatasetVersion: {},
  fileSchema_byFeatureGroupId: {},
  fileDataUse_byDatasetIdProjectIdError: {},
  validations_byProjectId: {},
  validations_byProjectIdError: {},
}) as Immutable.Map<string, any>;

export const calcReqFeaturesByUseCaseFindDatasetType = (reqFields, datasetType) => {
  if (!reqFields) {
    return null;
  }

  let res = null;
  reqFields.some((t1) => {
    if (t1 && t1.get('datasetType') === datasetType) {
      res = t1;
      return true;
    }
  });
  return res;
};

export const calcReqFeaturesByUseCase = (state?: any, useCase?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  useCase = useNormalizedId(useCase);

  return state.getIn(['features_byUseCase', '' + useCase]);
};

export const calcReqFeaturesByUseCaseError = (state?: any, useCase?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  useCase = useNormalizedId(useCase);

  return state.getIn(['features_byUseCaseError', '' + useCase]);
};

export const calcFileDataUseByDatasetIdProjectId = (state?: any, datasetId?: string, projectId?: string, batchPredId?, modelVersion?) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  datasetId = useNormalizedId(datasetId);
  projectId = useNormalizedId(projectId);
  batchPredId = useNormalizedId(batchPredId);
  modelVersion = useNormalizedId(modelVersion);

  return state.getIn(['fileDataUse_byDatasetIdProjectId', '' + datasetId + projectId + (batchPredId || '') + (modelVersion ?? '')]);
};

export const calcFileSchemaByDatasetId = (state?: any, datasetId?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  datasetId = useNormalizedId(datasetId);

  return state.getIn(['fileSchema_byDatasetId', '' + datasetId]);
};

export const calcFileSchemaByDatasetVersion = (state?: any, datasetVersion?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  datasetVersion = useNormalizedId(datasetVersion);

  return state.getIn(['fileSchema_byDatasetVersion', '' + datasetVersion]);
};

export const calcFileDataUseByDatasetIdProjectIdError = (state?: any, datasetId?: string, projectId?: string, modelVersion?) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  datasetId = useNormalizedId(datasetId);
  projectId = useNormalizedId(projectId);
  modelVersion = useNormalizedId(modelVersion);

  return state.getIn(['fileDataUse_byDatasetIdProjectIdError', '' + datasetId + projectId + (modelVersion ?? '')]);
};

export const calcAnalyzeSchemaDatasetById = (state?: any, projectId?: string, datasetId?: string, batchPredId?: string, modelVersion?: string, datasetVersion?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  projectId = useNormalizedId(projectId);
  datasetId = useNormalizedId(datasetId);
  batchPredId = useNormalizedId(batchPredId);
  modelVersion = useNormalizedId(modelVersion);
  datasetVersion = useNormalizedId(datasetVersion);

  return state.getIn(['analyze_byDatasetId', '' + projectId + datasetId + (batchPredId || '') + (modelVersion || '') + (datasetVersion || '')]);
};

export const calcChartsDatasetById = (state?: any, datasetId?: string, projectId?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  datasetId = useNormalizedId(datasetId);
  projectId = useNormalizedId(projectId);

  return state.getIn(['charts_byDatasetIdProjectId', '' + datasetId + projectId]);
};

export const calcChartsByDatasetIdError = (state?: any, datasetId?: string, projectId?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.defDatasets) {
    state = state.defDatasets;
  }

  datasetId = useNormalizedId(datasetId);
  projectId = useNormalizedId(projectId);

  return state.getIn(['charts_byDatasetIdProjectIdError', '' + datasetId + projectId]);
};

export const normList = (list) => {
  list = list == null ? list : list.map((s1) => useNormalizedId(s1)).filter((s1) => !Utils.isNullOrEmpty(s1));
  if (list?.length === 0) {
    list = null;
  }
  return list;
};

const defDatasets = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('features_byUseCase', Immutable.fromJS({}));
      state = state.set('features_byUseCaseError', Immutable.fromJS({}));
      state = state.set('charts_byDatasetIdProjectId', Immutable.fromJS({}));
      state = state.set('charts_byDatasetIdProjectIdError', Immutable.fromJS({}));
      state = state.set('analyze_byDatasetId', Immutable.fromJS({}));
      state = state.set('fileDataUse_byDatasetIdProjectId', Immutable.fromJS({}));
      state = state.set('fileSchema_byDatasetId', Immutable.fromJS({}));
      state = state.set('fileSchema_byDatasetVersion', Immutable.fromJS({}));
      state = state.set('fileSchema_byFeatureGroupId', Immutable.fromJS({}));
      state = state.set('fileDataUse_byDatasetIdProjectIdError', Immutable.fromJS({}));
      state = state.set('validations_byProjectId', Immutable.fromJS({}));
      state = state.set('validations_byProjectIdError', Immutable.fromJS({}));
      return state;

    case StoreActions.PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(
        [
          'fileSchema_byFeatureGroupId',
          '' + useNormalizedId(action.payload.projectId) + '_' + useNormalizedId(action.payload.featureGroupId) + (useNormalizedId(action.payload.modelVersion) ?? '') + (useNormalizedId(action.payload.featureGroupVersion) ?? ''),
        ],
        null,
      );
      return state;

    case StoreActions.PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(
        [
          'fileSchema_byFeatureGroupId',
          '' + useNormalizedId(action.payload.projectId) + '_' + useNormalizedId(action.payload.featureGroupId) + (useNormalizedId(action.payload.modelVersion) ?? '') + (useNormalizedId(action.payload.featureGroupVersion) ?? ''),
        ],
        Immutable.fromJS(action.payload.result || {}),
      );
      return state;

    case StoreActions.PROBLEM_DEF_FILE_SCHEMA_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(['fileSchema_byDatasetId', '' + useNormalizedId(action.payload.dataset_id)], null);
      return state;

    case StoreActions.PROBLEM_DEF_FILE_SCHEMA_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['fileSchema_byDatasetId', '' + useNormalizedId(action.payload.dataset_id)], Immutable.fromJS(action.payload.result || {}));
      return state;

    case StoreActions.PROBLEM_DEF_FILE_SCHEMA_VERSION_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(['fileSchema_byDatasetVersion', '' + useNormalizedId(action.payload.dataset_version)], null);
      return state;

    case StoreActions.PROBLEM_DEF_FILE_SCHEMA_VERSION_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['fileSchema_byDatasetVersion', '' + useNormalizedId(action.payload.dataset_version)], Immutable.fromJS(action.payload.result || {}));
      return state;

    case StoreActions.PROBLEM_DEF_FILE_DATA_USE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(
        [
          'fileDataUse_byDatasetIdProjectId',
          '' + useNormalizedId(action.payload.dataset_id) + useNormalizedId(action.payload.project_id) + (useNormalizedId(action.payload.batch_prediction_id) || '') + (useNormalizedId(action.payload.modelVersion) ?? ''),
        ],
        null,
      );
      state = state.setIn(
        [
          'fileDataUse_byDatasetIdProjectIdError',
          '' + useNormalizedId(action.payload.dataset_id) + useNormalizedId(action.payload.project_id) + (useNormalizedId(action.payload.batch_prediction_id) || '') + (useNormalizedId(action.payload.modelVersion) ?? ''),
        ],
        null,
      );
      return state;

    case StoreActions.PROBLEM_DEF_FILE_DATA_USE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(
        [
          'fileDataUse_byDatasetIdProjectId',
          '' + useNormalizedId(action.payload.dataset_id) + useNormalizedId(action.payload.project_id) + (useNormalizedId(action.payload.batch_prediction_id) || '') + (useNormalizedId(action.payload.modelVersion) ?? ''),
        ],
        Immutable.fromJS(action.payload.result || {}),
      );
      state = state.setIn(
        [
          'fileDataUse_byDatasetIdProjectIdError',
          '' + useNormalizedId(action.payload.dataset_id) + useNormalizedId(action.payload.project_id) + (useNormalizedId(action.payload.batch_prediction_id) || '') + (useNormalizedId(action.payload.modelVersion) ?? ''),
        ],
        action.payload.error || null,
      );
      return state;

    case StoreActions.SCHEMA_DATA_RESET:
      state = state.set('charts_byDatasetIdProjectId', Immutable.fromJS({}));
      state = state.set('charts_byDatasetIdProjectIdError', Immutable.fromJS({}));

      state = state.set('fileDataUse_byDatasetIdProjectId', Immutable.fromJS({}));
      state = state.set('fileDataUse_byDatasetIdProjectIdError', Immutable.fromJS({}));
      state = state.set('fileSchema_byDatasetId', Immutable.fromJS({}));
      state = state.set('fileSchema_byDatasetVersion', Immutable.fromJS({}));

      state = state.set('validations_byProjectId', Immutable.fromJS({}));
      state = state.set('validations_byProjectIdError', Immutable.fromJS({}));

      return state;

    case StoreActions.CHARTS_DATA_EXPLORER_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(['charts_byDatasetIdProjectIdError', '' + useNormalizedId(action.payload.dataset_id) + useNormalizedId(action.payload.project_id)], null);
      return state;

    case StoreActions.CHARTS_DATA_EXPLORER_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['charts_byDatasetIdProjectId', '' + useNormalizedId(action.payload.dataset_id) + useNormalizedId(action.payload.project_id)], Immutable.fromJS(action.payload.result || []));
      state = state.setIn(['charts_byDatasetIdProjectIdError', '' + useNormalizedId(action.payload.dataset_id) + useNormalizedId(action.payload.project_id)], action.payload.error);
      return state;

    case StoreActions.ANALYZE_SCHEMA_DATA_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.ANALYZE_SCHEMA_DATA_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(
        [
          'analyze_byDatasetId',
          '' +
            useNormalizedId(action.payload.project_id) +
            useNormalizedId(action.payload.dataset_id) +
            (useNormalizedId(action.payload.batchPredId) || '') +
            (useNormalizedId(action.payload.modelVersion) || '') +
            (useNormalizedId(action.payload.datasetVersion) || ''),
        ],
        Immutable.fromJS(action.payload.result || {}),
      );
      return state;

    case StoreActions.REQ_FEATURES_SCHEMA_TYPE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(['features_byUseCaseError', '' + useNormalizedId(action.payload.useCase)], null);
      return state;

    case StoreActions.REQ_FEATURES_SCHEMA_TYPE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      let resultDatasetType = action.payload.result;
      if (!resultDatasetType) {
        resultDatasetType = {};
      }
      state = state.setIn(['features_byUseCase', '' + useNormalizedId(action.payload.useCase)], Immutable.fromJS(resultDatasetType));
      state = state.setIn(['features_byUseCaseError', '' + useNormalizedId(action.payload.useCase)], action.payload.error);
      return state;

    case StoreActions.PROJECT_VALIDATION_RESET:
      state = state.set('validations_byProjectId', Immutable.fromJS({}));
      state = state.set('validations_byProjectIdError', Immutable.fromJS({}));
      return state;

    case StoreActions.PROJECT_VALIDATION_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(['validations_byProjectId', '' + useNormalizedId(action.payload.projectId) + (normList(action.payload.featureGroupIds) == null ? '' : normList(action.payload.featureGroupIds).join('-'))], null);
      state = state.setIn(['validations_byProjectIdError', '' + useNormalizedId(action.payload.projectId) + (normList(action.payload.featureGroupIds) == null ? '' : normList(action.payload.featureGroupIds).join('-'))], null);
      return state;

    case StoreActions.PROJECT_VALIDATION_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(
        ['validations_byProjectId', '' + useNormalizedId(action.payload.projectId) + (normList(action.payload.featureGroupIds) == null ? '' : normList(action.payload.featureGroupIds).join('-'))],
        action.payload.result || [],
      );
      state = state.setIn(
        ['validations_byProjectIdError', '' + useNormalizedId(action.payload.projectId) + (normList(action.payload.featureGroupIds) == null ? '' : normList(action.payload.featureGroupIds).join('-'))],
        action.payload.error || null,
      );
      return state;

    default:
      return state;
  }
};

defDatasets.calcValidationForProjectId = (projectId?: string, featureGroupIds?: string[]) => {
  let state = Utils.globalStore().getState();
  if (state.defDatasets) {
    state = state.defDatasets;
  }

  projectId = useNormalizedId(projectId);
  featureGroupIds = featureGroupIds == null ? featureGroupIds : featureGroupIds.map((s1) => useNormalizedId(s1)).filter((s1) => !Utils.isNullOrEmpty(s1));
  if (featureGroupIds?.length === 0) {
    featureGroupIds = null;
  }

  return state.getIn(['validations_byProjectId', '' + projectId + (featureGroupIds == null ? '' : featureGroupIds.join('-'))]);
};
defDatasets.memValidationForProjectId = (doCall, projectId?: string, featureGroupIds?: string[]) => {
  let state = Utils.globalStore().getState();
  if (state.defDatasets) {
    state = state.defDatasets;
  }

  projectId = useNormalizedId(projectId);
  featureGroupIds = featureGroupIds == null ? featureGroupIds : featureGroupIds.map((s1) => useNormalizedId(s1)).filter((s1) => !Utils.isNullOrEmpty(s1));
  if (featureGroupIds?.length === 0) {
    featureGroupIds = null;
  }

  if (!projectId) {
    return null;
  } else {
    let res = defDatasets.calcValidationForProjectId(projectId, featureGroupIds);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.validateProjectDatasets_(projectId, featureGroupIds);
        }
      }
    }
  }
};

defDatasets.calcSchemaByFeatureGroupId = (projectId?: string, featureGroupId?: string, modelVersion?, featureGroupVersion?) => {
  let state = Utils.globalStore().getState();
  if (state.defDatasets) {
    state = state.defDatasets;
  }

  projectId = useNormalizedId(projectId);
  featureGroupId = useNormalizedId(featureGroupId);
  modelVersion = useNormalizedId(modelVersion);
  featureGroupVersion = useNormalizedId(featureGroupVersion);

  return state.getIn(['fileSchema_byFeatureGroupId', '' + projectId + '_' + featureGroupId + (modelVersion ?? '') + (featureGroupVersion ?? '')]);
};
defDatasets.memSchemaForFeatureGrouptId = (doCall, projectId?: string, featureGroupId?: string, modelVersion?, featureGroupVersion?) => {
  let state = Utils.globalStore().getState();
  if (state.defDatasets) {
    state = state.defDatasets;
  }

  projectId = useNormalizedId(projectId);
  featureGroupId = useNormalizedId(featureGroupId);
  modelVersion = useNormalizedId(modelVersion);
  featureGroupVersion = useNormalizedId(featureGroupVersion);

  if (!featureGroupId) {
    return null;
  } else {
    let res = defDatasets.calcSchemaByFeatureGroupId(projectId, featureGroupId, modelVersion, featureGroupVersion);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.schemaGetFileFeatureGroup_(projectId, featureGroupId, modelVersion, featureGroupVersion);
        }
      }
    }
  }
};

defDatasets.memDatasetSchema = (doCall, defDatasetsParam, projectId, datasetId) => {
  let state = defDatasetsParam ?? Utils.globalStore().getState();
  if (state.defDatasets) {
    state = state.defDatasets;
  }

  projectId = useNormalizedId(projectId);
  datasetId = useNormalizedId(datasetId);

  if (state && projectId && datasetId) {
    let dsSchema1 = calcFileDataUseByDatasetIdProjectId(undefined, datasetId, projectId);
    if (dsSchema1 == null) {
      if (state.get('isRefreshing') === 0) {
        if (doCall) {
          StoreActions.schemaGetFileDataUse_(projectId, datasetId);
        }
      }
    } else {
      return dsSchema1;
    }
  }
};

defDatasets.memValidateReset = (defDatasetsParam) => {
  let state = defDatasetsParam ?? Utils.globalStore().getState();
  if (state.defDatasets) {
    state = state.defDatasets;
  }

  if (state.get('isRefreshing') === 0) {
    StoreActions.validateProjectDatasetsReset_();
    return true;
  } else {
    return false;
  }
};

export default defDatasets;
