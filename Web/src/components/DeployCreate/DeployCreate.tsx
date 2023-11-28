import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Collapse from 'antd/lib/collapse';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Radio from 'antd/lib/radio';
import Spin from 'antd/lib/spin';
import Checkbox from 'antd/lib/checkbox';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcDefaultDeploymentName } from '../../stores/reducers/defaultDeploymentName';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import models, { calcModelListByProjectId, ModelLifecycle } from '../../stores/reducers/models';
import { memProjectById } from '../../stores/reducers/projects';
import AutoLinkString from '../AutoLinkString/AutoLinkString';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import InputCron from '../InputCron/InputCron';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./DeployCreate.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

export enum EDeployType {
  Batch,
  RealTime,
}

interface IDeployCreateProps {
  paramsProp?: any;
  defaultDeploymentName?: any;
  deployments?: any;
  projects?: any;
  models?: any;
  featureGroups?: any;

  isFeatureGroup?: boolean;
  isForm?: boolean;
}

interface IDeployCreateState {
  useTypeSel?: EDeployType;
  isProcessing?: boolean;
  callsPerSecond?: number;
  errorMsgBottom?: string;
  askOnlyType?: boolean;
  forceModelId?: string;
  isUseDefaultVersion?: boolean;
  isNonFiltered?: boolean;
  streamingFgSelected?: string;
  streamingFgColName?: string;
  createFeedbackStreamingFg?: boolean;
}

class DeployCreate extends React.PureComponent<IDeployCreateProps, IDeployCreateState> {
  private isM: boolean;
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isProcessing: false,
      useTypeSel: EDeployType.RealTime,
      askOnlyType: true,
      isNonFiltered: true,
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

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let editDeployId = this.calcEditDeployId();

    const projectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let modelsList = this.memModelList(true)(this.props.models, projectId);
    let modelId = this.props.paramsProp?.get('modelId');
    this.memDefaultDeploymentNameModel(true)(modelId);
    let deploymentDefaultName = this.memDeploymentDefaultName(true)(this.props.defaultDeploymentName, modelId);

    let modelIdForVersion = this.calcModelIdSmart();

    let modelOne = this.memModelOne(true)(this.props.models, modelIdForVersion);
    let deployOne = this.memDeployOne(true)(this.props.deployments, projectId, editDeployId);

