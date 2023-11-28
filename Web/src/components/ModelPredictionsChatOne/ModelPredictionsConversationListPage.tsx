import React, { memo, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import SplitPane from 'react-split-pane';

import { useAppSelector } from '../../../core/hooks';
import Utils from '../../../core/Utils';

import REClient_ from '../../api/REClient';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import models from '../../stores/reducers/models';

import NanoScroller from '../NanoScroller/NanoScroller';
import ModelPredictionsChatConvos from './ModelPredictionsChatConvos';
import ModelPredictionsChatMessages from './ModelPredictionsChatMessages';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import { IChatMsgOne } from './ModelPredictionsChatMsgOne';
import themeStyles from '../antdUseDark.module.css';
import { ConversationInfo, defaultDeploymentConversationId, IChatConvoOne } from './modelPredictionsChatTypes';

const delay = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout));

const enum ActionType {
  UPDATE_PROCESSING_INFO = 'UPDATE_PROCESSING_INFO',
  UPDATE_CONVERSATION = 'UPDATE_CONVERSATION',
  UPDATE_SELECTED_DEPLOYMENT_CONVERSATION_ID = 'UPDATE_SELECTED_DEPLOYMENT_CONVERSATION_ID',
  UPDATE_FEEDBACK_FEATURE_GROUP_ID = 'UPDATE_FEEDBACK_FEATURE_GROUP_ID',
  UPDATE_SELECTED_CONVERSATION_DATA = 'UPDATE_SELECTED_CONVERSATION_DATA',
  UPDATE_CONVERSATION_LIST = 'UPDATE_CONVERSATION_LIST',
  CREATE_DEPLOYMENT_CONVERSATION = 'CREATE_DEPLOYMENT_CONVERSATION',
}

interface StateProps {
  processingInfo: Record<string, boolean>;
  fetchConversationState: { isFetched: boolean; placeholder: string };
  feedbackFeatureGroupId: null;
  conversationsList: IChatConvoOne[];
  conversationDataMap: Record<string, ConversationInfo | undefined>;
  selectedDeploymentConversationId: string;
}

interface Action {
  type: ActionType;
  payload?: Partial<StateProps>;
}

const initialState: StateProps = {
  processingInfo: null,
  fetchConversationState: { isFetched: false, placeholder: null },
  feedbackFeatureGroupId: null,
  conversationsList: [],
  conversationDataMap: null,
  selectedDeploymentConversationId: null,
};

