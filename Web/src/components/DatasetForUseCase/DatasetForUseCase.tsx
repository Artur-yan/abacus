import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button, { ButtonType } from 'antd/lib/button';
import { NativeButtonProps } from 'antd/lib/button/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import { ModalFuncProps } from 'antd/lib/modal';
import confirm from 'antd/lib/modal/confirm';
import Popover from 'antd/lib/popover';
import Radio from 'antd/lib/radio';
import * as Immutable from 'immutable';
import $ from 'jquery';
import _ from 'lodash';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import REUploads_ from '../../api/REUploads';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import batchPred from '../../stores/reducers/batchPred';
import datasets, { calcDatasetById, DatasetLifecycle, DatasetLifecycleDesc, ProjectDatasetLifecycle } from '../../stores/reducers/datasets';
import { calcDefaultModelName } from '../../stores/reducers/defaultModelName';
import defDatasets from '../../stores/reducers/defDatasets';
import projects, { memProjectById } from '../../stores/reducers/projects';
import projectsSamples from '../../stores/reducers/projectsSamples';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import FormItemFileUpload from '../FormItemFileUpload/FormItemFileUpload';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModalConfirmCreateNewVersion from '../ModalConfirmCreateNewVersion/ModalConfirmCreateNewVersion';
import ModalProgress from '../ModalProgress/ModalProgress';
import PartsLink from '../NavLeft/PartsLink';
import PreviewFieldsRect from '../PreviewFieldsRect/PreviewFieldsRect';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TextMax from '../TextMax/TextMax';
import TooltipExt from '../TooltipExt/TooltipExt';
import { ProjectDatasetType } from './ProjectDatasetType';
const s = require('./DatasetForUseCase.module.css');
const sd = require('../antdUseDark.module.css');

interface IDatasetForUseCaseProps {
  paramsProp?: any;
  useCases?: any;
  datasets?: any;
  projects?: any;
  projectsSamples?: any;
  defDatasets?: any;
  authUser?: any;
  defaultModelName?: any;
  batchPred?: any;
  style?: CSSProperties;
  isBatchPred?: boolean;
  isBatchPredDataset?: boolean;
  isDash?: boolean;
  isSchemaMapping?: boolean;
  useCase?: string;
  projectId?: string;
  useCaseTag?: any;
  isActive?: boolean;
  anyModel?: boolean;
  anyPnpLocationUsed?: boolean;
  lastModelId?: any;
  featureGroupsCount?: number;
}

interface IDatasetForUseCaseState {
  isRefreshing?: boolean;
  isRefreshingFull?: boolean;
  isProcessing?: boolean;
  uploadActual?: number;
  uploadTotal?: number;
  usedSampleDataset?: boolean;
  isPnpTypeFiles?: boolean;
  pnpLocation?: string;
  pnpName?: string;
  expanded: any;
}

let alreadyConfirmDatasetId = [];

class DatasetForUseCase extends React.PureComponent<IDatasetForUseCaseProps, IDatasetForUseCaseState> {
  private doUploadUuid: any;
  private isM: boolean;
  private confirmUsed: { destroy: (...args: any[]) => void; update: (newConfig: ModalFuncProps) => void };
  private needToFinish: any[];
  private modalProgress: any;
  private filesToUpload: any;
  private filesToUploadRequired: any;
  private filesToUploadNames: any;
  private refUploads: any;
  private confirmFix: any;

