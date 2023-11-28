import * as React from 'react';
import { Notebook, NotebookModel } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import _ from 'lodash';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { usePrompt } from '../../api/REUses';
import { faCloudArrowUp, faNotebook, faCloudCheck } from '@fortawesome/pro-solid-svg-icons';
import CreateUpdateTemplateFromNotebook from '../CreateUpdateTemplateFromNotebook/CreateUpdateTemplateFromNotebook';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import './cell.module.css';
import styles from './NBEditor.module.css';
import stylesDark from '../antdUseDark.module.css';
import 'jupyterlab-plotly/style/index.css';
import 'style-loader!./nb.module.css';
import 'style-loader!css-loader!@jupyterlab/cells/style/index.css';
import 'style-loader!css-loader!@jupyterlab/codemirror/style/index.css';
import 'style-loader!css-loader!@jupyterlab/notebook/style/index.css';
import 'style-loader!css-loader!@jupyterlab/theme-dark-extension/style/theme.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '../../DesignSystem/Button/Button';

import classNames from 'classnames';
import SplitPane from 'react-split-pane';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import { NotebookLifecycle } from '../../stores/reducers/notebooks';
import AddTemplateToNotebook from '../AddTemplateToNotebook/AddTemplateToNotebook';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TooltipExt from '../TooltipExt/TooltipExt';
import {
  ECallApiMethod,
  ENotebookToolbarActions,
  NOTEBOOK_CONTAINER_ID,
  NOTEBOOK_TITLE_CONTAINER_HEIGHT,
  NotebookModes,
  calcPathFromArray,
  cleanInvisibleFilesAndFolders,
  createNewNotebook,
  doWorkIterTree,
  fetchPykernelserverInfo,
  keyBindings,
} from './FastNotebookUtils';
import NBEditorTree from './NBEditorTree';
import NotebookWithToolbar from './NotebookWithToolbar';

export const isValidPathInTree = (tree, pathList) => {
  if (pathList == null || pathList?.length === 0) {
    return true;
  } else {
    const doIterIn = (tree, pathToIter) => {
      if (tree == null || pathToIter == null) {
        return false;
      }
      if (pathToIter?.length === 0 || tree === 'FILE') {
        return true;
      }

      let s1 = pathToIter?.[0];
      let v1 = tree?.[s1];

      if (v1 == null) {
        return false;
      } else {
        return doIterIn(v1, pathToIter?.slice(1, 9999));
      }
    };

    return doIterIn(tree, pathList);
  }
};

interface INBEditorProps {
  notebookId?: string;
  onIsChangedChange?: (isChanged?: boolean) => void;
  doNotRender?: boolean;
  headlessMode?: boolean;
  onRender?: () => void;
}

export interface ICallApiParams {
  originalPath?;
  newPath?;
  folderPath?;
  filePath?;
  fileContent?;
}

const systemObjectsOrgOrganizationId = '4d842b504';

