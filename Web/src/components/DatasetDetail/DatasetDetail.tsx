import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import { Button } from '../../DesignSystem/Button/Button';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import REUploads_ from '../../api/REUploads';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import datasetsReq, { calcDatasetById, DatasetLifecycle, DatasetLifecycleDesc } from '../../stores/reducers/datasets';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import CronOne from '../CronOne/CronOne';
import DateIgnoreDateBeforeExt from '../DateIgnoreDateBeforeExt/DateIgnoreDateBeforeExt';
import DateOld from '../DateOld/DateOld';
import EditElemSpan from '../EditElemSpan/EditElemSpan';
import EditNumberSpan from '../EditNumberSpan/EditNumberSpan';
import InvalidRecordsTable from '../InvalidRecordsTable/InvalidRecordsTable';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModalConfirmCreateNewVersion from '../ModalConfirmCreateNewVersion/ModalConfirmCreateNewVersion';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import styles from './DatasetDetail.module.css';
import globalStyles from '../antdUseDark.module.css';
const { confirm } = Modal;

interface IDatasetDetailProps {
  datasets?: any;
  projectDatasets?: any;
  paramsProp?: any;
  projects?: any;
}

interface IDatasetDetailState {
  isRefreshing?: boolean;
  externalLocationEdit?: string;
  versionsList?: any[];
}

