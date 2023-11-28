import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: null,
}) as Immutable.Map<string, any>;

const databaseConnectors = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }
  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('list', null);
      return state;

    case StoreActions.DATABASE_CONNECTORS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DATABASE_CONNECTORS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      let data1 = action.payload?.list || [];

      state = state.set('list', data1);

      return state;

    default:
      return state;
  }
};

databaseConnectors.memDatabaseConnectors = (doCall, databaseConnectors) => {
  if (!databaseConnectors) {
    databaseConnectors = Utils.globalStore().getState();

    if (databaseConnectors.databaseConnectors) {
      databaseConnectors = databaseConnectors.databaseConnectors;
    }
  }

  if (databaseConnectors) {
    let res = databaseConnectors.get('list');
    if (res != null) {
      return res;
    } else {
      if (databaseConnectors.get('isRefreshing')) {
        return;
      }
      if (doCall) {
        StoreActions.getDatabaseConnectors();
      }
    }
  }
};

export default databaseConnectors;
