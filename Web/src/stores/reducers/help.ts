import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  needRefresh: true,
  isRefreshing: 0,
  help: null,
  useCases: null,
}) as Immutable.Map<string, any>;

export const calcHelp = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.help) {
    state = state.help;
  }

  return state.get('help');
};

export const calcHelpUseCases = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.help) {
    state = state.help;
  }

  return state.get('useCases');
};

const help = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.HELP_RETRIEVE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.HELP_RETRIEVE_END:
      state = state.set('needRefresh', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('help', action.payload.result || {});
      return state;

    case StoreActions.HELP_USECASES_RETRIEVE_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.HELP_USECASES_RETRIEVE_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('useCases', action.payload.result || {});
      return state;

    default:
      return state;
  }
};

help.memUseCases = (state?: any, doCall = false) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }

  if (state.help) {
    state = state.help;
  }

  let res = calcHelpUseCases();
  if (res == null) {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.helpUseCasesRetrieve_();
      }
    }
  } else {
    return res;
  }
};

export default help;
