import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import eda from '../../stores/reducers/eda';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import NanoScroller from '../NanoScroller/NanoScroller';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import ChartOutliers from '../ChartOutliers/ChartOutliers';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_light from '@amcharts/amcharts4/themes/moonrisekingdom';
import am4themes_dark from '@amcharts/amcharts4/themes/dark';
import HelpIcon from '../HelpIcon/HelpIcon';

const s = require('./EDATimeseries.module.css');
const sd = require('../antdUseDark.module.css');

interface IEDATimeseriesProps {}

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

const Months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

am4charts.ValueAxis.prototype.getSeriesDataItem = function (series, position) {
  var key = this.axisFieldName + this.axisLetter;
  var value = this.positionToValue(position);
  return series.dataItems.getIndex(
    series.dataItems.findClosestIndex(
      value,
      function (x) {
        return x[key];
      },
      'any',
    ),
  );
};

const EDATimeseries = React.memo((props: PropsWithChildren<IEDATimeseriesProps>) => {
  const { paramsProp, edaParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    edaParam: state.eda,
  }));

  const [edaVersion, setEdaVersion] = useState(null);
  const [edaId, setEdaId] = useState(null);
  const [salesAcrossTimeData, setSalesAcrossTimeData] = useState(null);
  const [cummulativeContributionData, setCummulativeContributionData] = useState(null);
  const [productMaturityData, setProductMaturityData] = useState(null);
  const [missingValueDistributionData, setMissingValueDistributionData] = useState(null);
  const [historyLengthData, setHistoryLengthData] = useState(null);
  const [numRowsHistogramData, setNumRowsHistogramData] = useState(null);
  const [primaryKeysData, setPrimaryKeysData] = useState(null);
  const [optionsColumnsData, setOptionsColumnsData] = useState(null);
  const [itemForecatingData, setItemForecastingData] = useState(null);
  const [autocorrelationData, setAutocorrelationData] = useState(null);
  const [partialAutocorrelationData, setPartialAutocorrelationData] = useState(null);
  const [seasonalityData, setSeasonalityData] = useState(null);
  const [seasonalityYearData, setSeasonalityYearData] = useState(null);
  const [seasonalityMonthData, setSeasonalityMonthData] = useState(null);
  const [seasonalityWeekOfYearData, setSeasonalityWeekOfYearData] = useState(null);
  const [seasonalityDayOfYearData, setSeasonalityDayOfYearData] = useState(null);
  const [seasonalityDayOfMonthData, setSeasonalityDayOfMonthData] = useState(null);
  const [seasonalityDayOfWeekData, setSeasonalityDayOfWeekData] = useState(null);
  const [seasonalityQuarterData, setSeasonalityQuarterData] = useState(null);
  const [seasonalityHourData, setSeasonalityHourData] = useState(null);
  const [seasonalityMinuteData, setSeasonalityMinuteData] = useState(null);
  const [seasonalitySecondData, setSeasonalitySecondData] = useState(null);

  const [salesAcrossTimeValue, setSalesAcrossTimeValue] = useState(null);
  const [productMaturityValue, setProductMaturityValue] = useState(null);
  const [seasonalityValue, setSeasonalityValue] = useState(null);
  const [seasonalityChartValue, setSeasonalityChartValue] = useState(null);

  const salesAcrossTimeChart = React.useRef(null);
  const productMaturityChart = React.useRef(null);
  const autocorrelationChart = React.useRef(null);
  const partialAutocorrelationChart = React.useRef(null);
  const seasonalityChart = React.useRef(null);
  const itemForecatingChart = React.useRef(null);

  const projectId = paramsProp?.get('projectId');
  const edaIdUsed = paramsProp?.get('edaId');

  useEffect(() => {
    am4core.options.commercialLicense = true;
    am4core.unuseAllThemes();
    am4core.useTheme(Utils.isDark() ? am4themes_dark : am4themes_light);
  }, []);

  React.useLayoutEffect(() => {
    if (!salesAcrossTimeData) return;

    let chart = am4core.create('salesAcrossTimeChartDiv', am4charts.XYChart);

    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());

    dateAxis.baseInterval = {
      timeUnit: 'minute',
      count: 1,
    };
    dateAxis.tooltipDateFormat = 'HH:mm, d MMMM';
    dateAxis.dateFormatter.utc = true;
    dateAxis.title.text = salesAcrossTimeData.xAxis || '';

    dateAxis.showOnInit = false;
    dateAxis.keepSelection = true;

    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    valueAxis.tooltip.disabled = true;
    valueAxis.title.text = salesAcrossTimeData.yAxis || '';

    valueAxis.showOnInit = false;
    valueAxis.min = 0;
    valueAxis.strictMinMax = true;

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    chart.scrollbarX = new am4charts.XYChartScrollbar();

    salesAcrossTimeData.dataColumns?.forEach((column, index) => {
      if (column === salesAcrossTimeData.xAxis) {
        return;
      }

      if (
        (salesAcrossTimeValue === 'mean' && column !== 'mean') ||
        (salesAcrossTimeValue === 'distribution' && column !== 'p10' && column !== 'p90' && column !== 'median') ||
        (salesAcrossTimeValue === 'sum' && column !== 'sum') ||
        (salesAcrossTimeValue === 'count' && column !== 'count')
      ) {
        return;
      }

      let series = chart.series.push(new am4charts.LineSeries());

      series.showOnInit = false;
      if (salesAcrossTimeValue === 'distribution') {
        if (column === 'p10') {
          series.name = `10th percentile`;
        } else if (column === 'median') {
          series.name = `Median`;
        } else if (column === 'p90') {
          series.name = `90th percentile`;
        }
      } else if (salesAcrossTimeValue === 'mean') {
        series.name = `Mean`;
      } else if (salesAcrossTimeValue === 'sum') {
        series.name = `Total Volume`;
      } else if (salesAcrossTimeValue === 'count') {
        series.name = `Total Items`;
      } else {
        series.name = column;
      }

      series.dataFields.dateX = salesAcrossTimeData.xAxis;
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

    if (salesAcrossTimeValue === 'distribution') {
      let seriesPP = chart.series.push(new am4charts.LineSeries());

      seriesPP.dataFields.valueY = 'p90';
      seriesPP.dataFields.openValueY = 'p10';

      seriesPP.name = null;
      seriesPP.hiddenInLegend = true;
      seriesPP.dataFields.dateX = salesAcrossTimeData.xAxis;

      seriesPP.fillOpacity = 0.2;

      seriesPP.strokeWidth = 0;
    }

    chart.legend = new am4charts.Legend();

    chart.data = salesAcrossTimeData.chartData;

    chart.events.on('ready', function () {
      // @ts-ignore
      chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
      // @ts-ignore
      chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;
    });

    chart.events.on('datavalidated', function () {
      const chartDataLen = salesAcrossTimeData.chartData?.length;
      if (chartDataLen === 0) {
        return;
      }
      let zoomStart = salesAcrossTimeData.chartData?.[0]?.[salesAcrossTimeData.xAxis];
      let zoomEnd = salesAcrossTimeData.chartData?.[chartDataLen - 1]?.[salesAcrossTimeData.xAxis];
      if (chartDataLen > 30) {
        zoomStart = salesAcrossTimeData.chartData?.[chartDataLen - 30]?.[salesAcrossTimeData.xAxis];
      }

      dateAxis.zoomToDates(zoomStart, zoomEnd, false, true);
    });

    salesAcrossTimeChart.current = chart;

    return () => {
      chart.dispose();
    };
  }, [salesAcrossTimeData, salesAcrossTimeValue]);

  React.useLayoutEffect(() => {
    if (!productMaturityData) return;

    let chart = am4core.create('productMaturityChartDiv', am4charts.XYChart);

    let xValueAxis = chart.xAxes.push(new am4charts.ValueAxis());

    xValueAxis.title.text = productMaturityData.xAxis || '';

    xValueAxis.showOnInit = false;
    xValueAxis.min = productMaturityData.chartData?.[0]?.[productMaturityData.xAxis] ?? 0;
    xValueAxis.strictMinMax = true;
    xValueAxis.keepSelection = true;

    let yValueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    yValueAxis.tooltip.disabled = true;
    yValueAxis.title.text = productMaturityData.yAxis || '';

    yValueAxis.showOnInit = false;
    yValueAxis.min = 0;
    yValueAxis.strictMinMax = true;

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    chart.scrollbarX = new am4charts.XYChartScrollbar();

    productMaturityData.dataColumns?.forEach((column, index) => {
      if (column === productMaturityData.xAxis) {
        return;
      }

      if (
        (productMaturityValue === 'mean' && column !== 'mean') ||
        (productMaturityValue === 'distribution' && column !== 'p10' && column !== 'p90' && column !== 'median') ||
        (productMaturityValue === 'sum' && column !== 'sum') ||
        (productMaturityValue === 'count' && column !== 'count')
      ) {
        return;
      }

      let series = chart.series.push(new am4charts.LineSeries());

      series.showOnInit = false;
      if (productMaturityValue === 'distribution') {
        if (column === 'p10') {
          series.name = `10th percentile`;
        } else if (column === 'median') {
          series.name = `Median`;
        } else if (column === 'p90') {
          series.name = `90th percentile`;
        }
      } else if (productMaturityValue === 'mean') {
        series.name = `Mean`;
      } else if (productMaturityValue === 'sum') {
        series.name = `Total Volume`;
      } else if (productMaturityValue === 'count') {
        series.name = `Total Items`;
      } else {
        series.name = column;
      }

      series.dataFields.valueX = productMaturityData.xAxis;
      series.dataFields.valueY = column;
      series.fillOpacity = 0;

      series.tooltip.numberFormatter = new am4core.NumberFormatter();
      series.tooltip.numberFormatter.numberFormat = '#.00';
      series.tooltipText = '{name}: {valueY}';

      index += 4;
      const colorIndex = index > colorSet.length - 1 ? index % colorSet.length : index;
      const c1 = am4core.color(colorSet[colorIndex]);
      series.stroke = c1;
      series.fill = c1;
      series.strokeWidth = 2;

      // @ts-ignore
      chart.scrollbarX.series.push(series);
    });

    if (productMaturityValue === 'distribution') {
      let seriesPP = chart.series.push(new am4charts.LineSeries());

      seriesPP.dataFields.valueY = 'p90';
      seriesPP.dataFields.openValueY = 'p10';

      seriesPP.name = null;
      seriesPP.hiddenInLegend = true;
      seriesPP.dataFields.valueX = productMaturityData.xAxis;

      seriesPP.fillOpacity = 0.2;

      seriesPP.strokeWidth = 0;
    }

    chart.legend = new am4charts.Legend();

    chart.data = productMaturityData.chartData;

    chart.events.on('ready', function () {
      // @ts-ignore
      chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
      // @ts-ignore
      chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;
    });

    chart.events.on('datavalidated', function () {
      const chartDataLen = productMaturityData.chartData?.length;
      if (chartDataLen === 0) {
        return;
      }
      let zoomStart = productMaturityData.chartData?.[0]?.[productMaturityData.xAxis];
      let zoomEnd = productMaturityData.chartData?.[chartDataLen - 1]?.[productMaturityData.xAxis];
      if (chartDataLen > 30) {
        zoomStart = productMaturityData.chartData?.[chartDataLen - 30]?.[productMaturityData.xAxis];
      }

      xValueAxis.zoomToValues(zoomStart, zoomEnd, false, true);
    });

    productMaturityChart.current = chart;

    return () => {
      chart.dispose();
    };
  }, [productMaturityData, productMaturityValue]);

  React.useLayoutEffect(() => {
    if (!autocorrelationData) return;

    let chart = am4core.create('autocorrelationChartDiv', am4charts.XYChart);

    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());

    categoryAxis.showOnInit = false;
    categoryAxis.title.text = autocorrelationData.xAxis || '';
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.dataFields.category = autocorrelationData.xAxis;
    categoryAxis.renderer.minGridDistance = 15;
    categoryAxis.renderer.grid.template.location = 0.5;
    categoryAxis.renderer.grid.template.strokeDasharray = '1,3';
    categoryAxis.renderer.labels.template.horizontalCenter = 'left';
    categoryAxis.renderer.labels.template.location = 0.5;
    categoryAxis.minX = autocorrelationData.chartData?.[0]?.[autocorrelationData.xAxis] ?? 0;

    categoryAxis.renderer.labels.template.adapter.add('dx', function (dx, target) {
      return -target.maxRight / 2;
    });

    let yValueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    yValueAxis.tooltip.disabled = true;
    yValueAxis.title.text = autocorrelationData.yAxis || '';

    yValueAxis.showOnInit = false;

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    chart.scrollbarX = new am4charts.XYChartScrollbar();

    let series = chart.series.push(new am4charts.ColumnSeries());

    series.showOnInit = false;

    series.dataFields.categoryX = autocorrelationData.xAxis;
    series.dataFields.valueY = autocorrelationData.yAxis;
    series.sequencedInterpolation = true;
    series.fillOpacity = 0;
    series.columns.template.width = 0.01;
    series.tooltip.pointerOrientation = 'horizontal';

    series.tooltip.numberFormatter = new am4core.NumberFormatter();
    series.tooltip.numberFormatter.numberFormat = '#.00';
    series.tooltipText = '{valueY.value}';

    const c1 = am4core.color(colorSet[3]);
    series.stroke = c1;
    series.fill = c1;
    series.strokeWidth = 2;

    var bullet = series.bullets.create(am4charts.CircleBullet);

    // @ts-ignore
    chart.scrollbarX.series.push(series);

    chart.data = autocorrelationData.chartData;

    chart.events.on('ready', function () {
      // @ts-ignore
      chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
      // @ts-ignore
      chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;
    });

    chart.events.on('datavalidated', function () {
      const chartDataLen = autocorrelationData.chartData?.length;
      if (chartDataLen === 0) {
        return;
      }
      let zoomStart = autocorrelationData.chartData?.[0]?.[autocorrelationData.xAxis];
      let zoomEnd = autocorrelationData.chartData?.[chartDataLen - 1]?.[autocorrelationData.xAxis];
      if (chartDataLen > 30) {
        zoomEnd = autocorrelationData.chartData?.[29]?.[autocorrelationData.xAxis];
      }

      categoryAxis.zoomToCategories(zoomStart, zoomEnd);
    });

    autocorrelationChart.current = chart;

    return () => {
      chart.dispose();
    };
  }, [autocorrelationData]);

  React.useLayoutEffect(() => {
    if (!partialAutocorrelationData) return;

    let chart = am4core.create('partialAutocorrelationChartDiv', am4charts.XYChart);

    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());

    categoryAxis.showOnInit = false;
    categoryAxis.title.text = partialAutocorrelationData.xAxis || '';
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.dataFields.category = partialAutocorrelationData.xAxis;
    categoryAxis.renderer.minGridDistance = 15;
    categoryAxis.renderer.grid.template.location = 0.5;
    categoryAxis.renderer.grid.template.strokeDasharray = '1,3';
    categoryAxis.renderer.labels.template.horizontalCenter = 'left';
    categoryAxis.renderer.labels.template.location = 0.5;
    categoryAxis.minX = partialAutocorrelationData.chartData?.[0]?.[partialAutocorrelationData.xAxis] ?? 0;

    categoryAxis.renderer.labels.template.adapter.add('dx', function (dx, target) {
      return -target.maxRight / 2;
    });

    let yValueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    yValueAxis.tooltip.disabled = true;
    yValueAxis.title.text = partialAutocorrelationData.yAxis || '';

    yValueAxis.showOnInit = false;

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    chart.scrollbarX = new am4charts.XYChartScrollbar();

    let series = chart.series.push(new am4charts.ColumnSeries());

    series.showOnInit = false;

    series.dataFields.categoryX = partialAutocorrelationData.xAxis;
    series.dataFields.valueY = partialAutocorrelationData.yAxis;
    series.sequencedInterpolation = true;
    series.fillOpacity = 0;
    series.columns.template.width = 0.01;
    series.tooltip.pointerOrientation = 'horizontal';

    series.tooltip.numberFormatter = new am4core.NumberFormatter();
    series.tooltip.numberFormatter.numberFormat = '#.00';
    series.tooltipText = '{valueY.value}';

    const c1 = am4core.color(colorSet[6]);
    series.stroke = c1;
    series.fill = c1;
    series.strokeWidth = 2;

    var bullet = series.bullets.create(am4charts.CircleBullet);

    // @ts-ignore
    chart.scrollbarX.series.push(series);

    chart.data = partialAutocorrelationData.chartData;

    chart.events.on('ready', function () {
      // @ts-ignore
      chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
      // @ts-ignore
      chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;
    });

    chart.events.on('datavalidated', function () {
      const chartDataLen = partialAutocorrelationData.chartData?.length;
      if (chartDataLen === 0) {
        return;
      }
      let zoomStart = partialAutocorrelationData.chartData?.[0]?.[partialAutocorrelationData.xAxis];
      let zoomEnd = partialAutocorrelationData.chartData?.[chartDataLen - 1]?.[partialAutocorrelationData.xAxis];
      if (chartDataLen > 30) {
        zoomEnd = partialAutocorrelationData.chartData?.[29]?.[partialAutocorrelationData.xAxis];
      }

      categoryAxis.zoomToCategories(zoomStart, zoomEnd);
    });

    partialAutocorrelationChart.current = chart;

    return () => {
      chart.dispose();
    };
  }, [partialAutocorrelationData]);

  const optionsSeasonality = useMemo(() => {
    const options = [];
    if (seasonalityYearData) {
      options.push({ label: 'Year', value: 'year' });
    }
    if (seasonalityMonthData) {
      options.push({ label: 'Month', value: 'month' });
    }
    if (seasonalityWeekOfYearData) {
      options.push({ label: 'Week of Year', value: 'week_of_year' });
    }
    if (seasonalityDayOfYearData) {
      options.push({ label: 'Day of Year', value: 'day_of_year' });
    }
    if (seasonalityDayOfMonthData) {
      options.push({ label: 'Day of Month', value: 'day_of_month' });
    }
    if (seasonalityDayOfWeekData) {
      options.push({ label: 'Day of Week', value: 'day_of_week' });
    }
    if (seasonalityQuarterData) {
      options.push({ label: 'Quarter', value: 'quarter' });
    }
    if (seasonalityHourData) {
      options.push({ label: 'Hour', value: 'hour' });
    }
    if (seasonalityMinuteData) {
      options.push({ label: 'Minute', value: 'minute' });
    }
    if (seasonalitySecondData) {
      options.push({ label: 'Second', value: 'second' });
    }

    if (options.length > 0) {
      setSeasonalityValue(options[0].value);
    }

    return options;
  }, [
    seasonalityYearData,
    seasonalityMonthData,
    seasonalityWeekOfYearData,
    seasonalityDayOfYearData,
    seasonalityDayOfMonthData,
    seasonalityDayOfWeekData,
    seasonalityQuarterData,
    seasonalityHourData,
    seasonalityMinuteData,
    seasonalitySecondData,
  ]);

  React.useLayoutEffect(() => {
    if (!seasonalityData) return;

    let chart = am4core.create('seasonalityChartDiv', am4charts.XYChart);

    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());

    categoryAxis.title.text = seasonalityData.xAxis || '';

    categoryAxis.showOnInit = false;
    categoryAxis.dataFields.category = seasonalityData.xAxis;
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.numberFormatter.numberFormat = '####';
    categoryAxis.renderer.minGridDistance = 15;
    categoryAxis.startLocation = 0.5;
    categoryAxis.endLocation = 0.5;

    let yValueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    yValueAxis.tooltip.disabled = true;
    yValueAxis.title.text = seasonalityData.yAxis || '';

    yValueAxis.showOnInit = false;
    yValueAxis.min = 0;
    yValueAxis.strictMinMax = true;

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    chart.scrollbarX = new am4charts.XYChartScrollbar();

    seasonalityData.dataColumns?.forEach((column, index) => {
      if (column === seasonalityData.xAxis) {
        return;
      }

      if (
        (seasonalityChartValue === 'mean' && column !== 'mean') ||
        (seasonalityChartValue === 'distribution' && column !== 'p10' && column !== 'p90' && column !== 'median') ||
        (seasonalityChartValue === 'sum' && column !== 'sum') ||
        (seasonalityChartValue === 'count' && column !== 'count')
      ) {
        return;
      }

      let series = chart.series.push(new am4charts.LineSeries());

      series.showOnInit = false;
      if (seasonalityChartValue === 'distribution') {
        if (column === 'p10') {
          series.name = `10th percentile`;
        } else if (column === 'median') {
          series.name = `Median`;
        } else if (column === 'p90') {
          series.name = `90th percentile`;
        }
      } else if (seasonalityChartValue === 'mean') {
        series.name = `Mean`;
      } else if (seasonalityChartValue === 'sum') {
        series.name = `Total Volume`;
      } else if (seasonalityChartValue === 'count') {
        series.name = `Total Items`;
      } else {
        series.name = column;
      }

      series.dataFields.categoryX = seasonalityData.xAxis;
      series.dataFields.valueY = column;
      series.fillOpacity = 0;
      series.xAxis = categoryAxis;

      series.tooltip.numberFormatter = new am4core.NumberFormatter();
      series.tooltip.numberFormatter.numberFormat = '#.00';
      series.tooltipText = '{name}: {valueY}';

      const seasonalityIndex = optionsSeasonality.findIndex((item) => item.value === seasonalityValue);
      if (seasonalityIndex >= 0) {
        index += seasonalityIndex;
      }
      const colorIndex = index > colorSet.length - 1 ? index % colorSet.length : index;
      const c1 = am4core.color(colorSet[colorIndex]);
      series.stroke = c1;
      series.fill = c1;
      series.strokeWidth = 2;

      // @ts-ignore
      chart.scrollbarX.series.push(series);
    });

    if (seasonalityChartValue === 'distribution') {
      let seriesPP = chart.series.push(new am4charts.LineSeries());

      seriesPP.dataFields.valueY = 'p90';
      seriesPP.dataFields.openValueY = 'p10';

      seriesPP.name = null;
      seriesPP.hiddenInLegend = true;
      seriesPP.dataFields.categoryX = seasonalityData.xAxis;

      seriesPP.fillOpacity = 0.2;

      seriesPP.strokeWidth = 0;
    }

    chart.legend = new am4charts.Legend();

    chart.data = seasonalityData.chartData;

    chart.events.on('ready', function () {
      // @ts-ignore
      chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
      // @ts-ignore
      chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;
    });

    chart.events.on('datavalidated', function () {
      const chartDataLen = seasonalityData.chartData?.length;
      if (chartDataLen === 0) {
        return;
      }
      let zoomStart = seasonalityData.chartData?.[0]?.[seasonalityData.xAxis];
      let zoomEnd = seasonalityData.chartData?.[chartDataLen - 1]?.[seasonalityData.xAxis];
      if (chartDataLen > 30) {
        zoomStart = seasonalityData.chartData?.[chartDataLen - 30]?.[seasonalityData.xAxis];
      }

      categoryAxis.zoomToCategories(zoomStart, zoomEnd);
    });

    seasonalityChart.current = chart;

    return () => {
      chart.dispose();
    };
  }, [seasonalityData, seasonalityChartValue, optionsSeasonality, seasonalityValue]);

  React.useLayoutEffect(() => {
    if (!itemForecatingData) return;

    let chart = am4core.create('itemForecatingChartDiv', am4charts.XYChart);

    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());

    dateAxis.baseInterval = {
      timeUnit: 'minute',
      count: 1,
    };
    dateAxis.tooltipDateFormat = 'HH:mm, d MMMM';
    dateAxis.dateFormatter.utc = true;
    dateAxis.title.text = itemForecatingData.xAxis || '';

    dateAxis.showOnInit = false;
    dateAxis.keepSelection = true;

    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    valueAxis.tooltip.disabled = true;
    valueAxis.title.text = itemForecatingData.yAxis || '';

    valueAxis.showOnInit = false;
    valueAxis.min = 0;
    valueAxis.strictMinMax = true;

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    chart.scrollbarX = new am4charts.XYChartScrollbar();

    itemForecatingData.dataColumns?.forEach((column, index) => {
      if (column === itemForecatingData.xAxis || column !== 'sum') {
        return;
      }

      let series = chart.series.push(new am4charts.LineSeries());

      series.showOnInit = false;
      if (column === 'p10') {
        series.name = `10th percentile`;
      } else if (column === 'median') {
        series.name = `Median`;
      } else if (column === 'p90') {
        series.name = `90th percentile`;
      } else if (column === 'mean') {
        series.name = `Mean`;
      } else if (column === 'sum') {
        series.name = `Total Volume`;
      } else if (column === 'count') {
        series.name = `Total Items`;
      } else {
        series.name = column;
      }

      series.dataFields.dateX = itemForecatingData.xAxis;
      series.dataFields.valueY = column;
      series.fillOpacity = 0;

      series.tooltip.numberFormatter = new am4core.NumberFormatter();
      series.tooltip.numberFormatter.numberFormat = '#.00';
      series.tooltipText = '{name}: {valueY}';

      index += 9;
      const colorIndex = index > colorSet.length - 1 ? index % colorSet.length : index;
      const c1 = am4core.color(colorSet[colorIndex]);
      series.stroke = c1;
      series.fill = c1;
      series.strokeWidth = 2;

      // @ts-ignore
      chart.scrollbarX.series.push(series);
    });

    let seriesPP = chart.series.push(new am4charts.LineSeries());

    seriesPP.dataFields.valueY = 'p90';
    seriesPP.dataFields.openValueY = 'p10';

    seriesPP.name = null;
    seriesPP.hiddenInLegend = true;
    seriesPP.dataFields.dateX = itemForecatingData.xAxis;

    seriesPP.fillOpacity = 0.2;

    seriesPP.strokeWidth = 0;

    chart.legend = new am4charts.Legend();

    chart.data = itemForecatingData.chartData;

    chart.events.on('ready', function () {
      // @ts-ignore
      chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
      // @ts-ignore
      chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;
    });

    chart.events.on('datavalidated', function () {
      const chartDataLen = itemForecatingData.chartData?.length;
      if (chartDataLen === 0) {
        return;
      }
      let zoomStart = itemForecatingData.chartData?.[0]?.[itemForecatingData.xAxis];
      let zoomEnd = itemForecatingData.chartData?.[chartDataLen - 1]?.[itemForecatingData.xAxis];
      if (chartDataLen > 30) {
        zoomStart = itemForecatingData.chartData?.[chartDataLen - 30]?.[itemForecatingData.xAxis];
      }

      dateAxis.zoomToDates(zoomStart, zoomEnd, false, true);
    });

    itemForecatingChart.current = chart;

    return () => {
      chart.dispose();
    };
  }, [itemForecatingData]);

  useEffect(() => {
    setEdaVersion(null);
  }, [edaId]);

  useEffect(() => {
    setEdaId(edaIdUsed);
  }, [edaIdUsed]);

  useEffect(() => {
    eda.memEdaById(true, edaId);
  }, [edaId, edaParam]);

  const edaOne = useMemo(() => {
    return eda.memEdaById(false, edaId);
  }, [edaId, edaParam]);

  useEffect(() => {
    setEdaVersion((v1) => {
      if (v1 == null) {
        v1 = edaOne?.latestEdaVersion?.edaVersion;
      }
      return v1;
    });
  }, [edaOne]);

  useEffect(() => {
    eda.memEdaDataConsistencyByEdaVersion(true, edaVersion);
  }, [edaVersion, edaParam]);

  useEffect(() => {
    eda.memEdasByProjectId(true, projectId);
  }, [projectId, edaParam]);

  const edaList = useMemo(() => {
    return eda.memEdasByProjectId(false, projectId);
  }, [projectId, edaParam]);

  useEffect(() => {
    eda.memEdaVersionsById(true, edaId);
  }, [edaId, edaParam]);

  useEffect(() => {
    if (edaVersion && primaryKeysData?.length > 0) {
      setOptionsColumnsData(null);

      REClient_.client_()._getEdaForecastingItemIds(edaVersion, primaryKeysData, (err, res) => {
        if (!err && res && res?.success) {
          const itemValues = res?.result?.itemValues;

          if (itemValues) {
            const optionsColumns = new Map();
            itemValues.forEach((item) => {
              optionsColumns.set(item?.columnName, {});
              const values = item?.values;
              values?.sort();
              if (item?.values?.length > 0) {
                optionsColumns.get(item?.columnName).value = values?.[0];
              }
              optionsColumns.get(item?.columnName).options = values?.map((value) => ({ label: value, value: value }));
            });
            setOptionsColumnsData(optionsColumns);
          }
        }
      });
    }
  }, [edaVersion, primaryKeysData]);

  React.useEffect(() => {
    if (!edaVersion) {
      return;
    }

    const primaryKeyMapping = {};
    primaryKeysData?.forEach((item) => {
      if (optionsColumnsData?.get(item)?.['value']) {
        primaryKeyMapping[item] = optionsColumnsData?.get(item)?.['value'];
      }
    });

    if (Object.entries(primaryKeyMapping)?.length === 0) {
      return;
    }

    setItemForecastingData(null);

    REClient_.client_()._getEdaItemLevelForecastingAnalysis(edaVersion, primaryKeyMapping, (err, res) => {
      if (!err && res && res?.success) {
        const resultData = res?.result;

        if (resultData) {
          const dataColumns = resultData.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(resultData.xAxis);
          const sortedData = resultData.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setItemForecastingData({
            xAxis: resultData.xAxis,
            yAxis: resultData.yAxis,
            dataColumns,
            chartData,
            itemStatistics: resultData.itemStatistics,
            chartName: resultData.chartName,
            chartTypes: resultData.chartTypes,
            chartDescriptions: resultData.chartDescriptions,
          });
        }
      }
    });
  }, [edaVersion, optionsColumnsData]);

  React.useEffect(() => {
    if (!edaVersion) {
      return;
    }

    setSalesAcrossTimeData(null);
    setCummulativeContributionData(null);
    setProductMaturityData(null);
    setMissingValueDistributionData(null);
    setHistoryLengthData(null);
    setNumRowsHistogramData(null);
    setAutocorrelationData(null);
    setPartialAutocorrelationData(null);
    setSeasonalityYearData(null);
    setSeasonalityMonthData(null);
    setSeasonalityWeekOfYearData(null);
    setSeasonalityDayOfYearData(null);
    setSeasonalityDayOfMonthData(null);
    setSeasonalityDayOfWeekData(null);
    setSeasonalityQuarterData(null);
    setSeasonalityHourData(null);
    setSeasonalityMinuteData(null);
    setSeasonalitySecondData(null);

    REClient_.client_().getEdaForecastingAnalysis(edaVersion, (err, res) => {
      if (!err && res && res?.success && res?.result) {
        const salesAcrossTime = res?.result?.salesAcrossTime;
        const cummulativeContribution = res?.result?.cummulativeContribution;
        const productMaturity = res?.result?.productMaturity;
        const missingValueDistribution = res?.result?.missingValueDistribution;
        const historyLength = res?.result?.historyLength;
        const numRowsHistogram = res?.result?.numRowsHistogram;
        const primaryKeys = res?.result?.primaryKeys;
        const seasonalityYear = res?.result?.seasonalityYear;
        const seasonalityMonth = res?.result?.seasonalityMonth;
        const seasonalityWeekOfYear = res?.result?.seasonalityWeekOfYear;
        const seasonalityDayOfYear = res?.result?.seasonalityDayOfYear;
        const seasonalityDayOfMonth = res?.result?.seasonalityDayOfMonth;
        const seasonalityDayOfWeek = res?.result?.seasonalityDayOfWeek;
        const seasonalityQuarter = res?.result?.seasonalityQuarter;
        const seasonalityHour = res?.result?.seasonalityHour;
        const seasonalityMinute = res?.result?.seasonalityMinute;
        const seasonalitySecond = res?.result?.seasonalitySecond;
        const autocorrelation = res?.result?.autocorrelation;
        const partialAutocorrelation = res?.result?.partialAutocorrelation;

        if (primaryKeys) {
          setPrimaryKeysData(primaryKeys);
        }

        if (salesAcrossTime) {
          const dataColumns = salesAcrossTime.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(salesAcrossTime.xAxis);
          const sortedData = salesAcrossTime.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSalesAcrossTimeData({
            xAxis: salesAcrossTime.xAxis,
            yAxis: salesAcrossTime.yAxis,
            dataColumns,
            chartData,
            chartName: salesAcrossTime.chartName,
            chartTypes: salesAcrossTime.chartTypes,
            chartDescriptions: salesAcrossTime.chartDescriptions,
          });
        }

        if (autocorrelation) {
          const dataColumns = autocorrelation.dataColumns;

          const chartData = autocorrelation.data?.map((item, index) => {
            const dataItem = {};
            dataItem[autocorrelation.xAxis] = index;
            dataItem[autocorrelation.yAxis] = item;

            return dataItem;
          });

          setAutocorrelationData({
            xAxis: autocorrelation.xAxis,
            yAxis: autocorrelation.yAxis,
            dataColumns,
            chartData,
            chartName: autocorrelation.chartName,
            chartTypes: autocorrelation.chartTypes,
            chartDescriptions: autocorrelation.chartDescriptions,
          });
        }

        if (partialAutocorrelation) {
          const dataColumns = partialAutocorrelation.dataColumns;

          const chartData = partialAutocorrelation.data?.map((item, index) => {
            const dataItem = {};
            dataItem[partialAutocorrelation.xAxis] = index;
            dataItem[partialAutocorrelation.yAxis] = item;

            return dataItem;
          });

          setPartialAutocorrelationData({
            xAxis: partialAutocorrelation.xAxis,
            yAxis: partialAutocorrelation.yAxis,
            dataColumns,
            chartData,
            chartName: partialAutocorrelation.chartName,
            chartTypes: partialAutocorrelation.chartTypes,
            chartDescriptions: partialAutocorrelation.chartDescriptions,
          });
        }

        if (seasonalityYear) {
          const dataColumns = seasonalityYear.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityYear.xAxis);
          const sortedData = seasonalityYear.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSeasonalityYearData({
            xAxis: seasonalityYear.xAxis,
            yAxis: seasonalityYear.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityYear.chartName,
            chartTypes: seasonalityYear.chartTypes,
            chartDescriptions: seasonalityYear.chartDescriptions,
          });
        }

        if (seasonalityMonth) {
          const dataColumns = seasonalityMonth.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityMonth.xAxis);
          const sortedData = seasonalityMonth.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              if (column === seasonalityMonth.xAxis) {
                dataItem[column] = Months[item[index] - 1] ?? item[index];
              } else {
                dataItem[column] = item[index];
              }
            });

            return dataItem;
          });

          setSeasonalityMonthData({
            xAxis: seasonalityMonth.xAxis,
            yAxis: seasonalityMonth.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityMonth.chartName,
            chartTypes: seasonalityMonth.chartTypes,
            chartDescriptions: seasonalityMonth.chartDescriptions,
          });
        }

        if (seasonalityWeekOfYear) {
          const dataColumns = seasonalityWeekOfYear.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityWeekOfYear.xAxis);
          const sortedData = seasonalityWeekOfYear.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSeasonalityWeekOfYearData({
            xAxis: seasonalityWeekOfYear.xAxis,
            yAxis: seasonalityWeekOfYear.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityWeekOfYear.chartName,
            chartTypes: seasonalityWeekOfYear.chartTypes,
            chartDescriptions: seasonalityWeekOfYear.chartDescriptions,
          });
        }

        if (seasonalityDayOfYear) {
          const dataColumns = seasonalityDayOfYear.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityDayOfYear.xAxis);
          const sortedData = seasonalityDayOfYear.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSeasonalityDayOfYearData({
            xAxis: seasonalityDayOfYear.xAxis,
            yAxis: seasonalityDayOfYear.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityDayOfYear.chartName,
            chartTypes: seasonalityDayOfYear.chartTypes,
            chartDescriptions: seasonalityDayOfYear.chartDescriptions,
          });
        }

        if (seasonalityDayOfMonth) {
          const dataColumns = seasonalityDayOfMonth.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityDayOfMonth.xAxis);
          const sortedData = seasonalityDayOfMonth.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSeasonalityDayOfMonthData({
            xAxis: seasonalityDayOfMonth.xAxis,
            yAxis: seasonalityDayOfMonth.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityDayOfMonth.chartName,
            chartTypes: seasonalityDayOfMonth.chartTypes,
            chartDescriptions: seasonalityDayOfMonth.chartDescriptions,
          });
        }

        if (seasonalityDayOfWeek) {
          const dataColumns = seasonalityDayOfWeek.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityDayOfWeek.xAxis);
          const sortedData = seasonalityDayOfWeek.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              if (column === seasonalityDayOfWeek.xAxis) {
                dataItem[column] = DayOfWeek[item[index] - 1] ?? item[index];
              } else {
                dataItem[column] = item[index];
              }
            });

            return dataItem;
          });

          setSeasonalityDayOfWeekData({
            xAxis: seasonalityDayOfWeek.xAxis,
            yAxis: seasonalityDayOfWeek.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityDayOfWeek.chartName,
            chartTypes: seasonalityDayOfWeek.chartTypes,
            chartDescriptions: seasonalityDayOfWeek.chartDescriptions,
          });
        }

        if (seasonalityQuarter) {
          const dataColumns = seasonalityQuarter.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityQuarter.xAxis);
          const sortedData = seasonalityQuarter.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSeasonalityQuarterData({
            xAxis: seasonalityQuarter.xAxis,
            yAxis: seasonalityQuarter.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityQuarter.chartName,
            chartTypes: seasonalityQuarter.chartTypes,
            chartDescriptions: seasonalityQuarter.chartDescriptions,
          });
        }

        if (seasonalityHour) {
          const dataColumns = seasonalityHour.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityHour.xAxis);
          const sortedData = seasonalityHour.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSeasonalityHourData({
            xAxis: seasonalityHour.xAxis,
            yAxis: seasonalityHour.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityHour.chartName,
            chartTypes: seasonalityHour.chartTypes,
            chartDescriptions: seasonalityHour.chartDescriptions,
          });
        }

        if (seasonalityMinute) {
          const dataColumns = seasonalityMinute.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalityMinute.xAxis);
          const sortedData = seasonalityMinute.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSeasonalityMinuteData({
            xAxis: seasonalityMinute.xAxis,
            yAxis: seasonalityMinute.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalityMinute.chartName,
            chartTypes: seasonalityMinute.chartTypes,
            chartDescriptions: seasonalityMinute.chartDescriptions,
          });
        }

        if (seasonalitySecond) {
          const dataColumns = seasonalitySecond.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(seasonalitySecond.xAxis);
          const sortedData = seasonalitySecond.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setSeasonalitySecondData({
            xAxis: seasonalitySecond.xAxis,
            yAxis: seasonalitySecond.yAxis,
            dataColumns,
            chartData,
            chartName: seasonalitySecond.chartName,
            chartTypes: seasonalitySecond.chartTypes,
            chartDescriptions: seasonalitySecond.chartDescriptions,
          });
        }

        if (productMaturity) {
          const dataColumns = productMaturity.dataColumns?.map((item) => {
            if (item.startsWith('mean ') || item.startsWith('mean_')) return 'mean';
            if (item.startsWith('median ') || item.startsWith('median_')) return 'median';
            if (item.startsWith('10th ') || item.startsWith('p10_')) return 'p10';
            if (item.startsWith('90th ') || item.startsWith('p90_')) return 'p90';
            if (item.startsWith('count ') || item.startsWith('count_')) return 'count';
            if (item.startsWith('sum ') || item.startsWith('sum_')) return 'sum';

            return item;
          });

          const xAxisIndex = dataColumns.indexOf(productMaturity.xAxis);
          const sortedData = productMaturity.data;
          if (xAxisIndex >= 0) {
            sortedData?.sort((a, b) => {
              if (a?.[xAxisIndex] > b?.[xAxisIndex]) return 1;
              if (a?.[xAxisIndex] < b?.[xAxisIndex]) return -1;
              return 0;
            });
          }

          const chartData = sortedData?.map((item) => {
            const dataItem = {};
            dataColumns?.forEach((column, index) => {
              dataItem[column] = item[index];
            });

            return dataItem;
          });

          setProductMaturityData({
            xAxis: productMaturity.xAxis,
            yAxis: productMaturity.yAxis,
            dataColumns,
            chartData,
            chartName: productMaturity.chartName,
            chartTypes: productMaturity.chartTypes,
            chartDescriptions: productMaturity.chartDescriptions,
          });
        }

        if (cummulativeContribution) {
          let xAxisIndex = -1;
          const yIndecies = [];

          cummulativeContribution.dataColumns?.forEach((item, index) => {
            if (cummulativeContribution.xAxis === item) {
              xAxisIndex = index;
            } else if (item.endsWith(cummulativeContribution.yAxis)) {
              yIndecies.push(index);
            }
          });
          const xData = [],
            yData = new Array(yIndecies.length);
          yData.fill([]);

          cummulativeContribution.data?.forEach((dataItem) => {
            dataItem?.forEach((item, index) => {
              if (index === xAxisIndex) {
                xData.push(item * 100);
              } else if (yIndecies.indexOf(index) >= 0) {
                yData[yIndecies.indexOf(index)].push(item * 100);
              }
            });
          });

          setCummulativeContributionData({
            xAxis: cummulativeContribution.xAxis,
            yAxis: cummulativeContribution.yAxis,
            chartData: yData?.map((item, index) => {
              return {
                x: xData,
                y: item,
                mode: 'lines',
                name: yIndecies[index] ? cummulativeContribution.dataColumns?.[yIndecies[index]] : '',
              };
            }),
            legend: { x: 0.4, y: 1.2 },
            chartName: cummulativeContribution.chartName,
            chartTypes: cummulativeContribution.chartTypes,
            chartDescriptions: cummulativeContribution.chartDescriptions,
          });
        }

        if (missingValueDistribution) {
          let xAxisIndex = -1;
          let yAxisIndex = -1;

          missingValueDistribution.dataColumns?.forEach((item, index) => {
            if (missingValueDistribution.xAxis === item) {
              xAxisIndex = index;
            } else if (missingValueDistribution.yAxis === item) {
              yAxisIndex = index;
            }
          });
          const data = missingValueDistribution.data?.map((dataItem) => {
            let xData = null,
              yData = null;
            dataItem?.forEach((item, index) => {
              if (index === xAxisIndex) {
                xData = item;
              } else if (index === yAxisIndex) {
                yData = item;
              }
            });

            return {
              x: xData,
              y: yData,
            };
          });

          setMissingValueDistributionData({
            gridColor: 'rgba(255,255,255,0.3)',
            isBar: true,
            useTitles: true,
            titleX: missingValueDistribution.xAxis,
            titleY: missingValueDistribution.yAxis,
            data,
            chartName: missingValueDistribution.chartName,
            chartTypes: missingValueDistribution.chartTypes,
            chartDescriptions: missingValueDistribution.chartDescriptions,
          });
        }

        if (historyLength) {
          let xAxisIndex = -1;
          let yAxisIndex = -1;

          historyLength.dataColumns?.forEach((item, index) => {
            if (historyLength.xAxis === item) {
              xAxisIndex = index;
            } else if (historyLength.yAxis === item) {
              yAxisIndex = index;
            }
          });
          const data = historyLength.data?.map((dataItem) => {
            let xData = null,
              yData = null;
            dataItem?.forEach((item, index) => {
              if (index === xAxisIndex) {
                xData = item;
              } else if (index === yAxisIndex) {
                yData = item;
              }
            });

            return {
              x: xData,
              y: yData,
            };
          });

          setHistoryLengthData({
            gridColor: 'rgba(255,255,255,0.3)',
            isBar: true,
            useTitles: true,
            titleX: historyLength.xAxis,
            titleY: historyLength.yAxis,
            data,
            chartName: historyLength.chartName,
            chartTypes: historyLength.chartTypes,
            chartDescriptions: historyLength.chartDescriptions,
          });
        }

        if (numRowsHistogram) {
          let xAxisIndex = -1;
          let yAxisIndex = -1;

          numRowsHistogram.dataColumns?.forEach((item, index) => {
            if (numRowsHistogram.xAxis === item) {
              xAxisIndex = index;
            } else if (numRowsHistogram.yAxis === item) {
              yAxisIndex = index;
            }
          });
          const data = numRowsHistogram.data?.map((dataItem) => {
            let xData = null,
              yData = null;
            dataItem?.forEach((item, index) => {
              if (index === xAxisIndex) {
                xData = item;
              } else if (index === yAxisIndex) {
                yData = item;
              }
            });

            return {
              x: xData,
              y: yData,
            };
          });

          setNumRowsHistogramData({
            gridColor: 'rgba(255,255,255,0.3)',
            isBar: true,
            useTitles: true,
            titleX: numRowsHistogram.xAxis,
            titleY: numRowsHistogram.yAxis,
            data,
            chartName: numRowsHistogram.chartName,
            chartTypes: numRowsHistogram.chartTypes,
            chartDescriptions: numRowsHistogram.chartDescriptions,
          });
        }
      }
    });
  }, [edaVersion]);

  const edaVersionList = useMemo(() => {
    return eda.memEdaVersionsById(false, edaId);
  }, [edaId, edaParam]);

  const optionsEDA = useMemo(() => {
    return (edaList ?? []).filter((item) => _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('FORECASTING_ANALYSIS'))?.map((item) => ({ label: item.name, value: item.edaId }));
  }, [edaList]);

  const onChangeDropdownEDASel = (option) => {
    if (option?.value) {
      Location.push('/' + PartsLink.exploratory_data_analysis_timeseries + '/' + projectId + '/' + option?.value);
    }
  };

  const optionsVersion = useMemo(() => {
    return (edaVersionList ?? []).map((item) => ({ label: item.edaVersion, value: item.edaVersion }));
  }, [edaVersionList]);

  const optionsSalesAcrossTime = useMemo(() => {
    let options = [];
    if (salesAcrossTimeData?.chartTypes) {
      options = salesAcrossTimeData?.chartTypes?.map((item) => {
        if (item === 'Total Volume') {
          return { label: item, value: 'sum' };
        } else if (item === 'Total Items') {
          return { label: item, value: 'count' };
        } else {
          return { label: item, value: item.toLowerCase() };
        }
      });
    } else {
      const dataColumns = salesAcrossTimeData?.dataColumns;
      if (dataColumns?.includes('mean')) {
        options.push({ label: `Mean`, value: 'mean' });
      }
      if (dataColumns?.includes('p10') || dataColumns?.includes('median') || dataColumns?.includes('p90')) {
        options.push({ label: `Distribution`, value: 'distribution' });
      }
      if (dataColumns?.includes('sum')) {
        options.push({ label: `Total Volume`, value: 'sum' });
      }
      if (dataColumns?.includes('count')) {
        options.push({ label: `Total Items`, value: 'count' });
      }
    }

    if (options.length > 0) {
      setSalesAcrossTimeValue(options[0].value);
    }

    return options;
  }, [salesAcrossTimeData]);

  const salesAcrossTimeDesc = useMemo(() => {
    if (salesAcrossTimeData?.chartDescriptions && salesAcrossTimeValue) {
      const curOption = optionsSalesAcrossTime?.find((item) => item.value === salesAcrossTimeValue);
      const chartDesc = salesAcrossTimeData?.chartDescriptions?.find((item) => item.chartType === curOption?.label);
      return chartDesc?.description;
    }
    return null;
  }, [salesAcrossTimeData, salesAcrossTimeValue]);

  useEffect(() => {
    if (seasonalityValue === 'year') {
      setSeasonalityData(seasonalityYearData);
    } else if (seasonalityValue === 'month') {
      setSeasonalityData(seasonalityMonthData);
    } else if (seasonalityValue === 'week_of_year') {
      setSeasonalityData(seasonalityWeekOfYearData);
    } else if (seasonalityValue === 'day_of_year') {
      setSeasonalityData(seasonalityDayOfYearData);
    } else if (seasonalityValue === 'day_of_month') {
      setSeasonalityData(seasonalityDayOfMonthData);
    } else if (seasonalityValue === 'day_of_week') {
      setSeasonalityData(seasonalityDayOfWeekData);
    } else if (seasonalityValue === 'quarter') {
      setSeasonalityData(seasonalityQuarterData);
    } else if (seasonalityValue === 'hour') {
      setSeasonalityData(seasonalityHourData);
    } else if (seasonalityValue === 'minute') {
      setSeasonalityData(seasonalityMinuteData);
    } else if (seasonalityValue === 'second') {
      setSeasonalityData(seasonalitySecondData);
    }
  }, [seasonalityValue]);

  const optionsSeasonalityChart = useMemo(() => {
    let options = [];
    if (seasonalityData?.chartTypes) {
      options = seasonalityData?.chartTypes?.map((item) => {
        if (item === 'Total Volume') {
          return { label: item, value: 'sum' };
        } else if (item === 'Total Items') {
          return { label: item, value: 'count' };
        } else {
          return { label: item, value: item.toLowerCase() };
        }
      });
    } else {
      const dataColumns = seasonalityData?.dataColumns;
      if (dataColumns?.includes('mean')) {
        options.push({ label: `Mean`, value: 'mean' });
      }
      if (dataColumns?.includes('p10') || dataColumns?.includes('median') || dataColumns?.includes('p90')) {
        options.push({ label: `Distribution`, value: 'distribution' });
      }
      if (dataColumns?.includes('sum')) {
        options.push({ label: `Total Volume`, value: 'sum' });
      }
      if (dataColumns?.includes('count')) {
        options.push({ label: `Total Items`, value: 'count' });
      }
    }

    if (options.length > 0) {
      setSeasonalityChartValue(options[0].value);
    }

    return options;
  }, [seasonalityData]);

  const seasonalityDesc = useMemo(() => {
    if (seasonalityData?.chartDescriptions && seasonalityChartValue) {
      const curOption = optionsSeasonalityChart?.find((item) => item.value === seasonalityChartValue);
      const chartDesc = seasonalityYearData?.chartDescriptions?.find((item) => item.chartType === curOption?.label);
      return chartDesc?.description;
    }
    return null;
  }, [seasonalityData, seasonalityChartValue]);

  const optionsProductMaturity = useMemo(() => {
    let options = [];
    if (productMaturityData?.chartTypes) {
      options = productMaturityData?.chartTypes?.map((item) => {
        if (item === 'Total Volume') {
          return { label: item, value: 'sum' };
        } else if (item === 'Total Items') {
          return { label: item, value: 'count' };
        } else {
          return { label: item, value: item.toLowerCase() };
        }
      });
    } else {
      const dataColumns = productMaturityData?.dataColumns;
      if (dataColumns?.includes('mean')) {
        options.push({ label: `Mean`, value: 'mean' });
      }
      if (dataColumns?.includes('p10') || dataColumns?.includes('median') || dataColumns?.includes('p90')) {
        options.push({ label: `Distribution`, value: 'distribution' });
      }
      if (dataColumns?.includes('sum')) {
        options.push({ label: `Total Volume`, value: 'sum' });
      }
      if (dataColumns?.includes('count')) {
        options.push({ label: `Total Items`, value: 'count' });
      }
    }

    if (options.length > 0) {
      setProductMaturityValue(options[0].value);
    }

    return options;
  }, [productMaturityData]);

  const productMaturityDesc = useMemo(() => {
    if (productMaturityData?.chartDescriptions && productMaturityValue) {
      const curOption = optionsProductMaturity?.find((item) => item.value === productMaturityValue);
      const chartDesc = productMaturityData?.chartDescriptions?.find((item) => item.chartType === curOption?.label);
      return chartDesc?.description;
    }
    return null;
  }, [productMaturityData, productMaturityValue]);

  const onChangeDropdownVersionSel = (option) => {
    setEdaVersion(option?.value);
  };

  const onChangeSalesAcrossTime = (option) => {
    setSalesAcrossTimeValue(option?.value);
  };

  const onChangeSeasonality = (option) => {
    setSeasonalityValue(option?.value);
  };

  const onChangeSeasonalityChart = (option) => {
    setSeasonalityChartValue(option?.value);
  };

  const onChangeProductMaturity = (option) => {
    setProductMaturityValue(option?.value);
  };

  const onChangeColumns = (column, value) => {
    const optionsColumns = new Map(optionsColumnsData);
    optionsColumns.get(column)['value'] = value;
    setOptionsColumnsData(optionsColumns);
  };

  const dataSource = useMemo(() => {
    return [
      {
        name: 'Count',
        value: itemForecatingData?.itemStatistics?.count ?? '',
      },
      {
        name: 'Max',
        value: itemForecatingData?.itemStatistics?.max ?? '',
      },
      {
        name: 'Mean',
        value: itemForecatingData?.itemStatistics?.mean ?? '',
      },
      {
        name: 'Median',
        value: itemForecatingData?.itemStatistics?.median ?? '',
      },
      {
        name: 'Min',
        value: itemForecatingData?.itemStatistics?.min ?? '',
      },
      {
        name: 'MissingPercent',
        value: itemForecatingData?.itemStatistics?.missingPercent ?? '',
      },
      {
        name: '10th Percentile',
        value: itemForecatingData?.itemStatistics?.p10 ?? '',
      },
      {
        name: '90th Percentile',
        value: itemForecatingData?.itemStatistics?.p90 ?? '',
      },
      {
        name: 'Stddev',
        value: itemForecatingData?.itemStatistics?.stddev ?? '',
      },
    ];
  }, [itemForecatingData]);

  const columns = useMemo(() => {
    return [
      {
        title: 'STATISTIC',
        field: 'name',
      },
      {
        title: 'VALUE',
        field: 'value',
        render: (text, row, index) => {
          return <span>{isNaN(text) ? '' : Utils.decimals(+text, 2)}</span>;
        },
        align: 'right',
      },
    ] as ITableExtColumn[];
  }, []);

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
        <span style={{ whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
          <span>Time Series EDA</span>
        </span>
        <div
          css={`
            display: flex;
            justify-content: right;
            align-items: center;
            flex: 1;
          `}
        >
          <span css="font-size: 14px">EDA:</span>
          <span style={{ marginLeft: '10px', marginRight: '20px', width: '300px', display: 'inline-block', fontSize: '12px' }}>
            <SelectExt value={optionsEDA?.find((v1) => v1.value === edaId)} options={optionsEDA} onChange={onChangeDropdownEDASel} />
          </span>
          <span css="font-size: 14px">Version:</span>
          <span style={{ marginLeft: '10px', marginRight: '20px', width: '200px', display: 'inline-block', fontSize: '12px' }}>
            <SelectExt value={optionsVersion?.find((v1) => v1.value === edaVersion)} options={optionsVersion} onChange={onChangeDropdownVersionSel} />
          </span>
        </div>
      </div>
      <div
        css={`
          position: absolute;
          top: ${100}px;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        <RefreshAndProgress isMsgAnimRefresh={false} msgMsg={false ? 'Processing...' : undefined} isDim={false}>
          <AutoSizer>
            {({ width, height }) => {
              const widthFull = width - 40;
              const heightFull = height - 40;
              const cellWidth = (widthFull - 40) / 2;
              const chartHeight = 400;
              const chartHeight2 = 600;

              return (
                <div
                  css={`
                    width: ${widthFull}px;
                    height: ${heightFull}px;
                  `}
                >
                  <NanoScroller>
                    <div className={sd.table} style={{ position: 'relative', marginLeft: '20px', marginRight: '20px' }}>
                      <div
                        css={`
                          min-height: ${chartHeight}px;
                        `}
                      >
                        <div
                          css={`
                            font-family: Matter;
                            display: flex;
                            margin-bottom: 10px;
                          `}
                        >
                          <div css={'flex: 1;'}>
                            <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                              {salesAcrossTimeData?.chartName ?? 'Aggregated Sales over Time'} <HelpIcon id={'eda_timeseries_top_level_metrics'} style={{ marginLeft: '4px' }} />
                            </div>
                            {salesAcrossTimeDesc && <div css={'font-size: 12px;'}>{salesAcrossTimeDesc}</div>}
                          </div>
                          <div css={'display: flex; align-items: center;'}>
                            <span css={'margin-right: 10px;'}>Metrics: </span>
                            <SelectExt css={'width: 300px;'} value={optionsSalesAcrossTime?.find((v1) => v1.value === salesAcrossTimeValue)} options={optionsSalesAcrossTime} onChange={onChangeSalesAcrossTime} />
                          </div>
                        </div>
                        <RefreshAndProgress isRelative={true} isRefreshing={!salesAcrossTimeData} style={{ width: widthFull }}>
                          {salesAcrossTimeData && <div id="salesAcrossTimeChartDiv" style={{ width: '100%', height: chartHeight, background: '#19232F' }}></div>}
                        </RefreshAndProgress>
                      </div>
                      <div
                        css={`
                          margin-top: 20px;
                          min-height: ${chartHeight}px;
                        `}
                      >
                        <div
                          css={`
                            font-family: Matter;
                            display: flex;
                            margin-bottom: 10px;
                          `}
                        >
                          <div css={'flex: 1;'}>
                            <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                              {productMaturityData?.chartName ?? 'Sales vs Age of the Item'} <HelpIcon id={'eda_timeseries_sales_vs_age'} style={{ marginLeft: '4px' }} />
                            </div>
                            {productMaturityDesc && <div css={'font-size: 12px;'}>{productMaturityDesc}</div>}
                          </div>
                          <div css={'display: flex; align-items: center;'}>
                            <span css={'margin-right: 10px;'}>Metrics: </span>
                            <SelectExt css={'width: 300px;'} value={optionsProductMaturity?.find((v1) => v1.value === productMaturityValue)} options={optionsProductMaturity} onChange={onChangeProductMaturity} />
                          </div>
                        </div>
                        <RefreshAndProgress isRelative={true} isRefreshing={!productMaturityData} style={{ width: widthFull }}>
                          {productMaturityData && <div id="productMaturityChartDiv" style={{ width: '100%', height: chartHeight, background: '#19232F' }}></div>}
                        </RefreshAndProgress>
                      </div>
                      <div css={'display: flex; gap: 20px; margin-top: 20px;'}>
                        <div
                          css={`
                            flex: 1;
                            min-height: ${chartHeight}px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              margin-bottom: 10px;
                            `}
                          >
                            <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                              {cummulativeContributionData?.chartName ?? 'Cumulative Contribution by Item'} <HelpIcon id={'eda_timeseries_cumulative_contribution'} style={{ marginLeft: '4px' }} />
                            </div>
                            {cummulativeContributionData?.chartDescriptions?.length > 0 && <div css={'font-size: 12px;'}>{cummulativeContributionData?.chartDescriptions[0]?.description}</div>}
                          </div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!cummulativeContributionData} style={{ width: cellWidth }}>
                            {cummulativeContributionData && (
                              <div>
                                <ChartOutliers
                                  paperColor="#19232F"
                                  width={cellWidth}
                                  height={chartHeight}
                                  type="lines"
                                  showAxis
                                  marginLeft={50}
                                  marginBottom={50}
                                  legend={cummulativeContributionData?.legend}
                                  xAxisLabel={cummulativeContributionData?.xAxis}
                                  yAxisLabel={cummulativeContributionData?.yAxis}
                                  chartData={cummulativeContributionData?.chartData}
                                />
                              </div>
                            )}
                          </RefreshAndProgress>
                        </div>
                        <div
                          css={`
                            flex: 1;
                            min-height: ${chartHeight}px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              margin-bottom: 10px;
                            `}
                          >
                            <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                              {missingValueDistributionData?.chartName ?? 'Missing / Null Value Distribution'} <HelpIcon id={'eda_timeseries_missing_null_value_distribution'} style={{ marginLeft: '4px' }} />
                            </div>
                            {missingValueDistributionData?.chartDescriptions?.length > 0 && <div css={'font-size: 12px;'}>{missingValueDistributionData?.chartDescriptions[0]?.description}</div>}
                          </div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!missingValueDistributionData} style={{ width: cellWidth }}>
                            {missingValueDistributionData && (
                              <div css={'background: #19232F;'}>
                                <ChartXYExt lineFilled useEC data={missingValueDistributionData} height={chartHeight} type={'line'} colorIndex={0} startColor="#BE8AFF" endColor="#7534FB" />
                              </div>
                            )}
                          </RefreshAndProgress>
                        </div>
                      </div>
                      <div css={'display: flex; gap: 20px; margin-top: 20px;'}>
                        <div
                          css={`
                            flex: 1;
                            min-height: ${chartHeight}px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              margin-bottom: 10px;
                            `}
                          >
                            <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                              {historyLengthData?.chartName ?? 'History Length Distribution'} <HelpIcon id={'eda_timeseries_history_length_distribution'} style={{ marginLeft: '4px' }} />
                            </div>
                            {historyLengthData?.chartDescriptions?.length > 0 && <div css={'font-size: 12px;'}>{historyLengthData?.chartDescriptions[0]?.description}</div>}
                          </div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!historyLengthData} style={{ width: cellWidth }}>
                            {historyLengthData && (
                              <div css={'background: #19232F;'}>
                                <ChartXYExt lineFilled useEC data={historyLengthData} height={chartHeight} type={'line'} colorIndex={0} verticalXAxisLabels startColor="#00ECBC" endColor="#036774" />
                              </div>
                            )}
                          </RefreshAndProgress>
                        </div>
                        <div
                          css={`
                            flex: 1;
                            min-height: ${chartHeight}px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              margin-bottom: 10px;
                            `}
                          >
                            <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                              {numRowsHistogramData?.chartName ?? 'Rows / Item Distribution'} <HelpIcon id={'eda_timeseries_number_of_rows_item_id'} style={{ marginLeft: '4px' }} />
                            </div>
                            {numRowsHistogramData?.chartDescriptions?.length > 0 && <div css={'font-size: 12px;'}>{numRowsHistogramData?.chartDescriptions[0]?.description}</div>}
                          </div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!numRowsHistogramData} style={{ width: cellWidth }}>
                            {numRowsHistogramData && (
                              <div css={'background: #19232F;'}>
                                <ChartXYExt lineFilled useEC data={numRowsHistogramData} height={chartHeight} type={'line'} colorIndex={0} verticalXAxisLabels startColor="#245BFF" endColor="#002BC9" />
                              </div>
                            )}
                          </RefreshAndProgress>
                        </div>
                      </div>
                      <div css={'display: flex; gap: 20px; margin-top: 20px;'}>
                        <div
                          css={`
                            flex: 1;
                            min-height: ${chartHeight}px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              margin-bottom: 10px;
                            `}
                          >
                            <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                              {autocorrelationData?.chartName ?? 'Auto Correlation Analysis'} <HelpIcon id={'eda_timeseries_auto_correlation'} style={{ marginLeft: '4px' }} />
                            </div>
                            {autocorrelationData?.chartDescriptions?.length > 0 && <div css={'font-size: 12px;'}>{autocorrelationData?.chartDescriptions[0]?.description}</div>}
                          </div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!autocorrelationData} style={{ width: cellWidth }}>
                            {autocorrelationData && <div id="autocorrelationChartDiv" style={{ width: '100%', height: chartHeight, background: '#19232F' }}></div>}
                          </RefreshAndProgress>
                        </div>
                        <div
                          css={`
                            flex: 1;
                            min-height: ${chartHeight}px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              margin-bottom: 10px;
                            `}
                          >
                            <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                              {partialAutocorrelationData?.chartName ?? 'Partial Auto Correlation Analysis'} <HelpIcon id={'eda_timeseries_partial_auto_correlation'} style={{ marginLeft: '4px' }} />
                            </div>
                            {partialAutocorrelationData?.chartDescriptions?.length > 0 && <div css={'font-size: 12px;'}>{partialAutocorrelationData?.chartDescriptions[0]?.description}</div>}
                          </div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!partialAutocorrelationData} style={{ width: cellWidth }}>
                            {partialAutocorrelationData && <div id="partialAutocorrelationChartDiv" style={{ width: '100%', height: chartHeight, background: '#19232F' }}></div>}
                          </RefreshAndProgress>
                        </div>
                      </div>
                      {seasonalityData && (
                        <div
                          css={`
                            min-height: ${chartHeight}px;
                            margin-top: 20px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              display: flex;
                              margin-bottom: 10px;
                            `}
                          >
                            <div css={'flex: 1;'}>
                              <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                                {seasonalityData?.chartName ?? `Aggregated Sales across ${optionsSeasonalityChart?.find((v1) => v1.value === seasonalityChartValue)?.label ?? ''}`}{' '}
                                <HelpIcon id={'eda_timeseries_seasonality'} style={{ marginLeft: '4px' }} />
                              </div>
                              {seasonalityDesc && <div css={'font-size: 12px;'}>{seasonalityDesc}</div>}
                            </div>
                            <div css={'display: flex; align-items: center;'}>
                              <span css={'margin-right: 10px;'}>Seasonality: </span>
                              <SelectExt css={'width: 200px; margin-right: 20px;'} value={optionsSeasonality?.find((v1) => v1.value === seasonalityValue)} options={optionsSeasonality} onChange={onChangeSeasonality} />
                              <span css={'margin-right: 10px;'}>Metrics: </span>
                              <SelectExt css={'width: 200px;'} value={optionsSeasonalityChart?.find((v1) => v1.value === seasonalityChartValue)} options={optionsSeasonalityChart} onChange={onChangeSeasonalityChart} />
                            </div>
                          </div>
                          <RefreshAndProgress isRelative={true} isRefreshing={!seasonalityData} style={{ width: widthFull }}>
                            {seasonalityData && <div id="seasonalityChartDiv" style={{ width: '100%', height: chartHeight, background: '#19232F' }}></div>}
                          </RefreshAndProgress>
                        </div>
                      )}
                      <div css={'margin-top: 30px; margin-bottom: 20px;'}>
                        <div
                          css={`
                            display: flex;
                            gap: 20px;
                          `}
                        >
                          <div
                            css={`
                              flex: 3;
                              min-height: ${chartHeight2}px;
                            `}
                          >
                            <div
                              css={`
                                font-family: Matter;
                                display: flex;
                                margin-bottom: 20px;
                              `}
                            >
                              <div css={'flex: 1;'}>
                                <div css={'font-size: 18px; font-weight: 500; line-height: 1.78;'}>
                                  {itemForecatingData?.chartName ?? 'Item Level Charts'} <HelpIcon id={'eda_timeseries_item_level_charts'} style={{ marginLeft: '4px' }} />
                                </div>
                                {itemForecatingData?.chartDescriptions?.length > 0 && <div css={'font-size: 12px;'}>{itemForecatingData?.chartDescriptions[0]?.description}</div>}
                              </div>
                              <div css={'margin-right: 10px; font-size: 14px;'}>
                                {primaryKeysData &&
                                  primaryKeysData.map((item, index) => {
                                    return (
                                      <div css={'display: flex; align-items: center; margin-top: 5px; justify-content: right;'} key={item + index}>
                                        <span css={'margin-right: 10px'}>{item}:</span>
                                        <SelectExt
                                          css={'width: 300px;'}
                                          value={optionsColumnsData?.get(item)?.['options']?.find((v1) => v1.value === optionsColumnsData?.get(item)?.['value'])}
                                          options={optionsColumnsData?.get(item)?.['options']}
                                          onChange={(option) => {
                                            onChangeColumns(item, option.value);
                                          }}
                                        />
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                            <RefreshAndProgress isRelative={true} isRefreshing={!itemForecatingData}>
                              {itemForecatingData && <div id="itemForecatingChartDiv" style={{ width: '100%', height: chartHeight, background: '#19232F' }}></div>}
                            </RefreshAndProgress>
                          </div>
                          <div
                            css={`
                              flex: 1;
                              min-height: ${chartHeight2}px;
                              margin-top: 60px;
                            `}
                          >
                            <TableExt calcIsSelected={null} isVirtual height={chartHeight2} dataSource={dataSource} columns={columns} onClickCell={null} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </NanoScroller>
                </div>
              );
            }}
          </AutoSizer>
        </RefreshAndProgress>
      </div>
    </div>
  );
});

export default EDATimeseries;
