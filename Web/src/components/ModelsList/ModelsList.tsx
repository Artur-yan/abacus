import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_, { DatasetTypeEnum } from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import algorithms from '../../stores/reducers/algorithms';
import defDatasets from '../../stores/reducers/defDatasets';
import { calcDeploymentsByProjectId, DeploymentLifecycle } from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import { calcModelListByProjectId, ModelLifecycle, ModelLifecycleDesc } from '../../stores/reducers/models';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModalProgress from '../ModalProgress/ModalProgress';
import { calcIsDockerPnpUseCase } from '../NavLeft/utils';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import RegisterAlgoButton from '../RegisterAlgoButton/RegisterAlgoButton';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const { confirm } = Modal;

const s = require('./ModelsList.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelsListProps {
  models?: any;
  paramsProp?: any;
  datasets?: any;
  deployments?: any;
  projectDatasets?: any;
  isSmall?: boolean;
  projects?: any;
  defDatasets?: any;
  authUser?: any;
  useCases?: any;
  algorithms?: any;
  featureGroupsParam?: any;
}

interface IModelsListState {
  checkedKeys?: any;
}

class ModelsList extends React.PureComponent<IModelsListProps, IModelsListState> {
  private modalProgress: any;
  private modelIdProgress: string;
  private modelIdProgressAlready: any;
  private isM: boolean;
  confirmReTrain: any;