    let modelVersions = this.memModelVersions(true)(this.props.models, modelIdForVersion);
    let featureGroupsList = this.memFeatureGroups(true)(this.props.featureGroups, projectId);
  };

  componentDidUpdate(prevProps: Readonly<IDeployCreateProps>, prevState: Readonly<IDeployCreateState>, snapshot?: any): void {
    this.doMem();
  }

  componentDidMount() {
    this.isM = true;

    this.doMem(false);

    REClient_.client_()._getDefaultQps((err, res) => {
      this.setState({
        callsPerSecond: res?.result || 5,
      });
    });
  }

  componentWillUnmount() {
    this.isM = false;
  }

  onClickType = (typeSel: EDeployType) => {
    this.setState({
      useTypeSel: typeSel,
    });
  };

  memDefaultDeploymentNameModel = memoizeOneCurry((doCall, modelId) => {
    if (modelId) {
      if (doCall) {
        StoreActions.getDefaultDeploymentName_(modelId);
      }
    }
  });

  memDeploymentDefaultName = memoizeOneCurry((doCall, deploymentNameParam, modelId) => {
    if (deploymentNameParam && modelId) {
      let res = calcDefaultDeploymentName(undefined, modelId);
      if (res != null) {
        return res;
      } else {
        if (deploymentNameParam.get('isRefreshing')) {
          return null;
        } else {
          if (doCall) {
            StoreActions.getDefaultDeploymentName_(modelId);
          }
        }
      }
    }
  });

  onClickNext = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({
      askOnlyType: false,
    });
  };

  formGoBack = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({
      askOnlyType: true,
    });
  };

  handleSubmit = (values) => {
    let editDeployId = this.calcEditDeployId();

    //
    if (this.state.askOnlyType && editDeployId == null) {
      this.setState({
        askOnlyType: false,
      });
      return;
    }

    let { paramsProp } = this.props;
    if (!paramsProp) {
      return;
    }

    this.setState({
      errorMsgBottom: null,
    });

    let projectId = paramsProp && paramsProp.get('projectId');
    let modelId = paramsProp && paramsProp.get('modelId');

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    const isPnp = foundProject1?.isPnp ?? false;

    if (this.props.isForm && !modelId) {
      modelId = values.model?.value;
    }

    let featureGroupId = paramsProp && paramsProp.get('featureGroupId');

    if (this.props.isForm && !featureGroupId) {
      featureGroupId = values.fg?.value;
    }

    if (!projectId || (!modelId && !featureGroupId)) {
      REActions.addNotificationError('Error missing parameters');
      return;
    }

    this.setState({
      isProcessing: true,
    });

    let isRealTime = this.state.useTypeSel === EDeployType.RealTime;
    let callsPerSecond = values.callsPerSecond || 5;
    let name1 = values.name;
    if (name1 === '') {
      name1 = null;
    }
    let createFeedbackStreamingFg = this.state.createFeedbackStreamingFg === true;
    let { isUseDefaultVersion, isDefaultVersionDisabled } = this.calcIsUseDefaultVersion();
    let currentProject = this.memProjectId(false)(projectId, this.props.projects);
    let isChatLLM = currentProject?.useCase === 'CHAT_LLM';

    let useModelVersion = isUseDefaultVersion ? undefined : values.version?.value;
    let useModelAlgo = isUseDefaultVersion ? undefined : values.algorithm?.value;
    let useModelAlgoFiltered = isUseDefaultVersion ? undefined : values.algorithmFiltered?.value;
    let useAdditionalModelName = isUseDefaultVersion ? undefined : isChatLLM ? values.algorithm?.label : undefined;
    let useStreamingFg = this.state.streamingFgSelected;
    let trainedModelType = isUseDefaultVersion ? undefined : values.trainedModelType?.value;
    let streamingFgAssignmentValueCol = useStreamingFg ? this.state.streamingFgColName : undefined;
    var streamingFgDataUses;
    if (streamingFgAssignmentValueCol) {
      streamingFgDataUses = [
        {
          column_name: streamingFgAssignmentValueCol,
          column_data_use: 'ASSIGNMENT_VALUE',
        },
      ];
    }

    if (isPnp) {
      useModelAlgo = undefined;
      useModelAlgoFiltered = undefined;
      useStreamingFg = undefined;
      streamingFgDataUses = undefined;
      trainedModelType = undefined;
    }

    let autoDeploy;
    if (!Utils.isNullOrEmpty(useModelVersion) || !Utils.isNullOrEmpty(useModelAlgo) || !Utils.isNullOrEmpty(useModelAlgoFiltered)) {
      autoDeploy = false;
    }
    let deployOne = this.memDeployOne(false)(this.props.deployments, projectId, editDeployId);

    const cb1 = (err1, res) => {
      this.setState({
        isProcessing: false,
      });

      const specialErrorField = 'errorSpecial';
      if (res?.[specialErrorField] != null) {
        REActions.addNotificationError(Utils.removeTags(res?.[specialErrorField]));

        this.setState({
          errorMsgBottom: res?.[specialErrorField],
        });
      } else if (err1) {
        REActions.addNotificationError(err1);
      } else if (!res) {
        REActions.addNotificationError(`Error ${editDeployId == null ? 'deploying model' : 'updating deployment'}!`);
      } else {
        let deploymentId = res?.result?.deploymentId ?? editDeployId;
        const dd = deploymentId ? 'modalDeployRefresh=' + deploymentId : undefined;

        const cleanup = () => {
          if (editDeployId) {
            let modelIdParam = this.props.paramsProp?.get('modelId');
            // let modelIdForVersion = this.calcModelIdSmart();

            StoreActions.getModelDetail_(modelIdParam);
            StoreActions.modelsVersionsByModelId_(modelIdParam);

            StoreActions.getModelDetail_(modelId);
            StoreActions.modelsVersionsByModelId_(modelId);

            //
            StoreActions.listDeployVersions_(editDeployId);
            StoreActions.getFieldValuesForDeploymentId_(editDeployId);
            StoreActions.listDeployVersionsHistory_(editDeployId);

            REClient_.client_().setAutoDeployment(editDeployId, false, (err, res) => {
              if (!err && res?.success && deployOne?.autoDeploy) {
                REActions.addNotification('Turned off auto-deploy due to updating to a specific version' + (isPnp ? '' : '/algorithm'));
              }
            });
          }

          StoreActions.listModels_(projectId);

          StoreActions.deployList_(projectId);
          StoreActions.deployTokensList_(projectId);
          StoreActions.deployList_(projectId);

          if (!Utils.isNullOrEmpty(deploymentId)) {
            Location.push('/' + PartsLink.deploy_detail + '/' + (projectId ?? '-') + '/' + deploymentId, undefined, dd);
          } else {
            if (this.props.isFeatureGroup || !modelId) {
              Location.push('/' + PartsLink.deploy_list + '/' + projectId, undefined, dd);
            } else {
              Location.push('/' + PartsLink.deploy_list + '/' + modelId + '/' + projectId, undefined, dd);
            }
          }
        };

        const refreshSchedule = _.trim(values?.refreshSchedule);
        if (refreshSchedule) {
          const deploymentIds = deploymentId ? [deploymentId] : null;
          REClient_.client_().createRefreshPolicy(values?.name, refreshSchedule, 'deployment', projectId, null, featureGroupId, null, deploymentIds, null, null, null, null, null, (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err);
            }
            cleanup();
          });
        } else {
          cleanup();
        }
      }
    };

    if (editDeployId) {
      REClient_.client_().setDeploymentModelVersion(editDeployId, useModelVersion, useModelAlgo, useModelAlgoFiltered, trainedModelType, cb1);
    } else {
      REClient_.client_().createDeployment(
        projectId,
        autoDeploy,
        modelId,
        useModelVersion || undefined,
        useModelAlgo,
        useModelAlgoFiltered,
        useAdditionalModelName,
        featureGroupId,
        name1,
        values.description,
        callsPerSecond,
        isRealTime,
        useStreamingFg,
        streamingFgDataUses,
        trainedModelType,
        createFeedbackStreamingFg,
        cb1,
      );
    }
  };

  memOptionsModels = memoizeOne((modelsList, forceModelId) => {
    let res = modelsList
      ?.toJS()
      ?.filter((m1) => {
        return /*m1?.latestModelVersion?.automlComplete===true &&*/ [ModelLifecycle.COMPLETE].includes(m1?.latestModelVersion?.status) || (forceModelId && forceModelId === m1?.modelId) || m1?.hasTrainedVersion === true;
      })
      ?.map((m1) => ({ label: m1?.name + ' - ' + m1?.modelId, value: m1?.modelId, data: m1 }))
      ?.sort((a, b) => {
        return (a?.label || '').toLowerCase().localeCompare((b?.label || '').toLowerCase());
      });
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  });

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

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memFeatureGroups = memoizeOneCurry((doCall?: boolean, featureGroupsParam?: any, projectId?: any) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

  memOptionsFGsBatch = memoizeOne((featureGroupsList) => {
    return featureGroupsList?.filter((f1) => !f1?.streamingEnabled)?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId }));
  });

  memOptionsFGsStreaming = memoizeOne((featureGroupsList) => {
    let res = featureGroupsList?.filter((f1) => f1?.streamingEnabled)?.map((f1) => ({ label: f1.tableName, value: f1.tableName }));
    if (res?.length > 0) {
      res.unshift({ label: '(None)', value: null });
    }
    return res;
  });

  memOptionsFGs = memoizeOne((featureGroupsList) => {
    return featureGroupsList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId }));
  });

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

  memModelVersions = memoizeOneCurry((doCall, modelsParam, modelId) => {
    let res = models.memModelVersionsByModelId(doCall, undefined, modelId);
    if (res != null) {
      res = res.filter((r1) => !Utils.isNullOrEmpty(r1?.trainingCompletedAt));
      res = _.reverse(_.sortBy(res, 'trainingCompletedAt'));
    }
    return res;
  });

  memModelOne = memoizeOneCurry((doCall, modelsParam, modelId) => {
    return models.memModelById(doCall, undefined, modelId);
  });

  memOptionsModelVersions = memoizeOne((modelVersions) => {
    let res = modelVersions
      ?.filter((mv1) => {
        return mv1?.deployableAlgorithms != null && mv1?.deployableAlgorithms?.length > 0 && mv1?.status === ModelLifecycle.COMPLETE;
      })
      .map((mv1) => {
        let s1 = '';
        if (!Utils.isNullOrEmpty(mv1?.trainingCompletedAt)) {
          s1 = ' - ' + moment(mv1?.trainingCompletedAt).format('LLL');
        }

        return { label: mv1?.modelVersion + s1, value: mv1?.modelVersion, data: mv1, sort1: mv1?.trainingCompletedAt || '' };
      });

    if (res != null) {
      res = _.reverse(_.sortBy(res, 'sort1'));
    }

    return res;
  });

  memOptionsModelVersionsAlgorithmsFiltered = memoizeOne((deployableAlgorithmsParam) => {
    let deployableAlgorithms: { name?; algorithm? }[] = deployableAlgorithmsParam;
    let res = deployableAlgorithms?.map((a1) => ({ label: a1.name, value: a1.algorithm }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  });

  memOptionsModelVersionsAlgorithms = memoizeOne((modelVersionOne) => {
    if (!modelVersionOne) {
      return null;
    }

    let deployableAlgorithms: { name?; algorithm? }[] = modelVersionOne?.deployableAlgorithms;
    let res = deployableAlgorithms?.map((a1) => ({ label: a1.name, value: a1.algorithm }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  });

  memOptionsModelVersionsTrainedModelTypes = memoizeOne((modelVersionOne) => {
    if (!modelVersionOne) {
      return null;
    }

    let trained_model_types: { label?; value? }[] = modelVersionOne?.trainedModelTypes;
    let res = trained_model_types?.map((a1) => ({ label: a1.label, value: a1.value }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  });

  onChangeModelForce = (o1) => {
    this.setState({
      forceModelId: o1?.value,
    });
  };

  memDefaultDeploy = memoizeOne((deployOne, formRef) => {
    if (!formRef || !deployOne) {
      return;
    }

    this.formRef?.current?.setFieldsValue({
      name: deployOne?.name ?? '',
    });
  });

  memDefaultModel = memoizeOne((optionsModels, formRef, modelId, force) => {
    if (!formRef || !optionsModels) {
      if (!force) {
        return;
      }
    }

    let m1 = optionsModels?.find((o1) => o1?.value === modelId);

    let forceNotUsed = Utils.isNullOrEmpty(this.state.forceModelId);
    if (!forceNotUsed) {
      if (optionsModels?.find((o1) => o1?.value === this.state.forceModelId) == null) {
        forceNotUsed = true;
      }
    }
    if (m1 == null && forceNotUsed) {
      let editDeployId = this.calcEditDeployId();
      if (editDeployId == null && Utils.isNullOrEmpty(this.calcModelIdSmart())) {
        let lastDT = null,
          lastM1 = null;
        optionsModels?.some((o1) => {
          let dt1 = o1?.data?.latestModelVersion?.trainingCompletedAt;
          if (!Utils.isNullOrEmpty(dt1)) {
            dt1 = moment(dt1);
            if (lastDT == null || dt1.isAfter(lastDT)) {
              lastDT = dt1;
              lastM1 = o1;
            }
          }
        });

        m1 = lastM1;
        if (m1 != null) {
          setTimeout(() => {
            this.setState({
              forceModelId: lastM1?.data?.modelId,
            });
          }, 0);
        }
      }
    }

    if (m1) {
      setTimeout(() => {
        this.formRef?.current?.setFieldsValue({
          model: m1,
        });
        this.forceUpdate();
      }, 0);
    }
  });

  memDefaultModelVersion = memoizeOne((optionsModelVersions, formRef) => {
    if (!formRef || !optionsModelVersions) {
      return;
    }

    const version1 = this.props.paramsProp?.get('version');

    let mv1 = version1 ? optionsModelVersions?.find((o1) => o1?.value === version1) : null;
    mv1 ??= optionsModelVersions?.[0];

    if (mv1) {
      let current1 = this.formRef?.current?.getFieldValue('version')?.value;
      if (current1 == mv1?.value) {
        return;
      }

      this.formRef?.current?.setFieldsValue({
        version: mv1,
      });
      this.forceUpdate();
    }
  });

  calcEditDeployId = () => {
    let editDeployId = this.props.paramsProp?.get('editDeployId');
    if (Utils.isNullOrEmpty(editDeployId)) {
      editDeployId = null;
    }
    return editDeployId;
  };

  calcModelIdSmart = () => {
    let modelId = this.props.paramsProp?.get('modelId');
    let editDeployId = this.calcEditDeployId();
    if (editDeployId != null) {
      return this.state.forceModelId || modelId;
    } else {
      return modelId || this.state.forceModelId;
    }
  };

  calcFilteredValuesLast = null;
  calcFilteredValues: () => { isUsed?: boolean; bestAlgorithm?; defaultAlgorithm?; deployableAlgorithms? } = () => {
    let modelId = this.props.paramsProp?.get('modelId');
    let modelIdForVersion = this.calcModelIdSmart();

    let modelOne = this.memModelOne(false)(this.props.models, modelIdForVersion)?.toJS();

    let dataClusterInfo = modelOne?.latestModelVersion?.dataClusterInfo?.find((c1) => c1?.id === 'filtered_out_items');

    let res = {};
    if (dataClusterInfo != null) {
      res = {
        isUsed: true,
        bestAlgorithm: dataClusterInfo?.bestAlgorithm,
        defaultAlgorithm: dataClusterInfo?.defaultAlgorithm,
        deployableAlgorithms: dataClusterInfo?.deployableAlgorithms,
      };
    }

    if (_.isEqual(res, this.calcFilteredValuesLast)) {
      res = this.calcFilteredValuesLast;
    }

    this.calcFilteredValuesLast = res;
    return res;
  };

  calcStreamingFgForInference: () => { isUsed?: boolean; streamingFgs? } = () => {
    let res = {};
    const projectId = this.props.paramsProp?.get('projectId');
    let currentProject = this.memProjectId(false)(projectId, this.props.projects);
    if (currentProject?.useCase === 'SCHEDULING') {
      let featureGroupsList = this.memFeatureGroups(false)(this.props.featureGroups, projectId);
      let streamingFeatureGroupsList = this.memOptionsFGsStreaming(featureGroupsList);
      if (streamingFeatureGroupsList && streamingFeatureGroupsList?.length) {
        res = {
          isUsed: true,
          streamingFgs: streamingFeatureGroupsList,
        };
      }
    }
    return res;
  };

  calcIsUseDefaultVersion = () => {
    let modelId = this.props.paramsProp?.get('modelId');
    let modelIdForVersion = this.calcModelIdSmart();

    let modelOne = this.memModelOne(false)(this.props.models, modelIdForVersion)?.toJS();

    let isAutoMLNeed = modelOne?.latestModelVersion?.automlComplete !== true && modelOne?.latestModelVersion?.status === ModelLifecycle.COMPLETE;

    const isDefaultVersionDisabled = !Utils.isNullOrEmpty(this.props.paramsProp?.get('version')) || isAutoMLNeed;
    let isUseDefaultVersion = (this.state.isUseDefaultVersion == null || !!this.state.isUseDefaultVersion) && !isDefaultVersionDisabled;
    return { isUseDefaultVersion, isDefaultVersionDisabled };
  };

  memDefaultModelAlgorithmFiltered = memoizeOne((optionsModelAlgorithmsFiltered, formRef, calcFilteredValues) => {
    if (!formRef || !optionsModelAlgorithmsFiltered || !calcFilteredValues) {
      return;
    }

    let deployableAlgorithms = calcFilteredValues?.deployableAlgorithms;

    const defaultAlgorithm = calcFilteredValues?.defaultAlgorithm;
    const bestAlgorithm = calcFilteredValues?.bestAlgorithm;
    let id1 = defaultAlgorithm?.algorithm || bestAlgorithm?.algorithm;

    let a1 = Utils.isNullOrEmpty(id1) ? null : deployableAlgorithms?.find((o1) => o1.algorithm === id1);
    if (a1 == null) {
      a1 = deployableAlgorithms?.[0];
    }

    let o1 = a1?.algorithm == null ? null : optionsModelAlgorithmsFiltered?.find((o1) => o1?.value === a1?.algorithm);

    if (o1 != null) {
      let current1 = this.formRef?.current?.getFieldValue('algorithmFiltered')?.value;
      if (current1 == o1?.value) {
        return;
      }

      this.formRef?.current?.setFieldsValue({
        algorithmFiltered: o1,
      });
      // this.forceUpdate();
    }
  });

  memDefaultModelAlgorithm = memoizeOne((optionsModelAlgorithm, formRef, modelVersionOne) => {
    if (!formRef || !optionsModelAlgorithm || !modelVersionOne) {
      return;
    }

    let deployableAlgorithms = modelVersionOne?.deployableAlgorithms;

    const defaultAlgorithm = modelVersionOne?.defaultAlgorithm;
    const bestAlgorithm = modelVersionOne?.bestAlgorithm;
    let id1 = defaultAlgorithm?.algorithm || bestAlgorithm?.algorithm;

    let a1 = Utils.isNullOrEmpty(id1) ? null : deployableAlgorithms?.find((o1) => o1.algorithm === id1);
    if (a1 == null) {
      a1 = deployableAlgorithms?.[0];
    }

    let o1 = a1?.algorithm == null ? null : optionsModelAlgorithm?.find((o1) => o1?.value === a1?.algorithm);

    if (o1 != null) {
      let current1 = this.formRef?.current?.getFieldValue('algorithm')?.value;
      if (current1 == o1?.value) {
        return;
      }

      this.formRef?.current?.setFieldsValue({
        algorithm: o1,
      });
      // this.forceUpdate();
    }
  });

  memDefaultModelTrainedModelTypes = memoizeOne((optionsTrainedModelTypes, formRef, modelVersionOne) => {
    if (!formRef || !optionsTrainedModelTypes || !modelVersionOne) {
      return;
    }

    let trainedModelTypes = modelVersionOne?.trainedModelTypes;
    let a1 = trainedModelTypes?.[0];
    let o1 = a1?.value == null ? null : trainedModelTypes?.find((o1) => o1?.value === a1?.value);

    if (o1 != null) {
      let current1 = this.formRef?.current?.getFieldValue('trainedModelType')?.value;
      if (current1 == o1?.value) {
        return;
      }
      this.formRef?.current?.setFieldsValue({
        trainedModelType: o1,
      });
    }
  });

  render() {
    const dummyRequest = ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess('ok');
      }, 0);
    };

    const styleRectType: CSSProperties = {
      position: 'relative',
      backgroundColor: '#19232f',
      padding: '10px',
      flex: 1,
      marginRight: '10px',
      color: 'white',
      lineHeight: '1.2rem',
      textAlign: 'center',
    };

    const projectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    const isAiAgent = foundProject1?.useCase === 'AI_AGENT';
    const isNlpChat = foundProject1?.useCase === 'NLP_CHAT';
    const isFeatureStore = foundProject1?.isFeatureStore === true;
    const isPnp = foundProject1?.isPnp ?? false;

    let modelsList = this.memModelList(false)(this.props.models, projectId);

    let featureGroupsList = this.memFeatureGroups(false)(this.props.featureGroups, projectId);
    const optionsFGs = this.memOptionsFGs(featureGroupsList);
    const optionsFGsBatch = this.memOptionsFGsBatch(featureGroupsList);

    let modelId = this.props.paramsProp?.get('modelId');
    let deploymentDefaultName = this.memDeploymentDefaultName(false)(this.props.defaultDeploymentName, modelId);

    let editDeployId = this.calcEditDeployId();

    const optionsModels = this.memOptionsModels(modelsList, modelId);

    let askOnlyType = this.state.askOnlyType === true && !editDeployId && !isAiAgent;
    let isBatchSelAndFS = false; //this.state.useTypeSel===EDeployType.Batch && isFeatureStore;

    let modelIdForVersion = this.calcModelIdSmart();

    let modelOne = this.memModelOne(false)(this.props.models, modelIdForVersion);

    let calcFilteredValues = this.calcFilteredValues();
    const isDataClusterUsed = calcFilteredValues?.isUsed === true;

    let calcStreamingFgForInference = this.calcStreamingFgForInference();
    let isStreamingFgSupportedForInference = calcStreamingFgForInference?.isUsed === true;
    let modelVersions = this.memModelVersions(false)(this.props.models, modelIdForVersion);
    let optionsModelVersions = this.memOptionsModelVersions(modelVersions);

    const version1 = this.formRef?.current?.getFieldValue('version')?.value;
    let modelVersionOne = version1 ? optionsModelVersions?.find((o1) => o1.value === version1)?.data : null;
    let optionsModelAlgorithms = this.memOptionsModelVersionsAlgorithms(modelVersionOne);
    let optionsModelAlgorithmsFiltered = this.memOptionsModelVersionsAlgorithmsFiltered(calcFilteredValues?.deployableAlgorithms);
    let optionsTrainedModelTypes = this.memOptionsModelVersionsTrainedModelTypes(modelVersionOne);
    let optionsFGsStreaming = this.memOptionsFGsStreaming(featureGroupsList);

    let deployOne = this.memDeployOne(false)(this.props.deployments, projectId, editDeployId);
    this.memDefaultDeploy(deployOne, this.formRef?.current);

    if (editDeployId == null || (editDeployId != null && deployOne != null)) {
      this.memDefaultModel(optionsModels, this.formRef?.current, modelIdForVersion, !this.props.isForm || editDeployId != null);
      this.memDefaultModelVersion(optionsModelVersions, this.formRef?.current);

      this.memDefaultModelAlgorithm(optionsModelAlgorithms, this.formRef?.current, modelVersionOne);
      this.memDefaultModelAlgorithmFiltered(optionsModelAlgorithmsFiltered, this.formRef?.current, calcFilteredValues);
      this.memDefaultModelTrainedModelTypes(optionsTrainedModelTypes, this.formRef?.current, modelVersionOne);
    }

    let { isUseDefaultVersion, isDefaultVersionDisabled } = this.calcIsUseDefaultVersion();

    return (
      <div style={{ margin: '30px auto', maxWidth: '600px', color: Utils.colorA(1) }}>
        <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
          {/*// @ts-ignore*/}
          <Spin spinning={this.state.isProcessing} size={'large'}>
            {this.state.callsPerSecond != null && (
              <FormExt
                layout={'vertical'}
                ref={this.formRef}
                onFinish={this.handleSubmit}
                className="login-form"
                initialValues={{
                  callsPerSecond: this.state.callsPerSecond,
                  name: '',
                }}
              >
                {editDeployId != null && (
                  <Form.Item
                    style={{ display: !askOnlyType ? 'block' : 'none' }}
                    name={'name'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Deployment Name:
                        <HelpIcon id={'deploy_create_name'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input
                      css={
                        editDeployId != null
                          ? `&.ant-input-affix-wrapper.ant-input-affix-wrapper {
                  background-color: #424242 !important;
                }`
                          : ''
                      }
                      placeholder={deploymentDefaultName}
                      disabled={editDeployId != null}
                    />
                  </Form.Item>
                )}

                {
                  /*this.props.isForm && */ !isFeatureStore && (
                    <Form.Item
                      rules={[{ required: true, message: 'Required!' }]}
                      style={{ display: !askOnlyType ? 'block' : 'none' }}
                      name={'model'}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {isAiAgent ? 'Agent:' : 'Model:'}
                          <HelpIcon id={'deploy_create_model'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <SelectExt options={optionsModels} onChange={this.onChangeModelForce} isDisabled={!this.props.isForm && !editDeployId} />
                    </Form.Item>
                  )
                }
                {!isAiAgent && !isFeatureStore && !editDeployId && (
                  <div
                    css={`
                      margin-bottom: 15px;
                    `}
                    style={{ display: !askOnlyType ? 'block' : 'none' }}
                  >
                    <Radio.Group
                      css={`
                        display: flex;
                        flex-direction: column;
                        gap: 7px;
                      `}
                      value={isUseDefaultVersion}
                      onChange={(e) => {
                        this.setState({ isUseDefaultVersion: e.target.value });
                      }}
                    >
                      <Radio
                        css={`
                          ${isDefaultVersionDisabled ? '& .ant-radio { opacity: 0.3; } ' : ''}
                        `}
                        value={true}
                        disabled={isDefaultVersionDisabled}
                      >
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          {isPnp ? 'Deploy latest version of the model' : isAiAgent ? 'Deploy latest version of the agent' : 'Deploy latest version(s) of the default winning model(s)'}
                        </span>
                      </Radio>
                      {isDefaultVersionDisabled && (
                        <div
                          css={`
                            font-size: 13px;
                            margin-left: 24px;
                            margin-bottom: 4px;
                            margin-top: -4px;
                            color: white;
                            opacity: 0.6;
                          `}
                        >
                          [Option is not available as model training is only partially complete]
                        </div>
                      )}
                      <Radio value={false}>
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Choose version{isPnp ? '' : '/algorithm/trained model type'}
                        </span>
                      </Radio>
                    </Radio.Group>
                  </div>
                )}
                {!isFeatureStore && (
                  <Form.Item
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ display: !askOnlyType && (!isUseDefaultVersion || editDeployId) ? 'block' : 'none' }}
                    name={'version'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        {isAiAgent ? 'Agent Version:' : 'Model Version:'}
                        <HelpIcon id={'deploy_create_model_version'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt
                      options={optionsModelVersions}
                      onChange={(o1) => {
                        setTimeout(() => {
                          this.forceUpdate();
                        }, 0);
                      }}
                    />
                  </Form.Item>
                )}

                {isDataClusterUsed && !isFeatureStore && !isPnp && (
                  <>
                    {/*// @ts-ignore*/}
                    <Collapse
                      defaultActiveKey={['nonFiltered']}
                      bordered={true}
                      style={{ backgroundColor: 'transparent', borderColor: '#23305e', color: 'white', marginTop: '10px', display: !askOnlyType && (!isUseDefaultVersion || editDeployId) ? 'block' : 'none' }}
                    >
                      {/*// @ts-ignore*/}
                      <Panel
                        header={'Forecastable'}
                        key={'nonFiltered'}
                        forceRender={true}
                        style={{ borderColor: '#23305e', backgroundColor: '#23305e', fontFamily: 'Roboto', fontSize: '12px', fontWeight: 500 }}
                        css={`
                          .ant-collapse-content.ant-collapse-content-active {
                            background-color: #20252c !important;
                            border-top-width: 0 !important;
                          }
                        `}
                      >
                        <Form.Item
                          rules={!askOnlyType && (!isUseDefaultVersion || editDeployId) ? [{ required: true, message: 'Required!' }] : undefined}
                          style={{ display: !askOnlyType && (!isUseDefaultVersion || editDeployId) ? 'block' : 'none' }}
                          name={'algorithm'}
                          hasFeedback
                          label={
                            <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                              Algorithm:
                              <HelpIcon id={'deploy_create_model_algorithm'} style={{ marginLeft: '4px' }} />
                            </span>
                          }
                        >
                          <SelectExt
                            options={optionsModelAlgorithms}
                            onChange={(o1) => {
                              setTimeout(() => {
                                this.forceUpdate();
                              }, 0);
                            }}
                          />
                        </Form.Item>
                      </Panel>
                    </Collapse>
                    {/*// @ts-ignore*/}
                    <Collapse
                      defaultActiveKey={['filtered']}
                      bordered={true}
                      style={{ backgroundColor: 'transparent', borderColor: '#23305e', color: 'white', marginTop: '10px', display: !askOnlyType && (!isUseDefaultVersion || editDeployId) ? 'block' : 'none' }}
                    >
                      {/*// @ts-ignore*/}
                      <Panel
                        header={'Filtered Out'}
                        key={'filtered'}
                        forceRender={true}
                        style={{ borderColor: '#23305e', backgroundColor: '#23305e', fontFamily: 'Roboto', fontSize: '12px', fontWeight: 500 }}
                        css={`
                          .ant-collapse-content.ant-collapse-content-active {
                            background-color: #20252c !important;
                            border-top-width: 0 !important;
                          }
                        `}
                      >
                        <Form.Item
                          rules={!askOnlyType && (!isUseDefaultVersion || editDeployId) ? [{ required: true, message: 'Required!' }] : undefined}
                          style={{ display: !askOnlyType && (!isUseDefaultVersion || editDeployId) ? 'block' : 'none' }}
                          name={'algorithmFiltered'}
                          hasFeedback
                          label={
                            <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                              Algorithm ( Filtered Out ):
                              <HelpIcon id={'deploy_create_model_algorithm_filtered'} style={{ marginLeft: '4px' }} />
                            </span>
                          }
                        >
                          <SelectExt
                            options={optionsModelAlgorithmsFiltered}
                            onChange={(o1) => {
                              setTimeout(() => {
                                this.forceUpdate();
                              }, 0);
                            }}
                          />
                        </Form.Item>
                      </Panel>
                    </Collapse>
                  </>
                )}
                {!isDataClusterUsed && !isFeatureStore && !isPnp && (
                  <Form.Item
                    rules={!askOnlyType && (!isUseDefaultVersion || editDeployId) ? [{ required: true, message: 'Required!' }] : undefined}
                    style={{ display: !askOnlyType && (!isUseDefaultVersion || editDeployId) ? 'block' : 'none' }}
                    name={'algorithm'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Algorithm:
                        <HelpIcon id={'deploy_create_model_algorithm'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt
                      options={optionsModelAlgorithms}
                      onChange={(o1) => {
                        setTimeout(() => {
                          this.forceUpdate();
                        }, 0);
                      }}
                    />
                  </Form.Item>
                )}
                {!isFeatureStore && !isPnp && optionsTrainedModelTypes?.length > 0 && (
                  <Form.Item
                    rules={!askOnlyType && (!isUseDefaultVersion || editDeployId) ? [{ required: true, message: 'Required!' }] : undefined}
                    style={{ display: !askOnlyType && (!isUseDefaultVersion || editDeployId) ? 'block' : 'none' }}
                    name={'trainedModelType'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Trained Model Type:
                        <HelpIcon id={'deploy_create_model_trained_model_type'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt
                      options={optionsTrainedModelTypes}
                      onChange={(o1) => {
                        setTimeout(() => {
                          this.forceUpdate();
                        }, 0);
                      }}
                    />
                  </Form.Item>
                )}
                {this.props.isForm && isFeatureStore && (
                  <Form.Item
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ display: !askOnlyType ? 'block' : 'none' }}
                    name={'fg'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Feature Group:
                        <HelpIcon id={'deploy_create_featuregroup'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt options={this.state.useTypeSel === EDeployType.Batch ? optionsFGsBatch : optionsFGs} />
                  </Form.Item>
                )}

                {!askOnlyType && this.props.isForm && (
                  <div
                    css={`
                      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                      margin-bottom: 20px;
                    `}
                  ></div>
                )}

                {editDeployId == null && (
                  <Form.Item
                    style={{ display: !askOnlyType ? 'block' : 'none' }}
                    name={'name'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Deployment Name:
                        <HelpIcon id={'deploy_create_name'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input
                      css={
                        editDeployId != null
                          ? `&.ant-input-affix-wrapper.ant-input-affix-wrapper {
                  background-color: #424242 !important;
                }`
                          : ''
                      }
                      placeholder={deploymentDefaultName}
                      disabled={editDeployId != null}
                    />
                  </Form.Item>
                )}

                {
                  <Form.Item
                    style={{ display: askOnlyType ? 'block' : 'none' }}
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Deployment Type:
                        <HelpIcon id={'deploy_create_batch_vs_realtime'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <div style={{ display: 'flex', flexFlow: 'nowrap row' }}>
                      <div style={styleRectType} className={s.rect1 + ' ' + sd.rectSel + ' ' + (this.state.useTypeSel === EDeployType.Batch ? sd.selected + ' ' + s.selected : '')} onClick={this.onClickType.bind(this, EDeployType.Batch)}>
                        <div className={s.checkSel}>
                          <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                        </div>
                        {isFeatureStore ? 'Batch Feature Store' : 'Offline Batch'}
                      </div>
                      <div
                        style={styleRectType}
                        className={s.rect1 + ' ' + sd.rectSel + ' ' + (this.state.useTypeSel === EDeployType.RealTime ? sd.selected + ' ' + s.selected : '')}
                        onClick={this.onClickType.bind(this, EDeployType.RealTime)}
                      >
                        <div className={s.checkSel}>
                          <FontAwesomeIcon icon={['fas', 'check']} transform={{ size: 11, x: 0, y: -1.5 }} style={{}} />
                        </div>
                        {isFeatureStore ? 'Real-time Feature Store' : 'Offline Batch + RealTime'}
                      </div>
                    </div>
                  </Form.Item>
                }

                {!isBatchSelAndFS && !editDeployId && this.state.useTypeSel === EDeployType.RealTime && (
                  <div>
                    <Form.Item
                      style={{ display: !askOnlyType ? 'block' : 'none' }}
                      rules={[{ required: this.state.useTypeSel === EDeployType.RealTime, message: 'Calls Per Second required!' }]}
                      name={'callsPerSecond'}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Estimated Number of Calls Per Second:
                          <HelpIcon id={'deploy_create_callsPerSecond'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <InputNumber min={1} max={10000000} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/(,*)/g, '') as any} step={10} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </div>
                )}

                {!isBatchSelAndFS && !editDeployId && this.state.useTypeSel === EDeployType.RealTime && isStreamingFgSupportedForInference && (
                  <div>
                    <Form.Item
                      style={{ display: !askOnlyType ? 'block' : 'none' }}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Streaming Feature Group:
                          <HelpIcon id={'deploy_create_streamingFGForInference'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <SelectExt
                        options={optionsFGsStreaming}
                        placeholder={undefined}
                        onChange={(e) => {
                          setTimeout(() => {
                            this.setState({ streamingFgSelected: e?.value });
                            this.forceUpdate();
                          }, 0);
                        }}
                      />
                    </Form.Item>
                    {/* Only for optimization problem type currently, will need to generalize it later */}
                    {this.state.streamingFgSelected && (
                      <Form.Item style={{ display: !askOnlyType ? 'block' : 'none' }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Assignment Value Column Name:</span>}>
                        <Input
                          placeholder={undefined}
                          onChange={(e) => {
                            setTimeout(() => {
                              this.setState({ streamingFgColName: e.target.value });
                            }, 0);
                          }}
                        />
                      </Form.Item>
                    )}
                  </div>
                )}
                {isNlpChat && !isBatchSelAndFS && !editDeployId && !askOnlyType && this.state.useTypeSel === EDeployType.RealTime && (
                  <div
                    css={`
                      margin-bottom: 10px;
                    `}
                  >
                    <Checkbox
                      checked={this.state.createFeedbackStreamingFg}
                      onChange={(e) => {
                        this.setState({ createFeedbackStreamingFg: e.target.checked });
                      }}
                      disabled={editDeployId != null}
                    >
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Create Chat Feedback Feature Group
                      </span>
                    </Checkbox>
                  </div>
                )}

                {!isBatchSelAndFS && !askOnlyType && !editDeployId && isFeatureStore && (
                  <div>
                    <InputCron />
                  </div>
                )}

                {/*{isBatchSelAndFS && <>*/}
                {/*  <DetailName>Feature Group Export Configuration:</DetailName>*/}
                {/*  <DetailValue>*/}
                {/*    <span>*/}
                {/*      <Radio.Group value={outputType ?? ''} onChange={onChangeOutputType}>*/}
                {/*        <Radio value={OutputTypeEnum.None}><span css={`color: white;`}>Deploy Only</span></Radio>*/}
                {/*        <Radio value={OutputTypeEnum.Storage}><span css={`color: white;`}>Export File Connector</span></Radio>*/}
                {/*        <Radio value={OutputTypeEnum.Connector}><span css={`color: white;`}>Export Database Connector</span></Radio>*/}
                {/*      </Radio.Group>*/}
                {/*    </span>*/}
                {/*  </DetailValue>*/}
                {/*</>}*/}

                <Form.Item style={{ marginBottom: '1px' }}>
                  <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '0 -22px' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    {!askOnlyType && editDeployId == null && !isAiAgent && (
                      <Button
                        css={`
                          margin-right: 10px;
                        `}
                        type={'default'}
                        ghost
                        onClick={this.formGoBack}
                      >
                        Back
                      </Button>
                    )}
                    <Button onClick={askOnlyType ? this.onClickNext : null} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                      {askOnlyType ? 'Next' : `${editDeployId == null ? 'Deploy' : 'Update Deployment'} ${editDeployId == null ? (isFeatureStore ? 'Feature Group' : isAiAgent ? 'Agent' : 'Model') : ''}`}
                    </Button>
                  </div>
                </Form.Item>
              </FormExt>
            )}
          </Spin>
        </Card>
        {this.state.errorMsgBottom != null && (
          <div
            css={`
              color: red;
              font-size: 14px;
              margin: 15px 20px 15px 20px;
              text-align: center;
            `}
          >
            <AutoLinkString>{this.state.errorMsgBottom}</AutoLinkString>
          </div>
        )}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    defaultDeploymentName: state.defaultDeploymentName,
    projects: state.projects,
    models: state.models,
    featureGroups: state.featureGroups,
    deployments: state.deployments,
  }),
  null,
)(DeployCreate);
