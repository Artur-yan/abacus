import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import ChartMetrics from '../ChartMetrics/ChartMetrics';
const s = require('./ChartMetricsFull.module.css');
const sd = require('../antdUseDark.module.css');

interface IChartMetricsFullProps {
  data?: any;
  width?: number;
  height?: number;
  noTitles?: boolean;
  styleBack?: CSSProperties;
  forceColor?: string | { from: string; to: string }[];
  forMetrics?: boolean;
  noMax?: boolean;
  sameColors?: boolean;
  showDownload?: any;
  backNormal?: boolean;
}

const ChartMetricsFull = React.memo((props: PropsWithChildren<IChartMetricsFullProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const space = 8;
  const isTwoCharts = props.data?.chart != null && props.data?.secondaryChart != null;
  const ww = isTwoCharts ? ((props.width ?? 0) - space) / 2 : props.width;

  const chart1 =
    props.data?.chart != null ? (
      <ChartMetrics
        backNormal={props.backNormal}
        showDownload={props.showDownload == null || props.showDownload === true || props.showDownload === 0}
        startColorIndex={props.data?.chart?.forceColorIndex}
        noMax={props.noMax}
        forMetrics={props.forMetrics}
        forceColor={props.forceColor}
        styleBack={props.styleBack}
        data={props.data?.chart}
        width={ww}
        height={props.height}
        noTitles={props.noTitles}
      />
    ) : null;
  const chart2 =
    props.data?.secondaryChart != null ? (
      <ChartMetrics
        backNormal={props.backNormal}
        showDownload={props.showDownload == null || props.showDownload === true || props.showDownload === 1}
        noMax={props.noMax}
        forMetrics={props.forMetrics}
        forceColor={props.forceColor}
        styleBack={props.styleBack}
        startColorIndex={props.sameColors ? undefined : 2}
        data={props.data?.secondaryChart}
        width={ww}
        height={props.height}
        noTitles={props.noTitles}
      />
    ) : null;

  const styleOneChart = useMemo(() => {
    return _.assign({ width: props.width + 'px', height: props.height + 'px' }, props.styleBack || {});
  }, [props.styleBack, props.width, props.height]);

  if (isTwoCharts) {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>{chart1}</div>
        <div style={{ flex: '0 0 ' + space + 'px' }}></div>
        <div style={{ flex: 1 }}>{chart2}</div>
      </div>
    );
  } else {
    const emptyChart = (
      <div
        style={styleOneChart}
        css={`
          border-radius: 10px;
          background-color: #101f35;
        `}
        className={s.chart}
      >
        &nbsp;
      </div>
    );

    return chart1 ?? chart2 ?? emptyChart;
  }
});

export default ChartMetricsFull;
