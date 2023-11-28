import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Menu from 'antd/lib/menu';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_, { DatasetTypeEnum } from '../../api/REClient';
import REUploads_ from '../../api/REUploads';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import datasetsReq, { calcDataset_datasetType, DatasetLifecycle, DatasetLifecycleDesc } from '../../stores/reducers/datasets';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import Constants from '../../constants/Constants';

const s = require('./DatasetsList.module.css');
const sd = require('../antdUseDark.module.css');

interface IDatasetsListProps {
  datasets?: any;
  projects?: any;
  defDatasets?: any;
  paramsProp?: any;
  useCases?: any;
  isSmall?: boolean;
  projectDatasets?: any;
  isAll?: boolean;
}

interface IDatasetsListState {
  allNotMore?: boolean;
  allLastId?: string;
  allLastIdNext?: string;
  allList?: any[];
  onlyStarred?: boolean;
}

export const orderDatasetsListTo = 'orderDatasetsListTo';

class DatasetsList extends React.PureComponent<IDatasetsListProps, IDatasetsListState> {
  private isM: boolean;

  constructor(props) {
    super(props);

    this.state = {
      onlyStarred: this.props.paramsProp?.get('starred') === '1' ? true : null,
    };
  }

  componentDidMount() {
    this.isM = true;
    this.doMem(false);

    if (this.props.isAll) {
      StoreActions.listAllDatasets();
      StoreActions.listAllDatasets(true);
    }
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

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let listDatasetsProj = this.memProjectDatasets(true)(this.props.projectDatasets, projectId);
    let listDatasets = this.memDatasetsList(true)(this.props.datasets, listDatasetsProj);

    if (this.props.isAll) {
      if (!this.state.allNotMore) {
        this.memDatasetsListAll(this.state.allLastId == null ? null : this.state.allLastId, this.state.onlyStarred);
      }
    }

    let useCase = '';
    if (foundProject1) {
      useCase = foundProject1.useCase;
    }
    let schemaInfo = this.memUseCaseSchemas(true)(this.props.useCases, useCase);
  };

  componentDidUpdate(prevProps: Readonly<IDatasetsListProps>, prevState: Readonly<IDatasetsListState>, snapshot?: any): void {
    this.doMem();
  }

  calcDatasetTypeName = (name) => {
    if (Utils.isNullOrEmpty(name)) {
      return name;
    }

    let res = null;
    let kk = Object.keys(DatasetTypeEnum);
    kk &&
      kk.some((k1) => {
        if (k1 === name) {
          res = DatasetTypeEnum[k1];
          return true;
        }
      });
    return res;
  };

  onClickDeleteDataset = (datasetId, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    let projectId = this.calcProjectId();
    if (datasetId && projectId) {
      REActions.addNotification('Deleting dataset...');

      REClient_.client_().removeDatasetFromProject(projectId, datasetId, (err, res) => {
        if (err) {
          REActions.addNotificationError('Error: ' + err);
        } else {
          REActions.addNotification('Removed!');

          REUploads_.client_().removeFileByDatasetId(datasetId);

          StoreActions.refreshDatasetUntilStateCancel_(datasetId);

          StoreActions.validateProjectDatasetsReset_();
          StoreActions.getProjectsList_();
          StoreActions.listDatasets_([datasetId]);
          StoreActions.getProjectsById_(projectId);
          StoreActions.validateProjectDatasets_(projectId);
          StoreActions.getProjectDatasets_(projectId);
          StoreActions.listModels_(projectId);
        }
      });
    }
  };

  onClickRefreshDataset = (datasetId, param1) => {
    if (param1 && param1.domEvent) {
      param1.domEvent.stopPropagation();
    }

    StoreActions.listDatasets_([datasetId]);
    StoreActions.validateProjectDatasets_(this.calcProjectId());
    StoreActions.getProjectDatasets_(this.calcProjectId());
  };

