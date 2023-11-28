import _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import * as uuid from 'uuid';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import models from '../../stores/reducers/models';
import NanoScroller from '../NanoScroller/NanoScroller';
import ModelPredictionsChatConvos from './ModelPredictionsChatConvos';
import ModelPredictionsChatMessages from './ModelPredictionsChatMessages';
import { IChatMsgOne } from './ModelPredictionsChatMsgOne';
import { ConversationInfo, IChatConvoOne } from './modelPredictionsChatTypes';
const s = require('./ModelPredictionsChatOne.module.css');
const stylesDark = require('../antdUseDark.module.css');

/** TODO: Ajay&Atif, Remove this component once AI agents enable saving conversations and replace it with ModelPredictionsConversationPage. */

interface IModelPredictionsChatOneProps {}

const ModelPredictionsChatOne = React.memo((props: PropsWithChildren<IModelPredictionsChatOneProps>) => {
  const { paramsProp, modelsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    modelsParam: state.models,
  }));

  const [conversations, setConversations] = useState([] as IChatConvoOne[]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationsById, setConversationsById] = useState<Record<string, ConversationInfo>>({});
  const [feedbackFeatureGroupId, setFeedbackFeatureGroupId] = useState(null as string);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  const projectOne = useProject(projectId);
  const deployId = paramsProp?.get('deployId');

  const getFeedbackFGName = (deploymentName: string) => {
    const spaceRegex = /\s/g;
    return `${Utils.toSnakeCaseNew(deploymentName.replace(spaceRegex, '_'))}_chat_feedback`;
  };

  useEffect(() => {
    const deploymentList = calcDeploymentsByProjectId(undefined, projectId);
    const deploymentOne = deploymentList.find((item) => item.deploymentId === deployId);
    if (deploymentOne) {
      models.memModelById(true, undefined, deploymentOne.modelId);
      const feedbackFGName = getFeedbackFGName(deploymentOne.name);
      REClient_.client_().describeFeatureGroupByTableName(feedbackFGName, projectId, (err, res) => {
        setFeedbackFeatureGroupId(res?.result?.featureGroupId);
      });
    }
  }, [modelsParam, deployId]);

  const modelOne = useMemo(() => {
    const deploymentList = calcDeploymentsByProjectId(undefined, projectId);
    const deploymentOne = deploymentList.find((item) => item.deploymentId === deployId);
    if (deploymentOne) {
      return models.memModelById(false, undefined, deploymentOne.modelId)?.toJS();
    }
  }, [modelsParam, deployId]);

  useEffect(() => {
    setConversations((list) => {
      if (!list?.length) {
        list ??= [];
      }

      setTimeout(() => {
        onClickNewConversation();
      }, 0);

      return list;
    });
  }, []);

  const calcNewName: (any) => string = (n) => {
    return `Conversation ${n}`;
  };

  const onClickNewConversation = () => {
    setConversations((list) => {
      list ??= [];

      let regex1 = new RegExp(calcNewName('([0-9]+)'), 'gi');
      let n = 1;
      list?.some((c1) => {
        if (regex1.test(c1?.name ?? '')) {
          n = Math.max(n, Utils.tryParseInt(RegExp.$1) ?? 0);
        }
      });

      let id1 = uuid.v1();
      list.push({
        deploymentConversationId: id1,
        name: calcNewName(n),
      });
      setTimeout(() => {
        setSelectedConversationId(id1);
      }, 0);

      return list;
    });
  };

  const onSelectConvo = (id) => {
    setSelectedConversationId(id ?? null);
  };

  const doProcessMsg = async (convoId?: string, c1Processing?: IChatMsgOne, c1?: IChatMsgOne[], query?: string) => {
    setIsProcessing(true);

    c1 = c1?.filter((c2) => !c2?.isInternal);

    setSelectedConversationId(async (id1) => {
      const handleError = (err) => {
        setConversationsById((convos) => {
          convos = { ...(convos ?? {}) };

          let c1 = convos[id1] ?? ({ history: null } as ConversationInfo);
          c1.history = [...(c1?.history ?? [])];

          let ind1 = _.findIndex(c1.history, (c2) => c2 === c1Processing);
          if (ind1 == -1) {
            ind1 = c1.history.length - 1;
          }
          if (ind1 > -1) {
            let c2 = { ...(c1[ind1] ?? {}) };
            delete c2.isProcessing;
            delete c2.isInternal;
            c2.text = 'Error: ' + (err || Constants.errorDefault);
            c1.history[ind1] = c2;
          }

          convos[id1] = c1;
          return convos;
        });
      };

      if (projectOne?.useCase === 'AI_AGENT') {
        const chatHistory = conversationsById?.[id1]?.history?.map((item) => ({ role: item.isUser ? 'USER' : 'ASSISTANT', text: item.text }));
        try {
          const createRequest = await REClient_.promises_().createExecuteAgentRequest(deployId, query, null, chatHistory);
          if (!createRequest?.success || createRequest?.error) {
            throw new Error(createRequest?.error);
          }
          let requestId = createRequest?.requestId;

          const delay = (ms) => new Promise((res) => setTimeout(res, ms));
          let status = null;
          while (status !== 'COMPLETED') {
            await delay(100);
            const currentState = await REClient_.promises_().getExecuteAgentRequestStatus(requestId);
            if (!currentState?.success || currentState?.error) {
              throw new Error(currentState?.error);
            }
            if (currentState?.result === null) continue;
            status = currentState?.result?.status;
            setConversationsById((convos) => {
              convos = { ...(convos ?? {}) };

              let c1 = convos[id1] ?? ({ history: null } as ConversationInfo);
              c1.history = [...(c1.history ?? [])];

              let ind1 = _.findIndex(c1.history, (c2) => c2 === c1Processing);
              if (ind1 == -1) {
                ind1 = c1.history.length - 1;
              }
              if (ind1 > -1) {
                let c2 = { ...(c1.history[ind1] ?? {}) };
                let final_result = currentState?.result?.text;
                let text = typeof final_result === 'object' ? final_result?.predicted ?? '' : typeof final_result === 'string' ? final_result : '';
                if (text !== '') {
                  c2.text = text;
                  delete c2.isProcessing;
                  delete c2.isInternal;
                  c1.history[ind1] = c2;
                }
              }

              convos[id1] = c1;
              return convos;
            });
          }
        } catch (error) {
          setIsProcessing(false);
          handleError(error);
          return;
        }
        setIsProcessing(false);
      }

      return id1;
    });
  };

  const onSubmitMessage = (text?: string) => {
    setTimeout(() => {
      setSelectedConversationId((id1) => {
        setConversationsById((convos) => {
          convos = { ...(convos ?? {}) };
          let c1 = convos[id1] ?? ({ history: null } as ConversationInfo);
          c1.history = [...(c1.history ?? [])];

          c1.history.push({
            isUser: true,
            text: text,
          });

          let c1Processing = {
            text: '',
            isProcessing: true,
            isInternal: true,
          } as IChatMsgOne;

          doProcessMsg(id1, c1Processing, c1.history, text);
          c1.history.push(c1Processing);
          convos[id1] = c1;
          return convos;
        });

        return id1;
      });
    });
  };

  const selectedConversation = useMemo(() => {
    return conversationsById?.[selectedConversationId];
  }, [selectedConversationId, conversationsById]);

  return (
    <div className={stylesDark.absolute}>
      {/*// @ts-ignore*/}
      <SplitPane
        split={'vertical'}
        minSize={250}
        defaultSize={Utils.dataNum('chatOneLeft', 300)}
        onChange={(v1) => {
          Utils.dataNum('chatOneLeft', undefined, v1);
        }}
      >
        <ModelPredictionsChatConvos convoList={conversations} convoSelId={selectedConversationId} onNewClick={onClickNewConversation} onSelectConvo={onSelectConvo} />
        <div
          css={`
            background-color: rgba(255, 255, 255, 0.14);
          `}
          className={stylesDark.absolute}
        >
          <NanoScroller onlyVertical>
            {projectOne?.useCase === 'AI_AGENT' && modelOne && (
              <div css={'margin: 10px; font-size: 14px;'}>
                <div css={'margin-bottom: 5px;'}>Agent: {modelOne?.name}</div>
                <div>Description: {modelOne?.modelConfig?.DESCRIPTION}</div>
              </div>
            )}
            <div>
              <ModelPredictionsChatMessages projectId={projectId} deploymentId={deployId} feedbackFeatureGroupId={feedbackFeatureGroupId} onSubmitMessage={onSubmitMessage} conversation={selectedConversation} isProcessing={isProcessing} />
            </div>
          </NanoScroller>
        </div>
      </SplitPane>
    </div>
  );
});

export default ModelPredictionsChatOne;
