import Button from 'antd/lib/button';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import batchPred, { BatchPredLifecycle } from '../../stores/reducers/batchPred';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import DateOld from '../DateOld/DateOld';
import HelpBox from '../HelpBox/HelpBox';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./MonitoringDriftBPOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitoringDriftBPOneProps {}

const StyleLabel = styled.div`
  font-family: Matter;
  font-size: 12px;
  font-weight: 600;
  color: #f1f1f1;
`;

const MonitoringDriftBPOne = React.memo((props: PropsWithChildren<IMonitoringDriftBPOneProps>) => {
  const { batchPredParam, deploymentsParam, paramsProp, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    monitoringParam: state.monitoring,
    deploymentsParam: state.deployments,
    batchPredParam: state.batchPred,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [featuresList, setFeaturesList] = useState([]);
  const [isRefreshingThroughput, setIsRefreshingThroughput] = useState(false);
  const [isRefreshingThroughputTarget, setIsRefreshingThroughputTarget] = useState(false);

  const [isNotYet, setIsNotYet] = useState(false);
  const [isNotYetNeverDone, setIsNotYetNeverDone] = useState(true);
  const [targetColumn, setTargetColumn] = useState(null);

  const [throughputResTarget, setThroughputResTarget] = useState(null);
  const [throughputRes, setThroughputRes] = useState(null);

  const [featureSel, setFeatureSel] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  let deployId = paramsProp?.get('deployId');
  if (deployId === '') {
    deployId = null;
  }

  const neverDoneRef = useRef(null);

  useEffect(() => {
    batchPred.memBatchList(undefined, projectId, null, true);
  }, [projectId, batchPredParam]);
  const batchList = useMemo(() => {
    return batchPred.memBatchList(undefined, projectId, null, false);
  }, [projectId, batchPredParam]);

  const uBId1 = paramsProp?.get('useBatchPredId');
  const useBatchPredId = useMemo(() => {
    let res = uBId1;
    if (Utils.isNullOrEmpty(res)) {
      res = batchList?.[0]?.batchPredictionId;
    }
    return res;
  }, [uBId1, batchList]);

  useEffect(() => {
    batchPred.memBatchListVersions(undefined, useBatchPredId, true);
  }, [useBatchPredId, batchPredParam]);
  const batchVersionList = useMemo(() => {
    return batchPred.memBatchListVersions(undefined, useBatchPredId, false);
  }, [useBatchPredId, batchPredParam]);

  const uBVer1 = paramsProp?.get('useBatchPredVersion');
  const useBatchPredVersion = useMemo(() => {
    let res = uBVer1;
    if (Utils.isNullOrEmpty(res)) {
      res = batchVersionList?.[0]?.batchPredictionVersion;
    }
    return res;
  }, [uBVer1, batchVersionList]);

  useEffect(() => {
    if (neverDoneRef.current != null) {
      clearTimeout(neverDoneRef.current);
      neverDoneRef.current = null;
    }
    setIsNotYetNeverDone(true);
  }, [projectId, useBatchPredVersion]);

  const optionsBatchPred = useMemo(() => {
    return batchList?.map((b1) => ({ label: b1.name, value: b1.batchPredictionId }));
  }, [batchList]);
  const optionsBatchPredSel = optionsBatchPred?.find((b1) => b1.value === useBatchPredId) ?? { label: '', value: null };

  const optionsBatchPredVersion = useMemo(() => {
    return batchVersionList
      ?.filter((b1) => b1.predictionsCompletedAt != null && b1.predictionsCompletedAt !== 0)
      ?.filter((b1) => b1?.status?.toUpperCase() === BatchPredLifecycle.COMPLETE)
      ?.map((b1) => ({ label: <DateOld date={b1.predictionsCompletedAt} always />, value: b1.batchPredictionVersion }));
  }, [batchVersionList]);
  const optionsBatchPredVersionSel = optionsBatchPredVersion?.find((b1) => b1.value === useBatchPredVersion) ?? { label: '', value: null };

  useEffect(() => {
    if (!useBatchPredVersion) {
      if (neverDoneRef.current != null) {
        clearTimeout(neverDoneRef.current);
        neverDoneRef.current = null;
      }
      neverDoneRef.current = setTimeout(() => {
        setIsNotYetNeverDone(false);
      }, 1000);
      return;
    }

    REClient_.client_()._getFeatureDriftBatchPredictionSummary(useBatchPredVersion, (err, res) => {
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
        let features = res?.result?.featureIndex ?? res?.result?.features ?? [];
        setFeaturesList(features);
        let f1 = features?.[0];
        if (f1 != null && _.isObject(f1)) {
          f1 = (f1 as any).name;
        }
        setFeatureSel(f1);

        let targetColumn1 = res?.result?.targetColumn;
        if (features == null || !features?.find((s1) => s1.name === targetColumn1)) {
          targetColumn1 = null;
        }
        setTargetColumn(targetColumn1 ?? null);
      }
    });
  }, [useBatchPredVersion]);

  useEffect(() => {
    if (useBatchPredVersion && targetColumn /* && rangeDates && rangeDates?.[0] && rangeDates?.[1]*/) {
      setIsRefreshingThroughputTarget(true);
      REClient_.client_()._getFeatureDriftBatchPredictionSingleFeatureDistribution(useBatchPredVersion, targetColumn, (err, res) => {
        setIsRefreshingThroughputTarget(false);
        if (err || !res?.success) {
          setThroughputResTarget(null);
        } else {
          setThroughputResTarget(res?.result);
        }
      });
    } else {
      setThroughputResTarget(null);
    }
  }, [targetColumn, useBatchPredVersion]);

  useEffect(() => {
    if (useBatchPredVersion && featureSel /* && rangeDates && rangeDates?.[0] && rangeDates?.[1]*/) {
      setIsRefreshingThroughput(true);
      REClient_.client_()._getFeatureDriftBatchPredictionSingleFeatureDistribution(useBatchPredVersion, featureSel, (err, res) => {
        setIsRefreshingThroughput(false);
        if (err || !res?.success) {
          setThroughputRes(null);
        } else {
          setThroughputRes(res?.result);
        }
      });
    } else {
      setThroughputRes(null);
    }
  }, [featureSel, useBatchPredVersion]);

  const onChangeBatchPred = (option1) => {
    setThroughputRes(null);
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/-', undefined, Utils.processParamsAsQuery({ useBatchPredId: option1?.value, useBatchPredVersion: '' }, window.location.search));
  };

  const onChangeBatchPredVersion = (option1) => {
    setThroughputRes(null);
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/-', undefined, Utils.processParamsAsQuery({ useBatchPredVersion: option1?.value }, window.location.search));
  };

  const chartHH = 270;

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

  const topPredFeaturesTarget = useMemo(() => {
    let list = [...(featuresList ?? [])];

    let p1 = list?.find((s1) => s1?.name === targetColumn);
    list = p1 == null ? [] : [p1];

    return list;
  }, [featuresList, targetColumn]);

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
          <span>Model Drift BP</span>
        </span>
        <div
          css={`
            flex: 1;
          `}
        ></div>
        <div>
          <HelpBox name={'Monitoring'} beforeText={''} linkTo={'/help/modelMonitoring/creating_monitor'} />
        </div>
        {/*{optionsRegions?.length>1 && <div css={`margin-left: 20px; font-size: 14px;`}>*/}
        {/*  Region:*/}
        {/*</div>}*/}
        {/*{optionsRegions?.length>1 && <div css={`margin-left: 5px`}>*/}
        {/*  {regionSelect}*/}
        {/*</div>}*/}
      </div>
      <div
        css={`
          position: absolute;
          top: ${34}px;
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
                  <span>Feature Drift Batch Prediction</span>

                  {/*<span css={`margin-left: 30px;`}>*/}
                  {/*  <StyleLabel>Time Range:</StyleLabel>*/}
                  {/*</span>*/}
                  {/*<span css={`margin-left: 10px;`}>*/}
                  {/*  <div css={`margin-left: 5px; width: 200px;`}>*/}
                  {/*    <DatePicker.RangePicker ranges={rangesPickerDates as any} allowClear={false} value={rangeDates as any} onChange={onChangeRangeDates} />*/}
                  {/*  </div>*/}
                  {/*</span>*/}

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
                margin-bottom: 5px;
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
                  display: flex;
                  align-items: center;
                `}
              >
                <span>Batch Prediction:</span>
                <div
                  css={`
                    margin-left: 5px;
                    width: 300px;
                    font-size: 14px;
                  `}
                >
                  <SelectExt options={optionsBatchPred} value={optionsBatchPredSel} onChange={onChangeBatchPred} />
                </div>
                {useBatchPredId && (
                  <span
                    css={`
                      margin-left: 10px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <Link to={'/' + PartsLink.batchpred_detail + '/' + (projectId ?? '-') + '/' + useBatchPredId} usePointer className={sd.styleTextBlueBright}>
                      (View)
                    </Link>
                  </span>
                )}

                <div
                  css={`
                    margin-left: 20px;
                  `}
                >
                  &nbsp;
                </div>

                <span>Version:</span>
                <div
                  css={`
                    margin-left: 5px;
                    width: 240px;
                    font-size: 14px;
                  `}
                >
                  <SelectExt options={optionsBatchPredVersion} value={optionsBatchPredVersionSel} onChange={onChangeBatchPredVersion} />
                </div>
              </div>
            </div>

            <div
              css={`
                display: flex;
                margin: 20px 20px 20px 5px;
                top: 100px;
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
                    <div>
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
                              <span>KL:</span>
                              <span
                                css={`
                                  margin-left: 5px;
                                `}
                              >
                                {topPredFeaturesTarget?.[0]?.distance ?? '-'}
                              </span>
                              <span
                                css={`
                                  margin-left: 20px;
                                `}
                              ></span>
                              <span>JS:</span>
                              <span
                                css={`
                                  margin-left: 5px;
                                `}
                              >
                                {topPredFeaturesTarget?.[0]?.jsDistance ?? '-'}
                              </span>
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
                                  <TableExt calcIsSelected={calcIsSelectedFeature} isVirtual height={height - 30} dataSource={topPredFeatures} columns={columnsFeatures} onClickCell={onClickRowTopFeature} />
                                </div>
                              </div>
                            )}
                          </AutoSizer>
                        </div>

                        <div
                          css={`
                            margin: 15px;
                            flex: 1;
                            position: relative;
                          `}
                        >
                          <RefreshAndProgress msgTop={isNotYet || isNotYetNeverDone ? 25 : undefined} msgMsg={isNotYetNeverDone ? 'Loading...' : isNotYet ? 'No Data Yet' : undefined} isDim={isNotYet || isNotYetNeverDone}>
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
                              {deployId != null && (
                                <span
                                  css={`
                                    margin-left: 10px;
                                  `}
                                >
                                  <Link to={['/' + PartsLink.monitoring_drift_analysis + '/' + (projectId ?? '-') + '/' + useBatchPredId, 'findFeature=' + encodeURIComponent(featureSel)]}>
                                    <Button size={'small'} type={'primary'}>
                                      View Rows
                                    </Button>
                                  </Link>
                                </span>
                              )}
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
                          </RefreshAndProgress>
                        </div>
                      </div>
                    </div>
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

export default MonitoringDriftBPOne;
