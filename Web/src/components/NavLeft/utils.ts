import { IconProp } from '@fortawesome/fontawesome-svg-core';
import type { CSSProperties } from 'react';
import _ from 'lodash';

import PartsLink from './PartsLink';
import Constants from '../../constants/Constants';

export const dummyPartsLink = '###';

export const PartsLinkIsProject = (value, includeItemItself = true, includeAddItem = false) => {
  return [PartsLink.project_dashboard, includeItemItself ? PartsLink.project_list : dummyPartsLink, includeAddItem ? PartsLink.docker_add : 'ada', includeAddItem ? PartsLink.project_add : dummyPartsLink].includes(value);
};

export const sizeIcon = 26;

export const styleIcon: CSSProperties = {
  padding: '12px 0 15px 0',
  textAlign: 'center',
  color: 'white',
};
export const styleIconGreen: CSSProperties = _.assign({}, styleIcon, {
  color: 'rgba(0,248,197,0.8)',
} as CSSProperties);

export const IconModelMonitorSummary: IconProp = ['far', 'clipboard-list-check'];

export const IconProject: IconProp = ['far', 'folders'];
export const IconDatasets: IconProp = ['far', 'database'];
export const IconModels: IconProp = ['far', 'box-up'];
export const IconModelsMetrics: IconProp = ['far', 'tachometer'];

export const IconNotebooks: IconProp = ['fas', 'notebook'];
export const IconAlgorithms: IconProp = ['fas', 'code'];
export const IconPythonFunctions: IconProp = ['far', 'function'];
export const IconCustomLossFunctions: IconProp = ['far', 'function'];
export const IconCustomMetrics: IconProp = ['far', 'function'];
export const IconModules: IconProp = ['far', 'function'];
export const IconFeatureGroupsList: IconProp = ['far', 'ball-pile'];
export const IconFeatureGroups: IconProp = ['far', 'object-group'];
export const IconMonitoring: IconProp = ['far', 'monitor-heart-rate'];
export const IconTemplates: IconProp = ['far', 'passport'];
export const IconModelBlueprintStage: IconProp = ['fass', 'arrow-progress'];

export const IconPredictions: IconProp = ['far', 'flux-capacitor'];
export const IconPredictionsDash: IconProp = ['far', 'user-chart'];
export const IconPredictionsAPI: IconProp = ['far', 'code'];
export const IconBatch: IconProp = ['far', 'swatchbook'];

export const IconHelpItem: IconProp = ['fal', 'abacus'];
export const IconCodeItem: IconProp = ['far', 'laptop-code'];
export const IconGoogleItem: IconProp = ['fab', 'google'];
export const IconAzureItem: IconProp = ['fab', 'microsoft'];
export const IconAWSItem: IconProp = ['fab', 'aws'];
export const IconSnowflakeItem: IconProp = ['fas', 'snowflake'];
export const IconBigQueryItem: IconProp = ['fas', 'database'];
export const IconDataWrangling: IconProp = ['fas', 'angle-double-right'];
export const IconSalesForceItem: IconProp = ['fab', 'salesforce'];

export const IconCaseItem: IconProp = ['far', 'briefcase'];
export const IconDataItem: IconProp = ['far', 'database'];
export const IconDataIngestionItem: IconProp = ['far', 'books-medical'];
export const IconDataIngestionStreamingItem: IconProp = ['far', 'signal-stream'];
export const IconConnectorItem: IconProp = ['far', 'network-wired'];
export const IconToolsItem: IconProp = ['far', 'tools'];
export const IconBrainItem: IconProp = ['far', 'brain'];
export const IconEvaluatingItem: IconProp = ['far', 'analytics'];
export const IconDataWranglingItem: IconProp = ['fas', 'coins'];
export const IconDataBringingData: IconProp = ['fas', 'coins'];
export const IconPipelines: IconProp = ['fas', 'timeline'];

export const IconDevCenterItem: IconProp = ['far', 'comments'];

export const IconSchema: IconProp = ['far', 'sitemap'];
export const IconDeploys: IconProp = ['far', 'hand-holding-box'];

export const topHHsearch = 0;
export const topHH = Constants.headerHeight();

