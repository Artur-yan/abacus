import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import Menu from 'antd/lib/menu';
import confirm from 'antd/lib/modal/confirm';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import { calcDeploymentsByProjectId, DeploymentLifecycle, DeploymentLifecycleDesc } from '../../stores/reducers/deployments';
import { calcDeploymentsTokensByProjectId } from '../../stores/reducers/deploymentsTokens';
import featureGroups from '../../stores/reducers/featureGroups';
import { calcModelListByProjectId } from '../../stores/reducers/models';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModalProgress from '../ModalProgress/ModalProgress';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';

const s = require('./DeploymentsList.module.css');
const sd = require('../antdUseDark.module.css');

const Text = {
  deploymentRenameSuccess: 'Deployment renamed successfully!',
  renameDialog: {
    title: 'Rename Deployment',
    okText: 'Rename',
    cancelText: 'Cancel',
  },
};

interface IDeploymentsListProps {
  deployments?: any;
  deploymentsTokens?: any;
  projects?: any;
  models?: any;
  featureGroups?: any;
  paramsProp?: any;
  projectId?: string;

  isChecked?: boolean;
  isSmall?: boolean;
  showFilters?: boolean;
  isDrift?: boolean;
  showTokens?: boolean;
  showMetrics?: boolean;
  showCreate?: boolean;
  filterByModelId?: any;
  isDetailTheme?: boolean;
  defaultChecked?: any;
  onChangeChecked?: (keys: any[]) => void;
  whiteText?: boolean;
  noAutoTooltip?: boolean;
}

interface IDeploymentsListState {
  filterModelAlgoId?: string;
  filterModelId?: string;
  filterModelVersionId?: string;
  filterFGId?: string;
  filterFGVersionId?: string;
}

class DeploymentsList extends React.PureComponent<IDeploymentsListProps, IDeploymentsListState> {
  private modalProgress: any;
  private deployIdProgress: string;
  private deployIdProgressAlready: any;
  private isM: boolean;

  constructor(props) {
    super(props);

    this.state = {};

    this.deployIdProgressAlready = [];
  }

  componentDidMount(): void {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;
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

    let projectId = this.props.projectId ?? (this.props.paramsProp && this.props.paramsProp.get('projectId'));
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let listDeploymentsTokens = this.props.showTokens ? this.memDeploymentTokensList(true)(this.props.deploymentsTokens, projectId) : null;
    let listDeploymentsList = this.memDeploymentList(true)(this.props.deployments, projectId, this.state.filterModelId ?? this.state.filterFGId, this.state.filterModelAlgoId);

    let isFeatureStore = foundProject1?.isFeatureStore ?? false;

    if (this.props.showFilters) {
      if (isFeatureStore) {
        let FGList = this.memFGList(false)(this.props.featureGroups, projectId);
      } else {
        let modelsList = this.memModelList(true)(this.props.models, projectId);
      }
    }
  };

  componentDidUpdate(prevProps: Readonly<IDeploymentsListProps>, prevState: Readonly<IDeploymentsListState>, snapshot?: any): void {
    this.doMem();
  }

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memDeploymentList = memoizeOneCurry((doCall, deployments, projectId, filterByModelId, filterFGAlgoId) => {
    if (deployments && projectId) {
      let res = calcDeploymentsByProjectId(undefined, projectId);
      if (res == null) {
        if (deployments.get('isRefreshing') !== 0) {
          return;
        }

        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        return res?.map((r1) => {
          r1.lifecycleReal = r1.status;
          r1.usage = (r1.callsPerSecond || '-') + ' calls/sec';
          return r1;
        });
      }
    }
  });

  memDeploymentListFilter = memoizeOne((listDeploymentsList, projectId, filterByModelId, filterFGAlgoId) => {
    if (listDeploymentsList) {
      let res = [...(listDeploymentsList ?? [])];
      if (filterByModelId != null && filterByModelId !== '') {
        res = res?.filter((r1) => r1.modelId === filterByModelId || r1.featureGroupId === filterByModelId);
      }
      if (filterFGAlgoId != null && filterFGAlgoId !== '') {
        res = res?.filter((r1) => r1.algoName === filterFGAlgoId);
      }
      return res;
    }
  });

