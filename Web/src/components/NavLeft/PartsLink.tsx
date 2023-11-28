import Constants from '../../constants/Constants';

enum PartsLink {
  global = 'global',

  mobile_desktop = 'mobile_desktop',

  root = 'root',
  main = 'main',

  welcome = 'project_list',
  storage_browser = 'storage_browser',
  search_adv = 'search_adv',

  config_2fa = 'config_2fa',
  signup = 'signup',
  signin = 'signin',
  signin_password = 'signin_password',
  signin_forgot_new = 'signin_forgot_new',
  signin_reset_password = 'signin_reset_password',
  signin_verify_account = 'signin_verify_account',
  accept_invite = 'accept_invite',
  finish_billing = 'finish_billing',

  devCenter = 'models',

  profile = 'profile',
  change_password = 'change_password',
  change_email = 'change_email',

  workspace_join = 'workspace_join',

  type_access = 'type_access',
  price_lists = 'price_lists',
  select_labeled = 'select_labeled',

  featuregroups_list = 'featuregroups_list',

  document_retriever_list = 'document_retriever_list',
  document_retriever_create = 'document_retriever_create',
  document_retriever_edit = 'document_retriever_edit',
  document_retriever_detail = 'document_retriever_detail',

  datasets_all = 'datasets_all',

  notebook_list = 'notebook_list',

  webhook_add = 'webhook_add',
  webhook_one = 'webhook_one',
  webhook_list = 'webhook_list',

  template_one = 'template_one',
  template_detail = 'template_detail',
  templates_list = 'templates_list',

  pretrained_models_add = 'pretrained_models_add',

  python_function_detail = 'python_function_detail',

  project_list = 'project_list',
  project_add = 'project_add',
  project_dashboard = 'project_dashboard',
  project_predictions = 'project_predictions',
  project_data_augmentation = 'project_data_augmentation',

  rawdata_visual = 'rawdata_visual',

  docker_add = 'docker_add',

  notebook_one = 'notebook_one',
  notebook_fg = 'notebook_fg',
  notebook_model = 'notebook_model',
  fast_notebook = 'fast_notebook',
  notebook_details = 'notebook_details',

  notebook_template_list = 'notebook_template_list',
  notebook_template_details = 'notebook_template_details',
  annotations_edit = 'annotations_edit',

  algorithm_one = 'algorithm_one',
  algorithm_list = 'algorithm_list',

  agent_one = 'agent_one',

  python_functions_one = 'python_functions_one',
  python_functions_list = 'python_functions_list',
  python_functions_edit = 'python_functions_edit',

  custom_loss_function_one = 'custom_loss_function_one',
  custom_loss_functions_list = 'custom_loss_functions_list',

  custom_metric_one = 'custom_metric_one',
  custom_metrics_list = 'custom_metrics_list',

  module_one = 'module_one',
  modules_list = 'modules_list',

  dagviewer = 'dagviewer',
  feature_groups_explorer = 'feature_groups_explorer',
  feature_group_detail = 'feature_group_detail',
  feature_groups = 'feature_groups',
  feature_groups_template_add = 'feature_groups_template_add',
  feature_groups_template = 'feature_groups_template',
  feature_groups_template_list = 'feature_groups_template_list',
  feature_groups_add = 'feature_groups_add',
  feature_groups_edit = 'feature_groups_edit',
  feature_groups_history = 'feature_groups_history',
  feature_groups_export = 'feature_groups_export',
  feature_groups_export_add = 'feature_groups_export_add',
  feature_groups_schedule_add = 'feature_groups_schedule_add',
  feature_groups_snapshot = 'feature_groups_snapshot',
  feature_groups_sampling = 'feature_groups_sampling',
  feature_groups_merge = 'feature_groups_merge',
  feature_groups_transform = 'feature_groups_transform',
  features_list = 'features_list',
  features_add = 'features_add',
  features_add_nested = 'features_add_nested',
  features_add_point_in_time = 'features_add_point_in_time',
  features_add_point_in_time_group = 'features_add_point_in_time_group',
  features_rawdata = 'features_rawdata',
  feature_groups_data_explorer = 'feature_groups_data_explorer',
  feature_groups_constraint = 'feature_groups_constraint',
  feature_groups_constraint_add = 'feature_groups_constraint_add',

  exploratory_data_analysis = 'exploratory_data_analysis',
  exploratory_data_analysis_detail = 'exploratory_data_analysis_detail',
  exploratory_data_analysis_graphs = 'exploratory_data_analysis_graphs',
  exploratory_data_analysis_graphs_one = 'exploratory_data_analysis_graphs_one',
  exploratory_data_analysis_graphs_one_add_function = 'exploratory_data_analysis_graphs_one_add_function',
  exploratory_data_analysis_graphs_org = 'exploratory_data_analysis_graphs_org',
  exploratory_data_analysis_create = 'exploratory_data_analysis_create',
  exploratory_data_analysis_collinearity = 'exploratory_data_analysis_collinearity',
  exploratory_data_analysis_data_consistency = 'exploratory_data_analysis_data_consistency',
  exploratory_data_analysis_data_consistency_analysis = 'exploratory_data_analysis_data_consistency_analysis',
  exploratory_data_analysis_timeseries = 'exploratory_data_analysis_timeseries',

