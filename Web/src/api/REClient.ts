import * as Sentry from '@sentry/browser';
import axios from 'axios';
import * as Bluebird from 'bluebird';
import * as $ from 'jquery';
import process from 'process';
import Utils from '../../core/Utils';
import REActions from '../actions/REActions';
import { FGLockType } from '../components/FeatureGroups/FGLangType';
import { IMetricsFolderData } from '../components/MetricsFolderOne/MetricsFolderOne';
import { IChatMsgOne } from '../components/ModelPredictionsChatOne/ModelPredictionsChatMsgOne';
import PartsLink from '../components/NavLeft/PartsLink';
import { EWebhookEventType } from '../components/WebhookList/WebhookIdHelpers';
import Constants from '../constants/Constants';
import { PythonFunctionTypeParam } from '../stores/reducers/pythonFunctions';

const _ = require('lodash');
const cookies = require('browser-cookies');
const Batch = require('batch');

let staticClient = null;
let staticPromises = null;
let staticPromisesV2 = null;

export interface ICallApiOptions {
  extraHeaders?: { [key: string]: any };
  doNotSendExtraHeader?: boolean;
  forceUrl?: boolean;
  contentType?: string;
  dataType?: string;
  skipJson?: boolean;
  ignoreRepeated?: boolean | number;
  changeURLNewWindow?: boolean;
  changeURL?: boolean;
  queue?: boolean;
  ignoreNeedLogin?: boolean;
  ignoreOrgChange?: boolean;
  method?: string;
  timeoutSecs?: number;
  successEqualTrue?: boolean;
  progress?: (bytes: number, total: number) => void;
  progressUpload?: (bytes: number, total: number) => void;
}

export const startsWithInt = (value, start) => {
  if (value == null || start == null) {
    return false;
  }

  if (value.toLowerCase() === start.toLowerCase()) {
    return true;
  }
  if (_.startsWith(value.toLowerCase(), (start + '/').toLowerCase())) {
    return true;
  }
  return false;
};

export enum DatasetTypeEnum {
  custom = 'Custom',
  timeseries = 'Time Series',
  metadata = 'Item Metadata',
  table = 'Tabular Data',
}

interface IREClient_ {
  callApi_: (
    queryUrl?: string,
    postBody?,
    cbFinish?,
    callType?,
    options?: { method?: string; timeoutSecs?: number; successEqualTrue?: boolean; progress?: (bytes: number, total: number) => void; progressUpload?: (bytes: number, total: number) => void },
  ) => void;

  gql: (query: string, cbFinish: (err: any, res: any) => void) => void;

