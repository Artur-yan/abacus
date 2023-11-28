import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment-timezone';
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
import CopyText from '../CopyText/CopyText';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import { IModelPropsCommon, PredictionDisplayType } from '../ModelPredictionCommon/ModelPredictionCommon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExtOver from '../TooltipExtOver/TooltipExtOver';
const s = require('./ModelPredictionsPersonalizationOne.module.css');
const sd = require('../antdUseDark.module.css');

const cellHH = 54;

interface IFilterList {
  title: string;
  sendField: string;
  defaultValue: string;
  values: {
    name: string;
    value: string;
  }[];
}

interface IModelPredictionsPersonalizationOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;
  useCases?: any;
  requests?: any;

  allowChangeDisplayType?: boolean;
  onChangeProject?: (key: any) => void;
  onChangeDisplayType?: (dispalyType: PredictionDisplayType) => void;

  projectId?: string;
  showItems?: boolean;
  useCaseInfo?: any;
}

interface IModelPredictionsPersonalizationOneState {
  selectedFieldId?: string;
  selectedFieldValueId?: string;
  selectedFieldValueId2?: string;
  selectedFieldValueId2Bounce?: string;
  selectedRangeDatesId?: string;
  isRefreshingChart?: boolean;
  hoveredRowIndexR?: number;
  hoveredRowIndexL?: number;
  sessionId?: string;
  firstTime?: boolean;
  tablesData?: any;
  resultError?: string;
  itemIdsSel?: string;

  forceItemIdSel?: string;
  forceUserIdSel?: string;
}

