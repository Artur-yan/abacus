import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';
import { FetchState, FetchStateEnum } from '../commonTypes';

export enum FeatureGroupLifecycle {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum FeatureGroupVersionLifecycle {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export interface CommonFeatureGroup {}

export interface FeatureGroupsInternalState {
  isRefreshing: number;
  featureGroupsByTemplateId: CommonFeatureGroup;
  featureGroupsByProjectId: CommonFeatureGroup;
  featureGroupLineageByProjectId: CommonFeatureGroup;
  featureGroupsByProjectIdPublic: CommonFeatureGroup;
  featureGroupsById: CommonFeatureGroup;
  featureGroupsByIdError: CommonFeatureGroup;
  featuresById: CommonFeatureGroup;
  featureGroupSamplingConfigOptions: CommonFeatureGroup;
  featureExportsListByFeatureGroupId: CommonFeatureGroup;
  featureRefreshListByFeatureGroupId: CommonFeatureGroup;
  featureGroupsVersionsByFeatureGroupId: CommonFeatureGroup;
  analyze_byFeatureGroupVersion: CommonFeatureGroup;
  featureGroupsChartsById: CommonFeatureGroup;
  featureGroupTypes: string;
  featureGroupsByPythonFunctionName: CommonFeatureGroup;
  pitWindowFunctions: any[];
  fetchGroupAnalyzeStatus: FetchState;
  featureGroupTypesForAdd: any[];
}

const FetchGroupsInitialState = Immutable.Record<FeatureGroupsInternalState>({
  isRefreshing: 0,
  featureGroupsByTemplateId: {},
  featureGroupsByProjectId: {},
  featureGroupLineageByProjectId: {},
  featureGroupsByProjectIdPublic: {},
  featureGroupsById: {},
  featureGroupsByIdError: {},
  featuresById: {},
  featureGroupSamplingConfigOptions: {},
  featureExportsListByFeatureGroupId: {},
  featureRefreshListByFeatureGroupId: {},
  featureGroupsVersionsByFeatureGroupId: {},
  analyze_byFeatureGroupVersion: {},
  featureGroupsChartsById: {},
  featureGroupTypes: null,
  featureGroupsByPythonFunctionName: {},
  pitWindowFunctions: [],
  fetchGroupAnalyzeStatus: FetchStateEnum.NOT_STARTED,
  featureGroupTypesForAdd: null,
});

export type FeatureGroupsState = ReturnType<typeof FetchGroupsInitialState>;

const initState = new FetchGroupsInitialState();

const featureGroups = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('featureGroupsByProjectIdPublic', Immutable.fromJS({}));
      state = state.set('featureGroupsByProjectId', Immutable.fromJS({}));
      state = state.set('featureGroupLineageByProjectId', Immutable.fromJS({}));
      state = state.set('featureGroupsByTemplateId', Immutable.fromJS({}));
      state = state.set('featureGroupsByPythonFunctionName', Immutable.fromJS({}));
      state = state.set('featureGroupsById', Immutable.fromJS({}));
      state = state.set('featureGroupsByIdError', Immutable.fromJS({}));
      state = state.set('featuresById', Immutable.fromJS({}));
      state = state.set('featureGroupSamplingConfigOptions', Immutable.fromJS({}));
      state = state.set('featureExportsListByFeatureGroupId', Immutable.fromJS({}));
      state = state.set('featureRefreshListByFeatureGroupId', Immutable.fromJS({}));
      state = state.set('featureGroupsVersionsByFeatureGroupId', Immutable.fromJS({}));
      state = state.set('analyze_byFeatureGroupVersion', Immutable.fromJS({}));
      state = state.set('featureGroupsChartsById', Immutable.fromJS({}));
      state = state.set('pitWindowFunctions', Immutable.fromJS([]).toArray());
      state = state.set('fetchGroupAnalyzeStatus', initState.fetchGroupAnalyzeStatus);
      state = state.set('featureGroupTypesForAdd', initState.featureGroupTypesForAdd);
      return state;

    case StoreActions.FEATUREGROUPS_DESCRIBE_RESET:
      state = state.set('featureGroupsByProjectIdPublic', Immutable.fromJS({}));
      state = state.set('featureGroupsByProjectId', Immutable.fromJS({}));
      state = state.set('featureGroupLineageByProjectId', Immutable.fromJS({}));
      state = state.set('featureGroupsByTemplateId', Immutable.fromJS({}));
      state = state.set('featureGroupsByPythonFunctionName', Immutable.fromJS({}));
      state = state.set('featureGroupsById', Immutable.fromJS({}));
      state = state.set('featureGroupsByIdError', Immutable.fromJS({}));
      return state;