export interface INavParam {
  noAllProjects?: boolean;
  useNotebooksAll?: boolean;
  useTemplatesAll?: boolean;
  parentId?: string;
  hideGroup?: boolean;
  hideName?: boolean;
  useBatchPred?: boolean;
  useProfile?: boolean;
  useDeployName?: boolean | 'one';
  useDocumentRetriever?: boolean;
  useProjectName?: boolean;
  useDatasetName?: boolean;
  useModelName?: boolean;
  usePITName?: boolean;
  useModelNameOnlyTag?: boolean;
  useMetricsName?: boolean;
  useFeatureName?: boolean;
  useEDA?: boolean;
  usePythonFunctionName?: boolean;
  usePipelineName?: boolean;
  useCustomLossFunctionName?: boolean;
  useNotebookTemplateName?: boolean;
  useCustomMetricName?: boolean;
  useAlgorithmName?: boolean;
  useTemplateName?: boolean;
  useMonitoringName?: boolean;
  useMonitorName?: boolean;
  useNotebookName?: boolean;
  useModuleName?: boolean;
  buttonText?: string;
  buttonClick?: ((e) => void) | string[] | string;

  text?: string;
  link?: string | string[];
}

export const calcIsPnpPythonNotebookUseCase = (useCase) => {
  return ['notebook_python_model'.toLowerCase(), 'notebook_pretrained_model'].includes(useCase?.toLowerCase());
};

export const calcIsDockerPnpUseCase = (useCase) => {
  return ['docker_model'.toLowerCase(), 'docker_model_with_embeddings'.toLowerCase()].includes((useCase || '').toLowerCase());
};

export const calcModeForBatchPred = (mode) => {
  if ([PartsLink.batchpred_add_fg, PartsLink.batchpred_detail, PartsLink.batchpred_rawdata, PartsLink.deploy_batch, PartsLink.batchpred_detail, PartsLink.batchpred_create, PartsLink.feature_group_detail].includes(mode)) {
  } else if (mode?.toLowerCase().indexOf('monitoring_') > -1) {
  } else if (mode?.toLowerCase().indexOf('dataset') > -1) {
    mode = PartsLink.batchpred_datasets;
  } else {
    mode = PartsLink.batchpred_featuregroups;
  }
  return mode;
};

export const systemObjectsOrgOrganizationId = '4d842b504';

export const PartsLinkIsDeploy = (value, includeItemItself = true, includeAddItem = false) => {
  return [
    PartsLink.deploy_predictions_api,
    PartsLink.deploy_lookup_api,
    PartsLink.deploy_list,
    PartsLink.deploy_create_form,
    includeItemItself ? '...' : dummyPartsLink,
    includeAddItem ? PartsLink.deploy_create_fg : 'dS',
    includeAddItem ? PartsLink.deploy_create : dummyPartsLink,
  ].includes(value);
};

export const PartsLinkIsDataset = (value, includeItemItself = true, includeAddItem = false) => {
  return [
    PartsLink.dataset_external_import_new_version,
    PartsLink.dataset_snapshot,
    PartsLink.dataset_streaming,
    PartsLink.dataset_visualize,
    PartsLink.dataset_detail,
    PartsLink.datasets_all,
    includeItemItself ? PartsLink.dataset_list : dummyPartsLink,
    PartsLink.dataset_schema,
    PartsLink.dataset_raw_data,
    PartsLink.dataset_data_explorer,
    includeAddItem ? PartsLink.dataset_upload : dummyPartsLink,
  ].includes(value);
};

export const PartsLinkIsNotebooks = (value, includeItemItself = true, includeAddItem = false) => {
  return [PartsLink.notebook_fg, PartsLink.notebook_model, PartsLink.notebook_one, PartsLink.notebook_details].includes(value);
};

export const PartsLinkIsModel = (value, includeItemItself = true, includeAddItem = false) => {
  return [
    PartsLink.model_augmentation,
    PartsLink.select_labeled,
    PartsLink.model_register,
    PartsLink.model_register_form,
    PartsLink.model_register_zip,
    PartsLink.model_register_git,
    PartsLink.model_explanations,
    PartsLink.model_retrain,
    includeAddItem ? PartsLink.model_train : dummyPartsLink,
    PartsLink.model_detail,
    PartsLink.model_featurization,
    PartsLink.model_metrics,
    PartsLink.agent_one,
    includeItemItself ? PartsLink.model_list : dummyPartsLink,
  ].includes(value);
};

export const PartsLinkIsMonitors = (value, includeItemItself = true, includeAddItem = false) => {
  return [PartsLink.monitors_org_list, PartsLink.monitors_org_one, PartsLink.monitors_org_summary].includes(value);
};

