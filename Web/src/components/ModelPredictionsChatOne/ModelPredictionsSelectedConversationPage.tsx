import React, { memo, useEffect, useState } from 'react';

import { useAppSelector } from '../../../core/hooks';
import Utils from '../../../core/Utils';

import REClient_ from '../../api/REClient';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import models from '../../stores/reducers/models';

import themeStyles from '../antdUseDark.module.css';
import NanoScroller from '../NanoScroller/NanoScroller';
import ModelPredictionsChatMessages from './ModelPredictionsChatMessages';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import { ConversationInfo } from './modelPredictionsChatTypes';

export const ModelPredictionsSelectedConversationPage = memo(function ModelPredictionsSelectedConversationPage() {
  const projectId = useAppSelector((state) => state.paramsProp?.get('projectId'));
  const deploymentId = useAppSelector((state) => state.paramsProp?.get('deployId'));
  const sharedDeploymentConversationId = useAppSelector((state) => state.paramsProp?.get('share'));

  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackFeatureGroupId, setFeedbackFeatureGroupId] = useState<string>();
  const [selectedConversationData, setSelectedConversationData] = useState<ConversationInfo | undefined>();

  useEffect(() => {
    const deploymentList = calcDeploymentsByProjectId(undefined, projectId);
    const deploymentOne = deploymentList.find((item) => item.deploymentId === deploymentId);
    if (deploymentOne) {
      models.memModelById(true, undefined, deploymentOne.modelId);
      const feedbackFGName = getFeedbackFGName(deploymentOne.name);
      REClient_.client_().describeFeatureGroupByTableName(feedbackFGName, projectId, (err, res) => {
        setFeedbackFeatureGroupId(res?.result?.featureGroupId);
      });
    }
  }, [deploymentId]);

  const getFeedbackFGName = (deploymentName: string) => {
    const spaceRegex = /\s/g;
    return `${Utils.toSnakeCaseNew(deploymentName.replace(spaceRegex, '_'))}_chat_feedback`;
  };

  const getSelectedConversationData = () => {
    setIsProcessing(true);
    REClient_.promisesV2()
      .getDeploymentConversation(sharedDeploymentConversationId)
      .then((res) => {
        setSelectedConversationData(res.result);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  useEffect(() => {
    getSelectedConversationData();
  }, [sharedDeploymentConversationId]);

  return (
    <div className={themeStyles.absolute}>
      <RefreshAndProgress isRefreshing={isProcessing} hideLinearProgress={true}>
        <div
          css={`
            background-color: rgba(255, 255, 255, 0.14);
          `}
          className={themeStyles.absolute}
        >
          <NanoScroller onlyVertical>
            <div>
              {isProcessing ? (
                <RefreshAndProgress msgMsg={isProcessing ? 'Retrieving conversation...' : null} isMsgAnimRefresh={isProcessing} />
              ) : (
                <ModelPredictionsChatMessages projectId={projectId} deploymentId={deploymentId} feedbackFeatureGroupId={feedbackFeatureGroupId} conversation={selectedConversationData} isProcessing={isProcessing} hideMsgWrite={true} />
              )}
            </div>
          </NanoScroller>
        </div>
      </RefreshAndProgress>
    </div>
  );
});
