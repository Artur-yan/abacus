import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TableSortLabel from '@mui/material/TableSortLabel';
import Button from 'antd/lib/button';
import DatePicker from 'antd/lib/date-picker';
import { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Popover from 'antd/lib/popover';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
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
import { calcDeploymentsByProjectId } from '../../stores/reducers/deployments';
import { memProjectById } from '../../stores/reducers/projects';
import requests from '../../stores/reducers/requests';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import { IModelPropsCommon } from '../ModelPredictionCommon/ModelPredictionCommon';
import { FilterOne } from '../ModelPredictionsRegressionOne/ModelPredictionsRegressionOne';
import { intRowIndex, isEqualAllSmart } from '../ModelPredictionsRegressionOne/PredEqualSmart';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./ModelPredictionsSentimentOne.module.css');
const sd = require('../antdUseDark.module.css');
const RangePicker = DatePicker.RangePicker;

const cellHH = 54;
const sepArray = '___###___';

interface IModelPredictionsSentimentOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;
  deployments?: any;
  requests?: any;

  projectId?: string;
  isNlpTextClassification?: boolean;
}

interface IModelPredictionsSentimentOneState {
  datasetIdSel?: string;
  selectedFieldValueId?: string;

  inputValue?: any;
  dataGridList?: any;
  dataGridListFiltered?: any;
  sortByField?: any;
  sortOrderIsAsc?: any;
  predictData?: any;
  resultActual?: any;
  resultPredicted?: { type?: string; values?: { [key: string]: number } };
  resultError?: string;
  isRefreshingResult?: boolean;
  hoveredRowIndex?: number;
  filterValuesPopoverVisible?: boolean;
  filterValues?: { fieldIndex?: number; value?: any }[];

  showGrid?: boolean;
}

class ModelPredictionsSentimentOne extends React.PureComponent<IModelPredictionsSentimentOneProps & IModelPropsCommon, IModelPredictionsSentimentOneState> {
  private unDark: any;
  private isM: boolean;
  private lastProjectId?: string;
  private lastCallPredictData: any;
  private dontusePrefix: any;
  formPredicted = React.createRef<FormInstance>();
  formActual = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshingResult: false,
      showGrid: false,
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

  componentDidUpdate(prevProps: Readonly<IModelPredictionsSentimentOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsSentimentOneState>, snapshot?: any) {
    this.doMem();
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

  lastReqOneUsed = null;
  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let { projects, projectId } = this.props;

    let foundProject1 = this.memProjectId(true)(projectId, projects);

    this.memModelChanged(this.props.selectedAlgoId);

    this.memDeployOne(true)(this.props.deployments, projectId, this.props.selectedAlgoId);

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

    let reqOneBP = this.memBPData(true)(this.props.requests, this.calcRequestBPId(), this.calcRequestBPIdVersion());
    if (this.calcRequestBPId() != null && this.state.predictData == null && this.lastReqOneUsed !== reqOneBP) {
      this.lastReqOneUsed = reqOneBP;
      let data1 = /*Utils.tryJsonParse*/ reqOneBP?.input;
      if (data1 != null) {
        this.showPrediction(data1);
      }
    }
  };

  memBPData = memoizeOneCurry((doCall, requestsParam, requestBPId, batchPredictionVersion) => {
    return requests.memRequestBPById(doCall, undefined, batchPredictionVersion, requestBPId ?? 0);
  });

  calcRequestId = () => {
    let requestId = this.props.paramsProp?.get('requestId');
    if (requestId === '') {
      requestId = null;
    }
    return requestId;
  };

  calcRequestBPId = () => {
    return Utils.tryParseInt(this.props.paramsProp?.get('requestBPId')?.split('_')?.[0]);
  };

  calcRequestBPIdVersion = () => {
    return this.props.paramsProp?.get('requestBPId')?.split('_')?.[1];
  };

  memRequestOne = memoizeOneCurry((doCall, requestsParam, deployId, requestId) => {
    return requests.memRequestById(doCall, undefined, deployId, requestId);
  });

