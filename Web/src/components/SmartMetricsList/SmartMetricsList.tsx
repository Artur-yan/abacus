import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import metrics from '../../stores/reducers/metrics';
const s = require('./SmartMetricsList.module.css');
const sd = require('../antdUseDark.module.css');

interface ISmartMetricsListProps {
  onGetChartTitle?: (title?: string) => void;
  onGetListIds?: (ids?: string[]) => void;
  onGetListAccuracy?: (values?: any[]) => void;
  onGetListIdsNames?: (names?: string[]) => void;
  barChart?: string;
  detailModelVersion?: string;
  algorithm?: string;
  projectId?: string;
  dataIndex?: any;

  filterIdsName?: any;
  filterNameSmall?: any;
  filterModelVersion?: any;
  filterLongName?: any;
}

const SmartMetricsList = React.memo((props: PropsWithChildren<ISmartMetricsListProps>) => {
  const { paramsProp, metricsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    metricsParam: state.metrics,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    metrics.memMetricVersionOne(undefined, props.detailModelVersion ?? props.filterModelVersion, props.algorithm, undefined, null, null, null, null, '', true);
  }, [metricsParam, props.detailModelVersion, props.filterModelVersion]);
  const memMetricsVersionOne = useMemo(() => {
    return metrics.memMetricVersionOne(undefined, props.detailModelVersion ?? props.filterModelVersion, props.algorithm, undefined, null, null, null, null, '', false);
  }, [metricsParam, props.detailModelVersion, props.filterModelVersion]);

  useEffect(() => {
    if (!memMetricsVersionOne || props.dataIndex == null || !props.barChart) {
      return;
    }

    let chartData = memMetricsVersionOne?.metrics?.detailedMetrics?.[props.barChart];
    if (chartData) {
      props.onGetListIdsNames?.(chartData?.labels);

      let breakdown1 = chartData?.breakdown?.[Utils.tryParseInt(props.dataIndex) ?? 0];

      props.onGetChartTitle?.(chartData?.title);

      let ids = breakdown1?.ids;
      props.onGetListIds?.(ids);

      let accs = null;

      let decimals1 = 3;
      let format1 = null;
      if (breakdown1?.valuesMetricName?.toLowerCase() === 'accuracy') {
        accs = breakdown1?.values;
        decimals1 = breakdown1?.valuesDecimals ?? decimals1;
        format1 = breakdown1?.valuesFormat;
      } else if (breakdown1?.valuesSecondaryMetricName?.toLowerCase() === 'accuracy') {
        accs = breakdown1?.valuesSecondary;
        decimals1 = breakdown1?.valuesSecondaryDecimals ?? decimals1;
        format1 = breakdown1?.valuesSecondaryFormat;
      }

      accs = accs?.map((a1, a1ind) => {
        let st1 = Utils.decimals(a1 ?? 0, decimals1);
        if (!Utils.isNullOrEmpty(format1)) {
          st1 += format1;
        }
        return st1;
      });

      props.onGetListAccuracy?.(accs);
    }
  }, [memMetricsVersionOne, props.dataIndex, props.barChart]);

  useEffect(() => {
    if (!memMetricsVersionOne || props.filterNameSmall == null || !props.filterModelVersion || !props.filterIdsName) {
      return;
    }

    let listIdsResult;
    let showIds1 = memMetricsVersionOne?.metricInfos?.[props.filterNameSmall]?.showIds;
    if (showIds1 != null) {
      listIdsResult = memMetricsVersionOne?.metrics?.detailedMetrics?.itemFilteringInfos?.[showIds1 ?? '-'];
    }
    if (listIdsResult != null) {
      props.onGetListIdsNames?.([props.filterLongName ?? '-']);

      props.onGetChartTitle?.(props.filterLongName ?? '');

      props.onGetListIds?.(listIdsResult);
    }
  }, [memMetricsVersionOne, props.filterNameSmall, props.filterModelVersion, props.filterIdsName]);

  return <></>;
});

export default SmartMetricsList;
