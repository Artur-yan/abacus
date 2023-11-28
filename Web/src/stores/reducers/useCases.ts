import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: null,
  neverDone: true,

  solutions: null,
  useCasesBySolutionId: {},
  listProblemTypes: null,
}) as Immutable.Map<string, any>;

export const memUseCases = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.useCases) {
    state = state.useCases;
  }

  let res = state.get('list');
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return;
    }

    if (state.get('neverDone')) {
      if (doCall) {
        StoreActions.getUseCases_();
      }
    }
  }
};

export const memUseCasesSchemasInfo = (doCall, useCase: string, returnObject = false) => {
  useCase = useNormalizedId(useCase);
  if (!useCase) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.useCases) {
    state = state.useCases;
  }

  if (useCase && state) {
    let info0 = calcUseCaseSchemaInfo(useCase, true);
    let info1 = info0?.info;
    if (info1 == null) {
      if (state.get('isRefreshing')) {
        return null;
      }
      if (state.get('neverDone')) {
        if (doCall) {
          StoreActions.getUseCases_();
        }
        return null;
      }
    } else {
      if (info1 && _.isString(info1)) {
        info1 = Utils.tryJsonParse(info1);
      }

      //
      info0 = { ...info0 };
      delete info0.info;
      info1.ori = info0;
      //
      if (info1?.model_artifacts?.files != null) {
        let schemas = info1?.uiCustom?.schemas;
        if (schemas == null) {
          info1.uiCustom = info1.uiCustom || {};
          info1.uiCustom.schemas = info1.uiCustom.schemas || {};
          schemas = info1?.uiCustom?.schemas;
        }

        let list1 = [];
        info1?.model_artifacts?.files?.some((a1) => {
          a1.dataset_type = a1.name;
          a1.fileAccept = a1.file_types;

          schemas[a1.dataset_type] = a1;

          list1.push(a1.dataset_type);
        });
        schemas.list = list1;
      }

      let info2;
      if (info1 && !returnObject) {
        info1 = info1?.uiCustom?.schemas;
        info2 = info1;
      } else {
        info2 = info1?.uiCustom?.schemas;
      }

      //
      let isAlreadyCustom = info2?.list?.find((s1) => (info2?.[s1]?.dataset_type ?? info2?.[s1]?.datasetType)?.toUpperCase() === Constants.custom_table) != null;
      if (!isAlreadyCustom && info2?.list != null) {
        info2.list.push(Constants.custom_table.toLowerCase());
        info2[Constants.custom_table.toLowerCase()] = {
          is_required: false,
          schema: [],
          title: Constants.custom_table_desc,
          dataset_type: Constants.custom_table,
          description: '',
          isCustom: true,
        };
      }

      //
      return info1;
    }
  }
};

export const calcUseCaseSchemaInfo = (useCase: string, returnObject = false) => {
  if (!useCase) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.useCases) {
    state = state.useCases;
  }

  let list = state?.get('list');
  if (list) {
    useCase = useCase.toLowerCase();

    let res = list.find((u1) => (u1.useCase ?? '').toLowerCase() === useCase);
    if (returnObject) {
      return res;
    } else {
      return res?.info ?? {};
    }
  }
};

export const calcSolutionsList = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.useCases) {
    state = state.useCases;
  }

  return state.getIn(['solutions']);
};

export const calcUseCaseForSolution = (state: any, solutionId: string) => {
  solutionId = useNormalizedId(solutionId);
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.useCases) {
    state = state.useCases;
  }

  return state.getIn(['useCasesBySolutionId', '' + solutionId]);
};

const useCases = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('solutions', null);
      state = state.set('listProblemTypes', null);
      state = state.set('useCasesBySolutionId', Immutable.fromJS({}));
      return state;

    case StoreActions.USE_CASES_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.set('neverDone', false);

      return state;

    case StoreActions.USE_CASES_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('neverDone', false);

      let data1 = action.payload.list;

      state = state.set('list', data1);

      return state;

    case StoreActions.SOLUTIONS_LIST_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.SOLUTIONS_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('solutions', Immutable.fromJS(action.payload.result || []));
      return state;

    case StoreActions.USE_CASES_FOR_SOLUTION_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.USE_CASES_FOR_SOLUTION_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.updateIn(['useCasesBySolutionId', '' + useNormalizedId(action.payload.solutionId)], (useCaseOne) => {
        useCaseOne = Immutable.fromJS(action.payload.result || {});
        return useCaseOne;
      });
      return state;

    case StoreActions.USE_CASES_LIST_PROBLEMTYPES_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.USE_CASES_LIST_PROBLEMTYPES_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('listProblemTypes', action.payload.result ?? []);
      return state;

    default:
      return state;
  }
};

useCases.calcListProblemTypes = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.useCases) {
    state = state.useCases;
  }

  return state.getIn(['listProblemTypes']);
};

useCases.memListProblemTypes = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.useCases) {
    state = state.useCases;
  }

  let res = useCases.calcListProblemTypes(undefined);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listProblemTypes_();
      }
    }
  }
};

export default useCases;
