import * as React from 'react';
import Utils from '../../../../core/Utils';
import RefreshAndProgress from '../../RefreshAndProgress/RefreshAndProgress';
import Switch from 'antd/lib/switch';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_light from '@amcharts/amcharts4/themes/moonrisekingdom';
import am4themes_dark from '@amcharts/amcharts4/themes/dark';
import SelectExt from '../../SelectExt/SelectExt';

const styles = require('./ClusterMetrics.module.css');
const stylesDark = require('../../antdUseDark.module.css');

const colorSet = [
  '#007B7B', // cyan
  '#FF8C00', // orange
  '#1E90FF', // blue
  '#DB2032', // red
  '#32CD32', // green
  '#009090', // teal
  '#FF69B4', // pink
  '#802080', // purple
  '#EFd700', // yellow
];

const TimeseriesChart = (props) => {
  let { chartData, width } = props;

  const [selectedCluster, setSelectedCluster] = React.useState(null);
  const [selectedChartData, setSelectedChartData] = React.useState(null);
  const [isMean, setIsMean] = React.useState(false);
  const timeseriesChart = React.useRef(null);

  React.useEffect(() => {
    am4core.options.commercialLicense = true;
    am4core.unuseAllThemes();
    am4core.useTheme(Utils.isDark() ? am4themes_dark : am4themes_light);
  }, []);

  React.useLayoutEffect(() => {
    if (!chartData || !selectedChartData || !selectedChartData?.data) return;

    let chart = am4core.create('timeseriesChartDataDiv', am4charts.XYChart);

    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());

    dateAxis.baseInterval = {
      timeUnit: 'minute',
      count: 1,
    };
    dateAxis.tooltipDateFormat = 'HH:mm, d MMMM';
    dateAxis.dateFormatter.utc = true;

    dateAxis.showOnInit = false;
    dateAxis.keepSelection = true;

    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    valueAxis.tooltip.disabled = true;
    valueAxis.title.text = chartData.yAxis || '';

    valueAxis.showOnInit = false;
    valueAxis.min = 0;
    valueAxis.strictMinMax = true;

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    chart.scrollbarX = new am4charts.XYChartScrollbar();

    if (isMean) {
      let series = chart.series.push(new am4charts.LineSeries());

      series.showOnInit = false;
      series.name = 'Mean';

      series.dataFields.dateX = chartData.xAxis;
      series.dataFields.valueY = 'mean';
      series.fillOpacity = 0;

      series.tooltip.numberFormatter = new am4core.NumberFormatter();
      series.tooltip.numberFormatter.numberFormat = '#.00';
      series.tooltipText = '{name}: {valueY}';

      const index = selectedChartData?.dataColumns?.length ?? 0;
      const colorIndex = index > colorSet.length - 1 ? index % colorSet.length : index;
      const c1 = am4core.color(colorSet[colorIndex]);
      series.stroke = c1;
      series.fill = c1;
      series.strokeWidth = 2;

      // @ts-ignore
      chart.scrollbarX.series.push(series);
    } else {
      selectedChartData?.dataColumns?.forEach((column, index) => {
        if (column === chartData.xAxis) {
          return;
        }

        let series = chart.series.push(new am4charts.LineSeries());

        series.showOnInit = false;
        series.name = column;

        series.dataFields.dateX = chartData.xAxis;
        series.dataFields.valueY = column;
        series.fillOpacity = 0;

        series.tooltip.numberFormatter = new am4core.NumberFormatter();
        series.tooltip.numberFormatter.numberFormat = '#.00';
        series.tooltipText = '{name}: {valueY}';

        const colorIndex = index > colorSet.length - 1 ? index % colorSet.length : index;
        const c1 = am4core.color(colorSet[colorIndex]);
        series.stroke = c1;
        series.fill = c1;
        series.strokeWidth = 2;

        // @ts-ignore
        chart.scrollbarX.series.push(series);
      });
    }

    chart.legend = new am4charts.Legend();

    chart.data = isMean ? selectedChartData?.mean : selectedChartData?.data;

    chart.events.on('ready', function () {
      // @ts-ignore
      chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
      // @ts-ignore
      chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;
    });

    chart.events.on('datavalidated', function () {
      const chartDataLen = selectedChartData?.data?.length;
      if (chartDataLen === 0) {
        return;
      }
      let zoomStart = selectedChartData.data?.[0]?.[chartData.xAxis];
      let zoomEnd = selectedChartData.data?.[chartDataLen - 1]?.[chartData.xAxis];
      if (chartDataLen > 30) {
        zoomStart = selectedChartData.data?.[chartDataLen - 30]?.[chartData.xAxis];
      }

      dateAxis.zoomToDates(zoomStart, zoomEnd, false, true);
    });

    timeseriesChart.current = chart;

    return () => {
      chart.dispose();
    };
  }, [chartData, selectedChartData, isMean]);

  const optionsTimeseriesData = React.useMemo(() => {
    setSelectedCluster(chartData?.chartData?.[0].cluster);

    return chartData?.chartData?.map((item) => ({ label: item.cluster, value: item.cluster }));
  }, [chartData?.chartData]);

  const onChangeCluster = (option) => {
    setSelectedCluster(option.value);
    setIsMean(false);
  };

  React.useEffect(() => {
    setSelectedChartData(chartData?.chartData?.find((item) => item.cluster === selectedCluster));
  }, [selectedCluster, chartData]);

  return (
    <div>
      <div
        css={`
          display: flex;
          align-items: center;
          padding-top: 20px;
          padding-left: 30px;
          padding-right: 30px;
          justify-content: space-between;
          width: ${width}px;
        `}
      >
        <div
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <div>Cluster:</div>
          <SelectExt css={'width: 150px; margin-left: 10px;'} value={optionsTimeseriesData?.find((v1) => v1.value === selectedCluster)} options={optionsTimeseriesData} onChange={onChangeCluster} />
        </div>
        <div
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <div>CHART TYPE: Sample</div>
          <Switch
            css={'margin-left: 10px;'}
            checked={isMean}
            onChange={(v1) => {
              setIsMean(v1);
            }}
          />
          <div css={'margin-left: 10px;'}>Mean</div>
        </div>
      </div>
      <RefreshAndProgress isRelative={true} isRefreshing={!chartData} style={{ width: width }}>
        <div id="timeseriesChartDataDiv" style={{ width: '100%', height: '400px', background: '#19232F' }}></div>
      </RefreshAndProgress>
    </div>
  );
};

export default React.memo(TimeseriesChart);
