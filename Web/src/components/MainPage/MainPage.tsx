import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Drawer from '@mui/material/Drawer';
import Affix from 'antd/lib/affix';
import Button from 'antd/lib/button';
import Tooltip from 'antd/lib/tooltip';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import NotificationSystem from 'react-notification-system';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { ISaveRedirectURL, ReactLazyExt, calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn, needsGotoBilling } from '../../stores/reducers/authUser';
import help from '../../stores/reducers/help';
import BillingModal from '../BillingModal/BillingModal';
import CenterPage from '../CenterPage/CenterPage';
import { dataWizardStateSavedLocally } from '../DatasetSchema/DatasetSchema';
import Header from '../Header/Header';
import HeaderAlone from '../HeaderAlone/HeaderAlone';
import Link from '../Link/Link';
import LoginResetPassword from '../LoginResetPassword/LoginResetPassword';
import LoginSignIn from '../LoginSignIn/LoginSignIn';
import LoginSignUp from '../LoginSignUp/LoginSignUp';
import LoginVerifyAccount from '../LoginVerifyAccount/LoginVerifyAccount';
import LoginWorkspaceJoin from '../LoginWorkspaceJoin/LoginWorkspaceJoin';
import MissingParamsErrorShow from '../MissingParamsErrorShow/MissingParamsErrorShow';
import NanoScroller from '../NanoScroller/NanoScroller';
import NavBannerNeed, { NavBannerNeedHeight } from '../NavBannerNeed/NavBannerNeed';
import NavBottom from '../NavBottom/NavBottom';
import NavLeft from '../NavLeft/NavLeft';
import PartsLink from '../NavLeft/PartsLink';
import NavTop from '../NavTop/NavTop';
import NeedChangeOrg from '../NeedChangeOrg/NeedChangeOrg';
import NeedDesktop from '../NeedDesktop/NeedDesktop';
import NeedSnapshotDataset from '../NeedSnapshotDataset/NeedSnapshotDataset';
import PriceLists from '../PriceLists/PriceLists';
import ProfileBilling from '../ProfileBilling/ProfileBilling';
import ProfileBillingPrices from '../ProfileBillingPrices/ProfileBillingPrices';
import UploadsList from '../UploadsList/UploadsList';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';

// import 'style-loader!css-loader!devextreme/dist/css/dx.common.css';
// import 'style-loader!css-loader!devextreme/dist/css/dx.dark.compact.css';
// import 'style-loader!css-loader!../../constants/dx.generic.abacus-dark.css';
import 'style-loader!css-loader!devexpress-diagram/dist/dx-diagram.min.css';
import REClient_ from '../../api/REClient';
import chat from '../../stores/reducers/chat';
import { memProjectById, memProjectsList } from '../../stores/reducers/projects';
import AutoLinkString from '../AutoLinkString/AutoLinkString';
import ChatDockModal from '../ChatDockModal/ChatDockModal';
import CompBoundError from '../CompBoundError/CompBoundError';
import NBEditor from '../NBEditor/NBEditor';
import NotebookDetails from '../NotebookDetails/NotebookDetails';
import { DocumentRetrieverCreateNew } from '../DocumentRetrieverCreateNew/DocumentRetrieverCreateNew';
import { DocumentRetrieverDetail } from '../DocumentRetrieverDetail/DocumentRetrieverDetail';
import { DocumentRetrieverList } from '../DocumentRetrieverList/DocumentRetrieverList';
import { SearchAdvNavLeft } from '../NavLeft/SearchAdvNavLeft';
import { PipelineNotebook } from '../PipelineNotebook/PipelineNotebook';

const EDAList = ReactLazyExt(() => import('../EDAList/EDAList'));
const EDADetail = ReactLazyExt(() => import('../EDADetail/EDADetail'));
const EDAGraphs = ReactLazyExt(() => import('../EDAGraphs/EDAGraphs'));
const EDAGraphsOne = ReactLazyExt(() => import('../EDAGraphsOne/EDAGraphsOne'));
const EDAPythonFunctions = ReactLazyExt(() => import('../EDAPythonFunctions/EDAPythonFunctions'));
const PlotsFunctionsList = ReactLazyExt(() => import('../PlotsFunctionsList/PlotsFunctionsList'));
const EDACreateNew = ReactLazyExt(() => import('../EDACreateNew/EDACreateNew'));
const EDADataConsistency = ReactLazyExt(() => import('../EDADataConsistency/EDADataConsistency'));
const EDADataConsistencyAnalysis = ReactLazyExt(() => import('../EDADataConsistencyAnalysis/EDADataConsistencyAnalysis'));
const EDACollinearity = ReactLazyExt(() => import('../EDACollinearity/EDACollinearity'));
const EDATimeseries = ReactLazyExt(() => import('../EDATimeseries/EDATimeseries'));

const PredMetricsAdd = ReactLazyExt(() => import('../PredMetricsAdd/PredMetricsAdd'));
const ModelMonitorsMetrics = ReactLazyExt(() => import('../ModelMonitorsMetrics/ModelMonitorsMetrics'));
const ModelMonitorAlertsAdd = ReactLazyExt(() => import('../ModelMonitorAlertsAdd/ModelMonitorAlertsAdd'));
const ModelMonitorAlertsAddNew = ReactLazyExt(() => import('../ModelMonitorAlertsAddNew/ModelMonitorAlertsAddNew'));
const ModelMonitorAlerts = ReactLazyExt(() => import('../ModelMonitorAlerts/ModelMonitorAlerts'));
const ModelMonitorAlertsNew = ReactLazyExt(() => import('../ModelMonitorAlertsNew/ModelMonitorAlertsNew'));
const ModelMonitorAlertsEventsNew = ReactLazyExt(() => import('../ModelMonitorAlertsEventsNew/ModelMonitorAlertsEventsNew'));
const MonitorDrift = ReactLazyExt(() => import('../MonitorDrift/MonitorDrift'));
const ModelMonitorsList = ReactLazyExt(() => import('../ModelMonitorsList/ModelMonitorsList'));
const ModelTrainFeatureGroup = ReactLazyExt(() => import('../ModelTrainFeatureGroup/ModelTrainFeatureGroup'));
const ChangeColumnsAsTextEditor = ReactLazyExt(() => import('../ChangeColumnsAsTextEditor/ChangeColumnsAsTextEditor'));
const FeatureGroupsExplorer = ReactLazyExt(() => import('../FeatureGroupsExplorer/FeatureGroupsExplorer'));

const MonitorsListAll = ReactLazyExt(() => import('../MonitorsListAll/MonitorsListAll'));
const MonitorsSummary = ReactLazyExt(() => import('../MonitorsSummary/MonitorsSummary'));
const AlgorithmList = ReactLazyExt(() => import('../AlgorithmList/AlgorithmList'));
const AlgorithmOne = ReactLazyExt(() => import('../AlgorithmOne/AlgorithmOne'));
const AgentOne = ReactLazyExt(() => import('../AgentOne/AgentOne'));
const TemplateOne = ReactLazyExt(() => import('../TemplateOne/TemplateOne'));
const TemplateList = ReactLazyExt(() => import('../TemplateList/TemplateList'));
const ModelCreateMonitoring = ReactLazyExt(() => import('../ModelCreateMonitoring/ModelCreateMonitoring'));
const ModelCreateMonitoringNew = ReactLazyExt(() => import('../ModelCreateMonitoringNew/ModelCreateMonitoringNew'));
const ModelRegisterPnpPython = ReactLazyExt(() => import('../ModelRegisterPnpPython/ModelRegisterPnpPython'));
const ModelRegisterPnpPythonSelect = ReactLazyExt(() => import('../ModelRegisterPnpPythonSelect/ModelRegisterPnpPythonSelect'));
const ModelRegisterPnpPythonZip = ReactLazyExt(() => import('../ModelRegisterPnpPythonZip/ModelRegisterPnpPythonZip'));
const ModelRegisterPnpPythonGit = ReactLazyExt(() => import('../ModelRegisterPnpPythonGit/ModelRegisterPnpPythonGit'));
const FeatureGroupsDataExplorerOne = ReactLazyExt(() => import('../FeatureGroupsDataExplorerOne/FeatureGroupsDataExplorerOne'));
const PythonFunctionsList = ReactLazyExt(() => import('../PythonFunctionsList/PythonFunctionsList'));
const RawDataVisualOne = ReactLazyExt(() => import('../RawDataVisualOne/RawDataVisualOne'));
const Config2FA = ReactLazyExt(() => import('../Config2FA/Config2FA'));
const FeatureGroups = ReactLazyExt(() => import('../FeatureGroups/FeatureGroups'));
const FeatureGroupsAdd = ReactLazyExt(() => import('../FeatureGroupsAdd/FeatureGroupsAdd'));
const FeatureGroupHistory = ReactLazyExt(() => import('../FeatureGroupHistory/FeatureGroupHistory'));
const FeaturesOne = ReactLazyExt(() => import('../FeaturesOne/FeaturesOne'));
const FeatureGroupsConstraint = ReactLazyExt(() => import('../FeatureGroupsConstraint/FeatureGroupsConstraint'));
const FeatureGroupConstraintsAdd = ReactLazyExt(() => import('../FeatureGroupConstraintsAdd/FeatureGroupConstraintsAdd'));
const FeaturesOneAdd = ReactLazyExt(() => import('../FeaturesOneAdd/FeaturesOneAdd'));
const FeaturesOneAddNested = ReactLazyExt(() => import('../FeaturesOneAddNested/FeaturesOneAddNested'));
const FeaturesOneAddTimeTravel = ReactLazyExt(() => import('../FeaturesOneAddTimeTravel/FeaturesOneAddTimeTravel'));
const FeaturesOneAddTimeTravelGroup = ReactLazyExt(() => import('../FeaturesOneAddTimeTravelGroup/FeaturesOneAddTimeTravelGroup'));
const FeatureGroupsExport = ReactLazyExt(() => import('../FeatureGroupsExport/FeatureGroupsExport'));
const FeatureGroupsExportAdd = ReactLazyExt(() => import('../FeatureGroupsExportAdd/FeatureGroupsExportAdd'));
const FeatureGroupsScheduleAdd = ReactLazyExt(() => import('../FeatureGroupsScheduleAdd/FeatureGroupsScheduleAdd'));
const FeatureGroupSnapshot = ReactLazyExt(() => import('../FeatureGroupSnapshot/FeatureGroupSnapshot'));
const FeatureGroupsSampling = ReactLazyExt(() => import('../FeatureGroupsSampling/FeatureGroupsSampling'));
const FeatureGroupsMerge = ReactLazyExt(() => import('../FeatureGroupsMerge/FeatureGroupsMerge'));
const FeatureGroupsTransform = ReactLazyExt(() => import('../FeatureGroupsTransform/FeatureGroupsTransform'));
const MonitoringOne = ReactLazyExt(() => import('../MonitoringOne/MonitoringOne'));
const MonitoringMetricsOne = ReactLazyExt(() => import('../MonitoringMetricsOne/MonitoringMetricsOne'));
const MonitoringDriftOne = ReactLazyExt(() => import('../MonitoringDriftOne/MonitoringDriftOne'));
const MonitoringDriftBPOne = ReactLazyExt(() => import('../MonitoringDriftBPOne/MonitoringDriftBPOne'));
const MonitoringDataIntegrityOne = ReactLazyExt(() => import('../MonitoringDataIntegrityOne/MonitoringDataIntegrityOne'));