    case StoreActions.FEATUREGROUPS_EXPORTS_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.exportId) && useNormalizedId(action.payload.featureGroupId) && action.payload.status) {
        state = state.updateIn(['featureExportsListByFeatureGroupId', '' + useNormalizedId(action.payload.featureGroupId)], (exportsState: any[]) => {
          if (exportsState) {
            let ind1 = exportsState.findIndex((v1) => (v1.exportId ?? v1.featureGroupExportId) === action.payload.exportId);
            if (ind1 > -1) {
              let d1 = exportsState[ind1];
              d1 = { ...d1 };
              d1.status = action.payload.status;
              exportsState[ind1] = d1;
              exportsState = [...exportsState];
            }
          }
          return exportsState;
        });
      }
      return state;

    case StoreActions.FEATUREGROUPS_PROJECT_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_PROJECT_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupsByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUP_LINEAGE_PROJECT_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUP_LINEAGE_PROJECT_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupLineageByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_TEMPLATE_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_TEMPLATE_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupsByTemplateId', '' + useNormalizedId(action.payload.featureGroupTemplateId)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupsByPythonFunctionName', '' + useNormalizedId(action.payload.nameUse)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_TYPES_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_TYPES_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupTypes'], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_TYPES_ADD_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_TYPES_ADD_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupTypesForAdd'], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_CODE_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.featureGroupId) && action.payload.status) {
        const updaterFGOneById = (exportsState: any[]) => {
          if (exportsState) {
            let ind1 = exportsState.findIndex((v1) => v1?.featureGroupId === action.payload.featureGroupId);
            if (ind1 > -1) {
              let d1 = exportsState[ind1];
              if (d1?.codeSource != null) {
                d1 = { ...d1 };
                d1.codeSource = { ...d1.codeSource };
                d1.codeSource.status = action.payload.status;

                exportsState[ind1] = d1;
                exportsState = [...exportsState];
              }
            }
          }
          return exportsState;
        };

        state = state.updateIn(['featureGroupsById', '' + useNormalizedId(action.payload.featureGroupId)], updaterFGOneById);
      }
      return state;

    case StoreActions.FEATUREGROUPS_ONE_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.featureGroupId) && action.payload.status) {
        const updaterFGOneById = (exportsState: any[]) => {
          if (exportsState) {
            let ind1 = exportsState.findIndex((v1) => v1?.featureGroupId === action.payload.featureGroupId);
            if (ind1 > -1) {
              let d1 = exportsState[ind1];
              d1 = { ...d1 };
              d1.lifecycle = action.payload.status;
              exportsState[ind1] = d1;
              exportsState = [...exportsState];
            }
          }
          return exportsState;
        };

        state = state.updateIn(['featureGroupsById', '' + useNormalizedId(action.payload.featureGroupId)], updaterFGOneById);
      }
      return state;

    case StoreActions.FEATUREGROUPS_VERSIONS_UPDATE_LIFECYCLE:
      if (useNormalizedId(action.payload.featureGroupVersion) && useNormalizedId(action.payload.featureGroupId) && action.payload.status) {
        state = state.updateIn(['featureGroupsVersionsByFeatureGroupId', '' + useNormalizedId(action.payload.featureGroupId)], (exportsState: any[]) => {
          if (exportsState) {
            let ind1 = exportsState.findIndex((v1) => v1.featureGroupVersion === action.payload.featureGroupVersion);
            if (ind1 > -1) {
              let d1 = exportsState[ind1];
              d1 = { ...d1 };
              d1.lifecycle = action.payload.status;
              exportsState[ind1] = d1;
              exportsState = [...exportsState];
            }
          }
          return exportsState;
        });
      }
      return state;

    case StoreActions.FEATUREGROUP_ANALYZE_SCHEMA_DATA_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.set('fetchGroupAnalyzeStatus', FetchStateEnum.IN_PROGRESS);
      return state;

    case StoreActions.FEATUREGROUP_ANALYZE_SCHEMA_DATA_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['analyze_byFeatureGroupVersion', '' + useNormalizedId(action.payload.featureGroupVersion)], Immutable.fromJS(action.payload.result || {}));
      state = state.set('fetchGroupAnalyzeStatus', FetchStateEnum.COMPLETED);
      return state;

    case StoreActions.FEATUREGROUPS_VERSIONS_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_VERSIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupsVersionsByFeatureGroupId', '' + useNormalizedId(action.payload.featureGroupId)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_PROJECT_LIST_START_PUBLIC:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_PROJECT_LIST_END_PUBLIC:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupsByProjectIdPublic', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_DESCRIBE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_DESCRIBE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupsByIdError', '' + useNormalizedId(action.payload.projectId) + '-' + useNormalizedId(action.payload.featureGroupId)], action.payload.error ?? null);
      state = state.setIn(['featureGroupsById', '' + useNormalizedId(action.payload.projectId) + '-' + useNormalizedId(action.payload.featureGroupId)], action.payload.result || {});
      return state;

    case StoreActions.FEATUREGROUPS_DESCRIBE_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_DESCRIBE_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.withMutations((context) => {
        action.payload.result?.forEach?.((featureGroup) => {
          context = context.setIn(['featureGroupsById', `${useNormalizedId(action.payload.projectId)}-${useNormalizedId(featureGroup?.featureGroupId)}`], featureGroup || {});
        });
      });
      return state;

    case StoreActions.FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupSamplingConfigOptions', '' + useNormalizedId(action.payload.featureGroupId)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_EXPORTS_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_EXPORTS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureExportsListByFeatureGroupId', '' + useNormalizedId(action.payload.featureGroupId)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_REFRESH_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_REFRESH_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureRefreshListByFeatureGroupId', '' + useNormalizedId(action.payload.featureGroupId)], action.payload.result || []);
      return state;

    case StoreActions.FEATUREGROUPS_CHARTS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FEATUREGROUPS_CHARTS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['featureGroupsChartsById', '' + useNormalizedId(action.payload.projectId) + '-' + useNormalizedId(action.payload.featureGroupVersion)], action.payload.result || []);
      return state;

    case StoreActions.PIT_WINDOW_FUNCTIONS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PIT_WINDOW_FUNCTIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('pitWindowFunctions', action.payload.result || []);
      return state;

    default:
      return state;
  }
};

