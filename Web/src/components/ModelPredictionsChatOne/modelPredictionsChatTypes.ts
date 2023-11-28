export const defaultDeploymentConversationId = 'new_internal';

export interface IChatConvoOne {
  deploymentConversationId: string;
  name: string;
  isNew?: boolean;
}

export interface ConversationInfo {
  createdAt: string;
  deploymentConversationId: string;
  deploymentId: string;
  history: any[];
  name: string;
}
