import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({}) as Immutable.Map<string, any>;

const navParams = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.SET_NAV_PARAMS:
      let params = action.payload.params || {};
      if (params) {
        if (!_.isEqual(state?.toJS() ?? {}, params)) {
          state = Immutable.fromJS(params) as Immutable.Map<string, any>;
        }
      }
      return state;

    default:
      return state;
  }
};

navParams.memParams = (state?: any) => {
  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.navParams) {
    state = state.navParams;
  }

  let res = state;
  if (res != null) {
    return res.toJS();
  }
};

export default navParams;
