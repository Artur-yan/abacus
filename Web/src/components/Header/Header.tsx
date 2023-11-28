import * as moment from 'moment';
import * as React from 'react';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';
import ModalAlert from '../ModalAlert/ModalAlert';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import Popover from 'antd/lib/popover';
import _ from 'lodash';
import { connect } from 'react-redux';
import REClient_ from '../../api/REClient';
import RERefreshLib_ from '../../api/RERefreshLib';
import REStats_ from '../../api/REStats';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn, IAuthUserImmutable } from '../../stores/reducers/authUser';
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import help from '../../stores/reducers/help';
import { calcModelListByProjectId } from '../../stores/reducers/models';
import navParams from '../../stores/reducers/navParams';
import AlertsIcon from '../AlertsIcon/AlertsIcon';
import Link from '../Link/Link';
import { INavParam } from '../NavLeft/utils';
import PartsLink from '../NavLeft/PartsLink';
import NavTopSearch from '../NavTopSearch/NavTopSearch';
import SelectExt from '../SelectExt/SelectExt';
import UserCardNav from '../UserCardNav/UserCardNav';
import UserDropdown from '../UserDropdown/UserDropdown';
import { UserProfileSection } from '../UserProfile/UserProfile';

const { confirm } = Modal;

const s = require('./Header.module.css');
const sd = require('../antdUseDark.module.css');

interface IHeaderProps {
  paramsProp?: any;
  authUser?: IAuthUserImmutable;
  useCases?: any;
  projects?: any;
  defDatasets?: any;
  datasets?: any;
  deployments?: any;
  models?: any;
  navLeftCollapsed?: boolean;
  noNav?: boolean;
  helpParam?: any;
  navParamsProp?: any;
  hideInviteTeam?: boolean;
  isHidden?: boolean;
  isModels?: boolean;
}

interface IHeaderState {
  lightboxImages?: any;
  lightboxIsOpen?: any;
  lightboxShowthumbnails?: any;
  newId?: any;
  newName?: any;
  isUserDropVisible?: boolean;
}

