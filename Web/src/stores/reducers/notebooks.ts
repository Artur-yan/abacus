import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum NotebookLifecycle {
  ACTIVE = 'ACTIVE',
  DEPLOYING = 'DEPLOYING',
  DEPLOYING_FAILED = 'DEPLOYING_FAILED',
  FAILED = 'FAILED',
  INITIALIZING = 'INITIALIZING',
  INITIALIZING_FAILED = 'INITIALIZING_FAILED',
  PENDING = 'PENDING',
  SAVING = 'SAVING',
  SAVING_FAILED = 'SAVING_FAILED',
  STOPPED = 'STOPPED',
  STOPPING = 'STOPPING',
}

export const NotebookLifecycleDesc = {
  [NotebookLifecycle.ACTIVE]: 'Active',
  [NotebookLifecycle.DEPLOYING]: 'Deploying',
  [NotebookLifecycle.DEPLOYING_FAILED]: 'Deploying Failed',
  [NotebookLifecycle.FAILED]: 'Failed',
  [NotebookLifecycle.INITIALIZING]: 'Initializing',
  [NotebookLifecycle.INITIALIZING_FAILED]: 'Initializing Failed',
  [NotebookLifecycle.PENDING]: 'Pending',
  [NotebookLifecycle.SAVING]: 'Saving',
  [NotebookLifecycle.SAVING_FAILED]: 'Saving Failed',
  [NotebookLifecycle.STOPPED]: 'Stopped',
  [NotebookLifecycle.STOPPING]: 'Stopping',
};

let initState = Immutable.fromJS({
  isRefreshing: 0,
  notebookById: {},
  notebookTemplateTypes: {},
  notebookTemplateList: {},
}) as Immutable.Map<string, any>;

const notebooks = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('notebookById', Immutable.fromJS({}));
      state = state.set('notebookTemplateList', Immutable.fromJS({}));
      return state;

    case StoreActions.NOTEBOOK_UPDATE_INFO:
      if (useNormalizedId(action.payload.notebookId) != null) {
        state = state.setIn(['notebookById', '' + useNormalizedId(action.payload.notebookId)], action.payload.result || {});
      }
      return state;

    case StoreActions.NOTEBOOK_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.NOTEBOOK_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['notebookById', '' + useNormalizedId(action.payload.notebookId)], action.payload.result || {});
      return state;

    case StoreActions.NOTEBOOK_TEMPLATE_TYPES_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.NOTEBOOK_TEMPLATE_TYPES_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['notebookTemplateTypes', 'allTemplates'], action?.payload?.result || []);
      return state;

    case StoreActions.NOTEBOOK_TEMPLATE_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.NOTEBOOK_TEMPLATE_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['notebookTemplateList', action?.payload?.templateType ?? 'allTemplates'], action?.payload?.result || []);
      return state;

    default:
      return state;
  }
};

notebooks.calcNotebookById = (state?: any, notebookId?) => {
  notebookId = useNormalizedId(notebookId);
  if (!notebookId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.notebooks) {
    state = state.notebooks;
  }

  return state.getIn(['notebookById', '' + notebookId]);
};

notebooks.memNotebookById = (doCall, notebookId) => {
  notebookId = useNormalizedId(notebookId);
  if (!notebookId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.notebooks) {
    state = state.notebooks;
  }

  let res = notebooks.calcNotebookById(undefined, notebookId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeNotebook_(notebookId);
      }
    }
  }
};

notebooks.calcNotebookTemplateTypes = (state?: any) => {
  if (state == null) state = Utils.globalStore().getState();
  if (state.notebooks) state = state.notebooks;

  return state.getIn(['notebookTemplateTypes', 'allTemplates']);
};

notebooks.memNotebookTemplateTypes = (doCall: boolean) => {
  let state = Utils.globalStore().getState();
  if (state.notebooks) state = state.notebooks;

  let res = notebooks.calcNotebookTemplateTypes(undefined);
  if (res != null) return res;
  if (state.get('isRefreshing')) return null;
  if (doCall) StoreActions._listNotebookTemplateTypes();
};

notebooks.calcNotebookTemplates = (state?: any, templateType?: string) => {
  if (state == null) state = Utils.globalStore().getState();
  if (state.notebooks) state = state.notebooks;

  return state.getIn(['notebookTemplateList', templateType ?? 'allTemplates']);
};

notebooks.memNotebookTemplates = (doCall: boolean, templateType?: string) => {
  let state = Utils.globalStore().getState();
  if (state.notebooks) state = state.notebooks;

  let res = notebooks.calcNotebookTemplates(undefined, templateType);
  if (res != null) return res;
  if (state.get('isRefreshing')) return null;
  if (doCall) StoreActions._listNotebookTemplates(templateType);
};

export default notebooks;