  generateNaturalLanguageExplanation: (featureGroupId: string, featureGroupVersion: string, modelId: string, cbFinish: (err: any, res: any) => void) => void;
  setNaturalLanguageExplanation: (shortExplanation: string, longExplanation: string, featureGroupId: string, featureGroupVersion: string, modelId: string, cbFinish: (err: any, res: any) => void) => void;
  getNaturalLanguageExplanation: (featureGroupId: string, featureGroupVersion: string, modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _isFeatureGroupNameUsed: (featureGroupName: string, cbFinish: (err: any, res: any) => void) => void;
  _isPythonFunctionNameUsed: (pythonFunctionName: string, organizationId: string, cbFinish: (err: any, res: any) => void) => void;
  createDeploymentWebhook: (deploymentId: string, endpoint: string, webhookEventType: EWebhookEventType, payloadTemplate: string, cbFinish: (err: any, res: any) => void) => void;
  updateWebhook: (webhookId: string, endpoint: string, webhookEventType: EWebhookEventType, payloadTemplate: string, cbFinish: (err: any, res: any) => void) => void;
  listDeploymentWebhooks: (deploymentId: any, cbFinish: (err: any, res: any) => void) => void;
  describeWebhook: (webhookId: any, cbFinish: (err: any, res: any) => void) => void;
  deleteWebhook: (webhookId: any, cbFinish: (err: any, res: any) => void) => void;
  queryFeatureGroupExplorer: (featureGroupVersion, message, chatHistory, cbFinish: (err: any, res: any) => void) => void;
  _searchByName: (searchTerm: string, artifactTypes: string[], searchLimit: number, cbFinish: (err: any, res: any) => void) => void;
  _searchById: (artifactId: string, cbFinish: (err: any, res: any) => void) => void;
  queryFeatureGroupCodeGenerator: (query: string, language: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  createChatSession: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _createFeatureGroupFileInNotebook: (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  _createModelMetricsAnalysisFileInNotebook: (modelVersion: string, cbFinish: (err: any, res: any) => void) => void;
  _exportAiChatToNotebook: (chatSessionId: string, messageIndex: number, segmentIndex: number, cbFinish: (err: any, res: any) => void) => void;
  _setChatMessageFeedback: (chatSessionId: string, messageIndex: number, segmentIndex: number, isUseful: boolean, feedback: string, cbFinish: (err: any, res: any) => void) => void;
  sendChatMessage: (chatSessionId: string, message: string, cbFinish: (err: any, res: any) => void) => void;
  getChatSession: (chatSessionId: string, cbFinish: (err: any, res: any) => void) => void;
  listChatSessions: (mostRecentPerProject: boolean, cbFinish: (err: any, res: any) => void) => void;
  _hideChatSession: (chatSessionId: string, cbFinish: (err: any, res: any) => void) => void;

  createDeploymentConversation: (deploymentId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  getDeploymentConversation: (deploymentConversationId: string, cbFinish: (err: any, res: any) => void) => void;
  listDeploymentConversations: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteDeploymentConversation: (deploymentConversationId: string, cbFinish: (err: any, res: any) => void) => void;
  setDeploymentConversationFeedback: (deploymentConversationId: string, messageIndex: number, isUseful: boolean, isNotUseful: boolean, feedback: string, cbFinish: (err: any, res: any) => void) => void;

  createAgent: (projectId: string, functionSourceCode: string, agentFunctionName: string, name: string, memory: number, packageRequirements: any[], description: string, cbFinish: (err: any, res: any) => void) => void;
  updateAgent: (modelId: string, functionSourceCode: string, agentFunctionName: string, memory: number, packageRequirements: any[], description: string, cbFinish: (err: any, res: any) => void) => void;

  createPythonFunction: (
    name: string,
    sourceCode: string,
    functionName: string,
    functionVariableMappings: any[],
    projectId: string,
    packageRequirements: string[],
    functionType: PythonFunctionTypeParam,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  _getPythonFunctionCodeTemplate: (functionName: string, inputVariables: any[], templateType: string, cbFinish: (err: any, res: any) => void) => void;
  describePythonFunction: (name: string, cbFinish: (err: any, res: any) => void) => void;
  updatePythonFunction: (name: string, sourceCode: string, functionName: string, functionVariableMappings: { name?; variable_type? }[], cbFinish: (err: any, res: any) => void) => void;
  listPythonFunctions: (functionType: string, cbFinish: (err: any, res: any) => void) => void;

  listPipelines: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  describePipeline: (pipelineId: string, cbFinish: (err: any, res: any) => void) => void;
  describePipelineVersion: (pipelineVersion: string, cbFinish: (err: any, res: any) => void) => void;
  listPipelineVersions: (pipelineId: string, cbFinish: (err: any, res: any) => void) => void;
  createPipeline: (pipelineName: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  deletePipeline: (pipelineId: string, cbFinish: (err: any, res: any) => void) => void;
  runPipeline: (pipelineId: string, pipelineVariableMappings: any[], cbFinish: (err: any, res: any) => void) => void;
  updatePipeline: (pipelineId: string, pipelineVariableMappings: any[], cron: string, isProd: boolean, cbFinish: (err: any, res: any) => void) => void;
  resumePipelineRefreshSchedule: (pipelineId: string, cbFinish: (err: any, res: any) => void) => void;
  pausePipelineRefreshSchedule: (pipelineId: string, cbFinish: (err: any, res: any) => void) => void;
  unsetPipelineRefreshSchedule: (pipelineId: string, cbFinish: (err: any, res: any) => void) => void;

  _getPythonArguments: (functionName: any, sourceCode: string, cbFinish: (err: any, res: any) => void) => void;
  deletePythonFunction: (name: any, cbFinish: (err: any, res: any) => void) => void;
  listPythonFunctionFeatureGroups: (nameUse: string, limit: number, cbFinish: (err: any, res: any) => void) => void;

  _createCustomLossFunctionNotebook: (name: string, lossFunctionType: string, cbFinish: (err: any, res: any) => void) => void;
  describeCustomLossFunction: (name: string, cbFinish: (err: any, res: any) => void) => void;
  listCustomLossFunctions: (cbFinish: (err: any, res: any) => void) => void;
  deleteCustomLossFunction: (name: any, cbFinish: (err: any, res: any) => void) => void;
  _listAvailableLossTypes: (cbFinish: (err: any, res: any) => void) => void;

  _createCustomMetricNotebook: (name: string, problemType: string, cbFinish: (err: any, res: any) => void) => void;
  describeCustomMetric: (name: string, cbFinish: (err: any, res: any) => void) => void;
  listCustomMetrics: (cbFinish: (err: any, res: any) => void) => void;
  deleteCustomMetric: (name: any, cbFinish: (err: any, res: any) => void) => void;
  _listSupportedCustomMetricProblemTypes: (cbFinish: (err: any, res: any) => void) => void;

  describeModule: (name: string, cbFinish: (err: any, res: any) => void) => void;
  listModules: (cbFinish: (err: any, res: any) => void) => void;
  deleteModule: (name: any, cbFinish: (err: any, res: any) => void) => void;
  createModule: (name: any, cbFinish: (err: any, res: any) => void) => void;

  _listProjectModelVersions: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _listProjectModelVersionsForDataset: (projectId: string, datasetId: string, cbFinish: (err: any, res: any) => void) => void;
  _listProjectModelVersionsForFeatureGroup: (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;

  _setDeploymentInfraConfig: (deploymentId: string, disableAutoShutdown: boolean, enableMonitoring: boolean, alertQps: number, alertLatencyMs: number, cbFinish: (err: any, res: any) => void) => void;
  _getRecentPredictionRequestIds: (deploymentId: string, numRecords: number, startRequestId: number, cbFinish: (err: any, res: any) => void) => void;
  _getPredictionRequestLogs: (deploymentId: string, requestId: string, cbFinish: (err: any, res: any) => void) => void;
  _dumpPredictionRequestLogs: (deploymentId: string, numRecords: number, pageNum: number, cbFinish: (err: any, res: any) => void) => void;

  _importFeatureGroupSchema: (project_id: string, feature_group_id: string, schema: File, cbFinish: (err: any, res: any) => void) => void;
  _exportFeatureGroupSchema: (project_id: string, feature_group_id: string, modelVersion: string, cbFinish: (err: any, res: any) => void) => void;
  _exportModelVersionSchema: (datasetId: string, featureGroupId: string, modelVersion: string, cbFinish: (err: any, res: any) => void) => void;

  createModelFromDockerImage: (projectId: string, dockerImageUri: string, servicePort: number, name: string, cbFinish: (err: any, res: any) => void) => void;
  createModelVersionFromDockerImage: (modelId: string, cbFinish: (err: any, res: any) => void) => void;

  createAlgorithm: (
    name: string,
    problemType: string,
    sourceCode: string,
    trainingDataParameterNamesMapping: any,
    trainingConfigParameterName: string,
    trainFunctionName: string,
    predictFunctionName: string,
    predictManyFunctionName: string,
    initializeFunctionName: string,
    configOptions: any,
    isDefaultEnabled: boolean,
    projectId: string,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  deleteAlgorithm: (algorithm: string, cbFinish: (err: any, res: any) => void) => void;
  describeAlgorithm: (algorithm: string, cbFinish: (err: any, res: any) => void) => void;
  updateAlgorithm: (
    algorithm: string,
    sourceCode: string,
    trainingDataParameterNamesMapping: any,
    trainingConfigParameterName: string,
    trainFunctionName: string,
    predictFunctionName: string,
    predictManyFunctionName: string,
    initializeFunctionName: string,
    configOptions: any,
    isDefaultEnabled: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  listAlgorithms: (problemType: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  listBuiltinAlgorithms: (projectId: string, featureGroupIds: string[], trainingConfig: any, cbFinish: (err: any, res: any) => void) => void;
  _listPretrainedModelAlgorithms: (useCase: string, cbFinish: (err: any, res: any) => void) => void;

  updateFeatureGroupTemplateBindings: (featureGroupId: string, templateBindings: any, cbFinish: (err: any, res: any) => void) => void;
  detachFeatureGroupFromTemplate: (featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  createFeatureGroupFromTemplate: (
    tableName: string,
    featureGroupTemplateId: string,
    templateVariables: any,
    shouldAttachFeatureGroupToTemplate: boolean,
    description: string,
    lockType: number,
    tags: string[],
    cbFinish: (err: any, res: any) => void,
  ) => void;
  suggestFeatureGroupTemplateForFeatureGroup: (featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  previewFeatureGroupTemplateResolution: (featureGroupTemplateId: string, templateSql: string, templateVariables: any, templateBindings: any, shouldValidate: boolean, cbFinish: (err: any, res: any) => void) => void;
  updateFeatureGroupTemplate: (featureGroupTemplateId: string, name, templateSql: string, description, templateVariables: any, cbFinish: (err: any, res: any) => void) => void;
  describeTemplate: (featureGroupTemplateId: string, cbFinish: (err: any, res: any) => void) => void;
  listFeatureGroupTemplates: (limit: number, startAfterId: string, featureGroupId: string, shouldIncludeSystemTemplates: boolean, cbFinish: (err: any, res: any) => void) => void;
  _getModelInfo: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  listProjectFeatureGroupTemplates: (limit: number, startAfterId: string, projectId: string, shouldIncludeSystemTemplates: boolean, cbFinish: (err: any, res: any) => void) => void;
  deleteFeatureGroupTemplate: (featureGroupTemplateId: string, cbFinish: (err: any, res: any) => void) => void;
  createFeatureGroupTemplate: (featureGroupId: string, name: string, templateSql: string, templateVariables: any, description: string, shouldAttachFeatureGroupToTemplate: boolean, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureGroupTemplateVariableOptions: (templateSql: string, templateBindings: any, cbFinish: (err: any, res: any) => void) => void;

  _createDataserverDeployment: (driverMemory, numExecutors, executorMemory, deploymentLifePeriod, cbFinish: (err: any, res: any) => void) => void;
  _getDataserverDeployment: (dataserverSessionId, cbFinish: (err: any, res: any) => void) => void;
  _listDataserverDeployments: (cbFinish: (err: any, res: any) => void) => void;
  _deleteDataserverDeployment: (cbFinish: (err: any, res: any) => void) => void;
  _getModelBlueprint: (modelVersion: string, algorithm: string, cbFinish: (err: any, res: any) => void) => void;

  _bulkAddFeatureGroupsToProject: (projectId: string, featureGroupIds: string[], cbFinish: (err: any, res: any) => void) => void;
  _getFeatureGroupColumnTopValues: (projectId: string, featureGroupId: string, columnName: string, cbFinish: (err: any, res: any) => void) => void;
  _createPredictionMetric: (featureGroupId: string, predictionMetricConfig, projectId, cbFinish: (err: any, res: any) => void) => void;
  _describePredictionMetric: (predictionMetricId: string, cbFinish: (err: any, res: any) => void) => void;
  _deletePredictionMetric: (predictionMetricId: string, cbFinish: (err: any, res: any) => void) => void;
  _listPredictionMetrics: (projectId: string, featureGroupId: string, limit, startAfterId, cbFinish: (err: any, res: any) => void) => void;
  setModelPredictionParams: (modelId: string, predictionConfig: any, cbFinish: (err: any, res: any) => void) => void;
  _createNotebookTemplate: (notebookId: string, filename: string, templateName: string, description: string, templateType: string, cbFinish: (err: any, res: any) => void) => void;
  _deleteNotebookTemplate: (notebookTemplateId: string, cbFinish: (err: any, res: any) => void) => void;
  _describeNotebookTemplate: (notebookTemplateId: string, cbFinish: (err: any, res: any) => void) => void;
  _listNotebookTemplates: (templateType: string, cbFinish: (err: any, res: any) => void) => void;
  _updateNotebookTemplate: (notebookTemplateId: string, notebookId: string, filename: string, templateName: string, description: string, templateType: string, cbFinish: (err: any, res: any) => void) => void;
  _listNotebookTemplateTypes: (cbFinish: (err: any, res: any) => void) => void;
  _addTemplateToNotebook: (notebookId: string, notebookTemplateId: string, cbFinish: (err: any, res: any) => void) => void;
  _openNotebook: (name: string, projectId: string, memory: number, useGpu: boolean, notebookTemplateId: string, cbFinish: (err: any, res: any) => void) => void;

  _runPredictionMetric: (predictionMetricId: string, cbFinish: (err: any, res: any) => void) => void;
  _listPredictionMetricVersions: (predictionMetricId: string, limit, startAfterId, cbFinish: (err: any, res: any) => void) => void;
  _deletePredictionMetricVersion: (predictionMetricVersion: string, cbFinish: (err: any, res: any) => void) => void;
  _describePredictionMetricVersion: (predictionMetricVersion: string, cbFinish: (err: any, res: any) => void) => void;

  concatenateFeatureGroupData: (featureGroupId: string, sourceFeatureGroupId: string, mergeType: string, afterTimestamp: number, skipMaterialize: boolean, cbFinish: (err: any, res: any) => void) => void;
  removeConcatenationConfig: (featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;

  createPointInTimeFeature: (
    featureGroupId: string,
    featureName: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
    onlineLookbackCount: number,
    onlineLookbackWindowSeconds: number,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  updatePointInTimeFeature: (
    featureGroupId: string,
    featureName: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
    newFeatureName: string,
    onlineLookbackCount: number,
    onlineLookbackWindowSeconds: number,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  estimatePointInTimeComplexity: (
    featureGroupId: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
    cbFinish: (err: any, res: any) => void,
  ) => void;

  alertsMarkAsReadById: (alertId: string, cbFinish: (err: any, res: any) => void) => void;
  alertsMarkAllRead: (cbFinish: (err: any, res: any) => void) => void;

  _getBatchPredictionRow: (batchPredictionVersion: string, row: number, cbFinish: (err: any, res: any) => void) => void;
  _getBatchPredictionRows: (batchPredictionVersion: string, rows: number, startAfter: number, cbFinish: (err: any, res: any) => void) => void;
  _getDefaultQps: (cbFinish: (err: any, res: any) => void) => void;
  _getUserPreferencesOptions: (cbFinish: (err: any, res: any) => void) => void;
  _getUserPreferences: (cbFinish: (err: any, res: any) => void) => void;
  _updateUserPreferences: (preferences: object, cbFinish: (err: any, res: any) => void) => void;
  _setNewPassword: (currentPassword: string, newPassword: string, cbFinish: (err: any, res: any) => void) => void;
  _updateEmail: (email: string, cbFinish: (err: any, res: any) => void) => void;
  _updateOrganizationDiscoverability: (discoverable: boolean, cbFinish: (err: any, res: any) => void) => void;

  createSnapshotFeatureGroup: (featureGroupVersion: string, tableName: string, cbFinish: (err: any, res: any) => void) => void;
  createMergeFeatureGroup: (sourceFeatureGroupId: string, tableName: string, mergeConfig: any, description: string, lockType: number, tags: string[], projectId: string, cbFinish: (err: any, res: any) => void) => void;
  setFeatureGroupMergeConfig: (featureGroupId: string, mergeConfig: any, cbFinish: (err: any, res: any) => void) => void;
  createTransformFeatureGroup: (sourceFeatureGroupId: string, tableName: string, transformConfig: any, description: string, lockType: number, tags: string[], projectId: string, cbFinish: (err: any, res: any) => void) => void;
  setFeatureGroupTransformConfig: (featureGroupId: string, transformConfig: any, cbFinish: (err: any, res: any) => void) => void;

  addNestedFeature: (featureGroupId: string, nestedFeatureName: string, tableName: string, usingClause: string, whereClause: string, orderClause: string, cbFinish: (err: any, res: any) => void) => void;
  updateNestedFeature: (featureGroupId: string, nestedFeatureName: string, newNestedFeatureName: string, tableName: string, usingClause: string, whereClause: string, orderClause: string, cbFinish: (err: any, res: any) => void) => void;
  deleteNestedFeature: (featureGroupId: string, nestedFeatureName: string, cbFinish: (err: any, res: any) => void) => void;

  _requestReminderEmail: (cbFinish: (err: any, res: any) => void) => void;
  _listProjectsDashboard: (updatedFilter: number, limit: number, sinceProjectId: string, search: string, isStarred: boolean, tag: string, cbFinish: (err: any, res: any) => void) => void;
  _listProjectsTags: (sinceProjectId: string, search: string, isStarred: boolean, cbFinish: (err: any, res: any) => void) => void;
  _describeProject: (projectId: any, cbFinish: (err: any, res: any) => void) => void;

  _getFeatureGroupCustomColPreview: (featureGroupId, colName, selectExpression, fromRow, toRow, cbFinish: (err: any, res: any) => void) => void;
  _getSQLPreviewData: (featureGroupName: string, sql: string, fromRow: number, toRow: number, fromCol: number, toCol: number, validateOnly: boolean, cbFinish: (err: any, res: any) => void) => void;
  _validateSQL: (project_id: string, dataset_id: string, expressionType, filterType, sql: string, cbFinish: (err: any, res: any) => void) => void;

  createEda: (
    projectId,
    featureGroupId,
    name,
    refreshSchedule,
    includeCollinearity,
    includeDataConsistency,
    collinearityKeys,
    primaryKeys,
    dataConsistencyTestConfig,
    dataConsistencyReferenceConfig,
    featureMappings,
    forecastFrequency,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  rerunEda: (edaId, cbFinish: (err: any, res: any) => void) => void;
  createGraphDashboard: (projectId: string, name: string, pythonFunctionIds: string[], cbFinish: (err: any, res: any) => void) => void;
  describeGraphDashboard: (graphDashboardId: string, cbFinish: (err: any, res: any) => void) => void;
  listGraphDashboards: (projectId, cbFinish: (err: any, res: any) => void) => void;
  updateGraphDashboard: (graphDashboardId: string, name: string, pythonFunctionIds: string[], cbFinish: (err: any, res: any) => void) => void;
  deleteGraphDashboard: (graphDashboardId, cbFinish: (err: any, res: any) => void) => void;
  listEda: (projectId, cbFinish: (err: any, res: any) => void) => void;
  describeEda: (edaId, cbFinish: (err: any, res: any) => void) => void;
  listEdaVersions: (edaId, limit, startAfterVersion, cbFinish: (err: any, res: any) => void) => void;
  describeEdaVersion: (edaVersion, cbFinish: (err: any, res: any) => void) => void;
  renameEda: (edaId, name, cbFinish: (err: any, res: any) => void) => void;
  deleteEda: (edaId, cbFinish: (err: any, res: any) => void) => void;
  deleteEdaVersion: (edaVersion, cbFinish: (err: any, res: any) => void) => void;
  getEdaCollinearity: (edaVersion, cbFinish: (err: any, res: any) => void) => void;
  getEdaDataConsistency: (edaVersion, transformationFeature, cbFinish: (err: any, res: any) => void) => void;
  getCollinearityForFeature: (edaVersion, featureName, cbFinish: (err: any, res: any) => void) => void;
  getFeatureAssociation: (edaVersion, referenceFeatureName, testFeatureName, cbFinish: (err: any, res: any) => void) => void;
  _getEdaItemLevelForecastingAnalysis: (edaVersion, primaryKeyMapping, cbFinish: (err: any, res: any) => void) => void;
  getEdaForecastingAnalysis: (edaVersion, cbFinish: (err: any, res: any) => void) => void;
  _getEdaForecastingTargetMappings: (useCase, cbFinish: (err: any, res: any) => void) => void;
  _getEdaForecastingItemIds: (edaVersion, primaryKeys, cbFinish: (err: any, res: any) => void) => void;

  createModelMonitor: (
    projectId,
    modelId,
    name,
    trainingFeatureGroupId,
    predictionFeatureGroupId,
    refreshSchedule,
    featureMappings,
    targetValue,
    targetValueBias,
    targetValuePerformance,
    trainingFeatureMappings,
    featureGroupBaseMonitorConfig,
    featureGroupComparisonMonitorConfig,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  createVisionDriftMonitor: (
    projectId,
    modelId,
    name,
    trainingFeatureGroupId,
    predictionFeatureGroupId,
    refreshSchedule,
    featureMappings,
    targetValue,
    targetValueBias,
    targetValuePerformance,
    trainingFeatureMappings,
    featureGroupBaseMonitorConfig,
    featureGroupComparisonMonitorConfig,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  createNlpDriftMonitor: (projectId, predictionFeatureGroupId, trainingFeatureGroupId, name, featureMappings, trainingFeatureMappings, targetValuePerformance, refreshSchedule, cbFinish: (err: any, res: any) => void) => void;
  rerunModelMonitor: (modelMonitorId, cbFinish: (err: any, res: any) => void) => void;
  listModelMonitors: (projectId, cbFinish: (err: any, res: any) => void) => void;
  describeModelMonitor: (modelMonitorId, cbFinish: (err: any, res: any) => void) => void;
  listModelMonitorVersions: (modelMonitorId, limit, startAfterVersion, cbFinish: (err: any, res: any) => void) => void;
  describeModelMonitorVersion: (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => void;
  renameModelMonitor: (modelMonitorId, name, cbFinish: (err: any, res: any) => void) => void;
  deleteModelMonitor: (modelMonitorId, cbFinish: (err: any, res: any) => void) => void;
  deleteModelMonitorVersion: (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => void;
  _listProjectModelMonitorVersions: (projectId, cbFinish: (err: any, res: any) => void) => void;

  _validate2faToken: (token, cbFinish: (err: any, res: any) => void) => void;
  _checkChallengeStatus: (cbFinish: (err: any, res: any) => void) => void;
  _disable2fa: (cbFinish: (err: any, res: any) => void) => void;
  _enable2fa: (phone, countryCode, cbFinish: (err: any, res: any) => void) => void;
  _start2faSMS: (cbFinish: (err: any, res: any) => void) => void;
  _start2faPush: (cbFinish: (err: any, res: any) => void) => void;

  batchPredict: (globalPredictionArgs: any, deploymentId: string, name: string, inputLocation: string, outputLocation: string, refreshSchedule: string, explanations: boolean, cbFinish: (err: any, res: any) => void) => void;
  _cancelBatchPrediction: (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => void;
  describeBatchPrediction: (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => void;
  _getExampleQuery: (databaseConnectorId: string, cbFinish: (err: any, res: any) => void) => void;
  _getModelSchemaOverrides: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _getFoldFeatureDistributions: (modelVersion: string, featureName: string, cbFinish: (err: any, res: any) => void) => void;

  listOrganizationUsers: (cbFinish: (err: any, res: any) => void) => void;
  removeUserFromOrganization: (email: string, cbFinish: (err: any, res: any) => void) => void;

  listOrganizationGroups: (cbFinish: (err: any, res: any) => void) => void;
  createOrganizationGroup: (groupName: string, permissions: string[], defaultGroup: boolean, cbFinish: (err: any, res: any) => void) => void;
  describeOrganizationGroup: (organizationGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  addOrganizationGroupPermission: (organizationGroupId: string, permission, cbFinish: (err: any, res: any) => void) => void;
  removeOrganizationGroupPermission: (organizationGroupId: string, permission, cbFinish: (err: any, res: any) => void) => void;
  deleteOrganizationGroup: (organizationGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  addUserToOrganizationGroup: (organizationGroupId: string, email, cbFinish: (err: any, res: any) => void) => void;
  removeUserFromOrganizationGroup: (organizationGroupId: string, email, cbFinish: (err: any, res: any) => void) => void;
  setDefaultOrganizationGroup: (organizationGroupId: string, cbFinish: (err: any, res: any) => void) => void;

  exportModelArtifactAsFeatureGroup: (modelVersion: string, tableName: string, artifactType: string, cbFinish: (err: any, res: any) => void) => void;
  _batchPredictFromIds: (deploymentId: string, name: string, outputFormat: string, inputIds: string[], cbFinish: (err: any, res: any) => void) => void;
  createBatchPrediction: (
    deployment_id: string,
    tableName: string,
    name: string,
    globalPredictionArgs: string,
    explanations: boolean,
    outputFormat: string,
    outputLocation: string,
    databaseConnectorId: string,
    databaseOutputConfig: object,
    refresh_schedule: string,
    csvInputPrefix: string,
    csvPredictionPrefix: string,
    csvExplanationsPrefix: string,
    featureGroupOverrides: any,
    datasetIdRemap: any,
    resultInputColumns: string[],
    outputIncludesMetadata: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  startBatchPrediction: (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => void;
  getBatchPredictionResult: (batchPredictionVersion: string, cbFinish: (err: any, res: any) => void) => void;
  getBatchPredictionConnectorErrors: (batchPredictionVersion: string, cbFinish: (err: any, res: any) => void) => void;
  setBatchPredictionDatasetRemap: (batchPredictionId: string, datasetIdRemap: any, cbFinish: (err: any, res: any) => void) => void;
  listBatchPredictions: (projectId: string, deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  _getPredictionSchema: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  listBatchPredictionVersions: (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => void;
  getFeatureGroupExportConnectorErrors: (featureGroupExportId: string, cbFinish: (err: any, res: any) => void) => void;
  describeBatchPredictionVersion: (batchPredictionVersion: string, cbFinish: (err: any, res: any) => void) => void;
  updateBatchPrediction: (
    batchPredictionId: string,
    deploymentId: string,
    globalPredictionArgs: any,
    explanations: boolean,
    outputFormat: string,
    csvInputPrefix: string,
    csvPredictionPrefix: string,
    csvExplanationsPrefix: string,
    parallelismOverride: number,
    outputIncludesMetadata: boolean,
    resultInputColumns: string[],
    name: string,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  setBatchPredictionFileConnectorOutput: (batchPredictionId: string, outputFormat: string, outputLocation: string, cbFinish: (err: any, res: any) => void) => void;
  setBatchPredictionDatabaseConnectorOutput: (batchPredictionId: string, databaseConnectorId: string, databaseOutputConfig: string, cbFinish: (err: any, res: any) => void) => void;
  setBatchPredictionOutputToConsole: (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => void;
  setBatchPredictionDataset: (batchPredictionId: string, datasetType: string, datasetId: string, cbFinish: (err: any, res: any) => void) => void;
  setBatchPredictionFeatureGroup: (batchPredictionId: string, datasetType: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteBatchPrediction: (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => void;

  _isExplainableProject: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureGroupSchema: (projectId: string, featureGroupId: string, modelVersion: string, featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => void;
  batchPredictionFromUpload: (globalPredictionArgs: any, deploymentId, name, explanations, cbFinish: (err: any, res: any) => void) => void;
  completeUpload: (datasetUploadId: any, cbFinish: (err: any, res: any) => void) => void;
  cancelUpload: (uploadId: any, cbFinish: (err: any, res: any) => void) => void;
  _cancelDatasetUpload: (datasetVersion, cbFinish: (err: any, res: any) => void) => void;
  markUploadComplete: (uploadId: string, cbFinish: (err: any, res: any) => void) => void;
  unsubscribe: (email: string, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => void;
  getPredictionSchema: (modelVersion: string, cbFinish: (err: any, res: any) => void) => void;
  get_project_dataset_data_use: (project_id: string, dataset_id: string, batch_prediction_id: string, modelVersion, cbFinish: (err: any, res: any) => void) => void;
  get_dataset_schema: (dataset_id: string, cbFinish: (err: any, res: any) => void) => void;
  get_dataset_schema_version: (dataset_version: string, cbFinish: (err: any, res: any) => void) => void;
  validateProjectDatasets: (project_id: string, featureGroupIds: string[], cbFinish: (err: any, res: any) => void) => void;
  setProjectDatasetDataUsage: (project_id: string, dataset_id: string, columnOverrides: any, cbFinish: (err: any, res: any) => void) => void;
  _resetProjectDatasetDetectedSchema: (project_id: string, dataset_id: string, cbFinish: (err: any, res: any) => void) => void;
  setProjectDatasetColumnMapping: (isTransaction: boolean, project_id: string, dataset_id: string, column: string, featureMapping: any, cbFinish: (err: any, res: any) => void) => void;
  calcSetProjectDatasetColumnMappingIsInTransaction: () => number;
  setProjectDatasetColumnMappingUsingQueue: (project_id: string, dataset_id: string, column: string, featureMapping: any, cbFinish: (err: any, res: any, isLast?: boolean) => void) => void;
  setProjectDatasetColumnDataType: (project_id: string, dataset_id: string, column: string, dataType: any, cbFinish: (err: any, res: any) => void) => void;
  setColumnDataType: (project_id: string, dataset_id: string, column: string, dataType: any, cbFinish: (err: any, res: any) => void) => void;
  _hideModel: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _addVote: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _deleteVote: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _addModelComment: (modelId: string, comment: string, cbFinish: (err: any, res: any) => void) => void;
  _shareModel: (modelId: string, name: string, desc: string, cbFinish: (err: any, res: any) => void) => void;
  _starModel: (modelId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => void;
  _starDeployment: (deploymentId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => void;
  _starProject: (projectId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => void;
  _starDataset: (datasetId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => void;
  _starBatchPrediction: (batchPredictionId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => void;
  _starFeatureGroup: (featureGroupId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => void;
  _deleteModelComment: (communityInteractionId: string, cbFinish: (err: any, res: any) => void) => void;
  _editModelComment: (communityInteractionId: string, comment: string, cbFinish: (err: any, res: any) => void) => void;
  _getModelComment: (communityInteractionId: string, cbFinish: (err: any, res: any) => void) => void;
  _getSharedModel: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _listSharedModels: (limit: number, lastSeenModelId: string, userHandle: string, useCase: string, sortBy: string, isVotes: boolean, cbFinish: (err: any, res: any) => void) => void;
  _listModelComments: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _getPublicUser: (userHandle: string, cbFinish: (err: any, res: any) => void) => void;
  _updatePublicProfile: (name, userHandle, bio, twitterHandle, githubHandle, linkedinHandle, cbFinish: (err: any, res: any) => void) => void;
  _uploadProfileImage: (photoData, resetPhoto, cbFinish: (err: any, res: any) => void) => void;
  _uploadModelImage: (modelId, photoData, cbFinish: (err: any, res: any) => void) => void;
  _getDefaultModelImage: (modelId, cbFinish: (err: any, res: any) => void) => void;
  _listUserComments: (userHandle: string, communityInteractionId: string, cbFinish: (err: any, res: any) => void) => void;
  _getSharedModelGraphs: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _getSharedModelDatasetMetrics: (modelId: string, rows: number, cbFinish: (err: any, res: any) => void) => void;
  _getEditorsChoice: (cbFinish: (err: any, res: any) => void) => void;
  listDatasets: (limit: number, startAfterId: string, starred, cbFinish: (err: any, res: any) => void) => void;
  getTrainingDataLogs: (modelVersion: string, cbFinish: (err: any, res: any) => void) => void;

  _getUserInfo: (cbFinish: (err: any, res: any) => void) => void;
  _describeDataset: (datasetId: string, cbFinish: (err: any, res: any) => void) => void;
  _listUseCasesInternal: (cbFinish: (err: any, res: any) => void) => void;

  createModelFromLocalFiles: (projectId, name, optionalArtifacts: any, cbFinish: (err: any, res: any) => void) => void;
  createModelVersionFromLocalFiles: (modelId, optionalArtifacts: any, cbFinish: (err: any, res: any) => void) => void;
  createModelFromFiles: (projectId, name, location: string, customArtifactFilenames: any, cbFinish: (err: any, res: any) => void) => void;
  createModelVersionFromFiles: (modelId, cbFinish: (err: any, res: any) => void) => void;
  _verifyModelFromFilesLocation: (projectId, location: string, customArtifactFilenames: any, cbFinish: (err: any, res: any) => void) => void;

  setIgnoreBefore: (datasetId: string, timestamp: number, cbFinish: (err: any, res: any) => void) => void;

  createStreamingDataset: (projectId: string, datasetType: string, name: string, tableName: string, cbFinish: (err: any, res: any) => void) => void;
  _createStreamingFeatureGroupFromBatch: (projectId: string, featureGroupId: string, tableName: string, cbFinish: (err: any, res: any) => void) => void;
  appendDatasetRows: (streamingToken: string, datasetId: string, rows: any, cbFinish: (err: any, res: any) => void) => void;
  createStreamingToken: (cbFinish: (err: any, res: any) => void) => void;
  listStreamingTokens: (cbFinish: (err: any, res: any) => void) => void;
  deleteStreamingToken: (streamingToken: string, cbFinish: (err: any, res: any) => void) => void;

  getUserAlerts: (unreadOnly: boolean, since: number, cbFinish: (err: any, res: any) => void) => void;
  _getSampleApiCode: (methodName: boolean, cbFinish: (err: any, res: any) => void) => void;

  _getUIWizardState: (project_id: string, dataset_id: string, ui_action: string, cbFinish: (err: any, res: any) => void) => void;
  _setUIWizardState: (project_id: string, dataset_id: string, ui_action: string, is_clear: boolean, cbFinish: (err: any, res: any) => void) => void;
  _getProjectWizardState: (project_id: string, cbFinish: (err: any, res: any) => void) => void;
  _setProjectWizardState: (project_id: string, values: object, cbFinish: (err: any, res: any) => void) => void;
  _requestHelp: (detail: string, cbFinish: (err: any, res: any) => void) => void;
  helptextsDownload: (cbFinish: (err: any, res: any) => void) => void;

  get_test_datas_by_project: (project_id: string, cbFinish: (err: any, res: any) => void) => void;
  get_models_by_project: (project_id: string, cbFinish: (err: any, res: any) => void) => void;
  _userAuthMobileQR: (cbFinish: (err: any, res: any) => void) => void;

  _predictForUI: (deployment_id: string, dataParams: object, extraParams: any, requestId: string, cbFinish: (err: any, res: any) => void) => void;
  _predictForUI_predictClass: (deployment_id: string, dataParams: object, extraParams: any, requestId: string, cbFinish: (err: any, res: any) => void) => void;
  _predictForUI_binaryData: (deployment_id: string, blob: any, blobKeyName: string, extraParams: any, cbFinish: (err: any, res: any) => void) => void;
  classifyImage: (deploymentId: string, blob: any, extraParams: any, cbFinish: (err: any, res: any) => void) => void;
  describeImage: (deploymentToken: string, deploymentId: string, image: any, categories: string[], cbFinish: (err: any, res: any) => void) => void;
  predict: (auth_token: string, deployment_id: string, data: string, cbFinish: (err: any, res: any) => void) => void;
  predictForUseCase: (methodName: string, explainPredictions: boolean, dataField: string, auth_token: string, deployment_id: string, data: string, cbFinish: (err: any, res: any) => void) => void;
  _getValidProjectFeatureGroupUses: (isUserModifiable: boolean, cbFinish: (err: any, res: any) => void) => void;
  setModelMonitorAlertConfig: (modelMonitorId: string, name, alertConfig: any, cbFinish: (err: any, res: any) => void) => void;
  _getPredictionMetricDataByPredictionMetricVersion: (predictionMetricVersion: string, actualValue: string, cbFinish: (err: any, res: any) => void) => void;
  modelMonitorVersionMetricData: (modelMonitorVersion: string, metricType: string, actualValue: any, cbFinish: (err: any, res: any) => void) => void;
  _listModelMonitorAlerts: (modelMonitorId: string, cbFinish: (err: any, res: any) => void) => void;
  _transferStyle: (deploymentId: string, sourceImage: any, styleImage: any, cbFinish: (err: any, res: any) => void) => void;
  _modifyImageUsingText: (deploymentId: string, queryData: string, sourceImage: any, cbFinish: (err: any, res: any) => void) => void;
  _generateImage: (deploymentId: string, queryData: any, extraParams: any, cbFinish: (err: any, res: any) => void) => void;

  createMonitorAlert: (projectId: string, modelMonitorId: string, alertName: string, conditionConfig: any, actionConfig: any, cbFinish: (err: any, res: any) => void) => void;
  updateMonitorAlert: (monitorAlertId: string, alertName: string, conditionConfig: any, actionConfig: any, cbFinish: (err: any, res: any) => void) => void;
  describeMonitorAlert: (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => void;
  describeMonitorAlertVersion: (monitorAlertVersion: string, cbFinish: (err: any, res: any) => void) => void;
  runMonitorAlert: (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => void;
  listMonitorAlertsForMonitor: (modelMonitorId: string, cbFinish: (err: any, res: any) => void) => void;
  listMonitorAlertVersionsForMonitorVersion: (modelMonitorVersion: string, cbFinish: (err: any, res: any) => void) => void;
  deleteMonitorAlert: (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => void;

  _setNotebookMemory: (notebookId: string, memory: number, cbFinish: (err: any, res: any) => void) => void;
  _setNotebookUsesGpu: (notebookId: string, useGpu: boolean, cbFinish: (err: any, res: any) => void) => void;
  _getNotebookMemoryOptions: (cbFinish: (err: any, res: any) => void) => void;
  _createNotebook: (name: string, projectId: string, memory: number, useGpu: boolean, cbFinish: (err: any, res: any) => void) => void;
  _renameNotebook: (notebookId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  _deleteNotebook: (notebookId: string, cbFinish: (err: any, res: any) => void) => void;
  _describeNotebook: (notebookId: string, cbFinish: (err: any, res: any) => void, forceCheckOrg?, subpath?: string) => void;
  _listNotebooks: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _startNotebook: (notebookId: string, cbFinish: (err: any, res: any) => void) => void;
  _stopNotebook: (notebookId: string, cbFinish: (err: any, res: any) => void) => void;
  _attachNotebookToProject: (notebookId: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _removeNotebookFromProject: (notebookId: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  addAnnotation: (
    annotation: { annotationType?: string; annotationValue?: any },
    featureGroupId: string,
    featureName: string,
    docId: string,
    document: string,
    featureGroupAnnotationKeyValue: string,
    featureGroupRowIdentifier: any,
    annotationSource: 'upload' | 'ui',
    status: string,
    comments: any,
    projectId: string,
    saveMetadata: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  describeAnnotation: (featureGroupId: string, featureName: string, docId: string, featureGroupAnnotationKeyValue: string, featureGroupRowIdentifier: any, cbFinish: (err: any, res: any) => void) => void;
  verifyAndDescribeAnnotation: (featureGroupId: string, featureName: string, docId: string, featureGroupAnnotationKeyValue: string, featureGroupRowIdentifier: any, cbFinish: (err: any, res: any) => void) => void;
  setFeatureAsAnnotatableFeature: (featureGroupId: string, featureName: string, annotationType: string, featureGroupRowIdentifierFeature: string, docIdFeature: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  setAnnotationStatusFeature: (featureGroupId: string, featureName: string, cbFinish: (err: any, res: any) => void) => void;
  addFeatureGroupAnnotationLabel: (featureGroupId: string, labelName: string, annotationType: string, labelDefinition: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  importAnnotationLabels: (featureGroupId: string, file: any, annotationType: string, cbFinish: (err: any, res: any) => void) => void;
  removeFeatureGroupAnnotationLabel: (featureGroupId: string, labelName: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  addFeatureGroupAnnotationLabels: (featureGroupId: string, labelNames: string[], annotationType: string, labelDefinition: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  addAnnotatableFeature: (featureGroupId: string, name: string, annotationType: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  getDocumentToAnnotate: (featureGroupId: string, featureName: string, featureGroupRowIdentifierFeature: string, getPrevious: boolean, cbFinish: (err: any, res: any) => void) => void;
  getAnnotationsStatus: (featureGroupId: string, featureName: string, checkForMaterialization: boolean, cbFinish: (err: any, res: any) => void) => void;
  updateAnnotationStatus: (featureGroupId: string, featureName: string, status: string, docId: string, featureGroupRowIdentifier: any, saveMetadata: boolean, cbFinish: (err: any, res: any) => void) => void;
  _getProcessedAnnotation: (annotationType: string, annotationValue: any, document: string, cbFinish: (err: any, res: any) => void) => void;
  _listAnnotationFeatureGroupRowIds: (featureGroupId: string, featureName: string, cbFinish: (err: any, res: any) => void) => void;

  listOrganizationModelMonitors: (onlyStarred: boolean, cbFinish: (err: any, res: any) => void) => void;
  getModelMonitorSummaryFromOrganization: (lookbackDays: number, cbFinish: (err: any, res: any) => void) => void;
  getModelMonitorChartFromOrganization: (chartType: string, limit: string, cbFinish: (err: any, res: any) => void) => void;
  _starModelMonitor: (modelMonitorId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => void;

  _getSSOClientIds: (cbFinish: (err: any, res: any) => void) => void;

  _getDeploymentBatchPredictionInfo: (deploymentId: any, cbFinish: (err: any, res: any) => void) => void;
  listTestData: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  get_metrics_data: (project_id: any, cbFinish: (err: any, res: any) => void) => void;
  getModelMonitorSummary: (modelMonitorId: any, cbFinish: (err: any, res: any) => void) => void;
  get_dataset_data: (
    project_id: string,
    dataset_id: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress?: (bytes: number, total: number) => void,
  ) => void;
  get_dataset_data_version: (
    project_id: string,
    dataset_id: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress?: (bytes: number, total: number) => void,
  ) => void;
  _getFeatureGroupData: (
    project_id: string,
    featureGroupId: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress?: (bytes: number, total: number) => void,
  ) => void;
  _getFeatureGroupVersionData: (
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    validateOnly: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  getFeatureGroupVersionData: (
    project_id: string,
    featureGroupId: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn: string,
    isAscending: boolean,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress?: (bytes: number, total: number) => void,
  ) => void;
  get_data_explorer_charts: (dataset_id: string, project_id: string, num_items: number, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureGroupExplorerCharts: (feature_group_version: string, project_id: string, num_items: number, cbFinish: (err: any, res: any) => void) => void;
  describeDataset: (datasetId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange?) => void;
  describeUseCaseRequirements: (useCase: string, cbFinish: (err: any, res: any) => void) => void;
  _getModelVersionGraphs: (modelVersion: string, cbFinish: (err: any, res: any) => void) => void;

  renameModel: (modelId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  _listSolutionsAndUseCases: (isSolutions: boolean, useCase: string, cbFinish: (err: any, res: any) => void) => void;

  createProject: (name: string, useCase: string, isFeatureGroupProject: boolean, cbFinish: (err: any, res: any) => void) => void;
  editProject: (projectId: any, name: string, cbFinish: (err: any, res: any) => void) => void;
  deleteProject: (project_id: any, cbFinish: (err: any, res: any) => void) => void;
  attachDatasetToProject: (projectId: string, datasetId: string, datasetType: string, cbFinish: (err: any, res: any) => void) => void;
  removeDatasetFromProject: (projectId: string, datasetId: string, cbFinish: (err: any, res: any) => void) => void;

  get_dataset_metrics: (
    project_id: string,
    dataset_id: string,
    batchPredId,
    modelVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    selectedColumns,
    selectedColumnsNonIgnored,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  get_dataset_metrics_schema: (project_id: string, dataset_id: string, batchPredId, modelVersion, cbFinish: (err: any, res: any) => void) => void;
  get_dataset_metrics_version: (
    project_id: string,
    dataset_id: string,
    batchPredId,
    modelVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    selectedColumns,
    selectedColumnsNonIgnored,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  get_dataset_metrics_schema_version: (project_id: string, dataset_id: string, batchPredId, modelVersion, cbFinish: (err: any, res: any) => void) => void;

  getFeatureGroupVersionMetricsSchema: (featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => void;
  getFeatureGroupVersionMetricsData: (
    projectId: string,
    featureGroupVersion: string,
    fromRow: number,
    toRow: number,
    fromCol: number,
    toCol: number,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => void;

  _searchId: (sid: string, cbFinish: (err: any, res: any) => void) => void;
  _searchProjects: (searchIn: string, projectName: string, useCase: string, problemType: string, createdAtBefore: number, createdAtAfter: number, datasets, models, metrics, deploys, cbFinish: (err: any, res: any) => void) => void;

  doAddDataset: (
    isDocumentset: boolean,
    newVersionDatasetId: string,
    name: string,
    contentType: string,
    fileOne: File,
    projectId: any,
    datasetType: string,
    fileFormat: string,
    tableName: string,
    csvDelimiter: string,
    extractBoundingBoxes: boolean,
    cbFinishDoUpload: (err: any, res: any) => void,
  ) => void;
  doImportDataset: (
    isDocumentset: boolean,
    name: string,
    fileFormat: string,
    location: string,
    projectId: any,
    datasetType: string,
    refreshSchedule: string,
    databaseConnectorId: string,
    objectName: string,
    columns: string,
    queryArguments: string,
    tableName: string,
    sqlQuery: string,
    csvDelimiter: string,
    filenameColumn: string,
    startPrefix: string,
    untilPrefix: string,
    locationDateFormat,
    dateFormatLookbackDays,
    incremental,
    incrementalTimestampColumn,
    mergeFileSchemas,
    extractBoundingBoxes: boolean,
    cbProgressDoUpload: (actual: number, total: number) => void,
    cbFinishDoUpload: (err: any, res: any) => void,
  ) => void;
  documentation_: (cbFinish: (err: any, res: any) => void) => void;
  _getUseCaseDocumentation: (cbFinish: (err: any, res: any) => void) => void;

  createRefreshPolicy: (
    name: string,
    cron: string,
    refreshType: string,
    projectId: string,
    datasetIds: string[],
    featureGroupId: string,
    modelIds: string[],
    deploymentIds: string[],
    batchPredictionIds: string[],
    predictionMetricIds: string[],
    modelMonitorIds: string[],
    notebookId: string,
    featureGroupExportConfig: any,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  describeRefreshPolicy: (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => void;
  listRefreshPipelineRuns: (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => void;
  pauseRefreshPolicy: (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => void;
  resumeRefreshPolicy: (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => void;
  updateRefreshPolicy: (refreshPolicyId: string, name: string, cron: string, isProd: boolean, featureGroupExportConfig: any, cbFinish: (err: any, res: any) => void) => void;
  listRefreshPolicies: (
    projectId: string,
    datasetIds: string[],
    featureGroupId: string,
    modelIds: string[],
    deploymentIds: string[],
    batchPredictionIds: string[],
    modelMonitorIds: string[],
    predictionMetricIds: string[],
    notebookIds: string[],
    cbFinish: (err: any, res: any) => void,
  ) => void;
  describeRefreshPipelineRun: (refreshPipelineRunId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteRefreshPolicy: (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => void;
  runRefreshPolicy: (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => void;
  _setNotebookExecuteFilename: (notebookId: string, executeFilename: string, cbFinish: (err: any, res: any) => void) => void;
  _getFullDataPreview: (projectId: string, datasetId: string, customFilers: any, cbProgress: (bytes: number, total: number) => void, cbFinish: (err: any, res: any) => void) => void;

  getDocstoreDocument: (docId: string, cbFinish: (err: any, res: any) => void) => void;
  getDocstoreImage: (docId: string, maxWidth: number, maxHeight: number, cbFinish: (err: any, res: any) => void) => void;
  _pythonGraphData: (pythonFunctionId: string, cbFinish: (err: any, res: any) => void) => void;
  _pythonGraphDataForDashboard: (graphReferenceId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteGraphFromDashboard: (graphReferenceId: string, cbFinish: (err: any, res: any) => void) => void;
  addGraphToDashboard: (pythonFunctionId: string, graphDashboardId: string, functionVariableMappings: any, name: string, cbFinish: (err: any, res: any) => void) => void;
  updateGraphToDashboard: (graphReferenceId: string, functionVariableMappings: any, name: string, cbFinish: (err: any, res: any) => void) => void;
  describeGraphForDashboard: (graphReferenceId: string, cbFinish: (err: any, res: any) => void) => void;
  _selectOrganizationRegion: (service: string, region: string, cbFinish: (err: any, res: any) => void) => void;
  getTrainingConfigOptions: (projectId: string, featureGroupIds: string[], forRetrain: boolean, currentTrainingConfig: any, isAdditionalModel: boolean, cbFinish: (err: any, res: any) => void) => void;
  _createSnapshotFeatureGroupFromDatasetVersion: (datasetVersion: string, tableName: string, cbFinish: (err: any, res: any) => void) => void;
  trainModelsAuto: (
    projectId: string,
    trainingConfig: any,
    name: string,
    refreshSchedule: string,
    featureGroupIds: string[],
    cpuSize: string,
    memory: number,
    customAlgorithmConfigs: any,
    builtinAlgorithms: string[],
    algorithmTrainingConfigs: any[],
    cbFinish: (err: any, res: any) => void,
  ) => void;
  updateModelTrainingConfig: (modelId: string, trainingConfig: any, featureGroupIds: string[], cbFinish: (err: any, res: any) => void) => void;
  _getAdditionalMetricsDataByModelVersion: (modelVersion: string, additionalMetricsKey: string, algorithm: string, validation: boolean, dataClusterType, cbFinish: (err: any, res: any) => void) => void;
  getDefaultModelName: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  getDefaultDeploymentName: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  retrainModel: (
    modelId: string,
    deploymentIds: string[],
    featureGroupIds: string[],
    cpuSize: string,
    memory: number,
    customAlgorithmConfigs: any,
    builtinAlgorithms: string[],
    algorithmTrainingConfigs: any[],
    cbFinish: (err: any, res: any) => void,
  ) => void;
  cancelModelTraining: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteModelVersion: (modelVersion: string, cbFinish: (err: any, res: any) => void) => void;
  describeFeatureGroupByTableName: (tableName: string, projectId, cbFinish: (err: any, res: any) => void) => void;
  _checkTableName: (tableName: string, cbFinish: (err: any, res: any) => void) => void;
  _listAvailableProblemTypesForAlgorithms: (cbFinish: (err: any, res: any) => void) => void;
  _getCpuAndMemoryOptions: (cbFinish: (err: any, res: any) => void) => void;

  createFeatureGroupSnapshot: (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  listFeatureGroupVersions: (featureGroupId: string, limit: number, startAfterInstanceId: string, cbFinish: (err: any, res: any) => void) => void;
  describeFeatureGroupVersion: (featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => void;

  setAutoDeployment: (deploymentId: string, enable: boolean, cbFinish: (err: any, res: any) => void) => void;
  getUser: (cbFinish: (err: any, res: any) => void) => void;
  setUserAsAdmin: (email: string, cbFinish: (err: any, res: any) => void) => void;
  _createAccount: (name: string, email: string, password: string, recaptchaToken: string, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => void;
  deleteInvite: (userInviteId: any, cbFinish: (err: any, res: any) => void) => void;
  inviteUser: (email: any, cbFinish: (err: any, res: any) => void) => void;
  acceptInvite: (email: string, organizationId: string, userInviteId: string, name: string, password: string, userInviteSecret: string, cbFinish: (err: any, res: any) => void) => void;
  acceptInviteLoggedIn: (userInviteToken: string, cbFinish: (err: any, res: any) => void) => void;
  listUserInvites: (cbFinish: (err: any, res: any) => void) => void;

  _googleSignIn: (googleToken: any, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => void;
  _githubSignIn: (githubToken: any, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => void;
  _oktaSignin: (oktaToken: any, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => void;
  _azureSignIn: (azureToken: any, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => void;
  _genericEndpoint: (endpoint: string, obj: any, cbFinish: (err: any, res: any) => void) => void;
  _signIn: (email: string, password: string, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => void;
  _resetPassword: (userId: string, requestToken: string, password: string, cbFinish: (err: any, res: any) => void) => void;
  _resetPasswordRequest: (email: any, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => void;
  _signOut: (cbFinish: (err: any, res: any) => void) => void;

  _setDeploymentConfig: (deploymentId: string, config: string, cbFinish: (err: any, res: any) => void) => void;
  setDeploymentFeatureGroupExportFileConnectorOutput: (deploymentId: string, fileFormat: string, outputLocation: string, cbFinish: (err: any, res: any) => void) => void;
  setDeploymentFeatureGroupExportDatabaseConnectorOutput: (
    deploymentId: string,
    databaseConnectorId: string,
    objectName: string,
    writeMode: string,
    databaseFeatureMapping: any,
    idColumn: string,
    additionalIdColumns: any,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  removeDeploymentFeatureGroupExportOutput: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  _getDeploymentConfigOptions: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  _getModelPredictionConfigOptions: (modelId: string, cbFinish: (err: any, res: any) => void) => void;

  _createPlaceholderOrganization: (cbFinish: (err: any, res: any) => void) => void;
  _selectActiveOrganization: (organizationId: string, cbFinish: (err: any, res: any) => void) => void;
  createOrganization: (name: string, workspace: string, discoverable: boolean, cbFinish: (err: any, res: any) => void) => void;
  listOrganizations: (cbFinish: (err: any, res: any) => void) => void;
  joinOrganization: (organizationId: string, cbFinish: (err: any, res: any) => void) => void;
  _verifyAccount: (userId: string, verificationToken: string, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => void;
  _resendVerification: (userId: string, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => void;

  add_dataset: (
    isDocumentset: boolean,
    newVersionDatasetId: string,
    name: string,
    projectId: any,
    datasetType: string,
    fileFormat: string,
    tableName: string,
    csvDelimiter: string,
    extractBoundingBoxes: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  addDatasetVersion: (dataset_id: any, cbFinish: (err: any, res: any) => void) => void;
  snapshotStreamingData: (dataset_id: any, cbFinish: (err: any, res: any) => void) => void;

  createPointInTimeGroup: (
    featureGroupId: string,
    groupName: string,
    aggregationKeys: any[],
    windowKey: string,
    lookbackWindow: number,
    lookbackWindowLag: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    historyTableName,
    historyWindowKey,
    historyAggregationKeys,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  updatePointInTimeGroup: (
    featureGroupId: string,
    groupName: string,
    aggregationKeys: any[],
    windowKey: string,
    lookbackWindow: number,
    lookbackWindowLag: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    historyTableName,
    historyWindowKey,
    historyAggregationKeys,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  deletePointInTimeGroup: (featureGroupId: string, groupName: string, cbFinish: (err: any, res: any) => void) => void;
  createPointInTimeGroupFeature: (featureGroupId: string, groupName: string, name: string, expression: string, cbFinish: (err: any, res: any) => void) => void;
  updatePointInTimeGroupFeature: (featureGroupId: string, groupName: string, name: string, expression: string, cbFinish: (err: any, res: any) => void) => void;
  _setPointInTimeGroupFeatureExpressions: (featureGroupId: string, groupName: string, expressions: string, cbFinish: (err: any, res: any) => void) => void;
  _addPointInTimeGeneratedFeatures: (featureGroupId: string, groupName: string, columns: string[], windowFunctions: string[], prefix: string, cbFinish: (err: any, res: any) => void) => void;

  import_dataset: (
    isDocumentset: boolean,
    name: string,
    fileFormat: string,
    location: string,
    projectId: any,
    datasetType: string,
    refreshSchedule: string,
    tableName: string,
    csvDelimiter: string,
    filenameColumn: string,
    startPrefix: string,
    untilPrefix: string,
    locationDateFormat,
    dateFormatLookbackDays,
    incremental,
    mergeFileSchemas,
    extractBoundingBoxes: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  importDatasetVersion: (dataset_id: any, location: string, fileFormat: string, csvDelimiter: string, mergeFileSchemas: boolean, cbFinish: (err: any, res: any) => void) => void;
  importDatasetVersionFromDatabaseConnector: (dataset_id: any, objectName: string, columns: string, queryArguments: string, sqlQuery: string, cbFinish: (err: any, res: any) => void) => void;
  listDatasetVersions: (datasetId: string, limit: number, startAfterVersion: string, cbFinish: (err: any, res: any) => void) => void;
  _downloadSmallFeatureGroupCSV: (featureGroupId: string, columnFilters: string[], cbFinish: (err: any, res: any) => void) => void;

  _getStreamingIds: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _getCurrentHourRowCount: (datasetId: string, cbFinish: (err: any, res: any) => void) => void;
  _getRecentWrites: (datasetId: string, cbFinish: (err: any, res: any) => void) => void;
  _captureStreamingSchema: (datasetId: string, cbFinish: (err: any, res: any) => void) => void;
  listDeployVersions: (deployId: string, limit: number, cbFinish: (err: any, res: any) => void) => void;
  listDeployVersionsHistory: (deployId: string, limit: number, cbFinish: (err: any, res: any) => void) => void;
  _describeDeploymentVersion: (deploymentVersion: string, cbFinish: (err: any, res: any) => void) => void;
  _getBatchPredictionArgs: (deploymentId: string, isFgTrain: boolean, forEval: boolean, featureGroupOverrides: any, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureGroupSamplingConfigOptions: (featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  createSamplingFeatureGroup: (featureGroupId: string, tableName: string, samplingConfig: any, description: string, lockType: number, tags: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  setFeatureGroupSamplingConfig: (featureGroupId: string, samplingConfig: any, cbFinish: (err: any, res: any) => void) => void;
  _listProblemTypes: (cbFinish: (err: any, res: any) => void) => void;

  delete_dataset: (dataset_id: any, cbFinish: (err: any, res: any) => void) => void;

  uploadFile: (url: string, file: any, contentType: string, cbProgress: (progress: number, percent: number) => void, cbFinish: (err: any, res: any) => void) => void;

  _deployPretrainedModel: (projectId: string, algorithm: string, cbFinish: (err: any, res: any) => void) => void;
  createDeployment: (
    projectId: string,
    autoDeploy: boolean,
    modelId: string,
    modelVersion: string,
    algorithm: string,
    algorithmFiltered: string,
    additionalModelName: string,
    featureGroupId: string,
    name: string,
    description: string,
    callsPerSecond: any,
    start: boolean,
    attachedStreamingFg: string,
    streamingFgDataUses: any[],
    trainedModelType: string,
    createFeedbackStreamingFg: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  setDeploymentModelVersion: (deploymentId: string, modelVersion: boolean, algorithm: string, algorithmFiltered: string, trainedModelType: string, cbFinish: (err: any, res: any) => void) => void;
  deployListForProject: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteDeployment: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  startDeployment: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  stopDeployment: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  renameDeployment: (deploymentId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  _getPykernelMetaserviceInfo: (cbFinish: (err: any, res: any) => void) => void;
  getNotebookCellCompletion: (completionType: string, previousCells: string, cbFinish: (err: any, res: any) => void) => void;
  _listNotebookVersions: (notebookId: string, cbFinish: (err: any, res: any) => void) => void;
  _getProjectFeatureGroupLineage: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  setModelObjective: (modelVersion: string, metric: string, cbFinish: (err: any, res: any) => void) => void;
  _setMetricsSortObjectiveForUi: (modelVersion: string, metric: string, cbFinish: (err: any, res: any) => void) => void;
  _getFreeTier: (cbFinish: (err: any, res: any) => void) => void;
  _getRates: (cbFinish: (err: any, res: any) => void) => void;

  _setDatasetPublicSource: (datasetId, url, cbFinish: (err: any, res: any) => void) => void;
  _setDefaultPaymentMethod: (paymentMethodId: string, cbFinish: (err: any, res: any) => void) => void;
  _listPaymentMethods: (cbFinish: (err: any, res: any) => void) => void;
  _listInvoices: (cbFinish: (err: any, res: any) => void) => void;
  _getPublicKey: (cbFinish: (err: any, res: any) => void) => void;
  _getBillingAccount: (cbFinish: (err: any, res: any) => void) => void;
  _getCurrentUsage: (since, until, daily, cbFinish: (err: any, res: any) => void) => void;
  _getNextBillingDate: (cbFinish: (err: any, res: any) => void) => void;
  _deletePaymentMethod: (paymentMethodId: string, cbFinish: (err: any, res: any) => void) => void;
  _createBillingAccount: (cbFinish: (err: any, res: any) => void) => void;
  _addPaymentMethodIntent: (cbFinish: (err: any, res: any) => void) => void;
  _confirmPaymentMethodIntent: (cbFinish: (err: any, res: any) => void) => void;
  _addPaymentMethod: (card: any, billing_details: any, cbFinish: (err: any, res: any) => void) => void;
  _getProductDetails: (cbFinish: (err: any, res: any) => void) => void;
  getMetricsRanges: (cbFinish: (err: any, res: any) => void) => void;
  _getMetricsDataByModel: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  _getMetricsDataByModelVersion: (modelVersion: string, algorithm: string, validation, nRows, sortByClass, dataClusterType, cbFinish: (err: any, res: any) => void) => void;

  _getPythonSuggestion: (prompt: string, cbFinish: (err: any, res: any) => void) => void;
  _getSqlSuggestionForRawData: (featureGroupId: string, prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _callOpenAi: (prompt: string, options: any, language: string, cbFinish: (err: any, res: any) => void) => void;
  _internalGetPythonSuggestion: (prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _internalGetSqlSuggestionForRawData: (featureGroupId: string, prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;

  listProjects: (cbFinish: (err: any, res: any) => void) => void;
  _billingGetUrl: (cbFinish: (err: any, res: any) => void) => void;

  _setIgnoreAndRetrain: (modelId: string, columns: string[], cbFinish: (err: any, res: any) => void) => void;
  _createNewVersions: (projectId: string, refreshType: string, cbFinish: (err: any, res: any) => void) => void;

  _listRegions: (service: 'aws' | 'gcp' | 'azure', cbFinish: (err: any, res: any) => void) => void;
  listApiKeys: (cbFinish: (err: any, res: any) => void) => void;
  createApiKey: (tag: string, cbFinish: (err: any, res: any) => void) => void;
  deleteApiKey: (apiKeyId: string, cbFinish: (err: any, res: any) => void) => void;

  _inviteUserExists: (userInviteId: string, cbFinish: (err: any, res: any) => void) => void;

  _getExampleDatasets: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _useExampleDatasets: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  listDeploymentTokens: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteDeploymentToken: (deploymentToken: string, cbFinish: (err: any, res: any) => void) => void;
  createDeploymentToken: (projectId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  describeDeployment: (deploymentId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange?) => void;
  describeProject: (projectId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange?) => void;
  _setFeatureNote: (featureGroupId: string, feature: string, note: string, cbFinish: (err: any, res: any) => void) => void;
  _setFeatureTags: (featureGroupId: string, feature: string, tags: string[], cbFinish: (err: any, res: any) => void) => void;
  addProjectTags: (projectId: string, tags: string[], cbFinish: (err: any, res: any) => void) => void;
  removeProjectTags: (projectId: string, tags: string[], cbFinish: (err: any, res: any) => void) => void;

  _setLeadModel: (modelId: string, algorithm: string, dataClusterType, cbFinish: (err: any, res: any) => void) => void;
  _describeModelVersion: (modelVersion: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange?) => void;
  deleteModel: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  describeModel: (modelId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange?) => void;
  getModelMetrics: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  listModels: (projectId: string, cbFinish: (err: any, res: any) => void) => void;

  createChatLLMResponseRequest: (deploymentId: string, messages: any[], searchResults: any[], cbFinish: (err: any, res: any) => void) => void;
  getChatLLMResponseRequestStatus: (requestId: bigint, cbFinish: (err: any, res: any) => void) => void;
  createChatLLMSendMessageRequest: (deploymentConversationId: string, message: string, cbFinish: (err: any, res: any) => void) => void;
  getChatLLMSendMessageRequestStatus: (requestId: string, cbFinish: (err: any, res: any) => void) => void;

  executeAgent: (deploymentId: string, query: string, keywordArguments: any, chatHistory: any[], cbFinish: (err: any, res: any) => void) => void;
  listModelVersions: (modelId: string, cbFinish: (err: any, res: any) => void) => void;
  listProjectDatasets: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _getSampleCode: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;
  _getDataAugmentationComparison: (modelId: string, variation: number, cbFinish: (err: any, res: any) => void) => void;
  _promoteDeploymentVersion: (deploymentId: string, modelVersion: string, algorithm: string, cbFinish: (err: any, res: any) => void) => void;
  promoteDeploymentFeatureGroupVersion: (deploymentId: string, featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => void;
  upgradeDeployment: (deploymentId: string, cbFinish: (err: any, res: any) => void) => void;

  setDatasetEphemeral: (datasetId: string, ephemeral: boolean, cbFinish: (err: any, res: any) => void) => void;
  setDatasetLookbackDays: (datasetId: string, lookbackDays: boolean, cbFinish: (err: any, res: any) => void) => void;

  addExternalBucketAWSRole: (bucket: string, roleArn: string, cbFinish: (err: any, res: any) => void) => void;
  setAzureBlobConnectionString: (bucket: string, connectionString: string, cbFinish: (err: any, res: any) => void) => void;
  getExternalBucketOwnershipTest: (bucket: string, writePermission: boolean, cbFinish: (err: any, res: any) => void) => void;
  listExternalBuckets: (cbFinish: (err: any, res: any) => void) => void;
  listDatabaseConnectors: (cbFinish: (err: any, res: any) => void) => void;
  listApplicationConnectors: (cbFinish: (err: any, res: any) => void) => void;
  listStreamingConnectors: (cbFinish: (err: any, res: any) => void) => void;
  renameDatabaseConnector: (databaseConnectorId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  renameApplicationConnector: (applicationConnectorId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  renameStreamingConnector: (streamingConnectorId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  _fileExists: (bucket: string, path: string, cbFinish: (err: any, res: any) => void) => void;
  verifyExternalBucket: (bucket: string, cbFinish: (err: any, res: any) => void) => void;
  verifyExternalDatabase: (databaseConnectorId, cbFinish: (err: any, res: any) => void) => void;
  verifyApplicationConnector: (applicationConnectorId, cbFinish: (err: any, res: any) => void) => void;
  verifyStreamingConnector: (streamingConnectorId, cbFinish: (err: any, res: any) => void) => void;
  removeExternalBucket: (bucket: string, cbFinish: (err: any, res: any) => void) => void;
  removeDatabaseConnector: (databaseConnectorId: string, cbFinish: (err: any, res: any) => void) => void;
  removeStreamingConnector: (streamingConnectorId: string, cbFinish: (err: any, res: any) => void) => void;
  getDatabaseConnectorInstructions: (service: string, currentAuth: any, cbFinish: (err: any, res: any) => void) => void;
  getApplicationConnectorInstructions: (service: string, cbFinish: (err: any, res: any) => void) => void;
  getStreamingConnectorInstructions: (service: string, cbFinish: (err: any, res: any) => void) => void;
  listValidDatabaseConnectors: (cbFinish: (err: any, res: any) => void) => void;
  listValidApplicationConnectors: (cbFinish: (err: any, res: any) => void) => void;
  listValidStreamingConnectors: (cbFinish: (err: any, res: any) => void) => void;
  listValidFileConnectors: (cbFinish: (err: any, res: any) => void) => void;
  listDatabaseConnectorObjects: (databaseConnectorId: string, cbFinish: (err: any, res: any) => void) => void;
  getDatabaseConnectorObjectSchema: (databaseConnectorId: string, objectName: string, cbFinish: (err: any, res: any) => void) => void;
  createDatasetFromDatabaseConnector: (
    isDocumentset: boolean,
    databaseConnectorId: string,
    objectName: string,
    columns: string,
    name: string,
    queryArguments: string,
    projectId: string,
    datasetType: string,
    tableName: string,
    sqlQuery: string,
    incremental: boolean,
    timestampColumn: string,
    refreshSchedule: string,
    cbFinish: (err: any, res: any) => void,
  ) => void;

  setFeatureType: (featureGroupId: string, feature: string, featureType: string, cbFinish: (err: any, res: any, isLast?: boolean) => void) => void;
  setFeatureMapping: (projectId: string, featureGroupId: string, featureName: string, featureMapping: string, nestedColumnName: string, cbFinish: (err: any, res: any, isLast?: boolean) => void) => void;
  _validateProjectFeatureGroups: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _bulkSetProjectFeatureGroupTypesAndFeatureMappings: (projectId: string, featureGroupTypeMappings: any[], cbFinish: (err: any, res: any) => void) => void;
  inferFeatureMappings: (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;

  _getFeatureDriftModelMonitorSummary: (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => void;
  _getEmbeddingDriftDistributions: (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => void;
  getDriftForFeature: (modelMonitorVersion, featureName, nestedFeatureName, cbFinish: (err: any, res: any) => void) => void;
  getPredictionDrift: (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => void;
  getOutliersForFeature: (modelMonitorVersion, featureName, nestedFeatureName, cbFinish: (err: any, res: any) => void) => void;
  getOutliersForBatchPredictionFeature: (batchPredictionVersion, featureName, nestedFeatureName, cbFinish: (err: any, res: any) => void) => void;

  useFeatureGroupForTraining: (projectId: string, featureGroupId: string, useForTraining: boolean, cbFinish: (err: any, res: any) => void) => void;
  updateFeatureGroupDatasetType: (projectId: string, featureGroupId: string, datasetType: string, cbFinish: (err: any, res: any) => void) => void;

  setFeatureGroupIndexingConfig: (featureGroupId: string, primaryKey: string, updateTimestampKey: string, lookupKeys: string[], cbFinish: (err: any, res: any) => void) => void;
  updateFeatureGroup: (featureGroupId, name, description, tags, cbFinish: (err: any, res: any) => void) => void;
  updateFeatureGroupSqlDefinition: (featureGroupId, sql, cbFinish: (err: any, res: any) => void) => void;
  updateFeatureGroupFunctionDefinition: (
    featureGroupId,
    functionSourceCode,
    functionName,
    inputFeatureGroups,
    cpuSize,
    memory,
    packageRequirements,
    useOriginalCsvNames: boolean,
    pythonFunctionBindings: any[],
    cbFinish: (err: any, res: any) => void,
  ) => void;

  updateFeature: (featureGroupId, name, sql, newName, cbFinish: (err: any, res: any) => void) => void;
  addFeatureGroup: (tableName, sql, description, cbFinish: (err: any, res: any) => void) => void;
  createFeatureGroup: (tableName, sql, description, tags, lockType: FGLockType, cbFinish: (err: any, res: any) => void) => void;
  createFeatureGroupFromFunction: (
    tableName,
    functionSourceCode,
    functionName,
    inputFeatureGroups: string[],
    description,
    tags,
    lockType: FGLockType,
    memory,
    cpuSize,
    pythonFunctionName,
    pythonFunctionBindings: any[],
    cbFinish: (err: any, res: any) => void,
  ) => void;
  _listSupportedPythonFunctionArgumentTypes: (cbFinish: (err: any, res: any) => void) => void;
  lookupFeatures: (deploymentToken: string, deploymentId: string, queryData: any, cbFinish: (err: any, res: any) => void) => void;
  setBatchPredictionFeatureGroupOutput: (batchPredictionId: string, tableName: string, cbFinish: (err: any, res: any) => void) => void;

  _getProblemTypeCustomModelInfo: (problemType: string, projectId: any, cbFinish: (err: any, res: any) => void) => void;
  attachFeatureGroupToProject: (featureGroupId, projectId, datasetType, cbFinish: (err: any, res: any) => void) => void;
  removeFeatureGroupFromProject: (featureGroupId, projectId, cbFinish: (err: any, res: any) => void) => void;
  addFeature: (featureGroupId: string, name: string, sql: string, cbFinish: (err: any, res: any) => void) => void;
  _describeProjectFeatureGroup: (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange?: boolean) => void;
  _describeFeatureGroupList: (featureGroupIds: string[], cbFinish: (err: any, res: any) => void) => void;
  describeFeatureGroup: (featureGroupId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange?: boolean) => void;
  _listFeatureGroups: (projectId, cbFinish: (err: any, res: any) => void) => void;
  _listFeatureGroupsDashboard: (filterFeatureGroupUse, limit, startAfterId, search, starred, cbFinish: (err: any, res: any) => void) => void;
  listFeatureGroups: (limit: number, startAfterId: string, projectId, featureGroupTemplateId, cbFinish: (err: any, res: any) => void) => void;
  createModelFromPython: (
    projectId: string,
    functionSourceCode: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainingInputTables: string[],
    name: string,
    memory: any,
    cpuSize: string,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  createModelFromZip: (
    projectId: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    name: string,
    cpuSize: string,
    memory: number,
    packageRequirements: any,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  createModelFromGit: (
    projectId: string,
    applicationConnectorId: string,
    branchName: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    pythonRoot: string,
    name: string,
    cpuSize: string,
    memory: number,
    packageRequirements: any,
    cbFinish: (err: any, res: any) => void,
  ) => void;

  listDocumentRetrievers: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  createDocumentRetriever: (projectId: string, name: string, featureGroupId: string, documentRetrieverConfig: any, cbFinish: (err: any, res: any) => void) => void;
  updateDocumentRetriever: (documentRetrieverId: string, name: string, featureGroupId: string, documentRetrieverConfig: any, cbFinish: (err: any, res: any) => void) => void;
  describeDocumentRetriever: (documentRetrieverId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteDocumentRetriever: (documentRetrieverId: string, cbFinish: (err: any, res: any) => void) => void;
  listDocumentRetrieverVersions: (documentRetrieverId: string, cbFinish: (err: any, res: any) => void) => void;
  describeDocumentRetrieverVersion: (documentRetrieverVersion: string, cbFinish: (err: any, res: any) => void) => void;
  createDocumentRetrieverVersion: (documentRetrieverId: string, cbFinish: (err: any, res: any) => void) => void;

  updatePythonModel: (
    modelId: string,
    functionSourceCode: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainingInputTables: string[],
    memory: any,
    cpuSize: string,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  updatePythonModelZip: (
    modelId: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    cpuSize: string,
    memory: number,
    packageRequirements: any,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  updatePythonModelGit: (
    modelId: string,
    applicationConnectorId: string,
    branchName: string,
    pythonRoot: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    cpuSize: string,
    memory: number,
    cbFinish: (err: any, res: any) => void,
  ) => void;

  _listFileConnectorFiles: (bucket: string, path: string, pageSize: number, pageToken: string, useFolders: boolean, cbFinish: (err: any, res: any) => void) => void;

  setFeatureGroupModifierLock: (featureGroupId: string, locked: boolean, cbFinish: (err: any, res: any) => void) => void;
  addOrganizationGroupToFeatureGroupModifiers: (featureGroupId: string, organizationGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  removeOrganizationGroupFromFeatureGroupModifiers: (featureGroupId: string, organizationGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  _listOrganizationGroupFeatureGroupModifiers: (organizationGroupId: string, cbFinish: (err: any, res: any) => void) => void;

  _listProjectFeatureGroups: (projectId, cbFinish: (err: any, res: any) => void) => void;
  listProjectFeatureGroups: (projectId: string, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureRecord: (featureGroupId: string, recordId, cbFinish: (err: any, res: any) => void) => void;
  exportFeatureGroup: (featureGroupId: string, location: string, cbFinish: (err: any, res: any) => void) => void;
  getFeatureGroupVersionExportDownloadUrl: (featureGroupExportId: string, cbFinish: (err: any, res: any) => void) => void;
  exportFeatureGroupVersionToConsole: (featureGroupVersion: string, exportFileFormat: 'CSV' | 'JSON', cbFinish: (err: any, res: any) => void) => void;
  exportFeatureGroupVersionToFileConnector: (featureGroupVersion: string, location: string, exportFileFormat: 'CSV' | 'JSON', overwrite: boolean, cbFinish: (err: any, res: any) => void) => void;
  exportFeatureGroupVersionToDatabaseConnector: (
    featureGroupVersion: string,
    databaseConnectorId: string,
    objectName: string,
    writeMode: string,
    databaseFeatureMapping: any,
    idColumn: string,
    additionalIdColumns: any,
    cbFinish: (err: any, res: any) => void,
  ) => void;
  describeExport: (exportId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange?: boolean) => void;
  getExportResult: (exportId: string, cbFinish: (err: any, res: any) => void) => void;
  listFeatureGroupExports: (featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  _listFeatureGroupExports: (featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  deleteFeature: (featureGroupId: string, name: string, cbFinish: (err: any, res: any) => void) => void;
  deleteFeatureGroup: (featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  upsertRecord: (datasetId: string, data: any, recordId: string, eventTimestamp: number, cbFinish: (err: any, res: any) => void) => void;
  _formatSQL: (sql: string, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureGroupProjects: (featureGroupId: string, cbFinish: (err: any, res: any) => void) => void;
  setProjectFeatureGroupConfig: (featureGroupId: string, projectId: string, projectConfig: any, cbFinish: (err: any, res: any) => void) => void;
  setDatasetColumnDataType: (datasetId: string, column: string, dataType: string, cbFinish: (err: any, res: any) => void) => void;
  setDatasetColumnDataTypeQueue: (datasetId: string, column: string, dataType: string, cbFinish: (err: any, res: any, isLast?: boolean) => void) => void;
  _copyFeatureGroup: (featureGroupId: string, tableName: string, copySchema: boolean, copyNested: boolean, projectId: string, cbFinish: (err: any, res: any) => void) => void;

  _addPredictionFile: (deploymentId: string, file: any, fileName: string, fileFormat, cbFinish: (err: any, res: any) => void) => void;
  _getPredictionFiles: (deploymentId, cbFinish: (err: any, res: any) => void) => void;
  _deletePredictionFiles: (deploymentId: string, fileId, cbFinish: (err: any, res: any) => void) => void;

  _getFeatureGroupVersionSampleData: (featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => void;

  getTrainingLogs: (modelVersion: string, stdout: boolean, stderr: boolean, cbFinish: (err: any, res: any) => void) => void;
  getMaterializationLogs: (featureGroupVersion: string, stdout: boolean, stderr: boolean, cbFinish: (err: any, res: any) => void) => void;

  postCustom: (url: string, data: any, options?: ICallApiOptions, cbFinish?: (err: any, res: any) => void) => void;
  postJson: (url: string, json: string, options?: ICallApiOptions, cbFinish?: (err: any, res: any) => void) => void;
  _fetchDoc: (doc: string, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureGroupDocuments: (projectId: string, featureGroupId: string, fromRow: number, toRow: number, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureGroupVersionDocuments: (projectId: string, featureGroupVersion: string, fromRow: number, toRow: number, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureDriftSummary: (deploymentId: string, startDate: string, endDate: string, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureDriftBatchPredictionSummary: (batchPredictionVersion: string, cbFinish: (err: any, res: any) => void) => void;
  _getAccessStatisticsOverTime: (deploymentId: string, startDate: string, endDate: string, granularity: string, region: string, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureDriftSingleFeatureDistribution: (deploymentId: string, startDate: string, endDate: string, featureName: string, cbFinish: (err: any, res: any) => void) => void;
  _getFeatureDriftBatchPredictionSingleFeatureDistribution: (batchPredictionVersion: string, featureName: string, cbFinish: (err: any, res: any) => void) => void;

  _getNotebookMetaserviceInfo: (notebookId: string, cbFinish: (err: any, res: any) => void) => void;
  _createAgentFunctionFileInNotebook: (projectId: string, modelId: string, cbFinish: (err: any, res: any) => void) => void;
  getEntitiesFromPDF: (deploymentToken: string, deploymentId: string, pdf: any, cbFinish: (err: any, res: any) => void) => void;
  _getEntitiesFromPDF: (deploymentId: string, pdf: any, docId: string, returnExtractedFeatures: boolean, cbFinish: (err: any, res: any) => void) => void;
  _getSampleStreamingCode: (featureGroupId: string, projectId: string, cbFinish: (err: any, res: any) => void) => void;
  setFeatureGroupSchema: (featureGroupId: string, schema: any[], cbFinish: (err: any, res: any) => void) => void;
  _predictClass: (deploymentId: string, queryData: any, threshold: number, thresholdClass: string, cbFinish: (err: any, res: any) => void) => void;
  _pointInTimeFeatureGroupCreationOptions: (cbFinish: (err: any, res: any) => void) => void;
  getCluster: (deploymentToken: string, deploymentId: string, queryData: any, cbFinish: (err: any, res: any) => void) => void;

  createNaturalLanguageExplanationRequest: (featureGroupId: string, featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => void;
  getNaturalLanguageExplanationRequestStatus: (requestId: bigint, cbFinish: (err: any, res: any) => void) => void;

  createAIChatSendMessageRequest: (chatSessionId: string, message: string, url: string, cbFinish: (err: any, res: any) => void) => void;
  getAIChatSendMessageRequestStatus: (requestId: bigint, cbFinish: (err: any, res: any) => void) => void;
  cancelAIChatSendMessageRequest: (requestId: bigint, cbFinish: (err: any, res: any) => void) => void;

  createExecuteAgentRequest: (deploymentId: string, query: string, keywordArguments: any, chatHistory: any[], cbFinish: (err: any, res: any) => void) => void;
  getExecuteAgentRequestStatus: (requestId: bigint, cbFinish: (err: any, res: any) => void) => void;
  listPipelineVersionLogs: (pipelineVersion: string, cbFinish: (err: any, res: any) => void) => void;
}

interface IREClientPromises_ {
  generateNaturalLanguageExplanation: (featureGroupId: string, featureGroupVersion: string, modelId: string) => Promise<any>;
  setNaturalLanguageExplanation: (shortExplanation: string, longExplanation: string, featureGroupId: string, featureGroupVersion: string, modelId: string) => Promise<any>;
  getNaturalLanguageExplanation: (featureGroupId: string, featureGroupVersion: string, modelId: string) => Promise<any>;
  createDeploymentWebhook: (deploymentId: string, endpoint: string, webhookEventType: EWebhookEventType, payloadTemplate: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  updateWebhook: (webhookId: string, endpoint: string, webhookEventType: EWebhookEventType, payloadTemplate: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  listDeploymentWebhooks: (deploymentId: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  describeWebhook: (webhookId: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  deleteWebhook: (webhookId: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  queryFeatureGroupExplorer: (featureGroupVersion, message, chatHistory, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _searchByName: (searchTerm: string, artifactTypes: string[], searchLimit: number) => Promise<any>;
  _searchById: (artifactId: string) => Promise<any>;
  queryFeatureGroupCodeGenerator: (query: string, language: string, projectId: string) => Promise<any>;
  createChatSession: (projectId: string) => Promise<any>;
  _exportAiChatToNotebook: (chatSessionId: string, messageIndex: number, segmentIndex: number) => Promise<any>;
  _createFeatureGroupFileInNotebook: (projectId: string, featureGroupId: string) => Promise<any>;
  _createModelMetricsAnalysisFileInNotebook: (modelVersion: string) => Promise<any>;
  _setChatMessageFeedback: (chatSessionId: string, messageIndex: number, segmentIndex: number, isUseful: boolean, feedback: string) => Promise<any>;
  sendChatMessage: (chatSessionId: string, message: string) => Promise<any>;
  getChatSession: (chatSessionId: string) => Promise<any>;
  listChatSessions: (mostRecentPerProject: boolean) => Promise<any>;
  _hideChatSession: (chatSessionId: string) => Promise<any>;

  createDeploymentConversation: (deploymentId: string, name: string) => Promise<any>;
  getDeploymentConversation: (deploymentConversationId: string) => Promise<any>;
  listDeploymentConversations: (deploymentId: string) => Promise<any>;
  deleteDeploymentConversation: (deploymentConversationId: string) => Promise<any>;
  setDeploymentConversationFeedback: (deploymentConversationId: string, messageIndex: number, isUseful: boolean, isNotUseful: boolean, feedback: string) => Promise<any>;

  createAgent: (projectId: string, functionSourceCode: string, agentFunctionName: string, name: string, memory: number, packageRequirements: any[], description: string) => Promise<any>;
  updateAgent: (modelId: string, functionSourceCode: string, agentFunctionName: string, memory: number, packageRequirements: any[], description: string) => Promise<any>;

  _isFeatureGroupNameUsed: (featureGroupName: string) => Promise<any>;
  _isPythonFunctionNameUsed: (pythonFunctionName: string, organizationId: string) => Promise<any>;
  createPythonFunction: (name: string, sourceCode: string, functionName: string, functionVariableMappings: any[], projectId: string, packageRequirements: string[], functionType: PythonFunctionTypeParam) => Promise<any>;
  _getPythonFunctionCodeTemplate: (functionName: string, inputVariables: any[], templateType: string) => Promise<any>;
  describePythonFunction: (name: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  updatePythonFunction: (name: string, sourceCode: string, functionName: string, functionVariableMappings: { name?; variable_type? }[], cbFinish: (err: any, res: any) => void) => Promise<any>;
  listPythonFunctions: (functionType: string, cbFinish: (err: any, res: any) => void) => Promise<any>;

  listPipelines: (projectId: string) => Promise<any>;
  describePipeline: (pipelineId: string) => Promise<any>;
  describePipelineVersion: (pipelineVersion: string) => Promise<any>;
  listPipelineVersions: (pipelineId: string) => Promise<any>;
  createPipeline: (pipelineName: string, projectId: string) => Promise<any>;
  deletePipeline: (pipelineId: string) => Promise<any>;
  runPipeline: (pipelineId: string, pipelineVariableMappings: any[]) => Promise<any>;
  updatePipeline: (pipelineId: string, pipelineVariableMappings: any[], cron: string, isProd: boolean) => Promise<any>;
  resumePipelineRefreshSchedule: (pipelineId: string) => Promise<any>;
  pausePipelineRefreshSchedule: (pipelineId: string) => Promise<any>;
  unsetPipelineRefreshSchedule: (pipelineId: string) => Promise<any>;

  _getPythonArguments: (functionName: any, sourceCode: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  deletePythonFunction: (name: any) => Promise<any>;
  listPythonFunctionFeatureGroups: (nameUse: string, limit: number, cbFinish: (err: any, res: any) => void) => Promise<any>;

  _createCustomLossFunctionNotebook: (name: string, lossFunctionType: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  describeCustomLossFunction: (name: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  listCustomLossFunctions: (cbFinish: (err: any, res: any) => void) => Promise<any>;
  deleteCustomLossFunction: (name: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _listAvailableLossTypes: (cbFinish: (err: any, res: any) => void) => Promise<any>;

  _createCustomMetricNotebook: (name: string, problemType: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  describeCustomMetric: (name: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  listCustomMetrics: (cbFinish: (err: any, res: any) => void) => Promise<any>;
  deleteCustomMetric: (name: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _listSupportedCustomMetricProblemTypes: (cbFinish: (err: any, res: any) => void) => Promise<any>;

  describeModule: (name: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  listModules: (cbFinish: (err: any, res: any) => void) => Promise<any>;
  deleteModule: (name: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  createModule: (name: any, cbFinish: (err: any, res: any) => void) => Promise<any>;

  _listProjectModelVersions: (projectId: string) => Promise<any>;
  _listProjectModelVersionsForDataset: (projectId: string, datasetId: string) => Promise<any>;
  _listProjectModelVersionsForFeatureGroup: (projectId: string, featureGroupId: string) => Promise<any>;

  _setDeploymentInfraConfig: (deploymentId: string, disableAutoShutdown: boolean, enableMonitoring: boolean, alertQps: number, alertLatencyMs: number) => Promise<any>;

  _getRecentPredictionRequestIds: (deploymentId: string, numRecords: number, startRequestId: number) => Promise<any>;
  _getPredictionRequestLogs: (deploymentId: string, requestId: string) => Promise<any>;
  _dumpPredictionRequestLogs: (deploymentId: string, numRecords: number, pageNum: number) => Promise<any>;

  _importFeatureGroupSchema: (project_id: string, feature_group_id: string, schema: File) => Promise<any>;
  _exportFeatureGroupSchema: (project_id: string, feature_group_id: string, modelVersion: string) => Promise<any>;
  _exportModelVersionSchema: (datasetId: string, featureGroupId: string, modelVersion: string) => Promise<any>;

  createModelFromDockerImage: (projectId: string, dockerImageUri: string, servicePort: number, name: string) => Promise<any>;
  createModelVersionFromDockerImage: (modelId: string) => Promise<any>;

  createAlgorithm: (
    name: string,
    problemType: string,
    sourceCode: string,
    trainingDataParameterNamesMapping: any,
    trainingConfigParameterName: string,
    trainFunctionName: string,
    predictFunctionName: string,
    predictManyFunctionName: string,
    initializeFunctionName: string,
    configOptions: any,
    isDefaultEnabled: boolean,
    projectId: string,
  ) => Promise<any>;
  deleteAlgorithm: (algorithm: string) => Promise<any>;
  describeAlgorithm: (algorithm: string) => Promise<any>;
  updateAlgorithm: (
    algorithm: string,
    sourceCode: string,
    trainingDataParameterNamesMapping: any,
    trainingConfigParameterName: string,
    trainFunctionName: string,
    predictFunctionName: string,
    predictManyFunctionName: string,
    initializeFunctionName: string,
    configOptions: any,
    isDefaultEnabled: boolean,
  ) => Promise<any>;
  listAlgorithms: (problemType: string, projectId: string) => Promise<any>;
  listBuiltinAlgorithms: (projectId: string, featureGroupIds: string[], trainingConfig: any) => Promise<any>;
  _listPretrainedModelAlgorithms: (useCase: string) => Promise<any>;

  updateFeatureGroupTemplateBindings: (featureGroupId: string, templateBindings: any) => Promise<any>;
  detachFeatureGroupFromTemplate: (featureGroupId: string) => Promise<any>;
  createFeatureGroupFromTemplate: (tableName: string, featureGroupTemplateId: string, templateVariables: any, shouldAttachFeatureGroupToTemplate: boolean, description: string, lockType: number, tags: string[]) => Promise<any>;
  suggestFeatureGroupTemplateForFeatureGroup: (featureGroupId: string) => Promise<any>;
  previewFeatureGroupTemplateResolution: (featureGroupTemplateId: string, templateSql: string, templateVariables: any, templateBindings: any, shouldValidate: boolean) => Promise<any>;
  updateFeatureGroupTemplate: (featureGroupTemplateId: string, name, templateSql: string, description, templateVariables: any) => Promise<any>;
  describeTemplate: (featureGroupTemplateId: string) => Promise<any>;
  listFeatureGroupTemplates: (limit: number, startAfterId: string, featureGroupId: string, shouldIncludeSystemTemplates: boolean) => Promise<any>;
  _getModelInfo: (deploymentId: string) => Promise<any>;
  listProjectFeatureGroupTemplates: (limit: number, startAfterId: string, projectId: string, shouldIncludeSystemTemplates: boolean) => Promise<any>;
  deleteFeatureGroupTemplate: (featureGroupTemplateId: string) => Promise<any>;
  createFeatureGroupTemplate: (featureGroupId: string, name: string, templateSql: string, templateVariables: any, description: string, shouldAttachFeatureGroupToTemplate: boolean) => Promise<any>;
  _getFeatureGroupTemplateVariableOptions: (templateSql: string, templateBindings: any) => Promise<any>;

  _createDataserverDeployment: (driverMemory, numExecutors, executorMemory, deploymentLifePeriod) => Promise<any>;
  _getDataserverDeployment: (dataserverSessionId) => Promise<any>;
  _listDataserverDeployments: () => Promise<any>;
  _deleteDataserverDeployment: () => Promise<any>;
  _getModelBlueprint: (modelVersion: string, algorithm: string) => Promise<any>;

  _bulkAddFeatureGroupsToProject: (projectId: string, featureGroupIds: string[]) => Promise<any>;
  _getFeatureGroupColumnTopValues: (projectId: string, featureGroupId: string, columnName: string) => Promise<any>;
  _createPredictionMetric: (featureGroupId: string, predictionMetricConfig, projectId) => Promise<any>;
  _describePredictionMetric: (predictionMetricId: string) => Promise<any>;
  _deletePredictionMetric: (predictionMetricId: string) => Promise<any>;
  _listPredictionMetrics: (projectId: string, featureGroupId: string, limit, startAfterId) => Promise<any>;
  setModelPredictionParams: (modelId: string, predictionConfig: any) => Promise<any>;
  _createNotebookTemplate: (notebookId: string, filename: string, templateName: string, description: string, templateType: string) => Promise<any>;
  _deleteNotebookTemplate: (notebookTemplateId: string) => Promise<any>;
  _describeNotebookTemplate: (notebookTemplateId: string) => Promise<any>;
  _listNotebookTemplates: (templateType: string) => Promise<any>;
  _updateNotebookTemplate: (notebookTemplateId: string, notebookId: string, filename: string, templateName: string, description: string, templateType: string) => Promise<any>;
  _listNotebookTemplateTypes: () => Promise<any>;
  _addTemplateToNotebook: (notebookId: string, notebookTemplateId: string) => Promise<any>;
  _openNotebook: (name: string, projectId: string, memory: number, useGpu: boolean, notebookTemplateId: string) => Promise<any>;

  _runPredictionMetric: (predictionMetricId: string) => Promise<any>;
  _listPredictionMetricVersions: (predictionMetricId: string, limit, startAfterId) => Promise<any>;
  _deletePredictionMetricVersion: (predictionMetricVersion: string) => Promise<any>;
  _describePredictionMetricVersion: (predictionMetricVersion: string) => Promise<any>;

  concatenateFeatureGroupData: (featureGroupId: string, sourceFeatureGroupId: string, mergeType: string, afterTimestamp: number, skipMaterialize: boolean) => Promise<any>;
  removeConcatenationConfig: (featureGroupId: string) => Promise<any>;

  createPointInTimeFeature: (
    featureGroupId: string,
    featureName: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
    onlineLookbackCount: number,
    onlineLookbackWindowSeconds: number,
  ) => Promise<any>;
  updatePointInTimeFeature: (
    featureGroupId: string,
    featureName: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
    newFeatureName: string,
    onlineLookbackCount: number,
    onlineLookbackWindowSeconds: number,
  ) => Promise<any>;
  estimatePointInTimeComplexity: (
    featureGroupId: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
  ) => Promise<any>;

  alertsMarkAsReadById: (alertId: string) => Promise<any>;
  alertsMarkAllRead: () => Promise<any>;

  _getBatchPredictionRow: (batchPredictionVersion: string, row: number) => Promise<any>;
  _getBatchPredictionRows: (batchPredictionVersion: string, rows: number, startAfter: number) => Promise<any>;
  _getDefaultQps: () => Promise<any>;
  _getUserPreferencesOptions: () => Promise<any>;
  _getUserPreferences: () => Promise<any>;
  _updateUserPreferences: (preferences: object) => Promise<any>;
  _setNewPassword: (currentPassword: string, newPassword: string) => Promise<any>;
  _updateEmail: (email: string) => Promise<any>;
  _updateOrganizationDiscoverability: (discoverable: boolean) => Promise<any>;

  createSnapshotFeatureGroup: (featureGroupVersion: string, tableName: string) => Promise<any>;
  createMergeFeatureGroup: (sourceFeatureGroupId: string, tableName: string, mergeConfig: any, description: string, lockType: number, tags: string[], projectId: string) => Promise<any>;
  setFeatureGroupMergeConfig: (featureGroupId: string, mergeConfig: any) => Promise<any>;
  createTransformFeatureGroup: (sourceFeatureGroupId: string, tableName: string, transformConfig: any, description: string, lockType: number, tags: string[], projectId: string) => Promise<any>;
  setFeatureGroupTransformConfig: (featureGroupId: string, transformConfig: any) => Promise<any>;

  addNestedFeature: (featureGroupId: string, nestedFeatureName: string, tableName: string, usingClause: string, whereClause: string, orderClause: string) => Promise<any>;
  updateNestedFeature: (featureGroupId: string, nestedFeatureName: string, newNestedFeatureName: string, tableName: string, usingClause: string, whereClause: string, orderClause: string) => Promise<any>;
  deleteNestedFeature: (featureGroupId: string, nestedFeatureName: string) => Promise<any>;

  _requestReminderEmail: () => Promise<any>;
  _listProjectsDashboard: (updatedFilter: number, limit: number, sinceProjectId: string, search: string, isStarred: boolean, tag: string) => Promise<any>;
  _listProjectsTags: (sinceProjectId: string, search: string, isStarred: boolean) => Promise<any>;
  _describeProject: (projectId: any) => Promise<any>;

  _getFeatureGroupCustomColPreview: (featureGroupId, colName, selectExpression, fromRow, toRow) => Promise<any>;
  _getSQLPreviewData: (featureGroupName: string, sql: string, fromRow: number, toRow: number, fromCol: number, toCol: number, validateOnly: boolean) => Promise<any>;
  _validateSQL: (project_id: string, dataset_id: string, expressionType, filterType, sql: string) => Promise<any>;

  createEda: (
    projectId,
    featureGroupId,
    name,
    refreshSchedule,
    includeCollinearity,
    includeDataConsistency,
    collinearityKeys,
    primaryKeys,
    dataConsistencyTestConfig,
    dataConsistencyReferenceConfig,
    featureMappings,
    forecastFrequency,
  ) => Promise<any>;
  rerunEda: (edaId) => Promise<any>;
  createGraphDashboard: (projectId: string, name: string, pythonFunctionIds: string[]) => Promise<any>;
  describeGraphDashboard: (graphDashboardId: string) => Promise<any>;
  listGraphDashboards: (projectId, cbFinish: (err: any, res: any) => void) => Promise<any>;
  updateGraphDashboard: (graphDashboardId: string, name: string, pythonFunctionIds: string[]) => Promise<any>;
  deleteGraphDashboard: (graphDashboardId, cbFinish: (err: any, res: any) => void) => Promise<any>;
  listEda: (projectId) => Promise<any>;
  describeEda: (edaId) => Promise<any>;
  listEdaVersions: (edaId, limit, startAfterVersion) => Promise<any>;
  describeEdaVersion: (edaVersion) => Promise<any>;
  renameEda: (edaId, name) => Promise<any>;
  deleteEda: (edaId) => Promise<any>;
  deleteEdaVersion: (edaVersion) => Promise<any>;
  getEdaCollinearity: (edaVersion) => Promise<any>;
  getEdaDataConsistency: (edaVersion, transformationFeature) => Promise<any>;
  getCollinearityForFeature: (edaVersion, featureName) => Promise<any>;
  getFeatureAssociation: (edaVersion, referenceFeatureName, testFeatureName) => Promise<any>;
  _getEdaItemLevelForecastingAnalysis: (edaVersion, primaryKeyMapping) => Promise<any>;
  getEdaForecastingAnalysis: (edaVersion) => Promise<any>;
  _getEdaForecastingTargetMappings: (useCase) => Promise<any>;
  _getEdaForecastingItemIds: (edaVersion, primaryKeys) => Promise<any>;

  createModelMonitor: (
    projectId,
    modelId,
    name,
    trainingFeatureGroupId,
    predictionFeatureGroupId,
    refreshSchedule,
    featureMappings,
    targetValue,
    targetValueBias,
    targetValuePerformance,
    trainingFeatureMappings,
    featureGroupBaseMonitorConfig,
    featureGroupComparisonMonitorConfig,
  ) => Promise<any>;
  createVisionDriftMonitor: (
    projectId,
    modelId,
    name,
    trainingFeatureGroupId,
    predictionFeatureGroupId,
    refreshSchedule,
    featureMappings,
    targetValue,
    targetValueBias,
    targetValuePerformance,
    trainingFeatureMappings,
    featureGroupBaseMonitorConfig,
    featureGroupComparisonMonitorConfig,
  ) => Promise<any>;
  createNlpDriftMonitor: (projectId, predictionFeatureGroupId, trainingFeatureGroupId, name, featureMappings, trainingFeatureMappings, targetValuePerformance, refreshSchedule) => Promise<any>;
  rerunModelMonitor: (modelMonitorId) => Promise<any>;
  listModelMonitors: (projectId) => Promise<any>;
  describeModelMonitor: (modelMonitorId) => Promise<any>;
  listModelMonitorVersions: (modelMonitorId, limit, startAfterVersion) => Promise<any>;
  describeModelMonitorVersion: (modelMonitorVersion) => Promise<any>;
  renameModelMonitor: (modelMonitorId, name) => Promise<any>;
  deleteModelMonitor: (modelMonitorId) => Promise<any>;
  deleteModelMonitorVersion: (modelMonitorVersion) => Promise<any>;
  _listProjectModelMonitorVersions: (projectId) => Promise<any>;

  _validate2faToken: (token) => Promise<any>;
  _checkChallengeStatus: () => Promise<any>;
  _disable2fa: () => Promise<any>;
  _enable2fa: (phone, countryCode) => Promise<any>;
  _start2faSMS: () => Promise<any>;
  _start2faPush: () => Promise<any>;

  batchPredict: (globalPredictionArgs: any, deploymentId: string, name: string, inputLocation: string, outputLocation: string, refreshSchedule: string, explanations: boolean) => Promise<any>;
  _cancelBatchPrediction: (batchPredictionId: string) => Promise<any>;
  describeBatchPrediction: (batchPredictionId: string) => Promise<any>;
  _getExampleQuery: (databaseConnectorId: string) => Promise<any>;
  _getModelSchemaOverrides: (modelId: string) => Promise<any>;
  _getFoldFeatureDistributions: (modelVersion: string, featureName: string) => Promise<any>;

  listOrganizationUsers: () => Promise<any>;
  removeUserFromOrganization: (email: string) => Promise<any>;

  listOrganizationGroups: () => Promise<any>;
  createOrganizationGroup: (groupName: string, permissions: string[], defaultGroup: boolean) => Promise<any>;
  describeOrganizationGroup: (organizationGroupId: string) => Promise<any>;
  addOrganizationGroupPermission: (organizationGroupId: string, permission) => Promise<any>;
  removeOrganizationGroupPermission: (organizationGroupId: string, permission) => Promise<any>;
  deleteOrganizationGroup: (organizationGroupId: string) => Promise<any>;
  addUserToOrganizationGroup: (organizationGroupId: string, email) => Promise<any>;
  removeUserFromOrganizationGroup: (organizationGroupId: string, email) => Promise<any>;
  setDefaultOrganizationGroup: (organizationGroupId: string) => Promise<any>;

  exportModelArtifactAsFeatureGroup: (modelVersion: string, tableName: string, artifactType: string) => Promise<any>;
  _batchPredictFromIds: (deploymentId: string, name: string, outputFormat: string, inputIds: string[]) => Promise<any>;
  createBatchPrediction: (
    deployment_id: string,
    tableName: string,
    name: string,
    globalPredictionArgs: string,
    explanations: boolean,
    outputFormat: string,
    outputLocation: string,
    databaseConnectorId: string,
    databaseOutputConfig: object,
    refresh_schedule: string,
    csvInputPrefix: string,
    csvPredictionPrefix: string,
    csvExplanationsPrefix: string,
    featureGroupOverrides: any,
    datasetIdRemap: any,
    resultInputColumns: string[],
    outputIncludesMetadata: boolean,
  ) => Promise<any>;
  startBatchPrediction: (batchPredictionId: string) => Promise<any>;
  getBatchPredictionResult: (batchPredictionVersion: string) => Promise<any>;
  getBatchPredictionConnectorErrors: (batchPredictionVersion: string) => Promise<any>;
  setBatchPredictionDatasetRemap: (batchPredictionId: string, datasetIdRemap: any) => Promise<any>;
  listBatchPredictions: (projectId: string, deploymentId: string) => Promise<any>;
  _getPredictionSchema: (deploymentId: string) => Promise<any>;
  listBatchPredictionVersions: (batchPredictionId: string) => Promise<any>;
  getFeatureGroupExportConnectorErrors: (featureGroupExportId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  describeBatchPredictionVersion: (batchPredictionVersion: string) => Promise<any>;
  updateBatchPrediction: (
    batchPredictionId: string,
    deploymentId: string,
    globalPredictionArgs: any,
    explanations: boolean,
    outputFormat: string,
    csvInputPrefix: string,
    csvPredictionPrefix: string,
    csvExplanationsPrefix: string,
    parallelismOverride: number,
    outputIncludesMetadata: boolean,
    resultInputColumns: string[],
    name: string,
  ) => Promise<any>;
  setBatchPredictionFileConnectorOutput: (batchPredictionId: string, outputFormat: string, outputLocation: string) => Promise<any>;
  setBatchPredictionDatabaseConnectorOutput: (batchPredictionId: string, databaseConnectorId: string, databaseOutputConfig: string) => Promise<any>;
  setBatchPredictionOutputToConsole: (batchPredictionId: string) => Promise<any>;
  setBatchPredictionDataset: (batchPredictionId: string, datasetType: string, datasetId: string) => Promise<any>;
  setBatchPredictionFeatureGroup: (batchPredictionId: string, datasetType: string, featureGroupId: string) => Promise<any>;
  deleteBatchPrediction: (batchPredictionId: string) => Promise<any>;

  _isExplainableProject: (projectId: string) => Promise<any>;
  _getFeatureGroupSchema: (projectId: string, featureGroupId: string, modelVersion: string, featureGroupVersion: string) => Promise<any>;
  batchPredictionFromUpload: (globalPredictionArgs: any, deploymentId, name, explanations) => Promise<any>;
  completeUpload: (datasetUploadId: any) => Promise<any>;
  cancelUpload: (uploadId: any) => Promise<any>;
  _cancelDatasetUpload: (datasetVersion) => Promise<any>;
  markUploadComplete: (uploadId: string) => Promise<any>;
  unsubscribe: (email: string, recaptchaToken: string) => Promise<any>;
  getPredictionSchema: (modelVersion: string) => Promise<any>;
  get_project_dataset_data_use: (project_id: string, dataset_id: string, batch_prediction_id: string, modelVersion) => Promise<any>;
  get_dataset_schema: (dataset_id: string) => Promise<any>;
  get_dataset_schema_version: (dataset_version: string) => Promise<any>;
  validateProjectDatasets: (project_id: string, featureGroupIds: string[]) => Promise<any>;
  setProjectDatasetDataUsage: (project_id: string, dataset_id: string, columnOverrides: any) => Promise<any>;
  _resetProjectDatasetDetectedSchema: (project_id: string, dataset_id: string) => Promise<any>;
  setProjectDatasetColumnMapping: (isTransaction: boolean, project_id: string, dataset_id: string, column: string, featureMapping: any) => Promise<any>;
  calcSetProjectDatasetColumnMappingIsInTransaction: () => number;
  setProjectDatasetColumnMappingUsingQueue: (project_id: string, dataset_id: string, column: string, featureMapping: any) => Promise<any>;
  setProjectDatasetColumnDataType: (project_id: string, dataset_id: string, column: string, dataType: any) => Promise<any>;
  setColumnDataType: (project_id: string, dataset_id: string, column: string, dataType: any) => Promise<any>;
  _hideModel: (modelId: string) => Promise<any>;
  _addVote: (modelId: string) => Promise<any>;
  _deleteVote: (modelId: string) => Promise<any>;
  _addModelComment: (modelId: string, comment: string) => Promise<any>;
  _shareModel: (modelId: string, name: string, desc: string) => Promise<any>;
  _starModel: (modelId: string, starred: boolean) => Promise<any>;
  _starDeployment: (deploymentId: string, starred: boolean) => Promise<any>;
  _starProject: (projectId: string, starred: boolean) => Promise<any>;
  _starDataset: (datasetId: string, starred: boolean) => Promise<any>;
  _starBatchPrediction: (batchPredictionId: string, starred: boolean) => Promise<any>;
  _starFeatureGroup: (featureGroupId: string, starred: boolean) => Promise<any>;
  _deleteModelComment: (communityInteractionId: string) => Promise<any>;
  _editModelComment: (communityInteractionId: string, comment: string) => Promise<any>;
  _getModelComment: (communityInteractionId: string) => Promise<any>;
  _getSharedModel: (modelId: string) => Promise<any>;
  _listSharedModels: (limit: number, lastSeenModelId: string, userHandle: string, useCase: string, sortBy: string, isVotes: boolean) => Promise<any>;
  _listModelComments: (modelId: string) => Promise<any>;
  _getPublicUser: (userHandle: string) => Promise<any>;
  _updatePublicProfile: (name, userHandle, bio, twitterHandle, githubHandle, linkedinHandle) => Promise<any>;
  _uploadProfileImage: (photoData, resetPhoto) => Promise<any>;
  _uploadModelImage: (modelId, photoData) => Promise<any>;
  _getDefaultModelImage: (modelId) => Promise<any>;
  _listUserComments: (userHandle: string, communityInteractionId: string) => Promise<any>;
  _getSharedModelGraphs: (modelId: string) => Promise<any>;
  _getSharedModelDatasetMetrics: (modelId: string, rows: number) => Promise<any>;
  _getEditorsChoice: () => Promise<any>;
  listDatasets: (limit: number, startAfterId: string, starred) => Promise<any>;
  getTrainingDataLogs: (modelVersion: string) => Promise<any>;

  _getUserInfo: () => Promise<any>;
  _describeDataset: (datasetId: string) => Promise<any>;
  _listUseCasesInternal: () => Promise<any>;

  createModelFromLocalFiles: (projectId, name, optionalArtifacts: any) => Promise<any>;
  createModelVersionFromLocalFiles: (modelId, optionalArtifacts: any) => Promise<any>;
  createModelFromFiles: (projectId, name, location: string, customArtifactFilenames: any) => Promise<any>;
  createModelVersionFromFiles: (modelId) => Promise<any>;
  _verifyModelFromFilesLocation: (projectId, location: string, customArtifactFilenames: any) => Promise<any>;

  setIgnoreBefore: (datasetId: string, timestamp: number) => Promise<any>;

  createStreamingDataset: (projectId: string, datasetType: string, name: string, tableName: string) => Promise<any>;
  _createStreamingFeatureGroupFromBatch: (projectId: string, featureGroupId: string, tableName: string) => Promise<any>;
  appendDatasetRows: (streamingToken: string, datasetId: string, rows: any) => Promise<any>;
  createStreamingToken: () => Promise<any>;
  listStreamingTokens: () => Promise<any>;
  deleteStreamingToken: (streamingToken: string) => Promise<any>;

  getUserAlerts: (unreadOnly: boolean, since: number) => Promise<any>;
  _getSampleApiCode: (methodName: boolean) => Promise<any>;

  _getUIWizardState: (project_id: string, dataset_id: string, ui_action: string) => Promise<any>;
  _setUIWizardState: (project_id: string, dataset_id: string, ui_action: string, is_clear: boolean) => Promise<any>;
  _getProjectWizardState: (project_id: string) => Promise<any>;
  _setProjectWizardState: (project_id: string, values: object) => Promise<any>;
  _requestHelp: (detail: string) => Promise<any>;
  helptextsDownload: (cbFinish: (err: any, res: any) => void) => Promise<any>;

  get_test_datas_by_project: (project_id: string) => Promise<any>;
  get_models_by_project: (project_id: string) => Promise<any>;
  _userAuthMobileQR: () => Promise<any>;

  _predictForUI: (deployment_id: string, dataParams: object, extraParams: any, requestId: string) => Promise<any>;
  _predictForUI_predictClass: (deployment_id: string, dataParams: object, extraParams: any, requestId: string) => Promise<any>;
  _predictForUI_binaryData: (deployment_id: string, blob: any, blobKeyName: string, extraParams: any) => Promise<any>;
  classifyImage: (deploymentId: string, blob: any, extraParams: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  describeImage: (deploymentToken: string, deploymentId: string, image: any, categories: string[]) => Promise<any>;
  predict: (auth_token: string, deployment_id: string, data: string) => Promise<any>;
  predictForUseCase: (methodName: string, explainPredictions: boolean, dataField: string, auth_token: string, deployment_id: string, data: string) => Promise<any>;
  _getValidProjectFeatureGroupUses: (isUserModifiable: boolean) => Promise<any>;
  setModelMonitorAlertConfig: (modelMonitorId: string, name, alertConfig: any) => Promise<any>;
  _getPredictionMetricDataByPredictionMetricVersion: (predictionMetricVersion: string, actualValue: string) => Promise<any>;
  modelMonitorVersionMetricData: (modelMonitorVersion: string, metricType: string, actualValue: any) => Promise<any>;
  _listModelMonitorAlerts: (modelMonitorId: string) => Promise<any>;
  _transferStyle: (deploymentId: string, sourceImage: any, styleImage: any) => Promise<any>;
  _modifyImageUsingText: (deploymentId: string, queryData: string, sourceImage: any) => Promise<any>;
  _generateImage: (deploymentId: string, queryData: any, extraParams: any) => Promise<any>;

  createMonitorAlert: (projectId: string, modelMonitorId: string, alertName: string, conditionConfig: any, actionConfig: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  updateMonitorAlert: (monitorAlertId: string, alertName: string, conditionConfig: any, actionConfig: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  describeMonitorAlert: (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  describeMonitorAlertVersion: (monitorAlertVersion: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  runMonitorAlert: (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  listMonitorAlertsForMonitor: (modelMonitorId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  listMonitorAlertVersionsForMonitorVersion: (modelMonitorVersion: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  deleteMonitorAlert: (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;

  _setNotebookMemory: (notebookId: string, memory: number) => Promise<any>;
  _setNotebookUsesGpu: (notebookId: string, useGpu: boolean) => Promise<any>;
  _getNotebookMemoryOptions: () => Promise<any>;
  _createNotebook: (name: string, projectId: string, memory: number, useGpu: boolean) => Promise<any>;
  _renameNotebook: (notebookId: string, name: string) => Promise<any>;
  _deleteNotebook: (notebookId: string) => Promise<any>;
  _describeNotebook: (notebookId: string, subpath?: string) => Promise<any>;
  _listNotebooks: (projectId: string) => Promise<any>;
  _startNotebook: (notebookId: string) => Promise<any>;
  _stopNotebook: (notebookId: string) => Promise<any>;
  _attachNotebookToProject: (notebookId: string, projectId: string) => Promise<any>;
  _removeNotebookFromProject: (notebookId: string, projectId: string) => Promise<any>;
  addAnnotation: (
    annotation: { annotationType?: string; annotationValue?: any },
    featureGroupId: string,
    featureName: string,
    docId: string,
    document: string,
    featureGroupAnnotationKeyValue: string,
    featureGroupRowIdentifier: any,
    annotationSource: 'upload' | 'ui',
    status: string,
    comments: any,
    projectId: string,
    saveMetadata: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => Promise<any>;
  describeAnnotation: (featureGroupId: string, featureName: string, docId: string, featureGroupAnnotationKeyValue: string, featureGroupRowIdentifier: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  verifyAndDescribeAnnotation: (featureGroupId: string, featureName: string, docId: string, featureGroupAnnotationKeyValue: string, featureGroupRowIdentifier: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  setFeatureAsAnnotatableFeature: (
    featureGroupId: string,
    featureName: string,
    annotationType: string,
    featureGroupRowIdentifierFeature: string,
    docIdFeature: string,
    projectId: string,
    cbFinish: (err: any, res: any) => void,
  ) => Promise<any>;
  setAnnotationStatusFeature: (featureGroupId: string, featureName: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  addFeatureGroupAnnotationLabel: (featureGroupId: string, labelName: string, annotationType: string, labelDefinition: string, projectId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  importAnnotationLabels: (featureGroupId: string, file: any, annotationType: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  removeFeatureGroupAnnotationLabel: (featureGroupId: string, labelName: string, projectId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  addFeatureGroupAnnotationLabels: (featureGroupId: string, labelNames: string[], annotationType: string, labelDefinition: string, projectId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  addAnnotatableFeature: (featureGroupId: string, name: string, annotationType: string, projectId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  getDocumentToAnnotate: (featureGroupId: string, featureName: string, featureGroupRowIdentifierFeature: string, getPrevious: boolean, cbFinish: (err: any, res: any) => void) => Promise<any>;
  getAnnotationsStatus: (featureGroupId: string, featureName: string, checkForMaterialization: boolean, cbFinish: (err: any, res: any) => void) => Promise<any>;
  updateAnnotationStatus: (featureGroupId: string, featureName: string, status: string, docId: string, featureGroupRowIdentifier: any, saveMetadata: boolean, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _getProcessedAnnotation: (annotationType: string, annotationValue: any, document: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _listAnnotationFeatureGroupRowIds: (featureGroupId: string, featureName: string, cbFinish: (err: any, res: any) => void) => Promise<any>;

  listOrganizationModelMonitors: (onlyStarred: boolean, cbFinish: (err: any, res: any) => void) => Promise<any>;
  getModelMonitorSummaryFromOrganization: (lookbackDays: number, cbFinish: (err: any, res: any) => void) => Promise<any>;
  getModelMonitorChartFromOrganization: (chartType: string, limit: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _starModelMonitor: (modelMonitorId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => Promise<any>;

  _getSSOClientIds: () => Promise<any>;

  _getDeploymentBatchPredictionInfo: (deploymentId: any) => Promise<any>;
  listTestData: (deploymentId: string) => Promise<any>;
  get_metrics_data: (project_id: any) => Promise<any>;
  getModelMonitorSummary: (modelMonitorId: any) => Promise<any>;
  get_dataset_data: (
    project_id: string,
    dataset_id: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress?: (bytes: number, total: number) => void,
  ) => Promise<any>;
  get_dataset_data_version: (
    project_id: string,
    dataset_id: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress?: (bytes: number, total: number) => void,
  ) => Promise<any>;
  _getFeatureGroupData: (
    project_id: string,
    featureGroupId: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress?: (bytes: number, total: number) => void,
  ) => Promise<any>;
  _getFeatureGroupVersionData: (
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    validateOnly: boolean,
    prioritizeFeatureMappedColumns: boolean,
  ) => Promise<any>;
  getFeatureGroupVersionData: (
    project_id: string,
    featureGroupId: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn: string,
    isAscending: boolean,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress?: (bytes: number, total: number) => void,
  ) => Promise<any>;
  get_data_explorer_charts: (dataset_id: string, project_id: string, num_items: number) => Promise<any>;
  _getFeatureGroupExplorerCharts: (feature_group_version: string, project_id: string, num_items: number) => Promise<any>;
  describeDataset: (datasetId: string) => Promise<any>;
  describeUseCaseRequirements: (useCase: string) => Promise<any>;
  _getModelVersionGraphs: (modelVersion: string) => Promise<any>;

  renameModel: (modelId: string, name: string) => Promise<any>;
  _listSolutionsAndUseCases: (isSolutions: boolean, useCase: string) => Promise<any>;

  createProject: (name: string, useCase: string, isFeatureGroupProject: boolean) => Promise<any>;
  editProject: (projectId: any, name: string) => Promise<any>;
  deleteProject: (project_id: any) => Promise<any>;
  attachDatasetToProject: (projectId: string, datasetId: string, datasetType: string) => Promise<any>;
  removeDatasetFromProject: (projectId: string, datasetId: string) => Promise<any>;

  get_dataset_metrics: (project_id: string, dataset_id: string, batchPredId, modelVersion: string, from_row: number, to_row: number, from_col: number, to_col: number, selectedColumns, selectedColumnsNonIgnored) => Promise<any>;
  get_dataset_metrics_schema: (project_id: string, dataset_id: string, batchPredId, modelVersion) => Promise<any>;
  get_dataset_metrics_version: (project_id: string, dataset_id: string, batchPredId, modelVersion: string, from_row: number, to_row: number, from_col: number, to_col: number, selectedColumns, selectedColumnsNonIgnored) => Promise<any>;
  get_dataset_metrics_schema_version: (project_id: string, dataset_id: string, batchPredId, modelVersion) => Promise<any>;

  getFeatureGroupVersionMetricsSchema: (featureGroupVersion: string) => Promise<any>;
  getFeatureGroupVersionMetricsData: (projectId: string, featureGroupVersion: string, fromRow: number, toRow: number, fromCol: number, toCol: number, selectedColumns: string[], selectedColumnsNonIgnored: boolean) => Promise<any>;

  _searchId: (sid: string) => Promise<any>;
  _searchProjects: (searchIn: string, projectName: string, useCase: string, problemType: string, createdAtBefore: number, createdAtAfter: number, datasets, models, metrics, deploys) => Promise<any>;

  doAddDataset: (
    isDocumentset: boolean,
    newVersionDatasetId: string,
    name: string,
    contentType: string,
    fileOne: File,
    projectId: any,
    datasetType: string,
    fileFormat: string,
    tableName: string,
    csvDelimiter: string,
    extractBoundingBoxes: boolean,
    cbFinishDoUpload: (err: any, res: any) => void,
  ) => void;
  doImportDataset: (
    isDocumentset: boolean,
    name: string,
    fileFormat: string,
    location: string,
    projectId: any,
    datasetType: string,
    refreshSchedule: string,
    databaseConnectorId: string,
    objectName: string,
    columns: string,
    queryArguments: string,
    tableName: string,
    sqlQuery: string,
    csvDelimiter: string,
    filenameColumn: string,
    startPrefix: string,
    untilPrefix: string,
    locationDateFormat,
    dateFormatLookbackDays,
    incremental,
    incrementalTimestampColumn,
    mergeFileSchemas,
    extractBoundingBoxes: boolean,
    cbProgressDoUpload: (actual: number, total: number) => void,
    cbFinishDoUpload: (err: any, res: any) => void,
  ) => void;
  documentation_: () => Promise<any>;
  _getUseCaseDocumentation: () => Promise<any>;

  createRefreshPolicy: (
    name: string,
    cron: string,
    refreshType: string,
    projectId: string,
    datasetIds: string[],
    featureGroupId: string,
    modelIds: string[],
    deploymentIds: string[],
    batchPredictionIds: string[],
    predictionMetricIds: string[],
    modelMonitorIds: string[],
    notebookId: string,
    featureGroupExportConfig: any,
  ) => Promise<any>;
  describeRefreshPolicy: (refreshPolicyId: string) => Promise<any>;
  listRefreshPipelineRuns: (refreshPolicyId: string) => Promise<any>;
  pauseRefreshPolicy: (refreshPolicyId: string) => Promise<any>;
  resumeRefreshPolicy: (refreshPolicyId: string) => Promise<any>;
  updateRefreshPolicy: (refreshPolicyId: string, name: string, cron: string, isProd: boolean, featureGroupExportConfig: any) => Promise<any>;
  listRefreshPolicies: (
    projectId: string,
    datasetIds: string[],
    featureGroupId: string,
    modelIds: string[],
    deploymentIds: string[],
    batchPredictionIds: string[],
    modelMonitorIds: string[],
    predictionMetricIds: string[],
    notebookIds: string[],
  ) => Promise<any>;
  describeRefreshPipelineRun: (refreshPipelineRunId: string) => Promise<any>;
  deleteRefreshPolicy: (refreshPolicyId: string) => Promise<any>;
  runRefreshPolicy: (refreshPolicyId: string) => Promise<any>;
  _setNotebookExecuteFilename: (notebookId: string, executeFilename: string) => Promise<any>;
  _getFullDataPreview: (projectId: string, datasetId: string, customFilers: any, cbProgress: (bytes: number, total: number) => void) => Promise<any>;

  getDocstoreDocument: (docId: string) => Promise<any>;
  getDocstoreImage: (docId: string, maxWidth: number, maxHeight: number) => Promise<any>;
  _pythonGraphData: (pythonFunctionId: string) => Promise<any>;
  _pythonGraphDataForDashboard: (graphReferenceId: string) => Promise<any>;
  addGraphToDashboard: (pythonFunctionId: string, graphDashboardId: string, functionVariableMappings: any, name: string) => Promise<any>;
  deleteGraphFromDashboard: (graphReferenceId: string) => Promise<any>;
  updateGraphToDashboard: (graphReferenceId: string, functionVariableMappings: any, name: string) => Promise<any>;
  describeGraphForDashboard: (graphReferenceId: string) => Promise<any>;

  _selectOrganizationRegion: (service: string, region: string) => Promise<any>;
  getTrainingConfigOptions: (projectId: string, featureGroupIds: string[], forRetrain: boolean, currentTrainingConfig: any) => Promise<any>;
  _createSnapshotFeatureGroupFromDatasetVersion: (datasetVersion: string, tableName: string) => Promise<any>;
  trainModelsAuto: (projectId: string, trainingConfig: any, name: string, refreshSchedule: string, featureGroupIds: string[], cpuSize: string, memory: number, customAlgorithmConfigs: any, builtinAlgorithms: string[]) => Promise<any>;
  updateModelTrainingConfig: (modelId: string, trainingConfig: any, featureGroupIds: string[]) => Promise<any>;
  _getAdditionalMetricsDataByModelVersion: (modelVersion: string, additionalMetricsKey: string, algorithm: string, validation: boolean, dataClusterType, cbFinish: (err: any, res: any) => void) => Promise<any>;
  getDefaultModelName: (projectId: string) => Promise<any>;
  getDefaultDeploymentName: (modelId: string) => Promise<any>;
  retrainModel: (modelId: string, deploymentIds: string[], featureGroupIds: string[], cpuSize: string, memory: number, customAlgorithmConfigs: any, builtinAlgorithms: string[], algorithmTrainingConfigs: any[]) => Promise<any>;
  cancelModelTraining: (modelId: string) => Promise<any>;
  deleteModelVersion: (modelVersion: string) => Promise<any>;
  describeFeatureGroupByTableName: (tableName: string, projectId) => Promise<any>;
  _checkTableName: (tableName: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _listAvailableProblemTypesForAlgorithms: (cbFinish: (err: any, res: any) => void) => Promise<any>;
  _getCpuAndMemoryOptions: (cbFinish: (err: any, res: any) => void) => Promise<any>;

  createFeatureGroupSnapshot: (projectId: string, featureGroupId: string) => Promise<any>;
  listFeatureGroupVersions: (featureGroupId: string, limit: number, startAfterInstanceId: string) => Promise<any>;
  describeFeatureGroupVersion: (featureGroupVersion: string) => Promise<any>;

  setAutoDeployment: (deploymentId: string, enable: boolean) => Promise<any>;
  getUser: () => Promise<any>;
  setUserAsAdmin: (email: string) => Promise<any>;
  _createAccount: (name: string, email: string, password: string, recaptchaToken: string, signupToken: string, amznMarketplaceToken: string) => Promise<any>;
  deleteInvite: (userInviteId: any) => Promise<any>;
  inviteUser: (email: any) => Promise<any>;
  acceptInvite: (email: string, organizationId: string, userInviteId: string, name: string, password: string, userInviteSecret: string) => Promise<any>;
  acceptInviteLoggedIn: (userInviteToken: string) => Promise<any>;
  listUserInvites: () => Promise<any>;

  _googleSignIn: (googleToken: any, signupToken: string, amznMarketplaceToken: string) => Promise<any>;
  _githubSignIn: (githubToken: any, signupToken: string, amznMarketplaceToken: string) => Promise<any>;
  _oktaSignin: (oktaToken: any, signupToken: string, amznMarketplaceToken: string) => Promise<any>;
  _azureSignIn: (azureToken: any, signupToken: string, amznMarketplaceToken: string) => Promise<any>;
  _genericEndpoint: (endpoint: string, obj: any) => Promise<any>;
  _signIn: (email: string, password: string, recaptchaToken: string) => Promise<any>;
  _resetPassword: (userId: string, requestToken: string, password: string) => Promise<any>;
  _resetPasswordRequest: (email: any, recaptchaToken: string) => Promise<any>;
  _signOut: () => Promise<any>;

  _setDeploymentConfig: (deploymentId: string, config: string) => Promise<any>;
  setDeploymentFeatureGroupExportFileConnectorOutput: (deploymentId: string, fileFormat: string, outputLocation: string) => Promise<any>;
  setDeploymentFeatureGroupExportDatabaseConnectorOutput: (deploymentId: string, databaseConnectorId: string, objectName: string, writeMode: string, databaseFeatureMapping: any, idColumn: string, additionalIdColumns: any) => Promise<any>;
  removeDeploymentFeatureGroupExportOutput: (deploymentId: string) => Promise<any>;
  _getDeploymentConfigOptions: (deploymentId: string) => Promise<any>;
  _getModelPredictionConfigOptions: (modelId: string) => Promise<any>;

  _createPlaceholderOrganization: () => Promise<any>;
  _selectActiveOrganization: (organizationId: string) => Promise<any>;
  createOrganization: (name: string, workspace: string, discoverable: boolean) => Promise<any>;
  listOrganizations: () => Promise<any>;
  joinOrganization: (organizationId: string) => Promise<any>;
  _verifyAccount: (userId: string, verificationToken: string, recaptchaToken: string) => Promise<any>;
  _resendVerification: (userId: string, recaptchaToken: string) => Promise<any>;

  add_dataset: (isDocumentset: boolean, newVersionDatasetId: string, name: string, projectId: any, datasetType: string, fileFormat: string, tableName: string, csvDelimiter: string, extractBoundingBoxes: boolean) => Promise<any>;
  addDatasetVersion: (dataset_id: any) => Promise<any>;
  snapshotStreamingData: (dataset_id: any) => Promise<any>;

  createPointInTimeGroup: (
    featureGroupId: string,
    groupName: string,
    aggregationKeys: any[],
    windowKey: string,
    lookbackWindow: number,
    lookbackWindowLag: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    historyTableName,
    historyWindowKey,
    historyAggregationKeys,
  ) => Promise<any>;
  updatePointInTimeGroup: (
    featureGroupId: string,
    groupName: string,
    aggregationKeys: any[],
    windowKey: string,
    lookbackWindow: number,
    lookbackWindowLag: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    historyTableName,
    historyWindowKey,
    historyAggregationKeys,
  ) => Promise<any>;
  deletePointInTimeGroup: (featureGroupId: string, groupName: string) => Promise<any>;
  createPointInTimeGroupFeature: (featureGroupId: string, groupName: string, name: string, expression: string) => Promise<any>;
  updatePointInTimeGroupFeature: (featureGroupId: string, groupName: string, name: string, expression: string) => Promise<any>;
  _setPointInTimeGroupFeatureExpressions: (featureGroupId: string, groupName: string, expressions: string) => Promise<any>;
  _addPointInTimeGeneratedFeatures: (featureGroupId: string, groupName: string, columns: string[], windowFunctions: string[], prefix: string) => Promise<any>;

  import_dataset: (
    isDocumentset: boolean,
    name: string,
    fileFormat: string,
    location: string,
    projectId: any,
    datasetType: string,
    refreshSchedule: string,
    tableName: string,
    csvDelimiter: string,
    filenameColumn: string,
    startPrefix: string,
    untilPrefix: string,
    locationDateFormat,
    dateFormatLookbackDays,
    incremental,
    mergeFileSchemas,
    extractBoundingBoxes: boolean,
  ) => Promise<any>;
  importDatasetVersion: (dataset_id: any, location: string, fileFormat: string, csvDelimiter: string, mergeFileSchemas: boolean) => Promise<any>;
  importDatasetVersionFromDatabaseConnector: (dataset_id: any, objectName: string, columns: string, queryArguments: string, sqlQuery: string) => Promise<any>;
  listDatasetVersions: (datasetId: string, limit: number, startAfterVersion: string) => Promise<any>;
  _downloadSmallFeatureGroupCSV: (featureGroupId: string, columnFilters: string[]) => Promise<any>;

  _getStreamingIds: (projectId: string) => Promise<any>;
  _getCurrentHourRowCount: (datasetId: string) => Promise<any>;
  _getRecentWrites: (datasetId: string) => Promise<any>;
  _captureStreamingSchema: (datasetId: string) => Promise<any>;
  listDeployVersions: (deployId: string, limit: number) => Promise<any>;
  listDeployVersionsHistory: (deployId: string, limit: number, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _describeDeploymentVersion: (deploymentVersion: string) => Promise<any>;
  _getBatchPredictionArgs: (deploymentId: string, isFgTrain: boolean, forEval: boolean, featureGroupOverrides: any) => Promise<any>;
  _getFeatureGroupSamplingConfigOptions: (featureGroupId: string) => Promise<any>;
  createSamplingFeatureGroup: (featureGroupId: string, tableName: string, samplingConfig: any, description: string, lockType: number, tags: string, projectId: string) => Promise<any>;
  setFeatureGroupSamplingConfig: (featureGroupId: string, samplingConfig: any) => Promise<any>;
  _listProblemTypes: (cbFinish: (err: any, res: any) => void) => Promise<any>;

  delete_dataset: (dataset_id: any) => Promise<any>;

  uploadFile: (url: string, file: any, contentType: string, cbProgress: (progress: number, percent: number) => void) => Promise<any>;

  _deployPretrainedModel: (projectId: string, algorithm: string) => Promise<any>;
  createDeployment: (
    projectId: string,
    autoDeploy: boolean,
    modelId: string,
    modelVersion: string,
    algorithm: string,
    algorithmFiltered: string,
    additionalModelName: string,
    featureGroupId: string,
    name: string,
    description: string,
    callsPerSecond: any,
    start: boolean,
    attachedStreamingFg: string,
    streamingFgDataUses: any[],
    trained_model_type: string,
    createFeedbackStreamingFg: boolean,
  ) => Promise<any>;
  setDeploymentModelVersion: (deploymentId: string, modelVersion: boolean, algorithm: string, algorithmFiltered: string, trainedModelType: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  deployListForProject: (projectId: string) => Promise<any>;
  deleteDeployment: (deploymentId: string) => Promise<any>;
  startDeployment: (deploymentId: string) => Promise<any>;
  stopDeployment: (deploymentId: string) => Promise<any>;
  renameDeployment: (deploymentId: string, name: string) => Promise<any>;
  _getPykernelMetaserviceInfo: () => Promise<any>;
  getNotebookCellCompletion: (completionType: string, previousCells: string) => Promise<any>;
  _listNotebookVersions: (notebookId: string) => Promise<any>;
  _getProjectFeatureGroupLineage: (projectId: string) => Promise<any>;
  setModelObjective: (modelVersion: string, metric: string) => Promise<any>;
  _setMetricsSortObjectiveForUi: (modelVersion: string, metric: string) => Promise<any>;
  _getFreeTier: () => Promise<any>;
  _getRates: () => Promise<any>;

  _setDatasetPublicSource: (datasetId, url) => Promise<any>;
  _setDefaultPaymentMethod: (paymentMethodId: string) => Promise<any>;
  _listPaymentMethods: () => Promise<any>;
  _listInvoices: () => Promise<any>;
  _getPublicKey: () => Promise<any>;
  _getBillingAccount: () => Promise<any>;
  _getCurrentUsage: (since, until, daily) => Promise<any>;
  _getNextBillingDate: () => Promise<any>;
  _deletePaymentMethod: (paymentMethodId: string) => Promise<any>;
  _createBillingAccount: () => Promise<any>;
  _addPaymentMethodIntent: () => Promise<any>;
  _confirmPaymentMethodIntent: () => Promise<any>;
  _addPaymentMethod: (card: any, billing_details: any) => Promise<any>;
  _getProductDetails: () => Promise<any>;
  getMetricsRanges: () => Promise<any>;
  _getMetricsDataByModel: (modelId: string) => Promise<any>;
  _getMetricsDataByModelVersion: (modelVersion: string, algorithm: string, validation, nRows, sortByClass, dataClusterType) => Promise<any>;

  _getPythonSuggestion: (prompt: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _getSqlSuggestionForRawData: (featureGroupId: string, prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _callOpenAi: (prompt: string, options: any, language: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _internalGetPythonSuggestion: (prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _internalGetSqlSuggestionForRawData: (featureGroupId: string, prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => Promise<any>;

  listProjects: () => Promise<any>;
  _billingGetUrl: (cbFinish: (err: any, res: any) => void) => Promise<any>;

  _setIgnoreAndRetrain: (modelId: string, columns: string[]) => Promise<any>;
  _createNewVersions: (projectId: string, refreshType: string) => Promise<any>;

  _listRegions: (service: 'aws' | 'gcp' | 'azure') => Promise<any>;
  listApiKeys: () => Promise<any>;
  createApiKey: (tag: string) => Promise<any>;
  deleteApiKey: (apiKeyId: string) => Promise<any>;

  _inviteUserExists: (userInviteId: string) => Promise<any>;

  _getExampleDatasets: (projectId: string) => Promise<any>;
  _useExampleDatasets: (projectId: string) => Promise<any>;
  listDeploymentTokens: (projectId: string) => Promise<any>;
  deleteDeploymentToken: (deploymentToken: string) => Promise<any>;
  createDeploymentToken: (projectId: string, name: string) => Promise<any>;
  describeDeployment: (deploymentId: string) => Promise<any>;
  describeProject: (projectId: string) => Promise<any>;
  _setFeatureNote: (featureGroupId: string, feature: string, note: string) => Promise<any>;
  _setFeatureTags: (featureGroupId: string, feature: string, tags: string[]) => Promise<any>;
  addProjectTags: (projectId: string, tags: string[]) => Promise<any>;
  removeProjectTags: (projectId: string, tags: string[]) => Promise<any>;

  _setLeadModel: (modelId: string, algorithm: string, dataClusterType) => Promise<any>;
  _describeModelVersion: (modelVersion: string) => Promise<any>;
  deleteModel: (modelId: string) => Promise<any>;
  describeModel: (modelId: string) => Promise<any>;
  getModelMetrics: (modelId: string) => Promise<any>;
  listModels: (projectId: string) => Promise<any>;
  createChatLLMResponseRequest: (deploymentId: string, messages: any[], searchResults: any[]) => Promise<any>;
  getChatLLMResponseRequestStatus: (requestId: bigint) => Promise<any>;
  createChatLLMSendMessageRequest: (deploymentConversationId: string, message: string) => Promise<any>;
  getChatLLMSendMessageRequestStatus: (requestId: string) => Promise<any>;
  executeAgent: (deploymentId: string, query: string, keywordArguments: any, chatHistory: any[], cbFinish: (err: any, res: any) => void) => Promise<any>;
  listModelVersions: (modelId: string) => Promise<any>;
  listProjectDatasets: (projectId: string) => Promise<any>;
  _getSampleCode: (deploymentId: string) => Promise<any>;
  _getDataAugmentationComparison: (modelId: string, variation: number) => Promise<any>;
  _promoteDeploymentVersion: (deploymentId: string, modelVersion: string, algorithm: string) => Promise<any>;
  promoteDeploymentFeatureGroupVersion: (deploymentId: string, featureGroupVersion: string) => Promise<any>;
  upgradeDeployment: (deploymentId: string) => Promise<any>;

  setDatasetEphemeral: (datasetId: string, ephemeral: boolean) => Promise<any>;
  setDatasetLookbackDays: (datasetId: string, lookbackDays: boolean) => Promise<any>;

  addExternalBucketAWSRole: (bucket: string, roleArn: string) => Promise<any>;
  setAzureBlobConnectionString: (bucket: string, connectionString: string) => Promise<any>;
  getExternalBucketOwnershipTest: (bucket: string, writePermission: boolean) => Promise<any>;
  listExternalBuckets: () => Promise<any>;
  listDatabaseConnectors: () => Promise<any>;
  listApplicationConnectors: () => Promise<any>;
  listStreamingConnectors: () => Promise<any>;
  renameDatabaseConnector: (databaseConnectorId: string, name: string) => Promise<any>;
  renameApplicationConnector: (applicationConnectorId: string, name: string) => Promise<any>;
  renameStreamingConnector: (streamingConnectorId: string, name: string) => Promise<any>;
  _fileExists: (bucket: string, path: string) => Promise<any>;
  verifyExternalBucket: (bucket: string) => Promise<any>;
  verifyExternalDatabase: (databaseConnectorId) => Promise<any>;
  verifyApplicationConnector: (applicationConnectorId) => Promise<any>;
  verifyStreamingConnector: (streamingConnectorId) => Promise<any>;
  removeExternalBucket: (bucket: string) => Promise<any>;
  removeDatabaseConnector: (databaseConnectorId: string) => Promise<any>;
  removeStreamingConnector: (streamingConnectorId: string) => Promise<any>;
  getDatabaseConnectorInstructions: (service: string, currentAuth: any) => Promise<any>;
  getApplicationConnectorInstructions: (service: string) => Promise<any>;
  getStreamingConnectorInstructions: (service: string) => Promise<any>;
  listValidDatabaseConnectors: () => Promise<any>;
  listValidApplicationConnectors: () => Promise<any>;
  listValidStreamingConnectors: () => Promise<any>;
  listValidFileConnectors: () => Promise<any>;
  listDatabaseConnectorObjects: (databaseConnectorId: string) => Promise<any>;
  getDatabaseConnectorObjectSchema: (databaseConnectorId: string, objectName: string) => Promise<any>;
  createDatasetFromDatabaseConnector: (
    isDocumentset: boolean,
    databaseConnectorId: string,
    objectName: string,
    columns: string,
    name: string,
    queryArguments: string,
    projectId: string,
    datasetType: string,
    tableName: string,
    sqlQuery: string,
    incremental: boolean,
    timestampColumn: string,
    refreshSchedule: string,
  ) => Promise<any>;

  setFeatureType: (featureGroupId: string, feature: string, featureType: string) => Promise<any>;
  setFeatureMapping: (projectId: string, featureGroupId: string, featureName: string, featureMapping: string, nestedColumnName: string) => Promise<any>;
  _validateProjectFeatureGroups: (projectId: string) => Promise<any>;
  _bulkSetProjectFeatureGroupTypesAndFeatureMappings: (projectId: string, featureGroupTypeMappings: any[]) => Promise<any>;
  inferFeatureMappings: (projectId: string, featureGroupId: string) => Promise<any>;

  _getFeatureDriftModelMonitorSummary: (modelMonitorVersion) => Promise<any>;
  _getEmbeddingDriftDistributions: (modelMonitorVersion) => Promise<any>;
  getDriftForFeature: (modelMonitorVersion, featureName, nestedFeatureName) => Promise<any>;
  getPredictionDrift: (modelMonitorVersion) => Promise<any>;
  getOutliersForFeature: (modelMonitorVersion, featureName, nestedFeatureName) => Promise<any>;
  getOutliersForBatchPredictionFeature: (batchPredictionVersion, featureName, nestedFeatureName) => Promise<any>;

  useFeatureGroupForTraining: (projectId: string, featureGroupId: string, useForTraining: boolean) => Promise<any>;
  updateFeatureGroupDatasetType: (projectId: string, featureGroupId: string, datasetType: string) => Promise<any>;

  setFeatureGroupIndexingConfig: (featureGroupId: string, primaryKey: string, updateTimestampKey: string, lookupKeys: string[]) => Promise<any>;
  updateFeatureGroup: (featureGroupId, name, description, tags) => Promise<any>;
  updateFeatureGroupSqlDefinition: (featureGroupId, sql) => Promise<any>;
  updateFeatureGroupFunctionDefinition: (featureGroupId, functionSourceCode, functionName, inputFeatureGroups, cpuSize, memory, packageRequirements, useOriginalCsvNames: boolean, pythonFunctionBindings: any[]) => Promise<any>;

  updateFeature: (featureGroupId, name, sql, newName) => Promise<any>;
  addFeatureGroup: (tableName, sql, description) => Promise<any>;
  createFeatureGroup: (tableName, sql, description, tags, lockType: FGLockType) => Promise<any>;
  createFeatureGroupFromFunction: (tableName, functionSourceCode, functionName, inputFeatureGroups: string[], description, tags, lockType: FGLockType, memory, cpuSize, pythonFunctionName, pythonFunctionBindings: any[]) => Promise<any>;
  _listSupportedPythonFunctionArgumentTypes: () => Promise<any>;
  lookupFeatures: (deploymentToken: string, deploymentId: string, queryData: any) => Promise<any>;
  setBatchPredictionFeatureGroupOutput: (batchPredictionId: string, tableName: string) => Promise<any>;

  _getProblemTypeCustomModelInfo: (problemType: string, projectId: any) => Promise<any>;
  attachFeatureGroupToProject: (featureGroupId, projectId, datasetType) => Promise<any>;
  removeFeatureGroupFromProject: (featureGroupId, projectId) => Promise<any>;
  addFeature: (featureGroupId: string, name: string, sql: string) => Promise<any>;
  _describeProjectFeatureGroup: (projectId: string, featureGroupId: string) => Promise<any>;
  _describeFeatureGroupList: (featureGroupIds: string[]) => Promise<any>;
  describeFeatureGroup: (featureGroupId: string) => Promise<any>;
  _listFeatureGroups: (projectId) => Promise<any>;
  _listFeatureGroupsDashboard: (filterFeatureGroupUse, limit, startAfterId, search, starred) => Promise<any>;
  listFeatureGroups: (limit: number, startAfterId: string, projectId, featureGroupTemplateId) => Promise<any>;
  createModelFromPython: (
    projectId: string,
    functionSourceCode: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainingInputTables: string[],
    name: string,
    memory: any,
    cpuSize: string,
  ) => Promise<any>;
  createModelFromZip: (
    projectId: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    name: string,
    cpuSize: string,
    memory: number,
    packageRequirements: any,
  ) => Promise<any>;
  createModelFromGit: (
    projectId: string,
    applicationConnectorId: string,
    branchName: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    pythonRoot: string,
    name: string,
    cpuSize: string,
    memory: number,
    packageRequirements: any,
  ) => Promise<any>;

  listDocumentRetrievers: (projectId: string) => Promise<any>;
  createDocumentRetriever: (projectId: string, name: string, featureGroupId: string, documentRetrieverConfig: any) => Promise<any>;
  updateDocumentRetriever: (documentRetrieverId: string, name: string, featureGroupId: string, documentRetrieverConfig: any) => Promise<any>;
  describeDocumentRetriever: (documentRetrieverId: string) => Promise<any>;
  deleteDocumentRetriever: (documentRetrieverId: string) => Promise<any>;
  listDocumentRetrieverVersions: (documentRetrieverId: string) => Promise<any>;
  describeDocumentRetrieverVersion: (documentRetrieverVersion: string) => Promise<any>;
  createDocumentRetrieverVersion: (documentRetrieverId: string) => Promise<any>;

  updatePythonModel: (modelId: string, functionSourceCode: string, trainFunctionName: string, predictManyFunctionName: string, predictFunctionName: string, trainingInputTables: string[], memory: any, cpuSize: string) => Promise<any>;
  updatePythonModelZip: (
    modelId: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    cpuSize: string,
    memory: number,
    packageRequirements: any,
  ) => Promise<any>;
  updatePythonModelGit: (
    modelId: string,
    applicationConnectorId: string,
    branchName: string,
    pythonRoot: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    cpuSize: string,
    memory: number,
  ) => Promise<any>;

  _listFileConnectorFiles: (bucket: string, path: string, pageSize: number, pageToken: string, useFolders: boolean) => Promise<any>;

  setFeatureGroupModifierLock: (featureGroupId: string, locked: boolean) => Promise<any>;
  addOrganizationGroupToFeatureGroupModifiers: (featureGroupId: string, organizationGroupId: string) => Promise<any>;
  removeOrganizationGroupFromFeatureGroupModifiers: (featureGroupId: string, organizationGroupId: string) => Promise<any>;
  _listOrganizationGroupFeatureGroupModifiers: (organizationGroupId: string) => Promise<any>;

  _listProjectFeatureGroups: (projectId) => Promise<any>;
  listProjectFeatureGroups: (projectId: string) => Promise<any>;
  _getFeatureRecord: (featureGroupId: string, recordId) => Promise<any>;
  exportFeatureGroup: (featureGroupId: string, location: string) => Promise<any>;
  getFeatureGroupVersionExportDownloadUrl: (featureGroupExportId: string) => Promise<any>;
  exportFeatureGroupVersionToConsole: (featureGroupVersion: string, exportFileFormat: 'CSV' | 'JSON') => Promise<any>;
  exportFeatureGroupVersionToFileConnector: (featureGroupVersion: string, location: string, exportFileFormat: 'CSV' | 'JSON', overwrite: boolean) => Promise<any>;
  exportFeatureGroupVersionToDatabaseConnector: (featureGroupVersion: string, databaseConnectorId: string, objectName: string, writeMode: string, databaseFeatureMapping: any, idColumn: string, additionalIdColumns: any) => Promise<any>;
  describeExport: (exportId: string) => Promise<any>;
  getExportResult: (exportId: string) => Promise<any>;
  listFeatureGroupExports: (featureGroupId: string) => Promise<any>;
  setProjectFeatureGroupConfig: (featureGroupId: string, projectId: string, projectConfig: any) => Promise<any>;
  _listFeatureGroupExports: (featureGroupId: string) => Promise<any>;
  deleteFeature: (featureGroupId: string, name: string) => Promise<any>;
  deleteFeatureGroup: (featureGroupId: string) => Promise<any>;
  upsertRecord: (datasetId: string, data: any, recordId: string, eventTimestamp: number) => Promise<any>;
  _formatSQL: (sql: string) => Promise<any>;
  _getFeatureGroupProjects: (featureGroupId: string) => Promise<any>;
  setDatasetColumnDataType: (datasetId: string, column: string, dataType: string) => Promise<any>;
  setDatasetColumnDataTypeQueue: (datasetId: string, column: string, dataType: string) => Promise<any>;
  _copyFeatureGroup: (featureGroupId: string, tableName: string, copySchema: boolean, copyNested: boolean, projectId: string) => Promise<any>;

  _addPredictionFile: (deploymentId: string, file: any, fileName: string, fileFormat) => Promise<any>;
  _getPredictionFiles: (deploymentId) => Promise<any>;
  _deletePredictionFiles: (deploymentId: string, fileId) => Promise<any>;

  _getFeatureGroupVersionSampleData: (featureGroupVersion: string) => Promise<any>;

  getTrainingLogs: (modelVersion: string, stdout: boolean, stderr: boolean) => Promise<any>;
  getMaterializationLogs: (featureGroupVersion: string, stdout: boolean, stderr: boolean) => Promise<any>;

  postCustom: (url: string, data: any, options?: ICallApiOptions, cbFinish?: (err: any, res: any) => void) => Promise<any>;
  postJson: (url: string, json: string, options?: ICallApiOptions) => Promise<any>;
  _fetchDoc: (doc: string) => Promise<any>;
  _getFeatureGroupDocuments: (projectId: string, featureGroupId: string, fromRow: number, toRow: number) => Promise<any>;
  _getFeatureGroupVersionDocuments: (projectId: string, featureGroupVersion: string, fromRow: number, toRow: number, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _getFeatureDriftSummary: (deploymentId: string, startDate: string, endDate: string) => Promise<any>;
  _getFeatureDriftBatchPredictionSummary: (batchPredictionVersion: string) => Promise<any>;
  _getAccessStatisticsOverTime: (deploymentId: string, startDate: string, endDate: string, granularity: string, region: string) => Promise<any>;
  _getFeatureDriftSingleFeatureDistribution: (deploymentId: string, startDate: string, endDate: string, featureName: string) => Promise<any>;
  _getFeatureDriftBatchPredictionSingleFeatureDistribution: (batchPredictionVersion: string, featureName: string) => Promise<any>;

  _getNotebookMetaserviceInfo: (notebookId: string) => Promise<any>;
  _createAgentFunctionFileInNotebook: (projectId: string, modelId: string) => Promise<any>;
  getEntitiesFromPDF: (deploymentToken: string, deploymentId: string, pdf: any, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _getEntitiesFromPDF: (deploymentId: string, pdf: any, docId: string, returnExtractedFeatures: boolean, cbFinish: (err: any, res: any) => void) => Promise<any>;
  _getSampleStreamingCode: (featureGroupId: string, projectId: string) => Promise<any>;
  setFeatureGroupSchema: (featureGroupId: string, schema: any[]) => Promise<any>;
  _predictClass: (deploymentId: string, queryData: any, threshold: number, thresholdClass: string) => Promise<any>;
  _pointInTimeFeatureGroupCreationOptions: () => Promise<any>;
  getCluster: (deploymentToken: string, deploymentId: string, queryData: any) => Promise<any>;

  createNaturalLanguageExplanationRequest: (featureGroupId: string, featureGroupVersion: string) => Promise<any>;
  getNaturalLanguageExplanationRequestStatus: (requestId: bigint) => Promise<any>;

  createAIChatSendMessageRequest: (chatSessionId: string, message: string, url: string) => Promise<any>;
  getAIChatSendMessageRequestStatus: (requestId: bigint) => Promise<any>;
  cancelAIChatSendMessageRequest: (requestId: bigint) => Promise<any>;

  createExecuteAgentRequest: (deploymentId: string, query: string, keywordArguments: any, chatHistory: any[]) => Promise<any>;
  getExecuteAgentRequestStatus: (requestId: bigint) => Promise<any>;
  listPipelineVersionLogs: (pipelineVersion: string) => Promise<any>;
}

class REClient_ implements IREClient_ {
  static dataForPredAPI = null;
  static dataForPredDash = null;

  static client_: () => IREClient_ = () => {
    if (!staticClient) {
      staticClient = new REClient_();
    }
    return staticClient;
  };

  static promises_: () => IREClientPromises_ = () => {
    if (!staticPromises) {
      staticPromises = {};
      Object.entries(this.client_()).map(([key, value]) => {
        if (typeof value === 'function') {
          staticPromises[key] = Bluebird.promisify(value);
        }
      });
    }
    return staticPromises;
  };

  static promisesV2: () => IREClientPromises_ = () => {
    if (!staticPromisesV2) {
      staticPromisesV2 = {};
      for (const [apiName, fn] of Object.entries(REClient_.promises_())) {
        staticPromisesV2[apiName] = function (...args) {
          return fn(...args)
            .then((res) => {
              if (!res?.success || res?.error) {
                return Promise.reject(res?.error);
              }
              return res;
            })
            .catch((err) => {
              REActions.addNotificationError(err?.message || err || Constants.errorDefault);
              return Promise.reject(err);
            });
        };
      }
    }
    return staticPromisesV2;
  };

  private calcUrl_ = (queryUrl: string, callType?: string) => {
    let queryUrlLower = queryUrl?.toLowerCase();
    if (queryUrlLower != null && (_.startsWith(queryUrlLower, 'http://') || _.startsWith(queryUrlLower, 'https://'))) {
      return queryUrl;
    }

    let url = '';
    if (callType === 'gql') {
      url += '/gql';
    } else if (callType === 'wsp') {
      // websocket server polling
      if (process.env.NODE_ENV === 'production') {
        let curr_hostname = window.location.hostname;
        let ws_hostname = 'ws.abacus.ai';
        if (['preprod.abacus.ai', 'staging.abacus.ai', 'workshop.abacus.ai'].includes(curr_hostname) || !curr_hostname.endsWith('abacus.ai')) {
          ws_hostname = 'ws-' + curr_hostname;
        }
        return window.location.protocol + '//' + ws_hostname + '/' + queryUrl;
      } else {
        return '/wsp/' + queryUrl;
      }
    } else if (callType === 'ws') {
      // websocket server websockets
      // TODO. backend needs to implement this
    } else {
      url += '/api/v0';
    }

    if (queryUrl != null && queryUrl !== '') {
      if (queryUrl.indexOf('/') !== 0) {
        queryUrl = '/' + queryUrl;
      }
      url += queryUrl;
    }

    return url;
  };

  getEntitiesFromPDF = (deploymentToken: string, deploymentId: string, pdf: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentToken,
      deploymentId,
      pdf,
    };

    this.callApi_('getEntitiesFromPDF', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getNotebookMetaserviceInfo = (notebookId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
    };

    this.callApi_(
      '_getNotebookMetaserviceInfo',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  _createAgentFunctionFileInNotebook = (projectId: string, modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      modelId,
    };

    this.callApi_('_createAgentFunctionFileInNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getEntitiesFromPDF = (deploymentId: string, pdf: any, docId: string, returnExtractedFeatures: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      pdf,
      docId,
      returnExtractedFeatures,
    };

    this.callApi_('_getEntitiesFromPDF', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getSampleStreamingCode = (featureGroupId: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      projectId,
    };

    this.callApi_('_getSampleStreamingCode', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _exportAiChatToNotebook = (chatSessionId: string, messageIndex: number, segmentIndex: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      chatSessionId,
      messageIndex,
      segmentIndex,
    };

    this.callApi_('_exportAiChatToNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createFeatureGroupFileInNotebook = (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
    };

    this.callApi_('_createFeatureGroupFileInNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createModelMetricsAnalysisFileInNotebook = (modelVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
    };

    this.callApi_('_createModelMetricsAnalysisFileInNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setChatMessageFeedback = (chatSessionId: string, messageIndex: number, segmentIndex: number, isUseful: boolean, feedback: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      chatSessionId,
      messageIndex,
      segmentIndex,
      isUseful,
      feedback,
    };

    this.callApi_('_setChatMessageFeedback', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _searchByName = (searchTerm: string, artifactTypes: string[], searchLimit: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      searchTerm,
      artifactTypes,
      searchLimit,
    };

    this.callApi_('_searchByName', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _searchById = (artifactId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      artifactId,
    };

    this.callApi_('_searchById', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setFeatureGroupSchema = (featureGroupId: string, schema: any[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      schema: schema == null ? null : JSON.stringify(schema),
    };

    this.callApi_('setFeatureGroupSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _predictClass = (deploymentId: string, queryData: any, threshold: number, thresholdClass: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      queryData,
      threshold,
      thresholdClass,
    };

    this.callApi_('_predictClass', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _pointInTimeFeatureGroupCreationOptions = (cbFinish: (err: any, res: any) => void) => {
    this.callApi_('_pointInTimeFeatureGroupCreationOptions', {}, function (err, res) {
      cbFinish(err, res);
    });
  };

  getCluster = (deploymentToken: string, deploymentId: string, queryData: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentToken,
      deploymentId,
      queryData: queryData == null ? null : JSON.stringify(queryData),
    };

    this.callApi_('getCluster', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getTrainingLogs = (modelVersion: string, stdout: boolean, stderr: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
      stdout,
      stderr,
    };

    this.callApi_('getTrainingLogs', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getMaterializationLogs = (featureGroupVersion: string, stdout: boolean, stderr: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion,
      stdout,
      stderr,
    };

    this.callApi_('getMaterializationLogs', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _isFeatureGroupNameUsed = (featureGroupName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupName,
    };

    this.callApi_('_isFeatureGroupNameUsed', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _isPythonFunctionNameUsed = (pythonFunctionName: string, organizationId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pythonFunctionName,
      organizationId,
    };

    this.callApi_('_isPythonFunctionNameUsed', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  postCustom = (url: string, data: any, options?: ICallApiOptions, cbFinish?: (err: any, res: any) => void) => {
    this.callApi_(
      url,
      data,
      function (err, res) {
        cbFinish?.(err, res);
      },
      undefined,
      options ?? {},
    );
  };

  postJson = (url: string, json: string, options?: ICallApiOptions, cbFinish?: (err: any, res: any) => void) => {
    // let obj1: any = {
    // };

    this.callApi_(
      url,
      json,
      function (err, res) {
        cbFinish?.(err, res);
      },
      undefined,
      _.assign({ dataType: 'json', contentType: 'application/json' }, options ?? {}),
    );
  };

  _fetchDoc = (doc: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      doc,
    };

    this.callApi_('_fetchDoc', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureGroupVersionSampleData = (featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion,
    };

    this.callApi_('_getFeatureGroupVersionSampleData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureGroupDocuments = (projectId: string, featureGroupId: string, fromRow: number, toRow: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      fromRow,
      toRow,
    };

    this.callApi_('_getFeatureGroupDocuments', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureGroupVersionDocuments = (projectId: string, featureGroupVersion: string, fromRow: number, toRow: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupVersion,
      fromRow,
      toRow,
    };

    this.callApi_('_getFeatureGroupVersionDocuments', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureDriftBatchPredictionSummary = (batchPredictionVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionVersion,
    };

    this.callApi_('_getFeatureDriftBatchPredictionSummary', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureDriftSummary = (deploymentId: string, startDate: string, endDate: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      startDate,
      endDate,
    };

    this.callApi_('_getFeatureDriftSummary', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getAccessStatisticsOverTime = (deploymentId: string, startDate: string, endDate: string, granularity: string, region: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      startDate,
      endDate,
      granularity,
      region,
    };

    this.callApi_('_getAccessStatisticsOverTime', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureDriftBatchPredictionSingleFeatureDistribution = (batchPredictionVersion: string, featureName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionVersion,
      featureName,
    };

    this.callApi_('_getFeatureDriftBatchPredictionSingleFeatureDistribution', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureDriftSingleFeatureDistribution = (deploymentId: string, startDate: string, endDate: string, featureName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      startDate,
      endDate,
      featureName,
    };

    this.callApi_('_getFeatureDriftSingleFeatureDistribution', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _copyFeatureGroup = (featureGroupId: string, tableName: string, copySchema: boolean, copyNested: boolean, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      tableName,
      copySchema,
      copyNested,
      projectId,
    };

    this.callApi_('_copyFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  generateNaturalLanguageExplanation = (featureGroupId: string, featureGroupVersion: string, modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureGroupVersion,
      modelId,
    };

    this.callApi_('generateNaturalLanguageExplanation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setNaturalLanguageExplanation = (shortExplanation: string, longExplanation: string, featureGroupId: string, featureGroupVersion: string, modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      shortExplanation,
      longExplanation,
      featureGroupId,
      featureGroupVersion,
      modelId,
    };

    this.callApi_('setNaturalLanguageExplanation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getNaturalLanguageExplanation = (featureGroupId: string, featureGroupVersion: string, modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureGroupVersion,
      modelId,
    };

    this.callApi_('getNaturalLanguageExplanation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listOrganizationGroups = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listOrganizationGroups', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listPipelineVersionLogs = (pipelineVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineVersion,
    };

    this.callApi_('listPipelineVersionLogs', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createOrganizationGroup = (groupName: string, permissions: string[], defaultGroup: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      groupName,
      permissions: permissions == null ? null : JSON.stringify(permissions),
      defaultGroup,
    };

    this.callApi_('createOrganizationGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeOrganizationGroup = (organizationGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationGroupId,
    };

    this.callApi_('describeOrganizationGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addOrganizationGroupPermission = (organizationGroupId: string, permission, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationGroupId,
      permission,
    };

    this.callApi_('addOrganizationGroupPermission', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeOrganizationGroupPermission = (organizationGroupId: string, permission, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationGroupId,
      permission,
    };

    this.callApi_('removeOrganizationGroupPermission', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteOrganizationGroup = (organizationGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationGroupId,
    };

    this.callApi_('deleteOrganizationGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addUserToOrganizationGroup = (organizationGroupId: string, email, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationGroupId,
      email,
    };

    this.callApi_('addUserToOrganizationGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeUserFromOrganizationGroup = (organizationGroupId: string, email, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationGroupId,
      email,
    };

    this.callApi_('removeUserFromOrganizationGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setDefaultOrganizationGroup = (organizationGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationGroupId,
    };

    this.callApi_('setDefaultOrganizationGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _addPredictionFile = (deploymentId: string, file: any, fileName: string, fileFormat, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      file,
      fileName,
      fileFormat,
    };

    this.callApi_('_addPredictionFile', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPredictionFiles = (deploymentId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('_getPredictionFiles', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deletePredictionFiles = (deploymentId: string, fileId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      fileId,
    };

    this.callApi_(
      '_deletePredictionFiles',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  updateFeatureGroupSqlDefinition = (featureGroupId, sql, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      sql,
    };

    this.callApi_('updateFeatureGroupSqlDefinition', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateFeatureGroupFunctionDefinition = (
    featureGroupId,
    functionSourceCode,
    functionName,
    inputFeatureGroups,
    cpuSize,
    memory,
    packageRequirements,
    useOriginalCsvNames,
    pythonFunctionBindings: any[],
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      featureGroupId,
      functionSourceCode,
      functionName,
      inputFeatureGroups,
      memory,
      cpuSize,
      packageRequirements,
      useOriginalCsvNames,
      ...(pythonFunctionBindings && { pythonFunctionBindings: JSON.stringify(pythonFunctionBindings) }),
    };

    this.callApi_('updateFeatureGroupFunctionDefinition', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setFeatureGroupIndexingConfig = (featureGroupId: string, primaryKey: string, updateTimestampKey: string, lookupKeys: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      primaryKey,
      updateTimestampKey,
      lookupKeys: lookupKeys == null ? null : JSON.stringify(lookupKeys),
    };

    this.callApi_('setFeatureGroupIndexingConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateFeatureGroup = (featureGroupId, name, description, tags, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      name,
      description,
      tags: tags == null ? null : JSON.stringify(tags),
    };

    this.callApi_('updateFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateFeature = (featureGroupId, name, sql, newName, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      selectExpression: sql,
      name,
      newName,
    };

    this.callApi_('updateFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addFeatureGroup = (tableName, sql, description, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      tableName,
      sql,
      description,
    };

    this.callApi_('addFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setBatchPredictionFeatureGroupOutput = (batchPredictionId: string, tableName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
      tableName,
    };

    REClient_.client_().describeBatchPrediction(batchPredictionId, (err, res) => {
      if (err || !res?.success) {
        cbFinish(err, res);
      } else {
        if (res?.result?.featureGroupTableName === tableName) {
          cbFinish(null, res);
        } else {
          this.callApi_('setBatchPredictionFeatureGroupOutput', obj1, function (err, res) {
            cbFinish(err, res);
          });
        }
      }
    });
  };

  lookupFeatures = (deploymentToken: string, deploymentId: string, queryData: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentToken,
      deploymentId,
      queryData: queryData == null ? null : JSON.stringify(queryData),
    };

    this.callApi_('lookupFeatures', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createFeatureGroup = (tableName, sql, description, tags, lockType: FGLockType, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      tableName,
      sql,
      description,
      tags: tags == null ? null : JSON.stringify(tags),
      lockType,
    };

    this.callApi_('createFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createFeatureGroupFromFunction = (
    tableName,
    functionSourceCode,
    functionName,
    inputFeatureGroups: string[],
    description,
    tags,
    lockType: FGLockType,
    memory,
    cpuSize,
    pythonFunctionName,
    pythonFunctionBindings: any[],
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      tableName,
      functionSourceCode,
      functionName,
      inputFeatureGroups,
      description,
      tags: tags == null ? null : JSON.stringify(tags),
      lockType,
      memory,
      cpuSize,
      pythonFunctionName,
      ...(pythonFunctionBindings && { pythonFunctionBindings: JSON.stringify(pythonFunctionBindings) }),
    };

    this.callApi_('createFeatureGroupFromFunction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listSupportedPythonFunctionArgumentTypes = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listSupportedPythonFunctionArgumentTypes', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  attachFeatureGroupToProject = (featureGroupId, projectId, datasetType, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      projectId,
      featureGroupType: datasetType,
    };

    this.callApi_('attachFeatureGroupToProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeFeatureGroupFromProject = (featureGroupId, projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      projectId,
    };

    this.callApi_('removeFeatureGroupFromProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addFeature = (featureGroupId: string, name: string, sql: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      name,
      selectExpression: sql,
    };

    this.callApi_('addFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addNestedFeature = (featureGroupId: string, nestedFeatureName: string, tableName: string, usingClause: string, whereClause: string, orderClause: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      nestedFeatureName,
      tableName,
      usingClause,
      whereClause,
      orderClause,
    };

    this.callApi_('addNestedFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateNestedFeature = (featureGroupId: string, nestedFeatureName: string, newNestedFeatureName: string, tableName: string, usingClause: string, whereClause: string, orderClause: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      nestedFeatureName,
      newNestedFeatureName,
      tableName,
      usingClause,
      whereClause,
      orderClause,
    };

    this.callApi_('updateNestedFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteNestedFeature = (featureGroupId: string, nestedFeatureName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      nestedFeatureName,
    };

    this.callApi_('deleteNestedFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getRecentPredictionRequestIds = (deploymentId: string, numRecords: number, startRequestId: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      numRecords,
      startRequestId,
    };

    this.callApi_('_getRecentPredictionRequestIds', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setDeploymentInfraConfig = (deploymentId: string, disableAutoShutdown: boolean, enableMonitoring: boolean, alertQps: number, alertLatencyMs: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      disableAutoShutdown,
      enableMonitoring,
      alertQps,
      alertLatencyMs,
    };

    this.callApi_('_setDeploymentInfraConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPredictionRequestLogs = (deploymentId: string, requestId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      numRecords: 1,
      startRequestId: requestId,
    };

    this.callApi_('_getPredictionRequestLogs', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _dumpPredictionRequestLogs = (deploymentId: string, numRecords: number, pageNum: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      numRecords,
      pageNum,
    };

    this.callApi_('_dumpPredictionRequestLogs', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setFeatureType = (featureGroupId: string, feature: string, featureType: string, cbFinish: (err: any, res: any, isLast?: boolean) => void) => {
    let obj1: any = {
      featureGroupId,
      feature,
      featureType,
    };

    this.callApi_(
      'setFeatureType',
      obj1,
      function (err, res, isLast) {
        cbFinish(err, res, isLast);
      },
      undefined,
      { queue: true },
    );
  };

  useFeatureGroupForTraining = (projectId: string, featureGroupId: string, useForTraining: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      useForTraining,
    };

    this.callApi_(
      'useFeatureGroupForTraining',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { queue: true },
    );
  };

  updateFeatureGroupDatasetType = (projectId: string, featureGroupId: string, datasetType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      datasetType,
    };

    this.callApi_(
      'updateFeatureGroupType',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { queue: true },
    );
  };

  setFeatureMapping = (projectId: string, featureGroupId: string, featureName: string, featureMapping: string, nestedColumnName: string, cbFinish: (err: any, res: any, isLast?: boolean) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      featureName,
      featureMapping,
      nestedColumnName,
    };

    this.callApi_(
      'setFeatureMapping',
      obj1,
      function (err, res, isLast) {
        cbFinish(err, res, isLast);
      },
      undefined,
      { queue: true },
    );
  };

  _validateProjectFeatureGroups = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_validateProjectFeatureGroups', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _bulkSetProjectFeatureGroupTypesAndFeatureMappings = (projectId: string, featureGroupTypeMappings: any[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupTypeMappings: featureGroupTypeMappings == null ? featureGroupTypeMappings : JSON.stringify(featureGroupTypeMappings),
    };

    this.callApi_('_bulkSetProjectFeatureGroupTypesAndFeatureMappings', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  inferFeatureMappings = (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
    };

    this.callApi_('inferFeatureMappings', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _describeProjectFeatureGroup = (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange = true) => {
    let obj1: any = {
      projectId,
      featureGroupId,
    };

    this.callApi_(
      '_describeProjectFeatureGroup',
      obj1,
      function (err, res) {
        if (res?.result != null) {
          if (res.result.featureGroupType != null) {
            res.result.datasetType = res.result.featureGroupType;
          }
        }

        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: ignoreOrgChange ?? true },
    );
  };

  describeFeatureGroup = (featureGroupId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange = true) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_(
      'describeFeatureGroup',
      obj1,
      function (err, res) {
        if (res?.result != null) {
          if (res.result.featureGroupType != null) {
            res.result.datasetType = res.result.featureGroupType;
          }
        }

        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: ignoreOrgChange ?? true },
    );
  };

  _describeFeatureGroupList = (featureGroupIds: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupIds,
    };

    this.callApi_('_describeFeatureGroupList', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createFeatureGroupTemplate = (featureGroupId: string, name: string, templateSql: string, templateVariables: any, description: string, shouldAttachFeatureGroupToTemplate: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      name,
      templateSql,
      templateVariables: templateVariables == null ? templateVariables : JSON.stringify(templateVariables),
      description,
      shouldAttachFeatureGroupToTemplate,
    };

    this.callApi_('createFeatureGroupTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureGroupTemplateVariableOptions = (templateSql: string, templateBindings: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      templateSql,
      templateBindings: templateBindings == null ? templateBindings : JSON.stringify(templateBindings),
    };

    this.callApi_('_getFeatureGroupTemplateVariableOptions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteFeatureGroupTemplate = (featureGroupTemplateId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupTemplateId,
    };

    this.callApi_('deleteFeatureGroupTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getModelInfo = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('_getModelInfo', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listFeatureGroupTemplates = (limit: number, startAfterId: string, featureGroupId: string, shouldIncludeSystemTemplates: boolean, cbFinish: (err: any, res: any) => void) => {
    if (Constants.flags.hide_system_templates) {
      shouldIncludeSystemTemplates = false;
    }

    let obj1: any = {
      limit,
      startAfterId,
      featureGroupId,
      shouldIncludeSystemTemplates,
    };

    this.callApi_('listFeatureGroupTemplates', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listProjectFeatureGroupTemplates = (limit: number, startAfterId: string, projectId: string, shouldIncludeSystemTemplates: boolean, cbFinish: (err: any, res: any) => void) => {
    if (Constants.flags.hide_system_templates) {
      shouldIncludeSystemTemplates = false;
    }

    let obj1: any = {
      limit,
      startAfterId,
      projectId,
      shouldIncludeSystemTemplates,
    };

    this.callApi_('listProjectFeatureGroupTemplates', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeTemplate = (featureGroupTemplateId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupTemplateId,
    };

    this.callApi_('describeFeatureGroupTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateFeatureGroupTemplate = (featureGroupTemplateId: string, name: string, templateSql: string, description: string, templateVariables: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      description,
      featureGroupTemplateId,
      templateSql,
      templateVariables: templateVariables == null ? templateVariables : JSON.stringify(templateVariables),
    };

    this.callApi_('updateFeatureGroupTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  previewFeatureGroupTemplateResolution = (featureGroupTemplateId: string, templateSql: string, templateVariables: any, templateBindings: any, shouldValidate: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupTemplateId,
      templateSql,
      templateVariables: templateVariables == null ? templateVariables : JSON.stringify(templateVariables),
      templateBindings: templateBindings == null ? templateBindings : JSON.stringify(templateBindings),
      shouldValidate,
    };

    this.callApi_('previewFeatureGroupTemplateResolution', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  suggestFeatureGroupTemplateForFeatureGroup = (featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_('suggestFeatureGroupTemplateForFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createFeatureGroupFromTemplate = (
    tableName: string,
    featureGroupTemplateId: string,
    templateBindings: any,
    shouldAttachFeatureGroupToTemplate: boolean,
    description: string,
    lockType: number,
    tags: string[],
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      tableName,
      featureGroupTemplateId,
      templateBindings: templateBindings == null ? templateBindings : JSON.stringify(templateBindings),
      shouldAttachFeatureGroupToTemplate,
      description,
      lockType,
      tags: tags == null ? tags : JSON.stringify(tags),
    };

    this.callApi_('createFeatureGroupFromTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  detachFeatureGroupFromTemplate = (featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_('detachFeatureGroupFromTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateFeatureGroupTemplateBindings = (featureGroupId: string, templateBindings: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      templateBindings: templateBindings == null ? templateBindings : JSON.stringify(templateBindings),
    };

    this.callApi_('updateFeatureGroupTemplateBindings', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelFromPython = (
    projectId: string,
    functionSourceCode: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainingInputTables: string[],
    name: string,
    memory: any,
    cpuSize: string,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId,
      functionSourceCode,
      trainFunctionName,
      predictManyFunctionName,
      predictFunctionName,
      trainingInputTables,
      name,
      memory,
      cpuSize,
    };

    this.callApi_('createModelFromPython', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelFromZip = (
    projectId: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    name: string,
    cpuSize: string,
    memory: number,
    packageRequirements: any,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId,
      trainFunctionName,
      predictManyFunctionName,
      predictFunctionName,
      trainModuleName,
      predictModuleName,
      trainingInputTables: trainingInputTables == null ? trainingInputTables : JSON.stringify(trainingInputTables),
      name,
      cpuSize,
      memory,
      packageRequirements: packageRequirements == null ? packageRequirements : JSON.stringify(packageRequirements),
    };

    this.callApi_('createModelFromZip', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelFromGit = (
    projectId: string,
    applicationConnectorId: string,
    branchName: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    pythonRoot: string,
    name: string,
    cpuSize: string,
    memory: number,
    packageRequirements: any,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId,
      applicationConnectorId,
      branchName,
      trainFunctionName,
      predictManyFunctionName,
      predictFunctionName,
      trainModuleName,
      predictModuleName,
      trainingInputTables: trainingInputTables == null ? trainingInputTables : JSON.stringify(trainingInputTables),
      pythonRoot,
      name,
      cpuSize,
      memory,
      packageRequirements: packageRequirements == null ? packageRequirements : JSON.stringify(packageRequirements),
    };

    this.callApi_('createModelFromGit', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDocumentRetrievers = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    const obj1 = {
      projectId,
      limit: 9999,
    };
    this.callApi_('listVectorStores', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createDocumentRetriever = (projectId: string, name: string, featureGroupId: string, vectorStoreConfig: any, cbFinish: (err: any, res: any) => void) => {
    const obj1 = {
      projectId,
      name,
      featureGroupId,
      vectorStoreConfig: vectorStoreConfig == null ? vectorStoreConfig : JSON.stringify(vectorStoreConfig),
    };
    this.callApi_('createVectorStore', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateDocumentRetriever = (vectorStoreId: string, name: string, featureGroupId: string, vectorStoreConfig: any, cbFinish: (err: any, res: any) => void) => {
    const obj1 = {
      vectorStoreId,
      name,
      featureGroupId,
      vectorStoreConfig: vectorStoreConfig == null ? vectorStoreConfig : JSON.stringify(vectorStoreConfig),
    };
    this.callApi_('updateVectorStore', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeDocumentRetriever = (vectorStoreId: string, cbFinish: (err: any, res: any) => void) => {
    const obj1 = {
      vectorStoreId,
    };
    this.callApi_('describeVectorStore', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteDocumentRetriever = (vectorStoreId: string, cbFinish: (err: any, res: any) => void) => {
    const obj1 = {
      vectorStoreId,
    };
    this.callApi_('deleteVectorStore', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDocumentRetrieverVersions = (vectorStoreId: string, cbFinish: (err: any, res: any) => void) => {
    const obj1 = {
      vectorStoreId,
      limit: 9999,
    };
    this.callApi_('listVectorStoreVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeDocumentRetrieverVersion = (vectorStoreVersion: string, cbFinish: (err: any, res: any) => void) => {
    const obj1 = {
      vectorStoreVersion,
    };
    this.callApi_('describeVectorStoreVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createDocumentRetrieverVersion = (vectorStoreId: string, cbFinish: (err: any, res: any) => void) => {
    const obj1 = {
      vectorStoreId,
    };
    this.callApi_('createVectorStoreVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listFileConnectorFiles = (bucket: string, path: string, pageSize: number, pageToken: string, useFolders: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      bucket,
      path,
      pageSize,
      pageToken,
      useFolders,
    };

    this.callApi_('_listFileConnectorFiles', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updatePythonModel = (
    modelId: string,
    functionSourceCode: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainingInputTables: string[],
    memory: any,
    cpuSize: string,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      modelId,
      functionSourceCode,
      trainFunctionName,
      predictManyFunctionName,
      predictFunctionName,
      trainingInputTables,
      memory,
      cpuSize,
    };

    this.callApi_('updatePythonModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updatePythonModelZip = (
    modelId: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    cpuSize: string,
    memory: number,
    packageRequirements: any,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      modelId,
      trainFunctionName,
      predictManyFunctionName,
      predictFunctionName,
      trainModuleName,
      predictModuleName,
      trainingInputTables: trainingInputTables == null ? trainingInputTables : JSON.stringify(trainingInputTables),
      cpuSize,
      memory,
      packageRequirements: packageRequirements == null ? packageRequirements : JSON.stringify(packageRequirements),
    };

    this.callApi_('updatePythonModelZip', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updatePythonModelGit = (
    modelId: string,
    applicationConnectorId: string,
    branchName: string,
    pythonRoot: string,
    trainFunctionName: string,
    predictManyFunctionName: string,
    predictFunctionName: string,
    trainModuleName: string,
    predictModuleName: string,
    trainingInputTables: string[],
    cpuSize: string,
    memory: number,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      modelId,
      applicationConnectorId,
      branchName,
      pythonRoot,
      trainFunctionName,
      predictManyFunctionName,
      predictFunctionName,
      trainModuleName,
      predictModuleName,
      trainingInputTables: trainingInputTables == null ? trainingInputTables : JSON.stringify(trainingInputTables),
      cpuSize,
      memory,
    };

    this.callApi_('updatePythonModelGit', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listFeatureGroups = (projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_listFeatureGroups', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listFeatureGroupsDashboard = (filterFeatureGroupUse, limit, startAfterId, search, starred, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      filterFeatureGroupUse,
      limit,
      startAfterId,
      search,
      starred,
    };

    this.callApi_('_listFeatureGroupsDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _formatSQL = (sql: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      sql,
    };

    this.callApi_('_formatSQL', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listProjectFeatureGroups = (projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_listProjectFeatureGroups', obj1, function (err, res) {
      if (res?.result != null && _.isArray(res?.result)) {
        res.result.some((r1) => {
          if (r1?.featureGroupType != null) {
            r1.datasetType = r1.featureGroupType;
          }
        });
      }
      cbFinish(err, res);
    });
  };

  listProjectFeatureGroups = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('listProjectFeatureGroups', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listFeatureGroups = (limit: number, startAfterId: string, projectId, featureGroupTemplateId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      limit,
      startAfterId,
      featureGroupTemplateId,
    };

    this.callApi_('listFeatureGroups', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setFeatureGroupModifierLock = (featureGroupId: string, locked: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      locked,
    };

    this.callApi_('setFeatureGroupModifierLock', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addOrganizationGroupToFeatureGroupModifiers = (featureGroupId: string, organizationGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      organizationGroupId,
    };

    this.callApi_('addOrganizationGroupToFeatureGroupModifiers', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeOrganizationGroupFromFeatureGroupModifiers = (featureGroupId: string, organizationGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      organizationGroupId,
    };

    this.callApi_('removeOrganizationGroupFromFeatureGroupModifiers', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listOrganizationGroupFeatureGroupModifiers = (organizationGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationGroupId,
    };

    this.callApi_('_listOrganizationGroupFeatureGroupModifiers', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureRecord = (featureGroupId: string, recordId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      recordId,
    };

    this.callApi_('_getFeatureRecord', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  exportFeatureGroupVersionToDatabaseConnector = (
    featureGroupVersion: string,
    databaseConnectorId: string,
    objectName: string,
    writeMode: string,
    databaseFeatureMapping: any,
    idColumn: string,
    additionalIdColumns: any,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      featureGroupVersion,
      databaseConnectorId,
      objectName,
      writeMode,
      databaseFeatureMapping,
      idColumn,
      additionalIdColumns,
    };

    this.callApi_('exportFeatureGroupVersionToDatabaseConnector', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  exportFeatureGroupVersionToConsole = (featureGroupVersion: string, exportFileFormat: 'CSV' | 'JSON', cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion,
      exportFileFormat,
    };

    this.callApi_('exportFeatureGroupVersionToConsole', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  exportFeatureGroupVersionToFileConnector = (featureGroupVersion: string, location: string, exportFileFormat: 'CSV' | 'JSON', overwrite: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion,
      location,
      exportFileFormat,
      overwrite,
    };

    this.callApi_('exportFeatureGroupVersionToFileConnector', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  exportFeatureGroup = (featureGroupId: string, location: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      location,
    };

    this.callApi_('exportFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeExport = (featureGroupExportId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange = true) => {
    let obj1: any = {
      featureGroupExportId,
    };

    this.callApi_(
      'describeFeatureGroupExport',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: ignoreOrgChange ?? true },
    );
  };

  getExportResult = (exportId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      exportId,
    };

    this.callApi_('getExportResult', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setDatasetColumnDataType = (datasetId: string, column: string, dataType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      column,
      dataType,
    };

    this.callApi_('setDatasetColumnDataType', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setDatasetColumnDataTypeQueue = (datasetId: string, column: string, dataType: string, cbFinish: (err: any, res: any, isLast?: boolean) => void) => {
    let obj1: any = {
      datasetId,
      column,
      dataType,
    };

    this.callApi_(
      'setDatasetColumnDataType',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { queue: true },
    );
  };

  _getFeatureGroupProjects = (featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_('_getFeatureGroupProjects', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setProjectFeatureGroupConfig = (featureGroupId: string, projectId: string, projectConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      projectId,
      projectConfig: projectConfig == null ? null : JSON.stringify(projectConfig),
    };

    this.callApi_('setProjectFeatureGroupConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listFeatureGroupExports = (featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_('listFeatureGroupExports', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listFeatureGroupExports = (featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_('listFeatureGroupExports', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteFeature = (featureGroupId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      name,
    };

    this.callApi_(
      'deleteFeature',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  deleteFeatureGroup = (featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_(
      'deleteFeatureGroup',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  upsertRecord = (datasetId: string, data: any, recordId: string, eventTimestamp: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      data,
      recordId,
      eventTimestamp,
    };

    this.callApi_('upsertRecord', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getMetricsRanges = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getMetricsRanges', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _callOpenAi = (prompt: string, options: any, language: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      prompt,
      options: options == null ? null : JSON.stringify(options),
      language: language == null ? 'sql' : 'python',
    };

    this.callApi_('_callOpenAi', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _internalGetSqlSuggestionForRawData = (featureGroupId: string, prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      prompt,
      projectId,
    };

    this.callApi_('_internalGetSqlSuggestionForRawData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _internalGetPythonSuggestion = (prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      prompt,
      projectId,
    };

    this.callApi_('_internalGetPythonSuggestion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getSqlSuggestionForRawData = (featureGroupId: string, prompt: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      prompt,
      projectId,
    };

    this.callApi_('_getSqlSuggestionForRawData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPythonSuggestion = (prompt: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      prompt,
    };

    this.callApi_('_getPythonSuggestion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getMetricsDataByModel = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_getMetricsDataByModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getMetricsDataByModelVersion = (modelVersion: string, algorithm: string, validation, nRows, sortByClass, dataClusterType, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
      algorithm,
      validation,
      nRows,
      n_rows: nRows,
      sortByClass,
      sort_by_class: sortByClass,
      dataClusterType,
    };

    this.callApi_('_getMetricsDataByModelVersion', obj1, function (err, res) {
      if (res?.result != null) {
        let r1 = res.result;
        let d1 = r1?.metrics;
        if (d1.additionalExpandingMetricsTreesGlobalList == null || d1.additionalExpandingMetricsTreesGlobalList?.length === 0) {
          let list1 = [],
            dictAll = {};
          d1.additionalMetricsKeys?.some((k1) => {
            if (!dictAll[k1]) {
              list1.push({
                key: k1,
                name: k1,
              });
              dictAll[k1] = true;
            }
          });
          r1?.otherMetrics?.some((m1) => {
            m1 = m1?.[Object.keys(m1 ?? {})[0]];
            m1?.additionalMetricsKeys?.some((k1) => {
              if (!dictAll[k1]) {
                list1.push({
                  key: k1,
                  name: k1,
                });
                dictAll[k1] = true;
              }
            });
          });

          if (list1 != null && list1?.length > 0) {
            list1 = list1.sort();
            d1.additionalExpandingMetricsTreesGlobalList = [{ defaultExpanded: false, name: 'Backtest', values: list1 } as IMetricsFolderData];

            let dict1 = {};
            d1.additionalMetricsKeys?.some((k1) => {
              dict1[k1] = true;
            });
            d1.additionalExpandingMetricsKeys = dict1;

            r1?.otherMetrics?.some((m1) => {
              m1 = m1?.[Object.keys(m1 ?? {})[0]];
              if (m1 != null && (m1.additionalExpandingMetricsKeys == null || m1.additionalExpandingMetricsKeys?.length === 0)) {
                let dict1 = {};
                m1.additionalMetricsKeys?.some((k1) => {
                  dict1[k1] = true;
                });
                m1.additionalExpandingMetricsKeys = dict1;
              }
            });
          }
        }

        //validation
        if (r1?.hasValidation === true && d1 != null) {
          const addToKeys = (d1, key1) => {
            let dict1: any = {};
            if (d1.additionalExpandingMetricsKeys != null && _.isArray(d1.additionalExpandingMetricsKeys)) {
              dict1 = d1.additionalExpandingMetricsKeys?.[0];
              if (dict1 == null) {
                dict1 = {};
                d1.additionalExpandingMetricsKeys[0] = dict1;
              }
            } else {
              d1.additionalExpandingMetricsKeys ??= dict1;
              dict1 = d1.additionalExpandingMetricsKeys;
            }
            dict1[key1] = true;
          };

          //
          if (Utils.isNullOrEmpty(dataClusterType)) {
            let validationOne = { hideHeader: true, name: 'Validation', values: [{ isMain: true, isValidation: true, key: 'IntValidation', name: 'Validation Metrics' }] } as IMetricsFolderData;
            d1.additionalExpandingMetricsTreesGlobalList ??= [];
            d1.additionalExpandingMetricsTreesGlobalList.unshift(validationOne);

            addToKeys(d1, 'IntValidation');

            r1?.otherMetrics?.some((m1) => {
              m1 = m1?.[Object.keys(m1 ?? {})[0]];
              if (m1 != null) {
                addToKeys(m1, 'IntValidation');
              }
            });
          }
        }
      }

      cbFinish(err, res);
    });
  };

  _billingGetUrl = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_billingGetUrl', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listProjects = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      limit: 2000,
    };

    this.callApi_('listProjects', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getProductDetails = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getProductDetails', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _addPaymentMethod = (card: any, billingDetails: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      card,
      billingDetails,
    };

    this.callApi_('_addPaymentMethod', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listRegions = (service: 'aws' | 'gcp' | 'azure', cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      service,
    };

    this.callApi_('_listRegions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _confirmPaymentMethodIntent = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_confirmPaymentMethodIntent', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _addPaymentMethodIntent = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_addPaymentMethodIntent', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createBillingAccount = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_createBillingAccount', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createNewVersions = (projectId: string, refreshType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      refreshType,
    };

    this.callApi_('_createNewVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deletePaymentMethod = (paymentMethodId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      paymentMethodId,
    };

    this.callApi_(
      '_deletePaymentMethod',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  _getCurrentUsage = (since, until, daily, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};
    if (since != null) {
      obj1.since = since;
    }
    if (until != null) {
      obj1.until = until;
    }
    if (daily != null) {
      obj1.daily = daily;
    }

    this.callApi_('_getUsage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getNextBillingDate = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getNextBillingDate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setIgnoreAndRetrain = (modelId: string, columns: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      columns: columns == null ? null : JSON.stringify(columns),
    };

    this.callApi_('_setIgnoreAndRetrain', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getBillingAccount = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getBillingAccount', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPublicKey = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getPublicKey', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listInvoices = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listInvoices', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listPaymentMethods = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listPaymentMethods', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getRates = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getRates', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setDatasetPublicSource = (datasetId, url, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      url,
    };

    this.callApi_('_setDatasetPublicSource', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFreeTier = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getFreeTier', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setDefaultPaymentMethod = (paymentMethodId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      paymentMethodId,
    };

    this.callApi_('_setDefaultPaymentMethod', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addExternalBucketAWSRole = (bucket: string, roleArn: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      bucket,
      roleArn,
    };

    this.callApi_('addAWSRole', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setAzureBlobConnectionString = (bucket: string, connectionString: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      bucket,
      connectionString,
    };

    this.callApi_('setAzureBlobConnectionString', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getExternalBucketOwnershipTest = (bucket: string, writePermission: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      bucket,
      writePermission,
    };

    this.callApi_('getFileConnectorInstructions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getSampleCode = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('_getSampleCode', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getOutliersForFeature = (modelMonitorVersion, featureName, nestedFeatureName, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
      featureName,
      nestedFeatureName,
    };

    this.callApi_('getOutliersForFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getOutliersForBatchPredictionFeature = (batchPredictionVersion, featureName, nestedFeatureName, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionVersion,
      featureName,
      nestedFeatureName,
    };

    this.callApi_('getOutliersForBatchPredictionFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getDriftForFeature = (modelMonitorVersion, featureName, nestedFeatureName, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
      featureName,
      nestedFeatureName,
    };

    this.callApi_('getDriftForFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getPredictionDrift = (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
    };

    this.callApi_('getPredictionDrift', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureDriftModelMonitorSummary = (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
    };

    this.callApi_('_getFeatureDriftModelMonitorSummary', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getEmbeddingDriftDistributions = (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
    };

    this.callApi_('_getEmbeddingDriftDistributions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createVisionDriftMonitor = (
    projectId,
    modelId,
    name,
    trainingFeatureGroupId,
    predictionFeatureGroupId,
    refreshSchedule,
    featureMappings,
    targetValue,
    targetValueBias,
    targetValuePerformance,
    trainingFeatureMappings,
    featureGroupMonitorBaseConfig,
    featureGroupMonitorComparisonConfig,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId,
      modelId,
      name,
      refreshSchedule,
      trainingFeatureGroupId,
      predictionFeatureGroupId,
      targetValuePerformance,
      featureMappings: featureMappings == null ? null : JSON.stringify(featureMappings),
      trainingFeatureMappings: trainingFeatureMappings == null ? null : JSON.stringify(trainingFeatureMappings),
      featureGroupBaseMonitorConfig: featureGroupMonitorBaseConfig == null ? null : JSON.stringify(featureGroupMonitorBaseConfig),
      featureGroupComparisonMonitorConfig: featureGroupMonitorComparisonConfig == null ? null : JSON.stringify(featureGroupMonitorComparisonConfig),
    };

    this.callApi_('createVisionDriftMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createNlpDriftMonitor = (projectId, predictionFeatureGroupId, trainingFeatureGroupId, name, featureMappings, trainingFeatureMappings, targetValuePerformance, refreshSchedule, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      predictionFeatureGroupId,
      trainingFeatureGroupId,
      name,
      featureMappings: featureMappings == null ? null : JSON.stringify(featureMappings),
      trainingFeatureMappings: trainingFeatureMappings == null ? null : JSON.stringify(trainingFeatureMappings),
      targetValuePerformance,
      refreshSchedule,
    };

    this.callApi_('createNlpDriftMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createEda = (
    projectId,
    featureGroupId,
    name,
    refreshSchedule,
    includeCollinearity,
    includeDataConsistency,
    collinearityKeys,
    primaryKeys,
    dataConsistencyTestConfig,
    dataConsistencyReferenceConfig,
    featureMappings,
    forecastFrequency,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      name,
      refreshSchedule,
      includeCollinearity,
      includeDataConsistency,
      collinearityKeys,
      primaryKeys,
      dataConsistencyTestConfig: dataConsistencyTestConfig == null ? null : JSON.stringify(dataConsistencyTestConfig),
      dataConsistencyReferenceConfig: dataConsistencyReferenceConfig == null ? null : JSON.stringify(dataConsistencyReferenceConfig),
      featureMappings: featureMappings == null ? null : JSON.stringify(featureMappings),
      forecastFrequency,
    };

    this.callApi_('createEda', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  rerunEda = (edaId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaId,
    };

    this.callApi_('rerunEda', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createGraphDashboard = (projectId: string, name: string, pythonFunctionIds: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      name,
      pythonFunctionIds: pythonFunctionIds == null ? null : JSON.stringify(pythonFunctionIds),
    };

    this.callApi_('createGraphDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeGraphDashboard = (graphDashboardId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      graphDashboardId,
    };

    this.callApi_(
      'describeGraphDashboard',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  listGraphDashboards = (projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('listGraphDashboards', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteGraphDashboard = (graphDashboardId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      graphDashboardId,
    };

    this.callApi_('deleteGraphDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateGraphDashboard = (graphDashboardId: string, name: string, pythonFunctionIds: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      graphDashboardId,
      name,
      pythonFunctionIds: pythonFunctionIds == null ? null : JSON.stringify(pythonFunctionIds),
    };

    this.callApi_('updateGraphDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateGraphToDashboard = (graphReferenceId: string, functionVariableMappings: any, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      graphReferenceId,
      name,
      functionVariableMappings: functionVariableMappings == null ? null : JSON.stringify(functionVariableMappings),
    };

    this.callApi_('updateGraphToDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeGraphForDashboard = (graphReferenceId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      graphReferenceId,
    };

    this.callApi_('describeGraphForDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listEda = (projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('listEda', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeEda = (edaId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaId,
    };

    this.callApi_(
      'describeEda',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  listEdaVersions = (edaId, limit, startAfterVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaId,
      limit,
      startAfterVersion,
    };

    this.callApi_('listEdaVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeEdaVersion = (edaVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
    };

    this.callApi_(
      'describeEdaVersion',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  renameEda = (edaId, name, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaId,
      name,
    };

    this.callApi_('renameEda', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteEda = (edaId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaId,
    };

    this.callApi_('deleteEda', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteEdaVersion = (edaVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
    };

    this.callApi_('deleteEdaVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getFeatureAssociation = (edaVersion, referenceFeatureName, testFeatureName, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
      referenceFeatureName,
      testFeatureName,
    };

    this.callApi_(
      'getFeatureAssociation',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  _getEdaItemLevelForecastingAnalysis = (edaVersion, primaryKeyMapping, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
      primaryKeyMapping: primaryKeyMapping == null ? null : JSON.stringify(primaryKeyMapping),
    };

    this.callApi_('_getEdaItemLevelForecastingAnalysis', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getEdaForecastingAnalysis = (edaVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
    };

    this.callApi_('getEdaForecastingAnalysis', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getEdaForecastingTargetMappings = (useCase, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      useCase,
    };

    this.callApi_('_getEdaForecastingTargetMappings', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getEdaForecastingItemIds = (edaVersion, primaryKeys, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
      primaryKeys,
    };

    this.callApi_('_getEdaForecastingItemIds', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getEdaCollinearity = (edaVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
    };

    this.callApi_(
      'getEdaCollinearity',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  getEdaDataConsistency = (edaVersion, transformationFeature, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
      transformationFeature,
    };

    this.callApi_(
      'getEdaDataConsistency',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  getCollinearityForFeature = (edaVersion, featureName, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      edaVersion,
      featureName,
    };

    this.callApi_(
      'getCollinearityForFeature',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  createModelMonitor = (
    projectId,
    modelId,
    name,
    trainingFeatureGroupId,
    predictionFeatureGroupId,
    refreshSchedule,
    featureMappings,
    targetValue,
    targetValueBias,
    targetValuePerformance,
    trainingFeatureMappings,
    featureGroupMonitorBaseConfig,
    featureGroupMonitorComparisonConfig,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId,
      modelId,
      name,
      refreshSchedule,
      trainingFeatureGroupId,
      predictionFeatureGroupId,
      targetValue,
      targetValueBias,
      targetValuePerformance,
      featureMappings: featureMappings == null ? null : JSON.stringify(featureMappings),
      trainingFeatureMappings: trainingFeatureMappings == null ? null : JSON.stringify(trainingFeatureMappings),
      featureGroupBaseMonitorConfig: featureGroupMonitorBaseConfig == null ? null : JSON.stringify(featureGroupMonitorBaseConfig),
      featureGroupComparisonMonitorConfig: featureGroupMonitorComparisonConfig == null ? null : JSON.stringify(featureGroupMonitorComparisonConfig),
    };

    this.callApi_('createModelMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  rerunModelMonitor = (modelMonitorId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
    };

    this.callApi_('rerunModelMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listModelMonitors = (projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('listModelMonitors', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeModelMonitor = (modelMonitorId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
    };

    this.callApi_('describeModelMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listModelMonitorVersions = (modelMonitorId, limit, startAfterVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
      limit,
      startAfterVersion,
    };

    this.callApi_('listModelMonitorVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeModelMonitorVersion = (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
    };

    this.callApi_('describeModelMonitorVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  renameModelMonitor = (modelMonitorId, name, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
      name,
    };

    this.callApi_('renameModelMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteModelMonitor = (modelMonitorId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
    };

    this.callApi_('deleteModelMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteModelMonitorVersion = (modelMonitorVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
    };

    this.callApi_('deleteModelMonitorVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listProjectModelMonitorVersions = (projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_listProjectModelMonitorVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listExternalBuckets = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listFileConnectors', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDatabaseConnectors = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listDatabaseConnectors', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listApplicationConnectors = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listApplicationConnectors', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listStreamingConnectors = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listStreamingConnectors', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  renameDatabaseConnector = (databaseConnectorId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      databaseConnectorId,
      name,
    };

    this.callApi_(
      'renameDatabaseConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'PATCH' },
    );
  };

  renameApplicationConnector = (applicationConnectorId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      applicationConnectorId,
      name,
    };

    this.callApi_(
      'renameApplicationConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'PATCH' },
    );
  };

  renameStreamingConnector = (streamingConnectorId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      streamingConnectorId,
      name,
    };

    this.callApi_(
      'renameStreamingConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'PATCH' },
    );
  };

  createStreamingDataset = (projectId: string, datasetType: string, name: string, tableName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      datasetType,
      name,
      tableName,
    };

    this.callApi_('createStreamingDataset', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createStreamingFeatureGroupFromBatch = (projectId: string, featureGroupId: string, tableName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      tableName,
    };

    this.callApi_('_createStreamingFeatureGroupFromBatch', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  appendDatasetRows = (streamingToken: string, datasetId: string, rows: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      streamingToken,
      datasetId,
      rows,
    };

    this.callApi_('appendDatasetRows', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createStreamingToken = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('createStreamingToken', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listStreamingTokens = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listStreamingTokens', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteStreamingToken = (streamingToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      streamingToken,
    };

    this.callApi_('deleteStreamingToken', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _fileExists = (bucket: string, path: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      bucket,
      path,
    };

    this.callApi_('_fileExists', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  verifyExternalBucket = (bucket: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      bucket,
    };

    this.callApi_('verifyFileConnector', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  verifyExternalDatabase = (databaseConnectorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      databaseConnectorId,
    };

    this.callApi_('verifyDatabaseConnector', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  verifyApplicationConnector = (applicationConnectorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      applicationConnectorId,
    };

    this.callApi_('verifyApplicationConnector', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  verifyStreamingConnector = (streamingConnectorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      streamingConnectorId,
    };

    this.callApi_('verifyStreamingConnector', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeExternalBucket = (bucket: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      bucket,
    };

    this.callApi_(
      'removeFileConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  removeDatabaseConnector = (databaseConnectorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      databaseConnectorId,
    };

    this.callApi_(
      'removeDatabaseConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  removeStreamingConnector = (streamingConnectorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      streamingConnectorId,
    };

    this.callApi_(
      'deleteStreamingConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  setDatasetLookbackDays: (datasetId: string, lookbackDays: boolean, cbFinish: (err: any, res: any) => void) => void = (datasetId: string, lookbackDays: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      lookbackDays,
    };

    this.callApi_(
      'setLookbackDays',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  setDatasetEphemeral = (datasetId: string, ephemeral: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      ephemeral,
    };

    this.callApi_(
      'setEphemeral',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  getDatabaseConnectorInstructions = (service: string, currentAuth: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      service,
      currentAuth,
    };

    this.callApi_(
      '_getDatabaseConnectorInstructions',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  getApplicationConnectorInstructions = (service: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      service,
    };

    this.callApi_(
      '_getApplicationConnectorInstructions',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  getStreamingConnectorInstructions = (service: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      service,
    };

    this.callApi_(
      '_getStreamingConnectorInstructions',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  listValidDatabaseConnectors = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_(
      '_listValidDatabaseConnectors',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  listValidApplicationConnectors = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_(
      '_listValidApplicationConnectors',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  listValidStreamingConnectors = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_(
      '_listValidStreamingConnectors',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  listValidFileConnectors = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_(
      '_listValidFileConnectors',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  listDatabaseConnectorObjects = (databaseConnectorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = { databaseConnectorId };

    this.callApi_(
      'listDatabaseConnectorObjects',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  getDatabaseConnectorObjectSchema = (databaseConnectorId: string, objectName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = { databaseConnectorId, objectName };

    this.callApi_(
      'getDatabaseConnectorObjectSchema',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {},
    );
  };

  createDatasetFromDatabaseConnector = (
    isDocumentset: boolean,
    databaseConnectorId: string,
    objectName: string,
    columns: string,
    name: string,
    queryArguments: string,
    projectId: string,
    datasetType: string,
    tableName: string,
    sqlQuery: string,
    incremental: boolean,
    timestampColumn: string,
    refreshSchedule: string,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      databaseConnectorId,
      objectName,
      columns,
      name,
      queryArguments,
      projectId,
      datasetType,
      tableName,
      sqlQuery,
      incremental,
      timestampColumn,
      refreshSchedule,
      isDocumentset,
    };

    this.callApi_(
      'createDatasetFromDatabaseConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  documentation_ = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('documentation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getDocstoreDocument = (docId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      docId,
    };

    this.callApi_('getDocstoreDocument', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _pythonGraphData = (pythonFunctionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pythonFunctionId,
    };

    this.callApi_('_pythonGraphData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _pythonGraphDataForDashboard = (graphReferenceId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      graphReferenceId,
    };

    this.callApi_('_pythonGraphDataForDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteGraphFromDashboard = (graphReferenceId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      graphReferenceId,
    };

    this.callApi_('deleteGraphFromDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addGraphToDashboard = (pythonFunctionId: string, graphDashboardId: string, functionVariableMappings: any, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pythonFunctionId,
      graphDashboardId,
      functionVariableMappings: functionVariableMappings == null ? null : JSON.stringify(functionVariableMappings),
      name,
    };

    this.callApi_('addGraphToDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getDocstoreImage = (docId: string, maxWidth: number, maxHeight: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      docId,
      maxWidth,
      maxHeight,
    };

    this.callApi_('getDocstoreImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getUseCaseDocumentation = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getUseCaseDocumentation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _selectOrganizationRegion = (service: string, region: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      service,
      region,
    };

    this.callApi_('_selectOrganizationRegion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createSnapshotFeatureGroupFromDatasetVersion = (datasetVersion: string, tableName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetVersion,
      tableName,
    };

    this.callApi_('_createSnapshotFeatureGroupFromDatasetVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getTrainingConfigOptions = (projectId: string, featureGroupIds: string[], forRetrain: boolean, currentTrainingConfig: any, isAdditionalModel: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupIds: featureGroupIds == null ? null : JSON.stringify(featureGroupIds),
      forRetrain,
      currentTrainingConfig: currentTrainingConfig == null ? null : JSON.stringify(currentTrainingConfig),
      isAdditionalModel,
    };

    this.callApi_('getTrainingConfigOptions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getDefaultModelName = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_getDefaultModelName', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getNotebookMemoryOptions = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getNotebookMemoryOptions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createFeatureGroupSnapshot = (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
    };

    this.callApi_('createFeatureGroupVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listFeatureGroupVersions = (featureGroupId: string, limit: number, startAfterInstanceId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      limit,
      startAfterInstanceId,
    };

    this.callApi_('listFeatureGroupVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeFeatureGroupVersion = (featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion,
    };

    this.callApi_('describeFeatureGroupVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeFeatureGroupByTableName = (tableName: string, projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      tableName,
      projectId,
    };

    this.callApi_(
      'describeFeatureGroupByTableName',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreNeedLogin: true, ignoreOrgChange: true },
    );
  };

  getDefaultDeploymentName = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_getDefaultDeploymentName', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getAdditionalMetricsDataByModelVersion = (modelVersion: string, additionalMetricsKey: string, algorithm: string, validation: boolean, dataClusterType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
      additionalMetricsKey,
      algorithm,
      validation,
      dataClusterType,
    };

    this.callApi_('_getAdditionalMetricsDataByModelVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateModelTrainingConfig = (modelId: string, trainingConfig: any, featureGroupIds: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      trainingConfig: JSON.stringify(trainingConfig),
      featureGroupIds: featureGroupIds == null ? null : JSON.stringify(featureGroupIds),
    };

    this.callApi_('updateModelTrainingConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  trainModelsAuto = (
    projectId: string,
    trainingConfig: any,
    name: string,
    refreshSchedule: string,
    featureGroupIds: string[],
    cpuSize: string,
    memory: number,
    customAlgorithmConfigs: any,
    builtinAlgorithms: string[],
    algorithmTrainingConfigs: any[],
    cbFinish: (err: any, res: any) => void,
  ) => {
    let customAlgorithms = null;
    if (customAlgorithmConfigs != null) {
      customAlgorithms = Object.keys(customAlgorithmConfigs);
    }

    let obj1: any = {
      trainingConfig: JSON.stringify(trainingConfig),
      projectId,
      name,
      refreshSchedule,
      featureGroupIds: featureGroupIds == null ? null : JSON.stringify(featureGroupIds),
      cpuSize,
      memory,
      customAlgorithms: customAlgorithms == null ? null : JSON.stringify(customAlgorithms),
      customAlgorithmConfigs: customAlgorithmConfigs == null ? null : JSON.stringify(customAlgorithmConfigs),
      builtinAlgorithms: builtinAlgorithms == null ? null : JSON.stringify(builtinAlgorithms),
    };

    if (algorithmTrainingConfigs) {
      obj1.algorithmTrainingConfigs = JSON.stringify(algorithmTrainingConfigs);
    }

    this.callApi_('trainModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  retrainModel = (
    modelId: string,
    deploymentIds: string[],
    featureGroupIds: string[],
    cpuSize: string,
    memory: number,
    customAlgorithmConfigs: any,
    builtinAlgorithms: string[],
    algorithmTrainingConfigs: any[],
    cbFinish: (err: any, res: any) => void,
  ) => {
    let customAlgorithms = null;
    if (customAlgorithmConfigs != null) {
      customAlgorithms = Object.keys(customAlgorithmConfigs);
    }
    let obj1: any = {
      modelId,
      deploymentIds,
      featureGroupIds: featureGroupIds == null ? null : JSON.stringify(featureGroupIds),
      cpuSize,
      memory,
      customAlgorithms: customAlgorithms == null ? null : JSON.stringify(customAlgorithms),
      customAlgorithmConfigs: customAlgorithmConfigs == null ? null : JSON.stringify(customAlgorithmConfigs),
      builtinAlgorithms: builtinAlgorithms == null ? null : JSON.stringify(builtinAlgorithms),
    };

    if (algorithmTrainingConfigs) {
      obj1.algorithmTrainingConfigs = JSON.stringify(algorithmTrainingConfigs);
    }

    this.callApi_('retrainModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  cancelModelTraining = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_(
      'cancelModelTraining',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  _getCpuAndMemoryOptions = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getCpuAndMemoryOptions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listAvailableProblemTypesForAlgorithms = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listAvailableProblemTypesForAlgorithms', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _checkTableName = (tableName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      tableName,
    };

    this.callApi_('_checkTableName', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeDatasetFromProject = (projectId: string, datasetId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      datasetId,
    };

    this.callApi_('removeDatasetFromProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  attachDatasetToProject = (projectId: string, datasetId: string, datasetType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      datasetId,
      datasetType,
    };

    this.callApi_('attachDatasetToProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelFromDockerImage = (projectId: string, dockerImageUri: string, servicePort: number, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      dockerImageUri,
      servicePort,
      name,
    };

    this.callApi_('createModelFromDockerImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createPredictionMetric = (featureGroupId: string, predictionMetricConfig, projectId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      predictionMetricConfig: predictionMetricConfig == null ? null : JSON.stringify(predictionMetricConfig),
      projectId,
    };

    this.callApi_('createPredictionMetric', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _bulkAddFeatureGroupsToProject = (projectId: string, featureGroupIds: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupIds,
    };

    this.callApi_('_bulkAddFeatureGroupsToProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureGroupColumnTopValues = (projectId: string, featureGroupId: string, columnName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      columnName,
    };

    this.callApi_('_getFeatureGroupColumnTopValues', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _describePredictionMetric = (predictionMetricId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      predictionMetricId,
    };

    this.callApi_('describePredictionMetric', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deletePredictionMetric = (predictionMetricId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      predictionMetricId,
    };

    this.callApi_('deletePredictionMetric', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setModelPredictionParams = (modelId: string, predictionConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      predictionConfig: predictionConfig == null ? null : JSON.stringify(predictionConfig),
    };

    this.callApi_('setModelPredictionParams', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createNotebookTemplate = (notebookId: string, filename: string, templateName: string, description: string, templateType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
      filename,
      templateName,
      description,
      templateType,
    };

    this.callApi_('_createNotebookTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deleteNotebookTemplate = (notebookTemplateId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookTemplateId,
    };

    this.callApi_('_deleteNotebookTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _describeNotebookTemplate = (notebookTemplateId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookTemplateId,
    };

    this.callApi_('_describeNotebookTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listNotebookTemplates = (templateType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      templateType,
    };

    this.callApi_('_listNotebookTemplates', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _updateNotebookTemplate = (notebookTemplateId: string, notebookId: string, filename: string, templateName: string, description: string, templateType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookTemplateId,
      notebookId,
      filename,
      templateName,
      description,
      templateType,
    };

    this.callApi_('_updateNotebookTemplate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listNotebookTemplateTypes = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listNotebookTemplateTypes', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _addTemplateToNotebook = (notebookId: string, notebookTemplateId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
      notebookTemplateId,
    };

    this.callApi_('_addTemplateToNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _openNotebook = (name: string, projectId: string, memory: number, useGpu: boolean, notebookTemplateId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      projectId,
      memory,
      useGpu,
      notebookTemplateId,
    };

    this.callApi_('_openNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listPredictionMetrics = (projectId: string, featureGroupId: string, limit, startAfterId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      limit,
      startAfterId,
    };

    this.callApi_('queryPredictionMetrics', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _describePredictionMetricVersion = (predictionMetricVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      predictionMetricVersion,
    };

    this.callApi_('describePredictionMetricVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deletePredictionMetricVersion = (predictionMetricVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      predictionMetricVersion,
    };

    this.callApi_('deletePredictionMetricVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _runPredictionMetric = (predictionMetricId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      predictionMetricId,
    };

    this.callApi_('runPredictionMetric', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listPredictionMetricVersions = (predictionMetricId: string, limit, startAfterId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      predictionMetricId,
      limit,
      startAfterId,
    };

    this.callApi_('listPredictionMetricVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelVersionFromDockerImage = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('createModelVersionFromDockerImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  //they are really IDs
  createProject = (name: string, useCase: string, isFeatureGroupProject: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      useCase,
    };

    this.callApi_('createProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  editProject = (projectId: any, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: projectId,
      name: name,
    };

    this.callApi_(
      'renameProject',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'PATCH' },
    );
  };

  deleteProject = (project_id: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
    };

    this.callApi_(
      'deleteProject',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  setDeploymentModelVersion = (deploymentId: string, modelVersion: boolean, algorithm: string, algorithmFiltered: string, trainedModelType: string, cbFinish: (err: any, res: any) => void) => {
    let model_deployment_config = {};
    if (algorithmFiltered != null) {
      model_deployment_config['model_overrides_for_data_cluster_types'] = {
        filtered_out_items: {
          algorithm: algorithmFiltered,
        },
      };
    }
    if (trainedModelType != null) {
      model_deployment_config['model_training_type'] = trainedModelType;
    }
    let obj1: any = {
      deploymentId,
      modelVersion,
      algorithm,
      modelDeploymentConfig: Object.keys(model_deployment_config).length === 0 ? null : JSON.stringify(model_deployment_config),
    };

    this.callApi_('setDeploymentModelVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deployPretrainedModel = (projectId: string, algorithm: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      algorithm,
    };

    this.callApi_('_deployPretrainedModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createDeployment = (
    projectId: string,
    autoDeploy: boolean,
    modelId: string,
    modelVersion: string,
    algorithm: string,
    algorithmFiltered: string,
    additionalModelName: string,
    featureGroupId: string,
    name: string,
    description: string,
    callsPerSecond: any,
    start: boolean,
    attachedStreamingFg: string,
    streamingFgDataUses: any[],
    trainedModelType: string,
    createFeedbackStreamingFg: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let model_deployment_config = {};
    if (algorithmFiltered != null) {
      model_deployment_config['model_overrides_for_data_cluster_types'] = {
        filtered_out_items: {
          algorithm: algorithmFiltered,
        },
      };
    }
    if (trainedModelType != null) {
      model_deployment_config['model_training_type'] = trainedModelType;
    }
    if (attachedStreamingFg != null) {
      let columnToDataUseMap = null;
      if (streamingFgDataUses != null) {
        let columnName = streamingFgDataUses?.[0].column_name;
        let columnDataUse = streamingFgDataUses?.[0].column_data_use;
        if (columnName != null && columnDataUse != null) {
          columnToDataUseMap = [
            {
              column_name: columnName,
              column_data_use: columnDataUse,
            },
          ];
        }
      }
      model_deployment_config['streaming_feature_groups'] = [
        {
          name: attachedStreamingFg,
          column_to_data_use: columnToDataUseMap,
        },
      ];
    }
    let deployment_config = {};
    if (createFeedbackStreamingFg) {
      deployment_config['create_chat_feedback_feature_group'] = true;
    }

    let obj1: any = {
      projectId,
      modelId,
      modelVersion,
      autoDeploy,
      algorithm,
      additionalModelName,
      featureGroupId,
      name,
      description,
      callsPerSecond,
      start,
      modelDeploymentConfig: Object.keys(model_deployment_config).length === 0 ? null : JSON.stringify(model_deployment_config),
      deploymentConfig: Object.keys(deployment_config).length === 0 ? null : JSON.stringify(deployment_config),
    };

    this.callApi_('createDeployment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _uploadProfileImage = (photoData, resetPhoto, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      photoData,
      resetPhoto,
    };

    this.callApi_('_uploadProfileImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelFromLocalFiles = (projectId, name, optionalArtifacts: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      name,
      optionalArtifacts,
    };

    this.callApi_('createModelFromLocalFiles', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelVersionFromLocalFiles = (modelId, optionalArtifacts: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      optionalArtifacts,
    };

    this.callApi_('createModelVersionFromLocalFiles', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _verifyModelFromFilesLocation = (projectId, location: string, customArtifactFilenames: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      location,
      customArtifactFilenames,
    };

    this.callApi_('_verifyModelFromFilesLocation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelFromFiles = (projectId, name, location: string, customArtifactFilenames: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      name,
      location,
      customArtifactFilenames,
    };

    this.callApi_('createModelFromFiles', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModelVersionFromFiles = (modelId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('createModelVersionFromFiles', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getDefaultModelImage = (modelId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_getDefaultModelImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _uploadModelImage = (modelId, photoData, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      photoData,
    };

    this.callApi_('_uploadModelImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _updatePublicProfile = (name, userHandle, bio, twitterHandle, githubHandle, linkedinHandle, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      userHandle,
      bio,
      twitterHandle,
      githubHandle,
      linkedinHandle,
    };

    this.callApi_('_updatePublicProfile', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getSharedModelDatasetMetrics = (modelId: string, rows: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      rows,
    };
    obj1.ck = Constants.flags.model_graphs_cache_key;

    this.callApi_(
      '_getSharedModelDatasetMetrics',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  _getSharedModelGraphs = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };
    obj1.ck = Constants.flags.model_graphs_cache_key;

    this.callApi_(
      '_getSharedModelGraphs',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  _getEditorsChoice = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getEditorsChoice', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listUserComments = (userHandle: string, communityInteractionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      userHandle,
      communityInteractionId,
    };

    this.callApi_('_listUserComments', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listSharedModels = (limit: number, lastSeenModelId: string, userHandle: string, useCase: string, sortBy: string, isVotes: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      limit,
      lastSeenModelId,
    };
    if (userHandle) {
      obj1.userHandle = userHandle;
    }
    if (useCase) {
      obj1.useCase = useCase;
    }
    if (sortBy) {
      obj1.sortBy = sortBy;
    }
    if (isVotes) {
      obj1.filterBy = 'votes';
    }

    if (Utils.isNullOrEmpty(obj1.sortBy)) {
      obj1.sortBy = 'shared_at';
    }

    this.callApi_('_listSharedModels', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getSharedModel = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_getSharedModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listModelComments = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_listModelComments', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPublicUser = (userHandle: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      userHandle,
    };

    this.callApi_('_getPublicUser', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getModelComment = (communityInteractionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      communityInteractionId,
    };

    this.callApi_('_getModelComment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _editModelComment = (communityInteractionId: string, comment: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      communityInteractionId,
      comment,
    };

    this.callApi_('_editModelComment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deleteModelComment = (communityInteractionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      communityInteractionId,
    };

    this.callApi_(
      '_deleteModelComment',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  _shareModel = (modelId: string, name: string, desc: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      name,
      description: desc,
    };

    this.callApi_('_shareModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _starModel = (modelId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      starred,
    };

    this.callApi_('_starModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _starDataset = (datasetId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      starred,
    };

    this.callApi_('_starDataset', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _starProject = (projectId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      starred,
    };

    this.callApi_('_starProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _starDeployment = (deploymentId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      starred,
    };

    this.callApi_('_starDeployment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _starBatchPrediction = (batchPredictionId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
      starred,
    };

    this.callApi_('_starBatchPrediction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _starFeatureGroup = (featureGroupId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      starred,
    };

    this.callApi_('_starFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _addModelComment = (modelId: string, comment: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      comment,
    };

    this.callApi_('_addModelComment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deleteVote = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_deleteVote', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _addVote = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_addVote', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _hideModel = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_hideModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listUseCasesInternal = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_(
      '_listUseCasesInternal',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true, ignoreNeedLogin: true },
    );
  };

  _describeDataset = (datasetId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
    };

    this.callApi_(
      '_describeDataset',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true, ignoreNeedLogin: true },
    );
  };

  _getUserInfo = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_(
      '_getUserInfo',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true, ignoreNeedLogin: true },
    );
  };

  setIgnoreBefore = (datasetId: string, timestamp: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      timestamp,
    };

    this.callApi_('setIgnoreBefore', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  batchPredict = (globalPredictionArgs: any, deploymentId: string, name: string, inputLocation: string, outputLocation: string, refreshSchedule: string, explanations: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      inputLocation,
      outputLocation,
      name,
      refreshSchedule,
      globalPredictionArgs: globalPredictionArgs == null ? null : JSON.stringify(globalPredictionArgs),
      explanations,
    };

    this.callApi_('batchPredict', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _cancelBatchPrediction = (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
    };

    this.callApi_(
      '_cancelBatchPrediction',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  _getModelSchemaOverrides = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_getModelSchemaOverrides', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFoldFeatureDistributions = (modelVersion: string, featureName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
      featureName,
    };

    this.callApi_('_getFoldFeatureDistributions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getExampleQuery = (databaseConnectorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      databaseConnectorId,
    };

    this.callApi_('_getExampleQuery', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeBatchPrediction = (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
    };

    this.callApi_(
      'describeBatchPrediction',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  deployListForProject = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('listDeployments', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteDeployment = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_(
      'deleteDeployment',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  startDeployment = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_(
      'startDeployment',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  stopDeployment = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_(
      'stopDeployment',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  renameDeployment = (deploymentId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    this.callApi_('renameDeployment', { deploymentId, name }, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPykernelMetaserviceInfo = (cbFinish: (err: any, res: any) => void) => {
    this.callApi_(
      '_getPykernelMetaserviceInfo',
      {},
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  getNotebookCellCompletion = (completionType: string, previousCells: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      completionType,
      previousCells,
    };

    this.callApi_('getNotebookCellCompletion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listNotebookVersions = (notebookId: string, cbFinish: (err: any, res: any) => void) => {
    let obj: any = {
      notebookId,
    };

    this.callApi_('_listNotebookVersions', obj, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getProjectFeatureGroupLineage = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    this.callApi_('_getProjectFeatureGroupLineage', { projectId }, function (err, res) {
      cbFinish(err, res);
    });
  };

  setModelObjective = (modelVersion: string, metric: string, cbFinish: (err: any, res: any) => void) => {
    this.callApi_(
      'setModelObjective',
      { modelVersion, metric },
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  _setMetricsSortObjectiveForUi = (modelVersion: string, metric: string, cbFinish: (err: any, res: any) => void) => {
    this.callApi_(
      '_setMetricsSortObjectiveForUi',
      { modelVersion, metric },
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  _setFeatureTags = (featureGroupId: string, feature: string, tags: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      feature,
      tags: tags == null ? null : JSON.stringify(tags),
    };

    this.callApi_('_setFeatureTags', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addProjectTags = (projectId: string, tags: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      tags: tags == null ? null : JSON.stringify(tags),
    };

    this.callApi_('addProjectTags', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeProjectTags = (projectId: string, tags: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      tags: tags == null ? null : JSON.stringify(tags),
    };

    this.callApi_('removeProjectTags', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setFeatureNote = (featureGroupId: string, feature: string, note: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      feature,
      note,
    };

    this.callApi_('_setFeatureNote', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createDeploymentToken = (projectId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      ...(name && { name }),
    };

    this.callApi_('_createDeploymentToken', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteDeploymentToken = (deploymentToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentToken,
    };

    this.callApi_(
      'deleteDeploymentToken',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  _inviteUserExists = (userInviteId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      userInviteId,
    };

    this.callApi_('_inviteUserExists', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getExampleDatasets = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_getExampleDatasets', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _useExampleDatasets = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_useExampleDatasets', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDeploymentTokens = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('listDeploymentTokens', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  trainModel = (projectId: string, name: string, algorithm: string, lossFunction: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      name,
      algorithm,
    };

    this.callApi_('trainModel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteModel = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_(
      'deleteModel',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  _setLeadModel = (modelId: string, algorithm: string, dataClusterType, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      algorithm,
      dataClusterType,
    };

    this.callApi_('setDefaultModelAlgorithm', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeModel = (modelId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange = true) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_(
      'describeModel',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: ignoreOrgChange ?? true },
    );
  };

  _describeModelVersion = (modelVersion: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange = true) => {
    let obj1: any = {
      modelVersion,
    };

    this.callApi_(
      'describeModelVersion',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: ignoreOrgChange ?? true },
    );
  };

  describeDeployment = (deploymentId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange = true) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_(
      'describeDeployment',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: ignoreOrgChange ?? true },
    );
  };

  describeProject = (projectId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange = true) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_(
      'describeProject',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: ignoreOrgChange ?? true },
    );
  };

  describeUseCaseRequirements = (useCase: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      useCase,
    };

    this.callApi_('describeUseCaseRequirements', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listApiKeys = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listApiKeys', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createApiKey = (tag: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      tag,
    };

    this.callApi_('_createApiKey', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteApiKey = (apiKeyId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      apiKeyId,
    };

    this.callApi_(
      'deleteApiKey',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  getModelMetrics = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('getModelMetrics', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listProjectDatasets = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_listProjectDatasets', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getDataAugmentationComparison = (modelId: string, variation: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      variation,
    };

    this.callApi_('_getDataAugmentationComparison', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listModels = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('listModels', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createChatLLMResponseRequest = (deploymentId: string, messages: any[], searchResults: any[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      messages:
        messages == null
          ? messages
          : JSON.stringify(
              messages.map((m1: IChatMsgOne) => {
                if (m1 != null) {
                  m1 = { ...m1 };
                  (m1 as any).is_user = m1.isUser ?? false;
                  delete m1.isUser;
                  delete m1.isInternal;
                  delete m1.isProcessing;
                  delete m1.searchResults;
                }
                return m1;
              }),
            ),
      searchResults: searchResults == null ? searchResults : JSON.stringify(searchResults),
    };

    this.callApi_(
      'createChatLLMResponseRequest',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  getChatLLMResponseRequestStatus = (requestId: bigint, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      requestId,
    };
    this.callApi_(
      'getChatLLMResponseRequestStatus',
      obj1,
      function (err, res) {
        if (res?.result != null) {
          res.result.messages = res.result.messages?.map((message) => {
            if (message != null) {
              message = { ...message };
              message.isUser = message.is_user;
              delete message.is_user;
            }
            return message;
          });
        }

        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  createChatLLMSendMessageRequest = (deploymentConversationId: string, message: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentConversationId,
      message,
    };
    this.callApi_(
      'createChatLLMSendMessageRequest',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  getChatLLMSendMessageRequestStatus = (requestId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      requestId,
    };
    this.callApi_(
      'getChatLLMSendMessageRequestStatus',
      obj1,
      function (err, res) {
        if (res?.result != null) {
          res.result.messages = res.result.messages?.map((message) => ({
            ...message,
            isUser: message.is_user,
          }));
        }

        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  executeAgent = (deploymentId: string, query: string, keywordArguments: any, chatHistory: any[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      query,
      keywordArguments: keywordArguments == null ? null : JSON.stringify(keywordArguments),
      chatHistory: chatHistory == null ? null : JSON.stringify(chatHistory),
    };

    this.callApi_('_executeAgent', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createExecuteAgentRequest = (deploymentId: string, query: string, keywordArguments: any, chatHistory: any[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      query,
      keywordArguments: keywordArguments == null ? null : JSON.stringify(keywordArguments),
      chatHistory: chatHistory == null ? null : JSON.stringify(chatHistory),
    };

    this.callApi_(
      'createExecuteAgentRequest',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  getExecuteAgentRequestStatus = (requestId: bigint, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      requestId,
    };
    this.callApi_(
      'getExecuteAgentRequestStatus',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  _listProjectModelVersionsForFeatureGroup = (projectId: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
    };

    this.callApi_('_listProjectModelVersionsForFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listProjectModelVersions = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_listProjectModelVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listProjectModelVersionsForDataset = (projectId: string, datasetId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      datasetId,
    };

    this.callApi_('_listProjectModelVersionsForDataset', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDatasetVersions = (datasetId: string, limit: number, startAfterVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      limit,
      startAfterVersion,
    };

    this.callApi_('listDatasetVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _downloadSmallFeatureGroupCSV = (featureGroupId: string, columnFilters: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      columnFilters: columnFilters == null ? null : JSON.stringify(columnFilters),
    };

    this.callApi_(
      '_downloadSmallFeatureGroupCSV',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  createPointInTimeGroup = (
    featureGroupId: string,
    groupName: string,
    aggregationKeys: any[],
    windowKey: string,
    lookbackWindow: number,
    lookbackWindowLag: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    historyTableName,
    historyWindowKey,
    historyAggregationKeys,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      featureGroupId,
      groupName,
      aggregationKeys: aggregationKeys == null ? null : JSON.stringify(aggregationKeys),
      windowKey,
      lookbackWindow,
      lookbackWindowLag,
      lookbackCount,
      lookbackUntilPosition,
      historyTableName,
      historyWindowKey,
      historyAggregationKeys: historyAggregationKeys == null ? null : JSON.stringify(historyAggregationKeys),
    };

    this.callApi_('createPointInTimeGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updatePointInTimeGroup = (
    featureGroupId: string,
    groupName: string,
    aggregationKeys: any[],
    windowKey: string,
    lookbackWindow: number,
    lookbackWindowLag: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    historyTableName,
    historyWindowKey,
    historyAggregationKeys,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      featureGroupId,
      groupName,
      aggregationKeys: aggregationKeys == null ? null : JSON.stringify(aggregationKeys),
      windowKey,
      lookbackWindow,
      lookbackWindowLag,
      lookbackCount,
      lookbackUntilPosition,
      historyTableName,
      historyWindowKey,
      historyAggregationKeys: historyAggregationKeys == null ? null : JSON.stringify(historyAggregationKeys),
    };

    this.callApi_('updatePointInTimeGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deletePointInTimeGroup = (featureGroupId: string, groupName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      groupName,
    };

    this.callApi_('deletePointInTimeGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setPointInTimeGroupFeatureExpressions = (featureGroupId: string, groupName: string, expressions: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      groupName,
      expressions,
    };

    this.callApi_('_setPointInTimeGroupFeatureExpressions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _addPointInTimeGeneratedFeatures = (featureGroupId: string, groupName: string, columns: string[], windowFunctions: string[], prefix: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      groupName,
      columns,
      windowFunctions,
      prefix,
    };

    this.callApi_('_addPointInTimeGeneratedFeatures', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createPointInTimeGroupFeature = (featureGroupId: string, groupName: string, name: string, expression: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      groupName,
      name,
      expression,
    };

    this.callApi_('createPointInTimeGroupFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updatePointInTimeGroupFeature = (featureGroupId: string, groupName: string, name: string, expression: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      groupName,
      name,
      expression,
    };

    this.callApi_('updatePointInTimeGroupFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createPointInTimeFeature = (
    featureGroupId: string,
    featureName: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
    onlineLookbackCount: number,
    onlineLookbackWindowSeconds: number,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      featureGroupId,
      featureName,
      historyTableName,
      aggregationKeys: aggregationKeys == null ? null : JSON.stringify(aggregationKeys),
      timestampKey,
      historicalTimestampKey,
      lookbackWindowSeconds,
      lookbackWindowLagSeconds,
      lookbackCount,
      lookbackUntilPosition,
      expression,
      onlineLookbackCount,
      onlineLookbackWindowSeconds,
    };

    this.callApi_('createPointInTimeFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updatePointInTimeFeature = (
    featureGroupId: string,
    featureName: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
    newFeatureName: string,
    onlineLookbackCount: number,
    onlineLookbackWindowSeconds: number,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      featureGroupId,
      featureName,
      historyTableName,
      aggregationKeys: aggregationKeys == null ? null : JSON.stringify(aggregationKeys),
      timestampKey,
      historicalTimestampKey,
      lookbackWindowSeconds,
      lookbackWindowLagSeconds,
      lookbackCount,
      lookbackUntilPosition,
      expression,
      newFeatureName,
      onlineLookbackCount,
      onlineLookbackWindowSeconds,
    };

    this.callApi_('updatePointInTimeFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  estimatePointInTimeComplexity = (
    featureGroupId: string,
    historyTableName: string,
    aggregationKeys: any[],
    timestampKey: string,
    historicalTimestampKey: string,
    lookbackWindowSeconds: number,
    lookbackWindowLagSeconds: number,
    lookbackCount: number,
    lookbackUntilPosition: number,
    expression: string,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      featureGroupId,
      historyTableName,
      aggregationKeys: aggregationKeys == null ? null : JSON.stringify(aggregationKeys),
      timestampKey,
      historicalTimestampKey,
      lookbackWindowSeconds,
      lookbackWindowLagSeconds,
      lookbackCount,
      lookbackUntilPosition,
      expression,
    };

    this.callApi_('_estimatePointInTimeComplexity', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDatasets = (limit: number, startAfterId: string, starred, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      limit,
      startAfterId,
      starred,
    };

    this.callApi_('listDatasets', obj1, function (err, res) {
      if (res?.result != null && _.isArray(res?.result)) {
        res.result = res.result.map((d1) => {
          if (d1 != null && d1.datasetTableName == null) {
            d1.datasetTableName = d1.featureGroupTableName;
          }
          return d1;
        });
      }

      cbFinish(err, res);
    });
  };

  getTrainingDataLogs = (modelVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
    };

    this.callApi_('getTrainingDataLogs', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureGroupSamplingConfigOptions = (featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_('_getFeatureGroupSamplingConfigOptions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listProblemTypes = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listProblemTypes', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createTransformFeatureGroup = (sourceFeatureGroupId: string, tableName: string, transformConfig: any, description: string, lockType: number, tags: string[], projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      sourceFeatureGroupId,
      tableName,
      transformConfig: transformConfig == null ? null : JSON.stringify(transformConfig),
      description,
      lockType,
      tags: tags == null ? null : JSON.stringify(tags),
      projectId,
    };

    this.callApi_('createTransformFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createSnapshotFeatureGroup = (featureGroupVersion: string, tableName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion,
      tableName,
    };

    this.callApi_('createSnapshotFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createMergeFeatureGroup = (sourceFeatureGroupId: string, tableName: string, mergeConfig: any, description: string, lockType: number, tags: string[], projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      sourceFeatureGroupId,
      tableName,
      mergeConfig: mergeConfig == null ? null : JSON.stringify(mergeConfig),
      description,
      lockType,
      tags: tags == null ? null : JSON.stringify(tags),
      projectId,
    };

    this.callApi_('createMergeFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setFeatureGroupTransformConfig = (featureGroupId: string, transformConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      transformConfig: transformConfig == null ? null : JSON.stringify(transformConfig),
    };

    this.callApi_('setFeatureGroupTransformConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setFeatureGroupMergeConfig = (featureGroupId: string, mergeConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      mergeConfig: mergeConfig == null ? null : JSON.stringify(mergeConfig),
    };

    this.callApi_('setFeatureGroupMergeConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setFeatureGroupSamplingConfig = (featureGroupId: string, samplingConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      samplingConfig,
    };

    this.callApi_('setFeatureGroupSamplingConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createSamplingFeatureGroup = (featureGroupId: string, tableName: string, samplingConfig: any, description: string, lockType: number, tags: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      tableName,
      samplingConfig,
      description,
      lockType,
      tags,
      projectId,
    };

    this.callApi_('createSamplingFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getBatchPredictionArgs = (deploymentId: string, isFgTrain: boolean, forEval: boolean, featureGroupOverrides: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      isFgTrain,
      forEval,
      featureGroupOverrides,
    };

    this.callApi_('_getBatchPredictionArgs', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDeployVersionsHistory = (deployId: string, limit: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId: deployId,
      pageSize: limit,
    };

    this.callApi_('_listHistoricalDeploymentVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDeployVersions = (deployId: string, limit: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId: deployId,
      limit,
    };

    this.callApi_('_listDeploymentVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getStreamingIds = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_getStreamingIds', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getCurrentHourRowCount = (datasetId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
    };

    this.callApi_('_getCurrentHourRowCount', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getRecentWrites = (datasetId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
    };

    this.callApi_('_getRecentWrites', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _captureStreamingSchema = (datasetId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
    };

    this.callApi_('_snapshotRecentStreamingSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _describeDeploymentVersion = (deploymentVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentVersion,
    };

    this.callApi_(
      '_describeDeploymentVersion',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  _promoteDeploymentVersion = (deploymentId: string, modelVersion: string, algorithm: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      modelVersion,
      algorithm,
    };

    this.callApi_(
      'setDeploymentModelVersion',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'PATCH' },
    );
  };

  promoteDeploymentFeatureGroupVersion = (deploymentId: string, featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      featureGroupVersion,
    };

    this.callApi_(
      'setDeploymentFeatureGroupVersion',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'PATCH' },
    );
  };

  upgradeDeployment = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('upgradeDeployment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getDefaultQps = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getDefaultQps', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listModelVersions = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('listModelVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeDataset = (datasetId: string, cbFinish: (err: any, res: any) => void, ignoreOrgChange = true) => {
    let obj1: any = {
      datasetId,
    };

    this.callApi_(
      'describeDataset',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: ignoreOrgChange ?? true },
    );
  };

  deleteModelVersion = (modelVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
    };

    this.callApi_(
      'deleteModelVersion',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  setAutoDeployment = (deploymentId: string, enable: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      enable,
    };

    this.callApi_('setAutoDeployment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  renameModel = (modelId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      name,
    };

    this.callApi_(
      'renameModel',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { queue: true },
    );
  };

  _listSolutionsAndUseCases = (isSolutions: boolean, useCase: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      isSolutions,
      useCase,
    };

    this.callApi_('_listSolutionsAndUseCases', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getModelVersionGraphs = (modelVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
    };

    this.callApi_('_getModelVersionGraphs', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureGroupExplorerCharts = (feature_group_version: string, project_id: string, num_items: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion: feature_group_version,
      projectId: project_id,
      numItems: num_items,
    };

    this.callApi_('_getFeatureGroupExplorerCharts', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_data_explorer_charts = (dataset_id: string, project_id: string, num_items: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId: dataset_id,
      projectId: project_id,
      numItems: num_items,
    };

    this.callApi_('_getDataExplorerCharts', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _searchId = (sid: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      sid,
    };

    this.callApi_('_searchId', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _searchProjects = (searchIn: string, projectName: string, useCase: string, problemType: string, createdAtBefore: number, createdAtAfter: number, datasets, models, metrics, deploys, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      searchIn,
      projectName,
      useCase,
      problemType,
      createdAtBefore,
      createdAtAfter,

      datasets: datasets == null ? null : JSON.stringify(datasets),
      models: models == null ? null : JSON.stringify(models),
      metrics: metrics == null ? null : JSON.stringify(metrics),
      deploys: deploys == null ? null : JSON.stringify(deploys),
    };

    this.callApi_('_searchProjects', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  doAddDataset = (
    isDocumentset: boolean,
    newVersionDatasetId: string,
    name: string,
    contentType: string,
    fileOne: File,
    projectId: any,
    datasetType: string,
    fileFormat: string,
    tableName: string,
    csvDelimiter: string,
    extractBoundingBoxes: boolean,
    cbFinishDoUpload: (err: any, res: any) => void,
  ) => {
    this.add_dataset(isDocumentset, newVersionDatasetId, name, projectId, datasetType, fileFormat, tableName, csvDelimiter, extractBoundingBoxes, (errAD: any, resAD: any) => {
      if (fileOne) {
        if (resAD == null) {
          resAD = {};
        }
        resAD.reFileCustom = {
          fileOne,
          contentType,
        };
      }

      if (errAD || !resAD || !resAD.result || (fileOne && !resAD.result?.datasetUploadId)) {
        cbFinishDoUpload(resAD?.error || 'Error creating dataset', resAD);
      } else {
        if (fileOne) {
          cbFinishDoUpload(errAD, resAD);
        } else {
          cbFinishDoUpload(null, { success: true, result: { datasetId: resAD?.result?.datasetId } });
        }
      }
    });
  };

  doImportDataset = (
    isDocumentset: boolean,
    name: string,
    fileFormat: string,
    location: string,
    projectId: any,
    datasetType: string,
    refreshSchedule: string,
    databaseConnectorId: string,
    objectName: string,
    columns: string,
    queryArguments: string,
    tableName: string,
    sqlQuery: string,
    csvDelimiter: string,
    filenameColumn: string,
    startPrefix: string,
    untilPrefix: string,
    locationDateFormat,
    dateFormatLookbackDays,
    incremental,
    incrementalTimestampColumn,
    mergeFileSchemas,
    extractBoundingBoxes: boolean,
    cbProgressDoUpload: (actual: number, total: number) => void,
    cbFinishDoUpload: (err: any, res: any) => void,
  ) => {
    if (databaseConnectorId) {
      this.createDatasetFromDatabaseConnector(
        isDocumentset,
        databaseConnectorId,
        objectName,
        columns,
        name,
        queryArguments,
        projectId,
        datasetType,
        tableName,
        sqlQuery,
        incremental,
        incrementalTimestampColumn,
        refreshSchedule,
        (errAD: any, resAD: any) => {
          if (errAD || !resAD || !resAD.result || !resAD.result?.datasetId) {
            cbFinishDoUpload(resAD?.error || 'Error creating dataset', null);
          } else {
            cbFinishDoUpload(null, { success: true, result: { datasetId: resAD?.result?.datasetId } });
          }
        },
      );
    } else {
      this.import_dataset(
        isDocumentset,
        name,
        fileFormat,
        location,
        projectId,
        datasetType,
        refreshSchedule,
        tableName,
        csvDelimiter,
        filenameColumn,
        startPrefix,
        untilPrefix,
        locationDateFormat,
        dateFormatLookbackDays,
        incremental,
        mergeFileSchemas,
        extractBoundingBoxes,
        (errAD: any, resAD: any) => {
          if (errAD || !resAD || !resAD.result || !resAD.result?.datasetId) {
            cbFinishDoUpload(resAD?.error || 'Error creating dataset', null);
          } else {
            cbFinishDoUpload(null, { success: true, result: { datasetId: resAD?.result?.datasetId } });
          }
        },
      );
    }
  };

  createRefreshPolicy = (
    name: string,
    cron: string,
    refreshType: string,
    projectId: string,
    datasetIds: string[],
    featureGroupId: string,
    modelIds: string[],
    deploymentIds: string[],
    batchPredictionIds: string[],
    predictionMetricIds: string[],
    modelMonitorIds: string[],
    notebookId: string,
    featureGroupExportConfig: any,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      name,
      cron,
      refreshType,
      projectId,
      datasetIds,
      featureGroupId,
      modelIds,
      deploymentIds,
      batchPredictionIds,
      predictionMetricIds,
      modelMonitorIds,
      notebookId,
      featureGroupExportConfig: featureGroupExportConfig == null ? null : JSON.stringify(featureGroupExportConfig),
    };

    this.callApi_('createRefreshPolicy', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setNotebookExecuteFilename = (notebookId: string, executeFilename: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      executeFilename,
      notebookId,
    };

    this.callApi_('_setNotebookExecuteFilename', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeRefreshPolicy = (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      refreshPolicyId,
    };

    this.callApi_(
      'describeRefreshPolicy',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  listRefreshPipelineRuns = (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      refreshPolicyId,
    };

    this.callApi_('listRefreshPipelineRuns', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  pauseRefreshPolicy = (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      refreshPolicyId,
    };

    this.callApi_('pauseRefreshPolicy', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  resumeRefreshPolicy = (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      refreshPolicyId,
    };

    this.callApi_('resumeRefreshPolicy', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateRefreshPolicy = (refreshPolicyId: string, name: string, cron: string, isProd: boolean, featureGroupExportConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      refreshPolicyId,
      name,
      cron,
      isProd,
      featureGroupExportConfig: featureGroupExportConfig == null ? null : JSON.stringify(featureGroupExportConfig),
    };

    this.callApi_('updateRefreshPolicy', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFullDataPreview = (projectId: string, datasetId: string, customFilters: any, cbProgress: (bytes: number, total: number) => void, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      datasetId,
      customFilters,
    };

    this.callApi_(
      '_getFullDataPreview',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { progress: cbProgress },
    );
  };

  listRefreshPolicies = (
    projectId: string,
    datasetIds: string[],
    featureGroupId: string,
    modelIds: string[],
    deploymentIds: string[],
    batchPredictionIds: string[],
    modelMonitorIds: string[],
    predictionMetricIds: string[],
    notebookIds: string[],
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId,
      datasetIds,
      featureGroupId,
      modelIds,
      deploymentIds,
      batchPredictionIds,
      modelMonitorIds,
      predictionMetricIds,
      notebookIds,
    };

    this.callApi_('listRefreshPolicies', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeRefreshPipelineRun = (refreshPipelineRunId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      refreshPipelineRunId,
    };

    this.callApi_(
      'describeRefreshPipelineRun',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  deleteRefreshPolicy = (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      refreshPolicyId,
    };

    this.callApi_(
      'deleteRefreshPolicy',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  runRefreshPolicy = (refreshPolicyId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      refreshPolicyId,
    };

    this.callApi_(
      'runRefreshPolicy',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  _getUserPreferencesOptions = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getUserPreferencesOptions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getUserPreferences = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getUserPreferences', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setNewPassword = (currentPassword: string, newPassword: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      currentPassword,
      newPassword,
    };

    this.callApi_('_setNewPassword', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _updateOrganizationDiscoverability = (discoverable: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      discoverable,
    };

    this.callApi_('_updateOrganizationDiscoverability', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _updateEmail = (email: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      email,
    };

    this.callApi_('_updateEmail', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _updateUserPreferences = (preferences: object, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      preferences: preferences == null ? null : JSON.stringify(preferences),
    };

    this.callApi_('_updateUserPreferences', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  delete_dataset = (dataset_id: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId: dataset_id,
    };

    this.callApi_(
      'deleteDataset',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  add_dataset = (
    isDocumentset: boolean,
    newVersionDatasetId: string,
    name: string,
    projectId: any,
    datasetType: string,
    fileFormat: string,
    tableName: string,
    csvDelimiter: string,
    extractBoundingBoxes: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId: projectId,
      datasetType: datasetType,
      name,
      fileFormat,
      tableName,
      datasetTableName: tableName,
      csvDelimiter,
      isDocumentset,
      extractBoundingBoxes,
    };
    let method1 = 'createDatasetFromUpload';

    if (!Utils.isNullOrEmpty(newVersionDatasetId)) {
      obj1.datasetId = newVersionDatasetId;
      method1 = 'createDatasetVersionFromUpload';
    }

    this.callApi_(method1, obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addDatasetVersion = (dataset_id: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId: dataset_id,
    };

    this.callApi_(
      'createDatasetVersionFromUpload',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  snapshotStreamingData = (dataset_id: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId: dataset_id,
    };

    this.callApi_(
      'snapshotStreamingData',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  import_dataset = (
    isDocumentset: boolean,
    name: string,
    fileFormat: string,
    location: string,
    projectId: any,
    datasetType: string,
    refreshSchedule: string,
    tableName: string,
    csvDelimiter: string,
    filenameColumn: string,
    startPrefix: string,
    untilPrefix: string,
    locationDateFormat,
    dateFormatLookbackDays,
    incremental,
    mergeFileSchemas,
    extractBoundingBoxes,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId: projectId,
      datasetType: datasetType,
      name,
      location,
      refreshSchedule,
      tableName,
      fileFormat,
      datasetTableName: tableName,
      csvDelimiter,
      filenameColumn,
      startPrefix,
      untilPrefix,
      locationDateFormat,
      dateFormatLookbackDays,
      incremental,
      isDocumentset,
      mergeFileSchemas,
      extractBoundingBoxes,
    };

    this.callApi_('createDatasetFromFileConnector', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  importDatasetVersion = (dataset_id: any, location: string, fileFormat: string, csvDelimiter: string, mergeFileSchemas: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId: dataset_id,
      location,
      fileFormat,
      csvDelimiter,
      mergeFileSchemas,
    };

    this.callApi_(
      'createDatasetVersionFromFileConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  importDatasetVersionFromDatabaseConnector = (dataset_id: any, objectName: string, columns: string, queryArguments: string, sqlQuery: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId: dataset_id,
      objectName,
      columns,
      queryArguments,
      sqlQuery,
    };

    this.callApi_(
      'createDatasetVersionFromDatabaseConnector',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  completeUpload = (datasetUploadId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetUploadId,
    };

    this.callApi_('completeUpload', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  cancelUpload = (uploadId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      uploadId,
    };

    this.callApi_(
      'cancelUpload',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  markUploadComplete = (uploadId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      uploadId,
    };

    this.callApi_('markUploadComplete', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createAccount = (name: string, email: string, password: string, recaptchaToken: string, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      email,
      password,
      recaptchaToken: recaptchaToken || '',
      signupToken,
      amznMarketplaceToken,
    };

    this.callApi_('_createAccount', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getUser = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('getUser', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteInvite = (userInviteId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      userInviteId,
    };

    this.callApi_(
      '_deleteInvite',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  inviteUser = (email: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      email,
    };

    this.callApi_('addUserToOrganization', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setUserAsAdmin = (email: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      email,
    };

    this.callApi_('setUserAsAdmin', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listUserInvites = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listUserInvites', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeUserFromOrganization = (email: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      email,
    };

    this.callApi_(
      'removeUserFromOrganization',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  removeConcatenationConfig = (featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
    };

    this.callApi_('removeConcatenationConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  concatenateFeatureGroupData = (featureGroupId: string, sourceFeatureGroupId: string, mergeType: string, afterTimestamp: number, skipMaterialize: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      sourceFeatureGroupId,
      mergeType,
      afterTimestamp,
      skipMaterialize,
    };

    this.callApi_('concatenateFeatureGroupData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listOrganizationUsers = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listOrganizationUsers', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getFeatureGroupVersionExportDownloadUrl = (featureGroupExportId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupExportId,
    };

    this.callApi_(
      'getFeatureGroupVersionExportDownloadUrl',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  acceptInvite = (email: string, organizationId: string, userInviteId: string, name: string, password: string, userInviteSecret: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      email,
      organizationId,
      userInviteId,
      name,
      password,
      userInviteSecret,
    };

    this.callApi_('_acceptInvite', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  acceptInviteLoggedIn = (userInviteToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      userInviteToken,
    };

    this.callApi_('_acceptInviteExistingUser', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _googleSignIn = (googleToken: any, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      googleToken,
      signupToken,
      amznMarketplaceToken,
    };

    this.callApi_('_googleSignIn', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _githubSignIn = (githubToken: any, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      githubToken,
      signupToken,
      amznMarketplaceToken,
    };

    this.callApi_('_githubSignIn', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _oktaSignin = (oktaToken: any, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      oktaToken,
      signupToken,
      amznMarketplaceToken,
    };

    this.callApi_('_oktaSignIn', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _azureSignIn = (azureToken: any, signupToken: string, amznMarketplaceToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      azureToken,
      signupToken,
      amznMarketplaceToken,
    };

    this.callApi_('_azureSignIn', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _genericEndpoint = (endpoint: string, obj: any, cbFinish: (err: any, res: any) => void) => {
    this.callApi_(endpoint, obj, function (err, res) {
      cbFinish(err, res);
    });
  };

  _signIn = (email: string, password: string, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      email,
      password,
      recaptchaToken: recaptchaToken || '',
    };

    this.callApi_('_signIn', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  unsubscribe = (email: string, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      email,
      recaptchaToken: recaptchaToken || '',
    };

    this.callApi_('_unsubscribe', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _resetPassword = (userId: string, requestToken: string, password: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      userId,
      requestToken,
      password,
    };

    this.callApi_('_resetPassword', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _resetPasswordRequest = (email: any, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      email,
      recaptchaToken: recaptchaToken || '',
    };

    this.callApi_('_resetPasswordRequest', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _signOut = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_signOut', obj1, function (err, res) {
      cbFinish(err, res);
    });
    // let signOutUrl = '/sign_out';
    // if (email) {
    //   signOutUrl += '?email=' + encodeURIComponent(email);
    // }
    // window.location.href = signOutUrl;
  };

  _verifyAccount = (userId: string, verificationToken: string, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      userId,
      verificationToken,
      recaptchaToken: recaptchaToken || '',
    };

    this.callApi_('_verifyAccount', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _resendVerification = (userId: string, recaptchaToken: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      userId,
      recaptchaToken: recaptchaToken || '',
    };

    this.callApi_('_resendVerification', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  joinOrganization = (organizationId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationId,
    };

    this.callApi_('_joinOrganization', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createPlaceholderOrganization = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_createPlaceholderOrganization', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _selectActiveOrganization = (organizationId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      organizationId,
    };

    this.callApi_('_selectActiveOrganization', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listOrganizations = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listOrganizations', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getDeploymentConfigOptions = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('_getDeploymentConfigOptions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getModelPredictionConfigOptions = (modelId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
    };

    this.callApi_('_getModelPredictionConfigOptions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setDeploymentConfig = (deploymentId: string, config: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      config,
    };

    this.callApi_('_setDeploymentConfig', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setDeploymentFeatureGroupExportFileConnectorOutput = (deploymentId: string, fileFormat: string, outputLocation: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      fileFormat,
      outputLocation,
    };

    this.callApi_('setDeploymentFeatureGroupExportFileConnectorOutput', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setDeploymentFeatureGroupExportDatabaseConnectorOutput = (
    deploymentId: string,
    databaseConnectorId: string,
    objectName: string,
    writeMode: string,
    databaseFeatureMapping: any,
    idColumn: string,
    additionalIdColumns: any,
    cbFinish: (err: any, res: any) => void,
  ) => {
    if (additionalIdColumns != null && _.isArray(additionalIdColumns) && additionalIdColumns?.length === 0) {
      additionalIdColumns = null;
    }

    if (writeMode?.toUpperCase() === 'INSERT') {
      additionalIdColumns = null;
      idColumn = null;
    }

    let obj1: any = {
      deploymentId,
      databaseConnectorId,
      objectName,
      writeMode,
      databaseFeatureMapping,
      idColumn,
      additionalIdColumns,
    };

    this.callApi_('setDeploymentFeatureGroupExportDatabaseConnectorOutput', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeDeploymentFeatureGroupExportOutput = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('removeDeploymentFeatureGroupExportOutput', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createOrganization = (name: string, workspace: string, discoverable: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      workspace,
      discoverable,
    };

    this.callApi_('_createOrganization', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getFeatureGroupVersionMetricsSchema = (featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion,
    };

    this.callApi_('_getFeatureGroupVersionMetricsSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getFeatureGroupVersionMetricsData = (
    projectId: string,
    featureGroupVersion: string,
    fromRow: number,
    toRow: number,
    fromCol: number,
    toCol: number,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId,
      featureGroupVersion,
      fromRow,
      toRow,
      fromCol,
      toCol,
      selectedColumns: selectedColumns == null ? null : JSON.stringify(selectedColumns),
      excludeIgnoredColumns: selectedColumnsNonIgnored,
    };

    this.callApi_('_getFeatureGroupVersionMetricsData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_dataset_metrics = (
    project_id: string,
    dataset_id: string,
    batchPredId,
    modelVersion,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    selectedColumns,
    selectedColumnsNonIgnored,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      fromRow: from_row,
      toRow: to_row,
      fromCol: from_col,
      toCol: to_col,
      batchPredictionId: batchPredId,
      modelVersion,
      selectedColumns: selectedColumns == null ? null : JSON.stringify(selectedColumns),
      excludeIgnoredColumns: selectedColumnsNonIgnored,
    };

    this.callApi_('_getDatasetMetrics', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_dataset_metrics_schema = (project_id: string, dataset_id: string, batchPredId, modelVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      batchPredictionId: batchPredId,
      modelVersion,
    };

    this.callApi_('_getDatasetMetricsSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_dataset_metrics_version = (
    project_id: string,
    dataset_id: string,
    batchPredId,
    modelVersion,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    selectedColumns,
    selectedColumnsNonIgnored,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      fromRow: from_row,
      toRow: to_row,
      fromCol: from_col,
      toCol: to_col,
      batchPredictionId: batchPredId,
      datasetVersion: modelVersion,
      selectedColumns: selectedColumns == null ? null : JSON.stringify(selectedColumns),
      excludeIgnoredColumns: selectedColumnsNonIgnored,
    };

    this.callApi_('_getDatasetVersionMetrics', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_dataset_metrics_schema_version = (project_id: string, dataset_id: string, batchPredId, modelVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      batchPredictionId: batchPredId,
      datasetVersion: modelVersion,
    };

    this.callApi_('_getDatasetMetricsVersionSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getFeatureGroupVersionData = (
    project_id: string,
    featureGroupId: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn: string,
    isAscending: boolean,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress: (bytes: number, total: number) => void = null,
  ) => {
    let obj1: any = {
      projectId: project_id,
      fromRow: from_row,
      toRow: to_row,
      fromCol: from_col,
      toCol: to_col,
      featureGroupVersion,
      columnFilters: column_filters == null ? null : JSON.stringify(column_filters),
      sql,
      orderByColumn,
      isAscending,
      selectedColumns: selectedColumns == null ? null : JSON.stringify(selectedColumns),
      excludeIgnoredColumns: selectedColumnsNonIgnored,
      prioritizeFeatureMappedColumns: prioritizeFeatureMappedColumns,
    };

    this.callApi_(
      '_getFeatureGroupVersionData',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { progress, ignoreRepeated: true },
    );
  };

  _getFeatureGroupData = (
    project_id: string,
    featureGroupId: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress: (bytes: number, total: number) => void = null,
  ) => {
    let obj1: any = {
      projectId: project_id,
      featureGroupId,
      fromRow: from_row,
      toRow: to_row,
      fromCol: from_col,
      toCol: to_col,
      columnFilters: column_filters == null ? null : JSON.stringify(column_filters),
      sql,
      orderByColumn,
      isAscending,
      selectedColumns: selectedColumns == null ? null : JSON.stringify(selectedColumns),
      excludeIgnoredColumns: selectedColumnsNonIgnored,
      prioritizeFeatureMappedColumns: prioritizeFeatureMappedColumns,
    };

    this.callApi_(
      '_getFeatureGroupData',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { progress },
    );
  };

  _getFeatureGroupVersionData = (
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    validateOnly: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      featureGroupVersion,
      fromRow: from_row,
      toRow: to_row,
      fromCol: from_col,
      toCol: to_col,
      columnFilters: column_filters == null ? null : JSON.stringify(column_filters),
      sql,
      orderByColumn,
      isAscending,
      selectedColumns: selectedColumns == null ? null : JSON.stringify(selectedColumns),
      excludeIgnoredColumns: selectedColumnsNonIgnored,
      validateOnly,
      prioritizeFeatureMappedColumns: prioritizeFeatureMappedColumns,
    };

    this.callApi_('_getFeatureGroupVersionData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_dataset_data = (
    project_id: string,
    dataset_id: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress: (bytes: number, total: number) => void = null,
  ) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      fromRow: from_row,
      toRow: to_row,
      fromCol: from_col,
      toCol: to_col,
      columnFilters: column_filters == null ? null : JSON.stringify(column_filters),
      sql,
      orderByColumn,
      isAscending,
      selectedColumns: selectedColumns == null ? null : JSON.stringify(selectedColumns),
      excludeIgnoredColumns: selectedColumnsNonIgnored,
    };

    this.callApi_(
      '_getDataFromDataset',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { progress },
    );
  };

  get_dataset_data_version = (
    project_id: string,
    dataset_id: string,
    featureGroupVersion: string,
    from_row: number,
    to_row: number,
    from_col: number,
    to_col: number,
    column_filters: any,
    sql: string,
    orderByColumn,
    isAscending,
    selectedColumns: string[],
    selectedColumnsNonIgnored: boolean,
    prioritizeFeatureMappedColumns: boolean,
    cbFinish: (err: any, res: any) => void,
    progress: (bytes: number, total: number) => void = null,
  ) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      fromRow: from_row,
      toRow: to_row,
      fromCol: from_col,
      toCol: to_col,
      columnFilters: column_filters == null ? null : JSON.stringify(column_filters),
      sql,
      orderByColumn,
      isAscending,
      selectedColumns: selectedColumns == null ? null : JSON.stringify(selectedColumns),
      excludeIgnoredColumns: selectedColumnsNonIgnored,
    };

    this.callApi_(
      '_getDataFromDatasetVersion',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { progress },
    );
  };

  _getDeploymentBatchPredictionInfo = (deploymentId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('_getDeploymentBatchPredictionInfo', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_metrics_data = (project_id: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
    };

    this.callApi_('_getMetricsData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createDeploymentWebhook = (deploymentId: string, endpoint: string, webhookEventType: EWebhookEventType, payloadTemplate: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      endpoint,
      webhookEventType,
      payloadTemplate,
    };

    this.callApi_('createDeploymentWebhook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listDeploymentWebhooks = (deploymentId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('listDeploymentWebhooks', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeWebhook = (webhookId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      webhookId,
    };

    this.callApi_('describeWebhook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateWebhook = (webhookId: string, endpoint: string, webhookEventType: EWebhookEventType, payloadTemplate: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      webhookId,
      endpoint,
      webhookEventType,
      payloadTemplate,
    };

    this.callApi_('updateWebhook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteWebhook = (webhookId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      webhookId,
    };

    this.callApi_('deleteWebhook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  queryFeatureGroupExplorer = (featureGroupVersion, message, chatHistory, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupVersion,
      message,
      chatHistory: chatHistory == null ? null : JSON.stringify(chatHistory),
    };

    this.callApi_('queryFeatureGroupExplorer', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  queryFeatureGroupCodeGenerator = (query: string, language: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      query,
      language,
      projectId,
    };

    this.callApi_('queryFeatureGroupCodeGenerator', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createChatSession = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('createChatSession', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listChatSessions = (mostRecentPerProject: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      mostRecentPerProject,
    };

    this.callApi_(
      'listChatSessions',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  sendChatMessage = (chatSessionId: string, message: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      chatSessionId,
      message,
    };

    this.callApi_('sendChatMessage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getChatSession = (chatSessionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      chatSessionId,
    };

    this.callApi_(
      'getChatSession',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  _hideChatSession = (chatSessionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      chatSessionId,
    };

    this.callApi_('_hideChatSession', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createDeploymentConversation = (deploymentId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      name,
    };

    this.callApi_(
      'createDeploymentConversation',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  getDeploymentConversation = (deploymentConversationId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentConversationId,
    };

    this.callApi_(
      'getDeploymentConversation',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  listDeploymentConversations = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_(
      'listDeploymentConversations',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'GET' },
    );
  };

  deleteDeploymentConversation = (deploymentConversationId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentConversationId,
    };

    this.callApi_(
      'deleteDeploymentConversation',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  setDeploymentConversationFeedback = (deploymentConversationId: string, messageIndex: number, isUseful: boolean, isNotUseful: boolean, feedback: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentConversationId,
      messageIndex,
      isUseful,
      isNotUseful,
      feedback,
    };

    this.callApi_(
      'setDeploymentConversationFeedback',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'POST' },
    );
  };

  createAgent = (projectId: string, functionSourceCode: string, agentFunctionName: string, name: string, memory: number, packageRequirements: any[], description: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      functionSourceCode,
      agentFunctionName,
      name,
      memory,
      packageRequirements,
      description,
    };

    this.callApi_('createAgent', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateAgent = (modelId: string, functionSourceCode: string, agentFunctionName: string, memory: number, packageRequirements: any[], description: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelId,
      functionSourceCode,
      agentFunctionName,
      memory,
      packageRequirements,
      description,
    };

    this.callApi_('updateAgent', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createPythonFunction = (
    name: string,
    sourceCode: string,
    functionName: string,
    functionVariableMappings: any[],
    projectId: string,
    packageRequirements: string[],
    functionType: PythonFunctionTypeParam,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      name,
      sourceCode,
      functionName,
      ...(functionVariableMappings && { functionVariableMappings: JSON.stringify(functionVariableMappings) }),
      projectId,
      packageRequirements,
      functionType,
    };

    this.callApi_('createPythonFunction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPythonFunctionCodeTemplate = (functionName: string, inputVariables: any[], templateType: string, cbFinish: (err: any, res: any) => void) => {
    const payload = {
      functionName,
      ...(inputVariables && { inputVariables: JSON.stringify(inputVariables) }),
      templateType,
    };

    this.callApi_('_getPythonFunctionCodeTemplate', payload, function (err, res) {
      cbFinish(err, res);
    });
  };

  describePythonFunction = (name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };

    this.callApi_('describePythonFunction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updatePythonFunction = (name: string, sourceCode: string, functionName: string, functionVariableMappings: { name?; variable_type? }[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      sourceCode,
      functionName,
      functionVariableMappings: functionVariableMappings == null ? null : JSON.stringify(functionVariableMappings),
    };

    this.callApi_('updatePythonFunction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listPythonFunctions = (functionType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      functionType,
    };

    this.callApi_('listPythonFunctions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listPipelines = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('listPipelines', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describePipeline = (pipelineId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineId,
    };

    this.callApi_('describePipeline', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describePipelineVersion = (pipelineVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineVersion,
    };

    this.callApi_('describePipelineVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listPipelineVersions = (pipelineId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineId,
    };

    this.callApi_('listPipelineVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createPipeline = (pipelineName: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineName,
      projectId,
    };

    this.callApi_('createPipeline', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deletePipeline = (pipelineId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineId,
    };

    this.callApi_('deletePipeline', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  runPipeline = (pipelineId: string, pipelineVariableMappings: any[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineId,
      pipelineVariableMappings: JSON.stringify(pipelineVariableMappings),
    };
    this.callApi_('runPipeline', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updatePipeline = (pipelineId: string, pipelineVariableMappings: any[], cron: string, isProd: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineId,
      pipelineVariableMappings: JSON.stringify(pipelineVariableMappings),
      cron,
      isProd,
    };
    this.callApi_('updatePipeline', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  resumePipelineRefreshSchedule = (pipelineId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineId,
    };
    this.callApi_('resumePipelineRefreshSchedule', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  pausePipelineRefreshSchedule = (pipelineId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineId,
    };
    this.callApi_('pausePipelineRefreshSchedule', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  unsetPipelineRefreshSchedule = (pipelineId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      pipelineId,
    };
    this.callApi_('unsetPipelineRefreshSchedule', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPythonArguments = (functionName: any, sourceCode: string, cbFinish: (err: any, res: any) => void) => {
    const obj1: any = {
      functionName,
      sourceCode,
    };

    this.callApi_('_getPythonArguments', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deletePythonFunction = (name: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };

    this.callApi_('deletePythonFunction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listPythonFunctionFeatureGroups = (name: string, limit: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      limit,
    };

    this.callApi_('listPythonFunctionFeatureGroups', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createCustomLossFunctionNotebook = (name: string, lossFunctionType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      lossFunctionType,
    };

    this.callApi_('_createCustomLossFunctionNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeCustomLossFunction = (name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };

    this.callApi_('describeCustomLossFunction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listCustomLossFunctions = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listCustomLossFunctions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteCustomLossFunction = (name: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };

    this.callApi_('deleteCustomLossFunction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listAvailableLossTypes = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listAvailableLossTypes', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createCustomMetricNotebook = (name: string, problemType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      problemType,
    };

    this.callApi_('_createCustomMetricNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeCustomMetric = (name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };

    this.callApi_(
      'describeCustomMetric',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  listCustomMetrics = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listCustomMetrics', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteCustomMetric = (name: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };

    this.callApi_('deleteCustomMetric', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listSupportedCustomMetricProblemTypes = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listSupportedCustomMetricProblemTypes', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeModule = (name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };
    this.callApi_('describeModule', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listModules = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('listModules', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteModule = (name: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };

    this.callApi_('deleteModule', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createModule = (name: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
    };

    this.callApi_('createModule', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getModelMonitorSummary = (modelMonitorId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId: modelMonitorId,
    };

    this.callApi_('getModelMonitorSummary', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getSSOClientIds = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_getSSOClientIds', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPredictionMetricDataByPredictionMetricVersion = (predictionMetricVersion: string, actualValue: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      predictionMetricVersion,
      actualValuesToDetail: actualValue == null ? null : JSON.stringify([actualValue]),
    };

    this.callApi_('_getPredictionMetricDataByPredictionMetricVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  modelMonitorVersionMetricData = (modelMonitorVersion: string, metricType: string, actualValue: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
      metricType,
      actualValuesToDetail: actualValue == null ? null : JSON.stringify([actualValue]),
    };

    this.callApi_('modelMonitorVersionMetricData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _createNotebook = (name: string, projectId: string, memory: number, useGpu: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      name,
      projectId,
      useGpu,
      memory,
    };

    this.callApi_('_createNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _renameNotebook = (notebookId: string, name: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
      name,
    };

    this.callApi_('_renameNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _attachNotebookToProject = (notebookId: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
      projectId,
    };

    this.callApi_('_attachNotebookToProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _removeNotebookFromProject = (notebookId: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
      projectId,
    };

    this.callApi_('_removeNotebookFromProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deleteNotebook = (notebookId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
    };

    this.callApi_('_deleteNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _describeNotebook = (notebookId: string, cbFinish: (err: any, res: any) => void, forceCheckOrg = false, subpath?: string) => {
    let obj1: any = {
      notebookId,
      subpath,
    };

    this.callApi_(
      '_describeNotebook',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: !forceCheckOrg },
    );
  };

  _setNotebookUsesGpu = (notebookId: string, useGpu: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
      useGpu,
    };

    this.callApi_('_setNotebookUsesGpu', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setNotebookMemory = (notebookId: string, memory: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
      memory,
    };

    this.callApi_('_setNotebookMemory', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addAnnotation = (
    annotation: { annotationType?: string; annotationValue?: any },
    featureGroupId: string,
    featureName: string,
    docId: string,
    document: string,
    featureGroupAnnotationKeyValue: string,
    featureGroupRowIdentifier: any,
    annotationSource: 'upload' | 'ui',
    status: string,
    comments: any,
    projectId: string,
    saveMetadata: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      annotation: annotation == null ? null : JSON.stringify(annotation),
      featureGroupId,
      featureName,
      document,
      docId,
      featureGroupAnnotationKeyValue,
      featureGroupRowIdentifier,
      annotationSource,
      status,
      comments,
      projectId,
      saveMetadata,
    };

    this.callApi_('addAnnotation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addAnnotatableFeature = (featureGroupId: string, name: string, annotationType: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      name,
      annotationType,
      projectId,
    };

    this.callApi_('addAnnotatableFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addFeatureGroupAnnotationLabels = (featureGroupId: string, labelNames: string[], annotationType: string, labelDefinition: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      labelNames: labelNames == null ? null : JSON.stringify(labelNames),
      annotationType,
      labelDefinition,
      projectId,
    };

    this.callApi_('addFeatureGroupAnnotationLabels', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  addFeatureGroupAnnotationLabel = (featureGroupId: string, labelName: string, annotationType: string, labelDefinition: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      labelName,
      annotationType,
      labelDefinition,
      projectId,
    };

    this.callApi_('addFeatureGroupAnnotationLabel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  importAnnotationLabels = (featureGroupId: string, file: any, annotationType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      file,
      annotationType,
    };

    this.callApi_('importAnnotationLabels', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  removeFeatureGroupAnnotationLabel = (featureGroupId: string, labelName: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      labelName,
      projectId,
    };

    this.callApi_('removeFeatureGroupAnnotationLabel', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setFeatureAsAnnotatableFeature = (featureGroupId: string, featureName: string, annotationType: string, featureGroupRowIdentifierFeature: string, docIdFeature: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureName,
      annotationType,
      featureGroupRowIdentifierFeature,
      docIdFeature,
      projectId,
    };

    this.callApi_('setFeatureAsAnnotatableFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setAnnotationStatusFeature = (featureGroupId: string, featureName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureName,
    };

    this.callApi_('setAnnotationStatusFeature', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeAnnotation = (featureGroupId: string, featureName: string, docId: string, featureGroupAnnotationKeyValue: string, featureGroupRowIdentifier: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureName,
      docId,
      featureGroupAnnotationKeyValue,
      featureGroupRowIdentifier,
    };

    this.callApi_('describeAnnotation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  verifyAndDescribeAnnotation = (featureGroupId: string, featureName: string, docId: string, featureGroupAnnotationKeyValue: string, featureGroupRowIdentifier: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureName,
      docId,
      featureGroupAnnotationKeyValue,
      featureGroupRowIdentifier,
    };

    this.callApi_('verifyAndDescribeAnnotation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getDocumentToAnnotate = (featureGroupId: string, featureName: string, featureGroupRowIdentifier: string, getPrevious: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureName,
      featureGroupRowIdentifier,
      getPrevious,
    };

    this.callApi_('getDocumentToAnnotate', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getAnnotationsStatus = (featureGroupId: string, featureName: string, checkForMaterialization: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureName,
      checkForMaterialization,
    };

    this.callApi_('getAnnotationsStatus', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateAnnotationStatus = (featureGroupId: string, featureName: string, status: string, docId: string, featureGroupRowIdentifier: any, saveMetadata: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureName,
      status,
      docId,
      featureGroupRowIdentifier,
      saveMetadata,
    };

    this.callApi_('updateAnnotationStatus', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getProcessedAnnotation = (annotationType: string, annotationValue: any, document: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      annotationType,
      annotationValue,
      document,
    };
    this.callApi_('_getProcessedAnnotation', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listAnnotationFeatureGroupRowIds = (featureGroupId: string, featureName: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureName,
    };
    this.callApi_('_listAnnotationFeatureGroupRowIds', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _starModelMonitor = (modelMonitorId: string, starred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
      starred,
    };

    this.callApi_('_starModelMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getModelMonitorChartFromOrganization = (chartType: string, limit: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      chartType,
      limit,
    };

    this.callApi_('getModelMonitorChartFromOrganization', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listOrganizationModelMonitors = (onlyStarred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      onlyStarred,
    };

    this.callApi_('listOrganizationModelMonitors', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getModelMonitorSummaryFromOrganization = (lookbackDays: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      lookbackDays,
    };

    this.callApi_('getModelMonitorSummaryFromOrganization', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listNotebooks = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_listNotebooks', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _startNotebook = (notebookId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
    };

    this.callApi_('_startNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _stopNotebook = (notebookId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      notebookId,
    };

    this.callApi_('_stopNotebook', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createMonitorAlert = (projectId: string, modelMonitorId: string, alertName: string, conditionConfig: any, actionConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      modelMonitorId,
      alertName,
      conditionConfig: conditionConfig == null ? null : JSON.stringify(conditionConfig),
      actionConfig: actionConfig == null ? null : JSON.stringify(actionConfig),
    };

    this.callApi_('createMonitorAlert', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  updateMonitorAlert = (monitorAlertId: string, alertName: string, conditionConfig: any, actionConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      monitorAlertId,
      alertName,
      conditionConfig: conditionConfig == null ? null : JSON.stringify(conditionConfig),
      actionConfig: actionConfig == null ? null : JSON.stringify(actionConfig),
    };

    this.callApi_('updateMonitorAlert', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeMonitorAlert = (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      monitorAlertId,
    };

    this.callApi_('describeMonitorAlert', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeMonitorAlertVersion = (monitorAlertVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      monitorAlertVersion,
    };

    this.callApi_('describeMonitorAlertVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  runMonitorAlert = (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      monitorAlertId,
    };

    this.callApi_('runMonitorAlert', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listMonitorAlertsForMonitor = (modelMonitorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
    };

    this.callApi_('listMonitorAlertsForMonitor', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listMonitorAlertVersionsForMonitorVersion = (modelMonitorVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorVersion,
    };

    this.callApi_('listMonitorAlertVersionsForMonitorVersion', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteMonitorAlert = (monitorAlertId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      monitorAlertId,
    };

    this.callApi_('deleteMonitorAlert', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listModelMonitorAlerts = (modelMonitorId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
    };

    this.callApi_('_listModelMonitorAlerts', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _generateImage = (deploymentId: string, queryData: any, extraParams: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      queryData: queryData == null ? null : JSON.stringify(queryData),
    };

    obj1 = _.assign(obj1, extraParams || {});

    this.callApi_('_generateImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _transferStyle = (deploymentId: string, sourceImage: any, styleImage: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      sourceImage,
      styleImage,
    };

    this.callApi_('_transferStyle', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _modifyImageUsingText = (deploymentId: string, queryData: string, sourceImage: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      queryData,
      sourceImage,
    };

    this.callApi_('_modifyImageUsingText', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setModelMonitorAlertConfig = (modelMonitorId: string, name, alertConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelMonitorId,
      alertName: name,
      alertConfig: alertConfig == null ? null : JSON.stringify(alertConfig),
    };

    this.callApi_('_setModelMonitorAlert', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getValidProjectFeatureGroupUses = (isUserModifiable: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      isUserModifiable,
    };

    this.callApi_('_getValidFeatureGroupUses', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listTestData = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('_listTestData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  predict = (auth_token: string, deployment_id: string, data: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentToken: auth_token,
      deploymentId: deployment_id,
      data: data,
    };

    this.callApi_(
      'predict',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { timeoutSecs: 20 * 60 },
    );
  };

  predictForUseCase = (methodName: string, explainPredictions: boolean, dataField: string, auth_token: string, deployment_id: string, data: string, cbFinish: (err: any, res: any) => void) => {
    let queryDataS;
    if (methodName == null || methodName === '') {
      methodName = 'predict';
      queryDataS = 'data';
    } else {
      queryDataS = 'queryData';
    }
    if (!Utils.isNullOrEmpty(dataField)) {
      queryDataS = dataField;
    }

    let obj1: any = {
      deploymentToken: auth_token,
      deploymentId: deployment_id,
      [queryDataS]: data,
    };

    if (explainPredictions) {
      obj1.explainPredictions = true;
    }

    this.callApi_(
      methodName ?? '__',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { timeoutSecs: 20 * 60 },
    );
  };

  _predictForUI = (deployment_id: string, dataParams: object, extraParams: any, requestId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId: deployment_id,
      requestId,
    };
    obj1 = _.assign(obj1, extraParams || {});

    obj1 = _.assign({}, obj1, dataParams || {});

    this.callApi_(
      '_predictForUI',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { timeoutSecs: 20 * 60 },
    );
  };

  _predictForUI_predictClass = (deployment_id: string, dataParams: object, extraParams: any, requestId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId: deployment_id,
      requestId,
    };
    obj1 = _.assign(obj1, extraParams || {});

    obj1 = _.assign({}, obj1, dataParams || {});

    this.callApi_(
      '_predictClass',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { timeoutSecs: 20 * 60 },
    );
  };

  classifyImage = (deploymentId: string, blob: any, extraParams: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      image: blob,
    };
    obj1 = _.assign(obj1, extraParams || {});

    this.callApi_('classifyImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _predictForUI_binaryData = (deploymentId: string, blob: any, blobKeyName: string, extraParams: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      blob,
      blobKeyName,
    };
    obj1 = _.assign(obj1, extraParams || {});

    this.callApi_('_predictWithBinaryData', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeImage = (deploymentToken: string, deploymentId: string, image: any, categories: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentToken,
      deploymentId,
      image,
      categories,
    };

    this.callApi_('describeImage', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  uploadFile = (url: string, file: any, contentType: string, cbProgress: (progress: number, percent: number) => void, cbFinish: (err: any, res: any) => void) => {
    axios
      .put(url, file, {
        headers: {
          'Content-Type': contentType,
        },
        onUploadProgress: function (progressEvent) {
          let percentCompleted = (progressEvent.loaded * 100) / (progressEvent.total || 1);
          cbProgress && cbProgress(progressEvent.loaded, percentCompleted);
        },
      })
      .then(() => {
        cbFinish && cbFinish(null, null);
      })
      .catch((err) => {
        cbFinish && cbFinish('' + err, null);
      });
  };

  get_test_datas_by_project = (project_id: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
    };

    this.callApi_('_listProjectDatasetLatestVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _userAuthMobileQR = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_userAuthMobileQR', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_models_by_project = (project_id: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
    };

    this.callApi_('listModels', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  gql = (query: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      query: query,
    };

    this.callApi_(
      null,
      obj1,
      function (err, res) {
        if (!err && res) {
          if (_.isUndefined(res.success)) {
            res.success = true;
          }
          res = {
            success: res.success,
            data: res.data,
          };
        }

        cbFinish(err, res);
      },
      'gql',
    );
  };

  getPredictionSchema = (modelVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
    };

    this.callApi_('getPredictionSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _batchPredictFromIds = (deploymentId: string, name: string, outputFormat: string, inputIds: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
      name,
      outputFormat,
      inputIds,
    };

    this.callApi_('_batchPredictFromIds', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createBatchPrediction = (
    deployment_id: string,
    tableName: string,
    name: string,
    globalPredictionArgs: string,
    explanations: boolean,
    outputFormat: string,
    outputLocation: string,
    databaseConnectorId: string,
    databaseOutputConfig: object,
    refresh_schedule: string,
    csvInputPrefix: string,
    csvPredictionPrefix: string,
    csvExplanationsPrefix: string,
    featureGroupOverrides: any,
    datasetIdRemap: any,
    resultInputColumns: string[],
    outputIncludesMetadata: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      deploymentId: deployment_id,
      tableName,
      name,
      globalPredictionArgs,
      explanations,
      outputFormat,
      outputLocation,
      databaseConnectorId,
      databaseOutputConfig,
      refresh_schedule,
      csvInputPrefix,
      csvPredictionPrefix,
      csvExplanationsPrefix,
      featureGroupOverrides,
      datasetIdRemap,
      outputIncludesMetadata,
      resultInputColumns: resultInputColumns == null ? null : JSON.stringify(resultInputColumns),
    };

    this.callApi_('createBatchPrediction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  startBatchPrediction = (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
    };

    this.callApi_('startBatchPrediction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getBatchPredictionResult = (batchPredictionVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionVersion,
    };

    this.callApi_(
      'getBatchPredictionResult',
      obj1,
      function (err, res) {
        cbFinish?.(err, res);
      },
      undefined,
      { changeURL: true, changeURLNewWindow: true },
    );
  };

  getBatchPredictionConnectorErrors = (batchPredictionVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionVersion,
    };

    this.callApi_(
      'getBatchPredictionConnectorErrors',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { skipJson: true },
    );
  };

  setBatchPredictionDatasetRemap = (batchPredictionId: string, datasetIdRemap: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
      datasetIdRemap,
    };

    this.callApi_(
      'setBatchPredictionDatasetRemap',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { queue: true },
    );
  };

  exportModelArtifactAsFeatureGroup = (modelVersion: string, tableName: string, artifactType: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
      tableName,
      artifactType,
    };

    this.callApi_('exportModelArtifactAsFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listBatchPredictions = (projectId: string, deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      deploymentId,
    };

    this.callApi_('listBatchPredictions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getPredictionSchema = (deploymentId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      deploymentId,
    };

    this.callApi_('_getPredictionSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getFeatureGroupExportConnectorErrors = (featureGroupExportId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupExportId,
    };

    this.callApi_('getFeatureGroupExportConnectorErrors', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listBatchPredictionVersions = (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
    };

    this.callApi_('listBatchPredictionVersions', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeBatchPredictionVersion = (batchPredictionVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionVersion,
    };

    this.callApi_(
      'describeBatchPredictionVersion',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  updateBatchPrediction = (
    batchPredictionId: string,
    deploymentId: string,
    globalPredictionArgs: any,
    explanations: boolean,
    outputFormat: string,
    csvInputPrefix: string,
    csvPredictionPrefix: string,
    csvExplanationsPrefix: string,
    parallelismOverride: number,
    outputIncludesMetadata: boolean,
    resultInputColumns: string[],
    name: string,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      batchPredictionId,
      deploymentId,
      globalPredictionArgs,
      explanations,
      outputFormat,
      csvInputPrefix,
      csvPredictionPrefix,
      csvExplanationsPrefix,
      parallelismOverride,
      outputIncludesMetadata,
      resultInputColumns: resultInputColumns == null ? null : JSON.stringify(resultInputColumns),
      name,
    };

    this.callApi_('updateBatchPrediction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  createAlgorithm = (
    name: string,
    problemType: string,
    sourceCode: string,
    trainingDataParameterNamesMapping: any,
    trainingConfigParameterName: string,
    trainFunctionName: string,
    predictFunctionName: string,
    predictManyFunctionName: string,
    initializeFunctionName: string,
    configOptions: any,
    isDefaultEnabled: boolean,
    projectId: string,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      name,
      problemType,
      sourceCode,
      trainingDataParameterNamesMapping,
      trainingConfigParameterName,
      trainFunctionName,
      predictFunctionName,
      predictManyFunctionName,
      initializeFunctionName,
      configOptions: configOptions == null ? null : JSON.stringify(configOptions),
      isDefaultEnabled,
      projectId,
    };

    this.callApi_('createAlgorithm', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteAlgorithm = (algorithm: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      algorithm,
    };

    this.callApi_('deleteAlgorithm', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  describeAlgorithm = (algorithm: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      algorithm,
    };

    this.callApi_(
      'describeAlgorithm',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  updateAlgorithm = (
    algorithm: string,
    sourceCode: string,
    trainingDataParameterNamesMapping: any,
    trainingConfigParameterName: string,
    trainFunctionName: string,
    predictFunctionName: string,
    predictManyFunctionName: string,
    initializeFunctionName: string,
    configOptions: any,
    isDefaultEnabled: boolean,
    cbFinish: (err: any, res: any) => void,
  ) => {
    let obj1: any = {
      algorithm,
      sourceCode,
      trainingDataParameterNamesMapping,
      trainingConfigParameterName,
      trainFunctionName,
      predictFunctionName,
      predictManyFunctionName,
      initializeFunctionName,
      configOptions: configOptions == null ? null : JSON.stringify(configOptions),
      isDefaultEnabled,
    };

    this.callApi_('updateAlgorithm', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listAlgorithms = (problemType: string, projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      problemType,
      projectId,
    };

    this.callApi_('listAlgorithms', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  listBuiltinAlgorithms = (projectId: string, featureGroupIds: string[], trainingConfig: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupIds: featureGroupIds == null ? [] : featureGroupIds,
      trainingConfig: JSON.stringify(trainingConfig),
    };

    this.callApi_('listBuiltinAlgorithms', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listPretrainedModelAlgorithms = (useCase: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      useCase,
    };

    this.callApi_('_listPretrainedModelAlgorithms', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setBatchPredictionFileConnectorOutput = (batchPredictionId: string, outputFormat: string, outputLocation: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
      outputFormat,
      outputLocation,
    };

    this.callApi_('setBatchPredictionFileConnectorOutput', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setBatchPredictionOutputToConsole = (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
    };

    this.callApi_('setBatchPredictionOutputToConsole', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setBatchPredictionDatabaseConnectorOutput = (batchPredictionId: string, databaseConnectorId: string, databaseOutputConfig: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
      databaseConnectorId,
      databaseOutputConfig,
    };

    this.callApi_('setBatchPredictionDatabaseConnectorOutput', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setBatchPredictionDataset = (batchPredictionId: string, datasetType: string, datasetId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
      datasetType,
      datasetId,
    };

    this.callApi_('setBatchPredictionDataset', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setBatchPredictionFeatureGroup = (batchPredictionId: string, datasetType: string, featureGroupId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
      datasetType,
      featureGroupId,
    };

    this.callApi_('setBatchPredictionFeatureGroup', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  deleteBatchPrediction = (batchPredictionId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionId,
    };

    this.callApi_('deleteBatchPrediction', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  batchPredictionFromUpload = (globalPredictionArgs: any, deploymentId, name, explanations, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      globalPredictionArgs: globalPredictionArgs == null ? null : JSON.stringify(globalPredictionArgs),
      deploymentId,
      name,
      explanations,
    };

    this.callApi_('batchPredictionFromUpload', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _start2faPush = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_start2faPush', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _start2faSMS = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_start2faSMS', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _enable2fa = (countryCode, phone, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      phone,
      countryCode,
    };

    this.callApi_('_enable2fa', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _disable2fa = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_disable2fa', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _checkChallengeStatus = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_checkChallengeStatus', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _validate2faToken = (token, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      token,
    };

    this.callApi_('_validate2faToken', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _cancelDatasetUpload = (datasetVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetVersion,
    };

    this.callApi_(
      '_cancelDatasetUpload',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { method: 'DELETE' },
    );
  };

  _requestReminderEmail = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_requestReminderEmail', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listProjectsDashboard = (updatedFilter: number, limit: number, sinceProjectId: string, search: string, isStarred: boolean, tag: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      updatedFilter,
      limit,
      sinceProjectId,
      search,
      starred: isStarred,
      tag,
    };

    this.callApi_('_listProjectsDashboard', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listProjectsTags = (sinceProjectId: string, search: string, isStarred: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      sinceProjectId,
      search,
      starred: isStarred,
    };

    this.callApi_('_listProjectsTags', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getProblemTypeCustomModelInfo = (problemType: string, projectId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      problemType,
    };

    this.callApi_('_getProblemTypeCustomModelInfo', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _describeProject = (projectId: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_(
      '_describeProject',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  _getFeatureGroupCustomColPreview = (featureGroupId, colName, selectExpression, fromRow, toRow, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      colName,
      selectExpression,
      fromRow,
      toRow,
    };

    this.callApi_('_getFeatureGroupCustomColPreview', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getSQLPreviewData = (featureGroupName: string, sql: string, fromRow: number, toRow: number, fromCol: number, toCol: number, validateOnly: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      sql,
      fromRow,
      toRow,
      fromCol,
      toCol,
      featureGroupName,
      validateOnly,
    };
    //_createSQLPreviewDataRequest //TODO
    // _getSQLPreviewData
    this.callApi_('_createSQLPreviewDataRequest', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _validateSQL = (project_id: string, dataset_id: string, expressionType, filterType, sql: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      sql,
      expressionType,
      filterType,
    };

    this.callApi_('_validateSQL', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _isExplainableProject = (projectId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
    };

    this.callApi_('_isExplainableProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getFeatureGroupSchema = (projectId: string, featureGroupId: string, modelVersion: string, featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId,
      featureGroupId,
      modelVersion,
      featureGroupVersion,
    };

    this.callApi_('_getFeatureGroupSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _exportModelVersionSchema = (datasetId: string, featureGroupId: string, modelVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId,
      featureGroupId,
      modelVersion,
    };

    this.callApi_(
      '_exportModelVersionSchema',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { changeURL: true },
    );
  };

  _exportFeatureGroupSchema = (project_id: string, feature_group_id: string, modelVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      featureGroupId: feature_group_id,
      modelVersion,
    };

    this.callApi_(
      '_exportFeatureGroupSchema',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { changeURL: true },
    );
  };

  _createDataserverDeployment = (driverMemory, numExecutors, executorMemory, deploymentLifePeriod, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      driverMemory,
      numExecutors,
      executorMemory,
      deploymentLifePeriod,
    };

    this.callApi_('_createDataserverDeployment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getDataserverDeployment = (dataserverSessionId, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      dataserverSessionId,
    };

    this.callApi_('_getDataserverDeployment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _listDataserverDeployments = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_listDataserverDeployments', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _deleteDataserverDeployment = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_deleteDataserverDeployment', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getModelBlueprint = (modelVersion: string, algorithm: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      modelVersion,
      algorithm,
    };

    this.callApi_('_getModelBlueprint', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _importFeatureGroupSchema = (project_id: string, feature_group_id: string, schema: File, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      featureGroupId: feature_group_id,
      schema,
    };

    this.callApi_('_importFeatureGroupSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_project_dataset_data_use = (project_id: string, dataset_id: string, batch_prediction_id: string, modelVersion, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      batchPredictionId: batch_prediction_id,
      modelVersion,
    };

    this.callApi_('_getSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_dataset_schema = (dataset_id: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetId: dataset_id,
    };

    this.callApi_('_getDatasetSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  get_dataset_schema_version = (dataset_version: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetVersion: dataset_version,
    };

    this.callApi_('_getDatasetVersionSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  validateProjectDatasets = (project_id: string, featureGroupIds: string[], cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      featureGroupIds: featureGroupIds == null ? null : JSON.stringify(featureGroupIds),
    };

    this.callApi_('_validateProject', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _resetProjectDatasetDetectedSchema = (project_id: string, dataset_id: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
    };

    this.callApi_('_resetDetectedSchema', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setProjectDatasetFeatureMappingIsInTransaction = 0;
  setProjectDatasetFeatureMappingList = [];
  setProjectDatasetFeatureMappingTimer = null;

  calcSetProjectDatasetColumnMappingIsInTransaction = () => {
    return this.setProjectDatasetFeatureMappingIsInTransaction;
  };

  setProjectDatasetColumnMapping = (isTransaction: boolean, project_id: string, dataset_id: string, column: string, featureMapping: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      column,
      columnMapping: featureMapping,

      cbFinish,
      isTransaction,
    };

    if (isTransaction) {
      this.setProjectDatasetFeatureMappingIsInTransaction++;
    }

    this.setProjectDatasetFeatureMappingList.push(obj1);

    let doWork = () => {
      if (this.setProjectDatasetFeatureMappingList.length === 0) {
        this.setProjectDatasetFeatureMappingTimer = null;
        return;
      }

      let obj2 = this.setProjectDatasetFeatureMappingList.shift();
      let cbFinish2 = obj2.cbFinish;
      delete obj2.cbFinish;
      let isTransaction2 = obj2.isTransaction;
      delete obj2.isTransaction;
      let $this = this;

      this.callApi_('_setColumnMapping', obj2, function (err, res) {
        if (isTransaction2) {
          $this.setProjectDatasetFeatureMappingIsInTransaction--;
        }

        cbFinish2(err, res);

        doWork();
      });
    };

    if (this.setProjectDatasetFeatureMappingTimer == null) {
      this.setProjectDatasetFeatureMappingTimer = setTimeout(() => {
        doWork();
      }, 0);
    }
  };

  setProjectDatasetColumnMappingUsingQueue = (project_id: string, dataset_id: string, column: string, featureMapping: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      column,
      featureMapping,
    };

    this.callApi_(
      '_setColumnMapping',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      { queue: true },
    );
  };

  setProjectDatasetColumnDataType = (project_id: string, dataset_id: string, column: string, dataType: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      column,
      dataType,
    };

    this.callApi_('_setColumnDataType', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setColumnDataType = (project_id: string, dataset_id: string, column: string, dataType: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      column,
      dataType,
    };

    this.callApi_('setColumnDataType', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  setProjectDatasetDataUsage = (project_id: string, dataset_id: string, columnOverrides: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      columnOverrides,
    };

    this.callApi_('setProjectDatasetColumnTypes', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getProjectWizardState = (project_id: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
    };

    this.callApi_('_getProjectWizardState', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setProjectWizardState = (project_id: string, values: object, cbFinish: (err: any, res: any) => void) => {
    let valuesFinal: any = values;
    if (valuesFinal != null && !_.isString(valuesFinal)) {
      valuesFinal = JSON.stringify(valuesFinal);
    }

    let obj1: any = {
      projectId: project_id,
      values: valuesFinal,
    };

    this.callApi_('_setProjectWizardState', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  alertsMarkAsReadById = (alertId: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      alertId,
    };

    this.callApi_('_markAlertAsRead', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  alertsMarkAllRead = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_('_markAllAlertsAsRead', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  getUserAlerts = (unreadOnly: boolean, since: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      unreadOnly,
      since,
    };

    this.callApi_('_getUserAlerts', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getSampleApiCode = (methodName: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      method: methodName,
    };

    this.callApi_('_getSampleApiCode', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _setUIWizardState = (project_id: string, dataset_id: string, ui_action: string, is_clear: boolean, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      uiAction: ui_action,
      isClear: is_clear,
    };

    this.callApi_('_setUIWizardState', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getBatchPredictionRow = (batchPredictionVersion: string, row: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionVersion,
      row,
    };

    this.callApi_('_getBatchPredictionRow', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getBatchPredictionRows = (batchPredictionVersion: string, rows: number, startAfter: number, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      batchPredictionVersion,
      rows,
      startAfter,
    };

    this.callApi_('_getBatchPredictionRows', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _getUIWizardState = (project_id: string, dataset_id: string, ui_action: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      projectId: project_id,
      datasetId: dataset_id,
      uiAction: ui_action,
    };

    this.callApi_('_getUIWizardState', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  _requestHelp = (detail: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      detail,
    };

    this.callApi_('_requestHelp', obj1, function (err, res) {
      cbFinish(err, res);
    });
  };

  helptextsDownload = (cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {};

    this.callApi_(
      '_getHelptexts',
      obj1,
      function (err, res) {
        res = Utils.tryJsonParse(res?.result);
        cbFinish(err, res);
      },
      undefined,
      { ignoreOrgChange: true },
    );
  };

  createNaturalLanguageExplanationRequest = (featureGroupId: string, featureGroupVersion: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      featureGroupId,
      featureGroupVersion,
    };
    this.callApi_(
      'createNaturalLanguageExplanationRequest',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  getNaturalLanguageExplanationRequestStatus = (requestId: bigint, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      requestId,
    };
    this.callApi_(
      'getNaturalLanguageExplanationRequestStatus',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  createAIChatSendMessageRequest = (chatSessionId: string, message: string, url: string, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      chatSessionId,
      message,
      url,
    };
    this.callApi_(
      'createAIChatSendMessageRequest',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  getAIChatSendMessageRequestStatus = (requestId: bigint, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      requestId,
    };
    this.callApi_(
      'getAIChatSendMessageRequestStatus',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  cancelAIChatSendMessageRequest = (requestId: bigint, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      requestId,
    };
    this.callApi_(
      'cancelAIChatSendMessageRequest',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      'wsp',
      { doNotSendExtraHeader: true },
    );
  };

  //
  queueByUrlTimer = {};
  queueByUrl = {};

  ignoreRepeatParams = {};
  ignoreRepeatRes = {};
  ignoreRepeatTimer = {};

  callApi_ = (queryUrl?: string, postBody?, cbFinish?, callType?, options?: ICallApiOptions) => {
    if (options?.ignoreRepeated === true || (options?.ignoreRepeated != null && _.isNumber(options?.ignoreRepeated) && (options?.ignoreRepeated as number) > 0)) {
      if (cbFinish) {
        let time1 = 250;
        if (_.isNumber(options?.ignoreRepeated)) {
          time1 = options?.ignoreRepeated as number;
        }

        const cb1 = cbFinish;
        const doTimerIgnoreRepeat = () => {
          if (this.ignoreRepeatTimer[queryUrl]) {
            clearTimeout(this.ignoreRepeatTimer[queryUrl]);
            this.ignoreRepeatTimer[queryUrl] = null;
          }

          this.ignoreRepeatTimer[queryUrl] = setTimeout(() => {
            delete this.ignoreRepeatTimer[queryUrl];

            delete this.ignoreRepeatParams[queryUrl];
            delete this.ignoreRepeatRes[queryUrl];
          }, time1);
        };

        let newParams = { postBody, callType };

        if (this.ignoreRepeatRes[queryUrl] != null) {
          //check params
          let anyDiffParam = false;

          let oldParams = this.ignoreRepeatParams[queryUrl];
          if (oldParams != null && !_.isEmpty(oldParams)) {
            let kk = Object.keys(oldParams);
            kk.some((k1) => {
              if (!_.isEqual(oldParams[k1], newParams[k1])) {
                anyDiffParam = true;
                return true;
              }
            });
          }

          if (!anyDiffParam) {
            cb1?.(...this.ignoreRepeatRes[queryUrl]);

            doTimerIgnoreRepeat();
            return;
          }
        }

        this.ignoreRepeatParams[queryUrl] = this.ignoreRepeatParams[queryUrl] ?? {};
        this.ignoreRepeatParams[queryUrl] = { ...this.ignoreRepeatParams[queryUrl], ...newParams };

        let cbFinishNew = (...pp) => {
          this.ignoreRepeatRes[queryUrl] = pp;
          cb1?.(...pp);

          doTimerIgnoreRepeat();
        };
        cbFinish = cbFinishNew;
      }
    }

    if (options?.queue === true) {
      this.queueByUrl[queryUrl] = this.queueByUrl[queryUrl] ?? [];
      let qq = this.queueByUrl[queryUrl];

      let options2 = options == null ? null : { ...options };
      if (options2 != null) {
        delete options2.queue;
      }

      const doWork = (queryUrl) => {
        let qq = this.queueByUrl[queryUrl];
        if (qq.length > 0) {
          let q1 = qq[0];
          q1?.(q1);
        }
      };

      let cbFinishNew = (q1, err, res) => {
        let qq = this.queueByUrl[queryUrl];
        qq = qq.filter((v1) => v1 !== q1);
        this.queueByUrl[queryUrl] = qq;

        let isLast = qq == null || qq.length === 0;

        cbFinish?.(err, res, isLast);

        this.queueByUrlTimer[queryUrl] = setTimeout(() => {
          this.queueByUrlTimer[queryUrl] = null;

          doWork(queryUrl);
        }, 30);
      };
      let call2 = (q1) => this.callApiInt_.bind(this, queryUrl, postBody, cbFinishNew.bind(this, q1), callType, options2);
      qq.push((q1) => {
        call2(q1)();
      });

      if (qq.length === 1) {
        doWork(queryUrl);
      }
      return;
    }

    this.callApiInt_(queryUrl, postBody, cbFinish, callType, options);
  };

  private callApiInt_ = (queryUrl?: string, postBody?, cbFinish?, callType?, options?: ICallApiOptions) => {
    if ((queryUrl == null || queryUrl === '') && postBody && _.isObject(postBody) && postBody.action != null) {
      queryUrl = postBody.action;
      delete postBody.action;
    }

    let url = options?.forceUrl === true ? queryUrl : this.calcUrl_(queryUrl, callType);

    if (options?.changeURL === true) {
      if (postBody != null) {
        let kk = Object.keys(postBody);
        if (kk.length > 0) {
          url += '?';
        }
        let isFirst = true;
        kk.some((k1, k1ind) => {
          if (!Utils.isNullOrEmpty(postBody[k1])) {
            url += (isFirst ? '' : '&') + '' + k1 + '=' + encodeURIComponent(postBody[k1]);
            isFirst = false;
          }
        });
      }

      if (options?.changeURLNewWindow === true) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
      cbFinish?.(null, { success: true });
      return;
    }

    if (postBody == null) {
      postBody = {};
    }

    postBody = this.serializeObj_(postBody, callType, options?.method);

    let obj: any = {
      type: (options ? options.method : null) || 'POST',
      url: url,
      data: postBody,
      headers: options?.doNotSendExtraHeader
        ? {}
        : {
            'REAI-UI': 1,
          },
      // converters: {
      //   'text abacus': function(result) {
      //     let res = Utils.tryJsonParse(result);
      //     if(res==null && result!=null) {
      //
      //     }
      //     return res;
      //   }
      // },
      dataType: options?.dataType ?? 'text',
      contentType: options?.contentType,

      crossDomain: true,

      success: function (data, textStatus, request) {
        if (data === '') {
          data = null;
        }
        if (options?.skipJson === true) {
          cbFinish(null, data);
          return;
        }
        if (data != null) {
          if (_.isString(data)) {
            data = Utils.tryJsonParse(data);
            if (data == null) {
              let headerPart = request?.getResponseHeader('x-request-id');
              if (headerPart == null) {
                headerPart = '';
              } else {
                headerPart = 'ReqId: ' + headerPart;
              }

              Sentry.captureMessage('JSON INVALID: link:' + url + ' host:' + window.location?.host + ' status:' + textStatus + ' ' + headerPart, 'error');

              cbFinish(Constants.errorDefault, null);
              // obj.error(undefined, Constants.errorDefault || 'Invalid JSON', undefined);
              return;
            }
          } else {
            if (_.isObject(data) && (options?.dataType != null || options?.contentType != null)) {
              //
            } else {
              data = null;
            }
          }
        }

        if (data && data.needLogin && !options?.ignoreNeedLogin) {
          const isActualDevCenter = window.location.pathname ? startsWithInt(window.location.pathname, '/' + PartsLink.devCenter) : false;
          if (!isActualDevCenter) {
            REActions.needLogin();
          }
        } else if (data && data.requires2fa) {
          REActions.initiateTwoFactorAuthentication();
          return;
        } else if (data && !options?.ignoreOrgChange && !Utils.isNullOrEmpty(data.orgHint) && !Utils.isNullOrEmpty(data.organizationName)) {
          REActions.showOrgHint(data.orgHint, data.organizationName);
        }

        const anyError = request?.getResponseHeader('ANY-ERROR');
        const actualOrgName = request?.getResponseHeader('ORG-NAME');

        if (anyError != null && actualOrgName != null) {
          if (window['anyError'] !== !!anyError || window['actualOrgName'] != actualOrgName) {
            window['anyError'] = !!anyError;
            window['actualOrgName'] = actualOrgName;

            REActions.orgAnyError();
          }
        }

        let isUndef = data && _.isUndefined(data.success);
        if (isUndef && options && options.successEqualTrue) {
          isUndef = false;
        }
        if (data && (data.success === true || isUndef)) {
          cbFinish(null, data || []);
        } else if (data) {
          cbFinish(data.error || data.reason || Constants.errorDefault, data);
        } else {
          cbFinish(Constants.errorDefault, null);
        }
      },
      error: function (request, textStatus, errorThrown) {
        let statusCode = request?.status;
        if (statusCode === 500) {
          try {
            let headerPart = request?.getResponseHeader('x-request-id');
            if (headerPart == null) {
              headerPart = '';
            } else {
              headerPart = 'ReqId: ' + headerPart;
            }

            Sentry.captureMessage('url:' + url + ' host:' + window.location?.host + ' status:' + textStatus + ' ' + headerPart, 'error');
            if (errorThrown) {
              Sentry.captureException(errorThrown);
            }
          } catch (e) {
            Utils.error(e);
          }
        }
        let errMsg = errorThrown || textStatus;
        if (errMsg) {
          Utils.error(errMsg);
        }
        cbFinish(errorThrown || textStatus || Constants.errorDefault, null, request);
      },
    };

    if (options) {
      if (options.extraHeaders != null && _.isObject(options.extraHeaders)) {
        obj.headers = _.assign({}, obj.headers ?? {}, options.extraHeaders ?? {});
      }
      if (options.timeoutSecs != null) {
        obj.timeout = options.timeoutSecs * 1000;
      }
    }

    if (callType === 'gql') {
      obj = _.assign(obj, {
        contentType: 'application/json',
        // dataType: 'json',
      });
    } else {
      if (options?.method?.toLowerCase() !== 'get') {
        obj.processData = false;
      }
      obj.contentType = options?.contentType ?? false;
    }

    if (options && (options.progress || options.progressUpload)) {
      obj.xhr = function () {
        let xhr = new window.XMLHttpRequest();
        if (options && options.progress) {
          xhr.addEventListener(
            'progress',
            function (evt) {
              options.progress(evt.loaded, evt.lengthComputable ? evt.total : null);
            },
            false,
          );
        }
        if (options && options.progressUpload) {
          xhr.upload.addEventListener(
            'progress',
            function (evt) {
              if (evt.lengthComputable) {
                options.progressUpload(evt.loaded, evt.total);
              }
            },
            false,
          );
        }
        return xhr;
      };
    }

    if (callType === 'wsp' || callType === 'ws') {
      obj.xhrFields = { withCredentials: true };
    }
    $.ajax(obj);
  };

  private serializeObj_ = (obj?, postBody?, method?) => {
    if (_.isString(obj)) {
      return obj;
    }

    if (method?.toLowerCase() === 'get') {
      return obj;
    }

    if (_.isObject(obj)) {
      if (postBody === 'gql') {
        return JSON.stringify(obj);
      } else {
        if (_.isEmpty(obj)) {
          return null;
        } else {
          let formData = new FormData();
          let kk = Object.keys(obj);
          kk &&
            kk.some((k1) => {
              let v1 = obj[k1];
              if (v1 != null) {
                formData.append(k1, v1);
              }
            });

          return formData;
        }
      }
    }

    return null;
  };
}

export default REClient_;