const toTitleCase = (phrase) => {
  return phrase
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

class Header extends React.PureComponent<IHeaderProps, IHeaderState> {
  private isM: any;
  private unLightbox: any;
  private unDark: any;
  private timer: any;
  private lastMinuteRefresh_: any;
  private onCloseLightbox: any;
  private unNeedLogin: any;
  unUserDropShowHide: any;
  unModalAsk: any;

  constructor(props) {
    super(props);

    this.state = {
      lightboxImages: [],
      lightboxIsOpen: false,
      lightboxShowthumbnails: false,
      isUserDropVisible: false,
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

  calcProjectId = () => {
    let res = this.props.paramsProp?.get('projectId');
    if (res === '-') {
      res = null;
    }
    return res;
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.calcProjectId();
    let deployId = this.props.paramsProp?.get('deployId');

    let isLoggedInRes = calcAuthUserIsLoggedIn();
    let isLoggedIn = isLoggedInRes.isLoggedIn === true && isLoggedInRes.isRefreshing === 0;

    const doMemThings = isLoggedIn && !this.props.isModels;

    doMemThings && this.memProjects(true)(this.props.projects);

    doMemThings && this.memModelList(true)(this.props.models, projectId);

    doMemThings ? this.memUseCaseSel(true)(this.props.useCases, this.props.paramsProp?.get('useCase')) : null;

    doMemThings && this.memDeploymentList(true)(this.props.deployments, projectId, deployId);
    doMemThings && this.memHelpUseCases(true)(this.props.helpParam);

    doMemThings && this.memSSOClients();
  };

  memSSOClients = memoizeOne(() => {
    REClient_.client_()._getSSOClientIds((err, res) => {
      if (res?.result != null) {
        Constants.ssoClientIds = res?.result;
      }
    });
  });

  componentDidUpdate(prevProps: Readonly<IHeaderProps>, prevState: Readonly<IHeaderState>, snapshot?: any): void {
    this.doMem();
  }

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  needLogin = () => {
    REClient_.client_()._signOut((err, res) => {
      StoreActions.userLogout_();
      Location.push('/' + PartsLink.signin);
    });
  };

  componentDidMount() {
    this.isM = true;

    if (window['re_config']) {
      Constants.updateFrom(window['re_config']);
      delete window['re_config'];
      REActions.flagsRefresh();
      setTimeout(() => {
        REActions.flagsRefresh();
      }, 0);
    }

    this.unLightbox = REActions.lightboxShow.listen(this.lightboxShow);
    this.unNeedLogin = REActions.needLogin.listen(this.needLogin);
    this.unUserDropShowHide = REActions.userDropdownShowHide.listen(this.userDropdownShowHide);

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);

    this.timer = setInterval(() => {
      if (!this.isM) {
        return;
      }

      let minute = moment().minute();
      if (this.lastMinuteRefresh_ !== minute) {
        this.lastMinuteRefresh_ = minute;
        REActions.refreshEveryMinuteReal();
      }
    }, 1000);

    let { authUser } = this.props;
    if (authUser) {
      this.authMem(authUser.get('neverDone'), authUser.get('isRefreshing'), authUser.get('data'));
    }

    if (!Utils.isMobile() && !this.props.isModels) {
      // @ts-ignore
      REStats_.instance_().init();
      // @ts-ignore
      RERefreshLib_.instance_().init();
    }

    this.doMem(false);
  }

  authMem = memoizeOne((neverDone, isRefreshing, data) => {
    if (neverDone && !isRefreshing && !data) {
      StoreActions.getAuthUser_();
      return;
    }
  });

  lightboxShow = (isOpen, images, showThumbnails, onClose) => {
    this.onCloseLightbox = onClose;
    this.setState({
      lightboxImages: images,
      lightboxIsOpen: isOpen,
      lightboxShowthumbnails: showThumbnails,
    });
  };

  componentWillUnmount() {
    this.isM = false;

    this.unLightbox();
    this.unDark();
    this.unNeedLogin();
    this.unUserDropShowHide();

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onClickUser = () => {
    // @ts-ignore
    this.refs.connectAccount.open();
  };

  onClickBell = (e) => {};

  onClickRespModal = () => {};

  memProjects = memoizeOneCurry((doCall, projects) => {
    if (projects) {
      if (projects.get('neverDone') && !projects.get('isRefreshing')) {
        if (doCall) {
          StoreActions.getProjectsList_();
        }
      }
    }
  });

  memProjectsOptions = memoizeOne((listProjects) => {
    let optionsProjects = [];
    if (listProjects) {
      listProjects.some((p1) => {
        let obj1 = {
          value: p1.projectId,
          label: <span style={{ fontWeight: 600 }}>{p1.name}</span>,
          name1: p1.name,
        };
        optionsProjects.push(obj1);
      });
    }

    if (optionsProjects) {
      optionsProjects = optionsProjects.sort((a, b) => {
        return (a.name1 || '').toLowerCase().localeCompare((b.name1 || '').toLowerCase());
      });
    }

    return optionsProjects;
  });

  onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let { paramsProp } = this.props;

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      Location.push('/' + mode + '/' + optionSel.value);
    }
  };

  onClickRefreshDatasets = (e) => {
    StoreActions.validateProjectDatasets_(this.calcProjectId());
    StoreActions.getProjectDatasets_(this.calcProjectId(), (res, ids) => {
      StoreActions.listDatasets_(ids);
    });
  };

  memModelList = memoizeOneCurry((doCall, models, projectId) => {
    if (models && !Utils.isNullOrEmpty(projectId)) {
      let listByProjectId = calcModelListByProjectId(undefined, projectId);
      if (listByProjectId == null) {
        if (models.get('isRefreshing')) {
          return;
        }

        if (doCall) {
          StoreActions.listModels_(projectId);
        }
      } else {
        return listByProjectId;
      }
    }
  });

  memUseCaseSel = memoizeOneCurry((doCall, useCases, useCase) => {
    if (useCases && useCase) {
      if (useCases.get('isRefreshing')) {
        return;
      }

      if (useCases.get('neverDone')) {
        if (doCall) {
          StoreActions.getUseCases_();
        }
      } else {
        let list = useCases.get('list');
        if (list) {
          return list.find((u1) => u1.useCase === useCase);
        }
      }
    }
  });

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId) => {
    if (deployments && !Utils.isNullOrEmpty(projectId)) {
      if (deployments.get('isRefreshing') !== 0) {
        return;
      }

      let listByProjectId = calcDeploymentsByProjectId(undefined, projectId);
      if (listByProjectId == null) {
        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        return listByProjectId;
      }
    }
  });

  onUserDropVisibleChange = (isVisible) => {
    this.setState({
      isUserDropVisible: isVisible,
    });
  };

  userDropdownShowHide = (isVisible) => {
    this.onUserDropVisibleChange(isVisible);
  };

  memHelpUseCasesSel = memoizeOne((useCasesHelp, helpP2) => {
    if (useCasesHelp && helpP2) {
      return useCasesHelp[helpP2?.toLowerCase()];
    }
  });

  memHelpUseCases = memoizeOneCurry((doCall, helpParam) => {
    return help.memUseCases(undefined, doCall);
  });

  memNavParams = memoizeOne((navParamsProp) => {
    return navParams.memParams();
  });

  memWinTitle = memoizeOne((winTitle) => {
    if (Utils.isNullOrEmpty(winTitle)) {
      winTitle = Constants.flags.product_name;
    }
    if (document['title'] !== winTitle) {
      document['title'] = winTitle;
    }
  });

  memNavItems: (navParams1, mode, params) => { res; winTitle; helpLink? } = memoizeOne((navParams1, mode, params) => {
    if (navParams1 && mode) {
      const isPnp = navParams1['isPnp'];
      const projectUseCase = navParams1['projectUseCase'];

      const projectId = navParams1['projectId'];
      const projectName = navParams1['projectName'];
      const datasetId = navParams1['datasetId'];
      const datasetName = navParams1['datasetName'];
      const modelId = navParams1['modelId'];
      const modelName = navParams1['modelName'];
      const deployId = navParams1['deployId'];
      const deployName = navParams1['deployName'];
      const featureId = navParams1['featureId'];
      const featureName = navParams1['featureName'];
      const edaName = navParams1['edaName'];
      const edaId = navParams1['edaId'];
      const pythonFunctionId = navParams1['pythonFunctionId'];
      const pythonFunctionName = navParams1['pythonFunctionName'];
      const moduleName = navParams1['moduleName'];
      const pipelineId = navParams1['pipelineId'];
      const pipelineName = navParams1['pipelineName'];
      const customLossFunctionId = navParams1['customLossFunctionId'];
      const customLossFunctionName = navParams1['customLossFunctionName'];
      const notebookTemplateName = navParams1['notebookTemplateName'];
      const notebookTemplateId = navParams1['notebookTemplateId'];
      const batchPredId = navParams1['batchPredId'];
      const batchPredName = navParams1['batchPredName'];
      const modelMonitorId = navParams1['monitorId'];
      const modelMonitorName = navParams1['monitorName'];
      const notebookId = navParams1['notebookId'];
      const notebookName = navParams1['notebookName'];
      const templateId = navParams1['templateId'];
      const templateName = navParams1['templateName'];
      const algorithmId = navParams1['algorithmId'];
      const algorithmName = navParams1['algorithmName'];
      const documentRetrieverId = navParams1['documentRetrieverId'];
      const documentRetrieverName = navParams1['documentRetrieverName'];

      const pitGroup = navParams1['pitGroup'];

      const winTitlePrefix = Constants.flags.product_name + ' - ';
      let winTitle = '';
      let nav1: string | INavParam = navParams1?.[mode];

      const extraParamsList = ['showThreshold', 'showConfig', 'pitGroup', 'isEditName', 'isTemplate', 'notebookId', 'projectId', 'editDeployId', 'isAdd', 'plots'];
      const calcNavWithParam = (mode) => {
        let nav1 = null;
        extraParamsList.some((k1) => {
          if (params?.get(k1) && params?.get(k1) !== '-') {
            let n2: any = navParams1?.[mode + '#' + k1];
            if (n2 != null) {
              nav1 = n2;
              return true;
            }
          }
        });
        return nav1;
      };
      nav1 = calcNavWithParam(mode) ?? nav1;

      if (nav1 != null) {
        if (_.isString(nav1)) {
          winTitle += nav1;
          return { res: { text: nav1 }, winTitle, helpLink: null };
        } else {
          const n1 = nav1 as INavParam;
          let helpLink;
          let res: INavParam[] = [];
          if (!n1.noAllProjects) {
            winTitle = winTitlePrefix + 'Project';
            if (projectName) {
              winTitle += ' - ' + projectName;
            } else {
              winTitle += 's';
            }

            if (n1.useBatchPred || this.props.paramsProp?.get('batchPredId')) {
              res.push({
                text: 'Batch Prediction',
                link: navParams1[PartsLink.deploy_batch]?.link,
              });
              res.push({
                text: batchPredName ?? batchPredId,
                link: navParams1[PartsLink.batchpred_detail]?.link,
              });
            } else if ([PartsLink.feature_groups_edit, PartsLink.feature_groups_add, PartsLink.feature_group_detail].includes(mode) && projectId == null) {
              res.push({
                text: 'All Feature Groups',
                link: '/' + PartsLink.featuregroups_list,
              });
            } else {
              if (n1.useTemplatesAll) {
                res.push({
                  text: 'Templates',
                  link: '/' + PartsLink.templates_list,
                });
              } else if (n1.useNotebooksAll) {
                res.push({
                  text: 'Notebooks',
                  link: '/' + PartsLink.notebook_list,
                });
              } else if ([PartsLink.dataset_detail, PartsLink.feature_group_detail].includes(mode) && projectId == null) {
              } else if (PartsLink.dataset_upload === mode && projectId == null) {
                winTitle = winTitlePrefix + 'Datasets';

                res.push({
                  text: 'Datasets',
                  link: '/' + PartsLink.datasets_all,
                });
              } else {
                res.push({
                  text: 'Projects',
                  link: '/' + PartsLink.project_list,
                });
                if (!!this.props.paramsProp?.get('projectId') && this.props.paramsProp?.get('projectId') !== '-' && !Utils.isNullOrEmpty(projectName ?? projectId)) {
                  res.push({
                    text: projectName ?? projectId,
                    link: navParams1[PartsLink.project_dashboard]?.link,
                  });
                }
              }
            }
          }

          if (n1.useProfile === true) {
            winTitle = winTitlePrefix + 'Profile';
            res.push({
              text: 'Profile',
              link: navParams1[PartsLink.profile + ' ' + UserProfileSection.general]?.link,
            });
          }
          if (n1.useMetricsName === true) {
            if (this.props.paramsProp?.get('detailModelId')) {
              winTitle = winTitlePrefix + 'Metrics List';
              if (modelMonitorName) {
                winTitle += ' - ' + modelMonitorName;
              }

              res.push({
                text: 'Metrics List',
                link: navParams1[PartsLink.prediction_metrics_project]?.link,
              });
              if (!Utils.isNullOrEmpty(modelMonitorName)) {
                res.push({
                  text: modelMonitorName,
                  link: navParams1[PartsLink.prediction_metrics_project + 'detail']?.link,
                });
              }
            }
          }

          if (n1.useDatasetName === true) {
            winTitle = winTitlePrefix + 'Dataset';
            if (datasetName) {
              winTitle += ' - ' + datasetName;
            }

            let dsName = 'Datasets';
            let dsLink1 = PartsLink.dataset_list;
            if ([PartsLink.dataset_detail].includes(mode) && projectId == null) {
              dsName = 'All Datasets';
              dsLink1 = PartsLink.datasets_all;
            }
            res.push({
              text: dsName,
              link: navParams1[dsLink1]?.link,
            });
            if (!Utils.isNullOrEmpty(datasetName ?? datasetId)) {
              res.push({
                text: datasetName ?? datasetId,
                link: navParams1[PartsLink.dataset_detail]?.link,
              });
            }
          }
          if (n1.useDocumentRetriever) {
            if (!n1.hideGroup) {
              res.push({
                text: 'Document Retrievers',
                link: ['', PartsLink.document_retriever_list, projectId].join('/'),
              });
            }
            if (documentRetrieverName) {
              res.push({
                text: documentRetrieverName,
                link: ['', PartsLink.document_retriever_detail, projectId, documentRetrieverId].join('/'),
              });
            }
          }
          if (n1.useModelName === true) {
            winTitle = winTitlePrefix + 'Model';
            if (modelName) {
              winTitle += ' - ' + modelName;
            }

            if (!n1.hideGroup) {
              res.push({
                text: projectUseCase === 'EMBEDDINGS_ONLY' ? 'Catalogs' : projectUseCase === 'AI_AGENT' ? 'Agents' : 'Models',
                link: navParams1[PartsLink.model_list]?.link,
              });
            }
            if (!n1.hideName) {
              if (!n1.useModelNameOnlyTag && !Utils.isNullOrEmpty(modelName ?? modelId)) {
                res.push({
                  text: modelName ?? modelId,
                  link: navParams1[PartsLink.model_detail]?.link,
                });
              }
            }
          }
          if (n1.useAlgorithmName === true) {
            winTitle = winTitlePrefix + 'Algorithm';
            if (algorithmName) {
              winTitle += ' - ' + algorithmName;
            }

            res.push({
              text: 'Algorithms',
              link: navParams1[PartsLink.algorithm_list]?.link,
            });
            if (!Utils.isNullOrEmpty(algorithmName ?? algorithmId)) {
              res.push({
                text: algorithmName ?? algorithmId,
                link: navParams1[PartsLink.algorithm_one + '#projectId']?.link,
              });
            }
          }
          if (n1.useTemplateName === true) {
            winTitle = winTitlePrefix + 'Template';
            if (templateName) {
              winTitle += ' - ' + templateName;
            }

            res.push({
              text: 'Templates',
              link: navParams1[PartsLink.templates_list + '#projectId']?.link ?? navParams1[PartsLink.templates_list]?.link,
            });
            if (!Utils.isNullOrEmpty(templateName ?? templateId)) {
              res.push({
                text: templateName ?? templateId,
                link: navParams1[PartsLink.template_detail]?.link,
              });
            }
          }
          if (n1.useNotebookName === true) {
            winTitle = winTitlePrefix + 'Notebook';
            if (notebookName) {
              winTitle += ' - ' + notebookName;
            }

            res.push({
              text: 'Notebooks',
              link: navParams1[PartsLink.notebook_list + '#projectId']?.link ?? navParams1[PartsLink.notebook_list]?.link,
            });
            if (!Utils.isNullOrEmpty(notebookName ?? notebookId)) {
              res.push({
                text: notebookName ?? notebookId,
                link: navParams1[PartsLink.notebook_details + '#notebookId']?.link,
              });
            }
          }
          if (n1.useMonitorName === true) {
            winTitle = winTitlePrefix + 'Monitor';
            if (modelMonitorName) {
              winTitle += ' - ' + modelMonitorName;
            }

            res.push({
              text: 'Monitors',
              link: navParams1[PartsLink.monitors_list]?.link,
            });
            if (!Utils.isNullOrEmpty(modelMonitorName ?? modelMonitorId)) {
              res.push({
                text: modelMonitorName ?? modelMonitorId,
                link: navParams1[PartsLink.model_detail_monitor]?.link,
              });
            }
          }
          if (n1.useDeployName === true) {
            winTitle = winTitlePrefix + 'Deployment';
            if (deployName) {
              winTitle += ' - ' + deployName;
            }

            res.push({
              text: 'Deployments',
              link: navParams1[PartsLink.deploy_list]?.link,
            });
            if (!Utils.isNullOrEmpty(deployName ?? deployId)) {
              res.push({
                text: deployName ?? deployId,
                link: navParams1[PartsLink.deploy_detail]?.link,
              });
            }
          }
          if (n1.useDeployName === 'one') {
            winTitle = winTitlePrefix + 'Deployment';
            if (deployName) {
              winTitle += ' - ' + deployName;
            }

            if (!Utils.isNullOrEmpty(this.props.paramsProp?.get('deployId'))) {
              res.push({
                text: deployName ?? deployId,
                link: navParams1[PartsLink.deploy_detail]?.link,
              });
            }
          }
          if (n1.useFeatureName === true) {
            winTitle = winTitlePrefix + 'Feature Groups';
            if (featureName) {
              winTitle += ' - ' + featureName;
            }

            if ([PartsLink.feature_group_detail].includes(mode) && projectId == null) {
            } else {
              res.push({
                text: 'Feature Groups',
                link: navParams1[PartsLink.feature_groups]?.link,
              });
            }
            if (!Utils.isNullOrEmpty(featureName ?? featureId)) {
              res.push({
                text: featureName ?? featureId,
                link: navParams1[PartsLink.feature_group_detail]?.link ?? navParams1[PartsLink.feature_groups]?.link,
              });
            }
          }
          if (n1.useEDA === true) {
            winTitle = winTitlePrefix + 'EDA';
            if (edaName && n1.text !== 'Collinearity' && n1.text !== 'Data Consistency' && n1.text !== 'Create New EDA' && n1.text !== 'EDA Data Consistency Analysis') {
              winTitle += ' - ' + edaName;
            }

            res.push({
              text: 'EDA',
              link: navParams1[PartsLink.exploratory_data_analysis]?.link,
            });
            if (!Utils.isNullOrEmpty(edaName ?? edaId) && n1.text !== 'Collinearity' && n1.text !== 'Data Consistency' && n1.text !== 'Create New EDA' && n1.text !== 'EDA Data Consistency Analysis') {
              res.push({
                text: edaName ?? edaId,
                link: navParams1[PartsLink.exploratory_data_analysis_detail]?.link,
              });
            }
          }
          if (n1.usePythonFunctionName === true) {
            winTitle = winTitlePrefix + 'Python Functions';
            if (pythonFunctionName) {
              winTitle += ' - ' + pythonFunctionName;
            }

            res.push({
              text: 'Python Functions',
              link: navParams1[PartsLink.python_functions_list]?.link,
            });
            if (!Utils.isNullOrEmpty(pythonFunctionName ?? pythonFunctionId)) {
              res.push({
                text: pythonFunctionName ?? pythonFunctionId,
                link: navParams1[PartsLink.python_functions_one]?.link ?? navParams1[PartsLink.python_functions_list]?.link,
              });
            }
          }
          if (n1.useModuleName === true) {
            winTitle = winTitlePrefix + 'Modules';
            if (moduleName) {
              winTitle += ' - ' + moduleName;
            }

            res.push({
              text: 'Modules',
              link: navParams1[PartsLink.modules_list]?.link,
            });
          }
          if (n1.usePipelineName) {
            res.push({
              text: 'Pipelines',
              link: ['', PartsLink.pipeline_list, projectId].join('/'),
            });
            if (pipelineName) {
              res.push({
                text: pipelineName,
                link: ['', PartsLink.pipeline_details, projectId || '-', pipelineId].join('/'),
              });
            }
          }
          if (n1.useCustomLossFunctionName === true) {
            winTitle = winTitlePrefix + 'Custom Loss Functions';
            if (customLossFunctionName) {
              winTitle += ' - ' + customLossFunctionName;
            }

            res.push({
              text: 'Custom Loss Functions',
              link: navParams1[PartsLink.custom_loss_functions_list]?.link,
            });
            if (!Utils.isNullOrEmpty(customLossFunctionName ?? customLossFunctionId)) {
              res.push({
                text: customLossFunctionName ?? customLossFunctionId,
                link: navParams1[PartsLink.custom_loss_function_one]?.link ?? navParams1[PartsLink.custom_loss_functions_list]?.link,
              });
            }
          }
          if (n1.useNotebookTemplateName === true) {
            winTitle = winTitlePrefix + 'Notebook Templates';
            if (notebookTemplateName) {
              winTitle += ' - ' + notebookTemplateName;
            }

            res.push({
              text: 'Notebook Templates',
              link: navParams1[PartsLink.notebook_template_list]?.link,
            });
            if (!Utils.isNullOrEmpty(notebookTemplateName ?? notebookTemplateId)) {
              res.push({
                text: notebookTemplateName ?? notebookTemplateId,
                link: navParams1[PartsLink.notebook_template_details]?.link ?? navParams1[PartsLink.notebook_template_list]?.link,
              });
            }
          }
          if (n1.useMonitoringName === true) {
            winTitle = winTitlePrefix + 'Monitoring';
            if (featureName) {
              winTitle += ' - ' + featureName;
            }

            res.push({
              text: 'Monitoring',
              link: navParams1[PartsLink.monitoring]?.link,
            });
          }
          if (n1.usePITName === true) {
            winTitle = winTitlePrefix + 'PIT Group';
            if (pitGroup) {
              winTitle += ' - ' + pitGroup;
            }

            res.push({
              text: 'Features',
              link: navParams1[PartsLink.features_list]?.link,
            });
            if (!Utils.isNullOrEmpty(pitGroup)) {
              res.push({
                text: pitGroup,
                link: navParams1[PartsLink.features_list]?.link ? [navParams1[PartsLink.features_list]?.link, 'pitGroup=' + pitGroup] : undefined,
              });
            }
          }

          if (n1.parentId) {
            const n2 = navParams1[n1.parentId];
            if (n2) {
              if (!Utils.isNullOrEmpty(n2?.text)) {
                if (winTitle === '') {
                  winTitle = winTitlePrefix + n2.text;
                } else {
                  winTitle += ' - ' + n2.text;
                }
              }

              res.push({
                text: n2?.text || '-',
                link: n2?.link,
              });
            }
          }

          if (!Utils.isNullOrEmpty(n1?.text)) {
            if (winTitle === '') {
              winTitle = winTitlePrefix + n1.text;
            } else {
              winTitle += ' - ' + n1.text;
            }
          }

          if (n1.useNotebooksAll) {
            //TODO helpLink = '/help/notebooks';
          }

          res.push(n1);
          return { res, winTitle, helpLink };
        }
      }
    }
  });

  memNavRender = memoizeOne((navItems: INavParam[]) => {
    const classGreenLink = sd.headerWhereGreen;
    const classGreenLinkExtra = sd.headerWhereGreenExtra;
    const classWhiteLink = sd.headerWhere;

    if (navItems) {
      return (
        <span>
          {navItems.map((n1, n1ind) => {
            let res = (
              <span style={{ cursor: Utils.isNullOrEmpty(n1.link) || n1ind === navItems.length - 1 ? 'default' : null }} key={'sp_' + n1ind} className={n1ind < navItems.length - 1 ? classGreenLink : classWhiteLink}>
                {n1.text}
                {n1ind < navItems.length - 1 && (
                  <span className={n1ind < navItems.length - 2 ? classGreenLinkExtra : classWhiteLink} style={{ margin: '0 8px' }}>
                    {'>'}
                  </span>
                )}
              </span>
            );

            if (!Utils.isNullOrEmpty(n1.link) && n1ind < navItems.length - 1) {
              res = (
                <Link noAutoParams usePointer key={'sp_ln_' + n1ind} to={n1.link}>
                  {res}
                </Link>
              );
            }

            if (n1.buttonText != null) {
              let but1 = null;
              if (_.isFunction(n1.buttonClick)) {
                but1 = (
                  <Button onClick={n1.buttonClick} type={'primary'}>
                    {n1.buttonText}
                  </Button>
                );
              } else {
                but1 = (
                  <Link to={n1.buttonClick}>
                    <Button type={'primary'}>{n1.buttonText}</Button>
                  </Link>
                );
              }

              res = (
                <span>
                  {res}
                  <span
                    css={`
                      margin-left: 20px;
                    `}
                  >
                    {but1}
                  </span>
                </span>
              );
            }
            return res;
          })}
        </span>
      );
    }
  });

  render() {
    let isLoggedInRes = calcAuthUserIsLoggedIn();
    let isLoggedIn = isLoggedInRes?.isLoggedIn === true;
    let showInvite = !!isLoggedIn && !!isLoggedInRes.alreadyOrgId && !isLoggedInRes.emailValidateNeeded && !this.props.hideInviteTeam;

    isLoggedIn && this.memProjects(false)(this.props.projects);

    let { authUser } = this.props;
    let isLoggingIn = false;
    if (authUser) {
      isLoggedIn && this.authMem(authUser.get('neverDone'), authUser.get('isRefreshing'), authUser.get('data'));
    }

    const espRoot = 2;

    let projectId = null,
      datasetId = null;
    let isRefreshing = false;

    let { projects, paramsProp, defDatasets, datasets } = this.props;
    let mode = paramsProp && paramsProp.get('mode');

    isLoggedIn && this.memModelList(false)(this.props.models, this.calcProjectId());

    let projectSelectValue = null;
    let optionsProjects = [];
    let showProjects = false;

    let forceProject = false;
    if (mode && [PartsLink.dataset_add, PartsLink.dataset_attach, PartsLink.feature_group_attach].includes(mode)) {
      if (paramsProp) {
        projectId = this.calcProjectId();
        if (projectId) {
          forceProject = true;
        }
      }
    }

    let datasetSelectValue = null;
    let optionsDatasets = [];
    let showDatasets = false;

    let popupContainerForMenu = (node) => document.getElementById('body2');

    const isSearchAdv = mode === PartsLink.search_adv;
    if (isSearchAdv) {
      showInvite = false;
    }

    let spanContent = null;

    let navParams1 = this.memNavParams(this.props.navParamsProp);
    if (navParams1) {
      let mode1 = mode;
      if (mode === PartsLink.profile) {
        mode1 += ' ' + navParams1['profileSection'];
      }
      const navItems = this.memNavItems(navParams1, mode1, this.props.paramsProp);
      const navRender = this.memNavRender(navItems?.res);
      this.memWinTitle(navItems?.winTitle);

      let helpElem;
      if (navItems?.helpLink != null) {
        helpElem = (
          <span
            css={`
              margin-left: 20px;
              font-size: 16px;
              font-weight: 500;
              color: #c7c0b3;
            `}
          >
            <Link usePointer newWindow to={navItems?.helpLink} noApp>
              (Help)
            </Link>
          </span>
        );
      }

      spanContent = (
        <span>
          {navRender}
          {helpElem}
        </span>
      );
    }

    if (spanContent) {
      spanContent = (
        <div style={_.assign({ display: 'flex', height: '100%', alignItems: 'center', margin: '0 15px' }, /*Constants.flags.show_search_top ? {} : */ { paddingTop: '1px' })}>
          <div
            css={`
              margin-right: 15px;
            `}
          >
            {!this.props.isHidden && <NavTopSearch />}
          </div>
          <div style={{ color: 'white' }} className={sd.ellipsis}>
            {spanContent}
          </div>
        </div>
      );
    }

    let userDrop = <UserDropdown />;

    return (
      <div>
        <div
          className={'clearfix'}
          style={{
            zIndex: 5,
            position: 'relative',
            marginLeft: (this.props.noNav ? 0 : this.props.navLeftCollapsed ? Constants.navWidthCollapsed : isSearchAdv ? Constants.navWidthExtended : Constants.navWidth) + (Constants.flags.show_search_top ? 2 : 0) + 'px',
            backgroundColor: Constants.navHeaderColor(),
            display: this.props.isHidden ? 'none' : 'block',
            height: Constants.headerHeight() + 'px',
          }}
        >
          <ModalAlert ref="newName" title={'New '} onClickResp={this.onClickRespModal} yesText={this.state.newId ? 'Edit ' : 'Create '} noText={'Cancel'}>
            <label htmlFor="newName">Name:</label>
            <input
              className="form-control"
              placeholder=" name"
              id="newName"
              value={this.state.newName}
              onChange={(e) => {
                this.setState({ newName: e.target.value });
              }}
            />
          </ModalAlert>

          <ModalAlert ref="connectAccount" title={'Connect Account'} yesText={'Done'}></ModalAlert>

          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, height: Constants.headerHeight() + 'px' }}>
            <div style={{ position: 'relative', margin: espRoot + 'px ' + 2 * espRoot + 'px ' + espRoot + 'px ' + espRoot + 'px ', borderRadius: '4px', height: Constants.headerHeight() - 3 * espRoot + 'px' }}>
              {
                /*!ShowTopHeader(mode) && */ <div style={{ float: 'right', marginLeft: '20px', marginRight: '12px', height: Constants.headerHeight() - 3 * espRoot + 'px', display: 'table', marginTop: '1px' }}>
                  {showInvite && (
                    <span style={{ marginRight: '26px', display: 'inline-flex', height: '100%', alignItems: 'center', paddingBottom: '2px', opacity: 0.7 }}>
                      <Link to={'/' + PartsLink.profile + '/' + UserProfileSection.invites}>
                        <Button style={{ borderColor: Utils.colorA(0.4) }} type={'default'} ghost>
                          Invite Team
                        </Button>
                      </Link>
                    </span>
                  )}

                  {Constants.flags.show_alerts && (
                    <span style={{ marginRight: '5px', height: '100%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                      <AlertsIcon />
                    </span>
                  )}

                  {isLoggedIn && (
                    <Popover onOpenChange={this.onUserDropVisibleChange} open={this.state.isUserDropVisible} content={userDrop} title={'User'} trigger={'click'} getPopupContainer={popupContainerForMenu} placement={'bottomRight'}>
                      <span style={{ display: 'table-cell', verticalAlign: 'middle', height: '100%' }}>
                        <UserCardNav />
                      </span>
                    </Popover>
                  )}
                </div>
              }

              {showProjects && (
                <span style={{ display: 'flex', whiteSpace: 'nowrap', height: '100%', alignItems: 'center', margin: '0 30px', paddingTop: '1px' }}>
                  <span style={{ flex: 0, display: 'inline-block', whiteSpace: 'nowrap' }}>
                    <span style={{ opacity: 0.8, marginRight: '5px', color: Utils.isDark() ? 'white' : 'black', fontSize: '14px' }}>Selected Project:</span>
                    <span style={{ width: '440px', display: 'inline-block' }}>
                      <SelectExt isDisabled={forceProject} value={projectSelectValue} options={optionsProjects} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                    </span>
                  </span>
                </span>
              )}
              {showDatasets && (
                <span style={{ display: 'flex', whiteSpace: 'nowrap', height: '100%', alignItems: 'center', margin: '0 30px', paddingTop: '1px' }}>
                  <span style={{ flex: 0, display: 'inline-block', whiteSpace: 'nowrap' }}>
                    <span style={{ opacity: 0.8, marginRight: '5px', color: Utils.isDark() ? 'white' : 'black', fontSize: '14px' }}>Dataset:</span>
                    <span style={{ width: '440px', display: 'inline-block' }}>
                      <SelectExt value={datasetSelectValue} options={optionsDatasets} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                    </span>
                    {!isRefreshing && (
                      <span>
                        <Button type={'primary'} ghost style={{ marginLeft: '10px' }} onClick={this.onClickRefreshDatasets}>
                          Refresh
                        </Button>
                      </span>
                    )}
                  </span>
                </span>
              )}

              {spanContent}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    useCases: state.useCases,
    projects: state.projects,
    defDatasets: state.defDatasets,
    datasets: state.datasets,
    models: state.models,
    deployments: state.deployments,
    helpParam: state.help,
    navParamsProp: state.navParams,
  }),
  null,
)(Header);
