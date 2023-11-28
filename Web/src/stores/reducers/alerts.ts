import * as Immutable from 'immutable';
import * as _ from 'lodash';
import * as moment from 'moment';
import Utils from '../../../core/Utils';
import StoreActions from '../actions/StoreActions';

export interface IAlertOne {
  alertId?: string;
  createdAt?: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  seen?: boolean;
}

export type IAlertOneImmutable = Immutable.Record<IAlertOne>;

let initState = Immutable.fromJS({
  isRefreshing: 0,
  alreadyId: {},
  neverDone: true,
  list: null,
  maxEpoch: null,
}) as Immutable.Map<string, any>;

const alerts = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.ALERTS_REFRESH_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.ALERTS_REFRESH_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      let usedSince = action.payload.since != null && action.payload.since !== 0;

      let list1 = action.payload.list ?? [];
      if (list1.length > 0 || state.get('list') == null || !usedSince) {
        let alreadyId = (usedSince ? state.get('alreadyId')?.toJS() : null) ?? {};

        let listA = (usedSince ? (state.get('list') as any[]) : null) ?? [];
        listA = [...listA];

        let maxEpoch = usedSince ? state.get('maxEpoch') : null;
        list1.some((a1: IAlertOne) => {
          let epochDt = moment(a1.createdAt).unix();

          if (maxEpoch == null || epochDt > maxEpoch) {
            maxEpoch = epochDt;
          }

          let done1 = false;
          if (alreadyId[a1.alertId]) {
            let ind = _.findIndex(listA, (a2) => a2.alertId === a1.alertId);
            if (ind > -1) {
              done1 = true;
              listA[ind] = a1;
            }
          }

          if (!done1) {
            listA.push(a1);
          }
        });

        state = state.set('maxEpoch', maxEpoch);

        listA = listA.sort((a, b) => {
          let dtA = moment(a.createdAt);
          let dtB = moment(b.createdAt);

          if (!dtA.isValid() || !dtB.isValid()) {
            return 0;
          } else {
            return dtB.diff(dtA);
          }
        });

        state = state.set('list', listA);

        list1.some((a1) => {
          state = state.setIn(['alreadyId', a1.alertId ?? ''], true);
        });
      }

      return state;

    default:
      return state;
  }
};

alerts.calcList = (state?: any) => {
  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.alerts) {
    state = state.alerts;
  }

  return state.getIn(['list']);
};

alerts.calcMaxEpoch = (state?: any) => {
  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.alerts) {
    state = state.alerts;
  }

  return state.getIn(['maxEpoch']);
};

export default alerts;
