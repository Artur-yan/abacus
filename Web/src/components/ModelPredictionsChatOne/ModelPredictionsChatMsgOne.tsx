import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from 'antd/lib/button';
import Constants from '../../constants/Constants';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren, useState } from 'react';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import ChatImageCarousel from '../ChatImageCarousel/ChatImageCarousel';
import FormExt from '../FormExt/FormExt';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import TextMaxFixed from '../TextMaxFixed/TextMaxFixed';
import REClient_ from '../../api/REClient';
const styles = require('./ModelPredictionsChatOne.module.css');
const stylesDark = require('../antdUseDark.module.css');

const faThumbsUp = require('@fortawesome/pro-duotone-svg-icons/faThumbsUp').faThumbsUp;
const faThumbsDown = require('@fortawesome/pro-duotone-svg-icons/faThumbsDown').faThumbsDown;
const faSync = require('@fortawesome/pro-duotone-svg-icons/faSync').faSync;
const faCaretRight = require('@fortawesome/pro-solid-svg-icons/faCaretRight').faCaretRight;
const faCaretDown = require('@fortawesome/pro-solid-svg-icons/faCaretDown').faCaretDown;

export interface IChatMsgOne {
  isUser?: boolean;
  role?: 'USER' | 'BOT';
  text?: string;
  isProcessing?: boolean;
  isInternal?: boolean;
  searchResults?: { results: { answer?; context?: any; score?; image_ids?: any[] }[] };
}

enum FeedbackButtonType {
  thumbs_up = 'thumbs_up',
  thumbs_down = 'thumbs_down',
}

interface FeedbackButtonProps {
  onClick: () => void;
  onConfirmPromise: () => Promise<any>;
  feebackType: FeedbackButtonType;
  form: any;
}

const FeedbackButton = React.memo((props: PropsWithChildren<FeedbackButtonProps>) => {
  const title = (
    <div>
      <FormExt form={props.form}>
        <Form.Item name={'feedback'} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Additional Feedback (optional)</span>}>
          <Input.TextArea className={styles.feedbackInput} />
        </Form.Item>
      </FormExt>
    </div>
  );
  return (
    <ModalConfirm onConfirmPromise={props.onConfirmPromise} title={title} okText={'Save'} cancelText={'Cancel'} okType={'primary'} width={600}>
      <span onClick={props.onClick} className={styles.feedbackButtonContainer}>
        <FontAwesomeIcon icon={props.feebackType === FeedbackButtonType.thumbs_up ? faThumbsUp : faThumbsDown} transform={{ size: 12, x: 0, y: 0 }} />
      </span>
    </ModalConfirm>
  );
});

interface IModelPredictionsChatMsgOneProps {
  projectId?: string;
  deploymentId?: string;
  deploymentConversationId?: string;
  feedbackFeatureGroupId?: string;
  value?: IChatMsgOne;
  msgListPrevious?: IChatMsgOne[];
  msgId?: number;
  conversation?: IChatMsgOne[];
  showFeedback?: boolean;
}

