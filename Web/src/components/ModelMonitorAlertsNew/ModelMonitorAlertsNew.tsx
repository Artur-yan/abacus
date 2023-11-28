import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useMonitorsAll } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import CopyText from '../CopyText/CopyText';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ModelMonitorAlertsNew.module.css');
const sd = require('../antdUseDark.module.css');

const secondLineHH = 50;

export const AlertsTypesList = [
  {
    label: 'Feature Drift',
    alert_type: 'FeatureDrift',
    options: {
      feature_drift_type: {
        dataType: 'ENUM',
        displayName: 'Distance Type',
        name: 'feature_drift_type',
        helpId: 'monitor_alerts_feature_drift_type',
        default: 'kl',
        options: {
          names: ['JS', 'KS', 'KL', 'WS'],
          values: ['js', 'ks', 'kl', 'ws'],
        },
      },
      threshold: {
        dataType: 'DECIMAL',
        displayName: 'Threshold',
        name: 'threshold',
        helpId: 'monitor_alerts_feature_drift_threshold',
        default: 0.1,
        options: {
          range: [0, 1],
          step: 0.01,
        },
      },
      minimum_violations: {
        dataType: 'integer',
        displayName: 'Minimum number of violations to alert for',
        name: 'minimum_violations',
        helpId: 'monitor_alerts_feature_minimum_violations',
        default: 1,
        options: {
          range: [1],
        },
      },
    },
  },
  {
    label: 'Accuracy Below Threshold',
    alert_type: 'AccuracyBelowThreshold',
    options: {
      threshold: {
        dataType: 'DECIMAL',
        displayName: 'Threshold',
        name: 'threshold',
        helpId: 'monitor_alerts_accuracy_threshold',
        default: 0.1,
        options: {
          range: [0, 1],
          step: 0.01,
        },
      },
    },
  },
  {
    label: 'Data Integrity Violations',
    alert_type: 'DataIntegrityViolations',
    options: {
      data_integrity_type: {
        dataType: 'ENUM',
        displayName: 'Data Integrity Type',
        name: 'data_integrity_type',
        helpId: 'monitor_alerts_data_integrity_types',
        default: 'null_violations',
        options: {
          names: ['Null Violations', 'Type Mismatch Violations', 'Range Violations', 'Categorical Range Violations', 'Total Violations'],
          values: ['null_violations', 'type_mismatch_violations', 'range_violations', 'categorical_range_violations', 'total_violations'],
        },
      },
      minimum_violations: {
        dataType: 'integer',
        displayName: 'Minimum number of violations to alert for',
        name: 'minimum_violations',
        helpId: 'monitor_alerts_data_integrity_minimum_violations',
        default: 1,
        options: {
          range: [1],
        },
      },
    },
  },
  {
    label: 'Bias',
    alert_type: 'BiasViolations',
    options: {
      bias_type: {
        dataType: 'ENUM',
        displayName: 'Bias Type',
        name: 'bias_type',
        helpId: 'monitor_alerts_bias_types',
        default: 'demographic_parity',
        options: {
          names: ['Demographic Parity', 'Equal Opportunity', 'Group Benefit Equality', 'Total'],
          values: ['demographic_parity', 'equal_opportunity', 'group_benefit', 'total'],
        },
      },
      threshold: {
        dataType: 'DECIMAL',
        displayName: 'Threshold to alert on',
        name: 'threshold',
        helpId: 'monitor_alerts_bias_threshold',
        default: 0.8,
        options: {
          range: [0, 1],
          step: 0.01,
        },
      },
      minimum_violations: {
        dataType: 'integer',
        displayName: 'Minimum number of violations to alert on (greater than or equal)',
        name: 'minimum_violations',
        helpId: 'monitor_alerts_bias_minimum_violations',
        default: 1,
        options: {
          range: [1],
        },
      },
    },
  },
];

interface IModelMonitorAlertsNewProps {}

