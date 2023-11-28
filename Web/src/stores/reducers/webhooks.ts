import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import { calcWebhookIdToString, IWebhookId } from '../../components/WebhookList/WebhookIdHelpers';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  isRefreshing: 0,
  webhookById: {},
  webhookListById: {},
}) as Immutable.Map<string, any>;

const webhooks = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('webhookById', Immutable.fromJS({}));
      state = state.set('webhookListById', Immutable.fromJS({}));
      return state;

    case StoreActions.WEBHOOK_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.WEBHOOK_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['webhookById', '' + useNormalizedId(action.payload.webhookId)], action.payload.result || {});
      return state;

    case StoreActions.WEBHOOK_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.WEBHOOK_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['webhookListById', '' + useNormalizedId(calcWebhookIdToString(action.payload.id))], action.payload.result || []);
      return state;

    default:
      return state;
  }
};

webhooks.calcWebhookById = (state?: any, webhookId?) => {
  webhookId = useNormalizedId(webhookId);
  if (!webhookId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.webhooks) {
    state = state.webhooks;
  }

  return state.getIn(['webhookById', '' + webhookId]);
};

webhooks.memWebhookById = (doCall, webhookId: string) => {
  webhookId = useNormalizedId(webhookId);
  if (!webhookId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.webhooks) {
    state = state.webhooks;
  }

  let res = webhooks.calcWebhookById(undefined, webhookId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeWebhook_(webhookId);
      }
    }
  }
};

webhooks.calcListWebhookById = (state?: any, id?: IWebhookId) => {
  if (!id || _.isEmpty(id) || !calcWebhookIdToString(id)) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.webhooks) {
    state = state.webhooks;
  }

  return state.getIn(['webhookListById', '' + useNormalizedId(calcWebhookIdToString(id))]);
};

webhooks.memListWebhookById = (doCall, id: IWebhookId) => {
  if (!id || _.isEmpty(id) || !calcWebhookIdToString(id)) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.webhooks) {
    state = state.webhooks;
  }

  let res = webhooks.calcListWebhookById(undefined, id);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listWebhooks_(id);
      }
    }
  }
};

export default webhooks;
