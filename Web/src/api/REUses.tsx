import _ from 'lodash';
import * as moment from 'moment';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../core/Utils';
import StoreActions from '../stores/actions/StoreActions';
import algorithms from '../stores/reducers/algorithms';
import batchPred from '../stores/reducers/batchPred';
import customds from '../stores/reducers/customds';
import datasets from '../stores/reducers/datasets';
import deployments from '../stores/reducers/deployments';
import featureGroups from '../stores/reducers/featureGroups';
import models from '../stores/reducers/models';
import pipelines from '../stores/reducers/pipelines';
import projects, { memProjectById, memProjectsList } from '../stores/reducers/projects';
import templates from '../stores/reducers/templates';
import useCases, { memUseCases, memUseCasesSchemasInfo } from '../stores/reducers/useCases';
import REClient_ from './REClient';

import objectHash from 'object-hash';
import { useContext } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import { calcSchemaForFeature } from '../components/FeaturesOneAdd/FeatureType';
import { IWebhookId } from '../components/WebhookList/WebhookIdHelpers';
import authUser from '../stores/reducers/authUser';
import customLossFunctions from '../stores/reducers/customLossFunctions';
import customMetrics from '../stores/reducers/customMetrics';
import eda from '../stores/reducers/eda';
import modules from '../stores/reducers/modules';
import monitoring from '../stores/reducers/monitoring';
import notebooks from '../stores/reducers/notebooks';
import pythonFunctions, { PythonFunctionTypeParam } from '../stores/reducers/pythonFunctions';
import webhooks from '../stores/reducers/webhooks';
import { calcDocStoreDefFromFeatureGroup, calcDocStoreDefFromProject, DocStoreDefForcedVision, IDocStoreDef } from './DocStoreInterfaces';

export function useBlocker(blocker, when = true) {
  const { navigator } = useContext(NavigationContext);

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!when) return;

    // @ts-ignore
    const unblock = navigator.block((tx) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();

          setTimeout(() => {
            forceUpdate();
          }, 0);
        },
      };

      blocker(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, blocker, when, ignored]);
}

export function usePrompt(message, when = true, allowSamePathname = true) {
  const blocker = useCallback(
    (tx) => {
      if (allowSamePathname === true && tx?.location?.pathname === window.location.pathname) {
        tx.retry();
        return;
      }

      if (window.confirm(message)) {
        tx.retry();
      }
    },
    [message, allowSamePathname],
  );

  useBlocker(blocker, when);
}

export function useProjectIdNormalized(projectId?: string) {
  if (Utils.isNullOrEmpty(projectId) || projectId === '-') {
    return null;
  }
  return useNormalizedId(projectId);
}

export function useDeploymentsForProject(projectId?: string) {
  const { deploymentsParam } = useSelector((state: any) => ({
    deploymentsParam: state.deployments,
  }));

  const projectIdUse = useProjectIdNormalized(projectId);

  useEffect(() => {
    deployments.memDeployForProject(true, undefined, projectIdUse);
  }, [projectIdUse, deploymentsParam]);
  const list = useMemo(() => {
    return deployments.memDeployForProject(false, undefined, projectIdUse);
  }, [projectIdUse, deploymentsParam]);

  return list;
}

export function useDeployment(projectId?: string, deployId?: string) {
  const projectIdUse = useProjectIdNormalized(projectId);
  const deployIdUse = useNormalizedId(deployId);

  const list = useDeploymentsForProject(projectIdUse);

  const res = useMemo(() => {
    return list?.find((d1) => d1?.deploymentId === deployIdUse);
  }, [list, deployIdUse]);

  return res;
}

export function useNormalizedIdArray(list, allowEmptyString = true) {
  if (list == null) {
    return null;
  } else if (_.isArray(list)) {
    list = list.map((s1) => useNormalizedId(s1)).filter((v1) => v1 != null);
    if (!allowEmptyString) {
      list = list.filter((s1) => !Utils.isNullOrEmpty(s1));
    }
    if (list.length === 0) {
      return null;
    } else {
      return list;
    }
  } else {
    return null;
  }
}

export function useNormalizedJSONhash(values: any) {
  if (values == null) {
    return null;
  } else {
    return objectHash(values);
  }
}

export function useNormalizedId(id, allowArray = false, allowObject = false) {
  if (id == null) {
    return null;
  } else if (Utils.isNullOrEmpty(id)) {
    return null;
  } else if (_.isString(id) || _.isNumber(id) || _.isBoolean(id)) {
    return id;
  } else if (_.isArray(id)) {
    if (allowArray) {
      return id;
    } else {
      return null;
    }
  } else if (_.isObject(id)) {
    if (allowObject) {
      return id;
    } else {
      return null;
    }
  } else {
    return id;
  }
}

