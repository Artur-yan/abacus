import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Utils, { ColorsGradients } from '../../../core/Utils';
import predictionMetrics from '../../stores/reducers/predictionMetrics';
import ChartMetricsFull from '../ChartMetricsFull/ChartMetricsFull';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import NanoScroller from '../NanoScroller/NanoScroller';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TimelineChart from '../TimelineChart/TimelineChart';
const s = require('./MonitorDriftBias.module.css');
const sd = require('../antdUseDark.module.css');

const StyleLabel = styled.div`
  font-family: Matter;
  font-size: 15px;
  font-weight: 600;
  color: #f1f1f1;
`;

interface IBottomChartProps {
  title?: string;
  data?: [string, number][];
}

const BottomChart = React.memo((props: PropsWithChildren<IBottomChartProps>) => {
  const dataRoot = useMemo(() => {
    let seriesY = [];
    let data1 = [];
    let colorsListIndex = [];

    let dataList = props.data;

    dataList = dataList?.sort((a, b) => {
      return (a?.[1] ?? 0) - (b?.[1] ?? 0);
    });

    dataList?.some((d1) => {
      let name1 = d1?.[0] ?? '-';
      seriesY.push(name1);
      let v1 = d1?.[1] ?? 0;
      data1.push({ y: Utils.decimals(v1, 3), x: name1 });

      colorsListIndex.push(v1 < 0.8 ? 6 : 1);
    });

    let dataRoot: any = {
      data: data1,
      useTitles: true,
      useLegend: true,
      topLabels: seriesY,
      tooltips: true,
      barEachColor: true,
      titleX: '',
      gridContainLabel: true,
      forceColorIndexEachBar: colorsListIndex,
    };

    return dataRoot;
  }, [props.data]);

  return (
    <div
      css={`
        width: ${wwElem}px;
        display: inline-block;
      `}
    >
      <div
        css={`
          text-align: center;
        `}
      >
        {props.title}
      </div>
      <div
        css={`
          margin-top: 10px;
        `}
      >
        <ChartXYExt useEC startColorIndex={0} height={340} colorFixed={ColorsGradients} data={dataRoot} type={'barvert'} />
      </div>
    </div>
  );
});

interface IMatrixOneProps {
  title?: string;
  labels?: string[];
  data?: any;
  isSecond?: boolean;
}

const wwElem = 440;

