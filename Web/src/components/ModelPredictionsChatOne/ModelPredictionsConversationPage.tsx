import React, { memo } from 'react';

import { useAppSelector } from '../../../core/hooks';

import { ModelPredictionsConversationListPage } from './ModelPredictionsConversationListPage';
import { ModelPredictionsSelectedConversationPage } from './ModelPredictionsSelectedConversationPage';
import { useProject } from '../../api/REUses';
import ModelPredictionsChatOne from './ModelPredictionsChatOne';

export const ModelPredictionConversationPage = memo(function ModelPredictionConversationPage() {
  const sharedDeploymentConversationId = useAppSelector((state) => state.paramsProp?.get('share'));
  const projectId = useAppSelector((state) => state.paramsProp?.get('projectId'));
  const currentProject = useProject(projectId === '-' ? null : projectId);

  if (currentProject?.useCase === 'AI_AGENT') {
    return <ModelPredictionsChatOne />;
  }

  return sharedDeploymentConversationId != null ? <ModelPredictionsSelectedConversationPage /> : <ModelPredictionsConversationListPage />;
});
