import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Collapse from 'antd/lib/collapse';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import Radio from 'antd/lib/radio';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import batchPred from '../../stores/reducers/batchPred';
import deployments, { calcDeploymentsByProjectId, DeploymentLifecycle, DeploymentLifecycleDesc } from '../../stores/reducers/deployments';
import { calcModelById } from '../../stores/reducers/models';
import { memProjectById } from '../../stores/reducers/projects';
import ConnectorEditInline from '../ConnectorEditInline/ConnectorEditInline';
import CopyText from '../CopyText/CopyText';
import CronOne from '../CronOne/CronOne';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import OptionsBuilder from '../OptionsBuilder/OptionsBuilder';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import { IWebhookId } from '../WebhookList/WebhookIdHelpers';
import WebhookList from '../WebhookList/WebhookList';
import { InputNumber } from 'antd';
import InternalTag from '../InternalTag/InternalTag';
const { confirm } = Modal;
const { Panel } = Collapse;

const styles = require('./DeployDetail.module.css');
const sd = require('../antdUseDark.module.css');

interface IDeployDetailProps {
  deployments?: any;
  paramsProp?: any;
  metrics?: any;
  projects?: any;
  batchPredParam?: any;
}

enum OutputTypeEnum {
  None = '',
  Console = 'console',
  Storage = 'storage',
  Connector = 'connector',
}

interface IDeployDetailState {
  optionsConfig?: any;
  optionsConfigValuesInit?: any;
  optionsConfigValues?: any;
  outputType?: OutputTypeEnum;
  isEdit?: boolean;
  editFileOutputFormat?: any;
  editLocation?: string;
  editConnectorUuid?: string;

  filterModelSel?: any;
  filterAlgoSel?: any;
  infrastructureConfig?: any;
  connectorConfig?: any;
  editConnectorColumnsValues?: any;
  editConnector?: any;
  editConnectorConfig?: any;
  editConnectorMode?: any;
  editConnectorColumns?: any;
  editConnectorIDColumn?: any;
  editConnectorIDColumnValue?: any;
  editConnectorAdditionalIDColumns?: any;
}

class DeployDetail extends React.PureComponent<IDeployDetailProps, IDeployDetailState> {
  private writeDeleteMeConfirm: any;
  private isM: boolean;
  private tableVersionsRef = React.createRef<any>();
  confirmModal: any;

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

    if (this.confirmModal != null) {
      this.confirmModal.destroy();
      this.confirmModal = null;
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

    let projectId = this.props.paramsProp && this.props.paramsProp.get('projectId');
    let deployId = this.props.paramsProp && this.props.paramsProp.get('deployId');

    this.memRefreshDeploySel(deployId);

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let deployOne = this.memDeployOne(true)(this.props.deployments, projectId, deployId);

    let listDeploy = this.memDeployList(true)(this.props.deployments, projectId);
    let versionsList = this.memDeployListVersionsHistory(true)(this.props.deployments, deployId);

    this.memBatchPredProject(true)(this.props.batchPredParam, projectId, deployId);
  };

  memRefreshDeploySel = memoizeOne((deployId) => {
    this.setState({
      filterModelSel: null,
      filterAlgoSel: null,
    });
  });

  componentDidUpdate(prevProps: Readonly<IDeployDetailProps>, prevState: Readonly<IDeployDetailState>, snapshot?: any): void {
    this.doMem();
  }

  onClickStarred = (deploymentId, starred, e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (!projectId) {
      return;
    }
    REClient_.client_()._starDeployment(deploymentId, starred, (err, res) => {
      StoreActions.deployList_(projectId);
      StoreActions.listDeployVersionsHistory_(deploymentId);
    });
  };

