import * as Immutable from 'immutable';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: null,
}) as Immutable.Map<string, any>;

const fileConnectorOptions = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }
  switch (action.type) {
    case StoreActions.FILE_CONNECTOR_OPTIONS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.FILE_CONNECTOR_OPTIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      let data1 = action.payload?.list || {};

      state = state.set('list', data1);

      return state;

    default:
      return state;
  }
};

fileConnectorOptions.memFileConnectorOptions = (doCall, fileConnectorOptions) => {
  if (fileConnectorOptions) {
    let res = fileConnectorOptions.get('list');
    if (res != null) {
      return res;
    } else {
      if (fileConnectorOptions.get('isRefreshing')) {
        return;
      }
      if (doCall) {
        StoreActions.getFileConnectorOptions();
      }
    }
  }
};

export default fileConnectorOptions;