export function useModelMonitorVersions(modelMonitorId?: string) {
  const { monitoringParam } = useSelector((state: any) => ({
    monitoringParam: state.monitoring,
  }));

  const modelMonitorIdUse = useNormalizedId(modelMonitorId);

  useEffect(() => {
    monitoring.memModelVersionsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorVersionsOne = useMemo(() => {
    return monitoring.memModelVersionsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);

  return monitorVersionsOne;
}

export function useMonitorsEvents(monitorAlertVersion?: string) {
  const { monitoringParam } = useSelector((state: any) => ({
    monitoringParam: state.monitoring,
  }));

  const monitorAlertVersionUse = useNormalizedId(monitorAlertVersion);

  useEffect(() => {
    monitoring.memEventsByAlertVersion(true, monitorAlertVersionUse);
  }, [monitorAlertVersionUse, monitoringParam]);
  const res = useMemo(() => {
    return monitoring.memEventsByAlertVersion(false, monitorAlertVersionUse);
  }, [monitorAlertVersionUse, monitoringParam]);

  return res;
}

export function useMonitorsAlertOne(monitorAlertId?: string) {
  const { monitoringParam } = useSelector((state: any) => ({
    monitoringParam: state.monitoring,
  }));

  const monitorAlertIdUse = useNormalizedId(monitorAlertId);

  useEffect(() => {
    monitoring.memAlertById(true, monitorAlertIdUse);
  }, [monitorAlertIdUse, monitoringParam]);
  const alertOne = useMemo(() => {
    return monitoring.memAlertById(false, monitorAlertIdUse);
  }, [monitorAlertIdUse, monitoringParam]);

  return alertOne;
}

export function useModelMonitor(modelMonitorId?: string) {
  const { monitoringParam } = useSelector((state: any) => ({
    monitoringParam: state.monitoring,
  }));

  const modelMonitorIdUse = useNormalizedId(modelMonitorId);

  useEffect(() => {
    monitoring.memModelsById(true, modelMonitorIdUse);
  }, [modelMonitorIdUse, monitoringParam]);
  const monitorOne = useMemo(() => {
    return monitoring.memModelsById(false, modelMonitorIdUse);
  }, [modelMonitorIdUse, monitoringParam]);

  return monitorOne;
}

export function useModel(modelId?: string) {
  const { modelsParam } = useSelector((state: any) => ({
    modelsParam: state.models,
  }));

  const modelIdUse = useNormalizedId(modelId);

  useEffect(() => {
    models.memModelById(true, undefined, modelIdUse);
  }, [modelsParam, modelIdUse]);
  const modelFound1 = useMemo(() => {
    return models.memModelById(false, undefined, modelIdUse);
  }, [modelsParam, modelIdUse]);

  return modelFound1;
}

export function useModelList(projectId?: string) {
  const { modelsParam } = useSelector((state: any) => ({
    modelsParam: state.models,
  }));

  const projectIdUse = useNormalizedId(projectId);

  useEffect(() => {
    models.memModelsListByProjectId(true, undefined, projectIdUse);
  }, [modelsParam, projectIdUse]);
  const res = useMemo(() => {
    return models.memModelsListByProjectId(true, undefined, projectIdUse);
  }, [modelsParam, projectIdUse]);

  return res;
}

export function useListAvailableProblemTypesForAlgorithms() {
  const { algorithmsParam } = useSelector((state: any) => ({
    algorithmsParam: state.algorithms,
  }));

  useEffect(() => {
    algorithms.memProblemTypeAllowed(true);
  }, [algorithmsParam]);
  let list = useMemo(() => {
    return algorithms.memProblemTypeAllowed(false)?.map((s1) => s1?.toUpperCase());
  }, [algorithmsParam]);

  return list as string[];
}

export function useAlgorithm(name?: string) {
  const { algorithmsParam } = useSelector((state: any) => ({
    algorithmsParam: state.algorithms,
  }));

  const nameUse = useNormalizedId(name);

  useEffect(() => {
    algorithms.memAlgoById(true, nameUse);
  }, [algorithmsParam, nameUse]);
  const res = useMemo(() => {
    return algorithms.memAlgoById(false, nameUse);
  }, [algorithmsParam, nameUse]);

  return res;
}

export function useAlgorithmsAll(problemType?: string, projectId?: string) {
  const { algorithmsParam } = useSelector((state: any) => ({
    algorithmsParam: state.algorithms,
  }));

  const problemTypeUse = useNormalizedId(problemType?.toUpperCase());
  const projectIdUse = useProjectIdNormalized(projectId);

  useEffect(() => {
    algorithms.memListByProblemTypeId(true, problemTypeUse, projectIdUse);
  }, [algorithmsParam, problemTypeUse, projectIdUse]);
  const list = useMemo(() => {
    return algorithms.memListByProblemTypeId(false, problemTypeUse, projectIdUse);
  }, [algorithmsParam, problemTypeUse, projectIdUse]);

  return list;
}

export function useMonitorsAllOrg(onlyStarred?: boolean, filterInParam?: string, ignoredRefresh?) {
  const { monitoringParam } = useSelector((state: any) => ({
    monitoringParam: state.monitoring,
  }));

  const firstTime = useRef(true);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }

    StoreActions.listMonitoringModelsAll_(onlyStarred);
  }, [ignoredRefresh, onlyStarred]);

  useEffect(() => {
    monitoring.memModelsAll(true, onlyStarred);
  }, [monitoringParam, onlyStarred]);
  const res = useMemo(() => {
    return monitoring.memModelsAll(false, onlyStarred);
  }, [monitoringParam, onlyStarred]);

  const resFiltered = useMemo(() => {
    let rr = res;
    if (onlyStarred) {
      rr = rr?.filter((r1) => !!r1?.starred);
    }
    if (!Utils.isNullOrEmpty(filterInParam)) {
      let f1 = filterInParam?.toLowerCase();
      rr = rr?.filter((r1) => Utils.searchIsTextInside(r1?.name?.toLowerCase(), f1));
    }
    return rr;
  }, [res, filterInParam, onlyStarred]);

  return resFiltered;
}

