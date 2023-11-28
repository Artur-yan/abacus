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
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import eda, { EdaLifecycle, EdaLifecycleDesc } from '../../stores/reducers/eda';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const { confirm } = Modal;

const s = require('./EDAList.module.css');
const sd = require('../antdUseDark.module.css');

interface IEDAListProps {
  projects?: any;
  paramsProp?: any;
  eda?: any;
}

interface IEDAListState {
  allNotMore?: boolean;
  allLastId?: string;
  allLastIdNext?: string;
  allList?: any[];
  onlyStarred?: boolean;
}

class EDAList extends React.PureComponent<IEDAListProps, IEDAListState> {
  private isMount: boolean;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isMount = true;
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

    this.isMount = false;
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
    if (!this.isMount) {
      return;
    }

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let listEda = this.memEDAList(true)(this.props.eda, projectId);
  };

  componentDidUpdate(prevProps: Readonly<IEDAListProps>, prevState: Readonly<IEDAListState>, snapshot?: any): void {
    this.doMem();
  }

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      return null;
    } else {
      return projectId;
    }
  };

  onClickCancelEvents = (e) => {
    // e.preventDefault();
    e.stopPropagation();
  };

  onClickReTrain = (edaId, e) => {
    e && e.stopPropagation();

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (!projectId) {
      return;
    }

    REClient_.client_().rerunEda(edaId, (err1, res) => {
      if (err1) {
        REActions.addNotificationError(err1);
      } else {
        if (res && res.success) {
          let resL = res;
          if (resL && resL.result && resL.result) {
            let edaId = resL.result.edaId;
            if (edaId) {
              setTimeout(() => {
                StoreActions.listEda_(projectId);
                StoreActions.describeEda_(edaId);
                StoreActions.listEdaVersions_(edaId);
              }, 100);
            }
          }
        }
      }
    });
  };

  onClickAddNewEDA = (e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '';
    }

    Location.push('/' + PartsLink.exploratory_data_analysis_create + p1);
  };

  onClickCollinearity = (edaId, e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    Location.push('/' + PartsLink.exploratory_data_analysis_collinearity + p1 + '/' + (edaId ?? '-'));
  };

  onClickDataConsistency = (edaId, e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    Location.push('/' + PartsLink.exploratory_data_analysis_data_consistency + p1 + '/' + (edaId ?? '-'));
  };

  onClickDataConsistencyAnalysis = (edaId, e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    Location.push('/' + PartsLink.exploratory_data_analysis_data_consistency_analysis + p1 + '/' + (edaId ?? '-'));
  };

  onClickForecastingAnalysis = (edaId, e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    Location.push('/' + PartsLink.exploratory_data_analysis_timeseries + p1 + '/' + (edaId ?? '-'));
  };

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memColumns = memoizeOne((projectId) => {
    let columns: ITableExtColumn[] = [
      {
        title: 'EDA ID',
        field: 'edaId',
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
        width: 140,
      },
      {
        title: 'EDA Name',
        field: 'name',
        width: 250,
      },
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
        width: 250,
      },
      {
        title: 'Completed At',
        field: 'edaCompletedAt',
        render: (text) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
        width: 250,
      },
      {
        title: 'Status',
        field: 'status',
        render: (text, row, index) => {
          let isTraining = row.edaId && StoreActions.refreshEdaUntilStateIsTraining_(row.edaId);

          if (!isTraining && [EdaLifecycle.MONITORING, EdaLifecycle.PENDING].includes(row.lifecycleAlone || '')) {
            StoreActions.refreshDoEdaAll_(row.edaId, projectId);
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
            if ([EdaLifecycle.FAILED.toLowerCase()].includes((row.lifecycleAlone || '').toLowerCase())) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ([EdaLifecycle.FAILED.toLowerCase()].includes((row.lifecycleAlone || '').toLowerCase())) {
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
        width: 160,
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        field: 'actions',
      },
    ];

    columns = columns.filter((c1) => !c1.hidden);

    return columns;
  });

  memCalcEdaList = memoizeOne((foundProject1, listEdas) => {
    if (!listEdas) {
      return [];
    }

    let res = [];
    listEdas.some((m1) => {
      const styleButton: CSSProperties = { marginRight: '8px', marginBottom: '8px', width: '90px' };

      let allowReTrain = true;
      let edaCompletedAt = m1.latestEdaVersion?.edaCompletedAt;
      let lifecycle1 = m1.latestEdaVersion?.status;
      if ([EdaLifecycle.PENDING, EdaLifecycle.MONITORING].includes(lifecycle1)) {
        allowReTrain = false;
      }

      let retrainButton = null;
      if (allowReTrain) {
        retrainButton = (
          <ModalConfirm
            onCancel={this.onClickCancelEvents}
            onConfirm={this.onClickReTrain.bind(this, m1.edaId)}
            title={`Are you sure you want to Re-Run the EDA?`}
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
        edaId: m1.edaId,
        name: m1.name,
        createdAt: m1.createdAt,
        starred: !!m1.starred,
        version: m1.latestEdaVersion?.edaVersion,
        updatedAt: m1.updatedAt,
        lastTrained: edaCompletedAt == null ? '-' : <DateOld date={edaCompletedAt} />,
        edaCompletedAt,
        lifecycleAlone: lifecycle1,
        status: EdaLifecycleDesc[lifecycle1] || '-',
        lifecycleMsg: m1.latestEdaVersion?.lifecycleMsg,
        actions: (
          <span css={'display: flex; gap: 10px; white-space: normal;'}>
            {_.isArray(m1.edaConfigs) && m1.edaConfigs.map((config) => config.edaType)?.includes('COLLINEARITY') && (
              <Button type={'primary'} onClick={this.onClickCollinearity.bind(this, m1.edaId)}>
                Collinearity
              </Button>
            )}
            {_.isArray(m1.edaConfigs) && m1.edaConfigs.map((config) => config.edaType)?.includes('DATA_CONSISTENCY') && (
              <Button type={'primary'} onClick={this.onClickDataConsistency.bind(this, m1.edaId)}>
                Data Consistency
              </Button>
            )}
            {_.isArray(m1.edaConfigs) && m1.edaConfigs.map((config) => config.edaType)?.includes('DATA_CONSISTENCY') && (
              <Button type={'primary'} onClick={this.onClickDataConsistencyAnalysis.bind(this, m1.edaId)}>
                Data Consistency Analysis
              </Button>
            )}
            {_.isArray(m1.edaConfigs) && m1.edaConfigs.map((config) => config.edaType)?.includes('FORECASTING_ANALYSIS') && (
              <Button type={'primary'} onClick={this.onClickForecastingAnalysis.bind(this, m1.edaId)}>
                Forecasting Analysis
              </Button>
            )}
            {allowReTrain && retrainButton}
            {!Utils.isNullOrEmpty(m1.latestEdaVersion?.lifecycleMsg) && (
              <Button style={styleButton} ghost type={'default'} onClick={this.onClickShowErrors.bind(this, m1.latestEdaVersion?.lifecycleMsg)}>
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
        let ma = a.edaCompletedAt ?? a.updatedAt;
        let mb = b.edaCompletedAt ?? b.updatedAt;
        if (ma && mb) {
          res = moment(mb).diff(moment(ma));
        }
      }
      return res;
    });

    return res;
  });

  memEDAList = memoizeOneCurry((doCall, edaParam, projectId) => {
    return eda.memEdasByProjectId(doCall, projectId);
  });

  render() {
    let { paramsProp } = this.props;

    let projectId = null;
    if (paramsProp) {
      projectId = paramsProp.get('projectId');
    }

    let listEdas = this.memEDAList(false)(this.props.eda, projectId);

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    const columns = this.memColumns(projectId);

    let isRefreshing = false;
    let dataList = [];
    if (listEdas) {
      dataList = this.memCalcEdaList(foundProject1, listEdas);
    }

    let projectPart = '';
    if (paramsProp && paramsProp.get('projectId')) {
      projectPart = '/' + paramsProp.get('projectId');
    }

    let tableHH = (hh) => (
      <RefreshAndProgress isRelative={hh == null} isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
        <TableExt
          showEmptyIcon={true}
          notsaveSortState={'edas_list'}
          height={hh}
          dataSource={dataList}
          columns={columns}
          calcKey={(r1) => r1.edaId}
          calcLink={(row) => '/' + PartsLink.exploratory_data_analysis_detail + projectPart + '/' + row?.edaId}
        />
      </RefreshAndProgress>
    );

    let table = null;
    table = <AutoSizer disableWidth>{({ height }) => tableHH(height - topAfterHeaderHH)}</AutoSizer>;

    return (
      <div className={sd.absolute + ' ' + sd.table} style={_.assign({ margin: '25px' }, { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }) as CSSProperties}>
        <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          {
            <span style={{ float: 'right' }}>
              <Button type={'primary'} style={{ height: '30px', padding: '0 16px' }} onClick={this.onClickAddNewEDA}>
                Create New EDA
              </Button>
            </span>
          }
          <span>Exploratory Data Analysis</span>
        </div>

        {table}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    eda: state.eda,
  }),
  null,
)(EDAList);
