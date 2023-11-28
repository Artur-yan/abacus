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
const s = require('./ModelPredictionsAnomalyTableOne.module.css');
const sd = require('../antdUseDark.module.css');
const RangePicker = DatePicker.RangePicker;

const cellHH = 54;

interface IModelPredictionsAnomalyTableOneProps {
  paramsProp?: any;
  projects?: any;
  requests?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;

  projectId?: string;
}

interface IModelPredictionsAnomalyTableOneState {
  datasetIdSel?: string;

  predictData?: any;
  showGrid?: any;
  resultActual?: any;
  resultPredicted?: any;
  resultPredictedGrid?: any;
  resultPredictedHistogram?: any;
  hoveredRowIndex?: number;
  selectedRowIndex?: number;

  thresholdBounce?: number;
  threshold?: number;
  thresholdMin?: number;
  thresholdMax?: number;

  resultError?: string;
  isRefreshingResult?: boolean;

  dataGrid?: any;
}

const histogramHH = 300;
const histogramWW = 500;

class ModelPredictionsAnomalyTableOne extends React.PureComponent<IModelPredictionsAnomalyTableOneProps & IModelPropsCommon, IModelPredictionsAnomalyTableOneState> {
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
      showGrid: true,
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

    this.memPrediction(optionsTestDatasRes);
    this.memPredictionSelected(optionsTestDatasRes, this.state.selectedRowIndex, this.state.threshold);

