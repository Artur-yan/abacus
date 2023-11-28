import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  needRefresh: true,
  isRefreshing: 0,

  datasetsAll: null,
  datasetsAllStarred: null,
  datasetById: {},
  datasetByIdError: {},
  datasetVersionsByDatasetId: {},

  schemas_datasetVersions: {},
  schemas_datasetVersionsFeatureGroups: {},
}) as Immutable.Map<string, any>;

export enum DatasetLifecycle {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  IMPORTING = 'IMPORTING',
  CONVERTING = 'CONVERTING',
  INSPECTING = 'INSPECTING',
  COMPLETE = 'COMPLETE',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',

  IMPORTING_FAILED = 'IMPORTING_FAILED',
  INSPECTING_FAILED = 'INSPECTING_FAILED',
}

export const DatasetLifecycleDesc = {
  [DatasetLifecycle.COMPLETE]: 'Active',
  [DatasetLifecycle.CANCELLED]: 'Cancelled',
  [DatasetLifecycle.FAILED]: 'Failed',
  [DatasetLifecycle.PENDING]: 'Pending',
  [DatasetLifecycle.INSPECTING]: 'Inspecting',
  [DatasetLifecycle.UPLOADING]: 'Uploading',
  [DatasetLifecycle.IMPORTING]: 'Reading',
  [DatasetLifecycle.CONVERTING]: 'Converting',

  [DatasetLifecycle.IMPORTING_FAILED]: 'Reading Failed',
  [DatasetLifecycle.INSPECTING_FAILED]: 'Inspecting Failed',
};

export const ProjectDatasetLifecycle = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  DETACHED: 'DETACHED',
  FAILED: 'FAILED',
};

export const calcDataset_datasetType = (dataset1: any, projectId: any, isName = false) => {
  if (!dataset1 || !projectId) {
    return null;
  }

  let res = null;
  dataset1.get('allProjectDatasets')?.some((p1) => {
    if (p1.getIn(['project', 'projectId']) === projectId) {
      if (isName) {
        res = p1.get('name');
      } else {
        res = p1.get('datasetType');
      }
      return true;
    }
  });
  return res;
};

export const calcDatasetById = (state?: any, datasetId?: string) => {
  datasetId = useNormalizedId(datasetId);
  if (!datasetId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.datasets) {
    state = state.datasets;
  }

  return state.getIn(['datasetById', '' + datasetId]);
};
export const calcDatasetByIdError = (state?: any, datasetId?: string) => {
  datasetId = useNormalizedId(datasetId);
  if (!datasetId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.datasets) {
    state = state.datasets;
  }

  return state.getIn(['datasetByIdError', '' + datasetId]);
};

export const calcDatasetVersionsByDatasetId = (state?: any, datasetId?: string) => {
  datasetId = useNormalizedId(datasetId);
  if (!datasetId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.datasets) {
    state = state.datasets;
  }

  return state.getIn(['datasetVersionsByDatasetId', '' + datasetId]);
};

