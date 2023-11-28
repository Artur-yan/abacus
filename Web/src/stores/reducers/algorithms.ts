import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId, useNormalizedIdArray, useNormalizedJSONhash, useProjectIdNormalized } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: null,
  neverDone: true,
  algosByProjectId: {},
  algoListByProblemTypeId: {},
  builtinAlgoListByProjectId: {},
  algoById: {},
  problemTypeAllowed: null,
}) as Immutable.Map<string, any>;

const algorithms = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('algosByProjectId', Immutable.fromJS({}));
      state = state.set('algoListByProblemTypeId', Immutable.fromJS({}));
      state = state.set('builtinAlgoListByProjectId', Immutable.fromJS({}));
      state = state.set('algoById', Immutable.fromJS({}));
      return state;

    case StoreActions.ALGORITHMS_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.ALGORITHMS_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['algoById', '' + useNormalizedId(action.payload.name)], action.payload.result || {});
      return state;

    case StoreActions.ALGORITHMS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.ALGORITHMS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['algoListByProblemTypeId', '' + useNormalizedId(action.payload.problemType?.toUpperCase()) + '_' + useProjectIdNormalized(action.payload.projectId)], action.payload.result || []);
      return state;

    case StoreActions.BUILTIN_ALGORITHMS_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.BUILTIN_ALGORITHMS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(
        ['builtinAlgoListByProjectId', '' + useProjectIdNormalized(action.payload.projectId) + '_' + useNormalizedIdArray(action.payload.featureGroupIds) + '_' + useNormalizedJSONhash(action.payload.trainingConfig)],
        action.payload.result || [],
      );
      return state;

    case StoreActions.LIST_PRETRAINED_MODEL_ALGORITHMS_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.LIST_PRETRAINED_MODEL_ALGORITHMS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['pretrainedModelAlgorithmsByUseCase', '' + useNormalizedId(action.payload.useCase)], action.payload.result || []);
      return state;

    case StoreActions.PROBLEMTYPE_ALLOWED_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PROBLEMTYPE_ALLOWED_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['problemTypeAllowed'], action.payload.result || []);
      return state;

    case StoreActions.PROJECTS_ALGOS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.PROJECTS_ALGOS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      state = state.updateIn(['algosByProjectId', '' + useNormalizedId(action.payload.projectId)], (algosById: Immutable.Map<string, any>) => {
        if (algosById == null) {
          algosById = Immutable.Map() as Immutable.Map<string, any>;
        }

        algosById = algosById.updateIn(['list'], (list1: any[]) => {
          if (list1 == null) {
            list1 = [];
          }

          let result1 = action.payload.result;
          if (result1 && _.isArray(result1)) {
            list1 = result1;
          }
          return list1;
        });

        return algosById;
      });

      return state;

    default:
      return state;
  }
};

algorithms.calcListByProblemTypeId = (state?: any, problemType?, projectId?) => {
  problemType = useNormalizedId(problemType?.toUpperCase());
  projectId = useProjectIdNormalized(projectId);

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.algorithms) {
    state = state.algorithms;
  }
  return state.getIn(['algoListByProblemTypeId', '' + problemType + '_' + projectId]);
};

algorithms.memListByProblemTypeId = (doCall, problemType, projectId?) => {
  problemType = useNormalizedId(problemType?.toUpperCase());
  projectId = useProjectIdNormalized(projectId);

  let state = Utils.globalStore().getState();
  if (state.algorithms) {
    state = state.algorithms;
  }

  let res = algorithms.calcListByProblemTypeId(undefined, problemType, projectId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listAlgosByProblemTypeId_(problemType?.toUpperCase(), projectId);
      }
    }
  }
};

algorithms.calcListBuiltinAlgorithms = (state?: any, projectId?, featureGroupIds?, trainingConfig?) => {
  projectId = useProjectIdNormalized(projectId);

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.algorithms) {
    state = state.algorithms;
  }
  return state.getIn(['builtinAlgoListByProjectId', '' + projectId + '_' + useNormalizedIdArray(featureGroupIds) + '_' + useNormalizedJSONhash(trainingConfig)]);
};

algorithms.memListBuiltinAlgorithms = (doCall, projectId, featureGroupIds?, trainingConfig?) => {
  projectId = useProjectIdNormalized(projectId);
  if (!projectId) {
    return null;
  }
  let state = Utils.globalStore().getState();
  if (state.algorithms) {
    state = state.algorithms;
  }

  let res = algorithms.calcListBuiltinAlgorithms(undefined, projectId, featureGroupIds, trainingConfig);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listBuiltinAlgorithmsByProjectId_(projectId, featureGroupIds, trainingConfig);
      }
    }
  }
};

algorithms.calcAlgoById = (state?: any, name?) => {
  name = useNormalizedId(name);

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.algorithms) {
    state = state.algorithms;
  }

  return state.getIn(['algoById', '' + name]);
};

algorithms.memAlgoById = (doCall, name) => {
  name = useNormalizedId(name);
  if (!name) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.algorithms) {
    state = state.algorithms;
  }

  let res = algorithms.calcAlgoById(undefined, name);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeAlgo_(name);
      }
    }
  }
};

algorithms.calcProblemTypeAllowed = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.algorithms) {
    state = state.algorithms;
  }

  return state.getIn(['problemTypeAllowed']);
};

algorithms.memProblemTypeAllowed = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.algorithms) {
    state = state.algorithms;
  }

  let res = algorithms.calcProblemTypeAllowed(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listProblemTypeAllowed_();
      }
    }
  }
};

algorithms.calcPretrainedModelAlgorithms = (state?: any, useCase?: string) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.algorithms) {
    state = state.algorithms;
  }
  return state.getIn(['pretrainedModelAlgorithmsByUseCase', '' + useNormalizedId(useCase)]);
};

algorithms.memPretrainedModelAlgorithms = (doCall, useCase: string) => {
  useCase = useNormalizedId(useCase);
  if (!useCase) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.algorithms) {
    state = state.algorithms;
  }

  let res = algorithms.calcPretrainedModelAlgorithms(undefined, useCase);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listPretrainedModelAlgorithms_(useCase);
      }
    }
  }
};

export default algorithms;
