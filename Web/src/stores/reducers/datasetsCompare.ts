import * as Immutable from 'immutable';

let initState = Immutable.fromJS({
  isRefreshing: 0,
}) as Immutable.Map<string, any>;

const datasetCompare = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    default:
      return state;
  }
};

export default datasetCompare;
