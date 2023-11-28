import Menu from 'antd/lib/menu';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import memoizeOne from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcDeploymentsByProjectId, DeploymentLifecycle } from '../../stores/reducers/deployments';
import { calcModelListByProjectId, ModelLifecycle } from '../../stores/reducers/models';
import { calcProjectByIdIsRefreshing, memProjectById } from '../../stores/reducers/projects';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./PredictionsCommonCanShow.module.css');
const sd = require('../antdUseDark.module.css');

interface IPredictionsCommonCanShowProps {
  errorLastCall?: string;
  checkActiveNeedDeploy?: boolean;
  urlDeployNeedsToBeActive?: boolean;
  msgNoDeploy?: string;
  children?: ({ optionsAlgo, content, needDeploy }) => any;
  allowNotEmpty?: boolean;
  onlyEmpty?: boolean;
  onReStartDeploy?: (deployId?) => void;
  onlyRestart?: boolean;
  offlineOnlyMsg?: any;
}

const PredictionsCommonCanShow = React.memo((props: PropsWithChildren<IPredictionsCommonCanShowProps>) => {
  const { paramsProp, deployments, models, projects } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    deployments: state.deployments,
    models: state.models,
    projects: state.projects,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  let projectId = paramsProp?.get('projectId');

  const projectOne = useProject(projectId);
  const isFeatureStore = projectOne?.isFeatureStore === true;

  let paramDeployId = paramsProp?.get('deployId') || null;
  if (paramDeployId === '-') {
    paramDeployId = null;
  }

  let errorLastCall = props.errorLastCall;
  if (!Utils.isNullOrEmpty(errorLastCall)) {
    return (
      <RefreshAndProgress
        errorMsg={errorLastCall}
        errorButtonText={'All projects'}
        onClickErrorButton={() => {
          Location.push('/' + PartsLink.project_list);
        }}
      >
        &nbsp;
      </RefreshAndProgress>
    );
  }

  const memAlgos = (doCall, deployments, projectId) => {
    if (projectId && deployments) {
      let optionsAlgo = [];

      let listAlgos = calcDeploymentsByProjectId(undefined, projectId);
      if (listAlgos != null) {
        listAlgos.some((a1) => {
          let lifecycle = a1.status;
          if (![DeploymentLifecycle.ACTIVE].includes(lifecycle)) {
            return false;
          }

          let obj1 = {
            label: '' + a1.name,
            value: a1.deploymentId,
            status: lifecycle,
          };
          optionsAlgo.push(obj1);
        });
      } else {
        if (deployments.get('isRefreshing') !== 0) {
          return null;
        } else {
          if (doCall) {
            StoreActions.deployList_(projectId);
          }
          return null;
        }
      }

      return optionsAlgo;
    }
  };
  useEffect(() => {
    memAlgos(true, deployments, projectId);
    memDeploymentList(true, deployments, projectId);
  }, [deployments, projectId]);

  let optionsAlgo = useMemo(() => {
    return memAlgos(false, deployments, projectId);
  }, [deployments, projectId]);
  let needDeploy = optionsAlgo != null && optionsAlgo.length === 0;
  if (props.checkActiveNeedDeploy) {
    needDeploy = optionsAlgo != null && optionsAlgo.filter((a1) => a1?.status?.toUpperCase() === 'ACTIVE').length === 0;
  }

  const memModelList = (doCall, models, projectId) => {
    if (models && !Utils.isNullOrEmpty(projectId)) {
      let listByProjectId = calcModelListByProjectId(undefined, projectId);
      if (listByProjectId != null) {
        return listByProjectId;
      }

      if (models.get('isRefreshing')) {
        return null;
      }

      if (listByProjectId == null) {
        if (doCall) {
          StoreActions.listModels_(projectId);
        }
      }
    }
  };
  useEffect(() => {
    memModelList(true, models, projectId);
  }, [models, projectId]);

  let listModels = useMemo(() => {
    return memModelList(false, models, projectId);
  }, [models, projectId]);

  //
  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectId, projects]);

  let projectFound1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectId, projects]);

  const memModelAllowDeploy = memoizeOne((listModels) => {
    if (!listModels) {
      return null;
    }

    let res = null;
    listModels.some((m1) => {
      let allowDeploy = true;
      let lifecycle1 = m1.getIn(['latestModelVersion', 'status']);
      if ((lifecycle1 || '') !== ModelLifecycle.COMPLETE) {
        allowDeploy = false;
      }
      if (m1.get('baselineModel')) {
        allowDeploy = false;
      }

      if (allowDeploy) {
        res = m1.get('modelId');
        return true;
      }
    });

    return res;
  });

  const memAnyDeployment: (list, onlyRestart) => { deploysOptions; onlyDeployId; anyProcessing; anyActive; anyStopped } = memoizeOne((list, onlyRestart) => {
    let anyActive = false,
      anyProcessing = false,
      anyStopped = false,
      onlyDeployId = null,
      deploysOptions = [];
    list?.some((d1) => {
      if (props.onlyRestart) {
        if (d1.deploymentId !== paramsProp?.get('deployId')) {
          return;
        }
      }

      if ([DeploymentLifecycle.ACTIVE].includes(d1.status)) {
        anyActive = true;
      }
      if ([DeploymentLifecycle.STOPPED, DeploymentLifecycle.STOPPING].includes(d1.status)) {
        anyStopped = true;
      }
      if ([DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING].includes(d1.status)) {
        anyProcessing = true;

        if (projectId) {
          StoreActions.refreshDoDeployAll_(d1.deploymentId, projectId);
        }
      }

      if (![DeploymentLifecycle.CANCELLED, DeploymentLifecycle.FAILED].includes(d1.status)) {
        deploysOptions.push({ label: d1.name, value: d1.deploymentId, deployedAt: d1.deployedAt });
      }
    });

    if (list?.length === 1) {
      onlyDeployId = list[0].deploymentId;
    }

    if (deploysOptions?.length > 1) {
      deploysOptions = deploysOptions.sort((a, b) => {
        return (b.deployedAt ?? '').localeCompare(a.deployedAt ?? '');
        // return (a.label || '').localeCompare((b.label || ''));
      });
    }

    return { onlyDeployId, anyProcessing, anyActive, anyStopped, deploysOptions };
  });

  const memDeploymentList = (doCall, deployments, projectId) => {
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
  };

  const doReStartDeployment = (deployId, e) => {
    REClient_.client_().startDeployment(deployId, (err, res) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Re-Starting Deployment');
        let projectId = paramsProp?.get('projectId');

        StoreActions.deployList_(projectId);
        StoreActions.listDeployVersions_(deployId);
        StoreActions.refreshDoDeployAll_(deployId, projectId);

        if (props.onReStartDeploy != null) {
          props.onReStartDeploy(deployId);
        } else if (paramsProp?.get('mode') === PartsLink.model_predictions) {
          Location.push('/' + PartsLink.model_predictions + '/' + projectId + '/' + deployId, undefined, Utils.processParamsAsQuery({}, window.location.search));
        }
      }
    });
  };

  const calcRequestBPId = () => {
    return Utils.tryParseInt(paramsProp?.get('requestBPId')?.split('_')?.[0]);
  };

  let content = null;
  if (Utils.isNullOrEmpty(projectId) || projects.get('neverDone')) {
    content = (
      <RefreshAndProgress msgMsg={'Retrieving Information'} isMsgAnimRefresh>
        &nbsp;
      </RefreshAndProgress>
    );
  } else {
    if (!projectFound1) {
      if (calcProjectByIdIsRefreshing(projectId) === 0) {
        content = (
          <RefreshAndProgress
            errorMsg={'Project not found'}
            errorButtonText={'All projects'}
            onClickErrorButton={() => {
              Location.push('/' + PartsLink.project_list);
            }}
          >
            &nbsp;
          </RefreshAndProgress>
        );
      } else {
        content = (
          <RefreshAndProgress msgMsg={'Retrieving Information'} isMsgAnimRefresh>
            &nbsp;
          </RefreshAndProgress>
        );
      }
    }

    if (deployments) {
      if (deployments.get('neverDone') || deployments.get('isRefreshing') !== 0) {
        content = null;
      } else if (listModels == null) {
        content = (
          <RefreshAndProgress msgMsg={'Retrieving Information'} isMsgAnimRefresh>
            &nbsp;
          </RefreshAndProgress>
        );
      } else {
        let paramDeployId = paramsProp?.get('deployId') || null;
        let urlDeployNeedsToBeActive = props.urlDeployNeedsToBeActive; /* && calcRequestBPId()!=null*/
        if ((needDeploy || props.onlyRestart || (paramDeployId != null && urlDeployNeedsToBeActive)) && projectFound1 && projectId) {
          let modelId = memModelAllowDeploy(listModels);

          let listDeployments = memDeploymentList(false, deployments, projectId);
          let anyRes = memAnyDeployment(listDeployments, props.onlyRestart);

          let actualParamActive = null;
          if (urlDeployNeedsToBeActive && paramDeployId != null) {
            actualParamActive = listDeployments?.find((d1) => d1?.deploymentId === paramDeployId)?.status?.toUpperCase() === 'ACTIVE';
          }

          let msgMsg = null,
            buttonString = null,
            onMsg = null,
            msgIsRefresh = null,
            msgMenu = null;
          if (urlDeployNeedsToBeActive) {
            if (actualParamActive === false) {
              if ([DeploymentLifecycle.PENDING, DeploymentLifecycle.DEPLOYING].includes(listDeployments?.find((d1) => d1?.deploymentId === paramDeployId)?.status?.toUpperCase())) {
                msgMsg = 'Deployment in progress. This process typically takes 3 mins...';
                msgIsRefresh = true;
              } else {
                msgMsg = props.msgNoDeploy || `The deployment must be online to make realtime predictions`;
                if (projectId) {
                  buttonString = 'Click here to re-start deployment';
                  onMsg = doReStartDeployment.bind(null, paramDeployId);
                }
              }
            }
          } else if (props.allowNotEmpty && (anyRes?.anyActive || anyRes?.anyStopped || anyRes?.anyProcessing) && !props.onlyRestart) {
            //
          } else if (props.onlyRestart && anyRes?.anyActive) {
            //
          } else if (anyRes?.anyProcessing && !props.onlyEmpty) {
            msgMsg = 'Deployment in progress. This process typically takes 3 mins...';
            msgIsRefresh = true;
          } else if (anyRes?.anyStopped && !props.onlyEmpty) {
            msgMsg = props.msgNoDeploy || `A deployment must be online to make realtime predictions`;
            if (projectId && (anyRes?.onlyDeployId || props.onlyRestart)) {
              buttonString = 'Click here to deploy';
              onMsg = doReStartDeployment.bind(null, props.onlyRestart ? paramsProp?.get('deployId') : anyRes?.onlyDeployId);
            } else if (anyRes?.deploysOptions?.length > 0) {
              buttonString = 'Click here to deploy';
              let popupContainerForMenu = (node) => document.getElementById('body2');
              msgMenu = (
                <Menu getPopupContainer={popupContainerForMenu}>
                  {anyRes?.deploysOptions?.map((o1, o1ind) => {
                    return (
                      <Menu.Item key={'opt_' + o1.value} onClick={doReStartDeployment.bind(null, o1.value)}>
                        <span style={{ marginRight: '5px', color: Constants.blue }}>Re-Start:</span>
                        <span style={{ opacity: 0.7 }}>{moment(o1.deployedAt).format('LLL')}</span>: {o1.label}
                      </Menu.Item>
                    );
                  })}
                </Menu>
              );
            }
          } else {
            msgMsg = `You must have at least one ${props.allowNotEmpty ? '' : 'active '}Deployment to use the realtime predictions feature`;
            buttonString = modelId && projectId ? 'Create New Deployment' : null;
            onMsg =
              modelId && projectId
                ? () => {
                    Location.push('/' + PartsLink.deploy_create + '/' + modelId + '/' + projectId);
                  }
                : null;
          }
          if (msgMsg != null) {
            content = (
              <RefreshAndProgress isMsgAnimRefresh={msgIsRefresh} msgMsg={msgMsg} msgMenu={msgMenu} msgMenuPosition={'bottomCenter'} msgButtonText={buttonString} onClickMsgButton={onMsg}>
                &nbsp;
              </RefreshAndProgress>
            );
          }
        }
      }
    }
  }

  const featureStoreIsOffline = useMemo(() => {
    if (!props.offlineOnlyMsg || !isFeatureStore) {
      return false;
    }

    let listDeployments = memDeploymentList(false, deployments, projectId);
    let isOffline = listDeployments?.find((d1) => d1?.deploymentId === paramDeployId)?.offlineOnly === true;
    return isOffline;
  }, [isFeatureStore, projectId, deployments, paramDeployId, props.offlineOnlyMsg]);

  if (featureStoreIsOffline) {
    return <RefreshAndProgress errorMsg={props.offlineOnlyMsg}>&nbsp;</RefreshAndProgress>;
  }

  if (content != null) {
    return content;
  }

  return <div>{props.children?.({ content, needDeploy, optionsAlgo })}</div>;
});

export default PredictionsCommonCanShow;
