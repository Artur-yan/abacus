import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Checkbox from 'antd/lib/checkbox';
import DatePicker from 'antd/lib/date-picker';
import Popover from 'antd/lib/popover';
import Timeline from 'antd/lib/timeline';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment-timezone';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { memProjectById } from '../../stores/reducers/projects';
import HelpBox from '../HelpBox/HelpBox';
import { IModelPropsCommon } from '../ModelPredictionCommon/ModelPredictionCommon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import SmartMetricsList from '../SmartMetricsList/SmartMetricsList';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./ModelPredictionsChartTableOne.module.css');
const sd = require('../antdUseDark.module.css');
const RangePicker = DatePicker.RangePicker;

const blueColor = '#224199';
const blue2Color = '#495b91';
const colorTesting = '#d47136';
const greenColor = '#2c972f';
const compareFileColor = '#972c8c';

interface IModelPredictionsChartTableOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;

  onChangeProject?: (key: any) => void;

  projectId?: string;
}

interface IModelPredictionsChartTableOneState {
  selectedFieldId?: string;
  selectedFieldValueId?: string;
  selectedRangeDatesId?: string;
  isRefreshingChart?: boolean;
  dateStart?: any;
  predictionStart?: any;
  predictionEnd?: any;
  dateEnd?: any;
  sessionId?: string;
  firstTime?: boolean;
  useTimezoneForAPI?: any;
  showTime?: boolean;
  dateOpenPopup?: boolean;
  errorMsg?: string;
  errorMsgPrediction?: string;
  fieldListEnabled?: any;
  fieldList?: any;
  lastChartDataPointDate?: any;
  windowMetrics?: any;
  windowMetricsList?: any[];
  dataChart?: any;
  dataChartTable?: any;
  dataChartUseData?: any;
  breakdownLabels?: string[];
  breakdownLabelsValue?: any;
  breakdownLabelsIDs?: string[];
  breakdownLabelsAccuracy?: any[];
  breakdownLabelsTitle?: string;
  zoomWinMin?: any;
  zoomWinMax?: any;
  testWindowCall?: any;
  testWindowCallResult?: any[];
  accuracyInTestPeriod?: any;
}

let lastUseData = null;

class ModelPredictionsChartTableOne extends React.PureComponent<IModelPredictionsChartTableOneProps & IModelPropsCommon, IModelPredictionsChartTableOneState> {
  private unDark: any;
  private chartdiv: HTMLDivElement;
  private prepareChartTimer: any;
  private alreadyPreparedChart: boolean;
  private chart: any;
  private cacheChartData: any;
  private isM: boolean;
  private lastCallChartData: any;
  private useCustomDates: { testFoldStartTs: any; minTs: any; maxTs: any; maxPredictionTs: any };
  private timeoutRetryRunModel: any;
  private lastZoomStart: any;
  private lastZoomEnd: any;
  private lastChartData: any;
  private lastChartAxis: any;
  private isChartReady: any;
  private needRefreshEndChangesScroll: any;
  private animMax: any;
  private maxZoomedAllChart: any;
  dataFieldX: any;
  lastDataChart: any;
  timeoutRetryChangeAxis: NodeJS.Timeout;

