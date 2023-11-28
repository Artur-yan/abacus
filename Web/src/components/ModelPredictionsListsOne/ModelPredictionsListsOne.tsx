import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import DatePicker from 'antd/lib/date-picker';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment';
import querystring from 'query-string';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { memProjectById } from '../../stores/reducers/projects';
import requests from '../../stores/reducers/requests';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import { IModelPropsCommon, PredictionDisplayType } from '../ModelPredictionCommon/ModelPredictionCommon';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ITableExtColumn } from '../TableExt/TableExt';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
const s = require('./ModelPredictionsListsOne.module.css');
const sd = require('../antdUseDark.module.css');
const RangePicker = DatePicker.RangePicker;

const cellHH = 54;

interface IModelPredictionsListsOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;
  requests?: any;

  allowChangeDisplayType?: boolean;
  onChangeDisplayType?: (dispalyType: PredictionDisplayType) => void;
  projectId?: string;
}

interface IModelPredictionsListsOneState {
  datasetIdSel?: string;
  selectedFieldValueId?: string;
  selectedFieldValueId2?: string;
  selectedFieldValueId2Bounce?: string;
  forceUserIdRequest?: string;
  forceItemIdRequest?: string;

  predictData?: any;
  resultHistory?: any;
  resultActual?: any;
  resultPredicted?: any;
  resultError?: string;
  isRefreshingResult?: boolean;
  hoveredRowIndexR?: number;
  hoveredRowIndexL?: number;

  showGrid?: boolean;
  isViewList?: boolean;
  manualVal?: string;
}

class ModelPredictionsListsOne extends React.PureComponent<IModelPredictionsListsOneProps & IModelPropsCommon, IModelPredictionsListsOneState> {
  private unDark: any;
  private isM: boolean;
  private lastProjectId?: string;
  private lastCallPredictData: any;
  private dontusePrefix: any;
  formRef = React.createRef<FormInstance>();
  cellRendererL: any;
  cellRendererR: any;
  lastReqOneUsed: any;

  constructor(props) {
    super(props);

    let { paramsProp } = props;

    let calcParam = (name, isDate = false) => {
      let res = paramsProp ? paramsProp.get(name) : null;
      if (isDate && res != null) {
        res = moment.unix(res);
      }
      return res;
    };

    this.state = {
      isRefreshingResult: false,
      showGrid: false,
      isViewList: true,
      manualVal: '',
      selectedFieldValueId: calcParam('selectedFieldValueId'),
      selectedFieldValueId2: calcParam('selectedFieldValueId2'),
    };

    this.dontusePrefix = uuid.v1();

    this.cellRendererL = this.cellRenderer.bind(this, false);
    this.cellRendererR = this.cellRenderer.bind(this, true);
  }

