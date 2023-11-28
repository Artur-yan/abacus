import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import monitoring, { ModelMonitoringLifecycle, ModelMonitoringLifecycleDesc } from '../../stores/reducers/monitoring';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const { confirm } = Modal;

const s = require('./ModelMonitorsList.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelMonitorsListProps {
  models?: any;
  paramsProp?: any;
  datasets?: any;
  deployments?: any;
  projectDatasets?: any;
  isSmall?: boolean;
  projects?: any;
  defDatasets?: any;
  authUser?: any;
  monitoring?: any;
}

interface IModelMonitorsListState {
  checkedKeys?: any;
}

class ModelMonitorsList extends React.PureComponent<IModelMonitorsListProps, IModelMonitorsListState> {
  private modalProgress: any;
  private modelIdProgress: string;
  private modelIdProgressAlready: any;
  private isM: boolean;
  confirmReTrain: any;

  constructor(props) {
    super(props);

    this.state = {};

    this.modelIdProgressAlready = [];
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  confirmError: any = null;
  onClickShowErrors = (msg, e) => {
    e.stopPropagation();
    e.preventDefault();

    if (this.confirmError != null) {
      this.confirmError.destroy();
      this.confirmError = null;
    }

    this.confirmError = confirm({
      title: 'Error found:',
      okText: 'Ok',
      cancelButtonProps: { style: { display: 'none' } },
      maskClosable: true,
      content: (
        <div>
          <div style={{ margin: '20px', color: Utils.colorAall(0.8) }} className={sd.styleTextGray}>
            {msg}
          </div>
        </div>
      ),
      onOk: () => {
        if (this.confirmError != null) {
          this.confirmError.destroy();
          this.confirmError = null;
        }
      },
      onCancel: () => {
        if (this.confirmError != null) {
          this.confirmError.destroy();
          this.confirmError = null;
        }
      },
    });
  };

  componentWillUnmount() {
    if (this.confirmError != null) {
      this.confirmError.destroy();
      this.confirmError = null;
    }
    if (this.confirmReTrain != null) {
      this.confirmReTrain.destroy();
      this.confirmReTrain = null;
    }

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

    let projectId = this.props.paramsProp?.get('projectId');

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let listModels = this.memModelList(true)(this.props.monitoring, projectId);
  };

  componentDidUpdate(prevProps: Readonly<IModelMonitorsListProps>, prevState: Readonly<IModelMonitorsListState>, snapshot?: any): void {
    this.doMem();
  }

  memModelList = memoizeOneCurry((doCall, monitoringParam, projectId) => {
    return monitoring.memModelsByProjectId(doCall, projectId);
  });

  onClickCancelEvents = (e) => {
    // e.preventDefault();
    e.stopPropagation();
  };

  memCalcModelList = memoizeOne((foundProject1, listModels) => {
    if (!listModels) {
      return [];
    }

    let res = [];
    listModels.some((m1) => {
      const styleButton: CSSProperties = { marginRight: '8px', marginBottom: '8px', width: '90px' };

      let allowReTrain = true,
        allowCancel = false;
      let monitoringCompletedAt = m1.latestMonitorModelVersion?.monitoringCompletedAt;
      let lifecycle1 = m1.latestMonitorModelVersion?.status;
      if ([ModelMonitoringLifecycle.PENDING, ModelMonitoringLifecycle.MONITORING].includes(lifecycle1)) {
        allowReTrain = false;
      }

      let retrainButton = null;
      if (allowReTrain) {
        retrainButton = (
          <ModalConfirm
            onCancel={this.onClickCancelEvents}
            onConfirm={this.onClickReTrain.bind(this, m1.modelMonitorId)}
            title={`Are you sure you want to Re-Run the model?`}
            icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
            okText={'Re-Run'}
            cancelText={'Cancel'}
            okType={'primary'}
          >
            <Button style={styleButton} ghost type={'default'} onClick={this.onClickCancelEvents}>
              Re-Run
            </Button>
          </ModalConfirm>
        );
      }

      res.push({
        modelMonitorId: m1.modelMonitorId,
        name: m1.name,
        starred: !!m1.starred,
        version: m1.latestMonitorModelVersion?.modelVersion,
        updatedAt: m1.updatedAt,
        lastTrained: monitoringCompletedAt == null ? '-' : <DateOld date={monitoringCompletedAt} />,
        monitoringCompletedAt,
        lifecycleAlone: lifecycle1,
        status: ModelMonitoringLifecycleDesc[lifecycle1] || '-',
        lifecycleMsg: m1.latestMonitorModelVersion?.lifecycleMsg,
        actions: (
          <span style={{ whiteSpace: 'normal' }}>
            {allowReTrain && retrainButton}
            {!Utils.isNullOrEmpty(m1.latestMonitorModelVersion?.lifecycleMsg) && (
              <Button style={styleButton} ghost type={'default'} onClick={this.onClickShowErrors.bind(this, m1.latestMonitorModelVersion?.lifecycleMsg)}>
                Errors
              </Button>
            )}
          </span>
        ),
      });
    });

    res = res.sort((a, b) => {
      let res = 0;
      if (a.starred && !b.starred) {
        res = -1;
      } else if (!a.starred && b.starred) {
        res = 1;
      }
      if (res === 0) {
        let ma = a.monitoringCompletedAt ?? a.updatedAt;
        let mb = b.monitoringCompletedAt ?? b.updatedAt;
        if (ma && mb) {
          res = moment(mb).diff(moment(ma));
        }
      }
      return res;
    });

    return res;
  });

  onChangeChecked = (keys) => {
    this.setState({
      checkedKeys: keys,
    });
  };

  onClickReTrain = (modelId, e) => {
    e && e.stopPropagation();

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (!projectId) {
      return;
    }

    REClient_.client_().rerunModelMonitor(modelId, (err1, res) => {
      if (err1) {
        REActions.addNotificationError(err1);
      } else {
        if (res && res.success) {
          let resL = res;
          if (resL && resL.result && resL.result) {
            let modelMonitorId = resL.result.modelMonitorId;
            if (modelMonitorId) {
              setTimeout(() => {
                StoreActions.listMonitoringModels_(projectId);
                StoreActions.describeModelMonitorById_(modelMonitorId);
              }, 100);
            }
          }
        }
      }
    });
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onClickStarred = (projectId, modelMonitorId, starred, e) => {
    REClient_.client_()._starModelMonitor(modelMonitorId, starred, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.listMonitoringModels_(projectId);
      }
    });
  };