const ModelMonitorAlertsNew = React.memo((props: PropsWithChildren<IModelMonitorAlertsNewProps>) => {
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

  const onClickEdit = (monitorAlertId, e) => {
    e.stopPropagation();
    e.preventDefault();

    let p1 = '';
    if (projectId) {
      p1 = '/' + projectId;
    }

    Location.push('/' + PartsLink.monitors_alert_add + '/' + modelMonitorId + p1, undefined, `monitorAlertId=${encodeURIComponent(monitorAlertId)}`);
  };

  const onClickDelete = (monitorAlertId, e) => {
    e.stopPropagation();
    e.preventDefault();

    REClient_.client_().deleteMonitorAlert(monitorAlertId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.describeMonitorAlert_(monitorAlertId);
        forceUpdateAuto();
      }
    });
  };

  const onClickRun = (monitorAlertId, e) => {
    e.stopPropagation();
    e.preventDefault();

    REClient_.client_().runMonitorAlert(monitorAlertId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.describeMonitorAlert_(monitorAlertId);
        forceUpdateAuto();
        REActions.addNotification('Done!');
      }
    });
  };

  const columnsAlerts = useMemo(() => {
    return [
      {
        title: 'Alert ID',
        field: 'monitorAlertId',
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
        width: 120,
        isLinked: true,
      },
      {
        title: 'Name',
        field: 'name',
      },
      {
        title: 'Description',
        field: 'conditionDescription',
        render: (text, row, index) => {
          return row?.conditionDescription ?? '-';
        },
      },
      // {
      //   title: 'Features',
      //   render: (text, row, index) => {
      //     text = row.config?.features;
      //
      //     if(_.isArray(text)) {
      //       return <span>{text?.map((r1, r1ind) => (<span key={'rr'+r1ind}>{r1ind>0 ? <span>, </span> : null}{r1}</span>))}</span>;
      //     } else {
      //       return '-';
      //     }
      //   },
      // },
      {
        title: 'Alert Action',
        field: 'alert_action',
        render: (text, row, index) => {
          return row?.actionDescription ?? '';
        },
      },
      {
        title: 'Actions',
        noAutoTooltip: true,
        noLink: true,
        render: (text, row, index) => {
          return (
            <span
              css={`
                display: flex;
                gap: 10px;
              `}
            >
              <Button type={'default'} ghost onClick={onClickEdit.bind(null, row.monitorAlertId)}>
                Edit
              </Button>
              <ModalConfirm
                onConfirm={onClickDelete.bind(null, row.monitorAlertId)}
                title={`Do you want to delete this alert'?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Delete'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button type={'default'} danger ghost>
                  Delete
                </Button>
              </ModalConfirm>
            </span>
          );
        },
      },
    ] as ITableExtColumn[];
  }, []);

  useEffect(() => {
    setAlertsList([]);
    REClient_.client_().listMonitorAlertsForMonitor(modelMonitorId, (err, res) => {
      if (err || !res?.success) {
        //
      } else {
        setAlertsList(res?.result ?? []);
      }
    });
  }, [modelMonitorId, ignoredAuto]);

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const modelsList = useMonitorsAll(projectId, true);

  const optionsModels = useMemo(() => {
    return modelsList?.map((m1) => ({
      label: m1.name,
      value: m1.modelMonitorId,
      data: m1,
      search: m1.name,
    }));
  }, [modelsList]);

  let modelSelectValue = optionsModels?.find((p1) => p1.value === modelMonitorId) ?? null;

  const onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let mode = paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let projectPart = projectId;
      if (projectPart) {
        projectPart = '/' + projectPart;
      } else {
        projectPart = '';
      }

      Location.push('/' + mode + '/' + optionSel.value + projectPart, undefined, Utils.processParamsAsQuery({}, window.location.search));
    }
  };

  const calcKey = useCallback((row) => {
    return row.monitorAlertId;
  }, []);

  const calcLink = useCallback(
    (row) => {
      let p1 = '';
      if (projectId) {
        p1 = '/' + projectId;
      }
      return ['/' + PartsLink.monitors_alert_events + '/' + row.modelMonitorId + p1, `monitorAlertId=${encodeURIComponent(row.monitorAlertId)}`];
    },
    [projectId],
  );

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
      <div className={sd.titleTopHeaderAfter} style={{ margin: '20px', display: 'flex', justifyContent: 'flex-start' }}>
        <span>Alerts</span>
      </div>
      <div
        css={`
          display: flex;
          align-items: center;
          margin: 0 20px;
        `}
      >
        <span
          css={`
            font-size: 16px;
          `}
        >
          Monitor:
        </span>
        <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '240px', display: 'inline-block', fontSize: '12px' }}>
          <SelectExt value={modelSelectValue} options={optionsModels} onChange={onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
        </span>

        <span
          css={`
            flex: 1;
          `}
        ></span>
        <span>
          <Link to={'/' + PartsLink.monitors_alert_add + '/' + modelMonitorId + '/' + projectId}>
            <Button className={sd.detailbuttonblue} style={{ margin: '4px' }} type={'primary'}>
              Add Alert
            </Button>
          </Link>
        </span>
      </div>
      <div
        css={`
          position: absolute;
          top: ${topAfterHeaderHH + secondLineHH}px;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        <NanoScroller onlyVertical>
          <div
            css={`
              margin: 30px 20px;
            `}
          >
            <TableExt showEmptyIcon={true} dataSource={alertsList} columns={columnsAlerts} calcKey={calcKey} calcLink={calcLink} />
          </div>
        </NanoScroller>
      </div>
    </div>
  );
});

export default ModelMonitorAlertsNew;
