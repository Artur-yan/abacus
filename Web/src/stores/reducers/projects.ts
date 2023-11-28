import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  isRefreshingById: {},
  list: null,
  listFilter: null,
  listFilterText: null,
  listFilterTagText: null,
  listAll: null,
  totalCount: null,
  projectById: {},
  projectByIdError: {},
  neverDone: true,

  fieldValuesByDeployId: {},
  errorFieldValuesByDeployId: {},
  createPredictiveState: {},
  modelVersionsByProjectId: {},
  customModelInfoByProjectId: {},
  isExplainableProject: {},
}) as Immutable.Map<string, any>;

export const memProjectsList = (doCall, projects) => {
  if (projects) {
    let res = projects.get('listAll');
    if (res != null) {
      return res;
    } else {
      if (projects.get('isRefreshing')) {
        return;
      }

      if (doCall) {
        StoreActions.listProjectsAll_();
      }
    }
  }
};

export const calcProjectsById = (state?: any, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['projectById', '' + projectId]);
};
export const calcProjectsByIdError = (state?: any, projectId?: string) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['projectByIdError', '' + projectId]);
};

export const memProjectById = (projectId?: string, doCall = false) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  let res = state.getIn(['projectById', projectId]);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.getProjectsById_(projectId);
      }
    }
  }
};

export const calcFieldValuesByDeployId = (state?: any, deployId?: string) => {
  deployId = useNormalizedId(deployId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.projects) {
    state = state.projects;
  }

  let list = state.get('fieldValuesByDeployId');
  if (list) {
    return list.get(deployId);
  }

  return null;
};

export const calcErrorFieldValuesByDeployId = (state?: any, deployId?: string) => {
  deployId = useNormalizedId(deployId);
  if (!deployId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.projects) {
    state = state.projects;
  }

  let list = state.get('errorFieldValuesByDeployId');
  if (list) {
    return list.get(deployId);
  }

  return null;
};

export const calcProjectCreateState = (projectId) => {
  projectId = useNormalizedId(projectId);
  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['createPredictiveState', '' + (projectId ?? '')]);
};

export const calcProjectByIdIsRefreshing = (projectId) => {
  projectId = useNormalizedId(projectId);
  if (Utils.isNullOrEmpty(projectId)) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['isRefreshingById', projectId]);
};

export const calcProjectList = () => {
  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['list']);
};

export const calcProjectListFilter = () => {
  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['listFilter']);
};

export const calcProjectListAll = () => {
  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['listAll']);
};

export const calcProjectListFilterText = () => {
  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['listFilterText']);
};

export const calcProjectListFilterTagText = () => {
  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['listFilterTagText']);
};

export const calcProjectListTotalCount = () => {
  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['totalCount']);
};

export const calcProjectListLastProjectId = () => {
  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  const list = state.getIn(['list']);
  if (list == null || list.length === 0) {
    return null;
  } else {
    return list[list.length - 1].projectId;
  }
};