const datasets = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('datasetById', Immutable.fromJS({}));
      state = state.set('datasetByIdError', Immutable.fromJS({}));
      state = state.set('datasetVersionsByDatasetId', Immutable.fromJS({}));
      return state;

    case StoreActions.DATASETS_VERSIONS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DATASETS_VERSIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      state = state.setIn(['datasetVersionsByDatasetId', '' + useNormalizedId(action.payload.datasetId)], action.payload.result || []);
      return state;

    case StoreActions.SCHEMA_DATASETS_VERSIONS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.SCHEMA_DATASETS_VERSIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['schemas_datasetVersions', '' + useNormalizedId(action.payload.projectId) + '_' + useNormalizedId(action.payload.datasetId)], action.payload.result || []);
      return state;

    case StoreActions.ALL_DATASETS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.ALL_DATASETS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('datasetsAll' + (action.payload.isStarred ? 'Starred' : ''), action.payload.result || []);
      return state;

    case StoreActions.SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['schemas_datasetVersionsFeatureGroups', '' + useNormalizedId(action.payload.projectId) + '_' + useNormalizedId(action.payload.featureGroupId)], action.payload.result || []);
      return state;

    case StoreActions.DATASETS_LIST_BEGIN:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DATASETS_LIST_END:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      let result1 = action.payload.result;
      if (result1) {
        state = state.updateIn(['datasetByIdError'], (datasetByIdState: Immutable.Map<string, any>) => {
          if (datasetByIdState == null) {
            datasetByIdState = Immutable.fromJS({}) as Immutable.Map<string, any>;
          }
          datasetByIdState = datasetByIdState.withMutations((datasetById) => {
            result1.some((res1) => {
              let id1 = res1[0];
              let err1 = res1[2];

              datasetById.set(id1, err1);
            });
          });
          return datasetByIdState;
        });

        state = state.updateIn(['datasetById'], (datasetByIdState: Immutable.Map<string, any>) => {
          if (datasetByIdState == null) {
            datasetByIdState = Immutable.fromJS({}) as Immutable.Map<string, any>;
          }
          datasetByIdState = datasetByIdState.withMutations((datasetById) => {
            result1.some((res1) => {
              let id1 = res1[0];
              let r1 = res1[1] ?? {};

              let rOri = r1;

              r1 = r1.lastVersion;
              if (r1 && r1.featureGroupId == null) {
                r1.featureGroupId = rOri.featureGroupId;
              }
              if (r1 && r1.sourceType == null) {
                r1.sourceType = rOri.sourceType?.toLowerCase();
              }
              if (r1 && r1.rawQuery == null) {
                r1.rawQuery = rOri.rawQuery;
              }
              if (r1 && r1.dataSource == null) {
                r1.dataSource = rOri.dataSource;
              }
              if (r1 && r1.isDocumentset == null) {
                r1.isDocumentset = rOri.isDocumentset;
              }
              if (r1 && r1.extractBoundingBoxes == null) {
                r1.extractBoundingBoxes = rOri.extractBoundingBoxes;
              }
              if (r1 && r1.mergeFileSchemas == null) {
                r1.mergeFileSchemas = rOri.mergeFileSchemas;
              }
              if (r1 && r1.databaseConnectorId == null) {
                r1.databaseConnectorId = rOri.databaseConnectorId ?? '';
              }
              if (r1 && r1.connectorType == null) {
                r1.connectorType = rOri.connectorType ?? '';
              }
              if (r1 && r1.service == null) {
                r1.service = rOri.service ?? '';
              }
              if (r1 && r1.ephemeral == null) {
                r1.ephemeral = rOri.ephemeral;
              }
              if (r1 && r1.lookbackDays == null) {
                r1.lookbackDays = rOri.lookbackDays;
              }
              if (r1 && r1.ignoreBefore == null) {
                r1.ignoreBefore = rOri.ignoreBefore;
              }
              if (r1 && r1.refreshSchedules == null) {
                r1.refreshSchedules = rOri.refreshSchedules;
              }
              if (r1 && r1.queryArguments == null) {
                r1.queryArguments = rOri.queryArguments;
              }
              if (r1 && r1.columns == null) {
                r1.columns = rOri.columns;
              }
              if (r1 && r1.featureGroupTableName == null) {
                r1.featureGroupTableName = rOri.featureGroupTableName;
              }
              if (r1 && r1.validFeatureTypes == null) {
                r1.validFeatureTypes = rOri.validFeatureTypes;
              }
              if (r1 && r1.validDataTypes == null) {
                r1.validDataTypes = rOri.validDataTypes;
              }
              if (r1 && r1.schema == null) {
                r1.schema = rOri.schema;
              }
              if (r1 && r1.tableName == null) {
                r1.tableName = rOri.tableName;
              }
              if (r1 && r1.datasetTableName == null) {
                r1.datasetTableName = rOri.datasetTableName;
              }
              if (r1 && r1.allProjectDatasets == null) {
                r1.allProjectDatasets = rOri.allProjectDatasets;
              }
              if (r1 && r1.incremental == null) {
                r1.incremental = rOri.incremental;
              }
              if (r1 && r1.databaseConnectorConfig == null) {
                r1.databaseConnectorConfig = rOri.databaseConnectorConfig;
              }
              if (r1 && r1.starred == null) {
                r1.starred = rOri.starred;
              }

              if (r1 && r1.isAboveDataLimitingThreshold == null) {
                r1.isAboveDataLimitingThreshold = rOri.isAboveDataLimitingThreshold;
              }

              r1 = r1 ?? {};

              if (id1) {
                datasetById.set(id1, Immutable.fromJS(r1));
              }
            });
          });

          return datasetByIdState;
        });
      }
      return state;

    case StoreActions.DATASETS_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.datasetId) && useNormalizedId(action.payload.created_at) != null && action.payload.status) {
        state = state.updateIn(['datasetById', '' + useNormalizedId(action.payload.datasetId)], (datasetState: Immutable.Map<string, any>) => {
          if (datasetState) {
            datasetState = datasetState.set('status', action.payload.status);
          }
          return datasetState;
        });
      }
      return state;

    default:
      return state;
  }
};

