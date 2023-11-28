import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useDatasetVersion } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import datasetsReq, { DatasetLifecycle } from '../../stores/reducers/datasets';
import { memProjectById } from '../../stores/reducers/projects';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';

const s = require('./NeedSnapshotDataset.module.css');
const sd = require('../antdUseDark.module.css');

interface INeedSnapshotDatasetProps {}

const NeedSnapshotDataset = React.memo((props: PropsWithChildren<INeedSnapshotDatasetProps>) => {
  const { paramsProp, datasets, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    datasets: state.datasets,
    projectsParam: state.projects,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = paramsProp?.get('projectId');
  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  let datasetVersion = paramsProp?.get('datasetVersion');
  if (datasetVersion === '' || datasetVersion === '-') {
    datasetVersion = null;
  }

  const datasetId = paramsProp?.get('datasetId');
  useEffect(() => {
    if (datasetId) {
      datasetsReq.memDatasetListCall(true, undefined, [datasetId]);
    }
  }, [datasetId, datasets]);
  const datasetFound = useMemo(() => {
    if (datasetId) {
      let res1 = datasetsReq.memDatasetListCall(false, undefined, [datasetId]);
      return res1?.[datasetId];
    } else {
      return null;
    }
  }, [datasetId, datasets]);

  const datasetVersioOne = useDatasetVersion(datasetId, datasetVersion);

  const isStreaming = datasetFound?.get('sourceType') === 'streaming';

  const [lastCount, setLastCount] = useState(null as number);
  const isDatasetEmpty = useMemo(() => {
    if (lastCount == null) {
      return null;
    } else {
      return lastCount === 0;
    }
  }, [lastCount]);
  useEffect(() => {
    if (datasetId && isStreaming) {
      REClient_.client_()._getCurrentHourRowCount(datasetId, (err, res) => {
        if (err || !res?.success) {
          setLastCount(0);
        } else {
          const c1 = res?.result;
          if (_.isNumber(c1)) {
            setLastCount(c1);
          } else if (_.isObject(c1)) {
            setLastCount((c1 as any).count ?? 0);
          } else {
            setLastCount(0);
          }
        }
      });
    }
  }, [datasetId]);

  useEffect(() => {
    if (datasetId) {
      datasetsReq.memDatasetListVersions(true, undefined, datasetId);
    }
  }, [datasetId, datasets]);
  const datasetVersionsFound = useMemo(() => {
    if (datasetId) {
      return datasetsReq.memDatasetListVersions(false, undefined, datasetId);
    } else {
      return null;
    }
  }, [datasetId, datasets]);

  const { showError, showContent, showProgress, lastError }: { lastError?; showProgress?; showError?; showContent? } = useMemo(() => {
    let versionList = null,
      lastError = null;
    if (datasetVersionsFound != null) {
      versionList = datasetVersionsFound.filter((v1) => [DatasetLifecycle.COMPLETE].includes(v1.status));
      lastError = datasetVersionsFound.find((v1) => !Utils.isNullOrEmpty(v1.error))?.error;
    }

    let status1 = datasetVersioOne?.status ?? datasetFound?.get('status');

    if (datasetFound == null || datasetVersionsFound == null) {
      return {};
    } else if ([DatasetLifecycle.IMPORTING, DatasetLifecycle.INSPECTING, DatasetLifecycle.UPLOADING, DatasetLifecycle.CONVERTING].includes(status1 ?? '___')) {
      return { showContent: true };
    } else if (!isStreaming) {
      return { showContent: true };
    } else if (isStreaming && versionList.length === 0) {
      return { showError: true, lastError };
    } else {
      return { showContent: true };
    }
  }, [datasetVersionsFound, datasetFound, isStreaming, datasetVersioOne]);

  const onClickErrorButton = (e) => {
    //
  };
  const onClickSnapshotStreaming = (e) => {
    let datasetId = paramsProp?.get('datasetId');
    let projectId = paramsProp?.get('projectId');

    if (datasetId) {
      REClient_.client_().snapshotStreamingData(datasetId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.listDatasetsVersions_(datasetId, () => {
            StoreActions.getProjectsList_();
            StoreActions.listDatasets_([datasetId]);
            StoreActions.getProjectsById_(projectId);
            StoreActions.getProjectDatasets_(projectId);
            StoreActions.listModels_(projectId);
            StoreActions.validateProjectDatasets_(projectId);

            StoreActions.refreshDoDatasetAll_(datasetId, projectId);
          });
        }
      });
    }
  };

  const errorButtonProcess = (button) => {
    return (
      <ModalConfirm
        onConfirm={onClickSnapshotStreaming}
        title={`Do you want to snapshot the current streaming data?`}
        icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
        okText={'Snapshot'}
        cancelText={'Cancel'}
        okType={'primary'}
      >
        {button}
      </ModalConfirm>
    );
  };

  if (showProgress) {
    return (
      <RefreshAndProgress
        msgMsg={
          (isStreaming ? (
            <span>
              Processing Snapshot...
              <br />
              This process make take a few hours, check back later...
            </span>
          ) : (
            'Processing Dataset...'
          )) as any
        }
      ></RefreshAndProgress>
    );
  } else if (showContent) {
    return <>{props.children}</>;
  } else if (showError) {
    let error1 = null,
      errorButtonText1 = null,
      onClickErrorButton1 = null;
    if (!Utils.isNullOrEmpty(lastError)) {
      error1 = (
        <span>
          The last snapshot has errors:
          <br />
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>{lastError ?? ''}</div>
        </span>
      );
    } else {
      error1 = 'You must create a snapshot before you can view this tab';
      if (isDatasetEmpty === true) {
        error1 = 'To view snapshotted data, you must send a significant number of rows of data, and train a model first. To see live data that is being sent to the system, please use the streaming data console.';
        errorButtonText1 = 'Streaming Data Console';
        onClickErrorButton1 = (e) => {
          Location.push('/' + PartsLink.dataset_streaming + '/' + datasetId + '/' + paramsProp?.get('projectId'));
        };
      }
    }
    if (isDatasetEmpty == null) {
      return null;
    } else if (isDatasetEmpty === true) {
      return <RefreshAndProgress errorMsg={error1} errorButtonText={errorButtonText1} onClickErrorButton={onClickErrorButton1}></RefreshAndProgress>;
    } else {
      return <RefreshAndProgress errorButtonProcess={errorButtonProcess} errorButtonText={'Generate Snapshot'} errorMsg={error1} onClickErrorButton={onClickErrorButton}></RefreshAndProgress>;
    }
  } else {
    return null;
  }
});

export default NeedSnapshotDataset;
