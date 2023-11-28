import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import DatePicker from 'antd/lib/date-picker';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Slider from 'antd/lib/slider';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
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
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import { IModelPropsCommon } from '../ModelPredictionCommon/ModelPredictionCommon';
import { isEqualAllSmart } from '../ModelPredictionsRegressionOne/PredEqualSmart';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ModelPredictionsHistogramTableOne.module.css');
const sd = require('../antdUseDark.module.css');
const RangePicker = DatePicker.RangePicker;

const cellHH = 54;

interface IModelPredictionsHistogramTableOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;
  requests?: any;

  projectId?: string;
}

interface IModelPredictionsHistogramTableOneState {
  datasetIdSel?: string;

  threshold?: number;
  thresholdDebounce?: number;
  predictData?: any;
  showGrid?: any;
  resultActual?: any;
  resultPredicted?: any;
  resultPredictedGrid?: any;
  resultPredictedHistogram?: any;
  hoveredRowIndex?: number;

  resultError?: string;
  isRefreshingResult?: boolean;

  dataGrid?: any;
  thresholdMin?: number;
}

const histogramHH = 300;
const histogramWW = 500;

class ModelPredictionsHistogramTableOne extends React.PureComponent<IModelPredictionsHistogramTableOneProps & IModelPropsCommon, IModelPredictionsHistogramTableOneState> {
  private unDark: any;
  private isM: boolean;
  private lastProjectId?: string;
  private dontusePrefix: any;
  formRef = React.createRef<FormInstance>();
  lastCallPredictData: any;
  formPredicted = React.createRef<FormInstance>();
  formActual = React.createRef<FormInstance>();
  lastReqOneUsed: any;

