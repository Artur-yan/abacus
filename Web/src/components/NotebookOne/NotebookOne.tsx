import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '../../DesignSystem/Button/Button';
import classNames from 'classnames';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import * as uuid from 'uuid';
import Utils, { ReactLazyExt } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useProject, useUseCaseFromProjectOne } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import AddTemplateToNotebook from '../AddTemplateToNotebook/AddTemplateToNotebook';
import CreateUpdateTemplateFromNotebook from '../CreateUpdateTemplateFromNotebook/CreateUpdateTemplateFromNotebook';
import PartsLink from '../NavLeft/PartsLink';
import NotebookRefreshPolicy from '../NotebookRefreshPolicy/NotebookRefreshPolicy';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const NBEditor = ReactLazyExt(() => import('../NBEditor/NBEditor'));
const styles = require('./NotebookOne.module.css');
const stylesDark = require('../antdUseDark.module.css');

enum NotebookStatus {
  Active = 'ACTIVE',
  Deploying = 'DEPLOYING',
  DeployingFailed = 'DEPLOYING_FAILED',
  Failed = 'FAILED',
  Initializing = 'INITIALIZING',
  InitializingFailed = 'INITIALIZING_FAILED',
  Pending = 'PENDING',
  Saving = 'SAVING',
  SavingFailed = 'SAVING_FAILED',
  Stopped = 'STOPPED',
  Stopping = 'STOPPING',
}

const NotebookStatusDescription = {
  [NotebookStatus.Active]: 'Active',
  [NotebookStatus.Deploying]: 'Deploying',
  [NotebookStatus.DeployingFailed]: 'Deploying Failed',
  [NotebookStatus.Failed]: 'Failed',
  [NotebookStatus.Initializing]: 'Initializing',
  [NotebookStatus.InitializingFailed]: 'Initializing Failed',
  [NotebookStatus.Pending]: 'Pending',
  [NotebookStatus.Saving]: 'Saving',
  [NotebookStatus.SavingFailed]: 'Saving Failed',
  [NotebookStatus.Stopped]: 'Stopped',
  [NotebookStatus.Stopping]: 'Stopping',
};

const failedStatuses = [NotebookStatus.Failed, NotebookStatus.DeployingFailed, NotebookStatus.InitializingFailed, NotebookStatus.SavingFailed];

const startableNotebookStatuses = [NotebookStatus.Initializing, NotebookStatus.Pending, NotebookStatus.Stopped];

const loadingString = 'Starting';
const systemObjectsOrgOrganizationId = '4d842b504';