featureGroups.calcPitWindowFunctions = () => {
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }
  const result = state.get('pitWindowFunctions');
  return result;
};

featureGroups.memPitWindowFunctions = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  let res = featureGroups.calcPitWindowFunctions();
  if (res?.length) {
    return res;
  }
  if (state.get('isRefreshing')) {
    return null;
  }
  if (doCall) {
    StoreActions.listWindowFunctions_();
  }
};

featureGroups.calcFeatureGroupsByProjectId = (projectId?: string) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupsByProjectId', '' + projectId]);
};
featureGroups.memFeatureGroupsForProjectId = (doCall, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!projectId) {
    return null;
  } else {
    let res = featureGroups.calcFeatureGroupsByProjectId(projectId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureGroupsGetByProject_(projectId);
        }
      }
    }
  }
};

featureGroups.calcFeatureGroupLineageForProjectId = (projectId?: string) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupLineageByProjectId', '' + projectId]);
};
featureGroups.memFeatureGroupLineageForProjectId = (doCall, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!projectId) {
    return null;
  } else {
    let res = featureGroups.calcFeatureGroupLineageForProjectId(projectId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureGroupLineageByProject_(projectId);
        }
      }
    }
  }
};

featureGroups.calcFeatureGroupsByTemplateId = (featureGroupTemplateId?: string) => {
  featureGroupTemplateId = useNormalizedId(featureGroupTemplateId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupsByTemplateId', '' + featureGroupTemplateId]);
};
featureGroups.memFeatureGroupsForTemplateId = (doCall, featureGroupTemplateId?: string) => {
  featureGroupTemplateId = useNormalizedId(featureGroupTemplateId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!featureGroupTemplateId) {
    return null;
  } else {
    let res = featureGroups.calcFeatureGroupsByTemplateId(featureGroupTemplateId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureGroupsGetByTemplateId_(featureGroupTemplateId);
        }
      }
    }
  }
};

