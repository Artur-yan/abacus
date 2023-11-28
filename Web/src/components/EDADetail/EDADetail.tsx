import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Provider } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import eda, { EdaLifecycle, EdaLifecycleDesc } from '../../stores/reducers/eda';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import ViewLogs from '../ViewLogs/ViewLogs';
const { confirm } = Modal;

const s = require('./EDADetail.module.css');
const sd = require('../antdUseDark.module.css');

interface IEDADetailProps {
  paramsProp?: any;
  eda?: any;
  projects?: any;
  featureGroups?: any;
  projectId?: string;
  edaId?: string;
}

interface IEDADetailState {}

class EDADetail extends React.PureComponent<IEDADetailProps, IEDADetailState> {
  private isM: boolean;
  confirmUsed: any;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;

    if (this.confirmUsed != null) {
      this.confirmUsed.destroy();
      this.confirmUsed = null;
    }
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

  calcEdaId = () => {
    if (!Utils.isNullOrEmpty(this.props.edaId)) {
      return this.props.edaId;
    } else {
      return this.props.paramsProp?.get('edaId');
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    let listEda = this.memEdaList(true)(this.props.eda, projectId);
    let edaId = this.calcEdaId();

    let edaDetailFound = this.memEdaDetail(true)(this.props.eda, edaId);
    this.memFeatureGroup(true)(this.props.featureGroups, edaDetailFound?.featureGroupId);

    let edaVersions = this.memEdaVersions(true)(this.props.eda, edaId);
  };

  memFeatureGroup = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupsForId(doCall, null, featureGroupId);
  });

  memEdaOptions = memoizeOne((listEdas) => {
    return listEdas?.map((f1) => ({ label: f1.name, value: f1.edaId })) ?? [];
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  componentDidUpdate(prevProps: Readonly<IEDADetailProps>, prevState: Readonly<IEDADetailState>, snapshot?: any): void {
    this.doMem();
  }

  onClickDelete = (e) => {
    let { paramsProp } = this.props;
    const edaId = paramsProp?.get('edaId');
    const projectId = paramsProp?.get('projectId');

    if (Utils.isNullOrEmpty(edaId)) {
      return;
    }

    REActions.addNotification('Deleting EDA...');

    REClient_.client_().deleteEda(edaId, (err, res) => {
      if (err) {
        REActions.addNotificationError(err);
      } else {
        REActions.addNotification('EDA Deleted!');
        StoreActions.listEda_(this.props.paramsProp?.get('projectId'));
        StoreActions.describeEda_(edaId);
        StoreActions.listEdaVersions_(edaId);

        Location.push('/' + PartsLink.exploratory_data_analysis + '/' + (projectId ?? '-'));
      }
    });
  };

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (!Utils.isNullOrEmpty(this.props.projectId)) {
      projectId = this.props.projectId;
    }

    if (Utils.isNullOrEmpty(projectId) || projectId === '-') {
      projectId = null;
    }
    return projectId;
  };

  onClickDeleteVersion = (edaVersion, e) => {
    if (edaVersion) {
      REClient_.client_().deleteEdaVersion(edaVersion, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          let projectId = this.props.paramsProp?.get('projectId');
          let edaId = this.props.paramsProp?.get('edaId');

          StoreActions.listEda_(projectId);
          StoreActions.describeEda_(edaId);
          StoreActions.listEdaVersions_(edaId);
        }
      });
    }
  };

  memEdaList = memoizeOneCurry((doCall, edaParam, projectId) => {
    return eda.memEdasByProjectId(doCall, projectId);
  });

  memEdaDetail = memoizeOneCurry((doCall, edaParam, edaId) => {
    return eda.memEdaById(doCall, edaId);
  });

  memEdaVersions = memoizeOneCurry((doCall, edaParam, edaId) => {
    return eda.memEdaVersionsById(doCall, edaId);
  });

  memEdaVersionsColumns = memoizeOne((isCollinearity, isDataConsistency, isForecastingAnalysis, edaVersions, projectId, project) => {
    let res = [
      {
        title: 'EDA Version',
        field: 'edaVersion',
        isLinked: true,
        render: (text, row, index) => {
          let edaId = this.calcEdaId();
          const linkUrl =
            '/' +
            (isCollinearity ? PartsLink.exploratory_data_analysis_collinearity : isDataConsistency ? PartsLink.exploratory_data_analysis_data_consistency : PartsLink.exploratory_data_analysis_timeseries) +
            '/' +
            (projectId ?? '-') +
            '/' +
            (edaId ?? '-') +
            '?edaVersion=' +
            text;
          return (
            <span>
              <Link forceSpanUse to={linkUrl}>
                <CopyText>{text}</CopyText>
              </Link>
            </span>
          );
        },
      },
      {
        title: !isDataConsistency ? 'Feature Group Version' : 'Test Version',
        field: 'testFeatureGroupVersion',
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
      },
      {
        title: 'Reference Version',
        field: 'referenceFeatureGroupVersion',
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
        hidden: !isDataConsistency,
      },
      {
        title: 'Processing Started',
        field: 'edaStartedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
        },
      },
      {
        title: 'Processing Completed',
        field: 'edaCompletedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} format={'lll'} />;
        },
      },
      {
        title: 'Processing Status',
        field: 'status',
        render: (text, row, index) => {
          let isTraining = false;
          if ([EdaLifecycle.MONITORING, EdaLifecycle.PENDING].includes(row.status || '')) {
            isTraining = true;
            StoreActions.refreshDoEdaVersionsAll_(row.edaVersion, this.props.paramsProp?.get('edaId'), projectId);
          }

          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>Processing...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{EdaLifecycleDesc[text ?? '-']}</span>;
            if ([EdaLifecycle.FAILED].includes(row.status || '')) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let res = null;
          if ([EdaLifecycle.FAILED].includes(row.status || '')) {
            if (row.lifecycleMsg) {
              let m1 = row.lifecycleMsg;
              if (m1?.indexOf('\n') > -1) {
                let mm = m1.split('\n');
                m1 = mm.map((m1, ind) => <div key={'m' + ind}>{m1}</div>);
              }

              res = (
                <span
                  css={`
                    display: flex;
                    align-items: center;
                  `}
                >
                  <span
                    css={`
                      margin-right: 5px;
                      white-space: nowrap;
                    `}
                  >
                    Error:
                  </span>
                  <span
                    css={`
                      color: #bf2c2c;
                      display: inline-block;
                    `}
                  >
                    {m1}
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
        field: 'edaVersion',
        render: (text, row, index) => {
          let allowDelete = true;
          if (edaVersions?.length < 2) {
            allowDelete = false;
          }

          return (
            <span>
              {Constants.isShowViewLogs(project?.useCase) && [EdaLifecycle.COMPLETE, EdaLifecycle.FAILED].includes(row.status || '') && (
                <ModalConfirm
                  width={900}
                  title={
                    <Provider store={Utils.globalStore()}>
                      <div className={'useDark'}>
                        <ViewLogs modelVersion={row.edaVersion} />
                      </div>
                    </Provider>
                  }
                  okText={'Close'}
                  cancelText={null}
                  okType={'primary'}
                >
                  <Button
                    css={`
                      margin: 4px;
                    `}
                    ghost
                  >
                    Logs
                  </Button>
                </ModalConfirm>
              )}
              {allowDelete && (
                <ModalConfirm
                  onConfirm={this.onClickDeleteVersion.bind(this, row.edaVersion)}
                  title={`Do you want to delete this EDA version?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Delete'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  <Button
                    css={`
                      margin: 4px;
                    `}
                    danger
                    ghost
                  >
                    Delete
                  </Button>
                </ModalConfirm>
              )}
            </span>
          );
        },
      },
    ] as ITableExtColumn[];

    res = res.filter((r1) => !r1?.hidden);

    return res;
  });

  onClickCollinearity = (e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    let edaId = this.calcEdaId();

    Location.push('/' + PartsLink.exploratory_data_analysis_collinearity + p1 + '/' + (edaId ?? '-'));
  };

  onClickDataConsistency = (e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    let edaId = this.calcEdaId();

    Location.push('/' + PartsLink.exploratory_data_analysis_data_consistency + p1 + '/' + (edaId ?? '-'));
  };

  onClickDataConsistencyAnalysis = (e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    let edaId = this.calcEdaId();

    Location.push('/' + PartsLink.exploratory_data_analysis_data_consistency_analysis + p1 + '/' + (edaId ?? '-'));
  };

  onClickForecastingAnalysis = (e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    let edaId = this.calcEdaId();

    Location.push('/' + PartsLink.exploratory_data_analysis_timeseries + p1 + '/' + (edaId ?? '-'));
  };

  onClickReTrain = (e) => {
    e && e.stopPropagation();

    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    let edaId = paramsProp && paramsProp.get('edaId');
    if (!projectId || !edaId) {
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

  onFeatureGroup = (featuregroupId, e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '/-';
    }

    Location.push('/' + PartsLink.feature_group_detail + p1 + '/' + featuregroupId);
  };

  onChangeDropdownEDASel = (option1) => {
    if (option1?.value) {
      let p1 = this.calcProjectId();
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '/-';
      }
      Location.push('/' + PartsLink.exploratory_data_analysis_detail + p1 + '/' + option1?.value);
    }
  };

  render() {
    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    let edaId = this.calcEdaId();

    let optionsEDASel = null;
    let optionsEDA = [];
    let listEdas = this.memEdaList(false)(this.props.eda, projectId);
    optionsEDA = this.memEdaOptions(listEdas);
    if (optionsEDA && edaId) {
      optionsEDASel = optionsEDA.find((p1) => p1.value === edaId);
    }

    let dataList = [];

    let edaOne = this.memEdaDetail(false)(this.props.eda, edaId);
    const featureOne = this.memFeatureGroup(false)(this.props.featureGroups, edaOne?.featureGroupId);

    let nameDetail = edaOne?.name;
    let isDataConsistency = !!edaOne?.edaConfigs?.find((config) => config?.edaType === 'DATA_CONSISTENCY');
    let isCollinearity = !!edaOne?.edaConfigs?.find((config) => config?.edaType === 'COLLINEARITY');
    let isForecastingAnalysis = !!edaOne?.edaConfigs?.find((config) => config?.edaType === 'FORECASTING_ANALYSIS');
    if (edaOne) {
      dataList = [
        {
          id: 111,
          name: 'EDA:',
          value: <CopyText>{edaOne.edaId}</CopyText>,
        },
        {
          id: 222,
          name: 'Last Run: ',
          value: edaOne.latestEdaVersion?.edaCompletedAt ? <DateOld always date={edaOne.latestEdaVersion?.edaCompletedAt} /> : '-',
        },
        {
          id: 333,
          name: (
            <span>
              Feature Group:
              <HelpIcon id={'eda_feature_group'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <CopyText>
              <span className={sd.styleTextBlueBrightColor} css={'cursor: pointer;'} onClick={this.onFeatureGroup.bind(this, edaOne?.featureGroupId)}>
                {featureOne?.name}
              </span>
            </CopyText>
          ),
        },
        {
          id: 444,
          name: 'EDA Types:',
          value: <span>{_.isArray(edaOne.edaConfigs) ? edaOne.edaConfigs.map((config) => config?.edaType)?.join(', ') : ''}</span>,
        },
        {
          id: 555,
          name: (
            <span>
              Test Strategy:
              <HelpIcon id={'eda_test_strategy'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <span>
              {_.isArray(edaOne.edaConfigs)
                ? edaOne.edaConfigs
                    .map((config) => {
                      const strategy = config.dataConsistencyTestConfig?.selectionStrategy;
                      if (strategy) {
                        return strategy === 'LATEST_VERSION' ? 'Latest version' : strategy === 'N_VERSION' ? 'Version before the latest' : strategy;
                      }
                      return '';
                    })
                    ?.join(', ')
                : ''}
            </span>
          ),
          hidden: !isDataConsistency,
        },
        {
          id: 666,
          name: (
            <span>
              Reference Strategy:
              <HelpIcon id={'eda_reference_strategy'} style={{ marginLeft: '4px' }} />
            </span>
          ),
          value: (
            <span>
              {_.isArray(edaOne.edaConfigs)
                ? edaOne.edaConfigs
                    .map((config) => {
                      const strategy = config.dataConsistencyReferenceConfig?.selectionStrategy;
                      if (strategy) {
                        return strategy === 'LATEST_VERSION' ? 'Latest version' : strategy === 'N_VERSION' ? 'Version before the latest' : strategy;
                      }
                      return '';
                    })
                    ?.join(', ')
                : ''}
            </span>
          ),
          hidden: !isDataConsistency,
        },
        {
          id: 777,
          name: <span>Primary Keys:</span>,
          value: (
            <span>
              {_.isArray(edaOne.edaConfigs)
                ? edaOne.edaConfigs
                    .map((config) => {
                      return config.primaryKeys ? config.primaryKeys.join(', ') : '';
                    })
                    ?.join(', ')
                : ''}
            </span>
          ),
          hidden: isCollinearity,
        },
        {
          id: 888,
          name: <span>Collinearity Keys:</span>,
          value: (
            <span>
              {_.isArray(edaOne.edaConfigs)
                ? edaOne.edaConfigs
                    .map((config) => {
                      return config.collinearityKeys ? config.collinearityKeys.join(', ') : '';
                    })
                    ?.join(', ')
                : ''}
            </span>
          ),
          hidden: !isCollinearity,
          marginBottom: 12,
        },
        {
          id: 999,
          name: <span>Forecast Frequency:</span>,
          value: (
            <span>
              {_.isArray(edaOne.edaConfigs)
                ? edaOne.edaConfigs
                    .map((config) => {
                      return config.forecastFrequency ? config.forecastFrequency : '';
                    })
                    ?.join(', ')
                : ''}
            </span>
          ),
          hidden: !isForecastingAnalysis,
          marginBottom: 12,
        },
      ];

      let msgError = edaOne?.latestEdaVersion?.lifecycleMsg;
      if (!Utils.isNullOrEmpty(msgError)) {
        dataList.push({
          id: 100,
          name: 'Error Message:',
          value: msgError ?? '-',
          valueColor: Utils.colorAall(0.8),
          marginVert: 14,
        });
      }

      dataList = dataList.filter((v1) => !v1.hidden);
    }

    let createdAt = edaOne?.createdAt;
    if (createdAt != null) {
      createdAt = moment(createdAt);
      if (!createdAt.isValid()) {
        createdAt = null;
      }
    } else {
      createdAt = null;
    }

    let edaVersions = this.memEdaVersions(false)(this.props.eda, edaId);
    let edaVersionsColumns = this.memEdaVersionsColumns(isCollinearity, isDataConsistency, isForecastingAnalysis, edaVersions, projectId, foundProject1);

    let isRefreshingEda = !edaOne;

    let allowReTrain = true;
    if (!edaOne || [EdaLifecycle.MONITORING, EdaLifecycle.PENDING].includes(edaOne?.latestEdaVersion?.status)) {
      allowReTrain = false;
    }

    const retrainButton = (
      <ModalConfirm onConfirm={this.onClickReTrain} title={`Are you sure you want to Re-Run the EDA?`} icon={<QuestionCircleOutlined style={{ color: 'yellow' }} />} okText={'Re-Run'} cancelText={'Cancel'} okType={'primary'}>
        <Button className={sd.detailbuttonblue} style={{ marginLeft: '10px' }} type={'primary'}>
          Re-Run
        </Button>
      </ModalConfirm>
    );

    return (
      <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px' }}>
        <NanoScroller onlyVertical>
          <div
            className={sd.titleTopHeaderAfter}
            style={{ height: topAfterHeaderHH, marginRight: '20px' }}
            css={`
              display: flex;
              align-items: center;
            `}
          >
            <span css={``}>{'EDA Detail'}</span>
            <span style={{ marginLeft: '16px', width: '400px', display: 'inline-block', fontSize: '12px' }}>
              <SelectExt value={optionsEDASel} options={optionsEDA} onChange={this.onChangeDropdownEDASel} />
            </span>
            <span
              css={`
                flex: 1;
              `}
            ></span>

            <div
              css={`
                margin-right: 10px;
              `}
            >
              {
                <ModalConfirm onConfirm={this.onClickDelete.bind(this)} title={`Do you want to delete this EDA?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>
                  <Button style={{ marginLeft: '8px', borderColor: 'transparent' }} danger ghost>
                    <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faTrashAlt').faTrashAlt} transform={{ size: 20, x: 0, y: -3 }} style={{ color: '#ff4d4f', marginRight: '8px' }} />
                    Delete
                  </Button>
                </ModalConfirm>
              }
            </div>
          </div>

          <div className={sd.backdetail}>
            <div
              css={`
                border-radius: 8px;
                overflow: hidden;
              `}
            >
              <RefreshAndProgress msgTop={'10px'} isMsgAnimRefresh={isRefreshingEda ? true : undefined} msgMsg={isRefreshingEda ? 'Loading...' : undefined} isDim={isRefreshingEda ? true : undefined} isRelative>
                <div
                  style={{ display: 'flex' }}
                  css={`
                    min-height: 290px;
                  `}
                >
                  <div style={{ marginRight: '24px' }}>
                    <img src={calcImgSrc('/imgs/modelIcon.png')} alt={''} style={{ width: '80px' }} />
                  </div>
                  <div style={{ flex: 1, fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <DetailHeader css="color: #38bfa1;">{nameDetail ?? '-'}</DetailHeader>
                    </div>
                    {dataList.map((d1, d1ind) => (
                      <div key={'val_' + d1.id + d1ind} style={{ padding: '2px 0', marginBottom: (d1.marginBottom ?? 0) + 'px' }}>
                        <span className={sd.textIndent20}>
                          <span
                            css={`
                              white-space: nowrap;
                            `}
                          >
                            <DetailName>{d1.name}</DetailName>
                          </span>
                          <DetailValue>{d1.value}</DetailValue>
                        </span>
                      </div>
                    ))}
                  </div>
                  {
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '10px' }}>
                      {createdAt != null && (
                        <div css="margin-bottom: 10px;">
                          <DetailCreatedAt>Created: {createdAt?.format('LLL')}</DetailCreatedAt>
                        </div>
                      )}
                      {_.isArray(edaOne?.edaConfigs) && edaOne?.edaConfigs.map((config) => config.edaType)?.includes('COLLINEARITY') && (
                        <Button className={sd.detailbuttonblue} onClick={this.onClickCollinearity.bind(this)} type={'primary'}>
                          Collinearity
                        </Button>
                      )}
                      {_.isArray(edaOne?.edaConfigs) && edaOne?.edaConfigs.map((config) => config.edaType)?.includes('DATA_CONSISTENCY') && (
                        <Button className={sd.detailbuttonblue} onClick={this.onClickDataConsistency.bind(this)} type={'primary'}>
                          Data Consistency
                        </Button>
                      )}
                      {_.isArray(edaOne?.edaConfigs) && edaOne?.edaConfigs.map((config) => config.edaType)?.includes('DATA_CONSISTENCY') && (
                        <Button className={sd.detailbuttonblue} style={{ marginLeft: '10px' }} onClick={this.onClickDataConsistencyAnalysis.bind(this)} type={'primary'}>
                          Data Consistency Analysis
                        </Button>
                      )}
                      {_.isArray(edaOne?.edaConfigs) && edaOne?.edaConfigs.map((config) => config.edaType)?.includes('FORECASTING_ANALYSIS') && (
                        <Button className={sd.detailbuttonblue} style={{ marginLeft: '10px' }} onClick={this.onClickForecastingAnalysis.bind(this)} type={'primary'}>
                          Forecasting Analysis
                        </Button>
                      )}
                      {allowReTrain && retrainButton}
                    </div>
                  }
                </div>
              </RefreshAndProgress>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <div
              className={sd.titleTopHeaderAfter}
              css={`
                margin-bottom: 20px;
                margin-top: 20px;
                display: flex;
                align-items: center;
              `}
            >
              <span>
                EDA Versions
                <HelpIcon id={'featuregroupsversions_list_title'} style={{ marginLeft: '4px' }} />
              </span>
            </div>
            <TableExt isDetailTheme showEmptyIcon defaultSort={{ field: 'monitoringCompletedAt', isAsc: false }} notsaveSortState={'eda_versions_list'} dataSource={edaVersions} columns={edaVersionsColumns} calcKey={(r1) => r1.edaVersion} />
          </div>

          <div style={{ height: '60px' }}>&nbsp;</div>
        </NanoScroller>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    eda: state.eda,
    featureGroups: state.featureGroups,
    projects: state.projects,
  }),
  null,
)(EDADetail);
