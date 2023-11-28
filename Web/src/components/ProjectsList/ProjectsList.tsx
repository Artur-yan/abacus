import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import Menu from 'antd/lib/menu';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { BatchPredLifecycle } from '../../stores/reducers/batchPred';
import { DatasetLifecycle } from '../../stores/reducers/datasets';
import { DeploymentLifecycle } from '../../stores/reducers/deployments';
import { FeatureGroupLifecycle } from '../../stores/reducers/featureGroups';
import { ModelLifecycle } from '../../stores/reducers/models';
import { ModelMonitoringLifecycle } from '../../stores/reducers/monitoring';
import { NotebookLifecycle } from '../../stores/reducers/notebooks';
import { calcProjectListLastProjectId, calcProjectListTotalCount } from '../../stores/reducers/projects';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import { IconBatch, IconDatasets, IconFeatureGroups, IconModels, IconMonitoring, IconNotebooks, IconPredictions } from '../NavLeft/utils';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TagsCloud from '../TagsCloud/TagsCloud';
import { TagOption } from '../TagsCloud/types';
import TooltipExt from '../TooltipExt/TooltipExt';
import { UserProfileSection } from '../UserProfile/UserProfile';
import globalStyles from '../antdUseDark.module.css';
import classNames from 'classnames';
import { faUpload } from '@fortawesome/pro-regular-svg-icons/faUpload';
import { faCircleEllipsis } from '@fortawesome/pro-regular-svg-icons/faCircleEllipsis';

const { confirm } = Modal;

export const topAfterHeaderHH = 60;
const topAfterHeaderPL = 70;

interface IProjectsListProps {
  paramsProp?: any;
  projects?: any;
  useCases?: any;
}

interface IProjectsListState {
  dataListShow?: any;
  filterText?: string;
  filterTagText?: string;
  onlyStarred?: boolean;
  projectTags?: any;
  tagsCloudHeight: number;
}

class ProjectsList extends React.PureComponent<IProjectsListProps, IProjectsListState> {
  private writeDeleteMeConfirm: any;
  private editNameValue: any;
  private lastFilterUuid: any;
  private isM: boolean;
  private numberProjects: boolean;
  private lastRefreshTime: any;
  private lastRefreshTimeStopped: any;
  private timerRefresh: any;
  tagsCloudRef: React.RefObject<any>;
  unFullRefreshU: any;

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let { projects, useCases } = this.props;

    this.memProjectsList(true)(projects, this.state.onlyStarred);
    this.memUseCases(true)(useCases);

    let filterText = this.props.paramsProp?.get('filter') ?? '';
    if (_.trim(filterText || '') === '') {
      filterText = null;
    } else {
      filterText = _.trim(filterText?.toLowerCase());
    }
    let filterTagText = this.props.paramsProp?.get('tag') ?? null;
    if ((filterText != null && filterText !== '') || (filterTagText != null && filterTagText !== '')) {
      let dataList = this.memFilterWithText(true)(filterText, filterTagText, projects, this.state.onlyStarred);
    }