class DatasetDetail extends React.PureComponent<IDatasetDetailProps, IDatasetDetailState> {
  private writeDeleteMeConfirm: any;
  private isM: boolean;
  private refScrollerVersions = React.createRef<any>();
  private unUploadRefresh = null;
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.unUploadRefresh = REActions.uploadsRefresh.listen(this.refreshOnUploadsRefresh);
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.unUploadRefresh?.();
    this.isM = false;
  }

  componentDidUpdate(prevProps: Readonly<IDatasetDetailProps>, prevState: Readonly<IDatasetDetailState>, snapshot?: any) {
    this.doMem();
  }

  getVersionsLastVersion = null;
  getVersionsIsProcessing = false;
  getVersionsNoMore = false;
  getVersions = (reset = false) => {
    if (reset) {
      this.getVersionsNoMore = false;
      this.getVersionsLastVersion = null;
    }

    if (this.getVersionsIsProcessing || this.getVersionsNoMore) {
      return;
    }

    const pageCount = 50;

    this.getVersionsIsProcessing = true;

    const datasetId = this.props.paramsProp?.get('datasetId');
    REClient_.client_().listDatasetVersions(datasetId, pageCount, this.getVersionsLastVersion, (err, res) => {
      let oldList = reset ? [] : this.state.versionsList ?? [];
      let list = oldList.concat(res?.result ?? []);

      if (res?.result == null || res?.result?.length === 0) {
        this.getVersionsNoMore = true;
      } else {
        if (list != null && list.length > 0) {
          let last1 = list[list.length - 1]?.datasetVersion;
          this.getVersionsLastVersion = last1;
          if (last1 == null) {
            this.getVersionsNoMore = true;
          }
        }
      }

      this.setState({
        versionsList: list,
      });
      this.getVersionsIsProcessing = false;
    });
  };

  getVersionsMore = (perc) => {
    this.getVersions();
  };

  refreshOnUploadsRefresh = () => {
    this.forceUpdate();
    this.getVersions(true);
  };

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      return null;
    } else {
      return projectId;
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    const projectId = this.calcProjectId();
    const datasetId = this.props.paramsProp?.get('datasetId');

    this.memDatasetId(datasetId);

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let listDatasetsProj = this.memProjectDatasets(true)(this.props.projectDatasets, projectId);
    let listDatasets = this.memDatasetsList(true)(this.props.datasets, listDatasetsProj, datasetId);
    // let versionsList = this.memDatasetListVersions(true)(this.props.datasets, datasetId);
  };

  memDatasetId = memoizeOne((id) => {
    this.getVersions(true);
  });

  onClickDeleteDataset = (e) => {
    let { datasets, paramsProp } = this.props;
    let datasetFound = null;
    if (paramsProp && paramsProp.get('datasetId')) {
      datasetFound = calcDatasetById(undefined, paramsProp.get('datasetId'));
      let datasetId = datasetFound.getIn(['dataset', 'datasetId']);
      if (Utils.isNullOrEmpty(datasetId)) {
        return;
      }

      this.writeDeleteMeConfirm = '';

      confirm({
        title: 'Are you sure you want to delete this dataset?',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        maskClosable: true,
        content: (
          <div>
            <div>{'Dataset name: "' + datasetFound.get('featureGroupTableName') + '"'}</div>
            <div style={{}}>
              Write {'"'}delete me{'"'} inside the box to confirm
            </div>
            <Input
              style={{ marginTop: '8px', color: 'red' }}
              placeholder={'delete me'}
              defaultValue={''}
              onChange={(e) => {
                this.writeDeleteMeConfirm = e.target.value;
              }}
            />
          </div>
        ),
        onOk: () => {
          if (this.writeDeleteMeConfirm === 'delete me') {
            //delete it
            REActions.addNotification('Deleting dataset...');

            REClient_.client_().delete_dataset(datasetId, (err, res) => {
              if (err) {
                REActions.addNotificationError(err);
              } else {
                REActions.addNotification('Dataset Deleted!');

                StoreActions.refreshDatasetUntilStateCancel_(datasetId);
                StoreActions.getProjectsList_();
                StoreActions.listDatasets_([datasetId]);
                StoreActions.getProjectsById_(this.props.paramsProp?.get('projectId'));

                Location.push('/' + PartsLink.dataset_list);
              }
            });
          } else {
            REActions.addNotificationError('You need to write "delete me" to delete the dataset');
            this.onClickDeleteDataset(null);
          }
        },
        onCancel: () => {
          //
        },
      });
    }
  };

  onClickRefreshDataset = (e) => {
    REActions.addNotification('Not implemented!'); //TODO
  };

  memDatasetsOptions = memoizeOne((listDatasets) => {
    let optionsDatasets = [];
    if (listDatasets) {
      Object.values(listDatasets).some((p1: Immutable.Map<string, any>) => {
        let obj1 = {
          value: p1.getIn(['dataset', 'datasetId']),
          label: <span style={{ fontWeight: 600 }}>{p1.get('featureGroupTableName') as any}</span>,
          name: p1.get('featureGroupTableName'),
        };
        optionsDatasets.push(obj1);
      });
    }

    optionsDatasets &&
      optionsDatasets.sort((a, b) => {
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      });

    return optionsDatasets;
  });

  onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let { paramsProp } = this.props;

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let p1 = paramsProp && paramsProp.get('projectId');
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '';
      }
      Location.push('/' + mode + '/' + optionSel.value + p1);
    }
  };

  onClickDeleteFromProject = (projectId, e) => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');

    if (datasetId) {
      const doDelete = () => {
        REClient_.client_().delete_dataset(paramsProp.get('datasetId'), (err, res) => {
          if (err) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            REActions.addNotification('Deleted!');

            REUploads_.client_().removeFileByDatasetId(datasetId);

            StoreActions.refreshDatasetUntilStateCancel_(datasetId);

            StoreActions.getProjectsList_();
            StoreActions.listDatasets_([datasetId]);
            if (projectId) {
              StoreActions.getProjectsById_(projectId);
              StoreActions.validateProjectDatasets_(projectId);
              StoreActions.getProjectDatasets_(projectId);
              StoreActions.listModels_(projectId);
              StoreActions.featureGroupsGetByProject_(projectId);
            }

            if (projectId == null) {
              Location.push('/' + PartsLink.datasets_all);
            } else {
              Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
            }
          }
        });
      };

      if (projectId == null) {
        doDelete();
      } else {
        REClient_.client_().removeDatasetFromProject(projectId, datasetId, (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            doDelete();
          }
        });
      }
    }
  };

  onClickRemoveFromProject = (e) => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = this.calcProjectId();

    if (datasetId && projectId) {
      let datasetFound = calcDatasetById(undefined, paramsProp.get('datasetId'));
      if (datasetFound) {
        REActions.addNotification('Removing dataset...');

        REClient_.client_().removeDatasetFromProject(projectId, datasetFound.getIn(['dataset', 'datasetId']), (err, res) => {
          if (err) {
            REActions.addNotificationError('Error: ' + err);
          } else {
            REActions.addNotification('Detached!');

            REUploads_.client_().removeFileByDatasetId(datasetId);

            StoreActions.refreshDatasetUntilStateCancel_(datasetId);

            StoreActions.validateProjectDatasetsReset_();
            StoreActions.getProjectsList_();
            StoreActions.listDatasets_([datasetId]);
            StoreActions.getProjectsById_(projectId);
            StoreActions.validateProjectDatasets_(projectId);
            StoreActions.getProjectDatasets_(projectId);
            StoreActions.listModels_(projectId);

            Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
          }
        });
      }
    }
  };

  onCreateNewCron = () => {};

  onChangeIgnoreDateBefore = (newDate) => {
    StoreActions.getProjectsList_();

    let datasetId = this.props.paramsProp?.get('datasetId');
    StoreActions.listDatasets_([datasetId]);

    let projectId = this.calcProjectId();
    if (projectId) {
      StoreActions.getProjectsById_(projectId);
      StoreActions.getProjectDatasets_(projectId);
    }
  };

  onExternalServiceEditLocationOnEdit = (lastLoc) => {
    this.setState({
      externalLocationEdit: lastLoc ?? '',
    });
  };

  onExternalServiceEditLocationSet = () => {
    let datasetId = this.props.paramsProp?.get('datasetId');
    let projectId = this.calcProjectId();

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    REClient_.client_().importDatasetVersion(datasetId, this.state.externalLocationEdit, null, null, false, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        this.getVersions(true);

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
  };

  onExternalServiceEditLocationOnChange = (e) => {
    let v1 = e.target.value;
    this.setState({
      externalLocationEdit: v1,
    });
  };

  memDataList: (datasetFound, foundProject1) => { databaseConnectorId?; serviceType?; createdAt?; dataList?; sourceType? } = (datasetFound, foundProject1) => {
    if (!datasetFound) {
      return null;
    }

    let schemaValues = _.isString(datasetFound.get('schemaValues')) ? Utils.tryJsonParse(datasetFound.get('schemaValues')) : datasetFound.get('schemaValues')?.toJS();

    const sampleS3prefix = 's3://abacusai.exampledatasets/';
    const oldSampleS3prefix = 's3://realityengines.exampledatasets/';
    let sourceType = datasetFound?.get('sourceType')?.toLowerCase();
    let incremental = datasetFound?.get('incremental');
    let serviceType = datasetFound?.get('service');
    let incrementalTimestampColumn = datasetFound?.get('databaseConnectorConfig')?.get('timestampColumn');
    let databaseConnectorId = datasetFound?.get('databaseConnectorId');
    if (sourceType === 'external_service') {
      if (_.startsWith(datasetFound.getIn(['location']) ?? '', sampleS3prefix) || _.startsWith(datasetFound.getIn(['location']) ?? '', oldSampleS3prefix)) {
        sourceType = 'sample';
      }
    }
    const isStreaming = sourceType === 'streaming';

    let createdAt = datasetFound.get('createdAt');
    if (createdAt != null) {
      createdAt = moment(createdAt);
      if (!createdAt.isValid()) {
        createdAt = null;
      }
    } else {
      createdAt = null;
    }

    let datasetId = datasetFound?.getIn(['dataset', 'datasetId']);

    let ignoreDateBefore = datasetFound?.get('ignoreBefore');
    ignoreDateBefore = ignoreDateBefore == null ? null : moment.utc(ignoreDateBefore).local();
    let ignoreDateBeforeRender = (
      <span>
        <DateIgnoreDateBeforeExt datasetId={datasetId} date={ignoreDateBefore} onChange={this.onChangeIgnoreDateBefore} />
      </span>
    );

    const onChangeLookbackDays = (v1) => {
      REClient_.client_().setDatasetLookbackDays(datasetId, v1 ?? 0, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        }

        StoreActions.listDatasets_([datasetId]);
      });
    };

    const onChangeEphemeral = (v1) => {
      REClient_.client_().setDatasetEphemeral(datasetId, v1, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        }

        StoreActions.listDatasets_([datasetId]);
      });
    };

    let projectId = this.calcProjectId();

    let sqlQuery = datasetFound?.get('rawQuery') ?? '';
    if (Utils.isNullOrEmpty(sqlQuery)) {
      sqlQuery = null;
    }

    let dataList: any[] = [
      {
        id: 111,
        name: 'Dataset ID',
        value: <CopyText>{datasetId}</CopyText>,
      },
      {
        id: 2,
        name: 'Data Source',
        value: sourceType === 'sample' ? 'Samples' : sourceType === 'upload' ? 'Uploaded File' : sourceType === 'streaming' ? 'Streaming' : serviceType != null ? serviceType.toUpperCase() : 'File Connector',
      },
      {
        id: 21111,
        name: 'Is Document',
        value: <span>{datasetFound?.get('isDocumentset') ? 'Yes' : 'No'}</span>,
      },
      {
        id: 21112,
        name: 'Merge File Schemas',
        value: <span>{datasetFound?.get('mergeFileSchemas') ? 'Yes' : 'No'}</span>,
      },
      {
        id: 3,
        name: 'File Size',
        value: Utils.prettyPrintNumber(datasetFound?.get('size'), undefined, false),
        hidden: incremental || (sourceType === 'streaming' && !datasetFound?.get('size')),
      },
      {
        id: 4,
        name: 'Number of Rows',
        value: schemaValues?.rowCount == null && datasetFound?.get('rowCount') == null ? '-' : Utils.prettyPrintNumber(schemaValues?.rowCount ?? datasetFound?.get('rowCount') ?? 0),
        hidden: incremental || (sourceType === 'streaming' && !datasetFound?.get('size')),
      },
      {
        id: 23,
        name: 'Incremental',
        value: 'Yes',
        hidden: !incremental,
      },
      {
        id: 24,
        name: 'Incremental Timestamp Column',
        value: incrementalTimestampColumn,
        hidden: incrementalTimestampColumn == null,
      },
      {
        id: 20,
        name: 'Ignore Data Sent Before this Time',
        value: ignoreDateBeforeRender,
        hidden: !isStreaming /*|| !datasetFound?.get('size')*/,
      },
      // {
      //   id: 21,
      //   name: 'Ephemeral',
      //   value: <EditYesNoSpan value={datasetFound?.get('ephemeral')} onChange={onChangeEphemeral} />,
      //   hidden: !isStreaming,
      // },
      {
        id: 22,
        name: 'Consider data that is only',
        value: (
          <span>
            <EditNumberSpan allowClear={true} suffix={'days old'} value={datasetFound?.get('lookbackDays')} onChange={onChangeLookbackDays} onNullShow={'-'} onZeroShow={'-'} min={1} max={90} />
          </span>
        ),
        hidden: !isStreaming,
      },
    ].filter((v1) => v1 != null && !v1.hidden);
    if (sourceType === 'external_service' || serviceType === 'snowflake') {
      let ds1 = datasetFound.getIn(['dataSource']);
      let databaseConnectorId = datasetFound?.getIn(['databaseConnectorId']);
      if (databaseConnectorId) {
        dataList.push({
          id: 5,
          name: 'Database Connector ID',
          value: <CopyText>{databaseConnectorId}</CopyText>,
        });
      }
      let connectorType = datasetFound?.get('connectorType')?.toUpperCase();
      dataList.push({
        id: 6,
        name: 'External Location',
        value: (
          <span
            css={`
              display: inline-flex;
              align-items: center;
            `}
          >
            {connectorType === 'FILE' && (
              <EditElemSpan value={ds1 ?? ''} setText={'Set and Import'} onSet={this.onExternalServiceEditLocationSet} onEdit={this.onExternalServiceEditLocationOnEdit.bind(this, ds1)}>
                <span
                  css={`
                    width: 300px;
                    display: inline-block;
                  `}
                >
                  <Input value={this.state.externalLocationEdit} onChange={this.onExternalServiceEditLocationOnChange} />
                </span>
              </EditElemSpan>
            )}
            {connectorType !== 'FILE' && <span>{ds1 ?? '-'}</span>}
            {(sourceType === 'external_service' || serviceType === 'snowflake') && sqlQuery != null && serviceType && !Utils.isNullOrEmpty(databaseConnectorId) && (
              <Link to={['/' + PartsLink.dataset_external_import_new_version + '/' + datasetId + '/' + (projectId ?? '-'), 'view=true&fromScreen=datasetDetail']}>
                <Button type="primary" ghost style={{ marginLeft: '10px', height: '30px', padding: '0 16px' }}>
                  View SQL
                </Button>
              </Link>
            )}
          </span>
        ),
      });

      let columns = datasetFound.getIn(['columns']);
      if (columns) {
        dataList.push({
          id: 7,
          name: 'Query Columns',
          value: columns ?? '*',
        });
      }
      let queryArgs = datasetFound.getIn(['queryArguments']);
      if (queryArgs) {
        dataList.push({
          id: 8,
          name: 'Query Arguments',
          value: queryArgs,
        });
      }
    }
    if (datasetFound.get('error')) {
      dataList.push({
        id: 9,
        name: 'Error',
        color: 'red',
        value: datasetFound.get('error'),
      });
    }
    if (datasetFound?.get('featureGroupTableName')) {
      let fgTN = <CopyText>{datasetFound?.get('featureGroupTableName')}</CopyText>;
      if (datasetFound?.get('featureGroupId') != null) {
        fgTN = (
          <Link showAsLink to={'/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + datasetFound?.get('featureGroupId')}>
            {fgTN}
          </Link>
        );
      }
      dataList.push({
        id: 2333,
        name: 'Feature Group Table Name',
        value: <span>{fgTN}</span>,
      });
    }

    let refreshSchedules = datasetFound?.getIn(['refreshSchedules'])?.toJS();
    if (['sample', 'external_service'].includes(sourceType) || isStreaming) {
      const onArray = (v1) => {
        if (v1 == null) {
          return v1;
        } else {
          return [v1];
        }
      };

      dataList.push({
        id: 500,
        name: 'Refresh Schedules',
        value: (
          <div>
            {refreshSchedules?.map((d1, d1ind) => {
              return (
                <div key={'cron_' + d1ind} style={{ margin: '3px 0 3px 30px' }}>
                  <CronOne
                    projectId={this.props.paramsProp?.get('projectId')}
                    datasetIds={onArray(this.props.paramsProp?.get('datasetId'))}
                    onPlayNow={this.onPlayRefreshSchedule}
                    onDeleteDone={this.onDeleteRefreshSchedule}
                    refreshPolicyId={d1?.refresh_policy_id || d1?.refreshPolicyId}
                    cron={d1?.cron}
                    error={d1?.error}
                    nextRun={d1?.next_run_time || d1?.nextRunTime}
                    refreshType={d1?.refresh_type || d1?.refreshType}
                  />
                </div>
              );
            })}
            {this.props.paramsProp?.get('datasetId') != null && (
              <div style={{ margin: '3px 0 3px 30px' }}>
                <CronOne isNew projectId={this.props.paramsProp?.get('projectId')} datasetIds={onArray(this.props.paramsProp?.get('datasetId'))} onPlayNow={this.onPlayRefreshSchedule} onCreateNew={this.onCreateNewCron} />
              </div>
            )}
          </div>
        ),
      });
    }

    if (datasetFound?.get('isDocumentset')) {
      // insert extract bounding boxes in the list just next to 'Is Document'
      const isDocumentsetIndex = dataList.findIndex((d) => d.name === 'Is Document');
      if (isDocumentsetIndex > -1) {
        dataList.splice(isDocumentsetIndex + 1, 0, {
          id: 21113,
          name: 'Extract Bounding Boxes',
          value: <span>{datasetFound?.get('extractBoundingBoxes') ? 'Yes' : 'No'}</span>,
        });
      }
    }

    return { dataList, sourceType, createdAt, serviceType, databaseConnectorId };
  };

  onDeleteRefreshSchedule = () => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = this.calcProjectId();

    StoreActions.getProjectsList_();
    StoreActions.listDatasets_([datasetId]);
    if (projectId) {
      StoreActions.getProjectsById_(projectId);
      StoreActions.getProjectDatasets_(projectId, (res, ids) => {
        ids?.some((id1) => {
          StoreActions.listDatasetsVersions_(id1);
        });
      });
    }
  };

  onPlayRefreshSchedule = () => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = this.calcProjectId();

    StoreActions.getProjectsList_();
    StoreActions.listDatasets_([datasetId]);
    if (projectId) {
      StoreActions.getProjectsById_(projectId);
      StoreActions.getProjectDatasets_(projectId, (res, ids) => {
        ids?.some((id1) => {
          StoreActions.listDatasetsVersions_(id1);
        });
      });
    }
  };

  // memDatasetListVersions = memoizeOneCurry((doCall, datasetsParam, datasetId) => {
  //   return datasets.memDatasetListVersions(doCall, undefined, datasetId);
  // });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onClickReadNewVersion = (newLocation, mergeFileSchemas, e) => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = this.calcProjectId();

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    if (datasetId) {
      this.setState({
        isRefreshing: true,
      });
      REClient_.client_().importDatasetVersion(datasetId, newLocation, null, null, mergeFileSchemas, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          this.getVersions(true);

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

  onClickReadNewVersionDatabaseConnector = (e) => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = this.calcProjectId();

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    if (datasetId) {
      this.setState({
        isRefreshing: true,
      });
      REClient_.client_().importDatasetVersionFromDatabaseConnector(datasetId, null, null, null, null, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

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

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, projectId) => {
    return projectDatasetsReq.memDatasetsByProjectId(doCall, projectDatasets, projectId);
  });

  memDatasetsList = memoizeOneCurry((doCall, datasets, listDatasets, datasetId) => {
    let ids = listDatasets?.map((d1) => d1.dataset?.datasetId);
    if (datasetId) {
      ids = ids ?? [];
      if (!ids.includes(datasetId)) {
        ids = ids.concat(datasetId);
      }
    }
    if (ids != null) {
      return datasetsReq.memDatasetListCall(doCall, datasets, ids);
    }
  });

  onClickSnapshotStreaming = (e) => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = this.calcProjectId();

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    if (datasetId) {
      this.setState({
        isRefreshing: true,
      });
      REClient_.client_().snapshotStreamingData(datasetId, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          this.getVersions(true);

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

  onClickCancelUpload = (datasetId, datasetVersion) => {
    StoreActions.refreshDatasetUntilStateCancel_(datasetId);

    REClient_.client_()._cancelDatasetUpload(datasetVersion, (err, res) => {
      REUploads_.client_().removeFileByDatasetId(datasetId);

      this.getVersions(true);

      StoreActions.listDatasets_([datasetId]);
      StoreActions.listDatasetsVersions_(datasetId);
      StoreActions.getProjectDatasets_(this.calcProjectId());

      setTimeout(() => {
        StoreActions.refreshDatasetUntilStateCancel_(datasetId);
      }, 100);
    });
  };

  memColsVersions = memoizeOne((datasetId, projectId, isStreaming) => {
    return [
      {
        title: 'Dataset Version',
        field: 'datasetVersion',
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
      },
      {
        title: 'Created',
        field: 'createdAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
      },
      {
        title: 'Inspecting Started',
        field: 'inspectingStartedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
      },
      {
        title: 'Inspecting Completed',
        field: 'inspectingCompletedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
      },
      {
        title: 'Status',
        field: 'status',
        render: (text, row, index) => {
          let isTraining = false;
          if ([DatasetLifecycle.IMPORTING, DatasetLifecycle.INSPECTING, DatasetLifecycle.CONVERTING, DatasetLifecycle.PENDING, DatasetLifecycle.UPLOADING].includes(row.status || '')) {
            isTraining = true;
            StoreActions.refreshDoDatasetAll_(datasetId, projectId);
          }

          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{DatasetLifecycleDesc[row.status ?? '']}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            if (row.error) {
              return (
                <div>
                  {DatasetLifecycleDesc[text]}
                  <TooltipExt placement="bottom" overlay={<span style={{ whiteSpace: 'pre-wrap' }}>{row.error}</span>}>
                    <FontAwesomeIcon icon={['far', 'exclamation-circle']} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, color: 'red', marginLeft: '6px' }} />
                  </TooltipExt>
                </div>
              );
            }
            return DatasetLifecycleDesc[text] || '-';
          }
        },
      },
      {
        title: 'Explore',
        field: null,
        width: 80,
        render: (text, row, index) => {
          if (![DatasetLifecycle.COMPLETE].includes(row.status || '')) {
            return null;
          }
          return (
            <Link
              usePointer
              className={globalStyles.styleTextBlue}
              forceSpanUse
              to={['/' + PartsLink.dataset_data_explorer + '/' + datasetId + (projectId ? '/' + projectId : ''), 'datasetVersion=' + encodeURIComponent(row.datasetVersion)]}
            >
              View
            </Link>
          );
        },
      },
      {
        title: 'Data',
        field: null,
        width: 80,
        render: (text, row, index) => {
          if (![DatasetLifecycle.COMPLETE].includes(row.status || '')) {
            return null;
          }
          return (
            <Link usePointer className={globalStyles.styleTextBlue} forceSpanUse to={['/' + PartsLink.dataset_raw_data + '/' + datasetId + (projectId ? '/' + projectId : ''), 'datasetVersion=' + encodeURIComponent(row.datasetVersion)]}>
              View
            </Link>
          );
        },
      },
      {
        title: '',
      },
      {
        title: 'Actions',
        noAutoTooltip: true,
        noLink: true,
        render: (text, row, index) => {
          let invalidRecordCount = row.invalidRecords?.invalidRecordCount;
          let isShowSnapshot = row.status == DatasetLifecycle.COMPLETE;
          let invalidRecordsElem = null;
          if (row.invalidRecords?.data != null) {
            let rows = row.invalidRecords?.data?.map((s1, s1ind) => ({ data: s1, index: s1ind }));
            if (rows?.length > 0) {
              invalidRecordsElem = (
                <div
                  css={`
                    padding: 20px;
                  `}
                >
                  <InvalidRecordsTable rows={rows} invalidRecordCount={invalidRecordCount} />
                </div>
              );
            }
          }

          return (
            <span>
              {invalidRecordsElem != null && (
                <ModalConfirm width={1000} title={invalidRecordsElem} icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />} okText={'Ok'} cancelText={null} okType={'primary'}>
                  <Button className={styles.actionsButton} type="default" ghost>
                    Invalid Records{invalidRecordCount == null ? null : ` (${Utils.prettyPrintNumber(invalidRecordCount)})`}
                  </Button>
                </ModalConfirm>
              )}
              {isShowSnapshot && (
                <Link to={['/' + PartsLink.dataset_snapshot + '/' + (datasetId ?? '-') + (projectId ? '/' + (projectId ?? '-') : ''), 'useDatasetVersion=' + encodeURIComponent(row.datasetVersion ?? '')]}>
                  <Button className={styles.actionsButton} type="primary" ghost>
                    Snapshot
                  </Button>
                </Link>
              )}
              {row.status == DatasetLifecycle.UPLOADING && (
                <Button className={styles.actionsButton} type="primary" ghost onClick={this.onClickCancelUpload.bind(this, datasetId, row.datasetVersion)}>
                  Cancel Upload
                </Button>
              )}
              {Constants.flags.show_log_links && (
                <span>
                  <br />
                  <Link newWindow to={'/api/v0/_getPipelineStageLogHtml?resourceId=' + encodeURIComponent(row.datasetVersion ?? '')} noApp>
                    <Button customType="internal" className={styles.actionsButton}>
                      Internal: View Logs
                    </Button>
                  </Link>
                  <Link newWindow to={'/api/v0/_getPipelineStageLog?resourceId=' + encodeURIComponent(row.datasetVersion ?? '')} noApp>
                    <Button customType="internal" className={styles.actionsButton}>
                      Internal: Download Logs
                    </Button>
                  </Link>
                </span>
              )}
            </span>
          );
        },
        width: 120,
      },
    ] as ITableExtColumn[];
  });

  onClickStarred = (datasetId, starred, e) => {
    REClient_.client_()._starDataset(datasetId, starred, (err, res) => {
      StoreActions.listDatasets_([datasetId]);
    });
  };

  render() {
    let { datasets, paramsProp } = this.props;
    let datasetFound = null;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = this.calcProjectId();
    let batchPredId = paramsProp && paramsProp.get('batchPredId');

    if (datasetId) {
      datasetFound = calcDatasetById(undefined, paramsProp.get('datasetId'));
    }
    let isStreaming = datasetFound?.get('sourceType')?.toLowerCase() === 'streaming';
    let showStreaming = !!datasetFound?.get('size');
    let dataList = null,
      sourceType = null,
      createdAt = null,
      serviceType = null,
      databaseConnectorId = null;

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    if (datasetFound) {
      let res1 = this.memDataList(datasetFound, foundProject1);
      dataList = res1?.dataList;
      sourceType = res1?.sourceType;
      createdAt = res1?.createdAt;
      serviceType = res1?.serviceType;
      databaseConnectorId = res1?.databaseConnectorId;
    }

    let datasetSelectValue = null;
    let optionsDatasets = [];
    if (datasets) {
      let listDatasetsProj = this.memProjectDatasets(false)(this.props.projectDatasets, paramsProp && paramsProp.get('projectId'));
      let listDatasets = this.memDatasetsList(false)(this.props.datasets, listDatasetsProj, datasetId);
      optionsDatasets = this.memDatasetsOptions(listDatasets);
      if (optionsDatasets && datasetFound) {
        datasetSelectValue = optionsDatasets.find((p1) => p1.value === datasetFound.getIn(['dataset', 'datasetId']));
      }
    }

    let isInProject = paramsProp && !Utils.isNullOrEmpty(paramsProp.get('projectId'));

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let datasetAndProjectPart = datasetId && projectId ? '/' + datasetId + '/' + projectId : null;
    let datasetAndProjectPartNoProject = datasetId ? '/' + datasetId : null;

    let versionsList = this.state.versionsList;

    const columnsVersions: ITableExtColumn[] = this.memColsVersions(this.props.paramsProp?.get('datasetId'), this.props.paramsProp?.get('projectId'), isStreaming);

    let datasetTypeS = null;
    datasetFound?.get('allProjectDatasets')?.some((pd1) => {
      if (pd1?.getIn(['project', 'projectId']) === projectId) {
        datasetTypeS = pd1.get('datasetType');
        return true;
      }
    });

    let sqlQuery = datasetFound?.get('rawQuery') ?? '';
    if (Utils.isNullOrEmpty(sqlQuery)) {
      sqlQuery = null;
    }

    return (
      <div className={globalStyles.absolute + ' ' + globalStyles.table} style={{ margin: '25px' }}>
        <NanoScroller onlyVertical ref={this.refScrollerVersions} onScrollBottom={this.getVersionsNoMore ? undefined : this.getVersionsMore}>
          <RefreshAndProgress isRefreshing={this.state.isRefreshing}>
            <div
              className={globalStyles.titleTopHeaderAfter}
              style={{ height: topAfterHeaderHH }}
              css={`
                display: flex;
              `}
            >
              <span>Datasets</span>
              <span style={{ display: projectId == null ? 'none' : 'inline-block', verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', fontSize: '12px' }}>
                <SelectExt isDisabled={!!batchPredId} value={datasetSelectValue} options={optionsDatasets} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
              </span>
              <span
                css={`
                  flex: 1;
                `}
              ></span>
              <span>
                {!batchPredId && (
                  /* isInProject && */ <span style={{ marginRight: '20px' }}>
                    <ModalConfirm
                      onConfirm={this.onClickDeleteFromProject.bind(this, projectId)}
                      title={`Do you want to delete the dataset '${datasetSelectValue && datasetSelectValue.name}'' and its related Feature Group?`}
                      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                      okText={'Delete'}
                      cancelText={'Cancel'}
                      okType={'danger'}
                    >
                      <Button danger ghost style={{ height: '30px', padding: '0 16px', borderColor: 'transparent' }}>
                        Delete
                      </Button>
                    </ModalConfirm>
                  </span>
                )}
              </span>
            </div>

            <div style={{ display: 'flex' }} className={globalStyles.backdetail}>
              <div style={{ marginRight: '24px' }}>
                <img src={calcImgSrc('/imgs/datasetIcon.png')} alt={''} style={{ width: '80px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '10px' }}>
                  {
                    <span
                      css={`
                        margin-right: 7px;
                      `}
                    >
                      <StarredSpan name={'Dataset'} isStarred={!!datasetFound?.get('starred')} onClick={this.onClickStarred.bind(this, datasetId)} size={19} y={-3} />
                    </span>
                  }
                  <DetailHeader>{datasetFound?.get('featureGroupTableName')}</DetailHeader>
                </div>
                <div style={{ fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
                  {dataList?.map((d1) => (
                    <div key={'val_' + d1.id} style={{ margin: '4px 0' }}>
                      <span>
                        <DetailName>{d1.name}: </DetailName>
                        <DetailValue style={{ color: d1.color ? d1.color : '#ffffff' }}>{d1.value}</DetailValue>
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  css={`
                    font-size: 18px;
                    margin-top: 15px;
                    font-family: Matter, sans-serif;
                    font-weight: 500;
                    line-height: 1.6;
                  `}
                >
                  {
                    <div
                      css={`
                        margin-top: 10px;
                      `}
                    >
                      {!batchPredId && (!isStreaming || serviceType === 'snowflake' || showStreaming) && (!!datasetAndProjectPart || !!datasetAndProjectPartNoProject) && (
                        <span css={``}>
                          <Link to={['/' + PartsLink.dataset_schema + (datasetAndProjectPart || datasetAndProjectPartNoProject), 'useFeatureGroupId=true']} style={{ display: 'inline-block' }}>
                            <span
                              css={`
                                cursor: pointer;
                              `}
                              className={globalStyles.styleTextBlueBrightColor}
                            >
                              Schema
                            </span>
                          </Link>
                        </span>
                      )}
                      {!batchPredId && (!isStreaming || serviceType === 'snowflake' || showStreaming) && (!!datasetAndProjectPart || !!datasetAndProjectPartNoProject) && (
                        <span
                          css={`
                            opacity: 0.7;
                            margin: 0 10px;
                          `}
                        >
                          -
                        </span>
                      )}

                      {(!isStreaming || serviceType === 'snowflake' || showStreaming) && (!!datasetAndProjectPart || !!datasetAndProjectPartNoProject) && (
                        <span css={``}>
                          <Link to={'/' + PartsLink.dataset_data_explorer + (datasetAndProjectPart || datasetAndProjectPartNoProject)} style={{ display: 'inline-block' }}>
                            <span
                              css={`
                                cursor: pointer;
                              `}
                              className={globalStyles.styleTextBlueBrightColor}
                            >
                              Data Exploration
                            </span>
                          </Link>
                        </span>
                      )}
                      {(!isStreaming || serviceType === 'snowflake' || showStreaming) && (!!datasetAndProjectPart || !!datasetAndProjectPartNoProject) && (
                        <span
                          css={`
                            opacity: 0.7;
                            margin: 0 10px;
                          `}
                        >
                          -
                        </span>
                      )}
                      {(!isStreaming || serviceType === 'snowflake' || showStreaming) && (!!datasetAndProjectPart || !!datasetAndProjectPartNoProject) && (
                        <span css={``}>
                          <Link to={'/' + PartsLink.dataset_raw_data + (datasetAndProjectPart || datasetAndProjectPartNoProject)} style={{ display: 'inline-block' }}>
                            <span
                              css={`
                                cursor: pointer;
                              `}
                              className={globalStyles.styleTextBlueBrightColor}
                            >
                              Raw Data
                            </span>
                          </Link>
                        </span>
                      )}
                    </div>
                  }
                </div>
              </div>

              <div style={{ textAlign: 'right', whiteSpace: 'normal', paddingLeft: '10px' }}>
                {createdAt != null && (
                  <div>
                    <DetailCreatedAt>Created At: {<DateOld always date={createdAt} />}</DetailCreatedAt>
                  </div>
                )}
                <div style={{ display: 'flex', columnGap: 10, rowGap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '10px' }}>
                  {(!isStreaming || showStreaming) && Constants.flags.visuals_dataset && datasetAndProjectPart && (
                    <Link to={'/' + PartsLink.dataset_visualize + datasetAndProjectPart} style={{ display: 'inline-block' }}>
                      <Button className={globalStyles.detailbuttonblue} type={'primary'} ghost style={{ height: '30px', padding: '0 16px' }}>
                        Visualize
                      </Button>
                    </Link>
                  )}
                  {isStreaming && (!!datasetAndProjectPart || !!datasetAndProjectPartNoProject) && (
                    <Link to={'/' + PartsLink.dataset_streaming + (datasetAndProjectPart || datasetAndProjectPartNoProject)} style={{ display: 'inline-block' }}>
                      <Button className={globalStyles.detailbuttonblue} type={'primary'} ghost style={{ height: '30px', padding: '0 16px' }}>
                        Streaming Data Console
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {
              <div style={{ margin: '40px 0' }}>
                <div className={globalStyles.titleTopHeaderAfter} style={{}}>
                  Dataset Versions
                </div>
                {sourceType != null && (
                  <div style={{ margin: '20px 0' }}>
                    {datasetFound && sourceType === 'upload' && (
                      <Link
                        to={['/' + PartsLink.dataset_upload_step2 + '/' + Utils.encodeRouter(datasetFound?.get('featureGroupTableName') ?? 'abc') + '/' + (datasetTypeS ?? 'ERROR') + '/' + (projectId ?? '-'), 'newVersion=' + datasetId]}
                        style={{}}
                      >
                        <Button className={globalStyles.detailbuttonblue} type={'default'} ghost style={{ height: '30px', padding: '0 16px' }}>
                          {'Upload New Dataset Version'}
                        </Button>
                      </Link>
                    )}
                    {sourceType === 'external_service' && serviceType && !Utils.isNullOrEmpty(databaseConnectorId) && (
                      <Link to={['/' + PartsLink.dataset_external_import_new_version + '/' + datasetId + '/' + (projectId ?? '-'), 'fromScreen=datasetDetail']}>
                        <Button className={globalStyles.detailbuttonblue} type={'default'} ghost style={{ height: '30px', padding: '0 16px' }}>
                          {sqlQuery ? 'Update SQL and Create New Version' : 'Create New Dataset Version'}
                        </Button>
                      </Link>
                    )}

                    {(sourceType === 'sample' || sourceType === 'external_service') && !serviceType && Utils.isNullOrEmpty(databaseConnectorId) && (
                      <ModalConfirmCreateNewVersion onConfirm={this.onClickReadNewVersion} showLocation={true} lastLocation={datasetFound?.getIn(['location'])} mergeFileSchemasDefault={datasetFound?.get('mergeFileSchemas')}>
                        <Button className={globalStyles.detailbuttonblue} type={'default'} ghost style={{ height: '30px', padding: '0 16px' }}>
                          {'Create New Dataset Version'}
                        </Button>
                      </ModalConfirmCreateNewVersion>
                    )}
                    {sourceType === 'streaming' && (
                      <ModalConfirm
                        onConfirm={this.onClickSnapshotStreaming}
                        title={`Do you want to snapshot the current streaming data?`}
                        icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                        okText={'Snapshot'}
                        cancelText={'Cancel'}
                        okType={'primary'}
                      >
                        <Button className={globalStyles.detailbuttonblue} type={'default'} ghost style={{ height: '30px', padding: '0 16px' }}>
                          {'Snapshot Streaming Data'}
                        </Button>
                      </ModalConfirm>
                    )}
                    {sourceType === 'upload' && (
                      <div style={{ marginTop: '8px' }} className={globalStyles.styleTextGray}>
                        You can refresh the data by uploading a new dataset version
                      </div>
                    )}
                  </div>
                )}
                <TableExt prefixHelpIdForColumnsAuto={'dataset_detail_versions'} noHover isDetailTheme showEmptyIcon disableSort dataSource={versionsList} columns={columnsVersions} calcKey={(r1) => r1.datasetVersion} />
              </div>
            }
          </RefreshAndProgress>
        </NanoScroller>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    datasets: state.datasets,
    projectDatasets: state.projectDatasets,
    projects: state.projects,
  }),
  null,
)(DatasetDetail);