  constructor(props) {
    super(props);

    this.state = {
      isPnpTypeFiles: true,
      pnpLocation: '',
      expanded: {},
    };
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.doClose();

    this.isM = false;

    if (this.confirmFix != null) {
      this.confirmFix.destroy();
      this.confirmFix = null;
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

    let projectId = this.calcParam('projectId');
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let sampleDatasetList = this.memSamplesProject(true)(this.props.projectsSamples, projectId);

    let validationData = this.props.isSchemaMapping ? this.memValidation(true)(this.props.defDatasets, projectId) : null;

    let useCaseParam = this.calcParam('useCase');

    let info = this.memUseCaseSchemas(true)(this.props.useCases, useCaseParam);
    let infoAll = this.memUseCaseSchemasAll(true)(this.props.useCases, useCaseParam);

    //
    let isWizardHelp = !!this.calcParam('stepByStep');
    let isPnp = foundProject1?.isPnp ?? false;
    if (this.props.paramsProp?.get('dd') === 'pnp') {
      isPnp = true;
    }

    let batchPredId = this.props.paramsProp?.get('batchPredId');

    if (isPnp) {
      let modelDefaultName = this.memModelDefaultName(true)(this.props.defaultModelName, projectId);
    }

    let batchPredOne;
    if (this.props.isBatchPred) {
      batchPredOne = this.memBatchPred(true)(this.props.batchPred, batchPredId);
      this.memBatchGetDatasets(true)(this.props.batchPred, batchPredOne);
    }

    let dataListRes = this.memDataList(
      this.props.batchPred,
      batchPredOne,
      batchPredId,
      foundProject1,
      this.props.lastModelId,
      this.props.anyModel,
      this.props.anyPnpLocationUsed,
      useCaseParam,
      this.filesToUpload,
      isPnp,
      isWizardHelp,
      info,
      projectId,
      projects,
      this.props.datasets,
      this.props.isDash,
      this.props.isSchemaMapping,
      this.state.isPnpTypeFiles,
    );
    let dataList = dataListRes?.list;

    let useConfirmModalRes = this.memUseConfirm(this.props.projects);
    let useConfirmModal = useConfirmModalRes?.useConfirmModal;
    this.memFinishConfirm(dataList, useConfirmModal);
    if (this.props.isSchemaMapping) {
      let datasetIdSchemaRes = this.props.isSchemaMapping ? this.memValidDataset(validationData, dataList, projectId) : null;
      let datasetIdSchema = datasetIdSchemaRes?.res ?? datasetIdSchemaRes?.resFirst;
      let anyNeedFix = datasetIdSchemaRes?.anyNeedFix;
      let anyProcessing = datasetIdSchemaRes?.anyProcessing;

      this.memFixModal(anyNeedFix, anyProcessing, '/' + PartsLink.dataset_schema + '/' + datasetIdSchema + '/' + projectId);
    }
  };

  componentDidUpdate(prevProps: Readonly<IDatasetForUseCaseProps>, prevState: Readonly<IDatasetForUseCaseState>, snapshot?: any): void {
    this.doMem();
  }

  calcParamsQueryActual = (otherProps = {}) => {
    let { paramsProp } = this.props;
    if (!paramsProp) {
      return {};
    }

    let res: any = _.assign(
      {
        datasetType: paramsProp.get('datasetType'),
        useCase: this.calcParam('useCase'),
        useCaseTag: this.calcParam('useCaseTag'),
        returnToUseCase: true,
        stepByStep: this.calcParam('stepByStep'),
      },
      otherProps || {},
    );
    return Utils.processParamsAsQuery(res);
  };

  onClickReimportPnpData = (modelId, projectId, e) => {
    if (modelId) {
      this.setState({
        isRefreshing: true,
      });
      REClient_.client_().createModelVersionFromFiles(modelId, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

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

  onClickReadNewVersion = (datasetId, projectId, sourceType, databaseConnectorId, newLocation, mergeFileSchemas, e) => {
    const doAllWork = (columns: string) => {
      let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

      if (datasetId) {
        this.setState({
          isRefreshing: true,
        });

        const doWork = (err, res) => {
          this.setState({
            isRefreshing: false,
          });

          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.listDatasetsVersions_(datasetId, () => {
              StoreActions.getProjectsList_();
              StoreActions.listDatasets_([datasetId]);
              StoreActions.getProjectsById_(projectId);
              StoreActions.listModels_(projectId);
              StoreActions.getProjectDatasets_(projectId);
              StoreActions.validateProjectDatasets_(projectId);

              StoreActions.refreshDoDatasetAll_(datasetId, projectId);
            });
          }
        };

        REClient_.client_().importDatasetVersion(datasetId, newLocation, null, null, mergeFileSchemas, (err, res) => {
          doWork(err, res);
        });
      }
    };

    if (sourceType?.toLowerCase() === 'external_service' && !Utils.isNullOrEmpty(databaseConnectorId)) {
      Location.push('/' + PartsLink.dataset_external_import_new_version + '/' + datasetId + '/' + projectId);
    } else {
      doAllWork(null);
    }
  };

  memBatchPred = memoizeOneCurry((doCall, batchPredParam, batchPredId) => {
    return batchPred.memBatchDescribe(undefined, batchPredId, doCall);
  });

  memBatchGetDatasets = memoizeOneCurry((doCall, batchPredParam, batchPredOne) => {
    let ids = batchPredOne?.batchInputs?.datasets?.map((v1) => v1.datasetId);
    if (ids != null && ids.length > 0) {
      return datasets.memDatasetListCall(doCall, undefined, ids);
    }
  });

  calcBatchDatasetsTypes = (batchPredOne) => {
    let batchDatasetsTypes = [];
    let batchDatasets = batchPredOne?.batchInputs?.featureGroupDatasets?.map((f1, f1ind) => {
      let res = { ...(f1?.originalDataset ?? {}) };
      res.default = true;

      if (f1?.hasReplacementDataset === true) {
        res = { ...(f1?.replacementDataset ?? {}) };
        res.default = false;
      }

      //
      let v1 = res.featureGroupTableName;
      res.datasetType = v1;

      if (!batchDatasetsTypes.includes(v1)) {
        batchDatasetsTypes.push(v1);
      }

      return res;
    });

    return { batchDatasets, batchDatasetsTypes };
  };

  memDataList: (
    batchPredParam,
    batchPredOne,
    batchPredId,
    projectFound1,
    lastModelId,
    anyModel,
    anyPnpLocationUsed,
    useCase,
    filesToUpload,
    isPnp,
    isWizardHelp,
    info,
    projectId,
    projects,
    datasets,
    isDash,
    isSchemaMapping,
    isPnpTypeFiles,
  ) => { list: any[]; isAllOk: boolean; disableForceContinue: boolean } = memoizeOne(
    (batchPredParam, batchPredOne, batchPredId, projectFound1, lastModelId, anyModel, anyPnpLocationUsed, useCase, filesToUpload, isPnp, isWizardHelp, info, projectId, projects, datasets, isDash, isSchemaMapping, isPnpTypeFiles) => {
      if (info) {
        let infoList = [],
          anySecondaryTable = false;

        let isBatchDataset = !!this.props.isBatchPredDataset;
        let batchDatasets = null,
          batchDatasetsTypes = [];
        if (batchPredOne && isBatchDataset) {
          let r1 = this.calcBatchDatasetsTypes(batchPredOne);
          batchDatasetsTypes = r1?.batchDatasetsTypes;
          batchDatasets = r1?.batchDatasets;
        }

        let datasetTypeAlready = {},
          datasetTypeWithDatasetId = {},
          datasetTypeLifecycle = {},
          datasetOneByDatasetType = {},
          streamingDatasetOneByDatasetType = {},
          disableForceContinue = false;
        let datasetDetached = {},
          batchUseDefault = {},
          batchUsedDatasetType = {};
        if (projectFound1) {
          let datasetInProject = projectFound1.allProjectDatasets;
          if (batchPredOne != null) {
            if (!isBatchDataset) {
              let ddBatch = isBatchDataset ? batchDatasets : batchPredOne?.batchInputs?.featureGroups;
              datasetInProject = ddBatch
                ?.map((d1, d1ind) => {
                  if (d1 == null) {
                    return null;
                  }

                  batchUsedDatasetType[d1.datasetType] = true;
                  if (!d1?.default) {
                    let dIP = { ...(d1 ?? {}) };
                    dIP.featureGroupId = d1.featureGroupId;
                    return dIP;
                  } else {
                    if (d1?.default === true) {
                      batchUseDefault[d1.datasetType] = true;
                    }
                    return null;
                  }
                })
                ?.filter((v1) => v1 != null);
            } else {
              let ddBatch = isBatchDataset ? batchDatasets : batchPredOne?.batchInputs?.datasets;
              datasetInProject = ddBatch
                ?.map((d1, d1ind) => {
                  batchUsedDatasetType[d1.datasetType] = true;
                  if (!d1?.default) {
                    let dIP = calcDatasetById(undefined, d1.datasetId)?.toJS();
                    if (dIP == null && isBatchDataset) {
                      dIP = { ...d1 };
                    }
                    if (dIP != null) {
                      dIP.datasetType = d1.datasetType;
                    }
                    return dIP;
                  } else {
                    if (d1?.default === true) {
                      batchUseDefault[d1.datasetType] = true;
                    }
                    return null;
                  }
                })
                ?.filter((v1) => v1 != null);
            }
          }

          if (datasetInProject && datasetInProject.length > 0) {
            datasetInProject.some((ds1) => {
              let datasetId1 = ds1.dataset?.datasetId;
              let datasetType1 = ds1.datasetType;

              if (isBatchDataset) {
                let remap1 = batchPredOne?.batchInputs?.datasetIdRemap;
                if (remap1) {
                  let bdsID1 = batchPredOne?.batchInputs?.featureGroupDatasets?.find((d2) => {
                    if (d2?.originalDataset?.featureGroupTableName === datasetType1) {
                      return d2?.originalDataset;
                    } else if (d2?.replacementDataset?.featureGroupTableName === datasetType1) {
                      return d2?.replacementDataset;
                    } else {
                      return false;
                    }
                  })?.datasetId;
                  if (bdsID1) {
                    datasetId1 = bdsID1;
                  }
                }
              }

              datasetType1 += '$$$' + datasetId1;

              if (batchPredOne && !batchUsedDatasetType[ds1.datasetType] && !isBatchDataset) {
                return false;
              }

              infoList.push(datasetType1);

              if (ds1 && ds1.status === ProjectDatasetLifecycle.DETACHED) {
                datasetDetached[datasetId1] = true;
                return false;
              }
              if (datasetType1) {
                let lastDataset = datasetOneByDatasetType[datasetType1];

                let dsTemp = calcDatasetById(undefined, datasetId1);
                if (dsTemp) {
                  datasetTypeLifecycle[datasetType1] = dsTemp.get('status');
                  datasetOneByDatasetType[datasetType1] = dsTemp;
                } else {
                  datasetTypeLifecycle[datasetType1] = ds1.dataset?.lastVersion?.status;
                  datasetOneByDatasetType[datasetType1] = ds1;
                }

                if (lastDataset != null) {
                  let lastIsStreaming;
                  if (Immutable.isImmutable(lastDataset)) {
                    lastIsStreaming = (lastDataset.getIn(['sourceType']) as any)?.toLowerCase() == 'streaming';
                  } else {
                    lastIsStreaming = lastDataset?.sourceType?.toLowerCase() == 'streaming';
                  }
                  if (lastIsStreaming) {
                    streamingDatasetOneByDatasetType[datasetType1] = lastDataset;
                  } else {
                    let newIsStreaming;
                    if (Immutable.isImmutable(datasetOneByDatasetType[datasetType1])) {
                      newIsStreaming = datasetOneByDatasetType[datasetType1].getIn(['sourceType'])?.toLowerCase() == 'streaming';
                    } else {
                      newIsStreaming = datasetOneByDatasetType[datasetType1]?.sourceType?.toLowerCase() == 'streaming';
                    }
                    if (newIsStreaming) {
                      streamingDatasetOneByDatasetType[datasetType1] = datasetOneByDatasetType[datasetType1];
                      datasetOneByDatasetType[datasetType1] = lastDataset;
                    } else if (lastIsStreaming) {
                      streamingDatasetOneByDatasetType[datasetType1] = lastDataset;
                    }
                  }
                }

                datasetTypeAlready[datasetType1] = true;
                datasetTypeWithDatasetId[datasetType1] = datasetId1;
              }
            });

            if (anySecondaryTable && !batchPredOne) {
              infoList.push(ProjectDatasetType.SECONDARY_TABLE);
            }
          }
        }

        let processList = (info, infoList) => {
          let isAllOk = true,
            anyUpload = false;

          infoList?.some((sc1) => {
            let dataset1Type = sc1;
            if (datasetTypeAlready[dataset1Type] || datasetTypeLifecycle[dataset1Type]) {
              if (datasetTypeLifecycle[dataset1Type] === DatasetLifecycle.COMPLETE && !datasetDetached[datasetTypeWithDatasetId[dataset1Type]]) {
                anyUpload = true;
              }
            }
          });

          let infoListTemp = infoList;
          if (isPnp && isDash) {
            infoListTemp = infoListTemp?.slice(0, 1);
          }

          if (infoListTemp && infoListTemp.length > 0 && (!batchPredOne || isBatchDataset)) {
            let alreadyD = {};
            let listFirst = [];
            infoListTemp.some((sc1, sc1ind) => {
              let datasetTypeSC = sc1;
              if (datasetTypeSC != null && datasetTypeSC.indexOf('$$$') > -1) {
                datasetTypeSC = datasetTypeSC.substring(0, datasetTypeSC.indexOf('$$$'));
              }

              if (!alreadyD[datasetTypeSC]) {
                alreadyD[datasetTypeSC] = true;
                listFirst.push(datasetTypeSC);
              }
            });

            if (listFirst.length > 0) {
              let listR = [];
              listFirst.some((s1) => {
                let ss = infoListTemp.filter((v1) => _.startsWith(v1, s1));
                if (ss.length > 1 && ss[0] === s1) {
                  ss = ss.slice(1);
                  if (batchPredId || isDash) {
                    ss.push(s1);
                  }
                }
                listR = listR.concat(ss);
              });
              infoListTemp = listR;
            }
          }

          let res = !infoListTemp
            ? []
            : infoListTemp
                ?.map((sc1, sc1ind) => {
                  let datasetTypeSC = sc1;
                  if (datasetTypeSC != null && datasetTypeSC.indexOf('$$$') > -1) {
                    datasetTypeSC = datasetTypeSC.substring(0, datasetTypeSC.indexOf('$$$'));
                  }

                  let infoTag = info?.list?.find((v1) => info?.[v1]?.dataset_type?.toLowerCase() === datasetTypeSC?.toLowerCase());
                  let dataset1 = info?.[infoTag];
                  if (isBatchDataset) {
                    //
                  } else {
                    if (dataset1 == null) {
                      return null;
                    }
                    if (dataset1?.isCustom && !isDash) {
                      return null;
                    }
                  }
                  let dataset1Type = sc1; //dataset1?.dataset_type;

                  if (isBatchDataset) {
                    let kk = Object.keys(datasetOneByDatasetType ?? {});
                    let k2 = kk.find((k1) => _.startsWith(k1, sc1));

                    if (
                      datasetTypeLifecycle[k2] == null ||
                      [DatasetLifecycle.COMPLETE, DatasetLifecycle.CANCELLED, DatasetLifecycle.FAILED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED].includes(datasetTypeLifecycle[k2])
                    ) {
                      //
                    } else {
                      dataset1Type = k2;
                    }
                  }

                  let isRequired = dataset1?.is_required;
                  let showInWizard = dataset1?.show_in_wizard;
                  let datasetOri = datasetOneByDatasetType[dataset1Type];
                  let datasetError = Immutable.isImmutable(datasetOri) ? datasetOri?.get('error') : datasetOri?.dataset?.lastVersion?.error;
                  let buttonActionClass = '';
                  let isUploaded = false,
                    isProcessing = false,
                    isUploadError = false;
                  let actionString: any = batchPredId ? (
                      <span>
                        {'Upload / Attach'}
                        <br />
                        Pred. {!isBatchDataset ? 'Feature Group' : 'Dataset'}
                      </span>
                    ) : isPnp ? (
                      anyPnpLocationUsed ? (
                        'Re-Import New Version'
                      ) : anyModel ? (
                        'File Upload New Version'
                      ) : (
                        'File Upload'
                      )
                    ) : (
                      'Create or Attach Dataset'
                    ),
                    actionType: ButtonType = 'primary';
                  if (datasetTypeAlready[dataset1Type] || datasetTypeLifecycle[dataset1Type]) {
                    actionType = 'default';

                    buttonActionClass = s.buttonDone;
                    if ([DatasetLifecycle.CANCELLED, DatasetLifecycle.FAILED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED].includes(datasetTypeLifecycle[dataset1Type])) {
                      isUploadError = true;
                    }

                    if (datasetTypeLifecycle[dataset1Type] === DatasetLifecycle.COMPLETE && !datasetDetached[datasetTypeWithDatasetId[dataset1Type]]) {
                      isUploaded = true;
                      actionString = (
                        <span>
                          <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 15, x: 0, y: 0 }} style={{ color: '#33ac2e', marginRight: '9px' }} />
                          Uploaded
                        </span>
                      );
                    } else {
                      let showIcon = ![DatasetLifecycle.FAILED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED, DatasetLifecycle.CANCELLED].includes(datasetTypeLifecycle[dataset1Type]);
                      if (showIcon) {
                        isProcessing = true;
                      }
                      actionString = (
                        <span>
                          {showIcon && <FontAwesomeIcon icon={'sync'} spin transform={{ size: 14, x: 0, y: 0 }} style={{ color: '#434fac', marginRight: '9px' }} />}
                          {DatasetLifecycleDesc[datasetTypeLifecycle[dataset1Type] ?? DatasetLifecycle.COMPLETE]}
                        </span>
                      );
                    }
                  } else {
                    if (isRequired) {
                      if (batchPredId) {
                        //
                      } else if (batchPredOne && batchUseDefault[dataset1Type]) {
                        //
                      } else {
                        isAllOk = false;
                      }
                    }
                  }

                  if (isPnp && !isDash) {
                    if (this.filesToUpload?.[sc1] != null) {
                      isUploaded = true;
                      actionString = (
                        <span>
                          <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 15, x: 0, y: 0 }} style={{ color: '#33ac2e', marginRight: '9px' }} />
                          Selected
                        </span>
                      );
                    }
                  }

                  let description1 = null;
                  let name1 = null;
                  let scData = info?.[infoTag];
                  name1 = scData?.title;
                  description1 = scData?.description;

                  if (name1 == null) {
                    name1 = dataset1?.name;
                  }
                  if (isBatchDataset) {
                    name1 = batchDatasets?.find((d1) => d1?.datasetType === sc1)?.name;
                  }

                  if (isPnp && isDash) {
                    name1 = 'Artifacts';
                  }

                  if (name1 == null) {
                    name1 = '';
                  }
                  if (batchPredOne && name1) {
                    name1 = (isBatchDataset ? 'Dataset: ' : 'Feature Group Type: ') + name1;
                  }
                  if (!isDash && !batchPredOne) {
                    if (isRequired) {
                      name1 += ' (Required)';
                    } else if (datasetTypeSC?.toLowerCase() === ProjectDatasetType.SECONDARY_TABLE.toLowerCase()) {
                      name1 += ' (Optional)';
                    }
                  }

                  let icon1: any = 'icon-historical-data.png';
                  icon1 = info?.[infoTag]?.icon ?? icon1;
                  if (icon1 != null) {
                    if (_.endsWith(icon1, '.png') || _.endsWith(icon1, '.jpg')) {
                      icon1 = (
                        <div
                          style={{
                            display: 'inline-block',
                            height: '44px',
                            width: '44px',
                            backgroundPosition: 'center',
                            backgroundImage: 'url(' + calcImgSrc('/imgs/' + icon1) + ')',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'contain',
                          }}
                        />
                      );
                    } else {
                      icon1 = null;
                    }
                  }

                  let dsNameT;
                  let datasetTypeS;
                  let dsDatasetIdT;
                  let sourceType;
                  let versionCount;
                  let databaseConnectorId;
                  let dsLocation;

                  let streamingDS;
                  let streamingDataset;
                  let streamingDatasetId;
                  let streamingDatasetName;
                  let streamingDatasetVersionCount;
                  if (Immutable.isImmutable(datasetOri)) {
                    dsNameT = datasetOri?.getIn(['dataset', 'name']);
                    dsDatasetIdT = datasetOri?.getIn(['dataset', 'datasetId']);
                    datasetTypeS = dataset1Type;
                    sourceType = (datasetOri?.getIn(['sourceType']) as any)?.toLowerCase();
                    versionCount = datasetOri?.getIn(['dataset', 'versionCount']);
                    databaseConnectorId = datasetOri?.getIn(['databaseConnectorId']);
                    streamingDS = streamingDatasetOneByDatasetType[datasetTypeS];
                    dsLocation = datasetOri?.getIn(['location']);
                  } else {
                    dsNameT = datasetOri?.dataset?.name;
                    dsDatasetIdT = datasetOri?.dataset?.datasetId;
                    datasetTypeS = dataset1Type;
                    sourceType = datasetOri?.dataset?.sourceType?.toLowerCase();
                    versionCount = datasetOri?.dataset?.versionCount;
                    databaseConnectorId = datasetOri?.databaseConnectorId;

                    streamingDS = streamingDatasetOneByDatasetType[datasetTypeS];
                    dsLocation = datasetOri?.location;
                  }

                  let aaProps: any = {};
                  if ((isUploaded || (isProcessing && versionCount > 1)) && !(isPnp && !isDash) && !isUploadError) {
                    aaProps.onClick = () => {
                      Location.push('/' + PartsLink.dataset_detail + '/' + Utils.encodeRouter(datasetTypeWithDatasetId[dataset1Type]) + '/' + projectId);
                    };
                  }

                  if (isPnp) {
                    if (!anyPnpLocationUsed) {
                      let paramModel1 = '';
                      if (!Utils.isNullOrEmpty(lastModelId)) {
                        paramModel1 = '&newVersionForModel=' + lastModelId;
                      }

                      aaProps.onClick = () => {
                        Location.push('/' + PartsLink.dataset_for_usecase + '/' + projectId, undefined, 'useCase=' + useCase + '&useCaseTag=true' + paramModel1);
                      };
                    } else {
                      aaProps.onClick = null;
                    }
                  }

                  let styleButtonAction: CSSProperties = {},
                    styleButtonActionExtra: CSSProperties = {};
                  if (isDash) {
                    styleButtonAction = { width: '100%' };
                    styleButtonActionExtra = { width: '100%', borderColor: 'transparent' };
                  }

                  if (!isUploaded && anyUpload && !isProcessing && !isRequired) {
                    actionType = 'default';
                    aaProps.ghost = true;
                  }
                  if (isUploaded) {
                    styleButtonAction.backgroundColor = 'transparent';
                    styleButtonAction.border = 'none';
                  }

                  if (isPnp && !isDash && !isUploaded && !isProcessing) {
                    aaProps.onClick = (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      $(this.refUploads[datasetTypeS]?.current).click();
                    };
                  } else if (isWizardHelp && !isUploaded && !isProcessing && !this.state.usedSampleDataset) {
                    disableForceContinue = true;
                    aaProps.onClick = (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      this.useSampleDatasets();
                    };
                  }

                  if (streamingDS != null) {
                    if (Immutable.isImmutable(streamingDS)) {
                      streamingDS = streamingDS.get('dataset');
                      if (streamingDS != null) {
                        streamingDataset = streamingDS;
                        streamingDatasetId = streamingDS?.getIn(['datasetId']);
                        streamingDatasetName = streamingDS?.getIn(['name']);
                        streamingDatasetVersionCount = streamingDS?.getIn(['versionCount']);
                      }
                    } else {
                      streamingDS = streamingDS.dataset;
                      if (streamingDS != null) {
                        streamingDataset = streamingDS;
                        streamingDatasetId = streamingDS?.datasetId;
                        streamingDatasetName = streamingDS?.name;
                        streamingDatasetVersionCount = streamingDS?.versionCount;
                      }
                    }
                  }

                  const versionCountElemPrevious =
                    versionCount == null || versionCount < 2 ? null : (
                      <span className={sd.styleTextGreen} style={{ color: 'white', opacity: 0.9 }}>
                        {' '}
                        - Version&nbsp;{versionCount - 1}
                      </span>
                    );
                  const versionCountElem =
                    versionCount == null || versionCount < 2 ? null : (
                      <span className={sd.styleTextGreen} style={{ color: 'white', opacity: 0.9 }}>
                        {' '}
                        - Version&nbsp;{versionCount}
                      </span>
                    );

                  const streamingVersionCountElem = streamingDatasetVersionCount ? (
                    streamingDatasetVersionCount == null || streamingDatasetVersionCount < 2 ? null : (
                      <span className={sd.styleTextGreen} style={{ color: 'white', opacity: 0.9 }}>
                        {' '}
                        - Version&nbsp;{streamingDatasetVersionCount}
                      </span>
                    )
                  ) : (
                    versionCountElem
                  );

                  let actionStringPrevious = null;
                  if (isProcessing && isDash && !isSchemaMapping && versionCountElemPrevious != null) {
                    actionStringPrevious = <span>&nbsp;Version {versionCount}</span>;
                  }

                  const oldSampleS3prefix = 's3://realityengines.exampledatasets/';
                  const sampleS3prefix = 's3://abacusai.exampledatasets/';

                  if (sourceType === 'external_service') {
                    if (Immutable.isImmutable(datasetOri)) {
                      if (_.startsWith((datasetOri.get('location') as string) ?? '', sampleS3prefix) || _.startsWith((datasetOri.get('location') as string) ?? '', oldSampleS3prefix)) {
                        sourceType = 'sample';
                      }
                    } else {
                      sourceType = ''; //don't use it (is not from gql)
                    }
                  }
                  const isStreaming = sourceType === 'streaming';

                  if (batchPredId) {
                    styleButtonAction.height = '54px';
                  }

                  let dsStream = sourceType === 'streaming';
                  let streamingActionButton: any = null;
                  let actionButton: any = (
                    <Button {...aaProps} style={styleButtonAction} type={actionType}>
                      {actionString}
                      {actionStringPrevious}
                    </Button>
                  );

                  if (isPnp && anyPnpLocationUsed) {
                    actionButton = (
                      <ModalConfirm
                        onConfirm={this.onClickReimportPnpData.bind(this, this.props.lastModelId, projectId)}
                        title={`Do you want Re-Import all files and train a new model?`}
                        icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                        okText={'Re-Import'}
                        cancelText={'Cancel'}
                        okType={'primary'}
                      >
                        {actionButton}
                      </ModalConfirm>
                    );
                  } else if (isWizardHelp && !isUploaded && !isProcessing && !this.state.usedSampleDataset && sc1ind === 0) {
                    actionButton = (
                      <span style={{ border: '3px solid #00f8c5', padding: '14px 6px', position: 'relative' }}>
                        <img src={calcImgSrc('/imgs/helpPredStep4b.png')} alt={''} style={{ position: 'absolute', top: '210%', right: '-130px', width: '341px', cursor: 'pointer' }} />
                        {actionButton}
                      </span>
                    );
                  } else if (!isUploaded && !isPnp) {
                    let datasetErrorT = datasetError,
                      usedTruncateError = false;
                    if (!isDash && datasetErrorT) {
                      const maxT = 35;
                      if (_.isString(datasetErrorT) && datasetErrorT.length > maxT) {
                        usedTruncateError = true;
                        datasetErrorT = datasetErrorT.slice(0, maxT) + '...';
                      }
                    }
                    let errorText = datasetError ? (
                      <p style={_.assign({ color: 'red' }, isDash ? {} : { maxWidth: '120px' })}>
                        <TextMax max={200}>{datasetErrorT}</TextMax>
                      </p>
                    ) : null;
                    if (errorText != null && usedTruncateError) {
                      errorText = (
                        <TooltipExt title={datasetError} placement={'bottom'}>
                          {errorText}
                        </TooltipExt>
                      );
                    }

                    let linkT: any = ['/' + PartsLink.dataset_add + '/' + projectId, this.calcParamsQueryActual({ datasetType: dataset1Type, isDash: isDash })];
                    if (errorText || isUploadError) {
                      linkT = ['/' + PartsLink.dataset_upload_step2 + '/' + Utils.encodeRouter(dsNameT ?? 'abc') + '/' + (datasetTypeS ?? 'ERROR') + '/' + projectId, 'newVersion=' + dsDatasetIdT];
                    }
                    if (batchPredId) {
                      if (isBatchDataset) {
                        let bds1 = batchPredOne?.batchInputs?.featureGroupDatasets?.find((d2) => {
                          if (d2?.originalDataset?.featureGroupTableName === dataset1Type) {
                            return true;
                          } else if (d2?.replacementDataset?.featureGroupTableName === dataset1Type) {
                            return true;
                          } else {
                            return false;
                          }
                        });

                        linkT = [
                          '/' + PartsLink.dataset_add + '/' + projectId,
                          this.calcParamsQueryActual({ oriDatasetId: bds1?.originalDataset?.datasetId, returnToUseCaseCreate: 'true', isDataset: true, datasetType: 'AAA', isDash: isDash }),
                        ];
                        // linkT = ['/'+PartsLink.dataset_attach+'/'+projectId, this.calcParamsQueryActual({ oriDatasetId: bds1?.originalDataset?.datasetId, useCase: useCase, batchPredId, datasetType: 'AAA', isDash: true, returnToUseCaseCreate: 'true', isDataset: true, })];
                      } else {
                        linkT = ['/' + PartsLink.batchpred_add_fg + '/' + projectId + '/' + batchPredId, this.calcParamsQueryActual({ datasetType: dataset1Type, returnToUseCaseCreate: 'true' })];
                      }
                    }
                    if (isDash) {
                      if (errorText && !['upload'].includes(sourceType)) {
                        linkT = null;
                      }
                      if (isProcessing) {
                        linkT = null;
                      }
                    }
                    actionButton = (
                      <Link to={isWizardHelp ? null : linkT}>
                        {actionButton}
                        {errorText}
                      </Link>
                    );
                  }

                  let actionsExtra = null,
                    actionDatasetUploaded = null;
                  const lastActionButton = isUploaded || ['batch_prediction'].includes(sourceType) ? null : actionButton;
                  if (isUploaded || (!isProcessing && isUploadError)) {
                    if ((['streaming'].includes(sourceType) || streamingDataset) && isDash) {
                      let styleButtonActionUploaded = _.assign({}, styleButtonAction || {}) as CSSProperties;
                      styleButtonActionUploaded.color = '#1890ff';
                      styleButtonActionUploaded.display = 'inline-block';
                      styleButtonActionUploaded.width = '';
                      styleButtonActionUploaded.cursor = 'pointer';
                      actionButton = null;
                      streamingActionButton = (
                        <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                          <Link className={sd.styleTextBlue} to={'/' + PartsLink.dataset_detail + '/' + (streamingDatasetId || dsDatasetIdT) + '/' + projectId}>
                            {streamingDatasetName || dsNameT}
                          </Link>
                          {streamingVersionCountElem}&nbsp;
                          <Link className={sd.styleTextBlueBright} to={'/' + PartsLink.dataset_streaming + '/' + (streamingDatasetId || dsDatasetIdT) + '/' + projectId}>
                            <span style={styleButtonActionUploaded} className={sd.styleTextBlueBright}>
                              {'[Streaming]'}
                            </span>
                          </Link>
                        </span>
                      );
                    }
                    if (['external_service', 'upload', 'sample', 'batch_prediction'].includes(sourceType) && isDash) {
                      let styleButtonActionUploaded = _.assign({}, styleButtonAction || {}) as CSSProperties;
                      styleButtonActionUploaded.color = '#1890ff';
                      styleButtonActionUploaded.display = 'inline-block';
                      styleButtonActionUploaded.width = '';
                      styleButtonActionUploaded.cursor = 'pointer';

                      if (['batch_prediction'].includes(sourceType)) {
                        actionButton = (
                          <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                            <Link className={sd.styleTextBlue} to={'/' + PartsLink.dataset_detail + '/' + dsDatasetIdT + '/' + projectId}>
                              {dsNameT}
                            </Link>
                            {versionCountElem}&nbsp;
                            {/*<span onClick={this.onClickReadNewVersion.bind(this, dsDatasetIdT, projectId, sourceType, databaseConnectorId, null)} style={styleButtonActionUploaded} className={sd.styleTextBlueBright}>{'[Create New Version]'}</span>*/}
                          </span>
                        );

                        // actionsExtra = <span>
                        //   <ModalConfirm onConfirm={this.onClickReadNewVersion.bind(this, dsDatasetIdT, projectId, sourceType, databaseConnectorId, null)}
                        //                 title={`Do you want to create a new version of this Dataset?`}
                        //                 icon={<QuestionCircleOutlined style={{color: 'green'}} />} okText={'Create'}
                        //                 cancelText={'Cancel'} okType={'primary'}>
                        //     <Button type={'primary'} ghost style={styleButtonActionExtra}>{'Create New Version'}</Button>
                        //   </ModalConfirm>
                        // </span>;
                      } else if (['external_service'].includes(sourceType) && !Utils.isNullOrEmpty(databaseConnectorId)) {
                        actionButton = (
                          <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                            <Link className={sd.styleTextBlue} to={'/' + PartsLink.dataset_detail + '/' + dsDatasetIdT + '/' + projectId}>
                              {dsNameT}
                            </Link>
                            {versionCountElem}&nbsp;
                            <span onClick={this.onClickReadNewVersion.bind(this, dsDatasetIdT, projectId, sourceType, databaseConnectorId, null)} style={styleButtonActionUploaded} className={sd.styleTextBlueBright}>
                              {'[Create New Version]'}
                            </span>
                          </span>
                        );

                        actionsExtra = (
                          <span>
                            <ModalConfirm
                              onConfirm={this.onClickReadNewVersion.bind(this, dsDatasetIdT, projectId, sourceType, databaseConnectorId)}
                              title={`Do you want to create a new version of this Dataset?`}
                              icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                              okText={'Create'}
                              cancelText={'Cancel'}
                              okType={'primary'}
                            >
                              <Button type={'primary'} ghost style={styleButtonActionExtra}>
                                {'Create New Version'}
                              </Button>
                            </ModalConfirm>
                          </span>
                        );
                      } else if (['sample', 'external_service'].includes(sourceType)) {
                        actionButton = (
                          <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                            <Link className={sd.styleTextBlue} to={'/' + PartsLink.dataset_detail + '/' + dsDatasetIdT + '/' + projectId}>
                              {dsNameT}
                            </Link>
                            {versionCountElem}&nbsp;
                            {/*<ModalConfirm onConfirm={this.onClickReadNewVersion.bind(this, dsDatasetIdT, projectId, sourceType, databaseConnectorId, null)} title={`Do you want to create a new version of this Dataset?`} icon={<QuestionCircleOutlined style={{ color: 'green' }} />} okText={'Create'} cancelText={'Cancel'} okType={'primary'}>*/}
                            <ModalConfirmCreateNewVersion onConfirm={this.onClickReadNewVersion.bind(this, dsDatasetIdT, projectId, sourceType, databaseConnectorId)} showLocation={sourceType !== 'sample'} lastLocation={dsLocation}>
                              <span style={styleButtonActionUploaded} className={sd.styleTextBlueBright}>
                                {'[Create New Version]'}
                              </span>
                            </ModalConfirmCreateNewVersion>
                          </span>
                        );

                        actionsExtra = (
                          <span>
                            {/*<ModalConfirm onConfirm={this.onClickReadNewVersion.bind(this, dsDatasetIdT, projectId, sourceType, databaseConnectorId, null)} title={`Do you want to create a new version of this Dataset?`} icon={<QuestionCircleOutlined style={{ color: 'green' }} />} okText={'Create'} cancelText={'Cancel'} okType={'primary'}>*/}
                            <ModalConfirmCreateNewVersion onConfirm={this.onClickReadNewVersion.bind(this, dsDatasetIdT, projectId, sourceType, databaseConnectorId)} showLocation={sourceType !== 'sample'} lastLocation={dsLocation}>
                              <Button type={'primary'} ghost style={styleButtonActionExtra}>
                                {'Create New Version'}
                              </Button>
                            </ModalConfirmCreateNewVersion>
                          </span>
                        );
                      } else {
                        let link3 = '/' + PartsLink.dataset_detail + '/' + dsDatasetIdT + '/' + projectId;
                        actionButton = (
                          <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                            <Link className={sd.styleTextBlue} to={link3}>
                              {dsNameT}
                            </Link>
                            {versionCountElem}&nbsp;
                            <Link
                              to={['/' + PartsLink.dataset_upload_step2 + '/' + Utils.encodeRouter(dsNameT ?? 'abc') + '/' + (datasetTypeS ?? 'ERROR') + '/' + projectId, 'returnToDash=1&newVersion=' + dsDatasetIdT]}
                              style={{ cursor: 'pointer' }}
                            >
                              <span style={styleButtonActionUploaded} className={sd.styleTextBlueBright}>
                                [Upload New Version]
                              </span>
                            </Link>
                          </span>
                        );

                        actionsExtra = (
                          <span>
                            <Link
                              to={['/' + PartsLink.dataset_upload_step2 + '/' + Utils.encodeRouter(dsNameT ?? 'abc') + '/' + (datasetTypeS ?? 'ERROR') + '/' + projectId, 'returnToDash=1&newVersion=' + dsDatasetIdT]}
                              style={{ cursor: 'pointer' }}
                            >
                              <Button type={'primary'} ghost style={styleButtonActionExtra}>
                                Upload New Version
                              </Button>
                            </Link>
                          </span>
                        );
                      }
                    }
                    if (!isUploaded && (!isUploadError || isDash)) {
                      actionButton = (
                        <span>
                          <div>{lastActionButton}</div>
                          <div>{actionButton}</div>
                        </span>
                      );
                    }
                  }
                  if (isPnp && !isPnpTypeFiles) {
                    actionButton = null;
                  }

                  const actionPrevious =
                    versionCountElemPrevious == null ? null : (
                      <span style={{ marginBottom: '3px', display: 'inline-block', width: '100%', textAlign: 'center' }}>
                        <span className={sd.styleTextGreen}>{dsNameT}</span>
                        {versionCountElemPrevious}&nbsp;
                      </span>
                    );

                  const fileAccept = scData?.fileAccept;

                  return {
                    datasetTypeAlone: datasetTypeSC,
                    datasetType: dataset1Type,
                    name: name1,
                    actions: (
                      <span className={buttonActionClass}>
                        {actionButton}
                        {streamingActionButton}
                      </span>
                    ),
                    isUploaded,
                    actionsExtra,
                    actionPrevious,
                    isStreaming,
                    isRequired,
                    datasetName: dsNameT,
                    datasetId: datasetTypeWithDatasetId[dataset1Type],
                    icon: icon1,
                    actionDatasetUploaded,
                    isUploadError,
                    isProcessing,
                    description: description1,
                    stream: dsStream,
                    versionCount,
                    fileAccept,
                    datasetOri: sc1,
                    showInWizard: showInWizard,
                  };
                })
                ?.filter((v1) => v1 != null);

          return { res, isAllOk };
        };

        let infoListOri = info?.list?.map((v1) => info?.[v1]?.dataset_type)?.filter((v1) => v1 != null);
        if (batchPredOne) {
          if (isBatchDataset) {
            infoListOri = batchDatasets?.map((d1) => d1?.datasetType);
            infoList = infoListOri;
          } else {
            infoListOri = infoListOri?.filter((dt1) => {
              let ddBatch = isBatchDataset ? batchDatasets : batchPredOne?.batchInputs?.featureGroups;
              let dBatchOne = ddBatch?.find((v1) => v1.datasetType === dt1);
              return dBatchOne != null;
            });
            infoList = infoListOri;
          }
        } else if (infoList?.length === 0) {
          infoList = infoListOri;
        } else {
          let infoListTmp = infoList?.map((sc1) => {
            if (sc1 != null && sc1.indexOf('$$$') > -1) {
              sc1 = sc1.substring(0, sc1.indexOf('$$$'));
            }
            return sc1;
          });

          const hasSecondary = infoListOri.find((v1) => v1.toLowerCase() === ProjectDatasetType.SECONDARY_TABLE.toLowerCase()) != null;

          let infoListFinal = infoListOri.filter((v1) => v1.toLowerCase() !== ProjectDatasetType.SECONDARY_TABLE.toLowerCase());
          infoList.some((sc1) => {
            if (!infoListFinal?.includes(sc1)) {
              infoListFinal.push(sc1);
            }
          });

          if (hasSecondary && !infoListFinal?.includes(ProjectDatasetType.SECONDARY_TABLE)) {
            infoListFinal.push(ProjectDatasetType.SECONDARY_TABLE);
          }

          infoList = infoListFinal;
        }

        let listRes = processList(info, infoList);
        return { list: listRes?.res, isAllOk: listRes?.isAllOk, disableForceContinue };
      }
    },
  );

  onClickHideHelpStepByStep = (e) => {
    this.useSampleDatasets();
  };

  useSampleDatasets = () => {
    let projectId = this.calcParam('projectId');
    if (!projectId) {
      return;
    }

    this.setState({
      usedSampleDataset: true,
      isRefreshing: true,
    });

    REActions.addNotification('Processing Datasets, this will take a few minutes...');

    REClient_.client_()._useExampleDatasets(projectId, (err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (err || !res) {
        REActions.addNotificationError(err || 'Error processing samples');
      }

      let ids = res?.result?.datasets;
      if (ids) {
        this.needToFinish = [];

        let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

        ids.some((id1) => {
          if (!Utils.isNullOrEmpty(id1)) {
            this.needToFinish.push(id1);
            StoreActions.refreshDoDatasetAll_(id1, projectId);
          }
        });

        let useConfirmModalRes = this.memUseConfirm(this.props.projects);
        if (useConfirmModalRes?.useConfirmModal) {
          this.doProgressModal();
        }
      }

      StoreActions.getProjectsList_();
      StoreActions.listDatasets_(ids);
      StoreActions.getProjectsById_(projectId);
      StoreActions.validateProjectDatasets_(projectId);
      StoreActions.getProjectDatasets_(projectId);
      StoreActions.listModels_(projectId);

      let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
      StoreActions.featureGroupsGetByProject_(projectId, (list) => {
        list?.some((f1) => {
          StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
        });
      });
    });
  };

  onChangeFile = (datasetType, file1) => {
    this.filesToUpload = this.filesToUpload || {};
    this.filesToUpload[datasetType] = file1;

    this.filesToUpload = { ...this.filesToUpload };
    this.forceUpdate();
  };

  onChangeFilename = (datasetType, e) => {
    this.filesToUploadNames = this.filesToUploadNames || {};
    this.filesToUploadNames[datasetType?.toLowerCase()] = _.isString(e) ? e : e.target.value;

    this.filesToUploadNames = { ...this.filesToUploadNames };
  };

  memDatasetRender: (
    batchPredOne,
    isPnp,
    infoAll,
    isWizardHelp,
    dataList,
    defDatasets,
    useCase,
    projectId,
    isDash,
    isSchemaMapping,
    sampleDatasetList,
    isActive,
    validationData,
    isPnpTypeFiles,
  ) => { showUseSampleAnyUploaded; previewRenderSample; list; showUseSample } = memoizeOne(
    (
      batchPredOne,
      isPnp,
      infoAll,
      isWizardHelp,
      dataList,
      defDatasets,
      useCase,
      projectId,
      isDash,
      isSchemaMapping,
      sampleDatasetList: { name: string; type: string; size: number; downloadLocation: string }[],
      isActive,
      validationData,
      isPnpTypeFiles,
    ) => {
      if (!dataList?.length) {
        return;
      }

      let isBatchDataset = !!this.props.isBatchPredDataset;
      let batchDatasets = null,
        batchDatasetsTypes = [];
      if (batchPredOne && isBatchDataset) {
        let r1 = this.calcBatchDatasetsTypes(batchPredOne);
        batchDatasetsTypes = r1?.batchDatasetsTypes;
        batchDatasets = r1?.batchDatasets;
      }

      let showUseSample = false,
        showUseSampleAnyUploaded = false,
        showUseSampleAnyProcessing = false,
        previewRenderSample = null;

      let listCounter = 0;
      let currentDatasetType = '';
      let list = dataList.filter((d1) => d1?.showInWizard !== false || isDash);
      list = list.map(
        (
          d1: {
            isCustom: any;
            datasetTypeAlone: any;
            isStreaming: any;
            fileAccept: any;
            actionPrevious: any;
            isUploadError: any;
            stream: any;
            datasetName: any;
            actionsExtra: any;
            isProcessing: boolean;
            description: string;
            icon: any;
            datasetType: string;
            name: string;
            actions: any;
            isRequired: boolean;
            datasetId: string;
            isUploaded: boolean;
          },
          d1ind,
        ) => {
          listCounter += 1;
          if (isSchemaMapping && !d1.isUploaded) {
            return null;
          }

          let popupContainerForMenu = (node) => document.getElementById('body2');

          let doValidate = d1 && d1.isUploaded;
          let previewRender = null;
          if (sampleDatasetList != null && !isPnp) {
            previewRender =
              !isDash || isSchemaMapping ? (
                <PreviewFieldsRect
                  isActive={isActive}
                  isDash={isDash}
                  useLinkToSchema={true}
                  datasetId={d1.datasetId}
                  datasetType={d1.datasetTypeAlone}
                  useCase={useCase}
                  noTitle
                  projectId={projectId}
                  isOnlyText={isDash}
                  validate={doValidate}
                />
              ) : null;
          }

          if (isDash) {
            let requiredString = ' ';
            if (d1.isRequired) {
              requiredString += '(Required)';
            } else {
              requiredString += '(Optional)';
            }

            if (d1.isUploaded) {
              showUseSampleAnyUploaded = true;
            }
            if (d1.isProcessing) {
              showUseSampleAnyProcessing = true;
            }

            let hasSample = false;
            if (sampleDatasetList && !d1.isUploaded && _.isArray(sampleDatasetList)) {
              let sample1 = sampleDatasetList.find((s1) => (s1.type || '').toLowerCase() === (d1.datasetTypeAlone || '').toLowerCase());
              if (sample1) {
                showUseSample = true;
                hasSample = true;
              }
            }

            let actionPrevious = null;
            if (d1.isProcessing && isDash && !isSchemaMapping && d1.actionPrevious != null) {
              actionPrevious = d1.actionPrevious;
            }

            let loadMoreContent = null;
            let lastD1 = dataList?.[d1ind - 1];
            let d1Name = (
              <div className={sd.styleTextGreen} style={{ color: Utils.colorAall(1) }}>
                {d1.name}
              </div>
            );
            if (lastD1 != null && lastD1.name === d1.name) {
              d1Name = null;
            }
            const currentDatasetName = d1.name;
            const isCurrentGroupLast = currentDatasetName !== list[d1ind + 1]?.name;
            if (currentDatasetName !== list[d1ind - 1]?.name) {
              listCounter = 0;
            }
            if (!this.state.expanded?.[currentDatasetName]) {
              if (listCounter >= 2) {
                if (isCurrentGroupLast) {
                  loadMoreContent =
                    listCounter > 2 ? (
                      <div
                        onClick={() =>
                          this.setState({
                            expanded: {
                              ...this.state.expanded,
                              [currentDatasetName]: !this.state.expanded?.[currentDatasetName],
                            },
                          })
                        }
                        style={{ textAlign: 'left', marginBottom: 4, fontSize: 13, cursor: 'pointer', color: '#1890ff' }}
                      >
                        (And {listCounter - 2} more...)
                      </div>
                    ) : null;
                } else {
                  return null;
                }
              }
            }
            if (isSchemaMapping && !Utils.isNullOrEmpty(d1.datasetName)) {
              let validationErrors = validationData?.datasetErrors?.filter((error) => error.dataset == d1.datasetTypeAlone);
              d1Name = (
                <div className={sd.styleTextBlueBright}>
                  <Link to={d1.isStreaming ? null : '/' + PartsLink.dataset_schema + '/' + d1.datasetId + '/' + projectId} style={{ cursor: 'pointer' }}>
                    {d1.datasetName}
                    {!d1.isStreaming && <span> - Schema</span>}
                  </Link>
                  {validationErrors?.length > 0 && (
                    <TooltipExt placement="bottom" overlay={<span style={{ whiteSpace: 'pre-wrap' }}>{'* ' + validationErrors.map((error) => error.message).join('\n* ')}</span>}>
                      <FontAwesomeIcon className={sd.styleTextRedColor} icon={['far', 'exclamation-circle']} transform={{ size: 15, x: 0, y: 0.5 }} style={{ opacity: 0.7, marginLeft: '6px' }} />
                    </TooltipExt>
                  )}
                </div>
              );
            }

            return (
              <div key={'ds_one_' + d1.datasetType + '_' + d1.name} style={{ textAlign: 'left' }}>
                <div style={{ marginTop: listCounter ? 0 : 10 }}>{d1Name}</div>
                <div>{d1.isStreaming ? null : previewRender}</div>
                {!isSchemaMapping && (
                  <div style={{ minHeight: 28 }}>
                    {loadMoreContent}
                    {actionPrevious}
                    <div style={{ margin: '4px 0' }}>{d1.actions}</div>
                  </div>
                )}
              </div>
            );
          } else {
            let hasSample = false;
            if (sampleDatasetList && !d1.isUploaded && _.isArray(sampleDatasetList)) {
              let sample1 = sampleDatasetList.find((s1) => (s1.type || '').toLowerCase() === (d1.datasetTypeAlone || '').toLowerCase());
              if (sample1) {
                showUseSample = true;
                hasSample = true;
              }
            }

            if (d1.isUploaded) {
              showUseSampleAnyUploaded = true;
            }
            if (d1.isProcessing) {
              showUseSampleAnyProcessing = true;
            }

            let previewButtonRenderWidth = null;
            let previewButtonRender = (
              <span style={{ fontFamily: 'Roboto', fontSize: '14px', fontWeight: 500, color: previewRender == null ? '#868686' : 'white' /*'#38bfa1'*/, whiteSpace: 'nowrap', marginRight: '35px', marginLeft: '5px', cursor: 'pointer' }}>
                Recommended Schema
              </span>
            );
            if (previewRender != null) {
              previewButtonRender = (
                <Popover placement={'topLeft'} overlayClassName={s.popback} trigger={'click'} content={previewRender} title="Expected dataset columns" getPopupContainer={popupContainerForMenu}>
                  {previewButtonRender}
                </Popover>
              );
            }
            if (isPnp && !isDash) {
              const fnDefault = {
                model: 'model.tgz',
                embeddings: 'embedding.csv',
                verifications: 'default_items.json',
              };

              this.refUploads = this.refUploads || {};
              this.filesToUploadRequired = this.filesToUploadRequired || {};
              if (this.refUploads[d1.datasetType] == null) {
                this.refUploads[d1.datasetType] = React.createRef<any>();
                this.filesToUploadRequired[d1.datasetType] = d1.isRequired;
              }

              if (isPnpTypeFiles) {
                previewButtonRender = (
                  <span>
                    <FormItemFileUpload accept={d1.fileAccept} hideList noMsgClick ref={this.refUploads[d1.datasetType]} dark noForm isSmall name={'files_' + d1.datasetType} onChangeFile={this.onChangeFile.bind(this, d1.datasetType)} />
                  </span>
                );
              } else {
                this.onChangeFilename(d1.datasetType, fnDefault[d1.datasetType] ?? '');
                previewButtonRenderWidth = '300px';
                previewButtonRender = (
                  <span
                    css={`
                      width: 300px;
                    `}
                  >
                    <Input
                      onChange={this.onChangeFilename.bind(this, d1.datasetType)}
                      css={`
                        width: 100%;
                      `}
                      defaultValue={fnDefault[d1.datasetType] ?? ''}
                      ref={this.refUploads[d1.datasetType]}
                    />
                  </span>
                );
              }
            }

            if (batchPredOne) {
              const onChangeUseTrain = (e) => {
                const c1 = e.target.checked;
                if (c1 === true) {
                  if (isBatchDataset) {
                    let data1 = batchPredOne?.batchInputs?.datasetIdRemap ?? {};
                    data1 = { ...data1 };

                    let bds1 = batchPredOne?.batchInputs?.featureGroupDatasets?.find((d2) => {
                      if (d2?.originalDataset?.featureGroupTableName === d1.datasetType) {
                        return true;
                      } else if (d2?.replacementDataset?.featureGroupTableName === d1.datasetType) {
                        return true;
                      } else {
                        return false;
                      }
                    });
                    if (bds1) {
                      delete data1[bds1?.originalDataset?.datasetId];

                      REClient_.client_().setBatchPredictionDatasetRemap(batchPredOne?.batchPredictionId, data1 == null ? null : JSON.stringify(data1), (err, res) => {
                        if (err || !res?.success) {
                          REActions.addNotificationError(err || Constants.errorDefault);
                        } else {
                          StoreActions.batchList_(projectId);
                          StoreActions.batchDescribeById_(batchPredOne?.batchPredictionId);
                        }
                      });
                    }
                  } else {
                    REClient_.client_().setBatchPredictionFeatureGroup(batchPredOne?.batchPredictionId, d1.datasetType, null, (err, res) => {
                      if (err || !res?.success) {
                        REActions.addNotificationError(err || Constants.errorDefault);
                      } else {
                        StoreActions.batchList_(projectId);
                        StoreActions.batchDescribeById_(batchPredOne?.batchPredictionId);
                      }
                    });
                  }
                }
              };
              let ddBatch = isBatchDataset ? batchDatasets : batchPredOne?.batchInputs?.featureGroups;
              let dBatchOne = ddBatch?.find((v1) => v1.datasetType === d1.datasetType);

              if (dBatchOne?.required === true && dBatchOne?.default == null) {
                previewButtonRender = null;
              } else {
                previewButtonRender = (
                  <span>
                    <Checkbox disabled={d1.isProcessing} checked={dBatchOne?.default === true} onChange={onChangeUseTrain}>
                      <div
                        css={`
                          color: ${d1.isProcessing ? 'rgba(255,255,255,0.6)' : 'white'};
                          display: inline;
                        `}
                      >
                        Use Training
                        <br />
                        <span
                          css={`
                            margin-left: 1px;
                          `}
                        ></span>
                        {!isBatchDataset ? 'Feature Group' : 'Dataset'}
                      </div>
                    </Checkbox>
                  </span>
                );
              }
            }

            if (isWizardHelp) {
              previewRenderSample = previewRender;
              previewButtonRender = null;
            }

            let isLastOne = d1ind === dataList.size - 1;

            let desc2 = d1.description;
            if (desc2 && this.props.paramsProp?.get('dd') === 'pnp') {
              if (desc2?.toLowerCase()?.indexOf('tensor') > -1) {
                desc2 = 'A Model in an archive';
              }
            }

            return (
              <div key={'ds_one_' + d1.datasetType + '_' + d1.name} style={{ backgroundColor: '#0c121b', borderRadius: '1px', verticalAlign: 'middle', textAlign: 'left', marginBottom: isLastOne ? 0 : '24px' }}>
                <div style={{ position: 'relative', height: '100px' }}>
                  <div style={{ width: previewButtonRenderWidth, float: 'right', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', margin: '0 20px' }}>
                    {d1.actions}
                    <span style={{ marginLeft: '25px', width: previewButtonRenderWidth == null ? null : '100%' }}>{previewButtonRender}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%', float: 'left', marginLeft: '40px', marginRight: '30px' }}>{d1.icon}</div>

                  <div style={{ display: 'flex', alignItems: 'center', height: '100%', fontFamily: 'Matter', fontSize: '22px', lineHeight: 1.2, color: 'white' }}>{d1.name}</div>
                </div>
                {desc2 != null && !batchPredOne && (
                  <div style={{ position: 'relative', padding: '1px 60px 20px 60px', textAlign: 'center' }} className={sd.styleTextGray}>
                    {desc2}
                  </div>
                )}
              </div>
            );
          }
        },
      );
      list = list.filter((d1) => d1 != null);
      if (showUseSampleAnyUploaded || showUseSampleAnyProcessing) {
        showUseSample = false;
      }
      return { list, showUseSample, previewRenderSample, showUseSampleAnyUploaded };
    },
  );

  calcParam = (name) => {
    let { paramsProp } = this.props;

    if (this.props.isDash || this.props.isBatchPred) {
      return this.props[name];
    } else {
      return paramsProp && paramsProp.get(name);
    }
  };

  memSamplesProject: (doCall) => (projectsSamplesParam, projectId: string) => { name: string; type: string; size: number; downloadLocation: string }[] = memoizeOneCurry((doCall, projectsSamplesParam, projectId) => {
    return projectsSamples.memSamplesForProjectId(doCall, projectId);
  });

  memValidation = memoizeOneCurry((doCall, defDatasetsParam, projectId) => {
    return defDatasets.memValidationForProjectId(doCall, projectId);
  });

  memValidDataset: (validationData, dataList, projectId) => { anyProcessing; anyUploadedNotStreaming; anyError; res; resFirst; anyNotConfirmed; anyNeedFix; anyUploaded; anyDataError } = memoizeOne((validationData, dataList, projectId) => {
    if (validationData && dataList && projectId) {
      let res = null,
        resFirst = null,
        anyNotConfirmed = null,
        anyProcessing = null,
        anyNeedFix = null,
        anyUploaded = null,
        anyError = null,
        anyUploadedNotStreaming = null,
        anyDataError = null;
      let allDatasets = (validationData?.requiredDatasets || []).concat(validationData?.optionalDatasets || []);
      if (allDatasets) {
        if (allDatasets.length === 0) {
          anyNeedFix = false;
          anyError = false;
          anyNotConfirmed = false;
          anyUploaded = false;
          anyUploadedNotStreaming = false;
          anyDataError = false;
          anyProcessing = false;
        } else {
          let doAny = false;
          anyNotConfirmed = false;
          anyNeedFix = false;
          anyError = false;
          anyDataError = false;
          anyUploadedNotStreaming = false;
          anyProcessing = false;

          allDatasets.some((d1) => {
            let dsFound1 = dataList?.find((o1) => o1.datasetId === d1.datasetId);
            if (dsFound1 != null) {
              if (dsFound1.isProcessing) {
                anyProcessing = true;
              }
            }

            if (!d1.uploaded) {
              return false;
            }

            if (res == null && !resFirst) {
              if (dsFound1) {
                resFirst = dsFound1.datasetId;
              }
            }

            let needFix = false;
            if (d1.requiredColumns) {
              let kk = Object.keys(d1.requiredColumns);
              kk.some((k1) => {
                if (d1.requiredColumns[k1?.toUpperCase()] === false) {
                  needFix = true;
                  return true;
                }
              });
            }
            if (d1.uploaded) {
              anyUploaded = true;
            }
            if (needFix) {
              anyNeedFix = true;
              anyError = true;
            }
            if (d1.confirmed === false) {
              anyNotConfirmed = true;
            }

            if (d1.uploaded) {
              let dsFound1 = dataList?.find((o1) => (o1.datasetType ?? '').toLowerCase() === (d1.datasetType || '').toLowerCase());
              if (dsFound1 != null && !dsFound1.isStreaming) {
                anyUploadedNotStreaming = true;
              }
            }

            if (res == null) {
              if (needFix || d1.confirmed === false) {
                doAny = true;
                let dsFound1 = dataList.find((o1) => (o1.datasetType ?? '').toLowerCase() === (d1.datasetType || '').toLowerCase());
                if (dsFound1) {
                  res = dsFound1.datasetId;
                  // return true;
                }
              }
            }
          });
        }
      }

      if (validationData?.datasetErrors?.length > 0) {
        anyError = true;
        anyDataError = validationData?.datasetErrors.some((x) => x.type == 'DATA');
      }

      return { anyProcessing, anyUploadedNotStreaming, res, resFirst, anyNotConfirmed, anyNeedFix, anyUploaded, anyError, anyDataError };
    }
  });

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  memUseCaseSchemasAll = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  memDescForUseCase = memoizeOne((infoAll) => {
    if (infoAll) {
      return infoAll?.example_datasets_description;
    }
  });

  onClickHideHelpAlone = (e) => {
    StoreActions.updateUserPreferences_({ helpUseCaseCreate: true });
  };

  onClickHideHelp = (e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    StoreActions.updateUserPreferences_({ helpUseCaseCreate: true });
  };

  memShowHelp = memoizeOne((authUser) => {
    if (authUser) {
      if (authUser.get('neverDone') || authUser.get('data') == null) {
        return false;
      }
      return authUser.getIn(['data', 'info', 'preferences', 'helpUseCaseCreate']) !== true;
    }
  });

  doProgressModal = () => {
    this.modalProgress?.show();
  };

  needToShowFixModalUrl = null;
  needFixModalShow = (urlGoto: string) => {
    if (this.confirmFix != null) {
      return;
    }

    this.needToShowFixModalUrl = urlGoto;

    if (this.confirmUsed != null || this.modalProgress?.isVisible()) {
      this.alreadyShowFixModal = false;
      return;
    }

    if (this.confirmFix != null) {
      this.confirmFix.destroy();
      this.confirmFix = null;
    }

    this.confirmFix = confirm({
      title: 'Complete Dataset Schema Mapping',
      okText: 'Resolve',
      okType: 'primary',
      cancelText: 'Cancel',

      maskClosable: true,
      width: 600,
      content: (
        <div>
          <div
            css={`
              font-family: Matter;
              font-size: 14px;
              padding: 10px 0;
            `}
          >
            You will need to complete the schema mapping process before you can train a model. We have automatically mapped a few of the columns, but will need your help in completing this process.
          </div>
        </div>
      ),
      onOk: () => {
        if (this.confirmFix != null) {
          this.confirmFix.destroy();
          this.confirmFix = null;
        }
        Location.push(urlGoto);
      },
      onCancel: () => {
        if (this.confirmFix != null) {
          this.confirmFix.destroy();
          this.confirmFix = null;
        }
      },
    });
  };

  doConfirm = () => {
    let calcButtonProps: (type1?: string, isHidden?: boolean) => NativeButtonProps = (type1?, isHidden?) => {
      let res: NativeButtonProps = {};

      res.style = res.style ?? {};

      res.type = 'primary';
      res.style.borderRadius = '3px';
      res.style.border = 'none';
      res.style.paddingLeft = '20px';
      res.style.paddingRight = '20px';

      let color1 = '#8a98ab';
      if (type1 === 'danger') {
        color1 = '#c4444d';
      } else if (type1 === 'primary') {
        color1 = null;
      }

      if (color1 != null) {
        res.style.backgroundColor = color1;
      }

      if (isHidden) {
        res.style.display = 'none';
      }

      return res;
    };

    let config: ModalFuncProps = {
      title: null,
      content: (
        <div style={{ textAlign: 'center' }}>
          <div>
            <img src={calcImgSrc('/imgs/gearAnim2.gif')} style={{ width: '140px' }} alt={''} />
          </div>
          <div style={{ fontSize: '14px', margin: '5px 0 8px 0' }}>
            <b>Dataset Processing</b>
          </div>
          <div>
            This process takes a few minutes. The system is inspecting the data formats, identifying the data types, mapping the columns to a system recognizable feature mapping, calculating meta data values, and doing tons of cool stuff to
            make your life easier. Please think of something calming while you wait.
          </div>
        </div>
      ),
      okText: 'Dismiss',
      cancelText: '',
      icon: null,
      maskClosable: false,
      keyboard: false,

      onOk: (args) => {
        // eslint-disable-next-line no-restricted-globals
        let e = event;

        this.doClose();
      },
      onCancel: (args) => {
        // eslint-disable-next-line no-restricted-globals
        let e = event;

        this.doClose();
      },

      okButtonProps: calcButtonProps('primary', false),
      cancelButtonProps: calcButtonProps(undefined, true),
    };

    config.okType = 'primary';

    this.doClose(false);
    this.confirmUsed = confirm(config);
  };

  doClose = (doNeedFinish = true) => {
    if (doNeedFinish) {
      if (this.needToFinish != null) {
        this.needToFinish.some((id1) => {
          alreadyConfirmDatasetId.push(id1);
        });
      }
      this.needToFinish = null;
    }

    if (this.confirmUsed) {
      this.confirmUsed.destroy();
      this.confirmUsed = null;
    }
  };

  memUseConfirm: (projects) => { useConfirmModal; projectsCount } = memoizeOne((projects) => {
    let useConfirmModal = false,
      projectsCount = null;
    if (!projects || projects.get('neverDone') === true || projects.get('isRefreshing')) {
      return null;
    } else {
      let list = projects.get('list');
      if (list == null) {
        return null;
      } else {
        projectsCount = list.length;
        useConfirmModal = list.length < 3;
      }
    }
    return { useConfirmModal, projectsCount };
  });

  memFinishConfirm = memoizeOne((dataList, useConfirmModal) => {
    if (dataList && this.needToFinish == null) {
      let uploadedDatasetId = this.props.paramsProp?.get('uploadedDatasetId');
      if (uploadedDatasetId != null && uploadedDatasetId !== '') {
        let find1 = dataList.find((d1) => d1.datasetId === uploadedDatasetId);
        if (find1) {
          if (!find1.isUploaded && !find1.isUploadError) {
            if (!alreadyConfirmDatasetId.includes(uploadedDatasetId)) {
              alreadyConfirmDatasetId.push(uploadedDatasetId);

              let needFix = false;
              if (this.confirmFix != null) {
                this.confirmFix.destroy();
                this.confirmFix = null;
                needFix = true;
              }

              this.needToFinish = [uploadedDatasetId];
              setTimeout(() => {
                if (useConfirmModal) {
                  this.doProgressModal();
                }

                if (needFix) {
                  setTimeout(() => {
                    if (this.isM) {
                      this.needFixModalShow(this.needToShowFixModalUrl);
                    }
                  }, 200);
                }
              }, 0);

              return;
            }
          }
        }
      }
    }

    if (dataList && this.needToFinish && this.needToFinish.length > 0) {
      dataList.some((d1) => {
        if (d1.isUploaded || d1.isUploadError) {
          this.needToFinish = this.needToFinish.filter((id1) => id1 !== d1.datasetId);
        }
      });
      if (this.needToFinish && this.needToFinish.length === 0) {
        this.needToFinish = null;
        setTimeout(() => {
          this.doClose();
          this.modalProgress?.hide();
        }, 0);
      }
    }
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onClickStartBatch = (e) => {
    let projectId = this.calcParam('projectId');
    let batchPredId = this.props.paramsProp?.get('batchPredId');
    REClient_.client_().startBatchPrediction(batchPredId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.batchList_(projectId);
        StoreActions.batchListVersions_(batchPredId);
        StoreActions.batchDescribeById_(batchPredId);

        Location.push('/' + PartsLink.batchpred_detail + '/' + projectId + '/' + batchPredId);
      }
    });
    this.setState({
      isRefreshingFull: true,
    });
  };

  onClickUploadFiles = (e) => {
    let projectId = this.calcParam('projectId');
    const newVersionForModel = this.props.paramsProp?.get('newVersionForModel');

    let useCaseParam = this.calcParam('useCase');
    let info = this.memUseCaseSchemas(false)(this.props.useCases, useCaseParam);

    const filesIds = info?.list;

    this.setState({
      isRefreshingFull: true,
    });

    const doWorkFinish = (err, res) => {
      if (this.isM) {
        this.setState({
          isRefreshingFull: false,
        });
      }

      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.getProjectsList_();
        StoreActions.listModels_(projectId);
        StoreActions.getProjectsById_(projectId);
        StoreActions.modelsVersionsByModelId_(newVersionForModel);

        Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
      }
    };

    const doWorkCreate = () => {
      let fileNeedsFinsih = [...filesIds];

      filesIds.some((id1) => {
        if (!this.filesToUploadRequired?.[id1]) {
          const file1 = this.filesToUpload?.[id1];
          if (file1 == null) {
            fileNeedsFinsih = fileNeedsFinsih.filter((v1) => v1 !== id1);
          }
        }
      });

      if (!Utils.isNullOrEmpty(newVersionForModel)) {
        REClient_.client_().createModelVersionFromLocalFiles(newVersionForModel, JSON.stringify(fileNeedsFinsih), (err, res) => {
          doWorkUpload(err, res);
        });
      } else {
        REClient_.client_().createModelFromLocalFiles(projectId, this.state.pnpName, JSON.stringify(fileNeedsFinsih), (err, res) => {
          doWorkUpload(err, res);
        });
      }
    };

    const doWorkUpload = (errU, resU) => {
      if (errU || !resU?.success) {
        if (this.isM) {
          this.setState({
            isRefreshingFull: false,
          });
        }
        REActions.addNotificationError(errU || Constants.errorDefault);
        return;
      }

      let useCaseParam = this.calcParam('useCase');
      let info = this.memUseCaseSchemas(false)(this.props.useCases, useCaseParam);

      let fileNeedsFinsih = [...filesIds];

      filesIds.some((id1) => {
        if (!this.filesToUploadRequired?.[id1]) {
          const file1 = this.filesToUpload?.[id1];
          if (file1 == null) {
            fileNeedsFinsih = fileNeedsFinsih.filter((v1) => v1 !== id1);
          }
        }
      });
      filesIds.some((id1) => {
        const file1 = this.filesToUpload?.[id1];
        if (file1 == null) {
          return;
        }

        let scData = info?.[id1?.toLowerCase()];
        const name1 = scData?.title;

        const uploadId = resU?.result?.[id1 + 'UploadId'] ?? 'error';

        const id2 = id1;
        REUploads_.client_().doUploadNew(
          undefined,
          undefined,
          undefined,
          false,
          uploadId,
          undefined,
          name1,
          undefined,
          undefined,
          file1,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
          undefined,
          undefined,
          undefined,
          undefined,
          (err, res) => {
            fileNeedsFinsih = fileNeedsFinsih.filter((v1) => v1 !== id2);
            if (fileNeedsFinsih.length === 0) {
              doWorkFinish(null, { success: true });
            }
          },
        );
      });
    };

    const doWorkCreateImport = () => {
      let location1 = this.state.pnpLocation;

      //
      let filenames1 = {};
      let kkFF = Object.keys(this.filesToUploadNames ?? {});
      filesIds.some((id1) => {
        let id2 = kkFF.find((v1) => v1?.toLowerCase() === id1?.toLowerCase());
        const file1 = this.filesToUploadNames?.[id2 || '-'];
        if (!Utils.isNullOrEmpty(file1)) {
          filenames1[id1] = file1;
        }
      });

      //
      REClient_.client_()._verifyModelFromFilesLocation(projectId, location1, JSON.stringify(filenames1), (errV, resV) => {
        if (errV || !resV?.success) {
          if (this.isM) {
            this.setState({
              isRefreshingFull: false,
            });
          }
          REActions.addNotificationError(errV || Constants.errorDefault);
        } else {
          REClient_.client_().createModelFromFiles(projectId, this.state.pnpName, location1, JSON.stringify(filenames1), (err, res) => {
            if (err || !res?.success) {
              if (this.isM) {
                this.setState({
                  isRefreshingFull: false,
                });
              }
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              doWorkFinish(null, { success: true });
            }
          });
        }
      });
    };

    if (this.state.isPnpTypeFiles) {
      doWorkCreate();
    } else {
      if (_.trim(this.state.pnpLocation || '') === '') {
        this.setState({
          isRefreshingFull: false,
        });
        REActions.addNotificationError('Missing location');
        return;
      }

      doWorkCreateImport();
    }
  };

  alreadyShowFixModal = false;
  memFixModal = memoizeOne((anyNeedFix, anyProcessing, urlGoto) => {
    if (anyNeedFix === true && anyProcessing === false && urlGoto) {
      if (this.alreadyShowFixModal) {
        return;
      }

      this.alreadyShowFixModal = true;
      this.needFixModalShow(urlGoto);
    }
  });

  onChangePnpTypeFiles = (e) => {
    this.setState({
      isPnpTypeFiles: e.target.value,
    });
  };

  memModelDefaultName = memoizeOneCurry((doCall, modelNameParam, projectId) => {
    if (modelNameParam && projectId) {
      let res = calcDefaultModelName(undefined, projectId);
      if (res != null) {
        return res;
      } else {
        if (modelNameParam.get('isRefreshing')) {
          return null;
        } else {
          if (doCall) {
            StoreActions.getDefaultModelName_(projectId);
          }
        }
      }
    }
  });

  memAnyUploaded = memoizeOne((dataList) => {
    let res = false;
    dataList?.some((d1) => {
      if (d1?.isUploaded === true) {
        res = true;
      }
    });
    return res;
  });

  render() {
    let { isDash, paramsProp, useCases, datasets, projects, defDatasets, isSchemaMapping, isActive } = this.props;

    let isWizardHelp = !!this.calcParam('stepByStep');

    let useCaseParam = this.calcParam('useCase');

    let projectId = this.calcParam('projectId');

    let isBatchDataset = !!this.props.isBatchPredDataset;

    let info = this.memUseCaseSchemas(false)(useCases, useCaseParam);
    let infoAll = this.memUseCaseSchemasAll(false)(useCases, useCaseParam);

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let isPnp = foundProject1?.isPnp ?? false;
    if (this.props.paramsProp?.get('dd') === 'pnp') {
      isPnp = true;
    }

    let batchPredId = this.props.paramsProp?.get('batchPredId');

    let batchPredOne;
    if (this.props.isBatchPred) {
      batchPredOne = this.memBatchPred(false)(this.props.batchPred, batchPredId);
      this.memBatchGetDatasets(false)(this.props.batchPred, batchPredOne);
    }

    let dataListRes = this.memDataList(
      this.props.batchPred,
      batchPredOne,
      batchPredId,
      foundProject1,
      this.props.lastModelId,
      this.props.anyModel,
      this.props.anyPnpLocationUsed,
      useCaseParam,
      this.filesToUpload,
      isPnp,
      isWizardHelp,
      info,
      projectId,
      projects,
      datasets,
      isDash,
      isSchemaMapping,
      this.state.isPnpTypeFiles,
    );
    let dataList = dataListRes?.list;
    let disableForceContinue = dataListRes?.disableForceContinue;

    let sampleDatasetList = this.memSamplesProject(false)(this.props.projectsSamples, projectId);

    let showHelp = !isWizardHelp && !isDash && this.memShowHelp(this.props.authUser);

    let validationData = isSchemaMapping ? this.memValidation(false)(defDatasets, projectId) : null;
    let datasetListRenderRes = this.memDatasetRender(
      batchPredOne,
      isPnp,
      infoAll,
      isWizardHelp,
      dataList,
      defDatasets,
      useCaseParam,
      projectId,
      isDash,
      isSchemaMapping,
      sampleDatasetList,
      isActive,
      validationData,
      this.state.isPnpTypeFiles,
    );
    let datasetListRender = datasetListRenderRes?.list;
    let showUseSample = datasetListRenderRes?.showUseSample;
    let previewRenderHere = datasetListRenderRes?.previewRenderSample;
    let showUseSampleAnyUploaded = datasetListRenderRes?.showUseSampleAnyUploaded;
    let sampleRender = null;
    if ((showUseSample || (isPnp && !isDash)) && !isSchemaMapping) {
      let descriptionUseCase = this.memDescForUseCase(infoAll);
      let titleConfirm = <span>Do you want to use the sample datasets?</span>;
      if (descriptionUseCase != null && descriptionUseCase !== '') {
        titleConfirm = (
          <div>
            <div>{titleConfirm}</div>
            <div style={{ margin: '14px 0', textAlign: 'left' }} className={sd.styleTextGray}>
              <div style={{ marginBottom: '5px' }} className={sd.styleTextGreen}>
                Description:
              </div>
              {descriptionUseCase}
            </div>
          </div>
        );
      }

      if (isPnp && !isDash) {
        if (this.state.isPnpTypeFiles) {
          let inside = (
            <div style={{ padding: '22px', position: 'relative' }}>
              <div style={{ margin: '2px 0 18px 0', fontFamily: 'Matter', fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>For the entire process on how to create the required artifacts check this GitHub repository</div>
              <div style={{ backgroundColor: '#2e5bff', borderRadius: '50%', width: '108px', height: '108px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div>
                  <div style={{ marginBottom: '11px' }}>
                    <FontAwesomeIcon icon={require('@fortawesome/free-brands-svg-icons/faGithub').faGithub} transform={{ size: 26, x: 0, y: 0 }} style={{}} />
                  </div>
                  <div style={{ fontFamily: 'Roboto', fontSize: '14px', fontWeight: 500, lineHeight: 1.14, color: '#ffffff' }}>
                    GitHub
                    <br />
                    Repository
                  </div>
                </div>
              </div>
            </div>
          );

          sampleRender = (
            <div
              style={{
                border: 'none',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                position: 'relative',
                maxHeight: '100%',
                height: '100%',
                fontFamily: 'Matter',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: 1.36,
                color: '#d1e4f5',
                textAlign: 'center',
              }}
              className={sd.useSampleDatasetBack}
            >
              <Link to={Constants.flags.repo_github_model_server} noApp newWindow>
                {inside}
              </Link>
            </div>
          );
        }
      } else if (isDash) {
        sampleRender = (
          <div style={{ margin: '4px 0 10px 0', fontFamily: 'Roboto', fontSize: '14px', lineHeight: '1.57', textAlign: 'center' }}>
            <ModalConfirm onConfirm={this.useSampleDatasets} title={titleConfirm} icon={<QuestionCircleOutlined style={{ color: 'green' }} />} okText={'Use Sample'} cancelText={'Cancel'} okType={'primary'}>
              <span style={{ cursor: 'pointer' }} className={sd.useSampleDataset}>
                <FontAwesomeIcon icon={['fad', 'vials']} transform={{ size: 14, x: 0, y: 0.5 }} style={{ marginRight: '4px' }} />
                Use sample datasets
              </span>
            </ModalConfirm>
          </div>
        );
        if ((this.props.featureGroupsCount ?? 0) > 0) {
          sampleRender = null;
        }
      } else if (!batchPredId) {
        let inside = (
          <div style={{ padding: '22px', position: 'relative' }}>
            <div style={{ margin: '2px 0 18px 0', fontFamily: 'Matter', fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Try with sample</div>
            <div style={{ backgroundColor: '#2e5bff', borderRadius: '50%', width: '108px', height: '108px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div>
                <div style={{ marginBottom: '11px' }}>
                  <FontAwesomeIcon icon={['fad', 'vials']} transform={{ size: 26, x: 0, y: 0 }} style={{}} />
                </div>
                <div style={{ fontFamily: 'Roboto', fontSize: '14px', fontWeight: 500, lineHeight: 1.14, color: '#ffffff' }}>
                  Sample
                  <br />
                  Datasets
                </div>
              </div>
            </div>
            <div style={{ marginTop: '17px', textAlign: 'left' }}>Create a custom deep learning model with our sample dataset to see how the process works</div>
          </div>
        );

        if (!isWizardHelp) {
          sampleRender = (
            <div
              style={{
                border: showHelp ? '3px solid #00f8c5' : 'none',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                maxHeight: '100%',
                height: '100%',
                fontFamily: 'Matter',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: 1.36,
                color: '#d1e4f5',
                textAlign: 'center',
              }}
              className={sd.useSampleDatasetBack}
            >
              {showHelp && <img src={calcImgSrc('/imgs/helpUseCasesCreate.png')} alt={''} style={{ position: 'absolute', bottom: '-130px', right: '-50px', width: '292px', cursor: 'pointer' }} onClick={this.onClickHideHelp} />}
              <ModalConfirm
                onClick={this.onClickHideHelpAlone}
                onConfirm={this.useSampleDatasets}
                title={titleConfirm}
                icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                okText={'Use Sample'}
                cancelText={'Cancel'}
                okType={'primary'}
              >
                {inside}
              </ModalConfirm>
            </div>
          );
        }
      }
    }

    let buttonString = isPnp && !isDash ? (this.state.isPnpTypeFiles ? 'Upload Files' : 'Import Files') : 'Explore + Train Models';
    if (batchPredId) {
      buttonString = 'Configure Output';
    }

    let buttonContinue = (
      <Button ghost={!!batchPredId} onClick={isPnp ? this.onClickUploadFiles : null} style={{ width: batchPredId ? '45%' : '100%' }} type={batchPredId ? 'default' : 'primary'}>
        {buttonString}
      </Button>
    );
    let buttonStart = (
      <Button onClick={this.onClickStartBatch} style={{ marginLeft: '25px', width: '45%' }} type={'primary'}>
        Start Batch Prediction
      </Button>
    );

    if (batchPredId) {
      buttonContinue = <Link to={'/' + PartsLink.batchpred_detail + '/' + projectId + '/' + batchPredId}>{buttonContinue}</Link>;
    } else if (!isPnp) {
      buttonContinue = <Link to={'/' + PartsLink.project_dashboard + '/' + projectId}>{buttonContinue}</Link>;
    }
    let disableIfNeeded = true,
      showDisablePnp = false;
    if (isPnp && !isDash) {
      if (this.refUploads != null) {
        let kk = Object.keys(this.refUploads);
        disableIfNeeded = false;
        kk.some((k1) => {
          if (this.filesToUpload?.[k1] == null && this.filesToUploadRequired?.[k1]) {
            disableIfNeeded = true;
            showDisablePnp = true;
          }
        });
      }
    }
    if (batchPredId) {
      if (dataListRes?.isAllOk) {
        disableIfNeeded = false;
      }
    }
    if (isPnp && !this.state.isPnpTypeFiles) {
      disableIfNeeded = false;
    }
    if (this.props.paramsProp?.get('dd') === 'pnp' || (disableIfNeeded && (showDisablePnp || !dataListRes?.isAllOk || disableForceContinue))) {
      buttonContinue = (
        <Button style={{ width: '45%' }} type={'primary'} disabled={true}>
          {buttonString}
        </Button>
      );
      buttonStart = (
        <Button style={{ marginLeft: '25px', width: '45%' }} type={'primary'} disabled={true}>
          Start Batch Prediction
        </Button>
      );
    }

    let datasetIdSchemaRes = isSchemaMapping ? this.memValidDataset(validationData, dataList, projectId) : null;
    let datasetIdSchema = datasetIdSchemaRes?.res ?? datasetIdSchemaRes?.resFirst;
    let anyNotConfirmed = datasetIdSchemaRes?.anyNotConfirmed;
    let anyUploaded = datasetIdSchemaRes?.anyUploaded;
    let anyNeedFix = datasetIdSchemaRes?.anyNeedFix;
    let anyProcessing = datasetIdSchemaRes?.anyProcessing;
    let anyError = datasetIdSchemaRes?.anyError;
    let anyDataError = datasetIdSchemaRes?.anyDataError;
    let anyUploadedNotStreaming = datasetIdSchemaRes?.anyUploadedNotStreaming;

    let anyUploadedEver = this.memAnyUploaded(dataList);

    let renderDatasetAndSample = null;
    if ((isDash && !isSchemaMapping) || sampleRender == null) {
      renderDatasetAndSample = datasetListRender;
    } else if (sampleRender != null) {
      renderDatasetAndSample = (
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>{datasetListRender}</div>
          <div style={{ marginLeft: '24px', width: '234px', flex: 0 }}>{sampleRender}</div>
        </div>
      );
    }

    let schemaNameButton = null,
      schemaNameButtonExtra = null,
      goToDetails = false;
    if (isDash && isSchemaMapping) {
      if (showUseSampleAnyUploaded) {
        if (anyNeedFix === true) {
          schemaNameButton = 'Fix Mapping Errors';
        } else if (anyNotConfirmed === true) {
          schemaNameButton = 'Confirm Schema Mapping';
        } else if (anyDataError === true) {
          schemaNameButton = 'Update Dataset';
          goToDetails = true;
        } else if (anyError === true) {
          schemaNameButton = 'Fix Schema Errors';
        } else if (anyUploadedNotStreaming) {
          schemaNameButtonExtra = 'Go to Schema Explorer';
        }
      }
    }

    const newVersionForModel = this.props.paramsProp?.get('newVersionForModel');

    let modelDefaultName = null;
    if (isPnp) {
      modelDefaultName = this.memModelDefaultName(false)(this.props.defaultModelName, projectId);
    }

    return (
      <div style={{ textAlign: 'center', position: 'relative', ...(this.props.style || {}) }}>
        <RefreshAndProgress
          isRelative
          isMsgAnimRefresh={true}
          msgHideContent={true}
          msgMsg={this.state.isRefreshingFull ? 'Processing...' : null}
          isRefreshing={this.state.isRefreshing}
          progress={{ actual: this.state.uploadActual, total: this.state.uploadTotal, label: 'Uploading...', hidden: !this.state.isProcessing }}
        >
          <div style={{ maxWidth: isDash ? '' : '940px', margin: isDash ? '0' : '46px auto 120px auto', padding: isDash ? '0' : '0 20px' }}>
            <ModalProgress
              ref={(r1) => {
                this.modalProgress = r1;
              }}
              okText="Ok"
            />

            {!isDash && (
              <div>
                <img
                  src={calcImgSrc('/imgs/dataset_usecase_upload.png')}
                  alt={''}
                  style={{ width: '130px' }}
                  css={`
                    ${batchPredId ? 'transform: rotate(180deg);' : ''}
                  `}
                />
              </div>
            )}

            {!isDash && <div style={{ marginTop: '36px', fontFamily: 'Matter', fontSize: '26px', lineHeight: 1.39 }}>{batchPredId ? 'Create Batch Prediction' : infoAll?.uiCustom?.dataset_title ?? 'Create Datasets'}</div>}
            {!isDash && batchPredId && isBatchDataset && (
              <div
                css={`
                  font-family: Matter;
                  font-size: 18px;
                  text-align: center;
                  opacity: 0.8;
                  margin: 15px auto;
                  max-width: 600px;
                `}
              >
                Override source datasets used in the training feature group with prediction datasets to create a batch prediction
              </div>
            )}
            {isPnp && !isDash && Utils.isNullOrEmpty(newVersionForModel) && (
              <div
                css={`
                  margin: 20px 0 8px 0;
                  line-height: 1em;
                  text-align: center;
                `}
              >
                <div
                  css={`
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 14px 0;
                  `}
                >
                  <span>Name:</span>
                  <span
                    css={`
                      margin-left: 5px;
                      width: 300px;
                    `}
                  >
                    <Input
                      placeholder={modelDefaultName}
                      value={this.state.pnpName}
                      onChange={(e) => {
                        this.setState({ pnpName: e.target.value });
                      }}
                    />
                  </span>
                </div>

                <span
                  css={`
                    margin-right: 12px;
                    font-size: 14px;
                  `}
                >
                  Type:
                </span>
                <Radio.Group value={this.state.isPnpTypeFiles} onChange={this.onChangePnpTypeFiles}>
                  <Radio value={true}>
                    <span
                      css={`
                        color: white;
                      `}
                    >
                      Files
                    </span>
                  </Radio>
                  <Radio value={false}>
                    <span
                      css={`
                        color: white;
                      `}
                    >
                      Import
                    </span>
                  </Radio>
                </Radio.Group>

                {!this.state.isPnpTypeFiles && (
                  <div
                    css={`
                      margin: 20px auto 0 auto;
                      width: 700px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span
                      css={`
                        font-size: 14px;
                        margin-right: 10px;
                      `}
                    >
                      Location:
                    </span>
                    <span
                      css={`
                        flex: 1;
                      `}
                    >
                      <Input
                        value={this.state.pnpLocation}
                        onChange={(e) => {
                          this.setState({ pnpLocation: e.target.value });
                        }}
                      />
                    </span>
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop: '30px' }}>{renderDatasetAndSample}</div>
            {previewRenderHere && (
              <div>
                <div className={sd.grayPanel} style={{ display: 'inline-block', margin: '0 auto', padding: '16px' }}>
                  {previewRenderHere}
                </div>
              </div>
            )}
            {isDash && !isSchemaMapping && sampleRender}
            {isDash && isSchemaMapping && datasetIdSchema != null && projectId != null && schemaNameButton != null && (
              <div style={{ marginTop: '10px', marginBottom: '7px', textAlign: 'center' }}>
                <Link to={goToDetails ? '/' + PartsLink.dataset_detail + '/' + datasetIdSchema + '/' + projectId : '/' + PartsLink.dataset_schema + '/' + datasetIdSchema + '/' + projectId}>
                  <Button className={anyError ? sd.styleTextRedColorBack : ''} type={'primary'} style={{ width: '100%', marginBottom: '6px' }}>
                    {schemaNameButton}
                  </Button>
                </Link>
              </div>
            )}
            {isDash && isSchemaMapping && datasetIdSchema != null && projectId != null && schemaNameButtonExtra != null && (
              <div style={{ marginTop: '18px', marginBottom: '7px', textAlign: 'center' }}>
                <Link to={'/' + PartsLink.dataset_schema + '/' + datasetIdSchema + '/' + projectId}>
                  <span className={sd.styleTextBlueBright + ' ' + (anyError ? sd.styleTextRedColor : '')} style={{ cursor: 'pointer' }}>
                    {schemaNameButtonExtra}
                  </span>
                </Link>
              </div>
            )}
            {!isDash && (
              <div style={{ marginTop: '40px' }}>
                <div style={{ maxWidth: '450px', margin: '0 auto' }}>
                  {buttonContinue}
                  {batchPredId && buttonStart}
                </div>
              </div>
            )}

            {!isDash && !isSchemaMapping && !batchPredId && !anyUploadedEver && !isPnp && projectId != null && (
              <div
                css={`
                  text-align: center;
                  margin-top: 100px;
                `}
              >
                <Link to={'/' + PartsLink.project_dashboard + '/' + projectId}>
                  <span className={sd.styleTextBlueBright}>Skip creating new datasets and attach existing Feature Groups</span>
                </Link>
              </div>
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
    useCases: state.useCases,
    datasets: state.datasets,
    projects: state.projects,
    defDatasets: state.defDatasets,
    projectsSamples: state.projectsSamples,
    authUser: state.authUser,
    defaultModelName: state.defaultModelName,
    batchPred: state.batchPred,
  }),
  null,
)(DatasetForUseCase);
