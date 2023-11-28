import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import predictionMetrics, { PredictionMetricsLifecycle } from '../../stores/reducers/predictionMetrics';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import CronOne from '../CronOne/CronOne';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const { confirm } = Modal;

const s = require('./PredMetricsDetail.module.css');
const sd = require('../antdUseDark.module.css');

interface IPredMetricsDetailProps {
  projects?: any;
  models?: any;
  deployments?: any;
  paramsProp?: any;
  projectsDatasets?: any;
  featureGroupsParam?: any;
  predictionMetrics?: any;
}

interface IPredMetricsDetailState {
  checkedKeys?: any;
}

class PredMetricsDetail extends React.PureComponent<IPredMetricsDetailProps, IPredMetricsDetailState> {
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
    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let PredMetricsDetailFound = this.memPredMetricsDetail(true)(this.props.predictionMetrics, predictionMetricsId);
    let listModels = this.memModelList(true)(this.props.predictionMetrics, this.calcFeatureGroupId());

    let modelVersions = this.memPredMetricsVersions(true)(this.props.predictionMetrics, predictionMetricsId);
  };

  calcFeatureGroupId = () => {
    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');
    let PredMetricsDetailFound = this.memPredMetricsDetail(false)(this.props.predictionMetrics, predictionMetricsId);

    return PredMetricsDetailFound?.featureGroupId;
  };

  componentDidUpdate(prevProps: Readonly<IPredMetricsDetailProps>, prevState: Readonly<IPredMetricsDetailState>, snapshot?: any): void {
    this.doMem();
  }

  onClickDeleteModel = (e) => {
    let { paramsProp } = this.props;
    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');
    let modelFound = this.memPredMetricsDetail(false)(this.props.predictionMetrics, predictionMetricsId);
    if (paramsProp?.get('predictionMetricsId')) {
      if (Utils.isNullOrEmpty(predictionMetricsId)) {
        return;
      }

      this.writeDeleteMeConfirm = '';

      confirm({
        title: 'Are you sure you want to delete this prediction metrics model?',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        maskClosable: true,
        content: (
          <div>
            <div>{'Prediction Metrics Model ID: "' + predictionMetricsId + '"'}</div>
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
            REActions.addNotification('Deleting model...');

            REClient_.client_()._deletePredictionMetric(predictionMetricsId, (err, res) => {
              if (err) {
                REActions.addNotificationError(err);
              } else {
                REActions.addNotification('Prediction Metrics Model Deleted!');
                let featureGroupId = modelFound?.featureGroupId;

                StoreActions.listPredMetricsForProjectId_(this.props.paramsProp?.get('projectId'));
                StoreActions._getPredMetricsByFeatureGroupId(featureGroupId);
                StoreActions._describePredMetrics(predictionMetricsId);
                StoreActions._getListVersionsPredMetricsByPredMetricsId(predictionMetricsId);

                // if(featureGroupId) {
                //   Location.push('/' + PartsLink.prediction_metrics_list + '/' + this.props.paramsProp?.get('projectId') + '/' + featureGroupId);
                // } else {
                Location.push('/' + PartsLink.prediction_metrics_project + '/' + this.props.paramsProp?.get('projectId'));
                // }
              }
            });
          } else {
            REActions.addNotificationError('You need to write "delete me" to delete the prediction metrics model');
            this.onClickDeleteModel(null);
          }
        },
        onCancel: () => {
          //
        },
      });
    }
  };

  memModelList = memoizeOneCurry((doCall, monitoringParam, featureGroupId) => {
    return predictionMetrics.memListMetricsByFeatureGroupId(doCall, undefined, featureGroupId);
  });

  memModelsOptions = memoizeOne((listModels, projectId) => {
    let optionsModels = [];
    if (listModels) {
      listModels.some((m1) => {
        let obj1 = {
          value: m1.predictionMetricId,
          label: <span style={{ fontWeight: 600 }}>{m1.predictionMetricId}</span>,
          name: m1.predictionMetricId,
        };
        optionsModels.push(obj1);
      });
    }

    return optionsModels;
  });

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

      Location.push('/' + mode + projectPart + '/' + optionSel.value);
    }
  };

  memPredMetricsDetail = memoizeOneCurry((doCall, predictionMetricsParam, predictionMetricsId) => {
    return predictionMetrics.memDescribeMetricsByPredMetricsId(doCall, predictionMetricsParam, predictionMetricsId);
  });

  memPredMetricsVersions = memoizeOneCurry((doCall, predictionMetricsParam, predictionMetricsId) => {
    return predictionMetrics.memListMetricsVersionsByPredMetricId(doCall, undefined, predictionMetricsId);
  });

  onClickReTrain = (e) => {
    e && e.stopPropagation();

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');
    if (!projectId || !predictionMetricsId) {
      return;
    }

    let modelFound = this.memPredMetricsDetail(false)(this.props.predictionMetrics, predictionMetricsId);

    REClient_.client_()._runPredictionMetric(predictionMetricsId, (err1, res) => {
      if (err1 || !res?.success) {
        REActions.addNotificationError(err1);
      } else {
        if (res && res.success) {
          let resL = res;
          if (resL && resL.result && resL.result) {
            let predictionMetricVersion = resL.result.predictionMetricVersion;
            if (predictionMetricVersion) {
              setTimeout(() => {
                let featureGroupId = modelFound?.featureGroupId;

                StoreActions.refreshDoPredMetricsAll_(predictionMetricsId, featureGroupId, projectId);
                StoreActions.refreshDoPredMetricsVersionsAll_(predictionMetricVersion, predictionMetricsId, featureGroupId, projectId);

                StoreActions.listPredMetricsForProjectId_(projectId);
                StoreActions._getPredMetricsByFeatureGroupId(featureGroupId);
                StoreActions._describePredMetrics(predictionMetricsId);
                StoreActions._getListVersionsPredMetricsByPredMetricsId(predictionMetricsId);
              }, 100);
            }
          }
        }
      }
    });
  };

  onClickDeleteVersion = (predMetricsVersion, e) => {
    if (predMetricsVersion) {
      REClient_.client_()._deletePredictionMetricVersion(predMetricsVersion, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          let projectId = this.props.paramsProp?.get('projectId');
          let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');
          let modelFound = this.memPredMetricsDetail(false)(this.props.predictionMetrics, predictionMetricsId);

          let featureGroupId = modelFound?.featureGroupId;

          StoreActions.listPredMetricsForProjectId_(projectId);
          StoreActions._getPredMetricsByFeatureGroupId(featureGroupId);
          StoreActions._describePredMetrics(predictionMetricsId);
          StoreActions._getListVersionsPredMetricsByPredMetricsId(predictionMetricsId);
        }
      });
    }
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onDeleteRefreshSchedule = () => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = paramsProp && paramsProp.get('projectId');
    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');

    StoreActions._describePredMetrics(predictionMetricsId);
  };

  onPlayRefreshSchedule = () => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = paramsProp && paramsProp.get('projectId');
    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');

    StoreActions._describePredMetrics(predictionMetricsId);
  };

  onCreateNewCron = () => {
    let { paramsProp } = this.props;
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let projectId = paramsProp && paramsProp.get('projectId');
    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');

    StoreActions._describePredMetrics(predictionMetricsId);
  };

  render() {
    let { models, paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');

    let PredMetricsDetailFound = null;
    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');
    if (predictionMetricsId) {
      PredMetricsDetailFound = this.memPredMetricsDetail(false)(this.props.predictionMetrics, predictionMetricsId);
    }

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    let dataList = [],
      nameDetail = null,
      createdAt = null,
      createdBy = null;

    let modelVersions = this.memPredMetricsVersions(false)(this.props.predictionMetrics, predictionMetricsId);
    let lastTrained = modelVersions
      ?.map((f) => {
        return f?.predictionMetricCompletedAt;
      })
      .filter((time) => time != null)[0];
    if (PredMetricsDetailFound) {
      let stringify = (value) => {
        if (_.isArray(value) || _.isObject(value)) {
          return JSON.stringify(value);
        } else {
          return value;
        }
      };

      nameDetail = PredMetricsDetailFound.name;

      createdAt = PredMetricsDetailFound.createdAt;
      createdBy = PredMetricsDetailFound.createdBy;
      if (createdAt != null) {
        createdAt = moment(createdAt);
        if (!createdAt.isValid()) {
          createdAt = null;
        }
      } else {
        createdAt = null;
      }

      let isLastTraining = [PredictionMetricsLifecycle.PENDING, PredictionMetricsLifecycle.RUNNING].includes(PredMetricsDetailFound?.latestPredictionMetricVersionDescription?.status);

      // TODO //**
      // if(isLastTraining && !StoreActions.refreshMonitorUntilStateIsTraining_(modelId)) {
      //   StoreActions.refreshDoMonitorAll_(modelId, projectId);
      // }

      dataList = [
        {
          id: 111,
          name: 'Prediction Metric ID: ',
          value: <CopyText>{PredMetricsDetailFound.predictionMetricId}</CopyText>,
        },
        {
          id: 3,
          name: 'Feature Group ID: ',
          value: (
            <span>
              <Link to={'/' + PartsLink.feature_group_detail + '/' + projectId + '/' + PredMetricsDetailFound.featureGroupId} className={sd.styleTextBlueBrightColor}>
                {PredMetricsDetailFound.featureGroupId}
              </Link>
              <CopyText noText>{PredMetricsDetailFound.featureGroupId}</CopyText>
            </span>
          ),
        },
        {
          id: 2,
          name: 'Last Prepared: ',
          value: isLastTraining ? 'Preparing...' : lastTrained != null ? <DateOld always date={lastTrained} /> : 'Not Prepared',
        },
        {
          id: 500,
          name: 'Refresh Schedules',
          value: (
            <div>
              {PredMetricsDetailFound?.refreshSchedules?.map((d1, d1ind) => {
                return (
                  <div key={'cron_' + d1ind} style={{ margin: '3px 0 3px 30px' }}>
                    <CronOne
                      projectId={projectId}
                      predictionMetricsIds={predictionMetricsId ? [predictionMetricsId] : null}
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
              {predictionMetricsId != null && (
                <div style={{ margin: '3px 0 3px 30px' }}>
                  <CronOne isNew projectId={projectId} predictionMetricsIds={predictionMetricsId ? [predictionMetricsId] : null} onPlayNow={this.onPlayRefreshSchedule} onCreateNew={this.onCreateNewCron} />
                </div>
              )}
            </div>
          ),
        },
      ];
    }

    let modelSelectValue = null;
    let optionsModels = [];
    if (models) {
      let listModels = this.memModelList(false)(this.props.predictionMetrics, this.calcFeatureGroupId());
      optionsModels = this.memModelsOptions(listModels, projectId);
      if (optionsModels) {
        modelSelectValue = optionsModels.find((p1) => p1.value === predictionMetricsId);
      }
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let isInProject = paramsProp && !Utils.isNullOrEmpty(paramsProp.get('projectId'));

    let modelVersionsColumns: ITableExtColumn[] = [
      {
        title: 'Prediction Metric Version',
        field: 'predictionMetricVersion',
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
      },
      {
        title: 'Processing Started',
        field: 'predictionMetricStartedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
        },
      },
      {
        title: 'Processing Completed',
        field: 'predictionMetricCompletedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
        },
      },
      {
        title: 'Processing Status',
        field: 'status',
        render: (text, row, index) => {
          let isTraining = false;
          if ([PredictionMetricsLifecycle.PENDING, PredictionMetricsLifecycle.RUNNING].includes(row.status || '')) {
            isTraining = true;
            StoreActions.refreshDoPredMetricsVersionsAll_(row.predictionMetricVersion, predictionMetricsId, this.calcFeatureGroupId(), projectId);
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
            let res = <span style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(text ?? '-')}</span>;
            if ([PredictionMetricsLifecycle.FAILED].includes(row.status || '')) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
      },
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

          let isMetricsType = row?.predictionMetricConfig?.predictionMetricType?.toUpperCase();
          const isBias = isMetricsType === 'BiasPredictionMetrics'.toUpperCase();

          return (
            <span>
              {/*{[PredictionMetricsLifecycle.COMPLETE].includes(row.state) && <ModalConfirm onConfirm={this.onClickDeleteVersion.bind(this, row.modelMonitorVersion)} title={`Do you want to delete this model version?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>*/}
              {/*  <Button css={`margin: 4px;`}>Metrics</Button>*/}
              {/*</ModalConfirm>}*/}
              {!isBias && [PredictionMetricsLifecycle.COMPLETE].includes(row.status) && (
                <Link to={['/' + PartsLink.prediction_metrics + '/' + projectId + '/' + predictionMetricsId, 'predictionMetricVersion=' + encodeURIComponent(row.predictionMetricVersion)]}>
                  <Button
                    css={`
                      margin: 4px;
                    `}
                    type={'primary'}
                    ghost
                  >
                    Metrics
                  </Button>
                </Link>
              )}
              {isBias && [PredictionMetricsLifecycle.COMPLETE].includes(row.status) && (
                <Link to={['/' + PartsLink.prediction_metrics_bias + '/' + projectId + '/' + predictionMetricsId, 'predictionMetricVersion=' + encodeURIComponent(row.predictionMetricVersion)]}>
                  <Button
                    css={`
                      margin: 4px;
                    `}
                    type={'primary'}
                    ghost
                  >
                    Metrics
                  </Button>
                </Link>
              )}
            </span>
          );
        },
      },
    ]);

    let allowReTrain = true;
    if (!PredMetricsDetailFound || [PredictionMetricsLifecycle.RUNNING, PredictionMetricsLifecycle.RUNNING].includes(PredMetricsDetailFound?.latestPredictionMetricVersionDescription?.status)) {
      allowReTrain = false;
    }

    let retrainButton = null;
    if (allowReTrain) {
      retrainButton = (
        <ModalConfirm onConfirm={this.onClickReTrain} title={`Are you sure you want to Re-Run?`} icon={<QuestionCircleOutlined style={{ color: 'yellow' }} />} okText={'Re-Run'} cancelText={'Cancel'} okType={'primary'}>
          <Button className={sd.detailbuttonblue} style={{ marginLeft: '10px' }} type={'primary'}>
            Re-Run
          </Button>
        </ModalConfirm>
      );
    }

    return (
      <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px' }}>
        <NanoScroller onlyVertical>
          <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
            {isInProject && (
              <div style={{ float: 'right', marginRight: '20px' }}>
                <Button onClick={this.onClickDeleteModel} danger ghost style={{ height: '30px', padding: '0 16px', marginRight: '20px', borderColor: 'transparent' }}>
                  Delete
                </Button>
              </div>
            )}

            <span>{'Prediction Metric'}</span>
            <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', display: 'inline-block', fontSize: '12px' }}>
              <SelectExt value={modelSelectValue} options={optionsModels} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
            </span>
          </div>

          <div style={{ display: 'flex' }} className={sd.backdetail}>
            <div style={{ marginRight: '24px' }}>
              <img src={calcImgSrc('/imgs/modelIcon.png')} alt={''} style={{ width: '80px' }} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
              <div style={{ marginBottom: '10px' }}>
                <DetailHeader>{nameDetail}</DetailHeader>
              </div>
              {dataList.map((d1) => (
                <div key={'val_' + d1.id} style={{ margin: (d1.marginVert ?? 5) + 'px 0' }}>
                  <span>
                    <DetailName>{d1.name}</DetailName>
                    <DetailValue style={{ color: d1.valueColor ?? '#ffffff' }}>{d1.value}</DetailValue>
                  </span>
                </div>
              ))}
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
              <div className={sd.titleTopHeaderAfter} style={{ marginBottom: '14px' }}>
                Prediction Metric Versions
                <HelpIcon id={'PredMetricsVersionsDetail_predMetrics_title'} style={{ marginLeft: '4px' }} />
              </div>
              <TableExt
                noHover
                isDetailTheme
                showEmptyIcon
                defaultSort={{ field: 'predictionMetricCompletedAt', isAsc: false }}
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
    deployments: state.deployments,
    projects: state.projects,
    projectsDatasets: state.projectsDatasets,
    featureGroupsParam: state.featureGroups,
    predictionMetrics: state.predictionMetrics,
  }),
  null,
)(PredMetricsDetail);