const projects = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('projectById', Immutable.fromJS({}));
      state = state.set('projectByIdError', Immutable.fromJS({}));
      state = state.set('list', null);
      state = state.set('listFilter', null);
      state = state.set('listAll', null);
      state = state.set('totalCount', null);

      state = state.set('isRefreshingById', Immutable.fromJS({}));
      state = state.set('fieldValuesByDeployId', Immutable.fromJS({}));
      state = state.set('errorFieldValuesByDeployId', Immutable.fromJS({}));
      state = state.set('createPredictiveState', Immutable.fromJS({}));
      state = state.set('modelVersionsByProjectId', Immutable.fromJS({}));
      state = state.set('customModelInfoByProjectId', Immutable.fromJS({}));
      state = state.set('isExplainableProject', Immutable.fromJS({}));

      return state;

    case StoreActions.PROJECT_CREATE_PREDICTIVE_STATE:
      state = state.setIn(['createPredictiveState', '' + useNormalizedId(action.payload.projectId)], action.payload.state ?? {});
      return state;

    case StoreActions.PROJECTS_LIST_UPDATE:
      state = state.updateIn(['list'], (list: any[]) => {
        if (!list) {
          list = [];
        }

        let updates = action.payload.updates;
        if (updates && _.isArray(updates)) {
          list = [...list];

          updates.some((p1) => {
            if (p1) {
              let ind = list.findIndex((p2) => p2.projectId === p1.projectId);
              if (ind === -1) {
                list.push(p1);
              } else {
                list[ind] = p1;
              }
            }
          });
        }

        return list;
      });
      return state;

    case StoreActions.PROJECTS_ALL_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PROJECTS_ALL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      state = state.set('listAll', action.payload.result || []);
      return state;

    case StoreActions.PROJECTS_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PROJECTS_LIST_END:
      const isTempProjects = action.payload.isTemp;
      if (isTempProjects) {
        if ((action.payload.list || []).length === 0) {
          return state;
        }
      }

      const isFilter = action.payload.isFilter === true;
      let listName = isFilter ? 'listFilter' : 'list';
      if (action.payload.isStarred) {
        listName += 'Starred';
      }

      if (!isTempProjects) {
        state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      }

      if (!action.payload.isError) {
        if (isFilter && useNormalizedId(action.payload.filterText) !== state.get('listFilterText')) {
          state = state.set('listFilterText', useNormalizedId(action.payload.filterText));
        }

        if (isFilter && useNormalizedId(action.payload.filterTagText) !== state.get('listFilterTagText')) {
          state = state.set('listFilterTagText', useNormalizedId(action.payload.filterTagText));
        }

        if (!isFilter && useNormalizedId(action.payload.totalCount) != null && useNormalizedId(action.payload.totalCount) !== state.get('totalCount')) {
          state = state.set('totalCount', useNormalizedId(action.payload.totalCount));
        }

        let data1 = action.payload.list || [];
        if (action.payload.lastRefreshTime != null) {
          let lastList = state.get(listName);
          if (lastList != null) {
            let dataMap = {},
              newProjects = [];
            data1.some((p1, p1ind) => {
              dataMap[p1.projectId] = p1;
            });

            let anyChange = false;
            let dataNew = [...(lastList ?? [])];
            dataNew.some((p1, p1ind) => {
              const changed1 = dataMap[p1.projectId];
              if (changed1 != null) {
                anyChange = true;
                dataNew[p1ind] = changed1;
                delete dataMap[p1.projectId];
              }
            });

            if (Object.keys(dataMap).length > 0) {
              anyChange = true;
              //new projects
              data1.some((p1, p1ind) => {
                if (!dataMap[p1.projectId]) {
                  return true;
                }

                newProjects.push(p1);
              });

              dataNew = [...newProjects, ...dataNew].filter((p1) => p1 != null);
            }

            if (anyChange) {
              data1 = dataNew;
            } else {
              return state;
            }
          } else {
            return state;
          }
        } else if (!Utils.isNullOrEmpty(action.payload.sinceProjectId)) {
          if (data1 == null || data1.length === 0) {
            return state;
            //
          } else {
            let lastList = state.get(listName) || [];
            data1 = lastList.concat(data1);
          }
        } else {
          state = state.set('neverDone', false);
        }

        state = state.set(listName, data1);
      }
      return state;

    case StoreActions.PROJECTS_ONE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(['isRefreshingById', '' + (useNormalizedId(action.payload.projectId) || '-')], ((state.getIn(['isRefreshingById', action.payload.projectId]) as number) || 0) + 1);
      return state;

    case StoreActions.PROJECTS_ONE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['isRefreshingById', '' + (useNormalizedId(action.payload.projectId) || '-')], ((state.getIn(['isRefreshingById', action.payload.projectId]) as number) || 0) - 1);
      state = state.setIn(['projectById', '' + useNormalizedId(action.payload.projectId)], action.payload.result || {});
      state = state.setIn(['projectByIdError', '' + useNormalizedId(action.payload.projectId)], action.payload.error);
      return state;

    case StoreActions.PROJECTS_FIELD_VALUES_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.setIn(['errorFieldValuesByDeployId', '' + useNormalizedId(action.payload.deploymentId)], null);
      return state;

    case StoreActions.PROJECTS_FIELD_VALUES_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['fieldValuesByDeployId', '' + useNormalizedId(action.payload.deploymentId)], action.payload.result || {});
      state = state.setIn(['errorFieldValuesByDeployId', '' + useNormalizedId(action.payload.deploymentId)], action.payload.error);
      return state;

    case StoreActions.SCHEMA_PROJECT_VERSIONS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.SCHEMA_PROJECT_VERSIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['modelVersionsByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    case StoreActions.CUSTOM_MODEL_INFO_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.CUSTOM_MODEL_INFO_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['customModelInfoByProjectId', '' + useNormalizedId(action.payload.projectId) + '_' + useNormalizedId(action.payload.problemType)], action.payload.result || {});
      return state;

    case StoreActions.EXPLANIABLE_PROJECT_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.EXPLANIABLE_PROJECT_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['isExplainableProject', '' + useNormalizedId(action.payload.deploymentId)], action.payload.result ?? false);
      return state;

    default:
      return state;
  }
};

projects.calcSchemaProjectVersions = (projectId) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['modelVersionsByProjectId', '' + projectId]);
};

projects.memSchemaProjectListVersions = (doCall, state?: any, projectId?: any) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.projects) {
    state = state.projects;
  }

  if (state) {
    let res = projects.calcSchemaProjectVersions(projectId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.schemasProjectVersions_(projectId);
    }
  }
};

projects.calcCustomModelInfo = (problemType, projectId) => {
  problemType = useNormalizedId(problemType);
  projectId = useNormalizedId(projectId);
  if (!projectId && !problemType) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }

  return state.getIn(['customModelInfoByProjectId', '' + projectId + '_' + problemType]);
};

projects.memCustomModelInfo = (doCall, state?: any, problemType?: string, projectId?: any) => {
  problemType = useNormalizedId(problemType);
  projectId = useNormalizedId(projectId);
  if (!projectId && !problemType) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.projects) {
    state = state.projects;
  }

  if (state) {
    let res = projects.calcCustomModelInfo(problemType, projectId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.customModelInfo_(problemType, projectId);
    }
  }
};

projects.calcExplainableProject = (deploymentId) => {
  deploymentId = useNormalizedId(deploymentId);
  if (!deploymentId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.projects) {
    state = state.projects;
  }
  return state.getIn(['isExplainableProject', '' + deploymentId]);
};

projects.memExplainableProject = (doCall, state?: any, deploymentId?: any) => {
  deploymentId = useNormalizedId(deploymentId);
  if (!deploymentId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.projects) {
    state = state.projects;
  }

  if (state) {
    let res = projects.calcExplainableProject(deploymentId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.projectIsExplainable_(deploymentId);
    }
  }
};

export default projects;