export function useMonitorsAll(projectId?: string, forceProject = false) {
  const { monitoringParam } = useSelector((state: any) => ({
    monitoringParam: state.monitoring,
  }));

  const projectIdUse = useProjectIdNormalized(projectId);

  useEffect(() => {
    monitoring.memModelsByProjectId(true, projectIdUse);
  }, [monitoringParam, projectIdUse]);
  const res = useMemo(() => {
    return monitoring.memModelsByProjectId(false, projectIdUse);
  }, [monitoringParam, projectIdUse]);

  if (forceProject) {
    if (!projectIdUse || projectIdUse === '-') {
      return null;
    }
  }

  return res;
}

export function useNotebookMetadata(notebookId?: string) {
  // const { notebooksParam, } = useSelector((state: any) => ({
  //   notebooksParam: state.notebooks,
  // }));

  const notebookIdUse = useProjectIdNormalized(notebookId);
  const [res, setRes] = useState(undefined as { endpoint?: string; token?: string });

  useEffect(() => {
    if (!notebookIdUse) {
      setRes(null);
      return;
    }

    REClient_.client_()._getNotebookMetaserviceInfo(notebookIdUse, (err, res) => {
      if (err || res?.result == null) {
        setRes(null);
      } else {
        setRes(res?.result);
      }
    });
  }, [notebookIdUse]);

  return res;
}

export function useNotebook(notebookId?: string) {
  const { notebooksParam } = useSelector((state: any) => ({
    notebooksParam: state.notebooks,
  }));

  const notebookIdUse = useProjectIdNormalized(notebookId);

  useEffect(() => {
    notebooks.memNotebookById(true, notebookIdUse);
  }, [notebooksParam, notebookIdUse]);
  const notebookOne = useMemo(() => {
    return notebooks.memNotebookById(false, notebookIdUse);
  }, [notebooksParam, notebookIdUse]);

  return notebookOne;
}

export function useNotebookTemplateTypes() {
  const { notebooksParam } = useSelector((state: any) => ({
    notebooksParam: state.notebooks,
  }));

  useEffect(() => {
    notebooks.memNotebookTemplateTypes(true);
  }, [notebooksParam]);

  const notebookTemplateTypes = useMemo(() => {
    return notebooks.memNotebookTemplateTypes(false);
  }, [notebooksParam]);

  return notebookTemplateTypes;
}

export function useNotebookTemplates(templateType?: string) {
  const { notebooksParam } = useSelector((state: any) => ({
    notebooksParam: state.notebooks,
  }));

  useEffect(() => {
    notebooks.memNotebookTemplates(true, templateType);
  }, [notebooksParam, templateType]);

  const notebookTemplateTypes = useMemo(() => {
    return notebooks.memNotebookTemplates(false, templateType);
  }, [notebooksParam, templateType]);

  return notebookTemplateTypes;
}

export function useProblemTypesInfo() {
  const { useCasesParam } = useSelector((state: any) => ({
    useCasesParam: state.useCases,
  }));

  useEffect(() => {
    useCases.memListProblemTypes(true);
  }, [useCasesParam]);
  const res = useMemo(() => {
    return useCases.memListProblemTypes(false);
  }, [useCasesParam]);

  return res;
}

export function useDocStoreFromMonitor(useDocStoreFromMonitor?) {
  const docStoreDef = useMemo(() => {
    let isVisionDrift = useDocStoreFromMonitor?.monitorType?.toUpperCase() === 'VISION_DRIFT_MONITOR';
    if (isVisionDrift) {
      return DocStoreDefForcedVision;
    } else {
      return null;
    }
  }, [useDocStoreFromMonitor]);

  return docStoreDef as IDocStoreDef;
}

export function useDocStoreFromProject(projectOne?) {
  const docStoreDef = useMemo(() => {
    return calcDocStoreDefFromProject(projectOne);
  }, [projectOne]);

  return docStoreDef;
}

