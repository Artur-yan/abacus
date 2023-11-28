import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Checkbox from 'antd/lib/checkbox';
import DatePicker from 'antd/lib/date-picker';
import { FormInstance } from 'antd/lib/form';
import Slider from 'antd/lib/slider';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils, { ColorsGradients } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { memProjectById } from '../../stores/reducers/projects';
import requests from '../../stores/reducers/requests';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import HelpBox from '../HelpBox/HelpBox';
import { IModelPropsCommon } from '../ModelPredictionCommon/ModelPredictionCommon';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./ModelPredictionsHistogramTimeseriesOne.module.css');
const sd = require('../antdUseDark.module.css');
const RangePicker = DatePicker.RangePicker;

const cellHH = 54;

interface IModelPredictionsHistogramTimeseriesOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;
  requests?: any;

  projectId?: string;
}

interface IModelPredictionsHistogramTimeseriesOneState {
  datasetIdSel?: string;
  selectedFieldValueId?: string;

  dateStartAndEnd?: any;
  threshold?: number;
  thresholdDebounce?: number;
  timeMinStart?: any;
  timeStart?: any;
  timeEnd?: any;
  fKwargs?: any;

  result?: any;
  resultError?: string;
  isRefreshingResult?: boolean;
  resultAnomalyScore?: any;
  resultPredictedHistogramData?: any;

  isRefreshingChart?: boolean;
  fieldListEnabled?: any;
  fieldList?: any;
  errorMsgPrediction?: any;
}

const histogramHH = 350;

class ModelPredictionsHistogramTimeseriesOne extends React.PureComponent<IModelPredictionsHistogramTimeseriesOneProps & IModelPropsCommon, IModelPredictionsHistogramTimeseriesOneState> {
  private unDark: any;
  private isM: boolean;
  private lastProjectId?: string;
  private dontusePrefix: any;
  formRef = React.createRef<FormInstance>();
  lastCallPredictData: any;
  prepareChartTimer: NodeJS.Timeout;
  chartdiv: any;
  alreadyPreparedChart: any;
  chart: any;
  lastUseData: any;
  private refScrollAll = React.createRef<any>();
  lastValueAxis: any;
  lastDateAxis: any;

  constructor(props) {
    super(props);

    this.state = {
      isRefreshingResult: false,
      threshold: null,
      thresholdDebounce: null,
    };

    this.dontusePrefix = uuid.v1();
  }

  onDarkModeChanged = (isDark) => {
    if (!this.isM) {
      return;
    }

    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);