  memColumns = memoizeOne((projectId) => {
    const columns: ITableExtColumn[] = [
      // {
      //   title: '',
      //   width: 40,
      //   field: 'starred',
      //   noAutoTooltip: true,
      //   helpId: 'ModelMonitorsListAll_starred',
      //   render: (starred, row, index) => {
      //     return <StarredSpan isSummary noNamePrefix={['Don\'t use', 'Use']} name={'Monitor in Summary'} isStarred={!!starred} onClick={this.onClickStarred.bind(null, projectId, row.modelMonitorId)} />;
      //   },
      //   hidden: Constants.flags.hide_monitors_changes,
      // },
      {
        title: 'ID',
        field: 'modelMonitorId',
        helpId: 'ModelMonitorsList_id',
        render: (text, row, index) => {
          return (
            <span className={sd.styleTextBlue}>
              <CopyText>{row.modelMonitorId}</CopyText>
            </span>
          );
        },
      },
      {
        title: 'Monitor Name',
        field: 'name',
        helpId: 'ModelMonitorsList_name',
        render: (text) => <span className={sd.linkBlue}>{text}</span>,
      },
      {
        title: 'Completed At',
        field: 'monitoringCompletedAt',
        helpId: 'ModelMonitorsList_lastTrained',
        render: (text, row, index) => {
          return row.lastTrained;
        },
      },
      {
        title: 'Status',
        field: 'status',
        helpId: 'ModelMonitorsList_status',
        render: (text, row, index) => {
          let isTraining = row.modelMonitorId && StoreActions.refreshMonitorUntilStateIsTraining_(row.modelMonitorId);

          if (!isTraining && [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(row.lifecycleAlone || '')) {
            StoreActions.refreshDoMonitorAll_(row.modelMonitorId, projectId);
            isTraining = true;
          }

          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{'Processing'}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{text}</span>;
            if ([ModelMonitoringLifecycle.FAILED.toLowerCase()].includes((row.lifecycleAlone || '').toLowerCase())) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ([ModelMonitoringLifecycle.FAILED.toLowerCase()].includes((row.lifecycleAlone || '').toLowerCase())) {
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
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        field: 'actions',
        helpId: 'ModelMonitorsList_actions',
      },
    ];
    return columns;
  });

  onClickTrainModel = (e) => {
    Location.push('/' + PartsLink.model_create_drift + '/' + this.props.paramsProp?.get('projectId'));
  };

  render() {
    let { paramsProp } = this.props;

    let projectId = null;
    if (paramsProp) {
      projectId = paramsProp.get('projectId');
    }

    let listModels = this.memModelList(false)(this.props.monitoring, projectId);

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    const columns = this.memColumns(projectId);

    let isRefreshing = false;
    let dataList = [];
    if (listModels) {
      dataList = this.memCalcModelList(foundProject1, listModels);
    }

    let projectPart = '';
    if (paramsProp && paramsProp.get('projectId')) {
      projectPart = '/' + paramsProp.get('projectId');
    }

    let tableHH = (hh) => (
      <RefreshAndProgress isRelative={hh == null} isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
        <TableExt
          showEmptyIcon={true}
          notsaveSortState={'models_list'}
          height={hh}
          dataSource={dataList}
          columns={columns}
          calcKey={(r1) => r1.modelMonitorId}
          calcLink={(row) => '/' + PartsLink.model_detail_monitor + '/' + row?.modelMonitorId + projectPart}
        />
      </RefreshAndProgress>
    );

    let table = null;
    if (this.props.isSmall) {
      table = tableHH(null);
    } else {
      table = <AutoSizer disableWidth>{({ height }) => tableHH(height - topAfterHeaderHH)}</AutoSizer>;
    }

    const css2 = _.assign({ margin: '25px' }, this.props.isSmall ? {} : { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }) as CSSProperties;

    let tableHeaderName = 'Monitors';

    return (
      <div className={(this.props.isSmall ? '' : sd.absolute) + ' ' + sd.table} style={css2}>
        <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          {!this.props.isSmall && (
            <span style={{ float: 'right' }}>
              <Button type={'primary'} style={{ marginRight: '10px', height: '30px', padding: '0 16px' }} onClick={this.onClickTrainModel}>
                {'Create Monitor'}
              </Button>
            </span>
          )}
          {tableHeaderName}
          <HelpIcon id={'modelmonitors_list_title'} style={{ marginLeft: '4px' }} />
        </div>

        {table}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    models: state.models,
    datasets: state.datasets,
    projectDatasets: state.projectDatasets,
    projects: state.projects,
    defDatasets: state.defDatasets,
    deployments: state.deployments,
    authUser: state.authUser,
    monitoring: state.monitoring,
  }),
  null,
)(ModelMonitorsList);