class ModelPredictionsPersonalizationOne extends React.PureComponent<IModelPredictionsPersonalizationOneProps & IModelPropsCommon, IModelPredictionsPersonalizationOneState> {
  private unDark: any;
  private prepareChartTimer: any;
  private cacheChartData: any;
  private isM: boolean;
  private lastCallChartData: any;
  private timeoutRetryRunModel: any;
  cellRendererL: any;
  cellRendererR: any;
  private lastProjectId: any;
  withGrid: number;
  gridColumnWidthL: any;
  gridColumnWidthR: any;
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
      sessionId: uuid.v1(),
      firstTime: true,
      selectedFieldId: calcParam('selectedFieldId'),
      selectedFieldValueId: calcParam('selectedFieldValueId'),
      selectedFieldValueId2: calcParam('selectedFieldValueId2'),
      selectedFieldValueId2Bounce: calcParam('selectedFieldValueId2'),
      selectedRangeDatesId: calcParam('selectedRangeDatesId'),
      itemIdsSel: calcParam('itemIdsSel'),
    };

    this.cellRendererL = this.cellRenderer.bind(this, false);
    this.cellRendererR = this.cellRenderer.bind(this, true);

    this.gridColumnWidthL = this.gridColumnWidth.bind(this, true);
    this.gridColumnWidthR = this.gridColumnWidth.bind(this, false);
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

    const projectId = this.props.paramsProp?.get('projectId');
    const project = this.memProjectId(true)(projectId, this.props.projects);
    this.memOptionsField(true)(project, this.props.defDatasets);

    let reqOne = this.memRequestOne(true)(this.props.requests, this.props.selectedAlgoId, this.calcRequestId())?.[0];
    if (this.calcRequestId() && this.lastReqOneUsed !== reqOne) {
      if (reqOne?.query?.data != null) {
        this.lastReqOneUsed = reqOne;
        let data1 = reqOne?.query?.data;
        let optionsTestDatasRes = this.props.optionsTestDatasRes;
        let itemIdKey = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.itemIdColumn ?? '-';
        let dataIdKey = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.dataIdColumn ?? '-';

        this.setState({
          forceItemIdSel: data1?.[itemIdKey || '-'] || '',
          forceUserIdSel: data1?.[dataIdKey || '-'] || '',
        });
      }
    }
  };

  calcRequestBPId = () => {
    let requestId = this.props.paramsProp?.get('requestBPId');
    if (requestId === '') {
      requestId = null;
    }
    return requestId;
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

  componentDidUpdate(prevProps: Readonly<IModelPredictionsPersonalizationOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsPersonalizationOneState>, snapshot?: any): void {
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
        selectedFieldValueId: this.state.selectedFieldValueId,
        selectedFieldValueId2: this.state.selectedFieldValueId2,
        selectedRangeDatesId: this.state.selectedRangeDatesId,
        itemIdsSel: this.state.itemIdsSel,
        requestId: this.props.paramsProp?.get('requestId'),
        requestBPId: this.props.paramsProp?.get('requestBPId'),
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
    let isFirstProject = this.lastProjectId == null;
    this.lastProjectId = projectId;
    if (!Utils.isNullOrEmpty(projectId)) {
      this.doResetDatesIfNeeded(isFirstProject).then(() => {});
    }
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  doResetDatesIfNeeded = (keepTestData = false) => {
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
      if (!keepTestData && this.state.selectedFieldValueId2 != null) {
        obj1.selectedFieldValueId2 = null;
      }
      if (this.state.selectedFieldId != null) {
        obj1.selectedFieldId = null;
      }
      if (this.state.itemIdsSel != null) {
        obj1.itemIdsSel = null;
      }
      // if(this.state.selectedAlgoId!=null) {
      //   obj1.selectedAlgoId = null;
      // }

      if (!_.isEmpty(obj1)) {
        setTimeout(() => {
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
        resultError: null,
      },
      () => {
        this.refreshUrlWithParams();
      },
    );
  };

  onChangeSelectAlgo = (optionSel) => {
    this.doResetDatesIfNeeded(true).then(() => {
      this.setState({
        resultError: null,
      });
      this.props.onChangeAlgoId(optionSel ? optionSel.value : null, () => {
        this.refreshUrlWithParams();
      });
    });
  };

  onChangeSelectField = (optionSel) => {
    this.setState(
      {
        selectedFieldId: optionSel ? optionSel.value : null,
        resultError: null,
      },
      () => {
        this.refreshUrlWithParams();
      },
    );
  };

  onClickSelectedFieldValueId2 = (e) => {
    this.setState(
      {
        selectedFieldValueId: null,
        selectedFieldValueId2: this.state.selectedFieldValueId2Bounce,
      },
      () => {
        this.refreshUrlWithParams();
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

  onChangeSelectFieldValue = (optionSel) => {
    this.setState(
      {
        selectedFieldValueId: optionSel ? optionSel.value : null,
        selectedFieldValueId2: '',
        selectedFieldValueId2Bounce: '',
        resultError: null,
      },
      () => {
        this.refreshUrlWithParams();
      },
    );
  };

  onChangeSelectItemIds = (optionSel) => {
    this.setState(
      {
        itemIdsSel: optionSel ? optionSel.value : null,
      },
      () => {
        this.refreshUrlWithParams();
      },
    );
  };

  memGetModelTablesData = memoizeOne((showItems, useCaseInfo, projectId, algoSelectValue, fieldValueSelectValue, sessionId, columnsList, columnsListHistory, filtersList, sendParams, itemIdsSel, requestId) => {
    if (Utils.isNullOrEmpty(algoSelectValue) || Utils.isNullOrEmpty(projectId) || !columnsList || columnsList.length === 0) {
      return;
    }

    if (showItems) {
      if (Utils.isNullOrEmpty(itemIdsSel)) {
        return;
      }
    } else {
      if (Utils.isNullOrEmpty(fieldValueSelectValue)) {
        return;
      }
    }

    if (!this.cacheChartData) {
      this.cacheChartData = {};
    }

    const keyCache = algoSelectValue + ' ' + (!fieldValueSelectValue ? 'null' : fieldValueSelectValue) + ' ' + itemIdsSel;
    const inCache = this.cacheChartData[keyCache];
    if (inCache && inCache.data != null) {
      if (!inCache.isRefreshing) {
        setTimeout(() => {
          this.setState({
            firstTime: false,
            isRefreshingChart: false,
          });
        }, 0);
      }
      return inCache;
    } else {
      let obj1: any = {
        isRefreshing: true,
        data: null,
      };
      this.cacheChartData[keyCache] = obj1;

      setTimeout(() => {
        this.setState({
          firstTime: false,
          isRefreshingChart: true,
          resultError: null,
        });
      }, 0);

      let uuid1 = uuid.v1();
      this.lastCallChartData = uuid1;

      //dates
      if (this.timeoutRetryRunModel) {
        clearTimeout(this.timeoutRetryRunModel);
        this.timeoutRetryRunModel = null;
      }

      columnsList = columnsList || [];
      columnsListHistory = columnsListHistory || [];

      let dataParams: any = {};

      let optionsTestDatasRes = this.props.optionsTestDatasRes;
      let dataIdColumn = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.dataIdColumn;
      if (showItems) {
        let itemIdColumn = optionsTestDatasRes?.resultTestDatas?.formatKwargs?.itemIdColumn || 'a';
        let userIdColumn = optionsTestDatasRes?.resultTestDatas?.displayInfo?.testIdName || 'a';
        dataParams.data = {
          [itemIdColumn]: itemIdsSel,
        };

        let idV = this.state.selectedFieldValueId || this.state.selectedFieldValueId2;
        if (!Utils.isNullOrEmpty(dataIdColumn) && !Utils.isNullOrEmpty(idV)) {
          dataParams.data[dataIdColumn] = idV;
        }

        if (fieldValueSelectValue != null && fieldValueSelectValue !== '') {
          dataParams.data[userIdColumn] = fieldValueSelectValue;
        }
        dataParams.queryType = 'RELATED_ITEMS'.toLowerCase();

        dataParams.data = JSON.stringify(dataParams.data);
      } else {
        let optionsTestDatasRes = this.props.optionsTestDatasRes;
        let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};

        let data1 = rangeDateByTestDataId?.[fieldValueSelectValue]?.data;

        let idV = this.state.selectedFieldValueId || this.state.selectedFieldValueId2;
        if (!Utils.isNullOrEmpty(dataIdColumn) && !Utils.isNullOrEmpty(idV)) {
          data1 = data1 ?? {};
          data1[dataIdColumn] = idV;
        }

        const selFieldValueId = this.calcSelectedFieldValueId();
        let data0: any = {
          user: { [optionsTestDatasRes?.testIdName.toLocaleLowerCase() ?? 'id']: selFieldValueId },
          items_to_score: optionsTestDatasRes?.resultTestDatas?.itemIds?.map((item) => (typeof item === 'object' ? Object.values(item)[0] : item)) ?? [],
        };

        data1 = _.assign(data1 ?? {}, data0 || {});

        dataParams.data = data1 == null ? null : JSON.stringify(data1);

        if (sendParams != null) {
          dataParams = _.assign({}, dataParams, sendParams || {});
        }
      }

      if (filtersList) {
        let { filterValues } = this.props;
        if (filterValues && !_.isEmpty(filterValues)) {
          filtersList.some((f1) => {
            let fv1 = filterValues[f1.send_field || f1.sendField];
            if (fv1 != null) {
              dataParams[f1.sendField] = fv1;
            }
          });
        }
      }

      REClient_.client_()._predictForUI(algoSelectValue, dataParams, null, this.calcRequestId(), (err, res) => {
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
              this.setState({
                sessionId: uuid.v1(),
              });
            }, time1);
          }
          return;
        }

        if (this.lastCallChartData === uuid1) {
          setTimeout(() => {
            this.setState({
              isRefreshingChart: false,
            });
          }, 0);
        }

        obj1.isRefreshing = false;

        if (err) {
          this.setState({
            resultError: err || Constants.errorDefault,
          });
        }

        if (this.lastCallChartData === uuid1 && !err && res.result) {
          obj1.columnsList = [...columnsList];
          obj1.columnsListHistory = [...columnsListHistory];
          obj1.dataHistory = res.result?.history || [];
          obj1.dataPredictions = res.result?.predictions || [];
          obj1.dataItem = res.result?.item;

          obj1.dataUser = res.result?.user;
          obj1.dataRestricts = res.result?.restricts;

          this.setState({
            tablesData: obj1,
          });
        }
      });

      return obj1;
    }
  });

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

  gridColumnWidth = (isLeft, { index }) => {
    if (index === 0) {
      return 80;
    }

    let tablesRes = this.memTablesProcess(this.state.tablesData);
    let columns = isLeft ? tablesRes?.columns : tablesRes?.columnsHistory ?? tablesRes?.columns;

    if (this.withGrid != null && this.withGrid > 0 && columns != null && index === columns?.length && columns?.length <= 1) {
      return this.withGrid - 80;
    }
    return index === 2 ? 320 : 140;
  };

  cellRenderer = (
    isPredictions: boolean,
    {
      columnIndex, // Horizontal (column) index of cell
      isScrolling, // The Grid is currently being scrolled
      key, // Unique key within array of cells
      parent, // Reference to the parent Grid (instance)
      rowIndex, // Vertical (row) index of cell
      style, // Style object to be applied to cell (to position it);
      // This must be passed through to the rendered cell element.
    },
  ) => {
    let content: any = '';

    let tablesRes = this.memTablesProcess(this.state.tablesData);

    let getValue = (isPredictions, row, col) => {
      if (tablesRes) {
        let columns = isPredictions === false ? tablesRes.columnsHistory ?? tablesRes.columns : tablesRes.columns;

        let colName = columns[col];
        if (colName) {
          let data = null;
          if (isPredictions) {
            data = tablesRes.dataPredictions;
          } else {
            data = tablesRes.dataHistory;
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
      if (columnIndex === 0) {
        content = '';
      } else {
        content = 'Col: ' + columnIndex;

        let columns = isPredictions === false ? tablesRes.columnsHistory ?? tablesRes.columns : tablesRes.columns;
        if (tablesRes && columns) {
          content = columns[columnIndex - 1] || '-';
        }
      }
    } else {
      if (columnIndex === 0) {
        content = '' + rowIndex;
      } else {
        content = getValue(isPredictions, rowIndex - 1, columnIndex - 1);
        if (content == null && isScrolling) {
          content = '...';
        }
      }
    }

    if (content != null && _.isNumber(content) && columnIndex > 0 && rowIndex > 0) {
      content = Utils.roundDefault(content);
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

    let mouseEnter = (e) => {
      let t1 = e.currentTarget;
      let $this = $(t1);

      if (t1.offsetWidth < t1.scrollWidth - 8 && !$this.attr('title')) {
        $this.attr('title', $this.text());
      }
    };

    let mouseEnter1;
    if (isPredictions) {
      mouseEnter1 = this.onRowMouseEnterR.bind(this, rowIndex || null);
    } else {
      mouseEnter1 = this.onRowMouseEnterL.bind(this, rowIndex || null);
    }

    return (
      <div key={key} style={styleF} className={s.Cell + ' '} onMouseEnter={mouseEnter1}>
        <div className={sd.ellipsis} onMouseEnter={mouseEnter}>
          <TooltipExtOver>{content}</TooltipExtOver>
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

  memTablesProcess: (tablesData: any) => { dataRestricts: any; dataUser?: any; columns: any[]; columnsHistory: any[]; dataPredictions: any[]; dataHistory: any[]; dataItem: any } = memoizeOne((tablesData) => {
    if (tablesData) {
      let columnsRes = [];
      if (tablesData.columnsList) {
        columnsRes = tablesData.columnsList.map((s1) => _.trim(s1 || ''));
      }

      let columnsHistoryRes = [];
      if (tablesData.columnsListHistory) {
        columnsHistoryRes = tablesData.columnsListHistory.map((s1) => _.trim(s1 || ''));
      }

      return {
        dataRestricts: tablesData.dataRestricts,
        dataUser: tablesData.dataUser,
        columns: columnsRes,
        columnsHistory: columnsHistoryRes,
        dataPredictions: tablesData.dataPredictions,
        dataHistory: tablesData.dataHistory,
        dataItem: tablesData.dataItem,
      };
    }
  });

  onChangeFilterValue = (filterOne, option1, e) => {
    let ff = this.props.filterValues;
    ff = ff ? { ...ff } : {};
    ff[filterOne.send_field || filterOne.sendField] = option1 ? option1.value : null;

    this.props.onChangeFilterValues(ff, () => {
      this.setState({
        sessionId: uuid.v1(),
      });
    });
  };

  memFiltersSpans = memoizeOne((filtersList: IFilterList[], filterValues) => {
    if (filtersList) {
      let popupContainerForMenu = document.getElementById('body2');

      return filtersList.map((f1) => {
        let optionsList = (f1.values || []).map((v1) => ({ label: v1.name, value: v1.value }));
        // @ts-ignore
        let fv1 = filterValues && filterValues[f1.send_field || f1.sendField];
        let selectedOption = null;
        if (fv1 != null) {
          selectedOption = optionsList.find((o1) => o1.value === fv1);
        }
        selectedOption = selectedOption || { label: '', value: '' };

        return (
          <span key={'filter_' + f1.sendField + '_' + (f1 as any).send_field} style={{ display: 'inline-block' }}>
            <span
              css={`
                font-family: Roboto;
                font-size: 12px;
                font-weight: bold;
                color: #d1e4f5;
                text-transform: uppercase;
              `}
              style={{ marginRight: '5px', marginLeft: '50px' }}
            >
              Inputs:
            </span>
            <span
              css={`
                font-family: Roboto;
                font-size: 12px;
                font-weight: bold;
                color: #d1e4f5;
                text-transform: uppercase;
              `}
              style={{ marginRight: '5px', marginLeft: '16px' }}
            >
              {f1.title + ':'}
            </span>
            <span style={{ width: '120px', display: 'inline-block' }}>
              <SelectExt value={selectedOption} options={optionsList} onChange={this.onChangeFilterValue.bind(this, f1)} menuPortalTarget={popupContainerForMenu} />
            </span>
          </span>
        );
      });
    }
  });

  memTestIdSel = memoizeOne((itemIds) => {
    if (itemIds) {
      if (this.state.itemIdsSel == null || this.state.itemIdsSel === '' || (itemIds && itemIds.length > 0 && itemIds.find((o1) => o1 === this.state.itemIdsSel) == null)) {
        if (itemIds && itemIds.length > 0) {
          setTimeout(() => {
            this.setState(
              {
                itemIdsSel: itemIds[0],
              },
              () => {
                this.refreshUrlWithParams();
              },
            );
          }, 0);
        }
      }
    }
  });

  memColumnList = memoizeOne((columnsList, bpData) => {
    if (bpData != null) {
      let kk = Object.keys(bpData ?? {});
      return kk ?? [];
    } else {
      return columnsList != null ? columnsList.map((c1) => c1.key).filter((c1) => c1 != null && c1 !== '') : null;
    }
  });

  memColumnListHistory = memoizeOne((columnsList) => {
    return columnsList != null ? columnsList.map((c1) => c1.key).filter((c1) => c1 != null && c1 !== '') : null;
  });

  memOptionsIds = memoizeOne((itemIds) => {
    if (itemIds) {
      return itemIds.map((id1) => ({ label: id1, value: id1 }));
    }
  });

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

  memOptionsDatasSel = memoizeOne((optionsTestDatas) => {
    if (optionsTestDatas && optionsTestDatas.length > 0) {
      if (this.state.selectedFieldValueId == null) {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }

          this.setState({
            selectedFieldValueId: optionsTestDatas[0].value,
          });
        }, 0);
      }
    }
  });

  memUserData: (userData: any) => { userColumns: ITableExtColumn[]; userDataSource: any[] } = memoizeOne((userData) => {
    let userColumns: ITableExtColumn[] = [];
    let userDataSource = [];
    if (userData != null && _.isObject(userData) && !_.isArray(userData)) {
      let kk = Object.keys(userData).sort();
      kk.some((k1) => {
        userColumns.push({
          title: k1,
          field: k1,
          render: (text, row, index) => {
            return (
              <span
                css={`
                  position: relative;
                  height: 44px;
                  overflow: hidden;
                  display: inline-block;
                `}
              >
                {text}
              </span>
            );
          },
        });
      });
      userDataSource = [userData].filter((userData) => Object.values(userData).reduce((acc, val) => acc || !!val, false));
    } else {
      userColumns = null;
      userDataSource = null;
    }

    return { userColumns, userDataSource };
  });

  memRestrictData: (restrictData: any) => { restrictColumns: ITableExtColumn[]; restrictDataSource: any[] } = memoizeOne((restrictData) => {
    let restrictColumns: ITableExtColumn[] = [];
    let restrictDataSource = [];
    if (restrictData != null && _.isObject(restrictData) && !_.isArray(restrictData)) {
      let kk = Object.keys(restrictData).sort();
      kk.some((k1) => {
        restrictColumns.push({
          title: k1,
          field: k1,
          render: (text, row, index) => {
            return (
              <span
                css={`
                  position: relative;
                  height: 44px;
                  overflow: hidden;
                  display: inline-block;
                `}
              >
                {text}
              </span>
            );
          },
        });
      });
      restrictDataSource = [restrictData];
    } else {
      restrictColumns = null;
      restrictDataSource = null;
    }
    return { restrictColumns, restrictDataSource };
  });

  onClickChangeDisplayType = (e) => {
    this.props.onChangeDisplayType?.(PredictionDisplayType.list_and_table);
  };

  render() {
    let { projects, projectId } = this.props;
    this.memProjectIdDiff(projectId);
    let foundProject1 = this.memProjectId(false)(projectId, projects);
    let requestId = this.calcRequestId();

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
    const testDataIdName = optionsTestDatasRes?.testIdName;
    if (!optionsTestDatas?.length && testDataIdName) {
      optionsTestDatas = optionsTestDatasRes?.resultTestDatas?.ids?.map((item) => ({ label: item[testDataIdName], value: item[testDataIdName] }));
    }
    this.memOptionsDatasSel(optionsTestDatas);
    let rangeDateByTestDataId: any = (optionsTestDatasRes ? optionsTestDatasRes.rangeDateByTestDataId : null) || {};

    // let testDataSel: any = this.memItemItself(rangeDateByTestDataId, this.state.itemIdsSel);

    let bpData = null;
    if (this.calcRequestBPId()) {
      bpData = rangeDateByTestDataId?.[optionsTestDatas?.[0]?.value]?.data;
    }

    let columnsList = optionsTestDatasRes ? this.memColumnList(optionsTestDatasRes.columns, bpData) : null;
    let columnsListHistory = optionsTestDatasRes ? this.memColumnListHistory(optionsTestDatasRes?.resultTestDatas?.displayInfo?.historyColumns) : null;
    if (columnsListHistory == null) {
      columnsListHistory = columnsList;
    }

    let filters = optionsTestDatasRes ? optionsTestDatasRes.filters : null;
    let sendParams = optionsTestDatasRes?.sendParams;

    let itemIds = optionsTestDatasRes?.resultTestDatas?.itemIds;
    if (this.calcRequestBPId() && optionsTestDatas?.[0]?.value) {
      itemIds = [optionsTestDatas?.[0]?.value];
    }

    let showItemIds = this.props.showItems && itemIds != null && _.isArray(itemIds) && itemIds.length > 0;
    let optionItemIds = showItemIds ? this.memOptionsIds(itemIds) : null;
    let optionItemIdsSel = this.props.showItems && this.state.itemIdsSel ? optionItemIds?.find((o1) => o1.value === this.state.itemIdsSel) : null;
    if (!optionItemIdsSel && this.props.showItems) {
      this.memTestIdSel(itemIds);
      if (this.state.itemIdsSel != null && this.state.itemIdsSel !== '') {
        optionItemIdsSel = { label: this.state.itemIdsSel, value: this.state.itemIdsSel };
      } else {
        optionItemIdsSel = { label: 'Enter value or choose one', value: null };
      }
    }
    if (requestId != null) {
      optionItemIdsSel = { label: this.state.itemIdsSel, value: this.state.itemIdsSel };
    }

    let testDatasSelectValue = optionsTestDatas && optionsTestDatas.find((o1) => o1.value == this.state.selectedFieldValueId);
    if (testDatasSelectValue == null) {
      if (this.state.selectedFieldValueId != null && this.state.selectedFieldValueId !== '') {
        testDatasSelectValue = { label: this.state.selectedFieldValueId, value: this.state.selectedFieldValueId };
      } else {
        testDatasSelectValue = { label: '', value: null };
      }
    }

    //
    let { defDatasets } = this.props;
    let optionsField = this.memOptionsField(false)(foundProject1, defDatasets);
    let fieldSelectValue = optionsField && optionsField.find((o1) => o1.value === this.state.selectedFieldId);
    if (requestId != null) {
      fieldSelectValue = { label: this.state.forceUserIdSel, value: this.state.forceUserIdSel };
    }

    //
    const topHH = 180;

    if (!this.state.resultError) {
      this.memGetModelTablesData(
        this.props.showItems,
        this.props.useCaseInfo,
        projectId,
        algoSelectValue && algoSelectValue.value,
        this.calcSelectedFieldValueId(),
        this.state.sessionId,
        columnsList,
        columnsListHistory,
        filters,
        sendParams,
        this.state.itemIdsSel,
        this.calcRequestId(),
      );
    }

    let menuPortalTarget = popupContainerForMenu(null);

    let isRefreshingChart = this.state.isRefreshingChart;

    //Tables
    const topNameTable = 50;
    let topHHitemItems = 130,
      topHHitemUser = 170;

    let rowsCountL = 0,
      columnsCountL = 0;
    let rowsCountR = 0,
      columnsCountR = 0;

    let itemColumns: ITableExtColumn[] = [];
    let itemDataSource = [];

    let tablesRes = this.memTablesProcess(this.state.tablesData);

    const userData = tablesRes?.dataUser;
    let { userColumns, userDataSource } = this.memUserData(userData) ?? {};

    const restrictData = tablesRes?.dataRestricts;
    let { restrictColumns, restrictDataSource } = this.memRestrictData(restrictData) ?? {};

    if (userDataSource == null && restrictDataSource == null) {
      topHHitemUser = 0;
    }

    if (tablesRes) {
      if (tablesRes.columns) {
        columnsCountL = tablesRes.columns.length;
        columnsCountR = tablesRes.columns.length;
      }
      if (tablesRes.columnsHistory) {
        columnsCountL = tablesRes.columnsHistory.length;
      }

      if (tablesRes.dataHistory) {
        rowsCountL = tablesRes.dataHistory.length + 1;
      }
      if (tablesRes.dataPredictions) {
        rowsCountR = tablesRes.dataPredictions.length + 1;
      }

      if (this.props.showItems && tablesRes.dataItem && tablesRes.columns) {
        itemColumns = tablesRes.columns.map(
          (c1) =>
            ({
              field: c1,
              title: c1,
            } as ITableExtColumn),
        );

        let dataItem = tablesRes.dataItem,
          findAnyData = false;
        if (dataItem && _.isObject(dataItem)) {
          if (Object.keys(dataItem).find((k1) => dataItem[k1] != null) != null) {
            findAnyData = true;
            itemDataSource = [dataItem ?? {}];
          }
        }
        if (!findAnyData) {
          itemColumns = null;
          itemDataSource = null;
          topHHitemItems = 0;
        }
      } else {
        itemColumns = null;
        itemDataSource = null;
        topHHitemItems = 0;
      }
    } else {
      itemColumns = null;
      itemDataSource = null;
      topHHitemItems = 0;
    }

    let topHHitem = topHHitemItems + topHHitemUser;

    const borderAAA = Constants.lineColor(); //Utils.colorA(0.3);
    const STYLEL0 = {
      position: 'absolute',
      top: topNameTable + topHHitem + 'px',
      left: 0,
    };
    const STYLEL = {
      backgroundColor: Constants.navBackDarkColor(),
      // border: '1px solid '+Utils.colorA(0.2),
      outline: 'none',
      overflow: 'hidden',
      fontSize: '14px',
      fontFamily: 'Matter',

      position: 'absolute',
      top: 0,
      left: 0,
    };
    const STYLER0 = {
      position: 'absolute',
      top: topNameTable + topHHitem + 'px',
      right: 0,
    };
    const STYLER = {
      backgroundColor: Constants.navBackDarkColor(),
      // border: '1px solid '+Utils.colorA(0.2),
      outline: 'none',
      overflow: 'hidden',
      fontSize: '14px',
      fontFamily: 'Matter',

      position: 'absolute',
      top: 0,
      right: 0,
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
    const STYLE_TOP_RIGHT_GRIDR = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      // textTransform: 'uppercase',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: '#23305e',
    };
    let STYLE_TOP_RIGHT_GRIDL = _.assign({}, STYLE_TOP_RIGHT_GRIDR, { borderRight: '2px solid ' + borderAAA });
    const STYLE_BOTTOM_RIGHT_GRIDR = {
      outline: 'none',
      backgroundColor: '#19232f',
    };
    let STYLE_BOTTOM_RIGHT_GRIDL = _.assign({}, STYLE_BOTTOM_RIGHT_GRIDR, { borderRight: '2px solid ' + borderAAA });

    let filterSpans = this.memFiltersSpans(filters, this.props.filterValues);

    let testIdName = null;
    if (this.props.useCaseInfo != null) {
      testIdName = this.props.useCaseInfo?.uiCustom?.predict_item_name;
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
        <SelectExt isDisabled={requestId != null} value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
      </span>
    );

    return (
      <div style={{ margin: '25px 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <AutoSizer>
          {({ width, height }) => {
            const wwG = Math.trunc((width - 2 * 25 - 15) / 2);
            this.withGrid = wwG;

            return (
              <div style={{ height: height + 'px', width: width + 'px' }}>
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
                    Retrieving...
                  </div>
                )}

                {isRefreshing !== true && foundProject1 && (
                  <div style={{ minHeight: '600px', padding: '25px 30px' }} className={sd.grayPanel}>
                    <div style={{ textAlign: 'center', paddingTop: '10px', marginBottom: '10px' }}>
                      {false && (
                        <span style={{ flex: '0', whiteSpace: 'nowrap', marginRight: '30px' }}>
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
                            Deployment:
                          </span>
                          <span style={{ width: '220px', display: 'inline-block' }}>
                            <SelectExt value={algoSelectValue} options={optionsAlgo} onChange={this.onChangeSelectAlgo} isSearchable={false} menuPortalTarget={menuPortalTarget} />
                          </span>
                        </span>
                      )}

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
                        {(optionsTestDatasRes?.testIdName || testIdName || (foundProject1 ? foundProject1.name : null) || 'User ID') + ':'}
                      </span>
                      <span style={{ display: 'none', width: '200px' }}>
                        <SelectExt value={fieldSelectValue} options={optionsField} onChange={this.onChangeSelectField} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                      </span>
                      <span style={{ display: 'inline-block', marginRight: '30px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {requestId == null && (
                            <span style={{ width: '200px', display: 'inline-block' }}>
                              <SelectExt allowCreate={false} value={testDatasSelectValue} options={optionsTestDatas} onChange={this.onChangeSelectFieldValue} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                            </span>
                          )}
                          {requestId == null && (
                            <span
                              css={`
                                margin-left: 5px;
                              `}
                            >
                              <CopyText noText>{testDatasSelectValue?.value}</CopyText>
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
                          <span style={{ width: '200px', display: 'inline-block' }}>
                            <Input
                              disabled={requestId != null}
                              placeholder={'Enter a value'}
                              style={{ height: '35px', borderRadius: 0 }}
                              value={requestId != null ? this.state.forceUserIdSel : this.state.selectedFieldValueId2Bounce}
                              onChange={this.onChangeSelectedFieldValueId2}
                            />
                          </span>
                          <Button disabled={requestId != null} className={sd.detailbuttonblueBorder} style={{ height: '35px', marginLeft: '5px' }} ghost onClick={this.onClickSelectedFieldValueId2}>
                            Go
                          </Button>
                          <HelpIcon id={'pred_personalization_go'} style={{ marginLeft: '4px' }} />

                          {this.props.allowChangeDisplayType && !requestId && (
                            <span
                              css={`
                                margin-left: 20px;
                              `}
                            >
                              <Button ghost type={'primary'} onClick={this.onClickChangeDisplayType}>
                                Show Reranking Dashboard
                              </Button>
                            </span>
                          )}
                        </div>
                      </span>
                      {showItemIds && <span style={{ opacity: 0.8, marginRight: '5px' }}>{'Item ID:'}</span>}
                      {showItemIds && (
                        <span style={{ width: '120px', display: 'inline-block' }}>
                          <SelectExt isDisabled={requestId != null} allowCreate={true} value={optionItemIdsSel} options={optionItemIds} onChange={this.onChangeSelectItemIds} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                        </span>
                      )}
                      {showItemIds && (
                        <span
                          css={`
                            margin-left: 5px;
                          `}
                        >
                          <CopyText noText>{optionItemIdsSel?.value}</CopyText>
                        </span>
                      )}
                      {filterSpans}
                    </div>

                    <div style={{ position: 'relative', textAlign: 'center', borderTop: '1px solid ' + Utils.colorA(0.2), paddingTop: '10px', marginBottom: '10px', height: height - topHH + 'px' }}>
                      <RefreshAndProgress isRefreshing={isRefreshingChart} errorMsg={this.state.resultError}>
                        {this.props.showItems && itemColumns != null && itemDataSource != null && (
                          <div className={''} style={{ position: 'absolute', fontSize: '18px', top: 11 + 'px', left: 0, right: 0, height: topHHitemItems + 'px' }}>
                            <TableExt dataSource={itemDataSource} columns={itemColumns} calcKey={(r1) => r1.apiKeyId} />
                          </div>
                        )}
                        {(userDataSource != null || restrictDataSource != null) && (
                          <div className={''} style={{ position: 'absolute', fontSize: '18px', top: 11 + topHHitemItems + 'px', left: 0, right: 0, height: topHHitemUser + 'px' }}>
                            {userDataSource != null && (
                              <div
                                css={`
                                  position: absolute;
                                  top: 0;
                                  left: 0;
                                  bottom: 0;
                                  width: ${restrictDataSource == null ? '100%' : '50%'};
                                  margin-right: ${restrictDataSource == null ? 0 : 5}px;
                                `}
                              >
                                <div
                                  css={`
                                    font-size: 18px;
                                    text-align: left;
                                    margin-bottom: 10px;
                                  `}
                                  className={sd.titleTopHeaderAfter}
                                >
                                  User Data
                                </div>
                                <TableExt disableSort dataSource={userDataSource} columns={userColumns} calcKey={(r1) => r1.userId} height={120} />
                              </div>
                            )}
                            {restrictDataSource != null && (
                              <div
                                css={`
                                  position: absolute;
                                  top: 0;
                                  left: ${userDataSource == null ? 0 : '50%'};
                                  bottom: 0;
                                  width: ${userDataSource == null ? '100%' : '50%'};
                                  margin-left: ${userDataSource == null ? 0 : 5}px;
                                `}
                              >
                                <div
                                  css={`
                                    font-size: 18px;
                                    text-align: left;
                                    margin-bottom: 10px;
                                  `}
                                  className={sd.titleTopHeaderAfter}
                                >
                                  Restricts
                                </div>
                                <TableExt disableSort dataSource={restrictDataSource} columns={restrictColumns} calcKey={(r1) => r1.userId} height={120} />
                              </div>
                            )}
                          </div>
                        )}

                        <div className={sd.titleTopHeaderAfter} style={{ position: 'absolute', fontSize: '18px', top: 11 + topHHitem + 'px', left: 0 }}>
                          History
                        </div>
                        <div className={sd.titleTopHeaderAfter} style={{ position: 'absolute', fontSize: '18px', top: topHHitem + 11 + 'px', left: '50%', paddingLeft: '3px' }}>
                          Predictions
                        </div>

                        <div
                          onMouseLeave={this.onRowMouseLeaveL}
                          style={_.assign({}, STYLEL0, { overflow: 'hidden', borderRadius: '8px', height: height - topHH - topNameTable - topHHitem + 'px', width: Math.trunc((width - 2 * 25 - 15) / 2) + 'px' }) as CSSProperties}
                        >
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
                            fixedColumnCount={1}
                            overscanRowCount={40}
                            overscanColumnCount={5}
                            style={STYLEL}
                            styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                            styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                            styleTopRightGrid={STYLE_TOP_RIGHT_GRIDL}
                            styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRIDL}
                            columnCount={columnsCountL + 1}
                            columnWidth={this.gridColumnWidthL}
                            height={height - topHH - topNameTable - topHHitem}
                            rowCount={rowsCountL}
                            rowHeight={cellHH}
                            width={Math.trunc((width - 2 * 25 - 15) / 2)}
                          />
                        </div>

                        <div
                          onMouseLeave={this.onRowMouseLeaveR}
                          style={_.assign({}, STYLER0, { overflow: 'hidden', borderRadius: '8px', height: height - topHH - topNameTable - topHHitem + 'px', width: Math.trunc((width - 2 * 25 - 15) / 2) + 'px' }) as CSSProperties}
                        >
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
                            fixedColumnCount={1}
                            overscanRowCount={40}
                            overscanColumnCount={5}
                            style={STYLER}
                            styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                            styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                            styleTopRightGrid={STYLE_TOP_RIGHT_GRIDR}
                            styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRIDR}
                            columnCount={columnsCountR + 1}
                            columnWidth={this.gridColumnWidthR}
                            height={height - topHH - topNameTable - topHHitem}
                            rowCount={rowsCountR}
                            rowHeight={cellHH}
                            width={Math.trunc((width - 2 * 25 - 15) / 2)}
                          />
                        </div>
                      </RefreshAndProgress>
                    </div>
                  </div>
                )}
              </div>
            );
          }}
        </AutoSizer>
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
    useCases: state.useCases,
    requests: state.requests,
  }),
  null,
)(ModelPredictionsPersonalizationOne);
