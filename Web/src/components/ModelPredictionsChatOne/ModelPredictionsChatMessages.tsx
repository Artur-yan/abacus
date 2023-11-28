import * as React from 'react';
import { Button } from 'antd';
import { useSelector } from 'react-redux';
import { PropsWithChildren, useCallback, useMemo } from 'react';

import Avatar from '@mui/material/Avatar';

import UtilsWeb from '../../../core/UtilsWeb';
import Utils, { calcImgSrc } from '../../../core/Utils';
import { IUserAuth } from '../../stores/actions/StoreActions';
import ModelPredictionsChatMsgOne, { IChatMsgOne } from './ModelPredictionsChatMsgOne';
import ModelPredictionsChatMsgWrite from './ModelPredictionsChatMsgWrite';
import REActions from '../../actions/REActions';
import PartsLink from '../NavLeft/PartsLink';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TooltipExt from '../TooltipExt/TooltipExt';
import { ConversationInfo, defaultDeploymentConversationId } from './modelPredictionsChatTypes';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import Constants from '../../constants/Constants';
import styles from './ModelPredictionsChatMessages.module.css';
const s = require('./ModelPredictionsChatOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IMsgOneParentProps {
  value?: IChatMsgOne;
  isNew?: boolean;
}

const MsgOneParent = React.memo((props: PropsWithChildren<IMsgOneParentProps>) => {
  const { value, isNew, children } = props;
  const { authUser } = useSelector((state: any) => ({
    authUser: state.authUser,
  }));

  const isUser = value?.role === 'USER' || value?.isUser || isNew;

  const avatarUser = useMemo(() => {
    const avatarSize = 36;

    let actualUser: IUserAuth = {};
    if (authUser) {
      if (authUser.get('data')) {
        actualUser = authUser.get('data').toJS();
      }
    }

    let actualUserSrc = calcImgSrc('/imgs/person2.jpg');
    if (actualUser?.picture) {
      actualUserSrc = calcImgSrc(actualUser.picture);
    }

    let userName = actualUser?.name;
    let initials = Utils.initials(userName) || null;

    return (
      <Avatar
        src={actualUserSrc}
        style={{
          margin: '0 auto 10px auto',
          width: avatarSize,
          height: avatarSize,
          backgroundColor: '#ffffff',
          fontSize: '14px',
        }}
        imgProps={{
          onError: () => {},
        }}
      >
        {initials}
      </Avatar>
    );
  }, [authUser]);

  const avatarBot = useMemo(() => {
    const ww = 34;
    return (
      <img
        css={`
          width: ${ww}px;
          height: ${ww}px;
        `}
        src={calcImgSrc('/static/imgs/reAlone80.png')}
        alt={''}
      />
    );
  }, []);

  const avatar1 = useMemo(() => {
    return isUser ? avatarUser : avatarBot;
  }, [isUser, avatarBot, avatarUser]);

  return (
    <div
      css={`
        border-bottom: 1px solid rgba(0, 0, 0, 0.4);
        padding: 34px;
        display: flex;
        justify-content: center;
        font-size: 15px;
        ${isUser ? `background-color: rgba(0,0,0,0.2); ` : ''}
      `}
    >
      <div
        css={`
          width: 90%;
          max-width: 900px;
          display: flex;
          align-items: flex-start;
        `}
      >
        <span
          css={`
            margin-right: 18px;
          `}
        >
          {avatar1}
        </span>
        <span
          css={`
            margin-top: 5px;
            flex: 1;
          `}
        >
          {children}
        </span>
      </div>
    </div>
  );
});

interface IDownloadConversationProps {
  deploymentConversationId?: string;
  history?: any[];
}