export function useDocStoreFromFeatureGroup(featureGroupOne?) {
  const docStoreDef = useMemo(() => {
    return calcDocStoreDefFromFeatureGroup(featureGroupOne);
  }, [featureGroupOne]);

  return docStoreDef;
}

export function useEdaGraphOne(graphDashboardId?: string, refreshId?: any) {
  const graphDashboardIdUse = useProjectIdNormalized(graphDashboardId);

  const [res, setRes] = useState(null);

  useEffect(() => {
    setRes(null);
  }, [graphDashboardId]);

  useEffect(() => {
    if (!graphDashboardId) {
      setRes(null);
      return;
    }

    setRes(null);
    REClient_.client_().describeGraphDashboard(graphDashboardId, (err, res) => {
      if (err || !res?.success) {
        setRes(null);
      } else {
        setRes(res?.result ?? null);
      }
    });
  }, [refreshId, graphDashboardIdUse]);

  return res;
}

export function useEdaOne(edaId?: string) {
  const { edaParam } = useSelector((state: any) => ({
    edaParam: state.eda,
  }));

  const edaIdUse = useProjectIdNormalized(edaId);

  useEffect(() => {
    eda.memEdaById(true, edaIdUse);
  }, [edaParam, edaIdUse]);
  const edaOne = useMemo(() => {
    return eda.memEdaById(false, edaIdUse);
  }, [edaParam, edaIdUse]);

  return edaOne;
}

export function useProject(projectId?: string) {
  const { projectsParam } = useSelector((state: any) => ({
    projectsParam: state.projects,
  }));

  const projectIdUse = useProjectIdNormalized(projectId);

  useEffect(() => {
    memProjectById(projectIdUse, true);
  }, [projectsParam, projectIdUse]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectIdUse, false);
  }, [projectsParam, projectIdUse]);

  return foundProject1;
}

export function useTemplateList(projectId?: string) {
  const { templatesParam } = useSelector((state: any) => ({
    templatesParam: state.templates,
  }));

  const projectIdUse = useProjectIdNormalized(projectId);

  useEffect(() => {
    templates.memListByProjectId(true, projectIdUse);
  }, [templatesParam, projectIdUse]);
  const list = useMemo(() => {
    return templates.memListByProjectId(false, projectIdUse);
  }, [templatesParam, projectIdUse]);

  return list;
}

export function useTemplate(featureGroupTemplateId?: string) {
  const { templatesParam } = useSelector((state: any) => ({
    templatesParam: state.templates,
  }));

  const featureGroupTemplateIdUse = useNormalizedId(featureGroupTemplateId);

  useEffect(() => {
    templates.memDetailById(true, featureGroupTemplateIdUse);
  }, [templatesParam, featureGroupTemplateIdUse]);
  const fgTemplate1 = useMemo(() => {
    return templates.memDetailById(false, featureGroupTemplateIdUse);
  }, [templatesParam, featureGroupTemplateIdUse]);

  return fgTemplate1;
}

export function useCustomModelInfo(projectId?: string, problemType?: string) {
  const { projectsParam } = useSelector((state: any) => ({
    projectsParam: state.projects,
  }));

  const projectIdUse = useProjectIdNormalized(projectId);
  const problemTypeUse = useNormalizedId(problemType);

  useEffect(() => {
    projects.memCustomModelInfo(true, undefined, problemTypeUse, projectIdUse);
  }, [projectsParam, projectIdUse, problemTypeUse]);
  const resCustomModelInfo: {
    predictFuncArgs?;
    predictFuncName?;
    predictFuncTemplate?;
    predictManyFuncName?;
    predictManyFuncTemplate?;
    problemType?;
    trainFuncArgs?;
    trainFuncName?;
    trainFuncTemplate?;
    trainingFuncInputMappingsTemplate?;
  } = useMemo(() => {
    return projects.memCustomModelInfo(false, undefined, problemTypeUse, projectIdUse);
  }, [projectsParam, projectIdUse, problemTypeUse]);

  return resCustomModelInfo;
}

export function useFeaturesForFeatureGroup(featureGroupOne?: any, filterMapping?: string) {
  const list = useMemo(() => {
    if (featureGroupOne == null) {
      return null;
    } else {
      let res = calcSchemaForFeature(featureGroupOne);

      if (res != null && filterMapping != null) {
        res = res?.filter((r1) => r1?.featureMapping?.toUpperCase() === filterMapping?.toUpperCase());
      }

      return res;
    }
  }, [featureGroupOne, filterMapping]);

  return list;
}

export function useFeatureGroupVersions(featureGroupId?: string) {
  const { featureGroupsParam } = useSelector((state: any) => ({
    featureGroupsParam: state.featureGroups,
  }));

  const featureGroupIdUse = useNormalizedId(featureGroupId);

  useEffect(() => {
    featureGroups.memFeatureGroupsVersionsForFeatureGroupId(true, featureGroupIdUse);
  }, [featureGroupsParam, featureGroupIdUse]);
  const featureGroupOne = useMemo(() => {
    return featureGroups.memFeatureGroupsVersionsForFeatureGroupId(false, featureGroupIdUse);
  }, [featureGroupsParam, featureGroupIdUse]);

  return featureGroupOne;
}