    this.memFilterText(filterText);
    this.onTagsCloudResize(this.tagsCloudRef);
  };

  memFilterText = memoizeOne((filterText) => {
    if (!Utils.isNullOrEmpty(filterText)) {
      this.lastRefreshTimeStopped = this.lastRefreshTime;
      this.lastRefreshTime = null;
    } else {
      if (this.lastRefreshTime == null) {
        this.lastRefreshTime = this.lastRefreshTimeStopped || moment();
      }
    }
  });

  howManyProjectsInPage() {
    REClient_.client_()._listProjectsDashboard(undefined, undefined, undefined, undefined, undefined, undefined, (err, res) => {
      if (res?.result?.totalCount < 100) {
        this.numberProjects = false;
        StoreActions.getProjectsList_(this.state.onlyStarred, false, null, null, null, 100);
      } else {
        this.numberProjects = null;
      }
    });
  }

  getProjectsTags(filterText = null, isStarred = null) {
    REClient_.client_()._listProjectsTags(undefined, filterText, isStarred, (err, res) => {
      if (res?.result?.tags) {
        const tagList = res?.result?.tags;
        this.setState({
          projectTags: tagList.map(this.createTag),
        });
      } else {
        this.setState({
          projectTags: [],
        });
      }
    });
  }

  createTag(value: string): TagOption {
    return {
      value: value,
      count: 1,
    };
  }

  doTimeWorkAutoRefresh: () => void;

  componentDidUpdate(prevProps: Readonly<IProjectsListProps>, prevState: Readonly<IProjectsListState>, snapshot?: any): void {
    this.doMem();
  }

  constructor(props) {
    super(props);
    this.tagsCloudRef = React.createRef();

    this.state = {
      filterText: this.props.paramsProp?.get('filter') ?? '',
      filterTagText: this.props.paramsProp?.get('tag') ?? null,
      onlyStarred: this.props.paramsProp?.get('starred') === '1' ? true : null,
      tagsCloudHeight: 0,
    };
  }

  componentDidMount() {
    this.howManyProjectsInPage();
    this.getProjectsTags();
    this.onTagsCloudResize(this.tagsCloudRef);
    this.isM = true;

    this.doMem(false);

    this.lastRefreshTime = null;
    const doTimeWork = (time = 15 * 1000) => {
      this.timerRefresh = setTimeout(() => {
        this.timerRefresh = null;
        if (this.lastRefreshTime == null) {
          doTimeWork();
          return;
        }

        const dt1 = moment();
        let listProjects = this.memProjectsList(false)(this.props.projects, this.state.onlyStarred);
        const limit1 = (listProjects ?? []).length;
        if (limit1 === 0) {
          doTimeWork(15 * 1000);
          return;
        }

        StoreActions.getProjectsList_(this.state.onlyStarred, false, null, null, this.lastRefreshTime.unix(), limit1, null, (isOk, res) => {
          if ((res?.result?.projects || []).length > 0) {
            this.lastRefreshTime = dt1;
          }

          doTimeWork(isOk ? 15 * 1000 : 30 * 1000);
        });
      }, time);
    };
    doTimeWork();

    this.doTimeWorkAutoRefresh = () => {
      if (this.timerRefresh) {
        clearTimeout(this.timerRefresh);
        this.timerRefresh = null;
      }
      doTimeWork(1);
    };

    this.unFullRefreshU = REActions.fullRefreshHappened.listen(this.fullRefreshHappened);
  }

  fullRefreshHappened = () => {
    this.numberProjects = null;
    this.howManyProjectsInPage();
    this.getProjectsTags();
    this.onTagsCloudResize(this.tagsCloudRef);
  };

  componentWillUnmount() {
    if (this.timerRefresh) {
      clearTimeout(this.timerRefresh);
      this.timerRefresh = null;
    }
    this.lastRefreshTime = null;

    this.isM = false;

    this.unFullRefreshU?.();
  }

  lastRefreshTimeAlready = false;
  memProjectsList = memoizeOneCurry((doCall, projects, isStarred) => {
    if (projects) {
      let res = projects.get('list' + (isStarred ? 'Starred' : ''));
      if (res != null && this.lastRefreshTime != null) {
        return res;
      }

      if (projects.get('isRefreshing')) {
        return;
      }

      // if(projects.get('needRefresh')) {
      if (doCall) {
        StoreActions.getProjectsList_(isStarred, null, null, null, null, this.numberProjects === false ? 100 : null);
        this.lastRefreshTime = moment();
      }
      // }
    }
  });

  onClickViewProject = (projectId, e?) => {
    Location.push('/' + PartsLink.project_dashboard + '/' + projectId, undefined, 'doUpload=true');
  };

  onTagsCloudResize(tagCloud) {
    this.setState({
      tagsCloudHeight: tagCloud?.current ? tagCloud.current.clientHeight + 16 : 0,
    });
  }

  memUseCases = memoizeOneCurry((doCall, useCases) => {
    if (useCases) {
      if (useCases.get('isRefreshing')) {
        return;
      }

      if (useCases.get('neverDone')) {
        if (doCall) {
          StoreActions.getUseCases_();
        }
      } else {
        return useCases.get('list');
      }
    }
  });

  memFilterWithTextListStatic = [];
  memFilterWithText = memoizeOneCurry((doCall, filterText, filterTagText, projects, isStarred) => {
    if (projects) {
      let res = projects.get('listFilter' + (isStarred ? 'Starred' : ''));

      let lastText = projects.get('listFilterText');
      let lastTagText = projects.get('listFilterTagText');
      if (filterText !== lastText || filterTagText != lastTagText) {
        res = null;
      }

      if (res != null) {
        return res;
      }

      if (projects.get('isRefreshing')) {
        return this.memFilterWithTextListStatic;
      }

      if (doCall) {
        StoreActions.getProjectsList_(isStarred, true, filterText, null, null, 50, filterTagText);
      }
    }
    return this.memFilterWithTextListStatic;
  });

  memCalcProjectList = memoizeOneCurry((type1, listProjects, useCases) => {
    let res = [],
      anyData = false;
    listProjects.some((p1) => {
      let createdString: any = '',
        createdForSort: any = '';
      if (p1.createdAt) {
        let dt1 = moment(p1.createdAt);
        if (dt1.isValid()) {
          createdString = dt1.format('LLL');
          createdForSort = dt1.unix(); //format('YYYY/MM/DD HH:mm:ss');
        }
      }

      let useCase = p1.useCase;
      let useCaseInfo = useCases?.find((u1) => u1.useCase === useCase);
      let useCaseOne = !useCaseInfo ? '-' : useCaseInfo.prettyName;
      let useCaseImgSrc = !useCaseInfo ? '' : useCaseInfo.imgSrc;
      let createdBy = p1.createdBy;

      let strFilter = '';
      if (p1.name) {
        strFilter += ' ' + p1.name.toLowerCase();
      }
      if (useCaseOne) {
        strFilter += ' ' + useCaseOne.toLowerCase();
      }

      let datasetCountComplete = 0,
        datasetCountProcessing = 0,
        datasetCountError = 0;
      let isDatasetProcessing = p1.allProjectDatasets?.some((dataset) => {
        return dataset?.status?.toLowerCase() == DatasetLifecycle.INSPECTING.toLowerCase() || dataset?.status?.toLowerCase() == DatasetLifecycle.UPLOADING.toLowerCase();
      });
      p1.allProjectDatasets?.some((dataset) => {
        const status1 = dataset?.dataset?.lastVersion?.status?.toUpperCase();
        if ([DatasetLifecycle.COMPLETE].includes(status1 || '-')) {
          datasetCountComplete++;
        } else if ([DatasetLifecycle.CONVERTING, DatasetLifecycle.INSPECTING, DatasetLifecycle.UPLOADING, DatasetLifecycle.PENDING, DatasetLifecycle.IMPORTING].includes(status1 || '-')) {
          datasetCountProcessing++;
        } else {
          datasetCountError++;
        }
      });

      let batchPredictionsComplete = 0,
        batchPredictionsProcessing = 0,
        batchPredictionsError = 0;
      let isProjectBatchPredictions = p1.allProjectBatchPredictions?.some((bp) => {
        return bp?.status?.toLowerCase() == BatchPredLifecycle.PREDICTING.toLowerCase() || bp?.status?.toLowerCase() == BatchPredLifecycle.UPLOADING.toLowerCase();
      });
      p1.allProjectBatchPredictions?.some((bp) => {
        const status1 = bp?.status?.toUpperCase();
        if ([BatchPredLifecycle.COMPLETE].includes(status1 || '-')) {
          batchPredictionsComplete++;
        } else if ([BatchPredLifecycle.PENDING, BatchPredLifecycle.PREDICTING, BatchPredLifecycle.UPLOADING].includes(status1 || '-')) {
          batchPredictionsProcessing++;
        } else {
          batchPredictionsError++;
        }
      });

      let notebooksComplete = 0,
        notebooksProcessing = 0,
        notebooksError = 0,
        notebooksStopped = 0;
      let isNotebooks = p1.allProjectNotebooks?.some((data) => {
        return data?.status?.toLowerCase() == NotebookLifecycle.PENDING.toLowerCase() || data?.status?.toLowerCase() == NotebookLifecycle.INITIALIZING.toLowerCase();
      });
      p1.allProjectNotebooks?.some((data) => {
        const status1 = data?.status?.toUpperCase();
        if ([NotebookLifecycle.ACTIVE].includes(status1 || '-')) {
          notebooksComplete++;
        } else if ([NotebookLifecycle.STOPPED].includes(status1 || '-')) {
          notebooksStopped++;
        } else if ([NotebookLifecycle.PENDING, NotebookLifecycle.DEPLOYING, NotebookLifecycle.INITIALIZING].includes(status1 || '-')) {
          notebooksProcessing++;
        } else {
          notebooksError++;
        }
      });

      let modelMonitorsComplete = 0,
        modelMonitorsProcessing = 0,
        modelMonitorsError = 0;
      let isModelMonitors = p1.allProjectModelMonitors?.some((model) => {
        return model?.status?.toLowerCase() == ModelMonitoringLifecycle.MONITORING.toLowerCase() || model?.status?.toLowerCase() == ModelMonitoringLifecycle.PENDING.toLowerCase();
      });
      p1.allProjectModelMonitors?.some((model) => {
        const status1 = model?.status?.toUpperCase();
        if ([ModelMonitoringLifecycle.COMPLETE].includes(status1 || '-')) {
          modelMonitorsComplete++;
        } else if ([ModelMonitoringLifecycle.PENDING, ModelMonitoringLifecycle.MONITORING].includes(status1 || '-')) {
          modelMonitorsProcessing++;
        } else {
          modelMonitorsError++;
        }
      });

      let featureGroupsComplete = 0,
        featureGroupsProcessing = 0,
        featureGroupsError = 0;
      let isFeatureGroups = p1.allProjectFeatureGroups?.some((data) => {
        return data?.status?.toLowerCase() == FeatureGroupLifecycle.GENERATING.toLowerCase();
      });
      p1.allProjectFeatureGroups?.some((data) => {
        const status1 = data?.status?.toUpperCase();
        if ([FeatureGroupLifecycle.COMPLETE].includes(status1 || '-')) {
          featureGroupsComplete++;
        } else if ([FeatureGroupLifecycle.PENDING, FeatureGroupLifecycle.GENERATING].includes(status1 || '-')) {
          featureGroupsProcessing++;
        } else {
          featureGroupsError++;
        }
      });

      let modelCountComplete = 0,
        modelCountProcessing = 0,
        modelCountError = 0;
      let isTraining = p1.allProjectModels?.some((model) => {
        return model?.status?.toLowerCase() == ModelLifecycle.TRAINING.toLowerCase() || model?.status?.toLowerCase() == ModelLifecycle.PENDING.toLowerCase();
      });
      p1.allProjectModels?.some((model) => {
        const status1 = model?.lastVersion?.status?.toUpperCase();
        if ([ModelLifecycle.COMPLETE].includes(status1 || '-')) {
          modelCountComplete++;
        } else if ([ModelLifecycle.PENDING, ModelLifecycle.UPLOADING, ModelLifecycle.TRAINING, ModelLifecycle.EVALUATING].includes(status1 || '-')) {
          modelCountProcessing++;
        } else {
          modelCountError++;
        }
      });
      let isActive = p1.allProjectDeployments?.some((deployment) => {
        return deployment?.status?.toLowerCase() == DeploymentLifecycle.ACTIVE.toLowerCase() || deployment?.status?.toLowerCase() == DeploymentLifecycle.PENDING.toLowerCase();
      });
      let isDeploying = p1.allProjectDeployments?.some((deployment) => {
        return deployment?.status?.toLowerCase() == DeploymentLifecycle.DEPLOYING.toLowerCase();
      });
      anyData = true;
      let modelFromDeployId = p1.allProjectDeployments?.[0]?.deploymentId;
      let deploymentCountComplete = 0,
        deploymentCountSuspended = 0,
        deploymentCountFailed = 0;
      p1.allProjectDeployments?.some((deployment) => {
        const status1 = deployment?.status?.toUpperCase();
        if ([DeploymentLifecycle.ACTIVE, DeploymentLifecycle.STOPPING].includes(status1 || '-')) {
          modelFromDeployId = deployment?.deploymentId;
          deploymentCountComplete++;
        } else if ([DeploymentLifecycle.STOPPED, DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING, DeploymentLifecycle.DELETING].includes(status1 || '-')) {
          deploymentCountSuspended++;
        } else {
          deploymentCountFailed++;
        }
      });

      const colorsNumbers = (list: { extra?; color?; count?; title? }[], linkTo?: any, extraElem?: any) => {
        list = list?.filter((o1) => o1.count > 0);
        list ??= [];
        if (extraElem != null) {
          list.push({ extra: extraElem });
        }
        let res = (
          <span>
            {_.flatten(
              list.map((o1, o1ind) => {
                if (o1?.extra != null) {
                  return [<span key={'ex' + o1ind}>{o1.extra}</span>];
                }

                let res = (
                  <span
                    key={'col' + o1ind}
                    css={`
                      color: ${o1.color};
                    `}
                    title={o1.title}
                  >
                    &nbsp;{o1.count}&nbsp;
                  </span>
                );
                let res2 = null;
                if (o1ind < list.length - 1) {
                  res2 = (
                    <span
                      key={'plus' + o1ind}
                      css={`
                        color: white;
                        opacity: 0.7;
                      `}
                    >
                      +
                    </span>
                  );
                }
                let res3 = null;
                if (o1ind === 1 && res2 != null) {
                  res3 = <br key={'br' + o1ind} />;
                }
                return [res, res2, res3];
              }),
            )}
          </span>
        );

        if (linkTo != null) {
          res = (
            <Link to={linkTo} usePointer forceSpanUse useUnderline>
              {res}
            </Link>
          );
        }

        return res;
      };

      let projectId = p1?.projectId;
      if (projectId === '') {
        projectId = null;
      }

      const datasetCountElemTotal = (datasetCountComplete ?? 0) + (datasetCountProcessing ?? 0) + (datasetCountError ?? 0);
      const datasetCountElem = colorsNumbers(
        [
          { color: '#6ddc49', count: datasetCountComplete, title: 'Active' },
          { color: '#a59745', count: datasetCountProcessing, title: 'Processing' },
          { color: '#d93a22', count: datasetCountError, title: 'Failed' },
        ],
        !projectId ? null : '/' + PartsLink.dataset_list + '/' + projectId,
        isDatasetProcessing ? <FontAwesomeIcon title={'Processing'} icon={faUpload} transform={{ size: 15, x: -1, y: 1 }} style={{ opacity: 0.7, marginLeft: '4px' }} /> : null,
      );
      const modelCountElemTotal = (modelCountComplete ?? 0) + (modelCountProcessing ?? 0) + (modelCountError ?? 0);
      const modelCountElem = colorsNumbers(
        [
          { color: '#6ddc49', count: modelCountComplete, title: 'Trained' },
          { color: '#a59745', count: modelCountProcessing, title: 'Training' },
          { color: '#d93a22', count: modelCountError, title: 'Training Failed' },
        ],
        !projectId ? null : '/' + PartsLink.model_list + '/' + projectId,
        isTraining ? <FontAwesomeIcon title={'Model Training'} icon={['far', 'sync']} transform={{ size: 15, x: -1, y: 1 }} style={{ opacity: 0.7, marginLeft: '4px' }} spin /> : null,
      );
      const deploymentCountElemTotal = (deploymentCountComplete ?? 0) + (deploymentCountSuspended ?? 0) + (deploymentCountFailed ?? 0);
      const deploymentCountElem = colorsNumbers(
        [
          { color: '#6ddc49', count: deploymentCountComplete, title: 'Active' },
          { color: '#a59745', count: deploymentCountSuspended, title: 'Suspended' },
          { color: '#d93a22', count: deploymentCountFailed, title: 'Deployment Failed' },
        ],
        !projectId ? null : '/' + PartsLink.deploy_list + '/' + projectId,
        isDeploying ? <FontAwesomeIcon title={'Deploying'} icon={['fas', 'circle']} transform={{ size: 15, x: -1, y: 1 }} style={{ opacity: 0.7, color: 'yellow', marginLeft: '4px' }} /> : null,
      );
      const BatchElemTotal = (batchPredictionsComplete ?? 0) + (batchPredictionsProcessing ?? 0) + (batchPredictionsError ?? 0);
      const BatchElem = colorsNumbers(
        [
          { color: '#6ddc49', count: batchPredictionsComplete, title: 'Active' },
          { color: '#a59745', count: batchPredictionsProcessing, title: 'Predicting' },
          { color: '#d93a22', count: batchPredictionsError, title: 'Batch Failed' },
        ],
        !projectId ? null : ['/' + PartsLink.deploy_batch + '/' + projectId, 'showList=true'],
        isProjectBatchPredictions ? <FontAwesomeIcon title={'Predicting'} icon={['fas', 'circle']} transform={{ size: 15, x: -1, y: 1 }} style={{ opacity: 0.7, color: 'yellow', marginLeft: '4px' }} /> : null,
      );
      const featureGroupsElemTotal = (featureGroupsComplete ?? 0) + (featureGroupsProcessing ?? 0) + (featureGroupsError ?? 0);
      const featureGroupsElem = colorsNumbers(
        [
          { color: '#6ddc49', count: featureGroupsComplete, title: 'Active' },
          { color: '#a59745', count: featureGroupsProcessing, title: 'Materializing' },
          { color: '#d93a22', count: featureGroupsError, title: 'Feature Groups Failed' },
        ],
        !projectId ? null : '/' + PartsLink.feature_groups + '/' + projectId,
        isFeatureGroups ? <FontAwesomeIcon title={'Feature Groups Materializing'} icon={['fas', 'circle']} transform={{ size: 15, x: -1, y: 1 }} style={{ opacity: 0.7, color: 'yellow', marginLeft: '4px' }} /> : null,
      );
      const notebooksElemTotal = (notebooksComplete ?? 0) + (notebooksProcessing ?? 0) + (notebooksError ?? 0) + (notebooksStopped ?? 0);
      const notebooksElem = colorsNumbers(
        [
          { color: '#6ddc49', count: notebooksComplete, title: 'Active' },
          { color: '#a59745', count: notebooksProcessing, title: 'Deploying' },
          { color: '#a59745', count: notebooksStopped, title: 'Stopped' },
          { color: '#d93a22', count: notebooksError, title: 'Offline' },
        ],
        !projectId ? null : '/' + PartsLink.notebook_list + '/' + projectId,
        isNotebooks ? <FontAwesomeIcon title={'Notebooks loading'} icon={['fas', 'circle']} transform={{ size: 15, x: -1, y: 1 }} style={{ opacity: 0.7, color: 'yellow', marginLeft: '4px' }} /> : null,
      );
      const modelMonitorsElemtotal = (modelMonitorsComplete ?? 0) + (modelMonitorsProcessing ?? 0) + (modelMonitorsError ?? 0);
      const modelMonitorsElem = colorsNumbers(
        [
          { color: '#6ddc49', count: modelMonitorsComplete, title: 'Active' },
          { color: '#a59745', count: modelMonitorsProcessing, title: 'Monitoring' },
          { color: '#d93a22', count: modelMonitorsError, title: 'Monitors Failed' },
        ],
        !projectId ? null : '/' + PartsLink.monitors_list + '/' + projectId,
        isModelMonitors ? <FontAwesomeIcon title={'Monitorings'} icon={['fas', 'circle']} transform={{ size: 15, x: -1, y: 1 }} style={{ opacity: 0.7, color: 'yellow', marginLeft: '4px' }} /> : null,
      );

      const lh1 = 1.5;
      res.push({
        strFilter,
        projectId: p1.projectId,
        name: p1.name,
        starred: !!p1.starred,
        useCaseIcon: (
          <div
            css={`
              display: flex;
              align-items: center;
              justify-content: center;
            `}
            className={globalStyles.absolute}
          >
            <TooltipExt title={useCaseOne} placement={'right'}>
              <img src={calcImgSrc('/app/imgs/' + useCaseImgSrc)} alt="" style={{ width: '24px', height: '24px' }} />
            </TooltipExt>
          </div>
        ),
        useCase: (
          <div
            css={`
              display: flex;
              align-items: center;
            `}
          >
            <img src={calcImgSrc('/app/imgs/' + useCaseImgSrc)} alt="" style={{ width: '24px', height: '24px', display: 'inline-block', marginRight: '10px' }} />
            <span
              css={`
                white-space: normal;
                line-height: 1.4;
              `}
            >
              {useCaseOne}
            </span>
          </div>
        ),
        useCaseString: useCaseOne,
        datasetCount: (
          <div
            css={`
              line-height: ${lh1};
            `}
          >
            {datasetCountElem}
          </div>
        ),
        datasetCountSort: datasetCountElemTotal,
        modelCount: (
          <div
            css={`
              line-height: ${lh1};
            `}
          >
            {modelCountElem}
          </div>
        ),
        modelCountSort: modelCountElemTotal,
        deploymentCount: (
          <div
            css={`
              line-height: ${lh1};
            `}
          >
            {deploymentCountElem}
          </div>
        ),
        deploymentCountSort: deploymentCountElemTotal,
        batchPredictions: (
          <div
            css={`
              line-height: ${lh1};
            `}
          >
            {BatchElem}
          </div>
        ),
        batchPredictionsSort: BatchElemTotal,
        featureGroups: (
          <div
            css={`
              line-height: ${lh1};
            `}
          >
            {featureGroupsElem}
          </div>
        ),
        featureGroupsSort: featureGroupsElemTotal,
        notebooks: (
          <div
            css={`
              line-height: ${lh1};
            `}
          >
            {notebooksElem}
          </div>
        ),
        notebooksSort: notebooksElemTotal,
        modelMonitoring: (
          <div
            css={`
              line-height: ${lh1};
            `}
          >
            {modelMonitorsElem}
          </div>
        ),
        modelMonitoringSort: modelMonitorsElemtotal,
        created: createdString,
        createdForSort: createdForSort,
        createdBy: createdBy,
        actions: null,
        tags: p1.tags,
      });
    });

    // res = res.sort((a, b) => {
    //   return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    // });

    return { list: res, anyData };
  });

  onClickCancelEvents = (e) => {
    // e.preventDefault();
    e.stopPropagation();
  };

  onClickAddNewProject = (e) => {
    Location.push('/' + PartsLink.project_add);
  };

  onClickVoid = (event) => {
    if (event && event.domEvent) {
      event.domEvent.stopPropagation();
    }
  };

  onClickDeleteProject = (projectId, projectName, param1) => {
    this.writeDeleteMeConfirm = '';

    confirm({
      title: 'Are you sure you want to delete this project?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>
            This will delete <b>ALL</b> trained Models and Model Deployments in the project
          </div>
          <div>{'Project Name: "' + projectName + '"'}</div>
          <div style={{}}>Write {'"delete me"'} inside the box to confirm</div>
          <Input
            style={{ marginTop: '8px', color: 'red' }}
            placeholder={'delete me'}
            defaultValue={''}
            onChange={(e) => {
              this.writeDeleteMeConfirm = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (this.writeDeleteMeConfirm === 'delete me') {
          //delete it
          REActions.addNotification('Deleting project...');

          REClient_.client_().deleteProject(projectId, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Project Deleted!');
              StoreActions.getProjectsList_();
              StoreActions.getProjectsById_(projectId);
              StoreActions.validateProjectDatasets_(projectId);
              StoreActions.getProjectDatasets_(projectId, (res, ids) => {
                StoreActions.listDatasets_(ids);
              });
              StoreActions.listModels_(projectId);

              Location.push('/' + PartsLink.project_list);
            }
          });
        } else {
          REActions.addNotificationError('You need to write "delete me" to delete the project');
          this.onClickDeleteProject(projectId, projectName, param1);
        }
      },
      onCancel: () => {
        //
      },
    });
  };

  onClickRenameProject = (projectId, projectName, param1) => {
    this.editNameValue = projectName;

    confirm({
      title: 'Rename Project',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + projectName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={projectName}
            defaultValue={projectName}
            onChange={(e) => {
              this.editNameValue = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (this.editNameValue != projectName) {
          //delete it
          REActions.addNotification('Renaming project to "' + this.editNameValue + '"');

          REClient_.client_().editProject(projectId, this.editNameValue, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Project Renamed!');
              StoreActions.listProjectsAll_();
              StoreActions.getProjectsList_();
              StoreActions.getProjectsById_(projectId);
              StoreActions.validateProjectDatasets_(projectId);
              StoreActions.getProjectDatasets_(projectId, (res, ids) => {
                StoreActions.listDatasets_(ids);
              });
              StoreActions.listModels_(projectId);

              Location.push('/' + PartsLink.project_list);
            }
          });
        }
      },
      onCancel: () => {
        //
      },
    });
  };

  onKeyDownFilterText = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.onClickFilterText(e);
    }
  };

  onChangeFilterText = (e) => {
    let v1 = e.target.value ?? '';
    this.setState({
      filterText: v1,
    });
  };

  onClickFilterTextClear = (e) => {
    this.setState({
      filterText: '',
    });
    Location.push('/' + PartsLink.project_list);
    let isStarred = this.props.paramsProp?.get('starred') === '1' ? true : null;
    this.getProjectsTags('', undefined);
  };

  onClickFilterText = (e) => {
    if (_.trim(this.state.filterText || '') === '') {
      this.onClickFilterTextClear(e);
      return;
    }

    const v1 = _.trim(this.state.filterText || '');
    if ((this.props.paramsProp?.get('filter') ?? '') !== v1) {
      Location.push('/' + PartsLink.project_list, undefined, Utils.processParamsAsQuery({ filter: v1 }, window.location.search));
    }
    let isStarred = this.props.paramsProp?.get('starred') === '1' ? true : null;
    this.getProjectsTags(v1, isStarred);
  };

  onClickProfileApiKey = (e) => {
    Location.push('/' + PartsLink.profile + '/' + UserProfileSection.apikey);
  };

  onNeedMoreProjects = () => {
    if (this.props.projects.get('isRefreshing')) {
      return;
    }

    let sinceProjectId = calcProjectListLastProjectId();
    StoreActions.getProjectsList_(this.state.onlyStarred, false, null, sinceProjectId);
  };

  onClickStarred = (projectId, isStarred, e) => {
    REClient_.client_()._starProject(projectId, isStarred, (err, res) => {
      StoreActions.getProjectsById_(projectId);

      if (!isStarred && this.state.onlyStarred) {
        this.lastRefreshTime = moment();
        StoreActions.getProjectsList_(true);
        this.doTimeWorkAutoRefresh?.();
      }

      this.doTimeWorkAutoRefresh?.();

      //
      let filterText = this.props.paramsProp?.get('filter') ?? '';
      if (_.trim(filterText || '') === '') {
        filterText = null;
      } else {
        filterText = _.trim(filterText?.toLowerCase());
      }
      let filterTagText = this.props.paramsProp?.get('tag') ?? null;
      if (!Utils.isNullOrEmpty(filterText) || !Utils.isNullOrEmpty(filterTagText)) {
        StoreActions.getProjectsList_(this.state.onlyStarred, true, filterText, null, null, 50, filterTagText);
      }

      this.forceUpdate();
    });
  };

  memColumns = memoizeOne((sortSupported) => {
    const numsWidthPx = 66 + 7;
    const fontSizeIcon = sortSupported ? '1.3em' : '1.4em';
    const fontSizeIconSmall = sortSupported ? '1.2em' : '1.4em';

    return [
      {
        title: <StarredSpan noTooltip isStarred={true} size={24} name={'Projects'} />,
        field: 'starred',
        helpId: '',
        noAutoTooltip: true,
        render: (starred, row, index) => {
          return <StarredSpan size={21} name={'Project'} isStarred={row.starred} onClick={this.onClickStarred.bind(this, row.projectId)} />;
        },
        width: 45,
        disableSort: true,
      },
      {
        title: 'Project Name',
        field: 'name',
        render: (text, row, index) => {
          let fg1 = null;

          return (
            <span className={globalStyles.linkBlue}>
              {text}
              {fg1}
            </span>
          );
        },
      },

      {
        title: 'Use Case',
        field: 'useCaseIcon',
        width: 90,
        sortField: 'useCaseString',
        hideMoreMedium: true,
      },
      {
        title: 'Use Case',
        field: 'useCase',
        width: 300,
        sortField: 'useCaseString',
        hideLessMedium: true,
      },

      {
        title: (
          <TooltipExt title={'Datasets'}>
            <FontAwesomeIcon icon={IconDatasets} style={{ fontSize: fontSizeIcon, cursor: 'pointer' }} />
          </TooltipExt>
        ),
        field: 'datasetCount',
        width: numsWidthPx,
        noAutoTooltip: true,
        sortField: 'datasetCountSort',
        align: 'center',
      },
      {
        title: (
          <TooltipExt title={'Feature Groups'}>
            <FontAwesomeIcon icon={IconFeatureGroups} style={{ fontSize: fontSizeIconSmall, cursor: 'pointer' }} />
          </TooltipExt>
        ),
        field: 'featureGroups',
        width: numsWidthPx,
        sortField: 'featureGroupsSort',
        noAutoTooltip: true,
        align: 'center',
      },
      {
        title: (
          <TooltipExt title={'Models'}>
            <FontAwesomeIcon icon={IconModels} style={{ fontSize: fontSizeIcon, cursor: 'pointer' }} />
          </TooltipExt>
        ),
        field: 'modelCount',
        width: numsWidthPx,
        noAutoTooltip: true,
        sortField: 'modelCountSort',
        align: 'center',
      },
      {
        title: (
          <TooltipExt title={'Deployments'}>
            <FontAwesomeIcon icon={IconPredictions} style={{ fontSize: fontSizeIcon, cursor: 'pointer' }} />
          </TooltipExt>
        ),
        field: 'deploymentCount',
        width: numsWidthPx,
        noAutoTooltip: true,
        sortField: 'deploymentCountSort',
        align: 'center',
      },
      {
        title: (
          <TooltipExt title={'Monitors'}>
            <FontAwesomeIcon icon={IconMonitoring} style={{ fontSize: fontSizeIconSmall, cursor: 'pointer' }} />
          </TooltipExt>
        ),
        field: 'modelMonitoring',
        width: numsWidthPx,
        noAutoTooltip: true,
        sortField: 'modelMonitoringSort',
        align: 'center',
      },
      {
        title: (
          <TooltipExt title={'Notebooks'}>
            <FontAwesomeIcon icon={IconNotebooks} style={{ fontSize: fontSizeIcon, cursor: 'pointer' }} />
          </TooltipExt>
        ),
        field: 'notebooks',
        width: numsWidthPx,
        sortField: 'notebooksSort',
        noAutoTooltip: true,
        align: 'center',
      },
      {
        title: (
          <TooltipExt title={'Batch predictions'}>
            <FontAwesomeIcon icon={IconBatch} style={{ fontSize: fontSizeIcon, cursor: 'pointer' }} />
          </TooltipExt>
        ),
        field: 'batchPredictions',
        width: numsWidthPx,
        noAutoTooltip: true,
        sortField: 'batchPredictionsSort',
        align: 'center',
      },

      {
        title: 'Created By',
        field: 'createdBy',
        width: 186,
        hideLessMedium: true,
      },
      {
        title: 'Created',
        field: 'createdForSort',
        sortField: 'createdForSort',
        width: 120,
        render: (text, row, index) => {
          return <TooltipExt title={moment.unix(text).format('LLL')}>{Utils.dateToStringShort(text)}</TooltipExt>;
        },
      },
      {
        noAutoTooltip: true,
        field: 'actions',
        width: 60,
        render: (text, row, index) => {
          let popupContainerForMenu = (node) => document.getElementById('body2');

          const menu = (
            <Menu onClick={this.onClickVoid.bind(this)} getPopupContainer={popupContainerForMenu}>
              <Menu.Item onClick={this.onClickRenameProject.bind(this, row.projectId, row.name)} style={{ color: 'black' }}>
                Edit Project
              </Menu.Item>
              <Menu.Item onClick={this.onClickDeleteProject.bind(this, row.projectId, row.name)} style={{ color: 'red' }}>
                Delete Project
              </Menu.Item>
            </Menu>
          );

          const styleButton: CSSProperties = { position: 'relative', marginLeft: '8px', borderWidth: 0, borderRadius: '0', padding: 0 };

          let res = (
            <DropdownExt overlay={menu} trigger={['click']}>
              <Button
                css={`
                  opacity: 0.8;
                  &:hover {
                    opacity: 1;
                  }
                `}
                style={styleButton}
                ghost
                type={'default'}
                onClick={this.onClickCancelEvents}
              >
                <FontAwesomeIcon icon={faCircleEllipsis} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer' }} />
              </Button>
            </DropdownExt>
          );
          return res;
        },
      },
    ] as ITableExtColumn[];
  });

  calcKeyTable = (r1) => r1.projectId;
  calcLinkTable = (row) => ['/' + PartsLink.project_dashboard + '/' + row?.projectId, 'doUpload=true'];

  onChangeStarred = (e) => {
    let v1 = e.target.checked;
    if (v1 !== true) {
      v1 = null;
    }

    this.setState(
      {
        onlyStarred: v1,
      },
      () => {
        this.lastRefreshTime = moment();
        StoreActions.getProjectsList_(v1, undefined, undefined, undefined, undefined, undefined, undefined, (isOk) => {
          this.doTimeWorkAutoRefresh?.();
        });
      },
    );

    Location.push('/' + PartsLink.project_list, undefined, Utils.processParamsAsQuery({ starred: v1 ? '1' : null }, window.location.search));
    let filterText = this.props.paramsProp?.get('filter') ?? '';
    this.getProjectsTags(filterText, v1);
  };

  handleTagSelect = (tag: TagOption | null) => {
    const tagValue = tag?.value ?? null;
    if ((this.props.paramsProp?.get('tag') ?? null) !== tagValue) {
      this.setState({
        filterTagText: tagValue,
      });
      Location.push('/' + PartsLink.project_list, undefined, Utils.processParamsAsQuery({ tag: tagValue }, window.location.search));
    }
  };

  render() {
    let { projects, useCases } = this.props;

    let listProjects = this.memProjectsList(false)(projects, this.state.onlyStarred);
    let listUseCases = this.memUseCases(false)(useCases);

    const columns: ITableExtColumn[] = this.memColumns(this.numberProjects === false);

    let showEmptyIcon: any = true;
    let filterText = this.props.paramsProp?.get('filter') ?? '';
    if (_.trim(filterText || '') === '') {
      filterText = null;
    } else {
      filterText = _.trim(filterText?.toLowerCase());
    }
    const isFilter = !Utils.isNullOrEmpty(filterText);

    let filterTagText = this.props.paramsProp?.get('tag') ?? null;
    const isTagFilter = !Utils.isNullOrEmpty(filterTagText);

    let isRefreshing = false;
    let dataList = null;
    if (listProjects && listUseCases) {
      let dataListRes = this.memCalcProjectList('list' + (this.state.onlyStarred ? 'Starred' : ''))(listProjects, listUseCases);
      dataList = dataListRes?.list;

      if (dataListRes?.anyData && (isFilter || isTagFilter)) {
        showEmptyIcon = 'Nothing found';
      }
    }
    if ((isFilter && projects && isFilter && listUseCases) || (isTagFilter && projects)) {
      let projects3 = this.memFilterWithText(false)(filterText, filterTagText, projects, this.state.onlyStarred);
      let dataListRes = this.memCalcProjectList('filter' + (this.state.onlyStarred ? 'Starred' : ''))(projects3, listUseCases);
      dataList = dataListRes?.list;
    }
    if (projects) {
      if (projects.get('isRefreshing') && projects.get('list' + (this.state.onlyStarred ? 'Starred' : '')) == null) {
        isRefreshing = true;
      }
    }
    // if(useCases) {
    //   if(useCases.get('isRefreshing')) {
    //     isRefreshing = true;
    //   }
    // }

    let showHelp = dataList != null && dataList.length === 0 && filterText == null && filterTagText == null && !this.state.onlyStarred;
    let allHidden = false;
    if (filterText != null && filterText !== '') {
      //
    } else if (!projects || showHelp || dataList == null) {
      allHidden = true;
    } else {
      if (projects.get('neverDone')) {
        allHidden = true;
      }
    }

    let remoteRowCount = calcProjectListTotalCount() ?? 0;
    if (isFilter) {
      remoteRowCount = null;
    }

    let selectedTag = null;

    if (isTagFilter) {
      selectedTag = this.createTag(filterTagText);
    }

    return (
      <div className={classNames(globalStyles.absolute, globalStyles.table)} style={{ margin: '25px', position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
        {showHelp && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ display: 'flex', flexFlow: 'column' }}>
              <div style={{ width: '831px', flex: '0 0 224px', position: 'relative' }}>
                <img src={calcImgSrc('/imgs/createProjectHelp.png')} alt={''} style={{ width: '831px' }} />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontFamily: 'Roboto',
                    fontSize: '36px',
                    fontWeight: 900,
                    textAlign: 'center',
                    color: '#ffffff',
                  }}
                >
                  WELCOME TO {Constants.flags.product_name?.toUpperCase()}
                </div>
              </div>
              <div style={{ backgroundColor: '#0c121b', padding: '20px 40px' }}>
                <div style={{ fontFamily: 'Matter', fontSize: '24px', lineHeight: 1.67, textAlign: 'center', color: '#ffffff' }}>The first step is to create a project. It’s really simple, give it a try!</div>
                <Link to={'/' + PartsLink.project_add}>
                  <div style={{ marginTop: '15px', cursor: 'pointer', fontSize: '14px', borderRadius: '4px', background: 'linear-gradient(to bottom, #3751ff -43%, #05b5ba)', padding: '6px 0', textAlign: 'center' }}>Create Project</div>
                </Link>
              </div>

              <div style={{ opacity: 0.8, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '34px', position: 'relative' }} className={'clearfix'}>
                <div style={{ color: 'white' }} className={globalStyles.styleTextGreen}>
                  Want to use our API?
                </div>
                <div style={{ marginLeft: '15px' }}>
                  <Button type={'default'} ghost onClick={this.onClickProfileApiKey} style={{ height: '28px' }}>
                    Create an API Key
                  </Button>
                </div>
              </div>
            </span>
          </div>
        )}

        {!showHelp && !allHidden && (
          <div className={globalStyles.titleTopHeaderAfter} style={{ height: topAfterHeaderPL }}>
            <div
              css={`
                display: flex;
                align-items: center;
              `}
            >
              <span style={{ fontWeight: 500, marginRight: 9 }}>Projects</span>
              <span>
                <HelpIcon id={'projectlist'} style={{ verticalAlign: 'text-bottom' }} />
              </span>
              <span style={{ marginLeft: '16px', width: '327px', display: 'inline-block', verticalAlign: 'top', position: 'relative' }}>
                <Input
                  style={{ verticalAlign: 'top', marginTop: '2px', borderRadius: 0, height: '32px', paddingRight: 50 }}
                  placeholder={'Filter by project name, user name or use-case'}
                  value={this.state.filterText ?? ''}
                  onChange={this.onChangeFilterText}
                  onKeyDown={this.onKeyDownFilterText}
                />
                <Button className={globalStyles.detailbuttonTransparent} ghost style={{ position: 'absolute', right: 9, top: 5.5, padding: 0, height: 'auto' }} type={'primary'} onClick={this.onClickFilterTextClear}>
                  Clear
                </Button>
              </span>
              <Button
                className={globalStyles.detailbuttonblueBorder}
                ghost
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'top', marginTop: '1px', height: '32px', width: 67, marginLeft: '12px', borderWidth: 2 }}
                type={'primary'}
                onClick={this.onClickFilterText}
              >
                Go
              </Button>
              <Checkbox style={{ marginLeft: '25px' }} checked={this.state.onlyStarred} onChange={this.onChangeStarred}>
                <span
                  css={`
                    color: white;
                  `}
                >
                  Show Only Starred
                </span>
              </Checkbox>
              <span
                css={`
                  flex: 1;
                `}
              ></span>
              <span>
                <Button type={'primary'} style={{ minWidth: 168, height: '32px', padding: '0 16px' }} onClick={this.onClickAddNewProject}>
                  Create Project
                </Button>
              </span>
            </div>
          </div>
        )}

        {!showHelp && !allHidden && this.state.projectTags && <TagsCloud tags={this.state.projectTags} containerRef={this.tagsCloudRef} selectedTag={selectedTag} onTagSelect={this.handleTagSelect} />}

        {!showHelp && !allHidden && (
          <AutoSizer disableWidth>
            {({ height }) => (
              <RefreshAndProgress isRefreshing={isRefreshing} style={{ top: topAfterHeaderPL + this.state.tagsCloudHeight + 'px', borderRadius: 8, backgroundColor: '#19232f' }}>
                <div style={{ paddingTop: 4 }}>
                  <TableExt
                    separatorDark
                    showEmptyIcon={showEmptyIcon}
                    isVirtual
                    disableSort={this.numberProjects ?? true} /*aadefaultSort={{field: 'createdForSort'}} aanotsaveSortState={'projects_list'}*/
                    height={height - topAfterHeaderPL - this.state.tagsCloudHeight - 4}
                    onNeedMore={isFilter || this.numberProjects === false ? null : this.onNeedMoreProjects}
                    remoteRowCount={remoteRowCount}
                    dataSource={dataList}
                    columns={columns}
                    calcKey={this.calcKeyTable}
                    calcLink={this.calcLinkTable}
                  />
                </div>
              </RefreshAndProgress>
            )}
          </AutoSizer>
        )}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    useCases: state.useCases,
  }),
  null,
)(ProjectsList);
