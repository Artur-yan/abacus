import CloseOutlined from '@ant-design/icons/CloseOutlined';
import CopyOutlined from '@ant-design/icons/CopyOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import SendOutlined from '@ant-design/icons/SendOutlined';
import LikeOutlined from '@ant-design/icons/LikeOutlined';
import DislikeOutlined from '@ant-design/icons/DislikeOutlined';
import LikeFilled from '@ant-design/icons/LikeFilled';
import DislikeFilled from '@ant-design/icons/DislikeFilled';
import Modal from 'antd/lib/modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Avatar from '@mui/material/Avatar';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import * as moment from 'moment';
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import remarkGfm from 'remark-gfm';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions, { IUserAuth } from '../../stores/actions/StoreActions';
import chat from '../../stores/reducers/chat';
import DateOld from '../DateOld/DateOld';
import EditorElem from '../EditorElem/EditorElem';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import DockModal from './DockModal';
import { ViewportList } from 'react-viewport-list';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import { faCaretRight } from '@fortawesome/pro-solid-svg-icons/faCaretRight';
import { faCaretDown } from '@fortawesome/pro-solid-svg-icons/faCaretDown';
import { faStop } from '@fortawesome/pro-solid-svg-icons/faStop';
import { faBug } from '@fortawesome/pro-solid-svg-icons/faBug';
import { faNotebook } from '@fortawesome/pro-solid-svg-icons/faNotebook';
import s from './ChatDockModal.module.css';
import sd from './antdUseDark.module.css';
import TooltipExt from '../TooltipExt/TooltipExt';
const { success, error, info } = Modal;

interface IChatDockModalProps {}

const examples = ['What are some problems with the data in this Feature Group?', 'Train a model on my data', "Write python function to generate 'n' random integers"];