  onClickRenameModel = (deploymentId, deploymentName) => {
    let editNameValue = deploymentName;

    if (this.confirmModal != null) {
      this.confirmModal.destroy();
      this.confirmModal = null;
    }

    this.confirmModal = confirm({
      title: 'Rename Delopyment',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + deploymentName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={deploymentName}
            defaultValue={deploymentName}
            onChange={(e) => {
              editNameValue = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (this.confirmModal != null) {
          this.confirmModal.destroy();
          this.confirmModal = null;
        }

        if (editNameValue != deploymentName) {
          REActions.addNotification('Renaming deployment to "' + editNameValue + '"');

          let projectId = this.props.paramsProp.get('projectId');
          REClient_.client_().renameDeployment(deploymentId, editNameValue, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Deployment Renamed!');

              StoreActions.deployList_(projectId);
              StoreActions.listDeployVersions_(deploymentId);
              StoreActions.listDeployVersionsHistory_(deploymentId);
            }
          });
        }
      },
      onCancel: () => {
        if (this.confirmModal != null) {
          this.confirmModal.destroy();
          this.confirmModal = null;
        }
      },
    });
  };

  onClickEditInfrastructureConfig = (deploymentId, disableAutoShutdown, enableMonitoring, alertQps, alertLatencyMs) => {
    let newDisableAutoShutdown = disableAutoShutdown;
    let newEnableMonitoring = enableMonitoring;
    let newAlertQps = alertQps;
    let newAlertLatencyMs = alertLatencyMs;

    if (this.confirmModal != null) {
      this.confirmModal.destroy();
      this.confirmModal = null;
    }

    this.confirmModal = confirm({
      title: (
        <div style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 8 }}>
            Edit Infrastructure Configurations
            <InternalTag />
          </div>
          <div className={styles.restartDeploymentMessage}>(You must re-start the deployment for these changes to take effect)</div>
        </div>
      ),
      okText: 'Save',
      cancelText: 'Cancel',
      maskClosable: true,
      width: 560,
      content: (
        <table className={styles.infrastructureConfigTable}>
          <tbody>
            <tr>
              <td>
                <span className={styles.infrastructureConfigKey}>Disable Auto Shutdown:</span>
              </td>
              <td>
                <Checkbox
                  defaultChecked={disableAutoShutdown}
                  onChange={(e) => {
                    newDisableAutoShutdown = e.target.checked;
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>
                <span className={styles.infrastructureConfigKey}>Enable Monitoring:</span>
              </td>
              <td>
                <Checkbox
                  defaultChecked={enableMonitoring}
                  onChange={(e) => {
                    newEnableMonitoring = e.target.checked;
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>
                <span className={styles.infrastructureConfigKey}>Alert QPS:</span>
              </td>
              <td>
                <InputNumber
                  defaultValue={alertQps}
                  onChange={(value) => {
                    newAlertQps = value;
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>
                <span className={styles.infrastructureConfigKey}>Alert Latency (ms):</span>
              </td>
              <td>
                <InputNumber
                  defaultValue={alertLatencyMs}
                  onChange={(value) => {
                    newAlertLatencyMs = value;
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      ),
      onOk: () => {
        if (this.confirmModal != null) {
          this.confirmModal.destroy();
          this.confirmModal = null;
        }

        let projectId = this.props.paramsProp.get('projectId');
        REClient_.client_()._setDeploymentInfraConfig(deploymentId, newDisableAutoShutdown, newEnableMonitoring, newAlertQps, newAlertLatencyMs, (err, res) => {
          if (err) {
            REActions.addNotificationError(err);
          } else {
            StoreActions.deployList_(projectId);
            StoreActions.listDeployVersions_(deploymentId);
            StoreActions.listDeployVersionsHistory_(deploymentId);
          }
        });
      },
      onCancel: () => {
        if (this.confirmModal != null) {
          this.confirmModal.destroy();
          this.confirmModal = null;
        }
      },
    });
  };

  onClickEditTOptions = (deployOne, e) => {
    this.setState({
      isEdit: true,
      editFileOutputFormat: deployOne?.featureGroupExportConfig?.fileFormat,
      editLocation: deployOne?.featureGroupExportConfig?.outputLocation,
      editConnectorUuid: uuid.v1(),

      editConnector: deployOne?.featureGroupExportConfig?.databaseConnectorId, //databaseConnectorId
      editConnectorConfig: deployOne?.featureGroupExportConfig?.objectName, //databaseTableName
      editConnectorMode: deployOne?.featureGroupExportConfig?.writeMode, //INSERT, upsert
      editConnectorColumns: deployOne?.featureGroupExportConfig?.databaseFeatureMapping, //columnmapping
      editConnectorIDColumn: deployOne?.featureGroupExportConfig?.idColumn, // id col
      editConnectorAdditionalIDColumns: deployOne?.featureGroupExportConfig?.additionalIdColumns,
    });
  };

  clearEditState = () => {
    this.setState({
      isEdit: false,
      outputType: null,
      editFileOutputFormat: null,
      editLocation: null,
      editConnectorUuid: uuid.v1(),
      connectorConfig: null,

      editConnector: null,
      editConnectorConfig: null,
      editConnectorMode: null,
      editConnectorColumns: null,
      editConnectorIDColumn: null,
      editConnectorIDColumnValue: null,
      editConnectorAdditionalIDColumns: null,
    });
  };

  onClickEditSave = (deployOne, e) => {
    let { paramsProp } = this.props;
    let deployId = deployOne?.deploymentId;
    const doWork = () => {
      this.clearEditState();
      let projectId = this.props.paramsProp && this.props.paramsProp.get('projectId');

      StoreActions.deployList_(projectId, () => {
        this.setState({
          editConnectorUuid: uuid.v1(),
        });
      });
    };

    let outputType = this.state.outputType;
    if (outputType == null) {
      if (!deployOne?.featureGroupExportConfig) {
        outputType = OutputTypeEnum.None;
      } else if (deployOne?.featureGroupExportConfig?.databaseConnectorId) {
        outputType = OutputTypeEnum.Connector;
      } else {
        outputType = OutputTypeEnum.Storage;
      }
    }

    if (outputType === OutputTypeEnum.Connector) {
      let columns = { ...(this.state?.editConnectorColumnsValues ?? {}) };
      let kk = Object.keys(columns);
      kk.some((k1) => {
        let value = columns[k1];
        if (
          this.state?.editConnectorColumns &&
          value &&
          ((Array.isArray(this.state?.editConnectorColumns) && this.state?.editConnectorColumns?.includes(k1)) ||
            (typeof this.state?.editConnectorColumns === 'object' && this.state?.editConnectorColumns !== null && this.state?.editConnectorColumns.hasOwnProperty(k1)))
        ) {
          //
        } else {
          delete columns[k1];
        }
      });
      REClient_.client_().setDeploymentFeatureGroupExportDatabaseConnectorOutput(
        deployId,
        this.state?.editConnector,
        this.state?.editConnectorConfig,
        this.state?.editConnectorMode,
        JSON.stringify(columns),
        this.state?.editConnectorIDColumn,
        this.state?.editConnectorAdditionalIDColumns,
        (errL, resL) => {
          if (errL || !resL?.success) {
            REActions.addNotificationError(errL || Constants.errorDefault);
          } else {
            doWork();
          }
        },
      );
    } else if (outputType === OutputTypeEnum.Storage) {
      if (Utils.isNullOrEmpty(this.state.editLocation)) {
        REActions.addNotificationError('Missing Export Location');
        return;
      }
      if (Utils.isNullOrEmpty(this.state.editFileOutputFormat)) {
        REActions.addNotificationError('Missing Export File Format');
        return;
      }
      REClient_.client_().setDeploymentFeatureGroupExportFileConnectorOutput(deployId, this.state.editFileOutputFormat, this.state.editLocation, (errL, resL) => {
        if (errL || !resL?.success) {
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    } else {
      REClient_.client_().removeDeploymentFeatureGroupExportOutput(deployId, (errL, resL) => {
        if (errL || !resL?.success) {
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    }
  };

  onClickEditCancel = (e) => {
    this.clearEditState();
  };

  onClickDeleteModel = (e) => {
    let { deployments, paramsProp } = this.props;
    let modelFound = null;
    if (paramsProp && paramsProp.get('modelId')) {
      modelFound = calcModelById(undefined, paramsProp.get('modelId'));
      let modelId = modelFound.get('modelId');
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
            <div>{'Model name: "' + modelFound.get('name') + '"'}</div>
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

  memDeployOne = memoizeOneCurry((doCall, deployments, projectId, deployId) => {
    if (deployments && !Utils.isNullOrEmpty(projectId) && !Utils.isNullOrEmpty(deployId)) {
      let listByProjectId = calcDeploymentsByProjectId(undefined, projectId);
      if (listByProjectId == null) {
        if (deployments.get('isRefreshing') !== 0) {
          return;
        }

        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        return listByProjectId.find((d1) => d1.deploymentId === deployId);
      }
    }
  });

  onClickDeleteDeploy = (deploymentId) => {
    if (deploymentId) {
      REClient_.client_().deleteDeployment(deploymentId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Done!');
          let projectId = this.props.paramsProp && this.props.paramsProp.get('projectId');
          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersionsHistory_(deploymentId);

          if (projectId) {
            Location.push('/' + PartsLink.deploy_list + '/' + projectId);
          } else {
            Location.push('/' + PartsLink.project_list);
          }
        }
      });
    }
  };

  onClickRestartDeployment = (deploymentId) => {
    if (deploymentId) {
      REClient_.client_().startDeployment(deploymentId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Re-Starting Deployment');
          let projectId = this.props.paramsProp && this.props.paramsProp.get('projectId');
          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersions_(deploymentId);
          StoreActions.listDeployVersionsHistory_(deploymentId);
          StoreActions.refreshDoDeployAll_(deploymentId, projectId);
        }
      });
    }
  };

  onClickStopDeployment = (deploymentId) => {
    if (deploymentId) {
      REClient_.client_().stopDeployment(deploymentId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Stopping Deployment');
          let projectId = this.props.paramsProp && this.props.paramsProp.get('projectId');
          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersions_(deploymentId);
          StoreActions.listDeployVersionsHistory_(deploymentId);
          StoreActions.refreshDoDeployAll_(deploymentId, projectId);
        }
      });
    }
  };

  memBatchPredProject = memoizeOneCurry((doCall, batchPredParam, projectId, deploymentId) => {
    return batchPred.memBatchList(undefined, projectId, deploymentId, doCall);
  });

  memDeployListVersionsHistory = memoizeOneCurry((doCall, deploymentsParam, deploymentId) => {
    let res = deployments.memDeployListVersionsHistory(doCall, undefined, deploymentId);
    return res;
  });

  onClickCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  onClickCreateVersion = (deployId, deploymentVersion, e) => {
    e.preventDefault();
    e.stopPropagation();

    REClient_.client_().describeDeployment(deployId, (err, res) => {
      let modelId = !err && res?.result?.modelId;

      if (!Utils.isNullOrEmpty(modelId) && !Utils.isNullOrEmpty(deploymentVersion)) {
        REClient_.client_()._describeDeploymentVersion(deploymentVersion, (errI, resI) => {
          let modelVersion = resI?.result?.modelVersion?.modelVersion;

          if (!Utils.isNullOrEmpty(modelVersion)) {
            Location.push('/' + PartsLink.deploy_create + '/' + modelId + '/' + this.props.paramsProp?.get('projectId'), undefined, 'newVersion=' + deployId + '&newVersionModelVersion=' + modelVersion);
          }
        });
      }
    });
  };

  onClickUpgradeDeploy = (deployId, e) => {
    e.preventDefault();
    e.stopPropagation();

    REClient_.client_().upgradeDeployment(deployId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Re Deploying');
        let projectId = this.props.paramsProp && this.props.paramsProp.get('projectId');
        StoreActions.deployList_(projectId);
        StoreActions.listDeployVersions_(deployId);
        StoreActions.listDeployVersionsHistory_(deployId);
        StoreActions.refreshDoDeployAll_(deployId, projectId);
      }
    });
  };

  onClickPromoteDeploy = (deployId, modelVersion, algorithm, featureGroupVersion, e) => {
    e?.preventDefault();
    e?.stopPropagation();

    let projectId = this.props.paramsProp?.get('projectId');
    if (featureGroupVersion) {
      REClient_.client_().promoteDeploymentFeatureGroupVersion(deployId, featureGroupVersion, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (deployId) {
            StoreActions.listDeployVersions_(deployId);
            StoreActions.getFieldValuesForDeploymentId_(deployId);
            StoreActions.listDeployVersionsHistory_(deployId);
            StoreActions.listDeployVersionsHistory_(deployId);
          }

          StoreActions.deployList_(projectId);
          StoreActions.deployTokensList_(projectId);
          StoreActions.deployList_(projectId);
        }
      });
    } else {
      REClient_.client_()._promoteDeploymentVersion(deployId, modelVersion, algorithm, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (deployId) {
            StoreActions.listDeployVersions_(deployId);
            StoreActions.getFieldValuesForDeploymentId_(deployId);
            StoreActions.listDeployVersionsHistory_(deployId);
            StoreActions.listDeployVersionsHistory_(deployId);
          }

          StoreActions.deployList_(projectId);
          StoreActions.deployTokensList_(projectId);
          StoreActions.deployList_(projectId);
        }
      });
    }
  };

  memDeploymentConfigRetrieve = memoizeOne((deployId, deployOne) => {
    if (deployId && deployOne != null) {
      setTimeout(() => {
        this.setState({
          optionsConfig: null,
          optionsConfigValuesInit: deployOne?.deploymentConfig,
        });
      }, 0);

      REClient_.client_()._getDeploymentConfigOptions(deployId, (err, res) => {
        let r1 = !err && res?.success ? res?.result : null;
        if (r1 != null) {
          this.setState({
            optionsConfig: r1,
          });
        }
      });
    }
  });

  memDeploymentVersionsActive = memoizeOne((versionsList) => {
    if (versionsList) {
      let res = null;
      versionsList.some((i1) => {
        let status = i1.status || i1.lifecycle;
        if (status === DeploymentLifecycle.ACTIVE) {
          res = i1.deploymentVersion;
          return true;
        }
      });
      return res;
    }
  });

  onClickUpdateToModelVersion = (deploymentId, modelVersion, algorithm, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!deploymentId || !modelVersion) {
      return;
    }

    REClient_.client_()._promoteDeploymentVersion(deploymentId, modelVersion, algorithm, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.listDeployVersions_(deploymentId);
      }
    });
  };

  onDeleteRefreshSchedule = () => {
    let { deployments, paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let deployId = paramsProp && paramsProp.get('deployId');

    if (projectId) {
      StoreActions.deployList_(projectId);
    }
    if (deployId) {
      StoreActions.listDeployVersions_(deployId);
    }
  };

  onChangeDisableAutoShutdown = (deploymentId, e) => {
    // let v1 = e.target.checked;
    // const {} = REClient_.promisesV2()
    //   ._setDeploymentInfraConfig(deploymentId, v1)
    //   .then(() => {
    //     StoreActions.deployList_(this.props.paramsProp?.get('projectId'));
    //     StoreActions.listDeployVersionsHistory_(deploymentId);
    //   });
  };

  onChangeAutoDeploy = (deploymentId, e) => {
    let v1 = e.target.checked;

    REClient_.client_().setAutoDeployment(deploymentId, v1, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.deployList_(this.props.paramsProp?.get('projectId'));
        StoreActions.listDeployVersionsHistory_(deploymentId);
      }
    });
  };

  onClickConfigChange = (e) => {
    Location.push('/' + PartsLink.deploy_detail + '/' + this.props.paramsProp?.get('projectId') + '/' + this.props.paramsProp?.get('deployId'), undefined, 'showConfig=true');
  };

  optionsGetCall = (cbFinish) => {
    cbFinish?.(null, { success: true, result: this.state.optionsConfig });
  };

  onClickSaveOptionsConfig = (e) => {
    let config1 = null;
    if (this.state.optionsConfigValues != null) {
      config1 = JSON.stringify(_.assign({}, this.state.optionsConfigValuesInit ?? {}, this.state.optionsConfigValues));
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let deployId = this.props.paramsProp?.get('deployId');

    REClient_.client_()._setDeploymentConfig(deployId, config1, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Done!');

        StoreActions.deployList_(projectId);
        StoreActions.listDeployVersionsHistory_(deployId);
        StoreActions.listDeployVersions_(deployId);

        setTimeout(() => {
          Location.push('/' + PartsLink.deploy_detail + '/' + projectId + '/' + deployId);
        }, 200);
      }
    });
  };

  optionsConfigOnValuesChange = (values) => {
    this.setState({
      optionsConfigValues: values,
    });
  };

  optionsConfigSetFieldsValue = (values) => {
    setTimeout(() => {
      this.setState({
        optionsConfigValues: values,
      });
    }, 0);
  };

  memDeployList = memoizeOneCurry((doCall, deploymentsParam, projectId) => {
    return deployments.memDeployForProject(doCall, undefined, projectId);
  });

  onChangeDropdownDeploySel = (option1) => {
    if (option1?.value) {
      Location.push('/' + this.props.paramsProp?.get('mode') + '/' + this.props.paramsProp?.get('projectId') + '/' + option1?.value);
    }
  };

  memDeployOptions = memoizeOne((listDeploy) => {
    return listDeploy?.map((d1) => ({ label: d1.name, value: d1.deploymentId })) ?? [];
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memOptionsModels = memoizeOne((versionsList) => {
    let res = [],
      already: any = {};

    versionsList?.some((v1) => {
      let v0 = v1?.modelName;
      if (already[v0] == null) {
        already[v0] = true;
        res.push({ label: v0, value: v0 });
      }
    });

    res.unshift({ label: 'All', value: null });

    return res;
  });

  memOptionsAlgos = memoizeOne((versionsList) => {
    let res = [],
      already: any = {};

    versionsList?.some((v1) => {
      let v0 = v1?.algoName;
      if (already[v0] == null) {
        already[v0] = true;
        res.push({ label: v0, value: v0 });
      }
    });

    res.unshift({ label: 'All', value: null });

    return res;
  });

  memFilterList = memoizeOne((versionsList, filterModelSel, filterAlgoSel) => {
    if (!versionsList) {
      return versionsList;
    }
    if (!filterModelSel && !filterAlgoSel) {
      return versionsList;
    }

    let res = versionsList?.filter((v1) => {
      if (filterModelSel != null) {
        if (v1?.modelName !== filterModelSel) {
          return false;
        }
      }
      if (filterAlgoSel != null) {
        if (v1?.algoName !== filterAlgoSel) {
          return false;
        }
      }
      return true;
    });

    return res;
  });

  memWebhookId = memoizeOne((deployId) => {
    if (!deployId) {
      return null;
    }
    return { deploymentId: deployId } as IWebhookId;
  });

  render() {
    let { deployments, paramsProp } = this.props;
    let projectId = paramsProp?.get('projectId');
    let deployId = paramsProp?.get('deployId');
    let showConfig = paramsProp?.get('showConfig');

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let isFeatureStore = foundProject1?.isFeatureStore ?? false;
    const isPnp = foundProject1?.isPnp ?? false;
    const isPnpPython = foundProject1?.isPnpPython === true;
    const isEmbeddingsOnly = foundProject1?.useCase === 'EMBEDDINGS_ONLY';
    const isAiAgent = foundProject1?.useCase === 'AI_AGENT';
    let deployOne = this.memDeployOne(false)(deployments, projectId, deployId);

    let isFeatureStoreOffline = deployOne?.offlineOnly === true && isFeatureStore;
    let isModelDeploymentOffline = !deployOne?.deployedAt && !isFeatureStore;
    let dataList = [];
    let isEdit = this.state.isEdit;
    let outputType = this.state.outputType;
    if (outputType == null) {
      if (Utils.isNullOrEmpty(deployOne?.featureGroupExportConfig)) {
        outputType = OutputTypeEnum.None;
      } else if (deployOne?.featureGroupExportConfig?.databaseConnectorId) {
        outputType = OutputTypeEnum.Connector;
      } else {
        outputType = OutputTypeEnum.Storage;
      }
    }
    let nameDetail = deployOne?.name;
    if (deployOne) {
      let deployTime = deployOne.deployedAt;
      dataList = [
        {
          id: 111,
          name: 'Deployment ID:',
          value: <CopyText>{deployOne.deploymentId}</CopyText>,
        },
        {
          id: 112,
          name: isEmbeddingsOnly ? 'Catalog ID:' : isAiAgent ? 'Agent ID:' : 'Model ID:',
          value: (
            <Link noAutoParams to={'/' + PartsLink.model_detail + '/' + deployOne.modelId + '/' + projectId} usePointer className={sd.styleTextBlueBrightColor}>
              <CopyText>{deployOne.modelId}</CopyText>
            </Link>
          ),
          marginBottom: isEmbeddingsOnly ? 12 : 0,
          hidden: deployOne.modelId == null,
        },
        {
          id: 112342342,
          name: isAiAgent ? 'Agent Version:' : 'Model Version:',
          value: <CopyText>{deployOne.modelVersion}</CopyText>,
          marginBottom: 12,
          hidden: deployOne.modelVersion == null || isEmbeddingsOnly,
        },
        {
          id: 113,
          name: 'Feature Group ID:',
          value: (
            <Link noAutoParams to={'/' + PartsLink.feature_group_detail + '/' + projectId + '/' + deployOne.featureGroupId} usePointer className={sd.styleTextBlueBrightColor}>
              <CopyText>{deployOne.featureGroupId}</CopyText>
            </Link>
          ),
          marginBottom: 12,
          hidden: deployOne.featureGroupId == null || !isFeatureStore,
        },
        {
          id: 2,
          name: 'Deployment Description:',
          value: deployOne?.description,
          hidden: showConfig,
        },
      ];
      if (!isPnp) {
        let algoNameFiltered = deployOne?.modelDeploymentConfig?.otherModelsForDataClusterTypes?.filteredOutItems?.algoName;
        if (Utils.isNullOrEmpty(algoNameFiltered)) {
          algoNameFiltered = null;
        }
        let modelTrainingType = deployOne?.modelDeploymentConfig?.modelTrainingType;
        if (Utils.isNullOrEmpty(modelTrainingType)) {
          modelTrainingType = null;
        } else {
          modelTrainingType = modelTrainingType.replace(/_/g, ' ');
          modelTrainingType = modelTrainingType
            .split(' ')
            .map(function (word, index) {
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
        }

        let streamingFgIdForInference = deployOne?.modelDeploymentConfig?.streamingFeatureGroupDetails?.[0]?.featureGroupId;
        if (Utils.isNullOrEmpty(streamingFgIdForInference)) {
          streamingFgIdForInference = null;
        }

        dataList.push({
          id: 3333,
          name: (
            <span>
              Algorithm{algoNameFiltered == null ? '' : ' Non Filtered'}:<HelpIcon id={'deploydetail_algo'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: deployOne?.algoName,
          hidden: isAiAgent || showConfig || deployOne?.algoName == null,
        });

        dataList.push({
          id: 3344,
          name: (
            <span>
              Algorithm Filtered:
              <HelpIcon id={'deploydetail_algo_filtered'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: algoNameFiltered,
          hidden: showConfig || algoNameFiltered == null,
        });

        dataList.push({
          id: 3350,
          name: (
            <span>
              Trained Model Type:
              <HelpIcon id={'deploydetail_model_training_type'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: modelTrainingType,
          hidden: showConfig || modelTrainingType == null,
        });

        dataList.push({
          id: 3355,
          name: (
            <span>
              Streaming Feature Group:
              <HelpIcon id={'deploy_streamingFgForInference'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <Link noAutoParams to={'/' + PartsLink.feature_group_detail + '/' + projectId + '/' + streamingFgIdForInference} usePointer className={sd.styleTextBlueBrightColor}>
              <CopyText>{streamingFgIdForInference}</CopyText>
            </Link>
          ),
          hidden: showConfig || streamingFgIdForInference == null,
        });
      }

      dataList = dataList.concat([
        {
          id: 3,
          name: 'Deployed:',
          value: deployTime == null ? 'Not Deployed' : moment(deployTime).format('LLL'),
          hidden: showConfig,
          topMargin: 10,
        },
        {
          id: 5,
          name: (
            <span>
              Status:
              <HelpIcon id={'deploydetail_status'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (isFeatureStoreOffline || isModelDeploymentOffline) && deployOne?.status === DeploymentLifecycle.STOPPED ? 'Offline' : DeploymentLifecycleDesc[deployOne.status],
          hidden: showConfig,
        },
        {
          id: 3000,
          name: (
            <span>
              QPS:
              <HelpIcon id={'deploydetail_qps'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: deployOne?.callsPerSecond ?? '-',
          hidden: showConfig || isFeatureStoreOffline,
        },
        {
          id: 4000,
          name: 'Streaming Data TTL:',
          value: '~ ' + (deployOne?.estimatedTtl || '60') + 's',
          hidden: !deployOne?.estimatedTtl,
        },
        {
          id: 200,
          name: (
            <span>
              Auto-Deployment:
              <HelpIcon id={'deploydetail_autodeploy'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: <Checkbox checked={deployOne?.autoDeploy === true} onChange={this.onChangeAutoDeploy.bind(this, deployOne?.deploymentId)} />,
          hidden: showConfig || foundProject1?.isFeatureStore === true,
        },
        {
          id: 201,
          name: (
            <span>
              Infrastructure Configurations
              <HelpIcon id={'deploydetail_infrastructure_configs'} style={{ marginLeft: 4 }} />
              <TooltipExt title={'Edit Infrastructure Configuration'}>
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
                  onClick={this.onClickEditInfrastructureConfig.bind(this, deployOne?.deploymentId, deployOne?.disableAutoShutdown, deployOne?.enableMonitoring, deployOne?.alertQps, deployOne?.alertLatencyMs)}
                >
                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 20, x: 0, y: -1 }} style={{ color: '#d1e4f5', marginRight: '8px' }} />
                </span>
              </TooltipExt>
              <InternalTag />
            </span>
          ),
          value: (
            <div className={styles.infrastructureConfigContainer}>
              <div>
                <span className={styles.infrastructureConfigKey}>Disable Auto Shutdown:</span>
                <span className={styles.infrastructureConfigValue}>{(deployOne?.disableAutoShutdown).toString()}</span>
              </div>
              <div>
                <span className={styles.infrastructureConfigKey}>Enable Monitoring:</span>
                <span className={styles.infrastructureConfigValue}>{(deployOne?.enableMonitoring).toString()}</span>
              </div>
              <div>
                <span className={styles.infrastructureConfigKey}>Alert QPS:</span>
                <span>{deployOne?.alertQps}</span>
              </div>
              <div>
                <span className={styles.infrastructureConfigKey}>Alert Latency (ms):</span>
                <span>{deployOne?.alertLatencyMs}</span>
              </div>
            </div>
          ),
          hidden: calcAuthUserIsLoggedIn()?.isInternal !== true || showConfig,
        },
      ]);

      if (this.state.optionsConfig != null && !_.isEmpty(this.state.optionsConfig) && !showConfig) {
        let kkCO = Object.keys(this.state.optionsConfig).sort();
        if (kkCO.length === 1 && kkCO[0]?.toLowerCase() === 'threshold') {
          //
        } else if (kkCO.length === 2 && kkCO[0]?.toLowerCase() === 'threshold' && kkCO[1]?.toLowerCase() === 'thresholdclass') {
          //
        } else {
          dataList.push({
            id: 301,
            name: 'Configuration:',
            value: (
              <span>
                <Button type={'primary'} size={'small'} onClick={this.onClickConfigChange}>
                  Change
                </Button>
              </span>
            ),
          });
        }
      }

      let bpList = deployId == null ? [] : this.memBatchPredProject(false)(this.props.batchPredParam, projectId, deployId);

      let bpForDeployCount = bpList?.length ?? 0;
      if (bpForDeployCount != null && bpForDeployCount > 0) {
        dataList.push({
          id: 30132424,
          name: 'BP List:',
          value: (
            <span>
              <Link to={['/' + PartsLink.deploy_batch + '/' + (projectId ?? '-') + '/' + deployId, 'showList=true']} usePointer showAsLinkBlue>
                Batch Predictions ({bpForDeployCount ?? 0})
              </Link>
            </span>
          ),
        });
      }

      dataList = dataList.filter((v1) => !v1.hidden);

      const desc1 = dataList.find((v1) => v1.id === 2);
      if (desc1) {
        if (Utils.isNullOrEmpty(desc1.value)) {
          dataList.splice(dataList.indexOf(desc1), 1);
        }
      }

      let refreshSchedules = deployOne?.refreshSchedules;
      if (isFeatureStore) {
        const onChangeOutputType = (e) => {
          this.setState({ outputType: e.target.value });
        };
        let output1 = (
          <span>
            <Radio.Group value={outputType ?? ''} onChange={isEdit ? onChangeOutputType : null}>
              <Radio value={OutputTypeEnum.None}>
                <span
                  css={`
                    color: white;
                  `}
                >
                  Deploy Only
                </span>
              </Radio>
              <Radio value={OutputTypeEnum.Storage}>
                <span
                  css={`
                    color: white;
                  `}
                >
                  Export File Connector
                </span>
              </Radio>
              <Radio value={OutputTypeEnum.Connector}>
                <span
                  css={`
                    color: white;
                  `}
                >
                  Export Database Connector
                </span>
              </Radio>
            </Radio.Group>
          </span>
        );
        dataList.push({
          id: 8,
          name: 'Feature Group Export Configuration:',
          helpId: 'deploymentFG_output',
          value: <span css={``}>{output1}</span>,
        });
        if (outputType && outputType != OutputTypeEnum.Connector) {
          dataList.push({
            id: 55,
            name: 'Feature Group Export Format:',
            helpId: 'deploymentFG_outputFormat',
            value: (
              <span css={``}>
                {isEdit && (
                  <span
                    css={`
                      width: 180px;
                      font-size: 14px;
                      display: inline-block;
                    `}
                  >
                    <SelectExt
                      onChange={(option1) => {
                        this.setState({ editFileOutputFormat: option1?.value });
                      }}
                      value={{ label: this.state.editFileOutputFormat ?? deployOne?.featureGroupExportConfig?.fileFormat, value: this.state.editFileOutputFormat ?? deployOne?.featureGroupExportConfig?.fileFormat }}
                      options={[
                        { label: 'CSV', value: 'CSV' },
                        { label: 'JSON', value: 'JSON' },
                      ]}
                    />
                  </span>
                )}
                {!isEdit && (deployOne?.featureGroupExportConfig?.fileFormat ?? '-')}
              </span>
            ),
          });
        }
        if (outputType == OutputTypeEnum.Storage) {
          dataList.push({
            id: 777,
            name: 'Export File Connector Location:',
            helpId: 'deploymentFG_outputLocation',
            value: (
              <span
                css={`
                  display: inline-block;
                  ${isEdit ? 'width: 300px;' : ''}
                `}
              >
                {isEdit && (
                  <Input
                    value={this.state.editLocation ?? deployOne?.featureGroupExportConfig?.outputLocation ?? ''}
                    onChange={(e) => {
                      this.setState({ editLocation: e.target.value });
                    }}
                  />
                )}
                {!isEdit && <span>{deployOne?.featureGroupExportConfig?.outputLocation}</span>}
              </span>
            ),
          });
        }
        if (outputType == OutputTypeEnum.Connector) {
          const onChangeState = (stateNew) => {
            if (stateNew != null && !_.isEmpty(stateNew)) {
              this.setState(stateNew);
            }
          };

          dataList.push({
            id: 500000,
            value: <ConnectorEditInline showTooltips featureGroupId={deployOne.featureGroupId} isDeployment key={'ccc' + this.state.editConnectorUuid} onChangeState={onChangeState} isEdit={isEdit} idColumnAsString isFeatureGroup />,
            onlyValue: true,
          });
        }

        dataList.push({
          id: 99,
          name: '',
          value: (
            <span
              css={`
                margin-left: -5px;
              `}
            >
              {!isEdit && (
                <Button onClick={this.onClickEditTOptions.bind(this, deployOne)} type={'primary'}>
                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 14, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginRight: '4px' }} /> Edit
                </Button>
              )}
              {isEdit && (
                <Button
                  css={`
                    margin-right: 10px;
                  `}
                  onClick={this.onClickEditCancel}
                  type={'default'}
                  ghost
                >
                  Cancel
                </Button>
              )}
              {isEdit && (
                <Button onClick={this.onClickEditSave.bind(this, deployOne)} type={'primary'}>
                  Save
                </Button>
              )}
            </span>
          ),
          marginVert: 20,
        });

        dataList.push({
          id: 500,
          name: 'Deployment Refresh Schedules',
          value: (
            <div>
              {refreshSchedules?.map((d1, d1ind) => {
                return (
                  <div key={'cron_' + d1ind} style={{ margin: '3px 0 3px 30px' }}>
                    <CronOne
                      projectId={this.props.paramsProp?.get('projectId')}
                      deploymentIds={[this.props.paramsProp?.get('deployId')]}
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
              {this.props.paramsProp?.get('projectId') != null && this.props.paramsProp?.get('deployId') != null && (
                <div style={{ margin: '3px 0 3px 30px' }}>
                  <CronOne isNew projectId={this.props.paramsProp?.get('projectId')} deploymentIds={[this.props.paramsProp?.get('deployId')]} />
                </div>
              )}
            </div>
          ),
        });
      }
    }

    let lifecycle = deployOne?.status;

    let createdAt = deployOne?.createdAt;
    if (createdAt != null) {
      createdAt = moment(createdAt);
      if (!createdAt.isValid()) {
        createdAt = null;
      }
    } else {
      createdAt = null;
    }

    let versionsList = this.memDeployListVersionsHistory(false)(this.props.deployments, deployId);
    let columnsVersions: (ITableExtColumn & { hidden?: boolean })[] = [
      {
        title: isFeatureStore ? 'Feature Group Version' : isEmbeddingsOnly ? 'Catalog Version' : isAiAgent ? 'Agent Version' : 'Model Version',
        field: isFeatureStore ? 'featureGroupVersion' : 'modelVersion',
        isLinked: true,
        render: (text, row, index) => {
          return (
            <Link
              to={
                isFeatureStore
                  ? '/' + PartsLink.feature_group_detail + '/' + this.props.paramsProp?.get('projectId') + '/' + row.featureGroupId
                  : deployOne == null
                  ? null
                  : '/' + PartsLink.model_detail + '/' + row?.modelId + '/' + this.props.paramsProp?.get('projectId')
              }
            >
              <CopyText>{text}</CopyText>
            </Link>
          );
        },
      },
      {
        title: isFeatureStore ? 'Feature Group Table Name' : isEmbeddingsOnly ? 'Catalog Name' : isAiAgent ? 'Agent Name' : 'Model Name',
        field: isFeatureStore ? 'featureGroupTableName' : 'modelName',
        isLinked: true,
        render: (text, row, index) => {
          return (
            <Link
              to={
                isFeatureStore
                  ? '/' + PartsLink.feature_group_detail + '/' + this.props.paramsProp?.get('projectId') + '/' + row.featureGroupId
                  : deployOne == null
                  ? null
                  : '/' + PartsLink.model_detail + '/' + row?.modelId + '/' + this.props.paramsProp?.get('projectId')
              }
            >
              {text}
            </Link>
          );
        },
      },
    ];
    if (!isPnp) {
      columnsVersions.push({
        title: 'Algorithm',
        field: 'algoName',
        hidden: isFeatureStore || isAiAgent,
      });
      columnsVersions.push({
        title: 'Algorithm Id',
        field: 'algorithm',
        hidden: isFeatureStore || isAiAgent,
        render: (text, row) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
        width: 120,
      });
    }
    columnsVersions = columnsVersions.concat([
      {
        title: isFeatureStore ? 'Materialized At' : isPnp ? 'Processed At' : 'Trained At',
        field: 'createdAt',
        render: (text, row, index) => {
          return text == null ? '-' : moment(text).format('LLL');
        },
      },
      {
        title: 'Deployed At',
        field: 'deployedAt',
        render: (text, row, index) => {
          return text == null ? '-' : moment(text).format('LLL');
        },
      },
      {
        title: 'Status',
        field: 'status',
        render: (text, row, index) => {
          text = row.state ?? row.lifecycle;

          let isTraining = false;
          if ([DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING, DeploymentLifecycle.STOPPING, DeploymentLifecycle.DELETING].includes(text || '')) {
            isTraining = true;
            StoreActions.refreshDoDeployVersionAll_(row.deploymentVersion, this.props.paramsProp?.get('deployId'), this.props.paramsProp?.get('projectId'));
          }
          let isOffline = row.deployedAt ? false : true && row.lifecycle === DeploymentLifecycle.STOPPED;
          let lifecycleDesc = isOffline ? 'Offline' : isTraining ? DeploymentLifecycleDesc[text ?? ''] : DeploymentLifecycleDesc[text];
          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{lifecycleDesc}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            return <span style={{ whiteSpace: 'nowrap' }}>{lifecycleDesc || '-'}</span>;
          }
        },
      },
      {
        title: 'Online Capable',
        hidden: !isFeatureStore,
        field: 'onlineCapable',
        render: (text, row, index) => {
          if (!isFeatureStore) {
            return null;
          }
          if (row?.onlineCapable) {
            return <span>Online + Batch</span>;
          } else {
            return <span>Batch Only</span>;
          }
        },
      },
      {
        title: 'Active',
        field: 'active',
        render: (text, row, index) => {
          if (row?.isActive) {
            return (
              <span>
                <FontAwesomeIcon title={'Active'} icon={['fas', 'check']} transform={{ size: 17, x: -1, y: 1 }} style={{ opacity: 0.7, color: 'green', marginLeft: '4px' }} />
              </span>
            );
          } else {
            return <span style={{ whiteSpace: 'nowrap' }}></span>;
          }
        },
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          let status = row.state ?? row.lifecycle;
          const showPointButton = !row?.isActive && [DeploymentLifecycle.CANCELLED, DeploymentLifecycle.FAILED, DeploymentLifecycle.STOPPED, null, undefined].includes(status);
          const deploymentName = deployOne?.name || '';
          const targetType = isFeatureStore ? 'feature group' : 'model';
          const targetVersion = isFeatureStore ? row.featureGroupVersion : row.modelVersion;
          const targetAlgorithm = !isPnp && row.algoName ? ` and algorithm '${row.algoName}'` : '';
          const targetAlgorithmUpperCase = !isPnp && row.algoName ? ' and Algorithm' : '';
          return (
            <span>
              {showPointButton && (
                <ModalConfirm
                  onCancel={this.onClickCancel}
                  onConfirm={this.onClickPromoteDeploy.bind(this, this.props.paramsProp?.get('deployId'), row.modelVersion, row.algorithm, row.featureGroupVersion)}
                  title={`Do you want to point this deployment "${deploymentName}" to ${targetType} version '${targetVersion}'${targetAlgorithm}?`}
                  icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                  okText={'Update Deployment'}
                  cancelText={'Cancel'}
                  okType={'primary'}
                >
                  <Button type={'primary'} ghost onClick={this.onClickCancel}>
                    Point to this {isFeatureStore ? 'Feature Group' : isEmbeddingsOnly ? 'Catalog' : 'Model'} Version{targetAlgorithmUpperCase}
                  </Button>
                </ModalConfirm>
              )}
            </span>
          );
        },
      },
    ]);

    if (isPnp) {
      columnsVersions = columnsVersions?.filter((c1) => c1.field !== 'algoName');
    }
    columnsVersions = columnsVersions?.filter((c1) => !c1.hidden);

    const deploymentVersionToUse = this.memDeploymentVersionsActive(versionsList);

    this.memDeploymentConfigRetrieve(deployId, deployOne);

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let optionsDeploySel = null;
    let optionsDeploy = [];
    let listDeploy = this.memDeployList(false)(this.props.deployments, projectId);
    optionsDeploy = this.memDeployOptions(listDeploy);
    if (optionsDeploy && deployId) {
      optionsDeploySel = optionsDeploy.find((p1) => p1.value === deployId);
    }

    const onScrollBottom = (perc) => {
      this.tableVersionsRef.current?.needMoreNow?.();
    };

    let optionsModels = this.memOptionsModels(versionsList);
    let optionsAlgos = this.memOptionsAlgos(versionsList);

    versionsList = this.memFilterList(versionsList, this.state.filterModelSel, this.state.filterAlgoSel);

    let webhookId = this.memWebhookId(deployId);
    const isPretrained = foundProject1?.useCase?.toUpperCase()?.startsWith('PRETRAINED');
    let showPredAPI = foundProject1?.showPredictionApi;
    if (['NLP_CHAT'].includes(foundProject1?.useCase?.toUpperCase()) || isPretrained) {
      showPredAPI = false;
    }
    let showPredDash = foundProject1?.showPredictionDashboard;
    let canSwitchVersion = !isFeatureStore && !isPretrained;

    return (
      <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px' }}>
        <NanoScroller onlyVertical onScrollBottom={onScrollBottom}>
          <div
            className={sd.titleTopHeaderAfter}
            style={{ height: topAfterHeaderHH }}
            css={`
              display: flex;
              align-items: center;
            `}
          >
            <span>{'Deployment Detail'}</span>
            <span style={{ marginLeft: '16px', width: '440px', display: 'inline-block', fontSize: '12px' }}>
              <SelectExt value={optionsDeploySel} options={optionsDeploy} onChange={this.onChangeDropdownDeploySel} menuPortalTarget={popupContainerForMenu(null)} />
            </span>
            <span
              css={`
                flex: 1;
              `}
            ></span>

            {!showConfig && (
              <div style={{ marginRight: '10px' }}>
                {DeploymentLifecycle.ACTIVE === lifecycle && (
                  <ModalConfirm
                    onConfirm={this.onClickStopDeployment.bind(this, deployOne?.deploymentId)}
                    title={`Do you want to suspend deployment "${deployOne?.name || ''}"?`}
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    okText={'Suspend'}
                    cancelText={'Cancel'}
                    okType={'danger'}
                  >
                    <Button style={{ marginLeft: '8px', borderColor: 'transparent' }} danger ghost>
                      <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faPause').faPause} transform={{ size: 20, x: 0, y: -1 }} style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      Suspend
                    </Button>
                  </ModalConfirm>
                )}
                {[DeploymentLifecycle.STOPPED, DeploymentLifecycle.FAILED, DeploymentLifecycle.CANCELLED].includes(lifecycle) && (
                  <ModalConfirm
                    onConfirm={this.onClickDeleteDeploy.bind(this, deployOne?.deploymentId)}
                    title={`Do you want to delete deployment "${deployOne?.name || ''}"?`}
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    okText={'Delete'}
                    cancelText={'Cancel'}
                    okType={'danger'}
                  >
                    <Button style={{ marginLeft: '8px', borderColor: 'transparent' }} danger ghost>
                      <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faTrashAlt').faTrashAlt} transform={{ size: 20, x: 0, y: -1 }} style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      Delete
                    </Button>
                  </ModalConfirm>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex' }} className={sd.backdetail}>
            <div style={{ marginRight: '24px' }}>
              <img src={calcImgSrc('/imgs/deployIcon.png')} alt={''} style={{ width: '80px' }} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
              <div style={{ marginBottom: '10px' }}>
                <span
                  css={`
                    margin-right: 7px;
                  `}
                >
                  <StarredSpan isStarred={deployOne?.starred} onClick={this.onClickStarred.bind(this, deployOne?.deploymentId)} size={19} y={-2} name={'Deployment'} />
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
                      onClick={this.onClickRenameModel.bind(this, deployOne?.deploymentId, nameDetail || '')}
                    >
                      <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 20, x: 0, y: -3 }} style={{ color: '#d1e4f5', marginRight: '8px' }} />
                    </span>
                  </TooltipExt>
                }
              </div>
              {dataList.map((d1) => (
                <div key={'val_' + d1.id} style={{ padding: '2px 0', marginBottom: (d1.marginBottom ?? 0) + 'px', marginTop: (d1.topMargin ?? 0) + 'px' }}>
                  <span>
                    <DetailName>{d1.name}</DetailName>
                    <DetailValue>{d1.value}</DetailValue>
                  </span>
                </div>
              ))}
            </div>
            {!showConfig && (
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '10px' }}>
                {createdAt != null && (
                  <div>
                    <DetailCreatedAt>Created At: {createdAt?.format('LLL')}</DetailCreatedAt>
                  </div>
                )}
                <div style={{ marginTop: '20px' }}>
                  {!isPnpPython && !isFeatureStore && showPredDash && [DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                    <Link to={'/' + PartsLink.model_predictions + '/' + projectId + (deployOne?.deploymentId == null ? '' : '/' + deployOne?.deploymentId)}>
                      <Button className={sd.detailbuttonblue} style={{ marginLeft: '8px' }} type={'primary'}>
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  {!isFeatureStore && showPredAPI && [DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                    <Link to={'/' + PartsLink.deploy_predictions_api + '/' + projectId + '/' + deployOne?.deploymentId}>
                      <Button className={sd.detailbuttonblue} style={{ marginLeft: '8px' }} type={'primary'} ghost>
                        Predictions API
                      </Button>
                    </Link>
                  )}
                  {isFeatureStore && [DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                    <Link to={'/' + PartsLink.deploy_lookup_api + '/' + projectId + '/' + deployOne?.deploymentId}>
                      <Button className={sd.detailbuttonblue} style={{ marginLeft: '8px' }} type={'primary'} ghost>
                        Look Up-API
                      </Button>
                    </Link>
                  )}
                  {!isFeatureStoreOffline && [DeploymentLifecycle.STOPPED, DeploymentLifecycle.CANCELLED, DeploymentLifecycle.FAILED].includes(lifecycle) && (
                    <Button className={sd.detailbuttonblue} style={{ marginLeft: '8px' }} onClick={this.onClickRestartDeployment.bind(this, deployOne?.deploymentId)} ghost>
                      Re-Start
                    </Button>
                  )}
                  {!isFeatureStore && calcAuthUserIsLoggedIn()?.isInternal ? (
                    <ModalConfirm
                      onCancel={this.onClickCancel}
                      onConfirm={this.onClickUpgradeDeploy.bind(this, this.props.paramsProp?.get('deployId'))}
                      title={`Do you want to Re-Deploy deployment "${deployOne?.name || ''}"?`}
                      icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                      okText={'Refresh Deployment'}
                      cancelText={'Cancel'}
                      okType={'primary'}
                    >
                      <TooltipExt title={'Refresh Deployment'}>
                        <Button style={{ marginLeft: '8px' }} type={'primary'} onClick={this.onClickCancel}>
                          Re-Deploy
                        </Button>
                      </TooltipExt>
                    </ModalConfirm>
                  ) : null}
                </div>
                <div
                  css={`
                    margin-top: 15px;
                  `}
                >
                  {deployId && deployOne?.modelId != null && canSwitchVersion && (
                    <Link to={['/' + PartsLink.deploy_create + '/' + deployOne?.modelId + '/' + projectId, `version=${encodeURIComponent(deployOne?.modelVersion ?? '')}&editDeployId=${encodeURIComponent(deployId ?? '')}`]}>
                      <Button className={sd.detailbuttonblue} style={{ marginLeft: '8px' }} type={'primary'} ghost>
                        Switch Version{isPnp ? '' : '/Algorithm'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {!showConfig && (
            <div style={{ margin: '40px 0' }}>
              <div
                className={sd.titleTopHeaderAfter}
                style={{ marginBottom: '14px' }}
                css={`
                  display: flex;
                  align-items: center;
                `}
              >
                <span>{isFeatureStore ? 'Deployed Feature Group' : isEmbeddingsOnly ? 'Deployed Catalog' : isAiAgent ? 'Deployed Agent' : 'Deployed Model'} Versions</span>
                <HelpIcon id={isFeatureStore ? 'deploydetail_fgversions' : isAiAgent ? 'deploydetail_agentversions' : 'deploydetail_modelversions'} style={{ marginLeft: '4px' }} />
              </div>
              <TableExt
                prefixHelpIdForColumnsAuto={'deployedVersions'}
                ref={this.tableVersionsRef}
                autoInfiniteScroll={50}
                isDetailTheme
                showEmptyIcon
                defaultSort={{ field: 'createdAt', isAsc: false }}
                notsaveSortState={'deploys_versions_list'}
                dataSource={versionsList}
                columns={columnsVersions}
                calcKey={(r1) => r1.deploymentVersion}
              />
            </div>
          )}

          {!showConfig && webhookId != null && (
            <div style={{ margin: '40px 0' }}>
              <WebhookList id={webhookId} />
            </div>
          )}

          {showConfig && this.state.optionsConfig != null && (
            <div
              css={`
                margin: 40px 0;
              `}
            >
              <div style={{ margin: '0 auto', maxWidth: '600px', padding: '22px', borderRadius: '4px' }} className={sd.grayPanel}>
                <div
                  css={`
                    padding: 5px 0 20px;
                    text-align: center;
                    font-size: 16px;
                  `}
                >
                  Configuration
                </div>
                <OptionsBuilder
                  wrapForm
                  projectId={projectId}
                  onValuesChange={this.optionsConfigOnValuesChange}
                  setFieldsValue={this.optionsConfigSetFieldsValue}
                  optionsGetCall={this.optionsGetCall}
                  initialValues={this.state.optionsConfigValuesInit}
                />

                <div
                  css={`
                    margin-top: 20px;
                    text-align: center;
                  `}
                >
                  <Button type={'primary'} onClick={this.onClickSaveOptionsConfig}>
                    Save
                  </Button>
                </div>
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
    deployments: state.deployments,
    metrics: state.metrics,
    projects: state.projects,
    batchPredParam: state.batchPred,
  }),
  null,
)(DeployDetail);
