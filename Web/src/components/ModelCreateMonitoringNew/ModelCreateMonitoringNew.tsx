import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Checkbox from 'antd/lib/checkbox';
import Col from 'antd/lib/col';
import Collapse from 'antd/lib/collapse';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Row from 'antd/lib/row';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { DocStoreDefForcedVision } from '../../api/DocStoreInterfaces';
import REClient_ from '../../api/REClient';
import { useFeatureGroup, useModelList, useProject, useProjectsAll } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import DateOld from '../DateOld/DateOld';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import InputCron from '../InputCron/InputCron';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';

const s = require('./ModelCreateMonitoringNew.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

const enum EIsType {
  Normal = 'normal',
  FG = 'fg',
  Vision = 'vision',
  NLP = 'nlp',
}

const MonitorsTypesList = [
  {
    name: 'Drift',
    value: 'drift',
  },
  {
    name: 'Data Integrity',
    value: 'dataIntegrity',
  },
  {
    name: 'Performance',
    value: 'performance',
  },
  {
    name: 'Bias',
    value: 'bias',
  },
];

const MappingsListTraining = [
  {
    isDropdown: true,
    requiredForTypes: ['drift', 'dataIntegrity'],
    optionalForType: [],
    isCustom: true,
  },
  {
    isImage: true,
    requiredForTypes: ['drift', 'performance'],
    optionalForType: [],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'IMAGE',
    name: 'The image reference of this Training Data (IMAGE)',
    forIsTypes: [EIsType.Vision],
    helpId: 'monitor_image_mapping',
  },
  {
    requiredForTypes: ['drift', 'performance'],
    optionalForType: [],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'DOCUMENT',
    name: 'The text represented within the training data (DOCUMENT)',
    forIsTypes: [EIsType.NLP],
    helpId: 'monitor_document_mapping',
  },
  {
    requiredForTypes: [],
    optionalForType: ['drift'],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'TARGET',
    name: 'The Target Value of this Training Data (TARGET)',
    helpId: 'monitor_target_mapping',
  },
  {
    requiredForTypes: [],
    optionalForType: ['drift'],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'PREDICTED_VALUE',
    name: 'The Predicted Value In This Feature Group (PREDICTED_VALUE)',
    helpId: 'monitor_predicted_value_mapping',
  },
];

const MappingsListPred = [
  {
    isDropdown: true,
    requiredForTypes: ['drift', 'dataIntegrity', 'performance', 'bias'],
    optionalForType: [],
    isCustom: true,
  },
  {
    isImage: true,
    requiredForTypes: ['drift', 'performance'],
    optionalForType: [],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'IMAGE',
    name: 'The image reference of this Prediction Data (IMAGE)',
    forIsTypes: [EIsType.Vision],
    helpId: 'monitor_image_mapping',
  },
  {
    requiredForTypes: ['drift', 'performance'],
    optionalForType: [],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'DOCUMENT',
    name: 'The text represented within the prediction data (DOCUMENT)',
    forIsTypes: [EIsType.NLP],
    helpId: 'monitor_document_mapping',
  },
  {
    requiredForTypes: ['performance', 'bias'],
    optionalForType: ['drift'],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'ACTUAL',
    name: 'The Ground Truth Value of the Prediction Data. (ACTUAL)',
    helpId: 'monitor_actual_mapping',
  },
  {
    requiredForTypes: ['performance', 'bias'],
    optionalForType: ['drift'],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'PREDICTED_VALUE',
    name: 'The Predicted Value for the Prediction Data. (PREDICTED_VALUE)',
    helpId: 'monitor_predicted_value_mapping',
  },
  {
    requiredForTypes: [],
    optionalForType: ['drift', 'dataIntegrity', 'performance', 'bias'],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'PREDICTION_TIME',
    name: 'The Prediction Time of each Row. (PREDICTION_TIME)',
    helpId: 'monitor_prediction_time_mapping',
  },
  {
    requiredForTypes: ['performance'],
    optionalForType: [],
    isMultiple: false,
    isRequired: false,
    featureMapping: 'PREDICTED_PROBABILITY',
    name: 'The Predicted Probablity for the Target Class. (PREDICTED_PROBABILITY)',
    helpId: 'monitor_predicted_probability_mapping',
  },
  {
    requiredForTypes: ['performance'],
    optionalForType: [],
    isMultiple: false,
    isRequired: false,
    isColumnValueOption: true,
    name: 'Target Class',
    fieldName: 'predictedClass',
    helpId: 'monitor_target_class_mapping',
  },
  {
    requiredForTypes: ['bias'],
    optionalForType: [],
    isMultiple: true,
    isRequired: false,
    featureMapping: 'PROTECTED_CLASS',
    name: 'Protected Classes to Compute Model Bias. (PROTECTED_CLASS)',
    helpId: 'monitor_protected_class_mapping',
  },
  {
    requiredForTypes: ['bias'],
    optionalForType: [],
    isMultiple: false,
    isRequired: false,
    isColumnValueOption: true,
    name: 'Favorable Class for Model Bias',
    fieldName: 'biasFavorableOutcome',
    helpId: 'monitor_bias_favorable_outcome_mapping',
  },
  {
    requiredForTypes: [],
    optionalForType: ['drift'],
    isModelId: true,
    isCustom: true,
  },
];

interface IModelCreateMonitoringNewProps {}

const PROTECTED_CLASS = 'PROTECTED_CLASS';
const ForcedKeys = ['IMAGE', 'ACTUAL', 'PREDICTED_VALUE', 'PREDICTED_PROBABILITY', 'PREDICTION_TIME', 'DOCUMENT', PROTECTED_CLASS];
const ForcedKeysTrain = ['IMAGE', 'TARGET', 'PREDICTED_VALUE', 'DOCUMENT'];

const SPECIFIC_VERSION = 'SPECIFIC_VERSION';
const LATEST_VERSION = 'LATEST_VERSION';
const N_VERSION = 'N_VERSION';

const ModelCreateMonitoringNew = React.memo((props: PropsWithChildren<IModelCreateMonitoringNewProps>) => {
  const { monitoringParam, paramsProp, featureGroupsParam, projectsParam, useCasesParam, modelsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
    modelsParam: state.models,
    monitoringParam: state.monitoring,
  }));

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [typesHide, setTypesHide] = useState([]);
  const [typesSel, setTypesSel] = useState([]);
  const [isFGDrift, setIsFGDrift] = useState(false);
  const [isMultipleFGDrift, setIsMultipleFGDrift] = useState(false);
  const [isType, setIsType] = useState(EIsType.Normal);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let editModelId = paramsProp?.get('editModelId');
  if (editModelId === '') {
    editModelId = null;
  }

  const foundProject1 = useProject(projectId);
  const docStoreDefOri = null; //useDocStoreFromProject(foundProject1);

  const docStoreDefForce = useMemo(() => {
    if (isType === EIsType.Vision || isType === EIsType.NLP) {
      return DocStoreDefForcedVision;
    } else {
      return null;
    }
  }, [isType]);

  const docStoreDefForced = docStoreDefForce ?? docStoreDefOri;

  const hideFeatureGroupDrift = docStoreDefForced?.monitorsHideFeatureGroupRadio === true;

  useEffect(() => {
    let typesUsed = MonitorsTypesList.map((t1) => t1.value);
    docStoreDefForced?.monitorsTypesListHide?.some((s1) => {
      typesUsed = typesUsed?.filter((v1) => v1 !== s1);
    });

    if (docStoreDefForced?.monitorsTypesListSelect != null) {
      typesUsed = [...(docStoreDefForced?.monitorsTypesListSelect ?? [])];
    }

    setTypesHide([...(docStoreDefForced?.monitorsTypesListHide ?? [])]);
    setTypesSel(typesUsed);
  }, [docStoreDefForced]);

  const handleSubmit = (values) => {
    let featureMappings = null,
      trainingFeatureMappings = null;

    const calcMappings = (list, mappings, prefix = 'bias_') => {
      list?.some((r1, r1ind) => {
        if (r1?.isHidden) {
          return;
        }

        let v1 = values?.[prefix + r1.featureMapping];
        if (v1 != null) {
          mappings ??= {};

          if (r1.isMultiple) {
            if (_.isArray(v1)) {
              v1.some((v2) => {
                if (v2 != null) {
                  mappings[v2] = r1.featureMapping;
                }
              });
            }
          } else {
            if (_.isString(v1) || _.isNumber(v1)) {
              if (v1 != null) {
                mappings['' + v1] = r1.featureMapping;
              }
            } else {
              if (v1?.value != null) {
                mappings['' + v1?.value] = r1.featureMapping;
              }
            }
          }
        }
      });

      return mappings;
    };

    featureMappings = calcMappings(mappingsPred, featureMappings, 'bias_');
    trainingFeatureMappings = calcMappings(mappingsTrain, trainingFeatureMappings, 'train_');

    let targetValueBias = values.biasFavorableOutcome?.value;
    let targetValuePerformance = values.predictedClass?.value;
    let featureGroupMonitorBaseConfig = values.baseVersion?.value;
    let featureGroupMonitorComparisonConfig = values.comparisonVersion?.value;
    let predictionFeatureGroupId = isFGDrift && !isMultipleFGDrift ? values.trainFG?.value : values.predFG?.value;

    const cb1 = (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.listMonitoringModels_(projectId);

        Location.push('/' + PartsLink.monitors_list + '/' + projectId);
      }
    };

    if (isType === EIsType.NLP) {
      REClient_.client_().createNlpDriftMonitor(projectId, values.predFG?.value, values.trainFG?.value, values.name, featureMappings, trainingFeatureMappings, targetValuePerformance, values.refreshSchedule, cb1);
    } else {
      let methodCreate = REClient_.client_().createModelMonitor;

      if (docStoreDefForced?.monitorsCreateAPIMethod) {
        methodCreate = docStoreDefForced?.monitorsCreateAPIMethod;
      }

      if (methodCreate != null) {
        methodCreate(
          projectId,
          values.modelId?.value,
          values.name,
          values.trainFG?.value,
          predictionFeatureGroupId,
          values.refreshSchedule,
          featureMappings,
          null,
          targetValueBias,
          targetValuePerformance,
          trainingFeatureMappings,
          featureGroupMonitorBaseConfig,
          featureGroupMonitorComparisonConfig,
          cb1,
        );
      }
    }
  };

  const onChangeCronValue = (v1) => {
    form?.setFieldsValue({ refreshSchedule: v1 });
  };

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);
  const featureGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);

  const optionsFGall = useMemo(() => {
    //filter(f1 => f1.featureGroupType?.toUpperCase()==='TRAINING_DATA')
    let res = featureGroupsList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, data: f1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [featureGroupsList]);
  const optionsFGtrain = useMemo(() => {
    //filter(f1 => f1.featureGroupType?.toUpperCase()==='TRAINING_DATA')
    let res = featureGroupsList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, data: f1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [featureGroupsList]);
  const optionsFGpred = useMemo(() => {
    //filter(f1 => f1.featureGroupType?.toUpperCase()==='PREDICTION_LOG')
    let res = featureGroupsList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, data: f1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [featureGroupsList]);

  const projectsList = useProjectsAll();
  const optionsProjects = useMemo(() => {
    let res = projectsList?.map((p1) => ({ label: p1.name, value: p1.projectId })) ?? [];
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [projectsList]);

  const optionsProjectsSelId = form?.getFieldValue('modelIdprojectId')?.value;
  const optionsProjectFound = useProject(optionsProjectsSelId);
  const optionsProjectFoundModelsList = useModelList(optionsProjectsSelId);

  const optionsModelIds = useMemo(() => {
    let res = optionsProjectFoundModelsList?.toJS()?.map((m1) => ({ label: m1.name, value: m1.modelId, data: m1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [optionsProjectFoundModelsList]);

  const onChangeForm = (v1) => {
    setTimeout(() => {
      // let values = form.getFieldsValue();
      forceUpdate();
    }, 0);
  };

  const predFeatureGroupId = form.getFieldValue('predFG')?.value;
  const predFGOne = useFeatureGroup(projectId, predFeatureGroupId);

  const trainFeatureGroupId = form.getFieldValue('trainFG')?.value;
  const trainFGOne = useFeatureGroup(projectId, trainFeatureGroupId);

  useEffect(() => {
    featureGroups.memFeatureGroupsVersionsForFeatureGroupId(true, trainFeatureGroupId);
  }, [featureGroupsParam, trainFeatureGroupId]);
  const trainFeatureGroupVersionsList = useMemo(() => {
    return featureGroups.memFeatureGroupsVersionsForFeatureGroupId(false, trainFeatureGroupId);
  }, [featureGroupsParam, trainFeatureGroupId]);

  const optionsFGVersionsTrainBase = useMemo(() => {
    let res = trainFeatureGroupVersionsList?.map((f1) => ({
      label: (
        <span>
          <span className={'textVersion'}>{f1?.featureGroupVersion}&nbsp;-&nbsp;</span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: { selection_strategy: SPECIFIC_VERSION, specific_feature_group_version: f1.featureGroupVersion },
      data: f1,
    }));
    res ??= [];
    res.unshift({ label: '(Latest Version)', value: { selection_strategy: LATEST_VERSION } });
    if (isMultipleFGDrift) {
      res.unshift({ label: '(Version before the Latest)', value: { selection_strategy: N_VERSION } });
    }
    return res;
  }, [trainFeatureGroupVersionsList, isMultipleFGDrift]);

  const optionsFGVersionsTrainComparison = useMemo(() => {
    let res = trainFeatureGroupVersionsList?.map((f1) => ({
      label: (
        <span>
          <span className={'textVersion'}>{f1?.featureGroupVersion}&nbsp;-&nbsp;</span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: { selection_strategy: SPECIFIC_VERSION, specific_feature_group_version: f1.featureGroupVersion },
      data: f1,
    }));
    res ??= [];
    res.unshift({ label: '(Version before the Latest)', value: { selection_strategy: N_VERSION } });
    return res;
  }, [trainFeatureGroupVersionsList]);

  useEffect(() => {
    featureGroups.memFeatureGroupsVersionsForFeatureGroupId(true, predFeatureGroupId);
  }, [featureGroupsParam, predFeatureGroupId]);
  const predFeatureGroupVersionsList = useMemo(() => {
    return featureGroups.memFeatureGroupsVersionsForFeatureGroupId(false, predFeatureGroupId);
  }, [featureGroupsParam, predFeatureGroupId]);

  const optionsFGVersionsPred = useMemo(() => {
    let res = predFeatureGroupVersionsList?.map((f1) => ({
      label: (
        <span>
          <span className={'textVersion'}>{f1?.featureGroupVersion}&nbsp;-&nbsp;</span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: { selection_strategy: SPECIFIC_VERSION, specific_feature_group_version: f1.featureGroupVersion },
      data: f1,
    }));
    res ??= [];
    res.unshift({ label: '(Latest Version)', value: { selection_strategy: LATEST_VERSION } });
    res.unshift({ label: '(Version before the Latest)', value: { selection_strategy: N_VERSION } });
    return res;
  }, [predFeatureGroupVersionsList]);

  const projectUseCase = useMemo(() => {
    return foundProject1?.useCase;
  }, [foundProject1]);

  const [mappingsPred, setMappingsPred] = useState(
    null as { isImage?: boolean; isHidden?: boolean; isMultiple?: boolean; isRequired?: boolean; field?: string; name?: string; featureMapping?: string; isColumnValueOption?: boolean; fieldName?: string; helpId?: string }[],
  );
  const [mappingsTrain, setMappingsTrain] = useState(null as { isImage?: boolean; isHidden?: boolean; isMultiple?: boolean; isRequired?: boolean; field?: string; name?: string; featureMapping?: string; helpId?: string }[]);

  const calcTypes = (m1, onlyCheckHidden = false) => {
    let isRequired = null,
      isOptional = null;
    m1.requiredForTypes?.some((s1) => {
      if (typesSel?.includes(s1)) {
        isRequired = true;
        return true;
      }
    });
    m1.optionalForType?.some((s1) => {
      if (typesSel?.includes(s1)) {
        isOptional = true;
        return true;
      }
    });

    let isHidden = isRequired == null && isOptional == null;

    if (m1.forDocStoreTypes != null) {
      if (docStoreDefForced != null) {
        if (!m1.forDocStoreTypes?.includes(docStoreDefForced?.type)) {
          isHidden = true;
        }
      } else {
        isHidden = true;
      }
    }

    if (m1.forIsTypes != null) {
      if (!m1.forIsTypes?.includes(isType)) {
        isHidden = true;
      }
    }

    if (!onlyCheckHidden) {
      m1.isHidden = isHidden;
      m1.isRequired = isRequired;
    }

    if (isHidden) {
      return null;
    } else {
      return m1;
    }
  };

  const calcTypesCustom = (fieldToBeTrue: string) => {
    if (!fieldToBeTrue) {
      return null;
    }

    let m1 = null;
    m1 = MappingsListTraining.find((m2) => m2?.[fieldToBeTrue] === true);
    if (m1 == null) {
      m1 = MappingsListPred.find((m2) => m2?.[fieldToBeTrue] === true);
    }
    if (m1 == null) {
      return null;
    }

    return calcTypes(m1, true);
  };

  const calcTypesCustomRes = (fieldToBeTrue: string) => {
    if (!fieldToBeTrue) {
      return null;
    }

    let m1 = null;
    m1 = MappingsListTraining.find((m2) => m2?.[fieldToBeTrue] === true);
    if (m1 == null) {
      m1 = MappingsListPred.find((m2) => m2?.[fieldToBeTrue] === true);
    }
    if (m1 == null) {
      return null;
    }

    return calcTypes(m1) == null ? null : m1;
  };

  const calcTypesDropdown = (isTrain) => {
    let m1 = null;
    if (isTrain) {
      m1 = MappingsListTraining.find((m2) => m2.isDropdown);
    } else {
      m1 = MappingsListPred.find((m2) => m2.isDropdown);
    }

    if (m1 == null) {
      return null;
    }

    return calcTypes(m1, true);
  };

  useEffect(() => {
    setMappingsTrain(
      MappingsListTraining.filter((m1) => !m1.isCustom)
        .map((m1) => calcTypes(m1))
        .filter((m1) => m1 != null),
    );
    setMappingsPred(
      MappingsListPred.filter((m1) => !m1.isCustom)
        .map((m1) => calcTypes(m1))
        .filter((m1) => m1 != null),
    );
  }, [typesSel, docStoreDefForced, isType]);

  // useEffect(() => {
  //   if(!projectUseCase) {
  //     setMappingsPred(null);
  //     setMappingsTrain(null);
  //     return;
  //   }
  //
  //   REClient_.client_().describeUseCaseRequirements(projectUseCase, (err, res) => {
  //     let p1 = res?.result?.find(r1 => r1.datasetType?.toUpperCase()==='PREDICTION_LOG');
  //     if(p1!=null) {
  //       p1 = p1?.allowedFeatureMappings;
  //       if(p1!=null) {
  //         let kk = ForcedKeys;
  //         let res = kk.map(k1 => ({ isMultiple: k1===PROTECTED_CLASS, isRequired: (p1[k1]?.isRequired===true) && !['PREDICTED_PROBABILITY'].includes(k1), featureMapping: k1, name: p1[k1]?.description+' ('+k1+')', }));
  //         // res.splice(2,0, ({ isMultiple: false, isRequired: true, featureMapping: 'PREDICTED_PROBABILITY', name: 'Model prediction probability for this prediction data. (PREDICTED_PROBABILITY)', }));
  //         setMappingsPred(res);
  //
  //         res = [];
  //         res.push(({ isMultiple: false, isRequired: false, featureMapping: 'TARGET', name: 'The Target Value of this Training Data (TARGET)', }));
  //         res.push(({ isMultiple: false, isRequired: false, featureMapping: 'PREDICTED_VALUE', name: 'The Predicted Value In This Feature Group (PREDICTED_VALUE)', }));
  //         setMappingsTrain(res);
  //         return;
  //       }
  //     }
  //     setMappingsPred(null);
  //     setMappingsTrain(null);
  //   });
  // }, [projectUseCase]);

  let popupContainerForMenu = useCallback((node) => document.getElementById('body2'), []);

  const optionsFieldsLast = useRef(null);
  const optionsFields = useMemo(() => {
    let res = predFGOne?.projectFeatureGroupSchema?.schema?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
      res.unshift({ label: '(None)', value: null });
    }

    if (optionsFieldsLast.current == null || !_.isEqual(optionsFieldsLast.current, res)) {
      optionsFieldsLast.current = res;
    } else {
      res = optionsFieldsLast.current;
    }

    return res;
  }, [predFGOne]);
  const optionsFieldsImages = useMemo(() => {
    if (optionsFields == null) {
      return optionsFields;
    }

    return optionsFields?.filter((o1) => o1?.data?.featureMapping?.toUpperCase() === 'IMAGE');
  }, [optionsFields]);

  const optionsFieldsLastTrain = useRef(null);
  const optionsFieldsTrain = useMemo(() => {
    let res = trainFGOne?.projectFeatureGroupSchema?.schema?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
      res.unshift({ label: '(None)', value: null });
    }

    if (optionsFieldsLastTrain.current == null || !_.isEqual(optionsFieldsLastTrain.current, res)) {
      optionsFieldsLastTrain.current = res;
    } else {
      res = optionsFieldsLastTrain.current;
    }

    return res;
  }, [trainFGOne]);

  const optionsFieldsImagesTrain = useMemo(() => {
    if (optionsFieldsTrain == null) {
      return optionsFieldsTrain;
    }

    return optionsFieldsTrain?.filter((o1) => o1?.data?.featureMapping?.toUpperCase() === 'IMAGE');
  }, [optionsFieldsTrain]);

  const predFGid = form?.getFieldValue('predFG')?.value;
  const colActual = form?.getFieldValue('bias_ACTUAL')?.value;

  const [topValuesActual, setTopValuesActual] = useState(null);

  useEffect(() => {
    if (projectId && predFGid && colActual) {
      REClient_.client_()._getFeatureGroupColumnTopValues(projectId, predFGid, colActual, (err, res) => {
        if (err || !res?.success) {
          //
        } else {
          setTopValuesActual(res?.result?.topValues);
          form?.setFieldsValue({ biasFavorableOutcome: null });
          form?.setFieldsValue({ predictedClass: null });
        }
      });
    } else {
      setTopValuesActual(null);
    }
  }, [projectId, predFGid, colActual]);

  useEffect(() => {
    if (predFGOne != null) {
      let vv: any;
      predFGOne?.projectFeatureGroupSchema?.schema?.some((f1) => {
        let map1 = f1?.featureMapping?.toUpperCase();
        if (ForcedKeys.includes(map1)) {
          if (vv?.['bias_' + map1] == null || map1 === 'PROTECTED_CLASS') {
            vv = vv ?? {};

            let v1 = optionsFields?.find((o1) => o1.value === f1.name);
            if (map1 === 'PROTECTED_CLASS') {
              v1 = f1.name;

              if (vv['bias_' + map1] == null) {
                v1 = [v1];
              } else {
                v1 = [...(vv['bias_' + map1] ?? []), v1];
              }
            }

            vv['bias_' + map1] = v1;

            if (map1 === 'ACTUAL') {
              REClient_.client_()._getFeatureGroupColumnTopValues(projectId, predFeatureGroupId, v1, (err, res) => {
                if (err || !res?.success) {
                  //
                } else {
                  setTopValuesActual(res?.result?.topValues);
                  form?.setFieldsValue({ biasFavorableOutcome: null });
                  form?.setFieldsValue({ predictedClass: null });
                }
              });
            }
          }
        }
      });

      if (vv != null) {
        form?.setFieldsValue(vv);
      }
    }
  }, [predFGOne, optionsFields]);

  useEffect(() => {
    if (trainFGOne != null) {
      let vv: any;
      trainFGOne?.projectFeatureGroupSchema?.schema?.some((f1) => {
        let map1 = f1?.featureMapping?.toUpperCase();
        if (ForcedKeysTrain.includes(map1)) {
          if (vv?.['train_' + map1] == null) {
            vv = vv ?? {};

            let v1 = optionsFieldsTrain?.find((o1) => o1.value === f1.name);
            vv['train_' + map1] = v1;
          }
        }
      });

      if (vv != null) {
        form?.setFieldsValue(vv);
      }
    }
  }, [trainFGOne, optionsFieldsTrain]);

  const optionsTopValuesActual = useMemo(() => {
    return topValuesActual?.map((s1) => ({ label: s1, value: s1 }));
  }, [topValuesActual]);

  const typesElem = useMemo(() => {
    let res = [];
    MonitorsTypesList.some((t1, t1ind) => {
      if (typesHide != null && typesHide?.includes(t1.value)) {
        return;
      }

      res.push(
        <div key={'tt' + t1ind}>
          <Checkbox
            checked={typesSel?.includes(t1.value)}
            onChange={(e) => {
              setTypesSel((tt) => {
                tt ??= [];

                let v1 = t1.value;

                if (e.target.checked) {
                  if (!tt.includes(v1)) {
                    tt.push(v1);
                    tt = [...tt];
                  }
                } else {
                  tt = tt.filter((v2) => v2 !== v1);
                }

                return tt;
              });
            }}
          >
            <span
              css={`
                color: white;
              `}
            >
              {t1.name}
            </span>
          </Checkbox>
        </div>,
      );
    });
    if (typesSel?.includes('performance')) {
      REActions.addNotification('To select a Target Class, ensure that your Feature Group is materialized');
    }
    return res;
  }, [typesSel, typesHide]);

  const onChangeIsType = (e) => {
    let v1 = e.target.value;
    setIsType(v1);

    setIsFGDrift(v1 === EIsType.FG);
  };

  const onChangeIsMultipleFGDrift = (e) => {
    setIsMultipleFGDrift(e.target.value);
  };

  const cbForceUpdate = useCallback((e) => {
    forceUpdate();
  }, []);

  //
  // if(foundProject1!=null && foundProject1?.isDrift!==true && !['PREDICTING'].includes(foundProject1?.useCase?.toUpperCase())) {
  //   return <RefreshAndProgress msgMsg={'Project is not Custom Drift'}></RefreshAndProgress>;
  // }

  const getValueFromEvent = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  return (
    <div style={{ margin: '30px auto', maxWidth: '80%', width: '1200px', color: Utils.colorA(1) }}>
      <div
        css={`
          text-align: center;
          max-width: 260px;
          margin: 0 auto 30px auto;
        `}
      >
        <div>{<HelpBox name={'Monitoring'} beforeText={''} linkTo={'/help/modelMonitoring/creating_monitor'} />}</div>
      </div>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
        {/*// @ts-ignore*/}
        <Spin spinning={isProcessing} size={'large'}>
          <FormExt
            layout={'vertical'}
            form={form}
            onFinish={handleSubmit}
            onValuesChange={onChangeForm}
            initialValues={{
              fgDriftVersion: 2,
              selection_strategy: SPECIFIC_VERSION,
              isFGDrift: false,
              isType: EIsType.Normal,
            }}
          >
            <div
              css={`
                margin: 5px 0 20px;
                font-size: 20px;
                color: white;
              `}
            >
              <div
                css={`
                  margin-bottom: 24px;
                  text-align: center;
                `}
              >
                Create {foundProject1?.isDrift ? 'Drift ' : ''}Monitor
              </div>

              <Form.Item name={'name'} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Monitor Name:</span>}>
                <Input autoComplete={'off'} placeholder={''} />
              </Form.Item>

              {
                <Form.Item
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Drift:
                      <HelpIcon id={'monitor_create_drift'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Radio.Group value={isType} onChange={onChangeIsType}>
                    <Radio value={EIsType.Normal}>
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Model Monitor
                      </span>
                    </Radio>
                    <Radio value={EIsType.FG}>
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Feature Group Monitor
                      </span>
                    </Radio>
                    <Radio value={EIsType.Vision}>
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Vision Monitor
                      </span>
                    </Radio>
                    {projectUseCase === 'FEATURE_DRIFT' && (
                      <Radio value={EIsType.NLP}>
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          NLP Monitor
                        </span>
                      </Radio>
                    )}
                  </Radio.Group>
                </Form.Item>
              }

              {!isFGDrift && (
                <Form.Item
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Monitor Types:
                      <HelpIcon id={'monitor_create_monitor_types'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <div
                    css={`
                      display: grid;
                      grid-template-columns: repeat(2, 1fr);
                      width: 400px;
                    `}
                  >
                    {typesElem}
                  </div>
                </Form.Item>
              )}

              {isFGDrift && (
                <div
                  css={`
                    margin: 15px 0;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                    overflow: hidden;
                  `}
                >
                  <div
                    css={`
                      margin: 15px;
                    `}
                  >
                    <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Drift:</span>}>
                      <Radio.Group value={isMultipleFGDrift} onChange={onChangeIsMultipleFGDrift}>
                        <Radio value={false}>
                          <span
                            css={`
                              color: white;
                            `}
                          >
                            1 Feature Group
                          </span>
                        </Radio>
                        <Radio value={true}>
                          <span
                            css={`
                              color: white;
                            `}
                          >
                            Multiple Feature Groups
                          </span>
                        </Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </div>
              )}

              {calcTypesDropdown(true) != null && (
                <div
                  css={`
                    margin: 15px 0;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                    overflow: hidden;
                  `}
                >
                  {!isFGDrift && (
                    <div
                      css={`
                        cursor: pointer;
                        background: rgba(255, 255, 255, 0.2);
                        font-size: 15px;
                        padding: 4px 10px 6px;
                        display: flex;
                        align-items: center;
                      `}
                    >
                      <span
                        css={`
                          margin-left: 2px;
                        `}
                      >
                        Training
                        <HelpIcon id={'monitor_training_feature_group'} style={{ marginLeft: '4px' }} />
                      </span>
                    </div>
                  )}

                  <div
                    css={`
                      margin: 15px;
                    `}
                  >
                    <Form.Item
                      name={'trainFG'}
                      rules={[{ required: true, message: 'Required!' }]}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {isFGDrift ? 'Reference Feature Group' : 'Training Data Feature Group'}:<HelpIcon id={'monitor_base_feature_group'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <SelectExt options={isFGDrift ? optionsFGall : optionsFGtrain} onChange={cbForceUpdate} />
                    </Form.Item>

                    {isFGDrift && (
                      <Form.Item
                        name={'baseVersion'}
                        rules={[{ required: true, message: 'Required!' }]}
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            {!isMultipleFGDrift ? 'Reference Version:' : 'Version Number:'}
                            <HelpIcon id={'monitor_feature_group_version'} style={{ marginLeft: '4px' }} />
                          </span>
                        }
                      >
                        <SelectExt options={optionsFGVersionsTrainBase} />
                      </Form.Item>
                    )}

                    {isFGDrift && !isMultipleFGDrift && (
                      <Form.Item
                        name={'comparisonVersion'}
                        rules={[{ required: true, message: 'Required!' }]}
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            {'Test Version:'}
                            <HelpIcon id={'monitor_comparison_version'} style={{ marginLeft: '4px' }} />
                          </span>
                        }
                      >
                        <SelectExt options={optionsFGVersionsTrainComparison} />
                      </Form.Item>
                    )}

                    {!isFGDrift &&
                      mappingsTrain?.map((r1, r1ind) => {
                        if (r1.isHidden) {
                          return null;
                        } else if (r1.isMultiple) {
                          return (
                            <Form.Item
                              key={'train' + r1.featureMapping + '_' + r1ind}
                              rules={r1.isRequired ? [{ required: true, message: 'Required!' }] : undefined}
                              name={'train_' + r1.featureMapping}
                              label={
                                <span style={{ color: Utils.colorA(1) }}>
                                  {r1.name} <HelpIcon id={r1.helpId} style={{ marginLeft: '4px' }} />
                                </span>
                              }
                            >
                              <TagsSelectExt addName={'Add'} options={optionsFieldsTrain ?? Utils.emptyStaticArray()} />
                            </Form.Item>
                          );
                        } else {
                          let oo = r1.isImage ? optionsFieldsImagesTrain : optionsFieldsTrain;
                          const isEmptyImageOptions = r1.isImage && (optionsFieldsImagesTrain ?? []).length === 0;
                          const message = isEmptyImageOptions ? 'You must map IMAGE in the Features tab under Feature Groups to select from this dropdown.' : 'Required!';

                          return (
                            <Form.Item
                              key={'train' + r1.featureMapping + '_' + r1ind}
                              rules={r1.isRequired ? [{ required: true, message }] : undefined}
                              name={'train_' + r1.featureMapping}
                              label={
                                <span style={{ color: Utils.colorA(1) }}>
                                  {r1.name} <HelpIcon id={r1.helpId} style={{ marginLeft: '4px' }} />
                                </span>
                              }
                            >
                              <SelectExt options={oo ?? Utils.emptyStaticArray()} menuPortalTarget={popupContainerForMenu(null)} />
                            </Form.Item>
                          );
                        }
                      })}
                  </div>
                </div>
              )}

              {calcTypesDropdown(false) != null && (
                <div
                  css={`
                    margin: 15px 0;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                    overflow: hidden;
                  `}
                >
                  {!isFGDrift && (
                    <div
                      css={`
                        cursor: pointer;
                        background: rgba(255, 255, 255, 0.2);
                        font-size: 15px;
                        padding: 4px 10px 6px;
                        display: flex;
                        align-items: center;
                      `}
                    >
                      <span
                        css={`
                          margin-left: 2px;
                        `}
                      >
                        Prediction
                        <HelpIcon id={'monitor_predicting_feature_group'} style={{ marginLeft: '4px' }} />
                      </span>
                    </div>
                  )}
                  {(!isFGDrift || isMultipleFGDrift) && (
                    <div
                      css={`
                        margin: 15px;
                      `}
                    >
                      <Form.Item
                        name={'predFG'}
                        rules={[{ required: true, message: 'Required!' }]}
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            {isFGDrift ? 'Feature Group For Test' : 'Prediction Data Feature Group'}:<HelpIcon id={'monitor_fg_for_comparison'} />
                          </span>
                        }
                      >
                        <SelectExt options={isFGDrift ? optionsFGall : optionsFGpred} onChange={cbForceUpdate} />
                      </Form.Item>

                      {isFGDrift && (
                        <Form.Item
                          name={'comparisonVersion'}
                          rules={[{ required: true, message: 'Required!' }]}
                          label={
                            <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                              Version Number:
                              <HelpIcon id={'monitor_feature_group_version'} style={{ marginLeft: '4px' }} />
                            </span>
                          }
                        >
                          <SelectExt options={optionsFGVersionsPred} />
                        </Form.Item>
                      )}

                      {!isFGDrift &&
                        mappingsPred?.map((r1, r1ind) => {
                          if (r1.isHidden) {
                            return null;

                            // } else if(r1.isImage) {
                            //   return <Form.Item getValueFromEvent={getValueFromEvent} key={'bias'+r1.featureMapping+'_'+r1ind} rules={r1.isRequired ? [{ required: true, message: 'Required!' }] : undefined} name={'bias_'+r1.featureMapping} label={<span style={{ color: Utils.colorA(1), }}>{r1.name}</span>}>
                            //     <Upload listType="picture" maxCount={1} beforeUpload={e => { return false; }}>
                            //       <Button icon={<UploadOutlined />}>Select Image</Button>
                            //     </Upload>
                            //   </Form.Item>;
                          } else if (r1.isMultiple) {
                            return (
                              <Form.Item
                                key={'bias' + r1.featureMapping + '_' + r1ind}
                                rules={r1.isRequired ? [{ required: true, message: 'Required!' }] : undefined}
                                name={'bias_' + r1.featureMapping}
                                label={
                                  <span style={{ color: Utils.colorA(1) }}>
                                    {r1.name} <HelpIcon id={r1.helpId} style={{ marginLeft: '4px' }} />
                                  </span>
                                }
                              >
                                <TagsSelectExt addName={'Add'} options={optionsFields ?? Utils.emptyStaticArray()} />
                              </Form.Item>
                            );
                          } else if (r1.isColumnValueOption) {
                            return (
                              <Form.Item
                                key={r1.name + '_value_option'}
                                name={r1.fieldName}
                                rules={r1.isRequired ? [{ required: true, message: 'Required!' }] : undefined}
                                label={
                                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                    {r1.name} <HelpIcon id={r1.helpId} style={{ marginLeft: '4px' }} />
                                  </span>
                                }
                              >
                                <SelectExt options={optionsTopValuesActual} />
                              </Form.Item>
                            );
                          } else {
                            let oo = r1.isImage ? optionsFieldsImages : optionsFields;
                            const isEmptyImageOptions = r1.isImage && (optionsFieldsImages ?? []).length === 0;
                            const message = isEmptyImageOptions ? 'You must map IMAGE in the Features tab under Feature Groups to select from this dropdown.' : 'Required!';

                            return (
                              <Form.Item
                                key={'bias' + r1.featureMapping + '_' + r1ind}
                                rules={r1.isRequired ? [{ required: true, message }] : undefined}
                                name={'bias_' + r1.featureMapping}
                                label={
                                  <span style={{ color: Utils.colorA(1) }}>
                                    {r1.name} <HelpIcon id={r1.helpId} style={{ marginLeft: '4px' }} />
                                  </span>
                                }
                              >
                                <SelectExt options={oo ?? Utils.emptyStaticArray()} menuPortalTarget={popupContainerForMenu(null)} />
                              </Form.Item>
                            );
                          }
                        })}
                    </div>
                  )}
                </div>
              )}

              {!isFGDrift && isType !== EIsType.Vision && isType !== EIsType.NLP && calcTypesCustom('isModelId') != null && (
                <Row style={{ width: '100%' }}>
                  <Col style={{ width: '50%', paddingRight: '5px' }}>
                    <Form.Item
                      name={'modelIdprojectId'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Project:
                          <HelpIcon id={'monitor_model_project'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <SelectExt
                        options={optionsProjects}
                        onChange={(o1) => {
                          forceUpdate();
                          form?.setFieldsValue({ modelId: null });
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col style={{ width: '50%', paddingLeft: '5px' }}>
                    <Form.Item
                      name={'modelId'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Model:
                          <HelpIcon id={'monitor_model'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <SelectExt
                        options={optionsModelIds}
                        onChange={(o1) => {
                          forceUpdate();
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </div>

            <InputCron onChange={onChangeCronValue} style={{ marginTop: '10px' }} />

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <Button disabled={typesSel?.length === 0 || typesSel == null} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                {editModelId ? 'Save' : 'Create'}
              </Button>
            </div>
          </FormExt>
        </Spin>
      </Card>
    </div>
  );
});

export default ModelCreateMonitoringNew;
