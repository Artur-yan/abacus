import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: {},
}) as Immutable.Map<string, any>;

const databaseConnectorObjectSchema = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }
  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('list', Immutable.Map());
      return state;

    case StoreActions.DATABASE_CONNECTOR_OBJECT_SCHEMA_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.DATABASE_CONNECTOR_OBJECT_SCHEMA_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      let data1 = action.payload?.list || [];

      state = state.setIn(['list', '' + useNormalizedId(action.payload.databaseConnectorId) + '#' + useNormalizedId(action.payload.objectName)], data1);

      return state;

    default:
      return state;
  }
};

databaseConnectorObjectSchema.memDatabaseConnectorObjectSchema = (doCall, databaseConnectorId, objectName, databaseConnectorObjectSchema) => {
  databaseConnectorId = useNormalizedId(databaseConnectorId);
  objectName = useNormalizedId(objectName);
  if (databaseConnectorId == null || objectName == null) {
    return null;
  }

  if (!databaseConnectorObjectSchema) {
    databaseConnectorObjectSchema = Utils.globalStore().getState();

    if (databaseConnectorObjectSchema.databaseConnectorObjectSchema) {
      databaseConnectorObjectSchema = databaseConnectorObjectSchema.databaseConnectorObjectSchema;
    }
  }

  if (databaseConnectorObjectSchema) {
    let res = databaseConnectorObjectSchema.getIn(['list', '' + useNormalizedId(databaseConnectorId) + '#' + useNormalizedId(objectName)]);
    if (res != null) {
      return res;
    } else {
      if (databaseConnectorObjectSchema.get('isRefreshing')) {
        return;
      }
      if (doCall) {
        StoreActions.getDatabaseConnectorObjectSchema(databaseConnectorId, objectName);
      }
    }
  }
};

export default databaseConnectorObjectSchema;
