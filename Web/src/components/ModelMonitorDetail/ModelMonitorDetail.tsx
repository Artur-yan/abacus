import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import { Button } from '../../DesignSystem/Button/Button';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Provider } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { calcDocStoreDefFromProject } from '../../api/DocStoreInterfaces';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import monitoring, { ModelMonitoringLifecycle, ModelMonitoringLifecycleDesc } from '../../stores/reducers/monitoring';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import CronOne from '../CronOne/CronOne';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import LinkFG from '../LinkFG/LinkFG';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import ViewLogs from '../ViewLogs/ViewLogs';
import styles from './ModelMonitorDetail.module.css';
import globalStyles from '../antdUseDark.module.css';

const { confirm } = Modal;

interface IModelMonitorDetailProps {
  projects?: any;
  models?: any;
  monitoring?: any;
  deployments?: any;
  paramsProp?: any;
  projectsDatasets?: any;
  featureGroupsParam?: any;
}

interface IModelMonitorDetailState {
  checkedKeys?: any;
}

const MODEL_VERSION_TABLE_COLUMNS = {
  MODEL_MONITOR_VERSION: 'Monitor Version',
  PROCESS_STARTED: 'Processing Started',
  PROCESS_COMPELTED: 'Processing Completed',
  PROCESS_STATUS: 'Processing Status',
  PREDICTION_FG_VERSION: 'Prediction feature group version',
  TRAINING_FG_VERSION: 'Training feature group version',
  TEST_FG_VERSION: 'Test feature group version',
  REFERENCE_FG_VERSION: 'Reference feature group version',
  BATCH_PREDICTION_VERSION: 'Batch prediction version',
};

class ModelMonitorDetail extends React.PureComponent<IModelMonitorDetailProps, IModelMonitorDetailState> {
  private writeDeleteMeConfirm: any;
  private isM: boolean;
  confirmReTrain: any;
  confirmHistory: any;
  confirmUsedRename: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    if (this.confirmUsedRename != null) {
      this.confirmUsedRename.destroy();
      this.confirmUsedRename = null;
    }
    if (this.confirmReTrain != null) {
      this.confirmReTrain.destroy();
      this.confirmReTrain = null;
    }
    if (this.confirmHistory != null) {
      this.confirmHistory.destroy();
      this.confirmHistory = null;
    }

