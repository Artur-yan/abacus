import Button from 'antd/lib/button';
import confirm from 'antd/lib/modal/confirm';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';

import Location from '../../../core/Location';
import { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useNotebook } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { NotebookLifecycle } from '../../stores/reducers/notebooks';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt from '../TableExt/TableExt';
import NotebookRefreshSchedules from './NotebookRefreshSchedules';
const globalStyles = require('../antdUseDark.module.css');
const styles = require('./NotebookDetails.module.css');

type NotebookLifecycleType = `${NotebookLifecycle}`;
const notebookInprogressLifeCycleList: NotebookLifecycleType[] = [NotebookLifecycle.DEPLOYING, NotebookLifecycle.PENDING, NotebookLifecycle.STOPPING, NotebookLifecycle.INITIALIZING, NotebookLifecycle.SAVING];

const NotebookDetails = () => {
  const { paramsProp } = useSelector((state: any) => ({ paramsProp: state.paramsProp }));
  const [isLoading, setIsLoading] = useState(false);
  const [notebookVersions, setNotebookVersions] = useState([]);
  const [notebookList, setNotebookList] = useState([]);
  const [status, setStatus] = useState<NotebookLifecycleType>();
  const refScrollerVersions = useRef(null);
  const notebookAvailableRef = useRef(false);
  const notebookVersionsAvailableRef = useRef(false);
  const projectId = paramsProp.get('projectId')?.trim() !== '-' ? paramsProp.get('projectId') : null;
  const notebookId = paramsProp.get('notebookId') || null;
  const notebookInfo = useNotebook(notebookId);

  const onDelete = useCallback(async () => {
    if (!notebookId) return;

    try {
      const res = await REClient_.promises_()._deleteNotebook(notebookId);

      if (!res?.success) {
        REActions.addNotificationError(Constants.errorDefault);
        return;
      }
      REActions.addNotification('Notebook deleted successfully');
      Location.push(`/${PartsLink.notebook_list}/${projectId ?? ''}`);
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
    }
  }, [notebookId]);

  const onNotebookAction = useCallback(
    async (isNotebookActive) => {
      let res;
      if (isNotebookActive) {
        res = await REClient_.promises_()._stopNotebook(notebookId);
      } else {
        res = await REClient_.promises_()._startNotebook(notebookId);
      }

      if (!res?.success) {
        REActions.addNotificationError(`Error ${isNotebookActive ? 'stopping' : 'starting'} notebook`);
        return;
      }

      StoreActions.refreshDoNotebookAll_(notebookId);
    },
    [notebookInfo, notebookId],
  );

  const onPolicyDelete = useCallback(() => {
    StoreActions.describeNotebook_(notebookId);
  }, [notebookId]);

  const showGpuChangeDialog = (notebookId, gpuStatus) => {
    let modalRef = confirm({
      title: `Do you want to ${gpuStatus ? 'disable' : 'enable'} GPU?`,
      content: !gpuStatus ? 'A Jupyter restart will be required to enable GPU' : '',
      okText: 'Yes',
      cancelText: 'Cancel',
      maskClosable: true,
      onOk: () => onGpuStatusChange(notebookId, !gpuStatus, modalRef),
      onCancel: () => modalRef.destroy(),
    });
  };

  const onGpuStatusChange = async (notebookId, newStatus, modalRef) => {
    try {
      const res = await REClient_.promises_()._setNotebookUsesGpu(notebookId, newStatus);

      if (!res?.success) {
        REActions.addNotificationError(Constants.errorDefault);
        return;
      }
      StoreActions.describeNotebook_(notebookId);
      modalRef.destroy();

      if ([NotebookLifecycle.DEPLOYING, NotebookLifecycle.ACTIVE].includes(notebookInfo?.status)) {
        REActions.addNotification('Success, Restart notebook to apply changes');
      }
    } catch (e) {
      modalRef.destroy();
      REActions.addNotificationError(e?.message || Constants.errorDefault);
    }
  };

  const projectsAttached = useMemo(() => {
    return notebookInfo?.projectIds?.map((projectId) => (
      <Link key={projectId} to={`/${PartsLink.project_dashboard}/${projectId}`} usePointer className={globalStyles.styleTextBlueBright}>
        {projectId}
      </Link>
    ));
  }, [notebookInfo]);

  const notebookVersionColumns = useMemo(
    () => [
      {
        title: 'Version Id',
        field: 'notebookVersion',
        render: (text) => <CopyText>{text}</CopyText>,
      },
      {
        title: 'Created at',
        field: 'createdAt',
        render: (text) => (text ? <DateOld always date={text} /> : '-'),
      },
      {
        title: 'Execution file',
        field: 'executeFilename',
        render: (text) => text,
      },
      {
        title: 'Execution status',
        field: 'executeStatus',
        render: (text) => text,
      },
      {
        title: 'Stopped at',
        field: 'stoppedAt',
        render: (text) => (text ? <DateOld always date={text} /> : '-'),
      },
      {
        title: 'Status',
        field: 'status',
        render: (text, row) => {
          let isInProgress = false;
          const isActiveNotebook = row?.notebookVersion === notebookInfo?.activeNotebookVersion;
          if (notebookInprogressLifeCycleList.includes(status)) {
            isInProgress = isActiveNotebook;
          }
          return isInProgress ? (
            <span>
              <div style={{ whiteSpace: 'nowrap' }}>{status}...</div>
              <div style={{ marginTop: '5px' }}>
                <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
              </div>
            </span>
          ) : isActiveNotebook ? (
            status
          ) : (
            text
          );
        },
      },
    ],
    [notebookVersions, status],
  );

  const notebookAction = useMemo(() => {
    if (!notebookInfo?.status || Constants.flags.onprem) return <></>;

    let content = <></>;
    if ([NotebookLifecycle.SAVING_FAILED, NotebookLifecycle.DEPLOYING_FAILED, NotebookLifecycle.INITIALIZING_FAILED, NotebookLifecycle.FAILED, NotebookLifecycle.STOPPED].includes(notebookInfo?.status)) {
      content = (
        <Button size={'small'} className={styles.openBtn} type={'primary'} onClick={() => onNotebookAction(false)}>
          Start
        </Button>
      );
    } else if ([NotebookLifecycle.ACTIVE].includes(notebookInfo?.status)) {
      content = (
        <Button size={'small'} type={'primary'} className={styles.openBtn} onClick={() => onNotebookAction(true)}>
          Stop
        </Button>
      );
    }

    return <span className={styles.nbAction}>{content}</span>;
  }, [notebookInfo]);

  const spinner = useMemo(() => {
    if (!notebookInfo?.status || Constants.flags.onprem) return <></>;

    let content = <></>;
    if ([NotebookLifecycle.SAVING, NotebookLifecycle.DEPLOYING, NotebookLifecycle.INITIALIZING, NotebookLifecycle.FAILED, NotebookLifecycle.STOPPING].includes(notebookInfo?.status)) {
      content = <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faArrowsRotate').faArrowsRotate} spin />;
    }

    return <span className={styles.nbAction}>{content}</span>;
  }, [notebookInfo]);

  const notebookDetailsInfo = useMemo(
    () =>
      notebookInfo
        ? [
            {
              title: 'Notebook Id:',
              value: <CopyText>{notebookInfo?.notebookId}</CopyText>,
              component: <></>,
            },
            {
              title: 'Execute File Name:',
              value: notebookInfo?.executeFilename,
            },
            {
              title: 'Projects:',
              value: projectsAttached,
            },
          ]
        : [],
    [notebookInfo],
  );

  const jupyterInfo = useMemo(
    () =>
      notebookInfo
        ? [
            {
              title: 'Last Started At:',
              value: notebookInfo?.startedAt ? <DateOld always date={notebookInfo?.startedAt} /> : '-',
            },
            {
              title: 'Status:',
              value: <span className={styles.camelTxt}>{notebookInfo?.status}</span>,
              component: spinner,
            },
            {
              title: 'Memory:',
              value: notebookInfo?.memory,
            },
            {
              title: 'GPU Enabled:',
              value: notebookInfo?.gpuEnabled ? 'Yes' : 'No',
              component: !Constants.flags.onprem && (
                <FontAwesomeIcon className={styles.gpuEdit} icon={require('@fortawesome/pro-solid-svg-icons/faPenToSquare').faPenToSquare} onClick={() => showGpuChangeDialog(notebookId, notebookInfo?.gpuEnabled)} />
              ),
            },
          ]
        : [],
    [notebookInfo],
  );

  const getNotebookVersions = useCallback(async () => {
    if (notebookVersionsAvailableRef.current) return;

    try {
      const res = await REClient_.promises_()._listNotebookVersions(notebookId);
      if (!res?.success) {
        REActions.addNotificationError(Constants.errorDefault);
        return;
      }
      notebookVersionsAvailableRef.current = true;
      setNotebookVersions(res?.result || []);
      setIsLoading(false);
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
      setIsLoading(false);
    }
  }, [notebookId]);

  const getNotebookList = useCallback(async () => {
    if (notebookAvailableRef.current || !projectId) return;

    try {
      const res = await REClient_.promises_()._listNotebooks(projectId);
      if (!res?.success) {
        REActions.addNotificationError(Constants.errorDefault);
        return;
      }
      notebookAvailableRef.current = true;
      setNotebookList(res?.result || []);
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
    }
  }, [projectId]);

  const onNotebookChange = ({ value }) => Location.push(`/${PartsLink.notebook_details}/${projectId || '-'}/${value}`);
  const notebookOptions = useMemo(() => notebookList.map((notebook) => ({ value: notebook?.notebookId, label: notebook?.name, name: notebook?.name })), [notebookList]);
  const selectedNotebook = useMemo(() => notebookOptions.find((notebook) => notebook?.value === notebookId), [notebookOptions, notebookId]);

  useEffect(() => {
    if (!notebookId) return;

    setIsLoading(true);
    notebookAvailableRef.current = false;
    notebookVersionsAvailableRef.current = false;
    StoreActions.describeNotebook_(notebookId);
    getNotebookVersions();
    getNotebookList();
  }, [notebookId, projectId]);

  useEffect(() => {
    const tempStatus = notebookInfo?.status;
    setStatus(tempStatus);
    if (notebookVersionsAvailableRef.current && notebookInfo.activeNotebookVersion !== notebookVersions[0]?.notebookVersion) {
      notebookVersionsAvailableRef.current = false;
      getNotebookVersions();
    }
    if (notebookInprogressLifeCycleList.includes(tempStatus) && notebookId != null) {
      StoreActions.refreshDoNotebookAll_(notebookId);
    }
  }, [notebookInfo?.status, notebookId]);

  if (!notebookInfo) return null;

  return (
    <div className={classNames(globalStyles.absolute, styles.container)}>
      <AutoSizer disableWidth>
        {({ height }) => (
          <div style={{ height }}>
            <NanoScroller onlyVertical ref={refScrollerVersions}>
              <RefreshAndProgress isDim={isLoading} isMsgAnimRefresh={isLoading} msgMsg={isLoading ? 'Loading...' : ''}>
                <div style={{ height: topAfterHeaderHH }} className={styles.headerContainer}>
                  <div className={styles.titleContainer}>
                    <span>Notebook details</span>
                    {projectId ? <span className={styles.selectContainer}>{notebookList.length ? <SelectExt value={selectedNotebook} options={notebookOptions} onChange={onNotebookChange} isSearchable={true} /> : <></>}</span> : <></>}
                    <span
                      css={`
                        flex: 1;
                      `}
                    ></span>
                  </div>
                  <span>
                    <ModalConfirm onConfirm={onDelete} title={`Do you want to delete the Notebook?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>
                      <Button danger ghost style={{ height: '30px', padding: '0 16px', borderColor: 'transparent' }}>
                        Delete
                      </Button>
                    </ModalConfirm>
                  </span>
                </div>
                {/* <p>{JSON.stringify(notebookList, null, 2)}</p> */}
                <div className={classNames(globalStyles.backdetail, styles.detailsContainer)}>
                  <span className={styles.notebookIcon}>
                    <img width={40} src={calcImgSrc('/imgs/notebookIcon.webp')} alt="Notebook icon" />
                  </span>
                  <div className={styles.details}>
                    <DetailHeader>{notebookInfo?.name || ''}</DetailHeader>
                    {notebookDetailsInfo?.map(
                      (detail) =>
                        detail?.value && (
                          <div>
                            <DetailName>{detail?.title}</DetailName>
                            <DetailValue>{detail?.value}</DetailValue>
                            {detail?.component || null}
                          </div>
                        ),
                    )}
                    {notebookInfo?.executeFilename && (
                      <div>
                        <DetailName>Refresh Schedules:</DetailName>
                        <NotebookRefreshSchedules notebookId={notebookId} projectId={projectId} onPolicyDelete={onPolicyDelete} refreshSchedules={notebookInfo?.refreshSchedules || []} />
                      </div>
                    )}
                    <DetailName>Jupyter Notebook Info:</DetailName>
                    <div className={styles.padLeft}>
                      {jupyterInfo?.map(
                        (detail) =>
                          detail?.value && (
                            <div>
                              <DetailName>{detail?.title}</DetailName>
                              <DetailValue>{detail?.value}</DetailValue>
                              {detail?.component || null}
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                  <div className={styles.rightContainer}>
                    <DetailCreatedAt>Created At: {<DateOld always date={notebookInfo?.createdAt || ''} />}</DetailCreatedAt>
                    <div
                      css={`
                        display: flex;
                        gap: 16px;
                      `}
                    >
                      {!Constants.flags.onprem && (
                        <Button className={styles.openBtn} type={'primary'} onClick={() => Location.push(`/${PartsLink.notebook_one}/${projectId ?? '-'}/${notebookId}`)}>
                          Open in Jupyter
                        </Button>
                      )}
                      <Button className={styles.openBtn} type={'primary'} onClick={() => Location.push(`/${PartsLink.fast_notebook}/${projectId ?? '-'}/${notebookId}`)}>
                        Open in Abacus Notebook
                      </Button>
                    </div>
                    {notebookAction}
                  </div>
                </div>

                <div className={styles.activeVersionsContainer}>
                  <div className={styles.activeVersionsHeader}>
                    <span className={globalStyles.titleTopHeaderAfter}>Notebook versions</span>
                  </div>
                  <TableExt noHover isDetailTheme showEmptyIcon disableSort dataSource={notebookVersions} columns={notebookVersionColumns} calcKey={(r1) => r1.notebookVersion} />
                </div>
              </RefreshAndProgress>
            </NanoScroller>
          </div>
        )}
      </AutoSizer>
    </div>
  );
};

export default NotebookDetails;