datasets.memDatasetListCall = (doCall, state?: any, datasetIds?: string[]) => {
  if (!datasetIds || !_.isArray(datasetIds)) {
    return null;
  }
  datasetIds = datasetIds?.map((id) => useNormalizedId(id))?.filter((id) => id != null);

  datasetIds = datasetIds.filter((v1) => !Utils.isNullOrEmpty(v1));
  if (datasetIds.length === 0) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.datasets) {
    state = state.datasets;
  }

  if (state) {
    let res = {},
      needIds = [];
    datasetIds.some((id1) => {
      let r1 = calcDatasetById(state, id1);
      if (r1 != null) {
        res[id1] = r1;
      } else {
        needIds.push(id1);
      }
    });

    if (needIds.length === 0) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.listDatasets_(datasetIds);
    }
  }
};

datasets.memDatasetListVersions = (doCall, state?: any, datasetId?: any) => {
  datasetId = useNormalizedId(datasetId);
  if (!datasetId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.datasets) {
    state = state.datasets;
  }

  if (state) {
    let res = calcDatasetVersionsByDatasetId(state, datasetId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.listDatasetsVersions_(datasetId);
    }
  }
};

datasets.calcSchemaDatasetVersions = (projectId, datasetId) => {
  datasetId = useNormalizedId(datasetId);
  if (!datasetId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.datasets) {
    state = state.datasets;
  }

  return state.getIn(['schemas_datasetVersions', '' + projectId + '_' + datasetId]);
};

datasets.memSchemaDatasetListVersions = (doCall, state?: any, projectId?: any, datasetId?: any) => {
  projectId = useNormalizedId(projectId);
  datasetId = useNormalizedId(datasetId);
  if (!datasetId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.datasets) {
    state = state.datasets;
  }

  if (state) {
    let res = datasets.calcSchemaDatasetVersions(projectId, datasetId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.schemasDatasetVersions_(projectId, datasetId);
    }
  }
};

datasets.calcSchemaDatasetVersionsFeatureGroup = (projectId, featureGroupId) => {
  projectId = useNormalizedId(projectId);
  featureGroupId = useNormalizedId(featureGroupId);
  if (!featureGroupId || !projectId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.datasets) {
    state = state.datasets;
  }

  return state.getIn(['schemas_datasetVersionsFeatureGroups', '' + projectId + '_' + featureGroupId]);
};

datasets.memSchemaDatasetListVersionsFeatureGroup = (doCall, state?: any, projectId?: any, featureGroupId?: any) => {
  projectId = useNormalizedId(projectId);
  featureGroupId = useNormalizedId(featureGroupId);
  if (!featureGroupId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.datasets) {
    state = state.datasets;
  }

  if (state) {
    let res = datasets.calcSchemaDatasetVersionsFeatureGroup(projectId, featureGroupId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.schemasDatasetVersionsFeatureGroups_(projectId, featureGroupId);
    }
  }
};

datasets.memDatasetsAll = (doCall, state?: any, isStarred?: boolean) => {
  isStarred = useNormalizedId(isStarred);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.datasets) {
    state = state.datasets;
  }

  if (state) {
    let res = state.get('datasetsAll' + (isStarred ? 'Starred' : ''));
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.listAllDatasets();
    }
  }
};

datasets.memDatasetsFromIDs = (doCall, datasetIDs: string[]) => {
  let state = Utils.globalStore().getState();
  if (state.datasets) {
    state = state.datasets;
  }

  if (!_.isArray(datasetIDs)) {
    return null;
  }

  datasetIDs = datasetIDs?.map((id) => useNormalizedId(id));
  datasetIDs = datasetIDs?.filter((v1) => !Utils.isNullOrEmpty(v1));

  if (datasetIDs != null && datasetIDs.length > 0) {
    let needIDs = [];
    let res = {};
    datasetIDs?.some((id1) => {
      let d1 = calcDatasetById(state, id1);
      if (d1 != null) {
        res[id1] = d1;
      } else {
        needIDs.push(id1);
      }
    });

    if (needIDs.length === 0) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.listDatasets_(needIDs);
    }
  }
};

export default datasets;
