import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TableSortLabel from '@mui/material/TableSortLabel';
import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Popover from 'antd/lib/popover';
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
import { calcDeploymentsTokensByProjectId } from '../../stores/reducers/deploymentsTokens';
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
const s = require('./ModelPredictionsClusteringOne.module.css');
const sd = require('../antdUseDark.module.css');

const cellHH = 54;
const sepArray = '___###___';

const TOKEN_NO_TOKEN = 'DEPLOYMENT_AUTH_TOKEN';

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
};

interface IModelPredictionsClusteringOneProps {
  paramsProp?: any;
  projects?: any;
  algorithms?: any;
  defDatasets?: any;
  schemaPredictions?: any;
  deploymentsTokens?: any;
  deployments?: any;
  requests?: any;

  projectId?: string;
}

interface IModelPredictionsClusteringOneState {
  datasetIdSel?: string;
  selectedFieldValueId?: string;

  dataGridList?: any;
  dataGridListFiltered?: any;
  sortByField?: any;
  sortOrderIsAsc?: any;
  predictData?: any;
  resultPredicted?: any;
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
  selToken?: string;

  explTypeSel?: string;
  explTypes?: string[];

  fixedFeatures?: string[];

  showGrid?: boolean;
}

class ModelPredictionsClusteringOne extends React.PureComponent<IModelPredictionsClusteringOneProps & IModelPropsCommon, IModelPredictionsClusteringOneState> {
  private unDark: any;
  private isM: boolean;
  private lastCallPredictData: any;
  formRef = React.createRef<FormInstance>();
  formPredicted = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshingResult: false,
      isRefreshingExplanations: false,
      showGrid: false,
      isShowNested: false,
    };
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

  componentDidUpdate(prevProps: Readonly<IModelPredictionsClusteringOneProps & IModelPropsCommon>, prevState: Readonly<IModelPredictionsClusteringOneState>, snapshot?: any) {
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

  memDeploymentTokensList = memoizeOneCurry((doCall, deploymentsTokens, projectId) => {
    if (!projectId) {
      return null;
    }

    if (deploymentsTokens) {
      if (deploymentsTokens.get('isRefreshing')) {
        return;
      }
      //
      let res = calcDeploymentsTokensByProjectId(undefined, projectId);
      if (res == null) {
        if (doCall) {
          StoreActions.deployTokensList_(projectId);
        }
      } else {
        return res;
      }
    }
  });

  onChangeSelToken = (optionSel) => {
    this.setState({
      selToken: optionSel?.value,
    });
  };

  memTokensRender = memoizeOne((tokensList, selToken) => {
    if (tokensList) {
      let options = tokensList.map((t1) => ({ label: t1.deploymentToken, value: t1.deploymentToken }));
      if (options.length === 0) {
        options.unshift({ label: TOKEN_NO_TOKEN, value: TOKEN_NO_TOKEN });
      }

      let selOption = selToken ? options.find((o1) => o1.value === selToken) : null;

      if (selOption == null && options && options.length > 0) {
        setTimeout(() => {
          this.setState({
            selToken: options[0].value,
          });
        }, 0);
      }

      return (
        <span style={{ marginTop: '10px', marginLeft: '20px', display: 'inline-block', marginBottom: '20px' }}>
          <span style={{ marginRight: '5px' }}>Token:</span>
          <span style={{ display: 'inline-block', width: '400px' }}>
            <SelectExt value={selOption} options={options} onChange={this.onChangeSelToken} />
          </span>
        </span>
      );
    }
  });

  memChangeRefresh = memoizeOne((selectedAlgoId) => {
    this.lastCallPredictData = undefined;
    this.lastSelectedAlgoId = undefined;
    this.lastUsedPredRow = undefined;
    this.lastReqOneUsed = undefined;

    this.setState({
      predictData: null,
      resultPredicted: null,
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

    this.memModelChanged(this.props.selectedAlgoId);

    this.memDeployOne(true)(this.props.deployments, projectId, this.props.selectedAlgoId);

    let tokensList = this.memDeploymentTokensList(true)(this.props.deploymentsTokens, projectId);

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
        resultPredicted: null,
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

  memColumns = memoizeOne((columnsDisplay: { key: string; dataType: string; expand?: boolean }[]) => {
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
            let field1 = this.getFieldFromIndex(f1.fieldIndex - 1);
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
            let field1 = this.getFieldFromIndex(col);
            return { value: field1 ? data1[field1.key] : null, data1 };
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
            <TableSortLabel disabled={undefined} active={sortByField === columnIndex} direction={this.state.sortOrderIsAsc ? 'asc' : 'desc'} onClick={this.onSortHeaderClick.bind(this, columnIndex)}>
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
            let field1 = this.getFieldFromIndex(columnIndex - 1);
            return { value: field1 ? data1[field1.key] : null, data1 };
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
        resultPredicted: null,
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

    if (!this.state.selToken || !this.props.selectedAlgoId) {
      this.setState({
        isRefreshingResult: false,
        isRefreshingExplanations: false,
      });
      return;
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
    const queryData = row;

    REClient_.client_().getCluster(this.state.selToken, this.props.selectedAlgoId, queryData, (err, res) => {
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
        }

        const predictedOne = res?.result;

        this.setState({
          resultPredicted: predictedOne,
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

  memRenderPredicted = memoizeOne((data) => {
    if (!data) {
      return null;
    }

    let dataListChart = [],
      labels = [];

    data?.cluster_distances?.forEach((item) => {
      labels.push(item.cluster);
      dataListChart.push({ x: item.cluster, y: item.cluster_distance });
    });

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
      titleY: 'Distance',
      titleX: 'Cluster',
      tooltips: true,
      data: dataListChart,
      labels,
    };

    const distance = data?.cluster_distances?.find((item) => item.cluster === data?.cluster)?.cluster_distance ?? '';

    let histogram = (
      <div style={{ position: 'relative', color: 'white', marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ height: hHH + 'px', position: 'relative', width: '100%' }}>
          <div>Cluster: {data?.cluster ?? ''}</div>
          <div>Distance: {Utils.roundDefault(distance, 2)}</div>
          <div style={{ margin: '0 10px', zIndex: 2, height: hHH + 'px', position: 'relative' }}>
            <ChartXYExt axisYMin={0} noMax useEC colorIndex={0} height={hHH} colorFixed={ColorsGradients} data={data1} type={'bar'} />
          </div>
        </div>
      </div>
    );

    const res = (
      <div style={{ color: Utils.colorAall(1), marginTop: '10px' }}>
        <div>{histogram}</div>
      </div>
    );

    return res;
  });

  memRenderForm = memoizeOne((predictData, columns) => {
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

          let vv = this.processValues(resInitialValues);
          this.showPrediction(vv, true);
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

    let optionsAlgo = this.props.optionsAlgo;
    let algoSelectValue = null;
    if (this.props.selectedAlgoId) {
      algoSelectValue = optionsAlgo && optionsAlgo.find((o1) => o1.value === this.props.selectedAlgoId);
    }

    let optionsTestDatasRes = this.props.optionsTestDatasRes;
    let testDatasList = optionsTestDatasRes ? optionsTestDatasRes.testDatasList : [];
    let columnsDisplay: { key: string; dataType: string }[] = optionsTestDatasRes ? optionsTestDatasRes.columns : null;

    const tokensList = this.memDeploymentTokensList(false)(this.props.deploymentsTokens, projectId);
    const tokensRender = this.memTokensRender(tokensList, this.state.selToken);

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

    let renderForm = this.memRenderForm(this.state.predictData, columns);
    let renderPredicted = this.memRenderPredicted(this.state.resultPredicted);

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

    const leftWidth = 367;

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
                          cellRenderer={this.cellRenderer.bind(this)}
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
                          columnWidth={this.gridColumnWidth.bind(this)}
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
                      <div>{tokensRender}</div>
                      <div className={sd.classGrayPanel} style={{ position: 'absolute', top: '55px', left: '10px', width: leftWidth + 'px', height: height - topAfterHeaderHH - 10 + 'px' }}>
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

                      <div style={{ position: 'absolute', top: '50px', left: leftWidth + centerWW + 'px', right: '10px', bottom: '10px' }}>
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
                                  <HelpIcon id={'predictedClusterDistance'} style={{ float: 'right', marginRight: '4px' }} />
                                </div>
                                <div>
                                  <FormExt layout={'vertical'} ref={this.formPredicted}>
                                    {renderPredicted}
                                  </FormExt>
                                </div>
                              </div>
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
    deploymentsTokens: state.deploymentsTokens,
    deployments: state.deployments,
    requests: state.requests,
  }),
  null,
)(ModelPredictionsClusteringOne);
