import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import monitoring from '../../stores/reducers/monitoring';
import predictionMetrics, { PredictionMetricsLifecycle } from '../../stores/reducers/predictionMetrics';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./PredMetricsList.module.css');
const sd = require('../antdUseDark.module.css');

interface IPredMetricsListProps {
  isProject?: boolean;
  isModelMonitor?: boolean;
}

const PredMetricsList = React.memo((props: PropsWithChildren<IPredMetricsListProps>) => {
  const { paramsProp, authUser, monitoringParam, featureGroupsParam, predictionMetricsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    featureGroupsParam: state.featureGroups,
    predictionMetricsParam: state.predictionMetrics,
    monitoringParam: state.monitoring,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  let featureGroupId = paramsProp?.get('featureGroupId');
  const projectId = paramsProp?.get('projectId');

  const modelMonitorId = paramsProp?.get('modelMonitorId');
  let filterFeatureGroupId = paramsProp?.get('filterFeatureGroupId');
  if (filterFeatureGroupId === '') {
    filterFeatureGroupId = null;
  }

  const foundProject1 = useProject(projectId);
  const isDrift = foundProject1?.isDrift === true;

  useEffect(() => {
    if (!modelMonitorId || !props.isModelMonitor) {
      return;
    }

    monitoring.memModelsById(true, modelMonitorId);
  }, [monitoringParam, modelMonitorId, props.isModelMonitor]);
  const modelMonitorOne = useMemo(() => {
    if (!modelMonitorId || !props.isModelMonitor) {
      return;
    }

    return monitoring.memModelsById(false, modelMonitorId);
  }, [monitoringParam, modelMonitorId, props.isModelMonitor]);

  if (props.isModelMonitor) {
    featureGroupId = modelMonitorOne?.predictionFeatureGroupId;
  }

  useEffect(() => {
    if (props.isProject) {
      return;
    }

    featureGroups.memFeatureGroupsForId(true, null, featureGroupId);
  }, [featureGroupsParam, featureGroupId, props.isProject]);
  const featureGroupOne = useMemo(() => {
    if (props.isProject) {
      return;
    }

    return featureGroups.memFeatureGroupsForId(false, null, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  useEffect(() => {
    if (props.isProject) {
      return;
    }

    predictionMetrics.memListMetricsByFeatureGroupId(true, predictionMetricsParam, featureGroupId);
  }, [predictionMetricsParam, featureGroupId, props.isProject]);
  const listFG = useMemo(() => {
    if (props.isProject) {
      return;
    }

    return predictionMetrics.memListMetricsByFeatureGroupId(false, predictionMetricsParam, featureGroupId);
  }, [predictionMetricsParam, featureGroupId, props.isProject]);

  useEffect(() => {
    if (!props.isProject) {
      return;
    }

    predictionMetrics.memMetricsByProjectId(true, predictionMetricsParam, projectId);
  }, [props.isProject, predictionMetricsParam, projectId]);
  const listProject = useMemo(() => {
    if (!props.isProject) {
      return;
    }

    return predictionMetrics.memMetricsByProjectId(false, predictionMetricsParam, projectId);
  }, [props.isProject, predictionMetricsParam, projectId]);

  const list = useMemo(() => {
    let res = !props.isProject ? listFG : listProject;

    if (res != null && filterFeatureGroupId != null) {
      res = res.filter((r1) => r1.featureGroupId === filterFeatureGroupId);
    }

    return res;
  }, [props.isProject, listFG, listProject, filterFeatureGroupId]);

  let columns = useMemo(() => {
    return [
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld date={text} />;
        },
        width: 240,
      },
      {
        title: 'Prediction Metric Id',
        field: 'predictionMetricId',
        isLinked: true,
      },
      {
        title: 'Feature Group',
        field: 'featureGroupName',
        hidden: !props.isProject,
      },
      {
        title: 'Status',
        render: (text, row, index) => {
          let status = row?.latestPredictionMetricVersionDescription?.status;
          let isTraining = false;
          if ([PredictionMetricsLifecycle.RUNNING, PredictionMetricsLifecycle.PENDING].includes(status || '')) {
            isTraining = true;
            StoreActions.refreshDoPredMetricsAll_(row.predictionMetricId, featureGroupId, projectId);
          }

          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(status ?? '')}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(status ?? '-')}</span>;
            if ([PredictionMetricsLifecycle.FAILED].includes(status || '')) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
        width: 200,
      },
    ].filter((c1) => !(c1 as any).hidden) as ITableExtColumn[];
  }, [featureGroupId, props.isProject]);

  let calcLink = useCallback(
    (row) => {
      return '/' + PartsLink.prediction_metrics_detail + '/' + projectId + '/' + row.predictionMetricId;
    },
    [featureGroupId, projectId],
  );

  let tableHH = (hh, forceRelative = false) => (
    <RefreshAndProgress isRelative={forceRelative || hh == null} isRefreshing={isRefreshing} style={hh == null || forceRelative ? {} : { top: topAfterHeaderHH + 'px' }}>
      <TableExt showEmptyIcon={true} height={hh} dataSource={list} columns={columns} calcKey={(r1) => r1.predictionMetricId} calcLink={calcLink} />
    </RefreshAndProgress>
  );

  let table = <AutoSizer disableWidth>{({ height }) => tableHH(height - topAfterHeaderHH)}</AutoSizer>;

  let onCreateMetricClick = (isProject, e) => {
    if (isProject) {
      Location.push('/' + PartsLink.prediction_metrics_add + '/' + projectId);
      return;
    }

    setIsCreating(true);
    REClient_.client_()._createPredictionMetric(featureGroupId, { predictionMetricType: 'DecilePredictionMetric' }, projectId, (err, res) => {
      if (err || !res?.success) {
        setIsCreating(false);
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let predictionMetricId = res?.result?.predictionMetricId;

        REClient_.client_()._runPredictionMetric(predictionMetricId, (err2, res2) => {
          setIsCreating(false);
          if (err2 || !res2?.success) {
            REActions.addNotificationError(err2 || Constants.errorDefault);
          } else {
            StoreActions.refreshDoPredMetricsAll_(predictionMetricId, featureGroupId, projectId);

            StoreActions._getPredMetricsByFeatureGroupId(featureGroupId);
            StoreActions.listPredMetricsForProjectId_(projectId);

            Location.push('/' + PartsLink.prediction_metrics_detail + '/' + projectId + '/' + predictionMetricId);
          }
        });
      }
    });
  };

  return (
    <div className={sd.absolute + ' ' + sd.table} style={_.assign({ margin: '25px 0' }, { position: 'absolute', left: '30px', top: 0, right: '30px', bottom: 0 }) as CSSProperties}>
      <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH, display: 'flex' }}>
        <span
          css={`
            flex: 1;
          `}
        >
          Prediction Metrics
          <HelpIcon id={'predmetricslist_title'} style={{ marginLeft: '4px' }} />
        </span>
        <span>
          {!featureGroupId && props.isProject && !isDrift && (
            <Button onClick={onCreateMetricClick.bind(null, props.isProject)} type={'primary'}>
              Create Prediction Metric
            </Button>
          )}
          {featureGroupId && !props.isProject && !isDrift && (
            <ModalConfirm
              onConfirm={onCreateMetricClick.bind(null, props.isProject)}
              title={`Do you want to create a new Prediction Metric"?`}
              icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
              okText={'Create'}
              cancelText={'Cancel'}
              okType={'primary'}
            >
              <Button disabled={isCreating} type={'primary'}>
                Create Prediction Metric
                {isCreating ? (
                  <span
                    css={`
                      margin-left: 5px;
                    `}
                  >
                    <FontAwesomeIcon icon={['fad', 'sync']} transform={{ size: 14, x: 0, y: 0 }} spin />
                  </span>
                ) : null}
              </Button>
            </ModalConfirm>
          )}
        </span>
      </div>
      {table}
    </div>
  );
});

export default PredMetricsList;
