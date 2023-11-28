import Button from 'antd/lib/button';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import { calcDatasetById } from '../../stores/reducers/datasets';
import CopyText from '../CopyText/CopyText';
import HashIdValue from '../HashIdValue/HashIdValue';
import Link from '../Link/Link';
import MetricsHistory from '../MetricsHistory/MetricsHistory';
import PartsLink from '../NavLeft/PartsLink';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import SearchAdvancedForm from '../SearchAdvancedForm/SearchAdvancedForm';
const s = require('./SearchAdvanced.module.css');
const sd = require('../antdUseDark.module.css');

interface ISearchAdvancedProps {}

const SearchAdvanced = React.memo((props: PropsWithChildren<ISearchAdvancedProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [mainName, setMainName] = useState(null);
  const [useCase, setUseCase] = useState(null);

  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState(null);
  const [datasetId, setDatasetId] = useState(null);
  const [datasetName, setDatasetName] = useState(null);
  const [datasetVersion, setDatasetVersion] = useState(null);
  const [modelId, setModelId] = useState(null);
  const [modelName, setModelName] = useState(null);
  const [modelVersion, setModelVersion] = useState(null);
  const [deployId, setDeployId] = useState(null);
  const [deployName, setDeployName] = useState(null);

  const [searchId, setSearchId] = useState(null);
  const [urlCheck, setUrlCheck] = useState(null);
  const [metricsHistoryProjectId, setMetricsHistoryProjectId] = useState(null);
  const [showProjectDashboard, setShowProjectDashboard] = useState(null);
  const [showSearch, setShowSearch] = useState(null);

  const onSearchAdv = (type, res) => {
    setMainName(null);

    setProjectId(null);
    setDatasetName(null);
    setDatasetId(null);
    setDatasetVersion(null);
    setModelName(null);
    setModelId(null);
    setModelVersion(null);
    setDeployName(null);
    setDeployId(null);
    setUseCase(null);

    setSearchId(null);
    setUrlCheck(null);
    setMetricsHistoryProjectId(null);
    setShowProjectDashboard(null);
    setShowSearch(null);

    switch (type) {
      case 'searchId':
        setSearchId(res);
        return;
      case 'urlCheck':
        setUrlCheck(res);
        return;
      case 'metricsHistory':
        setMetricsHistoryProjectId(null);
        setTimeout(() => {
          setMetricsHistoryProjectId(res);
        }, 0);
        return;
      case 'showProjectDashboard':
        setShowProjectDashboard(res);
        return;
      case 'showSearch':
        setShowSearch(res == null ? null : true);
        REActions.onChangeAdvForm(res);
        return;
    }
  };

  useEffect(() => {
    setShowSearch(true);
  }, []);

  const links: string[] = [
    'Dataset List',
    '/app/' + PartsLink.dataset_list + '/:projectId',

    // 'Add Dataset',
    // "/app/"+PartsLink.dataset_add+"/:projectId",
    // 'Attach Dataset',
    // "/app/"+PartsLink.dataset_attach+"/:projectId",
    // 'Upload Dataset',
    // "/app/"+PartsLink.dataset_upload+"/:projectId",
    // 'Dataset Detail',
    // "/app/"+PartsLink.dataset_detail+"/:datasetId",
    'Dataset Detail',
    '/app/' + PartsLink.dataset_detail + '/:datasetId/:projectId',

    // 'Dataset Streaming',
    // "/app/"+PartsLink.dataset_streaming+"/:datasetId/:projectId",
    // 'Dataset Schema Wizard',
    // "/app/"+PartsLink.dataset_schema_wizard+"/:projectId",
    // 'Dataset Schema',
    // "/app/"+PartsLink.dataset_schema+"/:datasetId",
    'Dataset Schema',
    '/app/' + PartsLink.dataset_schema + '/:datasetId/:projectId',
    // 'Dataset For Use Case',
    // "/app/"+PartsLink.dataset_for_usecase+'/:projectId',
    // 'Dataset - Data Explorer',
    // "/app/"+PartsLink.dataset_data_explorer+"/:datasetId",
    // 'Dataset - Data Explorer',
    // "/app/"+PartsLink.dataset_data_explorer+"/:datasetId/:projectId",
    // 'Dataset - Raw Data',
    // "/app/"+PartsLink.dataset_raw_data+"/:datasetId",
    // 'Dataset - Raw Data',
    // "/app/"+PartsLink.dataset_raw_data+"/:datasetId/:projectId",
    // 'Dataset - Augmentation',
    // "/app/"+PartsLink.dataset_augmentation+"/:projectId",
    // 'Dataset - Augmentation',
    // "/app/"+PartsLink.dataset_augmentation+"/:datasetId/:projectId",

    'Project Dashboard',
    '/app/' + PartsLink.project_dashboard + '/:projectId',

    // 'Project Data Augmentation',
    // "/app/"+PartsLink.project_data_augmentation+"/:projectId",

    'Models List',
    '/app/' + PartsLink.model_list + '/:projectId',
    // 'Model Train',
    // "/app/"+PartsLink.model_train+"/:projectId",
    'Model Detail',
    '/app/' + PartsLink.model_detail + '/:modelId/:projectId',
    // 'Model Featurization',
    // "/app/"+PartsLink.model_featurization,
    'Model Metrics',
    '/app/' + PartsLink.model_metrics + '/:projectId',
    'Model Predictions',
    '/app/' + PartsLink.model_predictions + '/:projectId/:deployId',
    'Model Predictions',
    '/app/' + PartsLink.model_predictions + '/:projectId',
    // 'Model Explaations',
    // "/app/"+PartsLink.model_explanations+"/:projectId",
    // 'Model Augmentation',
    // "/app/"+PartsLink.model_augmentation+"/:modelId/:projectId",

    // 'Deployment Create',
    // "/app/"+PartsLink.deploy_create+"/:modelId/:projectId",
    // 'Deployments List',
    // "/app/"+PartsLink.deploy_list+"/:projectId",
    'Deployments List',
    '/app/' + PartsLink.deploy_list + '/:modelId/:projectId',
    'Deployment Detail',
    '/app/' + PartsLink.deploy_detail + '/:projectId/:deployId',
    'Deployment Prediction API',
    '/app/' + PartsLink.deploy_predictions_api + '/:projectId/:deployId',
    'Deployment Batch Predictions',
    '/app/' + PartsLink.deploy_batch + '/:projectId/:deployId',

    'Deployment Token List',
    '/app/' + PartsLink.deploy_tokens_list + '/:projectId',
  ];

  useEffect(() => {
    let unReg = REActions.searchAdv.listen(onSearchAdv);

    return () => {
      unReg();
    };
  });

  useEffect(() => {
    if (searchId != null && _.isObject(searchId as any)) {
      //type num hash
      let type1 = searchId.type;
      if (type1) {
        type1 = type1.toLowerCase();

        if (type1 === 'dataset_id') {
          REClient_.client_().describeDataset(
            searchId.hash,
            (err, res) => {
              if (res?.result != null) {
                let projectId;
                let ds1 = calcDatasetById(undefined, searchId.hash);
                if (ds1 != null) {
                  projectId = ds1.toJS()?.allProjectDatasets?.[0]?.project?.projectId;
                }
                REClient_.client_().describeProject(
                  projectId,
                  (err2, res2) => {
                    setMainName('Dataset');

                    setProjectId(projectId);
                    setProjectName(res2?.result?.name);

                    setDatasetId(searchId.hash);
                    setDatasetName(res.result?.name);
                    setDatasetVersion(res.result?.lastDatasetVersion?.datasetVersion);

                    if (res2?.result != null) {
                      setUseCase(res2.result?.useCase);
                    }
                  },
                  false,
                );
              }
            },
            false,
          );
        } else if (type1 === 'dataset_instance_id') {
          // REClient_.client_().describeDataset(searchId.hash, (err, res) => {
          //   if(res?.result!=null) {
          //     setDatasetId(searchId.hash);
          //     setDatasetVersion(res.result?.lastDatasetVersion?.datasetVersion);
          //
          //     let ds1 = calcDatasetById(undefined, searchId.hash);
          //     if(ds1!=null) {
          //       setProjectId(ds1.toJS()?.allProjectDatasets?.[0]?.project?.projectId);
          //     }
          //   }
          // }, false);
        } else if (type1 === 'model_id') {
          REClient_.client_().describeModel(
            searchId.hash,
            (err, res) => {
              if (res?.result != null) {
                REClient_.client_().describeProject(
                  res.result?.projectId,
                  (err2, res2) => {
                    setMainName('Model');

                    setProjectId(res.result?.projectId);
                    setModelId(searchId.hash);
                    setModelName(res.result?.name);
                    setModelVersion(res.result?.latestModelVersion?.modelVersion);

                    if (res2?.result != null) {
                      setProjectName(res2?.result?.name);
                      setUseCase(res2.result?.useCase);
                    }
                  },
                  false,
                );
              }
            },
            false,
          );
        } else if (type1 === 'model_instance_id') {
          REClient_.client_()._describeModelVersion(
            searchId.hash,
            (err, res) => {
              if (res?.result != null) {
                REClient_.client_().describeModel(
                  res.result?.modelId,
                  (err2, res2) => {
                    REClient_.client_().describeProject(
                      res.result?.projectId,
                      (err3, res3) => {
                        setMainName('Model Version');

                        setProjectId(res.result?.projectId);
                        setDatasetVersion(res.result?.datasetVersions?.[0]);
                        setModelId(res.result?.modelId);
                        setModelVersion(searchId.hash);

                        if (res2?.result != null) {
                          setModelName(res2.result?.name);
                          setProjectId(res2.result?.projectId);
                        }

                        if (res3?.result != null) {
                          setProjectName(res3.result?.name);
                          setUseCase(res3.result?.useCase);
                        }
                      },
                      false,
                    );
                  },
                  false,
                );
              }
            },
            false,
          );
        }
        if (type1 === 'deployment_id') {
          REClient_.client_().describeDeployment(
            searchId.hash,
            (err, res) => {
              if (res?.result != null) {
                REClient_.client_().describeProject(
                  res.result?.projectId,
                  (err2, res2) => {
                    setMainName('Deployment');

                    setProjectId(res.result?.projectId);
                    setModelId(res.result?.modelId);
                    setModelVersion(res.result?.modelVersion);
                    setDeployName(res.result?.name);
                    setDeployId(searchId.hash);

                    if (res2?.result != null) {
                      setProjectName(res2?.result?.name);
                      setUseCase(res2.result?.useCase);
                    }
                  },
                  false,
                );
              }
            },
            false,
          );
        }
        if (type1 === 'project_id') {
          REClient_.client_().describeProject(
            searchId.hash,
            (err, res) => {
              if (res?.result != null) {
                setMainName('Project');

                setProjectId(searchId.hash);
                setProjectName(res.result?.name);
                setUseCase(res.result?.useCase);
              }
            },
            false,
          );
        }
      }
    }
  }, [searchId]);

  const renderSearchId = () => {
    //type num hash
    let res: { name; link; names }[] = [];
    for (let i = 0; i < links.length; i += 2) {
      const name1 = links[i];
      let link1 = links[i + 1];

      let names = [],
        invalid = false,
        alreadyName = {};
      const checkId = (tag, id1, name0, name1) => {
        let p = link1.indexOf(':' + tag);
        if (p > -1) {
          if (id1 == null || Utils.isNullOrEmpty(id1)) {
            invalid = true;
          } else {
            if (!Utils.isNullOrEmpty(name0) && !Utils.isNullOrEmpty(name1)) {
              if (!alreadyName[name0]) {
                alreadyName[name0] = true;
                names.push(name0 + ': ' + name1);
              }
            }
            link1 = link1.replace(':' + tag, id1);
          }
        }
      };

      checkId('projectId', projectId, 'Project', projectName);
      checkId('datasetId', datasetId, 'Dataset', datasetName);
      checkId('datasetVersion', datasetVersion, 'Dataset', datasetName);
      checkId('modelId', modelId, 'Model', modelName);
      checkId('modelVersion', modelVersion, 'Model', modelName);
      checkId('deployId', deployId, 'Deployment', deployName);

      if (!invalid) {
        res.push({
          name: name1,
          names,
          link: link1,
        });
      }
    }

    let detailS = null;
    if (searchId) {
      detailS = (
        <span>
          Number:&nbsp;<CopyText>{'' + searchId.num}</CopyText>
        </span>
      );
    }

    return (
      <div>
        <div style={{ fontSize: '23px', marginBottom: '10px' }} className={sd.styleTextGrayLight}>
          <b>{mainName + ' Found:'}</b>
        </div>
        {detailS != null && <div style={{ opacity: 0.7, fontSize: '16px', marginBottom: '20px' }}>{detailS}</div>}
        {!Utils.isNullOrEmpty(projectId) && (
          <div style={{ fontSize: '16px', marginBottom: '20px' }}>
            <Button
              type={'primary'}
              onClick={(e) => {
                REActions.showOrgHint(null, null);
                REActions.searchAdv('metricsHistory', projectId);
              }}
            >
              Project History
            </Button>
          </div>
        )}

        {res.map((r1, ind) => {
          return (
            <div key={'rrr_' + ind} style={{ fontSize: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px' }}>
                <b>{r1.name}</b>
              </div>
              <div style={{ margin: '4px 0', opacity: 0.8 }}>{r1.names?.join(', ')}</div>
              <div>
                <Link usePointer to={r1.link} className={sd.styleTextBlueBright}>
                  {r1.link}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderUrlCheck = () => {
    let url1 = urlCheck;
    if (/^https?:\/\//i.test(url1)) {
      url1 = url1.substring(url1.indexOf('//') + 2);
      if (url1.indexOf('/') > -1) {
        url1 = url1.substring(url1.indexOf('/'));
      }
    }

    if (!_.startsWith(url1, '/')) {
      url1 = '/' + url1;
    }
    if (!/^\/app/i.test(url1)) {
      url1 = '/app' + url1;
    }

    let matchRes, linkMatch;
    for (let i = 0; i < links.length; i += 2) {
      const name1 = links[i];
      let link1 = links[i + 1];

      let link2 = link1.replace(/\/:([a-z0-9A-Z]+)/g, '/(?<$1>[a-zA-Z0-9]+)');
      let match1 = new RegExp(link2).exec(url1);
      if (match1 != null) {
        linkMatch = link1;
        matchRes = match1;
        break;
      }
    }

    if (matchRes != null) {
      let kk = Object.keys(matchRes.groups);

      return (
        <div>
          <div style={{ fontSize: '14px', marginBottom: '10px' }}>
            <div style={{ marginBottom: '15px' }}>Link:&nbsp;{linkMatch}</div>
            <div>
              {kk.map((k1) => {
                const v1 = matchRes.groups[k1];

                return (
                  <div key={'aaa' + k1} style={{ margin: '5px 0' }}>
                    <span style={{ marginRight: '10px' }} className={sd.styleTextGray}>
                      <b>{k1}:</b>
                    </span>
                    <HashIdValue value={v1} />
                    <span
                      onClick={(e) => {
                        REClient_.client_()._searchId(v1, (err, res) => {
                          if (err || !res?.success) {
                            REActions.addNotificationError(err || Constants.errorDefault);
                          } else {
                            REActions.showOrgHint(null, null);
                            REActions.searchAdv('searchId', res?.result || {});
                          }
                        });
                      }}
                      style={{ cursor: 'pointer', marginLeft: '20px' }}
                      className={sd.styleTextBlueBrightColor}
                    >
                      Lookup
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    } else {
      return <div>No Match</div>;
    }
  };

  const onChangeAdvForm = (v1) => {
    REActions.onChangeAdvForm(v1);
  };

  const renderSearchForm = () => {
    return (
      <div
        css={`
          display: flex;
        `}
      >
        <div
          css={`
            flex: 1;
          `}
        >
          <SearchAdvancedForm onChange={onChangeAdvForm} />
        </div>
        <div
          css={`
            width: 240px;
          `}
        >
          <div
            css={`
              background-color: rgba(255, 255, 255, 0.1);
              margin-left: 15px;
              text-align: center;
              padding: 7px 0;
            `}
          >
            Load/Save Searches
          </div>
        </div>
      </div>
    );
  };

  let content = useMemo(() => {
    if (searchId) {
      return renderSearchId();
    }
    if (!Utils.isNullOrEmpty(urlCheck)) {
      return renderUrlCheck();
    }
    if (metricsHistoryProjectId) {
      return <MetricsHistory projectId={metricsHistoryProjectId} />;
    }
    if (showProjectDashboard) {
      return <ProjectDetail />;
    }
    if (showSearch) {
      return renderSearchForm();
    }
    return null;
  }, [showSearch, datasetId, modelId, deployId, projectId, datasetName, modelName, projectName, deployName, useCase, urlCheck, metricsHistoryProjectId, showProjectDashboard]);

  // if(calcAuthUserIsLoggedIn()?.isInternal!==true) {
  //   return <div css={`text-align: center; margin-top: 20px; font-size: 18px;`}>Invalid Permissions</div>;
  // }

  return <div style={{ margin: '20px' }}>{content}</div>;
});

export default SearchAdvanced;
