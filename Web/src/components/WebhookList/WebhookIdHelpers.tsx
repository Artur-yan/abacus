import Utils from '../../../core/Utils';

export enum EWebhookEventType {
  DEPLOYMENT_START = 'DEPLOYMENT_START',
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',
  DEPLOYMENT_SUCCESS = 'DEPLOYMENT_SUCCESS',
}

export interface IWebhookId {
  deploymentId?: string;
}

export const calcWebhookIdToString = (id: IWebhookId, isKey = false) => {
  if (id == null) {
    return null;
  } else {
    const kk = Object.keys(id ?? {});
    let id1 = null;
    kk.some((k1) => {
      if (!Utils.isNullOrEmpty(id[k1])) {
        if (id1 != null) {
          id1 = null;
          return true;
        }
        id1 = isKey ? k1 : id[k1];
      }
    });
    return id1;
  }
};
