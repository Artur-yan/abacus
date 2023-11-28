import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import _ from 'lodash';
import * as React from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { ReactLazyExt } from '../../../core/Utils';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
const ReactEcharts = ReactLazyExt(() => import('echarts-for-react'));
const styles = require('./ItemAttributesChart.module.css');

const colors = ['#7e4ce8', '#55c0da', '#06edbd', '#2f5eff'];

function formatNumber(number) {
  const SI_PREFIXES = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
  const magnitude = Math.floor(Math.log10(number) / 3);
  const prefixIndex = Math.max(0, Math.min(magnitude, SI_PREFIXES.length - 1));

  const scaledNumber = number / Math.pow(10, prefixIndex * 3);
  const formattedNumber = scaledNumber.toFixed(1);
  const prefix = SI_PREFIXES[prefixIndex];

  return `${formattedNumber}${prefix}`;
}

interface ItemAttributesChartProps {
  data?: any;
  height?: number;
  width?: number;
}

const Keys = {
  // actual_avg: 'actual_avg',
  dates: 'dates',
  actual_total: 'actual_total',
  // predicted_avg: 'predicted_avg',
  predicted_total: 'predicted_total',
};

const KeyTitles = {
  // [Keys.actual_avg]: 'Actual Average',
  [Keys.dates]: 'Dates',
  [Keys.actual_total]: 'Actual Total',
  // [Keys.predicted_avg]: 'Predicted Average',
  [Keys.predicted_total]: 'Predicted Total',
};

const ItemAttributesChart = React.memo((props: ItemAttributesChartProps) => {
  const [selectedAttribute, setSelectedAttribute] = React.useState('');
  const [selectedAttributeValue, setSelectedAttributeValue] = React.useState('');

  React.useEffect(() => {
    const defaultSelectedAttribute = props?.data?.itemAttributes?.[0];
    const defaultSelectedAttributeValue = props?.data?.itemAttributeData?.[defaultSelectedAttribute]?.item_values?.[0];
    setSelectedAttribute(defaultSelectedAttribute);
    setSelectedAttributeValue(defaultSelectedAttributeValue);
  }, [props?.data]);

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

    let selectedChart = data?.itemAttributeData?.[selectedAttribute]?.item_value_plots?.[selectedAttributeValue];
    let columnNames = ['x', ...Object.keys(Keys)];
    let stringBuilder = '';
    columnNames.forEach((columnName, index) => {
      let name = columnName === 'x' ? 'name' : columnName;
      if (index) {
        stringBuilder += ',';
      }
      stringBuilder += `"${escape1(name)}"`;
    });
    resCsv.push(stringBuilder);
    selectedChart?.[Keys.dates]?.forEach((date, index) => {
      let obj: any = {};
      let stringBuilder = '';
      columnNames.forEach((columnName, j) => {
        let name = columnName === 'x' ? 'name' : columnName;
        if (j) {
          stringBuilder += ',';
        }
        let value = columnName === 'x' ? index : selectedChart?.[columnName]?.[index];

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

  let { data } = props;
  if (!data) return;

  const seriesData = [];
  const dates = data?.itemAttributeData?.[selectedAttribute]?.item_value_plots?.[selectedAttributeValue]?.[Keys.dates];

  Object.keys(Keys)
    .filter((key) => key !== Keys.dates)
    .forEach((key, index) => {
      let color = colors[index];
      const points = data?.itemAttributeData?.[selectedAttribute]?.item_value_plots?.[selectedAttributeValue]?.[key] || [];

      const next = points.map?.((dataPoint, j) => [dates?.[j], dataPoint]) || [];
      seriesData.push({
        type: 'line',
        showSymbol: false,
        data: next,
        name: KeyTitles[key],
        color,
        lineStyle: {
          color,
        },
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
        },
      });
    });

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
      type: 'time',
      splitLine: {
        show: false,
      },
      splitNumber: Math.min(seriesData?.[0]?.data?.length, 20),
      axisLabel: {
        show: true,
        color: '#8798ad',
        formatter: '{d} {MMM}',
      },
    },
    yAxis: {
      name: 'Actual Fraction',
      nameLocation: 'middle',
      nameGap: 44,
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
        formatter: (val) => formatNumber(val),
      },
    },
    series: seriesData,
  };

  let downloadButtonRight = createButtonDownload(data);

  const containerStyles = {
    height: 288,
    width: '100%',
    marginTop: 8,
  };

  const widgetStyles = {
    position: 'relative',
    width: '100%',
    minHeight: 360,
    backgroundColor: '#19232f',
    paddingTop: '8px',
    borderRadius: '8px',
  } as React.CSSProperties;

  const attributeOptions = props.data?.itemAttributes?.map?.((attribute: string) => ({
    label: attribute,
    value: attribute,
  }));

  const attributValueOptions = props.data?.itemAttributeData?.[selectedAttribute]?.item_values?.map?.((attributeValue: string) => ({
    label: attributeValue,
    value: attributeValue,
  }));

  const selectedAttributeOption = attributeOptions?.find((option) => option.value === selectedAttribute);
  const selectedAttributeValueOption = attributValueOptions?.find((option) => option.value === selectedAttributeValue);

  const onChangeAttribute = (option) => {
    const newSelectedAttributeValue = props?.data?.itemAttributeData?.[option?.value]?.item_values?.[0];
    setSelectedAttribute(option?.value);
    setSelectedAttributeValue(newSelectedAttributeValue);
  };

  const onChangeAttributeValue = (option) => setSelectedAttributeValue(option?.value);

  const header = (
    <div className={styles.titleContainer}>
      <span className={styles.chartTitle}>Item Attribute Breakdown</span>
      <div style={{ display: 'flex' }}>
        <div className={styles.alignCenter}>
          <span className={styles.title}>Attribute</span>
          <SelectExt className={styles.selectSample} value={selectedAttributeOption} options={attributeOptions} onChange={onChangeAttribute} menuPortalTarget={document.getElementById('body2')} />
        </div>
        <div className={styles.alignCenter}>
          <span className={styles.title}>Value</span>
          <SelectExt className={styles.selectSample} value={selectedAttributeValueOption} options={attributValueOptions} onChange={onChangeAttributeValue} menuPortalTarget={document.getElementById('body2')} />
        </div>
      </div>
      <div className={styles.alignCenter}>
        <div className={styles.alignCenter}>
          {downloadButtonRight}
          <HelpIcon id="chart_Forecasting_item_attribute_breakdown" style={{ marginLeft: 4 }} />
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
          <AutoSizer>{({ height, width }) => <ReactEcharts key="itemAttributesChart" option={option} style={{ ...containerStyles, height, width }} theme="dark" />}</AutoSizer>
        </div>
      </React.Suspense>
    </div>
  );
});

export default ItemAttributesChart;