const NBEditor = React.memo((props: PropsWithChildren<INBEditorProps>) => {
  const location = useLocation();
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const { headlessMode = false, onRender = () => {} } = props;
  const organizationId = authUser?.toJS?.()?.data?.organization?.organizationId;
  const isSystemObjectsOrg = organizationId === systemObjectsOrgOrganizationId;
  const [ignoredFile, forceUpdateFile] = useReducer((x) => x + 1, 0);
  const [isRefreshingTree, setIsRefreshingTree] = useState(false);
  const [filesAndFolders, setFilesAndFolders] = useState(null);
  const [filesAndFoldersSel, setFilesAndFoldersSel] = useState(null);
  const [notebook, setNotebook] = useState(null as Notebook);
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTemplateEditMode, setIsTemplateEditMode] = useState(false);
  const [isCreateUpdateModalOpen, setIsCreateUpdateModalOpen] = useState(false);
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);
  const kernelServerStatus = useRef(null);
  const notebookEndpointInfo = useRef({ endpoint: null, token: null });
  const pykernelEndpointInfo = useRef({ endpoint: null, token: null });
  const checkNotebookStatus = useRef(false);

  let notebookId = paramsProp?.get('notebookId') || props.notebookId;
  if (notebookId == null) {
    return null;
  }

  const selectedNbFile = paramsProp?.get('selectedNbFile');

  const jupyterNbUrl = useMemo(() => {
    if (notebookId) {
      return `/${PartsLink.notebook_one}/${paramsProp?.get('projectId') || '-'}/${notebookId}`;
    }
    return null;
  }, [paramsProp, location]);

  const abacusNbUrl = useMemo(() => {
    if (notebookId) {
      return `/${PartsLink.fast_notebook}/${paramsProp?.get('projectId') || '-'}/${notebookId}`;
    }
    return null;
  }, [paramsProp, location]);

  const doSetIsChanged = (isChanged) => {
    setIsChanged(isChanged);

    props.onIsChangedChange?.(isChanged);
  };

  useEffect(() => {
    props.onIsChangedChange?.(isChanged);
  }, [isChanged]);

  const _ensurePykernelserver = useCallback(async () => {
    try {
      pykernelEndpointInfo.current = await fetchPykernelserverInfo();
      const promise = REClient_.promises_().postCustom(
        `${pykernelEndpointInfo.current?.endpoint}/${ECallApiMethod.ensurePykernelserver}`,
        {},
        {
          extraHeaders: {
            Authorization: `Bearer ${pykernelEndpointInfo.current?.token || ''}`,
          },
          doNotSendExtraHeader: true,
        },
      );
      return promise;
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const checkKernelServerStatus = async () => {
    try {
      let res = await _ensurePykernelserver();
      if (!res?.success) {
        kernelServerStatus.current = null;
        REActions.addNotificationError(Constants.errorDefault);
        return;
      }
      kernelServerStatus.current = res?.result;

      if (!(res?.result === 'ACTIVE' || res?.result === 'FAILED')) {
        setTimeout(() => {
          checkKernelServerStatus();
        }, 1000);
      } else {
        forceUpdateFile();
      }
    } catch (err) {
      setIsProcessing(false);
      kernelServerStatus.current = null;
      REActions.addNotificationError(Constants.errorDefault);
    }
  };

  const callNotebookEndpoint = useCallback(async (apiName, params) => {
    try {
      await fetchNotebookInfo();
      const promise = REClient_.promises_().postCustom(
        `${notebookEndpointInfo.current?.endpoint}${apiName}`,
        {
          notebookId,
          ...(params || {}),
        },
        {
          extraHeaders: {
            Authorization: `Bearer ${notebookEndpointInfo.current?.token || ''}`,
          },
          doNotSendExtraHeader: true,
        },
      );
      return promise;
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const fetchNotebookDirectoryTree = useCallback(async () => {
    setIsRefreshingTree(true);
    try {
      const treeRes = await callNotebookEndpoint(ECallApiMethod.getNotebookDirectoryTree, {});
      setIsRefreshingTree(false);
      if (treeRes?.result != null) {
        const result = treeRes?.result ?? null;
        const visibleFiles = cleanInvisibleFilesAndFolders(result);
        if (Object.keys(visibleFiles)?.length) {
          let sel1 = selectedNbFile ? [selectedNbFile] : doWorkIterTree(visibleFiles);
          setFilesAndFolders(visibleFiles);
          //TODO: cleanup this code
          setFilesAndFoldersSel((s1) => {
            let s2 = sel1 ?? null;
            if (s1 == null) {
              s1 = s2;
            } else if (!_.isEqual(s1, s2) && !isValidPathInTree(visibleFiles, s1)) {
              s1 = s2;
            }
            return s1;
          });
        } else {
          setFilesAndFolders(null);
          setFilesAndFoldersSel(null);
          setIsProcessing(false);
          // REActions.addNotificationError('Empty directory, no files found');
        }
      } else {
        setFilesAndFolders(null);
        setFilesAndFoldersSel(null);
      }
    } catch (err) {
      setIsProcessing(false);
      setIsRefreshingTree(false);
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, [selectedNbFile]);

  const fetchNotebookInfo = useCallback(async (isNotebookChanged?: boolean) => {
    try {
      const res = await REClient_.promises_()._getNotebookMetaserviceInfo(notebookId);
      const notebookMeta = res?.result;
      let endpoint = notebookMeta?.endpoint;
      if (!notebookMeta || !endpoint) {
        REActions.addNotificationError('Notebook endpoint not available');
        return;
      }

      endpoint += _.endsWith(endpoint, '/') ? '' : '/';
      notebookEndpointInfo.current = { endpoint, token: notebookMeta?.token };
      if (isNotebookChanged) {
        fetchNotebookDirectoryTree();
        checkKernelServerStatus();
      }
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const fetchNotebookFileContent = useCallback(async () => {
    try {
      setIsProcessing(true);
      const res = await callNotebookEndpoint(ECallApiMethod.getNotebookFileContent, { filePath: calcPathFromArray(filesAndFoldersSel) });
      setIsProcessing(false);
      let notebookRes = res?.result;

      if (res?.success) {
        if (_.isString(notebookRes)) {
          var { notebookInstance, modelInstance } = createNewNotebook(notebookRes);

          forceUpdateFile();
          setNotebook(notebookInstance);
          doSetIsChanged(false);
        } else {
          setIsFailed(true);
          setNotebook(null);
          doSetIsChanged(false);
        }
      } else {
        REActions.addNotificationError(Constants.errorDefault);
      }
    } catch (err) {
      setIsProcessing(false);
      REActions.addNotificationError(Constants.errorDefault);
    }

    return () => {
      notebookInstance?.dispose?.();
      modelInstance?.dispose?.();
    };
  }, [filesAndFoldersSel]);

  const checkIsNotebookReady = async (notebookId) => {
    const allowedStatuses = [NotebookLifecycle.ACTIVE, NotebookLifecycle.DEPLOYING, NotebookLifecycle.STOPPED];

    try {
      const res = await REClient_.promises_()._describeNotebook(notebookId);
      if (!res?.success) {
        REActions.addNotificationError(res.error || res?.result?.error || Constants.errorDefault);
        return;
      }
      const notebookInfo = res?.result;
      if (allowedStatuses.includes(notebookInfo?.status)) {
        fetchNotebookInfo(true);
      } else {
        setTimeout(async () => {
          checkIsNotebookReady(notebookId);
        }, 1000);
      }
    } catch (err) {
      REActions.addNotificationError(err?.message || Constants.errorDefault);
      return;
    }
  };

  useEffect(() => {
    if (!notebookId || !selectedNbFile) return;

    fetchNotebookDirectoryTree();
  }, [selectedNbFile]);

  useEffect(() => {
    setIsProcessing(true);
    setIsRefreshingTree(true);
    kernelServerStatus.current = null;
    if (!notebookId) {
      setFilesAndFolders(null);
      setFilesAndFoldersSel(null);
    } else if (!checkNotebookStatus.current) {
      checkNotebookStatus.current = true;
      checkIsNotebookReady(notebookId);
    }

    // Disable Ctrl+S save webpage behaviour
    window.addEventListener('keydown', (event) => {
      if ((navigator.userAgent.indexOf('Mac OS X') !== -1 ? event.metaKey : event.ctrlKey) && event.keyCode === 83) {
        event.preventDefault();
        onClickSave(true);
      }
    });

    return () => {
      checkNotebookStatus.current = false;
    };
  }, [notebookId]);

  useEffect(() => {
    forceUpdateFile();
    doSetIsChanged(false);
    setIsFailed(false);
    if (filesAndFoldersSel === null || filesAndFoldersSel.length === 0) {
      setNotebook(null);
    } else {
      fetchNotebookFileContent();
    }
  }, [filesAndFoldersSel]);

  useEffect(() => {
    if (notebook?.model?.contentChanged != null) {
      const slotContent = (model: NotebookModel, args: void) => {
        autoSaveNotebook?.();
      };

      notebook.model.contentChanged.connect?.(slotContent);
      return () => {
        notebook?.model?.contentChanged?.disconnect?.(slotContent);
      };
    }
  }, [notebook?.model]);

  usePrompt(`Changes that you made may not be saved. Leave site?`, isChanged, false);

  const onChangeSel = (parentFoldersSub, value, data) => {
    setIsChanged((isChanged) => {
      if (isChanged) {
        REActions.addNotificationError(`Please save or revert the current changes`);
      } else {
        let ff = [...(parentFoldersSub ?? [])];
        if (value) {
          ff.push(value);
        }
        setFilesAndFoldersSel(ff ?? null);
      }

      return isChanged;
    });
  };

  const resetCustomFastNotebookConfig = () => {
    const notebookJson = notebook?.model?.toJSON() as any;
    notebookJson?.cells?.forEach((cell) => {
      const cellMetadata = cell?.metadata;
      if (cellMetadata?.cellTemplate?.id) {
        // Delete hidden property added by cell templates
        delete cellMetadata?.jupyter?.outputs_hidden;
        delete cellMetadata?.jupyter?.source_hidden;
        delete cellMetadata?.collapsed;
      }
    });

    return notebookJson;
  };

  const onClickSave = async (isSilentSave = false) => {
    const updatedNotebookConfig = resetCustomFastNotebookConfig();
    const content = JSON.stringify(updatedNotebookConfig);
    const filePath = calcPathFromArray(filesAndFoldersSel);

    if (!filePath) return;

    if (!isSilentSave) {
      setIsSaving(true);
    }

    try {
      const res = await callNotebookEndpoint(ECallApiMethod.updateNotebookFileContent, { filePath, fileContent: content });

      setIsSaving(false);
      if (res?.err || !res?.success) {
        REActions.addNotificationError(res?.err || Constants.errorDefault);
      } else {
        doSetIsChanged(false);

        if (isSilentSave) return;
        REActions.addNotification('Notebook saved!');
      }
    } catch (err) {
      setIsSaving(false);
      REActions.addNotificationError(Constants.errorDefault);
    }
  };

  const openInJupyterElement = !Constants.flags.onprem && jupyterNbUrl && (
    <Link usePointer showAsLinkBlue to={jupyterNbUrl} newWindow>
      Jupyter notebook
    </Link>
  );

  const openInAbacusNbElement = abacusNbUrl && (
    <Link usePointer showAsLinkBlue to={abacusNbUrl} newWindow>
      Abacus notebook
    </Link>
  );

  const autoSaveNotebook = _.debounce(() => onClickSave(true), 2000);
  const filePath = calcPathFromArray(filesAndFoldersSel);
  const NotebookWithToolbarTemplate = (
    <>
      <NotebookWithToolbar
        onClickSave={onClickSave}
        kernelServerStatus={kernelServerStatus}
        notebook={notebook}
        notebookId={notebookId}
        pykernelEndpointInfo={pykernelEndpointInfo}
        headlessMode={headlessMode}
        openInJupyterElement={openInJupyterElement}
        openInAbacusNbElement={openInAbacusNbElement}
        onRender={onRender}
      />
    </>
  );

  return (
    <div className="useDark">
      <RefreshAndProgress
        errorMsg={null}
        onClickErrorButton={null}
        errorButtonText={null}
        msgMsg={(isSaving && 'Saving...') || (isProcessing && 'Processing...') || null}
        isMsgAnimRefresh={isSaving || !isFailed}
        isDim={isSaving || isProcessing || isFailed}
      >
        {headlessMode ? (
          NotebookWithToolbarTemplate
        ) : (
          <div className={styles.rootContainer}>
            <div
              className={styles.topNavContainer}
              css={`
                height: ${NOTEBOOK_TITLE_CONTAINER_HEIGHT}px;
              `}
            >
              <div className={styles.fileNameContainer}>
                <span className={styles.nbIcon}>
                  <FontAwesomeIcon icon={faNotebook} />
                </span>
                <span className={styles.fileTxt}>
                  {filePath && (
                    <span className={styles.notebookTxt}>
                      {filePath}{' '}
                      <span
                        css={`
                          margin-left: 4px;
                          font-size: 13px;
                        `}
                      >
                        {isChanged ? (
                          <TooltipExt title="Syncing change">
                            <FontAwesomeIcon icon={faCloudArrowUp} />
                          </TooltipExt>
                        ) : (
                          <TooltipExt title="Changes saved">
                            <FontAwesomeIcon color="#38bfa1" icon={faCloudCheck} />
                          </TooltipExt>
                        )}
                      </span>{' '}
                    </span>
                  )}
                  <span className={styles.abacusTxt}>Abacus Notebook</span>
                </span>
              </div>
              <div>
                {isSystemObjectsOrg && notebookId && (
                  <Button
                    customType="internal"
                    size="small"
                    className={styles.templateButton}
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
                    className={styles.templateButton}
                    onClick={() => {
                      setIsCreateUpdateModalOpen(true);
                      setIsTemplateEditMode(true);
                    }}
                  >
                    Internal: Update Template
                  </Button>
                )}
                {notebookId && (
                  <Button size="small" type="link" className={classNames(styles.templateButton, styles.externalButton)} onClick={() => setIsAddTemplateModalOpen(true)}>
                    Add Template
                  </Button>
                )}
                {openInJupyterElement}
              </div>
            </div>
            {/*// @ts-ignore */}
            <SplitPane
              primary="first"
              split="vertical"
              style={{ height: `calc(100% - ${NOTEBOOK_TITLE_CONTAINER_HEIGHT}px)` }}
              minSize={200}
              defaultSize={Utils.dataNum('expand_nb_tree', 400)}
              onChange={(v1) => {
                Utils.dataNum('expand_nb_tree', undefined, v1);
              }}
            >
              <div className={styles.explorerContainer}>
                <NBEditorTree
                  isChanged={isChanged}
                  isRefreshingTree={isRefreshingTree}
                  forceRefreshTree={fetchNotebookDirectoryTree}
                  callApi={callNotebookEndpoint}
                  data={filesAndFolders}
                  sel={filesAndFoldersSel}
                  onChangeSel={onChangeSel}
                />
              </div>
              {NotebookWithToolbarTemplate}
            </SplitPane>
          </div>
        )}
      </RefreshAndProgress>
      {!headlessMode && notebookId && (
        <CreateUpdateTemplateFromNotebook notebookId={notebookId} isModalOpen={isCreateUpdateModalOpen} setIsModalOpen={setIsCreateUpdateModalOpen} isEditMode={isTemplateEditMode} onCancel={() => setIsTemplateEditMode(false)} />
      )}
      {!headlessMode && notebookId && <AddTemplateToNotebook notebookId={notebookId} isModalOpen={isAddTemplateModalOpen} setIsModalOpen={setIsAddTemplateModalOpen} onSuccess={fetchNotebookDirectoryTree} />}
    </div>
  );
});

export default React.memo(NBEditor);
