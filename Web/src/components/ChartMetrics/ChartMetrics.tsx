import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useMemo, useReducer, useRef, useState } from 'react';
import Utils, { ColorsGradients } from '../../../core/Utils';
import ChartXYExt, { maxColors } from '../ChartXYExt/ChartXYExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import SelectExt from '../SelectExt/SelectExt';
import TableExt from '../TableExt/TableExt';
const styles = require('./ChartMetrics.module.css');
const sd = require('../antdUseDark.module.css');

interface IChartMetricsProps {
  data?: { type?: string; data?: any; title?: any };
  width?: number;
  height?: number;
  noTitles?: boolean;
  startColorIndex?: number;
  styleBack?: CSSProperties;
  forceColor?: string | { from: string; to: string }[];
  forMetrics?: boolean;
  noMax?: boolean;
  showDownload?: boolean;
  backNormal?: boolean;
}

const ChartMetrics = React.memo((props: PropsWithChildren<IChartMetricsProps>) => {
  // const { paramsProp, authUser, alerts: alertsParam, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  //   alerts: state.alerts,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const chartDataLast = useRef(null);
  const chartDataLastRes = useRef(null);
  const chartDataLastWidth = useRef(null);

  const [chartListSelIndex, setChartListSelIndex] = useState(0);

  let content = useMemo(() => {
    let chartData: any = null;

    let dataOne = props.data;
    // @ts-ignore
    if (dataOne != null && _.isObject(dataOne) && dataOne.list != null && _.isArray(dataOne.list)) {
      // @ts-ignore
      dataOne = dataOne.list?.[chartListSelIndex];
      if (dataOne != null) {
        dataOne = { ...dataOne }; //_.cloneDeep(dataOne);
        if ((dataOne as any)?.removeTitle) {
          dataOne.title = null;
        }
      }
    }

    const dataOri = dataOne?.data;
    if (!dataOri) {
      return null;
    }
    if (chartDataLastRes.current != null && chartDataLast.current != null && _.isEqual(chartDataLast.current, dataOri) && chartDataLastWidth.current === props.width) {
      return chartDataLastRes.current;
    }
    chartDataLast.current = dataOri;
    chartDataLastWidth.current = props.width;

    switch (dataOne?.data?.type ?? dataOne?.type) {
      case 'grid':
        let resGrid = (
          <div
            css={`
              padding: 5px 20px 10px 20px;
            `}
          >
            <TableExt key={'t' + chartListSelIndex} columns={(dataOne as any)?.columns ?? []} dataSource={dataOne?.data} />
          </div>
        );
        chartDataLastRes.current = resGrid;
        return resGrid;

      case 'histogram':
        const isClassesOne = dataOri?.classNames != null;
        const namesList = dataOri?.featureNames ?? dataOri?.classNames ?? dataOri?.barsList;

        let minV = 0;
        let subType = 0,
          chartHelpIdTopRight = null;
        if (namesList != null && _.isArray(namesList)) {
          chartData = {
            titleX: '',
            titleY: '',
            forceToPrintAllLabels: true,
            useSmallBars: true,
            titleFontSize: 14,
            maxDecimalsTooltip: 3,
          };

          if (dataOri?.gapAxisLeft != null) {
            chartData.gapAxisLeft = dataOri.gapAxisLeft;
          }
          if (dataOri?.axisXstepSize != null) {
            chartData.axisXstepSize = dataOri.axisXstepSize;
          }

          if (dataOri?.sameMaxXY != null) {
            chartData.sameMaxXY = dataOri.sameMaxXY;
          }

          if (dataOri?.chartType != null) {
            chartData.chartType = dataOri.chartType;
          }
          if (dataOri?.seriesOnlyY != null) {
            chartData.seriesOnlyY = dataOri.seriesOnlyY;
          }
          if (dataOri?.breakdown != null) {
            chartData.breakdown = dataOri.breakdown;
          }
          if (dataOri?.exportFG != null) {
            chartData.exportFG = dataOri.exportFG;
          }
          if (dataOri?.breakdownButtons != null) {
            chartData.breakdownButtons = dataOri.breakdownButtons;
          }

          if (dataOri?.chartHelpIdTopRight != null) {
            chartData.chartHelpIdTopRight = dataOri.chartHelpIdTopRight;
          }

          if (dataOri?.useLegend != null) {
            chartData.useLegend = dataOri.useLegend;
          }

          if (dataOri?.dataDownload != null) {
            chartData.dataDownload = dataOri.dataDownload;
          }
          if (dataOri?.breakdownSort != null) {
            chartData.breakdownSort = dataOri.breakdownSort;
          }
          if (dataOri?.titleY != null) {
            chartData.titleY = dataOri.titleY;
            chartData.useTitles = true;
          }
          if (dataOri?.titleX != null) {
            chartData.titleX = dataOri.titleX;
            chartData.useTitles = true;
          }
          if (dataOri?.subtitle != null) {
            chartData.subtitle = dataOri.subtitle;
          }
          if (dataOri?.fieldNameTooltip != null) {
            chartData.fieldNameTooltip = dataOri.fieldNameTooltip;
          }
          if (dataOri?.fieldNameTooltipAddIndex != null) {
            chartData.fieldNameTooltipAddIndex = dataOri.fieldNameTooltipAddIndex;
          }
          if (dataOri?.dotColorClassByIndex != null) {
            chartData.dotColorClassByIndex = dataOri.dotColorClassByIndex;
          }
          if (dataOri?.onClickChart != null) {
            chartData.onClickChart = dataOri.onClickChart;
          }
          if (dataOri?.yAxisType != null) {
            chartData.yAxisType = dataOri.yAxisType;
          }

          if (dataOri?.tooltipFormatExt != null) {
            chartData.tooltipFormatExt = dataOri.tooltipFormatExt;
          }

          if (dataOri?.yAxisMax != null) {
            chartData.yAxisMax = dataOri.yAxisMax;
          }
          if (dataOri?.barEachColor != null) {
            chartData.barEachColor = dataOri.barEachColor;
          }
          if (dataOri?.tooltips != null) {
            chartData.tooltips = dataOri.tooltips;
          }
          if (dataOri?.forceColorIndex != null) {
            chartData.forceColorIndex = dataOri.forceColorIndex;
          }
          if (dataOri?.forceColorIndexEachBar != null) {
            chartData.forceColorIndexEachBar = dataOri.forceColorIndexEachBar;
          }
          if (dataOri?.topLabels != null) {
            chartData.topLabels = dataOri.topLabels;
          }
          if (dataOri?.topLabelsRich != null) {
            chartData.topLabelsRich = dataOri.topLabelsRich;
          }
          if (dataOri?.bottomLine != null) {
            chartData.bottomLine = dataOri.bottomLine;
          }
          if (dataOri?.bottomLineHH != null) {
            chartData.bottomLineHH = dataOri.bottomLineHH;
          }

          if (props.forMetrics) {
            let labelMaxChars = 14;
            if (props.width != null && _.isNumber(props.width)) {
              labelMaxChars = Math.trunc((props.width - 80) / namesList.length / 10);
            }

            chartData = _.assign({}, chartData, {
              roundBars: true,
              barMaxWidth: 66,
              barWidth: '60%',
              labelMaxChars: labelMaxChars,
              gridColor: '#4c5b92',
              labelColor: '#8798ad',
              titleStyle: {
                color: '#d1e4f5',
                fontFamily: 'Matter',
                fontSize: 13,
                fontWeight: 'bold',
              },
            });
          }
          if (!props.noTitles) {
            if (dataOri?.ignoreTitle) {
              //
            } else if (dataOri?.totalFeatures == null && dataOri?.totalClasses == null) {
              chartData.title = dataOne?.title;
            } else if (isClassesOne) {
              if (dataOri?.totalClasses != null && _.isNumber(dataOri?.totalClasses)) {
                // Number of classes: 23,  Metrics for top 5 classes
                let total = dataOri?.totalClasses ?? 0;
                const topNum = namesList?.length ?? 0;
                if (topNum < total) {
                  chartData.title = 'Number of classes: ' + total + ', Metrics for top ' + topNum + ' classes';
                } else {
                  chartData.title = 'Number of classes: ' + total;
                }
              } else {
                const topNum = namesList?.length ?? 0;
                if (topNum > 0) {
                  chartData.title = 'Number of classes: ' + topNum;
                }
              }
            } else {
              if (dataOri?.totalFeatures != null && _.isNumber(dataOri?.totalFeatures)) {
                // Number of classes: 23,  Metrics for top 5 classes
                let total = dataOri?.totalFeatures ?? 0;
                const topNum = namesList?.length ?? 0;
                if (topNum < total) {
                  chartData.title = 'Feature Importance Scores (top ' + topNum + ' out of ' + total + ' total features)';
                } else {
                  chartData.title = 'Feature Importance Scores';
                }
              } else {
                const topNum = namesList?.length ?? 0;
                if (topNum > 0) {
                  chartData.title = 'Feature Importance Scores';
                }
              }
            }
          }

          let seriesY = [];
          if (dataOri?.barsData != null) {
            subType = 100;
            dataOri?.barsX?.some((x1, x1ind) => {
              seriesY.push(x1);
            });

            chartHelpIdTopRight = dataOri?.chartHelpIdTopRight ?? 'Test Data Prediction Distribution';
          } else if (dataOri?.topKCorrelated != null) {
            subType = 7;
            seriesY.push('topKCorrelated');
            chartHelpIdTopRight = 'topKCorrelated';
          } else if (dataOri?.precision != null) {
            subType = 1;
            seriesY.push('precision');
            seriesY.push('recall');
            seriesY.push('support');
            chartHelpIdTopRight = 'precision';
          } else if (dataOri?.ndcg != null) {
            subType = 2;
            seriesY.push('ndcg');
            chartHelpIdTopRight = 'ndcg';
          } else if (dataOri?.map != null) {
            subType = 3;
            seriesY.push('map');
            chartHelpIdTopRight = 'map';
          } else if (dataOri?.features != null) {
            subType = 4;
            seriesY.push('importance_score');
            chartHelpIdTopRight = 'importance_score';
          } else if (dataOri?.smape != null) {
            subType = 5;
            seriesY.push('smape');
            chartHelpIdTopRight = 'smape';
          } else if (dataOri?.nrmse != null && chartHelpIdTopRight !== 'chart_Breakdown_accuracy_over_history_length') {
            subType = 6;
            seriesY.push('nrmse');
            chartHelpIdTopRight = 'nrmse';

            if (dataOri?.cNrmse != null) {
              seriesY.push('cNrmse');
            }
          }
          if (dataOri?.chartHelpIdTopRight === 'chart_Breakdown_accuracy_over_history_length') {
            chartHelpIdTopRight = 'Breakdown_accuracy_over_history_length';
          }

          chartData.seriesY = seriesY;

          let data1 = [];

          if (seriesY.length > 1) {
            delete chartData.barWidth;
          }

          namesList?.some((cn1, cn1ind) => {
            let d1: any = {};
            d1.x = cn1;

            if (subType === 1) {
              d1.precision = dataOri?.precision?.[cn1ind];
              d1.recall = dataOri?.recall?.[cn1ind];
              d1.support = dataOri?.support?.[cn1ind];

              minV = Math.min(minV, Math.min(d1.precision ?? 0, Math.min(d1.recall ?? 0, d1.support ?? 0)));
            } else if (subType === 2) {
              d1.ndcg = dataOri?.ndcg?.[cn1ind];

              minV = Math.min(minV, d1.ndcg ?? 0);
            } else if (subType === 3) {
              d1.map = dataOri?.map?.[cn1ind];

              minV = Math.min(minV, d1.map ?? 0);
            } else if (subType === 4) {
              chartData.barEachColor = true;
              d1.importance_score = Math.abs(dataOri?.features?.[cn1ind] ?? 0);

              minV = 0; //Math.min(minV, d1.importance_score ?? 0);
            } else if (subType === 5) {
              d1.smape = dataOri?.smape?.[cn1ind];

              minV = Math.min(minV, d1.smape ?? 0);
            } else if (subType === 6) {
              d1.nrmse = dataOri?.nrmse?.[cn1ind];
              minV = Math.min(minV, d1.nrmse ?? 0);

              if (dataOri?.cNrmse != null) {
                d1.cNrmse = dataOri?.cNrmse?.[cn1ind];
                minV = Math.min(minV, d1.cNrmse ?? 0);
              }
            } else if (subType === 7) {
              d1.topKCorrelated = dataOri?.topKCorrelated?.[cn1ind];

              minV = Math.min(minV, d1.topKCorrelated ?? 0);
            } else if (subType === 100) {
              dataOri?.barsX?.some((x1, x1ind) => {
                d1[x1] = dataOri?.barsData?.[cn1ind]?.[x1ind];
                minV = Math.min(minV, d1[x1] ?? 0);
              });
            }

            data1.push(d1);
          });

          if (subType === 4) {
            data1 = data1.sort((a, b) => {
              const v1 = a?.importance_score ?? 0;
              const v2 = b?.importance_score ?? 0;
              if (v1 === v2) {
                return 0;
              } else if (v1 < v2) {
                return 1;
              } else {
                return -1;
              }
            });
          }

          chartData.data = data1;
        }
        // @ts-ignore
        let yAxisMax1 = dataOne?.yAxisMax;
        if (yAxisMax1 != null) {
          yAxisMax1 = Utils.decimals(yAxisMax1, 3);
        }
        let axisYMin = minV;
        let colorFixed: any = props.forceColor;
        let startColorIndex = props.forceColor ? props.startColorIndex || 0 : maxColors + 1 + (props.startColorIndex || 0);
        if (subType === 4) {
          if (dataOri?.bottomLine != null) {
            colorFixed = ColorsGradients;
            startColorIndex = 0;
          } else {
            colorFixed = ColorsGradients[0];
            startColorIndex = null;
          }
        }

        if (dataOri?.barsList != null && chartData && !dataOri?.keepTitle) {
          chartData.title = null;
        }

        if (dataOri?.chartHelpIdTopRightOverride != null) {
          chartHelpIdTopRight = dataOri?.chartHelpIdTopRightOverride;
        }
        if (chartHelpIdTopRight && chartData) {
          chartData.chartHelpIdTopRight = 'chart_' + chartHelpIdTopRight;
        }

        let resH = (
          <ChartXYExt
            key={'c' + chartListSelIndex}
            topElem={dataOri?.topElem}
            showDownload={props.showDownload}
            noMax={props.noMax}
            colorFixed={colorFixed}
            startColorIndex={startColorIndex}
            type={'bar'}
            width={props.width}
            height={props.height}
            useEC
            data={chartData}
            axisYMin={axisYMin}
            axisYMax={props.noMax ? null : yAxisMax1 ?? dataOri?.yAxisMax ?? 1}
          />
        );
        chartDataLastRes.current = resH;
        return resH;

      case 'heatmap':
        let chartData2: any = {
          data: dataOne?.data,
          chartHelpIdTopRight: 'chart_heatmap',
        };

        _.assign(chartData2, {
          labelColor: '#8798ad',
          titleStyle: {
            color: '#d1e4f5',
            fontFamily: 'Matter',
            fontSize: 13,
            fontWeight: 'bold',
          },
        });

        chartData2.title = dataOne?.title;
        if (dataOri?.fieldNameTooltip != null) {
          chartData2.fieldNameTooltip = dataOri.fieldNameTooltip;
        }
        if (dataOri?.fieldNameTooltipAddIndex != null) {
          chartData2.fieldNameTooltipAddIndex = dataOri.fieldNameTooltipAddIndex;
        }

        // @ts-ignore
        let yAxisMax2 = dataOne?.yAxisMax;
        if (yAxisMax2 != null) {
          yAxisMax2 = Utils.decimals(yAxisMax2, 3);
        }
        let axisYMin2 = minV;
        let colorFixed2: any = props.forceColor;
        let startColorIndex2 = props.forceColor ? props.startColorIndex || 0 : maxColors + 1 + (props.startColorIndex || 0);

        let resHM = (
          <ChartXYExt
            key={'h' + chartListSelIndex}
            topElem={dataOri?.topElem}
            showDownload={props.showDownload}
            noMax={props.noMax}
            colorFixed={colorFixed2}
            startColorIndex={startColorIndex2}
            type={'heatmap'}
            width={props.width}
            height={props.height}
            useEC
            data={chartData2}
            axisYMin={axisYMin2}
            axisYMax={props.noMax ? null : yAxisMax2 ?? dataOri?.yAxisMax ?? 1}
          />
        );
        chartDataLastRes.current = resHM;
        return resHM;

      case 'line':
        let data1 = [];
        dataOri?.reaiXCoords?.some((p1, p1ind) => {
          let x = dataOri?.reaiXCoords?.[p1ind];
          let y = dataOri?.reaiYCoords?.[p1ind];
          data1.push({
            x,
            y,
            pointWidth: 4,
          });
        });

        if (dataOri?.emptyData === true) {
          data1 = undefined;
        }

        chartData = {
          data: data1,
          // title: title1,
          isScatter: dataOri?.isScatterOri ?? true,
          isScatterLine: dataOri?.isScatterLine,
          titleX: dataOri?.xAxis || 'X',
          titleY: dataOri?.yAxis || 'Y',
          useTitles: true,
          customPoints: dataOri?.customPoints ?? true,
          xlim: dataOri?.xlim,
          ylim: dataOri?.ylim,
          lines: dataOri?.lines,
          typeAxisType: dataOri?.typeAxisType,
          dataAxisX: dataOri?.dataAxisX,
          axis1typeData: dataOri?.axis1typeData,
          emptyData: dataOri?.emptyData,
          divisorX: dataOri?.divisorX === null ? undefined : 5,
          divisorY: dataOri?.divisorY === null ? undefined : 5,
          isScatterMetric: dataOri?.isScatterMetric,
          sameMaxXY: dataOri?.sameMaxXY,
          chartHelpIdTopRight: 'chart_' + (dataOri?.xAxis ?? '____'),
          axisXrenderValue: (value) => Utils.decimals(value, 1),
          axisYrenderValue: (value) => Utils.decimals(value, 1),
        };
        let resL = <ChartXYExt key={'l' + chartListSelIndex} topElem={dataOri?.topElem} showDownload={props.showDownload} width={props.width} height={props.height} data={chartData} startColorIndex={maxColors + 1} />;
        chartDataLastRes.current = resL;
        return resL;

      case 'scatter':
        let dataScatter = [];
        if (dataOri?.useOriData) {
          dataScatter = dataOri?.data?.map((d1) => {
            d1 = { ...d1 };
            d1.pointWidth = 4;
            return d1;
          });
        } else {
          dataOri?.data?.some((p1, p1ind) => {
            let x = p1?.[0];
            let y = p1?.[1];
            dataScatter.push({
              x,
              y,
              pointWidth: 4,
            });
          });
        }

        chartData = {
          data: dataScatter,
          title: props.data?.title,
          isScatter: true,
          isScatterMetric: true,
          titleX: dataOri?.xAxis || 'X',
          titleY: dataOri?.yAxis || 'Y',
          seriesY: dataOri?.seriesYlines,
          downloadIgnoreX: dataOri?.downloadIgnoreX,
          downloadRenameX: dataOri?.downloadRenameX,
          symbolSizeAll: dataOri?.symbolSizeAll,
          useTitles: true,
          customPoints: true,
          dotColorClassByIndex: dataOri?.dotColorClassByIndex,
          onClickChart: dataOri?.onClickChart,
          yAxisType: dataOri?.yAxisType,
          xlim: dataOri?.xlim,
          pointWidth: dataOri?.pointWidth,
          ylim: dataOri?.ylim,
          lines: dataOri?.lines,
          axisXstepSize: dataOri?.axisXstepSize,
          divisorX: dataOri?.divisorX === null ? undefined : dataOri?.divisorX ?? 5,
          divisorY: dataOri?.divisorY === null ? undefined : dataOri?.divisorY ?? 5,
          sameMaxXY: dataOri?.sameMaxXY,
          axisXrenderValue: dataOri?.axisXrenderValue ?? ((value) => Utils.decimals(value, 1)),
          axisYrenderValue: dataOri?.axisYrenderValue ?? ((value) => Utils.decimals(value, 1)),
        };
        let resScatter = <ChartXYExt key={'s' + chartListSelIndex} topElem={dataOri?.topElem} showDownload={props.showDownload} width={props.width} height={props.height} data={chartData} startColorIndex={maxColors + 1} />;
        chartDataLastRes.current = resScatter;
        return resScatter;

      case 'lineList':
        let dataLines = [];
        if (dataOri?.useOriData) {
          dataLines = dataOri?.data; //?.map(d1 => {
          //   d1 = {...d1};
          //   d1.pointWidth = 4;
          //   return d1;
          // });
        } else {
          dataOri?.data?.some((p1, p1ind) => {
            let x = p1?.[0];
            let y = p1?.[1];
            dataLines.push({
              x,
              y,
              pointWidth: 4,
            });
          });
        }

        chartData = {
          data: dataLines,
          title: props.data?.title,
          isScatter: true,
          isScatterMetric: true,
          titleX: dataOri?.xAxis || 'X',
          titleY: dataOri?.yAxis || 'Y',
          seriesY: dataOri?.seriesYlines,
          downloadIgnoreX: dataOri?.downloadIgnoreX,
          downloadRenameX: dataOri?.downloadRenameX,
          useLegend: dataOri?.useLegend,
          axisYMin: dataOri?.axisYMin,
          noMax: dataOri?.noMax,
          gapAxisLeft: dataOri?.gapAxisLeft,
          axis1Gap: dataOri?.axis1Gap,
          fieldNameTooltip: dataOri?.seriesYlines,
          useLegendSeriesIndex: true,
          maxDecimalsTooltip: 3,
          useTitles: true,
          xlim: dataOri?.xlim,
          ylim: dataOri?.ylim,
          axisXrenderValue: (value) => Utils.decimals(value, 1),
          axisYrenderValue: (value) => Utils.decimals(value, 1),
        };
        let resLines = <ChartXYExt key={'s' + chartListSelIndex} type={'line'} useEC topElem={dataOri?.topElem} showDownload={props.showDownload} width={props.width} height={props.height} data={chartData} startColorIndex={0} />;
        chartDataLastRes.current = resLines;
        return resLines;

      case 'ec':
        let wwEC = props.width;
        let hhEC = props.height;

        let ecDoCenter = false;
        if (dataOri?.sameMaxXY === true && wwEC != null && hhEC != null) {
          let min = Math.min(wwEC, hhEC);
          wwEC = min;
          hhEC = min;
          ecDoCenter = true;
        }
        let colorFixed3 = dataOri?.colorFixed;
        let startColorIndex3 = dataOri?.startColorIndex ?? maxColors + 1;

        chartData = dataOri ?? {};
        let resCustom = (
          <ChartXYExt key={'ec' + chartListSelIndex} useEC topElem={dataOri?.topElem} showDownload={props.showDownload} colorFixed={colorFixed3} width={wwEC} height={hhEC} data={chartData} startColorIndex={startColorIndex3} />
        );
        if (ecDoCenter) {
          resCustom = (
            <div
              css={`
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
              `}
            >
              {resCustom}
            </div>
          );
        }

        chartDataLastRes.current = resCustom;
        return resCustom;

      default:
        break;
    }

    return null;
  }, [props.data, props.width, props.height, chartListSelIndex]);

  const titleSelectorOptions = useMemo(() => {
    let dataOne = props.data;
    // @ts-ignore
    if (dataOne != null && _.isObject(dataOne) && dataOne.list != null && _.isArray(dataOne.list)) {
      // @ts-ignore
      return dataOne.list?.map((d1, d1ind) => {
        return {
          label: d1.title,
          value: d1ind,
          data: d1,
        };
      });
    }
    return null;
  }, [props.data]);

  const styleOneChart = useMemo(() => {
    return _.assign({ width: props.width + 'px', minHeight: props.height + (titleSelectorOptions == null ? 0 : 50) + 'px' }, props.styleBack || {});
  }, [props.styleBack, props.width, props.height, titleSelectorOptions]);

  const titleSelectorOptionsSel = useMemo(() => {
    return titleSelectorOptions?.find((v1) => v1.value === chartListSelIndex);
  }, [titleSelectorOptions, chartListSelIndex]);

  const onChangeTitleSel = (option1) => {
    setChartListSelIndex(option1?.value ?? 0);
  };

  const titleSelector = useMemo(() => {
    if (titleSelectorOptions == null) {
      return null;
    }
    let popupContainerForMenu = (node) => document.getElementById('body2');
    return (
      <div className={styles.chartHeader}>
        <span className={styles.titleContainer}>
          {titleSelectorOptionsSel?.data?.beforeTitle != null && <span className={styles.title}>{titleSelectorOptionsSel?.data?.beforeTitle}</span>}
          <span className={styles.select}>
            <SelectExt value={titleSelectorOptionsSel} options={titleSelectorOptions} onChange={onChangeTitleSel} menuPortalTarget={popupContainerForMenu(null)} />
          </span>
          <HelpIcon id={(props.data as any)?.chartHelpIdList} style={{ marginLeft: '10px' }} />
        </span>
      </div>
    );
  }, [titleSelectorOptions, titleSelectorOptionsSel]);

  return (
    <div
      style={styleOneChart}
      css={`
        background-color: ${props.backNormal ? '#18232e' : '#101f35'};
      `}
      className={styles.chart}
    >
      {titleSelector}
      {content}
    </div>
  );
});

export default ChartMetrics;
