import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import { Button } from '../../DesignSystem/Button/Button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import Radio from 'antd/lib/radio';
import _ from 'lodash';
import * as React from 'react';
import { connect, Provider } from 'react-redux';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import batchPred, { BatchPredLifecycle, BatchPredLifecycleDesc } from '../../stores/reducers/batchPred';
import databaseConnectorOptions from '../../stores/reducers/databaseConnectorOptions';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import BatchConfigFeatureGroups from '../BatchConfigFeatureGroups/BatchConfigFeatureGroups';
import ConnectorEditInline from '../ConnectorEditInline/ConnectorEditInline';
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
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import ViewFile from '../ViewFile/ViewFile';
import styles from './BatchPredDetail.module.css';
import globalStyles from '../antdUseDark.module.css';
import classNames from 'classnames';

const { confirm } = Modal;

export enum OutputTypeEnum {
  Console = 'console',
  Storage = 'storage',
  Connector = 'connector',
  FeatureGroup = 'featuregroup',
}

interface IBatchPredDetailProps {
  projects?: any;
  models?: any;
  deployments?: any;
  paramsProp?: any;
  projectsDatasets?: any;
  featureGroupsParam?: any;
  databaseConnectors?: any;
  databaseConnectorOptions?: any;
  databaseConnectorObjects?: any;
  databaseConnectorObjectSchema?: any;
  batchPred?: any;
  useCases?: any;
}

interface IBatchPredDetailState {
  checkedKeys?: any;

  csvInputPrefix?: string;
  csvPredictionPrefix?: string;
  csvExplanationsPrefix?: string;

  isEdit?: boolean;
  isEditOutputs?: boolean;
  editFileOutputFormat?: any;
  editDeployId?: any;
  editExplanation?: any;
  outputType?: OutputTypeEnum;
  editLocation?: any;
  editFGTablename?: any;
  overridesUsedFG?: any;
  hasAdvancedOptions?: boolean;
  metadataColumn?: boolean;
  editConnectorUuid?: string;

  editConnector?: any;
  editConnectorConfig?: any;
  editConnectorMode?: any;
  editConnectorColumns?: any;
  editConnectorIDColumn?: any;
  editConnectorIDColumnValue?: any;
  editConnectorAdditionalIDColumns?: any;

  editConnectorColumnsValues?: any;
}

class BatchPredDetail extends React.PureComponent<IBatchPredDetailProps, IBatchPredDetailState> {
  private isM: boolean;
  confirmReTrain: any;
  confirmHistory: any;
  exportFGTableName: string;
  exportFGattachToProject: boolean;
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
    this.isM = false;

    if (this.confirmUsedRename != null) {
      this.confirmUsedRename.destroy();
      this.confirmUsedRename = null;
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
    let batchPredId = this.props.paramsProp?.get('batchPredId');
    let modelMonitor = this.props.paramsProp?.get('modelMonitorId');

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let batchPredOne = this.memBatchOne(true)(this.props.batchPred, batchPredId);
    let batchVersionsList = this.memBatchVersionsList(true)(this.props.batchPred, batchPredId);

    let batchList = this.memBatchPredList(true)(this.props.batchPred, projectId);

    let useCaseInfo = this.memUseCaseInfo(true)(this.props.useCases, foundProject1?.useCase);

    this.memDeployHasAdvancedOptions(batchPredOne?.deploymentId);

    this.memFGDiff(batchPredOne);

    this.memDeploymentList(true)(this.props.deployments, projectId);
  };

  memFGDiff = memoizeOne((batchPredOne) => {
    this.setState({
      csvInputPrefix: batchPredOne?.csvInputPrefix ?? '',
      csvPredictionPrefix: batchPredOne?.csvPredictionPrefix ?? '',
      csvExplanationsPrefix: batchPredOne?.csvExplanationsPrefix ?? '',
    });
  });

  componentDidUpdate(): void {
    this.doMem();
  }

