import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as React from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { ReactLazyExt } from '../../../core/Utils';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
const ReactEcharts = ReactLazyExt(() => import('echarts-for-react'));

interface AccuracyVsVolumeChartProps {
  data?: any;
  height?: number;
  width?: number;
}

const DATA_KEYS = {
  ACCURACY: 'accuracy',
  CUMULATIVE_VOLUME: 'cumulativeVolume',
  PERCENTAGE_OF_ITEMS: 'percentageOfItems',
};

const LABELS = {
  [DATA_KEYS.ACCURACY]: 'Accuracy',
  [DATA_KEYS.CUMULATIVE_VOLUME]: '% Volume',
  [DATA_KEYS.PERCENTAGE_OF_ITEMS]: 'Percentage of Items',
};

const AccuracyVsVolumeChart = React.memo((props: AccuracyVsVolumeChartProps) => {
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

    let columns = ['x', DATA_KEYS.PERCENTAGE_OF_ITEMS, DATA_KEYS.ACCURACY, DATA_KEYS.CUMULATIVE_VOLUME];
    let stringBuilder = '';
    columns.forEach((column, index) => {
      let name = column === 'x' ? 'name' : LABELS[column];
      if (index) {
        stringBuilder += ',';
      }
      stringBuilder += `"${escape1(name)}"`;
    });
    resCsv.push(stringBuilder);

    data?.[DATA_KEYS.PERCENTAGE_OF_ITEMS]?.forEach((percentage, i) => {
      let obj: any = {};
      let stringBuilder = '';
      columns.forEach((column, j) => {
        let name = column === 'x' ? 'name' : column;
        if (j) {
          stringBuilder += ',';
        }
        let value = column === 'x' ? i : data[column][i];

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
      data: data?.[DATA_KEYS.ACCURACY]?.map?.((val, i) => [data?.[DATA_KEYS.PERCENTAGE_OF_ITEMS]?.[i], val]),
      name: LABELS[DATA_KEYS.ACCURACY],
      color: '#7e4ce8',
      lineStyle: {
        color: '#7e4ce8',
      },
    },
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: data?.[DATA_KEYS.CUMULATIVE_VOLUME]?.map?.((val, i) => [data?.[DATA_KEYS.PERCENTAGE_OF_ITEMS]?.[i], val]),
      name: LABELS[DATA_KEYS.CUMULATIVE_VOLUME],
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
      text: 'Accuracy vs Volume',
      textStyle: {
        fontSize: 13,
        fontFamily: 'Matter',
        color: '#d1e4f5',
      },
      left: 'center',
    },
    legend: {
      top: 24,
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
      name: 'Percentage of Item',
      nameLocation: 'middle',
      nameGap: 30,
      triggerEvent: true,
      type: 'value',
      data: data?.[DATA_KEYS.PERCENTAGE_OF_ITEMS],
      splitLine: {
        show: false,
      },
      splitNumber: 10,
      axisLabel: {
        show: true,
        color: '#8798ad',
      },
    },
    yAxis: [
      {
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
      {
        name: 'Percentage of Volume',
        nameLocation: 'middle',
        nameGap: 48,
        type: 'value',
        min: 0,
        max: 100,
        interval: 20,
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: true,
          color: '#8798ad',
          formatter: '{value} %',
        },
      },
    ],
    series: seriesData,
  };

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
      <HelpIcon id="chart_Accuracy_vs_volume" style={{ marginLeft: '4px' }} />
    </div>
  );

  const containerStyles = {
    height: props.height + 70,
    width: '100%',
  };

  const widgetStyles = {
    position: 'relative',
    width: '100%',
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
            {({ height, width }) => {
              return <ReactEcharts key="AccuracyVSVolumeChart" option={option} style={{ ...containerStyles, height, width }} theme={'dark'} />;
            }}
          </AutoSizer>
        </div>
      </React.Suspense>
    </div>
  );
});

export default AccuracyVsVolumeChart;