const MatrixOne = React.memo((props: PropsWithChildren<IMatrixOneProps>) => {
  const [labelSel, setLabelSel] = useState(null);

  useEffect(() => {
    setLabelSel((s1) => {
      if (props.labels != null) {
        if (s1 == null || !props.labels?.includes(s1)) {
          s1 = props.labels?.sort()?.[0];
          if (props.isSecond) {
            let s2 = props.labels?.sort()?.[1];
            if (s2 != null) {
              s1 = s2;
            }
          }
        }
      }

      return s1;
    });
  }, [props.labels, props.isSecond]);

  const optionsLabels = useMemo(() => {
    return props.labels?.sort()?.map((s1) => ({ label: s1, value: s1 })) ?? Utils.emptyStaticArray();
  }, [props.labels]);

  const chartElem = useMemo(() => {
    let data1 = props.data?.[labelSel] as { a; b; c; d };

    let dataList = [data1?.a, data1?.b, data1?.c, data1?.d].filter((v1) => v1 != null);
    let matrix = [
      [data1?.a, data1?.b],
      [data1?.c, data1?.d],
    ];

    let minCM = null;
    let maxCM = null;
    dataList?.some((v1) => {
      if (!_.isNumber(v1)) {
        return;
      }

      if (minCM == null || v1 < minCM) {
        minCM = v1;
      }
      if (maxCM == null || v1 > maxCM) {
        maxCM = v1;
      }
    });

    let axisXlabels = ['Favorable', 'Not Favorable'];

    let dataHM: any = [
      [0, 0, data1?.c],
      [0, 1, data1?.d],
      [1, 0, data1?.a],
      [1, 1, data1?.b],
    ];
    dataHM = dataHM.map((item) => [item[1], item[0], item[2] ?? '-']);

    let dataCM = {
      animation: false,
      grid: {
        height: '80%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        // name: 'Predicted Outcome',
        type: 'category',
        data: axisXlabels?.map((s1) => 'Predicted:\n' + s1),
        position: 'top',
        splitArea: {
          show: true,
        },
        axisLabel: {
          color: '#8798ad',
          lineHeight: 17,
        },
      },
      yAxis: {
        // name: 'Actual Outcome',
        type: 'category',
        data: ['Not Favorable', 'Favorable'].map((s1, s1ind) => {
          let tot = 0;
          dataHM?.some((d1) => {
            if (d1?.[1] === s1ind) {
              tot += d1?.[2] ?? 0;
            }
          });
          return 'Actual:\n' + s1 + '\n(' + tot + ')';
        }),
        splitArea: {
          show: true,
        },
        axisLabel: {
          color: '#8798ad',
          lineHeight: 17,
        },
      },
      label: {
        color: '#ffffff',
      },
      visualMap: {
        min: minCM,
        max: maxCM,
        show: false,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        inRange: {
          color: ['#9137ff', '#4b00a7'],
        },
      },
      series: [
        {
          name: 'Confusion Matrix',
          type: 'heatmap',
          data: dataHM,
          label: {
            show: true,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };

    let dataCM0: any = {
      chart: {
        data: {
          // topElem,
          matrix,
          data: dataCM,
        },
        title: null,
        type: 'heatmap',
      },
    };

    return <ChartMetricsFull showDownload={false} forMetrics noMax forceColor={ColorsGradients} data={dataCM0} width={wwElem} height={340} styleBack={{ backgroundColor: '#19232f', paddingTop: '8px', borderRadius: '8px' }} />;
  }, [labelSel, props.data]);

  const onChangeLabelSel = (option1) => {
    setLabelSel(option1?.value);
  };

  return (
    <div
      css={`
        margin: 10px;
        width: ${wwElem}px;
        display: inline-block;
      `}
    >
      <div css={``}>{props.title}</div>
      <div
        css={`
          margin-top: 10px;
        `}
      >
        <div
          css={`
            margin: 4px;
          `}
        >
          <SelectExt options={optionsLabels} value={optionsLabels?.find((o1) => o1.value === labelSel)} onChange={onChangeLabelSel} />
        </div>
        <div>{chartElem}</div>
      </div>
    </div>
  );
});

interface IMonitorDriftBiasProps {
  isBias?: boolean;
}

const MonitorDriftBias = React.memo((props: PropsWithChildren<IMonitorDriftBiasProps>) => {
  const { monitoringParam, deploymentsParam, predictionMetricsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    predictionMetricsParam: state.predictionMetrics,
    monitoringParam: state.monitoring,
    deploymentsParam: state.deployments,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [protectedClassSel, setProtectedClassSel] = useState(null);

  const predictionMetricsId = paramsProp?.get('predictionMetricsId');
  const predictionMetricVersion = paramsProp?.get('predictionMetricVersion');
  const modelMonitorVersion = paramsProp?.get('modelMonitorVersion');
  const metricType = paramsProp?.get('metricType');

  useEffect(() => {
    predictionMetrics.memDescribeMetricsByPredMetricsId(true, undefined, predictionMetricsId);
  }, [predictionMetricsId, predictionMetricsParam]);
  const predMetricsOne = useMemo(() => {
    return predictionMetrics.memDescribeMetricsByPredMetricsId(false, undefined, predictionMetricsId);
  }, [predictionMetricsId, predictionMetricsParam]);

  useEffect(() => {
    props?.isBias ? predictionMetrics.memMetricsByPredMetricType(true, undefined, modelMonitorVersion, metricType) : predictionMetrics.memMetricsByPredMetricVersion(true, undefined, predictionMetricVersion);
  }, [predictionMetricsParam, predictionMetricVersion, metricType, modelMonitorVersion]);
  const predOne = useMemo(() => {
    return props?.isBias ? predictionMetrics.memMetricsByPredMetricType(false, undefined, modelMonitorVersion, metricType) : predictionMetrics.memMetricsByPredMetricVersion(false, undefined, predictionMetricVersion);
  }, [predictionMetricsParam, predictionMetricVersion, metricType, modelMonitorVersion]);

  const isRefreshing = useMemo(() => {
    return predictionMetricsParam?.get('isRefreshing') > 0 && predOne == null;
  }, [predictionMetricsParam, predOne]);

  const optionsProtectedClass = useMemo(() => {
    return predOne?.actualValuesSupportedForDrilldown?.map((s1) => ({ label: s1, value: s1 })) ?? Utils.emptyStaticArray();
  }, [predOne]);

  const optionsTimeLine = useMemo(() => {
    if (predOne?.metrics?.biasTimeseries) {
      return Object.keys(predOne?.metrics?.biasTimeseries).map((s1) => ({ label: s1, value: s1 })) ?? Utils.emptyStaticArray();
    }
  }, [predOne]);

  useEffect(() => {
    if (protectedClassSel == null && optionsProtectedClass?.length > 0 && optionsProtectedClass?.[0]?.value != null) {
      setProtectedClassSel(optionsProtectedClass?.[0]?.value);
    }
  }, [optionsProtectedClass, protectedClassSel]);

  const confMatrixElems = useMemo(() => {
    const data1 = predOne?.metrics?.biasConfusionMatrices?.[protectedClassSel];
    if (data1 != null) {
      return [<MatrixOne key={'cf1'} title={protectedClassSel} labels={Object.keys(data1 ?? {})} data={data1} />, <MatrixOne isSecond key={'cf2'} title={protectedClassSel} labels={Object.keys(data1 ?? {})} data={data1} />];
    }

    return null;
  }, [predOne, protectedClassSel]);

  const onChangeProtectedClassSel = (option1) => {
    setProtectedClassSel(option1?.value);
  };

  const bottomElems = useMemo(() => {
    let data1 = predOne?.metrics?.biasMetrics?.[protectedClassSel] as { demographicParity: [string, number][]; equalOpportunity: [string, number][]; groupBenefit: [string, number][] };
    if (data1 != null) {
      return [
        <BottomChart data={data1?.demographicParity} title={'Demographic Parity'} />,
        <BottomChart data={data1?.equalOpportunity} title={'Equal Opportunity'} />,
        <BottomChart data={data1?.groupBenefit} title={'Group Benefit Equality'} />,
      ];
    }

    return null;
  }, [predOne, protectedClassSel]);

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
          <span>Bias</span>
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
            <div
              css={`
                display: flex;
                margin: 20px;
              `}
              className={sd.absolute}
            >
              <div
                css={`
                  flex: 1;
                  margin-right: 5px;
                  font-size: 15px;
                `}
              >
                <RefreshAndProgress msgMsg={isRefreshing ? 'Processing...' : undefined} isDim={isRefreshing}>
                  {predOne?.metrics?.biasTimeseries && (
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
                        <TimelineChart timeSeries={predOne?.metrics?.biasTimeseries} title="Bias Violation" />
                      </div>
                    </div>
                  )}
                  <div
                    css={`
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span
                      css={`
                        margin-right: 5px;
                      `}
                    >
                      Select Protected Class:
                    </span>
                    <span
                      css={`
                        width: 200px;
                      `}
                    >
                      <SelectExt options={optionsProtectedClass} value={optionsProtectedClass?.find((o1) => o1.value === protectedClassSel)} onChange={onChangeProtectedClassSel} />
                    </span>
                  </div>

                  <div
                    css={`
                      padding: 20px;
                      border-radius: 4px;
                      margin-top: 30px;
                    `}
                    className={sd.grayPanel}
                  >
                    <div
                      css={`
                        text-align: center;
                      `}
                    >
                      {bottomElems}
                    </div>
                  </div>

                  <div
                    css={`
                      padding: 20px;
                      border-radius: 4px;
                      margin-top: 30px;
                    `}
                    className={sd.grayPanel}
                  >
                    <div
                      css={`
                        display: flex;
                        justify-content: center;
                      `}
                    >
                      Confusion Matrix
                    </div>
                    <div
                      css={`
                        text-align: center;
                      `}
                    >
                      {confMatrixElems}
                    </div>
                  </div>
                </RefreshAndProgress>
              </div>
            </div>
          </div>
        </NanoScroller>
      </div>
    </div>
  );
});

export default MonitorDriftBias;