    this.isM = false;
  }

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let modelId = this.props.paramsProp?.get('modelMonitorId');

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let listModels = this.memModelList(true)(this.props.monitoring, projectId);
    let ModelMonitorDetailFound = this.memModelMonitorDetail(true)(this.props.monitoring, modelId);
    this.memFGTraining(true)(this.props.featureGroupsParam, ModelMonitorDetailFound?.trainingFeatureGroupId);
    this.memFGPrediction(true)(this.props.featureGroupsParam, ModelMonitorDetailFound?.predictionFeatureGroupId);

    let modelVersions = this.memModelVersions(true)(this.props.monitoring, modelId);
  };

  memFGTraining = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupsForId(doCall, null, featureGroupId);
  });

  memFGPrediction = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupsForId(doCall, null, featureGroupId);
  });

  componentDidUpdate(prevProps: Readonly<IModelMonitorDetailProps>, prevState: Readonly<IModelMonitorDetailState>, snapshot?: any): void {
    this.doMem();
  }

  onClickDeleteModel = (e) => {
    let { paramsProp } = this.props;
    let modelId = paramsProp?.get('modelMonitorId');
    let modelFound = this.memModelMonitorDetail(false)(this.props.monitoring, modelId);
    if (paramsProp?.get('modelMonitorId')) {
      if (Utils.isNullOrEmpty(modelId)) {
        return;
      }

      this.writeDeleteMeConfirm = '';

      confirm({
        title: 'Are you sure you want to delete this monitor?',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        maskClosable: true,
        content: (
          <div>
            <div>{'Monitor name: "' + modelFound.name + '"'}</div>
            <div style={{}}>Write {'"delete me"'} inside the box to confirm</div>
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
            REActions.addNotification('Deleting Monitor...');

            REClient_.client_().deleteModelMonitor(modelId, (err, res) => {
              if (err) {
                REActions.addNotificationError(err);
              } else {
                REActions.addNotification('Monitor Deleted!');
                StoreActions.listMonitoringModels_(this.props.paramsProp?.get('projectId'));
                StoreActions.describeModelMonitorById_(modelId);
                StoreActions.listMonitoringModelVersions_(modelId);

                Location.push('/' + PartsLink.project_dashboard + '/' + this.props.paramsProp?.get('projectId'));
              }
            });
          } else {
            REActions.addNotificationError('You need to write "delete me" to delete the monitor');
            this.onClickDeleteModel(null);
          }
        },
        onCancel: () => {},
      });
    }
  };

  memModelList = memoizeOneCurry((doCall, monitoringParam, projectId) => {
    return monitoring.memModelsByProjectId(doCall, projectId);
  });

  memModelsOptions = memoizeOne((listModels, projectId) => {
    let optionsModels = [];
    if (listModels) {
      listModels.some((m1) => {
        let obj1 = {
          value: m1.modelMonitorId,
          label: <span style={{ fontWeight: 600 }}>{m1.name}</span>,
          name: m1.name,
        };
        optionsModels.push(obj1);
      });
    }

    optionsModels &&
      optionsModels.sort((a, b) => {
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      });

    return optionsModels;
  });

  onClickRenameModel = (modelId, modelName) => {
    let editNameValue = modelName;

    if (this.confirmUsedRename != null) {
      this.confirmUsedRename.destroy();
      this.confirmUsedRename = null;
    }

    this.confirmUsedRename = confirm({
      title: 'Rename Model',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + modelName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={modelName}
            defaultValue={modelName}
            onChange={(e) => {
              editNameValue = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (this.confirmUsedRename != null) {
          this.confirmUsedRename.destroy();
          this.confirmUsedRename = null;
        }

        if (editNameValue != modelName) {
          //delete it
          REActions.addNotification('Renaming monitor to "' + editNameValue + '"');

          let projectId = this.props.paramsProp.get('projectId');
          REClient_.client_().renameModelMonitor(modelId, editNameValue, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Monitor Renamed!');

              StoreActions.listMonitoringModels_(projectId);
              StoreActions.describeModelMonitorById_(modelId);
              StoreActions.listMonitoringModelVersions_(modelId);
            }
          });
        }
      },
      onCancel: () => {
        if (this.confirmUsedRename != null) {
          this.confirmUsedRename.destroy();
          this.confirmUsedRename = null;
        }
      },
    });
  };

  onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let { paramsProp } = this.props;

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let projectPart = paramsProp && paramsProp.get('projectId');
      if (projectPart) {
        projectPart = '/' + projectPart;
      } else {
        projectPart = '';
      }

      Location.push('/' + mode + '/' + optionSel.value + projectPart);
    }
  };

  memModelMonitorDetail = memoizeOneCurry((doCall, monitoringParam, modelId) => {
    return monitoring.memModelsById(doCall, modelId);
  });

  memModelVersions = memoizeOneCurry((doCall, monitoringParam, modelMonitorId) => {
    return monitoring.memModelVersionsById(doCall, modelMonitorId);
  });

  onClickReTrain = (e) => {
    e && e.stopPropagation();

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let modelId = paramsProp && paramsProp.get('modelMonitorId');
    if (!projectId || !modelId) {
      return;
    }

    REClient_.client_().rerunModelMonitor(modelId, (err1, res) => {
      if (err1) {
        REActions.addNotificationError(err1);
      } else {
        if (res && res.success) {
          let resL = res;
          if (resL && resL.result && resL.result) {
            let modelMonitorId = resL.result.modelMonitorId;
            if (modelMonitorId) {
              setTimeout(() => {
                StoreActions.listMonitoringModels_(projectId);
                StoreActions.describeModelMonitorById_(modelMonitorId);
                StoreActions.listMonitoringModelVersions_(modelMonitorId);
              }, 100);
            }
          }
        }
      }
    });
  };

  onClickDeleteVersion = (modelMonitorVersion, e) => {
    if (modelMonitorVersion) {
      REClient_.client_().deleteModelMonitorVersion(modelMonitorVersion, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          let projectId = this.props.paramsProp?.get('projectId');
          let modelId = this.props.paramsProp?.get('modelMonitorId');

          StoreActions.listMonitoringModels_(projectId);
          StoreActions.describeModelMonitorById_(modelId);
          StoreActions.listMonitoringModelVersions_(modelId);
        }
      });
    }
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onClickCancel = (e) => {
    e && e.stopPropagation();
    e && e.preventDefault();
  };

  onDeleteRefreshSchedule = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    let modelId = this.props.paramsProp?.get('modelMonitorId');

    if (projectId) {
      StoreActions.listMonitoringModels_(projectId);
    }
    if (modelId) {
      StoreActions.describeModelMonitorById_(modelId);
      StoreActions.listMonitoringModelVersions_(modelId);
    }
  };

  onPlayRefreshSchedule = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    let modelId = this.props.paramsProp?.get('modelMonitorId');
    if (projectId) {
      StoreActions.listMonitoringModels_(projectId);
    }
    if (modelId) {
      StoreActions.describeModelMonitorById_(modelId);
      StoreActions.listMonitoringModelVersions_(modelId);
    }
  };

  memDocStoreDef = memoizeOne((foundProject1) => {
    return calcDocStoreDefFromProject(foundProject1);
  });

  render() {
    let { models, paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');

    let ModelMonitorDetailFound = null;
    let modelId = paramsProp?.get('modelMonitorId');
    if (modelId) {
      ModelMonitorDetailFound = this.memModelMonitorDetail(false)(this.props.monitoring, modelId);
    }

    let fgTraining = this.memFGTraining(false)(this.props.featureGroupsParam, ModelMonitorDetailFound?.trainingFeatureGroupId);
    let fgPrediction = this.memFGPrediction(false)(this.props.featureGroupsParam, ModelMonitorDetailFound?.predictionFeatureGroupId);

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let docStoreDef = this.memDocStoreDef(foundProject1);
    let isVisionDrift = ModelMonitorDetailFound?.monitorType?.toUpperCase() === 'VISION_DRIFT_MONITOR' || ModelMonitorDetailFound?.monitorType?.toUpperCase() === 'NLP_DRIFT_MONITOR';

    let dataList = [],
      nameDetail = null,
      createdAt = null,
      createdBy = null;

    let modelVersions = this.memModelVersions(false)(this.props.monitoring, modelId);
    let lastTrained = modelVersions
      ?.map((f) => {
        return f?.monitoringCompletedAt;
      })
      .filter((time) => time != null)[0];
    if (ModelMonitorDetailFound) {
      let stringify = (value) => {
        if (_.isArray(value) || _.isObject(value)) {
          return JSON.stringify(value);
        } else {
          return value;
        }
      };

      nameDetail = ModelMonitorDetailFound.name;

      createdAt = ModelMonitorDetailFound.createdAt;
      createdBy = ModelMonitorDetailFound.createdBy;
      if (createdAt != null) {
        createdAt = moment(createdAt);
        if (!createdAt.isValid()) {
          createdAt = null;
        }
      } else {
        createdAt = null;
      }

      let isLastTraining = [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(ModelMonitorDetailFound?.latestMonitorModelVersion?.status);

      if (isLastTraining && !StoreActions.refreshMonitorUntilStateIsTraining_(modelId)) {
        StoreActions.refreshDoMonitorAll_(modelId, projectId);
      }

      dataList = [
        {
          id: 111,
          name: 'Monitor ID: ',
          value: <CopyText>{ModelMonitorDetailFound.modelMonitorId}</CopyText>,
        },
        {
          id: 2,
          name: 'Last Prepared: ',
          value: isLastTraining ? 'Preparing...' : lastTrained != null ? <DateOld always date={lastTrained} /> : 'Not Prepared',
        },
        {
          id: 50,
          name: 'Model ID: ',
          value: <CopyText>{ModelMonitorDetailFound.modelId}</CopyText>,
          hidden: Utils.isNullOrEmpty(ModelMonitorDetailFound.modelId),
        },
        {
          id: 51,
          name: 'Batch Prediction ID: ',
          value: (
            <Link noAutoParams to={'/' + PartsLink.batchpred_detail + '/' + projectId + '/' + ModelMonitorDetailFound.batchPredictionId}>
              <CopyText>{ModelMonitorDetailFound.batchPredictionId}</CopyText>,
            </Link>
          ),
          hidden: Utils.isNullOrEmpty(ModelMonitorDetailFound.batchPredictionId),
        },
      ].filter((o1) => !o1.hidden);

      if (ModelMonitorDetailFound?.newDataAvailable) {
        dataList.push({
          id: 33,
          name: 'Data:',
          value: (
            <span>
              <FontAwesomeIcon icon={['far', 'clock']} transform={{ size: 16, x: 0 }} style={{ color: Utils.colorA(0.7), marginRight: '5px' }} />
              Out of Date
            </span>
          ),
        });
      }

      let msgError = ModelMonitorDetailFound?.latestMonitorModelVersion?.lifecycleMsg;
      if (!Utils.isNullOrEmpty(msgError)) {
        dataList.push({
          id: 100,
          name: 'Error Message:',
          value: msgError ?? '-',
          valueColor: Utils.colorAall(0.8),
          marginVert: 14,
        });
      }

      let refreshSchedules = ModelMonitorDetailFound?.refreshSchedules;
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
                    modelMonitorIds={[this.props.paramsProp?.get('modelMonitorId')]}
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
            {this.props.paramsProp?.get('projectId') != null && this.props.paramsProp?.get('modelMonitorId') != null && (
              <div style={{ margin: '3px 0 3px 30px' }}>
                <CronOne isNew projectId={this.props.paramsProp?.get('projectId')} onPlayNow={this.onPlayRefreshSchedule} modelMonitorIds={[this.props.paramsProp?.get('modelMonitorId')]} />
              </div>
            )}
          </div>
        ),
      });
    }

    let modelSelectValue = null;
    let optionsModels = [];
    if (models) {
      let listModels = this.memModelList(false)(this.props.monitoring, projectId);
      optionsModels = this.memModelsOptions(listModels, projectId);
      if (optionsModels) {
        modelSelectValue = optionsModels.find((p1) => p1.value === modelId);
      }
    }

    if (fgTraining?.name != null) {
      dataList.push({
        id: 300001,
        name: `Feature Group ${ModelMonitorDetailFound?.monitorType === 'FEATURE_GROUP_MONITOR' ? 'Reference' : 'Training'}:`,
        value: (
          <span>
            {(fgTraining?.name ?? '-') + ' - '}
            <LinkFG featureGroup={fgTraining}>{fgTraining?.featureGroupId ?? '-'}</LinkFG>
          </span>
        ),
      });
    }
    if (fgPrediction?.name != null) {
      dataList.push({
        id: 300002,
        name: `Feature Group ${ModelMonitorDetailFound?.monitorType === 'FEATURE_GROUP_MONITOR' ? 'Test' : 'Prediction'}:`,
        value: (
          <span>
            {(fgPrediction?.name ?? '-') + ' - '}
            <LinkFG featureGroup={fgPrediction}>{fgPrediction?.featureGroupId ?? '-'}</LinkFG>
          </span>
        ),
      });
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let isInProject = paramsProp && !Utils.isNullOrEmpty(paramsProp.get('projectId'));

    let modelVersionsColumns: ITableExtColumn[] = [
      {
        title: MODEL_VERSION_TABLE_COLUMNS.MODEL_MONITOR_VERSION,
        field: 'modelMonitorVersion',
        isLinked: true,
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
      },
      {
        title: MODEL_VERSION_TABLE_COLUMNS.PROCESS_STARTED,
        field: 'monitoringStartedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
        },
      },
      {
        title: MODEL_VERSION_TABLE_COLUMNS.PROCESS_COMPELTED,
        field: 'monitoringCompletedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
        },
      },
      {
        title: MODEL_VERSION_TABLE_COLUMNS.PROCESS_STATUS,
        field: 'status',
        render: (text, row, index) => {
          let isTraining = false;
          if ([ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(row.status || '')) {
            isTraining = true;
            StoreActions.refreshDoMonitorVersionsAll_(row.modelMonitorVersion, this.props.paramsProp?.get('modelMonitorId'), this.props.paramsProp?.get('projectId'));
          }

          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>Processing...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{ModelMonitoringLifecycleDesc[text ?? '-']}</span>;
            if ([ModelMonitoringLifecycle.FAILED].includes(row.status || '')) {
              res = <span className={globalStyles.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ([ModelMonitoringLifecycle.FAILED].includes(row.status || '')) {
            if (row.lifecycleMsg) {
              let m1 = row.lifecycleMsg;
              if (m1?.indexOf('\n') > -1) {
                let mm = m1.split('\n');
                m1 = mm.map((m1, ind) => <div key={'m' + ind}>{m1}</div>);
              }

              res = (
                <span
                  css={`
                    display: flex;
                    align-items: center;
                  `}
                >
                  <span
                    css={`
                      margin-right: 5px;
                      white-space: nowrap;
                    `}
                  >
                    Error:
                  </span>
                  <span
                    css={`
                      color: #bf2c2c;
                      display: inline-block;
                    `}
                  >
                    {m1}
                  </span>
                </span>
              );
            }
          }
          return res;
        },
      },
      {
        title: ModelMonitorDetailFound?.monitorType === 'FEATURE_GROUP_MONITOR' ? MODEL_VERSION_TABLE_COLUMNS.TEST_FG_VERSION : MODEL_VERSION_TABLE_COLUMNS.PREDICTION_FG_VERSION,
        field: 'predictionFeatureGroupVersion',
        render: (text, row, index) => (
          <Link usePointer className={globalStyles.styleTextBlue} forceSpanUse to={[`/${PartsLink.feature_groups_data_explorer}/${projectId ?? '-'}/${fgPrediction?.featureGroupId}`, `featureGroupVersion=${encodeURIComponent(text)}`]}>
            {text}
          </Link>
        ),
      },
      {
        title: ModelMonitorDetailFound?.monitorType === 'FEATURE_GROUP_MONITOR' ? MODEL_VERSION_TABLE_COLUMNS.REFERENCE_FG_VERSION : MODEL_VERSION_TABLE_COLUMNS.TRAINING_FG_VERSION,
        field: 'trainingFeatureGroupVersion',
        render: (text, row, index) => (
          <Link usePointer className={globalStyles.styleTextBlue} forceSpanUse to={[`/${PartsLink.feature_groups_data_explorer}/${projectId ?? '-'}/${fgTraining?.featureGroupId}`, `featureGroupVersion=${encodeURIComponent(text)}`]}>
            {text}
          </Link>
        ),
      },
      ...(ModelMonitorDetailFound?.batchPredictionId
        ? [
            {
              title: MODEL_VERSION_TABLE_COLUMNS.BATCH_PREDICTION_VERSION,
              field: 'batchPredictionVersion',
              render: (text, row, index) => (
                <Link usePointer className={globalStyles.styleTextBlue} forceSpanUse to={[`/${PartsLink.batchpred_detail}/${projectId ?? '-'}/${ModelMonitorDetailFound?.batchPredictionId}`]}>
                  {text}
                </Link>
              ),
            },
          ]
        : []),
    ];
    modelVersionsColumns = modelVersionsColumns.concat([
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        field: 'modelVersion',
        render: (text, row, index) => {
          let allowDelete = true;
          if (modelVersions?.length < 2) {
            allowDelete = false;
          }

          return (
            <span>
              {Constants.isShowViewLogs(foundProject1?.useCase) && [ModelMonitoringLifecycle.COMPLETE, ModelMonitoringLifecycle.FAILED].includes(row.status || '') && (
                <ModalConfirm
                  width={900}
                  title={
                    <Provider store={Utils.globalStore()}>
                      <div className={'useDark'}>
                        <ViewLogs modelVersion={row.modelVersion} />
                      </div>
                    </Provider>
                  }
                  okText="Close"
                  cancelText={null}
                  okType="primary"
                >
                  <Button className={styles.actionsButton} ghost>
                    Logs
                  </Button>
                </ModalConfirm>
              )}
              {allowDelete && (
                <ModalConfirm
                  onConfirm={this.onClickDeleteVersion.bind(this, row.modelMonitorVersion)}
                  title={`Do you want to delete this monitor version?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Delete'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  <Button className={styles.actionsButton} danger ghost>
                    Delete
                  </Button>
                </ModalConfirm>
              )}
              {Constants.flags.show_log_links && [ModelMonitoringLifecycle.COMPLETE, ModelMonitoringLifecycle.FAILED].includes(row.status || '') && (
                <span>
                  <br />
                  <Link newWindow to={'/api/v0/_getPipelineStageLogHtml?resourceId=' + row.modelMonitorVersion} noApp style={{ cursor: 'pointer' }}>
                    <Button customType="internal" className={styles.actionsButton}>
                      Internal: View Logs
                    </Button>
                  </Link>
                  <Link newWindow to={'/api/v0/_getPipelineStageLog?resourceId=' + row.modelMonitorVersion} noApp style={{ cursor: 'pointer' }}>
                    <Button customType="internal" className={styles.actionsButton}>
                      Internal: Download Logs
                    </Button>
                  </Link>
                </span>
              )}
            </span>
          );
        },
      },
    ]);

    let allowReTrain = true;
    if (!ModelMonitorDetailFound || [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(ModelMonitorDetailFound?.latestMonitorModelVersion?.status)) {
      allowReTrain = false;
    }

    let retrainButton = null;
    if (allowReTrain) {
      retrainButton = (
        <ModalConfirm onConfirm={this.onClickReTrain} title={`Are you sure you want to Re-Run the model?`} icon={<QuestionCircleOutlined style={{ color: 'yellow' }} />} okText={'Re-Run'} cancelText={'Cancel'} okType={'primary'}>
          <Button className={globalStyles.detailbuttonblue} style={{ marginLeft: '10px' }} type={'primary'}>
            Re-Run
          </Button>
        </ModalConfirm>
      );
    }
    let linkMetrics, linkMetricsBias, linkPerformance;
    if (ModelMonitorDetailFound?.latestPredictionMetricVersionId != null && ModelMonitorDetailFound?.predictionMetricId != null) {
      linkMetrics = [
        '/' + PartsLink.prediction_metrics + '/' + (projectId ?? '-') + '/' + ModelMonitorDetailFound?.predictionMetricId,
        'predictionMetricVersion=' + encodeURIComponent(ModelMonitorDetailFound?.latestPredictionMetricVersionId ?? ''),
      ];
    }
    if (ModelMonitorDetailFound?.latestBiasMetricVersionId != null && ModelMonitorDetailFound?.biasMetricId != null) {
      linkMetricsBias = [
        '/' + PartsLink.prediction_metrics_bias + '/' + (projectId ?? '-') + '/' + ModelMonitorDetailFound?.biasMetricId,
        'predictionMetricVersion=' + encodeURIComponent(ModelMonitorDetailFound?.latestBiasMetricVersionId ?? ''),
      ];
    }
    if (ModelMonitorDetailFound?.metricTypes?.includes('BiasPredictionMetrics') && ModelMonitorDetailFound?.latestMonitorModelVersion?.modelMonitorVersion) {
      linkMetricsBias = [
        '/' + PartsLink.prediction_metrics_type_bias + '/' + (projectId ?? '-') + '/' + modelId,
        '?modelMonitorVersion=' + encodeURIComponent(ModelMonitorDetailFound?.latestMonitorModelVersion?.modelMonitorVersion ?? '') + '&metricType=BiasPredictionMetrics',
      ];
    }
    if (ModelMonitorDetailFound?.metricTypes != null && ModelMonitorDetailFound?.metricTypes?.includes('DecilePredictionMetric')) {
      linkPerformance = [
        '/' + PartsLink.decile_prediction_metrics_project + '/' + (projectId ?? '-') + '/' + modelId,
        'modelMonitorVersion=' + encodeURIComponent(ModelMonitorDetailFound?.latestMonitorModelVersion?.modelMonitorVersion ?? '') + '&metricType=DecilePredictionMetric',
      ];
    }

    return (
      <div className={globalStyles.absolute + ' ' + globalStyles.table} style={{ margin: '25px' }}>
        <NanoScroller onlyVertical>
          <div className={globalStyles.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
            {isInProject && (
              <div style={{ float: 'right', marginRight: '20px' }}>
                <ModalConfirm
                  onConfirm={this.onClickDeleteModel}
                  title={`Do you want to remove the monitor '${modelSelectValue && modelSelectValue.name}'?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Delete'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  <Button danger ghost style={{ height: '30px', padding: '0 16px', marginRight: '20px', borderColor: 'transparent' }}>
                    Delete {'Monitor'}
                  </Button>
                </ModalConfirm>
              </div>
            )}

            <span>{'Monitor Detail'}</span>
            <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', display: 'inline-block', fontSize: '12px' }}>
              <SelectExt value={modelSelectValue} options={optionsModels} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
            </span>
          </div>

          <div style={{ display: 'flex' }} className={globalStyles.backdetail}>
            <div style={{ marginRight: '24px' }}>
              <img src={calcImgSrc('/imgs/modelIcon.png')} alt={''} style={{ width: '80px' }} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
              <div style={{ marginBottom: '10px' }}>
                <DetailHeader>{nameDetail}</DetailHeader>
                {
                  <TooltipExt title={'Rename'}>
                    <span
                      css={`
                        font-size: 14px;
                        cursor: pointer;
                        margin-left: 12px;
                        opacity: 0.8;
                        &:hover {
                          opacity: 1;
                        }
                      `}
                      onClick={this.onClickRenameModel.bind(this, modelId, nameDetail || '')}
                    >
                      <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 20, x: 0, y: -3 }} style={{ color: '#d1e4f5', marginRight: '8px' }} />
                    </span>
                  </TooltipExt>
                }
              </div>
              {dataList.map((d1) => (
                <div key={'val_' + d1.id} style={{ margin: (d1.marginVert ?? 5) + 'px 0' }}>
                  <span>
                    <DetailName>{d1.name}</DetailName>
                    <DetailValue style={{ color: d1.valueColor ?? '#ffffff' }}>{d1.value}</DetailValue>
                  </span>
                </div>
              ))}

              {
                <div
                  css={`
                    font-size: 18px;
                    margin-top: 15px;
                    font-family: Matter, sans-serif;
                    font-weight: 500;
                    line-height: 1.6;
                  `}
                >
                  <span
                    css={`
                      margin: 5px 5px 5px 0;
                    `}
                  >
                    <Link to={'/' + PartsLink.monitor_drift + '/' + modelId + '/' + projectId}>
                      <span className={globalStyles.styleTextBlueBrightColor}>Drift</span>
                    </Link>
                  </span>
                  {!isVisionDrift && !docStoreDef?.navLeftHidePartsLinks?.includes(PartsLink.monitor_data_integrity) && (
                    <>
                      &nbsp;-&nbsp;
                      <span
                        css={`
                          margin: 5px;
                        `}
                      >
                        <Link to={'/' + PartsLink.monitor_data_integrity + '/' + modelId + '/' + projectId}>
                          <span className={globalStyles.styleTextBlueBrightColor}>Integrity</span>
                        </Link>
                      </span>
                    </>
                  )}
                  &nbsp;-&nbsp;
                  <span
                    css={`
                      margin: 5px;
                    `}
                  >
                    <Link to={'/' + PartsLink.monitor_outliers + '/' + modelId + '/' + projectId}>
                      <span className={globalStyles.styleTextBlueBrightColor}>Outliers</span>
                    </Link>
                  </span>
                  {!isVisionDrift && !docStoreDef?.navLeftHidePartsLinks?.includes(PartsLink.monitor_drift_analysis) && (
                    <>
                      &nbsp;-&nbsp;
                      <span
                        css={`
                          margin: 5px;
                        `}
                      >
                        <Link to={'/' + PartsLink.monitor_drift_analysis + '/' + modelId + '/' + projectId}>
                          <span className={globalStyles.styleTextBlueBrightColor}>Drift Analysis</span>
                        </Link>
                      </span>
                    </>
                  )}
                  {linkMetrics != null && <span>&nbsp;-&nbsp;</span>}
                  {linkMetrics != null && (
                    <span
                      css={`
                        margin: 5px;
                      `}
                    >
                      <Link to={linkMetrics}>
                        <span className={globalStyles.styleTextBlueBrightColor}>Metrics</span>
                      </Link>
                    </span>
                  )}
                  {linkPerformance != null && (
                    <>
                      <span>&nbsp;-&nbsp;</span>
                      <span
                        css={`
                          margin: 5px;
                        `}
                      >
                        <Link to={linkPerformance}>
                          <span className={globalStyles.styleTextBlueBrightColor}>Performance</span>
                        </Link>
                      </span>
                    </>
                  )}
                  {linkMetricsBias != null && <span>&nbsp;-&nbsp;</span>}
                  {linkMetricsBias != null && (
                    <span
                      css={`
                        margin: 5px;
                      `}
                    >
                      <Link to={linkMetricsBias}>
                        <span className={globalStyles.styleTextBlueBrightColor}>Bias</span>
                      </Link>
                    </span>
                  )}
                  &nbsp;-&nbsp;
                  <span
                    css={`
                      margin: 5px;
                    `}
                  >
                    <Link to={!Constants.flags.hide_monitors_changes ? '/' + PartsLink.monitors_alert_list + '/' + modelId + '/' + projectId : '/' + PartsLink.monitor_alerts + '/' + modelId + '/' + projectId}>
                      <span className={globalStyles.styleTextBlueBrightColor}>Alerts</span>
                    </Link>
                  </span>
                </div>
              }
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '10px' }}>
              {createdAt != null && (
                <div>
                  <DetailCreatedAt>Created At: {<DateOld always date={createdAt} />}</DetailCreatedAt>
                </div>
              )}
              {createdBy != null && (
                <div>
                  <DetailCreatedAt>Created By: {createdBy}</DetailCreatedAt>
                </div>
              )}
              <div>{isInProject && allowReTrain && <div style={{ marginTop: '20px' }}>{retrainButton}</div>}</div>
            </div>
          </div>

          {isInProject && (
            <div style={{ margin: '30px 0' }}>
              <div className={globalStyles.titleTopHeaderAfter} style={{ marginBottom: '14px' }}>
                Monitor Versions
                <HelpIcon id={'ModelMonitorDetail_modelversions_title'} style={{ marginLeft: '4px' }} />
              </div>
              <TableExt
                isDetailTheme
                showEmptyIcon
                defaultSort={{ field: 'monitoringCompletedAt', isAsc: false }}
                notsaveSortState={'models_versions_list'}
                dataSource={modelVersions}
                columns={modelVersionsColumns}
                calcKey={(r1) => r1.modelVersion}
              />
            </div>
          )}
        </NanoScroller>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    models: state.models,
    monitoring: state.monitoring,
    deployments: state.deployments,
    projects: state.projects,
    projectsDatasets: state.projectsDatasets,
    featureGroupsParam: state.featureGroups,
  }),
  null,
)(ModelMonitorDetail);
