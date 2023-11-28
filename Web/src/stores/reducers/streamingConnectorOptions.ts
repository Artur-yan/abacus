import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  list: null,
}) as Immutable.Map<string, any>;

const streamingConnectorOptions = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }
  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('list', null);
      return state;

    case StoreActions.STREAMING_CONNECTOR_OPTIONS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.STREAMING_CONNECTOR_OPTIONS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      let data1 = action.payload?.list || {};

      state = state.set('list', data1);

      return state;

    default:
      return state;
  }
};

streamingConnectorOptions.memStreamingConnectorOptions = (doCall, streamingConnectorOptions) => {
  if (!streamingConnectorOptions) {
    streamingConnectorOptions = Utils.globalStore().getState();

    if (streamingConnectorOptions.streamingConnectorOptions) {
      streamingConnectorOptions = streamingConnectorOptions.streamingConnectorOptions;
    }
  }

  if (streamingConnectorOptions) {
    let res = streamingConnectorOptions.get('list');
    if (res != null) {
      return res;
    } else {
      if (streamingConnectorOptions.get('isRefreshing')) {
        return;
      }
      if (doCall) {
        StoreActions.getStreamingConnectorOptions();
      }
    }
  }
};

export default streamingConnectorOptions;