  lastSelectedAlgoId = null;
  memModelChanged = memoizeOne((selectedAlgoId) => {
    if (selectedAlgoId && this.lastSelectedAlgoId !== selectedAlgoId) {
      this.setState({
        predictData: null,
        resultActual: null,
        resultPredicted: null,
        resultError: null,
      });
    }
    this.lastSelectedAlgoId = selectedAlgoId;
  });

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
    if (index === 1) {
      if (this.props.isNlpTextClassification) {
        return 180;
      }
      return 110;
    }

    if (this.props.isNlpTextClassification) {
      return 700;
    }

    let field1 = this.getFieldFromIndex(index - 2);
    if (field1) {
      let type1 = this.calcTypeFromField(field1);

      if (type1 === 'array') {
        return 200;
      } else if (type1 === 'string' || type1 === 'CATEGORICAL') {
        return 240;
      } else if (type1 === 'number' || type1 === 'numeric' || type1?.toUpperCase() === 'NUMERICAL') {
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

  onClickSetFilter = (columnIndex, value, e) => {
    let ff = [...(this.state.filterValues ?? [])];

    let f1 = ff.find((v1) => v1.fieldIndex === columnIndex);
    if (f1 == null) {
      ff.push({
        fieldIndex: columnIndex,
        value: value,
      });
    } else {
      f1.value = value;
    }
    ff = ff.filter((v1) => !Utils.isNullOrEmpty(v1.value));

    let notFilters = (ff?.length ?? 0) === 0;

    let dataGridListFiltered = null;
    if (!notFilters) {
      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
      let list = testDatasList;
      if (this.state.dataGridList) {
        list = this.state.dataGridList;
      }
      list.some((d1, d1ind) => {
        if (d1[intRowIndex] == null) {
          d1[intRowIndex] = d1ind;
        }
      });
      dataGridListFiltered = list.filter((v1) => {
        let res = true;
        ff?.some((f1) => {
          let value;
          if (f1.fieldIndex === 1) {
            value = optionsTestDatasRes.resultTestDatas?.ids?.[v1[intRowIndex]]?.actual;
          } else {
            let field1 = this.getFieldFromIndex(f1.fieldIndex - 2);
            if (field1?.key) {
              value = v1?.[field1.key];
            }
          }

          if (_.isNumber(value)) {
            let n1 = _.isNumber(f1.value) ? f1.value : Utils.tryParseFloat(f1.value);
            if (n1 != null) {
              if (value !== n1) {
                res = false;
              }
            }
          } else {
            value = '' + value;
            value = value.toLowerCase();
            if (value.indexOf(('' + f1.value).toLowerCase()) === -1) {
              res = false;
            }
          }
        });
        return res;
      });
    }

    this.setState({
      filterValues: ff,
      filterValuesPopoverVisible: null,
      dataGridListFiltered,
    });
  };

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

      if (this.state.dataGridList != null) {
        testDatasList = this.state.dataGridList;
      }
      if (this.state.dataGridListFiltered != null) {
        testDatasList = this.state.dataGridListFiltered;
      }

      if (testDatasList) {
        let data1 = testDatasList[row];
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            if (col == null) {
              let actual1 = optionsTestDatasRes.resultTestDatas?.ids?.[data1?.[intRowIndex] ?? row]?.actual;
              return { value: '', data1, actual: actual1 };
            } else {
              let field1 = this.getFieldFromIndex(col);
              return { value: field1 ? data1[field1.key] : null, data1 };
            }
          }
        }
      }
      return { value: '', data1: null };
    };

    let isSortType = false;
    let data1 = null;
    if (rowIndex === 0) {
      if (columnIndex === 0) {
        content = '';
      } else if (columnIndex === 1) {
        content = 'Target';

        if (!this.props.isNlpTextClassification) {
          let pred1 = this.state.resultPredicted;
          if (pred1 != null) {
            if (_.isArray(pred1)) {
              pred1 = pred1[0];
            }
            if (_.isObject(pred1)) {
              let kk = Object.keys(pred1);
              if (kk != null && kk.length > 0) {
                content = kk[0];
              }
            }
          }
        }
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 2);
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

      if (columnIndex > 0) {
        if (content != null && content !== '') {
          let alreadyFilter = false;
          if (this.state.filterValues != null && !Utils.isNullOrEmpty(this.state.filterValues.find((v1) => v1.fieldIndex === columnIndex)?.value)) {
            alreadyFilter = true;
          }

          let overlayFilter = (
            <div>
              <FilterOne
                defaultValue={() => {
                  let res = '';

                  let ff = this.state.filterValues;
                  if (ff != null) {
                    let f1 = ff.find((v1) => v1.fieldIndex === columnIndex);
                    if (f1 != null) {
                      res = f1.value ?? '';
                    }
                  }

                  return res;
                }}
                onClear={this.onClickSetFilter.bind(this, columnIndex, '')}
                onCancel={() => {
                  this.setState({ filterValuesPopoverVisible: null });
                }}
                onSet={this.onClickSetFilter.bind(this, columnIndex)}
              />
            </div>
          );

          const popupContainerForMenu = (node) => document.getElementById('body2');
          let filter1 = (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <TooltipExt title={'Attribute Search'}>
                <Popover
                  destroyTooltipOnHide={true}
                  open={this.state.filterValuesPopoverVisible === columnIndex}
                  onOpenChange={(isV) => {
                    this.setState({ filterValuesPopoverVisible: isV ? columnIndex : null });
                  }}
                  placement={'bottom'}
                  overlayClassName={sd.popback}
                  getPopupContainer={popupContainerForMenu}
                  content={overlayFilter}
                  trigger={['click']}
                >
                  <span
                    css={`
                      opacity: 0.64;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                  >
                    <FontAwesomeIcon
                      icon={require('@fortawesome/pro-solid-svg-icons/faFilter').faFilter}
                      transform={{ size: 18, x: 0, y: 0 }}
                      style={{ marginLeft: '7px', cursor: 'pointer', color: alreadyFilter ? Constants.blue : 'white' }}
                    />
                  </span>
                </Popover>
              </TooltipExt>
            </span>
          );

          let sortByField = this.state.sortByField;
          isSortType = true;
          content = (
            <TableSortLabel active={sortByField === columnIndex} direction={this.state.sortOrderIsAsc ? 'asc' : 'desc'} onClick={this.onSortHeaderClick.bind(this, columnIndex)}>
              {content}
              {filter1}
            </TableSortLabel>
          );
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
        let vdata = getValue(rowIndex - 1, 1);
        if (vdata) {
          data1 = vdata.data1;
        }
        let v1 = getValue(rowIndex - 1, null);
        content = v1?.actual ?? '';
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
          let field1 = this.getFieldFromIndex(columnIndex - 1);
          if (field1) {
            let dataType = this.calcTypeFromField(field1);
            if (dataType === 'TIMESTAMP') {
              let dt1 = moment(content);
              if (dt1.isValid()) {
                content = dt1.format('YYYY-MM-DD HH:mm:ss');
              }
            } else if (['number', 'float', 'numeric', 'NUMERICAL', 'numerical'].includes(dataType)) {
              content = Utils.roundDefault(content);
            }
          }
        }
      }
    }

    let styleF = _.assign({}, style || {}, { overflow: 'hidden', padding: '0 3px', cursor: rowIndex === 0 ? '' : 'pointer' } as CSSProperties);
    styleF.backgroundColor = rowIndex === 0 ? '#23305e' : '#19232f';
    styleF.borderBottom = '1px solid #0b121b';
    if (this.state.hoveredRowIndex === rowIndex) {
      styleF.backgroundColor = '#284192';
      styleF.cursor = 'pointer';
    }

    if (_.isString(content) || _.isNumber(content)) {
      content = <div className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}>{content}</div>;
    } else if (_.isArray(content) || _.isObject(content)) {
      if (!Utils.isElement(content)) {
        content = '[Object]';
      }
    }

    return (
      <div key={key} style={styleF} className={s.Cell + ' '} onClick={isSortType ? null : this.onRowClick.bind(this, data1)} onMouseEnter={this.onRowMouseEnter.bind(this, rowIndex === 0 ? null : rowIndex)}>
        {content}
      </div>
    );
  };

  onSortHeaderClick = (columnIndex, e) => {
    let sortOrderIsAsc = this.state.sortOrderIsAsc;
    if (columnIndex === this.state.sortByField) {
      sortOrderIsAsc = !sortOrderIsAsc;
    } else {
      sortOrderIsAsc = true;
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    if (testDatasList) {
      const getValue = (row?, columnIndex?) => {
        let data1 = row;
        if (data1) {
          if (_.isArray(data1)) {
            data1 = data1[0];
          }
          if (data1) {
            if (columnIndex === 1) {
              let actual1 = optionsTestDatasRes.resultTestDatas?.ids?.[row[intRowIndex]]?.actual;
              return { value: actual1, data1, actual: actual1 };
            } else {
              let field1 = this.getFieldFromIndex(columnIndex - 2);
              return { value: field1 ? data1[field1.key] : null, data1 };
            }
          }
        }
      };

      testDatasList = testDatasList.map((d1, d1ind) => {
        d1[intRowIndex] = d1ind;
        return d1;
      });

      const sortDo = (list) => {
        return list?.sort((a, b) => {
          let va = getValue(a, columnIndex)?.value;
          let vb = getValue(b, columnIndex)?.value;

          if (_.isString(va) || _.isString(vb)) {
            va = va == null ? '' : '' + va;
            vb = vb == null ? '' : '' + vb;
          } else if (_.isNumber(va) || _.isNumber(vb)) {
            va = va == null ? 0 : va;
            vb = vb == null ? 0 : vb;
          }

          let asc1 = sortOrderIsAsc ? 1 : -1;
          if (va == null || vb == null) {
            return 0;
          } else if (_.isNumber(va) && _.isNumber(vb)) {
            if (va === vb) {
              return 0;
            } else if (va < vb) {
              return -1 * asc1;
            } else {
              return asc1;
            }
          } else {
            let va2 = _.trim('' + va).toLowerCase();
            let vb2 = _.trim('' + vb).toLowerCase();
            if (va2 === vb2) {
              return 0;
            } else {
              return va2.localeCompare(vb2) * asc1;
            }
          }
        });
      };

      let listSorted = sortDo(testDatasList);
      let dataGridListFiltered = sortDo(this.state.dataGridListFiltered);

      this.setState({
        sortByField: columnIndex,
        sortOrderIsAsc,
        dataGridList: listSorted,
        dataGridListFiltered: dataGridListFiltered,
      });

      this.forceUpdate();
    }
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
    this.setState({
      showGrid: false,
      hoveredRowIndex: null,
    });
    this.showPrediction(row);
  };

  lastUsedPredRow = null;
  showPrediction = (row, force = false) => {
    if (row == null) {
      return;
    }

    if (!force) {
      if (this.lastUsedPredRow != null && _.isEqual(this.lastUsedPredRow, row)) {
        return;
      }
    }
    this.lastUsedPredRow = row;

    if (row != null) {
      row = { ...row };
      delete row[intRowIndex];
    }

    this.setState({
      inputValue: row?.document ?? '',
      predictData: row,
      isRefreshingResult: true,
      resultActual: null,
      resultPredicted: null,
      resultError: null,
    });

    this.lastCallPredictData = uuid.v1();

    if (row != null) {
      row = { ...row };
      const kk = Object.keys(row ?? {});
      kk.some((k1) => {
        if (row[k1] === '') {
          delete row[k1];
        }
      });
    }

    let uuid1 = this.lastCallPredictData;
    let dataParams: any = { data: JSON.stringify(row) };

    let extraParams: any = null;
    REClient_.client_()._predictForUI(this.props.selectedAlgoId, dataParams, extraParams, this.calcRequestId(), (err, res) => {
      if (this.lastCallPredictData !== uuid1) {
        return;
      }

      this.setState({
        isRefreshingResult: false,
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
        //
        let actual = null;

        let optionsTestDatasRes = this.props.optionsTestDatasRes;
        let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
        let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
        let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;
        if (testDatasList && columnsDisplay) {
          let isEqualAll = (data1, data2) => {
            let kk = columnsDisplay.map((c1) => c1.key);
            if ('id' in kk) {
              // @ts-ignore
              kk.unshift('id');
            }
            if ('Id' in kk) {
              // @ts-ignore
              kk.unshift('Id');
            }
            if ('ID' in kk) {
              // @ts-ignore
              kk.unshift('ID');
            }

            let res = true;
            kk.some((k1) => {
              if (!Utils.isNullOrEmpty(data1[k1]) || !Utils.isNullOrEmpty(data2[k1])) {
                res = data1[k1] === data2[k1];
                if (!res) {
                  return true;
                }
              }
            });
            return res;
          };

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
                    if (predictedOne?.result != null && predictedOne?.all_labels != null) {
                      predictedOne = predictedOne?.result;
                    }

                    let key1 = 'value';
                    if (predictedOne && _.isArray(predictedOne) && predictedOne.length > 0) {
                      let kk = Object.keys(predictedOne[0]);
                      if (kk && kk.length > 0) {
                        key1 = kk[0];
                      }
                    } else if (predictedOne && _.isObject(predictedOne) && !_.isEmpty(predictedOne)) {
                      let kk = Object.keys(predictedOne);
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
          resultActual: actual,
          resultPredicted: res?.result,
          resultError: null,
        });
      }
    });
  };

  memTestDatas = memoizeOne((optionsTestDatasRes, lastSelectedAlgoId) => {
    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
    if (this.state.selectedFieldValueId == null || (optionsTestDatas && optionsTestDatas.length > 0 && optionsTestDatas.find((o1) => o1.value === this.state.selectedFieldValueId) == null)) {
      if (optionsTestDatas && optionsTestDatas.length > 0) {
        setTimeout(() => {
          this.setState(
            {
              sortByField: null,
              sortOrderIsAsc: false,
              dataGridList: null,
              selectedFieldValueId: optionsTestDatas[0].value,
            },
            () => {
              this.refreshUrlWithParams();
            },
          );
        }, 0);
      }
    }

    if (this.state.predictData == null || _.isEmpty(this.state.predictData)) {
      if (this.calcRequestId() == null && this.calcRequestBPId() == null) {
        let optionsTestDatasRes = this.props.optionsTestDatasRes;
        let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
        if (testDatasList) {
          let data1 = testDatasList[0];
          if (data1) {
            if (_.isArray(data1)) {
              data1 = data1[0];
            }
            if (data1) {
              setTimeout(() => {
                this.showPrediction(data1, true);
              }, 0);
            }
          }
        }
      }
    }
  });

  doPredictAPI = (e) => {
    let { vv, useDataId } = this.calcDataFromListTestDatas();

    if (useDataId == null) {
      REClient_.dataForPredAPI = vv;
    }

    let projectId = this.props.paramsProp?.get('projectId');
    let deployId = this.props.paramsProp?.get('deployId');
    Location.push('/' + PartsLink.deploy_predictions_api + '/' + projectId + '/' + deployId, undefined, 'fromPredDash=true&useDataId=' + encodeURIComponent(useDataId ?? ''));
  };

  doPredictResult = (e) => {
    this.lastUsedPredRow = null;
    this.showPrediction({ document: this.state.inputValue ?? '' }, true);
  };

  processValues = (values) => {
    let vv = _.assign({}, values);
    let kk = Object.keys(vv);
    kk.some((k1) => {
      if (k1.indexOf(sepArray) > -1) {
        let ss = k1.split(sepArray);
        let values0 = vv;
        ss.some((s1, s1ind) => {
          let isArray = false;
          if (_.startsWith(s1, '[-[')) {
            s1 = s1.substring('[-['.length);
            isArray = true;
          }
          if (_.startsWith(s1, '[[[')) {
            s1 = s1.substring('[[['.length);
            let arrInd = Utils.tryParseInt(s1);
            values0[arrInd] = values0[arrInd] ?? {};
            values0 = values0[arrInd];
            return false;
          }

          if (s1ind === ss.length - 1) {
            values0[s1] = vv[k1];
          } else {
            if (values0[s1] == null) {
              values0[s1] = isArray ? [] : {};
            }
            values0 = values0[s1];
          }
        });
        delete vv[k1];
      }
    });

    return vv;
  };

  handleSubmitForm = (values) => {
    if (this.calcRequestId()) {
      return;
    }

    let vv = this.processValues(values);

    this.showPrediction(vv);
  };

  memRenderActual = memoizeOne((data) => {
    return null;
  });

  memRenderPredicted = memoizeOne((data, isNlpTextClassification) => {
    let type1 = data?.type?.toLowerCase();
    let values1 = { ...(data?.[isNlpTextClassification ? 'predicted' : 'values'] ?? {}) };

    if (type1 === 'valence') {
      const VALENCE_LABELS = ['negative', 'neutral', 'positive'];
      let data1 = [],
        seriesY = [];
      VALENCE_LABELS.some((s1) => {
        let s1found = Object.keys(values1 ?? {}).find((s2) => s2?.toLowerCase() === s1);
        let v1 = values1?.[s1found];
        if (v1 != null) {
          seriesY.push(s1found);
          data1.push({ [s1found]: Utils.decimals(v1, 3), x: '' });
          delete values1[s1found];
        }
      });
      Object.keys(values1 ?? {}).some((k1) => {
        seriesY.push(k1);
        data1.push({ [k1]: Utils.decimals(values1[k1], 3), x: '' });
      });

      let dataRoot: any = {
        data: data1,
        useLegend: true,
        labels: seriesY,
        tooltips: true,
        seriesY,
        gridContainLabel: true,
        axis1type: 'category',
        axis1typeData: [''],
        barXValues: null,
        dateAxisType: 'value',
      };

      let colors = ColorsGradients.map((c1) => c1?.from) as string[];
      colors.unshift('#55b667');
      colors.unshift('#f3ae3d');
      colors.unshift('#e96471');
      return <ChartXYExt useEC colorIndex={0} height={160} colorFixed={colors} data={dataRoot} type={'barstack'} noGrid />;
    }

    if (type1 === 'emotion' || isNlpTextClassification) {
      let data1 = [],
        labels1 = [];
      Object.keys(values1 ?? {}).some((k1) => {
        data1.push({ [k1]: Utils.decimals(values1[k1], 3), x: '' });
        labels1.push(k1);
      });

      // let dataRoot: any = {
      //   data: data1,
      //   useLegend: true,
      //   // labels1,
      //   tooltips: true,
      // };
      let dataRoot: any = {
        data: data1,
        useLegend: true,
        labels: labels1,
        tooltips: true,
        seriesY: labels1,
        gridContainLabel: true,
        axis1type: 'category',
        axis1typeData: [''],
        // barXValues: null,
        dateAxisType: 'value',
        useTitles: true,
        titleY: '',
        titleX: '',
      };

      let colors = ColorsGradients.map((c1) => c1?.from) as string[];
      return <ChartXYExt useEC colorIndex={0} height={600} colorFixed={colors} data={dataRoot} type={'barhor'} />;
      // return <ChartXYExt axisYMin={0} useEC colorIndex={0} height={500} colorFixed={colors} data={dataRoot} type={'barhor'} />;
    }
    return null;
  });

  onClickExperimentClose = (e) => {
    this.setState({
      showGrid: false,
      hoveredRowIndex: null,
    });
  };

  onClickExperiment = (e) => {
    this.setState({
      showGrid: true,
      hoveredRowIndex: null,
    });
  };

  onClickClearFilters = (e) => {
    this.setState({
      filterValues: [],
      dataGridListFiltered: null,
    });
  };

  memDeployOne = memoizeOneCurry((doCall, deployments, projectId, deployId) => {
    if (deployments && !Utils.isNullOrEmpty(projectId) && !Utils.isNullOrEmpty(deployId)) {
      let listByProjectId = calcDeploymentsByProjectId(undefined, projectId);
      if (listByProjectId == null) {
        if (deployments.get('isRefreshing') !== 0) {
          return;
        }

        if (doCall) {
          StoreActions.deployList_(projectId);
        }
      } else {
        return listByProjectId.find((d1) => d1.deploymentId === deployId);
      }
    }
  });

  calcDataFromListTestDatas: () => { vv; useDataId } = () => {
    let vv = { document: this.state.inputValue ?? '' };

    let useDataId = null;
    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;
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
            if (all1 && vv && isEqualAllSmart(data1, vv)) {
              useDataId = all1.id;
              return true;
            }
          }
        }
      });
    }

    return { vv, useDataId };
  };

  render() {
    let { projects, projectId } = this.props;

    const requestId = this.calcRequestId();
    const requestBPId = this.calcRequestBPId();

    let foundProject1 = this.memProjectId(false)(projectId, projects);

    let isRefreshing = false;
    if (projects) {
      isRefreshing = projects.get('isRefreshing');
    }
    if (!foundProject1) {
      isRefreshing = true;
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let optionsAlgo = this.props.optionsAlgo;
    let algoSelectValue = null;
    if (this.props.selectedAlgoId) {
      algoSelectValue = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;

    this.memTestDatas(optionsTestDatasRes, this.lastSelectedAlgoId);

    const topHH = 50;

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
      // textTransform: 'uppercase',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    const STYLE_BOTTOM_RIGHT_GRID = {
      outline: 'none',
      backgroundColor: '#19232f',
    };

    let renderActualRes = this.memRenderActual(this.state.resultActual);
    let renderActual = renderActualRes?.list;
    let renderPredicted = this.memRenderPredicted(this.state.resultPredicted, this.props.isNlpTextClassification);

    const marginGrid = 30;
    const centerWW = 180;

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
      <span style={{ width: '440px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
        <SelectExt isDisabled={requestId != null || requestBPId != null} value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    const leftWidth = 367,
      bottomButtonsHH = 44;

    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <RefreshAndProgress errorMsg={null} isRefreshing={isRefreshing}>
          <AutoSizer>
            {({ height, width }) => {
              return (
                <div style={{ height: height + 'px', width: width + 'px' }}>
                  <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
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

                  {isRefreshing !== true && (
                    <div style={{ display: this.state.showGrid ? 'block' : 'none', zIndex: 3, position: 'absolute', top: topAfterHeaderHH + 'px', left: 0, right: 0, bottom: 0, padding: '0 0 0 0' }} className={sd.grayPanel}>
                      <div style={{ textAlign: 'center', paddingTop: '20px', height: topHH + 'px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ opacity: 0.8, fontSize: '21px' }}>Click a test row to generate predictions</span>
                        <span
                          css={`
                            font-size: 21px;
                            cursor: pointer;
                            margin-left: 15px;
                            color: ${Constants.blue};
                          `}
                          onClick={this.onClickClearFilters}
                        >
                          (Clear all filters)
                        </span>
                      </div>

                      <div
                        onMouseLeave={this.onRowMouseLeave}
                        style={{ position: 'absolute', top: topHH + marginGrid + 'px', left: marginGrid + 'px', right: marginGrid + 'px', height: height - topAfterHeaderHH - topHH - marginGrid * 2 + 'px' }}
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
                          height={height - topAfterHeaderHH - topHH - marginGrid * 2}
                          rowCount={(this.state.dataGridListFiltered?.length ?? (testDatasList ? testDatasList.length : 0)) + 1}
                          rowHeight={cellHH}
                          width={width - marginGrid * 2}
                        />
                      </div>
                    </div>
                  )}

                  {isRefreshing !== true && (
                    <div style={{ display: !this.state.showGrid ? 'block' : 'none', position: 'absolute', top: topHH + 'px', left: 0, right: 0, bottom: 0 }}>
                      <div className={sd.classGrayPanel} style={{ position: 'absolute', top: '15px', left: '10px', width: leftWidth + 'px', height: height - topAfterHeaderHH - 10 + 'px' }}>
                        <div
                          css={`
                            & .ant-input {
                              position: absolute !important;
                              top: 15px;
                              height: calc(100% - 25px) !important;
                              left: 0;
                              right: 0;
                              resize: none;
                            }
                          `}
                          style={{ position: 'absolute', top: 0 /*topHH*/ + 'px', left: '10px', right: '10px', height: height - topAfterHeaderHH - 5 - 10 + 'px' }}
                        >
                          <Input.TextArea
                            value={this.state.inputValue}
                            onChange={(e) => {
                              this.setState({ inputValue: e.target.value });
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ position: 'absolute', bottom: '10px', top: 10 + 'px', left: leftWidth + 'px', width: centerWW + 'px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          {requestBPId == null && requestId == null && (
                            <Button
                              css={`
                                display: inline-block;
                              `}
                              type={'primary'}
                              onClick={this.doPredictResult}
                              style={{}}
                            >
                              Predict
                            </Button>
                          )}
                          {requestBPId == null && requestId == null && (
                            <Button
                              css={`
                                display: inline-block;
                                margin-bottom: 10px;
                              `}
                              type={'primary'}
                              onClick={this.onClickExperiment}
                              style={{ marginLeft: '5px', height: '50px', marginTop: '15px' }}
                            >
                              Experiment
                              <br />
                              with Test Data
                            </Button>
                          )}
                          {requestBPId == null && requestId == null && (
                            <div
                              css={`
                                border-top: 1px solid rgba(255, 255, 255, 0.16);
                                padding-top: 20px;
                                margin: 10px 30px 0;
                              `}
                            >
                              <Button
                                css={`
                                  display: inline-block;
                                  height: 50px;
                                `}
                                type={'primary'}
                                onClick={this.doPredictAPI}
                                style={{}}
                              >
                                Prediction
                                <br />
                                API
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ position: 'absolute', top: '10px', left: leftWidth + centerWW + 'px', right: '10px', bottom: '10px' }}>
                        <RefreshAndProgress errorMsg={null} isRefreshing={this.state.isRefreshingResult}>
                          <NanoScroller onlyVertical>
                            <div style={{}}>
                              <div className={sd.classGrayPanel} style={{ marginTop: '10px', padding: '17px 20px' }}>
                                <div
                                  css={`
                                    font-family: Matter;
                                    font-size: 16px;
                                    font-weight: bold;
                                    line-height: 1.38;
                                    color: #d1e4f5;
                                  `}
                                  style={{}}
                                >
                                  Predicted
                                </div>
                                <div>
                                  <FormExt layout={'vertical'} ref={this.formPredicted}>
                                    {renderPredicted}
                                  </FormExt>
                                </div>
                              </div>
                              {renderActual != null && (
                                <div className={sd.classGrayPanel} style={{ padding: '17px 20px 20px', marginTop: '10px' }}>
                                  <div
                                    css={`
                                      font-family: Matter;
                                      font-size: 16px;
                                      font-weight: bold;
                                      line-height: 1.38;
                                      color: #d1e4f5;
                                    `}
                                  >
                                    Actual
                                  </div>
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
    deployments: state.deployments,
    requests: state.requests,
  }),
  null,
)(ModelPredictionsSentimentOne);
