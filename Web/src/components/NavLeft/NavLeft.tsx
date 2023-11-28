import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { calcDocStoreDefFromProject } from '../../api/DocStoreInterfaces';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import algorithms from '../../stores/reducers/algorithms';
import batchPred from '../../stores/reducers/batchPred';
import datasets, { calcDatasetById, ProjectDatasetLifecycle } from '../../stores/reducers/datasets';
import { calcDeploymentsByProjectId, DeploymentLifecycle } from '../../stores/reducers/deployments';
import eda from '../../stores/reducers/eda';
import featureGroups from '../../stores/reducers/featureGroups';
import { calcModelListByProjectId } from '../../stores/reducers/models';
import monitoring from '../../stores/reducers/monitoring';
import notebooks from '../../stores/reducers/notebooks';
import predictionMetrics from '../../stores/reducers/predictionMetrics';
import { calcDatasetForProjectId } from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import templates from '../../stores/reducers/templates';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import NavLeftGroup from '../NavLeftGroup/NavLeftGroup';
import NavLeftLine from '../NavLeftLine/NavLeftLine';
import { UserProfileSection } from '../UserProfile/UserProfile';
import PartsLink from './PartsLink';
import { calcModeForBatchPred, IconAlgorithms, IconBatch, IconCustomLossFunctions, IconCustomMetrics, IconDatasets, IconFeatureGroups, IconFeatureGroupsList, IconModelMonitorSummary, IconModels, IconModelsMetrics, IconModules, IconMonitoring, IconNotebooks, IconPipelines, IconPredictions, IconPredictionsAPI, IconPredictionsDash, IconProject, IconPythonFunctions, IconTemplates, INavParam, PartsLinkIsAlgorithms, PartsLinkIsDataset, PartsLinkIsDeploy, PartsLinkIsEDA, PartsLinkIsFeatureGroups, PartsLinkIsModel, PartsLinkIsModelMonitors, PartsLinkIsMonitoring, PartsLinkIsNotebooks, PartsLinkIsPipelines, PartsLinkIsPredictions, PartsLinkIsProject, sizeIcon, styleIcon, styleIconGreen, systemObjectsOrgOrganizationId } from './utils';
import { ProfileNavLeft } from './ProfileNavLeft';
import { ProjectsNavLeft } from './ProjectsNavLeft';
import pipelines from '../../stores/reducers/pipelines';
import { NavLeftContainer } from './NavLeftContainer';

interface INavLeftProps {
  paramsProp?: any;
  authUser?: any;
  projects?: any;
  datasets?: any;
  projectDatasets?: any;
  monitoring?: any;
  featureGroupsParam?: any;
  deployments?: any;
  useCases?: any;
  algorithms?: any;
  batchPred?: any;
  predictionMetrics?: any;
  templatesParam?: any;
  notebooks?: any;
  eda?: any;

  onCollapse?: (e: any) => void;
  onHover?: (isHover: boolean) => void;
  onClickRoot?: (e: any) => void;
  navLeftCollapsed?: boolean;
}

class NavLeft extends React.PureComponent<INavLeftProps> {
  isM: boolean;
  private unDark: any;
  private navParams: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;