export function useFeatureGroup(projectId?: string, featureGroupId?: string) {
  const { featureGroupsParam } = useSelector((state: any) => ({
    featureGroupsParam: state.featureGroups,
  }));

  const projectIdUse = useProjectIdNormalized(projectId);
  const featureGroupIdUse = useNormalizedId(featureGroupId);

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, projectIdUse, featureGroupIdUse);
  }, [featureGroupsParam, featureGroupIdUse, projectIdUse]);
  const featureGroupOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, projectIdUse, featureGroupIdUse);
  }, [featureGroupsParam, featureGroupIdUse, projectIdUse]);

  return featureGroupOne;
}

export function useCDS() {
  const { customdsParam } = useSelector((state: any) => ({
    customdsParam: state.customds,
  }));

  useEffect(() => {
    customds.memThisDataserver(true);
  }, [customdsParam]);
  const cdsOne = useMemo(() => {
    return customds.memThisDataserver(false);
  }, [customdsParam]);

  return cdsOne;
}

export function useDataset(datasetId?: string) {
  const { datasetsParam } = useSelector((state: any) => ({
    datasetsParam: state.datasets,
  }));

  const datasetIdUse = useNormalizedId(datasetId);

  useEffect(() => {
    datasets.memDatasetListCall(true, datasetsParam, [datasetIdUse]);
  }, [datasetsParam, datasetIdUse]);
  const datasetOne = useMemo(() => {
    let res = datasets.memDatasetListCall(false, datasetsParam, [datasetIdUse]);
    if (res != null) {
      res = Object.values(res)?.[0];
    }
    return res;
  }, [datasetsParam, datasetIdUse]);

  return datasetOne as any;
}

export function useFeatureGroupFeaturesFromFG(featureGroupOne?: any) {
  let res = featureGroupOne?.features?.map((f1) => f1.name);
  if (res == null) {
    res = featureGroupOne?.projectFeatureGroupSchema?.schema?.map((f1) => f1.name);
  }
  return res;
}

export function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay], // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

export function useProjectsAll(refreshId?: any) {
  const { projectsParam } = useSelector((state: any) => ({
    projectsParam: state.projects,
  }));

  const firstTime = useRef(true);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }

    StoreActions.listProjectsAll_();
  }, [refreshId]);

  useEffect(() => {
    memProjectsList(true, projectsParam);
  }, [projectsParam]);
  const list = useMemo(() => {
    return memProjectsList(false, projectsParam);
  }, [projectsParam]);

  return list;
}

export function useFeatureGroupsAll(refreshId?: any) {
  const [list, setList] = useState(undefined);

  useEffect(() => {
    REClient_.client_().listFeatureGroups(9000, null, null, null, (err, res) => {
      let rr = res?.result;
      setList(
        rr?.sort((a, b) => {
          return (a?.tableName || '').toLowerCase().localeCompare((b?.tableName || '').toLowerCase());
        }) ?? null,
      );
    });
  }, [refreshId]);

  return list;
}

export function useEdaGraphsListAll(projectId?: string, refreshId?: any) {
  const [list, setList] = useState(undefined);

  useEffect(() => {
    REClient_.client_().listGraphDashboards(projectId, (err, res) => {
      let rr = res?.result;
      setList(rr ?? null);
    });
  }, [refreshId]);

  return list;
}

export function useApiKeysOrg(refreshId?: any) {
  const [list, setList] = useState(undefined);

  useEffect(() => {
    REClient_.client_().listApiKeys((err, res) => {
      let rr = res?.result?.map((a1) => a1?.apiKey)?.filter((v1) => !Utils.isNullOrEmpty(v1));
      setList(rr ?? null);
    });
  }, [refreshId]);

  return list;
}

let _datasetsAll = null;
let _datasetsAllDate = null;
const lastDatasetAll = () => {
  if (_datasetsAllDate == null || moment().isAfter(_datasetsAllDate.add('5', 'minutes'))) {
    return null;
  } else {
    return _datasetsAll;
  }
};
export function useDatasetsAll(refreshId?: any) {
  const [list, setList] = useState(() => {
    return lastDatasetAll();
  });

  const firstTime = useRef(true);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }

    doRefresh();
  }, [refreshId]);

  const doRefresh = () => {
    REClient_.client_().listDatasets(9999, null, null, (err, res) => {
      setList(res?.result ?? null);
    });
  };

  const alreadyCall = useRef(false);
  useEffect(() => {
    if (alreadyCall.current) {
      return;
    }
    alreadyCall.current = true;

    setList((list1) => {
      if (list1 == null) {
        doRefresh();
      }

      return list1;
    });
  }, []);

  return list;
}

