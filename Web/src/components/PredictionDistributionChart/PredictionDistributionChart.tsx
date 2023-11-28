import { Switch } from 'antd';
import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import Modal from 'antd/lib/modal';
import classNames from 'classnames';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as React from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils, { ReactLazyExt } from '../../../core/Utils';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
const ReactEcharts = ReactLazyExt(() => import('echarts-for-react'));
const styles = require('./PredictionDistributionChart.module.css');

const { confirm } = Modal;

export const maxColors = 40;
const extraColors = ['#7e4ce8', '#55c0da', '#9558ff', '#2f5eff'];
const extraColors2 = [
  { from: '#9137ff', to: '#4b00a7' },
  { from: '#245bff', to: '#002bc9' },
  { from: '#06edbd', to: '#006870' },
  { from: '#ff5bf4', to: '#7e05b1' },
  { from: '#ffc443', to: '#db5704' },
];
export const maxColorsMod = maxColors + extraColors.length + extraColors2.length;

interface PredictionDistributionChartProps {
  data?: any;
  height?: number;
  width?: number;
}

const VIEW_TYPES = {
  AREA_CHART: 'areaChart',
  BAR_CHART: 'barChart',
};

const TITLES = {
  ACTUAL_VS_PREDICTED: 'Actual vs Predicted Score For',
  ACTUAL_CLASS_DENSITY: 'Actual Class Density',
};

const HelpIds = {
  chart_Actual_density_graph: 'chart_Actual_density_graph',
  actual_vs_predicted_score: 'actual_vs_predicted_score',
};

