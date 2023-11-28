import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TableSortLabel from '@mui/material/TableSortLabel';
import Button from 'antd/lib/button';
import DatePicker from 'antd/lib/date-picker';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Popover from 'antd/lib/popover';
import Radio from 'antd/lib/radio';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
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
import ExpandPanel from '../ExpandPanel/ExpandPanel';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import HelpIcon from '../HelpIcon/HelpIcon';
import { IModelPropsCommon } from '../ModelPredictionCommon/ModelPredictionCommon';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import { intRowIndex, isEqualAllSmart } from './PredEqualSmart';
const s = require('./ModelPredictionsRegressionOne.module.css');
const sd = require('../antdUseDark.module.css');
const RangePicker = DatePicker.RangePicker;

const cellHH = 54;
const sepArray = '___###___';

export interface IFilterOneProps {
  defaultValue?: () => any;
  onSet?: (value?: any) => void;
  onCancel?: () => void;
  onClear?: () => void;
  topTenValuesMap?: any[];
  noFilter?: boolean;
  onClickTopMore?: (chartData?) => void;
  allListColumns?: any;

  columnName?: string;
  fgId?: string;
  fgVersion?: string;
}

export const FilterOne = React.memo((props: PropsWithChildren<IFilterOneProps>) => {
  const [value, setValue] = useState(props.defaultValue?.() ?? '');
  const refInput = useRef(null);

  const onClickSet = (e) => {
    props.onSet?.(value);
  };

  const onClickCancel = (e) => {
    props.onCancel?.();
  };

  const onClickClear = (e) => {
    props.onClear?.();
  };

  useEffect(() => {
    refInput.current?.focus();
  }, []);

  const onKeyPressInput = (e) => {
    if (e.key?.toLowerCase() === 'enter') {
      onClickSet(e);
    }
  };

  const onClickFilterByValue = (v1, e) => {
    setValue(v1);
    props.onSet?.(v1);
  };

  const [chartData, setChartData] = useState(null);
  useEffect(() => {
    if (props.noFilter && props.columnName && props.fgVersion && props.allListColumns) {
      let list = props.allListColumns;
      if (list != null && _.isArray(list)) {
        let ind1 = _.findIndex(list, (r1) => r1[0] === props.columnName);
        if (ind1 > -1) {
          REClient_.client_().getFeatureGroupVersionMetricsData(null, props.fgVersion, ind1, ind1, 0, 100, null, null, (err, res) => {
            let data1 = res?.result?.data?.[0];
            data1?.some((d1: any) => {
              if (_.isObject(d1) && (d1 as any)?.isBar != null && (d1 as any)?.data != null) {
                setChartData(d1);
              }
            });
          });
        }
      }
    }
  }, [props.noFilter, props.columnName, props.fgVersion]);

  const chartElem = useMemo(() => {
    if (chartData) {
      let data1 = { ...(chartData ?? {}) };
      data1.gridColor = 'rgba(255,255,255,0.3)';
      data1?.data?.some((d1) => {
        if (_.isNumber(d1.y)) {
          d1.y = Utils.decimals(d1.y, 6);
        }
      });
      return <ChartXYExt lineFilled useEC data={data1} noTitles={true} height={80} type={'line'} colorIndex={0} />;
    }
  }, [chartData]);

  const onClickTopMore = (e) => {
    props.onCancel?.();

    setChartData((d1) => {
      props.onClickTopMore?.(d1);

      return d1;
    });
  };

  const showMoreTop = props.noFilter && props.columnName && props.fgVersion && chartData != null;

  return (
    <div
      css={`
        color: white;
        border-radius: 1px;
      `}
    >
      <div
        css={`
          font-family: Matter;
          font-size: 16px;
          line-height: 2;
          color: white;
          margin: 5px 0;
          border-bottom: 1px solid white;
        `}
      >
        {props.noFilter ? 'Attributes' : 'Attribute Search'}
      </div>
      {props.topTenValuesMap != null && props.topTenValuesMap?.length > 0 && (
        <div
          css={`
            margin-bottom: 4px;
            margin-top: 14px;
            max-width: 200px;
          `}
        >
          <span
            css={`
              margin-right: 5px;
            `}
          >
            Top:
          </span>
          {props.topTenValuesMap?.map((s1, s1ind) => {
            return (
              <span key={'f' + s1 + s1ind}>
                {s1ind > 0 ? (
                  <span
                    css={`
                      opacity: 0.7;
                    `}
                  >
                    ,{' '}
                  </span>
                ) : null}
                <span className={sd.linkBlue} onClick={onClickFilterByValue.bind(null, s1)}>
                  {'"'}
                  {s1}
                  {'"'}
                </span>
              </span>
            );
          })}
          {showMoreTop && (
            <span
              css={`
                opacity: 0.7;
              `}
            >
              ,{' '}
            </span>
          )}
          {showMoreTop && (
            <span
              onClick={onClickTopMore}
              className={sd.linkBlue}
              css={`
                cursor: pointer;
              `}
            >
              more
            </span>
          )}
        </div>
      )}
      {(!props.noFilter || props.topTenValuesMap != null) && (
        <div
          css={`
            text-align: center;
            margin-top: 20px;
            display: flex;
            align-items: center;
            margin-bottom: 1px;
            justify-content: center;
          `}
        >
          {!props.noFilter && (
            <span
              css={`
                font-family: Roboto;
                font-size: 12px;
                letter-spacing: 1.12px;
                color: white;
              `}
            >
              Search Term:
            </span>
          )}
          {!props.noFilter && (
            <span
              css={`
                flex: 1;
              `}
            ></span>
          )}
          {props.topTenValuesMap != null && (
            <span
              onClick={onClickClear}
              css={`
                cursor: pointer;
                font-family: Matter;
                font-size: 14px;
                font-weight: 600;
                color: white;
              `}
            >
              Clear
            </span>
          )}
        </div>
      )}
      {chartElem != null && (
        <div
          css={`
            width: 180px;
            margin-top: 14px;
          `}
        >
          {chartElem}
        </div>
      )}
      {!props.noFilter && (
        <div>
          <span
            css={`
              width: 100%;
            `}
          >
            <Input
              onKeyPress={onKeyPressInput}
              ref={refInput}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
            />
          </span>
        </div>
      )}
      {!props.noFilter && (
        <div
          css={`
            margin-top: 20px;
          `}
        >
          <Button
            css={`
              width: 100%;
            `}
            type={'primary'}
            onClick={onClickSet}
          >
            Set
          </Button>
          <Button
            css={`
              margin-top: 8px;
              width: 100%;
            `}
            type={'default'}
            ghost
            onClick={onClickCancel}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
});

const ExplDesc = {
  KERNEL_EXPLAINER: 'Kernel Explanations',
  TREE_EXPLAINER: 'Tree Explanations',
  LIME_EXPLAINER: 'Lime Explanations',
  EBM_EXPLAINER: 'Abacus Simple Explainer',
};

interface IModelPredictionsRegressionOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;
  deployments?: any;
  requests?: any;

  projectId?: string;
}

interface IModelPredictionsRegressionOneState {
  datasetIdSel?: string;
  selectedFieldValueId?: string;

  dataGridList?: any;
  dataGridListFiltered?: any;
  sortByField?: any;
  sortOrderIsAsc?: any;
  predictData?: any;
  resultActual?: any;
  resultPredicted?: any;
  resultPredictedClass?: any;
  resultPredictedFields?: string[];
  resultPredictedFieldsSel?: string;
  resultPredictedFieldsName?: string;
  resultExplanations?: any;
  resultExplanationsText?: any;
  resultError?: string;
  isRefreshingResult?: boolean;
  isRefreshingExplanations?: boolean;
  hoveredRowIndex?: number;
  filterValuesPopoverVisible?: boolean;
  filterValues?: { fieldIndex?: number; value?: any }[];

  resultExplanationsNested?: any;
  resultExplanationsTextNested?: any;
  isShowNested?: boolean;
  nestedColSel?: string;

  explTypeSel?: string;
  explTypes?: string[];

  fixedFeatures?: string[];

  showGrid?: boolean;
}

class ModelPredictionsRegressionOne extends React.PureComponent<IModelPredictionsRegressionOneProps & IModelPropsCommon, IModelPredictionsRegressionOneState> {
  private unDark: any;
  private isM: boolean;
  private lastProjectId?: string;
  private lastCallPredictData: any;
  private dontusePrefix: any;
  formRef = React.createRef<FormInstance>();
  formPredicted = React.createRef<FormInstance>();
  formActual = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshingResult: false,
      isRefreshingExplanations: false,
      showGrid: false,
      isShowNested: false,
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

  componentDidUpdate(prevProps: Readonly<IModelPredictionsRegressionOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsRegressionOneState>, snapshot?: any) {
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

  memChangeRefresh = memoizeOne((selectedAlgoId) => {
    this.lastProjectId = undefined;
    this.lastCallPredictData = undefined;
    this.lastSelectedAlgoId = undefined;
    this.lastUsedPredRow = undefined;
    this.lastReqOneUsed = undefined;

    this.setState({
      predictData: null,
      resultActual: null,
      resultPredicted: null,
      resultPredictedClass: null,
      resultExplanations: null,
      resultExplanationsText: null,
      resultExplanationsNested: null,
      resultExplanationsTextNested: null,
      isShowNested: false,
      nestedColSel: null,
      resultError: null,
      resultPredictedFieldsSel: null,
      fixedFeatures: null,
    });
  });

  memDeployChange = memoizeOne((deployId) => {
    if (!deployId) {
      this.setState({
        explTypes: null,
      });
      return;
    }

    REClient_.client_()._getModelInfo(deployId, (err, res) => {
      let rr = res?.result?.supportedExplainerTypes;
      if (rr != null && !_.isArray(rr)) {
        rr = null;
      }
      this.setState({
        explTypes: rr ?? [],
      });
    });
  });

  lastReqOneUsed = null;
  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let { projects, projectId } = this.props;

    this.memDeployChange(this.props.selectedAlgoId);
    if (this.state.explTypes == null) {
      return;
    }

    this.memChangeRefresh(this.props.selectedAlgoId);

    let foundProject1 = this.memProjectId(true)(projectId, projects);

    this.memPredictFields(true)(this.state.resultPredicted, this.state.resultExplanations);

    this.memModelChanged(this.props.selectedAlgoId);

    this.memDeployOne(true)(this.props.deployments, projectId, this.props.selectedAlgoId);

    let nestedCols = this.memCalcNestedColumns(this.state.predictData);
    if (this.state.isShowNested) {
      this.memPredictCallNested(this.state.nestedColSel, nestedCols, this.lastUsedPredRow);
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

  memPredictCallNested = memoizeOne((nestedColSel, nestedCols, predictData) => {
    if (Utils.isNullOrEmpty(nestedColSel)) {
      nestedColSel = nestedCols?.[0];
    }
    if (Utils.isNullOrEmpty(nestedColSel)) {
      return;
    }

    if (this.calcRequestId() != null || this.calcRequestBPId() != null) {
      return;
    }

    if (predictData && !_.isEmpty(predictData)) {
      if (this.state.resultExplanationsNested?.[nestedColSel] != null) {
        return;
      }

      this.showPrediction(predictData, true, nestedColSel);
    }
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
        resultPredictedClass: null,
        resultExplanations: null,
        resultExplanationsText: null,
        resultExplanationsNested: null,
        resultExplanationsTextNested: null,
        isShowNested: false,
        nestedColSel: null,
        resultError: null,
        resultPredictedFieldsSel: null,
        fixedFeatures: null,
      });
    }
    this.lastSelectedAlgoId = selectedAlgoId;
  });

  memPredictFields = memoizeOneCurry((doCall, resultPredicted, resultExplanations) => {
    if (resultPredicted) {
      if (_.isObject(resultPredicted)) {
        let ff = Object.keys(resultPredicted);
        let first = ff[0];

        let predictData1 = resultPredicted[first || '-'] || {};
        let kkPre = Object.keys(predictData1);

        if (kkPre[0] && this.state.resultPredictedFieldsName !== kkPre[0]) {
          this.setState({
            resultPredictedFieldsName: kkPre[0],
          });
        }

        let predictDataUse = predictData1[kkPre[0] || '-'];
        let kk;
        if (_.isNumber(predictDataUse)) {
          kk = kkPre;
          predictDataUse = predictData1;
        } else {
          kk = Object.keys(predictDataUse || {});
        }
        if (doCall) {
          if (kk && kk.length > 0 && (this.state.resultPredictedFieldsSel == null || !kk.includes(this.state.resultPredictedFieldsSel))) {
            let maxKey = null,
              maxV = null;
            kk.some((k1) => {
              if (maxKey == null || (predictDataUse[k1] ?? 0) > maxV) {
                maxKey = k1;
                maxV = predictDataUse[k1] ?? 0;
              }
            });
            if (this.state.resultPredictedClass != null) {
              let c1 = Object.values(this.state.resultPredictedClass)?.[0];
              if (!Utils.isNullOrEmpty(c1)) {
                maxKey = c1;
              }
            }

            if (this.state.resultPredictedFieldsSel !== maxKey) {
              this.setState({
                resultPredictedFieldsSel: maxKey,
              });
            }
          }

          kk.sort((a, b) => {
            return (predictDataUse[b] ?? 0) - (predictDataUse[a] ?? 0);
          });

          if (!_.isEqual(this.state.resultPredictedFields, kk)) {
            this.setState({
              resultPredictedFields: kk,
            });
          }
        }
      }
    }
  });

  onChangeSelectFieldKey = (optionSel) => {
    this.setState({
      resultPredictedFieldsSel: optionSel ? optionSel.value : null,
    });
  };

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
    //TODO
  };

  gridColumnWidth = (isPredProb, { index }) => {
    if (isPredProb != null) {
      if (index < isPredProb.length) {
        return 110;
      } else {
        index -= (isPredProb?.length ?? 0) + 1;
      }
    }

    if (index === 0) {
      return 80;
    }
    if (index === 1) {
      return 110;
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

  memColumns = memoizeOne((isPredProb, columnsDisplay: { key: string; dataType: string; expand?: boolean }[]) => {
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
            width: this.gridColumnWidth(isPredProb, { index: colIndex }),
            dataType: f1.dataType,
            expand: f1.expand,
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

  cellRenderer = (
    isPredProb,
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
              if (isPredProb != null) {
                if (col < isPredProb.length) {
                  let data2 = optionsTestDatasRes.resultTestDatas?.ids?.[data1?.[intRowIndex] ?? row] ?? {};
                  return { value: data2?.[isPredProb[col]], data1 };
                } else {
                  col -= isPredProb?.length ?? 0;
                }
              }

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
      } else if (isPredProb != null && columnIndex - 1 < isPredProb.length) {
        content = isPredProb?.[columnIndex - 1];
      } else if (columnIndex === 1 + (isPredProb == null ? 0 : isPredProb.length)) {
        content = 'Target';

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
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 2 - (isPredProb == null ? 0 : isPredProb.length));
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
          if (this.state.filterValues != null && !Utils.isNullOrEmpty(this.state.filterValues.find((v1) => v1.fieldIndex === columnIndex - (isPredProb?.length ?? 0))?.value)) {
            alreadyFilter = true;
          }

          let overlayFilter = (
            <div>
              <FilterOne
                defaultValue={() => {
                  let res = '';

                  let ff = this.state.filterValues;
                  if (ff != null) {
                    let f1 = ff.find((v1) => v1.fieldIndex === columnIndex - (isPredProb?.length ?? 0));
                    if (f1 != null) {
                      res = f1.value ?? '';
                    }
                  }

                  return res;
                }}
                onClear={this.onClickSetFilter.bind(this, columnIndex - (isPredProb?.length ?? 0), '')}
                onCancel={() => {
                  this.setState({ filterValuesPopoverVisible: null });
                }}
                onSet={this.onClickSetFilter.bind(this, columnIndex - (isPredProb?.length ?? 0))}
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
          if (isPredProb != null && columnIndex <= isPredProb.length) {
            filter1 = null;
          }

          let sortByField = this.state.sortByField;
          isSortType = true;
          content = (
            <TableSortLabel
              disabled={isPredProb == null ? undefined : columnIndex <= isPredProb.length}
              active={sortByField === columnIndex}
              direction={this.state.sortOrderIsAsc ? 'asc' : 'desc'}
              onClick={this.onSortHeaderClick.bind(this, columnIndex, isPredProb)}
            >
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
      } else if (columnIndex === 1 + (isPredProb == null ? 0 : isPredProb.length)) {
        let vdata = getValue(rowIndex - 1, 1);
        if (vdata) {
          data1 = vdata.data1;
        }
        let v1 = getValue(rowIndex - 1, null);
        content = v1?.actual ?? '';
      } else {
        let v1 = getValue(rowIndex - 1, columnIndex - 2 + (isPredProb != null && columnIndex - 2 < isPredProb.length ? 1 : 0));
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

  onSortHeaderClick = (columnIndex, isPredProb, e) => {
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
            if (columnIndex === 1 + (isPredProb == null ? 0 : isPredProb.length)) {
              let actual1 = optionsTestDatasRes.resultTestDatas?.ids?.[row[intRowIndex]]?.actual;
              return { value: actual1, data1, actual: actual1 };
            } else {
              if (isPredProb != null) {
                if (columnIndex < isPredProb.length) {
                  let data2 = optionsTestDatasRes.resultTestDatas?.ids?.[data1?.[intRowIndex] ?? row] ?? {};
                  return { value: data2?.[isPredProb[columnIndex]] };
                } else {
                  columnIndex -= isPredProb?.length ?? 0;
                }
              }

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
  showPrediction = (row, onlyExplanations = false, nested = null) => {
    if (row == null) {
      return;
    }

    if (this.lastUsedPredRow != null && _.isEqual(this.lastUsedPredRow, row) && !onlyExplanations && !nested) {
      return;
    }
    if (!nested) {
      this.lastUsedPredRow = row;
    }

    onlyExplanations = onlyExplanations === true;

    //
    if (!onlyExplanations && this.calcRequestId() == null /* && this.calcRequestBPId()==null*/) {
      if (nested) {
        return;
      }
      if (this.state.explTypes == null || this.state.explTypes?.length === 0) {
        //
      } else {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }

          this.showPrediction(row, true);
        }, 200);
      }
    }

    if (!onlyExplanations) {
      if (row != null) {
        row = { ...row };
        delete row[intRowIndex];
      }

      this.setState({
        predictData: row,
        isRefreshingResult: true,
        resultActual: null,
        resultPredicted: null,
        resultPredictedClass: null,
        resultExplanations: null,
        resultExplanationsText: null,
        resultExplanationsNested: null,
        resultExplanationsTextNested: null,
        isShowNested: false,
        nestedColSel: null,
        resultError: null,
        resultPredictedFieldsSel: null,
        fixedFeatures: null,
      });

      this.lastCallPredictData = uuid.v1();
    } else {
      this.setState({
        isRefreshingExplanations: true,
      });
    }

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
    let dataParams: any = { queryData: JSON.stringify(row) };

    let extraParams: any = null;
    if (!onlyExplanations && this.calcRequestId() == null /* && this.calcRequestBPId()==null*/) {
      extraParams = extraParams || {};
      extraParams.explainPredictions = false;
    } else if (onlyExplanations && this.calcRequestId() == null /* && this.calcRequestBPId()==null*/) {
      extraParams = extraParams || {};
      extraParams.explainPredictions = true;

      if (this.state.explTypeSel != null) {
        extraParams.explainerType = this.state.explTypeSel;
      }

      if (nested) {
        extraParams.nested = nested;
      } else {
        if (this.state.fixedFeatures != null && this.state.fixedFeatures.length > 0) {
          extraParams.fixedFeatures = JSON.stringify(this.state.fixedFeatures);
        }
      }
    }

    REClient_.client_()._predictForUI_predictClass(this.props.selectedAlgoId, dataParams, extraParams, this.calcRequestId(), (err, res) => {
      if (this.lastCallPredictData !== uuid1) {
        return;
      }

      this.setState({
        isRefreshingResult: false,
      });
      if (onlyExplanations) {
        this.setState({
          isRefreshingExplanations: false,
        });
      }

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
        if (onlyExplanations) {
          let explanations = res?.result?.explanations;
          let explanationsText = {};
          let kk = Object.keys(explanations ?? {});
          kk.some((k1) => {
            let e1 = explanations[k1];
            if (e1 == null) {
              return false;
            }

            let kk2 = Object.keys(e1);
            kk2.some((k2) => {
              let e2 = e1[k2];

              if (!_.isNumber(e2) && !_.isString(e2) && _.isObject(e2)) {
                let ww = (e2 as any)?.important_words ?? [];
                let v1 = (e2 as any)?.importance ?? 0;

                explanationsText[k1] = explanationsText[k1] ?? {};
                explanationsText[k1][k2] = ww;

                e1[k2] = v1;
              }
            });
          });
          if (_.isEmpty(explanationsText)) {
            explanationsText = null;
          }

          if (nested) {
            let resultExplanationsNested = { ...(this.state.resultExplanationsNested ?? {}) };
            resultExplanationsNested[nested] = explanations;
            let resultExplanationsTextNested = { ...(this.state.resultExplanationsTextNested ?? {}) };
            resultExplanationsTextNested[nested] = explanationsText;

            this.setState({
              resultExplanationsNested,
              resultExplanationsTextNested,
            });
          } else {
            this.setState({
              resultExplanations: explanations,
              resultExplanationsText: explanationsText,
            });
          }
          return;
        }

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

        if (!onlyExplanations) {
          let predictedOne = res?.result?.predicted;
          let predictedClass1 = null;
          if (predictedOne?.result != null && predictedOne?.all_labels != null) {
            predictedClass1 = predictedOne?.result_class;
            predictedOne = predictedOne?.result;
          }

          this.setState({
            resultActual: actual,
            resultPredicted: predictedOne,
            resultPredictedClass: predictedClass1,
            resultError: null,
          });
        }
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
                this.showPrediction(data1);
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
    this.formRef?.current?.submit();
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

  renderObjectToFields: (list, nameForm, dataClass?) => { dataList?; list; initialValues } = (list, nameForm = '', dataClass = null) => {
    let res = [],
      initialValues = {};

    if (list != null && !_.isArray(list) && _.isObject(list)) {
      list = [list];
    }

    let dataList = [],
      labels = [];

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

            //move resultPredictedClass value to the left of chart
            let classV = this.state.resultPredictedClass;
            let classVvalue = classV?.[Object.keys(classV ?? {})?.[0]];
            if (classVvalue != null) {
              let ind1 = _.findIndex(vv ?? [], (s1) => s1.name === classVvalue);
              if (ind1 > -1 && vv != null) {
                let o2 = vv[ind1];
                if (o2 != null) {
                  vv.splice(ind1, 1);
                  vv.unshift(o2);
                }
              }
            }

            vv?.slice(0, 5)?.some((v1) => {
              labels.push(v1.name);
              dataList.push({ meta: v1.name, value: v1.value });
            });

            let dataClassV = null;
            if (dataClass != null) {
              dataClassV = Object.values(dataClass)?.[0];
            }

            let maxV = null,
              maxName = null,
              dataListChart = [],
              maxClassV = null,
              maxClassName = null;
            dataList?.some((d1) => {
              if (!Utils.isNullOrEmpty(dataClassV)) {
                if (('' + dataClassV)?.toLowerCase() === ('' + d1.meta)?.toLowerCase()) {
                  maxClassV = d1.value;
                  maxClassName = d1.meta;
                }
              }
              if (maxV == null || d1.value > maxV) {
                maxV = d1.value;
                maxName = d1.meta;
              }

              dataListChart.push({
                x: d1.meta,
                y: d1.value,
              });
            });

            input = maxClassName ?? maxName;
            let input2 = maxClassV ?? maxV;

            const hHH = 260;
            let data1: any = {
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
              doRotate: true,
              forceToPrintAllLabels: true,
              divisorX: null,
              useTitles: true,
              titleY: 'Probability of Value',
              titleX: k1,
              tooltips: true,
              data: dataListChart,
              labels: labels,
            };

            let histogram = (
              <div style={{ position: 'relative', color: 'white', marginTop: '20px' }}>
                <div style={{ height: hHH + 'px', position: 'relative', width: '100%' }}>
                  <div style={{ margin: '0 10px', zIndex: 2, height: hHH + 'px', position: 'relative' }}>
                    <ChartXYExt axisYMin={0} useEC colorIndex={0} height={hHH} colorFixed={ColorsGradients} data={data1} type={'bar'} />
                  </div>
                </div>
              </div>
            );

            res.push(
              <div key={'v1ch' + k1 + input + '_' + input2} style={{ color: Utils.colorAall(1), marginTop: '10px' }}>
                <div>
                  {k1}:&nbsp;{input}
                </div>
                <div style={{ marginTop: '4px' }}>Probability:&nbsp;{Utils.decimals(input2, 6)}</div>
                <div>{histogram}</div>
              </div>,
            );
          } else {
            if (_.isNumber(v1)) {
              v1 = Utils.decimals(v1, 2);
            }

            // let inputName = this.dontusePrefix + nameForm + k1.replace(/[^a-zA-Z0-9]/, '');
            // initialValues[inputName] = v1;

            res.push(
              <div key={'v1ch' + k1 + v1} style={{ color: Utils.colorAall(1), marginTop: '10px' }}>
                <div>
                  {k1}:&nbsp;{v1}
                </div>
              </div>,
            );
          }
        });
      });
    }

    return { list: res.length === 0 ? null : res, initialValues, dataList };
  };

  memRenderActual = memoizeOne((data) => {
    return this.renderObjectToFields(data, 'actual');
  });

  memRenderPredicted = memoizeOne((data, dataClass) => {
    return this.renderObjectToFields(data, 'predicted', dataClass);
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

  memRenderForm = memoizeOne((resultPredicted, predictData, columns) => {
    if (predictData) {
      let res = [],
        resInitialValues = {};
      const processDict = (predictData, level = 0, tableName = null) => {
        let res = [];

        let keyTable = (tableName ?? []).join(sepArray);
        if (tableName != null && tableName.length > 0) {
          keyTable += sepArray;
        }

        let isDisabled = this.calcRequestId() != null;

        const kk = Object.keys(predictData ?? {});
        kk.some((c1, c1ind) => {
          let initV = predictData[c1];

          let input = null,
            inputName = '',
            inputInitialValue = null;
          // let field1 = this.getFieldFromIndex(c1ind);
          let type1 = null; //this.calcTypeFromField(field1);
          if (_.isNumber(initV)) {
            type1 = 'number';
          } else if (_.isString(initV) || initV == null) {
            type1 = 'string';
          } else if (_.isArray(initV)) {
            type1 = 'array';
          } else if (_.isObject(initV)) {
            type1 = 'dict';
          }

          let col1 = columns?.find((c0) => c0?.field === c1);
          const dataType1 = col1?.dataType;
          const isExpand = col1?.expand === true;

          let hasFeedback = true;
          let subTable = null;
          if (isExpand === true) {
            if (initV == null) {
              initV = '';
            }

            hasFeedback = false;
            inputName = c1;
            inputInitialValue = initV;
            input = (
              <Input.TextArea
                css={`
                  width: 100%;
                `}
                disabled={isDisabled}
                autoSize
              />
            );
          } else if (type1 === 'dict') {
            subTable = initV;
          } else if (type1 === 'array') {
            subTable = initV;
          } else if (type1 === 'string' || type1 === 'CATEGORICAL') {
            if (initV == null) {
              initV = '';
            }
            //
          } else if (type1 === 'number' || type1 === 'numeric' || type1?.toUpperCase() === 'NUMERICAL') {
            inputName = c1;
            inputInitialValue = initV;
            input = <InputNumber style={{ width: '100%' }} disabled={isDisabled} />;
            // } else if(type1==='TIMESTAMP') {
            //   inputName = c1;
            //   inputInitialValue = initV;
            //   input = <DatePicker />;
          } else {
            // console.log('no', c1, initV);
            return false;
          }

          let formItem = null;
          if (subTable == null) {
            if (input == null) {
              inputName = c1;
              if (_.isObject(initV)) {
                initV = null;
              }
              inputInitialValue = initV;
              input = <Input disabled={isDisabled} />;
            }

            if (inputName != null && inputInitialValue != null) {
              resInitialValues[keyTable + inputName] = inputInitialValue;
            }

            formItem = (
              <Form.Item name={keyTable + inputName} key={'field_' + keyTable + c1 + c1ind} style={{ marginBottom: '15px', marginTop: 0 }} hasFeedback={hasFeedback} label={<span style={{ color: Utils.colorAall(1) }}>{c1}</span>}>
                {input}
              </Form.Item>
            );
          } else if (initV != null && (!_.isEmpty(initV) || type1 === 'array')) {
            if (_.isArray(subTable)) {
              let resArr = [];
              subTable.some((s1, s1ind) => {
                let resSub = processDict(s1, level + 1, [...(tableName ?? []), '[-[' + c1, '[[[' + s1ind]);

                let formItem2 = (
                  <ExpandPanel key={'expb_' + c1ind + '_' + s1ind} name={'' + s1ind}>
                    {resSub}
                  </ExpandPanel>
                );

                resArr.push(formItem2);
              });

              formItem = (
                <ExpandPanel key={'expa_' + c1ind} name={c1} isExpanded={resArr.length > 0}>
                  {resArr}
                </ExpandPanel>
              );
            } else {
              let resSub = processDict(initV, level + 1, [...(tableName ?? []), c1]);

              formItem = (
                <ExpandPanel key={'exp_' + c1ind} name={c1}>
                  {resSub}
                </ExpandPanel>
              );
            }
          }

          if (formItem != null) {
            res.push(formItem);
          }
        });

        return res;
      };

      res = res.concat(processDict(predictData));

      if (res.length > 0) {
        setTimeout(() => {
          if (!this.isM) {
            return;
          }

          this.formRef.current?.setFieldsValue(resInitialValues);
        }, 0);
        return (
          <FormExt layout={'vertical'} key={uuid.v1()} ref={this.formRef} onFinish={this.handleSubmitForm} style={{ color: Utils.colorAall(1) }}>
            {res}
          </FormExt>
        );
      }
    }
  });

  onChangeIsShowNested = (e) => {
    this.setState({
      isShowNested: e.target.value,
    });
  };

  onChangeSelectNested = (option1) => {
    this.setState({
      nestedColSel: option1?.value,
    });
  };

  onClickFixFeature = (isAdd, fn1) => {
    if (this.lastUsedPredRow == null) {
      return;
    }

    let list = [...(this.state.fixedFeatures ?? [])];
    if (isAdd) {
      if (!list.includes(fn1)) {
        list.push(fn1);
        list = list.sort();
      }
    } else {
      list = list.filter((v1) => v1 !== fn1);
    }

    if (list.length === 0) {
      list = null;
    }

    this.setState(
      {
        fixedFeatures: list,
      },
      () => {
        this.showPrediction(this.lastUsedPredRow, true, undefined);
      },
    );
  };

  onChangeExplType = (e) => {
    let v1 = e.target.value;

    this.setState(
      {
        explTypeSel: v1,
        fixedFeatures: null,
      },
      () => {
        this.showPrediction(this.lastUsedPredRow, true);
      },
    );
  };

  memRenderSHAP = memoizeOne(
    (
      renderPredictedDataList,
      resultPredictedFields,
      resultPredictedFieldsSel,
      resultPredicted,
      predictData,
      resultExplanations,
      resultExplanationsText,
      columns,
      nestedCols,
      isShowNested,
      nestedColSel,
      resultExplanationsNested,
      resultExplanationsTextNested,
      fixedFeatures,
    ) => {
      const useTable = true;

      if (Utils.isNullOrEmpty(nestedColSel)) {
        nestedColSel = nestedCols?.[0];
      }

      if (isShowNested) {
        resultExplanations = resultExplanationsNested?.[nestedColSel];
        resultExplanationsText = resultExplanationsTextNested?.[nestedColSel];
      }

      if (useTable && (isShowNested || (resultExplanations != null && !_.isEmpty(resultExplanations)))) {
        if (resultPredicted && _.isArray(resultPredicted)) {
          resultPredicted = resultPredicted[0];
        }
        let featureNames: any = {},
          features: any = {};
        let maxKey = this.state.resultPredictedFieldsSel;
        let maxV = null;
        let first = null;
        if (resultPredicted) {
          if (_.isObject(resultPredicted)) {
            let ff = Object.keys(resultPredicted);
            first = ff[0];

            let predictData1 = resultPredicted[first || '-'] || {};

            let kk;
            if (_.isNumber(predictData1) || _.isString(predictData1)) {
              kk = ff;
              predictData1 = resultPredicted;
            } else {
              kk = Object.keys(predictData1);
            }
            kk.some((k1) => {
              if (k1 == maxKey) {
                maxV = predictData1[k1];
              }
            });
          }
        }

        let maxAbsV = null;
        // let columnsNames = columns?.map(c1 => c1.field)?.filter(v1 => !Utils.isNullOrEmpty(v1)) ?? [];

        // let usedJoin = false;
        let columnsNames = Object.keys(resultExplanations ?? {});

        const joinPrefix = 'JOIN: ';
        columnsNames.some((field1, c1ind) => {
          let initV = null;
          let field1Ori = field1;

          let fieldVisual = field1;
          let isJoin = false;
          let field1join = null;
          if (field1?.indexOf(';') > -1) {
            let field1Pre = field1.substring(0, field1?.indexOf(';'));
            field1join = field1.substring((field1Pre?.length ?? 0) + 1);
            field1 = field1Pre;
          }

          let rowsList = (predictData ?? {})?.[field1];
          if (_.isArray(rowsList)) {
            isJoin = true;
          }

          if (predictData && _.isString(field1)) {
            if (isJoin) {
              fieldVisual = field1Ori;
            }

            let rowsListData = null;
            if (rowsList != null) {
              rowsListData = rowsList[0];
              if (!_.isObject(rowsListData)) {
                rowsListData = null;
              }
            }

            let dataPred = predictData;
            if (isJoin) {
              if (rowsListData != null) {
                dataPred = rowsListData;
              } else {
                return;
              }

              initV = dataPred[field1join as string];
            } else {
              initV = dataPred[field1 as string];
            }

            if (initV != null && _.isObject(initV)) {
              initV = null;
            }
          }

          if (useTable) {
            // formItem = <span style={{ width: '70px', display: 'inline-block', }}>{formItem}</span>;

            let explanationOne = resultExplanations == null ? null : resultExplanations['' + field1Ori];

            if (explanationOne != null) {
              let valueExplanation;
              if (_.isNumber(explanationOne)) {
                valueExplanation = explanationOne;
              } else if (_.isObject(explanationOne)) {
                valueExplanation = explanationOne['' + maxKey];
              }
              // if(valueExplanation!=null) {
              //   valueExplanation = Math.abs(valueExplanation);
              // }
              if (maxAbsV == null || Math.abs(valueExplanation) > maxAbsV) {
                maxAbsV = Math.abs(valueExplanation);
              }

              if (valueExplanation != null) {
                featureNames['' + c1ind] = '' + fieldVisual;

                features['' + c1ind] = {
                  value: initV ?? 0,
                  effect: valueExplanation ?? 0,
                };
              }
            }
          }
        });
        if (maxAbsV == null) {
          maxAbsV = 0;
        }

        if (nestedCols?.length === 0) {
          nestedCols = null;
        }

        let res0 = null;
        if (useTable) {
          let optionsKeys = (this.state.resultPredictedFields || []).map((v1) => ({ label: v1, value: v1 }));
          if (renderPredictedDataList != null) {
            optionsKeys = optionsKeys?.filter((o1) => renderPredictedDataList?.find((p1) => p1.meta === o1.label) != null);
          }
          const optionsKeysSel = optionsKeys.find((o1) => o1.value === this.state.resultPredictedFieldsSel) ?? { label: '', value: '' };
          let popupContainerForMenu = (node) => document.getElementById('body2');
          let menuPortalTarget = popupContainerForMenu(null);

          let optionsFeaturesNested = nestedCols?.map((c1) => ({ label: c1, value: c1 }));

          let indExpl = 0;
          res0 = (
            <div style={{ marginBottom: '20px', color: Utils.colorAall(1) }}>
              <React.Suspense fallback={<div></div>}>
                {nestedCols != null && (
                  <div
                    css={`
                      text-align: center;
                      margin-bottom: 10px;
                    `}
                  >
                    <Radio.Group value={isShowNested} onChange={this.onChangeIsShowNested}>
                      {/*// @ts-ignore*/}
                      <Radio
                        value={false}
                        css={`
                          margin: 10px 0;
                        `}
                      >
                        <span
                          css={`
                            font-weight: normal;
                            color: white;
                          `}
                        >
                          Column
                        </span>
                      </Radio>
                      {/*// @ts-ignore*/}
                      <Radio
                        value={true}
                        css={`
                          margin: 10px 0 10px 20px;
                        `}
                      >
                        <span
                          css={`
                            font-weight: normal;
                            color: white;
                          `}
                        >
                          Nested
                        </span>
                      </Radio>
                    </Radio.Group>
                  </div>
                )}

                {isShowNested && (
                  <div
                    css={`
                      margin: 0 5px 15px 10px;
                      display: flex;
                      font-size: 14px;
                      align-items: center;
                      justify-content: center;
                    `}
                  >
                    <span>Nested Feature:</span>
                    <span
                      css={`
                        margin-left: 10px;
                        width: 200px;
                      `}
                    >
                      <SelectExt value={optionsFeaturesNested?.find((o1) => o1.value === nestedColSel)} options={optionsFeaturesNested} onChange={this.onChangeSelectNested} menuPortalTarget={menuPortalTarget} />
                    </span>
                  </div>
                )}

                <div
                  css={`
                    display: ${this.state.explTypes != null && this.state.explTypes?.length > 1 ? 'block' : 'none'};
                    margin-bottom: 12px;
                    text-align: center;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                  `}
                >
                  <Radio.Group value={this.state.explTypeSel || 'KERNEL_EXPLAINER'} onChange={this.onChangeExplType}>
                    {this.state.explTypes?.map((e1, e1ind) => {
                      return (
                        <Radio key={'e' + e1 + e1ind} value={e1}>
                          <span
                            css={`
                              color: white;
                            `}
                          >
                            {ExplDesc[e1] ?? e1}
                          </span>
                        </Radio>
                      );
                    })}
                  </Radio.Group>
                </div>

                {optionsKeys != null && optionsKeys.length > 0 && (
                  <div
                    css={`
                      display: flex;
                      justify-content: center;
                      align-items: center;
                    `}
                    style={{ marginBottom: '25px' }}
                  >
                    <div>
                      <span
                        css={`
                          font-family: Matter;
                          font-size: 16px;
                          font-weight: bold;
                          line-height: 1.38;
                          color: #d1e4f5;
                          margin-right: 10px;
                        `}
                      >
                        Prediction Explanation (Feature Contribution Scores)
                        <HelpIcon id={'pred_explanation_scores'} style={{ marginLeft: '4px' }} />
                      </span>
                    </div>
                    <div
                      css={`
                        flex: 1;
                      `}
                    >
                      &nbsp;
                    </div>
                    <div>
                      <span style={{ marginBottom: '4px', fontSize: '14px', marginRight: '4px' }}>{first ?? this.state.resultPredictedFieldsName ?? '-'}</span>
                      <span
                        css={`
                          width: 220px;
                          display: inline-block;
                        `}
                      >
                        <SelectExt value={optionsKeysSel} options={optionsKeys} onChange={this.onChangeSelectFieldKey} isSearchable={true} menuPortalTarget={menuPortalTarget} />
                      </span>
                    </div>
                  </div>
                )}
                {(optionsKeys?.length ?? 0) === 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <div
                      css={`
                        font-family: Matter;
                        font-size: 16px;
                        font-weight: bold;
                        line-height: 1.38;
                        color: #d1e4f5;
                      `}
                    >
                      Prediction Explanation (Feature Contribution Scores)
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'center' }}>
                  <div
                    css={`
                      display: grid;
                      grid-row-gap: 21px;
                      grid-column-gap: 6px;
                    `}
                  >
                    {_.flatten(
                      Object.keys(features)
                        .filter((f1) => (isShowNested ? true : (features[f1].effect ?? 0) !== 0))
                        .sort((a, b) => {
                          const v1 = Math.abs(features[a].effect ?? 0);
                          const v2 = Math.abs(features[b].effect ?? 0);
                          if (v1 === v2) {
                            return 0;
                          } else if (v1 < v2) {
                            return 1;
                          } else {
                            return -1;
                          }
                        })
                        .map((f1, ind) => {
                          const v1 = features[f1].effect ?? 0;
                          let value1 = features[f1].value ?? 0;
                          if (_.isNumber(value1)) {
                            value1 = Utils.decimals(value1, 6);
                          } else if (_.isString(value1)) {
                            const max = 55;
                            if (value1.length > max) {
                              value1 = value1.substring(0, max) + '...';
                            }
                          }

                          let isGreater = v1 > 0;
                          const col1 = isGreater ? 1 : 2;
                          const col2 = isGreater ? 2 : 1;

                          const bar1 = (
                            <span
                              css={`
                                height: 10px;
                                display: inline-block;
                                width: ${Math.trunc((100 / (maxAbsV || 1)) * Math.abs(v1))}px;
                                border-radius: ${isGreater ? '0 5px 5px 0' : '5px 0 0 5px'};
                                margin-right: ${isGreater ? 8 : 0}px;
                                margin-left: ${isGreater ? 0 : 8}px;
                                background: ${isGreater ? 'linear-gradient(to left, #00a1ae, #00c9a0);' : 'linear-gradient(to left, #9137ff, #7300ff);'};
                              `}
                            ></span>
                          );

                          let fn1 = featureNames[f1];
                          const fnOri = fn1;
                          if (_.startsWith(fn1, joinPrefix)) {
                            fn1 = (
                              <span>
                                <span
                                  css={`
                                    margin-right: 5px;
                                    opacity: 0.7;
                                  `}
                                >
                                  {joinPrefix}
                                </span>
                                {fn1.substring(joinPrefix.length)}
                              </span>
                            );
                          }

                          const setFixedElem = isShowNested ? null : (
                            <TooltipExt title={'Remove Feature from Explanations'}>
                              <span css={`color: white; margin-${!isGreater ? 'right' : 'left'}: 7px; cursor: pointer; opacity: 0.8;`} onClick={this.onClickFixFeature.bind(this, true, fn1)}>
                                <FontAwesomeIcon icon={'times'} transform={{ size: 15, y: -1 }} />
                                {/*<FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlusHexagon').faPlusHexagon} transform={{ size: 15, y: -1, }} />*/}
                              </span>
                            </TooltipExt>
                          );

                          const valueElem = (
                            <span
                              css={`
                                margin: 0 5px;
                                font-family: Matter;
                                font-size: 12px;
                                color: #ffffff;
                              `}
                            >
                              (val: {value1})
                            </span>
                          );
                          const res = (
                            <div
                              key={'col1_' + ind}
                              css={`
                                grid-column: ${col1};
                                grid-row: ${indExpl + 1};
                                text-align: ${!isGreater ? 'left' : 'right'};
                              `}
                            >
                              {isGreater ? valueElem : null}
                              <span
                                css={`
                                  font-family: Matter;
                                  font-size: 14px;
                                  color: #ffffff;
                                `}
                              >
                                {fn1 ?? '-'}
                              </span>
                              {!isGreater ? valueElem : null}
                            </div>
                          );
                          const res2 = (
                            <div
                              key={'col2_' + ind}
                              css={`
                                grid-column: ${col2};
                                grid-row: ${indExpl + 1};
                                text-align: ${!isGreater ? 'right' : 'left'};
                              `}
                            >
                              {!isGreater ? setFixedElem : null}
                              {isGreater ? bar1 : null}
                              <span
                                css={`
                                  font-family: Matter;
                                  font-size: 14px;
                                  color: #8798ad;
                                `}
                              >
                                {Utils.decimals(v1, 3)}
                              </span>
                              {!isGreater ? bar1 : null}
                              {isGreater ? setFixedElem : null}
                            </div>
                          );

                          indExpl++;

                          let textExpl1 = resultExplanationsText?.[fnOri]?.[this.state.resultPredictedFieldsSel];
                          if (textExpl1 != null && _.isArray(textExpl1) && textExpl1.length > 0) {
                            let res3 = (
                              <div
                                key={'col3_' + ind}
                                css={`
                                  grid-row: ${indExpl + 1};
                                  grid-column: span 2;
                                  text-align: center;
                                  opacity: 0.8;
                                `}
                              >
                                Important Word{textExpl1.length === 1 ? '' : 's'}:{' '}
                                {textExpl1.map((w1, w1ind) => (
                                  <span key={'w' + w1ind}>
                                    {w1ind > 0 ? (
                                      <span
                                        css={`
                                          opacity: 0.8;
                                        `}
                                      >
                                        ,{' '}
                                      </span>
                                    ) : null}
                                    {w1}
                                  </span>
                                ))}
                              </div>
                            );

                            indExpl++;

                            return [res, res2, res3];
                          } else {
                            return [res, res2];
                          }
                        }),
                    )}
                  </div>

                  {!isShowNested && fixedFeatures != null && fixedFeatures?.length > 0 && (
                    <div
                      css={`
                        margin-top: 25px;
                      `}
                    >
                      <div
                        css={`
                          font-family: Matter;
                          font-size: 16px;
                          font-weight: bold;
                          line-height: 1.38;
                          color: #d1e4f5;
                        `}
                      >
                        Removed Features:
                      </div>
                      {fixedFeatures?.map((f1, f1ind) => {
                        const setFixedElem = isShowNested ? null : (
                          <TooltipExt title={'Add Back'}>
                            <span
                              css={`
                                color: white;
                                margin-left: 7px;
                                cursor: pointer;
                                font-size: 12px;
                                opacity: 0.8;
                              `}
                              onClick={this.onClickFixFeature.bind(this, false, f1)}
                            >
                              <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlusHexagon').faPlusHexagon} transform={{ size: 15, y: 1 }} />
                            </span>
                          </TooltipExt>
                        );

                        return (
                          <div
                            key={'ffr_' + f1ind}
                            css={`
                              margin: 4px 10px;
                              font-size: 14px;
                            `}
                          >
                            {f1}
                            {setFixedElem}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </React.Suspense>
            </div>
          );
        }

        return res0;
      }
    },
  );

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
    let values = this.formRef.current?.getFieldsValue();
    let vv = this.processValues(values);

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

  memCalcNestedColumns = memoizeOne((predictData) => {
    let res = [];

    let kk = Object.keys(predictData ?? {});
    kk.some((k1, k1ind) => {
      let v1 = predictData?.[k1];

      if (_.isArray(v1) && v1?.length > 0) {
        res.push(k1);
      }
    });

    return res;
  });

  memPredProb = memoizeOne((data1) => {
    let isPredProb = null;

    let probKK = Object.keys(data1 ?? {});
    if (probKK.includes('predicted')) {
      isPredProb = ['predicted'];
      probKK.sort().some((k1) => {
        if (_.startsWith(k1, 'predicted_prob_')) {
          isPredProb.push(k1);
        }
      });
    }

    if (isPredProb != null && isPredProb.length <= 1) {
      isPredProb = null;
    }

    return isPredProb;
  });

  render() {
    let { projects, projectId } = this.props;

    if (this.state.explTypes == null) {
      return (
        <RefreshAndProgress msgMsg={'Retrieving Model Data...'} isMsgAnimRefresh={true}>
          &nbsp;
        </RefreshAndProgress>
      );
    }

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

    let isPredProb = this.memPredProb(optionsTestDatasRes?.resultTestDatas?.ids?.[0]);

    this.memTestDatas(optionsTestDatasRes, this.lastSelectedAlgoId);

    const topHH = 50;

    let columns = this.memColumns(isPredProb, columnsDisplay);

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

    let renderForm = this.memRenderForm(this.state.resultPredicted, this.state.predictData, columns);
    let renderActualRes = this.memRenderActual(this.state.resultActual);
    let renderActual = renderActualRes?.list;
    let renderPredictedRes = this.memRenderPredicted(this.state.resultPredicted, this.state.resultPredictedClass);
    let renderPredicted = renderPredictedRes?.list;
    let renderPredictedDataList = renderPredictedRes?.dataList;
    this.memInitValues(renderActualRes?.initialValues, renderPredictedRes?.initialValues);

    let nestedCols = this.memCalcNestedColumns(this.state.predictData);

    let renderSHAP = this.memRenderSHAP(
      renderPredictedDataList,
      this.state.resultPredictedFields,
      this.state.resultPredictedFieldsSel,
      this.state.resultPredicted,
      this.state.predictData,
      this.state.resultExplanations,
      this.state.resultExplanationsText,
      columns,
      nestedCols,
      this.state.isShowNested,
      this.state.nestedColSel,
      this.state.resultExplanationsNested,
      this.state.resultExplanationsTextNested,
      this.state.fixedFeatures,
    );

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
                          cellRenderer={this.cellRenderer.bind(this, isPredProb)}
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
                          columnCount={(columns ? columns.length : 0) + 1 + 1 + (isPredProb == null ? 0 : isPredProb?.length ?? 0)}
                          columnWidth={this.gridColumnWidth.bind(this, isPredProb)}
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
                        <div style={{ position: 'absolute', top: 0 /*topHH*/ + 'px', left: '10px', right: '10px', height: height - topAfterHeaderHH - 5 - 10 + 'px' }}>
                          <NanoScroller onlyVertical>
                            <div style={{ padding: '10px' }}>{renderForm}</div>
                          </NanoScroller>
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
                              {(renderSHAP != null || this.state.isRefreshingExplanations === true) && (
                                <div className={sd.classGrayPanel} style={{ position: 'relative', padding: '17px 20px 20px', marginTop: '10px' }}>
                                  <RefreshAndProgress isRelative errorMsg={null} isRefreshing={this.state.isRefreshingExplanations && !this.state.isRefreshingResult}>
                                    {renderSHAP}
                                  </RefreshAndProgress>
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
)(ModelPredictionsRegressionOne);