export function useDeploymentBatchPredictionInfo(deployId: string) {
  const deployIdUse = useNormalizedId(deployId);

  const [value, setValue] = useState(null);

  useEffect(() => {
    if (deployIdUse) {
      REClient_.client_()._getDeploymentBatchPredictionInfo(deployIdUse, (err, res) => {
        setValue(res?.result ?? null);
      });
    }
  }, [deployIdUse]);

  return value as {
    batchInputs: {
      datasetIdRemap?: any;
      datasets?: any[];
      featureGroupDatasetIds?: string[];
      featureGroupDatasets?: {
        hasReplacementDataset?: boolean;
        originalDataset?: {
          datasetId?;
          featureGroupTableName?;
          name?;
        };
        originalDatasetDeleted?: boolean;
        replacementDataset?: {
          datasetId?;
          featureGroupTableName?;
          name?;
        };
        replacementDatasetDeleted?: boolean;
      }[];
      featureGroups?: {
        datasetType?;
        default?: boolean;
        featureGroupId?;
        required?: boolean;
      }[];
    };
    globalPredictionArgsInputs: {
      [key: string]: {
        dataType?;
        description?;
        name?;
      };
    };
  };
}

export function useBatchPred(batchPredId: string) {
  const { batchPredParam } = useSelector((state: any) => ({
    batchPredParam: state.batchPred,
  }));

  const batchPredIdUse = useNormalizedId(batchPredId);

  const batchPredOne = useMemo(() => {
    return batchPred.memBatchDescribe(undefined, batchPredIdUse, false);
  }, [batchPredParam, batchPredIdUse]);
  useEffect(() => {
    batchPred.memBatchDescribe(undefined, batchPredIdUse, true);
  }, [batchPredParam, batchPredIdUse]);

  return batchPredOne;
}

export function useFeatureGroupFromProject(projectId: string) {
  const { featureGroupsParam } = useSelector((state: any) => ({
    featureGroupsParam: state.featureGroups,
  }));

  const projectIdUse = useProjectIdNormalized(projectId);

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectIdUse);
  }, [featureGroupsParam, projectIdUse]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectIdUse);
  }, [featureGroupsParam, projectIdUse]);

  return featuresGroupsList;
}

export function useUseCaseTypesListFromUseCaseDirect(useCaseInfoDirect: any) {
  const res = useMemo(() => {
    return useCaseInfoDirect?.list
      ?.map((i1, i1ind) => {
        let uc1 = useCaseInfoDirect?.[i1];
        let dt1 = uc1?.dataset_type;
        let title1 = uc1?.title || dt1;

        if (!dt1) {
          return null;
        }

        return {
          isCustom: uc1?.isCustom,
          title: title1,
          type: dt1,
          trainable: uc1?.trainable,
          isRequired: uc1?.is_required === true,
          data: uc1,
        };
      })
      ?.filter((v1) => v1 != null);
  }, [useCaseInfoDirect]);

  return res as { isCustom?; isRequired?; title?; type?; data?; trainable? }[];
}

export function useFeatureGroupUsage(projectId) {
  const projectIdUse = useProjectIdNormalized(projectId);

  const fgList = useFeatureGroupFromProject(projectIdUse);

  const res = useMemo(() => {
    return fgList?.map((f1, f1ind) => {
      return {
        featureGroupUse: f1.featureGroupUse,
        type: f1.featureGroupType,
        featureGroupId: f1.featureGroupId,
        tableName: f1.tableName,
        useForTraining: f1.useForTraining,
      };
    });
  }, [fgList]);

  return res as { useForTraining?; tableName?; type?; featureGroupId?; featureGroupUse? }[];
}

export function useProblemTypes() {
  const { useCasesParam } = useSelector((state: any) => ({
    useCasesParam: state.useCases,
  }));

  useEffect(() => {
    memUseCases(true);
  }, [useCasesParam]);
  const useCaseRes = useMemo(() => {
    return memUseCases(false);
  }, [useCasesParam]);

  const res = useMemo(() => {
    let res: any = {};
    useCaseRes?.some((r1) => {
      let problemType = r1?.problemType;
      if (!Utils.isNullOrEmpty(problemType)) {
        res[problemType] = true;
      }
    });

    return Object.keys(res ?? {}).sort();
  }, [useCaseRes]);

  return res;
}

export function useUseCaseFromProjectOne(projectOne: any, returnObject = false) {
  return useUseCase(projectOne?.useCase, returnObject);
}

export function useUseCase(useCase: string, returnObject = false) {
  const { useCasesParam } = useSelector((state: any) => ({
    useCasesParam: state.useCases,
  }));

  const useCaseUse = useNormalizedId(useCase);

  useEffect(() => {
    memUseCasesSchemasInfo(true, useCaseUse, returnObject);
  }, [useCasesParam, useCaseUse, returnObject]);
  const useCaseRes = useMemo(() => {
    return memUseCasesSchemasInfo(false, useCaseUse, returnObject);
  }, [useCasesParam, useCaseUse, returnObject]);

  return useCaseRes;
}