export const ModelPredictionsConversationListPage = memo(function ModelPredictionsConversationListPage() {
  const navigate = useNavigate();
  const projectId = useAppSelector((rootState) => rootState.paramsProp?.get('projectId'));
  const deploymentId = useAppSelector((rootState) => rootState.paramsProp?.get('deployId'));
  const deploymentConversationIdParam = useAppSelector((rootState) => rootState.paramsProp?.get('deploymentConversationId'));

  const [state, dispatch] = useReducer(reducer, initialState);

  const { conversationDataMap, conversationsList, feedbackFeatureGroupId, fetchConversationState, processingInfo, selectedDeploymentConversationId } = state;

  const getFeedbackFGName = (deploymentName: string) => {
    const spaceRegex = /\s/g;
    return `${Utils.toSnakeCaseNew(deploymentName.replace(spaceRegex, '_'))}_chat_feedback`;
  };

  const pollChatMessage = async (deploymentConversationId: string, processDeploymentConversationId: string, textMessage: string) => {
    const requestId = await REClient_.promisesV2()
      .createChatLLMSendMessageRequest(deploymentConversationId, textMessage)
      .then((res) => res.requestId);

    let pollResult;
    do {
      try {
        pollResult = await REClient_.promisesV2()
          .getChatLLMSendMessageRequestStatus(requestId)
          .then((res) => {
            const tempSelectedConversationData = { ...conversationDataMap?.[deploymentConversationId] };
            tempSelectedConversationData.history = [...res.result.messages];
            const lastMsgId = res.result.messages.length - 1;
            if (lastMsgId > -1) {
              tempSelectedConversationData.history[lastMsgId].isProcessing = res.result.status == 'PROCESSING' && res.result.messages[lastMsgId].text === '';
            }
            dispatch({ type: ActionType.UPDATE_SELECTED_CONVERSATION_DATA, payload: { conversationDataMap: { [deploymentConversationId]: tempSelectedConversationData } } });
            return res.result;
          })
          .catch((err) => {
            const tempSelectedConversationData = { ...conversationDataMap?.[deploymentConversationId] };
            const lastMsgId = (tempSelectedConversationData?.history?.length ?? 0) - 1;
            if (lastMsgId > -1) {
              tempSelectedConversationData.history[lastMsgId].isProcessing = false;
              tempSelectedConversationData.history[lastMsgId].text = err?.message;
            }
            dispatch({ type: ActionType.UPDATE_SELECTED_CONVERSATION_DATA, payload: { conversationDataMap: { [deploymentConversationId]: tempSelectedConversationData } } });
            dispatch({ type: ActionType.UPDATE_PROCESSING_INFO, payload: { processingInfo: { [processDeploymentConversationId]: null } } });
            return { status: 'COMPLETED' };
          });
      } catch (err) {
        //
      }
      await delay(100);
    } while (pollResult?.status !== 'COMPLETED');
    dispatch({ type: ActionType.UPDATE_PROCESSING_INFO, payload: { processingInfo: { [processDeploymentConversationId]: false } } });
  };

  const onSubmitMessageHandler = (textMessage: string, deploymentConversationId: string) => {
    const tempDeploymentConversationId = deploymentConversationId ?? defaultDeploymentConversationId;
    setTimeout(() => {
      dispatch({ type: ActionType.UPDATE_PROCESSING_INFO, payload: { processingInfo: { [tempDeploymentConversationId]: true } } });
      const tempSelectedConversationData = { ...conversationDataMap?.[tempDeploymentConversationId] };
      tempSelectedConversationData.history = tempSelectedConversationData.history ?? [];
      tempSelectedConversationData.history.push({
        role: 'USER',
        text: textMessage,
      });
      let dummyProcessingMsg = {
        role: 'BOT',
        text: '',
        isProcessing: true,
        isInternal: true,
      } as IChatMsgOne;
      tempSelectedConversationData.history.push(dummyProcessingMsg);
      dispatch({ type: ActionType.UPDATE_SELECTED_CONVERSATION_DATA, payload: { conversationDataMap: { [tempDeploymentConversationId]: tempSelectedConversationData } } });

      if (!selectedDeploymentConversationId) {
        REClient_.promisesV2()
          .createDeploymentConversation(deploymentId, `Conversation ${conversationsList.length + 1}`)
          .then((res) => {
            if (res?.result) {
              const { result } = res;
              const resDeploymentConversationId = result.deploymentConversationId;
              const tempConversationList = [...conversationsList];
              dispatch({
                type: ActionType.CREATE_DEPLOYMENT_CONVERSATION,
                payload: {
                  selectedDeploymentConversationId: resDeploymentConversationId,
                  conversationsList: [result, ...tempConversationList],
                  conversationDataMap: { [resDeploymentConversationId]: { ...result, history: tempSelectedConversationData.history } },
                },
              });
              pollChatMessage(resDeploymentConversationId, resDeploymentConversationId, textMessage);
              navigate(`/app/model_predictions/${projectId}/${deploymentId}/${resDeploymentConversationId}`);
            }
            return res?.result;
          })
          .catch((err) => {
            dispatch({ type: ActionType.UPDATE_PROCESSING_INFO, payload: { processingInfo: { [tempDeploymentConversationId]: false } } });
          });
      } else {
        pollChatMessage(selectedDeploymentConversationId, tempDeploymentConversationId, textMessage);
      }
    });
  };

  const onNewChatHandler = () => {
    dispatch({ type: ActionType.UPDATE_CONVERSATION, payload: { fetchConversationState: { isFetched: true, placeholder: 'Creating a new conversation...' } } });
    REClient_.promisesV2()
      .createDeploymentConversation(deploymentId, `Conversation ${conversationsList.length + 1}`)
      .then((res) => {
        if (res?.result) {
          const { result } = res;
          const tempConversationList = [...conversationsList];
          dispatch({
            type: ActionType.CREATE_DEPLOYMENT_CONVERSATION,
            payload: {
              selectedDeploymentConversationId: result.deploymentConversationId,
              conversationsList: [result, ...tempConversationList],
              conversationDataMap: { [result.deploymentConversationId]: result },
            },
          });
          navigate(`/app/model_predictions/${projectId}/${deploymentId}/${result.deploymentConversationId}`);
        }
      })
      .finally(() => {
        dispatch({ type: ActionType.UPDATE_CONVERSATION, payload: { fetchConversationState: { isFetched: false, placeholder: null } } });
      });
  };

  useEffect(() => {
    REClient_.promisesV2()
      .listDeploymentConversations(deploymentId)
      .then((res) => {
        dispatch({ type: ActionType.UPDATE_CONVERSATION_LIST, payload: { conversationsList: res.result } });
      });
    const deploymentList = calcDeploymentsByProjectId(undefined, projectId);
    const deploymentOne = deploymentList.find((item) => item.deploymentId === deploymentId);
    if (deploymentOne) {
      models.memModelById(true, undefined, deploymentOne.modelId);
      const feedbackFGName = getFeedbackFGName(deploymentOne.name);
      REClient_.client_().describeFeatureGroupByTableName(feedbackFGName, projectId, (err, res) => {
        dispatch({ type: ActionType.UPDATE_FEEDBACK_FEATURE_GROUP_ID, payload: { feedbackFeatureGroupId: res?.result?.featureGroupId } });
      });
    }
  }, [deploymentId]);

  useEffect(() => {
    if (deploymentConversationIdParam !== selectedDeploymentConversationId && deploymentConversationIdParam != null) {
      dispatch({ type: ActionType.UPDATE_SELECTED_DEPLOYMENT_CONVERSATION_ID, payload: { selectedDeploymentConversationId: deploymentConversationIdParam } });
      if (processingInfo?.[deploymentConversationIdParam] == null) {
        dispatch({ type: ActionType.UPDATE_PROCESSING_INFO, payload: { processingInfo: { [deploymentConversationIdParam]: false } } });
        dispatch({ type: ActionType.UPDATE_CONVERSATION, payload: { fetchConversationState: { isFetched: true, placeholder: 'Retrieving conversation...' } } });
        REClient_.promisesV2()
          .getDeploymentConversation(deploymentConversationIdParam)
          .then((res) => {
            dispatch({ type: ActionType.UPDATE_SELECTED_CONVERSATION_DATA, payload: { conversationDataMap: { [deploymentConversationIdParam]: res.result } } });
          })
          .finally(() => {
            dispatch({ type: ActionType.UPDATE_CONVERSATION, payload: { fetchConversationState: { isFetched: false, placeholder: null } } });
          });
      }
    } else if (deploymentConversationIdParam == null) {
      dispatch({ type: ActionType.UPDATE_SELECTED_DEPLOYMENT_CONVERSATION_ID, payload: { selectedDeploymentConversationId: null } });
    }
  }, [deploymentConversationIdParam]);

  return (
    <div className={themeStyles.absolute}>
      {/*// @ts-ignore*/}
      <SplitPane
        split={'vertical'}
        minSize={250}
        defaultSize={Utils.dataNum('chatOneLeft', 300)}
        onChange={(v1) => {
          Utils.dataNum('chatOneLeft', undefined, v1);
        }}
      >
        <ModelPredictionsChatConvos
          convoList={conversationsList}
          convoSelId={selectedDeploymentConversationId}
          onNewClick={onNewChatHandler}
          onSelectConvo={(deploymentConversationId: string) => {
            if (deploymentConversationId !== selectedDeploymentConversationId) {
              navigate(`/app/model_predictions/${projectId}/${deploymentId}/${deploymentConversationId}`);
            }
          }}
        />
        <div
          css={`
            background-color: rgba(255, 255, 255, 0.14);
          `}
          className={themeStyles.absolute}
        >
          <NanoScroller onlyVertical>
            <div>
              {fetchConversationState.isFetched && !processingInfo?.[selectedDeploymentConversationId] ? (
                <RefreshAndProgress msgMsg={fetchConversationState.placeholder} isMsgAnimRefresh={processingInfo?.[selectedDeploymentConversationId]} />
              ) : (
                <ModelPredictionsChatMessages
                  projectId={projectId}
                  deploymentId={deploymentId}
                  feedbackFeatureGroupId={feedbackFeatureGroupId}
                  onSubmitMessage={onSubmitMessageHandler}
                  conversation={conversationDataMap?.[selectedDeploymentConversationId ?? defaultDeploymentConversationId]}
                  isProcessing={processingInfo?.[selectedDeploymentConversationId]}
                  deploymentConversationId={selectedDeploymentConversationId}
                />
              )}
            </div>
          </NanoScroller>
        </div>
      </SplitPane>
    </div>
  );
});