featureGroups.calcFeatureGroupsPythonFunctionByName = (nameUse?: string) => {
  nameUse = useNormalizedId(nameUse);

  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }
  return state.getIn(['featureGroupsByPythonFunctionName', '' + nameUse]);
};

featureGroups.memFeatureGroupsForPythonFunctions = (doCall, nameUse?: string) => {
  nameUse = useNormalizedId(nameUse);

  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!nameUse) {
    return null;
  } else {
    let res = featureGroups.calcFeatureGroupsPythonFunctionByName(nameUse);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureGroupsGetByPythonFunctionName_(nameUse);
        }
      }
    }
  }
};

featureGroups.calcFeatureGroupsByProjectIdPublic = (projectId?: string) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupsByProjectIdPublic', '' + projectId]);
};
featureGroups.memFeatureGroupsForProjectIdPublic = (doCall, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  let res = featureGroups.calcFeatureGroupsByProjectIdPublic(projectId);
  if (res != null) {
    return res;
  }
  if (state.get('isRefreshing')) {
    return null;
  }
  if (doCall) {
    StoreActions._featureGroupsGetByProjectPublic_(projectId);
  }
};

featureGroups.calcFeatureGroupsByIdError = (projectId: string, featureGroupId?: string) => {
  projectId = useNormalizedId(projectId);
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupsByIdError', '' + projectId + '-' + featureGroupId]);
};

featureGroups.calcFeatureGroupsListByIds = (featureGroupIds?: string[]) => {
  featureGroupIds = featureGroupIds.map((featureGroupId) => useNormalizedId(featureGroupId));
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }
  return featureGroupIds.map((featureGroupId) => state.getIn(['featureGroupsById', `null-${featureGroupId}`]));
};

featureGroups.calcFeatureGroupsById = (projectId: string, featureGroupId?: string) => {
  projectId = useNormalizedId(projectId);
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupsById', '' + projectId + '-' + featureGroupId]);
};
featureGroups.memFeatureGroupsForId = (doCall, projectId: string, featureGroupId?: string) => {
  projectId = useNormalizedId(projectId);
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }
  if (!featureGroupId) {
    return null;
  }
  let res = featureGroups.calcFeatureGroupsById(projectId, featureGroupId);
  if (res) {
    return res;
  }
  if (state.get('isRefreshing')) {
    return null;
  }
  if (doCall) {
    StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
  }
};

featureGroups.memFeatureGroupsIdList = (doCall, featureGroupIds?: string[]) => {
  featureGroupIds = featureGroupIds?.map?.((featureGroupId) => useNormalizedId(featureGroupId));
  let state = Utils.globalStore().getState();

  if (state.featureGroups) {
    state = state.featureGroups;
  }
  if (!featureGroupIds?.length) {
    return null;
  }
  let res = featureGroups.calcFeatureGroupsListByIds(featureGroupIds);
  const existingFeatureGroupIds = new Set(res.map((featureGroup) => featureGroup?.featureGroupId));
  const newFeatureGroupIds = featureGroupIds.filter((featureGroupId) => !existingFeatureGroupIds.has(featureGroupId));
  if ((res && !doCall) || (doCall && !newFeatureGroupIds.length)) {
    return res;
  }

  if (state.get('isRefreshing')) {
    return null;
  }

  if (doCall) {
    StoreActions.featureGroupsDescribeList(newFeatureGroupIds);
  }
};

featureGroups.calcFeatureGroupsChartsById = (projectId: string, featureGroupVersion?: string) => {
  projectId = useNormalizedId(projectId);
  featureGroupVersion = useNormalizedId(featureGroupVersion);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupsChartsById', '' + projectId + '-' + featureGroupVersion]);
};
featureGroups.memFeatureGroupsChartsForId = (doCall, projectId: string, featureGroupVersion?: string) => {
  projectId = useNormalizedId(projectId);
  featureGroupVersion = useNormalizedId(featureGroupVersion);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!featureGroupVersion || !projectId) {
    return null;
  } else {
    let res = featureGroups.calcFeatureGroupsChartsById(projectId, featureGroupVersion);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureGroupsCharts_(projectId, featureGroupVersion);
        }
      }
    }
  }
};