  onClickViewDataset = (datasetId, linkPartUrl, projectId, param1) => {
    if (param1 && param1.domEvent) {
      param1.domEvent.stopPropagation();
    }
    if (datasetId) {
      Location.push('/' + (linkPartUrl || PartsLink.dataset_raw_data) + '/' + datasetId + (projectId ? '/' + projectId : ''));
    }
  };

  onClickCancelUpload = (datasetId, datasetVersion, e) => {
    e.preventDefault();
    e.stopPropagation();

    StoreActions.refreshDatasetUntilStateCancel_(datasetId);

    REClient_.client_()._cancelDatasetUpload(datasetVersion, (err, res) => {
      REUploads_.client_().removeFileByDatasetId(datasetId);

      StoreActions.listDatasets_([datasetId]);
      StoreActions.listDatasetsVersions_(datasetId);
      StoreActions.getProjectDatasets_(this.calcProjectId());

      setTimeout(() => {
        StoreActions.refreshDatasetUntilStateCancel_(datasetId);
      }, 100);
    });
  };

  onClickCancelEvents = (e) => {
    // e.preventDefault();
    e.stopPropagation();
  };

  memCalcDatasetList = memoizeOne((listDatasets, projectId) => {
    let res = [];

    if (Utils.isNullOrEmpty(projectId)) {
      listDatasets = [];
    }

    Object.values(listDatasets).some((d1: Immutable.Map<string, any>) => {
      const styleButton: CSSProperties = { marginLeft: '8px', marginBottom: '8px' };

      let popupContainerForMenu = (node) => document.getElementById('body2');

      let locationStringFull = d1.get('location');
      let locationSpan = (
        <TooltipExt title={locationStringFull}>
          <span style={{ whiteSpace: 'nowrap' }}>{Utils.truncStr(locationStringFull, 50)}</span>
        </TooltipExt>
      );

      let datasetId = d1.getIn(['dataset', 'datasetId']);
      const menu = (
        <Menu getPopupContainer={popupContainerForMenu}>
          <Menu.Item onClick={this.onClickViewDataset.bind(this, datasetId, PartsLink.dataset_detail, projectId)}>View Detail</Menu.Item>
          {(d1.getIn(['sourceType']) as string)?.toLowerCase() == 'streaming' && !Constants.disableAiFunctionalities && (
            <Menu.Item onClick={this.onClickViewDataset.bind(this, datasetId, PartsLink.dataset_streaming, projectId)}>Streaming Console</Menu.Item>
          )}
        </Menu>
      );

      let rowsCount = null;
      let schemaValues = d1.get('schemaValues');
      if (_.isString(schemaValues)) {
        schemaValues = Utils.tryJsonParse(schemaValues);
      } else if (Immutable.isImmutable(schemaValues)) {
        schemaValues = schemaValues.toJS();
      }
      if (schemaValues != null) {
        rowsCount = schemaValues.rowCount;
      }
      if (rowsCount == null) {
        rowsCount = d1.get('rowCount');
      }
      if (rowsCount != null) {
        rowsCount = '' + Utils.prettyPrintNumber(rowsCount);
      }

      let sizeString = '',
        sizeForSort = '';
      let needSep = false;
      if (rowsCount != null) {
        needSep = true;
        sizeString += '' + rowsCount;
        sizeForSort += _.padStart(rowsCount, 30, '0');
      }
      let sizeInBytesString = d1.get('size');
      if (sizeInBytesString != null && sizeInBytesString !== '') {
        if (needSep) {
          sizeString += ' / ';
          sizeForSort += ' ';
        }

        let sizeS1 = Utils.prettyPrintNumber(sizeInBytesString, undefined, false);

        sizeString += sizeInBytesString == '0' ? 'Empty' : sizeS1;
        sizeForSort += _.padStart(sizeInBytesString, 100, '0');
      } else {
        sizeString += (needSep ? ' / ' : '') + '-';
      }

      let actions1 = null;
      if (d1.getIn(['status']) === DatasetLifecycle.UPLOADING && (d1.getIn(['sourceType']) as string)?.toLowerCase() === 'upload') {
        actions1 = (
          <ModalConfirm
            onConfirm={this.onClickCancelUpload.bind(this, datasetId, d1.get('datasetVersion'))}
            title={`Do you want to stop this upload?`}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            okText={'Stop Upload'}
            cancelText={'Cancel'}
            okType={'danger'}
          >
            <Button style={{ borderColor: 'transparent' }} ghost danger>
              Cancel Upload
            </Button>
          </ModalConfirm>
        );
      } else {
        actions1 = (
          <DropdownExt overlay={menu} trigger={['click']}>
            <Button style={styleButton} ghost type={'default'} onClick={this.onClickCancelEvents}>
              Actions
            </Button>
          </DropdownExt>
        );
      }

      res.push({
        lastVersion: d1.get('datasetVersion'),
        datasetId: datasetId,
        featureGroupTableName: d1.get('featureGroupTableName'),
        name: d1.getIn(['dataset', 'name']),
        updatedAt: d1.get('updatedAt'),
        size: sizeString,
        sizeForSort: sizeForSort,
        location: locationSpan,
        streaming: (d1.getIn(['sourceType']) as string)?.toLowerCase() == 'streaming',
        datasetType: calcDataset_datasetType(d1, projectId),
        lifecycleReal: d1.getIn(['status']),
        status: DatasetLifecycleDesc[d1.getIn(['status']) as string] ?? DatasetLifecycleDesc[DatasetLifecycle.PENDING],
        lifecycleMsg: d1.getIn(['lifecycleMsg']),
        actions: actions1,
      });
    });

    res = res.sort((a, b) => {
      let res1 = (a.datasetType || '').toLowerCase().localeCompare((b.datasetType || '').toLowerCase());
      if (res1 === 0) {
        if (a.streaming && b.streaming) {
          res1 = 0;
        } else if (a.streaming && !b.streaming) {
          res1 = 1;
        } else {
          res1 = -1;
        }
      }

      if (res1 === 0) {
        res1 = (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      }
      return res1;
    });

    return res;
  });

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      return null;
    } else {
      return projectId;
    }
  };

  onClickAddNewDataset = (e) => {
    let p1 = this.calcProjectId();
    if (p1) {
      p1 = '/' + p1;
    } else {
      p1 = '';
    }

    Location.push('/' + PartsLink.dataset_upload + p1);
  };

  memUseCaseSchemas = memoizeOneCurry((doCall, useCases, useCase) => {
    return memUseCasesSchemasInfo(doCall, useCase);
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  onClickStarred = (datasetId, isStarred, e) => {
    REClient_.client_()._starDataset(datasetId, isStarred, (err, res) => {
      StoreActions.listDatasets_([datasetId]);

      let list = [...(this.state.allList ?? [])];

      list?.some((d1, d1ind) => {
        if (d1?.datasetId === datasetId) {
          if (this.state.onlyStarred && !isStarred) {
            list.splice(d1ind, 1);
          } else {
            d1.starred = isStarred === true;
          }
          return true;
        }
      });

      this.setState({
        allList: list,
      });
    });
  };

  memColumns = memoizeOne((schemaInfo, projectId, foundProject1, isAll) => {
    let columns: ITableExtColumn[] = [
      {
        title: '',
        field: 'starred',
        helpId: '',
        noAutoTooltip: true,
        render: (starred, row, index) => {
          return <StarredSpan name={'Dataset'} isStarred={row.starred} onClick={this.onClickStarred.bind(this, row.datasetId)} />;
        },
        width: 45,
        hidden: this.props.isAll !== true,
      },
      {
        title: 'ID',
        field: 'datasetId',
        render: (text, row, index) => {
          return (
            <span className={sd.styleTextBlue}>
              <CopyText>{row.datasetId}</CopyText>
            </span>
          );
        },
        width: 140,
      },
      // {
      //   title: 'Type',
      //   field: 'datasetType',
      //   render: (text, row) => {
      //     if(schemaInfo) {
      //       // @ts-ignore
      //       let t1 = text==null ? null : Object.values(schemaInfo).find(type => type.dataset_type == text);
      //       if(t1) {
      //         if (row.streaming) {
      //           // @ts-ignore
      //           return <div>{t1.title} <FontAwesomeIcon icon={['fad', 'signal-stream']} title={'Streaming Dataset'} className={sd.styleTextBlueBrightColor} /></div>;
      //         }
      //         // @ts-ignore
      //         return t1.title;
      //       }
      //     }
      //     return text;
      //   },
      // },
      {
        title: 'Number of Rows/Size',
        field: 'size',
      },
      {
        title: 'Table Name',
        field: 'featureGroupTableName',
        render: (text, row, index) => <span className={isAll ? '' : sd.linkBlue}>{text}</span>,
        isLinked: isAll,
      },
      {
        title: 'Latest Version',
        field: 'lastVersion',
        helpId: 'datasetslist_latest_version',
        width: 160,
        render: (text, row, index) => {
          return (
            <span className={sd.styleTextBlue}>
              <CopyText>{row.lastVersion}</CopyText>
            </span>
          );
        },
      },
      // {
      //   title: 'Validation',
      //   render: (text, row, index) => {
      //     if(row.lifecycleReal===DatasetLifecycle.COMPLETE) {
      //       return <PreviewFieldsRect useLinkToSchema={true} forceSpanUse={true} datasetId={row.datasetId} datasetType={row?.datasetType} useCase={useCase} noTitle projectId={projectId} isOnlyText={true} validate={true} onlyInvalid={true} allValidText={'All Valid'} />;
      //     }
      //     return '';
      //   },
      // },
      {
        title: 'Status',
        field: 'status',
        render: (text, row, index) => {
          if ([DatasetLifecycle.UPLOADING, DatasetLifecycle.CONVERTING, DatasetLifecycle.INSPECTING, DatasetLifecycle.IMPORTING, DatasetLifecycle.PENDING].includes(row.lifecycleReal || '')) {
            StoreActions.refreshDoDatasetAll_(row.datasetId, projectId);
          }

          let isUploading = row.datasetId && StoreActions.refreshDatasetUntilStateIsUploading_(row.datasetId);

          if (isUploading) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{row.lifecycleReal === DatasetLifecycle.UPLOADING ? 'Uploading' : row.lifecycleReal === DatasetLifecycle.CONVERTING ? 'Converting' : 'Processing'}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
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
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
        width: 220,
      },
      {
        title: '',
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        field: 'actions',
        width: 150,
      },
    ];

    columns = columns.filter((c1) => !c1.hidden);

    if (isAll) {
      columns = columns.filter((c1) => !['datasetType', 'status', 'size', 'lastVersion', 'actions'].includes('' + c1.field));
    } else {
      columns = columns.filter((c1) => !['createdAt'].includes('' + c1.field));
    }

    return columns;
  });

  memDatasetsListAll = memoizeOne((lastId, isStarred) => {
    const max = 50;
    REClient_.client_().listDatasets(max, lastId, isStarred === true ? true : null, (err, res) => {
      let list = this.state.allList;

      list = [...(list ?? [])];
      if (lastId == null) {
        list = [];
      }

      if (res?.result != null) {
        list = list.concat(res?.result);
      }

      let nextId = null;
      if (list != null && list.length > 0) {
        nextId = list[list.length - 1]?.datasetId;
      }

      let notMore = (list?.length ?? 0) < max;

      this.setState({
        allList: list,
        allLastIdNext: nextId,
        allNotMore: notMore,
      });
    });
  });

  needMoreRemote = () => {
    if (this.state.allNotMore) {
      return;
    }

    this.setState({
      allLastId: this.state.allLastIdNext,
    });
  };

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, projectId) => {
    return projectDatasetsReq.memDatasetsByProjectId(doCall, projectDatasets, projectId);
  });

  memDatasetsList = memoizeOneCurry((doCall, datasets, listDatasets) => {
    if (listDatasets) {
      let ids = listDatasets.map((d1) => d1.dataset?.datasetId);
      return datasetsReq.memDatasetListCall(doCall, datasets, ids);
    }
  });

  onChangeStarred = (e) => {
    let v1 = e.target.checked;
    if (v1 !== true) {
      v1 = null;
    }

    this.setState({
      onlyStarred: v1,
      allLastId: null,
      allList: null,
      allNotMore: null,
      // }, () => {
      //   StoreActions.listAllDatasets(v1);
    });

    Location.push('/' + PartsLink.datasets_all, undefined, Utils.processParamsAsQuery({ starred: v1 ? '1' : null }, window.location.search));
  };

  render() {
    let { defDatasets, projects, datasets, paramsProp } = this.props;

    let projectId = this.calcProjectId();

    let useCase = '';
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    if (foundProject1) {
      useCase = foundProject1.useCase;
    }

    const isPnp = foundProject1?.isPnp;

    let schemaInfo = this.memUseCaseSchemas(false)(this.props.useCases, useCase);

    let listDatasetsProj = this.memProjectDatasets(false)(this.props.projectDatasets, projectId);
    let listDatasets = this.memDatasetsList(false)(this.props.datasets, listDatasetsProj);

    const columns = this.memColumns(schemaInfo, projectId, foundProject1, this.props.isAll);

    let remoteRowCount = null;
    let isRefreshing = false;
    let dataList = [];
    if (this.props.isAll) {
      dataList = this.state.allList;
      if (dataList != null) {
        remoteRowCount = dataList.length;
        if (!this.state.allNotMore) {
          remoteRowCount += 1;
        }
      }
    } else if (listDatasets) {
      dataList = this.memCalcDatasetList(listDatasets, projectId);
    }
    if (datasets) {
      if (datasets.get('isRefreshing')) {
        isRefreshing = true;
      }
    }

    let projectPart = '';
    if (projectId) {
      projectPart = '/' + projectId;
    }

    const isAll = this.props.isAll;

    let tableHH = (hh) => (
      <RefreshAndProgress isRelative={hh == null} isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
        <TableExt
          remoteRowCount={remoteRowCount}
          onNeedMore={isRefreshing || !this.props.isAll ? null : this.needMoreRemote}
          isVirtual={this.props.isAll}
          showEmptyIcon={true}
          disableSort={isAll}
          defaultSort={isAll ? null : { field: 'createdForSort' }}
          notsaveSortState={'dataset_list'}
          height={hh}
          dataSource={dataList}
          columns={columns}
          calcKey={(r1) => r1.datasetId}
          calcLink={(row) => '/' + PartsLink.dataset_detail + '/' + row?.datasetId + projectPart}
        />
      </RefreshAndProgress>
    );

    let table = null;
    if (this.props.isSmall) {
      table = tableHH(null);
    } else {
      table = <AutoSizer disableWidth>{({ height }) => tableHH(height - topAfterHeaderHH)}</AutoSizer>;
    }

    return (
      <div className={(this.props.isSmall ? '' : sd.absolute) + ' ' + sd.table} style={_.assign({ margin: '25px' }, this.props.isSmall ? {} : { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }) as CSSProperties}>
        <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          {!this.props.isSmall && !isPnp && (
            <span style={{ float: 'right' }}>
              <Button type={'primary'} style={{ height: '30px', padding: '0 16px' }} onClick={this.onClickAddNewDataset}>
                Create Dataset
              </Button>
            </span>
          )}
          <span>
            Datasets
            <HelpIcon id={'datasetslist_title'} style={{ marginLeft: '4px' }} />
          </span>
          {this.props.isAll && (
            <Checkbox style={{ marginLeft: '25px' }} checked={this.state.onlyStarred} onChange={this.onChangeStarred}>
              <span
                css={`
                  color: white;
                `}
              >
                Show Only Starred
              </span>
            </Checkbox>
          )}
        </div>

        {table}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    datasets: state.datasets,
    projects: state.projects,
    defDatasets: state.defDatasets,
    useCases: state.useCases,
    projectDatasets: state.projectDatasets,
  }),
  null,
)(DatasetsList);
