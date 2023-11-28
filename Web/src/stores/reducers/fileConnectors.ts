import * as Immutable from 'immutable';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: null,
}) as Immutable.Map<string, any>;

const fileConnectors = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.FILE_CONNECTORS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FILE_CONNECTORS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      let data1 = action.payload?.list || [];

      state = state.set('list', data1);

      return state;

    default:
      return state;
  }
};

fileConnectors.memFileConnectors = (doCall, fileConnectors) => {
  if (fileConnectors) {
    let res = fileConnectors.get('list');
    if (res != null) {
      return res;
    } else {
      if (fileConnectors.get('isRefreshing')) {
        return;
      }
      if (doCall) {
        StoreActions.getFileConnectors();
      }
    }
  }
};

export default fileConnectors;
