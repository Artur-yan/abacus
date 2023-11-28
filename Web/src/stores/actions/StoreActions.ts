import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { calcDocStoreDefFromProject } from '../../api/DocStoreInterfaces';
import REClient_ from '../../api/REClient';
import REUploads_ from '../../api/REUploads';
import { useNormalizedId } from '../../api/REUses';
import { BatchLifecycle } from '../../components/BatchList/BatchList';
import { FeatureGroupExportLifecycle } from '../../components/FeatureGroups/FeatureGroupExportLifecycle';
import { calcWebhookIdToString, IWebhookId } from '../../components/WebhookList/WebhookIdHelpers';
import Constants from '../../constants/Constants';
import { calcAuthUserIsLoggedIn } from '../reducers/authUser';
import { BatchPredLifecycle } from '../reducers/batchPred';
import { CustomDSLifecycle } from '../reducers/customds';
import { calcDatasetById, DatasetLifecycle } from '../reducers/datasets';
import { calcDeploymentsByProjectId, DeploymentLifecycle } from '../reducers/deployments';
import { EdaLifecycle } from '../reducers/eda';
import { FeatureGroupLifecycle, FeatureGroupVersionLifecycle } from '../reducers/featureGroups';
import { ModelLifecycle } from '../reducers/models';
import { ModelMonitoringLifecycle } from '../reducers/monitoring';
import { NotebookLifecycle } from '../reducers/notebooks';
import { PredictionMetricsLifecycle } from '../reducers/predictionMetrics';
import { calcFieldValuesByDeployId } from '../reducers/projects';

const _ = require('lodash');

export interface IUserAuth {
  name?: string;
  organization?: {
    organizationId?: string;
    name?: string;
    picture?: string;
  };
  picture?: string;
}

export interface IUseCase {
  useCase?: string;
  description?: string;
}

const MAX_MINS_REFRESH = 60 * 5;

