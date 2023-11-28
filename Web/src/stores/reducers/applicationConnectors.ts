import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: null,
}) as Immutable.Map<string, any>;

const applicationConnectors = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }
  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('list', null);
      return state;

    case StoreActions.APPLICATION_CONNECTORS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.APPLICATION_CONNECTORS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      let data1 = action.payload?.list || [];

      state = state.set('list', data1);

      return state;

    default:
      return state;
  }
};

applicationConnectors.memApplicationConnectors = (doCall, applicationConnectors) => {
  if (!applicationConnectors) {
    applicationConnectors = Utils.globalStore().getState();

    if (applicationConnectors.applicationConnectors) {
      applicationConnectors = applicationConnectors.applicationConnectors;
    }
  }

  if (applicationConnectors) {
    let res = applicationConnectors.get('list');
    if (res != null) {
      return res;
    } else {
      if (applicationConnectors.get('isRefreshing')) {
        return;
      }
      if (doCall) {
        StoreActions.getApplicationConnectors();
      }
    }
  }
};

export default applicationConnectors;