export function usePythonFunctionsList(functionType?: PythonFunctionTypeParam, refreshId?: any) {
  const { pythonFunctionsParam } = useSelector((state: any) => ({
    pythonFunctionsParam: state.pythonFunctions,
  }));

  const functionTypeUse = useNormalizedId(functionType);

  const firstTime = useRef(true);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }

    StoreActions.listPythonFunctions_(functionType);
  }, [refreshId, functionType]);

  useEffect(() => {
    pythonFunctions.memListPythonFunctionsById(true, functionType);
  }, [pythonFunctionsParam, functionType]);
  const res = useMemo(() => {
    return pythonFunctions.memListPythonFunctionsById(false, functionType);
  }, [pythonFunctionsParam, functionType]);

  return res;
}

export function usePipelines(projectId?: string, refreshId?: any) {
  const { pipelinesReducer } = useSelector((state: any) => ({
    pipelinesReducer: state.pipelines,
  }));

  const firstTime = useRef(true);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }
    StoreActions.listPipelines(projectId);
  }, [refreshId, projectId]);

  useEffect(() => {
    pipelines.getPipelines(true, projectId);
  }, [pipelinesReducer, projectId]);

  const res = useMemo(() => {
    return pipelines.getPipelines(false, projectId);
  }, [pipelinesReducer, projectId]);

  return res;
}

export function usePipeline(pipelineId: string, refreshId?: any) {
  const { pipelinesReducer } = useSelector((state: any) => ({
    pipelinesReducer: state.pipelines,
  }));

  const firstTime = useRef(true);

  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }
    StoreActions.describePipeline(pipelineId);
  }, [refreshId, pipelineId]);

  useEffect(() => {
    pipelines.getPipeline(true, pipelineId);
  }, [pipelinesReducer, pipelineId]);

  const res = useMemo(() => {
    return pipelines.getPipeline(false, pipelineId);
  }, [pipelinesReducer, pipelineId]);

  return res;
}

export function usePipelineVersions(pipelineId: string, refreshId?: any) {
  const { pipelinesReducer } = useSelector((state: any) => ({
    pipelinesReducer: state.pipelines,
  }));

  const firstTime = useRef(true);

  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }
    StoreActions.listPipelineVersions(pipelineId);
  }, [refreshId, pipelineId]);

  useEffect(() => {
    pipelines.getPipelineVersions(true, pipelineId);
  }, [pipelinesReducer, pipelineId]);

  const res = useMemo(() => {
    return pipelines.getPipelineVersions(false, pipelineId);
  }, [pipelinesReducer, pipelineId]);

  return res;
}

export function usePythonFunctionsOne(name: string) {
  const { pythonFunctionsParam } = useSelector((state: any) => ({
    pythonFunctionsParam: state.pythonFunctions,
  }));

  const nameUse = useNormalizedId(name);

  useEffect(() => {
    pythonFunctions.memPythonFunctionsById(true, nameUse);
  }, [pythonFunctionsParam, nameUse]);
  const res = useMemo(() => {
    return pythonFunctions.memPythonFunctionsById(false, nameUse);
  }, [pythonFunctionsParam, nameUse]);

  return res;
}

export function useListAvailableLossTypes() {
  const { customLossFunctionsParam } = useSelector((state: any) => ({
    customLossFunctionsParam: state.customLossFunctions,
  }));

  useEffect(() => {
    customLossFunctions.memAvailableLossTypes(true);
  }, [customLossFunctionsParam]);
  let list = useMemo(() => {
    return customLossFunctions.memAvailableLossTypes(false);
  }, [customLossFunctionsParam]);

  return list;
}

export function useCustomLossFunctionsList(refreshId?: any) {
  const { customLossFunctionsParam } = useSelector((state: any) => ({
    customLossFunctionsParam: state.customLossFunctions,
  }));

  const nameUse = useNormalizedId(name);

  const firstTime = useRef(true);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }

    StoreActions.listCustomLossFunctions_();
  }, [refreshId]);

  useEffect(() => {
    customLossFunctions.memListCustomLossFunctionsById(true);
  }, [customLossFunctionsParam]);
  const res = useMemo(() => {
    return customLossFunctions.memListCustomLossFunctionsById(false);
  }, [customLossFunctionsParam]);

  return res;
}

export function useCustomLossFunctionOne(name: string) {
  const { customLossFunctionsParam } = useSelector((state: any) => ({
    customLossFunctionsParam: state.customLossFunctions,
  }));

  const nameUse = useNormalizedId(name);

  useEffect(() => {
    customLossFunctions.memCustomLossFunctionsById(true, nameUse);
  }, [customLossFunctionsParam, nameUse]);
  const res = useMemo(() => {
    return customLossFunctions.memCustomLossFunctionsById(false, nameUse);
  }, [customLossFunctionsParam, nameUse]);

  return res;
}

