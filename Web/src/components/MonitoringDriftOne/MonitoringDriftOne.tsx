import { DatePicker } from 'antd';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import deployments from '../../stores/reducers/deployments';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import HelpBox from '../HelpBox/HelpBox';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./MonitoringDriftOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitoringDriftOneProps {}

const StyleLabel = styled.div`
  font-family: Matter;
  font-size: 12px;
  font-weight: 600;
  color: #f1f1f1;
`;

const MonitoringDriftOne = React.memo((props: PropsWithChildren<IMonitoringDriftOneProps>) => {
  const { deploymentsParam, paramsProp, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    monitoringParam: state.monitoring,
    deploymentsParam: state.deployments,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [featuresList, setFeaturesList] = useState([] as { name?; distance?; jsDistance? }[]);
  const [targetColumn, setTargetColumn] = useState(null);
  const [isRefreshingOverTime, setIsRefreshingOverTime] = useState(false);
  const [isRefreshingThroughput, setIsRefreshingThroughput] = useState(false);
  const [isNotYet, setIsNotYet] = useState(false);
  const [isNotYetNeverDone, setIsNotYetNeverDone] = useState(true);

  const [isRefreshingThroughputTarget, setIsRefreshingThroughputTarget] = useState(false);

  const [throughputResTarget, setThroughputResTarget] = useState(null);
  const [throughputRes, setThroughputRes] = useState(null);

  const [rangeDates, setRangeDates] = useState(() => {
    let res = [moment().startOf('day').add(-6, 'days'), moment().startOf('day').add(1, 'days')];

    let dt1 = Utils.tryParseInt(paramsProp?.get('rangeFrom'));
    let dt2 = Utils.tryParseInt(paramsProp?.get('rangeTo'));
    if (dt1 != null && dt2 != null && _.isNumber(dt1) && _.isNumber(dt2)) {
      res = [moment.unix(dt1), moment.unix(dt2)];
    }

    return res;
  });
  // const [overTimeRes, setOverTimeRes] = useState(null);
  const [featureSel, setFeatureSel] = useState(null);
  const [region, setRegion] = useState(null);
  const [regionsList, setRegionsList] = useState(null);

  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);

  const [summary, setSummary] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const deployId = paramsProp?.get('deployId');

  const neverDoneRef = useRef(null);

  useEffect(() => {
    if (neverDoneRef.current != null) {
      clearTimeout(neverDoneRef.current);
      neverDoneRef.current = null;
    }
    setIsNotYetNeverDone(true);
  }, [projectId, deployId]);

  useEffect(() => {
    if (!deployId) {
      if (neverDoneRef.current != null) {
        clearTimeout(neverDoneRef.current);
        neverDoneRef.current = null;
      }
      neverDoneRef.current = setTimeout(() => {
        setIsNotYetNeverDone(false);
      }, 1000);
      return;
    }

    REClient_.client_()._getFeatureDriftSummary(deployId, Utils.momentFormatForPython(rangeDates?.[0]), Utils.momentFormatForPython(rangeDates?.[1]), (err, res) => {
      if (neverDoneRef.current != null) {
        clearTimeout(neverDoneRef.current);
        neverDoneRef.current = null;
      }
      neverDoneRef.current = setTimeout(() => {
        setIsNotYetNeverDone(false);
      }, 1000);

      //
      if (err || !res?.success) {
        //
      } else {
        const startDate = res?.result?.start_date ?? res?.result?.startDate;
        const endDate = res?.result?.end_date ?? res?.result?.endDate;

        const calcDate = (value) => {
          let res = value;

          if (value != null && _.isString(value)) {
            if (value.indexOf('Z') === -1) {
              res = moment.utc(value);
            } else {
              res = moment(value);
            }
          } else if (value != null) {
            res = moment(value);
          }

          return res;
        };

        setSummary(res?.result);

        let startDt = calcDate(startDate);
        let endDt = calcDate(endDate);
        setMinDate(startDt);
        setMaxDate(endDt);

        // let datesRanges = [moment().startOf('day').add(-1, 'days'), moment().startOf('day')];

        // setRangeDates(datesRanges);

        let features = res?.result?.featureIndex ?? res?.result?.features ?? [];
        setFeaturesList(features);
        let f1 = features?.[0]?.name;
        setFeatureSel(f1);

        let targetColumn1 = res?.result?.targetColumn;
        if (features == null || !features?.find((s1) => s1.name === targetColumn1)) {
          targetColumn1 = null;
        }
        setTargetColumn(targetColumn1 ?? null);
      }
    });
  }, [deployId, rangeDates]);

  // useEffect(() => {
  //   if(deployId && rangeDates && rangeDates?.[0] && rangeDates?.[1] && region) {
  //     setIsRefreshingOverTime(true);
  //     //hourly, daily, or weekly"
  //     REClient_.client_()._getAccessStatisticsOverTime(deployId, Utils.momentFormatForPython(rangeDates?.[0]), Utils.momentFormatForPython(rangeDates?.[1]), undefined, region, (err, res) => {
  //       setIsRefreshingOverTime(false);
  //       if(err || !res?.success) {
  //         setOverTimeRes(null);
  //       } else {
  //         setOverTimeRes(res?.result);
  //       }
  //     });
  //   }
  // }, [deployId, rangeDates, region]);

  useEffect(() => {
    if (deployId && targetColumn && rangeDates && rangeDates?.[0] && rangeDates?.[1]) {
      setIsRefreshingThroughputTarget(true);
      REClient_.client_()._getFeatureDriftSingleFeatureDistribution(deployId, Utils.momentFormatForPython(rangeDates?.[0]), Utils.momentFormatForPython(rangeDates?.[1]), targetColumn, (err, res) => {
        setIsRefreshingThroughputTarget(false);
        if (err || !res?.success) {
          setThroughputResTarget(null);
        } else {
          setThroughputResTarget(res?.result);
        }
      });
    }
  }, [targetColumn, rangeDates, deployId]);

  useEffect(() => {
    if (deployId && featureSel && rangeDates && rangeDates?.[0] && rangeDates?.[1]) {
      setIsRefreshingThroughput(true);
      REClient_.client_()._getFeatureDriftSingleFeatureDistribution(deployId, Utils.momentFormatForPython(rangeDates?.[0]), Utils.momentFormatForPython(rangeDates?.[1]), featureSel, (err, res) => {
        setIsRefreshingThroughput(false);
        if (err || !res?.success) {
          setThroughputRes(null);
        } else {
          setThroughputRes(res?.result);
        }
      });
    }
  }, [featureSel, rangeDates, deployId]);

  const chartHH = 300;

  const onChangeRangeDates = (values) => {
    let range1 = values?.[0]?.unix();
    let range2 = values?.[1]?.unix();

    if (range1 != null && range2 != null) {
      Location.push('/' + paramsProp?.get('mode') + '/' + paramsProp?.get('projectId') + '/' + paramsProp?.get('deployId'), undefined, 'rangeFrom=' + (range1 ?? '') + '&rangeTo=' + (range2 ?? ''));
    }

    setRangeDates(values);
  };

  const rangesPickerDates = useMemo(() => {
    return {
      'Last Day': [moment().startOf('day').add(-1, 'days'), moment().startOf('day')],
      'Last Week': [moment().startOf('day').add(-7, 'days'), moment().startOf('day')],
      'Last Month': [moment().startOf('day').add(-1, 'month'), moment().startOf('day')],
    };
  }, []);

  // const driftValue = useMemo(() => {
  //   return throughputRes?.distance==null ? '-' : Utils.decimals(throughputRes?.distance, 3);
  // }, [throughputRes]);

  useEffect(() => {
    deployments.memDeployForProject(false, undefined, projectId);
  }, [deploymentsParam, projectId]);
  let deployList = useMemo(() => {
    return deployments.memDeployForProject(false, undefined, projectId);
  }, [deploymentsParam, projectId]);

  const deployOne = useMemo(() => {
    return deployList?.find((d1) => d1.deploymentId === deployId);
  }, [deployList, deployId]);

  useEffect(() => {
    let deploy1 = deployList?.find((d1) => d1.deploymentId === deployId);
    setRegionsList(deploy1?.regions);
    setRegion(deploy1?.regions?.[0]?.value);
  }, [deployList, deployId]);

  let optionsDeploys = useMemo(() => {
    return deployList?.map((d1) => {
      return {
        label: d1.name,
        value: d1.deploymentId,
      };
    });
  }, [deployList]);
  let optionsDeploysSel = optionsDeploys?.find((d1) => d1.value === deployId);

  const onChangeSelectDeployment = (option1) => {
    if (option1?.value) {
      Location.push('/' + PartsLink.monitoring_drift + '/' + paramsProp?.get('projectId') + '/' + option1?.value);
    }
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  let deploymentSelect = useMemo(() => {
    return (
      <span style={{ width: '340px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );
  }, [optionsDeploys, optionsDeploysSel, onChangeSelectDeployment]);

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

  let regionSelect = useMemo(() => {
    return (
      <span style={{ width: '140px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt value={optionsRegionsSel} options={optionsRegions} onChange={onChangeSelectRegion} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );
  }, [optionsRegions, optionsRegionsSel, onChangeSelectRegion]);

  // const threshold = useMemo(() => {
  //   let v1 = driftValue ?? 1;
  //   v1 = Math.ceil(v1+0.5);
  //   return Math.max(3, v1);
  // }, [driftValue]);

  const calcCharts = (throughputRes) => {
    let data1 = [],
      data2 = null,
      colorFixed = null;

    let isBar = false,
      seriesY = ['Prediction Data', 'Training Data'];
    let type1 = throughputRes?.type;
    if (type1) {
      if (['multivaluecategorical', 'CATEGORICAL_LIST'.toLowerCase(), 'categorical'].includes(type1.toLowerCase() ?? '-')) {
        type1 = 'categorical';

        //
        isBar = true;
        colorFixed = ['#224199', '#972c8c'];
      }

      let dataDistribution;
      let dataTrainingDistribution;
      if (type1?.toLowerCase() === 'numerical') {
        dataDistribution = throughputRes?.numericalPredictionDistribution ?? throughputRes?.numericalDistribution ?? throughputRes?.categoricalDistribution;
        dataTrainingDistribution = throughputRes?.numericalTrainingDistribution ?? throughputRes?.categoricalTrainingDistribution;
      } else {
        dataDistribution = throughputRes?.predictionDistribution ?? throughputRes?.categoricalDistribution ?? throughputRes?.predictionDistribution;
        dataTrainingDistribution = throughputRes?.trainingDistribution ?? throughputRes?.categoricalTrainingDistribution ?? throughputRes?.trainingDistribution;
      }
      dataDistribution = dataDistribution ?? [];
      dataTrainingDistribution = dataTrainingDistribution ?? [];

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

      const by100 = (v1) => {
        return v1 == null || !_.isNumber(v1) ? null : v1 * 100;
      };

      let isNumeric = false;
      let kk = Object.keys(dataDistribution);
      if (type1.toLowerCase() === 'numerical') {
        isNumeric = true;

        data2 = [];

        dataDistribution?.some((k1, k1ind, t1ind) => {
          let d1 = { x: k1.x };

          d1['Prediction Data'] = by100(k1.y); //findVal(dataDistribution, k1);

          data1.push(d1);
        });
        dataTrainingDistribution?.some((k1, k1ind, t1ind) => {
          let d1 = { x: k1.x };

          d1['Training Data'] = by100(k1.y); //findVal(dataTrainingDistribution, k1);

          data2.push(d1);
        });
      } else {
        kk?.some((k1, k1ind, t1ind) => {
          let d1 = { x: k1 };

          d1['Prediction Data'] = by100(findVal(dataDistribution, k1));
          d1['Training Data'] = by100(findVal(dataTrainingDistribution, k1));

          data1.push(d1);
        });
      }
    }

    let notYet1 = false;
    if (data1 == null || data1.length === 0) {
      notYet1 = true;
    }

    setIsNotYet(notYet1);

    const calcRes = (data0, index = null) => {
      let intervalXcalc;
      if (data2 === null) {
        if (data0 != null && _.isArray(data0) && data0.length > 8) {
          intervalXcalc = 10;
        }
      }

      let res: any = {
        tooltipValueLabel: 'Value: ',
        isBar: true,
        useTitles: true,
        titleX: index == null ? 'Value' : `Average Bucket Value`,
        titleY: index == null ? 'Frequency %' : 'Frequency in Distribution',
        seriesY: index == null ? seriesY : [seriesY?.[index]],
        fieldNameTooltip: index == null ? seriesY : [seriesY?.[index]],
        tooltipFormatExt: (v1) => (v1 == null ? null : Utils.decimals(v1, 2) + '%'),
        maxDecimalsTooltip: 2,
        data: data0,
        labelMaxChars: 30,
        colorFixed,
        useLegend: true,
        intervalX: null, //data2==null ? intervalXcalc : 10,
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

    if (data2 == null) {
      return calcRes(data1);
    } else {
      return [calcRes(data1, 0), calcRes(data2, 1)];
    }
  };

  const topPredFeatures = useMemo(() => {
    let list = [...(featuresList ?? [])];

    if (targetColumn) {
      let ind1 = _.findIndex(list, (s1) => s1.name === targetColumn);
      if (ind1 > -1) {
        list.splice(ind1, 1);
      }
    }

    return list;
  }, [featuresList, targetColumn]);

  const dataDriftOneTarget = useMemo(() => {
    return calcCharts(throughputResTarget);
  }, [throughputResTarget]);

  const wwCol1 = 96 - 12;

  const elemWW = 170 + 4 * wwCol1;
  const chartHH2 = 200;

  const calcIsSelectedFeature = useCallback(
    (index) => {
      let row = topPredFeatures?.[index];
      if (row) {
        return row?.name === featureSel;
      }
    },
    [topPredFeatures, featureSel],
  );

  const dataDriftOne = useMemo(() => {
    return calcCharts(throughputRes);
  }, [throughputRes]);

  const columnsFeatures = useMemo(() => {
    return [
      {
        title: 'Feature Name',
        field: 'name',
      },
      {
        title: 'KL',
        field: 'distance',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        width: wwCol1,
        helpTooltip: 'Kullback–Leibler divergence',
        align: 'right',
      },
      {
        align: 'right',
        title: 'JS',
        field: 'jsDistance',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        width: wwCol1,
        helpTooltip: 'Jensen–Shannon divergence',
      },
      {
        align: 'right',
        title: 'WS',
        field: 'wsDistance',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        width: wwCol1,
        helpTooltip: 'Wasserstein Distance',
      },
      {
        align: 'right',
        title: 'KS',
        field: 'ksStatistic',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        width: wwCol1,
        helpTooltip: 'KS Statistic',
      },
    ] as ITableExtColumn[];
  }, [featureSel, wwCol1]);

  const onClickRowTopFeature = (row) => {
    setFeatureSel(row?.name);
  };

  const showTop = useMemo(() => {
    return featuresList == null || !Utils.isNullOrEmpty(targetColumn);
  }, [featuresList, targetColumn]);

  const targetHH = useMemo(() => {
    return showTop ? 240 : 0;
  }, [showTop]);

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
            Model Drift for{' '}
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
        <div>
          <HelpBox name={'Monitoring'} beforeText={''} linkTo={'/help/modelMonitoring/creating_monitor'} />
        </div>
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
            {
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
                  <span>Feature Drift{false ? ' vs Feature Importance' : ''}</span>

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
                      <DatePicker.RangePicker ranges={rangesPickerDates as any} allowClear={false} value={rangeDates as any} onChange={onChangeRangeDates} />
                    </div>
                  </span>

                  {/*<span css={`margin-left: 30px;`}>*/}
                  {/*  <StyleLabel>Drift:</StyleLabel>*/}
                  {/*</span>*/}
                  {/*<span css={`font-size: 14px; margin-left: 10px;`}>*/}
                  {/*  {driftValue}*/}
                  {/*</span>*/}

                  {/*<span css={`margin-left: 30px;`}>*/}
                  {/*  <StyleLabel>Threshold:</StyleLabel>*/}
                  {/*</span>*/}
                  {/*<span css={`font-size: 14px; margin-left: 10px;`}>*/}
                  {/*  <EditNumberSpan step={0.1} value={threshold} onNullShow={'-'} min={0} max={10} />*/}
                  {/*</span>*/}
                </div>
              </div>
            }

            <div
              css={`
                display: flex;
                margin: 20px;
                top: 60px;
              `}
              className={sd.absolute}
            >
              <div
                css={`
                  flex: 1;
                  margin-right: 5px;
                `}
              >
                <div css={``}>
                  <div css={``}>
                    <RefreshAndProgress msgTop={isNotYet || isNotYetNeverDone ? 25 : undefined} msgMsg={isNotYetNeverDone ? 'Loading...' : isNotYet ? 'No Data Yet' : undefined} isDim={isNotYet || isNotYetNeverDone}>
                      {showTop && (
                        <div
                          css={`
                            margin: 0 15px;
                          `}
                        >
                          <div
                            css={`
                              font-family: Matter;
                              font-size: 18px;
                              font-weight: 500;
                              line-height: 1.78;
                              margin-top: 10px;
                              margin-bottom: 10px;
                            `}
                          >
                            <span>Prediction Drift:</span>
                            <span
                              css={`
                                margin-left: 10px;
                              `}
                            >
                              {Utils.decimals(summary?.predictionDrift, 3) ?? '-'}
                            </span>
                          </div>
                        </div>
                      )}

                      {showTop && (
                        <div
                          css={`
                            display: flex;
                            top: 40px;
                            height: ${targetHH}px;
                            position: absolute;
                            left: 0;
                            right: 0;
                          `}
                        >
                          <div
                            css={`
                              margin: 15px;
                              flex: 1;
                            `}
                          >
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
                                Prediction Drift Distribution
                                {targetColumn != null && (
                                  <span
                                    css={`
                                      margin-left: 5px;
                                      opacity: 0.9;
                                    `}
                                  >
                                    {' '}
                                    ({targetColumn})
                                  </span>
                                )}
                              </span>
                            </div>
                            {throughputResTarget != null && (
                              <div
                                css={`
                                  font-size: 14px;
                                  margin-top: -3px;
                                `}
                              >
                                {throughputResTarget?.predictionStatistics?.mean != null && (
                                  <span
                                    css={`
                                      opacity: 0.8;
                                    `}
                                  >
                                    Prediction Avg:
                                  </span>
                                )}
                                {throughputResTarget?.predictionStatistics?.mean != null && (
                                  <span
                                    css={`
                                      margin-left: 5px;
                                    `}
                                  >
                                    {Utils.decimals(throughputResTarget?.predictionStatistics?.mean, 2)}
                                  </span>
                                )}
                                {throughputResTarget?.trainingStatistics?.mean != null && (
                                  <span
                                    css={`
                                      margin-left: ${throughputResTarget?.predictionStatistics?.mean != null ? 10 : 0}px;
                                      opacity: 0.8;
                                    `}
                                  >
                                    Training Avg:
                                  </span>
                                )}
                                {throughputResTarget?.trainingStatistics?.mean != null && (
                                  <span
                                    css={`
                                      margin-left: 5px;
                                    `}
                                  >
                                    {Utils.decimals(throughputResTarget?.trainingStatistics?.mean, 2)}
                                  </span>
                                )}
                              </div>
                            )}

                            <div css={``}>
                              <AutoSizer disableHeight>
                                {({ width }) => (
                                  <div>
                                    {dataDriftOneTarget != null && !_.isArray(dataDriftOneTarget) && (
                                      <ChartXYExt colorFixed={dataDriftOneTarget?.colorFixed} useEC data={dataDriftOneTarget} width={width} height={chartHH2} startColorIndex={0} />
                                    )}

                                    {dataDriftOneTarget != null && _.isArray(dataDriftOneTarget) && (
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
                                          <ChartXYExt colorFixed={dataDriftOneTarget?.[0]?.colorFixed} useEC data={dataDriftOneTarget?.[0]} width={width / 2 - 10} height={chartHH2} startColorIndex={0} />
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
                                          <ChartXYExt colorFixed={dataDriftOneTarget?.[1]?.colorFixed} useEC data={dataDriftOneTarget?.[1]} width={width / 2 - 10} height={chartHH2} startColorIndex={1} />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </AutoSizer>
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        css={`
                          display: flex;
                          top: ${40 + targetHH}px;
                          bottom: 10px;
                          position: absolute;
                          left: 0;
                          right: 0;
                        `}
                      >
                        <div
                          css={`
                            margin: 15px;
                            width: ${elemWW}px;
                            position: relative;
                          `}
                        >
                          <AutoSizer disableWidth>
                            {({ height }) => (
                              <div css={``}>
                                <div
                                  css={`
                                    font-family: Matter;
                                    font-size: 18px;
                                    font-weight: 500;
                                    line-height: 1.78;
                                    margin-top: 10px;
                                    margin-bottom: 10px;
                                  `}
                                >
                                  Feature Drift
                                </div>
                                <div
                                  css={`
                                    top: 50px;
                                    height: ${height - 40}px;
                                    position: absolute;
                                    left: 0;
                                    right: 0;
                                  `}
                                >
                                  <TableExt calcIsSelected={calcIsSelectedFeature} isVirtual height={height - 40} dataSource={topPredFeatures} columns={columnsFeatures} onClickCell={onClickRowTopFeature} />
                                </div>
                              </div>
                            )}
                          </AutoSizer>
                        </div>

                        <div
                          css={`
                            margin: 15px;
                            flex: 1;
                          `}
                        >
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
                              {featureSel != null && (
                                <span
                                  css={`
                                    margin-left: 5px;
                                    opacity: 0.9;
                                  `}
                                >
                                  for {featureSel}
                                </span>
                              )}
                            </span>
                          </div>

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
                        </div>
                      </div>
                    </RefreshAndProgress>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NanoScroller>
      </div>
    </div>
  );
});

export default MonitoringDriftOne;
