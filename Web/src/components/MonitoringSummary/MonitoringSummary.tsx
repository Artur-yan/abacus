import type { RadioChangeEvent } from 'antd';
import Radio from 'antd/lib/radio';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils, { ColorsGradients } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import monitoring, { ModelMonitoringLifecycle } from '../../stores/reducers/monitoring';
import ChartMetricsFull from '../ChartMetricsFull/ChartMetricsFull';
import HelpIcon from '../HelpIcon/HelpIcon';
import NanoScroller from '../NanoScroller/NanoScroller';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./MonitoringSummary.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitorDriftProps {}

interface IDrift {
  distance?;
  predictionStatistics?: {
    approxPercentiles?: any[];
    approximateNumDistinctValues?;
    completeness?;
    mean?;
  };
  trainingFeatureMetrics?: {
    approxPercentiles?: any[];
    approximateNumDistinctValues?;
    completeness?;
    mean?;
  };
  trainingStatistics?: any;
}

const StyleLabel = styled.div`
  font-family: Matter;
  font-size: 15px;
  font-weight: 600;
  color: #f1f1f1;
`;

const MonitoringSummary = React.memo((props: PropsWithChildren<IMonitorDriftProps>) => {
  const { paramsProp, authUser, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    monitoringParam: state.monitoring,
  }));

  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(null);
  let modelMonitorId = paramsProp?.get('modelMonitorId');
  if (!modelMonitorId) {
    modelMonitorId = null;
  }
  const [featureSelId, setFeatureSelId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modelData, setModelData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isSummaryProcessing, setIsSummaryProcessing] = useState(true);

  const chartListOptions = [
    { title: 'distance', field: 'KL' },
    { title: 'jsDistance', field: 'JS' },
    { title: 'wsDistance', field: 'WS' },
    { title: 'ksStatistic', field: 'KS' },
  ];

  const getSeriesY = (summary, type) => {
    const ignoredKeysForSeriesY = ['monitoringCompletedAt'];
    let series = Object.keys(summary?.[type]?.[0] ?? {})?.filter((item) => !ignoredKeysForSeriesY?.includes(item));
    return series?.reverse();
  };

  const changeFeatureChart = (type, key) => {
    let checkTitle = chartListOptions?.some((item) => item.title === key);
    if (!checkTitle && !type) {
      return null;
    }

    if (summary?.[type]) {
      setActiveFeaturedIndex((value) => {
        value = { ...(value ?? {}) };
        value[type] = key;
        return value;
      });
      doWorkHistograms(summary, key);
    }
  };

  const onChangeChartOption = (e: RadioChangeEvent, type) => {
    changeFeatureChart(type, e.target.value);
  };

  const generateChartData = (data, seriesY = null, modelMonitorVersionsByMilliseconds) => {
    let data1 = data?.data;
    let labelsByIndex = [];
    data1 = data1?.map((d1, d1ind) => {
      let r1 = { ...(d1 ?? {}) };
      labelsByIndex.push(r1.x);
      r1.x = d1ind;
      return r1;
    });
    return {
      chart: {
        data: {
          data: data1,
          titleY: data?.yTitle,
          titleX: ' ',
          fieldNameTooltip: seriesY?.map((item) => {
            if (item != 'modelMonitorVersion') {
              let title = item?.replace(/[A-Z]/g, ' $&')?.trim();
              return title?.[0]?.toUpperCase() + title?.slice(1);
            }
          }),
          tooltipRender: (params) => {
            let tooltips = '';
            if (params && params?.length > 0) {
              params.forEach((item) => {
                tooltips += `
                             ${!tooltips?.includes('Model monitor version') ? `<div style="padding-bottom: 7px;">Monitor version: <b>${data1?.[params?.[0]?.dataIndex]?.modelMonitorVersion /*item?.data[1]*/}</b></div>` : ''}
                             ${
                               !item?.seriesName?.includes('series')
                                 ? `<div style="display: flex; padding-bottom: 10px; position: relative;">
                                <span style="height: 10px; width: 10px; background-color: ${typeof item.color === 'object' ? `${item?.color?.colorStops?.[0]?.color}` : `${item?.color}`}; border-radius: 50%"/>
                                <span style="position: absolute; left: 20px; top: -5px">${item?.seriesName}: ${Utils.decimals(item?.data[1], 3)}</span>
                              </div>`
                                 : ''
                             }`;
              });
            }
            return tooltips;
          },
          useTitles: true,
          tooltips: true,
          axisYdecimals: data?.yTitle === 'Violations' ? 0 : 3,
          downloadIgnoreX: true,
          seriesY: seriesY ?? ['y'],
          // dateX: false,
          seriesYlines: ['y'],
          symbolSizeAll: 12,
          useLegend: true,
          dataAxisXformatter: (v1) => {
            return labelsByIndex?.[v1];
          },
          maxDecimalsTooltip: 3,
          // dateOnTooltip: true,
          dateOnTooltipDiv: 1000,
          type: 'ec',
        },
        title: 'title1',
        removeTitle: true,
        beforeTitle: 'Before',
        type: 'histogram',
      },
    };
  };

  const doWorkHistograms = (chartsData, activeSelection = 'distance') => {
    if (!chartsData) {
      return;
    }
    let data: any = {};
    let yTitles = {
      biasViolations: 'Violations',
      dataIntegrity: 'Violations',
      modelAccuracy: 'Accuracy',
      modelDrift: 'Drift',
    };

    Object.keys(chartsData).forEach((chartsDataItem) => {
      let seriesY = {};
      let modelMonitorVersionsByMilliseconds: any = {};
      if (chartsData[chartsDataItem] && chartsData[chartsDataItem]?.length > 0) {
        let getData = chartsData[chartsDataItem]
          ?.map((item) => {
            if (!item?.monitoringCompletedAt) {
              return null;
            }
            getSeriesY(chartsData, chartsDataItem)?.forEach((seriesItem) => {
              seriesY[seriesItem] = item?.[seriesItem]?.[activeSelection] || item?.[seriesItem];
            });
            let milliseconds = moment(item?.monitoringCompletedAt).valueOf();
            modelMonitorVersionsByMilliseconds[milliseconds] = item?.modelMonitorVersion;
            return {
              x: moment(item?.monitoringCompletedAt).format('DD/MM/YYYY hh:mm'),
              ...seriesY,
            };
          })
          .filter((v1) => v1 != null);

        if (getData != null) {
          data = {
            ...data,
            [chartsDataItem]: generateChartData(
              { data: getData.reverse(), yTitle: yTitles[chartsDataItem] },
              Object.keys(seriesY ?? {}).filter((s1) => s1?.toLowerCase() !== 'modelmonitorversion'.toLowerCase()),
              modelMonitorVersionsByMilliseconds,
            ),
          };
        }
      }
    });
    setModelData(data);
  };

  const getSummaryCharts = async () => {
    setIsSummaryProcessing(true);
    setSummary(null);
    setIsRefreshing(true);
    REClient_.client_().getModelMonitorSummary(modelMonitorId, (err, res) => {
      setIsRefreshing(false);
      if (err || !res?.success) {
        return null;
      } else {
        setSummary(res?.result);
        doWorkHistograms(res?.result);
      }
    });
  };

  useEffect(() => {
    if (!modelMonitorId) {
      return;
    }
    getSummaryCharts();
  }, [modelMonitorId]);

  const onChangeFeatureSel = (option1) => {
    setFeatureSelId(option1?.value);
  };

  const chartHH = 300;
  const projectId = paramsProp?.get('projectId');

  useEffect(() => {
    monitoring.memModelsById(true, modelMonitorId);
  }, [monitoringParam, modelMonitorId]);

  const monitorOne = useMemo(() => {
    return monitoring.memModelsById(false, modelMonitorId);
  }, [monitoringParam, modelMonitorId]);

  const isLastTraining = useMemo(() => {
    return [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(monitorOne?.latestMonitorModelVersion?.status);
  }, [monitorOne]);

  useEffect(() => {
    monitoring.memModelsByProjectId(true, projectId);
  }, [monitoringParam, projectId]);

  const monitorsList = useMemo(() => {
    return monitoring.memModelsByProjectId(false, projectId);
  }, [monitoringParam, projectId]);

  const optionsMonitors = useMemo(() => {
    return monitorsList?.map((v1, v1ind) => ({ label: v1?.name, value: v1?.modelMonitorId, data: v1 }));
  }, [monitorsList]);

  const onChangeMonitor = (option1) => {
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/' + option1?.value, undefined, Utils.processParamsAsQuery({ useModelMonitorVersion: null }, window.location.search));
  };

  let isAllEmpty = !(summary?.modelAccuracy?.length > 0) && !(summary?.modelDrift?.length > 0) && !(summary?.dataIntegrity?.length > 0) && !(summary?.biasViolations?.length > 0);
  if (isSummaryProcessing) {
    isAllEmpty = false;
  }
  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 20px;
      `}
    >
      <NanoScroller onlyVertical>
        <div>
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
                  <div css={``}>
                    <div>
                      <div style={{ margin: '20px', height: 0, paddingBottom: '30px', display: 'flex', justifyContent: 'flex-start' }}>
                        <span style={{ whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
                          <span>Summary</span>
                        </span>
                        <div
                          css={`
                            font-family: Matter;
                            font-size: 18px;
                            font-weight: 500;
                            line-height: 1.78;
                            margin-left: auto;
                            display: flex;
                            align-items: center;
                          `}
                        >
                          <span css={``}>Monitor:</span>
                          <span
                            css={`
                              font-size: 14px;
                              margin-left: 10px;
                            `}
                          >
                            <span
                              css={`
                                width: 340px;
                                display: inline-block;
                              `}
                            >
                              <SelectExt options={optionsMonitors} value={optionsMonitors?.find((v1) => v1.value === modelMonitorId)} onChange={onChangeMonitor} />
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <RefreshAndProgress
                      style={{ top: '70px' }}
                      isDim={isRefreshing || isLastTraining || (summary != null && isAllEmpty)}
                      msgMsg={isRefreshing || isLastTraining ? 'Processing...' : summary != null && isAllEmpty ? 'No Summary Metrics Yet' : undefined}
                      msgTop={100}
                    >
                      {summary?.modelAccuracy && summary?.modelAccuracy?.length > 0 && (
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
                            <div
                              css={`
                                margin: 20px;
                              `}
                            >
                              <div style={{ whiteSpace: 'nowrap', fontSize: '16px', marginBottom: '15px' }}>
                                <span>
                                  Model Accuracy
                                  <HelpIcon id={'monitor_summary_model_accuracy'} style={{ marginLeft: '4px' }} />
                                </span>
                              </div>
                              <div
                                css={`
                                  margin-top: 20px;
                                `}
                              >
                                <div
                                  css={`
                                    .ct-series-a .ct-circle.circleFeatures {
                                      fill: #57c0a1 !important;
                                    }
                                  `}
                                >
                                  <ChartMetricsFull backNormal forceColor={ColorsGradients} forMetrics noMax data={modelData?.modelAccuracy} height={chartHH} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {summary?.modelDrift && summary?.modelDrift?.length > 0 && monitorOne?.monitorType !== 'FEATURE_GROUP_MONITOR' && (
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
                            <div
                              css={`
                                margin: 20px;
                              `}
                            >
                              <div style={{ whiteSpace: 'nowrap', fontSize: '16px', marginBottom: '15px' }}>
                                <span>
                                  Model Drift
                                  <HelpIcon id={'monitor_summary_model_drift'} style={{ marginLeft: '4px' }} />
                                </span>
                              </div>
                              <div>
                                <Radio.Group
                                  css={`
                                    display: flex;
                                    margin-bottom: 10px;
                                  `}
                                  onChange={(e) => {
                                    onChangeChartOption(e, 'modelDrift');
                                  }}
                                  value={activeFeaturedIndex?.['modelDrift'] || 'distance'}
                                >
                                  {chartListOptions.map((item, index) => {
                                    return (
                                      summary?.modelDrift?.[0]?.labelDrift?.[item.title] && (
                                        <Radio value={item.title} key={index}>
                                          <span
                                            css={`
                                              color: white;
                                              font-size: 14px;
                                              text-transform: capitalize;
                                            `}
                                          >
                                            {item.field}
                                          </span>
                                        </Radio>
                                      )
                                    );
                                  })}
                                </Radio.Group>
                                <div
                                  css={`
                                    .ct-series-a .ct-circle.circleFeatures {
                                      fill: #57c0a1 !important;
                                    }
                                  `}
                                >
                                  <ChartMetricsFull backNormal forceColor={ColorsGradients} forMetrics noMax data={modelData?.modelDrift} height={chartHH} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {summary?.dataIntegrity && summary?.dataIntegrity?.length > 0 && (
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
                            <div
                              css={`
                                margin: 20px;
                              `}
                            >
                              <div style={{ whiteSpace: 'nowrap', fontSize: '16px', marginBottom: '15px' }}>
                                <span>
                                  Data Integrity
                                  <HelpIcon id={'monitor_summary_data_integrity'} style={{ marginLeft: '4px' }} />
                                </span>
                              </div>
                              <div>
                                <div
                                  css={`
                                    .ct-series-a .ct-circle.circleFeatures {
                                      fill: #57c0a1 !important;
                                    }
                                  `}
                                >
                                  <ChartMetricsFull backNormal forceColor={ColorsGradients} forMetrics noMax data={modelData?.dataIntegrity} height={chartHH} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {summary?.biasViolations && summary?.biasViolations?.length > 0 && (
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
                            <div
                              css={`
                                margin: 20px;
                              `}
                            >
                              <div style={{ whiteSpace: 'nowrap', fontSize: '16px', marginBottom: '15px' }}>
                                <span>
                                  Bias Violations
                                  <HelpIcon id={'monitor_summary_bias_violations'} style={{ marginLeft: '4px' }} />
                                </span>
                              </div>
                              <div>
                                <div
                                  css={`
                                    .ct-series-a .ct-circle.circleFeatures {
                                      fill: #57c0a1 !important;
                                    }
                                  `}
                                >
                                  <ChartMetricsFull backNormal forceColor={ColorsGradients} forMetrics noMax data={modelData?.biasViolations} height={chartHH} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </RefreshAndProgress>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NanoScroller>
    </div>
  );
});

export default MonitoringSummary;
