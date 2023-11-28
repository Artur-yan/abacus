import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useMonitorsAllOrg } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { ModelMonitoringLifecycle } from '../../stores/reducers/monitoring';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./MonitorsListAll.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitorsListAllProps {}

const topHHExtra = 40;

const MonitorsListAll = React.memo((props: PropsWithChildren<IMonitorsListAllProps>) => {
  const { featureGroupsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    featureGroupsParam: state.featureGroups,
  }));

  const projectId = '2a4bfc182';

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredRefresh, forceUpdateRefresh] = useReducer((x) => x + 1, 0);

  let filterInParam = paramsProp?.get('filter');
  if (_.trim(filterInParam || '') === '') {
    filterInParam = null;
  }
  const [filterText, setFilterText] = useState(filterInParam ?? '');
  const [filterType, setFilterType] = useState(null);
  const [onlyStarred, setOnlyStarred] = useState(paramsProp?.get('starred') === '1');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastId, setLastId] = useState(null);
  const [lastIdMore, setLastIdMore] = useState(null);
  const [notMore, setNotMore] = useState(false);
  // const [dataList, setDataList] = useState(null);
  const [isRefreshingMore, setIsRefreshingMore] = useState(false);

  const onChangeStarred = (e) => {
    let v1 = e.target.checked;
    if (v1 !== true) {
      v1 = null;
    }

    setOnlyStarred(v1);
    // setTimeout(() => {
    //   refreshList();
    // }, 0);

    Location.push('/' + paramsProp?.get('mode'), undefined, Utils.processParamsAsQuery({ starred: v1 ? '1' : null }, window.location.search));
  };

  const onClickFilterText = (e) => {
    setFilterText((s1) => {
      const v1 = _.trim(s1 || '');
      if ((paramsProp?.get('filter') ?? '') !== v1) {
        setTimeout(() => {
          Location.push('/' + paramsProp?.get('mode'), undefined, Utils.processParamsAsQuery({ filter: v1 }, window.location.search));

          forceUpdateRefresh();
          // setTimeout(() => {
          //   refreshList();
          // }, 0);
        }, 0);
      }

      return s1;
    });
  };

  const onClickFilterTextClear = (e) => {
    setFilterText('');
    onClickFilterText(e);
  };

  const onChangeFilterText = (e) => {
    setFilterText(e.target.value);
  };

  const onKeyDownFilterText = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClickFilterText(e);
    }
  };

  const onClickStarred = (modelMonitorId, starred, e) => {
    REClient_.client_()._starModelMonitor(modelMonitorId, starred, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        forceUpdateRefresh();
      }
    });
  };

  const columns: ITableExtColumn[] = useMemo(() => {
    return [
      {
        title: '',
        width: 40,
        field: 'starred',
        noAutoTooltip: true,
        helpId: 'ModelMonitorsListAll_starred',
        render: (starred, row, index) => {
          return <StarredSpan isSummary noNamePrefix={["Don't use", 'Use']} name={'Monitor in Summary'} isStarred={!!starred} onClick={onClickStarred.bind(null, row.modelMonitorId)} />;
        },
      },
      {
        title: 'ID',
        field: 'modelMonitorId',
        helpId: 'ModelMonitorsListAll_id',
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
        helpId: 'ModelMonitorsListAll_name',
        render: (text) => <span className={sd.linkBlue}>{text}</span>,
      },
      {
        title: 'Completed At',
        field: ['latestMonitorModelVersion', 'monitoringCompletedAt'],
        helpId: 'ModelMonitorsListAll_lastTrained',
        render: (text, row, index) => {
          return <DateOld always date={text} />;
        },
      },
      {
        title: 'Status',
        field: ['latestMonitorModelVersion', 'status'],
        helpId: 'ModelMonitorsListAll_status',
        render: (text, row, index) => {
          let status1 = row?.latestMonitorModelVersion?.status;

          let isTraining = row.modelMonitorId && StoreActions.refreshMonitorUntilStateIsTraining_(row.modelMonitorId);

          if (!isTraining && [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(status1 || '')) {
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
            let res = <span style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(status1)}</span>;
            if ([ModelMonitoringLifecycle.FAILED.toLowerCase()].includes((status1 || '').toLowerCase())) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let status1 = row?.latestMonitorModelVersion?.status;

          let res = null;
          if ([ModelMonitoringLifecycle.FAILED.toLowerCase()].includes((status1 || '').toLowerCase())) {
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
        helpId: 'ModelMonitorsListAll_actions',
      },
    ] as ITableExtColumn[];
  }, []);

  const dataList = useMonitorsAllOrg(onlyStarred, filterInParam, ignoredRefresh);

  const remoteRowCount = useMemo(() => {
    let res = dataList?.length ?? 0;
    if (!notMore && res > 0) {
      res++;
    }
    return res;
  }, [dataList, notMore]);

  const calcKeyTable = useCallback((row) => {
    return row?.featureGroupId;
  }, []);

  const calcLinkTable = useCallback((row) => {
    let partProject = '';
    if (row.projectId) {
      partProject = '/' + row.projectId;
    }
    return '/' + PartsLink.model_detail_monitor + '/' + row.modelMonitorId + partProject;
  }, []);

  const lastIdUsed = lastId == null ? null : lastId;

  const onNeedMore = () => {
    setIsRefreshingMore((isR) => {
      if (!isR) {
        setLastIdMore((id1) => {
          setLastId(id1);
          return id1;
        });
      }

      return isR;
    });
  };

  const onChangeFilterType = (option1) => {
    setFilterType(option1?.value ?? null);

    // setTimeout(() => {
    //   refreshList();
    // }, 0);
  };

  return (
    <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px', position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH + topHHExtra }}>
        <div
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <span>Monitors List&nbsp;</span>
          <span>
            <HelpIcon id={'featuregroupslist'} style={{ verticalAlign: 'text-bottom' }} />
          </span>
          <span
            css={`
              flex: 1;
            `}
          ></span>
        </div>
        <div
          css={`
            display: flex;
            align-items: center;
            margin-top: 8px;
          `}
        >
          <span style={{ width: '280px', display: 'inline-block', verticalAlign: 'top' }}>
            <Input style={{ verticalAlign: 'top', marginTop: '4px' }} placeholder={'Search monitor name'} value={filterText ?? ''} onChange={onChangeFilterText} onKeyDown={onKeyDownFilterText} />
          </span>
          <Button className={sd.detailbuttonblueBorder} ghost style={{ verticalAlign: 'top', marginTop: '1px', height: '30px', marginLeft: '5px' }} type={'primary'} onClick={onClickFilterText}>
            Go
          </Button>
          <Button className={sd.detailbuttonblueBorder} ghost style={{ verticalAlign: 'top', marginTop: '1px', height: '30px', marginLeft: '5px' }} type={'primary'} onClick={onClickFilterTextClear}>
            Clear
          </Button>

          <span
            css={`
              font-size: 14px;
            `}
          >
            <Checkbox style={{ marginLeft: '25px' }} checked={onlyStarred} onChange={onChangeStarred}>
              <span
                css={`
                  color: white;
                `}
              >
                Show Only Starred
              </span>
            </Checkbox>
          </span>
        </div>
      </div>

      {
        <AutoSizer disableWidth>
          {({ height }) => (
            <RefreshAndProgress isRefreshing={isRefreshing} style={{ top: topAfterHeaderHH + topHHExtra + 'px' }}>
              <TableExt showEmptyIcon={true} isVirtual noHover height={height - topAfterHeaderHH - topHHExtra} dataSource={dataList} columns={columns} calcKey={calcKeyTable} calcLink={calcLinkTable} />
            </RefreshAndProgress>
          )}
        </AutoSizer>
      }
    </div>
  );
});

export default MonitorsListAll;
