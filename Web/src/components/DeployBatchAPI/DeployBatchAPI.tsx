import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Collapse from 'antd/lib/collapse';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Select from 'antd/lib/select';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import REUploads_ from '../../api/REUploads';
import { useBatchPred } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { DeploymentLifecycle, calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import BatchConfigFeatureGroups from '../BatchConfigFeatureGroups/BatchConfigFeatureGroups';
import { OutputTypeEnum } from '../BatchPredDetail/BatchPredDetail';
import CloudBucketBrowse from '../CloudBucketBrowse/CloudBucketBrowse';
import ConnectorEditInline from '../ConnectorEditInline/ConnectorEditInline';
import FormExt from '../FormExt/FormExt';
import FormItemFileUpload from '../FormItemFileUpload/FormItemFileUpload';
import HelpIcon from '../HelpIcon/HelpIcon';
import InputCloud from '../InputCloud/InputCloud';
import InputCron from '../InputCron/InputCron';
import { DetailName, DetailValue } from '../ModelDetail/DetailPages';
import { optionsOnValuesChange } from '../ModelTrain/helpers';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import OptionsBuilder from '../OptionsBuilder/OptionsBuilder';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import SmartMetricsList from '../SmartMetricsList/SmartMetricsList';
import { UserProfileSection } from '../UserProfile/UserProfile';
const s = require('./DeployBatchAPI.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

enum EStep {
  Inputs,
  Outputs,
  Options,
}

interface IDeployBatchAPIProps {}

const DeployBatchAPI = React.memo((props: PropsWithChildren<IDeployBatchAPIProps>) => {
  const { paramsProp, deployments, projects, useCases } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    deployments: state.deployments,
    projects: state.projects,
    useCases: state.useCases,
  }));

  const [step, setStep] = useState(EStep.Inputs as EStep | null);
  const isStep = (step1) => {
    return step == null || step1 === step;
  };

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [optionsId, forceOptionsId] = useReducer((x) => x + 1, 0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [form] = Form.useForm();
  const [writeCustom, setWriteCustom] = useState('console');
  const [readCustom, setReadCustom] = useState('fg');
  const [initialInputFile, setInitialInputFile] = useState({} as { label: string; value: string });
  const inputRef = useRef(null);
  const [bucketSelObject, setBucketSelObject] = useState(null as { bucket: string; verified: boolean; writePermission: boolean });
  const [bucketSelReadObject, setBucketSelReadObject] = useState(null as { bucket: string; verified: boolean; writePermission: boolean });
  const [isCsv, setIsCsv] = useState(true);

  const [argsFieldNames, setArgsFieldNames] = useState(null);
  const [argsFieldNamesTrue, setArgsFieldNamesTrue] = useState(null);
  const [hideAdvanced, setHideAdvanced] = useState(true);
  const [hideExpl, setHideExpl] = useState(false);
  const [hasAdvancedOptions, setHasAdvancedOptions] = useState(null);

  const [editConnectorUuid, setEditConnectorUuid] = useState(uuid.v1());
  const [editConnectorState, setEditConnectorState] = useState({} as any);

  const [outputType, setOutputType] = useState(OutputTypeEnum.Console);
  const [metadataColumn, setMetadataColumn] = useState(false);
  const [isForEval, setIsForEval] = useState(true);

  const [overridesFG, setOverridesFG] = useState(null);
  const [bpColumnsFilterValues, setBpColumnsFilterValues] = useState([]);
  const [resultInputColumns, setResultInputColumns] = useState([]);

  let projectId = paramsProp?.get('projectId');
  let deployId = paramsProp?.get('deployId');
  let editBatchPredId = paramsProp?.get('editBatchPredId');
  if (editBatchPredId === '') {
    editBatchPredId = null;
  }

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projects, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projects, projectId]);

  useEffect(() => {
    if (foundProject1) {
      let useCase: string = foundProject1.useCase;
      let useCaseInfo = memUseCasesSchemasInfo(true, useCase, true);
    }
  }, [foundProject1, useCases]);
  const useCaseInfo = useMemo(() => {
    if (foundProject1) {
      let useCase: string = foundProject1.useCase;
      let useCaseInfo = memUseCasesSchemasInfo(false, useCase, true);
      return useCaseInfo;
    }
  }, [foundProject1, useCases]);

  const explanations_supported = useMemo(() => {
    if (useCaseInfo != null) {
      return useCaseInfo.explanations_supported === true;
    }
  }, [useCaseInfo]);

  const forEvalSupported = useMemo(() => {
    if (useCaseInfo != null) {
      return useCaseInfo?.for_eval_supported === true;
    }
  }, [useCaseInfo]);

  const problemType = useMemo(() => {
    return useCaseInfo?.ori?.problemType?.toUpperCase();
  }, [useCaseInfo]);

  const predictForEvalTitle = useMemo(() => {
    if (problemType === 'FORECASTING' || problemType === 'REGRESSION') {
      return 'Prediction Option';
    }
    return 'Predict For Evaluation';
  }, [problemType]);

  const predictForEvalOptions = useMemo(() => {
    if (problemType === 'FORECASTING') {
      return { NO: 'Predict into the Future', YES: 'Predict on Test' };
    } else if (problemType === 'REGRESSION') {
      return { NO: 'Assign Prediction Input', YES: 'Predict On Test Data' };
    }
    return { YES: 'YES', NO: 'NO' };
  }, [problemType]);

  useEffect(() => {
    if (Utils.isNullOrEmpty(deployId)) {
      setHasAdvancedOptions(false);
      return;
    }

    REClient_.client_()._getBatchPredictionArgs(deployId, undefined, undefined, undefined, (err, res) => {
      let r1 = res?.result;
      if (_.isEmpty(r1)) {
        r1 = null;
      }

      if (res?.success) {
        if (r1 == null) {
          if (explanations_supported) {
            setHasAdvancedOptions(true);
          } else {
            setHasAdvancedOptions(false);
          }
        } else {
          setHasAdvancedOptions(true);
        }
      }
    });
  }, [deployId, explanations_supported]);

  useEffect(() => {
    if (!Utils.isNullOrEmpty(editBatchPredId)) {
      setStep(null);
    }
  }, [editBatchPredId]);

  const setReadCustomInt = (v1) => {
    setReadCustom(v1);

    if (v1 === 'fg') {
      setOverridesFG(null);
    }
  };

  const refFirstOptionsId = useRef(true);
  useEffect(() => {
    if (refFirstOptionsId.current) {
      refFirstOptionsId.current = false;
    } else {
      forceOptionsId();
    }
  }, [deployId]);

  const refIsM = useRef(false);
  useEffect(() => {
    refIsM.current = true;

    return () => {
      refIsM.current = false;
    };
  }, []);

  useEffect(() => {
    DeployBatchAPI_calcListDeploy(deployments, deployId, projectId, true, true);
  }, [deployments, deployId, projectId]);

  let listDeployments = useMemo(() => {
    return DeployBatchAPI_calcListDeploy(deployments, deployId, projectId, false, true);
  }, [deployments, deployId, projectId]);

  let optionsDeploys = useMemo(() => {
    if (listDeployments) {
      return listDeployments.map((d1) => {
        return {
          label: d1.name || '-',
          value: d1.deploymentId,
        };
      });
    }
  }, [listDeployments]);
  let optionsDeploysSel = optionsDeploys?.find((d1) => d1.value === deployId);

  const full_batch_supported = useMemo(() => {
    if (useCaseInfo != null) {
      return useCaseInfo.full_batch_supported === true || useCaseInfo.full_batch_supported == null;
    }
  }, [useCaseInfo]);

  useEffect(() => {
    let pt1 = useCaseInfo?.ori?.problemType?.toUpperCase();
    if (pt1 === 'FORECASTING') {
      setReadCustomInt('fg_train');
    }
  }, [useCaseInfo]);
  const defaultCustomReadValue = useMemo(() => {
    let pt1 = useCaseInfo?.ori?.problemType?.toUpperCase();
    if (pt1 === 'FORECASTING') {
      return 'fg_train';
    } else {
      return 'fg';
    }
  }, [useCaseInfo]);

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const onChangeSelectDeployment = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let projectId = paramsProp?.get('projectId');
    let deployId = optionSel?.value;
    if (projectId && deployId) {
      Location.push('/' + PartsLink.deploy_batch + '/' + projectId + '/' + deployId);
    }
  };

  const handleSubmit = (values) => {
    let projectId = paramsProp?.get('projectId');
    let deployId = paramsProp?.get('deployId');

    if (!projectId) {
      REActions.addNotificationError('Error missing parameters');
      return;
    }
    if (!deployId) {
      REActions.addNotificationError('Select a Deployment first');
      return;
    }

    const doProcessArgs = (values) => {
      let vv = { ...(values ?? {}) };
      delete vv.name;
      delete vv.inputFile;
      delete vv.inputFile2;
      delete vv.fileRead;
      delete vv.listIDs;
      delete vv.explanations;
      delete vv.outputFile;
      delete vv.outputFile2;
      delete vv.outputType;
      delete vv.csvInputPrefix;
      delete vv.csvPredictionPrefix;
      delete vv.csvExplanationPrefix;
      delete vv.configFG;
      delete vv.resultInputColumns;
      delete vv.featureGroupTableName;
      delete vv.storageLocation;

      let kk = Object.keys(vv);
      kk.some((k1) => {
        let v1 = vv[k1];
        if (moment.isMoment(v1)) {
          vv[k1] = v1.utcOffset(0, true).format().replace('Z', '');
        }
      });

      if (forEvalSupported && isForEval === true) {
        vv['forEval'] = true;
        if (useCaseInfo?.ori?.problemType?.toUpperCase() == 'FORECASTING') {
          vv['predictionStart'] = undefined;
        }
      }
      return vv;
    };

    if (editBatchPredId != null) {
      let vv = doProcessArgs(values);

      setIsProcessing(true);
      REClient_.client_().updateBatchPrediction(
        editBatchPredId,
        deployId,
        JSON.stringify(vv),
        values.explanations,
        null,
        values.csvInputPrefix,
        values.csvPredictionPrefix,
        values.csvExplanationPrefix,
        null,
        metadataColumn,
        resultInputColumns,
        null,
        (err, res) => {
          setIsProcessing(false);
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.batchList_(projectId);
            StoreActions.batchListVersions_(editBatchPredId);
            StoreActions.batchDescribeById_(editBatchPredId);

            Location.push('/' + PartsLink.batchpred_detail + '/' + projectId + '/' + editBatchPredId);
          }
        },
      );
      return;
    } else if (readCustom === 'fg' || readCustom === 'fg_train') {
      let vv = doProcessArgs(values);

      setIsProcessing(true);
      let outputFormat1 = values.outputType?.value;
      if (foundProject1?.isNlp === true) {
        outputFormat1 = 'JSON';
      }
      let overFG = overridesFG;
      if (overFG != null) {
        overFG = JSON.stringify(overFG);
      }

      setEditConnectorState((state1) => {
        REClient_.client_().createBatchPrediction(
          deployId,
          state1?.editFGTablename,
          values.name,
          JSON.stringify(vv),
          values.explanations,
          outputFormat1,
          undefined,
          undefined,
          undefined,
          undefined,
          values.csvInputPrefix,
          values.csvPredictionPrefix,
          values.csvExplanationPrefix,
          overFG,
          undefined,
          resultInputColumns,
          metadataColumn,
          (err, res) => {
            if (err || !res?.success) {
              setIsProcessing(false);
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              let batchPredictionId = res?.result?.batchPredictionId;

              // writeOverrides(deployId, batchPredictionId).then(() => {
              doConfigEditSave(state1 ?? {}, batchPredictionId, null, () => {
                setIsProcessing(true);
                REClient_.client_().startBatchPrediction(batchPredictionId, (err, res) => {
                  setIsProcessing(false);
                  if (err || !res?.success) {
                    REActions.addNotificationError(err || Constants.errorDefault);
                  } else {
                    StoreActions.batchList_(projectId);
                    StoreActions.batchListVersions_(batchPredictionId);
                    StoreActions.batchDescribeById_(batchPredictionId);
                    StoreActions.featureGroupsGetByProject_(projectId);

                    Location.push('/' + PartsLink.batchpred_detail + '/' + projectId + '/' + batchPredictionId);
                  }
                });
              });
              // });
            }
          },
        );

        return state1;
      });
      return;
    }

    let bucketURL = null;
    if (writeCustom && bucketSelObject && bucketPath) {
      bucketURL = bucketSelObject.bucket;
      if (!_.startsWith(bucketPath, '/')) {
        bucketURL += '/';
      }
      bucketURL += bucketPath;
    }

    let bucketURLRead = null;
    if (readCustom && bucketSelReadObject && bucketPathRead) {
      bucketURLRead = bucketSelReadObject.bucket;
      if (!_.startsWith(bucketPathRead, '/')) {
        bucketURLRead += '/';
      }
      bucketURLRead += bucketPathRead;
    }

    setIsProcessing(true);

    let sendArgs = null;
    if (argsFieldNames != null && _.isArray(argsFieldNames)) {
      argsFieldNames.some((k1) => {
        sendArgs = sendArgs || {};
        sendArgs[k1] = values[k1];
      });
    }
    if (argsFieldNamesTrue != null && _.isArray(argsFieldNamesTrue)) {
      argsFieldNamesTrue.some((k1) => {
        sendArgs = sendArgs || {};
        sendArgs[k1] = values[k1];
      });
    }

    const doWorkBatchPred = (err, res, batchPredictionId) => {
      if (refIsM.current) {
        setIsProcessing(false);
      }

      if (err || !res || !res.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.batchList_(projectId);
        StoreActions.batchListVersions_(batchPredictionId);
        StoreActions.batchDescribeById_(batchPredictionId);

        StoreActions.refreshDoBatchAll_(batchPredictionId, projectId);

        Location.push('/' + PartsLink.deploy_batch + '/' + projectId, undefined, 'showList=true');
      }
    };

    let doWorkSend = () => {
      if (readCustom === 'list') {
        let idsText = values.listIDs;
        let ids = idsText?.split(/[\n]/);
        ids = ids?.filter((v1) => _.trim(v1 || '') !== '')?.map((v1) => _.trim(v1));
        REClient_.client_()._batchPredictFromIds(deployId, values.name, values.outputType?.value || 'json', ids, (err, res) => {
          if (err || !res?.success) {
            if (refIsM.current) {
              setIsProcessing(false);
            }
            REActions.addNotificationError(err || Constants.errorDefault);
            return;
          }
          doWorkBatchPred(err, res, res?.result?.batchPredictionId);
        });
      } else if (readCustom === 'upload') {
        let files = values.fileRead;
        let file1 = null;
        if (files && files.length > 0) {
          file1 = files[0];
        }
        file1 = file1?.originFileObj ?? file1;

        REClient_.client_().batchPredictionFromUpload(sendArgs, deployId, values.name, values.explanations, (err, res) => {
          if (err || !res?.success) {
            if (refIsM.current) {
              setIsProcessing(false);
            }
            REActions.addNotificationError(err || Constants.errorDefault);
            return;
          }
          REUploads_.client_().doUploadNew(
            undefined,
            undefined,
            undefined,
            false,
            res?.result?.uploadId,
            undefined,
            values.name,
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
            (errU, resU) => {
              doWorkBatchPred(errU, res, res?.result?.batchPredictionId);
            },
          );
        });
      } else {
        let refreshSchedule = values.refreshSchedule;
        if (readCustom === 'upload') {
          refreshSchedule = null;
        }

        REClient_.client_().batchPredict(sendArgs, deployId, values.name, bucketURLRead, bucketURL, refreshSchedule, values.explanations, (err, res) => {
          doWorkBatchPred(err, res, res?.result?.batchPredictionId);
        });
      }
    };

    if (bucketURLRead == null) {
      doWorkSend();
    } else {
      REClient_.client_()._fileExists(bucketSelReadObject.bucket, bucketPathRead, (err, res) => {
        if (err || !res?.success) {
          setIsProcessing(false);
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (!res?.result) {
            setIsProcessing(false);
            REActions.addNotificationError('Input file not found');
          } else {
            doWorkSend();
          }
        }
      });
    }
  };

  const [bucketSel, setBucketSel] = useState(null as { bucket: string; verified: boolean; writePermission: boolean });
  const [bucketPath, setBucketPath] = useState(null as string);

  const [bucketSelRead, setBucketSelRead] = useState(null as { bucket: string; verified: boolean; writePermission: boolean });
  const [bucketPathRead, setBucketPathRead] = useState(null as string);

  const onClickGoList = (e) => {
    Location.push('/' + PartsLink.deploy_batch + '/' + paramsProp?.get('projectId') + '/' + paramsProp?.get('deployId'), undefined, 'showList=true');
  };

  const rulesWriteFile = ({ getFieldValue }) => ({
    validator(rule, value) {
      if (writeCustom !== 'console') {
        if (bucketSelObject) {
          if (!bucketSelObject.writePermission || !bucketSelObject.verified) {
            return Promise.reject('Needs write permission and verified');
          }
        }
        if (!bucketSelObject || Utils.isNullOrEmpty(bucketPath)) {
          return Promise.reject('Enter a valid path');
        }
      }
      return Promise.resolve();
    },
  });
  const rulesWriteFile1 = ({ getFieldValue }) => ({
    validator(rule, value) {
      return Promise.resolve();
    },
  });
  const onChangeCheck = (option1) => {
    setWriteCustom(option1?.value || 'custom');
    setBucketSel(null);
    setBucketPath(null);

    setTimeout(() => {
      form.validateFields(['outputFile2']);
    }, 0);
  };

  const rulesReadFile = ({ getFieldValue }) => ({
    validator(rule, value) {
      if (readCustom !== 'console' && readCustom !== 'list' && readCustom !== 'upload' && readCustom !== 'fg' && readCustom !== 'fg_train') {
        if (bucketSelReadObject) {
          if (!bucketSelReadObject.verified) {
            return Promise.reject('Needs read permission and verified');
          }
        }
        if (!bucketSelReadObject || Utils.isNullOrEmpty(bucketPathRead)) {
          return Promise.reject('Enter a valid path');
        }
      }
      return Promise.resolve();
    },
  });
  const rulesReadFile1 = ({ getFieldValue }) => ({
    validator(rule, value) {
      return Promise.resolve();
    },
  });
  const onChangeCheckRead = (option1) => {
    let v1 = option1?.value || 'custom';
    setReadCustomInt(v1);
    setBucketSelRead(null);
    setBucketPathRead(null);

    setTimeout(() => {
      form.validateFields(['inputFile2']);
    }, 0);
  };

  const onClickConfigConnectedServices = (e) => {
    Location.push('/' + PartsLink.profile + '/' + UserProfileSection.connected_services);
  };

  const findOptionSel = (value, isRead = false) => {
    if (value == null) {
      // if(!full_batch_supported && isRead) {
      //   value = 'upload';
      // } else {
      value = defaultCustomReadValue;
      // }
    }
    return (isRead ? optionsListRead : optionsList)?.find((o1) => o1.value === value);
  };

  const optionsOutputType = useMemo(() => {
    const res = [
      { label: 'CSV', value: 'CSV' },
      { label: 'JSON', value: 'JSON' },
    ];
    let outputType = form?.getFieldValue('outputType');
    if (Utils.isNullOrEmpty(outputType?.value)) {
      const o1 = res.find((o1) => o1.value === 'CSV');
      setTimeout(() => {
        setIsCsv(true);
        form?.setFieldsValue({ outputType: o1 });
      }, 0);
    } else {
      setIsCsv(outputType?.value === 'CSV');
    }
    return res;
  }, [form]);

  const optionsListRead = useMemo(() => {
    let res = [
      // { label: 'File Upload', value: 'upload', },
      // { label: 'S3', value: 's3', },
      // { label: 'Google Cloud Storage', value: 'gcs', },
      { label: 'Attach Prediction Feature Group(s)', value: 'fg' },
    ];
    if (full_batch_supported) {
      let label = 'List of IDs';
      if (problemType === 'REGRESSION') {
        label = 'List of primary key ids';
      }
      res.push({ label: label, value: 'list' });
      // res.unshift({ label: 'All IDs', value: 'console', });
    }
    if (problemType !== 'REGRESSION') {
      res.unshift({ label: 'Predict on training Item Ids', value: 'fg_train' });
    }
    if (useCaseInfo != null) {
      let inputFile = form.getFieldValue('inputFile');
      if (Utils.isNullOrEmpty(inputFile?.value) || (!full_batch_supported && inputFile?.value === 'console')) {
        let r1 = defaultCustomReadValue;
        if (full_batch_supported && (paramsProp?.get('idsList') || paramsProp?.get('filterList'))) {
          r1 = 'list';
        }
        if (readCustom !== r1) {
          setTimeout(() => {
            setReadCustomInt(r1);
          }, 0);
        }

        inputFile = res.find((o1) => o1.value === r1);
        setTimeout(() => {
          form.setFieldsValue({ inputFile });
          setInitialInputFile(inputFile);
        }, 0);
      }
    }

    return res;
  }, [full_batch_supported, useCaseInfo, defaultCustomReadValue]);
  const optionsList = useMemo(() => {
    let res = [
      { label: 'File on Console', value: 'console' },
      { label: 'S3', value: 's3' },
      { label: 'Google Cloud Storage', value: 'gcs' },
      { label: 'Azure Blob Storage', value: 'azure' },
    ];
    if (readCustom === 'upload') {
      res = [res[0]];
    }

    let outputFile1 = form.getFieldValue('outputFile');
    if (outputFile1 != null) {
      if (outputFile1.value !== 'console' && outputFile1.value !== 'list') {
        const v1 = res[0];
        setTimeout(() => {
          form.setFieldsValue({ outputFile: v1 });
          onChangeCheck(v1);
        }, 0);
      }
    }

    return res;
  }, [readCustom]);

  const calcStartWith = (value) => {
    if (value == null || value === 'console' || value === 'fg' || value === 'fg_train') {
      return null;
    } else if (value === 's3') {
      return 's3:';
    } else if (value === 'gcs') {
      return 'gs:';
    } else {
      return null;
    }
  };

  const onChangeCronValue = (v1) => {
    form?.setFieldsValue({ refreshSchedule: v1 });
  };

  const batchPredOne = useBatchPred(editBatchPredId);

  const formInitValues = useRef(null);

  useEffect(() => {
    if (forEvalSupported && batchPredOne !== null) {
      if (batchPredOne?.globalPredictionArgs?.['forEval'] === true) {
        setIsForEval(true);
      } else {
        setIsForEval(false);
      }
    }
  }, [batchPredOne, forEvalSupported]);

  useEffect(() => {
    setMetadataColumn(batchPredOne?.outputIncludesMetadata || false);
    if (batchPredOne?.resultInputColumns != null && _.isArray(batchPredOne?.resultInputColumns) && batchPredOne?.resultInputColumns?.length > 0) {
      setResultInputColumns(batchPredOne?.resultInputColumns ?? []);
    }
    let featureGroups = batchPredOne?.batchInputs?.featureGroups;
    if (featureGroups != null) {
      let fgOverrides = {};
      featureGroups?.map((val) => {
        if (val?.datasetType) {
          fgOverrides[val?.datasetType] = val?.featureGroupId;
        }
      });
      setOverridesFG(fgOverrides);
    }
  }, [batchPredOne]);

  const isReadCustomFGTrain = isForEval ? false : readCustom === 'fg_train';
  const optionsGetCallInt = useCallback(
    (isExpl, isInfoTab, cbFinish) => {
      if (Utils.isNullOrEmpty(deployId)) {
        if (isExpl) {
          setHideExpl(true);
        } else {
          setHideAdvanced(true);
        }
        return;
      }

      // TODO: need to memoize this call. lots of api calls are being made.
      REClient_.client_()._getBatchPredictionArgs(deployId, isReadCustomFGTrain, isForEval, JSON.stringify(overridesFG ?? {}), (err, res) => {
        let r1 = res?.result;
        if (_.isEmpty(r1)) {
          r1 = null;
        }

        if (r1 != null) {
          setBpColumnsFilterValues(
            r1?.['outputColumns']?.value?.map((val) => {
              return { value: val };
            }) ?? [],
          );
          let isInfoTabRow = (a1) => a1?.infoTab === true;
          let chk = (a1) => a1?.explanationOption === true;
          if (!isExpl) {
            chk = (a1) => a1?.explanationOption !== true;
          }
          let r2: any = {};
          let kk = Object.keys(r1 ?? {});
          kk.some((k1) => {
            let v1 = r1?.[k1];
            if (chk(v1) && isInfoTab === isInfoTabRow(v1) && v1?.skipDisplay !== true) {
              r2[k1] = v1;
            }
          });
          r1 = r2;

          if (res != null) {
            res.result = r1;
          }

          if (_.isEmpty(r1)) {
            r1 = null;
          }
        }

        if (res?.success) {
          if (isExpl) {
            if (r1 == null) {
              setHideExpl(true);
            } else {
              setHideExpl(false);
            }
          } else {
            if (r1 == null) {
              setHideAdvanced(true);
            } else {
              setHideAdvanced(false);
            }
          }
        }

        //
        if (batchPredOne != null && editBatchPredId && r1 != null) {
          let globalPredictionArgsInputs = batchPredOne?.globalPredictionArgsInputs;
          let globalPredictionArgs = batchPredOne?.globalPredictionArgs;
          if (globalPredictionArgs != null) {
            let vvSet: any = {};

            let kk = Object.keys(globalPredictionArgs);
            kk.some((k1) => {
              let v1 = globalPredictionArgs?.[k1];

              let rS = r1?.[k1];
              if (rS?.dataType?.toLowerCase() === 'datetime' && !Utils.isNullOrEmpty(v1)) {
                v1 = moment(v1);
              }

              // a temporary patch to resolve the issue where crash happens when populating the dates on the UI. Will fix properly as part of PI-4120
              // start patch
              if (k1 == 'predictionStart') {
                return;
              }
              // end patch.

              vvSet[k1] = v1;
            });

            let vvSet2 = { ...(vvSet ?? {}) };
            let explanations1 = batchPredOne?.explanations;
            if (explanations1 != null) {
              vvSet2.explanations = explanations1;
            }
            if (vvSet != null && !_.isEmpty(vvSet)) {
              formInitValues.current = vvSet;
              setTimeout(() => {
                form?.setFieldsValue(vvSet2);
                optionsOnValuesChange(vvSet, vvSet, form);
              }, 0);
            } else if (vvSet2 != null && !_.isEmpty(vvSet2)) {
              setTimeout(() => {
                form?.setFieldsValue(vvSet2);
              }, 0);
            }
          }
        }

        //
        cbFinish?.(err, res);
      });
    },
    [batchPredOne, editBatchPredId, deployId, form, isForEval, isReadCustomFGTrain, overridesFG],
  );

  const optionsGetCallTrue = useCallback(
    (cbFinish) => {
      return optionsGetCallInt?.(true, false, cbFinish);
    },
    [optionsGetCallInt],
  );
  const optionsGetCallFalse = useCallback(
    (cbFinish) => {
      return optionsGetCallInt?.(false, false, cbFinish);
    },
    [optionsGetCallInt],
  );

  const optionsGetCallInfoTab = useCallback(
    (cbFinish) => {
      return optionsGetCallInt?.(undefined, true, cbFinish);
    },
    [optionsGetCallInt],
  );

  const onUsedFieldNames = useCallback((names) => {
    setTimeout(() => {
      setArgsFieldNames(names);
    }, 0);
  }, []);
  const onUsedFieldNamesTrue = useCallback((names) => {
    setTimeout(() => {
      setArgsFieldNamesTrue(names);
    }, 0);
  }, []);

  const setFieldsValue = useCallback(
    (values) => {
      if (values == null) {
        return;
      }

      let vv = values;
      if (formInitValues.current != null) {
        vv = _.assign({}, values ?? {}, formInitValues.current);
      }

      setTimeout(() => {
        form?.setFieldsValue(vv);
      }, 0);
    },
    [form, editBatchPredId],
  );
  const onValuesChange = (changedValues, values) => {
    optionsOnValuesChange(changedValues, values, form);

    if (changedValues.outputType != null) {
      setTimeout(() => {
        setIsCsv(changedValues.outputType?.value === 'CSV');
      }, 0);
    }
  };
  const onChangeForm = (values?) => {
    setTimeout(() => {
      if (form?.getFieldValue('forEval') !== undefined) {
        setIsForEval(form?.getFieldValue('forEval') === true);
      }
    }, 0);
    formForceRefresh();
  };

  const formForceRefresh = () => {
    forceUpdate();
  };

  const alreadySetCsv = useRef(false);
  useEffect(() => {
    if (form && editBatchPredId != null && batchPredOne != null) {
      if (alreadySetCsv.current === false) {
        alreadySetCsv.current = true;

        form.setFieldsValue({
          csvInputPrefix: batchPredOne?.csvInputPrefix,
          csvPredictionPrefix: batchPredOne?.csvPredictionPrefix,
          csvExplanationPrefix: batchPredOne?.csvExplanationsPrefix,
        });
      }
    }
  }, [editBatchPredId, batchPredOne, form]);

  const argsFieldNamesUsed = (argsFieldNames != null && argsFieldNames.length > 0) || (argsFieldNamesTrue != null && argsFieldNamesTrue.length > 0);

  const refLastGetListIds = useRef(null);
  const onGetListIds = (ids) => {
    refLastGetListIds.current = ids;
    forceUpdate();
  };

  useEffect(() => {
    let ids = refLastGetListIds.current;

    if (!ids || !form || readCustom !== 'list') {
      return;
    }

    refLastGetListIds.current = null;

    let s1 = '';
    let useComma = true;
    ids?.some((id1) => {
      if (('' + id1).indexOf(',') > -1) {
        useComma = false;
        return true;
      }
    });
    ids?.some((id1, ind) => {
      if (useComma) {
        if (ind > 0) {
          s1 += ',';
        }
        s1 += '' + id1;
      } else {
        if (ind > 0) {
          s1 += '\n';
        }
        s1 += '' + id1;
      }
    });

    setTimeout(() => {
      form?.setFieldsValue({ listIDs: s1 });
    }, 0);
  }, [form, refLastGetListIds.current, readCustom]);

  const doConfigEditSave = (configState, batchPredId, batchPredOne, cbFinish) => {
    configState = configState ?? {};

    const doWork = () => {
      REClient_.client_().updateBatchPrediction(
        batchPredId,
        configState.editDeployId,
        undefined,
        configState.editExplanation,
        configState.editFileOutputFormat ?? (outputType === OutputTypeEnum.FeatureGroup ? undefined : 'CSV'),
        configState.csvInputPrefix,
        configState.csvPredictionPrefix,
        configState.csvExplanationsPrefix,
        null,
        metadataColumn,
        null,
        null,
        (err, res) => {
          setIsProcessing(false);
          cbFinish?.();
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.batchListVersions_(batchPredId);
            StoreActions.batchDescribeById_(batchPredId);
            StoreActions.batchList_(projectId, null, () => {
              setEditConnectorUuid(uuid.v1());
            });
          }
        },
      );
    };

    if (outputType === OutputTypeEnum.FeatureGroup) {
      let usedTablename = configState.editFGTablename;
      if (Utils.isNullOrEmpty(usedTablename)) {
        doWork();
        return;
      }

      REClient_.client_().setBatchPredictionFeatureGroupOutput(batchPredId, usedTablename, (errL, resL) => {
        if (errL || !resL?.success) {
          setIsProcessing(false);
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    } else if (outputType === OutputTypeEnum.Connector) {
      let usedId = configState.editConnector ?? batchPredOne?.databaseConnectorId;
      let usedIdConfig = configState.editConnectorConfig ?? batchPredOne?.databaseOutputConfiguration?.objectName;
      let usedIdMode = configState.editConnectorMode ?? batchPredOne?.databaseOutputConfiguration?.mode;

      let cols = {};

      let colsValues = configState.editConnectorColumnsValues;
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

      let usedIdIdColumn = configState.editConnectorIDColumn;
      let usedIdIdColumnValue = configState.editConnectorIDColumnValue;
      if (usedIdIdColumn == null) {
        let cc = batchPredOne?.databaseOutputConfiguration?.idColumn;
        if (cc != null) {
          usedIdIdColumn = Object.keys(cc)?.[0];
          usedIdIdColumnValue = Object.values(cc)?.[0];
        }
      }

      let obj1: any = { objectName: usedIdConfig, mode: usedIdMode, dataColumns: cols };
      if (!Utils.isNullOrEmpty(usedIdIdColumn)) {
        obj1.idColumn = { [usedIdIdColumn]: usedIdIdColumnValue };
      }
      let usedAdditionalIdColumns = configState.editConnectorAdditionalIDColumns;
      if (_.isArray(usedAdditionalIdColumns) && usedAdditionalIdColumns?.length === 0) {
        usedAdditionalIdColumns = null;
      }
      if (!Utils.isNullOrEmpty(usedAdditionalIdColumns)) {
        obj1.additionalIdColumns = usedAdditionalIdColumns;
      }

      let config1 = JSON.stringify(obj1);
      REClient_.client_().setBatchPredictionDatabaseConnectorOutput(batchPredId, usedId, config1, (errL, resL) => {
        if (errL || !resL?.success) {
          setIsProcessing(false);
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    } else if (outputType === OutputTypeEnum.Storage) {
      if (Utils.isNullOrEmpty(configState.editLocation)) {
        doWork();
        return;
      }
      REClient_.client_().setBatchPredictionFileConnectorOutput(batchPredId, undefined, configState.editLocation, (errL, resL) => {
        if (errL || !resL?.success) {
          setIsProcessing(false);
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    } else {
      REClient_.client_().setBatchPredictionOutputToConsole(batchPredId, (errL, resL) => {
        if (errL || !resL?.success) {
          setIsProcessing(false);
          REActions.addNotificationError(errL || Constants.errorDefault);
        } else {
          doWork();
        }
      });
    }
  };
  const onChangeMetadataColumn = (e) => {
    setMetadataColumn(e.target.value);
  };
  const outputTypeElem = useMemo(() => {
    const onChangeOutputType = (e) => {
      setOutputType(e.target.value);
    };

    let output1 = (
      <span>
        <Radio.Group value={outputType} onChange={onChangeOutputType}>
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

    let dataList = [],
      isEdit = true;

    dataList.push({
      id: 9999999,
      name: (
        <span>
          Output Type:
          <HelpIcon id={'deploybatchapi_outputtype'} style={{ marginLeft: '4px' }} />
        </span>
      ),
      value: output1,
      marginVert: 20,
    });

    if (outputType === OutputTypeEnum.FeatureGroup) {
      let obj1 = {
        id: 8000,
        name: 'Feature Group - Table Name:',
        helpId: 'batchDetail_location_fg',
        value: (
          <span
            css={`
              display: inline-block;
              ${isEdit ? 'width: 200px;' : ''}
            `}
          >
            {isEdit ? (
              <Form.Item name={'featureGroupTableName'} rules={[{ required: true, message: 'Required!' }]}>
                <Input
                  value={editConnectorState.editFGTablename ?? ''}
                  onChange={(e) => {
                    setEditConnectorState((s1) => {
                      s1.editFGTablename = e.target.value;
                      s1 = { ...s1 };
                      return s1;
                    });
                  }}
                />
              </Form.Item>
            ) : null}
          </span>
        ),
      };

      dataList.push(obj1);
    } else if (outputType === OutputTypeEnum.Storage) {
      let obj1 = {
        id: 777,
        name: 'Location:',
        helpId: 'batchDetail_location',
        value: (
          <span
            css={`
              display: inline-block;
              ${isEdit ? 'width: 300px;' : ''}
            `}
          >
            {isEdit ? (
              <Form.Item name={'storageLocation'} rules={[{ required: true, message: 'Required!' }]}>
                <InputCloud
                  placeholder=""
                  value={editConnectorState.editLocation ?? ''}
                  onChange={(e) => {
                    setEditConnectorState((s1) => {
                      s1.editLocation = e.target.value;
                      s1 = { ...s1 };
                      return s1;
                    });
                  }}
                />
              </Form.Item>
            ) : null}
          </span>
        ),
      };

      dataList.push(obj1);
    } else if (outputType === OutputTypeEnum.Connector) {
      const onChangeState = (stateNew) => {
        if (stateNew != null && !_.isEmpty(stateNew)) {
          setEditConnectorState((s1) => {
            return _.assign({}, s1 ?? {}, stateNew ?? {});
          });
        }
      };

      let obj1 = {
        id: 500000,
        value: <ConnectorEditInline showTooltips key={'ccc' + editConnectorUuid} onChangeState={onChangeState} isEdit={isEdit} />,
        onlyValue: true,
      };
      dataList.push(obj1);
    }

    if (outputType !== OutputTypeEnum.FeatureGroup) {
      let editFileOutputFormat1 = editConnectorState.editFileOutputFormat;
      if (Utils.isNullOrEmpty(editFileOutputFormat1)) {
        editFileOutputFormat1 = 'CSV';
      }

      dataList.push({
        id: 111115,
        name: 'Output Format:',
        helpId: 'batchDetail_outputFormat',
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
                    setEditConnectorState((s1) => {
                      s1.editFileOutputFormat = option1?.value;
                      s1 = { ...s1 };
                      return s1;
                    });
                  }}
                  value={{ label: editFileOutputFormat1, value: editFileOutputFormat1 }}
                  options={[
                    { label: 'CSV', value: 'CSV' },
                    { label: 'JSON', value: 'JSON' },
                  ]}
                />
              </span>
            )}
            {!isEdit && '-'}
          </span>
        ),
      });
    }

    return dataList.map((d1) => (
      <div key={'val_' + d1.id} style={{ margin: (d1.marginVert ?? 5) + 'px 0' }}>
        {d1.onlyValue && <span>{d1.value}</span>}
        {!d1.onlyValue && (
          <span>
            <DetailName>
              {d1.name}
              <HelpIcon id={d1.helpId} style={{ marginLeft: '4px' }} />
            </DetailName>
            <DetailValue style={{ color: d1.valueColor ?? '#ffffff' }}>{d1.value}</DetailValue>
          </span>
        )}
      </div>
    ));
  }, [outputType, metadataColumn, editConnectorUuid, editConnectorState]);

  const onChangeFGOverrides = (values) => {
    setOverridesFG(values);
  };

  const onChangeIsForEval = (option) => {
    setIsForEval(option.target.value);
    if (problemType === 'REGRESSION' && option.target.value === false) {
      setReadCustom(initialInputFile.value ?? 'fg_train');
    } else {
      setReadCustom('fg_train');
    }
    form.setFieldValue('inputFile', initialInputFile);
  };

  const nextButtonString = useMemo(() => {
    switch (step) {
      case EStep.Inputs:
        return 'Next: Advanced Options';

      case EStep.Options:
        // if(hasAdvancedOptions) {
        return 'Next: Configure Output';

      // } else {
      //   return null;
      // }
      case EStep.Outputs:
        return null;

      default:
        return null;
    }
  }, [step, hasAdvancedOptions]);

  const onClickNext = (isStart, forceValidateFieldsNames, e) => {
    if (isStart) {
      return;
    }

    if (!Utils.isNullOrEmpty(editBatchPredId)) {
      return;
    }
    if (hasAdvancedOptions == null) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (step === EStep.Outputs) {
      return;
    } else {
      e.preventDefault();
      e.stopPropagation();

      const doWork = () => {
        let nextStep;
        switch (step) {
          case EStep.Inputs:
            nextStep = EStep.Options;
            break;
          case EStep.Options:
            // if(hasAdvancedOptions) {
            nextStep = EStep.Outputs;
            // }
            break;
        }
        if (nextStep != null) {
          setStep(nextStep);
        }
      };

      if (forceValidateFieldsNames != null) {
        form
          ?.validateFields(forceValidateFieldsNames)
          .then((res) => {
            doWork();
          })
          .catch((e) => {
            //
          });
      } else {
        doWork();
      }
    }
  };

  const onClickBack = (e) => {
    e.preventDefault();
    e.stopPropagation();

    let nextStep;
    switch (step) {
      case EStep.Options:
        nextStep = EStep.Inputs;
        break;
      case EStep.Outputs:
        nextStep = EStep.Options;
        break;
    }
    if (nextStep != null) {
      setStep(nextStep);
    }
  };

  const onChangeBpFilterColumns = (values) => {
    setResultInputColumns(values);
  };

  const titleStep = useMemo(() => {
    if (step == null) {
      return null;
    } else {
      switch (step) {
        case EStep.Inputs:
          return 'Configure Inputs';
        case EStep.Outputs:
          return 'Configure Outputs';
        case EStep.Options:
          return 'Advanced Options (Optional)';
      }
    }
  }, [step]);

  const showAlsoStart = useMemo(() => {
    return false;
    // return step!=null && editBatchPredId==null && step===EStep.Outputs;
  }, [step, hasAdvancedOptions, editBatchPredId]);

  const forceValidateFieldsNames = useMemo(() => {
    if (step == null) {
      return null;
    } else {
      switch (step) {
        case EStep.Inputs:
          return ['deployOne', 'name', 'inputFile', 'listIDs', 'fileRead', 'inputFile2'];
        case EStep.Outputs:
          return ['outputFile', 'outputFile2', 'featureGroupTableName', 'storageLocation'];
        case EStep.Options:
          return null;
      }
    }
  }, [step]);

  return (
    <div className={sd.table} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: '25px' }}>
      {!Utils.isNullOrEmpty(paramsProp.get('idsList')) && (
        <SmartMetricsList
          dataIndex={paramsProp?.get('idsDataIndex')}
          onGetListIds={onGetListIds}
          barChart={paramsProp?.get('idsBarChart')}
          detailModelVersion={paramsProp?.get('idsDetailModelVersion')}
          projectId={paramsProp?.get('projectId')}
        />
      )}
      {!Utils.isNullOrEmpty(paramsProp.get('filterList')) && (
        <SmartMetricsList
          onGetListIds={onGetListIds}
          filterLongName={paramsProp?.get('filterLongName')}
          filterNameSmall={paramsProp?.get('filterNameSmall')}
          filterIdsName={paramsProp?.get('filterIdsName')}
          filterModelVersion={paramsProp?.get('filterModelVersion')}
          projectId={paramsProp?.get('projectId')}
        />
      )}
      <RefreshAndProgress msgMsg={isProcessing ? 'Processing...' : null} isMsgAnimRefresh isDim={isProcessing}>
        <NanoScroller onlyVertical>
          <div style={{ position: 'relative' }}>
            <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
              {!editBatchPredId && (
                <span style={{ float: 'right' }}>
                  <Button style={{}} type={'primary'} onClick={onClickGoList}>
                    Batch Prediction Results
                  </Button>
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>
                  {editBatchPredId ? 'Edit ' : ''}Batch Prediction{editBatchPredId ? '' : 's'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <div style={{ margin: '0 auto', maxWidth: '900px', padding: '22px', borderRadius: '4px' }} className={sd.grayPanel}>
                {titleStep != null && (
                  <div
                    css={`
                      font-size: 15px;
                      padding: 5px 0 6px;
                      text-align: center;
                      background: rgba(255, 255, 255, 0.1);
                      border-radius: 4px;
                      margin-bottom: 20px;
                    `}
                  >
                    {titleStep}
                  </div>
                )}

                <FormExt
                  layout={'vertical'}
                  form={form}
                  onFinish={handleSubmit}
                  onValuesChange={onValuesChange}
                  onChange={onChangeForm}
                  initialValues={{
                    csvPredictionPrefix: 'prediction_',
                    csvExplanationPrefix: 'explanation_',
                    outputFile: findOptionSel(writeCustom),
                    name: optionsDeploysSel == null ? '' : optionsDeploysSel?.label + ' Batch Prediction',
                    deployOne: optionsDeploysSel,
                  }}
                >
                  <div
                    style={{ display: isStep(EStep.Inputs) ? 'block' : 'none' }}
                    css={`
                      border-bottom: 1px solid ${Utils.colorA(0.14)};
                      margin-bottom: 14px;
                    `}
                  >
                    <Form.Item name={'deployOne'} rules={[{ required: true, message: 'Required!' }]} style={{ marginBottom: '16px' }} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Deployment:</span>}>
                      <SelectExt isDisabled={editBatchPredId != null} value={optionsDeploysSel} options={optionsDeploys ?? []} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name={'name'}
                    rules={null}
                    style={{ display: isStep(EStep.Inputs) ? 'block' : 'none' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Batch Prediction Name:
                        <HelpIcon id={'deploy_batch_pred_name'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input
                      css={
                        editBatchPredId != null
                          ? `&.ant-input-affix-wrapper-disabled.ant-input-affix-wrapper-disabled {
                      background-color: #424242 !important;
                    }`
                          : ''
                      }
                      disabled={editBatchPredId != null}
                      placeholder=""
                      autoComplete={'off'}
                    />
                  </Form.Item>
                  {/*<Form.Item name={'tableName'} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Results Feature Group Table Name:<HelpIcon id={'deploy_batch_pred_table_name'} style={{ marginLeft: '4px', }} /></span>}>*/}
                  {/*  <Input placeholder="" autoComplete={'off'} />*/}
                  {/*</Form.Item>*/}
                  <div
                    style={{ display: editBatchPredId == null && isStep(EStep.Inputs) && forEvalSupported === true ? 'block' : 'none' }}
                    css={`
                      border-bottom: 1px solid ${Utils.colorA(0.14)};
                      margin-bottom: 14px;
                    `}
                  >
                    <Form.Item
                      name={'forEval'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {predictForEvalTitle}
                          {
                            <span style={{ marginLeft: '5px' }}>
                              <HelpIcon id={'deploy_batch_predict_for_evaluation'} />
                            </span>
                          }
                        </span>
                      }
                    >
                      <Radio.Group value={isForEval} onChange={onChangeIsForEval} defaultValue={isForEval}>
                        <Radio value={true}>
                          <span
                            css={`
                              color: white;
                            `}
                          >
                            {predictForEvalOptions['YES']}
                          </span>
                        </Radio>
                        <Radio value={false}>
                          <span
                            css={`
                              color: white;
                            `}
                          >
                            {predictForEvalOptions['NO']}
                          </span>
                        </Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                  {editBatchPredId == null && (
                    <Form.Item
                      style={{ display: isStep(EStep.Inputs) && (forEvalSupported == false || (forEvalSupported == true && isForEval === false)) ? 'block' : 'none' }}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Prediction Input:
                          {
                            <span style={{ marginLeft: '5px' }}>
                              <HelpIcon id={'deploy_batch_api_pred_input'} />
                            </span>
                          }
                        </span>
                      }
                    >
                      <div style={{ width: '280px', marginBottom: '5px' }}>
                        <Form.Item name={'inputFile'} noStyle rules={[rulesReadFile1]}>
                          <SelectExt onChange={onChangeCheckRead} options={optionsListRead} />
                        </Form.Item>
                      </div>
                      <div>
                        {!['console', 'list', 'upload', 'fg', 'fg_train'].includes(readCustom) && (
                          <Form.Item shouldUpdate={true} name={'inputFile2'} noStyle rules={[rulesReadFile]}>
                            <CloudBucketBrowse
                              onBucketObjectChanged={(v1) => setBucketSelReadObject(v1)}
                              bucketSel={bucketSelRead}
                              bucketPath={bucketPathRead}
                              startsWith={calcStartWith(readCustom)}
                              onlyBucket={false}
                              onBucketSel={(b1) => setBucketSelRead(b1)}
                              onPathChange={(v1) => setBucketPathRead(v1)}
                            />
                          </Form.Item>
                        )}
                        {readCustom === 'upload' && <FormItemFileUpload accept={'.jsonl,.csv,.ndjson'} formRefInstance={form} label={''} name={'fileRead'} dark />}
                        {readCustom === 'list' && (
                          <>
                            <Form.Item noStyle name={'listIDs'} rules={readCustom === 'list' ? [{ required: true, message: 'Required!' }] : []}>
                              <Input.TextArea style={{ height: '80px' }} />
                            </Form.Item>
                            <div
                              css={`
                                color: white;
                                opacity: 0.7;
                                margin-top: 3px;
                              `}
                            >
                              (Enter one ID on each line)
                            </div>
                          </>
                        )}
                        {['fg', 'fg_train'].includes(readCustom) && (
                          <Form.Item
                            name={'configFG'}
                            label={
                              <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                Prediction Feature Groups:
                                {
                                  <span style={{ marginLeft: '5px' }}>
                                    <HelpIcon id={'deploy_batch_api_fgs_override'} />
                                  </span>
                                }
                              </span>
                            }
                          >
                            <BatchConfigFeatureGroups deploymentId={deployId} projectId={projectId} batchPredId={editBatchPredId} onChange={onChangeFGOverrides} />
                          </Form.Item>
                        )}
                      </div>
                    </Form.Item>
                  )}

                  <div
                    style={{ display: editBatchPredId == null && isStep(EStep.Inputs) ? 'block' : 'none' }}
                    css={`
                      border-bottom: 1px solid ${Utils.colorA(0.14)};
                      margin-bottom: 14px;
                    `}
                  >
                    <Form.Item
                      name={'metadataColumn'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Metadata Columns in Output
                          {
                            <span style={{ marginLeft: '5px' }}>
                              <HelpIcon id={'deploy_batch_api_metadata_column'} />
                            </span>
                          }
                        </span>
                      }
                    >
                      <Radio.Group value={metadataColumn} onChange={onChangeMetadataColumn} defaultValue={metadataColumn}>
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
                    </Form.Item>
                  </div>

                  {problemType !== 'FORECASTING' && problemType !== 'REGRESSION' && foundProject1?.isNlp !== true && (readCustom === 'fg' || readCustom === 'fg_train') && isStep(EStep.Options) && (
                    <div
                      css={`
                        display: block;
                        width: 100%;
                      `}
                    >
                      {/*// @ts-ignore*/}
                      <Collapse bordered={false} style={{ backgroundColor: Utils.colorA(0.08), color: 'white', marginTop: '10px', borderBottom: 'none' }}>
                        {/*// @ts-ignore*/}
                        <Panel header={<span style={{ color: Utils.colorAall(1) }}>Prefixes</span>} forceRender={true} key={'prefixes'} style={{ borderBottom: 'none' }}>
                          <div
                            css={`
                              flex: 1;
                              margin-right: 5px;
                            `}
                          >
                            <Form.Item
                              label={
                                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                  Input Prefix:
                                  {
                                    <span style={{ marginLeft: '5px' }}>
                                      <HelpIcon id={'deploy_batch_api_csv_input_prefix'} />
                                    </span>
                                  }
                                </span>
                              }
                            >
                              <div style={{ marginBottom: '5px' }}>
                                <Form.Item name={'csvInputPrefix'} noStyle>
                                  <Input />
                                </Form.Item>
                              </div>
                            </Form.Item>
                          </div>
                          <div
                            css={`
                              flex: 1;
                              margin-right: 5px;
                              margin-left: 5px;
                            `}
                          >
                            <Form.Item
                              label={
                                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                  Prediction Prefix:
                                  {
                                    <span style={{ marginLeft: '5px' }}>
                                      <HelpIcon id={'deploy_batch_api_csv_prediction_prefix'} />
                                    </span>
                                  }
                                </span>
                              }
                            >
                              <div style={{ marginBottom: '5px' }}>
                                <Form.Item name={'csvPredictionPrefix'} noStyle>
                                  <Input />
                                </Form.Item>
                              </div>
                            </Form.Item>
                          </div>
                          <div
                            css={`
                              flex: 1;
                              margin-left: 5px;
                            `}
                          >
                            <Form.Item
                              label={
                                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                  Explanation Prefix:
                                  {
                                    <span style={{ marginLeft: '5px' }}>
                                      <HelpIcon id={'deploy_batch_api_csv_explanation_prefix'} />
                                    </span>
                                  }
                                </span>
                              }
                            >
                              <div style={{ marginBottom: '5px' }}>
                                <Form.Item name={'csvExplanationPrefix'} noStyle>
                                  <Input placeholder={'explanation_'} />
                                </Form.Item>
                              </div>
                            </Form.Item>
                          </div>
                        </Panel>
                      </Collapse>
                    </div>
                  )}

                  {editBatchPredId == null && (
                    <div
                      css={`
                        display: ${readCustom !== 'fg' && readCustom !== 'fg_train' && isStep(EStep.Outputs) ? 'block' : 'none'};
                      `}
                    >
                      <Form.Item
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            Prediction Output:{' '}
                            <HelpIcon id={'batch_api_prediction_output'} tooltipOnlyIfNonId tooltipText={'The output of the batch prediction job will be written to a file in JSON Lines (.jsonl) or CSV (.csv) depending on the Use Case.'} />
                          </span>
                        }
                      >
                        <div
                          style={{ width: '200px', marginBottom: '5px' }}
                          css={`
                            & .ant-select-selection-item {
                              color: white !important;
                            }
                          `}
                        >
                          <Form.Item name={'outputFile'} noStyle rules={[rulesWriteFile1]}>
                            <SelectExt onChange={onChangeCheck} options={optionsList} />
                          </Form.Item>
                        </div>
                        <div style={{ display: writeCustom !== 'console' ? 'block' : 'none' }}>
                          <Form.Item shouldUpdate={true} name={'outputFile2'} noStyle rules={[rulesWriteFile]}>
                            <CloudBucketBrowse
                              onBucketObjectChanged={(v1) => setBucketSelObject(v1)}
                              bucketSel={bucketSel}
                              bucketPath={bucketPath}
                              onlyWithWritePermissions={true}
                              startsWith={calcStartWith(writeCustom)}
                              onlyBucket={false}
                              onBucketSel={(b1) => setBucketSel(b1)}
                              onPathChange={(v1) => setBucketPath(v1)}
                            />
                          </Form.Item>
                        </div>
                      </Form.Item>
                    </div>
                  )}
                  {editBatchPredId == null && writeCustom !== 'console' && readCustom !== 'fg' && readCustom !== 'fg_train' && isStep(EStep.Outputs) && (
                    <div className={sd.styleTextBlue} style={{ display: writeCustom ? 'block' : 'none', textAlign: 'center', marginBottom: '30px' }}>
                      <span onClick={onClickConfigConnectedServices} style={{ cursor: 'pointer' }}>
                        Click here to configure connected services
                      </span>
                    </div>
                  )}

                  {editBatchPredId == null && readCustom !== 'fg' && readCustom !== 'fg_train' && readCustom !== 'upload' && isStep(EStep.Options) && <InputCron onChange={onChangeCronValue} style={{ marginTop: '10px' }} />}

                  {editBatchPredId == null && (readCustom === 'fg' || readCustom === 'fg_train') && (
                    <Form.Item
                      style={{ display: isStep(EStep.Outputs) ? 'block' : 'none' }}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Output Configuration: <HelpIcon id={'batch_api_prediction_output_config'} tooltipOnlyIfNonId />
                        </span>
                      }
                    >
                      {outputTypeElem}
                    </Form.Item>
                  )}

                  {((editBatchPredId != null && batchPredOne != null) || editBatchPredId == null) && (
                    <div
                      css={`
                        margin: 20px 10px;
                      `}
                      style={{ display: isStep(EStep.Inputs) ? 'block' : 'none' }}
                    >
                      <OptionsBuilder
                        formForceRefresh={formForceRefresh}
                        id={'' + optionsId}
                        projectId={projectId}
                        form={form}
                        onChangeForm={onChangeForm}
                        setFieldsValue={setFieldsValue}
                        onUsedFieldNames={onUsedFieldNames}
                        optionsGetCall={optionsGetCallInfoTab}
                        wrapForm={false}
                      />
                    </div>
                  )}

                  {((editBatchPredId != null && batchPredOne != null) || editBatchPredId == null) && (
                    <div
                      css={`
                        margin: 20px 10px;
                      `}
                      style={{ display: isStep(EStep.Options) ? 'block' : 'none' }}
                    >
                      <OptionsBuilder
                        formForceRefresh={formForceRefresh}
                        id={'' + optionsId}
                        projectId={projectId}
                        form={form}
                        onChangeForm={onChangeForm}
                        setFieldsValue={setFieldsValue}
                        onUsedFieldNames={onUsedFieldNames}
                        optionsGetCall={optionsGetCallFalse}
                        wrapForm={false}
                      />
                    </div>
                  )}

                  {explanations_supported && (
                    <div
                      style={{ display: isStep(EStep.Options) ? 'block' : 'none' }}
                      css={`
                        height: 15px;
                      `}
                    ></div>
                  )}
                  {explanations_supported && (
                    <Form.Item name={'explanations'} noStyle shouldUpdate valuePropName={'checked'}>
                      <Checkbox
                        onChange={(e) => {
                          forceUpdate();
                        }}
                        style={{ display: isStep(EStep.Options) ? 'flex' : 'none', width: '100%', flexDirection: 'row-reverse', justifyContent: 'left' }}
                      >
                        <span style={{ color: Utils.colorAall(1) }}>
                          Explain Predictions <HelpIcon tooltipText={'Predictions will include SHAP explanations.'} />
                        </span>
                      </Checkbox>
                    </Form.Item>
                  )}
                  {explanations_supported && (
                    <div
                      style={{ display: isStep(EStep.Options) ? 'block' : 'none' }}
                      css={`
                        font-size: 12px;
                        opacity: 0.7;
                        color: white;
                        margin: 0 10px;
                      `}
                    >
                      Please be cautious before checking this box, it may slow down you batch prediction by 100 times
                    </div>
                  )}
                  {explanations_supported && (
                    <div
                      style={{ display: isStep(EStep.Options) ? 'block' : 'none' }}
                      css={`
                        height: 15px;
                      `}
                    ></div>
                  )}

                  <div
                    style={{ display: isStep(EStep.Options) ? 'block' : 'none' }}
                    css={`
                      height: 15px;
                    `}
                  ></div>
                  {problemType !== 'FORECASTING' && (
                    <div
                      css={`
                        margin: 0 10px;
                      `}
                    >
                      <Form.Item
                        name={'resultInputColumns'}
                        rules={null}
                        style={{ display: isStep(EStep.Options) ? 'block' : 'none', marginBottom: '1px' }}
                        valuePropName="option"
                        hasFeedback
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            Restrict Input Column Results:
                            <HelpIcon id={'deploy_batch_resultInputColumns'} style={{ marginLeft: '4px' }} />
                          </span>
                        }
                      >
                        <Select options={bpColumnsFilterValues} style={{ width: '100%', color: Utils.isDark() ? 'white' : 'black' }} mode="tags" onChange={onChangeBpFilterColumns} tokenSeparators={[',']} value={resultInputColumns} />
                      </Form.Item>
                    </div>
                  )}
                  <div
                    style={{ display: isStep(EStep.Options) ? 'block' : 'none' }}
                    css={`
                      height: 15px;
                    `}
                  ></div>

                  {/*// @ts-ignore*/}
                  <Collapse
                    defaultActiveKey={/*(editBatchPredId==null) ? undefined : */ ['expl']}
                    bordered={false}
                    style={{ display: hideExpl || !form?.getFieldValue('explanations') ? 'none' : isStep(EStep.Options) ? 'block' : 'none', backgroundColor: Utils.colorA(0.08), color: 'white', marginTop: '10px', borderBottom: 'none' }}
                  >
                    {/*// @ts-ignore*/}
                    <Panel header={<span style={{ color: Utils.colorAall(1) }}>Explanation Options</span>} forceRender={true} key={'expl'} style={{ borderBottom: 'none' }}>
                      {((editBatchPredId != null && batchPredOne != null) || editBatchPredId == null) && (
                        <OptionsBuilder
                          id={'' + optionsId}
                          projectId={projectId}
                          form={form}
                          onChangeForm={onChangeForm}
                          setFieldsValue={setFieldsValue}
                          onUsedFieldNames={onUsedFieldNamesTrue}
                          optionsGetCall={optionsGetCallTrue}
                          wrapForm={false}
                        />
                      )}
                    </Panel>
                  </Collapse>

                  <Form.Item style={{ marginBottom: '1px' }}>
                    <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '0 0' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      {step !== EStep.Inputs && step != null && editBatchPredId == null && (
                        <Button onClick={onClickBack} type="primary" ghost style={{ marginTop: '16px', marginRight: '10px' }}>
                          {'Back'}
                        </Button>
                      )}
                      <Button onClick={onClickNext.bind(null, false, forceValidateFieldsNames)} type="primary" ghost={showAlsoStart} htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                        {editBatchPredId != null ? 'Save' : readCustom === 'fg' && !isForEval && false ? 'Setup Batch Prediction...' : nextButtonString ?? 'Start Batch Prediction'}
                      </Button>
                      {showAlsoStart && (
                        <Button style={{ marginTop: '16px', marginLeft: '10px' }} onClick={onClickNext.bind(null, true, null)} type="primary" htmlType="submit" className="login-form-button">
                          {'Start Batch Prediction'}
                        </Button>
                      )}
                    </div>
                  </Form.Item>
                </FormExt>
              </div>
            </div>
          </div>
        </NanoScroller>
      </RefreshAndProgress>
    </div>
  );
});

export const DeployBatchAPI_calcListDeploy = (deployments, deployId, projectId, doCall = false, includeAll = false) => {
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
      if (res && res.length > 0 && !includeAll) {
        let res2 = [];
        res.some((r1) => {
          if ([DeploymentLifecycle.ACTIVE].includes(r1.status)) {
            res2.push(r1);
          }
        });
        res = res2;
      }

      return res;
    }
  }
};

export default DeployBatchAPI;