  prediction_metrics_project = 'prediction_metrics_project',
  decile_prediction_metrics_project = 'decile_prediction_metrics_project',
  prediction_metrics_add = 'prediction_metrics_add',
  prediction_metrics_list = 'prediction_metrics_list',
  prediction_metrics_detail = 'prediction_metrics_detail',
  prediction_metrics = 'prediction_metrics',
  prediction_metrics_bias = 'prediction_metrics_bias',
  prediction_metrics_type_bias = 'prediction_metrics_type_bias',
  model_metrics_summary = 'model_metrics_summary',

  monitoring_pred_log = 'monitoring_pred_log',
  monitoring_metrics = 'monitoring_metrics',
  monitoring_drift = 'monitoring_drift',
  monitoring_drift_bp = 'monitoring_drift_bp',
  monitoring = 'monitoring',
  monitoring_data_integrity = 'monitoring_data_integrity',
  realtime_data_integrity = 'realtime_data_integrity',
  monitoring_outliers = 'monitoring_outliers',
  monitoring_drift_analysis = 'monitoring_drift_analysis',

  dataset_external_import_new_version = 'dataset_external_import_new_version',
  dataset_list = 'dataset_list',
  dataset_detail = 'dataset_detail',

  dataset_streaming = 'dataset_streaming',
  dataset_schema = 'dataset_schema',
  dataset_filters = 'dataset_filters',
  dataset_schema_wizard = 'dataset_schema_wizard',
  dataset_raw_data = 'dataset_raw_data',
  dataset_data_explorer = 'dataset_data_explorer',
  dataset_augmentation = 'dataset_augmentation',
  dataset_for_usecase = 'dataset_for_usecase',
  dataset_visualize = 'dataset_visualize',
  dataset_snapshot = 'dataset_snapshot',

  dataset_add = 'dataset_add',
  dataset_attach = 'dataset_attach',
  feature_group_attach = 'feature_group_attach',
  dataset_upload = 'dataset_upload',
  dataset_upload_step2 = 'dataset_upload_step2',

  monitors_org_list = 'monitors_org_list',
  monitors_org_one = 'monitors_org_one',
  monitors_org_summary = 'monitors_org_summary',

  model_list = 'model_list',
  model_detail = 'model_detail',
  model_train = 'model_train',
  model_retrain = 'model_retrain',
  model_train_fg = 'model_train_fg',
  model_register = 'model_register',
  model_register_form = 'model_register_form',
  model_register_zip = 'model_register_zip',
  model_register_git = 'model_register_git',
  model_create_drift = 'model_create_drift',

  set_threshold = 'set_threshold',

  model_detail_monitor = 'model_detail_monitor',
  monitors_list = 'monitors_list',
  monitor_data_integrity = 'monitor_data_integrity',
  monitor_drift = 'monitor_drift',
  monitor_outliers = 'monitor_outliers',
  monitor_drift_analysis = 'monitor_drift_analysis',
  monitor_alerts = 'monitor_alerts',
  monitor_alerts_add = 'monitor_alerts_add',
  monitor_metrics = 'monitor_metrics',
  monitors_alert_list = 'monitors_alert_list',
  monitors_alert_events = 'monitors_alert_events',
  monitors_alert_add = 'monitor_alert_add',

  model_featurization = 'model_featurization',
  model_metrics = 'model_metrics',
  model_deployments = 'model_deployments',
  model_predictions = 'model_predictions',
  model_explanations = 'model_explanations',
  model_augmentation = 'model_augmentation',
  model_predictions_request = 'model_predictions_request',

  deploy_detail = 'deploy_detail',
  deploy_create = 'deploy_create',
  deploy_create_form = 'deploy_create_form',
  deploy_create_fg = 'deploy_create_fg',
  deploy_list = 'deploy_list',
  deploy_predictions_api = 'deploy_predictions_api',
  deploy_lookup_api = 'deploy_lookup_api',

  deploy_batch = 'deploy_batch',
  batchpred_datasets = 'batchpred_datasets',
  batchpred_featuregroups = 'batchpred_featuregroups',
  batchpred_create = 'batchpred_create',
  batchpred_detail = 'batchpred_detail',
  batchpred_add_fg = 'batchpred_add_fg',
  batchpred_rawdata = 'batchpred_rawdata',

  deploy_tokens_list = 'deploy_tokens_list',
  pipeline_list = 'pipeline_list',
  pipeline_details = 'pipeline_details',
  pipeline_one = 'pipeline_one',
}

export const ShowTopHeader = (mode) => {
  if (!Constants.flags.show_search_top) {
    return false;
  }
  return ![
    PartsLink.project_list,
    PartsLink.datasets_all,
    PartsLink.featuregroups_list,
    PartsLink.notebook_list,
    PartsLink.templates_list,
    PartsLink.root,
    PartsLink.finish_billing,
    PartsLink.type_access,
    PartsLink.main,
    PartsLink.accept_invite,
    PartsLink.signin,
    PartsLink.signup,
    PartsLink.signin_verify_account,
    PartsLink.signin_reset_password,
    PartsLink.signin_forgot_new,
    PartsLink.signin_password,
  ].includes(mode);
};

export default PartsLink;