    let reqOne = this.memRequestOne(true)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
    if (this.calcRequestId() && this.state.predictData == null && this.lastReqOneUsed !== reqOne) {
      if (reqOne?.query?.data != null) {
        this.lastReqOneUsed = reqOne;
        let data1 = /*Utils.tryJsonParse*/ reqOne?.query?.data;
        if (data1 != null) {
          let th1 = Utils.tryParseFloat(reqOne?.query?.threshold) ?? 0.5;
          this.showPrediction(data1, th1);
        }
      }
    }
  };

  memPredictionSelected = memoizeOne((optionsTestDatasRes, selectedRowIndex, threshold) => {
    let data1 = this.memPredictionSelectedData(optionsTestDatasRes, selectedRowIndex);
    if (this.calcRequestId() != null) {
      return;
    }
    if (data1) {
      this.showPrediction(data1, threshold);
    }
  });

  memPredictionSelectedData = memoizeOne((optionsTestDatasRes, selectedRowIndex) => {
    if (selectedRowIndex != null && selectedRowIndex > 0 && optionsTestDatasRes) {
      let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : [];
      if (optionsTestDatas) {
        let option1 = optionsTestDatas[selectedRowIndex - 1];
        let data1 = optionsTestDatasRes?.rangeDateByTestDataId?.[option1?.value];
        if (data1) {
          return data1;
        }
      }
    }
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

  memPrediction = memoizeOne((optionsTestDatasRes) => {
    if (this.state.isRefreshingResult || !optionsTestDatasRes) {
      return;
    }

    this.memPredictionOnlyData(optionsTestDatasRes);
    if (this.calcRequestId() != null) {
      return;
    }
    this.showPrediction(null);
  });

  componentDidUpdate(prevProps: Readonly<IModelPredictionsAnomalyTableOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsAnomalyTableOneState>, snapshot?: any): void {
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
    if (index === 1) {
      return 120;
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let columnsDisplay: { name: string; key: string; dataType: string }[] = this.memAddAnomalyColumns(optionsTestDatasRes);

    let multiByColumnsCount = 1;
    if (columnsDisplay) {
      if (columnsDisplay.length <= 5) {
        multiByColumnsCount = 2.3;
      }
    }

    let field1 = this.getFieldFromIndex(index - 2);
    if (field1) {
      let type1 = this.calcTypeFromField(field1);

      type1 = type1?.toLowerCase();

      if (type1 === 'array') {
        return Math.ceil(200 * multiByColumnsCount);
      } else if (type1 === 'string' || type1 === 'CATEGORICAL'.toLowerCase()) {
        return Math.ceil(240 * multiByColumnsCount);
      } else if (type1 === 'number' || type1 === 'numeric' || type1 === 'NUMERICAL'.toLowerCase()) {
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

  memColumns = memoizeOne((columnsDisplay: { key: string; name: string; dataType: string }[]) => {
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
      if (data1) {
        if (_.isArray(data1)) {
          data1 = data1[0];
        }
        if (this.props.optionsTestDatasRes?.resultTestDatas?.version === 1) {
          data1['anomaly_score'] = (items?.[row]?.score ?? 0).toFixed(4);
          data1['anomaly_column'] = items?.[row]?.column ?? '-';
        }
        if (data1) {
          let field1 = this.getFieldFromIndex(col);
          let v1 = field1 ? data1[field1.key] : null;

          if (field1.dataType?.toLowerCase() === 'timestamp') {
            v1 = moment(v1).utc().utcOffset(0, true).format('LLL');
          }

          return { value: v1, data1 };
        }
      }
      return { value: '', data1: null };
    };

    let data1 = null;
    if (rowIndex === 0) {
      if (columnIndex === 0) {
        content = '';
      } else if (columnIndex === 1) {
        content = 'Feedback';
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 2);
        content = 'Col: ' + columnIndex;
        if (field1) {
          if (field1) {
            content = field1.name || '-';
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
      } else if (columnIndex === 1) {
        const onClickFeedback = (e) => {
          REActions.addNotification('Feedback received!');
        };

        content = (
          <span
            css={`
              display: flex;
              align-items: center;
            `}
          >
            <span
              onClick={onClickFeedback}
              css={`
                &:hover {
                  background: ${Constants.blue};
                  cursor: pointer;
                }
                width: 28px;
                height: 28px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                display: flex;
                justify-content: center;
                align-items: center;
              `}
            >
              <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faThumbsUp').faThumbsUp} transform={{ size: 18, x: 0, y: 0 }} />
            </span>
            <span
              onClick={onClickFeedback}
              css={`
                &:hover {
                  background: ${Constants.blue};
                  cursor: pointer;
                }
                width: 28px;
                height: 28px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-left: 10px;
              `}
            >
              <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faThumbsDown').faThumbsDown} transform={{ size: 18, x: 0, y: 0 }} />
            </span>
            {/*<span css={`&:hover { background: ${Constants.blue}; cursor: pointer; } width: 28px; height: 28px; background: rgba(255,255,255,0.1); border-radius: 3px; display: flex; justify-content: center; align-items: center; margin-left: 10px;`}>*/}
            {/*  <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faUserTag').faUserTag} transform={{ size: 18, x: 0, y: 0, }} />*/}
            {/*</span>*/}
          </span>
        );
      } else {
        let v1 = getValue(rowIndex - 1, columnIndex - 2);
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
          let field1 = this.getFieldFromIndex(columnIndex - 2);
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
    if (this.state.selectedRowIndex === rowIndex) {
      styleF.backgroundColor = '#346235';
    }

    if (_.isString(content) || _.isNumber(content)) {
      content = <div className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}>{content}</div>;
    }

    return (
      <div key={key} style={styleF} className={s.Cell + ' '} onClick={this.onRowClick.bind(this, data1, rowIndex)} onMouseEnter={this.onRowMouseEnter.bind(this, rowIndex === 0 ? null : rowIndex)}>
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

  onRowClick = (row, rowIndex) => {
    if (this.calcRequestId() != null) {
      return;
    }

    if (row != null) {
      //   this.setState({
      //     showGrid: false,
      //   });
      this.showPrediction(row, this.state.threshold);
    }

    if (rowIndex === 0) {
      rowIndex = null;
    }

    if (rowIndex != null) {
      if (this.state.selectedRowIndex !== rowIndex) {
        this.setState({
          selectedRowIndex: rowIndex,
        });
      }
    }
  };

  showPrediction = (row, threshold = null) => {
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
    let dataParams: any = { data: data1 };
    if (threshold != null) {
      dataParams.threshold = threshold;
    }

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
        if (row == null && !_.isEqual(resultPredictedHistogram, resHisto)) {
          this.setState({
            resultPredictedHistogram: resHisto,
          });
        }
        this.setState({
          resultActual: actual,
          resultError: null,
        });
        let isRequestId = this.calcRequestId() != null;
        if (row == null || isRequestId) {
          let listPredicted = this.props.optionsTestDatasRes?.resultTestDatas?.ids;
          if (isRequestId) {
            listPredicted = null;
            let reqOne = this.memRequestOne(false)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
            if (reqOne != null) {
              let data1 = /*Utils.tryJsonParse*/ reqOne?.query?.data;
              if (data1 != null) {
                listPredicted = [data1];
              }
            }
          }

          let threshold1: number;
          let minThreshold: number;
          let maxThreshold: number;

          if (this.props.optionsTestDatasRes?.resultTestDatas?.version === 2) {
            threshold1 = this.props.optionsTestDatasRes?.resultTestDatas?.threshold;
            minThreshold = this.props.optionsTestDatasRes?.resultTestDatas?.minThreshold;
            maxThreshold = this.props.optionsTestDatasRes?.resultTestDatas?.maxThreshold;
          } else {
            threshold1 = listPredicted?.threshold ?? 0;
            minThreshold = listPredicted?.min_threshold ?? 0;
            maxThreshold = listPredicted?.max_threshold ?? 100;
          }

          let minp = 0;
          let maxp = 100;
          let minv = Math.log(minThreshold);
          let maxv = Math.log(maxThreshold);
          let scale = (maxv - minv) / (maxp - minp);

          threshold1 = (Math.log(threshold1) - minv) / scale + minp;

          this.setState({
            resultPredictedGrid: {
              items: listPredicted ?? [], // TODO - call to predictForUI not required for this - necessary info returned in listTestData
            },
            selectedRowIndex: listPredicted == null || listPredicted.length === 0 ? null : 1,
          });
          if (!isRequestId) {
            this.setState({
              thresholdBounce: threshold1,
              threshold: listPredicted?.threshold ?? minThreshold ?? 0,
              thresholdMin: minThreshold,
              thresholdMax: maxThreshold,
            });
          }
        } else {
          this.setState({
            resultPredicted: res?.result?.predicted,
          });
        }
      }
    });
  };

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
    this.showPrediction(vv, this.state.threshold);
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

  memAddAnomalyColumns = memoizeOne((optionsTestDatasRes) => {
    let columnsDisplay = optionsTestDatasRes ? optionsTestDatasRes.columns : null;
    columnsDisplay = columnsDisplay == null ? [] : [...columnsDisplay];

    if (optionsTestDatasRes?.resultTestDatas?.version === 1) {
      columnsDisplay.unshift({ name: 'Anomaly Column', key: 'anomaly_column', dataType: 'categorical' });
      columnsDisplay.unshift({ name: 'Anomaly Score', key: 'anomaly_score', dataType: 'categorical' });
    }

    return columnsDisplay;
  });

  memRenderChartOnly = memoizeOne((resultPredicted, width, height, columnName) => {
    // TODO - return version number with chart response
    if (resultPredicted?.version === 2 && width) {
      let seriesKeys: string[] = ['y'].concat(resultPredicted?.rawDataSeries?.map((s, i) => 'y' + (i + 1)) ?? []); // [y, y1, y2, ...]
      let seriesLabels: string[] = ['Anomaly Score'].concat(resultPredicted?.rawDataSeries?.map((s) => s.name) ?? []);
      let data: any[] =
        resultPredicted?.timestamps?.map((t, rowIndex) => {
          let result = {
            x: t,
            y: resultPredicted?.anomalyScores?.[rowIndex],
          };
          resultPredicted?.rawDataSeries?.forEach((series: { values: number[] }, seriesIndex) => {
            result[seriesKeys[seriesIndex + 1]] = series?.values?.[rowIndex];
          });
          return result;
        }) ?? [];

      let symbolList = [];
      seriesKeys?.some((s1) => {
        symbolList.push('circle');
      });

      let chartData = {
        topSpace: resultPredicted?.rawDataSeries?.length > 7 ? 30 : 0,
        useUTC: true,
        useTitles: true,
        tooltips: true,
        dateX: true,
        titleX: 'Timestamp',
        titleY: 'Raw data',
        titleY2: 'Anomaly Score',
        seriesY: seriesKeys,
        fieldNameTooltip: seriesLabels,
        useLegendSeriesIndex: true,
        maxDecimalsTooltip: 2,
        data: data,
        axis1Gap: 50,
        axis2Gap: 50,
        axis2type: 'log',
        axisYdecimals: 2,
        useTwoYAxis: [true], //TODO we are forcing first one to be the only one of series Right axis
        tooltipSeriesInvert: true,
        // lineStyleType: [undefined, 'dotted'],
        yAxisMaxList: [undefined, resultPredicted?.maxAnomalyScore], //TODO what happens with other series max?
        yAxisMinList: ['dataMin', undefined],
        useLegend: true,
        symbol: symbolList,
        showSymbolPerc: 0.2,
        dataZoomX: true,
      };

      return (
        <div
          css={`
            width: ${width}px;
            height: ${height}px;
          `}
        >
          <ChartXYExt key={'cha_' + uuid.v1()} useEC startColorIndex={0} colorFixedAndMore={2} colorFixed={['#f82727', '#4e9bde'] as any} width={width} height={height} data={chartData} />
        </div>
      );
    } else if (resultPredicted?.history && width) {
      const history1 = resultPredicted?.history;

      let data = [];
      let originalDataString = 'Original Data';
      let labels = [originalDataString];
      let yy = ['y2'];

      let dataFrom = [history1.raw_values];
      if (history1.raw_values_list != null && history1.raw_values_list.length > 1) {
        dataFrom = history1.raw_values_list;

        yy = [];
        dataFrom?.some((df, dfind) => {
          yy.push('y' + (dfind + 2));
        });

        labels = history1.col_names;
      }

      history1?.timestamps?.some((h1, ind) => {
        let obj1: any = {
          x: history1.timestamps[ind],
          y: history1.anomaly_scores[ind],
        };

        dataFrom?.some((df, dfind) => {
          let yv = 'y' + (dfind + 2);
          if (yy.includes(yv)) {
            obj1[yv] = df[ind];
          }
        });

        data.push(obj1);
      });

      let originalName = originalDataString;

      let max_anomaly_score = resultPredicted?.max_anomaly_score;

      if (labels?.length === 1 && labels[0] === originalDataString) {
        labels[0] = columnName;
        columnName = null;
      }

      //
      let seriesY = ['y', ...yy];
      let labelsY = ['Anomaly Score', ...labels];

      let data1 = {
        topSpace: labels?.length > 7 ? 30 : 0,
        useUTC: true,
        useTitles: true,
        tooltips: true,
        dateX: true,
        titleX: 'Date',
        titleY: originalName,
        titleY2: 'Anomaly Score',
        seriesY,
        fieldNameTooltip: labelsY,
        useLegendSeriesIndex: true,
        maxDecimalsTooltip: 2,
        data: data,
        axis1Gap: 50,
        axis2Gap: 50,
        axis2type: 'log',
        axisYdecimals: 2,
        useTwoYAxis: [true],
        tooltipSeriesInvert: true,
        // lineStyleType: [undefined, 'dotted'],
        yAxisMaxList: [undefined, max_anomaly_score],
        yAxisMinList: ['dataMin', undefined],
        useLegend: true,
        symbol: ['circle', 'circle'],
        showSymbolPerc: 0.2,
        dataZoomX: true,
      };

      const titleHH = 25;

      return (
        <div
          css={`
            width: ${width}px;
            height: ${height}px;
          `}
        >
          {/*<div css={`height: ${titleHH}px; display: flex; justify-content: center; align-items: center; padding-top: 15px; font-size: 14px;`}>*/}
          {/*  {columnName}*/}
          {/*</div>*/}
          <ChartXYExt key={'cha_' + uuid.v1()} useEC startColorIndex={0} colorFixedAndMore={2} colorFixed={['#f82727', '#4e9bde'] as any} width={width} height={height /*-titleHH*/} data={data1} />
        </div>
      );
    }
  });

  onSliderAfterChange = (v1) => {
    let minp = 0;
    let maxp = 100;
    let minv = Math.log(this.state.thresholdMin ?? 0);
    let maxv = Math.log(this.state.thresholdMax ?? 100);
    let scale = (maxv - minv) / (maxp - minp);

    v1 = Math.exp(minv + scale * (v1 - minp));

    this.setState({
      threshold: v1,
    });
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
        <SelectExt isDisabled={this.calcRequestId() != null} value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    let data1 = this.memPredictionSelectedData(optionsTestDatasRes, this.state.selectedRowIndex);
    let columnName1 = data1?.column ?? '';

    let showThreshold = false; //true;
    let showThresholdSlider = false; //true;
    let threshold1 = this.state.threshold;
    if (this.calcRequestId() != null) {
      showThresholdSlider = false;
      let reqOne = this.memRequestOne(false)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
      let th1 = Utils.tryParseFloat(reqOne?.query?.threshold);
      if (th1 == null) {
        showThreshold = false;
      } else {
        threshold1 = th1;
      }
    }

    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <RefreshAndProgress errorMsg={null} isRefreshing={isRefreshing} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <AutoSizer>
            {({ height, width }) => {
              const hh1 = height - topHH;

              let topHHthreshold = Math.trunc((hh1 / 7) * 4); // Math.min(350, Math.trunc(hh1/2));
              // let topHHthresholdGrid = topHHthreshold-30;
              if (!this.state.showGrid) {
                topHHthreshold = 40;
              }
              let topHHthreshold2 = hh1 - topHHthreshold;
              let widthLeft = 357;

              let renderChartOnly = !this.state.showGrid ? null : this.memRenderChartOnly(this.state.resultPredicted, width - 70, topHHthreshold - 60, columnName1);

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
                    <div style={{ zIndex: 3, position: 'absolute', top: topHH + topHHthreshold + 'px', left: 0, right: 0, bottom: 0, padding: '0 0 0 0' }} className={sd.classGrayPanel}>
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
                          columnCount={(columns ? columns.length : 0) + 1 + 1}
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
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', height: topHHthreshold - 20 + 'px' }}>
                              <div className={sd.classGrayPanel} style={{ marginLeft: 5 + 'px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                <div style={{ height: topHHthreshold - 60 - 2 * 12 - 25 + 'px', display: 'flex' }}>{renderChartOnly}</div>

                                {showThreshold && (
                                  <div
                                    css={`
                                      width: 480px;
                                      ${showThresholdSlider ? '' : 'justify-content: center;'} margin: 55px auto 0;
                                      display: flex;
                                      align-items: center;
                                    `}
                                  >
                                    <span
                                      css={`
                                        font-size: 13px;
                                      `}
                                    >
                                      Threshold:
                                    </span>
                                    <span
                                      css={`
                                        width: 80px;
                                        text-align: left;
                                        margin-left: 5px;
                                      `}
                                    >
                                      {Utils.decimals(threshold1, 3)}
                                    </span>
                                    {showThresholdSlider && (
                                      <span
                                        css={`
                                          width: 80px;
                                          text-align: right;
                                          margin-right: 5px;
                                        `}
                                      >
                                        {Utils.decimals(this.state.thresholdMin, 3)}
                                      </span>
                                    )}
                                    {showThresholdSlider && (
                                      <span
                                        css={`
                                          flex: 1;
                                        `}
                                      >
                                        <Slider
                                          disabled={this.calcRequestId() != null}
                                          tooltipVisible={false}
                                          onAfterChange={this.onSliderAfterChange}
                                          min={0}
                                          max={100}
                                          value={this.state.thresholdBounce}
                                          onChange={(v1) => {
                                            this.setState({ thresholdBounce: v1 });
                                          }}
                                        />
                                      </span>
                                    )}
                                    {showThresholdSlider && (
                                      <span
                                        css={`
                                          width: 80px;
                                          text-align: left;
                                          margin-left: 5px;
                                        `}
                                      >
                                        {Utils.decimals(this.state.thresholdMax, 3)}
                                      </span>
                                    )}
                                  </div>
                                )}
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
)(ModelPredictionsAnomalyTableOne);
