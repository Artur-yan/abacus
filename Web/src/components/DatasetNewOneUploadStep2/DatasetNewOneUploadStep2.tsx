import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Checkbox from 'antd/lib/checkbox';
import Collapse from 'antd/lib/collapse';
import Form, { FormInstance } from 'antd/lib/form';
import { default as Input, default as InputNumber } from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import Radio from 'antd/lib/radio';
import Select from 'antd/lib/select';
import Switch from 'antd/lib/switch';
import TimePicker from 'antd/lib/time-picker';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcStaticUrl } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { calcDocStoreDefFromProject } from '../../api/DocStoreInterfaces';
import REClient_ from '../../api/REClient';
import REUploads_ from '../../api/REUploads';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import batchPred from '../../stores/reducers/batchPred';
import databaseConnectorObjectSchema from '../../stores/reducers/databaseConnectorObjectSchema';
import databaseConnectorObjects from '../../stores/reducers/databaseConnectorObjects';
import databaseConnectorOptions from '../../stores/reducers/databaseConnectorOptions';
import databaseConnectors from '../../stores/reducers/databaseConnectors';
import fileConnectorOptions from '../../stores/reducers/fileConnectorOptions';
import fileConnectors from '../../stores/reducers/fileConnectors';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import Connectors, { FileServicesList } from '../Connectors/Connectors';
import { ProjectDatasetType } from '../DatasetForUseCase/ProjectDatasetType';
import EditorElem from '../EditorElem/EditorElem';
import FormExt from '../FormExt/FormExt';
import FormItemFileUpload from '../FormItemFileUpload/FormItemFileUpload';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import InputCloud from '../InputCloud/InputCloud';
import InputCron from '../InputCron/InputCron';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import PreviewDataRows from '../PreviewDataRows/PreviewDataRows';
import RefreshAndProgress, { IRefreshAndProgressProgress } from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./DatasetNewOneUploadStep2.module.css');
const sd = require('../antdUseDark.module.css');
const { Option } = Select;
const { confirm } = Modal;
const { Panel } = Collapse;

const refreshPolicyEnabledDefault = false;

export enum EUploadDatasetType {
  FileUpload,
  S3,
  Streaming,
}

export enum EUploadDataIngestion {
  streaming_event_data,
  batch_files,
}

export enum EUploadCloudServiceType {
  GoogleCloud,
  AWS,
  Azure,
  SFTP,
}

interface IDatasetNewOneProps {
  paramsProp?: any;
  defDatasets?: any;
  projects?: any;
  useCases?: any;
  fileConnectors?: any;
  fileConnectorOptions?: any;
  databaseConnectors?: any;
  databaseConnectorOptions?: any;
  databaseConnectorObjects?: any;
  databaseConnectorObjectSchema?: any;
  batchPred?: any;
}

interface IDatasetNewOneState {
  isProcessing: boolean;
  useTypeSel?: EUploadDatasetType;
  streamingDataIngestion?: EUploadDataIngestion;
  useCloudServiceSel?: any | EUploadCloudServiceType;
  showRefreshPolicyS3Items?: boolean;
  fileList?: any;
  isPreview?: boolean;
  fileSel?: File;
  objectSel?: any;
  askModalType?: 'batch' | 'batch_only' | '';
  selectedColumns?: any;
  dbSqlQueryUse?: boolean;
  dbConnectorExampleText?: string;
  askIsPrefixes?: boolean;
  showIncremental?: boolean;
  isIncremental?: boolean;
  mergeFileSchemas?: boolean;
  extractBoundingBoxes?: boolean;

  dnConnectorRetryIsProcessing?: boolean;
}

class DatasetNewOneUploadStep2 extends React.PureComponent<IDatasetNewOneProps, IDatasetNewOneState> {
  private isM: any;
  formRef = React.createRef<FormInstance>();
  connectors: any;
  connectorsFile: any;
  connectorsDB: any;

  constructor(props) {
    super(props);

    this.state = {
      isProcessing: false,
      useTypeSel: EUploadDatasetType.FileUpload,
      useCloudServiceSel: null,
      showRefreshPolicyS3Items: refreshPolicyEnabledDefault,
      streamingDataIngestion: EUploadDataIngestion.streaming_event_data,
      fileList: [],
      askModalType: '',
      askIsPrefixes: true,
      mergeFileSchemas: null,
      extractBoundingBoxes: this.props.paramsProp?.get('docStoreExtractBoundingBoxes')?.toLowerCase() === 'true',
    };
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
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

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let useCase1 = this.props.paramsProp?.get('useCase');

    if (!useCase1) {
      useCase1 = this.memProjectUseCase(foundProject1);
    }

    let datasetType = this.props.paramsProp?.get('datasetType');
    if (datasetType) {
      let schemaInfo = this.memUseCaseSchemas(true)(this.props.useCases, useCase1);
    }

    let schemaInfoFull = this.memUseCaseInfo(true)(this.props.useCases, useCase1);
    const dbOptions = this.memDatabaseConnectorOptions(true)(this.props.databaseConnectorOptions);
    const verifiedDb = this.memDatabaseConnectors(true)(this.props.databaseConnectors);

    const isDbSelected =
      ![EUploadCloudServiceType.AWS, EUploadCloudServiceType.GoogleCloud, EUploadCloudServiceType.Azure, EUploadCloudServiceType.SFTP].includes(this.state.useCloudServiceSel) && this.state.useTypeSel === EUploadDatasetType.S3;
    const dbConnectorObjects = isDbSelected ? this.memDbObjects(true)(this.state.useCloudServiceSel, this.props.databaseConnectorObjects) : null;
    if (!databaseConnectorObjects.calcIsRefreshing() && this.state.dnConnectorRetryIsProcessing) {
      this.setState({
        dnConnectorRetryIsProcessing: false,
      });
    }

    const dbConnectorObjectSchema = isDbSelected && this.state.objectSel ? this.memDbObjectSchema(true)(this.state.useCloudServiceSel, this.state.objectSel?.value, this.props.databaseConnectorObjectSchema) : null;

    this.memExampleText(isDbSelected ? this.state.useCloudServiceSel : null);

    const batchPredId = this.props.paramsProp?.get('batchPredId');
    let batchPredOne = this.memBatchPred(true)(this.props.batchPred, batchPredId);

    let fileConnectorsList = this.memFileConnectors(true)(this.props.fileConnectors);
    let fileOptionsList = this.memFileConnectorOptions(true)(this.props.fileConnectorOptions);
    let usedConnectorsServices = this.memUsedFileConnectors(fileConnectorsList, fileOptionsList);

    this.memAutoSelectFirst(usedConnectorsServices, verifiedDb);
  };

  memAutoSelectFirst = memoizeOne((usedConnectorsServices, verifiedDb) => {
    if (this.state.useCloudServiceSel != null) {
      return;
    }

    if (usedConnectorsServices == null || verifiedDb == null) {
      return;
    }

    let s1 = null,
      more: any = {};
    if (usedConnectorsServices?.length === 1 && verifiedDb?.length === 0) {
      switch (usedConnectorsServices[0] as string) {
        case 'AWS':
          s1 = EUploadCloudServiceType.AWS;
          break;
        case 'GCS':
          s1 = EUploadCloudServiceType.GoogleCloud;
          break;
        case 'AZURE':
          s1 = EUploadCloudServiceType.Azure;
          break;
        case 'SFTP':
          s1 = EUploadCloudServiceType.SFTP;
          break;
      }
    } else if (verifiedDb?.length === 1 && usedConnectorsServices?.length === 0) {
      s1 = verifiedDb?.[0]?.databaseConnectorId;
    }

    if (s1 != null) {
      setTimeout(() => {
        this.setState(
          _.assign({}, more, {
            useCloudServiceSel: s1,
          }),
        );
      }, 0);
    }
  });

  memDatabaseConnectorOptions = memoizeOneCurry((doCall, databaseConnectorOptionsParam) => {
    return databaseConnectorOptions.memDatabaseConnectorOptions(doCall, databaseConnectorOptionsParam);
  });

  memDbObjects = memoizeOneCurry((doCall, databaseConnectorId, databaseConnectorObjectsParam) => {
    return databaseConnectorObjects.memDatabaseConnectorObjects(doCall, databaseConnectorId, databaseConnectorObjectsParam);
  });

  memDbObjectSchema = memoizeOneCurry((doCall, databaseConnectorId, connectorObject, databaseConnectorObjectSchemaParam) => {
    return databaseConnectorObjectSchema.memDatabaseConnectorObjectSchema(doCall, databaseConnectorId, connectorObject, databaseConnectorObjectSchemaParam);
  });

  memDatabaseConnectors = memoizeOneCurry((doCall, databaseConnectorsParam) => {
    return databaseConnectors.memDatabaseConnectors(doCall, databaseConnectorsParam)?.filter((connector) => connector.status == 'ACTIVE');
  });

