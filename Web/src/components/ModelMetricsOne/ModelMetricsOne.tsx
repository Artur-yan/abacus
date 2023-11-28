import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Alert from 'antd/lib/alert';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Modal from 'antd/lib/modal';
import Slider from 'antd/lib/slider';
import * as Immutable from 'immutable';
import $ from 'jquery';
import _ from 'lodash';
import * as React from 'react';
import { connect, Provider } from 'react-redux';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils, { ColorsGradients } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import datasetsReq, { calcDataset_datasetType, DatasetLifecycle } from '../../stores/reducers/datasets';
import { calcDeploymentsByProjectId, DeploymentLifecycle } from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import metrics from '../../stores/reducers/metrics';
import models, { calcModelListByProjectId, ModelLifecycle } from '../../stores/reducers/models';
import monitoring from '../../stores/reducers/monitoring';
import predictionMetrics from '../../stores/reducers/predictionMetrics';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import AccuracyVsPredictionChart from '../AccuracyVsPredictionChart/AccuracyVsPredictionChart';
import AccuracyVsVolumeChart from '../AccuracyVsVolumeChart/AccuracyVsVolumeChart';
import ChartMetricsFull from '../ChartMetricsFull/ChartMetricsFull';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import ConfusionMatrixModal, { PAYOFF_MATRIX_TYPES } from '../ConfusionMatrixModal/ConfusionMatrixModal';
import DataIntegrityOne from '../DataIntegrityOne/DataIntegrityOne';
import DecileAnalysisChart from '../DecileAnalysisChart/DecileAnalysisChart';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import ItemAttributesChart from '../ItemAttributesChart/ItemAttributesChart';
import Link from '../Link/Link';
import { IMetricsFolderData } from '../MetricsFolderOne/MetricsFolderOne';
import MetricsModalTopN from '../MetricsModalTopN/MetricsModalTopN';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModelFoldDrift from '../ModelFoldDrift/ModelFoldDrift';
import { PredictionDisplayType } from '../ModelPredictionCommon/ModelPredictionCommon';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import PredictionDistributionChart from '../PredictionDistributionChart/PredictionDistributionChart';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TimelineChart from '../TimelineChart/TimelineChart';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
import ClusterMetrics from './ClusterMetrics/ClusterMetrics';
import DetailsHeader from './DetailsHeader/DetailsHeader';
import DetailsTables from './DetailsTables/DetailsTables';

const s = require('./ModelMetricsOne.module.css');
const sd = require('../antdUseDark.module.css');
const tinycolor2 = require('tinycolor2');
const { confirm } = Modal;

interface IModelMetricsOneProps {
  paramsProp?: any;
  projects?: any;
  datasets?: any;
  models?: any;
  projectDatasets?: any;
  isUseTypes?: any;
  optionsMonitors?: any;
  optionsVersions?: any;
  onChangeMonitor?: any;
  deployments?: any;
  metricsParam?: any;
  useCases?: any;
  monitoring?: any;
  predictionMetrics?: any;
  isDecile?: boolean;
  modelMonitorVersion?: string;
  predictionMetricVersion?: string;
  monitorVersion?: any;
  metricType?: string;
  onChangeProject?: (key: any) => void;
  featureGroupsParam?: any;
  projectId?: string;
}

interface IModelMetricsOneState {
  sessionId?: string;
  trainValue?: any;
  testValue?: any;
  chartsUuid?: any;
  modelsExpanded?: any;
  isRefreshingAll?: boolean;
  less830WWnone?: any;
  less830WW?: any;
  less830WW0?: any;
  less830WWtwoRows?: any;
  refreshingModelId?: string;
  validation?: boolean;
  addExpanded?: any;

  isMedium?: any;
  isSmall?: any;

  threshold?: any;
  thresholdStatic?: any;
  thresholdStaticInit?: any;
  thresholdDebounce?: any;
  thresholdStep?: any;
  threshold2?: any;

  thresholdTopNRows?: any;
  thresholdTopNRowsSend?: any;
  thresholdSortByClass?: any;
  thresholdSortByClassSend?: any;
  optimizeThresholdSel?: any;
  optionsClassesSelValue?: any;

  optionsConfig?: any;
  optionsConfigInit?: any;

  foldersCache?: { processingKeys?: string[]; addProcessingKey?: (key) => void; openKeys?: string[]; setOpenKeys?: (keys: string[]) => void; data?: any; setData?: (value: any) => void };

  metricValuesOptionsSel?: any;
  isFoldIntegrity?: boolean;
  sortPreference?: any;
}

class ModelMetricsOne extends React.PureComponent<IModelMetricsOneProps, IModelMetricsOneState> {
  private unCacheMetrics: any;
  private cacheMetrics: any;
  private isM: boolean;
  private refsCharts: any;
  metricsFromData: any;
  topNValue: { thresholdTopNRows?; thresholdSortByClass? };
  lastMetricsData: any;
  lastMetricsDataVersion: any;
  lastMetricsDataVersionType: any;
  lastMetricsDataVersionValidate: any;
  lastMetricsDataVersionExtras: any;
  lastMetricsDataVersionExtrasVal: any;
  refCenter: HTMLDivElement;
  navLeftCollapsed: any;
  confirmIds: any;
  isRegression: any;
  usedThresholdAlreadyDebounce: any;
  private usedThresholdAlreadyDebounceTT: any;
  timerRefreshModelVersion: any;
  private refScroller = React.createRef<any>();

  constructor(props) {
    super(props);
    let th1 = 0.5;

    this.state = {
      sessionId: uuid.v1(),
      modelsExpanded: {},
      validation: undefined,
      threshold: th1,
      thresholdStatic: th1,
      thresholdStaticInit: th1,
      thresholdDebounce: th1,
      threshold2: th1,
      foldersCache: this.calcNewFolderCache(),

      thresholdTopNRows: null,
      thresholdSortByClass: null,
      thresholdTopNRowsSend: null,
      thresholdSortByClassSend: null,
      isFoldIntegrity: false,
      sortPreference: '',
    };

    this.refsCharts = {};
    this.debounceThreshold = _.debounce(this.debounceThreshold, 200);
  }

  calcNewFolderCache = () => {
    return {
      processingKeys: [],
      addProcessingKey: (key) => {
        let d1 = { ...(this.state.foldersCache ?? {}) };
        d1.processingKeys ??= [];
        if (!d1.processingKeys.includes(key)) {
          d1.processingKeys.push(key);

          this.setState({
            foldersCache: d1,
          });
        }
      },

      data: {},
      setData: (value) => {
        let d1 = { ...(this.state.foldersCache ?? {}) };
        d1.data = value ?? {};
        this.setState({
          foldersCache: d1,
        });
      },

      openKeys: [],
      setOpenKeys: (keys) => {
        let d1 = { ...(this.state.foldersCache ?? {}) };
        d1.openKeys = keys ?? [];
        this.setState({
          foldersCache: d1,
        });
      },
    };
  };

  forceNoTree = false;
  recreateFolderCache = (cbFinish?) => {
    this.forceNoTree = true;
    this.setState(
      {
        foldersCache: this.calcNewFolderCache(),
      },
      () => {
        cbFinish?.();

        setTimeout(() => {
          this.forceNoTree = false;
          this.forceUpdate();
        }, 100);
      },
    );
  };

  onDarkModeChanged = (isDark) => {
    setTimeout(() => {
      this.setState({
        chartsUuid: uuid.v1(),
      });
    }, 0);

    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;
    this.unCacheMetrics = REActions.resetAllMetrics.listen(this.onResetAllMetrics);
    this.doMem(false);
  }

  onResetAllMetrics = () => {
    this.recreateFolderCache();
    this.cacheMetrics = {};
    this.setState({
      sessionId: uuid.v1(),
    });
  };

