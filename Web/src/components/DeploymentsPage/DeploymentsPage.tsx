import Modal from 'antd/lib/modal';
import * as Immutable from 'immutable';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import datasetsReq, { calcDataset_datasetType, DatasetLifecycle } from '../../stores/reducers/datasets';
import { calcDeploymentsByProjectId, DeploymentLifecycle } from '../../stores/reducers/deployments';
import { calcModelListByProjectId, ModelLifecycle } from '../../stores/reducers/models';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import DeploymentsList from '../DeploymentsList/DeploymentsList';
import DeploymentsTokensList from '../DeploymentsTokensList/DeploymentsTokensList';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./DeploymentsPage.module.css');
const sd = require('../antdUseDark.module.css');
const { confirm } = Modal;

interface IDeploymentsPageProps {
  deployments?: any;
  paramsProp?: any;
  projectDatasets?: any;
  models?: any;
  datasets?: any;
  projects?: any;
}

interface IDeploymentsPageState {}

class DeploymentsPage extends React.PureComponent<IDeploymentsPageProps, IDeploymentsPageState> {
  private isM: boolean;
  confirmRestartAll: any;
  alreadyShowRestartAll: boolean;

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

    if (this.confirmRestartAll != null) {
      this.confirmRestartAll.destroy();
      this.confirmRestartAll = null;
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
    if (!projectId) {
      return;
    }

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let listDatasetsProj = this.memProjectDatasets(true)(this.props.projectDatasets, projectId);
    let listDatasets = this.memDatasetsList(true)(this.props.datasets, listDatasetsProj);
    let listModels = this.memModelList(true)(this.props.models, projectId);

    let listDeployments = this.memDeploymentList(true)(this.props.deployments, projectId);
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  componentDidUpdate(prevProps: Readonly<IDeploymentsPageProps>, prevState: Readonly<IDeploymentsPageState>, snapshot?: any): void {
    this.doMem();
  }

  onClickTrainAModel = (e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (projectId) {
      Location.push('/' + PartsLink.model_train + '/' + projectId);
    }
  };

  onClickCreateDeployment = (e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let modelId = this.calcModelId();
    if (modelId && projectId) {
      Location.push('/' + PartsLink.deploy_create + '/' + modelId + '/' + projectId);
    }
  };

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId) => {
    if (deployments && projectId) {
      if (deployments.get('isRefreshing') !== 0) {
        return;
      }
      //
      let res = calcDeploymentsByProjectId(undefined, projectId);
      if (res == null) {
        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        return res;
      }
    }
  });

  memAnyDeployment: (list) => { anyProcessing; anyActive; anyStopped; anyError } = memoizeOne((list) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');

    let anyActive = false,
      anyProcessing = false,
      anyStopped = false,
      anyError = false;
    list?.some((d1) => {
      if ([DeploymentLifecycle.STOPPED, DeploymentLifecycle.STOPPING].includes(d1.status)) {
        anyStopped = true;
      }
      if ([DeploymentLifecycle.ACTIVE].includes(d1.status)) {
        anyActive = true;
      }
      if ([DeploymentLifecycle.FAILED, DeploymentLifecycle.CANCELLED].includes(d1.status)) {
        anyError = true;
      }
      if ([DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING].includes(d1.status)) {
        anyProcessing = true;

        if (projectId) {
          StoreActions.refreshDoDeployAll_(d1.deploymentId, projectId);
        }
      }
    });
    return { anyProcessing, anyActive, anyStopped, anyError };
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

  memModelStates: (listModels) => { anyComplete; anyTraining; firstCompleteModelId } = memoizeOne((listModels) => {
    if (!listModels) {
      return null;
    }

    let anyComplete = null,
      anyTraining = null,
      firstCompleteModelId = null;
    listModels.some((m1) => {
      let lifecycle1 = m1.getIn(['latestModelVersion', 'status']);
      if ([ModelLifecycle.COMPLETE].includes(lifecycle1)) {
        if (firstCompleteModelId == null) {
          firstCompleteModelId = m1.get('modelId');
        }
        anyComplete = true;
      }
      if ([ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, ModelLifecycle.EVALUATING, ModelLifecycle.TRAINING].includes(lifecycle1)) {
        anyTraining = true;
      }
    });
    return { anyComplete, anyTraining, firstCompleteModelId };
  });

  memDatasetProjectState: (listDataset) => { anyComplete; anyProcessing; firstCompleteDatasetId } = memoizeOne((listDataset) => {
    if (!listDataset) {
      return null;
    }

    let anyComplete = null,
      anyProcessing = null,
      firstCompleteDatasetId = null;
    listDataset.some((d1) => {
      let lifecycle1 = d1.status;
      if ([DatasetLifecycle.COMPLETE].includes(lifecycle1)) {
        if (firstCompleteDatasetId == null) {
          firstCompleteDatasetId = d1.modelId;
        }
        anyComplete = true;
      }
      if ([DatasetLifecycle.UPLOADING, DatasetLifecycle.CONVERTING, DatasetLifecycle.PENDING, DatasetLifecycle.INSPECTING, DatasetLifecycle.IMPORTING].includes(lifecycle1)) {
        anyProcessing = true;
      }
    });
    return { anyComplete, anyProcessing, firstCompleteDatasetId };
  });

  memCalcDatasetList = memoizeOne((listDatasets, projectId) => {
    if (!listDatasets || !projectId) {
      return null;
    }

    let res = [];

    if (Utils.isNullOrEmpty(projectId)) {
      listDatasets = [];
    }

    Object.values(listDatasets).some((d1: Immutable.Map<string, any>) => {
      let datasetId = d1.getIn(['dataset', 'datasetId']);
      res.push({
        datasetId: datasetId,
        name: d1.getIn(['dataset', 'name']),
        updatedAt: d1.get('updatedAt'),
        datasetType: calcDataset_datasetType(d1, projectId),
        status: d1.getIn(['status']),
      });
    });

    return res;
  });

  calcModelId = () => {
    let modelId = this.props.paramsProp?.get('modelId');
    if (modelId) {
      return modelId;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId) {
      let listModels = this.memModelList(true)(this.props.models, projectId);
      let anyModelState = this.memModelStates(listModels);
      let modelId = anyModelState?.firstCompleteModelId;
      if (modelId) {
        return modelId;
      }
    }
  };

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, projectId) => {
    return projectDatasetsReq.memDatasetsByProjectId(doCall, projectDatasets, projectId);
  });

  memDatasetsList = memoizeOneCurry((doCall, datasets, listDatasets) => {
    if (listDatasets) {
      let ids = listDatasets.map((d1) => d1.dataset?.datasetId);
      return datasetsReq.memDatasetListCall(doCall, datasets, ids);
    }
  });

  onClickRestartAll = (listDeployments, e) => {
    const ids = listDeployments?.filter((d1) => d1?.status?.toLowerCase() === DeploymentLifecycle.STOPPED.toLowerCase())?.map((d1) => d1.deploymentId);
    if (ids != null) {
      ids.some((deploymentId) => {
        REClient_.client_().startDeployment(deploymentId, (err, res) => {
          if (err || !res) {
            // REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            // REActions.addNotification('Re-Starting Deployment');

            let projectId = this.props.paramsProp?.get('projectId');
            if (projectId) {
              StoreActions.deployList_(projectId);
            }
            StoreActions.listDeployVersions_(deploymentId);
            StoreActions.refreshDoDeployAll_(deploymentId, projectId);
          }
        });
      });
    }
  };

  // memBannerRestart = memoizeOne((allStoppedNonActive, listDeployments) => {
  //   if(allStoppedNonActive) {
  //     if(this.confirmRestartAll!=null || this.alreadyShowRestartAll) {
  //       return;
  //     }
  //     if(this.props.paramsProp?.get('modalDeployRefresh')) {
  //       return;
  //     }
  //
  //     this.confirmRestartAll = confirm({
  //       title: 'Do you want to restart all suspended deployments?',
  //       okText: 'Re-Start',
  //       okType: 'primary',
  //       cancelText: 'Cancel',
  //       maskClosable: true,
  //       width: 600,
  //       content: <div css={`margin-top: 30px;`}>
  //         <Alert type={'warning'} style={{ fontSize: '20px', borderRadius: '5px', }} message={<span css={`margin-left: 10px;`}>Your deployments are suspended</span>} />
  //       </div>,
  //       onOk: () => {
  //         this.alreadyShowRestartAll = true;
  //         this.onClickRestartAll(listDeployments, null);
  //       },
  //       onCancel: () => {
  //         this.alreadyShowRestartAll = true;
  //       },
  //     });
  //
  //   } else {
  //     if(this.confirmRestartAll!=null) {
  //       this.confirmRestartAll.destroy();
  //       this.confirmRestartAll = null;
  //     }
  //   }
  // });

  render() {
    let { models, deployments, paramsProp, projectDatasets } = this.props;

    let projectId = paramsProp && paramsProp.get('projectId');
    // let modelId = paramsProp && paramsProp.get('modelId');
    let msgMsg = null;

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    const isFeatureStore = foundProject1?.isFeatureStore;

    if (projectId) {
      let listDatasetsProj = this.memProjectDatasets(false)(this.props.projectDatasets, projectId);
      let listDatasets = this.memDatasetsList(false)(this.props.datasets, listDatasetsProj);
      let listDatasetCalc = this.memCalcDatasetList(listDatasets, projectId);
      let anyDatasetState = this.memDatasetProjectState(listDatasetCalc);

      let listModels = this.memModelList(false)(models, projectId);
      let anyModelState = this.memModelStates(listModels);

      let listDeployments = this.memDeploymentList(false)(deployments, projectId);
      let anyDeploysRes = this.memAnyDeployment(listDeployments);
      if (listModels != null && listDeployments != null && anyDeploysRes != null) {
        // let msgAction = null, onAction = null, msgIsRefresh = null;
        //
        // if(anyModelState?.anyComplete===true || anyDeploysRes?.anyActive || anyDeploysRes?.anyStopped) {
        //   if(anyDeploysRes.anyProcessing && !anyDeploysRes.anyActive && !anyDeploysRes.anyStopped) {
        //     msgMsg = 'Deployment in progress. This process typically takes 3 mins...';
        //     msgIsRefresh = true;
        //
        //   } else if (!anyDeploysRes.anyActive && !anyDeploysRes.anyProcessing && !anyDeploysRes.anyStopped && !anyDeploysRes.anyError) {
        //     msgMsg = 'There are no deployments';
        //     msgAction = 'Create New Deployment';
        //     onAction = this.onClickCreateDeployment;
        //   }
        //
        // } else if(anyModelState?.anyTraining) {
        //   msgMsg = 'Model is training...';
        //   msgIsRefresh = true;
        //
        // } else if(!anyDeploysRes?.anyStopped) {
        //   msgMsg = 'No models have been trained';
        //   if(anyDatasetState?.anyComplete) {
        //     msgAction = 'Train a Model';
        //     onAction = this.onClickTrainAModel;
        //   }
        // }
        // if(msgMsg!=null) {
        //   return <RefreshAndProgress isMsgAnimRefresh={msgIsRefresh} msgMsg={msgMsg} msgButtonText={msgAction} onClickMsgButton={onAction}></RefreshAndProgress>;
        // }
        // this.memBannerRestart(!anyDeploysRes?.anyActive && anyDeploysRes?.anyStopped && !anyDeploysRes?.anyProcessing, listDeployments);
      }
    }

    return (
      <div>
        <DeploymentsList isSmall={true} showCreate />
        <div>&nbsp;</div>
        {<DeploymentsTokensList isSmall={true} />}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    deployments: state.deployments,
    models: state.models,
    datasets: state.datasets,
    projectDatasets: state.projectDatasets,
    projects: state.projects,
  }),
  null,
)(DeploymentsPage);
