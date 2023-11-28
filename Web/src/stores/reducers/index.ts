import { combineReducers } from '@reduxjs/toolkit';
import alerts from './alerts';
import algorithms from './algorithms';
import applicationConnectorOptions from './applicationConnectorOptions';
import applicationConnectors from './applicationConnectors';
import authUser from './authUser';
import batchPred from './batchPred';
import chat from './chat';
import customLossFunctions from './customLossFunctions';
import customMetrics from './customMetrics';
import customds from './customds';
import databaseConnectorObjectSchema from './databaseConnectorObjectSchema';
import databaseConnectorObjects from './databaseConnectorObjects';
import databaseConnectorOptions from './databaseConnectorOptions';
import databaseConnectors from './databaseConnectors';
import datasets from './datasets';
import datasetCompare from './datasetsCompare';
import defDatasets from './defDatasets';
import defaultDeploymentName from './defaultDeploymentName';
import defaultModelName from './defaultModelName';
import deployments from './deployments';
import deploymentsCode from './deploymentsCode';
import deploymentsTokens from './deploymentsTokens';
import devcenter from './devcenter';
import docs from './docs';
import eda from './eda';
import featureGroups from './featureGroups';
import fileConnectorOptions from './fileConnectorOptions';
import fileConnectors from './fileConnectors';
import help from './help';
import metrics from './metrics';
import models from './models';
import modules from './modules';
import monitoring from './monitoring';
import navParams from './navParams';
import notebooks from './notebooks';
import paramsProp from './paramsProp';
import pipelines from './pipelines';
import predictionMetrics from './predictionMetrics';
import projectDatasets from './projectDatasets';
import projects from './projects';
import projectsSamples from './projectsSamples';
import pythonFunctions from './pythonFunctions';
import requests from './requests';
import schemaPredictions from './schemaPredictions';
import storageBrowser from './storageBrowser';
import streamTokens from './streamTokens';
import streamingConnectorOptions from './streamingConnectorOptions';
import streamingConnectors from './streamingConnectors';
import templates from './templates';
import trainingOptions from './trainingOptions';
import useCases from './useCases';
import webhooks from './webhooks';

const rootReducer = combineReducers({
  paramsProp,
  authUser,
  docs,
  useCases,
  defDatasets,
  storageBrowser,
  projects,
  algorithms,
  datasetCompare,
  datasets,
  models,
  projectDatasets,
  projectsSamples,
  deployments,
  deploymentsTokens,
  schemaPredictions,
  deploymentsCode,
  trainingOptions,
  help,
  alerts,
  batchPred,
  defaultModelName,
  defaultDeploymentName,
  streamTokens,
  metrics,
  devcenter,
  navParams,
  fileConnectors,
  databaseConnectors,
  databaseConnectorOptions,
  fileConnectorOptions,
  applicationConnectors,
  applicationConnectorOptions,
  streamingConnectors,
  streamingConnectorOptions,
  databaseConnectorObjects,
  databaseConnectorObjectSchema,
  featureGroups,
  modules,
  monitoring,
  eda,
  requests,
  predictionMetrics,
  customds,
  templates,
  notebooks,
  webhooks,
  pythonFunctions,
  customLossFunctions,
  customMetrics,
  chat,
  pipelines,
});

export default rootReducer;