    this.unDark();
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
    if (projectId === '' || projectId === '-') {
      projectId = null;
    }
    return projectId;
  };

  calcEdaId = () => {
    let edaId = this.props.paramsProp?.get('edaId');
    if (edaId === '' || edaId === '-') {
      edaId = null;
    }
    return edaId;
  };

  memTemplatesProject = memoizeOneCurry((doCall, templatesParam, projectId) => {
    if (!projectId) {
      return null;
    }
    return templates.memListByProjectId(doCall, projectId);
  });

  memTemplatesAll = memoizeOneCurry((doCall, templatesParam) => {
    return templates.memListByProjectId(doCall, null);
  });

  memModelMonitorDetail = memoizeOneCurry((doCall, monitoringParam, modelId) => {
    return monitoring.memModelsById(doCall, modelId);
  });

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.calcProjectId();
    let datasetId = this.props.paramsProp?.get('datasetId');
    if (datasetId === '' || datasetId === '-') {
      datasetId = null;
    }
    let modelMonitorId = this.props.paramsProp?.get('modelMonitorId');
    if (modelMonitorId === '' || modelMonitorId === '-') {
      modelMonitorId = null;
    }

    const listAlgoForProblemTypes = this.memAlgoAllowed(true)(this.props.algorithms);

    this.memTemplatesAll(true)(this.props.templatesParam);
    let templatesProjectList = this.memTemplatesProject(true)(this.props.templatesParam, projectId);

    this.memDatasetOne(true)(this.props.datasets, datasetId);

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let datasetsList = this.memProjectDatasets(true)(this.props.projectDatasets, foundProject1);

    let notebookId = this.props.paramsProp?.get('notebookId');
    if (notebookId === '-') {
      notebookId = null;
    }
    let notebookOne = null;
    if (!Utils.isNullOrEmpty(notebookId)) {
      notebookOne = this.memNotebookOne(true)(this.props.notebooks, notebookId);
    }

    let listDeploys = this.memDeploymentList(true)(this.props.deployments, projectId);
    let useCaseInfoProject = this.memUseCaseProject(true)(this.props.useCases, foundProject1?.useCase);

    let predictionMetricsId = this.props.paramsProp?.get('predictionMetricsId');
    let PredMetricsDetailFound = this.memPredMetricsDetail(true)(this.props.predictionMetrics, predictionMetricsId);

    let foundMonitorList = this.memModelMonitorList(true)(this.props.monitoring, projectId);
    if (Utils.isNullOrEmpty(modelMonitorId) && PredMetricsDetailFound?.modelMonitorId != null) {
      modelMonitorId = PredMetricsDetailFound?.modelMonitorId;
    } else if (Utils.isNullOrEmpty(modelMonitorId)) {
      modelMonitorId = foundMonitorList?.[0]?.modelMonitorId;
    }
    let foundMonitor = this.memModelMonitor(true)(this.props.monitoring, modelMonitorId);

    let featureGroupsList = this.memFeatureGroupsList(true)(this.props.featureGroupsParam, projectId);
    this.memFeatureGroup(true)(this.props.featureGroupsParam, this.props.paramsProp?.get('featureGroupId'), projectId);

    let batchPredId = this.props.paramsProp.get('batchPredId'),
      batchPredIdFirst = null;
    if (batchPredId == null) {
      let batchPredList = this.memBatchPredProject(true)(this.props.batchPred, projectId);
      batchPredIdFirst = this.memBatchPredFromList(batchPredList);
    }
    if (batchPredId || batchPredIdFirst) {
      let batchPredOne = this.memBatchPred(true)(this.props.batchPred, batchPredId ?? batchPredIdFirst);
    }

    let edaList = this.memEDAList(true)(this.props.eda, projectId);

    const edaId = this.calcEdaId();
    this.memEDAById(true)(this.props.eda, edaId);
  };

  memBatchPredFromList = memoizeOne((batchPredList) => {
    if (batchPredList) {
      return batchPredList?.[0]?.batchPredictionId;
    }
  });

  componentDidUpdate(): void {
    this.doMem(false);
  }

  onClickLogo = (e) => {
    StoreActions.getProjectsList_();
  };

  onClickUsers = (e) => {};

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memModelMonitorList = memoizeOneCurry((doCall, monitoringParam, projectId) => {
    return monitoring.memModelsByProjectId(doCall, projectId);
  });

  memModelMonitor = memoizeOneCurry((doCall, monitoringParam, modelMonitorId) => {
    return monitoring.memModelsById(doCall, modelMonitorId);
  });

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, foundProject1) => {
    if (foundProject1 && projectDatasets) {
      let projectId = foundProject1.projectId;
      let datasets = calcDatasetForProjectId(undefined, projectId);

      if (datasets == null && !projectDatasets.get('isRefreshing')) {
        if (doCall) {
          StoreActions.getProjectDatasets_(projectId);
        }
        return;
      }

      return datasets;
    }
  });

  memNotebookOne = memoizeOneCurry((doCall, notebooksParam, notebookId) => {
    return notebooks.memNotebookById(doCall, notebookId);
  });

  memDatasetOne = memoizeOneCurry((doCall, datasetsParam, datasetId) => {
    if (!datasetId) {
      return null;
    }
    let res = datasets.memDatasetListCall(doCall, undefined, [datasetId]);
    if (res != null) {
      res = res[datasetId];
    }
    return res;
  });

  memDatasetSyntheticAny = memoizeOne((datasetsList) => {
    if (datasetsList) {
      let anySynthetic = false;
      datasetsList.some((d1) => {
        if ((d1?.dataset?.sourceType || '').toLowerCase() === 'synthetic') {
          anySynthetic = true;
          return true;
        }
      });
      return anySynthetic;
    }
  });

  memFeatureGroupsList = memoizeOneCurry((doCall, featureGroupsParam, projectId) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

  memEDAList = memoizeOneCurry((doCall, edaParam, projectId) => {
    return eda.memEdasByProjectId(doCall, projectId);
  });

  memEDAById = memoizeOneCurry((doCall, edaParam, edaId) => {
    return eda.memEdaById(doCall, edaId);
  });

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

  onClickDeploymentError = (e) => {
    REActions.addNotificationError('You must first train models by uploading a datasets before you can create new Deployments');
  };

  memFreeCons = memoizeOne((authUser) => {
    if (Constants.flags.hide_consultation) {
      return false;
    }

    if (authUser) {
      if (authUser.get('neverDone') || authUser.get('data') == null) {
        return false;
      }
      return authUser.getIn(['data', 'info', 'preferences', 'usedFreeConsultation']) !== true;
    }
  });

  onClickExpand = (e) => {
    this.props.onCollapse?.(e);
  };

  onMouseEnter = () => {
    this.props.onHover?.(true);
  };

  onMouseLeave = () => {
    this.props.onHover?.(false);
  };

  onClickRoot = (e) => {
    this.props.onClickRoot?.(e);
  };

  memUseCaseProject = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  memUseCaseInfo = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase, true);
  });

  memHelpUseCasesSel = memoizeOne((useCasesHelp, helpP2) => {
    if (useCasesHelp && helpP2) {
      return useCasesHelp[helpP2?.toLowerCase()];
    }
  });

  memPredMetricsDetail = memoizeOneCurry((doCall, predictionMetricsParam, predictionMetricsId) => {
    return predictionMetrics.memDescribeMetricsByPredMetricsId(doCall, predictionMetricsParam, predictionMetricsId);
  });

  memAlgoAllowed = memoizeOneCurry((doCall, algorithmsParam) => {
    return algorithms.memProblemTypeAllowed(doCall);
  });

  memFeatureGroup = memoizeOneCurry((doCall, featureGroupParam, featureGroupId, projectId) => {
    if (featureGroupParam && !Utils.isNullOrEmpty(featureGroupId)) {
      return featureGroups.memFeatureGroupsForId(doCall, projectId, featureGroupId);
    }
  });

  memBatchPredProject = memoizeOneCurry((doCall, batchPredParam, projectId) => {
    return batchPred.memBatchList(undefined, projectId, null, doCall);
  });

  memBatchPred = memoizeOneCurry((doCall, batchPredParam, batchPredId) => {
    return batchPred.memBatchDescribe(undefined, batchPredId, doCall);
  });

  memFeatureGroupTemplate = memoizeOneCurry((doCall, templatesParam, featureGroupTemplateId) => {
    return templates.memDetailById(doCall, featureGroupTemplateId);
  });

  render() {
    let { paramsProp, navLeftCollapsed, authUser } = this.props;
    const organizationId = authUser.getIn(['data', 'organization', 'organizationId']);
    const isSystemObjectsOrg = organizationId === systemObjectsOrgOrganizationId;

    let params = paramsProp;
    let mode = params && params.get('mode');

    let projectId = this.calcProjectId();
    let modelId = params.get('modelId') ?? params.get('detailModelId');
    let modelMonitorId = params.get('modelMonitorId');

    let ModelMonitorDetailFound = null;
    if (modelMonitorId) {
      ModelMonitorDetailFound = this.memModelMonitorDetail(false)(this.props.monitoring, modelMonitorId);
    }

    let templatesAll = this.memTemplatesAll(false)(this.props.templatesParam);
    const isTemplatesAllEmpty = templatesAll == null || templatesAll?.length === 0;

    let templatesProjectList = this.memTemplatesProject(false)(this.props.templatesParam, projectId);
    const isTemplatesProjectEmpty = templatesProjectList == null || templatesProjectList?.length === 0;

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    let docStoreDef = calcDocStoreDefFromProject(foundProject1);

    let project1 = foundProject1;

    let useCaseInfoProject = this.memUseCaseProject(false)(this.props.useCases, foundProject1?.useCase);
    let problemType = useCaseInfoProject?.problem_type ?? useCaseInfoProject?.problemType ?? useCaseInfoProject?.ori?.problemType;
    problemType = problemType?.toLowerCase();
    let datasetsList = this.memProjectDatasets(false)(this.props.projectDatasets, foundProject1);
    let anySynthetic = this.memDatasetSyntheticAny(datasetsList);

    const listAlgoForProblemTypes = this.memAlgoAllowed(false)(this.props.algorithms);

    let predictionMetricsId = params.get('predictionMetricsId');
    let PredMetricsDetailFound = this.memPredMetricsDetail(false)(this.props.predictionMetrics, predictionMetricsId);

    let foundMonitorList = this.memModelMonitorList(false)(this.props.monitoring, projectId);
    if (Utils.isNullOrEmpty(modelMonitorId) && PredMetricsDetailFound?.modelMonitorId != null) {
      modelMonitorId = PredMetricsDetailFound?.modelMonitorId;
    } else if (Utils.isNullOrEmpty(modelMonitorId)) {
      modelMonitorId = foundMonitorList?.[0]?.modelMonitorId;
    } else if (modelMonitorId == '' || modelMonitorId === '-') {
      modelMonitorId = null;
    }

    let foundMonitor = this.memModelMonitor(false)(this.props.monitoring, modelMonitorId);

    let isVisionDrift = foundMonitor?.monitorType?.toUpperCase() === 'VISION_DRIFT_MONITOR' || foundMonitor?.monitorType?.toUpperCase() === 'NLP_DRIFT_MONITOR';

    let projectName = null,
      hasModel = false,
      datasetName = null,
      modelName = null,
      deployName = null;
    let showAugmentationModel = false;
    let isStreaming = false,
      streamingWithData = false;

    let calcLinkToRoot = (v1: string, extra?: string): string | string[] => (Utils.isNullOrEmpty(extra) ? '/' + v1 : ['/' + v1, extra]);
    let calcLinkToAll = (v1: string): string | string[] => null;
    let calcLinkToModel = (v1: string, addProjectId?: boolean): string => null;
    let calcLinkToModelOrOnlyProject = (v1: string): string => null;
    let calcLinkToDeploy = (v1: string, deployIdExtra?): string => null;
    let calcLinkToProjectAndDeployOrOnlyProject = (v1: string, queryString?: string): string | string[] => null;
    let calcLinkToProject = (v1: string, extra = null): string => null;
    let calcLinkToProjectParams = (v1: string, extra = null): string | string[] => null;
    let calcLinkToDataset = (v1: string): string => null;
    let calcLinkToDatasetAndProject = (v1: string, extra?): string | string[] => null;
    let calcLinkToFeatureGroupTemplate = (v1: string, extra?): string => null;
    let calcLinkToFeatureGroup = (v1: string, extra?): string => null;
    let calcLinkToEDA = (v1: string, extra?): string => null;
    let calcLinkToEDACollinearity = (v1: string, extra?): string => null;
    let calcLinkToEDADataConsistency = (v1: string, extra?): string => null;
    let calcLinkToEDATimeseries = (v1: string, extra?): string => null;
    let calcLinkToAlgorithm = (v1: string, extra?): string => null;
    let calcLinkToFeatureGroupOnly = (v1: string): string => null;
    let calcLinkToFeatureGroupProjectFirst = (v1: string): string => null;
    let calcLinkToBatchPred = (v1: string): string => null;
    let calcLinkToMonitoring = (v1: string, deployIdExtra?): string => null;
    let calcLinkToMonitor = (v1: string, extra?): string => null;
    let calcLinkToMonitorProjectFrist = (v1: string): string => null;

    let featureGroupVersion = null;
    let featureGroupId = params.get('featureGroupId');
    let featureGroupsList = this.memFeatureGroupsList(false)(this.props.featureGroupsParam, projectId);
    if (!featureGroupId) {
      if (featureGroupsList != null && featureGroupsList.length > 0) {
        let f1 = featureGroupsList[0];
        featureGroupId = f1.featureGroupId;
      }
    }

    let edaId = params.get('edaId');
    let edaList = this.memEDAList(false)(this.props.eda, projectId);
    let edaName = null,
      collinearityEdaId = null,
      dataConsistencyEdaId = null,
      forecastingEdaId = null;
    if (edaId) {
      let edaOne = this.memEDAById(false)(this.props.eda, edaId);
      edaName = edaOne?.name;
    } else {
      if (edaList != null && edaList.length > 0) {
        const eda = edaList[0];
        edaId = eda.edaId;
        edaName = eda.name;
      }
    }

    if (edaList != null && edaList.length > 0) {
      const firstCollinearityEda = edaList.find((item) => _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('COLLINEARITY'));
      if (firstCollinearityEda) {
        collinearityEdaId = firstCollinearityEda.edaId;
      }

      const firstDataConsistencyEda = edaList.find((item) => _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('DATA_CONSISTENCY'));
      if (firstDataConsistencyEda) {
        dataConsistencyEdaId = firstDataConsistencyEda.edaId;
      }

      const firstForecastingEda = edaList.find((item) => _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('FORECASTING_ANALYSIS'));
      if (firstForecastingEda) {
        forecastingEdaId = firstForecastingEda.edaId;
      }
    }

    if (edaId) {
      calcLinkToEDA = (v1, extra?) => (extra == null ? '/' + v1 + '/' + (projectId ?? '-') + '/' + edaId : ['/' + v1 + '/' + (projectId ?? '-') + '/' + edaId, extra]) as any;
    }
    if (collinearityEdaId) {
      const collinearityEda = edaList.find((item) => item.edaId === edaId && _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('COLLINEARITY'));
      calcLinkToEDACollinearity = (v1, extra?) => (extra == null ? '/' + v1 + '/' + (projectId ?? '-') + '/' + (collinearityEda ? edaId : collinearityEdaId) : ['/' + v1 + '/' + (projectId ?? '-') + '/' + (collinearityEda ? edaId : collinearityEdaId), extra]) as any;
    }
    if (dataConsistencyEdaId) {
      const dataConsistencyEda = edaList.find((item) => item.edaId === edaId && _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('DATA_CONSISTENCY'));
      calcLinkToEDADataConsistency = (v1, extra?) => (extra == null ? '/' + v1 + '/' + (projectId ?? '-') + '/' + (dataConsistencyEda ? edaId : dataConsistencyEdaId) : ['/' + v1 + '/' + (projectId ?? '-') + '/' + (dataConsistencyEda ? edaId : dataConsistencyEdaId), extra]) as any;
    }
    if (forecastingEdaId) {
      const forecastingEda = edaList.find((item) => item.edaId === edaId && _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('FORECASTING_ANALYSIS'));
      calcLinkToEDATimeseries = (v1, extra?) => (extra == null ? '/' + v1 + '/' + (projectId ?? '-') + '/' + (forecastingEda ? edaId : forecastingEdaId) : ['/' + v1 + '/' + (projectId ?? '-') + '/' + (forecastingEda ? edaId : forecastingEdaId), extra]) as any;
    }

    let algorithmName = null;
    let algorithmId = params.get('algorithmId');
    if (algorithmId === '' || algorithmId === '-') {
      algorithmId = null;
    }
    if (algorithmId) {
      let algoOne = null; //TODO //**algo
      algorithmName = algoOne?.name;
      calcLinkToAlgorithm = (v1, extra?) => (extra == null ? '/' + v1 + '/' + (projectId ?? '-') + '/' + algorithmId : ['/' + v1 + '/' + (projectId ?? '-') + '/' + algorithmId, extra]) as any;
    }

    let featureGroupTemplateId = params.get('featureGroupTemplateId');
    let featureGroupTemplateOne = this.memFeatureGroupTemplate(false)(this.props.templatesParam, featureGroupTemplateId);
    let templateName = featureGroupTemplateOne?.name;
    if (featureGroupTemplateId) {
      calcLinkToFeatureGroupTemplate = (v1, extra?) => (extra == null ? '/' + v1 + '/' + (projectId ?? '-') + '/' + featureGroupTemplateId : ['/' + v1 + '/' + (projectId ?? '-') + '/' + featureGroupTemplateId, extra]) as any;
    }

    if (featureGroupId) {
      calcLinkToFeatureGroup = (v1, extra?) => (extra == null ? '/' + v1 + '/' + (projectId ?? '-') + '/' + featureGroupId : ['/' + v1 + '/' + (projectId ?? '-') + '/' + featureGroupId, extra]) as any;
      calcLinkToFeatureGroupOnly = (v1) => '/' + v1 + '/' + featureGroupId;
      calcLinkToFeatureGroupProjectFirst = (v1) => '/' + v1 + '/' + featureGroupId + (projectId ? '/' + projectId : '');
    }

    let batchPredId = params.get('batchPredId'),
      batchPredName = null,
      batchPredIdFirst = null;
    if (batchPredId == null) {
      let batchPredList = this.memBatchPredProject(false)(this.props.batchPred, projectId);
      batchPredIdFirst = this.memBatchPredFromList(batchPredList);
    }
    if (batchPredId || batchPredIdFirst) {
      calcLinkToBatchPred = (v1) => '/' + v1 + '/' + projectId + '/' + (batchPredId ?? batchPredIdFirst);
      let batchPredOne = this.memBatchPred(false)(this.props.batchPred, batchPredId ?? batchPredIdFirst);
      batchPredName = batchPredOne?.name;
    }

    let featureId = null,
      featureName = null;
    let featureGroupOne = this.memFeatureGroup(false)(this.props.featureGroupsParam, this.props.paramsProp?.get('featureGroupId'), projectId);
    if (featureGroupOne) {
      featureId = featureGroupOne.featureGroupId;
      featureName = featureGroupOne.tableName ?? featureGroupOne.name;
      featureGroupVersion = featureGroupOne.latestFeatureGroupVersion?.featureGroupVersion;
    }

    let showPredLog = false;
    let datasetIsFG = true;

    let notebookId = params.get('notebookId');
    if (notebookId === '-') {
      notebookId = null;
    }
    let notebookOne = null;
    if (!Utils.isNullOrEmpty(notebookId)) {
      notebookOne = this.memNotebookOne(false)(this.props.notebooks, notebookId);
    }

    let datasetId = params.get('datasetId');
    if (datasetId === '-' || datasetId === '') {
      datasetId = null;
    }

    let deployId = paramsProp?.get('deployId') ?? params?.get('selectedAlgoId');
    if (deployId === '-' || deployId === '') {
      deployId = null;
    }
    let deployIdActive = null;
    if (params) {
      if (!datasetId && projectId && project1) {
        //find first or only dataset
        project1.allProjectDatasets &&
          project1.allProjectDatasets.some((d1) => {
            if (d1 && d1.status === ProjectDatasetLifecycle.DETACHED) {
              return false;
            }

            if (d1 && d1.dataset && d1.dataset.datasetId) {
              datasetId = d1.dataset.datasetId;
              return true;
            }
          });
      }

      if (datasetId) {
        calcLinkToDataset = (v1) => '/' + v1 + '/' + datasetId;
        calcLinkToDatasetAndProject = (v1, extra?) => (extra ? ['/' + v1 + '/' + datasetId, extra] : '/' + v1 + '/' + datasetId);
      }

      calcLinkToAll = (v1) => ['/' + v1, 'projectId=' + (projectId || '') + '&datasetId=' + (datasetId || '') + '&modelId=' + (modelId || '')];

      let datasetFromId = null;
      if (datasetId) {
        let dataset1 = calcDatasetById(undefined, datasetId);
        if (dataset1) {
          datasetFromId = dataset1;
          datasetName = datasetFromId.getIn(['dataset', 'name']);
          isStreaming = dataset1.get('sourceType')?.toLowerCase() === 'streaming';
          streamingWithData = dataset1.get('size') > 0;
        }
      }

      if (!projectId && datasetId) {
        let dataset1 = datasetFromId;
        if (dataset1) {
          let datasetList = dataset1.get('allProjectDatasets');
          if (datasetList) {
            let allCountFound = 0;
            datasetList.some((d1) => {
              projectId = d1.getIn(['project', 'projectId']);
              if (projectId) {
                allCountFound++;
              }
            });
            if (allCountFound > 1) {
              projectId = null;
            }
          }
        }
      }

      if (projectId) {
        if (project1) {
          projectName = project1.name;
        }

        calcLinkToProject = (v1, extra) => '/' + v1 + '/' + projectId + (extra ?? '');
        calcLinkToProjectParams = (v1, extra) => ['/' + v1 + '/' + projectId, extra ?? ''];
        if (datasetId) {
          calcLinkToDatasetAndProject = (v1, extra?) => (extra ? ['/' + v1 + '/' + datasetId + '/' + projectId, extra] : '/' + v1 + '/' + datasetId + '/' + projectId);
        }
      }

      if (!modelId && projectId) {
        let listModels = calcModelListByProjectId(undefined, projectId);
        if (listModels && listModels.size > 0) {
          let model1 = listModels.first();
          if (model1.get('hasAugmentation')) {
            showAugmentationModel = true;
          }
          modelId = model1.get('modelId');
          modelName = model1.get('name');
        }
      } else if (modelId && projectId) {
        let listModels = calcModelListByProjectId(undefined, projectId);
        if (listModels) {
          listModels.some((m1) => {
            if (m1.get('modelId') === modelId) {
              modelName = m1.get('name');
              if (m1.get('hasAugmentation')) {
                showAugmentationModel = true;
              }
              return true;
            }
          });
        }
      }

      if (projectId) {
        calcLinkToModelOrOnlyProject = (v1) => '/' + v1 + '/' + projectId;
        calcLinkToProjectAndDeployOrOnlyProject = (v1, qs) => (qs ? ['/' + v1 + '/' + projectId, qs] : '/' + v1 + '/' + projectId);
        calcLinkToMonitoring = (v1, deployIdExtra?) => '/' + v1 + '/' + projectId + '/' + (deployIdExtra ?? deployId ?? '-');
      }
      if (modelId) {
        hasModel = true;
        calcLinkToModel = (v1, addProjectId) => '/' + v1 + '/' + modelId + (addProjectId ? '/' + (projectId || '') : '');
        calcLinkToModelOrOnlyProject = (v1) => calcLinkToModel(v1, true);
      }

      //deploy
      if (projectId) {
        let listDeploys = this.memDeploymentList(false)(this.props.deployments, projectId);
        if (listDeploys) {
          let deployFound1 = null;

          let deployFound1Tmp = listDeploys.find((d1) => d1.status === DeploymentLifecycle.ACTIVE);
          deployIdActive = deployFound1Tmp?.deploymentId;
          let deployFound1Used = listDeploys.find((d1) => d1.deploymentId === deployId);
          if (deployFound1Used) {
            if (deployFound1Used.deploymentId !== deployIdActive) {
              if (deployFound1Used.status === DeploymentLifecycle.ACTIVE) {
                deployIdActive = deployFound1Used.deploymentId;
              } else {
                deployIdActive = null;
              }
            }
          }

          if (deployId == null) {
            deployFound1 = deployFound1Tmp;
            if (!deployFound1) {
              deployFound1 = listDeploys.find((d1) => d1.status === DeploymentLifecycle.DEPLOYING);
            }
            if (!deployFound1) {
              deployFound1 = listDeploys.find((d1) => d1.status === DeploymentLifecycle.STOPPED);
            }
          } else {
            deployFound1 = listDeploys.find((d1) => d1.deploymentId === deployId);
          }
          if (deployFound1) {
            if (deployId == null) {
              deployId = deployFound1.deploymentId;
            }
            deployName = deployFound1.name;

            if (deployFound1.hasRequestLogging) {
              showPredLog = true;
            }
          }

          if (deployId) {
            calcLinkToDeploy = (v1, deployIdExtra?) => '/' + v1 + '/' + projectId + '/' + (deployIdExtra ?? deployId);
            calcLinkToMonitoring = (v1, deployIdExtra?) => '/' + v1 + '/' + projectId + '/' + (deployIdExtra ?? deployId ?? '-');
            calcLinkToProjectAndDeployOrOnlyProject = (v1, qs) => (qs ? ['/' + v1 + '/' + projectId + '/' + deployId, qs] : '/' + v1 + '/' + projectId + '/' + deployId);
          }
        }

        if (modelMonitorId) {
          const modelMonitorVersion = paramsProp?.get('useModelMonitorVersion');
          calcLinkToMonitor = (v1, extra?) => (modelMonitorVersion || extra ? (['/' + v1 + '/' + modelMonitorId + '/' + projectId, 'useModelMonitorVersion=' + encodeURIComponent(modelMonitorVersion) + (extra ? '&' + extra : '')] as any) : '/' + v1 + '/' + modelMonitorId + '/' + projectId);
          calcLinkToMonitorProjectFrist = (v1) => (modelMonitorVersion ? (['/' + v1 + '/' + projectId + '/' + modelMonitorId, 'useModelMonitorVersion=' + encodeURIComponent(modelMonitorVersion)] as any) : '/' + v1 + '/' + projectId + '/' + modelMonitorId);
        }
      }
    }

    const isDrift = foundProject1?.isDrift;
    const isPnp = foundProject1?.isPnp;
    const isEmbeddingsOnly = foundProject1?.useCase === 'EMBEDDINGS_ONLY';
    const isSentimentAnalysis = foundProject1?.useCase === 'NLP_SENTIMENT';
    const isFeatureStore = foundProject1?.isFeatureStore;
    const isPretrained = foundProject1?.useCase?.toUpperCase()?.startsWith('PRETRAINED');
    const isChat = foundProject1?.useCase === 'NLP_CHAT';
    const isChatLLM = foundProject1?.useCase === 'CHAT_LLM';
    const isAiAgent = foundProject1?.useCase === 'AI_AGENT';

    if (!datasetName) {
      if (datasetId) {
        let dataset1 = calcDatasetById(undefined, datasetId);
        if (dataset1) {
          datasetName = dataset1.getIn(['dataset', 'name']);
        }
      }
    }
    if (!deployName) {
      if (projectId) {
        let listDeploys = this.memDeploymentList(false)(this.props.deployments, projectId);
        if (listDeploys) {
          if (deployId == null) {
            let deployFound1 = listDeploys.find((d1) => d1.status === DeploymentLifecycle.ACTIVE);
            if (deployFound1) {
              deployId = deployFound1.deploymentId;
              deployName = deployFound1.name;
              deployIdActive = deployFound1?.deploymentId;
            }
          } else {
            let deployFound1 = listDeploys.find((d1) => d1.deploymentId === deployId);
            if (deployFound1) {
              deployName = deployFound1.name;
            }
          }
        }
      }
    }

    let monitorAlertId = paramsProp?.get('monitorAlertId');
    if (Utils.isNullOrEmpty(monitorAlertId) || monitorAlertId === '-') {
      monitorAlertId = null;
    }

    let showNotebooks = true;
    if (PartsLinkIsNotebooks(mode)) {
      showNotebooks = true;
    }

    let showModelMonitors = true;
    let showAlgorithms = true;
    let showProjects = true;
    let showDatasets = true,
      showDatasetItem = true;
    let showModels = true,
      showModelsItem = true;
    let showPredictions = true,
      showPredictionsItem = true;
    let showBatchPredictions = true;
    let showFeatureGroups = true,
      showFeatureGroupsItem = true;
    let showMonitoring = true,
      showMonitoringItem = true;
    let showEDA = true;
    if (this.props.paramsProp?.get('projectId') === '-') {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = false;
      showPredictions = false;
      showNotebooks = false;
    } else if (mode === PartsLink.project_add) {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = true;
      showPredictions = false;
      showNotebooks = false;
    } else if (mode === PartsLink.docker_add) {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = true;
      showPredictions = false;
      showNotebooks = false;
    } else if (mode === PartsLink.dataset_upload) {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = true;
      showPredictions = false;
      showNotebooks = false;
    } else if (mode === PartsLink.dataset_upload_step2) {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = true;
      showPredictions = false;
      showNotebooks = false;
    } else if (mode === PartsLink.project_list) {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = false;
      showPredictions = false;
      showMonitoring = false;
      showMonitoringItem = false;
      showNotebooks = false;
    } else if (mode === PartsLink.dataset_list) {
      showAlgorithms = true;
      showProjects = true;
      showDatasets = true;
      showModels = true;
      showPredictions = true;
    } else if (mode === PartsLink.datasets_all) {
      showModels = false;
      showBatchPredictions = false;
    } else if (mode === PartsLink.model_list) {
      showAlgorithms = true;
      showProjects = true;
      showDatasets = true;
      showModels = true;
      showPredictions = true;
    } else if (mode === PartsLink.deploy_list) {
      showAlgorithms = true;
      showProjects = true;
      showDatasets = true;
      showModels = true;
      showPredictions = true;
    } else if (mode === PartsLink.template_detail || mode === PartsLink.template_one) {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = false;
      showModelsItem = false;
      showPredictions = false;
      showPredictionsItem = false;
      showMonitoring = false;
      showMonitoringItem = false;
      showNotebooks = false;
    } else if ((mode === PartsLink.algorithm_one || mode === PartsLink.algorithm_list) && projectId == null) {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = false;
      showModelsItem = false;
      showPredictions = false;
      showPredictionsItem = false;
      showMonitoring = false;
      showMonitoringItem = false;
      showNotebooks = false;
    } else if (mode === PartsLink.dataset_for_usecase) {
      showAlgorithms = false;
      showProjects = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = false;
      showModelsItem = false;
      showPredictions = false;
      showPredictionsItem = false;
      showMonitoring = false;
      showMonitoringItem = false;
      showNotebooks = false;
    } else {
      showProjects = PartsLinkIsProject(mode);
      showDatasets = PartsLinkIsDataset(mode) || (PartsLinkIsFeatureGroups(mode, true, true) && !(projectId == null && [PartsLink.feature_groups_template_add].includes(mode)));
      showModels = (PartsLinkIsAlgorithms(mode) && projectId != null) || PartsLinkIsModel(mode, true, true) || showProjects || showDatasets;
      showPredictions = PartsLinkIsPredictions(mode) || showProjects || showDatasets || showModels;
      showMonitoring = PartsLinkIsMonitoring(mode) || showPredictions;
      showModelMonitors = PartsLinkIsModelMonitors(mode) || showProjects || showDatasets || showModels;
      showAlgorithms = (PartsLinkIsAlgorithms(mode) && projectId != null) || showModels;
    }

    let showAllDatasets = false;
    if ([PartsLink.project_list, PartsLink.featuregroups_list, PartsLink.datasets_all].includes(mode)) {
      showAllDatasets = true;
    }
    if ([PartsLink.notebook_list, PartsLink.templates_list, PartsLink.python_functions_list, PartsLink.custom_loss_functions_list, PartsLink.notebook_template_list, PartsLink.notebook_template_details, PartsLink.custom_metrics_list, PartsLink.notebook_details].includes(mode) && !projectId) {
      showAllDatasets = true;
    }

    let allDatasetsSelected = [PartsLink.datasets_all].includes(mode ?? '--');
    if ((showProjects || [PartsLink.dataset_detail, PartsLink.feature_groups_template_add].includes(mode ?? '--')) && Utils.isNullOrEmpty(this.props.paramsProp?.get('projectId'))) {
      showProjects = false;
      showAlgorithms = false;
      showDatasets = false;
      showModels = false;
      showDatasetItem = false;
      showModelsItem = false;
      showPredictions = false;
      showPredictionsItem = false;
      showMonitoring = false;
      showMonitoringItem = false;
      showAllDatasets = false;
      showNotebooks = false;
    }

    let isAllOrgLevel = false;

    let showAllModelMonitors = false;
    let showAllTemplates = false;
    let showAllNotebooks = false;
    let showAllAlgorithms = false;
    let showAllPythonFunctions = false;
    let showAllCustomLossFunctions = false;
    let showNotebookTemplateList = false;
    let showAllCustomMetrics = false;
    let showAllFG = false;

    if ((PartsLinkIsPipelines(mode, true, true) && !projectId) || [PartsLink.project_list, PartsLink.featuregroups_list, PartsLink.datasets_all, PartsLink.monitors_org_list, PartsLink.monitors_org_summary, PartsLink.python_function_detail, PartsLink.python_functions_edit].includes(mode) || ([PartsLink.notebook_details, PartsLink.notebook_list, PartsLink.templates_list, PartsLink.algorithm_list, PartsLink.exploratory_data_analysis_graphs_org, PartsLink.python_functions_list, PartsLink.python_functions_one, PartsLink.custom_loss_function_one, PartsLink.custom_loss_functions_list, PartsLink.notebook_template_list, PartsLink.notebook_template_details, PartsLink.custom_metric_one, PartsLink.custom_metrics_list, PartsLink.module_one, PartsLink.modules_list].includes(mode) && !projectId)) {
      isAllOrgLevel = true;
      showAllNotebooks = true;
      showAllAlgorithms = true;
      showAllPythonFunctions = true;
      showAllCustomLossFunctions = true;
      showNotebookTemplateList = true;
      showAllCustomMetrics = true;
      showAllModelMonitors = true;
      showAllTemplates = true;
      showAllFG = true;
    }

    if (!projectId) {
      showNotebooks = false;
    }

    let showModelMonitorsDriftTypeCase = false;
    let isModelMonitorUse = foundProject1?.isModelMonitor || isFeatureStore;
    let showMonitorsWithModels = problemType === 'regression' || problemType === 'trainable_plug_and_play' || problemType === 'predictive_modeling';
    if (isModelMonitorUse) {
      showModelMonitors = true;
      showModelMonitorsDriftTypeCase = true;
    }

    if (hasModel || showMonitoring || showNotebooks) {
      if (projectId && !isAllOrgLevel) {
        showModelsItem = true;
        showModels = true;
        showAlgorithms = true;
        showPredictions = true;
        showPredictionsItem = true;
      }
    }
    if (showModels || showPredictions || showModelMonitors) {
      if (!isAllOrgLevel) {
        showDatasets = true;
      }
    }
    if (showPredictions && !isAllOrgLevel) {
      showModels = true;
      showAlgorithms = true;
    }

    showFeatureGroups = showDatasets;
    showEDA = showDatasets;
    if (showFeatureGroups) {
      showDatasets = true;
    }

    if (!isAllOrgLevel) {
      if (isPnp) {
        showDatasetItem = false;
        showDatasets = false;
        showFeatureGroups = false;
        showFeatureGroupsItem = false;
        showEDA = false;
      }
      if (isFeatureStore) {
        showModels = false;
        showAlgorithms = false;
        showModelsItem = false;
        showPredictions = false;
        showPredictionsItem = false;
        showFeatureGroups = true;
        showFeatureGroupsItem = true;
      }
      if (isDrift) {
        showAlgorithms = false;
        showModels = false;
        showModelsItem = false;
      }
      if (isPretrained) {
        showModels = false;
      }

      showMonitoring = showPredictions || showModelMonitors;
      if (PartsLinkIsDataset(mode) && (projectId == null || projectId === '-')) {
        showMonitoring = false;
      }

      if (isAiAgent) {
        showEDA = false;
      }
    }

    showBatchPredictions = showPredictions && !isDrift;

    if (!foundProject1) {
      showFeatureGroups = false;
      showEDA = false;
    }

    if (isPnp) {
      showBatchPredictions = false;
    }
    let showDriftModel = false;
    if (showPredLog && !isPnp && foundProject1?.hasFeatureDrift === true) {
      showDriftModel = true;
    }

    let addIndentWithChevron = showProjects || projectName != null ? 2 : 0;
    let addIndent = projectName != null ? 2 : 2;

    const isProfile = mode === PartsLink.profile;
    let profileSection: UserProfileSection = paramsProp && paramsProp.get('section');
    if (profileSection == null || profileSection === '') {
      profileSection = UserProfileSection.general;
    }

    let showSubPredictions = true;
    let showPredAPI = foundProject1?.showPredictionApi;
    if (docStoreDef?.allowPredAPI === false) {
      showPredAPI = false;
    }
    if (['NLP_CHAT'].includes(foundProject1?.useCase?.toUpperCase()) || isPretrained) {
      showPredAPI = false;
    }
    let showPredDash = foundProject1?.showPredictionDashboard;
    if (docStoreDef?.allowPredDash === false) {
      showPredDash = false;
    }
    let showMetrics = foundProject1?.showMetrics;

    const showFreeConsultation = this.memFreeCons(this.props.authUser);

    showDatasets = showDatasets && mode != PartsLink.project_add;

    let showDeployments = showPredictions && !isDrift;
    if (isFeatureStore) {
      showDeployments = true;
      showSubPredictions = false;
    }

    let pitGroup = paramsProp?.get('pitGroup');
    let extraDatasetVersion;
    let datasetVersion = paramsProp?.get('datasetVersion');
    if (!Utils.isNullOrEmpty(datasetVersion) && datasetVersion !== '-') {
      extraDatasetVersion = `datasetVersion=` + encodeURIComponent(datasetVersion);
    }

    let navParams: { [key: string]: string | INavParam } = {};

    navParams['isPnp'] = isPnp ? '1' : null;
    navParams['projectUseCase'] = foundProject1?.useCase;

    navParams['projectId'] = projectId;
    navParams['projectName'] = projectName;
    navParams['datasetId'] = datasetId;
    navParams['datasetName'] = datasetName;
    navParams['modelId'] = modelId;
    navParams['modelName'] = modelName;
    navParams['deployId'] = deployId;
    navParams['deployName'] = deployName;
    navParams['profileSection'] = profileSection;
    navParams['featureId'] = featureId;
    navParams['featureName'] = featureName;
    navParams['batchPredId'] = batchPredId;
    navParams['batchPredName'] = batchPredName;
    navParams['monitorId'] = modelMonitorId;
    navParams['monitorName'] = foundMonitor?.name;
    navParams['pitGroup'] = pitGroup;
    navParams['notebookId'] = notebookId;
    navParams['notebookName'] = notebookOne?.name;
    navParams['templateId'] = featureGroupTemplateId;
    navParams['templateName'] = templateName;
    navParams['algorithmId'] = algorithmId;
    navParams['algorithmName'] = algorithmName;
    navParams['edaName'] = edaName;
    navParams['edaId'] = edaId;
    navParams['documentRetrieverId'] = params.get('documentRetrieverId');
    const pipelineId = params.get('pipelineId');
    navParams['pipelineId'] = pipelineId;
    const pipeline = pipelines.getPipeline(false, pipelineId);
    navParams['pipelineName'] = pipeline?.pipelineName || pipelineId;

    navParams[PartsLink.document_retriever_list] = { text: 'Document Retrievers', link: ['', PartsLink.document_retriever_list, project1?.projectId].join('/') };
    navParams[PartsLink.document_retriever_detail] = { text: 'Detail', useDocumentRetriever: true, link: ['', PartsLink.document_retriever_detail, project1?.projectId].join('/') };
    navParams[PartsLink.document_retriever_edit] = { text: 'Edit', useDocumentRetriever: true };
    navParams[PartsLink.feature_group_detail] = { useFeatureName: true, text: 'Detail', link: calcLinkToFeatureGroup(PartsLink.feature_group_detail) };
    navParams[PartsLink.feature_groups] = { text: 'Feature Groups', link: calcLinkToProject(PartsLink.feature_groups) };
    navParams[PartsLink.feature_groups_data_explorer] = { useFeatureName: true, text: 'Explore', link: calcLinkToFeatureGroup(PartsLink.feature_groups_data_explorer) };
    navParams[PartsLink.features_rawdata] = { useFeatureName: true, text: 'Materialized Data', link: calcLinkToFeatureGroup(PartsLink.features_rawdata) };
    navParams[PartsLink.feature_groups_constraint] = { useFeatureName: true, text: 'Constraint', link: calcLinkToFeatureGroup(PartsLink.feature_groups_constraint) };
    navParams[PartsLink.feature_groups_constraint_add] = { useFeatureName: true, text: 'Add Constraint', link: calcLinkToFeatureGroup(PartsLink.feature_groups_constraint_add) };
    navParams[PartsLink.dagviewer] = { useFeatureName: true, text: 'Dag Viewer', link: calcLinkToFeatureGroup(PartsLink.dagviewer) };
    navParams[PartsLink.annotations_edit] = { useFeatureName: true, text: 'Annotations', link: calcLinkToFeatureGroup(PartsLink.annotations_edit) };
    navParams[PartsLink.feature_groups_add] = { useFeatureName: true, text: 'Add Group', link: calcLinkToProject(PartsLink.feature_groups_add) };
    navParams[PartsLink.feature_groups_add + '#isTemplate'] = { useFeatureName: true, text: 'Add Template', link: calcLinkToProject(PartsLink.feature_groups_add) };
    navParams[PartsLink.feature_groups_history] = { useFeatureName: true, text: 'History', link: calcLinkToFeatureGroup(PartsLink.feature_groups_history) };
    navParams[PartsLink.feature_groups_edit] = { useFeatureName: true, text: 'Edit', link: calcLinkToFeatureGroup(PartsLink.feature_groups_edit) };
    navParams[PartsLink.feature_groups_template_add] = { useFeatureName: true, text: 'Add Template', link: calcLinkToFeatureGroup(PartsLink.feature_groups_template_add) };
    navParams[PartsLink.feature_groups_template_list] = { useFeatureName: true, text: 'Templates', link: calcLinkToProject(PartsLink.feature_groups_template_add) };
    navParams[PartsLink.feature_groups_template] = { useFeatureName: true, text: 'Template', link: calcLinkToFeatureGroup(PartsLink.feature_groups_template_add) };
    navParams[PartsLink.exploratory_data_analysis] = { text: 'EDA', link: calcLinkToProject(PartsLink.exploratory_data_analysis) };
    navParams[PartsLink.exploratory_data_analysis_detail] = { useEDA: true, text: 'Detail', link: calcLinkToEDA(PartsLink.exploratory_data_analysis_detail) };
    navParams[PartsLink.exploratory_data_analysis_graphs] = { useEDA: true, text: 'Plots', link: calcLinkToEDA(PartsLink.exploratory_data_analysis_graphs) };
    navParams[PartsLink.exploratory_data_analysis_graphs_org] = { text: 'Plots', link: calcLinkToRoot(PartsLink.exploratory_data_analysis_graphs_org) };
    navParams[PartsLink.exploratory_data_analysis_graphs_one] = { useEDA: true, text: 'Graph Detail', link: calcLinkToEDA(PartsLink.exploratory_data_analysis_graphs_one, 'edaId=' + encodeURIComponent(paramsProp?.get('edaId') || '')) };
    navParams[PartsLink.exploratory_data_analysis_graphs_one + '#isAdd'] = { useEDA: true, text: 'Add Plot', link: null };
    navParams[PartsLink.exploratory_data_analysis_graphs_one + '#plots'] = { useEDA: true, text: 'Plots', link: null };
    navParams[PartsLink.exploratory_data_analysis_graphs_one_add_function] = { useEDA: true, text: 'Edit Plot', link: null };
    navParams[PartsLink.exploratory_data_analysis_graphs_one_add_function + '#isAdd'] = { useEDA: true, text: 'Add Plot', link: null };
    navParams[PartsLink.exploratory_data_analysis_create] = { useEDA: true, text: 'Create New EDA', link: calcLinkToProject(PartsLink.exploratory_data_analysis_create) };
    navParams[PartsLink.exploratory_data_analysis_collinearity] = { useEDA: true, text: 'Collinearity', link: calcLinkToProject(PartsLink.exploratory_data_analysis_collinearity) };
    navParams[PartsLink.exploratory_data_analysis_data_consistency] = { useEDA: true, text: 'Data Consistency', link: calcLinkToProject(PartsLink.exploratory_data_analysis_data_consistency) };
    navParams[PartsLink.exploratory_data_analysis_data_consistency_analysis] = { useEDA: true, text: 'Data Consistency Analysis', link: calcLinkToProject(PartsLink.exploratory_data_analysis_data_consistency_analysis) };
    navParams[PartsLink.exploratory_data_analysis_timeseries] = { useEDA: true, text: 'Time Series EDA', link: calcLinkToProject(PartsLink.exploratory_data_analysis_timeseries) };
    navParams[PartsLink.python_functions_list] = { noAllProjects: true, text: 'Python Functions', link: calcLinkToRoot(PartsLink.python_functions_list) };
    navParams[PartsLink.python_function_detail] = { noAllProjects: true, usePythonFunctionName: true, text: 'Python Function Detail', link: null };
    navParams[PartsLink.python_functions_edit] = { noAllProjects: true, usePythonFunctionName: true, text: 'Python Function', link: null };
    if (projectId) {
      navParams[PartsLink.python_functions_one + '#notebookId'] = { useProjectName: true, useNotebookName: true, text: 'Notebook', link: calcLinkToProject(PartsLink.python_functions_one) };
    } else {
      navParams[PartsLink.python_functions_one] = { noAllProjects: true, usePythonFunctionName: true, text: 'Edit Python Function', link: calcLinkToProject(PartsLink.python_functions_one) };
      navParams[PartsLink.module_one] = { noAllProjects: true, useModuleName: true, text: 'Edit Module details', link: calcLinkToProject(PartsLink.module_one) };
      navParams[PartsLink.module_one + '#notebookId'] = { noAllProjects: true, useModuleName: true, text: 'Edit Module', link: calcLinkToProject(PartsLink.module_one) };
    }
    navParams[PartsLink.python_functions_one + '#isAdd'] = { noAllProjects: true, usePythonFunctionName: true, text: 'Add Python Function', link: null };
    navParams[PartsLink.pipeline_details] = { noAllProjects: true, usePipelineName: true, text: 'Pipeline Detail', link: null };
    navParams[PartsLink.pipeline_one] = {
      useProjectName: true,
      usePipelineName: true,
      text: 'Notebook',
    };

    navParams[PartsLink.custom_loss_functions_list] = { noAllProjects: true, text: 'Custom Loss Functions', link: calcLinkToRoot(PartsLink.custom_loss_functions_list) };
    navParams[PartsLink.notebook_template_list] = { noAllProjects: true, text: 'Notebook Templates', link: calcLinkToRoot(PartsLink.notebook_template_list) };
    navParams[PartsLink.notebook_template_details] = { noAllProjects: true, useNotebookTemplateName: true, text: 'Notebook Template Details', link: calcLinkToRoot(PartsLink.notebook_template_details) };
    navParams[PartsLink.custom_loss_function_one] = { noAllProjects: true, useCustomLossFunctionName: true, text: 'Edit Custom Loss Function', link: null };
    navParams[PartsLink.custom_loss_function_one + '#notebookId'] = { noAllProjects: true, useCustomLossFunctionName: true, text: 'Notebook', link: null };
    navParams[PartsLink.custom_loss_function_one + '#isAdd'] = { noAllProjects: true, useCustomLossFunctionName: true, text: 'Add Custom Loss Function', link: null };
    navParams[PartsLink.custom_metrics_list] = { noAllProjects: true, text: 'Custom Metrics', link: calcLinkToRoot(PartsLink.custom_metrics_list) };
    navParams[PartsLink.custom_metric_one] = { noAllProjects: true, useCustomMetricName: true, text: 'Edit Custom Metric', link: null };
    navParams[PartsLink.custom_metric_one + '#notebookId'] = { noAllProjects: true, useCustomMetricName: true, text: 'Notebook', link: null };
    navParams[PartsLink.custom_metric_one + '#isAdd'] = { noAllProjects: true, useCustomMetricName: true, text: 'Add Custom Metric', link: null };
    navParams[PartsLink.algorithm_list] = { useModelName: true, hideName: true, text: 'Algorithms', link: calcLinkToRoot(PartsLink.algorithm_list) };
    navParams[PartsLink.algorithm_list + '#projectId'] = { useProjectName: true, useModelName: true, hideName: true, text: 'Algorithms for Project', link: calcLinkToProject(PartsLink.algorithm_list) };
    navParams[PartsLink.algorithm_one + '#projectId'] = { useProjectName: true, useAlgorithmName: true, text: 'Algorithm', link: calcLinkToAlgorithm(PartsLink.algorithm_one, 'isEdit=1') };
    navParams[PartsLink.modules_list] = { noAllProjects: true, hideName: true, text: 'Modules', link: calcLinkToRoot(PartsLink.modules_list) };
    navParams[PartsLink.module_one + '#projectId'] = { useProjectName: true, text: 'Modules', link: calcLinkToAlgorithm(PartsLink.module_one, 'isEdit=1') };

    let algoOneNBLink = calcLinkToProject(PartsLink.algorithm_list) ?? calcLinkToRoot(PartsLink.algorithm_list);
    if (this.props.paramsProp?.get('fromEdit') === '1') {
      algoOneNBLink = ['/' + PartsLink.algorithm_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(algorithmId), 'isEdit=1'];
    }
    navParams[PartsLink.algorithm_one + '#notebookId'] = {
      useProjectName: true,
      useAlgorithmName: true,
      text: 'Algorithm Notebook',
      link: calcLinkToAlgorithm(PartsLink.algorithm_one, `fromEdit=1&notebookId=${encodeURIComponent(notebookId)}`),
      buttonText: 'Finish',
      buttonClick: algoOneNBLink,
    };

    navParams[PartsLink.template_one] = { useTemplateName: true, text: 'Template', link: calcLinkToFeatureGroupTemplate(PartsLink.template_one) };
    navParams[PartsLink.template_detail] = { useTemplateName: true, text: 'Detail', link: calcLinkToFeatureGroupTemplate(PartsLink.template_detail) };
    navParams[PartsLink.decile_prediction_metrics_project] = { useMonitorName: true, text: 'Decile Metrics Detail', link: null };
    navParams[PartsLink.prediction_metrics_detail] = { useFeatureName: true, text: 'Prediction Metrics Detail', link: calcLinkToFeatureGroup(PartsLink.prediction_metrics_detail) };
    navParams[PartsLink.prediction_metrics_add] = { useFeatureName: true, text: 'Prediction Metrics Create', link: calcLinkToProject(PartsLink.prediction_metrics_add) };
    navParams[PartsLink.prediction_metrics_project] = { useFeatureName: true, text: 'Prediction Metrics List', link: calcLinkToProject(PartsLink.prediction_metrics_project) };
    navParams[PartsLink.prediction_metrics_list] = { useFeatureName: true, text: 'Prediction Metrics List', link: calcLinkToFeatureGroup(PartsLink.prediction_metrics_list) };
    navParams[PartsLink.prediction_metrics] = { useMonitorName: true, text: 'Prediction Metrics', link: null };
    navParams[PartsLink.prediction_metrics_bias] = { useMonitorName: true, text: 'Prediction Metrics Bias', link: null };
    navParams[PartsLink.feature_groups_export] = { useFeatureName: true, text: 'Exports', link: calcLinkToFeatureGroup(PartsLink.feature_groups_export) };
    navParams[PartsLink.dataset_snapshot] = { useDatasetName: true, text: 'Snapshot', link: calcLinkToDataset(PartsLink.dataset_snapshot) };
    navParams[PartsLink.feature_groups_snapshot] = { useFeatureName: true, text: 'Snapshot', link: calcLinkToFeatureGroup(PartsLink.feature_groups_snapshot) };
    navParams[PartsLink.feature_groups_export_add] = { useFeatureName: true, text: 'New Export', link: calcLinkToFeatureGroup(PartsLink.feature_groups_export_add) };
    navParams[PartsLink.feature_groups_schedule_add] = { useFeatureName: true, text: 'New Schedule', link: calcLinkToFeatureGroup(PartsLink.feature_groups_schedule_add) };
    navParams[PartsLink.feature_groups_transform] = { useFeatureName: true, text: 'Transform', link: calcLinkToFeatureGroup(PartsLink.feature_groups_transform) };
    navParams[PartsLink.feature_groups_merge] = { useFeatureName: true, text: 'Merge', link: calcLinkToFeatureGroup(PartsLink.feature_groups_merge) };
    navParams[PartsLink.feature_groups_sampling] = { useFeatureName: true, text: 'Sampling', link: calcLinkToFeatureGroup(PartsLink.feature_groups_sampling) };
    navParams[PartsLink.model_train_fg] = { text: 'Train Model', link: calcLinkToProject(PartsLink.model_train_fg) };
    navParams[PartsLink.pretrained_models_add] = { text: 'Register Pre-Trained Model', link: calcLinkToProject(PartsLink.pretrained_models_add) };
    navParams[PartsLink.model_register] = { text: 'Register Model', link: calcLinkToProject(PartsLink.model_register) };
    navParams[PartsLink.model_register_form] = { text: 'Register Model - Form', link: calcLinkToProject(PartsLink.model_register) };
    navParams[PartsLink.model_register_zip] = { text: 'Register Model - Zip', link: calcLinkToProject(PartsLink.model_register) };
    navParams[PartsLink.model_register_git] = { text: 'Register Model - Git', link: calcLinkToProject(PartsLink.model_register) };
    navParams[PartsLink.model_create_drift] = { text: `Create Model${!Constants.flags.hide_monitors_changes ? ' Monitor' : ''}`, link: calcLinkToProject(PartsLink.model_create_drift) };
    navParams[PartsLink.feature_groups_explorer] = { useProjectName: true, useFeatureName: true, text: 'Explore', link: calcLinkToProject(PartsLink.feature_groups_explorer) };
    navParams[PartsLink.features_list] = { useFeatureName: true, text: 'Features', link: calcLinkToFeatureGroup(PartsLink.features_list) };
    navParams[PartsLink.features_list + '#pitGroup'] = { usePITName: true, useFeatureName: true, text: 'PIT Group Detail', link: calcLinkToFeatureGroup(PartsLink.features_list) };
    navParams[PartsLink.features_add] = { useFeatureName: true, text: 'Features - Add', link: calcLinkToFeatureGroup(PartsLink.features_add) };
    navParams[PartsLink.features_add_point_in_time_group] = { usePITName: true, useFeatureName: true, text: 'Add Point-In-Time Group', link: calcLinkToFeatureGroup(PartsLink.features_add_point_in_time_group) };
    navParams[PartsLink.features_add_point_in_time_group + '#isEditName'] = { usePITName: true, useFeatureName: true, text: 'Edit Point-In-Time Group', link: calcLinkToFeatureGroup(PartsLink.features_add_point_in_time_group) };
    navParams[PartsLink.features_add_point_in_time] = { useFeatureName: true, text: 'Features - Add Point-In-Time', link: calcLinkToFeatureGroup(PartsLink.features_add_point_in_time) };
    navParams[PartsLink.features_add_nested] = { useFeatureName: true, text: 'Features - Add Nestead', link: calcLinkToFeatureGroup(PartsLink.features_add_nested) };
    if (projectId) {
      navParams[PartsLink.notebook_one + '#notebookId'] = { useProjectName: true, useNotebookName: true, text: 'Notebook', link: calcLinkToProject(PartsLink.notebook_one) };
      navParams[PartsLink.fast_notebook + '#notebookId'] = { useProjectName: true, useNotebookName: true, text: 'Abacus Notebook', link: calcLinkToProject(PartsLink.notebook_one) };
      navParams[PartsLink.notebook_details + '#notebookId'] = { useProjectName: true, useNotebookName: true, text: 'Notebook Details', link: '/' + PartsLink.notebook_details + '/' + projectId + '/' + notebookId };
    } else {
      navParams[PartsLink.notebook_one] = { noAllProjects: true, useNotebooksAll: false, useNotebookName: true, text: 'Notebook', link: calcLinkToProject(PartsLink.notebook_one) };
      navParams[PartsLink.fast_notebook] = { noAllProjects: true, useNotebooksAll: false, useNotebookName: true, text: 'Abacus Notebook', link: calcLinkToProject(PartsLink.notebook_one) };
      navParams[PartsLink.notebook_details + '#notebookId'] = { noAllProjects: true, useNotebooksAll: false, useNotebookName: true, text: 'Notebook Details', link: '/' + PartsLink.notebook_details + '/-/' + notebookId };
    }
    navParams[PartsLink.monitoring_drift_analysis] = { useBatchPred: true, text: 'Drift Analysis', link: calcLinkToBatchPred(PartsLink.monitoring_drift_analysis) };
    navParams[PartsLink.monitoring_outliers] = { useBatchPred: true, text: 'Outliers', link: calcLinkToProject(PartsLink.monitoring_outliers) };
    navParams[PartsLink.monitoring_pred_log] = { useMonitoringName: true, text: 'Prediction Log', link: calcLinkToMonitoring(PartsLink.monitoring_pred_log) };
    navParams[PartsLink.monitoring_metrics] = { useMonitoringName: true, text: 'Real-Time Metrics', link: calcLinkToMonitoring(PartsLink.monitoring_metrics) };
    navParams[PartsLink.monitoring_drift] = { useMonitoringName: true, text: 'Model Drift', link: calcLinkToMonitoring(PartsLink.monitoring_drift) };
    navParams[PartsLink.monitoring_data_integrity] = { useMonitoringName: true, text: 'Data Integrity', link: calcLinkToMonitoring(PartsLink.monitoring_data_integrity) };
    navParams[PartsLink.realtime_data_integrity] = { useModelName: true, text: 'Data Integrity', link: calcLinkToMonitoring(PartsLink.realtime_data_integrity) };
    navParams[PartsLink.monitoring_drift_bp] = { useMonitoringName: true, text: 'Model Drift Batch Prediction', link: calcLinkToMonitoring(PartsLink.monitoring_drift_bp) };
    navParams[PartsLink.monitoring] = { useMonitoringName: true, text: 'Deployments', link: calcLinkToMonitoring(PartsLink.monitoring) };
    navParams[PartsLink.dataset_list] = { text: 'Datasets', link: calcLinkToProject(PartsLink.dataset_list) };
    navParams[PartsLink.dataset_streaming] = { useDatasetName: true, text: 'Streaming', link: calcLinkToDatasetAndProject(PartsLink.dataset_streaming) };
    navParams[PartsLink.dataset_schema_wizard] = { useDatasetName: true, text: 'Schema Wizard', link: calcLinkToProject(PartsLink.dataset_list) };
    navParams[PartsLink.dataset_for_usecase] = { text: 'Datasets', link: calcLinkToProject(PartsLink.dataset_for_usecase) };
    navParams[PartsLink.model_list] = { text: (isEmbeddingsOnly ? 'Catalogs' : isAiAgent ? 'Agents' : 'Models') + ' List', link: calcLinkToProject(PartsLink.model_list) };
    navParams[PartsLink.model_train] = { useModelName: true, useModelNameOnlyTag: true, text: 'Train', link: calcLinkToProject(PartsLink.model_train) };
    navParams[PartsLink.model_detail] = { useModelName: true, text: 'Detail', link: calcLinkToModel(PartsLink.model_detail, true) };
    navParams[PartsLink.model_explanations] = { useModelName: true, text: 'Explanations', link: calcLinkToProject(PartsLink.model_explanations) };
    navParams[PartsLink.deploy_create_fg] = { useFeatureName: true, text: 'New Deployment', link: calcLinkToFeatureGroupProjectFirst(PartsLink.deploy_create_fg) };
    navParams[PartsLink.deploy_create_form] = { useProjectName: true, text: 'New Deployment', link: calcLinkToProject(PartsLink.deploy_create_form) };
    navParams[PartsLink.deploy_create] = { useModelName: true, text: 'New Deployment', link: calcLinkToModel(PartsLink.deploy_create, true) };
    navParams[PartsLink.deploy_create + '#editDeployId'] = { useModelName: true, text: 'Update Deployment', link: null };
    navParams[PartsLink.webhook_one] = { useDeployName: true, text: 'Webhook', link: null };
    navParams[PartsLink.deploy_detail] = { useDeployName: true, text: 'Detail', link: calcLinkToDeploy(PartsLink.deploy_detail) };
    navParams[PartsLink.deploy_detail + '#showThreshold'] = { useDeployName: true, text: 'Threshold', link: calcLinkToDeploy(PartsLink.deploy_detail) };
    navParams[PartsLink.set_threshold] = { text: 'Threshold', link: calcLinkToProject(PartsLink.set_threshold) };
    navParams[PartsLink.deploy_detail + '#showConfig'] = { useDeployName: true, text: 'Configuration', link: calcLinkToDeploy(PartsLink.deploy_detail) };
    navParams[PartsLink.notebook_model] = { text: 'Notebook', link: calcLinkToProject(PartsLink.notebook_model) };
    navParams[PartsLink.model_detail_monitor] = { useMonitorName: true, text: 'Monitor Detail', link: calcLinkToMonitor(PartsLink.model_detail_monitor) };
    navParams[PartsLink.monitor_data_integrity] = { useMonitorName: true, text: 'Data Integrity', link: calcLinkToMonitor(PartsLink.monitor_data_integrity) };
    navParams[PartsLink.model_metrics_summary] = { useMonitorName: true, text: 'Summary', link: calcLinkToMonitorProjectFrist(PartsLink.model_metrics_summary) };
    navParams[PartsLink.monitor_drift] = { useMonitorName: true, text: 'Drift', link: calcLinkToMonitor(PartsLink.monitor_drift) };
    navParams[PartsLink.monitor_outliers] = { useMonitorName: true, text: 'Outliers', link: calcLinkToMonitor(PartsLink.monitor_outliers) };
    navParams[PartsLink.monitor_drift_analysis] = { useMonitorName: true, text: 'Drift Analysis', link: calcLinkToMonitor(PartsLink.monitor_drift_analysis) };

    navParams[PartsLink.monitors_alert_events] = {
      useMonitorName: !!showModelMonitorsDriftTypeCase,
      useMonitoringName: !showModelMonitorsDriftTypeCase,
      text: 'Alerts - Events',
      link: calcLinkToMonitor(PartsLink.monitors_alert_events, 'monitorAlertId=' + encodeURIComponent(monitorAlertId ?? '')),
    };
    navParams[PartsLink.monitors_alert_list] = { useMonitorName: !!showModelMonitorsDriftTypeCase, useMonitoringName: !showModelMonitorsDriftTypeCase, text: 'Alerts', link: calcLinkToMonitor(PartsLink.monitors_alert_list) };
    navParams[PartsLink.monitors_alert_add] = { useMonitorName: true, text: 'Create Alert', link: calcLinkToMonitor(PartsLink.monitors_alert_add) };
    navParams[PartsLink.monitors_alert_add + '#isEdit'] = { useMonitorName: true, text: 'Edit Alert', link: null };

    navParams[PartsLink.monitor_alerts] = { useMonitorName: !!showModelMonitorsDriftTypeCase, useMonitoringName: !showModelMonitorsDriftTypeCase, text: 'Alerts', link: calcLinkToMonitor(PartsLink.monitor_alerts) };
    navParams[PartsLink.monitor_metrics] = { useMonitorName: true, text: 'Metrics', link: calcLinkToMonitor(PartsLink.monitor_metrics) };
    navParams[PartsLink.monitor_alerts_add] = { useMonitorName: true, text: 'Create Alert', link: calcLinkToMonitor(PartsLink.monitor_alerts_add) };
    navParams[PartsLink.monitors_list] = { text: 'Monitors List', link: calcLinkToProject(PartsLink.monitors_list) };

    navParams[PartsLink.deploy_tokens_list] = { useDeployName: true, text: 'Tokens', link: calcLinkToProject(PartsLink.deploy_tokens_list) };

    navParams[PartsLink.templates_list] = { noAllProjects: true, text: 'Templates', link: '/' + PartsLink.templates_list };
    navParams[PartsLink.notebook_list] = { noAllProjects: true, text: 'Notebooks', link: '/' + PartsLink.notebook_list };
    navParams[PartsLink.notebook_list + '#projectId'] = { useProjectName: true, text: 'Notebooks', link: calcLinkToProject(PartsLink.notebook_list) };
    navParams[PartsLink.featuregroups_list] = { noAllProjects: true, text: 'Feature Groups', link: '/' + PartsLink.featuregroups_list };

    navParams[PartsLink.monitors_org_list] = { noAllProjects: true, text: 'Monitors', link: ['/' + PartsLink.monitors_org_list, 'starred=1'] };
    navParams[PartsLink.monitors_org_one] = { noAllProjects: true, text: 'Monitors', link: '/' + PartsLink.monitors_org_one };
    navParams[PartsLink.monitors_org_summary] = { noAllProjects: true, text: 'Monitoring Dash - Summary', link: '/' + PartsLink.monitors_org_summary };

    navParams[PartsLink.datasets_all] = { noAllProjects: true, text: 'Datasets', link: '/' + PartsLink.datasets_all };
    navParams[PartsLink.project_list] = { noAllProjects: true, text: 'Projects', link: '/' + PartsLink.project_list };
    navParams[PartsLink.project_add] = { text: 'Project Add' };
    navParams[PartsLink.docker_add] = { text: 'Docker Add' };
    navParams[PartsLink.project_dashboard] = { text: 'Dashboard', link: calcLinkToProject(PartsLink.project_dashboard, mode === PartsLink.dataset_schema || mode === PartsLink.dataset_for_usecase ? null : '?doUpload=true') };
    navParams[PartsLink.profile + ' ' + UserProfileSection.general] = { noAllProjects: true, text: 'Profile', link: '/' + PartsLink.profile + '/' + UserProfileSection.general };
    navParams[PartsLink.profile + ' ' + UserProfileSection.team] = { useProfile: true, noAllProjects: true, text: 'Team', link: '/' + PartsLink.profile + '/' + UserProfileSection.team };
    navParams[PartsLink.profile + ' ' + UserProfileSection.invites] = { useProfile: true, noAllProjects: true, text: 'Invites', link: '/' + PartsLink.profile + '/' + UserProfileSection.team };
    navParams[PartsLink.profile + ' ' + UserProfileSection.connected_services] = { useProfile: true, noAllProjects: true, text: 'Connected Services', link: '/' + PartsLink.profile + '/' + UserProfileSection.connected_services };
    navParams[PartsLink.profile + ' ' + UserProfileSection.apikey] = { useProfile: true, noAllProjects: true, text: 'API Keys', link: '/' + PartsLink.profile + '/' + UserProfileSection.apikey };
    navParams[PartsLink.profile + ' ' + UserProfileSection.billing] = { useProfile: true, noAllProjects: true, text: 'Billing', link: '/' + PartsLink.profile + '/' + UserProfileSection.billing };
    navParams[PartsLink.profile + ' ' + UserProfileSection.usage] = { useProfile: true, noAllProjects: true, text: 'Current Usage', link: '/' + PartsLink.profile + '/' + UserProfileSection.usage };
    navParams[PartsLink.profile + ' ' + UserProfileSection.invoices] = { useProfile: true, noAllProjects: true, text: 'Invoices', link: '/' + PartsLink.profile + '/' + UserProfileSection.invoices };
    navParams[PartsLink.dataset_upload] = { text: 'New Dataset' };
    navParams[PartsLink.dataset_upload_step2] = { text: 'New Dataset' };
    navParams[PartsLink.dataset_attach] = { text: 'Attach Dataset' };
    navParams[PartsLink.batchpred_add_fg] = { text: 'Attach Feature Group' };
    navParams[PartsLink.feature_group_attach] = { text: 'Attach Feature Group' };
    navParams[PartsLink.dataset_detail] = { useDatasetName: true, text: 'Detail', link: calcLinkToDatasetAndProject(PartsLink.dataset_detail) };
    navParams[PartsLink.dataset_schema] = { useDatasetName: true, text: 'Schemas', link: calcLinkToDatasetAndProject(PartsLink.dataset_schema, datasetIsFG ? 'useFeatureGroupId=true' : null) };
    navParams[PartsLink.dataset_raw_data] = { useDatasetName: true, text: 'Raw Data', link: calcLinkToDatasetAndProject(PartsLink.dataset_raw_data, extraDatasetVersion) };
    navParams[PartsLink.dataset_data_explorer] = { useDatasetName: true, text: 'Data Exploration', link: calcLinkToDatasetAndProject(PartsLink.dataset_data_explorer, extraDatasetVersion) };
    navParams['parent_models'] = { text: 'Models', link: calcLinkToProject(PartsLink.model_list) || '/' + PartsLink.model_list };
    navParams[PartsLink.model_augmentation] = { useModelName: true, text: 'Augmentation', link: calcLinkToModel(PartsLink.model_augmentation, true) };
    navParams[PartsLink.model_metrics] = { useModelName: true, useMetricsName: false, text: 'Metric', link: calcLinkToProject(PartsLink.model_metrics) };
    navParams[PartsLink.model_metrics + 'detail'] = { useModelName: true, useMetricsName: false, text: 'Metric', link: calcLinkToProject(PartsLink.model_metrics, !Utils.isNullOrEmpty(modelId) ? '?detailModelId=' + modelId : null) };
    navParams[PartsLink.deploy_list] = { text: 'Deployments', link: calcLinkToModelOrOnlyProject(PartsLink.deploy_list) };
    navParams['parent_predictions'] = { text: 'Predictions', link: calcLinkToProjectAndDeployOrOnlyProject(PartsLink.model_predictions) || calcLinkToProject(PartsLink.model_predictions) };
    navParams[PartsLink.deploy_batch] = { useDeployName: 'one', text: 'Batch Predictions', link: /*calcLinkToProjectAndDeployOrOnlyProject*/ calcLinkToProject(PartsLink.deploy_batch, '?showList=true') };

    navParams[PartsLink.model_predictions_request] = { parentId: 'parent_predictions', text: 'Prediction Request', link: calcLinkToDeploy(PartsLink.model_predictions_request) };
    navParams[PartsLink.model_predictions] = { useDeployName: true, text: 'Dashboard', link: calcLinkToDatasetAndProject(PartsLink.dataset_data_explorer) };
    navParams[PartsLink.deploy_predictions_api] = { parentId: 'parent_predictions', text: 'Predictions API', link: calcLinkToProjectAndDeployOrOnlyProject(PartsLink.deploy_predictions_api) };
    navParams[PartsLink.search_adv] = { noAllProjects: true, text: 'Search Advanced' };
    navParams[PartsLink.deploy_lookup_api] = { useProjectName: true, useDeployName: true, text: 'Look-Up API', link: calcLinkToProjectAndDeployOrOnlyProject(PartsLink.deploy_lookup_api) };

    navParams[PartsLink.batchpred_create] = { useBatchPred: true, text: 'Create/Edit' };
    navParams[PartsLink.batchpred_detail] = { useBatchPred: true, text: 'Detail', link: calcLinkToBatchPred(PartsLink.batchpred_detail) };
    navParams[PartsLink.batchpred_datasets] = { useBatchPred: true, text: 'Datasets', link: calcLinkToBatchPred(PartsLink.batchpred_datasets) };
    navParams[PartsLink.batchpred_featuregroups] = { useBatchPred: true, text: 'Feature Groups', link: calcLinkToBatchPred(PartsLink.batchpred_featuregroups) };
    navParams[PartsLink.batchpred_rawdata] = { useBatchPred: true, text: 'Raw Data', link: calcLinkToBatchPred(PartsLink.batchpred_rawdata) };

    if (this.props.paramsProp?.get('datasetId')) {
      navParams[PartsLink.rawdata_visual] = { useDatasetName: true, text: 'Raw Data - Visual', link: calcLinkToProjectParams(PartsLink.dataset_raw_data, 'datasetId=' + encodeURIComponent(datasetId)) };
    } else {
      navParams[PartsLink.rawdata_visual] = { useFeatureName: true, text: 'Raw Data - Visual', link: calcLinkToProjectParams(PartsLink.dataset_raw_data, 'featureGroupId=' + encodeURIComponent(featureGroupId)) };
    }

    if (!_.isEqual(this.navParams, navParams)) {
      this.navParams = navParams;

      setTimeout(() => {
        StoreActions.setNavParams_(navParams);
      });
    }

    if (batchPredId) {
      mode = calcModeForBatchPred(mode);
    }
    if (mode === PartsLink.model_predictions && this.props.paramsProp?.get('requestId')) {
      mode = PartsLink.monitoring_pred_log;
    }

    if (!showModels && !showDatasets && !showProjects && !showDatasetItem && !showMonitoring && !showBatchPredictions) {
      if (mode !== PartsLink.docker_add && mode !== PartsLink.project_add) {
        showAllDatasets = true;
        showAllFG = true;
        showAllNotebooks = true;
        showAllAlgorithms = true;
        showAllPythonFunctions = true;
        showAllCustomLossFunctions = true;
        showNotebookTemplateList = true;
        showAllCustomMetrics = true;
        showAllModelMonitors = true;
        showAllTemplates = true;
      }
    }

    if (projectId == null) {
      if ([PartsLink.algorithm_one, PartsLink.template_detail, PartsLink.template_one].includes(mode)) {
        isAllOrgLevel = true;

        showAllNotebooks = true;
        showAllAlgorithms = true;
        showAllPythonFunctions = true;
        showAllCustomLossFunctions = true;
        showNotebookTemplateList = true;
        showAllCustomMetrics = true;
        showAllModelMonitors = true;
        showAllTemplates = true;
        showAllFG = true;

        showDatasets = false;
        showMonitoring = false;

        showAllTemplates = true;
      } else {
        if (PartsLinkIsFeatureGroups(mode) && !(projectId != null && [PartsLink.feature_groups_template_add].includes(mode))) {
          if (projectId == null) {
            showDatasets = false;
          }

          showAllFG = false;
          showFeatureGroups = true;
          showMonitoring = false;
        }

        if (datasetId && PartsLinkIsDataset(mode, false)) {
          showDatasetItem = true;
          showDatasets = true;
          showModels = false;
          showAlgorithms = false;
          showDeployments = false;
          showBatchPredictions = false;
        }
      }
    }

    if (mode === PartsLink.dataset_for_usecase) {
      showDatasets = false;
      showFeatureGroups = false;
      showEDA = false;
      showAllDatasets = false;
      showAllFG = false;
      showAllNotebooks = false;
      showAllAlgorithms = false;
      showAllPythonFunctions = false;
      showAllCustomLossFunctions = false;
      showNotebookTemplateList = false;
      showAllCustomMetrics = false;
      showAllModelMonitors = false;
      showAllTemplates = false;

      showProjects = false;
      showDatasets = false;
      showModels = false;
      showAlgorithms = false;
      showDatasetItem = false;
      showModelsItem = false;
      showPredictions = false;
      showPredictionsItem = false;
      showMonitoring = false;
      showMonitoringItem = false;
    }

    if (isAllOrgLevel) {
      showMonitoring = false;
    }

    if (!Constants.flags.templates) {
      showAllTemplates = false;
    }
    if (isTemplatesAllEmpty) {
      showAllTemplates = false;
    }
    if (!Constants.flags.algos) {
      showAllAlgorithms = false;
    }
    if (Constants.flags.hide_python_functions) {
      showAllPythonFunctions = false;
    }
    if (Constants.flags.hide_custom_loss_functions) {
      showAllCustomLossFunctions = false;
    }
    if (Constants.flags.hide_custom_metrics) {
      showAllCustomMetrics = false;
    }
    if (Constants.flags.hide_monitors_changes) {
      showAllModelMonitors = false;
    }

    if (showAllModelMonitors) {
      showAllDatasets = true;
    }

    let modelMonitorVersion = paramsProp?.get('useModelMonitorVersion');

    let onNotebookInside = [PartsLink.notebook_fg, PartsLink.notebook_model, PartsLink.notebook_one].includes(mode);

    let showAnnotationsNav = mode === PartsLink.annotations_edit;
    if (!showAnnotationsNav) {
      if (featureGroupOne?.featureGroupType?.toUpperCase() === Constants.ANNOTATING) {
        showAnnotationsNav = true;
      }
    }
    if (Constants.flags.hide_annotations) {
      showAnnotationsNav = false;
    }
    if (showAnnotationsNav) {
      if (!_.isArray(Constants.flags.annotations_for_usecases_list) || !Constants.flags.annotations_for_usecases_list?.map((s1) => s1?.toLowerCase())?.includes(foundProject1?.useCase?.toLowerCase() || '---')) {
        showAnnotationsNav = false;
      }
    }

    if (docStoreDef?.hideEDANavLeft === true) {
      showEDA = false;
    }

    return (
      <NavLeftContainer navLeftCollapsed={navLeftCollapsed} onClickRoot={this.onClickRoot} onClickExpand={this.onClickExpand} onClickLogo={this.onClickLogo} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} onNotebookInside={onNotebookInside} showFreeConsultation={showFreeConsultation}>
        {(() => {
          if (isProfile) {
            return <ProfileNavLeft navLeftCollapsed={navLeftCollapsed} mode={mode} profileSection={profileSection} />;
          }
          if (!foundProject1) {
            return (
              <>
                <ProjectsNavLeft navLeftCollapsed={navLeftCollapsed} mode={mode} calcLinkToProject={calcLinkToProject} projectName={projectName} />
                <NavLeftGroup hideChevron openParts={[PartsLink.dataset_snapshot, PartsLink.datasets_all, PartsLink.dataset_list, datasetId ? PartsLink.rawdata_visual : null, PartsLink.dataset_upload, PartsLink.dataset_upload_step2, PartsLink.dataset_external_import_new_version, PartsLink.dataset_attach, PartsLink.dataset_detail, PartsLink.dataset_schema, PartsLink.dataset_raw_data, PartsLink.dataset_visualize, PartsLink.dataset_data_explorer]} saveOpenStateName={'datasets'}>
                  <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={-2} iconName={IconDatasets} text="Datasets" isSelected={mode === PartsLink.datasets_all} isFolderSelected={mode === PartsLink.dataset_detail || mode === PartsLink.dataset_schema || mode === PartsLink.dataset_raw_data || mode === PartsLink.dataset_visualize || mode === PartsLink.dataset_data_explorer || mode === PartsLink.dataset_upload} isTitle={false} linkUrl={'/' + PartsLink.datasets_all} />
                  {(mode === PartsLink.dataset_upload || mode === PartsLink.dataset_upload_step2) && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2 + (projectId == null && datasetId == null ? -2 : 0)} text="New Dataset" isSelected={true} isTitle={false} linkUrl={null} />}
                  {mode === PartsLink.dataset_external_import_new_version && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Read Dataset" isSelected={true} isTitle={false} linkUrl={null} />}
                  {mode === PartsLink.dataset_attach && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Attach Dataset" isSelected={true} isTitle={false} linkUrl={null} />}
                  {mode === PartsLink.dataset_snapshot && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Snapshot" isSelected={true} isTitle={false} linkUrl={null} />}
                  {datasetId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Detail" isSelected={mode === PartsLink.dataset_detail} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_detail)} />}

                  {datasetId != null && !batchPredId && showDatasets && !isStreaming && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Schemas" indent={addIndent + 2} isSelected={mode === PartsLink.dataset_schema} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_schema, datasetIsFG ? 'useFeatureGroupId=true' : null)} />}
                  {datasetId != null && showDatasets && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Data Exploration" indent={addIndent + 2} isSelected={mode === PartsLink.dataset_data_explorer} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_data_explorer, extraDatasetVersion)} />}
                  {datasetId != null && showDatasets && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Raw Data" indent={addIndent + 2} isSelected={mode === PartsLink.dataset_raw_data || mode === PartsLink.rawdata_visual} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_raw_data, extraDatasetVersion)} />}
                </NavLeftGroup>
                {showAllPythonFunctions && (
                  <NavLeftGroup openParts={[PartsLink.feature_groups_template_add, PartsLink.template_detail, PartsLink.template_one, PartsLink.templates_list, PartsLink.featuregroups_list]} saveOpenStateName={'templates_folder'} hideChevron>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconFeatureGroupsList} indent={-2} text={'Feature Groups'} isFolderSelected={[PartsLink.feature_groups_template_add, PartsLink.template_detail, PartsLink.template_one, PartsLink.templates_list, PartsLink.featuregroups_list].includes(mode)} isSelected={mode === PartsLink.featuregroups_list} isTitle={false} linkUrl={'/' + PartsLink.featuregroups_list} />
                    {showAllTemplates && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconTemplates} indent={addIndent + 2} text="Templates" isFolderSelected={mode === PartsLink.templates_list} isSelected={mode === PartsLink.feature_groups_template_add || mode === PartsLink.template_one || mode === PartsLink.template_detail || mode === PartsLink.templates_list} isTitle={false} linkUrl={'/' + PartsLink.templates_list} />}
                  </NavLeftGroup>
                )}
                {showFeatureGroups && (
                  <NavLeftGroup openParts={[PartsLink.feature_group_attach, PartsLink.feature_groups_constraint, PartsLink.feature_groups_constraint_add, PartsLink.feature_groups_data_explorer, PartsLink.feature_groups, PartsLink.feature_group_detail, PartsLink.feature_groups_explorer, PartsLink.feature_groups_add, PartsLink.feature_groups_history, PartsLink.feature_groups_edit, PartsLink.feature_groups_template_add, PartsLink.feature_groups_template_list, PartsLink.feature_groups_template, PartsLink.feature_groups_export, PartsLink.feature_groups_transform, PartsLink.feature_groups_merge, PartsLink.feature_groups_sampling, PartsLink.feature_groups_snapshot, PartsLink.feature_groups_export_add, PartsLink.feature_groups_schedule_add, PartsLink.features_list, PartsLink.dagviewer, PartsLink.features_add, PartsLink.annotations_edit, PartsLink.features_rawdata]} saveOpenStateName={'featureGroups'}>
                    {showFeatureGroupsItem && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={projectId == null ? IconFeatureGroupsList : IconFeatureGroups} indent={addIndentWithChevron - 1.2} text="Feature Groups" isSelected={mode === PartsLink.feature_groups || mode === PartsLink.feature_groups_explorer} isFolderSelected={PartsLinkIsFeatureGroups(mode)} isTitle={false} linkUrl={projectId == null ? '/' + PartsLink.featuregroups_list : calcLinkToProject(PartsLink.feature_groups)} />}
                    {featureGroupId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Detail" indent={addIndent + 2} isSelected={mode === PartsLink.feature_group_detail} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_group_detail)} />}
                    {mode === PartsLink.feature_group_attach && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Attach Feature Group" isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group Add" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_history && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group History" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_edit && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group Edit" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_snapshot && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - Snapshot" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_export_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - New Export" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_schedule_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - New Schedule" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_sampling && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - Sampling" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_merge && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - Merge" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_transform && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - Transform" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_export && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Exports" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_groups_export)} />}
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features" indent={addIndent + 2} isSelected={mode === PartsLink.features_list || mode === PartsLink.features_add || mode === PartsLink.features_add_nested || mode === PartsLink.features_add_point_in_time_group || mode === PartsLink.features_add_point_in_time} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.features_list)} />
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Explore" indent={addIndent + 2} isSelected={mode === PartsLink.feature_groups_data_explorer} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_groups_data_explorer)} />
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Materialized Data" indent={addIndent + 2} isSelected={mode === PartsLink.features_rawdata} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.features_rawdata, featureGroupVersion != null ? 'featureGroupVersion=' + encodeURIComponent(featureGroupVersion) : undefined)} />
                    {mode === PartsLink.feature_groups_constraint && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Constraint" indent={addIndent + 2} isSelected={mode === PartsLink.feature_groups_constraint} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_groups_constraint)} />}
                    {mode === PartsLink.feature_groups_constraint_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text={`${paramsProp?.get('constraintEdit') ? 'Edit Constraint' : 'Add Constraint'}`} indent={addIndent + 2} isSelected={mode === PartsLink.feature_groups_constraint_add} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_groups_constraint_add)} />}
                    {Constants.flags.templates && !isTemplatesProjectEmpty && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Templates" indent={addIndent + 2} isSelected={[PartsLink.feature_groups_template_add, PartsLink.feature_groups_template, PartsLink.feature_groups_template_list].includes(mode)} isTitle={false} linkUrl={calcLinkToProject(PartsLink.feature_groups_template_list) ?? calcLinkToRoot(PartsLink.templates_list)} />}

                    {mode === PartsLink.dagviewer && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Dag Viewer" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.dagviewer)} />}
                  </NavLeftGroup>
                )}
                {!showAllFG && PartsLinkIsFeatureGroups(mode) && showAllTemplates && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconTemplates} text="Templates" isFolderSelected={mode === PartsLink.templates_list} isSelected={mode === PartsLink.feature_groups_template_add || mode === PartsLink.template_detail || mode === PartsLink.templates_list} isTitle={false} linkUrl={'/' + PartsLink.templates_list} />}

                {(showFeatureGroups || showDatasetItem || mode === PartsLink.dataset_upload || showDatasets || showAllNotebooks) && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconNotebooks} text={'Notebooks'} isFolderSelected={mode === PartsLink.notebook_list} isSelected={mode === PartsLink.notebook_list} isTitle={false} linkUrl={'/' + PartsLink.notebook_list} />}
                {mode === PartsLink.notebook_details && (
                  <NavLeftGroup hideChevron saveOpenStateName={'notebooks_details'} openParts={[PartsLink.notebook_list, PartsLink.notebook_details]}>
                    {notebookId && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent - 2} text="Details" isFolderSelected={mode === PartsLink.notebook_details} isSelected={mode === PartsLink.notebook_details} isTitle={false} linkUrl={projectId == null ? `/${PartsLink.notebook_details}/-/${notebookId}` : calcLinkToProject(PartsLink.notebook_details, `/${notebookId}`)} />}
                  </NavLeftGroup>
                )}
                {(showFeatureGroups || showDatasetItem || mode === PartsLink.dataset_upload || showDatasets || showAllAlgorithms || showAllPythonFunctions || showAllCustomLossFunctions || showAllCustomMetrics || showNotebookTemplateList) && (
                  <NavLeftGroup openParts={[PartsLink.algorithm_list, PartsLink.exploratory_data_analysis_graphs_org, PartsLink.python_functions_list, PartsLink.python_functions_one, PartsLink.python_function_detail, PartsLink.python_functions_edit, PartsLink.algorithm_one, PartsLink.custom_loss_functions_list, PartsLink.custom_loss_function_one, PartsLink.custom_metrics_list, PartsLink.custom_metric_one, PartsLink.module_one, PartsLink.modules_list, PartsLink.notebook_template_list, PartsLink.notebook_template_details]} hideChevron>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconAlgorithms} indent={-2} text={'Custom Code'} isFolderSelected={[PartsLink.algorithm_list, PartsLink.python_functions_list, PartsLink.python_function_detail, PartsLink.python_functions_edit, PartsLink.algorithm_one, PartsLink.custom_loss_functions_list, PartsLink.custom_loss_function_one, PartsLink.custom_metrics_list, PartsLink.custom_metric_one, PartsLink.notebook_template_list, PartsLink.notebook_template_details].includes(mode)} isSelected={false} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.algorithm_list)} />
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconModules} text={'Modules'} isSelected={mode === PartsLink.module_one || mode === PartsLink.modules_list} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.modules_list)} />
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconAlgorithms} text={'Algorithms'} isSelected={mode === PartsLink.algorithm_list || mode === PartsLink.algorithm_one} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.algorithm_list)} />
                    {showAllPythonFunctions && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconPythonFunctions} text={'Functions'} isSelected={mode === PartsLink.python_functions_list || mode === PartsLink.python_function_detail || mode === PartsLink.python_functions_edit || (mode === PartsLink.python_functions_one && paramsProp?.get('typeParam') !== 'PLOTLY_FIG')} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.python_functions_list)} />}
                    {<NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconPythonFunctions} text={'Plots'} isSelected={mode === PartsLink.exploratory_data_analysis_graphs_org || (mode === PartsLink.python_functions_one && paramsProp?.get('typeParam') === 'PLOTLY_FIG')} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.exploratory_data_analysis_graphs_org)} />}
                    {showAllCustomLossFunctions && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconCustomLossFunctions} text={'Loss Functions'} isSelected={mode === PartsLink.custom_loss_functions_list || mode === PartsLink.custom_loss_function_one} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.custom_loss_functions_list)} />}
                    {showAllCustomMetrics && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconCustomMetrics} text={'Metrics'} isSelected={mode === PartsLink.custom_metrics_list || mode === PartsLink.custom_metric_one} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.custom_metrics_list)} />}
                    {isSystemObjectsOrg && showNotebookTemplateList && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconCustomLossFunctions} text={'Notebook Templates'} isSelected={mode === PartsLink.notebook_template_list || mode === PartsLink.notebook_template_details} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.notebook_template_list)} />}
                  </NavLeftGroup>
                )}

                {(showFeatureGroups || showDatasetItem || mode === PartsLink.dataset_upload || showDatasets || (!Constants.flags.hide_monitors_changes && showAllModelMonitors)) && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconModelMonitorSummary} text={'Monitoring Dash'} isSelected={mode === PartsLink.monitors_org_summary} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.monitors_org_summary)} />}
                {<NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconPipelines} indent={-2} text={'Pipelines'} isFolderSelected={PartsLinkIsPipelines(mode)} isSelected={mode === PartsLink.pipeline_list} isTitle={false} linkUrl={calcLinkToRoot(PartsLink.pipeline_list)} />}
                {mode === PartsLink.pipeline_details && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={1} text="Pipeline Details" isSelected isTitle={false} />}
              </>
            );
          } else {
            return (
              <>
                <ProjectsNavLeft navLeftCollapsed={navLeftCollapsed} mode={mode} calcLinkToProject={calcLinkToProject} projectName={projectName} />
                {mode === PartsLink.docker_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={1} text="Docker Add" isSelected={mode === PartsLink.docker_add} isTitle={false} />}

                {showNotebooks && (
                  <NavLeftGroup saveOpenStateName={'notebooks'} hideChevron={!notebookId} openParts={[PartsLink.notebook_list, PartsLink.notebook_details]}>
                    {calcLinkToProject(PartsLink.notebook_list) && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={notebookId ? addIndentWithChevron - 1.2 : addIndentWithChevron - 2} iconName={IconNotebooks} text="Notebooks" isSelected={mode === PartsLink.notebook_list} isFolderSelected={mode === PartsLink.notebook_list || mode === PartsLink.notebook_details} isTitle={false} linkUrl={projectId == null ? '/' + PartsLink.notebook_list : calcLinkToProject(PartsLink.notebook_list)} />}
                    {(mode === PartsLink.notebook_list || mode === PartsLink.notebook_details) && notebookId && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Details" isSelected={mode === PartsLink.notebook_details} isTitle={false} linkUrl={projectId == null ? `/${PartsLink.notebook_details}/-/${notebookId}` : calcLinkToProject(PartsLink.notebook_details, `/${notebookId}`)} />}
                  </NavLeftGroup>
                )}

                {(showDatasetItem || mode === PartsLink.dataset_upload || showDatasets) && (
                  <NavLeftGroup hideChevron={(mode === PartsLink.dataset_upload || mode === PartsLink.dataset_upload_step2) && projectId == null && datasetId == null} openParts={[PartsLink.dataset_snapshot, PartsLink.dataset_list, datasetId ? PartsLink.rawdata_visual : null, PartsLink.dataset_upload, PartsLink.dataset_upload_step2, PartsLink.dataset_external_import_new_version, PartsLink.dataset_attach, PartsLink.dataset_detail, PartsLink.dataset_schema, PartsLink.dataset_raw_data, PartsLink.dataset_visualize, PartsLink.dataset_data_explorer]} saveOpenStateName={'datasets'}>
                    {showDatasetItem && (calcLinkToProject(PartsLink.dataset_list) || (projectId == null && datasetId != null)) && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndentWithChevron - 1.2} iconName={IconDatasets} text="Datasets" isSelected={mode === PartsLink.dataset_list} isFolderSelected={mode === PartsLink.dataset_detail || mode === PartsLink.dataset_schema || mode === PartsLink.dataset_raw_data || mode === PartsLink.dataset_visualize || mode === PartsLink.dataset_data_explorer || mode === PartsLink.dataset_upload} isTitle={false} linkUrl={projectId == null ? '/' + PartsLink.datasets_all : calcLinkToProject(PartsLink.dataset_list)} />}
                    {(mode === PartsLink.dataset_upload || mode === PartsLink.dataset_upload_step2) && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2 + (projectId == null && datasetId == null ? -2 : 0)} text="New Dataset" isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.dataset_external_import_new_version && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Read Dataset" isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.dataset_attach && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Attach Dataset" isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.dataset_snapshot && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Snapshot" isSelected={true} isTitle={false} linkUrl={null} />}
                    {datasetId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Detail" isSelected={mode === PartsLink.dataset_detail} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_detail)} />}

                    {!batchPredId && showDatasets && !isStreaming && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Schemas" indent={addIndent + 2} isSelected={mode === PartsLink.dataset_schema} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_schema, datasetIsFG ? 'useFeatureGroupId=true' : null)} />}
                    {!batchPredId && showDatasets && !isStreaming && Constants.flags.visuals_dataset && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Visualize" indent={addIndent + 2} isSelected={mode === PartsLink.dataset_visualize} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_visualize)} />}
                    {showDatasets && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Data Exploration" indent={addIndent + 2} isSelected={mode === PartsLink.dataset_data_explorer} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_data_explorer, extraDatasetVersion)} />}
                    {showDatasets && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Raw Data" indent={addIndent + 2} isSelected={mode === PartsLink.dataset_raw_data || mode === PartsLink.rawdata_visual} isTitle={false} linkUrl={calcLinkToDatasetAndProject(PartsLink.dataset_raw_data, extraDatasetVersion)} />}
                  </NavLeftGroup>
                )}

                {showFeatureGroups && (
                  <NavLeftGroup openParts={[PartsLink.feature_group_attach, PartsLink.feature_groups_constraint, PartsLink.feature_groups_constraint_add, PartsLink.feature_groups_data_explorer, PartsLink.feature_groups_explorer, PartsLink.feature_groups, PartsLink.feature_group_detail, PartsLink.feature_groups_explorer, PartsLink.feature_groups_add, PartsLink.feature_groups_history, PartsLink.feature_groups_edit, PartsLink.feature_groups_template_add, PartsLink.feature_groups_template_list, PartsLink.feature_groups_template, PartsLink.feature_groups_export, PartsLink.feature_groups_transform, PartsLink.feature_groups_merge, PartsLink.feature_groups_sampling, PartsLink.feature_groups_snapshot, PartsLink.feature_groups_export_add, PartsLink.feature_groups_schedule_add, PartsLink.features_list, PartsLink.dagviewer, PartsLink.features_add, PartsLink.annotations_edit, PartsLink.features_rawdata]} saveOpenStateName={'featureGroups'}>
                    {showFeatureGroupsItem && <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={projectId == null ? IconFeatureGroupsList : IconFeatureGroups} indent={addIndentWithChevron - 1.2} text="Feature Groups" isSelected={mode === PartsLink.feature_groups || mode === PartsLink.feature_groups_explorer} isFolderSelected={PartsLinkIsFeatureGroups(mode)} isTitle={false} linkUrl={projectId == null ? '/' + PartsLink.featuregroups_list : calcLinkToProject(PartsLink.feature_groups)} />}
                    {featureGroupId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Detail" indent={addIndent + 2} isSelected={mode === PartsLink.feature_group_detail} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_group_detail)} />}
                    {mode === PartsLink.feature_group_attach && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Attach Feature Group" isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group Add" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_history && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group History" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_edit && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group Edit" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_snapshot && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - Snapshot" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_export_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - New Export" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_schedule_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - New Schedule" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_sampling && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - Sampling" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_merge && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - Merge" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                    {mode === PartsLink.feature_groups_transform && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features Group - Transform" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}

                    {mode === PartsLink.feature_groups_export && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Exports" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_groups_export)} />}
                    {false && Constants.flags.show_fg_explorer && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Feature Groups Explorer" indent={addIndent + 2} isSelected={mode === PartsLink.feature_groups_explorer} isTitle={false} linkUrl={calcLinkToProject(PartsLink.feature_groups_explorer)} />}
                    {<NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Features" indent={addIndent + 2} isSelected={mode === PartsLink.features_list || mode === PartsLink.features_add || mode === PartsLink.features_add_nested || mode === PartsLink.features_add_point_in_time_group || mode === PartsLink.features_add_point_in_time} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.features_list)} />}
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Explore" indent={addIndent + 2} isSelected={mode === PartsLink.feature_groups_data_explorer} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_groups_data_explorer)} />
                    {<NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Materialized Data" indent={addIndent + 2} isSelected={mode === PartsLink.features_rawdata} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.features_rawdata, featureGroupVersion != null ? 'featureGroupVersion=' + encodeURIComponent(featureGroupVersion) : undefined)} />}
                    {mode === PartsLink.feature_groups_constraint && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Constraint" indent={addIndent + 2} isSelected={mode === PartsLink.feature_groups_constraint} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_groups_constraint)} />}
                    {mode === PartsLink.feature_groups_constraint_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text={`${paramsProp?.get('constraintEdit') ? 'Edit Constraint' : 'Add Constraint'}`} indent={addIndent + 2} isSelected={mode === PartsLink.feature_groups_constraint_add} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.feature_groups_constraint_add)} />}
                    {Constants.flags.templates && !isTemplatesProjectEmpty && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Templates" indent={addIndent + 2} isSelected={[PartsLink.feature_groups_template_add, PartsLink.feature_groups_template, PartsLink.feature_groups_template_list].includes(mode)} isTitle={false} linkUrl={calcLinkToProject(PartsLink.feature_groups_template_list) ?? calcLinkToRoot(PartsLink.templates_list)} />}

                    {mode === PartsLink.dagviewer && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Dag Viewer" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.dagviewer)} />}
                    {showAnnotationsNav && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Annotations" indent={addIndent + 2} isSelected={mode === PartsLink.annotations_edit} isTitle={false} linkUrl={calcLinkToFeatureGroup(PartsLink.annotations_edit)} />}
                  </NavLeftGroup>
                )}

                {showEDA && (
                  <NavLeftGroup openParts={[PartsLink.exploratory_data_analysis, PartsLink.exploratory_data_analysis_detail, PartsLink.exploratory_data_analysis_graphs_one, PartsLink.exploratory_data_analysis_graphs_one_add_function, PartsLink.exploratory_data_analysis_graphs, PartsLink.exploratory_data_analysis_create, PartsLink.exploratory_data_analysis_collinearity, PartsLink.exploratory_data_analysis_data_consistency, PartsLink.exploratory_data_analysis_data_consistency_analysis, PartsLink.exploratory_data_analysis_timeseries]} saveOpenStateName={'EDA'}>
                    {<NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconFeatureGroups} indent={addIndentWithChevron - 1.2} text="EDA" isSelected={mode === PartsLink.exploratory_data_analysis || mode === PartsLink.exploratory_data_analysis_create} isFolderSelected={PartsLinkIsEDA(mode)} isTitle={false} linkUrl={calcLinkToProject(PartsLink.exploratory_data_analysis)} />}
                    {!(mode === PartsLink.exploratory_data_analysis_graphs || mode === PartsLink.exploratory_data_analysis_graphs_one || mode === PartsLink.exploratory_data_analysis_graphs_one_add_function) && edaId && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Detail" indent={addIndent + 2} isSelected={mode === PartsLink.exploratory_data_analysis_detail} isTitle={false} linkUrl={calcLinkToEDA(PartsLink.exploratory_data_analysis_detail)} />}
                    {mode === PartsLink.exploratory_data_analysis_collinearity && collinearityEdaId && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Collinearity" indent={addIndent + 2} isSelected isTitle={false} linkUrl={calcLinkToEDACollinearity(PartsLink.exploratory_data_analysis_collinearity)} />}
                    {mode === PartsLink.exploratory_data_analysis_data_consistency && dataConsistencyEdaId && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Data Consistency" indent={addIndent + 2} isSelected isTitle={false} linkUrl={calcLinkToEDADataConsistency(PartsLink.exploratory_data_analysis_data_consistency)} />}
                    {mode === PartsLink.exploratory_data_analysis_data_consistency_analysis && dataConsistencyEdaId && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Data Consistency Analysis" indent={addIndent + 2} isSelected isTitle={false} linkUrl={calcLinkToEDADataConsistency(PartsLink.exploratory_data_analysis_data_consistency_analysis)} />}
                    {!Constants.flags.hide_eda_plots && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Plots" indent={addIndent + 2} isSelected={mode === PartsLink.exploratory_data_analysis_graphs || mode === PartsLink.exploratory_data_analysis_graphs_one || mode === PartsLink.exploratory_data_analysis_graphs_one_add_function} isTitle={false} linkUrl={calcLinkToEDA(PartsLink.exploratory_data_analysis_graphs) ?? calcLinkToProject(PartsLink.exploratory_data_analysis_graphs)} />}
                    {mode === PartsLink.exploratory_data_analysis_timeseries && forecastingEdaId && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Time Series EDA" indent={addIndent + 2} isSelected isTitle={false} linkUrl={calcLinkToEDATimeseries(PartsLink.exploratory_data_analysis_timeseries)} />}
                  </NavLeftGroup>
                )}

                {(isAiAgent || isChatLLM) && (
                  <NavLeftGroup openParts={[PartsLink.document_retriever_list, PartsLink.document_retriever_detail, PartsLink.document_retriever_create, PartsLink.document_retriever_edit]} saveOpenStateName={'documentRetrievers'}>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconFeatureGroupsList} text="Document Retrievers" indent={addIndentWithChevron - 1.2} isSelected={mode === PartsLink.document_retriever_list} linkUrl={['', PartsLink.document_retriever_list, foundProject1.projectId].join('/')} />
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={'Detail'} isSelected={mode === PartsLink.document_retriever_detail} linkUrl={['', PartsLink.document_retriever_detail, foundProject1.projectId].join('/')} />
                    {mode === PartsLink.document_retriever_create && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={'Document Retriever Create'} isSelected={mode === PartsLink.document_retriever_create} linkUrl={['', PartsLink.document_retriever_create, foundProject1.projectId].join('/')} />}
                    {mode === PartsLink.document_retriever_edit && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={'Document Retriever Edit'} isSelected={mode === PartsLink.document_retriever_edit} />}
                  </NavLeftGroup>
                )}

                {showModels && (
                  <NavLeftGroup openParts={[projectId == null ? ('--' as any) : PartsLink.algorithm_one, projectId == null ? ('--' as any) : PartsLink.algorithm_list, PartsLink.model_train, PartsLink.model_retrain, PartsLink.set_threshold, PartsLink.model_register, PartsLink.model_register_form, PartsLink.model_register_zip, PartsLink.model_register_git, PartsLink.model_list, PartsLink.model_detail, PartsLink.model_augmentation, PartsLink.model_metrics]} saveOpenStateName={'models'}>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconModels} indent={addIndentWithChevron - 1.2} text={isEmbeddingsOnly ? 'Catalogs' : isAiAgent ? 'Agents' : 'Models'} isSelected={mode === PartsLink.model_retrain || mode === PartsLink.model_train || mode === PartsLink.model_list} isFolderSelected={PartsLinkIsModel(mode)} isTitle={false} linkUrl={calcLinkToProject(PartsLink.model_list) || '/' + PartsLink.model_list} />

                    {modelId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={isEmbeddingsOnly ? 'Detail' : 'Detail'} isSelected={mode === PartsLink.model_detail} isTitle={false} linkUrl={calcLinkToModel(PartsLink.model_detail, true)} />}
                    {mode === PartsLink.set_threshold && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={'Threshold'} isSelected={mode === PartsLink.set_threshold} isTitle={false} linkUrl={calcLinkToProject(PartsLink.set_threshold, true)} />}

                    {showAugmentationModel && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Augmentation" indent={addIndent + 2} isSelected={mode === PartsLink.model_augmentation} isTitle={false} linkUrl={calcLinkToModel(PartsLink.model_augmentation, true)} />}
                    {showMetrics && !isSentimentAnalysis && !isChat && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Metrics" indent={addIndent + 2} isSelected={mode === PartsLink.model_metrics} isTitle={false} linkUrl={calcLinkToProject(PartsLink.model_metrics, !Utils.isNullOrEmpty(modelId) && mode === PartsLink.model_detail ? '?detailModelId=' + modelId : null)} />}
                    {Constants.flags.algos && foundProject1?.isPnpPython !== true && showAlgorithms && (projectId == null || listAlgoForProblemTypes?.includes(problemType?.toUpperCase())) && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={'Algorithm' + (mode === PartsLink.algorithm_one ? '' : 's')} isSelected={mode === PartsLink.algorithm_one || mode === PartsLink.algorithm_list} isTitle={false} linkUrl={calcLinkToProject(PartsLink.algorithm_list)} />}
                  </NavLeftGroup>
                )}

                {showDeployments && (
                  <NavLeftGroup openParts={[PartsLink.deploy_detail, PartsLink.model_predictions, PartsLink.deploy_lookup_api, PartsLink.webhook_one, PartsLink.deploy_predictions_api, PartsLink.deploy_list]} saveOpenStateName={'predictions'}>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconPredictions} text="Deployments" isSelected={mode === PartsLink.deploy_create || mode === PartsLink.deploy_create_fg || mode === PartsLink.deploy_create_form || mode === PartsLink.deploy_list} indent={addIndent - 1.2} isTitle={false} linkUrl={calcLinkToModelOrOnlyProject(PartsLink.deploy_list)} />
                    {deployId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Detail" isSelected={mode === PartsLink.deploy_detail} isTitle={false} linkUrl={calcLinkToDeploy(PartsLink.deploy_detail)} />}
                    {showSubPredictions && showPredDash && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Predictions Dash" indent={addIndent + 2} isSelected={mode === PartsLink.model_predictions} isTitle={false} linkUrl={calcLinkToProjectAndDeployOrOnlyProject(PartsLink.model_predictions) || calcLinkToProject(PartsLink.model_predictions)} />}
                    {showSubPredictions && showPredAPI && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Predictions API" indent={addIndent + 2} isSelected={mode === PartsLink.deploy_predictions_api} isTitle={false} linkUrl={calcLinkToProjectAndDeployOrOnlyProject(PartsLink.deploy_predictions_api)} />}
                    {isFeatureStore && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Look-Up API" indent={addIndent + 2} isSelected={mode === PartsLink.deploy_lookup_api} isTitle={false} linkUrl={calcLinkToProjectAndDeployOrOnlyProject(PartsLink.deploy_lookup_api)} />}
                    {mode === PartsLink.webhook_one && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Webhook" indent={addIndent + 2} isSelected={true} isTitle={false} linkUrl={null} />}
                  </NavLeftGroup>
                )}

                {showBatchPredictions && (
                  <NavLeftGroup openParts={[PartsLink.deploy_batch, PartsLink.batchpred_rawdata, PartsLink.batchpred_datasets, PartsLink.batchpred_featuregroups, PartsLink.batchpred_detail]} saveOpenStateName={'batchPredictions'}>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconBatch} text="Batch Predictions" indent={addIndent - 1.2} isSelected={mode === PartsLink.batchpred_add_fg || mode === PartsLink.batchpred_create || mode === PartsLink.deploy_batch} isTitle={false} linkUrl={calcLinkToProject(PartsLink.deploy_batch, '?showList=true')} />
                    {(batchPredId != null || batchPredIdFirst != null) && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text="Detail" isSelected={mode === PartsLink.batchpred_detail} isTitle={false} linkUrl={calcLinkToBatchPred(PartsLink.batchpred_detail)} />}
                    {mode === PartsLink.batchpred_rawdata && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Raw Data" indent={addIndent + 2} isSelected={mode === PartsLink.batchpred_rawdata} isTitle={false} linkUrl={calcLinkToBatchPred(PartsLink.batchpred_rawdata)} />}
                  </NavLeftGroup>
                )}

                {showMonitoring && !showMonitorsWithModels && !isModelMonitorUse && (
                  <NavLeftGroup firstDisabled={!showMonitoringItem} openParts={[PartsLink.monitoring_drift_analysis, PartsLink.monitoring_outliers, PartsLink.prediction_metrics_bias, PartsLink.model_metrics_summary, PartsLink.prediction_metrics_detail, PartsLink.realtime_data_integrity, PartsLink.monitors_list, PartsLink.monitor_metrics, PartsLink.prediction_metrics, PartsLink.prediction_metrics_project, PartsLink.prediction_metrics_add, PartsLink.realtime_data_integrity, PartsLink.monitors_alert_list, PartsLink.monitors_alert_events, PartsLink.monitors_alert_add, PartsLink.monitor_alerts_add, PartsLink.monitor_alerts, PartsLink.monitor_drift_analysis, PartsLink.monitor_outliers, PartsLink.monitor_drift, PartsLink.monitor_data_integrity, PartsLink.monitoring_outliers, PartsLink.model_detail_monitor, PartsLink.monitoring, PartsLink.monitoring_metrics, PartsLink.monitoring_data_integrity, PartsLink.monitoring_pred_log, PartsLink.monitoring_drift, PartsLink.monitoring_drift_bp]} saveOpenStateName={'drift'}>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconMonitoring} indent={addIndentWithChevron - 1.2} text={showModelMonitorsDriftTypeCase ? 'Monitors' : 'Monitoring'} isSelected={mode === PartsLink.monitoring || mode === PartsLink.monitors_list} isFolderSelected={PartsLinkIsMonitoring(mode)} isTitle={false} linkUrl={showModelMonitorsDriftTypeCase ? calcLinkToProject(PartsLink.monitors_list) : calcLinkToMonitoring(PartsLink.monitoring)} />
                    {showModelMonitors && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={'Detail'} isSelected={mode === PartsLink.model_detail_monitor} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.model_detail_monitor)} />}
                    {showModelMonitors && projectId != null && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Summary" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.model_metrics_summary} isTitle={false} linkUrl={calcLinkToMonitorProjectFrist(PartsLink.model_metrics_summary)} />}

                    <NavLeftGroup isSubGroup hideIfEmpty openParts={[PartsLink.realtime_data_integrity, PartsLink.monitoring_pred_log, PartsLink.monitoring_metrics, PartsLink.monitoring_drift]} saveOpenStateName={'drift_realtime'}>
                      <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconMonitoring} indent={addIndentWithChevron - 1.2 + 3.2} text="Real-Time" isSelected={false} isFolderSelected={PartsLinkIsMonitoring(mode)} isTitle={false} linkUrl={calcLinkToMonitoring(PartsLink.monitoring)} />
                      {/*showPredLog && */ <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Prediction Log" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitoring_pred_log || mode === PartsLink.model_predictions_request} isTitle={false} linkUrl={calcLinkToMonitoring(PartsLink.monitoring_pred_log) || calcLinkToProject(PartsLink.monitoring_pred_log, '/-')} />}
                      {/*showDrift && */ <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Metrics" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitoring_metrics} isTitle={false} linkUrl={calcLinkToMonitoring(PartsLink.monitoring_metrics, deployIdActive)} />}
                      {/*showDriftModel && */ !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Drift" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitoring_drift || mode === PartsLink.monitor_drift} isTitle={false} linkUrl={isDrift ? calcLinkToMonitor(PartsLink.monitor_drift) : calcLinkToMonitoring(PartsLink.monitoring_drift)} />}
                      {!isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Data Integrity" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.realtime_data_integrity} isTitle={false} linkUrl={calcLinkToMonitoring(PartsLink.realtime_data_integrity)} />}
                    </NavLeftGroup>
                  </NavLeftGroup>
                )}
                {showMonitoring && !showMonitorsWithModels && isModelMonitorUse && (
                  <NavLeftGroup firstDisabled={!showMonitoringItem} openParts={[PartsLink.model_create_drift, PartsLink.prediction_metrics_bias, PartsLink.model_metrics_summary, PartsLink.decile_prediction_metrics_project, PartsLink.model_metrics_summary, PartsLink.prediction_metrics_type_bias, PartsLink.prediction_metrics_detail, PartsLink.realtime_data_integrity, PartsLink.monitors_list, PartsLink.monitor_metrics, PartsLink.prediction_metrics, PartsLink.prediction_metrics_project, PartsLink.prediction_metrics_add, PartsLink.realtime_data_integrity, PartsLink.monitors_alert_events, PartsLink.monitors_alert_list, PartsLink.monitors_alert_add, PartsLink.monitor_alerts_add, PartsLink.monitor_alerts, PartsLink.monitor_drift_analysis, PartsLink.monitor_outliers, PartsLink.monitor_drift, PartsLink.monitor_data_integrity, PartsLink.model_detail_monitor, PartsLink.monitoring, PartsLink.monitoring_metrics, PartsLink.monitoring_data_integrity, PartsLink.monitoring_pred_log, PartsLink.monitoring_drift, PartsLink.monitoring_drift_bp]} saveOpenStateName={'drift'}>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconMonitoring} indent={addIndentWithChevron - 1.2} text="Monitors" isSelected={mode === PartsLink.monitoring || mode === PartsLink.model_create_drift || mode === PartsLink.monitors_list} isFolderSelected={PartsLinkIsMonitoring(mode)} isTitle={false} linkUrl={calcLinkToProject(PartsLink.monitors_list)} />
                    {showModelMonitors && modelMonitorId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={'Detail'} isSelected={mode === PartsLink.model_detail_monitor} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.model_detail_monitor)} />}
                    {!isPnp && modelMonitorId != null && projectId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Summary" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.model_metrics_summary} isTitle={false} linkUrl={`/${PartsLink.model_metrics_summary}/${projectId}/${modelMonitorId}`} />}
                    {/*showDriftModel && */ !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Drift" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_drift} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_drift)} />}
                    {!docStoreDef?.navLeftHidePartsLinks?.includes(PartsLink.monitor_data_integrity) && !isVisionDrift && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Data Integrity" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_data_integrity} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_data_integrity)} />}
                    {!isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Outliers" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_outliers} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_outliers)} />}
                    {!docStoreDef?.navLeftHidePartsLinks?.includes(PartsLink.monitor_drift_analysis) && !isVisionDrift && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Drift Analysis" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_drift_analysis} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_drift_analysis)} />}
                    {!isPnp && ModelMonitorDetailFound != null && !ModelMonitorDetailFound?.metricTypes && ModelMonitorDetailFound?.monitorType?.toUpperCase() !== 'FEATURE_GROUP_MONITOR' && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Prediction Metrics" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_metrics || mode === PartsLink.decile_prediction_metrics_project || mode === PartsLink.prediction_metrics_project || mode === PartsLink.prediction_metrics_add || mode === PartsLink.prediction_metrics || mode === PartsLink.prediction_metrics_detail} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_metrics) ?? calcLinkToProject(PartsLink.prediction_metrics_project)} />}
                    {!isPnp && ModelMonitorDetailFound?.metricTypes?.includes('DecilePredictionMetric') && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Performance" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.decile_prediction_metrics_project} isTitle={false} linkUrl={`/${PartsLink.decile_prediction_metrics_project}/${projectId}/${modelMonitorId}?modelMonitorVersion=${modelMonitorVersion || encodeURIComponent(ModelMonitorDetailFound?.latestMonitorModelVersion?.modelMonitorVersion ?? '')}&metricType=DecilePredictionMetric`} />}

                    {mode === PartsLink.prediction_metrics_bias && ModelMonitorDetailFound != null && !ModelMonitorDetailFound?.metricTypes && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Bias" indent={addIndent + 2} isSelected={mode === PartsLink.prediction_metrics_bias} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_metrics)} />}
                    {!isPnp && ModelMonitorDetailFound?.metricTypes?.includes('BiasPredictionMetrics') && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Bias" indent={addIndent + 2} isSelected={mode === PartsLink.prediction_metrics_type_bias} isTitle={false} linkUrl={`/${PartsLink.prediction_metrics_type_bias}/${projectId}/${modelMonitorId}?modelMonitorVersion=${modelMonitorVersion || encodeURIComponent(ModelMonitorDetailFound?.latestMonitorModelVersion?.modelMonitorVersion ?? '')}&metricType=BiasPredictionMetrics`} />}

                    {mode === PartsLink.monitors_alert_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text={'Alert Create'} indent={addIndent + 2} isSelected={mode === PartsLink.monitors_alert_add} isTitle={false} />}
                    {mode === PartsLink.monitor_alerts_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text={'Alert Create'} indent={addIndent + 2} isSelected={mode === PartsLink.monitor_alerts_add} isTitle={false} />}
                    {Constants.flags.hide_monitors_changes && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Alerts" indent={addIndent + 2} isSelected={mode === PartsLink.monitor_alerts} isTitle={false} linkUrl={'/' + PartsLink.monitor_alerts + '/-/' + projectId} />}
                    {!Constants.flags.hide_monitors_changes && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Alerts" indent={addIndent + 2} isSelected={mode === PartsLink.monitors_alert_list} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitors_alert_list)} />}
                    {!Constants.flags.hide_monitors_changes && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Alert Events" indent={addIndent + 2} isSelected={mode === PartsLink.monitors_alert_events} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitors_alert_events, 'monitorAlertId=' + encodeURIComponent(monitorAlertId ?? ''))} />}
                  </NavLeftGroup>
                )}
                {showMonitoring && showMonitorsWithModels && (
                  <NavLeftGroup firstDisabled={!showMonitoringItem} openParts={[PartsLink.model_create_drift, PartsLink.prediction_metrics_bias, PartsLink.model_metrics_summary, PartsLink.decile_prediction_metrics_project, PartsLink.model_metrics_summary, PartsLink.prediction_metrics_type_bias, PartsLink.prediction_metrics_detail, PartsLink.realtime_data_integrity, PartsLink.monitors_list, PartsLink.monitor_metrics, PartsLink.prediction_metrics, PartsLink.prediction_metrics_project, PartsLink.prediction_metrics_add, PartsLink.realtime_data_integrity, PartsLink.monitors_alert_events, PartsLink.monitors_alert_list, PartsLink.monitors_alert_add, PartsLink.monitor_alerts_add, PartsLink.monitor_alerts, PartsLink.monitor_drift_analysis, PartsLink.monitor_outliers, PartsLink.monitor_drift, PartsLink.monitor_data_integrity, PartsLink.model_detail_monitor, PartsLink.monitoring, PartsLink.monitoring_metrics, PartsLink.monitoring_data_integrity, PartsLink.monitoring_pred_log, PartsLink.monitoring_drift, PartsLink.monitoring_drift_bp]} saveOpenStateName={'drift'}>
                    <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconMonitoring} indent={addIndentWithChevron - 1.2} text="Monitors" isSelected={mode === PartsLink.monitoring || mode === PartsLink.model_create_drift || mode === PartsLink.monitors_list} isFolderSelected={PartsLinkIsMonitoring(mode)} isTitle={false} linkUrl={calcLinkToProject(PartsLink.monitors_list)} />
                    {showModelMonitors && modelMonitorId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} indent={addIndent + 2} text={'Detail'} isSelected={mode === PartsLink.model_detail_monitor} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.model_detail_monitor)} />}
                    {!isPnp && modelMonitorId != null && projectId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Summary" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.model_metrics_summary} isTitle={false} linkUrl={`/${PartsLink.model_metrics_summary}/${projectId}/${modelMonitorId}`} />}
                    {/*showDriftModel && */ !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Drift" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_drift} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_drift)} />}
                    {!isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Data Integrity" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_data_integrity} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_data_integrity)} />}
                    {!isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Outliers" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_outliers} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_outliers)} />}
                    {!docStoreDef?.navLeftHidePartsLinks?.includes(PartsLink.monitor_drift_analysis) && !isVisionDrift && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Drift Analysis" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitor_drift_analysis} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_drift_analysis)} />}

                    {/* {!isPnp && ModelMonitorDetailFound!=null && !ModelMonitorDetailFound?.metricTypes && <NavLeftLine navLeftCollapsed={navLeftCollapsed}  text="Prediction Metrics" indent={addIndent+2+3.2} isSelected={mode===PartsLink.monitor_metrics || mode===PartsLink.decile_prediction_metrics_project || mode===PartsLink.prediction_metrics_project || mode===PartsLink.prediction_metrics_add || mode===PartsLink.prediction_metrics || mode===PartsLink.prediction_metrics_detail} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_metrics) ?? calcLinkToProject(PartsLink.prediction_metrics_project)} />} */}
                    {!isPnp && ModelMonitorDetailFound?.metricTypes?.includes('DecilePredictionMetric') && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Performance" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.decile_prediction_metrics_project} isTitle={false} linkUrl={`/${PartsLink.decile_prediction_metrics_project}/${projectId}/${modelMonitorId}?modelMonitorVersion=${modelMonitorVersion || encodeURIComponent(ModelMonitorDetailFound?.latestMonitorModelVersion?.modelMonitorVersion ?? '')}&metricType=DecilePredictionMetric`} />}

                    {mode === PartsLink.prediction_metrics_bias && ModelMonitorDetailFound != null && !ModelMonitorDetailFound?.metricTypes && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Bias" indent={addIndent + 2} isSelected={mode === PartsLink.prediction_metrics_bias} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitor_metrics)} />}
                    {!isPnp && ModelMonitorDetailFound?.metricTypes?.includes('BiasPredictionMetrics') && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Bias" indent={addIndent + 2} isSelected={mode === PartsLink.prediction_metrics_type_bias} isTitle={false} linkUrl={`/${PartsLink.prediction_metrics_type_bias}/${projectId}/${modelMonitorId}?modelMonitorVersion=${modelMonitorVersion || encodeURIComponent(ModelMonitorDetailFound?.latestMonitorModelVersion?.modelMonitorVersion ?? '')}&metricType=BiasPredictionMetrics`} />}

                    {mode === PartsLink.monitors_alert_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text={'Alert Create'} indent={addIndent + 2} isSelected={mode === PartsLink.monitors_alert_add} isTitle={false} />}
                    {mode === PartsLink.monitor_alerts_add && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text={'Alert Create'} indent={addIndent + 2} isSelected={mode === PartsLink.monitor_alerts_add} isTitle={false} />}
                    {Constants.flags.hide_monitors_changes && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Alerts" indent={addIndent + 2} isSelected={mode === PartsLink.monitor_alerts} isTitle={false} linkUrl={'/' + PartsLink.monitor_alerts + '/-/' + projectId} />}
                    {!Constants.flags.hide_monitors_changes && !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Alerts" indent={addIndent + 2} isSelected={mode === PartsLink.monitors_alert_list} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitors_alert_list)} />}
                    {!Constants.flags.hide_monitors_changes && !isPnp && monitorAlertId != null && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Alerts - Events" indent={addIndent + 2} isSelected={mode === PartsLink.monitors_alert_events} isTitle={false} linkUrl={calcLinkToMonitor(PartsLink.monitors_alert_events, 'monitorAlertId=' + encodeURIComponent(monitorAlertId ?? ''))} />}

                    <NavLeftGroup isSubGroup hideIfEmpty openParts={[PartsLink.realtime_data_integrity, PartsLink.monitoring_pred_log, PartsLink.monitoring_metrics, PartsLink.monitoring_drift]} saveOpenStateName={'drift_realtime'}>
                      <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconMonitoring} indent={addIndentWithChevron - 1.2 + 3.2} text="Real-Time" isSelected={false} isFolderSelected={PartsLinkIsMonitoring(mode)} isTitle={false} linkUrl={calcLinkToMonitoring(PartsLink.monitoring)} />
                      {/*showPredLog && */ <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Prediction Log" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitoring_pred_log || mode === PartsLink.model_predictions_request} isTitle={false} linkUrl={calcLinkToMonitoring(PartsLink.monitoring_pred_log) || calcLinkToProject(PartsLink.monitoring_pred_log, '/-')} />}
                      {/*showDrift && */ <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Metrics" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitoring_metrics} isTitle={false} linkUrl={calcLinkToMonitoring(PartsLink.monitoring_metrics, deployIdActive)} />}
                      {/*showDriftModel && */ !isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Drift" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.monitoring_drift || mode === PartsLink.monitor_drift} isTitle={false} linkUrl={isDrift ? calcLinkToMonitor(PartsLink.monitor_drift) : calcLinkToMonitoring(PartsLink.monitoring_drift)} />}
                      {!isPnp && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Data Integrity" indent={addIndent + 2 + 3.2} isSelected={mode === PartsLink.realtime_data_integrity} isTitle={false} linkUrl={calcLinkToMonitoring(PartsLink.realtime_data_integrity)} />}
                    </NavLeftGroup>
                  </NavLeftGroup>
                )}
                <NavLeftGroup firstDisabled={!showMonitoringItem} openParts={[PartsLink.pipeline_details, PartsLink.pipeline_list]} saveOpenStateName={'pipelines'}>
                  <NavLeftLine navLeftCollapsed={navLeftCollapsed} iconName={IconPipelines} indent={addIndentWithChevron - 1.2} text="Pipelines" isSelected={mode === PartsLink.pipeline_list} isFolderSelected={PartsLinkIsPipelines(mode)} isTitle={false} linkUrl={calcLinkToProject(PartsLink.pipeline_list)} />
                  {mode === PartsLink.pipeline_details && <NavLeftLine navLeftCollapsed={navLeftCollapsed} text="Pipeline Details" indent={addIndent + 2} isSelected={mode === PartsLink.pipeline_details} isTitle={false} />}
                </NavLeftGroup>
              </>
            );
          }
        })()}
      </NavLeftContainer>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    datasets: state.datasets,
    projects: state.projects,
    models: state.models,
    projectDatasets: state.projectDatasets,
    deployments: state.deployments,
    useCases: state.useCases,
    featureGroupsParam: state.featureGroups,
    batchPred: state.batchPred,
    monitoring: state.monitoring,
    predictionMetrics: state.predictionMetrics,
    templatesParam: state.templates,
    notebooks: state.notebooks,
    algorithms: state.algorithms,
    eda: state.eda,
  }),
  null,
)(NavLeft);