const PredictionDistributionChart = React.memo((props: PredictionDistributionChartProps) => {
  const [selectedChartIndex, setSelectedChartIndex] = React.useState(0);
  const [viewType, setViewType] = React.useState(VIEW_TYPES.AREA_CHART);

  const createButtonDownload = (data) => {
    let popupContainerForMenu = () => document.getElementById('body2');
    const onClickVoid = (event) => {
      if (event && event.domEvent) {
        event.domEvent.stopPropagation();
      }
    };

    let resJson = [];
    let resCsv = [];

    const escape1 = (v1) => {
      return v1?.replace(/[",]/g, '_');
    };

    let selectedChart = data?.[selectedChartIndex];
    let columnNames = ['x', ...(selectedChart?.data?.barsX ?? [])];
    let stringBuilder = '';
    columnNames.forEach((columnName, index) => {
      let name = columnName === 'x' ? 'name' : columnName;
      if (index) {
        stringBuilder += ',';
      }
      stringBuilder += `"${escape1(name)}"`;
    });
    resCsv.push(stringBuilder);

    selectedChart?.data?.barsData?.forEach((dataPoint, i) => {
      let obj: any = {};
      let stringBuilder = '';
      columnNames.forEach((columnName, j) => {
        let name = columnName === 'x' ? 'name' : columnName;
        if (j) {
          stringBuilder += ',';
        }
        let value = columnName === 'x' ? selectedChart?.data?.barsList?.[i] : dataPoint?.[j - 1];

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

    let dataListJson = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(resJson ?? '', undefined, 2));
    let dataListCsv = 'data:text/plain;charset=utf-8,' + encodeURIComponent(resCsv.join('\n'));
    let name1 = data?.title || 'chart';
    name1 = name1.replace(/ /gi, '_');
    let downloadJsonFilename = name1 + '.json';
    let downloadCsvFilename = name1 + '.csv';

    const menu = (
      <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
        <Menu.Item key={'csv'}>
          <a href={dataListCsv} download={downloadCsvFilename}>
            Download CSV
          </a>
        </Menu.Item>
        {resJson != null && (
          <Menu.Item key={'json'}>
            <a href={dataListJson} download={downloadJsonFilename}>
              Download JSON
            </a>
          </Menu.Item>
        )}
      </Menu>
    );

    return (
      <DropdownExt overlay={menu} trigger={['click']} placement={'bottomRight'}>
        <Button
          css={`
            margin-right: 5px;
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
  };

  const calcColorFromIndex = (index) => {
    index = index % maxColorsMod;

    let c1;
    if (index >= maxColors) {
      if (index < maxColors + extraColors.length) {
        c1 = extraColors[index - maxColors];
      } else {
        c1 = extraColors2[index - maxColors - extraColors.length];
      }
    } else {
      c1 = Utils.getColorPaletteByIndex(index);
    }
    return c1;
  };

  const predictionDistributionChart = React.useMemo(() => {
    let { data } = props;
    if (!data) {
      return;
    }

    if (Immutable.isImmutable(data)) {
      data = data.toJS();
    }

    const seriesData = [];
    for (let i = 0; i < data?.length; i += 1) {
      let color = calcColorFromIndex(i);
      const next = data?.[selectedChartIndex]?.data?.barsData?.map?.((coordinates, j) => [data?.[0]?.data?.barsList[j], coordinates?.[i]]) || [];
      seriesData.push({
        type: viewType === VIEW_TYPES.AREA_CHART ? 'line' : 'bar',
        smooth: true,
        showSymbol: false,
        data: next,
        name: data?.[0]?.data?.barsX[i],
        color,
        lineStyle: {
          color,
        },
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
        },
        areaStyle: {
          color,
          opacity: 0.15,
        },
      });
    }
    const option = {
      animation: false,
      backgroundColor: 'transparent',
      grid: {
        containLabel: false,
        bottom: 48,
        left: 72,
        right: 32,
        top: 32,
      },
      legend: {},
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
        name: 'Score',
        nameLocation: 'middle',
        nameGap: 30,
        triggerEvent: true,
        type: 'value',
        splitLine: {
          show: false,
        },
        splitNumber: Math.min(seriesData?.[0]?.data?.length, 20),
        axisLabel: {
          show: true,
          color: '#8798ad',
        },
      },
      yAxis: {
        name: 'Actual Fraction',
        nameLocation: 'middle',
        nameGap: 40,
        type: 'value',
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
      series: seriesData,
    };

    let downloadButtonRight = createButtonDownload(data);

    const containerStyles = {
      height: 260,
      width: props.width,
      marginTop: 8,
    };

    const titleSelectorOptions = props.data?.map?.((chart, index) => ({
      label: chart?.title,
      value: index,
      data: chart,
    }));

    const widgetStyles = {
      position: 'relative',
      width: props.width || '100%',
      minHeight: 360,
      backgroundColor: '#19232f',
      paddingTop: '8px',
      borderRadius: '8px',
    } as React.CSSProperties;

    const selectedChart = titleSelectorOptions?.find((v1) => v1.value === selectedChartIndex);
    const title = viewType === VIEW_TYPES.AREA_CHART ? TITLES.ACTUAL_CLASS_DENSITY : TITLES.ACTUAL_VS_PREDICTED;
    const helpId = viewType === VIEW_TYPES.AREA_CHART ? HelpIds.chart_Actual_density_graph : HelpIds.actual_vs_predicted_score;
    const onChangeTitle = (option) => {
      setSelectedChartIndex(option?.value ?? 0);
    };

    const header = (
      <div className={styles.titleContainer}>
        <div className={styles.alignCenter}>
          <span className={styles.title}>{title}</span>
          <SelectExt
            css={`
              width: 200px;
            `}
            value={selectedChart}
            options={titleSelectorOptions}
            onChange={onChangeTitle}
            menuPortalTarget={document.getElementById('body2')}
          />
          <HelpIcon id={helpId} style={{ marginLeft: '10px' }} />
        </div>
        <div className={styles.alignCenter}>
          <div className={styles.alignCenter}>
            <span className={classNames(styles.switchLabel, viewType === VIEW_TYPES.BAR_CHART && styles.selectedLabel)}>BAR CHART</span>
            <Switch onChange={(checked) => setViewType(checked ? VIEW_TYPES.AREA_CHART : VIEW_TYPES.BAR_CHART)} defaultChecked />
            <span className={classNames(styles.switchLabel, viewType === VIEW_TYPES.AREA_CHART && styles.selectedLabel)}>AREA CHART</span>
          </div>
          <div style={{ marginRight: 32 }} />
          <div className={styles.alignCenter}>
            {downloadButtonRight}
            <HelpIcon id="actual_vs_predicted_score" style={{ marginLeft: '4px' }} />
            <div style={{ marginRight: 16 }} />
          </div>
        </div>
      </div>
    );

    return (
      <div style={widgetStyles}>
        {header}
        <React.Suspense fallback={<div></div>}>
          <div style={{ position: 'relative', display: 'inline-block', ...containerStyles }}>
            <AutoSizer>
              {() => (
                <div>
                  <ReactEcharts key={`a${Math.random()}`} option={option} style={containerStyles} theme={'dark'} />
                </div>
              )}
            </AutoSizer>
          </div>
        </React.Suspense>
      </div>
    );
  }, [props.data, selectedChartIndex, viewType]);

  return predictionDistributionChart;
});

export default PredictionDistributionChart;
