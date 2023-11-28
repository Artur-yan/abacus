import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import MainPageRoute from '../pages/MainPageRoute/MainPageRoute';
import PartsLink from './components/NavLeft/PartsLink';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Redirect({ to }) {
  let navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  });
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/app" element={<MainPageRoute mode={PartsLink.root} />} />
      <Route path="/app/" element={<MainPageRoute mode={PartsLink.root} />} />

      <Route path={'/app/' + PartsLink.welcome} element={<MainPageRoute mode={PartsLink.welcome} />} />

      <Route path={'/app/' + PartsLink.config_2fa} element={<MainPageRoute mode={PartsLink.config_2fa} />} />
      <Route path={'/app/' + PartsLink.signup + '/:email'} element={<MainPageRoute mode={PartsLink.signup} />} />
      <Route path={'/app/' + PartsLink.signup} element={<MainPageRoute mode={PartsLink.signup} />} />
      <Route path={'/app/' + PartsLink.workspace_join + '?allowBack=:allowBack'} element={<MainPageRoute mode={PartsLink.workspace_join} />} />
      <Route path={'/app/' + PartsLink.workspace_join + '/:workspacename'} element={<MainPageRoute mode={PartsLink.workspace_join} />} />
      <Route path={'/app/' + PartsLink.workspace_join} element={<MainPageRoute mode={PartsLink.workspace_join} />} />
      <Route path={'/app/' + PartsLink.signin + '/:email?inviteId=:inviteId&organizationId=:organizationId'} element={<MainPageRoute mode={PartsLink.signin} />} />
      <Route path={'/app/' + PartsLink.signin + '/:email'} element={<MainPageRoute mode={PartsLink.signin} />} />
      <Route path={'/app/' + PartsLink.signin} element={<MainPageRoute mode={PartsLink.signin} />} />
      <Route path={'/app/' + PartsLink.change_email + '/:email'} element={<MainPageRoute mode={PartsLink.change_email} />} />
      <Route path={'/app/' + PartsLink.change_email} element={<MainPageRoute mode={PartsLink.change_email} />} />
      <Route path={'/app/' + PartsLink.change_password} element={<MainPageRoute mode={PartsLink.change_password} />} />
      <Route path={'/app/' + PartsLink.signin_password + '/:email'} element={<MainPageRoute mode={PartsLink.signin_password} />} />
      <Route path={'/app/' + PartsLink.signin_password} element={<MainPageRoute mode={PartsLink.signin_password} />} />
      <Route path={'/app/' + PartsLink.signin_forgot_new + '/:userId/:token'} element={<MainPageRoute mode={PartsLink.signin_forgot_new} />} />
      <Route path={'/app/' + PartsLink.signin_reset_password + '/:email'} element={<MainPageRoute mode={PartsLink.signin_reset_password} />} />
      <Route path={'/app/' + PartsLink.signin_reset_password} element={<MainPageRoute mode={PartsLink.signin_reset_password} />} />
      <Route path={'/app/' + PartsLink.signin_verify_account + '/:userId/:verificationToken'} element={<MainPageRoute mode={PartsLink.signin_verify_account} />} />
      <Route path={'/app/' + PartsLink.signin_verify_account + '/:userId'} element={<MainPageRoute mode={PartsLink.signin_verify_account} />} />
      <Route path={'/app/' + PartsLink.signin_verify_account} element={<MainPageRoute mode={PartsLink.signin_verify_account} />} />
      <Route path={'/app/' + PartsLink.accept_invite + '/:email/:organizationId/:inviteId'} element={<MainPageRoute mode={PartsLink.accept_invite} />} />

      <Route path={'/app/' + PartsLink.finish_billing} element={<MainPageRoute mode={PartsLink.finish_billing} />} />
      <Route path={'/app/' + PartsLink.price_lists} element={<MainPageRoute mode={PartsLink.price_lists} />} />

      <Route path={'/app/' + PartsLink.profile + '/:section'} element={<MainPageRoute mode={PartsLink.profile} />} />
      <Route path={'/app/' + PartsLink.profile} element={<MainPageRoute mode={PartsLink.profile} />} />

      <Route path={'/app/' + PartsLink.algorithm_one} element={<MainPageRoute mode={PartsLink.algorithm_one} />} />
      <Route path={'/app/' + PartsLink.algorithm_one + '/:projectId'} element={<MainPageRoute mode={PartsLink.algorithm_one} />} />
      <Route path={'/app/' + PartsLink.algorithm_one + '/:projectId/:algorithmId'} element={<MainPageRoute mode={PartsLink.algorithm_one} />} />
      <Route path={'/app/' + PartsLink.algorithm_list} element={<MainPageRoute mode={PartsLink.algorithm_list} />} />
      <Route path={'/app/' + PartsLink.algorithm_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.algorithm_list} />} />

      <Route path={'/app/' + PartsLink.agent_one} element={<MainPageRoute mode={PartsLink.agent_one} />} />
      <Route path={'/app/' + PartsLink.agent_one + '/:projectId'} element={<MainPageRoute mode={PartsLink.agent_one} />} />
      <Route path={'/app/' + PartsLink.agent_one + '/:projectId/:agentId'} element={<MainPageRoute mode={PartsLink.agent_one} />} />

      <Route path={'/app/' + PartsLink.module_one} element={<MainPageRoute mode={PartsLink.module_one} />} />
      <Route path={'/app/' + PartsLink.module_one + '/:projectId'} element={<MainPageRoute mode={PartsLink.module_one} />} />
      <Route path={'/app/' + PartsLink.module_one + '/:projectId/:name'} element={<MainPageRoute mode={PartsLink.module_one} />} />
      <Route path={'/app/' + PartsLink.modules_list} element={<MainPageRoute mode={PartsLink.modules_list} />} />
      <Route path={'/app/' + PartsLink.modules_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.modules_list} />} />

      <Route path={'/app/' + PartsLink.python_functions_one} element={<MainPageRoute mode={PartsLink.python_functions_one} />} />
      <Route path={'/app/' + PartsLink.python_functions_one + '/:projectId'} element={<MainPageRoute mode={PartsLink.python_functions_one} />} />
      <Route path={'/app/' + PartsLink.python_functions_one + '/:projectId/:name'} element={<MainPageRoute mode={PartsLink.python_functions_one} />} />
      <Route path={'/app/' + PartsLink.python_functions_list} element={<MainPageRoute mode={PartsLink.python_functions_list} />} />
      <Route path={'/app/' + PartsLink.python_functions_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.python_functions_list} />} />
      <Route path={'/app/' + PartsLink.python_functions_edit + '/:projectId/:pythonFunctionName'} element={<MainPageRoute mode={PartsLink.python_functions_edit} />} />

      <Route path={'/app/' + PartsLink.custom_loss_function_one} element={<MainPageRoute mode={PartsLink.custom_loss_function_one} />} />
      <Route path={'/app/' + PartsLink.custom_loss_function_one + '/:projectId'} element={<MainPageRoute mode={PartsLink.custom_loss_function_one} />} />
      <Route path={'/app/' + PartsLink.custom_loss_function_one + '/:projectId/:name'} element={<MainPageRoute mode={PartsLink.custom_loss_function_one} />} />
      <Route path={'/app/' + PartsLink.custom_loss_functions_list} element={<MainPageRoute mode={PartsLink.custom_loss_functions_list} />} />
      <Route path={'/app/' + PartsLink.custom_loss_functions_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.custom_loss_functions_list} />} />
      <Route path={'/app/' + PartsLink.notebook_template_list} element={<MainPageRoute mode={PartsLink.notebook_template_list} />} />
      <Route path={'/app/' + PartsLink.notebook_template_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.notebook_template_list} />} />
      <Route path={'/app/' + PartsLink.notebook_template_details} element={<MainPageRoute mode={PartsLink.notebook_template_details} />} />
      <Route path={'/app/' + PartsLink.notebook_template_details + '/:projectId/:notebookTemplateId'} element={<MainPageRoute mode={PartsLink.notebook_template_details} />} />

      <Route path={'/app/' + PartsLink.custom_metric_one} element={<MainPageRoute mode={PartsLink.custom_metric_one} />} />
      <Route path={'/app/' + PartsLink.custom_metric_one + '/:projectId'} element={<MainPageRoute mode={PartsLink.custom_metric_one} />} />
      <Route path={'/app/' + PartsLink.custom_metric_one + '/:projectId/:name'} element={<MainPageRoute mode={PartsLink.custom_metric_one} />} />
      <Route path={'/app/' + PartsLink.custom_metrics_list} element={<MainPageRoute mode={PartsLink.custom_metrics_list} />} />
      <Route path={'/app/' + PartsLink.custom_metrics_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.custom_metrics_list} />} />

      <Route path={'/app/' + PartsLink.feature_groups + '/:projectId'} element={<MainPageRoute mode={PartsLink.feature_groups} />} />
      <Route path={'/app/' + PartsLink.feature_groups_add + '/:projectId'} element={<MainPageRoute mode={PartsLink.feature_groups_add} />} />
      <Route path={'/app/' + PartsLink.feature_groups_edit + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_edit} />} />
      <Route path={'/app/' + PartsLink.feature_groups_history + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_history} />} />
      <Route path={'/app/' + PartsLink.feature_groups_template_add} element={<MainPageRoute mode={PartsLink.feature_groups_template_add} />} />
      <Route path={'/app/' + PartsLink.feature_groups_template_add + '/:projectId'} element={<MainPageRoute mode={PartsLink.feature_groups_template_add} />} />
      <Route path={'/app/' + PartsLink.feature_groups_template_add + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_template_add} />} />
      <Route path={'/app/' + PartsLink.feature_groups_template + '/:projectId/:featureGroupTemplateId'} element={<MainPageRoute mode={PartsLink.feature_groups_template} />} />
      <Route path={'/app/' + PartsLink.feature_groups_template_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.feature_groups_template_list} />} />
      <Route path={'/app/' + PartsLink.feature_groups_template_list + '/:projectId/:featureGroupTemplateId'} element={<MainPageRoute mode={PartsLink.feature_groups_template_list} />} />

      <Route path={'/app/' + PartsLink.document_retriever_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.document_retriever_list} />} />
      <Route path={'/app/' + PartsLink.document_retriever_create + '/:projectId'} element={<MainPageRoute mode={PartsLink.document_retriever_create} />} />
      <Route path={'/app/' + PartsLink.document_retriever_edit + '/:projectId/:documentRetrieverId'} element={<MainPageRoute mode={PartsLink.document_retriever_edit} />} />
      <Route path={'/app/' + PartsLink.document_retriever_detail + '/:projectId'} element={<MainPageRoute mode={PartsLink.document_retriever_detail} />} />
      <Route path={'/app/' + PartsLink.document_retriever_detail + '/:projectId/:documentRetrieverId'} element={<MainPageRoute mode={PartsLink.document_retriever_detail} />} />

      <Route path={'/app/' + PartsLink.exploratory_data_analysis + '/:projectId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_graphs + '/:projectId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_graphs} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_graphs + '/:projectId/:edaId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_graphs} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_graphs_org} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_graphs_org} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_graphs_one + '/:projectId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_graphs_one} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_graphs_one + '/:projectId/:edaId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_graphs_one} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_graphs_one_add_function + '/:projectId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_graphs_one_add_function} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_detail + '/:projectId/:edaId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_detail} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_create + '/:projectId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_create} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_collinearity + '/:projectId/:edaId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_collinearity} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_data_consistency + '/:projectId/:edaId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_data_consistency} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_data_consistency_analysis + '/:projectId/:edaId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_data_consistency_analysis} />} />
      <Route path={'/app/' + PartsLink.exploratory_data_analysis_timeseries + '/:projectId/:edaId'} element={<MainPageRoute mode={PartsLink.exploratory_data_analysis_timeseries} />} />

      <Route path={'/app/' + PartsLink.python_function_detail + '/:projectId/:pythonFunctionName'} element={<MainPageRoute mode={PartsLink.python_function_detail} />} />
      <Route path={'/app/' + PartsLink.prediction_metrics_add + '/:projectId'} element={<MainPageRoute mode={PartsLink.prediction_metrics_add} />} />
      <Route path={'/app/' + PartsLink.prediction_metrics_project + '/:projectId'} element={<MainPageRoute mode={PartsLink.prediction_metrics_project} />} />
      <Route path={'/app/' + PartsLink.decile_prediction_metrics_project + '/:projectId/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.decile_prediction_metrics_project} />} />
      <Route path={'/app/' + PartsLink.prediction_metrics_list + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.prediction_metrics_list} />} />
      <Route path={'/app/' + PartsLink.prediction_metrics_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.prediction_metrics_list} />} />
      <Route path={'/app/' + PartsLink.prediction_metrics_detail + '/:projectId/:predictionMetricsId'} element={<MainPageRoute mode={PartsLink.prediction_metrics_detail} />} />
      <Route path={'/app/' + PartsLink.prediction_metrics + '/:projectId/:predictionMetricsId'} element={<MainPageRoute mode={PartsLink.prediction_metrics} />} />
      <Route path={'/app/' + PartsLink.prediction_metrics_bias + '/:projectId/:predictionMetricsId'} element={<MainPageRoute mode={PartsLink.prediction_metrics_bias} />} />
      <Route path={'/app/' + PartsLink.prediction_metrics_type_bias + '/:projectId/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.prediction_metrics_type_bias} />} />
      <Route path={'/app/' + PartsLink.feature_groups_export + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_export} />} />
      <Route path={'/app/' + PartsLink.feature_groups_snapshot + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_snapshot} />} />
      <Route path={'/app/' + PartsLink.feature_groups_export_add + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_export_add} />} />
      <Route path={'/app/' + PartsLink.feature_groups_schedule_add + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_schedule_add} />} />
      <Route path={'/app/' + PartsLink.feature_groups_transform + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_transform} />} />
      <Route path={'/app/' + PartsLink.feature_groups_merge + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_merge} />} />
      <Route path={'/app/' + PartsLink.feature_groups_sampling + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_sampling} />} />
      <Route path={'/app/' + PartsLink.features_list + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.features_list} />} />
      <Route path={'/app/' + PartsLink.features_rawdata + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.features_rawdata} />} />
      <Route path={'/app/' + PartsLink.annotations_edit + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.annotations_edit} />} />
      <Route path={'/app/' + PartsLink.dagviewer + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.dagviewer} />} />
      <Route path={'/app/' + PartsLink.features_add + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.features_add} />} />
      <Route path={'/app/' + PartsLink.features_add_point_in_time_group + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.features_add_point_in_time_group} />} />
      <Route path={'/app/' + PartsLink.features_add_point_in_time + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.features_add_point_in_time} />} />
      <Route path={'/app/' + PartsLink.features_add_nested + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.features_add_nested} />} />
      <Route path={'/app/' + PartsLink.model_train_fg + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_train_fg} />} />
      <Route path={'/app/' + PartsLink.model_register + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_register} />} />
      <Route path={'/app/' + PartsLink.model_register_form + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_register_form} />} />
      <Route path={'/app/' + PartsLink.model_register_zip + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_register_zip} />} />
      <Route path={'/app/' + PartsLink.model_register_git + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_register_git} />} />
      <Route path={'/app/' + PartsLink.model_create_drift + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_create_drift} />} />
      <Route path={'/app/' + PartsLink.feature_group_detail + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_group_detail} />} />
      <Route path={'/app/' + PartsLink.feature_groups_data_explorer + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_data_explorer} />} />
      <Route path={'/app/' + PartsLink.feature_groups_explorer + '/:projectId'} element={<MainPageRoute mode={PartsLink.feature_groups_explorer} />} />
      <Route path={'/app/' + PartsLink.pretrained_models_add + '/:projectId'} element={<MainPageRoute mode={PartsLink.pretrained_models_add} />} />
      <Route path={'/app/' + PartsLink.feature_groups_constraint + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_constraint} />} />
      <Route path={'/app/' + PartsLink.feature_groups_constraint_add + '/:projectId/:featureGroupId'} element={<MainPageRoute mode={PartsLink.feature_groups_constraint_add} />} />

      <Route path={'/app/' + PartsLink.realtime_data_integrity + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.realtime_data_integrity} />} />
      <Route path={'/app/' + PartsLink.realtime_data_integrity + '/:projectId'} element={<MainPageRoute mode={PartsLink.realtime_data_integrity} />} />
      <Route path={'/app/' + PartsLink.monitoring_data_integrity + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.monitoring_data_integrity} />} />
      <Route path={'/app/' + PartsLink.monitoring_data_integrity + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitoring_data_integrity} />} />
      <Route path={'/app/' + PartsLink.monitoring_drift_bp + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.monitoring_drift_bp} />} />
      <Route path={'/app/' + PartsLink.monitoring_drift_bp + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitoring_drift_bp} />} />
      <Route path={'/app/' + PartsLink.monitoring_drift + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.monitoring_drift} />} />
      <Route path={'/app/' + PartsLink.monitoring_drift + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitoring_drift} />} />
      <Route path={'/app/' + PartsLink.monitoring_metrics + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.monitoring_metrics} />} />
      <Route path={'/app/' + PartsLink.monitoring_metrics + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitoring_metrics} />} />
      <Route path={'/app/' + PartsLink.monitoring + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.monitoring} />} />
      <Route path={'/app/' + PartsLink.monitoring + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitoring} />} />
      <Route path={'/app/' + PartsLink.monitoring_pred_log + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.monitoring_pred_log} />} />
      <Route path={'/app/' + PartsLink.monitoring_pred_log + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitoring_pred_log} />} />
      <Route path={'/app/' + PartsLink.monitoring_outliers + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.monitoring_outliers} />} />
      <Route path={'/app/' + PartsLink.monitoring_outliers + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitoring_outliers} />} />

      <Route path={'/app/' + PartsLink.dataset_list} element={<MainPageRoute mode={PartsLink.dataset_list} />} />
      <Route path={'/app/' + PartsLink.dataset_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_list} />} />

      <Route path={'/app/' + PartsLink.dataset_add + '/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_add} />} />
      <Route path={'/app/' + PartsLink.dataset_attach + '/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_attach} />} />
      <Route path={'/app/' + PartsLink.feature_group_attach + '/:projectId'} element={<MainPageRoute mode={PartsLink.feature_group_attach} />} />
      <Route path={'/app/' + PartsLink.dataset_upload} element={<MainPageRoute mode={PartsLink.dataset_upload} />} />
      <Route path={'/app/' + PartsLink.dataset_upload + '/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_upload} />} />
      <Route path={'/app/' + PartsLink.dataset_upload_step2 + '/:name/:datasetType/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_upload_step2} />} />
      <Route path={'/app/' + PartsLink.dataset_upload_step2 + '/:name/:datasetType'} element={<MainPageRoute mode={PartsLink.dataset_upload_step2} />} />
      <Route path={'/app/' + PartsLink.dataset_upload_step2 + '/:name'} element={<MainPageRoute mode={PartsLink.dataset_upload_step2} />} />
      <Route path={'/app/' + PartsLink.dataset_upload_step2} element={<MainPageRoute mode={PartsLink.dataset_upload_step2} />} />
      <Route path={'/app/' + PartsLink.dataset_detail + '/:datasetId'} element={<MainPageRoute mode={PartsLink.dataset_detail} />} />
      <Route path={'/app/' + PartsLink.dataset_detail + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_detail} />} />
      <Route path={'/app/' + PartsLink.dataset_snapshot + '/:datasetId'} element={<MainPageRoute mode={PartsLink.dataset_snapshot} />} />
      <Route path={'/app/' + PartsLink.dataset_snapshot + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_snapshot} />} />
      <Route path={'/app/' + PartsLink.dataset_external_import_new_version + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_external_import_new_version} />} />

      <Route path={'/app/' + PartsLink.dataset_streaming + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_streaming} />} />
      <Route path={'/app/' + PartsLink.dataset_streaming + '/:datasetId'} element={<MainPageRoute mode={PartsLink.dataset_streaming} />} />
      <Route path={'/app/' + PartsLink.dataset_schema_wizard + '/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_schema_wizard} />} />
      <Route path={'/app/' + PartsLink.dataset_schema + '/:datasetId'} element={<MainPageRoute mode={PartsLink.dataset_schema} />} />
      <Route path={'/app/' + PartsLink.dataset_schema + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_schema} />} />
      <Route path={'/app/' + PartsLink.dataset_for_usecase + '/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_for_usecase} />} />
      <Route path={'/app/' + PartsLink.dataset_data_explorer + '/:datasetId'} element={<MainPageRoute mode={PartsLink.dataset_data_explorer} />} />
      <Route path={'/app/' + PartsLink.dataset_data_explorer + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_data_explorer} />} />
      <Route path={'/app/' + PartsLink.dataset_raw_data + '/:datasetId'} element={<MainPageRoute mode={PartsLink.dataset_raw_data} />} />
      <Route path={'/app/' + PartsLink.dataset_raw_data + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_raw_data} />} />
      <Route path={'/app/' + PartsLink.dataset_augmentation + '/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_augmentation} />} />
      <Route path={'/app/' + PartsLink.dataset_augmentation + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_augmentation} />} />
      <Route path={'/app/' + PartsLink.dataset_visualize + '/:datasetId/:projectId'} element={<MainPageRoute mode={PartsLink.dataset_visualize} />} />

      <Route path={'/app/' + PartsLink.webhook_add + '/:projectId'} element={<MainPageRoute mode={PartsLink.webhook_add} />} />
      <Route path={'/app/' + PartsLink.webhook_one + '/:projectId/:webhookId'} element={<MainPageRoute mode={PartsLink.webhook_one} />} />
      <Route path={'/app/' + PartsLink.webhook_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.webhook_list} />} />

      <Route path={'/app/' + PartsLink.template_one + '/:featureGroupTemplateId'} element={<MainPageRoute mode={PartsLink.template_one} />} />
      <Route path={'/app/' + PartsLink.template_detail + '/:featureGroupTemplateId'} element={<MainPageRoute mode={PartsLink.template_detail} />} />
      <Route path={'/app/' + PartsLink.templates_list} element={<MainPageRoute mode={PartsLink.templates_list} />} />
      <Route path={'/app/' + PartsLink.templates_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.templates_list} />} />
      <Route path={'/app/' + PartsLink.notebook_list} element={<MainPageRoute mode={PartsLink.notebook_list} />} />
      <Route path={'/app/' + PartsLink.notebook_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.notebook_list} />} />
      <Route path={'/app/' + PartsLink.featuregroups_list} element={<MainPageRoute mode={PartsLink.featuregroups_list} />} />
      <Route path={'/app/' + PartsLink.project_dashboard + '/:projectId'} element={<MainPageRoute mode={PartsLink.project_dashboard} />} />
      <Route path={'/app/' + PartsLink.project_dashboard + '/:projectId?doUpload=:doUpload'} element={<MainPageRoute mode={PartsLink.project_dashboard} />} />
      <Route path={'/app/' + PartsLink.project_list} element={<MainPageRoute mode={PartsLink.project_list} />} />
      <Route path={'/app/' + PartsLink.project_add} element={<MainPageRoute mode={PartsLink.project_add} />} />
      <Route path={'/app/' + PartsLink.docker_add + '/:projectId'} element={<MainPageRoute mode={PartsLink.docker_add} />} />
      <Route path={'/app/' + PartsLink.datasets_all} element={<MainPageRoute mode={PartsLink.datasets_all} />} />

      <Route path={'/app/' + PartsLink.notebook_one + '/:projectId/:notebookId'} element={<MainPageRoute mode={PartsLink.notebook_one} />} />
      <Route path={'/app/' + PartsLink.fast_notebook + '/:projectId'} element={<MainPageRoute mode={PartsLink.fast_notebook} />} />
      <Route path={'/app/' + PartsLink.fast_notebook + '/:projectId/:notebookId'} element={<MainPageRoute mode={PartsLink.fast_notebook} />} />
      <Route path={'/app/' + PartsLink.notebook_details + '/:projectId/:notebookId'} element={<MainPageRoute mode={PartsLink.notebook_details} />} />
      <Route path={'/app/' + PartsLink.notebook_fg + '/:projectId'} element={<MainPageRoute mode={PartsLink.notebook_fg} />} />
      <Route path={'/app/' + PartsLink.notebook_fg + '/:projectId/:notebookId'} element={<MainPageRoute mode={PartsLink.notebook_fg} />} />
      <Route path={'/app/' + PartsLink.notebook_model + '/:projectId'} element={<MainPageRoute mode={PartsLink.notebook_model} />} />
      <Route path={'/app/' + PartsLink.notebook_model + '/:projectId/:notebookId'} element={<MainPageRoute mode={PartsLink.notebook_model} />} />

      <Route path={'/app/' + PartsLink.project_data_augmentation + '/:projectId'} element={<MainPageRoute mode={PartsLink.project_data_augmentation} />} />
      <Route path={'/app/' + PartsLink.rawdata_visual + '/:projectId'} element={<MainPageRoute mode={PartsLink.rawdata_visual} />} />

      <Route path={'/app/' + PartsLink.model_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_list} />} />
      <Route path={'/app/' + PartsLink.model_list} element={<MainPageRoute mode={PartsLink.model_list} />} />

      <Route path={'/app/' + PartsLink.model_train + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_train} />} />
      <Route path={'/app/' + PartsLink.model_train} element={<MainPageRoute mode={PartsLink.model_train} />} />
      <Route path={'/app/' + PartsLink.model_retrain + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_retrain} />} />
      <Route path={'/app/' + PartsLink.model_retrain} element={<MainPageRoute mode={PartsLink.model_retrain} />} />
      <Route path={'/app/' + PartsLink.model_detail + '/:modelId/:projectId'} element={<MainPageRoute mode={PartsLink.model_detail} />} />
      <Route path={'/app/' + PartsLink.model_detail + '/:modelId'} element={<MainPageRoute mode={PartsLink.model_detail} />} />
      <Route path={'/app/' + PartsLink.model_detail_monitor + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.model_detail_monitor} />} />
      <Route path={'/app/' + PartsLink.model_detail_monitor + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.model_detail_monitor} />} />
      <Route path={'/app/' + PartsLink.monitor_data_integrity + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitor_data_integrity} />} />
      <Route path={'/app/' + PartsLink.monitor_data_integrity + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitor_data_integrity} />} />
      <Route path={'/app/' + PartsLink.monitor_drift + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitor_drift} />} />
      <Route path={'/app/' + PartsLink.monitor_drift + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitor_drift} />} />
      <Route path={'/app/' + PartsLink.monitor_outliers + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitor_outliers} />} />
      <Route path={'/app/' + PartsLink.monitor_outliers + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitor_outliers} />} />
      <Route path={'/app/' + PartsLink.monitor_drift_analysis + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitor_drift_analysis} />} />
      <Route path={'/app/' + PartsLink.monitor_drift_analysis + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitor_drift_analysis} />} />
      <Route path={'/app/' + PartsLink.monitoring_drift_analysis + '/:projectId/:batchPredId'} element={<MainPageRoute mode={PartsLink.monitoring_drift_analysis} />} />
      <Route path={'/app/' + PartsLink.monitoring_drift_analysis + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitoring_drift_analysis} />} />

      <Route path={'/app/' + PartsLink.monitors_alert_events + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitors_alert_events} />} />
      <Route path={'/app/' + PartsLink.monitors_alert_events + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitors_alert_events} />} />
      <Route path={'/app/' + PartsLink.monitors_alert_list + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitors_alert_list} />} />
      <Route path={'/app/' + PartsLink.monitors_alert_list + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitors_alert_list} />} />
      <Route path={'/app/' + PartsLink.monitors_alert_add + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitors_alert_add} />} />
      <Route path={'/app/' + PartsLink.monitors_alert_add + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitors_alert_add} />} />

      <Route path={'/app/' + PartsLink.monitor_alerts + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitor_alerts} />} />
      <Route path={'/app/' + PartsLink.monitor_alerts + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitor_alerts} />} />
      <Route path={'/app/' + PartsLink.monitor_metrics + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitor_metrics} />} />
      <Route path={'/app/' + PartsLink.monitor_metrics + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitor_metrics} />} />
      <Route path={'/app/' + PartsLink.monitor_alerts_add + '/:modelMonitorId/:projectId'} element={<MainPageRoute mode={PartsLink.monitor_alerts_add} />} />
      <Route path={'/app/' + PartsLink.monitor_alerts_add + '/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitor_alerts_add} />} />
      <Route path={'/app/' + PartsLink.monitors_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitors_list} />} />
      <Route path={'/app/' + PartsLink.monitors_list} element={<MainPageRoute mode={PartsLink.monitors_list} />} />

      <Route path={'/app/' + PartsLink.monitors_org_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitors_org_list} />} />
      <Route path={'/app/' + PartsLink.monitors_org_list} element={<MainPageRoute mode={PartsLink.monitors_org_list} />} />
      <Route path={'/app/' + PartsLink.monitors_org_one + '/:projectId/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.monitors_org_one} />} />
      <Route path={'/app/' + PartsLink.monitors_org_one} element={<MainPageRoute mode={PartsLink.monitors_org_one} />} />
      <Route path={'/app/' + PartsLink.monitors_org_summary + '/:projectId'} element={<MainPageRoute mode={PartsLink.monitors_org_summary} />} />
      <Route path={'/app/' + PartsLink.monitors_org_summary} element={<MainPageRoute mode={PartsLink.monitors_org_summary} />} />

      <Route path={'/app/' + PartsLink.model_featurization} element={<MainPageRoute mode={PartsLink.model_featurization} />} />
      <Route path={'/app/' + PartsLink.model_metrics + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_metrics} />} />
      <Route path={'/app/' + PartsLink.model_metrics_summary + '/:projectId/:modelMonitorId'} element={<MainPageRoute mode={PartsLink.model_metrics_summary} />} />
      <Route path={'/app/' + PartsLink.model_metrics} element={<MainPageRoute mode={PartsLink.model_metrics} />} />
      <Route path={'/app/' + PartsLink.model_predictions_request + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.model_predictions_request} />} />
      <Route path={'/app/' + PartsLink.model_predictions_request + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_predictions_request} />} />
      <Route path={'/app/' + PartsLink.model_predictions_request} element={<MainPageRoute mode={PartsLink.model_predictions_request} />} />
      <Route path={'/app/' + PartsLink.model_predictions + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.model_predictions} />} />
      <Route path={'/app/' + PartsLink.model_predictions + '/:projectId/:deployId/?share=:deploymentConversationId'} element={<MainPageRoute mode={PartsLink.model_predictions} />} />
      <Route path={'/app/' + PartsLink.model_predictions + '/:projectId/:deployId/:deploymentConversationId'} element={<MainPageRoute mode={PartsLink.model_predictions} />} />
      <Route path={'/app/' + PartsLink.model_predictions + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_predictions} />} />
      <Route path={'/app/' + PartsLink.model_predictions} element={<MainPageRoute mode={PartsLink.model_predictions} />} />
      <Route path={'/app/' + PartsLink.model_explanations + '/:projectId'} element={<MainPageRoute mode={PartsLink.model_explanations} />} />
      <Route path={'/app/' + PartsLink.model_explanations} element={<MainPageRoute mode={PartsLink.model_explanations} />} />
      <Route path={'/app/' + PartsLink.model_augmentation + '/:modelId/:projectId'} element={<MainPageRoute mode={PartsLink.model_augmentation} />} />

      <Route path={'/app/' + PartsLink.type_access} element={<MainPageRoute mode={PartsLink.type_access} />} />
      <Route path={'/app/' + PartsLink.select_labeled} element={<MainPageRoute mode={PartsLink.select_labeled} />} />

      <Route path={'/app/' + PartsLink.deploy_create_fg + '/:featureGroupId/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_create_fg} />} />
      <Route path={'/app/' + PartsLink.deploy_create_fg + '/:featureGroupId'} element={<MainPageRoute mode={PartsLink.deploy_create_fg} />} />
      <Route path={'/app/' + PartsLink.deploy_create + '/:modelId/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_create} />} />
      <Route path={'/app/' + PartsLink.deploy_create + '/:modelId'} element={<MainPageRoute mode={PartsLink.deploy_create} />} />
      <Route path={'/app/' + PartsLink.deploy_create_form + '/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_create_form} />} />
      <Route path={'/app/' + PartsLink.deploy_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_list} />} />
      <Route path={'/app/' + PartsLink.deploy_list + '/:modelId/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_list} />} />
      <Route path={'/app/' + PartsLink.deploy_detail + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.deploy_detail} />} />
      <Route path={'/app/' + PartsLink.deploy_detail + '/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_detail} />} />
      <Route path={'/app/' + PartsLink.deploy_predictions_api + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.deploy_predictions_api} />} />
      <Route path={'/app/' + PartsLink.deploy_predictions_api + '/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_predictions_api} />} />
      <Route path={'/app/' + PartsLink.deploy_lookup_api + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.deploy_lookup_api} />} />
      <Route path={'/app/' + PartsLink.deploy_lookup_api + '/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_lookup_api} />} />

      <Route path={'/app/' + PartsLink.set_threshold + '/:projectId'} element={<MainPageRoute mode={PartsLink.set_threshold} />} />

      <Route path={'/app/' + PartsLink.deploy_batch + '/:projectId/:deployId'} element={<MainPageRoute mode={PartsLink.deploy_batch} />} />
      <Route path={'/app/' + PartsLink.deploy_batch + '/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_batch} />} />
      <Route path={'/app/' + PartsLink.batchpred_datasets + '/:projectId/:batchPredId'} element={<MainPageRoute mode={PartsLink.batchpred_datasets} />} />
      <Route path={'/app/' + PartsLink.batchpred_datasets + '/:projectId'} element={<MainPageRoute mode={PartsLink.batchpred_datasets} />} />
      <Route path={'/app/' + PartsLink.batchpred_featuregroups + '/:projectId/:batchPredId'} element={<MainPageRoute mode={PartsLink.batchpred_featuregroups} />} />
      <Route path={'/app/' + PartsLink.batchpred_featuregroups + '/:projectId'} element={<MainPageRoute mode={PartsLink.batchpred_featuregroups} />} />
      <Route path={'/app/' + PartsLink.batchpred_create + '/:projectId/:batchPredId'} element={<MainPageRoute mode={PartsLink.batchpred_create} />} />
      <Route path={'/app/' + PartsLink.batchpred_create + '/:projectId'} element={<MainPageRoute mode={PartsLink.batchpred_create} />} />
      <Route path={'/app/' + PartsLink.batchpred_detail + '/:projectId/:batchPredId'} element={<MainPageRoute mode={PartsLink.batchpred_detail} />} />
      <Route path={'/app/' + PartsLink.batchpred_detail + '/:projectId'} element={<MainPageRoute mode={PartsLink.batchpred_detail} />} />
      <Route path={'/app/' + PartsLink.batchpred_add_fg + '/:projectId/:batchPredId'} element={<MainPageRoute mode={PartsLink.batchpred_add_fg} />} />
      <Route path={'/app/' + PartsLink.batchpred_add_fg + '/:projectId'} element={<MainPageRoute mode={PartsLink.batchpred_add_fg} />} />
      <Route path={'/app/' + PartsLink.batchpred_rawdata + '/:projectId/:batchPredId'} element={<MainPageRoute mode={PartsLink.batchpred_rawdata} />} />
      <Route path={'/app/' + PartsLink.batchpred_rawdata + '/:projectId'} element={<MainPageRoute mode={PartsLink.batchpred_rawdata} />} />

      <Route path={'/app/' + PartsLink.deploy_tokens_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.deploy_tokens_list} />} />

      <Route path={'/app/' + PartsLink.search_adv} element={<MainPageRoute mode={PartsLink.search_adv} />} />
      <Route path={'/app/' + PartsLink.storage_browser} element={<MainPageRoute mode={PartsLink.storage_browser} />} />

      <Route path={'/app/' + PartsLink.pipeline_list} element={<MainPageRoute mode={PartsLink.pipeline_list} />} />
      <Route path={'/app/' + PartsLink.pipeline_list + '/:projectId'} element={<MainPageRoute mode={PartsLink.pipeline_list} />} />
      <Route path={'/app/' + PartsLink.pipeline_details} element={<MainPageRoute mode={PartsLink.pipeline_details} />} />
      <Route path={'/app/' + PartsLink.pipeline_details + '/:projectId'} element={<MainPageRoute mode={PartsLink.pipeline_details} />} />
      <Route path={'/app/' + PartsLink.pipeline_details + '/:projectId/:pipelineId'} element={<MainPageRoute mode={PartsLink.pipeline_details} />} />
      <Route path={'/app/' + PartsLink.pipeline_one + '/:projectId/:pipelineId'} element={<MainPageRoute mode={PartsLink.pipeline_one} />} />

      <Route path="/app/login" element={<MainPageRoute mode={'login'} />} />

      <Route path="*" element={<Redirect to={'/app'} />} />
    </Routes>
  );
}

export default AppRoutes;
