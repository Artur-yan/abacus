import type { RadioChangeEvent } from 'antd';
import Button from 'antd/lib/button';
import Radio from 'antd/lib/radio';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils, { ColorsGradients } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import monitoring, { ModelMonitoringLifecycle } from '../../stores/reducers/monitoring';
import ChartMetricsFull from '../ChartMetricsFull/ChartMetricsFull';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TimelineChart from '../TimelineChart/TimelineChart';

const s = require('./MonitorDrift.module.css');
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

const MonitorDrift = React.memo((props: PropsWithChildren<IMonitorDriftProps>) => {
  const { paramsProp, authUser, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    monitoringParam: state.monitoring,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [summary, setSummary] = useState(
    null as {
      targetColumn?: string;
      predictionDrift?: number;
      featureIndex: { jsDistance?; distance; name: string; noOutliers; importance? }[];
      nullViolations: { name: string; predictionNullFreq; trainingNullFreq; violation: string }[];
      rangeViolations: { name: string; freqAboveTrainingRange; freqBelowTrainingRange; predictionMax; predictionMin; trainingMax; trainingMin }[];
      typeViolations: { name: string; predictionDataType: string; trainingDataType: string }[];
      catViolations?: { freqOutsideTrainingRange: number; mostCommonValues: any[]; name }[];
      nestedSummary?: any[];
    },
  );

  const [targetDrift, setTargetDrift] = useState(null as IDrift);

  const [predictionDrift, setPredictionDrift] = useState(null);
  const [activePredictionDrift, setActivePredictionDrift] = useState(null);

  const [isNotYet, setIsNotYet] = useState(false);
  const [featureSelId, setFeatureSelId] = useState(null);
  const [throughputRes, setThroughputRes] = useState(null);
  const [throughputResTarget, setThroughputResTarget] = useState(null);
  const [featuredChartData, setFeaturedChartData] = useState(null);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(null);
  const [isRefreshingThroughput, setIsRefreshingThroughput] = useState(false);
  const [embeddingsChartData, setEmbeddingsChartData] = useState(null);

  const projectId = paramsProp?.get('projectId');
  const modelMonitorId = paramsProp?.get('modelMonitorId');
  const modelMonitorVersion = paramsProp?.get('useModelMonitorVersion');

  useEffect(() => {
    monitoring.memModelsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorOne = useMemo(() => {
    return monitoring.memModelsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);

  useEffect(() => {
    monitoring.memModelVersionsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorVersionsOne = useMemo(() => {
    return monitoring.memModelVersionsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);

  const isVersionTraining = useMemo(() => {
    if (monitorVersionsOne?.length > 0) {
      const modelMonitorVersionOne = monitorVersionsOne?.find((v1) => v1.modelMonitorVersion === modelMonitorVersion);
      return [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(modelMonitorVersionOne?.status);
    }

    return false;
  }, [monitorVersionsOne, modelMonitorVersion]);

  const onChangeVersion = (option1) => {
    Location.push('/' + paramsProp.get('mode') + '/' + modelMonitorId + '/' + projectId, undefined, 'useModelMonitorVersion=' + encodeURIComponent(option1?.value ?? ''));
  };

  useEffect(() => {
    if (monitorVersionsOne?.length > 0) {
      let v1 = monitorVersionsOne?.[0]?.modelMonitorVersion;
      if (Utils.isNullOrEmpty(modelMonitorVersion) && v1) {
        onChangeVersion({ label: '', value: v1 });
      }
    }
  }, [monitorVersionsOne, modelMonitorVersion]);
  const optionsVersions = useMemo(() => {
    if (monitorVersionsOne) {
      return monitorVersionsOne?.map((v1, v1ind) => ({ label: v1?.modelMonitorVersion, value: v1?.modelMonitorVersion, data: v1 }));
    }
  }, [monitorVersionsOne]);

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
    Location.push('/' + paramsProp?.get('mode') + '/' + option1?.value + '/' + projectId, undefined, Utils.processParamsAsQuery({ useModelMonitorVersion: null }, window.location.search));
  };

  const chartListOptions = [
    { title: 'distance', field: 'KL' },
    { title: 'jsDistance', field: 'JS' },
    { title: 'wsDistance', field: 'WS' },
    { title: 'ksStatistic', field: 'KS' },
  ];

  const changeFeatureChart = (featureIndex, key) => {
    let checkTitle = chartListOptions?.some((item) => item.title === key);
    if (!checkTitle && !featureIndex) {
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
          // axisYdecimals: 6,
          axisXrenderValue: (value) => Utils.decimals(value, 5),
          axisYrenderValue: (value) => Utils.decimals(value, 2),
        },
        title: 'Feature Importance vs Drift',
        type: 'scatter',
      },
    });
  };

  const targetColumn = useMemo(() => {
    return summary?.targetColumn;
  }, [summary]);

  const getMergedFeatureIndex = (featureIndex, nestedSummary) => {
    let mergedFeatureIndex = [...featureIndex];
    nestedSummary?.forEach((nestedItem) => {
      mergedFeatureIndex.push(
        ...nestedItem.featureIndex?.map((featureItem) => {
          return { ...featureItem, name: `${nestedItem.nestedFeatureName};${featureItem.name}` };
        }),
      );
      mergedFeatureIndex.push({ ...(nestedItem?.rowDistribution?.featureDrift ?? {}), name: nestedItem.nestedFeatureName });
    });

    return mergedFeatureIndex;
  };

  useEffect(() => {
    if (!modelMonitorVersion) {
      return;
    }

    REClient_.client_()._getFeatureDriftModelMonitorSummary(modelMonitorVersion, (err, res) => {
      if (err || !res?.success) {
        setFeatureSelId(null);
        setSummary(null);
        setIsNotYet(true);
      } else {
        setFeatureSelId(null);
        setSummary(res?.result ?? null);
        let featureIndex = getMergedFeatureIndex(res?.result?.featureIndex ?? [], res?.result?.nestedSummary ?? []);
        if (featureIndex?.length > 0) {
          changeFeatureChart(featureIndex, 'distance');
        }
        setIsNotYet(res?.result == null);
      }
    });

    REClient_.client_()._getEmbeddingDriftDistributions(modelMonitorVersion, (err, res) => {
      if (err || !res?.success) {
        setEmbeddingsChartData(null);
      } else {
        setEmbeddingsChartData(res?.result);
      }
    });
  }, [modelMonitorVersion, isVersionTraining]);

  const getTargetDrift = () => {
    REClient_.client_().getDriftForFeature(modelMonitorVersion, targetColumn, null, (err, res) => {
      if (err || !res?.success) {
        setTargetDrift(null);
      } else {
        setTargetDrift(res?.result);
      }
    });
  };

  const onChange = (e: RadioChangeEvent) => {
    setActivePredictionDrift(e.target.value);
  };

  const onChangeChartOption = (e: RadioChangeEvent) => {
    const featureIndex = getMergedFeatureIndex(summary?.featureIndex ?? [], summary?.nestedSummary ?? []);
    changeFeatureChart(featureIndex, e.target.value);
  };

  const getPredictionDrift = () => {
    REClient_.client_().getPredictionDrift(modelMonitorVersion, (err, res) => {
      if (err || !res?.success) {
        setTargetDrift(null);
        getTargetDrift();
      } else {
        const keys = Object.keys(res?.result) || [];
        if (keys.length > 0) {
          // setTargetDrift(res?.result[keys[0]].distribution);
          setPredictionDrift(res?.result);
          setActivePredictionDrift(keys[0]);
        } else {
          getTargetDrift();
        }
      }
    });
  };

  useEffect(() => {
    setTargetDrift(null);
    if (!modelMonitorVersion || !targetColumn) {
      return;
    }
    getPredictionDrift();
  }, [modelMonitorVersion, featureSelId, targetColumn]);

  const [activeFeatureImportance, setActiveFeatureImportance] = useState<'ksStatistic' | 'wsDistance' | 'distance' | 'jsDistance'>('ksStatistic');
  const [activeEmbedding, setActiveEmbedding] = useState<'ksStatistic' | 'wsDistance' | 'distance' | 'jsDistance'>('ksStatistic');

  const wwCol1 = 96 - 12;

  const elemWW = 170 + 5 * wwCol1;

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
        field: 'jsDistance',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        helpTooltip: 'Jensen–Shannon divergence',
      },
      {
        align: 'right',
        title: 'WS Drift',
        field: 'wsDistance',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        helpTooltip: 'Wasserstein Distance',
      },
      {
        align: 'right',
        title: 'KS Drift',
        field: 'ksStatistic',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 2)}</span>;
        },
        helpTooltip: 'KS Statistic',
      },
    ] as ITableExtColumn[];

    columns = columns.filter((item) => {
      return activeColumns.includes(typeof item?.field === 'string' ? item?.field : '');
    });

    const featureIndex = getMergedFeatureIndex(summary?.featureIndex ?? [], summary?.nestedSummary ?? []);
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
  }, [featureSelId, wwCol1, activeFeatureImportance]);

  const topPredFeatures = useMemo(() => {
    const featureIndex = getMergedFeatureIndex(summary?.featureIndex ?? [], summary?.nestedSummary ?? []);
    let list = [...(featureIndex ?? [])];
    let ind1 = _.findIndex(list, (s1) => s1.name === targetColumn);
    if (ind1 > -1) {
      list.splice(ind1, 1);
    }

    return list;
  }, [summary, targetColumn]);

  const topPredFeaturesTarget = useMemo(() => {
    const featureIndex = getMergedFeatureIndex(summary?.featureIndex ?? [], summary?.nestedSummary ?? []);
    let list = [...(featureIndex ?? [])];

    let p1 = list.find((s1) => s1.name === targetColumn);
    list = p1 == null ? [] : [p1];

    return list;
  }, [summary, targetColumn]);

  const optionsFeatures = useMemo(() => {
    const featureIndex = getMergedFeatureIndex(summary?.featureIndex ?? [], summary?.nestedSummary ?? []);
    let res = featureIndex?.map((f1) => ({ label: f1.name, value: f1.name, data: f1 }));
    if (res != null && res.length > 0) {
      setFeatureSelId((id1) => {
        if (id1 == null) {
          id1 = res?.[0]?.value;
        }
        return id1;
      });
    }
    return res;
  }, [summary]);

  const onChangeFeatureSel = (option1) => {
    setFeatureSelId(option1?.value);
  };

  useEffect(() => {
    if (featureSelId) {
      let featureName = featureSelId;
      let nestedFeatureName = null;
      if (featureSelId.includes(';')) {
        const featureNames = featureSelId.split(';');
        nestedFeatureName = featureNames[0];
        featureName = featureNames[1];
      } else {
        const nestedItem = summary?.nestedSummary?.find((item) => item.nestedFeatureName === featureSelId);
        if (nestedItem) {
          setThroughputRes({ ...nestedItem.rowDistribution });
          return;
        }
      }

      setIsRefreshingThroughput(true);
      REClient_.client_().getDriftForFeature(modelMonitorVersion, featureName, nestedFeatureName, (err, res) => {
        setIsRefreshingThroughput(false);
        if (err || !res?.success) {
          setThroughputRes(null);
        } else {
          setThroughputRes(res?.result);
        }
      });
    }
  }, [featureSelId, modelMonitorVersion]);

  useEffect(() => {
    if (targetColumn) {
      if (activePredictionDrift) {
        const distribution = predictionDrift?.[activePredictionDrift]?.distribution;
        setThroughputResTarget(distribution);
      } else {
        REClient_.client_().getDriftForFeature(modelMonitorVersion, targetColumn, null, (err, res) => {
          if (err || !res?.success) {
            setThroughputResTarget(null);
          } else {
            setThroughputResTarget(res?.result);
          }
        });
      }
    } else {
      setThroughputResTarget(null);
    }
  }, [targetColumn, modelMonitorVersion, activePredictionDrift, predictionDrift]);

  const calcCharts = (throughputRes, helpId?: string) => {
    let data1 = [],
      data2 = null,
      colorFixed = null;

    const predictionData = monitorOne?.monitorType === 'FEATURE_GROUP_MONITOR' ? 'Test Data' : 'Prediction Data';
    const trainingData = monitorOne?.monitorType === 'FEATURE_GROUP_MONITOR' ? 'Reference Data' : 'Training Data';

    let isBar = false,
      seriesY = [predictionData, trainingData],
      fieldNames = [predictionData, trainingData];
    let type1 = throughputRes?.type;
    const bucketed = throughputRes?.bucketed;
    if (type1) {
      if (['multivaluecategorical', 'CATEGORICAL_LIST'.toLowerCase(), 'categorical'].includes(type1.toLowerCase() ?? '-')) {
        type1 = 'categorical';
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

          d1[predictionData] = by100(k1.y); //findVal(dataDistribution, k1);

          data1.push(d1);
        });
        dataTrainingDistribution?.some((k1, k1ind, t1ind) => {
          let d1 = { x: k1.x };

          d1[trainingData] = by100(k1.y); //findVal(dataTrainingDistribution, k1);

          data2.push(d1);
        });
      } else {
        kk?.some((k1, k1ind, t1ind) => {
          let d1 = { x: k1 };

          d1[predictionData] = by100(findVal(dataDistribution, k1));
          d1[trainingData] = by100(findVal(dataTrainingDistribution, k1));

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

      if (data0 == null || (_.isArray(data0) && data0.length === 0)) {
        return null;
      }

      let res: any = {
        tooltipValueLabel: 'Value: ',
        isBar: true,
        useTitles: true,
        titleX: index == null ? 'Value' : bucketed ? 'Number of Nested Rows' : `Average Bucket Value`,
        titleY: index == null ? 'Frequency %' : 'Frequency in Distribution',
        seriesY: index == null ? fieldNames : [fieldNames?.[index]],
        fieldNameTooltip: index == null ? seriesY : [seriesY?.[index]],
        tooltipFormatExt: (v1) => (v1 == null ? null : Utils.decimals(v1, 2) + '%'),
        maxDecimalsTooltip: 2,
        data: data0,
        labelMaxChars: 30,
        colorFixed,
        chartHelpIdTopRight: helpId == null ? undefined : 'chart_top_' + helpId,
        useLegend: true,
        intervalX: null, //data2==null ? intervalXcalc : 10,
      };

      if (index != null) {
        res.tooltipRender = (params) => {
          let p1 = params?.[0];
          if (p1 != null) {
            return `Percentile Value Bucket: ${p1?.dataIndex + 1}<br />
                    ${bucketed ? 'Number of Nested Rows' : `Average Bucket Value`}: ${Utils.decimals(Utils.tryParseFloat(p1?.axisValue), 3)}<br />
                    Frequency in Distribution: ${Utils.decimals(p1?.value, 3)}%`;
          }
        };
      }

      return res;
    };

    if (data1 == null && data2 == null) {
      return null;
    } else if (data2 == null) {
      return calcRes(data1);
    } else {
      return [calcRes(data1, 0), calcRes(data2, 1)];
    }
  };

  const calcChartBars = (dataList, titleX, titleY, color1, tooltipConvertValue?) => {
    const ww = 500;
    const hh = 400;

    let data1 = _.assign(
      {},
      {
        roundBars: false,
        barMaxWidth: 20,
        barWidth: '60%',
        // labelMaxChars: labelMaxChars,
        gridColor: '#4c5b92',
        labelColor: '#8798ad',
        titleStyle: {
          color: '#d1e4f5',
          fontFamily: 'Matter',
          fontSize: 13,
          fontWeight: 'bold',
        },
        fieldNameTooltip: tooltipConvertValue == null || !titleY ? undefined : [_.trim(titleY?.replace('%', '') || '')],
        tooltipConvertValue: tooltipConvertValue,
        data: dataList,
        useTitles: true,
        titleX,
        titleY,
      },
    );

    return (
      <div
        css={`
          display: flex;
          justify-content: center;
        `}
      >
        <div
          css={`
            display: flex;
            justify-content: center;
          `}
        >
          <ChartXYExt width={ww} height={hh} colorFixed={color1 as any} type={'bar'} useEC data={data1} />
        </div>
      </div>
    );
  };

  const dataDriftOne = useMemo(() => {
    return calcCharts(throughputRes, 'driftOne');
  }, [throughputRes, monitorOne]);

  const dataDriftOneTarget = useMemo(() => {
    let res = calcCharts(throughputResTarget, 'driftOneTarget');
    if (res?.data != null && res?.data?.length === 0) {
      res = null;
    }
    return res;
  }, [throughputResTarget]);

  const onClickRowTopFeature = (row) => {
    setFeatureSelId(row?.name);
  };

  const chartHH2 = 200;
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
        value: 'jsDistance',
      },
      {
        label: 'WS',
        value: 'wsDistance',
      },
      {
        label: 'KS',
        value: 'ksStatistic',
      },
    ];
  }, []);

  const onChangeTimeline = (e) => {
    setActiveFeatureImportance(e.value);
  };

  const onChangeEmbedding = (e) => {
    setActiveEmbedding(e.value);
  };

  const targetHH = 240;

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
                      <div style={{ margin: '20px', height: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <span style={{ whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
                          <span>Drift</span>
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

                          <span
                            css={`
                              margin-left: 20px;
                            `}
                          >
                            Version:
                          </span>
                          <span
                            css={`
                              font-size: 14px;
                              margin-left: 10px;
                            `}
                          >
                            <span
                              css={`
                                width: 200px;
                                display: inline-block;
                              `}
                            >
                              <SelectExt options={optionsVersions} value={optionsVersions?.find((v1) => v1.value === modelMonitorVersion)} onChange={onChangeVersion} />
                            </span>
                          </span>

                          {/*<span css={`margin-left: 20px;`}>*/}
                          {/*  Feature:*/}
                          {/*</span>*/}
                          {/*<span css={`font-size: 14px; margin-left: 10px; width: 300px;`}>*/}
                          {/*  <SelectExt options={optionsFeatures} value={optionsFeatures?.find(f1 => f1.value===featureSelId)} onChange={onChangeFeatureSel} />*/}
                          {/*</span>*/}
                        </div>
                        {/*<div>{<HelpBox name={'Monitoring'} beforeText={''} linkTo={'/help/modelMonitoring/creating_monitor'} />}</div>*/}
                      </div>
                    </div>
                    <RefreshAndProgress style={{ marginTop: '50px' }} msgMsg={isVersionTraining ? 'Processing...' : undefined} isDim={isVersionTraining}>
                      {predictionDrift?.[activePredictionDrift]?.metrics?.modelDriftTimeseries && (
                        <div
                          css={`
                            margin-top: 75px;
                          `}
                        >
                          <TimelineChart defaultFeaturedIndex={'distance'} timeSeries={predictionDrift?.[activePredictionDrift]?.metrics?.modelDriftTimeseries} chartListOptions={chartListOptions} yTitle="Distance" />
                        </div>
                      )}
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
                              flex-direction: column;
                              display: flex;
                              font-family: Matter;
                              font-size: 18px;
                              font-weight: 500;
                              line-height: 1.78;
                              margin-top: 10px;
                              margin-bottom: 10px;
                              margin-left: 20px;
                            `}
                          >
                            {predictionDrift && (
                              <div>
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
                                  {predictionDrift?.[activePredictionDrift]?.predictedColumn && (
                                    <span
                                      css={`
                                        text-transform: capitalize;
                                      `}
                                    >
                                      {' '}
                                      Drift for Target Column - {predictionDrift?.[activePredictionDrift]?.predictedColumn?.replace(/([a-z])([A-Z])/g, '$1 $2')}
                                    </span>
                                  )}
                                </div>
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
                                  <span
                                    css={`
                                      text-transform: capitalize;
                                    `}
                                  >
                                    {activePredictionDrift?.replace(/([a-z])([A-Z])/g, '$1 $2') || 'Prediction Drift'}:
                                  </span>
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
                                      {Utils.decimals(topPredFeaturesTarget?.[0]?.distance, 2) ?? '-'}
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
                                      {Utils.decimals(topPredFeaturesTarget?.[0]?.jsDistance) ?? '-'}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            )}
                            {predictionDrift && predictionDrift[activePredictionDrift] ? (
                              <>
                                <span
                                  css={`
                                    display: flex;
                                    margin-bottom: 10px;
                                    text-transform: capitalize;
                                  `}
                                >
                                  {activePredictionDrift?.replace(/([a-z])([A-Z])/g, '$1 $2') || 'Prediction Drift'} Distribution (
                                  <span
                                    css={`
                                      margin-left: 5px;
                                      opacity: 0.9;
                                    `}
                                  >
                                    Training Data Table,{' '}
                                  </span>
                                  <span
                                    css={`
                                      margin-left: 5px;
                                      opacity: 0.9;
                                    `}
                                  >
                                    Prediction Log{' '}
                                  </span>
                                  )
                                </span>
                                {Object.keys(predictionDrift ?? {})?.length > 1 && (
                                  <span className={s.driftRadioBtn}>
                                    <Radio.Group
                                      css={`
                                        display: flex;
                                      `}
                                      onChange={onChange}
                                      value={activePredictionDrift}
                                    >
                                      {Object.keys(predictionDrift).map((key, index) => {
                                        return (
                                          <div className={s.radioContent}>
                                            <Radio value={key} key={index}>
                                              <span
                                                css={`
                                                  color: white;
                                                  font-size: 18px;
                                                  text-transform: capitalize;
                                                `}
                                              >
                                                {key.split(/(?=[A-Z])/).join(' ')}
                                              </span>
                                            </Radio>
                                          </div>
                                        );
                                      })}
                                    </Radio.Group>
                                  </span>
                                )}
                              </>
                            ) : (
                              predictionDrift && (
                                <span>
                                  Prediction Drift Distribution Test
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
                              )
                            )}
                          </div>
                          {targetDrift != null && (
                            <div
                              css={`
                                font-size: 14px;
                                margin-top: -3px;
                              `}
                            >
                              {targetDrift?.predictionStatistics?.mean != null && (
                                <span
                                  css={`
                                    opacity: 0.8;
                                  `}
                                >
                                  {monitorOne?.monitorType === 'FEATURE_GROUP_MONITOR' ? 'Test' : 'Prediction'} Avg:
                                </span>
                              )}
                              {targetDrift?.predictionStatistics?.mean != null && (
                                <span
                                  css={`
                                    margin-left: 5px;
                                  `}
                                >
                                  {Utils.decimals(targetDrift?.predictionStatistics?.mean, 2)}
                                </span>
                              )}
                              {targetDrift?.trainingStatistics?.mean != null && (
                                <span
                                  css={`
                                    margin-left: ${targetDrift?.predictionStatistics?.mean != null ? 10 : 0}px;
                                    opacity: 0.8;
                                  `}
                                >
                                  {monitorOne?.monitorType === 'FEATURE_GROUP_MONITOR' ? 'Reference' : 'Training'} Avg:
                                </span>
                              )}
                              {targetDrift?.trainingStatistics?.mean != null && (
                                <span
                                  css={`
                                    margin-left: 5px;
                                  `}
                                >
                                  {Utils.decimals(targetDrift?.trainingStatistics?.mean, 2)}
                                </span>
                              )}
                            </div>
                          )}

                          <div
                            css={`
                              margin: 20px;
                            `}
                          >
                            <AutoSizer disableHeight>
                              {({ width }) => (
                                <div
                                  css={`
                                    display: flex;
                                  `}
                                >
                                  {dataDriftOneTarget != null && (
                                    <div
                                      css={`
                                        margin: 15px;
                                        width: ${width / 2 - 10}px;
                                        position: relative;
                                        height: 30rem;
                                      `}
                                    >
                                      {dataDriftOneTarget != null && !_.isArray(dataDriftOneTarget) && (
                                        <ChartXYExt colorFixed={dataDriftOneTarget?.colorFixed} useEC data={dataDriftOneTarget} width={width / 2 - 10} height={chartHH + 100} startColorIndex={0} />
                                      )}

                                      {dataDriftOneTarget != null && _.isArray(dataDriftOneTarget) && (
                                        <div
                                          css={`
                                            display: flex;
                                            flex-direction: column;
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
                                  {featuredChartData?.chart?.data?.data?.length > 0 && (
                                    <div
                                      className={s.featureImportance}
                                      css={`
                                        display: flex;
                                        flex-direction: column;
                                        width: ${width / 2 - 10}px;
                                        margin: 15px;
                                        flex: 1;
                                        position: relative;
                                        overflow: visible;
                                        border-radius: 5px;
                                      `}
                                    >
                                      <span
                                        css={`
                                          font-size: 18px;
                                          font-weight: bold;
                                          margin-bottom: 14px;
                                        `}
                                      >
                                        Feature Importance vs Drift
                                        <HelpIcon id={'monitor_importance_drift_chart'} style={{ marginLeft: '4px' }} />
                                      </span>
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
                                        <ChartMetricsFull backNormal forceColor={ColorsGradients} forMetrics noMax data={featuredChartData} width={width / 2 - 10} height={chartHH - 40} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </AutoSizer>
                          </div>
                        </div>
                      </div>

                      {embeddingsChartData != null && Object.keys(embeddingsChartData ?? {}).length > 0 && (
                        <div
                          css={`
                            display: flex;
                            margin-bottom: 500px;
                          `}
                        >
                          <div
                            css={`
                              margin: 15px;
                              width: 500px;
                              position: relative;
                            `}
                          >
                            <div
                              css={`
                                position: absolute;
                                left: 0;
                                right: 0;
                              `}
                            >
                              <div
                                css={`
                                  font-family: Matter;
                                  display: flex;
                                  font-size: 18px;
                                  font-weight: 500;
                                  line-height: 1.78;
                                  margin-top: 10px;
                                  margin-bottom: 10px;
                                `}
                              >
                                <span>
                                  Embedding Drift Distribution
                                  <HelpIcon id={'monitor_drift_embedding_drift_title'} style={{ marginLeft: '4px' }} />
                                </span>
                                <span
                                  css={`
                                    width: 200px;
                                    margin-left: auto;
                                  `}
                                >
                                  <SelectExt options={featureImportanceOption} value={featureImportanceOption?.find((o1) => o1?.value === activeEmbedding)} onChange={onChangeEmbedding} />
                                </span>
                              </div>
                              <div>
                                {calcChartBars(embeddingsChartData?.[activeEmbedding] ?? [], 'Distance', 'Frequency %', { from: '#c08dff', to: '#7432fb' }, (v1) => (v1 == null ? null : '' + v1 + '%'))}
                                {embeddingsChartData?.averageDrift && <div css={'text-align: center;'}>{`Average drift: ${Utils.decimals(embeddingsChartData?.averageDrift[activeEmbedding], 3)}`}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        css={`
                          display: flex;
                        `}
                      >
                        <div
                          css={`
                            margin: 15px;
                            width: 500px;
                            position: relative;
                          `}
                        >
                          <div
                            css={`
                              position: absolute;
                              left: 0;
                              right: 0;
                            `}
                          >
                            <div
                              css={`
                                font-family: Matter;
                                display: flex;
                                font-size: 18px;
                                font-weight: 500;
                                line-height: 1.78;
                                margin-top: 10px;
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
                              <TableExt isNullSort calcIsSelected={calcIsSelectedFeature} isVirtual height={500} dataSource={topPredFeatures} columns={columnsFeatures} onClickCell={onClickRowTopFeature} />
                            </div>
                          </div>
                        </div>
                        <div
                          css={`
                            margin: 15px;
                            flex: 1;
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
                                <span
                                  css={`
                                    margin-left: 10px;
                                  `}
                                >
                                  <Link to={['/' + PartsLink.monitor_drift_analysis + '/' + modelMonitorId + (projectId ? '/' + projectId : ''), 'findFeature=' + encodeURIComponent(featureSelId)]}>
                                    <Button size={'small'} type={'primary'}>
                                      View Rows
                                    </Button>
                                  </Link>
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

export default MonitorDrift;
