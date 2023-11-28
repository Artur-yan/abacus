import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Collapse from 'antd/lib/collapse';
import DatePicker from 'antd/lib/date-picker';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Select from 'antd/lib/select';
import Spin from 'antd/lib/spin';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import algorithms from '../../stores/reducers/algorithms';
import defDatasets from '../../stores/reducers/defDatasets';
import { calcDefaultModelName } from '../../stores/reducers/defaultModelName';
import deployments, { DeploymentLifecycle } from '../../stores/reducers/deployments';
import { calcModelDetailListByProjectId } from '../../stores/reducers/models';
import projects, { memProjectById } from '../../stores/reducers/projects';
import { calcAlgorithmModelConfigList, calcTrainingOptionsIsProcessing, calcTrainingOptionsList, calcTrainingOptionsListError } from '../../stores/reducers/trainingOptions';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import AutoLinkString from '../AutoLinkString/AutoLinkString';
import CpuAndMemoryOptions from '../CpuAndMemoryOptions/CpuAndMemoryOptions';
import DeploymentsList from '../DeploymentsList/DeploymentsList';
import FeatureGroupsFormItemsTraining, { formFgidPrefix } from '../FeatureGroupsFormItemsTraining/FeatureGroupsFormItemsTraining';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import InputCron from '../InputCron/InputCron';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { buildOptionInput, getAdvancedTrainingOptionsList, optionsOnValuesChange, prepareBuildOptions, booleanAutoValue, groupSep } from './helpers';
import { RootState } from '../../../core/store';
const s = require('./ModelTrain.module.css');
const sd = require('../antdUseDark.module.css');
const { Option } = Select;

const RangePicker = DatePicker.RangePicker;
const { Panel } = Collapse;

export const prefixMultiEnumC = 'c9238kjash74c38u83d';
export const prefixMultiEnumInt = 'c9!!238kja!!!sh3544f4f4f4f4f!!3d_';

const prefixCustomAlgoConfigValue = 'customAlgoConfig';

interface IModelNewOneProps {
  paramsProp?: any;
  trainingOptions?: any;
  defaultModelName?: any;
  defDatasets?: any;
  useCases?: any;
  projects?: any;
  models?: any;
  deployments?: any;
  algorithms?: any;
}

interface IModelNewOneState {
  isProcessing?: boolean;
  showTrainTip?: boolean;
  useCaseTypesList?: { isRequired?; title?; type?; data? }[];
  showIsValidationError?: boolean;
  checkedKeys?: any;
  customAlgoSel?: string[];
  customAlgoConfigString?: { [key: string]: string };
  builtinAlgoSel?: string[];
  builtinAlgoSelMode?: string;
  additionalModels: { id: string; traingingOptionsList: any[] }[];
  // isByom?: boolean,
}

class ModelTrain extends React.PureComponent<IModelNewOneProps, IModelNewOneState> {
  private isM: boolean;
  formRef = React.createRef<FormInstance>();
  initialValuesResLastForModelConfig: any;
  validateProjectAlready: any;
  cpuAndMemoryRef = React.createRef<any>();

  constructor(props) {
    super(props);

    this.state = {
      isProcessing: false,
      builtinAlgoSelMode: 'default',
      additionalModels: [],
    };
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

  calcForRetrain = () => {
    let editModelId = this.props.paramsProp?.get('editModelId');
    return !Utils.isNullOrEmpty(editModelId);
  };

  memResetProject = memoizeOne((projectId) => {
    if (!projectId) {
      return;
    }

    this.setState({
      customAlgoSel: null,
    });
    StoreActions.listAlgosByProblemTypeId_(null, projectId);
  });

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    this.memResetProject(projectId);
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let featureGroupIds = this.memFGIDs(this.formRef?.current?.getFieldsValue());
    let forRetrain = this.calcForRetrain();

    let editModelId = this.props.paramsProp?.get('editModelId');
    if (editModelId === '') {
      editModelId = null;
    }
    this.memTrainOptionsProject(true)(projectId, featureGroupIds, forRetrain, editModelId);
    this.memDefaultModelNameProject(true)(projectId);

    let resCustomModelInfo = this.memCustomModelInfo(true)(this.props.projects, projectId);

    let trainOptionsListNone = this.memTrainOptionsNone(true)(this.props.trainingOptions, projectId, null, this.calcForRetrain());
    let trainOptionsList = this.memTrainOptions(true)(this.props.trainingOptions, projectId, featureGroupIds, this.calcForRetrain());
    let modelDefaultName = this.memModelDefaultName(true)(this.props.defaultModelName, projectId);

    if (editModelId) {
      let modelDetailFound = this.memModelDetail(true)(this.props.models, editModelId);
    }

    if (!this.validateProjectAlready) {
      if (this.memValidateReset(this.props.defDatasets)) {
        this.validateProjectAlready = true;
      }
    }

    let optionsAlgos = this.memCustomAlgos(true)(this.props.algorithms, projectId);
    let trainingConfig = this.memTrainingConfig(this.formRef?.current?.getFieldsValue());
    let builtinAlgos = this.memBuiltinAlgos(true)(this.props.algorithms, projectId, featureGroupIds, trainingConfig);

    this.memValidateProject(true)(this.props.defDatasets, projectId, featureGroupIds);

    let schemaInfoFull = this.memUseCaseInfo(true)(this.props.useCases, foundProject1?.useCase);

    const listDeploymentsListAll = this.memDeployList(true)(this.props.deployments, projectId);
  };

  memValidateReset = memoizeOne((defDatasetsParam) => {
    return defDatasets.memValidateReset(undefined);
  });

  memUseCaseInfo = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memValidateProject = memoizeOneCurry((doCall, defDatasetsParam, projectId, featureGroupIds) => {
    return defDatasets.memValidationForProjectId(doCall, projectId, featureGroupIds);
  });

  memValidateErrorCalc: (validateProjectRes?, schemaInfoFull?) => { res; errorFeatureGroupId } = memoizeOne((validateProjectRes, schemaInfoFull) => {
    if (validateProjectRes && schemaInfoFull) {
      let res = null,
        errorFeatureGroupId = null;

      const realNameDatasetType = (dsType) => {
        if (!dsType) {
          return null;
        }
        let res = dsType;

        let schemas1 = schemaInfoFull?.uiCustom?.schemas;
        if (schemas1 != null) {
          schemas1.list?.some((s1) => {
            let sch1 = schemas1[s1];
            if (sch1) {
              if (sch1.dataset_type?.toUpperCase() === dsType?.toUpperCase()) {
                res = sch1.title;
                return true;
              }
            }
          });
        }

        return res;
      };

      let rr = validateProjectRes?.requiredDatasets;
      rr?.some((r1) => {
        if (!r1.uploaded) {
          if (r1.datasetType?.toUpperCase() !== Constants.custom_table && !r1.isCustom) {
            res = `Please set at least one feature group to "${realNameDatasetType(r1.datasetType)}" type before proceeding`;
            return true;
          }
        }

        if (r1?.invalidColumns != null) {
          r1?.invalidColumns?.some((ic1) => {
            let k1 = Object.keys(ic1)?.[0];
            if (!Utils.isNullOrEmpty(k1)) {
              let err1 = ic1[k1];
              if (!Utils.isNullOrEmpty(err1)) {
                let ds1 = realNameDatasetType(r1.datasetType);
                if (Utils.isNullOrEmpty(ds1)) {
                  ds1 = null;
                } else {
                  ds1 = `on "${ds1}"`;
                }
                res = `Error: ${err1} on field "${k1}" ${ds1}`;

                if (r1?.featureGroupId) {
                  errorFeatureGroupId = r1?.featureGroupId;
                }
              }
            }
          });
        }

        if (!res && r1.existsForTraining === false) {
          res = 'A required feature group has not been marked to "use for training". Missing Feature Group: "' + realNameDatasetType(r1.datasetType) + '"';
        }
      });

      if (!res) {
        validateProjectRes?.datasetErrors?.some((e1) => {
          if (Utils.isNullOrEmpty(e1.message)) {
            return;
          }

          if (res == null) {
            res = [];
          }
          if (errorFeatureGroupId == null) {
            errorFeatureGroupId = e1.featureGroupId;
          }
          res.push(e1.message);
        });
      }

      if (res == null || (_.isArray(res) && res.length !== 1)) {
        errorFeatureGroupId = null;
      }

      return { res, errorFeatureGroupId };
    }
  });