  constructor(props) {
    super(props);

    this.state = {};

    this.modelIdProgressAlready = [];
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    if (this.confirmError != null) {
      this.confirmError.destroy();
      this.confirmError = null;
    }
    if (this.confirmReTrain != null) {
      this.confirmReTrain.destroy();
      this.confirmReTrain = null;
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

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let featureGroupsList = this.memFeatureGroups(true)(projectId, this.props.featureGroupsParam);

    const listAlgoForProblemTypes = this.memAlgoAllowed(true)(this.props.algorithms);
    const useCaseInfo = this.memUseCaseInfo(true)(this.props.useCases, foundProject1?.useCase);

    let listModels = this.memModelList(true)(this.props.models, projectId);
    let listDeploymentsList = this.memDeploymentList(true)(this.props.deployments, projectId);

    let { validation, anyError } = this.memValidationAnyError(true)(this.props.defDatasets, this.props.projects, projectId, foundProject1) ?? {};
  };

  memValidationAnyError: (doCall) => (defDatasetsParam, projects, projectId, foundProject1) => { validation: any; anyError: boolean } = memoizeOneCurry((doCall, defDatasetsParam, projects, projectId, foundProject1) => {
    if (!projects || !projectId || !foundProject1) {
      return null;
    }

    let anyError = false;

    let validationRes = defDatasets.memValidationForProjectId(doCall, projectId);
    if (validationRes != null && validationRes.valid === false) {
      anyError = true;
    }
    return { validation: validationRes, anyError };
  });

  componentDidUpdate(prevProps: Readonly<IModelsListProps>, prevState: Readonly<IModelsListState>, snapshot?: any): void {
    this.doMem();
  }

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

  calcDatasetTypeName = (name) => {
    if (Utils.isNullOrEmpty(name)) {
      return name;
    }

    let res = null;
    let kk = Object.keys(DatasetTypeEnum);
    kk &&
      kk.some((k1) => {
        if (k1 === name) {
          res = DatasetTypeEnum[k1];
          return true;
        }
      });
    return res;
  };

  confirmError: any = null;
  onClickShowErrors = (msg, e) => {
    e.stopPropagation();
    e.preventDefault();

    if (this.confirmError != null) {
      this.confirmError.destroy();
      this.confirmError = null;
    }

    this.confirmError = confirm({
      title: 'Error found:',
      okText: 'Ok',
      cancelButtonProps: { style: { display: 'none' } },
      maskClosable: true,
      content: (
        <div>
          <div style={{ margin: '20px', color: Utils.colorAall(0.8) }} className={sd.styleTextGray}>
            {msg}
          </div>
        </div>
      ),
      onOk: () => {
        if (this.confirmError != null) {
          this.confirmError.destroy();
          this.confirmError = null;
        }
      },
      onCancel: () => {
        if (this.confirmError != null) {
          this.confirmError.destroy();
          this.confirmError = null;
        }
      },
    });
  };

  onClickCancelEvents = (e) => {
    if (e?.domEvent) {
      e.domEvent.stopPropagation?.();
    }
    // e.preventDefault();
    e.stopPropagation?.();
  };

  onClickDeployModel = (modelId, e) => {
    e.stopPropagation();
    e.preventDefault();

    if (modelId) {
      let { paramsProp } = this.props;
      let projectId = paramsProp && paramsProp.get('projectId');
      Location.push('/' + PartsLink.deploy_create + '/' + modelId + '/' + (projectId || ''));
    }
  };

  memCalcModelList = memoizeOne((foundProject1, listModels, listDeploymentsList) => {
    if (!listModels) {
      return [];
    }

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

    const isDockerPnp = calcIsDockerPnpUseCase(foundProject1?.useCase);
    const isPnp = foundProject1?.isPnp;
    const isPnpPython = foundProject1?.isPnpPython === true;
    const projectId = foundProject1?.projectId;

    let res = [];
    listModels.some((m1) => {
      const styleButton: CSSProperties = { marginRight: '8px', marginBottom: '8px', width: '90px' };
      const wideStyleButton: CSSProperties = { marginRight: '8px', marginBottom: '8px', width: '110px' };

      let allowDeploy = true,
        allowReTrain = true,
        allowCancel = false;
      let trainingCompletedAt = m1.getIn(['latestModelVersion', 'trainingCompletedAt']);
      let lifecycle1 = m1.getIn(['latestModelVersion', 'status']);
      if ((lifecycle1 || '') !== ModelLifecycle.COMPLETE) {
        allowDeploy = false;
      }
      if (m1.get('baselineModel')) {
        allowDeploy = false;
      }
      if ([ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, ModelLifecycle.TRAINING, ModelLifecycle.EVALUATING].includes(lifecycle1)) {
        allowReTrain = false;
        allowCancel = true;
      }

      if (m1?.getIn(['latestModelVersion', 'automlComplete']) === false && lifecycle1 === ModelLifecycle.COMPLETE) {
        allowDeploy = false;
        allowReTrain = false;
      }

      let stringify = (value) => {
        if (_.isArray(value) || _.isObject(value)) {
          return JSON.stringify(value);
        } else {
          return value;
        }
      };

      let deployments = m1.get('deployments')?.toJS();
      if (deployments && _.isArray(deployments) && deployments.length > 0) {
        allowDeploy = false;
      }

      let retrainButton = null;
      if (allowReTrain && !isPnp && projectId != null) {
        if (isPnpPython) {
          retrainButton = (
            <ModalConfirm
              onCancel={this.onClickCancelEvents}
              onConfirm={this.onClickReTrain.bind(this, m1.get('modelId'))}
              title={`Are you sure you want to Re-Train the model?`}
              icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
              okText={'Re-Train'}
              cancelText={'Cancel'}
              okType={'primary'}
            >
              <Button type={'default'} ghost>
                Re-Train
              </Button>
            </ModalConfirm>
          );
        } else {
          retrainButton = (
            <Link to={['/' + PartsLink.model_train + '/' + projectId, 'editModelId=' + encodeURIComponent(m1?.get('modelId') ?? '')]}>
              <Button type={'default'} ghost>
                Re-Train
              </Button>
            </Link>
          );
        }
      }

      let isPnpLocation = false;
      let isPnpUpload = isPnp ? m1?.get('isPnpUpload') : null;
      if (isPnpUpload === false) {
        isPnpLocation = true;
      }

      res.push({
        isPnpLocation,
        starred: m1.get('starred'),
        deployments: deployments,
        modelId: m1.get('modelId'),
        name: m1.get('name'),
        version: m1.getIn(['latestModelVersion', 'modelVersion']),
        modelConfig:
          m1.get('modelConfig') &&
          Array.from(m1.get('modelConfig').entries())
            .filter((o) => !Constants.flags.hide_model_config_internals || !_.startsWith(o[0] || '', '__'))
            .sort((a, b) => {
              return (a[0] ?? '').localeCompare(b[0] ?? '');
            })
            .map((o, _) => o[0] + ': ' + stringify(o[1]))
            .reduce((accumulator, currentValue) => {
              if (accumulator == null || accumulator === '') {
                return currentValue;
              } else {
                return accumulator + ', ' + currentValue;
              }
            }, ''),
        updatedAt: m1.get('updatedAt'),
        lastTrained: trainingCompletedAt == null ? '-' : <DateOld date={trainingCompletedAt} />,
        trainingCompletedAt,
        lifecycleAlone: lifecycle1,
        automlComplete: m1.getIn(['latestModelVersion', 'automlComplete']),
        status: ModelLifecycleDesc[lifecycle1] || '-',
        lifecycleMsg: m1.getIn(['latestModelVersion', 'lifecycleMsg']),
        actions: (
          <span style={{ whiteSpace: 'normal' }}>
            {false && allowCancel && (
              <ModalConfirm
                onCancel={this.onClickCancelEvents}
                onConfirm={this.onClickCancelModelTraining.bind(this, m1.get('modelId'))}
                title={`Are you sure you want to stop model training?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Stop Training'}
                cancelText={'Cancel'}
                okType={'primary'}
              >
                <Button style={styleButton} ghost danger onClick={this.onClickCancelEvents}>
                  Cancel
                </Button>
              </ModalConfirm>
            )}
            {allowDeploy && (
              <Button style={styleButton} ghost type={'default'} onClick={this.onClickDeployModel.bind(this, m1.get('modelId'))}>
                Deploy
              </Button>
            )}
            {allowReTrain && !isPnp && retrainButton}
            {!isDockerPnp && isPnp && !isPnpLocation && (
              <Link forceSpanUse to={['/' + PartsLink.dataset_for_usecase + '/' + projectId, 'useCase=' + foundProject1?.useCase + '&useCaseTag=true&newVersionForModel=' + m1.get('modelId')]}>
                <Button style={wideStyleButton} ghost type={'default'}>
                  New Version
                </Button>
              </Link>
            )}
            {isDockerPnp && (
              <ModalConfirm
                onConfirm={this.onClickReimportPnpData.bind(this, m1.get('modelId'), projectId)}
                title={`Do you want Re-Import ${isDockerPnp ? 'docker image' : 'all files'} and train a new model?`}
                icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                okText={'Re-Import'}
                cancelText={'Cancel'}
                okType={'primary'}
              >
                <Button style={wideStyleButton} ghost type={'default'}>
                  New Version
                </Button>
              </ModalConfirm>
            )}
            {!Utils.isNullOrEmpty(m1.getIn(['latestModelVersion', 'lifecycleMsg'])) && (
              <Button style={styleButton} ghost type={'default'} onClick={this.onClickShowErrors.bind(this, m1.getIn(['latestModelVersion', 'lifecycleMsg']))}>
                Errors
              </Button>
            )}
          </span>
        ),
      });
    });

    res = res.sort((a, b) => {
      let res = 0;
      if (a.starred && !b.starred) {
        res = -1;
      } else if (!a.starred && b.starred) {
        res = 1;
      }
      if (res === 0) {
        let ma = a.trainingCompletedAt ?? a.updatedAt;
        let mb = b.trainingCompletedAt ?? b.updatedAt;
        if (ma && mb) {
          res = moment(mb).diff(moment(ma));
        }
      }
      return res;
    });

    return res;
  });

  onClickReimportPnpData = (modelId, projectId, e) => {
    if (modelId) {
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
    }
  };

  onClickCancelModelTraining = (modelId, e) => {
    e && e.stopPropagation();

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (!projectId) {
      return;
    }

    REClient_.client_().cancelModelTraining(modelId, (err1, res) => {
      if (err1) {
        REActions.addNotificationError(err1);
      } else {
        if (res && res.success) {
          setTimeout(() => {
            StoreActions.listModels_(projectId);
            StoreActions.modelsVersionsByModelId_(modelId);
            StoreActions.refreshDoModelAll_(modelId, projectId);
          }, 100);
        }
      }
    });
  };

  onChangeChecked = (keys) => {
    this.setState({
      checkedKeys: keys,
    });
  };

  onClickStarred = (modelId, starred, e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (!projectId) {
      return;
    }

    REClient_.client_()._starModel(modelId, starred, (err, res) => {
      StoreActions.listModels_(projectId);
      StoreActions.getModelDetail_(modelId);
    });
  };

  onClickReTrain = (modelId, e) => {
    e && e.stopPropagation();

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (!projectId) {
      return;
    }

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
  };

  onClickTrainModel = (isPnpPython, e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (projectId) {
      let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
      const isDockerPnp = calcIsDockerPnpUseCase(foundProject1?.useCase);
      const isDrift = foundProject1?.isDrift;
      const isAiAgent = foundProject1?.useCase === 'AI_AGENT';

      if (isDrift) {
        Location.push('/' + PartsLink.model_create_drift + '/' + projectId);
      } else if (isAiAgent) {
        Location.push('/' + PartsLink.agent_one + '/' + projectId);
      } else if (isPnpPython) {
        Location.push('/' + PartsLink.model_register + '/' + projectId);
      } else if (isDockerPnp) {
        Location.push('/' + PartsLink.docker_add + '/' + projectId);
      } else {
        Location.push('/' + PartsLink.model_train + '/' + projectId);
      }
    }
  };

  memConfirm = memoizeOne((listModels, modalModelsRefresh) => {
    if (listModels && modalModelsRefresh) {
      let mm = modalModelsRefresh?.split('-');
      if (mm && mm.length > 0) {
        mm.some((mId1) => {
          if (!mId1) {
            return false;
          }

          let find1 = listModels.find((m1) => m1.get('modelId') === mId1);

          if (this.modelIdProgress != null && this.modelIdProgress === mId1) {
            if (find1 != null && [ModelLifecycle.COMPLETE, ModelLifecycle.UPLOADING_FAILED, ModelLifecycle.EVALUATING_FAILED, ModelLifecycle.TRAINING_FAILED].includes(find1.getIn(['latestModelVersion', 'status']))) {
              this.modalProgress?.hide();
              this.modelIdProgress = null;
            }
          } else if (find1 != null && [ModelLifecycle.EVALUATING, ModelLifecycle.UPLOADING, ModelLifecycle.TRAINING, ModelLifecycle.PENDING].includes(find1.getIn(['latestModelVersion', 'status']))) {
            if (!this.modelIdProgressAlready?.[mId1]) {
              this.modelIdProgress = mId1;
              this.modelIdProgressAlready?.push(mId1);
              this.modalProgress?.show();
            }
            return true;
          }
        });
      }
    }
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memColumns = memoizeOne((isEmbeddingsOnly, isAiAgent, isPnp, projectId) => {
    const columns: ITableExtColumn[] = [
      {
        title: '',
        field: 'starred',
        helpId: '',
        noAutoTooltip: true,
        render: (starred, row, index) => {
          return <StarredSpan name={'Model'} isStarred={starred} onClick={this.onClickStarred.bind(this, row.modelId)} />;
        },
      },
      {
        title: 'ID',
        field: 'modelId',
        helpId: 'modelslist_id',
        render: (text, row, index) => {
          return (
            <span className={sd.styleTextBlue}>
              <CopyText>{row.modelId}</CopyText>
            </span>
          );
        },
      },
      {
        title: isEmbeddingsOnly ? 'Catalog Name' : isAiAgent ? 'Agent Name' : 'Model Name',
        field: 'name',
        helpId: 'modelslist_name',
        render: (text) => <span className={sd.linkBlue}>{text}</span>,
      },
      {
        title: isEmbeddingsOnly ? 'Catalog Config' : isAiAgent ? 'Agent Config' : 'Model Config',
        field: 'modelConfig',
        helpId: isAiAgent ? 'agentslist_modelConfig' : 'modelslist_modelConfig',
        hideLessLarge: true,
      },
      {
        title: isEmbeddingsOnly ? 'Latest Catalog Version' : isAiAgent ? 'Latest Agent Version' : 'Latest Model Version',
        field: 'version',
        helpId: isAiAgent ? 'agentslist_version' : 'modelslist_version',
        render: (text) => (
          <span>
            <CopyText>{text}</CopyText>
          </span>
        ),
      },
      {
        title: 'Deployments',
        field: 'deployments',
        helpId: 'modelslist_deployments',
        hideLessMedium: true,
        render: (text, row, index) => {
          let deployments = row.deployments;

          let list = [];
          if (_.isArray(deployments)) {
            deployments.some((d1, d1ind) => {
              if (d1ind > 0) {
                list.push(<span key={'depl_sep_' + d1ind}>, </span>);
              }
              list.push(
                <Link key={'depl' + d1} forceSpanUse to={'/' + PartsLink.deploy_detail + '/' + projectId + '/' + d1}>
                  <span className={sd.linkBlue}>
                    <CopyText>{d1}</CopyText>
                  </span>
                </Link>,
              );
            });
          }
          return <span>{list}</span>;
        },
      },
      {
        title: isPnp ? 'Last Updated' : 'Last Trained',
        field: 'trainingCompletedAt',
        helpId: 'modelslist_lastTrained',
        render: (text, row, index) => {
          return row.lastTrained;
        },
      },
      {
        title: 'Status',
        field: 'status',
        helpId: isAiAgent ? 'agentslist_status' : 'modelslist_status',
        render: (text, row, index) => {
          let isTraining = row.modelId && StoreActions.refreshModelUntilStateIsTraining_(row.modelId);
          let isAutoMLNeed = row.automlComplete !== true && row.lifecycleAlone === ModelLifecycle.COMPLETE;

          if (!isTraining && (isAutoMLNeed || [ModelLifecycle.EVALUATING, ModelLifecycle.UPLOADING, ModelLifecycle.PENDING, ModelLifecycle.TRAINING, ModelLifecycle.EVALUATING].includes(row.lifecycleAlone || ''))) {
            StoreActions.refreshDoModelAll_(row.modelId, projectId);
            isTraining = true;
          }

          let partialElem = null;
          if (row.automlComplete !== true && row.lifecycleAlone === ModelLifecycle.COMPLETE) {
            partialElem = 'Partially ';
          }

          const metricsLinkOrModelDetailLink = isAiAgent ? ['/' + PartsLink.model_detail + '/' + row.modelId + '/' + projectId] : ['/' + PartsLink.model_metrics + '/' + projectId, 'detailModelId=' + row.modelId];

          if (isTraining || partialElem != null) {
            return (
              <span>
                {partialElem != null && (!isTraining || isAutoMLNeed) ? (
                  <div style={{ whiteSpace: 'nowrap' }}>
                    <Link forceSpanUse to={metricsLinkOrModelDetailLink}>
                      <span className={sd.linkBlue}>Partially Complete...</span>
                    </Link>
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'nowrap' }}>{isPnp ? 'Processing' : 'Training'}...</div>
                )}
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res =
              text === 'Complete' ? (
                <Link forceSpanUse to={metricsLinkOrModelDetailLink}>
                  <span className={sd.linkBlue}>{text}</span>
                </Link>
              ) : (
                <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
              );
            if ([ModelLifecycle.EVALUATING_FAILED.toLowerCase(), ModelLifecycle.UPLOADING_FAILED.toLowerCase(), ModelLifecycle.TRAINING_FAILED.toLowerCase()].includes((row.lifecycleAlone || '').toLowerCase())) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ([ModelLifecycle.EVALUATING_FAILED.toLowerCase(), ModelLifecycle.UPLOADING_FAILED.toLowerCase(), ModelLifecycle.TRAINING_FAILED.toLowerCase()].includes((row.lifecycleAlone || '').toLowerCase())) {
            if (row.lifecycleMsg) {
              res = (
                <span>
                  <span
                    css={`
                      margin-right: 5px;
                    `}
                  >
                    Error:
                  </span>
                  <span
                    css={`
                      color: #bf2c2c;
                    `}
                  >
                    {row.lifecycleMsg}
                  </span>
                </span>
              );
            }
          }
          return res;
        },
      },
      {
        title: 'Actions',
        field: 'actions',
        helpId: 'modelslist_actions',
        noAutoTooltip: true,
        noLink: true,
      },
    ];
    return columns;
  });

  memUseCaseInfo = memoizeOneCurry((doCall, useCasesParam, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  memAlgoAllowed = memoizeOneCurry((doCall, algorithmsParam) => {
    return algorithms.memProblemTypeAllowed(doCall);
  });

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId) => {
    if (deployments && projectId) {
      let res = calcDeploymentsByProjectId(undefined, projectId);
      if (res == null) {
        if (deployments.get('isRefreshing') !== 0) {
          return;
        }

        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        return res;
      }
    }
  });

  memFeatureGroups = memoizeOneCurry((doCall, projectId, featureGroupsParam) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

  render() {
    let { models, paramsProp, datasets, projectDatasets } = this.props;

    let projectId = null;
    if (paramsProp) {
      projectId = paramsProp.get('projectId');
    }

    let listModels = this.memModelList(false)(models, projectId);
    this.memConfirm(listModels, paramsProp?.get('modalModelsRefresh'));

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    const isPnp = foundProject1?.isPnp;
    const isPnpPython = foundProject1?.isPnpPython === true;
    const isEmbeddingsOnly = foundProject1?.useCase === 'EMBEDDINGS_ONLY';
    const isAiAgent = foundProject1?.useCase === 'AI_AGENT';

    const columns = this.memColumns(isEmbeddingsOnly, isAiAgent, isPnp, projectId);

    let listDeploymentsList = this.memDeploymentList(false)(this.props.deployments, projectId);

    let { validation, anyError } = this.memValidationAnyError(false)(this.props.defDatasets, this.props.projects, projectId, foundProject1) ?? {};
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
        if (r1.uploaded === true) {
          anyRequiredUploaded = true;
        } else {
          allRequiredUploaded = false;
        }
        if (r1.uploaded === false) {
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

    let isRefreshing = false;
    let dataList = [];
    if (listModels) {
      dataList = this.memCalcModelList(foundProject1, listModels, listDeploymentsList);
    }
    if (models) {
      if (models.get('isRefreshing')) {
        isRefreshing = true;
      }
    }

    let projectPart = '';
    if (paramsProp && paramsProp.get('projectId')) {
      projectPart = '/' + paramsProp.get('projectId');
    }

    let forDeployHH = 0;

    let emptyElem: any = true;
    if (!this.props.isSmall && dataList?.length === 0) {
      let featureGroupsList = this.memFeatureGroups(false)(projectId, this.props.featureGroupsParam);

      let anyUploadMissing = false,
        anyNotConfirmed = false,
        datasetIdToGo = null,
        anyRequiredFG = false;
      validation?.requiredDatasets?.some((d1) => {
        if (d1 && featureGroupsList?.find((f1) => f1?.datasetType?.toUpperCase() === d1?.datasetType?.toUpperCase()) != null) {
          anyRequiredFG = true;
        }

        if (d1 && !d1?.uploaded) {
          anyUploadMissing = true;
        } else if (d1 && !d1?.confirmed) {
          anyNotConfirmed = true;
          if (datasetIdToGo == null) {
            datasetIdToGo = d1?.datasetId;
          }
        }
      });
      validation?.optionalDatasets?.some((d1) => {
        if (d1 && d1.uploaded && !d1.confirmed) {
          anyNotConfirmed = true;
          if (datasetIdToGo == null) {
            datasetIdToGo = d1?.datasetId;
          }
        }
      });

      if ((anyUploadMissing || anyNotConfirmed) && !anyRequiredFG) {
        emptyElem = (
          <div
            css={`
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            `}
          >
            <div style={{ textAlign: 'center', marginTop: '7px' }}>
              <FontAwesomeIcon icon={['fad', 'box-open']} transform={{ size: 24, x: 0, y: 0 }} style={{ opacity: 0.8 }} />
            </div>
            <div
              css={`
                margin: 10px 0;
              `}
            >
              <Link to={datasetIdToGo && !anyUploadMissing ? '/' + PartsLink.dataset_schema + '/' + datasetIdToGo + '/' + projectId : '/' + PartsLink.project_dashboard + '/' + projectId}>
                <Button type={'primary'}>Upload Datasets or Assign Schema Mapping</Button>
              </Link>
            </div>
          </div>
        );
      }
    }

    let tableHH = (hh) => (
      <RefreshAndProgress isRelative={hh == null} isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + forDeployHH + 'px' }}>
        <TableExt
          showEmptyIcon={emptyElem}
          notsaveSortState={'models_list'}
          height={hh}
          dataSource={dataList}
          columns={columns}
          calcKey={(r1) => r1.modelId}
          calcLink={(row) => '/' + PartsLink.model_detail + '/' + row?.modelId + projectPart}
        />
      </RefreshAndProgress>
    );

    let table = null;
    if (this.props.isSmall) {
      table = tableHH(null);
    } else {
      table = <AutoSizer disableWidth>{({ height }) => tableHH(height - topAfterHeaderHH - forDeployHH)}</AutoSizer>;
    }

    const css2 = _.assign({ margin: '25px' }, this.props.isSmall ? {} : { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }) as CSSProperties;

    let tableHeaderName = 'Models';
    if (isEmbeddingsOnly) {
      tableHeaderName = 'Embedding Catalogs';
    } else if (isAiAgent) {
      tableHeaderName = 'Agents';
    }

    const isDockerPnp = calcIsDockerPnpUseCase(foundProject1?.useCase);

    const listAlgoForProblemTypes = this.memAlgoAllowed(false)(this.props.algorithms);
    const useCaseInfo = this.memUseCaseInfo(false)(this.props.useCases, foundProject1?.useCase);

    return (
      <div className={(this.props.isSmall ? '' : sd.absolute) + ' ' + sd.table} style={css2}>
        <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          {!this.props.isSmall && (
            <span style={{ float: 'right' }}>
              <Button type={'primary'} style={{ marginRight: '10px', height: '30px', padding: '0 16px' }} onClick={this.onClickTrainModel.bind(this, isPnpPython)}>
                {isPnpPython ? 'Register Model' : isAiAgent ? 'Create Agent' : isPnp ? 'New Model' : 'Train Model'}
              </Button>
            </span>
          )}
          {!this.props.isSmall && (
            <span style={{ float: 'right' }}>
              <RegisterAlgoButton projectId={projectId} style={{ marginRight: '10px', height: '30px', padding: '0 16px' }} />
            </span>
          )}
          {isPnp && !this.props.isSmall && foundProject1?.useCase != null && (
            <span style={{ float: 'right' }}>
              <Link to={isDockerPnp ? '/' + PartsLink.docker_add + '/' + projectId : ['/' + PartsLink.dataset_for_usecase + '/' + projectId, 'useCase=' + foundProject1?.useCase + '&useCaseTag=true']}>
                <Button type={'primary'} style={{ marginRight: '10px', height: '30px', padding: '0 16px' }}>
                  {isEmbeddingsOnly ? 'New Catalog' : 'New Model'}
                </Button>
              </Link>
            </span>
          )}
          {Constants.flags.upload_model_demo && allRequiredUploaded && !needConfirm && !this.props.isSmall && (
            <span style={{ float: 'right' }}>
              <Link to={['/' + PartsLink.project_add, 'actualStep=9&dd=pnp&projectId=' + this.props.paramsProp?.get('projectId')]}>
                <Button type={'default'} ghost style={{ marginRight: '10px', height: '30px', padding: '0 16px' }}>
                  Upload Model
                </Button>
              </Link>
            </span>
          )}
          {tableHeaderName}
          <HelpIcon id={isAiAgent ? 'agents_list_title' : 'models_list_title'} style={{ marginLeft: '4px' }} />
        </div>
        <ModalProgress
          ref={(r1) => {
            this.modalProgress = r1;
          }}
          title={isPnp ? (isEmbeddingsOnly ? 'Processing Catalog' : 'Processing Model') : 'Training Model'}
          hideSecs
          subtitle={
            isPnp
              ? 'Processing takes up to an hour to complete. Please check back later. We will also send you an email when processing is complete'
              : 'Training takes a few hours to complete. Please check back later. We will also send you an email letting you know when training is completed'
          }
          okText={'Ok, Sounds Good'}
        />

        {table}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    models: state.models,
    datasets: state.datasets,
    projectDatasets: state.projectDatasets,
    projects: state.projects,
    defDatasets: state.defDatasets,
    deployments: state.deployments,
    authUser: state.authUser,
    featureGroupsParam: state.featureGroups,
    algorithms: state.algorithms,
    useCases: state.useCases,
  }),
  null,
)(ModelsList);