  constructor(props) {
    super(props);

    this.state = {
      isRefreshingResult: false,
      threshold: null,
      thresholdDebounce: null,
      showGrid: true,
      thresholdMin: 0.99,
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

    let foundProject1 = this.memProjectId(true)(this.props.projectId, this.props.projects);
    let optionsTestDatasRes = this.props.optionsTestDatasRes;

    this.memTestDatas(optionsTestDatasRes);
    if (this.state.threshold != null) {
      this.memPrediction(optionsTestDatasRes, this.state.threshold);
    }

    let reqOne = this.memRequestOne(true)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
    if (this.calcRequestId() && this.state.predictData == null && this.lastReqOneUsed !== reqOne) {
      if (reqOne?.query?.data != null) {
        this.lastReqOneUsed = reqOne;
        let data1 = /*Utils.tryJsonParse*/ reqOne?.query?.data;
        if (data1 != null) {
          this.showPrediction(data1);
        }
      }
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

  memPredictionOnlyData = memoizeOne((optionsTestDatasRes) => {
    if (this.calcRequestId() != null) {
      return;
    }
    if (optionsTestDatasRes) {
      let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
      if (testDatasList) {
        let data1 = testDatasList[0];
        if (data1) {
          this.setState({
            resultPredicted: null,
            resultPredictedGrid: null,
            resultPredictedHistogram: null,
            resultActual: null,
          });
        }
      }
    }
  });

  memPrediction = memoizeOne((optionsTestDatasRes, threshold) => {
    // optionsTestDatasRes?.resultTestDatas
    if (this.state.isRefreshingResult || !optionsTestDatasRes || threshold == null) {
      return;
    }

    this.memPredictionOnlyData(optionsTestDatasRes);
    if (this.calcRequestId() != null) {
      return;
    }
    this.showPrediction(null);
  });

  componentDidUpdate(prevProps: Readonly<IModelPredictionsHistogramTableOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsHistogramTableOneState>, snapshot?: any): void {
    this.doMem();
  }

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

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let columnsDisplay: { name: string; key: string; dataType: string }[] = this.memAddAnomalyColumns(optionsTestDatasRes);

    let multiByColumnsCount = 1;
    if (columnsDisplay) {
      if (columnsDisplay.length <= 5) {
        multiByColumnsCount = 2.3;
      }
    }

    let field1 = this.getFieldFromIndex(index - 1);
    if (field1) {
      let type1 = this.calcTypeFromField(field1);

      if (type1 === 'array') {
        return Math.ceil(200 * multiByColumnsCount);
      } else if (type1 === 'string' || type1 === 'CATEGORICAL') {
        return Math.ceil(240 * multiByColumnsCount);
      } else if (type1 === 'number' || type1 === 'numeric' || type1 === 'NUMERICAL') {
        return Math.ceil(160 * multiByColumnsCount);
      } else if (type1 === 'TIMESTAMP') {
        return Math.ceil(200 * multiByColumnsCount);
      } else {
        return Math.ceil(120 * multiByColumnsCount);
      }
    }

    return Math.ceil(100 * multiByColumnsCount);
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
    let columnsDisplay: { name: string; key: string; dataType: string }[] = this.memAddAnomalyColumns(optionsTestDatasRes);

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
      let items = this.state.resultPredictedGrid?.items;
      let data1 = items?.[row]?.data;
      let score1 = items?.[row]?.score ?? 0;
      if (data1) {
        if (_.isArray(data1)) {
          data1 = data1[0];
        }
        data1['anomaly_score'] = score1.toFixed(4);
        if (data1) {
          let field1 = this.getFieldFromIndex(col);
          return { value: field1 ? data1[field1.key] : null, data1 };
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
        let v1 = getValue(rowIndex - 1, 1);
        if (v1) {
          data1 = v1.data1;
        }
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
    styleF.backgroundColor = rowIndex === 0 ? '#23305e' : '#19232f';
    styleF.borderBottom = '1px solid #0b121b';
    if (this.state.hoveredRowIndex === rowIndex) {
      styleF.backgroundColor = '#284192';
      styleF.cursor = 'pointer';
    }

    if (_.isString(content) || _.isNumber(content)) {
      content = <div className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}>{content}</div>;
    }

    return (
      <div key={key} style={styleF} className={s.Cell + ' '} onClick={this.onRowClick.bind(this, data1)} onMouseEnter={this.onRowMouseEnter.bind(this, rowIndex === 0 ? null : rowIndex)}>
        {content}
      </div>
    );
  };

  onRowMouseChangeIndex = (rowIndex) => {
    if (this.state.hoveredRowIndex !== rowIndex) {
      this.setState({
        hoveredRowIndex: rowIndex,
      });
    }
  };

  onRowMouseEnter = (rowIndex, e) => {
    this.onRowMouseChangeIndex(rowIndex);
  };

  onRowMouseLeave = (e) => {
    this.onRowMouseChangeIndex(null);
  };

  onRowClick = (row) => {
    if (this.calcRequestId() != null) {
      return;
    }

    if (row != null) {
      this.setState({
        showGrid: false,
      });
      this.showPrediction(row, true);
    }
  };

  showPrediction = (row, sendThreshold = false) => {
    this.setState({
      predictData: row,
      isRefreshingResult: true,
      resultActual: null,
      resultError: null,
    });

    this.lastCallPredictData = uuid.v1();

    let uuid1 = this.lastCallPredictData;
    // let dataParams: any = { data: JSON.stringify([row]) };

    let data1: any = row == null || row === '' ? '' : JSON.stringify(row);
    // if(sendThreshold && !hideAll) {
    //   data1 = JSON.stringify({ threshold: this.state.threshold, });
    // }
    let dataParams: any = { data: data1, threshold: this.state.threshold };
    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    dataParams = _.assign(dataParams || {}, optionsTestDatasRes?.sendParams || {});

    REClient_.client_()._predictForUI(this.props.selectedAlgoId, dataParams, null, this.calcRequestId(), (err, res) => {
      if (this.lastCallPredictData !== uuid1) {
        return;
      }

      this.setState({
        isRefreshingResult: false,
      });

      if (err || !res || !res.result) {
        if (err === 'Requested deployment is not active') {
          StoreActions.deployList_(this.props.projectId);
        }
        if (res?.errorType !== 'DataNotFoundError') {
          REActions.addNotificationError(err || Constants.errorDefault);
        }
        this.setState({
          resultError: err || Constants.errorDefault,
        });
      } else {
        let actual = null;

        let optionsTestDatasRes = this.props.optionsTestDatasRes;
        let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
        let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
        let columnsDisplay: { name: string; key: string; dataType: string }[] = this.memAddAnomalyColumns(optionsTestDatasRes);

        if (testDatasList && columnsDisplay) {
          let kk = Object.keys(rangeDateByTestDataId);
          kk.some((k1) => {
            let all1 = rangeDateByTestDataId[k1];
            let data1 = all1.data;
            if (data1) {
              if (_.isArray(data1)) {
                data1 = data1[0];
              }
              if (data1) {
                if (all1 && this.state.predictData && isEqualAllSmart(data1, this.state.predictData)) {
                  actual = all1.actual;
                  if (actual != null) {
                    let predictedOne = res?.result?.predicted;

                    let key1 = 'value';
                    if (predictedOne && _.isArray(predictedOne) && predictedOne.length > 0) {
                      let kk = Object.keys(predictedOne[0]);
                      if (kk && kk.length > 0) {
                        key1 = kk[0];
                      }
                    }

                    actual = [{ [key1]: actual }];
                  }
                  return true;
                }
              }
            }
          });
        }

        this.setState({
          resultError: null,
        });

        let resHisto = res?.result?.predicted?.histogram?.map((d1) => ({ name: d1.label, value: d1.val }));
        let resultPredictedHistogram = this.state.resultPredictedHistogram;
        if ((row == null || this.calcRequestId() != null) && !_.isEqual(resultPredictedHistogram, resHisto)) {
          this.setState({
            resultPredictedHistogram: resHisto,
          });
        }
        this.setState({
          resultActual: actual,
          resultError: null,
        });
        if (row == null) {
          this.setState({
            resultPredictedGrid: res?.result?.predicted,
          });
        } else {
          this.setState({
            resultPredicted: res?.result?.predicted,
          });
        }
      }
    });
  };

  memTestDatas = memoizeOne((optionsTestDatasRes) => {
    if (this.calcRequestId() != null) {
      return;
    }

    let th1 = optionsTestDatasRes?.resultTestDatas?.displayInfo?.defaultThreshold;
    if (th1 != null && _.isNumber(th1) && this.state.threshold !== th1) {
      this.setState({
        threshold: th1,
        thresholdDebounce: th1,
      });
    }
  });

  doPredictResult = (e) => {
    this.formRef.current.submit();
  };

  handleSubmitForm = (values) => {
    if (this.calcRequestId() != null) {
      return;
    }

    let vv = _.assign({}, values);
    let kk = Object.keys(vv);
    kk.some((k1) => {
      if (_.startsWith(k1, this.dontusePrefix)) {
        delete vv[k1];
      }
    });
    this.showPrediction(vv);
  };

  renderObjectToFields: (list, nameForm) => { list; initialValues } = (list, nameForm = '') => {
    let res = [],
      initialValues = {};

    if (list != null && !_.isArray(list) && _.isObject(list)) {
      list = [list];
    }

    if (list && _.isArray(list)) {
      list.some((data) => {
        let kk = Object.keys(data);
        kk.some((k1) => {
          let v1 = data[k1];
          if (_.isNaN(v1)) {
            v1 = null;
          }

          let input = null;
          if (_.isObject(v1)) {
            let vv = [];
            let v1kk = Object.keys(v1);
            v1kk.some((v1k1) => {
              if (v1[v1k1] != null) {
                vv.push({ value: v1[v1k1], name: v1k1 });
              }
            });
            vv.sort((a, b) => {
              if (a.value === b.value) {
                return 0;
              } else if (a.value < b.value) {
                return 1;
              } else {
                return -1;
              }
            });

            let dataList = [],
              labels = [];
            vv.some((v1) => {
              labels.push(v1.name);
              dataList.push({ meta: v1.name, value: v1.value });
            });

            input = (
              <div>
                <div style={{ marginBottom: '3px', textAlign: 'center', color: Utils.colorAall(0.8) }}>Histogram</div>
                <div style={{ margin: '0 12px' }}>
                  <ChartXYExt data={{ tooltips: true, data: dataList, labels: labels }} type={'barhor'} />
                </div>
              </div>
            );

            res.push(
              <Form.Item key={'field_' + k1 + nameForm} style={{ marginBottom: 0, marginTop: 0 }} label={<span style={{ color: Utils.colorAall(1) }}>{k1}</span>}>
                {input}
              </Form.Item>,
            );
          } else {
            if (_.isNumber(v1)) {
              v1 = Utils.decimals(v1, 2);
            }

            let inputName = this.dontusePrefix + nameForm + k1.replace(/[^a-zA-Z0-9]/, '');
            initialValues[inputName] = v1;

            res.push(
              <Form.Item name={inputName} key={'field_' + k1 + nameForm} style={{ marginBottom: 0, marginTop: 0 }} label={<span style={{ color: Utils.colorAall(1) }}>{k1}</span>}>
                <Input disabled={true} />
              </Form.Item>,
            );
          }
        });
      });
    }

    return { list: res.length === 0 ? null : res, initialValues };
  };

  memRenderActual = memoizeOne((data) => {
    return this.renderObjectToFields(data, 'actual');
  });

  memHistogramOnly = memoizeOne((list, width, topHHthreshold) => {
    if (list != null && list.length > 0) {
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

      const hHH = topHHthreshold - 2 * 10 - 2 * 20; // 170;

      const data1 = {
        paddingTop: 8,
        forceToPrintAllLabels: true,
        divisorX: null,
        useTitles: true,
        titleY: '% of Points Above Threshold',
        titleX: 'Anomaly Score Threshold',
        tooltips: true,
        data: dataList,
        labels: labels,

        roundBars: true,
        barMaxWidth: 66,
        labelMaxChars: 14,
        gridColor: '#4c5b92',
        labelColor: '#8798ad',
        titleStyle: {
          color: '#d1e4f5',
          fontFamily: 'Matter',
          fontSize: 13,
          fontWeight: 'bold',
        },
      };

      const colors = ColorsGradients;
      return (
        <div style={{ position: 'relative', color: 'white' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ margin: '0 10px', zIndex: 2, position: 'relative' }}>
              <ChartXYExt useEC width={width} colorFixed={colors} colorIndex={0} height={hHH} data={data1} type={'bar'} />
            </div>
          </div>
        </div>
      );
    }
  });

  memRenderPredicted = memoizeOne((data) => {
    if (!data) {
      return <div></div>;
    }

    return (
      <div
        css={`
          font-family: Matter, sans-serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.38;
          color: #d1e4f5;
        `}
        style={{ margin: '20px 10px' }}
      >
        <div>
          Is Anomaly:&nbsp;<b>{data.anomaly ? 'Yes' : 'No'}</b>
        </div>
        <div>Anomaly-Score:&nbsp;{data.anomaly_score == null ? '-' : Utils.decimals(data.anomaly_score)}</div>
      </div>
    );
  });

  memRenderHistogramOnly = memoizeOne((data, width, topHHthreshold) => {
    if (!data) {
      return <div></div>;
    }

    let histData = data;

    let histogramElem = this.memHistogramOnly(histData, width - 2 * 20, topHHthreshold);

    return (
      <div style={{ color: 'white', margin: '20px 10px' }}>
        <div style={{ marginTop: '15px' }}>{histogramElem}</div>
      </div>
    );
  });

  memInitValues = memoizeOne((initActual, initPredicted) => {
    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      if (initPredicted) {
        this.formPredicted.current?.setFieldsValue(initPredicted);
      }
      if (initActual) {
        this.formActual.current?.setFieldsValue(initActual);
      }
    }, 0);
  });

  memRenderForm = (predictData, columns, columnsDisplay: { key: string; dataType: string }[]) => {
    if (columns && columnsDisplay) {
      let res = [],
        resInitialValues = {};

      columns.some((c1: ITableExtColumn, c1ind) => {
        let initV = null;
        if (predictData && _.isString(c1.field)) {
          initV = predictData[c1.field as string];
        }

        let input = null,
          inputName = '',
          inputInitialValue = null;
        let field1 = this.getFieldFromIndex(c1ind);
        let type1 = this.calcTypeFromField(field1);
        if (type1 === 'array') {
          //
        } else if (type1 === 'string' || type1 === 'CATEGORICAL') {
          //
        } else if (type1 === 'number' || type1 === 'numeric' || type1 === 'NUMERICAL') {
          inputName = c1.field as string;
          inputInitialValue = initV;
          input = <InputNumber style={{ width: '100%' }} />;
        } else if (type1 === 'TIMESTAMP') {
          inputName = c1.field as string;
          inputInitialValue = initV;
          input = <DatePicker />;
        } else {
          //
        }
        if (input == null) {
          inputName = c1.field as string;
          inputInitialValue = initV;
          input = <Input />;
        }

        if (inputName != null && inputInitialValue != null) {
          resInitialValues[inputName] = inputInitialValue;
        }
        res.push(
          <Form.Item name={inputName} key={'field_' + c1.field} style={{ marginBottom: 0, marginTop: 0 }} hasFeedback label={<span style={{ color: Utils.colorAall(1) }}>{c1.title}</span>}>
            {input}
          </Form.Item>,
        );
      });

      if (res.length > 0) {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }

          this.formRef.current?.setFieldsValue(resInitialValues);
        }, 0);
        return (
          <FormExt layout={'vertical'} key={uuid.v1()} ref={this.formRef} onFinish={this.handleSubmitForm}>
            {res}
          </FormExt>
        );
      }
    }
  };

  onClickExperiment = (e) => {
    this.setState({
      showGrid: true,
    });
  };

  onClickExperimentClose = (e) => {
    this.setState({
      showGrid: false,
    });
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

  memAddAnomalyColumns = memoizeOne((optionsTestDatasRes) => {
    let columnsDisplay = optionsTestDatasRes ? optionsTestDatasRes.columns : null;
    columnsDisplay = columnsDisplay == null ? [] : [...columnsDisplay];
    columnsDisplay.unshift({ name: 'Anomaly Score', key: 'anomaly_score', dataType: 'categorical' });
    return columnsDisplay;
  });

  render() {
    let { projects, projectId } = this.props;

    let foundProject1 = this.memProjectId(false)(projectId, projects);
    let requestId = this.calcRequestId();

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
    let columnsDisplay: { name: string; key: string; dataType: string }[] = this.memAddAnomalyColumns(optionsTestDatasRes);

    let topHH = 50;

    let columns = this.memColumns(columnsDisplay);

    const borderAAA = Constants.lineColor(); //Utils.colorA(0.3);
    const STYLE = {
      backgroundColor: Constants.navBackDarkColor(),
      // border: '1px solid '+Utils.colorA(0.2),
      outline: 'none',
      overflow: 'hidden',
      fontSize: '14px',
      fontFamily: 'Matter',
    };
    const STYLE_BOTTOM_LEFT_GRID = {
      // borderRight: '1px solid '+borderAAA,
    };
    const STYLE_TOP_LEFT_GRID = {
      borderBottom: '1px solid ' + borderAAA,
      // borderRight: '1px solid '+borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    const STYLE_TOP_RIGHT_GRID = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      textTransform: 'uppercase',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    const STYLE_BOTTOM_RIGHT_GRID = {
      outline: 'none',
      backgroundColor: '#19232f',
    };

    let renderForm = this.memRenderForm(this.state.predictData, columns, columnsDisplay);
    let renderActualRes = this.memRenderActual(this.state.resultActual);
    let renderActual = renderActualRes?.list;
    let renderPredicted = this.memRenderPredicted(this.state.resultPredicted);
    this.memInitValues(renderActualRes?.initialValues, /*renderPredictedRes?.initialValues*/ null);

    const marginGrid = 0;
    const centerWW = 200;

    let gridRowCount = 0;
    if (this.state.resultPredictedGrid?.items != null) {
      gridRowCount = this.state.resultPredictedGrid?.items?.length ?? 0;
      if (gridRowCount > 0) {
        gridRowCount++;
      }
    } else {
      gridRowCount = testDatasList ? (testDatasList.length === 0 ? 0 : testDatasList.length + 1) : 0;
    }

    const onChangeSelectDeployment = (optionSel) => {
      if (!optionSel) {
        return;
      }

      this.setState({
        showGrid: false,
      });

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
      <span style={{ verticalAlign: 'middle', width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <RefreshAndProgress errorMsg={null} isRefreshing={isRefreshing} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <AutoSizer>
            {({ height, width }) => {
              const hh1 = height - topHH;

              const hhEsp = 20;
              let topHHthreshold = Math.min(350, Math.trunc(hh1 / 2));
              // let topHHthresholdGrid = topHHthreshold-30;
              if (!this.state.showGrid) {
                topHHthreshold = 40;
              }
              let topHHthreshold2 = hh1 - topHHthreshold - hhEsp;
              let widthLeft = 357;

              let renderHistogramOnly = !this.state.showGrid ? null : this.memRenderHistogramOnly(this.state.resultPredictedHistogram, width - 350 - hhEsp - 20, topHHthreshold);

              return (
                <div style={{ height: height + 'px', width: width + 'px', position: 'relative' }}>
                  <div className={sd.titleTopHeaderAfter} style={{ height: topHH, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <span onClick={this.onClickExperimentClose} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
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

                  {isRefreshing !== true && this.state.showGrid && (
                    <div style={{ zIndex: 3, position: 'absolute', top: topHH + topHHthreshold + hhEsp + 'px', left: 0, right: 0, bottom: 0, padding: '0 0 0 0' }} className={sd.classGrayPanel}>
                      {false && (
                        <div style={{ textAlign: 'center', paddingTop: '20px', height: topHH + 'px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <span style={{ opacity: 0.8, fontSize: '21px' }}>Click an anomalous point for more details</span>
                        </div>
                      )}

                      <div
                        onMouseLeave={this.onRowMouseLeave}
                        style={{ overflow: 'hidden', borderRadius: '8px', position: 'absolute', top: /*topHH+*/ marginGrid + 'px', left: marginGrid + 'px', right: marginGrid + 'px', height: topHHthreshold2 + 'px' }}
                      >
                        <MultiGrid
                          ref={'gridRef'}
                          cellRenderer={this.cellRenderer}
                          className={s.gridAfter}
                          classNameTopRightGrid={sd.hideScrollbar}
                          classNameTopLeftGrid={sd.hideScrollbar}
                          classNameBottomLeftGrid={sd.hideScrollbar}
                          classNameBottomRightGrid={sd.hideScrollbarY}
                          enableFixedColumnScroll
                          enableFixedRowScroll
                          hideTopRightGridScrollbar
                          hideBottomLeftGridScrollbar
                          fixedRowCount={1}
                          fixedColumnCount={1}
                          overscanRowCount={40}
                          overscanColumnCount={5}
                          style={STYLE}
                          styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                          styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                          styleTopRightGrid={STYLE_TOP_RIGHT_GRID}
                          styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRID}
                          columnCount={(columns ? columns.length : 0) + 1}
                          columnWidth={this.gridColumnWidth}
                          height={topHHthreshold2}
                          rowCount={gridRowCount}
                          rowHeight={cellHH}
                          width={width - marginGrid * 2}
                        />
                      </div>
                    </div>
                  )}

                  {isRefreshing !== true && (
                    <div style={{ position: 'absolute', top: topHH + 'px', left: 0, right: 0, bottom: 0 }}>
                      {this.state.showGrid && (
                        <div style={{ position: 'relative' }}>
                          <div style={{ textAlign: 'center', padding: '4px 0', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', height: topHHthreshold + 'px' }}>
                              <div style={{ flex: '0 0 350px', flexFlow: 'column', display: 'flex', justifyContent: 'stretch', alignItems: 'stretch' }}>
                                <div className={sd.classGrayPanel} style={{ marginBottom: '2px', flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                                  <div style={{ paddingLeft: '36px', textAlign: 'left' }}>
                                    <div
                                      css={`
                                        font-family: Matter, sans-serif;
                                        font-size: 16px;
                                        font-weight: bold;
                                        line-height: 1.38;
                                        color: #d1e4f5;
                                      `}
                                    >
                                      Threshold
                                    </div>
                                    <div>
                                      <span
                                        css={`
                                          font-family: Matter, sans-serif;
                                          font-size: 16px;
                                          font-weight: 600;
                                          line-height: 1.38;
                                          color: #ffffff;
                                        `}
                                        style={{ verticalAlign: 'middle', textAlign: 'right', width: '44px', display: 'inline-block' }}
                                      >
                                        {Utils.decimals(this.state.thresholdDebounce * 100, 1)}
                                      </span>
                                      <span style={{ marginLeft: '22px', display: 'inline-block', width: '240px', verticalAlign: 'middle' }} className={sd.sliderBlue}>
                                        <Slider min={this.state.thresholdMin * 100} step={0.1} max={100} value={this.state.thresholdDebounce * 100} onChange={this.onChangeThreshold} onAfterChange={this.onChangeThresholdAfter} />
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className={sd.classGrayPanel} style={{ flex: 1, whiteSpace: 'nowrap', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                                  <div style={{ paddingLeft: '36px', textAlign: 'left' }}>
                                    <div
                                      css={`
                                        font-family: Matter, sans-serif;
                                        font-size: 16px;
                                        font-weight: bold;
                                        line-height: 1.38;
                                        color: #d1e4f5;
                                      `}
                                    >
                                      Number of Anomalies
                                    </div>
                                    <div
                                      css={`
                                        font-family: Matter, sans-serif;
                                        font-size: 36px;
                                        font-weight: 600;
                                        color: #ffffff;
                                      `}
                                    >
                                      {gridRowCount ? Utils.prettyPrintNumber(gridRowCount - 1) : 0}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className={sd.classGrayPanel} style={{ marginLeft: hhEsp + 'px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <span style={{ height: topHHthreshold - 2 * 20 + 'px', display: 'inline-block', paddingRight: '20px' }}>{renderHistogramOnly}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!this.state.showGrid && (
                        <div className={sd.classGrayPanel} style={{ position: 'absolute', top: topHHthreshold + 'px', left: '10px', width: widthLeft + 'px', bottom: '10px' }}>
                          <div style={{ position: 'absolute', top: 0 + 'px', left: '20px', right: '20px', height: height - topHHthreshold - topHH - 5 + 'px' }}>
                            <NanoScroller onlyVertical>
                              <div>{renderForm}</div>
                            </NanoScroller>
                          </div>
                        </div>
                      )}

                      {!this.state.showGrid && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: topHHthreshold + 'px', width: centerWW + 'px', left: widthLeft + 'px', bottom: '10px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div>
                              <Button className={sd.detailbuttonblue} type={'primary'} onClick={this.doPredictResult} style={{ marginLeft: '5px' }}>
                                Predict
                              </Button>
                            </div>
                            <div style={{ marginTop: '30px' }}>
                              <Button className={sd.detailbuttonblue} type={'primary'} onClick={this.onClickExperiment} style={{ height: '56px' }}>
                                Back to Test Data
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {!this.state.showGrid && (
                        <div className={sd.classGrayPanel} style={{ position: 'absolute', top: topHHthreshold + 'px', width: width - centerWW - widthLeft + 'px', right: '10px', bottom: '10px' }}>
                          <RefreshAndProgress errorMsg={null} isRefreshing={this.state.isRefreshingResult}>
                            <NanoScroller onlyVertical>
                              <div style={{}}>
                                <div
                                  css={`
                                    font-family: Matter, sans-serif;
                                    font-size: 18px;
                                    font-weight: 500;
                                    line-height: 1.78;
                                    color: #ffffff;
                                  `}
                                  style={{ padding: '15px 10px' }}
                                >
                                  Result
                                </div>
                                <div style={{ padding: '7px 10px' }}>
                                  <div
                                    css={`
                                      font-family: Matter, sans-serif;
                                      font-size: 16px;
                                      font-weight: bold;
                                      line-height: 1.38;
                                      color: #d1e4f5;
                                    `}
                                  >
                                    Predicted:
                                  </div>
                                  <div>
                                    <FormExt layout={'vertical'} ref={this.formPredicted}>
                                      {renderPredicted}
                                    </FormExt>
                                  </div>
                                </div>
                                {false && renderActual != null && (
                                  <div style={{ padding: '7px 10px', borderTop: '1px solid ' + Utils.colorA(0.2) }}>
                                    <div style={{ fontWeight: 400, fontSize: '16px' }}>Actual:</div>
                                    <div>
                                      <FormExt layout={'vertical'} ref={this.formActual}>
                                        {renderActual}
                                      </FormExt>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </NanoScroller>
                          </RefreshAndProgress>
                        </div>
                      )}
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
)(ModelPredictionsHistogramTableOne);