featureGroups.memFeatureGroupsForIdList = (doCall, projectId: string, featureGroupIds?: string[]) => {
  projectId = useNormalizedId(projectId);
  featureGroupIds = featureGroupIds?.map((id) => useNormalizedId(id));
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!featureGroupIds || featureGroupIds?.length === 0) {
    return null;
  } else {
    let ids = featureGroupIds.filter((s1) => !Utils.isNullOrEmpty(s1));
    if (ids.length === 0) {
      return null;
    }

    let needIds = [];

    let res: any = {};
    ids.some((id1) => {
      let r1 = featureGroups.calcFeatureGroupsById(projectId, id1);
      if (r1 == null) {
        needIds.push(id1);
      } else {
        res[id1] = r1;
      }
    });
    if (needIds.length === 0) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          needIds.some((id1) => {
            StoreActions.featureGroupsDescribe_(projectId, id1);
          });
        }
      }
    }
  }
};

featureGroups.calcFeatureGroupSamplingConfigOptions = (featureGroupId?: string) => {
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupSamplingConfigOptions', '' + featureGroupId]);
};
featureGroups.memFeatureGroupSamplingConfigOptions = (doCall, featureGroupId?: string) => {
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!featureGroupId) {
    return null;
  } else {
    let res = featureGroups.calcFeatureGroupSamplingConfigOptions(featureGroupId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureGroupSamplingConfigOptions_(featureGroupId);
        }
      }
    }
  }
};

featureGroups.calcFeatureExportsListByFeatureGroupId = (featureGroupId?: string) => {
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureExportsListByFeatureGroupId', '' + featureGroupId]);
};
featureGroups.memFeatureExportsForFeatureGroupId = (doCall, featureGroupId?: string) => {
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!featureGroupId) {
    return null;
  } else {
    let res = featureGroups.calcFeatureExportsListByFeatureGroupId(featureGroupId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureExportsList_(featureGroupId);
        }
      }
    }
  }
};

featureGroups.calcFeatureRefreshListByFeatureGroupId = (featureGroupId?: string) => {
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureRefreshListByFeatureGroupId', '' + featureGroupId]);
};
featureGroups.memFeatureRefreshForFeatureGroupId = (doCall, featureGroupId?: string) => {
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!featureGroupId) {
    return null;
  } else {
    let res = featureGroups.calcFeatureRefreshListByFeatureGroupId(featureGroupId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureRefreshPolicieList(featureGroupId);
        }
      }
    }
  }
};

featureGroups.calcFeatureGroupsVersionsByFeatureGroupId = (featureGroupId?: string) => {
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupsVersionsByFeatureGroupId', '' + featureGroupId]);
};
featureGroups.memFeatureGroupsVersionsForFeatureGroupId = (doCall, featureGroupId?: string) => {
  featureGroupId = useNormalizedId(featureGroupId);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!featureGroupId) {
    return null;
  } else {
    let res = featureGroups.calcFeatureGroupsVersionsByFeatureGroupId(featureGroupId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.featureGroupsVersionsList_(featureGroupId);
        }
      }
    }
  }
};

featureGroups.calcAnalyzeSchemaFeatureGroupByVersion = (state?: any, featureGroupVersion?: string) => {
  featureGroupVersion = useNormalizedId(featureGroupVersion);
  if (!featureGroupVersion) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['analyze_byFeatureGroupVersion', '' + featureGroupVersion]);
};
featureGroups.memAnalyzeSchemaFeatureGroupByVersion = (doCall, featureGroupVersion?: string) => {
  featureGroupVersion = useNormalizedId(featureGroupVersion);
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  if (!featureGroupVersion) {
    return null;
  } else {
    let res = featureGroups.calcAnalyzeSchemaFeatureGroupByVersion(undefined, featureGroupVersion);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.analyzeSchemaByFeatureGroupVersion_(featureGroupVersion);
        }
      }
    }
  }
};

featureGroups.calcFeatureGroupTypes = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupTypes']);
};

featureGroups.memFeatureGroupTypes = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  let res = featureGroups.calcFeatureGroupTypes(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listFeatureGroupTypes_();
      }
    }
  }
};

featureGroups.calcFeatureGroupTypesForAdd = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.featureGroups) {
    state = state.featureGroups;
  }

  return state.getIn(['featureGroupTypesForAdd']);
};

featureGroups.memFeatureGroupTypesForAdd = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.featureGroups) {
    state = state.featureGroups;
  }

  let res = featureGroups.calcFeatureGroupTypesForAdd(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listFeatureGroupTypesForAdd_();
      }
    }
  }
};

export default featureGroups;
