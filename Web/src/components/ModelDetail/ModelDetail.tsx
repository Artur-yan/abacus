import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import FileSyncOutlined from '@ant-design/icons/FileSyncOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import { Button } from '../../DesignSystem/Button/Button';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import Immutable from 'immutable';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Provider } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import models, { calcModelDetailListByProjectId, calcModelListByProjectId, ModelLifecycle, ModelLifecycleDesc } from '../../stores/reducers/models';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import CpuAndMemoryOptions from '../CpuAndMemoryOptions/CpuAndMemoryOptions';
import CronOne from '../CronOne/CronOne';
import DateOld from '../DateOld/DateOld';
import DeploymentsList from '../DeploymentsList/DeploymentsList';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { calcModelTypeFromCodeSource, EPnpRegisterModelType } from '../ModelRegisterPnpPythonSelect/ModelRegisterPnpPythonSelect';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import ShowMore from '../ShowMore/ShowMore';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import ViewLogs from '../ViewLogs/ViewLogs';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue, DetailValuePre } from './DetailPages';
import styles from './ModelDetail.module.css';
import globalStyles from '../antdUseDark.module.css';

const { confirm, info } = Modal;

interface IModelDetailProps {
  projects?: any;
  models?: any;
  deployments?: any;
  paramsProp?: any;
  projectsDatasets?: any;
  featureGroupsParam?: any;
}

interface IModelDetailState {
  checkedKeys?: any;
  summarize?: string;
  loadingSummarize?: boolean;
}

class ModelDetail extends React.PureComponent<IModelDetailProps, IModelDetailState> {
  private writeDeleteMeConfirm: any;
  private isM: boolean;
  confirmReTrain: any;
  confirmHistory: any;
  confirmUsedRename: any;
  confirmSummary: any;

  constructor(props) {
    super(props);

    this.state = {
      loadingSummarize: false,
      summarize: null,
    };
  }