    this.doMem(false);
  }

  componentWillUnmount() {
    this.isM = false;

    if (this.chart != null) {
      this.chart.dispose();
      this.chart = null;
    }

    this.unDark();
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

    let { projects, projectId } = this.props;

    let foundProject1 = this.memProjectId(true)(projectId, projects);

    let optionsTestDatasRes = this.props.optionsTestDatasRes;

    this.memTestDatas(optionsTestDatasRes);
    this.memPrediction(optionsTestDatasRes, this.state.threshold, this.state.timeStart, this.state.timeEnd);

    this.memGetChartData(this.state.result, this.state.fieldListEnabled);

    let reqOne = this.memRequestOne(true)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
  };

  componentDidUpdate(prevProps: Readonly<IModelPredictionsHistogramTimeseriesOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsHistogramTimeseriesOneState>, snapshot?: any): void {
    this.doMem();
  }

  doResetDatesIfNeeded = (keepTestData = false, keepDates = false) => {
    return new Promise((resolve, reject) => {
      let obj1: any = {};

      if (!keepTestData && this.state.datasetIdSel != null) {
        obj1.datasetIdSel = null;
      }

      if (!_.isEmpty(obj1)) {
        setTimeout(() => {
          this.setState(obj1, () => {
            resolve(null);
          });
        }, 0);
      } else {
        resolve(null);
      }
    });
  };

  memProjectIdDifferent = memoizeOne((projectId?: any) => {
    if (projectId) {
      this.doResetDatesIfNeeded().then(() => {});
    }
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  refreshUrlWithParams = () => {
    //TODO
  };

  gridColumnWidth = ({ index }) => {
    if (index === 0) {
      return 80;
    }

    let field1 = this.getFieldFromIndex(index - 1);
    if (field1) {
      let type1 = this.calcTypeFromField(field1);

      if (type1 === 'array') {
        return 200;
      } else if (type1 === 'string' || type1 === 'CATEGORICAL') {
        return 240;
      } else if (type1 === 'number' || type1 === 'numeric' || type1 === 'NUMERICAL') {
        return 160;
      } else if (type1 === 'TIMESTAMP') {
        return 200;
      } else {
        return 120;
      }
    }

    return 100;
  };

  calcTypeFromField = (field1) => {
    if (field1) {
      let dataType = field1.dataType;
      if (dataType != null) {
        return dataType;
      }
    }
    return null;
  };

  getFieldFromIndex = (index) => {
    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;

    if (columnsDisplay) {
      return columnsDisplay[index];
    }
  };

  memColumns = memoizeOne((columnsDisplay: { key: string; dataType: string }[]) => {
    if (columnsDisplay && columnsDisplay.length > 0) {
      let fields = columnsDisplay;
      let res = [];

      fields &&
        fields.some((f1, k1ind) => {
          let colIndex = k1ind;
          let field1 = f1;
          res.push({
            title: f1.key,
            field: f1.key,
            width: this.gridColumnWidth({ index: colIndex }),
          } as ITableExtColumn);
        });

      return res;
    }
  });

  cellRenderer = ({
    columnIndex, // Horizontal (column) index of cell
    isScrolling, // The Grid is currently being scrolled
    isVisible, // This cell is visible within the grid (eg it is not an overscanned cell)
    key, // Unique key within array of cells
    parent, // Reference to the parent Grid (instance)
    rowIndex, // Vertical (row) index of cell
    style, // Style object to be applied to cell (to position it);
    // This must be passed through to the rendered cell element.
  }) => {
    let content: any = '';

    let getValue = (row, col) => {
      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
      if (testDatasList) {
        let data1 = testDatasList[row];
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            let field1 = this.getFieldFromIndex(col);
            return { value: data1[field1.key], data1 };
          }
        }
      }
      return { value: '', data1: null };
    };

    let data1 = null;
    if (rowIndex === 0) {
      if (columnIndex === 0) {
        content = '';
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 1);
        content = 'Col: ' + columnIndex;
        if (field1) {
          if (field1) {
            content = field1.key || '-';
            // if(_.isString(content)) {
            //   content = Utils.prepareHeaderString(content);
            // }
          }
        }
      }
    } else {
      if (columnIndex === 0) {
        content = '' + rowIndex;
      } else {
        let v1 = getValue(rowIndex - 1, columnIndex - 1);
        content = '';
        if (v1) {
          content = v1.value;
          data1 = v1.data1;
        }

        if (content == null) {
          if (isScrolling) {
            content = '...';
          }
        } else {
          let field1 = this.getFieldFromIndex(columnIndex - 1);
          if (field1) {
            let dataType = this.calcTypeFromField(field1);
            if (dataType === 'TIMESTAMP') {
              let dt1 = moment(content);
              if (dt1.isValid()) {
                content = dt1.format('YYYY-MM-DD HH:mm:ss');
              }
            } else if (['number', 'float', 'numeric', 'NUMERICAL'].includes(dataType)) {
              content = Utils.roundDefault(content);
            }
          }
        }
      }
    }

    let styleF = _.assign({}, style || {}, { overflow: 'hidden', padding: '0 3px' });
    styleF.backgroundColor = rowIndex === 0 ? Constants.backBlueDark() : Utils.isDark() ? '#0E141C' : '#f5f5f5';
    if (rowIndex > 0) {
      if (rowIndex % 2 === 1) {
        styleF.backgroundColor = '#19232f';
      } else {
        styleF.backgroundColor = '#0c121b';
      }
    }

    if (_.isString(content) || _.isNumber(content)) {
      content = <div className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}>{content}</div>;
    }

    return (
      <div key={key} style={styleF} className={s.Cell + ' '} /*onClick={this.onRowClick.bind(this, data1)}*/>
        {content}
      </div>
    );
  };

  memPrediction = memoizeOne((optionsTestDatasRes, threshold, timeStart, timeEnd) => {
    if (this.state.isRefreshingResult || this.state.isRefreshingChart || !optionsTestDatasRes || threshold == null || timeStart == null || timeEnd == null) {
      return;
    }

    if (this.calcRequestId()) {
      return;
    }

    this.showPrediction();
  });

  showPrediction = () => {
    this.setState({
      isRefreshingChart: true,
      resultError: null,
    });

    this.lastCallPredictData = uuid.v1();

    let uuid1 = this.lastCallPredictData;
    let dataParams: any = { data: '', threshold: this.state.threshold, start_timestamp: this.state.timeStart, end_timestamp: this.state.timeEnd };
    dataParams = _.assign({}, dataParams, this.state.fKwargs);

    REClient_.client_()._predictForUI(this.props.selectedAlgoId, dataParams, null, this.calcRequestId(), (err, res) => {
      if (this.lastCallPredictData !== uuid1) {
        return;
      }

      this.setState({
        isRefreshingChart: false,
      });

      if (err || !res || !res.result) {
        if (err === 'Requested deployment is not active') {
          StoreActions.deployList_(this.props.paramsProp?.get('projectId'));
        }
        if (res?.errorType !== 'DataNotFoundError') {
          REActions.addNotificationError(err || Constants.errorDefault);
        }
        this.setState({
          resultError: err || Constants.errorDefault,
        });
      } else {
        let histData = res?.result?.histogram?.map((d1) => ({ name: d1.label, value: d1.val }));

        this.setState({
          result: res?.result,
          resultPredictedHistogramData: histData,
          resultError: null,
        });
      }
    });
  };

  memTestDatas = memoizeOne((optionsTestDatasRes) => {
    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;

    if (this.state.selectedFieldValueId == null || (optionsTestDatas && optionsTestDatas.length > 0 && optionsTestDatas.find((o1) => o1.value === this.state.selectedFieldValueId) == null)) {
      if (optionsTestDatas && optionsTestDatas.length > 0) {
        if (this.state.selectedFieldValueId !== optionsTestDatas[0].value) {
          this.setState(
            {
              selectedFieldValueId: optionsTestDatas[0].value,
            },
            () => {
              this.refreshUrlWithParams();
            },
          );
        }
      }
    }

    //
    let th1 = optionsTestDatasRes?.resultTestDatas?.displayInfo?.defaultThreshold;
    let minStart1 = optionsTestDatasRes?.resultTestDatas?.displayInfo?.minStartTimestamp;
    let tStart1 = optionsTestDatasRes?.resultTestDatas?.displayInfo?.defaultStartTimestamp;
    let tEnd1 = optionsTestDatasRes?.resultTestDatas?.displayInfo?.maxEndTimestamp;
    let fKwargs = optionsTestDatasRes?.resultTestDatas?.formatKwargs;

    if (th1 != null && _.isNumber(th1) && this.state.threshold !== th1 && tStart1 != null && tEnd1 != null && _.isNumber(tStart1) && _.isNumber(tEnd1) && this.state.timeStart !== tStart1 && this.state.timeEnd !== tEnd1) {
      this.setState({
        threshold: th1,
        thresholdDebounce: th1,
        timeMinStart: minStart1,
        timeStart: tStart1,
        timeEnd: tEnd1,
        fKwargs: fKwargs,
        dateStartAndEnd: [moment.unix(tStart1), moment.unix(tEnd1)],
      });
    }
  });

  memHistogram = memoizeOne((list, threshold) => {
    if (list != null && list.length > 0 && threshold != null && _.isNumber(threshold)) {
      let dataList = [],
        labels = [];
      list.some((v1) => {
        let n1 = v1.name;
        if (_.isNumber(n1)) {
          n1 = Utils.decimals(n1, 2);
        }

        labels.push(n1);
        dataList.push({ x: n1, y: v1.value });
      });

      const hHH = histogramHH;

      return (
        <div style={{ position: 'relative' }}>
          <div style={{ height: hHH + 'px', position: 'relative', width: '600px' }}>
            <div style={{ margin: '0 10px', zIndex: 2, height: hHH + 'px', position: 'relative' }}>
              <ChartXYExt
                useEC
                colorFixed={ColorsGradients}
                colorIndex={0}
                width={600}
                height={hHH}
                data={{
                  useSmallBars: true,
                  roundBars: true,
                  maxDecimalsTooltip: 3,
                  labelMaxChars: 40,
                  gridColor: '#4c5b92',
                  labelColor: '#8798ad',
                  titleStyle: {
                    color: '#d1e4f5',
                    fontFamily: 'Matter',
                    fontSize: 13,
                    fontWeight: 'bold',
                  },
                  aadrawLineX: threshold,
                  forceToPrintAllLabels: true,
                  divisorX: null,
                  useTitles: true,
                  titleY: '% of Points Above Threshold',
                  titleX: 'Anomaly Score Threshold',
                  tooltips: true,
                  data: dataList,
                  labels: labels,
                }}
                type={'bar'}
              />
            </div>
          </div>
        </div>
      );
    }
  });

  memGetChartData = memoizeOne((result, fieldListEnabled) => {
    if (!result) {
      return;
    }

    this.recreateChart(result, undefined, fieldListEnabled);
  });

  recreateChart = (useData?: any, forceUseData = false, fieldListEnabled = null) => {
    if (!this.isM) {
      return;
    }

    const isSameData = useData != null && useData === this.lastUseData && this.chart != null;

    //
    let usedCacheData = false;
    if (useData == null) {
      if (!forceUseData) {
        useData = this.lastUseData;
      }
    } else {
      usedCacheData = true;
      this.lastUseData = useData;
    }

    setTimeout(() => {
      this.setState({
        errorMsgPrediction: null,
      });
    }, 0);

    if (!isSameData && this.chart != null) {
      this.chart.dispose();
      this.chart = null;
    }

    //
    this.alreadyPreparedChart = false;
    if (!isSameData) {
      this.chart = null;
      $(this.chartdiv).empty();
    }

    //
    if (!useData) {
      return;
    }

    let fieldList = useData.columns;
    if (fieldList != null && !_.isArray(fieldList)) {
      fieldList = [fieldList];
    }
    if (fieldList != null && _.isArray(fieldList)) {
      let ff = [];
      fieldList?.some((a1) => {
        if (ff.indexOf(a1) === -1) {
          ff.push(a1);
        }
      });
      fieldList = ff;
    }

    if (fieldListEnabled == null || fieldListEnabled.length === 0) {
      if (fieldList != null && fieldList.length > 0) {
        fieldListEnabled = fieldList.map((f1) => false);
        fieldListEnabled[0] = true;

        this.setState({
          fieldListEnabled,
          fieldList,
        });
        return;
      }
    }

    this.prepareChart(useData, undefined, usedCacheData, fieldListEnabled, isSameData);
  };

  prepareChart = (useData: any, max = 50, usedCacheData = false, fieldListEnabled = null, isSameData = false) => {
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
          this.prepareChart(useData, max - 1, usedCacheData, isSameData);
        }, 40);
      }
      return;
    }

    //
    this.alreadyPreparedChart = true;

    if (!isSameData && this.chart != null) {
      this.chart.dispose();
      this.chart = null;
    }

    const $this = this;

    // @ts-ignore
    Promise.all([import('@amcharts/amcharts4/core'), import('@amcharts/amcharts4/charts'), import('@amcharts/amcharts4/themes/moonrisekingdom'), import('@amcharts/amcharts4/themes/dark'), import('@amcharts/amcharts4/plugins/bullets')])
      .then((modules) => {
        const am4core: any = modules[0];
        const am4charts: any = modules[1];
        const am4themes_light: any = modules[2].default;
        const am4themes_dark: any = modules[3].default;
        const am4plugins_bullets: any = modules[4];

        if (am4core.options) {
          am4core.options.commercialLicense = true;
        }

        let fieldList = useData?.columns;
        if (!_.isArray(fieldList)) {
          fieldList = [fieldList];
        }

        if (fieldList != null) {
          let ff = [];
          fieldList?.some((a1) => {
            if (ff.indexOf(a1) === -1) {
              ff.push(a1);
            }
          });
          fieldList = ff;
        }

        if (isSameData && fieldListEnabled != null) {
          if (fieldList != null && _.isArray(fieldList) && fieldList.length > 0) {
            this.chart.series.clear();
          }
        }

        //
        if (!isSameData) {
          am4core.unuseAllThemes();
          am4core.useTheme(Utils.isDark() ? am4themes_dark : am4themes_light);
        }

        // @ts-ignore
        let chart = this.chart || am4core.create(this.chartdiv, am4charts.XYChart);
        this.chart = chart;
        if (!isSameData) {
          chart.paddingRight = 20;
          chart.paddingLeft = 20;
          chart.paddingTop = 10;
          chart.paddingBottom = 10;
        }

        let dataChart = useData.data;
        let fieldHideAnomaly = useData.fieldHideAnomaly;
        let fieldAnomalyScore = useData.fieldAnomalyScore;
        let fieldValue = useData.fieldValue;

        if (!isSameData) {
          useData.convertToDateFields = useData.dateX == null ? null : [useData.dateX];

          if (!useData.dataAlreadyConverted && dataChart) {
            if (useData.convertToDateFields && useData.convertToDateFields.length > 0) {
              useData.convertToDateFields.some((c1, c1ind) => {
                dataChart = dataChart.map((d1, d1ind) => {
                  let n1 = d1[c1];
                  d1[c1] = new Date(n1 * 1000);

                  if (fieldList != null && _.isArray(fieldList) && fieldList.length > 0) {
                    fieldList.some((f1, f1ind) => {
                      d1[f1 + fieldAnomalyScore + 'isHidden'] = d1[f1 + fieldAnomalyScore] == null;
                    });
                  }

                  return d1;
                });
              });
            }
          }
          useData.dataAlreadyConverted = true;

          chart.data = dataChart;
          chart.maskBullets = false;
        }

        let dateAxis = isSameData ? $this.lastDateAxis : chart.xAxes.push(new am4charts.DateAxis());
        $this.lastDateAxis = dateAxis;
        if (!isSameData) {
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
        }

        let valueAxis = isSameData ? $this.lastValueAxis : chart.yAxes.push(new am4charts.ValueAxis());
        $this.lastValueAxis = valueAxis;

        if (!isSameData) {
          valueAxis.tooltip.disabled = true;
          valueAxis.title.text = useData.titleY || '';
        }

        let useLegend = !Utils.isNullOrEmpty(useData.seriesName1) || !Utils.isNullOrEmpty(useData.seriesName2);

        let colorsCharts = 0;
        let seriesNList = [];

        if (fieldList != null && _.isArray(fieldList) && fieldList.length > 0) {
          fieldList.some((f1, f1ind) => {
            if (!fieldListEnabled[f1ind]) {
              return false;
            }

            let seriesN = chart.series.push(new am4charts.LineSeries());
            if (useLegend) {
              seriesN.name = f1;
            }

            seriesN.dataFields.dateX = useData.dateX;
            seriesN.dataFields.valueY = f1 + fieldValue;

            seriesN.tooltip.numberFormatter = new am4core.NumberFormatter();
            seriesN.tooltip.numberFormatter.numberFormat = '#.00';
            seriesN.tooltipText = f1 + ': Anomaly Score: [bold]{' + f1 + fieldAnomalyScore + '}[/]';
            seriesN.tooltip.propertyFields.disabled = f1 + fieldAnomalyScore + 'isHidden';

            let c1: any = Utils.getColorPaletteByIndex(colorsCharts++);
            seriesN.stroke = c1;
            seriesN.fill = c1;

            if (fieldHideAnomaly != null) {
              let bullet = seriesN.bullets.push(new am4plugins_bullets.FlagBullet());
              bullet.label.text = 'Anomaly';
              bullet.disabled = true;
              bullet.propertyFields.disabled = f1 + fieldHideAnomaly;

              let colorRed = am4core.color('#b86969');
              let colorRedPole = am4core.color('#b34343');
              bullet.pole.stroke = colorRedPole;
              bullet.background.waveLength = 15;
              bullet.background.fillOpacity = 0.9;
              bullet.background.fill = colorRed;
              bullet.background.stroke = colorRedPole;

              let circle = bullet.createChild(am4core.Circle);
              circle.radius = 4;
              circle.strokeWidth = 1;
              circle.stroke = am4core.color('rgba(255,255,255,0.72)');
              circle.fill = colorRedPole;
            }

            seriesNList.push(seriesN);
          });
        }

        if (!isSameData) {
          chart.cursor = new am4charts.XYCursor();
          chart.cursor.lineY.opacity = 0;
          chart.scrollbarX = new am4charts.XYChartScrollbar();
        }

        // @ts-ignore
        if (seriesNList != null) {
          seriesNList.some((s1, s1ind) => {
            // @ts-ignore
            chart.scrollbarX.series.push(s1);
          });
        }

        if (!isSameData) {
          if (useLegend) {
            chart.legend = new am4charts.Legend();
          }

          if (!Utils.isNullOrEmpty(useData.titleTop)) {
            let title = chart.titles.create();
            title.text = useData.titleTop;
            title.fontSize = 23;
            title.marginBottom = 20;
          }

          chart.events.on('datavalidated', function (ev) {
            valueAxis.min = valueAxis.minZoomed;
            valueAxis.max = valueAxis.maxZoomed;
          });

          if (useData.isDateType && useData.defaultWindowStartTs != null && useData.defaultWindowEndTs != null) {
            let zoomStart = new Date(useData.defaultWindowStartTs);
            let zoomEnd = new Date(useData.defaultWindowEndTs);

            chart.events.on('ready' /*"datavalidated"*/, function () {
              dateAxis.zoomToDates(zoomStart, zoomEnd);
            });
          }
        }

        if (isSameData) {
          valueAxis.min = null;
          valueAxis.max = null;

          chart.invalidateData();
        }
      })
      .catch((e) => {
        Utils.error('Error when creating chart', e);
      });
  };

  onChangeCheck = (f1, f1ind, e) => {
    let fieldListEnabled = this.state.fieldListEnabled;
    fieldListEnabled = fieldListEnabled ? [...fieldListEnabled] : [];
    let b1 = !!fieldListEnabled[f1ind];
    fieldListEnabled[f1ind] = !b1;
    this.setState({
      fieldListEnabled,
    });
  };

  onChangeDatesStartAndEnd = (dates, strings) => {
    if (dates) {
      let calcD = (ind) => {
        let dt1 = dates?.[ind];
        if (dt1 == null) {
          return null;
        } else {
          return dt1.unix();
        }
      };

      this.setState({
        timeStart: calcD(0),
        timeEnd: calcD(1),
        dateStartAndEnd: dates,
      });
    }
  };

  onChangeThreshold = (v1) => {
    v1 = (v1 ?? 0) / 100;
    this.setState({
      thresholdDebounce: v1,
    });
  };

  onChangeThresholdAfter = (v1) => {
    v1 = (v1 ?? 0) / 100;
    this.setState({
      thresholdDebounce: v1,
    });

    this.refreshForThreshold(v1);
  };

  refreshForThreshold = (v1) => {
    this.setState({
      threshold: v1,
    });
  };

  onChangeSelectDeployment = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let deployId = optionSel?.value;
    if (projectId && deployId) {
      Location.push('/' + PartsLink.model_predictions + '/' + projectId + '/' + deployId);
    }
  };

  onClickGoChart = (e) => {
    // @ts-ignore
    this.refScrollAll?.current?.scrollBottom();
  };

  onChangeSelectItemId = (option1) => {
    if (option1?.value == null) {
      return;
    }
    let p = this.state.fieldList?.findIndex((f1) => f1 === option1?.value);
    if (p > -1) {
      let fieldListEnabled = this.state.fieldList?.map((f1) => false);
      fieldListEnabled[p] = true;

      this.setState({
        fieldListEnabled,
      });
    }
  };

  calcRequestId = () => {
    let requestId = this.props.paramsProp?.get('requestId');
    if (requestId === '') {
      requestId = null;
    }
    return requestId;
  };

  memRequestOne = memoizeOneCurry((doCall, requestsParam, deployId, requestId) => {
    return requests.memRequestById(doCall, undefined, deployId, requestId);
  });

  render() {
    let { projects, projectId } = this.props;

    let foundProject1 = this.memProjectId(false)(projectId, projects);

    let isRefreshing = false;
    if (projects) {
      isRefreshing = projects.get('isRefreshing');
    }
    if (!foundProject1) {
      isRefreshing = true;
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');
    let menuPortalTarget = popupContainerForMenu(null);

    let optionsAlgo = this.props.optionsAlgo;
    let algoSelectValue = null;
    if (this.props.selectedAlgoId) {
      algoSelectValue = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;

    const topHH = 60;
    const marginGrid = 30;

    let isRefreshingChart = this.state.isRefreshingChart;

    let { fieldList, fieldListEnabled, errorMsgPrediction } = this.state;

    let optionsDeploys = this.props.optionsAlgo;
    let optionsDeploysSel = null;
    if (this.props.selectedAlgoId) {
      optionsDeploysSel = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }
    let deploymentSelect = (
      <span style={{ width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt isDisabled={this.calcRequestId() != null} value={optionsDeploysSel} options={optionsDeploys} onChange={this.onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    let histogramElem = this.memHistogram(this.state.resultPredictedHistogramData, this.state.threshold);

    const optionsItemsId = fieldList?.map((f1, f1ind) => ({ label: f1, value: f1 }));
    let p = fieldListEnabled?.findIndex((e1) => !!e1);
    const optionsItemIdSel = p > -1 ? optionsItemsId?.[p] : null;

    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <RefreshAndProgress errorMsg={null} isRefreshing={isRefreshing}>
          <AutoSizer>
            {({ height, width }) => {
              return (
                <div style={{ width: width + 'px' }}>
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

                  {isRefreshing !== true && (
                    <div style={{ zIndex: 3, position: 'absolute', top: topAfterHeaderHH + 'px', left: 0, right: 0, bottom: 0 }} className={sd.grayPanel}>
                      <NanoScroller onlyVertical ref={this.refScrollAll}>
                        <div>
                          <div style={{ position: 'relative', padding: marginGrid + 'px' }}>
                            <div style={{ textAlign: 'center', borderTop: '1px solid ' + Utils.colorA(0.2), paddingTop: '10px', marginBottom: '10px', position: 'relative' }}>
                              <div style={{ marginRight: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                                <span style={{ display: 'inline-block' }} className={s.rangePicker}>
                                  <RangePicker allowClear={false} size={'middle'} value={this.state.dateStartAndEnd} onChange={this.onChangeDatesStartAndEnd} showTime />
                                </span>

                                <span
                                  css={`
                                    font-family: Roboto;
                                    font-size: 12px;
                                    font-weight: bold;
                                    color: #d1e4f5;
                                    text-transform: uppercase;
                                  `}
                                  style={{ marginLeft: '20px' }}
                                >
                                  Threshold
                                </span>
                                <span style={{ marginLeft: '5px', display: 'inline-block', width: '120px' }}>
                                  <Slider disabled={this.calcRequestId() != null} min={0} max={100} value={this.state.thresholdDebounce * 100} onChange={this.onChangeThreshold} onAfterChange={this.onChangeThresholdAfter} />
                                </span>
                                <span style={{ opacity: 0.8, marginLeft: '8px' }}>{Utils.decimals(this.state.thresholdDebounce * 100, 2)}</span>
                                <span style={{ marginLeft: '20px' }}>
                                  <TooltipExt title={'View Distribution'}>
                                    <FontAwesomeIcon onClick={this.onClickGoChart} icon={['far', 'chart-area']} transform={{ size: 15, x: 0, y: 0 }} style={{ cursor: 'pointer' }} />
                                  </TooltipExt>
                                </span>

                                <span style={{ marginLeft: '20px', width: '300px', display: 'inline-block', fontSize: '14px' }}>
                                  <SelectExt value={optionsItemIdSel} options={optionsItemsId} onChange={this.onChangeSelectItemId} menuPortalTarget={popupContainerForMenu(null)} />
                                </span>
                              </div>

                              {false && fieldList != null && (
                                <div style={{ marginTop: '8px' }}>
                                  {fieldList.map((f1, f1ind) => (
                                    <span key={'chk_' + f1} style={{ marginRight: '10px' }}>
                                      {f1}&nbsp;
                                      <Checkbox onChange={this.onChangeCheck.bind(this, f1, f1ind)} checked={fieldListEnabled && !!fieldListEnabled[f1ind]} />
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div style={{ position: 'relative' }}>
                                <RefreshAndProgress
                                  isRelative
                                  errorMsg={this.state.errorMsgPrediction}
                                  isRefreshing={isRefreshingChart}
                                  style={{ height: Math.max(440, height - topAfterHeaderHH - marginGrid * 2 - topAfterHeaderHH) + 'px', width: width - marginGrid * 2 + 'px' }}
                                >
                                  <div
                                    ref={(r1) => {
                                      this.chartdiv = r1;
                                    }}
                                    style={{ height: Math.max(440, height - topAfterHeaderHH - marginGrid * 2 - topAfterHeaderHH) + 'px' }}
                                  ></div>
                                </RefreshAndProgress>
                              </div>
                            </div>
                          </div>

                          <div style={{ position: 'relative', textAlign: 'center', display: 'flex', flexFlow: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ flex: '0 0 50px', opacity: 0.8, fontSize: '17px', marginBottom: '4px' }}>Anomaly Score Distribution</div>
                            <div style={{ paddingBottom: '40px' }}>
                              <RefreshAndProgress isRelative isRefreshing={this.state.isRefreshingResult}>
                                {histogramElem}
                              </RefreshAndProgress>
                            </div>
                          </div>
                        </div>
                      </NanoScroller>
                    </div>
                  )}
                </div>
              );
            }}
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
    schemaPredictions: state.schemaPredictions,
    requests: state.requests,
  }),
  null,
)(ModelPredictionsHistogramTimeseriesOne);