  componentWillUnmount() {
    if (this.timerRefreshModelVersion != null) {
      clearTimeout(this.timerRefreshModelVersion);
      this.timerRefreshModelVersion = null;
    }

    this.isM = false;
    this.unCacheMetrics();

    if (this.confirmIds != null) {
      this.confirmIds.destroy();
      this.confirmIds = null;
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
    let foundProject1 = this.memProjectId(true)(this.props.projectId, this.props.projects);

    let selUseCase = this.memUseCaseSel(true)(this.props.useCases, foundProject1?.useCase);

    let listModels = this.memModelList(true)(this.props.models, projectId);
    let listDeployments = this.memDeploymentList(true)(this.props.deployments, projectId);
    let listDatasetsProj = this.memProjectDatasets(true)(this.props.projectDatasets, projectId);
    let listDatasets = this.memDatasetsList(true)(this.props.datasets, listDatasetsProj);

    let detailModelId = this.props.paramsProp?.get('detailModelId');
    let detailModelVersion = this.props.paramsProp?.get('detailModelVersion');
    let algorithm = this.props.paramsProp?.get('algorithm');
    let ModelMonitorDetailFound = this.memModelMonitorDetail(true)(this.props.monitoring, detailModelId);
    this.memFGTraining(true)(this.props.featureGroupsParam, ModelMonitorDetailFound?.trainingFeatureGroupId);
    this.memFGPrediction(true)(this.props.featureGroupsParam, ModelMonitorDetailFound?.predictionFeatureGroupId);
    let modelMonitorVersion = this.props.modelMonitorVersion;
    if (modelMonitorVersion === '') {
      modelMonitorVersion = null;
    }
    let predictionMetricVersion = this.props.predictionMetricVersion;
    if (predictionMetricVersion === '') {
      predictionMetricVersion = null;
    }

    let versionsData: { data } = modelMonitorVersion || predictionMetricVersion ? null : this.memMetricsVersions(true)(this.props.metricsParam, detailModelId);
    if (Utils.isNullOrEmpty(detailModelVersion)) {
      if (versionsData?.data != null && _.isArray(versionsData?.data) && versionsData?.data.length > 0) {
        detailModelVersion = versionsData?.data?.[0]?.modelVersion;
      }
    }

    let modelVersionAll = this.memModelVersionAll(true)(this.props.models, detailModelId);

    let modelVersionOne = this.memModelVersion(true)(this.props.models, detailModelId, detailModelVersion);
    let automlCompleteNot = modelVersionOne?.automlComplete === false;
    if (automlCompleteNot) {
      if (this.timerRefreshModelVersion == null) {
        this.timerRefreshModelVersion = setTimeout(() => {
          this.timerRefreshModelVersion = null;

          StoreActions.modelsVersionsByModelId_(detailModelId);
        }, 10 * 1000);
      }
    }

    let dataClusterType = this.calcDataClusterType();
    let versionOneTest: { res; data } = this.memMetricsVersionOne(true)(
      this.props.metricsParam,
      detailModelVersion,
      algorithm,
      undefined,
      this.state.thresholdTopNRowsSend,
      this.state.thresholdSortByClassSend,
      dataClusterType,
      this.state.sortPreference,
    );
    let showValidation = versionOneTest?.res?.hasValidation === true;
    if (predictionMetricVersion) {
      let monitorMetricOne: { res; data } = this.memModelMonitor(true)(this.props.predictionMetrics, predictionMetricVersion, this.state.metricValuesOptionsSel);
      let predMetricVersionFound = this.memPredMetricVersion(true)(this.props.predictionMetrics, predictionMetricVersion);
    }

    if (this.props.monitorVersion) {
      let monitorMetricOne: { res; data } = this.memModelMonitorByType(true)(this.props.predictionMetrics, this.props.monitorVersion, this.props.metricType, this.state.metricValuesOptionsSel);
    }
  };

  memModelVersionAll = memoizeOneCurry((doCall, modelsParam, modelId) => {
    return models.memModelVersionsByModelId(doCall, modelsParam, modelId);
  });

  memModelVersion = memoizeOneCurry((doCall, modelsParam, modelId, modelVersion) => {
    let res = models.memModelVersionsByModelId(doCall, modelsParam, modelId);
    return res?.find((r1) => r1.modelVersion === modelVersion);
  });

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, projectId) => {
    return projectDatasetsReq.memDatasetsByProjectId(doCall, projectDatasets, projectId);
  });

  memDatasetsList = memoizeOneCurry((doCall, datasets, listDatasets) => {
    if (listDatasets) {
      let ids = listDatasets.map((d1) => d1.dataset?.datasetId);
      return datasetsReq.memDatasetListCall(doCall, datasets, ids);
    }
  });

  componentDidUpdate(prevProps: Readonly<IModelMetricsOneProps>, prevState: Readonly<IModelMetricsOneState>, snapshot?: any): void {
    this.doMem();
  }

  memPredMetricVersion = memoizeOneCurry((doCall, predictionMetricsParam, predictionMetricVersion) => {
    return predictionMetrics.memDescribeMetricsVersionByPredMetricsVersion(doCall, predictionMetricsParam, predictionMetricVersion);
  });

  processNewDataAdditional = (dataValueKey, data) => {
    if (data != null) {
      let dataProcessed = this.processExtrasAdditionalMetrics(data);
      if (dataProcessed == null) {
        return;
      }

      let data1 = { ...(this.state.foldersCache?.data ?? {}) };
      data1[dataValueKey] = dataProcessed;
      this.state.foldersCache?.setData(data1);
    }
  };

  memModelMonitor = memoizeOneCurry((doCall, predictionMetricsParam, predictionMetricVersion, actualValue) => {
    let data = predictionMetrics.memMetricsByPredMetricVersion(doCall, undefined, predictionMetricVersion, actualValue);
    let data2;
    if (data) {
      data2 = [_.cloneDeep(data)];
      this.lastMetricsDataVersion = _.cloneDeep(data2);
      data2 = this.processMetricsData(data2);
    }
    return { res: data, data: data2 };
  });

  memModelMonitorByType = memoizeOneCurry((doCall, predictionMetricsParam, monitorVersion, metricType, actualValue) => {
    let data = predictionMetrics.memMetricsByPredMetricType(doCall, undefined, monitorVersion, metricType, actualValue);
    let data2;
    if (data) {
      data2 = [_.cloneDeep(data)];
      this.lastMetricsDataVersionType = _.cloneDeep(data2);
      data2 = this.processMetricsData(data2);
    }
    return { res: data, data: data2 };
  });

  memMetricsVersionOneLastValues = null;
  memMetricsVersionOneLastValuesData = null;
  memMetricsVersionOne = memoizeOneCurry((doCall, metricsParam, modelVersion, algorithm, validation = null, nRows = null, sortByClass = null, dataClusterType = null, sortPreference) => {
    let data = this.props?.isUseTypes ? null : metrics.memMetricVersionOne(undefined, modelVersion, algorithm, validation, null, nRows, sortByClass, dataClusterType, sortPreference, doCall);

    let pp = [modelVersion, algorithm, validation, nRows, sortByClass, dataClusterType];
    let ppUsedLen = pp.length - 2 - 1;
    if (!this.props.isUseTypes) {
      if (doCall) {
        this.setState({
          isFoldIntegrity: false,
        });

        let isP = data == null;

        if (Utils.isNullOrEmpty(modelVersion)) {
          isP = false;
        }

        if ((this.state.isRefreshingAll ?? false) !== isP) {
          this.setState({
            isRefreshingAll: isP,
          });
        }
      }

      if (data == null && !doCall) {
        if (this.memMetricsVersionOneLastValues != null && this.memMetricsVersionOneLastValuesData != null) {
          if (_.isEqual(this.memMetricsVersionOneLastValues?.slice(0, ppUsedLen), pp.slice(0, ppUsedLen))) {
            data = this.memMetricsVersionOneLastValuesData;
          }
        }
      } else if (data != null && doCall) {
        this.memMetricsVersionOneLastValues = pp;
        this.memMetricsVersionOneLastValuesData = data;
      }
    }

    let data2;
    if (data) {
      data = this.processMetricsDataOri(data);

      data2 = [_.cloneDeep(data)];
      this.lastMetricsDataVersion = _.cloneDeep(data2);
      data2 = this.processMetricsData(data2);
    }
    return { res: data, data: data2 };
  });

  processExtrasAdditionalMetrics = (res) => {
    let data;
    let data2;
    let resDict: { [key: string]: { res; data } } = null;
    if (res != null) {
      resDict = {};

      let kk = Object.keys(res ?? {});
      kk.some((k1) => {
        data = res[k1];
        data = this.processMetricsDataOri(data);

        data2 = [_.cloneDeep(data)];
        data2 = this.processMetricsData(data2, true);
        if (data2?.[0]?.metrics != null) {
          let kk = Object.keys(data2?.[0]?.metrics);
          if (kk.length === 1 && kk[0] === 'intName') {
            data = null;
            data2 = null;
          }
        }

        if (data == null && data2 == null) {
          //
        } else {
          resDict[k1] = data; //{res: data, data: data2,};
        }
      });
    }
    return resDict;
  };

  memMetricsVersions = memoizeOneCurry((doCall, metricsParam, detailModelId) => {
    let res = metrics.memMetricVersions(undefined, detailModelId, doCall);
    if (res != null) {
      res = _.cloneDeep(res);
      let data1 = this.processMetricsData(res);
      res = {
        isRefreshing: false,
        data: data1,
      };
    }
    return res;
  });

  memModelMonitorDetail = memoizeOneCurry((doCall, monitoringParam, modelId) => {
    return monitoring.memModelsById(doCall, modelId);
  });

  memFGTraining = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupsForId(doCall, null, featureGroupId);
  });

  memFGPrediction = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupsForId(doCall, null, featureGroupId);
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memMetrics = memoizeOne((projectId, listModels, sessionId) => {
    if (!projectId || !listModels) {
      return;
    }

    if (!this.cacheMetrics) {
      this.cacheMetrics = {};
    }

    let key1 = projectId;
    let kkIds = [];

    let modelIdSorted = [];
    listModels?.some((m1) => {
      let modelVersion = m1.getIn(['latestModelVersion', 'modelVersion']);
      kkIds.push(modelVersion);
      modelIdSorted.push(m1.getIn(['modelId']));
    });
    kkIds.sort();
    key1 += '_' + kkIds.join('_') + '_' + sessionId;

    let cacheProject1 = this.cacheMetrics[key1];
    if (cacheProject1) {
      return cacheProject1;
    } else {
      let obj1 = {
        isRefreshing: true,
        data: null,
      };

      REClient_.client_().get_metrics_data(projectId, (err, res) => {
        obj1.isRefreshing = false;

        if (!err && res && res.result) {
          let data = res.result;
          this.lastMetricsData = _.cloneDeep(data);
          data = this.processMetricsData(data);

          obj1.data = data;
        }

        this.forceUpdate();
      });

      this.cacheMetrics[key1] = obj1;
      return obj1;
    }
  });

  processMetricsDataOri = (data) => {
    let dataOri = data;
    if (data != null && !_.isArray(data)) {
      data = [data];
    }
    if (data != null && data.length > 0) {
      data.some((d1) => {
        if (!d1 || _.isEmpty(d1)) {
          return;
        }

        let mm = ['metrics', 'metricsVal', 'metricsAdd'];
        mm.some((k1) => {
          if (d1[k1] != null && d1[k1 + 'Ori'] == null) {
            d1[k1 + 'Ori'] = _.cloneDeep(d1[k1]);
          }
        });

        let mmo = ['otherMetrics', 'otherMetricsVal', 'otherMetricsAdd'];
        mmo.some((k1) => {
          if (d1[k1] != null && d1[k1].length > 0 && d1[k1 + 'Ori'] == null) {
            d1[k1 + 'Ori'] = d1[k1].map((o1) => {
              return _.cloneDeep(o1);
            });
          }
        });
      });
    }

    return dataOri;
  };

  processMetricsData = (data, isAdditional = false) => {
    if (!data?.length) return data;
    const confusion = 'confusion';
    const histograms = 'histograms';
    const eqHistograms = 'eqHistograms';
    const nullFeatureImportance = 'nullFeatureImportance';
    const permutationFeatureImportance = 'permutationFeatureImportance';
    const predictedVsActual = 'predictedVsActual';
    const confusionMatrix = 'confusionMatrix';
    const fvaPlotArtifacts = 'fvaPlotArtifacts';
    const featureImportance = 'featureImportance';
    const infoLogs = 'infoLogs';
    const detailedMetrics = 'detailedMetrics';
    const correlationCoefficients = 'correlationCoefficients';
    const ignoreCorrelatedColumns = 'ignoreCorrelatedColumns';
    const correlationExists = 'correlationExists';
    const correlationFilter = 'correlationFilter';
    const topKCorrelated = 'topKCorrelated';
    const rocCurve = 'rocCurve';
    const rocCurvePerLabel = 'rocCurvePerLabel';
    const prCurvePerLabel = 'prCurvePerLabel';
    const additionalMetricsKeys = 'additionalMetricsKeys';
    const additionalExpandableMetricsKeys = 'additionalExpandableMetricsKeys';
    const additionalExpandingMetricsKeys = 'additionalExpandingMetricsKeys';
    const additionalExpandingMetricsTrees = 'additionalExpandingMetricsTrees';
    const additionalExpandingMetricsTreesGlobalList = 'additionalExpandingMetricsTreesGlobalList';
    const nullFeatureDependence = 'nullFeatureDependence';
    const featureImportanceCharts = 'featureImportanceCharts';
    const optimalThresholds = 'optimalThresholds';
    const trainValTestSplit = 'trainValTestSplit';
    const partialDependence = 'partialDependence';
    const foldIntegrity = 'foldIntegrity';
    data = data.map((d1) => {
      if (!d1 || _.isEmpty(d1)) {
        return d1;
      }

      if (d1.metrics == null && d1.otherMetrics != null && isAdditional) {
        let om1 = d1.otherMetrics?.find((o1) => o1?.[Object.keys(o1 ?? {})?.[0]] != null);
        if (om1 != null) {
          d1.metrics = _.cloneDeep(om1?.[Object.keys(om1 ?? {})?.[0]]);
        }
      }

      let tempRemoveRecallStartsInd = d1.metricNames?.findIndex((m1) => _.startsWith(m1?.[Object.keys(m1 ?? {})[0]]?.toLowerCase(), 'recall: <'));
      if (tempRemoveRecallStartsInd > -1) {
        d1.metricNames?.splice(tempRemoveRecallStartsInd, 1);
      }

      let fvaName = null,
        fvaData = null,
        detailedMetricsData = null;
      let fvaInd = d1.metricNames?.findIndex((m1) => m1?.[fvaPlotArtifacts] != null);
      if (fvaInd > -1) {
        fvaName = d1.metricNames[fvaInd]?.[fvaPlotArtifacts];
        d1.metricNames?.splice(fvaInd, 1);
        d1.fvaName = fvaName;
      }
      if (d1.metrics?.[fvaPlotArtifacts]) {
        fvaData = d1.metrics[fvaPlotArtifacts];
        delete d1.metrics[fvaPlotArtifacts];
        d1.fvaData = fvaData;
      }

      let foldIntegrityInd = d1.metricNames?.findIndex((m1) => m1?.[foldIntegrity] != null);
      if (foldIntegrityInd > -1) {
        d1.metricNames?.splice(foldIntegrityInd, 1);
      }
      if (d1.metrics?.[foldIntegrity]) {
        let foldIntegrityData = d1.metrics[foldIntegrity];
        delete d1.metrics[foldIntegrity];
        d1.foldIntegrity = foldIntegrityData;
      }

      let partialDependenceInd = d1.metricNames?.findIndex((m1) => m1?.[partialDependence] != null);
      if (partialDependenceInd > -1) {
        d1.metricNames?.splice(partialDependenceInd, 1);
      }
      if (d1.metrics?.[partialDependence]) {
        let partialDependenceData = d1.metrics[partialDependence];
        delete d1.metrics[partialDependence];
        d1.partialDependence = partialDependenceData;
      }

      let trainValTestSplitInd = d1.metricNames?.findIndex((m1) => m1?.[trainValTestSplit] != null);
      if (trainValTestSplitInd > -1) {
        d1.metricNames?.splice(trainValTestSplitInd, 1);
      }
      if (d1.metrics?.[trainValTestSplit]) {
        let trainValTestSplitData = d1.metrics[trainValTestSplit];
        delete d1.metrics[trainValTestSplit];
        d1.trainValTestSplit = trainValTestSplitData;
      }

      let optimalThresholdsInd = d1.metricNames?.findIndex((m1) => m1?.[optimalThresholds] != null);
      if (optimalThresholdsInd > -1) {
        d1.metricNames?.splice(optimalThresholdsInd, 1);
      }
      if (d1.metrics?.[optimalThresholds]) {
        let optimalThresholdsData = d1.metrics[optimalThresholds];
        delete d1.metrics[optimalThresholds];
        d1.optimalThresholds = optimalThresholdsData;
      }

      let topKCorrelatedInd = d1.metricNames?.findIndex((m1) => m1?.[topKCorrelated] != null);
      if (topKCorrelatedInd > -1) {
        d1.metricNames?.splice(topKCorrelatedInd, 1);
      }
      if (d1.metrics?.[topKCorrelated]) {
        let topKCorrelatedData = d1.metrics[topKCorrelated];
        delete d1.metrics[topKCorrelated];
        d1.topKCorrelated = topKCorrelatedData;
      }

      let rocCurveInd = d1.metricNames?.findIndex((m1) => m1?.[rocCurve] != null);
      if (rocCurveInd > -1) {
        d1.metricNames?.splice(rocCurveInd, 1);
      }
      if (d1.metrics?.[rocCurve]) {
        let rocCurveData = d1.metrics[rocCurve];
        delete d1.metrics[rocCurve];
        d1.rocCurve = rocCurveData;
      }

      let rocCurvePerLabelInd = d1.metricNames?.findIndex((m1) => m1?.[rocCurvePerLabel] != null);
      if (rocCurvePerLabelInd > -1) {
        d1.metricNames?.splice(rocCurvePerLabelInd, 1);
      }
      if (d1.metric?.[rocCurvePerLabel]) {
        let rocCurvePerLabelData = d1.metrics[rocCurvePerLabel];
        delete d1.metrics[rocCurvePerLabel];
        d1.rocCurvePerLabel = rocCurvePerLabelData;
      }

      let prCurvePerLabelInd = d1.metricNames?.findIndex((m1) => m1?.[prCurvePerLabel] != null);
      if (prCurvePerLabelInd > -1) {
        d1.metricNames?.splice(prCurvePerLabelInd, 1);
      }
      if (d1.metrics?.[prCurvePerLabel]) {
        let prCurvePerLabelData = d1.metrics[prCurvePerLabel];
        delete d1.metrics[prCurvePerLabel];
        d1.prCurvePerLabel = prCurvePerLabelData;
      }

      let additionalExpandableMetricsKeysInd = d1.metricNames?.findIndex((m1) => m1?.[additionalExpandableMetricsKeys] != null);
      if (additionalExpandableMetricsKeysInd > -1) {
        d1.metricNames?.splice(additionalExpandableMetricsKeysInd, 1);
      }
      if (d1.metrics?.[additionalExpandableMetricsKeys]) {
        let additionalExpandableMetricsKeysData = d1.metrics[additionalExpandableMetricsKeys];
        delete d1.metrics[additionalExpandableMetricsKeys];
        d1.additionalExpandableMetricsKeys = additionalExpandableMetricsKeysData;
      }

      let additionalExpandingMetricsKeysInd = d1.metricNames?.findIndex((m1) => m1?.[additionalExpandingMetricsKeys] != null);
      if (additionalExpandingMetricsKeysInd > -1) {
        d1.metricNames?.splice(additionalExpandingMetricsKeysInd, 1);
      }
      if (d1.metrics?.[additionalExpandingMetricsKeys]) {
        let additionalExpandingMetricsKeysData = d1.metrics[additionalExpandingMetricsKeys];
        delete d1.metrics[additionalExpandingMetricsKeys];
        d1.additionalExpandingMetricsKeys = additionalExpandingMetricsKeysData;
      }

      let additionalExpandingMetricsTreesInd = d1.metricNames?.findIndex((m1) => m1?.[additionalExpandingMetricsTrees] != null);
      if (additionalExpandingMetricsTreesInd > -1) {
        d1.metricNames?.splice(additionalExpandingMetricsTreesInd, 1);
      }
      if (d1.metrics?.[additionalExpandingMetricsTrees]) {
        let additionalExpandingMetricsTreesData = d1.metrics[additionalExpandingMetricsTrees];
        delete d1.metrics[additionalExpandingMetricsTrees];
        d1.additionalExpandingMetricsTrees = additionalExpandingMetricsTreesData;
      }

      let additionalExpandingMetricsTreesGlobalListInd = d1.metricNames?.findIndex((m1) => m1?.[additionalExpandingMetricsTreesGlobalList] != null);
      if (additionalExpandingMetricsTreesGlobalListInd > -1) {
        d1.metricNames?.splice(additionalExpandingMetricsTreesGlobalListInd, 1);
      }
      if (d1.metrics?.[additionalExpandingMetricsTreesGlobalList]) {
        let additionalExpandingMetricsTreesGlobalListData = d1.metrics[additionalExpandingMetricsTreesGlobalList];
        delete d1.metrics[additionalExpandingMetricsTreesGlobalList];
        d1.additionalExpandingMetricsTreesGlobalList = additionalExpandingMetricsTreesGlobalListData;

        let gg = d1.additionalExpandingMetricsTreesGlobalList;
        if (gg != null) {
          const iterGlobalOne = (g1: IMetricsFolderData) => {
            if (g1 == null) {
              return [];
            }

            let res = [];
            if (g1.values != null && g1.values.length > 0) {
              res = res.concat(g1.values.map((v1) => v1.key));
            }
            if (g1.subFolders != null && g1.subFolders.length > 0) {
              let kk = [];
              g1.subFolders.some((f1) => {
                kk = kk.concat(iterGlobalOne(f1) ?? []);
              });
              res = res.concat(kk);
            }

            g1.calcAllKeysSubUsed = res;
            return res;
          };

          gg.some((g1) => {
            iterGlobalOne(g1);
          });
        }
      }

      let additionalMetricsKeysInd = d1.metricNames?.findIndex((m1) => m1?.[additionalMetricsKeys] != null);
      if (additionalMetricsKeysInd > -1) {
        d1.metricNames?.splice(additionalMetricsKeysInd, 1);
      }
      if (d1.metrics?.[additionalMetricsKeys]) {
        let additionalMetricsKeysData = d1.metrics[additionalMetricsKeys];
        delete d1.metrics[additionalMetricsKeys];
        d1.additionalMetricsKeys = additionalMetricsKeysData;
      }

      let detailedMetricsInd = d1.metricNames?.findIndex((m1) => m1?.[detailedMetrics] != null);
      if (detailedMetricsInd > -1) {
        d1.metricNames?.splice(detailedMetricsInd, 1);
      }
      if (d1.metrics?.[detailedMetrics]) {
        detailedMetricsData = d1.metrics[detailedMetrics];
        delete d1.metrics[detailedMetrics];
        d1.detailedMetrics = detailedMetricsData;
      }

      let featureInd = d1.metricNames?.findIndex((m1) => m1?.[featureImportance] != null);
      if (featureInd > -1) {
        d1.metricNames?.splice(featureInd, 1);
      }
      if (d1.metrics?.[featureImportance]) {
        let featureImportanceData = d1.metrics[featureImportance];
        delete d1.metrics[featureImportance];
        d1.featureImportance = featureImportanceData;
      }

      let infoLogsInd = d1.metricNames?.findIndex((m1) => m1?.[infoLogs] != null);
      if (infoLogsInd > -1) {
        d1.metricNames?.splice(infoLogsInd, 1);
      }
      if (d1.metrics?.[infoLogs]) {
        let infoLogsData = d1.metrics[infoLogs];
        delete d1.metrics[infoLogs];
        d1.infoLogs = infoLogsData;
      }

      let confusionMatrixInd = d1.metricNames?.findIndex((m1) => m1?.[confusionMatrix] != null);
      if (confusionMatrixInd > -1) {
        d1.metricNames?.splice(confusionMatrixInd, 1);
      }
      if (d1.metrics?.[confusionMatrix]) {
        let confusionMatrixData = d1.metrics[confusionMatrix];
        delete d1.metrics[confusionMatrix];
        d1.confusionMatrix = confusionMatrixData;
      }
      let confusionInd = d1.metricNames?.findIndex((m1) => m1?.[confusion] != null);
      if (confusionInd > -1) {
        d1.metricNames?.splice(confusionInd, 1);
      }
      if (d1.metrics?.[confusion]) {
        let confusionData = d1.metrics[confusion];
        delete d1.metrics[confusion];
        d1.confusion = confusionData;
      }

      let histogramsInd = d1.metricNames?.findIndex((m1) => m1?.[histograms] != null);
      if (histogramsInd > -1) {
        d1.metricNames?.splice(histogramsInd, 1);
      }
      if (d1.metrics?.[histograms]) {
        let histogramsData = d1.metrics[histograms];
        delete d1.metrics[histograms];
        d1.histograms = histogramsData;
      }

      let eqHistogramsInd = d1.metricNames?.findIndex((m1) => m1?.[eqHistograms] != null);
      if (eqHistogramsInd > -1) {
        d1.metricNames?.splice(eqHistogramsInd, 1);
      }
      if (d1.metrics?.[eqHistograms]) {
        let eqHistogramsData = d1.metrics[eqHistograms];
        delete d1.metrics[eqHistograms];
        d1.eqHistograms = eqHistogramsData;
      }

      let permutationFeatureImportanceInd = d1.metricNames?.findIndex((m1) => m1?.[permutationFeatureImportance] != null);
      if (permutationFeatureImportanceInd > -1) {
        d1.metricNames?.splice(permutationFeatureImportanceInd, 1);
      }
      if (d1.metrics?.[permutationFeatureImportance]) {
        let permutationFeatureImportanceData = d1.metrics[permutationFeatureImportance];
        delete d1.metrics[permutationFeatureImportance];
        d1.permutationFeatureImportance = permutationFeatureImportanceData;
      }

      let nullFeatureImportanceInd = d1.metricNames?.findIndex((m1) => m1?.[nullFeatureImportance] != null);
      if (nullFeatureImportanceInd > -1) {
        d1.metricNames?.splice(nullFeatureImportanceInd, 1);
      }
      if (d1.metrics?.[nullFeatureImportance]) {
        let nullFeatureImportanceData = d1.metrics[nullFeatureImportance];
        delete d1.metrics[nullFeatureImportance];
        d1.nullFeatureImportance = nullFeatureImportanceData;
      }

      let predictedVsActualInd = d1.metricNames?.findIndex((m1) => m1?.[predictedVsActual] != null);
      if (predictedVsActualInd > -1) {
        d1.metricNames?.splice(predictedVsActualInd, 1);
      }
      if (d1.metrics?.[predictedVsActual]) {
        let predictedVsActualData = d1.metrics[predictedVsActual];
        delete d1.metrics[predictedVsActual];
        d1.predictedVsActual = predictedVsActualData;
      }

      let correlationCoefficientsInd = d1.metricNames?.findIndex((m1) => m1?.[correlationCoefficients] != null);
      if (correlationCoefficientsInd > -1) {
        d1.metricNames?.splice(correlationCoefficientsInd, 1);
      }
      if (d1.metrics?.[correlationCoefficients]) {
        let correlationCoefficientsData = d1.metrics[correlationCoefficients];
        delete d1.metrics[correlationCoefficients];
        d1.correlationCoefficients = correlationCoefficientsData;
      }
      let ignoreCorrelatedColumnsInd = d1.metricNames?.findIndex((m1) => m1?.[ignoreCorrelatedColumns] != null);
      if (ignoreCorrelatedColumnsInd > -1) {
        d1.metricNames?.splice(ignoreCorrelatedColumnsInd, 1);
      }
      if (d1.metrics?.[ignoreCorrelatedColumns]) {
        let ignoreCorrelatedColumnsData = d1.metrics[ignoreCorrelatedColumns];
        delete d1.metrics[ignoreCorrelatedColumns];
        d1.ignoreCorrelatedColumns = ignoreCorrelatedColumnsData;
      }
      let correlationExistsInd = d1.metricNames?.findIndex((m1) => m1?.[correlationExists] != null);
      if (correlationExistsInd > -1) {
        d1.metricNames?.splice(correlationExistsInd, 1);
      }
      if (d1.metrics?.[correlationExists]) {
        let correlationExistsData = d1.metrics[correlationExists];
        delete d1.metrics[correlationExists];
        d1.correlationExists = correlationExistsData;
      }
      let correlationFilterInd = d1.metricNames?.findIndex((m1) => m1?.[correlationFilter] != null);
      if (correlationFilterInd > -1) {
        d1.metricNames?.splice(correlationFilterInd, 1);
      }
      if (d1.metrics?.[correlationFilter]) {
        let correlationFilterData = d1.metrics[correlationFilter];
        delete d1.metrics[correlationFilter];
        d1.correlationFilter = correlationFilterData;
      }
      let nullFeatureDependenceInd = d1.metricNames?.findIndex((m1) => m1?.[nullFeatureDependence] != null);
      if (nullFeatureDependenceInd > -1) {
        d1.metricNames?.splice(nullFeatureDependenceInd, 1);
      }
      if (d1.metrics?.[nullFeatureDependence]) {
        let nullFeatureDependenceData = d1.metrics[nullFeatureDependence];
        delete d1.metrics[nullFeatureDependence];
        d1.nullFeatureDependence = nullFeatureDependenceData;
      }

      let featureImportanceChartsInd = d1.metricNames?.findIndex((m1) => m1?.[featureImportanceCharts] != null);
      if (featureImportanceChartsInd > -1) {
        d1.metricNames?.splice(featureImportanceChartsInd, 1);
      }
      if (d1.metrics?.[featureImportanceCharts]) {
        let featureImportanceChartsData = d1.metrics[featureImportanceCharts];
        delete d1.metrics[featureImportanceCharts];
        d1.featureImportanceCharts = featureImportanceChartsData;
      }

      if (d1.otherMetrics != null) {
        d1.otherMetrics = d1.otherMetrics.filter((om1, om1ind) => {
          let kk = Object.keys(om1);
          if (kk && kk.length > 0) {
            let name1 = kk[0];
            let data2 = om1[name1];
            if (data2 != null) {
              let kkData = Object.keys(data2 ?? {});
              kkData = kkData.filter((v1) => !['modelid', 'modelversion'].includes(v1?.toLowerCase() ?? '-'));
              if (kkData.length === 0) {
                return false;
              }
            }
          }
          return true;
        });
        if (d1.otherMetrics != null && d1.otherMetrics.length === 0) {
          d1.otherMetrics = null;
        }
      }
      if (d1.metrics) {
        d1.metrics['intName'] = [d1.algoName || ''];
      }

      if (d1.otherMetrics != null) {
        d1.otherMetrics = d1.otherMetrics.filter((m1) => {
          if (m1 == null) {
            return false;
          } else {
            let kk = Object.keys(m1);
            if (kk.length === 0) {
              return false;
            } else {
              let r1 = m1[kk[0]];
              let kkR = Object.keys(r1 ?? {})
                .sort()
                .map((s1) => s1?.toLowerCase());
              kkR = kkR.filter((s1) => !['infoLogs'.toLowerCase(), 'deployable', 'modelid', 'modelversion'].includes(s1)).filter((s1) => !Utils.isNullOrEmpty(s1));
              if (kkR.length === 0) {
                return false;
              }
            }
          }
          return true;
        });
        d1.otherMetrics.some((om1, om1ind) => {
          let kk = Object.keys(om1);
          if (kk && kk.length > 0) {
            let name1 = kk[0];
            let data2 = om1[name1];
            let algoName1 = (data2 as any)?.algoName;
            if (name1 && data2 && !_.isEmpty(data2) && d1.metrics != null) {
              let metricsKeys = Object.keys(d1.metrics);
              metricsKeys &&
                metricsKeys.some((m1) => {
                  if (m1 === fvaPlotArtifacts || m1 === 'intName') {
                    return false;
                  }

                  if (om1ind === 0) {
                    d1.metrics[m1] = [d1.metrics[m1], data2[m1]];
                  } else {
                    d1.metrics[m1].push(data2[m1]);
                  }
                });
              // if(om1ind===0) {
              //   d1.metrics['intName'] = ([d1.algoName || '', algoName1 || 'Baseline']);
              // } else {
              d1.metrics['intName'].push(algoName1 || 'Baseline');
              // }
            }
          }
        });

        if (d1.otherMetrics != null && d1.otherMetrics.length === 0) {
          d1.otherMetrics = null;
        }
      }

      if (d1.otherMetrics == null) {
        let metricsKeys = Object.keys(d1.metrics ?? {});
        metricsKeys &&
          metricsKeys.some((m1) => {
            if (m1 === fvaPlotArtifacts) {
              return false;
            }

            d1.metrics[m1] = [d1.metrics[m1]];
          });
      }
      return d1;
    });
    return data;
  };

  onChangeSelectTrain = (optionTrain) => {
    let v1 = optionTrain ? optionTrain.value : null;
    if (v1 != null) {
      v1 = v1.replace('%', '').replace(/[^0-9]/, '');
      v1 = Utils.tryParseInt(v1);
      if (v1 != null && v1 > 100) {
        v1 = 100;
      }

      optionTrain = {
        value: '' + v1,
        label: '' + v1 + '%',
      };

      let v2 = 100 - v1;
      this.setState({
        testValue: {
          value: '' + v2,
          label: '' + v2 + '%',
        },
      });
    }

    this.setState({
      trainValue: optionTrain,
    });
  };

  onChangeSelectTest = (optionTest) => {
    let v1 = optionTest ? optionTest.value : null;
    if (v1 != null) {
      v1 = v1.replace('%', '').replace(/[^0-9]/, '');
      v1 = Utils.tryParseInt(v1);
      if (v1 != null && v1 > 100) {
        v1 = 100;
      }

      optionTest = {
        value: '' + v1,
        label: '' + v1 + '%',
      };

      let v2 = 100 - v1;
      this.setState({
        trainValue: {
          value: '' + v2,
          label: '' + v2 + '%',
        },
      });
    }

    this.setState({
      testValue: optionTest,
    });
  };

  memModelList = memoizeOneCurry((doCall, models, projectId) => {
    if (models && !Utils.isNullOrEmpty(projectId)) {
      let listByProjectId = calcModelListByProjectId(undefined, projectId);
      if (listByProjectId != null) {
        return listByProjectId;
      } else {
        if (models.get('isRefreshing')) {
          return;
        }
        if (doCall) {
          StoreActions.listModels_(projectId);
        }
      }
    }
  });

  memModelLife: (modelList: any) => { anyTraining; anyError; anyComplete } = memoizeOne((modelList) => {
    if (modelList) {
      let anyTraining = false,
        anyComplete = false,
        anyError = false;
      modelList.some((m1) => {
        let lifecycle = m1.getIn(['latestModelVersion', 'status']);
        if (lifecycle) {
          if (lifecycle === ModelLifecycle.TRAINING || lifecycle === ModelLifecycle.PENDING || lifecycle === ModelLifecycle.UPLOADING) {
            anyTraining = true;
          }
          if (lifecycle === ModelLifecycle.COMPLETE) {
            anyComplete = true;
          }
          if (lifecycle === ModelLifecycle.TRAINING_FAILED || lifecycle === ModelLifecycle.EVALUATING_FAILED || lifecycle === ModelLifecycle.UPLOADING_FAILED) {
            anyError = true;
          }
        }
      });
      return { anyTraining, anyError, anyComplete };
    }
  });

  onClickErrorButton = (e) => {
    if (this.props.projectId) {
      Location.push('/' + PartsLink.model_list + '/' + this.props.projectId);
    }
  };

  calcHelpIdForColumn = (fieldName) => {
    return fieldName;
  };

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId) => {
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

  memAnyDeployment: (list, detailModelId) => { anyProcessing; anyActive; detailModelDeployId } = memoizeOne((list, detailModelId) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');

    let anyActive = false,
      anyProcessing = false,
      detailModelDeployId = null,
      detailModelDeployIdActive = null;
    list?.some((d1) => {
      if ([DeploymentLifecycle.ACTIVE].includes(d1.status)) {
        anyActive = true;
      }

      if (d1?.modelId === detailModelId) {
        if ([DeploymentLifecycle.ACTIVE].includes(d1.status)) {
          detailModelDeployIdActive = d1.deploymentId;
        } else {
          detailModelDeployId = d1.deploymentId;
        }
      }

      if ([DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING].includes(d1.status)) {
        anyProcessing = true;

        if (projectId) {
          StoreActions.refreshDoDeployAll_(d1.deploymentId, projectId);
        }
      }
    });
    return { anyProcessing, anyActive, detailModelDeployId: detailModelDeployIdActive ?? detailModelDeployId };
  });

  memModelStates: (listModels) => { anyCompleteAnyVersion; anyComplete; anyTraining; modelsIdsTraining; modelsIdsAnyCompleteVersion } = memoizeOne((listModels) => {
    if (!listModels) {
      return null;
    }

    let anyComplete = null,
      anyTraining = null,
      anyCompleteAnyVersion = null,
      modelsIdsTraining = [],
      modelsIdsAnyCompleteVersion = [];
    listModels.some((m1) => {
      let lifecycle1 = m1.getIn(['latestModelVersion', 'status']);
      if ([ModelLifecycle.COMPLETE].includes(lifecycle1)) {
        anyComplete = true;
      }
      if ([ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, ModelLifecycle.EVALUATING, ModelLifecycle.TRAINING].includes(lifecycle1)) {
        anyTraining = true;
        modelsIdsTraining.push(m1.get('modelId'));
      }
      if (m1.get('hasTrainedVersion') === true) {
        modelsIdsAnyCompleteVersion.push(m1.get('modelId'));
        anyCompleteAnyVersion = true;
      }
    });
    return { anyComplete, anyTraining, anyCompleteAnyVersion, modelsIdsTraining, modelsIdsAnyCompleteVersion };
  });

  memCalcDatasetList = memoizeOne((listDatasets, projectId) => {
    if (!listDatasets || !projectId) {
      return null;
    }

    let res = [];

    if (Utils.isNullOrEmpty(projectId)) {
      listDatasets = [];
    }

    Object.values(listDatasets).some((d1: Immutable.Map<string, any>) => {
      let datasetId = d1.getIn(['dataset', 'datasetId']);
      res.push({
        datasetId: datasetId,
        name: d1.getIn(['dataset', 'name']),
        updatedAt: d1.get('updatedAt'),
        datasetType: calcDataset_datasetType(d1, projectId),
        status: d1.getIn(['status']),
      });
    });

    return res;
  });

  memDatasetProjectState: (listDataset) => { anyComplete; anyProcessing } = memoizeOne((listDataset) => {
    if (!listDataset) {
      return null;
    }

    let anyComplete = null,
      anyProcessing = null;
    listDataset.some((d1) => {
      let lifecycle1 = d1.status;
      if ([DatasetLifecycle.COMPLETE].includes(lifecycle1)) {
        anyComplete = true;
      }
      if ([DatasetLifecycle.UPLOADING, DatasetLifecycle.CONVERTING, DatasetLifecycle.PENDING, DatasetLifecycle.INSPECTING, DatasetLifecycle.IMPORTING].includes(lifecycle1)) {
        anyProcessing = true;
      }
    });
    return { anyComplete, anyProcessing };
  });

  onClickTrainAModel = () => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (projectId) {
      Location.push('/' + PartsLink.model_train + '/' + projectId);
    }
  };

  onClickChartFva = (row, nameSmall, e) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({
      modelsExpanded: {},
      validation: undefined,
    });

    Location.push('/' + PartsLink.model_metrics + '/' + this.props.paramsProp?.get('projectId'), undefined, 'detailModelId=' + Utils.encodeQueryParam(row.modelId));
  };

  onHoverChartFva = (nameSmall, isHover, e) => {
    e.preventDefault();
    e.stopPropagation();

    let ref1 = this.refsCharts['fva' + nameSmall];
    if (ref1) {
      let $t = $(ref1);
      if (isHover) {
        $t.addClass(s.high);
      } else {
        $t.removeClass(s.high);
      }
    }
  };

  onClickDetailsMetrics = (modelId, modelVersion, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }

    let versionExpanded = null;
    if (modelVersion != null && _.isObject(modelVersion) && (modelVersion as any).value) {
      versionExpanded = '1';
      modelVersion = (modelVersion as any).value;
    }

    this.recreateFolderCache();

    this.setState({
      modelsExpanded: {},
      validation: undefined,
      thresholdTopNRows: null,
      thresholdTopNRowsSend: null,
      thresholdSortByClass: null,
      thresholdSortByClassSend: null,
    });

    let modelMonitorId = this.props.paramsProp?.get('modelMonitorId');
    if (modelMonitorId === '') {
      modelMonitorId = null;
    }

    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');
    if (predictionMetricsId === '') {
      predictionMetricsId = null;
    }
    let predictionMetricVersion = this.props.paramsProp?.get('predictionMetricVersion');
    if (predictionMetricVersion === '') {
      predictionMetricVersion = null;
    }
    if (predictionMetricVersion && !modelVersion) {
      modelVersion = predictionMetricVersion;
    }

    let modelMonitorVersion = this.props.paramsProp?.get('modelMonitorVersion');
    if (modelMonitorVersion === '') {
      modelMonitorVersion = null;
    }
    if (modelMonitorVersion && !modelVersion) {
      modelVersion = modelMonitorVersion;
    }
    let metricType = this.props.paramsProp?.get('metricType');
    if (metricType === '') {
      metricType = null;
    }
    let url =
      this.props.paramsProp?.get('mode') === PartsLink.decile_prediction_metrics_project
        ? '/' + this.props.paramsProp?.get('mode') + '/' + this.props.paramsProp?.get('projectId') + (predictionMetricsId ? '/' + predictionMetricsId : '') + (modelMonitorId ? '/' + modelMonitorId : '')
        : '/' + this.props.paramsProp?.get('mode') + '/' + (modelMonitorId ? '/' + modelMonitorId : '' + this.props.paramsProp?.get('projectId') + (predictionMetricsId ? '/' + predictionMetricsId : ''));
    setTimeout(() => {
      Location.push(
        url,
        undefined,
        'detailModelId=' +
          Utils.encodeQueryParam(modelMonitorId ?? predictionMetricsId ?? modelId ?? modelMonitorVersion) +
          '&detailModelVersion=' +
          Utils.encodeQueryParam(modelVersion) +
          (versionExpanded == null ? '' : '&versionExpanded=1') +
          (predictionMetricVersion != null ? '&predictionMetricVersion=' + encodeURIComponent(predictionMetricVersion) : '') +
          (modelMonitorVersion != null ? '&modelMonitorVersion=' + encodeURIComponent(modelMonitorVersion) : '') +
          (metricType != null ? '&metricType=' + encodeURIComponent(metricType) : ''),
      );
    }, 0);
  };

  memColumns: (isVersions, metrics, metrics_isRefreshing, metrics_data, detailModelId) => { columns; metrics } = memoizeOne((isVersions, metrics, metrics_isRefreshing, metrics_data, detailModelId) => {
    let columns: ITableExtColumn[] = [
      {
        title: 'Model',
        field: 'name',
        render: (text, row, index) => <span className={sd.linkBlue}>{text}</span>,
      },
    ];

    if (!metrics || metrics_isRefreshing) {
      metrics = [];
    } else {
      metrics = metrics_data;

      if (metrics && _.isArray(metrics) && metrics.length > 0) {
        let columnsList = metrics[0].metricNames;
        if (columnsList && _.isArray(columnsList)) {
          columns.push({
            title: '',
            field: ['metrics', 'intName'],
          });
          columnsList.some((c1) => {
            let kk = Object.keys(c1);
            if (kk && kk.length > 0 && kk[0]) {
              let nameSmall = kk[0];
              let nameLong = c1[nameSmall];

              if (!_.isString(nameSmall) || !_.isString(nameLong)) {
                return false;
              }

              columns.push({
                title: nameLong,
                field: ['metrics', nameSmall],
                render: (text, row, index) => {
                  let res: any = '';
                  let n1 = Utils.tryParseFloat(text, null);
                  if (n1 != null) {
                    res = Utils.roundDefault(n1, 2);
                  } else {
                    res = text;
                  }

                  if (isVersions && row.fvaData?.[nameSmall] && !Utils.isNullOrEmpty('' + (res || ''))) {
                    res = (
                      <span>
                        {res}
                        <FontAwesomeIcon
                          className={s.icon}
                          onClick={metrics_data?.length > 1 ? this.onClickChartFva.bind(this, row, nameSmall) : null}
                          onMouseEnter={(e) => this.onHoverChartFva.bind(this, nameSmall, true, e)}
                          onMouseLeave={(e) => this.onHoverChartFva.bind(this, nameSmall, false, e)}
                          icon={['far', 'chart-scatter']}
                          transform={{ size: 18, x: 0, y: 0 }}
                          style={{ cursor: 'pointer', marginLeft: '9px' }}
                        />
                      </span>
                    );
                  }
                  return res;
                },
              });
            }
          });
        }

        if (Utils.isNullOrEmpty(detailModelId)) {
          columns.push({
            title: 'Detail',
            render: (text, row, index) => {
              return (
                <Button type={'primary'} ghost onClick={this.onClickDetailsMetrics.bind(this, row.modelId, row.modelId)}>
                  Details
                </Button>
              );
            },
          });
        }
      }
    }

    return { columns, metrics };
  });

  memTrainRes: (trainValue, testValue) => { optionsTrain; optionsTest; trainValue; testValue } = memoizeOne((trainValue, testValue) => {
    let optionsTrain = [],
      optionsTest = [];
    let ind = 5;
    for (let i = 0; i < 20; i++) {
      let obj1 = {
        value: '' + ind,
        label: '' + ind + '%',
      };

      if (i === 15 && trainValue == null) {
        trainValue = obj1;
      }
      if (i === 3 && testValue == null) {
        testValue = obj1;
      }

      optionsTrain.push(obj1);
      optionsTest.push(obj1);

      ind += 5;
    }
    return { optionsTrain, optionsTest, trainValue, testValue };
  });

  memFvaCharts = memoizeOne((fvaData, less830WW) => {
    if (fvaData) {
      const useShow = fvaData?.find((f1) => f1.show != null);
      return fvaData
        .map((d1: { row; data; nameSmall; shortName; show }, d1ind) => {
          if (useShow) {
            if (!d1.show) {
              return null;
            }
          }

          let data1 = [];
          d1.data?.reaiXCoords?.some((p1, p1ind) => {
            let x = d1.data.reaiXCoords[p1ind];
            let y = d1.data.reaiYCoords[p1ind];
            data1.push({
              x,
              y,
              pointWidth: 4,
            });
          });

          let title1 = 'Forecast Value Added';

          let nameCalcRowSmallName1 = d1.shortName ?? d1.nameSmall?.toUpperCase();
          let chart1 = {
            data: data1,
            title: title1,
            isScatter: true,
            titleX: 'Coefficient of Variation',
            titleY: nameCalcRowSmallName1 || 'Y',
            useTitles: true,
            customPoints: true,
            xlim: d1.data?.xlim,
            ylim: d1.data?.ylim,
            lines: d1.data?.lines,
            divisorX: 5,
            divisorY: 5,
            chartHelpIdTopRight: 'chart_Forecast Value Added_' + (nameCalcRowSmallName1 ?? ''),
            axisXrenderValue: (value) => Utils.decimals(value, 3),
            axisYrenderValue: (value) => Utils.decimals(value, 3),
          };

          const ww = less830WW / 2 - 4;
          const hh = 260 + 20;
          return (
            <span
              key={'ch_fva_' + d1ind}
              ref={(r1) => {
                this.refsCharts['fva' + d1.nameSmall] = r1;
              }}
              style={{ display: 'inline-block', width: ww /*380+12*2*/ + 'px', height: hh + 12 * 2 + 20 + 'px', marginRight: d1ind === 0 ? 8 : 0 }}
              className={s.chart}
            >
              <ChartXYExt height={hh} data={chart1} />
            </span>
          );
        })
        .filter((v1) => v1 != null);
    }
  });

  memFvaData: (metrics, detailModelId) => { row; data; nameSmall; shortName; show }[] = memoizeOne((metrics, detailModelId) => {
    if (metrics && metrics.length > 0) {
      let fvaDatas: { row; data; nameSmall; shortName; show }[] = [];
      let m1 = metrics.find((m1) => m1.modelId === detailModelId);
      if (m1) {
        let columnsList = m1.metricNames;
        if (columnsList && _.isArray(columnsList)) {
          columnsList.some((c1) => {
            let kk = Object.keys(c1);
            if (kk && kk.length > 0 && kk[0]) {
              let nameSmall = kk[0];
              if (m1.fvaData?.[nameSmall]) {
                const data1 = m1.fvaData[nameSmall];

                const shortName = data1?.shortName;
                const show = data1?.show;
                fvaDatas.push({ row: m1, data: data1, nameSmall, shortName, show });
              }
            }
          });
          return fvaDatas;
        }
      }
    }
  });

  memModelForceOption = memoizeOne((listModels, detailModelId) => {
    let r1 = listModels?.toJS()?.find((m1) => m1?.modelId === detailModelId);
    if (r1 != null) {
      return { label: r1?.name + ' - ' + (r1?.latestModelVersion?.modelVersion ?? '-'), value: r1.modelId };
    }
    return null;
  });

  memModelsOptions = memoizeOne((listModels, modelsIdsAnyCompleteVersion) => {
    let optionsModels = [];
    if (listModels) {
      listModels.some((m1) => {
        if (modelsIdsAnyCompleteVersion != null && _.isArray(modelsIdsAnyCompleteVersion)) {
          if (!modelsIdsAnyCompleteVersion.includes(m1.get('modelId'))) {
            return false;
          }
        }

        let obj1 = {
          value: m1.get('modelId'),
          label: (
            <span style={{ fontWeight: 600 }}>
              {m1.get('name')} - Version {m1.getIn(['latestModelVersion', 'modelVersion'])}
            </span>
          ),
          name: m1.get('name'),
          createdAt: m1.get('createdAt'),
        };
        optionsModels.push(obj1);
      });
    }

    optionsModels &&
      optionsModels.sort((a, b) => {
        return (b.createdAt || '').toLowerCase().localeCompare((a.createdAt || '').toLowerCase());
      });
    if (optionsModels.length > 1) {
      optionsModels.unshift({
        value: '',
        label: <span style={{ fontWeight: 600 }}>{'All'}</span>,
        name: 'All',
      });
    }
    return optionsModels;
  });

  onChangeSelectURLModelOptions = (option1) => {
    this.recreateFolderCache();
    this.setState(
      {
        modelsExpanded: {},
        thresholdTopNRows: null,
        thresholdTopNRowsSend: null,
        thresholdSortByClass: null,
        thresholdSortByClassSend: null,
        validation: undefined,
      },
      () => {
        Location.push('/' + PartsLink.model_metrics + '/' + this.props.paramsProp?.get('projectId'), undefined, 'detailModelId=' + (option1?.value ?? ''));
      },
    );
  };

  memMetricsRender = memoizeOne((forceNoTree, foldersCache, isSmall, isMedium, metrics, metricsData, detailModelId, detailModelVersion, modelsExpanded, metricsAllVersions) => {
    if (metrics != null && _.isArray(metrics) && metrics?.length === 1 && Utils.isNullOrEmpty(this.props.paramsProp?.get('detailModelId'))) {
      let m1 = metrics?.[0];
      if (m1 != null) {
        setTimeout(() => {
          this.onClickDetailsMetrics(m1.modelId, m1.modelVersion, null);
        }, 0);
        return;
      }
    }
    let getModelId = this.props.paramsProp?.get?.('modelMonitorId');
    let ModelMonitorDetailFound = null;
    if (getModelId) {
      ModelMonitorDetailFound = this.memModelMonitorDetail(false)(this.props.monitoring, getModelId);
    }
    let algorithm = this.props.paramsProp?.get('algorithm');
    const fgTraining = this.memFGTraining(false)(this.props.featureGroupsParam, ModelMonitorDetailFound?.trainingFeatureGroupId);
    const fgPrediction = this.memFGPrediction(false)(this.props.featureGroupsParam, ModelMonitorDetailFound?.predictionFeatureGroupId);
    return (
      <DetailsHeader
        forceNoTree={forceNoTree}
        foldersCache={foldersCache}
        metrics={metrics}
        metricsData={metricsData}
        detailModelId={detailModelId}
        detailModelVersion={detailModelVersion}
        modelsExpanded={modelsExpanded}
        metricsAllVersions={metricsAllVersions}
        showLeadModel={false}
        showLeadModelForDefaultOne={false}
        fgTraining={fgTraining}
        fgPrediction={fgPrediction}
        onClickDetailsMetrics={this.onClickDetailsMetrics}
        isMedium={isMedium}
        isSmall={isSmall}
        algorithm={algorithm}
      />
    );
  });

  memMetricsRenderDetail = memoizeOne((forceNoTree, foldersCache, metrics, metricsData, detailModelId, detailModelVersion, modelsExpanded, metricsAllVersions, showLeadModel, showLeadModelForDefaultOne, foldIntegrity) => {
    return metrics?.[0]?.rawMetricsForUi?.numClusters && metrics?.[0]?.rawMetricsForUi?.silhouetteScore && metrics?.[0]?.rawMetricsForUi?.daviesBouldinScore ? (
      <ClusterMetrics metrics={metrics} />
    ) : (
      <DetailsTables
        updateSortPreference={(val) => this.setState({ sortPreference: val })}
        forceNoTree={forceNoTree}
        foldersCache={foldersCache}
        metrics={metrics}
        metricsData={metricsData}
        detailModelId={detailModelId}
        projectId={this.props.paramsProp?.get('projectId')}
        detailModelVersion={detailModelVersion}
        modelsExpanded={modelsExpanded}
        metricsAllVersions={metricsAllVersions}
        showLeadModel={showLeadModel}
        showLeadModelForDefaultOne={showLeadModelForDefaultOne}
        processNewDataAdditional={this.processNewDataAdditional}
        onHoverChartFva={this.onHoverChartFva}
        onClickChartFva={this.onClickChartFva}
        onClickShowIds={this.onClickShowIds}
        onClickLeadModel={this.onClickLeadModel}
        onClickExpandMoreRows={this.onClickExpandMoreRows}
        onFeatureAnalysis={foldIntegrity ? this.onFeatureAnalysis : null}
        recreateFolderCache={this.recreateFolderCache}
        isRegression={this.isRegression}
      />
    );
  });

  onClickIgnoreCorrelatedAndTrain = (listColumnsToIgnore, e) => {
    let projectId = this.props.paramsProp?.get('projectId');
    let detailModelId = this.props.paramsProp?.get('detailModelId');
    if (detailModelId) {
      REClient_.client_()._setIgnoreAndRetrain(detailModelId, listColumnsToIgnore, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.listModels_(projectId);
          StoreActions.modelsVersionsByModelId_(detailModelId);
          StoreActions.refreshDoModelAll_(detailModelId, projectId);

          this.setState({
            refreshingModelId: detailModelId,
          });
        }
      });
    }
  };

  debounceThreshold = (t1) => {
    this.setState({
      threshold2: t1,
    });
  };

  memMatrixFromCurve = memoizeOne((confusionMatrixData, rocCurve, threshold, isNewConfusionMatrixUseUse, isOtherClass, optionsClassesSelValue) => {
    threshold = threshold ?? 0;
    let thresholdsList = rocCurve?.data?.thresholds;
    if (isNewConfusionMatrixUseUse && optionsClassesSelValue != null) {
      thresholdsList = confusionMatrixData
        ?.map((d1) => {
          let d2 = d1?.find((o1) => o1.actual == optionsClassesSelValue);
          if (d2 == null) {
            return null;
          } else {
            return d2?.threshold ?? null;
          }
        })
        ?.filter((v1) => v1 != null);
    }

    let minValue = null,
      minIndex = null;
    thresholdsList?.forEach?.((t1, t1ind) => {
      let abs1 = Math.abs(threshold - t1);
      if (minValue == null || abs1 < minValue) {
        minValue = abs1;
        minIndex = t1ind;
      }
    });
    return confusionMatrixData?.[minIndex];
  });

  memMetricCharts = memoizeOne(
    (
      isNewModelSetThreshold,
      isNewConfusionMatrixUseUse,
      isNlp,
      metrics,
      detailModelVersion,
      less830WWnone,
      wwLess830,
      isInline,
      fvaData,
      detailModelDeployId,
      isForecasting,
      isDemandForecasting,
      detailModelId,
      refreshingModelId,
      thresholdDebounce,
      thresholdStep,
      threshold2,
      thresholdClass1,
      optionsClassesSelValue,
      optimizeThresholdSel,
      thresholdTopNRows,
      thresholdSortByClass,
      msgLimit100k,
    ) => {
      if (detailModelVersion && metrics) {
        const metricOne = metrics.find((m1) => m1.modelVersion === detailModelVersion || m1.predictionMetricVersion === detailModelVersion || m1.modelMonitorVersion === this.props.monitorVersion);
        let metricList1 = metricOne?.metricsCharts?.filter((v1) => v1 != null);
        let featureImportanceCharts = metricOne?.featureImportanceCharts;

        const processChartFeatures = (chartFeatures) => {
          if (chartFeatures?.data != null && chartFeatures?.data?.dataDownload == null) {
            if (chartFeatures?.data?.featureNames != null && chartFeatures?.data?.features != null) {
              chartFeatures.data.dataDownload = {};

              chartFeatures.data.dataDownload.featureNames = [...(chartFeatures.data.featureNames ?? [])];
              chartFeatures.data.featureNames = chartFeatures?.data?.featureNames?.slice(0, 20)?.map((s1) => {
                const max = 120;
                if (s1 != null && _.isString(s1) && s1.length > max) {
                  s1 = s1.substring(0, max) + '...';
                }
                return s1;
              });

              chartFeatures.data.dataDownload.features = chartFeatures.data.features;
              chartFeatures.data.features = chartFeatures?.data?.features?.slice(0, 20);
              chartFeatures.data.totalFeatures = chartFeatures.data.features.length ?? 0;
              chartFeatures.data.dataDownload.data = chartFeatures.data.dataDownload.featureNames?.map((d1, d1ind) => ({ x: d1, importance_score: Math.abs(chartFeatures.data.dataDownload?.features?.[d1ind] ?? 0) }));
            }
          }

          let nullFeatureDependence = metricOne?.nullFeatureDependence;
          if (nullFeatureDependence != null && chartFeatures?.data != null) {
            let barColors = new Array(chartFeatures?.data?.featureNames?.length ?? 0).fill(0);
            chartFeatures?.data?.featureNames?.some((f1, f1ind) => {
              let v1 = nullFeatureDependence?.[f1];
              if (_.isNumber(v1)) {
                if (v1 > 1) {
                  barColors[f1ind] = 4; //6;
                  return;
                } else if (v1 > 0) {
                  barColors[f1ind] = 4;
                  return;
                }
              }
            });
            chartFeatures.data.bottomLineHH = 40;
            chartFeatures.data.bottomLine = (
              <div
                css={`
                  text-align: center;
                  font-size: 13px;
                  font-family: Matter;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                `}
              >
                <div
                  css={`
                    margin-right: 8px;
                    width: 20px;
                    height: 14px;
                    border-radius: 2px;
                    background: linear-gradient(180deg, ${ColorsGradients[4].from}, ${ColorsGradients[4].to});
                  `}
                ></div>
                <span>Presence/absence of column is key determinant in feature importance</span>
              </div>
            );
            chartFeatures.data.forceColorIndexEachBar = barColors;
          }

          return chartFeatures;
        };

        if (metricList1 != null) {
          let chartFeatures = metricList1.find((c1) => {
            if (c1?.data?.totalFeatures != null && c1?.data?.featureNames != null && c1?.data?.features != null) {
              return true;
            } else {
              return false;
            }
          });

          if (featureImportanceCharts != null) {
            metricList1.splice(metricList1.indexOf(chartFeatures), 1);
            chartFeatures = null;
          }

          if (chartFeatures != null) {
            chartFeatures = processChartFeatures(chartFeatures);
          }
        }

        let featureImportanceRes = null;
        if (featureImportanceCharts != null && !_.isEmpty(featureImportanceCharts)) {
          let charts = [];
          let kk = Object.keys(featureImportanceCharts);
          kk.some((k1) => {
            let v1 = featureImportanceCharts[k1];
            let v2 = processChartFeatures(_.cloneDeep(v1));

            charts.push(v2);
          });

          let def1 = charts?.find((c1) => c1.isDefault);
          if (def1 != null) {
            charts.splice(charts.indexOf(def1), 1);
            charts.unshift(def1);
          }

          let dataCM0 = {
            chart: {
              list: charts?.map((v1) => {
                return {
                  data: _.assign({}, v1.data ?? {}, {
                    ignoreTitle: true,
                  }),
                  title: v1.title,
                  removeTitle: true,
                  beforeTitle: (
                    <span>
                      Feature Importance Type
                      <HelpIcon id={'chart_feature_importance_type_before_dropdown'} style={{ marginLeft: '4px' }} />
                    </span>
                  ),
                  type: 'histogram',
                };
              }),
            },
          };

          featureImportanceRes = (
            <ChartMetricsFull showDownload forMetrics noMax forceColor={ColorsGradients} data={dataCM0} width={wwLess830} height={260} styleBack={{ backgroundColor: '#19232f', paddingTop: '8px', borderRadius: '8px' }} />
          );
        }

        let metricListNew = [];

        const calcBarChartNew = (dm1, barChartName, barChartNameArtifact?, barCharHelpId?) => {
          let vv = dm1?.values,
            vvSecondary = dm1?.valuesSecondary,
            tooltips = new Array(vv?.length ?? 0).fill(null),
            tooltipsSecondary = null;
          let forceColorIndexEachBar = new Array(vv?.length ?? 0).fill(0);

          const maxValueLimit = dm1?.maxValueLimit ?? 1;
          const maxValueTooltip = dm1?.maxValueTooltip ?? '1+';
          if (vv != null && _.isArray(vv) && maxValueLimit != null && maxValueTooltip != null) {
            vv = [...vv];
            let anyLimited = false;
            vv.some((v1, v1ind) => {
              if (v1 > maxValueLimit) {
                vv[v1ind] = maxValueLimit;
                tooltips[v1ind] = maxValueTooltip;
                anyLimited = true;
              }

              if (dm1.colors != null) {
                const col1 = dm1.colors[v1ind];
                forceColorIndexEachBar[v1ind] = col1 === 0 ? 0 : col1 === 1 ? 17 : 13;
              }
            });
            if (!anyLimited) {
              tooltips = [];
            }
          }
          if (vvSecondary != null && _.isArray(vvSecondary) && maxValueLimit != null && maxValueTooltip != null) {
            tooltipsSecondary = new Array(vv?.length ?? 0).fill(null);

            vvSecondary = [...vvSecondary];
            let anyLimited = false;
            vvSecondary.some((v1, v1ind) => {
              if (v1 > maxValueLimit) {
                vvSecondary[v1ind] = maxValueLimit;
                tooltipsSecondary[v1ind] = maxValueTooltip;
                anyLimited = true;
              }

              if (dm1.colors != null) {
                const col1 = dm1.colors[v1ind];
                forceColorIndexEachBar[v1ind] = col1 === 0 ? 0 : col1 === 1 ? 17 : 13;
              }
            });
            if (!anyLimited) {
              tooltipsSecondary = [];
            } else {
              if (tooltips.length === 0) {
                tooltips = new Array(vv?.length ?? 0).fill(null);
              }
            }
          }

          const metricNameTooltip = dm1?.metricNameTooltip || 'nrmse';
          const metricNameTooltipSecondary = dm1?.metricNameTooltipSecondary || 'cNrmse';
          let metricNameTooltipList = null;
          if (metricNameTooltip) {
            metricNameTooltipList = metricNameTooltipList || [];
            metricNameTooltipList.push(metricNameTooltip);
          }
          if (metricNameTooltipSecondary) {
            metricNameTooltipList = metricNameTooltipList || [];
            metricNameTooltipList.push(metricNameTooltipSecondary);
          }

          const titleY = dm1?.titleY || 'nrmse';
          const titleYSecondary = dm1?.titleYSecondary;
          const yAxisMax = dm1?.yAxisMax || 100;
          let dataNew: any = {
            data: {
              classNames: dm1?.labels ?? [],
              nrmse: vv ?? [],
              cNrmse: vvSecondary,
              barEachColor: true,
              fieldNameTooltip: metricNameTooltipList,
              tooltipFormatExt: (v1, dataIndex) => {
                let decimals1 = 2;
                let format1 = null;
                if (dataIndex === 0) {
                  decimals1 = dm1.decimals ?? decimals1;
                  format1 = dm1.format;
                } else if (dataIndex === 1) {
                  decimals1 = dm1.decimalsSecondary ?? decimals1;
                  format1 = dm1.formatSecondary;
                }
                if (_.isNumber(v1)) {
                  v1 = Utils.decimals(v1, decimals1);
                  if (!Utils.isNullOrEmpty(format1)) {
                    v1 += format1;
                  }
                }
                return v1;
              },
              titleY: titleY + (Utils.isNullOrEmpty(titleYSecondary) ? '' : '  |  ' + titleYSecondary),
            },
            yAxisMax,
            title: dm1?.title,
            type: 'histogram',
          };

          if (dm1?.breakdown) {
            dataNew.data.breakdownSort = {
              index: dm1?.breakdownSortByField ?? 0,
              isAsc: dm1?.breakdownSortOrderIsAsc == null ? false : dm1?.breakdownSortOrderIsAsc === true,
            };
            dataNew.data.chartHelpIdTopRight = barCharHelpId || 'chartBreakdownTopRight' + (dm1?.title ?? '');
            dataNew.data.breakdownButtons = (dataIndex = null) => {
              let notUsingIds = detailModelDeployId == null || detailModelDeployId === '' || !isForecasting;

              let showAlert = (linkTo, elem) => <Link to={linkTo as any}>{elem}</Link>;
              if (Utils.isNullOrEmpty(detailModelDeployId)) {
                let onClickCreateDeployment = () => {
                  Location.push('/' + PartsLink.deploy_create + '/' + detailModelId + '/' + this.props.paramsProp?.get('projectId'));
                };

                showAlert = (linkTo, elem) => (
                  <ModalConfirm
                    onConfirm={onClickCreateDeployment}
                    title={`This model doesn't have a deployment, do you want to create one?`}
                    icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                    okText={'Create Deployment'}
                    cancelText={'Cancel'}
                    okType={'primary'}
                  >
                    {elem}
                  </ModalConfirm>
                );
              }

              return (
                <div
                  css={`
                    margin-top: 10px;
                  `}
                >
                  {isForecasting &&
                    showAlert(
                      [
                        '/' + PartsLink.model_predictions + '/' + this.props.paramsProp?.get('projectId') + '/' + detailModelDeployId,
                        `idsList=true&idsBarChart=${encodeURIComponent(barChartName)}&idsDetailModelVersion=${encodeURIComponent(detailModelVersion)}&idsDataIndex=${dataIndex}`,
                      ],
                      <Button
                        css={`
                          margin-bottom: 10px;
                          margin-right: 15px;
                        `}
                        type={'default'}
                      >
                        Subset on Predictions Dashboard
                      </Button>,
                    )}
                  {dataIndex != null &&
                    showAlert(
                      [
                        '/' + PartsLink.deploy_batch + '/' + this.props.paramsProp?.get('projectId') + '/' + detailModelDeployId,
                        `idsList=true&idsBarChart=${encodeURIComponent(barChartName)}&idsDetailModelVersion=${encodeURIComponent(detailModelVersion)}&idsDataIndex=${dataIndex}`,
                      ],
                      <Button
                        css={`
                          margin-bottom: 10px;
                        `}
                        type={'default'}
                      >
                        Batch Predict these IDs
                      </Button>,
                    )}

                  {!notUsingIds && (
                    <div
                      css={`
                        margin-top: 20px;
                        font-size: 13px;
                        opacity: 0.7;
                        text-align: center;
                      `}
                    >
                      (Click on any item Id to visualize the predictions)
                    </div>
                  )}
                </div>
              );
            };

            if (!Utils.isNullOrEmpty(barChartNameArtifact) && detailModelVersion) {
              dataNew.data.exportFG = (tablename: string) => {
                return new Promise<boolean>((resolve) => {
                  if (Utils.isNullOrEmpty(tablename)) {
                    REActions.addNotificationError('Tablename required!');
                    resolve(false);
                    return;
                  }

                  REClient_.client_().exportModelArtifactAsFeatureGroup(detailModelVersion, tablename, barChartNameArtifact, (err, res) => {
                    if (err || !res?.success) {
                      REActions.addNotificationError(err || Constants.errorDefault);
                      resolve(false);
                    } else {
                      resolve(true);

                      let projectId = this.props.paramsProp?.get('projectId');
                      let featureGroupId = res?.result?.featureGroupId;

                      StoreActions.getProjectsById_(projectId);
                      StoreActions.featureGroupsGetByProject_(projectId);
                      StoreActions.featureGroupsVersionsList_(featureGroupId);

                      Location.push('/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + featureGroupId);
                    }
                  });
                });
              };
            }

            dataNew.data.breakdown = dm1.breakdown.map((b1, b1ind) => {
              return b1.ids.map((id1, id1ind) => {
                let vv = [],
                  nn = [],
                  ff = [],
                  dd = [],
                  idLinks = [];
                nn.push('ID');

                const calcLinkId = (idOne) => {
                  if (detailModelDeployId == null || detailModelDeployId === '' || !isForecasting) {
                    return idOne;
                  } else {
                    let dataClusterType = this.calcDataClusterType();
                    return dataClusterType === 'filtered_out_items' ? (
                      <span>{idOne}</span>
                    ) : (
                      <Link usePointer showAsLink to={['/' + PartsLink.model_predictions + '/' + this.props.paramsProp?.get('projectId') + '/' + detailModelDeployId, 'selectedFieldValueId=' + encodeURIComponent('' + idOne)]}>
                        {idOne}
                      </Link>
                    );
                  }
                  // selectedAlgoId=f4a5e0e12&selectedFieldId=Store&selectedFieldValueId=50&showTime=false'}>{text}</Link>
                };

                idLinks.push(calcLinkId(b1.ids[id1ind]));
                vv.push(b1.ids[id1ind]);
                ff.push(null);
                dd.push(null);

                if (b1.values) {
                  nn.push(b1.valuesMetricName);
                  idLinks.push(calcLinkId(b1.values[id1ind]));
                  vv.push(b1.values[id1ind]);
                  ff.push(b1.valuesFormat);
                  dd.push(b1.valuesDecimals);
                }
                if (b1.valuesSecondary) {
                  nn.push(b1.valuesSecondaryMetricName);
                  idLinks.push(calcLinkId(b1.valuesSecondary[id1ind]));
                  vv.push(b1.valuesSecondary[id1ind]);
                  ff.push(b1.valuesSecondaryFormat);
                  dd.push(b1.valuesSecondaryDecimals);
                }
                if (b1.valuesTertiary) {
                  nn.push(b1.valuesTertiaryMetricName);
                  idLinks.push(calcLinkId(b1.valuesTertiary[id1ind]));
                  vv.push(b1.valuesTertiary[id1ind]);
                  ff.push(b1.valuesTertiaryFormat);
                  dd.push(b1.valuesTertiaryDecimals);
                }

                return {
                  quartileMetrics: b1.quartileMetrics,
                  names: nn,
                  values: vv,
                  format: ff,
                  decimals: dd,
                  idLinks,
                };
              });
            });
          }

          let tooltipsList = null;
          if (tooltips.length > 0) {
            if (!tooltipsSecondary || tooltipsSecondary.length === 0) {
              tooltipsList = tooltips.map((t1, ind) => [t1]);
            } else {
              tooltipsList = tooltips.map((t1, ind) => [t1, tooltipsSecondary[ind]]);
            }
          }
          if (tooltipsList != null) {
            dataNew.data.tooltips = tooltipsList;
          }

          if (forceColorIndexEachBar.length > 0) {
            dataNew.data.forceColorIndexEachBar = forceColorIndexEachBar;
          }
          if (dataNew.yAxisMax == null) {
            dataNew.yAxisMax = vv?.reduce((acc, val) => {
              return Math.max(acc, val);
            });
          }

          return dataNew;
        };

        let useShow = fvaData?.find((f1) => f1.show != null);

        if (metricOne?.detailedMetrics?.barChart != null && !_.isEmpty(metricOne?.detailedMetrics?.barChart)) {
          if (useShow || metricOne?.metrics?.smape != null) {
            const dm1 = metricOne?.detailedMetrics.barChart;
            metricListNew.push(calcBarChartNew(dm1, 'barChart', 'bar_chart'));
          }
        }
        if (metricOne?.detailedMetrics?.barChartVolume != null && !_.isEmpty(metricOne?.detailedMetrics?.barChartVolume)) {
          if (useShow || metricOne?.metrics?.smape != null) {
            const dm1 = metricOne?.detailedMetrics.barChartVolume;
            metricListNew.push(calcBarChartNew(dm1, 'barChartVolume', 'bar_chart_volume'));
          }
        }
        if (metricOne?.detailedMetrics?.barChartAccuracyByHistory != null && !_.isEmpty(metricOne?.detailedMetrics?.barChartAccuracyByHistory)) {
          if (useShow || metricOne?.metrics?.smape != null) {
            const dm1 = metricOne?.detailedMetrics.barChartAccuracyByHistory;
            metricListNew.push(calcBarChartNew(dm1, 'barChartAccuracyByHistory', 'bar_chart_history', 'chart_Breakdown_accuracy_over_history_length'));
          }
        }
        if (metricListNew.length > 0) {
          metricList1 = metricListNew;
        }

        let resCurve = this.memRenderROC(metricOne, metricOne?.rocCurve, wwLess830, this.state.thresholdDebounce, this.state.thresholdStep, this.state.threshold);

        let isNewConfusionMatrixUse = isNewConfusionMatrixUseUse,
          confMatrixChartData = null,
          defaultSortByClass = null;
        if (!isNewModelSetThreshold) {
          isNewConfusionMatrixUse = false;
        }

        let rocCurveOnListIndex = _.findIndex(metricList1 ?? [], (m1) => m1?.[0]?.isCurve);

        let confusionMatrixData = metricOne?.confusion;
        let confusionMatrixDataOri = confusionMatrixData;
        if (confusionMatrixData != null && _.isArray(confusionMatrixData) && _.isArray(confusionMatrixData[0])) {
          let curveData = metricList1?.[rocCurveOnListIndex]?.find((c1) => c1?.confusionThresholds);
          if (curveData) {
            let isOtherClass = optionsClassesSelValue != thresholdClass1 && optionsClassesSelValue != null;
            confusionMatrixData = this.memMatrixFromCurve(confusionMatrixData, curveData, this.state.threshold2, isNewConfusionMatrixUseUse, isOtherClass, optionsClassesSelValue ?? thresholdClass1);
          } else {
            confusionMatrixData = null;
          }
        }

        let nlpChartData = metricList1?.[rocCurveOnListIndex];

        let confusionMatrix = null;
        let confusionMatrixTop = null;
        let topNText = null;
        let data1ForChart = [];
        if (metricList1?.length) {
          let mml = [...metricList1];

          let data1: any = {
            chart: metricList1[0],
          };
          mml.splice(0, 1);
          if (mml.length) {
            data1.secondaryChart = metricList1[1];
            mml.splice(0, 1);
          } else if (resCurve != null) {
            data1.secondaryChart = resCurve;
          }

          if (isNlp || rocCurveOnListIndex > -1) {
            data1 = {};
          } else {
            metricList1 = mml;
          }
          if (this.props.modelMonitorVersion || this.props.predictionMetricVersion) {
            if (_.isEmpty(data1) || _.isEmpty(data1?.chart)) {
              data1 = {};
            }
          }

          data1ForChart = [data1];
        }

        const hh0 = 260 + 20 + 12 * 2 + 20;

        if (metricOne?.confusion != null && confusionMatrixData != null) {
          let matrix: any = [];

          let totals: any = {};
          confusionMatrixData?.some((d1) => {
            let sum1 = 0,
              line = ['Actual: ' + (d1.actual ?? '-')];
            d1.predicted?.some((v1) => {
              if (_.isNumber(v1)) {
                sum1 += v1;
              }
              line.push(v1);
            });
            totals[d1.actual] = sum1;
            matrix.push(line);
          });

          let minCM = null,
            maxCM = null;
          let days = confusionMatrixData?.map((d1) => d1.actual).reverse();
          let data: any = [];
          let hours = confusionMatrixData?.map((d1) => d1.actual);
          confusionMatrixData?.some((d1, d1ind) => {
            let pp = d1.predicted;
            pp?.some((p1, p1ind) => {
              if (!hours.includes(p1)) {
                data.push([days.indexOf(d1.actual), p1ind, p1]);

                if (minCM == null || p1 < minCM) {
                  minCM = p1;
                }
                if (maxCM == null || p1 > maxCM) {
                  maxCM = p1;
                }
              }
            });
          });

          data = data.map(function (item) {
            return [item[1], item[0], item[2]];
          });

          //
          let indSel =
            confusionMatrixDataOri == null || !_.isArray(confusionMatrixDataOri) || !_.isArray(confusionMatrixDataOri?.[0]) ? null : _.findIndex(confusionMatrixDataOri, (d1) => (d1 as any)?.find((d2) => d2?.selected === true) != null);
          if (indSel != null && indSel > -1) {
            let d1 = confusionMatrixDataOri?.[indSel];
            let classSel1 = optionsClassesSelValue ?? thresholdClass1;
            let actualSelInd = _.findIndex(d1, (o1) => (o1 as any)?.actual == classSel1);
            let tt1 = d1?.[actualSelInd ?? 0]?.threshold;
            if (tt1 != null && tt1 >= 0 && (this.usedThresholdAlreadyDebounceTT !== tt1 || this.usedThresholdAlreadyDebounce !== detailModelVersion)) {
              this.usedThresholdAlreadyDebounce = detailModelVersion;
              this.usedThresholdAlreadyDebounceTT = tt1;

              this.setState({
                threshold: tt1,
                threshold2: tt1,
                thresholdStatic: tt1,
                thresholdDebounce: tt1,
                thresholdStaticInit: tt1,
              });
            }
          }

          //
          let axisXlabels = hours?.map((s1) => 'Predicted: ' + s1);
          if (axisXlabels) {
            matrix.unshift([null, ...axisXlabels]);
          }

          const reduceIfLenMax = (list) => {
            if (!list) {
              return list;
            }

            let maxLen = 0;
            list?.some((s1) => {
              maxLen = Math.max(maxLen, s1?.length ?? 0);
            });

            let max1 = 24;
            if (maxLen > max1) {
              list = list?.map((s1) => (s1?.length > max1 ? s1.substring(0, max1) + '...' : s1));
            }

            return list;
          };

          let dataCM = {
            animation: false,
            grid: {
              height: '80%',
              top: '12%',
              containLabel: true,
            },
            xAxis: {
              type: 'category',
              data: reduceIfLenMax(axisXlabels),
              position: 'top',
              splitArea: {
                show: true,
              },
              axisLabel: {
                color: '#8798ad',
              },
            },
            yAxis: {
              type: 'category',
              data: reduceIfLenMax(days)?.map((s1, s1ind) => 'Actual: ' + s1 + (totals[s1] == null ? '' : '\n(' + totals[s1] + ')')),
              splitArea: {
                show: true,
              },
              axisLabel: {
                color: '#8798ad',
                lineHeight: 20,
              },
            },
            label: {
              color: '#ffffff',
            },
            visualMap: {
              min: minCM,
              max: maxCM,
              show: false,
              calculable: true,
              orient: 'horizontal',
              left: 'center',
              bottom: '15%',
              inRange: {
                color: ['#9137ff', '#4b00a7'],
              },
            },
            series: [
              {
                name: 'Confusion Matrix',
                type: 'heatmap',
                data: data,
                label: {
                  show: true,
                },
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                  },
                },
              },
            ],
          };

          let thresholdStep = this.state.thresholdStep ?? 0.01;

          const styleMark1 = { color: 'white', opacity: 0.8, fontSize: '12px' };
          let topElem = (
            <div css={``}>
              <div
                css={`
                  display: flex;
                  ${isNewConfusionMatrixUse ? `gap: 5px; flex-direction: column;` : 'justify-content: center; align-items: center; '}
                `}
              >
                <span
                  css={`
                    margin-right: 10px;
                    font-size: 14px;
                  `}
                >
                  Threshold:
                  <HelpIcon id={'threshold_metrics_threshold'} style={{ marginLeft: '4px' }} />
                </span>
                <span
                  css={`
                    display: flex;
                    align-items: center;
                  `}
                >
                  <span
                    css={`
                      width: 200px;
                      display: inline-block;
                    `}
                  >
                    <Slider
                      marks={{ 0: { label: '0', style: styleMark1 }, 1: { label: '1', style: styleMark1 } /*0.5: { label: '0.5', style: styleMark1, },*/ }}
                      min={0}
                      step={thresholdStep}
                      max={1}
                      value={this.state.thresholdDebounce}
                      onChange={this.onChangeThresholdSlider}
                      onAfterChange={this.onChangeThresholdAfter}
                    />
                  </span>
                  <span
                    css={`
                      padding-left: 8px;
                      width: 90px;
                      display: inline-flex;
                      opacity: 0.8;
                    `}
                  >
                    Score: {Utils.decimals(this.state.thresholdDebounce, 3)}
                  </span>
                </span>
              </div>
            </div>
          );

          if (confusionMatrixDataOri != null && _.isArray(confusionMatrixDataOri) && _.isArray(confusionMatrixDataOri[0])) {
            //
          } else {
            topElem = null;
          }

          let dataCM0: any = {
            chart: {
              data: {
                topElem: isNewConfusionMatrixUse ? undefined : topElem,
                matrix,
                data: dataCM,
              },
              title: 'Confusion Matrix',
              type: 'heatmap',
            },
          };

          if (isNewConfusionMatrixUse) {
            confMatrixChartData = dataCM0;
          } else if (resCurve != null) {
            dataCM0.secondaryChart = resCurve;
          }

          if (isNewConfusionMatrixUse) {
            let classSel1 = optionsClassesSelValue ?? thresholdClass1;
            let all_labels = metricOne?.metrics?.className?.[0];

            let optionsClasses = all_labels?.map((s1) => ({ label: '' + s1, value: s1 })) ?? [];
            const onChangeLabel = (o1) => {
              this.setState({
                optionsClassesSelValue: o1?.value,
              });
            };

            const calcOptimalThreshold = (optionsClassesSelValue) => {
              let v1 = metricOne?.optimalThresholds;
              if (v1 != null && _.isArray(v1)) {
                let vc = optionsClassesSelValue;
                if (Utils.isNullOrEmpty(vc)) {
                  return null;
                } else {
                  let ind1 = _.findIndex(all_labels ?? [], (s1) => {
                    if (_.isString(s1) && _.isString(vc)) {
                      return (s1 as string)?.toUpperCase() === vc?.toUpperCase();
                    } else {
                      return s1 === vc;
                    }
                  });
                  if (ind1 > -1) {
                    return v1?.[ind1];
                  } else {
                    return null;
                  }
                }
              } else if (v1 != null && _.isObject(v1)) {
                return v1;
              } else {
                return null;
              }
            };

            let predictClassOptimalThreshold = calcOptimalThreshold(classSel1);

            let optionsOptimize = [
              { label: 'Custom', value: null, data: this.state.thresholdStatic },
              { label: 'Accuracy', value: 'acc', data: predictClassOptimalThreshold?.acc },
              { label: 'F1 Score', value: 'f1', data: predictClassOptimalThreshold?.f1 },
            ];
            optionsOptimize = optionsOptimize.filter((o1) => o1.data !== undefined);

            const onChangeOptimize = (option1) => {
              let v1 = option1?.value;

              let tt1 = optionsOptimize?.find((o1) => o1.value == v1)?.data;
              this.setState({
                threshold: tt1,
                threshold2: tt1,
                thresholdDebounce: tt1,
                optimizeThresholdSel: v1,
              });
            };

            let optionsTopN = [];
            for (let i = 10; i < 100; i += 10) {
              optionsTopN.push(i);
            }
            for (let i = 500; i < 10000; i += 500) {
              optionsTopN.push(i);
            }
            optionsTopN = optionsTopN.map((n1) => ({ label: '' + n1, value: n1 }));
            optionsTopN.unshift({ label: 'All Testing Rows', value: null });

            let optionsSortByClass = all_labels?.map((s1) => ({ label: s1, value: s1 })) ?? [];

            let supportList = metricOne?.metrics?.support?.[0];
            if (supportList != null) {
              if (supportList?.[0] <= supportList?.[1]) {
                defaultSortByClass = all_labels?.[0];
              } else {
                defaultSortByClass = all_labels?.[1];
              }
            }

            let topNDefault = metricOne?.metrics?.originalTotalRows ?? null;
            if (topNDefault != null) {
              if (_.isArray(topNDefault)) {
                topNDefault = topNDefault?.[0];
              }
              if (!_.isNumber(topNDefault)) {
                topNDefault = null;
              }
            }

            let topNDefaultActual = null;
            supportList?.some((n1) => {
              if (_.isNumber(n1)) {
                topNDefaultActual ??= 0;
                topNDefaultActual += n1;
              }
            });

            const onClickSetThreshold = (e) => {
              let optionsClassesSelValue1 = this.state.optionsClassesSelValue ?? thresholdClass1;
              if (optionsClassesSelValue1 == null || this.state.thresholdDebounce == null) {
                REActions.addNotificationError('Invalid Data!');
                return;
              }

              let projectId = this.props.paramsProp?.get('projectId');
              let modelId = this.props.paramsProp?.get('detailModelId');

              let config1 = _.assign({}, this.state.optionsConfigInit ?? {}, { model_threshold: this.state.thresholdDebounce, model_threshold_class: optionsClassesSelValue1 });

              REClient_.client_().setModelPredictionParams(modelId, config1, (err, res) => {
                if (err || !res?.success) {
                  REActions.addNotificationError(err || Constants.errorDefault);
                } else {
                  StoreActions.listModels_(projectId);
                  StoreActions.modelsVersionsByModelId_(modelId);
                  StoreActions.getModelDetail_(modelId);

                  StoreActions.resetModelVersionsMetrics_();
                }
              });
            };

            let isSetThresholdDisabled = this.state.thresholdStaticInit === this.state.thresholdDebounce && this.state.thresholdDebounce != null && classSel1 === thresholdClass1 && thresholdClass1 != null;

            const onClickResetTopN = (e) => {
              this.setState({
                thresholdTopNRows: null,
                thresholdTopNRowsSend: null,
                thresholdSortByClass: null,
                thresholdSortByClassSend: null,
              });
            };

            const onTopNChangeModal = (newValue) => {
              this.topNValue = _.assign({}, this.topNValue ?? {}, newValue ?? {});
            };

            let modalTopN = (
              <Provider store={Utils.globalStore()}>
                <div className={'useDark'}>
                  <MetricsModalTopN
                    maxTopN={Math.min(10000, topNDefault ?? 10000)}
                    onChange={onTopNChangeModal}
                    optionsSortByClass={optionsSortByClass}
                    thresholdSortByClass={thresholdSortByClass}
                    thresholdTopNRows={thresholdTopNRows}
                    classSel1={classSel1}
                    topNDefault={topNDefault}
                    defaultSortByClass={defaultSortByClass}
                  />
                </div>
              </Provider>
            );

            const onConfirmPromiseTopNOnClick = () => {
              this.topNValue = { thresholdTopNRows: this.state.thresholdTopNRows ?? topNDefault, thresholdSortByClass: this.state.thresholdSortByClass ?? defaultSortByClass };
            };

            const onConfirmPromiseTopN = () => {
              return new Promise<boolean>((resolve) => {
                if (this.topNValue?.thresholdTopNRows == null) {
                  REActions.addNotificationError('Missing Top N Rows value');
                  resolve(false);
                  return;
                }
                if (this.topNValue?.thresholdSortByClass == null) {
                  REActions.addNotificationError('Missing Sort By Class');
                  resolve(false);
                  return;
                }

                this.setState({
                  thresholdTopNRows: this.topNValue?.thresholdTopNRows,
                  thresholdTopNRowsSend: this.topNValue?.thresholdTopNRows,
                  thresholdSortByClass: this.topNValue?.thresholdSortByClass,
                  thresholdSortByClassSend: this.topNValue?.thresholdSortByClass,
                });

                resolve(true);
              });
            };

            let isNRowsChangedNow = this.state.thresholdTopNRows != null && !Utils.isNullOrEmpty(thresholdSortByClass);
            let showThresholdInside = !isNRowsChangedNow;

            let allowTopNChange = topNDefault != null; // && topNDefault>=4000;

            let topNElem = (
              <span
                css={`
                  margin-left: 10px;
                `}
              >
                <ModalConfirm
                  onClick={onConfirmPromiseTopNOnClick}
                  onConfirmPromise={onConfirmPromiseTopN}
                  title={modalTopN}
                  icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                  okText={'Change'}
                  cancelText={'Cancel'}
                  okType={'primary'}
                  width={900}
                >
                  <Button type={'primary'} size={'small'}>
                    Change
                  </Button>
                </ModalConfirm>
                <HelpIcon id={'threshold_metrics_change_top_n'} style={{ marginLeft: '4px' }} />
              </span>
            );

            confusionMatrixTop = (
              <div css={``}>
                <div
                  css={`
                    padding: 20px 20px;
                    border-radius: 5px;
                    margin: 10px 0 10px 0;
                    flex: 1;
                  `}
                  className={sd.grayPanel}
                >
                  {showThresholdInside && (
                    <div
                      css={`
                        text-align: center;
                        margin: 2px 0 20px;
                        font-size: 14px;
                      `}
                    >
                      <span>
                        Confusion matrix on {topNDefaultActual ?? topNDefault} {'test points'}
                      </span>
                      {allowTopNChange && topNElem}
                    </div>
                  )}
                  {showThresholdInside && (
                    <div
                      css={`
                        gap: 27px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      `}
                    >
                      <span
                        css={`
                          display: flex;
                          gap: 5px;
                          flex-direction: column;
                        `}
                      >
                        <div
                          css={`
                            font-size: 14px;
                            margin-right: 5px;
                          `}
                        >
                          Class:
                          <HelpIcon id={'threshold_metrics_class'} style={{ marginLeft: '4px' }} />
                        </div>
                        <div
                          css={`
                            width: 200px;
                          `}
                        >
                          <SelectExt options={optionsClasses} value={optionsClasses?.find((o1) => o1?.value == classSel1)} onChange={onChangeLabel} />
                        </div>
                      </span>

                      {topElem}

                      <span
                        css={`
                          display: flex;
                          gap: 5px;
                          flex-direction: column;
                        `}
                      >
                        <div
                          css={`
                            font-size: 14px;
                            margin-right: 5px;
                          `}
                        >
                          Optimize For:
                          <HelpIcon id={'threshold_metrics_optimize_for'} style={{ marginLeft: '4px' }} />
                        </div>
                        <div
                          css={`
                            width: 200px;
                          `}
                        >
                          <SelectExt options={optionsOptimize} value={optionsOptimize?.find((o1) => o1?.value == optimizeThresholdSel)} onChange={onChangeOptimize} />
                        </div>
                      </span>
                    </div>
                  )}
                  <div
                    css={`
                      display: flex;
                      justify-content: center;
                      margin: 18px 0 6px 0;
                      align-items: center;
                    `}
                  >
                    <span
                      css={`
                        font-size: 14px;
                      `}
                    >
                      Threshold setting for model deployment: {Utils.decimals(this.state.thresholdStaticInit, 3)}
                    </span>
                    {!isSetThresholdDisabled && !(allowTopNChange && isNRowsChangedNow) && (
                      <Button
                        css={`
                          margin-left: 14px;
                        `}
                        type={'primary'}
                        size={'small'}
                        onClick={onClickSetThreshold}
                      >
                        Click to Change to {Utils.decimals(this.state.thresholdDebounce, 3)} and Class '{optionsClasses?.find((o1) => o1?.value == classSel1)?.label ?? '-'}'
                      </Button>
                    )}
                  </div>

                  {allowTopNChange && isNRowsChangedNow && (
                    <div
                      css={`
                        margin-bottom: 20px;
                        margin-top: 10px;
                        font-size: 15px;
                        text-align: center;
                      `}
                    >
                      <span
                        css={`
                          line-height: 1.5;
                        `}
                      >
                        Default model metrics are calculated based on top {this.state.thresholdTopNRows} predictions sorted on Class '{optionsSortByClass?.find((o1) => o1.value == thresholdSortByClass)?.label ?? '-'}'
                      </span>
                      {allowTopNChange && topNElem}
                      <span
                        css={`
                          margin-left: 15px;
                        `}
                      >
                        <Button type={'primary'} size={'small'} onClick={onClickResetTopN}>
                          Reset
                        </Button>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );

            if (allowTopNChange && isNRowsChangedNow) {
              topNText = (
                <div
                  css={`
                    margin-bottom: 20px;
                    margin-top: 10px;
                    font-size: 15px;
                    text-align: center;
                  `}
                >
                  <span>
                    Default model metrics are calculated based on top {this.state.thresholdTopNRows} predictions sorted on Class '{optionsSortByClass?.find((o1) => o1.value == thresholdSortByClass)?.label ?? '-'}'
                  </span>
                  <span
                    css={`
                      margin-left: 15px;
                    `}
                  >
                    <Button type={'primary'} size={'small'} onClick={onClickResetTopN}>
                      Reset
                    </Button>
                  </span>
                </div>
              );
            }
          }

          let isNRowsChangedNow = this.state.thresholdTopNRows != null && !Utils.isNullOrEmpty(thresholdSortByClass);
          let showThresholdInside = !isNRowsChangedNow;
          const rowCount = dataCM0?.chart?.data?.matrix?.length;
          const colCount = dataCM0?.chart?.data?.matrix?.[0]?.length;
          let modelMonitorVersion = this.props.paramsProp?.get('modelMonitorVersion');
          const allowAddingPayoff = rowCount === 3 && colCount === 3 && !modelMonitorVersion;

          let optionsClassesSelValue1 = this.state.optionsClassesSelValue ?? thresholdClass1;
          const optionsConfig = {
            model_threshold: this.state.thresholdDebounce,
            model_threshold_class: optionsClassesSelValue1,
            payoff_matrix: metricOne?.modelPredictionConfig?.payoffMatrix || {},
          };

          let totalPayoff: any = null;
          if (optionsConfig?.payoff_matrix?.[PAYOFF_MATRIX_TYPES.TP] != null) {
            const cellMap = {
              [PAYOFF_MATRIX_TYPES.TN]: [1, 1],
              [PAYOFF_MATRIX_TYPES.FP]: [1, 2],
              [PAYOFF_MATRIX_TYPES.FN]: [2, 1],
              [PAYOFF_MATRIX_TYPES.TP]: [2, 2],
            };
            totalPayoff = 0;
            Object.entries(cellMap).forEach(([type, coordinates]) => {
              totalPayoff += dataCM0?.chart?.data?.matrix?.[coordinates[0]]?.[coordinates[1]] * optionsConfig.payoff_matrix?.[type];
            });
          }

          let right: any = 20;
          let top = 386;
          if (isNewConfusionMatrixUse && confMatrixChartData != null) {
            right = 'calc(50% + 20px)';
            top = 346;
          }
          confusionMatrix = (
            <div style={{ position: 'relative' }}>
              {showThresholdInside && allowAddingPayoff && <ConfusionMatrixModal data={dataCM0} optionsConfig={optionsConfig} />}
              <ChartMetricsFull
                showDownload={0}
                forMetrics
                noMax
                forceColor={ColorsGradients}
                data={dataCM0}
                width={wwLess830}
                height={340}
                styleBack={{ backgroundColor: '#19232f', paddingTop: '8px', borderRadius: '8px', paddingBottom: totalPayoff == null ? 0 : 30 }}
              />
              {totalPayoff != null && <span style={{ fontSize: 13, right, top, position: 'absolute' }}>{`Total Payoff: ${totalPayoff}`}</span>}
            </div>
          );
        }

        const getPredictionDistribution = (histogramData) => {
          let supportList = metricOne?.metrics?.support?.[0];
          let classList = metricOne?.metrics?.className?.[0];

          let charts = [];
          const legends = Object.keys(histogramData);
          Object.entries(histogramData).forEach(([name, predictions]) => {
            const series = Object.entries(predictions).map(([innerName, distribution]) => {
              let indD = classList?.findIndex?.((item) => item === innerName) ?? -1;
              let div = 1;
              if (indD > -1) {
                div = supportList?.[indD] ?? div;
              }
              return {
                x: innerName,
                y: distribution,
                div,
              };
            });

            let data = [],
              tooltips = [];
            series?.[0]?.y?.forEach((s1, s1ind) => {
              let obj: any = {};
              series?.some((s2, s2ind) => {
                let div = s2?.div ?? 1;
                obj[s2ind] = s2?.y?.[s1ind] / div;

                let indX = s1ind;
                tooltips[indX] = tooltips[indX] ?? [];
                tooltips[indX][s2ind] = Utils.decimals(s2?.y?.[s1ind], 2);
              });
              data.push(obj);
            });

            let chart = {
              title: `${name}`,
              labels: Array.from({ length: data.length }, (v, k) => Utils.decimals((k + 1) / data.length, 3)),
              data,
              tooltips,
            };
            charts.push(chart);
          });

          const data = charts?.map((c1) => {
            let veryLargeLegends = false;
            let legendsUse = legends;
            if (legendsUse != null && _.isArray(legendsUse)) {
              let cc = 0;
              legendsUse.some((l1) => {
                cc += l1?.length ?? 0;
              });
              if (cc > 120) {
                veryLargeLegends = true;
                const maxLen = 24;
                legendsUse = legendsUse?.map((s1) => (('' + s1).length > maxLen ? ('' + s1).substring(0, maxLen) + '...' : s1));
              }
            }

            return {
              data: {
                barsList: c1.labels,
                barsData: c1.data,
                barsX: legends,
                titleX: 'Score',
                titleY: 'Actual Fraction',
                useLegend: !veryLargeLegends,
                fieldNameTooltip: legends,
                tooltips: c1.tooltips,
                chartHelpIdTopRight: 'actual_vs_predicted_score',
              },
              title: c1.title,
              type: 'histogram',
            };
          });

          return <PredictionDistributionChart data={data} width={wwLess830} />;
        };

        const doWorkHistograms = (histogramsDistributionData) => {
          let supportList = metricOne?.metrics?.support?.[0];
          if (supportList != null && !_.isArray(supportList)) {
            supportList = null;
          }
          let classList = metricOne?.metrics?.className?.[0];
          if (classList != null && !_.isArray(classList)) {
            classList = null;
          }

          let charts = [];
          const legend = Object.keys(histogramsDistributionData);
          Object.entries(histogramsDistributionData).forEach((obj) => {
            const [actual, predictions] = obj;
            let series = [];
            Object.entries(predictions).forEach((obj2) => {
              const [prediction, count] = obj2;
              let indD = classList?.findIndex((c1) => c1 === prediction) ?? -1;
              let div1 = 1;
              if (indD > -1) {
                div1 = supportList?.[indD] ?? div1;
              }
              series.push({
                x: prediction,
                y: count,
                div: div1,
              });
            });

            let data1 = [],
              tooltips1 = [];
            series?.[0]?.y?.some((s1, s1ind) => {
              let obj1: any = {};
              series?.some((s2, s2ind) => {
                let div1 = s2?.div ?? 1;
                obj1[s2ind] = s2?.y?.[s1ind] / div1;

                let indX = s1ind; //series?.[0]?.y?.length-1-s1ind;
                tooltips1[indX] = tooltips1[indX] ?? [];
                tooltips1[indX][s2ind] = Utils.decimals(s2?.y?.[s1ind], 2);
              });
              data1.push(obj1);
            });

            let chart = {
              title: '' + actual, // `Test Data Prediction Distribution for class "${actual}"`,
              labels: Array.from({ length: data1.length }, (v, k) => Utils.decimals((k + 1) / data1.length, 3)),
              data: data1,
              tooltips: tooltips1,
            };
            charts.push(chart);
          });

          const list = charts?.map((c1) => {
            let veryLargeLegends = false;
            let legendsUse = legend;
            if (legendsUse != null && _.isArray(legendsUse)) {
              let cc = 0;
              legendsUse.some((l1) => {
                cc += l1?.length ?? 0;
              });
              if (cc > 120) {
                veryLargeLegends = true;
                const maxLen = 24;
                legendsUse = legendsUse?.map((s1) => (('' + s1).length > maxLen ? ('' + s1).substring(0, maxLen) + '...' : s1));
              }
            }

            return {
              data: {
                barsList: c1.labels,
                barsData: c1.data,
                barsX: legend,
                titleX: 'Score',
                titleY: 'Actual Fraction',
                useLegend: !veryLargeLegends,
                fieldNameTooltip: legend,
                tooltips: c1.tooltips,
                chartHelpIdTopRight: 'actual_vs_predicted_score',
              },
              title: c1.title,
              beforeTitle: 'Prediction Distribution',
              type: 'histogram',
            };
          });

          let dataCM0 = { chart: { list } };
          return <ChartMetricsFull showDownload forMetrics noMax forceColor={ColorsGradients} data={dataCM0} width={wwLess830} height={260} styleBack={{ backgroundColor: '#19232f', paddingTop: '8px', borderRadius: '8px' }} />;
        };
        let predictionDistribution = null;
        if (metricOne?.histograms != null && !_.isEmpty(metricOne?.histograms)) {
          predictionDistribution = getPredictionDistribution(metricOne.histograms);
        }
        let eqHistogramsDistribution = null;
        if (metricOne?.eqHistograms != null && !_.isEmpty(metricOne?.eqHistograms)) {
          eqHistogramsDistribution = doWorkHistograms(metricOne.eqHistograms);
        }

        let histogramsPDP = null;
        if (metricOne?.partialDependence != null) {
          let histogramsPDPData = metricOne.partialDependence;

          // let supportList = metricOne?.metrics?.support?.[0];
          // if(supportList!=null && !_.isArray(supportList)) {
          //   supportList = null;
          // }
          // let classList = metricOne?.metrics?.className?.[0];
          // if(classList!=null && !_.isArray(classList)) {
          //   classList = null;
          // }

          let charts = [];
          let legend;
          Object.entries(histogramsPDPData ?? {}).forEach((obj) => {
            let isYNumbers = null,
              isXNumbers = null;

            const [actual, xyValues] = obj as any;
            let series = [];
            let div1 = 1;
            // if(indD>-1) {
            //   div1 = supportList?.[indD] ?? div1;
            // }
            isYNumbers = _.isNumber(xyValues?.yValues?.[0]);
            // if(isXNumbers==null) {
            isXNumbers = !xyValues?.xValues?.some((v1) => !_.isNumber(v1));
            // }
            let isLine = xyValues?.plotType?.toLowerCase() === 'line';

            let data1 = [],
              tooltips1 = [],
              legendC1;

            if (isYNumbers) {
              let yValuesList = xyValues?.xValues ?? [];
              if (isXNumbers) {
                yValuesList = ['y'];
              }
              legendC1 = yValuesList;
              series.push({
                x: 'y',
                y: xyValues?.yValues,
                div: div1,
              });

              series?.[0]?.y?.some((s2, s2ind) => {
                let obj1: any = {};
                if (isXNumbers) {
                  obj1.x = xyValues?.xValues?.[s2ind];
                  obj1.y = s2;
                } else {
                  obj1.x = legendC1?.[s2ind];
                  obj1.y = s2;
                }

                data1.push(obj1);
              });
            } else {
              let yValuesList = Object.keys(xyValues?.yValues?.[0] ?? {}).sort();
              if (legend == null) {
                legend = [...yValuesList];
              }
              yValuesList?.some((k1, k1ind) => {
                series.push({
                  x: k1,
                  y: xyValues?.yValues,
                  div: div1,
                });
              });

              series?.[0]?.y?.some((s1, s1ind) => {
                let obj1: any = {};
                series?.some((s2, s2ind) => {
                  if (isYNumbers && s1ind !== s2ind) {
                    return;
                  }
                  if (isXNumbers) {
                    obj1.x = xyValues?.xValues?.[s1ind] ?? 0;
                  }

                  let div1 = s2?.div ?? 1;
                  obj1[isXNumbers ? s2.x : s2ind] = s2?.y?.[s1ind]?.[s2?.x] / div1;

                  let indX = s1ind;
                  tooltips1[indX] = tooltips1[indX] ?? [];
                  tooltips1[indX][s2ind] = Utils.decimals(s2?.y?.[s1ind], 2);
                });
                data1.push(obj1);
              });
            }

            let chart = {
              title: '' + actual, // `Test Data Prediction Distribution for class "${actual}"`,
              labels: xyValues?.xValues ?? Array.from({ length: data1.length }, (v, k) => Utils.decimals((k + 1) / data1.length, 3)),
              data: data1,
              tooltips: tooltips1,
              legend: legendC1,
              isYNumbers,
              isXNumbers,
            };
            charts.push(chart);
          });

          const axis1Gap = 50;

          let dataCM0 = {
            chart: {
              chartHelpIdList: 'partial_dep_plot',
              list: charts?.map((c1) => {
                let veryLargeLegends = false;
                let legendsUse = c1.legend ?? legend;
                if (legendsUse != null && _.isArray(legendsUse)) {
                  let cc = 0;
                  legendsUse.some((l1) => {
                    cc += l1?.length ?? 0;
                  });
                  if (cc > 120) {
                    veryLargeLegends = true;
                    const maxLen = 24;
                    legendsUse = legendsUse?.map((s1) => (('' + s1).length > maxLen ? ('' + s1).substring(0, maxLen) + '...' : s1));
                  }
                }

                let data2: any = {
                  barsList: c1.labels,
                  barsData: c1.data,
                  barsX: legendsUse,
                  axis1Gap,
                  axisYMin: 'dataMin',
                  noMax: true,
                  titleY: 'Partial Dependence',
                  titleX: 'Feature Value',
                  useLegend: !veryLargeLegends,
                  fieldNameTooltip: legendsUse,
                  tooltips: c1.tooltips,
                  chartHelpIdTopRight: 'pdp_chart',
                  // type: 'histogram',
                };

                if (c1.isYNumbers) {
                  if (c1.sXNumbers) {
                    // c1.data = c1.data?.map((d1, d1ind) => {
                    //   d1 = { 0: d1, };
                    //   return d1;
                    // });
                  } else {
                    data2 = {
                      classNames: c1.data?.map((d1) => d1.x) ?? [],
                      topKCorrelated: c1.data?.map((d1) => d1.y) ?? [],
                      // barsList: c1.labels ?? [],
                      // barsData: c1.data ?? [],
                      // barsX: c1.legend ?? [],
                      useLegend: !veryLargeLegends,
                      axis1Gap,
                      axisYMin: 'dataMin',
                      noMax: true,
                      title: ' ',
                      titleY: 'Partial Dependence',
                      titleX: 'Feature Value',
                      fieldNameTooltip: ['Feature Value'],
                      // forceColorIndexEachBar: colorsList,
                      barEachColor: true,
                      type: 'histogram',
                      chartHelpIdTopRightOverride: 'pdp_chart_float',
                    };
                  }
                }
                if (c1.isXNumbers) {
                  data2 = {
                    data: c1.data ?? [],
                    title: ' ',
                    yAxis: 'Partial Dependence',
                    xAxis: 'Feature Value',
                    useLegend: !(c1.isXNumbers && c1.isYNumbers) && !veryLargeLegends,
                    serieX: 'x',
                    seriesX: 'x',
                    axis1Gap,
                    axisYMin: 'dataMin',
                    noMax: true,
                    seriesYlines: legendsUse ?? ['y'],
                    useOriData: true,
                    maxDecimalsTooltip: 3,
                    fieldNameTooltip: legendsUse ?? ['y'],
                    tooltips: c1.tooltips,
                    type: 'lineList',
                    chartHelpIdTopRightOverride: 'pdp_chart_line',
                  };
                }

                return {
                  data: data2,
                  title: c1.title,
                  removeTitle: true,
                  beforeTitle: 'Partial Dependence Plot For',
                  type: 'histogram',
                };
              }),
            },
          };

          histogramsPDP = <ChartMetricsFull showDownload forMetrics noMax forceColor={ColorsGradients} data={dataCM0} width={wwLess830} height={260} styleBack={{ backgroundColor: '#19232f', paddingTop: '8px', borderRadius: '8px' }} />;
        }

        let quantilesHistogram = null;
        if (isDemandForecasting && metricOne?.detailedMetrics?.allMetrics?.quantile != null && Object.keys(metricOne?.detailedMetrics?.allMetrics?.quantile ?? {}).length > 0) {
          let qq = metricOne?.detailedMetrics?.allMetrics?.quantile;

          let qXX = Object.keys(qq);
          let qXXlargeToSmall = {};
          qXX.some((q1) => {
            let n1 = '' + Utils.tryParseInt(q1.substring(1), 0);
            while (n1.length < 5) {
              n1 = '0' + n1;
            }
            qXXlargeToSmall[n1] = q1;
          });

          let data1 = [];
          let kk = Object.keys(qXXlargeToSmall).sort();
          kk.some((q1, q1ind) => {
            let k1 = qXXlargeToSmall[q1];
            let obj1 = _.assign({}, qq[k1], { qXX: k1, qXXpadding: q1 });
            data1.push(obj1);
          });

          let columns = [
            {
              title: 'Quantile',
              field: 'qXXpadding',
              render: (text, row, index) => {
                return row.qXX?.toUpperCase();
              },
              helpId: 'quantile_histogram_quantile',
            },
            {
              title: 'Excess Inventory',
              field: 'normalizedOver',
              align: 'right',
              render: (text, row, index) => {
                return <span>{Math.round(text * 100)}%</span>;
              },
              helpId: 'quantile_histogram_excess',
            },
            {
              title: 'Unmet Demand',
              field: 'normalizedUnder',
              align: 'right',
              render: (text, row, index) => {
                return <span>{Math.round(text * 100)}%</span>;
              },
              helpId: 'quantile_histogram_unmet',
            },
          ] as ITableExtColumn[];

          quantilesHistogram = (
            <div
              css={`
                max-width: 600px;
              `}
            >
              <div
                css={`
                  margin-bottom: 8px;
                  font-family: Matter;
                  font-size: 18px;
                `}
              >
                Excess Inventory Held and Unmet Demand Metrics
              </div>
              <TableExt dataSource={data1} columns={columns} />
            </div>
          );
        }

        let predictedVsActualScatter = null;
        if (metricOne?.predictedVsActual != null) {
          let predictedVsActualData = metricOne.predictedVsActual;
          let dataCM0 = {
            chart: {
              data: {
                data: predictedVsActualData,
                xAxis: 'Predicted',
                yAxis: 'Actual',
                isScatterMetric: true,
                sameMaxXY: ['x', 'y'],
              },
              title: 'Predicted Vs Actual',
              type: 'scatter',
            },
          };

          predictedVsActualScatter = (
            <ChartMetricsFull
              showDownload
              forMetrics
              noMax
              forceColor={ColorsGradients}
              data={dataCM0}
              width={260 + 24 + 130 /*wwLess830*/}
              height={260 + 130}
              styleBack={{ backgroundColor: '#19232f', paddingTop: '8px', borderRadius: '8px' }}
            />
          );
        }
        //
        let topKCorrelated = null;
        if (
          (metricOne?.correlationCoefficients != null && !_.isEmpty(metricOne?.correlationCoefficients)) ||
          (metricOne?.topKCorrelated != null && metricOne?.ignoreCorrelatedColumns != null && metricOne?.ignoreCorrelatedColumns.length > 0)
        ) {
          let correlationCoefficientsToIgnore = metricOne?.ignoreCorrelatedColumns;
          let dataFI = metricOne?.topKCorrelated;
          dataFI = Object.entries(dataFI).sort((a, b) => {
            let v1 = a[1];
            let v2 = b[1];
            if (v1 === v2) {
              return 0;
            } else if (v1 > v2) {
              return -1;
            } else {
              return 1;
            }
          });

          if (correlationCoefficientsToIgnore != null && correlationCoefficientsToIgnore.length === 0) {
            correlationCoefficientsToIgnore = null;
          }

          let correlationCoefficients = metricOne?.correlationCoefficients;
          let cckk = Object.keys(correlationCoefficients ?? {});
          let correlationCoefficientsList: { name; value }[] = cckk.map((k1, k1ind) => {
            return {
              name: k1,
              value: correlationCoefficients[k1],
            };
          });
          correlationCoefficientsList = correlationCoefficientsList.sort((a, b) => {
            let v1 = a.value ?? 0;
            let v2 = b.value ?? 0;
            if (v1 === v2) {
              return 0;
            } else if (v1 > v2) {
              return -1;
            } else {
              return 1;
            }
          });

          if (correlationCoefficientsList != null) {
            correlationCoefficientsList = correlationCoefficientsList.slice(0, 20);
          }

          let colorNormal = 0;
          let colorRed = 6;

          let namesList = correlationCoefficientsList?.map((v1) => v1?.name);
          let valuesList = correlationCoefficientsList?.map((v1) => v1?.value);

          if (correlationCoefficientsList == null && dataFI != null) {
            namesList = dataFI?.map((e1) => e1[0]);
            valuesList = dataFI?.map((e1) => e1[1]);
          }

          let useRedForK = {};
          correlationCoefficientsToIgnore?.some((e1) => {
            useRedForK[e1] = true;
          });

          let colorsList = namesList?.map((v1) => {
            if (useRedForK[v1]) {
              return colorRed;
            } else {
              return colorNormal;
            }
          });

          let dataF: any = {
            chart: {
              data: {
                classNames: namesList ?? [],
                topKCorrelated: valuesList ?? [],
                titleY: 'Correlation Coefficients',
                fieldNameTooltip: ['Correlation'],
                forceColorIndexEachBar: colorsList,
                barEachColor: true,
              },
              // forceColorIndex: 0,
              title: 'Correlation between target and column',
              type: 'histogram',
            },
          };

          const wwButton = 230;
          let wwChart = less830WWnone;
          if (correlationCoefficientsToIgnore != null) {
            wwChart -= wwButton;
          }

          topKCorrelated = <ChartMetricsFull showDownload forMetrics noMax forceColor={ColorsGradients} data={dataF} width={wwChart} height={260} styleBack={{ backgroundColor: '#19232f', paddingTop: '8px', borderRadius: '8px' }} />;

          const esp1 = 15;
          const correlationButtonHH = 40;

          topKCorrelated = (
            <div
              css={`
                display: flex;
                justify-content: stretch;
                align-items: stretch;
              `}
            >
              <div
                css={`
                  flex: 1;
                `}
              >
                {topKCorrelated}
              </div>
              {correlationCoefficientsToIgnore != null && (
                <div
                  className={sd.classGrayPanel}
                  css={`
                    margin-left: 8px;
                    width: ${wwButton - 8}px;
                    text-align: center;
                    padding: ${esp1}px;
                    position: relative;
                  `}
                >
                  <div
                    css={`
                      margin-bottom: 5px;
                      font-size: 16px;
                      margin-right: 5px;
                    `}
                  >
                    Columns to ignore:
                  </div>
                  <div
                    css={`
                      font-size: 14px;
                      position: absolute;
                      top: ${30 + esp1}px;
                      left: ${esp1}px;
                      right: ${esp1}px;
                      bottom: ${esp1 + correlationButtonHH + 5}px;
                    `}
                  >
                    <NanoScroller onlyVertical>
                      <div
                        css={`
                          white-space: normal;
                        `}
                      >
                        {correlationCoefficientsToIgnore.map((c1, c1ind) => {
                          return (
                            <div
                              key={'ignore_' + c1ind}
                              css={`
                                margin-bottom: 3px;
                              `}
                              className={sd.styleTextGrayLight}
                            >
                              <span>{c1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </NanoScroller>
                  </div>
                  <div
                    css={`
                      text-align: center;
                      position: absolute;
                      height: ${correlationButtonHH}px;
                      left: ${esp1}px;
                      right: ${esp1}px;
                      bottom: ${esp1}px;
                      padding-top: 1px;
                    `}
                  >
                    <ModalConfirm
                      onConfirm={this.onClickIgnoreCorrelatedAndTrain.bind(this, correlationCoefficientsToIgnore)}
                      title={`Do you want to set these columns to ignore and re-train this model?`}
                      icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                      okText={'Yes'}
                      cancelText={'Cancel'}
                      okType={'primary'}
                    >
                      <Button
                        type={'primary'}
                        size={'small'}
                        css={`
                          height: 46px;
                          padding: 0 12px;
                        `}
                      >
                        Ignore correlated columns
                        <br />
                        and train model
                      </Button>
                    </ModalConfirm>
                  </div>
                </div>
              )}
            </div>
          );

          if (!Utils.isNullOrEmpty(this.state.refreshingModelId)) {
            topKCorrelated = (
              <div>
                <div
                  css={`
                    margin: 5px 0 15px 0;
                    font-size: 14px;
                    text-align: center;
                  `}
                >
                  <Alert
                    message={
                      <span>
                        These columns are ignored and a new model is being trained -{' '}
                        <Link className={sd.styleTextBlueBrightColor} usePointer to={'/' + PartsLink.model_detail + '/' + this.state.refreshingModelId + '/' + (this.props.paramsProp?.get('projectId') ?? '-')}>
                          Model Training
                        </Link>
                      </span>
                    }
                    type={'success'}
                  />
                </div>
                {topKCorrelated}
              </div>
            );
          }
        }

        let nlpElem = null;
        if ((isNlp || rocCurveOnListIndex > -1) && metricList1 != null && nlpChartData != null) {
          let noTable = nlpChartData?.[0]?.noTable === true;

          metricList1.splice(
            _.findIndex(metricList1, (v1) => v1 === nlpChartData),
            1,
          );

          let charts = [];
          nlpChartData.some((d1) => {
            let d1Ori = d1;
            d1 = d1?.data;
            if (d1 != null) {
              // d1.className;
              let y = d1.precision;
              let y2 = d1.recall;
              let x = d1.thresholds;

              let data1 = [];
              x?.some((s1, s1ind) => {
                let obj1: any = {};
                obj1.x = s1;
                obj1.y = y?.[s1ind];
                obj1.y2 = y2?.[s1ind];
                data1.push(obj1);
              });

              data1 = data1?.sort((a, b) => {
                return a?.x - b?.x;
              });

              let chart = {
                data: data1,
                title: d1Ori.title,
              };
              charts.push(chart);
            }
          });

          let dataCM0: any = {
            chart: {
              list: charts?.map((c1) => {
                return {
                  data: {
                    topSpace: 30,
                    useTitles: true,
                    tooltips: true,
                    titleX: 'Threshold',
                    titleY: 'Precision',
                    titleY2: 'Recall',
                    serieX: 'x',
                    seriesY: ['y2', 'y'],
                    fieldNameTooltip: ['Recall', 'Precision'],
                    useLegendSeriesIndex: true,
                    maxDecimalsTooltip: 2,
                    data: c1.data,
                    axis1Gap: 50,
                    axis2Gap: 50,
                    axisYdecimals: 2,
                    axisXdecimals: 2,
                    useTwoYAxis: [true],
                    tooltipSeriesInvert: true,
                    lineStyleType: [undefined, undefined], //'dotted'
                    yAxisMaxList: [undefined, undefined],
                    yAxisMinList: [undefined, undefined], //'dataMin'
                    useLegend: true,
                    symbol: ['circle', 'circle'],
                    showSymbolPerc: 0.2,
                    dateOnTooltip: true,
                    chartHelpIdTopRight: 'label_rc',
                  },
                  title: c1.title,
                  type: 'ec',
                };
              }),
            },
          };

          let nlpGridData = metricList1[0];
          if (nlpGridData != null && !noTable) {
            metricList1.splice(0, 1);

            const d1 = nlpGridData?.data;
            const format1 = (v1) => {
              if (v1 == null) {
                return v1;
              }
              if (_.isNumber(v1)) {
                return Utils.decimals(v1, 3);
              } else {
                return v1;
              }
            };
            let data1 =
              d1?.classNames?.map((c1, c1ind) => {
                return {
                  classNames: format1(d1?.classNames?.[c1ind]),
                  precision: format1(d1?.precision?.[c1ind]),
                  recall: format1(d1?.recall?.[c1ind]),
                  support: format1(d1?.support?.[c1ind]),
                  f1: format1(d1?.['f1-score']?.[c1ind]),
                };
              }) ?? [];

            if (isNewConfusionMatrixUse) {
              let diffMin = null,
                th1 = null,
                th1ind = null;
              let diffMin0 = null,
                th10 = null,
                th1ind0 = null;

              let classNames = d1?.classNames;
              let rocCurve1 = metricOne?.prCurvePerLabel;
              if (rocCurve1 != null) {
                let dataPre = classNames?.[0];
                let dataPre0 = classNames?.[1];

                if (dataPre0 == thresholdClass1) {
                  let t1 = dataPre;
                  dataPre = dataPre0;
                  dataPre0 = t1;
                }

                const allLabels = metricOne?.metrics?.className?.[0];
                let rocCurvePre = rocCurve1?.[_.findIndex(allLabels ?? [], (s1) => s1 === dataPre)];
                let rocCurvePre0 = rocCurve1?.[_.findIndex(allLabels ?? [], (s1) => s1 === dataPre0)];

                let classSel1 = optionsClassesSelValue ?? thresholdClass1;
                if (this.state.thresholdDebounce != null) {
                  let ind1 = 0,
                    ind10 = 1;

                  th1 = this.state.thresholdDebounce;
                  if (thresholdClass1 !== classSel1 && th1 != null) {
                    th1 = 1 - th1;

                    ind1 = 1;
                    ind10 = 0;
                  }
                  let thresholdUsed = th1;

                  rocCurvePre?.thresholds?.some((t1, t1ind) => {
                    let diff1 = Math.abs(t1 - thresholdUsed);
                    if (th1 == null || diffMin == null || diff1 < diffMin) {
                      diffMin = diff1;
                      th1 = t1;
                      th1ind = t1ind;
                    }
                  });
                  rocCurvePre0?.thresholds?.some((t1, t1ind) => {
                    let diff10 = Math.abs(t1 - (1 - th1));
                    if (th10 == null || diffMin0 == null || diff10 < diffMin0) {
                      diffMin0 = diff10;
                      th10 = t1;
                      th1ind0 = t1ind;
                    }
                  });

                  let supportList = metricOne?.metrics?.support?.[0];

                  let mm = null;
                  if (th1ind != null && th1ind0 != null && dataPre != null && dataPre0 != null) {
                    if (supportList != null && !_.isArray(supportList)) {
                      supportList = null;
                    }

                    const pre = confusionMatrixData?.find?.((obj) => obj?.actual === dataPre);
                    const pre0 = confusionMatrixData?.find?.((obj) => obj?.actual === dataPre0);
                    mm ??= {};
                    mm[dataPre] = mm[dataPre] ?? {};
                    mm[dataPre].recall = pre?.recall;
                    mm[dataPre].precision = pre?.precision;
                    mm[dataPre].support = supportList?.[_.findIndex(allLabels ?? [], (s1) => s1 === dataPre)];
                    mm[dataPre].f1 = mm[dataPre].precision + mm[dataPre].recall === 0 ? 0 : (2 * (mm[dataPre].precision * mm[dataPre].recall)) / (mm[dataPre].precision + mm[dataPre].recall);

                    mm[dataPre0] = mm[dataPre0] ?? {};
                    mm[dataPre0].recall = pre0?.recall;
                    mm[dataPre0].precision = pre0?.precision;
                    mm[dataPre0].support = supportList?.[_.findIndex(allLabels ?? [], (s1) => s1 === dataPre0)];
                    mm[dataPre0].f1 = mm[dataPre0].precision + mm[dataPre0].recall === 0 ? 0 : (2 * (mm[dataPre0].precision * mm[dataPre0].recall)) / (mm[dataPre0].precision + mm[dataPre0].recall);

                    let div1 = mm[dataPre].support + mm[dataPre0].support;

                    let data2 = [];
                    data1?.some((d1, d1ind) => {
                      let d1v = mm?.[d1?.classNames];
                      if (d1v == null) {
                        return;
                      }

                      let d2: any = {
                        classNames: d1?.classNames,
                        precision: d1v?.precision,
                        recall: d1v?.recall,
                        support: d1v?.support,
                        f1: d1v?.f1,
                      };
                      data2.push(d2);
                    });
                    data1 = data2;
                  }
                }
              }
            }

            let dataForGrid: any = {};
            if (isNewConfusionMatrixUse && confMatrixChartData != null) {
              confMatrixChartData.secondaryChart = dataForGrid;
            } else {
              dataCM0.secondaryChart = dataForGrid;
            }

            let cols22 = [
              {
                title: 'Label',
                field: 'classNames',
              },
              {
                title: 'Precision',
                field: 'precision',
              },
              {
                title: 'Recall',
                field: 'recall',
              },
              {
                title: 'Support',
                field: 'support',
              },
            ] as ITableExtColumn[];

            dataForGrid = _.assign(dataForGrid ?? {}, {
              columns: cols22,
              data: data1 ?? [],
              type: 'grid',
            });

            if (d1?.['f1-score'] != null && d1?.['f1-score']?.length > 0 && dataCM0?.columns != null) {
              dataForGrid.columns.push({
                title: 'F1-Score',
                field: 'f1',
              });
            } else if (isNewConfusionMatrixUse) {
              cols22.push({
                title: 'F1-Score',
                field: 'f1',
              });

              cols22.some((c1) => {
                if (['classNames'].includes(c1.field as any)) {
                  return;
                }

                c1.render = (text, row, index) => {
                  return Utils.decimals(text, 3);
                };
              });
            }
          }

          nlpElem = <ChartMetricsFull forMetrics noMax forceColor={ColorsGradients} data={dataCM0} width={wwLess830} height={260} styleBack={{ backgroundColor: '#19232f', paddingTop: '8px', borderRadius: '8px' }} />;
        }

        let otherCharts = metricList1
          ?.map((c1, c1ind) => {
            if (c1 == null || _.isEmpty(c1?.data)) {
              return null;
            }
            let dataCM0 = {
              chart: {
                data: c1?.data,
                title: c1?.title,
                type: c1?.type || 'histogram',
              },
            };
            return (
              <>
                <ChartMetricsFull
                  key={`oc_ch${c1ind}`}
                  forMetrics
                  noMax
                  forceColor={ColorsGradients}
                  data={dataCM0}
                  // width={wwLess830}
                  width={less830WWnone}
                  height={260}
                  styleBack={{ backgroundColor: '#19232f', paddingTop: 8, borderRadius: 8 }}
                />
                <div key={`oc_se${c1ind}`} style={{ marginTop: 8 }}></div>
              </>
            );
          })
          ?.filter((v1) => v1 != null);

        const isSeparated = metricListNew.length >= 2;
        const colors = ColorsGradients;
        const hasAccuracyVsPredictionChart = !!metricOne?.metrics?.accuracyOverTime?.[0];
        const hasAccuracyVsVolumeChart = !!metricOne?.detailedMetrics?.cumulativeAccuracyByItemChart;
        const hasDecileAnalysisChart = !!metricOne?.metrics?.decileChartPerLabel?.[0];
        const hasItemAttributesChart = !!metricOne?.detailedMetrics?.itemAttributeBreakdown;

        let res = (
          <div style={{ textAlign: 'left', display: isInline ? 'inline-block' : 'block' }}>
            {featureImportanceRes}
            {featureImportanceRes != null && (
              <div
                css={`
                  margin-top: 10px;
                `}
              ></div>
            )}
            {otherCharts}
            {nlpElem}
            {nlpElem != null && (
              <div
                css={`
                  margin-top: 10px;
                `}
              ></div>
            )}
            {confusionMatrix != null && (
              <div
                css={`
                  text-align: center;
                  margin-bottom: 4px;
                `}
              >
                {msgLimit100k}
              </div>
            )}
            {confusionMatrixTop}
            {confusionMatrix}
            {confusionMatrix != null && (
              <div
                css={`
                  margin-top: 10px;
                `}
              ></div>
            )}
            {hasDecileAnalysisChart && <DecileAnalysisChart width={wwLess830} height={240} data={metricOne?.metrics?.decileChartPerLabel[0]} metrics={metricOne} classOfInterests={metricOne?.metrics?.className[0]} />}
            {(hasAccuracyVsVolumeChart || hasAccuracyVsPredictionChart) && (
              <div style={{ display: 'flex', width: '100%', marginBottom: 10 }}>
                {hasAccuracyVsVolumeChart && (
                  <div style={{ flex: '1 1 0%', backgroundColor: '#19232f', borderRadius: 8 }}>
                    <AccuracyVsVolumeChart height={240} data={metricOne?.detailedMetrics?.cumulativeAccuracyByItemChart} />
                  </div>
                )}
                {hasAccuracyVsPredictionChart && (
                  <>
                    <div style={{ flex: '0 0 8px' }} />
                    <div style={{ flex: '1 1 0%', backgroundColor: '#19232f', borderRadius: 8 }}>
                      <AccuracyVsPredictionChart height={240} data={metricOne?.metrics?.accuracyOverTime?.[0]} />
                    </div>
                  </>
                )}
              </div>
            )}
            {hasItemAttributesChart && (
              <div style={{ display: 'flex', width: '100%', marginBottom: 10 }}>
                <div style={{ flex: '1 1 0%', backgroundColor: '#19232f', borderRadius: 8 }}>
                  <ItemAttributesChart height={240} data={metricOne?.detailedMetrics?.itemAttributeBreakdown} />
                </div>
              </div>
            )}
            {data1ForChart?.map?.((chart) => {
              const showChart = chart != null && !_.isEmpty(chart);
              return (
                <>
                  {showChart && (
                    <ChartMetricsFull
                      showDownload
                      sameColors={metricListNew.length > 0}
                      forMetrics
                      forceColor={colors}
                      data={chart}
                      width={isSeparated ? less830WWnone : wwLess830}
                      height={isInline ? hh0 : 260}
                      styleBack={{ backgroundColor: '#19232f', paddingTop: 8, borderRadius: 8, marginBottom: 8 }}
                    />
                  )}
                  {showChart && <div style={{ marginTop: 8 }}></div>}
                </>
              );
            })}
            {topKCorrelated}
          </div>
        );
        let res2 =
          eqHistogramsDistribution != null || predictedVsActualScatter != null || histogramsPDP != null ? (
            <div>
              {predictionDistribution}
              {predictionDistribution != null && (
                <div
                  css={`
                    margin-top: 10px;
                  `}
                ></div>
              )}
              {eqHistogramsDistribution}
              {eqHistogramsDistribution != null && (
                <div
                  css={`
                    margin-top: 10px;
                  `}
                ></div>
              )}
              {predictedVsActualScatter}
              {predictedVsActualScatter != null && (
                <div
                  css={`
                    margin-top: 10px;
                  `}
                ></div>
              )}
              {histogramsPDP}
              {histogramsPDP != null && (
                <div
                  css={`
                    margin-top: 10px;
                  `}
                ></div>
              )}
            </div>
          ) : null;

        let res3 =
          quantilesHistogram != null ? (
            <div>
              {quantilesHistogram}
              {quantilesHistogram != null && (
                <div
                  css={`
                    margin-top: 10px;
                  `}
                ></div>
              )}
            </div>
          ) : null;

        return { res, isSeparated, res2, res3, topNText };
      }
    },
  );

  onChangeThresholdSlider = (v1) => {
    this.setState({
      thresholdDebounce: v1,
    });

    this.debounceThreshold(v1);
  };

  onChangeThresholdAfter = (v1) => {
    this.setState({
      threshold: v1,
      threshold2: v1,
      thresholdStatic: v1,
      thresholdDebounce: v1,
    });
  };

  memRenderROC = memoizeOne((metricOne, rocCurve, wwLess830, thresholdDebounce, thresholdStep, threshold) => {
    if (rocCurve != null) {
      let rocCurveData: any = [];
      rocCurve?.thresholds?.some((t1, ind) => {
        rocCurveData.push({
          x: rocCurve?.falsePositiveRate?.[ind],
          y: rocCurve?.truePositiveRate?.[ind],
          threshold: rocCurve?.thresholds?.[ind],
        });
      });

      rocCurve = {
        colorFixed: ['#f08536', '#3a77b0'],
        startColorIndex: 0,

        data: rocCurveData,
        title: 'Class Threshold',
        titleX: 'False Positive Rate',
        titleY: 'True Positive Rate',
        seriesY: ['y', 'x'],
        fieldNameTooltip: ['True Positive Rate', null, 'False Positive Rate', null],
        useTitles: true,
        useLegend: false,
        maxDecimalsTooltip: 6,
        lineStyleType: [undefined, 'dotted'],
        sameMaxXY: true,
        chartHelpIdTopRight: 'chart_ROC_curve_metrics',
        axisXrenderValue: (value) => Utils.decimals(value, 1),
        axisYrenderValue: (value) => Utils.decimals(value, 1),
      };

      return {
        data: rocCurve,
        title: 'Class Threshold',
        type: 'ec',
        sameMaxXY: true,
      };
    }
  });

  onClickShowIds = (showIds, nameSmall, modelVersion, filterIdsName, longName, e) => {
    if (this.confirmIds != null) {
      this.confirmIds.destroy();
      this.confirmIds = null;
    }

    let { projects, projectId } = this.props;

    let foundProject1 = this.memProjectId(false)(this.props.projectId, this.props.projects);
    let detailModelId = this.props.paramsProp?.get('detailModelId');
    let listDeployments = this.memDeploymentList(false)(this.props.deployments, projectId);
    let anyRes = this.memAnyDeployment(listDeployments, detailModelId);
    let detailModelDeployId = anyRes?.detailModelDeployId;

    let selUseCase = this.memUseCaseSel(false)(this.props.useCases, foundProject1?.useCase);
    let useCaseInfo = this.memUseCaseInfo(selUseCase);
    let displayType = useCaseInfo?.prediction_ui_display_type;
    const isForecasting = displayType === PredictionDisplayType.chart;

    let columns = [
      {
        title: 'ID',
        field: 'id',
      },
    ] as ITableExtColumn[];

    let dataList = (showIds ?? []).map((id1) => {
      return {
        id: id1,
      };
    });

    let dataListJson = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(showIds ?? [], undefined, 2));
    let dataListCsv = 'data:text/plain;charset=utf-8,' + encodeURIComponent(['ID'].concat(showIds ?? []).join('\n'));

    this.confirmIds = confirm({
      title: 'IDS (' + (showIds?.length ?? 0) + ')',
      okText: 'Ok',
      okType: 'primary',
      cancelText: 'Cancel',
      cancelButtonProps: { style: { display: 'none' } },
      maskClosable: true,
      width: 400,
      content: (
        <div css={``}>
          <div
            css={`
              border: 2px solid rgba(0, 0, 0, 0.3);
              padding-right: 4px;
            `}
          >
            <TableExt noAutoTooltip height={300} columns={columns} dataSource={dataList} isVirtual isDetailTheme={false} whiteText />
          </div>
          <div
            css={`
              margin: 25px 0;
              text-align: center;
            `}
          >
            <a
              css={`
                margin-bottom: 10px;
              `}
              href={dataListCsv}
              download={'ids.csv'}
            >
              <Button type={'default'}>Download CSV</Button>
            </a>
            <a
              css={`
                margin-left: 15px;
                margin-bottom: 10px;
              `}
              href={dataListJson}
              download={'ids.json'}
            >
              <Button type={'default'}>Download JSON</Button>
            </a>
          </div>
        </div>
      ),
      onOk: () => {},
      onCancel: () => {},
    });
  };

  onClickExpandAdd = (isExpanded, isAdd, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    let ee = { ...(this.state.addExpanded ?? {}) };
    ee[isAdd] = ee[isAdd] === true ? undefined : true;

    this.setState({
      addExpanded: ee,
    });
  };

  onClickExpandValidation = (isExpanded, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    this.setState({
      validation: this.state.validation === true ? undefined : true,
    });
  };

  onClickExpandMoreRows = (m1Key, e) => {
    let modelsExpanded = this.state.modelsExpanded ?? {};
    modelsExpanded = { ...modelsExpanded };
    modelsExpanded[m1Key] = true;

    this.setState({
      modelsExpanded,
    });
  };

  onFeatureAnalysis = (e) => {
    this.setState({ isFoldIntegrity: true });
    this.refScroller?.current?.scrollTop();
  };

  memMetricsForUI = memoizeOne((metricsData, detailModelVersion) => {
    let data1 = {};
    metricsData?.forEach((md) => {
      data1[md?.algoName ?? md?.name] = md?.rawMetricsForUi;
    });
    return JSON.stringify(data1, undefined, 2);
  });

  memMetricsJson = memoizeOne((lastMetricsData, lastMetricsDataVersion, detailModelVersion) => {
    let data1 = lastMetricsData;
    if (!Utils.isNullOrEmpty(detailModelVersion)) {
      data1 = lastMetricsDataVersion;
    }

    if (data1 != null) {
      if (_.isArray(data1)) {
        data1 = data1.map((d1) => {
          if (_.isObject(d1) && !_.isArray(d1)) {
            d1 = { ...d1 };
            delete d1.metricsCharts;
          }
          return d1;
        });
      } else if (_.isObject(data1)) {
        data1 = { ...data1 };
        delete data1.metricsCharts;
      }
    }

    return 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data1, undefined, 2));
  });

  onChangeSize = (isMedium, isSmall, isLarge) => {
    if (this.state.isMedium === isMedium && this.state.isSmall === isSmall) {
      return;
    }

    this.setState({
      isMedium,
      isSmall,
    });
  };

  onChangeSizeWidth = (ww) => {
    const left0 = $(this.refCenter).offset()?.left ?? 0;

    ww = ww - left0 - 25;

    const maxWW = 2400;
    const less830 = ww < maxWW ? ww : maxWW;

    let ww0 = Math.trunc(ww / 2);
    if (ww > 1400) {
      if (this.state.less830WW !== ww - ww0 - 20 || this.state.less830WW0 !== ww0 || this.state.less830WWtwoRows !== false) {
        this.setState({
          less830WWnone: less830,
          less830WW: ww - ww0 - 20,
          less830WW0: ww0,
          less830WWtwoRows: false,
        });
      }
    } else if (ww < 1000) {
      if (this.state.less830WW !== less830 || this.state.less830WW0 !== less830 || this.state.less830WWtwoRows !== true) {
        this.setState({
          less830WWnone: less830,
          less830WW: less830,
          less830WW0: less830,
          less830WWtwoRows: true,
        });
      }
    } else {
      let ww0 = Math.trunc((ww / 5) * 2);
      if (this.state.less830WW !== ww - ww0 - 20 || this.state.less830WW0 !== ww0 || this.state.less830WWtwoRows !== false) {
        this.setState({
          less830WWnone: less830,
          less830WW: ww - ww0 - 20,
          less830WW0: ww0,
          less830WWtwoRows: false,
        });
      }
    }
  };

  memVersionList = memoizeOne((detailModelId, metricsAllVersions) => {
    let versionsList = null;
    if (detailModelId && metricsAllVersions) {
      versionsList = metricsAllVersions
        .filter((m1) => m1.modelId === detailModelId && m1.trainingCompletedAt != null && m1.trainingCompletedAt !== 0)
        .map((m1) => ({
          modelVersion: m1.modelVersion,
          trainingCompletedAt: m1.trainingCompletedAt,
        }));
    }
    return versionsList
      ?.map((v1) => {
        return v1;
      })
      .filter((v1) => v1 != null);
  });

  onClickViewMetricCharts = (detailModelId, detailModelVersion, algorithm, legacyModelVersion, e) => {
    if (!Utils.isNullOrEmpty(algorithm)) {
      this.setState(
        {
          sessionId: uuid.v1(),
        },
        () => {
          setTimeout(() => {
            Location.replace('/' + PartsLink.model_metrics + '/' + this.props.paramsProp?.get('projectId'), undefined, 'detailModelId=' + Utils.encodeQueryParam(detailModelId) + '&algorithm=' + Utils.encodeQueryParam(legacyModelVersion)); //Utils.encodeQueryParam(algorithm)); @TODO re-enable when algorithm enums are final
          }, 0);
        },
      );
    }
  };

  onClickLeadModel = (detailModelId, algorithm, dataClusterType, e) => {
    if (!Utils.isNullOrEmpty(algorithm)) {
      REClient_.client_()._setLeadModel(detailModelId, algorithm, dataClusterType, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Done!');

          const projectId = this.props.paramsProp?.get('projectId');

          StoreActions.listModels_(projectId);
          StoreActions.modelsVersionsByModelId_(detailModelId);
          StoreActions.getMetricsVersions_(detailModelId);
          StoreActions.getModelDetail_(detailModelId);
          StoreActions.getProjectsById_(projectId);
          StoreActions.resetMetricsVersions_();
          StoreActions.deployList_(projectId, (list) => {
            list?.forEach?.((deployment) => {
              StoreActions.listDeployVersionsHistory_(deployment.deploymentId);
            });
          });

          this.setState(
            {
              sessionId: uuid.v1(),
            },
            () => {
              setTimeout(() => {
                Location.replace(
                  '/' + PartsLink.model_metrics + '/' + this.props.paramsProp?.get('projectId'),
                  undefined,
                  'detailModelId=' + Utils.encodeQueryParam(detailModelId) + '&dataClusterType=' + encodeURIComponent(dataClusterType || ''),
                );
              }, 0);
            },
          );
        }
      });
    }
  };

  memUseCaseInfo = memoizeOne((selUseCase) => {
    if (selUseCase) {
      if (selUseCase.info) {
        let info = selUseCase.info;
        if (_.isString(info)) {
          info = Utils.tryJsonParse(info);
        }
        return info;
      }
    }
  });

  memUseCaseSel = memoizeOneCurry((doCall, useCases, useCase) => {
    if (useCases && useCase) {
      if (useCases.get('isRefreshing')) {
        return;
      }

      if (useCases.get('neverDone')) {
        if (doCall) {
          StoreActions.getUseCases_();
        }
      } else {
        let list = useCases.get('list');
        if (list) {
          return list.find((u1) => u1.useCase === useCase);
        }
      }
    }
  });

  memModelOne = memoizeOne((listModels, detailModelId) => {
    return listModels?.toJS()?.find((m1) => m1?.modelId === detailModelId);
  });

  optionsConfigModelId = null;
  memModelConfigRetrieve = memoizeOne((modelId, modelOne, listDeployments) => {
    if (modelId && modelOne != null && modelId != this.optionsConfigModelId) {
      this.optionsConfigModelId = modelId;

      REClient_.client_()._getModelPredictionConfigOptions(modelId, (err, res) => {
        let r1 = !err && res?.success ? res?.result : null;
        if (r1 != null) {
          const r2 = {
            model_threshold: r1?.modelThreshold?.default,
            model_threshold_class: r1?.modelThresholdClass?.default,
          };

          this.setState({
            optionsConfig: r1,
            optionsConfigInit: r2,
          });
        } else {
          this.setState({
            optionsConfig: null,
            optionsConfigInit: null,
          });
          this.optionsConfigModelId = null;
        }
      });
    }
  });

  memPredictionConfig = memoizeOne((modelOne, optionsConfig) => {
    let thresholdClass1 = modelOne?.modelPredictionConfig?.model_threshold_class;
    if (optionsConfig && thresholdClass1 == null) {
      let th1 = optionsConfig?.modelThresholdClass?.default;
      if (th1 != null) {
        thresholdClass1 = th1;
      }
    }

    let res = modelOne?.modelPredictionConfig?.model_threshold;
    if (optionsConfig && res == null) {
      let th1 = optionsConfig?.modelThreshold?.default ?? optionsConfig?.modelThreshold?.defaultValue;
      if (th1 != null) {
        res = th1;
      }
    }
    return { threshold1: res, thresholdClass1, payoffMatrix: optionsConfig?.payoffMatrix || {} };
  });

  onClickChangeThreshold = (e) => {
    let detailModelVersion = this.props.paramsProp?.get('detailModelVersion');
    if (Utils.isNullOrEmpty(detailModelVersion)) {
      let { projects, projectId } = this.props;
      let listDeployments = this.memDeploymentList(false)(this.props.deployments, projectId);
      let listModels = this.memModelList(false)(this.props.models, projectId);
      let detailModelId = this.props.paramsProp?.get('detailModelId');
      let modelOne = this.memModelOne(listModels, detailModelId);
      detailModelVersion = modelOne?.latestModelVersion?.modelVersion;
    }

    if (!detailModelVersion || !this.props.paramsProp?.get('detailModelId')) {
      return;
    }

    let loc1 = window.location.href;
    loc1 = loc1.substring(loc1.indexOf('://') + 3);
    loc1 = loc1.substring(loc1.indexOf('/'));

    Location.push(
      '/' + PartsLink.set_threshold + '/' + this.props.paramsProp?.get('projectId'),
      undefined,
      'detailModelId=' + encodeURIComponent(this.props.paramsProp?.get('detailModelId')) + '&detailModelVersion=' + encodeURIComponent(detailModelVersion) + '&fromMetricsUrl=' + encodeURIComponent(loc1),
    );
  };

  memDropdownClassesOptions = memoizeOne((metrics, detailModelVersion) => {
    if (detailModelVersion && metrics) {
      const metricOne = metrics.find((m1) => m1.modelVersion === detailModelVersion || m1.predictionMetricVersion === detailModelVersion || m1.modelMonitorVersion === detailModelVersion);
      let list = metricOne?.actualValuesSupportedForDrilldown;
      if (list != null && list.length > 0) {
        return list?.map((s1) => ({ label: s1, value: s1 }));
      }
    }
    return null;
  });

  onChangeMetricValuesOptionsSel = (option1) => {
    this.setState({
      metricValuesOptionsSel: option1?.value,
    });
  };

  onChangeValidation = (e) => {
    let v1 = e.target.checked ? true : undefined;
    this.setState({
      validation: v1,
    });
  };

  memMsgLimit100k = memoizeOne((versionOneTestRes) => {
    if (versionOneTestRes?.rowLimits == null || !_.isNumber(versionOneTestRes?.rowLimits)) {
      return null;
    } else {
      return (
        <span
          css={`
            font-size: 11px;
            font-weight: 300;
          `}
        >
          We consider a maximum of {Utils.decimals(versionOneTestRes?.rowLimits, 0, true)} data points for evaluation.
        </span>
      );
    }
  });

  calcDataClusterType = () => {
    let dataClusterType = this.props.paramsProp?.get('dataClusterType');
    if (!dataClusterType) {
      dataClusterType = null;
    }
    return dataClusterType;
  };

  memDataClusterTypes: (metrics, detailModelId) => { dataClusterTypes: { label?; value?; isSelected?: boolean; topLabel?: string }[]; dataClusterTypesLabel?: string } = memoizeOne((metrics, detailModelId) => {
    if (!metrics || !detailModelId) {
      return null;
    }

    let dataClusterTypes = null;
    let dataClusterTypesLabel = null;
    if (metrics && metrics.length > 0) {
      let m1 = metrics.find((m1) => m1.modelId === detailModelId);
      if (m1) {
        dataClusterTypes = m1?.dataClusterTypes;
        if (dataClusterTypes == null || !_.isArray(dataClusterTypes)) {
          dataClusterTypes = null;
        }

        dataClusterTypesLabel = m1?.dataClusterTypesLabel;
      }
    }

    return { dataClusterTypes, dataClusterTypesLabel };
  });

  render() {
    let foundProject1 = this.memProjectId(false)(this.props.projectId, this.props.projects);
    const isNlp = foundProject1?.isNlp === true;

    let { projects, projectId } = this.props;

    let isRefreshing = false;
    if (projects) {
      isRefreshing = projects.get('isRefreshing');
    }
    if (!foundProject1) {
      isRefreshing = true;
    }

    let modelMonitorVersion = this.props.paramsProp?.get('modelMonitorVersion');
    if (modelMonitorVersion === '') {
      modelMonitorVersion = null;
    }
    let predictionMetricVersion = this.props.predictionMetricVersion;
    if (predictionMetricVersion === '') {
      predictionMetricVersion = null;
    }

    let modelMonitorId = this.props.paramsProp?.get('modelMonitorId');
    if (modelMonitorId === '') {
      modelMonitorId = null;
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let selUseCase = this.memUseCaseSel(false)(this.props.useCases, foundProject1?.useCase);
    let useCaseInfo = this.memUseCaseInfo(selUseCase);
    let isDemandForecasting = foundProject1?.useCase?.toUpperCase() === 'RETAIL';
    let displayType = useCaseInfo?.prediction_ui_display_type;
    const isForecasting = displayType === PredictionDisplayType.chart;
    this.isRegression = useCaseInfo?.ori?.problemType?.toUpperCase() === 'PREDICTIVE_MODELING';

    let listModels = this.memModelList(false)(this.props.models, projectId);
    let anyModelState = this.memModelStates(listModels);

    let detailModelId = this.props.paramsProp?.get('detailModelId');
    let detailModelVersion = this.props.paramsProp?.get('detailModelVersion');
    let algorithm = this.props.paramsProp?.get('algorithm');
    let listDeployments = this.memDeploymentList(false)(this.props.deployments, projectId);
    let monitorVersion = this.props.paramsProp?.get('modelMonitorVersion');
    let metricType = this.props.paramsProp?.get('metricType');
    let modelOne = this.memModelOne(listModels, detailModelId);
    this.memModelConfigRetrieve(detailModelId, modelOne, listDeployments);
    let { threshold1, thresholdClass1, payoffMatrix } = this.memPredictionConfig(modelOne, this.state.optionsConfig) ?? {};
    let anyRes = this.memAnyDeployment(listDeployments, detailModelId);
    let detailModelDeployId = anyRes?.detailModelDeployId;

    if (projectId && !modelMonitorVersion && !predictionMetricVersion) {
      let listDatasetsProj = this.memProjectDatasets(false)(this.props.projectDatasets, projectId);
      let listDatasets = this.memDatasetsList(false)(this.props.datasets, listDatasetsProj);
      let listDatasetCalc = this.memCalcDatasetList(listDatasets, projectId);
      let anyDatasetState = this.memDatasetProjectState(listDatasetCalc);

      if (listModels != null && listDeployments != null && anyRes != null) {
        let msgAction = null,
          onAction = null,
          msgMsg = null,
          msgAnim = null;

        if (anyModelState?.anyComplete === true || anyModelState?.anyCompleteAnyVersion) {
        } else if (anyModelState?.anyTraining) {
          msgMsg = 'Model is training...';
          msgAnim = true;
        } else {
          msgMsg = 'No models have been trained';
          if (anyDatasetState?.anyComplete && !anyDatasetState?.anyProcessing) {
            msgAction = 'Train a Model';
            onAction = this.onClickTrainAModel;
          }
        }

        if (msgMsg != null) {
          return <RefreshAndProgress isMsgAnimRefresh={msgAnim} msgMsg={msgMsg} msgButtonText={msgAction} onClickMsgButton={onAction}></RefreshAndProgress>;
        }
      }
    }

    let versionsData: { data } = modelMonitorVersion || predictionMetricVersion ? null : this.memMetricsVersions(false)(this.props.metricsParam, detailModelId);

    let isDetailModelId = true;
    if (Utils.isNullOrEmpty(detailModelId)) {
      isDetailModelId = false;
    } else if (Utils.isNullOrEmpty(detailModelVersion)) {
      if (versionsData?.data != null && _.isArray(versionsData?.data) && versionsData?.data.length > 0) {
        detailModelVersion = versionsData?.data?.[0]?.modelVersion;
      }
    }
    if (detailModelId && detailModelVersion && versionsData && versionsData?.data && versionsData?.data.length > 0) {
      let versionDataOne = versionsData.data.find((m1) => m1?.modelVersion === detailModelVersion || m1?.predictionMetricVersion === detailModelVersion);
      if (Utils.isNullOrEmpty(versionDataOne)) {
        setTimeout(() => {
          Location.replace('/' + PartsLink.model_metrics + '/' + this.props.paramsProp?.get('projectId'), undefined, 'detailModelId=' + Utils.encodeQueryParam(detailModelId));
        }, 0);
      }
    }

    let dataClusterType = this.calcDataClusterType();
    let metrics = modelMonitorVersion || predictionMetricVersion ? null : this.memMetrics(this.props.projectId, listModels, this.state.sessionId);
    let versionOne: { res; data } = this.memMetricsVersionOne(false)(
      this.props.metricsParam,
      detailModelVersion,
      algorithm,
      undefined,
      this.state.thresholdTopNRowsSend,
      this.state.thresholdSortByClassSend,
      dataClusterType,
      this.state.sortPreference,
    );

    let showValidation = versionOne?.res?.hasValidation === true;
    let extraKK = versionOne?.res?.metrics?.additionalMetricsKeys?.filter((s1) => !Utils.isNullOrEmpty(s1));
    let showExtras = extraKK != null && extraKK?.length > 0;
    if (predictionMetricVersion) {
      let monitorMetricOne: { res; data } = this.memModelMonitor(false)(this.props.predictionMetrics, predictionMetricVersion, this.state.metricValuesOptionsSel);
      versionOne = monitorMetricOne;
    }

    if (this.props.monitorVersion) {
      let monitorMetricOne: { res; data } = this.memModelMonitorByType(false)(this.props.predictionMetrics, this.props.monitorVersion, this.props.metricType, this.state.metricValuesOptionsSel);
      versionOne = monitorMetricOne;
    }
    let downloadJsonFilename = 'metrics.json';

    let isVersionDataReady = false;
    if ((isDetailModelId || modelMonitorVersion || predictionMetricVersion) && versionOne?.data != null) {
      metrics = { isRefreshing: false, data: versionOne.data };

      const m1 = versionOne.data?.[0];
      if (m1 != null && !_.isEmpty(m1)) {
        isVersionDataReady = true;
        downloadJsonFilename = `metrics_${m1.name?.replace(' ', '_') || ''}_version_${detailModelVersion}.json`;
      } else {
        metrics.isRefreshing = true;
      }

      if (this.metricsFromData != null && this.metricsFromData?.data === versionOne?.data && this.metricsFromData?.isRefreshing === metrics?.isRefreshing) {
        metrics = this.metricsFromData;
      } else {
        this.metricsFromData = metrics;
      }
    } else {
      if (!detailModelVersion) {
        isVersionDataReady = true;
      }
    }

    let metricsData = metrics?.data;
    if (metricsData != null && _.isEmpty(metricsData)) {
      metricsData = null;
    }

    const isVersions = !Utils.isNullOrEmpty(this.props.paramsProp?.get('detailModelId'));

    let columnsRes = this.memColumns(isVersions, metrics, metrics?.isRefreshing, metricsData, this.props.paramsProp?.get('detailModelId'));
    let isRefreshingMetrics = false;
    if (!metrics || metrics.isRefreshing) {
      isRefreshingMetrics = true;
    }
    metrics = columnsRes?.metrics;

    let fvaData = this.memFvaData(metrics, this.props.paramsProp?.get('detailModelId'));

    const isFvaDataEmpty = fvaData == null || fvaData?.length === 0;
    let less830WWtwoRows = this.state.less830WWtwoRows;
    if (isFvaDataEmpty) {
      less830WWtwoRows = false;
    }

    let errorMsg = null,
      msgMsg = null;
    if (metrics != null && !isRefreshingMetrics && metrics.length === 0) {
      if (listModels) {
        let modelsState = this.memModelLife(listModels);
        if (modelsState) {
          if (modelsState.anyTraining) {
            msgMsg = 'Models are still training';
          } else if (modelsState.anyError) {
            errorMsg = 'Model had a failure';
          }
        }
      }
    }

    let isAnoOtherTraining = anyModelState?.anyTraining && anyModelState?.anyCompleteAnyVersion;
    if (!Utils.isNullOrEmpty(detailModelId) && anyModelState?.modelsIdsTraining && anyModelState?.modelsIdsAnyCompleteVersion) {
      isAnoOtherTraining = anyModelState.modelsIdsTraining.indexOf(detailModelId) > -1 && anyModelState.modelsIdsAnyCompleteVersion.indexOf(detailModelId) > -1;
    }

    let modelSelectValue = null;
    let optionsModels = [];
    if (this.props.models) {
      let listModels = this.memModelList(false)(this.props.models, projectId);
      optionsModels = this.memModelsOptions(listModels, anyModelState?.modelsIdsAnyCompleteVersion);
      if (optionsModels) {
        if (optionsModels.length === 1) {
          modelSelectValue = optionsModels[0];
        } else {
          modelSelectValue = optionsModels.find((p1) => p1.value === (detailModelId == null ? '' : detailModelId));
        }
      }
      if (!Utils.isNullOrEmpty(detailModelId) && modelSelectValue == null && listModels != null) {
        modelSelectValue = this.memModelForceOption(listModels, detailModelId);
      }
    }
    let isModelTrainingLastVersion = modelOne != null && [ModelLifecycle.TRAINING, ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, ModelLifecycle.EVALUATING].includes(modelOne?.latestModelVersion?.status);
    let isModelFailedLastVersion = modelOne != null && [ModelLifecycle.UPLOADING_FAILED, ModelLifecycle.TRAINING_FAILED, ModelLifecycle.EVALUATING_FAILED].includes(modelOne?.latestModelVersion?.status);
    if (detailModelVersion) {
      if (predictionMetricVersion || modelMonitorVersion) {
        isModelTrainingLastVersion = false;
        isModelFailedLastVersion = false;
      }
    }
    let modelVersionAll = this.memModelVersionAll(false)(this.props.models, detailModelId);
    if (modelVersionAll != null) {
      if (modelVersionAll?.some((v1) => v1?.status === ModelLifecycle.COMPLETE)) {
        isModelTrainingLastVersion = false;
        isModelFailedLastVersion = false;
      }
    } else {
      isModelTrainingLastVersion = false;
      isModelFailedLastVersion = false;
    }

    let predMetricVersionFound = this.memPredMetricVersion(false)(this.props.predictionMetrics, predictionMetricVersion);

    let metricsRender = this.memMetricsRender(this.forceNoTree, this.state.foldersCache, this.state.isSmall, this.state.isMedium, metrics, metricsData, detailModelId, detailModelVersion, this.state.modelsExpanded, versionsData?.data);

    let msgLimit100k = this.memMsgLimit100k(versionOne?.res);
    let bestAlgorithmSelectionFold = versionOne?.res?.bestAlgorithmSelectionFold;

    const isNewModelSetThreshold = metrics?.[0]?.metrics?.targetColumn != null && metrics?.[0]?.metrics?.targetColumn?.length > 0;

    let dataClusterTypesElem = null;
    let chartAccuracyCrossValidation = null;
    let versionsRender = null,
      metricsRenderDetail = null,
      metricCharts = null,
      metricCharts2 = null,
      metricCharts3 = null,
      metricsGraphs = null,
      topNText = null;
    if (!Utils.isNullOrEmpty(detailModelId)) {
      let showLeadModel = true;
      if (true) {
        let versionsList = this.memVersionList(detailModelId, versionsData?.data);
        if (versionsList && versionsList.length > 0) {
          showLeadModel = true;
        }
      }

      let showLeadModelForDefaultOne = showLeadModel;
      if (Utils.isNullOrEmpty(detailModelVersion) || detailModelVersion !== modelOne?.latestModelVersion?.modelVersion) {
        showLeadModelForDefaultOne = true;
        showLeadModel = false;
      }

      metricsRenderDetail = this.memMetricsRenderDetail(
        this.forceNoTree,
        this.state.foldersCache,
        metrics,
        metricsData,
        detailModelId,
        detailModelVersion,
        this.state.modelsExpanded,
        showLeadModel ? versionsData?.data : null,
        showLeadModel,
        showLeadModelForDefaultOne,
        !!versionOne?.res?.metrics?.foldIntegrity,
      );

      let isNewConfusionMatrixUseUse = !isModelTrainingLastVersion && !isModelFailedLastVersion && isDetailModelId && threshold1 != null;

      let metricChartRes: { res; res2; res3; isSeparated; topNText } = !isVersionDataReady
        ? null
        : this.memMetricCharts(
            isNewModelSetThreshold,
            isNewConfusionMatrixUseUse,
            isNlp,
            metrics,
            detailModelVersion,
            this.state.less830WWnone,
            isFvaDataEmpty ? this.state.less830WWnone : this.state.less830WW0,
            !less830WWtwoRows,
            fvaData,
            detailModelDeployId,
            isForecasting,
            isDemandForecasting,
            detailModelId,
            this.state.refreshingModelId,
            this.state.thresholdDebounce,
            this.state.thresholdStep,
            this.state.threshold2,
            thresholdClass1,
            this.state.optionsClassesSelValue,
            this.state.optimizeThresholdSel,
            this.state.thresholdTopNRows,
            this.state.thresholdSortByClass,
            msgLimit100k,
          );
      metricCharts = metricChartRes?.res;
      metricCharts2 = metricChartRes?.res2;
      metricCharts3 = metricChartRes?.res3;
      topNText = metricChartRes?.topNText;
      if (metricCharts == null || metricChartRes?.isSeparated) {
        less830WWtwoRows = true;
      }

      let dataClusterTypesRes = this.memDataClusterTypes(metrics, this.props.paramsProp?.get('detailModelId'));
      let dataClusterTypesLabel = dataClusterTypesRes?.dataClusterTypesLabel;
      let dataClusterTypes = dataClusterTypesRes?.dataClusterTypes;
      if (dataClusterTypes == null || !dataClusterTypes?.some((d1) => d1?.value != null)) {
        dataClusterTypes = null;
      }
      if (this.props.metricType || this.props.monitorVersion) {
        dataClusterTypes = null;
      }

      if (dataClusterTypes != null) {
        if (!dataClusterTypes?.some((d1) => d1.value == null)) {
          let anySel1 = dataClusterTypes?.some((d1) => d1?.isSelected === true);
          dataClusterTypes.unshift({ label: 'Forecastable Items', value: null, isSelected: !anySel1 });
        }
        let dctFilteredOutItems = dataClusterTypes?.find((d1) => d1?.value === 'filtered_out_items');
        if (dctFilteredOutItems != null && dctFilteredOutItems?.topLabel == null) {
          dctFilteredOutItems.topLabel = 'Items that were filtered out and not used for training because they were too noisy';
        }

        const onClickDataCluster = (value, e) => {
          this.recreateFolderCache();
          Location.push('/' + this.props.paramsProp?.get('mode') + '/' + (projectId ?? '-'), undefined, Utils.processParamsAsQuery({ dataClusterType: encodeURIComponent(value ?? null ?? '') }, window.location.search));
        };

        let dataClustedSel = dataClusterTypes?.find((d1) => d1?.isSelected === true);
        let topLabel1 = dataClustedSel?.topLabel;
        let topLabel1used = !Utils.isNullOrEmpty(topLabel1);
        dataClusterTypesElem = (
          <div css={``}>
            <div
              css={`
                display: flex;
                gap: 15px;
                margin: 15px 0;
              `}
            >
              {dataClusterTypes?.map((d1, d1ind) => {
                return (
                  <div css={``} key={'but_top_' + d1ind + '_' + d1?.value}>
                    <Button
                      css={`
                        padding: 0 20px;
                        font-size: 14px;
                      `}
                      size={'large'}
                      type={d1?.isSelected ? 'primary' : 'default'}
                      onClick={onClickDataCluster.bind(this, d1?.value ?? null)}
                    >
                      {d1?.label ?? '-'}
                    </Button>
                  </div>
                );
              })}
            </div>
            {!Utils.isNullOrEmpty(topLabel1) && (
              <div
                css={`
                  margin-top: 10px;
                  font-size: 14px;
                  text-align: center;
                  opacity: 0.8;
                `}
              >
                {topLabel1}
              </div>
            )}
            {!Utils.isNullOrEmpty(dataClusterTypesLabel) && (
              <div
                css={`
                  ${topLabel1used ? `margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);` : ''} font-size: 14px;
                  text-align: center;
                  opacity: 0.8;
                  padding-top: 10px;
                `}
              >
                {dataClusterTypesLabel}
              </div>
            )}
          </div>
        );
      }
    }

    let fvaCharts = this.memFvaCharts(fvaData, less830WWtwoRows ? this.state.less830WWnone : this.state.less830WW);

    const isInternal = calcAuthUserIsLoggedIn()?.isInternal === true;
    let metricsJsonDataUrl = null;
    if (this.lastMetricsData != null) {
      metricsJsonDataUrl = this.memMetricsJson(this.lastMetricsData, this.lastMetricsDataVersion, detailModelVersion);
    }
    let rawMetricsForUI = null,
      rawMetricsForUIUrl,
      rawMetricsForUIFilename;
    if (metricsData?.length >= 1) {
      rawMetricsForUI = this.memMetricsForUI(metricsData, detailModelVersion);
      rawMetricsForUIFilename = 'raw_metrics_data.json';
      rawMetricsForUIUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(rawMetricsForUI);
    }

    let metricValuesOptions = this.memDropdownClassesOptions(metrics, detailModelVersion);
    let actualValuesSupportedForDrilldownElem = null;
    if (metricValuesOptions != null && (predictionMetricVersion || modelMonitorVersion)) {
      let v1 = metricValuesOptions?.[0];
      if (this.state.metricValuesOptionsSel != null) {
        let v2 = metricValuesOptions?.find((v1) => v1.value === this.state.metricValuesOptionsSel);
        if (v2 != null) {
          v1 = v2;
        }
      }
      actualValuesSupportedForDrilldownElem = <SelectExt options={metricValuesOptions} value={v1} onChange={this.onChangeMetricValuesOptionsSel} />;
    }

    let modelVersionOne = this.memModelVersion(false)(this.props.models, detailModelId, detailModelVersion);
    let automlCompleteNot = modelVersionOne?.automlComplete === false;

    const onChangeMonitor = (option1) => {
      this.recreateFolderCache();
      Location.push(
        '/' + this.props.paramsProp?.get('mode') + '/' + (projectId ?? '-') + (option1?.value == null ? '' : '/' + option1?.value),
        undefined,
        Utils.processParamsAsQuery({
          modelMonitorVersion: option1?.data?.latestMonitorModelVersion?.modelMonitorVersion,
          metricType: 'DecilePredictionMetric',
        }),
        window.location.search,
      );
    };

    const onChangeVersion = (option1) => {
      this.recreateFolderCache();
      Location.push(
        '/' + this.props.paramsProp?.get('mode') + '/' + projectId + '/' + modelMonitorId,
        undefined,
        Utils.processParamsAsQuery({
          modelMonitorVersion: encodeURIComponent(option1?.value ?? ''),
          metricType: 'DecilePredictionMetric',
        }),
      );
    };

    return (
      <div
        ref={(r1) => {
          this.refCenter = r1;
        }}
        style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <WindowSizeSmart onChangeSize={this.onChangeSizeWidth} onChange={this.onChangeSize} />
        <RefreshAndProgress msgMsg={this.state.isRefreshingAll ? 'Processing...' : undefined} isMsgAnimRefresh isDim={this.state.isRefreshingAll}>
          <NanoScroller onlyVertical ref={this.refScroller}>
            <div>
              {this.state.isFoldIntegrity ? (
                <div>
                  <div
                    css={`
                      display: flex;
                    `}
                  >
                    <Button
                      css={`
                        margin-left: auto;
                        margin-right: 30px;
                      `}
                      type="primary"
                      onClick={() => {
                        this.setState({ isFoldIntegrity: false });
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  {versionOne?.res?.metrics?.foldIntegrity?.featureDrift && versionOne?.res?.targetColumn && (
                    <div>
                      <div
                        css={`
                          margin-top: 20px;
                          font-family: Matter;
                          font-size: 18px;
                          font-weight: 500;
                        `}
                      >
                        Drift
                      </div>
                      <ModelFoldDrift modelVersion={detailModelVersion} targetColumn={versionOne?.res?.targetColumn} featureDrift={versionOne?.res?.metrics?.foldIntegrity?.featureDrift} />
                    </div>
                  )}

                  {versionOne?.res?.metrics?.foldIntegrity && (
                    <div>
                      <div
                        css={`
                          margin-top: 20px;
                          font-family: Matter;
                          font-size: 18px;
                          font-weight: 500;
                        `}
                      >
                        Data Integrity
                      </div>
                      <DataIntegrityOne summary={versionOne?.res?.metrics?.foldIntegrity} foldIntegrity />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {this.props.isUseTypes && (
                    <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <span style={{ whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
                        <span>Decile Prediction Metrics</span>
                      </span>
                    </div>
                  )}
                  <div className={this.props.isUseTypes ? '' : sd.titleTopHeaderAfter} style={{ height: this.props.isUseTypes ? '40px' : topAfterHeaderHH, display: 'flex' }}>
                    {this.props.isUseTypes && (
                      <div
                        css={`
                          font-family: Matter;
                          font-size: 18px;
                          font-weight: 500;
                          line-height: 1.78;
                          display: flex;
                          align-items: center;
                        `}
                      >
                        <span css={``}>Monitor:</span>
                        <span
                          css={`
                            font-size: 14px;
                            margin-left: 10px;
                          `}
                        >
                          <span
                            css={`
                              width: 340px;
                              display: inline-block;
                            `}
                          >
                            <SelectExt options={this.props?.optionsMonitors} value={this.props?.optionsMonitors?.find((v1) => v1.value === modelMonitorId)} onChange={onChangeMonitor} />
                          </span>
                        </span>
                        <span
                          css={`
                            margin-left: 20px;
                          `}
                        >
                          {' '}
                          Version:
                        </span>
                        <span
                          css={`
                            font-size: 14px;
                            margin-left: 10px;
                          `}
                        >
                          <span
                            css={`
                              width: 200px;
                              display: inline-block;
                            `}
                          >
                            <SelectExt options={this.props?.optionsVersions} value={this.props?.optionsVersions?.find((v1) => v1.value === modelMonitorVersion)} onChange={onChangeVersion} />
                          </span>
                        </span>
                      </div>
                    )}
                    {false && foundProject1 != null && (
                      <div style={{ marginLeft: '10px', verticalAlign: 'top', marginTop: '5px' }}>
                        <HelpBox beforeText={' with metrics'} name={'model eval'} linkTo={'/help/useCases/' + foundProject1?.useCase + '/evaluating'} />
                      </div>
                    )}
                    {!this.props.isUseTypes && (
                      <>
                        Metrics
                        <div style={{ flex: 1, verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', display: 'inline-block', fontSize: '12px' }}>
                          {this.props.modelMonitorVersion == null && this.props.predictionMetricVersion == null && (
                            <div style={{ maxWidth: '440px' }}>
                              <SelectExt value={modelSelectValue} options={optionsModels} onChange={this.onChangeSelectURLModelOptions} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {!isModelTrainingLastVersion && !isModelFailedLastVersion && !this.props.isUseTypes && rawMetricsForUI != null && (
                      <div style={{ marginLeft: '10px', verticalAlign: 'top' }}>
                        <a href={rawMetricsForUIUrl} download={rawMetricsForUIFilename}>
                          <Button type={'default'} ghost>
                            Raw Model Metrics
                          </Button>
                        </a>
                        <HelpIcon id={'metrics_rawmodelmetrics'} style={{ marginLeft: '4px' }} />
                      </div>
                    )}
                    {!isModelTrainingLastVersion && !isModelFailedLastVersion && metricsJsonDataUrl != null && (
                      <div style={{ marginLeft: '10px', verticalAlign: 'top' }}>
                        <a href={metricsJsonDataUrl} download={downloadJsonFilename}>
                          <Button type={'default'} ghost>
                            Download All Scores
                          </Button>
                        </a>
                        <HelpIcon id={'metrics_downloadallscores'} style={{ marginLeft: '4px' }} />
                      </div>
                    )}
                    <div style={{ width: 16 }} />
                  </div>

                  {isRefreshing === true && !this.state.isRefreshingAll && (
                    <div style={{ textAlign: 'center', margin: '40px auto', fontSize: '12px', color: Utils.colorA(0.7) }}>
                      <RefreshAndProgress msgMsg={'Retrieving Project Details...'} isMsgAnimRefresh></RefreshAndProgress>
                    </div>
                  )}

                  {isRefreshing !== true && foundProject1 && (
                    <div style={{ minHeight: '600px' }}>
                      {isAnoOtherTraining && (
                        <div>
                          <Alert message={'A new Model is training...'} type={'success'} />
                        </div>
                      )}
                      {automlCompleteNot && (
                        <div
                          css={`
                            margin-top: ${isAnoOtherTraining ? 15 : 0}px;
                          `}
                        >
                          <Alert
                            showIcon
                            message={
                              <span
                                css={`
                                  color: white;
                                `}
                              >
                                Some models are still training. We will pick the best model once all models have finished training...
                              </span>
                            }
                            type={'warning'}
                          />
                        </div>
                      )}

                      <div className={sd.table} style={{ position: 'relative', textAlign: 'center' }}>
                        {isModelTrainingLastVersion && <RefreshAndProgress msgMsg={'Model is Training...'} isMsgAnimRefresh={true} isDim={true} isRelative></RefreshAndProgress>}
                        {isModelFailedLastVersion && <RefreshAndProgress msgMsg={'Failed'} isErrorAnimRefresh={true} isDim={true} isRelative></RefreshAndProgress>}

                        {!isModelTrainingLastVersion && !isModelFailedLastVersion && (
                          <RefreshAndProgress
                            isRefreshing={isRefreshingMetrics}
                            errorMsg={errorMsg}
                            msgMsg={msgMsg}
                            isRelative
                            errorButtonText={this.props.projectId ? 'View Models' : null}
                            msgButtonText={this.props.projectId ? 'View Models' : null}
                            onClickErrorButton={this.onClickErrorButton}
                            onClickMsgButton={this.onClickErrorButton}
                          >
                            {metricsRender}
                          </RefreshAndProgress>
                        )}
                      </div>

                      {versionOne?.res?.metrics?.accuracyTables && (
                        <div
                          css={`
                            margin-top: 50px;
                          `}
                        >
                          <TimelineChart timeSeries={versionOne?.res?.metrics?.accuracyTables} />
                        </div>
                      )}

                      {!isNewModelSetThreshold && modelOne != null && !isModelTrainingLastVersion && !isModelFailedLastVersion && isDetailModelId && threshold1 != null && (
                        <div className={sd.classGrayPanel} style={{ position: 'relative', textAlign: 'center', padding: '20px' }}>
                          <div
                            css={`
                              justify-content: center;
                              display: flex;
                              align-items: center;
                              font-family: Matter;
                              font-size: 14px;
                              line-height: 1.78;
                              color: #ffffff;
                            `}
                            style={{ padding: '0 10px' }}
                          >
                            {<span css={``}>Class:&nbsp;{thresholdClass1 == null ? '-' : thresholdClass1}&nbsp;-&nbsp;</span>}
                            {
                              <span
                                css={`
                                  margin-right: 9px;
                                `}
                              >
                                Threshold: {threshold1 == null ? '-' : Utils.decimals(threshold1, 4)}
                              </span>
                            }
                            {
                              <Button disabled={threshold1 == null} type={'primary'} size={'small'} onClick={threshold1 == null ? null : this.onClickChangeThreshold}>
                                Change
                              </Button>
                            }
                          </div>
                        </div>
                      )}

                      {dataClusterTypesElem}

                      {!isModelTrainingLastVersion && !isModelFailedLastVersion && <div style={{}}>{isDetailModelId && <div style={{ marginTop: '20px' }}>{metricCharts}</div>}</div>}

                      {false && showValidation && !isRefreshingMetrics && (
                        <div
                          css={`
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-top: 37px;
                            margin-bottom: -20px;
                          `}
                        >
                          <Checkbox checked={this.state.validation === true} onChange={this.onChangeValidation}>
                            <span
                              css={`
                                color: white;
                              `}
                            >
                              Show Validation Metrics
                            </span>
                          </Checkbox>
                        </div>
                      )}

                      {!isModelTrainingLastVersion && !isModelFailedLastVersion && metricsRenderDetail != null && (
                        <div style={{ marginTop: 16 }}>
                          {actualValuesSupportedForDrilldownElem != null && (
                            <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Matter, sans-serif', fontSize: 12, fontWeight: 300, marginBottom: 16 }}>
                              <span
                                css={`
                                  margin-right: 5px;
                                `}
                              >
                                {'<ACTUAL VALUE>:'}
                              </span>
                              <span
                                css={`
                                  width: 180px;
                                `}
                              >
                                {actualValuesSupportedForDrilldownElem}
                              </span>
                            </div>
                          )}
                          <div>
                            <span
                              css={`
                                flex: 1;
                                text-align: center;
                              `}
                            >
                              {msgLimit100k}
                            </span>
                            <br />
                            {bestAlgorithmSelectionFold?.fold == 'TEST_VAL' && (
                              <span
                                css={`
                                  flex: 1;
                                  text-align: center;
                                  font-size: 11px;
                                  font-weight: 300;
                                  margin-bottom: 16px;
                                `}
                              >
                                Best model is selected based on the validation metrics shown below.
                              </span>
                            )}
                          </div>
                          {topNText}
                          {metricsRenderDetail}
                        </div>
                      )}

                      {!isModelTrainingLastVersion && !isModelFailedLastVersion && versionsRender != null && (
                        <div style={{ marginTop: '20px' }}>
                          <div className={sd.styleTextBlueBright} style={{ margin: '14px 0', fontSize: '14px' }}>
                            Older Versions
                          </div>
                          {versionsRender}
                        </div>
                      )}

                      {!isModelTrainingLastVersion && !isModelFailedLastVersion && metricCharts2 != null && isDetailModelId && <div style={{ marginTop: '20px' }}>{metricCharts2}</div>}
                      {!isModelTrainingLastVersion && !isModelFailedLastVersion && metricCharts3 != null && isDetailModelId && <div style={{ marginTop: '20px' }}>{metricCharts3}</div>}

                      {!isModelTrainingLastVersion && !isModelFailedLastVersion && fvaCharts != null && <div style={{ marginTop: '20px', whiteSpace: 'nowrap' }}>{fvaCharts}</div>}

                      <div style={{ marginTop: '100px' }}>&nbsp;</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </NanoScroller>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    datasets: state.datasets,
    models: state.models,
    projectDatasets: state.projectDatasets,
    deployments: state.deployments,
    metricsParam: state.metrics,
    useCases: state.useCases,
    monitoring: state.monitoring,
    predictionMetrics: state.predictionMetrics,
    featureGroupsParam: state.featureGroups,
  }),
  null,
)(ModelMetricsOne);