const NotebookOne = React.memo(() => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const organizationId = authUser?.toJS?.()?.data?.organization?.organizationId;
  const isSystemObjectsOrg = organizationId === systemObjectsOrgOrganizationId;

  const [ignoredCheckNB, forceUpdateCheckNB] = useReducer((x) => x + 1, 0);

  const [frameSrc, setFrameSrc] = useState(null);
  const [status, setStatus] = useState('Preparing');
  const [statusIn, setStatusIn] = useState(loadingString);
  const [showFull, setShowFull] = useState(true);
  const [isFailed, setIsFailed] = useState(false);
  const [doHeartbeat, setDoHeartbeat] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [forceNotebookId, setForceNotebookId] = useState(null);
  const [isRefreshPolicyModalOpen, setIsRefreshPolicyModalOpen] = useState(false);
  const [isTemplateEditMode, setIsTemplateEditMode] = useState(false);
  const [isCreateUpdateModalOpen, setIsCreateUpdateModalOpen] = useState(false);
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);

  let showFastUI = !Constants.flags.hide_nb_fast_ui;
  if (paramsProp?.get('force') === 'fast') {
    showFastUI = false;
  }

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-' || projectId === '') {
    projectId = null;
  }
  let notebookId = paramsProp?.get('notebookId');
  let subpath = paramsProp?.get('subpath');
  if (notebookId === '') {
    notebookId = null;
  }
  if (subpath === '') {
    subpath = null;
  }
  const projectOne = useProject(projectId);
  const useCaseInfo = useUseCaseFromProjectOne(projectOne, true);
  const problemType = useCaseInfo?.ori?.problemType ?? null;

  const lastCallId = useRef(null);
  const lastTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (lastTimeout.current != null) {
        clearTimeout(lastTimeout.current);
        lastTimeout.current = null;
      }
    };
  }, []);

  const mode1 = paramsProp?.get('mode');

  useEffect(() => {
    if (mode1 === PartsLink.algorithm_one) {
      return () => {
        StoreActions.listAlgosByProblemTypeId_(problemType);
        StoreActions.listAlgosByProblemTypeId_(problemType, projectId);
        StoreActions.describeNotebook_(notebookId);
      };
    }
  }, [mode1, problemType, projectId, notebookId]);

  useEffect(() => {
    if (doHeartbeat) {
      let timer = setInterval(() => {
        REClient_.client_()._describeNotebook(
          notebookId ?? forceNotebookId,
          (err, res) => {
            const status = res?.result?.status?.toUpperCase?.();
            if (!(NotebookStatus.Active === status || (showFastUI && NotebookStatus.Stopped === status)) && !err) {
              setDoHeartbeat(false);

              if (timer != null) {
                clearInterval(timer);
                timer = null;
              }
              setFrameSrc(null);
              setStatusError(res?.result?.status);
              return;
            }
          },
          undefined,
          subpath,
        );
      }, 30 * 1000);

      return () => {
        if (timer != null) {
          clearInterval(timer);
          timer = null;
        }
      };
    }
  }, [doHeartbeat, projectId, forceNotebookId]);

  useEffect(() => {
    let id1 = uuid.v1();
    lastCallId.current = id1;

    const doCheck = (notebookId, forStatus = NotebookStatus.Active, cbFinish?, max = 1000, allowHintOrg = false) => {
      if (max <= 0) {
        return;
      }
      REClient_.client_()._describeNotebook(
        notebookId,
        (err, res) => {
          const status = res?.result?.status?.toUpperCase?.();
          setStatus(NotebookStatusDescription[status] ?? '');

          if (failedStatuses.includes(status)) {
            setIsFailed(true);
            if (lastTimeout.current != null) {
              clearTimeout(lastTimeout.current);
              lastTimeout.current = null;
            }
            cbFinish?.(null);
            return;
          }

          if (status !== forStatus) {
            if (lastTimeout.current != null) {
              clearTimeout(lastTimeout.current);
              lastTimeout.current = null;
            }

            lastTimeout.current = setTimeout(() => {
              if (lastCallId.current === id1) {
                doCheck(notebookId, forStatus, cbFinish, max - 1);
              }
            }, 1000);
          } else {
            cbFinish?.(res);
          }
        },
        allowHintOrg,
        subpath,
      );
    };

    const doOpen = (notebookId) => {
      setIsFailed((previousIsFailed) => {
        if (!previousIsFailed) {
          !showFastUI &&
            doCheck(
              notebookId,
              NotebookStatus.Active,
              (res) => {
                setForceNotebookId(notebookId);
                setStatus(null);
                setStatusIn(loadingString);
                setFrameSrc(res?.result?.url);
              },
              undefined,
              true,
            );
        }

        return previousIsFailed;
      });
    };

    if (notebookId != null) {
      REClient_.client_()._describeNotebook(
        notebookId,
        (err, res) => {
          const status = res?.result?.status?.toUpperCase?.();

          if (failedStatuses.includes(status)) {
            setStatus(NotebookStatusDescription[res?.result?.status?.toUpperCase()] ?? '');
            setIsFailed(true);
            return;
          }

          if (startableNotebookStatuses.includes(status)) {
            !showFastUI &&
              REClient_.client_()._startNotebook(notebookId, () => {
                StoreActions.refreshDoNotebookAll_(notebookId);
                doCheck(notebookId, undefined, () => {
                  doOpen(notebookId);
                });
              });
          } else if (status === NotebookStatus.Stopping) {
            doCheck(notebookId, NotebookStatus.Stopped, () => {
              !showFastUI &&
                REClient_.client_()._startNotebook(notebookId, () => {
                  StoreActions.refreshDoNotebookAll_(notebookId);
                  doCheck(notebookId, undefined, () => {
                    doOpen(notebookId);
                  });
                });
            });
          } else if (status === NotebookStatus.Deploying) {
            doCheck(notebookId, undefined, () => {
              doOpen(notebookId);
            });
          } else {
            doOpen(notebookId);
          }
        },
        undefined,
        subpath,
      );
      return;
    }
  }, [notebookId, projectId, ignoredCheckNB]);

  useEffect(() => {
    return () => {
      setShowFull(false);
    };
  }, []);

  const onLoadIframe = useCallback(() => {
    setStatusIn(null);
    setDoHeartbeat(true);
  }, []);

  const onClickErrorButton = () => {
    setStatusError(null);
    forceUpdateCheckNB();
  };

  const fastNotebookElement = (
    <div className={classNames('useDark', styles.notebookContainer)}>
      <AutoSizer disableWidth>
        {({ height }) => (
          <div style={{ height }}>
            <div className={stylesDark.absolute}>
              <React.Suspense>
                <NBEditor notebookId={notebookId} />
              </React.Suspense>
            </div>
          </div>
        )}
      </AutoSizer>
    </div>
  );

  const jupyterNotebookElement = useMemo(() => {
    let showErrorButton = statusError != null && notebookId != null;

    const messageWithStatus = (
      <span style={{ textAlign: 'center' }}>
        {`${status}${isFailed ? '' : '...'}`}
        <br />
        {!isFailed && <span className={styles.refreshText}>(may take up to 2 mins)</span>}
      </span>
    ) as any;

    const refreshMessage = status == null ? null : messageWithStatus;
    return (
      <div className={classNames('useDark', styles.notebookContainer)}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <RefreshAndProgress
              errorMsg={statusError != null ? 'Notebook was shutdown due to lack of activity' : undefined}
              onClickErrorButton={showErrorButton ? onClickErrorButton : undefined}
              errorButtonText={showErrorButton ? 'Re-Start' : undefined}
              msgMsg={refreshMessage}
              isMsgAnimRefresh={!isFailed}
              isDim={status != null}
            >
              <div>
                <div style={{ height, position: 'relative' }}>
                  {statusIn != null && status == null && (
                    <RefreshAndProgress
                      isMsgAnimRefresh
                      isDim={false}
                      msgMsg={
                        (
                          <span
                            css={`
                              text-align: center;
                            `}
                          >
                            Connecting...
                            <br />
                            <span className={styles.refreshText}>One moment while we connect you to your notebook</span>
                          </span>
                        ) as any
                      }
                    />
                  )}
                  {frameSrc != null && (
                    <>
                      <div className={styles.customButtonsContainer}>
                        {isSystemObjectsOrg && notebookId && (
                          <Button
                            customType="internal"
                            size="small"
                            className={styles.internalButton}
                            onClick={() => {
                              setIsCreateUpdateModalOpen(true);
                              setIsTemplateEditMode(false);
                            }}
                          >
                            Internal: Save as Template
                          </Button>
                        )}
                        {isSystemObjectsOrg && notebookId && (
                          <Button
                            customType="internal"
                            size="small"
                            className={styles.internalButton}
                            onClick={() => {
                              setIsCreateUpdateModalOpen(true);
                              setIsTemplateEditMode(true);
                            }}
                          >
                            Internal: Update Template
                          </Button>
                        )}
                        {notebookId && (
                          <Button size="small" type="link" className={styles.externalButton} onClick={() => setIsAddTemplateModalOpen(true)}>
                            Add Template
                          </Button>
                        )}
                        {statusIn === null && (
                          <Button
                            size="small"
                            type="link"
                            icon={<FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowsRotate').faArrowsRotate} transform={{ size: 14, x: -5, y: 0 }} />}
                            className={styles.externalButton}
                            onClick={() => setIsRefreshPolicyModalOpen(true)}
                          >
                            Refresh schedule
                          </Button>
                        )}
                      </div>
                      <iframe title="Abacus" className={styles.notebookIframe} style={{ height }} onLoad={onLoadIframe} src={frameSrc} />
                    </>
                  )}
                </div>
              </div>
            </RefreshAndProgress>
          )}
        </AutoSizer>
      </div>
    );
  }, [frameSrc, status, statusIn, isFailed, statusError, isSystemObjectsOrg, notebookId]);

  const notebookElement = useMemo(() => {
    if (!showFull) return null;
    return ReactDOM.createPortal(
      <>
        {showFastUI && fastNotebookElement}
        {!showFastUI && jupyterNotebookElement}
      </>,
      document.getElementById('container'),
    );
  }, [showFull, showFastUI, fastNotebookElement, jupyterNotebookElement]);

  return (
    <div className={styles.container}>
      <div
        css={`
          position: absolute;
          top: ${topAfterHeaderHH}px;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        {notebookElement}
      </div>
      {/* NOTE: figure out what forceNotebooId is and if its really needed */}
      {(notebookId || forceNotebookId) && <NotebookRefreshPolicy notebook={notebookId || forceNotebookId} isModalOpen={isRefreshPolicyModalOpen} setIsModalOpen={setIsRefreshPolicyModalOpen} />}
      {(notebookId || forceNotebookId) && (
        <CreateUpdateTemplateFromNotebook
          notebookId={notebookId || forceNotebookId}
          isModalOpen={isCreateUpdateModalOpen}
          setIsModalOpen={setIsCreateUpdateModalOpen}
          isEditMode={isTemplateEditMode}
          onCancel={() => setIsTemplateEditMode(false)}
        />
      )}
      {(notebookId || forceNotebookId) && <AddTemplateToNotebook notebookId={notebookId || forceNotebookId} isModalOpen={isAddTemplateModalOpen} setIsModalOpen={setIsAddTemplateModalOpen} />}
    </div>
  );
});

export default NotebookOne;
