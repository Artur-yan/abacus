import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export enum PipelineLifecycle {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

let initState = Immutable.fromJS({
  isRefreshing: 0,
  pipeline: {},
  pipelines: {},
  pipelineVersions: {},
}) as Immutable.Map<string, any>;

const pipelines = (state = initState, action: any) => {
  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('pipeline', Immutable.fromJS({}));
      state = state.set('pipelines', Immutable.fromJS({}));
      state = state.set('pipelineVersions', Immutable.fromJS({}));
      break;

    case StoreActions.PIPELINE_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      break;

    case StoreActions.PIPELINE_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['pipeline', useNormalizedId(action?.payload?.pipelineId)], action?.payload?.result || {});
      break;

    case StoreActions.PIPELINE_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      break;

    case StoreActions.PIPELINE_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['pipelines', '' + (useNormalizedId(action?.payload?.projectId) ?? 'all')], action?.payload?.result || []);
      break;

    case StoreActions.PIPELINE_VERSION_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      break;

    case StoreActions.PIPELINE_VERSION_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['pipelineVersions', useNormalizedId(action?.payload?.pipelineId)], action?.payload?.result || {});
      break;

    default:
      break;
  }

  return state;
};

pipelines.getStorePipeline = (pipelineId?: string, state?: any) => {
  if (!pipelineId) return null;
  if (!state) state = Utils.globalStore().getState()?.pipelines;

  return state.getIn(['pipeline', pipelineId]);
};

pipelines.getPipeline = (invalidateCache: boolean, pipelineId: string) => {
  if (!pipelineId) return null;

  let state = Utils.globalStore().getState()?.pipelines;
  let res = pipelines.getStorePipeline(pipelineId, state);

  if (res) return res;
  if (state.get('isRefreshing')) return null;
  if (invalidateCache) StoreActions.describePipeline(pipelineId);
};

pipelines.getStorePipelines = (state?: any, projectId?: string) => {
  if (!state) state = Utils.globalStore().getState()?.pipelines;
  return state.getIn(['pipelines', projectId ?? 'all']);
};

pipelines.getPipelines = (invalidateCache: boolean, projectId?: string) => {
  let state = Utils.globalStore().getState()?.pipelines;
  let res = pipelines.getStorePipelines(state, projectId);

  if (res) return res;
  if (state.get('isRefreshing')) return null;
  if (invalidateCache) StoreActions.listPipelines(projectId);
};

pipelines.getStorePipelineVersions = (pipelineId?: string, state?: any) => {
  if (!pipelineId) return null;
  if (!state) state = Utils.globalStore().getState()?.pipelines;

  return state.getIn(['pipelineVersions', pipelineId]);
};

pipelines.getPipelineVersions = (invalidateCache: boolean, pipelineId: string) => {
  if (!pipelineId) return null;

  let state = Utils.globalStore().getState()?.pipelines;
  let res = pipelines.getStorePipelineVersions(pipelineId, state);

  if (res) return res;
  if (state.get('isRefreshing')) return null;
  if (invalidateCache) StoreActions.listPipelineVersions(pipelineId);
};

export default pipelines;