const PredMetricsMetrics = ReactLazyExt(() => import('../PredMetricsMetrics/PredMetricsMetrics'));
const ModelMetricsSummery = ReactLazyExt(() => import('../MonitoringSummary/MonitoringSummary'));
const PredMetricsDetail = ReactLazyExt(() => import('../PredMetricsDetail/PredMetricsDetail'));
const PredMetricsList = ReactLazyExt(() => import('../PredMetricsList/PredMetricsList'));
const FeatureGroupsListAll = ReactLazyExt(() => import('../FeatureGroupsListAll/FeatureGroupsListAll'));
const NotebooksListAll = ReactLazyExt(() => import('../NotebooksListAll/NotebooksListAll'));
const BatchPredEdit = ReactLazyExt(() => import('../BatchPredEdit/BatchPredEdit'));
const TemplateDetail = ReactLazyExt(() => import('../TemplateDetail/TemplateDetail'));
const BatchListDatasets = ReactLazyExt(() => import('../BatchListDatasets/BatchListDatasets'));
const BatchRawData = ReactLazyExt(() => import('../BatchRawData/BatchRawData'));
const BatchListFeatureGroups = ReactLazyExt(() => import('../BatchListFeatureGroups/BatchListFeatureGroups'));
const BatchPredDetail = ReactLazyExt(() => import('../BatchPredDetail/BatchPredDetail'));
const BatchAddFeatureGroup = ReactLazyExt(() => import('../BatchAddFeatureGroup/BatchAddFeatureGroup'));

const NotebookOne = ReactLazyExt(() => import('../NotebookOne/NotebookOne'));
const PredictionLog = ReactLazyExt(() => import('../PredictionLog/PredictionLog'));
const SearchAdvanced = ReactLazyExt(() => import('../SearchAdvanced/SearchAdvanced'));
const PretrainedModelsAdd = ReactLazyExt(() => import('../PretrainedModelsAdd/PretrainedModelsAdd'));
const StorageBrowser = ReactLazyExt(() => import('../StorageBrowser/StorageBrowser'));
const ProjectsList = ReactLazyExt(() => import('../ProjectsList/ProjectsList'));
const ModelMetricsOne = ReactLazyExt(() => import('../ModelMetricsOne/ModelMetricsOne'));
const ProjectRawDataOne = ReactLazyExt(() => import('../ProjectRawDataOne/ProjectRawDataOne'));
const AnnotationsEdit = ReactLazyExt(() => import('../AnnotationsEdit/AnnotationsEdit'));
const WebhookList = ReactLazyExt(() => import('../WebhookList/WebhookList'));
const WebhookOne = ReactLazyExt(() => import('../WebhookOne/WebhookOne'));
const PythonFunctionOne = ReactLazyExt(() => import('.././PythonFunctionOne/PythonFunctionOne'));
const PythonFunctionDetail = ReactLazyExt(() => import('.././PythonFunctionDetail/PythonFunctionDetail'));
const CustomLossFunctionOne = ReactLazyExt(() => import('.././CustomLossFunctionOne/CustomLossFunctionOne'));
const CustomLossFunctionsList = ReactLazyExt(() => import('.././CustomLossFunctionsList/CustomLossFunctionsList'));
const CustomMetricOne = ReactLazyExt(() => import('.././CustomMetricOne/CustomMetricOne'));
const CustomMetricsList = ReactLazyExt(() => import('.././CustomMetricsList/CustomMetricsList'));
const ModuleOne = ReactLazyExt(() => import('.././ModuleOne/ModuleOne'));
const ModulesList = ReactLazyExt(() => import('.././ModulesList/ModulesList'));
const DagViewer = ReactLazyExt(() => import('../DagViewer/DagViewer'));
const ProjectDataExplorerOne = ReactLazyExt(() => import('../ProjectDataExplorerOne/ProjectDataExplorerOne'));
const DatasetsList = ReactLazyExt(() => import('../DatasetsList/DatasetsList'));
const DatasetNewOneUpload = ReactLazyExt(() => import('../DatasetNewOneUpload/DatasetNewOneUpload'));
const ProjectsAddNew = ReactLazyExt(() => import('../ProjectsAddNew/ProjectsAddNew'));
const DockerAddNew = ReactLazyExt(() => import('../DockerAddNew/DockerAddNew'));
const ProjectDetail = ReactLazyExt(() => import('../ProjectDetail/ProjectDetail'));
const DatasetDetail = ReactLazyExt(() => import('../DatasetDetail/DatasetDetail'));
const DatasetNewOneAdd = ReactLazyExt(() => import('../DatasetNewOneAdd/DatasetNewOneAdd'));
const DatasetNewOneAttach = ReactLazyExt(() => import('../DatasetNewOneAttach/DatasetNewOneAttach'));
const FeatureGroupAttach = ReactLazyExt(() => import('../FeatureGroupAttach/FeatureGroupAttach'));
const DatasetSchema = ReactLazyExt(() => import('../DatasetSchema/DatasetSchema'));
const DatasetNewOneUploadStep2 = ReactLazyExt(() => import('../DatasetNewOneUploadStep2/DatasetNewOneUploadStep2'));
const ModelsList = ReactLazyExt(() => import('../ModelsList/ModelsList'));
const ModelDetail = ReactLazyExt(() => import('../ModelDetail/ModelDetail'));
const ModelMonitorDetail = ReactLazyExt(() => import('../ModelMonitorDetail/ModelMonitorDetail'));
const MonitorOutliers = ReactLazyExt(() => import('../MonitorOutliers/MonitorOutliers'));
const MonitorDriftAnalysis = ReactLazyExt(() => import('../MonitorDriftAnalysis/MonitorDriftAnalysis'));
const MonitorDriftBias = ReactLazyExt(() => import('../MonitorDriftBias/MonitorDriftBias'));
const MonitorDataIntegrity = ReactLazyExt(() => import('../MonitorDataIntegrity/MonitorDataIntegrity'));
const ModelTrain = ReactLazyExt(() => import('../ModelTrain/ModelTrain'));
const ModelReTrain = ReactLazyExt(() => import('../ModelReTrain/ModelReTrain'));
const DeployCreate = ReactLazyExt(() => import('../DeployCreate/DeployCreate'));
const DatasetForUseCase = ReactLazyExt(() => import('../DatasetForUseCase/DatasetForUseCase'));
const ModelPredRequest = ReactLazyExt(() => import('../ModelPredRequest/ModelPredRequest'));
const LoginSetNewPassword = ReactLazyExt(() => import('../LoginSetNewPassword/LoginSetNewPassword'));
const UserProfile = ReactLazyExt(() => import('../UserProfile/UserProfile'));
const DeploymentsTokensList = ReactLazyExt(() => import('../DeploymentsTokensList/DeploymentsTokensList'));
const ModelPredictionCommon = ReactLazyExt(() => import('../ModelPredictionCommon/ModelPredictionCommon'));
const DeployPredictionsAPI = ReactLazyExt(() => import('../DeployPredictionsAPI/DeployPredictionsAPI'));
const DeploymentsPage = ReactLazyExt(() => import('../DeploymentsPage/DeploymentsPage'));
const ExplanationsOne = ReactLazyExt(() => import('../ExplanationsOne/ExplanationsOne'));
const DeployDetail = ReactLazyExt(() => import('../DeployDetail/DeployDetail'));
const DeployBatchAPI = ReactLazyExt(() => import('../DeployBatchAPI/DeployBatchAPI'));
const DeployBatchAPIList = ReactLazyExt(() => import('../DeployBatchAPIList/DeployBatchAPIList'));
const AskTypeAccess = ReactLazyExt(() => import('../AskTypeAccess/AskTypeAccess'));
const PredictionsCommonCanShow = ReactLazyExt(() => import('../PredictionsCommonCanShow/PredictionsCommonCanShow'));
const ChoiceLabeled = ReactLazyExt(() => import('../ChoiceLabeled/ChoiceLabeled'));
const DatasetStreaming = ReactLazyExt(() => import('../DatasetStreaming/DatasetStreaming'));
const ModelDataAugmentationOne = ReactLazyExt(() => import('../ModelDataAugmentationOne/ModelDataAugmentationOne'));
const LoginSetNewEmail = ReactLazyExt(() => import('../LoginSetNewEmail/LoginSetNewEmail'));
const DatasetVisualize = ReactLazyExt(() => import('../DatasetVisualize/DatasetVisualize'));
const FeatureGroupDetail = ReactLazyExt(() => import('../FeatureGroupDetail/FeatureGroupDetail'));
const DeployLookupApi = ReactLazyExt(() => import('../DeployLookupApi/DeployLookupApi'));
const ShowSetThreshold = ReactLazyExt(() => import('../ShowSetThreshold/ShowSetThreshold'));
const PipelineList = ReactLazyExt(() => import('../PipelineList/PipelineList'));
const PipelineDetails = ReactLazyExt(() => import('../PipelineDetails/PipelineDetails'));
const NotebookTemplateList = ReactLazyExt(() => import('../NotebookTemplateList/NotebookTemplateList'));
const NotebookTemplateDetails = ReactLazyExt(() => import('../NotebookTemplateDetails/NotebookTemplateDetails'));
const PythonFunctionEdit = ReactLazyExt(() => import('../PythonFunctionEdit/PythonFunctionEdit'));

