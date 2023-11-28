import LeftOutlined from '@ant-design/icons/LeftOutlined';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import Popover from 'antd/lib/popover';
import Radio from 'antd/lib/radio';
import * as Immutable from 'immutable';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import Draggable from 'react-draggable';
import { connect, Provider } from 'react-redux';
import SplitPane from 'react-split-pane';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import * as uuid from 'uuid';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { calcDocStoreDefFromFeatureGroup, DocStoreDefForcedVision, DocStoreType, IDocStoreDef } from '../../api/DocStoreInterfaces';

import classNames from 'classnames';
import { GridCacheMem } from '../../api/GridCacheMem';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import customds, { CustomDSLifecycle } from '../../stores/reducers/customds';
import { calcDataset_datasetType, calcDatasetById, DatasetLifecycle, DatasetLifecycleDesc, default as datasets, default as datasetsReq } from '../../stores/reducers/datasets';
import defDatasets, {
  calcChartsByDatasetIdError,
  calcChartsDatasetById,
  calcFileDataUseByDatasetIdProjectId,
  calcFileDataUseByDatasetIdProjectIdError,
  calcFileSchemaByDatasetId,
  calcFileSchemaByDatasetVersion,
} from '../../stores/reducers/defDatasets';
import featureGroups, { FeatureGroupVersionLifecycle } from '../../stores/reducers/featureGroups';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import UtilsTS from '../../UtilsTS';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import DataserverControlEditor, { CustomDataserverHeight } from '../DataserverControlEditor/DataserverControlEditor';
import DateOld from '../DateOld/DateOld';
import { DocStoreImageSizePxWW } from '../DocStoreRenderImage/DocStoreRenderImage';
import EditorElem, { EditorElemPreview } from '../EditorElem/EditorElem';
import EditorElemForDataset from '../EditorElemForDataset/EditorElemForDataset';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import { calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import FilterByColumns from '../FilterByColumns/FilterByColumns';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { FilterOne } from '../ModelPredictionsRegressionOne/ModelPredictionsRegressionOne';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import NLPEntitiesColorsList, { calcColorsNLP } from '../NLPEntitiesColorsList/NLPEntitiesColorsList';
import NLPEntitiesTables, { nlpCalcColorToken } from '../NLPEntitiesTables/NLPEntitiesTables';
import NumberPretty from '../NumberPretty/NumberPretty';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import PromptAdv from '../PromptAdv/PromptAdv';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const { confirm } = Modal;

const styles = require('./ProjectRawDataOne.module.css');
const sd = require('../antdUseDark.module.css');

const docStoreGridOptionsElemHH = 56;
const cellHH = 54;
const maxColsDetail = 50;
const SortKeyStorage = 'sort_proj_rawdata_store';
const showRawDocumentsView = false;

interface IProjectRawDataOneProps {
  paramsProp?: any;
  projects?: any;
  projectDatasets?: any;
  defDatasets?: any;
  datasets?: any;
  customds?: any;
  featureGroups?: any;
  onChangeProject?: (key: any) => void;
  isFeatureGroup?: boolean;
}

interface IProjectRawDataOneState {
  scrollToRow?: number;
  scrollToColumn?: number;
  scrollTopGrid?: any;
  chartsUuid?: string;
  hoveredRowIndex?: number;
  hoveredColumnIndex?: number;
  selectedRowIndex?: number;
  showDetail?: boolean;
  showDetailAllCols?: boolean;
  selRowId?: string;
  isRefreshFiltering?: boolean;
  detailTypeIsList?: boolean;
  isDocumentsLoading?: boolean;

  filterValuesPopoverVisible?: boolean;
  filterValuesPopoverVisibleNone?: boolean;
  filterValues?: { fieldIndex?: number; value?: any }[];
  filterCount?: number;
  filterCountUnbounded?: number;
  filterSqlColumns?: any[];
  filterSql?: string;
  filterSqlBounce?: string;
  promptBounce?: string;
  promptProcessing?: boolean;
  isUseFilterSqlPrompt?: boolean;
  isUseFilterSql?: boolean;
  orderByColumn?: string;
  isAscending?: boolean;
  selectedColumns?: string[];
  selectedColumnsUsed?: string[];
  selectedColumnsText?: string;
  selectedColumnsNonIgnored?: boolean;
  prioritizeFeatureMappedColumns: boolean;

  lastDataErrorMsg?: string;
  topTenValuesMap?: { [key: string]: any[] };

  sampleShowFilters?: boolean;
  sampleData?: any[];
  sampleDataIsRefreshing?: boolean;
  sampleDataNoMore?: boolean;
  sampleDataSelIndex?: number;
  sampleDataCount?: number;
  sampleColumns?: any;

  nlpData?: any[];
  nlpDataIsRefreshing?: boolean;
  materializeIsRefreshing?: boolean;
  nlpNoMore?: boolean;
  nlpRowSelIndex?: number;
  nlpColorsCalc?: { count; label; color; colorHex }[];
  nlpCount?: number;
  nlpExpanded?: any;
  columnCfg: any[];

  previewRef?: any;

  docData?: any[];
  docDataIsRefreshing?: boolean;
  docNoMore?: boolean;
  docRowSelIndex?: number;
  docCount?: number;
  docExpanded?: any;
  docStoreIsGrid?: boolean;
  docSqlFilter?: string;
  docSqlFilterUsed?: string;
  docIdFilter?: string;
  docIdFilteredData?: any[];

  dataCount?: number;
  isChartsExpanded?: boolean;
}

class ProjectRawDataOne extends React.PureComponent<IProjectRawDataOneProps, IProjectRawDataOneState> {
  private unDark: any;
  cacheGrid = new GridCacheMem();
  private timeoutCallRangeRender: any;
  private lastRangeGridRender: { columnOverscanStartIndex: any; columnOverscanStopIndex: any; rowOverscanStopIndex: any; columnStopIndex: any; rowStartIndex: any; columnStartIndex: any; rowStopIndex: any; rowOverscanStartIndex: any };
  private isM: boolean;
  private valuesNano: any;
  private refNlpTable: any;
  private confirmValues: any;
  private onClickMaterFGUsed: boolean;
  private activeRowIndex: number;
  refDocStoreTable: any;

  constructor(props) {
    super(props);

    this.state = {
      selRowId: uuid.v1(),
      chartsUuid: uuid.v1(),
      showDetail: false, //Utils.dataNum(showDetailSaveStorageName, false),
      selectedColumnsNonIgnored: false,
      prioritizeFeatureMappedColumns: false,
      columnCfg: [],
      docStoreIsGrid: false,
      isChartsExpanded: true,
      previewRef: {
        previewData: null,
        setPreviewData: (newValue) => {
          let res = { ...(this.state.previewRef ?? {}) };
          res.previewData = newValue;
          this.setState({
            previewRef: res,
          });
        },
      },
    };

    this.cacheGrid.onNeedCache = this.cacheOnNeedCache;
    this.cacheGrid.hasNewData = this.cacheHasNewData;

    this.onChangeSelectedColumns = _.debounce(this.onChangeSelectedColumns, 200);
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

  calcProjectIsNone = () => {
    return this.props.paramsProp?.get('projectId') === '-' || this.calcProjectId() == null;
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let projectIsNone = this.calcProjectIsNone();

    let projectId = this.calcProjectId();
    let datasetId = this.props.paramsProp?.get('datasetId');
    let featureGroupId = this.props.paramsProp?.get('featureGroupId');
    let batchPredId = this.props.paramsProp?.get('batchPredId');
    let modelVersion = this.props.paramsProp?.get('modelVersion');
    let datasetVersion = this.props.paramsProp?.get('datasetVersion');
    let featureGroupVersion = this.calcFeatureGroupVersion();

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    const isNlp = this.calcIsNlp();

    let useSampleData;
    let fOne;
    if (this.props.isFeatureGroup) {
      this.memFeatureGroups(true)(projectId, this.props.featureGroups);
      fOne = this.memFeatureGroupsOne(true)(projectId, featureGroupId, this.props.featureGroups);
      datasetId = fOne?.datasetId;
      useSampleData = fOne?.enableSampleData === true;
    }

    let datasetOne = this.memDatasetOne(true)(this.props.datasets, datasetId);
    if (datasetOne != null && datasetVersion != null) {
      this.memDatasetVersionOne(true)(this.props.datasets, datasetId, datasetVersion);
    }

    let listDatasetsProj = this.memProjectDatasets(true)(this.props.projectDatasets, projectId);
    let listDatasets = this.memDatasetsList(true)(this.props.datasets, listDatasetsProj);

    let datasetSchema1 = null;
    if (foundProject1 || projectIsNone) {
      if (this.props.isFeatureGroup) {
        datasetSchema1 = this.memFeatureGroupSchema(true)(this.props.defDatasets, projectId, this.calcFeatureGroupId(), featureGroupVersion);
      } else {
        datasetSchema1 = this.memDatasetSchema(true)(this.props.defDatasets, datasetId, datasetVersion);
      }
    }
    this.memOnSchemaChanged(datasetSchema1);

    if ((!this.props.isFeatureGroup || (this.props.isFeatureGroup && fOne?.explorerCharts === true)) && !batchPredId) {
      if (datasetId) {
        let chartsList = this.memCharts(true)(this.state.chartsUuid, this.props.defDatasets, datasetId, projectId);
      } else {
        let chartsList = this.memChartsFG(true)(this.state.chartsUuid, this.props.featureGroups, projectId, featureGroupVersion);
      }
    }

    if (this.props.isFeatureGroup) {
      let fgVersionsList = this.memFGVersions(true)(this.props.featureGroups, featureGroupId);
    } else {
      let fgVersionsList = this.memDatasetVersions(true)(this.props.datasets, datasetId);
    }

    if (isNlp === true && this.state.nlpData == null && !this.state.nlpDataIsRefreshing && !this.state.nlpNoMore) {
      this.nlpGetData();
    }

    if (this.calcIsDocStore() && this.state.docData == null && !this.state.docDataIsRefreshing && !this.state.docNoMore) {
      this.docGetData();
    }

    if (useSampleData && this.state.sampleData == null && !this.state.sampleDataIsRefreshing && !this.state.sampleDataNoMore) {
      this.sampleGetData();
    }

    let CDSOne = this.memCDS(true)(this.props.customds);

    this.memFGVersion(featureGroupVersion, useSampleData);
    this.memDatasetVersion(this.calcDatasetVersion(), useSampleData);
    this.memListFieldNamesForVersion(true)(this.memListFieldNamesForVersionCache, this.calcFeatureGroupVersion());

    this.memAutoSort(this.calcKeyForSort());
  };

  memListFieldNamesForVersionCache = null;
  memListFieldNamesForVersionUsed = null;
  memListFieldNamesForVersion = memoizeOneCurry((doCall, cache, featureGroupVersion) => {
    if (!featureGroupVersion) {
      return null;
    }

    if (this.memListFieldNamesForVersionUsed !== featureGroupVersion) {
      this.memListFieldNamesForVersionCache = null;
    }

    if (!doCall) {
      return this.memListFieldNamesForVersionCache;
    }
    if (this.memListFieldNamesForVersionCache === cache && cache != null) {
      return this.memListFieldNamesForVersionCache;
    }

    this.memListFieldNamesForVersionCache = null;
    this.memListFieldNamesForVersionUsed = featureGroupVersion;

    REClient_.client_().getFeatureGroupVersionMetricsData(null, featureGroupVersion, 0, 3000, 0, 0, null, null, (err, res) => {
      if (this.memListFieldNamesForVersionUsed !== featureGroupVersion) {
        return;
      }

      let list = res?.result?.data;
      if (list != null && _.isArray(list)) {
        this.memListFieldNamesForVersionCache = list;
      }
    });
  });

  memAutoSort = memoizeOne((key1) => {
    let listSort = Utils.tryJsonParse(Utils.dataNum(SortKeyStorage, null) ?? '[]');
    if (listSort != null && _.isArray(listSort) && listSort.length > 0) {
      let p1 = listSort?.find((s1) => s1?.key === key1);
      if (p1 != null) {
        this.setState({
          orderByColumn: p1.column ?? null,
          isAscending: p1.isAsc,
        });
      }
    }
  });

  memFGVersion = memoizeOne((version1, useSampleData) => {
    if (this.state.sampleData == null || !this.props.isFeatureGroup || !useSampleData) {
      return;
    }

    this.setState({
      sampleData: null,
      sampleDataNoMore: false,
      sampleDataIsRefreshing: false,
    });
  });

  memDatasetVersion = memoizeOne((version1, useSampleData) => {
    if (this.state.sampleData == null || this.props.isFeatureGroup || !useSampleData) {
      return;
    }

    this.setState({
      sampleData: null,
      sampleDataNoMore: false,
      sampleDataIsRefreshing: false,
    });
  });

  memFeatureGroups = memoizeOneCurry((doCall, projectId, featureGroupsParam) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

  memFilterIMAGECols = memoizeOne((featureGroupOne, docStoreDef: IDocStoreDef) => {
    if (featureGroupOne == null) {
      return null;
    } else {
      let featuresIMAGEList = calcSchemaForFeature(featureGroupOne);

      let list = ['IMAGE'.toLowerCase()];
      let res = featuresIMAGEList
        ?.filter((f1) => list?.includes(f1?.featureMapping?.toLowerCase()))
        ?.map((f1) => f1?.name)
        ?.filter((s1) => !Utils.isNullOrEmpty(s1));

      if (docStoreDef?.type === DocStoreType.pdf) {
        let list = ['OBJECT_REFERENCE'.toLowerCase()];
        let res2 = featuresIMAGEList
          ?.filter((f1) => list?.includes(f1?.featureType?.toLowerCase()))
          ?.map((f1) => f1?.name)
          ?.filter((s1) => !Utils.isNullOrEmpty(s1));
        if (res2 != null) {
          res ??= [];
          res = res.concat(res2);
        }
      }

      return res;
    }
  });

  memRowIdCol = memoizeOne((featureGroupOne, docStoreDef) => {
    if (!featureGroupOne || !docStoreDef || docStoreDef.type !== DocStoreType.pdf) {
      return null;
    }

    const schema = calcSchemaForFeature(featureGroupOne);
    const rowIdFeatureMapping = docStoreDef?.rowIdentifierFeatureMapping;
    const rowIdCol = schema.find((f1) => f1?.featureMapping?.toLowerCase() === rowIdFeatureMapping?.toLowerCase());

    return rowIdCol ? rowIdCol.name : null;
  });

  memFeatureGroupsOne = memoizeOneCurry((doCall, projectId, featureGroupId, featureGroupsParam) => {
    return featureGroups.memFeatureGroupsForId(doCall, projectId, featureGroupId);
  });

  componentDidUpdate(prevProps: Readonly<IProjectRawDataOneProps>, prevState: Readonly<IProjectRawDataOneState>, snapshot?: any): void {
    this.doMem();
  }

  memOnSchemaChanged = memoizeOne((schema1) => {
    if (schema1) {
      setTimeout(() => {
        if (!this.isM) {
          return;
        }

        // @ts-ignore
        this.refs.sizer && this.refs.sizer.refs.gridRef && this.refs.sizer.refs.gridRef.forceUpdateGrids();
        // @ts-ignore
        this.refs.sizer && this.refs.sizer.refs.gridRef && this.refs.sizer.refs.gridRef.recomputeGridSize();

        this.gotoTopLeft();
      }, 0);
    }
  });

  calcFeatureGroupIdForNlp = () => {
    return this.props.paramsProp?.get('datasetId');
  };

  calcFeatureGroupId = () => {
    return this.props.paramsProp?.get('featureGroupId');
  };

  calcFeatureGroupVersion = () => {
    let res = this.props.paramsProp?.get('featureGroupVersion');
    if (Utils.isNullOrEmpty(res)) {
      res = null;
    }
    return res;
  };

  calcDatasetVersion = () => {
    let res = this.props.paramsProp?.get('datasetVersion');
    if (Utils.isNullOrEmpty(res)) {
      res = null;
    }
    return res;
  };

  calcBatchPredId = () => {
    let res = this.props.paramsProp?.get('batchPredId');
    if (Utils.isNullOrEmpty(res)) {
      res = null;
    }
    return res;
  };

  calcDatasetId = () => {
    return this.props.paramsProp?.get('datasetId');
  };

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      projectId = null;
    }
    return projectId;
  };

  calcModelVersion = () => {
    return this.props.paramsProp?.get('modelVersion');
  };

  cacheHasNewData = () => {
    this.forceUpdate();
  };

  memFilterCalc = memoizeOne((filterValues) => {
    let filters = {};

    filterValues?.some((f1: { fieldIndex?: number; value?: any }) => {
      const field1 = this.getFieldFromIndex(f1.fieldIndex - 1);
      if (field1 && !Utils.isNullOrEmpty(f1.value)) {
        filters[field1.get('name')] = f1.value;
      }
    });

    if (_.isEmpty(filters)) {
      filters = null;
    }
    return filters;
  });

  calcUsingSqlActual = (forceSql?: string) => {
    return _.trim((forceSql ?? this.state.filterSql) || '') !== '';
  };

  lastUsedFiltersWhenNeedCache = null;
  cacheOnNeedCache = async (fromRow: number, toRow: number, fromCol: number, toCol: number): Promise<any> => {
    let datasetId = this.calcDatasetId();
    let featureGroupId = this.calcFeatureGroupId();
    let datasetVersion = this.calcDatasetVersion();
    let featureGroupVersion = this.calcFeatureGroupVersion();

    // if(this.props.isFeatureGroup) {
    //   if (Utils.isNullOrEmpty(featureGroupVersion)) {
    //     return;
    //   }
    // }

    let filters = this.memFilterCalc(this.state.filterValues);
    let sql = this.state.filterSql;
    let orderByColumn = this.state.orderByColumn;
    let isAscending = this.state.isAscending;

    let selectedColumns = this.state.selectedColumns?.map((c1: any) => c1?.toJS()?.name);
    let selectedColumnsNonIgnored = this.state.selectedColumnsNonIgnored === true;

    return new Promise((resolve, reject) => {
      let isShowRefresh = this.lastUsedFiltersWhenNeedCache !== filters && filters != null && Object.keys(filters ?? {}).length > 0;
      if (fromRow === 0) {
        isShowRefresh = true;
      }

      this.lastUsedFiltersWhenNeedCache = filters;

      if (isShowRefresh && this.isM) {
        this.setState({
          isRefreshFiltering: true,
        });
      }

      let method1 = 'get_dataset_data';
      if (!Utils.isNullOrEmpty(datasetVersion)) {
        method1 = 'get_dataset_data_version';
      }
      if (this.props.isFeatureGroup) {
        if (Utils.isNullOrEmpty(featureGroupVersion)) {
          method1 = '_getFeatureGroupData';
        } else {
          method1 = 'getFeatureGroupVersionData';
        }
      }

      let projectId = this.calcProjectId();
      REClient_.client_()[method1](
        projectId,
        this.props.isFeatureGroup ? featureGroupId : datasetId,
        featureGroupVersion,
        fromRow,
        toRow,
        fromCol,
        toCol,
        filters,
        sql,
        orderByColumn,
        isAscending,
        selectedColumns,
        selectedColumnsNonIgnored,
        this.state.prioritizeFeatureMappedColumns,
        (err, res) => {
          if (err) {
            Utils.error('Error: ' + err);
          }

          if (isShowRefresh && this.isM) {
            this.setState({
              isRefreshFiltering: false,
            });
          }

          if (this.props.isFeatureGroup) {
            if (this.calcFeatureGroupId() !== featureGroupId) {
              resolve(null);
              return;
            }
          } else {
            if (this.calcDatasetId() !== datasetId) {
              resolve(null);
              return;
            }
          }

          if (!err && res && res.result && res.result.data) {
            if (this.isM) {
              let dataset1;
              if (this.props.isFeatureGroup) {
                dataset1 = this.memFeatureGroupSchema(false)(this.props.defDatasets, this.calcProjectId(), this.calcFeatureGroupId(), this.calcFeatureGroupVersion());
              } else {
                dataset1 = this.memDatasetSchema(false)(this.props.defDatasets, this.calcDatasetId(), this.calcDatasetVersion());
              }

              let featureTypeDict: any = {};
              if (dataset1) {
                let fieldsList = dataset1.get('schema');
                fieldsList?.toJS()?.some((f1) => {
                  featureTypeDict[f1.name] = f1.featureType;
                });
              }

              let cols1 = res?.result?.columns?.map((aa) => {
                let r1 = { name: aa, featureType: featureTypeDict?.[aa] ?? null };
                return Immutable.fromJS(r1);
              });
              if (
                this.state.selectedColumnsUsed == null ||
                !_.isEqual(
                  cols1?.map((c1) => c1?.toJS()),
                  this.state.selectedColumnsUsed?.map((c1: any) => c1?.toJS()),
                )
              ) {
                const columnsCount = cols1?.length;

                let st1 = Utils.stateMergeIfNotEqual(this.state, {
                  selectedColumnsUsed: cols1,
                  columnCfg: this.generateColumnsCfg(columnsCount),
                });
                if (st1) {
                  this.setState(st1);
                }
              }
            }

            if (this.state.filterValues?.length > 0 || (this.state.isUseFilterSql && this.calcUsingSqlActual(sql))) {
              const c1 = res?.result?.count;
              if (this.state.filterCount != c1 && this.isM) {
                this.setState({
                  filterCount: c1,
                });
              }
            }

            if (this.state.isUseFilterSql && this.calcUsingSqlActual(sql)) {
              let cols1 = res?.result?.columnNames?.map((aa) => {
                let r1 = { name: aa?.[0], featureType: aa?.[1] };
                return Immutable.fromJS(r1);
              });
              if (cols1 == null && res?.result?.columns != null && _.isArray(res?.result?.columns) && !res?.result?.columns?.some((s1) => !_.isString(s1))) {
                cols1 = res?.result?.columns?.map((aa) => {
                  return Immutable.fromJS({ name: aa, featureType: null });
                });
              }

              if (
                this.state.filterSqlColumns == null ||
                !_.isEqual(
                  cols1?.map((c1) => c1?.toJS()),
                  this.state.filterSqlColumns?.map((c1) => c1?.toJS()),
                )
              ) {
                const columnsCount = cols1?.columnsCount ?? 0;

                let st1 = Utils.stateMergeIfNotEqual(this.state, {
                  filterSqlColumns: cols1,
                  ...(!this.state.selectedColumnsUsed && { columnCfg: this.generateColumnsCfg(columnsCount) }),
                });
                if (st1) {
                  this.setState(st1);
                }
              }

              let c2 = res?.result?.countUnbounded;
              if (this.state.filterCountUnbounded !== c2) {
                this.setState({
                  filterCountUnbounded: c2,
                });
              }
            }

            let errorMsg = res?.result?.errorDescription;
            if (Utils.isNullOrEmpty(errorMsg)) {
              errorMsg = undefined;
            }
            if (this.state.lastDataErrorMsg !== errorMsg) {
              if (errorMsg == null && this.state.lastDataErrorMsg == null) {
                //
              } else {
                this.setState({
                  lastDataErrorMsg: errorMsg,
                });
              }
            }

            let topTenValuesMap = res?.result?.topTenValuesMap ?? null;
            let st1 = Utils.stateMergeIfNotEqual(this.state, {
              topTenValuesMap,
              dataCount: res?.result?.count ?? null,
            });
            if (st1) {
              this.setState(st1);
            }

            resolve(res?.result?.data);
          } else {
            let errorMsg;
            if (!Utils.isNullOrEmpty(res?.error)) {
              errorMsg = res?.error;
            }
            if (this.state.lastDataErrorMsg !== errorMsg) {
              if (errorMsg == null && this.state.lastDataErrorMsg == null) {
                //
              } else {
                this.setState({
                  lastDataErrorMsg: errorMsg,
                });
              }
            }

            resolve(null);
          }
        },
      );
    });
  };

  onDarkModeChanged = (isDark) => {
    setTimeout(() => {
      this.setState({
        chartsUuid: uuid.v1(),
      });
    }, 0);

    this.forceUpdate();
  };

  componentDidMount() {
    this.isM = true;
    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);

    this.doMem(false);

    const sizeRes = this.memRowsColumnsCount(
      this.props.defDatasets,
      this.props.projects,
      this.calcProjectId(),
      this.calcDatasetId(),
      this.calcBatchPredId(),
      this.calcModelVersion(),
      this.calcFeatureGroupId(),
      this.calcFeatureGroupVersion(),
      this.calcDatasetVersion(),
    );
    if (sizeRes != null) {
      const columnsCount = sizeRes?.columnsCount ?? 0;
      this.setState({ columnCfg: this.generateColumnsCfg(columnsCount) });
    }
  }

  docGetData = (isMore = false, force = false) => {
    if (this.state.docDataIsRefreshing && !force) {
      return;
    }

    const isDocStore = this.calcIsDocStore();
    if (!isDocStore) {
      return;
    }

    if (!isMore) {
      this.setState({
        docData: [],
        docDataIsRefreshing: true,
        docNoMore: false,
        docRowSelIndex: null,
        docCount: null,
      });
    } else {
      this.setState({
        docDataIsRefreshing: true,
      });
    }

    let row = isMore ? (this.state.docData ?? []).length : 0;
    const pageLen = 30;

    let isFirst = row === 0;
    if (isFirst) {
      this.setState({
        isDocumentsLoading: true,
      });
    }

    const cb1 = (err, res) => {
      if (isFirst) {
        this.setState({
          isDocumentsLoading: false,
        });
      }

      if (err || !res?.success || res?.result?.data == null || res?.result?.data?.length === 0) {
        //error
        Utils.error(err ?? res);
        this.setState({
          docNoMore: true,
          docDataIsRefreshing: false,
        });

        if (err) {
          REActions.addNotificationError(err);
        }
      } else {
        let docs = [];
        res?.result?.data?.some((d1) => {
          let r1: any = {};
          res?.result?.columns?.some((c1, c1ind) => {
            r1[c1] = d1?.[c1ind];
          });
          docs.push(r1);
        });

        this.setState((lastState) => {
          let docData = lastState?.docData ?? [];
          if (isMore) {
            docData = [...docData, ...(docs ?? [])];
          } else {
            docData = docs ?? [];
          }

          let noMore1 = docs?.length < pageLen;
          if (this.state.docCount != null && docData?.length >= this.state.docCount) {
            noMore1 = true;
          }

          let docCount = res?.result?.count;

          return {
            docData,
            docNoMore: noMore1,
            docDataIsRefreshing: false,
            docCount,
          };
        });
      }
    };

    let version1 = this.calcFeatureGroupVersion();

    let sql1 = null;
    let featureGroupOne = this.memFeatureGroupsOne(false)(this.calcProjectId(), this.calcFeatureGroupId(), this.props.featureGroups);
    const docStoreDef = calcDocStoreDefFromFeatureGroup(featureGroupOne);
    if (docStoreDef?.calcSqlForFilter != null) {
      let colFitlerName = null;

      let schema1 = this.memFeatureGroupSchema(false)(this.props.defDatasets, this.calcProjectId(), this.calcFeatureGroupId(), this.calcFeatureGroupVersion());
      schema1
        ?.get('schema')
        ?.toJS()
        ?.some((c1) => {
          if (c1?.featureMapping?.toLowerCase() === docStoreDef?.columnSqlFeatureMapping?.toLowerCase()) {
            colFitlerName = c1?.name;
            return true;
          }
        });

      if (!Utils.isNullOrEmpty(colFitlerName)) {
        sql1 = docStoreDef?.calcSqlForFilter?.(this.state.docSqlFilterUsed, colFitlerName);
      }
      if (Utils.isNullOrEmpty(sql1)) {
        sql1 = null;
      }
    }

    let FGVersion = this.calcFeatureGroupVersion();
    if (FGVersion) {
      REClient_.client_()._getFeatureGroupVersionData(FGVersion, row, row + pageLen - 1, 0, 9999, null, sql1, null, null, null, null, false, null, cb1);
    } else {
      REClient_.client_()._getFeatureGroupData(this.calcProjectId(), this.calcFeatureGroupId(), version1, row, row + pageLen - 1, 0, 9999, null, sql1, null, null, null, null, null, cb1);
    }
  };

  nlpGetData = (isMore = false, force = false) => {
    if (this.state.nlpDataIsRefreshing && !force) {
      return;
    }

    let foundProject1 = this.memProjectId(false)(this.calcProjectId(), this.props.projects);
    const isNlp = this.calcIsNlp();

    if (!isNlp) {
      return;
    }

    if (!isMore) {
      this.setState({
        nlpData: [],
        nlpDataIsRefreshing: true,
        nlpNoMore: false,
        nlpRowSelIndex: null,
        nlpCount: null,
      });
    } else {
      this.setState({
        nlpDataIsRefreshing: true,
      });
    }

    let row = isMore ? (this.state.nlpData ?? []).length : 0;
    const pageLen = 30;

    let isFirst = row === 0;
    if (isFirst) {
      this.setState({
        isDocumentsLoading: true,
      });
    }

    const cb1 = (err, res) => {
      if (isFirst) {
        this.setState({
          isDocumentsLoading: false,
        });
      }

      if (err || !res?.success || res?.result?.documents == null || res?.result?.documents?.length === 0) {
        //error
        Utils.error(err ?? res);
        this.setState({
          nlpNoMore: true,
          nlpDataIsRefreshing: false,
        });

        if (err) {
          REActions.addNotificationError(err);
        }
      } else {
        let docs = res?.result?.documents;

        this.setState((lastState) => {
          let nlpData = lastState?.nlpData ?? [];
          if (isMore) {
            nlpData = [...nlpData, ...(docs ?? [])];
          } else {
            nlpData = docs ?? [];
          }

          let noMore1 = docs?.length < pageLen;
          if (this.state.nlpCount != null && nlpData?.length >= this.state.nlpCount) {
            noMore1 = true;
          }

          let nlpCount = res?.result?.count;

          return {
            nlpData,
            nlpNoMore: noMore1,
            nlpDataIsRefreshing: false,
            nlpCount,
          };
        });
      }
    };

    let version1 = this.calcFeatureGroupVersion();
    if (Utils.isNullOrEmpty(version1)) {
      REClient_.client_()._getFeatureGroupDocuments(this.calcProjectId(), this.calcFeatureGroupId(), row, row + pageLen - 1, cb1);
    } else {
      REClient_.client_()._getFeatureGroupVersionDocuments(this.calcProjectId(), version1, row, row + pageLen - 1, cb1);
    }
  };

  showReqTimeoutDialog = () => {
    let modalRef = confirm({
      title: 'Source data is too large!!',
      okText: 'Okay',
      cancelButtonProps: { hidden: true },
      maskClosable: true,
      content: <div>Please start custom datasetserver to view data</div>,
      onOk: () => modalRef.destroy(),
    });
  };

  sampleGetData = (isMore = false, force = false) => {
    if (this.state.sampleDataIsRefreshing && !force) {
      return;
    }

    let featureGroupOne = this.memFeatureGroupsOne(false)(this.calcProjectId(), this.calcFeatureGroupId(), this.props.featureGroups);
    const useSampleData = featureGroupOne?.enableSampleData === true;

    if (!useSampleData) {
      return;
    }

    if (!isMore) {
      this.setState({
        sampleData: [],
        sampleDataIsRefreshing: true,
        sampleDataNoMore: false,
        sampleDataSelIndex: null,
        sampleDataCount: null,
      });
    } else {
      this.setState({
        sampleDataIsRefreshing: true,
      });
    }

    const fgVersion = this.calcFeatureGroupVersion() ?? featureGroupOne?.latestFeatureGroupVersion?.featureGroupVersion;

    REClient_.client_()._getFeatureGroupVersionSampleData(fgVersion, (err, res) => {
      if (err || !res?.success || res?.result?.data == null) {
        if (typeof err === 'string' && err?.toLocaleLowerCase() === 'gateway timeout') {
          this.showReqTimeoutDialog();
        }
        this.setState({
          sampleData: [],
          sampleDataNoMore: true,
          sampleDataIsRefreshing: false,
        });
      } else {
        let data1 = res?.result?.data;

        this.setState((lastState) => {
          let sampleData = lastState?.nlpData ?? [];
          if (isMore) {
            sampleData = [...sampleData, ...(data1 ?? [])];
          } else {
            sampleData = data1 ?? [];
          }

          let noMore1 = false;

          let sampleDataCount = res?.result?.count ?? res?.result?.data?.length;
          let sampleColumns: any = res?.result?.columns ?? {};

          return {
            sampleColumns,
            sampleData,
            sampleDataNoMore: noMore1,
            sampleDataIsRefreshing: false,
            sampleDataCount,
          };
        });
      }
    });
  };

  componentWillUnmount() {
    this.isM = false;
    this.unDark();

    if (this.confirmValues != null) {
      this.confirmValues.destroy();
      this.confirmValues = null;
    }
  }

  memGetCache = memoizeOne((useId, rowStartIndex, rowStopIndex, columnStartIndex, columnStopIndex, doCallRequest = true) => {
    return this.cacheGrid.onScroll(rowStartIndex, rowStopIndex, columnStartIndex, columnStopIndex, doCallRequest);
  });

  gridOnScroll = ({ clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth }) => {
    // @ts-ignore
    if (this.refs.sizer && this.refs.sizer.refs.chartsDiv) {
      // @ts-ignore
      let $1 = $(this.refs.sizer.refs.chartsDiv);
      if ($1.scrollTop() !== scrollTop) {
        $1.scrollTop(scrollTop);
      }
    }
  };

  gridOnSectionRendered = ({ columnOverscanStartIndex, columnOverscanStopIndex, columnStartIndex, columnStopIndex, rowOverscanStartIndex, rowOverscanStopIndex, rowStartIndex, rowStopIndex }) => {
    this.lastRangeGridRender = { columnOverscanStartIndex, columnOverscanStopIndex, columnStartIndex, columnStopIndex, rowOverscanStartIndex, rowOverscanStopIndex, rowStartIndex, rowStopIndex };
    if (this.timeoutCallRangeRender) {
      clearTimeout(this.timeoutCallRangeRender);
      this.timeoutCallRangeRender = null;
    }

    this.timeoutCallRangeRender = setTimeout(() => {
      const sizeRes = this.memRowsColumnsCount(
        this.props.defDatasets,
        this.props.projects,
        this.calcProjectId(),
        this.calcDatasetId(),
        this.calcBatchPredId(),
        this.calcModelVersion(),
        this.calcFeatureGroupId(),
        this.calcFeatureGroupVersion(),
        this.calcDatasetVersion(),
      );

      this.timeoutCallRangeRender = null;
      this.memGetCache(this.cacheGrid.useId, rowOverscanStartIndex, rowOverscanStopIndex, columnOverscanStartIndex, columnOverscanStopIndex, true);
    }, 200);
  };

  calcKeyForSort = () => {
    let projectId = this.calcProjectId();
    let datasetId = this.props.paramsProp?.get('datasetId');
    let featureGroupId = this.props.paramsProp?.get('featureGroupId');
    let batchPredId = this.props.paramsProp?.get('batchPredId');
    let modelVersion = this.props.paramsProp?.get('modelVersion');
    let datasetVersion = this.props.paramsProp?.get('datasetVersion');
    let featureGroupVersion = this.calcFeatureGroupVersion();

    return 'sort_key_' + (projectId || '-') + (datasetId || '-') + (featureGroupId || '-') + (batchPredId || '-') + (modelVersion || '-') + (featureGroupVersion || '-') + (datasetVersion || '-');
  };

  onClickSortByCol = (col, isAsc, e) => {
    col = isAsc == null ? null : col;
    this.setState({
      orderByColumn: col,
      isAscending: isAsc,
    });

    let key1 = this.calcKeyForSort();
    if (!Utils.isNullOrEmpty(key1) && (_.isString(col) || col == null)) {
      let listSort = Utils.tryJsonParse(Utils.dataNum(SortKeyStorage, null) ?? '[]');
      if (listSort == null || !_.isArray(listSort)) {
        listSort = [];
      }
      let ind1 = _.findIndex(listSort, (s1) => (s1 as any)?.key === key1);
      if (ind1 > -1) {
        listSort.splice(ind1, 1);
      }
      listSort.push({
        key: key1,
        column: col,
        isAsc: isAsc,
      });

      let max = 50;
      while (max > 0 && listSort.length > 40) {
        max--;
        listSort.splice(0, 1);
      }

      Utils.dataNum(SortKeyStorage, null, JSON.stringify(listSort));
    }
  };

  onClickTopMore = (columnIndex, fieldName, chartData, e) => {
    if (chartData != null) {
      this.onClickViewValues(columnIndex, chartData, e);
    }
  };

  cellRenderer = (
    isShadowFGIsDocumentset,
    docStoreDef,
    colsImagesNames,
    rowIdCol,
    showDetail1,
    disableFilters,
    showCustomDS,
    showFilters,
    columnsCount,
    sampleData,
    sampleColumnsUsed,
    isUnmaterFG,
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

    let getValueRef = (row, col) => {
      let cc = this.cacheGrid.onScroll(row, row, col, col, false);

      let isRef = true;
      let res: any = null;
      cc &&
        cc.some((c1) => {
          if (!c1.isRetrieving && row >= c1.fromRow && row <= c1.toRow && col >= c1.fromCol && col <= c1.toCol) {
            if (c1.data) {
              let c2 = c1.data[row - c1.fromRow];
              if (c2) {
                isRef = false;
                res = c2[col - c1.fromCol];

                let content = res;
                if (content != null && _.isObject(content) && !_.isNumber(content) && !_.isString(content) && !_.isBoolean(content)) {
                  res = '{...}';
                }
              }
            }
            return true;
          }
        });

      return [res, isRef];
    };
    let getValue = (row, col) => {
      return getValueRef(row, col)?.[0];
    };

    let foundProject1 = this.memProjectId(false)(this.calcProjectId(), this.props.projects);
    const isNlp = this.calcIsNlp();

    const allowSort = this.calcAllowSort();
    let fieldName;

    if (rowIndex === 0) {
      if (columnIndex === 0) {
        content = '';
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 1);
        content = 'Col: ' + columnIndex;
        if (field1) {
          if (field1) {
            fieldName = field1.get('col_name') || field1.get('name');
            content = fieldName || '-';
          }
        }
      }
    } else {
      if (columnIndex === 0) {
        content = (
          <div>
            {rowIndex}
            {!isNlp && isUnmaterFG !== true && (
              <span
                css={`
                  color: #34a3e8;
                  margin-left: 12px;
                  cursor: pointer;
                `}
                onClick={(e) => this.onClickShowDetail(e, rowIndex)}
              >
                <TooltipExt title={'Row Detail'}>
                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEye').faEye} transform={{ size: 18 }} />
                </TooltipExt>
              </span>
            )}
          </div>
        );
      } else {
        let isRef;
        [content, isRef] = getValueRef(rowIndex - 1, columnIndex - 1);
        if (content == null) {
          if (isScrolling) {
            content = '...';
          } else if (isRef === true) {
            content = <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} />;
          }
        } else {
          let field1 = this.getFieldFromIndex(columnIndex - 1);
          if (field1) {
            let fieldName = field1.get('col_name') || field1.get('name');

            let isDocStoreShareFGUse = false;
            if (isShadowFGIsDocumentset && docStoreDef?.shadowFGMinColumnsLeft != null && docStoreDef?.shodowFGColumns?.includes(fieldName?.toLowerCase())) {
              let row1: any = {};

              for (let i = 0; i < docStoreDef?.shadowFGMinColumnsLeft ?? 0; i++) {
                const v1 = getValue(rowIndex - 1, i);
                let field1 = this.getFieldFromIndex(i);
                row1[field1?.get('col_name') ?? field1?.get('name')] = v1;
              }

              if (docStoreDef?.shadowFGCustomRender?.(row1) === true) {
                isDocStoreShareFGUse = true;
              }
            }

            if (colsImagesNames?.includes(fieldName) || isDocStoreShareFGUse) {
              let docId = content;
              let annotationsEditBaseLink = null;
              let rowId = null;

              if (docStoreDef?.annotationSupport) {
                let projectId = this.calcProjectId();
                let featureGroupId = this.calcFeatureGroupId();
                annotationsEditBaseLink = '/' + PartsLink.annotations_edit + '/' + (projectId ?? '-') + '/' + featureGroupId;

                if (rowIdCol) {
                  // Get the value of the "ROW_ID" feature column for the current row
                  const lookupColumns = Math.min(columnsCount ?? 20, 20);
                  for (let i = 0; i < lookupColumns; i++) {
                    const v1 = getValue(rowIndex - 1, i);
                    const f1 = this.getFieldFromIndex(i);
                    const f1Name = f1?.get('col_name') ?? f1?.get('name');
                    if (f1Name?.toLowerCase() === rowIdCol?.toLowerCase()) {
                      rowId = v1;
                      break;
                    }
                  }
                }
              }
              content = (docStoreDef?.type === DocStoreType.vision ? DocStoreDefForcedVision : docStoreDef)?.renderOne?.({ docId: content }, ['docId'], {
                maxWW: 32,
                maxHH: 32,
                annotationsEditBaseLink: annotationsEditBaseLink,
                rowId: rowId,
              });
              if (content == null) {
                content = docId;
              } else if (content != null && docId != null) {
                content = (
                  <div
                    css={`
                      display: flex;
                      gap: 5px;
                      overflow: hidden;
                      align-items: center;
                    `}
                  >
                    <span>{content}</span>
                    <span
                      css={`
                        flex: 1;
                      `}
                    >
                      <div
                        css={`
                          width: 100%;
                          height: 40px;
                          font-size: 12px;
                        `}
                        className={sd.ellipsis2Lines}
                      >
                        {docId}
                      </div>
                    </span>
                  </div>
                );
              }
            } else {
              let dataTypeList = field1.get('data_types');
              dataTypeList = dataTypeList && dataTypeList.toJS(); //TODO use isList future

              if (_.isArray(dataTypeList) && dataTypeList[0] === 'array') {
                content = [];
                for (let i = 0; i < 10; i++) {
                  content.push(rowIndex * 2 + i);
                }

                if (!_.isArray(content)) {
                  content = 'Error';
                } else {
                  content = '';
                }
              } else {
                let dataType = this.calcTypeFromField(field1)?.toLowerCase();
                if (dataType === 'TIMESTAMP'.toLowerCase()) {
                  if (typeof content === 'number' && String(content).length < 13) {
                    content *= 1000; // convert seconds to milliseconds
                  }
                  let dt1 = moment(content);
                  if (dt1.isValid()) {
                    content = dt1.format('YYYY-MM-DD HH:mm:ss');
                  }
                } else if (['number', 'float', 'numeric', 'NUMERICAL'.toLowerCase()].includes(dataType)) {
                  if (field1?.get('dataType')?.toUpperCase() === 'INTEGER') {
                    content = Utils.roundDefault(content, 0);
                  } else {
                    content = Utils.roundDefault(content);
                  }
                }
              }

              if (_.isString(content)) {
                if (content != null && /^https?:\/\/[^\s\n\r]+$/i.test(content)) {
                  content = (
                    <div
                      css={`
                        padding: 0 4px;
                      `}
                      className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}
                    >
                      <Link to={content} newWindow noApp noAutoParams showAsLinkBlue usePointer>
                        {content}
                      </Link>
                    </div>
                  );
                }
              }
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
    if (this.state.hoveredRowIndex === rowIndex) {
      styleF.backgroundColor = '#344962';
    }
    if (this.state.selectedRowIndex === rowIndex) {
      styleF.backgroundColor = '#346235';
      if (this.state.hoveredColumnIndex === columnIndex) {
        styleF.backgroundColor = '#448044';
      }
    }

    if (_.isString(content) || _.isNumber(content)) {
      let content0: any = content;
      if (rowIndex === 0 && columnIndex > 0 && !isNlp) {
        if (!Utils.isNullOrEmpty(this.state.selectedColumnsText)) {
          content0 = UtilsTS.highlightIsTextInside(content0, this.state.selectedColumnsText, true);
        }

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
        if (disableFilters) {
          filter1 = (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <TooltipExt title={`Disabled${!showCustomDS ? '' : '. Start custom data server to activate'}`}>
                <span
                  css={`
                    opacity: 0.44;
                  `}
                >
                  <FontAwesomeIcon
                    icon={require('@fortawesome/pro-solid-svg-icons/faFilter').faFilter}
                    transform={{ size: 18, x: 0, y: 0 }}
                    style={{ marginLeft: '7px', cursor: 'pointer', color: alreadyFilter ? Constants.blue : 'white' }}
                  />
                </span>
              </TooltipExt>
            </span>
          );
        }

        let filterDisabled = false;
        if (this.state.isUseFilterSql || this.state.isUseFilterSqlPrompt) {
          filter1 = null;
          filterDisabled = true;
        }
        if (!Constants.flags.raw_data_filters) {
          filter1 = null;
        }

        if (this.props.isFeatureGroup) {
          let featureGroupId = this.calcFeatureGroupId();
          let featureGroupOne = this.memFeatureGroupsOne(false)(this.calcProjectId(), featureGroupId, this.props.featureGroups);
        } else {
          let datasetId = this.calcDatasetId();
          let datasetFound = calcDatasetById(undefined, datasetId);
          if (!datasetFound?.get('shouldEnableSearch')) {
            filter1 = null;
            filterDisabled = true;
          }
        }
        if (!showFilters) {
          if (!disableFilters) {
            filter1 = null;
          }
          filterDisabled = true;
        }

        let allListColumns = this.memListFieldNamesForVersion(false)(this.memListFieldNamesForVersionCache, this.calcFeatureGroupVersion());
        //Extra Info
        let overlayFilterNone = (
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
              noFilter
              allListColumns={allListColumns}
              columnName={fieldName}
              fgId={this.calcFeatureGroupId()}
              fgVersion={this.calcFeatureGroupVersion()}
              onClickTopMore={filterDisabled ? null : this.onClickTopMore.bind(this, columnIndex, fieldName)}
              topTenValuesMap={filterDisabled ? null : this.state.topTenValuesMap?.[fieldName]}
              onClear={this.onClickSetFilter.bind(this, columnIndex, '')}
              onCancel={() => {
                this.setState({ filterValuesPopoverVisibleNone: null });
              }}
              onSet={this.onClickSetFilter.bind(this, columnIndex)}
            />
          </div>
        );

        let filterNone1 = (
          <span css={disableFilters ? `opacity: 0.44;` : `opacity: 0.64; &:hover { opacity: 1; }`}>
            <FontAwesomeIcon
              icon={require('@fortawesome/pro-solid-svg-icons/faSwatchbook').faSwatchbook}
              transform={{ size: 18, x: 0, y: 0 }}
              style={{ marginLeft: '7px', cursor: 'pointer', color: alreadyFilter ? Constants.blue : 'white' }}
            />
          </span>
        );
        if (disableFilters) {
          filterNone1 = (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <TooltipExt title={'Disabled. Start custom data server to activate'}>{filterNone1}</TooltipExt>
            </span>
          );
        } else {
          filterNone1 = (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <TooltipExt title={'Attributes'}>
                <Popover
                  destroyTooltipOnHide={true}
                  open={this.state.filterValuesPopoverVisibleNone === columnIndex}
                  onOpenChange={(isV) => {
                    this.setState({ filterValuesPopoverVisibleNone: isV ? columnIndex : null });
                  }}
                  placement={'bottom'}
                  overlayClassName={sd.popback}
                  getPopupContainer={popupContainerForMenu}
                  content={overlayFilterNone}
                  trigger={['click']}
                >
                  {filterNone1}
                </Popover>
              </TooltipExt>
            </span>
          );
        }
        if (this.state.topTenValuesMap?.[fieldName] == null && !this.calcFeatureGroupVersion()) {
          filterNone1 = null;
        }
        if (!showFilters && !disableFilters) {
          filterNone1 = null;
        }

        //
        content0 = (
          <span>
            <TooltipExt title={content}>{content0}</TooltipExt>
            {filter1}
            {filterNone1}
          </span>
        );
      }

      if (rowIndex === 0 && columnIndex > 0) {
        if (allowSort && !Utils.isNullOrEmpty(content)) {
          let opa1: any = 0;
          let sort1 = null;
          let isAsc = true;
          sort1 = (
            <FontAwesomeIcon
              className={'sortIcon'}
              icon={require('@fortawesome/pro-regular-svg-icons/faLongArrowDown').faLongArrowDown}
              transform={{ size: 20, x: 0, y: 0 }}
              style={{ color: 'white', cursor: 'pointer', marginLeft: '6px' }}
            />
          );
          if (this.state.orderByColumn === content) {
            opa1 = '1 !important';
            sort1 = (
              <FontAwesomeIcon
                className={'sortIcon'}
                icon={this.state.isAscending ? require('@fortawesome/pro-regular-svg-icons/faLongArrowDown').faLongArrowDown : require('@fortawesome/pro-regular-svg-icons/faLongArrowUp').faLongArrowUp}
                transform={{ size: 20, x: 0, y: 0 }}
                style={{ color: 'white', cursor: 'pointer', marginLeft: '6px' }}
              />
            );
            if (this.state.isAscending === false) {
              isAsc = null;
            } else {
              isAsc = this.state.isAscending == null ? true : !this.state.isAscending;
            }
          }
          content0 = (
            <span
              onClick={this.onClickSortByCol.bind(this, content, isAsc)}
              css={`
                cursor: pointer;
                & .sortIcon {
                  opacity: ${opa1};
                }
                &:hover .sortIcon {
                  opacity: 0.7 !important;
                }
              `}
            >
              {content0}
              {sort1}
            </span>
          );
        }
      }
      if (rowIndex > 0 && columnIndex > 0) {
        let field1 = this.getFieldFromIndex(columnIndex - 1);
        let dataType = this.calcTypeFromField(field1)?.toLowerCase();
        if (dataType?.toLowerCase() === 'json') {
          let json1 = Utils.tryJsonParse(content0);
          if (json1 != null) {
            let jsonElem = (
              <Provider store={Utils.globalStore()}>
                <div css={``} className={'useDark'}>
                  <div
                    css={`
                      border-bottom: 1px solid #ffffff44;
                      padding-bottom: 10px;
                      margin-bottom: 10px;
                    `}
                  >
                    JSON Viewer
                  </div>
                  <div>
                    <EditorElem editorOptions={{ lineNumbers: true, folding: true }} hideExpandFull lang={'json'} readonly height={400} value={JSON.stringify(json1, undefined, 2)} />
                  </div>
                </div>
              </Provider>
            );

            content0 = (
              <span
                css={`
                  display: flex;
                  align-items: center;
                `}
              >
                <span
                  css={`
                    flex: 1;
                  `}
                  className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}
                >
                  {content0}
                </span>
                <span
                  css={`
                    margin-left: 4px;
                  `}
                >
                  <ModalConfirm okText={'Close'} okType={'primary'} cancelText={null} title={jsonElem} width={900}>
                    <Button
                      type={'default'}
                      ghost
                      size={'small'}
                      css={`
                        font-size: 11px;
                        opacity: 0.8;
                        border-radius: 5px;
                      `}
                    >
                      View
                    </Button>
                  </ModalConfirm>
                </span>
              </span>
            );
          }
        }
      }

      content = <div className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}>{content0}</div>;
    }
    if (content != null && _.isBoolean(content)) {
      content = Utils.upperFirst('' + content);
    }

    if (_.isString(content)) {
      if (content.length > 200) {
        content = content.substring(0, 200);
      }
    }

    if (rowIndex === 0 && columnIndex > 0) {
      const headerIndex = columnIndex - 1;
      return (
        <div key={key} style={styleF} className={styles.Cell + ' '}>
          <div className={`text-nowrap w-100 ${styles.Cell}`}>{content}</div>
          {/*//@ts-ignore*/}
          <Draggable axis="x" defaultClassName={styles.DragHandle} defaultClassNameDragging={styles.DragHandleActive} onDrag={(e, { deltaX }) => this.resizeCol(headerIndex, deltaX)} position={{ x: 0, y: 0 }}>
            <div className={styles.DragHandleIcon}>⋮</div>
          </Draggable>
        </div>
      );
    }
    const divProps = { className: `${styles.Cell}` };
    return (
      <div
        key={key}
        style={styleF}
        onClick={!showDetail1 ? null : this.onRowClick.bind(this, rowIndex, columnIndex)}
        {...divProps}
        onMouseEnter={this.onRowMouseEnter.bind(this, rowIndex === 0 ? null : rowIndex, columnIndex === 0 ? null : columnIndex)}
      >
        {content}
      </div>
    );
  };

  resizeCol = (columnIndex, deltaX) => {
    const updatedColumns = this.state.columnCfg.map((colCfg, index) => {
      if (columnIndex === index) {
        return { ...colCfg, width: Math.max(colCfg.width + deltaX, 10) };
      }
      return { ...colCfg };
    });
    this.setState({ columnCfg: updatedColumns }, () => {
      // @ts-ignore
      this.refs.sizer.refs.gridRef.forceUpdate();
      // @ts-ignore
      this.refs.sizer.refs.gridRef.recomputeGridSize();
    });
  };

  calcAllowSort = () => {
    let featureGroupVersion = this.calcFeatureGroupVersion();
    return this.props.isFeatureGroup && !Utils.isNullOrEmpty(featureGroupVersion);
  };

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

    this.setState({
      filterValues: ff,
      filterValuesPopoverVisible: null,
      filterValuesPopoverVisibleNone: null,
    });
  };

  onRowMouseChangeIndex = (rowIndex, columnIndex) => {
    if (this.state.hoveredRowIndex !== rowIndex || this.state.hoveredColumnIndex !== columnIndex) {
      this.setState({
        hoveredRowIndex: rowIndex,
        hoveredColumnIndex: columnIndex,
      });
    }
  };

  onRowClick = (rowIndex, columnIndex, e) => {
    if (rowIndex === 0) {
      rowIndex = null;
    }

    if (rowIndex != null) {
      if (this.state.selectedRowIndex !== rowIndex) {
        this.setState({
          selectedRowIndex: rowIndex,
          // showDetail: true,
        });
      }
    }
  };

  onRowMouseEnter = (rowIndex, columnIndex, e) => {
    this.onRowMouseChangeIndex(rowIndex, columnIndex);
  };

  onRowMouseLeave = (e) => {
    this.onRowMouseChangeIndex(null, null);
  };

  getFieldFromIndex = (index, ignoreSelectedColumns = false) => {
    if (this.state.filterSqlColumns != null) {
      return this.state.filterSqlColumns[index];
    } else if (this.state.selectedColumnsUsed != null && !ignoreSelectedColumns) {
      return this.state.selectedColumnsUsed[index];
    }

    let { paramsProp, projects } = this.props;
    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(false)(projectId, projects);

    let dataset1 = null;
    let projectIsNone = this.calcProjectIsNone();
    if (foundProject1 || projectIsNone) {
      if (this.props.isFeatureGroup) {
        dataset1 = this.memFeatureGroupSchema(false)(this.props.defDatasets, this.calcProjectId(), this.calcFeatureGroupId(), this.calcFeatureGroupVersion());
      } else {
        dataset1 = this.memDatasetSchema(false)(this.props.defDatasets, this.calcDatasetId(), this.calcDatasetVersion());
      }
    }

    if (dataset1) {
      let fieldsList = dataset1.get('schema');
      if (fieldsList) {
        let field1 = fieldsList.get(index);
        if (field1) {
          return field1;
        }
      }
    }
  };

  calcTypeFromField = (field1) => {
    if (field1) {
      let dataType = field1.get('featureType');
      if (dataType != null) {
        return dataType;
      }

      dataType = field1.get('data_types');
      if (dataType) {
        if (_.isString(dataType)) {
          return dataType;
        } else {
          try {
            dataType = dataType.last();
            return dataType;
          } catch (e) {
            return '';
          }
        }
      }
    }
    return null;
  };

  getColumnWidthFromFieldType = (index) => {
    let field1 = this.getFieldFromIndex(index - 1);
    if (field1) {
      let type1 = this.calcTypeFromField(field1);

      if (type1?.toLowerCase() === 'json') {
        return 270;
      } else if (type1?.toLowerCase() === 'array') {
        return 200;
      } else if (type1 === 'string' || type1 === 'CATEGORICAL' || type1 === 'CATEGORICAL'.toLowerCase()) {
        return 240;
      } else if (type1 === 'number' || type1 === 'numeric' || type1 === 'NUMERICAL') {
        return 160;
      } else if (type1?.toUpperCase() === 'TIMESTAMP') {
        return 200;
      } else {
        return 120;
      }
    }

    return 100;
  };

  generateColumnsCfg = (columnsCount) => {
    let columnCfg = this.state.columnCfg;
    let res = new Array(columnsCount).fill({ width: 200 });
    if (_.isEqual(columnCfg, res)) {
      res = columnCfg;
    }
    return res;
  };

  gridColumnWidth = ({ index }) => {
    if (index === 0) {
      return 80;
    }

    return this.state.columnCfg[index - 1] ? this.state.columnCfg[index - 1].width : this.getColumnWidthFromFieldType(index);
  };

  memCacheSize = memoizeOne(
    (
      featureGroupId,
      datasetId,
      rowsCount,
      columnsCount,
      filterValues,
      filterSql,
      filterSqlColumns,
      featureGroupVersion,
      datasetVersion,
      orderByColumn,
      isAscending,
      selectedColumns,
      selectedColumnsNonIgnored,
      prioritizeFeatureMappedColumns,
    ) => {
      this.cacheGrid.setSize(rowsCount, columnsCount);
      // @ts-ignore
      this.refs.sizer?.refs?.gridRef?.forceUpdateGrids();
      // @ts-ignore
      this.refs.sizer?.refs?.gridRef?.recomputeGridSize();

      setTimeout(() => {
        if (!this.isM) {
          return;
        }

        // @ts-ignore
        this.refs.sizer?.refs?.gridRef?.forceUpdateGrids();
        // @ts-ignore
        this.refs.sizer?.refs?.gridRef?.recomputeGridSize();
        if (this.lastRangeGridRender) {
          this.gridOnSectionRendered(this.lastRangeGridRender);
        }

        this.gotoTopLeft();
      }, 0);
    },
  );

  gotoTopLeft = () => {
    setTimeout(() => {
      if (!this.isM) {
        return;
      }

      this.setState(
        {
          scrollToRow: 1,
          scrollToColumn: 1,
        },
        () => {
          if (!this.isM) {
            return;
          }

          setTimeout(() => {
            if (!this.isM) {
              return;
            }

            this.setState({
              scrollToRow: undefined,
              scrollToColumn: undefined,
            });
          }, 0);
        },
      );
    }, 0);
  };

  memFeatureGroupSchema = memoizeOneCurry((doCall, defDatasetsParam, projectId, featureGroupId, featureGroupVersion) => {
    return defDatasets.memSchemaForFeatureGrouptId(doCall, projectId, featureGroupId, null, featureGroupVersion);
  });

  memDatasetSchema = memoizeOneCurry((doCall, defDatasetsParam, datasetId, datasetVersion) => {
    if (datasetVersion) {
      let dsSchema1 = calcFileSchemaByDatasetVersion(undefined, datasetVersion);
      if (dsSchema1 != null) {
        return dsSchema1;
      } else {
        if (defDatasetsParam.get('isRefreshing') === 0) {
          if (doCall) {
            StoreActions.schemaGetFileSchemaVersion_(datasetVersion);
          }
        }
      }
      return null;
    }
    if (defDatasetsParam && datasetId) {
      let dsSchema1 = calcFileSchemaByDatasetId(undefined, datasetId);
      if (dsSchema1 == null) {
        if (defDatasetsParam.get('isRefreshing') === 0) {
          if (doCall) {
            StoreActions.schemaGetFileSchema_(datasetId);
          }
        }
      } else {
        return dsSchema1;
      }
    }
  });

  memDatasetVersionOne = memoizeOneCurry((doCall, datasetsParam, datasetId, datasetVersion) => {
    let res = datasets.memDatasetListVersions(doCall, undefined, datasetId);
    if (res != null) {
      return res?.find((r1) => r1?.datasetVersion === datasetVersion);
    } else {
      return null;
    }
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memChartsList = memoizeOne((chartsUuid, chartsList) => {
    if (chartsList && chartsList != null) {
      let res = [];

      chartsList.some((chart1, chart1ind) => {
        let div1 = <ChartXYExt key={'chart_right_' + chart1ind} index={chart1ind} data={chart1} />;
        res.push(div1);
      });
      return res.length === 0 ? null : res;
    }
  });

  memCharts = memoizeOneCurry((doCall, chartsUuid, defDatasetsParam, datasetId, projectId) => {
    if (defDatasetsParam && datasetId && projectId && chartsUuid != null) {
      if (datasetId) {
        let chartsDS1 = calcChartsDatasetById(undefined, datasetId, projectId);
        if (chartsDS1) {
          let chartList = chartsDS1.get('charts');
          if (!doCall) {
            return this.memChartsList(chartsUuid, chartList);
          }
        } else {
          if (defDatasetsParam && !defDatasetsParam.get('isRefreshing')) {
            if (doCall) {
              StoreActions.chartsByDatasetId_(datasetId, projectId, 20, () => {});
            }
          }
        }
      }
    }
  });

  memChartsFG = memoizeOneCurry((doCall, chartsUuid, featureGroupsParam, projectId, featureGroupVersion) => {
    if (featureGroupVersion) {
      let res = featureGroups.memFeatureGroupsChartsForId(doCall, projectId, featureGroupVersion);
      if (res != null && res?.charts != null) {
        res = res?.charts;
      } else {
        res = null;
      }
      if (!res) {
        return res;
      } else {
        return this.memChartsList(chartsUuid, res);
      }
    }
  });

  onScrollCharts = (e) => {
    // @ts-ignore
    if (this.refs.sizer && this.refs.sizer.refs.chartsDiv) {
      // @ts-ignore
      let top1 = $(this.refs.sizer.refs.chartsDiv).scrollTop();

      // @ts-ignore
      if (this.refs.sizer && this.refs.sizer.refs.gridRef && this.refs.sizer.refs.gridRef._bottomRightGrid) {
        // @ts-ignore
        this.refs.sizer.refs.gridRef._bottomRightGrid.scrollToPosition({ scrollTop: top1 });
      }
    }
  };

  memFeatureGroupsOptions = memoizeOne((featureGroupList) => {
    if (featureGroupList) {
      return featureGroupList.map((f1, f1ind) => {
        let n1 = f1.tableName ?? f1.name;
        return {
          value: f1.featureGroupId,
          label: <span style={{ fontWeight: 600 }}>{n1}</span>,
          name: n1,
          search: n1,
        };
      });
    }
  });

  memDatasetVersionsOptions = memoizeOne((fgVersionsList, datasetOne) => {
    return fgVersionsList?.map((f1) => ({
      label: (
        <span>
          <span
            css={`
              display: none;
            `}
            className={'textVersion'}
          >
            {f1?.datasetVersion}&nbsp;-&nbsp;
          </span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: f1.datasetVersion,
      data: f1,
    }));
  });

  memFGVersionsOptions = memoizeOne((fgVersionsList, featureGroupOne) => {
    let res = fgVersionsList?.map((f1) => ({
      label: (
        <span>
          <span className={'textVersion'}>{f1?.featureGroupVersion}&nbsp;-&nbsp;</span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: f1.featureGroupVersion,
      data: f1,
    }));
    if (featureGroupOne?.latestVersionOutdated !== false || res == null || res?.length === 0 || ![FeatureGroupVersionLifecycle.COMPLETE].includes(featureGroupOne?.latestFeatureGroupVersion?.status ?? '')) {
      res = res ?? [];
      if (featureGroupOne?.featureGroupSourceType?.toUpperCase() === 'PYTHON') {
      } else {
        res.unshift({ label: 'Latest (Unmaterialized)', value: null, data: null });
      }
    }
    return res;
  });

  memFGVersions = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupsVersionsForFeatureGroupId(doCall, featureGroupId);
  });

  memDatasetVersions = memoizeOneCurry((doCall, datasetsParam, datasetId) => {
    return datasets.memDatasetListVersions(doCall, datasetsParam, datasetId);
  });

  memDatasetsOptions = memoizeOne((listDatasets) => {
    let optionsDatasets = [];
    if (listDatasets) {
      let listFiltered = listDatasets;
      Object.values(listFiltered).some((p1: Immutable.Map<string, any>) => {
        let obj1 = {
          value: p1.getIn(['dataset', 'datasetId']),
          label: <span style={{ fontWeight: 600 }}>{p1.getIn(['dataset', 'name']) as any}</span>,
          name: p1.getIn(['dataset', 'name']),
          search: p1.getIn(['dataset', 'name']),
        };
        optionsDatasets.push(obj1);
      });
    }

    optionsDatasets &&
      optionsDatasets.sort((a, b) => {
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      });

    return optionsDatasets;
  });

  onChangeSelectURLDirectFromValueFGVersion = (option1) => {
    if (!option1) {
      return;
    }

    const sizeRes = this.memRowsColumnsCount(
      this.props.defDatasets,
      this.props.projects,
      this.calcProjectId(),
      this.calcDatasetId(),
      this.calcBatchPredId(),
      this.calcModelVersion(),
      this.calcFeatureGroupId(),
      this.calcFeatureGroupVersion(),
      this.calcDatasetVersion(),
    );
    let columnsCount = 0;
    if (sizeRes != null) {
      columnsCount = sizeRes?.columnsCount ?? 0;
    }

    let st1 = Utils.stateMergeIfNotEqual(this.state, {
      isUseFilterSql: false,
      isUseFilterSqlPrompt: false,
      promptBounce: null,
      filterSql: null,
      filterSqlBounce: null,

      showDetail: false,
      isDocumentsLoading: false,
      lastDataErrorMsg: undefined,
      filterValues: null,
      filterValuesPopoverVisible: null,
      filterValuesPopoverVisibleNone: null,
      selectedColumns: null,
      selectedColumnsText: null,
      filterSqlColumns: null,
      selectedColumnsNonIgnored: false,
      prioritizeFeatureMappedColumns: false,
      ...(!this.state.selectedColumnsUsed && { columnCfg: this.generateColumnsCfg(columnsCount) }),
    });
    if (st1) {
      this.setState(st1);
    }

    let { paramsProp } = this.props;

    if (this.calcIsNlp()) {
      setTimeout(() => {
        this.setState({
          nlpData: null,
          nlpDataIsRefreshing: false,
          nlpNoMore: false,
          nlpRowSelIndex: null,
          nlpCount: null,
        });
      }, 0);
    }
    if (this.calcIsDocStore()) {
      setTimeout(() => {
        this.setState({
          docData: null,
          docDataIsRefreshing: false,
          docNoMore: false,
          docRowSelIndex: null,
          docCount: null,
        });
      }, 0);
    }

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let p1 = this.calcProjectId();
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '';
      }

      if (this.props.isFeatureGroup) {
        if (this.props.paramsProp?.get('projectId') === '-') {
          p1 = '/-';
        }

        let param1 = 'featureGroupVersion=' + encodeURIComponent(option1?.value ?? '');

        let f1 = paramsProp && paramsProp.get('featureGroupId');
        Location.push('/' + mode + p1 + '/' + f1, undefined, param1);
      } else {
        let param1 = 'datasetVersion=' + encodeURIComponent(option1?.value ?? '');

        let f1 = paramsProp && paramsProp.get('datasetId');
        Location.push('/' + mode + '/' + f1 + p1, undefined, param1);
      }
    }
  };

  onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    this.setState({
      showDetail: false,
      isDocumentsLoading: false,
      lastDataErrorMsg: undefined,
      isUseFilterSql: false,
      isUseFilterSqlPrompt: false,
      promptBounce: null,
      filterSql: null,
      filterSqlBounce: null,
    });

    let { paramsProp } = this.props;

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let p1 = this.calcProjectId();
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '';
      }

      this.memFGVersionParamUsed = false;

      if (this.calcIsNlp()) {
        setTimeout(() => {
          this.setState({
            nlpData: null,
            nlpDataIsRefreshing: false,
            nlpNoMore: false,
            nlpRowSelIndex: null,
            nlpCount: null,
          });
        }, 0);
      }
      if (this.calcIsDocStore()) {
        setTimeout(() => {
          this.setState({
            docData: null,
            docDataIsRefreshing: false,
            docNoMore: false,
            docRowSelIndex: null,
            docCount: null,
          });
        }, 0);
      }

      if (this.props.isFeatureGroup) {
        if (this.props.paramsProp?.get('projectId') === '-') {
          p1 = '/-';
        }

        Location.push('/' + mode + p1 + '/' + optionSel.value);
      } else {
        Location.push('/' + mode + '/' + optionSel.value + p1);
      }
    }
  };

  memDatasetOne = memoizeOneCurry((doCall, datasetsParam, datasetId) => {
    if (!datasetId) {
      return;
    }
    return datasets.memDatasetsFromIDs(doCall, [datasetId])?.[datasetId];
  });

  onClickShowDetail = (e, rowIndex) => {
    this.onRowClick(rowIndex, null, e);
    let v1 = !this.state.showDetail;

    if (this.activeRowIndex != rowIndex) {
      v1 = true;
    }

    this.activeRowIndex = rowIndex;

    let isStateChanged = !!this.state.showDetail !== !!v1;

    this.setState({
      showDetail: v1,
    });
    if (!v1) {
      this.setState({
        selectedRowIndex: null,
      });
    }

    // if(isStateChanged) {
    //   setTimeout(() => {
    //     // @ts-ignore
    //     this.refs.sizer?.refs?.gridRef?.forceUpdateGrids();
    //     // @ts-ignore
    //     this.refs.sizer?.refs?.gridRef?.recomputeGridSize();
    //     this.forceUpdate();
    //   }, 0);
    // }
    // Utils.dataNum(showDetailSaveStorageName, undefined, v1);
  };

  onClickShowMoreDetailAllColumns = (e) => {
    this.setState({
      showDetailAllCols: true,
    });
  };

  memJsonString = (selRowId, rowIndex, columnsCount, sampleData, sampleColumnsUsed) => {
    let getValue = (row, col) => {
      if (sampleData != null) {
        let res = sampleData?.row?.[col];
        return res;
      }

      let cc = this.cacheGrid.onScroll(row, row, col, col, false);

      let res: any;
      cc &&
        cc.some((c1) => {
          if (!c1.isRetrieving && row >= c1.fromRow && row <= c1.toRow && col >= c1.fromCol && col <= c1.toCol) {
            if (c1.data) {
              res = null;
              let c2 = c1.data[row - c1.fromRow] ?? null;
              if (c2) {
                res = c2[col - c1.fromCol] ?? null;
              }
            }
            return true;
          }
        });

      return res;
    };

    if (rowIndex == null) {
      return null;
    }

    let row1 = [],
      needData = false;
    if (sampleData != null) {
      let data1 = sampleData?.[rowIndex] ?? [];
      let r1: any = {};
      sampleColumnsUsed?.some((c1, c1ind) => {
        if (!c1.field) {
          return;
        }

        let v1 = data1?.[c1ind];
        r1[c1ind] = v1;
      });
      row1 = r1;
    } else {
      let data1 = [];
      for (let i = 0; i < columnsCount; i++) {
        data1.push(getValue(rowIndex - 1, i));
      }
      row1 = data1;
    }

    let list = row1;

    let res: any = null;
    if (list && _.isArray(list)) {
      res = {};
      list.some((v1, v1ind) => {
        if (_.isNaN(v1)) {
          v1 = null;
        }
        let field1 = this.getFieldFromIndex(v1ind);
        res[field1?.get('name')] = v1;
      });
    }

    if (res != null && !_.isEmpty(res)) {
      return JSON.stringify(res, undefined, 2);
    } else {
      return null;
    }
  };

  memRenderSelRow = memoizeOne((selRowId, rowIndex, colFrom, colTo, selCol, showDetailAllCols, sampleData, sampleColumnsUsed) => {
    if (selCol != null) {
      selCol--;
      if (selCol < 0) {
        selCol = null;
      }
    }

    let res = [];

    let getValue = (row, col) => {
      if (sampleData != null) {
        let res = sampleData?.row?.[col];
        return res;
      }

      let cc = this.cacheGrid.onScroll(row, row, col, col, false);

      let res: any;
      cc &&
        cc.some((c1) => {
          if (!c1.isRetrieving && row >= c1.fromRow && row <= c1.toRow && col >= c1.fromCol && col <= c1.toCol) {
            if (c1.data) {
              res = null;
              let c2 = c1.data[row - c1.fromRow] ?? null;
              if (c2) {
                res = c2[col - c1.fromCol] ?? null;
              }
            }
            return true;
          }
        });

      return res;
    };

    if (rowIndex == null) {
      return null;
    }

    let row1 = [],
      needData = false;
    if (sampleData != null) {
      let data1 = sampleData?.[rowIndex] ?? [];
      let r1: any = {};
      sampleColumnsUsed?.some((c1, c1ind) => {
        if (!c1.field) {
          return;
        }

        let v1 = data1?.[c1ind];
        if (_.isObject(v1)) {
          v1 = JSON.stringify(v1);
          const max = 40;
          if (v1.length > max) {
            v1 = v1.slice(0, max) + '...';
          }
        }

        r1[c1ind] = v1;
      });
      row1 = r1;
    } else {
      for (let i = colFrom; i < colTo; i++) {
        const v1 = getValue(rowIndex - 1, i);
        row1[i] = v1;
        if (v1 === undefined) {
          needData = true;
          break;
        }
      }

      if (needData) {
        this.cacheGrid.onScroll(rowIndex - 1, rowIndex - 1, colFrom, colTo, true, () => {
          this.setState({
            selRowId: uuid.v1(),
          });
        });
        return null;
      }
    }

    let list = [row1];

    if (list && _.isArray(list)) {
      list.some((data) => {
        let kk = Object.keys(data);
        kk.some((k1, k1ind) => {
          if (!this.state.showDetailAllCols) {
            if (k1ind > maxColsDetail) {
              res.push(
                <div key={'expand_ch'} style={{ textAlign: 'center' }}>
                  <span className={sd.styleTextBlueBright} style={{ cursor: 'pointer' }} onClick={this.onClickShowMoreDetailAllColumns}>
                    Show more
                  </span>
                </div>,
              );
              return true;
            }
          }

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

            let maxV = null,
              maxName = null,
              dataListChart = [];
            dataList?.some((d1) => {
              if (maxV == null || d1.value > maxV) {
                maxV = d1.value;
                maxName = d1.meta;
              }
              dataListChart.push({
                x: d1.meta,
                y: d1.value,
              });
            });

            input = maxName;
            let input2 = maxV;

            const hHH = 260;
            let histogram = (
              <div style={{ position: 'relative', color: 'white', marginTop: '20px' }}>
                <div style={{ height: hHH + 'px', position: 'relative', width: '100%' }}>
                  <div style={{ margin: '0 10px', zIndex: 2, height: hHH + 'px', position: 'relative' }}>
                    <ChartXYExt
                      axisYMin={0}
                      useEC
                      colorIndex={0}
                      height={hHH}
                      data={{ doRotate: true, forceToPrintAllLabels: true, divisorX: null, useTitles: true, titleY: 'Probability of Value', titleX: k1, tooltips: true, data: dataListChart, labels: labels }}
                      type={'bar'}
                    />
                  </div>
                </div>
              </div>
            );

            res.push(
              <div key={'v1ch' + k1 + input + '_' + input2} style={{ color: Utils.colorAall(1), marginTop: '10px' }}>
                <div>
                  {k1}:&nbsp;{input}
                </div>
                <div style={{ marginTop: '4px' }}>Probability:&nbsp;{input2}</div>
                <div>{histogram}</div>
              </div>,
            );
          } else {
            if (_.isNumber(v1)) {
              v1 = Utils.decimals(v1, 2);
            } else if (_.isBoolean(v1)) {
              v1 = '' + v1;
            }

            const field1 = this.getFieldFromIndex(k1);

            let style1: CSSProperties = { padding: '6px', border: '2px solid transparent', borderRadius: '3px', color: Utils.colorAall(1), marginTop: '10px', fontSize: '14px' };
            if ('' + selCol === '' + k1) {
              style1.border = '2px solid #448044';
            }

            res.push(
              <div key={'v1ch' + k1} ref={'v1ch' + k1} style={{ paddingBottom: '10px', borderBottom: '1px solid ' + Utils.colorA(0.2) }}>
                <div style={style1}>
                  <div style={{}}>
                    <b>{field1?.get('name')}</b>
                  </div>
                  <div style={{ marginTop: '4px', color: Utils.colorA(0.7) }}>{v1}</div>
                </div>
              </div>,
            );
          }
        });
      });
    }

    setTimeout(() => {
      if (!this.valuesNano || !this.isM) {
        return;
      }

      const elem1 = this.refs['v1ch' + selCol];
      if (elem1) {
        const top1 = $(elem1).position()?.top;

        this.valuesNano?.scroll(Math.max(0, top1 - 150));
      }
    }, 0);

    return res;
  });

  memRowsColumnsCount: (defDatasets, projects, projectId, datasetId, batchPredId, modelVersion, featureGroupId, featureGroupVersion, datasetVersion) => { columnsCount; rowsCount; rowCountForTable } = memoizeOne(
    (defDatasets, projects, projectId, datasetId, batchPredId, modelVersion, featureGroupId, featureGroupVersion, datasetVersion) => {
      let foundProject1 = this.memProjectId(false)(projectId, projects);
      let datasetSchema1 = null;

      let projectIsNone = this.calcProjectIsNone();
      if (foundProject1 || projectIsNone) {
        if (this.props.isFeatureGroup) {
          datasetSchema1 = this.memFeatureGroupSchema(false)(this.props.defDatasets, projectId, featureGroupId, featureGroupVersion);
        } else {
          datasetSchema1 = this.memDatasetSchema(false)(this.props.defDatasets, datasetId, datasetVersion);
        }
      }

      let rowsCount = 0,
        rowCountForTable = 0;
      let columnsCount = 0;
      if (datasetSchema1) {
        let fieldsList = datasetSchema1.get('schema');
        if (fieldsList) {
          columnsCount = fieldsList.size;
        }

        let row_count = datasetSchema1.getIn(['metadata', 'rowCount']);
        if (row_count != null) {
          rowsCount = row_count + 1;
          rowCountForTable = Math.min(rowsCount, 50000);
        }
      }
      return { columnsCount, rowsCount, rowCountForTable };
    },
  );

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, projectId) => {
    return projectDatasetsReq.memDatasetsByProjectId(doCall, projectDatasets, projectId);
  });

  memDatasetsList = memoizeOneCurry((doCall, datasets, listDatasets) => {
    if (listDatasets) {
      let ids = listDatasets.map((d1) => d1.dataset?.datasetId);
      return datasetsReq.memDatasetListCall(doCall, datasets, ids);
    }
  });

  onClickUseFilterSqlRun = (e) => {
    let sql1 = this.state.filterSqlBounce;
    if (_.trim(sql1 || '') === '') {
      sql1 = null;
    }
    this.setState({
      filterSql: sql1,
      lastDataErrorMsg: null,
    });
  };

  onClickUsePrompt = (e) => {
    if (_.trim(this.state.promptBounce || '') === '') {
      REActions.addNotificationError('Prompt text required!');
      return;
    }

    this.setState({
      promptProcessing: true,
    });
    REClient_.client_()._getSqlSuggestionForRawData(this.calcFeatureGroupId(), this.state.promptBounce, this.calcProjectId(), (err, res) => {
      this.setState({
        promptProcessing: false,
      });

      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let sql1 = res?.result || null;
        if (_.trim(sql1 || '') === '') {
          sql1 = null;
        }
        this.setState({
          // filterSql: sql1,
          filterSqlBounce: sql1,
          isUseFilterSql: true,
        });
      }
    });
  };

  onChangeSqlPrompt = (value) => {
    this.setState({
      promptBounce: value,
    });
  };

  onChangeSqlFilter = (value) => {
    this.setState({
      filterSqlBounce: value,
    });
  };

  onClickShowSqlFilter = (isSqlTitle, e) => {
    let isSql = this.state.isUseFilterSql;
    if (isSqlTitle) {
      isSql = !isSql;
    }

    let isPrompt = this.state.isUseFilterSqlPrompt;
    if (!isSqlTitle) {
      isPrompt = !isPrompt;
    }

    let prompt1 = this.state.promptBounce || 'Show all columns from this table';
    let sql1 = isSql ? '' /*'select * from fg'*/ : null;

    const sizeRes = this.memRowsColumnsCount(
      this.props.defDatasets,
      this.props.projects,
      this.calcProjectId(),
      this.calcDatasetId(),
      this.calcBatchPredId(),
      this.calcModelVersion(),
      this.calcFeatureGroupId(),
      this.calcFeatureGroupVersion(),
      this.calcDatasetVersion(),
    );
    let columnsCount = 0;
    if (sizeRes != null) {
      columnsCount = sizeRes?.columnsCount ?? 0;
    }

    let st1 = Utils.stateMergeIfNotEqual(this.state, {
      isUseFilterSqlPrompt: isPrompt,
      isUseFilterSql: isSql,
      filterSqlColumns: null,
      promptBounce: isSqlTitle ? this.state.promptBounce : prompt1,
      filterSql: isSqlTitle ? null : this.state.filterSql,
      filterSqlBounce: isSqlTitle ? sql1 : this.state.filterSqlBounce,
      filterCountUnbounded: isSqlTitle ? null : this.state.filterCountUnbounded,
      ...(!this.state.selectedColumnsUsed && { columnCfg: this.generateColumnsCfg(columnsCount) }),
    });
    if (st1) {
      this.setState(st1);
    }
  };

  onClickClearAllFilters = (e) => {
    this.setState({
      filterValues: null,
    });
  };

  nlpOnNeedMore = () => {
    if (this.state.nlpDataIsRefreshing) {
      return;
    }
    if (this.state.nlpNoMore) {
      return;
    }

    this.nlpGetData(true);
  };

  nlpRowOnClickCell = (row, key, e) => {
    let ind1 = this.state.nlpData?.findIndex((r1) => r1 === row);

    let nlpExpanded = [...(this.state.nlpExpanded ?? [])];
    if (!nlpExpanded[ind1]) {
      nlpExpanded[ind1] = true;
    } else {
      nlpExpanded = this.state.nlpExpanded;
    }

    this.setState(
      {
        nlpRowSelIndex: ind1,
        nlpExpanded,
      },
      () => {
        this.refNlpTable?.refreshHeights();
      },
    );
  };

  nlpRowIsSelected = (index) => {
    return index === this.state.nlpRowSelIndex;
  };

  memCalcColors: (data, dataAll, onColorsCalc, calcColor) => { count; label; color; colorHex }[] = memoizeOne((data, dataAll, onColorsCalc, calcColor) => {
    return calcColorsNLP(data, dataAll, null, onColorsCalc, calcColor);
  });

  nlpCalcColor = (index, name) => {
    let colors = this.memCalcColors(null, this.state.nlpData, null, nlpCalcColorToken);
    if (colors != null) {
      let c1 = colors.find((c1) => c1.label === name);
      if (c1 != null) {
        return c1.colorHex;
      }
    }

    return nlpCalcColorToken(index);
  };

  memColumnsNlpList = memoizeOne((nlpRowSelIndex, colors, nlpExpanded) => {
    return [
      {
        title: 'Results',
        field: null,
        render: (text, row, index) => {
          let isExp = !!this.state.nlpExpanded?.[index];

          let rowData = null;
          if (row?.error != null) {
            let s1 = null;
            if (row?.error?.content != null && _.isString(row?.error?.content)) {
              s1 = row?.error?.content + '...';
            }

            rowData = (
              <span
                css={`
                  white-space: normal;
                `}
              >
                <div
                  css={`
                    color: red;
                    opacity: 0.9;
                  `}
                >
                  Error: {row?.error?.message || '-'}
                </div>
                <div
                  css={`
                    color: white;
                    opacity: 0.8;
                    line-height: 1.7;
                    margin-top: 5px;
                  `}
                >
                  {s1}
                </div>
              </span>
            );
          } else {
            rowData = <NLPEntitiesTables maxLen={isExp ? null : 300} data={row} calcColor={this.nlpCalcColor} />;
          }

          return (
            <div
              css={`
                display: flex;
              `}
            >
              <div
                css={`
                  margin-right: 12px;
                `}
              >
                {index + 1}
              </div>
              {rowData}
            </div>
          );
        },
        noAutoTooltip: true,
      },
    ] as ITableExtColumn[];
  });

  memRenderFilters = memoizeOne((filterValues) => {
    if (filterValues?.length > 0) {
      return filterValues
        ?.map((f1, f1ind) => {
          const field1 = this.getFieldFromIndex(f1.fieldIndex - 1);
          if (!field1) {
            return null;
          }

          return (
            <div
              key={'fil_' + f1ind}
              css={`
                display: inline-flex;
                align-items: center;
                margin: 6px;
                padding: 4px 12px 5px 11px;
                border-radius: 11.5px;
                background-color: #38bfa1;
                font-family: Matter;
                font-size: 12px;
                font-weight: 600;
                color: white;
              `}
            >
              <span>
                {Utils.upperFirst(field1.get('name'))}: {f1.value}
              </span>
              <span
                css={`
                  margin-left: 10px;
                  cursor: pointer;
                `}
                onClick={this.onClickSetFilter.bind(this, f1.fieldIndex, null)}
              >
                X
              </span>
            </div>
          );
        })
        ?.filter((v1) => v1 != null);
    }
  });

  docOnNeedMore = () => {
    if (this.state.docDataIsRefreshing) {
      return;
    }
    if (this.state.docNoMore) {
      return;
    }

    this.docGetData(true);
  };

  docRowOnClickCell = (row, key, e) => {
    let ind1 = this.state.docData?.findIndex((r1) => r1 === row);

    let docExpanded = [...(this.state.docExpanded ?? [])];
    if (!docExpanded[ind1]) {
      docExpanded[ind1] = true;
    } else {
      docExpanded = this.state.docExpanded;
    }

    this.setState(
      {
        docRowSelIndex: ind1,
        docExpanded,
      },
      () => {
        this.refDocStoreTable?.refreshHeights();
      },
    );
  };

  docRowIsSelected = (index) => {
    return index === this.state.docRowSelIndex;
  };

  memDatasetVersionParam = memoizeOne((datasetVersion, optionsFgVersion, datasetOne) => {});

  memFGIsUnmater = memoizeOne((featureGroupVersion, optionsFgVersion, featureGroupOne) => {
    if (featureGroupOne?.latestVersionOutdated !== false || ![FeatureGroupVersionLifecycle.COMPLETE].includes(featureGroupOne?.latestFeatureGroupVersion?.status ?? '')) {
      if (optionsFgVersion?.length === 0) {
        return true;
      }
    }
    return false;
  });

  memFGVersionParamUsed = false;
  memFGVersionParam = memoizeOne((featureGroupVersion, optionsFgVersion, featureGroupOne) => {
    if (featureGroupOne?.latestVersionOutdated !== false || ![FeatureGroupVersionLifecycle.COMPLETE].includes(featureGroupOne?.latestFeatureGroupVersion?.status ?? '')) {
      return;
    }

    if (this.memFGVersionParamUsed || !this.props.isFeatureGroup) {
      return;
    }

    if (Utils.isNullOrEmpty(featureGroupVersion) && optionsFgVersion != null && optionsFgVersion.length > 0 && !Utils.isNullOrEmpty(optionsFgVersion[0]?.value)) {
      this.memFGVersionParamUsed = true;
      setTimeout(() => {
        this.memFGVersionParamUsed = false;
      }, 300);

      let projectId = this.calcProjectId();
      let featureGroupId = this.calcFeatureGroupId();
      setTimeout(() => {
        Location.push('/' + PartsLink.features_rawdata + '/' + projectId + '/' + featureGroupId, undefined, 'featureGroupVersion=' + encodeURIComponent(optionsFgVersion?.[0]?.value ?? ''));
      }, 0);
    }
  });

  nlpOnColorsCalc = (colors) => {
    setTimeout(() => {
      this.setState({
        nlpColorsCalc: colors,
      });
    }, 0);
  };

  calcIsNlp = () => {
    if (!this.props.isFeatureGroup) {
      return false;
    }

    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let res = foundProject1?.isNlp === true;

    if (this.props.isFeatureGroup) {
      let featureGroupOne = this.memFeatureGroupsOne(false)(projectId, featureGroupId, this.props.featureGroups);
      if (featureGroupOne?.featureGroupType?.toUpperCase() !== Constants.ANNOTATING) {
        res = false;
      }
      let docStoreDef = calcDocStoreDefFromFeatureGroup(featureGroupOne); // TODO: Don't re-compute docStoreDef here
      if (docStoreDef?.type === DocStoreType.pdf) {
        // Force normal materialized view instead of annotation view for PDFs
        res = false;
      }
    }

    return res;
  };

  calcIsDocStore = () => {
    if (!this.props.isFeatureGroup) {
      return false;
    }

    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    let res = null; //calcDocStoreDefFromProject(foundProject1)!=null;

    if (this.props.isFeatureGroup) {
      let featureGroupOne = this.memFeatureGroupsOne(false)(projectId, featureGroupId, this.props.featureGroups);
      if (calcDocStoreDefFromFeatureGroup(featureGroupOne) != null) {
        res = true;
      }
    }

    return res;
  };

  memSampleGrid: (sampleData, sampleColumns, sampleShowFilters) => { tableCreate: (hh: number) => any; columns: ITableExtColumn[] } = memoizeOne((sampleData, sampleColumns, sampleShowFilters) => {
    const calcDataType = (dt1) => {
      let type1 = 'string';
      switch (dt1?.toUpperCase()) {
        case 'NUMERICAL':
          type1 = 'number';
          break;
        case 'TIMESTAMP':
          type1 = 'datetime';
          break;
      }
      return type1;
    };

    let cc = sampleColumns?.['*'] ?? [];

    let columns = [] as ITableExtColumn[];
    for (let i = 0; i < cc.length ?? 0; i++) {
      let f1 = cc[i];
      columns.push({
        title: f1,
        field: f1,
        align: 'left',
        // dataType: 'String',

        isNested: sampleColumns?.[f1] != null,
        nestedColumns: sampleColumns?.[f1]?.map((sc1) => ({ title: sc1, field: sc1, dataType: 'string' } as ITableExtColumn)),
      });
    }

    let data1 =
      sampleData?.map((d1, d1ind) => {
        let o1: any = {};
        columns?.some((c1, c1ind) => {
          let dataNested = d1?.[c1ind];

          if (_.isArray(dataNested) && sampleColumns?.[c1.field as string] != null) {
            let dataR = dataNested.map((dn1, dn1ind) => {
              let r1: any = {};
              let kk = sampleColumns?.[c1.field as string];
              kk.some((k1) => {
                r1[k1] = dn1?.[k1];
              });
              return r1;
            });
            dataNested = dataR;
          }

          o1[c1.field as string] = dataNested;
        });
        return o1;
      }) ?? [];

    const onClickCell = (row, key, e) => {
      if (row != null) {
        let ind1 = _.findIndex(data1 ?? [], row);
        this.setState({
          selectedRowIndex: ind1 === -1 ? null : ind1,
        });
      } else {
        this.setState({
          selectedRowIndex: null,
        });
      }
    };

    return {
      tableCreate: (hh) => <TableExt devExpFilters={this.state.sampleShowFilters} useDevExp devExpNoDataText={this.state.sampleDataIsRefreshing} columns={columns} height={hh} dataSource={data1} onClickCell={onClickCell} />,
      columns,
    };
  });

  memColsDocStore = memoizeOne((docStoreDef: IDocStoreDef, width, isGrid, cols) => {
    let annotationsEditBaseLink = null;
    if (docStoreDef?.annotationSupport) {
      let projectId = this.calcProjectId();
      let featureGroupId = this.calcFeatureGroupId();
      annotationsEditBaseLink = '/' + PartsLink.annotations_edit + '/' + (projectId ?? '-') + '/' + featureGroupId;
    }
    return docStoreDef?.rawDataColumns?.(width, isGrid, cols, annotationsEditBaseLink);
  });

  memDocDataForWidth = memoizeOne((colsCount, docDataOri) => {
    let docData = docDataOri;

    if (colsCount > 1) {
      docData = [];

      let ind = 0,
        row = [];
      docDataOri?.some((d1, d1ind) => {
        row.push(d1);
        ind++;

        if (ind >= colsCount) {
          docData.push(row);
          ind = 0;
          row = [];
        }
      });
      if (ind < colsCount && row.length > 0) {
        docData.push(row);
      }
    }

    return docData;
  });

  memDocStoreRawDataRender = memoizeOne((docStoreDef: IDocStoreDef, width, height, docDataOri, docNoMore, docStoreIsGrid, cols) => {
    if (docStoreDef == null) {
      return null;
    }

    let colsCount = !docStoreIsGrid ? 1 : width == null ? 1 : Math.trunc(width / DocStoreImageSizePxWW);
    let docData = this.memDocDataForWidth(colsCount, docDataOri);

    let colsDocStore = this.memColsDocStore(docStoreDef, width, colsCount > 1, cols);

    return (
      <div css={``}>
        <div
          css={`
            position: absolute;
            top: ${docStoreDef?.rawDataSupportGrid === true ? docStoreGridOptionsElemHH : 0}px;
            left: 0;
            right: 5px;
            bottom: 0;
          `}
        >
          <TableExt
            noHover
            ref={(r1) => {
              this.refDocStoreTable = r1;
            }}
            width={width}
            disableSort
            remoteRowCount={(docData?.length ?? 0) + (docNoMore ? 0 : 1)}
            onNeedMore={this.docOnNeedMore}
            onClickCell={/*this.docRowOnClickCell*/ null}
            calcIsSelected={/*this.docRowIsSelected*/ null}
            autoHeight
            height={height}
            isVirtual
            columns={colsDocStore}
            dataSource={docData}
          />
        </div>
      </div>
    );
  });

  onChangeSelectedColumns = (columnsList, isNonIgnored, findText, prioritizeFeatureMappedColumns) => {
    let cols1 = columnsList?.map((aa) => {
      return Immutable.fromJS({ name: aa, featureType: null });
    });

    let columnsCount = 0;
    if (this.state.filterCount != null && (this.state.filterValues?.length > 0 || this.state.isUseFilterSql) && this.state.filterSqlColumns != null) {
      columnsCount = this.state.filterSqlColumns?.length ?? 0;
    } else {
      const sizeRes = this.memRowsColumnsCount(
        this.props.defDatasets,
        this.props.projects,
        this.calcProjectId(),
        this.calcDatasetId(),
        this.calcBatchPredId(),
        this.calcModelVersion(),
        this.calcFeatureGroupId(),
        this.calcFeatureGroupVersion(),
        this.calcDatasetVersion(),
      );
      if (sizeRes != null) {
        columnsCount = sizeRes?.columnsCount ?? 0;
      }
    }

    let st1 = Utils.stateMergeIfNotEqual(this.state, {
      selectedColumnsText: findText ?? null,
      selectedColumns: cols1,
      selectedColumnsUsed: null,
      selectedColumnsNonIgnored: isNonIgnored,
      prioritizeFeatureMappedColumns: prioritizeFeatureMappedColumns,
      columnCfg: this.generateColumnsCfg(columnsCount),
    });
    if (st1) {
      this.setState(st1);
    }
  };

  onChangeDocIdFilter = (findText, docIdColumn) => {
    let filteredData = this.state.docData?.filter((d1) => {
      let v1 = d1?.[docIdColumn];
      if (v1 == null) {
        return false;
      }
      if (typeof v1 === 'number') {
        v1 = v1.toString();
      }
      if (typeof v1 !== 'string') {
        return false;
      }
      return v1?.includes(findText);
    });

    this.setState({
      docIdFilter: findText,
      docIdFilteredData: filteredData,
    });
  };

  memColumnsListFilter = memoizeOne((columnsCount, filterSqlColumns, dataset1) => {
    let res = [];
    for (let i = 0; i < columnsCount; i++) {
      let field1 = this.getFieldFromIndex(i, true);
      if (field1) {
        if (field1) {
          let fieldName = field1.get('col_name') || field1.get('name');
          res.push(fieldName);
        }
      }
    }

    if (res.length === 0) {
      res = null;
    }
    return res;
  });

  onClickViewValues = (columnIndex, chartData, e) => {
    let values = chartData?.data?.map((d1) => ({ value: d1?.x, perc: d1?.y }))?.filter((v1) => v1?.value != null);
    if (values != null && values.length > 0) {
      if (this.confirmValues != null) {
        this.confirmValues.destroy();
        this.confirmValues = null;
      }

      let columns = [
        {
          title: 'Value',
          field: 'value',
          sortField: 'valueRaw',
        },
      ] as ITableExtColumn[];

      let dataList = (values ?? []).map((d1) => {
        return {
          value: (
            <span>
              <span>{Utils.truncStr(d1?.value, 120)}</span>:{' '}
              <span
                css={`
                  opacity: 0.8;
                `}
              >
                {Utils.decimals(d1?.perc * 100, 2)}%
              </span>
            </span>
          ),
          textSearch: Utils.truncStr(d1?.value, 120) ?? '',
          valueRaw: d1?.value,
        };
      });

      let dataListJson = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(values ?? [], undefined, 2));
      let dataListCsv = 'data:text/plain;charset=utf-8,' + encodeURIComponent((values ?? []).map((d1) => `${d1?.value}, ${d1?.perc}`).join('\n'));

      let titleS = '' + (values?.length ?? 0);
      if ((values?.length ?? 0) >= 100) {
        titleS = 'Top 100 by count';
      }

      const onClickCell = (row, key, e) => {
        let v1 = row?.valueRaw;
        if (v1 != null) {
          if (this.confirmValues != null) {
            this.confirmValues.destroy();
            this.confirmValues = null;
          }

          this.onClickSetFilter(columnIndex, v1, e);
        }
      };

      this.confirmValues = confirm({
        title: 'Values (' + titleS + ')',
        okText: 'Ok',
        okType: 'primary',
        cancelText: 'Cancel',
        cancelButtonProps: { style: { display: 'none' } },
        maskClosable: true,
        width: 1000,
        centered: true,
        content: (
          <div css={``} className={'useDark'}>
            <div
              css={`
                border: 2px solid rgba(0, 0, 0, 0.3);
                padding-right: 4px;
                position: relative;
              `}
            >
              <TableExt onClickCell={onClickCell} separator1 autoFilter={['textSearch']} noAutoTooltip height={500} columns={columns} dataSource={dataList} isVirtual isDetailTheme={false} whiteText />
            </div>
            <div
              css={`
                margin: 25px 0;
                text-align: center;
              `}
            >
              <a
                css={`
                  margin-bottom: 10px;
                `}
                href={dataListCsv}
                download={'ids.csv'}
              >
                <Button type={'default'}>Download CSV</Button>
              </a>
              <a
                css={`
                  margin-left: 15px;
                  margin-bottom: 10px;
                `}
                href={dataListJson}
                download={'ids.json'}
              >
                <Button type={'default'}>Download JSON</Button>
              </a>
            </div>
          </div>
        ),
        onOk: () => {
          //
        },
        onCancel: () => {
          //
        },
      });
    }
  };

  doDownloadRawData = (e) => {
    let filters = this.memFilterCalc(this.state.filterValues);
    let sql = this.state.filterSql;
    let orderByColumn = this.state.orderByColumn;
    let isAscending = this.state.isAscending;

    let selectedColumns = this.state.selectedColumns?.map((c1: any) => c1?.toJS()?.name);
    let selectedColumnsNonIgnored = this.state.selectedColumnsNonIgnored === true;

    let featureGroupVersion = this.calcFeatureGroupVersion();
    let args: any = {
      featureGroupId: this.calcFeatureGroupId(),
      projectId: this.calcProjectId(),
      featureGroupVersion: featureGroupVersion,

      orderByColumn: orderByColumn,
      isAscending: isAscending,

      sql: sql,
      columnFilters: filters,
      selectedColumns: selectedColumns,
      excludeIgnoredColumns: selectedColumnsNonIgnored,
    };
    let argsString = Utils.processParamsAsQuery(args);

    if (Utils.isNullOrEmpty(featureGroupVersion)) {
      window.open('/api/v0/_downloadSmallFeatureGroupCSV?' + argsString, '_blank');
    } else {
      window.open('/api/v0/_downloadSmallFeatureGroupVersionCSV?' + argsString, '_blank');
    }
  };

  memCDS = memoizeOneCurry((doCall, customdsParam) => {
    return customds.memThisDataserver(doCall);
  });

  onChangeDetailTypeIsList = (e) => {
    this.valuesNano = null;

    this.setState({
      detailTypeIsList: e.target.value,
    });
  };

  onClickClearPrompt = (e) => {
    this.setState({
      promptBounce: '',
    });
  };

  onClickClearSQL = (e) => {
    let sql1 = '';
    this.setState({
      filterSqlBounce: sql1,
    });
  };

  onClickFilterTextClearDoc = (e) => {
    this.setState({
      docSqlFilter: null,
      docSqlFilterUsed: null,
    });
    this.onClickFilterTextDoc(e);
  };

  onClickFilterTextDoc = (e) => {
    const s1 = this.state.docSqlFilter || null;
    this.setState(
      {
        docSqlFilterUsed: s1,
      },
      () => {
        this.docGetData();
      },
    );
  };

  onKeyDownFilterTextDoc = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.onClickFilterTextDoc(e);
    }
  };

  memColIMAGEType = memoizeOne((featureGroupOne, filterMapping) => {
    if (featureGroupOne == null) {
      return null;
    } else {
      let res = calcSchemaForFeature(featureGroupOne);

      if (res != null && filterMapping != null) {
        let list = filterMapping?.map((s1) => s1?.toUpperCase());
        res = res?.filter((r1) => list?.includes(r1?.featureType?.toUpperCase()));
      } else {
        res = null;
      }

      return res?.[0]?.name;
    }
  });

  memColIMAGE = memoizeOne((featureGroupOne, filterMapping) => {
    if (featureGroupOne == null) {
      return null;
    } else {
      let res = calcSchemaForFeature(featureGroupOne);

      if (res != null && filterMapping != null) {
        let list = filterMapping?.map((s1) => s1?.toUpperCase());
        res = res?.filter((r1) => list?.includes(r1?.featureMapping?.toUpperCase()));
      } else {
        res = null;
      }

      return res?.[0]?.name;
    }
  });

  memColsRenderDocStore = memoizeOne((colIMAGE, colLABEL) => {
    return [colIMAGE, colLABEL].filter((s1) => s1 != null);
  });

  memColLABEL = memoizeOne((featureGroupOne, filterMapping) => {
    if (featureGroupOne == null) {
      return null;
    } else {
      let res = calcSchemaForFeature(featureGroupOne);

      if (res != null && filterMapping != null) {
        let list = filterMapping?.map((s1) => s1?.toUpperCase());
        res = res?.filter((r1) => list?.includes(r1?.featureMapping?.toUpperCase()));
      } else {
        res = null;
      }

      return res?.[0]?.name;
    }
  });

  onClickCreateNewVersion = () => {
    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();

    this.setState({
      materializeIsRefreshing: true,
    });
    REClient_.client_().createFeatureGroupSnapshot(projectId, featureGroupId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        if (projectId) {
          StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        }

        StoreActions.featureGroupsDescribe_(null, featureGroupId);
        StoreActions.featureGroupsVersionsList_(featureGroupId, (list) => {
          let featureGroupVersion = this.calcFeatureGroupVersion();
          Location.push(`/${PartsLink.features_rawdata}/${projectId ?? '-'}/${featureGroupId}`, undefined, 'featureGroupVersion=' + encodeURIComponent(list?.[0]?.featureGroupVersion || featureGroupVersion));
        });
      }
    });
  };

  onClickCreateNewVersionOnClick = () => {
    return true;
  };

  render() {
    let { datasets, projects, defDatasets } = this.props;
    let isRefreshing = false;
    if (datasets) {
      isRefreshing = datasets.get('isRefreshing');
    }

    let { paramsProp } = this.props;
    let popupContainerForMenu = (node) => document.getElementById('body2');

    let datasetId = this.calcDatasetId();
    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();
    let batchPredId = this.calcBatchPredId();
    let modelVersion = this.calcModelVersion();
    let featureGroupVersion = this.calcFeatureGroupVersion();
    let datasetVersion = this.calcDatasetVersion();

    if (!datasetId && !featureGroupId) {
      return <div></div>;
    }
    let projectIsNone = this.calcProjectIsNone();
    if (this.props.isFeatureGroup) {
      if (!projectId && !projectIsNone) {
        return <div></div>;
      }
    } else {
      if (!projectId && !datasetId) {
        return <div></div>;
      }
    }

    let docStoreDef: IDocStoreDef = null;

    let featureGroupOne, featureGroupList;
    if (this.props.isFeatureGroup) {
      featureGroupList = this.memFeatureGroups(false)(projectId, this.props.featureGroups);
      featureGroupOne = this.memFeatureGroupsOne(false)(projectId, featureGroupId, this.props.featureGroups);
      datasetId = featureGroupOne?.datasetId;

      docStoreDef = calcDocStoreDefFromFeatureGroup(featureGroupOne);
    }

    let datasetOne = this.memDatasetOne(false)(datasets, datasetId);
    if (this.props.isFeatureGroup) {
      if (featureGroupOne == null || _.isEmpty(featureGroupOne)) {
        return <div></div>;
      }
    } else {
      if (datasetOne == null || _.isEmpty(datasetOne)) {
        return <div></div>;
      }
    }
    let datasetVersionOne = this.memDatasetVersionOne(false)(this.props.datasets, datasetId, datasetVersion);

    let datasetError = null;
    let datasetLifecycle = datasetOne?.get('status');
    if (!Utils.isNullOrEmpty(datasetVersion)) {
      datasetLifecycle = datasetVersionOne?.status;
    }
    if (this.props.isFeatureGroup /*&& featureGroupOne?.datasetId==null*/) {
      //
    } else {
      if ([DatasetLifecycle.COMPLETE].includes(datasetLifecycle)) {
        //
      } else if ([DatasetLifecycle.CANCELLED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED, DatasetLifecycle.FAILED].includes(datasetLifecycle)) {
        datasetError = <RefreshAndProgress errorMsg={'Dataset ' + DatasetLifecycleDesc[datasetLifecycle]}></RefreshAndProgress>;
      } else {
        if ([DatasetLifecycle.INSPECTING, DatasetLifecycle.IMPORTING, DatasetLifecycle.UPLOADING, DatasetLifecycle.CONVERTING].includes(datasetLifecycle)) {
          StoreActions.refreshDoDatasetAll_(datasetId, projectId);
        }

        datasetError = <RefreshAndProgress isMsgAnimRefresh={true} msgMsg={'Dataset is processing'}></RefreshAndProgress>;
      }
    }

    //
    let foundProject1 = this.memProjectId(false)(projectId, projects);
    if (foundProject1 == null && !projectIsNone) {
      return <div></div>;
    }
    const isNlp = this.calcIsNlp();
    const useSampleData = featureGroupOne?.enableSampleData === true;

    let datasetSchema1 = null;
    if (foundProject1 || projectIsNone) {
      if (this.props.isFeatureGroup) {
        datasetSchema1 = this.memFeatureGroupSchema(false)(this.props.defDatasets, projectId, this.calcFeatureGroupId(), featureGroupVersion);
      } else {
        datasetSchema1 = this.memDatasetSchema(false)(this.props.defDatasets, datasetId, datasetVersion);
      }
    }

    //
    let rowsCount = 0,
      rowCountForTable = 0;
    let columnsCount = 0,
      columnsCountOri = 0;
    if (datasetSchema1) {
      const sizeRes = this.memRowsColumnsCount(defDatasets, projects, projectId, datasetId, batchPredId, modelVersion, featureGroupId, featureGroupVersion, datasetVersion);
      if (sizeRes != null) {
        columnsCount = sizeRes?.columnsCount ?? 0;
        columnsCountOri = columnsCount;
        rowsCount = sizeRes?.rowsCount ?? 0;
        rowCountForTable = sizeRes?.rowCountForTable ?? 0;
      }
    }
    if (datasetVersionOne != null) {
      if (datasetVersionOne?.rowCount != null) {
        rowsCount = datasetVersionOne?.rowCount;
        rowCountForTable = rowsCount + 1;
      }
    }

    let showTopNum = null;
    if (this.state.filterCount != null && (this.state.filterValues?.length > 0 || this.state.isUseFilterSql)) {
      if (this.state.filterSqlColumns != null) {
        columnsCount = this.state.filterSqlColumns?.length ?? 0;
        columnsCountOri = columnsCount;
      }
      rowsCount = (this.state.filterCountUnbounded ?? this.state.filterCount) + 1;
      rowCountForTable = this.state.filterCount + 1;

      if (this.state.filterCountUnbounded != null && this.state.filterCount != null) {
        if (this.state.filterCountUnbounded > this.state.filterCount) {
          showTopNum = Utils.prettyPrintNumber(this.state.filterCount);
        }
      }
    }

    if (this.state.selectedColumnsUsed != null) {
      columnsCount = this.state.selectedColumnsUsed?.length ?? 0;
    }

    this.memCacheSize(
      featureGroupId,
      datasetId,
      rowCountForTable,
      columnsCount,
      this.state.filterValues,
      this.state.filterSql,
      this.state.filterSqlColumns,
      featureGroupVersion,
      datasetVersion,
      this.state.orderByColumn,
      this.state.isAscending,
      this.state.selectedColumns,
      this.state.selectedColumnsNonIgnored,
      this.state.prioritizeFeatureMappedColumns,
    );

    const borderAAA = Constants.lineColor();
    const STYLE = {
      backgroundColor: Constants.navBackDarkColor(),
      outline: 'none',
      overflow: 'hidden',
      fontSize: '14px',
      fontFamily: 'Matter',
    };
    const STYLE_BOTTOM_LEFT_GRID = {};
    const STYLE_TOP_LEFT_GRID = {
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: Constants.backBlueDark(),
    };
    const STYLE_TOP_RIGHT_GRID = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: Constants.backBlueDark(),
    };
    const STYLE_BOTTOM_RIGHT_GRID = {
      outline: 'none',
    };

    const STYLE_DETAIL_HEADER = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: Constants.backBlueDark(),
      height: cellHH + 'px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as CSSProperties;

    let colChartsWW = 400;
    let chartsList = null;
    if ((!this.props.isFeatureGroup || (this.props.isFeatureGroup && featureGroupOne?.explorerCharts === true)) && !batchPredId) {
      if (datasetId) {
        chartsList = this.memCharts(false)(this.state.chartsUuid, defDatasets, datasetId, projectId);
      } else {
        chartsList = this.memChartsFG(false)(this.state.chartsUuid, this.props.featureGroups, projectId, featureGroupVersion);
      }
    }

    let showCharts = true;
    let datasetFound = null;
    if (this.state.lastDataErrorMsg != null) {
      showCharts = false;
      colChartsWW = 0;
    }
    if (!this.state.isChartsExpanded) {
      colChartsWW = 48;
    }

    if (this.props.isFeatureGroup) {
      if (chartsList != null && _.isArray(chartsList) && chartsList.length > 0) {
        //
      } else {
        showCharts = false;
        colChartsWW = 0;
      }
      datasetFound = calcDatasetById(undefined, datasetId);
    } else {
      if (paramsProp && paramsProp.get('datasetId')) {
        datasetFound = calcDatasetById(undefined, datasetId);
        if (datasetFound && calcDataset_datasetType(datasetFound, projectId) !== 'TIMESERIES' && calcDataset_datasetType(datasetFound, projectId) !== 'SALES_HISTORY') {
          //@TODO(austin) add better resolver for timeseries datasets
          if (chartsList != null && _.isArray(chartsList) && chartsList.length > 0) {
            //
          } else {
            showCharts = false;
            colChartsWW = 0;
          }
        }
      }
    }

    let datasetSelectValue = null;
    let optionsDatasets = [];
    if (this.props.isFeatureGroup) {
      optionsDatasets = this.memFeatureGroupsOptions(featureGroupList);
      if (optionsDatasets && featureGroupId) {
        datasetSelectValue = optionsDatasets.find((p1) => p1.value === featureGroupId);
      }
      if (projectIsNone) {
        datasetSelectValue = { label: featureGroupOne?.name, value: null };
      }
    } else {
      if (datasets) {
        let listDatasetsProj = this.memProjectDatasets(false)(this.props.projectDatasets, projectId);
        let listDatasets = this.memDatasetsList(false)(this.props.datasets, listDatasetsProj);
        optionsDatasets = this.memDatasetsOptions(listDatasets);
        if (optionsDatasets && datasetFound) {
          datasetSelectValue = optionsDatasets.find((p1) => p1.value === datasetFound.getIn(['dataset', 'datasetId']));
        }
        if (projectIsNone) {
          datasetSelectValue = { label: datasetOne?.getIn(['dataset', 'name']) ?? datasetOne?.get('name'), value: null };
        }
      }
    }

    //
    let showSqlFilter = !Utils.isNullOrEmpty(featureGroupVersion) && !isNlp;
    if (docStoreDef?.allowRawDataSqlFilters === false) {
      showSqlFilter = false;
    }
    if (!this.props.isFeatureGroup) {
      showSqlFilter = true;
    }
    if (useSampleData) {
      showSqlFilter = false;
    }
    if (datasetError != null) {
      showSqlFilter = false;
    }

    let showFilters = Constants.flags.raw_data_filters;
    if (docStoreDef?.allowRawDataFilters === false) {
      showFilters = false;
    }
    if (this.props.isFeatureGroup) {
    } else {
      if (showFilters && !datasetFound?.get('shouldEnableSearch')) {
        showFilters = false;
      }
    }
    if (this.state.isUseFilterSql || this.state.isUseFilterSqlPrompt) {
      showFilters = false;
    }
    if (isNlp) {
      showFilters = false;
    }
    if (useSampleData) {
      showFilters = false;
    }
    if (datasetError != null) {
      showFilters = false;
    }

    //
    let snapshotRefreshing = false;
    let snapshotRefreshingError = null;

    let showNeedSnapshotMsgOnClick = null;
    let showNeedSnapshotMsgTitle = null;
    let showNeedSnapshotMsg = null;
    let showNeedSnapshot = false;
    let fgVersionSelectValue = null;
    let optionsFgVersion = [];
    let fgVersionsList = [];
    let isUnmaterFG = null;
    let onClickMaterFG = null;
    if (!this.props.isFeatureGroup) {
      fgVersionsList = this.memDatasetVersions(false)(this.props.datasets, datasetId);
      optionsFgVersion = this.memDatasetVersionsOptions(fgVersionsList, datasetOne);
      if (Utils.isNullOrEmpty(datasetVersion)) {
        this.memDatasetVersionParam(datasetVersion, optionsFgVersion, datasetOne);
      }
      if (datasetVersion) {
        fgVersionSelectValue = optionsFgVersion?.find((d1) => d1?.value == datasetVersion);
      } else {
        fgVersionSelectValue = optionsFgVersion?.[0];
      }
    } else {
      fgVersionsList = this.memFGVersions(false)(this.props.featureGroups, featureGroupId);
      optionsFgVersion = this.memFGVersionsOptions(fgVersionsList, featureGroupOne);
      if (Utils.isNullOrEmpty(featureGroupVersion)) {
        this.memFGVersionParam(featureGroupVersion, optionsFgVersion, featureGroupOne);
        //TODO isUnmaterFG = this.memFGIsUnmater(featureGroupVersion, optionsFgVersion, featureGroupOne);
        if (isUnmaterFG) {
          onClickMaterFG = (e) => {
            if (this.onClickMaterFGUsed) {
              return;
            }

            this.onClickMaterFGUsed = true;

            let projectId = this.calcProjectId();
            let featureGroupId = this.calcFeatureGroupId();

            REClient_.client_().createFeatureGroupSnapshot(projectId, featureGroupId, (err, res) => {
              if (err || !res?.success) {
                this.onClickMaterFGUsed = null;
                REActions.addNotificationError(err || Constants.errorDefault);
              } else {
                setTimeout(() => {
                  this.onClickMaterFGUsed = null;
                }, 2000);

                if (projectId) {
                  StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
                }
                StoreActions.featureGroupsDescribe_(null, featureGroupId);
                StoreActions.featureGroupsVersionsList_(featureGroupId);
              }
            });
          };
        }
      }
      fgVersionSelectValue = optionsFgVersion?.find((d1) => d1?.value == featureGroupVersion);

      //
      let isPythonFG = featureGroupOne?.featureGroupSourceType?.toUpperCase() === 'PYTHON';
      if (isPythonFG && fgVersionSelectValue == null && fgVersionsList?.length === 0) {
        showFilters = false;
        showNeedSnapshot = true;
        showNeedSnapshotMsgTitle = 'To see raw data';
        showNeedSnapshotMsg = 'Materialize Latest Version';
        showNeedSnapshotMsgOnClick = () => {
          REClient_.client_().createFeatureGroupSnapshot(projectId, featureGroupId, (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              this.memFGVersionParamUsed = false;

              StoreActions.featureGroupsVersionsList_(featureGroupId);
              Location.push('/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + featureGroupId);
            }
          });
        };
      } else if (fgVersionSelectValue?.data?.status != null || (isPythonFG && fgVersionSelectValue == null)) {
        if (fgVersionSelectValue?.data?.status?.toUpperCase() !== FeatureGroupVersionLifecycle.COMPLETE.toUpperCase()) {
          showSqlFilter = false;

          StoreActions.refreshDoFGVersionsAll_(projectId, featureGroupId, featureGroupVersion);

          showFilters = false;
          snapshotRefreshing = true;
          if ([FeatureGroupVersionLifecycle.FAILED, FeatureGroupVersionLifecycle.CANCELLED].includes(fgVersionSelectValue?.data?.status?.toUpperCase() ?? '-')) {
            snapshotRefreshingError = Utils.upperFirst(fgVersionSelectValue?.data?.status ?? '');
          } else {
            snapshotRefreshingError = 'Processing...';
          }

          let lastV1 = null;
          if (optionsFgVersion != null && optionsFgVersion.length > 0 && this.props.isFeatureGroup) {
            let ind1 = optionsFgVersion?.findIndex((v1) => [FeatureGroupVersionLifecycle.COMPLETE].includes(v1.data?.status ?? '-'));
            if (ind1 > -1) {
              lastV1 = optionsFgVersion?.[ind1]?.data?.featureGroupVersion;
            }
          }
          if (!Utils.isNullOrEmpty(lastV1)) {
            showNeedSnapshot = true;
            showNeedSnapshotMsgTitle = snapshotRefreshingError;
            snapshotRefreshing = false;
            snapshotRefreshingError = null;
            showNeedSnapshotMsg = 'View Last Working Version';
            showNeedSnapshotMsgOnClick = () => {
              let mode = paramsProp?.get('mode');
              if (!Utils.isNullOrEmpty(mode)) {
                let p1 = this.calcProjectId();
                if (p1) {
                  p1 = '/' + p1;
                } else {
                  p1 = '';
                }

                let featureGroupVersion = 'featureGroupVersion=' + encodeURIComponent(lastV1);

                if (this.props.isFeatureGroup) {
                  Location.push('/' + mode + (p1 || '/-') + '/' + paramsProp?.get('featureGroupId'), undefined, featureGroupVersion);
                } else {
                  Location.push('/' + mode + '/' + paramsProp?.get('datasetId') + p1, undefined, featureGroupVersion);
                }
              }
            };
          }
        }
      }
    }

    const isDocStoreRender = showRawDocumentsView && docStoreDef?.rawDataColumns != null;
    let docStoreGridOptionsElem =
      isDocStoreRender && docStoreDef?.rawDataSupportGrid === true ? (
        <div
          css={`
            height: ${docStoreGridOptionsElemHH}px;
            display: flex;
            align-items: center;
          `}
        >
          <Radio.Group
            value={!!this.state.docStoreIsGrid}
            onChange={(e) => {
              this.setState(
                {
                  docStoreIsGrid: e.target.value,
                },
                () => {
                  setTimeout(() => {
                    this.refDocStoreTable?.scrollToPosition?.(0);
                  }, 0);
                },
              );
            }}
          >
            <Radio value={false}>
              <span
                css={`
                  color: white;
                `}
              >
                List
              </span>
            </Radio>
            <Radio value={true}>
              <span
                css={`
                  color: white;
                `}
              >
                Grid
              </span>
            </Radio>
          </Radio.Group>
        </div>
      ) : null;

    let colIMAGE = this.memColIMAGE(featureGroupOne, docStoreDef?.renderFeatureMapping);
    let colIMAGEType = this.memColIMAGEType(featureGroupOne, docStoreDef?.renderFeatureType);
    let colLABEL = this.memColLABEL(featureGroupOne, docStoreDef?.renderFeatureMapping2);
    let colsRenderDocStore = this.memColsRenderDocStore(colIMAGE ?? colIMAGEType, colLABEL);

    let showDetail1 = this.state.showDetail;
    let canShowGridOne = datasetError == null && isUnmaterFG !== true && !showNeedSnapshot && !isDocStoreRender && !isNlp && !useSampleData;
    if (!canShowGridOne) {
      showDetail1 = false;
    }

    let detailWW = 400;
    if (!showDetail1) {
      detailWW = 0;
    }

    let { tableCreate: sampleGrid, columns: sampleColumnsUsed } = (!showNeedSnapshot && !isNlp && useSampleData ? this.memSampleGrid(this.state.sampleData, this.state.sampleColumns, this.state.sampleShowFilters) : null) ?? {};

    let valueJsonStringDetail = !showDetail1 ? null : this.memJsonString(this.state.selRowId, this.state.selectedRowIndex, columnsCount, useSampleData ? this.state.sampleData : null, sampleColumnsUsed);
    let renderSelRow = !showDetail1
      ? null
      : this.memRenderSelRow(this.state.selRowId, this.state.selectedRowIndex, 0, columnsCount, this.state.hoveredColumnIndex, this.state.showDetailAllCols, useSampleData ? this.state.sampleData : null, sampleColumnsUsed);
    if (renderSelRow == null && showDetail1) {
      renderSelRow = (
        <div
          css={`
            padding-bottom: 30px;
            flex-flow: column;
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          `}
        >
          <img
            src={calcImgSrc('/imgs/clickCircle.png')}
            alt={''}
            css={`
              width: 150px;
            `}
          />
          <div
            css={`
              font-family: Matter;
              font-size: 24px;
              line-height: 1.33;
              color: #ffffff;
              margin-top: 19px;
            `}
          >
            Select Detailed Row
          </div>
        </div>
      );
    }

    //CDS
    let CDSOne = this.memCDS(false)(this.props.customds);
    // eslint-disable-next-line no-self-compare
    let isCdsActive = [CustomDSLifecycle.ACTIVE].includes(CDSOne?.status);
    let CDSMsgHH = 60;

    /**
     * isAboveDataLimitingThreshold  isCDSAvailable   isCDSActive  Action
     * No (small)                    True/False                    Show SQL, hide CDS button
     * Yes(large)                    False                         Hide SQL, hide CDS button
     * Yes(large)                    True             False        Hide SQL, show CDS button + warning to user that "Table too large. Please start CDS for SQL transforms..."
     * Yes(large)                    True             True         Show SQL, CDS state as active
     */

    let showCDSMsgText = null;
    let cdsCheckOne = this.props.isFeatureGroup ? featureGroupOne : datasetOne?.toJS?.();
    let isPythonFG = featureGroupOne?.featureGroupSourceType?.toUpperCase() === 'PYTHON';
    let showCustomDS = !isNlp;
    let hideSqlCDS = false;
    if (showCustomDS === true && cdsCheckOne?.isAboveDataLimitingThreshold === true) {
      if (!isCdsActive) {
        hideSqlCDS = true;
        // showCDSMsgText = 'Table too large. Please start CDS for before performing any SQL transforms';
        showCDSMsgText = Constants.flags.cds_too_large;
      }
    } else if (showCustomDS === true && cdsCheckOne?.isAboveDataLimitingThreshold === false) {
      showCustomDS = false;
    } else if (showCustomDS === false && cdsCheckOne?.isAboveDataLimitingThreshold === true) {
      hideSqlCDS = true;
    }

    if (isUnmaterFG === true) {
      showSqlFilter = false;
      showFilters = false;
    }

    let disableFilters = false;
    if (hideSqlCDS) {
      if (showFilters) {
        disableFilters = true;
      }
      showSqlFilter = false;
      showFilters = false;
    }

    // let showMsgLimitCDS = showCustomDS===true && cdsCheckOne?.isAboveDataLimitingThreshold===true;

    // if(isCdsActive===false) {
    // } else if(showMsgLimitCDS) {
    //   showCDSMsgText = 'Row limits will be enforced on SQL queries. Results may not be accurate';
    // }
    let showCDSMsg = showCDSMsgText != null;

    //
    let topFiltersHHextraUsed = 0;
    let topFiltersHH = showFilters ? 92 : 0;
    let topFiltersHHextras = 0;
    if (this.state.isUseFilterSql || this.state.isUseFilterSqlPrompt) {
      topFiltersHH += 230;
      topFiltersHHextraUsed += 84;
    }
    if (showCDSMsg) {
      topFiltersHH += CDSMsgHH;
      topFiltersHHextras += CDSMsgHH;
    }
    let showFiltersColumns = true; //!Utils.isNullOrEmpty(featureGroupVersion);
    if (docStoreDef?.allowRawDataFiltersColumns === false) {
      showFiltersColumns = false;
    }
    if (isUnmaterFG === true) {
      showFiltersColumns = false;
    }
    if (useSampleData) {
      showFiltersColumns = false;
    }
    let topFiltersHHColumns = showFiltersColumns ? 60 : 0;
    if (!this.state.isUseFilterSql && !this.state.isUseFilterSqlPrompt && (showFiltersColumns || showCustomDS)) {
      //
    } else {
      topFiltersHH += topFiltersHHColumns;
      topFiltersHHextras += topFiltersHHColumns;
      if (showCustomDS) {
        topFiltersHH += CustomDataserverHeight;
        topFiltersHHextras += CustomDataserverHeight;
      }
    }

    let renderFilters = this.memRenderFilters(this.state.filterValues);

    //
    let dataset1 = null;
    if (foundProject1 || projectIsNone) {
      if (this.props.isFeatureGroup) {
        dataset1 = this.memFeatureGroupSchema(false)(this.props.defDatasets, this.calcProjectId(), this.calcFeatureGroupId(), this.calcFeatureGroupVersion());
      } else {
        dataset1 = this.memDatasetSchema(false)(this.props.defDatasets, this.calcDatasetId(), this.calcDatasetVersion());
      }
    }
    let columnsListFilter = this.memColumnsListFilter(columnsCountOri, this.state.filterSqlColumns, dataset1);

    let colorsNlp = this.memCalcColors(null, this.state.nlpData, null, nlpCalcColorToken);
    let nlpColumnsList = this.memColumnsNlpList(this.state.nlpRowSelIndex, colorsNlp, this.state.nlpExpanded);

    let showRowsCount = true;
    if (isNlp && this.state.nlpCount != null) {
      rowsCount = this.state.nlpCount + 1;
    } else if (this.props.isFeatureGroup && !this.state.isUseFilterSql) {
      if (rowsCount == null) {
        showRowsCount = false;
      }
    }

    let showVisualData = false; //!!Constants.flags.visual_data_grid && !isNlp && !useSampleData;
    let topVisualRawData = showVisualData || showSqlFilter ? 30 : 0;

    let showPrompt = showSqlFilter && !Constants.flags.hide_prompt && !Constants.disableAiFunctionalities && this.props.isFeatureGroup;
    if (docStoreDef?.allowRawDataPrompts === false) {
      showPrompt = false;
    }
    let topPrompt = showPrompt ? 30 : 0;

    if (this.state.sampleDataIsRefreshing) {
      snapshotRefreshing = true;
    }

    let spaceTopFilterAndCustomDS = 0;
    if (!this.state.isUseFilterSql && !this.state.isUseFilterSqlPrompt) {
      if (showFiltersColumns) {
        spaceTopFilterAndCustomDS += 70;
      }
      if (showCustomDS) {
        spaceTopFilterAndCustomDS += CustomDataserverHeight;
      }
      spaceTopFilterAndCustomDS += CDSMsgHH;
    }

    let allowDownloadAllDisplayedData = false;
    if (this.props.isFeatureGroup) {
      if (cdsCheckOne?.isAboveDataLimitingThreshold !== true) {
        allowDownloadAllDisplayedData = true;
      }
    }

    let promptAdvElem = null;
    if (showPrompt && calcAuthUserIsLoggedIn()?.isInternal === true) {
      promptAdvElem = (
        <ModalConfirm
          width={1100}
          title={
            <Provider store={Utils.globalStore()}>
              <div className={'useDark'}>
                <PromptAdv projectId={projectId} featureGroupId={featureGroupId} isFeatureGroup={this.props.isFeatureGroup} datasetId={datasetId} />
              </div>
            </Provider>
          }
          okText={'Close'}
          cancelText={null}
          okType={'primary'}
        >
          <Button type={'primary'} size={'small'} ghost>
            Advanced
          </Button>
        </ModalConfirm>
      );
    }

    let isShadowFGIsDocumentset = false;
    if (this.props.isFeatureGroup) {
      if (!Utils.isNullOrEmpty(featureGroupOne?.datasetId)) {
        if (datasetOne?.get('isDocumentset') === true) {
          isShadowFGIsDocumentset = true;
          if (docStoreDef == null) {
            docStoreDef = DocStoreDefForcedVision;
          }
        }
      }
    }

    let colsImagesNames = null;
    let rowIdCol = null;
    if (this.props.isFeatureGroup) {
      let featureGroupId = this.calcFeatureGroupId();
      let featureGroupOne = this.memFeatureGroupsOne(false)(this.calcProjectId(), featureGroupId, this.props.featureGroups);
      colsImagesNames = this.memFilterIMAGECols(featureGroupOne, docStoreDef);
      rowIdCol = this.memRowIdCol(featureGroupOne, docStoreDef);
    }
    const isProcessingOrError = snapshotRefreshingError || [FeatureGroupVersionLifecycle.FAILED, FeatureGroupVersionLifecycle.CANCELLED].includes(showNeedSnapshotMsgTitle?.toUpperCase?.());
    rowsCount = isProcessingOrError ? 0 : Math.max(rowsCount - 1, 0);
    const featureGroupVersionId = this.calcFeatureGroupVersion();
    const onChartCollapse = () => this.setState({ isChartsExpanded: false });
    const onChartExpand = () => this.setState({ isChartsExpanded: true });

    return (
      <div style={{ margin: '0 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <EditorElemPreview.Provider value={this.state.previewRef}>
          <AutoSizer ref={'sizer'}>
            {({ width, height }) => (
              <div style={{ height: height + 'px', width: width + 'px' }}>
                {isRefreshing === true && (
                  <div style={{ textAlign: 'center', margin: '40px auto', fontSize: '12px', color: Utils.colorA(0.7) }}>
                    <FontAwesomeIcon icon={'sync'} transform={{ size: 15 }} spin style={{ marginRight: '8px', opacity: 0.8 }} />
                    Retrieving Dataset Details...
                  </div>
                )}

                {isRefreshing !== true && (
                  <div style={{ padding: '25px 30px', position: 'relative' }}>
                    {featureGroupOne?.latestVersionOutdated && !this.state.materializeIsRefreshing && (
                      <div className={styles.bannerContainer}>
                        There is a new dataset version available. Materialize this feature group to update the feature group with the latest data.
                        <ModalConfirm
                          onClick={this.onClickCreateNewVersionOnClick}
                          onConfirm={this.onClickCreateNewVersion}
                          title={`Do you want to create a new version?`}
                          icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                          okText={'Create'}
                          cancelText={'Cancel'}
                          okType={'primary'}
                        >
                          <Button style={{ margin: '0 8px' }} type={'primary'}>
                            Materialize Latest Version
                          </Button>
                        </ModalConfirm>
                      </div>
                    )}
                    <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH, display: 'flex' }}>
                      <span style={{ whiteSpace: 'nowrap', fontWeight: 400 }}>
                        <span>
                          {this.props.isFeatureGroup ? 'Materialized Data' : 'Raw Data'}
                          <HelpIcon id={'rawdata_title' + (this.props.isFeatureGroup ? '_mater' : '_raw')} style={{ marginLeft: '4px' }} />
                          &nbsp;&nbsp;
                        </span>
                        {!batchPredId && (
                          <span
                            style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', display: 'inline-block', fontSize: '12px' }}
                            css={`
                              width: 280px;
                              @media (max-width: 1500px) {
                                width: 200px;
                              }
                            `}
                          >
                            <SelectExt isDisabled={projectIsNone} value={datasetSelectValue} options={optionsDatasets} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                          </span>
                        )}

                        {!batchPredId && (
                          <span
                            css={`
                              & .textVersion {
                                display: inline-block;
                              }
                              width: 160px;
                              @media (max-width: 1540px) {
                                & .textVersion {
                                  display: none;
                                }
                              }
                              @media (min-width: 1450px) {
                                width: 200px;
                              }
                              @media (min-width: 1650px) {
                                width: 330px;
                              }
                            `}
                            style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', display: 'inline-block', fontSize: '12px' }}
                          >
                            <SelectExt value={fgVersionSelectValue} options={optionsFgVersion ?? []} onChange={this.onChangeSelectURLDirectFromValueFGVersion} menuPortalTarget={popupContainerForMenu(null)} />
                          </span>
                        )}

                        {showRowsCount && (
                          <span style={{ marginLeft: '20px', marginRight: '20px' }} className={classNames(styles.tagItem, !rowsCount && styles.errorItem)}>
                            <span>
                              <span
                                css={`
                                  @media screen and (max-width: 1550px) {
                                    display: none;
                                  }
                                `}
                              >
                                Number of{' '}
                              </span>
                              Rows{(this.state.filterValues?.length ?? 0) === 0 ? '' : ' Filtered'}:{' '}
                              <b>
                                <NumberPretty>{rowsCount}</NumberPretty>
                              </b>
                            </span>
                          </span>
                        )}
                        {docStoreDef?.allowRawDataNumberOfColumns !== false && !isNlp && (
                          <span
                            className={styles.tagItem}
                            css={`
                              ${showRowsCount ? '' : 'margin-left: 20px;'}
                            `}
                          >
                            <span
                              css={`
                                @media screen and (max-width: 1550px) {
                                  display: none;
                                }
                              `}
                            >
                              Number of{' '}
                            </span>
                            Columns: <b>{columnsCount}</b>
                          </span>
                        )}
                      </span>
                      <span style={{ flex: 1 }}></span>
                      {this.props.isFeatureGroup && allowDownloadAllDisplayedData && (
                        <span>
                          <Button
                            onClick={this.doDownloadRawData}
                            css={`
                              margin-top: 5px;
                              margin-left: 10px;
                              font-size: 10px;
                              line-height: 1.2;
                            `}
                            type={'default'}
                            ghost
                          >
                            Download All
                            <br />
                            Displayed Data
                          </Button>
                          <HelpIcon id={'rawdata_download_all_data'} style={{ marginLeft: '4px' }} />
                        </span>
                      )}
                    </div>

                    {useSampleData && (
                      <div
                        css={`
                          margin-left: 5px;
                        `}
                      >
                        <Checkbox
                          checked={this.state.sampleShowFilters}
                          onChange={(e) => {
                            this.setState({ sampleShowFilters: e.target.checked });
                          }}
                        >
                          <span
                            css={`
                              color: white;
                            `}
                          >
                            Show Filters
                          </span>
                        </Checkbox>
                      </div>
                    )}

                    {docStoreDef?.calcSqlForFilter != null && docStoreDef?.type !== DocStoreType.vision && (
                      <div
                        css={`
                          display: flex;
                          align-items: center;
                        `}
                      >
                        <span
                          css={`
                            margin-right: 7px;
                            font-size: 15px;
                          `}
                        >
                          Filter:
                        </span>
                        <span style={{ width: '280px', display: 'inline-block', verticalAlign: 'top' }}>
                          <Input
                            style={{ verticalAlign: 'top', marginTop: '4px' }}
                            placeholder={'Filter labels'}
                            value={this.state.docSqlFilter ?? ''}
                            onChange={(e) => {
                              this.setState({ docSqlFilter: e.target.value });
                            }}
                            onKeyDown={this.onKeyDownFilterTextDoc}
                          />
                        </span>
                        <Button className={sd.detailbuttonblueBorder} ghost style={{ verticalAlign: 'top', marginTop: '1px', height: '30px', marginLeft: '5px' }} type={'primary'} onClick={this.onClickFilterTextDoc}>
                          Go
                        </Button>
                        <Button className={sd.detailbuttonblueBorder} ghost style={{ verticalAlign: 'top', marginTop: '1px', height: '30px', marginLeft: '5px' }} type={'primary'} onClick={this.onClickFilterTextClearDoc}>
                          Clear
                        </Button>
                      </div>
                    )}

                    {(showVisualData || showSqlFilter) && (
                      <div
                        css={`
                          height: ${topVisualRawData}px;
                          padding-top: 3px;
                          display: flex;
                          align-items: center;
                        `}
                      >
                        {showPrompt && (
                          <span>
                            <span
                              className={sd.styleTextBlueBright}
                              css={`
                                cursor: pointer;
                              `}
                              onClick={this.onClickShowSqlFilter.bind(this, false)}
                            >
                              <span
                                css={`
                                  width: 16px;
                                  display: inline-block;
                                  text-align: center;
                                  margin-right: 4px;
                                `}
                              >
                                {!this.state.isUseFilterSqlPrompt && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCaretRight').faCaretRight} transform={{ size: 20, x: 0, y: 0 }} />}
                                {this.state.isUseFilterSqlPrompt && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCaretDown').faCaretDown} transform={{ size: 20, x: 0, y: 0 }} />}
                              </span>
                              <span>Text Interface</span>
                              <span
                                css={`
                                  margin-left: 5px;
                                `}
                              >
                                <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faBrainCircuit').faBrainCircuit} transform={{ size: 18, x: 0, y: 0 }} />
                              </span>
                            </span>
                            <HelpIcon id={'rawdata_text_interface'} style={{ marginLeft: '4px' }} />
                          </span>
                        )}
                        {showSqlFilter && showPrompt && (
                          <span
                            css={`
                              margin: 0 10px;
                            `}
                            className={sd.styleTextBlueBright}
                          >
                            &nbsp;
                          </span>
                        )}
                        {showSqlFilter && (
                          <span>
                            <span
                              className={sd.styleTextBlueBright}
                              css={`
                                cursor: pointer;
                              `}
                              onClick={this.onClickShowSqlFilter.bind(this, true)}
                            >
                              <span
                                css={`
                                  width: 16px;
                                  display: inline-block;
                                  text-align: center;
                                  margin-right: 4px;
                                `}
                              >
                                {!this.state.isUseFilterSql && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCaretRight').faCaretRight} transform={{ size: 20, x: 0, y: 0 }} />}
                                {this.state.isUseFilterSql && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCaretDown').faCaretDown} transform={{ size: 20, x: 0, y: 0 }} />}
                              </span>
                              Run SQL on {this.props.isFeatureGroup ? 'Materialized Data' : 'Raw Data'}
                            </span>
                            <HelpIcon id={'rawdata_run_sql_on_materialized_data'} style={{ marginLeft: '4px' }} />
                          </span>
                        )}
                        {promptAdvElem != null && (
                          <span
                            css={`
                              margin-left: 15px;
                            `}
                          >
                            {promptAdvElem}
                          </span>
                        )}

                        <span
                          css={`
                            flex: 1;
                          `}
                        ></span>
                        {showVisualData && (
                          <Link to={['/' + PartsLink.rawdata_visual + '/' + projectId, 'datasetId=' + encodeURIComponent(datasetId ?? '')]}>
                            <Button
                              css={`
                                padding: 0 20px;
                              `}
                              size={'small'}
                              type={'primary'}
                            >
                              Visual Data
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}

                    {(showVisualData || showSqlFilter) && (this.state.isUseFilterSql || this.state.isUseFilterSqlPrompt) && (
                      <AutoSizer disableHeight>
                        {({ width }) => {
                          let wwOne = width;
                          if (showPrompt && this.state.isUseFilterSql && this.state.isUseFilterSqlPrompt) {
                            wwOne = ((width ?? 0) - 18 * 2) / 2 - 15;
                          }
                          return (
                            <div
                              css={`
                                width: ${width}px;
                              `}
                            >
                              {showPrompt && (
                                <div
                                  css={`
                                    text-align: center;
                                    margin-bottom: 8px;
                                  `}
                                >
                                  <div
                                    css={`
                                      font-size: 15px;
                                    `}
                                  >
                                    {this.state.isUseFilterSqlPrompt ? 'Text to SQL Query Generator' : <span>&nbsp;</span>}
                                  </div>
                                  <div
                                    css={`
                                      margin-top: 4px;
                                      font-size: 12px;
                                    `}
                                  >
                                    {this.state.isUseFilterSqlPrompt ? 'Use this widget to generate sql queries and explore the feature groups' : <span>&nbsp;</span>}
                                  </div>
                                </div>
                              )}
                              <div
                                css={`
                                  width: ${width}px;
                                  height: ${topFiltersHH - 50}px;
                                  padding: 18px;
                                  display: flex;
                                  align-items: stretch;
                                  gap: 15px;
                                `}
                                className={sd.grayPanel}
                              >
                                {showPrompt && this.state.isUseFilterSqlPrompt && (
                                  <div
                                    css={`
                                      flex: 1;
                                      width: ${wwOne}px;
                                    `}
                                  >
                                    <div
                                      css={`
                                        position: relative;
                                        height: ${topFiltersHH - topFiltersHHextras - 50 - 50 - 60 - 50}px;
                                        width: 100%;
                                      `}
                                    >
                                      <div
                                        css={`
                                          text-transform: uppercase;
                                          font-family: Roboto;
                                          font-size: 12px;
                                          font-weight: bold;
                                          letter-spacing: 1.12px;
                                          color: #ffffff;
                                          margin-bottom: 5px;
                                        `}
                                      >
                                        <span>INPUT TEXT BELOW</span>
                                        {_.trim(this.state.promptBounce || '') !== '' && (
                                          <span
                                            css={`
                                              margin-left: 10px;
                                            `}
                                            onClick={this.onClickClearPrompt}
                                          >
                                            <TooltipExt title={'Clear Text'}>
                                              <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faXmarkCircle').faXmarkCircle} transform={{ size: 17, x: 0, y: 0 }} />
                                            </TooltipExt>
                                          </span>
                                        )}
                                      </div>
                                      <div
                                        css={`
                                          position: relative;
                                          height: ${topFiltersHH - topFiltersHHextras - 50 - 50 - 15}px;
                                          width: 100%;
                                        `}
                                      >
                                        {
                                          <EditorElemForFeatureGroup
                                            lang={'plaintext'}
                                            hideErrors
                                            backTrasnparent
                                            hideExpandFull
                                            onlyThisFeatureGroup
                                            projectId={projectId}
                                            featureGroupId={featureGroupId}
                                            /*showSmallHelp sample={'sample to be defined 123'}*/ height={topFiltersHH - topFiltersHHextras - 50 - 60 - 15}
                                            value={this.state.promptBounce}
                                            onChange={this.onChangeSqlPrompt}
                                          />
                                        }
                                      </div>
                                      <div
                                        css={`
                                          display: flex;
                                          margin-top: 20px;
                                        `}
                                      >
                                        <div
                                          css={`
                                            flex: 1;
                                            font-size: 14px;
                                            color: #5b6d85;
                                            line-height: 1.7;
                                          `}
                                        >
                                          <div>(Press Ctrl+Space to autocomplete name of columns)</div>
                                        </div>
                                        <div>
                                          <Button disabled={this.state.promptProcessing === true || _.trim(this.state.promptBounce || '') === ''} type={'primary'} style={{ width: '100%' }} onClick={this.onClickUsePrompt}>
                                            <span>Generate SQL</span>
                                            <span
                                              css={`
                                                margin-left: 5px;
                                              `}
                                            >
                                              <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faAngleRight').faAngleRight} transform={{ size: 15, x: 0, y: 0 }} />
                                            </span>
                                            {this.state.promptProcessing === true && (
                                              <span
                                                css={`
                                                  margin-left: 10px;
                                                `}
                                              >
                                                <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} transform={{ size: 15, x: 0, y: 0 }} spin />
                                              </span>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                      {/*{showTopNum!=null && <div css={`font-family: Matter; text-align: center; font-size: 14px; margin-top: 10px;`}>*/}
                                      {/*  Showing Top {showTopNum}*/}
                                      {/*</div>}*/}
                                    </div>
                                  </div>
                                )}
                                {this.state.isUseFilterSql && (
                                  <div
                                    css={`
                                      flex: 1;
                                      width: ${wwOne}px;
                                    `}
                                  >
                                    <div
                                      css={`
                                        position: relative;
                                        height: ${topFiltersHH - topFiltersHHextras - 50 - 50 - 60 - 50}px;
                                        width: 100%;
                                      `}
                                    >
                                      <div
                                        css={`
                                          text-transform: uppercase;
                                          font-family: Roboto;
                                          font-size: 12px;
                                          font-weight: bold;
                                          letter-spacing: 1.12px;
                                          color: #ffffff;
                                          margin-bottom: 5px;
                                        `}
                                      >
                                        <span>{this.state.isUseFilterSqlPrompt ? 'Generated SQL'.toUpperCase() : <span>Run SQL</span>}</span>
                                        {_.trim(this.state.filterSqlBounce || '') !== '' && (
                                          <span
                                            css={`
                                              margin-left: 10px;
                                            `}
                                            onClick={this.onClickClearSQL}
                                          >
                                            <TooltipExt title={'Clear SQL'}>
                                              <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faXmarkCircle').faXmarkCircle} transform={{ size: 17, x: 0, y: 0 }} />
                                            </TooltipExt>
                                          </span>
                                        )}
                                      </div>
                                      <div
                                        css={`
                                          position: relative;
                                          height: ${topFiltersHH - topFiltersHHextras - 50 - 50 - 15}px;
                                          width: 100%;
                                        `}
                                      >
                                        {!this.props.isFeatureGroup && (
                                          <EditorElemForDataset
                                            hideErrors
                                            backTrasnparent
                                            hideExpandFull={false}
                                            projectId={projectId}
                                            datasetId={datasetId}
                                            /*showSmallHelp sample={'select * from fg (use "fg" as "this feature group")'}*/ height={topFiltersHH - topFiltersHHextras - 50 - 60 - 15}
                                            value={this.state.filterSqlBounce}
                                            onChange={this.onChangeSqlFilter}
                                          />
                                        )}
                                        {this.props.isFeatureGroup && (
                                          <EditorElemForFeatureGroup
                                            featureGroupVersionId={featureGroupVersionId}
                                            backTrasnparent
                                            hideExpandFull={false}
                                            onlyThisFeatureGroup
                                            projectId={projectId}
                                            featureGroupId={featureGroupId}
                                            /*showSmallHelp sample={'select * from fg (use "fg" as "this feature group")'}*/ height={topFiltersHH - topFiltersHHextras - 50 - 60 - 15}
                                            value={this.state.filterSqlBounce}
                                            onChange={this.onChangeSqlFilter}
                                          />
                                        )}
                                      </div>
                                      <div
                                        css={`
                                          display: flex;
                                          margin-top: 20px;
                                        `}
                                      >
                                        <div
                                          css={`
                                            flex: 1;
                                            font-size: 14px;
                                            color: #5b6d85;
                                            line-height: 1.7;
                                          `}
                                        >
                                          <div>Example: select * from fg (use "fg" as "this feature group")</div>
                                          <div>(Press Ctrl+Space to autocomplete name of columns)</div>
                                        </div>
                                        <div>
                                          <Button disabled={_.trim(this.state.filterSqlBounce || '') === ''} type={'primary'} style={{ width: '100%' }} onClick={this.onClickUseFilterSqlRun}>
                                            Run
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div
                                css={`
                                  height: ${topFiltersHHextras}px;
                                `}
                              >
                                {showTopNum != null && (
                                  <div
                                    css={`
                                      font-family: Matter;
                                      text-align: center;
                                      font-size: 14px;
                                      margin-top: 10px;
                                    `}
                                  >
                                    Showing Top {showTopNum}
                                  </div>
                                )}

                                {showFiltersColumns && (
                                  <div
                                    css={`
                                      margin-top: 20px;
                                      display: flex;
                                    `}
                                  >
                                    <span css={``}>
                                      <FilterByColumns
                                        hideNonIgnoredColumns={projectId == null}
                                        showPrioritizeFeatureMappedColumns={projectId != null}
                                        countIncludeAll
                                        onChange={this.onChangeSelectedColumns}
                                        columnsList={columnsListFilter}
                                        hideCount={true || !this.props.isFeatureGroup}
                                      />
                                    </span>
                                    <span
                                      css={`
                                        margin-left: 10px;
                                      `}
                                    >
                                      {showFilters && !this.state.isUseFilterSql && !useSampleData && (
                                        <span>
                                          <Button
                                            onClick={this.onClickClearAllFilters}
                                            type={'primary'}
                                            css={`
                                              border: none;
                                              color: white !important;
                                              margin-left: 10px;
                                            `}
                                          >
                                            Clear All Searches
                                          </Button>
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                )}

                                {showCustomDS ? (
                                  <div
                                    css={`
                                      margin-top: 17px;
                                      margin-bottom: 11px;
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                    `}
                                  >
                                    <DataserverControlEditor />
                                  </div>
                                ) : null}
                                {showCDSMsg && (
                                  <div
                                    css={`
                                      margin-top: 8px;
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                      font-size: 15px;
                                      color: #d5d50b;
                                    `}
                                  >
                                    {showCDSMsgText}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }}
                      </AutoSizer>
                    )}

                    {!this.state.isUseFilterSql && !this.state.isUseFilterSqlPrompt && showFilters && (
                      <div
                        css={`
                          height: ${topFiltersHH}px;
                          padding-top: 10px;
                        `}
                      >
                        <div
                          css={`
                            margin-bottom: 5px;
                            font-family: 'Matter';
                            font-size: 16px;
                            font-weight: bold;
                            line-height: 1.38;
                            color: #d1e4f5;
                          `}
                        >
                          Attribute Search
                        </div>
                        <div
                          css={`
                            padding: 8px;
                            border: solid 1px #686868;
                            position: relative;
                            height: ${topFiltersHH - 50}px;
                          `}
                        >
                          {renderFilters == null && (
                            <div
                              css={`
                                font-size: 14px;
                                opacity: 0.8;
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: ${topFiltersHH - topFiltersHHColumns - 50 - 4}px;
                              `}
                            >
                              Click on the filter next to each column and search for a value
                            </div>
                          )}
                          <NanoScroller onlyVertical>
                            <div>{renderFilters}</div>
                          </NanoScroller>
                        </div>
                      </div>
                    )}

                    {isDocStoreRender && (
                      <div
                        css={`
                          height: ${spaceTopFilterAndCustomDS - topFiltersHHextraUsed - topFiltersHH - topVisualRawData}px;
                          padding-top: 10px;
                        `}
                      >
                        <span>Filter by Document ID:</span>
                        <span
                          css={`
                            margin-left: 10px;
                            width: 200px;
                            display: inline-block;
                          `}
                        >
                          <Input
                            value={this.state.docIdFilter ?? ''}
                            onChange={(e) => {
                              this.onChangeDocIdFilter(e.target.value, colIMAGE);
                            }}
                            allowClear={true}
                          />
                        </span>
                      </div>
                    )}

                    {!isDocStoreRender && !this.state.isUseFilterSql && !this.state.isUseFilterSqlPrompt && datasetError == null && (
                      <div
                        css={`
                          height: ${spaceTopFilterAndCustomDS}px;
                          padding-top: 10px;
                        `}
                      >
                        {showFiltersColumns && (
                          <div
                            css={`
                              margin-top: 20px;
                              display: flex;
                            `}
                          >
                            <span>
                              <FilterByColumns
                                hideNonIgnoredColumns={projectId == null}
                                showPrioritizeFeatureMappedColumns={projectId != null}
                                countIncludeAll
                                onChange={this.onChangeSelectedColumns}
                                columnsList={columnsListFilter}
                                hideCount={true || !this.props.isFeatureGroup}
                              />
                            </span>
                            <span
                              css={`
                                margin-left: 10px;
                              `}
                            >
                              {showFilters && !this.state.isUseFilterSql && !useSampleData && (
                                <span>
                                  <Button
                                    onClick={this.onClickClearAllFilters}
                                    type={'primary'}
                                    css={`
                                      border: none;
                                      color: white !important;
                                      margin-left: 10px;
                                    `}
                                  >
                                    Clear All Searches
                                  </Button>
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {showCustomDS ? (
                          <div
                            css={`
                              margin-top: 17px;
                              margin-bottom: 11px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                            `}
                          >
                            <DataserverControlEditor />
                          </div>
                        ) : null}
                        {showCDSMsg && (
                          <div
                            css={`
                              margin-top: 8px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              font-size: 15px;
                              color: #d5d50b;
                            `}
                          >
                            {showCDSMsgText}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={sd.table}
                      style={{
                        position: 'relative',
                        textAlign: 'left',
                        borderTop: '1px solid ' + Constants.lineColor(),
                        height: height - topAfterHeaderHH - 50 - topFiltersHH - topFiltersHHextraUsed - topVisualRawData - spaceTopFilterAndCustomDS + 'px',
                      }}
                    >
                      {showCharts && (
                        <div style={{ position: 'absolute', top: 0, width: colChartsWW + 'px', bottom: '-1px', right: detailWW + 'px', textAlign: 'left', borderLeft: '1px solid ' + Constants.lineColor() }}>
                          <RefreshAndProgress isRefreshing={defDatasets && defDatasets.get('isRefreshing')} errorMsg={calcChartsByDatasetIdError(undefined, datasetId, projectId)}>
                            <div className={classNames(styles.collapsableColumnHeader)}>
                              <Button type="primary" size="small" className={styles.collapseButton} onClick={() => this.setState({ isChartsExpanded: !this.state.isChartsExpanded })}>
                                {this.state.isChartsExpanded ? <RightOutlined className={styles.collapseIcon} /> : <LeftOutlined className={styles.collapseIcon} />}
                              </Button>
                              {this.state.isChartsExpanded && <b>Charts</b>}
                            </div>
                            {
                              <div className={classNames(sd.hideScrollbar, styles.collapsableColumnBody, !this.state.isChartsExpanded && styles.collapsed)} ref={'chartsDiv'} onScroll={this.onScrollCharts}>
                                <div style={{ height: rowCountForTable * cellHH + 'px' }}>{chartsList}</div>
                              </div>
                            }
                          </RefreshAndProgress>
                        </div>
                      )}

                      <div
                        css={`
                          & .sortIcon {
                            opacity: 0.33;
                          }
                          [role='rowgroup']:hover .sortIcon {
                            opacity: 0;
                          }
                        `}
                        onMouseLeave={this.onRowMouseLeave}
                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: colChartsWW + detailWW + 'px' }}
                      >
                        <RefreshAndProgress
                          msgTop={isUnmaterFG === true || showNeedSnapshotMsgTitle || this.state.isDocumentsLoading || this.state.lastDataErrorMsg || this.state.dataCount === 0 ? '10%' : null}
                          isMsgAnimRefresh={snapshotRefreshing || this.state.isDocumentsLoading ? true : null}
                          msgMsg={isUnmaterFG === true ? 'Not Materialized' : this.state.dataCount === 0 ? 'No Data' : snapshotRefreshing || this.state.isDocumentsLoading ? 'Processing...' : showNeedSnapshotMsgTitle}
                          msgButtonText={isUnmaterFG === true ? 'Materialize Feature Group' : snapshotRefreshing || this.state.isDocumentsLoading ? null : showNeedSnapshotMsg}
                          onClickMsgButton={isUnmaterFG === true ? onClickMaterFG : showNeedSnapshotMsgOnClick}
                          isRefreshing={false && /*(snapshotRefreshing ? null : (defDatasets?.get('isRefreshing') || */ this.state.isRefreshFiltering /*)*/}
                          errorMsg={snapshotRefreshingError ?? this.state.lastDataErrorMsg ?? calcFileDataUseByDatasetIdProjectIdError(undefined, datasetId, projectId)}
                          showTitle={!this.state.lastDataErrorMsg && !snapshotRefreshing}
                          isDim={isUnmaterFG === true || this.state.isDocumentsLoading || this.state.dataCount === 0}
                        >
                          {isDocStoreRender && (
                            <>
                              {docStoreGridOptionsElem}
                              {this.memDocStoreRawDataRender(
                                docStoreDef,
                                width - colChartsWW - detailWW - 2 * 30,
                                height - topAfterHeaderHH - 50 - topFiltersHH - topFiltersHHextraUsed - topVisualRawData - spaceTopFilterAndCustomDS - (docStoreGridOptionsElem == null ? 0 : docStoreGridOptionsElemHH),
                                this.state.docIdFilter ? this.state.docIdFilteredData : this.state.docData,
                                this.state.docNoMore,
                                this.state.docStoreIsGrid,
                                colsRenderDocStore,
                              )}
                            </>
                          )}
                          {!showNeedSnapshot && isNlp && !isDocStoreRender && (
                            // @ts-ignore
                            <SplitPane split={'vertical'} minSize={200} defaultSize={340} primary={'second'}>
                              <div
                                css={`
                                  position: absolute;
                                  top: 0;
                                  left: 0;
                                  right: 5px;
                                  bottom: 0;
                                `}
                              >
                                <TableExt
                                  ref={(r1) => {
                                    this.refNlpTable = r1;
                                  }}
                                  width={width - colChartsWW - detailWW - 2 * 30}
                                  disableSort
                                  remoteRowCount={(this.state.nlpData?.length ?? 0) + (this.state.nlpNoMore ? 0 : 1)}
                                  onNeedMore={this.nlpOnNeedMore}
                                  onClickCell={this.nlpRowOnClickCell}
                                  calcIsSelected={this.nlpRowIsSelected}
                                  autoHeight
                                  height={height - topAfterHeaderHH - 50 - topFiltersHH - topFiltersHHextraUsed - topVisualRawData - spaceTopFilterAndCustomDS}
                                  isVirtual
                                  columns={nlpColumnsList}
                                  dataSource={this.state.nlpData}
                                />
                              </div>
                              <div
                                css={`
                                  position: absolute;
                                  top: 0;
                                  right: 0;
                                  left: 5px;
                                  bottom: 0;
                                `}
                              >
                                <NLPEntitiesColorsList dataAll={this.state.nlpData} onColorsCalc={this.nlpOnColorsCalc} data={this.state.nlpData?.[this.state.nlpRowSelIndex]} calcColor={nlpCalcColorToken} showHeader />
                              </div>
                            </SplitPane>
                          )}
                          {datasetError}
                          {datasetError == null && isUnmaterFG !== true && !isDocStoreRender && sampleGrid?.(height - topAfterHeaderHH - 50 - topFiltersHH - topFiltersHHextraUsed - topVisualRawData - spaceTopFilterAndCustomDS)}
                          {canShowGridOne && (
                            <MultiGrid
                              ref={'gridRef'}
                              cellRenderer={this.cellRenderer.bind(
                                this,
                                isShadowFGIsDocumentset,
                                docStoreDef,
                                colsImagesNames,
                                rowIdCol,
                                showDetail1,
                                disableFilters,
                                showCustomDS,
                                showFilters,
                                columnsCount,
                                useSampleData ? this.state.sampleData : null,
                                sampleColumnsUsed,
                                isUnmaterFG,
                              )}
                              onSectionRendered={this.gridOnSectionRendered}
                              scrollToColumn={this.state.scrollToColumn}
                              scrollToRow={this.state.scrollToRow}
                              className={styles.gridAfter}
                              classNameTopRightGrid={sd.hideScrollbar}
                              classNameTopLeftGrid={sd.hideScrollbar}
                              classNameBottomLeftGrid={sd.hideScrollbar}
                              classNameBottomRightGrid={sd.hideScrollbarY}
                              enableFixedColumnScroll
                              enableFixedRowScroll
                              hideTopRightGridScrollbar
                              hideBottomLeftGridScrollbar
                              onScroll={this.gridOnScroll}
                              fixedRowCount={1}
                              fixedColumnCount={1}
                              overscanRowCount={40}
                              overscanColumnCount={5}
                              scrollTop={this.state.scrollTopGrid}
                              style={STYLE}
                              styleBottomLeftGrid={STYLE_BOTTOM_LEFT_GRID}
                              styleTopLeftGrid={STYLE_TOP_LEFT_GRID}
                              styleTopRightGrid={STYLE_TOP_RIGHT_GRID}
                              styleBottomRightGrid={STYLE_BOTTOM_RIGHT_GRID}
                              columnCount={columnsCount + 1}
                              columnWidth={this.gridColumnWidth}
                              height={height - topAfterHeaderHH - 50 - topFiltersHH - topFiltersHHextraUsed - topVisualRawData - spaceTopFilterAndCustomDS}
                              rowCount={rowCountForTable}
                              rowHeight={cellHH}
                              width={width - colChartsWW - detailWW - 2 * 30}
                            />
                          )}
                        </RefreshAndProgress>
                      </div>

                      {showDetail1 && (
                        <div style={{ position: 'absolute', top: 0, width: detailWW + 'px', bottom: 0, right: 0 + 'px', borderLeft: '1px solid ' + Utils.colorA(0.2), borderRight: '1px solid ' + borderAAA }}>
                          <div style={STYLE_DETAIL_HEADER}>
                            <span>Detail Row: {this.state.selectedRowIndex}</span>
                            <span
                              css={`
                                margin-left: 15px;
                              `}
                            >
                              <Radio.Group value={this.state.detailTypeIsList ?? true} onChange={this.onChangeDetailTypeIsList}>
                                <Radio value={true}>
                                  <span
                                    css={`
                                      color: white;
                                    `}
                                  >
                                    List
                                  </span>
                                </Radio>
                                <Radio value={false}>
                                  <span
                                    css={`
                                      color: white;
                                    `}
                                  >
                                    JSON
                                  </span>
                                </Radio>
                              </Radio.Group>
                            </span>
                          </div>
                          <div style={{ position: 'absolute', top: cellHH + 'px', left: '15px', bottom: 0, right: '15px' }}>
                            {(this.state.detailTypeIsList ?? true) === true && (
                              <NanoScroller
                                onlyVertical
                                ref={(r1) => {
                                  this.valuesNano = r1;
                                }}
                              >
                                <div>{renderSelRow}</div>
                              </NanoScroller>
                            )}
                            {!(this.state.detailTypeIsList ?? true) && (
                              <AutoSizer disableWidth>
                                {({ height }) => {
                                  return <EditorElem hideExpandFull value={valueJsonStringDetail} lang={'json'} readonly height={height} />;
                                }}
                              </AutoSizer>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </AutoSizer>
        </EditorElemPreview.Provider>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    defDatasets: state.defDatasets,
    datasets: state.datasets,
    projectDatasets: state.projectDatasets,
    featureGroups: state.featureGroups,
    customds: state.customds,
  }),
  null,
)(ProjectRawDataOne);