const reducer = (state: StateProps, action: Action) => {
  switch (action.type) {
    case ActionType.UPDATE_PROCESSING_INFO: {
      return {
        ...state,
        processingInfo: { ...state.processingInfo, ...action.payload.processingInfo },
      };
    }
    case ActionType.UPDATE_CONVERSATION:
      return {
        ...state,
        fetchConversationState: { ...action.payload.fetchConversationState },
      };
    case ActionType.UPDATE_SELECTED_DEPLOYMENT_CONVERSATION_ID:
      return {
        ...state,
        selectedDeploymentConversationId: action.payload.selectedDeploymentConversationId,
      };
    case ActionType.UPDATE_FEEDBACK_FEATURE_GROUP_ID:
      return {
        ...state,
        feedbackFeatureGroupId: action.payload.feedbackFeatureGroupId,
      };
    case ActionType.UPDATE_SELECTED_CONVERSATION_DATA:
      return {
        ...state,
        conversationDataMap: { ...state.conversationDataMap, ...action.payload.conversationDataMap },
      };
    case ActionType.UPDATE_CONVERSATION_LIST:
      return {
        ...state,
        conversationsList: [...action.payload.conversationsList],
      };
    case ActionType.CREATE_DEPLOYMENT_CONVERSATION:
      const { selectedDeploymentConversationId, conversationsList, conversationDataMap } = action.payload;
      const tempConversationDataMap = { ...state.conversationDataMap, ...conversationDataMap };

      if (tempConversationDataMap[defaultDeploymentConversationId]) {
        delete tempConversationDataMap[defaultDeploymentConversationId];
      }
      return {
        ...state,
        selectedDeploymentConversationId,
        conversationsList: [...conversationsList],
        conversationDataMap: tempConversationDataMap,
      };
    default:
      return state;
  }
};