let s = require('./MainPage.module.css');
const sd = require('../antdUseDark.module.css');
const uuid = require('uuid');

export const createEntersFromString = (value?: string, subIndex: any = '', cbProcessText?: (text, index) => any) => {
  if (!value) {
    return value;
  } else {
    if (_.isString(value)) {
      subIndex = '' + (subIndex || '');

      if (value.indexOf('\n') > -1) {
        let vv = value.split('\n');
        let res = [];
        vv?.some((v1, v1ind) => {
          if (v1ind > 0) {
            res.push(<br key={'br_' + v1ind + '_' + subIndex} />);
          }

          if (cbProcessText != null) {
            v1 = cbProcessText(v1, v1ind);
          }

          res.push(<span key={'v_' + v1ind + '_' + subIndex}>{v1}</span>);
        });
        return res;
      }
    }
  }

  if (cbProcessText != null && _.isString(value)) {
    value = cbProcessText(value, 0);
  }

  return value;
};

export const createLinksFromString = (value?: string) => {
  if (!value) {
    return value;
  } else {
    if (_.isString(value)) {
      if (value.indexOf('{{{') > -1) {
        let res = [];

        let vv = value.split('{{{');
        vv.some((v1, v1ind) => {
          if (v1.indexOf('}}}') > -1) {
            let vv2 = v1.split('}}}');
            let link1 = vv2[0];
            let ll = link1.split('|');
            let l1 = ll[0];
            let l2 = link1.substring(l1.length + 1);
            res.push(
              <Link key={'link_' + v1ind} noApp newWindow to={l2} className={sd.styleTextBlueBright}>
                {l1}
              </Link>,
            );

            res.push(<span key={'sp_' + v1ind}>{createEntersFromString(vv2[1], '' + v1ind)}</span>);
          } else {
            res.push(<span key={'sp_' + v1ind}>{createEntersFromString(v1, '' + v1ind)}</span>);
          }
        });
        return res;
      } else {
        return createEntersFromString(value);
      }
    } else {
      return value;
    }
  }
};

const animTimeIn = 500;
const animTimeOut = 380;

interface IMainPageProps {
  projects?: any;
  paramsProp?: any;
  authUser?: any;
  helpParam?: any;
  chat?: any;
}

interface IMainPageState {
  isRefreshing: boolean;
  helpOpen: boolean;
  helpId?: string;
  helpText?: string;
  helpTitle?: string;
  helpLink?: string;
  helpRelated?: any;
  helpRelatedLinks?: any;
  navLeftCollapsed?: boolean;
  navLeftCollapsedWasBecauseResize?: boolean;
  navLeftCollapsedForResize?: boolean;
  showNavTwice?: boolean;
  navLeftIsAnim?: boolean;
  isSmall?: boolean;
}

class MainPage extends React.PureComponent<IMainPageProps, IMainPageState> {
  private isM: boolean;
  private unNotif: any;
  private notificationSystem: any;
  private unNotifError: any;
  private unDark: any;
  private unNotifClear: any;
  private unNotifHelp: any;
  private unOnResize: any;
  private unInitialize2FA: any;
  wizardStateCleared: boolean;
  alreadySentToWizardPred: any;

  constructor(props) {
    super(props);

    let navLeftCollapsed = false;
    const collapsed1 = Utils.dataNum('navLeftCollapsed');
    if (collapsed1 && collapsed1.timestamp) {
      navLeftCollapsed = !!collapsed1.navLeftCollapsed;
    }

    this.state = {
      isRefreshing: false,
      helpOpen: false,
      navLeftIsAnim: false,
      isSmall: false,

      navLeftCollapsed: navLeftCollapsed,
      navLeftCollapsedWasBecauseResize: navLeftCollapsed === true ? false : null,
    };
  }

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

    const curProjectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(true)(curProjectId, this.props.projects);

    const userId = calcAuthUserIsLoggedIn()?.userId;
    const orgId = calcAuthUserIsLoggedIn()?.orgId;
    const projectList = this.memProjectsList(true)(this.props.projects);
    if (!chat.calcChatProjects().length && userId && orgId && chat.calcChatUserOrgId() !== `${userId}-${orgId}` && projectList && !chat.calcChatRefresh()) {
      StoreActions.updateChatUserOrgId(`${userId}-${orgId}`);
      StoreActions.updateIsChatRefresh(true);
      REClient_.client_().listChatSessions(true, (err, res) => {
        if (err || !res || !res.result) {
        } else {
          const chatSessionList = res.result;
          for (let i = Math.min(chatSessionList?.length, 5) - 1; i >= 0; i--) {
            const chatSessionItem = chatSessionList[i];
            if (chatSessionItem.chatSessionId && chatSessionItem.projectId) {
              const projectOne = projectList.find((item) => item.projectId === chatSessionItem.projectId);
              const chatProjectId = chat.calcChatProjectId();
              if (projectOne) {
                StoreActions.addChatProjects(chatSessionItem.projectId, projectOne.name);
                StoreActions.updateChatSessionId(chatSessionItem.chatSessionId, chatSessionItem.projectId);
                StoreActions.updateValidChatSession(true, chatSessionItem.chatSessionId);
                if (!chatProjectId || curProjectId === chatSessionItem.projectId) {
                  StoreActions.updateChatProjectId(chatSessionItem.projectId);
                }

                REClient_.client_().getChatSession(chatSessionItem.chatSessionId, (err, res) => {
                  if (err || !res || !res.result) {
                  } else {
                    const chatHistory = res.result?.chatHistory ?? [];
                    StoreActions.updateChatHistory(chatHistory, chatSessionItem.chatSessionId);
                  }
                });
              }
            }
          }
        }

        StoreActions.updateIsChatRefresh(false);
      });
    }

    const curChatProjectId = chat.calcChatProjectId();
    const chatProjects = chat.calcChatProjects();
    let isExistProject = chatProjects?.some((item) => item.id === curProjectId);
    if (!isExistProject && curProjectId !== curChatProjectId && !chat.calcChatRefresh() && foundProject1?.projectId && chat.calcChatUserOrgId() === `${userId}-${orgId}`) {
      if (curProjectId) {
        StoreActions.addChatProjects(curProjectId, foundProject1?.name);
        StoreActions.updateChatProjectId(curProjectId);
      }
    }
    if (curProjectId !== curChatProjectId && !chat.calcChatRefresh()) {
      chatProjects?.forEach((item) => {
        if (item.id !== curProjectId) {
          const projectChatSessionId = chat.calcChatSessionId(item.id);
          const validProjectChatSession = chat.calcValidChatSession(projectChatSessionId);
          if (!validProjectChatSession) {
            REClient_.client_()._hideChatSession(chat.calcChatSessionId(item.id), (err, res) => {
              if (err || !res || !res.result) {
              } else {
              }
            });

            StoreActions.deleteChatProjectId(item.id);
          }
        }
      });
    }

    isExistProject = chatProjects?.some((item) => item.id === curProjectId);
    if (isExistProject && foundProject1?.projectId) {
      StoreActions.updateChatProjectId(curProjectId);
    } else {
      StoreActions.updateChatProjectId(null);
    }

    let isLoggedInRes = calcAuthUserIsLoggedIn();
    let isLoggedIn = isLoggedInRes.isLoggedIn === true && isLoggedInRes.isRefreshing === 0;