  constructor(props) {
    super(props);

    let { paramsProp } = props;
    let useTimezoneForAPI = 'UTC';

    let calcParam = (name, isDate = false) => {
      let res = paramsProp ? paramsProp.get(name) : null;
      if (isDate && res != null) {
        res = moment.unix(res).tz(useTimezoneForAPI || 'UTC', false);
      }
      return res;
    };

    this.state = {
      sessionId: uuid.v1(),
      firstTime: true,
      showTime: calcParam('showTime', false),
      selectedFieldId: calcParam('selectedFieldId'),
      accuracyInTestPeriod: calcParam('accuracyInTestPeriod'),
      selectedFieldValueId: calcParam('selectedFieldValueId'),
      selectedRangeDatesId: calcParam('selectedRangeDatesId'),
      dateStart: calcParam('dateStart', true),
      dateEnd: calcParam('dateEnd', true),
      predictionStart: calcParam('predictionStart', true),
      predictionEnd: calcParam('predictionEnd', true),
      useTimezoneForAPI: useTimezoneForAPI,
      breakdownLabelsValue: Utils.tryParseInt(calcParam('idsDataIndex')),
    };
  }

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let optionsField = this.memOptionsField(true)(foundProject1, this.props.defDatasets);
  };

  componentDidUpdate(prevProps: Readonly<IModelPredictionsChartTableOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsChartTableOneState>, snapshot?: any): void {
    this.doMem();
  }

  refreshUrlWithParams = () => {
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (projectId) {
      let url = '/' + PartsLink.model_predictions + '/' + projectId;
      let params: any = {
        selectedAlgoId: this.props.selectedAlgoId,
        selectedFieldId: this.state.selectedFieldId,
        accuracyInTestPeriod: this.state.accuracyInTestPeriod,
        selectedFieldValueId: this.state.selectedFieldValueId,
        selectedRangeDatesId: this.state.selectedRangeDatesId,
        showTime: this.state.showTime,

        idsList: paramsProp?.get('idsList'),
        idsBarChart: paramsProp?.get('idsBarChart'),
        idsDetailModelVersion: paramsProp?.get('idsDetailModelVersion'),
        idsDataIndex: paramsProp?.get('idsDataIndex'),

        filterList: paramsProp?.get('filterList'),
        filterIdsName: paramsProp?.get('filterIdsName'),
        filterNameSmall: paramsProp?.get('filterNameSmall'),
        filterModelVersion: paramsProp?.get('filterModelVersion'),
        filterLongName: paramsProp?.get('filterLongName'),

        requestId: paramsProp?.get('requestId'),
        requestBPId: paramsProp?.get('requestBPId'),
      };
      if (this.state.dateStart != null) {
        params.dateStart = this.state.dateStart.unix();
      }
      if (this.state.dateEnd != null) {
        params.dateEnd = this.state.dateEnd.unix();
      }
      if (this.state.predictionStart != null) {
        params.predictionStart = this.state.predictionStart.unix();
      }
      if (this.state.predictionEnd != null) {
        params.predictionEnd = this.state.predictionEnd.unix();
      }

      let search = Utils.processParamsAsQuery(params);
      Location.replace(url, undefined, search);
    }
  };

  recreateChart = (useData?: any, forceUseData = false, fieldListEnabled = null, testFoldStartTs = null, selectedFieldValueId = null) => {
    if (!this.isM) {
      return;
    }

    //
    let usedCacheData = false;
    if (useData == null) {
      if (!forceUseData) {
        useData = lastUseData;
      }
    } else {
      usedCacheData = true;
      lastUseData = useData;
    }

    this.alreadyPreparedChart = false;
    if (this.lastChartData == null) {
      if (this.chart != null) {
        // @ts-ignore
        this.chart.dispose?.();
        this.chart = null;
      }
      $(this.chartdiv).empty();
    }

    //
    if (!useData) {
      return;
    }

    let fieldList = useData.fieldList;
    if (fieldListEnabled == null || fieldListEnabled.length === 0) {
      if (fieldList != null && fieldList.length > 0) {
        fieldListEnabled = fieldList.map((f1) => 1);
      }
    }

    let windowMetricsList = useData?.deploymentMetrics;
    if (windowMetricsList != null && !_.isArray(windowMetricsList)) {
      windowMetricsList = null;
    }

    this.setState(
      {
        showTime: useData.showHours,
        fieldListEnabled,
        fieldList,
        windowMetrics: useData?.metrics,
        windowMetricsList,
      },
      () => {
        this.prepareChart(useData, undefined, usedCacheData, fieldListEnabled, testFoldStartTs, selectedFieldValueId);
      },
    );
  };

  onDarkModeChanged = (isDark) => {
    if (!this.isM) {
      return;
    }

    this.recreateChart();

    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
    this.doMem(false);
  }

  prepareChart = (useData: any, max = 50, usedCacheData = false, fieldListEnabled = null, testFoldStartTs = null, selectedFieldValueId = null) => {
    if (!this.isM) {
      return;
    }

    if (this.alreadyPreparedChart) {
      return;
    }

    //
    if (!this.chartdiv) {
      if (this.prepareChartTimer) {
        clearTimeout(this.prepareChartTimer);
        this.prepareChartTimer = null;
      }
      if (max > 0) {
        this.prepareChartTimer = setTimeout(() => {
          this.prepareChart(useData, max - 1, usedCacheData, fieldListEnabled, testFoldStartTs, selectedFieldValueId);
        }, 40);
      }
      return;
    }

    //
    this.alreadyPreparedChart = true;

    let $this = this;

    // @ts-ignore
    Promise.all([
      import('@amcharts/amcharts4/core'),
      import('@amcharts/amcharts4/charts'),
      import('@amcharts/amcharts4/themes/moonrisekingdom'),
      import('@amcharts/amcharts4/themes/dark'),
      // import('@amcharts/amcharts4/themes/animated'),
    ])
      .then((modules) => {
        const am4core: any = modules[0];
        const am4charts: any = modules[1];
        const am4themes_light: any = modules[2].default;
        const am4themes_dark: any = modules[3].default;
        // const am4themes_animated: any = modules[4].default;

        am4core.options.commercialLicense = true;

        //
        am4core.unuseAllThemes();
        // am4core.useTheme(am4themes_animated);
        am4core.useTheme(Utils.isDark() ? am4themes_dark : am4themes_light);

        // @ts-ignore
        let willUseNewData = this.state.predictionEnd == null || this.lastChartData == null;

        //
        useData = _.assign(useData ?? {}, {
          isDateType: 'minute',
          fieldX: 'date',
          field1: 'actual',
          convertToDateFields: ['date'],
          formatX: 'HH:mm, d MMMM',
          tooltipFormat: 'Actual: [bold]{valueY}[/]',
          tooltipFormat2: 'Predicted: [bold]{valueY}[/]',
          seriesName1: 'Actual',
          seriesName2: 'Predicted',
        });

        let kkS = Object.keys(useData?.input ?? {});
        kkS = kkS.filter((s1) => s1?.toLowerCase() !== 'date');
        let fieldKK = kkS?.[0];

        let dataPre = [];
        useData?.input?.Date?.some((d1, d1ind) => {
          let obj1: any = {};
          obj1.date = d1;
          obj1.actual = useData?.input?.[fieldKK]?.[d1ind] ?? 0;

          dataPre.push(obj1);
        });

        let kkPredicted = Object.keys(useData?.predicted ?? {});
        kkPredicted = kkPredicted.sort((a, b) => {
          return Utils.tryParseFloat(b) - Utils.tryParseFloat(a);
        });
        let dataChartTable = [];
        kkPredicted?.some((k1) => {
          let actual1 = useData?.actual?.['_cumulative_data']?.[k1] ?? undefined;
          dataChartTable.unshift({ pred: useData?.predicted?.[k1], predLen: '' + k1, actual: actual1 });
        });

        //
        useData.data = dataPre;

        //
        this.dataFieldX = useData?.fieldX;

        let isNewChart = false,
          lastChartAxis = $this.lastChartAxis || {};
        let chart = this.chart;
        if (chart == null || willUseNewData) {
          if (this.chart != null) {
            // @ts-ignore
            this.chart.dispose?.();
            this.chart = null;
          }
          $(this.chartdiv).empty();

          isNewChart = true;

          chart = am4core.create(this.chartdiv, am4charts.XYChart);
          this.chart = chart;
          lastChartAxis = {};
        }
        $this.lastChartAxis = lastChartAxis;
        chart.paddingRight = 20;
        chart.paddingTop = 24;

        let lenPredShowCircle = !!useData.lenPredShowCircle;
        let dataChart = useData.data;

        if (!useData.dataAlreadyConverted && dataChart) {
          if (useData.convertToDateFields && useData.convertToDateFields.length > 0) {
            useData.convertToDateFields.some((c1) => {
              dataChart = dataChart.map((d1) => {
                if (_.isNumber(d1[c1])) {
                  d1[c1 + '_lastInt'] = d1[c1];
                  d1[c1 + '_lastMoment'] = moment(d1[c1]);
                  d1[c1] = new Date(d1[c1]);
                }
                return d1;
              });
            });
          }

          if (testFoldStartTs != null && useData.fieldX && useData.field1) {
            const dt1 = moment(testFoldStartTs);
            let isFirstNotIn = true;
            let countIn = 0;
            dataChart = dataChart.map((d1, d1ind) => {
              const isIn = moment(d1[useData.fieldX]).isSameOrBefore(dt1);
              if (isIn) {
                const v1 = d1[useData.field1];
                if (v1 != null && isIn) {
                  delete d1[useData.field1];
                }
                d1.actualTrainInt = v1;
              } else {
                if (isFirstNotIn) {
                  isFirstNotIn = false;
                  if (dataChart[d1ind - 1] && dataChart[d1ind - 2]) {
                    dataChart[d1ind - 1]['_' + useData.field1] = dataChart[d1ind - 1].actualTrainInt;
                    dataChart[d1ind - 2]['_' + useData.field1] = dataChart[d1ind - 2].actualTrainInt;
                    // dataChart[d1ind-2][useData.fieldX+"_bulletOpacity"] = 1;
                    //
                    // dataChart[d1ind-2].dummyData = dataChart[d1ind-2].dummyData || {};
                    // dataChart[d1ind-2].dummyData.bulletOpacity = 1;
                    //
                    // dataChart[d1ind-2]['__p50'] = dataChart[d1ind-2].actualTrainInt;
                    // dataChart[d1ind-2]['____p50'] = dataChart[d1ind-2].actualTrainInt;

                    // delete dataChart[d1ind-1].actualTrainInt;
                  }
                }

                d1['_' + useData.field1] = d1[useData.field1];
                delete d1[useData.field1];

                d1['lenOne_bulletOpacity'] = 1;
                countIn++;
              }
              return d1;
            });

            if (countIn === 1) {
              lenPredShowCircle = true;
              useData.lenPredShowCircle = lenPredShowCircle;
            }
          }
        }

        //
        useData.dataAlreadyConverted = true;

        //
        if (selectedFieldValueId) {
          let dictByDateNumber = {};
          const c1 = useData.fieldX;
          if (c1) {
            dataChart?.some((d1) => {
              const dt1 = d1[c1 + '_lastInt'];
              if (dt1 != null) {
                dictByDateNumber[dt1] = d1;
              }
            });
          }
        }
        //

        if (dataChart) {
          dataChart.some((d1) => {
            if (d1?.c_accuracy != null) {
              d1['____acc'] = d1.c_accuracy;
            }

            d1['_actualValue'] = d1?.actualTrainInt ?? (useData.field1 == null ? null : d1?.[useData.field1]) ?? d1?._actual;
            useData.fieldList?.some((f1, f1ind) => {
              let v1 = d1[f1] ?? d1['_' + f1];
              v1 = v1 ?? d1['__' + f1];
              d1['____' + f1] = v1;
            });
          });
        }

        // this.lastDataChart = dataChart;
        // chart.data = dataChart;

        let ddT = [...(dataChart ?? [])];
        // dataChartTable = [...ddT, ...dataChartTable];
        this.setState({
          dataChart: ddT,
          dataChartTable,
          dataChartUseData: useData,
        });

        let dateAxis = lastChartAxis.dateAxis ?? chart.xAxes.push(new am4charts.DateAxis());
        lastChartAxis.dateAxis = dateAxis;

        if (isNewChart) {
          if (useData.isDateType) {
            dateAxis.baseInterval = {
              timeUnit: useData.isDateType,
              count: 1,
            };
          }
          if (useData.formatX) {
            dateAxis.tooltipDateFormat = useData.formatX;
          }
          dateAxis.dateFormatter.timezoneOffset = 0;
          dateAxis.title.text = useData.titleX || '';

          dateAxis.showOnInit = false;
          dateAxis.keepSelection = true;
        }

        if (isNewChart) {
          $this.isChartReady = false;
        }

        const doSetMaxValueMax = (minZoomed?, maxZoomed?) => {
          minZoomed = minZoomed ?? dateAxis.minZoomed;
          maxZoomed = maxZoomed ?? dateAxis.maxZoomed;

          if (minZoomed == null || maxZoomed == null) {
            return;
          }

          const minZoomedDT = moment(minZoomed);
          const maxZoomedDT = moment(maxZoomed);
          let max = null;
          ($this.lastDataChart ?? dataChart)?.some((d1) => {
            const dt1 = d1[useData.fieldX + '_lastMoment'];
            if (dt1?.isSameOrAfter(minZoomedDT) && dt1?.isSameOrBefore(maxZoomedDT)) {
              const kk = Object.keys(d1);
              kk.some((k1) => {
                let inExtra = false;
                if (useData.extra_table_columns != null) {
                  if (useData.extra_table_columns.includes(k1)) {
                    inExtra = true;
                  }
                }

                if (!_.startsWith(k1, useData.fieldX) && !inExtra) {
                  const v1 = d1[k1];
                  if (_.isNumber(v1)) {
                    if (max == null) {
                      max = v1;
                    } else {
                      max = Math.max(max, v1);
                    }
                  }
                }
              });
            }
          });
          if (max != null && max > 0) {
            if ($this.animMax != null) {
              if (!$this.animMax.isDisposed()) {
                $this.animMax.stop();
              }
              $this.animMax = null;
            }
            $this.animMax = valueAxis.animate({ property: 'max', to: max * 1.1 }, 300, am4core.ease.quadOut);
            // $this.animMax.events.on('animationprogress', (ev) => {
            //   doPrepareScrollRangeX();
            // });
            // $this.animMax.events.on('animationended', (ev) => {
            //   doPrepareScrollRangeX();
            // });
            // valueAxis.max = max * 1.1;
          }

          // doPrepareScrollRangeX();
        };

        let onEndChangeAxisDate;
        if (isNewChart) {
          onEndChangeAxisDate = (ev) => {
            if (!this.isM) {
              return;
            }

            let minZoomed = dateAxis.minZoomed;
            let maxZoomed = dateAxis.maxZoomed;

            if (minZoomed == null || maxZoomed == null) {
              if (this.timeoutRetryChangeAxis != null) {
                clearTimeout(this.timeoutRetryChangeAxis);
                this.timeoutRetryChangeAxis = null;
              }
              this.timeoutRetryChangeAxis = setTimeout(() => {
                this.timeoutRetryChangeAxis = null;
                if (!this.isM) {
                  return;
                }

                onEndChangeAxisDate(ev);
              }, 300);
              return;
            }

            if (this.timeoutRetryChangeAxis != null) {
              clearTimeout(this.timeoutRetryChangeAxis);
              this.timeoutRetryChangeAxis = null;
            }

            doSetMaxValueMax();

            setTimeout(() => {
              $this.isChartReady = true;

              if ($this.needRefreshEndChangesScroll) {
                $this.needRefreshEndChangesScroll = false;
                setTimeout(() => {
                  if (!$this.isM) {
                    return;
                  }

                  onEndChangeAxisDate(null);
                }, 0);
              }
            }, 0);

            if (!$this.isChartReady) {
              return;
            }

            if (ev != null) {
              if ($this.lastZoomEnd == null /*|| $this.lastZoomEnd===maxZoomed*/) {
                $this.lastZoomStart = minZoomed;
                $this.lastZoomEnd = maxZoomed;
                return;
              }
            }
            $this.lastZoomStart = minZoomed;
            $this.lastZoomEnd = maxZoomed;

            let predictionEndT = maxZoomed == null ? null : moment(maxZoomed).tz(this.state.useTimezoneForAPI || 'UTC', false);
            if ((this.state.predictionEnd != null && predictionEndT == null) || (this.state.predictionEnd == null && predictionEndT != null) || !this.state.predictionEnd.isSame(predictionEndT)) {
              if (!this.state.showTime && predictionEndT) {
                predictionEndT = predictionEndT.startOf('day');
              }
              this.setState(
                {
                  predictionEnd: predictionEndT,
                },
                () => {
                  // this.refreshUrlWithParams();
                },
              );
            }

            this.setState({
              zoomWinMin: minZoomed,
              zoomWinMax: maxZoomed,
            });
          };
          onEndChangeAxisDate = _.debounce(onEndChangeAxisDate, 200);
          dateAxis.events.on('startchanged', onEndChangeAxisDate);
          dateAxis.events.on('endchanged', onEndChangeAxisDate);
        }

        let valueAxis = lastChartAxis.valueAxis ?? chart.yAxes.push(new am4charts.ValueAxis());
        lastChartAxis.valueAxis = valueAxis;

        if (isNewChart) {
          valueAxis.tooltip.disabled = true;
          valueAxis.title.text = useData.titleY || '';

          valueAxis.showOnInit = false;
          valueAxis.min = 0;
          valueAxis.strictMinMax = true;
        }

        let useLegend = !Utils.isNullOrEmpty(useData.seriesName1) || !Utils.isNullOrEmpty(useData.seriesName2);

        let series = lastChartAxis.series ?? chart.series.push(new am4charts.LineSeries());
        lastChartAxis.series = series;

        let fieldList0 = useData.fieldList;
        if (isNewChart) {
          series.showOnInit = false;
          if (useLegend) {
            series.name = useData.seriesName1?.replace('Actual', 'Actual (Test)');
          }
          series.dataFields.dateX = useData.fieldX;
          series.dataFields.valueY = '_' + useData.field1;
          if (useData.tooltipFormat) {
            series.tooltip.numberFormatter = new am4core.NumberFormatter();
            series.tooltip.numberFormatter.numberFormat = '#.00';
            series.tooltipText = useData.tooltipFormat?.replace('Actual', 'Actual (Test)');
            series.adapter.add('tooltipText', (text, target, key) => {
              const value = target.tooltipDataItem?.dataContext?.[useData.fieldX + '_bulletOpacityLast'];
              if (value == null) {
                return text;
              }
              return '';
            });
          }
          series.fillOpacity = 0;

          if (fieldList0 != null) {
            let c1 = am4core.color(blueColor);
            series.stroke = c1;
            series.fill = c1;
            series.strokeWidth = 3;
          } else {
            series.propertyFields.stroke = 'lineColor';
            series.propertyFields.fill = 'lineColor';
          }

          let bullet = series.bullets.push(new am4charts.CircleBullet());
          bullet.circle.opacity = 0;
          bullet.circle.fill = blueColor; // blueColor;
          bullet.circle.propertyFields.opacity = useData.fieldX + '_bulletOpacity';
          bullet.circle.radius = 5;
        }

        let seriesB = lastChartAxis.seriesB ?? chart.series.push(new am4charts.LineSeries());
        lastChartAxis.seriesB = seriesB;

        if (isNewChart) {
          seriesB.showOnInit = false;
          if (useLegend) {
            seriesB.name = useData.seriesName1;
          }
          seriesB.hiddenInLegend = true;
          seriesB.dataFields.dateX = useData.fieldX;
          seriesB.dataFields.valueY = useData.field1;
          if (useData.tooltipFormat) {
            seriesB.tooltip.numberFormatter = new am4core.NumberFormatter();
            seriesB.tooltip.numberFormatter.numberFormat = '#.00';
            seriesB.tooltipText = useData.tooltipFormat;
          }
          seriesB.fillOpacity = 0;

          if (fieldList0 != null) {
            let c1 = am4core.color(blueColor);
            seriesB.stroke = c1;
            seriesB.fill = c1;
            seriesB.strokeWidth = 3;
          } else {
            seriesB.propertyFields.stroke = 'lineColor';
            seriesB.propertyFields.fill = 'lineColor';
          }
        }

        let seriesT = null;
        if (useData.fieldX != null && testFoldStartTs != null) {
          seriesT = lastChartAxis.seriesT ?? chart.series.push(new am4charts.LineSeries());
          lastChartAxis.seriesT = seriesT;

          if (isNewChart) {
            seriesT.showOnInit = false;
            if (useLegend) {
              seriesT.name = 'Actual (Train)';
            }
            seriesT.dataFields.dateX = useData.fieldX;
            seriesT.dataFields.valueY = 'actualTrainInt';
            if (useData.tooltipFormat) {
              seriesT.tooltip.numberFormatter = new am4core.NumberFormatter();
              seriesT.tooltip.numberFormatter.numberFormat = '#.00';
              seriesT.tooltipText = useData.tooltipFormat?.replace('Actual', 'Actual (Train)');
              seriesT.adapter.add('tooltipText', (text, target, key) => {
                const value = target.tooltipDataItem?.dataContext?.[useData.fieldX + '_bulletOpacityLast'];
                if (value == null || true) {
                  return text;
                }
                return '';
              });
            }
            seriesT.fillOpacity = 0;

            let c1 = am4core.color(colorTesting);
            seriesT.stroke = c1;
            seriesT.fill = c1;
            seriesT.strokeWidth = 3;

            let bullet = seriesT.bullets.push(new am4charts.CircleBullet());
            bullet.circle.opacity = 0;
            bullet.circle.fill = colorTesting; // blueColor;
            bullet.circle.propertyFields.opacity = useData.fieldX + '_bulletOpacity';
            bullet.circle.radius = 5;
          }
        }

        let seriesTDash = null;
        let shouldShowDash = true; //this.isPredEndAtEnd(dataChart);
        if (useData.fieldX != null /* && actualTrainIntDashUsed && shouldShowDash*/) {
          seriesTDash = lastChartAxis.seriesTDash ?? chart.series.push(new am4charts.LineSeries());
          lastChartAxis.seriesTDash = seriesTDash;

          if (!shouldShowDash) {
            seriesTDash.hide();
          } else {
            seriesTDash.show();
          }

          if (isNewChart) {
            seriesTDash.showOnInit = false;
            seriesTDash.dataFields.dateX = useData.fieldX;
            seriesTDash.dataFields.valueY = 'actualTrainIntDash';
            seriesTDash.fillOpacity = 0;

            let c1 = am4core.color(greenColor);
            seriesTDash.stroke = c1;
            seriesTDash.fill = c1;
            seriesTDash.strokeWidth = 3;
            seriesTDash.strokeDasharray = '3,3';

            seriesTDash.hiddenInLegend = true;
          }
        } else {
          seriesTDash = lastChartAxis.seriesTDash;

          if (!this.isPredEndAtEnd(dataChart)) {
            seriesTDash?.hide();
          } else {
            seriesTDash?.show();
          }
        }

        let seriesTDash2 = null;
        if (useData.fieldX != null /* && actualTrainIntDashUsed && shouldShowDash*/) {
          seriesTDash2 = lastChartAxis.seriesTDash2 ?? chart.series.push(new am4charts.LineSeries());
          lastChartAxis.seriesTDash2 = seriesTDash2;

          if (isNewChart) {
            seriesTDash2.showOnInit = false;
            seriesTDash2.dataFields.dateX = useData.fieldX;
            seriesTDash2.dataFields.valueY = 'actualTrainIntDash2';
            seriesTDash2.fillOpacity = 0;

            let c1 = am4core.color(greenColor);
            seriesTDash2.stroke = c1;
            seriesTDash2.fill = c1;
            seriesTDash2.strokeWidth = 3;
            seriesTDash2.strokeDasharray = '3,3';

            seriesTDash2.hiddenInLegend = true;

            // let bullet = seriesTDash2.bullets.push(new am4charts.CircleBullet());
            // bullet.circle.opacity = 0;
            // bullet.circle.fill = colorTesting;// blueColor;
            // bullet.circle.propertyFields.opacity = useData.fieldX+"_bulletOpacity";
            // bullet.circle.radius = 5;
          }
        }

        let seriesTDash3 = null;
        if (useData.fieldX != null /* && actualTrainIntDashUsed && shouldShowDash*/) {
          seriesTDash3 = lastChartAxis.seriesTDash3 ?? chart.series.push(new am4charts.LineSeries());
          lastChartAxis.seriesTDash3 = seriesTDash3;

          if (isNewChart) {
            seriesTDash3.showOnInit = false;
            seriesTDash3.dataFields.dateX = useData.fieldX;
            seriesTDash3.dataFields.valueY = 'actualTrainIntDash3';
            seriesTDash3.fillOpacity = 0;

            let c1 = am4core.color(greenColor);
            seriesTDash3.stroke = c1;
            seriesTDash3.fill = c1;
            seriesTDash3.strokeWidth = 3;
            seriesTDash3.strokeDasharray = '3,3';

            seriesTDash3.hiddenInLegend = true;

            // let bullet = seriesTDash2.bullets.push(new am4charts.CircleBullet());
            // bullet.circle.opacity = 0;
            // bullet.circle.fill = colorTesting;// blueColor;
            // bullet.circle.propertyFields.opacity = useData.fieldX+"_bulletOpacity";
            // bullet.circle.radius = 5;
          }
        }

        let series2 = null;
        if (useData.field2 != null) {
          series2 = lastChartAxis.series2 ?? chart.series.push(new am4charts.LineSeries());
          lastChartAxis.series2 = series2;

          if (isNewChart) {
            series2.showOnInit = false;
            if (useLegend) {
              series2.name = useData.seriesName2;
            }
            series2.dataFields.dateX = useData.fieldX;
            series2.dataFields.valueY = useData.field2;
            if (useData.tooltipFormat2) {
              series2.tooltip.numberFormatter = new am4core.NumberFormatter();
              series2.tooltip.numberFormatter.numberFormat = '#.00';
              series2.tooltipText = useData.tooltipFormat2;
            }
            series2.fillOpacity = 0;

            series2.propertyFields.stroke = 'lineColor';
            series2.propertyFields.fill = 'lineColor';
          }
        }

        let series3 = null;
        if (useData.field3 != null) {
          series3 = lastChartAxis.series3 ?? chart.series.push(new am4charts.LineSeries());
          lastChartAxis.series3 = series3;

          if (isNewChart) {
            series3.showOnInit = false;
            series3.dataFields.dateX = useData.fieldX;
            series3.dataFields.valueY = useData.field3;

            series3.fillOpacity = 0;

            series3.strokeDasharray = '4';
            series3.strokeWidth = 2;
            series3.hiddenInLegend = true;
          }
        }

        let seriesNList = [],
          seriesAllInScroll = [],
          seriesPP = null;
        let seriesNListScroll = [];

        let fieldList1 = [...(fieldList0 ?? [])];
        const fieldList1LenInit = fieldList1.length;
        [...fieldList1].some((f1) => {
          fieldList1.push('__' + f1);
        });

        if (fieldList1 != null && _.isArray(fieldList1) && fieldList1.length > 0) {
          let min = null,
            minV = null,
            max = null,
            maxV = null;
          fieldList1.some((f1, f1ind) => {
            if (f1[0] === 'p' && fieldListEnabled[f1ind]) {
              let v1 = Utils.tryParseInt(f1.substring(1));
              if (v1 != null) {
                if (minV == null || v1 < minV) {
                  minV = v1;
                  min = f1;
                }
                if (maxV == null || v1 > maxV) {
                  maxV = v1;
                  max = f1;
                }
              }
            }
          });

          let min2 = null,
            minV2 = null,
            max2 = null,
            maxV2 = null;
          fieldList1.some((f1, f1ind) => {
            if (f1.substring(0, 3) === '__p' && fieldListEnabled[f1ind % fieldList1LenInit]) {
              let v1 = Utils.tryParseInt(f1.substring(1 + 2));
              if (v1 != null) {
                if (minV2 == null || v1 < minV2) {
                  minV2 = v1;
                  min2 = f1;
                }
                if (maxV2 == null || v1 > maxV2) {
                  maxV2 = v1;
                  max2 = f1;
                }
              }
            }
          });

          //
          let anySeriesNVisible = false;
          fieldList1.some((f1, f1ind) => {
            let isSeriesVisible = true;
            if (fieldListEnabled != null) {
              if (f1ind < fieldList1LenInit && !fieldListEnabled[f1ind]) {
                isSeriesVisible = false;
              }
            }
            if (isSeriesVisible) {
              anySeriesNVisible = true;
              return true;
            }
          });

          let anySeriesNVisible2 = anySeriesNVisible;

          if (max === min) {
            anySeriesNVisible = false;
          }
          if (max2 === min2) {
            anySeriesNVisible2 = false;
          }

          if (!this.isPredEndAtEnd(dataChart)) {
            anySeriesNVisible2 = false;
          }

          let seriesPP = lastChartAxis['seriesPP'] ?? chart.series.push(new am4charts.LineSeries());
          lastChartAxis['seriesPP'] = seriesPP;

          seriesPP.dataFields.valueY = max;
          seriesPP.dataFields.openValueY = min;

          if (anySeriesNVisible) {
            seriesPP?.show();
          } else {
            seriesPP?.hide();
          }

          if (isNewChart && seriesPP) {
            if (useLegend) {
              seriesPP.name = null;
            }
            seriesPP.hiddenInLegend = true;
            seriesPP.dataFields.dateX = useData.fieldX;

            seriesPP.fillOpacity = 0.2;

            seriesPP.strokeWidth = 0;
          }

          //
          let seriesPP2 = lastChartAxis['seriesPP2'] ?? chart.series.push(new am4charts.LineSeries());
          lastChartAxis['seriesPP2'] = seriesPP2;

          seriesPP2.dataFields.valueY = max2;
          seriesPP2.dataFields.openValueY = min2;

          if (anySeriesNVisible2) {
            seriesPP2?.show();
          } else {
            seriesPP2?.hide();
          }

          if (isNewChart && seriesPP2) {
            if (useLegend) {
              seriesPP2.name = null;
            }
            seriesPP2.hiddenInLegend = true;
            seriesPP2.dataFields.dateX = useData.fieldX;

            seriesPP2.fillOpacity = 0.2;

            seriesPP2.strokeWidth = 0;
          }

          //
          let colorSet = new am4core.ColorSet();

          fieldList1.some((f1, f1ind) => {
            let isSeriesVisible = true;
            if (fieldListEnabled != null) {
              if (f1ind < fieldList1LenInit * 2 && !fieldListEnabled[f1ind % fieldList1LenInit]) {
                isSeriesVisible = false;
              }
              if (!this.isPredEndAtEnd(dataChart)) {
                if (f1ind >= fieldList1LenInit && f1ind < fieldList1LenInit * 2) {
                  isSeriesVisible = false;
                }
              }
            }

            let seriesN = lastChartAxis['seriesN' + f1] ?? chart.series.push(new am4charts.LineSeries());
            lastChartAxis['seriesN' + f1] = seriesN;

            if (isSeriesVisible) {
              seriesN.show();
            } else {
              seriesN.hide();
            }

            if (isNewChart) {
              if (useLegend) {
                if (f1.substring(0, 3) === '__p') {
                  seriesN.hiddenInLegend = true;
                  seriesN.name = f1.substring(2);
                }
              }
              seriesN.dataFields.dateX = useData.fieldX;
              seriesN.dataFields.valueY = f1;

              seriesN.tooltip.numberFormatter = new am4core.NumberFormatter();
              seriesN.tooltip.numberFormatter.numberFormat = '#.00';
              seriesN.tooltipText = '{name}: {valueY}';

              seriesN.fillOpacity = null;

              let c1: any = null;
              if (['p50', '__p50'].includes(f1?.toLowerCase())) {
                c1 = am4core.color(greenColor);
                seriesN.strokeWidth = 3;
              } else {
                c1 = am4core.color(blue2Color);
              }

              if (lenPredShowCircle) {
                let bullet = seriesN.bullets.push(new am4charts.CircleBullet());
                bullet.fill = c1;
                bullet.radius = 4;
              }

              seriesN.stroke = c1;
              seriesN.fill = c1;
            }

            seriesNList.push(seriesN);
          });
        }

        if (isNewChart) {
          chart.cursor = new am4charts.XYCursor();
          chart.cursor.lineY.opacity = 0;

          chart.scrollbarX = new am4charts.XYChartScrollbar();

          chart.scrollbarX.events.on('rangechanged', () => {
            doSetMaxValueMax();
          });

          // @ts-ignore
          chart.scrollbarX.series.push(series);
          chart.scrollbarX.series.push(seriesB);
          seriesAllInScroll.push(series);
          if (seriesT != null) {
            // @ts-ignore
            chart.scrollbarX.series.push(seriesT);
            seriesAllInScroll.push(seriesT);
          }
          if (seriesTDash != null) {
            // @ts-ignore
            chart.scrollbarX.series.push(seriesTDash);
            seriesAllInScroll.push(seriesTDash);
          }
          if (seriesTDash2 != null) {
            // @ts-ignore
            chart.scrollbarX.series.push(seriesTDash2);
            seriesAllInScroll.push(seriesTDash2);
          }

          if (series2 != null) {
            // @ts-ignore
            chart.scrollbarX.series.push(series2);
            seriesAllInScroll.push(series2);
          }
          if (series3 != null) {
            // @ts-ignore
            chart.scrollbarX.series.push(series3);
            seriesAllInScroll.push(series3);
          }
          if (seriesNList != null) {
            seriesNList.some((s1) => {
              if (s1.dataFields.valueY?.substring(0, 3) === '__p') {
                return;
              }
              // @ts-ignore
              chart.scrollbarX.series.push(s1);
              seriesAllInScroll.push(s1);
            });
          }
        }

        if (isNewChart && useLegend) {
          chart.legend = new am4charts.Legend();
        }

        if (isNewChart && !Utils.isNullOrEmpty(useData.titleTop)) {
          let title = chart.titles.create();
          title.text = useData.titleTop;
          title.fontSize = 23;
          title.marginBottom = 20;
        }

        if (useData.isDateType) {
          if (isNewChart) {
            // const doWork1 = () => {
            //   $this.isChartReady = false;
            //
            //   let minZoomedT = dateAxis.minZoomed;
            //   let maxZoomedT = dateAxis.maxZoomed;
            //
            //   if($this.lastZoomStart<minZoomedT || $this.lastZoomStart<minZoomedT) {
            //     //outside window min max
            //     if(useData?.defaultWindowStartTs1!=null && useData?.defaultWindowEndTs!=null) {
            //       $this.lastZoomStart = useData?.defaultWindowStartTs;
            //       $this.lastZoomEnd = useData?.defaultWindowEndTs;
            //     }
            //   }
            //
            //   if (usedNewData) {
            //     $this.needRefreshEndChangesScroll = true;
            //   }
            //
            //   dateAxis.zoomToDates($this.lastZoomStart, $this.lastZoomEnd, false, true);
            //   doSetMaxValueMax($this.lastZoomStart, $this.lastZoomEnd);
            // };

            chart.events.on('ready' /*"datavalidated"*/, function () {
              $this.setState({
                lastChartDataPointDate: dateAxis.max,
              });

              $this.maxZoomedAllChart = valueAxis.maxZoomed;

              //
              chart.scrollbarX.scrollbarChart.plotContainer.filters.clear();
              chart.scrollbarX.unselectedOverlay.fillOpacity = 0.7;

              let colorSet = new am4core.ColorSet();

              fieldList1.some((f1, f1ind) => {
                let isSeriesVisible = true;
                if (fieldListEnabled != null) {
                  if (f1ind < fieldList1LenInit * 2 && !fieldListEnabled[f1ind % fieldList1LenInit]) {
                    isSeriesVisible = false;
                  }
                }

                let seriesN = lastChartAxis['seriesN_' + f1] ?? chart.scrollbarX.scrollbarChart.series.push(new am4charts.LineSeries());
                lastChartAxis['seriesN_' + f1] = seriesN;

                if (isSeriesVisible) {
                  seriesN.show();
                } else {
                  seriesN.hide();
                }

                if (isNewChart) {
                  seriesN.hiddenInLegend = true;

                  if (useLegend) {
                    seriesN.name = f1; //useData.seriesName2;
                  }
                  seriesN.dataFields.dateX = useData.fieldX;
                  seriesN.dataFields.valueY = '_' + f1;

                  seriesN.tooltip.numberFormatter = new am4core.NumberFormatter();
                  seriesN.tooltip.numberFormatter.numberFormat = '#.00';
                  seriesN.tooltipText = '{name}: {valueY}';

                  // if (f1 === max) {
                  //   seriesN.fillOpacity = 0.2;
                  //   seriesN.dataFields.openValueY = min;
                  // } else {
                  seriesN.fillOpacity = null;
                  // }

                  let c1: any = null;
                  if (f1?.toLowerCase() === 'p50') {
                    c1 = am4core.color(greenColor);
                    seriesN.strokeWidth = 3;
                  } else {
                    c1 = am4core.color(blue2Color);
                  }
                  seriesN.stroke = c1;
                  seriesN.fill = c1;
                }

                seriesNListScroll.push(seriesN);
              });

              let axisX1 = chart.scrollbarX.scrollbarChart.xAxes.getIndex(0);
              axisX1.renderer.labels.template.disabled = true;
              let axisX2 = lastChartAxis.scrollAxis2 ?? chart.scrollbarX.scrollbarChart.xAxes.push(new am4charts.DateAxis());
              lastChartAxis.scrollAxis2 = axisX2;

              axisX2.renderer.labels.template.adapter.add('text', (label, target, key) => {
                if (label != null && label.length > 0 && label[0] === '_') {
                  return label.substring(1);
                }
                return '';
              });

              axisX2.renderer.inside = true;
              axisX2.renderer.ticks.template.disabled = true;
              axisX2.renderer.opposite = true;
              axisX2.min = axisX1.min;
              axisX2.max = axisX1.max;

              const colorToFill = $this.calcColorToFill();
              colorToFill.some((c1) => {
                let rangeLabel = axisX2.axisRanges.create();
                rangeLabel.value = ((c1.to ?? 0) * 1000 - (c1.from ?? 0) * 1000) / 2 + (c1.from ?? 0) * 1000;
                rangeLabel.label.inside = true;
                rangeLabel.label.text = c1.name;
                rangeLabel.label.fill = am4core.color(c1.color);
                rangeLabel.label.align = 'center';
                rangeLabel.label.verticalCenter = 'top';
                rangeLabel.label.dy = -27;

                let range = axisX1.axisRanges.create();
                range.date = new Date((c1.from ?? 0) * 1000);
                range.endDate = new Date((c1.to ?? 0) * 1000);
                range.axisFill.fill = am4core.color(c1.color);
                range.axisFill.fillOpacity = 0.4;

                if (c1.bullet) {
                  let rangeLabel = axisX2.axisRanges.create();
                  rangeLabel.value = (c1.from ?? 0) * 1000;
                  rangeLabel.label.inside = true;
                  rangeLabel.label.text = '_•';
                  rangeLabel.label.fill = am4core.color(c1.color);
                  rangeLabel.label.fontSize = 19;
                  rangeLabel.label.align = 'center';
                  rangeLabel.label.verticalCenter = 'top';
                  rangeLabel.label.dy = -27 - 4;
                }
              });
              //

              // if ($this.lastZoomStart != null && $this.lastZoomEnd != null) {
              //   doWork1();
              //   return;
              // }
            });
            chart.events.on('datavalidated', function () {
              if ($this.isChartReady === true) {
                return;
              }

              if (useData.defaultWindowStartTs != null && useData.defaultWindowEndTs != null) {
                // $this.isChartReady = false;

                let zoomStart = new Date(useData.defaultWindowStartTs);
                let zoomEnd = new Date(useData.defaultWindowEndTs);

                $this.lastZoomStart = useData.defaultWindowStartTs;
                $this.lastZoomEnd = useData.defaultWindowEndTs;

                dateAxis.zoomToDates(zoomStart, zoomEnd, false, true);
                // dateAxis.zoomToDates(zoomStart, zoomEnd);
                doSetMaxValueMax(zoomStart, zoomEnd);
              }
            });
          }
        }

        //
        this.lastDataChart = dataChart;
        chart.data = dataChart;
      })
      .catch((e) => {
        Utils.error('Error when creating chart', e);
      });
  };

  isPredEndAtEnd = (dataChart?, predictionEndParam = undefined) => {
    let predictionEnd = predictionEndParam === undefined ? this.state.predictionEnd : predictionEndParam;
    if (predictionEnd != null && dataChart != null) {
      let t1 = predictionEnd?.unix() * 1000;
      let t2 = dataChart[dataChart.length - 1]?.date_lastInt;
      return t1 >= t2;
    }
    return true;
  };

  componentWillUnmount() {
    this.isM = false;

    this.unDark();

    if (this.timeoutRetryRunModel) {
      clearTimeout(this.timeoutRetryRunModel);
      this.timeoutRetryRunModel = null;
    }

    if (this.prepareChartTimer) {
      clearTimeout(this.prepareChartTimer);
      this.prepareChartTimer = null;
    }
  }

  memProjectIdDiff = memoizeOne((projectId) => {
    if (!Utils.isNullOrEmpty(projectId)) {
      this.doResetDatesIfNeeded().then(() => {});
    }
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  doResetDatesIfNeeded = (keepTestData = false, keepDates = false) => {
    return new Promise((resolve, reject) => {
      if (this.state.firstTime) {
        resolve(null);
        return;
      }
      let obj1: any = {};

      if (this.state.selectedRangeDatesId != null) {
        obj1.selectedRangeDatesId = null;
      }
      if (!keepTestData && this.state.selectedFieldValueId != null) {
        obj1.selectedFieldValueId = null;
      }
      if (this.state.selectedFieldId != null) {
        obj1.selectedFieldId = null;
      }
      if (this.state.accuracyInTestPeriod != null) {
        obj1.accuracyInTestPeriod = null;
      }
      // if(this.props.selectedAlgoId!=null) {
      //   obj1.selectedAlgoId = null;
      // }
      if (!keepDates && this.state.dateStart != null) {
        obj1.dateStart = null;
      }
      if (!keepDates && this.state.predictionStart != null) {
        obj1.predictionStart = null;
      }
      if (!keepDates && this.state.predictionEnd != null) {
        obj1.predictionEnd = null;
      }
      if (!keepDates && this.state.dateEnd != null) {
        obj1.dateEnd = null;
      }

      if (!_.isEmpty(obj1)) {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }
          this.setState(obj1, () => {
            this.refreshUrlWithParams();
            resolve(null);
          });
        }, 0);
      } else {
        resolve(null);
      }
    });
  };

  onChangeSelectRangeDates = (optionSel) => {
    this.setState(
      {
        selectedRangeDatesId: optionSel ? optionSel.value : null,
      },
      () => {
        this.refreshUrlWithParams();
      },
    );
  };

  onChangeSelectAlgo = (optionSel) => {
    this.doResetDatesIfNeeded(true).then(() => {
      this.props.onChangeAlgoId(optionSel ? optionSel.value : null, () => {
        this.refreshUrlWithParams();
      });
    });
  };

  onChangeSelectField = (optionSel) => {
    this.setState(
      {
        selectedFieldId: optionSel ? optionSel.value : null,
      },
      () => {
        this.refreshUrlWithParams();
      },
    );
  };

  resetLastChartData = (clearWindowZoom = true) => {
    this.lastChartData = null;

    if (clearWindowZoom) {
      this.lastZoomStart = null;
      this.lastZoomEnd = null;
    }
  };

  onChangeSelectFieldValue = (optionSel) => {
    let isCreated = optionSel?.__isNew__ === true;

    this.resetLastChartData(false);

    const doWork = () => {
      this.setState(
        {
          selectedFieldValueId: optionSel ? optionSel.value : null,
          accuracyInTestPeriod: optionSel?.error,
          dateStart: null,
          predictionStart: null,
          predictionEnd: null,
          dateEnd: null,
          testWindowCall: null,
          testWindowCallResult: null,
        },
        () => {
          this.refreshUrlWithParams();
        },
      );
    };

    if (isCreated) {
      this.setState(
        {
          breakdownLabelsValue: null,
        },
        () => {
          doWork();
        },
      );
    } else {
      doWork();
    }
  };

  memGetChartData = memoizeOne((projectId, algoSelectValue, fieldValueSelectValue, rangeDatesSelectValue, sessionId, fieldListEnabled, testFoldStartTs, selectedFieldValueId, testWindowCall = false) => {
    if (Utils.isNullOrEmpty(algoSelectValue) || Utils.isNullOrEmpty(fieldValueSelectValue) || Utils.isNullOrEmpty(projectId)) {
      return;
    }

    if (!this.cacheChartData) {
      this.cacheChartData = {};
    }

    setTimeout(() => {
      if (!this.isM) {
        return;
      }
      this.setState({
        errorMsgPrediction: null,
      });
    }, 0);

    lastUseData = null;

    const keyCache = algoSelectValue + ' ' + fieldValueSelectValue + ' ' + rangeDatesSelectValue;
    const inCache = testWindowCall && this.cacheChartData[keyCache];
    if (inCache && inCache.data != null) {
      if (!inCache.isRefreshing) {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }
          this.setState({
            firstTime: false,
            isRefreshingChart: false,
          });
          this.recreateChart(inCache.data, true, fieldListEnabled, testFoldStartTs, selectedFieldValueId);
        }, 0);
      }
      return inCache;
    } else {
      let obj1: any = {
        isRefreshing: true,
        data: null,
      };
      if (testWindowCall) {
        this.cacheChartData[keyCache] = obj1;
      }

      setTimeout(() => {
        if (!this.isM) {
          return;
        }
        this.setState({
          firstTime: false,
          isRefreshingChart: true,
        });
      }, 0);

      let uuid1 = uuid.v1();
      this.lastCallChartData = uuid1;

      //dates
      let datesList = rangeDatesSelectValue ? rangeDatesSelectValue.split('#') : null;
      let dateStart = datesList && !Utils.isNullOrEmpty(datesList[0]) ? Utils.tryParseInt(datesList[0]) : null;
      let predictionStart = datesList && !Utils.isNullOrEmpty(datesList[1]) ? Utils.tryParseInt(datesList[1]) : null;
      let predictionEnd = datesList && !Utils.isNullOrEmpty(datesList[2]) ? Utils.tryParseInt(datesList[2]) : null;
      // let dateEnd = (datesList && !Utils.isNullOrEmpty(datesList[3])) ? Utils.tryParseInt(datesList[3]) : null;
      // let maxTs = (datesList && !Utils.isNullOrEmpty(datesList[4])) ? Utils.tryParseInt(datesList[4]) : null;

      if (this.timeoutRetryRunModel) {
        clearTimeout(this.timeoutRetryRunModel);
        this.timeoutRetryRunModel = null;
      }

      //
      let dataParams: any = {
        predictionStart: predictionStart * 1000,
      };
      if (predictionEnd != null /* && this.lastChartData!=null*/) {
        dataParams.predictionStart = null;
        delete dataParams.predictionStart;
        dataParams.predictionEnd = predictionEnd * 1000;

        // } else if(maxTs!=null && !testWindowCall) {
        //   dataParams.predictionStart = null;
        //   delete dataParams.predictionStart;
        //   dataParams.predictionEnd = maxTs * 1000;
      }

      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
      let itemIdUsed = fieldValueSelectValue;
      let dataFromItemId = null;
      if (!Utils.isNullOrEmpty(itemIdUsed) && rangeDateByTestDataId) {
        const ch = (v1) => {
          if (v1 == null) {
            return v1;
          }
          if (_.isNumber(v1)) {
            return '' + v1;
          }
          return v1;
        };

        itemIdUsed = ch(itemIdUsed);

        let kk = Object.keys(rangeDateByTestDataId);
        kk.some((k1) => {
          let all1 = rangeDateByTestDataId[k1];
          if (all1) {
            if (all1 && ch(all1.id) == itemIdUsed) {
              dataFromItemId = all1;
              return true;
            }
          }
        });
      }

      if (dataFromItemId == null) {
        dataParams.data = fieldValueSelectValue;
      } else {
        const kk = Object.keys(dataFromItemId);
        kk.some((k1) => {
          if (!['data'].includes(k1)) {
            //k1==='dataInternal' || k1.toLowerCase()==='id'
            return false;
          }

          let v1 = dataFromItemId[k1];
          if (_.isObject(v1)) {
            v1 = JSON.stringify(v1);
          }
          if (k1 === 'extra' && Utils.isNullOrEmpty(dataFromItemId.data)) {
            //TODO //** temp fix
            k1 = 'data';
          }
          dataParams[k1] = v1;
        });
      }

      let testIdName = optionsTestDatasRes?.testIdName;
      if (dataParams?.data != null && _.isString(dataParams?.data) && testIdName != null) {
        dataParams.data = JSON.stringify({ [testIdName]: dataParams?.data });
      }

      REClient_.client_()._predictForUI(algoSelectValue, dataParams, null, null, (err, res) => {
        if (this.lastCallChartData !== uuid1) {
          return;
        }

        if (err === 'Requested deployment is not active') {
          StoreActions.deployList_(this.props.paramsProp?.get('projectId'));
        }

        if (!err && res && res.result && res.result.needTime) {
          let resT = res.result;
          if (this.lastCallChartData === uuid1) {
            let msg1 = resT.msg;
            if (!Utils.isNullOrEmpty(msg1)) {
              REActions.clearNotifications();
              REActions.addNotification(msg1);
            }

            let time1 = Math.max(500, Math.min(5000, resT.delay || 0));
            if (this.timeoutRetryRunModel) {
              clearTimeout(this.timeoutRetryRunModel);
              this.timeoutRetryRunModel = null;
            }

            this.timeoutRetryRunModel = setTimeout(() => {
              if (!this.isM) {
                return;
              }
              this.setState({
                sessionId: uuid.v1(),
              });
            }, time1);
          }
          return;
        }

        if (this.lastCallChartData === uuid1) {
          setTimeout(() => {
            if (!this.isM) {
              return;
            }
            this.setState({
              isRefreshingChart: false,
            });
          }, 0);
        }

        obj1.isRefreshing = false;

        if (err) {
          Utils.error('Error ' + err);
          this.setState({
            errorMsgPrediction: err || Constants.errorDefault,
          });
        }

        if (this.lastCallChartData === uuid1) {
          if (!err && res.result) {
            obj1.data = res.result;

            this.recreateChart(obj1.data, undefined, fieldListEnabled, testFoldStartTs, selectedFieldValueId);
          } else {
            this.recreateChart(null, true, undefined, testFoldStartTs, selectedFieldValueId);
          }
        }
      }); //end run_mdoel

      return obj1;
    }
  });

  calcDate = (dt2, isEnd, changeTZ = true) => {
    let dt1 = moment(dt2);
    if (dt1) {
      if (this.useCustomDates != null) {
        if (this.useCustomDates.minTs != null) {
          if (dt1.isBefore(this.useCustomDates.minTs)) {
            dt1 = moment(this.useCustomDates.minTs);
          }
          if (isEnd && dt1.isAfter(this.useCustomDates.maxTs)) {
            dt1 = moment(this.useCustomDates.maxTs);
          }
          if (!isEnd && dt1.isAfter(this.useCustomDates.maxPredictionTs)) {
            dt1 = moment(this.useCustomDates.maxPredictionTs);
          }
        }
      }
    }
    if (changeTZ) {
      return dt1.tz(this.state.useTimezoneForAPI || 'UTC', false);
    } else {
      return dt1;
    }
  };

  onChangeDatesStart = (date: any, dateString: string) => {
    if (date) {
      date = date.tz(this.state.useTimezoneForAPI || 'UTC', false);
    }

    this.resetLastChartData();
    this.setState(
      {
        dateOpenPopup: false,
        predictionStart: this.calcDate(date, false),
        predictionEnd: null,
        dateStart: this.calcDate(date, false),
        testWindowCall: null,
        testWindowCallResult: null,
      },
      () => {
        this.refreshUrlWithParams();
      },
    );
  };

  onChangeDatesEnd = (date: any, dateString: string) => {
    this.setState(
      {
        dateEnd: this.calcDate(date, true),
      },
      () => {
        this.refreshUrlWithParams();
      },
    );
  };

  memOptionsField = memoizeOneCurry((doCall, foundProject1, defDatasets) => {
    if (foundProject1 && defDatasets) {
      let datasetThis = null;
      if (foundProject1) {
        if (foundProject1.allProjectDatasets) {
          datasetThis = foundProject1.allProjectDatasets[0];
        }
      }

      if (defDatasets) {
        let datasetThisId = datasetThis && datasetThis.dataset && datasetThis.dataset.datasetId;

        const fileSchema_byDatasetId = defDatasets.get('fileDataUse_byDatasetIdProjectId');
        if (fileSchema_byDatasetId && datasetThisId) {
          let optionsField = [];
          const fileSchema = fileSchema_byDatasetId.get(datasetThisId + foundProject1.projectId);
          if (fileSchema && fileSchema.get('schema')) {
            fileSchema.get('schema').some((f1) => {
              let obj1: any = {
                value: f1.get('name'),
                label: f1.get('name'),
              };
              optionsField.push(obj1);
            });

            if (this.state.selectedFieldId == null && optionsField && optionsField.length > 0) {
              if (!doCall) {
                setTimeout(() => {
                  if (!this.isM) {
                    return;
                  }
                  this.setState(
                    {
                      selectedFieldId: optionsField[0].value,
                    },
                    () => {
                      this.refreshUrlWithParams();
                    },
                  );
                }, 0);
              }
            }

            return optionsField;
          } else {
            if (fileSchema == null && datasetThisId) {
              //never retrieved
              if (defDatasets && !defDatasets.get('isRefreshing')) {
                if (doCall) {
                  StoreActions.schemaGetFileDataUse_(foundProject1.projectId, datasetThisId);
                }
                return null;
              }
            }
          }
        }
      }
    }
  });

  memCustomDates = memoizeOne((useCustomDates, algoSelectValue, testDatasSelectValue) => {
    if (useCustomDates) {
      this.useCustomDates = useCustomDates;

      if (this.state.firstTime && (this.state.dateStart != null || this.state.dateEnd != null || this.state.predictionStart != null || this.state.predictionEnd != null)) {
        //
      } else {
        let dateStartT = useCustomDates.minTs == null ? null : moment(useCustomDates.minTs).tz(this.state.useTimezoneForAPI || 'UTC', false);
        let dateEndT = useCustomDates.maxTs == null ? null : moment(useCustomDates.maxTs).tz(this.state.useTimezoneForAPI || 'UTC', false);
        let predictionStartT =
          useCustomDates.maxPredictionTs == null && useCustomDates.testFoldStartTs == null ? null : moment(useCustomDates.testFoldStartTs ?? useCustomDates.maxPredictionTs).tz(this.state.useTimezoneForAPI || 'UTC', false);
        let predictionEndT = this.state.predictionEnd == null ? null : moment(this.state.predictionEnd).tz(this.state.useTimezoneForAPI || 'UTC', false);
        let testFoldStartTs = useCustomDates.testFoldStartTs == null ? null : moment(useCustomDates.testFoldStartTs).tz(this.state.useTimezoneForAPI || 'UTC', false);

        if (dateStartT != null && dateEndT != null && predictionStartT != null) {
          if (this.state.dateStart != null && dateStartT != null && this.state.dateStart.isSame(dateStartT)) {
            dateStartT = this.state.dateStart;
          }
          if (this.state.dateEnd != null && dateEndT != null && this.state.dateEnd.isSame(dateEndT)) {
            dateEndT = this.state.dateEnd;
          }
          if (this.state.predictionStart != null && predictionStartT != null && this.state.predictionStart.isSame(predictionStartT)) {
            predictionStartT = this.state.predictionStart;
          }
          if (this.state.predictionEnd != null && predictionEndT != null && this.state.predictionEnd.isSame(predictionEndT)) {
            predictionEndT = this.state.predictionEnd;
          }

          //
          setTimeout(() => {
            if (!this.isM) {
              return;
            }
            this.resetLastChartData(false);
            this.setState(
              {
                dateStart: dateStartT,
                predictionStart: predictionStartT,
                predictionEnd: predictionEndT,
                dateEnd: dateEndT,
              },
              () => {
                this.refreshUrlWithParams();
              },
            );
          }, 0);
        }
      }

      return true;
    }
    return false;
  });

  memDatasInfoProcessAndOptionsRanges: (testDatasSelectValue: any, rangeDateByTestDataId: any) => { optionsRangesDates: any; useCustomDates: any } = memoizeOne((testDatasSelectValue, rangeDateByTestDataId) => {
    if (!testDatasSelectValue || !rangeDateByTestDataId) {
      return;
    }

    let testDatasThis = testDatasSelectValue && rangeDateByTestDataId[testDatasSelectValue];
    let optionsRangesDates: any = null;
    let useCustomDates = null;
    if (testDatasThis && testDatasThis.minTs != null && testDatasThis.minTs !== 0 && testDatasThis.maxTs != null && testDatasThis.maxTs !== 0 && testDatasThis.maxPredictionTs != null && testDatasThis.maxPredictionTs !== 0) {
      let useCustomDates2 = {
        minTs: moment(testDatasThis.minTs).tz(this.state.useTimezoneForAPI || 'UTC', false),
        maxTs: moment(testDatasThis.maxTs).tz(this.state.useTimezoneForAPI || 'UTC', false),
        maxPredictionTs: moment(testDatasThis.maxPredictionTs).tz(this.state.useTimezoneForAPI || 'UTC', false),
        testFoldStartTs: testDatasThis.testFoldStartTs == null ? null : moment(testDatasThis.testFoldStartTs).tz(this.state.useTimezoneForAPI || 'UTC', false),
      };

      if (useCustomDates == null) {
        useCustomDates = {};
      }

      if (useCustomDates?.minTs != null && useCustomDates2.minTs != null && useCustomDates?.minTs?.isSame(useCustomDates2?.minTs)) {
        //
      } else {
        useCustomDates.minTs = useCustomDates2.minTs;
      }
      if (useCustomDates?.maxTs != null && useCustomDates2.maxTs != null && useCustomDates?.maxTs?.isSame(useCustomDates2?.maxTs)) {
        //
      } else {
        useCustomDates.maxTs = useCustomDates2.maxTs;
      }
      if (useCustomDates?.maxPredictionTs != null && useCustomDates2.maxPredictionTs != null && useCustomDates?.maxPredictionTs?.isSame(useCustomDates2?.maxPredictionTs)) {
        //
      } else {
        useCustomDates.maxPredictionTs = useCustomDates2.maxPredictionTs;
      }
      if (useCustomDates?.testFoldStartTs != null && useCustomDates2.testFoldStartTs != null && useCustomDates?.testFoldStartTs?.isSame(useCustomDates2?.testFoldStartTs)) {
        //
      } else {
        useCustomDates.testFoldStartTs = useCustomDates2.testFoldStartTs;
      }
    } else if (testDatasThis && (testDatasThis.date_ranges || testDatasThis.dateRanges)) {
      optionsRangesDates = [];

      let date_ranges = testDatasThis.date_ranges || testDatasThis.dateRanges;
      if (date_ranges) {
        date_ranges.some((r1) => {
          let label1 = r1.label;
          if (label1.indexOf(' to ') > -1) {
            let ll = label1.split(' to ');
            if (ll && ll.length === 2) {
              label1 = (
                <span>
                  <b>{ll[0]}</b> to <b>{ll[1]}</b>
                </span>
              );
            }
          }

          let obj1: any = {
            value: '' + (r1.start_time || r1.startTime) + '#' + (r1.end_time || r1.endTime),
            label: label1,
          };
          optionsRangesDates.push(obj1);
        });

        if (this.state.selectedRangeDatesId == null && optionsRangesDates && optionsRangesDates.length > 0) {
          setTimeout(() => {
            if (!this.isM) {
              return;
            }
            this.setState(
              {
                selectedRangeDatesId: optionsRangesDates[0],
              },
              () => {
                this.refreshUrlWithParams();
              },
            );
          }, 0);
        }
      }
    }

    return { optionsRangesDates: optionsRangesDates, useCustomDates };
  });

  disabledTime = memoizeOne((hour) => {
    let res = [];
    for (let i = 0; i < 60; i++) {
      res.push(i);
    }
    return res;
  });

  onOpenChangeDatePrediction = (isOpen) => {
    this.setState({
      dateOpenPopup: isOpen,
    });
  };

  memBreakdownOptions = memoizeOne((ids, accuracys) => {
    if (!ids) {
      return [];
    }

    return ids?.map((id1, ind) => {
      let acc1 = accuracys == null ? null : accuracys[ind];
      let label = id1;
      if (acc1 != null) {
        label = (
          <span>
            {id1}: <span style={{ opacity: 0.8 }}>{acc1}</span>
          </span>
        );
      }

      return {
        label,
        value: id1,
      };
    });
  });

  memTestDatas = memoizeOne((optionsTestDatas) => {
    if (this.state.selectedFieldValueId == null || (optionsTestDatas && optionsTestDatas.length > 0 && optionsTestDatas.find((o1) => o1.value === this.state.selectedFieldValueId) == null)) {
      if (optionsTestDatas && optionsTestDatas.length > 0) {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }
          this.setState(
            {
              selectedFieldValueId: optionsTestDatas[0].value,
              accuracyInTestPeriod: optionsTestDatas[0].error,
            },
            () => {
              this.refreshUrlWithParams();
            },
          );
        }, 0);
      }
    }
  });

  onChangeCheck = (f1, f1ind, e) => {
    let fieldListEnabled = this.state.fieldListEnabled;
    fieldListEnabled = fieldListEnabled ? [...fieldListEnabled] : [];
    let b1 = !!fieldListEnabled[f1ind];
    fieldListEnabled[f1ind] = !b1;
    this.setState({
      fieldListEnabled,
    });
  };

  calcColorToFill = (predAlways = false) => {
    let colorToFill = [
      { name: '_Train', color: colorTesting, from: this.useCustomDates?.minTs?.unix(), to: this.useCustomDates?.testFoldStartTs?.unix() },
      { name: '_Test', color: blueColor, bullet: true, from: this.useCustomDates?.testFoldStartTs?.unix(), to: this.useCustomDates?.maxPredictionTs?.unix() },
    ];
    if (predAlways || (this.state.lastChartDataPointDate != null && this.useCustomDates?.maxPredictionTs != null)) {
      colorToFill.push({
        name: '_Pred',
        color: greenColor,
        from: this.useCustomDates?.maxPredictionTs?.unix(),
        to: this.state.lastChartDataPointDate == null ? null : (this.state.lastChartDataPointDate ?? 0) / 1000,
      });
    }
    return colorToFill;
  };

  onDatePickerDateRender = (dtMoment) => {
    const style: CSSProperties = {};
    const colorToFill = this.calcColorToFill();

    let dotColor = null;
    colorToFill.some((c1, c1ind) => {
      if (dtMoment != null && c1.from != null && c1.to != null) {
        let isSameAsNext = c1ind < colorToFill.length - 1 ? moment.unix(c1.to).isSame(moment.unix(colorToFill[c1ind + 1].from)) : false;
        if (dtMoment.isSameOrAfter(moment.unix(c1.from))) {
          let isInside = false;
          if (isSameAsNext) {
            if (dtMoment.isBefore(moment.unix(c1.to))) {
              isInside = true;
            }
          } else {
            if (dtMoment.isSameOrBefore(moment.unix(c1.to))) {
              isInside = true;
            }
          }
          if (isInside) {
            dotColor = c1.color;
            return true;
          }
        }
      }
    });

    const esp = 4;
    return (
      <div className="ant-picker-cell-inner" style={style}>
        {dtMoment.date()}
        {dotColor != null && (
          <div style={{ marginTop: '-5px' }}>
            <div style={{ opacity: 0.7, margin: '0 auto', borderRadius: '50%', width: esp + 'px', height: esp + 'px', backgroundColor: dotColor }}></div>
          </div>
        )}
      </div>
    );
  };

  onDatePickerIsDisabledDate = (dtMoment) => {
    if (this.useCustomDates != null) {
      if (this.useCustomDates.minTs != null) {
        if (dtMoment.isBefore(this.useCustomDates.minTs)) {
          return true;
        }
      }
      // if(this.useCustomDates.maxTs!=null) {
      //   if(dtMoment.isAfter(this.useCustomDates.maxTs)) {
      //     return true;
      //   }
      // }
      if (this.useCustomDates.maxPredictionTs != null) {
        if (dtMoment.isAfter(this.useCustomDates.maxPredictionTs)) {
          return true;
        }
      }
      // if(this.state.lastChartDataPointDate!=null && this.state.lastChartDataPointDate!==0) {
      //   if(dtMoment.isAfter(moment.unix(this.state.lastChartDataPointDate/1000))) {
      //     return true;
      //   }
      // }
    }
    return false;
  };

  onChangeLabel = (option1, e) => {
    this.setState({
      breakdownLabelsValue: option1?.value,
    });
  };

  memCustomIDSRender = memoizeOne((breakdownLabels, breakdownLabelsValue, breakdownLabelsTitle) => {
    if (!breakdownLabels || breakdownLabels.length === 0) {
      return null;
    }

    let optionsLabels = breakdownLabels.map((s1, s1ind) => {
      return {
        label: s1,
        value: s1ind,
      };
    });
    optionsLabels.unshift({
      label: 'All',
      value: null,
    });

    let popupContainerForMenu = (node) => document.getElementById('body2');

    return (
      <span
        css={`
          margin-right: 20px;
          display: inline-flex;
          align-items: center;
        `}
      >
        <TooltipExt title={breakdownLabelsTitle ?? ''}>
          <span
            css={`
              font-family: Roboto;
              font-size: 12px;
              font-weight: bold;
              color: #d1e4f5;
              text-transform: uppercase;
            `}
            style={{ marginRight: '5px' }}
          >
            Items:
          </span>
        </TooltipExt>
        <SelectExt
          css={`
            width: 160px;
          `}
          value={optionsLabels?.find((v1) => v1.value === breakdownLabelsValue)}
          options={optionsLabels}
          onChange={this.onChangeLabel}
          menuPortalTarget={popupContainerForMenu(null)}
        />
      </span>
    );
  });

  memDataChartWindow = memoizeOne((dataChart, zoomWinMin, zoomWinMax) => {
    if (zoomWinMin != null && zoomWinMax != null && this.dataFieldX != null) {
      const dateF = this.dataFieldX + '_lastInt';
      dataChart = dataChart.filter((v1, v1ind) => {
        const m1 = v1[dateF];
        return m1 >= zoomWinMin && m1 <= zoomWinMax;
      });
    }
    return dataChart;
  });

  memColumnsTable = memoizeOne((useData, dataChart, accuracyInTestPeriod, useCustomDates) => {
    if (!useData) {
      return [];
    }

    let res = [
      // {
      //   title: 'Date',
      //   field: useData.fieldX+'_lastMoment',
      //   render: (text, row, index) => {
      //     return <span>{text?.utc()?.utcOffset(0, true)?.format('LLL')}</span>;
      //   },
      // },
      {
        title: 'Prediction Length',
        field: 'predLen',
        align: 'right',
        render: (text, row, index) => {
          return <span>{text}</span>;
        },
      },
      {
        title: 'Predicted',
        field: 'pred',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 3)}</span>;
        },
      },
      {
        title: 'Actual',
        field: 'actual',
        render: (text, row, index) => {
          return <span>{Utils.decimals(text, 3)}</span>;
        },
      },
    ] as ITableExtColumn[];

    useData.fieldList?.some((f1, f1ind) => {
      res.push({
        title: f1,
        field: '____' + f1,
        render: (text, row, index) => {
          if (row.date_bulletOpacity === 1) {
            let kk = Object.keys(row),
              countP = 0;
            kk.some((k1) => {
              if (_.startsWith(k1, '____p') && row[k1] != null) {
                countP++;
              }
            });
            if (countP === 1) {
              return;
            }
          }
          return <span>{Utils.decimals(text, 3)}</span>;
        },
      });
    });

    useData.extra_table_columns?.some((f1, f1ind) => {
      res.push({
        title: f1?.toLowerCase() === 'accuracy' ? 'point-wise accuracy' : f1,
        field: f1,
        render: (text, row, index) => {
          let r1 = text;
          if (_.isNumber(r1)) {
            r1 = Utils.decimals(r1, 3);
          }
          return <span>{r1}</span>;
        },
      } as ITableExtColumn);
    });

    if (accuracyInTestPeriod != null) {
      res.push({
        title: 'accuracy',
        field: '____acc',
        render: (text, row, index) => {
          let r1 = text;
          if (r1 != null) {
            r1 = Math.trunc(r1);
          }
          if (_.isNumber(r1)) {
            r1 = Utils.decimals(r1, 3);
          }
          return <span>{r1 ? '' + r1 + '%' : ''}</span>;
        },
      });
    }

    return res;
  });

  memWindowOverlayMetrics = memoizeOne((windowMetrics, windowMetricsList, lastChartDataPointDate) => {
    let canProcess = false;
    if (windowMetrics != null && !_.isEmpty(windowMetrics)) {
      canProcess = true;
    } else if (windowMetricsList != null && _.isArray(windowMetricsList) && windowMetricsList.length > 0) {
      canProcess = true;
    }
    if (canProcess && lastChartDataPointDate) {
      const calcValues = (showMetrics: { color?; value?; name?; visualName?; format?; decimals? }[]) => {
        return showMetrics
          ?.map((m1, ind) => {
            let name1 = m1.name;
            let v1 = m1.value ?? windowMetrics?.[name1];
            if (v1 == null) {
              return null;
            }

            if (_.isNumber(v1)) {
              let decimals1 = m1.decimals ?? 3;
              v1 = Utils.decimals(v1, decimals1);

              if (!Utils.isNullOrEmpty(m1.format)) {
                v1 += m1.format;
              }
            }

            return (
              <span key={'metr_' + (m1.visualName || m1.name)} style={{ marginLeft: '9px', color: '#55b33c' || Utils.colorA(1) }}>
                <span style={{ marginRight: '6px', color: '#438d2f' || Utils.colorA(0.8) }}>{m1.visualName ?? m1.name}:</span>
                {v1}
              </span>
            );
          })
          ?.filter((v1) => v1 != null);
      };

      let mm = null;
      if (windowMetricsList != null) {
        mm = calcValues(windowMetricsList);
      }

      if (mm == null) {
        let mmAccuracy = calcValues([{ name: 'accuracy', visualName: 'Accuracy', format: '%', decimals: 0 }]);

        mm = calcValues([
          { name: 'accuracy', visualName: 'Accuracy', format: '%', decimals: 0 },
          { name: 'c_nrsme', visualName: 'C-NRMSE' },
        ]);
        if (mmAccuracy == null || mmAccuracy.length === 0) {
          mm = calcValues([
            { name: 'nrmse', visualName: 'C-NRMSE' },
            { name: 'nrmse'.toUpperCase(), visualName: 'C-NRMSE' },
          ]);
        }
      }

      if (mm == null || mm.length === 0) {
        return null;
      }

      return <span style={{ paddingLeft: '20px' }}>{mm}</span>;
    }
  });

  memWindowOverlay = memoizeOne((useCustomDates, lastChartDataPointDate) => {
    if (useCustomDates?.minTs == null || useCustomDates?.testFoldStartTs == null || useCustomDates?.maxPredictionTs == null) {
      return null;
    }

    const blueColor = '#2b52bf';

    return (
      <div style={{ padding: '20px 10px 0 10px', width: '400px' }} className={s.timeline}>
        {/*// @ts-ignore*/}
        <Timeline mode={'left'} style={{ padding: 0, margin: 0 }}>
          {/*// @ts-ignore*/}
          <Timeline.Item
            style={{ backgroundColor: 'transparent' }}
            dot={<ClockCircleOutlined style={{ fontSize: '16px', color: colorTesting }} />}
            color={null}
            label={<span style={{ color: colorTesting }}>{useCustomDates?.minTs?.format('LL')}</span>}
          >
            Train Start
          </Timeline.Item>
          {/*// @ts-ignore*/}
          <Timeline.Item dot={<ClockCircleOutlined style={{ fontSize: '16px', color: blueColor }} />} color={null} label={<span style={{ color: blueColor }}>{useCustomDates?.testFoldStartTs?.format('LL')}</span>}>
            Test Start
          </Timeline.Item>
          {/*// @ts-ignore*/}
          <Timeline.Item dot={<ClockCircleOutlined style={{ fontSize: '16px', color: greenColor }} />} color={null} label={<span style={{ color: greenColor }}>{useCustomDates?.maxPredictionTs?.format('LL')}</span>}>
            Predictions Start
          </Timeline.Item>
          {/*// @ts-ignore*/}
          {lastChartDataPointDate != null && lastChartDataPointDate !== 0 && (
            <Timeline.Item dot={<ClockCircleOutlined style={{ fontSize: '16px', color: greenColor }} />} color={null} label={<span style={{ color: greenColor }}>{moment(lastChartDataPointDate).format('LL')}</span>}>
              Predictions End
            </Timeline.Item>
          )}
        </Timeline>
      </div>
    );
  });

  onGetChartTitle = (title) => {
    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      this.setState({
        breakdownLabelsTitle: title,
      });
    }, 0);
  };

  onGetListAccuracy = (values) => {
    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      this.setState({
        breakdownLabelsAccuracy: values,
      });
    }, 0);
  };

  onGetListIds = (ids) => {
    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      this.setState({
        breakdownLabelsIDs: ids,
      });
    }, 0);
  };

  onGetListIdsNames = (names) => {
    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      this.setState({
        breakdownLabels: names,
      });
    }, 0);
  };

  render() {
    let { projects, projectId } = this.props;
    this.memProjectIdDiff(projectId);

    let foundProject1 = this.memProjectId(false)(projectId, projects);

    //
    let isRefreshing = false;
    if (projects) {
      isRefreshing = projects.get('isRefreshing');
    }
    if (!foundProject1) {
      isRefreshing = true;
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    //
    let optionsAlgo = this.props.optionsAlgo;
    let algoSelectValue = null;
    if (this.props.selectedAlgoId) {
      algoSelectValue = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }

    //
    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
    let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
    let metricName = null; //optionsTestDatasRes?.metricName;

    if (this.state.breakdownLabelsValue != null) {
      optionsTestDatas = this.memBreakdownOptions(this.state.breakdownLabelsIDs, this.state.breakdownLabelsAccuracy);
    }

    this.memTestDatas(optionsTestDatas);

    let testDatasSelectValue = optionsTestDatas && optionsTestDatas.find((o1) => o1.value === this.state.selectedFieldValueId);

    //
    let { defDatasets } = this.props;
    let optionsField = this.memOptionsField(false)(foundProject1, defDatasets);
    let fieldSelectValue = optionsField && optionsField.find((o1) => o1.value === this.state.selectedFieldId);

    let optionsRangesDatesRes = this.memDatasInfoProcessAndOptionsRanges(testDatasSelectValue && testDatasSelectValue.value, rangeDateByTestDataId);
    let optionsRangesDates = optionsRangesDatesRes ? optionsRangesDatesRes.optionsRangesDates : null;
    let useCustomDates = optionsRangesDatesRes ? optionsRangesDatesRes.useCustomDates : null;
    let rangeDatesSelectValue = optionsRangesDates && optionsRangesDates.find((r1) => r1.value === this.state.selectedRangeDatesId);

    let didSetDates = this.memCustomDates(useCustomDates, algoSelectValue && algoSelectValue.value, testDatasSelectValue && testDatasSelectValue.value);

    //
    const topHH = 180;

    let rangeDates = rangeDatesSelectValue && rangeDatesSelectValue.value;
    if (useCustomDates != null) {
      if (this.state.dateStart && this.state.dateEnd && this.state.predictionStart) {
        let calcDateOnBackendTZ = (dt) => {
          if (dt == null) {
            return '';
          }
          return moment(dt)
            .tz(this.state.useTimezoneForAPI || 'UTC', false)
            .unix();
        };
        rangeDates = calcDateOnBackendTZ(this.state.dateStart) + '#' + calcDateOnBackendTZ(this.state.predictionStart) + '#' + calcDateOnBackendTZ(this.state.predictionEnd); // + '#' +
        // calcDateOnBackendTZ(this.state.dateEnd) + '#' +
        // calcDateOnBackendTZ(useCustomDates?.maxTs);
      } else {
        rangeDates = null;
      }
    }

    if (this.state.useTimezoneForAPI == null) {
      //skip
    } else if (didSetDates && rangeDates == null && useCustomDates) {
      //skip
    } else {
      let fieldListEnabled1 = this.state.fieldListEnabled;
      if (fieldListEnabled1 != null && _.isArray(fieldListEnabled1)) {
        if (!fieldListEnabled1.some((f1) => f1 !== 1)) {
          fieldListEnabled1 = undefined;
        }
      }
      this.memGetChartData(
        projectId,
        algoSelectValue && algoSelectValue.value,
        testDatasSelectValue && testDatasSelectValue.value,
        rangeDates,
        this.state.sessionId,
        fieldListEnabled1,
        useCustomDates?.testFoldStartTs,
        this.state.selectedFieldValueId,
        this.state.testWindowCall,
      );
    }

    let menuPortalTarget = popupContainerForMenu(null);

    let isRefreshingChart = this.state.isRefreshingChart;

    let fieldList = this.state.fieldList;
    let fieldListEnabled = this.state.fieldListEnabled;
    if (fieldList == null || fieldList.length === 0) {
      fieldListEnabled = null;
      fieldList = null;
    }

    const onChangeSelectDeployment = (optionSel) => {
      if (!optionSel) {
        return;
      }

      let projectId = this.props.paramsProp?.get('projectId');
      let deployId = optionSel?.value;
      if (projectId && deployId) {
        Location.push('/' + PartsLink.model_predictions + '/' + projectId + '/' + deployId);
      }
    };
    let optionsDeploys = this.props.optionsAlgo;
    let optionsDeploysSel = null;
    if (this.props.selectedAlgoId) {
      optionsDeploysSel = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }
    let deploymentSelect = (
      <span style={{ width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    const windowOverlay = this.memWindowOverlay(useCustomDates, this.state.lastChartDataPointDate);

    const windowOverlayMetrics = this.memWindowOverlayMetrics(this.state.windowMetrics, this.state.windowMetricsList, this.state.lastChartDataPointDate);

    const chartHH = 400;

    const customIDSRender = this.memCustomIDSRender(this.state.breakdownLabels, this.state.breakdownLabelsValue, this.state.breakdownLabelsTitle);
    const dataChartWindow = this.state.dataChartTable; //this.memDataChartWindow(this.state.dataChartTable, this.state.zoomWinMin, this.state.zoomWinMax);
    const columnsTable = this.memColumnsTable(this.state.dataChartUseData, dataChartWindow, this.state.accuracyInTestPeriod, useCustomDates);

    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {!Utils.isNullOrEmpty(this.props.paramsProp.get('idsList')) && (
          <SmartMetricsList
            onGetChartTitle={this.onGetChartTitle}
            onGetListAccuracy={this.onGetListAccuracy}
            onGetListIdsNames={this.onGetListIdsNames}
            dataIndex={this.state.breakdownLabelsValue}
            onGetListIds={this.onGetListIds}
            barChart={this.props.paramsProp?.get('idsBarChart')}
            detailModelVersion={this.props.paramsProp?.get('idsDetailModelVersion')}
            projectId={this.props.paramsProp?.get('projectId')}
          />
        )}
        {!Utils.isNullOrEmpty(this.props.paramsProp.get('filterList')) && (
          <SmartMetricsList
            onGetChartTitle={this.onGetChartTitle}
            onGetListIdsNames={this.onGetListIdsNames}
            onGetListIds={this.onGetListIds}
            filterLongName={this.props.paramsProp?.get('filterLongName')}
            filterNameSmall={this.props.paramsProp?.get('filterNameSmall')}
            filterIdsName={this.props.paramsProp?.get('filterIdsName')}
            filterModelVersion={this.props.paramsProp?.get('filterModelVersion')}
            projectId={this.props.paramsProp?.get('projectId')}
          />
        )}
        <RefreshAndProgress errorMsg={this.state.errorMsg}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <div style={{ height: height + 'px' }}>
                <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  <span style={{ whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
                    Predictions{' '}
                    <span
                      css={`
                        @media screen and (max-width: 1400px) {
                          display: none;
                        }
                      `}
                    >
                      Dashboard for Deployment
                    </span>
                    :
                  </span>
                  <div style={{ flex: 1 }}>{deploymentSelect}</div>

                  {foundProject1 != null && (
                    <div
                      style={{ marginLeft: '10px', verticalAlign: 'top', marginTop: '5px' }}
                      css={`
                        @media screen and (max-width: 1050px) {
                          display: none;
                        }
                      `}
                    >
                      <HelpBox beforeText={' analyzing predictions'} name={'model eval'} linkTo={'/help/useCases/' + foundProject1?.useCase + '/evaluating'} />
                    </div>
                  )}
                </div>

                {isRefreshing === true && (
                  <div style={{ textAlign: 'center', margin: '40px auto', fontSize: '12px', color: Utils.colorA(0.7) }}>
                    <FontAwesomeIcon icon={'sync'} transform={{ size: 15 }} spin style={{ marginRight: '8px', opacity: 0.8 }} />
                    Retrieving Project Details...
                  </div>
                )}

                {isRefreshing !== true && foundProject1 && (
                  <div style={{ minHeight: '600px', padding: '25px 30px', marginBottom: '20px' }} className={sd.grayPanel}>
                    <div style={{ position: 'relative', textAlign: 'center', paddingTop: '10px', marginBottom: '10px' }}>
                      <div>
                        {windowOverlay != null && (
                          <span style={{ flex: '0', whiteSpace: 'nowrap', marginRight: '50px' }}>
                            <Popover getPopupContainer={popupContainerForMenu} overlayClassName={sd.popback} content={windowOverlay} trigger={['click']} title="Date Ranges" placement={'bottom'}>
                              <span
                                css={`
                                  font-family: Roboto;
                                  font-size: 12px;
                                  font-weight: bold;
                                  color: #d1e4f5;
                                  text-transform: uppercase;
                                `}
                                style={{ marginRight: '5px', cursor: 'pointer' }}
                              >
                                Date Ranges
                                <FontAwesomeIcon icon={['far', 'angle-down']} transform={{ size: 15 }} style={{ marginLeft: '8px', opacity: 0.8 }} />
                              </span>
                            </Popover>
                          </span>
                        )}

                        {false && useCustomDates == null && (
                          <span style={{ marginRight: '50px' }}>
                            <span
                              css={`
                                font-family: Roboto;
                                font-size: 12px;
                                font-weight: bold;
                                color: #d1e4f5;
                                text-transform: uppercase;
                              `}
                              style={{ marginRight: '5px' }}
                            >
                              Predict From:
                            </span>
                            <span style={{ width: '360px', display: 'inline-block' }}>
                              <SelectExt value={rangeDatesSelectValue} options={optionsRangesDates} onChange={this.onChangeSelectRangeDates} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                            </span>
                          </span>
                        )}
                        {useCustomDates != null && (
                          <span style={{ marginRight: '50px' }}>
                            <span
                              css={`
                                font-family: Roboto;
                                font-size: 12px;
                                font-weight: bold;
                                color: #d1e4f5;
                                text-transform: uppercase;
                              `}
                              style={{ marginRight: '5px' }}
                            >
                              Prediction Start:
                            </span>
                            <span style={{ display: 'inline-block' }}>
                              <DatePicker
                                dateRender={this.onDatePickerDateRender}
                                disabledDate={this.onDatePickerIsDisabledDate}
                                allowClear={false}
                                open={!!this.state.dateOpenPopup}
                                onOpenChange={this.onOpenChangeDatePrediction}
                                showTime={this.state.showTime ? { disabledMinutes: this.disabledTime, disabledSeconds: this.disabledTime, hideDisabledOptions: true } : this.state.showTime}
                                size={'middle'}
                                value={this.state.predictionStart}
                                onChange={this.onChangeDatesStart}
                              />
                              <span
                                css={`
                                  font-family: Roboto;
                                  font-size: 12px;
                                  font-weight: bold;
                                  color: #d1e4f5;
                                  text-transform: uppercase;
                                `}
                                style={{ display: 'none', marginLeft: '15px', marginRight: '5px' }}
                              >
                                To:
                              </span>
                              <DatePicker allowClear={false} size={'middle'} value={this.state.dateEnd} onChange={this.onChangeDatesEnd} style={{ display: 'none' }} />
                            </span>
                          </span>
                        )}
                      </div>

                      <div
                        css={`
                          margin-top: 14px;
                          margin-bottom: 10px;
                        `}
                      >
                        {customIDSRender}

                        <span
                          css={`
                            font-family: Roboto;
                            font-size: 12px;
                            font-weight: bold;
                            color: #d1e4f5;
                            text-transform: uppercase;
                          `}
                          style={{ marginRight: '5px' }}
                        >
                          {(optionsTestDatasRes?.testIdName || (foundProject1 ? foundProject1.name : null) || 'Item ID') + (metricName != null ? ' (' + metricName + '):' : '')}
                        </span>
                        <span style={{ display: 'none', width: '200px' }}>
                          <SelectExt value={fieldSelectValue} options={optionsField} onChange={this.onChangeSelectField} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                        </span>
                        <span style={{ width: '300px', display: 'inline-block' }}>
                          <SelectExt allowCreate={true} value={testDatasSelectValue} options={optionsTestDatas} onChange={this.onChangeSelectFieldValue} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                        </span>

                        {windowOverlayMetrics != null && <span style={{ position: 'absolute', top: '100%', marginTop: '19px', right: '22px', flex: '0', whiteSpace: 'nowrap' }}>{windowOverlayMetrics}</span>}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', borderTop: '1px solid ' + Utils.colorA(0.2), paddingTop: '10px', marginBottom: 0, position: 'relative' }}>
                      {fieldList != null && (
                        <div style={{}}>
                          {fieldList.map((f1, f1ind) => (
                            <span key={'chk_' + f1} style={{ marginRight: '10px' }}>
                              {f1}&nbsp;
                              <Checkbox onChange={this.onChangeCheck.bind(this, f1, f1ind)} checked={fieldListEnabled && !!fieldListEnabled[f1ind]} />
                            </span>
                          ))}
                        </div>
                      )}
                      <div>
                        <RefreshAndProgress isRelative errorMsg={this.state.errorMsgPrediction} isRefreshing={isRefreshingChart}>
                          <div
                            ref={(r1) => {
                              this.chartdiv = r1;
                            }}
                            style={{ height: /*Math.max(440, height-topHH)*/ chartHH + 80 + 'px' }}
                          ></div>

                          {false && foundProject1 != null && (
                            <div
                              css={`
                                width: 300px;
                                margin: 5px auto 10px auto;
                              `}
                            >
                              <HelpBox beforeText={' understanding the graph'} fullLinkText={'Click here'} style={{ justifyContent: 'center' }} linkTo={'/help/useCases/' + foundProject1?.useCase + '/evaluating'} />
                            </div>
                          )}

                          <div
                            css={`
                              margin-top: 20px;
                            `}
                          >
                            <TableExt defaultSort={{ field: 'date_lastInt', isAsc: false }} dataSource={dataChartWindow} columns={columnsTable} calcKey={(r1) => r1[this.state.dataChartUseData?.fieldX]} />
                          </div>

                          <div
                            css={`
                              margin-top: 80px;
                            `}
                          >
                            &nbsp;
                          </div>
                        </RefreshAndProgress>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </AutoSizer>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    algorithms: state.algorithms,
    defDatasets: state.defDatasets,
  }),
  null,
)(ModelPredictionsChartTableOne);
