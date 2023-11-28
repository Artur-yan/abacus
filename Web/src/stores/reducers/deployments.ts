import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum DeploymentLifecycle {
  ACTIVE = 'ACTIVE',
  DEPLOYING = 'DEPLOYING',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  STOPPED = 'STOPPED',
  STOPPING = 'STOPPING',
  CANCELLED = 'CANCELLED',
  DELETING = 'DELETING',
}

export const DeploymentLifecycleDesc = {
  [DeploymentLifecycle.ACTIVE]: 'Active',
  [DeploymentLifecycle.DEPLOYING]: 'Deploying',
  [DeploymentLifecycle.FAILED]: 'Failed',
  [DeploymentLifecycle.PENDING]: 'Pending',
  [DeploymentLifecycle.STOPPED]: 'Suspended',
  [DeploymentLifecycle.STOPPING]: 'Suspending',
  [DeploymentLifecycle.CANCELLED]: 'Cancelled',
  [DeploymentLifecycle.DELETING]: 'Deleting',
};

let initState = Immutable.fromJS({
  needRefresh: true,
  isRefreshing: 0,
  deploymentsByProjectId: {},
  deploymentsByProjectIdError: {},
  deployVersionsByDeployId: {},
  deployVersionsByDeployIdHistory: {},
}) as Immutable.Map<string, any>;

export const calcDeploymentsByProjectId = (state?: any, projectId?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deployments) {
    state = state.deployments;
  }

  projectId = useNormalizedId(projectId);

  return state.getIn(['deploymentsByProjectId', '' + projectId]);
};
export const calcDeploymentsByProjectIdError = (state?: any, projectId?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deployments) {
    state = state.deployments;
  }

  projectId = useNormalizedId(projectId);

  return state.getIn(['deploymentsByProjectIdError', '' + projectId]);
};

export const calcDeploymentsVersionsByDeployIdHistory = (state?: any, deployId?: string) => {
  deployId = useNormalizedId(deployId);
  if (!deployId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deployments) {
    state = state.deployments;
  }

  return state.getIn(['deployVersionsByDeployIdHistory', deployId]);
};

export const calcDeploymentsVersionsByDeployId = (state?: any, deployId?: string) => {
  deployId = useNormalizedId(deployId);
  if (!deployId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deployments) {
    state = state.deployments;
  }

  return state.getIn(['deployVersionsByDeployId', deployId]);
};

const deployments = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('deploymentsByProjectId', Immutable.fromJS({}));
      state = state.set('deploymentsByProjectIdError', Immutable.fromJS({}));
      state = state.set('deployVersionsByDeployId', Immutable.fromJS({}));
      state = state.set('deployVersionsByDeployIdHistory', Immutable.fromJS({}));
      return state;

    case StoreActions.DEPLOYMENT_UPDATE_LIFECYCLE:
      if (action.payload.status) {
        state = state.updateIn(['deploymentsByProjectId', '' + useNormalizedId(action.payload.projectId)], (stateProject: any[]) => {
          if (stateProject) {
            let ind = _.findIndex(stateProject, (p1) => p1.deploymentId === action.payload.deployId);
            if (ind > -1) {
              let found1 = stateProject[ind];
              found1 = { ...found1 };
              found1.status = action.payload.status;
              stateProject[ind] = found1;
              stateProject = [...stateProject];
            }
          }
          return stateProject;
        });
      }
      return state;

    case StoreActions.DEPLOYMENT_VERSION_UPDATE_LIFECYCLE:
      if (action.payload.status) {
        state = state.updateIn(['deployVersionsByDeployIdHistory', '' + useNormalizedId(action.payload.deployId)], (stateDeploy: any[]) => {
          if (stateDeploy) {
            let ind = _.findIndex(stateDeploy, (p1) => p1.deploymentVersion === action.payload.deploymentVersion);
            if (ind > -1) {
              let found1 = stateDeploy[ind];
              found1 = { ...found1 };
              found1.status = action.payload.status;
              found1.lifecycle = action.payload.status; //TODO remove? //**
              stateDeploy[ind] = found1;
              stateDeploy = [...stateDeploy];
            }
          }
          return stateDeploy;
        });

        state = state.updateIn(['deployVersionsByDeployId', '' + useNormalizedId(action.payload.deployId)], (stateDeploy: any[]) => {
          if (stateDeploy) {
            let ind = _.findIndex(stateDeploy, (p1) => p1.deploymentVersion === action.payload.deploymentVersion);
            if (ind > -1) {
              let found1 = stateDeploy[ind];
              found1 = { ...found1 };
              found1.status = action.payload.status;
              found1.lifecycle = action.payload.status; //TODO remove? //**
              stateDeploy[ind] = found1;
              stateDeploy = [...stateDeploy];
            }
          }
          return stateDeploy;
        });
      }
      return state;

    case StoreActions.DEPLOY_PROJECT_START:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEPLOY_PROJECT_END:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['deploymentsByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      state = state.setIn(['deploymentsByProjectIdError', '' + useNormalizedId(action.payload.projectId)], action.payload.error);

      return state;

    case StoreActions.DEPLOY_VERSIONS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEPLOY_VERSIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['deployVersionsByDeployId', '' + useNormalizedId(action.payload.deployId)], action.payload.result || []);

      return state;

    case StoreActions.DEPLOY_VERSIONS_HISTORY_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DEPLOY_VERSIONS_HISTORY_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['deployVersionsByDeployIdHistory', '' + useNormalizedId(action.payload.deployId)], action.payload.result || []);

      return state;

    default:
      return state;
  }
};

deployments.memDeployListVersionsHistory = (doCall, state?: any, deployId?: any) => {
  deployId = useNormalizedId(deployId);
  if (!deployId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deployments) {
    state = state.deployments;
  }

  if (state) {
    let res = calcDeploymentsVersionsByDeployIdHistory(state, deployId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.listDeployVersionsHistory_(deployId);
    }
  }
};

deployments.memDeployListVersions = (doCall, state?: any, deployId?: any) => {
  deployId = useNormalizedId(deployId);
  if (!deployId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deployments) {
    state = state.deployments;
  }

  if (state) {
    let res = calcDeploymentsVersionsByDeployId(state, deployId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.listDeployVersions_(deployId);
    }
  }
};

deployments.memDeployForProject = (doCall, state?: any, projectId?: any) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.deployments) {
    state = state.deployments;
  }

  if (state) {
    let res = calcDeploymentsByProjectId(state, projectId);
    if (res != null) {
      return res;
    }

    if (state.get('isRefreshing')) {
      return;
    }

    if (doCall) {
      StoreActions.deployList_(projectId);
    }
  }
};

deployments.memDeploysList = (doCall, projectId) => {
  projectId = useNormalizedId(projectId);
  if (!projectId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.deployments) {
    state = state.deployments;
  }

  if (projectId) {
    let res = calcDeploymentsByProjectId(undefined, projectId);
    if (res != null) {
      return res;
    } else {
      if (state.get('isRefreshing') !== 0) {
        return;
      } else {
        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      }
    }
  }
};

export default deployments;