    isLoggedIn && this.memAuth(true)(this.props.authUser);
    isLoggedIn && this.memHelpUseCases(true)(this.props.helpParam);
    isLoggedIn && this.memModeRedirect(this.props.paramsProp?.get('mode'));
  };

  globalDispatch = () => {
    return Utils.globalStore().dispatch;
  };

  initialize2FA = () => {
    const dispatch = this.globalDispatch();
    const is2FAInprogress = this.props.authUser?.getIn?.(['twoFactorAuthentication', 'inprogress']);
    if (!is2FAInprogress) {
      dispatch({ type: StoreActions.INITIALIZE_2FA, payload: { initialize: true } });
      dispatch({ type: StoreActions.TWO_FA_INPROGRESS, payload: { inprogress: true } });
    } else {
      dispatch({ type: StoreActions.TWO_FA_INPROGRESS, payload: { inprogress: false } });
    }
  };

  componentDidUpdate(prevProps: Readonly<IMainPageProps>, prevState: Readonly<IMainPageState>, snapshot?: any): void {
    this.doMem();
    const is2FARequired = this.props.authUser?.getIn?.(['twoFactorAuthentication', 'initialize']);
    if (is2FARequired) {
      Location.push('/' + PartsLink.signin + '?2faRequired=1');
    }
  }

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memProjectsList = memoizeOneCurry((doCall?: boolean, projects?: any) => {
    return memProjectsList(doCall, projects);
  });

  setBackColorBody = (isDark = null) => {
    if (isDark == null) {
      isDark = Utils.isDark();
    }
    let color = isDark ? '#1D1E1F' : '#e6e6e6';
    $(document.body).css({
      'background-color': color,
    });
  };

  onDarkModeChanged = (isDark) => {
    this.setBackColorBody(isDark);

    this.forceUpdate();
  };

  memHelpUseCases = memoizeOneCurry((doCall, helpParam) => {
    return help.memUseCases(undefined, doCall);
  });

  calcTextFromId: (linkPart: string, id: string) => { title: string; description: string; link: string; related: { gotoId: string; title: string; linkPart: string; query: string[]; params: string[] }[] } = (linkPart, id) => {
    let { paramsProp } = this.props;

    if (paramsProp) {
      let mode = linkPart ?? paramsProp.get('mode');
      if (mode) {
        let res = null;

        let h1 = StoreActions.helptext?.[mode];
        if (h1) {
          res = h1[id];
        }

        const useCasesHelp = this.memHelpUseCases(false)(this.props.helpParam);
        if (useCasesHelp) {
          let kk = Object.keys(useCasesHelp);
          kk?.some((k1) => {
            let uc1 = useCasesHelp[k1];
            if (uc1) {
              let metricHelp1 = uc1.model_metrics?.find((m1) => m1.key === id);
              if (metricHelp1) {
                if (res) {
                  res = _.assign({}, res);
                } else {
                  res = {};
                }

                res.title = metricHelp1.name;
                res.description = createLinksFromString(metricHelp1.description);
                return true;
              }
            }
          });
        }

        if (res == null) {
          h1 = StoreActions.helptext?.[PartsLink.global];
          if (h1) {
            res = h1[id];
          }
        }

        return res;
      }
    }
  };

  onClickHelpGoto = (linkPart, gotoId, e) => {
    this.showHelpSlide(gotoId, null, linkPart);
  };

  showHelpSlide = (id, text, linkPart = null) => {
    let title = 'Help';
    let link = null,
      related = null,
      relatedLinks = null;
    if (id) {
      let helpRes = this.calcTextFromId(linkPart, id);
      if (helpRes) {
        text = text ?? helpRes.description;
        title = helpRes.title;
        link = helpRes.link;
        related = null;
        relatedLinks = null;
        if (helpRes.related) {
          let relatedList = helpRes.related
            .map((r1, r1ind) => {
              let link1 = r1.linkPart;
              if (r1.query && r1.query.length > 0) {
                let paramNotFound = false;
                r1.query.some((q1) => {
                  link1 += '/';

                  if (_.startsWith(q1, '{{')) {
                    q1 = q1.substring(2, q1.length - 2 - 2);
                    q1 = this.props.paramsProp ? this.props.paramsProp.get(q1) : null;
                    if (q1 == null) {
                      paramNotFound = true;
                      return true;
                    }
                  }

                  link1 += q1;
                });
                if (paramNotFound) {
                  return null;
                }
              }

              if (r1.params && r1.params.length > 0) {
                let paramNotFound = false;
                let paramsS = '';
                // @ts-ignore
                r1.params.some((p1: { name: string; value: string }) => {
                  if (paramsS === '') {
                    paramsS += '&';
                  }

                  let q1 = p1.value;
                  if (_.startsWith(q1, '{{')) {
                    q1 = q1.substring(2, q1.length - 2 - 2);
                    q1 = this.props.paramsProp ? this.props.paramsProp.get(q1) : null;
                    if (q1 == null) {
                      paramNotFound = true;
                      return true;
                    }
                  }
                  paramsS += Utils.encodeQueryParam(p1.name || '') + '=' + Utils.encodeQueryParam(q1);

                  return false;
                });
                if (paramNotFound) {
                  return null;
                }

                if (paramsS != null && paramsS !== '') {
                  link1 += '?' + paramsS;
                }
              }

              let resLink = (
                <span style={{ fontFamily: 'Matter', fontSize: '14px', fontWeight: 600 }} className={sd.linkBlue}>
                  {r1.title}
                </span>
              );
              if (r1.gotoId != null) {
                resLink = <span onClick={this.onClickHelpGoto.bind(this, r1.linkPart, r1.gotoId)}>{resLink}</span>;
              } else {
                resLink = (
                  <Link to={link1 as any} onClick={this.onCloseHelp}>
                    {resLink}
                  </Link>
                );
              }

              let res = (
                <div key={'link' + link1 + '_' + r1ind} style={{ marginTop: '9px' }}>
                  {resLink}
                </div>
              );

              return { res, isLink: r1.gotoId == null || r1.gotoId === '' };
            })
            .filter((r1) => r1 != null);

          related = relatedList?.filter((r1) => !r1.isLink).map((r1) => r1.res);
          relatedLinks = relatedList?.filter((r1) => r1.isLink).map((r1) => r1.res);
        }
      }
    }

    if (text != null && _.isString(text) && text !== '') {
      let tt = text.split('###');
      if (tt && tt.length > 1) {
        text = (
          <span>
            {tt.map((t1, t1ind) => (
              <span key={'t_' + t1ind}>
                {t1ind > 0 ? <br /> : null}
                <AutoLinkString newWindow={true} noApp={true}>
                  {t1 ?? ''}
                </AutoLinkString>
              </span>
            ))}
          </span>
        );
      } else {
        text = (
          <AutoLinkString newWindow={true} noApp={true}>
            {text}
          </AutoLinkString>
        );
      }
    }

    this.setState({
      helpOpen: true,
      helpId: id,
      helpText: text,
      helpTitle: title,
      helpLink: link,
      helpRelated: related,
      helpRelatedLinks: relatedLinks,
    });
  };

  onCloseHelp = () => {
    this.setState({
      helpOpen: false,
    });
    REActions.hideHelpSlide(this.state.helpId);
  };

  onResizeSpecial = (ww, hh, shouldBeCollapsed) => {
    if (this.state.navLeftCollapsedForResize !== shouldBeCollapsed) {
      this.setState({
        navLeftCollapsedForResize: shouldBeCollapsed,
      });
    }

    if (this.state.navLeftCollapsedWasBecauseResize !== false) {
      this.doSetCollapsed(shouldBeCollapsed, true);
    }
  };

  memModeRedirect = memoizeOne((mode) => {
    // if(mode===PartsLink.deploy_list) {
    //   let link1 = null;
    //   if (Utils.isNullOrEmpty(this.props.paramsProp?.get('modelId'))) {
    //     link1 = '/' + PartsLink.predictions + '/' + this.props.paramsProp?.get('projectId');
    //   } else {
    //     link1 = '/' + PartsLink.predictions + '/' + this.props.paramsProp?.get('modelId') + '/' + this.props.paramsProp?.get('projectId');
    //   }
    //   setTimeout(() => {
    //     Location.push(link1);
    //   }, 0);
    // }
  });

  componentDidMount() {
    this.isM = true;

    this.unOnResize = REActions.onResizeSpecial.listen(this.onResizeSpecial);
    this.unNotif = REActions.addNotification.listen(this.addNotification);
    this.unNotifError = REActions.addNotificationError.listen(this.addNotificationError);
    this.unNotifClear = REActions.clearNotifications.listen(this.clearNotifications);
    this.unNotifHelp = REActions.showHelpSlide.listen(this.showHelpSlide);
    this.unInitialize2FA = REActions.initiateTwoFactorAuthentication.listen(this.initialize2FA);

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
    this.setBackColorBody();

    (function () {
      let w$ = window['$'];

      let dropdownMenu;
      w$(window).on('show.bs.dropdown', function (e) {
        let elemRoot = w$(e.target);

        let addClassName = elemRoot.attr('data-addclass');
        if (addClassName) {
          elemRoot.find('.dropdown-toggle').addClass(addClassName);
        }

        dropdownMenu = elemRoot.find('.dropdown-menu');
        w$('body').append(dropdownMenu.detach());
        dropdownMenu.css('display', 'block');
        dropdownMenu.position({
          my: elemRoot.attr('data-my') || 'left+2 top-3',
          at: elemRoot.attr('data-at') || 'left bottom',
          of: $(e.relatedTarget),
        });
      });
      w$(window).on('hide.bs.dropdown', function (e) {
        let elemRoot = w$(e.target);

        let addClassName = elemRoot.attr('data-addclass');
        if (addClassName) {
          elemRoot.find('.dropdown-toggle').removeClass(addClassName);
        }

        elemRoot.append(dropdownMenu.detach());
        dropdownMenu.hide();
      });
    })();

    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;

    this.unOnResize();
    this.unNotif();
    this.unNotifError();
    this.unNotifClear();
    this.unNotifHelp();
    this.unDark();
    this.unInitialize2FA();
  }

  clearNotifications = () => {
    if (this.notificationSystem) {
      this.notificationSystem.clearNotifications();
    }
  };

  addNotificationError = (msg?, title?, autoDismiss?, position?) => {
    this.addNotification(msg, 'error', title, autoDismiss, position);
  };

  addNotification = (msg?, level?, title?, autoDismiss?, position?) => {
    if (!this.isM) {
      return;
    }

    //level: success, error, warning and info
    //pos: tr (top right), tl (top left), tc (top center), br (bottom right), bl (bottom left), bc (bottom center)
    if (level == 'blue') {
      level = 'info';
    }

    this.notificationSystem.addNotification({
      autoDismiss: autoDismiss || 5,
      title: title,
      message: msg,
      level: level || 'info',
      position: position || 'tc',
    });
  };

  memAuth = memoizeOneCurry((doCall, authUser) => {
    if (authUser) {
      if (authUser.get('neverDone') && !authUser.get('data') && !authUser.get('isRefreshing')) {
        if (doCall) {
          StoreActions.getAuthUser_();
        }
      }
    }
  });

  memMode = memoizeOne((mode, authUser) => {
    if (Utils.isNullOrEmpty(mode)) {
      return;
    }

    let dontRedirect = false;
    const isPartOfSignin = [PartsLink.price_lists, PartsLink.profile, PartsLink.signin_verify_account, PartsLink.signin_reset_password, PartsLink.signin_forgot_new, PartsLink.signin_password].includes(mode);

    let $headerNavFixed = $('.headerNavNew');
    if ($headerNavFixed.length > 0) {
      let isVisible = [
        PartsLink.workspace_join,
        PartsLink.accept_invite,
        PartsLink.signin_verify_account,
        PartsLink.signin_reset_password,
        PartsLink.signin_forgot_new,
        PartsLink.signin_password,
        PartsLink.signin,
        PartsLink.signup,
      ].includes(mode);
      const dataIsVisible = 'data-isVisible';
      if ($headerNavFixed.data(dataIsVisible) !== isVisible) {
        $headerNavFixed.data(dataIsVisible, isVisible);
        if (isVisible) {
          $headerNavFixed.show();
        } else {
          $headerNavFixed.hide();
        }
      }
    }

    if (!isPartOfSignin) {
      let loggedInRes = calcAuthUserIsLoggedIn();
      if (loggedInRes && loggedInRes.neverDone === false && loggedInRes.isRefreshing === 0) {
        if (authUser && authUser.get('neverDone') === false && loggedInRes?.isLoggedIn === true) {
          if (loggedInRes.forceVerification) {
            setTimeout(() => {
              let emailPart = loggedInRes?.email;
              if (emailPart == null || emailPart === '') {
                emailPart = '';
              } else {
                emailPart = '?email=' + Utils.encodeQueryParam(emailPart);
              }
              Location.push('/' + PartsLink.signin_verify_account + '/' + loggedInRes?.userId + emailPart);
            }, 0);
            return;
          }

          if (!loggedInRes.forceVerification && needsGotoBilling(authUser.getIn(['data'])?.toJS())) {
            setTimeout(() => {
              let query1: string;
              if (this.props.paramsProp?.get('mode') !== PartsLink.finish_billing) {
                if (this.props.paramsProp?.get('prices')) {
                  query1 = 'prices=1';
                }
                if (this.props.paramsProp?.get('create')) {
                  query1 = 'create=1';
                }

                Location.push('/' + PartsLink.finish_billing, undefined, query1);
              }
            }, 0);
            return;
          }

          let orgId = authUser.getIn(['data', 'organization', 'organizationId']);
          if (!orgId || orgId == '0') {
            setTimeout(() => {
              Location.push('/' + PartsLink.workspace_join);
            }, 0);
            return;
          }

          if (!this.alreadySentToWizardPred) {
            this.alreadySentToWizardPred = true;

            let lastSavedState = Utils.dataNum(dataWizardStateSavedLocally);
            if (lastSavedState == null || _.isEmpty(lastSavedState)) {
              //
            } else {
              if (!Utils.isNullOrEmpty(lastSavedState.url)) {
                if (lastSavedState.url?.toLowerCase() !== window.location.href?.toLowerCase()) {
                  setTimeout(() => {
                    window.location.href = lastSavedState.url;
                  }, 0);
                  return;
                }
              }
            }
          }
        }

        if (loggedInRes.isLoggedIn !== true) {
          if (![PartsLink.signin, PartsLink.finish_billing, PartsLink.type_access, PartsLink.signup, PartsLink.signin_verify_account, PartsLink.accept_invite].includes(mode)) {
            Utils.dataNum(Constants.signin_redirect_after, undefined, { url: window.location.href, savedOn: moment().unix() } as ISaveRedirectURL);
          }

          if (![PartsLink.signin, PartsLink.type_access, PartsLink.signup, PartsLink.signin_verify_account, PartsLink.accept_invite].includes(mode)) {
            setTimeout(() => {
              Location.push('/' + PartsLink.signin);
            }, 0);
          }
          return;
        }
      } else {
        dontRedirect = true;
      }

      if (loggedInRes && loggedInRes.neverDone === false && loggedInRes.isRefreshing === 0) {
        if (loggedInRes?.canUse && authUser && authUser.get('neverDone') === false && loggedInRes?.isLoggedIn === true) {
          if ([PartsLink.root, PartsLink.welcome, PartsLink.dataset_schema_wizard].includes(mode)) {
            this.wizardStateCleared = false;
          } else {
            if (!this.wizardStateCleared) {
              Utils.dataNum(dataWizardStateSavedLocally, undefined, null);
            }
            this.wizardStateCleared = true;
          }
        }
      }
    }

    if (!dontRedirect) {
      if (mode === PartsLink.root || [PartsLink.signin, PartsLink.signup].includes(mode)) {
        setTimeout(() => {
          Location.replace('/' + PartsLink.welcome);
        }, 0);
        return;
      }
    }
  });

  private skipOnceExpand: boolean;

  doSetCollapsed = (isCollapsed, isForResize = false) => {
    if (!isForResize) {
      Utils.dataNum('navLeftCollapsed', undefined, { timestamp: moment().unix(), navLeftCollapsed: isCollapsed });
    }

    this.setState(
      {
        navLeftCollapsed: isCollapsed,
        navLeftCollapsedWasBecauseResize: isForResize,
      },
      () => {
        setTimeout(() => {
          REActions.navLeftCollapsed();
        }, 30);
      },
    );

    $('#navLeftOne').stop(true, true);
    if (this.timerHoverOut) {
      clearTimeout(this.timerHoverOut);
      this.timerHoverOut = null;
    }
    if (this.timerIsAnim) {
      clearTimeout(this.timerIsAnim);
      this.timerIsAnim = null;
    }
    this.setState({
      navLeftIsAnim: false,
      showNavTwice: false,
    });
    this.skipOnceExpand = isCollapsed;
  };

  onExpandNavLeft = (e) => {
    this.doSetCollapsed(false);
  };

  onCollapseNavLeft = (e) => {
    let collapsed = !this.state.navLeftCollapsed;
    this.doSetCollapsed(collapsed);
  };

  private timerHoverOut = null;
  private timerIsAnim = null;

  onHoverNavLeft = (isHover) => {
    if (!this.state.navLeftCollapsed) {
      if (!isHover) {
        if (this.state.showNavTwice) {
          this.setState({
            showNavTwice: false,
          });
        }
      }
      return;
    }

    if (this.skipOnceExpand) {
      this.skipOnceExpand = false;
      return;
    }

    if (this.timerHoverOut) {
      clearTimeout(this.timerHoverOut);
      this.timerHoverOut = null;
    }
    if (this.timerIsAnim) {
      clearTimeout(this.timerIsAnim);
      this.timerIsAnim = null;
    }

    if (!this.state.navLeftIsAnim) {
      this.setState({
        navLeftIsAnim: true,
      });
    }

    if (isHover !== this.state.showNavTwice) {
      if (isHover) {
        this.setState({
          showNavTwice: true,
        });

        $('#navLeftOne').fadeIn(animTimeIn);
        this.timerIsAnim = setTimeout(() => {
          this.setState({
            navLeftIsAnim: false,
          });
        }, animTimeIn);
      } else {
        this.timerHoverOut = setTimeout(() => {
          if (!this.isM) {
            return;
          }

          $('#navLeftOne').fadeOut(animTimeOut);
          this.timerIsAnim = setTimeout(() => {
            this.setState({
              navLeftIsAnim: false,
            });
          }, animTimeOut);

          this.setState({
            showNavTwice: false,
          });
        }, 400);
      }
    }
  };

  onChangeWinSize = (isMedium, isSmall, isLarge) => {
    if (this.state.isSmall !== isSmall) {
      setTimeout(() => {
        if (!this.isM) {
          return;
        }

        this.setState({
          isSmall,
        });
      }, 0);
    }
  };

  onDropWin = (e) => {
    e?.preventDefault?.();
  };

  onDragOverWin = (e) => {
    e?.preventDefault?.();
  };

  onClickChat = () => {
    StoreActions.updateShowChat(true);
  };

  render() {
    let isLoggedInRes = calcAuthUserIsLoggedIn();
    let isLoggedIn = isLoggedInRes.isLoggedIn === true && isLoggedInRes.isRefreshing === 0;

    let { navLeftCollapsed } = this.state;

    let content = null;
    let params = this.props.paramsProp;
    let paramsProp = this.props.paramsProp;
    let mode = params && params.get('mode');

    isLoggedIn && this.memAuth(false)(this.props.authUser);
    this.memMode(mode, this.props.authUser);

    const isSearchAdv = mode === PartsLink.search_adv;
    if (isSearchAdv) {
      navLeftCollapsed = false;
    }

    let navLeftBigHidden = !this.state.navLeftIsAnim && navLeftCollapsed && !this.state.showNavTwice;

    let navLeft: JSX.Element;
    if (isSearchAdv) {
      navLeft = <SearchAdvNavLeft />;
    } else if (navLeftCollapsed) {
      navLeft = <NavLeft navLeftCollapsed={true} onClickRoot={this.onExpandNavLeft} />;
    } else {
      navLeft = <NavLeft onCollapse={this.onCollapseNavLeft} onHover={this.onHoverNavLeft} />;
    }

    if (mode === PartsLink.project_list) {
      if (this.state.navLeftCollapsedForResize) {
        navLeft = null;
      }
    }

    let noNavLeft = navLeft == null;
    let header = <Header noNav={noNavLeft || [PartsLink.price_lists, PartsLink.finish_billing].includes(mode)} navLeftCollapsed={navLeftCollapsed} />;
    let navTop = <NavTop noNav={noNavLeft} navLeftCollapsed={navLeftCollapsed} />;

    let headerAlone = <HeaderAlone />;
    let dontRefreshNeedChangeOrg = false;

    if (this.state.isRefreshing) {
      content = <div style={{ marginTop: '100px', textAlign: 'center' }}>Loading...</div>;
    } else if (mode === PartsLink.mobile_desktop) {
      content = <NeedDesktop />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.feature_group_detail) {
      content = <FeatureGroupDetail />;
    } else if (mode === PartsLink.deploy_lookup_api) {
      content = (
        <PredictionsCommonCanShow
          errorLastCall={null}
          offlineOnlyMsg={
            <span>
              This is a Batch Deployment.
              <br />
              Looks up API is only available for an Real-time + Batch deployment
            </span>
          }
          urlDeployNeedsToBeActive
        >
          {({ optionsAlgo, content, needDeploy }) => <ModelPredictionCommon isDeployDetail calcContent={({ optionsTestDatasRes }) => <DeployLookupApi optionsTestDatasRes={optionsTestDatasRes} />} />}
        </PredictionsCommonCanShow>
      );
    } else if (mode === PartsLink.search_adv) {
      dontRefreshNeedChangeOrg = true;
      content = <SearchAdvanced />;
    } else if (mode === PartsLink.pretrained_models_add) {
      content = <PretrainedModelsAdd />;
    } else if (mode === PartsLink.config_2fa) {
      content = <Config2FA />;
    } else if (mode === PartsLink.notebook_one) {
      if (Constants.flags.onprem) {
        content = <NBEditor />;
        noNavLeft = true;
      } else {
        content = <NotebookOne />;
      }
    } else if (mode === PartsLink.pipeline_one) {
      content = <PipelineNotebook />;
      noNavLeft = true;
    } else if (mode === PartsLink.fast_notebook) {
      content = <NBEditor />;
      noNavLeft = true;
    } else if (mode === PartsLink.notebook_details) {
      content = <NotebookDetails />;
    } else if (mode === PartsLink.notebook_fg) {
      content = null;
      setTimeout(() => {
        let p1 = '';
        if (this.props.paramsProp?.get('notebookId')) {
          p1 = '/' + this.props.paramsProp?.get('notebookId');
        }
        Location.push('/' + PartsLink.notebook_one + '/' + (this.props.paramsProp?.get('projectId') ?? '-') + p1);
      }, 0);
    } else if (mode === PartsLink.notebook_model) {
      content = null;
      setTimeout(() => {
        let p1 = '';
        if (this.props.paramsProp?.get('notebookId')) {
          p1 = '/' + this.props.paramsProp?.get('notebookId');
        }
        Location.push('/' + PartsLink.notebook_one + '/' + (this.props.paramsProp?.get('projectId') ?? '-') + p1);
      }, 0);
    } else if (mode === PartsLink.type_access) {
      content = <AskTypeAccess />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.profile) {
      content = <UserProfile />;
    } else if (mode === PartsLink.project_dashboard) {
      content = <ProjectDetail />;
    } else if (mode === PartsLink.project_list) {
      content = <ProjectsList />;
    } else if (mode === PartsLink.project_add) {
      content = <ProjectsAddNew />;
    } else if (mode === PartsLink.docker_add) {
      content = <DockerAddNew />;
    } else if (mode === PartsLink.features_rawdata) {
      content = <ProjectRawDataOne isFeatureGroup />;
    } else if (mode === PartsLink.dagviewer) {
      content = <DagViewer />;
    } else if (mode === PartsLink.webhook_add) {
      content = <WebhookOne isAdd />;
    } else if (mode === PartsLink.webhook_one) {
      content = <WebhookOne />;
    } else if (mode === PartsLink.webhook_list) {
      content = <WebhookList />;
    } else if (mode === PartsLink.python_functions_list) {
      content = <PythonFunctionsList />;
    } else if (mode === PartsLink.python_functions_one) {
      let notebookId = this.props.paramsProp?.get('notebookId');
      const showEmbeddedNotebook = this.props.paramsProp?.get('showEmbeddedNotebook');
      if (notebookId === '' || notebookId === '-') {
        notebookId = null;
      }

      if (notebookId == null) {
        content = <PythonFunctionOne />;
      } else if (notebookId && showEmbeddedNotebook) {
        content = <PythonFunctionEdit />;
      } else {
        content = <NBEditor />;
        noNavLeft = true;
      }
    } else if (mode === PartsLink.python_functions_edit) {
      content = <PythonFunctionEdit />;
    } else if (mode === PartsLink.custom_loss_functions_list) {
      content = <CustomLossFunctionsList />;
    } else if (mode === PartsLink.notebook_template_list) {
      content = <NotebookTemplateList />;
    } else if (mode === PartsLink.notebook_template_details) {
      content = <NotebookTemplateDetails />;
    } else if (mode === PartsLink.custom_loss_function_one) {
      let notebookId = this.props.paramsProp?.get('notebookId');
      if (notebookId === '' || notebookId === '-') {
        notebookId = null;
      }

      if (notebookId == null) {
        content = <CustomLossFunctionOne />;
      } else {
        content = <NBEditor />;
        noNavLeft = true;
      }
    } else if (mode === PartsLink.custom_metrics_list) {
      content = <CustomMetricsList />;
    } else if (mode === PartsLink.custom_metric_one) {
      let notebookId = this.props.paramsProp?.get('notebookId');
      if (notebookId === '' || notebookId === '-') {
        notebookId = null;
      }

      if (notebookId == null) {
        content = <CustomMetricOne />;
      } else {
        content = <NBEditor />;
        noNavLeft = true;
      }
    } else if (mode === PartsLink.modules_list) {
      content = <ModulesList />;
    } else if (mode === PartsLink.module_one) {
      let notebookId = this.props.paramsProp?.get('notebookId');
      if (notebookId === '' || notebookId === '-') {
        notebookId = null;
      }

      if (notebookId == null) {
        content = <ModuleOne />;
      } else {
        content = <NBEditor />;
        noNavLeft = true;
      }
    } else if (mode === PartsLink.annotations_edit) {
      content = <AnnotationsEdit />;
    } else if (mode === PartsLink.feature_groups) {
      content = <FeatureGroups />;
    } else if (mode === PartsLink.document_retriever_list) {
      content = <DocumentRetrieverList />;
    } else if (mode === PartsLink.document_retriever_create) {
      content = <DocumentRetrieverCreateNew />;
    } else if (mode === PartsLink.document_retriever_edit) {
      content = <DocumentRetrieverCreateNew isEdit />;
    } else if (mode === PartsLink.document_retriever_detail) {
      content = <DocumentRetrieverDetail />;
    } else if (mode === PartsLink.exploratory_data_analysis) {
      content = <EDAList />;
    } else if (mode === PartsLink.exploratory_data_analysis_detail) {
      content = <EDADetail />;
    } else if (mode === PartsLink.exploratory_data_analysis_graphs) {
      content = <EDAGraphs />;
    } else if (mode === PartsLink.exploratory_data_analysis_graphs_org) {
      content = <PlotsFunctionsList />;
    } else if (mode === PartsLink.exploratory_data_analysis_graphs_one) {
      content = <EDAGraphsOne />;
    } else if (mode === PartsLink.exploratory_data_analysis_graphs_one_add_function) {
      content = <EDAPythonFunctions />;
    } else if (mode === PartsLink.exploratory_data_analysis_create) {
      content = <EDACreateNew />;
    } else if (mode === PartsLink.exploratory_data_analysis_collinearity) {
      content = <EDACollinearity />;
    } else if (mode === PartsLink.exploratory_data_analysis_data_consistency) {
      content = <EDADataConsistency />;
    } else if (mode === PartsLink.exploratory_data_analysis_data_consistency_analysis) {
      content = <EDADataConsistencyAnalysis />;
    } else if (mode === PartsLink.exploratory_data_analysis_timeseries) {
      content = <EDATimeseries />;
    } else if (mode === PartsLink.batchpred_add_fg) {
      content = <BatchAddFeatureGroup />;
    } else if (mode === PartsLink.feature_groups_add) {
      content = <FeatureGroupsAdd />;
    } else if (mode === PartsLink.prediction_metrics_detail) {
      content = <PredMetricsDetail />;
    } else if (mode === PartsLink.prediction_metrics) {
      content = <PredMetricsMetrics isDecile={false} />;
    } else if (mode === PartsLink.decile_prediction_metrics_project) {
      content = <PredMetricsMetrics isDecile={true} />;
    } else if (mode === PartsLink.prediction_metrics_type_bias) {
      content = <MonitorDriftBias isBias={true} />;
    } else if (mode === PartsLink.prediction_metrics_add) {
      content = <PredMetricsAdd />;
    } else if (mode === PartsLink.model_metrics_summary) {
      content = <ModelMetricsSummery />;
    } else if (mode === PartsLink.prediction_metrics_project) {
      content = <PredMetricsList isProject />;
    } else if (mode === PartsLink.prediction_metrics_list) {
      content = <PredMetricsList />;
    } else if (mode === PartsLink.dataset_snapshot) {
      content = <FeatureGroupSnapshot isDataset />;
    } else if (mode === PartsLink.feature_groups_snapshot) {
      content = <FeatureGroupSnapshot />;
    } else if (mode === PartsLink.feature_groups_export_add) {
      content = <FeatureGroupsExportAdd />;
    } else if (mode === PartsLink.feature_groups_schedule_add) {
      content = <FeatureGroupsScheduleAdd />;
    } else if (mode === PartsLink.feature_groups_transform) {
      content = <FeatureGroupsTransform />;
    } else if (mode === PartsLink.feature_groups_merge) {
      content = <FeatureGroupsMerge />;
    } else if (mode === PartsLink.feature_groups_sampling) {
      content = <FeatureGroupsSampling />;
    } else if (mode === PartsLink.feature_groups_export) {
      content = <FeatureGroupsExport />;
    } else if (mode === PartsLink.monitoring_pred_log) {
      content = (
        <PredictionsCommonCanShow errorLastCall={null} checkActiveNeedDeploy msgNoDeploy={'You can only view Prediction Log, if you have active deployments'}>
          {({ optionsAlgo, content, needDeploy }) => <PredictionLog />}
        </PredictionsCommonCanShow>
      );
    } else if (mode === PartsLink.feature_groups_history) {
      content = <FeatureGroupHistory />;
    } else if (mode === PartsLink.feature_groups_template_add) {
      content = <TemplateOne />;
    } else if (mode === PartsLink.feature_groups_template) {
      content = <TemplateOne />;
    } else if (mode === PartsLink.feature_groups_template_list) {
      content = <TemplateList />;
    } else if (mode === PartsLink.feature_groups_edit) {
      let id1 = this.props.paramsProp?.get('featureGroupId');
      if (id1 === '-') {
        id1 = null;
      }
      content = <FeatureGroupsAdd isEditFeatureGroupId={id1} />;
    } else if (mode === PartsLink.features_add) {
      content = <FeaturesOneAdd isEditName={this.props.paramsProp?.get('isEditName')} />;
    } else if (mode === PartsLink.features_add_nested) {
      content = <FeaturesOneAddNested isEditName={this.props.paramsProp?.get('isEditName')} />;
    } else if (mode === PartsLink.features_add_point_in_time_group) {
      content = <FeaturesOneAddTimeTravelGroup isEditName={this.props.paramsProp?.get('isEditName')} />;
    } else if (mode === PartsLink.features_add_point_in_time) {
      content = <FeaturesOneAddTimeTravel isEditName={this.props.paramsProp?.get('isEditName')} />;
    } else if (mode === PartsLink.realtime_data_integrity) {
      content = <MonitoringDataIntegrityOne />;
    } else if (mode === PartsLink.monitoring_data_integrity) {
      content = <MonitoringDataIntegrityOne isBP />;
    } else if (mode === PartsLink.monitoring_outliers) {
      if (this.props.paramsProp?.get('deployId') != null) {
        setTimeout(() => {
          Location.replace('/' + this.props.paramsProp?.get('mode') + '/' + this.props.paramsProp?.get('projectId'), undefined, Utils.processParamsAsQuery({}, window.location.search));
        }, 0);
      }
      content = <MonitorOutliers isBP />;
    } else if (mode === PartsLink.monitoring_drift) {
      content = <MonitoringDriftOne />;
    } else if (mode === PartsLink.monitoring_drift_bp) {
      content = <MonitoringDriftBPOne />;
    } else if (mode === PartsLink.monitoring_metrics) {
      let content0 = <MonitoringMetricsOne />;

      content = (
        <PredictionsCommonCanShow errorLastCall={null} allowNotEmpty>
          {({ optionsAlgo, content, needDeploy }) => content0}
        </PredictionsCommonCanShow>
      );
    } else if (mode === PartsLink.monitoring) {
      content = <MonitoringOne />;

      // content = <PredictionsCommonCanShow errorLastCall={null}>
      //   {({optionsAlgo, content, needDeploy,}) => (
      //     content0
      //   )}
      // </PredictionsCommonCanShow>;
    } else if (mode === PartsLink.rawdata_visual) {
      content = <RawDataVisualOne />;
    } else if (mode === PartsLink.features_list) {
      content = <FeaturesOne />;
    } else if (mode === PartsLink.change_password) {
      content = <LoginSetNewPassword isChange />;
    } else if (mode === PartsLink.change_email) {
      content = <LoginSetNewEmail />;
    } else if (mode === PartsLink.dataset_list) {
      content = <DatasetsList />;
    } else if (mode === PartsLink.dataset_upload) {
      content = <DatasetNewOneUpload />;
    } else if (mode === PartsLink.dataset_upload_step2) {
      content = <DatasetNewOneUploadStep2 />;
    } else if (mode === PartsLink.dataset_add) {
      content = <DatasetNewOneAdd />;
    } else if (mode === PartsLink.dataset_attach) {
      content = <DatasetNewOneAttach />;
    } else if (mode === PartsLink.feature_group_attach) {
      content = <FeatureGroupAttach />;
    } else if (mode === PartsLink.dataset_for_usecase) {
      content = <DatasetForUseCase />;
    } else if (mode === PartsLink.model_predictions_request) {
      content = <ModelPredRequest />;
    } else if (mode === PartsLink.model_predictions) {
      content = (
        <PredictionsCommonCanShow errorLastCall={null} urlDeployNeedsToBeActive>
          {({ optionsAlgo, content, needDeploy }) => <ModelPredictionCommon optionsAlgo={optionsAlgo} content={content} needDeploy={needDeploy} />}
        </PredictionsCommonCanShow>
      );
    } else if (mode === PartsLink.deploy_create) {
      content = <DeployCreate />;
    } else if (mode === PartsLink.deploy_create_form) {
      content = <DeployCreate isForm />;
    } else if (mode === PartsLink.deploy_create_fg) {
      content = <DeployCreate isFeatureGroup />;
    } else if (mode === PartsLink.deploy_predictions_api) {
      let useDataId = this.props.paramsProp?.get('useDataId');
      let content0 = null;
      if (useDataId) {
        content0 = <ModelPredictionCommon isDeployDetail calcContent={({ optionsTestDatasRes }) => <DeployPredictionsAPI optionsTestDatasRes={optionsTestDatasRes} />} />;
      } else {
        content0 = <DeployPredictionsAPI />;
      }

      content = <PredictionsCommonCanShow errorLastCall={null}>{({ optionsAlgo, content, needDeploy }) => content0}</PredictionsCommonCanShow>;
    } else if (mode === PartsLink.select_labeled) {
      content = <ChoiceLabeled />;
    } else if (mode === PartsLink.batchpred_datasets) {
      content = <BatchListDatasets />;
    } else if (mode === PartsLink.batchpred_rawdata) {
      content = <BatchRawData />;
    } else if (mode === PartsLink.batchpred_featuregroups) {
      content = <BatchListFeatureGroups />;
    } else if (mode === PartsLink.batchpred_detail) {
      content = <BatchPredDetail />;
    } else if (mode === PartsLink.feature_groups_constraint) {
      content = <FeatureGroupsConstraint />;
    } else if (mode === PartsLink.feature_groups_constraint_add) {
      content = <FeatureGroupConstraintsAdd />;
    } else if (mode === PartsLink.batchpred_create) {
      content = <BatchPredEdit />;
    } else if (mode === PartsLink.algorithm_list) {
      content = <AlgorithmList />;
    } else if (mode === PartsLink.algorithm_one) {
      let notebookId = this.props.paramsProp?.get('notebookId');
      if (notebookId === '' || notebookId === '-') {
        notebookId = null;
      }

      if (notebookId == null) {
        content = <AlgorithmOne />;
      } else {
        if (Constants.flags.onprem) {
          content = <NBEditor />;
          noNavLeft = true;
        } else {
          content = <NotebookOne />;
        }
      }
    } else if (mode === PartsLink.agent_one) {
      content = <AgentOne />;
    } else if (mode === PartsLink.template_one) {
      content = <TemplateOne />;
    } else if (mode === PartsLink.template_detail) {
      content = <TemplateDetail />;
    } else if (mode === PartsLink.templates_list) {
      content = <TemplateList />;
    } else if (mode === PartsLink.notebook_list) {
      content = <NotebooksListAll />;
    } else if (mode === PartsLink.featuregroups_list) {
      content = <FeatureGroupsListAll />;
    } else if (mode === PartsLink.deploy_batch) {
      if (paramsProp?.get('showList')) {
        content = <DeployBatchAPIList />;
      } else {
        content = (
          <PredictionsCommonCanShow errorLastCall={null} onlyEmpty allowNotEmpty>
            {({ optionsAlgo, content, needDeploy }) => {
              return <DeployBatchAPI />;
            }}
          </PredictionsCommonCanShow>
        );
      }
    } else if (mode === PartsLink.dataset_visualize) {
      content = <DatasetVisualize />;
    } else if (mode === PartsLink.dataset_raw_data) {
      content = (
        <NeedSnapshotDataset>
          <ProjectRawDataOne />
        </NeedSnapshotDataset>
      );
    } else if (mode === PartsLink.dataset_data_explorer) {
      content = (
        <NeedSnapshotDataset>
          <ProjectDataExplorerOne />
        </NeedSnapshotDataset>
      );
    } else if (mode === PartsLink.dataset_augmentation) {
      content = <div></div>;
    } else if (mode === PartsLink.model_augmentation) {
      content = <ModelDataAugmentationOne />;
    } else if (mode === PartsLink.set_threshold) {
      content = <ShowSetThreshold />;
    } else if (mode === PartsLink.deploy_detail) {
      content = <DeployDetail />;
    } else if (mode === PartsLink.model_metrics) {
      content = <ModelMetricsOne projectId={params && params.get('projectId')} />;
    } else if (mode === PartsLink.storage_browser) {
      content = (
        <div style={{ position: 'relative', maxWidth: '500px', margin: '30px auto 0 auto' }}>
          <StorageBrowser />
        </div>
      );
    } else if (mode === PartsLink.datasets_all) {
      content = <DatasetsList isAll />;
    } else if (mode === PartsLink.dataset_streaming) {
      content = <DatasetStreaming isFinish />;
    } else if (mode === PartsLink.dataset_schema || mode === PartsLink.dataset_schema_wizard) {
      content = <DatasetSchema isWizard={mode === PartsLink.dataset_schema_wizard} isFilters={false} />;
    } else if (mode === PartsLink.dataset_detail) {
      content = <DatasetDetail />;
    } else if (mode === PartsLink.model_featurization) {
      content = <div></div>;
    } else if (mode === PartsLink.model_explanations) {
      content = <ExplanationsOne />;
    } else if (mode === PartsLink.deploy_list) {
      content = <DeploymentsPage />;
    } else if (mode === PartsLink.deploy_tokens_list) {
      content = <DeploymentsTokensList />;
    } else if (mode === PartsLink.monitor_metrics) {
      content = <PredMetricsList isModelMonitor />;
      // content = <ModelMonitorsMetrics />;
    } else if (mode === PartsLink.monitors_list) {
      content = <ModelMonitorsList />;
    } else if (mode === PartsLink.monitors_alert_events) {
      content = <ModelMonitorAlertsEventsNew />;
    } else if (mode === PartsLink.monitors_alert_list) {
      content = <ModelMonitorAlertsNew />;
    } else if (mode === PartsLink.monitors_alert_add) {
      content = <ModelMonitorAlertsAddNew />;
    } else if (mode === PartsLink.monitor_alerts) {
      content = <ModelMonitorAlerts />;
    } else if (mode === PartsLink.monitor_alerts_add) {
      content = <ModelMonitorAlertsAdd />;
    } else if (mode === PartsLink.monitor_outliers) {
      content = <MonitorOutliers />;
    } else if (mode === PartsLink.prediction_metrics_bias) {
      content = <MonitorDriftBias />;
    } else if (mode === PartsLink.monitoring_drift_analysis) {
      content = <MonitorDriftAnalysis isBP />;
    } else if (mode === PartsLink.monitor_drift_analysis) {
      content = <MonitorDriftAnalysis />;
    } else if (mode === PartsLink.monitor_drift) {
      content = <MonitorDrift />;
    } else if (mode === PartsLink.monitors_org_list) {
      content = <MonitorsListAll />;
    } else if (mode === PartsLink.monitors_org_one) {
      // content = <MonitorDrift />;
    } else if (mode === PartsLink.monitors_org_summary) {
      content = <MonitorsSummary />;
    } else if (mode === PartsLink.monitor_data_integrity) {
      content = <MonitorDataIntegrity />;
    } else if (mode === PartsLink.model_detail_monitor) {
      content = <ModelMonitorDetail />;
    } else if (mode === PartsLink.model_detail) {
      content = <ModelDetail />;
    } else if (mode === PartsLink.dataset_external_import_new_version) {
      content = <ChangeColumnsAsTextEditor />;
    } else if (mode === PartsLink.feature_groups_explorer) {
      content = <FeatureGroupsExplorer />;
    } else if (mode === PartsLink.feature_groups_data_explorer) {
      content = <FeatureGroupsDataExplorerOne />;
    } else if (mode === PartsLink.python_function_detail) {
      content = <PythonFunctionDetail />;
    } else if (mode === PartsLink.model_create_drift) {
      if (!Constants.flags.hide_monitors_changes) {
        content = <ModelCreateMonitoringNew />;
      } else {
        content = <ModelCreateMonitoring />;
      }
    } else if (mode === PartsLink.model_register) {
      if (Constants.flags.register_model2) {
        content = <ModelRegisterPnpPythonSelect />;
      } else {
        content = <ModelRegisterPnpPython />; //TODO remove this
      }
    } else if (mode === PartsLink.model_register_form) {
      content = <ModelRegisterPnpPython />;
    } else if (mode === PartsLink.model_register_zip) {
      content = <ModelRegisterPnpPythonZip />;
    } else if (mode === PartsLink.model_register_git) {
      content = <ModelRegisterPnpPythonGit />;
    } else if (mode === PartsLink.model_train_fg) {
      content = <ModelTrainFeatureGroup />;
    } else if (mode === PartsLink.model_train) {
      content = <ModelTrain />;
    } else if (mode === PartsLink.model_retrain) {
      content = <ModelReTrain />;
    } else if (mode === PartsLink.model_list) {
      content = <ModelsList />;
    } else if (mode === PartsLink.pipeline_list) {
      content = <PipelineList />;
    } else if (mode === PartsLink.pipeline_details) {
      content = <PipelineDetails />;
    } else if (mode === PartsLink.signin) {
      content = <LoginSignIn signupToken={this.props.paramsProp?.get('signupToken')} />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.signup) {
      content = <LoginSignUp signupToken={this.props.paramsProp?.get('signupToken')} amznMarketplaceToken={this.props.paramsProp?.get('x-amzn-marketplace-token')} email={this.props.paramsProp?.get('email')} />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.price_lists) {
      content = <PriceLists isFull />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.finish_billing) {
      if (Constants.flags.onprem) {
        Location.push('/app/');
      } else {
        let showMobileBilling = false;
        let isMobile = Utils.isMobile();
        if (isMobile && !paramsProp?.get('prices') && !paramsProp?.get('create')) {
          showMobileBilling = true;
        }

        if (showMobileBilling) {
          content = <ProfileBillingPrices />;
        } else {
          let authUser1 = calcAuthUserIsLoggedIn();
          if (authUser1 == null || !authUser1?.canUse) {
            content = null;
          } else {
            if (authUser1.forceVerification) {
            } else if (!authUser1.forceVerification && authUser1?.canJoinOrg && !authUser1?.alreadyOrgId && !paramsProp?.get('create')) {
              content = <LoginWorkspaceJoin isNew />;
            } else {
              content = <ProfileBilling isFull />;
            }
          }
        }
      }
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.accept_invite) {
      content = <LoginSignUp isInvite={true} />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.workspace_join) {
      content = <LoginWorkspaceJoin />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.signin_forgot_new) {
      content = <LoginSetNewPassword />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.signin_reset_password) {
      content = <LoginResetPassword />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.signin_verify_account) {
      content = <LoginVerifyAccount />;
      header = headerAlone;
      navLeft = null;
      navTop = null;
    } else if (mode === PartsLink.main) {
      content = <div>Main</div>;
    }

    if (content != null) {
      if (navTop != null) {
        content = <MissingParamsErrorShow>{content}</MissingParamsErrorShow>;
      }

      content = <NeedChangeOrg dontRefresh={dontRefreshNeedChangeOrg}>{content}</NeedChangeOrg>;
    }

    let loggedInRes = calcAuthUserIsLoggedIn();
    let emailValidateNeeded = loggedInRes?.emailValidateNeeded ?? false;
    let navBannerNeed = null;
    if (navTop != null && emailValidateNeeded && loggedInRes?.canUse && content != null) {
      navBannerNeed = <NavBannerNeed navLeftCollapsed={navLeftCollapsed} noNav={noNavLeft || navTop == null} />;
    }
    if (navBannerNeed == null && this.state.isSmall) {
      navBannerNeed = <NavBannerNeed msgBackColor={'#672c2c'} navLeftCollapsed={navLeftCollapsed} noNav={noNavLeft || navTop == null} msg={'Please widen your screen'} />;
    }

    const styleNotif = {
      NotificationItem: {
        DefaultStyle: {},
        success: {
          borderTop: 'none',
          backgroundColor: 'white' /*'#38bfa1'*/,
          boxShadow: 'none',
          color: 'white',
          borderRadius: '4px',
        },
        error: {
          borderTop: 'none',
          backgroundColor: '#d93a22',
          boxShadow: 'none',
          color: 'white',
          borderRadius: '4px',
        },
        warning: {
          borderTop: 'none',
          backgroundColor: '#e3741e',
          boxShadow: 'none',
          color: 'white',
          borderRadius: '4px',
        },
        info: {
          borderTop: 'none',
          backgroundColor: 'transparent',
          backgroundImage: 'linear-gradient(to left, #0ccfe4, #3391ed 57%, #8c54ff)',
          boxShadow: 'none',
          color: 'white',
          borderRadius: '4px',
        },
      },
      Title: {
        DefaultStyle: {},
      },
      MessageWrapper: {
        DefaultStyle: {
          fontFamily: 'Roboto',
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center',
        },
      },
      Dismiss: {
        DefaultStyle: {
          top: '50%',
          marginTop: '-8px',
          fontSize: '21px',
        },

        success: {
          color: 'white',
          backgroundColor: 'transparent',
        },

        error: {
          color: 'white',
          backgroundColor: 'transparent',
        },

        warning: {
          color: 'white',
          backgroundColor: 'transparent',
        },

        info: {
          color: 'white',
          backgroundColor: 'transparent',
        },
      },
    };

    if (mode !== PartsLink.config_2fa && isLoggedInRes.isLoggedIn && isLoggedInRes.orgId && isLoggedInRes?.orgGroups?.length && !isLoggedInRes.isInternal && isLoggedInRes.forceTwofa && !isLoggedInRes.enabled2fa) {
      Location.push(`/${PartsLink.config_2fa}`);
    }

    const projectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    const enableAIChat = !Constants.disableAiFunctionalities && chat.calcChatProjectId() && foundProject1?.projectId;

    return (
      <div className={Utils.isDark() ? 'useDark' : 'useLight'} onDrop={this.onDropWin} onDragOver={this.onDragOverWin}>
        <div className={'antd2 antd3 backColor'} id={'body2'} style={{}}>
          <NotificationSystem
            ref={(r1) => {
              this.notificationSystem = r1;
            }}
            style={styleNotif}
          />
          <WindowSizeSmart onChange={this.onChangeWinSize} />
          <UploadsList />
          <BillingModal />

          {header}
          {navLeft}
          {navTop}
          {navBannerNeed}
          <CenterPage
            navLeftCollapsed={navLeftCollapsed}
            style={{ textAlign: 'left' }}
            noNav={noNavLeft || navTop == null}
            noHeader={header == null}
            extraHeightNavTop={/*ShowTopHeader(mode) ? Constants.navTopSearchHH : */ 0 + (navBannerNeed == null ? 0 : NavBannerNeedHeight)}
          >
            <CompBoundError>
              <React.Suspense fallback={<div></div>}>
                {content}
                {enableAIChat && chat.calcShowChat() && <ChatDockModal />}
                {enableAIChat && !chat.calcShowChat() && (
                  <Affix style={{ position: 'fixed', bottom: 50, right: 50 }}>
                    <Tooltip title="AI Chat" placement="top">
                      <img
                        css={`
                          width: 54px;
                          height: 54px;
                        `}
                        src={calcImgSrc('/static/imgs/aiChatRobot.png')}
                        alt={''}
                        onClick={this.onClickChat}
                      />
                    </Tooltip>
                  </Affix>
                )}
              </React.Suspense>
            </CompBoundError>
          </CenterPage>
          <NavBottom noNav={noNavLeft} showHelpIcons={(navLeftCollapsed || noNavLeft) && navLeftBigHidden && header !== headerAlone} navLeftCollapsed={navLeftCollapsed} />
        </div>

        <Drawer anchor="right" open={this.state.helpOpen} onClose={this.onCloseHelp}>
          <div style={{ width: '360px' }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgb(19, 27, 38)', color: Utils.colorAall(1) }}>
            <div style={{ padding: '13px 16px', backgroundColor: '#19232f', textAlign: 'left', fontFamily: 'Matter', fontSize: '21px', color: '#ffffff' }}>
              {'Help'}
              <span style={{ position: 'absolute', padding: '6px', right: 0, top: 0, bottom: 0, width: '34px', textAlign: 'center', cursor: 'pointer' }} onClick={this.onCloseHelp}>
                <FontAwesomeIcon icon={['fas', 'times']} transform={{ size: 16, y: 2 }} style={{}} />
              </span>
            </div>
            <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, bottom: this.state.helpLink != null ? '60px' : 0 }}>
              <NanoScroller onlyVertical>
                <div style={{ padding: '16px' }}>
                  {this.state.helpTitle != null && <div style={{ marginBottom: '14px', color: '#d1e4f5', fontWeight: 500 }}>{this.state.helpTitle}</div>}
                  <div style={{ fontFamily: 'Matter', color: '#ffffff' }}>{this.state.helpText}</div>
                  {this.state.helpRelated && this.state.helpRelated.length > 0 && (
                    <div style={{ marginTop: '30px' }}>
                      <div style={{ fontFamily: 'Matter', fontSize: '16px', fontWeight: 500, color: '#ffffff' }}>Related:</div>
                      {this.state.helpRelated}
                    </div>
                  )}
                  {this.state.helpRelatedLinks && this.state.helpRelatedLinks.length > 0 && (
                    <div style={{ marginTop: '30px' }}>
                      <div style={{ fontFamily: 'Matter', fontSize: '16px', fontWeight: 500, color: '#ffffff' }}>Links:</div>
                      {this.state.helpRelatedLinks}
                    </div>
                  )}
                </div>
              </NanoScroller>
            </div>
            {this.state.helpLink != null && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', fontSize: '14px', textAlign: 'center', margin: '13px' }}>
                <Link newWindow to={'/help/overview'} noApp>
                  <Button style={{ backgroundColor: '#212e55', width: '100%', border: 'none', color: 'white' }}>Documentation</Button>
                </Link>
              </div>
            )}
          </div>
        </Drawer>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    projects: state.projects,
    helpParam: state.help,
    chat: state.chat,
  }),
  null,
)(MainPage);