const ModelPredictionsChatMsgOne = React.memo((props: PropsWithChildren<IModelPredictionsChatMsgOneProps>) => {
  const [scoresShow, setScoresShow] = useState(false);
  const [form] = Form.useForm();
  const onClickScoresShow = () => {
    setScoresShow((v1) => !v1);
  };

  const textContent = <ReactMarkdown className={styles.markdown} remarkPlugins={[remarkGfm]} children={props.value?.text ?? ''}></ReactMarkdown>;
  const projectId = props.projectId;
  const deploymentId = props.deploymentId;
  const chat = props.conversation;
  const feedbackTableName = 'chat_feedback'; // TODO: Need to update name if this FG already exists

  const filterChat = (chat: IChatMsgOne[]) => {
    // Remove all keys starting with _ (internal keys) in chat.searchResult.results.context
    return chat.map((msg) => {
      if (msg.searchResults) {
        msg.searchResults.results = msg.searchResults.results.map((result) => {
          if (result.context) {
            const contextKeys = Object.keys(result.context).filter((key) => !key?.startsWith?.('_'));
            result.context = contextKeys.reduce((obj, key) => {
              obj[key] = result.context[key];
              return obj;
            }, {});
          }
          return result;
        });
      }
      return msg;
    });
  };

  const saveFeedback = (feedback, msgId, isUseful) => {
    const saveFeedbackHelper = () => {
      REClient_.client_().setDeploymentConversationFeedback(props.deploymentConversationId, msgId, isUseful, !isUseful, feedback, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError('Error while saving feedback. Please try again.');
        } else {
          REActions.addNotification('Feedback saved!');
        }
      });
    };

    return new Promise((resolve) => {
      saveFeedbackHelper();
      resolve(true);
    });
  };

  const onConfirmPromise = (msgId, isUseful) => {
    const payload = { ...(form.getFieldsValue(true) || {}) };
    const feedback = payload?.feedback;
    form.resetFields();

    return new Promise((resolve) => {
      saveFeedback(feedback, msgId, isUseful).then((success) => {
        resolve(success);
      });
    });
  };

  return (
    <div>
      <div
        css={`
          display: flex;
        `}
      >
        <div style={{ width: 'calc(100% - 56px)' }}>
          {props.value?.isProcessing && (
            <span>
              <span
                css={`
                  margin-right: 8px;
                `}
              >
                <FontAwesomeIcon icon={faSync} transform={{ size: 15, x: 0, y: 0 }} spin />
              </span>
              <span>Processing...</span>
            </span>
          )}
          {textContent}
        </div>
        {!props.value?.isProcessing && props?.showFeedback && (
          <div style={{ width: 56, marginLeft: 16 }}>
            <span
              css={`
                display: flex;
                align-items: center;
              `}
            >
              <FeedbackButton form={form} onClick={() => {}} onConfirmPromise={() => onConfirmPromise(props.msgId, true)} feebackType={FeedbackButtonType.thumbs_up} />
              <span style={{ marginLeft: 8 }} />
              <FeedbackButton form={form} onClick={() => {}} onConfirmPromise={() => onConfirmPromise(props.msgId, false)} feebackType={FeedbackButtonType.thumbs_down} />
            </span>
          </div>
        )}
      </div>
      {props.value?.searchResults?.results?.length && (
        <div
          css={`
            margin-top: 8px;
          `}
        >
          <Button
            size={'small'}
            type={'default'}
            ghost
            css={`
              opacity: 0.56;
              font-size: 12px;
              line-height: 1;
            `}
            onClick={onClickScoresShow}
          >
            Scores
            {scoresShow && (
              <FontAwesomeIcon
                css={`
                  margin-left: 4px;
                `}
                icon={faCaretRight}
                transform={{ size: 15, x: 0, y: 0 }}
              />
            )}
            {!scoresShow && (
              <FontAwesomeIcon
                css={`
                  margin-left: 4px;
                `}
                icon={faCaretDown}
                transform={{ size: 15, x: 0, y: 0 }}
              />
            )}
          </Button>
          {scoresShow && (
            <div
              css={`
                font-size: 13px;
                margin: 16px 0 0 8px;
              `}
            >
              {props.value?.searchResults?.results?.map((r1, r1ind) => {
                let context = { ...(r1?.context || {}) };
                Object.entries(context).forEach(([key, value]) => {
                  context[key] = value ?? '-';
                });
                const contextKeys = Object.keys(context).filter((key) => !key?.startsWith?.('_'));
                return (
                  <div className={styles.searchResultContainer} key={`r${r1ind}`}>
                    <div
                      css={`
                        margin: 16px 16px 16px 0;
                        width: 70%;
                        max-width: 700px;
                      `}
                    >
                      <div>
                        <span
                          css={`
                            margin-right: 4px;
                            opacity: 0.7;
                          `}
                        >
                          Score:
                        </span>
                        <span
                          css={`
                            display: inline-block;
                          `}
                        >
                          {Utils.decimals(r1?.score, 5)}
                        </span>
                        <span style={{ display: 'inline-block', marginLeft: 16 }}>
                          <span
                            css={`
                              display: flex;
                              align-items: center;
                            `}
                          >
                            <span
                              css={`
                                display: flex;
                                align-items: center;
                              `}
                            >
                              <FeedbackButton form={form} onConfirmPromise={() => onConfirmPromise(props.msgId, true)} onClick={() => {}} feebackType={FeedbackButtonType.thumbs_up} />
                              <span style={{ marginLeft: 8 }} />
                              <FeedbackButton form={form} onConfirmPromise={() => onConfirmPromise(props.msgId, false)} onClick={() => {}} feebackType={FeedbackButtonType.thumbs_down} />
                            </span>
                          </span>
                        </span>
                      </div>
                      <div>
                        <span
                          css={`
                            margin-right: 4px;
                            opacity: 0.7;
                          `}
                        >
                          Context:
                        </span>
                        <span
                          css={`
                            margin-left: 6px;
                            padding-left: 6px;
                            white-space: normal !important;
                          `}
                        >
                          {contextKeys?.map((contextKey, keyIndex) => {
                            return (
                              <div style={{ marginLeft: 16 }} key={`context-${keyIndex}-${r1ind}`}>
                                <span
                                  css={`
                                    margin-right: 4px;
                                    opacity: 0.7;
                                  `}
                                >
                                  {contextKey}:
                                </span>
                                <span
                                  css={`
                                    white-space: normal;
                                  `}
                                >
                                  {context[contextKey]},
                                </span>
                              </div>
                            );
                          })}
                        </span>
                      </div>
                      <div
                        css={`
                          margin-bottom: 4px;
                        `}
                      >
                        <pre className={styles.answerContainer}>
                          Answer:{' '}
                          <TextMaxFixed max={34} doLess doMore style={{ color: 'white' }}>
                            {r1?.answer}
                          </TextMaxFixed>
                        </pre>
                      </div>
                    </div>
                    {r1?.image_ids && r1?.context?._bounding_boxes ? (
                      <div
                        css={`
                          width: 256px;
                          margin: 8px 4px;
                        `}
                      >
                        <ChatImageCarousel docIds={r1?.image_ids} boundingBoxes={r1?.context?._bounding_boxes} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ModelPredictionsChatMsgOne;