  async componentDidMount() {
    this.isM = true;
    this.doMem(false);

    let { paramsProp } = this.props;
    let modelId = paramsProp && paramsProp.get('modelId');

    if (!Constants.disableAiFunctionalities && modelId) {
      let htmlExplanation = null;
      try {
        const response = await REClient_.promises_().getNaturalLanguageExplanation(null, null, modelId);
        if (response.error || !response.success) {
          throw new Error(response.error);
        }
        htmlExplanation = response?.result?.htmlExplanation;
      } catch (error) {
        REActions.addNotificationError(error?.message || Constants.errorDefault);
      }

      this.setState({
        summarize: htmlExplanation,
      });
    }
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
    if (this.confirmSummary != null) {
      this.confirmSummary.destroy();
      this.confirmSummary = null;
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
    let modelId = this.props.paramsProp?.get('modelId');

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let listModels = this.memModelList(true)(this.props.models, projectId);
    let modelDetailFound = this.memModelDetail(true)(this.props.models, modelId);

    let modelVersions = this.memModelVersions(true)(this.props.models, modelId);

    let listDeploymentsList = this.memDeploymentList(true)(this.props.deployments, projectId, modelId);

    let datasetList = this.memProjectDatasets(true)(this.props.projectsDatasets, projectId);
    let featureGroupList = this.memFeatureGroupsFromProject(true)(this.props.featureGroupsParam, projectId);

    let modelSchema = this.memModelSchema(true)(this.props.models, modelId);
    let featureGroupsInProject = this.memFeatureGroupsFromProject(true)(this.props.featureGroupsParam, projectId);
  };

  componentDidUpdate(prevProps: Readonly<IModelDetailProps>, prevState: Readonly<IModelDetailState>, snapshot?: any): void {
    this.doMem();
  }

  memDeploymentListAll = memoizeOneCurry((doCall, deployments, projectId) => {
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

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId, filterByModelId) => {
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
        if (filterByModelId != null && filterByModelId !== '') {
          res = res.filter((r1) => r1.modelId === filterByModelId);
        }
        return res.map((r1) => {
          r1.lifecycleReal = r1.status;
          r1.usage = (r1.callsPerSecond || '-') + ' calls/sec';
          return r1;
        });
      }
    }
  });

  onClickDeleteModel = (e) => {
    let { models, paramsProp } = this.props;
    let modelFound = null;
    if (paramsProp && paramsProp.get('modelId')) {
      modelFound = this.memModelDetail(false)(models, paramsProp.get('modelId'));
      let modelId = modelFound?.get('modelId');
      if (Utils.isNullOrEmpty(modelId)) {
        return;
      }

      this.writeDeleteMeConfirm = '';

      confirm({
        title: 'Are you sure you want to delete this model?',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        maskClosable: true,
        content: (
          <div>
            <div>{'Model name: "' + modelFound?.get('name') + '"'}</div>
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

            REClient_.client_().deleteModel(modelId, (err, res) => {
              if (err) {
                REActions.addNotificationError(err);
              } else {
                REActions.addNotification('Model Deleted!');
                StoreActions.getProjectsList_();
                StoreActions.getProjectsById_(this.props.paramsProp?.get('projectId'));
                StoreActions.validateProjectDatasets_(this.props.paramsProp && this.props.paramsProp.get('projectId'));
                StoreActions.getProjectDatasets_(this.props.paramsProp && this.props.paramsProp.get('projectId'), (res, ids) => {
                  StoreActions.listDatasets_(ids);
                });

                Location.push('/' + PartsLink.dataset_list);
              }
            });
          } else {
            REActions.addNotificationError('You need to write "delete me" to delete the model');
            this.onClickDeleteModel(null);
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

  memModelsOptions = memoizeOne((listModels, projectId) => {
    let optionsModels = [];
    if (listModels) {
      listModels.some((m1) => {
        let obj1 = {
          value: m1.get('modelId'),
          label: <span style={{ fontWeight: 600 }}>{m1.get('name')}</span>,
          name: m1.get('name'),
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
          REActions.addNotification('Renaming model to "' + editNameValue + '"');

          let projectId = this.props.paramsProp.get('projectId');
          REClient_.client_().renameModel(modelId, editNameValue, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Model Renamed!');

              StoreActions.listModels_(projectId);
              StoreActions.getModelDetail_(modelId);
              StoreActions.modelsVersionsByModelId_(modelId);
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

  onClickRemoveFromProject = (e) => {
    let { paramsProp } = this.props;
    let modelId = paramsProp && paramsProp.get('modelId');
    let projectId = paramsProp && paramsProp.get('projectId');
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let isAiAgent = foundProject1?.useCase === 'AI_AGENT';

    if (modelId && projectId) {
      REActions.addNotification(`Deleting ${isAiAgent ? 'agent' : 'model'}...`);

      REClient_.client_().deleteModel(modelId, (err, res) => {
        if (err) {
          REActions.addNotificationError('Error: ' + err);
        } else {
          REActions.addNotification('Deleted!');

          StoreActions.refreshModelUntilStateCancel_(modelId);
          StoreActions.listModels_(projectId);

          Location.push('/' + PartsLink.model_list + '/' + projectId);
        }
      });
    }
  };

  memModelDetail = memoizeOneCurry((doCall, models, modelId) => {
    if (models && modelId) {
      let res = calcModelDetailListByProjectId(undefined, modelId);
      if (res == null) {
        if (models.get('isRefreshing')) {
          return null;
        } else {
          if (doCall) {
            StoreActions.getModelDetail_(modelId);
          }
        }
      } else {
        return res;
      }
    }
  });

  memModelVersions = memoizeOneCurry((doCall, modelsParam, modelId) => {
    let res = models.memModelVersionsByModelId(doCall, undefined, modelId);
    res = res?.map((m1) => {
      m1.datasetVersionsOri = m1.datasetVersions;
      if (_.isArray(m1.datasetVersions)) {
        m1 = _.assign({}, m1);
        m1.datasetVersions = m1.datasetVersions?.join(', ');
      }
      return m1;
    });
    return res;
  });

  onClickReImportPnpLocation = (e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let modelId = paramsProp && paramsProp.get('modelId');
    if (!projectId || !modelId) {
      return;
    }

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
        StoreActions.refreshDoModelVersionAll_(res?.result?.modelVersion, res?.result?.modelId, projectId);
      }
    });
  };

  onClickSummarize = async (e) => {
    let { paramsProp } = this.props;
    let modelId = paramsProp && paramsProp.get('modelId');

    if (modelId) {
      try {
        this.setState({
          loadingSummarize: true,
          summarize: null,
        });

        const generateResponse = await REClient_.promises_().generateNaturalLanguageExplanation(null, null, modelId);
        if (!generateResponse?.success || generateResponse?.error) {
          throw new Error(generateResponse?.error);
        }

        const longExplanation = generateResponse?.result?.longExplanation;
        const shortExplanation = generateResponse?.result?.shortExplanation;

        const setResponse = await REClient_.promises_().setNaturalLanguageExplanation(shortExplanation, longExplanation, null, null, modelId);
        if (!setResponse?.success || setResponse?.error) {
          throw new Error(setResponse?.error);
        }

        const getResponse = await REClient_.promises_().getNaturalLanguageExplanation(null, null, modelId);
        if (!getResponse?.success || getResponse?.error) {
          throw new Error(getResponse?.error);
        }
        const htmlExplanation = getResponse?.result?.htmlExplanation;

        this.setState({
          summarize: htmlExplanation,
          loadingSummarize: false,
        });
      } catch (error) {
        this.setState({
          loadingSummarize: false,
        });
        REActions.addNotificationError(error?.message || Constants.errorDefault);
      }
    }
  };

  onShowSummarize = (summarize) => {
    if (!summarize) return;

    this.confirmSummary = info({
      title: '',
      icon: null,
      okText: 'Close',
      okType: 'primary',
      maskClosable: true,
      width: 800,
      content: (
        <div
          css={`
            position: relative;
          `}
        >
          <iframe
            srcDoc={summarize}
            css={`
              width: 100%;
              height: 500px;
              border: none;
            `}
          />
        </div>
      ),
      onOk: () => {
        this.confirmSummary = null;
      },
    });
  };

  onClickReTrain = (e) => {
    e && e.stopPropagation();

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let modelId = paramsProp && paramsProp.get('modelId');
    if (!projectId || !modelId) {
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

  onDeleteRefreshSchedule = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    let modelId = this.props.paramsProp?.get('modelId');

    if (projectId) {
      StoreActions.listModels_(projectId);
    }
    if (modelId) {
      StoreActions.getModelDetail_(modelId);
      StoreActions.modelsVersionsByModelId_(modelId);
    }
  };

  onPlayRefreshSchedule = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    let modelId = this.props.paramsProp?.get('modelId');

    if (projectId) {
      StoreActions.listModels_(projectId);
    }
    if (modelId) {
      StoreActions.getModelDetail_(modelId);
      StoreActions.modelsVersionsByModelId_(modelId);
    }
  };

  onClickDeleteVersion = (modelVersion, e) => {
    if (modelVersion) {
      REClient_.client_().deleteModelVersion(modelVersion, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          let projectId = this.props.paramsProp?.get('projectId');
          let modelId = this.props.paramsProp?.get('modelId');

          StoreActions.listModels_(projectId);
          StoreActions.getModelDetail_(modelId);
          StoreActions.modelsVersionsByModelId_(modelId);
        }
      });
    }
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onChangeChecked = (keys) => {
    this.setState({
      checkedKeys: keys,
    });
  };

  onClickCancel = (e) => {
    e && e.stopPropagation();
    e && e.preventDefault();
  };

  onClickViewHistoryTrainOptions = (row, e) => {
    e && e.stopPropagation();
    e && e.preventDefault();

    let stringify = (value) => {
      if (_.isArray(value) || _.isObject(value)) {
        return JSON.stringify(value);
      } else {
        return value;
      }
    };

    let paramsUsed = null;
    let paramsObj = row.modelConfig;
    if (paramsObj && !_.isEmpty(paramsObj)) {
      let kk = Object.keys(paramsObj).sort();
      paramsUsed = kk.map((k1) => '' + k1 + ': ' + stringify(paramsObj[k1])).join(', ');
    }

    let content = (
      <div>
        <div
          css={`
            margin-bottom: 20px;
            border-radius: 8px;
            border: 1px solid rgba(0, 0, 0, 0.2);
            padding: 12px 20px;
          `}
        >
          <div
            css={`
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 15px;
            `}
          >
            {moment(row.trainingCompletedAt).format('LLL')} - {row.modelVersion}
          </div>
          <div
            css={`
              font-size: 13px;
            `}
          >
            {paramsUsed}
          </div>
        </div>
        ;
      </div>
    );

    this.confirmHistory = confirm({
      title: 'Used Configuration',
      okText: 'Ok',
      okType: 'primary',
      cancelText: 'Cancel',
      cancelButtonProps: { style: { display: 'none' } },
      maskClosable: true,
      width: 600,
      content: (
        <div
          css={`
            position: relative;
          `}
        >
          {content}
        </div>
      ),
      onOk: () => {
        this.confirmHistory = null;
      },
      onCancel: () => {
        this.confirmHistory = null;
        //
      },
    });
  };

  onClickEditTrainOptions = (modelId, e) => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId) {
      Location.push('/' + PartsLink.model_train + '/' + projectId, undefined, 'editModelId=' + modelId + '&onlyEdit=1');
    }
  };

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, projectId) => {
    return projectDatasetsReq.memDatasetsByProjectId(doCall, projectDatasets, projectId);
  });

  memFeatureGroupsFromProject = memoizeOneCurry((doCall, featureGroupsParam, projectId) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

  memModelSchema = memoizeOneCurry((doCall, modelsParam, modelId) => {
    return models.memSchemaModelById(doCall, modelsParam, modelId);
  });

  memModelSchemaElem = memoizeOne((modelSchema) => {
    if (modelSchema) {
      let res = [];

      let kk = Object.keys(modelSchema);
      kk.some((k1, k1ind) => {
        let m1 = modelSchema[k1];

        if (m1?.overrides == null || m1?.overrides?.length === 0) {
          return false;
        }

        let kko = Object.keys(m1?.overrides ?? {});
        if (kko == null || kko.length === 0) {
          return false;
        }

        //
        res.push(
          <div
            key={'name' + k1ind}
            css={`
              opacity: 0.7;
              margin-left: 15px;
            `}
          >
            <ShowMore max={40} value={m1?.tableName} />
          </div>,
        );

        kko?.some((ko1, ko1ind) => {
          let o1 = m1?.overrides?.[ko1];
          if (o1 == null) {
            return false;
          }

          res.push(
            <div
              key={'ov' + k1ind + '_' + ko1ind}
              css={`
                margin-right: 5px;
              `}
            >
              <span
                css={`
                  opacity: 0.8;
                  margin-left: 25px;
                `}
              >
                {ko1}:
              </span>
              <span
                css={`
                  margin-left: 5px;
                `}
              >
                {o1}
              </span>
            </div>,
          );
        });
      });

      if (res.length === 0) {
        res = null;
      }

      return res;
    }
  });

  render() {
    let { models, paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');

    let modelDetailFound = null;
    let modelId = paramsProp?.get('modelId');
    if (modelId) {
      modelDetailFound = this.memModelDetail(false)(models, modelId);
    }

    let projectPart = projectId ? '/' + projectId : null;
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let isPnp = foundProject1?.isPnp ?? false;
    const isPnpPython = foundProject1?.isPnpPython === true;
    const isSentimentAnalysis = foundProject1?.useCase === 'NLP_SENTIMENT';
    let isEmbeddingsOnly = foundProject1?.useCase === 'EMBEDDINGS_ONLY';
    let isAiAgent = foundProject1?.useCase === 'AI_AGENT';

    let dataList = [],
      nameDetail = null,
      createdAt = null,
      createdBy = null;

    const isShared = modelDetailFound?.get('shared') === true;
    const starred = modelDetailFound?.get('starred') === true;
    const sharedAt = isShared && modelDetailFound?.get('sharedAt') ? <DateOld always date={modelDetailFound?.get('sharedAt')} /> : null;

    let featureGroupsInProject = this.memFeatureGroupsFromProject(false)(this.props.featureGroupsParam, projectId);
    let modelSchema = this.memModelSchema(false)(this.props.models, modelId);
    let modelSchemaElem = this.memModelSchemaElem(modelSchema);

    let isPnpLocation = false;
    let modelVersions = this.memModelVersions(false)(models, modelId);
    let lastTrained = modelVersions
      ?.map((f) => {
        return f?.trainingCompletedAt;
      })
      .filter((time) => time != null)[0];
    const isCustomPythonModel = modelDetailFound?.get('isPythonModel') === true;
    if (modelDetailFound) {
      let trainingFinishedAt = modelDetailFound.getIn(['latestModelVersion', 'trainingCompletedAt']);
      const predLenParamName = 'PREDICTION_LENGTH';

      let stringify = (value) => {
        if (_.isArray(value) || _.isObject(value)) {
          return JSON.stringify(value);
        } else {
          return value;
        }
      };

      let paramsUsed = null;
      let paramsObj = modelDetailFound.get('modelConfig')?.toJS();
      if (paramsObj && !_.isEmpty(paramsObj)) {
        let kk = Object.keys(paramsObj).sort();
        paramsUsed = kk
          .filter((k1) => !Constants.flags.hide_model_config_internals || !_.startsWith(k1 || '', '__'))
          .map((k1) => '' + k1 + ': ' + stringify(paramsObj[k1]))
          .join(', ');
      }

      nameDetail = modelDetailFound.get('name');

      createdAt = modelDetailFound.get('createdAt');
      createdBy = modelDetailFound.get('createdBy');
      if (createdAt != null) {
        createdAt = moment(createdAt);
        if (!createdAt.isValid()) {
          createdAt = null;
        }
      } else {
        createdAt = null;
      }

      let isLastTraining = [ModelLifecycle.TRAINING, ModelLifecycle.EVALUATING, ModelLifecycle.PENDING].includes(modelDetailFound?.getIn(['latestModelVersion', 'status']));

      let isUsingRefreshPolicy = false;
      if (modelDetailFound?.get('refreshSchedules')?.size > 0) {
        isUsingRefreshPolicy = true;
      }

      dataList = [
        {
          id: 111,
          name: isAiAgent ? 'Agent ID: ' : 'Model ID: ',
          value: <CopyText>{modelDetailFound?.getIn(['modelId'])}</CopyText>,
        },
        // {
        //   id: 1,
        //   name: 'Model Name: ',
        //   value: modelDetailFound.get('name'),
        // },
        {
          id: 2,
          name: 'Last Trained: ',
          value: isLastTraining ? 'Training...' : lastTrained != null ? <DateOld always date={lastTrained} /> : 'Not Trained',
        },
        // {
        //   id: 3,
        //   name: 'Dataset Used:',
        //   value: '-', //TODO (ariel)
        // },
        {
          id: 5,
          hidden: isPnpPython,
          name: (
            <span>
              Training Parameters:
              <HelpIcon id={'modeldetail_trainingparams'} style={{ marginLeft: '4px' }} />
              &nbsp;
            </span>
          ),
          value: (
            <span
              css={`
                .editIcon {
                  cursor: pointer;
                  opacity: 0.7;
                  transition: opacity 200ms;
                }
                :hover .editIcon {
                  opacity: 1;
                }
              `}
            >
              {paramsUsed ?? '-'}
              {isUsingRefreshPolicy && (
                <span
                  css={`
                    margin-left: 10px;
                  `}
                  className={'editIcon'}
                  onClick={this.onClickEditTrainOptions.bind(this, modelId)}
                >
                  <TooltipExt title={'Edit'}>
                    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 14, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '4px' }} />
                  </TooltipExt>
                </span>
              )}
            </span>
          ),
        },
      ];
      if (isPnpPython) {
        dataList.push({
          id: 112,
          name: 'Training Memory: ',
          value: <span>{modelDetailFound?.getIn(['memory']) + ' GB'}</span>,
        });
        dataList.push({
          id: 113,
          name: 'Training CPU Size: ',
          value: modelDetailFound?.getIn(['cpuSize']),
        });
      }

      if (modelDetailFound?.get('newDataAvailable')) {
        dataList.push({
          id: 33,
          name: 'Dataset:',
          value: (
            <span>
              <FontAwesomeIcon icon={['far', 'clock']} transform={{ size: 16, x: 0 }} style={{ color: Utils.colorA(0.7), marginRight: '5px' }} />
              Out of Date
            </span>
          ),
        });
      }

      let isPnpUpload = isPnp ? modelDetailFound?.get('isPnpUpload') : null;
      if (isPnpUpload === false) {
        let location1 = modelDetailFound?.get('location')?.toJS();
        isPnpLocation = true;
        dataList.push({
          id: 289378,
          name: 'Location:',
          value: <span>{location1?.location}</span>,
        });
        dataList.push({
          id: 2893781,
          name: 'Location Artifacts:',
          value: (
            <span>
              {Object.keys(location1?.artifactNames ?? {})
                .sort()
                .map((id1, id1ind) => {
                  return (
                    <span key={'loc_' + id1ind}>
                      {id1ind > 0 ? (
                        <span
                          css={`
                            opacity: 0.7;
                          `}
                        >
                          ,{' '}
                        </span>
                      ) : null}
                      <span
                        css={`
                          opacity: 0.8;
                        `}
                      >
                        {id1}
                      </span>
                      :
                      <span
                        css={`
                          margin-left: 5px;
                        `}
                      >
                        {location1?.artifactNames?.[id1]}
                      </span>
                    </span>
                  );
                })}
            </span>
          ),
        });
      }

      if (isShared) {
        dataList.push({
          id: 44,
          name: Constants.devCenterName,
          value: (
            <Link newWindow noApp style={{ cursor: 'pointer' }} className={globalStyles.linkBlue} to={'/models/model_detail/' + modelDetailFound?.get('modelId')}>
              Link Model Page
            </Link>
          ),
        });
      }

      let msgError = modelDetailFound?.getIn(['latestModelVersion', 'lifecycleMsg']);
      if (!Utils.isNullOrEmpty(msgError)) {
        dataList.push({
          id: 100,
          name: 'Error Message:',
          value: msgError ?? '-',
          valueColor: '#f67272',
          marginVert: 14,
        });
      }

      if (modelSchemaElem != null) {
        dataList.push({
          id: 90000,
          name: (
            <span>
              Model Schema:
              <HelpIcon id={'modeldetail_modelschema'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: <span css={``}>{modelSchemaElem}</span>,
        });
      }

      if (!Constants.disableAiFunctionalities && projectId && modelDetailFound?.get('modelId')) {
        dataList.push({
          id: 90001,
          name: <span>Model Document:</span>,
          value: (
            <span css={''}>
              {!this.state.loadingSummarize && (
                <TooltipExt title={this.state.summarize ? 'regenerate' : 'generate'}>
                  <FileSyncOutlined className={styles.blueIcon} onClick={this.onClickSummarize} />
                </TooltipExt>
              )}
              {this.state.loadingSummarize && <LoadingOutlined style={{ margin: '0 10px' }} spin />}
              {this.state.summarize && (
                <TooltipExt title={'view'}>
                  <EyeOutlined
                    className={styles.blueIcon}
                    onClick={() => {
                      this.onShowSummarize(this.state.summarize);
                    }}
                  />
                </TooltipExt>
              )}
              {this.state.summarize && (
                <TooltipExt title={'download'}>
                  <DownloadOutlined
                    className={styles.blueIcon}
                    onClick={() => {
                      Utils.htmlStringToPdf(this.state.summarize, 'model_documentation');
                    }}
                  />
                </TooltipExt>
              )}
            </span>
          ),
        });
      }

      let restrictedBuiltinAlgoObjects = modelDetailFound?.get('restrictedAlgorithms')?.toJS()['builtinAlgorithms'];
      let restrictedBuiltinAlgoNames = restrictedBuiltinAlgoObjects?.map((a1) => a1.name);
      if (restrictedBuiltinAlgoNames != null) {
        dataList.push({
          id: 90005,
          name: (
            <span>
              User selected builtin algorithms: <HelpIcon id={'modeldetail_restrictedBuiltinAlgos'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: restrictedBuiltinAlgoNames.join(', '),
        });
      }
      let customAlgorithmConfigs = modelDetailFound?.get('customAlgorithmConfigs')?.toJS();
      if (customAlgorithmConfigs != null && !_.isEmpty(customAlgorithmConfigs) && Constants.flags.algos) {
        let customAlgosElem = [];

        let pp = Object.keys(paramsObj ?? {});
        // Hide cpu size since we currently not show it when train model
        if (false && modelDetailFound?.get('cpuSize') != null && !pp.some((a1) => a1?.toLowerCase() === 'CPU_SIZE'.toLowerCase())) {
          customAlgosElem.push(
            <div
              key={'ca2_cpu'}
              css={`
                margin-top: 5px;
                margin-bottom: 5px;
                font-size: 17px;
              `}
            >
              <span
                css={`
                  opacity: 0.7;
                `}
              >
                CPU Size:{' '}
              </span>
              <CpuAndMemoryOptions name={'CustomModel'} helpidPrefix={'model_detail_custom_algo'} isOnlyCpu cpuValue={modelDetailFound?.get('cpuSize')} asText />
            </div>,
          );
        }
        if (modelDetailFound?.get('memory') != null && !pp.some((a1) => a1?.toLowerCase() === 'TRAINING_MEMORY_GB'.toLowerCase())) {
          customAlgosElem.push(
            <div
              key={'ca2_emmory'}
              css={`
                margin-top: 5px;
                margin-bottom: 5px;
                font-size: 17px;
              `}
            >
              <span
                css={`
                  opacity: 0.7;
                `}
              >
                Memory:{' '}
              </span>
              <CpuAndMemoryOptions name={'CustomModel'} helpidPrefix={'model_detail_custom_algo'} isOnlyMemory memoryValue={modelDetailFound?.get('memory')} asText />
            </div>,
          );
        }

        if (customAlgosElem.length > 0) {
          customAlgosElem.push(
            <div
              key={'padding-div'}
              css={`
                padding-top: 8px;
              `}
            ></div>,
          );
        }

        Object.entries(customAlgorithmConfigs ?? {}).forEach(([configKey, configValue]) => {
          configValue = Utils.tryJsonStringify(configValue, null, 4);
          customAlgosElem.push(
            <div
              key={`ca_${configKey}`}
              css={`
                margin-bottom: 8px;
              `}
            >
              <div>
                <Link to={[`/${PartsLink.algorithm_one}/-/${encodeURIComponent(configKey)}`, 'isEdit=1']} usePointer showAsLinkBlue>
                  {configKey}
                </Link>
              </div>
              <DetailValuePre key={`binding-${configKey}`}>{`Config: ${configValue}`}</DetailValuePre>
            </div>,
          );
        });

        dataList.push({
          id: 90011,
          name: (
            <span>
              Custom Algorithms:
              <HelpIcon id={'modeldetail_customalgos'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <span css={``}>
              <div
                css={`
                  margin-left: 15px;
                `}
              >
                {customAlgosElem}
              </div>
            </span>
          ),
        });
      }

      let refreshSchedules = modelDetailFound?.getIn(['refreshSchedules'])?.toJS();
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
                    modelIds={[this.props.paramsProp?.get('modelId')]}
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
            {this.props.paramsProp?.get('projectId') != null && this.props.paramsProp?.get('modelId') != null && (
              <div style={{ margin: '3px 0 3px 30px' }}>
                <CronOne isNew projectId={this.props.paramsProp?.get('projectId')} onPlayNow={this.onPlayRefreshSchedule} modelIds={[this.props.paramsProp?.get('modelId')]} />
              </div>
            )}
          </div>
        ),
      });

      dataList = dataList?.filter((d1) => !d1.hidden);
    }

    let modelSelectValue = null;
    let optionsModels = [];
    if (models) {
      let listModels = this.memModelList(false)(models, projectId);
      optionsModels = this.memModelsOptions(listModels, projectId);
      if (optionsModels && modelDetailFound) {
        modelSelectValue = optionsModels.find((p1) => p1.value === modelDetailFound.get('modelId'));
      }
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let isInProject = paramsProp && !Utils.isNullOrEmpty(paramsProp.get('projectId'));

    let allowDeploy = true,
      modelLastIsTraining = false;
    let lifecycle1 = modelDetailFound?.getIn(['latestModelVersion', 'status']);
    if (modelDetailFound) {
      if (lifecycle1 !== ModelLifecycle.COMPLETE || modelDetailFound?.get('baselineModel')) {
        allowDeploy = false;
      }

      modelLastIsTraining = [ModelLifecycle.TRAINING, ModelLifecycle.PENDING, ModelLifecycle.EVALUATING, ModelLifecycle.UPLOADING].includes(lifecycle1);
      if (modelLastIsTraining) {
        allowDeploy = true;
      }
    } else {
      allowDeploy = false;
    }

    let modelVersionsColumns: ITableExtColumn[] = [
      {
        title: isEmbeddingsOnly ? 'Catalog Version' : isAiAgent ? 'Agent Version' : 'Model Version',
        field: 'modelVersion',
        render: (text, row, index) => {
          let paramsObj = row.modelConfig;

          let paramsUsed = null;
          if (!paramsObj || _.isEmpty(paramsObj)) {
            //
          } else {
            let stringify = (value) => {
              if (_.isArray(value) || _.isObject(value)) {
                return JSON.stringify(value);
              } else {
                return value;
              }
            };

            let kk = Object.keys(paramsObj).sort();
            paramsUsed = kk
              .filter((k1) => !Constants.flags.hide_model_config_internals || !_.startsWith(k1 || '', '__'))
              .map((k1) => '' + k1 + ': ' + stringify(paramsObj[k1]))
              .join(', ');

            if (_.trim(paramsUsed || '') === '') {
              paramsUsed = null;
            } else {
              paramsUsed = 'Configuration:\n' + paramsUsed;
              paramsUsed = (
                <TooltipExt title={paramsUsed} placement={'right'}>
                  <span
                    css={`
                      margin-left: 8px;
                    `}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faBadgeCheck').faBadgeCheck} transform={{ size: 16, x: 0, y: 0 }} />
                  </span>
                </TooltipExt>
              );
            }
          }

          return (
            <span>
              <CopyText>{text}</CopyText>
              {paramsUsed}
            </span>
          );
        },
      },
      {
        title: isPnp ? 'Processing Started' : 'Training Started',
        field: 'trainingStartedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
        },
      },
      {
        title: isPnp ? 'Processing Completed' : 'Training Completed',
        field: 'trainingCompletedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
        },
      },
      {
        title: isPnp ? 'Processing Status' : 'Training Status',
        field: 'status',
        render: (text, row, index) => {
          let isTraining = false;
          let isAutoMLNeed = row.automlComplete !== true && row.status === ModelLifecycle.COMPLETE;
          if ([ModelLifecycle.EVALUATING, ModelLifecycle.UPLOADING, ModelLifecycle.PENDING, ModelLifecycle.TRAINING].includes(row.status || '') || isAutoMLNeed) {
            isTraining = true;
            StoreActions.refreshDoModelVersionAll_(row.modelVersion, this.props.paramsProp?.get('modelId'), this.props.paramsProp?.get('projectId'));
          }

          let partialElem = null;
          if (row.automlComplete !== true && row.status === ModelLifecycle.COMPLETE) {
            partialElem = 'Partially ';
          }

          if (isTraining || partialElem != null) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{partialElem != null && (!isTraining || isAutoMLNeed) ? 'Partially Complete' : isPnpLocation ? 'Processing' : ModelLifecycleDesc[row.status ?? '']}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = (
              <span style={{ whiteSpace: 'nowrap' }}>
                {partialElem}
                {ModelLifecycleDesc[text ?? '-']}
              </span>
            );
            if ([ModelLifecycle.EVALUATING_FAILED, ModelLifecycle.TRAINING_FAILED, ModelLifecycle.UPLOADING_FAILED].includes(row.status || '')) {
              res = <span className={globalStyles.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ([ModelLifecycle.EVALUATING_FAILED, ModelLifecycle.TRAINING_FAILED, ModelLifecycle.UPLOADING_FAILED].includes(row.status || '')) {
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
    ];
    if (!isPnp) {
      modelVersionsColumns = modelVersionsColumns.concat(
        [
          {
            hidden: true,
            title: 'Feature Group Versions',
            field: 'featureGroupVersions',
            render: (text, row, index) => {
              text = row.featureGroupVersions;

              let fgIds = row.featureGroupIds;
              if (text == null || text === '') {
                return null;
              } else if (_.isArray(text)) {
                let res = [];
                text.some((s1, s1ind) => {
                  if (s1ind > 0) {
                    res.push(
                      <span
                        key={'sp' + s1ind}
                        css={`
                          opacity: 0.8;
                        `}
                      >
                        ,{' '}
                      </span>,
                    );
                  }

                  let fgId = fgIds?.[s1ind];

                  //
                  let inProject = false;
                  if (fgId != null) {
                    featureGroupsInProject?.some((f1) => {
                      if (f1?.featureGroupId === fgId) {
                        s1 = '' + f1.name + ' - ' + s1;
                        inProject = true;
                        return true;
                      }
                    });
                  }

                  // let fgVersion = row.featureGroupVersions?.[s1ind];
                  res.push(
                    <span key={'link' + s1 + s1ind} className={fgId ? globalStyles.styleTextBlue : ''}>
                      {fgId && (
                        <Link to={'/' + PartsLink.feature_group_detail + '/' + ((inProject ? projectId : null) ?? '-') + '/' + fgId} forceSpanUse usePointer>
                          {s1}
                        </Link>
                      )}
                      {!fgId && s1}
                    </span>,
                  );
                });
                return res;
              }
              return '-';
            },
          },
          {
            title: 'Feature Group Versions',
            // title: 'Schema Snapshot',
            field: 'modelVersion',
            render: (text, row, index) => {
              const calcNameFG = (fgId) => {
                let text = row.featureGroupVersions;

                if (text == null || text === '') {
                  return null;
                } else if (_.isArray(text)) {
                  let res = [],
                    s1 = null;
                  let inProject = false;
                  if (fgId != null) {
                    featureGroupsInProject?.some((f1) => {
                      if (f1?.featureGroupId === fgId) {
                        s1 = '' + f1.name;
                        inProject = true;
                        return true;
                      }
                    });
                  }
                  return s1;
                }
              };

              let renderLinks = null;
              if (!Utils.isNullOrEmpty(row.modelVersion)) {
                let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
                if (foundProject1 != null) {
                  let idsList = row.featureGroupIds;
                  let links = idsList?.map((dId1, dId1ind) => {
                    let linkFirst = '/' + PartsLink.dataset_schema + '/' + dId1 + '/' + projectId;
                    let keyId = 'datasetId';
                    let linkSecond = 'datasetVersion=' + encodeURIComponent(row.datasetVersionsOri?.[dId1ind] ?? '');

                    linkFirst = '/' + PartsLink.features_list + '/' + projectId + '/' + dId1;
                    keyId = 'featureGroupId';
                    linkSecond = 'modelVersion=' + encodeURIComponent(row.modelVersion ?? '');

                    let fgVersion1 = row.featureGroupVersions?.[dId1ind];

                    return {
                      link: [linkFirst, linkSecond],
                      [keyId]: dId1,
                      id: fgVersion1 ?? dId1,
                      name: calcNameFG(dId1),
                    };
                  });
                  if (links != null && links.length > 0) {
                    renderLinks = (
                      <span>
                        {links.map((link1, link1ind) => {
                          return (
                            <Link to={link1.link} forceSpanUse key={'lnk' + link1ind}>
                              {link1ind > 0 && <span>, </span>}
                              <span
                                className={globalStyles.styleTextBlue}
                                css={`
                                  font-size: 14px;
                                `}
                              >
                                {link1.name}
                                {link1.name ? ' - ' : ''}
                                {link1.id}
                              </span>
                            </Link>
                          );
                        })}
                      </span>
                    );
                  }
                }
              }

              return <span>{renderLinks}</span>;
            },
          },
        ].filter((c1) => !c1?.hidden),
      );
    }
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
              {!isAiAgent && [ModelLifecycle.COMPLETE, ModelLifecycle.EVALUATING_FAILED, ModelLifecycle.TRAINING_FAILED].includes(row.status || '') && (
                <ModalConfirm
                  width={900}
                  title={
                    <Provider store={Utils.globalStore()}>
                      <div className={'useDark'}>
                        <ViewLogs msgRaw modelVersion={row.modelVersion} isTrainingData />
                      </div>
                    </Provider>
                  }
                  okText={'Close'}
                  cancelText={null}
                  okType={'primary'}
                >
                  <Button className={styles.actionsButton} ghost>
                    Data Logs
                  </Button>
                </ModalConfirm>
              )}
              {!isAiAgent && Constants.isShowViewLogs(foundProject1?.useCase, row.hasCustomAlgorithms) && [ModelLifecycle.COMPLETE, ModelLifecycle.EVALUATING_FAILED, ModelLifecycle.TRAINING_FAILED].includes(row.status || '') && (
                <ModalConfirm
                  width={900}
                  title={
                    <Provider store={Utils.globalStore()}>
                      <div className={'useDark'}>
                        <ViewLogs modelVersion={row.modelVersion} />
                      </div>
                    </Provider>
                  }
                  okText={'Close'}
                  cancelText={null}
                  okType={'primary'}
                >
                  <Button className={styles.actionsButton} ghost>
                    Logs
                  </Button>
                </ModalConfirm>
              )}
              {allowDelete && (
                <ModalConfirm
                  onConfirm={this.onClickDeleteVersion.bind(this, row.modelVersion)}
                  title={`Do you want to delete this ` + (isEmbeddingsOnly ? 'catalog' : 'model') + ` version?`}
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
              {Constants.flags.show_log_links && [ModelLifecycle.COMPLETE, ModelLifecycle.EVALUATING_FAILED, ModelLifecycle.TRAINING_FAILED].includes(lifecycle1) && (
                <span>
                  <Link newWindow to={'/api/v0/_getPipelineStageLogHtml?resourceId=' + row.modelVersion} noApp style={{ cursor: 'pointer' }}>
                    <Button customType="internal" className={styles.actionsButton}>
                      Internal: View Logs
                    </Button>
                  </Link>
                  <Link newWindow to={'/api/v0/_getPipelineStageLog?resourceId=' + row.modelVersion} noApp style={{ cursor: 'pointer' }}>
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

    let allowReTrain = true,
      isAutoMlComplete = true,
      allowReTrainOld = true,
      autoMlCompleteForVersion = null,
      isLastComplete = false;
    if (!isPnp) {
      if (!modelDetailFound /*|| [ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, ModelLifecycle.TRAINING, ModelLifecycle.EVALUATING].includes(modelDetailFound?.getIn(['latestModelVersion', 'status']))*/) {
        allowReTrain = false;
      }
      if (!modelDetailFound || [ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, /*ModelLifecycle.TRAINING, */ ModelLifecycle.EVALUATING].includes(modelDetailFound?.getIn(['latestModelVersion', 'status']))) {
        allowReTrainOld = false;
      }
      isLastComplete = modelDetailFound?.getIn(['latestModelVersion', 'status']) === ModelLifecycle.COMPLETE;
      if (!modelDetailFound || modelDetailFound?.getIn(['latestModelVersion', 'automlComplete']) === false) {
        isAutoMlComplete = false;
      }

      if (modelVersions != null && !isLastComplete && !isAutoMlComplete) {
        let lastVersionFullComplete = modelVersions.find((mv1) => mv1?.automlComplete === true && mv1?.status === ModelLifecycle.COMPLETE && !Utils.isNullOrEmpty(mv1?.trainingCompletedAt));
        if (lastVersionFullComplete != null && lastVersionFullComplete?.modelVersion !== modelDetailFound?.getIn(['latestModelVersion', 'modelVersion'])) {
          autoMlCompleteForVersion = lastVersionFullComplete;
        }
      }
    }

    let listDeploymentsList = this.memDeploymentList(false)(this.props.deployments, projectId, modelDetailFound?.get('modelId'));
    let anyDeployment = listDeploymentsList?.length > 0;

    let listDeploymentsListAll = this.memDeploymentListAll(false)(this.props.deployments, projectId);

    let retrainButton = null;
    if (!isAiAgent && allowReTrain && !isPnp && projectId != null) {
      if (isPnpPython) {
        retrainButton = (
          <ModalConfirm onConfirm={this.onClickReTrain} title={`Are you sure you want to Re-Train the model?`} icon={<QuestionCircleOutlined style={{ color: 'green' }} />} okText={'Re-Train'} cancelText={'Cancel'} okType={'primary'}>
            <Button className={globalStyles.detailbuttonblue} style={{ marginLeft: '10px' }} type={'primary'} ghost={!anyDeployment}>
              Re-Train
            </Button>
          </ModalConfirm>
        );
      } else {
        retrainButton = (
          <Link to={['/' + PartsLink.model_train + '/' + projectId, 'editModelId=' + encodeURIComponent(modelId ?? '')]}>
            <Button className={globalStyles.detailbuttonblue} style={{ marginLeft: '10px' }} type={'primary'} ghost={!anyDeployment}>
              Re-Train
            </Button>
          </Link>
        );
      }
    }

    const calcAlgos: (modelVersionOne) => { bestAlgo?: { name?; algorithm? }; defaultAlgo?: { name?; algorithm? } } = (modelVersionOne) => {
      if (!modelVersionOne) {
        return null;
      }

      if (Immutable.isImmutable(modelVersionOne)) {
        modelVersionOne = modelVersionOne?.toJS();
      }

      const defaultAlgorithm = modelVersionOne?.defaultAlgorithm;
      const bestAlgorithm = modelVersionOne?.bestAlgorithm;
      return {
        bestAlgo: bestAlgorithm,
        defaultAlgo: defaultAlgorithm,
      };
    };

    const modelLastAlgos = calcAlgos(modelDetailFound?.get('latestModelVersion'));

    let createNewDeployElem = (
      <Button type={'primary'} style={{ marginLeft: '0', marginTop: '20px', height: '30px', padding: '0 16px' }} className={globalStyles.detailbuttonblue}>
        <span>Create New Deployment{!isLastComplete && isAutoMlComplete && !isPnp ? ' (Partially Complete)' : ''}</span>
      </Button>
    );
    let useLink = true;
    // console.warn(modelLastIsTraining, autoMlCompleteForVersion, isAutoMlComplete, modelLastAlgos?.defaultAlgo?.algorithm)
    if (modelLastIsTraining || (isLastComplete && !isAutoMlComplete)) {
      if (autoMlCompleteForVersion == null && !isLastComplete) {
        if (isAutoMlComplete && Utils.isNullOrEmpty(modelLastAlgos?.defaultAlgo?.algorithm)) {
          createNewDeployElem = (
            <ModalConfirm
              title={`Deploying last completed version (${modelDetailFound?.get('latestModelVersion')?.get('modelVersion')}). If you need to deploy currently training version, set a default model.`}
              okType={'primary'}
              cancelText={null}
              okText={'Ok'}
            >
              {createNewDeployElem}
            </ModalConfirm>
          );
          useLink = false;
        } else {
          createNewDeployElem = (
            <ModalConfirm title={'Please wait until a model version has been trained.'} okType={'primary'} cancelText={null} okText={'Ok'}>
              {createNewDeployElem}
            </ModalConfirm>
          );
          useLink = false;
        }
      } else if (modelLastAlgos != null && !Utils.isNullOrEmpty(modelLastAlgos?.defaultAlgo?.algorithm)) {
        createNewDeployElem = <Link to={'/' + PartsLink.deploy_create + '/' + modelDetailFound?.get('modelId') + '/' + projectId}>{createNewDeployElem}</Link>;
        useLink = false;
      } else if (!isAutoMlComplete && autoMlCompleteForVersion != null) {
        const versionAlgos = calcAlgos(autoMlCompleteForVersion);
        if (versionAlgos?.defaultAlgo?.algorithm != null) {
          const onClickUseVersion = (e) => {
            return new Promise<boolean>((resolve) => {
              Location.push('/' + PartsLink.deploy_create + '/' + modelDetailFound?.get('modelId') + '/' + projectId, undefined, `version=${encodeURIComponent(autoMlCompleteForVersion?.modelVersion || '')}`);
              resolve(true);
            });
          };

          createNewDeployElem = (
            <ModalConfirm
              title={`A new version is being trained - if you want to deploy the new version please select a default model. Click OK to deploy the previous trained version (“${autoMlCompleteForVersion?.modelVersion}”),`}
              okType={'primary'}
              cancelText={'Cancel'}
              okText={'Ok'}
              onConfirmPromise={onClickUseVersion}
            >
              {createNewDeployElem}
            </ModalConfirm>
          );
          useLink = false;
        } else {
          createNewDeployElem = (
            <ModalConfirm title={'Please wait until a model version has been trained.'} okType={'primary'} cancelText={null} okText={'Ok'}>
              {createNewDeployElem}
            </ModalConfirm>
          );
          useLink = false;
        }
      } else {
        createNewDeployElem = (
          <ModalConfirm
            title={`Deploying last completed version (${modelDetailFound?.get('latestModelVersion')?.get('modelVersion')}). If you need to deploy currently training version, set a default model.`}
            okType={'primary'}
            cancelText={null}
            okText={'Ok'}
          >
            {createNewDeployElem}
          </ModalConfirm>
        );
        useLink = false;
      }
    }

    if (isAutoMlComplete) {
      if (useLink) {
        createNewDeployElem = <Link to={'/' + PartsLink.deploy_create + '/' + modelDetailFound?.get('modelId') + '/' + projectId}>{createNewDeployElem}</Link>;
      }
    } else {
      createNewDeployElem = (
        <span>
          {createNewDeployElem}
          <HelpIcon id={'create_deploy_partial_complete'} style={{ marginLeft: '4px' }} />
        </span>
      );
    }

    const calcLinkModelRegister = (projectId, modelId) => {
      if (isAiAgent) {
        return ['/' + PartsLink.agent_one + '/' + projectId, 'editModelId=' + modelId];
      } else if (Constants.flags.register_model2) {
        let modelType = calcModelTypeFromCodeSource(modelDetailFound?.get('codeSource')?.toJS());
        switch (modelType) {
          case EPnpRegisterModelType.Form:
            return ['/' + PartsLink.model_register_form + '/' + projectId, 'editModelId=' + modelId];
          case EPnpRegisterModelType.Zip:
            return ['/' + PartsLink.model_register_zip + '/' + projectId, 'editModelId=' + modelId];
          case EPnpRegisterModelType.Git:
            return ['/' + PartsLink.model_register_git + '/' + projectId, 'editModelId=' + modelId];
        }
      } else {
        return ['/' + PartsLink.model_register + '/' + projectId, 'editModelId=' + modelId];
      }
    };
    let showMetrics = foundProject1?.showMetrics;

    return (
      <div className={globalStyles.absolute + ' ' + globalStyles.table} style={{ margin: '25px' }}>
        <NanoScroller onlyVertical>
          <div className={globalStyles.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
            {isInProject && (
              <div style={{ float: 'right', marginRight: '20px' }}>
                <ModalConfirm
                  onConfirm={this.onClickRemoveFromProject}
                  title={`Do you want to remove the ` + (isEmbeddingsOnly ? 'catalog' : isAiAgent ? 'agent' : 'model') + ` '${modelSelectValue && modelSelectValue.name}'?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Delete'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  <Button danger ghost style={{ height: '30px', padding: '0 16px', marginRight: '20px', borderColor: 'transparent' }}>
                    Delete {isEmbeddingsOnly ? 'Catalog' : isAiAgent ? 'Agent' : 'Model'}
                  </Button>
                </ModalConfirm>
              </div>
            )}

            <span>{isEmbeddingsOnly ? 'Catalogs' : isAiAgent ? 'Agents' : 'Models'}</span>
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
                <span
                  css={`
                    margin-right: 7px;
                  `}
                >
                  <StarredSpan isStarred={starred} onClick={this.onClickStarred.bind(this, modelId)} size={19} y={-2} name={'Model'} />
                </span>
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
              <div>
                {isInProject && allowReTrain && (
                  <div style={{ marginTop: '20px' }}>
                    {allowReTrainOld && projectPart && showMetrics && !isSentimentAnalysis && (
                      <span style={{ marginRight: '10px' }}>
                        <Link to={['/' + PartsLink.model_metrics + projectPart, 'detailModelId=' + modelId]} style={{ marginLeft: '10px', marginBottom: '8px' }}>
                          <Button type={'primary'} ghost style={{ padding: '0 16px' }} className={globalStyles.detailbuttonblue}>
                            Metrics
                          </Button>
                        </Link>
                      </span>
                    )}
                    {!isPnp && /*isAutoMlComplete && */ retrainButton}
                    {allowReTrainOld && isPnp && !isPnpLocation && (
                      <Link to={['/' + PartsLink.dataset_for_usecase + '/' + projectId, 'useCase=' + foundProject1?.useCase + '&useCaseTag=true&newVersionForModel=' + modelId]}>
                        <Button className={globalStyles.detailbuttonblue} style={{ marginLeft: '10px' }} type={'primary'} ghost={!anyDeployment}>
                          New Version
                        </Button>
                      </Link>
                    )}
                    {allowReTrainOld && isPnp && isPnpLocation && (
                      <ModalConfirm
                        onConfirm={this.onClickReImportPnpLocation}
                        title={`Do you want Re-Import all files and process a new ` + (isEmbeddingsOnly ? 'catalog' : 'model') + `?`}
                        icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                        okText={'Re-Import'}
                        cancelText={'Cancel'}
                        okType={'primary'}
                      >
                        <Button className={globalStyles.detailbuttonblue} style={{ marginLeft: '10px' }} type={'primary'} ghost={!anyDeployment}>
                          Re-Import
                        </Button>
                      </ModalConfirm>
                    )}
                  </div>
                )}
                {isInProject && (isPnpPython || isCustomPythonModel) && (
                  <div
                    css={`
                      margin-top: 20px;
                    `}
                  >
                    <Link to={calcLinkModelRegister(projectId, modelId)}>
                      <Button className={globalStyles.detailbuttonblue} style={{ marginLeft: '10px' }} type={'primary'}>{`Edit ${isAiAgent ? 'Agent' : 'Model'} Code`}</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isInProject && projectId && allowDeploy && modelDetailFound?.get('modelId') && createNewDeployElem}

          {isInProject && (
            <div style={{ margin: '30px 0' }}>
              <div className={globalStyles.titleTopHeaderAfter} style={{ marginBottom: '14px' }}>
                {isEmbeddingsOnly ? 'Catalog' : isAiAgent ? 'Agent' : 'Model'} Versions
                <HelpIcon id={isAiAgent ? 'agentdetail_agentversions_title' : 'modeldetail_modelversions_title'} style={{ marginLeft: '4px' }} />
              </div>
              <TableExt
                noHover
                isDetailTheme
                showEmptyIcon
                defaultSort={{ field: 'trainingCompletedAt', isAsc: false }}
                notsaveSortState={'models_versions_list'}
                dataSource={modelVersions}
                columns={modelVersionsColumns}
                calcKey={(r1) => r1.modelVersion}
              />
            </div>
          )}

          {isInProject && (
            <div style={{ marginTop: '40px', marginBottom: '80px' }}>
              <div style={{ margin: '20px 0 50px 0' }}>
                <DeploymentsList isDetailTheme showTokens={false} isSmall={true} filterByModelId={modelId} />
              </div>
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
  }),
  null,
)(ModelDetail);
