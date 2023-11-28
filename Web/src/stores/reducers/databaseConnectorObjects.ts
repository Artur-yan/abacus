import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: {},
  errorForList: {},
}) as Immutable.Map<string, any>;

const databaseConnectorObjects = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }
  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('list', Immutable.Map());
      state = state.set('errorForList', Immutable.Map());
      return state;

    case StoreActions.DATABASE_CONNECTOR_OBJECTS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DATABASE_CONNECTOR_OBJECTS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      let data1 = action.payload?.list || [];

      state = state.setIn(['list', '' + (useNormalizedId(action.payload.databaseConnectorId) || '-')], data1);
      state = state.setIn(['errorForList', '' + (useNormalizedId(action.payload.databaseConnectorId) || '-')], action.payload?.error || null);

      return state;

    default:
      return state;
  }
};

databaseConnectorObjects.calcIsRefreshing = () => {
  let databaseConnectorObjects = Utils.globalStore().getState();

  if (databaseConnectorObjects.databaseConnectorObjects) {
    databaseConnectorObjects = databaseConnectorObjects.databaseConnectorObjects;
  }

  return !!databaseConnectorObjects?.get('isRefreshing');
};

databaseConnectorObjects.calcErrorForDatabaseConnectorId = (databaseConnectorId, databaseConnectorObjects) => {
  databaseConnectorId = useNormalizedId(databaseConnectorId);
  if (!databaseConnectorObjects) {
    databaseConnectorObjects = Utils.globalStore().getState();

    if (databaseConnectorObjects.databaseConnectorObjects) {
      databaseConnectorObjects = databaseConnectorObjects.databaseConnectorObjects;
    }
  }

  return databaseConnectorObjects?.getIn(['errorForList', databaseConnectorId || '']);
};

databaseConnectorObjects.memDatabaseConnectorObjects = (doCall, databaseConnectorId, databaseConnectorObjects) => {
  databaseConnectorId = useNormalizedId(databaseConnectorId);
  if (!databaseConnectorObjects) {
    databaseConnectorObjects = Utils.globalStore().getState();

    if (databaseConnectorObjects.databaseConnectorObjects) {
      databaseConnectorObjects = databaseConnectorObjects.databaseConnectorObjects;
    }
  }

  if (databaseConnectorObjects && databaseConnectorId) {
    let res = databaseConnectorObjects.getIn(['list', databaseConnectorId || '-']);
    if (res != null) {
      return res;
    } else {
      if (databaseConnectorObjects.get('isRefreshing')) {
        return;
      }
      if (doCall) {
        StoreActions.getDatabaseConnectorObjects(databaseConnectorId);
      }
    }
  }
};

export default databaseConnectorObjects;
