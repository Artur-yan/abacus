import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { DatasetLifecycle } from '../../stores/reducers/datasets';
import defDatasets from '../../stores/reducers/defDatasets';
import { calcDeploymentsByProjectId, DeploymentLifecycle } from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import { calcModelListByProjectId, ModelLifecycle, ModelLifecycleDesc } from '../../stores/reducers/models';
import monitoring, { ModelMonitoringLifecycle, ModelMonitoringLifecycleDesc } from '../../stores/reducers/monitoring';
import { memProjectById } from '../../stores/reducers/projects';
import CircleButtonStart from '../CircleButtonStart/CircleButtonStart';
import CopyText from '../CopyText/CopyText';
import DashboardStepRect from '../DashboardStepRect/DashboardStepRect';
import DatasetForUseCase from '../DatasetForUseCase/DatasetForUseCase';
import DateOld from '../DateOld/DateOld';
import FeatureGroupsStep from '../FeatureGroupsStep/FeatureGroupsStep';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { IconDatasets, IconDeploys, IconFeatureGroups, IconModels, calcIsDockerPnpUseCase } from '../NavLeft/utils';
import PartsLink from '../NavLeft/PartsLink';
import ProjectTags from '../ProjectTags/ProjectTags';
import StarredSpan from '../StarredSpan/StarredSpan';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
const s = require('./ProjectDashboardSteps.module.css');
const sd = require('../antdUseDark.module.css');
const { confirm } = Modal;

interface IProjectDashboardStepsProps {
  paramsProp?: any;
  projects?: any;
  models?: any;
  monitoring?: any;
  datasets?: any;
  deployments?: any;
  useCases?: any;
  defDatasets?: any;
  authUser?: any;
  featureGroups?: any;

  projectId?: string;
}

interface IProjectDashboardStepsState {
  isMedium?: boolean;
  checkedKeys?: any;
}

class ProjectDashboardSteps extends React.PureComponent<IProjectDashboardStepsProps, IProjectDashboardStepsState> {
  private isM: boolean;
  confirmReTrain: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;

    if (this.confirmReTrain != null) {
      this.confirmReTrain.destroy();
      this.confirmReTrain = null;
    }
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
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    const isDrift = foundProject1?.isDrift;

    let deploymentsListRes = this.memDeploymentList(true)(this.props.deployments, projectId);
    if (!isDrift) {
      let modelList = this.memModelList(true)(this.props.models, projectId);
    }
    if (isDrift) {
      let modelMonitoringList = this.memModelListMonitoring(true)(this.props.monitoring, projectId);
    }

    let useCase = null;
    if (foundProject1) {
      useCase = foundProject1.useCase;
    }
    let useCaseOne = this.memUseCase(true)(this.props.useCases, useCase);

    let { validation, anyError, anyDatasetMissing } = this.memValidationAnyError(true)(defDatasets, this.props.projects, projectId, foundProject1) ?? {};

