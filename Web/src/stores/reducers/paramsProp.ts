import * as Immutable from 'immutable';
import * as _ from 'lodash';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({}) as Immutable.Map<string, any>;

const paramsProp = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.SET_PARAMS:
      let params = action.payload.params;
      if (params && !_.isEmpty(params)) {
        state = Immutable.fromJS(params) as Immutable.Map<string, any>;
      }
      return state;

    default:
      return state;
  }
};

export default paramsProp;
