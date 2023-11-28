import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import NanoScroller from '../NanoScroller/NanoScroller';

import themeStyles from '../antdUseDark.module.css';
import { IChatConvoOne, defaultDeploymentConversationId } from './modelPredictionsChatTypes';

interface IModelPredictionsChatConvosProps {
  convoSelId?: string;
  convoList: IChatConvoOne[];
  onSelectConvo?: (id?: string) => void;
  onNewClick?: () => void;
}

const ModelPredictionsChatConvos = React.memo((props: PropsWithChildren<IModelPredictionsChatConvosProps>) => {
  const conversationList: IChatConvoOne[] = [{ isNew: true, name: `New Chat`, deploymentConversationId: defaultDeploymentConversationId }, ...props.convoList];

  return (
    <div
      className={themeStyles.absolute}
      css={`
        background: #303030;
      `}
    >
      <NanoScroller onlyVertical>
        <div>
          {conversationList.map((conversation) => {
            let isSelected = conversation.deploymentConversationId === props.convoSelId;
            let color1 = isSelected ? '114,160,211' : '233,233,233';

            return (
              <div
                onClick={conversation.isNew ? props.onNewClick : props.onSelectConvo?.bind(null, conversation.deploymentConversationId)}
                key={conversation?.deploymentConversationId}
                css={`
                  ${isSelected ? `background-color: rgba(${color1},0.3); ` : ``} cursor: pointer;
                  &:hover {
                    background-color: rgba(${color1}, 0.1);
                    border-color: rgba(${color1}, 0.4);
                  }
                  margin: 7px 10px 7px 7px;
                  color: white;
                  padding: 8px 12px;
                  display: flex;
                  align-items: center;
                  border: 2px solid rgba(${color1}, ${isSelected ? 0.4 : 0.2});
                  border-radius: 3px;
                `}
                className={themeStyles.ellipsis + ' ' + themeStyles.ellipsisParent}
              >
                <span
                  css={`
                    margin-right: 5px;
                  `}
                >
                  {conversation.isNew && <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlus').faPlus} transform={{ size: 15, x: 0, y: 0 }} style={{ marginRight: '4px' }} />}
                  {!conversation.isNew && <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faComments').faComments} transform={{ size: 15, x: 0, y: 0 }} style={{ marginRight: '4px' }} />}
                </span>
                <span
                  css={`
                    flex: 1;
                  `}
                >
                  {conversation.name}
                </span>
                <span
                  css={`
                    color: rgba(${color1}, 1);
                  `}
                >
                  {isSelected && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCaretLeft').faCaretLeft} transform={{ size: 20, x: 0, y: 0 }} style={{ marginLeft: '6px' }} />}
                </span>
              </div>
            );
          })}
        </div>
      </NanoScroller>
    </div>
  );
});

export default ModelPredictionsChatConvos;