  memModelDetailLast = null;
  memModelDetail = memoizeOneCurry((doCall, models, modelId) => {
    if (models && modelId) {
      let res = calcModelDetailListByProjectId(undefined, modelId);

      if (this.memModelDetailLast == null || !_.isEqual(this.memModelDetailLast?.toJS(), res?.toJS())) {
        this.memModelDetailLast = res;
      } else {
        res = this.memModelDetailLast;
      }

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

  componentDidUpdate(prevProps: Readonly<IModelNewOneProps>, prevState: Readonly<IModelNewOneState>, snapshot?: any): void {
    this.doMem();
  }

  componentDidMount() {
    this.isM = true;

    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;
  }

  onValuesChange = (changedValues, values) => {
    optionsOnValuesChange(changedValues, values, this.formRef.current);

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let featureGroupIds = this.memFGIDs(values);
    let trainingConfig = this.memTrainingConfig(values);
    this.memBuiltinAlgos(true)(this.props.algorithms, projectId, featureGroupIds, trainingConfig);

    this.forceUpdate();
  };

  handleSubmit = (values) => {
    let trainingOptionsIsProcessing = calcTrainingOptionsIsProcessing(undefined);

    if (!trainingOptionsIsProcessing) {
      this.handleSubmitDoWork(values);
    }
  };

  handleSubmitDoWork = (values) => {
    const editModelId = this.props.paramsProp?.get('editModelId');
    const isEdit = !Utils.isNullOrEmpty(editModelId);
    const algorithmTrainingConfigs = [];

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');

    let kk0 = Object.keys(values ?? []);
    kk0
      .filter((k1) => _.startsWith(k1, prefixCustomAlgoConfigValue))
      .some((k1) => {
        delete values[k1];
      });

    let cpuSize = values?.cpuSize?.value;
    let memory = values?.memory;
    if (memory?.value != null) {
      memory = memory?.value;
    }

    if (values) {
      values = { ...values };
      delete values.cpuSize;
      delete values.memory;

      Object.keys(values).map((key, ind2) => {
        if (moment.isMoment(values[key])) {
          values[key] = values[key].utcOffset(0, true).format().replace('Z', '');
        }

        if (values[key] != null && typeof values[key] == 'object' && !_.isArray(values[key]) && !key.includes('algorithmTrainingConfigs')) {
          values[key] = values[key].value;
          if (values[key] == 'AUTO') {
            delete values[key];
          }
        } else if (key.includes('algorithmTrainingConfigs')) {
          if (algorithmTrainingConfigs) {
            const obj = { ALGORITHM: 'llm' };
            Object.keys(values[key]).map((childKey) => {
              if (childKey === 'DOCUMENT_RETRIEVERS' && _.isArray(values[key][childKey])) {
                obj[childKey] = values[key][childKey].map((documentRetriever) => documentRetriever.value);
              } else if (typeof values[key][childKey] == 'object') {
                obj[childKey] = values[key][childKey]?.value;
              } else {
                obj[childKey] = values[key][childKey];
              }
            });
            algorithmTrainingConfigs.push(obj);
          }
          delete values[key];
        }

        if (key === 'DOCUMENT_RETRIEVERS' && _.isArray(values[key])) {
          values[key] = values[key].map((documentRetriever) => documentRetriever.value);
        }

        if (values[key] == booleanAutoValue) {
          delete values[key];
        }
      });

      //
      let groupsToCheck = [];
      let vv = values;
      let kk = Object.keys(vv);
      kk.some((k1) => {
        const k1ori = k1;

        let groupName = null;
        if (k1.indexOf(groupSep) > -1) {
          let gg = k1.split(groupSep);
          if (gg.length < 2) {
            return false;
          }

          groupName = gg[0];
          k1 = gg[1];

          if (!groupsToCheck.includes(groupName)) {
            groupsToCheck.push(groupName);
          }
        }

        if (_.endsWith(k1, '_CUSTOMENUM')) {
          let k2 = k1.substring(0, k1.length - '_CUSTOMENUM'.length);
          let value1 = vv[k1ori];
          if (value1 != null && _.isArray(value1)) {
            let value2 = [];
            value1.some((v1) => {
              if (v1 != null) {
                if (_.isString(v1) && _.startsWith(v1, prefixMultiEnumC)) {
                  v1 = v1.substring(prefixMultiEnumC.length);
                  v1 = Utils.tryParseFloat(v1);
                }

                if (v1 != null) {
                  if (value2.includes(v1)) {
                    return;
                  }
                  value2.push(v1);
                }
              }
            });
            value1 = value2;
          }
          if (groupName == null) {
            vv[k2] = value1;
          } else {
            vv[groupName] = vv[groupName] || {};
            vv[groupName][k2] = value1;
          }
          delete vv[k1ori];
        } else {
          if (groupName != null) {
            vv[groupName] = vv[groupName] || {};
            vv[groupName][k1] = vv[k1ori];
            delete vv[k1ori];
          }
        }
      });

      groupsToCheck?.some((gn1) => {
        let r1 = values?.[gn1];
        if (r1 != null && _.isObject(r1)) {
          const kk = Object.keys(r1);
          kk.some((k1) => {
            if (Utils.isNullOrEmpty(r1[k1])) {
              delete r1[k1];
            }
          });
          if (_.isEmpty(r1)) {
            values[gn1] = null;
          }
        }
      });
    }

    let customAlgos = {};
    let aa = this.state.customAlgoSel;
    if (aa != null && aa?.length > 0) {
      customAlgos ??= {};
      aa.some((s1) => {
        let json1 = this.state.customAlgoConfigString?.[s1];
        if (json1 === '') {
          json1 = null;
        }
        customAlgos[s1] = json1;
      });
    }

    let builtinAlgos = null;
    let builtinAlgoSelMode = this.state.builtinAlgoSelMode;
    if (builtinAlgoSelMode == 'empty') {
      builtinAlgos = [];
    } else if (builtinAlgoSelMode == 'partial') {
      if (this.state.builtinAlgoSel == null || this.state.builtinAlgoSel?.length == 0) {
        REActions.addNotification('No builtin algorithms selected.');
        return;
      }
      builtinAlgos = this.state.builtinAlgoSel;
    }

    if (builtinAlgos != null && builtinAlgos.length + (customAlgos ? Object.keys(customAlgos).length : 0) == 0) {
      REActions.addNotification('Can not skip both builtin and custom algorithms.');
      return;
    }

    //
    if (isEdit) {
      let featureGroupIds = null;
      let kkv = Object.keys(values ?? {});
      kkv?.some((k1) => {
        if (_.startsWith(k1, formFgidPrefix)) {
          if (!Utils.isNullOrEmpty(values[k1])) {
            featureGroupIds = featureGroupIds ?? [];
            featureGroupIds.push(values[k1]);
          }

          delete values[k1];
        }
      });

      this.setState({
        isProcessing: true,
      });
      REClient_.client_().updateModelTrainingConfig(editModelId, values, featureGroupIds, (err, res) => {
        this.setState({
          isProcessing: false,
        });

        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (projectId) {
            StoreActions.listModels_(projectId);
          }
          if (editModelId) {
            StoreActions.getModelDetail_(editModelId);
            StoreActions.modelsVersionsByModelId_(editModelId);
          }

          //
          if (this.props.paramsProp?.get('onlyEdit') === '1') {
            Location.push('/' + PartsLink.model_detail + '/' + editModelId + '/' + projectId);
          } else {
            REClient_.client_().retrainModel(editModelId, this.state.checkedKeys, featureGroupIds, cpuSize, memory, customAlgos, builtinAlgos, algorithmTrainingConfigs ?? [], (err, res) => {
              if (err || !res?.success) {
                REActions.addNotificationError(err || Constants.errorDefault);
              } else {
                StoreActions.getModelDetail_(editModelId);
                StoreActions.modelsVersionsByModelId_(editModelId);
                StoreActions.refreshDoModelAll_(editModelId, projectId);

                let modelId = editModelId;
                let listModelIds = modelId ? [modelId] : [];
                let mm = listModelIds ? listModelIds.join('-') : undefined;
                if (mm) {
                  mm = 'modalModelsRefresh=' + mm;
                }

                Location.push('/' + PartsLink.model_list + '/' + projectId, undefined, mm);

                // Location.push('/'+PartsLink.model_detail+'/'+editModelId+'/'+projectId);
              }
            });
          }
        }
      });
      return;
    }

    let name = values.nameInternal;
    delete values['nameInternal'];
    let refreshSchedule = values.refreshSchedule;
    delete values['refreshSchedule'];

    delete values['cpuSize'];
    delete values['memory'];

    let featureGroupIds = null;
    let kkv = Object.keys(values ?? {});
    kkv?.some((k1) => {
      if (_.startsWith(k1, formFgidPrefix)) {
        if (!Utils.isNullOrEmpty(values[k1])) {
          featureGroupIds = featureGroupIds ?? [];
          featureGroupIds.push(values[k1]);
        }

        delete values[k1];
      }
    });

    if (projectId) {
      this.setState({
        isProcessing: true,
        showIsValidationError: null,
      });

      REClient_.client_().trainModelsAuto(projectId, values, name, refreshSchedule, featureGroupIds, cpuSize, memory, customAlgos, builtinAlgos, algorithmTrainingConfigs ?? [], (err1, res) => {
        this.setState({
          isProcessing: false,
        });

        if (err1) {
          REActions.addNotificationError(err1);
          this.setState({
            showIsValidationError: res?.projectConfigurationError === true,
          });
        } else {
          if (res && res.success) {
            let doWorkAfter = (resL) => {
              if (resL && resL.result) {
                let modelId = resL.result?.modelId;
                let listModelIds = modelId ? [modelId] : [];

                if (listModelIds && listModelIds.length > 0) {
                  setTimeout(() => {
                    StoreActions.listModels_(projectId);

                    let processModelId = (trainModelId) => {
                      if (trainModelId) {
                        if (!Utils.isNullOrEmpty(trainModelId)) {
                          StoreActions.modelsVersionsByModelId_(trainModelId);
                          StoreActions.refreshDoModelAll_(trainModelId, projectId);
                        }
                      }
                    };

                    (listModelIds || []).some((mId1) => {
                      processModelId(mId1);
                    });
                  }, 100);
                }

                let mm = listModelIds ? listModelIds.join('-') : undefined;
                if (mm) {
                  mm = 'modalModelsRefresh=' + mm;
                }

                Location.push('/' + PartsLink.model_list + '/' + projectId, undefined, mm);
              }
            };

            setTimeout(() => {
              doWorkAfter(res);
            }, 50);
          }
        }
      });
    }
  };

  memOptions = memoizeOne((listOption) => {
    if (listOption) {
      let normalTrainingOptionsList = listOption.filter((o1) => !o1.advanced);
      let advancedTrainingOptionsList = listOption.filter((o1) => o1.advanced);

      // let isByom = [].concat(normalTrainingOptionsList ?? []).concat(advancedTrainingOptionsList ?? []).find(o1 => o1?.name?.toLowerCase()==='algorithms')!=null;
      // if(this.state.isByom!==isByom) {
      //   setTimeout(() => {
      //     this.setState({
      //       isByom,
      //     });
      //   }, 0);
      // }

      return {
        normalTrainingOptionsList: normalTrainingOptionsList,
        advancedTrainingOptionsList: advancedTrainingOptionsList,
      };
    }
  });

  memOptionsCopy = memoizeOne((normalTrainingOptionsList, advancedTrainingOptionsList) => {
    if (normalTrainingOptionsList == null && advancedTrainingOptionsList == null) {
      return null;
    } else {
      return [...(normalTrainingOptionsList ?? []), ...(advancedTrainingOptionsList ?? [])];
    }
  });

  memTrainOptionsProject = memoizeOneCurry((doCall, projectId, featureGroupIds, forRetrain, editModelId) => {
    if (projectId) {
      if (doCall) {
        let isEdit = !Utils.isNullOrEmpty(editModelId);
        if (isEdit) {
          REClient_.client_().describeModel(editModelId, (err, res) => {
            StoreActions.listTrainingOptions_(projectId, featureGroupIds, forRetrain, res?.result?.modelConfig ?? {}, res?.result?.algorithmModelConfigs ?? []);
          });
        } else {
          StoreActions.listTrainingOptions_(projectId, featureGroupIds, forRetrain, {});
        }
      }
    }
  });

  memDefaultModelNameProject = memoizeOneCurry((doCall, projectId) => {
    if (projectId) {
      if (doCall) {
        StoreActions.getDefaultModelName_(projectId);
      }
    }
  });

  memTrainOptionsLast = null;
  memTrainOptions = memoizeOneCurry((doCall, trainingOptionsParam, projectId, featureGroupIds, forRetrain) => {
    if (trainingOptionsParam && projectId) {
      let res = calcTrainingOptionsList(undefined, projectId, featureGroupIds, forRetrain);

      if (this.memTrainOptionsLast == null || !_.isEqual(this.memTrainOptionsLast, res)) {
        this.memTrainOptionsLast = res;
      } else {
        res = this.memTrainOptionsLast;
      }

      if (res != null) {
        const clonedTrainingOptionsList = _.cloneDeep(res);
        const trainingOptionsListWithoutDocumentRetrievers = clonedTrainingOptionsList?.filter((option) => option?.name !== 'DOCUMENT_RETRIEVERS');
        const tempAdvancedOptionsListWithDocumentRetrievers = clonedTrainingOptionsList?.find((option) => option?.name === 'DOCUMENT_RETRIEVERS');
        return { trainOptionsList: res, trainingOptionsListWithoutDocumentRetrievers, tempAdvancedOptionsListWithDocumentRetrievers };
      } else {
        if (!trainingOptionsParam.get('isRefreshing')) {
          if (doCall) {
            StoreActions.listTrainingOptions_(projectId, featureGroupIds, forRetrain, {});
          }
        }
      }
    }

    return { trainOptionsList: null, trainingOptionsListOnlyDocumentRetrievers: null, tempAdvancedOptionsListWithDocumentRetrievers: null };
  });

  memTrainOptionsNone = memoizeOneCurry((doCall, trainingOptionsParam, projectId, featureGroupIds, forRetrain) => {
    if (trainingOptionsParam && projectId) {
      let res = calcTrainingOptionsList(undefined, projectId, featureGroupIds, forRetrain);
      if (res != null) {
        return res;
      } else {
        if (trainingOptionsParam.get('isRefreshing')) {
          return null;
        } else {
          if (doCall) {
            StoreActions.listTrainingOptions_(projectId, featureGroupIds, forRetrain, {});
          }
        }
      }
    }
  });

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

  formForceRefresh = () => {
    this.forceUpdate();
  };

  onChangeForm = () => {
    setTimeout(() => {
      let v1 = this.formRef.current?.getFieldValue('TEST_SPLIT');
      if (v1 != null && v1 !== '') {
        if (_.isString(v1)) {
          v1 = Utils.tryParseFloat(v1);
        }
        if (_.isNumber(v1)) {
          let res1 = v1 >= 20;
          if (this.state.showTrainTip !== res1) {
            this.setState({
              showTrainTip: res1,
            });
          }
        }
      }
    }, 0);
  };

  goToDashboard = (errorFromValidateFGid, e) => {
    let projectId = this.props.paramsProp?.get('projectId');

    if (!Utils.isNullOrEmpty(errorFromValidateFGid)) {
      Location.push('/' + PartsLink.features_list + '/' + projectId + '/' + errorFromValidateFGid);
    } else {
      Location.push('/' + PartsLink.project_dashboard + '/' + projectId);
    }
  };

  onChangeCronValue = (v1) => {
    this.formRef.current?.setFieldsValue({ refreshSchedule: v1 });
  };

  calcTip1 = (name1) => {
    if ((name1 || '').toUpperCase() === 'TEST_SPLIT' && this.state.showTrainTip) {
      return (
        <div key={'tip_1'} style={{}} className={sd.styleTextGray}>
          We don't recommend allocating more than 20% of your data for testing
        </div>
      );
    }
  };

  initialValuesResLast = null;
  trainOptionsList = null;
  memInitValuesForm = memoizeOne((initialValuesRes, formRef, currentlySelectedAdvancedOptionsListWithDocumentRetrievers, algorithmModelConfigs, trainOptionsList, problemType, isEdit) => {
    if (!this.formRef?.current) {
      return;
    }

    const isDocumentRetrieverUpdated =
      isEdit &&
      problemType === 'CHAT_LLM' &&
      (!_.isEqual(currentlySelectedAdvancedOptionsListWithDocumentRetrievers, this.initialValuesResLast?.DOCUMENT_RETRIEVERS) ||
        !_.isEqual(algorithmModelConfigs?.[0]?.LLM_NAME, this.initialValuesResLast?.algorithmTrainingConfigs_1?.LLM_NAME?.value) ||
        !_.isEqual(trainOptionsList, this.trainOptionsList));

    if (this.initialValuesResLast == null || !_.isEqual(this.initialValuesResLast, initialValuesRes) || isDocumentRetrieverUpdated) {
      if (isDocumentRetrieverUpdated && initialValuesRes) {
        this.trainOptionsList = trainOptionsList;
        initialValuesRes.DOCUMENT_RETRIEVERS = currentlySelectedAdvancedOptionsListWithDocumentRetrievers;
        algorithmModelConfigs?.map((algoModelConfig, index) => {
          const mainKey = `algorithmTrainingConfigs_${index + 1}`;
          initialValuesRes[mainKey] = {};
          Object.keys(algoModelConfig).map((key, index) => {
            if (key === 'DOCUMENT_RETRIEVERS' && _.isArray(algoModelConfig[key])) {
              initialValuesRes[mainKey][key] = algoModelConfig[key].map((documentRetriever) => {
                return {
                  name: documentRetriever,
                  label: documentRetriever,
                  value: documentRetriever,
                };
              });
            } else if (trainOptionsList?.[index]?.dataType === 'ENUM') {
              const value = algoModelConfig[key];
              initialValuesRes[mainKey][key] = {
                value,
                label: value,
                name: value,
              };
            } else {
              initialValuesRes[mainKey][key] = algoModelConfig[key];
            }
          });
        });
      }
      this.initialValuesResLast = initialValuesRes;
      setTimeout(() => {
        this.formRef?.current?.setFieldsValue(initialValuesRes);
      }, 0);
    }
  });

  memModelConfig = memoizeOne((modelDetailFound, initialValuesRes, formRef, options, isFirstTime) => {
    if (!modelDetailFound || !formRef || !this.formRef?.current) {
      return;
    }
    options = prepareBuildOptions(options);

    let res = modelDetailFound?.get('modelConfig')?.toJS();
    if (res != null && options != null && options.length > 0) {
      setTimeout(() => {
        let values = this.formRef.current?.getFieldsValue();
        if (values == null || _.isEmpty(values)) {
          return;
        }
        values = { ...values };
        let removeKeys = {};
        Object.keys(values).some((k1) => {
          let resValue = res[k1];
          let o1: any = options?.find((o1: any) => o1.name === k1 || o1.name + '_CUSTOMENUM' === k1 || (!Utils.isNullOrEmpty(o1.groupName) && _.startsWith(k1, o1.groupName + groupSep + o1.name)));

          if (o1 != null && !Utils.isNullOrEmpty(o1.groupName)) {
            resValue = res[o1.groupName]?.[o1.name];
            removeKeys[o1.groupName] = true;
          }
          if (o1?.dataType === 'MULTI_ENUM') {
            resValue = res[o1.name];
            removeKeys[o1.name] = true;
          }

          if (o1?.dataType?.toUpperCase() === 'DATETIME') {
            if (!Utils.isNullOrEmpty(resValue)) {
              resValue = moment(resValue);
              res[k1] = resValue;
            } else {
              resValue = null;
              res[k1] = resValue;
            }
          }

          if (resValue != null) {
            if (o1) {
              if (!Utils.isNullOrEmpty(o1.groupName) || o1?.dataType === 'MULTI_ENUM') {
                res[k1] = resValue;
              }
              if (o1.dataType?.toUpperCase() === 'ENUM') {
                let autoVal = {
                  value: 'AUTO',
                  label: 'Automatic',
                  name: 'Automatic',
                };

                if (res[k1] === autoVal.value) {
                  res[k1] = autoVal;
                } else {
                  let ind = o1.options.values?.findIndex((v1) => v1 === res[k1]);
                  if (ind > -1) {
                    res[k1] = {
                      value: o1.options?.values?.[ind],
                      label: o1.options?.names?.[ind] ?? o1.options?.values?.[ind],
                      name: o1.options?.values?.[ind],
                    };
                  }
                }
              }
            }
          }
        });
        Object.keys(removeKeys).some((k1) => {
          delete res[k1];
        });
        Object.keys(res).some((k1) => {
          let o1: any = options?.find((o1: any) => o1.name === k1 || o1.name + '_CUSTOMENUM' === k1 || (!Utils.isNullOrEmpty(o1.groupName) && _.startsWith(k1, o1.groupName + groupSep + o1.name)));
          if (o1 === undefined) {
            // Delete values not in option
            delete res[k1];
          }
        });

        res = { ...initialValuesRes, ...res };
        let kkr = Object.keys(res ?? {});
        kkr.some((k1) => {
          let o1: any = options?.find((o1: any) => o1.name === k1 || o1.name + '_CUSTOMENUM' === k1 || (!Utils.isNullOrEmpty(o1.groupName) && _.startsWith(k1, o1.groupName + groupSep + o1.name)));
          if (o1?.dataType?.toUpperCase() === 'LIST') {
            let vv = res[k1];
            if (vv != null && _.isArray(vv)) {
              res[k1] = vv.filter((v1) => !Utils.isNullOrEmpty(v1));
            }
          } else if ((_.isDate(res[k1]) || o1?.dataType?.toUpperCase() === 'DATETIME') && !Utils.isNullOrEmpty(res[k1])) {
            if (moment.isMoment(res[k1])) {
              //
            } else {
              res[k1] = moment(res[k1]);
            }
          }
        });

        if (isFirstTime) {
          this.formRef?.current?.setFieldsValue(res);
        } else {
          this.formRef?.current?.setFieldsValue(initialValuesRes);
        }
        setTimeout(() => {
          optionsOnValuesChange(res, values, this.formRef?.current);
        }, 0);
      }, 0);
    }
    return res;
  });

  onUseCaseTypesList = (list) => {
    this.setState({
      useCaseTypesList: list,
    });
  };

  onChangeValuesFromFGs = () => {
    this.setState({
      showIsValidationError: null,
    });
    this.forceUpdate();
  };

  onSetFieldsValuesFromFGs = (values) => {
    if (values != null && !_.isEmpty(values)) {
      this.formRef?.current?.setFieldsValue(values);
    }
  };

  memDeployList = memoizeOneCurry((doCall, deploymentsParam, projectId) => {
    return deployments.memDeploysList(doCall, projectId);
  });

  memDeploysInspect = memoizeOne((listDeploymentsListAll) => {
    let manyDeploys = false,
      manyDeploysModelId = [];
    if (listDeploymentsListAll != null) {
      let deployCount = 0;
      listDeploymentsListAll.some((d1) => {
        if ([DeploymentLifecycle.ACTIVE, DeploymentLifecycle.STOPPED].includes(d1.status)) {
          deployCount++;
          manyDeploysModelId.push(d1.modelId);
        }
      });
      if (deployCount > 1) {
        manyDeploys = true;
      }
    }
    return { manyDeploys, manyDeploysModelId };
  });

  memManyDeploys = memoizeOne((manyDeploys, manyDeploysModelId, editModelId) => {
    if (editModelId == null) {
      return false;
    }
    return manyDeploys && manyDeploysModelId?.filter((i1) => i1 === editModelId)?.length > 1;
  });

  onChangeChecked = (keys) => {
    this.setState({
      checkedKeys: keys,
    });
  };

  memTrainingConfigLast = null;
  memTrainingConfig = memoizeOne((values) => {
    if (values == null) {
      return;
    }
    let trainingConfig = JSON.parse(JSON.stringify(values));

    let kk0 = Object.keys(trainingConfig ?? []);
    kk0
      .filter((k1) => _.startsWith(k1, prefixCustomAlgoConfigValue))
      .some((k1) => {
        delete trainingConfig[k1];
      });

    if (trainingConfig) {
      trainingConfig = { ...trainingConfig };

      Object.keys(trainingConfig).map((key, ind2) => {
        if (moment.isMoment(trainingConfig[key])) {
          trainingConfig[key] = trainingConfig[key].utcOffset(0, true).format().replace('Z', '');
        }

        if (trainingConfig[key] != null && typeof trainingConfig[key] == 'object' && !_.isArray(trainingConfig[key])) {
          trainingConfig[key] = trainingConfig[key].value;
          if (trainingConfig[key] == 'AUTO') {
            delete trainingConfig[key];
          }
        }

        if (trainingConfig[key] == booleanAutoValue) {
          delete trainingConfig[key];
        }
      });

      //
      let groupsToCheck = [];
      let vv = trainingConfig;
      let kk = Object.keys(vv);
      kk.some((k1) => {
        const k1ori = k1;

        let groupName = null;
        if (k1.indexOf(groupSep) > -1) {
          let gg = k1.split(groupSep);
          if (gg.length < 2) {
            return false;
          }

          groupName = gg[0];
          k1 = gg[1];

          if (!groupsToCheck.includes(groupName)) {
            groupsToCheck.push(groupName);
          }
        }

        if (_.endsWith(k1, '_CUSTOMENUM')) {
          let k2 = k1.substring(0, k1.length - '_CUSTOMENUM'.length);
          let value1 = vv[k1ori];
          if (value1 != null && _.isArray(value1)) {
            let value2 = [];
            value1.some((v1) => {
              if (v1 != null) {
                if (_.isString(v1) && _.startsWith(v1, prefixMultiEnumC)) {
                  v1 = v1.substring(prefixMultiEnumC.length);
                  v1 = Utils.tryParseFloat(v1);
                }

                if (v1 != null) {
                  if (value2.includes(v1)) {
                    return;
                  }
                  value2.push(v1);
                }
              }
            });
            value1 = value2;
          }
          if (groupName == null) {
            vv[k2] = value1;
          } else {
            vv[groupName] = vv[groupName] || {};
            vv[groupName][k2] = value1;
          }
          delete vv[k1ori];
        } else {
          if (groupName != null) {
            vv[groupName] = vv[groupName] || {};
            vv[groupName][k1] = vv[k1ori];
            delete vv[k1ori];
          }
        }
      });

      groupsToCheck?.some((gn1) => {
        let r1 = trainingConfig?.[gn1];
        if (r1 != null && _.isObject(r1)) {
          const kk = Object.keys(r1);
          kk.some((k1) => {
            if (Utils.isNullOrEmpty(r1[k1])) {
              delete r1[k1];
            }
          });
          if (_.isEmpty(r1)) {
            trainingConfig[gn1] = null;
          }
        }
      });
    }

    delete trainingConfig['nameInternal'];
    delete trainingConfig['refreshSchedule'];
    delete trainingConfig['cpuSize'];
    delete trainingConfig['memory'];

    let kkv = Object.keys(trainingConfig ?? {});
    kkv?.some((k1) => {
      if (_.startsWith(k1, formFgidPrefix)) {
        delete trainingConfig[k1];
      }
    });

    if (this.memTrainOptionsLast == null || !_.isEqual(this.memTrainOptionsLast, trainingConfig)) {
      this.memTrainOptionsLast = trainingConfig;
      return trainingConfig;
    } else {
      return this.memTrainOptionsLast;
    }
  });

  memFGIDsLast = null;
  memFGIDs = memoizeOne((values) => {
    let featureGroupIds = null;
    let kkv = Object.keys(values ?? {});
    kkv?.some((k1) => {
      if (_.startsWith(k1, formFgidPrefix)) {
        if (!Utils.isNullOrEmpty(values[k1]?.value)) {
          featureGroupIds = featureGroupIds ?? [];
          featureGroupIds.push(values[k1]?.value);
        }
        //
        // delete values[k1];
      }
    });

    if (this.memFGIDsLast == null || !_.isEqual(this.memFGIDsLast, featureGroupIds)) {
      this.memFGIDsLast = featureGroupIds;
      return featureGroupIds;
    } else {
      return this.memFGIDsLast;
    }
  });

  memCustomModelInfo = memoizeOneCurry((doCall, projectsParam, projectId) => {
    return projects.memCustomModelInfo(doCall, undefined, null, projectId);
  });

  memCustomAlgos = memoizeOneCurry((doCall, algorithmsParam, projectId) => {
    let res = algorithms.memListByProblemTypeId(doCall, undefined, projectId);
    if (res != null) {
      res = _.sortBy(res, 'name');
    }
    return res;
  });

  memBuiltinAlgos = memoizeOneCurry((doCall, builtinAlgosParam, projectId, featureGroupIds, trainingConfig) => {
    let res = algorithms.memListBuiltinAlgorithms(doCall, projectId, featureGroupIds, trainingConfig);
    if (res != null) {
      res = _.sortBy(res, 'name');
    }
    return res;
  });

  memAlgoOptions = memoizeOne((algosList, projectId, modelDetailFound) => {
    let editModelId = this.props.paramsProp?.get('editModelId');
    if (editModelId) {
      if (modelDetailFound == null || algosList == null) {
        return null;
      }
    }

    let customAlgorithmConfigs = modelDetailFound?.get('customAlgorithmConfigs')?.toJS();
    let editUsedAlgosObjects = modelDetailFound?.get('restrictedAlgorithms')?.toJS()['customAlgorithms'];
    let editUsedAlgosNames = editUsedAlgosObjects?.map((a1) => a1.name);
    if (editUsedAlgosNames == null && customAlgorithmConfigs != null && !_.isEmpty(customAlgorithmConfigs)) {
      let kk = Object.keys(customAlgorithmConfigs ?? {});
      editUsedAlgosNames = kk;
    }

    if (this.state.customAlgoSel == null && algosList != null) {
      let ss = algosList
        ?.filter((a1) => a1?.isDefaultEnabled === true || editUsedAlgosNames != null)
        ?.map((a1) => a1.name)
        ?.filter((s1) => editUsedAlgosNames == null || editUsedAlgosNames?.includes(s1));
      this.setState({
        customAlgoSel: ss ?? [],
      });

      if (editUsedAlgosNames != null && editUsedAlgosNames?.length > 0) {
        let cc = null,
          vv = null;

        let cpuSize1 = modelDetailFound?.get('cpuSize');
        let memory1 = modelDetailFound?.get('memory');
        if (cpuSize1 != null && memory1 != null) {
          setTimeout(() => {
            this.cpuAndMemoryRef?.current?.setCpuValue(cpuSize1);
            this.cpuAndMemoryRef?.current?.setMemoryValue(memory1);
          }, 0);
        }

        editUsedAlgosNames?.some((k1) => {
          let c1 = customAlgorithmConfigs?.[k1];
          if (c1 != null && !_.isString(c1)) {
            c1 = JSON.stringify(c1);
          }
          if (c1 != null) {
            cc ??= {};
            cc[k1] = c1;

            vv ??= {};
            vv[prefixCustomAlgoConfigValue + k1] = c1;
          }
        });

        if (vv != null && !_.isEmpty(vv)) {
          this.formRef?.current?.setFieldsValue(vv);
        }

        this.setState({
          customAlgoConfigString: cc,
        });
      }
    }

    return algosList?.map((a1) => ({ label: a1.name, value: a1.name }));
  });

  memBuiltinAlgoOptions = memoizeOne((builtinAlgosList, modelDetailFound) => {
    let usedBuiltinAlgoObjects = modelDetailFound?.get('restrictedAlgorithms')?.toJS()['builtinAlgorithms'];
    let usedBuiltinAlgos = usedBuiltinAlgoObjects?.map((a1) => a1.algorithm);
    if (this.state.builtinAlgoSel == null && builtinAlgosList != null) {
      let ss = builtinAlgosList?.map((a1) => a1.algorithm).filter((s1) => usedBuiltinAlgos?.includes(s1));
      this.setState({
        builtinAlgoSel: ss ?? [],
      });
    }

    let res = builtinAlgosList?.map((a1) => ({ label: a1.name, value: a1.algorithmId, sortValue: Utils.replaceNumbersForSort(a1.name) }));
    if (res != null) {
      res = _.sortBy(res, 'sortValue');
    }
    return res;
  });

  onChangeAlgoConfigSel = (algoName, e) => {
    let cc = { ...(this.state.customAlgoConfigString ?? {}) };
    cc[algoName] = e.target.value;
    this.setState({
      customAlgoConfigString: cc,
    });
  };

  onChangeAlgoSel = (v1, isEdit, e) => {
    let vv = [...(this.state.customAlgoSel ?? [])];

    if (e.target.checked) {
      if (!vv.includes(v1)) {
        vv.push(v1);
      }
    } else {
      vv = vv.filter((v0) => v0 !== v1);
    }

    this.setState({
      customAlgoSel: vv,
    });
  };

  onChangeCustomAlgos = (vv) => {
    this.setState({
      customAlgoSel: vv ?? [],
    });
  };

  onChangeBuiltinAlgoSel = (v1, isEdit, e) => {
    let vv = [...(this.state.builtinAlgoSel ?? [])];

    if (e.target.checked) {
      if (!vv.includes(v1)) {
        vv.push(v1);
      }
    } else {
      vv = vv.filter((v0) => v0 !== v1);
    }

    this.setState({
      builtinAlgoSel: vv,
    });
  };

  onNeedsRefreshInputChange = (e, name?) => {
    let projectId = this.props.paramsProp?.get('projectId');

    if (this.formRef?.current == null || !projectId) {
      return;
    }

    const processFormKey = (k) => {
      return _.endsWith(k, '_CUSTOMENUM') ? k.substring(0, k.length - '_CUSTOMENUM'.length) : k;
    };

    let formValues = this.formRef?.current?.getFieldsValue();
    let currentTrainingConfig = Object.fromEntries(
      // Get value for each train option
      Object.entries(formValues)
        .map(([k, v]) => [processFormKey(k), v && v.hasOwnProperty('value') ? v['value'] : v])
        .filter(([k, v]) => v != 'AUTO' && v != 'Automatic' && v != booleanAutoValue && v != null && !k.startsWith(formFgidPrefix)),
    );

    let featureGroupIds = this.memFGIDs(this.formRef?.current?.getFieldsValue());
    currentTrainingConfig['_LATEST_CHANGE'] = name;

    StoreActions.listTrainingOptions_(projectId, featureGroupIds, this.calcForRetrain(), currentTrainingConfig, [], true);

    this.formForceRefresh?.();
  };

  render() {
    let { paramsProp } = this.props;
    const algorithmModelConfigs = calcAlgorithmModelConfigList();
    let projectId = paramsProp && paramsProp.get('projectId');
    let editModelId = this.props.paramsProp?.get('editModelId');
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let schemaInfoFull = this.memUseCaseInfo(false)(this.props.useCases, foundProject1?.useCase);
    const problemType = schemaInfoFull?.ori?.problemType;

    let featureGroupIds = this.memFGIDs(this.formRef?.current?.getFieldsValue());

    let trainOptionsListNone = this.memTrainOptionsNone(false)(this.props.trainingOptions, projectId, null, this.calcForRetrain());
    let { trainOptionsList, trainingOptionsListWithoutDocumentRetrievers, tempAdvancedOptionsListWithDocumentRetrievers } = this.memTrainOptions(false)(this.props.trainingOptions, projectId, featureGroupIds, this.calcForRetrain());
    if (trainOptionsList == null || (trainOptionsList != null && _.isArray(trainOptionsList) && trainOptionsList.length === 0) || _.isEqual(trainOptionsList, trainOptionsListNone)) {
      trainOptionsList = trainOptionsListNone;
    }

    let modelDefaultName = this.memModelDefaultName(false)(this.props.defaultModelName, projectId);
    let { normalTrainingOptionsList, advancedTrainingOptionsList } = this.memOptions(trainingOptionsListWithoutDocumentRetrievers) ?? {};
    const clonedAdvancedTrainingOptionsList = _.cloneDeep(advancedTrainingOptionsList);
    let advancedOptionsListWithDocumentRetrievers = null;
    let currentlySelectedAdvancedOptionsListWithDocumentRetrievers = null;
    let defaultDocumentRetriever = null;
    if (problemType === 'CHAT_LLM') {
      advancedOptionsListWithDocumentRetrievers = tempAdvancedOptionsListWithDocumentRetrievers?.options?.values?.map((value) => {
        return {
          name: value,
          value,
          label: value,
        };
      });
      if (!tempAdvancedOptionsListWithDocumentRetrievers?.current?.length) {
        defaultDocumentRetriever = tempAdvancedOptionsListWithDocumentRetrievers?.default;
      }

      const tempDocumentRetrievers = advancedOptionsListWithDocumentRetrievers?.filter((documentRetrieverOption) => tempAdvancedOptionsListWithDocumentRetrievers?.current?.includes(documentRetrieverOption.value));

      currentlySelectedAdvancedOptionsListWithDocumentRetrievers = tempDocumentRetrievers?.length > 0 ? tempDocumentRetrievers : null;
    }

    if (algorithmModelConfigs?.length > 0 && this.state.additionalModels.length === 0 && problemType === 'CHAT_LLM' && !Utils.isNullOrEmpty(editModelId)) {
      REClient_.client_().getTrainingConfigOptions(projectId, featureGroupIds, this.calcForRetrain(), {}, true, (err, res) => {
        if (!err && res?.success) {
          this.setState({
            additionalModels: algorithmModelConfigs.map((_algoModelConfig, index) => {
              return { id: index + 1, traingingOptionsList: res.result };
            }),
          });
        }
      });
      this.setState({
        additionalModels: algorithmModelConfigs.map((algoModelConfig, index) => {
          return { id: index + 1, traingingOptionsList: algoModelConfig };
        }),
      });
    }

    let optionsCopy = this.memOptionsCopy(normalTrainingOptionsList, advancedTrainingOptionsList) ?? [];
    let isOnlyEdit = this.props.paramsProp?.get('onlyEdit') === '1';

    let initialValuesRes = null,
      listAdvIn = [],
      listAdvInName = null;
    if (normalTrainingOptionsList) {
      initialValuesRes = initialValuesRes ?? {};
      let normalTrainingOptionsList_1 = prepareBuildOptions(normalTrainingOptionsList);
      normalTrainingOptionsList = [];
      let lastNewGroupGlobal = true;
      for (let i = 0; i < normalTrainingOptionsList_1.length; i++) {
        const o1 = normalTrainingOptionsList_1[i];
        const o0 = normalTrainingOptionsList_1[i - 1];

        let newGroupGlobal = false;
        if (o0 != null && o0?.groupGlobal !== o1?.groupGlobal) {
          newGroupGlobal = true;
        }
        if (o0 == null) {
          if (o1?.groupGlobal) {
            lastNewGroupGlobal = false;
          }
          newGroupGlobal = true;
        }

        if (newGroupGlobal) {
          if (listAdvIn.length > 0) {
            normalTrainingOptionsList.push({ list: listAdvIn, name: listAdvInName });
          }
          listAdvIn = [];
        }

        const b1 = buildOptionInput(
          normalTrainingOptionsList_1,
          o1,
          i,
          this.onChangeForm,
          this.calcTip1,
          projectId,
          this.formRef,
          normalTrainingOptionsList_1[i - 1],
          false,
          this.formForceRefresh,
          undefined,
          this.onNeedsRefreshInputChange,
          problemType,
        );
        initialValuesRes = _.assign({}, initialValuesRes, b1.initialValues ?? {});
        if (o1?.twoColumns && normalTrainingOptionsList_1[i + 1] != null && o1?.groupGlobal === normalTrainingOptionsList_1[i + 1]?.groupGlobal) {
          i++;
          const o2 = normalTrainingOptionsList_1[i];
          const b2 = buildOptionInput(
            normalTrainingOptionsList_1,
            o2,
            i,
            this.onChangeForm,
            this.calcTip1,
            projectId,
            this.formRef,
            normalTrainingOptionsList_1[i - 1],
            false,
            this.formForceRefresh,
            undefined,
            this.onNeedsRefreshInputChange,
            problemType,
          );
          initialValuesRes = _.assign({}, initialValuesRes, b2.initialValues ?? {});
          listAdvIn.push(
            <div
              key={'opt_' + o1.name + o2.name}
              css={`
                padding-top: 18px;
                display: flex;
                flex-wrap: nowrap;
                border-top: 1px solid ${!newGroupGlobal || lastNewGroupGlobal || (newGroupGlobal && !lastNewGroupGlobal) ? '#23305e' : 'transparent'};
              `}
            >
              <div
                css={`
                  flex: 1;
                  margin-right: 9px;
                `}
              >
                {b1.list}
              </div>
              <div
                css={`
                  flex: 1;
                  margin-left: 9px;
                `}
              >
                {b2.list}
              </div>
            </div>,
          );
        } else {
          listAdvIn.push(
            <div
              key={'opt_1111111_' + o1.name}
              css={`
                padding-top: 18px;
                border-top: 1px solid ${!newGroupGlobal || lastNewGroupGlobal || (newGroupGlobal && !lastNewGroupGlobal) ? '#23305e' : 'transparent'};
              `}
            >
              {b1.list}
            </div>,
          );
        }

        listAdvInName = o1?.groupGlobal;
        lastNewGroupGlobal = newGroupGlobal;
      }

      if (listAdvIn.length > 0) {
        if (normalTrainingOptionsList[normalTrainingOptionsList.length - 1]?.list !== listAdvIn) {
          normalTrainingOptionsList.push({ list: listAdvIn, name: listAdvInName });
        }
      }

      normalTrainingOptionsList = normalTrainingOptionsList.map((l1, ind1) => {
        if (Utils.isNullOrEmpty(l1.name)) {
          return (
            <div
              key={'opt_111_' + ind1}
              css={`
                position: relative;
                padding-top: 2px;
                margin-top: 2px;
              `}
            >
              {l1.list}
            </div>
          );
        } else {
          return (
            <div
              key={'opt_1_' + l1.name + ind1}
              css={`
                display: flex;
                position: relative;
                border-top: 1px solid #23305e;
                padding-top: 2px;
                margin-top: 2px;
              `}
            >
              <div
                css={`
                  flex: 0 0 46px;
                  color: white;
                  text-align: center;
                  padding: 4px 2px 4px 2px;
                `}
              >
                <div>
                  <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faLayerGroup').faLayerGroup} transform={{ size: 20, x: 0, y: 0 }} />
                </div>
              </div>
              <div
                css={`
                  flex: 1;
                  color: ${Utils.colorA(0.7)};
                `}
              >
                <div
                  css={`
                    font-family: Matter;
                    font-size: 16px;
                    font-weight: bold;
                    color: #d1e4f5;
                    text-transform: uppercase;
                  `}
                >
                  {l1.name}
                </div>
                <div
                  css={`
                    margin-top: 12px;
                  `}
                >
                  {l1.list}
                </div>
              </div>
            </div>
          );
        }
      });
    }

    if (defaultDocumentRetriever) {
      initialValuesRes = _.assign({}, initialValuesRes, {
        DOCUMENT_RETRIEVERS: [
          {
            name: defaultDocumentRetriever,
            value: defaultDocumentRetriever,
            label: defaultDocumentRetriever,
          },
        ],
      });
    }

    if (advancedTrainingOptionsList) {
      const { advancedTrainingOptionsList: tempAdvancedTrainingOptionsList, initialValuesRes: tempInitialValuesRes } = getAdvancedTrainingOptionsList(
        advancedTrainingOptionsList,
        initialValuesRes,
        this.onChangeForm,
        this.calcTip1,
        projectId,
        this.formRef,
        this.formForceRefresh,
        this.onNeedsRefreshInputChange,
        problemType,
      );

      advancedTrainingOptionsList = tempAdvancedTrainingOptionsList;
      initialValuesRes = tempInitialValuesRes;
    }

    if (this.initialValuesResLastForModelConfig == null || !_.isEqual(this.initialValuesResLastForModelConfig, initialValuesRes)) {
      this.initialValuesResLastForModelConfig = initialValuesRes;
    } else {
      initialValuesRes = this.initialValuesResLastForModelConfig;
    }

    let modelDetailFound;
    if (editModelId) {
      modelDetailFound = this.memModelDetail(false)(this.props.models, editModelId);
      let isFirstTime = trainOptionsList?.isUsingCurrentTrainingOptions === false;
      this.memModelConfig(modelDetailFound, initialValuesRes, this.formRef?.current, optionsCopy, isFirstTime);
    }
    let title1 = 'Training Configuration';
    if ((!normalTrainingOptionsList || normalTrainingOptionsList.length === 0) && (!advancedTrainingOptionsList || advancedTrainingOptionsList.length === 0)) {
      title1 = 'Start Training';
    }

    let isEdit = false;
    if (!Utils.isNullOrEmpty(editModelId)) {
      initialValuesRes = Utils.emptyStaticObject();
      title1 = 'Re-Train Model';
      isEdit = true;
    }

    let errorConfigMsg = calcTrainingOptionsListError(undefined, projectId, featureGroupIds);
    if (errorConfigMsg === '') {
      errorConfigMsg = null;
    }

    let trainingOptionsIsProcessing = calcTrainingOptionsIsProcessing(undefined);

    let validateProjectRes = this.memValidateProject(false)(this.props.defDatasets, projectId, featureGroupIds);
    let errorFromValidateRes: any = this.memValidateErrorCalc(validateProjectRes, schemaInfoFull) ?? {};
    let errorFromValidate = errorFromValidateRes?.res;
    let errorFromValidateFGid = errorFromValidateRes?.errorFeatureGroupId;
    if (errorFromValidate != null && _.isArray(errorFromValidate)) {
      errorConfigMsg = (
        <div>
          {errorFromValidate.map((s1, s1ind) => {
            return (
              <div
                key={'err' + s1ind}
                css={`
                  margin: 4px 0;
                `}
              >
                <AutoLinkString>{s1}</AutoLinkString>
              </div>
            );
          })}
        </div>
      );
    } else if (!Utils.isNullOrEmpty(errorFromValidate)) {
      errorConfigMsg = errorFromValidate;
    }

    this.memInitValuesForm(initialValuesRes, this.formRef?.current, currentlySelectedAdvancedOptionsListWithDocumentRetrievers, algorithmModelConfigs, trainOptionsList, problemType, isEdit);

    const listDeploymentsListAll = this.memDeployList(false)(this.props.deployments, projectId);
    const { manyDeploys, manyDeploysModelId } = this.memDeploysInspect(listDeploymentsListAll) ?? {};
    const useManyDeploys = this.memManyDeploys(manyDeploys, manyDeploysModelId, editModelId);

    let registerModel;
    let resCustomModelInfo = this.memCustomModelInfo(false)(this.props.projects, projectId);

    let algosList = this.memCustomAlgos(false)(this.props.algorithms, projectId);
    let optionsAlgos = this.memAlgoOptions(algosList, projectId, modelDetailFound);
    let trainingConfig = this.memTrainingConfig(this.formRef?.current?.getFieldsValue());
    let builtinAlgosList = this.memBuiltinAlgos(false)(this.props.algorithms, projectId, featureGroupIds, trainingConfig);
    let optionsBuiltinAlgos = this.memBuiltinAlgoOptions(builtinAlgosList, modelDetailFound);
    return (
      <div style={{ margin: '30px auto', maxWidth: '800px', color: Utils.colorA(1) }}>
        <RefreshAndProgress isRelative errorMsg={undefined /*errorConfigMsg*/} errorButtonText={'Fix Schema Errors'} onClickErrorButton={this.goToDashboard.bind(this, errorFromValidateFGid)}>
          <div style={{ color: 'white', padding: '20px 23px' }} className={sd.grayPanel}>
            {/*// @ts-ignore*/}
            <Spin spinning={this.state.isProcessing} size={'large'}>
              <div
                css={`
                  font-family: Matter;
                  font-size: 24px;
                  line-height: 1.33;
                  color: #ffffff;
                  display: flex;
                  align-items: center;
                `}
              >
                <span
                  css={`
                    flex: 1;
                  `}
                >
                  {title1}
                </span>
                {registerModel != null && !editModelId && (
                  <span>
                    <Link to={registerModel}>
                      <Button type={'primary'}>{editModelId ? 'Edit ' : ''}Register Model</Button>
                    </Link>
                  </span>
                )}
              </div>
              <div
                css={`
                  border-top: 1px solid white;
                  margin-top: 10px;
                  margin-bottom: 8px;
                `}
              ></div>

              {!isOnlyEdit && !this.state.showIsValidationError && errorConfigMsg != null && (
                <div
                  css={`
                    margin-top: 10px;
                    font-family: Roboto;
                    font-size: 14px;
                    letter-spacing: 1.31px;
                    text-align: center;
                    color: #f85555;
                  `}
                >
                  Error Preview: {errorConfigMsg}
                  {/*<div css={`color: white;`}>Please go <Link usePointer showAsLink to={'/'+PartsLink.project_dashboard+'/'+(projectId ?? '-')}>Dashboard</Link></div>*/}
                </div>
              )}
              {!isOnlyEdit && this.state.showIsValidationError && (
                <div
                  css={`
                    margin-top: 20px;
                    font-family: Roboto;
                    font-size: 14px;
                    letter-spacing: 1.31px;
                    text-align: center;
                    color: #f85555;
                  `}
                >
                  Validation errors in your feature groups.{' '}
                  <span
                    css={`
                      color: white;
                    `}
                  >
                    Please go{' '}
                    <Link usePointer showAsLink to={'/' + PartsLink.project_dashboard + '/' + (projectId ?? '-')}>
                      Dashboard
                    </Link>
                  </span>
                </div>
              )}

              {
                <FormExt
                  css={`
                    font-family: Roboto;
                    font-size: 14px;
                    letter-spacing: 1.31px;
                    color: #ffffff;
                  `}
                  layout={'vertical'}
                  onValuesChange={this.onValuesChange}
                  ref={this.formRef}
                  onFinish={this.handleSubmit}
                  className="login-form"
                  onChange={this.onChangeForm}
                  initialValues={{}}
                >
                  {!isEdit && (
                    <Form.Item shouldUpdate={true} name={'nameInternal'} label={<span style={{ color: Utils.colorA(1) }}>Name</span>}>
                      <Input placeholder={modelDefaultName} />
                    </Form.Item>
                  )}

                  <div
                    css={`
                      border-top: 1px solid #23305e;
                      margin-bottom: 10px;
                    `}
                  ></div>

                  {!isOnlyEdit && (
                    <FeatureGroupsFormItemsTraining
                      defaultsFromModelId={editModelId}
                      title={`Training Feature Groups`}
                      projectId={projectId}
                      onUseCaseTypesList={this.onUseCaseTypesList}
                      onSetFieldsValuesFromFGs={this.onSetFieldsValuesFromFGs}
                      onChangeValuesFromFGs={this.onChangeValuesFromFGs}
                    />
                  )}

                  {normalTrainingOptionsList}
                  {problemType === 'CHAT_LLM' ? (
                    <Form.Item
                      name={'DOCUMENT_RETRIEVERS'}
                      label={
                        <span
                          css={`
                            font-family: Roboto;
                            font-size: 12px;
                            font-weight: bold;
                            letter-spacing: 1.12px;
                            color: #ffffff;
                          `}
                        >
                          {'Document Retrievers'}
                        </span>
                      }
                      rules={[{ required: true, message: 'Required!' }]}
                    >
                      <SelectExt options={advancedOptionsListWithDocumentRetrievers} placeholder={'Document Retrievers'} isMulti={true} />
                    </Form.Item>
                  ) : null}
                  {advancedTrainingOptionsList && advancedTrainingOptionsList.length > 0 && (
                    <div
                      css={`
                        margin-bottom: 26px;
                      `}
                    >
                      {/*// @ts-ignore*/}
                      <Collapse bordered={false} style={{ backgroundColor: Utils.colorA(0.08), color: 'white', marginTop: '10px', borderBottom: 'none' }}>
                        {/*// @ts-ignore*/}
                        <Panel header={<span style={{ color: Utils.colorAall(1) }}>Advanced Options</span>} forceRender={true} key={'advanced'} style={{ borderBottom: 'none' }}>
                          {advancedTrainingOptionsList}
                        </Panel>
                      </Collapse>
                    </div>
                  )}

                  {this.state.additionalModels?.length > 0 ? (
                    <div
                      css={`
                        margin-bottom: 10px;
                        font-size: 12px;
                        color: white;
                        font-weight: bold;
                        -webkit-letter-spacing: 1.12px;
                        -moz-letter-spacing: 1.12px;
                        -ms-letter-spacing: 1.12px;
                        letter-spacing: 1.12px;
                        text-transform: uppercase;
                        font-family: Roboto;
                      `}
                    >
                      ADDITIONAL MODELS
                    </div>
                  ) : null}

                  {this.state.additionalModels.map((additionalModel) => (
                    <Form.Item key={additionalModel.id}>
                      {additionalModel.traingingOptionsList && additionalModel.traingingOptionsList.length > 0 ? (
                        <div
                          css={`
                            margin-bottom: 16px;
                          `}
                        >
                          <Form.Item
                            name={[`algorithmTrainingConfigs_${additionalModel.id}`, 'MODEL_NAME']}
                            initialValue={`Additional Model ${additionalModel.id}`}
                            label={
                              <span
                                css={`
                                  font-family: Roboto;
                                  font-size: 12px;
                                  font-weight: bold;
                                  letter-spacing: 1.12px;
                                  color: #ffffff;
                                `}
                              >
                                {'Model Name'}
                              </span>
                            }
                          >
                            <Input placeholder={'MODEL NAME'} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item
                            name={[`algorithmTrainingConfigs_${additionalModel.id}`, 'DOCUMENT_RETRIEVERS']}
                            label={
                              <span
                                css={`
                                  font-family: Roboto;
                                  font-size: 12px;
                                  font-weight: bold;
                                  letter-spacing: 1.12px;
                                  color: #ffffff;
                                `}
                              >
                                {'Document Retrievers'}
                              </span>
                            }
                          >
                            <SelectExt options={advancedOptionsListWithDocumentRetrievers} placeholder={'Document Retrievers'} isMulti={true} />
                          </Form.Item>
                          {/*// @ts-ignore*/}
                          <Collapse bordered={false} style={{ backgroundColor: Utils.colorA(0.08), color: 'white', marginTop: '10px', borderBottom: 'none' }}>
                            {/*// @ts-ignore*/}
                            <Panel header={<span style={{ color: Utils.colorAall(1) }}>Advanced Options</span>} forceRender={true} key={'advanced'} style={{ borderBottom: 'none' }}>
                              {
                                getAdvancedTrainingOptionsList(
                                  additionalModel.traingingOptionsList.filter((trainingOption) => trainingOption.name !== 'DOCUMENT_RETRIEVERS' && trainingOption.name !== 'MODEL_NAME'),
                                  initialValuesRes,
                                  this.onChangeForm,
                                  this.calcTip1,
                                  projectId,
                                  this.formRef,
                                  this.formForceRefresh,
                                  this.onNeedsRefreshInputChange,
                                  problemType,
                                  `algorithmTrainingConfigs_${additionalModel.id}`,
                                ).advancedTrainingOptionsList
                              }
                            </Panel>
                          </Collapse>
                        </div>
                      ) : null}
                    </Form.Item>
                  ))}

                  {problemType == 'CHAT_LLM' && (
                    <div>
                      <Button
                        type="default"
                        ghost
                        css={`
                          width: 100%;
                        `}
                        onClick={() => {
                          REClient_.client_().getTrainingConfigOptions(projectId, featureGroupIds, this.calcForRetrain(), {}, true, (err, res) => {
                            if (!err && res?.success) {
                              this.setState((prevState) => {
                                const { additionalModels } = prevState;
                                return {
                                  ...prevState,
                                  additionalModels: [...additionalModels, { id: `${additionalModels.length + 1}`, traingingOptionsList: res.result }],
                                };
                              });
                            }
                          });
                        }}
                      >
                        Add Additional Models
                      </Button>
                    </div>
                  )}
                  {optionsBuiltinAlgos != null && optionsBuiltinAlgos?.length > 0 && problemType !== 'CHAT_LLM' && (
                    <>
                      <Collapse bordered={false} style={{ backgroundColor: Utils.colorA(0.08), color: 'white', marginTop: '10px', borderBottom: 'none' }}>
                        {/*// @ts-ignore*/}
                        <Panel
                          header={
                            <span style={{ color: Utils.colorAall(1) }}>
                              Select {false ? 'Builtin' : ''}Algorithms <HelpIcon id={'trainmodel_select_algos'} style={{ marginLeft: '4px' }} />
                            </span>
                          }
                          forceRender={true}
                          key={'advanced'}
                          style={{ borderBottom: 'none' }}
                        >
                          <div
                            css={`
                              padding-bottom: 6px;
                              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                              color: white;
                              margin-bottom: 10px;
                            `}
                          >
                            Builtin Algorithms
                            <HelpIcon id={'trainmodel_builtin_algos'} style={{ marginLeft: '4px' }} />
                          </div>
                          <Radio.Group
                            css={`
                              display: flex;
                              flex-direction: column;
                              gap: 7px;
                              margin-bottom: 2px;
                            `}
                            value={this.state.builtinAlgoSelMode}
                            onChange={(e) => {
                              this.setState({ builtinAlgoSelMode: e.target.value });
                            }}
                          >
                            <Radio value={'default'}>
                              <span
                                css={`
                                  color: white;
                                `}
                              >
                                {`Let the system decide`}
                              </span>
                            </Radio>
                            {this.state.customAlgoSel?.length > 0 && (
                              <>
                                <Radio value={'empty'}>
                                  <span
                                    css={`
                                      color: white;
                                    `}
                                  >
                                    {'Do not run any'}
                                  </span>
                                </Radio>
                              </>
                            )}
                            <Radio value={'partial'}>
                              <span
                                css={`
                                  color: white;
                                `}
                              >
                                {'Select yourself'}
                              </span>
                            </Radio>
                          </Radio.Group>
                          {this.state.builtinAlgoSelMode === 'partial' && (
                            <>
                              <div
                                css={`
                                  border-top: 1px solid #23305e;
                                  margin-bottom: 20px;
                                `}
                              ></div>
                              {optionsBuiltinAlgos?.map((o1, o1ind) => {
                                return (
                                  <div
                                    css={`
                                      margin: 2px 0;
                                    `}
                                    key={'algo_' + o1.name + '_' + o1ind}
                                  >
                                    <div>
                                      <Checkbox checked={this.state.builtinAlgoSel?.includes(o1.value)} onChange={this.onChangeBuiltinAlgoSel.bind(this, o1.value, isEdit)}>
                                        <span
                                          css={`
                                            color: white;
                                          `}
                                        >
                                          {o1.label}
                                        </span>
                                      </Checkbox>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {optionsAlgos != null && optionsAlgos?.length > 0 && (
                            <div>
                              <div
                                css={`
                                  margin-top: 35px;
                                  padding-bottom: 6px;
                                  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                                  color: white;
                                  margin-bottom: 10px;
                                `}
                              >
                                Custom Algorithms
                                <HelpIcon id={'trainmodel_custom_algos'} style={{ marginLeft: '4px' }} />
                              </div>
                              {
                                <>
                                  <Form.Item shouldUpdate={true}>
                                    {optionsAlgos?.map((o1, o1ind) => {
                                      return (
                                        <div
                                          css={`
                                            margin: 6px 0;
                                          `}
                                          key={'algo_' + o1.name + '_' + o1ind}
                                        >
                                          <div>
                                            <Checkbox checked={this.state.customAlgoSel?.includes(o1.value)} onChange={this.onChangeAlgoSel.bind(this, o1.value, isEdit)}>
                                              <span
                                                css={`
                                                  color: white;
                                                `}
                                              >
                                                {o1.label}
                                              </span>
                                            </Checkbox>
                                          </div>
                                          {this.state.customAlgoSel?.includes(o1.value) && (
                                            <div
                                              css={`
                                                margin-top: 4px;
                                              `}
                                            >
                                              <Form.Item
                                                name={prefixCustomAlgoConfigValue + o1.value}
                                                rules={[
                                                  ({ getFieldValue }) => ({
                                                    validator(rule, value) {
                                                      if (Utils.isNullOrEmpty(value)) {
                                                        return Promise.resolve();
                                                      }
                                                      let json1 = Utils.tryJsonParse(value);
                                                      if (json1 == null) {
                                                        return Promise.reject('Invalid Number/String (must be in double quotes)/JSON');
                                                      }
                                                      return Promise.resolve();
                                                    },
                                                  }),
                                                ]}
                                              >
                                                <Input placeholder={'Algorithm Config'} value={this.state.customAlgoConfigString?.[o1.value] ?? ''} onChange={this.onChangeAlgoConfigSel.bind(this, o1.value)} />
                                              </Form.Item>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </Form.Item>

                                  {this.state.customAlgoSel?.length > 0 && (
                                    <div
                                      css={`
                                        margin-bottom: 20px;
                                      `}
                                    ></div>
                                  )}
                                  {this.state.customAlgoSel?.length > 0 && (
                                    <CpuAndMemoryOptions ref={this.cpuAndMemoryRef} form={this.formRef?.current} isForm name={'CustomModel'} helpidPrefix={'trainmodel'} memoryLabel={'Training Memory (GB)'} />
                                  )}
                                </>
                              }
                            </div>
                          )}
                        </Panel>
                      </Collapse>
                    </>
                  )}

                  {!isOnlyEdit && editModelId != null && useManyDeploys && listDeploymentsListAll != null && (
                    <div
                      css={`
                        margin-top: 20px;
                      `}
                    >
                      <div
                        css={`
                          border-top: 1px solid #23305e;
                          margin-bottom: 20px;
                        `}
                      ></div>
                      <div
                        css={`
                          font-family: Matter;
                          font-size: 14px;
                          padding: 10px 0;
                        `}
                      >
                        Select zero or more of the deployments below to have the retrained model automatically deployed. If none, the new model version will not be deployed.
                      </div>
                      <DeploymentsList filterByModelId={editModelId} noAutoTooltip projectId={projectId} isChecked={true} onChangeChecked={this.onChangeChecked} />
                    </div>
                  )}

                  {!isEdit && <InputCron onChange={this.onChangeCronValue} style={{ marginTop: '10px' }} />}

                  <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                    <div style={{ borderTop: '1px solid #23305e', margin: '4px -22px' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <Button disabled={trainingOptionsIsProcessing} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px', width: '100%' }}>
                        {isOnlyEdit ? 'Set Configuration' : isEdit ? 'Re-Train Model' : 'Train Model'}
                      </Button>
                    </div>
                  </Form.Item>
                </FormExt>
              }
            </Spin>
          </div>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: RootState) => ({
    paramsProp: state.paramsProp,
    models: state.models,
    trainingOptions: state.trainingOptions,
    defaultModelName: state.defaultModelName,
    defDatasets: state.defDatasets,
    useCases: state.useCases,
    projects: state.projects,
    deployments: state.deployments,
    algorithms: state.algorithms,
  }),
  null,
)(ModelTrain);