    let featureGroupsList = this.memFeatureGroupsForProject(true)(this.props.featureGroups, projectId);
  };

  componentDidUpdate(prevProps: Readonly<IProjectDashboardStepsProps>, prevState: Readonly<IProjectDashboardStepsState>, snapshot?: any): void {
    this.doMem();
  }

  onClickFeatureGroupsHeader = (e) => {
    let { paramsProp } = this.props;
    if (paramsProp) {
      let projectId = paramsProp.get('projectId');
      if (projectId) {
        Location.push('/' + PartsLink.feature_groups + '/' + projectId);
      }
    }
  };

  onClickDatasetHeader = (e) => {
    let { paramsProp } = this.props;
    if (paramsProp) {
      let projectId = paramsProp.get('projectId');
      if (projectId) {
        Location.push('/' + PartsLink.dataset_list + '/' + projectId);
      }
    }
  };

  onClickModelsHeader = (isDrift, e) => {
    let { paramsProp } = this.props;
    if (paramsProp) {
      let projectId = paramsProp.get('projectId');
      if (projectId) {
        Location.push('/' + (isDrift ? PartsLink.monitors_list : PartsLink.model_list) + '/' + projectId);
      }
    }
  };

  onClickDeploysHeader = (e) => {
    let { paramsProp } = this.props;
    if (paramsProp) {
      let projectId = paramsProp.get('projectId');
      if (projectId) {
        Location.push('/' + PartsLink.deploy_list + '/' + projectId);
      }
    }
  };

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId) => {
    if (deployments && !Utils.isNullOrEmpty(projectId)) {
      let listByProjectId = calcDeploymentsByProjectId(undefined, projectId);
      if (listByProjectId == null) {
        if (deployments.get('isRefreshing') !== 0) {
          return;
        }

        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        let deployAnyDeploying = false,
          anyStopped = false,
          deployAnyComplete = false;
        if (listByProjectId) {
          listByProjectId.some((d1) => {
            if ([DeploymentLifecycle.STOPPED, DeploymentLifecycle.STOPPING].includes(d1?.status)) {
              anyStopped = true;
            }
            if ([DeploymentLifecycle.PENDING, DeploymentLifecycle.DEPLOYING].includes(d1?.status)) {
              deployAnyDeploying = true;
            }
            if ([DeploymentLifecycle.ACTIVE].includes(d1?.status)) {
              deployAnyComplete = true;
            }
          });
        }

        return { list: listByProjectId, deployAnyDeploying, anyStopped, deployAnyComplete };
      }
    }
  });

  memModelListMonitoring = memoizeOneCurry((doCall, monitoringParam, projectId) => {
    return monitoring.memModelsByProjectId(doCall, projectId);
  });

  memModelList = memoizeOneCurry((doCall, models, projectId) => {
    if (models && !Utils.isNullOrEmpty(projectId)) {
      let listByProjectId = calcModelListByProjectId(undefined, projectId);
      if (listByProjectId == null) {
        if (models.get('isRefreshing')) {
          return;
        }

        if (doCall) {
          StoreActions.listModels_(projectId);
        }
      } else {
        return listByProjectId;
      }
    }
  });

  onClickRestartDeployment = (deploymentId) => {
    if (deploymentId) {
      REClient_.client_().startDeployment(deploymentId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Re-Starting Deployment');
          let projectId = this.props.paramsProp?.get('projectId');

          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersions_(deploymentId);
          StoreActions.refreshDoDeployAll_(deploymentId, projectId);
        }
      });
    }
  };

  memDeploymentSpans = memoizeOne((deploymentsList, projectId, isPnpPython) => {
    if (deploymentsList) {
      let res = [];
      const max = 3;

      _.reverse(deploymentsList)
        .slice(0, max)
        .some((m1, m1ind) => {
          // if(![DeploymentLifecycle.ACTIVE, DeploymentLifecycle.STOPPED, DeploymentLifecycle.STOPPING].includes(m1?.status)) {
          //   return false;
          // }
          let isStopped = [DeploymentLifecycle.STOPPED, DeploymentLifecycle.STOPPING, DeploymentLifecycle.CANCELLED, DeploymentLifecycle.FAILED].includes(m1?.status);
          let isDeploying = [DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING].includes(m1?.status);

          let deployId = m1?.deploymentId;
          let actions = null;
          if (isDeploying) {
            actions = (
              <span
                css={`
                  opacity: 0.7;
                  margin-left: 5px;
                `}
              >
                (Deploying)
              </span>
            );
          } else if (isStopped) {
            actions = (
              <span>
                &nbsp;-&nbsp;
                <span onClick={this.onClickRestartDeployment.bind(this, deployId)} style={{ cursor: 'pointer' }} className={sd.styleTextBlueBright}>
                  Re-Start
                </span>
              </span>
            );
          } else {
            actions = (
              <span>
                &nbsp;-&nbsp;
                {!isPnpPython && (
                  <Link to={projectId ? '/' + PartsLink.model_predictions + '/' + projectId + (deployId ? '/' + deployId : '') : null}>
                    <span style={{ cursor: 'pointer' }} className={sd.styleTextBlueBright}>
                      Predictions
                    </span>
                  </Link>
                )}
                {!isPnpPython && <span>&nbsp;|&nbsp;</span>}
                <Link to={projectId ? '/' + PartsLink.deploy_predictions_api + '/' + projectId + (deployId ? '/' + deployId : '') : null}>
                  <span style={{ cursor: 'pointer' }} className={sd.styleTextBlueBright}>
                    API
                  </span>
                </Link>
              </span>
            );
          }

          res.push(
            <div key={'deployone_' + res.length} style={{ marginTop: '19px' }} className={sd.styleTextGray}>
              <Link className={sd.styleTextBlue} to={'/' + PartsLink.deploy_detail + '/' + (projectId ?? '-') + '/' + m1.deploymentId}>
                {m1.name}
              </Link>
              {actions}
            </div>,
          );
        });

      if (deploymentsList.length > max) {
        res.push(
          <div key={'deployone_max'} style={{ marginTop: '19px' }}>
            ({deploymentsList.length - max} more...)
          </div>,
        );
      }

      return res;
    }
  });

  memModelsSpans: (
    isEmbeddingsOnly: boolean,
    isPnp,
    isPnpPython,
    isDrift,
    modelList: any,
    modelMonitoringList,
    listDeploymentsList,
    useCase,
  ) => { list: any; lastModelId: any; anyPnpLocationUsed: boolean; anyFailed: boolean; anyComplete: boolean; allCompleted: boolean; latestTraining: boolean; anyCompleteAnyVersion: boolean } = memoizeOne(
    (isEmbeddingsOnly, isPnp, isPnpPython, isDrift, modelList, modelMonitoringList, listDeploymentsList, useCase) => {
      if ((!isDrift && modelList) || (isDrift && modelMonitoringList)) {
        const isDockerPnp = calcIsDockerPnpUseCase(useCase);

        let res = [],
          latestTraining = false,
          lastModelId = null,
          allCompleted = true,
          anyComplete = false,
          anyCompleteAnyVersion = false,
          anyFailed = false,
          anyPnpLocationUsed = false;

        let manyDeploys = false,
          manyDeploysModelId = [];
        if (listDeploymentsList != null) {
          let deployCount = 0;
          listDeploymentsList.some((d1) => {
            if ([DeploymentLifecycle.ACTIVE, DeploymentLifecycle.STOPPED].includes(d1.status)) {
              deployCount++;
              manyDeploysModelId.push(d1.modelId);
            }
          });
          if (deployCount > 1) {
            manyDeploys = true;
          }
        }

        let partProject = '';
        let projectId = this.props.paramsProp?.get('projectId');
        if (projectId) {
          partProject = '/' + projectId;
        }

        modelMonitoringList = modelMonitoringList?.sort((a, b) => {
          let resCreated = moment(b.createdAt).diff(moment(a.createdAt));
          if (!a.latestMonitorModelVersion?.monitoringCompletedAt || !b.latestMonitorModelVersion?.monitoringCompletedAt) {
            return resCreated;
          }

          let res = moment(b.latestMonitorModelVersion?.monitoringCompletedAt).diff(moment(a.latestMonitorModelVersion?.monitoringCompletedAt));
          if (res === 0) {
            return resCreated;
          } else {
            return res;
          }
        });

        modelList = modelList?.sort((a, b) => {
          let resCreated = moment(b.get('createdAt')).diff(moment(a.get('createdAt')));
          if (!a.getIn(['latestModelVersion', 'trainingCompletedAt']) || !b.getIn(['latestModelVersion', 'trainingCompletedAt'])) {
            return resCreated;
          }

          let res = moment(b.getIn(['latestModelVersion', 'trainingCompletedAt'])).diff(moment(a.getIn(['latestModelVersion', 'trainingCompletedAt'])));
          if (res === 0) {
            return resCreated;
          } else {
            return res;
          }
        });

        if (isPnp) {
          let aaProps: any = {};
          aaProps.onClick = () => {
            if (isDockerPnp) {
              Location.push('/' + PartsLink.docker_add + '/' + projectId);
            } else {
              Location.push('/' + PartsLink.dataset_for_usecase + '/' + projectId, undefined, 'useCase=' + useCase + '&useCaseTag=true');
            }
          };

          let styleButtonAction: CSSProperties = { height: '28px', width: '100%', marginTop: '5px' };

          let buttonMessage = isEmbeddingsOnly ? 'New Catalog' : 'New Model';
          let actionButton: any = (
            <Button {...aaProps} style={styleButtonAction} type={'primary'}>
              {buttonMessage}
            </Button>
          );
          res.push(<div key={'create_new_model_pnp'}>{actionButton}</div>);
        }

        //modelList
        const latestModel = modelList?.reduce((prev, current) => (prev?.getIn(['latestModelVersion', 'trainingStartedAt']) > current?.getIn(['latestModelVersion', 'trainingStartedAt']) ? prev : current), null);
        latestTraining =
          latestModel?.get('modelId') &&
          (StoreActions.refreshModelUntilStateIsTraining_(latestModel?.get('modelId')) ||
            ![ModelLifecycle.EVALUATING_FAILED.toLowerCase(), ModelLifecycle.UPLOADING_FAILED.toLowerCase(), ModelLifecycle.TRAINING_FAILED.toLowerCase(), ModelLifecycle.COMPLETE.toLowerCase()].includes(
              (latestModel?.getIn(['latestModelVersion', 'status']) ?? '').toLowerCase(),
            ));

        lastModelId = latestModel?.get('modelId');

        if (
          latestModel &&
          [ModelLifecycle.EVALUATING_FAILED.toLowerCase(), ModelLifecycle.UPLOADING_FAILED.toLowerCase(), ModelLifecycle.TRAINING_FAILED.toLowerCase()].includes((latestModel?.getIn(['latestModelVersion', 'status']) ?? '').toLowerCase())
        ) {
          anyFailed = true;
        }

        //modelMonitoringList
        const latestModelMonitor = modelMonitoringList?.reduce((prev, current) => (prev?.latestMonitorModelVersion?.monitoringCompletedAt > current?.latestMonitorModelVersion?.monitoringCompletedAt ? prev : current), null);
        latestTraining =
          latestModelMonitor?.modelMonitorId &&
          (StoreActions.refreshMonitorUntilStateIsTraining_(latestModelMonitor?.modelMonitorId) ||
            ![ModelMonitoringLifecycle.FAILED.toLowerCase(), ModelMonitoringLifecycle.COMPLETE.toLowerCase()].includes(
              (latestModelMonitor?.latestMonitorModelVersion?.lifecycle ?? latestModelMonitor?.latestMonitorModelVersion?.status ?? '').toLowerCase(),
            ));

        lastModelId = latestModelMonitor?.modelMonitorId;

        if (latestModel && [ModelMonitoringLifecycle.FAILED.toLowerCase()].includes((latestModel?.latestModelMonitor?.status ?? latestModel?.latestModelMonitor?.lifecycle ?? '').toLowerCase())) {
          anyFailed = true;
        }

        (isDrift ? modelMonitoringList : modelList)?.some((m1, m1ind) => {
          let modelId = isDrift ? m1.modelMonitorId : m1.get('modelId');

          let isPnpUpload = isPnp ? m1?.get('isPnpUpload') : null;
          if (isPnpUpload === false) {
            anyPnpLocationUsed = true;
          }

          const newDataAvailable = isDrift ? m1.newDataAvailable : m1.get('newDataAvailable');

          if (isDrift) {
            if (/*m1.getIn(['modelVersion', 'status']) &&*/ ModelLifecycle.COMPLETE !== m1.latestMonitorModelVersion?.status || m1.latestMonitorModelVersion?.automlComplete !== true) {
              allCompleted = false;
            }
            if (ModelLifecycle.COMPLETE === m1.latestMonitorModelVersion?.status && m1.latestMonitorModelVersion?.automlComplete === true) {
              anyComplete = true;
            }
            if (m1.hasTrainedVersion === true) {
              anyCompleteAnyVersion = true;
            }
          } else {
            if (m1.getIn(['modelVersion', 'status']) && ModelLifecycle.COMPLETE !== m1.getIn(['latestModelVersion', 'status'])) {
              allCompleted = false;
            }
            if (m1.getIn(['latestModelVersion', 'automlComplete']) != null && m1.getIn(['latestModelVersion', 'automlComplete']) !== true) {
              allCompleted = false;
            }
            if (ModelLifecycle.COMPLETE === m1.getIn(['latestModelVersion', 'status']) && m1.getIn(['latestModelVersion', 'automlComplete']) === true) {
              anyComplete = true;
            }
            if (m1.get('hasTrainedVersion') === true) {
              anyCompleteAnyVersion = true;
            }
          }

          if (m1ind < 3) {
            let trainedState = null;
            let modelLifecycle = isDrift ? m1.latestMonitorModelVersion?.status : m1.getIn(['latestModelVersion', 'status']);

            let isPnpLocation = false;
            let isPnpUpload = isPnp ? m1?.get('isPnpUpload') : null;
            if (isPnpUpload === false) {
              isPnpLocation = true;
            }

            if (modelLifecycle) {
              if ((!isDrift && modelLifecycle === ModelLifecycle.COMPLETE) || (isDrift && modelLifecycle === ModelMonitoringLifecycle.COMPLETE)) {
                let trainOnDate = isDrift ? m1.latestMonitorModelVersion?.monitoringCompletedAt : m1.getIn(['latestModelVersion', 'trainingCompletedAt']);
                let dt1 = trainOnDate ? moment(trainOnDate) : null;

                let trainedString = isDrift ? 'Prepared' : 'Trained';
                if (isPnpLocation) {
                  trainedString = 'Processed';
                }
                if (isDockerPnp) {
                  trainedString = 'Processed';
                }
                if (dt1 && dt1.isValid()) {
                  trainedState = (
                    <span>
                      &nbsp;({trainedString} on {<DateOld date={dt1} />})
                    </span>
                  );
                } else {
                  trainedState = <span>&nbsp;({trainedString})</span>;
                }
              } else {
                if (isDrift) {
                  trainedState = (
                    <span>&nbsp;({(isPnpLocation || isDockerPnp) && [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(modelLifecycle) ? 'Processing' : ModelMonitoringLifecycleDesc[modelLifecycle]})</span>
                  );
                } else {
                  trainedState = (
                    <span>
                      &nbsp;(
                      {(isPnpLocation || isDockerPnp) && [ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, ModelLifecycle.TRAINING, ModelLifecycle.EVALUATING].includes(modelLifecycle) ? 'Processing' : ModelLifecycleDesc[modelLifecycle]})
                    </span>
                  );
                }
              }
            }

            let allowReTrain = true,
              isProcessing = false;
            if (isDrift) {
              if ([ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(modelLifecycle)) {
                allowReTrain = false;
                isProcessing = true;
              }
            } else {
              if ([ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, ModelLifecycle.TRAINING, ModelLifecycle.EVALUATING].includes(modelLifecycle)) {
                allowReTrain = false;
                isProcessing = true;
              }
            }
            if (isPnp) {
              allowReTrain = false;
            }

            let retrainElem = null;
            if (projectId != null) {
              if (isDrift || isPnpPython) {
                retrainElem = (
                  <ModalConfirm
                    onConfirm={this.onClickReTrainDrift.bind(this, modelId, projectId, isDrift)}
                    title={`Are you sure you want to Re-${isDrift ? 'Run' : 'Train'} the model?`}
                    icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                    okText={isDrift ? 'Re-Run' : 'Re-Train'}
                    cancelText={'Cancel'}
                    okType={'primary'}
                  >
                    <span style={{ cursor: 'pointer' }} className={sd.styleTextBlueBright}>
                      {isDrift ? 'Re-Run' : 'Re-Train'}
                    </span>
                  </ModalConfirm>
                );
              } else {
                retrainElem = (
                  <Link to={['/' + PartsLink.model_train + '/' + projectId, 'editModelId=' + encodeURIComponent(modelId ?? '')]}>
                    <span style={{ cursor: 'pointer' }} className={sd.styleTextBlueBright}>
                      Re-Train
                    </span>
                  </Link>
                );
              }
            }

            res.push(
              <div key={'modeone_' + res.length} style={{ marginTop: '18px' }}>
                <div>
                  <Link to={'/' + (isDrift ? PartsLink.model_detail_monitor : PartsLink.model_detail) + '/' + modelId + partProject}>
                    <span style={{ cursor: 'pointer' }} className={sd.styleTextBlue}>
                      {isDrift ? m1.name : m1.get('name')}
                    </span>
                  </Link>
                </div>
                {newDataAvailable && (
                  <div>
                    <span className={sd.styleTextGrayLight}>
                      &nbsp;
                      <FontAwesomeIcon icon={['far', 'clock']} transform={{ size: 16, x: 0 }} style={{ marginRight: '5px' }} />
                      Out&nbsp;of&nbsp;Date
                    </span>
                  </div>
                )}
                <div>
                  <span className={sd.styleTextGray}>{trainedState}</span>
                </div>
                <div>
                  {allowReTrain && !isPnpLocation && <span>&nbsp;{retrainElem}</span>}
                  {allowReTrain && !isPnpPython && !isDrift && (
                    <span>
                      {isPnpLocation ? null : <span>&nbsp;-&nbsp;</span>}
                      <Link to={partProject ? ['/' + PartsLink.model_metrics + partProject, 'detailModelId=' + modelId] : null}>
                        <span style={{ cursor: 'pointer' }} className={sd.styleTextBlueBright}>
                          Metrics
                        </span>
                      </Link>
                    </span>
                  )}
                </div>
              </div>,
            );

            if (isPnp && !isProcessing) {
              let paramModel1 = '',
                aaProps: any = {};

              if (isDockerPnp) {
                //
              } else if (isPnpUpload) {
                if (!Utils.isNullOrEmpty(lastModelId)) {
                  paramModel1 = '&newVersionForModel=' + lastModelId;
                }
                aaProps.onClick = () => {
                  Location.push('/' + PartsLink.dataset_for_usecase + '/' + projectId, undefined, 'useCase=' + useCase + '&useCaseTag=true' + paramModel1);
                };
              }

              let styleButtonAction: CSSProperties = { height: '28px', width: '100%', marginTop: '5px' };
              styleButtonAction.backgroundColor = 'transparent';
              styleButtonAction.border = '1px solid white';

              let actionString: any = isPnpUpload === false || isDockerPnp ? 'Re-Import New Version' : 'File Upload New Version';
              let actionButton: any = (
                <Button {...aaProps} style={styleButtonAction} type={'primary'}>
                  {actionString}
                </Button>
              );

              if (isPnpUpload === false || isDockerPnp) {
                actionButton = (
                  <ModalConfirm
                    onConfirm={this.onClickReimportPnpData.bind(this, lastModelId, projectId, isDockerPnp)}
                    title={`Do you want Re-Import ${isDockerPnp ? 'docker image' : 'all files'} and train a new model?`}
                    icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                    okText={'Re-Import'}
                    cancelText={'Cancel'}
                    okType={'primary'}
                  >
                    {actionButton}
                  </ModalConfirm>
                );
              }

              res.push(<div key={'new_version_model' + res.length}>{actionButton}</div>);
            }
          }
        });

        return { list: res, lastModelId, anyPnpLocationUsed, anyFailed, latestTraining, allCompleted, anyComplete, anyCompleteAnyVersion };
      }
    },
  );

  onClickReimportPnpData = (modelId, projectId, isDockerPnp, e) => {
    if (modelId) {
      if (isDockerPnp) {
        REClient_.client_().createModelVersionFromDockerImage(modelId, (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.getProjectsList_();
            StoreActions.getProjectsById_(projectId);
            StoreActions.listModels_(projectId);
            StoreActions.getProjectDatasets_(projectId);
            StoreActions.validateProjectDatasets_(projectId);

            StoreActions.modelsVersionsByModelId_(res?.result?.modelId);
            StoreActions.refreshDoModelAll_(res?.result?.modelId, projectId);
          }
        });
      } else {
        REClient_.client_().createModelVersionFromFiles(modelId, (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.getProjectsList_();
            StoreActions.getProjectsById_(projectId);
            StoreActions.listModels_(projectId);
            StoreActions.getProjectDatasets_(projectId);
            StoreActions.validateProjectDatasets_(projectId);

            StoreActions.modelsVersionsByModelId_(res?.result?.modelId);
            StoreActions.refreshDoModelAll_(res?.result?.modelId, projectId);
          }
        });
      }
    }
  };

  onChangeChecked = (keys) => {
    this.setState({
      checkedKeys: keys,
    });
  };

  onClickReTrainDrift = (modelId, projectId, isDrift, e) => {
    e && e.stopPropagation();

    if (!projectId || !modelId) {
      return;
    }

    if (isDrift) {
      REClient_.client_().rerunModelMonitor(modelId, (err1, res) => {
        if (err1) {
          REActions.addNotificationError(err1);
        } else {
          if (res && res.success) {
            let resL = res;
            if (resL && resL.result && resL.result) {
              let modelMonitorId = resL.result.modelMonitorId;
              if (modelMonitorId != null) {
                setTimeout(() => {
                  StoreActions.listMonitoringModels_(projectId);
                  StoreActions.describeModelMonitorById_(modelMonitorId);
                  StoreActions.refreshDoMonitorAll_(modelMonitorId, projectId);
                }, 100);
              }
            }
          }
        }
      });
    } else {
      REClient_.client_().retrainModel(modelId, null, null, null, null, null, null, null, (err1, res) => {
        if (err1) {
          REActions.addNotificationError(err1);
        } else {
          if (res && res.success) {
            let resL = res;
            if (resL && resL.result && resL.result) {
              let listModelIds = [resL.result.modelId];
              if (listModelIds && listModelIds.length > 0) {
                setTimeout(() => {
                  StoreActions.listModels_(projectId);
                  (listModelIds || []).some((mId1) => {
                    StoreActions.modelsVersionsByModelId_(mId1);
                    StoreActions.refreshDoModelAll_(mId1, projectId);
                  });
                }, 100);
              }
            }
          }
        }
      });
    }
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memUseCase = memoizeOneCurry((doCall, useCases, useCase) => {
    if (useCases && useCase) {
      if (useCases.get('isRefreshing')) {
        return;
      }

      if (useCases.get('neverDone')) {
        if (doCall) {
          StoreActions.getUseCases_();
        }
      } else {
        let list = useCases.get('list');
        if (list) {
          return list.find((u1) => u1.useCase === useCase);
        }
      }
    }
  });

  memDatasetSpans: (foundProject1, projectId) => { anyProcessing; datasetSpan; anyDatasetUploaded } = memoizeOne((foundProject1, projectId) => {
    let datasetSpan: any[] = null,
      anyDatasetUploaded = null,
      anyProcessing = null;
    if (projectId && foundProject1 && foundProject1.allProjectDatasets) {
      datasetSpan = [];
      anyDatasetUploaded = false;
      foundProject1.allProjectDatasets.some((pd1) => {
        if (pd1 && pd1.dataset && pd1.dataset.lastVersion) {
          let d1 = pd1.dataset.lastVersion;
          if ([DatasetLifecycle.COMPLETE].includes(d1.status)) {
            anyDatasetUploaded = true;
          }
          if ([DatasetLifecycle.CONVERTING, DatasetLifecycle.IMPORTING, DatasetLifecycle.INSPECTING, DatasetLifecycle.PENDING, DatasetLifecycle.UPLOADING].includes(d1.status)) {
            anyProcessing = true;
          }

          if (d1) {
            if (datasetSpan.length !== 0) {
              datasetSpan.push(<span key={'sep_' + datasetSpan.length}>, </span>);
            }
            datasetSpan.push(
              <Link key={'val_' + datasetSpan.length} to={'/' + PartsLink.dataset_detail + '/' + pd1.dataset.datasetId + '/' + projectId}>
                <span className={sd.link}>{pd1.dataset.name || '-'}</span>
              </Link>,
            );
          }
        }
      });
    }
    return { datasetSpan, anyDatasetUploaded, anyProcessing };
  });

  memValidationAnyError: (doCall) => (defDatasetsParam, projects, projectId, foundProject1) => { anyDatasetMissing: boolean; validation: any; anyError: boolean } = memoizeOneCurry(
    (doCall, defDatasetsParam, projects, projectId, foundProject1) => {
      if (!projects || !projectId || !foundProject1) {
        return null;
      }

      let anyError = false,
        anyDatasetMissing = false;

      let validationRes = defDatasets.memValidationForProjectId(doCall, projectId);
      if (validationRes?.datasetErrors?.length > 0) {
        anyError = true;
      }
      if (validationRes?.datasetErrors?.find((e1) => e1?.error?.toUpperCase() === 'MISSING_REQUIRED_FEATURE_GROUP') != null) {
        anyDatasetMissing = true;
      }

      return { validation: validationRes, anyError, anyDatasetMissing };
    },
  );

  memShowHelpStep3 = memoizeOne((authUser) => {
    if (authUser) {
      if (authUser.get('neverDone') || authUser.get('data') == null) {
        return false;
      }
      return authUser.getIn(['data', 'info', 'preferences', 'helpStep3']) !== true;
    }
  });

  memShowHelpStep4 = memoizeOne((authUser) => {
    if (authUser) {
      if (authUser.get('neverDone') || authUser.get('data') == null) {
        return false;
      }
      return authUser.getIn(['data', 'info', 'preferences', 'helpStep4']) !== true;
    }
  });

  onClickDeployCircle = (e) => {
    StoreActions.updateUserPreferences_({ helpStep4: true });
  };

  onClickHideHelpStep3 = (e) => {
    e.preventDefault();
    e.stopPropagation();

    StoreActions.updateUserPreferences_({ helpStep3: true });
  };

  onClickHideHelpStep4 = (e) => {
    e.preventDefault();
    e.stopPropagation();

    StoreActions.updateUserPreferences_({ helpStep4: true });
  };

  onChangeWinSize = (isMedium, isSmall, isLarge) => {
    if (this.state.isMedium !== isMedium) {
      this.setState({
        isMedium,
      });
    }
  };

  memFeatureGroupsForProject = memoizeOneCurry((doCall, featureGroupsParam, projectId) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

  memShouldShowAddStream = memoizeOne((useCaseInfo, foundProject1) => {
    return useCaseInfo && Utils.tryJsonParse(useCaseInfo)?.uiCustom?.streaming && foundProject1?.allProjectDatasets && !foundProject1?.allProjectDatasets?.some((d) => d.streamingDatasetId);
  });

  memFeatureGroups = memoizeOne((featureGroupsList) => {
    return { isEmpty: featureGroupsList == null || featureGroupsList?.length === 0 };
  });

  onClickStarred = (projectId, isStarred, e) => {
    REClient_.client_()._starProject(projectId, isStarred, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.getProjectsById_(projectId);
      }
    });
  };

  render() {
    let { paramsProp, projectId, projects, defDatasets } = this.props;

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let useCase = null;
    let isEmbeddingsOnly = null;
    let isAiAgent = false;
    if (foundProject1) {
      useCase = foundProject1.useCase;
      isEmbeddingsOnly = useCase === 'EMBEDDINGS_ONLY';
      isAiAgent = useCase === 'AI_AGENT';
    }

    if (!foundProject1) {
      return <div></div>;
    }

    let isDrift = foundProject1?.isDrift;
    let isPnp = foundProject1?.isPnp;
    let isPnpPython = foundProject1?.isPnpPython === true;
    let isFeatureStore = foundProject1?.isFeatureStore;

    let featureGroupsList = this.memFeatureGroupsForProject(false)(this.props.featureGroups, projectId);
    let featureGroupsRes = this.memFeatureGroups(featureGroupsList);
    const featureGroupsResIsEmpty = featureGroupsRes?.isEmpty;

    let deploymentsListRes = this.memDeploymentList(false)(this.props.deployments, projectId);
    let deploymentsList = deploymentsListRes?.list;

    let modelList = isDrift ? null : this.memModelList(false)(this.props.models, projectId);
    let modelMonitoringList = isDrift ? this.memModelListMonitoring(false)(this.props.monitoring, projectId) : null;

    let modelSpansRes = this.memModelsSpans(isEmbeddingsOnly, isPnp, isPnpPython, isDrift, modelList, modelMonitoringList, deploymentsList, useCase);
    let modelSpans = modelSpansRes?.list;
    let modelLatestTraining = modelSpansRes?.latestTraining ?? false;
    let modelLastModelId = modelSpansRes?.lastModelId;
    let modelAnyPnpLocationUsed = modelSpansRes?.anyPnpLocationUsed ?? false;
    let modelAnyFailed = modelSpansRes?.anyFailed ?? false;
    let modelAllCompleted = modelSpansRes?.allCompleted ?? false;
    let modelAnyComplete = modelSpansRes?.anyComplete ?? false;
    let modelAnyCompleteAnyVersion = modelSpansRes?.anyCompleteAnyVersion ?? false;
    let deployAnyDeploying = deploymentsListRes?.deployAnyDeploying;
    let deployAnyStopped = deploymentsListRes?.anyStopped;
    let deployAnyComplete = deploymentsListRes?.deployAnyComplete;
    let deploymentsSpans = this.memDeploymentSpans(deploymentsList, projectId, isPnpPython);

    let modelId = null;
    if (modelList) {
      let modelFound1 = modelList.find((m1) => !m1.get('baselineModel') && [ModelLifecycle.COMPLETE].includes(m1.getIn(['latestModelVersion', 'status'])) && m1.getIn(['latestModelVersion', 'automlComplete']) === true);
      if (modelFound1) {
        modelId = modelFound1.get('modelId');
      }
    }

    let useCaseOne = this.memUseCase(false)(this.props.useCases, useCase);
    const problemType = useCaseOne?.problemType;

    let datasetSpanRes = this.memDatasetSpans(foundProject1, projectId);
    let datasetSpan: any[] = datasetSpanRes?.datasetSpan;
    let anyProcessingDataset = datasetSpanRes?.anyProcessing;
    let { validation, anyError, anyDatasetMissing } = this.memValidationAnyError(false)(defDatasets, this.props.projects, projectId, foundProject1) ?? {};
    let allUploaded = false,
      needConfirm = false,
      anyRequiredUploaded = false,
      allRequiredUploaded;
    if (validation) {
      allUploaded = true;
      allRequiredUploaded = true;
      if (!validation.requiredDatasets || validation.requiredDatasets.length === 0) {
        allUploaded = false;
        allRequiredUploaded = false;
      }

      validation.requiredDatasets?.some((r1) => {
        let r1Check = r1.schemaExists;

        if (r1Check === true) {
          anyRequiredUploaded = true;
        } else {
          allRequiredUploaded = false;
        }
        if (r1Check === false) {
          allUploaded = false;
        }
      });
      let listAll = (validation.requiredDatasets || []).concat(validation.optionalDatasets || []);
      listAll?.some((r1) => {
        if (r1.uploaded === true && r1.confirmed === false) {
          needConfirm = true;
          return true;
        }
      });
    }

    let anyDataset = datasetSpan && datasetSpan.length > 0;
    let showCreateDeployment = false,
      showCreateModel = false,
      enabledCreateDeploys = false,
      enabledCreateModel = false;
    let linkDeploy = null;

    let activeStep = 0;
    if (foundProject1 && datasetSpan != null && (modelList != null || modelMonitoringList != null)) {
      activeStep = isAiAgent ? 3 : 1;
      if (!anyDatasetMissing && allRequiredUploaded) {
        activeStep = 2;
      }
      if (activeStep === 2 && !anyError && !needConfirm) {
        activeStep = 3;
      }
      if (activeStep === 3 && modelSpans && modelSpans.length > 0 && !modelLatestTraining && modelAllCompleted) {
        activeStep = 4;
      }
      if (activeStep === 4 && deploymentsSpans && deploymentsSpans.length > 0 && !deployAnyDeploying) {
        activeStep = 5;
        // return <div></div>;
      }

      showCreateModel = !isPnp && datasetSpanRes != null && datasetSpanRes?.anyDatasetUploaded && (!modelSpans || modelSpans.length === 0) && (!deploymentsSpans || deploymentsSpans.length === 0) && !modelAnyCompleteAnyVersion;
      if (!isPnp && modelLatestTraining && !modelAnyCompleteAnyVersion) {
        showCreateModel = true;
      }
      enabledCreateModel = !isPnp && datasetSpan && datasetSpan.length > 0 && activeStep > 2;
      showCreateModel = (!featureGroupsResIsEmpty && !modelAnyComplete && !modelAnyFailed) || isAiAgent;
      enabledCreateModel = true;

      if (isDrift && modelSpans?.length > 0) {
        showCreateModel = false;
      }
      showCreateDeployment = !isPnp && (!deploymentsSpans || deploymentsSpans.length === 0) && modelId != null;
      if (!isPnp && (deployAnyDeploying || deployAnyStopped) && !isDrift) {
        showCreateDeployment = true;
      }
      enabledCreateDeploys = modelId != null && activeStep > 2;
      if (problemType === 'CUSTOM_ALGORITHM') enabledCreateDeploys = modelId != null;
      if (projectId && modelId != null) {
        linkDeploy = '/' + PartsLink.deploy_create + '/' + modelId + '/' + projectId;
      }
    }

    let showHelpStep3 = !isAiAgent && showCreateModel && enabledCreateModel && activeStep === 3 && this.memShowHelpStep3(this.props.authUser);
    let showHelpStep4 = showCreateDeployment && !deployAnyStopped && enabledCreateDeploys && !showHelpStep3 && activeStep === 4 && this.memShowHelpStep4(this.props.authUser);

    const isMedium = this.state.isMedium;
    const maxHeight = 640;
    const steps12 = (
      <>
        {!isPnp && (
          <DashboardStepRect active={activeStep === 1} title={'STEP 1'} style={{ flex: 1, marginRight: '24px', overflow: 'auto', maxHeight, backgroundColor: '#0c121b' }}>
            <div style={{ position: 'relative', display: 'block', height: '100%', padding: '22px 22px 6px 22px' }} className={sd.grayPanel}>
              <div style={{ whiteSpace: 'nowrap', marginBottom: '4px', marginLeft: '4px', cursor: 'pointer', fontFamily: 'Matter', fontSize: '16px', fontWeight: 500 }} onClick={this.onClickDatasetHeader}>
                <FontAwesomeIcon icon={IconDatasets} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, marginRight: '3px' }} />
                Set-up {isPnp ? 'Artifacts' : 'Data Pipelines'}&nbsp;
                <HelpIcon id={isPnp ? 'datasetsPnp' : 'dataset'} />
              </div>
              {useCase != null && projectId != null && (
                <DatasetForUseCase
                  featureGroupsCount={featureGroupsList?.length ?? 0}
                  lastModelId={modelLastModelId}
                  anyPnpLocationUsed={modelAnyPnpLocationUsed}
                  anyModel={modelAnyCompleteAnyVersion || modelAnyFailed || modelLatestTraining || modelAnyComplete}
                  isDash={true}
                  useCase={useCase}
                  projectId={projectId}
                  useCaseTag={true}
                />
              )}
            </div>
          </DashboardStepRect>
        )}

        {!isPnp && (
          <DashboardStepRect isError={anyError && activeStep >= 2} active={activeStep === 2} title={'STEP 2'} style={{ flex: 1, marginRight: (isMedium ? 12 : 24) + 'px', overflow: 'auto', maxHeight, backgroundColor: '#0c121b' }}>
            <div style={{ position: 'relative', display: 'block', height: '100%', padding: '22px 22px 6px 22px' }} className={sd.grayPanel}>
              <div style={{ whiteSpace: 'nowrap', marginBottom: '4px', marginLeft: '4px', cursor: 'pointer', fontFamily: 'Matter', fontSize: '16px', fontWeight: 500 }} onClick={this.onClickFeatureGroupsHeader}>
                <FontAwesomeIcon icon={IconFeatureGroups} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, marginRight: '3px' }} />
                Feature Groups&nbsp;
                <HelpIcon id={'featuregroups'} />
              </div>
              <FeatureGroupsStep showErrors={allRequiredUploaded && !anyProcessingDataset} />
            </div>
          </DashboardStepRect>
        )}
      </>
    );
    let modelSpansEmpty = modelSpans == null || modelSpans.length === 0;
    let deploySpansEmpty = deploymentsSpans == null || deploymentsSpans.length === 0;
    const steps34 = (
      <>
        {!isFeatureStore && (
          <DashboardStepRect active={activeStep === 3} title={'STEP ' + (isPnp ? 1 : 3)} style={{ marginRight: '24px', maxWidth: isMedium ? '' : isPnp ? '' : '30%', flex: 1, overflow: 'auto', maxHeight, backgroundColor: '#0c121b' }}>
            <div style={{ position: 'relative', display: 'block', height: '100%', padding: '22px 22px 6px 22px' }} className={sd.grayPanel}>
              <div style={{ whiteSpace: 'nowrap', marginBottom: '4px', marginLeft: '4px', cursor: 'pointer', fontFamily: 'Matter', fontSize: '16px', fontWeight: 500 }} onClick={this.onClickModelsHeader.bind(this, isDrift)}>
                <FontAwesomeIcon icon={IconModels} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, marginRight: '3px' }} />
                {isDrift ? '' : isPnpPython ? 'Register' : isPnp ? 'Process' : isAiAgent ? 'Create' : 'Train'} {isEmbeddingsOnly ? 'Catalogs' : isAiAgent ? 'Agents' : 'Model' + (isDrift ? '' : 's')}
                {isDrift ? ' Monitors' : ''}&nbsp;
                <HelpIcon id={isDrift ? 'modelsstepdrift' : isPnpPython ? 'modelsregisterpnppython' : isPnp ? 'modelsprocesssteppnp' : isAiAgent ? 'createagentstatuses' : 'modeltrainingstatuses'} />
              </div>
              {(isPnp || isDrift || !modelLatestTraining || modelAnyCompleteAnyVersion) && <div style={{ fontFamily: 'Roboto', fontSize: '14px', color: '#8798ad' }}>{modelSpans}</div>}
              {!isPnp && !isDrift && showCreateModel && modelLatestTraining && (!(isPnp || !modelLatestTraining || modelAnyCompleteAnyVersion) || modelSpansEmpty) && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', padding: '5px 20px 10px 20px' }} className={sd.styleTextGray}>
                  May take a few hours, check back later
                </div>
              )}
              {!isPnp && showCreateModel && (!(isPnp || !modelLatestTraining || modelAnyCompleteAnyVersion) || modelSpansEmpty) && (
                <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CircleButtonStart
                    linkTo={projectId ? '/' + (isDrift ? PartsLink.model_create_drift : isPnpPython ? PartsLink.model_register : isAiAgent ? PartsLink.agent_one : PartsLink.model_train) + '/' + projectId : ''}
                    text={isDrift ? 'Create' : isPnpPython ? 'Register Model' : isAiAgent ? 'Create Agents' : 'Train models'}
                    enabled={enabledCreateModel}
                    showProgress={modelLatestTraining}
                    progressText={isDrift ? 'Processing...' : 'Training...'}
                  />
                </div>
              )}

              {!isPnp && !isDrift && showHelpStep3 && (
                <img src={calcImgSrc('/imgs/helpStep3.png')} alt={''} style={{ zIndex: 100, position: 'absolute', bottom: '10px', left: '10px', width: isMedium ? '270px' : '210px', cursor: 'pointer' }} onClick={this.onClickHideHelpStep3} />
              )}
            </div>
          </DashboardStepRect>
        )}

        {!isFeatureStore && !isDrift && (
          <DashboardStepRect active={activeStep === 4} title={'STEP ' + (isPnp ? 2 : 4)} style={{ marginRight: '12px', maxWidth: isMedium ? '' : isPnp ? '' : '30%', flex: 1, overflow: 'auto', maxHeight, backgroundColor: '#0c121b' }}>
            <div style={{ position: 'relative', display: 'block', height: '100%', padding: '22px 22px 6px 22px' }} className={sd.grayPanel}>
              <div style={{ whiteSpace: 'nowrap', marginBottom: '4px', marginLeft: '4px', cursor: 'pointer', fontFamily: 'Matter', fontSize: '16px', fontWeight: 500 }} onClick={this.onClickDeploysHeader}>
                <FontAwesomeIcon icon={IconDeploys} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, marginRight: '3px' }} />
                Manage Deployments&nbsp;
                <HelpIcon id={'managedeployments'} />
              </div>
              {(!deployAnyDeploying || deployAnyComplete || deployAnyStopped || isPnp) && <div style={{ marginLeft: '20px', fontFamily: 'Roboto', fontSize: '14px', color: '#8798ad' }}>{deploymentsSpans}</div>}
              {!isPnp && showCreateDeployment && !deployAnyStopped && (!(!deployAnyDeploying || deployAnyComplete || deployAnyStopped || isPnp) || deploySpansEmpty) && (
                <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CircleButtonStart onClick={this.onClickDeployCircle} linkTo={linkDeploy} text={'Start deployment'} enabled={enabledCreateDeploys} showProgress={deployAnyDeploying} progressText={'Deploying...'} />
                </div>
              )}

              {!isPnp && showHelpStep4 && (
                <img src={calcImgSrc('/imgs/helpStep4.png')} alt={''} style={{ zIndex: 100, position: 'absolute', bottom: '10px', left: '10px', width: isMedium ? '270px' : '210px', cursor: 'pointer' }} onClick={this.onClickHideHelpStep4} />
              )}
            </div>
          </DashboardStepRect>
        )}
      </>
    );

    return (
      <div>
        <WindowSizeSmart onChange={this.onChangeWinSize} />
        {useCaseOne != null && (
          <div style={{ height: '16px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', margin: '0 0 20px 0', justifyContent: 'center', fontFamily: 'Matter', fontSize: '12px', fontWeight: 600, color: '#f1f1f1' }}>
            {projectId != null && (
              <span style={{ marginRight: '50px' }}>
                <span style={{ marginRight: '5px', color: Utils.colorA(0.8) }}>Starred:&nbsp;</span>
                <StarredSpan onClick={this.onClickStarred.bind(this, projectId)} isStarred={foundProject1?.starred} />
              </span>
            )}

            {projectId != null && (
              <span style={{ marginRight: '50px' }}>
                <span style={{ marginRight: '5px', color: Utils.colorA(0.8) }}>Project ID:</span>
                <CopyText>{projectId}</CopyText>
              </span>
            )}

            <span style={{ marginRight: '8px', color: Utils.colorA(0.8) }}>Use Case:</span>
            <span>
              <img src={useCaseOne ? calcImgSrc('/imgs/' + useCaseOne.imgSrc) : Constants.transparentPixelBase64} alt={''} style={{ height: '15px', marginRight: '5px' }} />
            </span>
            <span>{useCaseOne && useCaseOne.prettyNameWeb}</span>
            {useCaseOne?.useCase != null && (
              <span style={{ marginLeft: '5px' }}>
                <HelpIcon id={'usecase_current_project'} />
              </span>
            )}
          </div>
        )}

        {
          <div style={{ position: 'relative', marginTop: '10px', textAlign: 'center' }}>
            <ProjectTags />
          </div>
        }

        {isMedium && (
          <div>
            <div style={{ display: 'flex' }} className={s.root}>
              {steps12}
            </div>
            <div style={{ marginTop: '15px', display: 'flex' }} className={s.root}>
              {steps34}
            </div>
          </div>
        )}
        {!isMedium && (
          <div style={{ display: 'flex' }} className={s.root}>
            {steps12}
            {steps34}
          </div>
        )}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    models: state.models,
    datasets: state.datasets,
    deployments: state.deployments,
    useCases: state.useCases,
    defDatasets: state.defDatasets,
    authUser: state.authUser,
    featureGroups: state.featureGroups,
    monitoring: state.monitoring,
  }),
  null,
)(ProjectDashboardSteps);
