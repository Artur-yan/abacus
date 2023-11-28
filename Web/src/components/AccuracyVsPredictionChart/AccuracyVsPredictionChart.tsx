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

interface AccuracyVsPredictionChartProps {
  data?: any;
  height?: number;
  width?: number;
}

const DATA_KEYS = {
  ACCURACY: 'accuracy',
  OFFSETS: 'offsets',
};

const LABELS = {
  [DATA_KEYS.ACCURACY]: 'Accuracy',
  [DATA_KEYS.OFFSETS]: 'Offsets',
};

const AccuracyVsPredictionChart = React.memo((props: AccuracyVsPredictionChartProps) => {
  let { data } = props;

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

    let columns = ['x', DATA_KEYS.ACCURACY, DATA_KEYS.OFFSETS];
    let stringBuilder = '';
    columns.forEach((column, index) => {
      let name = column === 'x' ? 'name' : LABELS[column];
      if (index) {
        stringBuilder += ',';
      }
      stringBuilder += `"${escape1(name)}"`;
    });
    resCsv.push(stringBuilder);

    data?.[DATA_KEYS.ACCURACY]?.forEach((accuracy, i) => {
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

  const maxLabels = 10;
  let interval = (data?.[DATA_KEYS.ACCURACY]?.length || 1) / maxLabels;
  interval = Math.max(Math.ceil(interval) - 1, 0);

  const seriesData = [
    {
      type: 'line',
      symbol: 'emptycircle',
      showSymbol: true,
      symbolSize: 8,
      data: data?.[DATA_KEYS.ACCURACY]?.map?.((val, i) => [data?.[DATA_KEYS.OFFSETS]?.[i], val]),
      name: LABELS[DATA_KEYS.ACCURACY],
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
      text: 'Accuracy Over Prediction Length',
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
      right: 24,
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
      name: 'Time',
      nameLocation: 'middle',
      nameGap: 30,
      type: 'category',
      data: data?.[DATA_KEYS.OFFSETS] || [],
      splitLine: {
        show: false,
      },
      axisLabel: {
        interval,
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
      <HelpIcon id="chart_Accuracy_over_prediction_length" style={{ marginLeft: '4px' }} />
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
    paddingTop: 8,
    borderRadius: 8,
    marginBottom: 10,
  } as React.CSSProperties;

  return (
    <div style={widgetStyles}>
      {helpIcontopRight}
      <React.Suspense fallback={<div></div>}>
        <div style={{ position: 'relative', display: 'inline-block', ...containerStyles }}>
          <AutoSizer>
            {({ height, width }) => {
              return <ReactEcharts key="AccuracyVsPredictionChart" option={option} style={{ ...containerStyles, height, width }} theme={'dark'} />;
            }}
          </AutoSizer>
        </div>
      </React.Suspense>
    </div>
  );
});

export default AccuracyVsPredictionChart;
