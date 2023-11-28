import Button from 'antd/lib/button';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import REClient_ from '../../api/REClient';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ModelMonitorAlerts.module.css');
const sd = require('../antdUseDark.module.css');

export const AlertsTypesList = [
  {
    label: 'Model Drift',
    value: 'md',
  },
  {
    label: 'Feature Drift',
    value: 'fd',
  },
  {
    label: 'Data Integrity',
    value: 'di',
  },
  {
    label: 'Outliers',
    value: 'ou',
  },
];

interface IModelMonitorAlertsProps {}

const ModelMonitorAlerts = React.memo((props: PropsWithChildren<IModelMonitorAlertsProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredAuto, forceUpdateAuto] = useReducer((x) => x + 1, 0);
  const [alertsList, setAlertsList] = useState([]);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const modelMonitorId = paramsProp?.get('modelMonitorId');

  const onClickEdit = (name1, e) => {
    e.stopPropagation();
    e.preventDefault();

    Location.push('/' + PartsLink.monitor_alerts_add + '/' + modelMonitorId + '/' + projectId, undefined, 'editName=' + encodeURIComponent(name1));
  };

  const columnsAlerts = useMemo(() => {
    return [
      {
        title: 'Name',
        field: 'name',
      },
      {
        title: 'Metric',
        field: 'metric',
        render: (text, row, index) => {
          return AlertsTypesList.find((a1) => a1.value === row.config?.metric)?.label ?? '-';
        },
      },
      {
        title: 'Features',
        render: (text, row, index) => {
          text = row.config?.features;

          if (_.isArray(text)) {
            return (
              <span>
                {text?.map((r1, r1ind) => (
                  <span key={'rr' + r1ind}>
                    {r1ind > 0 ? <span>, </span> : null}
                    {r1}
                  </span>
                ))}
              </span>
            );
          } else {
            return '-';
          }
        },
      },
      {
        title: 'Threshold',
        render: (text, row, index) => {
          // let con1 = _.cloneDeep(row.config ?? {});
          // delete con1.name;
          // delete con1.features;
          // delete con1.metric;

          return row.config?.valueThreshold ?? '';
        },
      },
      {
        title: 'Actions',
        noAutoTooltip: true,
        noLink: true,
        render: (text, row, index) => {
          return (
            <Button type={'default'} ghost onClick={onClickEdit.bind(null, row.name)}>
              Edit
            </Button>
          );
        },
      },
    ] as ITableExtColumn[];
  }, []);

  useEffect(() => {
    REClient_.client_()._listModelMonitorAlerts(modelMonitorId, (err, res) => {
      if (err || !res?.success) {
        //
      } else {
        setAlertsList(res?.result ?? []);
      }
    });
  }, [modelMonitorId, ignoredAuto]);

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      `}
    >
      <div className={sd.titleTopHeaderAfter} style={{ margin: '20px', height: topAfterHeaderHH, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <span>Alerts</span>
        <span
          css={`
            flex: 1;
          `}
        ></span>
        <span>
          <Link to={'/' + PartsLink.monitor_alerts_add + '/' + modelMonitorId + '/' + projectId}>
            <Button className={sd.detailbuttonblue} style={{ margin: '4px' }} type={'primary'}>
              Add Alert
            </Button>
          </Link>
        </span>
      </div>
      <div
        css={`
          position: absolute;
          top: ${topAfterHeaderHH}px;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        <NanoScroller onlyVertical>
          <div
            css={`
              margin: 30px;
            `}
          >
            <TableExt showEmptyIcon={true} dataSource={alertsList} columns={columnsAlerts} />
          </div>
        </NanoScroller>
      </div>
    </div>
  );
});

export default ModelMonitorAlerts;
