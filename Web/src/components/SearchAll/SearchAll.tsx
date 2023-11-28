import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import color from 'color';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import defDatasets from '../../stores/reducers/defDatasets';
import deployments, { DeploymentLifecycle } from '../../stores/reducers/deployments';
import featureGroups from '../../stores/reducers/featureGroups';
import { calcHelp } from '../../stores/reducers/help';
import models from '../../stores/reducers/models';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import NanoScroller from '../NanoScroller/NanoScroller';
import { IconDatasets, IconDeploys, IconFeatureGroups, IconModels, IconProject } from '../NavLeft/utils';
import PartsLink from '../NavLeft/PartsLink';
import SearchResOne from '../SearchResOne/SearchResOne';
import SearchUsageMethod from '../SearchUsageMethod/SearchUsageMethod';
import { ISearchInOne, ISearchResOne } from './ISearchResOne';

const s = require('./SearchAll.module.css');
const sd = require('../antdUseDark.module.css');

interface ISearchAllProps {
  isVisible?: boolean;
  isValidate?: boolean;
  onHide?: () => void;
  posLeft?: number;
}

const SearchAll = React.memo((props: PropsWithChildren<ISearchAllProps>) => {
  const { helpParam, defDatasetsParam, paramsProp, authUser, projectsParam, featureGroupsParam, deploymentsParam, modelsParam, projectDatasetsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    projectsParam: state.projects,
    featureGroupsParam: state.featureGroups,
    projectDatasetsParam: state.projectDatasets,
    modelsParam: state.models,
    deploymentsParam: state.deployments,
    helpParam: state.help,
    defDatasetsParam: state.defDatasets,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isVisible, setIsVisible] = useState(false);
  const [inSel, setInSel] = useState(null as ISearchInOne);
  const [resList, setResList] = useState(null as ISearchResOne[]);

  const [filterText, setFilterText] = useState('');
  const [filterTextBounced, setFilterTextBounced] = useState('');
  const refFilterBounced = useRef(null);

  const [datasetsList, setDatasetsList] = useState(null);

  const [searchResProjects, setSearchResProjects] = useState(null as ISearchResOne[]);
  const [searchResFeatureGroups, setSearchResFeatureGroups] = useState(null as ISearchResOne[]);
  const [searchResDatasets, setSearchResDatasets] = useState(null as ISearchResOne[]);
  const [searchResErrors, setSearchResErrors] = useState(null as ISearchResOne[]);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  const onClickLink = (e) => {
    props.onHide?.();
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    REClient_.client_().listDatasets(1000, undefined, null, (err, res) => {
      setDatasetsList(res?.result ?? null);
    });
  }, [isVisible]);

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const isFeatureStore = foundProject1?.isFeatureStore === true;
  const isDrift = foundProject1?.isDrift;

  useEffect(() => {
    defDatasets.memValidationForProjectId(true, projectId);
  }, [projectId, defDatasetsParam]);
  const validation = useMemo(() => {
    return defDatasets.memValidationForProjectId(false, projectId);
  }, [projectId, defDatasetsParam]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (validation?.valid === false) {
      let res: ISearchResOne[] = [];

      // const findDatasetId = (fgId) => {
      //   let res = null;
      //   foundProject1?.allProjectDatasets?.some(d1 => {
      //     console.warn(d1);
      //   });
      //   return res;
      // };

      validation?.datasetErrors?.some((e1) => {
        if (!Utils.isNullOrEmpty(e1?.message)) {
          res.push({
            type: 'errors',
            name: e1.message,
            link: '/' + PartsLink.features_list + '/' + projectId + '/' + e1.featureGroupId,
          });
        }
      });

      const doList = (list, isRequired) => {
        list.some((d1) => {
          let kk = Object.keys(d1?.requiredColumns ?? {});
          kk.some((k1) => {
            if (d1?.requiredColumns?.[k1] === false) {
              res.push({
                type: 'errors',
                name: `Required Field Missing: ${k1} in ${d1?.datasetType} (${isRequired ? 'Required' : 'Optional'} dataset)`,
                link: ['/' + PartsLink.features_list + '/' + projectId + '/' + d1.featureGroupId, 'showWizard=true'],
              });
            }
          });
        });
      };

      doList(validation?.requiredDatasets, true);
      doList(validation?.optionalDatasets, false);

      setSearchResErrors(res);
    }
  }, [validation, foundProject1, isVisible]);

  useEffect(() => {
    setIsVisible(props.isVisible);
  }, [props.isVisible]);

  const onMouseDownParent = (e) => {
    props.onHide?.();
  };

  const searchInListAll = useMemo(() => {
    if (props.isValidate) {
      let res = [
        {
          id: 'errors',
          name: 'Errors',
          nameSingular: 'Error',
          color: '#f00',
          icon: require('@fortawesome/pro-regular-svg-icons/faTimesCircle').faTimesCircle,
        },
      ] as ISearchInOne[];

      setInSel(res[0]);
      return res;
    }

    let res = [
      {
        id: 'projects',
        name: 'Projects',
        nameSingular: 'Project',
        icon: IconProject,
        color: '#4a9331',
      },
      {
        id: 'datasets',
        name: 'Datasets',
        nameSingular: 'Dataset',
        icon: IconDatasets,
        color: '#aba334',
      },
      {
        id: 'fg',
        name: 'Feature Groups',
        nameSingular: 'FG',
        icon: IconFeatureGroups,
        color: '#3556c5',
      },
      {
        id: 'tablename',
        name: 'Table Name',
        nameSingular: 'TableName',
        icon: require('@fortawesome/pro-regular-svg-icons/faTable').faTable,
        color: '#9a34b6',
        hidden: true,
      },
      {
        isSeparator: true,
      },
      {
        id: 'models',
        name: 'Models',
        nameSingular: 'Model',
        icon: IconModels,
        hidden: isFeatureStore || projectId == null || isDrift,
        color: '#82a132',
      },
      {
        id: 'deploys',
        name: 'Deployments',
        nameSingular: 'Deployment',
        icon: IconDeploys,
        hidden: projectId == null || isDrift,
        color: '#522db7',
      },
      {
        isSeparator: true,
      },
      {
        id: 'help',
        name: 'Help',
        nameSingular: 'Help',
        icon: require('@fortawesome/pro-regular-svg-icons/faQuestionCircle').faQuestionCircle,
        color: '#2e55a8',
      },
    ] as ISearchInOne[];

    setInSel((in1) => {
      if (in1?.id === 'errors') {
        in1 = null;
      }
      if (in1 != null) {
        let f1 = res?.find((r1) => r1.id === in1.id);
        if (f1 == null || f1?.hidden === true) {
          in1 = null;
        }
      }
      return in1;
    });

    return res;
  }, [isFeatureStore, projectId, props.isValidate, isDrift]);

  const mode1 = paramsProp?.get('mode');

  const searchInList = useMemo(() => {
    if (mode1 === 'help') {
      let res = searchInListAll?.filter((s1) => s1.id === 'help');
      setInSel(res?.[0]);
      return res;
    }
    let res = searchInListAll;
    res = res?.filter((r1) => !r1.hidden);
    return res.filter((r1, r1ind) => r1ind === 0 || !(r1.isSeparator && res?.[r1ind - 1]?.isSeparator));
  }, [searchInListAll, mode1]);

  const onClickInSel = (s1: ISearchInOne) => {
    setInSel((in1) => {
      if (s1 != null && in1?.id === s1?.id) {
        in1 = null;
      } else {
        in1 = s1;
      }

      return in1;
    });
  };

  const fgInProject = useMemo(() => {
    if (!['fg', undefined, null].includes(inSel?.id)) {
      return;
    }
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [inSel, featureGroupsParam, projectId]);
  useEffect(() => {
    if (!['fg', undefined, null].includes(inSel?.id)) {
      return;
    }
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [inSel, featureGroupsParam, projectId]);

  // useEffect(() => {
  //   let ids = featuresGroupsList?.map(f1 => f1.featureGroupId)?.filter(v1 => !Utils.isNullOrEmpty(v1));
  //   if(ids!=null && ids.length>0) {
  //     featureGroups.memFeatureGroupsForIdList(true, undefined, ids);
  //   }
  // }, [featuresGroupsList, featureGroupsParam]);
  // const fgInProject = useMemo(() => {
  //   let ids = featuresGroupsList?.map(f1 => f1.featureGroupId)?.filter(v1 => !Utils.isNullOrEmpty(v1));
  //   if(ids!=null && ids.length>0) {
  //     return featureGroups.memFeatureGroupsForIdList(false, undefined, ids);
  //   }
  // }, [featuresGroupsList, featureGroupsParam]);

  const datasetsListInProject = useMemo(() => {
    if (!['datasets', undefined, null].includes(inSel?.id)) {
      return;
    }
    return projectDatasetsReq.memDatasetsByProjectId(false, projectDatasetsParam, projectId);
  }, [inSel, projectDatasetsParam, projectId]);
  useEffect(() => {
    if (!['datasets', undefined, null].includes(inSel?.id)) {
      return;
    }
    projectDatasetsReq.memDatasetsByProjectId(true, projectDatasetsParam, projectId);
  }, [inSel, projectDatasetsParam, projectId]);

  const modelsListInProject = useMemo(() => {
    if (!['models'].includes(inSel?.id)) {
      return;
    }
    return models.memListByProjectId(false, modelsParam, projectId);
  }, [inSel, modelsParam, projectId]);
  useEffect(() => {
    if (!['models'].includes(inSel?.id)) {
      return;
    }
    models.memListByProjectId(true, modelsParam, projectId);
  }, [inSel, modelsParam, projectId]);

  const deploymentsListInProject = useMemo(() => {
    if (!['deploys'].includes(inSel?.id)) {
      return;
    }
    return deployments.memDeployForProject(false, deploymentsParam, projectId);
  }, [inSel, deploymentsParam, projectId]);
  useEffect(() => {
    if (!['deploys'].includes(inSel?.id)) {
      return;
    }
    deployments.memDeployForProject(true, deploymentsParam, projectId);
  }, [inSel, deploymentsParam, projectId]);

  const memHelp = (doCall, helpParam) => {
    let res = calcHelp();
    if (res == null) {
      if (helpParam.get('isRefreshing')) {
        return null;
      } else {
        if (doCall) {
          StoreActions.helpRetrieve_();
        }
      }
    } else {
      return res;
    }
  };
  const helpRes = useMemo(() => {
    if (!['help'].includes(inSel?.id)) {
      return;
    }
    return memHelp(false, helpParam);
  }, [inSel, helpParam]);
  useEffect(() => {
    if (!['help'].includes(inSel?.id)) {
      return;
    }
    memHelp(true, helpParam);
  }, [inSel, helpParam]);

  const helpTree = useMemo(() => {
    let methodsTree = null;

    let methods = helpRes?.methods;
    let usage = helpRes?.usage;
    if (methods) {
      methodsTree = {};
      let kk = Object.keys(methods);
      kk.some((k1) => {
        let m1 = methods[k1];

        let c1 = m1.collection;
        if (c1 == null || _.trim(c1) === '') {
          c1 = '-';
        }
        methodsTree[c1] = methodsTree[c1] ?? [];

        m1.nameMethod = k1;
        m1.usage = usage?.replace('<method>', k1);
        methodsTree[c1].push(m1);
      });
    }

    return methodsTree;
  }, [helpRes]);

  const calcSearchFromFG = useCallback(
    (fg1, isThisProjectParam = false) => {
      let sql1 = fg1.functionSourceCode ? 'Code' : 'SQL';

      let detail1: any = {};
      let sqlCode1 = fg1.sql ?? fg1.functionSourceCode;
      if (!Utils.isNullOrEmpty(sqlCode1)) {
        detail1 = _.assign(detail1 ?? {}, {
          [sql1]: (
            <div
              css={`
                margin: 20px 30px;
              `}
            >
              <EditorElemForFeatureGroup readonly height={120} value={sqlCode1} lang={fg1.functionSourceCode != null ? 'python' : null} />
            </div>
          ),
        });
      }

      let resRelated: ISearchResOne[] = [];
      if (fg1.sourceTables != null && fg1.sourceTables.length > 0) {
        fg1.sourceTables.some((st1) => {
          resRelated.push({
            type: 'tablename',
            id: st1,
            name: st1,
            link: () => {
              let st1 = fg1.sourceTableInfos?.find((s1) => s1.sourceTable === st1)?.datasetId;
              if (st1 != null) {
                Location.push('/' + PartsLink.dataset_detail + '/' + st1 + '/' + projectId);
                return;
              }

              REClient_.client_().describeFeatureGroupByTableName(st1, null, (err, res) => {
                let pp = res?.result?.projects?.map((p1) => p1?.projectId);
                let p1 = '-';
                if (pp?.includes(projectId)) {
                  p1 = '' + projectId;
                } else if (pp?.length === 1) {
                  p1 = pp[0];
                }

                let id1 = res?.result?.featureGroupId;
                if (id1 != null) {
                  Location.push('/' + PartsLink.feature_group_detail + '/' + p1 + '/' + id1);
                } else {
                  let id1 = res?.result?.datasetId;
                  if (id1) {
                    Location.push('/' + PartsLink.dataset_detail + '/' + id1 + (p1 === '-' ? '' : '/' + p1));
                  }
                }
              });
            },
          });
        });

        if (resRelated.length > 0) {
          detail1['Related Tables'] = (
            <div
              css={`
                margin: 20px 30px;
              `}
            >
              {resRelated?.map((r2, r2ind) => {
                return <SearchResOne onClickLink={onClickLink} filterText={filterTextBounced} key={'related_' + r2ind} data={r2} searchInList={searchInListAll} noDetails />;
              })}
            </div>
          );
        }
      }
      if (!isThisProjectParam && detail1 && projectId) {
        detail1['_Attach'] = () => {
          REClient_.client_().attachFeatureGroupToProject(fg1.featureGroupId, projectId, Constants.custom_table, (err, res) => {
            StoreActions.getProjectsById_(projectId);
            StoreActions.getProjectDatasets_(projectId, (res, ids) => {
              StoreActions.listDatasets_(ids);
            });
            StoreActions.featureGroupsGetByProject_(projectId);
            StoreActions.featureGroupsDescribe_(projectId, fg1.featureGroupId);

            Location.push('/' + PartsLink.feature_groups + '/' + projectId);
          });

          return true;
        };
      }

      return {
        type: 'fg',
        id: fg1.featureGroupId,
        name: fg1.tableName,
        status: fg1.status,
        link: '/' + PartsLink.feature_group_detail + '/' + '-' + '/' + fg1.featureGroupId,
        isThisProject: isThisProjectParam,
        date: fg1.createdAt,

        detail: detail1,
      } as ISearchResOne;
    },
    [projectId, searchInListAll, filterTextBounced],
  );

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (_.trim(filterTextBounced || '') === '') {
      setSearchResProjects(null);
      setSearchResFeatureGroups(null);
      setSearchResDatasets(null);
      return;
    }

    const maxCount = inSel?.id != null ? 30 : 3;
    const doProjects = () => {
      REClient_.client_()._listProjectsDashboard(undefined, maxCount, undefined, filterTextBounced, undefined, undefined, (err, res) => {
        let rr: ISearchResOne[] = [];
        res?.result?.projects?.some((p1) => {
          rr.push({
            type: 'projects',
            id: p1.projectId,
            name: p1.name,
            status: p1.status ?? p1.lifecycle,
            link: '/' + PartsLink.project_dashboard + '/' + p1.projectId,
            isThisProject: p1.projectId === projectId,
            date: p1.createdAt,
          });
        });
        setSearchResProjects(rr);
      });
    };
    const doDatasets = () => {
      let rr: ISearchResOne[] = [];
      datasetsList?.some((d1) => {
        if (Utils.searchIsTextInside(d1?.name?.toLowerCase(), filterTextBounced)) {
          rr.push({
            type: 'datasets',
            id: d1.datasetId,
            name: d1.name,
            status: d1.status ?? d1.lifecycle,
            link: '/' + PartsLink.dataset_detail + '/' + d1.datasetId,
            isThisProject: false,
            date: d1.createdAt,
          });

          if (rr.length >= maxCount) {
            return true;
          }
        }
      });
      setSearchResDatasets(rr);
    };
    const doFG = () => {
      REClient_.client_()._listFeatureGroupsDashboard(null, maxCount, undefined, filterTextBounced, null, (err, res) => {
        let rr: ISearchResOne[] = [];
        res?.result?.some((fg1) => {
          rr.push(calcSearchFromFG(fg1));
        });
        setSearchResFeatureGroups(rr);
      });
    };

    if (inSel?.id == null) {
      doProjects();
      doDatasets();
      doFG();
    } else {
      switch (inSel?.id) {
        case 'projects':
          doProjects();
          break;

        case 'datasets':
          doDatasets();
          break;

        case 'fg':
          doFG();
          break;
        case 'tablename':
          break;

        case 'models':
          break;

        case 'deploys':
          break;

        case 'help':
          break;
      }
    }
  }, [inSel, filterTextBounced, projectId, calcSearchFromFG, isVisible]);

  const calcDetailForDeploy = (d1) => {
    if (!d1) {
      return null;
    }

    let status1 = d1.status;
    let deployId = d1.deploymentId;

    let det1: any = {};
    if ([DeploymentLifecycle.ACTIVE].includes(status1)) {
      det1['_Stop'] = () => {
        REClient_.client_().stopDeployment(deployId, (err, res) => {
          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersions_(deployId);
          StoreActions.refreshDoDeployAll_(deployId, projectId);
        });
      };
    } else if ([DeploymentLifecycle.STOPPED, DeploymentLifecycle.CANCELLED, DeploymentLifecycle.FAILED].includes(status1)) {
      det1['_Re-Start'] = () => {
        REClient_.client_().startDeployment(deployId, (err, res) => {
          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersions_(deployId);
          StoreActions.refreshDoDeployAll_(deployId, projectId);
        });
      };
    }

    return det1;
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let res: ISearchResOne[] = [];

    const doThisDatasets = (max = null) => {
      if (datasetsListInProject) {
        let c1 = 0;
        datasetsListInProject.some((d1) => {
          if (Utils.searchIsTextInside(d1.dataset?.name?.toLowerCase(), filterTextBounced)) {
            c1++;
            res.push({
              type: 'datasets',
              id: d1.dataset?.datasetId,
              name: d1.dataset?.name,
              status: d1.status,
              link: '/' + PartsLink.dataset_detail + '/' + d1.dataset?.datasetId + '/' + projectId + '/',
              isThisProject: true,
              date: d1.dataset?.createdAt,
            });

            if (max != null && c1 >= max) {
              return true;
            }
          }
        });
      }
    };
    const doThisFG = (max = null) => {
      if (fgInProject) {
        let c1 = 0;
        fgInProject.some((fg1: any) => {
          if (Utils.searchIsTextInside(fg1.tableName?.toLowerCase(), filterTextBounced)) {
            c1++;
            res.push(calcSearchFromFG(fg1, true));

            if (max != null && c1 >= max) {
              return true;
            }
          }
        });
      }
    };

    if (Utils.isNullOrEmpty(inSel?.id)) {
      if (foundProject1 && Utils.searchIsTextInside(foundProject1?.name?.toLowerCase(), filterTextBounced)) {
        res.push({
          type: 'projects',
          id: foundProject1.projectId,
          name: foundProject1.name,
          status: foundProject1.status ?? foundProject1.lifecycle,
          link: '/' + PartsLink.project_dashboard + '/' + foundProject1.projectId,
          isThisProject: true,
        });
      }

      let resBefore = res.length;
      doThisDatasets(3);
      doThisFG(3);
      if (res.length !== resBefore) {
        res.push({
          isSeparator: true,
        });
      }

      if (searchResProjects != null) {
        res = res.concat(searchResProjects);
      }
      if (searchResDatasets) {
        res = res.concat(searchResDatasets);
      }
      if (searchResFeatureGroups) {
        res = res.concat(searchResFeatureGroups);
      }
    } else {
      switch (inSel?.id) {
        case 'projects':
          if (foundProject1 && Utils.searchIsTextInside(foundProject1?.name?.toLowerCase(), filterTextBounced)) {
            res.push({
              type: 'projects',
              id: foundProject1.projectId,
              name: foundProject1.name,
              status: foundProject1.status ?? foundProject1.lifecycle,
              link: '/' + PartsLink.project_dashboard + '/' + foundProject1.projectId,
              isThisProject: true,
              date: foundProject1.createdAt,
            });
          }
          if (searchResProjects != null) {
            res = res.concat(searchResProjects);
          }
          break;

        case 'datasets':
          doThisDatasets();
          if (searchResDatasets) {
            res = res.concat(searchResDatasets);
          }
          break;

        case 'fg':
          doThisFG();
          if (searchResFeatureGroups) {
            res = res.concat(searchResFeatureGroups);
          }
          break;

        case 'tablename':
          break;

        case 'models':
          if (modelsListInProject) {
            modelsListInProject?.toJS().some((m1) => {
              if (Utils.searchIsTextInside(m1.name?.toLowerCase(), filterTextBounced)) {
                res.push({
                  type: 'models',
                  id: m1.modelId,
                  name: m1.name,
                  date: m1.latestModelVersion?.trainingCompletedAt ?? m1.createdAt,
                  status: m1.latestModelVersion?.status,
                  link: '/' + PartsLink.model_detail + '/' + m1.modelId + '/' + projectId,
                  isThisProject: true,
                  detail: {
                    Metrics: () => {
                      Location.push('/' + PartsLink.model_metrics + '/' + projectId, undefined, 'detailModelId=' + m1.modelId);
                      return true;
                    },
                    Deploy: () => {
                      Location.push('/' + PartsLink.deploy_create + '/' + m1.modelId + '/' + projectId);
                      return true;
                    },
                  },
                });
              }
            });
          }
          break;

        case 'deploys':
          if (deploymentsListInProject) {
            deploymentsListInProject?.some((d1) => {
              if (Utils.searchIsTextInside(d1.name?.toLowerCase(), filterTextBounced)) {
                res.push({
                  type: 'deploys',
                  id: d1.deploymentId,
                  name: d1.name,
                  status: d1.status,
                  date: d1.deployedAt,
                  link: '/' + PartsLink.deploy_detail + '/' + projectId + '/' + d1.deploymentId,
                  isThisProject: true,
                  detail: calcDetailForDeploy(d1),
                });
              }
            });
          }
          break;

        case 'help':
          if (helpTree && !Utils.isNullOrEmpty(filterTextBounced)) {
            let kk = Object.keys(helpTree);
            kk.some((k1) => {
              let hh = helpTree[k1];
              hh?.some((h1) => {
                if (Utils.searchIsTextInside(h1?.nameMethod?.toLowerCase(), filterTextBounced)) {
                  res.push({
                    type: 'help',
                    name: h1.nameMethod,
                    link: '/help/ref/' + h1.collection + '/' + h1.nameMethod,
                    newWindow: paramsProp?.get('mode') !== 'help',
                    isThisProject: false,
                    detail: {
                      Usage: (
                        <div
                          css={`
                            margin: 20px 30px;
                          `}
                        >
                          <SearchUsageMethod collection={h1.collection} nameMethod={h1.nameMethod} />
                        </div>
                      ),
                    },
                  });
                }
              });
            });
          }
          break;

        case 'errors':
          if (searchResErrors) {
            searchResErrors.some((e1) => {
              if (Utils.searchIsTextInside(e1?.name?.toLowerCase(), filterTextBounced)) {
                res.push(e1);
              }
            });
          }
          break;
      }
    }

    if (idFindLast.current != null) {
      res ??= [];
      res.push(idFindLast.current);
    }
    setResList(res);
  }, [
    isVisible,
    inSel,
    searchResErrors,
    helpTree,
    datasetsListInProject,
    foundProject1,
    deploymentsListInProject,
    modelsListInProject,
    fgInProject,
    projectId,
    searchResProjects,
    searchResFeatureGroups,
    searchResDatasets,
    filterTextBounced,
  ]);

  const hashIdFindRef = useRef(uuid.v1());
  const idFindLast = useRef(null);
  useEffect(() => {
    hashIdFindRef.current = uuid.v1();
    idFindLast.current = null;

    if (!Utils.isNullOrEmpty(filterTextBounced) && _.isString(filterTextBounced)) {
      if (filterTextBounced.length > 3 && filterTextBounced.length < 16) {
        if (/^[0-9a-z]+$/gi.test(filterTextBounced) && /[0-9]+/.test(filterTextBounced)) {
          let pp = [];
          pp.push(
            new Promise((resolve) => {
              REClient_.client_().describeProject(filterTextBounced, (err, res) => {
                if (res?.result?.projectId != null && res?.result?.name != null) {
                  let foundProject1 = res?.result;
                  resolve({
                    type: 'projects',
                    id: foundProject1.projectId,
                    name: foundProject1.name,
                    status: foundProject1.status ?? foundProject1.lifecycle,
                    link: '/' + PartsLink.project_dashboard + '/' + foundProject1.projectId,
                    isThisProject: true,
                    date: foundProject1.createdAt,
                  });
                } else {
                  resolve(null);
                }
              });
            }),
          );
          pp.push(
            new Promise((resolve) => {
              REClient_.client_()._describeDataset(filterTextBounced, (err, res) => {
                if (res?.result?.datasetId != null && res?.result?.name != null) {
                  let d1 = res?.result;
                  resolve({
                    type: 'datasets',
                    id: d1.datasetId,
                    name: d1.name,
                    status: d1.lastVersion?.status,
                    link: '/' + PartsLink.dataset_detail + '/' + d1.datasetId,
                    isThisProject: true,
                    date: d1.createdAt,
                  });
                } else {
                  resolve(null);
                }
              });
            }),
          );
          pp.push(
            new Promise((resolve) => {
              REClient_.client_().describeFeatureGroup(filterTextBounced, (err, res) => {
                if (res?.result?.featureGroupId != null) {
                  let fg1 = res?.result;
                  resolve(calcSearchFromFG(fg1));
                } else {
                  resolve(null);
                }
              });
            }),
          );
          pp.push(
            new Promise((resolve) => {
              REClient_.client_().describeModel(filterTextBounced, (err, res) => {
                if (res?.result?.modelId != null) {
                  let m1 = res?.result;
                  let pid = m1?.projectId ?? projectId;
                  resolve({
                    type: 'models',
                    id: m1.modelId,
                    name: m1.name,
                    date: m1.latestModelVersion?.trainingCompletedAt ?? m1.createdAt,
                    status: m1.latestModelVersion?.status,
                    link: '/' + PartsLink.model_detail + '/' + m1.modelId + '/' + pid,
                    isThisProject: true,
                    detail: {
                      Metrics: () => {
                        Location.push('/' + PartsLink.model_metrics + '/' + pid, undefined, 'detailModelId=' + m1.modelId);
                        return true;
                      },
                      Deploy: () => {
                        Location.push('/' + PartsLink.deploy_create + '/' + m1.modelId + '/' + pid);
                        return true;
                      },
                    },
                  });
                } else {
                  resolve(null);
                }
              });
            }),
          );
          pp.push(
            new Promise((resolve) => {
              REClient_.client_().describeDeployment(filterTextBounced, (err, res) => {
                if (res?.result?.deploymentId != null) {
                  let d1 = res?.result;
                  resolve({
                    type: 'deploys',
                    id: d1.deploymentId,
                    name: d1.name,
                    status: d1.status,
                    date: d1.deployedAt,
                    link: '/' + PartsLink.deploy_detail + '/' + (d1.projectId ?? projectId) + '/' + d1.deploymentId,
                    isThisProject: true,
                    detail: calcDetailForDeploy(d1),
                  });
                } else {
                  resolve(null);
                }
              });
            }),
          );

          let lastId = hashIdFindRef.current;
          Promise.all(pp).then((res) => {
            if (hashIdFindRef.current !== lastId) {
              return;
            }

            let r1 = res?.find((r1) => r1 != null);
            if (r1 != null) {
              idFindLast.current = r1;

              setResList((list) => {
                let res = [...(list ?? [])];
                res = res.concat([r1]);

                return res;
              });
            }
          });
        }
      }
    }
  }, [filterTextBounced]);

  const onClickDetail = (data1) => {
    setResList((list) => {
      list = list?.map((r1) => {
        if (r1 !== data1) {
          r1.detailIsOpen = {};
          r1 = { ...r1 };
        }
        return r1;
      });

      return list;
    });
  };

  const onChangeText = (e) => {
    let v1 = e.target.value;
    setFilterText(v1);

    if (refFilterBounced.current != null) {
      clearTimeout(refFilterBounced.current);
      refFilterBounced.current = null;
    }

    refFilterBounced.current = setTimeout(() => {
      setFilterTextBounced(v1);
    }, 400);
  };

  const onClickClearText = (e) => {
    if (refFilterBounced.current != null) {
      clearTimeout(refFilterBounced.current);
      refFilterBounced.current = null;
    }

    setFilterText((s1) => {
      if (Utils.isNullOrEmpty(s1)) {
        props.onHide?.();
      }
      s1 = '';

      return s1;
    });
    setFilterTextBounced('');
  };

  const onKeyDownInput = (e) => {
    if (e.key?.toLowerCase() === 'escape') {
      props.onHide?.();
    }
  };

  const onKeyPressInput = (e) => {
    if (e.key?.toLowerCase() === 'enter') {
      if (refFilterBounced.current != null) {
        clearTimeout(refFilterBounced.current);
        refFilterBounced.current = null;
      }

      setFilterText((t1) => {
        setFilterTextBounced(t1);
        return t1;
      });
    }
  };

  return ReactDOM.createPortal(
    <>
      {isVisible && (
        <div
          onMouseDown={onMouseDownParent}
          css={`
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 500;
          `}
        ></div>
      )}
      {isVisible && (
        <div
          css={`
            display: flex;
            flex-direction: column;
            color: white;
            box-shadow: 0 0 12px rgba(0, 0, 0, 0.8);
            z-index: 501;
            font-family: Matter;
            font-size: 14px;
            position: absolute;
            top: 8px;
            left: ${props.posLeft + 30}px;
            width: 940px;
            max-width: 80%;
            height: 440px;
            max-height: 60%;
            border-radius: 10px;
            background: #142321;
          `}
        >
          <div
            css={`
              height: 45px;
              padding: 0 25px;
              display: flex;
              align-items: center;
              border-bottom: 1px solid rgba(255, 255, 255, 0.14);
            `}
          >
            <div
              css={`
                display: flex;
                width: 100%;
                flex-wrap: wrap;
              `}
            >
              <div css={``}>
                {inSel != null &&
                  [inSel].map((s1, s1ind) => {
                    return (
                      <div
                        key={'s' + s1ind}
                        css={`
                          cursor: ${props.isValidate ? 'default' : 'pointer'};
                          font-size: 12px;
                          background: #36373b;
                          border-radius: 4px;
                          padding: 3px 12px 4px;
                          display: inline-flex;
                          align-items: center;
                          white-space: nowrap;
                          margin-right: 10px;
                        `}
                        onClick={props.isValidate ? null : onClickInSel.bind(null, null)}
                      >
                        {s1?.icon != null && (
                          <span
                            css={`
                              margin-right: 6px;
                            `}
                          >
                            <FontAwesomeIcon icon={s1?.icon} transform={{ size: 14, x: 0, y: 0 }} />
                          </span>
                        )}
                        {s1?.name}

                        {!props.isValidate && (
                          <span
                            css={`
                              margin-left: 6px;
                            `}
                          >
                            <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTimes').faTimes} transform={{ size: 14, x: 0, y: 0 }} />
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
              <span
                css={`
                  margin-right: 7px;
                  align-self: center;
                  opacity: 0.9;
                `}
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faSearch').faSearch} transform={{ size: 14, x: 0, y: 0 }} />
              </span>

              <input
                autoFocus={true}
                onKeyPress={onKeyPressInput}
                onKeyDown={onKeyDownInput}
                value={filterText}
                onChange={onChangeText}
                placeholder={'Search'}
                css={`
                  outline: none !important;
                  color: white;
                  border: none;
                  font-family: Matter;
                  font-size: 14px;
                  flex: 1;
                  background: transparent;
                `}
              />

              <span
                css={`
                  margin-left: 7px;
                  align-self: center;
                  cursor: pointer;
                `}
                onClick={onClickClearText}
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTimes').faTimes} transform={{ size: 18, x: 0, y: 0 }} />
              </span>
            </div>
          </div>

          <div
            css={`
              margin: 5px 20px;
              display: flex;
              align-items: center;
              flex-wrap: wrap;
            `}
          >
            {searchInList?.map((s1, s1ind) => {
              if (s1?.isSeparator) {
                return (
                  <div
                    css={`
                      margin-left: 5px;
                      border-left: 1px solid rgba(255, 255, 255, 0.2);
                      height: 24px;
                      padding-left: 5px;
                    `}
                    key={'sep' + s1ind}
                  ></div>
                );
              }

              let isSel = inSel != null && s1?.id === inSel?.id;

              const col1 = '#36373b';
              return (
                <div
                  key={'s' + s1ind}
                  css={`
                    cursor: pointer;
                    &:hover {
                      background: ${color(col1).lighten(isSel ? 0.5 : 0.3)};
                    }
                    background: ${isSel ? color(col1).lighten(0.5) : col1};
                    border-radius: 4px;
                    padding: 5px 14px 6px;
                    white-space: nowrap;
                    display: inline-block;
                    margin: 5px;
                  `}
                  onClick={props.isValidate ? null : onClickInSel.bind(null, s1)}
                >
                  {s1?.icon != null && (
                    <span
                      css={`
                        margin-right: 6px;
                      `}
                    >
                      <FontAwesomeIcon icon={s1?.icon} transform={{ size: 14, x: 0, y: 0 }} />
                    </span>
                  )}
                  {s1?.name}
                </div>
              );
            })}
          </div>

          <div
            css={`
              position: relative;
              flex: 1;
            `}
          >
            <AutoSizer disableWidth>
              {({ height }) => (
                <div className={sd.absolute} css={``}>
                  <NanoScroller onlyVertical>
                    <div>
                      {resList?.slice(0, 150)?.map((r1, r1ind) => {
                        return (
                          <SearchResOne maxTextLen={props.isValidate ? 130 : undefined} onClickLink={onClickLink} filterText={filterTextBounced} key={'sro' + r1ind} data={r1} searchInList={searchInListAll} onClickDetail={onClickDetail} />
                        );
                      })}
                    </div>
                  </NanoScroller>
                </div>
              )}
            </AutoSizer>
          </div>
        </div>
      )}
    </>,
    document.getElementById('container'),
  );
});

export default SearchAll;
