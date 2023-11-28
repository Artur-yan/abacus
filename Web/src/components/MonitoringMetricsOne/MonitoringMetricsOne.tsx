import { DatePicker } from 'antd';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import deployments from '../../stores/reducers/deployments';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import HelpBox from '../HelpBox/HelpBox';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./MonitoringMetricsOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitoringMetricsOneProps {}

const StyleLabel = styled.div`
  font-family: Matter;
  font-size: 12px;
  font-weight: 600;
  color: #f1f1f1;
`;

const MonitoringMetricsOne = React.memo((props: PropsWithChildren<IMonitoringMetricsOneProps>) => {
  const { deploymentsParam, paramsProp, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    monitoringParam: state.monitoring,
    deploymentsParam: state.deployments,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshingOverTime, setIsRefreshingOverTime] = useState(false);
  const [isNotYet, setIsNotYet] = useState(false);

  const [overTimeRangeDates, setOverTimeRangeDates] = useState(() => {
    let res = [moment().startOf('day').add(-6, 'days'), moment().startOf('day').add(1, 'days')];

    let dt1 = Utils.tryParseInt(paramsProp?.get('rangeFrom'));
    let dt2 = Utils.tryParseInt(paramsProp?.get('rangeTo'));
    if (dt1 != null && dt2 != null && _.isNumber(dt1) && _.isNumber(dt2)) {
      res = [moment.unix(dt1), moment.unix(dt2)];
    }

    return res;
  });
  const [overTimeRes, setOverTimeRes] = useState(null);
  const [region, setRegion] = useState(null);
  const [regionsList, setRegionsList] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  const deployId = paramsProp?.get('deployId');

  useEffect(() => {
    if (!deployId) {
      return;
    }

    // REClient_.client_()._getFeatureDriftSummary(deployId, (err, res) => {
    //   if(err || !res?.success) {
    //     //
    //   } else {
    //     let datesRanges = [moment().startOf('day').add(-1, 'days'), moment().startOf('day')];
    //
    //     setOverTimeRangeDates(datesRanges);
    //   }
    // });
  }, [deployId]);

  useEffect(() => {
    if (deployId && overTimeRangeDates && overTimeRangeDates?.[0] && overTimeRangeDates?.[1] && region) {
      setIsRefreshingOverTime(true);
      //hourly, daily, or weekly"
      REClient_.client_()._getAccessStatisticsOverTime(deployId, Utils.momentFormatForPython(overTimeRangeDates?.[0]), Utils.momentFormatForPython(overTimeRangeDates?.[1]), undefined, region, (err, res) => {
        setIsRefreshingOverTime(false);
        if (err || !res?.success) {
          setOverTimeRes(null);
        } else {
          setOverTimeRes(res?.result);
        }
      });
    }
  }, [deployId, overTimeRangeDates, region]);

  const { dataOverTime, requestsOverTime } = useMemo(() => {
    let dataLatency = [],
      dataRequests = [];

    const latencySeries = overTimeRes?.latencySeries ?? [];
    const dateLabels = overTimeRes?.dateLabels;

    let requestsSeriesList = [],
      requestsSeriesListSuffix = [],
      requestSeriesAxis2 = [],
      requestSeriesAxisLog = [];
    let latencySeriesList = [],
      latencySeriesListSuffix = [];

    let xAxisLinesRequests = [];

    if (_.isArray(latencySeries)) {
      latencySeries?.some((s1, s1ind) => {
        latencySeriesList.push(s1.name);
        latencySeriesListSuffix.push(s1.tooltipSuffix ?? s1.tooltip_suffix ?? '');
      });
      overTimeRes?.requestSeries?.some((s1, s1ind) => {
        requestsSeriesList.push(s1.name);
        requestsSeriesListSuffix.push(s1.tooltipSuffix ?? s1.tooltip_suffix ?? '');
        requestSeriesAxis2.push(!!(s1.isSecondAxis ?? s1.is_second_axis));
        requestSeriesAxisLog.push(s1.isLogAxis ?? s1.is_log_axis ? 'log' : undefined);
      });

      latencySeries?.[0]?.data?.some((t1, t1ind) => {
        let dt1: any = t1ind;
        if (dateLabels && dateLabels[t1ind]) {
          let m1 = moment.utc(dateLabels[t1ind]).utcOffset(0, true);
          dt1 = m1.toDate();

          if (m1.minutes() === 0 && m1.seconds() === 0 && m1.hours() % 4 == 0 && m1.hours() !== 0) {
            xAxisLinesRequests.push(dt1);
          }
        }

        let obj1: any = {
          x: dt1,
        };
        latencySeries?.some((s1, s1ind) => {
          obj1[s1.name] = s1.data?.[t1ind];
        });
        dataLatency.push(obj1);

        //
        let obj2: any = {
          x: dt1,
        };
        overTimeRes?.requestSeries?.some((s1, s1ind) => {
          let v1 = s1.data?.[t1ind];
          obj2[s1.name] = v1;
        });

        dataRequests.push(obj2);
      });
    }

    let dataOverTime = {
      useUTC: true,
      useTitles: true,
      titleX: 'Date',
      titleY: 'Latency in Milliseconds',
      // seriesY: ['AverageLatency', 'MedianLatency', 'MaxLatency', 'MinLatency',],
      // fieldNameTooltip: ['AverageLatency', 'MedianLatency', 'MaxLatency', 'MinLatency',],
      seriesY: latencySeriesList,
      fieldNameTooltip: latencySeriesList,
      maxDecimalsTooltip: 2,
      axisYdecimals: 0,
      data: dataLatency,
      dateX: true,
      xAxisLines: xAxisLinesRequests,
      xAxisSplitLine: {
        show: true,
        lineStyle: {
          type: 'solid',
        },
      },
      useLegend: true,
      tooltipFormatExt: (v1, ind) => '' + Utils.decimals(v1, 2) + ' ' + (latencySeriesListSuffix?.[ind] ?? ''),
      dateOnTooltip: true,
      dateOnTooltipDiv: 1000,
      dataZoomX: true,
    };

    let numDecimalsList = overTimeRes?.requestSeries?.map((s1) => s1.num_decimals ?? s1.numDecimals);
    let axis2index = overTimeRes?.requestSeries?.findIndex((s1) => s1.isSecondAxis ?? s1.is_second_axis);

    let symbolList = [];
    requestsSeriesList?.some((s1) => {
      symbolList.push('circle');
    });

    let requestsOverTime = {
      useUTC: true,
      useTitles: true,
      titleX: 'Date',
      titleY: requestsSeriesList?.[0],
      titleY2: requestsSeriesList?.[1],
      yAxisMaxList: ['dataMax', 'dataMax'],
      yAxisMinList: [0, undefined],
      axis1Gap: 50,
      axis2Gap: 50,
      seriesY: requestsSeriesList,
      fieldNameTooltip: requestsSeriesList,
      // fieldNameTooltip: ['Ingress', 'Egress', 'Total',],
      maxDecimalsTooltip: 2,
      axisYdecimals: null,
      data: dataRequests,
      dateX: true,
      axis2index,
      xAxisLines: xAxisLinesRequests,
      xAxisSplitLine: {
        show: true,
        lineStyle: {
          type: 'solid',
        },
      },
      useTwoYAxis: requestSeriesAxis2,
      axis2type: requestSeriesAxisLog?.[axis2index] === 'log' ? 'log' : undefined,
      useLegend: true,
      useLegendSeriesIndex: true,
      axisY1decimals: 3,
      tooltipFormatExt: (v1, ind) => '' + Utils.decimals(v1, numDecimalsList?.[ind] ?? 2, true) + ' ' + (requestsSeriesListSuffix?.[ind] ?? ''),
      // tooltipFormatExt: (v1, ind) => (''+Utils.decimals(v1, 2)+' QPS'),
      dateOnTooltip: true,
      dateOnTooltipDiv: 1000,
      dataZoomX: true,
      symbol: symbolList,
      showSymbolPerc: 0.2,
    };

    let isEmpty1 = false;
    if ((dataLatency == null || dataLatency.length === 0) && (dataRequests == null || dataRequests.length === 0)) {
      isEmpty1 = true;
    }

    setIsNotYet(isEmpty1);

    return { dataOverTime, requestsOverTime };
  }, [overTimeRes]);

  const chartHH = 340;

  const onChangeOvertimeRangeDates = (values) => {
    let range1 = values?.[0]?.unix();
    let range2 = values?.[1]?.unix();

    if (range1 != null && range2 != null) {
      Location.push('/' + paramsProp?.get('mode') + '/' + paramsProp?.get('projectId') + '/' + paramsProp?.get('deployId'), undefined, 'rangeFrom=' + (range1 ?? '') + '&rangeTo=' + (range2 ?? ''));
    }

    setOverTimeRangeDates(values);
  };

  const rangesPickerDates = useMemo(() => {
    return {
      'Last Day': [moment().startOf('day').add(-1, 'days'), moment().startOf('day')],
      'Last Week': [moment().startOf('day').add(-7, 'days'), moment().startOf('day')],
      'Last Month': [moment().startOf('day').add(-1, 'month'), moment().startOf('day')],
    };
  }, []);

  useEffect(() => {
    deployments.memDeployForProject(false, undefined, projectId);
  }, [deploymentsParam, projectId]);
  let deployList = useMemo(() => {
    return deployments.memDeployForProject(false, undefined, projectId);
  }, [deploymentsParam, projectId]);

  useEffect(() => {
    let deploy1 = deployList?.find((d1) => d1.deploymentId === deployId);
    setRegionsList(deploy1?.regions);
    setRegion(deploy1?.regions?.[0]?.value);
  }, [deployList, deployId]);

  let optionsRegions = useMemo(() => {
    return regionsList?.map((d1) => {
      return {
        label: d1.name,
        value: d1.value,
      };
    });
  }, [regionsList]);
  let optionsRegionsSel = optionsRegions?.find((d1) => d1.value === region);

  const onChangeSelectRegion = (option1) => {
    setRegion(option1?.value);
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  let regionSelect = useMemo(() => {
    return (
      <span style={{ width: '140px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt value={optionsRegionsSel} options={optionsRegions} onChange={onChangeSelectRegion} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );
  }, [optionsRegions, optionsRegionsSel, onChangeSelectRegion]);

  let optionsDeploys = useMemo(() => {
    return deployList?.map((d1) => {
      return {
        label: d1.name,
        value: d1.deploymentId,
      };
    });
  }, [deployList]);
  let optionsDeploysSel = useMemo(() => {
    return optionsDeploys?.find((d1) => d1.value === deployId);
  }, [optionsDeploys, deployId]);

  const onChangeSelectDeployment = (option1) => {
    if (option1?.value) {
      Location.push('/' + PartsLink.monitoring_metrics + '/' + paramsProp?.get('projectId') + '/' + option1?.value);
    }
  };

  let deploymentSelect = useMemo(() => {
    return (
      <span style={{ width: '340px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );
  }, [optionsDeploys, optionsDeploysSel, onChangeSelectDeployment]);

  const deployOne = useMemo(() => {
    return deployList?.find((d1) => d1.deploymentId === deployId);
  }, [deployList, deployId]);

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
          <span
            css={`
              @media screen and (max-width: 1180px) {
                display: none;
              }
            `}
          >
            Real-Time Metrics for{' '}
          </span>
          Deployment:
        </span>
        <div>{deploymentSelect}</div>
        {optionsRegions?.length > 1 && (
          <div
            css={`
              margin-left: 20px;
              font-size: 14px;
            `}
          >
            Region:
          </div>
        )}
        {optionsRegions?.length > 1 && (
          <div
            css={`
              margin-left: 5px;
            `}
          >
            {regionSelect}
          </div>
        )}
        <div
          css={`
            flex: 1;
          `}
        ></div>
        <div>{<HelpBox name={'Monitoring'} beforeText={''} linkTo={'/help/modelMonitoring/add_monitoring'} />}</div>
      </div>
      <div
        css={`
          position: absolute;
          top: ${topAfterHeaderHH}px;
          left: 0;
          right: 0;
          bottom: 0;
          margin: 20px;
        `}
      >
        <NanoScroller onlyVertical>
          <div>
            {Constants.flags.model_metrics_latency_chart && (
              <div>
                <div
                  css={`
                    font-family: Matter;
                    font-size: 18px;
                    font-weight: 500;
                    line-height: 1.78;
                    margin-left: 20px;
                    margin-top: 30px;
                    display: flex;
                    align-items: center;
                  `}
                >
                  <span>Latency</span>

                  <span
                    css={`
                      margin-left: 30px;
                    `}
                  >
                    <StyleLabel>Time Range:</StyleLabel>
                  </span>
                  <span
                    css={`
                      margin-left: 10px;
                    `}
                  >
                    <div
                      css={`
                        margin-left: 5px;
                        width: 200px;
                      `}
                    >
                      <DatePicker.RangePicker ranges={rangesPickerDates as any} allowClear={false} value={overTimeRangeDates as any} onChange={onChangeOvertimeRangeDates} />
                    </div>
                  </span>
                </div>

                <div
                  css={`
                    margin: 15px 30px 10px 30px;
                    height: ${chartHH}px;
                    border-radius: 10px;
                    background-color: #19232f;
                    padding: 10px;
                  `}
                >
                  <RefreshAndProgress isRefreshing={isRefreshingOverTime} isRelative msgTop={isNotYet ? 25 : undefined} msgMsg={isNotYet ? 'No Real-Time Metrics Yet' : undefined} isDim={isNotYet}>
                    {dataOverTime != null && <ChartXYExt useEC data={dataOverTime} height={chartHH - 20} startColorIndex={7} />}
                  </RefreshAndProgress>
                </div>
              </div>
            )}

            <div
              css={`
                margin-top: 20px;
              `}
            >
              <div
                css={`
                  font-family: Matter;
                  font-size: 18px;
                  font-weight: 500;
                  line-height: 1.78;
                  margin-left: 20px;
                  margin-top: 10px;
                `}
              >
                Requests
              </div>

              <div
                css={`
                  margin: 15px 30px 50px 30px;
                  height: ${chartHH}px;
                  border-radius: 10px;
                  background-color: #19232f;
                  padding: 10px;
                `}
              >
                <RefreshAndProgress isRefreshing={isRefreshingOverTime} isRelative msgTop={isNotYet ? 25 : undefined} msgMsg={isNotYet ? 'No Real-Time Metrics Yet' : undefined} isDim={isNotYet}>
                  {requestsOverTime != null && <ChartXYExt useEC data={requestsOverTime} height={chartHH - 20} startColorIndex={0} />}
                </RefreshAndProgress>
              </div>
            </div>

            <div
              css={`
                margin-top: 50px;
              `}
            >
              &nbsp;
            </div>
          </div>
        </NanoScroller>
      </div>
    </div>
  );
});

export default MonitoringMetricsOne;
