// import { Switch } from "antd";
import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
// import classNames from "classnames";
import * as echarts from 'echarts';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as React from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { ReactLazyExt } from '../../../core/Utils';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
// import TableExt, { ITableExtColumn } from "../TableExt/TableExt";

const ReactEcharts = ReactLazyExt(() => import('echarts-for-react'));
const styles = require('./DecileAnalysisChart.module.css');

interface DecileAnalysisChartProps {
  data?: any;
  classOfInterests?: any;
  height?: number;
  width?: number;
  metrics: any;
}

const DATA_KEYS = {
  BIN_COUNT: 'binCount',
  LOW_BIN: 'lowBin',
  PRECISION: 'precision',
  DECILE: 'decile',
};

const LABELS = {
  [DATA_KEYS.BIN_COUNT]: 'Count',
  [DATA_KEYS.PRECISION]: 'Precision',
  [DATA_KEYS.LOW_BIN]: 'Probability',
};

const VIEW_TYPES = {
  CHART: 'chart',
  TABLE: 'table',
};

const DecileAnalysisChart = React.memo((props: DecileAnalysisChartProps) => {
  const [selectedChartIndex, setSelectedChartIndex] = React.useState(0);
  const [viewType, setViewType] = React.useState(VIEW_TYPES.CHART);
  // const metricsObject = React.useMemo(() => _.cloneDeep(props.metrics), [props.metrics]);
  // metricsObject.metrics = metricsObject.metrics.decileChartPerLabel;
  // delete metricsObject.otherMetrics;

  let { data } = props;
  if (Immutable.isImmutable(data)) {
    data = data.toJS();
  }

  const color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#9137ff' },
    { offset: 1, color: '#4b00a7' },
  ]);

  let popupContainerForMenu = () => document.getElementById('body2');
  const onClickVoid = (event) => {
    if (event && event.domEvent) {
      event.domEvent.stopPropagation();
    }
  };

  const { dataListCsv, dataListJson, jsonFilename, csvFilename } = React.useMemo(() => {
    let resJson = [];
    let resCsv = [];
    const escape1 = (v1) => {
      return v1?.replace(/[",]/g, '_');
    };

    let columns = ['x', DATA_KEYS.LOW_BIN, DATA_KEYS.PRECISION, DATA_KEYS.BIN_COUNT];
    let stringBuilder = '';
    columns.forEach((column, index) => {
      let name = column === 'x' ? 'name' : LABELS[column];
      if (index) {
        stringBuilder += ',';
      }
      stringBuilder += `"${escape1(name)}"`;
    });
    resCsv.push(stringBuilder);

    data?.[selectedChartIndex]?.[DATA_KEYS.LOW_BIN]?.forEach((percentage, i) => {
      let obj: any = {};
      let stringBuilder = '';
      columns.forEach((column, j) => {
        let name = column === 'x' ? 'name' : column;
        if (j) {
          stringBuilder += ',';
        }
        let value = column === 'x' ? i : data[selectedChartIndex][column][i];

        if (_.isObject(value)) {
          value = null;
        }

        if (_.isString(value)) {
          stringBuilder = `${stringBuilder}"${escape1(value)}"`;
        } else {
          stringBuilder += '' + (value ?? '');
        }
        obj[name] = value;
      });
      resCsv.push(stringBuilder);
      resJson.push(obj);
    });

    let dataListJson = resJson ? 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(resJson ?? '', undefined, 2)) : null;
    let dataListCsv = 'data:text/plain;charset=utf-8,' + encodeURIComponent(resCsv.join('\n'));
    let name1 = data?.title || 'chart';
    name1 = name1.replace(/ /gi, '_');
    let jsonFilename = name1 + '.json';
    let csvFilename = name1 + '.csv';
    return { dataListJson, dataListCsv, jsonFilename, csvFilename };
  }, [props.data, selectedChartIndex]);

  const menu = (
    <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
      <Menu.Item key={'csv'}>
        <a href={dataListCsv} download={csvFilename}>
          Download CSV
        </a>
      </Menu.Item>
      {dataListJson != null && (
        <Menu.Item key={'json'}>
          <a href={dataListJson} download={jsonFilename}>
            Download JSON
          </a>
        </Menu.Item>
      )}
    </Menu>
  );

  const downloadButtonRight = (
    <DropdownExt overlay={menu} trigger={['click']} placement={'bottomRight'}>
      <Button
        css={`
          font-size: 13px;
          border-color: rgba(255, 255, 255, 0.6);
        `}
        ghost
        size={'small'}
        type={'default'}
      >
        Download
      </Button>
    </DropdownExt>
  );

  let maxBinCount = data?.[selectedChartIndex]?.binCount?.reduce((acc, x) => Math.max(acc, x), 5);
  const remainder = maxBinCount % 5;
  maxBinCount = remainder ? maxBinCount + 5 - remainder : maxBinCount;
  const binCountInterval = maxBinCount / 5;

  const selectedBins = data?.[selectedChartIndex]?.[DATA_KEYS.LOW_BIN] || [];
  const selectedCounts = data?.[selectedChartIndex]?.[DATA_KEYS.BIN_COUNT] || [];
  const selectedPrecisions = data?.[selectedChartIndex]?.[DATA_KEYS.PRECISION] || [];
  const seriesData = [
    {
      type: 'bar',
      yAxisIndex: 1,
      showSymbol: false,
      barMaxWidth: 66,
      barWidth: '60%',
      data: selectedCounts.map((val, i) => [selectedBins[i], val]),
      name: LABELS[DATA_KEYS.BIN_COUNT],
      color,
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
      },
    },
    {
      type: 'line',
      symbol: 'emptycircle',
      symbolSize: 8,
      data: selectedPrecisions.map((val, i) => [selectedBins[i], val]),
      name: LABELS[DATA_KEYS.PRECISION],
      color: '#55c0da',
      lineStyle: {
        color: '#55c0da',
      },
    },
  ];

  const option = {
    animation: false,
    backgroundColor: 'transparent',
    title: {
      text: 'Decile Analysis',
      top: 10,
      left: 8,
      textStyle: {
        fontSize: 13,
        fontFamily: 'Matter',
        color: '#d1e4f5',
      },
    },
    grid: {
      containLabel: false,
      bottom: 52,
      left: 74,
      right: 74,
      top: 52,
    },
    textStyle: {
      fontSize: 12,
    },
    tooltip: {
      appendToBody: true,
      show: true,
      trigger: 'axis',
    },
    maintainAspectRatio: false,
    responsive: true,
    xAxis: {
      name: 'Probability',
      nameLocation: 'middle',
      boundaryGap: true,
      nameGap: 30,
      triggerEvent: true,
      type: 'value',
      min: -0.1,
      max: 1,
      interval: 0.1,
      splitLine: {
        show: false,
      },
      splitNumber: 12,
      axisLabel: {
        show: true,
        color: '#8798ad',
      },
    },
    yAxis: [
      {
        nameLocation: 'middle',
        nameGap: 48,
        type: 'value',
        min: 0,
        max: 1,
        interval: 0.2,
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: true,
          color: '#8798ad',
        },
        axisLine: {
          show: false,
        },
      },
      {
        nameLocation: 'middle',
        nameGap: 48,
        type: 'value',
        min: 0,
        max: maxBinCount,
        interval: binCountInterval,
        splitLine: {
          lineStyle: {
            type: [5, 7],
            color: '#4c5b92',
          },
        },
        axisLabel: {
          show: true,
          color: '#8798ad',
        },
      },
    ],
    series: seriesData,
  };

  const containerStyles = {
    height: props.height + 70,
    width: props.width,
  };

  const widgetStyles = {
    position: 'relative',
    width: props.width || '100%',
    minHeight: props.height + 70,
    backgroundColor: '#19232f',
    paddingTop: '8px',
    borderRadius: '8px',
    marginBottom: '10px',
  } as React.CSSProperties;

  const titleSelectorOptions = props.classOfInterests?.map?.((name, i) => ({
    label: name,
    value: i,
  }));

  const selectedChart = titleSelectorOptions?.find((v1) => v1.value === selectedChartIndex);

  const onChangeTitle = (option) => {
    setSelectedChartIndex(option?.value ?? 0);
  };

  let header = (
    <div className={styles.titleContainer}>
      <div className={styles.alignCenter}>
        <span
          css={`
            font-size: 12px;
            margin-right: 4px;
          `}
        >
          CLASS OF INTEREST:{' '}
        </span>
        <span className={styles.select}>
          <SelectExt value={selectedChart} options={titleSelectorOptions} onChange={onChangeTitle} menuPortalTarget={document.getElementById('body2')} />
        </span>
      </div>
      <div className={styles.alignCenter}>
        {/* <span className={classNames(styles.switchLabel, viewType === VIEW_TYPES.TABLE && styles.selectedLabel)}>TABLE VIEW</span>
        <Switch onChange={(checked) => setViewType(checked ? VIEW_TYPES.CHART : VIEW_TYPES.TABLE)} defaultChecked />
        <span className={classNames(styles.switchLabel, viewType === VIEW_TYPES.CHART && styles.selectedLabel)}>CHART VIEW</span> */}
        <div style={{ marginRight: 32 }} />
        <div style={{ marginRight: 16 }}>
          {downloadButtonRight}
          <HelpIcon id="chart_Decile_analysis" style={{ marginLeft: 4 }} />
        </div>
      </div>
    </div>
  );

  const view = (
    <div style={{ position: 'relative', display: 'inline-block', ...containerStyles }}>
      <AutoSizer>
        {() => (
          <div>
            <ReactEcharts key="DecileAnalysisChart" option={option} style={containerStyles} theme={'dark'} />
          </div>
        )}
      </AutoSizer>
    </div>
  );

  // TODO (rohan): add table view

  // const columns: ITableExtColumn[] = React.useMemo(() => {
  //   return [
  //     {
  //       title: '',
  //       width: 40,
  //       field: '',
  //       noAutoTooltip: true,
  //       helpId: '',
  //       render: (starred, row, index) => {
  //         return <div />;
  //       },
  //     },
  //   ] as ITableExtColumn[];
  // }, []);

  // if (viewType === VIEW_TYPES.TABLE) {
  //   view = <TableExt columns={columns} />;
  // }

  return (
    <div style={widgetStyles}>
      {header}
      <React.Suspense fallback={<div></div>}>{view}</React.Suspense>
    </div>
  );
});

export default DecileAnalysisChart;