  memDeploymentListTokens = memoizeOne((deployList, listDeploymentsTokens) => {
    let res = deployList;

    res = res?.sort((a, b) => {
      let res = 0;
      if (a.starred && !b.starred) {
        res = -1;
      } else if (!a.starred && b.starred) {
        res = 1;
      }
      if (res === 0) {
        let ma = a.deployedAt;
        let mb = b.deployedAt;
        if (ma && mb) {
          res = moment(mb).diff(moment(ma));
        }
      }
      return res;
    });

    deployList = res;

    if (deployList && listDeploymentsTokens) {
      let tokens = <span></span>;
      if (listDeploymentsTokens) {
        let tt = [];
        listDeploymentsTokens.some((t1) => {
          if (tt.length > 0) {
            tt.push(<br key={'tt_' + tt.length} />);
          }
          tt.push(
            <span key={'tt_' + tt.length} style={{ lineHeight: 1.2 }}>
              {t1.deploymentToken}
            </span>,
          );
        });
        tokens = <span style={{}}>{tt}</span>;
      }

      return deployList.map((r1) => {
        r1.tokens = tokens;
        return r1;
      });
    }
    return deployList;
  });

  onClickDeleteDeploy = (deploymentId) => {
    if (deploymentId) {
      REClient_.client_().deleteDeployment(deploymentId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Done!');

          let projectId = this.props.projectId ?? (this.props.paramsProp && this.props.paramsProp.get('projectId'));
          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersions_(deploymentId);
          StoreActions.refreshDoDeployAll_(deploymentId, projectId);
        }
      });
    }
  };

  onDeploymentRename = async (deploymentId, deploymentName, modalRef) => {
    const updatedDeployment = await REClient_.promises_().renameDeployment(deploymentId, deploymentName);
    modalRef.destroy();
    try {
      if (!updatedDeployment?.success) {
        throw new Error(updatedDeployment.error);
      }

      REActions.addNotification(Text.deploymentRenameSuccess);
      let projectId = this.props.projectId ?? (this.props.paramsProp && this.props.paramsProp.get('projectId'));
      StoreActions.deployList_(projectId);
      StoreActions.listDeployVersions_(deploymentId);
      StoreActions.refreshDoDeployAll_(deploymentId, projectId);
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  showRenameDialog = (deploymentId, deploymentName) => {
    let newDeploymentName = deploymentName;
    let modalRef = confirm({
      title: Text.renameDialog.title,
      okText: Text.renameDialog.okText,
      cancelText: Text.renameDialog.cancelText,
      maskClosable: true,
      content: (
        <div>
          <div>{`Current Name:${deploymentName}`}</div>
          <Input style={{ marginTop: '8px' }} placeholder={deploymentName} defaultValue={deploymentName} onChange={(e) => (newDeploymentName = e.target.value)} />
        </div>
      ),
      onOk: () => this.onDeploymentRename(deploymentId, newDeploymentName, modalRef),
      onCancel: () => modalRef.destroy(),
    });
  };

  onClickRestartDeployment = (deploymentId, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    if (deploymentId) {
      REClient_.client_().startDeployment(deploymentId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Re-Starting Deployment');

          let projectId = this.props.projectId ?? (this.props.paramsProp && this.props.paramsProp.get('projectId'));
          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersions_(deploymentId);
          StoreActions.refreshDoDeployAll_(deploymentId, projectId);
        }
      });
    }
  };

  onClickStopDeployment = (deploymentId) => {
    if (deploymentId) {
      REClient_.client_().stopDeployment(deploymentId, (err, res) => {
        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Stopping Deployment');

          let projectId = this.props.projectId ?? (this.props.paramsProp && this.props.paramsProp.get('projectId'));
          StoreActions.deployList_(projectId);
          StoreActions.listDeployVersions_(deploymentId);
          StoreActions.refreshDoDeployAll_(deploymentId, projectId);
        }
      });
    }
  };

  onClickStarred = (deploymentId, starred, e) => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (!projectId) {
      return;
    }

    REClient_.client_()._starDeployment(deploymentId, starred, (err, res) => {
      StoreActions.deployList_(projectId);
    });
  };

  memColumns = memoizeOne((listDeployments, projectId, showMetrics, isChecked, isDrift, isPnp, isPnpPython, isSentimentAnalysis, isEmbeddingsOnly, isAiAgent, isFeatureStore, isNlpChat, showPredAPI, showPredDash) => {
    let columns: ITableExtColumn[] = [
      {
        title: '',
        field: 'starred',
        helpId: '',
        noAutoTooltip: true,
        render: (starred, row, index) => {
          return <StarredSpan name={'Deployment'} isStarred={starred} onClick={this.onClickStarred.bind(this, row.deploymentId)} />;
        },
        hidden: isChecked,
      },
      {
        title: 'Name',
        field: 'name',
        render: (text, row, index) => {
          let isProd = null;
          if (calcAuthUserIsLoggedIn()?.isInternal === true) {
            if (row.isProd) {
              isProd = (
                <span
                  css={`
                    margin-left: 5px;
                    color: darkred;
                  `}
                >
                  (PROD)
                </span>
              );
            }
          }

          return (
            <span className={this.props.isChecked || isDrift ? '' : sd.linkBlue}>
              {text}
              {isProd}
            </span>
          );
        },
      },
      {
        title: 'Deployment ID',
        field: 'deploymentId',
        helpId: 'deploymentid',
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
        hidden: isDrift === true || isChecked,
      },
      {
        title: 'Deployed',
        field: 'deployedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld date={text} />;
        },
        hidden: isDrift === true || isChecked,
      },
    ];
    if (!isPnp && !isFeatureStore) {
      columns.push({
        title: 'Algorithm',
        field: 'algoName',
        helpId: 'deployListAlgoName',
        render: (text, row, index) => {
          return text;
        },
        hidden: isDrift === true || isAiAgent,
      });
    }
    if (isFeatureStore) {
      columns.push({
        title: 'Feature Group Name',
        field: 'featureGroupName',
        hidden: isDrift === true,
      });
      columns.push({
        title: 'Batch vs. Real-Time + Batch',
        field: 'offlineOnly',
        hidden: isDrift === true,
        render: (text, row, index) => {
          return <span>{row.offlineOnly ? 'Batch' : 'RealTime'}</span>;
        },
      });
    }
    if (!isFeatureStore) {
      columns = columns.concat([
        {
          title: isEmbeddingsOnly ? 'Catalog' : isAiAgent ? 'Agent' : 'Model',
          field: ['modelName'],
          helpId: isAiAgent ? 'deployListAgentName' : 'deployListModelName',
          render: (text, row, index) => {
            return (
              <Link forceSpanUse className={sd.linkBlue} to={['/' + PartsLink.model_detail + '/' + row['modelId'] + '/' + row['projectId']]}>
                {text}
              </Link>
            );
          },
          hidden: isDrift === true,
        },
      ]);
      columns = columns.concat([
        {
          title: isEmbeddingsOnly ? 'Attached Catalog Version' : isAiAgent ? 'Attached Agent Version' : 'Attached Model Version',
          field: ['modelVersion'],
          helpId: isAiAgent ? 'attached_agent_version' : 'attached_model_version',
          hideLessMedium: true,
          render: (text, row, index) => {
            return (
              <Link forceSpanUse className={sd.linkBlue} to={['/' + PartsLink.model_detail + '/' + row['modelId'] + '/' + row['projectId']]}>
                <CopyText>{text}</CopyText>
              </Link>
            );
          },
          hidden: isDrift === true,
        },
        // {
        //   title: 'Model Version',
        //   field: ['modelName'],
        //   render: (text, row, index) => {
        //     return <CopyText>{text}</CopyText>;
        //   },
        // },
        {
          title: 'Provisioned QPS',
          field: 'usage',
          helpId: 'qps',
          hideLessMedium: true,
          hidden: isDrift === true,
        },
      ]);
    }
    columns = columns.concat([
      {
        hidden: isDrift === true,
        title: 'Status',
        field: 'status',
        helpId: 'deployment_status',
        render: (text, row, index) => {
          let isProcessing = row.deploymentId && StoreActions.refreshDeployUntilStateIsUploading_(row.deploymentId);

          if (isProcessing) {
            let str1 = Utils.upperFirst(row.status ?? 'Deploying');
            if ([DeploymentLifecycle.STOPPING].includes(row.status)) {
              str1 = 'Suspending';
            }

            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{str1}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            if (!isProcessing && [DeploymentLifecycle.PENDING, DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.STOPPING].includes(row.lifecycleReal || '')) {
              StoreActions.refreshDoDeployAll_(row.deploymentId, projectId);
            }

            if ((row.offlineOnly || !row.deployedAt) && text === DeploymentLifecycle.STOPPED) {
              text = 'Offline';
            } else {
              text = DeploymentLifecycleDesc[text ?? '-'] || text;
            }

            let res = <span style={{ whiteSpace: 'nowrap' }}>{text}</span>;
            if ((text || '').toLowerCase() === 'failed') {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ((text || '').toLowerCase() === 'failed') {
            if (row.lifecycleMsg) {
              res = (
                <span>
                  <span
                    css={`
                      margin-right: 5px;
                    `}
                  >
                    Error:
                  </span>
                  <span
                    css={`
                      color: #bf2c2c;
                    `}
                  >
                    {row.lifecycleMsg}
                  </span>
                </span>
              );
            }
          }
          return res;
        },
      },
    ]);

    if (isPnp) {
      columns = columns?.filter((c1) => c1.field !== 'algoName');
    }

    if (!isChecked && this.props.showTokens) {
      columns.push({
        title: 'Tokens',
        field: 'tokens',
        hidden: isDrift === true,
      });
    }

    if (!isChecked && showMetrics && listDeployments && listDeployments.length > 0 && listDeployments[0] && !isDrift) {
      let metricsRes = listDeployments[0].metrics;
      if (metricsRes) {
        let metricNames = metricsRes.metricNames;
        if (metricNames && _.isArray(metricNames)) {
          metricNames.some((c1) => {
            let nameSmall = (Object.keys(c1) || [])[0];
            let nameLarge = c1[nameSmall];

            if (!_.isString(nameSmall) || !_.isString(nameLarge)) {
              return false;
            }

            columns.push({
              title: nameLarge,
              field: ['metrics', 'metrics', nameSmall],
              render: (text, row, index) => {
                text = row?.metrics?.metrics ? row.metrics.metrics[nameSmall] : null;

                let res = null;
                let n1 = Utils.tryParseFloat(text, null);
                if (n1 != null) {
                  res = Utils.roundDefault(n1);
                } else {
                  res = text;
                }
                const format1 = metricsRes.metricInfos?.[nameSmall]?.format;
                if (Utils.isNullOrEmpty(res)) {
                  return res;
                } else if (Utils.isNullOrEmpty(format1)) {
                  return res;
                } else {
                  return '' + res + format1;
                }
              },
            });
          });
        }
      }
    }

    if (isFeatureStore && !isDrift) {
      columns.push({
        title: 'actions',
        noAutoTooltip: true,
        noLink: true,
        field: 'actions',
        render: (text, row) => {
          let lifecycle = row.status;
          if (!lifecycle) {
            return <span></span>;
          } else {
            return (
              <span style={{ whiteSpace: 'normal' }}>
                <Link to={this.calcLink(row)} forceSpanUse>
                  <Button ghost type={'default'}>
                    Details
                  </Button>
                </Link>
              </span>
            );
          }
        },
        width: 130,
      });
    } else {
      columns.push({
        title: 'actions',
        noAutoTooltip: true,
        noLink: true,
        field: 'actions',
        render: (text, row) => {
          let lifecycle = row.status;
          if (!lifecycle) {
            return <span></span>;
          } else {
            let popupContainerForMenu = (node) => document.getElementById('body2');

            const menu = (
              <Menu getPopupContainer={popupContainerForMenu}>
                {
                  <Menu.Item onClick={() => this.showRenameDialog(row?.deploymentId, row?.name)}>
                    <div style={{ margin: '-6px -12px', padding: '6px 12px' }}>Rename</div>
                  </Menu.Item>
                }
                {DeploymentLifecycle.ACTIVE === lifecycle && (
                  <Menu.Item>
                    <ModalConfirm
                      onConfirm={this.onClickStopDeployment.bind(this, row?.deploymentId)}
                      title={`Do you want to suspend deployment "${row.name || ''}"?`}
                      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                      okText={'Suspend'}
                      cancelText={'Cancel'}
                      okType={'danger'}
                    >
                      <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red' }}>Suspend</div>
                    </ModalConfirm>
                  </Menu.Item>
                )}
                {![DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING].includes(lifecycle) && (
                  <Menu.Item>
                    <ModalConfirm
                      onConfirm={this.onClickDeleteDeploy.bind(this, row?.deploymentId)}
                      title={`Do you want to delete deployment "${row.name || ''}"?`}
                      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                      okText={'Delete'}
                      cancelText={'Cancel'}
                      okType={'danger'}
                    >
                      <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red' }}>Delete</div>
                    </ModalConfirm>
                  </Menu.Item>
                )}
              </Menu>
            );

            const styleButton: CSSProperties = { marginLeft: '8px', marginBottom: '8px' };
            const showMenu = DeploymentLifecycle.ACTIVE === lifecycle || ![DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING].includes(lifecycle);

            if (isDrift) {
              return (
                <span style={{ whiteSpace: 'normal' }}>
                  {[DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                    <Link forceSpanUse to={'/' + PartsLink.monitoring_drift + '/' + projectId + '/' + row.deploymentId}>
                      <Button style={{ margin: '4px' }} type={'default'} ghost>
                        Model Drift
                      </Button>
                    </Link>
                  )}
                  {[DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                    <Link forceSpanUse to={'/' + PartsLink.monitoring_drift_bp + '/' + projectId + '/' + row.deploymentId}>
                      <Button style={{ margin: '4px' }} type={'default'} ghost>
                        Model Drift Batch
                      </Button>
                    </Link>
                  )}
                  {[DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                    <Link forceSpanUse to={'/' + PartsLink.monitoring_metrics + '/' + projectId + '/' + row.deploymentId}>
                      <Button style={{ margin: '4px' }} type={'default'} ghost>
                        Real-Time Metrics
                      </Button>
                    </Link>
                  )}
                  {[DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                    <Link forceSpanUse to={'/' + PartsLink.monitoring_pred_log + '/' + projectId + '/' + row.deploymentId}>
                      <Button style={{ margin: '4px' }} type={'default'} ghost>
                        Pred. Logs
                      </Button>
                    </Link>
                  )}
                  {[DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                    <Link forceSpanUse to={'/' + PartsLink.realtime_data_integrity + '/' + projectId + '/' + row.deploymentId}>
                      <Button style={{ margin: '4px' }} type={'default'} ghost>
                        Data Integrity
                      </Button>
                    </Link>
                  )}

                  {[DeploymentLifecycle.FAILED, DeploymentLifecycle.STOPPED, DeploymentLifecycle.CANCELLED].includes(lifecycle) && (
                    <Button style={{ marginLeft: '8px', marginBottom: '4px' }} onClick={this.onClickRestartDeployment.bind(this, row?.deploymentId)} ghost>
                      Re-Start
                    </Button>
                  )}
                  {/*{showMenu && lifecycle!==DeploymentLifecycle.DELETING && <Dropdown overlay={menu} trigger={['click']}>*/}
                  {/*  <Button style={styleButton} ghost type={'default'} onClick={this.onClickCancelEvents}>Actions</Button>*/}
                  {/*</Dropdown>}*/}
                </span>
              );
            }

            return (
              <span style={{ whiteSpace: 'normal' }}>
                {showPredDash && [DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                  <Link forceSpanUse to={'/' + PartsLink.model_predictions + '/' + projectId + '/' + row.deploymentId}>
                    <Button style={{ marginLeft: '8px', marginBottom: '4px' }} type={'default'} ghost>
                      Dashboard
                    </Button>
                  </Link>
                )}
                {showPredAPI && !isNlpChat && [DeploymentLifecycle.ACTIVE].includes(lifecycle) && (
                  <Link forceSpanUse to={'/' + PartsLink.deploy_predictions_api + '/' + projectId + '/' + row.deploymentId}>
                    <Button style={{ marginBottom: '4px', marginLeft: '8px' }} type={'default'} ghost>
                      Predictions API
                    </Button>
                  </Link>
                )}
                {[DeploymentLifecycle.FAILED, DeploymentLifecycle.STOPPED, DeploymentLifecycle.CANCELLED].includes(lifecycle) && (
                  <Button style={{ marginLeft: '8px', marginBottom: '4px' }} onClick={this.onClickRestartDeployment.bind(this, row?.deploymentId)} ghost>
                    Re-Start
                  </Button>
                )}
                {showMenu && lifecycle !== DeploymentLifecycle.DELETING && (
                  <DropdownExt overlay={menu} trigger={['click']}>
                    <Button style={styleButton} ghost type={'default'} onClick={this.onClickCancelEvents}>
                      Actions
                    </Button>
                  </DropdownExt>
                )}
              </span>
            );
          }
        },
      });
    }

    if (isChecked) {
      columns = [columns?.find((c1) => c1.field === 'name')];
    }
    columns = columns?.filter((v1) => v1.hidden !== true);

    return columns;
  });

  onClickUpdateToModelVersion = (deploymentId, modelVersion, algorithm, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!deploymentId || !modelVersion) {
      return;
    }

    REClient_.client_()._promoteDeploymentVersion(deploymentId, modelVersion, algorithm, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.listDeployVersions_(deploymentId);
      }
    });
  };

  onClickCancelEvents = (e) => {
    // e.preventDefault();
    e.stopPropagation();
  };

  memDeploymentTokensList = memoizeOneCurry((doCall, deploymentsTokens, projectId) => {
    if (deploymentsTokens) {
      if (deploymentsTokens.get('isRefreshing')) {
        return;
      }
      //
      let res = calcDeploymentsTokensByProjectId(undefined, projectId);
      if (res == null) {
        if (doCall) {
          StoreActions.deployTokensList_(projectId);
        }
      } else {
        return res;
      }
    }
  });

  memConfirm = memoizeOne((listDeployments, modalDeployRefresh) => {
    if (listDeployments && modalDeployRefresh) {
      let mm = modalDeployRefresh?.split('-');
      if (mm && mm.length > 0) {
        mm.some((mId1) => {
          if (!mId1) {
            return false;
          }

          let find1 = listDeployments.find((m1) => m1.deploymentId === mId1);

          if (this.deployIdProgress != null && this.deployIdProgress === mId1) {
            if (find1 != null && [DeploymentLifecycle.STOPPING, DeploymentLifecycle.STOPPED, DeploymentLifecycle.ACTIVE, DeploymentLifecycle.FAILED, DeploymentLifecycle.CANCELLED].includes(find1.status)) {
              this.modalProgress?.hide();
              this.deployIdProgress = null;
            }
          } else if (find1 != null && [DeploymentLifecycle.DEPLOYING, DeploymentLifecycle.PENDING].includes(find1.status)) {
            if (!this.deployIdProgressAlready?.[mId1]) {
              this.deployIdProgress = mId1;
              this.deployIdProgressAlready?.push(mId1);
              this.modalProgress?.show();
            }
            return true;
          }
        });
      }
    }
  });

  memFGList = memoizeOneCurry((doCall, featureGroupsParam, projectId) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

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

  memDefaultChecked = memoizeOne((listDeployments) => {
    if (listDeployments && listDeployments.length > 0) {
      return [listDeployments[listDeployments.length - 1].deploymentId];
    }
  });

  calcLink = (row) => {
    let projectId = this.props.projectId ?? this.props.paramsProp?.get('projectId');
    return projectId ? '/' + PartsLink.deploy_detail + '/' + projectId + '/' + row?.deploymentId : null;
  };

  onChangeFilterFGVersion = (option1) => {
    this.setState({
      filterFGVersionId: option1?.value,
    });
  };

  onChangeFilterModelVersion = (option1) => {
    this.setState({
      filterModelVersionId: option1?.value,
    });
  };

  onChangeFilterFG = (option1) => {
    this.setState({
      filterFGId: option1?.value,
      filterFGVersionId: undefined,
    });
  };

  onChangeFilterModel = (option1) => {
    this.setState({
      filterModelId: option1?.value,
      filterModelVersionId: undefined,
    });
  };

  onChangeFilterModelAlgo = (option1) => {
    this.setState({
      filterModelAlgoId: option1?.value,
    });
  };

  memOptionsFGList = memoizeOne((listDeployments, FGList) => {
    let res = [],
      already = {};

    FGList?.some((m1) => {
      let featureGroupId = m1.featureGroupId;

      if (listDeployments?.some((d1) => d1.featureGroupId === featureGroupId)) {
        if (already[featureGroupId] == null) {
          already[featureGroupId] = true;

          res.push({ label: m1.tableName, value: featureGroupId });
        }
      }
    });

    res = _.sortBy(res, 'label');

    res.unshift({ label: '(All)', value: undefined });

    return res;
  });

  memOptionsModelsAlgos = memoizeOne((listDeployments) => {
    let res = [],
      already = {};

    listDeployments?.some((d1) => {
      if (already[d1.algoName] == null) {
        already[d1.algoName] = true;

        res.push({ label: d1.algoName, value: d1.algoName });
      }
    });

    res = _.sortBy(res, 'label');

    res.unshift({ label: '(All)', value: undefined });

    return res;
  });

  memOptionsModelsList = memoizeOne((listDeployments, modelsList) => {
    let res = [],
      already = {};

    modelsList?.some((m1) => {
      let modelId = m1.get('modelId');
      if (listDeployments?.some((d1) => d1.modelId === modelId)) {
        if (already[modelId] == null) {
          already[modelId] = true;

          res.push({ label: m1.get('name'), value: modelId });
        }
      }
    });

    res.unshift({ label: '(All)', value: undefined });

    return res;
  });

  memOptionsFGVerionList = memoizeOne((listDeployments, filterFGId) => {
    let res = [],
      already = {};

    listDeployments?.some((d1) => {
      let featureGroupId = d1.featureGroupId;
      if (featureGroupId === filterFGId && filterFGId != null) {
        let featureGroupVersion = d1.featureGroupVersion;
        if (already[featureGroupVersion] == null) {
          already[featureGroupVersion] = true;

          res.push({ label: featureGroupVersion, value: featureGroupVersion });
        }
      }
    });

    res.unshift({ label: '(All)', value: undefined });

    return res;
  });

  memOptionsModelsVerionList = memoizeOne((listDeployments, filterModelId) => {
    let res = [],
      already = {};

    listDeployments?.some((d1) => {
      let modelId = d1.modelId;
      if (modelId === filterModelId && filterModelId != null) {
        let modelVersion = d1.modelVersion;
        if (already[modelVersion] == null) {
          already[modelVersion] = true;

          res.push({ label: modelVersion, value: modelVersion });
        }
      }
    });

    res.unshift({ label: '(All)', value: undefined });

    return res;
  });

  memDeployFilterVersion = memoizeOne((listDeploymentsList, filterModelVersionId) => {
    if (Utils.isNullOrEmpty(filterModelVersionId)) {
      return listDeploymentsList;
    } else {
      return listDeploymentsList?.filter((d1) => d1?.modelVersion === filterModelVersionId);
    }
  });

  memDeployFilterVersionFS = memoizeOne((listDeploymentsList, filterFGId, filterFGVersionId) => {
    let res = listDeploymentsList;
    if (!Utils.isNullOrEmpty(filterFGId)) {
      res = res?.filter((d1) => d1?.featureGroupId === filterFGId);
    }
    if (!Utils.isNullOrEmpty(filterFGVersionId)) {
      res = res?.filter((d1) => d1?.featureGroupVersion === filterFGVersionId);
    }
    return res;
  });

  render() {
    let { deployments, paramsProp } = this.props;

    let projectId = this.props.projectId ?? (paramsProp && paramsProp.get('projectId'));
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let isFeatureStore = foundProject1?.isFeatureStore ?? false;
    let isPnp = foundProject1?.isPnp ?? false;
    const isPnpPython = foundProject1?.isPnpPython === true;
    const isSentimentAnalysis = foundProject1?.useCase === 'NLP_SENTIMENT';
    const isEmbeddingsOnly = foundProject1?.useCase === 'EMBEDDINGS_ONLY';
    const isAiAgent = foundProject1?.useCase === 'AI_AGENT';
    const isNlpChat = foundProject1?.useCase === 'NLP_CHAT';
    let showPredAPI = foundProject1?.showPredictionApi;
    let showPredDash = foundProject1?.showPredictionDashboard;

    let listDeploymentsTokens = this.props.showTokens ? this.memDeploymentTokensList(false)(this.props.deploymentsTokens, projectId) : null;

    let listDeploymentsList = this.memDeploymentList(false)(deployments, projectId, this.props.filterByModelId ?? this.state.filterModelId, this.state.filterModelAlgoId);
    let listDeploymentsListFilter = listDeploymentsList == null ? null : [...(listDeploymentsList ?? [])];
    if (isFeatureStore) {
      listDeploymentsListFilter = this.memDeployFilterVersionFS(listDeploymentsListFilter, this.state.filterFGId, this.state.filterFGVersionId);
    } else {
      listDeploymentsListFilter = this.memDeployFilterVersion(listDeploymentsListFilter, this.state.filterModelVersionId);
    }
    listDeploymentsListFilter = this.memDeploymentListFilter(listDeploymentsListFilter, projectId, this.props.filterByModelId ?? this.state.filterModelId, this.state.filterModelAlgoId);
    let listDeployments = this.memDeploymentListTokens(listDeploymentsListFilter, listDeploymentsTokens);
    this.memConfirm(listDeployments, paramsProp?.get('modalDeployRefresh'));

    let columns: ITableExtColumn[] = this.memColumns(
      listDeployments,
      projectId,
      this.props.showMetrics,
      this.props.isChecked,
      this.props.isDrift,
      isPnp,
      isPnpPython,
      isSentimentAnalysis,
      isEmbeddingsOnly,
      isAiAgent,
      isFeatureStore,
      isNlpChat,
      showPredAPI,
      showPredDash,
    );

    let isRefreshing = false;
    if (deployments) {
      if (deployments.get('isRefreshing') !== 0) {
        isRefreshing = true;
      }
    }

    let defaultChecked = this.props.isChecked ? this.memDefaultChecked(listDeploymentsList) : null;

    let optionsFGList = Utils.emptyStaticArray();
    let optionsFGVersionList = Utils.emptyStaticArray();
    let optionsModelsList = Utils.emptyStaticArray();
    let optionsModelsVersionList = Utils.emptyStaticArray();
    let optionsModelsAlgosList = Utils.emptyStaticArray();
    if (this.props.showFilters) {
      if (isFeatureStore) {
        let FGList = this.memFGList(false)(this.props.featureGroups, projectId);
        optionsFGList = this.memOptionsFGList(listDeploymentsList, FGList);
        optionsFGVersionList = this.memOptionsFGVerionList(listDeploymentsList, this.state.filterFGId);
      } else {
        let modelsList = this.memModelList(false)(this.props.models, projectId);
        optionsModelsList = this.memOptionsModelsList(listDeploymentsList, modelsList);
        optionsModelsVersionList = this.memOptionsModelsVerionList(listDeploymentsList, this.state.filterModelId);
        optionsModelsAlgosList = this.memOptionsModelsAlgos(listDeploymentsList);
      }
    }

    let tableHH = (hh, forceRelative = false) => (
      <RefreshAndProgress isRelative={forceRelative || hh == null} isRefreshing={isRefreshing} style={hh == null || forceRelative ? {} : { top: topAfterHeaderHH + 'px' }}>
        <TableExt
          noAutoTooltip={this.props.noAutoTooltip}
          whiteText={this.props.whiteText}
          isDetailTheme={this.props.isDetailTheme}
          showEmptyIcon={true}
          notsaveSortState={'deployment_list'}
          height={hh}
          dataSource={listDeployments}
          columns={columns}
          defaultChecked={defaultChecked}
          onChangeChecked={this.props.onChangeChecked}
          rowAsCheckbox={this.props.isChecked}
          isChecked={this.props.isChecked}
          calcKey={(r1) => r1.deploymentId}
          calcLink={this.props.isChecked || this.props.isDrift ? null : this.calcLink}
        />
      </RefreshAndProgress>
    );

    let table = null;
    if (this.props.isChecked) {
      table = tableHH(200, true);
    } else if (this.props.isSmall) {
      table = tableHH(null);
    } else {
      table = <AutoSizer disableWidth>{({ height }) => tableHH(height - topAfterHeaderHH)}</AutoSizer>;
    }

    let showFilters = this.props.showFilters;
    return (
      <div
        className={(this.props.isSmall || this.props.isChecked ? '' : sd.absolute) + ' ' + sd.table}
        style={
          _.assign(
            { margin: this.props.isChecked ? 0 : this.props.isDetailTheme ? '25px 0' : '25px' },
            this.props.isSmall || this.props.isChecked ? (this.props.isChecked ? {} : {}) : { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
          ) as CSSProperties
        }
      >
        {!this.props.isChecked && (
          <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
            <div
              css={`
                display: flex;
                align-items: center;
                font-size: 16px;
              `}
            >
              <span
                css={`
                  font-size: 18px;
                `}
              >
                Deployments
                <HelpIcon id={isAiAgent ? 'agents_deploymentslist_title' : 'deploymentslist_title'} style={{ marginLeft: '4px' }} />
              </span>

              {showFilters && (
                <span
                  css={`
                    margin-left: 20px;
                  `}
                >
                  <span
                    css={`
                      opacity: 0.7;
                    `}
                  >
                    Filters
                  </span>
                  :&nbsp;&nbsp;{isFeatureStore ? 'Feature Group' : 'Model'}:
                </span>
              )}
              {showFilters && (
                <span
                  css={`
                    margin-left: 5px;
                    display: inline-block;
                    width: 300px;
                    font-size: 14px;
                    @media screen and (max-width: 1580px) {
                      width: 220px;
                    }
                  `}
                >
                  {!isFeatureStore && <SelectExt options={optionsModelsList} onChange={this.onChangeFilterModel} value={optionsModelsList?.find((o1) => o1.value == this.state.filterModelId)} />}
                  {isFeatureStore && <SelectExt options={optionsFGList} onChange={this.onChangeFilterFG} value={optionsFGList?.find((o1) => o1.value == this.state.filterFGId)} />}
                </span>
              )}
              {showFilters && (
                <span
                  css={`
                    margin-left: 20px;
                  `}
                >
                  {'Version'}:
                </span>
              )}
              {showFilters && (
                <span
                  css={`
                    margin-left: 5px;
                    display: inline-block;
                    width: 200px;
                    font-size: 14px;
                    @media screen and (max-width: 1580px) {
                      width: 160px;
                    }
                  `}
                >
                  {!isFeatureStore && <SelectExt options={optionsModelsVersionList} onChange={this.onChangeFilterModelVersion} value={optionsModelsVersionList?.find((o1) => o1.value == this.state.filterModelVersionId)} />}
                  {isFeatureStore && <SelectExt options={optionsFGVersionList} onChange={this.onChangeFilterFGVersion} value={optionsFGVersionList?.find((o1) => o1.value == this.state.filterFGVersionId)} />}
                </span>
              )}
              {!isFeatureStore && showFilters && (
                <span
                  css={`
                    margin-left: 20px;
                  `}
                >
                  {'Algorithm:'}
                </span>
              )}
              {!isFeatureStore && showFilters && (
                <span
                  css={`
                    margin-left: 5px;
                    display: inline-block;
                    width: 240px;
                    font-size: 14px;
                    @media screen and (max-width: 1580px) {
                      width: 180px;
                    }
                  `}
                >
                  {!isFeatureStore && <SelectExt options={optionsModelsAlgosList} onChange={this.onChangeFilterModelAlgo} value={optionsModelsAlgosList?.find((o1) => o1.value == this.state.filterModelAlgoId)} />}
                </span>
              )}

              <div
                css={`
                  flex: 1;
                `}
              ></div>
              <div>
                {projectId != null && this.props.showCreate && (
                  <Link to={'/' + PartsLink.deploy_create_form + '/' + projectId}>
                    <Button type={'primary'}>Create</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {!this.props.isChecked && (
          <ModalProgress
            ref={(r1) => {
              this.modalProgress = r1;
            }}
            title={'Deployment'}
            subtitle={'Deployment in Progress. This process takes 3 mins. Please wait...'}
            okText={'Ok, Sounds Good'}
          />
        )}

        {table}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    deployments: state.deployments,
    deploymentsTokens: state.deploymentsTokens,
    projects: state.projects,
    models: state.models,
    featureGroups: state.featureGroups,
  }),
  null,
)(DeploymentsList);