  memBatchPred = memoizeOneCurry((doCall, batchPredParam, batchPredId) => {
    return batchPred.memBatchDescribe(undefined, batchPredId, doCall);
  });

  componentDidUpdate(prevProps: Readonly<IDatasetNewOneProps>, prevState: Readonly<IDatasetNewOneState>, snapshot?: any): void {
    this.doMem();
  }

  handleSubmit = (values) => {
    if (this.state.isPreview) {
      this.setState({
        isPreview: false,
      });
    }

    let sqlQuery = values.sqlQuery;
    if (!this.state.dbSqlQueryUse) {
      sqlQuery = null;
    }

    let refreshSchedule = values.refreshSchedule;
    delete values['refreshSchedule'];

    let { paramsProp } = this.props;
    if (!paramsProp) {
      return;
    }
    let name = paramsProp.get('name');
    const isDbSelected = ![EUploadCloudServiceType.AWS, EUploadCloudServiceType.GoogleCloud, EUploadCloudServiceType.Azure, EUploadCloudServiceType.SFTP].includes(this.state.useCloudServiceSel);
    let databaseConnectorId = isDbSelected ? this.state.useCloudServiceSel : null;
    let incremental = values.incremental == null ? null : values.incremental === true;
    let incrementalTimestampColumn = values.incrementalTimestampColumn?.value;

    let tableName = paramsProp.get('tablename');
    let csvDelimiter = values.csvDelimiter;
    if (Utils.isNullOrEmpty(csvDelimiter)) {
      csvDelimiter = null;
    }
    let filenameColumn = values.filenameColumn;
    if (Utils.isNullOrEmpty(filenameColumn)) {
      filenameColumn = null;
    }

    let datasetType = paramsProp.get('datasetType');

    let oriDatasetId = paramsProp.get('oriDatasetId');
    if (oriDatasetId === '') {
      oriDatasetId = null;
    }

    if (Utils.isNullOrEmpty(name)) {
      REActions.addNotificationError('Name is missing!');
      return;
    }

    let files = values.files;
    let locationS3 = values.locationS3;
    if (locationS3 != null) {
      locationS3 = _.trim(locationS3);
    }

    let startPrefix = !this.state.askIsPrefixes ? null : values.startPrefix;
    let untilPrefix = !this.state.askIsPrefixes ? null : values.untilPrefix;
    let locationDateFormat = this.state.askIsPrefixes ? null : values.locationDateFormat;
    let dateFormatLookbackDays = this.state.askIsPrefixes ? null : values.dateFormatLookbackDays;

    let file1 = null;
    if (files && files.length > 0) {
      file1 = files[0];
    }

    this.setState({
      isProcessing: true,
    });

    let askModalType = this.state.askModalType;

    //
    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    let useCase1 = paramsProp && paramsProp.get('useCase');
    if (!useCase1) {
      useCase1 = this.memProjectUseCase(foundProject1);
    }

    let allowBatchOption = false;
    let useCaseInfo = this.memUseCaseInfo(false)(this.props.useCases, useCase1);
    if (useCaseInfo != null) {
      allowBatchOption = useCaseInfo.full_batch_supported === true || useCaseInfo.full_batch_supported == null;
      if (!allowBatchOption) {
        askModalType = '';
      }
    }

    //
    let projectIdToAttach = null;
    if (paramsProp) {
      projectIdToAttach = paramsProp.get('projectId');
    }

    const batchPredId = paramsProp?.get('batchPredId');
    let batchPredOne = this.memBatchPred(false)(this.props.batchPred, batchPredId);

    let needRedirectParam = false;
    let doWorkSend = () => {
      let newVersionDatasetId = paramsProp?.get('newVersion');
      if (Utils.isNullOrEmpty(newVersionDatasetId)) {
        newVersionDatasetId = null;
      }
      const docStoreIsDocument = paramsProp?.get('docStoreIsDocument')?.toLowerCase();
      REUploads_.client_().doUploadNew(
        docStoreIsDocument === 'a' || docStoreIsDocument === 'b',
        batchPredId,
        oriDatasetId,
        true,
        undefined,
        newVersionDatasetId,
        name,
        projectIdToAttach,
        datasetType?.toUpperCase(),
        file1,
        locationS3,
        refreshSchedule,
        databaseConnectorId,
        this.state.objectSel?.value,
        values.columns?.join(', '),
        values.queryArguments,
        tableName,
        sqlQuery,
        csvDelimiter,
        filenameColumn,
        startPrefix,
        untilPrefix,
        locationDateFormat,
        dateFormatLookbackDays,
        incremental,
        incrementalTimestampColumn,
        this.state.mergeFileSchemas,
        this.state.extractBoundingBoxes,
        (newDatasetId) => {
          if (newDatasetId && newDatasetId !== '') {
            const doNewDatasetWork = () => {
              StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                list?.some((f1) => {
                  StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                });
              });

              if (needRedirectParam) {
                if (newVersionDatasetId && newDatasetId) {
                  StoreActions.listDatasetsVersions_(newVersionDatasetId, () => {
                    StoreActions.getProjectsList_();
                    StoreActions.listDatasets_([newDatasetId]);
                    StoreActions.getProjectsById_(projectIdToAttach);
                    StoreActions.getProjectDatasets_(projectIdToAttach);
                    StoreActions.validateProjectDatasets_(projectIdToAttach);
                    StoreActions.refreshDoDatasetAll_(newDatasetId, projectIdToAttach, batchPredId);
                  });
                }

                if (batchPredId && paramsProp?.get('returnToUseCaseCreate') === 'true') {
                  let isDataset = paramsProp?.get('isDataset') === 'true';
                  Location.push('/' + PartsLink.batchpred_create + '/' + projectId + '/' + batchPredId, undefined, isDataset ? 'isDataset=true' : undefined);
                } else if (batchPredId && !paramsProp?.get('returnToUseCase')) {
                  Location.push('/' + PartsLink.batchpred_datasets + '/' + projectId + '/' + batchPredId);
                } else if (paramsProp && paramsProp.get('returnToUseCase') && !paramsProp.get('isDash')) {
                  needRedirectParam = true;
                  let partUrlFirst = '/' + PartsLink.dataset_for_usecase + '/' + paramsProp?.get('projectId');
                  if (window.location.href?.indexOf(partUrlFirst) > -1) {
                    this.gotoBackToUseCase(file1 != null && newDatasetId ? newDatasetId : null);
                  }
                } else if (projectIdToAttach) {
                  let queryParams = Utils.processParamsAsQuery({ uploadedDatasetId: newDatasetId });
                  let partUrlFirst = '/' + (batchPredId ? PartsLink.batchpred_create : PartsLink.dataset_for_usecase) + '/' + projectIdToAttach + (batchPredId ? '/' + batchPredId : '');
                  if (window.location.href?.indexOf(partUrlFirst) > -1) {
                    Location.push(partUrlFirst, undefined, queryParams);
                  }
                }
              }
            };

            if (batchPredId) {
              if (oriDatasetId) {
                let data1 = { ...(batchPredOne?.batchInputs?.datasetIdRemap ?? {}) };
                data1[oriDatasetId] = newDatasetId;

                REClient_.client_().setBatchPredictionDatasetRemap(batchPredId, JSON.stringify(data1), (err, res) => {
                  StoreActions.batchList_(projectId);
                  StoreActions.batchDescribeById_(batchPredId);

                  doNewDatasetWork();
                });
              } else {
                REClient_.client_().setBatchPredictionDataset(batchPredId, datasetType?.toUpperCase(), newDatasetId, (err, res) => {
                  StoreActions.batchList_(projectId);
                  StoreActions.batchDescribeById_(batchPredId);

                  doNewDatasetWork();
                });
              }
            } else {
              doNewDatasetWork();
            }
          }
        },
        (actual, total) => {
          if (!this.isM) {
            return;
          }
        },
        (errPre, resPre) => {
          if (!this.isM) {
            return;
          }

          this.setState({
            isProcessing: false,
          });

          if (errPre || !resPre.success) {
            REActions.addNotificationError(errPre || 'Error uploading');
          } else {
            const doNewDatasetWork = () => {
              let endDatasetId = resPre && resPre.success && resPre.result && resPre.result.datasetId;

              if (newVersionDatasetId) {
                if (askModalType != null && (askModalType as string) !== '') {
                  this.modalAskReTrainDeployShow(projectIdToAttach, askModalType);
                }

                StoreActions.validateProjectDatasetsReset_();
                StoreActions.listDatasetsVersions_(newVersionDatasetId, () => {
                  StoreActions.getProjectsList_();
                  StoreActions.listDatasets_([endDatasetId]);
                  StoreActions.getProjectsById_(projectIdToAttach);
                  StoreActions.getProjectDatasets_(projectIdToAttach);
                  StoreActions.validateProjectDatasets_(projectIdToAttach);

                  if (endDatasetId) {
                    StoreActions.refreshDoDatasetAll_(endDatasetId, projectIdToAttach, batchPredId);
                  }
                });
              }

              if (batchPredId && paramsProp?.get('returnToUseCaseCreate') === 'true') {
                let isDataset = paramsProp?.get('isDataset') === 'true';
                Location.push('/' + PartsLink.batchpred_create + '/' + projectId + '/' + batchPredId, undefined, isDataset ? 'isDataset=true' : undefined);
              } else if (batchPredId && !paramsProp?.get('returnToUseCase')) {
                Location.push('/' + PartsLink.batchpred_datasets + '/' + projectId + '/' + batchPredId);
              } else if (newVersionDatasetId != null && newVersionDatasetId !== '' && !paramsProp?.get('returnToDash')) {
                Location.push('/' + PartsLink.dataset_detail + '/' + newVersionDatasetId + (projectIdToAttach ? '/' + projectIdToAttach : ''));
              } else if (paramsProp && paramsProp.get('returnToUseCase') && !paramsProp.get('isDash')) {
                needRedirectParam = true;
                this.gotoBackToUseCase(file1 != null && endDatasetId ? endDatasetId : null);
              } else if (projectIdToAttach) {
                let queryParams;
                if (endDatasetId && file1 != null) {
                  queryParams = Utils.processParamsAsQuery({ uploadedDatasetId: endDatasetId });
                } else {
                  needRedirectParam = true;
                }
                Location.push('/' + PartsLink.project_dashboard + '/' + projectIdToAttach, undefined, queryParams);
              } else if (projectId == null) {
                StoreActions.listAllDatasets();
                if (endDatasetId) {
                  Location.push('/' + PartsLink.dataset_detail + '/' + endDatasetId);
                } else {
                  Location.push('/' + PartsLink.datasets_all);
                }
              } else {
                try {
                  // @ts-ignore
                  TableExt.saveSortForSaveTable('dataset_list', 'createdAt');
                } catch (e) {
                  //
                }
                Location.push('/' + PartsLink.dataset_list);
              }
            };

            doNewDatasetWork();
          }
        },
        (errEnd, resEnd) => {
          // if(!this.isM) {
          //   return;
          // }
        },
      );
    };

    if (this.state.useTypeSel === EUploadDatasetType.Streaming) {
      let streamingDataIngestion = this.state.streamingDataIngestion;
      REClient_.client_().createStreamingDataset(projectId, datasetType, name, tableName, (err, res) => {
        this.setState({
          isProcessing: false,
        });

        if (err || !res?.success || !res?.result?.datasetId) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.getProjectsList_();
          StoreActions.listDatasets_([res?.result?.datasetId]);
          StoreActions.getProjectsById_(projectId);
          StoreActions.validateProjectDatasets_(projectId);
          StoreActions.getProjectDatasets_(projectId);
          StoreActions.listModels_(projectId);

          StoreActions.featureGroupsGetByProject_(projectId, (list) => {
            list?.some((f1) => {
              StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
            });
          });

          if (streamingDataIngestion === EUploadDataIngestion.streaming_event_data) {
            Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + (res?.result?.featureGroupId || '-'), undefined, 'showWizardStreaming=1');
          } else {
            Location.push('/' + PartsLink.project_dashboard + '/' + projectIdToAttach);
          }
        }
      });
    } else if (!file1 && locationS3) {
      let ss1 = locationS3.split('://');
      if (ss1.length >= 2) {
        let schema1 = ss1[0] + '://';
        let loc1 = locationS3.substring(schema1.length);
        ss1 = loc1.split('/');
        if (ss1.length >= 2) {
          let bucket1 = ss1[0];
          let path1 = loc1.substring(bucket1.length);

          REClient_.client_()._fileExists(schema1 + bucket1, path1, (errE, resE) => {
            if (errE || !resE?.success) {
              this.setState({
                isProcessing: false,
              });
              REActions.addNotificationError(errE || Constants.errorDefault);
            } else if (!resE?.result) {
              this.setState({
                isProcessing: false,
              });
              REActions.addNotificationError('Input file not found');
            } else {
              doWorkSend();
            }
          });
          return;
        }
      }

      doWorkSend();
    } else {
      doWorkSend();
    }
  };

  gotoBackToUseCase = (uploadedDatasetId = null) => {
    let { paramsProp } = this.props;
    if (!paramsProp) {
      return;
    }

    let params: any = {
      useCase: paramsProp.get('useCase'),
      useCaseTag: paramsProp.get('useCaseTag'),
      stepByStep: paramsProp.get('stepByStep'),
      oriDatasetId: paramsProp.get('oriDatasetId'),
      returnToUseCaseCreate: paramsProp.get('returnToUseCaseCreate'),
      isDataset: paramsProp.get('isDataset'),
    };
    if (uploadedDatasetId != null) {
      params['uploadedDatasetId'] = uploadedDatasetId;
    }

    let query = Utils.processParamsAsQuery(params);

    let batchPredId = paramsProp?.get('batchPredId');
    Location.push('/' + (batchPredId ? PartsLink.batchpred_create : PartsLink.dataset_for_usecase) + '/' + paramsProp.get('projectId') + (batchPredId ? '/' + batchPredId : ''), undefined, query);
  };

  onClickStreamingType = (v1) => {
    this.setState({
      streamingDataIngestion: v1,
    });
  };

  onClickType = (typeSel: EUploadDatasetType) => {
    this.setState({
      useTypeSel: typeSel,
    });
  };

  onClickServiceType = (serviceSel: any) => {
    this.formRef.current.setFieldsValue({ columns: [], objectName: null });
    this.setState(
      {
        useCloudServiceSel: serviceSel,
        objectSel: null,
        selectedColumns: null,
      },
      () => {
        // this.formRef.current.validateFields({ force: true }, () => {});
        this.formRef.current
          .validateFields()
          .then(() => {})
          .catch(() => {});
      },
    );
  };

  memOptionsDatasetType = memoizeOne((schemaInfo) => {
    let res = [];
    let resAlreadyByDatasetType = {};

    if (schemaInfo) {
      schemaInfo.list?.some((sc1) => {
        if (!sc1) {
          return;
        }

        let dataInfo = schemaInfo[sc1];
        let datasetType = dataInfo.dataset_type;
        if (!dataInfo) {
          return;
        }

        if (!resAlreadyByDatasetType[datasetType]) {
          resAlreadyByDatasetType[datasetType] = true;
          res.push({
            value: datasetType,
            label: dataInfo.title,
          });
        }
      });
    }

    return res;
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memProjectUseCase = memoizeOne((foundProject1) => {
    if (!foundProject1) {
      return;
    }

    return foundProject1.useCase;
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  onChangeFileList = (e) => {
    setTimeout(() => {
      let isIncrement = (this.formRef.current?.getFieldValue('locationS3') || '').indexOf('*') > -1;
      if (!!this.state.showIncremental !== isIncrement) {
        this.setState({
          showIncremental: isIncrement,
        });
      }

      let incremental1 = this.formRef.current?.getFieldValue('incremental') === true;
      this.setState({
        isIncremental: incremental1,
      });

      let fileList = this.formRef.current.getFieldValue('files');
      fileList = fileList ? [...fileList] : [];
      if (fileList.length > 1) {
        let f1 = fileList[fileList.length - 1];
        fileList = [f1];
        this.formRef.current.setFieldsValue({ files: fileList });

        this.setState({
          fileSel: f1?.originFileObj ?? f1,
          // isPreview: true,
        });
      }
    }, 0);
  };

  onChangeEnablePolicy = (e) => {
    // setTimeout(() => {
    //   let v1 = this.formRef.current.getFieldValue('refreshPolicyEnabled');
    //   this.setState({
    //     showRefreshPolicyS3Items: !!v1,
    //   });
    // }, 0);
  };

  onClickBackFromPreview = (e) => {
    this.setState({
      isPreview: false,
    });
  };

  onClickViewPreview = (e) => {
    this.setState({
      isPreview: true,
    });
  };

  modalAskReTrainDeployShow = (projectId?: string, askModalType?: string) => {
    if (!projectId) {
      return;
    }

    REClient_.client_()._createNewVersions(projectId, askModalType, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      }
    });
  };

  memUseCaseInfo = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  onChangeCronValue = (v1) => {
    this.formRef.current?.setFieldsValue({ refreshSchedule: v1 });
  };

  onChangeFile = (v1) => {
    this.setState({
      fileSel: v1,
    });
  };

  onObjectSelected = (optionSel) => {
    let firstTimeCols = [];
    if (optionSel) {
      const objectSchema = this.memDbObjectSchema(false)(this.state.useCloudServiceSel, optionSel?.value, this.props.databaseConnectorObjectSchema);
      firstTimeCols = [...(objectSchema ?? [])];
    }

    this.formRef.current.setFieldsValue({ columns: firstTimeCols });
    this.setState({
      objectSel: optionSel,
      selectedColumns: null,
    });
  };

  memCanPreview = memoizeOne((fileSel) => {
    const p = fileSel?.type?.toLowerCase()?.indexOf('/csv');
    return p != null && p > -1;
  });

  memColumnOptionsSelect = memoizeOne((columns) => {
    let columnOptions = [];
    if (columns) {
      columns?.some((p1) => {
        columnOptions.push({ label: p1, value: p1 });
      });
    }
    return columnOptions;
  });

  memColumnOptions = memoizeOne((columns) => {
    let columnOptions = [];
    if (columns) {
      columns?.some((p1) => {
        columnOptions.push(
          <Option value={p1} key={p1}>
            {p1}
          </Option>,
        );
      });
    }
    return columnOptions;
  });

  memObjectOptions = memoizeOne((objects) => {
    let optionsObjects = [];
    if (objects) {
      objects?.some((p1) => {
        let obj1 = {
          value: p1,
          label: <span style={{ fontWeight: 600 }}>{p1}</span>,
          name: p1,
          search: p1,
        };
        optionsObjects.push(obj1);
      });
    }
    return optionsObjects;
  });

  memExampleText = memoizeOne((databaseConnectorId) => {
    if (Utils.isNullOrEmpty(databaseConnectorId)) {
      let s1 = null;
      if (s1 != this.state.dbConnectorExampleText) {
        this.setState({
          dbConnectorExampleText: s1,
        });
      }
      return;
    }

    REClient_.client_()._getExampleQuery(databaseConnectorId, (err, res) => {
      let s1 = res?.result;
      if (Utils.isNullOrEmpty(s1)) {
        s1 = null;
      }

      if (s1 != this.state.dbConnectorExampleText) {
        this.setState({
          dbConnectorExampleText: s1,
        });
      }
    });
  });

  memDBOptionsNotUsed = memoizeOne((dbOptions, verifiedDb) => {
    let res = Object.keys(dbOptions ?? {})
      .sort()
      .map((k1, ind) => {
        const db1 = dbOptions?.[k1];
        db1.key = k1;

        const alreadyUsed = verifiedDb?.find((v1) => db1.name && v1.service?.toLowerCase() === db1.name?.toLowerCase());
        if (alreadyUsed) {
          return null;
        }

        return db1;
      })
      .filter((v1) => v1 != null);

    if (res != null && res.length === 0) {
      res = null;
    }

    return res;
  });

  onClickAddConnector = (isFile, id1, e) => {
    if (isFile == null) {
      this.connectors?.paramAddAuto(id1, isFile);
    } else if (isFile === true) {
      this.connectorsFile?.paramAddAuto(id1, isFile);
    } else if (isFile === false) {
      this.connectorsDB?.paramAddAuto(id1, isFile);
    }
  };

  onClickOptionsColumnsClear = (e) => {
    this.formRef.current.setFieldsValue({ columns: [] });
  };

  onClickOptionsColumnsSetAll = (e) => {
    const objectSchema = this.state.objectSel ? this.memDbObjectSchema(false)(this.state.useCloudServiceSel, this.state.objectSel?.value, this.props.databaseConnectorObjectSchema) : null;

    let rr = objectSchema?.filter((v1) => !Utils.isNullOrEmpty(v1)) ?? [];
    this.formRef.current.setFieldsValue({ columns: rr });
  };

  memFileConnectors = memoizeOneCurry((doCall, fileConnectorsParam) => {
    return fileConnectors.memFileConnectors(doCall, fileConnectorsParam);
  });

  memFileConnectorOptions = memoizeOneCurry((doCall, fileConnectorOptionsParam) => {
    return fileConnectorOptions.memFileConnectorOptions(doCall, fileConnectorOptionsParam);
  });

  memUsedFileConnectors = memoizeOne((fileConnectorsList, fileOptionsList) => {
    let res = null;
    if (fileOptionsList != null && fileConnectorsList != null) {
      res = [];
      let kk = Object.keys(fileOptionsList);
      kk.some((k1) => {
        if (
          fileConnectorsList.some((f1) => {
            if (_.startsWith(f1?.bucket, fileOptionsList[k1]?.prefix + '://')) {
              return true;
            }
          })
        ) {
          if (!res.includes(k1?.toUpperCase())) {
            res.push(k1?.toUpperCase());
          }
        }
      });
    }

    if (res != null && res.length > 0) {
      let rr = [];
      FileServicesList.some((k1) => {
        if (res.includes(k1)) {
          rr.push(k1);
        }
      });
      res = rr;
    }

    return res;
  });

  onClickRetryDbConnector = (e) => {
    StoreActions.getDatabaseConnectorObjects(this.state.useCloudServiceSel);

    this.setState({
      dnConnectorRetryIsProcessing: true,
    });
  };

  render() {
    let { isPreview } = this.state;

    const batchPredId = this.props.paramsProp?.get('batchPredId');

    const styleRectType: CSSProperties = {
      position: 'relative',
      backgroundColor: '#19232f',
      padding: '10px',
      flex: 1,
      marginRight: '10px',
      color: 'white',
      lineHeight: '1.2rem',
      textAlign: 'center',
      minHeight: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const styleRectType2: CSSProperties = {
      position: 'relative',
      backgroundColor: '#19232f',
      padding: '10px',
      width: '150px',
      marginRight: '10px',
      color: 'white',
      lineHeight: '1.2rem',
      marginTop: '10px',
      textAlign: 'center',
      display: 'flex',
      height: '150px',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const styleRectTypeDBOption: CSSProperties = {
      position: 'relative',
      backgroundColor: '#19232f',
      padding: '10px',
      width: '150px',
      marginRight: '10px',
      color: 'white',
      lineHeight: '1.2rem',
      marginTop: '10px',
      height: '50px',
    };

    const styleRectTypeDBOptionNoSize: CSSProperties = {
      position: 'relative',
      backgroundColor: '#19232f',
      padding: '10px',
      marginRight: '10px',
      color: 'white',
      lineHeight: '1.2rem',
      marginTop: '10px',
      height: '45px',
    };

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let progressElem: IRefreshAndProgressProgress = null;
    if (this.state.isProcessing) {
      progressElem = {
        label: 'Uploading...',
      };
    }

    let { paramsProp } = this.props;
    let datasetTypeName = null;

    let newVersionDatasetId = paramsProp?.get('newVersion');
    if (Utils.isNullOrEmpty(newVersionDatasetId)) {
      newVersionDatasetId = null;
    }

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    let useCase1 = paramsProp && paramsProp.get('useCase');
    if (!useCase1) {
      useCase1 = this.memProjectUseCase(foundProject1);
    }

    let datasetType = paramsProp && paramsProp.get('datasetType');
    if (datasetType) {
      let schemaInfo = this.memUseCaseSchemas(false)(this.props.useCases, useCase1);
      let optionsDatasetType = this.memOptionsDatasetType(schemaInfo);
      let dtFound1 = optionsDatasetType?.find((o1) => (o1.value || '').toLowerCase() === (datasetType || '').toLowerCase());
      if (dtFound1) {
        datasetTypeName = dtFound1.label;
      }
    }

    let $this = this;

    let allowBatchOption = false;
    let useCaseInfo = this.memUseCaseInfo(false)(this.props.useCases, useCase1);
    if (useCaseInfo != null) {
      allowBatchOption = useCaseInfo.full_batch_supported === true || useCaseInfo.full_batch_supported == null;
    }
    if (batchPredId) {
      allowBatchOption = false;
    }

    const isStreaming = this.state.useTypeSel === EUploadDatasetType.Streaming;
    const canPreview = this.memCanPreview(this.state.fileSel);
    const dbOptions = this.memDatabaseConnectorOptions(false)(this.props.databaseConnectorOptions);
    const verifiedDb = this.memDatabaseConnectors(false)(this.props.databaseConnectors);
    const isDbSelected =
      this.state.useCloudServiceSel != null &&
      ![EUploadCloudServiceType.AWS, EUploadCloudServiceType.GoogleCloud, EUploadCloudServiceType.Azure, EUploadCloudServiceType.SFTP].includes(this.state.useCloudServiceSel) &&
      this.state.useTypeSel === EUploadDatasetType.S3;
    const dbConnectorOptions = isDbSelected ? this.memDbObjects(false)(this.state.useCloudServiceSel, this.props.databaseConnectorObjects) : null;
    const objectOptions = this.memObjectOptions(dbConnectorOptions);
    const objectOptionsError = databaseConnectorObjects.calcErrorForDatabaseConnectorId(this.state.useCloudServiceSel, this.props.databaseConnectorObjects);
    const objectSchema = this.state.objectSel ? this.memDbObjectSchema(false)(this.state.useCloudServiceSel, this.state.objectSel?.value, this.props.databaseConnectorObjectSchema) : null;
    const columnOptions = this.state.objectSel ? this.memColumnOptions(objectSchema) : null;
    const columnOptionsSelect = this.state.objectSel ? this.memColumnOptionsSelect(objectSchema) : null;

    const dbOptionsNotUsed = this.memDBOptionsNotUsed(dbOptions, verifiedDb);

    let allowStreaming = true;
    if (datasetType?.toLowerCase() === ProjectDatasetType.SECONDARY_TABLE?.toLowerCase()) {
      allowStreaming = false;
    }
    let oriDatasetId = paramsProp.get('oriDatasetId');
    if (oriDatasetId === '') {
      oriDatasetId = null;
    }
    if (batchPredId && oriDatasetId) {
      allowStreaming = false;
    }

    let dbSqlQueryUse = !!this.state.dbSqlQueryUse;

    let dbSelServiceId = verifiedDb?.find((v1) => this.state.useCloudServiceSel === v1.databaseConnectorId)?.service?.toLowerCase();
    let exampleText = this.state.dbConnectorExampleText;

    let filterPrefixCloudBrowser = null;
    if (this.state.useCloudServiceSel === EUploadCloudServiceType.GoogleCloud) {
      filterPrefixCloudBrowser = 'gs://';
    } else if (this.state.useCloudServiceSel === EUploadCloudServiceType.AWS) {
      filterPrefixCloudBrowser = 's3://';
    } else if (this.state.useCloudServiceSel === EUploadCloudServiceType.Azure) {
      filterPrefixCloudBrowser = 'azure://';
    } else if (this.state.useCloudServiceSel === EUploadCloudServiceType.SFTP) {
      filterPrefixCloudBrowser = 'sftp://';
    }

    let fileConnectorsList = this.memFileConnectors(false)(this.props.fileConnectors);
    let fileOptionsList = this.memFileConnectorOptions(false)(this.props.fileConnectorOptions);
    let usedConnectorsServices = this.memUsedFileConnectors(fileConnectorsList, fileOptionsList);

    let anySelected = this.state.useCloudServiceSel != null || this.state.useTypeSel !== EUploadDatasetType.S3;

    let docStoreDef = calcDocStoreDefFromProject(foundProject1);
    const docStoreIsDocument = paramsProp?.get('docStoreIsDocument')?.toLowerCase();
    let isDocumentset = docStoreIsDocument === 'a' || docStoreIsDocument === 'b';

    return (
      <div style={{ margin: '30px auto', maxWidth: '90%', minWidth: '600px', color: Utils.colorA(1), position: 'relative' }}>
        <RefreshAndProgress isRefreshing={this.state.isProcessing} progress={progressElem} isRelative={true}>
          <div style={{ color: 'white', fontSize: '20px', margin: '5px auto 30px auto', textAlign: 'center' }}>
            {paramsProp && paramsProp.get('name') && (
              <span>
                <span style={{ opacity: 0.8 }}>Name:</span> {paramsProp.get('name')}
              </span>
            )}
            {datasetTypeName != null && <span style={{ marginLeft: '20px', opacity: 0.7 }}>-</span>}
            {datasetTypeName != null && (
              <span style={{ marginLeft: '20px' }}>
                <span style={{ opacity: 0.8 }}>Dataset Type:</span> {datasetTypeName}
              </span>
            )}
          </div>

          <div style={{ maxWidth: isPreview ? '' : 600 + 'px', margin: '0 auto' }}>
            <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: 'none', borderRadius: '5px' }} className={sd.grayDarkPanel}>
              <FormExt
                layout={'vertical'}
                ref={this.formRef}
                onFinish={this.handleSubmit}
                className="login-form"
                onChange={this.onChangeFileList}
                initialValues={{
                  refreshPolicyEnabled: refreshPolicyEnabledDefault,
                  refreshPolicy: 'daily',
                  refreshPolicyTime: moment('10:00', 'HH:mm'),
                }}
              >
                <div style={{ display: isPreview ? 'none' : 'block' }}>
                  {newVersionDatasetId == null && (
                    <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>File Source:</span>}>
                      <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
                        <div
                          style={styleRectType}
                          className={sd.rectSel + ' ' + (this.state.useTypeSel === EUploadDatasetType.FileUpload ? sd.selected + ' ' + s.selected : '')}
                          onClick={this.onClickType.bind(this, EUploadDatasetType.FileUpload)}
                        >
                          <div className={s.checkSel}>
                            <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                          </div>
                          File Upload
                        </div>
                        <div style={styleRectType} className={sd.rectSel + ' ' + (this.state.useTypeSel === EUploadDatasetType.S3 ? sd.selected + ' ' + s.selected : '')} onClick={this.onClickType.bind(this, EUploadDatasetType.S3)}>
                          <div className={s.checkSel}>
                            <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                          </div>
                          Read From External Service
                        </div>
                        {allowStreaming && !newVersionDatasetId && (
                          <div
                            style={styleRectType}
                            className={sd.rectSel + ' ' + (this.state.useTypeSel === EUploadDatasetType.Streaming ? sd.selected + ' ' + s.selected : '')}
                            onClick={this.onClickType.bind(this, EUploadDatasetType.Streaming)}
                          >
                            <div className={s.checkSel}>
                              <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                            </div>
                            Streaming Dataset
                          </div>
                        )}
                      </div>
                    </Form.Item>
                  )}

                  {isStreaming && <div style={{ margin: '30px 0', textAlign: 'center', color: Utils.colorA(1) }}>Stream events in real-time using a Python or Javascript API</div>}
                  {!isStreaming && docStoreIsDocument !== 'b' && !Utils.isNullOrEmpty(Constants.flags.tabular_files_add_formats) && (
                    <div style={{ margin: '30px 0', textAlign: 'center', color: Utils.colorA(1) }}>{Constants.flags.tabular_files_add_formats}</div>
                  )}
                  {!isStreaming && docStoreIsDocument === 'b' && !Utils.isNullOrEmpty(Constants.flags.files_add_formats) && (
                    <div style={{ margin: '30px 0', textAlign: 'center', color: Utils.colorA(1) }}>{Constants.flags.files_add_formats}</div>
                  )}

                  {false && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.Streaming && (
                    <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Data Ingestion Mechanism:</span>}>
                      <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
                        <div
                          style={styleRectType}
                          className={sd.rectSel + ' ' + (this.state.streamingDataIngestion === EUploadDataIngestion.streaming_event_data ? sd.selected + ' ' + s.selected : '')}
                          onClick={this.onClickStreamingType.bind(this, EUploadDataIngestion.streaming_event_data)}
                        >
                          <div className={s.checkSel}>
                            <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                          </div>
                          <div>
                            <div style={{ color: Utils.colorA(0.8) }}>Streaming Event Data</div>
                          </div>
                        </div>
                        <div
                          style={styleRectType}
                          className={sd.rectSel + ' ' + (this.state.streamingDataIngestion === EUploadDataIngestion.batch_files ? sd.selected + ' ' + s.selected : '')}
                          onClick={this.onClickStreamingType.bind(this, EUploadDataIngestion.batch_files)}
                        >
                          <div className={s.checkSel}>
                            <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                          </div>
                          <div>
                            <div style={{ color: Utils.colorA(0.8) }}>Batch Files</div>
                          </div>
                        </div>
                      </div>
                    </Form.Item>
                  )}

                  {newVersionDatasetId == null && (docStoreDef?.hideDatasetS3forIsDocument !== true || !isDocumentset) && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <div
                      css={`
                        & label {
                          width: 100%;
                        }
                      `}
                    >
                      <Form.Item
                        label={
                          <span
                            css={`
                              width: 100%;
                              color: white;
                              display: flex;
                              margin-bottom: 5px;
                            `}
                          >
                            <span
                              css={`
                                flex: 1;
                              `}
                            >
                              Connected File Services:
                            </span>
                            <span>
                              {/*// @ts-ignore*/}
                              <Connectors
                                refSelf={(r1) => {
                                  this.connectorsFile = r1;
                                }}
                                style={{ display: 'block' }}
                                isFile={true}
                              >
                                <Button onClick={this.onClickAddConnector.bind(this, true, null)} type={'primary'} size={'small'}>
                                  Add New File Connector
                                </Button>
                              </Connectors>
                            </span>
                          </span>
                        }
                      >
                        <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
                          {usedConnectorsServices?.includes('AWS') && (
                            <div
                              style={styleRectType}
                              className={sd.rectSel + ' ' + (this.state.useCloudServiceSel === EUploadCloudServiceType.AWS ? sd.selected + ' ' + s.selected : '')}
                              onClick={this.onClickServiceType.bind(this, EUploadCloudServiceType.AWS)}
                            >
                              <div className={s.checkSel}>
                                <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                              </div>
                              <div>
                                <div>
                                  <img src={calcStaticUrl('/static/imgs/connectors/s3.png')} alt={''} style={{ width: '46px' }} />
                                </div>
                                <div style={{ color: Utils.colorA(0.8), marginTop: '5px' }}>AWS S3</div>
                              </div>
                            </div>
                          )}
                          {usedConnectorsServices?.includes('GCS') && (
                            <div
                              style={styleRectType}
                              className={sd.rectSel + ' ' + (this.state.useCloudServiceSel === EUploadCloudServiceType.GoogleCloud ? sd.selected + ' ' + s.selected : '')}
                              onClick={this.onClickServiceType.bind(this, EUploadCloudServiceType.GoogleCloud)}
                            >
                              <div className={s.checkSel}>
                                <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                              </div>
                              <div>
                                <div>
                                  <img src={calcStaticUrl('/static/imgs/connectors/gcs.png')} alt={''} style={{ width: '60px' }} />
                                </div>
                                <div style={{ color: Utils.colorA(0.8), marginTop: '5px' }}>Google Cloud Storage</div>
                              </div>
                            </div>
                          )}
                          {usedConnectorsServices?.includes('AZURE') && (
                            <div
                              style={styleRectType}
                              className={sd.rectSel + ' ' + (this.state.useCloudServiceSel === EUploadCloudServiceType.Azure ? sd.selected + ' ' + s.selected : '')}
                              onClick={this.onClickServiceType.bind(this, EUploadCloudServiceType.Azure)}
                            >
                              <div className={s.checkSel}>
                                <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                              </div>
                              <div>
                                <div>
                                  <img src={calcStaticUrl('/static/imgs/connectors/azure.png')} alt={''} style={{ width: '60px' }} />
                                </div>
                                <div style={{ color: Utils.colorA(0.8), marginTop: '5px' }}>Azure</div>
                              </div>
                            </div>
                          )}
                          {usedConnectorsServices?.includes('SFTP') && (
                            <div
                              style={styleRectType}
                              className={sd.rectSel + ' ' + (this.state.useCloudServiceSel === EUploadCloudServiceType.SFTP ? sd.selected + ' ' + s.selected : '')}
                              onClick={this.onClickServiceType.bind(this, EUploadCloudServiceType.SFTP)}
                            >
                              <div className={s.checkSel}>
                                <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                              </div>
                              <div>
                                <div>
                                  <img src={calcStaticUrl('/static/imgs/connectors/sftp.png')} alt={''} style={{ width: '46px' }} />
                                </div>
                                <div style={{ color: Utils.colorA(0.8), marginTop: '5px' }}>SFTP</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Form.Item>
                    </div>
                  )}

                  {newVersionDatasetId == null && (docStoreDef?.hideDatasetDBConnectorforIsDocument !== true || !isDocumentset) && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <div
                      css={`
                        & label {
                          width: 100%;
                        }
                      `}
                    >
                      <Form.Item
                        label={
                          <span
                            css={`
                              width: 100%;
                              color: white;
                              display: flex;
                              margin-bottom: 5px;
                            `}
                          >
                            <span
                              css={`
                                flex: 1;
                              `}
                            >
                              Connected Database Connectors:
                            </span>
                            <span>
                              {/*// @ts-ignore*/}
                              <Connectors
                                refSelf={(r1) => {
                                  this.connectorsDB = r1;
                                }}
                                style={{ display: 'block' }}
                                isFile={false}
                              >
                                <Button onClick={this.onClickAddConnector.bind(this, false, null)} type={'primary'} size={'small'}>
                                  Add New Database Connector
                                </Button>
                              </Connectors>
                            </span>
                          </span>
                        }
                      >
                        {false && dbOptionsNotUsed != null && (
                          <div
                            style={{ display: 'flex', flexFlow: 'row', flexWrap: 'wrap' }}
                            css={`
                              padding-bottom: 10px;
                              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                            `}
                          >
                            {dbOptionsNotUsed
                              ?.sort((a, b) => (a?.name?.toLowerCase() || '').localeCompare(b?.name?.toLowerCase() || ''))
                              .map((db1, ind) => {
                                let k1 = db1?.key;

                                return (
                                  <div
                                    css={`
                                      flex: 1 0 30%;
                                      max-width: calc(33% - 10px);
                                    `}
                                    key={'db1_' + ind}
                                    style={styleRectTypeDBOption}
                                    className={sd.rectSel}
                                  >
                                    <TooltipExt title={db1?.name}>
                                      <div
                                        css={`
                                          display: flex;
                                          align-items: center;
                                          justify-content: center;
                                          padding-top: 2px;
                                        `}
                                        onClick={this.onClickAddConnector.bind(this, null, k1)}
                                      >
                                        <span
                                          css={`
                                            margin-right: 7px;
                                            opacity: 0.7;
                                          `}
                                        >
                                          Add
                                        </span>
                                        <img alt={''} height={23} src={calcStaticUrl('/static/imgs/' + db1?.logo)} />
                                        {/*<span>{db1?.name}</span>*/}
                                      </div>
                                    </TooltipExt>
                                  </div>
                                );
                              })
                              ?.filter((v1) => v1 != null)}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexFlow: 'row', flexWrap: 'wrap' }}>
                          {verifiedDb?.map((option, index) => {
                            let details = dbOptions?.[option?.service?.toLowerCase()];
                            return (
                              <div
                                css={`
                                  flex: 1 0 30%;
                                  max-width: calc(33% - 10px);
                                `}
                                key={'ser_' + index}
                                style={styleRectType2}
                                className={sd.rectSel + ' ' + (this.state.useCloudServiceSel === option?.databaseConnectorId ? sd.selected + ' ' + s.selected : '')}
                                onClick={this.onClickServiceType.bind(this, option?.databaseConnectorId)}
                              >
                                <div className={s.checkSel}>
                                  <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                                </div>
                                <div>
                                  <div>
                                    <img src={calcStaticUrl('/static/imgs/' + details?.logo)} alt={''} style={{ width: '46px' }} />
                                  </div>
                                  <div style={{ color: Utils.colorA(0.8), marginTop: '5px' }}>{option?.name}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Form.Item>
                    </div>
                  )}

                  {(this.state.useTypeSel === EUploadDatasetType.FileUpload || newVersionDatasetId != null) && <FormItemFileUpload dark formRef={this.formRef} name={'files'} onChangeFile={this.onChangeFile} />}

                  {anySelected && newVersionDatasetId == null && !isDbSelected && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <Form.Item
                      rules={[
                        { required: true, message: 'Location required!' },
                        ({ getFieldValue }) => ({
                          validator(rule, value) {
                            if (!value) {
                              return Promise.resolve();
                            }
                            if ($this.state.useCloudServiceSel === EUploadCloudServiceType.GoogleCloud && _.trim(value?.toLowerCase() || '').substring(0, 5) !== 'gs://') {
                              return Promise.reject('Must start with "gs://"');
                            } else if ($this.state.useCloudServiceSel === EUploadCloudServiceType.AWS && _.trim(value?.toLowerCase() || '').substring(0, 5) !== 's3://') {
                              return Promise.reject('Must start with "s3://"');
                            } else if ($this.state.useCloudServiceSel === EUploadCloudServiceType.Azure && _.trim(value?.toLowerCase() || '').substring(0, 8) !== 'azure://') {
                              return Promise.reject('Must start with "azure://"');
                            } else if ($this.state.useCloudServiceSel === EUploadCloudServiceType.SFTP && _.trim(value?.toLowerCase() || '').substring(0, 7) !== 'sftp://') {
                              return Promise.reject('Must start with "sftp://"');
                            } else {
                              return Promise.resolve();
                            }
                          },
                        }),
                      ]}
                      name={'locationS3'}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Cloud Location:
                          <HelpIcon id={'dataset_upload_cloud_location'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <InputCloud placeholder="" filterPrefix={filterPrefixCloudBrowser} />
                    </Form.Item>
                  )}

                  {anySelected && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.S3 && !isDbSelected && this.state.showIncremental && (
                    <Form.Item
                      valuePropName={'checked'}
                      name={'incremental'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Incremental Read:
                          <HelpIcon id={'dataset_incremental'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <Checkbox>
                        <span
                          css={`
                            color: white;
                            opacity: 0.8;
                          `}
                        ></span>
                      </Checkbox>
                    </Form.Item>
                  )}

                  {/*//@ts-ignore*/}
                  {anySelected && isDbSelected && (
                    <Form.Item
                      css={`
                        .ant-switch:not(.ant-switch-checked) {
                          background-color: #848484;
                        }
                      `}
                      name={'useSqlQuery'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Use Raw SQL Query:
                          <HelpIcon id={'dataset_upload_sql_query'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <Switch
                        checked={this.state.dbSqlQueryUse}
                        onChange={(v1) => {
                          this.setState({ dbSqlQueryUse: v1 });
                        }}
                      />
                    </Form.Item>
                  )}

                  {anySelected && isDbSelected && !dbSqlQueryUse && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <Form.Item rules={[{ required: true, message: 'Object Name Required' }]} name={'objectName'} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Object Name:</span>}>
                      <SelectExt value={this.state.objectSel} options={objectOptions} isSearchable={true} onChange={this.onObjectSelected} menuPortalTarget={popupContainerForMenu(null)} />
                    </Form.Item>
                  )}
                  {anySelected && isDbSelected && !dbSqlQueryUse && this.state.useTypeSel === EUploadDatasetType.S3 && !Utils.isNullOrEmpty(objectOptionsError) && _.isString(objectOptionsError) && (
                    <div>
                      <div
                        css={`
                          margin-top: 5px;
                          color: red;
                          white-space: normal;
                          margin-bottom: 5px;
                          border-radius: 4px;
                          border: 1px solid rgba(255, 255, 255, 0.1);
                        `}
                      >
                        <div
                          css={`
                            margin: 10px 30px;
                            display: flex;
                            align-items: center;
                          `}
                        >
                          <div
                            css={`
                              color: white;
                              margin-right: 15px;
                            `}
                          >
                            <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowAltFromLeft').faArrowAltFromLeft} transform={{ size: 19, x: 0, y: 0 }} />
                          </div>
                          <div
                            css={`
                              flex: 1;
                            `}
                          >
                            {this.state.dnConnectorRetryIsProcessing ? `Retrying...` : objectOptionsError}
                          </div>
                          <div
                            css={`
                              margin-left: 5px;
                            `}
                          >
                            <Button type={'primary'} ghost onClick={this.state.dnConnectorRetryIsProcessing ? null : this.onClickRetryDbConnector} loading={this.state.dnConnectorRetryIsProcessing}>
                              Retry
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div
                        css={`
                          margin-top: 1px;
                          margin-bottom: 10px;
                          text-align: center;
                        `}
                      >
                        <Link to={'/profile/connected_services?tab=0'} usePointer showAsLink>
                          View Connectors
                        </Link>
                      </div>
                    </div>
                  )}

                  {anySelected && isDbSelected && !dbSqlQueryUse && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <Form.Item
                      name={'columns'}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Columns:
                          <span
                            css={`
                              margin-left: 5px;
                              width: 480px;
                              display: inline-block;
                              text-align: right;
                            `}
                          >
                            {columnOptions != null && (
                              <Button ghost type={'default'} size={'small'} onClick={this.onClickOptionsColumnsClear}>
                                Clear
                              </Button>
                            )}
                            {columnOptions != null && (
                              <Button
                                ghost
                                css={`
                                  margin-left: 5px;
                                `}
                                type={'default'}
                                size={'small'}
                                onClick={this.onClickOptionsColumnsSetAll}
                              >
                                Select All
                              </Button>
                            )}
                          </span>
                        </span>
                      }
                      className={s.datasetcolumns}
                    >
                      <Select
                        key={'selectedColumns'}
                        mode="tags"
                        value={this.state.selectedColumns}
                        tokenSeparators={[',']}
                        bordered
                        css={`
                          border: 1px solid hsl(0, 0%, 40%);
                          background-color: #101720;
                        `}
                      >
                        {columnOptions}
                      </Select>
                    </Form.Item>
                  )}

                  {anySelected && isDbSelected && !dbSqlQueryUse && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <Form.Item name={'queryArguments'} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Query Arguments:</span>}>
                      <EditorElem hideCtrlSpace showSmallHelp={exampleText != null} sample={exampleText} height={50} list={objectSchema ?? Utils.emptyStaticArray()} useInternal />
                    </Form.Item>
                  )}

                  {anySelected && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.S3 && isDbSelected && (
                    <Form.Item
                      valuePropName={'checked'}
                      name={'incremental'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Incremental Dataset:
                          <HelpIcon id={'dataset_incremental'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <Checkbox>
                        <span
                          css={`
                            color: white;
                            opacity: 0.8;
                          `}
                        >
                          Incremental Query
                        </span>
                      </Checkbox>
                    </Form.Item>
                  )}

                  {anySelected && newVersionDatasetId == null && this.state.isIncremental && this.state.useTypeSel === EUploadDatasetType.S3 && isDbSelected && !dbSqlQueryUse && (
                    <Form.Item
                      rules={[{ required: true, message: 'Timestamp Name Required' }]}
                      name={'incrementalTimestampColumn'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Incremental Timestamp Column:
                          <HelpIcon id={'dataset_incrementalTimestampColumn'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <SelectExt options={columnOptionsSelect} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                    </Form.Item>
                  )}

                  {anySelected && isDbSelected && dbSqlQueryUse && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <Form.Item
                      name={'sqlQuery'}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          SQL Query:
                          <HelpIcon id={'dataset_sql_query_raw'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <EditorElem height={140} useInternal />
                    </Form.Item>
                  )}

                  {false && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <Form.Item valuePropName={'checked'} name={'refreshPolicyEnabled'} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Refresh Policy:</span>} style={{ marginBottom: '4px' }}>
                      <Checkbox onChange={this.onChangeEnablePolicy}>
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Enabled</span>
                      </Checkbox>
                    </Form.Item>
                  )}
                  {newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.S3 && this.state.showRefreshPolicyS3Items && (
                    <Form.Item name={'refreshPolicy'} style={{ marginBottom: '4px' }}>
                      <Radio.Group style={{ marginTop: '1px' }} buttonStyle="solid">
                        <Radio value={'daily'} style={{ color: Utils.colorA(1) }}>
                          Daily
                        </Radio>
                        <Radio value={'weekly'} style={{ color: Utils.colorA(1) }}>
                          Weekly
                        </Radio>
                        <Radio value={'monthly'} style={{ color: Utils.colorA(1) }}>
                          Monthly
                        </Radio>
                      </Radio.Group>
                    </Form.Item>
                  )}
                  {newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.S3 && this.state.showRefreshPolicyS3Items && (
                    <Form.Item name={'refreshPolicyTime'} style={{ marginTop: 0, marginBottom: '4px' }}>
                      <TimePicker getPopupContainer={popupContainerForMenu} format={'HH:mm'} />
                    </Form.Item>
                  )}

                  {false && this.state.useTypeSel === EUploadDatasetType.S3 && this.state.showRefreshPolicyS3Items && (
                    <Form.Item rules={[{ required: true, message: 'IAM policy access required!' }]} name={'IAMPolicyAccess'} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>IAM Policy Access:</span>}>
                      <Input placeholder="" />
                    </Form.Item>
                  )}

                  {anySelected && newVersionDatasetId == null && !isDbSelected && this.state.useTypeSel === EUploadDatasetType.S3 && (
                    <Form.Item
                      name={'filenameColumn'}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Filename Column:
                          <HelpIcon id={'dataset_upload_filename_column'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <Input placeholder="" />
                    </Form.Item>
                  )}

                  {allowBatchOption && !Utils.isNullOrEmpty(newVersionDatasetId) && (
                    <div style={{ color: Utils.colorA(1), padding: '14px 0', borderTop: '1px solid ' + Utils.colorA(0.2) }}>
                      <div>Would you like to re-train and deploy a new model based on the new dataset version?</div>
                      <div style={{ marginTop: '15px' }}>
                        <Radio.Group
                          value={this.state.askModalType}
                          onChange={(e) => {
                            this.setState({ askModalType: e.target.value });
                          }}
                          style={{ marginTop: '1px' }}
                          buttonStyle="solid"
                        >
                          <Radio value={''} style={{ display: 'block', color: Utils.colorA(1) }}>
                            <span style={{ color: Utils.colorA(0.8) }}>I will do it later</span>
                          </Radio>
                          <Radio value={'batch'} style={{ display: 'block', color: Utils.colorA(1) }}>
                            <span style={{ color: Utils.colorA(0.8) }}>Re-train model and generate new predictions</span>
                          </Radio>
                          <Radio value={'batch_only'} style={{ display: 'block', color: Utils.colorA(0.8) }}>
                            <span style={{ color: Utils.colorA(0.8) }}>Generate new predictions without re-training</span>
                          </Radio>
                        </Radio.Group>
                      </div>
                    </div>
                  )}
                </div>

                {((anySelected && newVersionDatasetId == null && !isDbSelected && this.state.useTypeSel === EUploadDatasetType.S3) ||
                  (anySelected && newVersionDatasetId == null && !isDbSelected && this.state.useTypeSel !== EUploadDatasetType.Streaming)) && (
                  <div>
                    <div
                      css={`
                        margin-top: 10px;
                      `}
                    >
                      &nbsp;
                    </div>

                    {/*// @ts-ignore*/}
                    <Collapse bordered={false} style={{ backgroundColor: Utils.colorA(0.08), color: 'white', marginTop: '10px', borderBottom: 'none' }}>
                      {/*// @ts-ignore*/}
                      <Panel header={<span style={{ color: Utils.colorAall(1) }}>Advanced Options</span>} forceRender={true} key={'advanced'} style={{ borderBottom: 'none' }}>
                        {/*// @ts-ignore*/}
                        {this.state.useTypeSel !== EUploadDatasetType.Streaming && (
                          <Form.Item
                            name={'csvDelimiter'}
                            hasFeedback
                            label={
                              <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                Tabular Data Delimiter:
                                <HelpIcon id={'dataset_upload_csv_delimiter'} style={{ marginLeft: '4px' }} />
                              </span>
                            }
                          >
                            <Input placeholder="(default: auto-detect)" />
                          </Form.Item>
                        )}
                        {/*// @ts-ignore*/}
                        {this.state.useTypeSel !== EUploadDatasetType.Streaming && isDocumentset && (
                          <Checkbox
                            checked={this.state.extractBoundingBoxes}
                            onChange={(e) => {
                              this.setState({ extractBoundingBoxes: e.target.checked });
                            }}
                            style={{ color: Utils.colorA(1), marginLeft: '0px' }}
                          >
                            {' '}
                            Extract bounding boxes from PDF files <HelpIcon id={'dataset_extract_bounding_boxes_flag'} style={{ marginLeft: '4px' }} />{' '}
                          </Checkbox>
                        )}
                        {/*// @ts-ignore*/}
                        {this.state.useTypeSel !== EUploadDatasetType.Streaming && (
                          <Checkbox
                            onChange={(e) => {
                              this.setState({ mergeFileSchemas: e.target.checked });
                            }}
                            style={{ color: Utils.colorA(1), marginLeft: '0px' }}
                          >
                            {' '}
                            Merge schemas across multiple files <HelpIcon id={'dataset_merge_file_schemas_flag'} style={{ marginLeft: '4px' }} />{' '}
                          </Checkbox>
                        )}
                        {this.state.useTypeSel === EUploadDatasetType.S3 && (
                          <div>
                            <div
                              css={`
                                margin-top: 10px;
                              `}
                            >
                              &nbsp;
                            </div>

                            <Radio.Group
                              value={this.state.askIsPrefixes}
                              onChange={(e) => {
                                this.setState({ askIsPrefixes: e.target.value });
                              }}
                              style={{ marginTop: '1px', marginBottom: '15px' }}
                              buttonStyle="solid"
                            >
                              <Radio value={true} style={{ color: Utils.colorA(1) }}>
                                <span style={{ color: Utils.colorA(0.8) }}>Cloud Prefixes</span>
                              </Radio>
                              <Radio value={false} style={{ color: Utils.colorA(0.8) }}>
                                <span style={{ color: Utils.colorA(0.8) }}>Look Back Days</span>
                              </Radio>
                            </Radio.Group>

                            {this.state.askIsPrefixes && (
                              <Form.Item
                                name={'startPrefix'}
                                hasFeedback
                                label={
                                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                    Cloud Location - Start Prefix:
                                    <HelpIcon id={'dataset_upload_cloud_location_start_prefix'} style={{ marginLeft: '4px' }} />
                                  </span>
                                }
                              >
                                <Input placeholder="" />
                              </Form.Item>
                            )}
                            {this.state.askIsPrefixes && (
                              <Form.Item
                                name={'untilPrefix'}
                                hasFeedback
                                label={
                                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                    Cloud Location - Until Prefix:
                                    <HelpIcon id={'dataset_upload_cloud_location_until_prefix'} style={{ marginLeft: '4px' }} />
                                  </span>
                                }
                              >
                                <Input placeholder="" />
                              </Form.Item>
                            )}

                            {!this.state.askIsPrefixes && (
                              <Form.Item
                                name={'locationDateFormat'}
                                hasFeedback
                                label={
                                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                    Look Back - Location Date Format:
                                    <HelpIcon id={'dataset_upload_lookback_location_date_format'} style={{ marginLeft: '4px' }} />
                                  </span>
                                }
                              >
                                <Input placeholder="YYYY-MM-DD" />
                              </Form.Item>
                            )}
                            {!this.state.askIsPrefixes && (
                              <Form.Item
                                name={'dateFormatLookbackDays'}
                                hasFeedback
                                label={
                                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                    Look Back - Lookback Days:
                                    <HelpIcon id={'dataset_upload_lookback_date_format_lookback_days'} style={{ marginLeft: '4px' }} />
                                  </span>
                                }
                              >
                                <InputNumber min={0} max={999999} />
                              </Form.Item>
                            )}
                          </div>
                        )}
                      </Panel>
                    </Collapse>
                  </div>
                )}

                {isPreview && <PreviewDataRows file={this.state.fileSel} />}

                <div
                  css={`
                    margin-top: 10px;
                  `}
                >
                  &nbsp;
                </div>

                {anySelected && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.S3 && <InputCron onChange={this.onChangeCronValue} style={{ marginTop: '10px' }} />}

                <Form.Item style={{ marginBottom: '1px' }}>
                  <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '0 -22px' }}></div>
                  <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                    <Button disabled={!anySelected} type="primary" htmlType="submit" className="login-form-button">
                      {newVersionDatasetId ? 'Upload New Dataset Version' : isStreaming ? 'Set-up Streaming Dataset' : 'Add Dataset'}
                    </Button>
                    {!isPreview && Constants.flagPreviewUpload === true && canPreview && this.state.fileSel != null && (
                      <Button type="default" ghost style={{ marginLeft: '16px' }} onClick={this.onClickViewPreview}>
                        Preview Data before Upload
                      </Button>
                    )}
                    {isPreview && (
                      <Button type="default" style={{ marginLeft: '16px' }} onClick={this.onClickBackFromPreview}>
                        Back
                      </Button>
                    )}
                  </div>
                </Form.Item>
              </FormExt>
            </Card>
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            {!isPreview && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.S3 && this.state.useCloudServiceSel === EUploadCloudServiceType.AWS && (
              <HelpBox isBig={true} name={'Need more help with uploading data?'} subtitle={'Refer to'} subtitle2={'Connect your AWS S3 Bucket Documentation'} linkTo={'/help/connectors/s3'} />
            )}
            {!isPreview && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.S3 && this.state.useCloudServiceSel === EUploadCloudServiceType.GoogleCloud && (
              <HelpBox isBig={true} name={'Need more help with uploading data?'} subtitle={'Refer to'} subtitle2={'Connect your Google Cloud Platform Bucket Documentation'} linkTo={'/help/connectors/gcs'} />
            )}
            {!isPreview &&
              newVersionDatasetId == null &&
              this.state.useTypeSel === EUploadDatasetType.S3 &&
              this.state.useCloudServiceSel !== EUploadCloudServiceType.AWS &&
              this.state.useCloudServiceSel !== EUploadCloudServiceType.GoogleCloud &&
              dbSelServiceId === 'snowflake' && <HelpBox isBig={true} name={'Need more help with uploading data?'} subtitle={'Refer to'} subtitle2={'Connect your Snowflake Database Documentation'} linkTo={'/help/connectors/snowflake'} />}
            {!isPreview &&
              newVersionDatasetId == null &&
              this.state.useTypeSel === EUploadDatasetType.S3 &&
              this.state.useCloudServiceSel !== EUploadCloudServiceType.AWS &&
              this.state.useCloudServiceSel !== EUploadCloudServiceType.GoogleCloud &&
              dbSelServiceId === 'salesforce' && (
                <HelpBox isBig={true} name={'Need more help with uploading data?'} subtitle={'Refer to'} subtitle2={'Connect your Salesforce Database Documentation'} linkTo={'/help/connectors/salesforce'} />
              )}

            {!isPreview && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.FileUpload && this.props.paramsProp?.get('useCase') != null && (
              <HelpBox
                isBig={true}
                name={'Need more help adding dataset with appropriate schema?'}
                subtitle={'Refer to'}
                subtitle2={'Use-case specific schema'}
                linkTo={'/help/useCases/' + this.props.paramsProp?.get('useCase') + '/datasets'}
              />
            )}
            {!isPreview && newVersionDatasetId == null && this.state.useTypeSel === EUploadDatasetType.Streaming && (
              <HelpBox isBig={true} name={'Need help with setting-up Streaming Dataset?'} subtitle={'Refer to'} subtitle2={'Streaming Docs'} linkTo={'/help/useCases/DATA_INGESTION_STREAMING'} />
            )}
          </div>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    defDatasets: state.defDatasets,
    projects: state.projects,
    useCases: state.useCases,
    fileConnectors: state.fileConnectors,
    databaseConnectors: state.databaseConnectors,
    databaseConnectorOptions: state.databaseConnectorOptions,
    databaseConnectorObjects: state.databaseConnectorObjects,
    databaseConnectorObjectSchema: state.databaseConnectorObjectSchema,
    batchPred: state.batchPred,
    fileConnectorOptions: state.fileConnectorOptions,
  }),
  null,
)(DatasetNewOneUploadStep2);