const StoreActions = {
  helptext: null,

  RESET_CHANGE_ORG: 'RESET_CHANGE_ORG',
  RESET_METRICS_VERSIONS: 'RESET_METRICS_VERSIONS',

  PYTHON_FUNCTIONS_DETAIL_BEGIN: 'PYTHON_FUNCTIONS_DETAIL_BEGIN',
  PYTHON_FUNCTIONS_DETAIL_END: 'PYTHON_FUNCTIONS_DETAIL_END',

  PYTHON_FUNCTIONS_LIST_BEGIN: 'PYTHON_FUNCTIONS_LIST_BEGIN',
  PYTHON_FUNCTIONS_LIST_END: 'PYTHON_FUNCTIONS_LIST_END',

  FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_START: 'FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_START',
  FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_END: 'FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_END',

  CUSTOM_LOSS_FUNCTION_DETAIL_BEGIN: 'CUSTOM_LOSS_FUNCTION_DETAIL_BEGIN',
  CUSTOM_LOSS_FUNCTION_DETAIL_END: 'CUSTOM_LOSS_FUNCTION_DETAIL_END',

  AVAILABLE_LOSS_TYPES_BEGIN: 'AVAILABLE_LOSS_TYPES_BEGIN',
  AVAILABLE_LOSS_TYPES_END: 'AVAILABLE_LOSS_TYPES_END',

  CUSTOM_LOSS_FUNCTIONS_LIST_BEGIN: 'CUSTOM_LOSS_FUNCTIONS_LIST_BEGIN',
  CUSTOM_LOSS_FUNCTIONS_LIST_END: 'CUSTOM_LOSS_FUNCTIONS_LIST_END',

  CUSTOM_METRIC_DETAIL_BEGIN: 'CUSTOM_METRIC_DETAIL_BEGIN',
  CUSTOM_METRIC_DETAIL_END: 'CUSTOM_METRIC_DETAIL_END',

  SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_BEGIN: 'SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_BEGIN',
  SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_END: 'SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_END',

  CUSTOM_METRICS_LIST_BEGIN: 'CUSTOM_METRICS_LIST_BEGIN',
  CUSTOM_METRICS_LIST_END: 'CUSTOM_METRICS_LIST_END',

  MODULE_DETAIL_BEGIN: 'MODULE_DETAIL_BEGIN',
  MODULE_DETAIL_END: 'MODULE_DETAIL_END',

  MODULES_LIST_BEGIN: 'MODULES_LIST_BEGIN',
  MODULES_LIST_END: 'MODULES_LIST_END',

  WEBHOOK_DETAIL_BEGIN: 'WEBHOOK_DETAIL_BEGIN',
  WEBHOOK_DETAIL_END: 'WEBHOOK_DETAIL_END',

  WEBHOOK_LIST_BEGIN: 'WEBHOOK_LIST_BEGIN',
  WEBHOOK_LIST_END: 'WEBHOOK_LIST_END',

  SET_NAV_PARAMS: 'SET_NAV_PARAMS',

  NOTEBOOK_UPDATE_INFO: 'NOTEBOOK_UPDATE_INFO',
  NOTEBOOK_DETAIL_BEGIN: 'NOTEBOOK_DETAIL_BEGIN',
  NOTEBOOK_DETAIL_END: 'NOTEBOOK_DETAIL_END',

  NOTEBOOK_TEMPLATE_TYPES_BEGIN: 'NOTEBOOK_TEMPLATE_TYPES_BEGIN',
  NOTEBOOK_TEMPLATE_TYPES_END: 'NOTEBOOK_TEMPLATE_TYPES_END',

  NOTEBOOK_TEMPLATE_LIST_BEGIN: 'NOTEBOOK_TEMPLATE_LIST_BEGIN',
  NOTEBOOK_TEMPLATE_LIST_END: 'NOTEBOOK_TEMPLATE_LIST_END',

  TEMPLATE_DETAIL_BEGIN: 'TEMPLATE_DETAIL_BEGIN',
  TEMPLATE_DETAIL_END: 'TEMPLATE_DETAIL_END',
  TEMPLATE_LIST_BEGIN: 'TEMPLATE_LIST_BEGIN',
  TEMPLATE_LIST_END: 'TEMPLATE_LIST_END',

  PROBLEMTYPE_ALLOWED_BEGIN: 'PROBLEMTYPE_ALLOWED_BEGIN',
  PROBLEMTYPE_ALLOWED_END: 'PROBLEMTYPE_ALLOWED_END',

  CDS_LIST_BEGIN: 'CDS_LIST_BEGIN',
  CDS_LIST_END: 'CDS_LIST_END',
  CDS_UPDATE_LIFECYCLE: 'CDS_UPDATE_LIFECYCLE',

  UPDATE_SHOW_CHAT: 'UPDATE_SHOW_CHAT',
  UPDATE_REFRESH_CAHT: 'UPDATE_REFRESH_CAHT',
  UPDATE_CHAT_SESSION_ID: 'UPDATE_CHAT_SESSION_ID',
  UPDATE_CHAT_PROJECT_ID: 'UPDATE_CHAT_PROJECT_ID',
  UPDATE_CHAT_USER_ORG_ID: 'UPDATE_CHAT_USER_ORG_ID',
  DELETE_CHAT_PROJECT_ID: 'DELETE_CHAT_PROJECT_ID',
  ADD_CHAT_PROJECTS: 'ADD_CHAT_PROJECTS',
  UPDATE_CHAT_URL: 'UPDATE_CHAT_URL',
  UPDATE_CHAT_HISTORY: 'UPDATE_CHAT_HISTORY',
  UPDATE_VALID_CHAT_SESSION: 'UPDATE_VALID_CHAT_SESSION',

  PRED_METRICS_UPDATE_LIFECYCLE: 'PRED_METRICS_UPDATE_LIFECYCLE',
  PRED_METRICS_VERSION_UPDATE_LIFECYCLE: 'PRED_METRICS_VERSION_UPDATE_LIFECYCLE',

  PRED_METRICS_METRICS_START: 'PRED_METRICS_METRICS_START',
  PRED_METRICS_METRICS_END: 'PRED_METRICS_METRICS_END',

  PRED_METRICS_TYPE_START: 'PRED_METRICS_TYPE_START',
  PRED_METRICS_TYPE_END: 'PRED_METRICS_TYPE_END',

  EDA_VERSION_UPDATE_LIFECYCLE: 'EDA_VERSION_UPDATE_LIFECYCLE',
  EDA_UPDATE_LIFECYCLE: 'EDA_UPDATE_LIFECYCLE',

  EDA_LIST_BEGIN: 'EDA_LIST_BEGIN',
  EDA_LIST_END: 'EDA_LIST_END',

  EDA_DESC_BEGIN: 'EDA_DESC_BEGIN',
  EDA_DESC_END: 'EDA_DESC_END',

  EDA_DATA_CONSISTENCY_BEGIN: 'EDA_DATA_CONSISTENCY_BEGIN',
  EDA_DATA_CONSISTENCY_END: 'EDA_DATA_CONSISTENCY_END',

  EDA_COLLINEARITY_BEGIN: 'EDA_COLLINEARITY_BEGIN',
  EDA_COLLINEARITY_END: 'EDA_COLLINEARITY_END',

  EDA_VERSIONS_LIST_BEGIN: 'EDA_VERSIONS_LIST_BEGIN',
  EDA_VERSIONS_LIST_END: 'EDA_VERSIONS_LIST_END',

  EDA_VERSION_DESC_BEGIN: 'EDA_VERSION_DESC_BEGIN',
  EDA_VERSION_DESC_END: 'EDA_VERSION_DESC_END',

  MONITORS_ALERT_DETAIL_BEGIN: 'MONITORS_ALERT_DETAIL_BEGIN',
  MONITORS_ALERT_DETAIL_END: 'MONITORS_ALERT_DETAIL_END',

  MONITORS_ALERT_EVENTS_BEGIN: 'MONITORS_ALERT_EVENTS_BEGIN',
  MONITORS_ALERT_EVENTS_END: 'MONITORS_ALERT_EVENTS_END',

  MONITORING_METRICS_BEGIN: 'MONITORING_METRICS_BEGIN',
  MONITORING_METRICS_END: 'MONITORING_METRICS_END',

  MONITORING_MODELS_LIST_BEGIN: 'MONITORING_MODELS_LIST_BEGIN',
  MONITORING_MODELS_LIST_END: 'MONITORING_MODELS_LIST_END',

  MONITORING_MODELS_VERSIONS_LIST_BEGIN: 'MONITORING_MODELS_VERSIONS_LIST_BEGIN',
  MONITORING_MODELS_VERSIONS_LIST_END: 'MONITORING_MODELS_VERSIONS_LIST_END',

  MONITORING_MODELS_LIST_ALL_BEGIN: 'MONITORING_MODELS_LIST_ALL_BEGIN',
  MONITORING_MODELS_LIST_ALL_END: 'MONITORING_MODELS_LIST_ALL_END',

  MONITORING_MODELS_DESC_BEGIN: 'MONITORING_MODELS_DESC_BEGIN',
  MONITORING_MODELS_DESC_END: 'MONITORING_MODELS_DESC_END',

  MODELS_SCHEMA_BEGIN: 'MODELS_SCHEMA_BEGIN',
  MODELS_SCHEMA_END: 'MODELS_SCHEMA_END,',

  PROJECTS_ONE_START: 'PROJECTS_ONE_START',
  PROJECTS_ONE_END: 'PROJECTS_ONE_END',

  METRICS_VERSIONS_START: 'METRICS_VERSIONS_START',
  METRICS_VERSIONS_END: 'METRICS_VERSIONS_END',

  METRICS_VERSIONONE_START: 'METRICS_VERSIONONE_START',
  METRICS_VERSIONONE_END: 'METRICS_VERSIONONE_END',
  METRICS_VERSIONONE_RESET: 'METRICS_VERSIONONE_RESET',

  DEVCENTER_UPVOTE_CHANGE: 'DEVCENTER_UPVOTE_CHANGE',

  DEVCENTER_USER_RETRIEVE_START: 'DEVCENTER_USER_RETRIEVE_START',
  DEVCENTER_USER_RETRIEVE_END: 'DEVCENTER_USER_RETRIEVE_END',

  DEVCENTER_MODEL_COMMENTS_RETRIEVE_START: 'DEVCENTER_MODEL_COMMENTS_RETRIEVE_START',
  DEVCENTER_MODEL_COMMENTS_RETRIEVE_END: 'DEVCENTER_MODEL_COMMENTS_RETRIEVE_END',

  DEVCENTER_MODEL_GRAPHS_RETRIEVE_START: 'DEVCENTER_MODEL_GRAPHS_RETRIEVE_START',
  DEVCENTER_MODEL_GRAPHS_RETRIEVE_END: 'DEVCENTER_MODEL_GRAPHS_RETRIEVE_END',

  DEVCENTER_MODEL_METRICS_RETRIEVE_START: 'DEVCENTER_MODEL_METRICS_RETRIEVE_START',
  DEVCENTER_MODEL_METRICS_RETRIEVE_END: 'DEVCENTER_MODEL_METRICS_RETRIEVE_END',

  DEVCENTER_LISTING_RESET_ALL: 'DEVCENTER_LISTING_RESET_ALL',

  DEVCENTER_LISTING_RETRIEVE_START: 'DEVCENTER_LISTING_RETRIEVE_START',
  DEVCENTER_LISTING_RETRIEVE_END: 'DEVCENTER_LISTING_RETRIEVE_END',

  PRED_METRICS_DESCRIBE_START: 'PRED_METRICS_DESCRIBE_START',
  PRED_METRICS_DESCRIBE_END: 'PRED_METRICS_DESCRIBE_END',

  PRED_METRICS_VERSION_DESCRIBE_START: 'PRED_METRICS_VERSION_DESCRIBE_START',
  PRED_METRICS_VERSION_DESCRIBE_END: 'PRED_METRICS_VERSION_DESCRIBE_END',

  PRED_METRICS_VERSIONS_LIST_START: 'PRED_METRICS_VERSIONS_LIST_START',
  PRED_METRICS_VERSIONS_LIST_END: 'PRED_METRICS_VERSIONS_LIST_END',

  PRED_METRICS_LIST_START: 'PRED_METRICS_LIST_START',
  PRED_METRICS_LIST_END: 'PRED_METRICS_LIST_END',

  PRED_METRICS_PROJECT_LIST_START: 'PRED_METRICS_PROJECT_LIST_START',
  PRED_METRICS_PROJECT_LIST_END: 'PRED_METRICS_PROJECT_LIST_END',

  DEVCENTER_MODEL_DETAIL_RETRIEVE_START: 'DEVCENTER_MODEL_DETAIL_RETRIEVE_START',
  DEVCENTER_MODEL_DETAIL_RETRIEVE_END: 'DEVCENTER_MODEL_DETAIL_RETRIEVE_END',

  STREAM_TOKENS_START: 'STREAM_TOKENS_START',
  STREAM_TOKENS_END: 'STREAM_TOKENS_END',

  DOCS_METHOD_SAMPLE_CODE_START: 'DOCS_METHOD_SAMPLE_CODE_START',
  DOCS_METHOD_SAMPLE_CODE_END: 'DOCS_METHOD_SAMPLE_CODE_END',

  MODELS_VERSIONS_BEGIN: 'MODELS_VERSIONS_BEGIN',
  MODELS_VERSIONS_END: 'MODELS_VERSIONS_END',

  MODELS_AUGM_BEGIN: 'MODELS_AUGM_BEGIN',
  MODELS_AUGM_END: 'MODELS_AUGM_END',

  BATCH_LIST_START: 'BATCH_LIST_START',
  BATCH_LIST_END: 'BATCH_LIST_END',
  BATCH_UPDATE_LIFECYCLE: 'BATCH_UPDATE_LIFECYCLE',
  BATCH_RESET_ALL_FOR_PROJECTS: 'BATCH_RESET_ALL_FOR_PROJECTS',
  BATCH_DESCRIBE_START: 'BATCH_DESCRIBE_START',
  BATCH_DESCRIBE_END: 'BATCH_DESCRIBE_END',
  BATCH_DESCRIBE_VERSION_START: 'BATCH_DESCRIBE_VERSION_START',
  BATCH_DESCRIBE_VERSION_END: 'BATCH_DESCRIBE_VERSION_END',
  BATCH_LIST_VERSIONS_START: 'BATCH_LIST_VERSIONS_START',
  BATCH_LIST_VERSIONS_END: 'BATCH_LIST_VERSIONS_END',
  BATCH_VERSION_UPDATE_LIFECYCLE: 'BATCH_VERSION_UPDATE_LIFECYCLE',

  ALERTS_REFRESH_START: 'ALERTS_REFRESH_START',
  ALERTS_REFRESH_END: 'ALERTS_REFRESH_END',

  GET_AUTH_ORGS_START: 'GET_AUTH_ORGS_START',
  GET_AUTH_ORGS_END: 'GET_AUTH_ORGS_END',

  SAMPLE_PROJECT_START: 'SAMPLE_PROJECT_START',
  SAMPLE_PROJECT_END: 'SAMPLE_PROJECT_END',

  SCHEMA_MODEL_VERSION_START: 'SCHEMA_MODEL_VERSION_START',
  SCHEMA_MODEL_VERSION_END: 'SCHEMA_MODEL_VERSION_END',

  HELP_USECASES_RETRIEVE_START: 'HELP_USECASES_RETRIEVE_START',
  HELP_USECASES_RETRIEVE_END: 'HELP_USECASES_RETRIEVE_END',

  HELP_RETRIEVE_START: 'HELP_RETRIEVE_START',
  HELP_RETRIEVE_END: 'HELP_RETRIEVE_END',

  MODELS_ONE_BEGIN: 'MODELS_ONE_BEGIN',
  MODELS_ONE_END: 'MODELS_ONE_END',

  PROJECT_DATASET_START: 'PROJECT_DATASET_START',
  PROJECT_DATASET_END: 'PROJECT_DATASET_END',

  ALL_DATASETS_START: 'ALL_DATASETS_START',
  ALL_DATASETS_END: 'ALL_DATASETS_END',

  TRAINING_OPTIONS_START: 'TRAINING_OPTIONS_START',
  TRAINING_OPTIONS_END: 'TRAINING_OPTIONS_END',

  DEFAULT_MODEL_NAME_START: 'DEFAULT_MODEL_NAME_START',
  DEFAULT_MODEL_NAME_END: 'DEFAULT_MODEL_NAME_END',

  DEFAULT_DEPLOYMENT_NAME_START: 'DEFAULT_DEPLOYMENT_NAME_START',
  DEFAULT_DEPLOYMENT_NAME_END: 'DEFAULT_DEPLOYMENT_NAME_END',

  MODELS_LIST_BEGIN: 'MODELS_LIST_BEGIN',
  MODELS_LIST_END: 'MODELS_LIST_END',

  RESET_ALL_METRICS: 'RESET_ALL_METRICS',

  REQ_FEATURES_SCHEMA_TYPE_START: 'REQ_FEATURES_SCHEMA_TYPE_START',
  REQ_FEATURES_SCHEMA_TYPE_END: 'REQ_FEATURES_SCHEMA_TYPE_END',

  DEPLOY_SAMPLE_CODE_START: 'DEPLOY_SAMPLE_CODE_START',
  DEPLOY_SAMPLE_CODE_END: 'DEPLOY_SAMPLE_CODE_END',

  MODEL_VERSION_UPDATE_LIFECYCLE: 'MODEL_VERSION_UPDATE_LIFECYCLE',
  DEPLOYMENT_VERSION_UPDATE_LIFECYCLE: 'DEPLOYMENT_VERSION_UPDATE_LIFECYCLE',
  DEPLOYMENT_UPDATE_LIFECYCLE: 'DEPLOYMENT_UPDATE_LIFECYCLE',
  MODEL_UPDATE_LIFECYCLE: 'MODEL_UPDATE_LIFECYCLE',
  MODEL_MONITOR_UPDATE_LIFECYCLE: 'MODEL_MONITOR_UPDATE_LIFECYCLE',
  MODEL_MONITOR_VERSION_UPDATE_LIFECYCLE: 'MODEL_MONITOR_VERSION_UPDATE_LIFECYCLE',
  DATASETS_UPDATE_LIFECYCLE: 'DATASETS_UPDATE_LIFECYCLE',
  DATASETS_LIST_BEGIN: 'DATASETS_LIST_BEGIN',
  DATASETS_LIST_END: 'DATASETS_LIST_END',
  DATASETS_VERSIONS_LIST_BEGIN: 'DATASETS_VERSIONS_LIST_BEGIN',
  DATASETS_VERSIONS_LIST_END: 'DATASETS_VERSIONS_LIST_END',
  FEATUREGROUPS_ONE_UPDATE_LIFECYCLE: 'FEATUREGROUPS_ONE_UPDATE_LIFECYCLE',
  FEATUREGROUPS_CODE_UPDATE_LIFECYCLE: 'FEATUREGROUPS_CODE_UPDATE_LIFECYCLE',
  FEATUREGROUPS_VERSIONS_UPDATE_LIFECYCLE: 'FEATUREGROUPS_VERSIONS_UPDATE_LIFECYCLE',

  SCHEMA_PROJECT_VERSIONS_LIST_BEGIN: 'SCHEMA_PROJECT_VERSIONS_LIST_BEGIN',
  SCHEMA_PROJECT_VERSIONS_LIST_END: 'SCHEMA_PROJECT_VERSIONS_LIST_END',
  SCHEMA_DATASETS_VERSIONS_LIST_BEGIN: 'SCHEMA_DATASETS_VERSIONS_LIST_BEGIN',
  SCHEMA_DATASETS_VERSIONS_LIST_END: 'SCHEMA_DATASETS_VERSIONS_LIST_END',
  SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_BEGIN: 'SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_BEGIN',
  SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_END: 'SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_END',

  CUSTOM_MODEL_INFO_START: 'CUSTOM_MODEL_INFO_START',
  CUSTOM_MODEL_INFO_END: 'CUSTOM_MODEL_INFO_END',

  EXPLANIABLE_PROJECT_START: 'EXPLANIABLE_PROJECT_START',
  EXPLANIABLE_PROJECT_END: 'EXPLANIABLE_PROJECT_END',

  GET_AUTH_USER_START: 'GET_AUTH_USER_START',
  GET_AUTH_USER_END: 'GET_AUTH_USER_END',
  GET_AUTH_LOGOUT: 'GET_AUTH_LOGOUT',
  FORCE_AUTH_USER_DATA: 'FORCE_AUTH_USER_DATA',
  ORG_CPU_MEMORY_START: 'ORG_CPU_MEMORY_START',
  ORG_CPU_MEMORY_END: 'ORG_CPU_MEMORY_END',

  SET_PARAMS: 'SET_PARAMS',

  PROJECTS_LIST_UPDATE: 'PROJECTS_LIST_UPDATE',

  PROJECT_CREATE_PREDICTIVE_STATE: 'PROJECT_CREATE_PREDICTIVE_STATE',
  PROJECTS_ALL_START: 'PROJECTS_ALL_START',
  PROJECTS_ALL_END: 'PROJECTS_ALL_END',
  PROJECTS_LIST_START: 'PROJECTS_LIST_START',
  PROJECTS_LIST_END: 'PROJECTS_LIST_END',
  PROJECTS_ALGOS_START: 'PROJECTS_ALGOS_START',
  PROJECTS_ALGOS_END: 'PROJECTS_ALGOS_END',
  PROJECTS_FIELD_VALUES_START: 'PROJECTS_FIELD_VALUES_START',
  PROJECTS_FIELD_VALUES_END: 'PROJECTS_FIELD_VALUES_END',

  ALGORITHMS_LIST_BEGIN: 'ALGORITHMS_LIST_BEGIN',
  ALGORITHMS_LIST_END: 'ALGORITHMS_LIST_END',
  ALGORITHMS_DETAIL_BEGIN: 'ALGORITHMS_DETAIL_BEGIN',
  ALGORITHMS_DETAIL_END: 'ALGORITHMS_DETAIL_END',

  BUILTIN_ALGORITHMS_LIST_BEGIN: 'BUILTIN_ALGORITHMS_LIST_BEGIN',
  BUILTIN_ALGORITHMS_LIST_END: 'BUILTIN_ALGORITHMS_LIST_END',

  LIST_PRETRAINED_MODEL_ALGORITHMS_BEGIN: 'LIST_PRETRAINED_MODEL_ALGORITHMS_BEGIN',
  LIST_PRETRAINED_MODEL_ALGORITHMS_END: 'LIST_PRETRAINED_MODEL_ALGORITHMS_END',

  USE_CASES_START: 'USE_CASES_START',
  USE_CASES_END: 'USE_CASES_END',

  LIST_REQUESTS_START: 'LIST_REQUESTS_START',
  LIST_REQUESTS_END: 'LIST_REQUESTS_END',

  LIST_REQUESTS_BP_START: 'LIST_REQUESTS_BP_START',
  LIST_REQUESTS_BP_END: 'LIST_REQUESTS_BP_END',

  SOLUTIONS_LIST_START: 'SOLUTIONS_LIST_START',
  SOLUTIONS_LIST_END: 'SOLUTIONS_LIST_END',
  USE_CASES_FOR_SOLUTION_START: 'USE_CASES_FOR_SOLUTION_START',
  USE_CASES_FOR_SOLUTION_END: 'USE_CASES_FOR_SOLUTION_END',
  USE_CASES_LIST_PROBLEMTYPES_START: 'USE_CASES_LIST_PROBLEMTYPES_START',
  USE_CASES_LIST_PROBLEMTYPES_END: 'USE_CASES_LIST_PROBLEMTYPES_END',

  PROBLEM_DEF_PREPARE_START: 'PROBLEM_DEF_PREPARE_START',
  PROBLEM_DEF_PREPARE_END: 'PROBLEM_DEF_PREPARE_END',
  PROBLEM_DEF_SET_IDS: 'PROBLEM_DEF_SET_IDS',
  PROBLEM_DEF_FILE_DATA_USE_START: 'PROBLEM_DEF_FILE_DATA_USE_START',
  PROBLEM_DEF_FILE_DATA_USE_END: 'PROBLEM_DEF_FILE_DATA_USE_END',
  PROBLEM_DEF_FILE_SCHEMA_START: 'PROBLEM_DEF_FILE_SCHEMA_START',
  PROBLEM_DEF_FILE_SCHEMA_END: 'PROBLEM_DEF_FILE_SCHEMA_END',
  PROBLEM_DEF_FILE_SCHEMA_VERSION_START: 'PROBLEM_DEF_FILE_SCHEMA_VERSION_START',
  PROBLEM_DEF_FILE_SCHEMA_VERSION_END: 'PROBLEM_DEF_FILE_SCHEMA_VERSION_END',
  PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_START: 'PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_START',
  PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_END: 'PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_END',
  PROBLEM_DEF_FILE_SET_FILENAME: 'PROBLEM_DEF_FILE_SET_FILENAME',

  FEATUREGROUP_ANALYZE_SCHEMA_DATA_START: 'FEATUREGROUP_ANALYZE_SCHEMA_DATA_START',
  FEATUREGROUP_ANALYZE_SCHEMA_DATA_END: 'FEATUREGROUP_ANALYZE_SCHEMA_DATA_END',

  SCHEMA_DATA_RESET: 'SCHEMA_DATA_RESET',

  CHARTS_DATA_EXPLORER_START: 'CHARTS_DATA_EXPLORER_START',
  CHARTS_DATA_EXPLORER_END: 'CHARTS_DATA_EXPLORER_END',

  PROJECT_VALIDATION_START: 'PROJECT_VALIDATION_START',
  PROJECT_VALIDATION_END: 'PROJECT_VALIDATION_END',
  PROJECT_VALIDATION_RESET: 'PROJECT_VALIDATION_RESET',

  ANALYZE_SCHEMA_DATA_START: 'ANALYZE_SCHEMA_DATA_START',
  ANALYZE_SCHEMA_DATA_END: 'ANALYZE_SCHEMA_DATA_END',

  STORAGE_LIST_START: 'STORAGE_LIST_START',
  STORAGE_LIST_END: 'STORAGE_LIST_END',
  STORAGE_REFRESH_START: 'STORAGE_REFRESH_START',
  STORAGE_REFRESH_END: 'STORAGE_REFRESH_END',

  DEPLOY_PROJECT_START: 'DEPLOY_PROJECT_START',
  DEPLOY_PROJECT_END: 'DEPLOY_PROJECT_END',

  DEPLOY_VERSIONS_START: 'DEPLOY_VERSIONS_START',
  DEPLOY_VERSIONS_END: 'DEPLOY_VERSIONS_END',

  DEPLOY_VERSIONS_HISTORY_START: 'DEPLOY_VERSIONS_HISTORY_START',
  DEPLOY_VERSIONS_HISTORY_END: 'DEPLOY_VERSIONS_HISTORY_END',

  DEPLOY_TOKENS_PROJECT_START: 'DEPLOY_TOKENS_PROJECT_START',
  DEPLOY_TOKENS_PROJECT_END: 'DEPLOY_TOKENS_PROJECT_END',

  DATABASE_CONNECTOR_OPTIONS_START: 'DATABASE_CONNECTOR_OPTIONS_START',
  DATABASE_CONNECTOR_OPTIONS_END: 'DATABASE_CONNECTOR_OPTIONS_END',

  APPLICATION_CONNECTOR_OPTIONS_START: 'APPLICATION_CONNECTOR_OPTIONS_START',
  APPLICATION_CONNECTOR_OPTIONS_END: 'APPLICATION_CONNECTOR_OPTIONS_END',

  APPLICATION_CONNECTORS_START: 'APPLICATION_CONNECTORS_START',
  APPLICATION_CONNECTORS_END: 'APPLICATION_CONNECTORS_END',

  STREAMING_CONNECTOR_OPTIONS_START: 'STREAMING_CONNECTOR_OPTIONS_START',
  STREAMING_CONNECTOR_OPTIONS_END: 'STREAMING_CONNECTOR_OPTIONS_END',

  STREAMING_CONNECTORS_START: 'STREAMING_CONNECTORS_START',
  STREAMING_CONNECTORS_END: 'STREAMING_CONNECTORS_END',

  FILE_CONNECTOR_OPTIONS_START: 'FILE_CONNECTOR_OPTIONS_START',
  FILE_CONNECTOR_OPTIONS_END: 'FILE_CONNECTOR_OPTIONS_END',

  DATABASE_CONNECTORS_START: 'DATABASE_CONNECTORS_START',
  DATABASE_CONNECTORS_END: 'DATABASE_CONNECTORS_END',

  FILE_CONNECTORS_START: 'FILE_CONNECTORS_START',
  FILE_CONNECTORS_END: 'FILE_CONNECTORS_END',

  DATABASE_CONNECTOR_OBJECTS_START: 'DATABASE_CONNECTOR_OBJECTS_START',
  DATABASE_CONNECTOR_OBJECTS_END: 'DATABASE_CONNECTOR_OBJECTS_END',

  DATABASE_CONNECTOR_OBJECT_SCHEMA_START: 'DATABASE_CONNECTOR_OBJECT_SCHEMA_START',
  DATABASE_CONNECTOR_OBJECT_SCHEMA_END: 'DATABASE_CONNECTOR_OBJECT_SCHEMA_END',

  FEATUREGROUPS_PROJECT_LIST_START: 'FEATUREGROUPS_PROJECT_LIST_START',
  FEATUREGROUPS_PROJECT_LIST_END: 'FEATUREGROUPS_PROJECT_LIST_END',

  FEATUREGROUP_LINEAGE_PROJECT_START: 'FEATUREGROUP_LINEAGE_PROJECT_START',
  FEATUREGROUP_LINEAGE_PROJECT_END: 'FEATUREGROUP_LINEAGE_PROJECT_END',

  FEATUREGROUPS_TEMPLATE_LIST_START: 'FEATUREGROUPS_TEMPLATE_LIST_START',
  FEATUREGROUPS_TEMPLATE_LIST_END: 'FEATUREGROUPS_TEMPLATE_LIST_END',

  FEATUREGROUPS_TYPES_START: 'FEATUREGROUPS_TYPES_START',
  FEATUREGROUPS_TYPES_END: 'FEATUREGROUPS_TYPES_END',

  FEATUREGROUPS_TYPES_ADD_START: 'FEATUREGROUPS_TYPES_ADD_START',
  FEATUREGROUPS_TYPES_ADD_END: 'FEATUREGROUPS_TYPES_ADD_END',

  FEATUREGROUPS_VERSIONS_LIST_START: 'FEATUREGROUPS_VERSIONS_LIST_START',
  FEATUREGROUPS_VERSIONS_LIST_END: 'FEATUREGROUPS_VERSIONS_LIST_END',

  FEATUREGROUPS_PROJECT_LIST_START_PUBLIC: 'FEATUREGROUPS_PROJECT_LIST_START_PUBLIC',
  FEATUREGROUPS_PROJECT_LIST_END_PUBLIC: 'FEATUREGROUPS_PROJECT_LIST_END_PUBLIC',

  FEATUREGROUPS_DESCRIBE_START: 'FEATUREGROUPS_DESCRIBE_START',
  FEATUREGROUPS_DESCRIBE_END: 'FEATUREGROUPS_DESCRIBE_END',
  FEATUREGROUPS_DESCRIBE_RESET: 'FEATUREGROUPS_DESCRIBE_RESET',

  FEATUREGROUPS_DESCRIBE_LIST_START: 'FEATUREGROUPS_DESCRIBE_LIST_START',
  FEATUREGROUPS_DESCRIBE_LIST_END: 'FEATUREGROUPS_DESCRIBE_LIST_END',

  FEATUREGROUPS_CHARTS_START: 'FEATUREGROUPS_CHARTS_START',
  FEATUREGROUPS_CHARTS_END: 'FEATUREGROUPS_CHARTS_END',

  FEATUREGROUPS_EXPORTS_LIST_START: 'FEATUREGROUPS_EXPORTS_LIST_START',
  FEATUREGROUPS_EXPORTS_LIST_END: 'FEATUREGROUPS_EXPORTS_LIST_END',

  FEATUREGROUPS_REFRESH_LIST_START: 'FEATUREGROUPS_REFRESH_LIST_START',
  FEATUREGROUPS_REFRESH_LIST_END: 'FEATUREGROUPS_REFRESH_LIST_END',

  FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_START: 'FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_START',
  FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_END: 'FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_END',

  FEATUREGROUPS_EXPORTS_UPDATE_LIFECYCLE: 'FEATUREGROUPS_EXPORTS_UPDATE_LIFECYCLE',

  PIT_WINDOW_FUNCTIONS_START: 'PIT_WINDOW_FUNCTIONS_START',
  PIT_WINDOW_FUNCTIONS_END: 'PIT_WINDOW_FUNCTIONS_END',
  PIPELINE_DETAIL_BEGIN: 'PIPELINE_DETAIL_BEGIN',
  PIPELINE_DETAIL_END: 'PIPELINE_DETAIL_END',
  PIPELINE_LIST_BEGIN: 'PIPELINE_LIST_BEGIN',
  PIPELINE_LIST_END: 'PIPELINE_LIST_END',
  PIPELINE_VERSION_BEGIN: 'PIPELINE_VERSION_BEGIN',
  PIPELINE_VERSION_END: 'PIPELINE_VERSION_END',

  INITIALIZE_2FA: 'INITIALIZE_2FA',
  TWO_FA_INPROGRESS: 'TWO_FA_INPROGRESS',

  ModelRegisterPnpPythonZipFile: null,

  refreshAutoCancelAll_() {
    StoreActions.refreshDatasetUntilStateCancelAll_();
    StoreActions.refreshModelUntilStateCancelAll_();
    StoreActions.refreshDeployUntilStateCancelAll_();
    StoreActions.refreshDeployVersionUntilStateCancelAll_();
    StoreActions.refreshBatchUntilStateCancelAll_();
    StoreActions.refreshBatchVersionsUntilStateCancelAll_();
    StoreActions.refreshFGUntilStateCancelAll_();
    StoreActions.refreshFGVersionsUntilStateCancelAll_();
    StoreActions.refreshCDSUntilStateCancelAll_();
    StoreActions.refreshNotebookUntilStateCancelAll_();
    StoreActions.refreshEdaUntilStateCancelAll_();
    StoreActions.refreshEdaVersionsUntilStateCancelAll_();
  },

  refreshAll_() {
    StoreActions.refreshAutoCancelAll_();

    StoreActions.resetAllChangeOrg_();

    StoreActions.getProjectsList_();
    StoreActions.getUseCases_();

    StoreActions.getAuthUser_();
  },

  //
  refreshDeployVersionUntilStateCanceled: {},

  refreshDoDeployVersionAll_(deployVersion?: string, deployId?: string, projectId?: string) {
    if (!deployId || !deployVersion) {
      return;
    }

    if (StoreActions.refreshDeployVersionUntilStateIsUploading_(deployVersion)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshDeployVersionUntilState_(
      deployVersion,
      undefined,
      (currentStatus) => {
        StoreActions.updateDeployVersionLifecyle_(deployVersion, deployId, projectId, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshDeployVersionUntilStateCancel_(deployVersion);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.listDeployVersions_(deployId);
          if (calcFieldValuesByDeployId(undefined, deployId) != null) {
            StoreActions.getFieldValuesForDeploymentId_(deployId);
          }
          StoreActions.listDeployVersionsHistory_(deployId);

          StoreActions.deployList_(projectId);
          StoreActions.deployTokensList_(projectId);
        }
      },
    );
  },

  refreshDeployVersionUntilStateCancel_(deployVersion: string) {
    delete this.refreshDeployVersionUntilStateCanceled[deployVersion];
  },

  refreshDeployVersionUntilStateIsUploading_(deployVersion: string) {
    return this.refreshDeployVersionUntilStateCanceled[deployVersion] === true;
  },

  refreshDeployVersionUntilStateCancelAll_() {
    this.refreshDeployVersionUntilStateCanceled = {};
  },

  refreshDeployVersionUntilState_(
    deployVersion: string,
    untilState: DeploymentLifecycle[] = [DeploymentLifecycle.ACTIVE, DeploymentLifecycle.STOPPED, DeploymentLifecycle.FAILED, DeploymentLifecycle.CANCELLED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
    refreshEvery = null,
  ) {
    if (Utils.isNullOrEmpty(deployVersion)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshDeployVersionUntilStateCanceled[deployVersion] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshDeployVersionUntilStateCanceled[deployVersion] !== true) {
        return;
      }

      ind++;

      REClient_.client_()._describeDeploymentVersion(deployVersion, (err, res) => {
        if (res && !res?.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        let lifecycle1 = res?.result?.status || res?.result?.lifecycle;
        if (!err && lifecycle1) {
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshDeployVersionUntilStateCanceled[deployVersion] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        let secs = refreshEvery;
        if (secs == null) {
          secs = ind < 10 ? 10 : 60;
        }
        timer = setTimeout(() => {
          doWork();
        }, secs * 1000);
      });
    };

    doWork();
  },

  //
  refreshModelVersionUntilStateCanceled: {},

  refreshDoModelVersionAll_(modelVersion?: string, modelId?: string, projectId?: string) {
    if (!modelId || !modelVersion) {
      return;
    }

    if (StoreActions.refreshModelVersionUntilStateIsUploading_(modelVersion)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshModelVersionUntilState_(
      modelVersion,
      undefined,
      (currentStatus) => {
        StoreActions.updateModelVersionLifecyle_(modelVersion, modelId, projectId, currentStatus);

        StoreActions.getModelDetail_(modelId);
        StoreActions.modelsVersionsByModelId_(modelId);
        if (projectId) {
          StoreActions.listModels_(projectId);
          StoreActions.deployList_(projectId);
        }
        StoreActions.resetAllMetrics();
      },
      (isDone, lifecycle) => {
        StoreActions.refreshModelVersionUntilStateCancel_(modelVersion);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.getModelDetail_(modelId);
          StoreActions.modelsVersionsByModelId_(modelId);
          if (projectId) {
            StoreActions.listModels_(projectId);
            StoreActions.deployList_(projectId);
          }
          StoreActions.resetAllMetrics();
        }
      },
    );
  },

  refreshModelVersionUntilStateCancel_(modelVersion: string) {
    delete this.refreshModelVersionUntilStateCanceled[modelVersion];
  },

  refreshModelVersionUntilStateIsUploading_(modelVersion: string) {
    return this.refreshModelVersionUntilStateCanceled[modelVersion] === true;
  },

  refreshModelVersionUntilStateCancelAll_() {
    this.refreshModelVersionUntilStateCanceled = {};
  },

  refreshModelVersionUntilState_(
    modelVersion: string,
    untilState: ModelLifecycle[] = [ModelLifecycle.COMPLETE, ModelLifecycle.UPLOADING_FAILED, ModelLifecycle.EVALUATING_FAILED, ModelLifecycle.TRAINING_FAILED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
    refreshEvery = null,
  ) {
    if (Utils.isNullOrEmpty(modelVersion)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshModelVersionUntilStateCanceled[modelVersion] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshModelVersionUntilStateCanceled[modelVersion] !== true) {
        return;
      }

      ind++;

      REClient_.client_()._describeModelVersion(modelVersion, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        let lifecycle1 = res?.result?.status || res?.result?.lifecycle;
        if (!err && lifecycle1) {
          if (untilState.includes(lifecycle1) && res?.result?.automlComplete === true) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshModelVersionUntilStateCanceled[modelVersion] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        let secs = refreshEvery;
        if (secs == null) {
          secs = ind < 10 ? 10 : 60;
        }
        timer = setTimeout(() => {
          doWork();
        }, secs * 1000);
      });
    };

    doWork();
  },

  //
  refreshDeployUntilStateCanceled: {},

  refreshDoDeployAll_(deployId?: string, projectId?: string) {
    if (!deployId) {
      return;
    }

    if (StoreActions.refreshDeployUntilStateIsUploading_(deployId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshDeployUntilState_(
      deployId,
      undefined,
      (currentStatus) => {
        let ds1 = calcDeploymentsByProjectId(undefined, projectId);
        if (ds1) {
          StoreActions.updateDeployLifecyle_(deployId, projectId, currentStatus);
        }
      },
      (isDone, lifecycle) => {
        StoreActions.refreshDeployUntilStateCancel_(deployId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.deployList_(projectId);
          StoreActions.deployTokensList_(projectId);

          StoreActions.listDeployVersions_(deployId);
          if (calcFieldValuesByDeployId(undefined, deployId) != null) {
            StoreActions.getFieldValuesForDeploymentId_(deployId);
          }
          StoreActions.listDeployVersionsHistory_(deployId);
        }
      },
    );
  },

  refreshDeployUntilStateCancel_(deployId: string) {
    delete this.refreshDeployUntilStateCanceled[deployId];
  },

  refreshDeployUntilStateIsUploading_(deployId: string) {
    return this.refreshDeployUntilStateCanceled[deployId] === true;
  },

  refreshDeployUntilStateCancelAll_() {
    this.refreshDeployUntilStateCanceled = {};
  },

  refreshDeployUntilState_(
    deployId: string,
    untilState: DeploymentLifecycle[] = [DeploymentLifecycle.ACTIVE, DeploymentLifecycle.STOPPED, DeploymentLifecycle.FAILED, DeploymentLifecycle.CANCELLED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
    refreshEvery = null,
  ) {
    if (Utils.isNullOrEmpty(deployId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshDeployUntilStateCanceled[deployId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshDeployUntilStateCanceled[deployId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeDeployment(deployId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.status) {
          let lifecycle1 = res.result.status;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshDeployUntilStateCanceled[deployId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        let secs = refreshEvery;
        if (secs == null) {
          secs = ind < 10 ? 10 : 60;
        }
        timer = setTimeout(() => {
          doWork();
        }, secs * 1000);
      });
    };

    doWork();
  },

  //
  refreshDatasetUntilStateCanceled: {},
  refreshDatasetUntilStateCanceledAnytime: [],

  refreshDoDatasetAll_(datasetId?: string, projectId?: string, batchPredId = null) {
    if (!datasetId) {
      return;
    }

    const datasetUseId = datasetId;

    if (StoreActions.refreshDatasetUntilStateIsUploading_(datasetUseId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshDatasetUntilState_(
      datasetId,
      undefined,
      (currentStatus) => {
        let ds1 = calcDatasetById(undefined, datasetId);
        if (ds1) {
          StoreActions.updateDatasetLifecyle_(datasetId, currentStatus);
          setTimeout(() => {
            REUploads_.client_().forceUpdate();
          }, 0);
        }
      },
      (isDone, lifecycle) => {
        StoreActions.refreshDatasetUntilStateCancel_(datasetUseId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          setTimeout(() => {
            REUploads_.client_().forceUpdate();
          }, 0);
          StoreActions.getProjectsList_();
          StoreActions.getProjectsById_(projectId);
          StoreActions.listDatasets_([datasetUseId], () => {
            setTimeout(() => {
              REUploads_.client_().forceUpdate();
            }, 0);
          });
          StoreActions.listDatasetsVersions_(datasetId);
          if (projectId) {
            StoreActions.listModels_(projectId, (models) => {
              if (models && _.isArray(models)) {
                models.some((m1) => {
                  if (m1.modelId) {
                    StoreActions.getModelDetail_(m1.modelId);
                  }
                });
              }
            });
            StoreActions.getProjectDatasets_(projectId);
            StoreActions.validateProjectDatasets_(projectId);
            StoreActions.schemaGetFileDataUse_(projectId, datasetId, batchPredId);

            StoreActions.featureGroupsGetByProject_(projectId, (list) => {
              list?.some((f1) => {
                StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
              });
            });
          }
          if (batchPredId) {
            StoreActions.batchList_(projectId);
            StoreActions.batchDescribeById_(batchPredId);
          }
        }
      },
      2,
    );
  },

  refreshDatasetUntilStateCancel_(datasetId: string) {
    if (datasetId == null || datasetId === '') {
      return;
    }

    this.refreshDatasetUntilStateCanceledAnytime.push(datasetId);
    setTimeout(() => {
      this.refreshDatasetUntilStateCanceledAnytime = this.refreshDatasetUntilStateCanceledAnytime.filter((s1) => s1 !== datasetId);
    }, 20000);

    delete this.refreshDatasetUntilStateCanceled[datasetId];
  },

  refreshDatasetUntilStateIsUploading_(datasetId: string) {
    return this.refreshDatasetUntilStateCanceled[datasetId] === true;
  },

  refreshDatasetUntilStateCancelAll_() {
    this.refreshDatasetUntilStateCanceled = {};
  },

  refreshDatasetUntilState_(
    datasetId: string,
    untilState: DatasetLifecycle[] = [DatasetLifecycle.COMPLETE, DatasetLifecycle.FAILED, DatasetLifecycle.CANCELLED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
    refreshEvery = null,
  ) {
    const datasetUseId = datasetId;

    if (Utils.isNullOrEmpty(datasetId) || this.refreshDatasetUntilStateCanceledAnytime.includes(datasetUseId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshDatasetUntilStateCanceled[datasetUseId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshDatasetUntilStateCanceled[datasetUseId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeDataset(datasetId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.latestDatasetVersion) {
          let lifecycle1 = res.result.latestDatasetVersion.status;

          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshDatasetUntilStateCanceled[datasetUseId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        let secs = refreshEvery;
        if (secs == null) {
          secs = ind < 120 ? 5 : 30; // Repeat every 5 seconds for 10 minutes, then backoff to every 30 seconds
        }
        timer = setTimeout(() => {
          doWork();
        }, secs * 1000);
      });
    };

    doWork();
  },

  //
  refreshFGVersionsUntilStateCanceled: {},
  refreshFGVersionsUntilStateCanceledAnytime: [],

  refreshDoFGVersionsAll_(projectId?: string, featureGroupId?: string, featureGroupVersion?: string, extraCheckStatus?: (data) => any) {
    if (!featureGroupVersion) {
      return;
    }

    if (StoreActions.refreshFGVersionsUntilStateIsUploading_(featureGroupVersion)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshFGVersionsUntilState_(
      featureGroupVersion,
      undefined,
      (currentStatus) => {
        StoreActions.updateFGVersionsLifecyle_(featureGroupId, featureGroupVersion, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshFGVersionsUntilStateCancel_(featureGroupVersion);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.featureGroupsGetByProject_(projectId);
          StoreActions.featureGroupsDescribe_(null, featureGroupId);
          StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
          StoreActions.featureGroupsVersionsList_(featureGroupId);
          StoreActions.analyzeSchemaByFeatureGroupVersion_(featureGroupVersion);
        }
      },
      2,
      extraCheckStatus,
    );
  },

  refreshFGVersionsUntilStateCancel_(featureGroupVersion: string) {
    if (featureGroupVersion == null || featureGroupVersion === '') {
      return;
    }

    this.refreshFGVersionsUntilStateCanceledAnytime.push(featureGroupVersion);
    setTimeout(() => {
      this.refreshFGVersionsUntilStateCanceledAnytime = this.refreshFGVersionsUntilStateCanceledAnytime.filter((s1) => s1 !== featureGroupVersion);
    }, 20000);

    delete this.refreshFGVersionsUntilStateCanceled[featureGroupVersion];
  },

  refreshFGVersionsUntilStateIsUploading_(featureGroupVersion: string) {
    return this.refreshFGVersionsUntilStateCanceled[featureGroupVersion] === true;
  },

  refreshFGVersionsUntilStateCancelAll_() {
    this.refreshFGVersionsUntilStateCanceled = {};
  },

  refreshFGVersionsUntilState_(
    featureGroupVersion: string,
    untilState: FeatureGroupVersionLifecycle[] = [FeatureGroupVersionLifecycle.CANCELLED, FeatureGroupVersionLifecycle.FAILED, FeatureGroupVersionLifecycle.COMPLETE],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
    refreshEvery = null,
    extraCheckStatus: (data) => any = null,
  ) {
    if (Utils.isNullOrEmpty(featureGroupVersion) || this.refreshFGVersionsUntilStateCanceledAnytime.includes(featureGroupVersion)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshFGVersionsUntilStateCanceled[featureGroupVersion] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshFGVersionsUntilStateCanceled[featureGroupVersion] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeFeatureGroupVersion(featureGroupVersion, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.status) {
          let lifecycle1 = res.result.status;

          let extraOk = true;
          if (extraCheckStatus != null) {
            extraOk = extraCheckStatus(res) === true;
          }

          if (untilState.includes(lifecycle1) && extraOk) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshFGVersionsUntilStateCanceled[featureGroupVersion] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        let secs = refreshEvery;
        if (secs == null) {
          secs = ind < 120 ? 5 : 30; // Repeat every 5 seconds for 10 minutes, then backoff to every 30 seconds
        }
        timer = setTimeout(() => {
          doWork();
        }, secs * 1000);
      });
    };

    doWork();
  },

  //
  refreshFGUntilStateCanceled: {},
  refreshFGUntilStateCanceledAnytime: [],

  refreshDoFGAll_(projectId?: string, featureGroupId?: string, extraCheckStatus?: (data) => any) {
    if (!featureGroupId) {
      return;
    }

    if (StoreActions.refreshFGUntilStateIsUploading_(featureGroupId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshFGUntilState_(
      featureGroupId,
      undefined,
      (currentStatus) => {
        StoreActions.updateFGOneLifecyle_(featureGroupId, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshFGUntilStateCancel_(featureGroupId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.featureGroupsDescribeReset_();
          StoreActions.featureGroupsGetByProject_(projectId);
          // StoreActions.featureGroupsDescribe_(null, featureGroupId);
          // StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
          // StoreActions.featureGroupsVersionsList_(featureGroupId);
          // StoreActions.analyzeSchemaByFeatureGroupVersion_(featureGroupVersion);
        }
      },
      2,
      extraCheckStatus,
    );
  },

  refreshDoFGAllAndCodeStatus_(projectId?: string, featureGroupId?: string) {
    let lastStatus = null;
    this.refreshDoFGAll_(projectId, featureGroupId, (res) => {
      let r1 = res?.result?.codeSource == null || ['FAILED', 'COMPLETE'].includes(res?.result?.codeSource?.status);

      let changedStatus = lastStatus != null && lastStatus !== r1;
      lastStatus = r1;

      if (changedStatus) {
        StoreActions.updateFGOneCodeLifecyle_(featureGroupId, r1);
      }
      return r1;
    });
  },

  refreshFGUntilStateCancel_(featureGroupId: string) {
    if (featureGroupId == null || featureGroupId === '') {
      return;
    }

    this.refreshFGUntilStateCanceledAnytime.push(featureGroupId);
    setTimeout(() => {
      this.refreshFGUntilStateCanceledAnytime = this.refreshFGUntilStateCanceledAnytime.filter((s1) => s1 !== featureGroupId);
    }, 20000);

    delete this.refreshFGUntilStateCanceled[featureGroupId];
  },

  refreshFGUntilStateIsUploading_(featureGroupId: string) {
    return this.refreshFGUntilStateCanceled[featureGroupId] === true;
  },

  refreshFGUntilStateCancelAll_() {
    this.refreshFGUntilStateCanceled = {};
  },

  refreshFGUntilState_(
    featureGroupId: string,
    untilState: FeatureGroupLifecycle[] = [FeatureGroupLifecycle.COMPLETE, FeatureGroupLifecycle.FAILED, FeatureGroupLifecycle.CANCELLED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
    refreshEvery = null,
    extraCheckStatus: (data) => any = null,
  ) {
    if (Utils.isNullOrEmpty(featureGroupId) || this.refreshFGUntilStateCanceledAnytime.includes(featureGroupId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshFGUntilStateCanceled[featureGroupId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshFGUntilStateCanceled[featureGroupId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeFeatureGroup(featureGroupId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res?.result?.latestFeatureGroupVersion?.status) {
          let lifecycle1 = res?.result?.latestFeatureGroupVersion?.status;

          let extraOk = true;
          if (extraCheckStatus != null) {
            extraOk = extraCheckStatus(res) === true;
          }

          if (untilState.includes(lifecycle1) && extraOk) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshFGUntilStateCanceled[featureGroupId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        let secs = refreshEvery;
        if (secs == null) {
          secs = ind < 120 ? 5 : 30; // Repeat every 5 seconds for 10 minutes, then backoff to every 30 seconds
        }
        timer = setTimeout(() => {
          doWork();
        }, secs * 1000);
      });
    };

    doWork();
  },

  //
  refreshCDSUntilStateCanceled: null,

  refreshDoCDSAll_() {
    if (StoreActions.refreshCDSUntilStateIsTraining_()) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshCDSUntilState_(
      undefined,
      (currentStatus) => {
        StoreActions.updateCDSLifecyle_(currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshCDSUntilStateCancel_();

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.listCDS_();
        }
      },
    );
  },

  refreshCDSUntilStateCancel_() {
    delete this.refreshCDSUntilStateCanceled;
  },

  refreshCDSUntilStateIsTraining_() {
    return this.refreshCDSUntilStateCanceled === true;
  },

  refreshCDSUntilStateCancelAll_() {
    this.refreshCDSUntilStateCanceled = null;
  },

  refreshCDSUntilState_(
    untilState: CustomDSLifecycle[] = [CustomDSLifecycle.ACTIVE, CustomDSLifecycle.STOPPED, CustomDSLifecycle.FAILED, CustomDSLifecycle.CANCELLED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    this.refreshCDSUntilStateCanceled = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshCDSUntilStateCanceled !== true) {
        return;
      }

      ind++;

      REClient_.client_()._listDataserverDeployments((err, res) => {
        if (res?.result?.[0] == null) {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res?.result?.[0] != null) {
          let lifecycle1 = res.result?.[0]?.status;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshCDSUntilStateCanceled !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  //
  refreshModelUntilStateCanceled: {},

  refreshDoModelAll_(trainModelId: string, projectId?: string) {
    if (!trainModelId) {
      return;
    }

    if (StoreActions.refreshModelUntilStateIsTraining_(trainModelId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshModelUntilState_(
      trainModelId,
      undefined,
      (currentStatus) => {
        StoreActions.updateModelLifecyle_(trainModelId, 0, currentStatus);

        // if(currentStatus?.toUpperCase()===ModelLifecycle.COMPLETE) {
        StoreActions.getModelDetail_(trainModelId);
        StoreActions.modelsVersionsByModelId_(trainModelId);
        if (projectId) {
          StoreActions.listModels_(projectId);
          StoreActions.deployList_(projectId);
        }
        StoreActions.resetAllMetrics();
        // }
      },
      (isDone, lifecycle) => {
        StoreActions.refreshModelUntilStateCancel_(trainModelId);

        if (calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.getModelDetail_(trainModelId);
          StoreActions.modelsVersionsByModelId_(trainModelId);
          if (projectId) {
            StoreActions.listModels_(projectId);
            StoreActions.deployList_(projectId);
          }
          StoreActions.resetAllMetrics();
        }
      },
    );
  },

  refreshModelUntilStateCancel_(modelId: string) {
    delete this.refreshModelUntilStateCanceled[modelId];
  },

  refreshModelUntilStateIsTraining_(modelId: string) {
    return this.refreshModelUntilStateCanceled[modelId] === true;
  },

  refreshModelUntilStateCancelAll_() {
    this.refreshModelUntilStateCanceled = {};
  },

  refreshModelUntilState_(
    modelId: string,
    untilState: ModelLifecycle[] = [ModelLifecycle.TRAINING_FAILED, ModelLifecycle.UPLOADING_FAILED, ModelLifecycle.EVALUATING_FAILED, ModelLifecycle.COMPLETE],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(modelId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshModelUntilStateCanceled[modelId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshModelUntilStateCanceled[modelId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeModel(modelId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.latestModelVersion) {
          let lifecycle1 = res.result?.latestModelVersion?.status;
          let isComplete = [ModelLifecycle.COMPLETE].includes(lifecycle1);

          if ((untilState.includes(lifecycle1) && !isComplete) || (isComplete && untilState.includes(ModelLifecycle.COMPLETE) && res?.result?.latestModelVersion?.automlComplete === true)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH * 60 || this.refreshModelUntilStateCanceled[modelId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  //
  refreshMonitorUntilStateCanceled: {},

  refreshDoMonitorAll_(trainModelMonitorId: string, projectId?: string) {
    if (!trainModelMonitorId) {
      return;
    }

    if (StoreActions.refreshMonitorUntilStateIsTraining_(trainModelMonitorId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshMonitorUntilState_(
      trainModelMonitorId,
      undefined,
      (currentStatus) => {
        StoreActions.updateMonitorLifecyle_(trainModelMonitorId, 0, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshMonitorUntilStateCancel_(trainModelMonitorId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.describeModelMonitorById_(trainModelMonitorId);
          // StoreActions.modelsVersionsByModelId_(trainModelMonitorId);
          if (projectId) {
            StoreActions.listMonitoringModels_(projectId);
          }
        }
      },
    );
  },

  refreshMonitorUntilStateCancel_(modelId: string) {
    delete this.refreshMonitorUntilStateCanceled[modelId];
  },

  refreshMonitorUntilStateIsTraining_(modelId: string) {
    return this.refreshMonitorUntilStateCanceled[modelId] === true;
  },

  refreshMonitorUntilStateCancelAll_() {
    this.refreshMonitorUntilStateCanceled = {};
  },

  refreshMonitorUntilState_(
    modelId: string,
    untilState: ModelMonitoringLifecycle[] = [ModelMonitoringLifecycle.FAILED, ModelMonitoringLifecycle.COMPLETE],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(modelId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshMonitorUntilStateCanceled[modelId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshMonitorUntilStateCanceled[modelId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeModelMonitor(modelId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.latestMonitorModelVersion) {
          let lifecycle1 = res.result?.latestMonitorModelVersion?.status ?? res.result?.latestMonitorModelVersion?.lifecycle;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshMonitorUntilStateCanceled[modelId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  //
  refreshMonitorVersionsUntilStateCanceled: {},

  refreshDoMonitorVersionsAll_(modelMonitorVersion, trainModelMonitorId: string, projectId?: string) {
    if (!modelMonitorVersion) {
      return;
    }

    if (StoreActions.refreshMonitorVersionsUntilStateIsTraining_(modelMonitorVersion)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshMonitorVersionsUntilState_(
      modelMonitorVersion,
      undefined,
      (currentStatus) => {
        StoreActions.updateMonitorVersionsLifecyle_(modelMonitorVersion, trainModelMonitorId, 0, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshMonitorVersionsUntilStateCancel_(trainModelMonitorId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.listMonitoringModelVersions_(trainModelMonitorId);
          // StoreActions.modelsVersionsByModelId_(trainModelMonitorId);
          if (projectId) {
            StoreActions.listMonitoringModels_(projectId);
          }
        }
      },
    );
  },

  refreshMonitorVersionsUntilStateCancel_(modelMonitorVersion: string) {
    delete this.refreshMonitorVersionsUntilStateCanceled[modelMonitorVersion];
  },

  refreshMonitorVersionsUntilStateIsTraining_(modelMonitorVersion: string) {
    return this.refreshMonitorVersionsUntilStateCanceled[modelMonitorVersion] === true;
  },

  refreshMonitorVersionsUntilStateCancelAll_() {
    this.refreshMonitorVersionsUntilStateCanceled = {};
  },

  refreshMonitorVersionsUntilState_(
    modelMonitorVersion: string,
    untilState: ModelMonitoringLifecycle[] = [ModelMonitoringLifecycle.FAILED, ModelMonitoringLifecycle.COMPLETE],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(modelMonitorVersion)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshMonitorVersionsUntilStateCanceled[modelMonitorVersion] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshMonitorVersionsUntilStateCanceled[modelMonitorVersion] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeModelMonitorVersion(modelMonitorVersion, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result) {
          let lifecycle1 = res.result?.status ?? res.result?.lifecycle;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshMonitorVersionsUntilStateCanceled[modelMonitorVersion] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  //
  refreshEdaUntilStateCanceled: {},

  refreshDoEdaAll_(trainEdaId: string, projectId?: string) {
    if (!trainEdaId) {
      return;
    }

    if (StoreActions.refreshEdaUntilStateIsTraining_(trainEdaId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshEdaUntilState_(
      trainEdaId,
      undefined,
      (currentStatus) => {
        StoreActions.updateEdaLifecyle_(trainEdaId, 0, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshEdaUntilStateCancel_(trainEdaId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.describeEda_(trainEdaId);
          StoreActions.listEdaVersions_(trainEdaId);
          if (projectId) {
            StoreActions.listEda_(projectId);
          }
        }
      },
    );
  },

  refreshEdaUntilStateCancel_(edaId: string) {
    delete this.refreshEdaUntilStateCanceled[edaId];
  },

  refreshEdaUntilStateIsTraining_(edaId: string) {
    return this.refreshEdaUntilStateCanceled[edaId] === true;
  },

  refreshEdaUntilStateCancelAll_() {
    this.refreshEdaUntilStateCanceled = {};
  },

  refreshEdaUntilState_(edaId: string, untilState: EdaLifecycle[] = [EdaLifecycle.FAILED, EdaLifecycle.COMPLETE], cbChange: (currentStatus: string) => void, cbFinish: (isDone: boolean, status: string) => void) {
    if (Utils.isNullOrEmpty(edaId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshEdaUntilStateCanceled[edaId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshEdaUntilStateCanceled[edaId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeEda(edaId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.latestEdaVersion) {
          let lifecycle1 = res.result?.latestEdaVersion?.status ?? res.result?.latestEdaVersion?.lifecycle;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshEdaUntilStateCanceled[edaId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  //
  refreshEdaVersionsUntilStateCanceled: {},

  refreshDoEdaVersionsAll_(edaVersion, trainEdaId: string, projectId?: string) {
    if (!edaVersion) {
      return;
    }

    if (StoreActions.refreshEdaVersionsUntilStateIsTraining_(edaVersion)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshEdaVersionsUntilState_(
      edaVersion,
      undefined,
      (currentStatus) => {
        StoreActions.updateEdaVersionLifecyle_(edaVersion, trainEdaId, 0, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshEdaVersionsUntilStateCancel_(trainEdaId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.describeEda_(trainEdaId);
          StoreActions.listEdaVersions_(trainEdaId);
          if (projectId) {
            StoreActions.listEda_(projectId);
          }
        }
      },
    );
  },

  refreshEdaVersionsUntilStateCancel_(edaVersion: string) {
    delete this.refreshEdaVersionsUntilStateCanceled[edaVersion];
  },

  refreshEdaVersionsUntilStateIsTraining_(edaVersion: string) {
    return this.refreshEdaVersionsUntilStateCanceled[edaVersion] === true;
  },

  refreshEdaVersionsUntilStateCancelAll_() {
    this.refreshEdaVersionsUntilStateCanceled = {};
  },

  refreshEdaVersionsUntilState_(edaVersion: string, untilState: EdaLifecycle[] = [EdaLifecycle.FAILED, EdaLifecycle.COMPLETE], cbChange: (currentStatus: string) => void, cbFinish: (isDone: boolean, status: string) => void) {
    if (Utils.isNullOrEmpty(edaVersion)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshEdaVersionsUntilStateCanceled[edaVersion] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshEdaVersionsUntilStateCanceled[edaVersion] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeEdaVersion(edaVersion, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result) {
          let lifecycle1 = res.result?.status ?? res.result?.lifecycle;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshEdaVersionsUntilStateCanceled[edaVersion] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  //
  refreshBatchUntilStateCanceled: {},

  refreshDoBatchAll_(batchPredictionId: string, projectId?: string) {
    if (!batchPredictionId) {
      return;
    }

    if (StoreActions.refreshBatchUntilStateIsTraining_(batchPredictionId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshBatchUntilState_(
      batchPredictionId,
      undefined,
      (currentStatus) => {
        StoreActions.updateBatchLifecyle_(projectId, batchPredictionId, null, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.resetBPLists_();
        StoreActions.refreshBatchUntilStateCancel_(batchPredictionId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          if (projectId) {
            StoreActions.batchList_(projectId);
          }
        }
      },
    );
  },

  refreshBatchUntilStateCancel_(batchPredictionId: string) {
    delete this.refreshBatchUntilStateCanceled[batchPredictionId];
  },

  refreshBatchUntilStateIsTraining_(batchPredictionId: string) {
    return this.refreshBatchUntilStateCanceled[batchPredictionId] === true;
  },

  refreshBatchUntilStateCancelAll_() {
    this.refreshBatchUntilStateCanceled = {};
  },

  refreshBatchUntilState_(
    batchPredictionId: string,
    untilState: BatchLifecycle[] = [BatchLifecycle.FAILED, BatchLifecycle.CANCELLED, BatchLifecycle.COMPLETE],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(batchPredictionId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshBatchUntilStateCanceled[batchPredictionId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshBatchUntilStateCanceled[batchPredictionId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeBatchPrediction(batchPredictionId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res?.result?.latestBatchPredictionVersion?.status) {
          let lifecycle1 = res?.result?.latestBatchPredictionVersion?.status;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshBatchUntilStateCanceled[batchPredictionId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  resetBPLists_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.BATCH_RESET_ALL_FOR_PROJECTS,
      payload: {},
    });
  },

  updateBatchLifecyle_(projectId: string, batchPredictionId: string, deploymentId?: string, currentStatus?: string) {
    if (!projectId || !batchPredictionId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.BATCH_UPDATE_LIFECYCLE,
      payload: {
        projectId,
        deploymentId,
        batchPredictionId,
        status: currentStatus,
      },
    });
  },

  //
  refreshBatchVersionsUntilStateCanceled: {},

  refreshDoBatchVersionsAll_(batchPredictionId: string, batchPredictionVersionId: string, projectId?: string) {
    if (!batchPredictionVersionId) {
      return;
    }

    if (StoreActions.refreshBatchVersionsUntilStateIsTraining_(batchPredictionVersionId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshBatchVersionsUntilState_(
      batchPredictionVersionId,
      undefined,
      (currentStatus) => {
        StoreActions.updateBatchVersionsLifecyle_(projectId, batchPredictionId, batchPredictionVersionId, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshBatchVersionsUntilStateCancel_(batchPredictionId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          if (projectId) {
            StoreActions.batchList_(projectId);
            StoreActions.batchListVersions_(batchPredictionId);
            StoreActions.batchDescribeById_(batchPredictionId);
            StoreActions.batchVersionDescribeById_(batchPredictionVersionId);
          }
        }
      },
    );
  },

  refreshBatchVersionsUntilStateCancel_(batchPredictionVersionId: string) {
    delete this.refreshBatchVersionsUntilStateCanceled[batchPredictionVersionId];
  },

  refreshBatchVersionsUntilStateIsTraining_(batchPredictionVersionId: string) {
    return this.refreshBatchVersionsUntilStateCanceled[batchPredictionVersionId] === true;
  },

  refreshBatchVersionsUntilStateCancelAll_() {
    this.refreshBatchVersionsUntilStateCanceled = {};
  },

  refreshBatchVersionsUntilState_(
    batchPredictionVersionId: string,
    untilState: BatchPredLifecycle[] = [BatchPredLifecycle.FAILED, BatchPredLifecycle.CANCELLED, BatchPredLifecycle.COMPLETE],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(batchPredictionVersionId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshBatchVersionsUntilStateCanceled[batchPredictionVersionId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshBatchVersionsUntilStateCanceled[batchPredictionVersionId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeBatchPredictionVersion(batchPredictionVersionId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.status) {
          let lifecycle1 = res.result?.status;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshBatchVersionsUntilStateCanceled[batchPredictionVersionId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  updateBatchVersionsLifecyle_(projectId: string, batchPredictionId: string, batchPredictionVersionId: string, currentStatus: string) {
    if (!projectId || !batchPredictionVersionId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.BATCH_VERSION_UPDATE_LIFECYCLE,
      payload: {
        projectId,
        batchPredictionId,
        batchPredictionVersionId,
        status: currentStatus,
      },
    });
  },

  //
  refreshNotebookUntilStateCanceled: {},

  refreshDoNotebookAll_(notebookId: string, cbFinish?) {
    if (!notebookId) {
      return;
    }

    if (StoreActions.refreshNotebookUntilStateIsTraining_(notebookId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshNotebookUntilState_(
      notebookId,
      undefined,
      (notebookInfo) => {
        StoreActions.updateNotebookInfo_(notebookId, notebookInfo);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshNotebookUntilStateCancel_(notebookId);

        cbFinish?.();
        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.describeNotebook_(notebookId);
          REActions.notebookUpdated(notebookId);
        }
      },
    );
  },

  refreshNotebookUntilStateCancel_(notebookId: string) {
    delete this.refreshNotebookUntilStateCanceled[notebookId];
  },

  refreshNotebookUntilStateIsTraining_(notebookId: string) {
    return this.refreshNotebookUntilStateCanceled[notebookId] === true;
  },

  refreshNotebookUntilStateCancelAll_() {
    this.refreshNotebookUntilStateCanceled = {};
  },

  refreshNotebookUntilState_(
    notebookId: string,
    untilState: NotebookLifecycle[] = [NotebookLifecycle.ACTIVE, NotebookLifecycle.STOPPED, NotebookLifecycle.FAILED, NotebookLifecycle.DEPLOYING_FAILED, NotebookLifecycle.INITIALIZING_FAILED, NotebookLifecycle.SAVING_FAILED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(notebookId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshNotebookUntilStateCanceled[notebookId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshNotebookUntilStateCanceled[notebookId] !== true) {
        return;
      }

      ind++;

      REClient_.client_()._describeNotebook(notebookId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.status) {
          let lifecycle1 = res.result?.status;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(res.result);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshNotebookUntilStateCanceled[notebookId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  updateNotebookInfo_(notebookId: string, notebookInfo: any) {
    if (!notebookId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.NOTEBOOK_UPDATE_INFO,
      payload: {
        notebookId,
        result: notebookInfo,
      },
    });
  },

  //
  refreshPredMetricsUntilStateCanceled: {},

  refreshDoPredMetricsAll_(predictionMetricsId: string, featureGroupId?: string, projectId?: string) {
    if (!predictionMetricsId) {
      return;
    }

    if (StoreActions.refreshPredMetricsUntilStateIsTraining_(predictionMetricsId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshPredMetricsUntilState_(
      predictionMetricsId,
      undefined,
      (currentStatus) => {
        StoreActions.updatePredMetricsLifecyle_(predictionMetricsId, featureGroupId, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshPredMetricsUntilStateCancel_(predictionMetricsId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.listPredMetricsForProjectId_(projectId);
          StoreActions._getPredMetricsByFeatureGroupId(featureGroupId);
          StoreActions._describePredMetrics(predictionMetricsId);
          StoreActions._getListVersionsPredMetricsByPredMetricsId(predictionMetricsId);
        }
      },
    );
  },

  refreshPredMetricsUntilStateCancel_(predictionMetricsId: string) {
    delete this.refreshPredMetricsUntilStateCanceled[predictionMetricsId];
  },

  refreshPredMetricsUntilStateIsTraining_(predictionMetricsId: string) {
    return this.refreshPredMetricsUntilStateCanceled[predictionMetricsId] === true;
  },

  refreshPredMetricsUntilStateCancelAll_() {
    this.refreshPredMetricsUntilStateCanceled = {};
  },

  refreshPredMetricsUntilState_(
    predictionMetricsId: string,
    untilState: PredictionMetricsLifecycle[] = [PredictionMetricsLifecycle.COMPLETE, PredictionMetricsLifecycle.FAILED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(predictionMetricsId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshPredMetricsUntilStateCanceled[predictionMetricsId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshPredMetricsUntilStateCanceled[predictionMetricsId] !== true) {
        return;
      }

      ind++;

      REClient_.client_()._describePredictionMetric(predictionMetricsId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result?.latestPredictionMetricVersionDescription?.status) {
          let lifecycle1 = res.result?.latestPredictionMetricVersionDescription?.status;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshPredMetricsUntilStateCanceled[predictionMetricsId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  updatePredMetricsLifecyle_(featureGroupId: string, predictionMetricsId: string, currentStatus: string) {
    if (!featureGroupId || !predictionMetricsId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_UPDATE_LIFECYCLE,
      payload: {
        featureGroupId,
        predictionMetricsId,
        status: currentStatus,
      },
    });
  },

  //
  refreshPredMetricsVersionsUntilStateCanceled: {},

  refreshDoPredMetricsVersionsAll_(predictionMetricsVersion: string, predictionMetricsId: string, featureGroupId?: string, projectId?: string) {
    if (!predictionMetricsVersion) {
      return;
    }

    if (StoreActions.refreshPredMetricsVersionsUntilStateIsTraining_(predictionMetricsVersion)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshPredMetricsVersionsUntilState_(
      predictionMetricsVersion,
      undefined,
      (currentStatus) => {
        StoreActions.updatePredMetricsVersionsLifecyle_(predictionMetricsVersion, predictionMetricsId, featureGroupId, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshPredMetricsVersionsUntilStateCancel_(predictionMetricsVersion);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.listPredMetricsForProjectId_(projectId);
          StoreActions._getPredMetricsByFeatureGroupId(featureGroupId);
          StoreActions._describePredMetrics(predictionMetricsId);
          StoreActions._getListVersionsPredMetricsByPredMetricsId(predictionMetricsId);
          StoreActions._describePredMetricsVersion(predictionMetricsVersion);
        }
      },
    );
  },

  refreshPredMetricsVersionsUntilStateCancel_(predictionMetricsVersion: string) {
    delete this.refreshPredMetricsVersionsUntilStateCanceled[predictionMetricsVersion];
  },

  refreshPredMetricsVersionsUntilStateIsTraining_(predictionMetricsVersion: string) {
    return this.refreshPredMetricsVersionsUntilStateCanceled[predictionMetricsVersion] === true;
  },

  refreshPredMetricsVersionsUntilStateCancelAll_() {
    this.refreshPredMetricsVersionsUntilStateCanceled = {};
  },

  refreshPredMetricsVersionsUntilState_(
    predictionMetricsVersion: string,
    untilState: PredictionMetricsLifecycle[] = [PredictionMetricsLifecycle.COMPLETE, PredictionMetricsLifecycle.FAILED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(predictionMetricsVersion)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshPredMetricsVersionsUntilStateCanceled[predictionMetricsVersion] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshPredMetricsVersionsUntilStateCanceled[predictionMetricsVersion] !== true) {
        return;
      }

      ind++;

      REClient_.client_()._describePredictionMetricVersion(predictionMetricsVersion, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.status) {
          let lifecycle1 = res.result?.status;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshPredMetricsVersionsUntilStateCanceled[predictionMetricsVersion] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  updatePredMetricsVersionsLifecyle_(featureGroupId: string, predictionMetricsId, predictionMetricsVersion: string, currentStatus: string) {
    if (!featureGroupId || !predictionMetricsVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_VERSION_UPDATE_LIFECYCLE,
      payload: {
        featureGroupId,
        predictionMetricsId,
        predictionMetricsVersion,
        status: currentStatus,
      },
    });
  },

  //
  refreshFeatureGroupsExportsUntilStateCanceled: {},

  refreshDoFeatureGroupsExportsAll_(exportId: string, featureGroupId?: string) {
    if (!exportId) {
      return;
    }

    if (StoreActions.refreshFeatureGroupsExportsUntilStateIsTraining_(exportId)) {
      return;
    }

    const lastOrgId = calcAuthUserIsLoggedIn()?.orgId;
    StoreActions.refreshFeatureGroupsExportsUntilState_(
      exportId,
      undefined,
      (currentStatus) => {
        StoreActions.updateFeatureGroupsExportsLifecyle_(exportId, featureGroupId, currentStatus);
      },
      (isDone, lifecycle) => {
        StoreActions.refreshFeatureGroupsExportsUntilStateCancel_(exportId);

        if (isDone && calcAuthUserIsLoggedIn()?.orgId === lastOrgId) {
          StoreActions.featureExportsList_(featureGroupId);
        }
      },
    );
  },

  refreshFeatureGroupsExportsUntilStateCancel_(exportId: string) {
    delete this.refreshFeatureGroupsExportsUntilStateCanceled[exportId];
  },

  refreshFeatureGroupsExportsUntilStateIsTraining_(exportId: string) {
    return this.refreshFeatureGroupsExportsUntilStateCanceled[exportId] === true;
  },

  refreshFeatureGroupsExportsUntilStateCancelAll_() {
    this.refreshFeatureGroupsExportsUntilStateCanceled = {};
  },

  refreshFeatureGroupsExportsUntilState_(
    exportId: string,
    untilState: FeatureGroupExportLifecycle[] = [FeatureGroupExportLifecycle.COMPLETE, FeatureGroupExportLifecycle.FAILED],
    cbChange: (currentStatus: string) => void,
    cbFinish: (isDone: boolean, status: string) => void,
  ) {
    if (Utils.isNullOrEmpty(exportId)) {
      cbFinish && cbFinish(false, null);
      return null;
    }

    this.refreshFeatureGroupsExportsUntilStateCanceled[exportId] = true;
    let ind = 0;
    let timer = null;
    let lastLifecycle = null;

    let doWork = () => {
      if (this.refreshFeatureGroupsExportsUntilStateCanceled[exportId] !== true) {
        return;
      }

      ind++;

      REClient_.client_().describeExport(exportId, (err, res) => {
        if (res && !res.success && res.errorType === 'DataNotFoundError') {
          cbFinish && cbFinish(true, '');
          return;
        }

        if (!err && res && res.result && res.result.status) {
          let lifecycle1 = res.result?.status;
          if (untilState.includes(lifecycle1)) {
            cbFinish && cbFinish(true, lifecycle1);
            return;
          }

          if (lastLifecycle !== lifecycle1) {
            lastLifecycle = lifecycle1;
            cbChange && cbChange(lastLifecycle);
          }
        }

        if (ind > 6 + MAX_MINS_REFRESH || this.refreshFeatureGroupsExportsUntilStateCanceled[exportId] !== true) {
          cbFinish && cbFinish(false, lastLifecycle);
          return;
        }

        timer = setTimeout(
          () => {
            doWork();
          },
          ind < 10 ? 10 * 1000 : 60 * 1000,
        );
      });
    };

    doWork();
  },

  updateFeatureGroupsExportsLifecyle_(exportId: string, featureGroupId: string, currentStatus: string) {
    if (!exportId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_EXPORTS_UPDATE_LIFECYCLE,
      payload: {
        exportId,
        featureGroupId,
        status: currentStatus,
      },
    });
  },

  //
  updateFGOneCodeLifecyle_(featureGroupId, currentStatus) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_CODE_UPDATE_LIFECYCLE,
      payload: {
        featureGroupId,
        status: currentStatus,
      },
    });
  },

  updateFGOneLifecyle_(featureGroupId, currentStatus) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_ONE_UPDATE_LIFECYCLE,
      payload: {
        featureGroupId,
        status: currentStatus,
      },
    });
  },

  updateFGVersionsLifecyle_(featureGroupId, featureGroupVersion, currentStatus) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_VERSIONS_UPDATE_LIFECYCLE,
      payload: {
        featureGroupId,
        featureGroupVersion,
        status: currentStatus,
      },
    });
  },

  updateMonitorVersionsLifecyle_(modelMonitorVersion, modelMonitorId: string, created_at: number, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODEL_MONITOR_VERSION_UPDATE_LIFECYCLE,
      payload: {
        modelMonitorVersion,
        modelMonitorId,
        created_at,
        status: currentStatus,
      },
    });
  },

  updateMonitorLifecyle_(modelMonitorId: string, created_at: number, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODEL_MONITOR_UPDATE_LIFECYCLE,
      payload: {
        modelMonitorId,
        created_at,
        status: currentStatus,
      },
    });
  },

  updateModelLifecyle_(modelId: string, created_at: number, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODEL_UPDATE_LIFECYCLE,
      payload: {
        modelId,
        created_at,
        status: currentStatus,
      },
    });
  },

  setCreateActionState_(projectId: string, state: any) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECT_CREATE_PREDICTIVE_STATE,
      payload: {
        projectId,
        state,
      },
    });
  },

  updateModelVersionLifecyle_(modelVersion: string, modelId: string, projectId: string, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODEL_VERSION_UPDATE_LIFECYCLE,
      payload: {
        modelVersion,
        modelId,
        projectId,
        status: currentStatus,
      },
    });
  },

  updateDeployVersionLifecyle_(deployVersion: string, deployId: string, projectId: string, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEPLOYMENT_VERSION_UPDATE_LIFECYCLE,
      payload: {
        deploymentVersion: deployVersion,
        deployId,
        projectId,
        status: currentStatus,
      },
    });
  },

  updateDeployLifecyle_(deployId: string, projectId: string, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEPLOYMENT_UPDATE_LIFECYCLE,
      payload: {
        deployId,
        projectId,
        status: currentStatus,
      },
    });
  },

  updateDatasetLifecyle_(datasetId: string, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DATASETS_UPDATE_LIFECYCLE,
      payload: {
        datasetId,
        status: currentStatus,
      },
    });
  },

  _describePredMetrics(predictionMetricsId?: string) {
    if (!predictionMetricsId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_DESCRIBE_START,
      payload: {
        predictionMetricsId,
      },
    });

    REClient_.client_()._describePredictionMetric(predictionMetricsId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PRED_METRICS_DESCRIBE_END,
          payload: {
            predictionMetricsId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PRED_METRICS_DESCRIBE_END,
          payload: {
            predictionMetricsId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  _describePredMetricsVersion(predictionMetricsVersion?: string) {
    if (!predictionMetricsVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_VERSION_DESCRIBE_START,
      payload: {
        predictionMetricsVersion,
      },
    });

    REClient_.client_()._describePredictionMetricVersion(predictionMetricsVersion, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PRED_METRICS_VERSION_DESCRIBE_END,
          payload: {
            predictionMetricsVersion,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PRED_METRICS_VERSION_DESCRIBE_END,
          payload: {
            predictionMetricsVersion,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  _getListVersionsPredMetricsByPredMetricsId(predictionMetricsId?: string) {
    if (!predictionMetricsId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_VERSIONS_LIST_START,
      payload: {
        predictionMetricsId,
      },
    });

    REClient_.client_()._listPredictionMetricVersions(predictionMetricsId, 1000, null, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PRED_METRICS_VERSIONS_LIST_END,
          payload: {
            predictionMetricsId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PRED_METRICS_VERSIONS_LIST_END,
          payload: {
            predictionMetricsId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  listPredMetricsForProjectId_(projectId?: string) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_PROJECT_LIST_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_()._listPredictionMetrics(projectId, null, 1000, null, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PRED_METRICS_PROJECT_LIST_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PRED_METRICS_PROJECT_LIST_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  _getPredMetricsByFeatureGroupId(featureGroupId?: string) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_LIST_START,
      payload: {
        featureGroupId,
      },
    });

    REClient_.client_()._listPredictionMetrics(null, featureGroupId, 1000, null, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PRED_METRICS_LIST_END,
          payload: {
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PRED_METRICS_LIST_END,
          payload: {
            featureGroupId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  devCenterModelDetail_(modelId?: string) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEVCENTER_MODEL_DETAIL_RETRIEVE_START,
      payload: {
        modelId,
      },
    });

    REClient_.client_()._getSharedModel(modelId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEVCENTER_MODEL_DETAIL_RETRIEVE_END,
          payload: {
            modelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEVCENTER_MODEL_DETAIL_RETRIEVE_END,
          payload: {
            modelId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  devCenterModelGraphs_(modelId?: string) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEVCENTER_MODEL_GRAPHS_RETRIEVE_START,
      payload: {
        modelId,
      },
    });

    REClient_.client_()._getSharedModelGraphs(modelId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEVCENTER_MODEL_GRAPHS_RETRIEVE_END,
          payload: {
            modelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEVCENTER_MODEL_GRAPHS_RETRIEVE_END,
          payload: {
            modelId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  devCenterModelMetrics_(modelId?: string) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEVCENTER_MODEL_METRICS_RETRIEVE_START,
      payload: {
        modelId,
      },
    });

    REClient_.client_()._getSharedModelDatasetMetrics(modelId, 3, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEVCENTER_MODEL_METRICS_RETRIEVE_END,
          payload: {
            modelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEVCENTER_MODEL_METRICS_RETRIEVE_END,
          payload: {
            modelId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  devCenterModelComments_(modelId?: string) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEVCENTER_MODEL_COMMENTS_RETRIEVE_START,
      payload: {
        modelId,
      },
    });

    REClient_.client_()._listModelComments(modelId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEVCENTER_MODEL_COMMENTS_RETRIEVE_END,
          payload: {
            modelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEVCENTER_MODEL_COMMENTS_RETRIEVE_END,
          payload: {
            modelId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  devCenterUserByUserHandle_(userHandle?: string) {
    if (!userHandle) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEVCENTER_USER_RETRIEVE_START,
      payload: {
        userHandle,
      },
    });

    REClient_.client_()._getPublicUser(userHandle, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEVCENTER_USER_RETRIEVE_END,
          payload: {
            userHandle,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEVCENTER_USER_RETRIEVE_END,
          payload: {
            userHandle,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  devCenterListingResetAll_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEVCENTER_LISTING_RESET_ALL,
      payload: {},
    });
  },

  devCenterUpVote_(modelId?: string, diff?: number) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEVCENTER_UPVOTE_CHANGE,
      payload: {
        modelId,
        diff,
      },
    });
  },

  devCenterListing_(pageSize = null, removeLastSeenModelId = null, lastSeenModelId = null, userHandle: string = null, useCase: string = null, sortBy: string = null, isVotes = false) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEVCENTER_LISTING_RETRIEVE_START,
      payload: {
        pageSize,
        removeLastSeenModelId,
        lastSeenModelId,
        userHandle,
        useCase,
        sortBy,
        isVotes,
      },
    });

    REClient_.client_()._listSharedModels(pageSize, lastSeenModelId, userHandle, useCase, sortBy, isVotes, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEVCENTER_LISTING_RETRIEVE_END,
          payload: {
            pageSize,
            lastSeenModelId,
            removeLastSeenModelId,
            userHandle,
            useCase,
            sortBy,
            isVotes,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEVCENTER_LISTING_RETRIEVE_END,
          payload: {
            pageSize,
            removeLastSeenModelId,
            lastSeenModelId,
            userHandle,
            useCase,
            sortBy,
            isVotes,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  _getRequestBPById(batchPredictionVersion, requestBPId?) {
    if (batchPredictionVersion == null || requestBPId == null) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.LIST_REQUESTS_BP_START,
      payload: {
        batchPredictionVersion,
        requestBPId,
      },
    });

    REClient_.client_()._getBatchPredictionRow(batchPredictionVersion, requestBPId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.LIST_REQUESTS_BP_END,
          payload: {
            batchPredictionVersion,
            requestBPId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.LIST_REQUESTS_BP_END,
          payload: {
            batchPredictionVersion,
            requestBPId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  describeWebhook_(webhookId: string) {
    if (!webhookId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.WEBHOOK_DETAIL_BEGIN,
      payload: {
        webhookId,
      },
    });

    REClient_.client_().describeWebhook(webhookId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.WEBHOOK_DETAIL_END,
          payload: {
            webhookId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.WEBHOOK_DETAIL_END,
          payload: {
            webhookId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  describePythonFunction_(name: string, cbFinish: (list) => void = null) {
    if (!name) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PYTHON_FUNCTIONS_DETAIL_BEGIN,
      payload: {
        name,
      },
    });

    REClient_.client_().describePythonFunction(name, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PYTHON_FUNCTIONS_DETAIL_END,
          payload: {
            name,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PYTHON_FUNCTIONS_DETAIL_END,
          payload: {
            name,
            error: err || Constants.errorDefault,
          },
        });
      }
      cbFinish?.(err ? null : res?.result);
    });
  },

  describePythonFunctionTillCodeCheckComplete_(name: string) {
    if (!name) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PYTHON_FUNCTIONS_DETAIL_BEGIN,
      payload: {
        name,
      },
    });

    poll();

    function poll() {
      REClient_.client_().describePythonFunction(name, (err, res) => {
        if (!err && res?.success) {
          dispatch({
            type: StoreActions.PYTHON_FUNCTIONS_DETAIL_END,
            payload: {
              name,
              result: res.result,
            },
          });
          if (res?.result?.codeSource?.status !== 'COMPLETE') {
            setTimeout(() => {
              poll();
            }, 2000);
          }
        } else {
          dispatch({
            type: StoreActions.PYTHON_FUNCTIONS_DETAIL_END,
            payload: {
              name,
              error: err || Constants.errorDefault,
            },
          });
        }
      });
    }
  },

  describePipeline(pipelineId: string, cbFinish: (pipeline: any) => void = null) {
    if (!pipelineId) return;

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PIPELINE_DETAIL_BEGIN,
      payload: {
        pipelineId,
      },
    });

    REClient_.client_().describePipeline(pipelineId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PIPELINE_DETAIL_END,
          payload: {
            pipelineId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PIPELINE_DETAIL_END,
          payload: {
            pipelineId,
            error: err || Constants.errorDefault,
          },
        });
      }
      cbFinish?.(err ? null : res?.result);
    });
  },

  listPipelineVersions(pipelineId: string, cbFinish: (pipelineVersions: any) => void = null) {
    if (!pipelineId) return;

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PIPELINE_VERSION_BEGIN,
      payload: {
        pipelineId,
      },
    });

    REClient_.client_().listPipelineVersions(pipelineId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PIPELINE_VERSION_END,
          payload: {
            pipelineId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PIPELINE_VERSION_END,
          payload: {
            pipelineId,
            error: err || Constants.errorDefault,
          },
        });
      }
      cbFinish?.(err ? null : res?.result);
    });
  },

  describeCustomLossFunction_(name: string) {
    if (!name) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.CUSTOM_LOSS_FUNCTION_DETAIL_BEGIN,
      payload: {
        name,
      },
    });

    REClient_.client_().describeCustomLossFunction(name, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.CUSTOM_LOSS_FUNCTION_DETAIL_END,
          payload: {
            name,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.CUSTOM_LOSS_FUNCTION_DETAIL_END,
          payload: {
            name,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  describeCustomMetric_(name: string) {
    if (!name) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.CUSTOM_METRIC_DETAIL_BEGIN,
      payload: {
        name,
      },
    });

    REClient_.client_().describeCustomMetric(name, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.CUSTOM_METRIC_DETAIL_END,
          payload: {
            name,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.CUSTOM_METRIC_DETAIL_END,
          payload: {
            name,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  describeModule_(name: string) {
    if (!name) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODULE_DETAIL_BEGIN,
      payload: {
        name,
      },
    });

    REClient_.client_().describeModule(name, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.MODULE_DETAIL_END,
          payload: {
            name,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MODULE_DETAIL_END,
          payload: {
            name,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  listWebhooks_(id: IWebhookId) {
    if (!id || !calcWebhookIdToString(id)) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.WEBHOOK_LIST_BEGIN,
      payload: {
        id,
      },
    });

    const cb1 = (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.WEBHOOK_LIST_END,
          payload: {
            id,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.WEBHOOK_LIST_END,
          payload: {
            id,
            error: err || Constants.errorDefault,
          },
        });
      }
    };

    if (id?.deploymentId != null) {
      REClient_.client_().listDeploymentWebhooks(id.deploymentId, cb1);
    } else {
      cb1(Constants.errorDefault, null);
    }
  },

  listPythonFunctions_(functionType?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PYTHON_FUNCTIONS_LIST_BEGIN,
      payload: {
        functionType,
      },
    });

    const cb1 = (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PYTHON_FUNCTIONS_LIST_END,
          payload: {
            functionType,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PYTHON_FUNCTIONS_LIST_END,
          payload: {
            functionType,
            error: err || Constants.errorDefault,
          },
        });
      }
    };

    REClient_.client_().listPythonFunctions(functionType, cb1);
  },

  listPipelines(projectId?: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PIPELINE_LIST_BEGIN,
      payload: {
        projectId,
      },
    });

    const cb1 = (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PIPELINE_LIST_END,
          payload: {
            result: res.result,
            projectId,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PIPELINE_LIST_END,
          payload: {
            error: err || Constants.errorDefault,
            projectId,
          },
        });
      }
    };

    REClient_.client_().listPipelines(projectId, cb1);
  },

  featureGroupsGetByPythonFunctionName_(nameUse: string, cbFinish: (list) => void = null) {
    if (!nameUse) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_START,
      payload: {
        nameUse,
      },
    });

    REClient_.client_().listPythonFunctionFeatureGroups(nameUse, 9000, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_END,
          payload: {
            nameUse,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_PYTHON_FUNCTIONS_LIST_END,
          payload: {
            nameUse,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  listAvailableLossTypes_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.AVAILABLE_LOSS_TYPES_BEGIN,
      payload: {},
    });

    REClient_.client_()._listAvailableLossTypes((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.AVAILABLE_LOSS_TYPES_END,
          payload: {
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.AVAILABLE_LOSS_TYPES_END,
          payload: {},
        });
      }
    });
  },

  listCustomLossFunctions_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.CUSTOM_LOSS_FUNCTIONS_LIST_BEGIN,
      payload: {},
    });

    const cb1 = (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.CUSTOM_LOSS_FUNCTIONS_LIST_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.CUSTOM_LOSS_FUNCTIONS_LIST_END,
          payload: {
            error: err || Constants.errorDefault,
          },
        });
      }
    };

    REClient_.client_().listCustomLossFunctions(cb1);
  },

  listSupportedCustomMetricProblemTypes_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_BEGIN,
      payload: {},
    });

    REClient_.client_()._listSupportedCustomMetricProblemTypes((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_END,
          payload: {
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.SUPPORTED_CUSTOM_METRIC_PROBLEM_TYPES_END,
          payload: {},
        });
      }
    });
  },

  listCustomMetrics_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.CUSTOM_METRICS_LIST_BEGIN,
      payload: {},
    });

    const cb1 = (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.CUSTOM_METRICS_LIST_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.CUSTOM_METRICS_LIST_END,
          payload: {
            error: err || Constants.errorDefault,
          },
        });
      }
    };

    REClient_.client_().listCustomMetrics(cb1);
  },

  listModules_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODULES_LIST_BEGIN,
      payload: {},
    });

    const cb1 = (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.MODULES_LIST_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MODULES_LIST_END,
          payload: {
            error: err || Constants.errorDefault,
          },
        });
      }
    };

    REClient_.client_().listModules(cb1);
  },

  _getRequestById(deployId, requestId?) {
    if (!deployId || !requestId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.LIST_REQUESTS_START,
      payload: {
        deployId,
        requestId,
      },
    });

    REClient_.client_()._getPredictionRequestLogs(deployId, requestId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.LIST_REQUESTS_END,
          payload: {
            deployId,
            requestId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.LIST_REQUESTS_END,
          payload: {
            deployId,
            requestId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  alertsList_(readOnly: boolean = false, since: number = null) {
    if (!Constants.flags.show_alerts) {
      return;
    }
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.ALERTS_REFRESH_START,
      payload: {
        readOnly,
        since,
      },
    });

    REClient_.client_().getUserAlerts(readOnly, since, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.ALERTS_REFRESH_END,
          payload: {
            readOnly,
            since,
            list: res.result /* [
              {
                alertId: '1',
                seen: false,
                title: 'Drift Message 1',
                description: 'aklsjdklasjdklja adjaksjdkl jalksjdskaldjakjdkas',
                createdAt: '2021-12-15T12:14:22Z',
              },
              {
                alertId: '2',
                seen: true,
                title: 'Alert Emergency 2',
                description: 'aklsjdklasjdklja adjaksjdkl jalksjdskaldjakjdkas',
                createdAt: '2021-12-15T12:14:22Z',
              },
            ] as IAlertOne[]*/,
          },
        });
      } else {
        dispatch({
          type: StoreActions.ALERTS_REFRESH_END,
          payload: {
            readOnly,
            since,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  listAllDatasets(isStarred?: boolean) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.ALL_DATASETS_START,
      payload: {
        isStarred,
      },
    });

    REClient_.client_().listDatasets(500, null, isStarred === true ? true : null, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.ALL_DATASETS_END,
          payload: {
            result: res.result,
            isStarred,
          },
        });
      } else {
        dispatch({
          type: StoreActions.ALL_DATASETS_END,
          payload: {
            error: err || Constants.errorDefault,
            isStarred,
          },
        });
      }
    });
  },

  getMetricsVersions_(detailModelId?: string) {
    if (!detailModelId) {
      return;
    }
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.METRICS_VERSIONS_START,
      payload: {
        detailModelId,
      },
    });

    REClient_.client_()._getMetricsDataByModel(detailModelId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.METRICS_VERSIONS_END,
          payload: {
            detailModelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.METRICS_VERSIONS_END,
          payload: {
            detailModelId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  resetMetricsVersions_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.RESET_METRICS_VERSIONS,
      payload: {},
    });
  },

  getMetricsVersionOne_(modelVersion?: string, algorithm?: string, validation: boolean = null, additionalMetricsKeys: string[] = null, nRows = null, sortByClass = null, dataClusterType = null, sortPreference = '') {
    if (!modelVersion) {
      return;
    }
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.METRICS_VERSIONONE_START,
      payload: {
        modelVersion,
        algorithm,
        validation,
        additionalMetricsKeys,
        nRows,
        sortByClass,
        dataClusterType,
        sortPreference,
      },
    });

    const cb1 = (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.METRICS_VERSIONONE_END,
          payload: {
            modelVersion,
            algorithm,
            validation,
            additionalMetricsKeys,
            nRows,
            sortByClass,
            dataClusterType,
            sortPreference,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.METRICS_VERSIONONE_END,
          payload: {
            modelVersion,
            algorithm,
            validation,
            additionalMetricsKeys,
            nRows,
            sortByClass,
            dataClusterType,
            sortPreference,
            error: err || Constants.errorDefault,
          },
        });
      }
    };

    if (additionalMetricsKeys != null) {
      if (additionalMetricsKeys.length === 0) {
        dispatch({
          type: StoreActions.METRICS_VERSIONONE_END,
          payload: {
            modelVersion,
            algorithm,
            validation,
            additionalMetricsKeys,
            nRows,
            sortByClass,
            dataClusterType,
            sortPreference,
            error: Constants.errorDefault,
          },
        });
      } else {
        let pp = [];
        additionalMetricsKeys.some((k1) => {
          pp.push(
            new Promise((resolve) => {
              REClient_.client_()._getAdditionalMetricsDataByModelVersion(modelVersion, k1, algorithm, validation, dataClusterType, (err, res) => {
                resolve({ key: k1, result: res?.result?.metrics == null && res?.result?.otherMetrics == null ? null : res?.result ?? null });
              });
            }),
          );
        });

        Promise.all(pp).then((res) => {
          let resDict: any = {};
          res?.some((r1) => {
            if (r1?.result == null) {
              return;
            }
            resDict[r1.key] = r1.result;
          });

          if (_.isEmpty(resDict)) {
            dispatch({
              type: StoreActions.METRICS_VERSIONONE_END,
              payload: {
                modelVersion,
                algorithm,
                validation,
                additionalMetricsKeys,
                nRows,
                sortByClass,
                dataClusterType,
                sortPreference,
                error: Constants.errorDefault,
              },
            });
          } else {
            dispatch({
              type: StoreActions.METRICS_VERSIONONE_END,
              payload: {
                modelVersion,
                algorithm,
                validation,
                additionalMetricsKeys,
                nRows,
                sortByClass,
                dataClusterType,
                sortPreference,
                result: resDict,
              },
            });
          }
        });
      }
    } else {
      REClient_.client_()._getMetricsDataByModelVersion(modelVersion, algorithm, validation, nRows, sortByClass, dataClusterType, cb1);
    }
  },

  resetModelVersionsMetrics_() {
    let dispatch = this.calcGlobalDispatch();
    dispatch({
      type: StoreActions.METRICS_VERSIONONE_RESET,
      payload: {},
    });
  },

  getStreamTokens_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.STREAM_TOKENS_START,
      payload: {},
    });

    REClient_.client_().listStreamingTokens((err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.STREAM_TOKENS_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.STREAM_TOKENS_END,
          payload: {
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  getDocsSampleCode_(methodName?: boolean) {
    if (!methodName) {
      return;
    }
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DOCS_METHOD_SAMPLE_CODE_START,
      payload: {
        methodName,
      },
    });

    REClient_.client_()._getSampleApiCode(methodName, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DOCS_METHOD_SAMPLE_CODE_END,
          payload: {
            methodName,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DOCS_METHOD_SAMPLE_CODE_END,
          payload: {
            methodName,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  getSampleDeployCodeByDeployId_(deploymentId: string) {
    if (!deploymentId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEPLOY_SAMPLE_CODE_START,
      payload: {
        deploymentId,
      },
    });

    REClient_.client_()._getSampleCode(deploymentId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEPLOY_SAMPLE_CODE_END,
          payload: {
            deploymentId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEPLOY_SAMPLE_CODE_END,
          payload: {
            deploymentId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  batchList_(projectId: string, deploymentId?: string, cbFinish?) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.BATCH_LIST_START,
      payload: {
        projectId,
        deploymentId,
      },
    });

    REClient_.client_().listBatchPredictions(projectId, deploymentId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.BATCH_LIST_END,
          payload: {
            projectId,
            deploymentId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.BATCH_LIST_END,
          payload: {
            projectId,
            deploymentId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.();
    });
  },

  batchListVersions_(batchPredId: string) {
    if (!batchPredId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.BATCH_LIST_VERSIONS_START,
      payload: {
        batchPredId,
      },
    });

    REClient_.client_().listBatchPredictionVersions(batchPredId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.BATCH_LIST_VERSIONS_END,
          payload: {
            batchPredId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.BATCH_LIST_VERSIONS_END,
          payload: {
            batchPredId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  getModelSchema_(modelId: string) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODELS_SCHEMA_BEGIN,
      payload: {
        modelId,
      },
    });

    REClient_.client_()._getModelSchemaOverrides(modelId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.MODELS_SCHEMA_END,
          payload: {
            modelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MODELS_SCHEMA_END,
          payload: {
            modelId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  batchDescribeById_(batchPredId: string) {
    if (!batchPredId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.BATCH_DESCRIBE_START,
      payload: {
        batchPredId,
      },
    });

    REClient_.client_().describeBatchPrediction(batchPredId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.BATCH_DESCRIBE_END,
          payload: {
            batchPredId,
            result: res.result,
          },
        });
      } else {
        if (err) {
          if (res?.errorType?.toLowerCase() === 'DataNotFoundError'.toLowerCase()) {
            err = null;
          } else {
            err = err || Constants.errorDefault;
          }
        }

        dispatch({
          type: StoreActions.BATCH_DESCRIBE_END,
          payload: {
            batchPredId,
            error: err,
          },
        });
      }
    });
  },

  batchVersionDescribeById_(batchPredVersionId: string) {
    if (!batchPredVersionId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.BATCH_DESCRIBE_VERSION_START,
      payload: {
        batchPredVersionId,
      },
    });

    REClient_.client_().describeBatchPredictionVersion(batchPredVersionId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.BATCH_DESCRIBE_VERSION_END,
          payload: {
            batchPredVersionId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.BATCH_DESCRIBE_VERSION_END,
          payload: {
            batchPredVersionId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  _featureGroupsGetByProjectPublic_(projectId: string, cbFinish: (list) => void = null) {
    // if(!projectId) {
    //   return;
    // }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_PROJECT_LIST_START_PUBLIC,
      payload: {
        projectId,
      },
    });
    if (projectId) {
      REClient_.client_().listFeatureGroups(500, null, projectId, null, (err, res) => {
        if (!err && res?.success) {
          dispatch({
            type: StoreActions.FEATUREGROUPS_PROJECT_LIST_END_PUBLIC,
            payload: {
              projectId,
              result: res.result,
            },
          });
        } else {
          dispatch({
            type: StoreActions.FEATUREGROUPS_PROJECT_LIST_END_PUBLIC,
            payload: {
              projectId,
              error: err || Constants.errorDefault,
            },
          });
        }

        cbFinish?.(err ? null : res?.result);
      });
    } else {
      REClient_.client_()._listFeatureGroupsDashboard(null, 500, null, null, null, (err, res) => {
        if (!err && res?.success) {
          dispatch({
            type: StoreActions.FEATUREGROUPS_PROJECT_LIST_END_PUBLIC,
            payload: {
              projectId,
              result: res.result,
            },
          });
        } else {
          dispatch({
            type: StoreActions.FEATUREGROUPS_PROJECT_LIST_END_PUBLIC,
            payload: {
              projectId,
              error: err || Constants.errorDefault,
            },
          });
        }

        cbFinish?.(err ? null : res?.result);
      });
    }
  },

  _featureGroupsGetByProject_(projectId: string, cbFinish: (list) => void = null) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_PROJECT_LIST_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_()._listFeatureGroups(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_PROJECT_LIST_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_PROJECT_LIST_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  featureGroupsGetByTemplateId_(featureGroupTemplateId: string, cbFinish: (list) => void = null) {
    if (!featureGroupTemplateId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_TEMPLATE_LIST_START,
      payload: {
        featureGroupTemplateId,
      },
    });

    REClient_.client_().listFeatureGroups(9000, null, null, featureGroupTemplateId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_TEMPLATE_LIST_END,
          payload: {
            featureGroupTemplateId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_TEMPLATE_LIST_END,
          payload: {
            featureGroupTemplateId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  featureGroupsGetByProject_(projectId: string, cbFinish: (list) => void = null) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_PROJECT_LIST_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_()._listProjectFeatureGroups(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_PROJECT_LIST_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_PROJECT_LIST_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  featureGroupLineageByProject_(projectId: string, cbFinish: (list) => void = null) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUP_LINEAGE_PROJECT_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_()._getProjectFeatureGroupLineage(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUP_LINEAGE_PROJECT_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUP_LINEAGE_PROJECT_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  _featureExportsList_(featureGroupId: string, cbFinish: (list) => void = null) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_EXPORTS_LIST_START,
      payload: {
        featureGroupId,
      },
    });

    REClient_.client_()._listFeatureGroupExports(featureGroupId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_EXPORTS_LIST_END,
          payload: {
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_EXPORTS_LIST_END,
          payload: {
            featureGroupId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  featureGroupsVersionsList_(featureGroupId: string, cbFinish: (list) => void = null) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_VERSIONS_LIST_START,
      payload: {
        featureGroupId,
      },
    });

    REClient_.client_().listFeatureGroupVersions(featureGroupId, 200, null, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_VERSIONS_LIST_END,
          payload: {
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_VERSIONS_LIST_END,
          payload: {
            featureGroupId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  featureGroupSamplingConfigOptions_(featureGroupId: string, cbFinish: (list) => void = null) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_START,
      payload: {
        featureGroupId,
      },
    });

    REClient_.client_()._getFeatureGroupSamplingConfigOptions(featureGroupId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_END,
          payload: {
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUP_SAMPLING_CONFIG_OPTIONS_END,
          payload: {
            featureGroupId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  featureRefreshPolicieList(featureGroupId: string, cbFinish: (list) => void = null) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_REFRESH_LIST_START,
      payload: {
        featureGroupId,
      },
    });

    REClient_.client_().listRefreshPolicies(null, null, featureGroupId, null, null, null, null, null, null, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_REFRESH_LIST_END,
          payload: {
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_REFRESH_LIST_END,
          payload: {
            featureGroupId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  featureExportsList_(featureGroupId: string, cbFinish: (list) => void = null) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_EXPORTS_LIST_START,
      payload: {
        featureGroupId,
      },
    });

    REClient_.client_().listFeatureGroupExports(featureGroupId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_EXPORTS_LIST_END,
          payload: {
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_EXPORTS_LIST_END,
          payload: {
            featureGroupId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.(err ? null : res?.result);
    });
  },

  featureGroupsDescribeNoProject_(featureGroupId: string) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_DESCRIBE_START,
      payload: {
        projectId: null,
        featureGroupId,
      },
    });

    REClient_.client_().describeFeatureGroup(featureGroupId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_DESCRIBE_END,
          payload: {
            projectId: null,
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_DESCRIBE_END,
          payload: {
            projectId: null,
            featureGroupId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  featureGroupsCharts_(projectId: string, featureGroupVersion: string) {
    if (!featureGroupVersion || !projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_CHARTS_START,
      payload: {
        projectId,
        featureGroupVersion,
      },
    });

    REClient_.client_()._getFeatureGroupExplorerCharts(featureGroupVersion, projectId, 20, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_CHARTS_END,
          payload: {
            projectId,
            featureGroupVersion,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_CHARTS_END,
          payload: {
            projectId,
            featureGroupVersion,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  featureGroupsDescribeReset_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_DESCRIBE_RESET,
      payload: {},
    });
  },

  featureGroupsDescribe_(projectId: string, featureGroupId: string, cbFinish?) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_DESCRIBE_START,
      payload: {
        projectId,
        featureGroupId,
      },
    });

    const cb1 = (err, res) => {
      if (!err && res?.success) {
        cbFinish?.(res?.result);
        dispatch({
          type: StoreActions.FEATUREGROUPS_DESCRIBE_END,
          payload: {
            projectId,
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        cbFinish?.(null);

        if (err) {
          if (res?.errorType?.toLowerCase() === 'DataNotFoundError'.toLowerCase()) {
            err = null;
          } else {
            err = err || Constants.errorDefault;
          }
        }

        dispatch({
          type: StoreActions.FEATUREGROUPS_DESCRIBE_END,
          payload: {
            projectId,
            featureGroupId,
            error: err,
          },
        });
      }
    };

    if (projectId == null) {
      REClient_.client_().describeFeatureGroup(featureGroupId, cb1);
    } else {
      REClient_.client_()._describeProjectFeatureGroup(projectId, featureGroupId, cb1);
    }
  },

  async featureGroupsDescribeList(featureGroupIds: string[]) {
    if (!featureGroupIds.length) {
      return Promise.resolve();
    }
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_DESCRIBE_LIST_START,
      payload: {
        featureGroupIds,
      },
    });

    try {
      const response = await REClient_.promises_()._describeFeatureGroupList(featureGroupIds);
      if (response?.error || !response?.success) {
        throw new Error(response.error);
      }
      dispatch({
        type: StoreActions.FEATUREGROUPS_DESCRIBE_LIST_END,
        payload: {
          projectId: null,
          featureGroupIds,
          result: response.result,
        },
      });
    } catch (error) {
      dispatch({
        type: StoreActions.FEATUREGROUPS_DESCRIBE_LIST_END,
        payload: {
          projectId: null,
          featureGroupIds,
          error: error || Constants.errorDefault,
        },
      });
    }
  },

  deployList_(projectId: string, cbFinish?) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEPLOY_PROJECT_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_().deployListForProject(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEPLOY_PROJECT_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        if (err) {
          if (res?.errorType?.toLowerCase() === 'DataNotFoundError'.toLowerCase()) {
            err = null;
          } else {
            err = err || Constants.errorDefault;
          }
        }

        dispatch({
          type: StoreActions.DEPLOY_PROJECT_END,
          payload: {
            projectId,
            error: err,
          },
        });
      }
      cbFinish?.(res?.result);
    });
  },

  solutionsList_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SOLUTIONS_LIST_START,
      payload: {},
    });

    REClient_.client_()._listSolutionsAndUseCases(true, null, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.SOLUTIONS_LIST_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.SOLUTIONS_LIST_END,
          payload: {
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  listProblemTypes_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.USE_CASES_LIST_PROBLEMTYPES_START,
      payload: {},
    });

    REClient_.client_()._listProblemTypes((err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.USE_CASES_LIST_PROBLEMTYPES_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.USE_CASES_LIST_PROBLEMTYPES_END,
          payload: {
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  useCaseList_(useCase: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.USE_CASES_FOR_SOLUTION_START,
      payload: {
        useCase,
      },
    });

    REClient_.client_()._listSolutionsAndUseCases(false, useCase, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.USE_CASES_FOR_SOLUTION_END,
          payload: {
            useCase,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.USE_CASES_FOR_SOLUTION_END,
          payload: {
            useCase,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  deployTokensList_(projectId: string) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEPLOY_TOKENS_PROJECT_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_().listDeploymentTokens(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEPLOY_TOKENS_PROJECT_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEPLOY_TOKENS_PROJECT_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  getProjectDatasets_(projectId: string, cbFinish?: (res, ids) => void) {
    if (Utils.isNullOrEmpty(projectId)) {
      cbFinish?.(null, null);
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECT_DATASET_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_().listProjectDatasets(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PROJECT_DATASET_END,
          payload: {
            projectId,
            result: res?.result,
          },
        });

        cbFinish?.(
          res?.result,
          res?.result?.map((r1) => {
            return r1?.dataset?.datasetId;
          }),
        );
      } else {
        dispatch({
          type: StoreActions.PROJECT_DATASET_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });
        cbFinish?.(null, null);
      }
    });
  },

  getSamplesProject_(projectId: string) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SAMPLE_PROJECT_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_()._getExampleDatasets(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.SAMPLE_PROJECT_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.SAMPLE_PROJECT_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  resetAllMetrics() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.RESET_ALL_METRICS,
      payload: {},
    });

    REActions.resetAllMetrics();
  },

  listModels_(projectId: string, cbFinish?: (models?: any[]) => void) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODELS_LIST_BEGIN,
      payload: {
        projectId,
      },
    });

    REClient_.client_().listModels(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.MODELS_LIST_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
        cbFinish?.(res?.result);
      } else {
        dispatch({
          type: StoreActions.MODELS_LIST_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });

        cbFinish?.(null);
      }
    });
  },

  augmModelById_(modelId: string, variationId: any) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODELS_AUGM_BEGIN,
      payload: {
        modelId,
        variationId,
      },
    });

    REClient_.client_()._getDataAugmentationComparison(modelId, variationId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.MODELS_AUGM_END,
          payload: {
            modelId,
            variationId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MODELS_AUGM_END,
          payload: {
            modelId,
            variationId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  modelsVersionsByModelId_(modelId: string, cbFinish?: () => void) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODELS_VERSIONS_BEGIN,
      payload: {
        modelId,
      },
    });

    REClient_.client_().listModelVersions(modelId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.MODELS_VERSIONS_END,
          payload: {
            modelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MODELS_VERSIONS_END,
          payload: {
            modelId,
            error: err || Constants.errorDefault,
          },
        });
      }

      cbFinish?.();
    });
  },

  getModelDetail_(modelId: string) {
    if (!modelId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MODELS_ONE_BEGIN,
      payload: {
        modelId,
      },
    });

    REClient_.client_().describeModel(modelId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.MODELS_ONE_END,
          payload: {
            modelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MODELS_ONE_END,
          payload: {
            modelId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  listTrainingOptions_(projectId: string, featureGroupIds?: string[], forRetrain?, currentTrainingConfig?: any, algorithmModelConfigs?: any, isFirstTime = false, isAdditionalModel = false) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();
    currentTrainingConfig = currentTrainingConfig || null;

    dispatch({
      type: StoreActions.TRAINING_OPTIONS_START,
      payload: {
        projectId,
        featureGroupIds,
        forRetrain,
        currentTrainingConfig,
        isFirstTime,
        isAdditionalModel,
        algorithmModelConfigs,
      },
    });

    REClient_.client_().getTrainingConfigOptions(projectId, featureGroupIds, forRetrain, currentTrainingConfig, isAdditionalModel, (err, res) => {
      if (!err && res?.success) {
        let r1 = res?.result;
        if (isFirstTime && r1 != null) {
          r1.isUsingCurrentTrainingOptions = true;
        } else {
          r1.isUsingCurrentTrainingOptions = false;
        }

        dispatch({
          type: StoreActions.TRAINING_OPTIONS_END,
          payload: {
            projectId,
            featureGroupIds,
            forRetrain,
            currentTrainingConfig,
            isFirstTime,
            result: r1,
            algorithmModelConfigs,
          },
        });
      } else {
        dispatch({
          type: StoreActions.TRAINING_OPTIONS_END,
          payload: {
            projectId,
            featureGroupIds,
            forRetrain,
            currentTrainingConfig,
            isFirstTime,
            isError: true,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  getDefaultModelName_(projectId: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEFAULT_MODEL_NAME_START,
      payload: {
        projectId,
      },
    });
    REClient_.client_().getDefaultModelName(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEFAULT_MODEL_NAME_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEFAULT_MODEL_NAME_END,
          payload: {
            projectId,
            isError: true,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  getDefaultDeploymentName_(modelId: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEFAULT_DEPLOYMENT_NAME_START,
      payload: {
        modelId,
      },
    });
    REClient_.client_().getDefaultDeploymentName(modelId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEFAULT_DEPLOYMENT_NAME_END,
          payload: {
            modelId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEFAULT_DEPLOYMENT_NAME_END,
          payload: {
            modelId,
            isError: true,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  getDatasetById_(datasetId: string, cbFinish?: () => void) {
    if (Utils.isNullOrEmpty(datasetId)) {
      cbFinish?.();
      return;
    }

    StoreActions.listDatasets_([datasetId], cbFinish);
  },

  listDatasets_(datasetIds: string[], cbFinish?: () => void) {
    if (!datasetIds || !_.isArray(datasetIds) || datasetIds.length === 0) {
      cbFinish?.();
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DATASETS_LIST_BEGIN,
      payload: {},
    });

    //'{ getAllDatasets { refreshSchedules, dataSource, createdAt, name, datasetId, dataSource, sourceType, versionCount, lastVersion { hasMetrics, location, createdAt, datasetVersion, updatedAt, size, tag, status, lifecycleMsg, schemaValues, errors, allProjectDatasets { datasetType, status, project {  projectId } } } } }'
    const promisesDatasets = datasetIds.map((id1) => {
      return new Promise((resolve, reject) => {
        REClient_.client_()._describeDataset(id1, (err, res) => {
          if (err || !res?.success) {
            if (err) {
              if (res?.errorType?.toLowerCase() === 'DataNotFoundError'.toLowerCase()) {
                err = null;
              } else {
                err = err || Constants.errorDefault;
              }
            }
            resolve([id1, null, err]);
          } else {
            resolve([id1, res?.result, null]);
          }
        });
      });
    });
    const resPromises = Promise.all(promisesDatasets);

    resPromises.then((resList) => {
      resList.some((r1) => {
        let d1 = r1[1];

        if (d1 && d1?.lastVersion == null) {
          d1.lastVersion = {
            status: 'COMPLETE',
          };
        }

        if (d1?.lastVersion) {
          if (d1.refreshSchedules != null && _.isObject(d1.refreshSchedules) && _.isEmpty(d1.refreshSchedules)) {
            d1.refreshSchedules = null;
          }
          if (d1.refreshSchedules === '{}') {
            d1.refreshSchedules = null;
          }
          d1.lastVersion.dataset = {
            datasetId: d1.datasetId,
            sourceType: d1.sourceType,
            name: d1.name,
            refreshSchedules: Utils.isNullOrEmpty(d1.refreshSchedules) ? null : Utils.tryJsonParse(d1.refreshSchedules),
            versionCount: d1.versionCount,
          };
        }
      });

      dispatch({
        type: StoreActions.DATASETS_LIST_END,
        payload: {
          result: resList,
        },
      });

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  schemasDatasetVersionsFeatureGroups_(projectId: string, featureGroupId: string, cbFinish?: () => void) {
    if (!featureGroupId || !projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_BEGIN,
      payload: {
        projectId,
        featureGroupId,
      },
    });

    REClient_.client_()._listProjectModelVersionsForFeatureGroup(projectId, featureGroupId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_END,
          payload: {
            projectId,
            featureGroupId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.SCHEMA_DATASETS_VERSIONS_FEATUREGROUPS_LIST_END,
          payload: {
            projectId,
            featureGroupId,
            error: err || Constants.errorDefault,
          },
        });
      }

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  schemasDatasetVersions_(projectId: string, datasetId: string, cbFinish?: () => void) {
    if (!datasetId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SCHEMA_DATASETS_VERSIONS_LIST_BEGIN,
      payload: {
        projectId,
        datasetId,
      },
    });

    REClient_.client_()._listProjectModelVersionsForDataset(projectId, datasetId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.SCHEMA_DATASETS_VERSIONS_LIST_END,
          payload: {
            projectId,
            datasetId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.SCHEMA_DATASETS_VERSIONS_LIST_END,
          payload: {
            projectId,
            datasetId,
            error: err || Constants.errorDefault,
          },
        });
      }

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  projectIsExplainable_(deploymentId: string, cbFinish?: () => void) {
    if (!deploymentId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EXPLANIABLE_PROJECT_START,
      payload: {
        deploymentId,
      },
    });

    REClient_.client_()._getModelInfo(deploymentId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.EXPLANIABLE_PROJECT_END,
          payload: {
            deploymentId,
            result: !!res.result?.supportedExplainerTypes?.length,
          },
        });
      } else {
        dispatch({
          type: StoreActions.EXPLANIABLE_PROJECT_END,
          payload: {
            deploymentId,
            error: err || Constants.errorDefault,
          },
        });
      }

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  customModelInfo_(problemType: string, projectId: string, cbFinish?: () => void) {
    if (!projectId && !problemType) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.CUSTOM_MODEL_INFO_START,
      payload: {
        projectId,
        problemType,
      },
    });

    REClient_.client_()._getProblemTypeCustomModelInfo(problemType, projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.CUSTOM_MODEL_INFO_END,
          payload: {
            projectId,
            problemType,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.CUSTOM_MODEL_INFO_END,
          payload: {
            projectId,
            problemType,
            error: err || Constants.errorDefault,
          },
        });
      }

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  schemasProjectVersions_(projectId: string, cbFinish?: () => void) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SCHEMA_PROJECT_VERSIONS_LIST_BEGIN,
      payload: {
        projectId,
      },
    });

    REClient_.client_()._listProjectModelVersions(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.SCHEMA_PROJECT_VERSIONS_LIST_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.SCHEMA_PROJECT_VERSIONS_LIST_END,
          payload: {
            projectId,
            error: err || Constants.errorDefault,
          },
        });
      }

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  listDatasetsVersions_(datasetId?: any, cbFinish?: () => void) {
    if (!datasetId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DATASETS_VERSIONS_LIST_BEGIN,
      payload: {
        datasetId,
      },
    });

    REClient_.client_().listDatasetVersions(datasetId, null, null, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DATASETS_VERSIONS_LIST_END,
          payload: {
            datasetId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DATASETS_VERSIONS_LIST_END,
          payload: {
            datasetId,
            error: err || Constants.errorDefault,
          },
        });
      }

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  listDeployVersionsHistory_(deployId?: any, cbFinish?: () => void) {
    if (!deployId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEPLOY_VERSIONS_HISTORY_START,
      payload: {
        deployId,
      },
    });

    REClient_.client_().listDeployVersionsHistory(deployId, 5000, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEPLOY_VERSIONS_HISTORY_END,
          payload: {
            deployId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEPLOY_VERSIONS_HISTORY_END,
          payload: {
            deployId,
            error: err || Constants.errorDefault,
          },
        });
      }

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  listDeployVersions_(deployId?: any, cbFinish?: () => void) {
    if (!deployId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DEPLOY_VERSIONS_START,
      payload: {
        deployId,
      },
    });

    REClient_.client_().listDeployVersions(deployId, 5000, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.DEPLOY_VERSIONS_END,
          payload: {
            deployId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DEPLOY_VERSIONS_END,
          payload: {
            deployId,
            error: err || Constants.errorDefault,
          },
        });
      }

      if (cbFinish) {
        cbFinish();
      }
    });
  },

  featuresByUseCase_(useCase: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.REQ_FEATURES_SCHEMA_TYPE_START,
      payload: {
        useCase,
      },
    });

    REClient_.client_().describeUseCaseRequirements(useCase, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.REQ_FEATURES_SCHEMA_TYPE_END,
          payload: {
            useCase,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.REQ_FEATURES_SCHEMA_TYPE_END,
          payload: {
            useCase,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  validateProjectDatasetsReset_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECT_VALIDATION_RESET,
      payload: {},
    });
  },

  validateProjectDatasets_(projectId: string, featureGroupIds: string[] = null, cbFinish?: (data?) => void) {
    if (Utils.isNullOrEmpty(projectId)) {
      cbFinish?.(null);
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECT_VALIDATION_START,
      payload: {
        projectId,
        featureGroupIds,
      },
    });

    REClient_.client_().validateProjectDatasets(projectId, featureGroupIds, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PROJECT_VALIDATION_END,
          payload: {
            projectId,
            featureGroupIds,
            result: res.result,
          },
        });
        cbFinish?.(res?.result);
      } else {
        dispatch({
          type: StoreActions.PROJECT_VALIDATION_END,
          payload: {
            projectId,
            featureGroupIds,
            error: err || Constants.errorDefault,
          },
        });
        cbFinish?.(null);
      }
    });
  },

  schemaGetFileFeatureGroup_(projectId, featureGroupId: string, modelVersion?, featureGroupVersion?) {
    if (!featureGroupId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_START,
      payload: {
        projectId,
        featureGroupId,
        modelVersion,
        featureGroupVersion,
      },
    });

    REClient_.client_()._getFeatureGroupSchema(projectId, featureGroupId, modelVersion, featureGroupVersion, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_END,
          payload: {
            projectId,
            featureGroupId,
            modelVersion,
            featureGroupVersion,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_FEATUREGROUP_END,
          payload: {
            projectId,
            featureGroupId,
            modelVersion,
            featureGroupVersion,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  schemaGetFileDataUse_(project_id, dataset_id: string, batch_prediction_id?, modelVersion?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROBLEM_DEF_FILE_DATA_USE_START,
      payload: {
        project_id,
        dataset_id,
        batch_prediction_id,
        modelVersion,
      },
    });

    REClient_.client_().get_project_dataset_data_use(project_id, dataset_id, batch_prediction_id, modelVersion, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PROBLEM_DEF_FILE_DATA_USE_END,
          payload: {
            project_id,
            dataset_id,
            batch_prediction_id,
            modelVersion,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PROBLEM_DEF_FILE_DATA_USE_END,
          payload: {
            project_id,
            dataset_id,
            batch_prediction_id,
            modelVersion,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  schemaGetFileSchema_(dataset_id: string) {
    if (!dataset_id) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_START,
      payload: {
        dataset_id,
      },
    });

    REClient_.client_().get_dataset_schema(dataset_id, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_END,
          payload: {
            dataset_id,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_END,
          payload: {
            dataset_id,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  schemaGetFileSchemaVersion_(dataset_version: string) {
    if (!dataset_version) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_VERSION_START,
      payload: {
        dataset_version,
      },
    });

    REClient_.client_().get_dataset_schema_version(dataset_version, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_VERSION_END,
          payload: {
            dataset_version,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PROBLEM_DEF_FILE_SCHEMA_VERSION_END,
          payload: {
            dataset_version,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  listFeatureGroupTypes_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_TYPES_START,
      payload: {},
    });

    REClient_.client_()._getValidProjectFeatureGroupUses(false, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_TYPES_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_TYPES_END,
          payload: {
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  listFeatureGroupTypesForAdd_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUPS_TYPES_ADD_START,
      payload: {},
    });

    REClient_.client_()._getValidProjectFeatureGroupUses(true, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.FEATUREGROUPS_TYPES_ADD_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FEATUREGROUPS_TYPES_ADD_END,
          payload: {
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  analyzeSchemaByFeatureGroupVersion_(featureGroupVersion: string, cbFinish?: any) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FEATUREGROUP_ANALYZE_SCHEMA_DATA_START,
      payload: {
        featureGroupVersion,
      },
    });

    let doCallRetry = (retryNum) => {
      if (retryNum <= 0) {
        dispatch({
          type: StoreActions.FEATUREGROUP_ANALYZE_SCHEMA_DATA_END,
          payload: {
            featureGroupVersion,
            result: {},
            error: Constants.errorDefault,
          },
        });

        if (cbFinish) {
          cbFinish();
        }
        return;
      }

      REClient_.client_().getFeatureGroupVersionMetricsSchema(featureGroupVersion, (err, res) => {
        // if(res && !res?.success && res.errorType==='NotReadyError') {
        //   setTimeout(() => {
        //     doCallRetry(retryNum-1);
        //   }, 10000);
        //   return;
        // }

        if (!err && res?.success) {
          dispatch({
            type: StoreActions.FEATUREGROUP_ANALYZE_SCHEMA_DATA_END,
            payload: {
              featureGroupVersion,
              result: res.result,
            },
          });

          if (cbFinish) {
            cbFinish();
          }
        } else {
          dispatch({
            type: StoreActions.FEATUREGROUP_ANALYZE_SCHEMA_DATA_END,
            payload: {
              featureGroupVersion,
              error: err || Constants.errorDefault,
            },
          });

          if (cbFinish) {
            cbFinish();
          }
        }
      });
    };
    doCallRetry(30);
  },

  analyzeSchemaByDatasetId_(project_id: string, dataset_id: string, batchPredId: string, modelVersion: string, datasetVersion: string, cbFinish: any) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.ANALYZE_SCHEMA_DATA_START,
      payload: {
        project_id,
        dataset_id,
        batchPredId,
        modelVersion,
        datasetVersion,
      },
    });

    let doCallRetry = (retryNum) => {
      if (retryNum <= 0) {
        dispatch({
          type: StoreActions.ANALYZE_SCHEMA_DATA_END,
          payload: {
            project_id,
            dataset_id,
            batchPredId,
            modelVersion,
            datasetVersion,
            result: {},
            error: Constants.errorDefault,
          },
        });

        if (cbFinish) {
          cbFinish();
        }
        return;
      }

      let method1 = 'get_dataset_metrics_schema';
      if (datasetVersion) {
        method1 = 'get_dataset_metrics_schema_version';
      }

      REClient_.client_()[method1](project_id, dataset_id, batchPredId, datasetVersion || modelVersion, (err, res) => {
        if (res && !res?.success && res.errorType === 'NotReadyError') {
          setTimeout(() => {
            doCallRetry(retryNum - 1);
          }, 10000);
          return;
        }

        if (!err && res?.success) {
          dispatch({
            type: StoreActions.ANALYZE_SCHEMA_DATA_END,
            payload: {
              project_id,
              dataset_id,
              batchPredId,
              modelVersion,
              datasetVersion,
              result: res.result,
            },
          });

          if (cbFinish) {
            cbFinish();
          }
        } else {
          dispatch({
            type: StoreActions.ANALYZE_SCHEMA_DATA_END,
            payload: {
              project_id,
              dataset_id,
              batchPredId,
              modelVersion,
              datasetVersion,
              result: {},
              error: err || Constants.errorDefault,
            },
          });

          if (cbFinish) {
            cbFinish();
          }
        }
      });
    };
    doCallRetry(30);
  },

  resetSchemaChanged_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SCHEMA_DATA_RESET,
      payload: {},
    });
  },

  chartsByDatasetId_(dataset_id: string, project_id: string, num_items: number, cbFinish: any) {
    let dispatch = this.calcGlobalDispatch();

    if (num_items == null) {
      num_items = 20;
    }

    dispatch({
      type: StoreActions.CHARTS_DATA_EXPLORER_START,
      payload: {
        dataset_id,
        project_id,
        num_items,
      },
    });

    REClient_.client_().get_data_explorer_charts(dataset_id, project_id, num_items, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.CHARTS_DATA_EXPLORER_END,
          payload: {
            dataset_id,
            project_id,
            num_items,
            result: res.result,
          },
        });

        if (cbFinish) {
          cbFinish();
        }
      } else {
        dispatch({
          type: StoreActions.CHARTS_DATA_EXPLORER_END,
          payload: {
            dataset_id,
            project_id,
            num_items,
            result: [],
            error: err || Constants.errorDefault,
          },
        });

        if (cbFinish) {
          cbFinish();
        }
      }
    });
  },

  schemaByModelId(modelId: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SCHEMA_MODEL_VERSION_START,
      payload: {
        modelId,
      },
    });

    //TODO (ariel) use modelVersion directly
    REClient_.client_().listModelVersions(modelId, (errMI, resMI) => {
      let model_version_id = resMI && resMI.result && resMI.result[0] && resMI.result[0].modelVersion;

      if (errMI || model_version_id == null) {
        dispatch({
          type: StoreActions.SCHEMA_MODEL_VERSION_END,
          payload: {
            modelId,
            error: errMI || Constants.errorDefault,
          },
        });
        return;
      }

      REClient_.client_().getPredictionSchema(model_version_id, (err, res) => {
        if (!err && res?.success) {
          dispatch({
            type: StoreActions.SCHEMA_MODEL_VERSION_END,
            payload: {
              modelId,
              result: res.result,
            },
          });
        } else {
          dispatch({
            type: StoreActions.SCHEMA_MODEL_VERSION_END,
            payload: {
              modelId,
              error: err || Constants.errorDefault,
            },
          });
        }
      });
    });
  },

  getFieldValuesForDeploymentId_(deploymentId: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECTS_FIELD_VALUES_START,
      payload: {
        deploymentId,
      },
    });

    REClient_.client_().listTestData(deploymentId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PROJECTS_FIELD_VALUES_END,
          payload: {
            deploymentId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PROJECTS_FIELD_VALUES_END,
          payload: {
            deploymentId,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  helpUseCasesRetrieve_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.HELP_USECASES_RETRIEVE_START,
      payload: {},
    });

    REClient_.client_()._getUseCaseDocumentation((err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.HELP_USECASES_RETRIEVE_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.HELP_USECASES_RETRIEVE_END,
          payload: {
            isError: true,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  helpRetrieve_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.HELP_RETRIEVE_START,
      payload: {},
    });

    REClient_.client_().documentation_((err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.HELP_RETRIEVE_END,
          payload: {
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.HELP_RETRIEVE_END,
          payload: {
            isError: true,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  getAlgosForProjectId_(projectId: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECTS_ALGOS_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_().get_models_by_project(projectId, (err, res) => {
      if (!err && res?.success) {
        dispatch({
          type: StoreActions.PROJECTS_ALGOS_END,
          payload: {
            projectId,
            result: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PROJECTS_ALGOS_END,
          payload: {
            projectId,
            isError: true,
            error: err || Constants.errorDefault,
          },
        });
      }
    });
  },

  storageRefreshBegin_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.STORAGE_REFRESH_START,
      payload: {},
    });
  },

  storageRefreshEnd_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.STORAGE_REFRESH_END,
      payload: {},
    });
  },

  updateProjectList_(updates?: any[]) {
    if (!updates || !_.isArray(updates) || updates.length === 0) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECTS_LIST_UPDATE,
      payload: {
        updates,
      },
    });
  },

  resetAllChangeOrg_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.RESET_CHANGE_ORG,
      payload: {},
    });
  },

  getProjectsById_(projectId?: string) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECTS_ONE_START,
      payload: {
        projectId,
      },
    });

    REClient_.client_()._describeProject(projectId, (err, res) => {
      if (!err && res?.success && res?.result) {
        this.processProjectForOldGql(res.result);

        dispatch({
          type: StoreActions.PROJECTS_ONE_END,
          payload: {
            result: res.result,
            projectId,
          },
        });
      } else {
        if (err) {
          if (res?.errorType?.toLowerCase() === 'DataNotFoundError'.toLowerCase()) {
            err = null;
          } else {
            err = err || Constants.errorDefault;
          }
        }

        dispatch({
          type: StoreActions.PROJECTS_ONE_END,
          payload: {
            projectId,
            error: err,
          },
        });
      }
    });
  },

  processProjectForOldGql(p1) {
    p1.allProjectDatasets?.some((d1) => {
      d1.dataSource = d1.dataset?.dataSource;
      d1.datasetId = d1.dataset?.datasetId;
      d1.name = d1.dataset?.name;
      d1.sourceType = d1.dataset?.sourceType;
      d1.versionCount = d1.dataset?.versionCount;
      d1.status = d1.dataset?.lastVersion?.status;

      if (d1.dataset?.lastVersion != null) {
        d1.dataset.lastVersion.dataset = d1.dataset.lastVersion.dataset || {};
        d1.dataset.lastVersion.dataset.datasetId = d1.dataset?.datasetId;
        d1.dataset.lastVersion.dataset.sourceType = d1.dataset?.sourceType;
        d1.dataset.lastVersion.dataset.name = d1.dataset?.name;
      }
    });

    p1.allProjectModels?.some((d1) => {
      d1.status = d1.lastVersion?.status;
    });

    let docStoreDef = calcDocStoreDefFromProject(p1);

    let isPredicting = ['PREDICTING'].includes(p1?.useCase?.toUpperCase());
    p1.isPredicting = isPredicting;
    let isModelMonitor = p1.isDrift || isPredicting || docStoreDef?.useNewMonitoring === true;
    p1.isModelMonitor = isModelMonitor;

    // p1.allProjectDeployments?.some(d1 => {
    //   d1.status = d1.model?.lastVersion?.status;
    // });
  },

  getProjectsList_(isStarred?, isFilter?, filterText?, sinceProjectId = null, lastRefreshTime = null, limit = null, filterTagText = null, cbFinish?: (isOk, res?) => void) {
    let dispatch = this.calcGlobalDispatch();
    const isTemp = lastRefreshTime != null;

    if (limit == null) {
      limit = 20;
    }

    if (!isTemp) {
      dispatch({
        type: StoreActions.PROJECTS_LIST_START,
        payload: {
          sinceProjectId,
          lastRefreshTime,
          limit,
          isFilter,
          filterText,
          filterTagText,
          isStarred,
        },
      });
    }

    REClient_.client_()._listProjectsDashboard(lastRefreshTime, limit, sinceProjectId, filterText, isStarred, filterTagText, (err, res) => {
      if (!err && res?.success) {
        res?.result?.projects?.forEach?.((p1) => {
          this.processProjectForOldGql(p1);
        });

        dispatch({
          type: StoreActions.PROJECTS_LIST_END,
          payload: {
            totalCount: res?.result?.totalCount,
            list: res.result?.projects,
            sinceProjectId,
            lastRefreshTime,
            isTemp,
            limit,
            isFilter,
            filterText,
            filterTagText,
            isStarred,
          },
        });
        cbFinish?.(true, res);
      } else {
        if (!isTemp) {
          dispatch({
            type: StoreActions.PROJECTS_LIST_END,
            payload: {
              isError: true,
              sinceProjectId,
              lastRefreshTime,
              isTemp,
              limit,
              isFilter,
              filterText,
              filterTagText,
              isStarred,
            },
          });
        }
        cbFinish?.(false);
      }
    });
  },

  listProjectsAll_(cbFinish?: (isOk, res?) => void) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROJECTS_ALL_START,
      payload: {},
    });

    REClient_.client_().listProjects((err, res) => {
      if (!err && res && res?.success && res?.result) {
        let list = res?.result ?? null;

        dispatch({
          type: StoreActions.PROJECTS_ALL_END,
          payload: {
            result: list,
          },
        });
        cbFinish?.(true, res);
      } else {
        dispatch({
          type: StoreActions.PROJECTS_ALL_END,
          payload: {
            isError: true,
          },
        });
        cbFinish?.(false);
      }
    });
  },

  getUseCases_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.USE_CASES_START,
      payload: {},
    });

    //'{ getAllUseCases { predictionApi, useCase, imgSrc, prettyNameWeb, prettyName, description, info } }'
    REClient_.client_()._listUseCasesInternal((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.USE_CASES_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.USE_CASES_END,
        });
      }
    });
  },

  getDatabaseConnectorObjects(databaseConnectorId) {
    if (!databaseConnectorId) {
      return null;
    }

    let dispatch = this.calcGlobalDispatch();
    dispatch({
      type: StoreActions.DATABASE_CONNECTOR_OBJECTS_START,
      payload: {
        databaseConnectorId,
      },
    });
    REClient_.client_().listDatabaseConnectorObjects(databaseConnectorId, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.DATABASE_CONNECTOR_OBJECTS_END,
          payload: {
            databaseConnectorId,
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DATABASE_CONNECTOR_OBJECTS_END,
          payload: {
            error: res?.error,
            databaseConnectorId,
          },
        });
      }
    });
  },

  getDatabaseConnectorObjectSchema(databaseConnectorId, objectName) {
    let dispatch = this.calcGlobalDispatch();
    dispatch({
      type: StoreActions.DATABASE_CONNECTOR_OBJECT_SCHEMA_START,
      payload: {
        databaseConnectorId,
        objectName,
      },
    });

    REClient_.client_().getDatabaseConnectorObjectSchema(databaseConnectorId, objectName, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.DATABASE_CONNECTOR_OBJECT_SCHEMA_END,
          payload: {
            databaseConnectorId,
            objectName,
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DATABASE_CONNECTOR_OBJECT_SCHEMA_END,
          payload: {
            databaseConnectorId,
            objectName,
          },
        });
      }
    });
  },

  getDatabaseConnectorOptions() {
    let dispatch = this.calcGlobalDispatch();
    dispatch({
      type: StoreActions.DATABASE_CONNECTOR_OPTIONS_START,
      payload: {},
    });

    REClient_.client_().listValidDatabaseConnectors((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.DATABASE_CONNECTOR_OPTIONS_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DATABASE_CONNECTOR_OPTIONS_END,
        });
      }
    });
  },

  getApplicationConnectorOptions() {
    let dispatch = this.calcGlobalDispatch();
    dispatch({
      type: StoreActions.APPLICATION_CONNECTOR_OPTIONS_START,
      payload: {},
    });

    REClient_.client_().listValidApplicationConnectors((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.APPLICATION_CONNECTOR_OPTIONS_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.APPLICATION_CONNECTOR_OPTIONS_END,
        });
      }
    });
  },

  getStreamingConnectorOptions() {
    let dispatch = this.calcGlobalDispatch();
    dispatch({
      type: StoreActions.STREAMING_CONNECTOR_OPTIONS_START,
      payload: {},
    });

    REClient_.client_().listValidStreamingConnectors((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.STREAMING_CONNECTOR_OPTIONS_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.STREAMING_CONNECTOR_OPTIONS_END,
        });
      }
    });
  },

  getFileConnectorOptions() {
    let dispatch = this.calcGlobalDispatch();
    dispatch({
      type: StoreActions.FILE_CONNECTOR_OPTIONS_START,
      payload: {},
    });

    REClient_.client_().listValidFileConnectors((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.FILE_CONNECTOR_OPTIONS_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FILE_CONNECTOR_OPTIONS_END,
        });
      }
    });
  },

  getApplicationConnectors() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.APPLICATION_CONNECTORS_START,
      payload: {},
    });

    REClient_.client_().listApplicationConnectors((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.APPLICATION_CONNECTORS_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.APPLICATION_CONNECTORS_END,
        });
      }
    });
  },

  getStreamingConnectors() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.STREAMING_CONNECTORS_START,
      payload: {},
    });

    REClient_.client_().listStreamingConnectors((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.STREAMING_CONNECTORS_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.STREAMING_CONNECTORS_END,
        });
      }
    });
  },

  getDatabaseConnectors() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DATABASE_CONNECTORS_START,
      payload: {},
    });

    REClient_.client_().listDatabaseConnectors((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.DATABASE_CONNECTORS_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.DATABASE_CONNECTORS_END,
        });
      }
    });
  },

  describeModelMonitorById_(modelMonitorId?) {
    if (!modelMonitorId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MONITORING_MODELS_DESC_BEGIN,
      payload: {
        modelMonitorId,
      },
    });

    REClient_.client_().describeModelMonitor(modelMonitorId, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.MONITORING_MODELS_DESC_END,
          payload: {
            modelMonitorId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MONITORING_MODELS_DESC_END,
          payload: {
            modelMonitorId,
          },
        });
      }
    });
  },

  getMetricsFGForVersion_(predictionMetricsVersion?, actualValue?) {
    if (!predictionMetricsVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_METRICS_START,
      payload: {
        predictionMetricsVersion,
        actualValue,
      },
    });

    REClient_.client_()._getPredictionMetricDataByPredictionMetricVersion(predictionMetricsVersion, actualValue, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.PRED_METRICS_METRICS_END,
          payload: {
            predictionMetricsVersion,
            actualValue,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PRED_METRICS_METRICS_END,
          payload: {
            predictionMetricsVersion,
            actualValue,
          },
        });
      }
    });
  },

  getModelMonitorVersionMetricData(modelMonitorVersion?, metricType?, actualValue?) {
    if (!modelMonitorVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PRED_METRICS_TYPE_START,
      payload: {
        modelMonitorVersion,
        metricType,
        actualValue,
      },
    });

    REClient_.client_().modelMonitorVersionMetricData(modelMonitorVersion, metricType, actualValue, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.PRED_METRICS_TYPE_END,
          payload: {
            modelMonitorVersion,
            metricType,
            actualValue,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PRED_METRICS_TYPE_END,
          payload: {
            modelMonitorVersion,
            metricType,
            actualValue,
          },
        });
      }
    });
  },

  getMetricsModelMonitorForVersion_(modelMonitorVersion?) {
    if (!modelMonitorVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MONITORING_METRICS_BEGIN,
      payload: {
        modelMonitorVersion,
      },
    });

    REClient_.client_()._getPredictionMetricDataByPredictionMetricVersion(modelMonitorVersion, null, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.MONITORING_METRICS_END,
          payload: {
            modelMonitorVersion,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MONITORING_METRICS_END,
          payload: {
            modelMonitorVersion,
          },
        });
      }
    });
  },

  listMonitoringModelVersions_(modelMonitorId?) {
    if (!modelMonitorId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MONITORING_MODELS_VERSIONS_LIST_BEGIN,
      payload: {
        modelMonitorId,
      },
    });

    REClient_.client_().listModelMonitorVersions(modelMonitorId, 9999, null, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.MONITORING_MODELS_VERSIONS_LIST_END,
          payload: {
            modelMonitorId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MONITORING_MODELS_VERSIONS_LIST_END,
          payload: {
            modelMonitorId,
          },
        });
      }
    });
  },

  listMonitoringModelsAll_(onlyStarred?: boolean) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MONITORING_MODELS_LIST_ALL_BEGIN,
      payload: {
        onlyStarred,
      },
    });

    REClient_.client_().listOrganizationModelMonitors(onlyStarred, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.MONITORING_MODELS_LIST_ALL_END,
          payload: {
            onlyStarred,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MONITORING_MODELS_LIST_ALL_END,
          payload: {
            onlyStarred,
          },
        });
      }
    });
  },

  eventsByAlertVersion_(monitorAlertVersion?) {
    if (!monitorAlertVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MONITORS_ALERT_EVENTS_BEGIN,
      payload: {
        monitorAlertVersion,
      },
    });

    REClient_.client_().listMonitorAlertVersionsForMonitorVersion(monitorAlertVersion, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.MONITORS_ALERT_EVENTS_END,
          payload: {
            monitorAlertVersion,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MONITORS_ALERT_EVENTS_END,
          payload: {
            monitorAlertVersion,
          },
        });
      }
    });
  },

  describeMonitorAlert_(monitorAlertId?) {
    if (!monitorAlertId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MONITORS_ALERT_DETAIL_BEGIN,
      payload: {
        monitorAlertId,
      },
    });

    REClient_.client_().describeMonitorAlert(monitorAlertId, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.MONITORS_ALERT_DETAIL_END,
          payload: {
            monitorAlertId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MONITORS_ALERT_DETAIL_END,
          payload: {
            monitorAlertId,
          },
        });
      }
    });
  },

  listMonitoringModels_(projectId?) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.MONITORING_MODELS_LIST_BEGIN,
      payload: {
        projectId,
      },
    });

    REClient_.client_().listModelMonitors(projectId, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.MONITORING_MODELS_LIST_END,
          payload: {
            projectId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.MONITORING_MODELS_LIST_END,
          payload: {
            projectId,
          },
        });
      }
    });
  },

  updateEdaVersionLifecyle_(edaVersion, edaId: string, created_at: number, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EDA_VERSION_UPDATE_LIFECYCLE,
      payload: {
        edaVersion,
        edaId,
        created_at,
        status: currentStatus,
      },
    });
  },

  updateEdaLifecyle_(edaId: string, created_at: number, currentStatus: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EDA_UPDATE_LIFECYCLE,
      payload: {
        edaId,
        created_at,
        status: currentStatus,
      },
    });
  },

  listEda_(projectId?) {
    if (!projectId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EDA_LIST_BEGIN,
      payload: {
        projectId,
      },
    });

    REClient_.client_().listEda(projectId, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.EDA_LIST_END,
          payload: {
            projectId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.EDA_LIST_END,
          payload: {
            projectId,
          },
        });
      }
    });
  },

  describeEda_(edaId?) {
    if (!edaId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EDA_DESC_BEGIN,
      payload: {
        edaId,
      },
    });

    REClient_.client_().describeEda(edaId, (err, res) => {
      if (!err && res && res?.success) {
        const edaVersion = res.result?.latestEdaVersion?.edaVersion;
        StoreActions.getEdaDataConsistencyDetection_(edaVersion);
        StoreActions.getEdaCollinearity_(edaVersion);

        dispatch({
          type: StoreActions.EDA_DESC_END,
          payload: {
            edaId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.EDA_DESC_END,
          payload: {
            edaId,
          },
        });
      }
    });
  },

  getEdaDataConsistencyDetection_(edaVersion?) {
    if (!edaVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EDA_DATA_CONSISTENCY_BEGIN,
      payload: {
        edaVersion,
      },
    });

    REClient_.client_().getEdaDataConsistency(edaVersion, null, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.EDA_DATA_CONSISTENCY_END,
          payload: {
            edaVersion,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.EDA_DATA_CONSISTENCY_END,
          payload: {
            edaVersion,
          },
        });
      }
    });
  },

  getEdaCollinearity_(edaVersion?) {
    if (!edaVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EDA_COLLINEARITY_BEGIN,
      payload: {
        edaVersion,
      },
    });

    REClient_.client_().getEdaCollinearity(edaVersion, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.EDA_COLLINEARITY_END,
          payload: {
            edaVersion,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.EDA_COLLINEARITY_END,
          payload: {
            edaVersion,
          },
        });
      }
    });
  },

  listEdaVersions_(edaId?) {
    if (!edaId) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EDA_VERSIONS_LIST_BEGIN,
      payload: {
        edaId,
      },
    });

    REClient_.client_().listEdaVersions(edaId, 9999, null, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.EDA_VERSIONS_LIST_END,
          payload: {
            edaId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.EDA_VERSIONS_LIST_END,
          payload: {
            edaId,
          },
        });
      }
    });
  },

  describeEdaVersion_(edaVersion?) {
    if (!edaVersion) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.EDA_VERSION_DESC_BEGIN,
      payload: {
        edaVersion,
      },
    });

    REClient_.client_().describeEdaVersion(edaVersion, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.EDA_VERSION_DESC_END,
          payload: {
            edaVersion,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.EDA_VERSION_DESC_END,
          payload: {
            edaVersion,
          },
        });
      }
    });
  },

  updateCDSLifecyle_(status?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.CDS_UPDATE_LIFECYCLE,
      payload: {
        status,
      },
    });
  },

  listCDS_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.CDS_LIST_BEGIN,
      payload: {},
    });

    REClient_.client_()._listDataserverDeployments((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.CDS_LIST_END,
          payload: {
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.CDS_LIST_END,
        });
      }
    });
  },

  updateShowChat(result?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.UPDATE_SHOW_CHAT,
      payload: {
        result,
      },
    });
  },

  updateIsChatRefresh(result?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.UPDATE_REFRESH_CAHT,
      payload: {
        result,
      },
    });
  },

  updateChatSessionId(result?, projectId?: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.UPDATE_CHAT_SESSION_ID,
      payload: {
        projectId,
        result,
      },
    });
  },

  updateValidChatSession(result?, chatSessionId?: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.UPDATE_VALID_CHAT_SESSION,
      payload: {
        chatSessionId,
        result,
      },
    });
  },

  updateChatProjectId(result?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.UPDATE_CHAT_PROJECT_ID,
      payload: {
        result,
      },
    });
  },

  updateChatUserOrgId(result?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.UPDATE_CHAT_USER_ORG_ID,
      payload: {
        result,
      },
    });
  },

  deleteChatProjectId(result?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.DELETE_CHAT_PROJECT_ID,
      payload: {
        result,
      },
    });
  },

  addChatProjects(projectId?, projectName?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.ADD_CHAT_PROJECTS,
      payload: {
        projectId,
        projectName,
      },
    });
  },

  updateChatUrl(result?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.UPDATE_CHAT_URL,
      payload: {
        result,
      },
    });
  },

  updateChatHistory(result?, chatSessionId?: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.UPDATE_CHAT_HISTORY,
      payload: {
        chatSessionId,
        result: result,
      },
    });
  },

  getFileConnectors() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.FILE_CONNECTORS_START,
      payload: {},
    });

    REClient_.client_().listExternalBuckets((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.FILE_CONNECTORS_END,
          payload: {
            list: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.FILE_CONNECTORS_END,
        });
      }
    });
  },

  describeAlgo_(name?: string, cbFinish?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.ALGORITHMS_DETAIL_BEGIN,
      payload: {
        name,
      },
    });

    REClient_.client_().describeAlgorithm(name, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.ALGORITHMS_DETAIL_END,
          payload: {
            name,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.ALGORITHMS_DETAIL_END,
          payload: {
            name,
          },
        });
      }

      cbFinish?.(res?.result);
    });
  },

  listAlgosByProblemTypeId_(problemType?: string, projectId?: string) {
    problemType = problemType?.toUpperCase();
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.ALGORITHMS_LIST_BEGIN,
      payload: {
        problemType,
        projectId,
      },
    });

    REClient_.client_().listAlgorithms(problemType, projectId, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.ALGORITHMS_LIST_END,
          payload: {
            problemType,
            projectId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.ALGORITHMS_LIST_END,
          payload: {
            problemType,
            projectId,
          },
        });
      }
    });
  },

  listBuiltinAlgorithmsByProjectId_(projectId: string, featureGroupIds?: string[], trainingConfig?: any) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.BUILTIN_ALGORITHMS_LIST_BEGIN,
      payload: {
        projectId,
      },
    });

    REClient_.client_().listBuiltinAlgorithms(projectId, featureGroupIds, trainingConfig, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.BUILTIN_ALGORITHMS_LIST_END,
          payload: {
            projectId,
            featureGroupIds,
            trainingConfig,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.BUILTIN_ALGORITHMS_LIST_END,
          payload: {
            projectId,
            featureGroupIds,
            trainingConfig,
          },
        });
      }
    });
  },

  listPretrainedModelAlgorithms_(useCase: string) {
    if (useNormalizedId(useCase) == null) {
      return;
    }

    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.LIST_PRETRAINED_MODEL_ALGORITHMS_BEGIN,
      payload: {
        useCase,
      },
    });

    REClient_.client_()._listPretrainedModelAlgorithms(useCase, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.LIST_PRETRAINED_MODEL_ALGORITHMS_END,
          payload: {
            useCase,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.LIST_PRETRAINED_MODEL_ALGORITHMS_END,
          payload: {
            useCase,
          },
        });
      }
    });
  },

  listTemplatesByProjectId_(projectId?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.TEMPLATE_LIST_BEGIN,
      payload: {
        projectId,
      },
    });

    const cb1 = (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.TEMPLATE_LIST_END,
          payload: {
            projectId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.TEMPLATE_LIST_END,
          payload: {
            projectId,
          },
        });
      }
    };

    if (projectId) {
      REClient_.client_().listProjectFeatureGroupTemplates(9000, null, projectId, true, cb1);
    } else {
      REClient_.client_().listFeatureGroupTemplates(9000, null, null, true, cb1);
    }
  },

  describeNotebook_(notebookId?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.NOTEBOOK_DETAIL_BEGIN,
      payload: {
        notebookId,
      },
    });

    REClient_.client_()._describeNotebook(notebookId, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.NOTEBOOK_DETAIL_END,
          payload: {
            notebookId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.NOTEBOOK_DETAIL_END,
          payload: {
            notebookId,
          },
        });
      }
    });
  },

  _listNotebookTemplateTypes(templateType?: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.NOTEBOOK_TEMPLATE_TYPES_BEGIN,
      payload: {},
    });

    REClient_.client_()._listNotebookTemplateTypes((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.NOTEBOOK_TEMPLATE_TYPES_END,
          payload: {
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.NOTEBOOK_TEMPLATE_TYPES_END,
          payload: {},
        });
      }
    });
  },

  _listNotebookTemplates(templateType?: string) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.NOTEBOOK_TEMPLATE_LIST_BEGIN,
      payload: {},
    });

    REClient_.client_()._listNotebookTemplates(templateType, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.NOTEBOOK_TEMPLATE_LIST_END,
          payload: {
            result: res?.result,
            templateType,
          },
        });
      } else {
        dispatch({
          type: StoreActions.NOTEBOOK_TEMPLATE_LIST_END,
          payload: {},
        });
      }
    });
  },

  describeTemplate_(featureGroupTemplateId?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.TEMPLATE_DETAIL_BEGIN,
      payload: {
        featureGroupTemplateId,
      },
    });

    REClient_.client_().describeTemplate(featureGroupTemplateId, (err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.TEMPLATE_DETAIL_END,
          payload: {
            featureGroupTemplateId,
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.TEMPLATE_DETAIL_END,
          payload: {
            featureGroupTemplateId,
          },
        });
      }
    });
  },

  cpuAndMemoryRefresh_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.ORG_CPU_MEMORY_START,
      payload: {},
    });

    REClient_.client_()._getCpuAndMemoryOptions((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.ORG_CPU_MEMORY_END,
          payload: {
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.ORG_CPU_MEMORY_END,
          payload: {},
        });
      }
    });
  },

  listProblemTypeAllowed_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.PROBLEMTYPE_ALLOWED_BEGIN,
      payload: {},
    });

    REClient_.client_()._listAvailableProblemTypesForAlgorithms((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.PROBLEMTYPE_ALLOWED_END,
          payload: {
            result: res?.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.PROBLEMTYPE_ALLOWED_END,
          payload: {},
        });
      }
    });
  },

  setForceAuthData_(data) {
    this.calcGlobalDispatch()({
      type: StoreActions.FORCE_AUTH_USER_DATA,
      payload: {
        user: Immutable.fromJS(data),
      },
    });
  },

  updateUserPreferences_(pref: object) {
    REClient_.client_()._updateUserPreferences(pref, (err, res) => {
      if (!err) {
        StoreActions.getAuthUser_();
      }
    });
  },

  getAuthOrgs_() {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.GET_AUTH_ORGS_START,
      payload: {},
    });

    REClient_.client_().listOrganizations((err, res) => {
      if (!err && res && res?.success) {
        dispatch({
          type: StoreActions.GET_AUTH_ORGS_END,
          payload: {
            list: res.result,
          },
        });
      } else {
        dispatch({
          type: StoreActions.GET_AUTH_ORGS_END,
        });
      }
    });
  },

  getAuthUser_(cbFinish?: any) {
    let dispatch = this.calcGlobalDispatch();

    let wasLoggedRes = calcAuthUserIsLoggedIn();

    dispatch({
      type: StoreActions.GET_AUTH_USER_START,
      payload: {},
    });

    //gql('{ userInfo { internal, userHandle, email, canJoinOrg, forceVerification, emailValidated, organizationAdmin, info, emailChannels, billing, userId, organizationAdmin, name, picture, internal, twofaEnabled, organization { workspace, ingressName, discoverable, info, cloudInfo, organizationId, name, picture, billingPlan, pricingPlan, } } }', (err, res) => {
    REClient_.client_()._getUserInfo((err, res) => {
      if (!err && res && res?.success) {
        let ui = res?.result;
        if (ui) {
          if (ui.info == null) {
            ui.info = {};
          } else {
            if (_.isString(ui?.info)) {
              if (ui?.info === '') {
                ui.info = {};
              } else {
                ui.info = Utils.tryJsonParse(ui?.info) ?? {};
              }
            }
          }

          if (ui.emailChannels == null) {
            ui.emailChannels = {};
          } else {
            if (_.isString(ui.emailChannels)) {
              if (ui.emailChannels === '') {
                ui.emailChannels = {};
              } else {
                ui.emailChannels = Utils.tryJsonParse(ui.emailChannels) ?? {};
              }
            }
          }

          if (ui?.organization) {
            if (ui.organization.info == null) {
              ui.organization.info = {};
            } else {
              if (_.isString(ui.organization.info)) {
                if (ui.organization.info === '') {
                  ui.organization.info = {};
                } else {
                  ui.organization.info = Utils.tryJsonParse(ui.organization.info) ?? {};
                }
              }
            }
          }
        }

        dispatch({
          type: StoreActions.GET_AUTH_USER_END,
          payload: {
            user: ui,
          },
        });

        let res1 = calcAuthUserIsLoggedIn();
        if (res1?.isLoggedIn && (wasLoggedRes?.isLoggedIn !== true || wasLoggedRes?.alreadyOrgId !== res1?.alreadyOrgId)) {
          StoreActions.listFeatureGroupTypes_();
          StoreActions.getAuthOrgs_();
          StoreActions.alertsList_();
          StoreActions.cpuAndMemoryRefresh_();
        }
      } else {
        dispatch({
          type: StoreActions.GET_AUTH_USER_END,
        });
      }

      cbFinish && cbFinish();
    });
  },

  userLogout_(dispatch?: any) {
    dispatch = dispatch || this.calcGlobalDispatch();

    StoreActions.refreshDatasetUntilStateCancelAll_();
    StoreActions.refreshModelUntilStateCancelAll_();

    dispatch({
      type: StoreActions.GET_AUTH_LOGOUT,
      payload: {},
    });
  },

  setParamsProp_(dispatch?, params?) {
    dispatch = dispatch || this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SET_PARAMS,
      payload: {
        params: params,
      },
    });
  },

  setNavParams_(params?) {
    let dispatch = this.calcGlobalDispatch();

    dispatch({
      type: StoreActions.SET_NAV_PARAMS,
      payload: {
        params: params,
      },
    });
  },

  calcGlobalDispatch() {
    return Utils.globalStore().dispatch;
  },

  listWindowFunctions_() {
    let dispatch = this.calcGlobalDispatch();
    dispatch({
      type: StoreActions.PIT_WINDOW_FUNCTIONS_START,
      payload: {},
    });

    REClient_.client_()._pointInTimeFeatureGroupCreationOptions((err, res) => {
      dispatch({
        type: StoreActions.PIT_WINDOW_FUNCTIONS_END,
        payload: {
          ...(!err && res && res?.success && { result: res?.result }),
        },
      });
    });
  },
};

export default StoreActions;