  onClickRefreshDataset = (e) => {
    REActions.addNotification('Not implemented!');
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memDeployHasAdvancedOptions = memoizeOne((deployId) => {
    if (!deployId) {
      return;
    }

    REClient_.client_()._getBatchPredictionArgs(deployId, undefined, undefined, undefined, (err, res) => {
      let r1 = res?.result;
      if (_.isEmpty(r1)) {
        r1 = null;
      }

      if (res?.success) {
        let r;
        if (r1 == null) {
          r = false;
        } else {
          r = true;
        }
        this.setState({
          hasAdvancedOptions: r,
        });

        return r;
      }
    });
  });

  onClickDeleteBatchPred = (e) => {
    let batchPredId = this.props.paramsProp?.get('batchPredId');
    if (batchPredId) {
      REClient_.client_().deleteBatchPrediction(batchPredId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          let projectId = this.props.paramsProp?.get('projectId');
          StoreActions.deployList_(projectId);
          StoreActions.batchList_(projectId);
          StoreActions.batchListVersions_(batchPredId);
          StoreActions.batchDescribeById_(batchPredId);

          Location.push('/' + PartsLink.deploy_batch + '/' + projectId, undefined, 'showList=true');
        }
      });
    }
  };

  memBatchOne = memoizeOneCurry((doCall, batchPredParam, batchPredId) => {
    return batchPred.memBatchDescribe(undefined, batchPredId, doCall);
  });

  onClickEditTOptions = (batchPredOne, isOutputs, e) => {
    this.setState({
      isEdit: !isOutputs,
      isEditOutputs: isOutputs === true,
      overridesUsedFG: null,
      editFileOutputFormat: null,
      editLocation: null,

      editConnectorUuid: uuid.v1(),
      editConnector: null,
      editConnectorConfig: null,
      editConnectorMode: null,
      editConnectorColumns: null,
      editConnectorIDColumn: null,
      editConnectorIDColumnValue: null,
      editConnectorAdditionalIDColumns: null,
      editConnectorColumnsValues: null,
    });
  };

  onClickEditCancel = (e) => {
    this.setState({
      isEdit: false,
      isEditOutputs: false,
      outputType: null,
      editFileOutputFormat: null,
      editLocation: null,

      editConnectorUuid: uuid.v1(),
      editConnector: null,
      editConnectorConfig: null,
      editConnectorMode: null,
      editConnectorColumns: null,
      editConnectorIDColumn: null,
      editConnectorIDColumnValue: null,
      editConnectorAdditionalIDColumns: null,
      editConnectorColumnsValues: null,
    });

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');

    StoreActions.deployList_(projectId);
    StoreActions.batchList_(projectId);
    StoreActions.batchListVersions_(batchPredId);
    StoreActions.batchDescribeById_(batchPredId);
  };

  onClickConfigConnector = (e) => {};

  onClickEditSave = (batchPredOne, e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');

    const writeOverridesData = (deployId, batchPredId, overrides1, isFG) => {
      return new Promise((resolve) => {
        let kk = Object.keys(overrides1 ?? {});
        if (kk.length === 0) {
          resolve(null);
        } else {
          let pp = kk.map((k1) => {
            return new Promise((resolve) => {
              if (isFG) {
                REClient_.client_().setBatchPredictionFeatureGroup(batchPredId, k1, overrides1?.[k1], (err, res) => {
                  if (err) {
                    Utils.error(err + ' ' + k1 + ' ' + overrides1?.[k1]);
                  }
                  resolve(null);
                });
              } else {
                REClient_.client_().setBatchPredictionDataset(batchPredId, k1, overrides1?.[k1], (err, res) => {
                  if (err) {
                    Utils.error(err + ' ' + k1 + ' ' + overrides1?.[k1]);
                  }
                  resolve(null);
                });
              }
            });
          });

          Promise.all(pp).then((ppRes) => {
            resolve(null);
          });
        }
      });
    };

    const doWork = () => {
      writeOverridesData(batchPredOne?.deploymentId, batchPredId, this.state.overridesUsedFG, true).then(() => {
        doWorkNext();
      });
    };

    const doWorkNext = () => {
      REClient_.client_().updateBatchPrediction(
        batchPredId,
        this.state.editDeployId,
        undefined,
        this.state.editExplanation,
        this.state.editFileOutputFormat,
        this.state.csvInputPrefix,
        this.state.csvPredictionPrefix,
        this.state.csvExplanationsPrefix,
        null,
        this.state.metadataColumn,
        null,
        null,
        (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            this.setState({
              isEdit: false,
              isEditOutputs: false,
              outputType: null,
              editFileOutputFormat: null,
              editLocation: null,

              editConnectorUuid: uuid.v1(),
              editConnector: null,
              editConnectorConfig: null,
              editConnectorMode: null,
              editConnectorColumns: null,
              editConnectorIDColumn: null,
              editConnectorIDColumnValue: null,
              editConnectorAdditionalIDColumns: null,
            });

            StoreActions.deployList_(projectId, () => {
              this.setState({
                editConnectorUuid: uuid.v1(),
              });
            });
            StoreActions.batchListVersions_(batchPredId);
            StoreActions.batchDescribeById_(batchPredId);
            StoreActions.batchList_(projectId, null, () => {
              this.setState({
                editConnectorUuid: uuid.v1(),
              });
            });
          }
        },
      );
    };

    let outputType = this.state.outputType;
    let outputTypeOne = null;

    if (batchPredOne) {
      let f1 = batchPredOne?.connectorType?.toUpperCase();
      if (f1 === 'FILE_CONNECTOR') {
        outputTypeOne = OutputTypeEnum.Storage;
      } else if (f1 === 'DATABASE_CONNECTOR') {
        outputTypeOne = OutputTypeEnum.Connector;
      } else if (f1 === 'FEATURE_GROUP') {
        outputTypeOne = OutputTypeEnum.FeatureGroup;
      }
    }
    if (outputTypeOne == null) {
      outputTypeOne = OutputTypeEnum.Console;
    }

    if (outputType == null) {
      outputType = outputTypeOne;
    }

    if (outputType === OutputTypeEnum.FeatureGroup) {
      let usedTablename = this.state.editFGTablename;
      if (Utils.isNullOrEmpty(usedTablename)) {
        doWork();
        return;
      }

      REClient_.client_().setBatchPredictionFeatureGroupOutput(batchPredId, usedTablename, (errL, resL) => {
        if (errL || !resL?.success) {
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    } else if (outputType === OutputTypeEnum.Connector) {
      let usedId = this.state.editConnector ?? batchPredOne?.databaseConnectorId;
      let usedIdConfig = this.state.editConnectorConfig ?? batchPredOne?.databaseOutputConfiguration?.objectName;
      let usedIdMode = this.state.editConnectorMode ?? batchPredOne?.databaseOutputConfiguration?.mode;

      let cols = {};

      let colsValues = this.state.editConnectorColumnsValues;
      let usedIdColumns = colsValues ? Object.keys(colsValues) : null;
      if (colsValues == null) {
        let cc = batchPredOne?.databaseOutputConfiguration?.dataColumns;
        if (cc != null) {
          cols = cc;
        }
      } else {
        usedIdColumns?.some((s1) => {
          cols[s1] = colsValues?.[s1];
        });
      }
      if (Utils.isNullOrEmpty(usedIdColumns)) {
        usedIdColumns = null;
      }

      let usedIdIdColumn = this.state.editConnectorIDColumn;
      let usedIdIdColumnValue = this.state.editConnectorIDColumnValue;
      if (usedIdIdColumn == null) {
        let cc = batchPredOne?.databaseOutputConfiguration?.idColumn;
        if (cc != null) {
          usedIdIdColumn = Object.keys(cc)?.[0];
          usedIdIdColumnValue = Object.values(cc)?.[0];
        }
      }
      let usedAdditionalIdColumns = this.state.editConnectorAdditionalIDColumns;
      if (_.isArray(usedAdditionalIdColumns) && usedAdditionalIdColumns?.length === 0) {
        usedAdditionalIdColumns = null;
      }
      if (usedAdditionalIdColumns == null) {
        let cc = batchPredOne?.databaseOutputConfiguration?.additionalIdColumns;
        if (cc != null) {
          usedAdditionalIdColumns = cc;
        }
      }

      let obj1: any = { objectName: usedIdConfig, mode: usedIdMode, dataColumns: cols };
      if (!Utils.isNullOrEmpty(usedIdIdColumn)) {
        obj1.idColumn = { [usedIdIdColumn]: usedIdIdColumnValue };
      }
      if (!Utils.isNullOrEmpty(usedAdditionalIdColumns)) {
        obj1.additionalIdColumns = usedAdditionalIdColumns;
      }

      let config1 = JSON.stringify(obj1);
      REClient_.client_().setBatchPredictionDatabaseConnectorOutput(batchPredId, usedId, config1, (errL, resL) => {
        if (errL || !resL?.success) {
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    } else if (outputType === OutputTypeEnum.Storage) {
      if (Utils.isNullOrEmpty(this.state.editLocation)) {
        doWork();
        return;
      }
      REClient_.client_().setBatchPredictionFileConnectorOutput(batchPredId, undefined, this.state.editLocation, (errL, resL) => {
        if (errL || !resL?.success) {
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    } else {
      REClient_.client_().setBatchPredictionOutputToConsole(batchPredId, (errL, resL) => {
        if (errL || !resL?.success) {
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    }
  };

  onDeleteRefreshSchedule = () => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');

    StoreActions.deployList_(projectId);
    StoreActions.batchList_(projectId);
    StoreActions.batchListVersions_(batchPredId);
    StoreActions.batchDescribeById_(batchPredId);
  };

  onPlayRefreshSchedule = () => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');

    StoreActions.deployList_(projectId);
    StoreActions.batchList_(projectId);
    StoreActions.batchListVersions_(batchPredId);
    StoreActions.batchDescribeById_(batchPredId);
  };

  memBatchVersionsList = memoizeOneCurry((doCall, batchPredParam, batchPredId) => {
    return batchPred.memBatchListVersions(undefined, batchPredId, doCall);
  });

  onClickStartBatchPred = (e) => {
    let { models, paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');

    if (projectId && batchPredId) {
      REClient_.client_().startBatchPrediction(batchPredId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.deployList_(projectId);
          StoreActions.batchList_(projectId);
          StoreActions.batchListVersions_(batchPredId);
          StoreActions.batchDescribeById_(batchPredId);
        }
      });
    }
  };

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId) => {
    if (deployments && projectId) {
      if (deployments.get('isRefreshing') !== 0) {
        return;
      }

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

  memDatabaseConnectorOptions = memoizeOneCurry((doCall, databaseConnectorOptionsParam) => {
    return databaseConnectorOptions.memDatabaseConnectorOptions(doCall, databaseConnectorOptionsParam);
  });

  onClickTablename = (tablename, e) => {
    let projectId = this.props.paramsProp?.get('projectId');
    REClient_.client_().describeFeatureGroupByTableName(tablename, null, (err, res) => {
      let featureGroupId = res?.result?.featureGroupId;
      if (err || !res?.success || featureGroupId == null) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let pp = res?.result?.projects?.map((p1) => p1?.projectId);
        let p1 = '-';
        if (pp != null) {
          if (pp.includes(projectId)) {
            p1 = '' + projectId;
          } else if (pp.length === 1) {
            p1 = pp[0];
          }
        }
        Location.push('/' + PartsLink.feature_group_detail + '/' + p1 + '/' + featureGroupId, undefined, undefined, true);
      }
    });
  };

  memBatchPredList = memoizeOneCurry((doCall, batchPredParam, projectId) => {
    return batchPred.memBatchList(undefined, projectId, null, doCall);
  });

  memBatchOptions = memoizeOne((batchList) => {
    return batchList?.map((b1) => ({ label: b1.name, value: b1.batchPredictionId }));
  });

  memUseCaseInfo = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  onChangeSelectURLDirectBatchPred = (option1) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');

    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/' + option1?.value);
  };

  onClickStarred = (batchPredictionId, starred, e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (!projectId) {
      return;
    }
    REClient_.client_()._starBatchPrediction(batchPredictionId, starred, (err, res) => {
      StoreActions.batchDescribeById_(batchPredictionId);
      StoreActions.batchList_(projectId);
      StoreActions.deployList_(projectId);
    });
  };

  onClickRenameBatchPred = (batchPredictionId, batchPredictionName) => {
    let editNameValue = batchPredictionName;

    if (this.confirmUsedRename != null) {
      this.confirmUsedRename.destroy();
      this.confirmUsedRename = null;
    }

    this.confirmUsedRename = confirm({
      title: 'Rename Batch Prediction',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + batchPredictionName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={batchPredictionName}
            defaultValue={batchPredictionName}
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

        if (editNameValue != batchPredictionName) {
          REActions.addNotification('Renaming Batch Prediction to "' + editNameValue + '"');

          let projectId = this.props.paramsProp.get('projectId');
          REClient_.client_().updateBatchPrediction(batchPredictionId, null, null, null, null, null, null, null, null, null, null, editNameValue, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Batch Prediction Renamed!');

              StoreActions.deployList_(projectId);
              StoreActions.batchList_(projectId);
              StoreActions.batchListVersions_(batchPredictionId);
              StoreActions.batchDescribeById_(batchPredictionId);
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

  onChangeOverridesUsedFG = (values) => {
    this.setState({
      overridesUsedFG: values,
    });
  };

  render() {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let batchPredOne = this.memBatchOne(false)(this.props.batchPred, batchPredId);
    let modelMonitorId = batchPredOne?.modelMonitorId;
    let batchVersionsList = this.memBatchVersionsList(false)(this.props.batchPred, batchPredId);

    let dataList = [];
    let isEdit = this.state.isEdit;
    let isEditOutputs = this.state.isEditOutputs;

    let outputType = this.state.outputType;
    let metadataColumn = this.state.metadataColumn;

    let isForEval = batchPredOne?.globalPredictionArgs?.['forEval'] === true;
    let filesOutputLocationPrefix = batchPredOne?.globalPredictionArgs?.['filesOutputLocationPrefix'];

    if (Utils.isNullOrEmpty(metadataColumn)) {
      metadataColumn = batchPredOne?.outputIncludesMetadata || false;
    }

    if (Utils.isNullOrEmpty(outputType)) {
      if (batchPredOne) {
        let f1 = batchPredOne?.connectorType?.toUpperCase();
        if (f1 === 'FILE_CONNECTOR') {
          outputType = OutputTypeEnum.Storage;
        } else if (f1 === 'DATABASE_CONNECTOR') {
          outputType = OutputTypeEnum.Connector;
        } else if (f1 === 'FEATURE_GROUP') {
          outputType = OutputTypeEnum.FeatureGroup;
        }
      }

      if (outputType == null) {
        outputType = OutputTypeEnum.Console;
      }
    }

    if (batchPredOne) {
      let useCaseInfo = this.memUseCaseInfo(false)(this.props.useCases, foundProject1?.useCase);
      let explanations_supported = useCaseInfo?.explanations_supported === true;

      const onChangeOutputType = (e) => {
        this.setState({ outputType: e.target.value });
      };
      let output1 = (
        <span
          css={
            isEditOutputs
              ? ''
              : `
.ant-radio-checked .ant-radio-inner {
  border-color: rgba(255,255,255,0.3) !important ;
  background-color: rgba(255,255,255,0.1) !important;
}

.ant-radio-inner {
  border-color: rgba(255,255,255,0.3) !important ;
  background-color: rgba(255,255,255,0.1) !important;
}
      `
          }
        >
          <Radio.Group value={outputType} onChange={isEditOutputs ? onChangeOutputType : null}>
            <Radio value={OutputTypeEnum.Console}>
              <span
                css={`
                  color: white;
                `}
              >
                Console
              </span>
            </Radio>
            <Radio value={OutputTypeEnum.Storage}>
              <span
                css={`
                  color: white;
                `}
              >
                Storage
              </span>
            </Radio>
            <Radio value={OutputTypeEnum.Connector}>
              <span
                css={`
                  color: white;
                `}
              >
                Connector
              </span>
            </Radio>
            <Radio value={OutputTypeEnum.FeatureGroup}>
              <span
                css={`
                  color: white;
                `}
              >
                Feature Group
              </span>
            </Radio>
          </Radio.Group>
        </span>
      );

      const onChangeMetadataColumn = (e) => {
        this.setState({
          metadataColumn: e.target.value,
        });
      };
      if (filesOutputLocationPrefix) {
        output1 = <span> One file per row </span>;
      }

      let output2 = (
        <span
          css={
            isEditOutputs
              ? ''
              : `
.ant-radio-checked .ant-radio-inner {
  border-color: rgba(255,255,255,0.3) !important ;
  background-color: rgba(255,255,255,0.1) !important;
}

.ant-radio-inner {
  border-color: rgba(255,255,255,0.3) !important ;
  background-color: rgba(255,255,255,0.1) !important;
}
      `
          }
        >
          <Radio.Group value={metadataColumn} onChange={isEditOutputs ? onChangeMetadataColumn : null}>
            <Radio value={true}>
              <span
                css={`
                  color: white;
                `}
              >
                YES
              </span>
            </Radio>
            <Radio value={false}>
              <span
                css={`
                  color: white;
                `}
              >
                NO
              </span>
            </Radio>
          </Radio.Group>
        </span>
      );
      let batchPredictionVersion = batchPredOne?.latestBatchPredictionVersion?.batchPredictionVersion;

      let deployListAll = this.memDeploymentList(false)(this.props.deployments, projectId);
      let deployList = deployListAll?.map((d1) => ({ label: d1?.name, value: d1?.deploymentId }));

      let overridesUsedDatasets: any = {};
      let overridesUsedFG: any = {};
      batchPredOne?.batchInputs?.featureGroups?.some((fg1, fg1ind) => {
        if (fg1.default !== true) {
          overridesUsedFG[fg1.datasetType] = fg1.featureGroupId;
          overridesUsedDatasets[fg1.datasetType] = batchPredOne?.batchInputs?.featureGroupDatasetIds?.[fg1ind];
        }
      });
      let modelTrainingType = batchPredOne?.globalPredictionArgs?.modelTrainingType;
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

      dataList = [
        {
          id: 111,
          name: 'Batch Prediction ID: ',
          helpId: 'batchDetail_batchId',
          value: <CopyText>{batchPredOne.batchPredictionId}</CopyText>,
          noPadding: true,
        },
        {
          id: 3000,
          name: 'Deployment Name:',
          helpId: 'batchDetail_deployName',
          value: <span css={``}>{deployList?.find((d1) => d1.value === batchPredOne.deploymentId)?.label}</span>,
          noPadding: true,
        },
        {
          id: 3000,
          name: 'Monitor ID:',
          helpId: 'batchDetail_modelMonitorId',
          value: (
            <Link noAutoParams to={'/' + PartsLink.model_detail_monitor + '/' + batchPredOne?.modelMonitorId + (projectId ? '/' + projectId : '')} showAsLinkBlue>
              <CopyText>{batchPredOne.modelMonitorId}</CopyText>
            </Link>
          ),
          noPadding: true,
          hidden: Utils.isNullOrEmpty(batchPredOne.modelMonitorId),
        },
        {
          id: 300,
          name: 'Legacy Batch Input File:',
          helpId: 'batchDetail_legacyInput',
          value: <span css={``}>{batchPredOne?.legacyInputLocation ?? '-'}</span>,
        },
        {
          id: 500000,
          mainTitle: 'Inputs:',
          value: (
            <span
              css={`
                margin-left: 5px;
                font-size: 15px;
                cursor: pointer;
              `}
              onClick={this.onClickEditTOptions.bind(this, batchPredOne, false)}
            >
              <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 15, x: 0, y: 0 }} style={{ cursor: 'pointer', marginRight: '4px' }} />
            </span>
          ),
          // Edit only supported for input FG/dataset
          // A single edit button, which show the same UI as creating the batch prediction would be ideal.
        },
        {
          id: 3,
          name: 'Deployment Id:',
          helpId: 'batchDetail_deployId',
          value: (
            <span css={``}>
              {batchPredOne?.deploymentDeleted ? (
                <span>
                  <CopyText>{batchPredOne.deploymentId}</CopyText>&nbsp;(Deleted)
                </span>
              ) : (
                <Link noAutoParams to={'/' + PartsLink.deploy_detail + '/' + projectId + '/' + batchPredOne.deploymentId} usePointer className={globalStyles.styleTextBlueBrightColor}>
                  <CopyText>{batchPredOne.deploymentId}</CopyText>
                </Link>
              )}
            </span>
          ), // edit option for deployement is disabled.
        },
        {
          id: 30003,
          name: 'Algorithm:',
          helpId: 'deploydetail_algo',
          value: <span css={``}>{batchPredOne?.algorithm}</span>,
          hidden: batchPredOne?.algorithm == null,
        },
        {
          id: 30004,
          name: 'Model Version:',
          value: (
            <span css={``}>
              <CopyText>{batchPredOne?.modelVersion}</CopyText>
            </span>
          ),
          hidden: batchPredOne?.modelVersion == null,
        },
        {
          id: 30005,
          name: 'Trained Model Type:',
          value: <span css={``}>{modelTrainingType}</span>,
          hidden: modelTrainingType == null,
          helpId: 'deploy_batch_pred_model_training_type',
        },
        {
          id: 4,
          name: 'Predict For Evaluation:',
          value: isForEval === true ? 'True' : 'False',
          hidden: useCaseInfo?.for_eval_supported !== true,
          helpId: 'deploy_batch_predict_for_evaluation',
        },
        {
          id: 20000,
          name: 'Prediction Input:',
          helpId: 'batchDetail_input',
          value: (
            <div
              css={`
                max-width: ${isEdit ? '550px' : ''};
                font-size: 14px;
                margin-bottom: 15px;
              `}
            >
              <BatchConfigFeatureGroups projectId={projectId} batchPredId={batchPredId} deploymentId={batchPredOne?.deploymentId} readonly={!isEdit} value={overridesUsedFG} onChange={this.onChangeOverridesUsedFG} />
            </div>
          ),
          hidden: isForEval,
        },

        {
          id: 99111,
          name: '',
          value: (
            <span className={styles.editButtonsContainer}>
              <Button className={styles.editButton} onClick={this.onClickEditCancel} type="default" ghost>
                Cancel
              </Button>
              <Button className={styles.editButton} onClick={this.onClickEditSave.bind(this, batchPredOne)} type="primary">
                Save
              </Button>
            </span>
          ),
          marginVert: 20,
          hidden: !isEdit,
          noPadding: true,
        },
        {
          id: 555552,
          name: <span>Metadata Columns in Output:</span>,
          value: output2,
          helpId: 'deploy_batch_api_metadata_column',
        },
        {
          id: 500001,
          mainTitle: 'Outputs:',
          value: (
            <span
              css={`
                margin-left: 5px;
                font-size: 15px;
                cursor: pointer;
              `}
              onClick={this.onClickEditTOptions.bind(this, batchPredOne, true)}
            >
              <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 15, x: 0, y: 0 }} style={{ cursor: 'pointer', marginRight: '4px' }} />
            </span>
          ),
        },
        {
          id: 8,
          name: 'Type:',
          helpId: 'batchDetail_output',
          value: <span css={``}>{output1}</span>,
        },
        {
          id: 5,
          name: 'Output Format:',
          helpId: 'batchDetail_outputFormat',
          value: (
            <span css={``}>
              {filesOutputLocationPrefix && 'JSON'}
              {!filesOutputLocationPrefix && isEditOutputs && (
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
                    value={{ label: this.state.editFileOutputFormat ?? batchPredOne?.fileOutputFormat, value: this.state.editFileOutputFormat ?? batchPredOne?.fileOutputFormat }}
                    options={[
                      { label: 'CSV', value: 'CSV' },
                      { label: 'JSON', value: 'JSON' },
                    ]}
                  />
                </span>
              )}
              {!filesOutputLocationPrefix && !isEditOutputs && (batchPredOne?.fileOutputFormat ?? '-')}
            </span>
          ),
          hidden: ['FEATURE_GROUP', 'FEATUREGROUP'].includes(this.state.outputType?.toUpperCase() ?? batchPredOne?.connectorType?.toUpperCase()),
        },
        {
          id: 76,
          name: 'Output location prefix',
          helpId: 'batchDetail_per_file_output_prefix',
          value: <span css={``}>{filesOutputLocationPrefix}</span>,
          hidden: !filesOutputLocationPrefix,
        },

        {
          id: 99,
          name: '',
          value: (
            <span className={styles.editButtonsContainer}>
              <Button className={styles.editButton} onClick={this.onClickEditCancel} type="default" ghost>
                Cancel
              </Button>
              <Button className={styles.editButton} onClick={this.onClickEditSave.bind(this, batchPredOne)} type="primary">
                Save
              </Button>
            </span>
          ),
          marginVert: 20,
          hidden: !isEditOutputs,
          noPadding: true,
        },

        {
          id: 500002,
          mainTitle: 'Advanced Options:',
          value: (
            <span>
              {!isEdit && !isEditOutputs && (
                <TooltipExt title={'Edit'}>
                  <Link to={['/' + PartsLink.deploy_batch + '/' + (projectId ?? '-') + '/' + batchPredOne.deploymentId, 'editBatchPredId=' + encodeURIComponent(batchPredId)]}>
                    <FontAwesomeIcon
                      css={`
                        margin-left: 7px;
                        opacity: 0.7;
                        &:hover {
                          opacity: 1;
                        }
                        cursor: pointer;
                      `}
                      icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit}
                      transform={{ size: 15, x: 0, y: 0 }}
                      style={{ color: 'white', cursor: 'pointer' }}
                    />
                  </Link>
                </TooltipExt>
              )}
            </span>
          ),
        },
        {
          id: 6,
          name: 'Explanations:',
          helpId: 'batchDetail_expl',
          value: (
            <span css={``}>
              {false && isEdit && (
                <Checkbox
                  checked={this.state.editExplanation ?? !!batchPredOne?.explanations}
                  onChange={(e) => {
                    this.setState({ editExplanation: e.target.checked });
                  }}
                />
              )}
              {<Checkbox checked={!!batchPredOne?.explanations} />}
            </span>
          ),
          hidden: !explanations_supported,
        },
        {
          id: 66661,
          name: 'Restrict Input Column Results:',
          helpId: 'batchDetail_resultInputColumns',
          value: (
            <span>
              {batchPredOne?.resultInputColumns?.map((s1, s1ind) => (
                <span>
                  {s1ind > 0 ? (
                    <span
                      css={`
                        opacity: 0.7;
                      `}
                    >
                      ,{' '}
                    </span>
                  ) : null}
                  {s1}
                </span>
              ))}
            </span>
          ),
          hidden: batchPredOne?.resultInputColumns == null || batchPredOne?.resultInputColumns?.length === 0,
        },
      ].filter((v1) => !v1.hidden);

      const isLegacy = !Utils.isNullOrEmpty(batchPredOne?.legacyInputLocation);
      if (!isLegacy) {
        dataList = dataList.filter((v1) => v1.id !== 300);
      }

      let globalPredictionArgsInputs = batchPredOne?.globalPredictionArgsInputs;
      let globalPredictionArgs = batchPredOne?.globalPredictionArgs;

      const kk = Object.keys(globalPredictionArgsInputs ?? {}).sort((a, b) => {
        return (globalPredictionArgsInputs?.[a]?.name?.toLowerCase() || '').localeCompare(globalPredictionArgsInputs?.[b]?.name?.toLowerCase() || '');
      });
      let elem1 = (
        <span
          css={`
            font-size: 15px;
          `}
        >
          {kk
            .filter((k1) => !Utils.isNullOrEmpty(globalPredictionArgs?.[k1]))
            .map((k1, k1ind) => (
              <span
                css={`
                  opacity: 0.8;
                `}
                key={'aa_' + k1ind}
              >
                {k1ind > 0 ? <span>, </span> : null}
                <span
                  css={`
                    opacity: 0.8;
                  `}
                >
                  {globalPredictionArgsInputs?.[k1]?.name + ':'}
                </span>
                <span
                  css={`
                    margin-left: 4px;
                  `}
                >
                  {'' + globalPredictionArgs?.[k1]}
                </span>
              </span>
            ))}
        </span>
      );

      if (this.state.hasAdvancedOptions === true) {
        const obj1 = {
          id: 70000,
          name: 'Pred Arguments:',
          value: <span>{elem1}</span>,
        };
        dataList.splice(dataList.findIndex((d1) => d1.id === 500002) + 1, 0, obj1);
      }

      if (outputType !== OutputTypeEnum.Console) {
        let ind1 = dataList.findIndex((v1) => v1.id === 8);
        if (ind1 > -1) {
          ind1++;

          if (outputType === OutputTypeEnum.FeatureGroup) {
            let obj1 = {
              id: 8000,
              name: 'Feature Group - Table Name:',
              helpId: 'batchDetail_location_fg',
              value: (
                <span
                  css={`
                    display: inline-block;
                    ${isEditOutputs ? 'width: 200px;' : ''}
                  `}
                >
                  {isEditOutputs && (
                    <Input
                      value={this.state.editFGTablename ?? batchPredOne?.featureGroupTableName ?? ''}
                      onChange={(e) => {
                        this.setState({ editFGTablename: e.target.value });
                      }}
                    />
                  )}
                  {!isEditOutputs && (
                    <span>
                      <span
                        className={globalStyles.styleTextBlueBrightColor}
                        css={`
                          cursor: pointer;
                        `}
                        onClick={this.onClickTablename.bind(this, batchPredOne?.featureGroupTableName)}
                      >
                        {batchPredOne?.featureGroupTableName}
                      </span>
                    </span>
                  )}
                </span>
              ),
            };

            dataList.splice(ind1, 0, obj1);
          } else if (outputType === OutputTypeEnum.Storage) {
            let obj1 = {
              id: 777,
              name: 'Location:',
              helpId: 'batchDetail_location',
              value: (
                <span
                  css={`
                    display: inline-block;
                    ${isEditOutputs ? 'width: 300px;' : ''}
                  `}
                >
                  {isEditOutputs && (
                    <Input
                      value={this.state.editLocation ?? batchPredOne?.fileConnectorOutputLocation ?? ''}
                      onChange={(e) => {
                        this.setState({ editLocation: e.target.value });
                      }}
                    />
                  )}
                  {!isEditOutputs && <span>{batchPredOne?.fileConnectorOutputLocation}</span>}
                </span>
              ),
            };

            dataList.splice(ind1, 0, obj1);
          } else if (outputType === OutputTypeEnum.Connector) {
            const onChangeState = (stateNew) => {
              if (stateNew != null && !_.isEmpty(stateNew)) {
                this.setState(stateNew);
              }
            };

            let obj1 = {
              id: 500000,
              value: <ConnectorEditInline showTooltips key={'ccc' + this.state.editConnectorUuid} onChangeState={onChangeState} isEdit={isEditOutputs} />,
              onlyValue: true,
            };
            dataList.splice(ind1, 0, obj1);
          }
        }
      }

      let refreshSchedules = batchPredOne?.refreshSchedules;
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
                    batchPredictionIds={[this.props.paramsProp?.get('batchPredId')]}
                    onPlayNow={this.onPlayRefreshSchedule}
                    onDeleteDone={this.onDeleteRefreshSchedule}
                    refreshPolicyId={d1?.refresh_policy_id || d1?.refreshPolicyId}
                    cron={d1?.cron}
                    error={d1?.error}
                    nextRun={d1?.next_run_time || d1?.nextRunTime}
                    refreshType={d1?.refresh_type || d1?.refreshType}
                    isProd={d1?.is_prod || d1?.isProd}
                  />
                </div>
              );
            })}
            {this.props.paramsProp?.get('projectId') != null && this.props.paramsProp?.get('batchPredId') != null && (
              <div style={{ margin: '3px 0 3px 30px' }}>
                <CronOne isNew projectId={this.props.paramsProp?.get('projectId')} onPlayNow={this.onPlayRefreshSchedule} batchPredictionIds={[this.props.paramsProp?.get('batchPredId')]} />
              </div>
            )}
          </div>
        ),
        marginVert: 20,
        noPadding: true,
      });

      if (batchPredOne?.latestBatchPredictionVersion?.error) {
        dataList.push({
          id: 901,
          name: 'Latest Version Error:',
          value: <span className={globalStyles.styleTextRedColor}>{batchPredOne?.latestBatchPredictionVersion?.error}</span>,
        });
      }
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    const onClickGetResults = (version, e) => {
      REClient_.client_().getBatchPredictionResult(version, null);
    };

    const showModelMonitor = !Utils.isNullOrEmpty(batchPredOne?.modelMonitorId);
    const hideModelMonitor = !showModelMonitor;

    const batchVersionsColumns: ITableExtColumn[] = (
      [
        {
          title: 'Batch Pred Version',
          field: 'batchPredictionVersion',
          helpId: 'batchPredVersions_batchversion',
          render: (text, row, index) => {
            return (
              <span>
                <CopyText>{text}</CopyText>
              </span>
            );
          },
        },
        {
          title: 'Model Version',
          field: 'modelVersion',
          helpId: 'batchPredVersions_version',
          render: (text, row, index) => {
            return (
              <span>
                <CopyText>{text}</CopyText>
              </span>
            );
          },
        },
        {
          title: 'Algorithm',
          field: 'algoName',
          render: (text, row, index) => {
            return (
              <span>
                <CopyText>{text}</CopyText>
              </span>
            );
          },
        },
        {
          title: 'Monitor Version',
          field: 'modelMonitorVersion',
          helpId: 'batchPredVersions__modelMonitorVersion',
          render: (text, row, index) => {
            return <CopyText>{text}</CopyText>;
          },
          hidden: hideModelMonitor,
        },
        {
          title: 'Prediction Started',
          field: 'predictionsStartedAt',
          helpId: 'batchPredVersions_predictionsStartedAt',
          render: (text, row, index) => {
            return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
          },
        },
        {
          title: 'Prediction Completed',
          field: 'predictionsCompletedAt',
          helpId: 'batchPredVersions_predictionsCompletedAt',
          render: (text, row, index) => {
            return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
          },
        },
        {
          title: 'Prediction Status',
          field: 'status',
          helpId: 'batchPredVersions_status',
          render: (text, row, index) => {
            let isTraining = false;
            if ([BatchPredLifecycle.PREDICTING, BatchPredLifecycle.UPLOADING, BatchPredLifecycle.PENDING].includes(row.status || '')) {
              isTraining = true;
              StoreActions.refreshDoBatchVersionsAll_(batchPredId, row.batchPredictionVersion, this.props.paramsProp?.get('projectId'));
            }

            if (isTraining) {
              return (
                <span>
                  <div style={{ whiteSpace: 'nowrap' }}>{BatchPredLifecycleDesc[row.status ?? '']}...</div>
                  <div style={{ marginTop: '5px' }}>
                    <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                  </div>
                </span>
              );
            } else {
              let res = <span style={{ whiteSpace: 'nowrap' }}>{BatchPredLifecycleDesc[text ?? '-']}</span>;
              if ([BatchPredLifecycle.FAILED].includes(row.status || '')) {
                res = <span className={globalStyles.red}>{res}</span>;
              }
              return res;
            }
          },

          useSecondRowArrow: true,
          renderSecondRow: (text, row, index) => {
            let res = null;
            if ((text || '').toLowerCase() === 'failed') {
              if (row.error) {
                let m1 = row.error;
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
                    {Constants.flags.show_log_links && (
                      <>
                        <Link newWindow to={'/api/v0/_getPipelineStageLogHtml?resourceId=' + encodeURIComponent(row.batchPredictionVersion ?? '')} noApp>
                          <Button customType="internal" className={styles.versionAnalysisButton}>
                            Internal: View Logs
                          </Button>
                        </Link>
                        <Link newWindow to={'/api/v0/_getPipelineStageLog?resourceId=' + encodeURIComponent(row.batchPredictionVersion ?? '')} noApp>
                          <Button customType="internal" className={styles.versionAnalysisButton}>
                            Internal: Download Logs
                          </Button>
                        </Link>
                      </>
                    )}
                  </span>
                );
              }
            }
            return res;
          },
        },
        {
          title: 'Total Pred.',
          field: 'totalPredictions',
          helpId: 'batchPredVersions_totalPredictions',
          render: (text, row, index) => {
            return text ?? '-';
          },

          useSecondRowArrow: true,
          renderSecondRow: (text, row, index) => {
            let errorElem = null;
            if ([BatchPredLifecycle.FAILED].includes(row.status || '')) {
              if (row.lifecycleMsg) {
                errorElem = (
                  <div>
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
                  </div>
                );
              }
            }

            let statusDone = [BatchPredLifecycle.COMPLETE].includes(row.status);

            let fileTooBig = row.totalPredictions != null && row.totalPredictions > 100 * 1000;
            let showResults = row.hasDownloadableResult && !fileTooBig;

            let warningElem = null;
            if (!Utils.isNullOrEmpty(row.monitorWarnings)) {
              warningElem = (
                <div
                  css={`
                    white-space: normal;
                    padding: 0 10px 10px 10px;
                    color: yellow;
                  `}
                >
                  Warning: {row.monitorWarnings}
                </div>
              );
            }

            let list = [
              warningElem,
              errorElem,
              fileTooBig && (
                <div
                  css={`
                    color: indianred;
                    padding: 0 10px 10px 10px;
                  `}
                >
                  To download large Batch prediction results, use the Python API
                </div>
              ),

              showResults && (
                <Button className={styles.versionAnalysisButton} type="default" ghost onClick={onClickGetResults.bind(null, row.batchPredictionVersion)}>
                  Get Results
                </Button>
              ),
              row.batchPredictionVersion && statusDone && (
                <Link
                  to={[
                    '/' + PartsLink.batchpred_rawdata + '/' + projectId + '/' + batchPredId,
                    'useDeployId=' + encodeURIComponent(row.deploymentId) + '&useModelId=' + encodeURIComponent(row.modelId) + '&batchPredVersion=' + encodeURIComponent(row.batchPredictionVersion),
                  ]}
                >
                  <Button className={styles.versionAnalysisButton} ghost type="default">
                    Raw Data
                  </Button>
                </Link>
              ),
              row.databaseOutputError && (
                <ModalConfirm
                  width={900}
                  title={
                    <Provider store={Utils.globalStore()}>
                      <div className={'useDark'}>
                        <ViewFile
                          batchPredictionVersion={row?.batchPredictionVersion}
                          fileTitle={row?.databaseOutputTotalWrites ? (row?.databaseOutputFailedWrites || 'Some') + ' out of ' + row?.databaseOutputTotalWrites + ' writes failed' : 'Write Failures'}
                        />
                      </div>
                    </Provider>
                  }
                  okText={'Close'}
                  cancelText={null}
                  okType={'primary'}
                >
                  <Button className={styles.versionAnalysisButton} type="default" danger ghost>
                    Get Database Write Errors
                  </Button>
                </ModalConfirm>
              ),

              row?.modelMonitorVersion && statusDone && (
                <Link noAutoParams to={[`/${PartsLink.monitor_drift}/${modelMonitorId}/${projectId}`, `useModelMonitorVersion=${encodeURIComponent(row?.modelMonitorVersion)}`]}>
                  <Button ghost className={styles.versionAnalysisButton} type="default">
                    Drift
                  </Button>
                </Link>
              ),
              row?.modelMonitorVersion && statusDone && (
                <Link noAutoParams to={[`/${PartsLink.monitor_data_integrity}/${modelMonitorId}/${projectId}`, `useModelMonitorVersion=${encodeURIComponent(row?.modelMonitorVersion)}`]}>
                  <Button className={styles.versionAnalysisButton} ghost type="default">
                    Data Integrity
                  </Button>
                </Link>
              ),
              row?.modelMonitorVersion && statusDone && (
                <Link noAutoParams to={[`/${PartsLink.monitor_drift_analysis}/${modelMonitorId}/${projectId}`, `useModelMonitorVersion=${encodeURIComponent(row?.modelMonitorVersion)}`]}>
                  <Button ghost className={styles.versionAnalysisButton} type="default">
                    Drift Analysis
                  </Button>
                </Link>
              ),
              row?.modelMonitorVersion && statusDone && (
                <Link noAutoParams to={[`/${PartsLink.monitor_outliers}/${modelMonitorId}/${projectId}`, `useModelMonitorVersion=${encodeURIComponent(row?.modelMonitorVersion)}`]}>
                  <Button className={styles.versionAnalysisButton} ghost type="default">
                    Outliers
                  </Button>
                </Link>
              ),
              Constants.flags.show_log_links && (
                <>
                  <Link newWindow to={'/api/v0/_getPipelineStageLogHtml?resourceId=' + encodeURIComponent(row.batchPredictionVersion ?? '')} noApp>
                    <Button customType="internal" className={styles.versionAnalysisButton}>
                      Internal: View Logs
                    </Button>
                  </Link>
                  <Link newWindow to={'/api/v0/_getPipelineStageLog?resourceId=' + encodeURIComponent(row.batchPredictionVersion ?? '')} noApp>
                    <Button customType="internal" className={styles.versionAnalysisButton}>
                      Internal: Download Logs
                    </Button>
                  </Link>
                </>
              ),
            ].filter((v1) => v1 != null && v1 !== false);

            if (list?.length > 0) {
              return (
                <div>
                  {list?.map((e1, e1ind) => (
                    <span key={'e' + e1ind}>{e1}</span>
                  ))}
                </div>
              );
            } else {
              return null;
            }
          },
        },
      ] as ITableExtColumn[]
    ).filter((c1) => !c1.hidden);

    let batchList = this.memBatchPredList(false)(this.props.batchPred, projectId);
    let optionsBatchPred = this.memBatchOptions(batchList);
    let optionsBatchPredSel = optionsBatchPred?.find((b1) => b1.value === batchPredId);
    if (optionsBatchPredSel == null && batchPredOne != null) {
      optionsBatchPredSel = { label: batchPredOne?.name, value: null };
    }

    const driftAnalysisActions = [
      {
        name: 'Drift',
        link: `/${PartsLink.monitor_drift}/${modelMonitorId}/${projectId}`,
      },
      {
        name: 'Data Integrity',
        link: `/${PartsLink.monitor_data_integrity}/${modelMonitorId}/${projectId}`,
      },
      {
        name: 'Drift Analysis',
        link: `/${PartsLink.monitor_drift_analysis}/${modelMonitorId}/${projectId}`,
      },
      {
        name: 'Outliers',
        link: `/${PartsLink.monitor_outliers}/${modelMonitorId}/${projectId}`,
      },
    ];

    return (
      <div className={globalStyles.absolute + ' ' + globalStyles.table} style={{ margin: '25px' }}>
        <NanoScroller onlyVertical>
          <div className={globalStyles.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
            {
              <div style={{ float: 'right', marginRight: '20px' }}>
                <ModalConfirm
                  onConfirm={this.onClickDeleteBatchPred}
                  title={`Do you want to remove the batch prediction job?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Delete'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  <Button danger ghost className={styles.deleteButton}>
                    Delete
                  </Button>
                </ModalConfirm>
              </div>
            }

            <span>
              Batch Prediction Detail
              <HelpIcon id={'batchdetail_title'} style={{ marginLeft: '4px' }} />
            </span>
            <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', display: 'inline-block', fontSize: '12px' }}>
              <SelectExt isDisabled={batchPredOne == null} value={optionsBatchPredSel} options={optionsBatchPred} onChange={this.onChangeSelectURLDirectBatchPred} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
            </span>
          </div>

          <div style={{ display: 'flex' }} className={globalStyles.backdetail}>
            <div style={{ marginRight: '24px' }}>
              <img src={calcImgSrc('/imgs/batchIcon.png')} alt={''} style={{ width: '80px' }} />
            </div>
            <div style={{ flex: 1, fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
              <div style={{ marginBottom: '10px' }}>
                <span
                  css={`
                    margin-right: 7px;
                  `}
                >
                  <StarredSpan isStarred={batchPredOne?.starred} onClick={this.onClickStarred.bind(this, batchPredOne?.batchPredictionId)} size={19} y={-2} name={'Batch Prediction'} />
                </span>
                <DetailHeader>{batchPredOne?.name}</DetailHeader>
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
                      onClick={this.onClickRenameBatchPred.bind(this, batchPredOne?.batchPredictionId, batchPredOne?.name || '')}
                    >
                      <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 20, x: 0, y: -3 }} style={{ color: '#d1e4f5', marginRight: '8px' }} />
                    </span>
                  </TooltipExt>
                }
              </div>
              {dataList.map((d1) => (
                <div key={'val_' + d1.id + d1.name} style={{ margin: ((d1.mainTitle ? 22 : null) ?? d1.marginVert ?? 5) + `px 0 ${d1.marginVert ?? 5}px ${d1.mainTitle || d1.noPadding ? 0 : 22}px` }}>
                  {d1.mainTitle && (
                    <span
                      css={`
                        display: flex;
                        align-items: center;
                      `}
                    >
                      <DetailName>{d1.mainTitle}</DetailName>
                      {d1.value}
                    </span>
                  )}
                  {!d1.mainTitle && d1.onlyValue && <span>{d1.value}</span>}
                  {!d1.mainTitle && !d1.onlyValue && (
                    <span>
                      <DetailName>
                        {d1.name}
                        <HelpIcon id={d1.helpId} style={{ marginLeft: '4px' }} />
                      </DetailName>
                      <DetailValue style={{ color: d1.valueColor ?? '#ffffff' }}>{d1.value}</DetailValue>
                    </span>
                  )}
                </div>
              ))}

              {modelMonitorId != null && projectId != null && (
                <>
                  <div className={styles.driftAnalysisTitle}>Drift Analysis</div>
                  <div className={styles.driftAnalysisContainer}>
                    {driftAnalysisActions.map((action, i) => {
                      return (
                        <React.Fragment key={i}>
                          {i ? <span className={styles.separator}>-</span> : null}
                          <span>
                            <Link noAutoParams to={action.link}>
                              <span className={classNames(globalStyles.styleTextBlueBright, styles.driftAnalysisItem)}>{action.name}</span>
                            </Link>
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '10px' }}>
              {batchPredOne?.createdAt != null && (
                <div>
                  <DetailCreatedAt>Created At: {<DateOld always date={batchPredOne?.createdAt} />}</DetailCreatedAt>
                </div>
              )}
            </div>
          </div>

          {!isEdit && !isEditOutputs && !batchPredOne?.deploymentDeleted && (
            <ModalConfirm
              onConfirm={this.onClickStartBatchPred}
              title={`Do you want to start a new batch prediction?`}
              icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
              okText={'Start'}
              cancelText={'Cancel'}
              okType={'primary'}
            >
              <Button className={styles.startBPButton} type="primary">
                Start Batch Prediction
              </Button>
            </ModalConfirm>
          )}

          {!isEdit && !isEditOutputs && batchPredOne?.deploymentDeleted && (
            <Button className={styles.startBPButton} type="primary" onClick={() => REActions.addNotification('Deployment has been deleted; please select a new deployment')}>
              Start Batch Prediction
            </Button>
          )}

          <div style={{ margin: '30px 0' }}>
            <div className={globalStyles.titleTopHeaderAfter} style={{ marginBottom: '14px' }}>
              Batch Prediction Versions
              <HelpIcon id={'BatchPredDetail_batchpredversions_title'} style={{ marginLeft: '4px' }} />
            </div>
            <TableExt
              noHover
              isDetailTheme
              showEmptyIcon
              defaultSort={{ field: 'predictionsStartedAt', isAsc: false }}
              dataSource={batchVersionsList}
              separator1
              columns={batchVersionsColumns}
              calcKey={(row) => row.batchPredictionVersion}
            />
          </div>
          <div style={{ height: 100 }} />
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
    batchPred: state.batchPred,
    databaseConnectors: state.databaseConnectors,
    databaseConnectorOptions: state.databaseConnectorOptions,
    databaseConnectorObjects: state.databaseConnectorObjects,
    databaseConnectorObjectSchema: state.databaseConnectorObjectSchema,
    useCases: state.useCases,
  }),
  null,
)(BatchPredDetail);
