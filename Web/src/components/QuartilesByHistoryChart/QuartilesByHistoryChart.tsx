import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import Modal from 'antd/lib/modal';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as React from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { ReactLazyExt } from '../../../core/Utils';
import DropdownExt from '../DropdownExt/DropdownExt';
// import HelpIcon from "../HelpIcon/HelpIcon";
const ReactEcharts = ReactLazyExt(() => import('echarts-for-react'));
const styles = require('./QuartilesByHistoryChart.module.css');

const { confirm } = Modal;

const LINE_COLORS = ['#7e4ce8', '#55c0da', '#9558ff', '#2f5eff'];

interface QuartilesByHistoryChartProps {
  data?: any;
  height?: number;
  width?: number;
}

const QuartilesByHistoryChart = React.memo((props: QuartilesByHistoryChartProps) => {
  let { data } = props;
  if (!data) {
    return;
  }

  if (Immutable.isImmutable(data)) {
    data = data.toJS();
  }

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

    let columnNames = ['x', ...(data?.[0]?.data?.barsX ?? [])];
    let stringBuilder = '';
    columnNames.forEach((columnName, index) => {
      let name = columnName === 'x' ? 'name' : columnName;
      if (index) {
        stringBuilder += ',';
      }
      stringBuilder += `"${escape1(name)}"`;
    });
    resCsv.push(stringBuilder);

    data?.[0]?.data?.barsData?.forEach((dataPoint, i) => {
      let obj: any = {};
      let stringBuilder = '';
      columnNames.forEach((columnName, j) => {
        let name = columnName === 'x' ? 'name' : columnName;
        if (j) {
          stringBuilder += ',';
        }
        let value = columnName === 'x' ? data?.[0]?.data?.barsList?.[i] : dataPoint?.[j - 1];

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
  }, [props.data]);

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

  const seriesData = [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: data?.accuracy?.map?.((val, i) => [data?.percentageOfItems?.[i], val]),
      name: 'Cumulative Accuracy',
      color: '#7e4ce8',
      lineStyle: {
        color: '#7e4ce8',
      },
    },
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: data?.cumulativeVolume?.map?.((val, i) => [data?.percentageOfItems?.[i], val]),
      name: '% Volume',
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
      text: data.title,
      textStyle: {
        fontSize: 13,
        fontFamily: 'Matter',
        color: '#d1e4f5',
      },
      left: 'center',
    },
    grid: {
      containLabel: false,
      bottom: 52,
      left: 74,
      right: 32,
      top: 40,
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
      name: 'Score',
      nameLocation: 'middle',
      nameGap: 30,
      triggerEvent: true,
      type: 'value',
      data: data?.percentageOfItems,
      splitLine: {
        show: false,
      },
      splitNumber: 10,
      axisLabel: {
        show: true,
        color: '#8798ad',
      },
    },
    yAxis: {
      name: 'Accuracy',
      nameLocation: 'middle',
      nameGap: 48,
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      splitLine: {
        lineStyle: {
          type: [5, 7],
          color: '#4c5b92',
        },
      },
      axisLabel: {
        show: true,
        color: '#8798ad',
        formatter: '{value} %',
      },
    },
    series: seriesData,
  };
  let bottomLine = data.bottomLine;

  let helpIcontopRight = (
    <div
      css={`
        position: absolute;
        top: 12px;
        right: 36px;
        z-index: 5;
      `}
    >
      {downloadButtonRight}
      {/* <HelpIcon id="actual_vs_predicted_score" style={{ marginLeft: '4px', }} /> */}
    </div>
  );

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
  } as React.CSSProperties;

  return (
    <div style={widgetStyles}>
      {helpIcontopRight}
      <React.Suspense fallback={<div></div>}>
        <div style={{ position: 'relative', display: 'inline-block', ...containerStyles }}>
          <AutoSizer>
            {() => (
              <div>
                <ReactEcharts key="AccuracyVSVolumeChart" option={option} style={containerStyles} theme={'dark'} />
                {bottomLine}
              </div>
            )}
          </AutoSizer>
        </div>
      </React.Suspense>
    </div>
  );
});

export default QuartilesByHistoryChart;
