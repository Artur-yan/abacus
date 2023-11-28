import type { RadioChangeEvent } from 'antd';
import Radio from 'antd/lib/radio';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils, { ColorsGradients } from '../../../core/Utils';
import ChartMetricsFull from '../ChartMetricsFull/ChartMetricsFull';
import HelpIcon from '../HelpIcon/HelpIcon';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import REClient_ from '../../api/REClient';

const s = require('./ModelFoldDrift.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelFoldDriftProps {
  targetColumn?: string;
  featureDrift?: any;
  modelVersion?: string;
}

const ModelFoldDrift = React.memo(({ targetColumn, featureDrift, modelVersion }: PropsWithChildren<IModelFoldDriftProps>) => {
  const [featureSelId, setFeatureSelId] = useState(null);
  const [featuredChartData, setFeaturedChartData] = useState(null);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(null);
  const [throughputRes, setThroughputRes] = useState(null);
  const [isNotYet, setIsNotYet] = useState(false);

  const chartListOptions = [
    { title: 'distance', field: 'KL' },
    { title: 'js_distance', field: 'JS' },
    { title: 'ks_statistic', field: 'WS' },
    { title: 'ws_distance', field: 'KS' },
  ];

  const featureIndex = useMemo(() => {
    const featureDriftEntries = Object.entries(featureDrift ?? {});
    if (featureDriftEntries?.length > 0) {
      setFeatureSelId(featureDriftEntries[0][0]);
    }
    return featureDriftEntries?.map(([key, value]: any[]) => ({ ...value, name: key })) ?? [];
  }, [featureDrift]);

  const changeFeatureChart = (key) => {
    let checkTitle = chartListOptions?.some((item) => item.title === key);
    if (!checkTitle && !featureDrift) {
      return null;
    }

    let data = [];
    featureIndex?.some((p1) => {
      if (p1?.importance != null) {
        data.push([p1?.importance, p1?.[key]]);
      }
    });

    setActiveFeaturedIndex(key);
    setFeaturedChartData({
      chart: {
        data: {
          data: data,
          xAxis: 'Importance',
          yAxis: 'Drift',
          xlim: [0, undefined],
          dotColorClassByIndex: (data) => 'circleFeatures',
          divisorX: 10,
          divisorY: null,
          yAxisType: 'logarithmic',
          onClickChart: (e) => {
            setFeatureSelId(featureIndex?.[e?.index]?.name);
          },
          pointWidth: 7,
          isScatterMetric: true,
          axisXrenderValue: (value) => Utils.decimals(value, 5),
          axisYrenderValue: (value) => Utils.decimals(value, 2),
        },
        title: 'Feature Importance vs Drift',
        type: 'scatter',
      },
    });
  };

  useEffect(() => {
    changeFeatureChart('distance');
  }, []);

  useEffect(() => {
    if (featureSelId) {
      REClient_.client_()._getFoldFeatureDistributions(modelVersion, featureSelId, (err, res) => {
        if (err || !res?.success) {
          setThroughputRes(null);
        } else {
          setThroughputRes(res?.result);
        }
      });
    }
  }, [featureSelId, modelVersion]);

  const calcCharts = (throughputRes) => {
    let data1 = [],
      colorFixed = null;

    const testData = 'Test Data';
    const trainData = 'Train Data';

    let isBar = false,
      seriesY = [testData, trainData],
      fieldNames = [testData, trainData];
    let type1 = throughputRes?.type;
    if (type1) {
      if (['multivaluecategorical', 'CATEGORICAL_LIST'.toLowerCase(), 'categorical'].includes(type1.toLowerCase() ?? '-')) {
        type1 = 'categorical';
        isBar = true;
        colorFixed = ['#224199', '#972c8c'];
      }

      const dataTestDistribution = throughputRes?.testDistribution ?? [];
      const dataTrainDistribution = throughputRes?.trainDistribution ?? [];

      const findVal = (data, k1) => {
        if (isNumeric) {
          let res = data?.[k1];

          let kk = Object.keys(data);
          kk.some((k2) => {
            if (Utils.tryParseFloat(k2) == k1) {
              res = data?.[k2];
              return true;
            }
          });
          return res * 100;
        } else {
          return data?.[k1];
        }
      };

      let isNumeric = false;
      if (type1.toLowerCase() === 'numerical') {
        isNumeric = true;
      }
      let kk = Object.keys(dataTestDistribution);

      kk?.some((k1, k1ind, t1ind) => {
        let d1 = { x: k1 };

        d1[testData] = findVal(dataTestDistribution, k1);
        d1[trainData] = findVal(dataTrainDistribution, k1);

        data1.push(d1);
      });
    }

    let notYet1 = false;
    if (data1 == null || data1.length === 0) {
      notYet1 = true;
    }

    setIsNotYet(notYet1);

    const calcRes = (data0, index = null) => {
      let intervalXcalc;
      if (data0 != null && _.isArray(data0) && data0.length > 8) {
        intervalXcalc = 10;
      }

      if (data0 == null || (_.isArray(data0) && data0.length === 0)) {
        return null;
      }

      let res: any = {
        tooltipValueLabel: 'Value: ',
        isBar: true,
        useTitles: true,
        titleX: index == null ? 'Value' : `Average Bucket Value`,
        titleY: index == null ? 'Frequency %' : 'Frequency in Distribution',
        seriesY: index == null ? fieldNames : [fieldNames?.[index]],
        fieldNameTooltip: index == null ? seriesY : [seriesY?.[index]],
        tooltipFormatExt: (v1) => (v1 == null ? null : Utils.decimals(v1, 2) + '%'),
        maxDecimalsTooltip: 2,
        data: data0,
        labelMaxChars: 30,
        colorFixed,
        useLegend: true,
        intervalX: null,
      };

      if (index != null) {
        res.tooltipRender = (params) => {
          let p1 = params?.[0];
          if (p1 != null) {
            return `Percentile Value Bucket: ${p1?.dataIndex + 1}<br />
                    Average Bucket Value: ${Utils.decimals(Utils.tryParseFloat(p1?.axisValue), 3)}<br />
                    Frequency in Distribution: ${Utils.decimals(p1?.value, 3)}%`;
          }
        };
      }

      return res;
    };

    return calcRes(data1);
  };

  const dataDriftOne = useMemo(() => {
    return calcCharts(throughputRes);
  }, [throughputRes]);

  const onChangeChartOption = (e: RadioChangeEvent) => {
    changeFeatureChart(e.target.value);
  };

  const [activeFeatureImportance, setActiveFeatureImportance] = useState<'ks_statistic' | 'ws_distance' | 'distance' | 'js_distance'>('distance');

  const wwCol1 = 96 - 12;

  const columnsFeatures = useMemo(() => {
    const activeColumns = ['name', 'importance', activeFeatureImportance];

    let columns = [
      {
        title: 'Feature Name',
        field: 'name',
        width: 250,
      },
      {
        title: 'KL Drift',
        field: 'distance',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        helpTooltip: 'Kullback–Leibler divergence',
        align: 'right',
      },
      {
        align: 'right',
        title: 'JS Drift',
        field: 'js_distance',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        helpTooltip: 'Jensen–Shannon divergence',
      },
      {
        align: 'right',
        title: 'WS Drift',
        field: 'ws_distance',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        helpTooltip: 'Wasserstein Distance',
      },
      {
        align: 'right',
        title: 'KS Drift',
        field: 'ks_statistic',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        helpTooltip: 'KS Statistic',
      },
    ] as ITableExtColumn[];

    columns = columns.filter((item) => {
      return activeColumns.includes(typeof item?.field === 'string' ? item?.field : '');
    });

    const hasImportance = featureIndex?.some(function (item) {
      return item?.importance != null;
    });
    if (hasImportance) {
      columns.splice(1, 0, {
        title: 'importance',
        field: 'importance',
        align: 'left',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 3)}</span>;
        },
      });
    }
    return columns;
  }, [featureSelId, wwCol1, activeFeatureImportance, featureIndex]);

  const topPredFeatures = useMemo(() => {
    let list = [...(featureIndex ?? [])];
    let ind1 = _.findIndex(list, (s1) => s1.name === targetColumn);
    if (ind1 > -1) {
      list.splice(ind1, 1);
    }

    return list;
  }, [featureIndex, targetColumn]);

  const onClickRowTopFeature = (row) => {
    setFeatureSelId(row?.name);
  };

  const chartHH = 300;

  const calcIsSelectedFeature = useCallback(
    (index) => {
      let row = topPredFeatures?.[index];
      if (row) {
        return row?.name === featureSelId;
      }
    },
    [topPredFeatures, featureSelId],
  );

  const featureImportanceOption = useMemo(() => {
    return [
      {
        label: 'KL',
        value: 'distance',
      },
      {
        label: 'JS',
        value: 'js_distance',
      },
      {
        label: 'WS',
        value: 'ws_distance',
      },
      {
        label: 'KS',
        value: 'ks_statistic',
      },
    ];
  }, []);

  const onChangeTimeline = (e) => {
    setActiveFeatureImportance(e.value);
  };

  return (
    <div>
      <div
        css={`
          display: flex;
        `}
      >
        <div
          css={`
            flex: 1;
            margin-right: 5px;
          `}
        >
          <div css={``}>
            <AutoSizer disableHeight>
              {({ width }) => (
                <div>
                  {featuredChartData?.chart?.data?.data?.length > 0 && (
                    <div
                      className={s.featureImportance}
                      css={`
                        display: flex;
                        flex-direction: column;
                        width: ${width - 30}px;
                        margin: 15px;
                        flex: 1;
                        position: relative;
                        overflow: visible;
                        border-radius: 5px;
                      `}
                    >
                      <p
                        css={`
                          font-size: 18px;
                          font-weight: bold;
                          margin-bottom: 14px;
                        `}
                      >
                        Feature Importance vs Drift
                      </p>
                      <Radio.Group
                        css={`
                          position: absolute;
                          left: 5rem;
                          top: 3.6rem;
                          display: flex;
                          width: ${width}px;
                          margin-bottom: 10px;
                        `}
                        onChange={onChangeChartOption}
                        value={activeFeaturedIndex}
                      >
                        {chartListOptions?.map((item, index) => {
                          return (
                            <Radio value={item.title} key={index}>
                              <span
                                css={`
                                  color: white;
                                  font-size: 18px;
                                  text-transform: capitalize;
                                `}
                              >
                                {item.field}
                              </span>
                            </Radio>
                          );
                        })}
                      </Radio.Group>
                      <div css={`.ct-series-a .ct-circle.circleFeatures {fill: #57c0a1 !important; height: 400px`}>
                        <ChartMetricsFull backNormal forceColor={ColorsGradients} forMetrics noMax data={featuredChartData} width={width - 30} height={chartHH - 40} />
                      </div>
                    </div>
                  )}
                  <div
                    css={`
                      display: flex;
                      gap: 30px;
                      margin: 15px;
                      width: ${width - 30}px;
                      position: relative;
                    `}
                  >
                    <div
                      css={`
                        flex: 1;
                      `}
                    >
                      <div
                        css={`
                          font-family: Matter;
                          display: flex;
                          font-size: 18px;
                          font-weight: 500;
                          line-height: 1.78;
                          margin-top: 20px;
                          margin-bottom: 10px;
                        `}
                      >
                        <span>
                          Feature Drift
                          <HelpIcon id={'monitor_drift_feature_drift_title'} style={{ marginLeft: '4px' }} />
                        </span>
                        <span
                          css={`
                            width: 200px;
                            margin-left: auto;
                          `}
                        >
                          <SelectExt options={featureImportanceOption} value={featureImportanceOption?.find((o1) => o1?.value === activeFeatureImportance)} onChange={onChangeTimeline} />
                        </span>
                      </div>
                      <div>
                        <TableExt calcIsSelected={calcIsSelectedFeature} defaultSort={{ field: 'distance', isAsc: false }} isVirtual height={500} dataSource={topPredFeatures} columns={columnsFeatures} onClickCell={onClickRowTopFeature} />
                      </div>
                    </div>
                    <div
                      css={`
                        flex: 1;
                      `}
                    >
                      <div
                        css={`
                          margin-top: 20px;
                          margin-bottom: 10px;
                          position: relative;
                          overflow: visible;
                          border-radius: 5px;
                          height: 30rem;
                        `}
                      >
                        <RefreshAndProgress isRelative msgTop={isNotYet ? 25 : undefined} msgMsg={isNotYet ? 'No Data Yet' : undefined} isDim={isNotYet}>
                          {dataDriftOne != null && (
                            <div
                              css={`
                                display: flex;
                                font-family: Matter;
                                font-size: 18px;
                                font-weight: 500;
                                line-height: 1.78;
                                margin-top: 10px;
                                margin-bottom: 10px;
                              `}
                            >
                              <span>
                                Feature Drift Distribution
                                {featureSelId != null && (
                                  <span
                                    css={`
                                      margin-left: 5px;
                                      opacity: 0.9;
                                    `}
                                  >
                                    for {featureSelId}
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          {dataDriftOne != null && (
                            <div css={``}>
                              <AutoSizer disableHeight>
                                {({ width }) => (
                                  <div>
                                    {dataDriftOne != null && !_.isArray(dataDriftOne) && <ChartXYExt colorFixed={dataDriftOne?.colorFixed} useEC data={dataDriftOne} width={width} height={chartHH} startColorIndex={0} />}

                                    {dataDriftOne != null && _.isArray(dataDriftOne) && (
                                      <div
                                        css={`
                                          display: flex;
                                        `}
                                      >
                                        <div
                                          css={`
                                            flex: 1;
                                          `}
                                        >
                                          <ChartXYExt colorFixed={dataDriftOne?.[0]?.colorFixed} useEC data={dataDriftOne?.[0]} width={width / 2 - 10} height={chartHH} startColorIndex={0} />
                                        </div>
                                        <div
                                          css={`
                                            width: 20px;
                                          `}
                                        ></div>
                                        <div
                                          css={`
                                            flex: 1;
                                          `}
                                        >
                                          <ChartXYExt colorFixed={dataDriftOne?.[1]?.colorFixed} useEC data={dataDriftOne?.[1]} width={width / 2 - 10} height={chartHH} startColorIndex={1} />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </AutoSizer>
                            </div>
                          )}
                        </RefreshAndProgress>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AutoSizer>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ModelFoldDrift;