export const PartsLinkIsPredictions = (value, includeItemItself = true, includeAddItem = false) => {
  return [PartsLink.deploy_batch, PartsLink.deploy_lookup_api, PartsLink.deploy_predictions_api, PartsLink.model_predictions_request, PartsLink.model_predictions, includeAddItem ? PartsLink.model_predictions : dummyPartsLink].includes(
    value,
  );
};

export const PartsLinkIsFeatureGroups = (value, includeItemItself = true, includeAddItem = false) => {
  return [
    PartsLink.feature_group_attach,
    PartsLink.features_list,
    PartsLink.feature_groups_explorer,
    PartsLink.feature_groups_data_explorer,
    PartsLink.dagviewer,
    PartsLink.annotations_edit,
    PartsLink.features_rawdata,
    PartsLink.features_add_point_in_time_group,
    PartsLink.features_add_point_in_time,
    PartsLink.features_add_nested,
    PartsLink.features_add,
    PartsLink.feature_groups_transform,
    PartsLink.feature_groups_merge,
    PartsLink.feature_groups_sampling,
    PartsLink.prediction_metrics_list,
    PartsLink.feature_groups_snapshot,
    PartsLink.feature_groups_export_add,
    PartsLink.feature_groups_schedule_add,
    PartsLink.feature_groups_export,
    PartsLink.feature_group_detail,
    PartsLink.feature_groups_add,
    PartsLink.feature_groups_history,
    PartsLink.feature_groups_edit,
    PartsLink.feature_groups_template_add,
    PartsLink.feature_groups_template,
    PartsLink.feature_groups_template_list,
    includeAddItem ? PartsLink.feature_groups : dummyPartsLink,
  ].includes(value);
};

export const PartsLinkIsEDA = (value, includeItemItself = true, includeAddItem = false) => {
  return [
    PartsLink.exploratory_data_analysis_create,
    PartsLink.exploratory_data_analysis_detail,
    PartsLink.exploratory_data_analysis_collinearity,
    PartsLink.exploratory_data_analysis_data_consistency,
    PartsLink.exploratory_data_analysis_data_consistency_analysis,
    PartsLink.exploratory_data_analysis_timeseries,
    includeAddItem ? PartsLink.exploratory_data_analysis : dummyPartsLink,
  ].includes(value);
};

export const PartsLinkIsNoNeedProject = (value) => {
  return [PartsLink.algorithm_one, PartsLink.algorithm_list, PartsLink.exploratory_data_analysis_graphs_org, PartsLink.template_detail, PartsLink.template_one].includes(value);
};

export const PartsLinkIsAlgorithms = (value) => {
  return [PartsLink.algorithm_one, PartsLink.algorithm_list].includes(value);
};

export const PartsLinkIsMonitoring = (value, includeItemItself = true, includeAddItem = false) => {
  return [
    PartsLink.monitoring,
    PartsLink.model_create_drift,
    PartsLink.prediction_metrics_detail,
    PartsLink.realtime_data_integrity,
    PartsLink.monitoring_outliers,
    PartsLink.monitoring_drift_analysis,
    PartsLink.monitoring_data_integrity,
    PartsLink.monitoring_drift_bp,
    PartsLink.prediction_metrics_add,
    PartsLink.prediction_metrics,
    PartsLink.prediction_metrics_project,
    PartsLink.monitoring_drift,
    PartsLink.monitoring_metrics,
    PartsLink.monitoring_pred_log,
    includeAddItem ? PartsLink.monitoring : dummyPartsLink,
  ].includes(value);
};

export const PartsLinkIsModelMonitors = (value, includeItemItself = true, includeAddItem = false) => {
  return [
    PartsLink.model_detail_monitor,
    PartsLink.model_metrics_summary,
    /*PartsLink.monitor_alerts_add,*/ PartsLink.monitor_metrics,
    /*PartsLink.monitor_alerts,*/ PartsLink.monitor_drift_analysis,
    PartsLink.monitor_outliers,
    PartsLink.monitor_drift,
    PartsLink.monitor_data_integrity,
    PartsLink.monitors_list,
  ].includes(value);
};

export const PartsLinkIsPipelines = (value, includeItemItself = true, includeAddItem = false) => {
  return [PartsLink.pipeline_details, PartsLink.pipeline_list].includes(value);
};
