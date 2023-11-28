import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  showChat: false,
  chatSessionId: {},
  chatProjectId: null,
  chatProjects: {},
  chatUrl: null,
  chatHistory: {},
  isChatRefresh: false,
  chatUserOrgId: null,
  validChatSession: {},
}) as Immutable.Map<string, any>;

const chat = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  let chatProjects = state.getIn(['chatProjects']) as any[];

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('showChat', false);
      state = state.set('validChatSession', Immutable.fromJS({}));
      state = state.set('isChatRefresh', false);
      state = state.set('chatSessionId', Immutable.fromJS({}));
      state = state.set('chatProjectId', null);
      state = state.set('chatUrl', null);
      state = state.set('chatHistory', Immutable.fromJS({}));
      state = state.set('chatProjects', Immutable.fromJS({}));
      state = state.set('chatUserOrgId', null);
      return state;

    case StoreActions.UPDATE_SHOW_CHAT:
      state = state.set('showChat', action.payload.result);
      return state;

    case StoreActions.UPDATE_VALID_CHAT_SESSION:
      state = state.setIn(['validChatSession', '' + useNormalizedId(action.payload.chatSessionId)], action.payload.result);
      return state;

    case StoreActions.UPDATE_CHAT_SESSION_ID:
      state = state.setIn(['chatSessionId', '' + useNormalizedId(action.payload.projectId)], action.payload.result);
      return state;

    case StoreActions.UPDATE_CHAT_PROJECT_ID:
      state = state.set('chatProjectId', useNormalizedId(action.payload.result));
      return state;

    case StoreActions.UPDATE_CHAT_USER_ORG_ID:
      state = state.set('chatUserOrgId', useNormalizedId(action.payload.result));
      return state;

    case StoreActions.DELETE_CHAT_PROJECT_ID:
      state = state.setIn(['chatSessionId', '' + useNormalizedId(action.payload.result)], null);

      state = state.updateIn(['chatProjects'], (value: any[]) => {
        return (value || []).filter((item) => item.id !== action.payload.result);
      });

      return state;

    case StoreActions.ADD_CHAT_PROJECTS:
      const exsistProject = chatProjects?.some((item) => item.id === action.payload.projectId);
      if (!exsistProject) {
        state = state.updateIn(['chatProjects'], (value: any[]) => {
          let newValue = [{ name: action.payload.projectName, id: action.payload.projectId }, ...(value || [])];
          if (newValue.length > 5) {
            newValue = newValue.slice(0, 5);
          }
          return newValue;
        });
      }
      return state;

    case StoreActions.UPDATE_REFRESH_CAHT:
      state = state.set('isChatRefresh', action.payload.result);
      return state;

    case StoreActions.UPDATE_CHAT_URL:
      state = state.set('chatUrl', action.payload.result);
      return state;

    case StoreActions.UPDATE_CHAT_HISTORY:
      state = state.setIn(['chatHistory', '' + useNormalizedId(action.payload.chatSessionId)], action.payload.result || []);
      return state;

    default:
      return state;
  }
};

chat.calcShowChat = () => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.get('showChat');
};

chat.calcChatRefresh = () => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.get('isChatRefresh');
};

chat.calcChatUserOrgId = () => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.get('chatUserOrgId');
};

chat.calcChatSessionId = (projectId?: string) => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.getIn(['chatSessionId', projectId]);
};

chat.calcValidChatSession = (chatSessionId?: string) => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.getIn(['validChatSession', chatSessionId]);
};

chat.calcChatProjectId = () => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.get('chatProjectId');
};

chat.calcChatUrl = () => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.get('chatUrl');
};

chat.calcChatHistory = (chatSessionId?: string) => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.getIn(['chatHistory', chatSessionId]);
};

chat.calcChatProjects = () => {
  let state = Utils.globalStore().getState();
  if (state.chat) {
    state = state.chat;
  }

  return state.getIn(['chatProjects']);
};

export default chat;