const ChatDockModal = React.memo((props: PropsWithChildren<IChatDockModalProps>) => {
  const { chatParam, paramsProp } = useSelector((state: any) => ({
    chatParam: state.chat,
    paramsProp: state.paramsProp,
  }));

  const [type, setType] = useState('dock');
  const [message, setMessage] = useState('');
  const [isRefresh, setIsRefresh] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [validChatIndex, setValidChatIndex] = useState(0);
  const listRef = useRef(null);
  const scrollRef = useRef(null);
  const confirmUsed = useRef(null);
  const prevScrollPosition = useRef(null);
  const disableScroll = useRef(false);
  const requestIdValue = useRef(null);

  const projectId = paramsProp?.get('projectId');

  useEffect(() => {
    requestIdValue.current = requestId;
  }, [requestId]);

  useEffect(() => {
    return () => {
      if (requestIdValue.current) {
        REClient_.client_().cancelAIChatSendMessageRequest(requestIdValue.current, (err, res) => {});
      }

      if (listRef.current != null) {
        listRef.current.destroy();
        listRef.current = null;
      }
      if (scrollRef.current != null) {
        scrollRef.current.destroy();
        scrollRef.current = null;
      }
      if (confirmUsed.current != null) {
        confirmUsed.current.destroy();
        confirmUsed.current = null;
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [type]);

  const chatProjectId = useMemo(() => {
    return chat.calcChatProjectId();
  }, [chatParam]);

  const showChat = useMemo(() => {
    return chat.calcShowChat();
  }, [chatParam]);

  const chatSessionId = useMemo(() => {
    return chat.calcChatSessionId(chatProjectId);
  }, [chatParam, chatProjectId]);

  const chatHistory = useMemo(() => {
    return chat.calcChatHistory(chatSessionId);
  }, [chatParam, chatSessionId]);

  const chatProjects = useMemo(() => {
    return chat.calcChatProjects() ?? [];
  }, [chatParam]);

  useEffect(() => {
    if (!requestId) {
      const queryChatHistory = (chatHistory ?? []).filter((item) => !!item.timestamp);
      setValidChatIndex(queryChatHistory.length);
    }
  }, [chatHistory, requestId]);

  useEffect(() => {
    if (chatProjectId && !chatSessionId && !chat.calcChatRefresh()) {
      StoreActions.updateIsChatRefresh(true);
      REClient_.client_().createChatSession(chatProjectId, (err, res) => {
        StoreActions.updateIsChatRefresh(false);
        if (err || !res || !res.result) {
        } else {
          const retChatHistory = res.result?.chatHistory ?? [];
          const chatSessionId = res.result?.chatSessionId;
          if (chatSessionId) {
            StoreActions.updateChatSessionId(chatSessionId, chatProjectId);
            StoreActions.updateChatHistory(retChatHistory, chatSessionId);
          }
        }
      });
    }
  }, [chatProjectId, chatSessionId]);

  useEffect(() => {
    if (isRefresh) return;

    if (chatProjectId !== projectId && chatSessionId && !chatHistory) {
      setIsRefresh(true);

      REClient_.client_().getChatSession(chatSessionId, (err, res) => {
        setIsRefresh(false);

        if (err || !res || !res.result) {
        } else {
          const retChatHistory = res.result?.chatHistory ?? [];
          StoreActions.updateChatHistory(retChatHistory, chatSessionId);

          scrollToBottom();
        }
      });
    }
  }, [chatProjectId, projectId, chatSessionId, chatHistory, isRefresh]);

  const onChangeType = (type) => {
    setType(type);
  };

  const onCopyCode = (code) => {
    if (!Utils.isNullOrEmpty(code)) {
      UtilsWeb.copyToClipboard(code);
      REActions.addNotification('Copied to clipboard!');
    }
  };

  const contentWidth = useMemo(() => {
    return type === 'dock' ? '100%' : '70%';
  }, [type]);

  const { authUser } = useSelector((state: any) => ({
    authUser: state.authUser,
  }));

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
          margin: 0,
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

  const avatarBot = useCallback((ww) => {
    return (
      <img
        css={`
          width: ${ww}px;
          height: ${ww}px;
        `}
        src={calcImgSrc('/static/imgs/aiChatRobot.png')}
        alt={''}
      />
    );
  }, []);

  const loadingMessage = {
    role: 'BOT',
    text: [],
    error: 'loading',
  };

  const errorMessage = {
    role: 'BOT',
    text: [],
    error: 'error',
  };

  const stoppedMessage = {
    role: 'BOT',
    text: [],
    error: 'stopped',
  };

  const onSendMessage = async () => {
    await sendMessage(message);
  };

  const sendMessage = async (chatMessage) => {
    if (isRefresh || !chatSessionId || !chatMessage?.trim?.()) return;

    if (!chat.calcValidChatSession(chatSessionId)) {
      StoreActions.updateValidChatSession(true, chatSessionId);
    }

    const queryChatHistory = (chatHistory ?? []).filter((item) => !!item.timestamp);

    const currentMessage = {
      role: 'USER',
      text: [
        {
          segment: chatMessage,
          type: 'text',
        },
      ],
    };

    const handleError = (error) => {
      setIsRefresh(false);
      setRequestId(null);
      REActions.addNotificationError(error?.message || Constants.errorDefault);
      StoreActions.updateChatHistory([...queryChatHistory, currentMessage, errorMessage], chatSessionId);

      scrollToBottom();
    };

    StoreActions.updateChatHistory([...queryChatHistory, currentMessage, loadingMessage], chatSessionId);

    scrollToBottom();

    setMessage('');
    setIsRefresh(true);
    let requestId;

    try {
      const url = window.location.href;
      const createRequest = await REClient_.promises_().createAIChatSendMessageRequest(chatSessionId, chatMessage, url);
      if (!createRequest?.success || createRequest?.error) {
        throw new Error(createRequest?.error);
      }
      requestId = createRequest?.requestId;
      setRequestId(requestId);
    } catch (error) {
      handleError(error);
      return;
    }

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    let status = null;

    setTimeout(() => {
      disableScroll.current = false;
      prevScrollPosition.current = null;
    }, 1000);

    while (status !== 'COMPLETED' && status !== 'CANCELED') {
      await delay(100);
      try {
        const currentState = await REClient_.promises_().getAIChatSendMessageRequestStatus(requestId);
        if (!currentState?.success || currentState?.error) {
          throw new Error(currentState?.error);
        }
        if (currentState?.result === null) continue;
        status = currentState?.result?.status;
        const answer = currentState.result?.answer;
        const retChatHistory = currentState.result?.chatHistory ?? [];
        if (answer) {
          const orgChatHistory = chat.calcChatHistory(chatSessionId) ?? [];
          retChatHistory.forEach((history, index) => {
            if (history.role === orgChatHistory[index]?.role && history.timestamp === orgChatHistory[index]?.timestamp && typeof orgChatHistory[index]?.isUseful === 'boolean') {
              retChatHistory[index].isUseful = orgChatHistory[index]?.isUseful;
              retChatHistory[index].feedback = orgChatHistory[index]?.feedback;
            }
            history.text?.forEach((text, subIndex) => {
              const orgText = orgChatHistory[index]?.text?.[subIndex];
              if (text.subType && orgText?.subType && text.subType === orgText?.subType && text.type === 'code' && orgText?.type === 'code' && orgText?.isOpen !== undefined) {
                retChatHistory[index].text[subIndex].isOpen = orgText?.isOpen;
              }
            });
          });
          StoreActions.updateChatHistory(retChatHistory, chatSessionId);

          scrollToBottom();
        }
      } catch (error) {
        handleError(error);
        return;
      }
    }

    const updatedChatHistory = [...(chat.calcChatHistory(chatSessionId) ?? [])];
    const lastItem = updatedChatHistory[updatedChatHistory.length - 1];
    if (status === 'CANCELED' && lastItem === loadingMessage) {
      updatedChatHistory.splice(updatedChatHistory.length - 1, 1, stoppedMessage);
      StoreActions.updateChatHistory(updatedChatHistory, chatSessionId);

      scrollToBottom();
    } else if (status === 'COMPLETED' || status === 'CANCELED') {
      setValidChatIndex(updatedChatHistory.length);
    }

    setIsRefresh(false);
    setRequestId(null);
  };

  const onMessageKeyDown = async (e) => {
    if (e.key?.toLowerCase() === 'enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        await onSendMessage();
      }
    }
  };

  const onChangeMessage = (e) => {
    setMessage(e.target.value);
  };

  const onDeleteHistory = () => {
    if (!chatProjectId) return;

    if (isRefresh) {
      REActions.addNotificationError('Cannot delete the chat history in processing.');
      return;
    }

    REClient_.client_()._hideChatSession(chatSessionId, (err, res) => {
      if (res?.success) {
        StoreActions.updateChatHistory(null, chatSessionId);
        StoreActions.updateChatSessionId(null, chatProjectId);
      }
    });
  };

  const _exportAiChatToNotebook = async (messageIndex, segmentIndex) => {
    try {
      const response = await REClient_.promises_()._exportAiChatToNotebook(chatSessionId, messageIndex, segmentIndex);
      if (!response?.success || response?.error || !response?.result?.notebookId) {
        throw new Error(response?.error);
      }
      window.open(`/app/${PartsLink.fast_notebook}/${projectId || '-'}/${response?.result?.notebookId}?selectedNbFile=AI Chat ${messageIndex}-${segmentIndex}.ipynb`, '_blank');
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
    }
  };

  const onRegenerateResponse = () => {
    const failedChat = (chatHistory ?? []).find((item) => !item.timestamp && item.role?.toUpperCase() === 'USER');
    if (failedChat && failedChat?.text?.[0]?.segment) {
      sendMessage(failedChat?.text?.[0]?.segment);
    }
  };

  const scrollToBottom = () => {
    if (disableScroll.current) return;

    setTimeout(() => {
      const curChatHistory = chat.calcChatHistory(chatSessionId) ?? [];
      if (curChatHistory.length === 0) return;

      listRef.current?.scrollToIndex({
        index: curChatHistory.length - 1,
        offset: 10000,
      });
    }, 0);
  };

  const getCodeHeight = (code, maxWidth) => {
    const codeLines = code?.split('\n') ?? [];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '12px Menlo, Monaco, "Courier New", monospace';
    const lineLen = codeLines.reduce((acc, cur, index) => {
      if (cur === '') {
        return acc + 1;
      }

      const words = cur.split(' ');
      let currentWidth = 0;
      let resultLineCount = 0;
      for (const word of words) {
        const wordLength = context.measureText(word + ' ').width;
        if (currentWidth + wordLength < maxWidth) {
          currentWidth += wordLength;
          if (resultLineCount === 0) {
            resultLineCount++;
          }
        } else {
          resultLineCount++;

          if (wordLength < maxWidth) {
            currentWidth = wordLength;
          } else {
            resultLineCount += Math.floor(wordLength / maxWidth);
            currentWidth = wordLength % maxWidth;
          }
        }
      }

      return acc + resultLineCount;
    }, 0);

    canvas.remove();

    return lineLen * 18;
  };

  const onProjectChat = (activeProjectId) => {
    if (chatProjectId !== activeProjectId) {
      if (isRefresh) {
        REActions.addNotificationError('Please wait for chat to complete before switching projects.');
        return;
      }
      StoreActions.updateChatProjectId(activeProjectId);
      if (projectId) {
        Location.push('/' + PartsLink.project_dashboard + '/' + activeProjectId);
      }
    }

    scrollToBottom();
  };

  const onDeleteChatProject = (e, delProjectId) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    if (chatProjectId === delProjectId) {
      if (isRefresh) {
        REActions.addNotificationError('Cannot delete this project in processing.');
      } else {
        onDeleteHistory();
      }
      return;
    }

    const delChatSessionId = chat.calcChatSessionId(delProjectId);
    REClient_.client_()._hideChatSession(delChatSessionId, (err, res) => {
      if (res?.success) {
        StoreActions.updateChatHistory(null, delChatSessionId);
        StoreActions.deleteChatProjectId(delProjectId);
      }
    });
  };

  const onViewSubItems = (index, subIndex) => {
    const history = [...(chatHistory ?? [])];
    if (history?.length > index && history[index]?.text?.length > subIndex) {
      history[index].text[subIndex].isOpen = !history[index].text[subIndex].isOpen;
      StoreActions.updateChatHistory(history, chatSessionId);
    }
  };

  const onStopGenerating = async () => {
    if (!requestId) return;

    setIsStopping(true);
    try {
      const state = await REClient_.promises_().cancelAIChatSendMessageRequest(requestId);
      if (state?.result?.status === 'CANCELED') {
        setRequestId(null);
      }
    } catch (error) {}

    setIsStopping(false);
  };

  const onClickFeedback = (messageIndex, isUseful) => {
    if (confirmUsed.current != null) {
      confirmUsed.current.destroy();
      confirmUsed.current = null;
    }

    let feedback = '';
    const modalMethod = isUseful ? success : error;

    confirmUsed.current = modalMethod({
      title: 'Provide additional feedback',
      okText: 'Submit feedback',
      icon: isUseful ? <LikeOutlined /> : <DislikeOutlined />,
      okType: 'primary',
      width: 600,
      closable: true,
      content: (
        <Input.TextArea
          placeholder={isUseful ? 'What do you like about the response?' : 'What was the issue with the response?'}
          rows={5}
          style={{ fontSize: '15px' }}
          defaultValue={''}
          onChange={(e) => {
            feedback = e.target.value;
          }}
        />
      ),
      onOk: () => {
        REClient_.client_()._setChatMessageFeedback(chatSessionId, messageIndex, 0, isUseful, feedback, (err, res) => {
          if (res?.success && chatHistory?.length > messageIndex) {
            const updatedHistory = [...(chatHistory ?? [])];
            updatedHistory[messageIndex].isUseful = isUseful;
            updatedHistory[messageIndex].feedback = feedback;
            StoreActions.updateChatHistory(updatedHistory, chatSessionId);
          }
        });
      },
    });
  };

  const onClickSystemPrompt = (systemPrompt) => {
    if (confirmUsed.current != null) {
      confirmUsed.current.destroy();
      confirmUsed.current = null;
    }

    confirmUsed.current = info({
      title: 'System Prompt',
      width: 800,
      closable: true,
      content: (
        <div css={'max-height: 500px; overflow: auto; border: 1px solid grey; padding 10px;'}>
          <ReactMarkdown className={s.markdown} remarkPlugins={[remarkGfm]} children={systemPrompt ?? ''} />
        </div>
      ),
      onOk: () => {},
    });
  };

  const onChatScroll = (e) => {
    const scrollPos = listRef.current?.getScrollPosition();
    if (scrollPos?.offset < -20) {
      prevScrollPosition.current = null;
      return;
    }

    if (requestId) {
      if (scrollPos?.index === prevScrollPosition.current?.index) {
        if (scrollPos?.offset < prevScrollPosition.current?.offset - 100) {
          disableScroll.current = true;
        }
      } else if (scrollPos?.index < prevScrollPosition.current?.index) {
        disableScroll.current = true;
      }
    } else {
      disableScroll.current = false;
    }

    prevScrollPosition.current = scrollPos;
  };

  return (
    <DockModal
      headerIcon={avatarBot(24)}
      headerName="AI Chat"
      helpTextId="abacus_ai_chat"
      visible={showChat}
      onVisible={(show) => {
        StoreActions.updateShowChat(show);
      }}
      onChangeType={onChangeType}
    >
      <div
        css={`
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        `}
      >
        <AutoSizer>
          {({ height, width }) => {
            const codeWidth = (type === 'dock' ? width : width * 0.7) - 165;
            return (
              <div
                css={`
                  display: flex;
                  flex-direction: column;
                  width: ${width}px;
                  height: ${height}px;
                `}
              >
                {chatProjects?.length > 0 && (
                  <div css={'display: flex; gap: 10px; padding: 10px; flex-wrap: wrap; border-bottom: 1px solid #a0a0a0;'}>
                    {chatProjects?.map((item) => {
                      return (
                        <div
                          className={s.projectBtn}
                          css={`
                            color: ${item.id === chatProjectId ? '#E050A0' : '#FFFFFF'};
                            background: ${item.id === chatProjectId ? '#58DFC1' : '#38BFA1'};
                          `}
                          key={item.id}
                          onClick={() => {
                            onProjectChat(item.id);
                          }}
                        >
                          {item.name}
                          {item.id !== chatProjectId && (
                            <ModalConfirm
                              onConfirm={(e) => {
                                onDeleteChatProject(e, item.id);
                              }}
                              title={`Do you want to delete this chat?`}
                              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                              okText={'Delete'}
                              cancelText={'Cancel'}
                              okType={'danger'}
                            >
                              <CloseOutlined />
                            </ModalConfirm>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div
                  css={`
                    flex: 1;
                    padding: 10px;
                    overflow: auto;
                    position: relative;
                  `}
                  onScroll={onChatScroll}
                  ref={scrollRef}
                >
                  {chatHistory?.length > 0 && (
                    <div
                      css={`
                        position: sticky;
                        float: right;
                        top: 5px;
                        right: 5px;
                        z-index: 10;
                      `}
                    >
                      {
                        <ModalConfirm onConfirm={onDeleteHistory} title={`Do you want to delete the chat history?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>
                          <TooltipExt title="Delete history">
                            <Button type="default" ghost icon={<DeleteOutlined />} size="middle" style={{ backgroundColor: '#6D8192', borderColor: '#6D8192', opacity: 0.8 }} />
                          </TooltipExt>
                        </ModalConfirm>
                      }
                    </div>
                  )}
                  {chatHistory?.length > 0 ? (
                    <ViewportList ref={listRef} viewportRef={scrollRef} items={chatHistory}>
                      {(history: any, index) => {
                        const preDate = index > 0 ? moment(chatHistory[index - 1].timestamp) : null;
                        const curDate = moment(history.timestamp);
                        const preDateStr = preDate?.format('YYYY-MM-DD');
                        const curDateStr = curDate.format('YYYY-MM-DD');
                        const preTimeStr = preDate?.format('hh:mm A');
                        const curTimeStr = curDate.format('hh:mm A');
                        const minDiff = preDate ? curDate.diff(preDate, 'minutes') : 100;

                        return (
                          <div
                            css={`
                              display: flex;
                              flex-direction: column;
                              margin: 10px;
                              align-items: center;
                            `}
                            key={`${preDateStr}-${preTimeStr}-${curDateStr}-${curTimeStr}-${index}`}
                          >
                            {history.timestamp && (preDateStr !== curDateStr || preTimeStr !== curTimeStr) && minDiff > 30 && (
                              <div css={'color: #AFC7D8; font-size: 16px;'}>{preDateStr === curDateStr ? curTimeStr : <DateOld date={moment.utc(history.timestamp).toDate()} />}</div>
                            )}
                            <div
                              css={`
                                display: flex;
                                gap: 10px;
                                width: ${contentWidth};
                                margin-bottom: 10px;
                              `}
                            >
                              {history.role?.toUpperCase() === 'USER' ? avatarUser : history.role?.toUpperCase() === 'BOT' ? avatarBot(36) : <div css={'width: 36px;'}></div>}
                              <div
                                css={`
                                  flex: 1;
                                  margin-top: 10px;
                                `}
                              >
                                {!history.error ? (
                                  <div
                                    css={`
                                      margin-right: ${index === 0 ? -20 : 0}px;
                                    `}
                                  >
                                    <div css={'float: right; display: flex;'}>
                                      {calcAuthUserIsLoggedIn()?.isInternal && history.systemPrompt && (
                                        <div className={s.codeActions} css={'padding: 5px; font-size: 16px;'}>
                                          <div className={s.codeActionItem}>
                                            <FontAwesomeIcon
                                              icon={faBug}
                                              transform={{ size: 15, x: 0, y: 0 }}
                                              onClick={() => {
                                                onClickSystemPrompt(history.systemPrompt);
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      {index < validChatIndex &&
                                        history.role?.toUpperCase() === 'BOT' &&
                                        (history.isUseful === true ? (
                                          <div className={s.codeActions} css={'padding: 5px; font-size: 16px;'}>
                                            <div className={s.codeActionItem}>
                                              <LikeFilled onClick={() => {}} />
                                            </div>
                                          </div>
                                        ) : history.isUseful === false ? (
                                          <div className={s.codeActions} css={'padding: 5px; font-size: 16px;'}>
                                            <div className={s.codeActionItem}>
                                              <DislikeFilled onClick={() => {}} />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className={s.codeActions} css={'padding: 5px; font-size: 16px;'}>
                                            <div className={s.codeActionItem}>
                                              <LikeOutlined
                                                onClick={() => {
                                                  onClickFeedback(index, true);
                                                }}
                                              />
                                            </div>
                                            <div className={s.codeActionItem}>
                                              <DislikeOutlined
                                                onClick={() => {
                                                  onClickFeedback(index, false);
                                                }}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                    {history.text?.map((item, subIndex) => {
                                      return item.type === 'code' ? (
                                        item.subType ? (
                                          <div css={'margin-top: 10px;'} key={item.segment}>
                                            <Button
                                              size={'small'}
                                              type={'default'}
                                              ghost
                                              css={`
                                                opacity: 0.56;
                                                font-size: 12px;
                                                line-height: 1;
                                              `}
                                              onClick={() => {
                                                onViewSubItems(index, subIndex);
                                              }}
                                            >
                                              {item.subType === 'execution_request' ? 'Code' : 'Output'}
                                              <FontAwesomeIcon
                                                css={`
                                                  margin-left: 4px;
                                                `}
                                                icon={history.isOpen ? faCaretRight : faCaretDown}
                                                transform={{ size: 15, x: 0, y: 0 }}
                                              />
                                            </Button>
                                            {item.isOpen && (
                                              <div css={'margin: 10px 0;'}>
                                                <div
                                                  css={`
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: space-between;
                                                    height: 30px;
                                                    background: #343440;
                                                    padding: 0 10px;
                                                  `}
                                                >
                                                  <span>{(item.language ?? '').toUpperCase()}</span>
                                                  <div className={s.codeActions}>
                                                    <div className={s.codeActionItem}>
                                                      <CopyOutlined
                                                        onClick={() => {
                                                          onCopyCode(item.segment);
                                                        }}
                                                      />
                                                      <span
                                                        onClick={() => {
                                                          onCopyCode(item.segment);
                                                        }}
                                                      >
                                                        {item.subType === 'execution_request' ? 'Copy code' : 'Copy'}
                                                      </span>
                                                    </div>
                                                    {item?.language === 'python' && (
                                                      <div className={s.codeActionItem} onClick={() => _exportAiChatToNotebook(index, subIndex)}>
                                                        <FontAwesomeIcon icon={faNotebook} />
                                                        <span>Open in Notebook</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                <EditorElem
                                                  enableHandleMouseWheel={false}
                                                  lineNumbers={true}
                                                  lang={item.language ?? ''}
                                                  hideExpandFull
                                                  validateOnCall
                                                  readonly={true}
                                                  value={item.segment}
                                                  verticalScroll="hidden"
                                                  lineHeight={18}
                                                  height={getCodeHeight(item.segment, codeWidth)}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div css={'margin: 10px 0;'} key={item.segment}>
                                            <div
                                              css={`
                                                display: flex;
                                                align-items: center;
                                                justify-content: space-between;
                                                height: 30px;
                                                background: #343440;
                                                padding: 0 10px;
                                              `}
                                            >
                                              <span>{(item.language ?? '').toUpperCase()}</span>
                                              <div className={s.codeActions}>
                                                <div className={s.codeActionItem}>
                                                  <CopyOutlined
                                                    onClick={() => {
                                                      onCopyCode(item.segment);
                                                    }}
                                                  />
                                                  <span
                                                    onClick={() => {
                                                      onCopyCode(item.segment);
                                                    }}
                                                  >
                                                    Copy code
                                                  </span>
                                                </div>
                                                {item?.language === 'python' && (
                                                  <div className={s.codeActionItem} onClick={() => _exportAiChatToNotebook(index, subIndex)}>
                                                    <FontAwesomeIcon icon={faNotebook} />
                                                    <span>Open in Notebook</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            <EditorElem
                                              enableHandleMouseWheel={false}
                                              lineNumbers={true}
                                              lang={item.language ?? ''}
                                              hideExpandFull
                                              validateOnCall
                                              readonly={true}
                                              value={item.segment}
                                              verticalScroll="hidden"
                                              lineHeight={18}
                                              height={getCodeHeight(item.segment, codeWidth)}
                                            />
                                          </div>
                                        )
                                      ) : item.type === 'html' ? (
                                        <div key={item.segment}>
                                          <iframe
                                            srcDoc={item.segment}
                                            css={`
                                              width: 100%;
                                              height: 500px;
                                              border: none;
                                            `}
                                          />
                                        </div>
                                      ) : (
                                        <ReactMarkdown className={s.markdown} key={item.segment} remarkPlugins={[remarkGfm]} children={item.segment ?? ''} />
                                      );
                                    })}
                                  </div>
                                ) : history.error === 'loading' ? (
                                  <div>
                                    <div css={'font-size: 15px;'}>May take up to 60 seconds</div>
                                    <div css={'margin: 20px;'} className={s.dotFlashing} />
                                  </div>
                                ) : (
                                  <div>
                                    <div>
                                      <span css={'padding: 3px 5px; border-radius: 3px; background: #AA2200;'}>{history.error}</span>
                                    </div>
                                    <Button type="primary" style={{ margin: '10px', backgroundColor: '#38BEA0', borderColor: '#38BEA0' }} onClick={onRegenerateResponse}>
                                      Regenerate response
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </ViewportList>
                  ) : (
                    <div
                      css={`
                        margin: ${type === 'modal' ? 50 : 10}px ${type === 'modal' ? 20 : 10}%;
                      `}
                    >
                      <div css={'text-align: center;'}>
                        <img
                          css={`
                            width: 183px;
                            height: 168px;
                          `}
                          src={calcImgSrc('/static/imgs/aiChatWelcome.png')}
                          alt={''}
                        />
                      </div>
                      <div className={s.welcomeTitle} css={'text-align: center;'}>
                        Hi! I'm your AI assistant for Abacus.AI. Let's begin
                      </div>
                      <div className={s.welcomeDesc} css={'text-align: center;'}>
                        Get started with some examples below
                      </div>
                      <div css={'padding: 20px 0px;'}></div>
                      {examples.map((example) => (
                        <div
                          css={'margin: 25px 30px; text-align: left;'}
                          key={example}
                          onClick={() => {
                            sendMessage(example);
                          }}
                        >
                          <span className={s.welcomeExample}>{example}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {requestId && (
                    <div css={'position: sticky; bottom: 0; text-align: center;'}>
                      {isStopping ? (
                        <span className={s.stopLabel}>Stopping...</span>
                      ) : (
                        <span
                          className={s.stopButton}
                          onClick={() => {
                            onStopGenerating();
                          }}
                        >
                          <FontAwesomeIcon
                            css={`
                              margin-right: 4px;
                            `}
                            icon={faStop}
                            transform={{ size: 15, x: 0, y: 0 }}
                          />
                          Stop
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div css={`display flex; min-height: 50px; align-items: center; padding: 7px 10px; background: transparent;`}>
                  <Input.TextArea
                    placeholder="Write something..."
                    autoFocus
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    style={{ border: 'none', background: '#20282D', boxShadow: '0 0.5px 0.5px rgba(0,0,0,0.25), 0 4px 4px rgba(0,0,0,0.22)', color: 'white', fontSize: '15px', marginRight: '10px' }}
                    onKeyDown={onMessageKeyDown}
                    onChange={onChangeMessage}
                    value={message}
                  />
                  <TooltipExt title="Send">
                    <Button type="primary" disabled={!message?.trim()} icon={<SendOutlined />} size="middle" style={{ backgroundColor: '#6D8192', borderColor: '#6D8192' }} onClick={onSendMessage} />
                  </TooltipExt>
                </div>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    </DockModal>
  );
});

export default ChatDockModal;