const DownloadConversation = React.memo((props: PropsWithChildren<IDownloadConversationProps>) => {
  const { deploymentConversationId, history } = props;

  const onClickDownload = () => {
    if (deploymentConversationId) {
      try {
        const htmlExplanation = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Conversation History</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                h1, h4 {
                    color: #333;
                    text-align: center;
                }
                .message-container {
                    display: flex;
                    align-items: baseline;
                    margin-bottom: .1rem;
                }
                .role {
                    font-weight: bold;
                    margin-right: 10px;
                    white-space: nowrap;
                    margin-left: 15px;
                }
                .message {
                    flex-grow: 1;
                    word-break: break-word;
                    margin-right: 15px;
                }
            </style>
        </head>
        <body>
            <h1>Conversation History</h1>
            ${history
              ?.map(
                (message, index) => `
                <div class="message-container">
                    <h4 class="role">${message?.role === 'BOT' ? 'Abacus AI Chat' : 'User'}:</h4>
                    <p class="message">${message?.text}</p>
                </div>
            `,
              )
              .join('')}
        </body>
        </html>             
        `;
        Utils.htmlStringToPdf(htmlExplanation, 'conversation_history');
      } catch (error) {
        REActions.addNotificationError(error?.message || Constants.errorDefault);
      }
    }
  };

  return (
    <div>
      <TooltipExt title={'Download'}>
        <DownloadOutlined className={styles.blueIcon} onClick={onClickDownload} />
      </TooltipExt>
    </div>
  );
});

interface IModelPredictionsChatMessagesProps {
  projectId?: string;
  deploymentId?: string;
  feedbackFeatureGroupId?: string;
  conversation?: ConversationInfo;
  isProcessing?: boolean;
  hideMsgWrite?: boolean;
  deploymentConversationId?: string;
  onChange?: (value?: IChatMsgOne[]) => void;
  onSubmitMessage?: (msg: string, deploymentConversationId?: string) => void;
}

const ModelPredictionsChatMessages = React.memo((props: PropsWithChildren<IModelPredictionsChatMessagesProps>) => {
  const { conversation, projectId, deploymentId, feedbackFeatureGroupId, isProcessing, onSubmitMessage, hideMsgWrite, deploymentConversationId } = props;

  const onSubmitMessageHandler = useCallback(
    (msg?: string) => {
      onSubmitMessage?.(msg, deploymentConversationId);
    },
    [onSubmitMessage],
  );

  const onClickCopy = () => {
    const origin = window.location.origin;
    UtilsWeb.copyToClipboard(`${origin}/app/${PartsLink.model_predictions}/${projectId}/${deploymentId}?share=${deploymentConversationId}`);
    REActions.addNotification('Copied to clipboard!');
  };

  return (
    <div>
      {deploymentConversationId && !hideMsgWrite ? (
        <div
          css={`
            position: sticky;
            top: 10px;
            display: flex;
            justify-content: end;
            padding-right: 10px;
            height: 0;
          `}
        >
          <TooltipExt title={'Share'} placement="leftTop">
            <Button size={'middle'} type={'primary'} onClick={onClickCopy} className={s.shareBtn}>
              <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faShareNodes').faShareNodes} transform={{ size: 20, x: 0, y: 0 }} />
            </Button>
          </TooltipExt>
          <DownloadConversation history={conversation?.history} deploymentConversationId={deploymentConversationId} />
        </div>
      ) : null}
      {conversation?.history?.map((message, index) => {
        const isBot = message?.role === 'BOT' || message?.isUser === false;
        let msgList = null;
        if (isBot) {
          msgList = conversation.history.slice(0, index);
        }
        return (
          <MsgOneParent key={`message-${index}`} value={message}>
            <ModelPredictionsChatMsgOne
              showFeedback={isBot}
              value={message}
              msgListPrevious={msgList}
              conversation={conversation.history}
              projectId={projectId}
              deploymentId={deploymentId}
              deploymentConversationId={deploymentConversationId}
              feedbackFeatureGroupId={feedbackFeatureGroupId}
              msgId={index}
            />
          </MsgOneParent>
        );
      })}
      {!isProcessing && !hideMsgWrite && (
        <MsgOneParent key={'new_msg'} isNew>
          <ModelPredictionsChatMsgWrite onSubmitMessage={onSubmitMessageHandler} />
        </MsgOneParent>
      )}
    </div>
  );
});

export default ModelPredictionsChatMessages;