// Custom Metrics
export function useListSupportedCustomMetricProblemTypes() {
  const { customMetricsParam } = useSelector((state: any) => ({
    customMetricsParam: state.customMetrics,
  }));

  useEffect(() => {
    customMetrics.memSupportedCustomMetricProblemTypes(true);
  }, [customMetricsParam]);
  let list = useMemo(() => {
    return customMetrics.memSupportedCustomMetricProblemTypes(false);
  }, [customMetricsParam]);

  return list;
}

export function useCustomMetricsList(refreshId?: any) {
  const { customMetricsParam } = useSelector((state: any) => ({
    customMetricsParam: state.customMetrics,
  }));

  const firstTime = useRef(true);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }

    StoreActions.listCustomMetrics_();
  }, [refreshId]);

  useEffect(() => {
    customMetrics.memListCustomMetricsById(true);
  }, [customMetricsParam]);
  const res = useMemo(() => {
    return customMetrics.memListCustomMetricsById(false);
  }, [customMetricsParam]);

  return res;
}

export function useCustomMetricOne(name: string) {
  const { customMetricsParam } = useSelector((state: any) => ({
    customMetricsParam: state.customMetrics,
  }));

  const nameUse = useNormalizedId(name);

  useEffect(() => {
    customMetrics.memCustomMetricsById(true, nameUse);
  }, [customMetricsParam, nameUse]);
  const res = useMemo(() => {
    return customMetrics.memCustomMetricsById(false, nameUse);
  }, [customMetricsParam, nameUse]);

  return res;
}

// Modules

export function useModulesList(refreshId?: any) {
  const { modulesParam } = useSelector((state: any) => ({
    modulesParam: state.modules,
  }));

  const firstTime = useRef(true);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }

    StoreActions.listModules_();
  }, [refreshId]);

  useEffect(() => {
    modules.memListModulesById(true);
  }, [modulesParam]);
  const res = useMemo(() => {
    return modules.memListModulesById(false);
  }, [modulesParam]);

  return res;
}

export function useModuleOne(name: string) {
  const { modulesParam } = useSelector((state: any) => ({
    modulesParam: state.modules,
  }));

  const nameUse = useNormalizedId(name);

  useEffect(() => {
    modules.memModulesById(true, nameUse);
  }, [modulesParam, nameUse]);
  const res = useMemo(() => {
    return modules.memModulesById(false, nameUse);
  }, [modulesParam, nameUse]);

  return res;
}

export function useWebhookList(id: IWebhookId) {
  const { webhooksParam } = useSelector((state: any) => ({
    webhooksParam: state.webhooks,
  }));

  const idDeploymentID = useNormalizedId(id?.deploymentId);

  useEffect(() => {
    webhooks.memListWebhookById(true, { deploymentId: idDeploymentID });
  }, [webhooksParam, idDeploymentID]);
  const res = useMemo(() => {
    return webhooks.memListWebhookById(false, { deploymentId: idDeploymentID });
  }, [webhooksParam, idDeploymentID]);

  return res;
}

export function useWebhookOne(webhookId: string) {
  const { webhooksParam } = useSelector((state: any) => ({
    webhooksParam: state.webhooks,
  }));

  const webhookIdUse = useNormalizedId(webhookId);

  useEffect(() => {
    webhooks.memWebhookById(true, webhookIdUse);
  }, [webhooksParam, webhookIdUse]);
  const res = useMemo(() => {
    return webhooks.memWebhookById(false, webhookIdUse);
  }, [webhooksParam, webhookIdUse]);

  return res;
}

export function useDatasetVersion(datasetId?: string, datasetVersion?: string) {
  const { datasetsParam } = useSelector((state: any) => ({
    datasetsParam: state.datasets,
  }));

  let datasetIdUse = useNormalizedId(datasetId);
  let datasetVersionUse = useNormalizedId(datasetVersion);

  useEffect(() => {
    datasets.memDatasetListVersions(true, undefined, datasetIdUse);
  }, [datasetIdUse, datasetsParam]);
  const res = useMemo(() => {
    let res = datasets.memDatasetListVersions(false, undefined, datasetIdUse);
    if (res != null) {
      return res?.find((r1) => r1?.datasetVersion === datasetVersionUse);
    } else {
      return null;
    }
  }, [datasetIdUse, datasetVersionUse, datasetsParam]);

  return res;
}

export function useCpuAndMemory() {
  const { authUserParam } = useSelector((state: any) => ({
    authUserParam: state.authUser,
  }));

  useEffect(() => {
    authUser.memCpuAndMemory(true);
  }, [authUserParam]);
  const res = useMemo(() => {
    return authUser.memCpuAndMemory(false);
  }, [authUserParam]);

  return res as { [key: string]: { cpu: { default?: any; list?: { label?; value? }[] }; memory: { isCustom?: boolean; min?: number; max?: number; placeholder?: string; default?: any; list?: { label?; value? }[] } } };
}