  onDarkModeChanged = (isDark) => {
    if (!this.isM) {
      return;
    }

    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;
    this.doMem(false);

    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
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

    let projectId = this.props.paramsProp?.get('projectId');
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let reqOne = this.memRequestOne(true)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
    if (this.calcRequestId() && this.state.predictData == null && this.lastReqOneUsed !== reqOne) {
      if (reqOne?.query?.data != null) {
        this.lastReqOneUsed = reqOne;
        let data1 = /*Utils.tryJsonParse*/ reqOne?.query?.data;

        let optionsTestDatasRes = this.props.optionsTestDatasRes;
        let itemIdKey = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.itemIdColumn ?? '-';
        let dataIdKey = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.dataIdColumn ?? '-';

        let listItems = data1?.[itemIdKey || '-'];
        if (!_.isArray(listItems)) {
          listItems = null;
        }
        listItems = listItems || [];
        listItems = listItems.filter((s1) => '' + s1);
        listItems = listItems.map((s1) => ({ label: s1, value: s1 }));

        this.setState({
          forceItemIdRequest: listItems,
          forceUserIdRequest: data1?.[dataIdKey || '-'] || '',
          predictData: listItems,
        });

        this.showPrediction([]);
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

  componentDidUpdate(prevProps: Readonly<IModelPredictionsListsOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsListsOneState>, snapshot?: any) {
    this.doMem();
  }

  onChangeSelectField = (optionSel) => {
    this.setState({
      datasetIdSel: optionSel ? optionSel.value : null,
    });
  };

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
    let { paramsProp } = this.props;
    let projectId = paramsProp && paramsProp.get('projectId');
    if (projectId) {
      let url = '/' + paramsProp?.get('mode') + '/' + projectId;
      let params: any = {
        selectedAlgoId: this.props.selectedAlgoId,
        selectedFieldValueId: this.state.selectedFieldValueId,
        selectedFieldValueId2: this.state.selectedFieldValueId2,
        requestId: paramsProp?.get('requestId'),
        requestBPId: paramsProp?.get('requestBPId'),
      };

      let kk = Object.keys(params);
      kk.some((k1) => {
        if (params[k1] == null) {
          delete params[k1];
        }
      });

      let search = querystring.stringify(params);
      Location.replace(url, undefined, search);
    }
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

  showPrediction = (list) => {
    const requestId = this.calcRequestId();

    list = list || [];

    list = list.filter((d1) => d1 != null && d1 !== '');
    const selFieldValueId = this.calcSelectedFieldValueId();
    if (requestId == null) {
      if (selFieldValueId == null || selFieldValueId === '') {
        REActions.addNotificationError('Need to select a user!');
        return;
      }
    }

    this.setState({
      // predictData: listOri,
      isRefreshingResult: true,
      resultHistory: null,
      resultActual: null,
      resultPredicted: null,
      resultError: null,
    });

    this.lastCallPredictData = uuid.v1();

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let itemIdKey = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.itemIdColumn ?? '-';

    let already = {};
    let list2 = [];
    list.some((i1) => {
      if (!already[i1]) {
        already[i1] = true;
        list2.push(i1);
      }
    });
    list = list2;

    let listProc = list;

    const isHistory = listProc == null || listProc.length === 0;

    let resultColumns = optionsTestDatasRes?.resultColumns;
    let historyResultColumns = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.historyResultColumns;

    let uuid1 = this.lastCallPredictData;
    let data0: any = { user: { [optionsTestDatasRes?.testIdName.toLocaleLowerCase() ?? 'id']: selFieldValueId } };
    data0 = _.assign(
      isHistory
        ? {}
        : {
            items_to_score: listProc,
          },
      data0 || {},
    );

    let dataParams: any = { data: JSON.stringify(data0), resultColumns, historyResultColumns };
    dataParams = _.assign(
      isHistory
        ? {}
        : {
            queryType: 'RERANK_ITEMS'.toLowerCase(),
          },
      dataParams || {},
    );

    REClient_.client_()._predictForUI(this.props.selectedAlgoId, dataParams, null, this.calcRequestId(), (err, res) => {
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
        let actual = null;

        this.setState({
          resultHistory: res?.result?.history,
          resultActual: actual,
          resultPredicted: res?.result?.predictions,
          resultError: null,
        });
      }
    });
  };

  memTestDatas = memoizeOne((optionsTestDatasRes) => {
    if (this.calcRequestId() != null) {
      return;
    }

    let optionsTestDatas = optionsTestDatasRes ? optionsTestDatasRes.optionsTestDatas : null;
    if (this.calcSelectedFieldValueId() == null || (optionsTestDatas && optionsTestDatas.length > 0 && optionsTestDatas.find((o1) => o1.value === this.calcSelectedFieldValueId()) == null)) {
      if (optionsTestDatas && optionsTestDatas.length > 0) {
        setTimeout(() => {
          this.setState(
            {
              selectedFieldValueId: optionsTestDatas[0].value,
              selectedFieldValueId2: '',
              selectedFieldValueId2Bounce: '',
            },
            () => {
              this.refreshUrlWithParams();
            },
          );
        }, 0);
      }
    }
  });

  doPredictResult = (e) => {
    if (this.calcRequestId() != null) {
      return;
    }

    if (this.state.isViewList) {
      this.showPrediction(this.state.predictData?.map((d1) => d1.value) || []);
    } else {
      this.onClickSubmitIdsManual(e);
    }
  };

  handleSubmitForm = (values) => {
    if (this.calcRequestId() != null) {
      return;
    }

    let res = [];

    let vv = _.assign({}, values);
    let kk = Object.keys(vv);
    kk.some((k1) => {
      if (_.startsWith(k1, this.dontusePrefix)) {
        return false;
      }

      let ind = Utils.tryParseInt(k1.substring(1));
      if (ind != null) {
        res[ind] = vv[k1]?.value;
      }
    });

    res = res?.filter((r1) => r1 != null && r1 !== '');

    this.showPrediction(res);
  };

  onChangeForm = (info) => {
    setTimeout(() => {
      let res = [];

      let vv = this.formRef.current?.getFieldsValue();
      this.formRef.current?.resetFields();

      let kk = Object.keys(vv || []);
      kk?.some((k1) => {
        let v1 = vv[k1];

        if (v1 != null) {
          let ind = Utils.tryParseInt(k1.substring(1));
          if (ind != null) {
            res[ind] = { value: v1.value, label: v1.label };
          }
        }
      });

      this.setState(
        {
          predictData: res,
        },
        () => {
          this.doPredictResult(null);
        },
      );
    }, 0);
  };

  onClickRemove = (ind, e) => {
    if (ind != null) {
      let predictData = this.state.predictData;
      if (predictData && predictData[ind]) {
        predictData = [...predictData];
        predictData.splice(ind, 1);
        this.setState(
          {
            predictData,
          },
          () => {
            this.doPredictResult(null);
          },
        );
      }
    }
  };

  memRenderForm = memoizeOne((predictData, optionsFormOne, requestId) => {
    if (optionsFormOne) {
      let res = [],
        initialValues = {};
      if (predictData == null || predictData.length === 0) {
        if (requestId == null) {
          predictData = [{ label: '(Select Item)', value: '' }];
        }
      } else {
        predictData = [...predictData];
        if (requestId == null) {
          if (_.trim(predictData[predictData.length - 1]?.value || '') !== '') {
            predictData.push({ label: '(Select Item)', value: '' });
          }
        }
      }

      let popupContainerForMenu = (node) => document.getElementById('body2');
      let menuPortalTarget = popupContainerForMenu(null);

      predictData?.some((c1, c1ind) => {
        let initV = null;
        if (c1) {
          initV = c1;
        }

        initialValues['v' + c1ind] = initV;
        res.push(
          <div
            css={`
              display: flex;
            `}
            key={'field_' + c1ind + '_' + (c1?.value || 'empty' + Math.random())}
            style={{ marginBottom: (c1ind < predictData.length - 1 ? 14 : 0) + 'px', marginTop: 0 }}
          >
            <span
              css={`
                display: inline-block;
                flex: 1;
                align-items: center;
                justify-content: center;
              `}
            >
              <Form.Item name={'v' + c1ind} noStyle>
                <SelectExt
                  isDisabled={requestId != null}
                  menuPlacement={c1ind < 5 ? 'bottom' : 'top'}
                  isSearchable={true}
                  key={'sel_' + c1ind + '_' + (c1?.value || 'empty' + Math.random())}
                  allowCreate={true}
                  options={optionsFormOne}
                  menuPortalTarget={menuPortalTarget}
                  onChange={this.onChangeForm}
                />
              </Form.Item>
            </span>
            {requestId == null && (
              <div
                css={`
                  padding-top: 8px;
                  margin-left: 2px;
                `}
              >
                <FontAwesomeIcon
                  onClick={this.onClickRemove.bind(this, c1ind)}
                  icon={require('@fortawesome/pro-duotone-svg-icons/faMinusCircle').faMinusCircle}
                  transform={{ size: 22, y: -5, x: 3 }}
                  style={{ marginLeft: '4px', visibility: initV != null && c1ind < predictData.length - 1 ? 'visible' : 'hidden', color: 'white', cursor: 'pointer', display: 'inline-block' }}
                />
              </div>
            )}
          </div>,
        );
      });

      if (res.length > 0) {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }

          this.formRef.current?.setFieldsValue(initialValues);
        }, 0);

        let elem = (
          <div
            css={`
              padding: 20px;
            `}
          >
            <FormExt layout={'vertical'} key={uuid.v1()} ref={this.formRef} onFinish={this.handleSubmitForm} className="login-form">
              {res}
            </FormExt>
          </div>
        );

        return { count: res?.length ?? 0, elem };
      }
    }
  });

  onClickPredict = (e) => {
    this.doPredictResult(e);
  };

  calcSelectedFieldValueId = () => {
    let res = null;
    if (Utils.isNullOrEmpty(this.state.selectedFieldValueId2)) {
      res = this.state.selectedFieldValueId;
    } else {
      res = this.state.selectedFieldValueId2;
    }
    if (res != null && _.isString(res)) {
      res = _.trim(res);
    }
    return res;
  };

  onClickSelectedFieldValueId2 = (e) => {
    this.setState(
      {
        selectedFieldValueId2: this.state.selectedFieldValueId2Bounce,
      },
      () => {
        this.refreshUrlWithParams();
        this.doPredictResult(null);
      },
    );
  };

  onChangeSelectedFieldValueId2 = (e) => {
    let v1 = e.target.value;
    this.setState({
      selectedFieldValueId: null,
      selectedFieldValueId2Bounce: v1,
    });
  };

  onChangeSelectUserId = (option1, e) => {
    this.setState(
      {
        selectedFieldValueId: option1?.value,
        selectedFieldValueId2: '',
        selectedFieldValueId2Bounce: '',
      },
      () => {
        this.refreshUrlWithParams();
        this.doPredictResult(null);
      },
    );
  };

  memItemsIds = memoizeOne((itemIds, items, itemIdKey, firstColumnField) => {
    if (itemIds && itemIdKey) {
      let res = itemIds
        .map((i1, idx) => {
          if (typeof i1 === 'object') {
            i1 = Object.values(i1)[0];
          }
          if (!items) {
            return { label: i1, value: i1 };
          } else if (items.length > idx) {
            let item = items[idx] ?? {};

            let s1: any = i1;
            let search1 = '' + s1;
            if (firstColumnField && item[firstColumnField]) {
              let s2 = item[firstColumnField];
              if (!Utils.isNullOrEmpty(s2)) {
                search1 += ' ' + s2;
                s1 = (
                  <span>
                    <span style={{ marginRight: '5px' }}>{s1}</span>
                    <span style={{ opacity: 0.75 }}>{'' + s2}</span>
                  </span>
                );
              }
            }
            return { label: s1, value: i1, search: search1 };
          } else {
            return null;
          }
        })
        .filter((v1) => v1 != null);

      if (res && res.length > 0 && this.calcRequestId() == null) {
        let sample = [];
        for (let i = 0; i < 5 && i < res.length; i++) {
          sample.push(res[i]);
        }
        if (sample.length > 0) {
          setTimeout(() => {
            this.setState(
              {
                predictData: sample,
              },
              () => {
                if (this.calcSelectedFieldValueId()) {
                  this.showPrediction(sample.map((s1) => s1?.value));
                }
              },
            );
          }, 0);
        } else {
          this.showPrediction([]);
        }
      }

      res.unshift({ label: '(Select Item)', value: '' });
      return res;
    }
  });

  memPredictColumns = memoizeOne((columns) => {
    if (columns) {
      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let itemIdKey = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.itemIdColumn;
      if (!Utils.isNullOrEmpty(itemIdKey)) {
        columns = [...columns];
        columns.unshift(itemIdKey);
      }

      return columns.map(
        (c1, c1ind) =>
          ({
            title: c1,
            field: c1,
            // forceNoWrap: c1ind===0 ? true : undefined,
            render: (text, row, index) => {
              if (_.isObject(text)) {
                text = '';
              }
              return text;
            },
          } as ITableExtColumn),
      );
    }
  });

  onClickExperimentClose = (e) => {
    this.setState({
      showGrid: false,
    });
  };

  gridColumnWidthR = (width0, { index }) => {
    const DefaultWidthColumnFirst = 120;
    const DefaultWidthColumn = 240;

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let predictColumns = this.memPredictColumns(optionsTestDatasRes?.resultColumns);
    if (index === 0 && predictColumns != null && predictColumns.length === 1) {
      return width0;
    }
    if (predictColumns != null && index === predictColumns.length - 1 && predictColumns.length >= 2) {
      let ww = DefaultWidthColumnFirst;
      if (predictColumns.length > 2) {
        ww += DefaultWidthColumn * (predictColumns.length - 2);
      }
      if (ww < width0) {
        if (width0 - ww > 170) {
          return width0 - ww;
        }
      }
    }

    let itemIdKey = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.itemIdColumn;
    if (index === 0 && itemIdKey != null) {
      if (predictColumns && predictColumns[0].field === itemIdKey) {
        return DefaultWidthColumnFirst;
      }
    }

    let field1 = null; //this.getFieldFromIndex(index-1);
    if (field1) {
      let type1 = null; //this.calcTypeFromField(field1);

      if (type1 === 'array') {
        return 200;
      } else if (type1 === 'string' || type1 === 'CATEGORICAL') {
        return 240;
      } else if (type1 === 'number' || type1 === 'NUMERICAL') {
        return 160;
      } else if (type1 === 'TIMESTAMP') {
        return 200;
      } else {
        return 120;
      }
    }

    return DefaultWidthColumn; //index===2 ? 320 : 140;
  };

  cellRenderer = (
    isPredictions: boolean,
    {
      columnIndex, // Horizontal (column) index of cell
      isScrolling, // The Grid is currently being scrolled
      isVisible, // This cell is visible within the grid (eg it is not an overscanned cell)
      key, // Unique key within array of cells
      parent, // Reference to the parent Grid (instance)
      rowIndex, // Vertical (row) index of cell
      style, // Style object to be applied to cell (to position it);
      // This must be passed through to the rendered cell element.
    },
  ) => {
    let content: any = '';

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let predictColumns = this.memPredictColumns(optionsTestDatasRes?.resultColumns);

    let getValue = (isPredictions, row, col) => {
      if (predictColumns) {
        let colName = predictColumns[col]?.field;
        if (colName) {
          let data = null;
          if (isPredictions) {
            data = this.state.resultPredicted;
          } else {
            data = this.state.resultHistory;
          }
          if (data) {
            let d1 = data[row];
            if (d1) {
              let value1 = d1[colName];
              return value1 || '';
            }
          }
        }
      }
      return '';
    };

    if (rowIndex === 0) {
      if (false && columnIndex === 0) {
        content = '';
      } else {
        columnIndex++;
        let field1 = null; //this.getFieldFromIndex(columnIndex-1);
        content = 'Col: ' + columnIndex;
        if (predictColumns) {
          content = predictColumns[columnIndex - 1]?.title || '-';
          // if(_.isString(content)) {
          //   content = Utils.prepareHeaderString(content);
          // }
        }
      }
    } else {
      columnIndex++;
      if (false && columnIndex === 0) {
        content = '' + rowIndex;
      } else {
        content = getValue(isPredictions, rowIndex - 1, columnIndex - 1);
        if (content == null) {
          if (isScrolling) {
            content = '...';
          }
        } else {
          let field1 = null; //this.getFieldFromIndex(columnIndex-1);
          if (field1) {
            let dataTypeList = field1.get('data_types');
            dataTypeList = dataTypeList && dataTypeList.toJS(); //TODO use isList future

            // if(columnIndex==2) {
            //   dataTypeList = ['array', 'number'];
            // }

            if (_.isArray(dataTypeList) && dataTypeList[0] === 'array') {
              content = [];
              for (let i = 0; i < 10; i++) {
                content.push(rowIndex * 2 + i);
              }

              if (!_.isArray(content)) {
                content = 'Error';
              } else {
                content = '';
                if (dataTypeList.length === 1) {
                } else if (dataTypeList.length === 2) {
                } else {
                  //
                }
              }
            } else {
              let dataType = null; //this.calcTypeFromField(field1);
              if (dataType === 'TIMESTAMP') {
                let dt1 = moment(content);
                if (dt1.isValid()) {
                  content = dt1.format('YYYY-MM-DD HH:mm:ss');
                }
              } else if (['number', 'float', 'NUMERICAL'].includes(dataType)) {
                content = Utils.roundDefault(content);
              }
            }
          }
        }
      }
    }

    let styleF = _.assign({ justifyContent: 'flex-start', padding: '4px' } as CSSProperties, style || {});
    styleF.backgroundColor = rowIndex === 0 ? '#23305e' : '#19232f';
    styleF.borderBottom = '1px solid #0b121b';
    if (isPredictions) {
      if (this.state.hoveredRowIndexR === rowIndex) {
        styleF.backgroundColor = '#284192';
        styleF.cursor = 'pointer';
      }
    } else {
      if (this.state.hoveredRowIndexL === rowIndex) {
        styleF.backgroundColor = '#284192';
        styleF.cursor = 'pointer';
      }
    }

    let methodEnter;
    if (isPredictions) {
      methodEnter = this.onRowMouseEnterR.bind(this, rowIndex === 0 ? null : rowIndex);
    } else {
      methodEnter = this.onRowMouseEnterL.bind(this, rowIndex === 0 ? null : rowIndex);
    }

    const onMouseEnter = (e) => {
      let t1 = e.currentTarget;
      let $this = $(t1);

      if (t1.offsetWidth < t1.scrollWidth - 2 * 4 && !$this.attr('title')) {
        $this.attr('title', $this.text());
      }
    };

    return (
      <div key={key} style={styleF} className={s.Cell + ' '} onMouseEnter={methodEnter}>
        <div className={sd.ellipsis} onMouseEnter={onMouseEnter}>
          {content}
        </div>
      </div>
    );
  };

  onRowMouseChangeIndexR = (rowIndex) => {
    if (this.state.hoveredRowIndexR !== rowIndex) {
      this.setState({
        hoveredRowIndexR: rowIndex,
      });
    }
  };

  onRowMouseEnterR = (rowIndex, e) => {
    this.onRowMouseChangeIndexR(rowIndex);
  };

  onRowMouseLeaveR = (e) => {
    this.onRowMouseChangeIndexR(null);
  };

  onRowMouseChangeIndexL = (rowIndex) => {
    if (this.state.hoveredRowIndexL !== rowIndex) {
      this.setState({
        hoveredRowIndexL: rowIndex,
      });
    }
  };

  onRowMouseEnterL = (rowIndex, e) => {
    this.onRowMouseChangeIndexL(rowIndex);
  };

  onRowMouseLeaveL = (e) => {
    this.onRowMouseChangeIndexL(null);
  };

  onClickClearAll = (e) => {
    this.setState(
      {
        predictData: [],
        manualVal: '',
      },
      () => {
        this.doPredictResult(null);
      },
    );
  };

  onChangeManualVal = (e) => {
    this.setState({
      manualVal: e.target.value,
    });
  };

  onClickSubmitIdsManual = (e) => {
    if (this.calcRequestId() != null) {
      return;
    }

    const v1 = this.state.manualVal;
    if (v1 != null) {
      const vv = v1
        .split(',')
        .filter((v1) => _.trim(v1 || '') !== '')
        .map((v1) => _.trim(v1));
      this.showPrediction(vv || []);
    }
  };

  onChangeSizeWidth = (e) => {
    this.forceUpdate();

    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      // @ts-ignore
      this.refs.sizerAll?.refs?.sizerL?.refs?.gridRefL?.forceUpdateGrids();
      // @ts-ignore
      this.refs.sizerAll?.refs?.sizerL?.refs?.gridRefL?.recomputeGridSize();

      // @ts-ignore
      this.refs.sizerAll?.refs?.sizerR?.refs?.gridRefR?.forceUpdateGrids();
      // @ts-ignore
      this.refs.sizerAll?.refs?.sizerR?.refs?.gridRefR?.recomputeGridSize();
    }, 0);
  };

  onChangeViewList = (e) => {
    this.setState({
      isViewList: e.target.value,
    });
  };

  onClickChangeDisplayType = (e) => {
    this.props.onChangeDisplayType?.(PredictionDisplayType.two_tables);
  };

  render() {
    let { projects, projectId } = this.props;

    let foundProject1 = this.memProjectId(false)(projectId, projects);
    const requestId = this.calcRequestId();

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
    const testIdName = optionsTestDatasRes?.testIdName;
    if (!optionsTestDatas?.length && testIdName) {
      optionsTestDatas = optionsTestDatasRes?.resultTestDatas?.ids?.map((item) => ({ label: item[testIdName], value: item[testIdName] }));
    }
    // let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    // let columnsDisplay: {key:string, dataType:string}[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;

    let optionsTestDatasSel = Utils.isNullOrEmpty(this.state.selectedFieldValueId) ? { label: '(Select)', value: null } : optionsTestDatas?.find((o1) => o1.value === this.state.selectedFieldValueId);

    this.memTestDatas(optionsTestDatasRes);

    const topHH = requestId == null ? 50 : 0,
      topHeaderHH = 44 + 44;

    let predictColumns = this.memPredictColumns(optionsTestDatasRes?.resultColumns);

    let itemIdKey = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.itemIdColumn ?? '-';
    let optionsItemsIds = this.memItemsIds(
      optionsTestDatasRes?.resultTestDatas?.itemIds,
      optionsTestDatasRes?.resultTestDatas?.items,
      itemIdKey,
      itemIdKey && predictColumns?.[0]?.field === itemIdKey ? predictColumns?.[1]?.field : predictColumns?.[0]?.field,
    );

    // let optionsFormOne = this.memOptionsFormOne(optionsTestDatasRes?.rangeDateByTestDataId);
    let renderFormRes = this.memRenderForm(this.state.predictData, optionsItemsIds, this.calcRequestId());
    let renderForm = renderFormRes?.elem;
    const renderFormCount = renderFormRes?.count ?? 0;
    // let renderPredicted = this.memRenderPredicted(this.state.resultPredicted);

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
        <SelectExt isDisabled={requestId != null} value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    const borderAAA = Constants.lineColor(); //Utils.colorA(0.3);
    const STYLEL = {
      backgroundColor: Constants.navBackDarkColor(),
      // border: '1px solid '+Utils.colorA(0.2),
      outline: 'none',
      overflow: 'hidden',
      fontSize: '14px',
      fontFamily: 'Matter',

      position: 'absolute',
      top: 0 /*(topNameTable+topHHitem)*/ + 'px',
      left: 0,
    };
    const STYLER = {
      backgroundColor: Constants.navBackDarkColor(),
      // border: '1px solid '+Utils.colorA(0.2),
      outline: 'none',
      overflow: 'hidden',
      fontSize: '14px',
      fontFamily: 'Matter',

      position: 'absolute',
      top: 0 /*(topNameTable+topHHitem)*/ + 'px',
      right: 0,
    };
    const STYLE_BOTTOM_LEFT_GRID = {
      // borderRight: '1px solid '+borderAAA,
    };
    const STYLE_TOP_LEFT_GRID = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      // textTransform: 'uppercase',

      borderBottom: '1px solid ' + borderAAA,
      // borderRight: '1px solid '+borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    const STYLE_TOP_RIGHT_GRIDR = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      // textTransform: 'uppercase',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    let STYLE_TOP_RIGHT_GRIDL = _.assign({}, STYLE_TOP_RIGHT_GRIDR, { aaborderRight: '2px solid ' + borderAAA });
    const STYLE_BOTTOM_RIGHT_GRIDR = {
      outline: 'none',
      backgroundColor: '#19232f',
    };
    let STYLE_BOTTOM_RIGHT_GRIDL = _.assign({}, STYLE_BOTTOM_RIGHT_GRIDR, { aaborderRight: '2px solid ' + borderAAA });

    const hhTextTitle = 34;

    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <WindowSizeSmart onChangeSize={this.onChangeSizeWidth} />

        <RefreshAndProgress errorMsg={null} isRefreshing={isRefreshing}>
          <AutoSizer ref={'sizerAll'}>
            {({ height, width }) => {
              height = height - topAfterHeaderHH - topHH - 5;

              let heightForm = height - 10 - 30 - topHeaderHH;
              let usedSpace = renderFormCount * (34 + 14) - (renderFormCount > 0 ? 14 : 0) + 20 * 2;
              if (!this.state.isViewList) {
                usedSpace = Math.trunc(heightForm / 2);
                let min1 = 240;
                if (usedSpace < min1) {
                  if (heightForm >= min1) {
                    usedSpace = min1;
                  } else {
                    usedSpace = heightForm;
                  }
                }
              }
              heightForm = Math.min(heightForm, usedSpace);

              let renderTextManual = (
                <div style={{ height: heightForm - 20 * 2 + 'px', padding: '20px' }}>
                  <Input.TextArea
                    className={s.noresize}
                    value={this.state.manualVal}
                    onChange={this.onChangeManualVal}
                    autoSize={false}
                    style={{ height: heightForm - 30 - 76 - 2 * 20 + 'px', marginTop: '8px', marginBottom: '6px' }}
                  ></Input.TextArea>
                  <div style={{ lineHeight: 1, marginBottom: '7px', fontSize: '12px', textAlign: 'center' }} className={sd.styleTextGrayLight}>
                    Enter IDs separated by commas
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Button type={'primary'} onClick={this.onClickSubmitIdsManual}>
                      Submit
                    </Button>
                  </div>
                </div>
              );

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
                    <div style={{ display: !this.state.showGrid ? 'block' : 'none', position: 'absolute', top: topHH + topHeaderHH + 'px', left: 0, right: 0, bottom: 0 }}>
                      <div style={{ position: 'absolute', top: 0, left: '10px', width: width / 2 + 'px', bottom: '10px' }}>
                        <div style={{ position: 'absolute', top: 0, left: '10px', right: '10px', height: height + 'px' }}>
                          <div>
                            <div style={{ fontSize: '15px', marginBottom: '10px' }}>
                              <span style={{ marginRight: '12px' }}>{itemIdKey || 'Items'} values to rerank:</span>
                              {requestId == null && (
                                <span>
                                  <Button type={'default'} ghost onClick={this.onClickClearAll} style={{ borderColor: Utils.colorA(0.5), height: '24px', lineHeight: 1 }}>
                                    Clear
                                  </Button>
                                </span>
                              )}
                              {requestId == null && (
                                <span style={{ marginLeft: '10px' }}>
                                  <Radio.Group value={this.state.isViewList} onChange={this.onChangeViewList} size={'small'}>
                                    <Radio.Button style={this.state.isViewList ? { backgroundColor: 'transparent' } : { color: 'white', backgroundColor: 'transparent' }} value={true}>
                                      &nbsp;List&nbsp;
                                    </Radio.Button>
                                    <Radio.Button style={!this.state.isViewList ? { backgroundColor: 'transparent' } : { color: 'white', backgroundColor: 'transparent' }} value={false}>
                                      &nbsp;Manual&nbsp;
                                    </Radio.Button>
                                  </Radio.Group>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={sd.classGrayPanel} style={{ position: 'absolute', top: 32 + 'px', left: 0, right: '20px', height: heightForm + 'px' }}>
                            <div style={{ display: this.state.isViewList ? 'block' : 'none' }}>
                              <NanoScroller onlyVertical>{renderForm}</NanoScroller>
                            </div>
                            <div style={{ display: !this.state.isViewList ? 'block' : 'none' }}>{renderTextManual}</div>
                          </div>
                        </div>

                        <div style={{ position: 'absolute', top: 32 + heightForm + 10 + 'px', left: 0, right: '20px', height: topHeaderHH + 'px' }}>
                          <div style={{ height: topHeaderHH + 'px', textAlign: 'center' }}>
                            <div>
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
                                {(optionsTestDatasRes?.testIdName || 'Item ID') + ':'}
                              </span>
                              <span style={{ display: 'inline-block', marginRight: '30px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  {requestId == null && (
                                    <span style={{ width: '120px', display: 'inline-block' }}>
                                      <SelectExt menuPlacement={'top'} value={optionsTestDatasSel} options={optionsTestDatas} onChange={this.onChangeSelectUserId} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                                    </span>
                                  )}
                                  {requestId == null && (
                                    <span
                                      css={`
                                        font-family: Roboto;
                                        font-size: 12px;
                                        font-weight: bold;
                                        color: #d1e4f5;
                                        text-transform: uppercase;
                                      `}
                                      style={{ margin: '0 8px' }}
                                    >
                                      OR
                                    </span>
                                  )}
                                  <span style={{ width: '120px', display: 'inline-block' }}>
                                    <Input
                                      disabled={requestId != null}
                                      placeholder={'Enter a value'}
                                      style={{ height: '35px', borderRadius: 0 }}
                                      value={requestId != null ? this.state.forceUserIdRequest : this.state.selectedFieldValueId2Bounce}
                                      onChange={this.onChangeSelectedFieldValueId2}
                                    />
                                  </span>
                                  {requestId == null && (
                                    <Button style={{ height: '35px', marginLeft: '5px' }} type={'primary'} onClick={this.onClickSelectedFieldValueId2}>
                                      Predict
                                    </Button>
                                  )}
                                </div>
                              </span>
                            </div>
                            {this.props.allowChangeDisplayType && requestId == null && (
                              <div
                                css={`
                                  margin-top: 8px;
                                `}
                              >
                                <Button ghost type={'primary'} onClick={this.onClickChangeDisplayType}>
                                  Show User Recommendations Dashboard
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ position: 'absolute', top: height / 2 + 'px', width: width / 2 + 'px', right: '10px', height: height / 2 + 'px' }}>
                        <div className={sd.titleTopHeaderAfter} style={{ fontSize: '16px', paddingLeft: '12px', paddingTop: '5px' }}>
                          History:
                        </div>
                        <div style={{ position: 'absolute', top: hhTextTitle + 'px', left: 0, right: 0, bottom: 0 }}>
                          <AutoSizer ref={'sizerL'}>
                            {({ width, height }) => {
                              width -= 12;
                              return (
                                <div onMouseLeave={this.onRowMouseLeaveL} style={{ height: height + 'px', width: width + 'px' }}>
                                  <RefreshAndProgress errorMsg={null} isRefreshing={this.state.isRefreshingResult} style={{ left: '10px', overflow: 'hidden', borderRadius: '8px' }}>
                                    <MultiGrid
                                      ref={'gridRefL'}
                                      cellRenderer={this.cellRendererL}
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
                                      fixedColumnCount={0}
                                      overscanRowCount={40}
                                      overscanColumnCount={5}
                                      style={STYLEL}
                                      styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                                      styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                                      styleTopRightGrid={STYLE_TOP_RIGHT_GRIDL}
                                      styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRIDL}
                                      columnCount={predictColumns?.length ?? 0}
                                      columnWidth={this.gridColumnWidthR.bind(this, width)}
                                      height={height}
                                      rowCount={1 + (this.state.resultHistory?.length ?? 0)}
                                      rowHeight={cellHH}
                                      width={width}
                                    />
                                  </RefreshAndProgress>
                                </div>
                              );
                            }}
                          </AutoSizer>
                        </div>
                      </div>

                      <div style={{ position: 'absolute', top: 0 + 'px', width: width / 2 + 'px', right: '10px', height: height / 2 - 10 + 'px' }}>
                        <div className={sd.titleTopHeaderAfter} style={{ fontSize: '16px', paddingLeft: '12px', paddingTop: '5px' }}>
                          Predictions:
                        </div>
                        <div style={{ position: 'absolute', top: hhTextTitle + 'px', left: 0, right: 0, bottom: 0 }}>
                          <AutoSizer ref={'sizerR'}>
                            {({ width, height }) => {
                              width -= 12;
                              return (
                                <div onMouseLeave={this.onRowMouseLeaveR} style={{ height: height + 'px', width: width + 'px' }}>
                                  <RefreshAndProgress errorMsg={null} isRefreshing={this.state.isRefreshingResult} style={{ left: '10px', overflow: 'hidden', borderRadius: '8px' }}>
                                    <MultiGrid
                                      ref={'gridRefR'}
                                      cellRenderer={this.cellRendererR}
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
                                      fixedColumnCount={0}
                                      overscanRowCount={40}
                                      overscanColumnCount={5}
                                      style={STYLER}
                                      styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                                      styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                                      styleTopRightGrid={STYLE_TOP_RIGHT_GRIDR}
                                      styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRIDR}
                                      columnCount={predictColumns?.length ?? 0}
                                      columnWidth={this.gridColumnWidthR.bind(this, width)}
                                      height={height}
                                      rowCount={1 + (this.state.resultPredicted?.length ?? 0)}
                                      rowHeight={cellHH}
                                      width={width}
                                    />
                                  </RefreshAndProgress>
                                </div>
                              );
                            }}
                          </AutoSizer>
                        </div>
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
    requests: state.requests,
  }),
  null,
)(ModelPredictionsListsOne);
