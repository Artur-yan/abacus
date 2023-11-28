import * as Immutable from 'immutable';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import batchPred from '../../stores/reducers/batchPred';
import { calcDatasetById, calcDatasetByIdError } from '../../stores/reducers/datasets';
import deployments, { calcDeploymentsByProjectIdError } from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import { calcModelById, calcModelByIdError, calcModelListByProjectId } from '../../stores/reducers/models';
import monitoring from '../../stores/reducers/monitoring';
import notebooks from '../../stores/reducers/notebooks';
import { calcProjectsById, calcProjectsByIdError } from '../../stores/reducers/projects';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./MissingParamsErrorShow.module.css');
const sd = require('../antdUseDark.module.css');

interface IMissingParamsErrorShowProps {}

const MissingParamsErrorShow = React.memo((props: PropsWithChildren<IMissingParamsErrorShowProps>) => {
  const { monitoringParam, paramsProp, authUser, projectsParam, featureGroupsParam, datasetsParam, modelsParam, deploymentsParam, batchPredParam } = useSelector((state: any) => ({
    paramsProp: state?.paramsProp,
    authUser: state?.authUser,
    projectsParam: state?.projects,
    datasetsParam: state?.datasets,
    modelsParam: state?.models,
    deploymentsParam: state?.deployments,
    batchPredParam: state?.batchPred,
    featureGroupsParam: state?.featureGroups,
    monitoringParam: state?.monitoring,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const isLoggedIn = calcAuthUserIsLoggedIn()?.isLoggedIn === true;

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const datasetId = paramsProp?.get('datasetId');
  const modelId = paramsProp?.get('modelId');
  const deployId = paramsProp?.get('deployId');
  const batchPredId = paramsProp?.get('batchPredId');
  const featureGroupId = paramsProp?.get('featureGroupId');
  const modelMonitorId = paramsProp?.get('modelMonitorId');
  const notebookId = paramsProp?.get('notebookId');

  const { linkTo, showMsg, isOk, linkMsg, isError } = useMemo(() => {
    let showMsg, isOk, linkTo, linkMsg, isError;
    if (isLoggedIn) {
      const isEmptyError = (v1) => {
        if (v1 != null && Immutable.isImmutable(v1)) {
          v1 = v1.toJS();
        }

        return v1 != null && _.isObject(v1) && _.isEmpty(v1);
      };

      if (isOk !== false && !Utils.isNullOrEmpty(projectId) && projectId !== '-') {
        let p1 = calcProjectsById(undefined, projectId);
        let err1 = calcProjectsByIdError(undefined, projectId);
        if (isEmptyError(p1) || !Utils.isNullOrEmpty(err1)) {
          isOk = false;
          isError = !!err1;
          showMsg = err1 || 'Project Not Found';
          linkTo = '/' + PartsLink.project_list;
          linkMsg = 'Show All Projects';
        }
      }

      if (isOk !== false && !Utils.isNullOrEmpty(datasetId) && datasetId !== '-') {
        let p1 = calcDatasetById(undefined, datasetId);
        let err1 = calcDatasetByIdError(undefined, datasetId);
        if (isEmptyError(p1) || !Utils.isNullOrEmpty(err1)) {
          isOk = false;
          isError = !!err1;
          showMsg = err1 || 'Dataset Not Found';

          if (projectId) {
            linkTo = '/' + PartsLink.project_dashboard + '/' + projectId;
            linkMsg = 'Projects Dashboard';
          } else {
            linkTo = '/' + PartsLink.project_list;
            linkMsg = 'Show All Projects';
          }
        }
      }

      if (isOk !== false && !Utils.isNullOrEmpty(modelId) && modelId !== '-') {
        let p1 = calcModelById(undefined, modelId);
        let err1 = calcModelByIdError(undefined, modelId);
        if (projectId) {
          let mm = calcModelListByProjectId(undefined, projectId);
          if (mm != null) {
            mm.some((m1) => {
              if (m1.get('modelId') === modelId) {
                p1 = m1.toJS();
                return true;
              }
            });
            if (p1 == null) {
              p1 = {};
            }
          }
        }
        if (isEmptyError(p1) || !Utils.isNullOrEmpty(err1)) {
          isOk = false;
          isError = !!err1;
          showMsg = err1 || 'Model Not Found';
          if (projectId) {
            linkTo = '/' + PartsLink.project_dashboard + '/' + projectId;
            linkMsg = 'Projects Dashboard';
          } else {
            linkTo = '/' + PartsLink.project_list;
            linkMsg = 'Show All Projects';
          }
        }
      }

      if (isOk !== false && !Utils.isNullOrEmpty(deployId) && deployId !== '-') {
        let p1 = null;

        let dd = deployments.memDeployForProject(false, undefined, projectId);
        let err1 = calcDeploymentsByProjectIdError(undefined, projectId);
        if (dd != null) {
          dd.some((d1) => {
            if (d1.deploymentId === deployId) {
              p1 = d1;
              return true;
            }
          });
          if (p1 == null) {
            p1 = {};
          }
        }

        if (isEmptyError(p1) || !Utils.isNullOrEmpty(err1)) {
          isOk = false;
          isError = !!err1;
          showMsg = err1 || 'Deployment Not Found';
          if (projectId) {
            linkTo = '/' + PartsLink.project_dashboard + '/' + projectId;
            linkMsg = 'Projects Dashboard';
          } else {
            linkTo = '/' + PartsLink.project_list;
            linkMsg = 'Show All Projects';
          }
        }
      }

      if (isOk !== false && !Utils.isNullOrEmpty(batchPredId) && batchPredId !== '-') {
        let p1 = batchPred.memBatchDescribe(undefined, batchPredId, false);
        let err1 = batchPred.calcBatchDescribeError(undefined, batchPredId);
        if (isEmptyError(p1) || !Utils.isNullOrEmpty(err1)) {
          isOk = false;
          isError = !!err1;
          showMsg = err1 || 'Batch Prediction Not Found';
          if (projectId) {
            linkTo = '/' + PartsLink.project_dashboard + '/' + projectId;
            linkMsg = 'Projects Dashboard';
          } else {
            linkTo = '/' + PartsLink.project_list;
            linkMsg = 'Show All Projects';
          }
        }
      }

      if (isOk !== false && !Utils.isNullOrEmpty(notebookId) && notebookId !== '-') {
        let p1 = notebooks.memNotebookById(false, notebookId);
        let err1 = notebooks.calcNotebookById(undefined, batchPredId);
        if (isEmptyError(p1) || !Utils.isNullOrEmpty(err1)) {
          isOk = false;
          isError = !!err1;
          showMsg = err1 || 'Notebook Not Found';
          if (projectId) {
            linkTo = '/' + PartsLink.project_dashboard + '/' + projectId;
            linkMsg = 'Projects Dashboard';
          } else {
            linkTo = '/' + PartsLink.project_list;
            linkMsg = 'Show All Projects';
          }
        }
      }

      if (isOk !== false && !Utils.isNullOrEmpty(featureGroupId) && featureGroupId !== '-') {
        let p1 = featureGroups.memFeatureGroupsForId(false, projectId, featureGroupId);
        let err1 = featureGroups.calcFeatureGroupsByIdError(projectId, featureGroupId);
        if (isEmptyError(p1) || !Utils.isNullOrEmpty(err1)) {
          isOk = false;
          isError = !!err1;
          showMsg = err1 || 'Feature Group Not Found';
          if (projectId) {
            linkTo = '/' + PartsLink.project_dashboard + '/' + projectId;
            linkMsg = 'Projects Dashboard';
          } else {
            linkTo = '/' + PartsLink.project_list;
            linkMsg = 'Show All Projects';
          }
        }
      }

      if (isOk !== false && !Utils.isNullOrEmpty(modelMonitorId) && modelMonitorId !== '-') {
        let p1 = monitoring.memModelsById(false, modelMonitorId);
        let err1 = monitoring.calcModelsByIdError(undefined, modelMonitorId);
        if (isEmptyError(p1) || !Utils.isNullOrEmpty(err1)) {
          isOk = false;
          isError = !!err1;
          showMsg = err1 || 'Monitor Not Found';
          if (projectId) {
            linkTo = '/' + PartsLink.project_dashboard + '/' + projectId;
            linkMsg = 'Projects Dashboard';
          } else {
            linkTo = '/' + PartsLink.project_list;
            linkMsg = 'Show All Projects';
          }
        }
      }
    }
    return { linkTo, showMsg, isOk, linkMsg, isError };
  }, [isLoggedIn, projectId, datasetId, modelId, deployId, batchPredId, featureGroupId, modelMonitorId, projectsParam, datasetsParam, modelsParam, deploymentsParam, batchPredParam, featureGroupsParam, monitoringParam]);

  if (paramsProp == null) {
    return null;
  }

  if (!isOk && showMsg) {
    return (
      <RefreshAndProgress
        errorMsg={isError ? showMsg : null}
        msgMsg={isError ? null : showMsg}
        errorButtonText={linkMsg}
        onClickErrorButton={(e) => {
          Link.doGotoLink(linkTo, undefined, undefined, undefined, true);
        }}
        msgButtonText={linkMsg}
        onClickMsgButton={(e) => {
          Link.doGotoLink(linkTo, undefined, undefined, undefined, true);
        }}
      />
    );
  }

  return <>{props.children}</>;
});

export default MissingParamsErrorShow;
