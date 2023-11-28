import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  tokens: null,
}) as Immutable.Map<string, any>;

const streamTokens = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('tokens', null);
      return state;

    case StoreActions.STREAM_TOKENS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.STREAM_TOKENS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('tokens', action.payload.result || []);
      return state;

    default:
      return state;
  }
};

streamTokens.calcTokens = () => {
  let state = Utils.globalStore().getState();
  if (state.streamTokens) {
    state = state.streamTokens;
  }

  return state.get('tokens');
};

streamTokens.memTokensList = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.streamTokens) {
    state = state.streamTokens;
  }

  let res = streamTokens.calcTokens();
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.getStreamTokens_();
      }
    }
  }
};

export default streamTokens;
